<!--
  /**
   * 虚拟桌面 · 软件窗口（软件实例 / 调度信息）
   *
   * <p>两页都是「这台主机上跑着什么、什么时候跑」：</p>
   * <ul>
   *   <li><b>软件实例</b>：直接复用 {@link ScHostSoftwareInstances}，它内部把渲染
   *       交给 {@link ScSoftwarePanel}——软件实例在整个平台只有这一份版式，
   *       指标监控页与工作区页签用的就是同一份，这里不再另画卡片；</li>
   *   <li><b>调度信息</b>：复用 {@link ScScheduleTab}，规则实际落在批量计划任务里，
   *       增删改与「运维台 / 批量作业」是同一份数据。</li>
   * </ul>
   *
   * <p>软件实例来自采集通道落库的台账字段，主机离线也还能看最后一次采集，
   * 所以这个窗口不要求 SSH 可用。</p>
   */
  -->
<template>
  <div class="dsw">
    <div class="dsw__bar">
      <button type="button" class="dsw__tab" :class="{ 'is-on': tab === 'software' }" @click="tab = 'software'">
        软件实例
      </button>
      <button type="button" class="dsw__tab" :class="{ 'is-on': tab === 'schedule' }" @click="tab = 'schedule'">
        调度信息
      </button>
      <span class="dsw__spacer" />
      <span class="dsw__host">{{ hostName || `主机 #${hostId}` }}</span>
    </div>

    <div class="dsw__body">
      <ScHostSoftwareInstances v-if="tab === 'software'" :host-id="hostId" :host-name="hostName" />
      <ScScheduleTab v-else :host-id="hostId" :host-name="hostName" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScHostSoftwareInstances from "../../../components/ScHostSoftwareInstances.vue";
import ScScheduleTab from "../../ScScheduleTab.vue";

withDefaults(
  defineProps<{
    /** 主机标识 */
    hostId: number;
    /** 主机名 */
    hostName?: string;
    /** 窗口是否激活（父级透传，这里只用于样式） */
    active?: boolean;
  }>(),
  { hostName: "", active: false },
);

/** 一页是软件实例还是调度规则 */
const tab = ref<"software" | "schedule">("software");
</script>

<style scoped>
.dsw {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.dsw__bar {
  display: flex;
  flex: none;
  gap: 4px;
  align-items: center;
  height: 32px;
  padding: 0 10px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.dsw__tab {
  height: 22px;
  padding: 0 10px;
  font-size: 11px;
  color: #b9b4c2;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
}

.dsw__tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.dsw__tab.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.28);
  border-color: rgba(233, 84, 32, 0.5);
}

.dsw__spacer {
  flex: 1;
}

.dsw__host {
  overflow: hidden;
  font-size: 10.5px;
  color: #8f8a9b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 内容区是平台原有的浅色页面版式，铺浅色底而非深色，见 DesktopProfile 的说明 */
.dsw__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color-page, #f5f6fa);
}
</style>
