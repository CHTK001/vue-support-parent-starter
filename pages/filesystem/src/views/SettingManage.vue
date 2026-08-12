<script setup lang="ts">
/**
 * 存储配置页
 *
 * 文件系统全局配置编辑 + HTTP 文件服务器启停/状态/端口检查
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Check, SwitchButton, VideoPlay } from "@element-plus/icons-vue";
import {
  checkFileServerPort,
  getFileServerStatus,
  getFileSetting,
  startFileServer,
  stopFileServer,
  updateFileSetting,
} from "../api/filesystemApi";
import type { SysFileSystemSetting } from "../api/types";

const form = ref<SysFileSystemSetting>({});
const loading = ref(false);
const saving = ref(false);

/* HTTP 服务器 */
const serverStatus = ref<"running" | "stopped" | "">("");
const serverBusy = ref(false);

const serverStatusText = {
  running: { label: "运行中", type: "success" as const },
  stopped: { label: "已停止", type: "info" as const },
  "": { label: "未知", type: "warning" as const },
};

async function loadSetting() {
  loading.value = true;
  try {
    const res = await getFileSetting();
    const s = (res?.data ?? {}) as SysFileSystemSetting;
    form.value = { ...s };
    await loadServerStatus();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载配置失败");
  } finally {
    loading.value = false;
  }
}

async function loadServerStatus() {
  try {
    const res = await getFileServerStatus();
    serverStatus.value = (String(res?.data ?? "") === "running" ? "running" : "stopped") as "running" | "stopped";
  } catch {
    serverStatus.value = "";
  }
}

