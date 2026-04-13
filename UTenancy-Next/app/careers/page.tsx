import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers | UTenancy',
  description: 'Join the UTenancy team. We\'re building the future of student housing — come help us do it.',
}

export default function CareersPage() {
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
            Careers
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
            Help us build the<br /><em className="text-sand">future of renting.</em>
          </h1>
          <p className="font-body text-white/60 text-lg leading-relaxed">
            UTenancy is an early-stage startup on a mission to make student housing better for everyone. We move fast, care deeply about product quality, and value people who take ownership.
          </p>
        </div>

        <div className="space-y-12 font-body text-white/70 leading-relaxed">

          {/* Values */}
          <section>
            <h2 className="font-head font-bold text-white text-xl mb-6">What we value</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: 'rocket_launch', title: 'Bias for action', body: 'We ship quickly, learn from feedback, and iterate without waiting for perfect.' },
                { icon: 'groups', title: 'User obsession', body: 'Every decision starts with what\'s best for the student or landlord on the other end.' },
                { icon: 'build', title: 'Craft', body: 'We care about the details — in code, design, and communication.' },
                { icon: 'visibility', title: 'Transparency', body: 'We share context openly, give honest feedback, and expect the same.' },
              ].map(({ icon, title, body }) => (
                <div key={title} className="border border-white/10 rounded-2xl p-6 bg-white/5">
                  <span className="material-symbols-outlined text-sand text-2xl mb-3 block">{icon}</span>
                  <h3 className="font-head font-bold text-white text-sm mb-2">{title}</h3>
                  <p className="font-body text-white/50 text-sm">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Open roles */}
          <section>
            <h2 className="font-head font-bold text-white text-xl mb-6">Open roles</h2>
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-white/20 text-5xl mb-4 block">work_outline</span>
                <p className="font-head font-bold text-white/50 text-sm uppercase tracking-widest mb-2">No open roles right now</p>
                <p className="font-body text-white/40 text-sm max-w-sm mx-auto mb-4">
                  We&apos;re a lean team today, but we&apos;re growing. Drop us a line at{' '}
                  <a href="mailto:cfernandez@utenancy.com" className="text-sand hover:text-sand/80 transition-colors">
                    cfernandez@utenancy.com
                  </a>{' '}
                  if you&apos;d like to be considered when roles open up.
                </p>
                <p className="font-body text-white/30 text-xs max-w-xs mx-auto border-t border-white/10 pt-4">
                  Have a proposal, partnership idea, or collaboration in mind?{' '}
                  <a href="mailto:cfernandez@utenancy.com" className="text-sand/70 hover:text-sand transition-colors">
                    Reach out — we&apos;d love to hear it.
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="border border-white/10 rounded-2xl p-8 bg-white/5">
            <h2 className="font-head font-bold text-white text-lg mb-3">Stay in the loop</h2>
            <p className="font-body text-white/50 text-sm mb-6">
              Join our waitlist and you&apos;ll be among the first to hear about open roles, product updates, and early access opportunities.
            </p>
            <Link
              href="/#waitlist"
              className="inline-flex items-center gap-2 clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30"
            >
              Join the waitlist
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
          </div>

        </div>
      </div>
    </main>
  )
}
