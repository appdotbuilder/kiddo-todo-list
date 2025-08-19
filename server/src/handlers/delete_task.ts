import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const deleteTask = async (input: DeleteTaskInput): Promise<{ success: boolean }> => {
  try {
    // First, get the task to find its position
    const taskToDelete = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    if (taskToDelete.length === 0) {
      throw new Error('task not found');
    }

    const deletedTaskPosition = taskToDelete[0].order_position;

    // Delete the task
    await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Reorder remaining tasks to fill the gap
    await db.execute(sql`
      UPDATE ${tasksTable} 
      SET order_position = order_position - 1, updated_at = NOW()
      WHERE order_position > ${deletedTaskPosition}
    `);

    return { success: true };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};