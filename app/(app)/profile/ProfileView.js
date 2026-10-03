'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Trash2 } from 'lucide-react';
import { useSelectedState } from '@/components/SelectedStateProvider';
import { Notice } from '@/components/ui';
import { fetchJson } from '@/lib/client/useApi';
import { fmtDateTime } from '@/lib/format';

export default function ProfileView({ user: initial, counts }) {
  const router = useRouter();
  const { states } = useSelectedState();
  const [user, setUser] = useState(initial);
  const [form, setForm] = useState({ fullName: initial.fullName, phoneNumber: initial.phoneNumber, city: initial.city, stateCode: initial.state?.code || '' });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setErrors({});
    try {
      const { user: updated } = await fetchJson('/api/profile', { method: 'PATCH', body: JSON.stringify(form) });
      setUser(updated);
      setStatus({ kind: 'info', text: 'Profile updated.' });
      router.refresh();
    } catch (err) {
      setErrors(err.body?.fields || {});
      setStatus({ kind: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Permanently delete your account, favorites and search history? This cannot be undone.')) return;
    await fetchJson('/api/profile', { method: 'DELETE' });
    router.replace('/');
    router.refresh();
  };

  const field = (k, label, props = {}) => (
    <div className="field">
      <label htmlFor={`p-${k}`}>{label}</label>
      <input id={`p-${k}`} className="input" value={form[k]} onChange={set(k)} aria-invalid={!!errors[k]} required {...props} />
      {errors[k] && <span className="field-error">{errors[k]}</span>}
    </div>
  );

  return (
    <>
      <div className="page-head">
        <div>
          <div className="eyebrow">Account</div>
          <h1>Profile</h1>
          <p className="lead">Read and update your record in the users table.</p>
        </div>
      </div>
      <div className="grid grid-dash">
        <section className="card">
          <div className="card-header"><div><h2>Edit profile</h2><div className="sub">Email cannot be changed.</div></div></div>
          <form className="stack" onSubmit={save} noValidate>
            <div className="form-grid">
              {field('fullName', 'Full name', { autoComplete: 'name' })}
              <div className="field"><label htmlFor="p-email">Email</label><input id="p-email" className="input" value={user.email} disabled /></div>
              {field('phoneNumber', 'Phone', { type: 'tel', autoComplete: 'tel' })}
              {field('city', 'City', { autoComplete: 'address-level2' })}
              <div className="field">
                <label htmlFor="p-state">State / UT</label>
                <select id="p-state" className="select" value={form.stateCode} onChange={set('stateCode')} aria-invalid={!!errors.stateCode} required>
                  <option value="">Select…</option>
                  {states.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
                {errors.stateCode && <span className="field-error">{errors.stateCode}</span>}
              </div>
            </div>
            {status && <Notice kind={status.kind}>{status.text}</Notice>}
            <div className="row">
              <button className="btn btn-primary" type="submit" disabled={saving}><Check size={15} /> {saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        </section>
        <div className="side-col">
          <section className="card">
            <h2>Account details</h2>
            <dl className="stack small" style={{ margin: '0.8rem 0 0' }}>
              <div className="row-between"><dt className="muted">Name</dt><dd style={{ margin: 0 }}>{user.fullName}</dd></div>
              <div className="row-between"><dt className="muted">Email</dt><dd style={{ margin: 0 }}>{user.email}</dd></div>
              <div className="row-between"><dt className="muted">Phone</dt><dd style={{ margin: 0 }}>{user.phoneNumber}</dd></div>
              <div className="row-between"><dt className="muted">City</dt><dd style={{ margin: 0 }}>{user.city}</dd></div>
              <div className="row-between"><dt className="muted">State</dt><dd style={{ margin: 0 }}>{user.state?.name || '—'}</dd></div>
              <div className="row-between"><dt className="muted">Account created</dt><dd style={{ margin: 0 }}>{fmtDateTime(user.createdAt)}</dd></div>
              <div className="row-between"><dt className="muted">Last updated</dt><dd style={{ margin: 0 }}>{fmtDateTime(user.updatedAt)}</dd></div>
              <div className="row-between"><dt className="muted">Favorites · searches · sessions</dt><dd style={{ margin: 0 }}>{counts.favorites} · {counts.searchHistory} · {counts.sessions}</dd></div>
            </dl>
          </section>
          <section className="card">
            <h2>Delete account</h2>
            <p className="small muted" style={{ margin: '0.4rem 0 0.8rem' }}>Removes your user row. Favorites, search history and sessions are deleted automatically by ON DELETE CASCADE.</p>
            <button type="button" className="btn btn-danger" onClick={deleteAccount}><Trash2 size={15} /> Delete my account</button>
          </section>
        </div>
      </div>
    </>
  );
}
