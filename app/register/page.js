import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getStates } from '@/lib/riskService';
import AuthLayout from '@/components/AuthLayout';
import { RegisterForm } from '@/components/AuthForms';

export const metadata = { title: 'Register' };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect('/dashboard');
  const states = await getStates();
  return (
    <AuthLayout title="Create your account" subtitle="Save favorite states and keep your search history.">
      <RegisterForm states={states.map(({ code, name }) => ({ code, name }))} />
    </AuthLayout>
  );
}
