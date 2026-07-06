<template>
  <aside v-if="widget" class="editor-config">
    <div class="editor-config__header">
      <span class="editor-config__title">属性配置</span>
      <span class="editor-config__pos">({{ Math.round(widget.rect.x) }}, {{ Math.round(widget.rect.y) }}) {{ widget.rect.width }}×{{ widget.rect.height }}</span>
    </div>

    <div class="editor-config__body">
      <!-- 变体选择 -->
      <section v-if="typeDef && typeDef.variants.length > 1" class="config-section">
        <h4 class="config-section__title">样式变体</h4>
        <div class="variant-group">
          <button
            v-for="v in typeDef.variants"
            :key="v"
            class="variant-btn"
            :class="{ active: (widget.variant || typeDef.defaultVariant) === v }"
            @click="onUpdate({ variant: v })"
          >
            {{ v }}
          </button>
        </div>
      </section>

      <!-- 标题 -->
      <section class="config-section">
        <h4 class="config-section__title">标题</h4>
        <input
          type="text"
          class="config-input"
          :value="widget.title"
          placeholder="组件标题"
          @input="onUpdate({ title: ($event.target as HTMLInputElement).value })"
        />
      </section>

      <!-- 位置和尺寸 -->
      <section class="config-section">
        <h4 class="config-section__title">位置 &amp; 尺寸</h4>
        <div class="config-row">
          <div class="config-field">
            <label>X</label>
            <input
              type="number"
              class="config-input"
              :value="Math.round(widget.rect.x)"
              @input="onRectChange('x', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="config-field">
            <label>Y</label>
            <input
              type="number"
              class="config-input"
              :value="Math.round(widget.rect.y)"
              @input="onRectChange('y', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
        <div class="config-row">
          <div class="config-field">
            <label>宽</label>
            <input
              type="number"
              class="config-input"
              :value="Math.round(widget.rect.width)"
              min="40"
              @input="onRectChange('width', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="config-field">
            <label>高</label>
            <input
              type="number"
              class="config-input"
              :value="Math.round(widget.rect.height)"
              min="30"
              @input="onRectChange('height', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </section>

      <!-- 图层 -->
      <section class="config-section">
        <h4 class="config-section__title">图层</h4>
        <div class="config-row">
          <div class="config-field">
            <label>不透明度</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="widget.opacity"
              @input="onUpdate({ opacity: parseFloat(($event.target as HTMLInputElement).value) })"
            />
          </div>
          <div class="config-field">
            <label>层级</label>
            <input
              type="number"
              class="config-input"
              :value="widget.zIndex"
              min="0"
              @input="onUpdate({ zIndex: Number(($event.target as HTMLInputElement).value) })"
            />
          </div>
        </div>
        <div class="config-field">
          <label class="toggle-label">
            <label class="toggle-switch">
              <input type="checkbox" :checked="widget.visible" @change="onUpdate({ visible: ($event.target as HTMLInputElement).checked })" />
              <span class="toggle-slider"></span>
            </label>
            可见
          </label>
        </div>
      </section>

      <!-- 外观 -->
      <section class="config-section">
        <h4 class="config-section__title">外观</h4>
        <div class="config-field">
          <label class="toggle-label">
            <label class="toggle-switch">
              <input type="checkbox" :checked="widget.glow !== false" @change="onUpdate({ glow: ($event.target as HTMLInputElement).checked })" />
              <span class="toggle-slider"></span>
            </label>
            发光
          </label>
        </div>
        <div class="config-field">
          <label>发光透明度</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="widget.glowOpacity ?? 0.5"
            @input="onUpdate({ glowOpacity: parseFloat(($event.target as HTMLInputElement).value) })"
          />
          <span class="config-value">{{ widget.glowOpacity ?? 0.5 }}</span>
        </div>
        <div class="config-field">
          <label>背景透明度</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="widget.backgroundOpacity ?? 0.5"
            @input="onUpdate({ backgroundOpacity: parseFloat(($event.target as HTMLInputElement).value) })"
          />
          <span class="config-value">{{ widget.backgroundOpacity ?? 0.5 }}</span>
        </div>
      </section>

      <!-- 数据绑定 -->
      <section v-if="typeDef?.supportsDataBinding !== false" class="config-section">
        <h4 class="config-section__title">数据绑定</h4>

        <div class="config-field">
          <label>数据地址</label>
          <input
            type="text"
            class="config-input"
            :value="binding.apiUrl || ''"
            placeholder="https://api.example.com/data"
            @input="onBindingChange('apiUrl', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="config-row">
          <div class="config-field">
            <label>请求方法</label>
            <select
              class="config-select"
              :value="binding.method || 'GET'"
              @change="onBindingChange('method', ($event.target as HTMLSelectElement).value)"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div class="config-field">
            <label>刷新(ms)</label>
            <input
              type="number"
              class="config-input"
              :value="binding.refreshInterval || 0"
              min="0"
              step="1000"
              @input="onBindingChange('refreshInterval', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>

        <div class="config-field">
          <label>数据格式 (JSONPath)</label>
          <input
            type="text"
            class="config-input"
            :value="binding.dataPath || ''"
            placeholder="data.list"
            @input="onBindingChange('dataPath', ($event.target as HTMLInputElement).value)"
          />
        </div>

        <div class="config-field">
          <label>处理脚本 (JS)</label>
          <textarea
            class="config-textarea"
            :value="binding.processScript || ''"
            rows="4"
            placeholder="return data.map(item => ({ ...item }))"
            @input="onBindingChange('processScript', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </div>
      </section>

      <!-- 类型特定设置 -->
      <section v-if="widget.type === 'scrolling-text'" class="config-section">
        <h4 class="config-section__title">滚动字幕</h4>
        <div class="config-field">
          <label>内容</label>
          <textarea
            class="config-textarea"
            :value="widget.scrollingText?.content || ''"
            rows="2"
            @input="onScrollingChange('content', ($event.target as HTMLTextAreaElement).value)"
          ></textarea>
        </div>
        <div class="config-row">
          <div class="config-field">
            <label>方向</label>
            <select
              class="config-select"
              :value="widget.scrollingText?.direction || 'left'"
              @change="onScrollingChange('direction', ($event.target as HTMLSelectElement).value)"
            >
              <option value="left">← 左</option>
              <option value="right">→ 右</option>
              <option value="up">↑ 上</option>
              <option value="down">↓ 下</option>
            </select>
          </div>
          <div class="config-field">
            <label>速度</label>
            <input
              type="number"
              class="config-input"
              :value="widget.scrollingText?.speed ?? 50"
              min="1"
              @input="onScrollingChange('speed', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </section>

      <section v-if="widget.type === 'iframe'" class="config-section">
        <h4 class="config-section__title">嵌入页面</h4>
        <div class="config-field">
          <label>页面地址</label>
          <input
            type="text"
            class="config-input"
            :value="widget.iframe?.src || ''"
            placeholder="https://example.com"
            @input="onIframeChange('src', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </section>
    </div>

    <!-- 操作按钮 -->
    <div class="editor-config__footer">
      <button class="cfg-btn cfg-btn--remove" @click="$emit('remove', widget.id)">移除组件</button>
    </div>
  </aside>

  <aside v-else class="editor-config editor-config--empty">
    <div class="editor-config__empty-text">点击画布中的组件<br />查看属性配置</div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { WidgetConfig, WidgetRect } from "@layout/bigscreen";
