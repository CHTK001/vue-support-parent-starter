/**
 * 快速校验：用 vue/compiler-sfc 逐个编译被改动的 SFC，确认标签/属性改动没破坏模板。
 * 只做「能不能编译」，不做类型检查 —— 类型错误留给各自的 vue-tsc。
 *
 * 为什么不用 @vue/compiler-sfc：pnpm 严格依赖树里它只作为 vue 的传递依赖存在
 * （.pnpm 下深层嵌套），直接 import 会 ERR_MODULE_NOT_FOUND；vue/compiler-sfc
 * 是官方子路径导出，任何装了 vue 的包都能解析。
 *
 * 用法：在任一装了 vue 的包目录下执行（本文件随包运行）。
 */
import { readFileSync } from "node:fs";
import { parse, compileScript, compileTemplate } from "vue/compiler-sfc";

const ROOT = "D:/ch/project/vue-support-parent-starter/";
const files = [
  "pages/monitor/src/views/overview/ScOverview.vue",
  "pages/monitor/src/views/ScAssetList.vue",
  "pages/monitor/src/views/tasks/ScTaskList.vue",
  "pages/monitor/src/views/assets/ScAssetCenter.vue",
  "pages/monitor/src/views/agents/ScAgentList.vue",
  "pages/monitor/src/views/alarm/ScAlarmTab.vue",
  "pages/server/src/views/ScServiceManage.vue",
  "pages/server/src/views/ScHostList.vue",
  "pages/job/src/views/JobOverviewView.vue",
  "pages/job/src/views/JobLogView.vue",
  "apps/vue-support-collect-scheduler-starter/src/views/DashboardView.vue",
  "apps/vue-support-hotspot-starter/src/views/Services.vue",
  "apps/vue-support-hotspot-starter/src/views/ServiceDetail.vue",
  "apps/vue-support-hotspot-starter/src/views/Jvm.vue",
  "apps/vue-support-hotspot-starter/src/views/Injector.vue",
  "apps/vue-support-hotspot-starter/src/views/Errors.vue",
  "apps/vue-support-hotspot-starter/src/views/Endpoints.vue",
  "apps/vue-support-hotspot-starter/src/views/Alerts.vue",
  "apps/vue-support-hotspot-starter/src/views/TraceWaterfall.vue",
  "apps/vue-support-monitor-starter/src/views/WorkbenchView.vue",
  "packages/ui/src/components/ReStatCard/theme/default/ReStatCard.vue",
  "pages/datasource/src/views/ScDataSourceView.vue",
];

let fail = 0;
for (const rel of files) {
  const source = readFileSync(ROOT + rel, "utf8");
  const problems = [];
  try {
    const { descriptor, errors } = parse(source, { filename: rel });
    for (const e of errors) {
      problems.push(`parse: ${e.message}`);
    }
    if (descriptor.scriptSetup || descriptor.script) {
      try {
        compileScript(descriptor, { id: rel });
      } catch (e) {
        problems.push(`script: ${e.message}`);
      }
    }
    if (descriptor.template) {
      const r = compileTemplate({ source: descriptor.template.content, filename: rel, id: rel });
      for (const e of r.errors || []) {
        problems.push(`template: ${typeof e === "string" ? e : e.message}`);
      }
    }
  } catch (e) {
    problems.push(`fatal: ${e.message}`);
  }
  if (problems.length) {
    fail++;
    console.log(`  [BAD] ${rel}`);
    problems.slice(0, 4).forEach(p => console.log(`        ${p}`));
  } else {
    console.log(`  [OK]  ${rel}`);
  }
}
console.log();
console.log(fail === 0 ? `SFC_COMPILE_ALL_PASS (${files.length})` : `SFC_COMPILE_FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
