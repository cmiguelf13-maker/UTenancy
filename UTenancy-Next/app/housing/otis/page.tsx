import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Student Housing Near Otis College — Off-Campus Apartments & Rooms',
  description: 'Find verified off-campus housing near Otis College of Art and Design. Browse apartments, open rooms, and group housing in Westchester, El Segundo, Playa Vista, and Marina del Rey.',
  alternates: { canonical: 'https://utenancy.com/housing/otis' },
  openGraph: {
    title: 'Student Housing Near Otis College — UTenancy',
    description: 'Find verified off-campus apartments and rooms near Otis College of Art and Design in Westchester, El Segundo, Playa Vista, and Marina del Rey.',
    url: 'https://utenancy.com/housing/otis',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Housing Near Otis College — UTenancy',
    description: 'Verified off-campus apartments and rooms near Otis College of Art and Design.',
    images: ['/og-image.png'],
  },
}

const NEIGHBORHOODS = [
  {
    name: 'Westchester',
    distance: '5–10 min walk',
    rent: '$1,000–$1,500/bedroom',
    description: 'The closest residential neighborhood to Otis College\'s Lincoln Blvd campus. Quiet, affordable, and walkable — ideal for students who want to minimize commute time without paying beach-area prices. A genuinely underrated area.',
    tags: ['Walk to campus', 'Most affordable', 'Quiet streets'],
  },
  {
    name: 'Playa Vista',
    distance: '5–10 min',
    rent: '$1,400–$1,900/bedroom',
    description: 'Modern apartment buildings, a walkable town center, and easy access to Ballona Creek bike path. Slightly pricier than Westchester but offers newer units with more amenities. Popular with creative professionals and grad students.',
    tags: ['Newer buildings', 'Bike-friendly', 'Walkable'],
  },
  {
    name: 'El Segundo',
    distance: '10–15 min south',
    rent: '$1,100–$1,600/bedroom',
    description: 'A quiet, small-city feel south of LAX with a charming Main Street, great coffee shops, and more square footage per dollar than Playa Vista. Very safe and family-friendly — good for students who want calm and space.',
    tags: ['More space', 'Small-city feel', 'Very safe'],
  },
  {
    name: 'Marina del Rey',
    distance: '10–15 min',
    rent: '$1,600–$2,200/bedroom',
    description: 'Premium waterfront living with marina views, beach access, and upscale dining. Best for upperclassmen or students with roommates who want a higher-end experience. The 30-mile bike path along the coast is steps away.',
    tags: ['Marina views', 'Beach access', 'Bike path'],
  },
]

const FAQS = [
  {
    q: 'How do I find off-campus housing near Otis College of Art and Design?',
    a: 'UTenancy lists verified off-campus apartments, open rooms, and group housing near Otis College\'s Lincoln Blvd campus in Westchester. Create a free student account, filter listings by distance to Otis, and message landlords directly through the platform.',
  },
  {
    q: 'What is the average rent near Otis College?',
    a: 'Westchester, the closest neighborhood, averages $1,000–$1,500 per bedroom — making it one of the more affordable options near an LA arts campus. Playa Vista and El Segundo run $1,100–$1,900. Marina del Rey offers a premium experience at $1,600–$2,200 per bedroom.',
  },
  {
    q: 'What neighborhoods are closest to Otis College?',
    a: 'Otis is located on Lincoln Blvd in Westchester, which is directly walkable from campus. Playa Vista is a 5–10 minute drive or bike ride. El Segundo and Marina del Rey are 10–15 minutes away. All offer good access without dealing with heavy LA traffic.',
  },
  {
    q: 'When should I start looking for housing near Otis?',
    a: 'Start in March or April for fall semester. Westchester is less competitive than neighborhoods near larger schools, but good units still lease by May or June. Waiting until July limits your selection significantly.',
  },
  {
    q: 'Do Otis students typically live alone or with roommates?',
    a: 'Both are common. Many Otis students, especially those in studio-intensive programs, prefer the quiet of a solo apartment. Others prefer roommates to keep costs manageable. UTenancy supports both: solo open rooms and group formations for those building a house together.',
  },
  {
    q: 'Can I find roommates for Otis College housing on UTenancy?',
    a: 'Yes. UTenancy supports two listing types: open rooms (one vacancy in an existing unit) and group formations (a group of students looking to form a household together). Both are available near Otis College.',
  },
]

