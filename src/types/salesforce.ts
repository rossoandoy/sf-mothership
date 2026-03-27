// Salesforce REST API レスポンス型

export interface SoqlResponse<T> {
  totalSize: number;
  done: boolean;
  records: T[];
  nextRecordsUrl?: string;
}

export interface SObjectRecord {
  Id: string;
  Name?: string;
  attributes: {
    type: string;
    url: string;
  };
  [key: string]: unknown;
}

// Describe API
export interface DescribeResult {
  name: string;
  label: string;
  labelPlural: string;
  keyPrefix: string | null;
  custom: boolean;
  createable: boolean;
  deletable: boolean;
  updateable: boolean;
  queryable: boolean;
  fields: FieldDescribe[];
  childRelationships: ChildRelationship[];
  recordTypeInfos: RecordTypeInfo[];
}

export interface FieldDescribe {
  name: string;
  label: string;
  type: string;
  length: number;
  precision: number;
  scale: number;
  nillable: boolean;
  createable: boolean;
  updateable: boolean;
  defaultedOnCreate: boolean;
  calculatedFormula: string | null;
  inlineHelpText: string | null;
  picklistValues: PicklistValue[];
  referenceTo: string[];
  relationshipName: string | null;
  custom: boolean;
  externalId: boolean;
  unique: boolean;
  autoNumber: boolean;
}

export interface PicklistValue {
  active: boolean;
  defaultValue: boolean;
  label: string;
  value: string;
}

export interface ChildRelationship {
  childSObject: string;
  field: string;
  relationshipName: string | null;
  deprecatedAndHidden: boolean;
}

export interface RecordTypeInfo {
  active: boolean;
  available: boolean;
  defaultRecordTypeMapping: boolean;
  developerName: string;
  master: boolean;
  name: string;
  recordTypeId: string;
}

export interface OrgInfo {
  id: string;
  name: string;
  isSandbox: boolean;
  organizationType: string;
}

export interface UserInfo {
  id: string;
  name: string;
  profileName: string;
  roleName: string | null;
  email: string;
}

// sObject作成レスポンス
export interface CreateRecordResponse {
  id: string;
  success: boolean;
  errors: Array<{ message: string; statusCode: string }>;
}
