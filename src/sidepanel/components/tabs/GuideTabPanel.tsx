import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import type { GuidePanelData } from '@/types/tool';
import { useTabPanel } from '../../hooks/useTabPanel';
import { TabPanelShell } from '../TabPanelShell';
import { GuidePanelOutput } from '../outputs/GuidePanelOutput';

interface GuideTabPanelProps {
  pageContext: PageContext | null;
  orgInfo: OrgInfo | null;
  active: boolean;
}

export function GuideTabPanel({ pageContext, orgInfo, active }: GuideTabPanelProps) {
  const state = useTabPanel('guide', pageContext, orgInfo, active);

  const guideResult = state.results.find((r) => r.result.outputType === 'guidePanel');

  return (
    <TabPanelShell
      state={state}
      emptyMessage="この画面では UAT ガイドを表示できません"
    >
      {guideResult && (
        <GuidePanelOutput data={guideResult.result.data as GuidePanelData} />
      )}
    </TabPanelShell>
  );
}
