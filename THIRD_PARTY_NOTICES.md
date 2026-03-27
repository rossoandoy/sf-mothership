# Third-Party Notices

SF Mothership incorporates patterns and techniques from the following open-source projects.

---

## Salesforce Inspector Reloaded

- **Repository**: https://github.com/tprouvot/Salesforce-Inspector-reloaded
- **Author**: Thomas Prouvot and contributors
- **License**: MIT
- **Original**: [Salesforce Inspector](https://github.com/sorenkrabbe/Chrome-Salesforce-inspector) by Soren Krabbe (MIT)

### What we learned and adapted

| Pattern | SIR Source | SF Mothership Adaptation |
|---------|-----------|--------------------------|
| Cookie-based session reuse | `addon/background.js`, `addon/inspector.js` `getSession()` | `src/api/auth.ts` `getSessionId()` — 3段階cookie取得 (直接 → 元ドメイン → getAll) |
| Lightning → MyDomain 変換 | `addon/inspector.js` `getMyDomain()` | `src/api/auth.ts` `toApiHostname()` — `.lightning.force.` → `.my.salesforce.` 置換 |
| REST API Bearer認証 | `addon/inspector.js` `sfConn.rest()` | `src/api/client.ts` `sfFetch()` — Authorization: Bearer header |
| Record ID validation | `addon/popup.js` `/^([a-zA-Z0-9]{15}\|[a-zA-Z0-9]{18})$/` | `src/api/soqlClient.ts` `isValidRecordId()` |
| Lightning URL parsing | `addon/button.js`, `addon/popup.js` | `src/context/urlParser.ts` `parseUrl()` |
| Organization.IsSandbox query | `addon/inspector.js` sandbox detection | `src/api/orgInfo.ts` `getOrgInfo()` |
| Describe API + caching | `addon/inspect.js` describe with localStorage cache | `src/api/describeClient.ts` with chrome.storage.local cache (TTL 1h) |
| Service Worker as cookie broker | `addon/background.js` — SW only reads cookies, UI pages fetch directly | `src/background/serviceWorker.ts` + `src/sidepanel/hooks/useApi.ts` |

### Key architectural difference

SIR opens each feature in a **new browser tab** with context passed as URL params.
SF Mothership uses a persistent **Side Panel** with live context from Content Script,
and adds a **declarative tool definition engine** enabling JSON-only tool creation.

---

## sf-custom-config-tool

- **Repository**: https://github.com/rossoandoy/sf-custom-config-tool
- **Author**: rossoandoy
- **License**: MIT

### What we learned and adapted

| Pattern | Source | Adaptation |
|---------|--------|------------|
| Cookie broker SW pattern | `background/service-worker.ts` | SW handles only `getSession`/`getStatus`/`getSfHost` |
| UI-side direct fetch | `lib/sf-api.ts` fetches from popup/dashboard | `src/sidepanel/hooks/useApi.ts` fetches from Side Panel |
| Domain normalization | `lib/auth.ts` `toApiHostname()` | `src/api/auth.ts` `toApiHostname()` |
| getAll fallback for cookies | `background/service-worker.ts` `handleGetSession` | `src/api/auth.ts` `getSessionId()` step 3 |
