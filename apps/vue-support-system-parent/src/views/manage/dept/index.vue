<script setup>
import { fetchDeleteDept, fetchListDept, fetchUpdateDept } from '@/api/manage/dept';
import { debounce } from '@pureadmin/utils';
import { useRenderIcon } from '@repo/components/ReIcon/src/hooks';
import { router } from '@repo/core';
import { Base64 } from 'js-base64';
import { defineAsyncComponent, onMounted, reactive, shallowRef } from 'vue';
const SaveDialog = defineAsyncComponent(() => import('./save.vue'));

const tableData = shallowRef([]);
const form = reactive({
  sysDeptName: null
});
const saveDialogRef = shallowRef(null);
const loadData = async () => {
  fetchListDept(form).then(res => {
    tableData.value = res.data;
  })
};

const handleEdit = async (row, mode) => {
  saveDialogRef.value.setData(row)
    .setTableData(tableData.value)
    .open(mode)
}

const handleDelete = async row => {
  fetchDeleteDept(row.sysDeptId).then(res => {
    loadData();
  })
}

const handleSearchUser = async (row) => {
  router.push({
    name: 'user',
    query: {
      data: Base64.encode(JSON.stringify({
        sysDeptId: row.sysDeptId
      }))
    }
  });
}
const handleOpenDetail = async (row, column, event) => {
  if (row.children && column.label != "操作") {
    if (event.currentTarget.querySelector(".el-table__expand-icon")) {
      event.currentTarget.querySelector(".el-table__expand-icon").click();
    }
  }
};

const handleUpdate = async (row) => {
  fetchUpdateDept(row).then(res => {
    loadData();
  })
}
onMounted(async () => {
  loadData();
})
</script>

<template>
  <div class="w-full h-full p-1">
    <el-header>
      <div class="left-panel">
        <!-- <el-form :model="form" :inline="true">
          <el-form-item label="机构名称">
            <el-input v-model="form.sysDeptName" placeholder="机构名称" clearable></el-input>
          </el-form-item>
        </el-form> -->
      </div>
      <div class="right-panel">
        <div class="right-panel-search">
          <el-button type="primary" :icon="useRenderIcon('ep:search')" @click="debounce(loadData(), 1000, true)" />
          <el-button :icon="useRenderIcon('ep:plus')" @click="
            handleEdit({}, 'save')
            " />
        </div>
      </div>
    </el-header>
    <ScTable ref="tableRef" :data="tableData" row-key="sysDeptId" @row-click="handleOpenDetail">
      <el-table-column label="序号" prop="sysDeptId"></el-table-column>
      <el-table-column label="路径" prop="sysDeptTreeId"></el-table-column>
      <el-table-column label="机构名称" prop="sysDeptName" width="300px">
        <template #default="{ row }">
          <div class="flex justify-between items-start">
            <p>{{ row.sysDeptName }}</p>
            <div class="el-form-item-msg">
              <span>{{ row.sysDeptCode }}</span>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="排序" prop="sysDeptSort">
        <template #default="{ row }">
          <div class="flex justify-between items-start">
            <el-tag v-if="row.sysDeptSort">{{ row.sysDeptSort }}</el-tag>
            <span v-else>-</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="是否禁用" prop="sysDeptStatus">
        <template #default="{ row }">
          <el-segmented @change="handleUpdate(row)" v-model="row.sysDeptStatus" :options="[{
            label: '启用',
            value: 0
          }, {
            label: '禁用',
            value: 1
          }]">

          </el-segmented>
        </template>
      </el-table-column>

      <el-table-column label="备注" prop="sysDeptRemark" show-overflow-tooltip />

      <el-table-column label="创建时间" prop="createTime">
        <template #default="{ row }">
          <div class="flex justify-between items-start">
            <el-tag>{{ row.createTime }}</el-tag>
            <div class="el-form-item-msg">
              <span>{{ row.createName }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="更新时间" prop="updateTime">
        <template #default="{ row }">
          <div class="flex justify-between items-start">
            <el-tag v-if="row.updateTime">{{ row.updateTime }}</el-tag>
            <span v-else>-</span>
            <div class="el-form-item-msg">
              <span>{{ row.updateName }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200px" fixed="right">
        <template #default="{ row }">
          <el-button class="btn-text" :icon="useRenderIcon('ep:edit-pen')" @click="handleEdit(row, 'edit')"></el-button>
          <el-button class="btn-text" :icon="useRenderIcon('line-md:plus')" @click="
            handleEdit(
              {
                sysDeptPid: row.sysDeptId
              },
              'save'
            )
            "></el-button>
          <el-button class="btn-text" :icon="useRenderIcon('line-md:account')" @click="
            handleSearchUser(row)
            "></el-button>
          <el-popconfirm :title="$t('message.confimDelete')" @confirm="handleDelete(row)">
            <template #reference>
              <el-button class="btn-text" type="danger" :icon="useRenderIcon('ep:delete')"></el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </ScTable>
    <SaveDialog ref="saveDialogRef" @success="loadData"></SaveDialog>
  </div>
</template>