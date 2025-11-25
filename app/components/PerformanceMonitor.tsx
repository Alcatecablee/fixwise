'use client';
import { useEffect } from 'react';

// Declare gtag as a global function
declare global {
  function gtag(...args: any[]): void;
}

interface PerformanceMetrics {
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  fcp: number;
}

const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Helper function to safely observe performance entries
    const safeObserve = (entryTypes: string[], callback: (entries: PerformanceEntryList) => void) => {
      try {
        if ('PerformanceObserver' in window) {
          new PerformanceObserver((entryList) => {
            callback(entryList.getEntries());
          }).observe({ entryTypes });
        }
      } catch (error) {
        console.warn('PerformanceObserver not supported for entry types:', entryTypes, error);
      }
    };

    // Track Core Web Vitals
    const trackCoreWebVitals = () => {
      // Largest Contentful Paint (LCP)
      safeObserve(['largest-contentful-paint'], (entries) => {
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          const lcp = lastEntry.startTime;
          
          // Send to analytics
          if (typeof gtag !== 'undefined') {
            gtag('event', 'core_web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'LCP',
              value: Math.round(lcp),
              non_interaction: true,
            });
          }
          
          console.log('LCP:', lcp);
        }
      });

      // First Input Delay (FID)
      safeObserve(['first-input'], (entries) => {
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          const fid = fidEntry.processingStart - fidEntry.startTime;
          
          if (typeof gtag !== 'undefined') {
            gtag('event', 'core_web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'FID',
              value: Math.round(fid),
              non_interaction: true,
            });
          }
          
          console.log('FID:', fid);
        });
      });

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      safeObserve(['layout-shift'], (entries) => {
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'core_web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'CLS',
            value: Math.round(clsValue * 1000) / 1000,
            non_interaction: true,
          });
        }
        
        console.log('CLS:', clsValue);
      });

      // First Contentful Paint (FCP) - with fallback
      if (typeof PerformanceObserver !== 'undefined' && PerformanceObserver.supportedEntryTypes?.includes('first-contentful-paint')) {
        safeObserve(['first-contentful-paint'], (entries) => {
          if (entries.length > 0) {
            const fcp = entries[0]?.startTime;
          
            if (fcp !== undefined) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'core_web_vitals', {
                  event_category: 'Web Vitals',
                  event_label: 'FCP',
                  value: Math.round(fcp),
                  non_interaction: true,
                });
              }
              
              console.log('FCP:', fcp);
            }
          }
        });
      }

      // Time to First Byte (TTFB)
      safeObserve(['navigation'], (entries) => {
        entries.forEach((entry) => {
          const navEntry = entry as PerformanceNavigationTiming;
          const ttfb = navEntry.responseStart - navEntry.requestStart;
          
          if (typeof gtag !== 'undefined') {
            gtag('event', 'core_web_vitals', {
              event_category: 'Web Vitals',
              event_label: 'TTFB',
              value: Math.round(ttfb),
              non_interaction: true,
            });
          }
          
          console.log('TTFB:', ttfb);
        });
      });
    };

    // Track page load performance
    const trackPageLoad = () => {
      window.addEventListener('load', () => {
        setTimeout(() => {
          try {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paint = performance.getEntriesByType('paint');
            
            const metrics = {
              dns: navigation.domainLookupEnd - navigation.domainLookupStart,
              tcp: navigation.connectEnd - navigation.connectStart,
              ttfb: navigation.responseStart - navigation.requestStart,
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
              loadComplete: navigation.loadEventEnd - navigation.fetchStart,
              fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
            };

            // Send to analytics
            if (typeof gtag !== 'undefined') {
              gtag('event', 'page_load_performance', {
                event_category: 'Performance',
                event_label: 'Page Load',
                value: Math.round(metrics.loadComplete),
                custom_map: {
                  dns_time: Math.round(metrics.dns),
                  tcp_time: Math.round(metrics.tcp),
                  ttfb_time: Math.round(metrics.ttfb),
                  dom_content_loaded: Math.round(metrics.domContentLoaded),
                  first_contentful_paint: Math.round(metrics.fcp),
                },
              });
            }
            
            console.log('Page Load Metrics:', metrics);
          } catch (error) {
            console.warn('Error tracking page load metrics:', error);
          }
        }, 0);
      });
    };

    // Track resource loading performance
    const trackResourcePerformance = () => {
      safeObserve(['resource'], (entries) => {
        entries.forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            const duration = resourceEntry.duration;
            const size = resourceEntry.transferSize || 0;
            
            // Only track slow resources (> 1 second) or large resources (> 100KB)
            if (duration > 1000 || size > 100000) {
              if (typeof gtag !== 'undefined') {
                gtag('event', 'resource_performance', {
                  event_category: 'Performance',
                  event_label: resourceEntry.name,
                  value: Math.round(duration),
                  custom_map: {
                    resource_size: size,
                    resource_type: resourceEntry.initiatorType,
                  },
                });
              }
              
              console.log('Slow Resource:', {
                name: resourceEntry.name,
                duration,
                size,
                type: resourceEntry.initiatorType,
              });
            }
          }
        });
      });
    };

    // Track user interactions
    const trackUserInteractions = () => {
      let interactionCount = 0;
      let lastInteractionTime = Date.now();
      
      const trackInteraction = () => {
        interactionCount++;
        lastInteractionTime = Date.now();
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'user_interaction', {
            event_category: 'Engagement',
            event_label: 'User Interaction',
            value: interactionCount,
          });
        }
      };

      // Track clicks, scrolls, and form interactions
      document.addEventListener('click', trackInteraction);
      document.addEventListener('scroll', () => {
        // Throttle scroll events
        if (Date.now() - lastInteractionTime > 1000) {
          trackInteraction();
        }
      });
      document.addEventListener('submit', trackInteraction);
    };

    // Initialize all tracking
    trackCoreWebVitals();
    trackPageLoad();
    trackResourcePerformance();
    trackUserInteractions();

    // Track SEO-related metrics
    const trackSEOMetrics = () => {
      // Track page visibility
      document.addEventListener('visibilitychange', () => {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'page_visibility', {
            event_category: 'SEO',
            event_label: document.hidden ? 'Hidden' : 'Visible',
          });
        }
      });

      // Track scroll depth
      let maxScrollDepth = 0;
      window.addEventListener('scroll', () => {
        const scrollDepth = Math.round(
          (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;
          
          // Track at 25%, 50%, 75%, 100%
          if ([25, 50, 75, 100].includes(maxScrollDepth)) {
            if (typeof gtag !== 'undefined') {
              gtag('event', 'scroll_depth', {
                event_category: 'SEO',
                event_label: `${maxScrollDepth}%`,
                value: maxScrollDepth,
              });
            }
          }
        }
      });
    };

    trackSEOMetrics();

  }, []);

  return null; // This component doesn't render anything
};

export default PerformanceMonitor; 