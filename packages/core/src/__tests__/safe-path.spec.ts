/**
 * 远程注入白名单边界测试（safe-path）
 *
 * <p>守护 {@code security.watermark} 前缀放开后不把安全边界带塌：</p>
 * <ul>
 *   <li>水印四字段放行（后台能配置、前端能生效）；</li>
 *   <li>{@code security} 下其他子树仍拒（csrf / password / crt ...）；</li>
 *   <li>原型链段名仍拒，且不污染全局原型；</li>
 *   <li>相似前缀（{@code security.watermarkX}）不被前缀匹配误放行；</li>
 *   <li>非纯对象容器不可下钻。</li>
 * </ul>
 *
 * <p>放在 @repo/core 而不是 @repo/config，是因为前者已有 vitest 设施；
 * config 是它的既有依赖，导入即测真实实现。</p>
 */
import { describe, expect, it } from "vitest";
import {
  safeSetDotted,
  REMOTE_INJECTABLE_TOP_KEYS,
  REMOTE_INJECTABLE_PATH_PREFIXES,
} from "@repo/config";

const opts = {
  topKeyAllowlist: REMOTE_INJECTABLE_TOP_KEYS,
  pathPrefixAllowlist: REMOTE_INJECTABLE_PATH_PREFIXES,
};

const setPath = (path: string, value: unknown = true) => {
  const target: Record<string, unknown> = {};
  const allowed = safeSetDotted(target, path, value, opts);
  return { allowed, target };
};

describe("远程注入白名单边界", () => {
  describe("security.watermark 放行", () => {
    it.each([
      "security.watermark.enable",
      "security.watermark.color",
      "security.watermark.alpha",
      "security.watermark.rotate",
      "security.watermark",
    ])("放行 %s", (path) => {
      expect(setPath(path).allowed).toBe(true);
    });

    it("既有放行项 security.baiduJs 未被回归", () => {
      expect(setPath("security.baiduJs.enable").allowed).toBe(true);
    });
  });

  describe("security 其余子树仍拒", () => {
    it.each([
      "security.csrf.enable",
      "security.password.minLength",
      "security.crt.path",
    ])("拒绝 %s", (path) => {
      expect(setPath(path).allowed).toBe(false);
    });
  });

  describe("原型链与容器边界", () => {
    it.each([
      "security.watermark.__proto__.polluted",
      "security.watermark.constructor.prototype.polluted",
      "security.watermark.prototype.polluted",
    ])("拒绝原型链路径 %s", (path) => {
      expect(setPath(path).allowed).toBe(false);
    });

    it("不污染全局原型", () => {
      setPath("security.watermark.__proto__.isAdmin");
      expect(({} as Record<string, unknown>).isAdmin).toBeUndefined();
    });

    it("相似前缀不被误放行", () => {
      // 前缀匹配必须带点号边界，watermarkX 不能命中 watermark
      expect(setPath("security.watermarkX").allowed).toBe(false);
    });

    it("非纯对象容器不可下钻", () => {
      const target = { security: { watermark: "oops" } };
      expect(
        safeSetDotted(target, "security.watermark.color", "#fff", opts),
      ).toBe(false);
    });
  });

  describe("系统键仍拒", () => {
    it.each(["http.baseUrl", "token.storageKey", "crypto.key", "url.setting"])(
      "拒绝 %s",
      (path) => {
        expect(setPath(path).allowed).toBe(false);
      },
    );
  });
});