export default function OtisPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://utenancy.com' },
      { '@type': 'ListItem', position: 2, name: 'Student Housing Near Otis College', item: 'https://utenancy.com/housing/otis' },
    ],
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'UTenancy — Student Housing Near Otis College of Art and Design',
    description: 'Verified off-campus student housing listings near Otis College of Art and Design in Westchester, El Segundo, Playa Vista, and Marina del Rey.',
    url: 'https://utenancy.com/housing/otis',
    areaServed: [
      { '@type': 'City', name: 'Los Angeles', sameAs: 'https://en.wikipedia.org/wiki/Los_Angeles' },
    ],
    serviceType: 'Student Housing',
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <main className="min-h-screen bg-cream">

        {/* ── HERO ─────────────────────────────────── */}
        <section className="relative overflow-hidden pt-28 pb-20 px-6 md:px-10">
          <div className="absolute -top-40 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ background: 'radial-gradient(circle,#fec8b6,#9c7060)' }} />

          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-muted font-body mb-8">
              <Link href="/" className="hover:text-clay transition-colors">Home</Link>
              <span>/</span>
              <span className="text-clay font-semibold">Student Housing Near Otis College</span>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/80 border border-out-var rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">Otis College of Art and Design</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-medium text-espresso leading-tight mb-6">
              Off-Campus Housing<br />
              <em className="text-terracotta">Near Otis College</em>
            </h1>

            <p className="font-body text-stone/70 text-lg leading-relaxed max-w-2xl mb-10">
              Find verified apartments, open rooms, and group housing in Westchester, Playa Vista, El Segundo, and Marina del Rey — the neighborhoods closest to Otis College of Art and Design.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/listings?university=otis"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20"
              >
                Browse Listings Near Otis
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 400" }}>arrow_forward</span>
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 bg-white border border-out-var text-clay-dark px-6 py-3.5 rounded-full font-head font-bold text-sm hover:border-sand transition-all"
              >
                Sign Up Free
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-6 mt-12 pt-10 border-t border-out-var">
              {[
                { label: 'Avg. rent (Westchester)', value: '$1,000–$1,500/mo' },
                { label: 'Closest neighborhood', value: 'Westchester' },
                { label: 'Best value', value: 'El Segundo' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted font-body uppercase tracking-widest mb-1">{label}</p>
                  <p className="font-head font-bold text-clay-dark text-base">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NEIGHBORHOODS ─────────────────────────── */}
        <section className="py-20 px-6 md:px-10 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-medium text-espresso mb-3">
              Best neighborhoods near Otis College
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Each neighborhood offers a different balance of commute time, price, and lifestyle. Here&apos;s how they compare for Otis students.
            </p>

            <div className="grid md:grid-cols-2 gap-5">
              {NEIGHBORHOODS.map((n) => (
                <div key={n.name} className="border border-out-var rounded-2xl p-6 bg-cream hover:border-sand transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-head font-bold text-espresso text-lg">{n.name}</h3>
                    <span className="text-xs font-head font-semibold text-terracotta bg-linen px-2.5 py-1 rounded-full whitespace-nowrap ml-3">{n.distance}</span>
                  </div>
                  <p className="text-sm font-head font-semibold text-clay mb-2">{n.rent}</p>
                  <p className="font-body text-stone/70 text-sm leading-relaxed mb-4">{n.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {n.tags.map((tag) => (
                      <span key={tag} className="text-xs font-body text-muted border border-out-var rounded-full px-2.5 py-0.5">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────── */}
        <section className="py-20 px-6 md:px-10 bg-linen">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-medium text-espresso mb-3">
              How UTenancy works for Otis students
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Find, apply, and move in — without the spam calls and sketchy Craigslist listings.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create your free account', body: 'Sign up with your Otis email. Verification confirms you\'re a real Otis student, which landlords near Westchester value.' },
                { step: '02', title: 'Browse verified listings', body: 'Filter by neighborhood, price, bedrooms, and room type. Every landlord on UTenancy is verified before listings go live.' },
                { step: '03', title: 'Message landlords directly', body: 'No middleman. Message landlords, schedule tours, and submit your application — all through the platform.' },
              ].map(({ step, title, body }) => (
                <div key={step} className="bg-white rounded-2xl p-6 border border-out-var">
                  <span className="font-display text-5xl font-light text-sand/60 block mb-4">{step}</span>
                  <h3 className="font-head font-bold text-espresso mb-2">{title}</h3>
                  <p className="font-body text-stone/60 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 clay-grad text-white px-7 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20"
              >
                Get started — it&apos;s free
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 400" }}>arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────── */}
        <section className="py-20 px-6 md:px-10 bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-medium text-espresso mb-3">
              Frequently asked questions
            </h2>
            <p className="font-body text-stone/60 mb-12">Everything Otis students ask about off-campus housing.</p>

            <div className="divide-y divide-out-var">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group py-5">
                  <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
                    <span className="font-head font-semibold text-espresso text-base">{q}</span>
                    <span className="material-symbols-outlined text-muted flex-shrink-0 group-open:rotate-180 transition-transform" style={{ fontVariationSettings: "'wght' 300" }}>expand_more</span>
                  </summary>
                  <p className="font-body text-stone/70 text-sm leading-relaxed mt-3 pr-8">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── BLOG CTA ─────────────────────────────── */}
        <section className="py-16 px-6 md:px-10 bg-cream border-t border-out-var">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-medium text-espresso mb-8">Related guides</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { href: '/blog/how-to-find-off-campus-housing-los-angeles', tag: 'For Students', title: '5 Things to Look for When Finding Off-Campus Housing in LA' },
                { href: '/blog/best-neighborhoods-students-los-angeles', tag: 'For Students', title: 'Best Neighborhoods for Students Near LMU, USC, and UCLA' },
                { href: '/blog/renting-with-roommates-complete-guide', tag: 'Renting 101', title: 'Renting With Roommates: A Complete Guide' },
              ].map(({ href, tag, title }) => (
                <Link key={href} href={href} className="group block p-5 bg-white rounded-xl border border-out-var hover:border-sand transition-colors">
                  <span className="text-xs font-head font-bold text-terracotta uppercase tracking-widest block mb-2">{tag}</span>
                  <p className="font-head font-semibold text-espresso text-sm group-hover:text-clay transition-colors leading-snug">{title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ─────────────────────────────── */}
        <section className="py-20 px-6 md:px-10 warm-grain dark-surface">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-4">
              Ready to find your place<br /><em className="text-sand">near Otis?</em>
            </h2>
            <p className="font-body text-white/60 mb-8">
              Free for students. Verified landlords. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/listings?university=otis"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-7 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30"
              >
                Browse listings near Otis
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-7 py-3.5 rounded-full font-head font-bold text-sm hover:bg-white/15 transition-all"
              >
                Create free account
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
