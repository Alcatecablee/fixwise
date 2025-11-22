export function LandingFooter() {
  return (
    <footer className="w-full py-8 px-6 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">NeuroLint</h3>
            <p className="text-zinc-400 text-sm">
              Rule-based code transformation for React and TypeScript projects.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.npmjs.com/package/@neurolint/cli"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  npm Package
                </a>
              </li>
              <li>
                <a
                  href="#comprehensive-demo"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Demo
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:clievemakazhu@gmail.com"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  clievemakazhu@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-800 mt-8 pt-6 text-center">
          <p className="text-zinc-400 text-sm">
            &copy; {new Date().getFullYear()} NeuroLint. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
