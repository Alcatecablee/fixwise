import React, { useState, useEffect } from "react";

const TypewriterHeadline: React.FC = () => {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const words = [
    "Transform Your Code",
    "Analyze Performance",
    "Fix Bugs Instantly",
    "Optimize Everything",
    "Write Better Code",
    "Modernize Legacy Code",
  ];

  const typingSpeed = 100;
  const deletingSpeed = 50;
  const delayBetweenWords = 2000;

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (currentIndex < words[currentWordIndex].length) {
      // Typing
      timeout = setTimeout(() => {
        setCurrentText((prev) => prev + words[currentWordIndex][currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, typingSpeed);
    } else {
      // Delay before deleting
      timeout = setTimeout(
        () => {
          // Start deleting
          if (currentText.length > 0) {
            setCurrentText((prev) => prev.slice(0, -1));
          } else {
            // Move to next word
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
            setCurrentIndex(0);
          }
        },
        currentText.length === words[currentWordIndex].length
          ? delayBetweenWords
          : deletingSpeed,
      );
    }

    return () => clearTimeout(timeout);
  }, [currentIndex, currentText, currentWordIndex, words]);

  return (
    <div className="mb-8">
      <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-zinc-900">
        <span className="block">Advanced</span>
        <span className="block min-h-[1.2em]">
          {currentText}
          <span className="animate-pulse">|</span>
        </span>
      </h1>
    </div>
  );
};

export default TypewriterHeadline;
