import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (overrides: Partial<CreateTaskInput> = {}) => {
  const taskData = {
    title: 'Original Task',
    description: 'Original description',
    theme_color: 'blue' as const,
    order_position: 1,
    ...overrides
  };
  
  const result = await db.insert(tasksTable)
    .values({
      ...taskData,
      is_completed: false,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();
    
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    // Create a test task
    const originalTask = await createTestTask();
    const originalUpdatedAt = originalTask.updated_at;
    
    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Updated Task Title'
    };
    
    const result = await updateTask(updateInput);
    
    // Verify updated fields
    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual(originalTask.description);
    expect(result.is_completed).toEqual(originalTask.is_completed);
    expect(result.theme_color).toEqual(originalTask.theme_color);
    expect(result.order_position).toEqual(originalTask.order_position);
    expect(result.created_at).toEqual(originalTask.created_at);
    expect(result.updated_at).not.toEqual(originalUpdatedAt);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update task completion status', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      is_completed: true
    };
    
    const result = await updateTask(updateInput);
    
    expect(result.is_completed).toBe(true);
    expect(result.title).toEqual(originalTask.title); // Other fields unchanged
    expect(result.description).toEqual(originalTask.description);
    expect(result.theme_color).toEqual(originalTask.theme_color);
  });

  it('should update task theme color', async () => {
    const originalTask = await createTestTask({ theme_color: 'blue' });
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      theme_color: 'purple'
    };
    
    const result = await updateTask(updateInput);
    
    expect(result.theme_color).toEqual('purple');
    expect(result.title).toEqual(originalTask.title); // Other fields unchanged
    expect(result.is_completed).toEqual(originalTask.is_completed);
  });

  it('should update task description to null', async () => {
    const originalTask = await createTestTask({ description: 'Some description' });
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      description: null
    };
    
    const result = await updateTask(updateInput);
    
    expect(result.description).toBeNull();
    expect(result.title).toEqual(originalTask.title); // Other fields unchanged
  });

  it('should update multiple fields at once', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Multi-Update Task',
      description: 'Updated description',
      is_completed: true,
      theme_color: 'green'
    };
    
    const result = await updateTask(updateInput);
    
    expect(result.title).toEqual('Multi-Update Task');
    expect(result.description).toEqual('Updated description');
    expect(result.is_completed).toBe(true);
    expect(result.theme_color).toEqual('green');
    expect(result.order_position).toEqual(originalTask.order_position); // Unchanged
  });

  it('should save updates to database', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Database Update Test',
      theme_color: 'red'
    };
    
    await updateTask(updateInput);
    
    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, originalTask.id))
      .execute();
    
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Update Test');
    expect(tasks[0].theme_color).toEqual('red');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when task does not exist', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999, // Non-existent ID
      title: 'This should fail'
    };
    
    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 999 not found/);
  });

  it('should always update the updated_at timestamp', async () => {
    const originalTask = await createTestTask();
    const originalUpdatedAt = originalTask.updated_at;
    
    // Wait to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update with minimal change
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      theme_color: 'blue' as const // Same color, should still update timestamp
    };
    
    const result = await updateTask(updateInput);
    
    expect(result.updated_at).not.toEqual(originalUpdatedAt);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should handle task with null description correctly', async () => {
    const originalTask = await createTestTask({ description: null });
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Updated Title'
    };
    
    const result = await updateTask(updateInput);
    
    expect(result.description).toBeNull();
    expect(result.title).toEqual('Updated Title');
  });

  it('should preserve task creation timestamp', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Preserve Creation Date Test'
    };
    
    const result = await updateTask(updateInput);
    
    expect(result.created_at).toEqual(originalTask.created_at);
    expect(result.updated_at).not.toEqual(originalTask.updated_at);
  });
});