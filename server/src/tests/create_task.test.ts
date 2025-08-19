import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input with all fields
const fullTestInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing purposes',
  theme_color: 'red',
  order_position: 5
};

// Minimal test input (only required fields)
const minimalTestInput: CreateTaskInput = {
  title: 'Minimal Task',
  theme_color: 'blue' // Required by TypeScript even though Zod has default
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all provided fields', async () => {
    const result = await createTask(fullTestInput);

    // Validate all fields
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing purposes');
    expect(result.is_completed).toEqual(false);
    expect(result.order_position).toEqual(5);
    expect(result.theme_color).toEqual('red');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal input and apply defaults', async () => {
    const result = await createTask(minimalTestInput);

    // Validate basic fields
    expect(result.title).toEqual('Minimal Task');
    expect(result.description).toBeNull(); // Should be null when not provided
    expect(result.is_completed).toEqual(false);
    expect(result.theme_color).toEqual('blue'); // Zod default
    expect(result.order_position).toEqual(1); // Auto-assigned as first task
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database correctly', async () => {
    const result = await createTask(fullTestInput);

    // Query the database to verify persistence
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    const savedTask = tasks[0];
    expect(savedTask.title).toEqual('Test Task');
    expect(savedTask.description).toEqual('A task for testing purposes');
    expect(savedTask.is_completed).toEqual(false);
    expect(savedTask.order_position).toEqual(5);
    expect(savedTask.theme_color).toEqual('red');
    expect(savedTask.created_at).toBeInstanceOf(Date);
    expect(savedTask.updated_at).toBeInstanceOf(Date);
  });

  it('should auto-assign order_position when not provided', async () => {
    // Create first task - should get position 1
    const firstTask = await createTask(minimalTestInput);
    expect(firstTask.order_position).toEqual(1);

    // Create second task without specifying position - should get position 2
    const secondTask = await createTask({
      title: 'Second Task',
      theme_color: 'blue'
    });
    expect(secondTask.order_position).toEqual(2);

    // Create third task - should get position 3
    const thirdTask = await createTask({
      title: 'Third Task',
      theme_color: 'blue'
    });
    expect(thirdTask.order_position).toEqual(3);
  });

  it('should handle explicit order_position correctly', async () => {
    // Create task with specific position
    const result = await createTask({
      title: 'Positioned Task',
      order_position: 10,
      theme_color: 'blue'
    });

    expect(result.order_position).toEqual(10);

    // Create another task without position - should be 11 (max + 1)
    const nextTask = await createTask({
      title: 'Next Task',
      theme_color: 'blue'
    });
    expect(nextTask.order_position).toEqual(11);
  });

  it('should handle null description correctly', async () => {
    const taskWithNullDescription = await createTask({
      title: 'Task with null description',
      description: null,
      theme_color: 'blue'
    });

    expect(taskWithNullDescription.description).toBeNull();

    // Verify in database
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskWithNullDescription.id))
      .execute();

    expect(savedTasks[0].description).toBeNull();
  });

  it('should handle all theme colors correctly', async () => {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'] as const;
    
    for (const color of colors) {
      const result = await createTask({
        title: `${color} task`,
        theme_color: color
      });

      expect(result.theme_color).toEqual(color);
    }
  });

  it('should always set is_completed to false for new tasks', async () => {
    const result = await createTask(fullTestInput);

    expect(result.is_completed).toEqual(false);

    // Verify in database
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(savedTasks[0].is_completed).toEqual(false);
  });

  it('should create multiple tasks with unique IDs and timestamps', async () => {
    const task1 = await createTask({
      title: 'First Task',
      theme_color: 'blue'
    });

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const task2 = await createTask({
      title: 'Second Task',
      theme_color: 'green'
    });

    // Verify unique IDs
    expect(task1.id).not.toEqual(task2.id);
    
    // Verify both have valid timestamps
    expect(task1.created_at).toBeInstanceOf(Date);
    expect(task1.updated_at).toBeInstanceOf(Date);
    expect(task2.created_at).toBeInstanceOf(Date);
    expect(task2.updated_at).toBeInstanceOf(Date);
  });
});