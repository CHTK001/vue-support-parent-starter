<script setup lang="ts">
/**
 * 系统配置 —— 系统级（Guacd 远控网关）配置
 *
 * 基于后端 /ms/server/config 系统配置表（MsServerConfig）：
 * - guacd：服务端隧道连接的守护进程地址（GuacdConnectionFactory 动态读取）
 * - guacd-client：浏览器侧 guacamole 客户端回连后端 WS 隧道的 host:port
 *   （RemoteControlPageController 动态读取，空串 = 同域 location.host）
 * 在离线检测 / 硬件采集 / Agent 推送 / 远控开关均属主机级配置，
 * 存于 ms_server_host 主机字段，随各主机在「主机资产」表单内配置，不在系统配置出现。
 * 保存后即时生效，无需重启。
 * @author CH
 * @since 4.0.0
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { http } from "@repo/core";
import { unwrapResult } from "@repo/utils";

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number";
  placeholder: string;
  hint?: string;
}

interface ConfigCard {
  key: string;
  title: string;
  desc: string;
  icon: string;
  /** 消费方说明（卡片脚注） */
  consumer: string;
  items: ConfigField[];
}

const CARDS: ConfigCard[] = [
  {
    key: "guacd",
    title: "guacd",
    desc: "远控隧道守护进程 · 服务端连接",
    icon: "Connection",
    consumer: "GuacdConnectionFactory 动态读取 · 远控隧道建立时生效",
    items: [
      { key: "guacd.host", label: "地址", type: "text", placeholder: "172.16.0.40" },
      { key: "guacd.port", label: "端口", type: "number", placeholder: "4822" },
    ],
  },
  {
    key: "guacd-client",
    title: "guacd-client",
    desc: "浏览器侧 WS 隧道网关",
    icon: "Link",
    consumer: "RemoteControlPageController 动态读取 · 生成远控页面时生效",
    items: [
      { key: "guacd.client.host", label: "网关地址（host:port）", type: "text", placeholder: "127.0.0.1:8082", hint: "留空 = 同域 location.host（前后端同域部署）" },
    ],
  },
];

const KEYS = CARDS.flatMap(c => c.items.map(i => i.key));

/** 前端兜底默认值：后端旧版本缺该键、或请求失败时页面仍展示默认值 */
const FALLBACK: Record<string, string> = {
  "guacd.host": "127.0.0.1",
  "guacd.port": "4822",
  "guacd.client.host": "127.0.0.1:8082",
  "monitor.chart.maxPoints": "200",
};

const values = ref<Record<string, string>>({});
const loading = ref(false);
const saving = ref(false);

