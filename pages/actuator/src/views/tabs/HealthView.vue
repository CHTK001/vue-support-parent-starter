<!--
  健康状态（`/actuator/health`）

  仪表盘形态：先给结论（整体状态 + 4 格计数），再按「DOWN 优先」分区。
  Actuator 原始 JSON 的层级（db → dataSource → …）在排障时没有意义，真正要回答的
  只有两件事 ——「整体有没有事」「哪个组件 DOWN 了，它的 details 说了什么」。
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

    <div class="act-health__stats">
      <div class="act-health__stat">
        <span class="act-health__stat-label">组件总数</span>
        <span class="act-health__stat-value">{{ nodes.length }}</span>
      </div>
      <div class="act-health__stat is-up">
        <span class="act-health__stat-label">UP</span>
        <span class="act-health__stat-value">{{ upNodes.length }}</span>
      </div>
      <div class="act-health__stat is-down">
        <span class="act-health__stat-label">DOWN</span>
        <span class="act-health__stat-value">{{ downNodes.length }}</span>
      </div>
      <div class="act-health__stat">
        <span class="act-health__stat-label">其它状态</span>
        <span class="act-health__stat-value">{{ otherNodes.length }}</span>
      </div>
    </div>

    <!-- DOWN 优先：故障在上，正常收成 chip，健康时一屏看完 -->
    <section v-if="downNodes.length" class="act-health__section">
      <div class="act-health__section-head is-down">
        DOWN 组件（优先处理）
        <span class="act-group__count">{{ downNodes.length }}</span>
      </div>
      <div class="act-health__grid">
        <div v-for="node in downNodes" :key="node.name" class="act-health__card is-down">
          <div class="act-health__card-head">
            <span class="act-health__card-dot" />
            <span class="act-health__card-name">{{ node.name }}</span>
            <ReTag type="danger" effect="light" round>{{ node.status }}</ReTag>
          </div>
          <div v-if="node.details" class="act-health__card-detail">{{ node.details }}</div>
        </div>
      </div>
    </section>

    <section v-else-if="nodes.length" class="act-health__section">
      <div class="act-health__ok">没有 DOWN 组件 —— 所有组件均为 UP</div>
    </section>

    <section v-if="upNodes.length" class="act-health__section">
      <div class="act-health__section-head">
        正常组件
        <span class="act-group__count">{{ upNodes.length }}</span>
      </div>
      <div class="act-health__chips">
        <span v-for="node in upNodes" :key="node.name" class="act-health__chip" :title="node.details || node.name">
          <span class="act-health__chip-dot" />
          {{ node.name }}
        </span>
      </div>
    </section>

    <section v-if="otherNodes.length" class="act-health__section">
      <div class="act-health__section-head">
        其它状态
        <span class="act-group__count">{{ otherNodes.length }}</span>
      </div>
      <div class="act-health__grid">
        <div v-for="node in otherNodes" :key="node.name" class="act-health__card">
          <div class="act-health__card-head">
            <span class="act-health__card-dot" />
            <span class="act-health__card-name">{{ node.name }}</span>
            <ReTag type="info" effect="light" round>{{ node.status }}</ReTag>
          </div>
          <div v-if="node.details" class="act-health__card-detail">{{ node.details }}</div>
        </div>
      </div>
    </section>

    <ElEmpty v-if="!nodes.length" description="无健康组件" :image-size="48" />
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

/** 分区：DOWN 永远在最上面，其余状态单独一栏，别混进「正常组件」里假装没事 */
const downNodes = computed(() => nodes.value.filter((node) => node.status === "DOWN"));
const upNodes = computed(() => nodes.value.filter((node) => node.status === "UP"));
const otherNodes = computed(
  () => nodes.value.filter((node) => node.status !== "UP" && node.status !== "DOWN"),
);
</script>
