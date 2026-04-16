import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { POSTS, getPostBySlug } from '@/lib/blog-posts'

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `https://utenancy.com/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `https://utenancy.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.date,
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
      images: ['/og-image.png'],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    publisher: {
      '@type': 'Organization',
      name: 'UTenancy',
      logo: { '@type': 'ImageObject', url: 'https://utenancy.com/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://utenancy.com/blog/${post.slug}` },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://utenancy.com' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://utenancy.com/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://utenancy.com/blog/${post.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <main className="min-h-screen bg-cream pt-28 pb-24 px-6">
        <div className="max-w-2xl mx-auto">

          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-head font-semibold text-clay hover:text-clay-dark mb-10 transition-colors"
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 400" }}>arrow_back</span>
            Back to Blog
          </Link>

          {/* Tag + meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-head font-bold uppercase tracking-widest text-terracotta bg-linen px-3 py-1 rounded-full">
              {post.tag}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl md:text-4xl font-medium text-espresso leading-tight mb-4">
            {post.title}
          </h1>

          {/* Date + read time */}
          <div className="flex items-center gap-3 text-sm text-muted font-body mb-10 pb-8 border-b border-out-var">
            <span>{post.date}</span>
            <span className="w-1 h-1 rounded-full bg-sand" />
            <span>{post.readTime}</span>
          </div>

          {/* Content */}
          <article
            className="prose prose-stone max-w-none
              prose-headings:font-display prose-headings:font-medium prose-headings:text-espresso
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
              prose-p:text-stone/80 prose-p:leading-relaxed prose-p:mb-5
              prose-ul:my-4 prose-li:text-stone/80 prose-li:mb-1.5
              prose-strong:text-espresso prose-strong:font-semibold
              prose-a:text-terracotta prose-a:no-underline hover:prose-a:underline"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* CTA */}
          <div className="mt-16 pt-10 border-t border-out-var">
            <div className="bg-linen rounded-2xl p-8 text-center">
              <p className="font-display text-2xl font-medium text-espresso mb-2">Find student housing near your campus</p>
              <p className="text-stone/70 font-body mb-6 text-sm">
                UTenancy connects verified students with real listings near LA universities.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-terracotta text-white font-head font-bold text-sm px-6 py-3 rounded-full hover:bg-clay transition-colors"
              >
                Browse Listings
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'wght' 400" }}>arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Related posts */}
          <div className="mt-14">
            <p className="font-head font-bold text-xs uppercase tracking-widest text-muted mb-6">More from the blog</p>
            <div className="grid gap-4">
              {POSTS.filter((p) => p.slug !== post.slug).slice(0, 3).map((related) => (
                <Link
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group flex items-start gap-4 p-4 rounded-xl border border-out-var bg-white hover:border-sand transition-colors"
                >
                  <span className="text-xs font-head font-bold text-terracotta bg-linen px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5">
                    {related.tag}
                  </span>
                  <div>
                    <p className="font-head font-semibold text-espresso text-sm group-hover:text-clay transition-colors leading-snug">
                      {related.title}
                    </p>
                    <p className="text-xs text-muted mt-1">{related.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
