import { useState, useMemo } from 'react';
import type { TableData } from '@/types/tool';

interface TableOutputProps {
  data: TableData;
}

export function TableOutput({ data }: TableOutputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const filteredRows = useMemo(() => {
    let rows = data.rows;

    // 検索フィルタ
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((v) => v.toLowerCase().includes(q))
      );
    }

    // ソート
    if (sortKey) {
      rows = [...rows].sort((a, b) => {
        const va = a[sortKey] ?? '';
        const vb = b[sortKey] ?? '';
        const cmp = va.localeCompare(vb, 'ja');
        return sortAsc ? cmp : -cmp;
      });
    }

    return rows;
  }, [data.rows, searchQuery, sortKey, sortAsc]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-2">
      {/* 検索 */}
      <input
        type="text"
        placeholder="検索..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="text-[10px] text-gray-400">
        {filteredRows.length} / {data.rows.length} 件
      </div>

      {/* テーブル */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              {data.columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-2 py-1.5 text-left text-[10px] font-medium text-gray-600 border-b border-gray-200 ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-0.5">{sortAsc ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {data.columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-2 py-1 text-gray-700 border-b border-gray-100 whitespace-nowrap"
                  >
                    {row[col.key] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