async function handleSave() {
  if (!form.value.sysFileSystemSettingName) {
    form.value.sysFileSystemSettingName = "文件系统配置";
  }
  saving.value = true;
  try {
    const res = await updateFileSetting(form.value);
    if (res?.data) {
      ElMessage.success("保存成功");
    } else {
      ElMessage.error(res?.msg || "保存失败");
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleStartServer() {
  serverBusy.value = true;
  try {
    const res = await startFileServer();
    if (res?.data) {
      ElMessage.success("文件服务器已启动");
      await loadServerStatus();
    } else {
      ElMessage.error(res?.msg || "启动失败");
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "启动失败");
  } finally {
    serverBusy.value = false;
  }
}

async function handleStopServer() {
  serverBusy.value = true;
  try {
    const res = await stopFileServer();
    if (res?.data) {
      ElMessage.success("文件服务器已停止");
      await loadServerStatus();
    } else {
      ElMessage.error(res?.msg || "停止失败");
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "停止失败");
  } finally {
    serverBusy.value = false;
  }
}

async function handleCheckPort() {
  const port = form.value.sysFileSystemSettingHttpServerPort;
  if (!port) {
    ElMessage.warning("请先填写 HTTP 服务端口");
    return;
  }
  try {
    const res = await checkFileServerPort(port);
    ElMessage.info(res?.data ? `端口 ${port} 可用` : `端口 ${port} 已被占用`);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "端口检查失败");
  }
}

onMounted(loadSetting);
</script>

<template>
  <div class="filesystem-page">
    <div class="filesystem-page__header">
      <div>
        <h2 class="filesystem-page__title">存储配置</h2>
        <p class="filesystem-page__subtitle">文件系统全局参数与 HTTP 文件服务器管理</p>
      </div>
      <ReButton layout="modern" type="primary" icon="Check" :loading="saving" @click="handleSave">保存配置</ReButton>
    </div>

    <div class="fs-server-card" :class="`fs-server-card--${serverStatus}`">
      <div class="fs-server-info">
        <div class="fs-server-title">
          <span class="fs-server-dot"></span>
          <span>HTTP 文件服务器</span>
        </div>
        <div class="fs-server-desc">
          状态：<span class="fs-server-status">{{ serverStatusText[serverStatus].label }}</span>
          <template v-if="serverStatus === 'running' && form.sysFileSystemSettingHttpServerHost">
            · {{ form.sysFileSystemSettingHttpServerHost }}:{{ form.sysFileSystemSettingHttpServerPort || "8888" }}{{ form.sysFileSystemSettingHttpServerContext || "/file" }}
          </template>
        </div>
      </div>
      <div class="fs-server-actions">
        <ReButton
          layout="modern"
          :icon="Check"
          :loading="serverBusy"
          :disabled="serverStatus === 'running'"
          @click="handleCheckPort"
        >检查端口</ReButton>
        <ReButton
          layout="modern"
          type="success"
          :icon="VideoPlay"
          :loading="serverBusy"
          :disabled="serverStatus === 'running'"
          @click="handleStartServer"
        >启动</ReButton>
        <ReButton
          layout="modern"
          type="warning"
          :icon="SwitchButton"
          :loading="serverBusy"
          :disabled="serverStatus !== 'running'"
          @click="handleStopServer"
        >停止</ReButton>
      </div>
    </div>

    <el-card shadow="never" class="filesystem-page__card" v-loading="loading">
      <el-form :model="form" label-width="140px" class="fs-setting-form">
        <el-divider content-position="left">基础设置</el-divider>
        <el-form-item label="配置名称">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingName" placeholder="文件系统配置" />
        </el-form-item>
        <el-form-item label="默认存储类型">
          <ReSelect
            layout="modern"
            v-model="form.sysFileSystemSettingDefaultStorageType"
            :data="[
              { label: '本地', value: 'local' },
              { label: '文件系统', value: 'FILESYSTEM' },
              { label: 'OSS', value: 'oss' },
              { label: 'COS', value: 'cos' },
              { label: 'S3', value: 's3' },
            ]"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="存储根路径">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingStorageRootPath" placeholder="./files" />
        </el-form-item>
        <el-form-item label="临时路径">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingTempPath" placeholder="./temp/filesystem" />
        </el-form-item>
        <el-form-item label="文件保留天数">
          <ReInputNumber layout="modern" v-model="form.sysFileSystemSettingRetentionDays" :min="0" placeholder="0 表示永久保留" />
        </el-form-item>
        <el-form-item label="单文件最大大小(MB)">
          <ReInputNumber layout="modern" v-model="form.sysFileSystemSettingMaxFileSizeMb" :min="1" />
        </el-form-item>
        <el-form-item label="允许的文件类型">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingAllowedTypes" placeholder="逗号分隔，留空表示全部允许" />
        </el-form-item>

        <el-divider content-position="left">分片上传</el-divider>
        <el-form-item label="启用分片上传">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingChunkEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingChunkEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="分片大小(MB)">
          <ReInputNumber layout="modern" v-model="form.sysFileSystemSettingChunkSizeMb" :min="1" :disabled="!form.sysFileSystemSettingChunkEnabled" />
        </el-form-item>
        <el-form-item label="自动合并">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingAutoMergeEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingAutoMergeEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="合并任务限制">
          <ReInputNumber layout="modern" v-model="form.sysFileSystemSettingMergeTaskLimit" :min="1" />
        </el-form-item>
        <el-form-item label="支持手动合并">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingManualMergeEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingManualMergeEnabled = v)"
          />
        </el-form-item>

        <el-divider content-position="left">HTTP 服务</el-divider>
        <el-form-item label="启用 HTTP 服务">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingHttpServerEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingHttpServerEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="HTTP 端口">
          <ReInputNumber layout="modern" v-model="form.sysFileSystemSettingHttpServerPort" :min="1" :max="65535" :disabled="!form.sysFileSystemSettingHttpServerEnabled" />
        </el-form-item>
        <el-form-item label="HTTP 主机">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingHttpServerHost" placeholder="0.0.0.0" :disabled="!form.sysFileSystemSettingHttpServerEnabled" />
        </el-form-item>
        <el-form-item label="上下文路径">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingHttpServerContext" placeholder="/file" :disabled="!form.sysFileSystemSettingHttpServerEnabled" />
        </el-form-item>
        <el-form-item label="访问域名">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingHttpAccessDomain" placeholder="可选，限制跨域访问域名" />
        </el-form-item>

        <el-divider content-position="left">功能开关</el-divider>
        <el-form-item label="启用文件下载">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingDownloadEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingDownloadEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="启用文件预览">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingPreviewEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingPreviewEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="启用视图预览">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingViewEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingViewEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="Webjar 支持">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingWebjarEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingWebjarEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="远程文件支持">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingRemoteFileEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingRemoteFileEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="启用该配置">
          <ReSwitch
            layout="modern"
            :model-value="!!form.sysFileSystemSettingEnabled"
            @update:model-value="(v: boolean) => (form.sysFileSystemSettingEnabled = v)"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysFileSystemSettingRemark" type="textarea" placeholder="配置备注说明" />
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.fs-server-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.fs-server-card--running {
  border-color: color-mix(in srgb, var(--el-color-success) 40%, transparent);
}

.fs-server-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fs-server-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-server-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-secondary);
}

.fs-server-card--running .fs-server-dot {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent);
  animation: fsPulse 2s infinite;
}

@keyframes fsPulse {
  0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent); }
  50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--el-color-success) 6%, transparent); }
}

.fs-server-desc {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.fs-server-status {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.fs-server-card--running .fs-server-status {
  color: var(--el-color-success);
}

.fs-server-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.fs-setting-form :deep(.el-form-item__label) {
  color: var(--el-text-color-regular);
}
</style>