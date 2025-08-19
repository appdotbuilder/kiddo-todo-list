import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../../server/src/schema';

// Color theme mappings for kiddy theme
type ThemeColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange';

const colorThemes: Record<ThemeColor, { bg: string; border: string; text: string; badge: string }> = {
  red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-500' },
  blue: { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', badge: 'bg-blue-500' },
  green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-800', badge: 'bg-green-500' },
  yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-500' },
  purple: { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', badge: 'bg-purple-500' },
  pink: { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', badge: 'bg-pink-500' },
  orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-500' },
};

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Form state for new task
  const [newTaskForm, setNewTaskForm] = useState<CreateTaskInput>({
    title: '',
    description: null,
    theme_color: 'blue' as const
  });

  // Form state for editing task
  const [editTaskForm, setEditTaskForm] = useState<UpdateTaskInput>({
    id: 0,
    title: '',
    description: null,
    theme_color: 'blue' as const
  });

  const loadTasks = useCallback(async () => {
    try {
      const result = await trpc.getTasks.query();
      setTasks(result);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newTask = await trpc.createTask.mutate(newTaskForm);
      setTasks((prev: Task[]) => [...prev, newTask]);
      setNewTaskForm({
        title: '',
        description: null,
        theme_color: 'blue' as const
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    
    setIsLoading(true);
    try {
      const updatedTask = await trpc.updateTask.mutate(editTaskForm);
      setTasks((prev: Task[]) => 
        prev.map(task => task.id === updatedTask.id ? updatedTask : task)
      );
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await trpc.deleteTask.mutate({ id: taskId });
      setTasks((prev: Task[]) => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const updatedTask = await trpc.toggleTaskCompletion.mutate({
        id: task.id,
        is_completed: !task.is_completed
      });
      setTasks((prev: Task[]) => 
        prev.map(t => t.id === task.id ? updatedTask : t)
      );
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      id: task.id,
      title: task.title,
      description: task.description,
      theme_color: task.theme_color as ThemeColor
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.id === targetTask.id) {
      setDraggedTask(null);
      return;
    }

    try {
      const updatedTasks = await trpc.reorderTasks.mutate({
        task_id: draggedTask.id,
        new_position: targetTask.order_position
      });
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Failed to reorder tasks:', error);
    } finally {
      setDraggedTask(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
            🌈 My Fun To-Do List! 🎨
          </h1>
          <p className="text-2xl text-purple-700 font-medium">
            Let's get things done with style! ✨
          </p>
        </div>

        {/* Add New Task Card */}
        <Card className="mb-8 shadow-xl border-4 border-pink-300 rounded-3xl bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-purple-700 font-bold">
              ➕ Add a New Adventure!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div>
                <Input
                  placeholder="What do you want to do today? 🎯"
                  value={newTaskForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewTaskForm((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
                  }
                  className="text-lg p-4 rounded-2xl border-3 border-purple-300 focus:border-pink-400 font-medium"
                  required
                />
              </div>
              
              <div>
                <Textarea
                  placeholder="Tell me more about it! (optional) 📝"
                  value={newTaskForm.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewTaskForm((prev: CreateTaskInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  className="rounded-2xl border-3 border-purple-300 focus:border-pink-400 font-medium resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Select
                  value={newTaskForm.theme_color}
                  onValueChange={(value: string) =>
                    setNewTaskForm((prev: CreateTaskInput) => ({ ...prev, theme_color: value as ThemeColor }))
                  }
                >
                  <SelectTrigger className="w-full rounded-2xl border-3 border-purple-300 font-medium text-lg p-4">
                    <SelectValue placeholder="Pick your favorite color! 🎨" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="red">❤️ Red</SelectItem>
                    <SelectItem value="blue">💙 Blue</SelectItem>
                    <SelectItem value="green">💚 Green</SelectItem>
                    <SelectItem value="yellow">💛 Yellow</SelectItem>
                    <SelectItem value="purple">💜 Purple</SelectItem>
                    <SelectItem value="pink">🩷 Pink</SelectItem>
                    <SelectItem value="orange">🧡 Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-4 text-xl font-bold rounded-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {isLoading ? '🎨 Creating...' : '🚀 Add My Task!'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-6">
          {tasks.length === 0 ? (
            <Card className="p-12 text-center shadow-xl border-4 border-yellow-300 rounded-3xl bg-yellow-50/90 backdrop-blur-sm">
              <div className="text-6xl mb-4">🎈</div>
              <p className="text-2xl text-yellow-700 font-bold">
                No tasks yet! Create your first adventure above! 🌟
              </p>
            </Card>
          ) : (
            tasks.map((task: Task) => {
              const theme = colorThemes[task.theme_color as ThemeColor] || colorThemes.blue;
              
              return (
                <Card 
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`shadow-xl border-4 ${theme.border} rounded-3xl ${theme.bg} backdrop-blur-sm cursor-move hover:scale-102 transition-all duration-200 ${
                    task.is_completed ? 'opacity-75' : ''
                  } ${draggedTask?.id === task.id ? 'rotate-2 scale-105' : ''}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div className="flex-shrink-0 pt-1">
                        <Checkbox
                          checked={task.is_completed}
                          onCheckedChange={() => handleToggleComplete(task)}
                          className="w-6 h-6 rounded-full border-3"
                        />
                      </div>

                      {/* Task Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className={`text-xl font-bold ${theme.text} ${
                              task.is_completed ? 'line-through' : ''
                            }`}>
                              {task.is_completed ? '✅ ' : '⭐ '}
                              {task.title}
                            </h3>
                            
                            {task.description && (
                              <p className={`mt-2 ${theme.text} opacity-80 ${
                                task.is_completed ? 'line-through' : ''
                              }`}>
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-3">
                              <Badge className={`${theme.badge} text-white font-bold px-3 py-1 rounded-full`}>
                                {task.theme_color}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                Created: {task.created_at.toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startEdit(task)}
                                  className="rounded-full border-2 hover:scale-110 transition-transform"
                                >
                                  ✏️
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="rounded-3xl border-4 border-purple-300">
                                <DialogHeader>
                                  <DialogTitle className="text-2xl font-bold text-purple-700">
                                    ✨ Edit Your Task!
                                  </DialogTitle>
                                  <DialogDescription className="text-purple-600">
                                    Make changes to your task below.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <form onSubmit={handleUpdateTask} className="space-y-4">
                                  <Input
                                    placeholder="Task title"
                                    value={editTaskForm.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                      setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
                                    }
                                    className="rounded-2xl border-3 border-purple-300"
                                    required
                                  />
                                  
                                  <Textarea
                                    placeholder="Description (optional)"
                                    value={editTaskForm.description || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                      setEditTaskForm((prev: UpdateTaskInput) => ({
                                        ...prev,
                                        description: e.target.value || null
                                      }))
                                    }
                                    className="rounded-2xl border-3 border-purple-300 resize-none"
                                    rows={3}
                                  />

                                  <Select
                                    value={editTaskForm.theme_color}
                                    onValueChange={(value: string) =>
                                      setEditTaskForm((prev: UpdateTaskInput) => ({ ...prev, theme_color: value as ThemeColor }))
                                    }
                                  >
                                    <SelectTrigger className="rounded-2xl border-3 border-purple-300">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                      <SelectItem value="red">❤️ Red</SelectItem>
                                      <SelectItem value="blue">💙 Blue</SelectItem>
                                      <SelectItem value="green">💚 Green</SelectItem>
                                      <SelectItem value="yellow">💛 Yellow</SelectItem>
                                      <SelectItem value="purple">💜 Purple</SelectItem>
                                      <SelectItem value="pink">🩷 Pink</SelectItem>
                                      <SelectItem value="orange">🧡 Orange</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  
                                  <DialogFooter>
                                    <Button 
                                      type="submit" 
                                      disabled={isLoading}
                                      className="rounded-2xl bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                                    >
                                      {isLoading ? '🎨 Updating...' : '💾 Save Changes!'}
                                    </Button>
                                  </DialogFooter>
                                </form>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full border-2 hover:scale-110 transition-transform text-red-600 hover:bg-red-50"
                                >
                                  🗑️
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl border-4 border-red-300">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-2xl font-bold text-red-700">
                                    🤔 Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-red-600 text-lg">
                                    This will permanently delete your task "{task.title}". 
                                    This action cannot be undone!
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-2xl border-2">
                                    🙅‍♀️ Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="rounded-2xl bg-red-500 hover:bg-red-600"
                                  >
                                    🗑️ Delete Forever
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-lg text-purple-600 font-medium">
            🎉 Drag and drop to reorder your tasks! Have fun! 🎈
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;