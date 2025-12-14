<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { layoutThemes, loadThemeStylesheet } from '../../themes';

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
  }));
  // 过滤掉国庆与无效 key
  return mapped.filter(t => !!t.key && t.key !== 'national-day');
});

function removeAllThemeClasses() {
  const htmlEl = document.documentElement;
  [...htmlEl.classList]
    .filter((cls) => cls.startsWith('theme-'))
    .forEach((cls) => htmlEl.classList.remove(cls));
}

function applyTheme(themeKey: string) {
  const htmlEl = document.documentElement;
  removeAllThemeClasses();
  if (themeKey !== 'default') {
    const themeClass = `theme-${themeKey}`;
    htmlEl.classList.add(themeClass);
    loadThemeStylesheet(themeKey);
  } else {
    const existingLink = document.getElementById('layout-theme-stylesheet');
    if (existingLink) existingLink.remove();
  }
}

function onSelect(themeKey: string) {
  internalTheme.value = themeKey;
  applyTheme(themeKey);
  if (props.persist) {
    try { localStorage.setItem(props.storageKey, themeKey); } catch {}
  }
  emit('update:modelValue', themeKey);
  emit('change', themeKey);
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
    <div class="theme-grid">
      <!-- 默认主题卡片 -->
      <div
        class="theme-card default"
        :class="{ 'is-active': internalTheme === 'default' }"
        @click="onSelect('default')"
      >
        <div class="card-icon">
          <IconifyIconOnline icon="ri:contrast-2-line" />
        </div>
        <div v-if="showMeta" class="card-meta">
          <div class="card-name">默认主题</div>
          <div class="card-desc">系统默认配色</div>
        </div>
        <div v-if="internalTheme === 'default'" class="card-check">
          <IconifyIconOnline icon="ep:check" />
        </div>
      </div>

      <!-- 其他主题卡片 -->
      <div
        v-for="item in availableThemes"
        :key="item.key"
        v-show="item.key !== 'default'"
        class="theme-card festival"
        :class="{ 'is-active': internalTheme === item.key }"
        @click="onSelect(item.key)"
      >
        <div class="card-icon">
          <IconifyIconOnline :icon="item.icon || 'ri:palette-line'" />
        </div>
        <div v-if="showMeta" class="card-meta">
          <div class="card-name">
            {{ item.name }}
            <span v-if="item.type === 'beta'" class="beta-badge">BETA</span>
          </div>
          <div class="card-desc">{{ item.description }}</div>
        </div>
        <div v-if="internalTheme === item.key" class="card-check">
          <IconifyIconOnline icon="ep:check" />
        </div>
      </div>
    </div>
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
.theme-card:hover { transform: translateY(-2px); box-shadow: var(--el-box-shadow-light); }
.theme-card.is-active { outline: 2px solid var(--el-color-primary); }
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
.card-check { position: absolute; right: 10px; top: 10px; color: var(--el-color-success); }

/* BETA标识 */
.beta-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #fff;
  background: linear-gradient(135deg, #00ffff, #00d4d4);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(0, 255, 255, 0.4);
  animation: betaGlow 2s ease-in-out infinite;
}

@keyframes betaGlow {
  0%, 100% {
    box-shadow: 0 2px 6px rgba(0, 255, 255, 0.4);
  }
  50% {
    box-shadow: 0 2px 10px rgba(0, 255, 255, 0.6), 0 0 20px rgba(0, 255, 255, 0.3);
  }
}
</style>
