import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Landlord Dashboard',
  description: 'Manage your student housing listings, review applicants, and track your portfolio on UTenancy.',
  robots: { index: false, follow: false },
}

export default function LandlordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
