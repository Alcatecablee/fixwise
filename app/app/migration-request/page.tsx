"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../components/ui/Toast";
import { ErrorBoundary } from "../../components/ui/ErrorBoundary";

interface MigrationFormData {
  projectName: string;
  projectDescription: string;
  currentStack: string;
  targetStack: string;
  codebaseSize: string;
  timeline: string;
  customRequirements: string;
  contactEmail: string;
  companyName: string;
  budget: string;
}

export default function MigrationRequestPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<MigrationFormData>({
    projectName: "",
    projectDescription: "",
    currentStack: "",
    targetStack: "",
    codebaseSize: "",
    timeline: "",
    customRequirements: "",
    contactEmail: "",
    companyName: "",
    budget: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Input validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required field validation
    if (!formData.projectName.trim()) {
      newErrors.projectName = 'Project name is required';
    }
    
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }
    
    if (!formData.codebaseSize) {
      newErrors.codebaseSize = 'Please select a codebase size';
    }
    
    if (!formData.currentStack.trim()) {
      newErrors.currentStack = 'Current stack is required';
    }
    
    if (!formData.targetStack.trim()) {
      newErrors.targetStack = 'Target stack is required';
    }
    
    if (!formData.timeline) {
      newErrors.timeline = 'Please select a timeline';
    }
    
    if (!formData.projectDescription.trim()) {
      newErrors.projectDescription = 'Project description is required';
    }
    
    // Business logic validation
    if (formData.projectDescription.length < 50) {
      newErrors.projectDescription = 'Project description must be at least 50 characters';
    }
    
    if (formData.projectDescription.length > 2000) {
      newErrors.projectDescription = 'Project description must be less than 2000 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors in the form before submitting.',
      });
      return;
    }
    
    setIsSubmitting(true);
    setIsValidating(true);

    try {
      const response = await fetch("/api/migration/request-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          source: "migration-request-form",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSubmitted(true);
    } catch (error) {
      // Log error to proper logging system instead of console
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Send error to logging service
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'error',
            message: 'Migration request submission failed',
            data: { error: errorMessage, formData: { ...formData, contactEmail: '[REDACTED]' } },
            timestamp: new Date().toISOString()
          })
        });
      } catch (logError) {
        // Fallback logging if logging service fails
        // In production, this would go to a proper logging system
      }
      
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: 'Failed to submit request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
      setIsValidating(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold mb-4">Request Submitted Successfully!</h1>
              <p className="text-gray-300 mb-6">
                Thank you for your interest in our One-Time Migration service.
                Our enterprise team will review your request and contact you within 24 hours.
              </p>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">What happens next?</h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <h4 className="font-semibold">Initial Assessment (24 hours)</h4>
                    <p className="text-gray-400 text-sm">Our team reviews your project requirements and codebase details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <div>
                    <h4 className="font-semibold">Custom Quote (48 hours)</h4>
                    <p className="text-gray-400 text-sm">Receive detailed pricing and migration plan ($999-$9,999)</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <div>
                    <h4 className="font-semibold">Migration Execution</h4>
                    <p className="text-gray-400 text-sm">Professional migration with 30-day priority support</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard
              </button>
              <p className="text-gray-400 text-sm">
                Questions? Contact us at{" "}
                <a href="mailto:migration@neurolint.dev" className="text-blue-400 hover:underline">
                  migration@neurolint.dev
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-4">There was an error loading the migration request form.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    }>
      <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">One-Time Migration Service</h1>
            <p className="text-xl text-gray-300 mb-6">
              Professional legacy codebase modernization with enterprise-grade safety
            </p>
            <div className="flex justify-center space-x-8 text-sm text-gray-400">
              <div className="text-center">
                <div className="text-white font-semibold">$999 - $9,999</div>
                <div>Quote-based pricing</div>
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">All Layers (1-6)</div>
                <div>Complete transformation</div>
              </div>
              <div className="text-center">
                <div className="text-white font-semibold">30 Days</div>
                <div>Priority support</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">What's Included</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Full codebase migration (unlimited files)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>React 16→18, Next.js 12→14 upgrades</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Detailed migration report (PDF/CSV)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Rollback & safety suite</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>30 days priority support</span>
                </li>
                <li className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Optional custom rules</span>
                </li>
              </ul>
            </div>

            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Perfect For</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Legacy React applications</li>
                <li>• Next.js Pages Router → App Router</li>
                <li>• Class components → Hooks migration</li>
                <li>• TypeScript modernization</li>
                <li>• Performance optimization</li>
                <li>• Enterprise codebases</li>
              </ul>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Request Custom Quote</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name *</label>
                <input
                  type="text"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 ${
                    errors.projectName ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="My Legacy App Migration"
                  required
                  aria-describedby={errors.projectName ? 'projectName-error' : undefined}
                />
                {errors.projectName && (
                  <p id="projectName-error" className="text-red-500 text-sm mt-1">
                    {errors.projectName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contact Email *</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 ${
                    errors.contactEmail ? 'border-red-500' : 'border-gray-700'
                  }`}
                  placeholder="john@company.com"
                  required
                  aria-describedby={errors.contactEmail ? 'contactEmail-error' : undefined}
                />
                {errors.contactEmail && (
                  <p id="contactEmail-error" className="text-red-500 text-sm mt-1">
                    {errors.contactEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Acme Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Codebase Size *</label>
                <select
                  name="codebaseSize"
                  value={formData.codebaseSize}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select size</option>
                  <option value="small">Small (&lt; 50 files, ~$999-$1,999)</option>
                  <option value="medium">Medium (50-200 files, ~$2,000-$4,999)</option>
                  <option value="large">Large (200-500 files, ~$5,000-$7,999)</option>
                  <option value="enterprise">Enterprise (500+ files, ~$8,000-$9,999)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Stack *</label>
                <input
                  type="text"
                  name="currentStack"
                  value={formData.currentStack}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="React 16, Next.js 12, JavaScript"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Target Stack *</label>
                <input
                  type="text"
                  name="targetStack"
                  value={formData.targetStack}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="React 18, Next.js 14, TypeScript"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timeline *</label>
                <select
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select timeline</option>
                  <option value="urgent">Urgent (1-2 weeks)</option>
                  <option value="normal">Normal (2-4 weeks)</option>
                  <option value="flexible">Flexible (1-2 months)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Budget Range</label>
                <select
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select budget</option>
                  <option value="1k-3k">$1,000 - $3,000</option>
                  <option value="3k-5k">$3,000 - $5,000</option>
                  <option value="5k-8k">$5,000 - $8,000</option>
                  <option value="8k+">$8,000+</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Project Description *</label>
              <textarea
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Describe your project, current challenges, and migration goals..."
                required
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Custom Requirements</label>
              <textarea
                name="customRequirements"
                value={formData.customRequirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Any specific requirements, custom rules, or special considerations..."
              />
            </div>

            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting || isValidating}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
                aria-describedby="submit-status"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : isValidating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Validating...</span>
                  </>
                ) : (
                  "Request Custom Quote"
                )}
              </button>
            </div>
            
            <div id="submit-status" className="sr-only" aria-live="polite">
              {isSubmitting ? 'Submitting migration request...' : isValidating ? 'Validating form...' : 'Ready to submit'}
            </div>

            <p className="text-center text-gray-400 text-sm mt-4">
              We'll respond within 24 hours with a detailed proposal
            </p>
          </form>
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
