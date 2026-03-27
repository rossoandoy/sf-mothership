import type { ToolDefinition, ToolCategory } from '@/types/tool';

const CATEGORY_STYLES: Record<ToolCategory, { bg: string; text: string; label: string }> = {
  viewer: { bg: 'bg-blue-100', text: 'text-blue-700', label: '参照' },
  diagnostic: { bg: 'bg-purple-100', text: 'text-purple-700', label: '診断' },
  action: { bg: 'bg-orange-100', text: 'text-orange-700', label: '操作' },
  guide: { bg: 'bg-green-100', text: 'text-green-700', label: 'ガイド' },
};

interface ToolListProps {
  tools: ToolDefinition[];
  onSelect: (tool: ToolDefinition) => void;
}

export function ToolList({ tools, onSelect }: ToolListProps) {
  if (tools.length === 0) {
    return (
      <p className="text-xs text-gray-400">
        この画面で利用可能なツールはありません
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {tools.map((tool) => {
        const style = CATEGORY_STYLES[tool.category];
        return (
          <button
            key={tool.id}
            onClick={() => onSelect(tool)}
            className="w-full text-left px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                {style.label}
              </span>
              <span className="text-xs font-medium text-gray-800">{tool.title}</span>
            </div>
            <p className="text-[10px] text-gray-500 ml-0.5">{tool.description}</p>
          </button>
        );
      })}
    </div>
  );
}
