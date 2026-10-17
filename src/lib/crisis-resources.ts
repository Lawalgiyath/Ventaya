/**
 * Crisis and support directory.
 *
 * The original build listed Nigerian services only. Ventaya sells globally, so
 * this is region-grouped with the country picked by the user. The Nigerian
 * organizations are kept: they were well chosen and the product's roots are
 * there.
 *
 * Duty of care: an app that invites people to write down their worst thoughts
 * must be able to point them somewhere real. App review teams look for this.
 */

export interface Resource {
  name: string;
  description: string;
  phone?: string;
  sms?: string;
  website: string;
  /** Round-the-clock availability, surfaced prominently in the UI. */
  always?: boolean;
}

export interface Region {
  code: string;
  country: string;
  emergency: string;
  resources: Resource[];
}

export const REGIONS: Region[] = [
  {
    code: 'US',
    country: 'United States',
    emergency: '911',
    resources: [
      {
        name: '988 Suicide & Crisis Lifeline',
        description:
          'Free, confidential support for people in distress, 24 hours a day. Call or text 988.',
        phone: '988',
        sms: '988',
        website: 'https://988lifeline.org',
        always: true,
      },
      {
        name: 'Crisis Text Line',
        description:
          'Text-based crisis counselling with a trained volunteer. Text HOME to 741741.',
        sms: '741741',
        website: 'https://www.crisistextline.org',
        always: true,
      },
      {
        name: 'SAMHSA National Helpline',
        description:
          'Treatment referral and information for mental health and substance use, in English and Spanish.',
        phone: '1-800-662-4357',
        website: 'https://www.samhsa.gov/find-help/national-helpline',
        always: true,
      },
      {
        name: 'The Trevor Project',
        description:
          'Crisis intervention and suicide prevention for LGBTQ+ young people.',
        phone: '1-866-488-7386',
        sms: '678678',
        website: 'https://www.thetrevorproject.org',
        always: true,
      },
    ],
  },
  {
    code: 'GB',
    country: 'United Kingdom',
    emergency: '999',
    resources: [
      {
        name: 'Samaritans',
        description:
          'A safe place to talk any time, about whatever is troubling you. Free to call.',
        phone: '116 123',
        website: 'https://www.samaritans.org',
        always: true,
      },
      {
        name: 'Shout',
        description:
          'Free, confidential text support for anyone in crisis. Text SHOUT to 85258.',
        sms: '85258',
        website: 'https://giveusashout.org',
        always: true,
      },
      {
        name: 'Mind',
        description:
          'Information and advice on mental health problems, plus local service signposting.',
        phone: '0300 123 3393',
        website: 'https://www.mind.org.uk',
      },
    ],
  },
  {
    code: 'NG',
    country: 'Nigeria',
    emergency: '112',
    resources: [
      {
        name: 'Mentally Aware Nigeria Initiative (MANI)',
        description:
          'Nigeria’s largest youth-led mental health advocacy organization, with a free helpline.',
        phone: '+234 809 111 6264',
        website: 'https://mentallyaware.org',
        always: true,
      },
      {
        name: 'She Writes Woman',
        description:
          'A women-led movement giving mental health a voice in Nigeria, with a 24/7 helpline.',
        phone: '0800 800 2000',
        website: 'https://shewriteswoman.org',
        always: true,
      },
      {
        name: 'Nigeria Suicide Prevention Initiative',
        description:
          'Counselling and crisis support for people experiencing suicidal thoughts.',
        phone: '+234 806 210 6493',
        website: 'https://nigeriasuicideprevention.com',
      },
    ],
  },
  {
    code: 'CA',
    country: 'Canada',
    emergency: '911',
    resources: [
      {
        name: '9-8-8 Suicide Crisis Helpline',
        description:
          'Bilingual crisis support across Canada by call or text, at any hour.',
        phone: '988',
        sms: '988',
        website: 'https://988.ca',
        always: true,
      },
      {
        name: 'Kids Help Phone',
        description:
          'Counselling and support for young people. Text CONNECT to 686868.',
        phone: '1-800-668-6868',
        sms: '686868',
        website: 'https://kidshelpphone.ca',
        always: true,
      },
    ],
  },
  {
    code: 'AU',
    country: 'Australia',
    emergency: '000',
    resources: [
      {
        name: 'Lifeline Australia',
        description: 'Crisis support and suicide prevention, 24 hours a day.',
        phone: '13 11 14',
        sms: '0477 13 11 14',
        website: 'https://www.lifeline.org.au',
        always: true,
      },
      {
        name: 'Beyond Blue',
        description:
          'Support for anxiety, depression and suicide prevention, by phone and webchat.',
        phone: '1300 22 4636',
        website: 'https://www.beyondblue.org.au',
        always: true,
      },
    ],
  },
  {
    code: 'IN',
    country: 'India',
    emergency: '112',
    resources: [
      {
        name: 'Tele-MANAS',
        description:
          'The Government of India’s free national tele-mental health service, in many languages.',
        phone: '14416',
        website: 'https://telemanas.mohfw.gov.in',
        always: true,
      },
      {
        name: 'AASRA',
        description: 'Confidential crisis counselling for people in distress.',
        phone: '+91 98204 66726',
        website: 'https://www.aasra.info',
        always: true,
      },
    ],
  },
];

/** Fallback for visitors whose country isn't listed. */
export const INTERNATIONAL: Resource = {
  name: 'Find a helpline in your country',
  description:
    'A verified, searchable directory of free emotional-support helplines worldwide.',
  website: 'https://findahelpline.com',
  always: true,
};

export function regionByCode(code: string): Region | undefined {
  return REGIONS.find((r) => r.code === code);
}

/** Best-effort country guess from the browser locale. */
export function guessRegionCode(): string {
  if (typeof navigator === 'undefined') return 'US';
  const locale = navigator.language || 'en-US';
  const parts = locale.split('-');
  const code = parts[parts.length - 1]?.toUpperCase();
  return REGIONS.some((r) => r.code === code) ? code : 'US';
}
