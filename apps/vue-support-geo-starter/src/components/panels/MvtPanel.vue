<script setup lang="ts">
/**
 * MVT 矢量瓦片预览面板
 *
 * 后端暂未提供 MVT 下载接口，本面板提供：
 *   - 矢量瓦片服务地址说明
 *   - 预览 URL 构造（供外部工具 / 浏览器使用）
 * @author CH
 * @since 4.0.0
 */
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";

const form = ref({
  urlTemplate: "https://tiles.example.com/{z}/{x}/{y}.pbf",
  styleJson: "",
});

const z = ref(12);
const x = ref(3375);
const y = ref(1631);

const previewUrl = computed(() =>
  form.value.urlTemplate
    .replace("{z}", String(z.value))
    .replace("{x}", String(x.value))
    .replace("{y}", String(y.value)),
);

/**
 * 复制预览 URL 到剪贴板
 *
 * navigator 为浏览器全局对象，模板作用域不可见，须在脚本内访问。
 *
 * @return 无返回值
 */
function copyPreviewUrl(): void {
  const text = previewUrl.value;
  if (!navigator.clipboard) {
    ElMessage.warning("当前环境不支持剪贴板写入");
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => ElMessage.success("已复制"))
    .catch(() => ElMessage.error("复制失败"));
}
</script>

<template>
  <div class="panel">
    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="MVT 矢量瓦片下载功能开发中，当前提供服务地址预览能力。"
      class="mb-12"
    />

    <el-form label-position="top" size="small">
      <el-form-item label="矢量瓦片服务模板">
        <el-input v-model="form.urlTemplate" placeholder="https://{s}.tile.host/{z}/{x}/{y}.pbf" clearable />
        <div class="hint">支持 {z} {x} {y} {s} 占位符</div>
      </el-form-item>

      <el-form-item label="预览坐标">
        <div class="zoom-range">
          <el-input-number v-model="z" :min="0" :max="22" controls-position="right" />
          <el-input-number v-model="x" :min="0" controls-position="right" />
          <el-input-number v-model="y" :min="0" controls-position="right" />
        </div>
        <div class="hint">Z / X / Y 瓦片坐标</div>
      </el-form-item>

      <el-form-item label="预览 URL">
        <el-input :model-value="previewUrl" readonly>
          <template #append>
            <el-button
              :icon="'Link'"
              @click="copyPreviewUrl"
            >
              复制
            </el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">说明</el-divider>
    <ul class="notes">
      <li>当前模式仅用于校验矢量瓦片服务可达性与切图规则。</li>
      <li>完整 MVT 下载 / 合并功能将在后端接口就绪后开放。</li>
    </ul>
  </div>
</template>

<style scoped>
.panel{padding:4px}
.mb-12{margin-bottom:12px}
.zoom-range{display:flex;gap:6px;width:100%}
.hint{margin-top:4px;font-size:12px;color:var(--el-text-color-secondary)}
.notes{list-style:none;margin:0;padding:0;font-size:12px;color:var(--el-text-color-secondary);line-height:1.9}
</style>
