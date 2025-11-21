import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="w-full py-8 px-6 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">NeuroLint</h3>
            <p className="text-zinc-400 text-sm">
              Rule-based code transformation for React and TypeScript projects.
              AI integration planned for future releases.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/app"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Try Now
                </Link>
              </li>
              <li>
                <a
                  href="#cli"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  CLI Tool
                </a>
              </li>
              <li>
                <a
                  href="#vscode"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  VS Code Extension
                </a>
              </li>
              <li>
                <a
                  href="#api"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  REST API
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/test"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Test Suite
                </Link>
              </li>
              <li>
                <a
                  href="mailto:founder@neurolint.com"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="mailto:founder@neurolint.com"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <span className="text-zinc-400">Privacy Policy</span>
              </li>
              <li>
                <span className="text-zinc-400">Terms of Service</span>
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
