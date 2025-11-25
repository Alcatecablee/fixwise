



'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase-client';

interface OnboardingData {
  experience_level: string;
  team_size: string;
  interested_features: string[];
  primary_use_case: string;
  current_pain_points: string[];
  personalized_config: {
    recommended_layers: number[];
    suggested_features: string[];
    tips: string[];
  };
}

export default function OnboardingWelcome() {
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOnboardingData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Try to get from database first
          const { data: { session } } = await supabase.auth.getSession();
          const headers: Record<string, string> = {
            'Content-Type': 'application/json'
          };

          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          const response = await fetch('/api/onboarding', { headers });
          if (response.ok) {
            const data = await response.json();
            if (data.onboarding_data) {
              setOnboardingData(data.onboarding_data);
              setLoading(false);
              return;
            }
          } else if (response.status === 401) {
            // User not authenticated yet, skip API call and use localStorage fallback
            // [NeuroLint] Removed console.log: 'Onboarding API: User not authenticated yet, using localStorage fallback'
          }
        }

        // Fallback to localStorage
        const localData = localStorage.getItem('neurolint-onboarding');
        if (localData) {
          const parsed = JSON.parse(localData);
          setOnboardingData(parsed);
        }
      } catch (error) {
        // [NeuroLint] Removed console.error: 'Error loading onboarding data:', error
        // Try localStorage fallback
        const localData = localStorage.getItem('neurolint-onboarding');
        if (localData) {
          const parsed = JSON.parse(localData);
          setOnboardingData(parsed);
        }
      } finally {
        setLoading(false);
      }
    }

    loadOnboardingData();
  }, []);

  if (loading) {
    return (
      <div className="onboarding-welcome-container">
        <div className="welcome-loading">
          <div className="loading-spinner"></div>
          <p>Loading your personalized settings...</p>
        </div>
      </div>);

  }

  if (!onboardingData) {
    return null;
  }

  const { experience_level, team_size, interested_features, personalized_config } = onboardingData;

  return (
    <div className="onboarding-welcome-container">
      <div className="welcome-header">
                <h3>Modernization Profile</h3>
        <p>Your React/Next.js modernization configuration</p>
      </div>

      <div className="welcome-content">
        <div className="config-section">
          <div className="config-item">
            <span className="config-label">Experience Level</span>
                        <span className={`config-badge ${experience_level?.toLowerCase() || 'beginner'}`}>
              {experience_level || 'Beginner'}
            </span>
          </div>
          <div className="config-item">
            <span className="config-label">Team Size</span>
                        <span className="config-badge team-size">{team_size || 'Solo'}</span>
          </div>
          <div className="config-item">
                        <span className="config-label">Modernization Layers</span>
            <div className="layers-list">
              {(personalized_config?.recommended_layers || []).map((layer) =>
              <span key={layer} className="layer-badge">
                  {layer}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="features-section">
                    <h4>Modernization Features</h4>
          <div className="features-list">
            {(interested_features || []).map((feature, index) =>
            <div key={`${feature}-${index}`} className="feature-item">
                <span className="feature-name">{feature}</span>
              </div>
            )}
          </div>
        </div>

        {(personalized_config?.tips || []).length > 0 &&
        <div className="tips-section">
                        <h4>Modernization Tips</h4>
            <div className="tips-list">
                            {(personalized_config?.tips || []).slice(0, 2).map((tip, index) =>
            <div key={`tip-${index}`} className="tip-item">
                  <p>{tip}</p>
                </div>
            )}
            </div>
          </div>
        }
      </div>

      <style jsx>{`
        .onboarding-welcome-container {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 50%, rgba(0, 0, 0, 0.4) 100%);
          border: 1px solid #000000;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          backdrop-filter: blur(15px);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .welcome-loading {
          text-align: center;
          padding: 32px;
          color: rgba(255, 255, 255, 0.8);
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 1px solid #000000;
          border-top: 1px solid #000000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .welcome-prompt {
          text-align: center;
          padding: 32px;
          color: rgba(255, 255, 255, 0.8);
        }

        .welcome-prompt h3 {
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 8px;
          font-size: 20px;
          font-weight: 600;
        }

        .welcome-prompt p {
          margin-bottom: 24px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
        }

        .setup-button {
          display: inline-block;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          font-size: 14px;
          border: 1px solid #000000;
          transition: all 0.3s ease;
        }

        .setup-button:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: #000000;
        }

        .welcome-header {
          margin-bottom: 24px;
        }

        .welcome-header h3 {
          color: rgba(255, 255, 255, 0.9);
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .welcome-header p {
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          margin: 0;
        }

        .welcome-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .config-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .config-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
        }

        .config-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid #000000;
        }

        .layers-list {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .layer-badge {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid #000000;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .features-section h4,
        .tips-section h4 {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .features-list {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        }

        .feature-item {
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 6px;
          border: 1px solid #000000;
        }

        .feature-name {
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          font-weight: 500;
        }

        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .tip-item {
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          border: 1px solid #000000;
        }

        .tip-item p {
          color: rgba(255, 255, 255, 0.8);
          font-size: 13px;
          line-height: 1.4;
          margin: 0;
        }

        @media (max-width: 768px) {
          .onboarding-welcome-container {
            padding: 24px;
          }
          
          .features-list {
            grid-template-columns: 1fr;
          }
          
          .config-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>);

}