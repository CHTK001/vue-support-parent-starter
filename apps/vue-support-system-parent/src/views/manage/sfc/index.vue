<template>
  <div>
    <el-header class="flex !justify-end">
      <el-form :model="form" :inline="true">
        <el-form-item label="组件名称">
          <el-input v-model="form.sysSfcName" placeholder="请输入组件名称" />
        </el-form-item>
        <el-form-item label="我的组件" prop="sysSfcInstall">
          <el-switch v-model="form.sysSfcInstall" :active-value="1" :inactive-value="0" @click="onSearch" />
        </el-form-item>

        <el-form-item>
          <el-button :icon="useRenderIcon('ep:search')" type="primary" @click="onSearch" />
          <el-button :icon="useRenderIcon('ep:plus')" @click="doSave({}, 'save')" />
        </el-form-item>
      </el-form>
    </el-header>
    <ScCard ref="scCard" :params="form" :url="fetchPageSfc" :appendable="true" :hiddenAppend="form.sysSfcInstall == 1">
      <template #default="{ row }">
        <div class="task-item relative !h-full">
          <div class="toolbar">
            <el-switch v-model="row.sysSfcStatus" inline-prompt :active-value="1" active-text="激活" :inactive-value="0" inactive-text="禁用" class="pl-4 z-[100]" @change="doChange(row)" />
          </div>
          <el-row class="relation" style="min-height: 128px">
            <el-col :span="8" class="h-full cursor-pointer" @click="doSave(row, 'edit')">
              <div>
                <el-icon :style="{ 'font-size': '100px', color: row.sysSfcStatus == 1 ? '#5ca8ea' : '#999', 'margin-top': '4px' }">
                  <component :is="useRenderIcon(row.sysSfcIcon)" />
                </el-icon>
                <el-tag v-if="row.sysSfCategory" effect="light">{{ row.sysSfCategory }}</el-tag>
              </div>
            </el-col>
            <el-col :span="16">
              <ul>
                <li class="pt-1">
                  <p>组件名称</p>
                  <el-tag class="cursor-pointer" @click="doOpenUrl(row)">
                    <span>{{ row.sysSfcName }}({{ row.sysSfcChineseName }})</span>
                  </el-tag>
                </li>
                <li>
                  <p>组件说明</p>
                  <p>
                    <el-tag v-if="row.sysSfcDesc" effect="light">{{ row.sysSfcDesc }}</el-tag>
                    <el-tag v-else>暂无描述</el-tag>
                  </p>
                </li>
              </ul>
            </el-col>
          </el-row>
          <div class="bottom">
            <div class="left-state">
              <el-tag v-if="row.sysSfcInstall === 1" class="mr-4">
                <span>已安装</span>
              </el-tag>
            </div>
            <div class="state">
              <el-popconfirm v-if="row.sysSfcInstall === 0" title="确定安装吗？" @confirm="doInstall(row)">
                <template #reference>
                  <el-button :loading="startDialogStatus" circle size="small" :icon="useRenderIcon('ri:install-line')" style="font-size: 16px" class="cursor-pointer" title="安装" />
                </template>
              </el-popconfirm>
              <el-popconfirm v-else title="确定取消安装吗？" @confirm="doUninstall(row)">
                <template #reference>
                  <el-button :loading="startDialogStatus" circle size="small" :icon="useRenderIcon('ri:unpin-line')" style="font-size: 16px" class="cursor-pointer" title="卸载" />
                </template>
              </el-popconfirm>

              <el-button :loading="startDialogStatus" circle size="small" :icon="useRenderIcon('ri:eye-2-fill')" style="font-size: 16px" class="cursor-pointer mr-2" title="预览" @click="doView(row)" />
              <span v-roles="['ADMIN', 'SUPER_ADMIN']">
                <el-button v-if="row.sysSfcType == 0" :loading="startDialogStatus" circle size="small" :icon="useRenderIcon('ep:upload')" style="font-size: 16px" class="cursor-pointer mr-2" title="上传组件" @click="doUpload(row)" />
              </span>

              <el-popconfirm :title="$t('message.confimDelete')" @confirm="doDelete(row)">
                <template #reference>
                  <el-button :loading="startDialogStatus" circle size="small" :icon="useRenderIcon('ep:delete')" type="danger" style="font-size: 16px" class="cursor-pointer" title="删除" />
                </template>
              </el-popconfirm>
            </div>
          </div>
        </div>
      </template>
    </ScCard>

    <SaveLayout ref="saveRef" @success="onSearch" @close="visible.save = false" />
    <ViewLayout ref="viewRef" @close="visible.view = false" />
    <UploadLayout ref="uploadRef" @close="visible.upload = false" />
  </div>
</template>
<script setup>
import ScCard from "@repo/components/ScCard/index.vue";
import { fetchDeleteSfc, fetchInstallSfc, fetchPageSfc, fetchUpdateSfc, fetchUninstallSfc } from "@repo/core";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import SaveLayout from "./save.vue";
import ViewLayout from "./view.vue";
import UploadLayout from "./upload.vue";
import { reactive, ref, nextTick } from "vue";
import { message } from "@repo/utils";

const saveRef = ref();
const uploadRef = ref();
const viewRef = ref();
const scCard = ref();
const startDialogStatus = ref(false);
const form = reactive({});

const visible = reactive({
  save: false,
  upload: false,
  view: false,
});

const onSearch = async () => {
  scCard.value.refresh(form);
};

const doUninstall = async (item) => {
  fetchUninstallSfc(item).then((res) => {
    if (res && res.code == "00000") {
      message("卸载成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};

const doInstall = async (item) => {
  fetchInstallSfc(item).then((res) => {
    if (res && res.code == "00000") {
      message("安装成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};
/**
 * 删除
 */
const doDelete = async (item) => {
  fetchDeleteSfc({ sysSfcId: item.sysSfcId }).then((res) => {
    if (res && res.code == "00000") {
      message("删除成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};

const doChange = async (item) => {
  fetchUpdateSfc(item).then((res) => {
    if (res && res.code == "00000") {
      message("修改成功", { type: "success" });
      onSearch();
    } else {
      message(res?.msg, { type: "error" });
    }
  });
};

const doUpload = async (item) => {
  visible.upload = true;
  await nextTick();
  uploadRef.value.setData(item);
  uploadRef.value.open();
};
const doView = async (item) => {
  visible.view = true;
  await nextTick();
  viewRef.value.setData(item);
  viewRef.value.open();
};
const doSave = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveRef.value.setData(item);
  saveRef.value.open(mode);
};
</script>
<style lang="scss" scoped>
.task-item {
  .bottom {
    height: 40px;
  }

  .toolbar {
    position: absolute;
    display: flex;
    justify-items: flex-end;
    right: 0;
    top: 0;
  }

  .bottom > .left-state {
    text-align: left;
    padding-top: 10px;
    display: flex;
    position: absolute;
    width: 100%;
    bottom: 0%;
    justify-content: left;
    align-items: flex-start;
  }

  .bottom > .state {
    border-top: 1px solid var(--el-border-color-light);
    text-align: right;
    padding-top: 10px;
    display: flex;
    position: absolute;
    width: 100%;
    bottom: 0%;
    justify-content: right;
    align-items: flex-end;
  }
}
</style>
