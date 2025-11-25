"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;
        
        // Handle fragment-based tokens (from Supabase OAuth)
        if (hash && hash.includes('access_token')) {
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const expiresAt = params.get('expires_at');
          const expiresIn = params.get('expires_in');
          
          if (accessToken && refreshToken) {
            // Create session object
            const session = {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: parseInt(expiresAt || '0'),
              expires_in: parseInt(expiresIn || '3600'),
              token_type: 'bearer'
            };
            
            // Store session
            localStorage.setItem('supabase_session', JSON.stringify(session));
            
            // Fetch user data using the access token
            const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              
              // Store user data
              const user = {
                id: userData.id,
                email: userData.email,
                firstName: userData.user_metadata?.full_name?.split(' ')[0] || '',
                lastName: userData.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                plan: 'free',
                emailConfirmed: userData.email_confirmed_at !== null,
                createdAt: userData.created_at
              };
              
              localStorage.setItem('user_data', JSON.stringify(user));
              
              setStatus('success');
              
              // Clear URL and redirect
              window.history.replaceState({}, document.title, '/dashboard');
              router.push('/dashboard');
              return;
            }
          }
        }
        
        // Handle query parameter based codes (OAuth callback)
        if (search && search.includes('code')) {
          const params = new URLSearchParams(search);
          const code = params.get('code');
          const error = params.get('error');
          
          if (error) {
            throw new Error(params.get('error_description') || 'OAuth authentication failed');
          }
          
          if (code) {
            // Exchange code for session via our API
            const response = await fetch('/api/auth/oauth', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              setStatus('success');
              router.push('/dashboard');
              return;
            }
          }
        }
        
        // If we get here, something went wrong
        throw new Error('Invalid OAuth callback');
        
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        
        // Redirect to login with error after delay
        setTimeout(() => {
          router.push(`/login?error=oauth_failed&message=${encodeURIComponent(error)}`);
        }, 3000);
      }
    };

    handleOAuthCallback();
  }, [router, error]);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && status === 'loading') {
      router.push('/dashboard');
    }
  }, [user, router, status]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      textAlign: 'center'
    }}>
      {status === 'loading' && (
        <>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(33, 150, 243, 0.3)',
            borderTop: '3px solid rgba(33, 150, 243, 0.8)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }} />
          <h2>Completing authentication...</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Please wait while we complete your login.
          </p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div style={{
            color: '#4CAF50',
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>✓</div>
          <h2>Authentication successful!</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Redirecting to dashboard...
          </p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <div style={{
            color: '#f44336',
            fontSize: '3rem',
            marginBottom: '1rem'
          }}>✗</div>
          <h2>Authentication failed</h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
            {error || 'An error occurred during authentication.'}
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            Redirecting to login page...
          </p>
        </>
      )}
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
