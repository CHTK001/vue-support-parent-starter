<template>
  <div class="p-4">
    <div class="w-full flex justify-between mb-4">
      <el-button :icon="useRenderIcon('ri:add-fill')" @click="onSave({}, 'save')" />
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
              <div :class="['list-card-item_detail--logo', { 'list-card-item_detail--logo__disabled': row?.genBackupStatus == 0 }]">
                <el-icon class="bg-transparent">
                  <component :is="getIcon(row)" />
                </el-icon>
              </div>
              <div />
              <div />
              <div />
              <div />
              <el-tag :color="row?.genBackupStatus != 0 ? '#00a870' : '#ccc'" effect="dark" class="mx-1 list-card-item_detail--operation--tag">
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
            <p class="list-card-item_detail--desc text-text_color_regular pt-[8px] !h-[24px]">{{ row?.genHost }}:{{ row.genPort }}</p>
            <p class="list-card-item_detail--name text-text_color_primary">
              <span>{{ row?.genName }}</span>
              <span v-if="row.isFileDriver == true" class="text-gray-400 text-sm pl-10">
                {{ row.genDatabaseFileName }}
              </span>
            </p>
            <p class="list-card-item_detail--desc text-text_color_regular truncate break-words text-ellipsis">
              {{ row?.genDesc }}
            </p>
            <div class="flex flex-1 pt-2">
              <el-button size="small" circle :icon="useRenderIcon('humbleicons:documents')" title="文档" />
              <el-button v-if="row?.genBackupStatus == 0" size="small" circle :icon="useRenderIcon('ri:lock-unlock-line')" title="开启备份" />
              <el-button v-else size="small" circle :icon="useRenderIcon('ri:lock-2-line')" title="停止备份" />
            </div>
          </div>
        </div>
      </template>
    </ScCard>
    <save v-if="visible.saveVisible" ref="saveRef" />
  </div>
</template>
<script setup>
import ScCard from "@/components/ScCard/index.vue";
import { fetchGenDatabaseDelete, fetchGenDatabasePage } from "@/api/monitor/gen/database";
import { nextTick, reactive, ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Save from "./save.vue";
import { message } from "@/utils/message";
import { router } from "@/router";
import { Base64 } from "js-base64";

const searchParams = reactive({
  page: 1,
  pageSize: 10,
  searchValue: ""
});

const visible = reactive({
  saveVisible: false
});

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

  if (!row.genJdbcType) {
    return useRenderIcon("devicon:aarch64");
  }
  return useRenderIcon("devicon:" + row.genJdbcType?.toLowerCase()) || useRenderIcon("simple-icons:" + row.genJdbcType?.toLowerCase());
};
const handleClickDelete = async row => {
  fetchGenDatabaseDelete({ id: row.genId }).then(res => {
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
  height: 180px;
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
      -webkit-line-clamp: 2;
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