async function load(): Promise<void> {
  loading.value = true;
  try {
    // /map 返回 ReturnResult 信封（{code,msg,data}），unwrapResult 解出配置 Map
    const map = await http().get("/ms/server/config/map").then(r => unwrapResult<Record<string, unknown>>(r));
    const merged: Record<string, string> = {};
    for (const k of KEYS) {
      const v = map?.[k];
      // 键缺失（旧后端）→ 前端默认值；显式空串（guacd-client 留空=同域）保留不覆盖
      merged[k] = v == null ? FALLBACK[k] : String(v);
    }
    values.value = merged;
  } catch (e) {
    values.value = { ...FALLBACK };
    ElMessage.error(`加载失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}

/** 保存成功后后台重同步（不触发骨架屏闪烁） */
async function resync(): Promise<void> {
  try {
    const map = await http().get("/ms/server/config/map").then(r => unwrapResult<Record<string, unknown>>(r));
    for (const k of KEYS) {
      const v = map?.[k];
      if (v != null) values.value[k] = String(v);
    }
  } catch { /* 重同步失败不影响已保存结果 */ }
}

async function save(): Promise<void> {
  saving.value = true;
  try {
    const payload: Record<string, string> = {};
    for (const k of KEYS) {
      const v = values.value[k];
      if (v != null && v !== "") payload[k] = String(v);
    }
    await http().post("/ms/server/config").data(payload);
    ElMessage.success("系统配置已保存（即时生效——无需重启）");
    await resync();
  } catch (e) {
    ElMessage.error(`保存失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
}

/** guacd-client 当前生效模式（自定义网关 / 同域直连） */
const clientMode = (c: ConfigCard): string => {
  const v = c.items.find(i => i.key === "guacd.client.host");
  if (!v) return "";
  return values.value[v.key]?.trim() ? "自定义网关" : "同域直连";
};

onMounted(load);
</script>

<template>
  <div class="sc tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统配置</h1>
        <p class="page-desc">系统级配置 · 在离线/采集/Agent/远控为主机级配置，请在「主机资产」中按主机维护</p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
        <ReButton icon="Check" :show-text="true" type="primary" size="small" :loading="saving" @click="save">保存</ReButton>
      </div>
    </div>

    <ReSkeleton :loading="loading" :rows="3" animated>
      <div class="sc-groups">
        <ReCard v-for="c in CARDS" :key="c.key" :radius="12" shadow="never" class="sc-card">
          <template #header>
            <div class="sc-card-head">
              <div class="sc-tile"><ReIcon :name="c.icon" :size="15" /></div>
              <div class="sc-tt">
                <b class="sc-tt-name">{{ c.title }}</b>
                <span class="sc-tt-desc">{{ c.desc }}</span>
              </div>
              <div class="sc-live"><ReStatusIndicator type="success" :pulse="true" /><span>生效中</span></div>
            </div>
          </template>
          <div class="sc-fields">
            <label v-for="it in c.items" :key="it.key" class="sc-field">
              <span class="sc-label">
                {{ it.label }}
                <ReTag
                  v-if="it.key === 'guacd.client.host'"
                  :type="values[it.key]?.trim() ? 'primary' : 'info'"
                  size="small"
                  effect="light"
                  class="sc-mode-tag"
                >{{ clientMode(c) }}</ReTag>
              </span>
              <ReInput v-if="it.type === 'text'" v-model="values[it.key]" :placeholder="it.placeholder" class="sc-mono" style="width:100%" />
              <ReInputNumber v-else v-model="values[it.key]" :min="0" :max="65535" controls-position="right" class="sc-mono" style="width:100%" />
              <div v-if="it.hint" class="sc-hint">{{ it.hint }}</div>
            </label>
          </div>
          <div class="sc-foot">
            <span class="sc-consumer">{{ c.consumer }}</span>
            <span class="sc-effect"><ReIcon name="Lightning" :size="12" />即时生效</span>
          </div>
        </ReCard>
      </div>
    </ReSkeleton>
  </div>
</template>

<style scoped lang="scss">
/* 一行 3 列 ReCard */
.sc-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
@media (max-width: 1100px) {
  .sc-groups { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 760px) {
  .sc-groups { grid-template-columns: 1fr; }
}

.sc-card {
  position: relative;
  transition: box-shadow 0.2s var(--ease-out, ease), border-color 0.15s var(--ease-out, ease), transform 0.2s var(--ease-out, ease);
  animation: scCardIn 0.24s var(--ease-out, ease) both;
  &:nth-child(2) { animation-delay: 0.05s; }
  &:hover {
    box-shadow: var(--shadow-2);
    border-color: var(--border-default);
    transform: translateY(-1px);
  }
  :deep(.el-card__header) { padding: 14px 16px; }
  :deep(.el-card__body) { padding: 16px; }
}
@keyframes scCardIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}

/* 卡片头：图标磁贴 + 标题/描述 + 生效状态 */
.sc-card-head { display: flex; align-items: center; gap: 10px; }
.sc-tile {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: 8px;
  background: var(--brand-50);
  color: var(--brand-600);
  box-shadow: inset 0 0 0 1px var(--brand-100);
}
.sc-tt { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.sc-tt-name { font-size: 14px; font-weight: 600; }
.sc-tt-desc {
  font-size: 11.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sc-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--status-online);
  flex: none;
}

/* 字段区：label 包裹控件（可访问性隐式关联）+ 等宽输入 */
.sc-field {
  display: block;
  cursor: default;
  & + .sc-field { margin-top: 14px; }
}
.sc-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}
.sc-mode-tag { margin-left: 2px; }
.sc-mono {
  :deep(.el-input__inner),
  :deep(.el-input-number) {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 13px;
  }
  /* 数字框与文本框统一 34px 高度 */
  :deep(.el-input-number) { --el-input-number-height: 34px; }
}
.sc-hint {
  margin-top: 6px;
  font-size: 11.5px;
  color: var(--text-tertiary);
}

/* 卡片脚注：消费方说明 + 即时生效 */
.sc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.sc-effect {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  color: var(--brand-600);
  font-weight: 500;
}

/* 动效降级：尊重系统减少动效设置 */
@media (prefers-reduced-motion: reduce) {
  .sc-card {
    animation: none;
    transition: none;
    &:hover { transform: none; }
  }
}
</style>
