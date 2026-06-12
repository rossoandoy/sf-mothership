import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import { useTabPanel } from '../../hooks/useTabPanel';
import { TabPanelShell } from '../TabPanelShell';
import { InstantSummary } from './InstantSummary';

interface InstantPanelProps {
  pageContext: PageContext | null;
  orgInfo: OrgInfo | null;
  active: boolean;
}

export function InstantPanel({ pageContext, orgInfo, active }: InstantPanelProps) {
  const state = useTabPanel('instant', pageContext, orgInfo, active);

  return (
    <TabPanelShell
      state={state}
      emptyMessage="この画面では概要・権限情報を表示できません"
    >
      <InstantSummary results={state.results} />
      {state.error && state.results.length > 0 && (
        <p className="text-xs text-amber-600 mt-2">{state.error}</p>
      )}
    </TabPanelShell>
  );
}
