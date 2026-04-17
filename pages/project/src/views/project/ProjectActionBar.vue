<template>
  <div class="action-bar" @click.stop>
    <el-tooltip content="启动" placement="top">
      <ScButton
        circle size="small" type="success" plain
        :loading="loading === 'start'"
        :disabled="project.runtimeStatus === 'running'"
        @click="handleAction('start')"
      >
        <IconifyIconOnline icon="ep:video-play" />
      </ScButton>
    </el-tooltip>

    <el-tooltip content="停止" placement="top">
      <ScButton
        circle size="small" type="danger" plain
        :loading="loading === 'stop'"
        :disabled="project.runtimeStatus === 'stopped'"
        @click="handleAction('stop')"
      >
        <IconifyIconOnline icon="ep:video-pause" />
      </ScButton>
    </el-tooltip>

    <el-tooltip content="重启" placement="top">
      <ScButton
        circle size="small" type="warning" plain
        :loading="loading === 'restart'"
        @click="handleAction('restart')"
      >
        <IconifyIconOnline icon="ep:refresh-right" />
      </ScButton>
    </el-tooltip>

    <el-tooltip content="快照" placement="top">
      <ScButton
        circle size="small" plain
        :loading="loading === 'snapshot'"
        @click="handleAction('snapshot')"
      >
        <IconifyIconOnline icon="ri:camera-line" />
      </ScButton>
    </el-tooltip>

    <el-tooltip content="上传" placement="top">
      <ScButton circle size="small" plain @click="$emit('upload', project)">
        <IconifyIconOnline icon="ri:upload-cloud-line" />
      </ScButton>
    </el-tooltip>

    <el-tooltip content="升级（上传+重启）" placement="top">
      <ScButton circle size="small" type="primary" plain @click="$emit('upgrade', project)">
        <IconifyIconOnline icon="ri:rocket-line" />
      </ScButton>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { IconifyIconOnline } from "@repo/components";
import { message } from "@repo/utils";
import type { SysProject } from "../../api/manage/project";
import { fetchProjectAction } from "../../api/manage/project";

const props = defineProps<{ project: SysProject }>();
const emit = defineEmits<{
  action: [type: string, project: SysProject];
  upload: [project: SysProject];
  upgrade: [project: SysProject];
}>();

const loading = ref<string | null>(null);

const handleAction = async (action: "start" | "stop" | "restart" | "snapshot") => {
  if (!props.project.projectId) return;
  loading.value = action;
  try {
    // 重启无脚本时：先停止再启动
    if (action === "restart" && !props.project.restartScript) {
      await fetchProjectAction(props.project.projectId, "stop");
      await fetchProjectAction(props.project.projectId, "start");
      message("重启成功", { type: "success" });
    } else {
      const res = await fetchProjectAction(props.project.projectId, action);
      if (res.code === "00000") {
        message(res.data?.message || actionLabel(action) + "成功", { type: "success" });
      }
    }
    emit("action", action, props.project);
  } catch (e: any) {
    message(actionLabel(action) + "失败: " + (e?.message ?? ""), { type: "error" });
  } finally {
    loading.value = null;
  }
};

const actionLabel = (a: string) =>
  ({ start: "启动", stop: "停止", restart: "重启", snapshot: "快照" }[a] ?? a);
</script>

<style scoped lang="scss">
.action-bar {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  flex-wrap: wrap;
}
</style>
