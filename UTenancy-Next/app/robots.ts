import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/landlord',
          '/auth',
          '/admin',
          '/messages',
          '/interested',
          '/profile',
        ],
      },
    ],
    sitemap: 'https://utenancy.com/sitemap.xml',
  }
}
