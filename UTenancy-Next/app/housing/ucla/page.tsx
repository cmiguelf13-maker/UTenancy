import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Student Housing Near UCLA — Off-Campus Apartments & Rooms',
  description: 'Find verified off-campus housing near UCLA. Browse apartments, open rooms, and group housing in Westwood, Palms, Brentwood, and Culver City.',
  alternates: { canonical: 'https://utenancy.com/housing/ucla' },
  openGraph: {
    title: 'Student Housing Near UCLA — UTenancy',
    description: 'Find verified off-campus apartments and rooms near UCLA in Westwood, Palms, Brentwood, and Culver City.',
    url: 'https://utenancy.com/housing/ucla',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Housing Near UCLA — UTenancy',
    description: 'Verified off-campus apartments and rooms near UCLA.',
    images: ['/og-image.png'],
  },
}

const NEIGHBORHOODS = [
  {
    name: 'Westwood',
    distance: '5–15 min walk',
    rent: '$1,700–$2,300/bedroom',
    description: 'The premier UCLA student neighborhood — walkable to campus, packed with restaurants, coffee shops, and retail along Westwood Blvd. The most convenient option, but the most expensive. Fills up fast every spring.',
    tags: ['Walk to campus', 'Most convenient', 'Prime location'],
  },
  {
    name: 'Palms',
    distance: '15–20 min',
    rent: '$1,200–$1,700/bedroom',
    description: 'The best value neighborhood close to UCLA. Mostly apartment buildings with more square footage per dollar than Westwood. A short bus or bike ride to campus via Westwood Blvd. Popular with upperclassmen and grad students.',
    tags: ['Best value', 'More space', 'Easy commute'],
  },
  {
    name: 'Brentwood',
    distance: '10–15 min',
    rent: '$1,600–$2,100/bedroom',
    description: 'Upscale, quiet, and very residential. Brentwood attracts students who want safety, space, and a calmer environment. Close to the Getty Center and Brentwood Country Mart. Worth the price for those who prioritize quality of life.',
    tags: ['Quieter', 'Upscale feel', 'Safe neighborhood'],
  },
  {
    name: 'Culver City',
    distance: '20–25 min',
    rent: '$1,200–$1,800/bedroom',
    description: 'Vibrant arts district with excellent dining and Metro Expo Line access. Slightly longer commute but offers the most dynamic neighborhood experience. Great for students who want real LA city culture beyond the Westside bubble.',
    tags: ['Metro access', 'Arts & dining', 'City feel'],
  },
]

const FAQS = [
  {
    q: 'How do I find off-campus housing near UCLA?',
    a: 'UTenancy lists verified off-campus apartments, open rooms, and group housing near UCLA\'s Westwood campus. Create a free student account, filter listings by distance to UCLA, and message landlords directly through the platform.',
  },
  {
    q: 'What is the average rent near UCLA?',
    a: 'Westwood, the closest neighborhood, averages $1,700–$2,300 per bedroom — among the highest near any LA campus. Palms offers similar proximity at $1,200–$1,700 per bedroom. Culver City and Brentwood fall in the $1,200–$2,100 range. Sharing with roommates is nearly universal near UCLA to manage costs.',
  },
  {
    q: 'Is Westwood worth the high rent for UCLA students?',
    a: 'For freshmen and sophomores who want to be close to campus life, Westwood is often worth the premium. For juniors and seniors with cars or bikes, Palms offers almost the same convenience at 30–40% lower rent. It comes down to whether proximity or savings matters more at your stage.',
  },
  {
    q: 'When should I start looking for housing near UCLA?',
    a: 'Start your search in January or February for fall semester — Westwood is the most competitive housing market near any UC campus. The best apartments lease by March. If you wait until April or May, expect limited selection and higher prices.',
  },
  {
    q: 'What neighborhoods near UCLA offer the best value?',
    a: 'Palms consistently offers the best balance of price and proximity. You\'re 15–20 minutes from campus via bike or bus, and you get significantly more space and better-maintained buildings for the price. Mar Vista is also worth considering for students with cars.',
  },
  {
    q: 'Can I find roommates for UCLA housing on UTenancy?',
    a: 'Yes. UTenancy supports two listing types: open rooms (one vacancy in an existing unit) and group formations (a group of students looking to form a household together). Both are available near UCLA — and with Westwood rents as high as they are, roommates are a smart move.',
  },
]

export default function UCLAPage() {
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
      { '@type': 'ListItem', position: 2, name: 'Student Housing Near UCLA', item: 'https://utenancy.com/housing/ucla' },
    ],
  }

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'UTenancy — Student Housing Near UCLA',
    description: 'Verified off-campus student housing listings near UCLA in Westwood, Palms, Brentwood, and Culver City.',
    url: 'https://utenancy.com/housing/ucla',
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
              <span className="text-clay font-semibold">Student Housing Near UCLA</span>
            </nav>

            <div className="inline-flex items-center gap-2 bg-white/80 border border-out-var rounded-full px-4 py-1.5 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-dot" />
              <span className="text-xs font-head font-bold text-clay-dark tracking-widest uppercase">UCLA</span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-medium text-espresso leading-tight mb-6">
              Off-Campus Housing<br />
              <em className="text-terracotta">Near UCLA</em>
            </h1>

            <p className="font-body text-stone/70 text-lg leading-relaxed max-w-2xl mb-10">
              Find verified apartments, open rooms, and group housing in Westwood, Palms, Brentwood, and Culver City — the neighborhoods closest to UCLA&apos;s Westwood campus.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/listings?university=ucla"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-6 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-clay/20"
              >
                Browse Listings Near UCLA
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
                { label: 'Avg. rent (Westwood)', value: '$1,700–$2,300/mo' },
                { label: 'Closest neighborhood', value: 'Westwood' },
                { label: 'Best value', value: 'Palms' },
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
              Best neighborhoods near UCLA
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Each neighborhood offers a different balance of commute time, price, and lifestyle. Here&apos;s how they compare for UCLA students.
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
              How UTenancy works for UCLA students
            </h2>
            <p className="font-body text-stone/60 mb-12 max-w-xl">
              Find, apply, and move in — without the spam calls and sketchy Craigslist listings.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { step: '01', title: 'Create your free account', body: 'Sign up with your UCLA email. Verification confirms you\'re a real Bruin, which landlords in competitive Westwood strongly prefer.' },
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
            <p className="font-body text-stone/60 mb-12">Everything UCLA students ask about off-campus housing.</p>

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
              Ready to find your place<br /><em className="text-sand">near UCLA?</em>
            </h2>
            <p className="font-body text-white/60 mb-8">
              Free for students. Verified landlords. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/listings?university=ucla"
                className="inline-flex items-center justify-center gap-2 clay-grad text-white px-7 py-3.5 rounded-full font-head font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-clay/30"
              >
                Browse listings near UCLA
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
