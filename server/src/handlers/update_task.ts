import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTask = async (input: UpdateTaskInput): Promise<Task> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.is_completed !== undefined) updateData.is_completed = input.is_completed;
    if (input.theme_color !== undefined) updateData.theme_color = input.theme_color;

    const result = await db.update(tasksTable)
      .set(updateData)
      .where(eq(tasksTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Task with id ${input.id} not found`);
    }

    const task = result[0];
    return {
      ...task,
      description: task.description || null // Ensure null handling
    };
  } catch (error) {
    console.error('Task update failed:', error);
    throw error;
  }
};