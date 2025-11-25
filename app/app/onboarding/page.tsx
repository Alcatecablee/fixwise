"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  actionText: string;
  skipText?: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    primaryUse: "",
    teamSize: "",
    experienceLevel: "",
    interestedFeatures: [] as string[],
  });

    // Only redirect for later steps if not logged in
  useEffect(() => {
    if (!user && currentStep > 0) {
      router.push("/login");
    }
  }, [user, router, currentStep]);

  // Check if user has completed onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("onboarding_completed");
    if (hasCompletedOnboarding) {
      router.push("/dashboard");
    }
  }, [router]);

  // Auto scroll to top when component loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleFeatureToggle = (feature: string) => {
    setUserPreferences(prev => ({
      ...prev,
      interestedFeatures: prev.interestedFeatures.includes(feature)
        ? prev.interestedFeatures.filter(f => f !== feature)
        : [...prev.interestedFeatures, feature]
    }));
  };

  const completeOnboarding = async () => {
    setLoading(true);
    
    try {
      // Save preferences to API (works for both authenticated and anonymous users)
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

        },
        body: JSON.stringify(userPreferences)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Save to localStorage as backup and for quick access
        localStorage.setItem("onboarding_completed", "true");
        localStorage.setItem("user_preferences", JSON.stringify(userPreferences));
        // Write consolidated onboarding key for dashboard fallback
        localStorage.setItem(
          "neurolint-onboarding",
          JSON.stringify({
            experience_level: userPreferences.experienceLevel || "",
            team_size: userPreferences.teamSize || "",
            interested_features: userPreferences.interestedFeatures || [],
            primary_use_case: userPreferences.primaryUse || "",
            personalized_config: result?.personalizedSettings || undefined
          })
        );
        
        // Save personalized settings for dashboard customization
        if (result.personalizedSettings) {
          localStorage.setItem("personalized_settings", JSON.stringify(result.personalizedSettings));
        }
        
        console.log('Onboarding completed successfully:', result.message);
        
        // Redirect to dashboard with success indicator
        router.push("/dashboard?onboarding=complete");
      } else {
        // Fallback to localStorage if API fails
        console.warn('API save failed, using localStorage fallback');
        localStorage.setItem("onboarding_completed", "true");
        localStorage.setItem("user_preferences", JSON.stringify(userPreferences));
        // Write consolidated onboarding key for dashboard fallback
        localStorage.setItem(
          "neurolint-onboarding",
          JSON.stringify({
            experience_level: userPreferences.experienceLevel || "",
            team_size: userPreferences.teamSize || "",
            interested_features: userPreferences.interestedFeatures || [],
            primary_use_case: userPreferences.primaryUse || "",
          })
        );
        router.push("/dashboard");
      }
    } catch (error) {
      console.error('Error saving onboarding preferences:', error);
      
      // Fallback to localStorage
      localStorage.setItem("onboarding_completed", "true");
      localStorage.setItem("user_preferences", JSON.stringify(userPreferences));
      // Write consolidated onboarding key for dashboard fallback
      localStorage.setItem(
        "neurolint-onboarding",
        JSON.stringify({
          experience_level: userPreferences.experienceLevel || "",
          team_size: userPreferences.teamSize || "",
          interested_features: userPreferences.interestedFeatures || [],
          primary_use_case: userPreferences.primaryUse || "",
        })
      );
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: "Welcome to NeuroLint",
      subtitle: "The Anti-AI React/Next.js Modernization Platform",
      actionText: "Get Started",
      content: (
        <div style={{ margin: "2rem 0" }}>
          
          <p style={{ 
            color: "rgba(255, 255, 255, 0.8)", 
            fontSize: "1.1rem", 
            lineHeight: "1.6",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}>
            Deterministic fixes for AI-generated code issues and legacy React/Next.js modernization. Transform your codebase with our 7-layer system without AI hallucinations.
          </p>
          
          <div className="metrics-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.5rem",
            margin: "2.5rem 0 3rem 0"
          }}>
            <div style={{
              display: "block",
              textAlign: "center",
              padding: "1.5rem",
              borderRadius: "16px",
              backdropFilter: "blur(25px) saturate(1.2)",
              WebkitBackdropFilter: "blur(25px) saturate(1.2)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
              border: "2px solid #000000"
            }}>
              <div className="metric-icon" style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid #000000",
                borderRadius: "12px",
                color: "#ffffff",
                margin: "0 auto 1rem auto"
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#ffffff",
                lineHeight: 1,
                marginBottom: "0.25rem"
              }}>Save Hours</div>
              <div style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}>Daily Time Savings</div>
              <div style={{
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.7)"
              }}>
                Modernize hundreds of legacy patterns instantly instead of hunting them down manually
              </div>
            </div>
            
            <div style={{
              display: "block",
              textAlign: "center",
              padding: "1.5rem",
              borderRadius: "16px",
              backdropFilter: "blur(25px) saturate(1.2)",
              WebkitBackdropFilter: "blur(25px) saturate(1.2)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
              border: "2px solid #000000"
            }}>
              <div className="metric-icon" style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid #000000",
                borderRadius: "12px",
                color: "#ffffff",
                margin: "0 auto 1rem auto"
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#ffffff",
                lineHeight: 1,
                marginBottom: "0.25rem"
              }}>Never Break</div>
              <div style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}>Code Safety</div>
              <div style={{
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.7)"
              }}>
                Safe transformations that preserve functionality while modernizing legacy code
              </div>
            </div>
            
            <div style={{
              display: "block",
              textAlign: "center",
              padding: "1.5rem",
              borderRadius: "16px",
              backdropFilter: "blur(25px) saturate(1.2)",
              WebkitBackdropFilter: "blur(25px) saturate(1.2)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
              transition: "all 0.3s ease",
              background: "linear-gradient(135deg, rgba(156, 39, 176, 0.2) 0%, rgba(156, 39, 176, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
              border: "2px solid #000000"
            }}>
              <div className="metric-icon" style={{
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid #000000",
                borderRadius: "12px",
                color: "#ffffff",
                margin: "0 auto 1rem auto"
              }}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#ffffff",
                lineHeight: 1,
                marginBottom: "0.25rem"
              }}>Ship Faster</div>
              <div style={{
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.8)",
                marginBottom: "0.5rem",
                fontWeight: "500"
              }}>Development Speed</div>
              <div style={{
                fontSize: "0.8rem",
                color: "rgba(255, 255, 255, 0.7)"
              }}>
                Spend less time on legacy code and more time building features
              </div>
            </div>
          </div>

          <div className="insight-card" style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)",
            border: "2px solid #000000",
            borderRadius: "16px",
            padding: "1.5rem",
            textAlign: "center",
            marginTop: "1.5rem"
          }}>
            <p style={{ 
              color: "rgba(255, 255, 255, 0.8)", 
              fontSize: "0.95rem", 
              margin: 0,
              fontWeight: "500"
            }}>
              Join developers who are already saving hundreds of hours modernizing React codebases.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Tell us about your work",
      subtitle: "Help us personalize your NeuroLint experience",
      actionText: "Continue",
      skipText: "Skip for now",
      content: (
        <div style={{ margin: "2rem 0" }}>
          <div style={{ marginBottom: "2rem" }}>
            <label style={{ 
              display: "block", 
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              fontWeight: "500"
            }}>
              What will you primarily use NeuroLint for?
            </label>
            <select
              value={userPreferences.primaryUse}
              onChange={(e) => setUserPreferences(prev => ({ ...prev, primaryUse: e.target.value }))}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                background: "rgba(255, 255, 255, 0.05)",
                border: "2px solid #000000",
                borderRadius: "12px",
                color: "#ffffff",
                fontSize: "1rem",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                outline: "none",
              }}
            >
              <option value="" style={{ background: "#1a1a1a", color: "#ffffff" }}>Select your primary use case</option>
              <option value="ai-code-cleanup" style={{ background: "#1a1a1a", color: "#ffffff" }}>Fixing AI-generated code</option>
              <option value="legacy-modernization" style={{ background: "#1a1a1a", color: "#ffffff" }}>Modernizing legacy React/Next.js</option>
              <option value="nextjs-migration" style={{ background: "#1a1a1a", color: "#ffffff" }}>Next.js 15.5 migration</option>
              <option value="team-standardization" style={{ background: "#1a1a1a", color: "#ffffff" }}>Team code standardization</option>
              <option value="learning" style={{ background: "#1a1a1a", color: "#ffffff" }}>Learning & Education</option>
            </select>
          </div>

          <div style={{ marginBottom: "2rem" }}>
            <label style={{ 
              display: "block", 
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              fontWeight: "500"
            }}>
              Team size
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.5rem" }}>
              {["Just me", "2-5 people", "6-20 people", "20+ people"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setUserPreferences(prev => ({ ...prev, teamSize: size }))}
                  className={userPreferences.teamSize === size ? "action-card primary" : "action-card secondary"}
                  style={{
                    padding: "0.75rem 1rem",
                    background: userPreferences.teamSize === size 
                      ? "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)" 
                      : "rgba(255, 255, 255, 0.1)",
                    border: "2px solid #000000",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontWeight: "500",
                    textAlign: "center"
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ 
              display: "block", 
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "0.9rem",
              marginBottom: "0.5rem",
              fontWeight: "500"
            }}>
              React/Next.js experience level
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              {["Beginner", "Intermediate", "Advanced"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUserPreferences(prev => ({ ...prev, experienceLevel: level }))}
                  className={userPreferences.experienceLevel === level ? "action-card primary" : "action-card secondary"}
                  style={{
                    padding: "0.75rem 1rem",
                    background: userPreferences.experienceLevel === level 
                      ? "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)" 
                      : "rgba(255, 255, 255, 0.1)",
                    border: "2px solid #000000",
                    borderRadius: "12px",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    fontWeight: "500",
                    textAlign: "center"
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "What issues do you want to fix?",
      subtitle: "Select the modernization layers most relevant to your codebase",
      actionText: "Continue",
      skipText: "Skip for now",
      content: (
        <div style={{ margin: "2rem 0" }}>
          <div style={{ display: "grid", gap: "1rem" }}>
            {[
              { 
                id: "layer1", 
                title: "Layer 1: Configuration Fixes", 
                desc: "Modernize TypeScript, Next.js, and package.json"
              },
              { 
                id: "layer2", 
                title: "Layer 2: Pattern Fixes", 
                desc: "Fix HTML entities, console statements, browser APIs"
              },
              { 
                id: "layer3", 
                title: "Layer 3: Component Fixes", 
                desc: "Improve accessibility, performance, prop types"
              },
              { 
                id: "layer4", 
                title: "Layer 4: Hydration Fixes", 
                desc: "Add SSR safety guards for client-side code"
              },
              { 
                id: "layer5", 
                title: "Layer 5: Next.js 15.5 Fixes", 
                desc: "App Router migration, directives, metadata"
              },
              { 
                id: "layer6", 
                title: "Layer 6: Testing Fixes", 
                desc: "Add error boundaries and test setup"
              },
              { 
                id: "layer7", 
                title: "Layer 7: Adaptive Learning", 
                desc: "Fix AI-generated code patterns"
              }
            ].map((feature) => (
              <div
                key={feature.id}
                onClick={() => handleFeatureToggle(feature.id)}
                className={userPreferences.interestedFeatures.includes(feature.id) ? "issue-item active" : "issue-item"}
                style={{
                  padding: "1rem",
                  background: userPreferences.interestedFeatures.includes(feature.id)
                    ? "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)"
                    : "rgba(255, 255, 255, 0.05)",
                  border: "2px solid #000000",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <div className="status" style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  border: "2px solid #000000",
                  background: userPreferences.interestedFeatures.includes(feature.id)
                    ? "rgba(76, 175, 80, 0.2)"
                    : "rgba(255, 255, 255, 0.05)",
                  color: userPreferences.interestedFeatures.includes(feature.id)
                    ? "#4caf50"
                    : "rgba(255, 255, 255, 0.3)",
                  marginRight: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: "bold"
                }}>
                  {userPreferences.interestedFeatures.includes(feature.id) && "✓"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: "600", 
                    color: "#ffffff", 
                    marginBottom: "0.25rem" 
                  }}>
                    {feature.title}
                  </div>
                  <div style={{ 
                    fontSize: "0.875rem", 
                    color: "rgba(255, 255, 255, 0.7)" 
                  }}>
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "See NeuroLint in action",
      subtitle: "Real example showing how we fix common React issues",
      actionText: "Analyze Sample Code",
      skipText: "Skip demo",
      content: (
        <div style={{ margin: "2rem 0" }}>
          <div className="insight-card" style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)",
            border: "2px solid #000000",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem"
          }}>
            <div style={{ 
              fontSize: "0.875rem", 
              color: "rgba(255, 255, 255, 0.6)",
              marginBottom: "0.5rem",
              fontFamily: "monospace"
            }}>
              Problematic React Component:
            </div>
            <pre style={{
              margin: 0,
              fontSize: "0.8rem",
              color: "#ffffff",
              fontFamily: "monospace",
              lineHeight: "1.4",
              overflow: "auto"
            }}>
{`function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    fetchUser(userId).then(setUser);
  }, []);
  
  if (!user) return <div>Loading...</div>;
  
  return (
    <div style={{color: 'blue'}}>
      <h1>{user.name}</h1>
      {user.items.map(item => <span>{item.text}</span>)}
      <p>&quot;Welcome to our app&quot;</p>
    </div>
  );
}`}
            </pre>
          </div>
          
          <div className="insight-card" style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)",
            border: "2px solid #000000",
            borderRadius: "16px",
            padding: "1.5rem"
          }}>
            <div style={{ 
              fontSize: "0.9rem", 
              fontWeight: "600",
              color: "#ffffff",
              marginBottom: "0.75rem"
            }}>
              NeuroLint automatically detects and fixes:
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.75rem",
              fontSize: "0.875rem"
            }}>
              <div style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                <strong>Layer 4:</strong> localStorage without SSR guard
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                <strong>Layer 3:</strong> React 18 key props modernization
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                <strong>Layer 2:</strong> Content standardization (&quot;)
              </div>
              <div style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                <strong>Layer 1:</strong> useEffect dependency array
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "You're ready to go!",
      subtitle: "Start modernizing your React/Next.js codebase",
      actionText: "Enter Dashboard",
      content: (
        <div style={{ textAlign: "center", margin: "2rem 0" }}>
          <div style={{
            fontSize: "1.8rem",
            marginBottom: "1.5rem",
            fontWeight: "700",
            color: "#ffffff",
            textAlign: "center"
          }}>
            NeuroLint is ready
          </div>
          <p style={{ 
            color: "rgba(255, 255, 255, 0.8)", 
            fontSize: "1.1rem", 
            lineHeight: "1.6",
            marginBottom: "1.5rem"
          }}>
            Your workspace is configured. Use our 7-layer system to fix AI code issues and modernize to Next.js 15.5.
            No setup required - just drop your code and watch the magic happen.
          </p>
          
          <div className="quick-actions-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            margin: "2rem 0"
          }}>
            <div className="action-card primary" style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              borderRadius: "12px",
              border: "2px solid #000000",
              cursor: "default",
              transition: "all 0.3s ease",
              textAlign: "left",
              background: "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)"
            }}>
              <div className="action-icon" style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid #000000",
                borderRadius: "8px",
                color: "#ffffff",
                margin: "0 auto 1rem auto"
              }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="action-content">
                <h4 style={{
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  margin: "0 0 0.25rem 0"
                }}>Instant Analysis</h4>
                <p style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.8rem",
                  margin: 0
                }}>Upload code and get immediate results</p>
              </div>
            </div>
            
            <div className="action-card success" style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              borderRadius: "12px",
              border: "2px solid #000000",
              cursor: "default",
              transition: "all 0.3s ease",
              textAlign: "left",
              background: "linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)"
            }}>
              <div className="action-icon" style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid #000000",
                borderRadius: "8px",
                color: "#ffffff",
                margin: "0 auto 1rem auto"
              }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="action-content">
                <h4 style={{
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  margin: "0 0 0.25rem 0"
                }}>Safe Transformations</h4>
                <p style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.8rem",
                  margin: 0
                }}>Never breaks your existing code</p>
              </div>
            </div>

            <div className="action-card warning" style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              borderRadius: "12px",
              border: "2px solid #000000",
              cursor: "default",
              transition: "all 0.3s ease",
              textAlign: "left",
              background: "linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 152, 0, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)"
            }}>
              <div className="action-icon" style={{
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.1)",
                border: "2px solid #000000",
                borderRadius: "8px",
                color: "#ffffff",
                margin: "0 auto 1rem auto"
              }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <div className="action-content">
                <h4 style={{
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  fontWeight: "600",
                  margin: "0 0 0.25rem 0"
                }}>Team Ready</h4>
                <p style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "0.8rem",
                  margin: 0
                }}>Share and collaborate with your team</p>
              </div>
            </div>
          </div>

          <div className="insight-card" style={{
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.02) 100%)",
            border: "2px solid #000000",
            borderRadius: "16px",
            padding: "1.5rem"
          }}>
            <p style={{ 
              color: "rgba(255, 255, 255, 0.8)", 
              fontSize: "0.9rem", 
              margin: 0,
              fontWeight: "500"
            }}>
              Start with your most problematic React component to see immediate value.
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Auto scroll to top when moving to next step
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } else {
      completeOnboarding();
    }
  };

  const skipStep = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Auto scroll to top when skipping to next step
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
    } else {
      // Skip onboarding but still save basic preferences
      setLoading(true);
      
      try {
        const response = await fetch('/api/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
  
          },
          body: JSON.stringify({
            ...userPreferences,
            skipOnboarding: true
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.personalizedSettings) {
            localStorage.setItem("personalized_settings", JSON.stringify(result.personalizedSettings));
          }
        }
      } catch (error) {
        console.error('Error saving skip preferences:', error);
      }
      
      localStorage.setItem("onboarding_completed", "true");
      localStorage.setItem("user_preferences", JSON.stringify({ ...userPreferences, skipped: true }));
      // Write consolidated onboarding key for dashboard fallback
      localStorage.setItem(
        "neurolint-onboarding",
        JSON.stringify({
          experience_level: userPreferences.experienceLevel || "",
          team_size: userPreferences.teamSize || "",
          interested_features: userPreferences.interestedFeatures || [],
          primary_use_case: userPreferences.primaryUse || "",
          skipped: true
        })
      );
      
      setLoading(false);
      router.push("/dashboard?onboarding=skipped");
    }
  };

    // Show loading only for authenticated steps
  if (!user && currentStep > 0) {
    return (
      <div className="onboarding-section">
        <div className="onboarding-container">
          <div className="onboarding-content">
            <div className="onboarding-card">
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  border: "2px solid rgba(0, 0, 0, 0.8)",
                  borderTop: "2px solid #ffffff",
                  borderRadius: "50%",
                  margin: "0 auto 1.5rem",
                  animation: "spin 1s linear infinite",
                }}
              ></div>
              <p className="onboarding-subtitle">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-section">
      <div className="onboarding-container">
        <div className="onboarding-content" style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 0, 0, 0.4) 100%)",
          border: "2px solid #000000",
          borderRadius: "16px",
          padding: 0,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(15px)"
        }}>
          <div className="onboarding-card">
            <div className="onboarding-logo">
              <Link
                href="/"
                className="modal-logo-bee"
                style={{ marginBottom: "1.5rem" }}
              >
                <img
                  src="https://cdn.builder.io/api/v1/image/assets%2F4b35a64a4a2c446c91402681adcf734e%2F485afb87468542eeba91d45b141bab95?format=webp&width=800"
                  alt="NeuroLint"
                />
              </Link>
            </div>

            
            <div style={{ marginBottom: "2rem" }}>
              <div className="time-filters" style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1rem"
              }}>
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={index <= currentStep ? "filter-btn active" : "filter-btn"}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: index <= currentStep 
                        ? "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)"
                        : "rgba(255, 255, 255, 0.2)",
                      border: index <= currentStep ? "2px solid #000000" : "none",
                      transition: "all 0.3s ease",
                      padding: 0,
                      cursor: "default"
                    }}
                  />
                ))}
              </div>
              <div style={{
                textAlign: "center",
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.6)",
                fontWeight: "500"
              }}>
                Step {currentStep + 1} of {steps.length}
              </div>
            </div>

            <h1 className="onboarding-title" style={{
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "1rem",
              color: "rgba(255, 255, 255, 0.9)",
              textShadow: "0 0 10px rgba(33, 150, 243, 0.1)"
            }}>{currentStepData.title}</h1>
            <p className="onboarding-subtitle" style={{ 
              marginBottom: "1rem",
              fontSize: "1.1rem",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: "1.6"
            }}>
              {currentStepData.subtitle}
            </p>

            {currentStepData.content}

            <div style={{ 
              display: "flex", 
              gap: "1rem", 
              marginTop: "2rem",
              flexDirection: currentStepData.skipText ? "column" : "row"
            }}>
              <button
                onClick={nextStep}
                disabled={loading}
                className="onboarding-btn primary"
                onMouseEnter={(e) => {
                  if (!loading) {
                    (e.target as HTMLElement).style.transform = "translateY(-2px)";
                    (e.target as HTMLElement).style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 16px rgba(33, 150, 243, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    (e.target as HTMLElement).style.transform = "translateY(0)";
                    (e.target as HTMLElement).style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 12px rgba(33, 150, 243, 0.2)";
                  }
                }}
                style={{
                  width: "100%",
                  marginBottom: currentStepData.skipText ? "1rem" : "0",
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "not-allowed" : "pointer",
                  background: "linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 150, 243, 0.15) 50%, rgba(255, 255, 255, 0.1) 100%)",
                  border: "2px solid #000000",
                  backdropFilter: "blur(20px) saturate(1.2)",
                  WebkitBackdropFilter: "blur(20px) saturate(1.2)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 12px rgba(33, 150, 243, 0.2)",
                  color: "#ffffff",
                  fontWeight: "600"
                }}
              >
                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "20px",
                        height: "20px",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        borderTop: "2px solid #ffffff",
                        borderRadius: "50%",
                        marginRight: "0.75rem",
                        animation: "spin 1s linear infinite",
                      }}
                    ></div>
                    Setting up...
                  </div>
                ) : (
                  currentStepData.actionText
                )}
              </button>

              {currentStepData.skipText && (
                <button
                  onClick={skipStep}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "0.875rem 1.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "2px solid #000000",
                    borderRadius: "12px",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontSize: "1rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    opacity: loading ? 0.5 : 1,
                    fontWeight: "500"
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.15)";
                      (e.target as HTMLElement).style.color = "rgba(255, 255, 255, 1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      (e.target as HTMLElement).style.background = "rgba(255, 255, 255, 0.1)";
                      (e.target as HTMLElement).style.color = "rgba(255, 255, 255, 0.9)";
                    }
                  }}
                >
                  {currentStepData.skipText}
                </button>
              )}
            </div>

            {currentStep > 0 && (
              <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                <button
                  onClick={() => {
                    setCurrentStep(currentStep - 1);
                    // Auto scroll to top when going back
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }, 100);
                  }}
                  disabled={loading}
                  style={{
                    background: "none",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.875rem",
                    cursor: loading ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                    opacity: loading ? 0.5 : 1,
                  }}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        
        .action-card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
