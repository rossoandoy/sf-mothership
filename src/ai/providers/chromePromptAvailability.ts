import type { AiAvailability } from '../core/types';

export type ChromePromptAvailabilitySeverity = 'success' | 'info' | 'warning' | 'error';
export type ChromePromptUnavailableReason =
  | 'missingLanguageModel'
  | 'unsupportedDevice'
  | 'notDocumentContext'
  | 'modelDownload'
  | 'unknown';

export interface ChromePromptAvailabilityDescription {
  title: string;
  message: string;
  severity: ChromePromptAvailabilitySeverity;
  reasonKind?: ChromePromptUnavailableReason;
  detail?: string;
}

function classifyUnavailableReason(reason?: string): ChromePromptUnavailableReason {
  const lower = reason?.toLowerCase() ?? '';
  if (lower.includes('languagemodel')) return 'missingLanguageModel';
  if (lower.includes('context') || lower.includes('worker')) return 'notDocumentContext';
  if (lower.includes('download') || lower.includes('model')) return 'modelDownload';
  if (lower.includes('device') || lower.includes('storage') || lower.includes('ram') || lower.includes('gpu')) {
    return 'unsupportedDevice';
  }
  return 'unknown';
}

export function describeChromePromptAvailability(
  availability: AiAvailability
): ChromePromptAvailabilityDescription {
  if (availability.status === 'ready') {
    return {
      title: 'Gemini Nano を利用できます',
      message: 'Chrome Prompt API は ready です。通常ツールでの利用は AI Provider 設定に従います。',
      severity: 'success',
      detail: availability.reason,
    };
  }

  if (availability.status === 'downloadable') {
    return {
      title: 'モデルの初回ダウンロードが必要です',
      message: '通常ツールでは自動ダウンロードしません。ユーザー操作から Smoke prompt を実行し、ダウンロードを明示的に開始してください。',
      severity: 'warning',
      reasonKind: 'modelDownload',
      detail: availability.reason,
    };
  }

  if (availability.status === 'downloading') {
    return {
      title: 'モデルをダウンロード中です',
      message: 'ダウンロード完了後に再度 availability を確認してください。完了までは通常ツールの候補にしません。',
      severity: 'info',
      reasonKind: 'modelDownload',
      detail: availability.reason,
    };
  }

  return {
    title: 'この環境では Gemini Nano を利用できません',
    message: '対応 Chrome、端末要件、モデル状態、または Options / Side Panel など document context で確認しているかを見直してください。',
    severity: 'error',
    reasonKind: classifyUnavailableReason(availability.reason),
    detail: availability.reason,
  };
}
