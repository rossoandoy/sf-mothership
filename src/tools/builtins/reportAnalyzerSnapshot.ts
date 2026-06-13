import type { DescribeResult, FieldDescribe, SoqlResponse } from '@/types/salesforce';
import type { Result } from '@/shared/result';

export interface SnapshotDistributionField {
  name: string;
  label: string;
  type: string;
}

export interface SnapshotDistribution {
  fieldName: string;
  label: string;
  type: string;
  buckets: Array<{
    value: string;
    count: number;
  }>;
}

export interface ReportAnalyzerSnapshot {
  objectApiName: string;
  windowDays: number;
  totalCount: number | null;
  recentCount: number | null;
  distributions: SnapshotDistribution[];
  soql: string[];
  warnings: string[];
}

export interface ReportSnapshotQuery {
  id: string;
  soql: string;
}

interface CountRow {
  total?: number;
  [key: string]: unknown;
}

export type ReportSnapshotQueryFn = (soql: string) => Promise<Result<SoqlResponse<CountRow>>>;

const SAFE_OBJECT_API_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const DISTRIBUTION_FIELD_TYPES = new Set(['picklist', 'multipicklist', 'boolean']);

export function isSafeObjectApiName(value: string): boolean {
  return SAFE_OBJECT_API_NAME_PATTERN.test(value);
}

function isSafeFieldName(value: string): boolean {
  return SAFE_OBJECT_API_NAME_PATTERN.test(value);
}

export function selectDistributionFields(
  describe: DescribeResult,
  limit = 3
): SnapshotDistributionField[] {
  return describe.fields
    .filter((field) =>
      DISTRIBUTION_FIELD_TYPES.has(field.type) &&
      !field.calculatedFormula &&
      isSafeFieldName(field.name)
    )
    .slice(0, limit)
    .map((field) => ({
      name: field.name,
      label: field.label,
      type: field.type,
    }));
}

export function buildReportSnapshotQueries(
  objectApiName: string,
  options: {
    windowDays: number;
    hasCreatedDate: boolean;
    distributionFields: SnapshotDistributionField[];
  }
): ReportSnapshotQuery[] {
  const queries: ReportSnapshotQuery[] = [
    {
      id: 'total',
      soql: `SELECT COUNT() FROM ${objectApiName}`,
    },
  ];

  if (options.hasCreatedDate) {
    queries.push({
      id: 'recent',
      soql: `SELECT COUNT() FROM ${objectApiName} WHERE CreatedDate = LAST_N_DAYS:${options.windowDays}`,
    });
  }

  for (const field of options.distributionFields.slice(0, 3)) {
    queries.push({
      id: `distribution:${field.name}`,
      soql: `SELECT ${field.name}, COUNT(Id) total FROM ${objectApiName} GROUP BY ${field.name} ORDER BY COUNT(Id) DESC LIMIT 5`,
    });
  }

  return queries;
}

export function buildSnapshotAiPayload(snapshot: ReportAnalyzerSnapshot): ReportAnalyzerSnapshot {
  return {
    objectApiName: snapshot.objectApiName,
    windowDays: snapshot.windowDays,
    totalCount: snapshot.totalCount,
    recentCount: snapshot.recentCount,
    distributions: snapshot.distributions.map((distribution) => ({
      fieldName: distribution.fieldName,
      label: distribution.label,
      type: distribution.type,
      buckets: distribution.buckets.map((bucket) => ({
        value: bucket.value,
        count: bucket.count,
      })),
    })),
    soql: [...snapshot.soql],
    warnings: [...snapshot.warnings],
  };
}

export function hasCreatedDateField(describe: DescribeResult): boolean {
  return describe.fields.some((field: FieldDescribe) => field.name === 'CreatedDate');
}

export async function collectReportAnalyzerSnapshot(params: {
  objectApiName: string;
  describe: DescribeResult;
  windowDays: number;
  query: ReportSnapshotQueryFn;
}): Promise<Result<ReportAnalyzerSnapshot>> {
  if (!isSafeObjectApiName(params.objectApiName)) {
    return {
      ok: false,
      error: '対象オブジェクト API 名が安全な形式ではありません',
    };
  }

  const distributionFields = selectDistributionFields(params.describe);
  const queries = buildReportSnapshotQueries(params.objectApiName, {
    windowDays: params.windowDays,
    hasCreatedDate: hasCreatedDateField(params.describe),
    distributionFields,
  });
  const snapshot: ReportAnalyzerSnapshot = {
    objectApiName: params.objectApiName,
    windowDays: params.windowDays,
    totalCount: null,
    recentCount: null,
    distributions: [],
    soql: queries.map((item) => item.soql),
    warnings: [],
  };

  for (const item of queries) {
    const result = await params.query(item.soql);
    if (!result.ok) {
      snapshot.warnings.push(`${item.id}: ${result.error}`);
      continue;
    }

    if (item.id === 'total') {
      snapshot.totalCount = result.data.totalSize;
      continue;
    }

    if (item.id === 'recent') {
      snapshot.recentCount = result.data.totalSize;
      continue;
    }

    if (item.id.startsWith('distribution:')) {
      const fieldName = item.id.replace('distribution:', '');
      const field = distributionFields.find((candidate) => candidate.name === fieldName);
      if (!field) continue;

      snapshot.distributions.push({
        fieldName,
        label: field.label,
        type: field.type,
        buckets: result.data.records.map((record) => ({
          value: String(record[fieldName] ?? '(空)'),
          count: typeof record.total === 'number' ? record.total : 0,
        })),
      });
    }
  }

  return {
    ok: true,
    data: snapshot,
  };
}
