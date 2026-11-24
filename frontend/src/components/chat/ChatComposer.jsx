import { useEffect, useRef, useState } from 'react';
import { ArrowUp, FileText, Paperclip, Square, X } from 'lucide-react';
import { RESUME_ACCEPT } from '../../services/chatService';

const MAX_CHARS = 12000; // room for a pasted job description

/**
 * Message input. The selected resume file is owned by the page (so drag & drop
 * anywhere on the chat can set it): `file`, `onFileSelect(file)`, `onFileClear()`.
 */
export default function ChatComposer({ onSend, onStop, busy, autoFocusKey, file, fileError, onFileSelect, onFileClear }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  // Focus the input when switching chats.
  useEffect(() => {
    textareaRef.current?.focus();
  }, [autoFocusKey]);

  // Auto-grow textarea up to ~8 lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onFileSelect(f);
  };

  const canSend = !busy && (text.trim() || file);

  const submit = (e) => {
    e?.preventDefault();
    if (!canSend) return;
    onSend({ content: text.trim(), file });
    setText('');
    onFileClear();
  };

  return (
    <form onSubmit={submit} className="p-2.5 pb-2 sm:p-4">
      {/* Gradient border appears when the input is focused */}
      <div className="rounded-xl bg-white/10 p-px transition-all focus-within:bg-gradient-to-r focus-within:from-brand-purple focus-within:via-brand-blue focus-within:to-brand-cyan focus-within:shadow-glow">
        <div className="rounded-[11px] bg-ink-900">
          {file && (
            <div className="flex items-center gap-2 px-3 pt-3">
              <div className="chat-fade-in flex min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-ink-700/80 px-2.5 py-1.5 text-xs text-slate-200">
                <FileText size={14} className="shrink-0 text-violet-300" />
                <span className="truncate">{file.name}</span>
                <button type="button" onClick={onFileClear} className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Remove file">
                  <X size={13} />
                </button>
              </div>
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            maxLength={MAX_CHARS}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e);
            }}
            placeholder={file ? 'Paste a job description to match against, or add a note (optional)' : 'Ask about the job market, upload your resume, or paste a job description…'}
            aria-label="Message"
            className="block w-full resize-none bg-transparent px-3 py-3 text-base text-slate-100 sm:px-4 sm:text-sm placeholder:text-slate-500 focus:outline-none"
          />

          <div className="flex items-center justify-between px-2 pb-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
              title="Upload resume (PDF, DOCX or TXT, max 5 MB). You can also drag & drop it."
            >
              <Paperclip size={15} /> <span className="hidden min-[380px]:inline">Upload resume</span><span className="min-[380px]:hidden">Resume</span>
            </button>
            <input ref={fileRef} type="file" accept={RESUME_ACCEPT} onChange={pickFile} className="hidden" />

            {busy ? (
              <button type="button" onClick={onStop} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-slate-100 hover:bg-white/20" aria-label="Stop generating">
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canSend}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-purple to-brand-blue text-white transition-opacity hover:opacity-90 disabled:from-white/10 disabled:to-white/10 disabled:text-slate-500"
                aria-label="Send message"
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
      {fileError && <p className="mt-2 text-xs text-rose-300">{fileError}</p>}
      <p className="mt-1.5 hidden text-center text-[11px] text-slate-500 min-[480px]:block">
        AI answers use the app&apos;s sample of job postings and can make mistakes. Check important details.
      </p>
    </form>
  );
}
