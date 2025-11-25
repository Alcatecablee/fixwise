'use client';

import React from 'react';

interface StructuredDataProps {
  type: 'website' | 'organization' | 'softwareApplication' | 'product' | 'service';
}

const StructuredData: React.FC<StructuredDataProps> = ({ type }) => {
  const getStructuredData = () => {
    switch (type) {
      case 'website':
        return {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "NeuroLint",
          "url": "https://app.neurolint.dev",
          "description": "Rule-based React/Next.js code transformation engine with 7-layer auto-fix platform",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://app.neurolint.dev/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          },
          "publisher": {
            "@type": "Organization",
            "name": "NeuroLint",
            "url": "https://neurolint.dev"
          }
        };

      case 'organization':
        return {
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "NeuroLint",
          "url": "https://neurolint.dev",
          "logo": "https://neurolint.dev/favico.png",
          "description": "Rule-based React/Next.js code transformation engine",
          "foundingDate": "2024",
          "sameAs": [
            "https://github.com/Alcatecablee/landing",
            "https://x.com/neurolint"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer service",
            "url": "https://neurolint.dev/support",
            "availableLanguage": "English"
          },
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "US"
          }
        };

      case 'softwareApplication':
        return {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "NeuroLint",
          "description": "Rule-based React/Next.js code transformation engine with 7-layer auto-fix platform. Automatically fixes accessibility, hydration, patterns, and configurations with 95% accuracy.",
          "url": "https://app.neurolint.dev",
          "applicationCategory": "DeveloperApplication",
          "operatingSystem": "Web",
          "browserRequirements": "Modern web browser with JavaScript enabled",
          "featureList": [
            "7-layer transformation engine",
            "React/Next.js code modernization",
            "Automated accessibility fixes",
            "SSR hydration safety",
            "TypeScript conversion",
            "Pattern standardization",
            "Configuration optimization",
            "Real-time collaboration",
            "CLI integration",
            "VS Code extension"
          ],
          "offers": [
            {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD",
              "description": "Free tier with unlimited scans and basic fixes",
              "availability": "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              "price": "24.99",
              "priceCurrency": "USD",
              "description": "Professional plan with all 7 layers and API access",
              "availability": "https://schema.org/InStock"
            }
          ],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250",
            "bestRating": "5",
            "worstRating": "1",
            "reviewCount": "850"
          },
          "author": {
            "@type": "Organization",
            "name": "NeuroLint",
            "url": "https://neurolint.dev"
          },
          "publisher": {
            "@type": "Organization",
            "name": "NeuroLint",
            "logo": {
              "@type": "ImageObject",
              "url": "https://neurolint.dev/favico.png"
            }
          },
          "softwareVersion": "1.2.3",
          "releaseNotes": "Latest version includes improved 7-layer engine with 95% accuracy",
          "downloadUrl": "https://app.neurolint.dev/download",
          "installUrl": "https://app.neurolint.dev/install",
          "screenshot": "https://app.neurolint.dev/screenshot.png",
          "sameAs": [
            "https://github.com/Alcatecablee/landing",
            "https://x.com/neurolint"
          ]
        };

      case 'product':
        return {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "NeuroLint Pro",
          "description": "Professional React/Next.js code transformation service with 7-layer engine",
          "brand": {
            "@type": "Brand",
            "name": "NeuroLint"
          },
          "category": "Software Development Tools",
          "offers": {
            "@type": "Offer",
            "price": "24.99",
            "priceCurrency": "USD",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "NeuroLint"
            }
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "1250",
            "bestRating": "5",
            "worstRating": "1"
          }
        };

      case 'service':
        return {
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "NeuroLint Code Transformation Service",
          "description": "Professional React/Next.js code transformation service using rule-based 7-layer engine",
          "provider": {
            "@type": "Organization",
            "name": "NeuroLint",
            "url": "https://neurolint.dev"
          },
          "serviceType": "Code Transformation",
          "areaServed": "Worldwide",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "NeuroLint Services",
            "itemListElement": [
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "React Code Modernization",
                  "description": "Transform legacy React code to modern standards"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Next.js Migration",
                  "description": "Migrate to Next.js App Router and modern patterns"
                }
              },
              {
                "@type": "Offer",
                "itemOffered": {
                  "@type": "Service",
                  "name": "Accessibility Fixes",
                  "description": "Automated accessibility improvements"
                }
              }
            ]
          }
        };

      default:
        return null;
    }
  };

  const data = getStructuredData();
  if (!data) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 2)
      }}
    />
  );
};

export default StructuredData;
