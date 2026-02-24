<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { layoutThemes, loadThemeStylesheet } from '../../themes';
import ScRibbon from '@repo/components/ScRibbon/index.vue';
import { themeManager } from '../../utils/theme-manager';

// 导入春节标签页样式
import '../lay-tag/themes/spring-festival.css';

interface ThemeItem {
  name: string;
  key: string;
  description: string;
  stylesheet?: string;
  color?: string;
  icon?: string;
  type?: string; // 主题类型
  baseStyle?: 'light' | 'dark';
}

const props = withDefaults(defineProps<{
  modelValue?: string;
  // 自定义主题列表（不传则自动从 themes/index.ts 读取）
  themes?: ThemeItem[];
  // 是否显示标题与描述
  showMeta?: boolean;
  // 是否在组件内部持久化（父组件不处理时可开启）
  persist?: boolean;
  // 本地存储键名（当 persist 为 true 时生效）
  storageKey?: string;
}>(), {
  modelValue: 'default',
  themes: undefined,
  showMeta: true,
  persist: false,
  storageKey: 'systemTheme',
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void;
  (e: 'change', val: string): void;
}>();

const internalTheme = ref<string>(props.modelValue);

const availableThemes = computed<ThemeItem[]>(() => {
  const src: any[] = (props.themes && props.themes.length > 0) ? (props.themes as any[]) : (layoutThemes as any[]);
  // 规范化：兼容 { key } 或 { themeColor }
  const mapped = src.map((t) => ({
    key: (t.key ?? t.themeColor) as string,
    name: t.name ?? t.title ?? '',
    description: t.description ?? '',
    stylesheet: t.stylesheet,
    icon: t.icon,
    color: t.color,
    type: t.type,
    baseStyle: t.baseStyle,
  }));
  // 过滤掉国庆与无效 key
  return mapped.filter(t => !!t.key && t.key !== 'national-day');
});

// 按类型分组主题
const regularThemes = computed(() => availableThemes.value.filter(t => t.type === 'regular'));
const betaThemes = computed(() => availableThemes.value.filter(t => t.type === 'beta'));
const festivalThemes = computed(() => availableThemes.value.filter(t => t.type === 'festival'));

function removeAllThemeClasses() {
  const htmlEl = document.documentElement;
  [...htmlEl.classList]
    .filter((cls) => cls.startsWith('theme-'))
    .forEach((cls) => htmlEl.classList.remove(cls));
}

import { useThemeAnimation } from "../../hooks/useThemeAnimation";

const runThemeAnimation = useThemeAnimation();

function applyTheme(themeKey: string) {
  const htmlEl = document.documentElement;
  removeAllThemeClasses();

  // 查找主题定义以获取 baseStyle
  const theme = availableThemes.value.find(t => t.key === themeKey);
  const baseStyle = theme?.baseStyle || 'light';
  
  // 如果是默认主题，使用当前的 activeStyleId
  // 如果是其他主题，强制使用该主题定义的 baseStyle
  if (themeKey === 'default') {
    themeManager.setStyle(themeManager.getActiveStyleId());
  } else {
    const styleId = baseStyle === 'dark' ? 'default-dark' : 'default-light';
    themeManager.setStyle(styleId);
  }

  // 应用主题特定样式
  if (themeKey !== 'default') {
    const themeClass = `theme-${themeKey}`;
    htmlEl.classList.add(themeClass);
    loadThemeStylesheet(themeKey);
  } else {
    const existingLink = document.getElementById('layout-theme-stylesheet');
    if (existingLink) existingLink.remove();
  }
}

function onSelect(themeKey: string, event?: MouseEvent) {
  runThemeAnimation(() => {
    internalTheme.value = themeKey;
    
    applyTheme(themeKey);
    if (props.persist) {
      try { localStorage.setItem(props.storageKey, themeKey); } catch {}
    }
    emit('update:modelValue', themeKey);
    emit('change', themeKey);
  }, event);
}

watch(() => props.modelValue, (val) => {
  if (val && val !== internalTheme.value) {
    internalTheme.value = val;
    applyTheme(val);
  }
});

onMounted(() => {
    // 初始应用
    applyTheme(internalTheme.value);
  });
</script>

<template>
  <div class="lay-theme-switcher">
    <!-- 主题皮肤 -->
    <el-divider content-position="left">
      <span class="divider-text">
        <IconifyIconOnline icon="ri:shirt-line" class="divider-icon" />
        主题皮肤
      </span>
    </el-divider>

    <!-- 常规主题 -->
    <div class="theme-grid">
      <div
        v-for="item in regularThemes"
        :key="item.key"
        class="theme-card"
        :class="{ 'is-active': internalTheme === item.key }"
        @click="(e) => onSelect(item.key, e)"
      >
        <div class="card-icon">
          <IconifyIconOnline :icon="item.icon || 'ri:palette-line'" />
        </div>
        <div v-if="showMeta" class="card-meta">
          <div class="card-name">{{ item.name }}</div>
          <div class="card-desc">{{ item.description }}</div>
        </div>
        <div v-if="internalTheme === item.key" class="card-check">
          <IconifyIconOnline icon="ep:check" />
        </div>
      </div>
    </div>

    <!-- 内测主题 -->
    <template v-if="betaThemes.length > 0">
      <el-divider content-position="left">
        <span class="divider-text">
          <IconifyIconOnline icon="ri:flask-line" class="divider-icon" />
          内测主题
        </span>
      </el-divider>
      <div class="theme-grid">
        <div
          v-for="item in betaThemes"
          :key="item.key"
          class="theme-card beta"
          :class="{ 'is-active': internalTheme === item.key }"
          @click="(e) => onSelect(item.key, e)"
        >
          <!-- 斜向绸带标识 -->
          <ScRibbon
            text="BETA"
            variant="diagonal"
            position="rt"
            size="sm"
            color="#00d4d4"
          />
          <div class="card-icon">
            <IconifyIconOnline :icon="item.icon || 'ri:palette-line'" />
          </div>
          <div v-if="showMeta" class="card-meta">
            <div class="card-name">{{ item.name }}</div>
            <div class="card-desc">{{ item.description }}</div>
          </div>
          <div v-if="internalTheme === item.key" class="card-check">
            <IconifyIconOnline icon="ep:check" />
          </div>
        </div>
      </div>
    </template>

    <!-- 节日主题 -->
    <template v-if="festivalThemes.length > 0">
      <el-divider content-position="left">
        <span class="divider-text">
          <IconifyIconOnline icon="ri:gift-line" class="divider-icon" />
          节日主题
        </span>
      </el-divider>
      <div class="theme-grid">
        <div
          v-for="item in festivalThemes"
          :key="item.key"
          class="theme-card festival"
          :class="{ 'is-active': internalTheme === item.key }"
          @click="(e) => onSelect(item.key, e)"
        >
          <div class="card-icon">
            <IconifyIconOnline :icon="item.icon || 'ri:palette-line'" />
          </div>
          <div v-if="showMeta" class="card-meta">
            <div class="card-name">{{ item.name }}</div>
            <div class="card-desc">{{ item.description }}</div>
          </div>
          <div v-if="internalTheme === item.key" class="card-check">
            <IconifyIconOnline icon="ep:check" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lay-theme-switcher { width: 100%; }
.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.theme-card {
  position: relative;
  padding: 14px;
  border-radius: 14px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  cursor: pointer;
  transition: all .25s ease;
}
.theme-card:hover { 
  transform: translateY(-2px); 
  box-shadow: var(--el-box-shadow-light); 
  border-color: var(--el-color-primary);
}
.theme-card.is-active { 
  border-color: var(--el-color-primary); 
  box-shadow: 0 0 0 1px var(--el-color-primary);
}
.card-icon { font-size: 22px; color: var(--el-color-primary); margin-bottom: 6px; }
.card-meta { text-align: left; }
.card-name { 
  font-weight: 600; 
  font-size: 14px; 
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-desc { font-size: 12px; color: var(--el-text-color-secondary); }
.card-check { 
  position: absolute; 
  right: 8px; 
  top: 8px; 
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-color-primary); 
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
}

/* 内测主题卡片 */
.theme-card.beta {
  overflow: hidden;
}

/* 分隔线样式 */
:deep(.el-divider) {
  margin: 16px 0 12px;
}

:deep(.el-divider__text) {
  background-color: var(--el-bg-color);
  padding: 0 10px;
}

.divider-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.divider-icon {
  font-size: 14px;
}

/* 内测主题卡片特殊样式 */
.theme-card.beta .card-icon {
  color: #00d4d4;
}

/* 节日主题卡片特殊样式 */
.theme-card.festival .card-icon {
  color: #f5222d;
}
</style>
