/**
 * SafeReport: Organisation Directory & Referral Matching
 *
 * This is the curated, hardcoded directory of Nigerian sexual and
 * gender-based violence (SGBV) support organisations. It is intentionally
 * hardcoded rather than fetched from a CMS so it works offline and is never
 * a single point of failure during a crisis moment.
 *
 * Sources:
 *  - NAPTIP (National Agency for the Prohibition of Trafficking in Persons)
 *  - NGF SARC Directory, April 2021
 *  - Action4Justice Nigeria
 *  - Global Citizen Nigeria SGBV roundup
 *  - Individual org websites
 */

export type OrgType =
  | 'government'      // statutory / law enforcement referral
  | 'medical'         // forensic exam, PEP, emergency care
  | 'legal'           // free legal aid, prosecution support
  | 'counselling'     // psychosocial support, therapy
  | 'ngo'             // advocacy + holistic support
  | 'emergency';      // 24/7 crisis hotline

export type IncidentType =
  | 'rape'
  | 'child_abuse'
  | 'domestic_violence'
  | 'workplace_harassment'
  | 'trafficking'
  | 'online_abuse'
  | 'other';

export type UrgencyLevel = 'immediate' | 'urgent' | 'standard';

export interface SupportOrg {
  id: string;
  name: string;
  shortName: string;
  type: OrgType[];
  description: string;
  /** ISO 3166-2:NG state codes, or ['NATIONAL'] for nationwide */
  states: string[];
  phone: string | null;
  altPhone?: string | null;
  email: string | null;
  website: string | null;
  /** Whether they offer 24/7 emergency response */
  emergency24h: boolean;
  /** Whether they accept anonymous referrals */
  acceptsAnonymous: boolean;
  /** Incident types this org specialises in */
  handles: IncidentType[];
  /** Whether they provide forensic evidence collection */
  forensicCapable: boolean;
}

export const SUPPORT_ORGS: SupportOrg[] = [
  {
    id: 'naptip',
    name: 'National Agency for the Prohibition of Trafficking in Persons',
    shortName: 'NAPTIP',
    type: ['government', 'emergency'],
    description:
      'Federal government agency with a national toll-free hotline. Handles trafficking, sexual exploitation, and violence against women and children. Can initiate formal investigation.',
    states: ['NATIONAL'],
    phone: '0800 200 2020',
    altPhone: '08137960048',
    email: 'info@naptip.gov.ng',
    website: 'https://new.naptip.gov.ng',
    emergency24h: true,
    acceptsAnonymous: true,
    handles: ['rape', 'child_abuse', 'trafficking', 'domestic_violence', 'other'],
    forensicCapable: false,
  },
  {
    id: 'mirabel',
    name: 'Mirabel Centre: Sexual Assault Referral Centre',
    shortName: 'Mirabel Centre',
    type: ['medical', 'counselling', 'ngo'],
    description:
      'Nigeria\'s first dedicated Sexual Assault Referral Centre (SARC), located at LASUTH, Ikeja, Lagos. Provides free forensic medical examinations, emergency contraception, HIV PEP, and trauma counselling at no cost to survivors.',
    states: ['NG-LA'],
    phone: '08000733273',
    altPhone: '09010106243',
    email: 'info@mirabelcentre.org',
    website: 'https://mirabelcentre.org',
    emergency24h: true,
    acceptsAnonymous: true,
    handles: ['rape', 'domestic_violence', 'child_abuse', 'other'],
    forensicCapable: true,
  },
  {
    id: 'ster',
    name: 'Stand To End Rape Initiative',
    shortName: 'STER',
    type: ['ngo', 'counselling'],
    description:
      'Leading SGBV advocacy NGO. Operates a confidential helpline, free counselling, and case accompaniment. Active in Lagos and Abuja. Strong social media presence that can amplify cases where survivors consent.',
    states: ['NG-LA', 'NG-FC'],
    phone: '08188883795',
    altPhone: null,
    email: 'info@standtoendrape.org',
    website: 'https://standtoendrape.org',
    emergency24h: false,
    acceptsAnonymous: true,
    handles: ['rape', 'domestic_violence', 'workplace_harassment', 'online_abuse', 'other'],
    forensicCapable: false,
  },
  {
    id: 'fida',
    name: 'International Federation of Women Lawyers (FIDA) Nigeria',
    shortName: 'FIDA Nigeria',
    type: ['legal'],
    description:
      'Free legal representation for women and children survivors. Has branches in 34 states. Can pursue restraining orders, prosecution support, and family court matters.',
    states: ['NATIONAL'],
    phone: '08006472428',
    altPhone: '092903746',
    email: 'fidanigeria@gmail.com',
    website: 'https://fidanigeria.org',
    emergency24h: false,
    acceptsAnonymous: false,
    handles: ['rape', 'domestic_violence', 'workplace_harassment', 'child_abuse', 'trafficking'],
    forensicCapable: false,
  },
  {
    id: 'project-alert',
    name: 'Project Alert on Violence Against Women',
    shortName: 'Project Alert',
    type: ['ngo', 'counselling', 'legal'],
    description:
      'Lagos-based NGO providing crisis shelter, free legal aid, counselling, and case documentation for women and girls experiencing violence.',
    states: ['NG-LA'],
    phone: '08033014615',
    altPhone: null,
    email: 'projectalertnigeria@gmail.com',
    website: null,
    emergency24h: false,
    acceptsAnonymous: true,
    handles: ['rape', 'domestic_violence', 'child_abuse', 'trafficking'],
    forensicCapable: false,
  },
  {
    id: 'wardc',
    name: 'Women Advocates Research and Documentation Centre',
    shortName: 'WARDC',
    type: ['ngo', 'legal', 'counselling'],
    description:
      'Lagos-based organisation providing free legal services, psychosocial support, and advocacy for SGBV survivors. Documents cases for policy reform.',
    states: ['NG-LA'],
    phone: '01-4931101',
    altPhone: null,
    email: 'wardcnig@gmail.com',
    website: null,
    emergency24h: false,
    acceptsAnonymous: true,
    handles: ['rape', 'domestic_violence', 'workplace_harassment', 'child_abuse'],
    forensicCapable: false,
  },
  {
    id: 'cleen',
    name: 'CLEEN Foundation',
    shortName: 'CLEEN Foundation',
    type: ['ngo', 'legal'],
    description:
      'Works on criminal justice and police accountability. Can assist with formal reporting to police and navigating the justice system.',
    states: ['NG-LA', 'NG-FC', 'NG-RI'],
    phone: '08033063059',
    altPhone: null,
    email: 'info@cleen.org',
    website: 'https://cleen.org',
    emergency24h: false,
    acceptsAnonymous: false,
    handles: ['rape', 'domestic_violence', 'trafficking', 'other'],
    forensicCapable: false,
  },
  {
    id: 'grid',
    name: 'Gender and Rights Initiative Development',
    shortName: 'GRID Nigeria',
    type: ['ngo', 'counselling'],
    description:
      'Abuja-based organisation providing psychosocial support and advocacy for SGBV survivors in the FCT.',
    states: ['NG-FC'],
    phone: '08065588905',
    altPhone: null,
    email: null,
    website: null,
    emergency24h: false,
    acceptsAnonymous: true,
    handles: ['rape', 'domestic_violence', 'child_abuse', 'other'],
    forensicCapable: false,
  },
  {
    id: 'ifeoma-center',
    name: 'Ifeoma Fafunwa Centre for Women & Girls',
    shortName: 'Ifeoma Centre',
    type: ['ngo', 'counselling'],
    description:
      'Kano-based support centre providing counselling, safe housing, and legal referrals for women and girls in northern Nigeria.',
    states: ['NG-KN'],
    phone: '08027143060',
    altPhone: null,
    email: null,
    website: null,
    emergency24h: false,
    acceptsAnonymous: true,
    handles: ['rape', 'domestic_violence', 'child_abuse', 'trafficking'],
    forensicCapable: false,
  },
  {
    id: 'naptip-emergency',
    name: 'Emergency Services (Police / Ambulance)',
    shortName: 'Emergency Services',
    type: ['emergency', 'government'],
    description:
      'For life-threatening emergencies. Call Nigeria Emergency number for immediate police or ambulance response.',
    states: ['NATIONAL'],
    phone: '112',
    altPhone: '199',
    email: null,
    website: null,
    emergency24h: true,
    acceptsAnonymous: true,
    handles: ['rape', 'child_abuse', 'domestic_violence', 'trafficking', 'other'],
    forensicCapable: false,
  },
];

