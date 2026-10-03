import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="state-box" style={{ minHeight: '100vh' }}>
      <div className="eyebrow">404</div>
      <h1>Page not found</h1>
      <p className="muted">The page you were looking for does not exist.</p>
      <Link className="btn btn-primary" href="/dashboard">Go to dashboard</Link>
    </main>
  );
}
