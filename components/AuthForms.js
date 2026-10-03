'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { fetchJson } from '@/lib/client/useApi';
import { EMAIL_RE, PHONE_RE, passwordProblems } from '@/lib/validation';
import { Notice } from './ui';

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

function PasswordInput({ id, value, onChange, invalid, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange} aria-invalid={invalid} autoComplete={autoComplete} required />
      <button type="button" className="toggle" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Enter your password.';
    setErrors(errs);
    setMessage('');
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await fetchJson('/api/auth/login', { method: 'POST', body: JSON.stringify(form) });
      router.replace(safeNext(params.get('next')));
      router.refresh();
    } catch (err) {
      setMessage(err.message || 'Unable to authenticate.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-invalid={!!errors.email} required />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <PasswordInput id="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} invalid={!!errors.password} autoComplete="current-password" />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>
      {message && <Notice kind="error">{message}</Notice>}
      <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
        {loading ? <><Loader2 size={16} className="spin" /> Signing in…</> : 'Log in'}
      </button>
      <p className="small muted">No account? <Link href="/register">Create one</Link> · <Link href="/dashboard">Continue as guest</Link></p>
    </form>
  );
}

export function RegisterForm({ states }) {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phoneNumber: '', city: '', stateCode: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.fullName.trim().length < 2) e.fullName = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address.';
    const p = passwordProblems(form.password);
    if (p.length) e.password = `Password needs ${p.join(', ')}.`;
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    if (!PHONE_RE.test(form.phoneNumber.trim())) e.phoneNumber = 'Enter a valid phone number (10–15 digits).';
    if (form.city.trim().length < 2) e.city = 'Enter your city.';
    if (!form.stateCode) e.stateCode = 'Select your state.';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setMessage('');
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      await fetchJson('/api/auth/register', { method: 'POST', body: JSON.stringify(form) });
      document.cookie = `ciq_state=${form.stateCode}; path=/; max-age=31536000; samesite=lax`;
      router.replace(`/dashboard?state=${form.stateCode}`);
      router.refresh();
    } catch (err) {
      setErrors(err.body?.fields || {});
      setMessage(err.message);
      setLoading(false);
    }
  };

  const input = (k, label, props = {}) => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input id={k} className="input" value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} required {...props} />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate>
      {input('fullName', 'Full name', { autoComplete: 'name' })}
      {input('email', 'Email', { type: 'email', autoComplete: 'email' })}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" value={form.password} onChange={set('password')} invalid={!!errors.password} autoComplete="new-password" />
          {errors.password ? <span className="field-error">{errors.password}</span> : <span className="hint">8+ characters with a letter and a number</span>}
        </div>
        <div className="field">
          <label htmlFor="confirmPassword">Confirm password</label>
          <PasswordInput id="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} invalid={!!errors.confirmPassword} autoComplete="new-password" />
          {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
        </div>
      </div>
      <div className="form-grid">
        {input('phoneNumber', 'Phone', { type: 'tel', autoComplete: 'tel', placeholder: '+91 98xxxxxxxx' })}
        {input('city', 'City', { autoComplete: 'address-level2' })}
      </div>
      <div className="field">
        <label htmlFor="stateCode">State / Union Territory</label>
        <select id="stateCode" className="select" value={form.stateCode} onChange={set('stateCode')} aria-invalid={!!errors.stateCode} required>
          <option value="">Select…</option>
          {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
        {errors.stateCode && <span className="field-error">{errors.stateCode}</span>}
      </div>
      {message && <Notice kind="error">{message}</Notice>}
      <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
        {loading ? <><Loader2 size={16} className="spin" /> Creating account…</> : 'Create account'}
      </button>
      <p className="small muted">Already registered? <Link href="/login">Log in</Link></p>
    </form>
  );
}
