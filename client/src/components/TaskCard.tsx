import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useState } from 'react';
import type { Task, UpdateTaskInput } from '../../../server/src/schema';

interface TaskCardProps {
  task: Task;
  onUpdate: (data: UpdateTaskInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleComplete: (id: number, isCompleted: boolean) => Promise<void>;
  isDragging?: boolean;
}

const colorOptions = [
  { value: 'red', label: '❤️ Red', emoji: '❤️' },
  { value: 'blue', label: '💙 Blue', emoji: '💙' },
  { value: 'green', label: '💚 Green', emoji: '💚' },
  { value: 'yellow', label: '💛 Yellow', emoji: '💛' },
  { value: 'purple', label: '💜 Purple', emoji: '💜' },
  { value: 'pink', label: '🩷 Pink', emoji: '🩷' },
  { value: 'orange', label: '🧡 Orange', emoji: '🧡' },
];

export function TaskCard({ task, onUpdate, onDelete, onToggleComplete, isDragging = false }: TaskCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editData, setEditData] = useState<UpdateTaskInput>({
    id: task.id,
    title: task.title,
    description: task.description,
    theme_color: task.theme_color as 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange'
  });

  const handleEdit = () => {
    setEditData({
      id: task.id,
      title: task.title,
      description: task.description,
      theme_color: task.theme_color as 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange'
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!editData.title?.trim()) return;
    
    setIsUpdating(true);
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      id: task.id,
      title: task.title,
      description: task.description,
      theme_color: task.theme_color as 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange'
    });
    setIsEditing(false);
  };

  const handleToggleComplete = () => {
    onToggleComplete(task.id, !task.is_completed);
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  const getColorEmoji = (color: string) => {
    const option = colorOptions.find(opt => opt.value === color);
    return option?.emoji || '💙';
  };

  const cardColorClass = `task-card-${task.theme_color}`;
  const completedClass = task.is_completed ? 'completed-task' : '';
  const draggingClass = isDragging ? 'rotate-2 shadow-2xl scale-105' : '';

  if (isEditing) {
    return (
      <div className={`task-card ${cardColorClass} border-2 ${draggingClass}`}>
        <div className="space-y-3">
          <Input
            value={editData.title || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEditData((prev: UpdateTaskInput) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Task title"
            className="kiddy-input"
            required
          />
          
          <Textarea
            value={editData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setEditData((prev: UpdateTaskInput) => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            placeholder="Task description (optional)"
            className="kiddy-input resize-none"
            rows={2}
          />
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">🎨</span>
            <Select
              value={editData.theme_color}
              onValueChange={(value: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange') =>
                setEditData((prev: UpdateTaskInput) => ({ ...prev, theme_color: value }))
              }
            >
              <SelectTrigger className="w-32 kiddy-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    {color.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSave}
              disabled={isUpdating || !editData.title?.trim()}
              className="kiddy-button bg-green-400 hover:bg-green-500 text-white flex-1"
            >
              {isUpdating ? '💾 Saving...' : '✅ Save'}
            </Button>
            <Button 
              onClick={handleCancel}
              variant="outline"
              className="kiddy-button border-gray-300 flex-1"
            >
              ❌ Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`task-card ${cardColorClass} border-2 ${draggingClass}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleToggleComplete}
          className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
            task.is_completed 
              ? 'bg-green-400 border-green-500 text-white' 
              : 'border-gray-400 hover:border-green-400'
          }`}
        >
          {task.is_completed && '✓'}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-lg ${completedClass}`}>
              {task.title}
            </h3>
            <span className="text-lg">{getColorEmoji(task.theme_color)}</span>
          </div>
          
          {task.description && (
            <p className={`text-gray-600 text-sm mb-2 ${completedClass}`}>
              {task.description}
            </p>
          )}
          
          <p className="text-xs text-gray-400">
            Created: {new Date(task.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex flex-col gap-1">
          <Button
            onClick={handleEdit}
            size="sm"
            variant="ghost"
            className="kiddy-button p-2 hover:bg-white/50"
          >
            ✏️
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="kiddy-button p-2 hover:bg-red-100"
              >
                🗑️
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="kiddy-card border-red-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600">
                  🚫 Delete Task?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{task.title}"? This action cannot be undone! 😢
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="kiddy-button">
                  😅 Keep It
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="kiddy-button bg-red-400 hover:bg-red-500 text-white"
                >
                  🗑️ Delete It
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}