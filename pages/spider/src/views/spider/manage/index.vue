<template>
  <section class="spider-manage">
    <div class="spider-manage__toolbar">
      <div class="spider-manage__summary">
        <strong>{{ spiders.length }}</strong>
        <span>当前爬虫</span>
      </div>
      <div class="spider-manage__actions">
        <button type="button" class="is-secondary" @click="loadDefinitions">刷新</button>
        <button type="button" @click="openCreateDialog">新增爬虫</button>
      </div>
    </div>

    <div v-if="errorMessage" class="spider-manage__error">{{ errorMessage }}</div>

    <div v-if="loading" class="spider-manage__state">加载中...</div>

    <div v-else-if="spiders.length" class="spider-manage__table">
      <div class="spider-manage__head">
        <span>名称</span>
        <span>主体网站</span>
        <span>主入口</span>
        <span>执行器</span>
        <span>轮次</span>
        <span>深采集</span>
        <span>失败通知</span>
        <span>状态</span>
        <span>操作</span>
      </div>

      <article v-for="item in spiders" :key="item.spiderCode" class="spider-manage__row">
        <div class="cell cell--title">
          <strong>{{ item.spiderName }}</strong>
          <small>{{ item.spiderCode }}</small>
        </div>
        <div class="cell">{{ item.spiderSiteHost || "-" }}</div>
        <div class="cell cell--url" :title="item.spiderEntryUrl">{{ item.spiderEntryUrl }}</div>
        <div class="cell">{{ item.spiderExecutorType }}</div>
        <div class="cell">{{ item.spiderExecutorRounds || 1 }}</div>
        <div class="cell">{{ toEnabledText(item.spiderCollectDeepUrl) }}</div>
        <div class="cell">{{ toEnabledText(item.spiderNotifyOnFailure) }}</div>
        <div class="cell">
          <span class="status-pill" :class="{ 'is-enabled': isEnabled(item.spiderStatus) }">
            {{ isEnabled(item.spiderStatus) ? "启用" : "停用" }}
          </span>
        </div>
        <div class="cell cell--actions">
          <button type="button" @click="openEditDialog(item)">编辑</button>
          <button type="button" @click="toggleStatus(item)">
            {{ isEnabled(item.spiderStatus) ? "禁用" : "启用" }}
          </button>
          <button type="button" @click="removeDefinition(item.spiderCode)">删除</button>
          <button type="button" class="is-primary" @click="openOrchestration(item)">编排</button>
        </div>
      </article>
    </div>

    <div v-else class="spider-manage__state">暂无爬虫定义</div>

    <div v-if="dialogVisible" class="spider-dialog__mask" @click.self="closeDialog">
      <section class="spider-dialog">
        <header class="spider-dialog__head">
          <strong>{{ dialogMode === "create" ? "新增爬虫" : "编辑爬虫" }}</strong>
          <button type="button" @click="closeDialog">关闭</button>
        </header>

        <div class="spider-dialog__grid">
          <label>
            <span>编码</span>
            <input v-model.trim="form.spiderCode" :disabled="dialogMode === 'edit'" type="text" />
          </label>
          <label>
            <span>名称</span>
            <input v-model.trim="form.spiderName" type="text" />
          </label>
          <label>
            <span>主体网站</span>
            <input v-model.trim="form.spiderSiteHost" type="text" />
          </label>
          <label>
            <span>主入口</span>
            <input v-model.trim="form.spiderEntryUrl" type="text" />
          </label>
          <label>
            <span>执行器</span>
            <select v-model="form.spiderExecutorType">
              <option value="ONCE">ONCE</option>
              <option value="N_TIMES">N_TIMES</option>
              <option value="CRON">CRON</option>
            </select>
          </label>
          <label>
            <span>轮次</span>
            <input v-model.number="form.spiderExecutorRounds" type="number" min="1" />
          </label>
          <label>
            <span>去重策略</span>
            <select v-model="form.spiderDedupStrategy">
              <option value="URL_FINGERPRINT">URL_FINGERPRINT</option>
              <option value="NORMALIZED_URL">NORMALIZED_URL</option>
              <option value="CONTENT_FINGERPRINT">CONTENT_FINGERPRINT</option>
              <option value="CUSTOM">CUSTOM</option>
            </select>
          </label>
          <label>
            <span>URL 存储</span>
            <select v-model="form.spiderUrlStorageType">
              <option value="DATABASE">DATABASE</option>
              <option value="REDIS">REDIS</option>
              <option value="SPI">SPI</option>
            </select>
          </label>
          <label class="is-switch">
            <span>深度采集</span>
            <input v-model="form.spiderCollectDeepUrl" type="checkbox" />
          </label>
          <label class="is-switch">
            <span>失败通知</span>
            <input v-model="form.spiderNotifyOnFailure" type="checkbox" />
          </label>
          <label class="is-switch">
            <span>状态</span>
            <input v-model="form.spiderStatus" type="checkbox" />
          </label>
        </div>

        <footer class="spider-dialog__actions">
          <button type="button" class="is-secondary" @click="closeDialog">取消</button>
          <button type="button" :disabled="submitting" @click="submitForm">
            {{ submitting ? "提交中..." : "保存" }}
          </button>
        </footer>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  createSpiderDefinition,
  deleteSpiderDefinition,
  listSpiderDefinitions,
  updateSpiderDefinition,
  updateSpiderDefinitionStatus,
} from "../../../api/spider";
import type { SpiderDefinition } from "../../../types/orchestration";

