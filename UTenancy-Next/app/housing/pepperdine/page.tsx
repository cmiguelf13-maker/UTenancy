import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Student Housing Near Pepperdine — Off-Campus Apartments & Rooms',
  description: 'Find verified off-campus housing near Pepperdine University. Browse apartments, open rooms, and group housing in Malibu, Pacific Palisades, Agoura Hills, and Calabasas.',
  alternates: { canonical: 'https://utenancy.com/housing/pepperdine' },
  openGraph: {
    title: 'Student Housing Near Pepperdine — UTenancy',
    description: 'Find verified off-campus apartments and rooms near Pepperdine University in Malibu, Pacific Palisades, Agoura Hills, and Calabasas.',
    url: 'https://utenancy.com/housing/pepperdine',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Housing Near Pepperdine — UTenancy',
    description: 'Verified off-campus apartments and rooms near Pepperdine University in Malibu.',
    images: ['/og-image.png'],
  },
}

const NEIGHBORHOODS = [
  {
    name: 'Malibu (Campus Area)',
    distance: '5–15 min',
    rent: '$1,800–$2,500/bedroom',
    description: 'Living closest to campus means stunning ocean views, easy access to Zuma Beach, and a short commute up PCH. Selection is limited and prices are high, but the lifestyle is unlike any other college experience in LA.',
    tags: ['Ocean views', 'Shortest commute', 'Beach lifestyle'],
  },
  {
    name: 'Pacific Palisades',
    distance: '15–20 min south',
    rent: '$1,600–$2,200/bedroom',
    description: 'Upscale and walkable, with a charming village center and easy beach access. More apartments and rentals than central Malibu, and still only 15–20 minutes from campus via PCH on a good traffic day.',
    tags: ['More options', 'Village feel', 'Beach access'],
  },
  {
    name: 'Agoura Hills',
    distance: '20–25 min inland',
    rent: '$1,200–$1,700/bedroom',
    description: 'The most affordable option for Pepperdine students. A quiet, suburban community in the Conejo Valley with good freeway access via the 101. Significantly more space per dollar than anything on the coast.',
    tags: ['Most affordable', 'More space', 'Suburban quiet'],
  },
  {
    name: 'Calabasas',
    distance: '20–25 min',
    rent: '$1,400–$1,900/bedroom',
    description: 'Well-maintained suburban city with excellent schools, safe streets, and a surprisingly good dining and shopping scene at The Commons. Popular with Pepperdine students who want comfort and space without the Malibu price tag.',
    tags: ['Safe community', 'Great amenities', 'The Commons nearby'],
  },
]

const FAQS = [
  {
    q: 'How do I find off-campus housing near Pepperdine?',
    a: 'UTenancy lists verified off-campus apartments, open rooms, and group housing near Pepperdine\'s Malibu campus. Create a free student account, browse listings filtered by distance to Pepperdine, and message landlords directly through the platform.',
  },
  {
    q: 'What is the average rent near Pepperdine in Malibu?',
    a: 'Malibu rentals close to campus average $1,800–$2,500 per bedroom, making it one of the most expensive student housing markets in LA. Pacific Palisades is slightly more accessible at $1,600–$2,200. Agoura Hills and Calabasas offer significantly lower rents ($1,200–$1,900) for students willing to commute.',
  },
  {
    q: 'Do many Pepperdine students live off-campus?',
    a: 'Yes — especially juniors, seniors, and graduate students. On-campus housing at Pepperdine is popular for freshmen and sophomores, but many upperclassmen move to Malibu apartments, Pacific Palisades, or further inland for more space and privacy.',
  },
  {
    q: 'When should I start looking for housing near Pepperdine?',
    a: 'Start in January or February for fall semester. Malibu has very limited rental supply and landlords know it — good units often lease by March or April. Waiting until summer gives you little leverage and slim pickings near campus.',
  },
  {
    q: 'Is it worth living in Malibu vs commuting from Pacific Palisades?',
    a: 'Malibu is worth it if budget allows and you value the on-campus atmosphere and beach lifestyle. Pacific Palisades offers more rental variety at a slightly lower price point, with a manageable 15–20 minute commute. For students on tighter budgets, Agoura Hills is a practical and spacious alternative.',
  },
  {
    q: 'Can I find roommates for Pepperdine housing on UTenancy?',
    a: 'Yes. UTenancy supports two listing types: open rooms (one vacancy in an existing unit) and group formations (a group of students looking to form a household together). Both are available near Pepperdine — and splitting Malibu rent with roommates makes a huge difference.',
  },
]

export default function PepperdinePage() {
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
      { '@type': 'ListItem', position: 2, name: 'Student Housing Near Pepperdine', item: 'https://utenancy.com/housing/pepperdine' },
    ],
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'UTenancy — Student Housing Near Pepperdine University',
    description: 'Verified off-campus student housing listings near Pepperdine University in Malibu, Pacific Palisades, and Agoura Hills.',
    url: 'https://utenancy.com/housing/pepperdine',
    areaServed: [
      { '@type': 'City', name: 'Malibu', sameAs: 'https://en.wikipedia.org/wiki/Malibu,_California' },
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
              <span className="text-clay font-semibold">Student Housing Near Pepperdine</span>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/80 border border-out-var rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">Pepperdine University</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-medium text-espresso leading-tight mb-6">
              Off-Campus Housing<br />
              <em className="text-terracotta">Near Pepperdine</em>
            </h1>

            <p className="font-body text-stone/70 text-lg leading-relaxed max-w-2xl mb-10">
              Find verified apartments, open rooms, and group housing in Malibu, Pacific Palisades, Agoura Hills, and Calabasas — the neighborhoods closest to Pepperdine University&apos;s Malibu campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/listings?university=pepperdine"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20"
              >
                Browse Listings Near Pepperdine
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
                { label: 'Avg. rent (Malibu area)', value: '$1,800–$2,500/mo' },
                { label: 'Closest neighborhood', value: 'Malibu' },
                { label: 'Best value', value: 'Agoura Hills' },
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
              Best neighborhoods near Pepperdine
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Each neighborhood offers a different balance of commute time, price, and lifestyle. Here&apos;s how they compare for Pepperdine students.
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
              How UTenancy works for Pepperdine students
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Find, apply, and move in — without the spam calls and sketchy Craigslist listings.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create your free account', body: 'Sign up with your Pepperdine email. Verification confirms you\'re a real Wave, which landlords near Malibu prefer.' },
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
            <p className="font-body text-stone/60 mb-12">Everything Pepperdine students ask about off-campus housing.</p>

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
              Ready to find your place<br /><em className="text-sand">near Pepperdine?</em>
            </h2>
            <p className="font-body text-white/60 mb-8">
              Free for students. Verified landlords. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/listings?university=pepperdine"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-7 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30"
              >
                Browse listings near Pepperdine
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
