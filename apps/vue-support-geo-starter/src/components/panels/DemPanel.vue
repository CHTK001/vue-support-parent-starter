<script setup lang="ts">
/**
 * DEM 高程下载参数面板
 *
 * 使用后端 /v1/geo/dem/* 接口：
 *   - 图源选择（getDemSources）
 *   - 缩放级别 / 输出格式 / 保存路径
 *   - 估算 -> 创建下载任务
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";

import { useSelectionStore } from "@/store/selection";
import { getDemSources, estimateDem, downloadDem } from "@/api/dem";
import { FORMAT_OPTIONS } from "@/constants/modes";
import type { DemSource, DownloadEstimate } from "@/types";

const router = useRouter();
const selection = useSelectionStore();

const sources = ref<Record<string, DemSource>>({});
const sourcesLoading = ref(false);

const form = ref({
  source: "copernicus",
  zoom: 14,
  format: "geotiff",
  savePath: "",
});

const estimate = ref<DownloadEstimate | null>(null);
const estimating = ref(false);
const submitting = ref(false);

const sourceList = computed(() =>
  Object.values(sources.value).map((s) => ({
    value: s.id,
    label: s.name,
    maxZoom: s.maxZoom ?? 15,
  })),
);

const hasBounds = computed(() => !!selection.bounds);
const canSubmit = computed(() => hasBounds.value && !estimating.value && !submitting.value);

/** 加载 DEM 图源列表 */
async function loadSources() {
  sourcesLoading.value = true;
  try {
    sources.value = await getDemSources();
    if (!sources.value[form.value.source] && sourceList.value.length > 0) {
      form.value.source = sourceList.value[0].value;
    }
  } catch (e: any) {
    message.warning(`DEM 图源加载失败：${e?.message ?? e}`);
  } finally {
    sourcesLoading.value = false;
  }
}

/** 执行 DEM 估算 */
async function onEstimate() {
  if (!selection.bounds) {
    message.warning("请先在地图上绘制选区");
    return;
  }
  estimating.value = true;
  estimate.value = null;
  try {
    estimate.value = await estimateDem(
      form.value.source,
      selection.bounds,
      form.value.zoom,
      form.value.format,
    );
  } catch (e: any) {
    message.error(`估算失败：${e?.message ?? e}`);
  } finally {
    estimating.value = false;
  }
}

/** 提交 DEM 下载任务并跳转任务中心 */
async function onSubmit() {
  if (!selection.bounds) {
    message.warning("请先在地图上绘制选区");
    return;
  }
  submitting.value = true;
  try {
    const res = await downloadDem(
      form.value.source,
      selection.bounds,
      form.value.zoom,
      form.value.format,
      form.value.savePath || "",
    );
    message.success(`DEM 下载任务已创建：${res.taskId}`);
    router.push("/tasks");
  } catch (e: any) {
    message.error(`创建任务失败：${e?.message ?? e}`);
  } finally {
    submitting.value = false;
  }
}

onMounted(loadSources);
</script>

<template>
  <div class="panel">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="DEM 高程数据以 GeoTIFF 形式输出，支持后续生成山体阴影 / 坡度。"
      class="mb-12"
    />

    <el-form label-position="top" >
      <el-form-item label="DEM 图源">
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
        <el-input-number v-model="form.zoom" :min="1" :max="24" controls-position="right" style="width: 100%" />
      </el-form-item>

      <el-form-item label="输出格式">
        <el-select v-model="form.format" style="width: 100%">
          <el-option v-for="f in FORMAT_OPTIONS" :key="f.value" :value="f.value" :label="f.label" />
        </el-select>
      </el-form-item>

      <el-form-item label="保存路径">
        <el-input v-model="form.savePath" placeholder="留空使用默认下载目录" clearable />
      </el-form-item>
    </el-form>

    <!-- 估算结果 -->
    <div v-if="estimate" class="estimate-card">
      <div class="estimate-row">
        <span>瓦片总数</span>
        <b>{{ estimate.tileCount?.toLocaleString() }}</b>
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
      <el-button type="primary" :loading="submitting" :disabled="!canSubmit" @click="onSubmit">
        开始下载
      </el-button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  padding: 4px;
}
.mb-12 {
  margin-bottom: 12px;
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