<template>
  <el-tooltip placement="left" content="Language">
    <div class="hover:bg-[--el-header-icon-hover-bg-color] w-36px h-36px rounded-md flex flex-justify-center flex-items-center koi-flip-i">
      <el-dropdown @command="handleChangeLanguage">
        <KoiGlobalIcon name="koi-translate" size="18" class="koi-icon" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="item in languageList" :key="item.value" :command="item.value" :disabled="language === item.value">
              {{ item.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useKoiGlobalStore } from "../../../stores/global";

const globalStore = useKoiGlobalStore();
const language = computed(() => globalStore.language);

const languageList = ref([
  { label: "中文", value: "zh" },
  { label: "English", value: "en" }
]);

const handleChangeLanguage = (lang: string) => {
  globalStore.setGlobalState("language", lang);
};
</script>

<style lang="scss" scoped></style>