import { getWidgetType } from "@layout/bigscreen";
import type { EditorDataBinding } from "../types/editor";

interface Props {
  widget: WidgetConfig | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateWidget: [payload: { id: string; patch: Partial<WidgetConfig> }];
  updateWidgetRect: [payload: { id: string; rect: Partial<WidgetRect> }];
  remove: [id: string];
}>();

const typeDef = computed(() => {
  if (!props.widget?.type) return null;
  return getWidgetType(props.widget.type);
});

const binding = computed((): EditorDataBinding => {
  return (props.widget?.dataBinding || {}) as EditorDataBinding;
});

function onUpdate(patch: Partial<WidgetConfig>) {
  if (!props.widget) return;
  emit("updateWidget", { id: props.widget.id, patch });
}

function onRectChange(key: keyof WidgetRect, value: number) {
  if (!props.widget) return;
  emit("updateWidgetRect", { id: props.widget.id, rect: { [key]: value } });
}

function onBindingChange(key: string, value: unknown) {
  if (!props.widget) return;
  const db = { ...binding.value, [key]: value };
  emit("updateWidget", { id: props.widget.id, patch: { dataBinding: db as any } });
}

function onScrollingChange(key: string, value: unknown) {
  if (!props.widget) return;
  const sc = { ...(props.widget.scrollingText || {}), [key]: value };
  emit("updateWidget", { id: props.widget.id, patch: { scrollingText: sc as any } });
}

