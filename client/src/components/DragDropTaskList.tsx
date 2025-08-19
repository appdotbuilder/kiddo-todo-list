import { useState, useRef, useCallback } from 'react';
import { TaskCard } from './TaskCard';
import type { Task, UpdateTaskInput, ReorderTasksInput } from '../../../server/src/schema';

interface DragDropTaskListProps {
  tasks: Task[];
  onUpdate: (data: UpdateTaskInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onToggleComplete: (id: number, isCompleted: boolean) => Promise<void>;
  onReorder: (data: ReorderTasksInput) => Promise<void>;
}

interface DragState {
  isDragging: boolean;
  draggedTaskId: number | null;
  dragOverIndex: number | null;
}

export function DragDropTaskList({ 
  tasks, 
  onUpdate, 
  onDelete, 
  onToggleComplete, 
  onReorder 
}: DragDropTaskListProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTaskId: null,
    dragOverIndex: null
  });

  const draggedElementRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, taskId: number) => {
    setDragState({
      isDragging: true,
      draggedTaskId: taskId,
      dragOverIndex: null
    });
    
    // Set drag effect
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId.toString());
    
    // Add some visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    setDragState({
      isDragging: false,
      draggedTaskId: null,
      dragOverIndex: null
    });
    
    // Reset visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    setDragState(prev => ({
      ...prev,
      dragOverIndex: index
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragState(prev => ({
      ...prev,
      dragOverIndex: null
    }));
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    
    if (dragState.draggedTaskId === null) return;

    const draggedTaskIndex = tasks.findIndex(task => task.id === dragState.draggedTaskId);
    
    if (draggedTaskIndex === -1 || draggedTaskIndex === dropIndex) {
      setDragState({
        isDragging: false,
        draggedTaskId: null,
        dragOverIndex: null
      });
      return;
    }

    try {
      // Call the reorder API
      await onReorder({
        task_id: dragState.draggedTaskId,
        new_position: dropIndex
      });
    } catch (error) {
      console.error('Failed to reorder task:', error);
    }

    setDragState({
      isDragging: false,
      draggedTaskId: null,
      dragOverIndex: null
    });
  }, [dragState.draggedTaskId, tasks, onReorder]);

  if (tasks.length === 0) {
    return (
      <div className="kiddy-card border-gray-200 p-12 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-xl font-bold text-gray-600 mb-2">No tasks yet!</h3>
        <p className="text-gray-500">
          Add your first task above and let's get started! 🚀
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600 mb-2">
          📋 Your Awesome Tasks! 📋
        </h2>
        <p className="text-gray-600">
          Drag and drop to reorder • Click to complete • Edit or delete as needed! ✨
        </p>
      </div>

      <div className="space-y-3">
        {tasks.map((task: Task, index: number) => (
          <div
            key={task.id}
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            className={`
              transition-all duration-200
              ${dragState.dragOverIndex === index && dragState.draggedTaskId !== task.id ? 'transform scale-105' : ''}
              ${dragState.isDragging && dragState.draggedTaskId === task.id ? 'wiggle' : ''}
            `}
          >
            <TaskCard
              task={task}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              isDragging={dragState.isDragging && dragState.draggedTaskId === task.id}
            />
          </div>
        ))}
      </div>

      <div className="text-center py-8">
        <p className="text-sm text-gray-400">
          🎉 Great job! You have {tasks.length} task{tasks.length !== 1 ? 's' : ''} in your list 🎉
        </p>
        <p className="text-xs text-gray-400 mt-1">
          💪 Completed: {tasks.filter(t => t.is_completed).length} • 
          ⏳ Remaining: {tasks.filter(t => !t.is_completed).length}
        </p>
      </div>
    </div>
  );
}