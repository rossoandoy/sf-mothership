export type PageType = 'recordPage' | 'objectHome' | 'setupPage' | 'other';

export interface PageContext {
  /** ホスト名 (例: "mycompany.lightning.force.com") */
  orgDomain: string;
  /** オブジェクトAPI名 (例: "Account", "MANAERP__Student__c") */
  objectApiName: string | null;
  /** レコードID (18桁) */
  recordId: string | null;
  /** ページ種別 */
  pageType: PageType;
  /** 現在のURL */
  url: string;
  /** ドメインからのsandbox推定 */
  isSandboxDomain: boolean;
  /** 取得タイムスタンプ */
  timestamp: number;
}
