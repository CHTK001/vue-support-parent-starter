<template>
  <div
    class="koi-logo flex flex-items-center"
    :class="[rootClass, isHeaderLayout ? 'p-l-5px' : 'p-x-5px']"
    v-show="showLogo"
  >
    <div
      class="koi-logo__avatar rounded-full flex-shrink-0"
      :class="logoContainerClass"
      :style="logoContainerStyle"
    >
      <el-image :src="logoUrl" fit="cover" class="w-100% h-100% rounded-full">
        <template #error>
          <el-icon class="w-100% h-100% rounded-full text-[--el-color-primary]" :size="34">
            <CircleCloseFilled />
          </el-icon>
        </template>
      </el-image>
    </div>

    <el-tooltip :content="title" :show-after="1500" placement="right">
      <div
        class="koi-logo__title truncate select-none"
        :class="titleClass"
        :style="titleStyle"
        v-text="title"
        v-show="showTitleBlock"
      ></div>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  isCollapse: { require: false, type: Boolean },
  layout: { require: "vertical", type: String }
});

const title = ref("Koi Admin");
const showLogo = ref(true);
const logoSize = ref("32px");
const titleSize = ref("14px");
const logoUrl = ref("");

const isHeaderLayout = computed(() => props.layout === "horizontal" || props.layout === "classic");

const showTitleBlock = computed(() => {
  if (props.isCollapse) return false;
  if (isHeaderLayout.value) return window.innerWidth >= 1200;
  return true;
});

const rootClass = computed(() => (isHeaderLayout.value ? "koi-logo--header" : ""));

const logoContainerStyle = computed(() => ({
  width: logoSize.value, height: logoSize.value,
  maxWidth: logoSize.value, maxHeight: logoSize.value
}));

const logoContainerClass = computed(() => {
  const base = "rounded-full";
  if (props.layout === "classic") return `${base} m-l--4px`;
  return base;
});

const titleClass = computed(() => {
  if (props.layout === "horizontal" || props.layout === "classic") return "truncate select-none m-x-10px min-w-0 shrink";
  return "truncate select-none flex-1 m-l-10px";
});

const titleStyle = computed(() => {
  const base = { "font-size": titleSize.value };
  if (props.layout === "horizontal" || props.layout === "classic") {
    return { ...base, color: "var(--el-header-logo-text-color) !important" };
  }
  return { ...base, color: "var(--el-aside-logo-text-color) !important" };
});
</script>

<style lang="scss" scoped>
@use "../../styles/variables.scss" as *;

.koi-logo { height: $aside-header-height; line-height: $aside-header-height; }
.koi-logo--header { min-width: 0; max-width: min(220px, 32vw); flex-shrink: 1; overflow: hidden; }
.koi-logo__avatar { min-width: 0; }
.koi-logo__title { min-width: 0; }
.koi-logo--header .koi-logo__title { max-width: 155px; flex: 1 1 auto; }

@media (max-width: 1199px) {
  .koi-logo--header .koi-logo__title { display: none !important; }
}
</style>
