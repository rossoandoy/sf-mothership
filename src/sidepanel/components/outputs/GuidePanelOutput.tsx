import type { GuidePanelData } from '@/types/tool';

interface GuidePanelOutputProps {
  data: GuidePanelData;
}

export function GuidePanelOutput({ data }: GuidePanelOutputProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">{data.title}</h3>
      {data.sections.map((section, si) => (
        <div key={si} className="border border-gray-200 rounded-lg p-3">
          {section.heading && (
            <h4 className="text-xs font-medium text-gray-700 mb-2">{section.heading}</h4>
          )}
          <ul className="space-y-1.5">
            {section.items.map((item, ii) => (
              <li key={ii} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-blue-500 mt-0.5 shrink-0">&bull;</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
