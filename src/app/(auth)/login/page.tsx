import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Schedulo Lite',
};

export default function LoginPage() {
  return <LoginForm />;
}
