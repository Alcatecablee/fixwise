import "./polyfills";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handler to suppress FullStory fetch interference
window.addEventListener("error", (event) => {
  // Suppress FullStory related fetch errors that don't affect functionality
  if (
    event.error?.message?.includes("Failed to fetch") &&
    (event.error?.stack?.includes("fs.js") ||
      event.error?.stack?.includes("fullstory"))
  ) {
    console.debug("Suppressed FullStory fetch error");
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Also handle unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  if (
    event.reason?.message?.includes("Failed to fetch") &&
    (event.reason?.stack?.includes("fs.js") ||
      event.reason?.stack?.includes("fullstory"))
  ) {
    console.debug("Suppressed FullStory promise rejection");
    event.preventDefault();
    return false;
  }
});

// Override console.error to suppress FullStory fetch errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args.join(" ");
  if (message.includes("Failed to fetch") && message.includes("fs.js")) {
    return; // Suppress
  }
  originalConsoleError.apply(console, args);
};

createRoot(document.getElementById("root")!).render(<App />);
