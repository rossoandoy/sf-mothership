import type { ToolHandler, ToolResult, TableData } from '@/types/tool';
import type { DescribeResult } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';

export const fieldContextInspectorHandler: ToolHandler = async (ctx) => {
  const { pageContext } = ctx;
  const { orgDomain, objectApiName } = pageContext;

  if (!objectApiName) {
    return err('オブジェクトが特定できません');
  }

  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: orgDomain, objectApiName }
  );

  if (!describeResult.ok) return err(describeResult.error);

  const fields = describeResult.data.fields;

  const tableData: TableData = {
    columns: [
      { key: 'label', label: 'ラベル', sortable: true },
      { key: 'apiName', label: 'API名', sortable: true },
      { key: 'type', label: '型', sortable: true },
      { key: 'required', label: '必須', sortable: true },
      { key: 'formula', label: '数式', sortable: true },
      { key: 'updateable', label: '編集可', sortable: true },
      { key: 'createable', label: '作成可', sortable: true },
    ],
    rows: fields.map((f) => ({
      label: f.label,
      apiName: f.name,
      type: f.type + (f.length > 0 ? `(${f.length})` : ''),
      required: !f.nillable && f.createable ? 'Yes' : '',
      formula: f.calculatedFormula ? 'Yes' : '',
      updateable: f.updateable ? 'Yes' : '',
      createable: f.createable ? 'Yes' : '',
    })),
  };

  const result: ToolResult = {
    outputType: 'table',
    data: tableData,
  };

  return ok(result);
};
