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
        <button
          type="button"
          class="scw__gh"
          :aria-expanded="group.open"
          :aria-label="`${group.label} 配置分组`"
          @click="toggle(gi)"
        >
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
/* 统一规范：圆角只用令牌、字号最小 12px、间距 4/8 基准、过渡走 --el-transition-duration */
.scw {
  display: flex; flex-direction: column; height: 100%; width: 100%; min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, var(--el-radius-lg, 12px));
  overflow: hidden;
}
.scw__header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 16px 8px; }
.scw__title { display: inline-flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.scw__title-icon { flex-shrink: 0; color: var(--el-color-primary); }
.scw__badge {
  flex-shrink: 0; padding: 4px 8px; font-size: 12px; font-weight: 500;
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, transparent);
  border-radius: var(--el-radius-full, 9999px);
}
.scw__body { display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 0; overflow: auto; padding: 0 16px 16px; }

/* 分组是「可折叠区块」而非卡片，用极轻的边框加深提示 hover */
.scw__group {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
  transition: border-color var(--el-transition-duration, 0.2s);
}
.scw__group:hover { border-color: var(--el-border-color); }

.scw__gh {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;
  padding: 8px 16px; border: none; text-align: left; cursor: pointer;
  font-size: 13px; font-weight: 600;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  transition: background var(--el-transition-duration, 0.2s);
}
.scw__gh:hover { background: var(--el-color-primary-light-9); }
.scw__gh:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--el-color-primary); }

.scw__gt { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.scw__ga {
  flex-shrink: 0; font-size: 12px; color: var(--el-text-color-disabled);
  transition: transform var(--el-transition-duration, 0.2s);
}
.scw__ga--open { color: var(--el-color-primary); transform: rotate(90deg); }

.scw__gb { display: flex; flex-direction: column; padding: 4px 0; }
.scw__r {
  display: flex; align-items: baseline; gap: 8px; padding: 8px 16px;
  font-size: 12px;
  transition: background var(--el-transition-duration, 0.2s);
}
.scw__r:hover { background: var(--el-fill-color-lighter); }

/* 键值都用等宽字体：这是调试视图，对齐才能一眼比对 */
.scw__rk {
  width: 72px; flex-shrink: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px; color: var(--el-text-color-secondary);
  overflow: hidden; text-overflow: ellipsis;
}
.scw__rv {
  flex: 1; min-width: 0;
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
  font-size: 12px; color: var(--el-text-color-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: pre;
}
.scw__tag { padding: 0 8px; font-size: 12px; border-radius: var(--el-radius-full, 9999px); }
.scw__tag--on { color: var(--el-color-success); background: color-mix(in srgb, var(--el-color-success) 12%, transparent); }
.scw__tag--off { color: var(--el-text-color-disabled); background: var(--el-fill-color-light); }
</style>