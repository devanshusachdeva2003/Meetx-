import React, { useState, useEffect } from 'react';
import { X, Save, Download, CheckSquare, Plus, Clock, User, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import api from '../../utils/api';
import { toast } from 'sonner';

export function MeetingNotes({ 
  onClose, 
  roomId, 
  localUser, 
  notesContent, 
  setNotesContent,
  tasks,
  setTasks,
  onNotesChange,
  onTasksChange
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  // Handle note change and broadcast
  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNotesContent(val);
    onNotesChange(val);
  };

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText,
      assignee: newTaskAssignee,
      dueDate: newTaskDueDate,
      completed: false
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    onTasksChange(updated);
    setNewTaskText('');
    setNewTaskAssignee('');
    setNewTaskDueDate('');
  };

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    onTasksChange(updated);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    onTasksChange(updated);
  };

  const saveToDatabase = async () => {
    setIsSaving(true);
    try {
      // Find or create note for this meeting
      const res = await api.post(`/meetings/${roomId}/notes`, {
        content: notesContent,
        actionItems: tasks,
        title: `Meeting Notes - ${new Date().toLocaleDateString()}`
      });
      if (res.data.success) {
        toast.success("Notes and tasks saved successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save notes to database");
    } finally {
      setIsSaving(false);
    }
  };

  const exportNotes = () => {
    const blob = new Blob([notesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Meeting_Notes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute inset-0 m-4 md:m-8 bg-card/95 backdrop-blur-3xl border border-white/10 rounded-3xl z-50 flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8">
      <header className="relative p-4 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 bg-white/5 gap-4">
        <Button variant="none" size="icon" onClick={onClose} className="absolute right-4 top-4 hover:bg-white/10 md:static md:order-last md:ml-2">
          <X />
        </Button>
        <div className="flex items-center gap-2 md:gap-4 pr-10 md:pr-0 flex-wrap">
          <h2 className="text-lg md:text-xl font-bold">Meeting Notes & Tasks</h2>
          <span className="px-2 py-1 bg-green-500/20 text-green-500 text-[10px] md:text-xs font-bold rounded-md">Live Sync Active</span>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={exportNotes} className="flex-1 md:flex-none justify-center">
            <Download className="w-4 h-4 mr-1 md:mr-2" /> <span className="hidden sm:inline">Export</span>
          </Button>
          <Button variant="primary" size="sm" onClick={saveToDatabase} disabled={isSaving} className="flex-1 md:flex-none justify-center">
            <Save className="w-4 h-4 mr-1 md:mr-2" /> {isSaving ? 'Saving...' : <><span className="hidden sm:inline">Save to DB</span><span className="sm:hidden">Save</span></>}
          </Button>
        </div>
      </header>
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Notes Section */}
        <div className="flex-1 flex flex-col border-r border-white/10 p-4">
          <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Shared Notes
          </h3>
          <textarea
            className="flex-1 w-full bg-background/50 border border-white/10 rounded-xl p-4 outline-none focus:border-primary/50 resize-none font-sans text-sm leading-relaxed"
            placeholder="Start typing... everyone in the meeting can see and edit this."
            value={notesContent}
            onChange={handleNoteChange}
          />
        </div>

        {/* Tasks Section */}
        <div className="w-full md:w-96 flex flex-col p-4 bg-white/5">
          <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2">
            <CheckSquare className="w-4 h-4" /> Action Items
          </h3>
          
          <div className="flex flex-col gap-2 mb-4 bg-background/50 p-3 rounded-xl border border-white/10">
            <input 
              type="text" 
              placeholder="Task description..." 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              className="bg-transparent text-sm outline-none border-b border-white/10 pb-1"
            />
            <div className="flex gap-2 mt-2">
              <div className="flex items-center flex-1 bg-white/5 rounded-md px-2 border border-white/5">
                <User className="w-3 h-3 text-muted-foreground mr-1" />
                <input 
                  type="text" 
                  placeholder="Assignee" 
                  value={newTaskAssignee}
                  onChange={(e) => setNewTaskAssignee(e.target.value)}
                  className="bg-transparent text-xs outline-none py-1 w-full"
                />
              </div>
              <div className="flex items-center flex-1 bg-white/5 rounded-md px-2 border border-white/5">
                <Clock className="w-3 h-3 text-muted-foreground mr-1" />
                <input 
                  type="date" 
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="bg-transparent text-xs outline-none py-1 w-full text-muted-foreground"
                />
              </div>
            </div>
            <Button size="sm" variant="soft" className="mt-2 w-full" onClick={handleAddTask}>
              <Plus className="w-4 h-4 mr-1" /> Add Task
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 hide-scrollbar">
            {tasks.map(task => (
              <div key={task.id} className={`flex items-start gap-3 p-3 rounded-xl border ${task.completed ? 'bg-white/5 border-transparent opacity-50' : 'bg-card border-white/10 shadow-sm'}`}>
                <input 
                  type="checkbox" 
                  checked={task.completed} 
                  onChange={() => toggleTask(task.id)}
                  className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary bg-background border-white/20"
                />
                <div className="flex-1 flex flex-col min-w-0">
                  <span className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.text}</span>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    {task.assignee && <span className="flex items-center gap-1"><User className="w-3 h-3"/> {task.assignee}</span>}
                    {task.dueDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {task.dueDate}</span>}
                  </div>
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="text-xs text-center text-muted-foreground py-10 italic">No tasks created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
