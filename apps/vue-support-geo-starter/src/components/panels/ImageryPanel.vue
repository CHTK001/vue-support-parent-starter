<script setup lang="ts">
/**
 * 影像下载参数面板
 *
 * 与 useSelectionStore 共享选区，提供：
 *   - 图源选择（后端 /v1/geo/tile/sources）
 *   - 缩放级别 / 输出格式 / 压缩 / 并发
 *   - 估算 -> 创建下载任务
 * @author CH
 * @since 4.0.0
 */
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useSelectionStore } from "@/store/selection";
import { useSettingsStore } from "@/store/settings";
import { getTileSources, getSourcesAll } from "@/api/sources";
import { estimateDownload, createDownloadTask } from "@/api/tile";
import { FORMAT_OPTIONS, COMPRESSION_OPTIONS } from "@/constants/modes";
import type { DownloadEstimate, TileSource } from "@/types";

const router = useRouter();
const selection = useSelectionStore();
const settingsStore = useSettingsStore();

const sources = ref<Record<string, TileSource>>({});
const sourcesLoading = ref(false);

const form = ref({
  source: "gaode_img",
  zoomMin: 10,
  zoomMax: 17,
  format: "geotiff",
  compression: "lzw",
  concurrency: 8,
  savePath: "",
  buildPyramid: true,
  generateSidecars: false,
});

const estimate = ref<DownloadEstimate | null>(null);
const estimating = ref(false);
const submitting = ref(false);

const sourceList = computed(() => {
  return Object.values(sources.value).map((s) => ({
    value: s.id,
    label: s.name,
    maxZoom: s.maxZoom ?? 18,
  }));
});

const hasBounds = computed(() => !!selection.bounds);

const canSubmit = computed(() => hasBounds.value && !estimating.value && !submitting.value);

/** 加载影像图源列表 */
async function loadSources() {
  sourcesLoading.value = true;
  try {
    sources.value = await getSourcesAll();
    if (!sources.value[form.value.source] && sourceList.value.length > 0) {
      form.value.source = sourceList.value[0].value;
    }
  } catch (e: any) {
    ElMessage.warning(`图源加载失败：${e?.message ?? e}`);
  } finally {
    sourcesLoading.value = false;
  }
}

/**
 * 获取当前图源最大缩放级别
 * @returns 最大缩放级别
 */
function currentMaxZoom(): number {
  const src = sources.value[form.value.source];
  return src?.maxZoom ?? 18;
}

/** 重置估算结果 */
function resetEstimate() {
  estimate.value = null;
}

/** 执行瓦片下载估算 */
async function onEstimate() {
  if (!selection.bounds) {
    ElMessage.warning("请先在地图上绘制选区");
    return;
  }
  estimating.value = true;
  estimate.value = null;
  try {
    estimate.value = await estimateDownload({
      source: form.value.source,
      bounds: selection.bounds,
      zoom: form.value.zoomMin,
      zoomMax: form.value.zoomMax,
      format: form.value.format,
      compression: form.value.compression,
      concurrency: form.value.concurrency,
      savePath: form.value.savePath || null,
    });
  } catch (e: any) {
    ElMessage.error(`估算失败：${e?.message ?? e}`);
  } finally {
    estimating.value = false;
  }
}

/** 提交下载任务并跳转任务中心 */
async function onSubmit() {
  if (!selection.bounds) {
    ElMessage.warning("请先在地图上绘制选区");
    return;
  }
  submitting.value = true;
  try {
    const res = await createDownloadTask({
      source: form.value.source,
      bounds: selection.bounds,
      zoom: form.value.zoomMin,
      zoomMax: form.value.zoomMax,
      format: form.value.format,
      compression: form.value.compression,
      concurrency: form.value.concurrency,
      savePath: form.value.savePath || null,
      buildPyramid: form.value.buildPyramid,
      generateSidecars: form.value.generateSidecars,
    });
    ElMessage.success(`任务已创建：${res.taskId}（${res.tileCount} 瓦片）`);
    router.push("/tasks");
  } catch (e: any) {
    ElMessage.error(`创建任务失败：${e?.message ?? e}`);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  loadSources();
  if (!settingsStore.settings) {
    settingsStore.loadSettings();
  }
});
</script>

<template>
  <div class="panel">
    <el-form label-position="top" >
      <el-form-item label="影像图源">
        <el-select v-model="form.source" :loading="sourcesLoading" filterable style="width: 100%">
          <el-option
            v-for="s in sourceList"
            :key="s.value"
            :value="s.value"
            :label="`${s.label}（最大 Z${s.maxZoom}）`"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="缩放级别">
        <div class="zoom-range">
          <el-input-number v-model="form.zoomMin" :min="0" :max="24" controls-position="right" />
          <span class="zoom-sep">至</span>
          <el-input-number v-model="form.zoomMax" :min="0" :max="24" controls-position="right" />
        </div>
        <div class="hint">当前图源最大级别：Z{{ currentMaxZoom() }}</div>
      </el-form-item>

      <el-form-item label="输出格式">
        <el-select v-model="form.format" style="width: 100%">
          <el-option v-for="f in FORMAT_OPTIONS" :key="f.value" :value="f.value" :label="f.label" />
        </el-select>
      </el-form-item>

      <el-form-item v-if="form.format !== 'tiles'" label="TIFF 压缩">
        <el-select v-model="form.compression" style="width: 100%">
          <el-option
            v-for="c in COMPRESSION_OPTIONS"
            :key="c.value"
            :value="c.value"
            :label="c.label"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="并发数">
        <el-input-number v-model="form.concurrency" :min="1" :max="64" controls-position="right" style="width: 100%" />
      </el-form-item>

      <el-form-item label="保存路径">
        <el-input v-model="form.savePath" placeholder="留空使用默认下载目录" clearable />
      </el-form-item>

      <el-form-item>
        <el-checkbox v-model="form.buildPyramid">导出后构建金字塔</el-checkbox>
      </el-form-item>
      <el-form-item>
        <el-checkbox v-model="form.generateSidecars">生成栅格元数据（.aux.xml）</el-checkbox>
      </el-form-item>
    </el-form>

    <!-- 估算结果 -->
    <div v-if="estimate" class="estimate-card">
      <div class="estimate-row">
        <span>瓦片总数</span>
        <b>{{ estimate.tileCount?.toLocaleString() }}</b>
      </div>
      <div v-if="estimate.cols && estimate.rows" class="estimate-row">
        <span>网格尺寸</span>
        <b>{{ estimate.cols }} × {{ estimate.rows }}</b>
      </div>
      <div v-if="estimate.rawSizeMb" class="estimate-row">
        <span>原始大小</span>
        <b>{{ estimate.rawSizeMb?.toFixed(2) }} MB</b>
      </div>
      <div v-if="estimate.estimatedOutputMb" class="estimate-row">
        <span>预计输出</span>
        <b>{{ estimate.estimatedOutputMb?.toFixed(2) }} MB</b>
      </div>
    </div>

    <div class="panel-actions">
      <el-button :loading="estimating" :disabled="!hasBounds" @click="onEstimate">
        估算
      </el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="onSubmit"
      >
        开始下载
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding: 4px;
}
.zoom-range {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.zoom-sep {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.estimate-card {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
}
.estimate-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.estimate-row b {
  color: var(--el-color-primary);
}
.panel-actions {
  display: flex;
  gap: 8px;
}
.panel-actions .el-button {
  flex: 1;
}

/* 尊重系统「减少动态效果」偏好：
   本面板自身无 transition/animation，需关掉的是图源下拉加载的旋转指示 */
@media (prefers-reduced-motion: reduce) {
  .panel :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>
