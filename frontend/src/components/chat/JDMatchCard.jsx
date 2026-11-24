import { BookOpen, CheckCircle2, Clock, Sparkles, Target, TrendingUp } from 'lucide-react';
import { ScoreRing, scoreTone } from './ResumeReport';
import { Skeleton } from '../common/States';

function PriorityBadge({ priority }) {
  if (priority === 'nice') {
    return (
      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-px text-[10.5px] font-semibold text-amber-200">
        Nice-to-have
      </span>
    );
  }
  return (
    <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2 py-px text-[10.5px] font-semibold text-rose-200">
      Must-have
    </span>
  );
}

function DemandText({ item }) {
  if (item.demand_percentage === null || item.demand_percentage === undefined) {
    return <span className="text-slate-500">Not tracked in dataset</span>;
  }
  return (
    <span className="text-slate-400">
      In <strong className="font-semibold text-slate-200">{item.demand_percentage}%</strong> of postings
    </span>
  );
}

function GapRow({ gap }) {
  return (
    <li className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 sm:p-3.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="text-sm font-semibold text-white">{gap.skill}</span>
        <PriorityBadge priority={gap.priority} />
        <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] text-slate-300">
          <Clock size={11} className="text-violet-300" /> {gap.time}
        </span>
      </div>
      <p className="mt-2 flex items-start gap-2 text-[13px] leading-relaxed text-slate-300">
        <BookOpen size={14} className="mt-[3px] shrink-0 text-violet-300" />
        <span>{gap.learn}</span>
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px]">
        <TrendingUp size={12} className="shrink-0 text-slate-500" />
        <DemandText item={gap} />
      </p>
    </li>
  );
}

export function JDMatchPending() {
  return (
    <div className="chat-fade-in rounded-2xl border border-white/10 bg-ink-700/40 p-4 sm:p-5" aria-busy="true">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        <Target size={14} className="text-violet-300" />
        Comparing your resume with the job description…
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}

export default function JDMatchCard({ report }) {
  const tone = scoreTone(report.score);
  const musts = report.missing.filter((g) => g.priority === 'must').length;
  const nices = report.missing.length - musts;

  return (
    <div className="chat-fade-in rounded-2xl border border-white/10 bg-gradient-to-br from-ink-700/80 to-ink-800/80 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        <Target size={14} className="text-violet-300" />
        Resume vs job description{report.role_title ? ` · ${report.role_title}` : ''}
      </div>

      {/* Score + summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <ScoreRing score={report.score} unit="%" caption="match" />
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${tone.text}`}>{tone.label}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-300">
            You already have <strong className="text-white">{report.matched.length}</strong> of the skills this job asks for.
            {report.missing.length > 0 ? (
              <>
                {' '}Work on <strong className="text-white">{musts}</strong> must-have
                {nices > 0 && <> and <strong className="text-white">{nices}</strong> nice-to-have</>} skill
                {report.missing.length === 1 ? '' : 's'} to become a stronger fit.
              </>
            ) : (
              ' No gaps found. Tailor your resume keywords to this JD and apply!'
            )}
          </p>
        </div>
      </div>

      {/* Skills the user has */}
      {report.matched.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Skills you have</p>
          <div className="flex flex-wrap gap-1.5">
            {report.matched.map((m) => (
              <span
                key={m.skill}
                title={m.demand_percentage != null ? `In ${m.demand_percentage}% of postings` : undefined}
                className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-xs text-emerald-200"
              >
                <CheckCircle2 size={11} /> {m.skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Gaps with learning plan */}
      {report.missing.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Skills to work on <span className="normal-case tracking-normal text-slate-500">· most important first</span>
          </p>
          <ul className="space-y-2">
            {report.missing.map((g) => <GapRow key={g.skill} gap={g} />)}
          </ul>
        </div>
      )}

      <p className="mt-4 flex items-start gap-1.5 text-[11px] text-slate-500">
        <Sparkles size={12} className="mt-px shrink-0" />
        <span>
          Match % weights must-have skills twice as much as nice-to-have ones. Demand % comes from the app&apos;s collected
          job postings. {report.ai_enriched ? 'Learning plans and extra skills are AI-generated.' : 'AI analysis was unavailable, so only tracked skills are shown.'}
        </span>
      </p>
    </div>
  );
}
