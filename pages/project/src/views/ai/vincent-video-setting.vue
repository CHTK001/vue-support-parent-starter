<template>
  <div>
    <el-dialog v-model="env.visible" :title="env.title" draggable :close-on-click-modal="false" @close="handleClose">
      <el-skeleton animated :loading="loadingConfig.loading">
        <template #default>
          <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
            <el-row>
              <el-col :span="24">
                <el-form-item label="模块名称" prop="sysAiModuleName">
                  <el-text>{{ form.sysAiModuleName }}</el-text>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item label="支持尺寸" prop="sysAiVincentSupportedSizeList">
                  <el-select multiple v-model="form.sysAiVincentSupportedSizeList" placeholder="请选择模块类型" clearable filterable allow-create>
                    <el-option v-for="item in env.sysAiVincentSupportedSize" :key="item" :label="item" :value="item" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="支持风格" prop="sysAiVincentSupportedStyleList">
                  <el-select multiple v-model="form.sysAiVincentSupportedStyleList" placeholder="请选择支持风格" clearable filterable allow-create>
                    <el-option v-for="item in env.sysAiVincentSupportedStyle" :key="item" :label="getStyleLabel(item)" :value="item" />
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="支持异步" prop="sysAiVincentSupportAsync">
                  <el-segmented
                    disabled
                    readonly
                    v-model="form.sysAiVincentSupportAsync"
                    :options="[
                      {
                        label: '支持',
                        value: 1,
                      },
                      {
                        label: '不支持',
                        value: 0,
                      },
                    ]"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="生成AI音效" prop="sysAiVincentSupportAudio">
                  <el-segmented
                    v-model="form.sysAiVincentSupportAudio"
                    :options="[
                      {
                        label: '支持',
                        value: 1,
                      },
                      {
                        label: '不支持',
                        value: 0,
                      },
                    ]"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="8">
                <el-form-item label="支持参考图" prop="sysAiVincentSupportRefImage">
                  <el-segmented
                    v-model="form.sysAiVincentSupportRefImage"
                    :options="[
                      {
                        label: '支持',
                        value: 1,
                      },
                      {
                        label: '不支持',
                        value: 0,
                      },
                    ]"
                  />
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="支持FPS" prop="sysAiVincentSupportFps">
                  <el-segmented
                    v-model="form.sysAiVincentSupportFps"
                    :options="[
                      {
                        label: '支持',
                        value: 1,
                      },
                      {
                        label: '不支持',
                        value: 0,
                      },
                    ]"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="输出Fps" prop="sysAiVincentSupportedFpsList" v-if="form.sysAiVincentSupportFps == 1">
                  <el-select v-model="form.sysAiVincentSupportedFpsList" placeholder="请选择FPS" multiple>
                    <el-option v-for="item in env.sysAiVincentSupportedFps" :key="item" :label="item" :value="item"> </el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="12">
                <el-form-item label="支持质量" prop="sysAiVincentSupportQuality">
                  <el-segmented
                    v-model="form.sysAiVincentSupportQuality"
                    :options="[
                      {
                        label: '支持',
                        value: 1,
                      },
                      {
                        label: '不支持',
                        value: 0,
                      },
                    ]"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="视频质量" prop="sysAiVincentSupportedQuality" v-if="form.sysAiVincentSupportQuality == 1">
                  <el-select v-model="form.sysAiVincentSupportedQuality" placeholder="请选择质量" multiple>
                    <el-option v-for="item in env.sysAiVincentSupportedQuality" :key="item.value" :label="item.label" :value="item.value"> </el-option>
                  </el-select>
                </el-form-item>
              </el-col>

              <el-col :span="24">
                <el-form-item label="输出张数" prop="sysAiVincentSupportedNumber">
                  <el-input-number readonly disabled v-model="form.sysAiVincentSupportedNumber" placeholder="请输入支持输出张数"></el-input-number>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </template>
      </el-skeleton>

      <template #footer>
        <el-button @click="env.visible = false">取 消</el-button>
        <el-button type="primary" @click="debounce(handleUpdate(), 1000, true)">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { debounce } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { defineEmits, defineExpose, reactive, shallowRef } from "vue";
import { fetchGetForModelSetting, fetchUpdateForModelSetting } from "../../api/ai/vincent-setting";
import { getStyleLabel } from "./vincent/hook";

