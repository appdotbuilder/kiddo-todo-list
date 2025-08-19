import { z } from 'zod';

// Task schema for the to-do list
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(), // Optional task description
  is_completed: z.boolean(),
  order_position: z.number().int(), // Position for drag-and-drop ordering
  theme_color: z.string(), // Kiddy theme colors like 'red', 'blue', 'green', 'yellow', 'purple'
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().nullable().optional(), // Can be null or omitted
  theme_color: z.enum(['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange']).default('blue'), // Kiddy theme colors
  order_position: z.number().int().nonnegative().optional() // Will be auto-calculated if not provided
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Task title is required").optional(),
  description: z.string().nullable().optional(),
  is_completed: z.boolean().optional(),
  theme_color: z.enum(['red', 'blue', 'green', 'yellow', 'purple', 'pink', 'orange']).optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Input schema for reordering tasks (drag-and-drop)
export const reorderTasksInputSchema = z.object({
  task_id: z.number(),
  new_position: z.number().int().nonnegative()
});

export type ReorderTasksInput = z.infer<typeof reorderTasksInputSchema>;

// Input schema for deleting tasks
export const deleteTaskInputSchema = z.object({
  id: z.number()
});

export type DeleteTaskInput = z.infer<typeof deleteTaskInputSchema>;

// Input schema for toggling task completion
export const toggleTaskCompletionInputSchema = z.object({
  id: z.number(),
  is_completed: z.boolean()
});

export type ToggleTaskCompletionInput = z.infer<typeof toggleTaskCompletionInputSchema>;