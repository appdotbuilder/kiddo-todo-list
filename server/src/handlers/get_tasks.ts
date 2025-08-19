import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type Task } from '../schema';
import { asc } from 'drizzle-orm';

export const getTasks = async (): Promise<Task[]> => {
  try {
    const results = await db.select()
      .from(tasksTable)
      .orderBy(asc(tasksTable.order_position))
      .execute();

    return results.map(task => ({
      ...task,
      description: task.description || null // Ensure null handling
    }));
  } catch (error) {
    console.error('Failed to get tasks:', error);
    throw error;
  }
};