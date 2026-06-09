import type { ToolDefinition } from '@/types/tool';
import { ToolList } from './ToolList';

interface AdvancedDrawerProps {
  open: boolean;
  tools: ToolDefinition[];
  onSelect: (tool: ToolDefinition) => void;
  onClose: () => void;
}

export function AdvancedDrawer({ open, tools, onSelect, onClose }: AdvancedDrawerProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-800">上級ツール</h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          閉じる
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[10px] text-gray-500 mb-3">
          テストデータ作成・AI 補助・Pack 宣言的ツール
        </p>
        <ToolList
          tools={tools}
          onSelect={(tool) => {
            onSelect(tool);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