/** Nigerian state codes to display names */
export const NIGERIA_STATES: Record<string, string> = {
  'NG-AB': 'Abia', 'NG-AD': 'Adamawa', 'NG-AK': 'Akwa Ibom',
  'NG-AN': 'Anambra', 'NG-BA': 'Bauchi', 'NG-BY': 'Bayelsa',
  'NG-BE': 'Benue', 'NG-BO': 'Borno', 'NG-CR': 'Cross River',
  'NG-DE': 'Delta', 'NG-EB': 'Ebonyi', 'NG-ED': 'Edo',
  'NG-EK': 'Ekiti', 'NG-EN': 'Enugu', 'NG-FC': 'FCT / Abuja',
  'NG-GO': 'Gombe', 'NG-IM': 'Imo', 'NG-JI': 'Jigawa',
  'NG-KD': 'Kaduna', 'NG-KN': 'Kano', 'NG-KT': 'Katsina',
  'NG-KE': 'Kebbi', 'NG-KO': 'Kogi', 'NG-KW': 'Kwara',
  'NG-LA': 'Lagos', 'NG-NA': 'Nasarawa', 'NG-NI': 'Niger',
  'NG-OG': 'Ogun', 'NG-ON': 'Ondo', 'NG-OS': 'Osun',
  'NG-OY': 'Oyo', 'NG-PL': 'Plateau', 'NG-RI': 'Rivers',
  'NG-SO': 'Sokoto', 'NG-TA': 'Taraba', 'NG-YO': 'Yobe',
  'NG-ZA': 'Zamfara',
};

/**
 * Match orgs to a report based on state and incident type.
 * Always returns at least the national NAPTIP hotline as a fallback.
 * Emergency orgs are always listed first when urgency is 'immediate'.
 */
export function matchOrgs(
  stateCode: string | null,
  incidentType: IncidentType,
  urgency: UrgencyLevel
): SupportOrg[] {
  const scored = SUPPORT_ORGS.map((org) => {
    let score = 0;

    // National orgs always qualify
    const stateMatch =
      org.states.includes('NATIONAL') ||
      (stateCode ? org.states.includes(stateCode) : false);

    if (!stateMatch) return { org, score: -1 };

    // Incident type match
    if (org.handles.includes(incidentType)) score += 10;

    // State-specific orgs rank higher than national
    if (stateCode && org.states.includes(stateCode)) score += 5;

    // Emergency orgs rank highest for immediate urgency
    if (urgency === 'immediate' && org.emergency24h) score += 20;
    if (urgency === 'urgent' && org.emergency24h) score += 8;

    // Forensic capability is critical for recent assaults
    if (urgency === 'immediate' && org.forensicCapable) score += 15;

    return { org, score };
  });

  return scored
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.org)
    .slice(0, 5); // return top 5
}
