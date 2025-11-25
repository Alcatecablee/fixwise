'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface WelcomeBannerProps {
  userName?: string;
}

export default function WelcomeBanner({ userName }: WelcomeBannerProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Check if user just completed onboarding
    const urlParams = new URLSearchParams(window.location.search);
    const onboardingComplete = urlParams.get('onboarding') === 'complete';
    const onboardingSkipped = urlParams.get('onboarding') === 'skipped';
    
    // Check if we've already shown the welcome banner
    const hasSeenWelcome = localStorage.getItem('neurolint_seen_welcome_banner');
    
    if ((onboardingComplete || onboardingSkipped) && !hasSeenWelcome) {
      setShouldShow(true);
      setIsVisible(true);
      
      // Mark as seen
      localStorage.setItem('neurolint_seen_welcome_banner', 'true');
      
      // Clean up URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  const handleGetStarted = () => {
    setIsVisible(false);
    // Navigate to editor for first analysis
    router.push('/dashboard#editor');
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!shouldShow || !isVisible) {
    return null;
  }

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 150, 243, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%)",
      border: "2px solid #000000",
      borderRadius: "16px",
      padding: "2rem",
      marginBottom: "2rem",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(15px)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background pattern */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "200px",
        height: "200px",
        background: "radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        transform: "translate(50%, -50%)"
      }} />

      <div style={{
        position: "relative",
        zIndex: 1
      }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "1.5rem"
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid #000000",
              borderRadius: "16px",
              color: "#ffffff"
            }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4.5 16.5c-1.5 1.5-2 4-2 4s2.5-.5 4-2c1.5-1.5 1.5-4 1.5-4s-2.5 0-3.5 1.5z"/>
                <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
              </svg>
            </div>
            <div>
              <h2 style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#ffffff",
                margin: "0 0 0.25rem 0"
              }}>
                Welcome to NeuroLint{userName ? `, ${userName}` : ''}!
              </h2>
              <p style={{
                fontSize: "1rem",
                color: "rgba(255, 255, 255, 0.8)",
                margin: 0
              }}>
                Your intelligent React code analysis platform is ready
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid #000000",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              color: "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.2)";
              (e.target as HTMLElement).style.color = "rgba(255, 255, 255, 0.9)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
              (e.target as HTMLElement).style.color = "rgba(255, 255, 255, 0.7)";
            }}
          >
            ×
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem"
        }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid #000000",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#ffffff",
              marginBottom: "0.5rem"
            }}>Smart Analysis</div>
            <div style={{
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)"
                        }}>6 layers of intelligent code modernization</div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid #000000",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#ffffff",
              marginBottom: "0.5rem"
            }}>Safe Transforms</div>
            <div style={{
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)"
            }}>Never breaks your existing code</div>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid #000000",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center"
          }}>
            <div style={{
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#ffffff",
              marginBottom: "0.5rem"
            }}>Instant Results</div>
            <div style={{
              fontSize: "0.8rem",
              color: "rgba(255, 255, 255, 0.7)"
            }}>See improvements in real-time</div>
          </div>
        </div>

        <div style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap"
        }}>
          <button
            onClick={handleGetStarted}
            style={{
              background: "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
              border: "2px solid #000000",
              borderRadius: "12px",
              padding: "1rem 2rem",
              color: "#ffffff",
              fontSize: "1rem",
              cursor: "pointer",
              fontWeight: "600",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
              (e.target as HTMLElement).style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = "translateY(0)";
              (e.target as HTMLElement).style.boxShadow = "none";
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Start Your First Analysis
          </button>

          <button
            onClick={() => router.push('/dashboard#help')}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "2px solid #000000",
              borderRadius: "12px",
              padding: "1rem 2rem",
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "1rem",
              cursor: "pointer",
              fontWeight: "500",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.15)";
              (e.target as HTMLElement).style.color = "rgba(255, 255, 255, 1)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
              (e.target as HTMLElement).style.color = "rgba(255, 255, 255, 0.9)";
            }}
          >
            View Tutorials
          </button>
        </div>
      </div>
    </div>
  );
}
