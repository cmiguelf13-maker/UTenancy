import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | UTenancy',
  description: 'Tips, guides, and updates from the UTenancy team — student housing advice, landlord resources, and platform news.',
}

const POSTS = [
  {
    slug: 'how-to-find-off-campus-housing',
    tag: 'For Students',
    title: '5 Things to Look for When Finding Off-Campus Housing',
    excerpt: 'Moving off campus for the first time? Here\'s what to prioritize — from lease terms to landlord responsiveness — before you sign anything.',
    date: 'March 12, 2025',
    readTime: '5 min read',
  },
  {
    slug: 'lease-terms-explained',
    tag: 'Renting 101',
    title: 'Lease Terms Every Student Should Understand',
    excerpt: 'Security deposits, early termination clauses, subletting rights — we break down the clauses that matter most for student renters.',
    date: 'February 28, 2025',
    readTime: '7 min read',
  },
  {
    slug: 'landlord-tips-student-rentals',
    tag: 'For Landlords',
    title: 'How to Attract and Retain Great Student Tenants',
    excerpt: 'Student tenants can be your most reliable renters if you set the right expectations. Here\'s what works.',
    date: 'February 10, 2025',
    readTime: '6 min read',
  },
  {
    slug: 'group-housing-guide',
    tag: 'For Students',
    title: 'Renting With Roommates: A Complete Guide',
    excerpt: 'Everything you need to know about finding, vetting, and living with roommates — from group leases to splitting utilities fairly.',
    date: 'January 22, 2025',
    readTime: '8 min read',
  },
]

export default function BlogPage() {
  return (
    <main className="min-h-screen warm-grain dark-surface px-6 py-24">
      <div className="max-w-4xl mx-auto">

        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors font-body text-sm mb-10">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Back to UTenancy
        </Link>

        {/* Header */}
        <div className="mb-16">
          <span className="inline-flex items-center gap-2 border border-white/15 rounded-full px-4 py-1.5 text-xs font-head font-bold text-white/50 uppercase tracking-widest mb-6">
            Blog
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
            Resources &amp; <em className="text-sand">Insights</em>
          </h1>
          <p className="font-body text-white/60 text-lg leading-relaxed max-w-xl">
            Tips for students navigating off-campus life, guides for landlords, and updates from the UTenancy team.
          </p>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {POSTS.map((post) => (
            <article
              key={post.slug}
              className="border border-white/10 rounded-2xl p-6 bg-white/5 flex flex-col gap-4 hover:bg-white/[0.08] transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center border border-sand/30 rounded-full px-3 py-1 text-xs font-head font-bold text-sand/80 uppercase tracking-widest">
                  {post.tag}
                </span>
                <span className="font-body text-white/30 text-xs">{post.readTime}</span>
              </div>
              <div>
                <h2 className="font-head font-bold text-white text-lg mb-2 group-hover:text-sand transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="font-body text-white/50 text-sm leading-relaxed">{post.excerpt}</p>
              </div>
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="font-body text-white/30 text-xs">{post.date}</span>
                <span className="font-head font-bold text-sand/60 text-xs group-hover:text-sand transition-colors flex items-center gap-1">
                  Read more
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </article>
          ))}
        </div>

        {/* Coming soon notice */}
        <div className="mt-16 border border-white/10 rounded-2xl p-8 bg-white/5 text-center">
          <p className="font-head font-bold text-white/40 text-xs uppercase tracking-widest mb-3">More coming soon</p>
          <p className="font-body text-white/50 text-sm">
            We&apos;re actively building out our resource library. Join the waitlist to get notified when new guides drop.
          </p>
          <Link
            href="/#waitlist"
            className="inline-flex items-center gap-2 mt-6 clay-grad text-white px-5 py-2.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20"
          >
            Join the waitlist
          </Link>
        </div>

      </div>
    </main>
  )
}
