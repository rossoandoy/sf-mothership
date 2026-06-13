import { describe, expect, it } from 'vitest';
import type { DescribeResult, FieldDescribe } from '@/types/salesforce';
import {
  collectReportAnalyzerSnapshot,
  buildReportSnapshotQueries,
  buildSnapshotAiPayload,
  isSafeObjectApiName,
  selectDistributionFields,
  type ReportAnalyzerSnapshot,
} from './reportAnalyzerSnapshot';

function field(overrides: Partial<FieldDescribe>): FieldDescribe {
  return {
    name: 'Status__c',
    label: 'Status',
    type: 'picklist',
    length: 255,
    precision: 0,
    scale: 0,
    nillable: true,
    createable: true,
    updateable: true,
    defaultedOnCreate: false,
    calculatedFormula: null,
    inlineHelpText: null,
    picklistValues: [],
    referenceTo: [],
    relationshipName: null,
    custom: true,
    externalId: false,
    unique: false,
    autoNumber: false,
    ...overrides,
  };
}

function describeResult(fields: FieldDescribe[]): DescribeResult {
  return {
    name: 'Custom_Object__c',
    label: 'Custom Object',
    labelPlural: 'Custom Objects',
    keyPrefix: 'a00',
    custom: true,
    createable: true,
    deletable: true,
    updateable: true,
    queryable: true,
    fields,
    childRelationships: [],
    recordTypeInfos: [],
  };
}

describe('reportAnalyzerSnapshot pure helpers', () => {
  it('安全な object API name だけを許可する', () => {
    expect(isSafeObjectApiName('Account')).toBe(true);
    expect(isSafeObjectApiName('Custom_Object__c')).toBe(true);
    expect(isSafeObjectApiName('ns__Custom_Object__c')).toBe(true);

    expect(isSafeObjectApiName('Account WHERE Name != null')).toBe(false);
    expect(isSafeObjectApiName('Account; DELETE')).toBe(false);
    expect(isSafeObjectApiName('')).toBe(false);
  });

  it('低リスクな分布対象フィールドだけを最大3件選ぶ', () => {
    const selected = selectDistributionFields(describeResult([
      field({ name: 'Status__c', label: 'Status', type: 'picklist' }),
      field({ name: 'Tags__c', label: 'Tags', type: 'multipicklist' }),
      field({ name: 'IsActive__c', label: 'Active', type: 'boolean' }),
      field({ name: 'Secret__c', label: 'Secret', type: 'encryptedstring' }),
      field({ name: 'Description__c', label: 'Description', type: 'textarea' }),
      field({ name: 'Formula__c', label: 'Formula', type: 'picklist', calculatedFormula: 'TEXT(Status__c)' }),
    ]));

    expect(selected).toEqual([
      { name: 'Status__c', label: 'Status', type: 'picklist' },
      { name: 'Tags__c', label: 'Tags', type: 'multipicklist' },
      { name: 'IsActive__c', label: 'Active', type: 'boolean' },
    ]);
  });

  it('COUNT と GROUP BY の read-only SOQL だけを組み立てる', () => {
    const queries = buildReportSnapshotQueries('Custom_Object__c', {
      windowDays: 30,
      hasCreatedDate: true,
      distributionFields: [
        { name: 'Status__c', label: 'Status', type: 'picklist' },
      ],
    });

    expect(queries).toEqual([
      {
        id: 'total',
        soql: 'SELECT COUNT() FROM Custom_Object__c',
      },
      {
        id: 'recent',
        soql: 'SELECT COUNT() FROM Custom_Object__c WHERE CreatedDate = LAST_N_DAYS:30',
      },
      {
        id: 'distribution:Status__c',
        soql: 'SELECT Status__c, COUNT(Id) total FROM Custom_Object__c GROUP BY Status__c ORDER BY COUNT(Id) DESC LIMIT 5',
      },
    ]);
  });

  it('AI payload から生レコードや secret-like key を除外する', () => {
    const snapshot: ReportAnalyzerSnapshot = {
      objectApiName: 'Account',
      windowDays: 30,
      totalCount: 100,
      recentCount: 12,
      distributions: [
        {
          fieldName: 'Type',
          label: 'Type',
          type: 'picklist',
          buckets: [{ value: 'Customer', count: 40 }],
        },
      ],
      soql: ['SELECT COUNT() FROM Account'],
      warnings: ['一部集計に失敗しました'],
    };

    const payload = buildSnapshotAiPayload(snapshot);
    const serialized = JSON.stringify(payload).toLowerCase();

    expect(payload).toEqual(snapshot);
    expect(serialized).not.toContain('records');
    expect(serialized).not.toContain('sessionid');
    expect(serialized).not.toContain('token');
    expect(serialized).not.toContain('authorization');
  });

  it('COUNT / recent / distribution の集計 snapshot を作る', async () => {
    const describe = describeResult([
      field({ name: 'CreatedDate', label: 'Created Date', type: 'datetime' }),
      field({ name: 'Status__c', label: 'Status', type: 'picklist' }),
      field({ name: 'IsActive__c', label: 'Active', type: 'boolean' }),
    ]);
    const soql: string[] = [];

    const result = await collectReportAnalyzerSnapshot({
      objectApiName: 'Custom_Object__c',
      describe,
      windowDays: 30,
      query: async (queryText) => {
        soql.push(queryText);
        if (queryText === 'SELECT COUNT() FROM Custom_Object__c') {
          return { ok: true, data: { totalSize: 120, done: true, records: [] } };
        }
        if (queryText.includes('LAST_N_DAYS:30')) {
          return { ok: true, data: { totalSize: 18, done: true, records: [] } };
        }
        if (queryText.includes('Status__c')) {
          return {
            ok: true,
            data: {
              totalSize: 2,
              done: true,
              records: [
                { Status__c: 'Open', total: 70 },
                { Status__c: 'Closed', total: 50 },
              ],
            },
          };
        }
        return {
          ok: true,
          data: {
            totalSize: 1,
            done: true,
            records: [{ IsActive__c: true, total: 90 }],
          },
        };
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.totalCount).toBe(120);
    expect(result.data.recentCount).toBe(18);
    expect(result.data.distributions).toEqual([
      {
        fieldName: 'Status__c',
        label: 'Status',
        type: 'picklist',
        buckets: [
          { value: 'Open', count: 70 },
          { value: 'Closed', count: 50 },
        ],
      },
      {
        fieldName: 'IsActive__c',
        label: 'Active',
        type: 'boolean',
        buckets: [{ value: 'true', count: 90 }],
      },
    ]);
    expect(result.data.soql).toEqual(soql);
    expect(result.data.warnings).toEqual([]);
  });

  it('個別 query の失敗は warnings に入れて snapshot を継続する', async () => {
    const result = await collectReportAnalyzerSnapshot({
      objectApiName: 'Account',
      describe: describeResult([
        field({ name: 'CreatedDate', label: 'Created Date', type: 'datetime' }),
        field({ name: 'Type', label: 'Type', type: 'picklist' }),
      ]),
      windowDays: 7,
      query: async (queryText) => {
        if (queryText === 'SELECT COUNT() FROM Account') {
          return { ok: true, data: { totalSize: 10, done: true, records: [] } };
        }
        return { ok: false, error: `failed: ${queryText}` };
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error);
    expect(result.data.totalCount).toBe(10);
    expect(result.data.recentCount).toBeNull();
    expect(result.data.distributions).toEqual([]);
    expect(result.data.warnings).toHaveLength(2);
  });
});
