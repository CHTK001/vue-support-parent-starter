<template>
  <div class="common-layout overflow-hidden">
    <ModuleUpdateDialog ref="moduleUpdateDialogRef" @success="handleRefreshEnvironment"></ModuleUpdateDialog>
    <ModuleDialog ref="moduleDialogRef" @success="handleRefreshEnvironment"></ModuleDialog>
    <el-button :icon="useRenderIcon('ep:setting')" @click="handleOpenModuleManager" class="fixed right-0 top-1/2 sidebar-custom-v2 z-[99]" circle size="large" type="primary"> </el-button>
    <el-container class="overflow-hidden">
      <el-main class="overflow-hidde">
        <chat :form="form" :env="env"></chat>
      </el-main>
      <el-aside style="height: 100%; border-right: 1px solid var(--el-border-color); width: var(--aside-width)" class="p-4 overflow-auto" id="aside">
        <div class="w-full flex justify-end mb-4">
          <el-icon :size="22" @click="handleTrigger" class="cursor-pointer">
            <component :is="useRenderIcon('mdi:menu-open')" v-if="settingOpen" />
            <component :is="useRenderIcon('mdi:menu-close')" v-else />
          </el-icon>
        </div>
        <el-form :model="form" :rules="rules" v-if="settingOpen">
          <el-form-item label="模型" prop="model">
            <div class="flex justify-start w-full">
              <el-select v-model="form.model" placeholder="请选择模型" clearable @change="handleChangeModule">
                <el-option v-for="item in modelList" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                  <template #default>
                    <span class="flex justify-between">
                      <span>{{ item.sysAiModuleName }}</span>
                      <span class="el-form-item-msg">{{ item.sysProjectName }}</span>
                    </span>
                  </template>
                </el-option>
              </el-select>
              <el-button v-if="env.showEdit" class="ml-1 btn-text" :icon="useRenderIcon('ep:plus')" @click="handleOpenModule"></el-button>
            </div>
          </el-form-item>
          <el-form-item label="角色设定" prop="system" v-if="showRoleSetting">
            <el-input :rows="10" type="textarea" placeholder="此处需要填写的是大模型的角色属性，示例：你是一个专业的商业文案专家" v-model="form.system"></el-input>
          </el-form-item>

          <el-form-item prop="tokens">
            <div>max_tokens（回复长度限制）</div>
            <div class="flex justify-start w-full">
              <el-slider :min="1" :max="8192" v-model="form.tokens"></el-slider>
              <el-input-number :min="1" :max="8192" v-model="form.tokens"></el-input-number>
            </div>
            <span class="el-form-item-msg">单位为tokens，1tokens 约等于1.5个中文汉字或者 0.8个英文单词</span>
          </el-form-item>

          <el-form-item prop="topK">
            <div>top-k（灵活度）</div>
            <div class="flex justify-start w-full">
              <el-slider :min="1" :max="16" v-model="form.topK"></el-slider>
              <el-input-number :min="1" :max="16" v-model="form.topK"></el-input-number>
            </div>
            <span class="el-form-item-msg">平衡生成文本的质量和多样性，较小的 k 值会减少随机性，使得输出更加稳定；而较大的 k 值会增加随机性，产生更多新颖的输出。取值范围[1, 6]，默认为4</span>
          </el-form-item>

          <el-form-item prop="temperature">
            <div>temperature（随机性）</div>
            <div class="flex justify-start w-full">
              <el-slider :min="0.1" :max="1" v-model="form.temperature" :step="0.1"></el-slider>
              <el-input-number :min="0.1" :max="1" v-model="form.temperature" :step="0.1"></el-input-number>
            </div>
            <span class="el-form-item-msg">核采样阈值，用于决定结果随机性，取值越高随机性越强，即相同的问题得到的不同答案的可能性越高。取值范围 (0，1]，默认为0.5</span>
          </el-form-item>
        </el-form>
      </el-aside>
    </el-container>
  </div>
</template>
<script setup>
import { fetchListProjectForAiModule } from "@/api/manage/project-ai-module";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, nextTick, defineAsyncComponent, onMounted, shallowRef, computed } from "vue";
import { useRoute } from "vue-router";

const chat = defineAsyncComponent(() => import("./chat.vue"));
const ModuleUpdateDialog = defineAsyncComponent(() => import("./module-update.vue"));
const ModuleDialog = defineAsyncComponent(() => import("./module.vue"));
const settingOpen = shallowRef(false);
const form = reactive({
  tokens: 2048,
  topK: 4,
  temperature: 0.5,
  sysAiModuleType: "LLM",
});
const moduleUpdateDialogRef = shallowRef();
const moduleDialogRef = shallowRef();
const modelList = shallowRef([]);
const env = {};
const rules = {
  model: [{ required: true, message: "请选择模型", trigger: "change" }],
  tokens: [{ required: true, message: "请输入tokens", trigger: "change" }],
  topK: [{ required: true, message: "请输入topK", trigger: "change" }],
  temperature: [{ required: true, message: "请输入temperature", trigger: "change" }],
};
const route = useRoute();

const showRoleSetting = computed(() => {
  const item = modelList.value.filter((it) => (it.sysAiModuleId = form.model));
  return item ? item?.[0]?.sysAiModuleRoleSetting : 0;
});

const handleChangeModule = async (value) => {
  const _item = modelList.value.find((it) => it.sysAiModuleCode === value);
  env.sysProjectId = _item.sysProjectId;
  env.sysProjectName = _item.sysProjectName;
  form.sysProjectId = _item.sysProjectId;
  form.sysProjectName = _item.sysProjectName;
};
const handleTrigger = async () => {
  settingOpen.value = !settingOpen.value;
  window.aside.style.setProperty("--aside-width", settingOpen.value ? "400px" : "55px");
};
const handleModule = async (data) => {
  const one = modelList.value.filter((it) => (it.sysAiModuleId = data));
  form.model = one.sysAiModuleCode;
};
const onAfterProperieSet = () => {
  const query = route.query;
  env.sysProjectId = query.sysProjectId;
  env.showEdit = !!env.sysProjectId;
  env.sysProjectName = query.sysProjectName;
  form.sysProjectId = env.sysProjectId;
  form.sysProjectName = env.sysProjectName;
};

const handleOpenModule = async () => {
  moduleUpdateDialogRef.value.handleOpen(form, "add");
};
const handleOpenModuleManager = async () => {
  moduleDialogRef.value.handleOpen(form, "add");
};
const handleRefreshEnvironment = async () => {
  await initialModuleList();
};
const initialModuleList = async () => {
  const { data } = await fetchListProjectForAiModule(form);
  modelList.value = data;
  if (modelList.value.length == 1) {
    form.model = modelList.value[0].sysAiModuleCode;
  }
};

onMounted(async () => {
  onAfterProperieSet();
  initialModuleList();
  handleTrigger();
});
</script>
<style scoped>
html,
body {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
}
:deep(.el-main) {
  padding: 0;
}

.common-layout {
  height: 100%;
}

#chat {
  height: calc(100vh - 150px);
}

.el-input {
  height: 45px;
  border-radius: 12px;
  box-sizing: border-box;
}
</style>
