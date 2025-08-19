import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type ReorderTasksInput, type Task } from '../schema';
import { eq, sql, asc } from 'drizzle-orm';

export const reorderTasks = async (input: ReorderTasksInput): Promise<Task[]> => {
  try {
    // Get the current task
    const currentTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.task_id))
      .execute();

    if (currentTask.length === 0) {
      throw new Error(`Task with id ${input.task_id} not found`);
    }

    const oldPosition = currentTask[0].order_position;
    const newPosition = input.new_position;

    if (oldPosition === newPosition) {
      // No change needed
      const results = await db.select()
        .from(tasksTable)
        .orderBy(asc(tasksTable.order_position))
        .execute();

      return results.map(task => ({
        ...task,
        description: task.description || null
      }));
    }

    // Update positions based on direction of movement
    if (oldPosition < newPosition) {
      // Moving down: shift tasks between old and new position up
      await db.execute(sql`
        UPDATE ${tasksTable} 
        SET order_position = order_position - 1, updated_at = NOW()
        WHERE order_position > ${oldPosition} AND order_position <= ${newPosition}
      `);
    } else {
      // Moving up: shift tasks between new and old position down
      await db.execute(sql`
        UPDATE ${tasksTable} 
        SET order_position = order_position + 1, updated_at = NOW()
        WHERE order_position >= ${newPosition} AND order_position < ${oldPosition}
      `);
    }

    // Update the moved task to its new position
    await db.update(tasksTable)
      .set({ 
        order_position: newPosition,
        updated_at: new Date()
      })
      .where(eq(tasksTable.id, input.task_id))
      .execute();

    // Return all tasks in correct order
    const results = await db.select()
      .from(tasksTable)
      .orderBy(asc(tasksTable.order_position))
      .execute();

    return results.map(task => ({
      ...task,
      description: task.description || null
    }));
  } catch (error) {
    console.error('Task reordering failed:', error);
    throw error;
  }
};