<template>
  <div class="main background-color">
    <!-- <SaveDialog v-if="visible.save" ref="saveDialog" :sysSecretFunctions="sysSecretFunctions" :mode="saveDialogParams.mode" @success="onSearch()" @close="dialogClose" /> -->
    <el-container>
      <el-header>
        <div class="left-panel">
          <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto">
            <el-form-item label="项目分组" prop="sysProjectName">
              <el-input v-model="form.sysProjectName" placeholder="请输入项目分组" clearable class="!w-[180px]" />
            </el-form-item>

            <el-form-item label="项目编码" prop="SysProjectCode">
              <el-input v-model="form.SysProjectCode" placeholder="请输入项目编码" clearable class="!w-[180px]" />
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ri:search-line')" @click="handleRefresh()" />
            <el-button :icon="useRenderIcon('ep:plus')" @click="handleSave('add', {})" />
          </div>
        </div>
      </el-header>
      <el-main>
        <ScArticleSlot ref="tableRef" :url="fetchPageProject" :rowClick="handleRowClick" :afterLoadedData="handleAfterLoadedData">
          <template #top="{ row }">
            <el-image :src="row.sysProjectIcon" fit="scale-down" lazy class="w-full h-full">
              <template #error>
                <el-icon class="el-icon--broken center" size="64">
                  <component :is="useRenderIcon('ri:image-2-line')" />
                </el-icon>
              </template>
            </el-image>
            <div class="type">
              <el-tag type="primary" class="mx-[2px]">{{ row.sysProjectName }}</el-tag>
              <el-tag type="success" v-for="item in row.sysProjectFunctionDefaultLabel?.split(',')" :key="item" class="mx-[2px]">
                {{ item }}
              </el-tag>
            </div>
            <div class="type2">
              <!-- <el-tooltip :rawContent="true" :content="getFunctionLabel(row.sysProjectFunction)">
                <el-button size="small" circle :icon="useRenderIcon('ri:price-tag-3-line')"></el-button>
              </el-tooltip> -->
              <template v-for="item in row.sysProjectFunction?.split(',') || []">
                <el-tooltip :content="functionMap[item]?.sysDictItemName">
                  <el-button type="primary" size="small" circle v-if="functionMap[item]" :icon="useRenderIcon(functionMap[item]?.sysDictItemIcon)"> </el-button>
                </el-tooltip>
              </template>
            </div>
          </template>

          <template #title="{ row }">
            <el-text>{{ row.monitorMqttServerName }}</el-text>
          </template>

          <template #bottom="{ row }">
            <el-text>{{ row.createTime }}</el-text>
          </template>

          <template #option="{ row }">
            <el-button-group v-if="row.sysProjectFunction" class="ml-[1px]">
              <el-button v-if="row.source?.length > 0" :icon="useRenderIcon('ri:landscape-ai-fill')" title="设置默认" size="small" @click.stop="handleDefault(row)" />
              <el-dropdown class="!z-[99] border-right-color" trigger="click" placement="right" @command.stop="handleCommand">
                <el-button :icon="useRenderIcon('ri:more-2-line')" size="small" title="更多" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="defer(0) && row.source?.length > 0" class="h-[32px]" :icon="useRenderIcon('ri:settings-5-line')">
                      <el-dropdown class="z-[100]" placement="right">
                        <el-text class="w-full">设置默认</el-text>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item v-for="(item1, index) in row.source" :key="index" @click.prevent="handleUpdateDefault(row, item1)">
                              {{ item1.name }}
                              <span v-if="item1.label">√</span>
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="defer(1)" class="h-[32px]" v-for="(item1, index) in row.source" :key="index" :icon="useRenderIcon(item1.icon)" @click="handleEventCustom(row, item1)">
                      {{ item1.name }}
                      <span v-if="item1.name.length < 4">{{ $t("message.manage") }}</span>
                    </el-dropdown-item>
                    <el-dropdown-item v-if="defer(3)" class="h-[32px]" :icon="useRenderIcon('ep:copy-document')" @click.stop="handleCopy(row, 'save')"> 复制 </el-dropdown-item>
                    <el-dropdown-item v-if="defer(2)" class="h-[32px]" :icon="useRenderIcon('ri:delete-bin-6-line')" @click.prevent="handleDelete(row)"> 删除 </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </el-button-group>
          </template>
        </ScArticleSlot>
      </el-main>
    </el-container>
    <SaveDialog ref="saveDialogRef" @success="handleRefresh" />
    <DefaultSetting ref="defaultSettingRef" @success="handleRefresh" />
  </div>
</template>
<script setup>
import { fetchPageProject, fetchUpdateProjectDefault, fetchDeleteProject } from "@/api/manage/project";
import { defineAsyncComponent, onMounted, reactive, ref, nextTick, computed, watch } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import SaveDialog from "./save.vue";
import { fetchListDictItem, router } from "@repo/core";
import { deepCopy, useDefer } from "@repo/utils";

