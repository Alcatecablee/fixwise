import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 w-full bg-black/80 border-b border-[#292939] backdrop-blur-lg px-4 py-2 flex items-center justify-between">
      {/* Brand with uploaded logo */}
      <a href="/" className="flex items-center gap-2">
        <img
          src="https://cdn.builder.io/api/v1/image/assets%2Faab978f39ff64270b6e29ab49582f574%2F38b5bfac1a6242ebb67f91834016d010?format=webp&width=800"
          alt="Logo"
          className="w-9 h-9 sm:w-10 sm:h-10"
          draggable={false}
          loading="eager"
        />
        <span className="font-bold text-white text-2xl tracking-tight bg-zinc-900">
          NeuroLint
        </span>
      </a>
      {/* Navigation - large tap targets */}
      <nav className="flex gap-2 sm:gap-4">
        <a
          href="#features"
          className="text-gray-300 hover:text-white font-medium transition-colors px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Features
        </a>
        <a
          href="#cli"
          className="text-gray-300 hover:text-white font-medium transition-colors px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          CLI
        </a>
        <a
          href="#vscode"
          className="text-gray-300 hover:text-white font-medium transition-colors px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          VS Code
        </a>
        <a
          href="#api"
          className="text-gray-300 hover:text-white font-medium transition-colors px-2 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          API
        </a>
      </nav>
      <a
        href="mailto:founder@neurolint.com?subject=I can help with NeuroLint orchestration!"
        className="ml-2"
        tabIndex={-1}
      >
        <Button className="bg-zinc-900">Get Involved</Button>
      </a>
    </header>
  );
}
