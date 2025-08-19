import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';
import { desc, max } from 'drizzle-orm';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // If no order_position provided, set it to be the last position
    let orderPosition = input.order_position;
    
    if (orderPosition === undefined) {
      // Get the current highest position
      const maxPositionResult = await db.select({ maxPos: max(tasksTable.order_position) })
        .from(tasksTable)
        .execute();
      
      const maxPosition = maxPositionResult[0]?.maxPos || 0;
      orderPosition = maxPosition + 1;
    }

    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description || null,
        theme_color: input.theme_color || 'blue',
        order_position: orderPosition,
        is_completed: false
      })
      .returning()
      .execute();

    const task = result[0];
    return {
      ...task,
      description: task.description || null // Ensure null handling
    };
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};