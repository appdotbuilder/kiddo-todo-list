import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ReorderTasksInput } from '../schema';
import { reorderTasks } from '../handlers/reorder_tasks';
import { eq, asc } from 'drizzle-orm';

describe('reorderTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test tasks
  const createTestTasks = async () => {
    const tasks = [
      { title: 'Task 1', order_position: 0, theme_color: 'red', is_completed: false },
      { title: 'Task 2', order_position: 1, theme_color: 'blue', is_completed: false },
      { title: 'Task 3', order_position: 2, theme_color: 'green', is_completed: true },
      { title: 'Task 4', order_position: 3, theme_color: 'yellow', is_completed: false },
      { title: 'Task 5', order_position: 4, theme_color: 'purple', is_completed: false }
    ];

    const results = await db.insert(tasksTable)
      .values(tasks)
      .returning()
      .execute();

    return results;
  };

  it('should move task from later to earlier position (shift others down)', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[3]; // Task 4 at position 3

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 1
    };

    const result = await reorderTasks(input);

    // Verify we get all tasks back
    expect(result).toHaveLength(5);

    // Check the new ordering
    const orderedTasks = result.sort((a, b) => a.order_position - b.order_position);
    
    expect(orderedTasks[0].title).toEqual('Task 1'); // position 0 (unchanged)
    expect(orderedTasks[1].title).toEqual('Task 4'); // moved to position 1
    expect(orderedTasks[2].title).toEqual('Task 2'); // shifted down to position 2
    expect(orderedTasks[3].title).toEqual('Task 3'); // shifted down to position 3
    expect(orderedTasks[4].title).toEqual('Task 5'); // position 4 (unchanged)

    // Verify positions are correct
    expect(orderedTasks[0].order_position).toEqual(0);
    expect(orderedTasks[1].order_position).toEqual(1);
    expect(orderedTasks[2].order_position).toEqual(2);
    expect(orderedTasks[3].order_position).toEqual(3);
    expect(orderedTasks[4].order_position).toEqual(4);
  });

  it('should move task from earlier to later position (shift others up)', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[1]; // Task 2 at position 1

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 3
    };

    const result = await reorderTasks(input);

    // Verify we get all tasks back
    expect(result).toHaveLength(5);

    // Check the new ordering
    const orderedTasks = result.sort((a, b) => a.order_position - b.order_position);
    
    expect(orderedTasks[0].title).toEqual('Task 1'); // position 0 (unchanged)
    expect(orderedTasks[1].title).toEqual('Task 3'); // shifted up to position 1
    expect(orderedTasks[2].title).toEqual('Task 4'); // shifted up to position 2
    expect(orderedTasks[3].title).toEqual('Task 2'); // moved to position 3
    expect(orderedTasks[4].title).toEqual('Task 5'); // position 4 (unchanged)

    // Verify positions are correct
    expect(orderedTasks[0].order_position).toEqual(0);
    expect(orderedTasks[1].order_position).toEqual(1);
    expect(orderedTasks[2].order_position).toEqual(2);
    expect(orderedTasks[3].order_position).toEqual(3);
    expect(orderedTasks[4].order_position).toEqual(4);
  });

  it('should handle moving task to same position (no change)', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[2]; // Task 3 at position 2

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 2
    };

    const result = await reorderTasks(input);

    // Verify we get all tasks back
    expect(result).toHaveLength(5);

    // Check that ordering remains unchanged
    const orderedTasks = result.sort((a, b) => a.order_position - b.order_position);
    
    expect(orderedTasks[0].title).toEqual('Task 1');
    expect(orderedTasks[1].title).toEqual('Task 2');
    expect(orderedTasks[2].title).toEqual('Task 3');
    expect(orderedTasks[3].title).toEqual('Task 4');
    expect(orderedTasks[4].title).toEqual('Task 5');

    // Verify positions remain the same
    for (let i = 0; i < 5; i++) {
      expect(orderedTasks[i].order_position).toEqual(i);
    }
  });

  it('should move task to first position', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[4]; // Task 5 at position 4

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 0
    };

    const result = await reorderTasks(input);

    // Check the new ordering
    const orderedTasks = result.sort((a, b) => a.order_position - b.order_position);
    
    expect(orderedTasks[0].title).toEqual('Task 5'); // moved to position 0
    expect(orderedTasks[1].title).toEqual('Task 1'); // shifted down
    expect(orderedTasks[2].title).toEqual('Task 2'); // shifted down
    expect(orderedTasks[3].title).toEqual('Task 3'); // shifted down
    expect(orderedTasks[4].title).toEqual('Task 4'); // shifted down
  });

  it('should move task to last position', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[0]; // Task 1 at position 0

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 4
    };

    const result = await reorderTasks(input);

    // Check the new ordering
    const orderedTasks = result.sort((a, b) => a.order_position - b.order_position);
    
    expect(orderedTasks[0].title).toEqual('Task 2'); // shifted up
    expect(orderedTasks[1].title).toEqual('Task 3'); // shifted up
    expect(orderedTasks[2].title).toEqual('Task 4'); // shifted up
    expect(orderedTasks[3].title).toEqual('Task 5'); // shifted up
    expect(orderedTasks[4].title).toEqual('Task 1'); // moved to position 4
  });

  it('should update timestamps when reordering', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[0]; // Task 1 at position 0

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 2
    };

    const result = await reorderTasks(input);

    // Find the moved task and affected tasks
    const movedTask = result.find(t => t.id === taskToMove.id);
    expect(movedTask).toBeDefined();
    expect(movedTask!.updated_at).not.toEqual(taskToMove.updated_at);
    expect(movedTask!.updated_at.getTime()).toBeGreaterThan(taskToMove.updated_at.getTime());
  });

  it('should verify database consistency after reordering', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[2]; // Task 3 at position 2

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 0
    };

    await reorderTasks(input);

    // Query database directly to verify consistency
    const dbTasks = await db.select()
      .from(tasksTable)
      .orderBy(asc(tasksTable.order_position))
      .execute();

    // Check that all positions are sequential from 0 to 4
    for (let i = 0; i < 5; i++) {
      expect(dbTasks[i].order_position).toEqual(i);
    }

    // Check that the moved task is now at position 0
    const movedTaskInDb = dbTasks.find(t => t.id === taskToMove.id);
    expect(movedTaskInDb!.order_position).toEqual(0);
  });

  it('should throw error for non-existent task', async () => {
    await createTestTasks();

    const input: ReorderTasksInput = {
      task_id: 999, // Non-existent task ID
      new_position: 0
    };

    expect(reorderTasks(input)).rejects.toThrow(/Task with id 999 not found/i);
  });

  it('should preserve other task properties during reordering', async () => {
    const tasks = await createTestTasks();
    const taskToMove = tasks[2]; // Task 3 at position 2 (completed task)

    const input: ReorderTasksInput = {
      task_id: taskToMove.id,
      new_position: 0
    };

    const result = await reorderTasks(input);

    // Find the moved task
    const movedTask = result.find(t => t.id === taskToMove.id);
    
    // Verify that non-position properties are preserved
    expect(movedTask!.title).toEqual('Task 3');
    expect(movedTask!.theme_color).toEqual('green');
    expect(movedTask!.is_completed).toEqual(true);
    expect(movedTask!.description).toEqual(taskToMove.description);
  });
});