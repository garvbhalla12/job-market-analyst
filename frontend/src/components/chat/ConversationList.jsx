import { useState } from 'react';
import { Check, MessageSquare, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { Skeleton } from '../common/States';
import { parseServerDate } from '../../services/chatService';

function groupLabel(dateStr) {
  const date = parseServerDate(dateStr);
  if (!date) return 'Older';
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return 'Today';
  if (days < 2) return 'Yesterday';
  if (days < 7) return 'Previous 7 days';
  if (days < 30) return 'Previous 30 days';
  return 'Older';
}

function ConversationItem({ conversation, active, onSelect, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);

  const save = async () => {
    const value = title.trim();
    if (value && value !== conversation.title) await onRename(conversation.id, value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1.5">
        <input
          autoFocus
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') { setTitle(conversation.title); setEditing(false); }
          }}
          className="min-w-0 flex-1 rounded bg-ink-900 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-brand-purple/60"
          aria-label="Chat title"
        />
        <button type="button" onClick={save} className="rounded p-1 text-emerald-300 hover:bg-white/10" aria-label="Save title">
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={() => { setTitle(conversation.title); setEditing(false); }}
          className="rounded p-1 text-slate-400 hover:bg-white/10"
          aria-label="Cancel rename"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${
        active ? 'bg-brand-purple/15 text-white' : 'text-slate-300 hover:bg-white/5'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-left text-sm"
        title={conversation.title}
      >
        <MessageSquare size={14} className={`shrink-0 ${active ? 'text-violet-300' : 'text-slate-500'}`} />
        <span className="truncate">{conversation.title}</span>
      </button>
      <div className={`flex shrink-0 items-center ${active ? 'flex' : 'flex [@media(hover:hover)]:hidden [@media(hover:hover)]:group-hover:flex [@media(hover:hover)]:group-focus-within:flex'}`}>
        <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-100" aria-label="Rename chat">
          <Pencil size={13} />
        </button>
        <button type="button" onClick={() => onDelete(conversation)} className="rounded p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-300" aria-label="Delete chat">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function ConversationList({ conversations, loading, activeId, onNew, onSelect, onRename, onDelete }) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = q ? conversations.filter((c) => c.title.toLowerCase().includes(q)) : conversations;

  const groups = [];
  for (const c of visible) {
    const label = groupLabel(c.updated_at);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(c);
    else groups.push({ label, items: [c] });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 p-3">
        <button type="button" onClick={onNew} className="btn-primary w-full" title="New chat (Ctrl + K)">
          <Plus size={16} /> New chat
          <kbd className="ml-auto hidden rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-sans text-[10px] text-violet-100 lg:inline">
            Ctrl K
          </kbd>
        </button>

        {conversations.length > 0 && (
          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              aria-label="Search chats"
              className="input !py-1.5 !pl-8 !text-base sm:!text-xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-200"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-2 pb-3">
        {loading && (
          <div className="space-y-2 px-1">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-500">No chats yet. Start a new one!</p>
        )}

        {!loading && conversations.length > 0 && visible.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-500">No chats match &quot;{query.trim()}&quot;</p>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  active={c.id === activeId}
                  onSelect={onSelect}
                  onRename={onRename}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
