import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertTriangle, Bot, Briefcase, Check, ChevronDown, Copy, FileText, RefreshCw } from 'lucide-react';
import { initials } from '../../utils/format';
import { parseServerDate } from '../../services/chatService';

const TOOL_LABELS = {
  get_overview: 'Reading market overview',
  get_skill_demand: 'Checking skill demand',
  get_salary_analytics: 'Analysing salaries',
  get_location_analytics: 'Checking hiring locations',
  get_remote_location_analytics: 'Checking remote job locations',
  get_workplace_analytics: 'Checking remote / hybrid / on-site split',
  get_employment_analytics: 'Checking employment types',
  get_job_role_analytics: 'Checking job roles',
  get_company_analytics: 'Checking top hiring companies',
  get_fresher_analytics: 'Checking fresher & internship jobs',
  search_jobs: 'Searching job postings',
  analyse_jd: 'Comparing your resume with the job description',
};

// A pasted job description: shown as a collapsible card instead of a huge chat bubble.
function JobDescriptionBubble({ text }) {
  const [open, setOpen] = useState(false);
  const firstLine = text.split('\n').find((l) => l.trim())?.trim() ?? 'Job description';

  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl rounded-tr-sm border border-brand-purple/40 bg-brand-purple/10 text-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-brand-purple/10"
      >
        <Briefcase size={15} className="shrink-0 text-violet-300" />
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-violet-300">Job description</span>
          <span className="block truncate text-slate-100">{firstLine}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words border-t border-brand-purple/25 px-3.5 py-3 text-[13px] leading-relaxed text-slate-300">
          {text}
        </div>
      )}
    </div>
  );
}

// Tailwind styles for Markdown elements (no typography plugin needed).
const markdownComponents = {
  h1: (p) => <h3 className="mb-2 mt-4 text-base font-semibold text-white first:mt-0" {...p} />,
  h2: (p) => <h3 className="mb-2 mt-4 text-base font-semibold text-white first:mt-0" {...p} />,
  h3: (p) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-white first:mt-0" {...p} />,
  h4: (p) => <h4 className="mb-1.5 mt-3 text-sm font-semibold text-slate-100 first:mt-0" {...p} />,
  p: (p) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0" {...p} />,
  ul: (p) => <ul className="my-2 list-disc space-y-1 pl-5" {...p} />,
  ol: (p) => <ol className="my-2 list-decimal space-y-1 pl-5" {...p} />,
  li: (p) => <li className="leading-relaxed marker:text-slate-500" {...p} />,
  strong: (p) => <strong className="font-semibold text-white" {...p} />,
  a: (p) => <a className="text-violet-300 underline underline-offset-2 hover:text-violet-200" target="_blank" rel="noreferrer noopener" {...p} />,
  hr: () => <hr className="my-4 border-white/10" />,
  blockquote: (p) => <blockquote className="my-2 border-l-2 border-brand-purple/60 pl-3 text-slate-300" {...p} />,
  code: ({ className, children, ...p }) =>
    className ? (
      <code className={`${className} block`} {...p}>{children}</code>
    ) : (
      <code className="rounded bg-white/10 px-1.5 py-0.5 text-[0.85em] text-violet-200" {...p}>{children}</code>
    ),
  pre: (p) => <pre className="my-2 overflow-x-auto rounded-lg bg-ink-950 p-3 text-xs" {...p} />,
  table: (p) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full border-collapse text-left text-xs sm:text-sm" {...p} />
    </div>
  ),
  thead: (p) => <thead className="bg-white/5 text-slate-200" {...p} />,
  th: (p) => <th className="border-b border-white/10 px-3 py-2 font-semibold" {...p} />,
  td: (p) => <td className="border-b border-white/5 px-3 py-2 align-top" {...p} />,
};

function formatTime(value) {
  const date = parseServerDate(value);
  if (!date) return '';
  const sameDay = date.toDateString() === new Date().toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function Timestamp({ value, align = 'left' }) {
  const text = formatTime(value);
  if (!text) return null;
  return (
    <span className={`text-[11px] text-slate-500 transition-opacity [@media(hover:hover)]:opacity-0 group-hover:opacity-100 ${align === 'right' ? 'text-right' : ''}`}>
      {text}
    </span>
  );
}

function TypingDots({ label }) {
  return (
    <div className="flex items-center gap-2.5 text-slate-400">
      <span className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-2" aria-hidden="true">
        <span className="chat-dot" />
        <span className="chat-dot" />
        <span className="chat-dot" />
      </span>
      <span className="text-xs">{label}…</span>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers without clipboard permission
      const area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
      aria-label="Copy answer"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function ChatMessage({ message, userName, onRegenerate }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="chat-fade-in group flex justify-end gap-2 sm:gap-3">
        <div className="flex max-w-[90%] flex-col items-end gap-1.5 sm:max-w-[85%]">
          {message.attachment_name && (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-ink-700/80 px-3 py-2 text-xs text-slate-200">
              <FileText size={15} className="text-violet-300" />
              <span className="max-w-[14rem] truncate">{message.attachment_name}</span>
            </div>
          )}
          {message.content && (message.is_jd ? (
            <JobDescriptionBubble text={message.content} />
          ) : (
            <div className="whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-brand-purple/90 px-4 py-2.5 text-sm text-white shadow-lg shadow-brand-purple/10">
              {message.content}
            </div>
          ))}
          <Timestamp value={message.created_at} align="right" />
        </div>
        <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br sm:flex from-brand-purple to-brand-blue text-xs font-semibold text-white">
          {initials(userName)}
        </span>
      </div>
    );
  }

  const showStatus = message.streaming && !message.content;
  const toolLabel = message.tool ? TOOL_LABELS[message.tool] || 'Querying the dataset' : 'Thinking';
  const finished = !message.streaming && message.content && !String(message.id).startsWith('tmp-');

  return (
    <div className="chat-fade-in group flex gap-2 sm:gap-3">
      <span className="chat-gradient-icon flex h-7 w-7 shrink-0 sm:h-8 sm:w-8 items-center justify-center rounded-full text-white shadow-glow">
        <Bot size={16} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5 text-sm text-slate-200 sm:max-w-[85%] sm:pt-1">
        {showStatus && <TypingDots label={toolLabel} />}

        {message.content && (
          <div className="break-words">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
            {message.streaming && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-violet-300 align-middle" />}
          </div>
        )}

        {message.error && (
          <div role="alert" className="mt-2 flex items-start gap-2 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-rose-200">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {message.error}
          </div>
        )}

        {(finished || (onRegenerate && message.error)) && (
          <div className="mt-2 flex items-center gap-1">
            {finished && <CopyButton text={message.content} />}
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
                aria-label="Regenerate answer"
              >
                <RefreshCw size={13} /> Regenerate
              </button>
            )}
            <span className="ml-1"><Timestamp value={message.created_at} /></span>
          </div>
        )}
      </div>
    </div>
  );
}
