<template>
  <el-aside style="height: 100%; width: var(--aside-width)" class="modern-aside" id="aside">
    <div>
      <div class="w-full flex justify-end mb-4 header-actions">
        <el-icon :size="35" @click="$emit('loadModule')" class="action-icon" v-if="settingOpen">
          <component :is="useRenderIcon('mdi:refresh')" />
        </el-icon>
        <el-icon :size="35" @click="$emit('handleTrigger')" class="action-icon toggle-icon" :class="{ 'left-2': !settingOpen }">
          <component :is="useRenderIcon('mdi:menu-open')" v-if="settingOpen" />
          <component :is="useRenderIcon('mdi:menu-close')" v-else />
        </el-icon>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" v-if="settingOpen" label-width="100px">
        <el-form-item label="模型名称" prop="model">
          <div class="flex justify-start w-full">
            <el-select filterable v-model="form.model" placeholder="请选择模型" clearable @change="$emit('handleChangeModule')">
              <el-option v-for="item in modelList" class="!h-[60px]" :key="item" :label="item.sysAiModuleName" :value="item.sysAiModuleCode">
                <template #default>
                  <el-tooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiModuleRemark || item.sysAiModuleName}</div>`">
                    <span class="flex justify-between py-2">
                      <el-image :src="item.sysProjectIcon" fit="scale-down" class="!h-[50px] !w-[50px] option-item">
                        <template #error>
                          <img :src="Error" />
                        </template>
                      </el-image>
                      <span class="justify-start content-center pl-1">{{ item.sysAiModuleName }}</span>
                      <span class="el-form-item-msg content-center">{{ item.sysProjectName }}</span>
                    </span>
                  </el-tooltip>
                </template>
              </el-option>
              <template #label="{ label }">
                <div class="flex justify-start">
                  <el-image class="!h-[24px] !w-[24px]" :src="modelSelectLabel?.sysProjectIcon" />
                  <span class="pl-2">{{ label }}</span>
                </div>
              </template>
            </el-select>
            <el-button v-if="env.showEdit" class="ml-1 btn-text" :icon="useRenderIcon('ep:plus')" @click="$emit('handleOpenModule')"></el-button>
          </div>
        </el-form-item>

        <el-form-item label="比例" prop="parameters.size" class="ration--GrtZmC3d">
          <el-radio-group v-model="form.parameters.size" class="flex justify-start items-start flex-wrap">
            <el-radio-button class="!ml-0 mt-1 mr-[12px] item" round :key="item" :value="item" v-for="(item, index) in formSetting.sysAiVincentSupportedSize?.split(',') || []">
              <template #default>
                <div class="flex justify-center align-middle">
                  <div class="text-center flex">
                    <i :style="{ 'aspect-ratio': getRatio(item) }" class="ai-generator_apsect_ratio_vis2__IHeeP"></i>
                    <span class="ml-1 text-center size-center">{{ item }}</span>
                  </div>
                </div>
              </template>
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="风格" prop="parameters.style" v-if="form.sysAiModuleType == 'VINCENT' && styleData.length > 0">
          <el-select v-model="form.parameters.style" placeholder="请选择风格">
            <el-option :key="item.sysAiVincentStyleCode" class="!h-[60px]" :label="item.sysAiVincentStyleName" :value="item.sysAiVincentStyleCode" v-for="item in styleData || []">
              <template #default>
                <el-tooltip placement="right" :raw-content="true" :content="`<div style='max-width: 300px'>${item.sysAiVincentStyleName}</div>`">
                  <span class="flex justify-between py-2">
                    <el-image :src="item.sysAiVincentStyleImage" fit="scale-down" class="!h-[50px] !w-[50px] option-item">
                      <template #error>
                        <img :src="Error" />
                      </template>
                    </el-image>
                    <span class="justify-start content-center pl-1">{{ item.sysAiVincentStyleName }}</span>
                    <span class="el-form-item-msg content-center">{{ item.sysAiVincentStyleCode }}</span>
                  </span>
                </el-tooltip>
              </template>
            </el-option>
            <template #label="{ label }">
              <div class="flex justify-start">
                <el-image class="!h-[24px] !w-[24px]" :src="modelSelectStyle" />
                <span class="pl-2">{{ label }}</span>
              </div>
            </template>
          </el-select>
        </el-form-item>

        <el-form-item label="正向提示词" prop="input.prompt">
          <el-input v-model="form.input.prompt" :rows="5" type="textarea" placeholder="正向提示词，用来描述生成图像中期望包含的元素和视觉特点。支持中英文，长度不超过800个字符，每个汉字/字母占一个字符，超过部分会自动截断。示例值：一只坐着的橘黄色的猫，表情愉悦，活泼可爱，逼真准确。"></el-input>
          <span
            class="item-parent-item"
            @click="
              () => {
                form.input.prompt = randomPrompt;
              }
            "
          >
            <span class="el-form-item-msg1" :title="randomPrompt">
              {{ randomPrompt }}
            </span>
            <el-icon class="cursor-pointer">
              <component :is="useRenderIcon('ep:refresh')" @click="$emit('handleRefreshRandom')" />
            </el-icon>
          </span>
        </el-form-item>

        <el-form-item label="反向提示词" prop="negativePrompt" v-if="form.sysAiModuleType == 'VINCENT'">
          <el-input v-model="form.input.negativePrompt" :rows="4" type="textarea" placeholder="反向提示词，用来描述不希望在画面中看到的内容，可以对画面进行限制。支持中英文，长度不超过500个字符，超过部分会自动截断。示例值：低分辨率、错误、最差质量、低质量、残缺、多余的手指、比例不良等。"></el-input>
        </el-form-item>

        <template v-if="formSetting.sysAiVincentSupportRefImage">
          <el-form-item label="参考图像" prop="refImg" v-if="form.sysAiModuleType == 'VINCENT'">
            <div class="flex w-full align-middle template">
              <el-image readonly :src="form.input.refImg" class="align-middle w-[40px] h-[40px]">
                <template #error>
                  <el-icon size="20">
                    <component :is="useRenderIcon('ep:plus')"></component>
                  </el-icon>
                </template>
              </el-image>
              <div class="flex-1 text-center text-template cursor-pointer template" @click="$emit('toggleRefImage')">选择模板</div>
              <div class="align-middle template">
                <el-icon size="20" class="align-middle">
                  <component :is="useRenderIcon('ep:arrow-right')"></component>
                </el-icon>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="参考图像" prop="refImg" v-if="form.sysAiModuleType == 'VIDEO'">
            <div class="flex w-full align-middle template">
              <el-select v-model="form.input.refImgType" clearable>
                <el-option value="URL" label="远程地址" />
                <el-option value="FILE" label="本地文件" />
              </el-select>
            </div>
            <template v-if="form.input.refImgType == 'URL'">
              <div class="flex justify-between gap-1 w-full">
                <el-input type="textarea" style="width: calc(100% - 80px)" :rows="3" v-model="form.input.refImg" placeholder="请输入远程地址"></el-input>
                <el-image fit="scale-down" class="block el-upload-list__item-thumbnail !h-[80px] !w-[80px] m-0" :src="form.input.refImg" alt="" />
              </div>
            </template>
            <el-upload accept="image/*" ref="elUploadRef" :limit="1" class="avatar-uploader justify-start" :auto-upload="false" v-else-if="form.input.refImgType == 'FILE'" :on-change="$emit('handleAvatarSuccess')">
              <el-icon class="avatar-uploader-icon">
                <component :is="useRenderIcon('ep:upload')" />
              </el-icon>
              <template #file="{ file }">
                <div class="relative" @click="$emit('handlePictureCardPreview', file)">
                  <img class="el-upload-list__item-thumbnail h-full w-[180px] m-0" :src="form.input.refImg" alt="" />
                  <span class="el-upload-list__item-actions cursor-pointer">
                    <el-button circle size="small" class="btn-text-blur !h-[20px] !w-[20px]" @click.stop="$emit('handleRemove', file)" :icon="useRenderIcon('ep:close')"> </el-button>
                  </span>
                </div>
              </template>
            </el-upload>
          </el-form-item>
        </template>

        <template v-if="form.sysAiModuleType == 'VIDEO' && formSetting.sysAiVincentSupportedQuality">
          <el-form-item label="生成模式" prop="parameters.quality" class="ration--GrtZmC3d">
            <el-radio-group v-model="form.parameters.quality" class="flex justify-start items-start flex-wrap">
              <el-radio-button class="!ml-0 mr-[12px] item" round :key="item" :value="item" v-for="(item, index) in formSetting.sysAiVincentSupportedQuality?.split(',') || []">
                <template #default>
                  <el-tooltip :content="getQuality(item).title">
                    <div class="flex justify-center align-middle">
                      <div class="text-center flex">
                        <el-icon>
                          <component :is="useRenderIcon(getQuality(item).icon)" />
                        </el-icon>
                        <span class="ml-1 text-center size-center">{{ getQuality(item).name }}</span>
                      </div>
                    </div>
                  </el-tooltip>
                </template>
              </el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="帧率" prop="parameters.fps" v-if="formSetting.sysAiVincentSupportedFps">
            <el-select v-model="form.parameters.fps">
              <el-option v-for="item in formSetting.sysAiVincentSupportedFps?.split(',') || []" :key="item" :value="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="AI音效" prop="parameters.withAudio" v-if="formSetting.sysAiVincentSupportAudio">
            <el-segmented
              v-model="form.parameters.withAudio"
              :options="[
                {
                  label: '开启',
                  value: 1,
                },
                {
                  label: '关闭',
                  value: 0,
                },
              ]"
            ></el-segmented>
          </el-form-item>
        </template>
        <el-form-item label="输出张数" prop="parameters.number"> <el-input-number :min="1" :max="formSetting.sysAiVincentSupportedNumber" :step="1" v-model="form.parameters.number" /> </el-form-item>

        <el-form-item class="flex justify-end">
          <el-button class="w-full" :loading="loadingConfig.export" @click="$emit('handleExport')" :icon="useRenderIcon('ri:export-fill')" title="生成" type="primary"></el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="overflow-hidde absolute w-[500px] top-0 ref-image p-3 z-50" v-click-outside="$emit('closePopup')" v-if="showRefImage && settingOpen">
      <div class="flex justify-end pb-5">
        <el-icon class="cursor-pointer" @click="$emit('closeRefImage')">
          <component :is="useRenderIcon('ep:close')"></component>
        </el-icon>
      </div>
      <el-row>
        <el-col :span="8" v-for="row in templateList" @click="$emit('selectTemplate', row)" class="cursor-pointer">
          <div class="flex flex-col gap-2 px-2 ref-image-item">
            <el-image :src="row.sysAiVincentTemplateAddress" fit="cover" class="img"></el-image>
            <div>
              <h2 class="text">{{ row.sysAiVincentTemplateName }}</h2>
            </div>
            <div class="el-form-item-msg">{{ row.sysAiVincentTemplateRemark }}</div>
          </div>
        </el-col>
      </el-row>
    </div>
  </el-aside>
</template>

<script setup>
import Error from "@repo/assets/images/error.png";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { getQuality } from "../hook";

defineProps({
  form: {
    type: Object,
    required: true,
  },
  formSetting: {
    type: Object,
    required: true,
  },
  rules: {
    type: Object,
    required: true,
  },
  settingOpen: {
    type: Boolean,
    required: true,
  },
  showRefImage: {
    type: Boolean,
    required: true,
  },
  loadingConfig: {
    type: Object,
    required: true,
  },
  modelList: {
    type: Array,
    required: true,
  },
  templateList: {
    type: Array,
    required: true,
  },
  styleData: {
    type: Array,
    required: true,
  },
  modelSelectLabel: {
    type: Object,
    default: null,
  },
  modelSelectStyle: {
    type: String,
    default: "",
  },
  randomPrompt: {
    type: String,
    required: true,
  },
  env: {
    type: Object,
    required: true,
  },
  getRatio: {
    type: Function,
    required: true,
  },
});

defineEmits(["loadModule", "handleTrigger", "handleChangeModule", "handleOpenModule", "handleRefreshRandom", "toggleRefImage", "handleAvatarSuccess", "handlePictureCardPreview", "handleRemove", "handleExport", "closePopup", "closeRefImage", "selectTemplate"]);
</script>

<style scoped>
/* 深色主题现代化样式 */
.modern-aside {
  background: linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.8),
    0 0 0 1px rgba(255, 255, 255, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
}

.modern-aside::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.6), rgba(59, 130, 246, 0.6), transparent);
}

.header-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.action-icon {
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 12px;
  border-radius: 16px;
  background: linear-gradient(145deg, #ffffff, #f1f5f9);
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.action-icon:hover {
  color: #6366f1;
  background: linear-gradient(145deg, #f8fafc, #e2e8f0);
  transform: translateY(-2px) scale(1.05);
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.action-icon:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 
    0 2px 4px -1px rgba(0, 0, 0, 0.1),
    inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.toggle-icon {
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ref-image {
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 20px;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.ref-image-item {
  padding: 16px;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.ref-image-item:hover {
  background: linear-gradient(145deg, #f8fafc, #e2e8f0);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateY(-4px);
  box-shadow: 
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.ref-image-item .img {
  width: 100%;
  height: 120px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.ref-image-item:hover .img {
  box-shadow: 0 8px 12px -2px rgba(0, 0, 0, 0.15);
}

.ref-image-item .text {
  font-size: 14px;
  font-weight: 600;
  margin: 8px 0 0 0;
  color: #374151;
  transition: color 0.3s ease;
}

.ref-image-item:hover .text {
  color: #6366f1;
}

/* 表单样式优化 */
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

:deep(.el-select) {
  border-radius: 12px;
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

:deep(.el-radio-button__inner) {
  border-radius: 10px;
  transition: all 0.3s ease;
}

:deep(.el-button) {
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-button:hover) {
  transform: translateY(-1px);
}

:deep(.el-button--primary) {
  background: linear-gradient(145deg, #6366f1, #4f46e5);
  border: none;
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(145deg, #4f46e5, #4338ca);
  box-shadow: 0 8px 12px -2px rgba(99, 102, 241, 0.4);
}
</style>
