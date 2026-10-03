'use client';
import { ErrorState } from '@/components/ui';

export default function AppError({ reset }) {
  return (
    <div className="card">
      <ErrorState title="Something went wrong" message="This section could not be loaded. Please try again." onRetry={reset} />
    </div>
  );
}
