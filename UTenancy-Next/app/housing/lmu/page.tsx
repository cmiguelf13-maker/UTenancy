import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Student Housing Near LMU — Off-Campus Apartments & Rooms',
  description: 'Find verified off-campus housing near Loyola Marymount University. Browse apartments, open rooms, and group housing in Playa Vista, Westchester, and Culver City.',
  alternates: { canonical: 'https://utenancy.com/housing/lmu' },
  openGraph: {
    title: 'Student Housing Near LMU — UTenancy',
    description: 'Find verified off-campus apartments and rooms near Loyola Marymount University in Playa Vista, Westchester, and Culver City.',
    url: 'https://utenancy.com/housing/lmu',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Housing Near LMU — UTenancy',
    description: 'Verified off-campus apartments and rooms near Loyola Marymount University.',
    images: ['/og-image.png'],
  },
}

const NEIGHBORHOODS = [
  {
    name: 'Playa Vista',
    distance: '5–10 min',
    rent: '$1,400–$1,900/bedroom',
    description: 'Newest construction, walkable to coffee and dining. Popular with LMU students and the tech crowd. Safe, well-lit streets and easy bike access via Ballona Creek path.',
    tags: ['Bike-friendly', 'Newer buildings', 'Walkable'],
  },
  {
    name: 'Westchester',
    distance: '5–10 min walk',
    rent: '$1,000–$1,500/bedroom',
    description: 'Closest neighborhood to LMU\'s campus gates. Quiet and residential — ideal for students who want to walk or bike to class without paying beach-area prices.',
    tags: ['Walk to campus', 'Most affordable', 'Quiet'],
  },
  {
    name: 'Culver City',
    distance: '15–20 min',
    rent: '$1,200–$1,700/bedroom',
    description: 'Vibrant dining scene, Metro Expo Line access, and a lively downtown strip. Great for upperclassmen who want LA culture without paying Westside premiums.',
    tags: ['Metro access', 'Great dining', 'Arts scene'],
  },
  {
    name: 'Mar Vista',
    distance: '15–20 min',
    rent: '$1,100–$1,600/bedroom',
    description: 'Spacious apartments at lower prices than Playa Vista. Family-friendly and quiet, with easy access to Culver City and the beach via surface streets.',
    tags: ['More space', 'Lower rent', 'Beach access'],
  },
]

const FAQS = [
  {
    q: 'How do I find off-campus housing near LMU?',
    a: 'UTenancy lists verified off-campus apartments, open rooms, and group housing within proximity to LMU\'s Westchester campus. Create a free student account, browse listings filtered by distance, and message landlords directly through the platform.',
  },
  {
    q: 'What is the average rent near LMU?',
    a: 'Rent near LMU varies by neighborhood. Westchester (closest to campus) averages $1,000–$1,500 per bedroom. Playa Vista runs $1,400–$1,900. Culver City and Mar Vista fall in the $1,100–$1,700 range. Shared housing with roommates can bring per-person costs significantly lower.',
  },
  {
    q: 'When should I start looking for off-campus housing near LMU?',
    a: 'Start your search in April or May for fall semester. The best units near LMU go fast — many landlords list in spring for August move-ins. Waiting until July means less selection and less negotiating room on price.',
  },
  {
    q: 'Is it better to live in Playa Vista or Westchester near LMU?',
    a: 'Westchester is ideal for students who want to walk to campus and keep costs low. Playa Vista offers newer construction and more amenities at a higher price point, and is still a short bike ride to campus. Both are excellent choices depending on your budget and lifestyle.',
  },
  {
    q: 'Does UTenancy verify landlords near LMU?',
    a: 'Yes. All landlords on UTenancy go through a verification process before their listings go live. Students can message landlords, request tours, and apply — all within the platform.',
  },
  {
    q: 'Can I find roommates for LMU housing on UTenancy?',
    a: 'Yes. UTenancy supports two listing types: open rooms (one vacancy in an existing unit) and group formations (a group of students looking to form a household together). Both are available near LMU.',
  },
]

export default function LMUPage() {
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
      { '@type': 'ListItem', position: 2, name: 'Student Housing Near LMU', item: 'https://utenancy.com/housing/lmu' },
    ],
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'UTenancy — Student Housing Near LMU',
    description: 'Verified off-campus student housing listings near Loyola Marymount University in Westchester, Playa Vista, and Culver City.',
    url: 'https://utenancy.com/housing/lmu',
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
              <span className="text-clay font-semibold">Student Housing Near LMU</span>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/80 border border-out-var rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">Loyola Marymount University</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-medium text-espresso leading-tight mb-6">
              Off-Campus Housing<br />
              <em className="text-terracotta">Near LMU</em>
            </h1>

            <p className="font-body text-stone/70 text-lg leading-relaxed max-w-2xl mb-10">
              Find verified apartments, open rooms, and group housing in Westchester, Playa Vista, and Culver City — the neighborhoods closest to Loyola Marymount University's Westchester campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/listings?university=lmu"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20"
              >
                Browse Listings Near LMU
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
                { label: 'Best value', value: 'Mar Vista' },
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
              Best neighborhoods near LMU
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Each neighborhood offers a different balance of commute time, price, and lifestyle. Here's how they compare for LMU students.
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
              How UTenancy works for LMU students
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Find, apply, and move in — without the spam calls and sketchy Craigslist listings.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create your free account', body: 'Sign up with your .edu email. Verification confirms you\'re a real LMU student, which landlords value.' },
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
            <p className="font-body text-stone/60 mb-12">Everything LMU students ask about off-campus housing.</p>

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
              Ready to find your place<br /><em className="text-sand">near LMU?</em>
            </h2>
            <p className="font-body text-white/60 mb-8">
              Free for students. Verified landlords. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/listings?university=lmu"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-7 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30"
              >
                Browse listings near LMU
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
