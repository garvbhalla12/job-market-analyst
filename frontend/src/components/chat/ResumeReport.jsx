import { useEffect, useState } from 'react';
import { CheckCircle2, FileText, XCircle } from 'lucide-react';

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function scoreTone(score) {
  if (score >= 75) return { stroke: '#34d399', text: 'text-emerald-300', label: 'Strong match' };
  if (score >= 50) return { stroke: '#fbbf24', text: 'text-amber-300', label: 'Good start' };
  return { stroke: '#fb7185', text: 'text-rose-300', label: 'Needs work' };
}

export function ScoreRing({ score, unit = '', caption = 'of 100' }) {
  const [shown, setShown] = useState(0);
  const tone = scoreTone(score);

  // Start empty, then animate to the score
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - shown / 100)}
          className="chat-score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}{unit}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-400">{caption}</span>
      </div>
    </div>
  );
}

function Bar({ label, value, max }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium text-slate-200">{value}/{max}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

function Chip({ skill, have }) {
  return (
    <span
      title={`Mentioned in ${skill.job_count} postings (${skill.demand_percentage}%)`}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs ${
        have
          ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
          : 'border-rose-400/30 bg-rose-400/10 text-rose-200'
      }`}
    >
      {have ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {skill.skill}
      <span className="opacity-60">{Math.round(skill.demand_percentage)}%</span>
    </span>
  );
}

export default function ResumeReport({ report, fileName }) {
  const tone = scoreTone(report.score);

  return (
    <div className="chat-fade-in rounded-2xl border border-white/10 bg-gradient-to-br from-ink-700/80 to-ink-800/80 p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
        <FileText size={14} className="text-violet-300" />
        Resume score card{fileName ? ` · ${fileName}` : ''}
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <ScoreRing score={report.score} />
          <div className="sm:hidden">
            <p className={`text-sm font-semibold ${tone.text}`}>{tone.label}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className={`hidden text-sm font-semibold sm:block ${tone.text}`}>{tone.label}</p>
          <Bar label="Market skill match" value={report.skill_score} max={report.skill_max} />
          <Bar label="Resume structure" value={report.structure_score} max={report.structure_max} />
        </div>
      </div>

      {report.matched_skills.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">In-demand skills you have</p>
          <div className="flex flex-wrap gap-1.5">
            {report.matched_skills.map((s) => <Chip key={s.skill} skill={s} have />)}
          </div>
        </div>
      )}

      {report.missing_skills.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Top in-demand skills missing</p>
          <div className="flex flex-wrap gap-1.5">
            {report.missing_skills.map((s) => <Chip key={s.skill} skill={s} have={false} />)}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {report.checks.map((c) => (
          <div key={c.key} className="flex items-center gap-2 text-xs">
            {c.passed ? (
              <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
            ) : (
              <XCircle size={14} className="shrink-0 text-rose-400" />
            )}
            <span className={c.passed ? 'text-slate-300' : 'text-slate-400'}>{c.label}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-slate-500">
        Percentages show how many collected job postings mention each skill. Score = skill match with the top
        in-demand skills (60) + resume structure checks (40).
      </p>
    </div>
  );
}