import { message, stringSplitToNumber } from "@repo/utils";
const ScArticleSlot = defineAsyncComponent(() => import("@repo/components/ScArticleSlot/index.vue"));
const DefaultSetting = defineAsyncComponent(() => import("./defaultSetting.vue"));
const form = reactive({});
const defer = useDefer(4);

let dictItem = [];
let functionList = [];
let functionMap = {};
const saveDialogRef = ref();
const tableRef = ref();
const defaultSettingRef = ref();

const handleCommand = (event) => {
  event.stopPropagation();
};

const handleDelete = async (row) => {
  fetchDeleteProject({
    sysProjectId: row.sysProjectId,
  }).then((res) => {
    if (res.code === "00000") {
      message("删除成功", { type: "success" });
      tableRef.value.reload(form);
    }
  });
};

const handleUpdateDefault = async (row, item1) => {
  fetchUpdateProjectDefault({
    sysProjectId: row.sysProjectId,
    sysProjectDefaultType: item1.value,
    sysSetDefault: item1.label ? 0 : 1,
  }).then((res) => {
    if (res.code === "00000") {
      message(res.msg, { type: "success" });
      tableRef.value.updateData(
        res.data,
        (it) => it.sysProjectId == row.sysProjectId,
        (element, _updateData) => {
          deepCopy(element, _updateData);
          element.source = getDefaultValueArr(element);
        }
      );
    }
  });
};

const eventMap = {
  DA_YU_YAN: (row, item1) => {
    router.push({
      name: "llm-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  WEN_SHENG_TU: (row, item1) => {
    router.push({
      name: "aiVincent",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  WEN_SHENG_SHI_PIN: (row, item1) => {
    router.push({
      name: "aiVideo",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  SHE_BEI: (row, item1) => {
    router.push({
      name: "device-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  DUAN_XIN: (row, item1) => {
    router.push({
      name: "sms-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
  YOU_JIAN: (row, item1) => {
    router.push({
      name: "email-template",
      query: {
        sysProjectId: row.sysProjectId,
        sysProjectName: row.sysProjectName,
        sysProjectVender: item1.value,
      },
    });
  },
};

const handleEventCustom = async (row, item1) => {
  try {
    eventMap[item1.code](row, item1);
  } catch (error) {}
};

const getDefaultValueArr = (row) => {
  const defaultValue = {};
  const storeValues1 = stringSplitToNumber(row.sysProjectFunctionDefaultIds);
  storeValues1.forEach((element) => {
    defaultValue[element] = true;
  });
  const storeValues = stringSplitToNumber(row.sysProjectFunction);
  const rs = storeValues.map((item) => {
    return {
      label: !!defaultValue[item],
      value: item,
      name: functionMap[item]?.sysDictItemName,
      code: functionMap[item]?.sysDictItemCode,
      icon: functionMap[item]?.sysDictItemIcon,
    };
  });
  return rs.filter((it) => it.name);
};

const getLabel = (val) => {
  return functionMap[val]?.sysDictItemName;
};

const getFunctionLabel = (val) => {
  const _rs = (val?.split(",") || []).map((item) => {
    return `<div type="primary"  class="mx-[2px]">${getLabel(item)}</div>`;
  });
  return _rs.join("");
};
const handleAfterLoadedData = (row) => {
  row.forEach((item) => {
    item.source = getDefaultValueArr(item);
  });
  return row;
};
const handleAfterPropertieSet = async () => {
  fetchListDictItem({
    sysDictId: 1,
  }).then((res) => {
    dictItem = res?.data;
  });
  fetchListDictItem({
    sysDictId: 6,
  }).then((res) => {
    functionList = res?.data;
    functionList.forEach((item) => {
      functionMap[item.sysDictItemId] = item;
    });
  });
};

const handleDefault = async (data) => {
  defaultSettingRef.value.handleType(functionList);
  defaultSettingRef.value.handleOpen(data);
};
const handleSave = async (mode, data) => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleFunction(functionList);
  saveDialogRef.value.handleOpen(mode, data);
};
const handleCopy = async (row) => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleFunction(functionList);
  saveDialogRef.value.handleOpen("add", row);
};
const handleRefresh = async () => {
  tableRef.value.reload(form);
};

const handleRowClick = async (data) => {
  handleSave("edit", data);
};

onMounted(async () => {
  await handleAfterPropertieSet();
});
</script>
<style scoped>
.type {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 5px 4px;
  font-size: 12px;
  color: #000 !important;
}
.type2 {
  position: absolute;
  bottom: 5px;
  left: 0px;
  padding: 5px 4px;
  font-size: 12px;
  display: flex;
  color: #000 !important;
  div {
    height: 28px;
    line-height: 28px;
    border: 0;
    border-radius: 6px;
    font-weight: bold;
    transition: all 0s;
    padding: 0 8px;
    background-color: rgb(64, 158, 255) !important;
    color: white;
  }
}

.center {
  top: calc(50% - 32px);
  left: calc(50% - 32px);
}

.border-right-color {
  border: 1px soild var(--el-border-color);
}
</style>
