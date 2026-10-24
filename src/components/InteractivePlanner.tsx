import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CheckSquare } from 'lucide-react';
import { ChecklistItem, LanguageCode } from '../types';
import { UI_TEXT } from '../data/translations';

interface InteractivePlannerProps {
  rawContent: string;
  language: LanguageCode;
}

export const InteractivePlanner: React.FC<InteractivePlannerProps> = ({
  rawContent,
  language,
}) => {
  const ui = language === 'hi' ? UI_TEXT.hi : UI_TEXT.en;
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  // Extract checklist items from markdown
  useEffect(() => {
    const lines = rawContent.split('\n');
    const parsed: ChecklistItem[] = [];

    lines.forEach((line, idx) => {
      const match = line.match(/^[\s*-]*\[([ xX])\]\s*(.*)$/);
      if (match) {
        const isChecked = match[1].toLowerCase() === 'x';
        const taskText = match[2].trim();

        let timeSlot: string | undefined;
        let cleanText = taskText;
        const timeMatch = taskText.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\s*[-–:]\s*|\w+\s*[-–:]\s*)(.*)$/);
        if (timeMatch) {
          timeSlot = timeMatch[1].replace(/[-–:]\s*$/, '').trim();
          cleanText = timeMatch[2].trim();
        }

        parsed.push({
          id: `task-${idx}-${Date.now()}`,
          text: cleanText || taskText,
          timeSlot,
          completed: isChecked,
          priority: taskText.toLowerCase().includes('must') || taskText.toLowerCase().includes('मुख्य') ? 'must' : 'normal',
        });
      }
    });

    if (parsed.length > 0) {
      setItems(parsed);
    }
  }, [rawContent]);

  if (items.length === 0) return null;

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  const toggleTask = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        text: newTaskText.trim(),
        completed: false,
        priority: 'normal',
      },
    ]);
    setNewTaskText('');
  };

  const deleteTask = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="my-5 p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-stone-900/80 border border-amber-200/80 dark:border-stone-800 shadow-xs transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-amber-200/60 dark:border-stone-800">
        <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-bold text-sm">
          <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span>{ui.common.interactiveChecklist}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
            {completedCount} / {items.length} {ui.common.completedTasks} ({progressPercent}%)
          </span>
          <div className="w-24 bg-stone-200 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-600 dark:bg-amber-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleTask(item.id)}
            className={`group flex items-start justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
              item.completed
                ? 'bg-amber-100/40 dark:bg-stone-850/60 border-amber-200/60 dark:border-stone-800 text-stone-400 dark:text-stone-500 line-through'
                : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 hover:border-amber-300 dark:hover:border-amber-500/50 text-stone-800 dark:text-stone-200 shadow-2xs'
            }`}
          >
            <div className="flex items-start gap-2.5 pt-0.5">
              {item.completed ? (
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-stone-400 dark:text-stone-500 group-hover:text-amber-500 shrink-0 mt-0.5" />
              )}
              <div className="text-xs sm:text-sm">
                {item.timeSlot && (
                  <span className="inline-block px-1.5 py-0.5 mr-2 rounded-md bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-[11px] no-underline">
                    {item.timeSlot}
                  </span>
                )}
                <span>{item.text}</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteTask(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500 dark:hover:text-red-400 p-1 rounded-md transition-opacity"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Custom Task Form */}
      <form onSubmit={handleAddTask} className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder={language === 'hi' ? '+ नया काम जोड़ें...' : '+ Add a custom task...'}
          className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-hidden focus:border-amber-400 dark:focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!newTaskText.trim()}
          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'hi' ? 'जोड़ें' : 'Add'}</span>
        </button>
      </form>
    </div>
  );
};
