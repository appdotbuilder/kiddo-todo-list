import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskCompletionInput } from '../schema';
import { toggleTaskCompletion } from '../handlers/toggle_task_completion';
import { eq } from 'drizzle-orm';

describe('toggleTaskCompletion', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle task from incomplete to complete', async () => {
    // Create a test task first
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing',
        is_completed: false,
        order_position: 1,
        theme_color: 'red'
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];
    const originalUpdatedAt = createdTask.updated_at;

    // Wait a small amount to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id,
      is_completed: true
    };

    const result = await toggleTaskCompletion(input);

    // Verify the task was marked as completed
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.is_completed).toBe(true);
    expect(result.order_position).toEqual(1);
    expect(result.theme_color).toEqual('red');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should toggle task from complete to incomplete', async () => {
    // Create a completed test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Completed Task',
        description: null, // Test with null description
        is_completed: true,
        order_position: 5,
        theme_color: 'green'
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id,
      is_completed: false
    };

    const result = await toggleTaskCompletion(input);

    // Verify the task was marked as incomplete
    expect(result.id).toEqual(createdTask.id);
    expect(result.title).toEqual('Completed Task');
    expect(result.description).toBeNull();
    expect(result.is_completed).toBe(false);
    expect(result.order_position).toEqual(5);
    expect(result.theme_color).toEqual('green');
  });

  it('should update the task in the database', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Database Test Task',
        description: 'Testing database update',
        is_completed: false,
        order_position: 3,
        theme_color: 'purple'
      })
      .returning()
      .execute();

    const createdTask = taskResult[0];

    const input: ToggleTaskCompletionInput = {
      id: createdTask.id,
      is_completed: true
    };

    await toggleTaskCompletion(input);

    // Query the database to verify the update
    const updatedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTask.id))
      .execute();

    expect(updatedTasks).toHaveLength(1);
    const updatedTask = updatedTasks[0];
    expect(updatedTask.is_completed).toBe(true);
    expect(updatedTask.updated_at.getTime()).toBeGreaterThan(createdTask.updated_at.getTime());
  });

  it('should preserve all other task fields when toggling', async () => {
    // Create a task with all fields populated
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Full Task',
        description: 'Task with all fields',
        is_completed: false,
        order_position: 10,
        theme_color: 'yellow'
      })
      .returning()
      .execute();

    const originalTask = taskResult[0];

    const input: ToggleTaskCompletionInput = {
      id: originalTask.id,
      is_completed: true
    };

    const result = await toggleTaskCompletion(input);

    // Verify all fields are preserved except is_completed and updated_at
    expect(result.title).toEqual(originalTask.title);
    expect(result.description).toEqual(originalTask.description);
    expect(result.order_position).toEqual(originalTask.order_position);
    expect(result.theme_color).toEqual(originalTask.theme_color);
    expect(result.created_at.getTime()).toEqual(originalTask.created_at.getTime());
    expect(result.is_completed).toBe(true); // This should change
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTask.updated_at.getTime()); // This should change
  });

  it('should throw error for non-existent task', async () => {
    const input: ToggleTaskCompletionInput = {
      id: 99999, // Non-existent task ID
      is_completed: true
    };

    await expect(toggleTaskCompletion(input)).rejects.toThrow(/task with id 99999 not found/i);
  });

  it('should handle multiple completion toggles correctly', async () => {
    // Create a test task
    const taskResult = await db.insert(tasksTable)
      .values({
        title: 'Multi Toggle Task',
        description: 'Task for multiple toggles',
        is_completed: false,
        order_position: 7,
        theme_color: 'orange'
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Toggle to complete
    const toggleToComplete: ToggleTaskCompletionInput = {
      id: taskId,
      is_completed: true
    };

    const completedResult = await toggleTaskCompletion(toggleToComplete);
    expect(completedResult.is_completed).toBe(true);

    // Wait a small amount to ensure updated_at changes
    await new Promise(resolve => setTimeout(resolve, 10));

    // Toggle back to incomplete
    const toggleToIncomplete: ToggleTaskCompletionInput = {
      id: taskId,
      is_completed: false
    };

    const incompleteResult = await toggleTaskCompletion(toggleToIncomplete);
    expect(incompleteResult.is_completed).toBe(false);
    expect(incompleteResult.updated_at.getTime()).toBeGreaterThan(completedResult.updated_at.getTime());
  });
});