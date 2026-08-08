<template>
  <div class="scw">
    <div v-if="!widget.hideTitle" class="scw__header">
      <div class="scw__title">
        <el-icon class="scw__title-icon"><Setting /></el-icon>
        <span>系统配置</span>
      </div>
      <span class="scw__badge">仅管理员</span>
    </div>

    <div class="scw__body">
      <div v-for="(group, gi) in groups" :key="gi" class="scw__group">
        <button type="button" class="scw__gh" @click="toggle(gi)">
          <span class="scw__gt">{{ group.label }}</span>
          <el-icon class="scw__ga" :class="{ 'scw__ga--open': group.open }"><ArrowRight /></el-icon>
        </button>
        <div v-show="group.open" class="scw__gb">
          <div v-for="(val, key) in group.data" :key="key" class="scw__r">
            <span class="scw__rk">{{ key }}</span>
            <span class="scw__rv">
              <template v-if="isObject(val)">{{ JSON.stringify(val, null, 1) }}</template>
              <template v-else-if="val === true || val === false">
                <span class="scw__tag" :class="val ? 'scw__tag--on' : 'scw__tag--off'">{{ val }}</span>
              </template>
              <template v-else-if="val == null || val === ''">—</template>
              <template v-else>{{ val }}</template>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="SystemConfigWidget">
import { reactive } from "vue";
import { ArrowRight, Setting } from "@element-plus/icons-vue";
import { getConfig } from "@repo/config";
import type { WidgetItem } from "../types";

defineProps<{ widget: WidgetItem }>();

interface GroupItem { label: string; open: boolean; data: Record<string, unknown>; }
const cfg = getConfig() as unknown as Record<string, unknown>;

const groups = reactive<GroupItem[]>([
  { label: "系统信息", open: true, data: pick(["app", "env", "system"]) },
  { label: "HTTP 请求", open: false, data: pick(["http", "url", "upload"]) },
  { label: "路由与权限", open: false, data: pick(["route", "permission", "token"]) },
  { label: "存储与安全", open: false, data: pick(["storage", "security", "crypto"]) },
  { label: "登录与消息", open: false, data: pick(["login", "message", "socket"]) },
  { label: "其他配置", open: false, data: pick(["other", "config", "monitor"]) },
]);

function toggle(gi: number): void { groups[gi].open = !groups[gi].open; }
function isObject(v: unknown): boolean { return v !== null && typeof v === "object" && !Array.isArray(v); }
function pick(keys: string[]): Record<string, unknown> {
  const r: Record<string, unknown> = {};
  keys.forEach((k) => { const v = cfg[k]; if (v !== undefined) r[k] = v; });
  return r;
}
</script>

<style lang="scss" scoped>
.scw {
  display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 12px; overflow: hidden;
}
.scw__header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; }
.scw__title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); display: inline-flex; align-items: center; gap: 8px; }
.scw__title-icon { color: var(--el-color-primary); }
.scw__badge { font-size: 10px; color: var(--el-color-warning); background: color-mix(in srgb, var(--el-color-warning) 12%, transparent); padding: 2px 10px; border-radius: 999px; font-weight: 500; }
.scw__body { flex: 1; min-height: 0; overflow: auto; padding: 0 12px 12px; display: flex; flex-direction: column; gap: 6px; }
.scw__group { border: 1px solid var(--el-border-color-lighter); border-radius: 10px; overflow: hidden; }
.scw__gh { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 14px; border: none; background: var(--el-fill-color-light); cursor: pointer; font-size: 12px; font-weight: 600; color: var(--el-text-color-primary); text-align: left; }
.scw__gt { color: var(--el-text-color-primary); }
.scw__ga { font-size: 12px; color: var(--el-text-color-disabled); transition: transform 0.15s; }
.scw__ga--open { transform: rotate(90deg); }
.scw__gb { display: flex; flex-direction: column; padding: 4px 0; }
.scw__r { display: flex; align-items: baseline; gap: 8px; padding: 5px 14px; font-size: 11px; }
.scw__rk { width: 72px; flex-shrink: 0; color: var(--el-text-color-secondary); font-family: "SF Mono", "Cascadia Code", Consolas, monospace; font-size: 10px; overflow: hidden; text-overflow: ellipsis; }
.scw__rv { flex: 1; color: var(--el-text-color-primary); font-family: "SF Mono", "Cascadia Code", Consolas, monospace; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: pre; }
.scw__tag { font-size: 10px; padding: 1px 8px; border-radius: 999px; }
.scw__tag--on { background: color-mix(in srgb, var(--el-color-success) 12%, transparent); color: var(--el-color-success); }
.scw__tag--off { background: var(--el-fill-color-light); color: var(--el-text-color-disabled); }
</style>