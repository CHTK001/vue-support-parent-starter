/**
 * @repo/core mergeDefaultSetting 验证
 *
 * 把活数据（/v2/setting/default，46 项，16 个 SSO 旧名 + 4 个水印旧名 + 旧名登录行）
 * 送进 mergeDefaultSetting，检查最终落到 getConfig() 的哪些路径：
 *  - login.*（旧名 SystemName/SlidingBlockOpen/OpenSmsLogin）
 *  - security.watermark.*（旧名 WatermarkOpen/Color/Alpha/Rotate）
 *  - 安全/后台键（Codec*、Version、SSO 开关名）不得落盘
 */
import { describe, expect, it, vi } from "vitest";
import { mergeDefaultSetting } from "../setting";
import { getConfig } from "@repo/config";
import { readFileSync } from "node:fs";

const cwd = process.env.PWD ?? process.cwd();
const liveData = JSON.parse(readFileSync(cwd + "/../../.tmp/live-setting.json", "utf8"));
const items = Array.isArray(liveData.data) ? liveData.data : liveData;

describe("mergeDefaultSetting", () => {
  it("旧式 name 落到 login.* / security.watermark.*，系统键不落地", () => {
    const warn = vi.spyOn(globalThis.console, "warn").mockImplementation(() => undefined);

    mergeDefaultSetting(items);

    const cfg = getConfig() as unknown as Record<string, unknown>;
    const login = cfg.login as Record<string, unknown>;

    // 登录页旧名（与 core SETTING_TO_LOGIN_MAP 对齐）
    expect(login.title).toBe("后台管理系统"); // SystemName
    expect(login.brandName).toBe("后台管理系统"); // BrandName（带 sysSettingCode = login.brandName）
    expect(login.slider).toBe(true); // SlidingBlockOpen
    expect(login.smsLogin).toBe(true); // OpenSmsLogin
    expect(login.captcha).toBe(false); // CheckCodeOpen（login.captcha 编码直写）
    // FeatureTags（带 sysSettingCode 的路径①：值原样落盘；JSON 解包只对旧名路径②生效）
    expect(login.featureTags).toBe(
      '[{"icon":"DataAnalysis","text":"高效管理"},{"icon":"Brush","text":"现代设计"},{"icon":"Lock","text":"安全可靠"}]',
    );

    // 水印旧名：不在 login 子树上，必须落到 security.watermark（waterMarker 读数路径）
    const security = cfg.security as Record<string, unknown>;
    expect(security.watermark).toEqual({
      enable: false,
      color: "#409EFF",
      rotate: -30,
      alpha: 0.35,
    });

    // 环境与系统键：后台有表项但前端不消费，不得落盘
    const http = cfg.http as Record<string, unknown> | undefined;
    expect(http?.baseUrl).toBe("");
    expect(cfg.version).toBeUndefined();
    for (const n of ["gitee", "github", "google", "oidc", "wechat", "wechat_mp", "wechat_enterprise", "qq", "alipay", "dingtalk", "weibo", "baidu", "microsoft", "taobao", "douyin", "feishu"]) {
      expect(cfg[n]).toBeUndefined();
    }

    warn.mockRestore();
  });
});
