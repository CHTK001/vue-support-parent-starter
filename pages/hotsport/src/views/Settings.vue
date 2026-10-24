<template>
  <div class="view">
    <div class="view-toolbar">
      <div class="toolbar-left">
        <span class="section-label">接口设置</span>
        <ReTag :type="info && info.available ? 'success' : 'warning'" round>
          {{ info ? `数据源 ${info.mode}` : "未连接" }}
        </ReTag>
        <span class="match-hint" v-if="info">{{ info.reason }}</span>
      </div>
      <div class="toolbar-right">
        <ReButton icon="Refresh" show-text :loading="probing" @click="probe">重新检测</ReButton>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <span>观测接口地址</span>
        <span class="panel-sub">所有页面的数据都从这里取</span>
      </div>

      <div class="setting-row">
        <ReInput
          id="apm-api-base"
          v-model="draftBase"
          placeholder="留空表示与当前页面同源，例如 http://10.0.0.8:19170"
          clearable
          class="grow"
        />
        <ReButton show-text :disabled="saving" @click="save">保存并重连</ReButton>
        <ReButton show-text type="info" :disabled="saving" @click="reset">恢复默认</ReButton>
      </div>

      <p class="setting-hint">
        只填源地址（协议 + 主机 + 端口），不要带 <code>{{ APM_PREFIX }}</code> 前缀 ——
        前缀由页面统一拼接。同源时由平台网关转发，跨域直连需要后端放开 CORS。
      </p>

      <div class="setting-facts">
        <div class="fact">
          <span class="fact-label">当前地址</span>
          <code>{{ displayBase }}</code>
        </div>
        <div class="fact">
          <span class="fact-label">请求前缀</span>
          <code>{{ APM_PREFIX }}</code>
        </div>
        <div class="fact">
          <span class="fact-label">实时通道</span>
          <code>{{ displayWs }}</code>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <span>数据源探测</span>
        <span class="panel-sub">后端按 auto 顺序探测，全部不可用时降级为 none（返回空数据）</span>
      </div>

      <ReSkeleton v-if="probing && !info" :loading="true" :rows="3" animated />
      <div class="panel-empty" v-else-if="!info">
        无法连接观测接口<br />请检查上面的地址是否正确，或后端是否已启动
      </div>
      <table class="candidate-table" v-else>
        <thead>
          <tr>
            <th>数据源</th>
            <th>状态</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in info.candidates" :key="c.name">
            <td>{{ c.name }}</td>
            <td>
              <ReTag :type="c.available ? 'success' : 'info'" round>
                {{ c.available ? "可用" : "不可用" }}
              </ReTag>
            </td>
            <td class="muted">{{ c.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReInput from "@repo/ui/re-input";
import ReSkeleton from "@repo/ui/re-skeleton";
import { message } from "@repo/core";
import { APM_PREFIX, getApiBase, resetApiBase, setApiBase, wsUrl } from "../config";

/**
 * 接口设置页：把 `config.ts` 里的运行时地址真正暴露给使用者。
 *
 * <p>地址存在 `localStorage`（键 `hotsport.api-base`），保存后立即重建 axios 实例
 * 并让实时通道重连，无需刷新页面、也无需重新构建。留空 = 同源。</p>
 */

const draftBase = ref(getApiBase());
const info = ref<ApmProviderInfo | null>(null);
const probing = ref(false);
const saving = ref(false);

/** 当前生效地址（空串显示为「同源」） */
const displayBase = computed(() => getApiBase() || "同源（跟随当前页面）");

/** WebSocket 地址，同样受地址设置影响 */
const displayWs = computed(() => wsUrl());

/**
 * 探测后端数据源：成功后把结果渲染到候选表。
 *
 * @param quiet 为 true 时不弹成功提示（用于页面首次加载）
 */
async function probe(quiet = false): Promise<void> {
  probing.value = true;
  try {
    info.value = await getProvider();
    if (!quiet) {
      message.success(`连接正常，数据源 ${info.value.mode}`);
    }
  } catch (error) {
    info.value = null;
    if (!quiet) {
      message.error(`连接失败：${(error as Error)?.message || "无法访问观测接口"}`);
    }
  } finally {
    probing.value = false;
  }
}

/** 保存地址：写入本地、重建客户端、重连实时通道，然后重新探测 */
async function save(): Promise<void> {
  const next = draftBase.value.trim();
  if (next && !/^https?:\/\//i.test(next)) {
    message.warning("地址需要以 http:// 或 https:// 开头；留空表示同源");
    return;
  }
  saving.value = true;
  try {
    setApiBase(next);
    draftBase.value = getApiBase();
    resetApiClient();
    await probe(true);
    message.success(`已切换到 ${displayBase.value}`);
  } finally {
    saving.value = false;
  }
}

/** 恢复为构建期默认（同源或 VITE_HOTSPORT_BASE），并重新探测 */
async function reset(): Promise<void> {
  saving.value = true;
  try {
    resetApiBase();
    draftBase.value = getApiBase();
    resetApiClient();
    await probe(true);
    message.success(`已恢复默认：${displayBase.value}`);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void probe(true);
});
</script>

<script lang="ts">
import type { ApmProviderInfo } from "../api/apmApi";
import { getProvider, resetApiClient } from "../api/apmApi";
</script>

<style scoped>
.setting-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.setting-row .grow {
  flex: 1;
}

.setting-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--apm-muted);
}

.setting-hint code {
  padding: 0 4px;
  border-radius: var(--apm-radius-sm);
  background: var(--apm-panel-raised);
}

.setting-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--apm-border);
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fact-label {
  font-size: 12px;
  color: var(--apm-muted);
}

.fact code {
  font-size: 12px;
  word-break: break-all;
}

.candidate-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.candidate-table th,
.candidate-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--apm-border);
}

.candidate-table th {
  font-weight: 500;
  color: var(--apm-muted);
}

.candidate-table tbody tr:last-child td {
  border-bottom: none;
}
</style>
