/**
 * Image registry: every URL fetched and visually confirmed, with alt text
 * describing what is actually in the frame.
 *
 * Art direction: the portraits were chosen because several were shot on rose
 * and lilac grounds, so the palette lives in the photography rather than being
 * painted on top of it.
 */

const U = 'https://images.unsplash.com/photo-';

function u(id: string, w: number, q = 78) {
  return `${U}${id}?auto=format&fit=crop&w=${w}&q=${q}`;
}

export interface Img {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function img(id: string, alt: string, ratio: number) {
  return (w = 900): Img => ({
    src: u(id, w),
    alt,
    width: w,
    height: Math.round(w * ratio),
  });
}

export const IMAGES = {
  /** Silhouette of a woman arching into a backbend against a pink sunset. */
  hero: img(
    '1544367567-0f2fcb009e0b',
    'A woman arching into a backbend, silhouetted against a pink sunset over the sea',
    0.66
  ),

  /** Person seated cross-legged in meditation, sun rising through palms. */
  meditation: img(
    '1506126613408-eca07ce68773',
    'A person seated cross-legged in meditation as the sun rises through palm trees',
    1.2
  ),

  /** Silhouette standing with both arms flung open at sunset. */
  release: img(
    '1499209974431-9dddcece7f88',
    'A person standing with both arms flung open against a golden sunset',
    0.7
  ),

  /** Woman standing with hands clasped against a concrete wall. */
  stillness: img(
    '1591343395902-1adcb454c4e2',
    'A woman standing with her hands clasped against a concrete wall',
    1.25
  ),

  /** Snow-capped peaks above a glacier valley. */
  perspective: img(
    '1517021897933-0e0319cfbc28',
    'Snow-capped mountain peaks rising above a glacier valley',
    1.2
  ),

  /** Three colleagues laughing around a table of open laptops. */
  team: img(
    '1522202176988-66273c2fd55f',
    'Three colleagues laughing together around a table of open laptops',
    0.66
  ),

  /** Two colleagues high-fiving across a desk. */
  teamWin: img(
    '1600880292203-757bb62b4baf',
    'Two colleagues high-fiving across a desk in a bright office',
    0.66
  ),
} as const;

/**
 * Faces for the marquee and quotes. Deliberately varied in age, background and
 * mood: a wellbeing product that shows one demographic is telling on itself.
 */
export const FACES: Img[] = [
  {
    src: u('1531123897727-8f129e1688ce', 500),
    alt: 'Portrait of a young woman in a white collar against a deep red wall',
    width: 500,
    height: 750,
  },
  {
    src: u('1488426862026-3ee34a7d66df', 500),
    alt: 'Portrait of a woman with dark hair against a soft pink background',
    width: 500,
    height: 750,
  },
  {
    src: u('1509967419530-da38b4704bc6', 500),
    alt: 'Portrait of a woman resting a hand against her face on a lilac background',
    width: 500,
    height: 750,
  },
  {
    src: u('1507003211169-0a1dd7228f2d', 500),
    alt: 'Portrait of a man in a white t-shirt smiling on a city street',
    width: 500,
    height: 750,
  },
  {
    src: u('1521119989659-a83eee488004', 500),
    alt: 'Portrait of a man in an orange beanie and green roll-neck, arms folded',
    width: 500,
    height: 750,
  },
  {
    src: u('1494790108377-be9c29b29330', 500),
    alt: 'Portrait of a woman in a red top laughing on a city street',
    width: 500,
    height: 750,
  },
  {
    src: u('1552058544-f2b08422138a', 500),
    alt: 'Black and white portrait of a bearded man smiling',
    width: 500,
    height: 750,
  },
  {
    src: u('1573497019940-1c28c88b4f3e', 500),
    alt: 'Portrait of a woman in a striped blazer smiling against a teal wall',
    width: 500,
    height: 750,
  },
  {
    src: u('1580489944761-15a19d654956', 500),
    alt: 'Portrait of a woman with her hair tied up against a white background',
    width: 500,
    height: 750,
  },
  {
    src: u('1534528741775-53994a69daeb', 500),
    alt: 'Portrait of a woman lit in cool violet light',
    width: 500,
    height: 750,
  },
  {
    src: u('1487412720507-e7ab37603c6f', 500),
    alt: 'Portrait of a woman in a knitted hat and scarf, smiling outdoors',
    width: 500,
    height: 750,
  },
  {
    src: u('1508214751196-bcfd4ca60f91', 500),
    alt: 'Portrait of a woman outdoors at golden hour',
    width: 500,
    height: 750,
  },
];

/** Named faces used beside quotes. */
export const QUOTE_FACES = {
  amara: FACES[0],
  priya: FACES[1],
  maya: FACES[2],
  daniel: FACES[4],
} as const;

/**
 * Deterministic generated avatar. Keyless and free; the same seed always
 * returns the same face, so a user's avatar is stable across devices.
 */
export function avatarUrl(seed: string, size = 96): string {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(
    seed
  )}&size=${size}&radius=50&backgroundColor=f7d4de,f4c2ce,efb0c0,e8dff5,fce4d6`;
}
