import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Log in or create your UTenancy account to find student housing or manage your listings.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
