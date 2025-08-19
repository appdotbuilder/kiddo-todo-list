import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import type { CreateTaskInput } from '../../../server/src/schema';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isLoading?: boolean;
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

export function TaskForm({ onSubmit, isLoading = false }: TaskFormProps) {
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: null,
    theme_color: 'blue'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    await onSubmit(formData);
    
    // Reset form after successful submission
    setFormData({
      title: '',
      description: null,
      theme_color: 'blue'
    });
  };

  return (
    <div className="kiddy-card border-purple-200 p-6 mb-6 bounce-in">
      <h2 className="text-2xl font-bold text-purple-600 mb-4 text-center">
        🌟 Add a New Task! 🌟
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFormData((prev: CreateTaskInput) => ({ ...prev, title: e.target.value }))
            }
            placeholder="✨ What do you want to do?"
            className="kiddy-input text-lg"
            required
          />
        </div>
        
        <div>
          <Textarea
            value={formData.description || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev: CreateTaskInput) => ({
                ...prev,
                description: e.target.value || null
              }))
            }
            placeholder="📝 Tell me more about it... (optional)"
            className="kiddy-input resize-none"
            rows={3}
          />
        </div>
        
        <div className="flex items-center gap-4">
          <label className="text-purple-600 font-semibold flex items-center gap-2">
            🎨 Pick a color:
          </label>
          <Select
            value={formData.theme_color}
            onValueChange={(value: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'pink' | 'orange') =>
              setFormData((prev: CreateTaskInput) => ({ ...prev, theme_color: value }))
            }
          >
            <SelectTrigger className="w-48 kiddy-input">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value} className="text-lg">
                  {color.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          type="submit" 
          disabled={isLoading || !formData.title.trim()}
          className="w-full kiddy-button bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white text-lg py-6"
        >
          {isLoading ? '✨ Adding Task...' : '🚀 Add My Task!'}
        </Button>
      </form>
    </div>
  );
}