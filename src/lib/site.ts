/**
 * Single source of truth for brand strings.
 *
 * Everything user-facing pulls from here so the brand can never drift
 * between the marketing site, the app shell, and the AI prompts.
 */
export const SITE = {
  name: 'Ventaya',
  /** The AI companion's name, used throughout the product surface. */
  companion: 'Aya',
  tagline: 'Move forward. Feel steady.',
  description:
    'Ventaya is an AI wellness companion that turns how you feel into what you do next: guided journaling, mood insight, and a daily plan that adapts to you. For individuals and for teams.',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://ventaya.com',
  supportEmail: 'support@ventaya.com',
  salesEmail: 'sales@ventaya.com',
  contactEmail: 'lawalgiyath200716@gmail.com',
  whatsappNumber: '08062679191',
  whatsappDisplay: '+234 806 267 9191',
  whatsappLink: 'https://wa.me/2348062679191',
} as const;
