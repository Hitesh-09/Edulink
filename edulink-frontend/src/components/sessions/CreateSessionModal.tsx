import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  connections: any[];
  initialData?: any;
  isLoading?: boolean;
}

export function CreateSessionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  connections, 
  initialData,
  isLoading 
}: CreateSessionModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    participants: [] as string[]
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : '',
        time: initialData.time || '',
        duration: initialData.duration || 60,
        participants: initialData.participants?.map((p: any) => p.id) || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        participants: []
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const toggleParticipant = (id: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.includes(id) 
        ? prev.participants.filter(p => p !== id) 
        : [...prev.participants, id]
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? "Edit Session" : "Create Study Session"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Group Name" 
          placeholder="e.g. Algorithms Deep Dive" 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-300">Description</label>
          <textarea 
            className="border border-stone-800 bg-[#141314] text-stone-100 placeholder:text-stone-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-1 focus:ring-[#FF553E] focus:border-[#FF553E] min-h-[100px]"
            placeholder="What will you be studying?"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Date" 
            type="date" 
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            required
          />
          <Input 
            label="Time" 
            type="time" 
            value={formData.time}
            onChange={(e) => setFormData({...formData, time: e.target.value})}
            required
          />
        </div>

        <Input 
          label="Duration (minutes)" 
          type="number" 
          value={formData.duration}
          onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-stone-300">Invite Connections</label>
          <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 border border-stone-800 bg-[#141314] rounded-xl">
            {connections.length > 0 ? (
              connections.map((conn) => {
                const isSelected = formData.participants.includes(conn.id);
                return (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => toggleParticipant(conn.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      isSelected 
                        ? 'bg-[#FF553E]/15 border-[#FF553E]/50 text-[#FF553E]' 
                        : 'bg-[#1C1B1C] border-stone-800 text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {conn.full_name}
                  </button>
                );
              })
            ) : (
              <p className="text-xs text-stone-500 p-2 italic">No active connections to invite.</p>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-stone-800/80">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isLoading}>{initialData ? "Save Changes" : "Create Session"}</Button>
        </div>
      </form>
    </Modal>
  );
}
