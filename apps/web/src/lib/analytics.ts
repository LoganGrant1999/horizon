import posthog from 'posthog-js';
import * as Sentry from '@sentry/react';

// Initialize PostHog
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com';

let initialized = false;

export function initAnalytics() {
  if (!POSTHOG_KEY || initialized) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: true,
    capture_pageleave: true,
  });

  initialized = true;
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  // Add Sentry breadcrumb for all events
  Sentry.addBreadcrumb({
    category: 'analytics',
    message: eventName,
    level: 'info',
    data: properties,
  });

  if (!initialized) {
    // Log in development even if PostHog not configured
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, properties);
    }
    return;
  }

  posthog.capture(eventName, properties);
}

// Specific event trackers
export const analytics = {
  onboardingCompleted: () => {
    trackEvent('onboarding_completed');
  },

  firstJournalEntry: () => {
    trackEvent('first_journal_entry');
  },

  firstSymptomEntry: () => {
    trackEvent('first_symptom_entry');
  },

  firstReportGenerated: () => {
    trackEvent('first_report_generated');
  },

  userRetention7Days: () => {
    trackEvent('user_retention_7_days');
  },

  reportGenerated: (reportId: string) => {
    trackEvent('report_generated', { reportId });
  },

  symptomAdded: (category: string) => {
    trackEvent('symptom_added', { category });
  },

  journalEntryCreated: () => {
    trackEvent('journal_entry_created');
  },

  // New events requested
  analyzeSymptoms: () => {
    trackEvent('analyze_symptoms');
  },

  generateReport: (reportType: string) => {
    trackEvent('generate_report', { reportType });
  },

  exportPDF: (documentType: string) => {
    trackEvent('export_pdf', { documentType });
  },

  changePassword: () => {
    trackEvent('change_password');
  },

  exportData: () => {
    trackEvent('export_data');
  },

  deleteAccount: () => {
    trackEvent('delete_account');
  },
};

// Export posthog instance for user identification
export { posthog };