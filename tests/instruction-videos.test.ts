import { describe, expect, it } from 'vitest';

import {
  INSTRUCTION_VIDEOS,
  isAllowedPlayerUrl,
  previewUrl,
  thumbnailUrl,
  videosFor,
  viewUrl,
} from '../src/instructions/videos';

describe('videosFor', () => {
  it('plays the video in the app language, with the other two underneath', () => {
    const { main, others } = videosFor('hi');
    expect(main.language).toBe('hi');
    expect(others.map((v) => v.language)).toEqual(['en', 'ta']);
  });

  it('works for every language the app has a video for', () => {
    for (const language of ['en', 'hi', 'ta']) {
      const { main, others } = videosFor(language);
      expect(main.language).toBe(language);
      expect(others).toHaveLength(2);
      expect(others).not.toContain(main);
    }
  });

  it('falls back to English for any other language', () => {
    expect(videosFor('fr').main.language).toBe('en');
    expect(videosFor('').main.language).toBe('en');
  });

  it('never loses or repeats a video', () => {
    const { main, others } = videosFor('ta');
    expect([main, ...others].map((v) => v.driveId).sort()).toEqual(
      INSTRUCTION_VIDEOS.map((v) => v.driveId).sort(),
    );
  });
});

describe('the video list', () => {
  it('has one distinct, non-empty id per language', () => {
    expect(new Set(INSTRUCTION_VIDEOS.map((v) => v.language)).size).toBe(3);
    expect(new Set(INSTRUCTION_VIDEOS.map((v) => v.driveId)).size).toBe(3);
    for (const v of INSTRUCTION_VIDEOS) expect(v.driveId).toMatch(/^[A-Za-z0-9_-]{20,}$/);
  });
});

describe('urls', () => {
  it('builds the embeddable, viewer and thumbnail links', () => {
    expect(previewUrl('abc')).toBe('https://drive.google.com/file/d/abc/preview');
    expect(viewUrl('abc')).toBe('https://drive.google.com/file/d/abc/view');
    expect(thumbnailUrl('abc')).toBe('https://drive.google.com/thumbnail?id=abc&sz=w480');
    expect(thumbnailUrl('abc', 240)).toContain('sz=w240');
  });
});

describe('isAllowedPlayerUrl', () => {
  it('allows the Google domains Drive’s player is built from', () => {
    for (const url of [
      'https://drive.google.com/file/d/abc/preview',
      'https://youtube.googleapis.com/embed/?docid=abc',
      'https://lh3.googleusercontent.com/x',
      'https://www.gstatic.com/x.js',
      'https://rr1---sn-abc.googlevideo.com/videoplayback',
      'about:blank',
    ]) {
      expect(isAllowedPlayerUrl(url), url).toBe(true);
    }
  });

  it('blocks everything else', () => {
    for (const url of [
      'https://example.com/',
      'https://google.com.evil.example/',
      'https://evilgoogle.com/',
      'http://drive.google.com/file/d/abc/preview',
      'intent://scan/#Intent;end',
      'javascript:alert(1)',
      'not a url',
    ]) {
      expect(isAllowedPlayerUrl(url), url).toBe(false);
    }
  });
});
