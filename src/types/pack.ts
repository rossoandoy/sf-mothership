import type { GuideEntry } from '@/tools/builtins/uatGuide';
import type { ToolDefinition } from './tool';

export interface PackManifest {
  id: string;
  name: string;
  description: string;
}

export interface PackData {
  guides: GuideEntry[];
  tools: ToolDefinition[];
}

export const AVAILABLE_PACKS: PackManifest[] = [
  {
    id: 'default',
    name: 'Default',
    description: '汎用ツールセット（ガイドなし）',
  },
  {
    id: 'manabie',
    name: 'Manabie ERP',
    description: 'Manabie ERP固有のUATガイド付き',
  },
];
