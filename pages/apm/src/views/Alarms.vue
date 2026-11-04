<!--
  告警 —— 对齐 SkyWalking 的 Alarm 页面。

  SkyWalking 的告警是「规则触发后写进 alarm 表」的事件，没有「已读 / 处理」这种
  状态机（那是各家自己做的工作流）。因此本页只做展示与筛选，不编造「标记已处理」的按钮 ——
  点了也不会被后端记住，反而让人以为处理过了。
-->
<template>
  <ApmGate v-slot="{ status }">
    <ReSectionHead description="规则触发的告警事件，按服务与关键词筛选">
      <template #title>告警</template>
      <template #actions>
        <ReButton icon="Refresh" show-text :loading="loading" @click="load">刷新</ReButton>
      </template>
    </ReSectionHead>

    <div class="apm-bar">
      <ReSelect
        v-model="service"
        :options="serviceOptions"
        placeholder="全部服务"
        clearable
        filterable
        style="width: 220px"
        @change="load"
      />
      <ReInput v-model="keyword" placeholder="按告警内容过滤" clearable style="width: 260px" @keyup.enter="load" />
      <ReSelect v-model="minutes" :options="windowOptions" style="width: 150px" @change="load" />
      <ReButton icon="Search" type="primary" :loading="loading" @click="load">查询</ReButton>
      <span class="apm-bar__spacer" />
      <span class="apm-count">{{ alarms.length }} 条告警</span>
    </div>

    <ReSkeleton v-if="loading && !alarms.length" :rows="6" animated />

    <template v-else>
      <ReEmpty
        v-if="!alarms.length"
        :image-size="70"
        description="该时间窗口内没有告警（也可能是 OAP 未配置告警规则）"
      />

      <template v-else>
        <ReCard v-for="alarm in alarms" :key="alarm.id" :radius="12" shadow="never" class="alarm-card">
          <div class="alarm-head">
            <!-- 标签是「作用域」而不是规则名：OAP 的 AlarmMessage 不暴露 ruleName，
                 硬塞实体会让人以为那是规则名。 -->
            <ReTag type="danger" round>{{ alarm.scope || "告警" }}</ReTag>
            <span class="alarm-service apm-mono">{{ alarm.name || "—" }}</span>
            <span class="apm-bar__spacer" />
            <span class="apm-muted">{{ fmtTime(alarm.startTime) }} · {{ fmtAgo(alarm.startTime) }}</span>
          </div>
          <p class="alarm-msg">{{ alarm.message || "（无描述）" }}</p>
          <div v-if="alarm.events?.length" class="apm-kv">
            <div v-for="(event, i) in alarm.events" :key="i" class="apm-kv__row">{{ event }}</div>
          </div>
          <div v-if="alarm.tags?.length" class="apm-kv alarm-tags">
            <div v-for="tag in alarm.tags" :key="tag.key" class="apm-kv__row">
              <span class="apm-kv__key">{{ tag.key }}</span>{{ tag.value }}
            </div>
          </div>
        </ReCard>
      </template>
    </template>

    <div v-if="!status.capabilities.includes('alarms')" class="apm-muted">
      引擎 {{ status.name }} 不支持告警查询。
    </div>
  </ApmGate>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { Search } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReCard from "@repo/ui/re-card";
import ReEmpty from "@repo/ui/re-empty";
import ReInput from "@repo/ui/re-input";
import ReSectionHead from "@repo/ui/re-section-head";
import ReSelect from "@repo/ui/re-select";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTag from "@repo/ui/re-tag";
import ApmGate from "../components/ApmGate.vue";
import { listAlarms, listServices } from "../api/apmApi";
import type { ApmAlarm } from "../api/apmApi";
import { useApmStatus } from "../composables/useApmStatus";
import { WINDOW_OPTIONS, fmtAgo, fmtTime } from "../utils/format";

const { present, ensure } = useApmStatus();

const alarms = ref<ApmAlarm[]>([]);
const services = ref<string[]>([]);
const service = ref("");
const keyword = ref("");
const minutes = ref(60);
const loading = ref(false);
const windowOptions = WINDOW_OPTIONS;

const serviceOptions = computed(() => services.value.map((s) => ({ label: s, value: s })));

async function load() {
  await ensure();
  if (!present.value) {
    return;
  }
  loading.value = true;
  try {
    alarms.value =
      (await listAlarms({
        service: service.value || undefined,
        keyword: keyword.value || undefined,
        minutes: minutes.value,
      })) || [];
  } catch (e) {
    alarms.value = [];
    message.error(`加载告警失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

async function loadServices() {
  try {
    services.value = ((await listServices({})) || []).map((s) => s.name);
  } catch {
    services.value = [];
  }
}

onMounted(async () => {
  await loadServices();
  load();
});
</script>

<style scoped>
.alarm-card {
  border-left: 3px solid var(--el-color-danger);
}

.alarm-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.alarm-service {
  color: var(--text-primary, var(--el-text-color-primary));
}

.alarm-msg {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary, var(--el-text-color-regular));
  white-space: pre-wrap;
}

.alarm-tags {
  margin-top: 8px;
}
</style>
