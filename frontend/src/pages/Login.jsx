import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import AuthShell from '../components/common/AuthShell';
import Field from '../components/common/Field';
import PasswordInput from '../components/common/PasswordInput';
import { Spinner } from '../components/common/States';
import { useAuth } from '../context/AuthContext';
import { validateLogin } from '../utils/validation';
import { getErrorMessage } from '../utils/errors';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
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
    const found = validateLogin(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to access your job market dashboard."
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-medium text-violet-300 hover:text-violet-200">
            Create one
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
            autoComplete="current-password"
            placeholder="Your password"
            invalid={Boolean(errors.password)}
          />
        </Field>
        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? <><Spinner /> Signing in…</> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
