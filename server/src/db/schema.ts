import { serial, text, pgTable, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default for optional descriptions
  is_completed: boolean('is_completed').notNull().default(false),
  order_position: integer('order_position').notNull(), // For drag-and-drop ordering
  theme_color: text('theme_color').notNull().default('blue'), // Kiddy theme colors
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Task = typeof tasksTable.$inferSelect; // For SELECT operations
export type NewTask = typeof tasksTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { tasks: tasksTable };