<template>
  <aside v-if="widget" class="config-panel">
    <div class="config-panel__header">
      <span class="config-panel__title">属性配置</span>
      <span class="config-panel__type">{{ typeDef?.label || widget.type }}</span>
    </div>

    <div class="config-panel__body">
      <!-- 位置与尺寸 -->
      <section class="config-group">
        <h4 class="config-group__title">位置与尺寸</h4>
        <div class="config-grid config-grid--4">
          <div class="config-field">
            <label>X</label>
            <input
              type="number"
              :value="Math.round(widget.rect.x)"
              @input="updateRect('x', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="config-field">
            <label>Y</label>
            <input
              type="number"
              :value="Math.round(widget.rect.y)"
              @input="updateRect('y', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="config-field">
            <label>W</label>
            <input
              type="number"
              :value="Math.round(widget.rect.width)"
              @input="updateRect('width', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="config-field">
            <label>H</label>
            <input
              type="number"
              :value="Math.round(widget.rect.height)"
              @input="updateRect('height', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </section>

      <!-- 变体选择 -->
      <section v-if="typeDef && typeDef.variants.length > 1" class="config-group">
        <h4 class="config-group__title">样式变体</h4>
        <div class="config-variants">
          <button
            v-for="v in typeDef.variants"
            :key="v"
            class="variant-btn"
            :class="{ active: widget.variant === v }"
            @click="updateWidget({ variant: v })"
          >
            {{ v }}
          </button>
        </div>
      </section>

      <!-- 标题 -->
      <section v-if="typeDef && typeDef.configFields.some(f => f.key === 'title')" class="config-group">
        <h4 class="config-group__title">标题</h4>
        <div class="config-field">
          <input
            type="text"
            :value="widget.title"
            @input="updateWidget({ title: ($event.target as HTMLInputElement).value })"
          />
        </div>
      </section>

      <!-- 外观设置 -->
      <section class="config-group">
        <h4 class="config-group__title">外观</h4>
        <div class="config-field config-field--row">
          <label>发光</label>
          <label class="switch">
            <input
              type="checkbox"
              :checked="widget.glow !== false"
              @change="updateWidget({ glow: ($event.target as HTMLInputElement).checked })"
            />
            <span class="switch__slider" />
          </label>
        </div>
        <div class="config-field config-field--row">
          <label>透明</label>
          <input
            type="range"
            :value="widget.backgroundOpacity ?? 0.5"
            min="0"
            max="1"
            step="0.1"
            @input="updateWidget({ backgroundOpacity: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="config-field config-field--row">
          <label>不透明度</label>
          <input
            type="range"
            :value="widget.opacity"
            min="0"
            max="1"
            step="0.1"
            @input="updateWidget({ opacity: Number(($event.target as HTMLInputElement).value) })"
          />
        </div>
        <div class="config-field config-field--row">
          <label>锁定位置</label>
          <label class="switch">
            <input
              type="checkbox"
              :checked="widget.locked"
              @change="updateWidget({ locked: ($event.target as HTMLInputElement).checked })"
            />
            <span class="switch__slider" />
          </label>
        </div>
      </section>

      <!-- 数据绑定 -->
      <section
        v-if="typeDef?.supportsDataBinding"
        class="config-group"
      >
        <h4 class="config-group__title">数据绑定</h4>
        <div class="config-field">
          <label>API 地址</label>
          <input
            type="text"
            :value="widget.dataBinding?.apiUrl || ''"
            placeholder="https://api.example.com/data"
            @input="updateDataBinding('apiUrl', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="config-grid config-grid--2">
          <div class="config-field">
            <label>方法</label>
            <select
              :value="widget.dataBinding?.method || 'GET'"
              @change="updateDataBinding('method', ($event.target as HTMLSelectElement).value)"
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </div>
          <div class="config-field">
            <label>刷新(ms)</label>
            <input
              type="number"
              :value="widget.dataBinding?.refreshInterval || 0"
              min="0"
              @input="updateDataBinding('refreshInterval', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
      </section>

      <!-- 滚动字幕配置 -->
      <section
        v-if="widget.type === 'scrolling-text'"
        class="config-group"
      >
        <h4 class="config-group__title">滚动字幕</h4>
        <div class="config-field">
          <label>内容</label>
          <textarea
            :value="widget.scrollingText?.content || ''"
            rows="3"
            @input="updateScrollingText('content', ($event.target as HTMLTextAreaElement).value)"
          />
        </div>
        <div class="config-grid config-grid--2">
          <div class="config-field">
            <label>方向</label>
            <select
              :value="widget.scrollingText?.direction || 'left'"
              @change="updateScrollingText('direction', ($event.target as HTMLSelectElement).value)"
            >
              <option value="left">向左</option>
              <option value="right">向右</option>
            </select>
          </div>
          <div class="config-field">
            <label>速度</label>
            <input
              type="number"
              :value="widget.scrollingText?.speed || 50"
              min="10"
              max="500"
              @input="updateScrollingText('speed', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
        </div>
        <div class="config-grid config-grid--2">
          <div class="config-field">
            <label>字号</label>
            <input
              type="number"
              :value="widget.scrollingText?.fontSize || 16"
              min="10"
              max="60"
              @input="updateScrollingText('fontSize', Number(($event.target as HTMLInputElement).value))"
            />
          </div>
          <div class="config-field">
            <label>颜色</label>
            <input
              type="color"
              :value="widget.scrollingText?.color || '#00f6ff'"
              @input="updateScrollingText('color', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </section>

      <!-- iframe 配置 -->
      <section
        v-if="widget.type === 'iframe'"
        class="config-group"
      >
        <h4 class="config-group__title">网页嵌入</h4>
        <div class="config-field">
          <label>网页地址</label>
          <input
            type="text"
            :value="widget.iframe?.src || ''"
            placeholder="https://example.com"
            @input="updateIframe('src', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="config-field config-field--row">
          <label>允许全屏</label>
          <label class="switch">
            <input
              type="checkbox"
              :checked="widget.iframe?.allowFullscreen || false"
              @change="updateIframe('allowFullscreen', ($event.target as HTMLInputElement).checked)"
            />
            <span class="switch__slider" />
          </label>
        </div>
      </section>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { WidgetConfig } from "../types/widget";