function onIframeChange(key: string, value: unknown) {
  if (!props.widget) return;
  const ifr = { ...(props.widget.iframe || {}), [key]: value };
  emit("updateWidget", { id: props.widget.id, patch: { iframe: ifr as any } });
}
</script>

<style lang="scss" scoped>
.editor-config {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: rgba(8, 20, 40, 0.95);
  border-left: 1px solid rgba(0, 246, 255, 0.15);

  &--empty {
    align-items: center;
    justify-content: center;
  }

  &__empty-text {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.25);
    text-align: center;
    line-height: 1.8;
  }

  &__header {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(0, 246, 255, 0.1);
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: rgba(0, 246, 255, 0.8);
    display: block;
    margin-bottom: 2px;
  }

  &__pos {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.3);
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  &__footer {
    padding: 10px 14px;
    border-top: 1px solid rgba(0, 246, 255, 0.1);
  }
}

.config-section {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.06);

  &__title {
    margin: 0 0 8px;
    font-size: 10px;
    font-weight: 600;
    color: rgba(0, 246, 255, 0.4);
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

.config-field {
  margin-bottom: 6px;

  label {
    display: block;
    font-size: 10px;
    color: rgba(255, 255, 255, 0.4);
    margin-bottom: 2px;
  }
}

.toggle-label {
  display: flex !important;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.config-input,
.config-select {
  width: 100%;
  padding: 4px 8px;
  background: rgba(0, 20, 40, 0.6);
  border: 1px solid rgba(0, 246, 255, 0.12);
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  outline: none;

  &:focus {
    border-color: rgba(0, 246, 255, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.2);
  }
}

.config-select {
  cursor: pointer;
}

.config-textarea {
  @extend .config-input;
  resize: vertical;
  min-height: 50px;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  line-height: 1.4;
}

.config-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.config-value {
  font-size: 10px;
  color: rgba(0, 246, 255, 0.4);
  margin-left: 4px;
}

.variant-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.variant-btn {
  padding: 3px 8px;
  font-size: 10px;
  background: rgba(0, 20, 40, 0.5);
  border: 1px solid rgba(0, 246, 255, 0.12);
  border-radius: 3px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.1s;

  &:hover {
    border-color: rgba(0, 246, 255, 0.3);
  }

  &.active {
    background: rgba(0, 246, 255, 0.15);
    border-color: rgba(0, 246, 255, 0.5);
    color: #00f6ff;
  }
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 9px;
    transition: 0.2s;

    &::before {
      content: "";
      position: absolute;
      left: 2px;
      bottom: 2px;
      width: 14px;
      height: 14px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transition: 0.2s;
    }
  }

  input:checked + .toggle-slider {
    background: rgba(0, 246, 255, 0.4);

    &::before {
      transform: translateX(14px);
      background: #00f6ff;
    }
  }
}

.cfg-btn {
  width: 100%;
  padding: 6px;
  border: 1px solid rgba(255, 50, 50, 0.3);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.12s;

  &--remove {
    background: transparent;
    color: rgba(255, 100, 100, 0.7);

    &:hover {
      background: rgba(255, 50, 50, 0.15);
      border-color: rgba(255, 50, 50, 0.5);
    }
  }
}
</style>
