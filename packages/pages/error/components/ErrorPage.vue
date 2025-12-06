<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import PixelStyle from "./styles/PixelStyle.vue";
import SpaceStyle from "./styles/SpaceStyle.vue";
import MinimalStyle from "./styles/MinimalStyle.vue";
import ForbiddenStyle from "./styles/ForbiddenStyle.vue";
import NotFoundStyle from "./styles/NotFoundStyle.vue";
import ServerErrorStyle from "./styles/ServerErrorStyle.vue";

defineOptions({
  name: "ErrorPage",
});

const props = withDefaults(
  defineProps<{
    code: number | string;
    style?: "pixel" | "space" | "minimal" | "forbidden" | "notfound" | "servererror";
  }>(),
  {
    style: "pixel",
  }
);

const { t } = useI18n();
const router = useRouter();

// 错误信息映射
const errorInfo = computed(() => {
  const code = String(props.code);
  const messages: Record<string, { title: string; desc: string }> = {
    "403": {
      title: t("error.forbidden"),
      desc: t("error.forbiddenDesc"),
    },
    "404": {
      title: t("error.notFound"),
      desc: t("error.notFoundDesc"),
    },
    "500": {
      title: t("error.serverError"),
      desc: t("error.serverErrorDesc"),
    },
  };
  return messages[code] || messages["404"];
});

const goHome = () => {
  router.push("/");
};

const goBack = () => {
  router.go(-1);
};

// 根据风格选择组件
const styleComponent = computed(() => {
  const styles = {
    pixel: PixelStyle,
    space: SpaceStyle,
    minimal: MinimalStyle,
    forbidden: ForbiddenStyle,
    notfound: NotFoundStyle,
    servererror: ServerErrorStyle,
  };
  return styles[props.style] || styles.pixel;
});
</script>

<template>
  <div class="error-page">
    <component
      :is="styleComponent"
      :code="code"
      :title="errorInfo.title"
      :description="errorInfo.desc"
      @go-home="goHome"
      @go-back="goBack"
    />
  </div>
</template>

<style lang="scss" scoped>
.error-page {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
}
</style>
