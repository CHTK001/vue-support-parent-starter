<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { getServerConfig, saveServerConfig } from '../api';

/**
 * 系统设置面板
 * 在离线检测 / 硬件采集 / Agent 推送 / 远控功能 / 连接缓存 等系统级配置。
 * 保存后后端发布配置变更事件，时间轮动态重排周期任务（无需重启）。
 */

/** 对话框可见性（v-model） */
const visible = defineModel<boolean>({ required: true });

/** 保存完成事件 */
const emit = defineEmits<{ (e: 'saved'): void }>();

/** 配置表单 */
const form = reactive({
  'host.online.enabled': true,
  'host.online.interval': 60,
  'host.collect.enabled': false,
  'host.collect.mode': 'SCHEDULED',
  'host.collect.interval': 3600,
  'host.agent.enabled': false,
  'host.remote.enabled': true,
  'connection.sweep.interval': 60,
  'connection.idle.timeout': 300,
});

/** 采集方式选项 */
const collectModes = [
  { value: 'SCHEDULED', label: '定时 SSH 采集' },
  { value: 'AGENT', label: 'Agent 主动上报' },
  { value: 'HTTP', label: 'HTTP 接口拉取' },
  { value: 'PROMETHEUS', label: 'Prometheus 拉取' },
];

/** 加载态 */
const loading = ref(false);
const saving = ref(false);

/**
 * 加载系统配置
 */
async function loadConfig(): Promise<void> {
  loading.value = true;
  try {
    const cfg = await getServerConfig();
    if (!cfg) return;
    Object.keys(form).forEach((key) => {
      if (cfg[key] !== undefined && cfg[key] !== null) {
        (form as Record<string, any>)[key] = cfg[key];
      }
    });
  } catch (e) {
    ElMessage.error((e as Error).message || '加载系统配置失败');
  } finally {
    loading.value = false;
  }
}

/** 打开时加载 */
onMounted(() => {
  watch(
    visible,
    (show) => {
      if (show) loadConfig();
    },
    { immediate: false },
  );
});

/**
 * 保存配置
 */
async function onSave(): Promise<void> {
  saving.value = true;
  try {
    // 数值字段转数字
    const payload: Record<string, unknown> = {};
    Object.keys(form).forEach((key) => {
      let val = (form as Record<string, any>)[key];
      if (typeof val === 'string' && key.includes('interval') || key.includes('timeout')) {
        val = Number(val) || 0;
      }
      payload[key] = val;
    });
    await saveServerConfig(payload);
    ElMessage.success('系统设置已保存，周期任务已动态调整');
    emit('saved');
    visible.value = false;
  } catch (e) {
    ElMessage.error((e as Error).message || '保存失败');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="系统设置"
    width="560px"
    append-to-body
  >
    <el-form v-loading="loading" label-width="180px" label-position="left">
      <!-- 在离线检测 -->
      <el-divider content-position="left">在离线检测</el-divider>
      <el-form-item label="启用自动检测">
        <el-switch v-model="form['host.online.enabled']" />
      </el-form-item>
      <el-form-item label="检测间隔(秒)">
        <el-input-number v-model="form['host.online.interval']" :min="5" :max="86400" style="width: 180px" />
      </el-form-item>

      <!-- 硬件采集 -->
      <el-divider content-position="left">硬件采集</el-divider>
      <el-form-item label="启用定时采集">
        <el-switch v-model="form['host.collect.enabled']" />
      </el-form-item>
      <el-form-item label="采集方式">
        <el-select v-model="form['host.collect.mode']" style="width: 220px">
          <el-option v-for="m in collectModes" :key="m.value" :label="m.label" :value="m.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="采集间隔(秒)">
        <el-input-number v-model="form['host.collect.interval']" :min="10" :max="86400" style="width: 180px" />
      </el-form-item>

      <!-- Agent -->
      <el-divider content-position="left">Agent 推送</el-divider>
      <el-form-item label="启用 Agent 上报">
        <el-switch v-model="form['host.agent.enabled']" />
      </el-form-item>

      <!-- 远控 -->
      <el-divider content-position="left">远控功能</el-divider>
      <el-form-item label="启用远控">
        <el-switch v-model="form['host.remote.enabled']" />
      </el-form-item>

      <!-- 连接缓存 -->
      <el-divider content-position="left">连接缓存</el-divider>
      <el-form-item label="健康检查间隔(秒)">
        <el-input-number v-model="form['connection.sweep.interval']" :min="5" :max="3600" style="width: 180px" />
      </el-form-item>
      <el-form-item label="空闲超时(秒)">
        <el-input-number v-model="form['connection.idle.timeout']" :min="10" :max="86400" style="width: 180px" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="onSave">保存</el-button>
    </template>
  </el-dialog>
</template>
