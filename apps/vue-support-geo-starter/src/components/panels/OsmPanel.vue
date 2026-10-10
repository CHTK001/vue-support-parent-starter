<script setup lang="ts">
/**
 * OSM 矢量数据下载面板
 *
 * 使用后端 /v1/geo/osm/* 接口：
 *   - Overpass QL 查询语句
 *   - 查询估算（元素数 / 大小）-> 创建下载任务
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";

import { useSelectionStore } from "@/store/selection";
import { osmQuery, createOsmDownloadTask } from "@/api/osm";

const router = useRouter();
const selection = useSelectionStore();

const form = ref({
  query: `[out:json][timeout:600];
(
  way["building"]({{bbox}});
);
out geom;`,
  format: "geojson",
  savePath: "",
});

const estimate = ref<{ elementCount: number; estimateSizeMb: string } | null>(null);
const estimating = ref(false);
const submitting = ref(false);

const hasBounds = computed(() => !!selection.bounds);

const bboxText = computed(() => {
  if (!selection.bounds) return "未选择";
  const b = selection.bounds;
  return `南${b.south.toFixed(4)}, 西${b.west.toFixed(4)}, 北${b.north.toFixed(4)}, 东${b.east.toFixed(4)}`;
});

/** 用当前选区 bbox 填充查询语句 */
function fillBounds() {
  if (!selection.bounds) {
    message.warning("请先在地图上绘制选区");
    return;
  }
  const b = selection.bounds;
  const bbox = `${b.south},${b.west},${b.north},${b.east}`;
  form.value.query = form.value.query.replace(/\(\{\{bbox\}\}\)/, `(${bbox})`);
  message.success("已用当前选区填充 bbox");
}

/** 执行 OSM 查询估算 */
async function onEstimate() {
  if (!selection.bounds) return message.warning("请先在地图上绘制选区");
  estimating.value = true;
  estimate.value = null;
  try {
    const b = selection.bounds;
    estimate.value = await osmQuery(
      form.value.query,
      { south: b.south, west: b.west, north: b.north, east: b.east },
      form.value.format,
    );
  } catch (e: any) {
    message.error(`查询失败：${e?.message ?? e}`);
  } finally {
    estimating.value = false;
  }
}

/** 创建 OSM 下载任务并跳转任务中心 */
async function onSubmit() {
  if (!selection.bounds) return message.warning("请先在地图上绘制选区");
  submitting.value = true;
  try {
    const b = selection.bounds;
    const res = await createOsmDownloadTask(
      form.value.query,
      { south: b.south, west: b.west, north: b.north, east: b.east },
      form.value.format,
      form.value.savePath || "",
    );
    message.success(`OSM 下载任务已创建：${res.taskId}（${res.elementCount} 元素）`);
    router.push("/tasks");
  } catch (e: any) {
    message.error(`创建任务失败：${e?.message ?? e}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="panel">
    <el-form label-position="top" >
      <el-form-item>
        <div class="bbox-bar">
          <el-tag type="info" effect="plain">选区 bbox</el-tag>
          <el-tooltip :content="bboxText" placement="top">
            <span class="bbox-text">{{ bboxText }}</span>
          </el-tooltip>
          <el-button type="primary" plain @click="fillBounds">填入查询</el-button>
        </div>
      </el-form-item>

      <el-form-item label="Overpass 查询语句">
        <el-input v-model="form.query" type="textarea" :rows="7" placeholder="[out:json]; ..." />
        <div class="hint">使用 &#123;&#123;bbox&#125;&#125; 占位符，点击“填入查询”以当前选区替换。</div>
      </el-form-item>

      <el-form-item label="输出格式">
        <el-select v-model="form.format" style="width: 100%">
          <el-option value="geojson" label="GeoJSON (.geojson)" />
          <el-option value="shp" label="Shapefile (.shp)" />
        </el-select>
      </el-form-item>

      <el-form-item label="保存路径">
        <el-input v-model="form.savePath" placeholder="留空使用默认目录" clearable />
      </el-form-item>
    </el-form>

    <div v-if="estimate" class="estimate-card">
      <div class="estimate-row"><span>元素数量</span><b>{{ estimate.elementCount?.toLocaleString() }}</b></div>
      <div class="estimate-row"><span>预计大小</span><b>{{ estimate.estimateSizeMb }}</b></div>
    </div>

    <div class="panel-actions">
      <el-button :loading="estimating" :disabled="!hasBounds" @click="onEstimate">估算</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!hasBounds" @click="onSubmit">开始下载</el-button>
    </div>
  </div>
</template>

<style scoped>
.panel{padding:4px}
.bbox-bar{display:flex;align-items:center;gap:8px;width:100%}
.bbox-text{flex:1;font-size:12px;color:var(--el-text-color-regular);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hint{margin-top:4px;font-size:12px;color:var(--el-text-color-secondary)}
.estimate-card{margin-bottom:12px;padding:10px 12px;background:var(--el-fill-color-light);border-radius:var(--el-radius-sm, 6px)}
.estimate-row{display:flex;justify-content:space-between;padding:2px 0;font-size:13px;color:var(--el-text-color-regular)}
.estimate-row b{color:var(--el-color-primary)}
.panel-actions{display:flex;gap:8px}
.panel-actions .el-button{flex:1}

/* 尊重系统「减少动态效果」偏好：
   本面板自身无 transition/animation，需关掉的是查询期间的旋转指示 */
@media (prefers-reduced-motion: reduce) {
  .panel :deep(.el-loading-spinner) {
    animation: none;
    transition: none;
  }
}
</style>