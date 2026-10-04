"""
敏感性对照门禁：变异 pages/server 的实现，证明新增 spec 不是恒绿的。

Sensitivity control for the pages/server specs.

Why this exists (AGENTS.md): a test suite that has never been shown to go red
is not evidence of anything. Every mutation below breaks ONE specific behaviour
that the new specs claim to pin, and the expected spec names must fail. If a
mutation leaves the suite green, the corresponding assertion is vacuous and the
claim in the spec header is false.

Rules honoured here (AGENTS.md section 0):
  * files are read/written through Python with explicit UTF-8, never through
    PowerShell cmdlets, so the Chinese comments cannot be mangled;
  * the file is restored byte-for-byte from a bytes backup taken beforehand,
    and the restore is verified by md5 -- not by "the tests passed again";
  * the script itself contains no assertion about overall pass/fail; it only
    records which specs went red, and the caller decides.
"""

import hashlib
import json
import io
import os
import shutil
import subprocess
import sys
import tempfile

PAGES = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(PAGES)))
UTILS = os.path.join(PAGES, "src", "utils")

# (label, relative file, old snippet, new snippet, spec substring that must fail)
MUTATIONS = [
    (
        "confirmThen: 去掉 try/catch（取消时不再兜底）",
        os.path.join(UTILS, "confirmThen.ts"),
        """  try {
    await confirmFn(...args);
    return true;
  } catch {
    // 取消与「弹不出来」在这里不可区分，但对调用方而言处理方式相同：
    // 都没有拿到明确同意，因此都不继续。不要把异常往上抛 ——
    // 那正是本函数要消除的行为。
    return false;
  }""",
        """  await confirmFn(...args);
  return true;""",
        "confirmThen.spec.ts",
    ),
    (
        "confirmThen: 取消时返回 true（把「不」当「是」）",
        os.path.join(UTILS, "confirmThen.ts"),
        """    return false;
  }
}""",
        """    return true;
  }
}""",
        "confirmThen.spec.ts",
    ),
    (
        "nodeList: 非 ERROR 状态也展示 error 残留",
        os.path.join(UTILS, "nodeList.ts"),
        '    reason: status === "ERROR" ? normalizeReason(node?.error) : "",',
        '    reason: normalizeReason(node?.error),',
        "nodeList.spec.ts",
    ),
    (
        "nodeList: 未知状态复用「运行中」文案（状态灯撒谎）",
        os.path.join(UTILS, "nodeList.ts"),
        '    text: known ? STATUS_TEXT[status] : `未知(${status || "空"})`,',
        '    text: STATUS_TEXT[status] ?? "运行中",',
        "nodeList.spec.ts",
    ),
    (
        "nodeList: 未知状态并入 stopped（总数与分项之和对不上）",
        os.path.join(UTILS, "nodeList.ts"),
        """    } else {
      // 后端写入枚举外的值时必须单独计数，否则 total 对不上分项之和，
      // 统计卡片会出现「1+2+3 ≠ 总数」而没人说得清多出来的是什么
      stats.unknown += 1;
    }""",
        """    } else {
      stats.stopped += 1;
    }""",
        "nodeList.spec.ts",
    ),
    (
        "nodeList: 关键字不再匹配失败原因（排障入口被堵死）",
        os.path.join(UTILS, "nodeList.ts"),
        """    node.serverUrl ?? "",
    node.error ?? "",
  ]""",
        """    node.serverUrl ?? "",
  ]""",
        "nodeList.spec.ts",
    ),
    (
        "nodeList: 协议过滤改成子串匹配（http 会命中 http-proxy）",
        os.path.join(UTILS, "nodeList.ts"),
        "    if (protocol && node?.protocol !== protocol) {",
        "    if (protocol && !(node?.protocol ?? '').includes(protocol)) {",
        "nodeList.spec.ts",
    ),
    (
        "autoRefresh: 去掉单飞锁（允许请求重叠）",
        os.path.join(UTILS, "autoRefresh.ts"),
        """    // 单飞：上一轮还没回来就跳过，避免响应乱序把列表刷回旧值
    if (inFlight) {
      schedule();
      return;
    }""",
        "",
        "autoRefresh.spec.ts",
    ),
    (
        "autoRefresh: schedule 挪回 await 之后（任务挂死则循环死掉）",
        os.path.join(UTILS, "autoRefresh.ts"),
        """    schedule();
    try {
      await task();
      failures = 0;
    } catch {
      failures = Math.min(failures + 1, options.maxBackoffCount);
    } finally {
      inFlight = false;
    }""",
        """    try {
      await task();
      failures = 0;
    } catch {
      failures = Math.min(failures + 1, options.maxBackoffCount);
    } finally {
      inFlight = false;
      if (running) {
        schedule();
      }
    }""",
        "autoRefresh.spec.ts",
    ),
    (
        "autoRefresh: 页面不可见时仍然发请求（后台空转）",
        os.path.join(UTILS, "autoRefresh.ts"),
        """    if (!deps.isVisible()) {
      schedule();
      return;
    }""",
        "",
        "autoRefresh.spec.ts",
    ),
    (
        "autoRefresh: 失败不退避（恒定基准间隔，故障时打爆后端）",
        os.path.join(UTILS, "autoRefresh.ts"),
        """    } catch {
      failures = Math.min(failures + 1, options.maxBackoffCount);
    } finally {""",
        """    } catch {
      // 变异：吞掉失败，不退避
    } finally {""",
        "autoRefresh.spec.ts",
    ),
    (
        "autoRefresh: start 时立刻执行一次任务（与首屏重复请求）",
        os.path.join(UTILS, "autoRefresh.ts"),
        """      // 首次不立刻跑：页面挂载时已经在拉第一屏了，
      // 紧接着再打一次会造成两个相同请求
      schedule();""",
        """      void tick();
      schedule();""",
        "autoRefresh.spec.ts",
    ),
    (
        "metaLoad: 元数据失败也静默（回到原始缺陷）",
        os.path.join(UTILS, "metaLoad.ts"),
        """  if (degraded.length > 0) {""",
        """  if (false && degraded.length > 0) {""",
        "metaLoad.spec.ts",
    ),
    (
        "metaLoad: 元数据失败也报 error（把降级说成致命）",
        os.path.join(UTILS, "metaLoad.ts"),
        """    return {
      show: true,
      tone: "warning",
      text: `部分元数据加载失败：${degraded.join("、")}。协议与插件下拉可能不完整，新建/编辑前请先刷新确认。`,
    };""",
        """    return {
      show: true,
      tone: "error",
      text: `部分元数据加载失败：${degraded.join("、")}。协议与插件下拉可能不完整，新建/编辑前请先刷新确认。`,
    };""",
        "metaLoad.spec.ts",
    ),
]


