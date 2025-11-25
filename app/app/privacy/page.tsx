export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-invert max-w-none">
            <p className="text-lg text-gray-300 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
              <p className="text-gray-300 mb-4">
                We collect information you provide directly to us, such as when you create an account, use our services, or contact us.
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4">
                <li>Account information (email, name, company)</li>
                <li>Code submitted for analysis (temporarily processed)</li>
                <li>Usage analytics and service logs</li>
                <li>Payment information (processed by PayPal)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
              <p className="text-gray-300 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process code analysis requests</li>
                <li>Send you technical notices and support messages</li>
                <li>Monitor and analyze service usage</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">3. Code Privacy</h2>
              <p className="text-gray-300 mb-4">
                Your code privacy is our priority:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4">
                <li>Code is processed temporarily and not permanently stored</li>
                <li>Analysis happens in isolated environments</li>
                <li>We do not share your code with third parties</li>
                <li>Code is automatically deleted after processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
              <p className="text-gray-300 mb-4">
                We implement appropriate security measures to protect your information against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">5. Third-Party Services</h2>
              <p className="text-gray-300 mb-4">
                We use third-party services for:
              </p>
              <ul className="list-disc list-inside text-gray-300 mb-4">
                <li>Payment processing (PayPal)</li>
                <li>Authentication (Supabase)</li>
                <li>Analytics (anonymized usage data)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <p className="text-gray-300 mb-4">
                You have the right to access, update, or delete your personal information. Contact us at privacy@neurolint.dev for requests.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
              <p className="text-gray-300 mb-4">
                If you have any questions about this Privacy Policy, please contact us at privacy@neurolint.dev
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
