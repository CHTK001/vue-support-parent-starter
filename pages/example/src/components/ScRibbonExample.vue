<template>
  <div class="sc-ribbon-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="variant 样式类型">
            <ScSelect 
              v-model="config.variant" 
              layout="dropdown" 
              :options="variantOptions" 
              dropdown-title="选择绸带类型"
              dropdown-placeholder="请选择类型"
              :dropdown-col="3"
            />
          </ScFormItem>

          <ScFormItem label="position 位置" v-if="showPosition">
            <ScSelect v-model="config.position" layout="card" :options="positionOptions" :gap="6" width="70px" />
          </ScFormItem>

          <ScFormItem label="size 尺寸">
            <ScSelect v-model="config.size" layout="card" :options="sizeOptions" :gap="6" width="70px" />
          </ScFormItem>

          <ScFormItem label="color 颜色">
            <ScSelect v-model="config.color" layout="card" :options="colorOptions" :gap="6" width="60px" />
          </ScFormItem>

          <ScFormItem label="text 文本">
            <ScInput v-model="config.text" placeholder="绸带文本" />
          </ScFormItem>

          <ScFormItem label="icon 图标">
            <ScSelect v-model="config.icon" layout="card" :options="iconOptions" :gap="6" width="50px" />
          </ScFormItem>

          <ScFormItem label="width 宽度" v-if="showWidth">
            <ScSlider v-model="config.width" :min="50" :max="100" :format-tooltip="v => v + '%'" />
          </ScFormItem>
        </ScForm>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <div class="preview-card" :class="{ 'is-shape': isShapeVariant }">
            <template v-if="!isShapeVariant">
              <div class="card-content">
                <p class="card-title">示例卡片</p>
                <p class="card-desc">查看绸带效果</p>
              </div>
            </template>
            <ScRibbon
              :text="config.text"
              :variant="config.variant"
              :position="config.position"
              :size="config.size"
              :color="config.color"
              :icon="config.icon"
              :width="showWidth ? config.width + '%' : undefined"
            />
          </div>
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { ScSlider } from "@repo/components";

// 样式选项
const variantOptions = [
  { label: "徽章", value: "badge", icon: "ri:price-tag-3-fill" },
  { label: "角标", value: "corner", icon: "ri:corner-up-right-fill" },
  { label: "对角", value: "diagonal", icon: "ri:arrow-right-up-line" },
  { label: "横幅", value: "banner", icon: "ri:flag-fill" },
  { label: "折叠", value: "folded", icon: "ri:bookmark-fill" },
  { label: "书签", value: "bookmark", icon: "ri:bookmark-2-fill" },
  { label: "标签", value: "tag", icon: "ri:price-tag-fill" },
  { label: "悬挂", value: "hanging", icon: "ri:attachment-fill" },
  { label: "斜绥", value: "sash", icon: "ri:award-fill" },
  { label: "盾牌", value: "shield", icon: "ri:shield-star-fill" },
  { label: "波浪", value: "wave", icon: "ri:water-flash-fill" },
  { label: "箭头", value: "arrow", icon: "ri:arrow-right-fill" },
  { label: "圆形", value: "circle", icon: "ri:checkbox-blank-circle-fill" },
  { label: "星形", value: "star", icon: "ri:star-fill" },
  { label: "六边形", value: "hexagon", icon: "ri:hexagon-fill" },
  { label: "爆炸星", value: "starburst", icon: "ri:sun-fill" },
  { label: "双层", value: "double", icon: "ri:stack-fill" },
  { label: "梯形", value: "trapezoid", icon: "ri:trapezoid-fill" },
  { label: "三角旗", value: "pennant", icon: "ri:flag-2-fill" },
  { label: "飘带", value: "swoosh", icon: "ri:ribbon-fill" }
];

// 位置选项
const positionOptions = [
  { label: "左上", value: "lt", icon: "ri:arrow-left-up-line" },
  { label: "右上", value: "rt", icon: "ri:arrow-right-up-line" },
  { label: "左下", value: "lb", icon: "ri:arrow-left-down-line" },
  { label: "右下", value: "rb", icon: "ri:arrow-right-down-line" }
];

