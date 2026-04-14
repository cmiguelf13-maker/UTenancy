import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | UTenancy',
  description: 'UTenancy is reimagining student housing — verified listings, built-in rent tools, and a landlord management platform.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen warm-grain dark-surface px-6 py-24">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors font-body text-sm mb-10">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to UTenancy
        </Link>

        {/* Header */}
        <div className="mb-16">
          <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/50 uppercase tracking-widest mb-6">
            Our Story
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
            Housing built for<br /><em className="text-sand">students, by students.</em>
          </h1>
          <p className="font-body text-white/60 text-lg leading-relaxed">
            UTenancy started with a simple frustration: finding off-campus housing as a student is exhausting, opaque, and unnecessarily stressful. We set out to fix that.
          </p>
        </div>

        {/* Mission */}
        <div className="space-y-12 font-body text-white/70 leading-relaxed">

          <section className="border border-white/10 rounded-2xl p-8 bg-white/5">
            <h2 className="font-head font-bold text-white text-xl mb-4">Our Mission</h2>
            <p>
              We believe every student deserves a safe, transparent, and stress-free path to off-campus housing. UTenancy connects students with verified landlords, provides tools to simplify every step of the renting process, and gives landlords a professional platform to manage their properties with ease.
            </p>
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-xl mb-4">Why UTenancy?</h2>
            <p className="mb-4">
              The student housing market has long been dominated by platforms built for the general public — not for the unique rhythms of academic life. Lease dates that don&apos;t align with semesters, listings with no proximity-to-campus data, no .edu verification, no group formation tools. We&apos;re changing all of that.
            </p>
            <p>
              For landlords, managing student rentals can be a full-time job. UTenancy&apos;s landlord management platform gives landlords the tools to list, screen, and manage tenants from a single dashboard — with subscription tiers that grow as their portfolio does.
            </p>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { stat: '100%', label: 'Focused on student housing' },
              { stat: '.edu', label: 'Verified student accounts' },
              { stat: '0 ads', label: 'Clean, distraction-free platform' },
            ].map(({ stat, label }) => (
              <div key={label} className="border border-white/10 rounded-2xl p-6 bg-white/5 text-center">
                <p className="font-display text-4xl text-sand font-light mb-2">{stat}</p>
                <p className="font-body text-white/50 text-sm">{label}</p>
              </div>
            ))}
          </section>

          <section>
            <h2 className="font-head font-bold text-white text-xl mb-4">Built With Care</h2>
            <p>
              UTenancy is an independent product crafted with care for the students and landlords who use it every day. We take privacy seriously, keep the platform ad-free, and build every feature with the end user in mind.
            </p>
          </section>

          <div className="pt-6">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30"
            >
              Get started free
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

        </div>
      </div>
    </main>
  )
}