const emit = defineEmits();
const rules = {
  sysAiVincentSupportedStyleList: [{ required: true, message: "请选择支持风格", trigger: "blur" }],
  sysAiVincentSupportedNumber: [{ required: true, message: "请输入支持输出张数", trigger: "blur" }],
  sysAiVincentSupportAsync: [{ required: true, message: "请选择是否支持异步", trigger: "blur" }],
  sysAiVincentSupportedFpsList: [{ required: true, message: "请选择支持FPS", trigger: "blur" }],
};
const loadingConfig = reactive({
  loading: false,
});
const formRef = shallowRef();
let form = reactive({
  sysAiVincentSupportedSizeList: [],
  sysAiVincentSupportedStyleList: [],
});
const env = reactive({
  visible: false,
  mode: "edit",
  title: "模块更新",
  sysAiVincentSupportedSize: new Set(["1024*1024", "720*1280", "768*1152", "1280*720", "512*1024", "576*1024", "1024*576"]),
  sysAiVincentSupportedStyle: new Set(["<auto>", "<photography>", "<portrait>", "<3d cartoon>", "<anime>", "<oil painting>", "<watercolor>", "<sketch>", "<chinese painting>", "<flat illustration>"]),
  sysAiVincentSupportedFps: new Set([25, 30, 60]),
  sysAiVincentSupportedQuality: new Set([
    {
      label: "质量优先",
      value: "quality",
    },
    {
      label: "速度优先",
      value: "speed",
    },
  ]),
});

const handleUpdate = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (form.sysAiVincentSupportedSizeList) {
        form.sysAiVincentSupportedSize = form.sysAiVincentSupportedSizeList.join(",");
      }
      if (form.sysAiVincentSupportedStyleList) {
        form.sysAiVincentSupportedStyle = form.sysAiVincentSupportedStyleList.join(",");
      }
      if (form.sysAiVincentSupportedFpsList) {
        form.sysAiVincentSupportedFps = form.sysAiVincentSupportedFpsList.join(",");
      }

      if (form.sysAiVincentSupportFps == 0) {
        form.sysAiVincentSupportedFps = "";
      }

      if (form.sysAiVincentSupportQuality == 0) {
        form.sysAiVincentSupportedQuality = "";
      }
      fetchUpdateForModelSetting(form).then((res) => {
        if (res.code == "00000") {
          message("修改成功", { type: "success" });
          emit("success", res?.data);
          handleClose();
        }
      });
      return;
    }
  });
};

const loadConfig = async (row) => {
  loadingConfig.loading = true;
  try {
    const { data } = await fetchGetForModelSetting({
      sysAiModuleId: row.sysAiModuleId,
    });
    Object.assign(form, data);
  } catch (error) {}
  loadingConfig.loading = false;
  form.sysAiModuleName = row.sysAiModuleName;
  form.sysAiModuleId = row.sysAiModuleId;
  form.sysAiVincentSupportAsync = 1;
  form.sysAiVincentSupportedNumber = 1;
  if (env.mode == "add") {
    form.sysApiModuleSort = 1;
    form.sysApiModuleSortList = [30];
  }

  form.sysAiVincentSupportFps = form.sysAiVincentSupportedFps ? 1 : 0;
  form.sysAiVincentSupportQuality = form.sysAiVincentSupportedQuality ? 1 : 0;
  if (form.sysAiVincentSupportedSize) {
    form.sysAiVincentSupportedSizeList = form.sysAiVincentSupportedSize.split(",");
    form.sysAiVincentSupportedSizeList.forEach((it) => {
      env.sysAiVincentSupportedSize.add(it);
    });
  }
  if (form.sysAiVincentSupportedStyle) {
    form.sysAiVincentSupportedStyleList = form.sysAiVincentSupportedStyle.split(",");
    form.sysAiVincentSupportedStyleList.forEach((it) => {
      env.sysAiVincentSupportedStyle.add(it);
    });
  }
  if (form.sysAiVincentSupportedFps) {
    form.sysAiVincentSupportFps = 1;
    form.sysAiVincentSupportedFpsList = form.sysAiVincentSupportedFps.split(",");
    form.sysAiVincentSupportedFpsList.forEach((it) => {
      env.sysAiVincentSupportedFps.add(it);
    });
  }
};
const handleClose = () => {
  env.visible = false;
  form = reactive({});
};

const handleOpen = async (item, mode) => {
  env.visible = true;
  env.title = "模块配置更新 - " + item.sysAiModuleName;
  env.mode = mode;
  loadConfig(item);
};

defineExpose({
  handleOpen,
  handleClose,
});
</script>