// 尺寸选项
const sizeOptions = [
  { label: "小", value: "sm", icon: "ri:subtract-line" },
  { label: "中", value: "md", icon: "ri:checkbox-blank-line" },
  { label: "大", value: "lg", icon: "ri:add-line" }
];

// 颜色选项
const colorOptions = [
  { label: "蓝", value: "#409eff", icon: "ri:drop-fill" },
  { label: "绿", value: "#67c23a", icon: "ri:drop-fill" },
  { label: "橙", value: "#e6a23c", icon: "ri:drop-fill" },
  { label: "红", value: "#f56c6c", icon: "ri:drop-fill" },
  { label: "紫", value: "#8b5cf6", icon: "ri:drop-fill" }
];

// 图标选项
const iconOptions = [
  { label: "无", value: "", icon: "ri:close-line" },
  { label: "星", value: "ri:star-fill", icon: "ri:star-fill" },
  { label: "火", value: "ri:fire-fill", icon: "ri:fire-fill" },
  { label: "心", value: "ri:heart-fill", icon: "ri:heart-fill" }
];

type VariantType = "badge" | "corner" | "diagonal" | "banner" | "folded" | "bookmark" | "tag" | "hanging" | "sash" | "shield" | "wave" | "arrow" | "circle" | "star" | "hexagon" | "starburst" | "double" | "trapezoid" | "pennant" | "swoosh";
type PositionType = "lt" | "rt" | "lb" | "rb";
type SizeType = "sm" | "md" | "lg";

// 配置项
const config = reactive({
  variant: "badge" as VariantType,
  position: "lt" as PositionType,
  size: "md" as SizeType,
  color: "#409eff",
  text: "NEW",
  icon: "",
  width: 80
});

// 是否显示位置选项
const showPosition = computed(() => {
  return ["corner", "diagonal", "folded", "bookmark", "tag", "sash", "arrow", "pennant", "swoosh"].includes(config.variant);
});

// 是否显示宽度选项
const showWidth = computed(() => {
  return ["banner", "wave", "double", "trapezoid", "hanging"].includes(config.variant);
});

// 是否为形状类变体（独立展示，不需要容器卡片）
const isShapeVariant = computed(() => {
  return ["badge", "hanging", "shield", "circle", "star", "hexagon", "starburst"].includes(config.variant);
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];
  props.push(`text="${config.text}"`);
  props.push(`variant="${config.variant}"`);
  if (showPosition.value) props.push(`position="${config.position}"`);
  if (config.size !== "md") props.push(`size="${config.size}"`);
  if (config.color !== "#409eff") props.push(`color="${config.color}"`);
  if (config.icon) props.push(`icon="${config.icon}"`);
  if (showWidth.value) props.push(`width="${config.width}%"`);
  return `<ScRibbon\n  ${props.join("\n  ")}\n/>`;
});
</script>

<style scoped lang="scss">
.sc-ribbon-example { padding: 20px; }
.example-container { display: flex; gap: 24px; @media (max-width: 900px) { flex-direction: column; } }
.config-panel { width: 320px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; @media (max-width: 900px) { width: 100%; } }
.preview-panel { flex: 1; min-width: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.preview-area { padding: 40px; background: var(--el-fill-color-lighter); border-radius: 8px; display: flex; justify-content: center; align-items: center; min-height: 200px; }
.preview-card { position: relative; width: 280px; height: 180px; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 12px; overflow: hidden; &.is-shape { width: auto; height: auto; min-width: 100px; min-height: 100px; background: transparent; border: none; display: flex; justify-content: center; align-items: center; } }
.card-content { padding: 20px; text-align: center; .card-title { margin: 0 0 8px; font-size: 18px; font-weight: 600; color: var(--el-text-color-primary); } .card-desc { margin: 0; font-size: 14px; color: var(--el-text-color-secondary); } }
.code-area { margin-top: 20px; }
.code-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.code-content { margin: 0; padding: 16px; background: #1e1e1e; border-radius: 6px; overflow-x: auto; code { font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: #d4d4d4; line-height: 1.6; } }
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.sc-dropdown) { width: 100%; }
</style>
