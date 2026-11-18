<!--
  健康状态（`/actuator/health`）

  把嵌套的 components 树压成「名字 / 状态 / 详情」三列卡片：Actuator 原始 JSON 的
  层级（db → dataSource → …）在排障时没有意义，真正要回答的只有「哪个组件 DOWN 了，
  它的 details 说了什么」。
-->
<template>
  <TabShell
    :searchable="false"
    :count-text="`共 ${nodes.length} 项`"
    :loading="loading"
    :error="error"
    @refresh="reload"
  >
    <div class="act-health__banner" :class="status === 'UP' ? 'is-up' : 'is-down'">
      <span class="act-health__dot" />
      <span class="act-health__label">整体状态</span>
      <b>{{ status }}</b>
    </div>

    <div class="act-health__grid">
      <div
        v-for="node in nodes"
        :key="node.name"
        class="act-health__card"
        :class="node.status === 'UP' ? 'is-up' : 'is-down'"
      >
        <div class="act-health__card-head">
          <span class="act-health__card-dot" />
          <span class="act-health__card-name">{{ node.name }}</span>
          <ReTag :type="node.status === 'UP' ? 'success' : 'danger'" effect="light" round>{{ node.status }}</ReTag>
        </div>
        <div v-if="node.details" class="act-health__card-detail">{{ node.details }}</div>
      </div>
      <ElEmpty
        v-if="!nodes.length"
        description="无健康组件"
        :image-size="48"
        style="grid-column: 1 / -1"
      />
    </div>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorHealthView">
/**
 * 健康状态页签。
 *
 * <p>详情里的字节数按 {@code humanBytes} 折算（{@code free=1.2 GB}），
 * 其余字段原样展示 —— Actuator 的 details 是各 HealthIndicator 自由拼的，
 * 事先不知道有哪些键，猜字段名只会漏。</p>
 */
import { computed } from "vue";
import { ElEmpty } from "element-plus";
import ReTag from "@repo/ui/re-tag";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";
import { humanBytes } from "../../cards/useMetricRows";

interface HealthComponent {
  status?: string;
  details?: Record<string, unknown>;
  components?: Record<string, HealthComponent>;
}

/** 压平后的健康节点 */
interface HealthNode {
  name: string;
  status: string;
  details: string;
}

const { data, loading, error, reload, hit } = useActuatorPanel("health");

/** 整体状态：Actuator 没给时用破折号，不假装 UP */
const status = computed(() => String((data.value as { status?: unknown } | null)?.status ?? "-"));

/** 详情摘要：字节字段折算，其余原样（嵌套对象压成 JSON） */
function healthDetail(details?: Record<string, unknown>): string {
  if (!details) return "";
  return Object.entries(details)
    .map(([k, v]) => {
      if (["free", "total", "threshold"].includes(k) && typeof v === "number") {
        return `${k}=${humanBytes(v)}`;
      }
      return `${k}=${v !== null && typeof v === "object" ? JSON.stringify(v) : v}`;
    })
    .join(" · ");
}

const nodes = computed<HealthNode[]>(() => {
  const components = (data.value as { components?: Record<string, HealthComponent> } | null)?.components;
  const out: HealthNode[] = [];
  const walk = (obj: Record<string, HealthComponent>, prefix: string) => {
    Object.entries(obj).forEach(([key, value]) => {
      const name = prefix ? `${prefix} / ${key}` : key;
      if (value && typeof value === "object" && value.components) {
        out.push({ name, status: String(value.status ?? "-"), details: "" });
        walk(value.components, name);
      } else {
        out.push({
          name,
          status: String(value?.status ?? "-"),
          details: healthDetail(value?.details),
        });
      }
    });
  };
  if (components) walk(components, "");
  return out.filter((node) => hit(node.name, node.status, node.details));
});
</script>
