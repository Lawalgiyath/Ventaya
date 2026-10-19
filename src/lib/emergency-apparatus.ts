/**
 * Ventaya Emergency Help & Institutional Apparatus Directory (Nigeria)
 *
 * Covers:
 * 1. Nigeria Police Force (NPF) Gender Desks & Commands
 * 2. State Ministries of Women Affairs & Social Development (MWASD)
 * 3. Sexual Assault Referral Centres (SARCs) with forensic & PEP care
 * 4. Human Rights & Legal Aid Councils (LACON, NHRC, FIDA)
 * 5. Emergency 24/7 Rescue & Crisis Hotlines
 */

export type ApparatusCategory =
  | 'police'
  | 'ministry'
  | 'sarc_medical'
  | 'legal_rights'
  | 'shelter_ngo'
  | 'emergency_hotline';

export interface EmergencyPoint {
  id: string;
  name: string;
  category: ApparatusCategory;
  stateCode: string; // e.g. 'NG-LA', 'NG-FC', 'NATIONAL'
  stateName: string;
  lga?: string;
  address: string;
  phone: string;
  altPhone?: string;
  email?: string;
  website?: string;
  is24h: boolean;
  services: string[];
  lat?: number;
  lng?: number;
}

export const EMERGENCY_APPARATUS: EmergencyPoint[] = [
  // ── NATIONAL EMERGENCY HOTLINES ──────────────────────────────────────────
  {
    id: 'nat-emergency-112',
    name: 'National Emergency Toll-Free Service',
    category: 'emergency_hotline',
    stateCode: 'NATIONAL',
    stateName: 'Nationwide',
    address: 'Federal Republic of Nigeria Emergency Communications Centre',
    phone: '112',
    is24h: true,
    services: ['Emergency Police dispatch', 'Ambulance service', 'Fire rescue'],
  },
  {
    id: 'nat-naptip-hotline',
    name: 'NAPTIP National Crisis & Anti-Trafficking Command',
    category: 'emergency_hotline',
    stateCode: 'NATIONAL',
    stateName: 'Nationwide',
    address: 'NAPTIP Headquarters, Plot 2028, Dalaba Street, Wuse Zone 5, Abuja',
    phone: '0800 200 2020',
    altPhone: '08137960048',
    email: 'info@naptip.gov.ng',
    website: 'https://new.naptip.gov.ng',
    is24h: true,
    services: ['Trafficking rescue', 'Child abuse response', 'Gender violence investigation', 'Nationwide shelter placement'],
    lat: 9.0645,
    lng: 7.4682,
  },
  {
    id: 'nat-nhrc-sgbv',
    name: 'National Human Rights Commission (NHRC) SGBV Desk',
    category: 'legal_rights',
    stateCode: 'NATIONAL',
    stateName: 'Nationwide',
    address: 'No 19 Aguiyi Ironsi Street, Maitama, Abuja (State offices across all 36 states)',
    phone: '6472',
    altPhone: '0800 647 2428',
    email: 'info@nigeriarights.gov.ng',
    website: 'https://nigeriarights.gov.ng',
    is24h: false,
    services: ['Human rights protection', 'Free state legal accompaniment', 'Enforcement of VAPP Act'],
    lat: 9.0833,
    lng: 7.4983,
  },

  // ── LAGOS STATE (NG-LA) ──────────────────────────────────────────────────
  {
    id: 'la-mirabel-sarc',
    name: 'Mirabel Centre (Sexual Assault Referral Centre)',
    category: 'sarc_medical',
    stateCode: 'NG-LA',
    stateName: 'Lagos',
    lga: 'Ikeja',
    address: 'Lagos State University Teaching Hospital (LASUTH), Ikeja, Lagos',
    phone: '0800 073 3273',
    altPhone: '0901 010 6243',
    email: 'info@mirabelcentre.org',
    website: 'https://mirabelcentre.org',
    is24h: true,
    services: ['Free PEP medication (within 72h)', 'Emergency contraception (within 120h)', 'Forensic medical examination', 'Trauma counselling'],
    lat: 6.5964,
    lng: 3.3514,
  },
  {
    id: 'la-dsva-ministry',
    name: 'Lagos State Domestic and Sexual Violence Agency (DSVA)',
    category: 'ministry',
    stateCode: 'NG-LA',
    stateName: 'Lagos',
    lga: 'Ikeja',
    address: 'Nob-Oluwa Complex, Alausa, Ikeja, Lagos State',
    phone: '08000 333 333',
    altPhone: '0906 288 7861',
    email: 'dsva@lagosstate.gov.ng',
    website: 'https://dsva.lagosstate.gov.ng',
    is24h: true,
    services: ['State emergency rescue', 'Restraining order issuance', 'Safe shelter admission', 'Police gender unit dispatch'],
    lat: 6.6186,
    lng: 3.3582,
  },
  {
    id: 'la-police-gender-desk',
    name: 'Lagos State Police Command Gender & Human Rights Unit',
    category: 'police',
    stateCode: 'NG-LA',
    stateName: 'Lagos',
    lga: 'Ikeja',
    address: 'Police Command Headquarters, GRA, Ikeja, Lagos State',
    phone: '0803 123 0631',
    altPhone: '0806 515 4338',
    is24h: true,
    services: ['Direct criminal investigation', 'Arrest of perpetrator', 'Protection of victim and children'],
    lat: 6.5912,
    lng: 3.3528,
  },
  {
    id: 'la-warif-centre',
    name: 'WARIF Centre (Women At Risk International Foundation)',
    category: 'sarc_medical',
    stateCode: 'NG-LA',
    stateName: 'Lagos',
    lga: 'Yaba',
    address: 'WARIF Centre, No. 6 Turton Street, off Commercial Avenue, Yaba, Lagos',
    phone: '0809 210 0009',
    altPhone: '0809 210 0008',
    email: 'info@warifng.org',
    website: 'https://warifng.org',
    is24h: true,
    services: ['Emergency post-assault medical treatment', 'PEP and antibiotics', 'Psychosocial therapy', 'Legal advocacy'],
    lat: 6.5108,
    lng: 3.3752,
  },
  {
    id: 'la-fida-lagos',
    name: 'FIDA Lagos (International Federation of Women Lawyers)',
    category: 'legal_rights',
    stateCode: 'NG-LA',
    stateName: 'Lagos',
    lga: 'Lagos Island',
    address: 'High Court Complex, Igbosere Road, Lagos Island, Lagos',
    phone: '0800 647 2428',
    altPhone: '0803 306 3059',
    email: 'fidalagos@yahoo.com',
    website: 'https://fidanigeria.org',
    is24h: false,
    services: ['Free legal representation', 'Court injunctions and restraining orders', 'Child custody protection'],
    lat: 6.4523,
    lng: 3.3986,
  },

  // ── FCT / ABUJA (NG-FC) ──────────────────────────────────────────────────
  {
    id: 'fc-bwari-sarc',
    name: 'Bwari Sexual Assault Referral Centre',
    category: 'sarc_medical',
    stateCode: 'NG-FC',
    stateName: 'FCT / Abuja',
    lga: 'Bwari',
    address: 'General Hospital Bwari, FCT Abuja',
    phone: '0818 888 3795',
    is24h: true,
    services: ['Free clinical forensic care', 'Post-exposure prophylaxis (PEP)', 'Immediate medical stabilisation'],
    lat: 9.2814,
    lng: 7.3785,
  },
  {
    id: 'fc-police-command',
    name: 'FCT Police Command Gender Unit',
    category: 'police',
    stateCode: 'NG-FC',
    stateName: 'FCT / Abuja',
    lga: 'Garki',
    address: 'FCT Police Command Headquarters, Moshood Abiola Way, Area 10, Garki, Abuja',
    phone: '0803 200 3913',
    altPhone: '0806 158 1938',
    is24h: true,
    services: ['Emergency intervention', 'Victim extraction', 'Arrest and detention of suspects'],
    lat: 9.0345,
    lng: 7.4871,
  },
  {
    id: 'fc-ministry-women-affairs',
    name: 'Federal Ministry of Women Affairs & Social Development',
    category: 'ministry',
    stateCode: 'NG-FC',
    stateName: 'FCT / Abuja',
    lga: 'Central Business District',
    address: 'Plot 333 Shehu Shagari Way, Central Business District, Abuja',
    phone: '0803 314 2664',
    website: 'https://womenaffairs.gov.ng',
    is24h: false,
    services: ['Federal policy intervention', 'Child rights enforcement', 'Emergency shelter liaison'],
    lat: 9.0579,
    lng: 7.4951,
  },

  // ── RIVERS STATE (NG-RI) ─────────────────────────────────────────────────
  {
    id: 'ri-police-command',
    name: 'Rivers State Police Command Gender Desk',
    category: 'police',
    stateCode: 'NG-RI',
    stateName: 'Rivers',
    lga: 'Port Harcourt',
    address: 'Rivers State Police Headquarters, Moscow Road, Port Harcourt',
    phone: '0803 200 3514',
    altPhone: '0809 888 0134',
    is24h: true,
    services: ['Rapid emergency response', 'Protection order enforcement', 'Criminal prosecution support'],
    lat: 4.7774,
    lng: 7.0134,
  },
  {
    id: 'ri-ministry-women-affairs',
    name: 'Rivers State Ministry of Women Affairs',
    category: 'ministry',
    stateCode: 'NG-RI',
    stateName: 'Rivers',
    lga: 'Port Harcourt',
    address: 'State Secretariat Complex, Phase 2, Port Harcourt, Rivers State',
    phone: '0803 551 2894',
    is24h: false,
    services: ['State emergency welfare', 'Temporary safe shelter', 'SGBV survivor psychosocial support'],
    lat: 4.7891,
    lng: 7.0152,
  },

  // ── KANO STATE (NG-KN) ───────────────────────────────────────────────────
  {
    id: 'kn-maya-sarc',
    name: 'Maya Sexual Assault Referral Centre (SARC)',
    category: 'sarc_medical',
    stateCode: 'NG-KN',
    stateName: 'Kano',
    lga: 'Nasarawa',
    address: 'Murtala Muhammad Specialist Hospital, Kano City, Kano State',
    phone: '0802 714 3060',
    is24h: true,
    services: ['Emergency forensic testing', 'Free HIV PEP treatment', 'Trauma crisis care', 'Confidential counselling'],
    lat: 11.9964,
    lng: 8.5264,
  },
  {
    id: 'kn-ministry-women-affairs',
    name: 'Kano State Ministry of Women Affairs and Social Development',
    category: 'ministry',
    stateCode: 'NG-KN',
    stateName: 'Kano',
    lga: 'Kano Municipal',
    address: 'Gidan Murtala, Kano City, Kano State',
    phone: '0803 681 4452',
    is24h: false,
    services: ['Child protection', 'Safe accommodation', 'Community crisis intervention'],
    lat: 11.9912,
    lng: 8.5142,
  },

  // ── KADUNA STATE (NG-KD) ─────────────────────────────────────────────────
  {
    id: 'kd-salama-sarc',
    name: 'Salama Sexual Assault Referral Centre',
    category: 'sarc_medical',
    stateCode: 'NG-KD',
    stateName: 'Kaduna',
    lga: 'Kaduna North',
    address: 'Barau Dikko Teaching Hospital, Lafia Road, Kaduna',
    phone: '0803 451 9872',
    is24h: true,
    services: ['24/7 forensic medical exam', 'Free emergency PEP & STI prophylaxis', 'Psychosocial support'],
    lat: 10.5186,
    lng: 7.4382,
  },
  {
    id: 'kd-ministry-social-dev',
    name: 'Kaduna State Ministry of Human Services and Social Development',
    category: 'ministry',
    stateCode: 'NG-KD',
    stateName: 'Kaduna',
    lga: 'Kaduna North',
    address: 'Independence Way, Kaduna, Kaduna State',
    phone: '0802 833 2190',
    is24h: false,
    services: ['State child welfare', 'Shelter coordination', 'Legal case accompaniment'],
    lat: 10.5234,
    lng: 7.4412,
  },

  // ── ENUGU STATE (NG-EN) ──────────────────────────────────────────────────
  {
    id: 'en-tamar-sarc',
    name: 'Tamar Sexual Assault Referral Centre',
    category: 'sarc_medical',
    stateCode: 'NG-EN',
    stateName: 'Enugu',
    lga: 'Enugu North',
    address: 'ESUT Teaching Hospital, Parklane, GRA, Enugu',
    phone: '0814 621 1184',
    is24h: true,
    services: ['Forensic medical examination', 'Emergency contraception', 'PEP medication within 72h', 'Psychological first aid'],
    lat: 6.4474,
    lng: 7.5023,
  },

  // ── OYO STATE (NG-OY) ────────────────────────────────────────────────────
  {
    id: 'oy-police-command',
    name: 'Oyo State Police Command Gender Desk',
    category: 'police',
    stateCode: 'NG-OY',
    stateName: 'Oyo',
    lga: 'Ibadan North',
    address: 'Oyo State Police Headquarters, Eleyele, Ibadan',
    phone: '0808 176 8614',
    altPhone: '0803 400 3978',
    is24h: true,
    services: ['Emergency response unit', 'Gender-based violence investigation', 'Arrest of abusers'],
    lat: 7.4112,
    lng: 3.8764,
  },
  {
    id: 'oy-ministry-women-affairs',
    name: 'Oyo State Ministry of Women Affairs and Social Inclusion',
    category: 'ministry',
    stateCode: 'NG-OY',
    stateName: 'Oyo',
    lga: 'Ibadan North',
    address: 'State Secretariat, Agodi, Ibadan, Oyo State',
    phone: '0805 531 9021',
    is24h: false,
    services: ['Rapid response team', 'Emergency shelter liaison', 'Family court support'],
    lat: 7.4082,
    lng: 3.9054,
  },

  // ── EDO STATE (NG-ED) ────────────────────────────────────────────────────
  {
    id: 'ed-vivian-sarc',
    name: 'Vivian Sexual Assault Referral Centre',
    category: 'sarc_medical',
    stateCode: 'NG-ED',
    stateName: 'Edo',
    lga: 'Oredo',
    address: 'Central Hospital, Sapele Road, Benin City, Edo State',
    phone: '0805 788 1234',
    is24h: true,
    services: ['Post-assault clinical care', 'Free HIV PEP treatment', 'Forensic evidence documentation'],
    lat: 6.3312,
    lng: 5.6284,
  },

  // ── DELTA STATE (NG-DE) ──────────────────────────────────────────────────
  {
    id: 'de-hope-sarc',
    name: 'Hope SARC Centre',
    category: 'sarc_medical',
    stateCode: 'NG-DE',
    stateName: 'Delta',
    lga: 'Warri South',
    address: 'Central Hospital, Warri, Delta State',
    phone: '0803 762 9011',
    is24h: true,
    services: ['Emergency medical exam', 'Free prophylaxis', 'Psychosocial support'],
    lat: 5.5186,
    lng: 5.7512,
  },
];

/**
 * Filter emergency points by state code, category, or approximate distance.
 */
export function getEmergencyPoints(filters?: {
  stateCode?: string | null;
  category?: ApparatusCategory | 'all';
  searchQuery?: string;
}): EmergencyPoint[] {
  let list = EMERGENCY_APPARATUS;

  if (filters?.stateCode && filters.stateCode !== 'ALL') {
    list = list.filter(
      (p) => p.stateCode === filters.stateCode || p.stateCode === 'NATIONAL'
    );
  }

  if (filters?.category && filters.category !== 'all') {
    list = list.filter((p) => p.category === filters.category);
  }

  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.stateName.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.services.some((s) => s.toLowerCase().includes(q))
    );
  }

  // Sort 24h facilities first, then by category
  return list.sort((a, b) => {
    if (a.is24h && !b.is24h) return -1;
    if (!a.is24h && b.is24h) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Calculates straight-line distance in km between two lat/lng coordinates (Haversine formula).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
