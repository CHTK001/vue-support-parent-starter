<template>
  <!-- 多语言：icons-animated 动画翻译图标（hover/focus 播放），故去掉 koi-flip-i 整体翻转 -->
  <div
    class="hover:bg-[--el-header-icon-hover-bg-color] w-36px h-36px rounded-md flex flex-justify-center flex-items-center"
  >
    <el-dropdown
      @command="handleChangeLanguage"
      popper-class="koi-language-dropdown"
      popper-append-to-body
      teleported
    >
      <ReIcon name="anim:tabler:language" size="18" class="koi-icon" />
      <template #dropdown>
        <el-dropdown-menu class="koi-language-menu">
          <el-dropdown-item
            v-for="item in languageList"
            :key="item.value"
            :command="item.value"
            :disabled="language === item.value"
            :class="{ 'is-active': language === item.value }"
          >
            <span class="koi-language-item">
              <!-- 左侧线性图标：中文取「文」，英文取「A」字形，均为细线风格 -->
              <span class="koi-language-item__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <template v-if="item.value === 'zh'">
                    <path d="M4 5h16" />
                    <path d="M12 5v14" />
                    <path d="M8 19c0-3.5 1.8-7 4-7s4 3.5 4 7" />
                  </template>
                  <template v-else>
                    <path d="M3 17l4.5-11L12 17" />
                    <path d="M5 12.5h5" />
                    <path d="M14 17l4.5-11L23 17" />
                    <path d="M16 12.5h5" />
                  </template>
                </svg>
              </span>
              <span class="koi-language-item__text">{{ item.label }}</span>
              <!-- 选中勾：靠 margin-left:auto 推到最右，与文字之间留白 -->
              <span v-if="language === item.value" class="koi-language-item__check" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="4 12.5 9.5 18 20 6.5" />
                </svg>
              </span>
            </span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";
import useGlobalStore from "@repo/pinia/modules/global";
import { LanguageType } from "@repo/pinia/interface";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { setDocumentTitle } from "@repo/theme/koi/layouts/useLayoutTitle";

const { t } = useI18n();
const route = useRoute();
const i18n = useI18n();
const globalStore = useGlobalStore();
const language = computed(() => globalStore.language);

const languageList = ref<any>([]);

onMounted(() => {
  handleSwitchLanguage();
});

const handleSwitchLanguage = () => {
  // 当 language 变化时，手动触发 languageList 的更新
  languageList.value = [
    { label: t("header.languageList.chinese"), value: "zh" },
    { label: t("header.languageList.english"), value: "en" }
  ];
  // 同步浏览器标题（菜单树翻译标题 + 应用标题）
  setDocumentTitle(route.path, route.meta?.title as string, route.meta?.activeMenu as string | undefined);
};

/** 监听 globalStore.language 的变化 */
watch(
  () => globalStore.language,
  () => {
    handleSwitchLanguage();
  }
);

const handleChangeLanguage = (lang: string) => {
  i18n.locale.value = lang;
  globalStore.setGlobalState("language", lang as LanguageType);
};
</script>

<style lang="scss" scoped></style>

<style lang="scss">
/* 语言下拉：与主题下拉同一套间距 —— 左侧线性图标 + 右侧文字左对齐，
   选中项浅蓝圆角色块 + 浅蓝文字，边缘利落、悬浮层级感明确，
   面板 padding / 条目 padding / 条目标题间距和图标文字间距全部对齐 ReDark 选项组。 */
.koi-language-dropdown.el-popper,
.el-popper.koi-language-dropdown {
  --rm-radius: 12px;
  --el-popper-border-radius: 12px;
  --el-popover-border-radius: 12px;

  padding: 10px !important;
  border-radius: 12px !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06) !important;
  backdrop-filter: blur(12px);
}

html.dark .koi-language-dropdown {
  border-color: var(--el-border-color) !important;
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.4),
    0 2px 8px rgba(0, 0, 0, 0.3) !important;
}

.koi-language-menu {
  min-width: 120px;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.koi-language-menu .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  /* 条目间距 4px，与 ReDark 选项组 gap 一致；圆角 10px 与面板 12px 呼应；面板 padding 与 ReDark 一致 */
  margin: 0 0 4px 0 !important;
  padding: 10px 14px !important;
  border-radius: 10px !important;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-text-color-regular);
  transition:
    background-color 0.22s ease,
    color 0.22s ease;

  &:hover:not(.is-disabled) {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  /* 选中态：浅蓝圆角色块 + 浅蓝文字 */
  &.is-active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 600;
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 1;
  }
}

html.dark .koi-language-menu .el-dropdown-menu__item.is-active {
  background: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  color: var(--el-color-primary-light-3);
}

/* 条目内部：左侧线性图标 + 右侧文字，左对齐 */
.koi-language-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
}

.koi-language-item__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  transition: color 0.22s ease;

  .is-active & {
    color: var(--el-color-primary);
  }
}

/* 文字占满剩余宽度，勾才能被推到最右（否则文字短时勾会紧贴文字） */
.koi-language-item__text {
  flex: 1;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
}

/* 右侧选中勾：margin-left:auto 把它推到最右，与文字之间自动留白 */
.koi-language-item__check {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);

  .is-active & {
    color: var(--el-color-primary);
  }
}

html.dark .koi-language-item__icon .is-active & {
  color: var(--el-color-primary-light-3);
}

html.dark .koi-language-item__check .is-active & {
  color: var(--el-color-primary-light-3);
}
</style>
