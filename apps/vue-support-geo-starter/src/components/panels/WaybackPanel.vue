<script setup lang="ts">
/**
 * Wayback 历史影像下载参数面板
 *
 * 使用后端 /v1/geo/wayback/* 接口：
 *   - 历史版本选择
 *   - 最大级别探测
 *   - 缩放级别 / 输出格式 / 并发 / 保存路径
 *   - 创建下载任务
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useSelectionStore } from "@/store/selection";
import { getWaybackVersions, createWaybackTask, probeWaybackMaxZoom } from "@/api/wayback";
import { FORMAT_OPTIONS } from "@/constants/modes";
import type { WaybackVersion } from "@/types";

const router = useRouter();
const selection = useSelectionStore();

const versions = ref<WaybackVersion[]>([]);
const loadingVersions = ref(false);
const form = ref({
  versionId: "",
  zoomMin: 10,
  zoomMax: 17,
  format: "geotiff",
  concurrency: 8,
  savePath: "",
});
const probing = ref(false);
const probedMaxZoom = ref<number | null>(null);
const submitting = ref(false);

const hasBounds = computed(() => !!selection.bounds);

/** 加载 Wayback 历史版本列表 */
async function loadVersions() {
  loadingVersions.value = true;
  try {
    const res = await getWaybackVersions();
    versions.value = res.versions ?? [];
    if (versions.value.length && !form.value.versionId) form.value.versionId = versions.value[0].id;
  } catch (e: any) {
    ElMessage.warning(`Wayback 版本加载失败：${e?.message ?? e}`);
  } finally {
    loadingVersions.value = false;
  }
}

/** 探测选区中心点的最大可用缩放级别 */
async function onProbe() {
  if (!form.value.versionId) return ElMessage.warning("请选择历史版本");
  if (!selection.bounds) return ElMessage.warning("请先在地图上绘制选区");
  probing.value = true;
  try {
    const lat = (selection.bounds.north + selection.bounds.south) / 2;
    const lng = (selection.bounds.east + selection.bounds.west) / 2;
    const r = await probeWaybackMaxZoom({ versionId: form.value.versionId, lat, lng });
    probedMaxZoom.value = r.maxZoom;
    ElMessage.success(`探测到最大可用级别：Z${r.maxZoom}`);
  } catch (e: any) {
    ElMessage.error(`探测失败：${e?.message ?? e}`);
  } finally {
    probing.value = false;
  }
}

/** 创建 Wayback 下载任务并跳转任务中心 */
async function onSubmit() {
  if (!selection.bounds) return ElMessage.warning("请先在地图上绘制选区");
  if (!form.value.versionId) return ElMessage.warning("请选择历史版本");
  submitting.value = true;
  try {
    const res = await createWaybackTask({
      versionId: form.value.versionId,
      bounds: selection.bounds,
      zoom: form.value.zoomMin,
      zoomMax: form.value.zoomMax,
      format: form.value.format,
      concurrency: form.value.concurrency,
      savePath: form.value.savePath || null,
    });
    ElMessage.success(`Wayback 任务已创建：${res.taskId}`);
    router.push("/tasks");
  } catch (e: any) {
    ElMessage.error(`创建任务失败：${e?.message ?? e}`);
  } finally {
    submitting.value = false;
  }
}

onMounted(loadVersions);
</script>

<template>
  <div class="panel">
    <el-form label-position="top" size="small">
      <el-form-item label="历史版本">
        <el-select v-model="form.versionId" :loading="loadingVersions" filterable style="width: 100%">
          <el-option v-for="v in versions" :key="v.id" :value="v.id" :label="v.title || v.id" />
        </el-select>
        <div v-if="probedMaxZoom !== null" class="hint">探测最大级别：Z{{ probedMaxZoom }}</div>
      </el-form-item>
      <el-form-item label="缩放级别">
        <div class="zoom-range">
          <el-input-number v-model="form.zoomMin" :min="0" :max="24" controls-position="right" />
          <span class="zoom-sep">至</span>
          <el-input-number v-model="form.zoomMax" :min="0" :max="24" controls-position="right" />
        </div>
      </el-form-item>
      <el-form-item label="输出格式">
        <el-select v-model="form.format" style="width: 100%">
          <el-option v-for="f in FORMAT_OPTIONS" :key="f.value" :value="f.value" :label="f.label" />
        </el-select>
      </el-form-item>
      <el-form-item label="并发数">
        <el-input-number v-model="form.concurrency" :min="1" :max="64" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="保存路径">
        <el-input v-model="form.savePath" placeholder="留空使用默认目录" clearable />
      </el-form-item>
    </el-form>
    <div class="panel-actions">
      <el-button :loading="probing" :disabled="!hasBounds" @click="onProbe">探测最大级别</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!hasBounds" @click="onSubmit">开始下载</el-button>
    </div>
  </div>
</template>

<style scoped>
.panel{padding:4px}
.zoom-range{display:flex;align-items:center;gap:6px;width:100%}
.zoom-sep{font-size:12px;color:var(--el-text-color-secondary)}
.hint{margin-top:4px;font-size:12px;color:var(--el-text-color-secondary)}
.panel-actions{display:flex;gap:8px}
.panel-actions .el-button{flex:1}
</style>
