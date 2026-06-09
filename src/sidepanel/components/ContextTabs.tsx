import type { PageContext } from '@/types/context';
import type { OrgInfo } from '@/types/salesforce';
import type { ContextTabId } from '@/shared/tabTools';
import { InstantPanel } from './tabs/InstantPanel';
import { FieldsPanel } from './tabs/FieldsPanel';
import { GuideTabPanel } from './tabs/GuideTabPanel';

const TABS: Array<{ id: ContextTabId; label: string }> = [
  { id: 'instant', label: '今すぐ' },
  { id: 'fields', label: '項目' },
  { id: 'guide', label: 'ガイド' },
];

interface ContextTabsProps {
  activeTab: ContextTabId;
  onTabChange: (tab: ContextTabId) => void;
  pageContext: PageContext | null;
  orgInfo: OrgInfo | null;
}

export function ContextTabs({
  activeTab,
  onTabChange,
  pageContext,
  orgInfo,
}: ContextTabsProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <nav className="flex border-b border-gray-200 px-2 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activeTab === 'instant' && (
          <InstantPanel pageContext={pageContext} orgInfo={orgInfo} active />
        )}
        {activeTab === 'fields' && (
          <FieldsPanel pageContext={pageContext} orgInfo={orgInfo} active />
        )}
        {activeTab === 'guide' && (
          <GuideTabPanel pageContext={pageContext} orgInfo={orgInfo} active />
        )}
      </div>
    </div>
  );
}
