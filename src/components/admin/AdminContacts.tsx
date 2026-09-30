import React, { useState } from 'react';
import { ContactInquiry } from '../../types';
import { formatDate } from '../../utils/format';
import { Trash2, Mail } from 'lucide-react';

interface AdminContactsProps {
  contacts: ContactInquiry[];
  onUpdateStatus: (contactId: string, status: 'unread' | 'read' | 'resolved' | 'spam') => Promise<void>;
  onDeleteContact: (contactId: string) => Promise<void>;
}

export const AdminContacts: React.FC<AdminContactsProps> = ({
  contacts,
  onUpdateStatus,
  onDeleteContact,
}) => {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'resolved' | 'spam'>('all');

  const filtered = contacts.filter((c) => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C]">
            Customer Inquiries &amp; Messages ({contacts.length})
          </h2>
          <p className="text-xs font-sans text-[#665D58] mt-0.5">
            Incoming inquiries submitted via the customer contact page.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {(['all', 'unread', 'read', 'resolved', 'spam'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-sans uppercase tracking-wider transition-colors cursor-pointer capitalize shrink-0 ${
                filter === st
                  ? 'bg-[#241E1C] text-[#FAF7F3] font-semibold'
                  : 'bg-white text-[#241E1C] border border-[#E7DED7] hover:bg-[#FAF7F3]'
              }`}
            >
              {st} ({contacts.filter((c) => (st === 'all' ? true : c.status === st)).length})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E7DED7] p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <Mail size={24} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-800">
            {filter !== 'all' ? 'No messages match your filter' : 'No customer inquiries yet'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            {filter !== 'all'
              ? 'Try resetting the status filter.'
              : 'Messages submitted through your storefront contact form or consultation portal will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white p-6 rounded-2xl border border-[#E7DED7] shadow-xs space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg text-[#241E1C] font-medium">
                  {c.name}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                    c.status === 'unread'
                      ? 'bg-amber-100 text-amber-800'
                      : c.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-zinc-100 text-zinc-800'
                  }`}
                >
                  {c.status}
                </span>
              </div>

              <div className="text-xs font-sans text-[#665D58] space-y-0.5">
                <p>Email: <a href={`mailto:${c.email}`} className="text-[#241E1C] underline">{c.email}</a></p>
                {c.phone && <p>Phone: <a href={`tel:${c.phone}`} className="text-[#241E1C]">{c.phone}</a></p>}
                <p className="font-semibold text-[#241E1C]">Subject: {c.subject}</p>
                <p className="text-[11px] text-[#8C827A] pt-0.5">{formatDate(c.createdAt)}</p>
              </div>

              <div className="p-3.5 bg-[#FAF7F3] rounded-lg border border-[#E7DED7] text-xs font-sans text-[#241E1C] leading-relaxed">
                {c.message}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E7DED7] flex items-center justify-between text-xs font-sans">
              <div className="flex items-center gap-2">
                {c.status !== 'resolved' && (
                  <button
                    onClick={() => onUpdateStatus(c.id, 'resolved')}
                    className="px-2.5 py-1 bg-emerald-700 text-white rounded hover:bg-emerald-800 text-[11px]"
                  >
                    Mark Resolved
                  </button>
                )}
                {c.status === 'unread' && (
                  <button
                    onClick={() => onUpdateStatus(c.id, 'read')}
                    className="px-2.5 py-1 bg-zinc-200 text-zinc-800 rounded hover:bg-zinc-300 text-[11px]"
                  >
                    Mark Read
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  if (window.confirm('Delete message?')) {
                    onDeleteContact(c.id);
                  }
                }}
                className="text-[#665D58] hover:text-red-700 p-1 cursor-pointer"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
};
