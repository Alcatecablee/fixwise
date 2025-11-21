import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  keywords?: string[];
}

const faqData: FAQItem[] = [
  {
    question: "Is NeuroLint really 100% free?",
    answer:
      "Yes! NeuroLint CLI is completely free with no subscriptions, no API keys required, and no hidden costs. Install it via npm and start fixing your React & Next.js code immediately. All features are included - no premium tiers or paid upgrades.",
    keywords: [
      "free",
      "no cost",
      "npm",
      "CLI",
      "no subscription",
      "no API keys",
    ],
  },
  {
    question: "Will NeuroLint break my code?",
    answer:
      "No. NeuroLint creates automatic backups before making any changes. Every fix is deterministic and rule-based (not AI), so you get consistent, predictable results. You can review all changes and roll back instantly if needed. We prioritize safety over speed.",
    keywords: [
      "safety",
      "automatic backups",
      "rollback",
      "deterministic",
      "rule-based",
      "no breaking changes",
    ],
  },
  {
    question: "Does NeuroLint use AI?",
    answer:
      "No. NeuroLint uses proven rule-based transformations, not AI. This means you get deterministic, consistent fixes every time - no hallucinations, no guesswork, no unpredictable results. We fix your code based on established patterns and best practices.",
    keywords: [
      "no AI",
      "rule-based",
      "deterministic",
      "consistent",
      "proven patterns",
      "no hallucinations",
    ],
  },
  {
    question: "What frameworks and versions are supported?",
    answer:
      "NeuroLint works with React 16+, React 18, React 19, Next.js 12-15, and TypeScript codebases. We fix common issues like hydration crashes (window is not defined), missing React keys, ESLint errors, accessibility problems, and Next.js App Router migration issues.",
    keywords: [
      "React",
      "Next.js",
      "TypeScript",
      "React 18",
      "React 19",
      "Next.js 15",
      "App Router",
    ],
  },
  {
    question: "How long does it take to fix my code?",
    answer:
      "Most projects are analyzed in seconds and fixed in minutes. Small projects (< 50 files) typically take 1-2 minutes. Medium projects (50-200 files) take 5-10 minutes. Large projects (200+ files) take 15-30 minutes. The CLI shows real-time progress as it works.",
    keywords: [
      "speed",
      "performance",
      "quick fixes",
      "real-time progress",
      "minutes not hours",
    ],
  },
];

const FAQItem: React.FC<{
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ faq, isOpen, onToggle }) => {
  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      <button
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-zinc-900/50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-inset"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <h3 className="text-lg font-semibold text-white pr-4">
          {faq.question}
        </h3>
        <div className="flex-shrink-0">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-zinc-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-4">
          <div className="pt-2 border-t border-zinc-800">
            <p className="text-zinc-300 leading-relaxed">{faq.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const FAQSection: React.FC = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Generate JSON-LD structured data for SEO
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqData.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section
        className="py-24 px-4"
        id="faq"
        role="region"
        aria-labelledby="faq-heading"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-xl backdrop-blur-sm mb-6">
              <HelpCircle className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-zinc-400">
                Frequently Asked Questions
              </span>
            </div>

            <h2
              id="faq-heading"
              className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white"
            >
              Everything You Need to Know
            </h2>

            <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium">
              Get answers to common questions about NeuroLint's free CLI tool,
              safety features, and how it fixes React & Next.js bugs automatically.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                isOpen={openItems.has(index)}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </div>

          {/* Additional Help */}
          <div className="mt-16 text-center">
            <div className="p-8 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white mb-4">
                Still have questions?
              </h3>
              <p className="text-zinc-400 mb-6">
                Our team is here to help you get the most out of NeuroLint.
                Reach out for personalized assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="mailto:support@neurolint.com"
                  className="inline-flex items-center px-6 py-3 bg-white text-black font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Contact Support
                </a>
                <a
                  href="/docs"
                  className="inline-flex items-center px-6 py-3 bg-zinc-800 text-white font-semibold rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-colors"
                >
                  View Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
