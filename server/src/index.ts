import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createTaskInputSchema, 
  updateTaskInputSchema, 
  reorderTasksInputSchema,
  deleteTaskInputSchema,
  toggleTaskCompletionInputSchema 
} from './schema';

// Import handlers
import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';
import { reorderTasks } from './handlers/reorder_tasks';
import { toggleTaskCompletion } from './handlers/toggle_task_completion';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new task
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),

  // Get all tasks (ordered by position for drag-and-drop)
  getTasks: publicProcedure
    .query(() => getTasks()),

  // Update an existing task
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),

  // Delete a task
  deleteTask: publicProcedure
    .input(deleteTaskInputSchema)
    .mutation(({ input }) => deleteTask(input)),

  // Reorder tasks (drag-and-drop functionality)
  reorderTasks: publicProcedure
    .input(reorderTasksInputSchema)
    .mutation(({ input }) => reorderTasks(input)),

  // Toggle task completion status
  toggleTaskCompletion: publicProcedure
    .input(toggleTaskCompletionInputSchema)
    .mutation(({ input }) => toggleTaskCompletion(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`🎨 Kiddy To-Do List TRPC server listening at port: ${port}`);
}

start();