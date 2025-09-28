<template>
  <el-config-provider :locale="currentLocale">
    <router-view :key="$route.fullPath" />
    <ReDialog />
  </el-config-provider>
</template>


<script lang="ts">
import { defineComponent, ref, nextTick, provide } from "vue";
import { ElConfigProvider } from "element-plus";
import { ReDialog } from "@repo/components/ReDialog";
import en from "element-plus/es/locale/lang/en";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import { SpinProps } from "ant-design-vue";
export default defineComponent({
  name: "app",
  data() {
    return {
      routerActivation: true,
      globalLoadingProps: null
    }
  },
  components: {
    [ElConfigProvider.name]: ElConfigProvider,
    ReDialog,
  },
  setup() {
    const routerActivation = ref(true)
    const reload = () => {
      routerActivation.value = false
      nextTick(() => {
        // const menuStore = useMenuStore()
        // 刷新菜单
        // menuStore.restLoadSystemMenus()
        routerActivation.value = true
      })
    }

    const globalLoadingProps = ref<SpinProps>({
      spinning: false,
      size: 'large',
      delay: 500,
      wrapperClassName: ''
    })

    /**
     * 全局 loading
     * @param props 参数
     */
    const globalLoading = (props: boolean | string | SpinProps) => {
      let newProps: any = {}
      if (typeof props === 'boolean') {
        newProps = { spinning: props }
      } else if (typeof props === 'string') {
        newProps = { tip: props }
      } else if (Object.prototype.toString.call(props) === '[object Object]') {
        newProps = props
      } else {
        console.error('不支持的类型', props, Object.prototype.toString.call(props))
      }
      // 避免无法弹窗
      newProps.wrapperClassName = newProps.spinning ? 'globalLoading' : ''
      globalLoadingProps.value = { ...globalLoadingProps.value, ...newProps }
    }
    provide('reload', reload)
    provide('globalLoading', globalLoading)
  },
  computed: {
    currentLocale() {
      return this.$storage.locale?.locale === "zh-CN" ? zhCn : en;
    }
  }
});
</script>
