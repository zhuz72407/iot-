import React, { useState } from 'react';
import { Priority, Role, Ticket, TicketStatus } from '../types';
import { X } from 'lucide-react';

interface CreateTicketModalProps {
  currentUser: Role;
  onSave: (ticket: Ticket) => void;
  onCancel: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ currentUser, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    const newTicket: Ticket = {
      id: `TKT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*1000)}`,
      title,
      content,
      priority,
      status: TicketStatus.PENDING,
      creator: currentUser,
      createdAt: Date.now(),
      assignedTeams: [],
      diagnoses: []
    };
    onSave(newTicket);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative animate-fade-in-up">
        <button onClick={onCancel} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">新建工单</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">工单标题</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">紧急程度</label>
            <select
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={priority}
              onChange={e => setPriority(e.target.value as Priority)}
            >
              <option value={Priority.HIGH}>高</option>
              <option value={Priority.MEDIUM}>中</option>
              <option value={Priority.LOW}>低</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">工单内容描述</label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              提交工单
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
