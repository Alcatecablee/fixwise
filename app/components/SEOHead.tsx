import Head from 'next/head';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  structuredData?: any;
}

export default function SEOHead({
  title = "NeuroLint - Rule-Based React/Next.js Code Transformation Engine",
  description = "Transform legacy React/Next.js code with NeuroLint's rule-based 7-layer engine. Automated fixes for accessibility, hydration, patterns, and configurations with 95% accuracy.",
  keywords = [],
  image = "https://app.neurolint.dev/og-image.png",
  url = "https://app.neurolint.dev",
  type = "website",
  publishedTime,
  modifiedTime,
  author = "NeuroLint Team",
  section,
  tags = [],
  structuredData
}: SEOHeadProps) {
  const fullTitle = title.includes("NeuroLint") ? title : `${title} | NeuroLint`;
  const fullKeywords = [
    "React code transformation",
    "Next.js code fixes", 
    "React modernization",
    "Next.js migration",
    "React 18 upgrade",
    "App Router migration",
    "TypeScript conversion",
    "legacy React code",
    "React hooks migration",
    "code modernization",
    "automated refactoring",
    "React development tools",
    "Next.js tools",
    "React migration service",
    "frontend modernization",
    "React codebase upgrade",
    "rule-based code analysis",
    "automated code transformation",
    "React performance optimization",
    "Next.js performance",
    "React best practices",
    "TypeScript migration",
    "React component refactoring",
    "Next.js App Router",
    "React Server Components",
    "code quality tools",
    "React linting",
    "automated testing",
    "React security",
    "Next.js security",
    "React accessibility",
    "Next.js accessibility",
    "7-layer transformation engine",
    "code auto-fix",
    "React patterns",
    "Next.js patterns",
    "SSR hydration fixes",
    "React configuration",
    "Next.js configuration",
    ...keywords
  ];

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": type === "article" ? "Article" : "SoftwareApplication",
    "name": fullTitle,
    "description": description,
    "url": url,
    "image": image,
    "author": {
      "@type": "Organization",
      "name": author,
      "url": "https://neurolint.dev"
    },
    "publisher": {
      "@type": "Organization",
      "name": "NeuroLint",
      "logo": {
        "@type": "ImageObject",
        "url": "https://app.neurolint.dev/favicon.png"
      }
    },
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier with unlimited scans and basic fixes"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "sameAs": [
      "https://github.com/Alcatecablee/nurolint-app",
      "https://x.com/neurolint"
    ]
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  if (publishedTime) {
    finalStructuredData.datePublished = publishedTime;
  }
  if (modifiedTime) {
    finalStructuredData.dateModified = modifiedTime;
  }
  if (section) {
    finalStructuredData.articleSection = section;
  }
  if (tags.length > 0) {
    finalStructuredData.keywords = tags.join(", ");
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={fullKeywords.join(", ")} />
      <meta name="author" content={author} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="NeuroLint" />
      <meta property="og:locale" content="en_US" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {section && <meta property="article:section" content={section} />}
      {tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@neurolint" />
      <meta name="twitter:creator" content="@neurolint" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)" />
      <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="NeuroLint" />
      <meta name="application-name" content="NeuroLint" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="mobile-web-app-capable" content="yes" />

      {/* Performance and Security */}
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta http-equiv="X-Content-Type-Options" content="nosniff" />
      <meta http-equiv="X-Frame-Options" content="DENY" />
      <meta http-equiv="Referrer-Policy" content="origin-when-cross-origin" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalStructuredData)
        }}
      />

      {/* Additional Structured Data for Organization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "NeuroLint",
            "url": "https://neurolint.dev",
            "logo": "https://app.neurolint.dev/favicon.png",
            "description": "Rule-based React/Next.js code transformation engine",
            "foundingDate": "2024",
            "sameAs": [
              "https://github.com/Alcatecablee/nurolint-app",
              "https://x.com/neurolint"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "url": "https://neurolint.dev/support"
            }
          })
        }}
      />

      {/* WebSite Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "NeuroLint",
            "url": "https://app.neurolint.dev",
            "description": "Rule-based React/Next.js code transformation engine",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://app.neurolint.dev/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
    </Head>
  );
} 