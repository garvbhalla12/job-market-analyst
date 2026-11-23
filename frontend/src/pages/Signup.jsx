import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import AuthShell from '../components/common/AuthShell';
import Field from '../components/common/Field';
import PasswordInput from '../components/common/PasswordInput';
import { Spinner } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { validateSignup } from '../utils/validation';
import { getErrorMessage } from '../utils/errors';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const found = validateSignup(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      // Creates the account, then signs in with the same credentials.
      await signup({ full_name: form.full_name.trim(), email: form.email.trim(), password: form.password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get access to job market analytics in a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-violet-300 hover:text-violet-200">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {serverError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {serverError}
          </div>
        )}
        <Field id="full_name" label="Full name" error={errors.full_name}>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={form.full_name}
            onChange={update('full_name')}
            aria-invalid={errors.full_name ? true : undefined}
            className={`input ${errors.full_name ? '!border-rose-500/60' : ''}`}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={update('email')}
            aria-invalid={errors.email ? true : undefined}
            className={`input ${errors.email ? '!border-rose-500/60' : ''}`}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <PasswordInput
            id="password"
            value={form.password}
            onChange={update('password')}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            invalid={Boolean(errors.password)}
          />
        </Field>
        <Field id="confirm" label="Confirm password" error={errors.confirm}>
          <PasswordInput
            id="confirm"
            value={form.confirm}
            onChange={update('confirm')}
            autoComplete="new-password"
            placeholder="Repeat your password"
            invalid={Boolean(errors.confirm)}
          />
        </Field>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <><Spinner /> Creating account…</> : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}
