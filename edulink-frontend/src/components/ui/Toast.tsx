import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-[100] bg-gray-900 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
      <Bell size={18} className="text-primary-light" />
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
        <X size={16} />
      </button>
    </div>
  );
}
