<template>
  <div class="p-4">
    <div class="w-full flex justify-between">
      <el-button :icon="useRenderIcon('ri:add-fill')" @click="onSave({}, 'add')" />
      <el-input v-model="searchParams.searchValue" style="width: 300px" placeholder="请输入名称" clearable>
        <template #suffix>
          <el-icon class="el-input__icon">
            <IconifyIconOffline v-show="searchParams.searchValue.length === 0" icon="ri:search-line" />
          </el-icon>
        </template>
      </el-input>
    </div>
    <ScCard ref="tableRef" :url="fetchGenDatabasePage" :params="searchParams" :span="4">
      <template #default="{ row }">
        <div :class="['list-card-item', { 'list-card-item__disabled': false }]">
          <div class="list-card-item_detail bg-bg_color">
            <div class="flex flex-1 justify-between">
              <div :class="['list-card-item_detail--logo1', { 'list-card-item_detail--logo__disabled': row?.genBackupStatus == 0 && row.supportBackup }]">
                <el-icon class="bg-transparent" size="40">
                  <component :is="getIcon(row)" />
                </el-icon>
              </div>
              <div />
              <div />
              <div />
              <div />
              <el-tag v-if="row.isFileDriver">文件</el-tag>
              <el-tag v-if="row.supportBackup" :color="row?.genBackupStatus != 0 ? '#00a870' : '#ccc'" effect="dark" class="mx-1 list-card-item_detail--operation--tag">
                {{ row?.genBackupStatus != 0 ? "备份启用" : "备份停用" }}
              </el-tag>
              <div>
                <div v-if="row?.genBackupStatus >= 0">
                  <el-dropdown trigger="click">
                    <el-icon>
                      <component :is="useRenderIcon('ri:more-2-fill')" class="text-[24px]" />
                    </el-icon>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="handleClickManage(row)">管理</el-dropdown-item>
                        <el-dropdown-item @click="handleClickEdit(row)">编辑</el-dropdown-item>
                        <el-dropdown-item @click="handleClickDelete(row)">删除</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
            <p v-if="row?.genHost" class="list-card-item_detail--desc text-text_color_regular pt-[8px] !h-[24px]">{{ row?.genHost }}:{{ row.genPort }}</p>
            <p class="list-card-item_detail--name text-text_color_primary">
              <span>{{ row?.genName }}</span>
              <span v-if="row.isFileDriver == true" class="text-gray-400 text-sm pl-10">
                {{ row.genDatabaseFileName }}
              </span>
            </p>
            <div class="flex flex-1 pt-2 justify-end">
              <ScLazy :time="200">
                <el-button v-if="row.isFileDriver" size="small" circle :icon="useRenderIcon('ri:upload-2-line')" title="上传数据文件" @click="handleUploadDataFile(row)" />
                <el-button v-if="row.isFileDriver && row.genDatabaseFile" size="small" circle :icon="useRenderIcon('ri:close-large-fill')" title="清除数据文件" @click="handleClearDataFile(row)" />
                <el-button v-if="row.genJdbcCustomType == 'JDBC'" size="small" circle :icon="useRenderIcon('humbleicons:code')" title="代码" @click="handleOpenCode(row)" />
                <el-button v-if="row.supportDocument" size="small" circle :icon="useRenderIcon('humbleicons:documents')" title="文档" @click="handleOpenDocument(row)" />
                <el-button v-if="row?.genBackupStatus == 0 && row.supportBackup" size="small" circle :icon="useRenderIcon('ri:lock-unlock-line')" title="开启备份" @click="handleOpenBackup(row)" />
                <el-button v-else-if="row.supportBackup" size="small" circle :icon="useRenderIcon('ri:lock-2-line')" title="停止备份" @click="handleCloseBackup(row)" />
              </ScLazy>
            </div>
          </div>
        </div>
      </template>
    </ScCard>
    <ScLazy :time="300">
      <save v-if="visible.saveVisible" ref="saveRef" @success="handlerSuccess" />
      <Document v-if="visible.documentVisible" ref="documentRef" />
      <Code v-if="visible.codeVisible" ref="codeRef" />
      <File ref="fileRef" @success="handlerSuccess" />
    </ScLazy>
  </div>
</template>
<script setup>
import Document from "./model/document.vue";
import Code from "./layout/jdbc/code/index.vue";
import ScCard from "@repo/components/ScCard/index.vue";
import ScLazy from "@repo/components/ScLazy/index.vue";

import { fetchGenDatabaseDelete, fetchGenDatabasePage, fetchGenDatabasUninstall } from "@/api/monitor/gen/database";
import { fetchGenBackupStart, fetchGenBackupStop } from "@/api/monitor/gen/backup";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import Save from "./save.vue";
import { message } from "@repo/utils";
import { router } from "@repo/core";
import { Base64 } from "js-base64";
const File = defineAsyncComponent(() => import("./plugin/file.vue"));
const documentRef = ref();
const codeRef = ref();