type DialogMode = "create" | "edit";

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const spiders = ref<SpiderDefinition[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const editingCode = ref("");

const createEmptyForm = () => ({
  spiderCode: "",
  spiderName: "",
  spiderEntryUrl: "",
  spiderSiteHost: "",
  spiderExecutorType: "ONCE" as SpiderDefinition["spiderExecutorType"],
  spiderExecutorRounds: 1,
  spiderCollectDeepUrl: true,
  spiderNotifyOnFailure: true,
  spiderDedupStrategy: "URL_FINGERPRINT" as SpiderDefinition["spiderDedupStrategy"],
  spiderUrlStorageType: "DATABASE" as SpiderDefinition["spiderUrlStorageType"],
  spiderUrlStorageSpi: "",
  spiderStatus: true,
});

const form = ref(createEmptyForm());

const isEnabled = (status: SpiderDefinition["spiderStatus"]) =>
  status === "ENABLED" || status === 1;

const toEnabledText = (value: boolean | number | undefined) =>
  value === true || value === 1 ? "开启" : "关闭";

const toPayload = (): SpiderDefinition => ({
  spiderCode: form.value.spiderCode,
  spiderName: form.value.spiderName,
  spiderEntryUrl: form.value.spiderEntryUrl,
  spiderSiteHost: form.value.spiderSiteHost,
  spiderExecutorType: form.value.spiderExecutorType,
  spiderExecutorRounds: Number(form.value.spiderExecutorRounds || 1),
  spiderCollectDeepUrl: form.value.spiderCollectDeepUrl ? 1 : 0,
  spiderNotifyOnFailure: form.value.spiderNotifyOnFailure ? 1 : 0,
  spiderDedupStrategy: form.value.spiderDedupStrategy,
  spiderUrlStorageType: form.value.spiderUrlStorageType,
  spiderUrlStorageSpi: form.value.spiderUrlStorageSpi || undefined,
  spiderStatus: form.value.spiderStatus ? 1 : 0,
});

const loadDefinitions = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    spiders.value = await listSpiderDefinitions();
  } catch (error) {
    errorMessage.value = `爬虫定义接口失败：${String(error)}`;
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  dialogMode.value = "create";
  editingCode.value = "";
  form.value = createEmptyForm();
  dialogVisible.value = true;
};

const openEditDialog = (item: SpiderDefinition) => {
  dialogMode.value = "edit";
  editingCode.value = item.spiderCode;
  form.value = {
    spiderCode: item.spiderCode,
    spiderName: item.spiderName,
    spiderEntryUrl: item.spiderEntryUrl,
    spiderSiteHost: item.spiderSiteHost,
    spiderExecutorType: item.spiderExecutorType,
    spiderExecutorRounds: item.spiderExecutorRounds || 1,
    spiderCollectDeepUrl: item.spiderCollectDeepUrl === true || item.spiderCollectDeepUrl === 1,
    spiderNotifyOnFailure: item.spiderNotifyOnFailure === true || item.spiderNotifyOnFailure === 1,
    spiderDedupStrategy: item.spiderDedupStrategy,
    spiderUrlStorageType: item.spiderUrlStorageType,
    spiderUrlStorageSpi: item.spiderUrlStorageSpi || "",
    spiderStatus: isEnabled(item.spiderStatus),
  };
  dialogVisible.value = true;
};

const closeDialog = () => {
  dialogVisible.value = false;
  submitting.value = false;
};

const submitForm = async () => {
  if (!form.value.spiderCode || !form.value.spiderName || !form.value.spiderEntryUrl) {
    errorMessage.value = "编码、名称、主入口不能为空";
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const payload = toPayload();
    if (dialogMode.value === "create") {
      await createSpiderDefinition(payload);
    } else {
      await updateSpiderDefinition(editingCode.value, payload);
    }
    closeDialog();
    await loadDefinitions();
  } catch (error) {
    errorMessage.value = `保存爬虫失败：${String(error)}`;
  } finally {
    submitting.value = false;
  }
};

const removeDefinition = async (spiderCode: string) => {
  if (!window.confirm(`确认删除 ${spiderCode} 吗？`)) {
    return;
  }
  try {
    await deleteSpiderDefinition(spiderCode);
    await loadDefinitions();
  } catch (error) {
    errorMessage.value = `删除失败：${String(error)}`;
  }
};

