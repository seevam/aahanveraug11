import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Google Play rejects a listing over its limits at the point of saving it, and
 * counts characters, not bytes. Checking here keeps store/play/listing.md
 * ready to paste.
 */

const listing = readFileSync(join(__dirname, '..', 'store', 'play', 'listing.md'), 'utf8');
const chars = (s: string) => [...s].length;

function section(language: string, heading: string): string {
  const lang = listing.split(/\n## /).find((part) => part.startsWith(language));
  if (!lang) throw new Error(`no ${language} section`);
  const match = lang.match(new RegExp(`### ${heading}\\n([\\s\\S]*?)(?=\\n### |\\n---|$)`));
  if (!match) throw new Error(`no ${heading} in ${language}`);
  return match[1]!.trim();
}

describe.each(['English', 'Hindi', 'Tamil'])('%s listing', (language) => {
  it('fits the app name limit (30)', () => {
    expect(chars(section(language, 'App name'))).toBeLessThanOrEqual(30);
  });

  it('fits the short description limit (80)', () => {
    expect(chars(section(language, 'Short description'))).toBeLessThanOrEqual(80);
  });

  it('fits the full description limit (4000)', () => {
    const full = section(language, 'Full description');
    expect(full.length).toBeGreaterThan(200);
    expect(chars(full)).toBeLessThanOrEqual(4000);
  });

  it('says it is not medical advice', () => {
    // Google Play expects health apps to be clear about what they are not.
    expect(section(language, 'Full description')).toMatch(/medical advice|डॉक्टरी सलाह|மருத்துவ ஆலோசனை/);
  });
});
