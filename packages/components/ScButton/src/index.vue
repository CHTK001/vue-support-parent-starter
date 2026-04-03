  <template>
  <component
    :is="actualComponent"
    v-bind="$attrs"
    :size="size"
    :type="type"
    :theme="type"
    :plain="plain"
    :text="text"
    :bg="bg"
    :link="link"
    :round="round"
    :shape="circle ? 'circle' : 'rect'"
    :circle="circle"
    :loading="loading"
    :loading-icon="loadingIcon"
    :disabled="disabled"
    :icon="icon"
    :autofocus="autofocus"
    :native-type="nativeType"
    :auto-insert-space="autoInsertSpace"
    :color="color"
    :dark="dark"
    :tag="tag"
    @click="handleClick"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.loading" #loading>
      <slot name="loading" />
    </template>
    <template v-if="$slots.icon" #icon>
      <slot name="icon" />
    </template>
  </component>
</template>

<script setup lang="ts">
/**
 * ScButton 按钮组件
 * 保持 useThemeComponent 作为唯一的主题组件切换入口
 */
import { computed } from "vue";
import { ElButton } from "element-plus";
import { useThemeComponent } from "../../hooks/useThemeComponent";
import { scButtonProps } from "./buttonProps";

const props = defineProps(scButtonProps);

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const { currentComponent } = useThemeComponent("ElButton");

const actualComponent = computed(() => currentComponent.value || ElButton);

const handleClick = (event: MouseEvent) => {
  emit("click", event);
};
</script>

<style scoped>
/* 主题样式由 useThemeComponent 命中的主题组件和全局主题层控制 */
</style>
