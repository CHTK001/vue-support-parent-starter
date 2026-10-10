<script setup lang="ts">
/**
 * 设置页
 *
 * 读写后端 /v1/geo/settings：
 *   - 天地图 Token
 *   - 代理（启用 / URL）
 *   - 下载默认值（并发 / 缩放 / 格式）
 *   - 证书与缓存
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { ref, onMounted, watch } from "vue";

import { useSettingsStore } from "@/store/settings";
import { FORMAT_OPTIONS } from "@/constants/modes";
import type { AppSettings } from "@/types";

const settingsStore = useSettingsStore();

const form = ref<AppSettings>({
  tiandituToken: "",
  proxyEnabled: false,
  proxyUrl: "",
  defaultConcurrency: 8,
  defaultZoom: 14,
  defaultFormat: "geotiff",
  allowInvalidCerts: false,
  tileCacheEnabled: true,
  tileCacheMaxSizeMb: 2048,
});

const saving = ref(false);
const loaded = ref(false);

watch(
  () => settingsStore.settings,
  (s) => {
    if (s) {
      form.value = { ...form.value, ...s };
      loaded.value = true;
    }
  },
  { immediate: true, deep: true },
);

/** 从后端加载设置并同步到表单 */
async function load() {
  const s = await settingsStore.loadSettings();
  if (s) {
    form.value = { ...form.value, ...s };
    loaded.value = true;
  }
}

/** 保存设置到后端 */
async function onSave() {
  saving.value = true;
  try {
    await settingsStore.saveSettings(form.value);
    message.success("设置已保存");
  } catch (e: any) {
    message.error(`保存失败：${e?.message ?? e}`);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  if (!settingsStore.settings) load();
});
</script>

<template>
  <div class="settings-page">
    <el-card shadow="never" class="settings-card" v-loading="!loaded && settingsStore.loading">
      <template #header>
        <div class="card-head">
          <el-icon><Setting /></el-icon>
          <span>全局设置</span>
        </div>
      </template>

      <el-form label-width="140px" label-position="left" size="default">
        <el-divider content-position="left">数据源</el-divider>

        <el-form-item label="天地图 Token">
          <el-input v-model="form.tiandituToken" placeholder="天地图服务密钥（可选）" clearable show-password style="max-width: 420px" />
        </el-form-item>

        <el-divider content-position="left">网络代理</el-divider>

        <el-form-item label="启用代理">
          <el-switch v-model="form.proxyEnabled" />
        </el-form-item>
        <el-form-item label="代理地址">
          <el-input v-model="form.proxyUrl" placeholder="http://host:port" clearable :disabled="!form.proxyEnabled" style="max-width: 420px" />
        </el-form-item>

        <el-divider content-position="left">下载默认值</el-divider>

        <el-form-item label="默认并发数">
          <el-input-number v-model="form.defaultConcurrency" :min="1" :max="64" controls-position="right" />
        </el-form-item>
        <el-form-item label="默认缩放级别">
          <el-input-number v-model="form.defaultZoom" :min="1" :max="24" controls-position="right" />
        </el-form-item>
        <el-form-item label="默认输出格式">
          <el-select v-model="form.defaultFormat" style="max-width: 420px">
            <el-option v-for="f in FORMAT_OPTIONS" :key="f.value" :value="f.value" :label="f.label" />
          </el-select>
        </el-form-item>

        <el-divider content-position="left">高级</el-divider>

        <el-form-item label="允许无效证书">
          <el-switch v-model="form.allowInvalidCerts" />
          <div class="hint">自签名 / 过期证书场景建议开启</div>
        </el-form-item>
        <el-form-item label="瓦片缓存">
          <el-switch v-model="form.tileCacheEnabled" />
        </el-form-item>
        <el-form-item label="缓存上限 (MB)">
          <el-input-number v-model="form.tileCacheMaxSizeMb" :min="64" :max="65536" :step="128" controls-position="right" :disabled="!form.tileCacheEnabled" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="onSave">保存设置</el-button>
          <el-button @click="load">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.settings-page {
  height: calc(100vh - 128px);
  padding: 8px;
  overflow: auto;
}
.settings-card {
  max-width: 720px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}
.hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  width: 100%;
}
</style>