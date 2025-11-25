import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://app.neurolint.dev'
  const currentDate = new Date().toISOString()

  // Static blog posts/articles
  const posts = [
    {
      title: "Complete Guide to React 18 Migration",
      description: "Learn how to safely migrate your React application from version 16/17 to React 18 with concurrent features, Suspense, and new APIs.",
      url: `${baseUrl}/docs/layer1`,
      pubDate: "2024-01-15T00:00:00Z",
      category: "React Migration"
    },
    {
      title: "Next.js App Router Migration: Pages to App Directory",
      description: "Step-by-step guide to migrating from Next.js Pages Router to the new App Router with improved data fetching and layouts.",
      url: `${baseUrl}/docs/layer5`,
      pubDate: "2024-01-20T00:00:00Z",
      category: "Next.js Migration"
    },
    {
      title: "TypeScript Conversion for React Applications",
      description: "Convert your JavaScript React components to TypeScript with proper type definitions, interfaces, and best practices.",
      url: `${baseUrl}/docs/layer2`,
      pubDate: "2024-01-25T00:00:00Z",
      category: "TypeScript"
    },
    {
      title: "React Hooks Migration: From Class to Functional Components",
      description: "Transform your class components to modern functional components using useState, useEffect, and custom hooks.",
      url: `${baseUrl}/docs/layer3`,
      pubDate: "2024-01-30T00:00:00Z",
      category: "React Hooks"
    },
    {
      title: "Performance Optimization and Code Splitting in React",
      description: "Learn advanced techniques for optimizing React applications including bundle splitting, lazy loading, and performance monitoring.",
      url: `${baseUrl}/docs/layer4`,
      pubDate: "2024-02-05T00:00:00Z",
      category: "Performance"
    },
    {
      title: "Testing Strategies for Modernized React Applications",
      description: "Comprehensive testing approaches for React 18 applications including unit tests, integration tests, and end-to-end testing.",
      url: `${baseUrl}/docs/layer6`,
      pubDate: "2024-02-10T00:00:00Z",
      category: "Testing"
    }
  ]

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>NeuroLint Blog - React/Next.js Modernization</title>
    <link>${baseUrl}</link>
    <description>Latest guides, tutorials, and best practices for React modernization, Next.js migration, TypeScript conversion, and modern frontend development.</description>
    <language>en-us</language>
    <managingEditor>team@neurolint.dev (NeuroLint Team)</managingEditor>
    <webMaster>team@neurolint.dev (NeuroLint Team)</webMaster>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <pubDate>${currentDate}</pubDate>
    <ttl>1440</ttl>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/logo.png</url>
      <title>NeuroLint Blog</title>
      <link>${baseUrl}</link>
      <width>144</width>
      <height>144</height>
    </image>
    ${posts.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description}]]></description>
      <link>${post.url}</link>
      <guid isPermaLink="true">${post.url}</guid>
      <pubDate>${post.pubDate}</pubDate>
      <category><![CDATA[${post.category}]]></category>
      <content:encoded><![CDATA[${post.description}]]></content:encoded>
    </item>`).join('')}
  </channel>
</rss>`

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200'
    }
  })
}
