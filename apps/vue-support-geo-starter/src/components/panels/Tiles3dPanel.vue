<script setup lang="ts">
/**
 * 3D Tiles 模型下载参数面板
 *
 * 支持两种数据源：
 *   - URL：直接提供 tileset.json 地址
 *   - Cesium ion：assetId + accessToken
 * 流程：分析（获取摘要）-> 下载
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { ref, computed } from "vue";

import { analyze3dTiles, download3dTiles } from "@/api/tiles3d";
import { useSelectionStore } from "@/store/selection";
import type { TilesetSummary } from "@/types";
import { ReRadioGroup, ReRadioButton } from '@repo/ui/re-kit';

const selection = useSelectionStore();

const sourceType = ref<"url" | "cesium_ion">("url");
const form = ref({
  tilesetUrl: "https://assets.ion.cesium.com/1/tileset.json",
  assetId: 1,
  accessToken: "",
  savePath: "",
  proxy: "",
});

const summary = ref<TilesetSummary | null>(null);
const analyzing = ref(false);
const submitting = ref(false);

const canAnalyze = computed(() => {
  if (sourceType.value === "url") return !!form.value.tilesetUrl.trim();
  return form.value.assetId > 0 && !!form.value.accessToken.trim();
});

const polygonCoords = computed(() => selection.polygon);

/** 分析 3D Tiles 结构 */
async function onAnalyze() {
  analyzing.value = true;
  summary.value = null;
  try {
    const source =
      sourceType.value === "url"
        ? { type: "url" as const, tilesetQueryUrl: form.value.tilesetUrl.trim() }
        : {
            type: "cesium_ion" as const,
            assetId: form.value.assetId,
            accessToken: form.value.accessToken.trim(),
          };
    summary.value = await analyze3dTiles(source, form.value.proxy || null);
  } catch (e: any) {
    message.error(`分析失败：${e?.message ?? e}`);
  } finally {
    analyzing.value = false;
  }
}

/** 下载 3D Tiles 模型 */
async function onSubmit() {
  if (!polygonCoords.value) {
    message.warning("3D 模型下载请先在图上绘制多边形选区");
    return;
  }
  submitting.value = true;
  try {
    const source =
      sourceType.value === "url"
        ? { type: "url" as const, tilesetQueryUrl: form.value.tilesetUrl.trim() }
        : {
            type: "cesium_ion" as const,
            assetId: form.value.assetId,
            accessToken: form.value.accessToken.trim(),
          };
    const res = await download3dTiles(
      source,
      polygonCoords.value,
      form.value.savePath || "",
      form.value.proxy || null,
    );
    message.success(`3D Tiles 已下载：${res.contentCount} 内容 / ${res.totalTiles} 瓦片`);
  } catch (e: any) {
    message.error(`下载失败：${e?.message ?? e}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="panel">
    <el-form label-position="top" >
      <el-form-item label="数据源类型">
        <ReRadioGroup v-model="sourceType">
          <ReRadioButton value="url">URL</ReRadioButton>
          <ReRadioButton value="cesium_ion">Cesium ion</ReRadioButton>
        </ReRadioGroup>
      </el-form-item>

      <el-form-item v-if="sourceType === 'url'" label="tileset.json 地址">
        <el-input v-model="form.tilesetUrl" placeholder="https://.../tileset.json" clearable />
      </el-form-item>

      <template v-else>
        <el-form-item label="Asset ID">
          <el-input-number v-model="form.assetId" :min="1" controls-position="right" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Access Token">
          <el-input v-model="form.accessToken" type="password" show-password placeholder="Cesium ion token" />
        </el-form-item>
      </template>

      <el-form-item label="代理（可选）">
        <el-input v-model="form.proxy" placeholder="http://host:port" clearable />
      </el-form-item>

      <el-form-item label="保存路径">
        <el-input v-model="form.savePath" placeholder="留空使用默认目录" clearable />
      </el-form-item>
    </el-form>

    <el-alert
      type="warning"
      :closable="false"
      show-icon
      title="3D 模型需多边形选区，且通常体积较大，请预估磁盘空间。"
      class="mb-12"
    />

    <!-- 分析摘要 -->
    <div v-if="summary" class="estimate-card">
      <div class="estimate-row"><span>3D Tiles 版本</span><b>{{ summary.version }}</b></div>
      <div class="estimate-row"><span>瓦片总数</span><b>{{ summary.totalTiles.toLocaleString() }}</b></div>
      <div class="estimate-row"><span>内容瓦片</span><b>{{ summary.contentTiles.toLocaleString() }}</b></div>
      <div class="estimate-row"><span>最大深度</span><b>{{ summary.maxDepth }}</b></div>
      <div class="estimate-row"><span>层级数</span><b>{{ summary.levels }}</b></div>
      <div class="estimate-row" v-if="summary.hasExternalTilesets">
        <span>外部 tileset</span><el-tag type="warning">存在</el-tag>
      </div>
    </div>

    <div class="panel-actions">
      <el-button :loading="analyzing" :disabled="!canAnalyze" @click="onAnalyze">分析结构</el-button>
      <el-button type="primary" :loading="submitting" @click="onSubmit">下载模型</el-button>
    </div>
  </div>
</template>

<style scoped>
.panel{padding:4px}
.mb-12{margin-bottom:12px}
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