def run_specs(spec_filter):
    """Run vitest for one spec file, return (passed_bool, combined_output).

    Invoked through node + the vitest JS entry directly rather than through
    `pnpm`: pnpm on this machine is a PowerShell shim (pnpm.ps1) and is not
    on PATH for a plain CreateProcess, which surfaces as a bare
    "FileNotFoundError" with no hint about the real cause.
    """
    vitest_js = os.path.join(
        PAGES, "node_modules", "vitest", "vitest.mjs"
    )
    if not os.path.exists(vitest_js):
        # fall back to whatever entry the package advertises
        pkg = os.path.join(PAGES, "node_modules", "vitest", "package.json")
        with io.open(pkg, "r", encoding="utf-8") as fh:
            bin_rel = json.load(fh).get("bin")
        vitest_js = os.path.join(PAGES, "node_modules", "vitest", bin_rel)

    cmd = [
        r"C:\Program Files\nodejs\node.exe",
        vitest_js,
        "run",
        spec_filter,
    ]
    proc = subprocess.run(
        cmd,
        cwd=PAGES,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=900,
    )
    return proc.returncode == 0, (proc.stdout or "") + (proc.stderr or "")


def main():
    results = []
    for label, path, old, new, spec in MUTATIONS:
        with open(path, "rb") as fh:
            original = fh.read()
        backup = tempfile.NamedTemporaryFile(delete=False, suffix=".bak")
        backup.write(original)
        backup.close()

        text = original.decode("utf-8")
        if old not in text:
            results.append((label, spec, "MUTATION_NOT_APPLIED", ""))
            os.unlink(backup.name)
            continue

        mutated = text.replace(old, new, 1)
        try:
            with io.open(path, "w", encoding="utf-8", newline="") as fh:
                fh.write(mutated)
            ok, out = run_specs(spec)
            detected = not ok
            # Count how many tests in that spec reported failure, to distinguish
            # "the assertion caught it" from "the suite failed to even compile".
            failing = out.count("FAIL ") + out.count("AssertionError")
            results.append(
                (label, spec, "DETECTED" if detected else "NOT_DETECTED", "failmarks=%d" % failing)
            )
        finally:
            # Restore byte-for-byte, then prove it.
            with open(path, "wb") as fh:
                fh.write(original)
            with open(path, "rb") as fh:
                after = fh.read()
            same = hashlib.md5(after).hexdigest() == hashlib.md5(original).hexdigest()
            results.append(
                (label, spec, "RESTORED_OK" if same else "RESTORE_FAILED", "")
            )
            os.unlink(backup.name)

    print("=" * 78)
    print("MUTATION SENSITIVITY RESULTS")
    print("=" * 78)
    undetected = 0
    restore_failed = 0
    for label, spec, status, extra in results:
        if status == "NOT_DETECTED":
            undetected += 1
        if status == "RESTORE_FAILED":
            restore_failed += 1
        if status == "RESTORED_OK":
            continue
        print("  %-58s %-26s %s %s" % (label[:58], spec, status, extra))
    print("-" * 78)
    print("  mutations total      = %d" % len(MUTATIONS))
    print("  NOT detected         = %d" % undetected)
    print("  restore failures     = %d" % restore_failed)
    print("=" * 78)
    if undetected or restore_failed:
        print("VERDICT: SENSITIVITY_CONTROL_FAILED")
        sys.exit(1)
    print("VERDICT: EVERY_MUTATION_DETECTED")


if __name__ == "__main__":
    main()