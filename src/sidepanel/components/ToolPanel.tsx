import type { ToolResult, CardData, TableData, GuidePanelData } from '@/types/tool';
import type { ToolExecutionState } from '../hooks/useToolExecution';
import { InputForm } from './InputForm';
import { CardOutput } from './outputs/CardOutput';
import { TableOutput } from './outputs/TableOutput';
import { GuidePanelOutput } from './outputs/GuidePanelOutput';
import { ErrorDisplay } from './ErrorDisplay';
import { ConfirmDialog } from './ConfirmDialog';

interface ToolPanelProps {
  state: ToolExecutionState;
  onExecute: (inputs: Record<string, string>) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onBack: () => void;
}

export function ToolPanel({ state, onExecute, onConfirm, onCancel, onBack }: ToolPanelProps) {
  if (state.phase === 'idle') return null;

  const tool = state.tool;

  return (
    <div className="space-y-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          &larr; 戻る
        </button>
        <h2 className="text-sm font-semibold text-gray-800">{tool.title}</h2>
      </div>
      <p className="text-[10px] text-gray-500">{tool.description}</p>

      {/* 入力フォーム */}
      {state.phase === 'inputting' && (
        <InputForm
          inputs={tool.inputs}
          onSubmit={onExecute}
        />
      )}

      {/* ローディング */}
      {state.phase === 'loading' && (
        <div className="flex items-center gap-2 py-4 justify-center">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-gray-500">実行中...</span>
        </div>
      )}

      {/* 確認ダイアログ */}
      {state.phase === 'confirm' && (
        <>
          {state.dryRunResult && (
            <div className="mb-3">
              <p className="text-[10px] text-gray-500 mb-2">プレビュー (DryRun)</p>
              <ResultRenderer result={state.dryRunResult} />
            </div>
          )}
          <ConfirmDialog
            title={`${tool.title} を実行しますか？`}
            message={tool.safety.level === 'lowRiskWrite'
              ? 'データが作成されます。この操作は元に戻せません。'
              : 'この操作を実行しますか？'}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </>
      )}

      {/* 結果表示 */}
      {state.phase === 'result' && (
        <ResultRenderer result={state.result} />
      )}

      {/* エラー表示 */}
      {state.phase === 'error' && (
        <ErrorDisplay error={state.error} onDismiss={onBack} />
      )}
    </div>
  );
}

function ResultRenderer({ result }: { result: ToolResult }) {
  switch (result.outputType) {
    case 'card':
      return <CardOutput data={result.data as CardData} />;
    case 'table':
      return <TableOutput data={result.data as TableData} />;
    case 'guidePanel':
      return <GuidePanelOutput data={result.data as GuidePanelData} />;
    default:
      return <p className="text-xs text-gray-500">未対応の出力形式です</p>;
  }
}
