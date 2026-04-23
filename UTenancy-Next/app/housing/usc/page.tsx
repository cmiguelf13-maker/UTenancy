import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Student Housing Near USC — Off-Campus Apartments & Rooms',
  description: 'Find verified off-campus housing near the University of Southern California. Browse apartments, open rooms, and group housing in University Park, Exposition Park, West Adams, and Koreatown.',
  alternates: { canonical: 'https://utenancy.com/housing/usc' },
  openGraph: {
    title: 'Student Housing Near USC — UTenancy',
    description: 'Find verified off-campus apartments and rooms near USC in University Park, Exposition Park, West Adams, and Koreatown.',
    url: 'https://utenancy.com/housing/usc',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Housing Near USC — UTenancy',
    description: 'Verified off-campus apartments and rooms near the University of Southern California.',
    images: ['/og-image.png'],
  },
}

const NEIGHBORHOODS = [
  {
    name: 'University Park',
    distance: '5–15 min walk',
    rent: '$1,200–$1,700/bedroom',
    description: 'The neighborhood immediately surrounding USC\'s University Park campus. Walking distance to classes, the USC Village, and Exposition Park. Covered by USC\'s DPS patrol zone for added security.',
    tags: ['Walk to campus', 'DPS patrol zone', 'USC Village nearby'],
  },
  {
    name: 'Exposition Park',
    distance: '10–15 min walk',
    rent: '$1,100–$1,600/bedroom',
    description: 'Directly south of campus, home to the LA Memorial Coliseum and Natural History Museum. Quieter than the immediate campus area with a mix of older apartment buildings and recently renovated units.',
    tags: ['Quieter', 'Parks nearby', 'Slightly lower rent'],
  },
  {
    name: 'West Adams',
    distance: '15–25 min',
    rent: '$1,000–$1,500/bedroom',
    description: 'An up-and-coming neighborhood with beautiful historic architecture, great food, and a strong creative community. More space per dollar than the immediate campus area, and a short ride or bike to campus via Expo Line.',
    tags: ['More space', 'Historic homes', 'Great food scene'],
  },
  {
    name: 'Koreatown',
    distance: '15–20 min',
    rent: '$950–$1,400/bedroom',
    description: 'Best value per square foot near USC. Dense urban neighborhood with 24/7 dining, transit options, and a vibrant nightlife scene. Very popular with upperclassmen and grad students who want city living at a lower price.',
    tags: ['Best value', 'Metro access', '24/7 dining'],
  },
]

const FAQS = [
  {
    q: 'How do I find off-campus housing near USC?',
    a: 'UTenancy lists verified off-campus apartments, open rooms, and group housing near USC\'s University Park campus. Create a free student account, filter listings by distance to USC, and message landlords directly through the platform.',
  },
  {
    q: 'What is the average rent near USC?',
    a: 'Rent near USC depends on the neighborhood. University Park (closest to campus) averages $1,200–$1,700 per bedroom. Exposition Park runs $1,100–$1,600. West Adams and Koreatown offer better value at $950–$1,500 per bedroom. Sharing with roommates significantly lowers per-person costs.',
  },
  {
    q: 'Is it safe to live off-campus near USC?',
    a: 'USC\'s Department of Public Safety (DPS) patrols the University Park neighborhood and maintains a Safe Rides program. The safest blocks for students are generally north and east of campus. West Adams has improved significantly in recent years. As with any urban campus, situational awareness matters — UTenancy only lists properties from verified landlords.',
  },
  {
    q: 'When should I start looking for housing near USC?',
    a: 'Start your search in February or March for fall semester. The best units in University Park and Exposition Park lease by April. Waiting until May or June means fewer options and less room to negotiate on price or lease terms.',
  },
  {
    q: 'Is it better to live in University Park or West Adams near USC?',
    a: 'University Park is best for freshmen and anyone who wants to walk to campus and stay close to the social hub. West Adams offers more space, character, and lower rent — ideal for upperclassmen who are comfortable with a short commute and want a more neighborhood feel.',
  },
  {
    q: 'Can I find roommates for USC housing on UTenancy?',
    a: 'Yes. UTenancy supports two listing types: open rooms (one vacancy in an existing unit) and group formations (a group of students looking to form a household together). Both are available near USC.',
  },
]

export default function USCPage() {
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
      { '@type': 'ListItem', position: 2, name: 'Student Housing Near USC', item: 'https://utenancy.com/housing/usc' },
    ],
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'UTenancy — Student Housing Near USC',
    description: 'Verified off-campus student housing listings near the University of Southern California in University Park, Exposition Park, and West Adams.',
    url: 'https://utenancy.com/housing/usc',
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
              <span className="text-clay font-semibold">Student Housing Near USC</span>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/80 border border-out-var rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">University of Southern California</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-medium text-espresso leading-tight mb-6">
              Off-Campus Housing<br />
              <em className="text-terracotta">Near USC</em>
            </h1>

            <p className="font-body text-stone/70 text-lg leading-relaxed max-w-2xl mb-10">
              Find verified apartments, open rooms, and group housing in University Park, Exposition Park, West Adams, and Koreatown — the neighborhoods closest to USC&apos;s University Park campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/listings?university=usc"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20"
              >
                Browse Listings Near USC
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
                { label: 'Avg. rent (University Park)', value: '$1,200–$1,700/mo' },
                { label: 'Closest neighborhood', value: 'University Park' },
                { label: 'Best value', value: 'Koreatown' },
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
              Best neighborhoods near USC
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Each neighborhood offers a different balance of commute time, price, and lifestyle. Here&apos;s how they compare for USC students.
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
              How UTenancy works for USC students
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Find, apply, and move in — without the spam calls and sketchy Craigslist listings.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create your free account', body: 'Sign up with your USC email. Verification confirms you\'re a real Trojan, which landlords near campus value.' },
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
            <p className="font-body text-stone/60 mb-12">Everything USC students ask about off-campus housing.</p>

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
              Ready to find your place<br /><em className="text-sand">near USC?</em>
            </h2>
            <p className="font-body text-white/60 mb-8">
              Free for students. Verified landlords. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/listings?university=usc"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-7 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30"
              >
                Browse listings near USC
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
