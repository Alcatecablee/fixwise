import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://app.neurolint.dev'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/pricing',
          '/docs/',
          '/docs/layer1',
          '/docs/layer2', 
          '/docs/layer3',
          '/docs/layer4',
          '/docs/layer5',
          '/docs/layer6',
          '/api-docs',
          '/login',
          '/signup',
          '/terms',
          '/privacy',
          '/migration-quote',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/profile/',
          '/onboarding/',
          '/collaborate/',
          '/checkout/',
          '/auth/',
          '/verify-email/',
          '/reset-password/',
          '/forgot-password/',
          '/_next/',
          '/.*\\.json$',
          '/.*\\.xml$',
          '/*?*',
          '/search?*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'Claude-Web',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
