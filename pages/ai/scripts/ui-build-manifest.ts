/**
 * 生成 UI 构建清单（nomifun-build.json），供桌面端校验版本与 API 契约。
 */
export interface UiBuidManifest {
  version: string;
  apiContractVersion: string;
  buildTime: string;
}

export function createUiBuildManifest(version: string, apiContractVersion: string): UiBuidManifest {
  return {
    version,
    apiContractVersion,
    buildTime: new Date().toISOString(),
  };
}
