import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ToggleTaskCompletionInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const toggleTaskCompletion = async (input: ToggleTaskCompletionInput): Promise<Task> => {
  try {
    const result = await db.update(tasksTable)
      .set({ 
        is_completed: input.is_completed,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`task with id ${input.id} not found`);
    }

    const task = result[0];
    return {
      ...task,
      description: task.description || null // Ensure null handling
    };
  } catch (error) {
    console.error('Task completion toggle failed:', error);
    throw error;
  }
};