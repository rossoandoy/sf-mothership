import type { ToolHandler, ToolResult, CardData } from '@/types/tool';
import type { DescribeResult, FieldDescribe, CreateRecordResponse } from '@/types/salesforce';
import { ok, err } from '@/shared/result';
import { callApi } from '@/sidepanel/hooks/useApi';

export const testDataCreatorHandler: ToolHandler = async (ctx) => {
  const { pageContext, inputs, isDryRun } = ctx;
  const { orgDomain, objectApiName } = pageContext;

  if (!objectApiName) {
    return err('オブジェクトが特定できません');
  }

  // Describe情報で必須項目を取得
  const describeResult = await callApi<DescribeResult>(
    'describe',
    { domain: orgDomain, objectApiName }
  );

  if (!describeResult.ok) return err(describeResult.error);

  const describe = describeResult.data;
  const requiredFields = describe.fields.filter(
    (f) => !f.nillable && f.createable && !f.defaultedOnCreate
  );

  const recordName = inputs['recordName'] || 'テストデータ';
  const count = Math.min(Math.max(parseInt(inputs['count'] || '1', 10) || 1, 1), 5);

  // レコードデータの生成
  const recordsToCreate: Array<Record<string, unknown>> = [];
  for (let i = 0; i < count; i++) {
    const record: Record<string, unknown> = {};
    const suffix = count > 1 ? ` ${i + 1}` : '';

    for (const field of requiredFields) {
      record[field.name] = generateDefaultValue(field, `${recordName}${suffix}`);
    }

    recordsToCreate.push(record);
  }

  // DryRun: プレビューのみ
  if (isDryRun) {
    const sections: CardData['sections'] = [
      {
        heading: '作成プレビュー',
        items: [
          { label: 'オブジェクト', value: objectApiName },
          { label: '作成件数', value: `${count}件` },
        ],
      },
    ];

    for (let i = 0; i < recordsToCreate.length; i++) {
      const record = recordsToCreate[i];
      if (!record) continue;
      sections.push({
        heading: `レコード ${i + 1}`,
        items: Object.entries(record).map(([key, value]) => ({
          label: key,
          value: String(value),
        })),
      });
    }

    return ok({
      outputType: 'card',
      data: { title: 'テストデータ作成プレビュー (DryRun)', sections },
    } as ToolResult);
  }

  // 実際の作成
  const createdIds: string[] = [];
  const errors: string[] = [];

  for (const record of recordsToCreate) {
    const createResult = await callApi<CreateRecordResponse>(
      'createRecord',
      { domain: orgDomain, objectApiName, data: record }
    );

    if (createResult.ok && createResult.data.success) {
      createdIds.push(createResult.data.id);
    } else {
      const errMsg = createResult.ok
        ? createResult.data.errors.map((e) => e.message).join(', ')
        : createResult.error;
      errors.push(errMsg);
    }
  }

  const sections: CardData['sections'] = [];

  if (createdIds.length > 0) {
    sections.push({
      heading: '作成完了',
      items: createdIds.map((id, i) => ({
        label: `レコード ${i + 1}`,
        value: id,
        type: 'link' as const,
        href: `https://${orgDomain}/lightning/r/${objectApiName}/${id}/view`,
      })),
    });
  }

  if (errors.length > 0) {
    sections.push({
      heading: 'エラー',
      items: errors.map((e, i) => ({
        label: `エラー ${i + 1}`,
        value: e,
      })),
    });
  }

  return ok({
    outputType: 'card',
    data: {
      title: `テストデータ作成結果 (${createdIds.length}/${count}件成功)`,
      sections,
    },
  } as ToolResult);
};

function generateDefaultValue(field: FieldDescribe, name: string): unknown {
  switch (field.type) {
    case 'string':
    case 'textarea':
      // Name項目には名前を入れる
      if (field.name === 'Name' || field.name === 'LastName' || field.name.endsWith('__c')) {
        return name.slice(0, field.length || 80);
      }
      return `Test ${field.label}`.slice(0, field.length || 80);
    case 'email':
      return 'test@example.com';
    case 'phone':
      return '000-0000-0000';
    case 'url':
      return 'https://example.com';
    case 'int':
    case 'double':
    case 'currency':
    case 'percent':
      return 1;
    case 'boolean':
      return false;
    case 'date':
      return new Date().toISOString().split('T')[0];
    case 'datetime':
      return new Date().toISOString();
    case 'picklist':
      // 最初のアクティブな選択肢を使用
      return field.picklistValues.find((p) => p.active)?.value ?? '';
    case 'reference':
      // 参照項目はスキップ（null不可なら空文字でエラーになる可能性あり）
      return null;
    default:
      return '';
  }
}
