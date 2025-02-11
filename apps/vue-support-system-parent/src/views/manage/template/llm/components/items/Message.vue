<template>
  <Transition :name="`message-${sendFrom}`" appear>
    <div :class="`message-${sendFrom}`">
      <div class="icon-box">
        <UserIcon v-if="sendFrom === 'user'" />
        <RobotIcon v-if="sendFrom === 'llm'" />
      </div>
      <div v-if="sendFrom === 'user'" :class="`text-${sendFrom}`">
        <el-icon :size="16" v-copy:click="content" class="cursor-pointer mr-2 top-1">
          <component :is="useRenderIcon('ep:copy-document')"></component>
        </el-icon>
        <el-icon :size="16" @click="handleReEdit(content)" class="cursor-pointer mr-2 top-1"> <component :is="useRenderIcon('ep:edit')"></component> </el-icon><span class="chat-right">{{ content }}</span>
      </div>
      <div v-if="sendFrom === 'llm'" :class="`text-${sendFrom} chat-left`">
        <MarkdownRenderer :content="content" />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts" name="UserMessage">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import UserIcon from "../../components/icons/UserIcon.vue";
import RobotIcon from "../../components/icons/RobotIcon.vue";
import { defineEmits, toRefs } from "vue";
import MarkdownRenderer from "./MarkdownRenderer.vue";

const emiter = defineEmits();
const props = defineProps({
  message: {
    type: Object,
    default: () => ({ sendFrom: "", content: "" }),
  },
});

const { sendFrom, content } = toRefs(props.message);

const handleReEdit = (content: string) => {
  emiter("reedit", content);
};
</script>

<style scoped>
/* 单个消息 */
.message-user {
  align-self: flex-end;
  display: flex;
  flex-direction: row-reverse;
}
.message-llm {
  align-self: flex-start;
  display: flex;
  flex-direction: row;
}

.message-user,
.message-llm {
  gap: 10px;
  max-width: 100%;
}
.text-user {
  background: transparent !important;
}
/* 消息文本 */
.text-user,
.text-llm {
  padding: 10px;
  border-radius: 10px;
  min-width: 0;
  flex: 1;
  background-color: var(--ld-color-primary);
  color: var(--ld-color-text);
  transition: color var(--ld-transition-duration);
}
.text-user {
  margin-left: 50px;
}
.text-llm {
  margin-right: 50px;
}

/* 消息图标 */
.icon-box {
  margin: 8px;
  flex-shrink: 0;
}

/* 为新消息添加动画 */
.message-user-enter-active,
.message-llm-enter-active {
  opacity: 0;
  transform: translateY(50px);
}
.message-user-enter-active {
  transition: all 0.2s;
}
.message-llm-enter-active {
  transition: all 0.2s 0.1s;
}
.message-user-enter-to,
.message-llm-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.chat-left {
  box-sizing: border-box;
  box-shadow: 0px 7px 30px 0px rgba(100, 100, 111, 0.2);
  text-align: left;
  width: 70% !important;
  border-radius: 12px;
  line-height: 24px;
  max-width: 100%;
  padding: 12px 16px;
}
.chat-right {
  box-sizing: border-box;
  box-shadow: 0px 7px 30px 0px rgba(100, 100, 111, 0.2);
  border-radius: 12px;
  line-height: 24px;
  max-width: 100%;
  padding: 12px 16px;
  white-space: pre-wrap;
}
</style>
