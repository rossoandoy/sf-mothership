import { describe, expect, it } from 'vitest';
import { describeChromePromptAvailability } from './chromePromptAvailability';

describe('describeChromePromptAvailability', () => {
  it('ready を利用可能として説明する', () => {
    const description = describeChromePromptAvailability({ status: 'ready' });

    expect(description.title).toBe('Gemini Nano を利用できます');
    expect(description.severity).toBe('success');
  });

  it('downloadable では通常ツールで自動DLしないことを説明する', () => {
    const description = describeChromePromptAvailability({ status: 'downloadable' });

    expect(description.title).toBe('モデルの初回ダウンロードが必要です');
    expect(description.message).toContain('通常ツールでは自動ダウンロードしません');
  });

  it('downloading では進行中として説明する', () => {
    const description = describeChromePromptAvailability({ status: 'downloading' });

    expect(description.title).toBe('モデルをダウンロード中です');
    expect(description.severity).toBe('info');
  });

  it('unavailable では document context で確認する案内を含める', () => {
    const description = describeChromePromptAvailability({
      status: 'unavailable',
      reason: 'LanguageModel がありません',
    });

    expect(description.title).toBe('この環境では Gemini Nano を利用できません');
    expect(description.message).toContain('Options / Side Panel など document context');
    expect(description.detail).toContain('LanguageModel がありません');
  });
});
