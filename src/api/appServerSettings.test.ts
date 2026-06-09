import { describe, it, expect } from 'vitest';
import { isLocalhostUrl } from './appServerSettings';

describe('isLocalhostUrl', () => {
  it('localhost を許可する', () => {
    expect(isLocalhostUrl('http://localhost:3847')).toBe(true);
    expect(isLocalhostUrl('http://127.0.0.1:3847')).toBe(true);
  });

  it('外部 URL を拒否する', () => {
    expect(isLocalhostUrl('https://api.example.com')).toBe(false);
    expect(isLocalhostUrl('http://192.168.1.1:3847')).toBe(false);
  });
});