const searchParams = reactive({
  searchValue: ""
});

const visible = reactive({
  saveVisible: false,
  documentVisible: false,
  codeVisible: false
});

const fileRef = ref(null);
const saveRef = ref(null);
const tableRef = ref(null);

const getIcon = row => {
  if (row.genJdbcType == "POSTGRES") {
    return useRenderIcon("devicon:postgresql");
  }
  if (row.genJdbcType == "H2") {
    return useRenderIcon("devicon:hugo");
  }
  if (row.genJdbcType == "UCANACCESS") {
    return useRenderIcon("simple-icons:apachecassandra");
  }
  if (row.genJdbcType == "CALCITE") {
    return useRenderIcon("ri:database-2-line");
  }
  if (row.genType == "INFLUXDB") {
    return useRenderIcon("devicon:influxdb");
  }
  if (row.genType == "ZOOKEEPER") {
    return useRenderIcon("devicon:electron");
  }
  if (row.genType == "SHELL") {
    return useRenderIcon("devicon:powershell");
  }
  if (row.genType == "REDIS") {
    return useRenderIcon("devicon:redis");
  }
  if (row.genType == "MQTT") {
    return useRenderIcon("simple-icons:mqtt");
  }

  if (row.genType == "MONGODB") {
    return useRenderIcon("devicon:mongodb");
  }

  if (!row.genJdbcType) {
    return useRenderIcon("devicon:aarch64");
  }
  return useRenderIcon("devicon:" + row.genJdbcType?.toLowerCase()) || useRenderIcon("devicon:" + row.genType?.toLowerCase());
};
const handleClickDelete = async row => {
  fetchGenDatabaseDelete({ id: row.genId }).then(res => {
    tableRef.value.reload(searchParams);
    message(res.msg, { type: "success" });
  });
};

const handlerSuccess = async res => {
  tableRef.value.reload(searchParams);
};

/**
 * 上传数据文件
 */
const handleUploadDataFile = async row => {
  fileRef.value.setData(row).open();
};

/**
 * 清除数据文件
 */
const handleClearDataFile = async row => {
  fetchGenDatabasUninstall({
    genId: row.genId,
    type: "data"
  }).then(res => {
    if (res.code == "00000") {
      message("清除成功", { type: "success" });
      handlerSuccess();
      return;
    }
    message(res.msg, { type: "error" });
  });
};
/**
 * 打开文档
 */
const handleOpenDocument = async row => {
  visible.documentVisible = true;
  await nextTick();
  documentRef.value.setData(row).open();
};
const handleOpenCode = async row => {
  visible.codeVisible = true;
  await nextTick();
  codeRef.value.setData(row).open();
};
const handleOpenBackup = async row => {
  fetchGenBackupStart(row).then(res => {
    tableRef.value.reload(searchParams);
    message(res.msg, { type: "success" });
  });
};
const handleCloseBackup = async row => {
  fetchGenBackupStop(row).then(res => {
    tableRef.value.reload(searchParams);
    message(res.msg, { type: "success" });
  });
};

const handleClickManage = async row => {
  router.push({
    path: "/database/manage",
    query: {
      data: Base64.encode(JSON.stringify(row))
    }
  });
};
const handleClickEdit = async row => {
  onSave(row, "edit");
};
const onSave = async (row, mode) => {
  visible.saveVisible = true;
  await nextTick();
  saveRef.value.setData(row).open(mode);
};
</script>
<style scoped lang="scss">
.list-card-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
  overflow: hidden;
  cursor: pointer;
  height: 160px;
  border-radius: 3px;

  &_detail {
    flex: 1;
    min-height: 80px;
    padding: 12px 16px;
    padding-bottom: 0;

    &--logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 46px;
      height: 46px;
      font-size: 26px;
      color: #0052d9;
      background: #e0ebff;
      border-radius: 50%;

      &__disabled {
        color: #a1c4ff;
      }
    }

    &--operation {
      display: flex;
      height: 100%;

      &--tag {
        border: 0;
      }
    }

    &--name {
      margin: 12px 0 8px;
      font-size: 16px;
      font-weight: 400;
    }

    &--desc {
      display: -webkit-box;
      height: 20px;
      overflow: hidden;
      font-size: 12px;
      line-height: 20px;
      text-overflow: ellipsis;
      -webkit-box-orient: vertical;
    }
  }

  &__disabled {
    .list-card-item_detail--name,
    .list-card-item_detail--desc {
      color: var(--el-text-color-disabled);
    }

    .list-card-item_detail--operation--tag {
      color: #bababa;
    }
  }
}
</style>
