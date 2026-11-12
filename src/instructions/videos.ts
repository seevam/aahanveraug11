/**
 * The "How to use eye drops" videos.
 *
 * Streamed from Google Drive rather than bundled: the three files are about
 * 340 MB between them, which would take the app from roughly 45 MB to well
 * over 300 MB. The cost is that they need an internet connection.
 *
 * The folder is shared as "anyone with the link", so viewing needs no Google
 * account. If a file is ever re-uploaded, its id changes and must be updated
 * here — the id is the part of the Drive link between `/d/` and `/view`.
 *
 * Pure, so the ordering rules can be tested without React.
 */

export type VideoLanguage = 'en' | 'hi' | 'ta';

export type InstructionVideo = {
  language: VideoLanguage;
  driveId: string;
};

/** In the order they are offered when nothing else decides. */
export const INSTRUCTION_VIDEOS: readonly InstructionVideo[] = [
  { language: 'en', driveId: '1-lX4Z1JUmTdaGV3c0l3Nj398k-vmx4zn' },
  { language: 'hi', driveId: '1DhDyil6-D0Ajjhc0hP8-JjJlVcohRYiR' },
  { language: 'ta', driveId: '1YlK8jEIlcIRRfhD5tAsJcsCq8RwkpBIL' },
];

const FALLBACK: VideoLanguage = 'en';

/** Drive's embeddable player. */
export function previewUrl(driveId: string): string {
  return `https://drive.google.com/file/d/${driveId}/preview`;
}

/** The normal Drive viewer, for opening in a browser or the Drive app. */
export function viewUrl(driveId: string): string {
  return `https://drive.google.com/file/d/${driveId}/view`;
}

export function thumbnailUrl(driveId: string, width: number = 480): string {
  return `https://drive.google.com/thumbnail?id=${driveId}&sz=w${width}`;
}

/**
 * The video to play, and the other two to offer underneath.
 *
 * The main one is in `language`; anything the app does not have a video for
 * falls back to English rather than showing nothing.
 */
export function videosFor(language: string): {
  main: InstructionVideo;
  others: InstructionVideo[];
} {
  const wanted = INSTRUCTION_VIDEOS.some((v) => v.language === language) ? language : FALLBACK;
  const main = INSTRUCTION_VIDEOS.find((v) => v.language === wanted)!;
  return { main, others: INSTRUCTION_VIDEOS.filter((v) => v !== main) };
}

/**
 * Hosts the embedded player may load. Drive's player is assembled from
 * several Google domains, so this is a list of suffixes, not one host. It
 * exists so a link inside the player cannot navigate the window to some
 * unrelated site.
 */
const ALLOWED_HOST_SUFFIXES = [
  'google.com',
  'googleapis.com',
  'googleusercontent.com',
  'googlevideo.com',
  'gstatic.com',
  'youtube.com',
  'ytimg.com',
];

export function isAllowedPlayerUrl(url: string): boolean {
  if (url === 'about:blank') return true;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  return ALLOWED_HOST_SUFFIXES.some(
    (suffix) => parsed.hostname === suffix || parsed.hostname.endsWith(`.${suffix}`),
  );
}
