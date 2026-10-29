<template>
  <!--
    AI 配置中心（/edu/ai-config-center）—— 试卷识别 + 阅卷设置 + AI 组卷。

    复用边界（2026-10-29 对齐）：
      本页直接内嵌 pages/ai 的「试卷配置」组件 PaperConfigPanel，与「系统设置 → 试卷配置」
      是同一个组件、同一份数据（sys_ai_global_setting 的 paper / marking / compose 三个分组）。

      此前这里额外渲染了 runtime（对话路由）分组，导致同一个按钮点进去，eduai 侧看到
      「对话路由 + 试卷配置」两块，而 pages/ai 侧的试卷配置只有一块 —— 那两块本来就是
      两个设置中心菜单，不该在「试卷配置」里合并出现。对话路由（默认对话模型 / 标题总结 /
      历史压缩）属于会话语义，入口在 pages/ai 的会话配置页，本页不再重复提供。

    保存走全局层：paper / marking 的运行时读取是 GlobalSettingReader#getStrDirect，
      只读全局层、不读用户覆盖层；若保存落到覆盖层会「界面保存了却不生效」。
  -->
  <div class="ai-config-center">
    <PaperConfigPanel :global-save="true" />
  </div>
</template>

<script setup lang="ts">
import PaperConfigPanel from "@pages/ai/components/setting/PaperConfigPanel.vue";
</script>

<style scoped>
.ai-config-center {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 4px;
}
</style>
