export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 mb-4">
                By accessing and using NeuroLint Pro, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
              <p className="text-gray-300 mb-4">
                NeuroLint Pro provides automated code analysis and fixing services for React and Next.js applications. Our service includes:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4">
                <li>Automated code analysis and transformation</li>
                <li>Migration assistance for React/Next.js upgrades</li>
                <li>Code quality improvements</li>
                <li>Performance optimization suggestions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Usage Limits</h2>
              <p className="text-gray-300 mb-4">
                Usage limits vary by subscription tier. Exceeding limits may result in service restrictions or additional charges.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Privacy and Data</h2>
              <p className="text-gray-300 mb-4">
                Your code and data privacy are important to us. Please refer to our Privacy Policy for details on how we handle your information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
              <p className="text-gray-300 mb-4">
                NeuroLint Pro is provided "as is" without warranty. We are not liable for any damages resulting from the use of our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Contact Information</h2>
              <p className="text-gray-300 mb-4">
                For questions about these Terms of Service, please contact us at support@neurolint.dev
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
