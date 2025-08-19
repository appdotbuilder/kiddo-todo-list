import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
  });

  it('should fetch all tasks from database', async () => {
    // Create test tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'First Task',
          description: 'First task description',
          is_completed: false,
          order_position: 1,
          theme_color: 'red'
        },
        {
          title: 'Second Task',
          description: null, // Test nullable description
          is_completed: true,
          order_position: 2,
          theme_color: 'blue'
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Verify first task
    expect(result[0].title).toEqual('First Task');
    expect(result[0].description).toEqual('First task description');
    expect(result[0].is_completed).toEqual(false);
    expect(result[0].order_position).toEqual(1);
    expect(result[0].theme_color).toEqual('red');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second task
    expect(result[1].title).toEqual('Second Task');
    expect(result[1].description).toBeNull();
    expect(result[1].is_completed).toEqual(true);
    expect(result[1].order_position).toEqual(2);
    expect(result[1].theme_color).toEqual('blue');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks ordered by order_position ASC', async () => {
    // Insert tasks in non-sequential order_position to test ordering
    await db.insert(tasksTable)
      .values([
        {
          title: 'Third Task',
          description: 'Should appear third',
          is_completed: false,
          order_position: 3,
          theme_color: 'green'
        },
        {
          title: 'First Task',
          description: 'Should appear first',
          is_completed: false,
          order_position: 1,
          theme_color: 'red'
        },
        {
          title: 'Second Task',
          description: 'Should appear second',
          is_completed: true,
          order_position: 2,
          theme_color: 'blue'
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify tasks are returned in order_position ASC order
    expect(result[0].title).toEqual('First Task');
    expect(result[0].order_position).toEqual(1);
    
    expect(result[1].title).toEqual('Second Task');
    expect(result[1].order_position).toEqual(2);
    
    expect(result[2].title).toEqual('Third Task');
    expect(result[2].order_position).toEqual(3);
  });

  it('should handle tasks with various theme colors', async () => {
    const themeColors = ['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange'];
    
    // Create tasks with different theme colors
    const taskData = themeColors.map((color, index) => ({
      title: `Task ${index + 1}`,
      description: `Task with ${color} theme`,
      is_completed: false,
      order_position: index + 1,
      theme_color: color
    }));

    await db.insert(tasksTable)
      .values(taskData)
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(themeColors.length);
    
    // Verify each task has the correct theme color
    result.forEach((task, index) => {
      expect(task.theme_color).toEqual(themeColors[index]);
      expect(task.title).toEqual(`Task ${index + 1}`);
    });
  });

  it('should handle mixed completion statuses', async () => {
    // Create mix of completed and incomplete tasks
    await db.insert(tasksTable)
      .values([
        {
          title: 'Incomplete Task',
          description: 'Not done yet',
          is_completed: false,
          order_position: 1,
          theme_color: 'red'
        },
        {
          title: 'Complete Task',
          description: 'Already done',
          is_completed: true,
          order_position: 2,
          theme_color: 'green'
        }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    // Verify completion statuses are preserved
    expect(result[0].is_completed).toEqual(false);
    expect(result[1].is_completed).toEqual(true);
  });

  it('should handle large number of tasks correctly', async () => {
    // Create 50 tasks to test performance and ordering with larger datasets
    const taskData = Array.from({ length: 50 }, (_, index) => ({
      title: `Task ${index + 1}`,
      description: `Description for task ${index + 1}`,
      is_completed: index % 3 === 0, // Every third task is completed
      order_position: index + 1,
      theme_color: ['red', 'blue', 'green', 'yellow', 'purple'][index % 5] // Cycle through colors
    }));

    await db.insert(tasksTable)
      .values(taskData)
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(50);
    
    // Verify ordering is maintained for large datasets
    for (let i = 0; i < result.length; i++) {
      expect(result[i].order_position).toEqual(i + 1);
      expect(result[i].title).toEqual(`Task ${i + 1}`);
    }
  });
});