const toggleStatus = async (item: SpiderDefinition) => {
  try {
    await updateSpiderDefinitionStatus(item.spiderCode, isEnabled(item.spiderStatus) ? 0 : 1);
    await loadDefinitions();
  } catch (error) {
    errorMessage.value = `状态更新失败：${String(error)}`;
  }
};

const openOrchestration = (item: SpiderDefinition) => {
  const params = new URLSearchParams();
  params.set("spiderTab", "orchestration");
  if (item.spiderId !== undefined && item.spiderId !== null) {
    params.set("spiderId", String(item.spiderId));
  }
  params.set("spiderCode", item.spiderCode);
  const targetUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  window.open(targetUrl, "_blank", "noopener,noreferrer");
};

onMounted(() => {
  loadDefinitions();
});
</script>

<style scoped lang="scss">
.spider-manage {
  min-height: 100%;
  padding: 10px;
  display: grid;
  gap: 10px;
  background: #f3f5f7;
}

.spider-manage__toolbar,
.spider-manage__error,
.spider-manage__state,
.spider-manage__table,
.spider-dialog {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
}

.spider-manage__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.spider-manage__summary {
  display: flex;
  align-items: baseline;
  gap: 8px;

  strong {
    color: #0f172a;
    font-size: 22px;
    line-height: 1;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.spider-manage__actions {
  display: flex;
  gap: 8px;

  button {
    height: 30px;
    padding: 0 12px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: #0f172a;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
  }

  .is-secondary {
    background: #fff;
    color: #334155;
  }
}

.spider-manage__table {
  overflow: hidden;
}

.spider-manage__head,
.spider-manage__row {
  display: grid;
  grid-template-columns: 180px 120px minmax(220px, 1.4fr) 90px 72px 72px 84px 72px 180px;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
}

.spider-manage__head {
  border-bottom: 1px solid #eef2f7;
  background: #f8fafc;

  span {
    color: #64748b;
    font-size: 11px;
    font-weight: 600;
  }
}

.spider-manage__row + .spider-manage__row {
  border-top: 1px solid #f1f5f9;
}

.cell {
  color: #334155;
  font-size: 12px;
  min-width: 0;
}

.cell--title {
  display: grid;
  gap: 2px;

  strong {
    color: #0f172a;
    font-size: 13px;
    line-height: 1.2;
  }

  small {
    color: #94a3b8;
    font-size: 10px;
  }
}

.cell--url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell--actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;

  button {
    height: 28px;
    padding: 0 8px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }

  .is-primary {
    background: #0f172a;
    border-color: #0f172a;
    color: #fff;
  }
}

.status-pill {
  display: inline-flex;
  height: 22px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 11px;
  font-weight: 600;

  &.is-enabled {
    background: #dcfce7;
    color: #15803d;
  }
}

.spider-manage__error,
.spider-manage__state {
  padding: 14px;
  color: #64748b;
  font-size: 12px;
}

.spider-manage__error {
  color: #c2410c;
  background: #fff7ed;
}

.spider-dialog__mask {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.32);
  z-index: 1000;
}

.spider-dialog {
  width: min(860px, 100%);
  padding: 14px;
}

.spider-dialog__head,
.spider-dialog__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.spider-dialog__head {
  margin-bottom: 12px;

  strong {
    color: #0f172a;
    font-size: 14px;
  }

  button {
    height: 28px;
    padding: 0 10px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    cursor: pointer;
    font-size: 12px;
  }
}

.spider-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.spider-dialog__grid label {
  display: grid;
  gap: 4px;

  span {
    color: #64748b;
    font-size: 11px;
  }

  input,
  select {
    width: 100%;
    height: 34px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    padding: 0 10px;
    background: #fff;
    color: #0f172a;
    font-size: 12px;
  }
}

.spider-dialog__grid .is-switch {
  grid-template-columns: 1fr auto;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #f8fafc;

  input {
    width: 16px;
    height: 16px;
    padding: 0;
  }
}

.spider-dialog__actions {
  margin-top: 12px;
  justify-content: flex-end;

  button {
    height: 32px;
    padding: 0 12px;
    border: 1px solid #dbe3ee;
    border-radius: 8px;
    background: #0f172a;
    color: #fff;
    cursor: pointer;
    font-size: 12px;
  }

  .is-secondary {
    background: #fff;
    color: #334155;
  }
}

@media (max-width: 1400px) {
  .spider-manage__table {
    overflow-x: auto;
  }

  .spider-manage__head,
  .spider-manage__row {
    min-width: 1160px;
  }
}

@media (max-width: 720px) {
  .spider-manage {
    padding: 8px;
  }

  .spider-manage__toolbar,
  .spider-dialog__grid {
    grid-template-columns: 1fr;
  }

  .spider-manage__toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .spider-manage__actions,
  .spider-dialog__actions {
    flex-wrap: wrap;
  }

  .spider-dialog__grid {
    display: grid;
  }
}
</style>
