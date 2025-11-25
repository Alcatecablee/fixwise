import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Pricing Plans - NeuroLint React/Next.js Modernization",
  description: "Affordable pricing for React modernization tools. Choose from Free (Layers 1-4), Professional ($24.99/month for all 7 layers), or Enterprise plans. 30-day free trial included.",
  keywords: [
    "React modernization pricing",
    "Next.js migration cost",
    "React upgrade pricing", 
    "development tools pricing",
    "React tools subscription"
  ],
  openGraph: {
    title: "NeuroLint Pricing - React/Next.js Modernization Plans",
    description: "Affordable pricing for React modernization tools. Choose from Starter, Professional, or Enterprise plans.",
    url: "https://app.neurolint.dev/pricing",
  },
  alternates: {
    canonical: "https://app.neurolint.dev/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
