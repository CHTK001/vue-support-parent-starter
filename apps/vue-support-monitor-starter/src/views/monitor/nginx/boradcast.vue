<template>
  <div>
    <el-drawer v-model="visible" :title="config.title" draggable :close-on-click-modal="false" @close="handleClose">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="名称" prop="monitorNginxConfigName">
          <el-input v-model="form.monitorNginxConfigName" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="配置文件路径" prop="monitorNginxConfigPath">
          <ScFile key="monitorNginxConfigPath" v-model="form.monitorNginxConfigPath" class="w-full" :url="fetchListFileSystem" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="运行文件路径" prop="monitorNginxConfigNginxPath">
          <ScFile key="monitorNginxConfigNginxPath" v-model="form.monitorNginxConfigNginxPath" class="w-full" placeholder="请输入地址" :url="fetchListFileSystem" />
        </el-form-item>
        <el-form-item label="工作进程数" prop="monitorNginxConfigWorkerProcesses">
          <el-input v-model="form.monitorNginxConfigWorkerProcesses" placeholder="请输入工作进程数" type="number" />
        </el-form-item>
        <el-form-item label="错误文件路径" prop="monitorNginxConfigErrorLog">
          <ScFile key="monitorNginxConfigErrorLog" v-model="form.monitorNginxConfigErrorLog" class="w-full" :url="fetchListFileSystem" placeholder="请输入错误文件路径" />
        </el-form-item>
        <el-form-item label="PID文件路径" prop="monitorNginxConfigPid">
          <ScFile key="monitorNginxConfigPid" v-model="form.monitorNginxConfigPid" class="w-full" :url="fetchListFileSystem" placeholder="请输入PID文件路径" />
        </el-form-item>
        <el-form-item label="是否为多存储" prop="monitorNginxConfigMultipart">
          <el-switch v-model="form.monitorNginxConfigMultipart" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" :loading="config.confirmLoading" @click="handleUpdate">确 定</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { fetchSaveNginxConfig, fetchUpdateNginxConfig } from "@/api/monitor/nginx";
import { fetchListFileSystem } from "@/api/monitor/filesystem";
import { message } from "@repo/utils";
import { defineExpose, reactive, ref, defineAsyncComponent } from "vue";
const ScFile = defineAsyncComponent(() => import("@repo/components/ScFile/index.vue"));
const config = {
  title: "测试",
  mode: "add",
  confirmLoading: false
};
const formRef = ref();
let form = reactive({});
const rules = {};

const visible = ref(false);

const handleUpdate = async () => {
  formRef.value.validate(async valid => {
    if (valid) {
      config.confirmLoading = true;
      if (config.mode === "add") {
        fetchSaveNginxConfig(form)
          .then(res => {
            if (res.code == "00000") {
              message("保存成功", { type: "success" });
              handleClose();
            }
          })
          .finally(() => {
            config.confirmLoading = false;
          });
        return;
      }

      fetchUpdateNginxConfig(form)
        .then(res => {
          if (res.code == "00000") {
            message("修改成功", { type: "success" });
            handleClose();
          }
        })
        .finally(() => {
          config.confirmLoading = false;
        });
    }
  });
};

const handleClose = async () => {
  visible.value = false;
  form = reactive({});
  formRef.value.resetFields();
};
const handleOpen = async (mode, data) => {
  visible.value = true;
  config.mode = mode;
  Object.assign(form, data);
  if (mode === "edit") {
    config.title = `修改配置${data.monitorNginxConfigName}`;
  } else {
    config.title = `添加配置${data.monitorNginxConfigName || ""}`;
    form.monitorNginxConfigWorkerProcesses = 8;
  }
};

defineExpose({
  handleOpen
});
</script>
