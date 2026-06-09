import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import type { TableData } from '@/types/tool';
import { useTabPanel } from '../../hooks/useTabPanel';
import { TabPanelShell } from '../TabPanelShell';
import { TableOutput } from '../outputs/TableOutput';

interface FieldsPanelProps {
  pageContext: PageContext | null;
  orgInfo: OrgInfo | null;
  active: boolean;
}

export function FieldsPanel({ pageContext, orgInfo, active }: FieldsPanelProps) {
  const state = useTabPanel('fields', pageContext, orgInfo, active);

  const tableResult = state.results.find((r) => r.result.outputType === 'table');

  return (
    <TabPanelShell
      state={state}
      emptyMessage="この画面では項目一覧を表示できません"
    >
      {tableResult && (
        <TableOutput data={tableResult.result.data as TableData} />
      )}
    </TabPanelShell>
  );
}
