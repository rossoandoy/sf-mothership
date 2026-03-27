import type { CardData } from '@/types/tool';

interface CardOutputProps {
  data: CardData;
}

export function CardOutput({ data }: CardOutputProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-800">{data.title}</h3>
      {data.sections.map((section, si) => (
        <div key={si} className="border border-gray-200 rounded-lg overflow-hidden">
          {section.heading && (
            <div className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 border-b border-gray-200">
              {section.heading}
            </div>
          )}
          <div className="divide-y divide-gray-100">
            {section.items.map((item, ii) => (
              <div key={ii} className="px-3 py-1.5 flex items-start gap-2">
                <span className="text-xs text-gray-500 w-24 shrink-0">{item.label}</span>
                <span className="text-xs text-gray-800 break-all">
                  {item.type === 'link' && item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.value}
                    </a>
                  ) : item.type === 'badge' ? (
                    <span className="inline-block bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-medium">
                      {item.value}
                    </span>
                  ) : (
                    item.value
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
