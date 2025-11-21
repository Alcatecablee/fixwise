import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
// Analytics will be loaded dynamically in production
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import { NotFound } from "./components/NotFound";
import { SiteHeader } from "./components/SiteHeader";
import { SiteFooter } from "./components/SiteFooter";
import { ErrorNotification, useNotifications } from "./components/ui/ErrorNotification";

const App = () => {
  const [currentView, setCurrentView] = useState<"landing" | "404">("landing");
  const { notifications, dismissNotification } = useNotifications();

  useEffect(() => {
    // Check if user came from app.neurolint.dev or any direct app link
    const referrer = document.referrer;
    const currentUrl = window.location.href;

    // Check if the referrer or current URL suggests they were looking for the app
    if (
      referrer.includes("app.neurolint.dev") ||
      currentUrl.includes("app") ||
      window.location.search.includes("app") ||
      window.location.hash.includes("app")
    ) {
      setCurrentView("404");
    }
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case "404":
        return <NotFound />;
      default:
        return (
          <div className="min-h-screen bg-black text-white">
            <SiteHeader />
            <main id="main-content" className="relative">
              <Index />
            </main>
            <SiteFooter />
          </div>
        );
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        {/* Skip link for keyboard navigation */}
        <a
          href="#main-content"
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[9999] bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
        >
          Skip to main content
        </a>

        <Toaster />
        <Sonner />
        <ErrorNotification 
          notifications={notifications} 
          onDismiss={dismissNotification} 
        />

        {renderContent()}
        {/* Analytics component will be loaded in production */}
      </TooltipProvider>
    </ThemeProvider>
  );
};

export default App;
