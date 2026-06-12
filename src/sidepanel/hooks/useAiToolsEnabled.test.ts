import { describe, expect, it } from 'vitest';
import { canUseAiTools } from './useAiToolsEnabled';
import type { AiProviderSettings, AppServerSettings } from '@/types/appServer';

const disabledLocal: AppServerSettings = {
  enabled: false,
  baseUrl: 'http://127.0.0.1:3847',
};

const enabledLocal: AppServerSettings = {
  ...disabledLocal,
  enabled: true,
};

function settings(
  mode: AiProviderSettings['mode'],
  allowChromePromptInTools: boolean
): AiProviderSettings {
  return { mode, allowChromePromptInTools };
}

describe('canUseAiTools', () => {
  it('chrome-prompt-only かつ Chrome Prompt 未許可では AI ツールを非表示にする', () => {
    expect(canUseAiTools(
      enabledLocal,
      settings('chrome-prompt-only', false)
    )).toBe(false);
  });

  it('chrome-prompt-only かつ Chrome Prompt 許可なら Local Provider 無効でも表示する', () => {
    expect(canUseAiTools(
      disabledLocal,
      settings('chrome-prompt-only', true)
    )).toBe(true);
  });

  it('hybrid は Local Provider enabled または Chrome Prompt allowed のどちらかで表示する', () => {
    expect(canUseAiTools(disabledLocal, settings('hybrid', false))).toBe(false);
    expect(canUseAiTools(enabledLocal, settings('hybrid', false))).toBe(true);
    expect(canUseAiTools(disabledLocal, settings('hybrid', true))).toBe(true);
  });

  it('local-only は Local Provider enabled の場合だけ表示する', () => {
    expect(canUseAiTools(disabledLocal, settings('local-only', true))).toBe(false);
    expect(canUseAiTools(enabledLocal, settings('local-only', false))).toBe(true);
  });
});
