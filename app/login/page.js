import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import AuthLayout from '@/components/AuthLayout';
import { LoginForm } from '@/components/AuthForms';

export const metadata = { title: 'Log in' };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  return (
    <AuthLayout title="Welcome back" subtitle="Log in to your ClimateIQ account.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
