<template>
  <!--
    AI 配置中心（/edu/ai-config-center）—— AI 运行时与试卷识别配置，复用 pages/ai 的配置组件。

    复用边界（2026-10-23 统一，2026-10-24 补 runtime 分组与全局保存）：
      本页不再自建 AI 运行时表单，直接内嵌 pages/ai 的 DefaultModelSettings，渲染两组：
        · runtime（对话路由）：provider / provider_api_key / provider_base_url / default_model
          —— 这是阅卷/组卷真正读取的主链路（sys_ai_global_setting.runtime 分组）。
        · paper（试卷识别）：OCR / OCR+LLM 双管线的 provider/密钥/地址/模型/阈值等。
      两组均由 ai-starter 的全局设置 SPI 定义，经 /v2/settings 统一读写 sys_ai_global_setting。

    保存走全局层（:global-save="true"）：runtime 的运行时读取是 GlobalSettingReader#getStrDirect，
      只读全局层、不读用户覆盖层；若保存落到覆盖层会「界面保存了却不生效」。管理员在本页保存
      即写入全局默认层，普通账号仍只写自己的覆盖层（接口层有白名单与管理员专属字段守卫）。
  -->
  <div class="ai-config-center">
    <DefaultModelSettings :groups="['runtime', 'paper']" :global-save="true" />
  </div>
</template>

<script setup lang="ts">
import DefaultModelSettings from "@pages/ai/components/setting/DefaultModelSettings.vue";
</script>

<style scoped>
.ai-config-center {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 4px;
}
</style>
