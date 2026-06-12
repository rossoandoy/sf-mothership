import type { Result } from '../../src/shared/result';
import type { AiProviderRegistry, generateAiWithProviders as generate } from '../../src/ai/core/router';
import type { AiResponse } from '../../src/ai/core/types';

/**
 * Chrome AI Kit の最小移植例。
 *
 * 実際の別Chrome拡張では、下記 import を自分の `src/ai/` へ置き換える:
 *
 * import { generateAiWithProviders } from './ai/core/router';
 * import { chromePromptProvider } from './ai/providers/chromePromptProvider';
 * import { localHttpProvider } from './ai/providers/localHttpProvider';
 */
type GenerateAiWithProviders = typeof generate;

interface SummarizeSelectionDeps {
  generateAiWithProviders: GenerateAiWithProviders;
  providers: AiProviderRegistry;
}

export async function summarizeSelection(
  selectedText: string,
  deps: SummarizeSelectionDeps
): Promise<Result<AiResponse>> {
  const trimmed = selectedText.trim();
  if (!trimmed) {
    return { ok: false, error: '要約する選択テキストがありません' };
  }

  return deps.generateAiWithProviders({
    task: 'summarize-selection',
    prompt: '次の選択テキストを日本語で3行以内に要約してください。',
    context: {
      source: 'selection',
      selectedLength: trimmed.length,
    },
    data: {
      selectedText: trimmed.slice(0, 4_000),
    },
    locale: 'ja-JP',
    privacy: 'onDeviceOnly',
    outputMode: 'text',
    systemPrompt: [
      'You summarize selected browser text.',
      'Do not ask for credentials, tokens, or private account data.',
    ].join('\n'),
  }, deps.providers, {
    mode: 'chrome-prompt-only',
    allowChromePromptInTools: true,
  });
}
