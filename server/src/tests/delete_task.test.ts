import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq, asc } from 'drizzle-orm';

// Helper function to create test tasks
const createTestTask = async (title: string, orderPosition: number, themeColor = 'blue') => {
  const result = await db.insert(tasksTable)
    .values({
      title,
      description: `Description for ${title}`,
      is_completed: false,
      order_position: orderPosition,
      theme_color: themeColor
    })
    .returning()
    .execute();
  return result[0];
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a task successfully', async () => {
    // Create test task
    const task = await createTestTask('Task to Delete', 1);
    
    const deleteInput: DeleteTaskInput = {
      id: task.id
    };

    const result = await deleteTask(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify task is deleted from database
    const deletedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(deletedTask).toHaveLength(0);
  });

  it('should reorder remaining tasks after deletion', async () => {
    // Create multiple test tasks with specific order positions
    const task1 = await createTestTask('Task 1', 1, 'red');
    const task2 = await createTestTask('Task 2', 2, 'green');
    const task3 = await createTestTask('Task 3', 3, 'yellow');
    const task4 = await createTestTask('Task 4', 4, 'purple');

    // Delete the middle task (position 2)
    const deleteInput: DeleteTaskInput = {
      id: task2.id
    };

    await deleteTask(deleteInput);

    // Get remaining tasks ordered by position
    const remainingTasks = await db.select()
      .from(tasksTable)
      .orderBy(asc(tasksTable.order_position))
      .execute();

    // Should have 3 tasks remaining
    expect(remainingTasks).toHaveLength(3);

    // Verify positions are reordered correctly (no gaps)
    expect(remainingTasks[0].title).toBe('Task 1');
    expect(remainingTasks[0].order_position).toBe(1);
    
    expect(remainingTasks[1].title).toBe('Task 3');
    expect(remainingTasks[1].order_position).toBe(2); // Was 3, now 2
    
    expect(remainingTasks[2].title).toBe('Task 4');
    expect(remainingTasks[2].order_position).toBe(3); // Was 4, now 3
  });

  it('should reorder correctly when deleting first task', async () => {
    // Create test tasks
    const task1 = await createTestTask('First Task', 1);
    const task2 = await createTestTask('Second Task', 2);
    const task3 = await createTestTask('Third Task', 3);

    // Delete first task
    const deleteInput: DeleteTaskInput = {
      id: task1.id
    };

    await deleteTask(deleteInput);

    // Get remaining tasks
    const remainingTasks = await db.select()
      .from(tasksTable)
      .orderBy(asc(tasksTable.order_position))
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    // Verify positions are reordered
    expect(remainingTasks[0].title).toBe('Second Task');
    expect(remainingTasks[0].order_position).toBe(1); // Was 2, now 1
    
    expect(remainingTasks[1].title).toBe('Third Task');
    expect(remainingTasks[1].order_position).toBe(2); // Was 3, now 2
  });

  it('should reorder correctly when deleting last task', async () => {
    // Create test tasks
    const task1 = await createTestTask('First Task', 1);
    const task2 = await createTestTask('Second Task', 2);
    const task3 = await createTestTask('Last Task', 3);

    // Delete last task
    const deleteInput: DeleteTaskInput = {
      id: task3.id
    };

    await deleteTask(deleteInput);

    // Get remaining tasks
    const remainingTasks = await db.select()
      .from(tasksTable)
      .orderBy(asc(tasksTable.order_position))
      .execute();

    expect(remainingTasks).toHaveLength(2);
    
    // Verify positions remain unchanged (no higher positions to reorder)
    expect(remainingTasks[0].title).toBe('First Task');
    expect(remainingTasks[0].order_position).toBe(1);
    
    expect(remainingTasks[1].title).toBe('Second Task');
    expect(remainingTasks[1].order_position).toBe(2);
  });

  it('should update updated_at timestamp for reordered tasks', async () => {
    // Create test tasks
    const task1 = await createTestTask('Task 1', 1);
    const task2 = await createTestTask('Task 2', 2);
    const task3 = await createTestTask('Task 3', 3);

    // Store original timestamps
    const originalTimestamps = await db.select({
      id: tasksTable.id,
      updated_at: tasksTable.updated_at
    })
      .from(tasksTable)
      .execute();

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    // Delete first task
    await deleteTask({ id: task1.id });

    // Get updated timestamps
    const updatedTasks = await db.select({
      id: tasksTable.id,
      updated_at: tasksTable.updated_at
    })
      .from(tasksTable)
      .execute();

    // Find the reordered tasks (task2 and task3)
    const updatedTask2 = updatedTasks.find(t => t.id === task2.id);
    const updatedTask3 = updatedTasks.find(t => t.id === task3.id);

    const originalTask2 = originalTimestamps.find(t => t.id === task2.id);
    const originalTask3 = originalTimestamps.find(t => t.id === task3.id);

    // Verify updated_at timestamps were updated for reordered tasks
    expect(updatedTask2?.updated_at).toBeInstanceOf(Date);
    expect(updatedTask3?.updated_at).toBeInstanceOf(Date);
    expect(updatedTask2?.updated_at.getTime()).toBeGreaterThan(originalTask2!.updated_at.getTime());
    expect(updatedTask3?.updated_at.getTime()).toBeGreaterThan(originalTask3!.updated_at.getTime());
  });

  it('should throw error when trying to delete non-existent task', async () => {
    const deleteInput: DeleteTaskInput = {
      id: 999999 // Non-existent ID
    };

    await expect(deleteTask(deleteInput)).rejects.toThrow(/task not found/i);
  });

  it('should handle deleting single remaining task', async () => {
    // Create only one task
    const task = await createTestTask('Only Task', 1);

    const deleteInput: DeleteTaskInput = {
      id: task.id
    };

    const result = await deleteTask(deleteInput);

    expect(result.success).toBe(true);

    // Verify no tasks remain
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });
});