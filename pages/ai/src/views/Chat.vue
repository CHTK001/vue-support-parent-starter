<template>
  <div class="ai-view">
    <div class="ai-view__container">
      <ReChat
        url="/v2/v1/chat/completions"
        :model="defaultModel"
        :temperature="0.7"
        :api-key="appKey"
        :models="chatModels"
        :models-url="modelsUrl"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Chat —— AI 对话页
 *
 * 对话走 OpenAI 兼容协议（/v2/v1/chat/completions），需用 AI AppKey 鉴权。
 * 模型列表优先从统一能力清单 /v2/ai/models/capability/chat 拉取（本地 + 云端全量），
 * 失败时回退到 OpenAI /v1/models 或空列表（ReChat 内部兜底）。
 */
import { ref, onMounted, computed } from 'vue';
import ReChat from '@repo/ui/re-chat';
import { getConfig } from '@repo/config';
import { modelCatalogApi } from '../api';

// 对话走 OpenAI 兼容协议，需用 AI AppKey 鉴权。
// 优先取 app.yaml other.aiChat.aiChatApiKey；为空时不注入（由后端开关决定是否放行）。
const appKey = computed(() => getConfig()?.other?.aiChat?.aiChatApiKey ?? '');

interface ChatModelOption {
  label: string;
  value: string;
}

const chatModels = ref<ChatModelOption[]>([]);
const defaultModel = ref('gpt-3.5-turbo');

/** 模型列表接口回退地址（OpenAI /v1/models） */
const modelsUrl = '/v2/v1/models';

const loadModels = async () => {
  try {
    const list = await modelCatalogApi.capability('chat');
    const models = Array.isArray(list) ? list : [];
    if (models.length) {
      chatModels.value = models.map((id) => ({ label: id, value: id }));
      defaultModel.value = models[0];
      return;
    }
  } catch {
    // 能力清单失败时回退到 modelsUrl /v1/models（ReChat 内部拉取）
  }
  chatModels.value = [];
};

onMounted(() => {
  loadModels();
});
</script>

<style scoped>
.ai-view {
  height: 100%;
  padding: var(--ai-spacing-md);
  box-sizing: border-box;
  overflow: hidden;
}
.ai-view__container {
  height: 100%;
  border-radius: var(--ai-card-radius);
  overflow: hidden;
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
}
</style>
