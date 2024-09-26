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
    <ScCard :url="fetchGenDatabasePage" :params="searchParams">
      <template #default="{ row }">
        <div :class="['list-card-item', { 'list-card-item__disabled': row?.genBackupStatus != 1 }]">
          <div class="list-card-item_detail bg-bg_color">
            <div class="flex flex-1 justify-between">
              <div :class="['list-card-item_detail--logo', { 'list-card-item_detail--logo__disabled': row?.genBackupStatus != 1 }]">
                <el-icon>
                  <component :is="getIcon(row)" />
                </el-icon>
              </div>
              <el-tag :color="row?.genBackupStatus != 0 ? '#00a870' : '#eee'" effect="dark" class="mx-1 list-card-item_detail--operation--tag">
                {{ row?.genBackupStatus != 0 ? "已启用" : "已停用" }}
              </el-tag>
              <el-dropdown trigger="click" :disabled="row?.genBackupStatus != 1">
                <IconifyIconOffline :icon="useRenderIcon('ep:more-filled')" class="text-[24px]" />
                <template #dropdown>
                  <el-dropdown-menu :disabled="row?.genBackupStatus != 1">
                    <el-dropdown-item @click="handleClickManage(row)">管理</el-dropdown-item>
                    <el-dropdown-item @click="handleClickDelete(row)">删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            <p class="list-card-item_detail--name text-text_color_primary">
              {{ row?.genName }}
            </p>
            <p class="list-card-item_detail--desc text-text_color_regular">
              {{ row?.genDesc }}
            </p>
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
const searchParams = reactive({
  page: 1,
  pageSize: 10,
  searchValue: ""
});

const visible = reactive({
  saveVisible: false
});

const saveRef = ref(null);

const getIcon = row => {
  return useRenderIcon("ri:device-line");
};
const handleClickDelete = async row => {
  fetchGenDatabaseDelete({ id: row.genId }).then(res => {
    message(res.msg, { type: "success" }).then(() => {
      this.afterPrepertiesSet();
    });
  });
};

const handleClickManage = async row => {
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
  border-radius: 3px;

  &_detail {
    flex: 1;
    min-height: 140px;
    padding: 24px 32px;

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
      margin: 24px 0 8px;
      font-size: 16px;
      font-weight: 400;
    }

    &--desc {
      display: -webkit-box;
      height: 40px;
      margin-bottom: 24px;
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