import { getWidgetType } from "../composables/useWidgetRegistry";

const props = defineProps<{
  widget: WidgetConfig | null;
}>();

const emit = defineEmits<{
  update: [id: string, patch: Partial<WidgetConfig>];
  updateRect: [id: string, rect: Record<string, number>];
}>();

const typeDef = computed(() =>
  props.widget ? getWidgetType(props.widget.type) : null
);

function updateRect(key: string, value: number) {
  if (!props.widget) return;
  emit("updateRect", props.widget.id, { [key]: value });
}

function updateWidget(patch: Partial<WidgetConfig>) {
  if (!props.widget) return;
  emit("update", props.widget.id, patch);
}

function updateDataBinding(key: string, value: unknown) {
  if (!props.widget) return;
  const db = { ...(props.widget.dataBinding || {}), [key]: value };
  emit("update", props.widget.id, { dataBinding: db as WidgetConfig["dataBinding"] });
}

function updateScrollingText(key: string, value: unknown) {
  if (!props.widget) return;
  const st = { ...(props.widget.scrollingText || {}), [key]: value };
  emit("update", props.widget.id, { scrollingText: st as WidgetConfig["scrollingText"] });
}

function updateIframe(key: string, value: unknown) {
  if (!props.widget) return;
  const iframe = { ...(props.widget.iframe || { src: "", allowFullscreen: false }), [key]: value };
  emit("update", props.widget.id, { iframe: iframe as WidgetConfig["iframe"] });
}
</script>

<style lang="scss" scoped>
.config-panel {
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(5, 15, 30, 0.9);
  border-left: 1px solid rgba(0, 246, 255, 0.15);
  flex-shrink: 0;
}

.config-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.1);
}

.config-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 246, 255, 0.9);
}

.config-panel__type {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 246, 255, 0.08);
  padding: 2px 8px;
  border-radius: 4px;
}

.config-panel__body {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
}

.config-group {
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.06);
}

.config-group__title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 246, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.config-grid {
  display: grid;
  gap: 8px;

  &--2 {
    grid-template-columns: 1fr 1fr;
  }

  &--4 {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}

.config-field {
  margin-bottom: 8px;

  label {
    display: block;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }

  input[type="text"],
  input[type="number"],
  select,
  textarea {
    width: 100%;
    padding: 5px 8px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;

    &:focus {
      border-color: rgba(0, 246, 255, 0.4);
    }

    &[type="range"] {
      padding: 0;
      border: none;
      background: transparent;
      accent-color: #00f6ff;
    }
  }

  textarea {
    resize: vertical;
    min-height: 50px;
  }

  select {
    cursor: pointer;
  }

  &--row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    label {
      margin-bottom: 0;
    }
  }
}

.config-variants {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .variant-btn {
    padding: 3px 10px;
    font-size: 11px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    transition: all 0.15s;
    font-family: "JetBrains Mono", monospace;

    &.active {
      background: rgba(0, 246, 255, 0.2);
      border-color: rgba(0, 246, 255, 0.5);
      color: #00f6ff;
    }

    &:hover:not(.active) {
      background: rgba(0, 246, 255, 0.08);
    }
  }
}

// Toggle switch
.switch {
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  &__slider {
    position: absolute;
    cursor: pointer;
    inset: 0;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.2);
    border-radius: 18px;
    transition: all 0.2s;

    &::before {
      content: "";
      position: absolute;
      left: 2px;
      top: 2px;
      width: 12px;
      height: 12px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      transition: all 0.2s;
    }
  }

  input:checked + .switch__slider {
    background: rgba(0, 246, 255, 0.25);
    border-color: #00f6ff;

    &::before {
      transform: translateX(14px);
      background: #00f6ff;
    }
  }
}
</style>
