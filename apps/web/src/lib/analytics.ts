import posthog from 'posthog-js';

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
  if (!initialized) return;
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
};

// Export posthog instance for user identification
export { posthog };