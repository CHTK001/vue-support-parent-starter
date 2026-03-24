<template>
  <sc-dialog
    v-model="visible"
    title="分组管理"
    width="700px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="group-manager">
      <!-- 工具栏 -->
      <div class="toolbar">
        <ScButton type="primary" @click="handleAdd">
          <IconifyIconOnline icon="ri:add-line" />
          新增分组
        </ScButton>
        <ScButton @click="handleInitDefault">
          <IconifyIconOnline icon="ri:refresh-line" />
          初始化默认分组
        </ScButton>
      </div>

      <!-- 分组列表 -->
      <ScTable :data="localGroups" row-key="sysFileSystemGroupId" border>
        <ScTableColumn 
          prop="sysFileSystemGroupName"
          label="分组名称"
          width="180"
        >
          <template #default="{ row }">
            <div class="group-name-cell">
              <IconifyIconOnline
                :icon="row.sysFileSystemGroupIcon || 'ri:folder-line'"
                :style="{
                  color:
                    row.sysFileSystemGroupColor || 'var(--el-color-primary)',
                }"
              />
              <span>{{ row.sysFileSystemGroupName }}</span>
              <ScTag 
                v-if="row.sysFileSystemGroupIsDefault"
                size="small"
                type="success"
                >默认</el-tag
              >
            </div>
          </template>
        </ScTableColumn>
        <ScTableColumn 
          prop="sysFileSystemGroupPath"
          label="路径"
          width="120"
        />
        <ScTableColumn 
          prop="sysFileSystemGroupDescription"
          label="描述"
          min-width="150"
        />
        <ScTableColumn 
          prop="sysFileSystemGroupSort"
          label="排序"
          width="80"
          align="center"
        />
        <ScTableColumn 
          prop="sysFileSystemGroupStatus"
          label="状态"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <ScTag 
              :type="row.sysFileSystemGroupStatus === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.sysFileSystemGroupStatus === 1 ? "启用" : "禁用" }}
            </ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <ScButton type="primary" link size="small" @click="handleEdit(row)"
              >编辑</el-button
            >
            <ScButton 
              type="danger"
              link
              size="small"
              :disabled="row.sysFileSystemGroupIsDefault"
              @click="handleDelete(row)"
            >
              删除
            </ScButton>
          </template>
        </ScTableColumn>
      </ScTable>
    </div>

    <!-- 编辑对话框 -->
    <sc-dialog
      v-model="showEditDialog"
      :title="editForm.sysFileSystemGroupId ? '编辑分组' : '新增分组'"
      width="500px"
      append-to-body
    >
      <ScForm 
        ref="formRef"
        :model="editForm"
        :rules="rules"
        label-width="100px"
      >
        <ScFormItem label="分组名称" prop="sysFileSystemGroupName">
          <ScInput 
            v-model="editForm.sysFileSystemGroupName"
            placeholder="请输入分组名称"
          />
        </ScFormItem>
        <ScFormItem label="分组路径" prop="sysFileSystemGroupPath">
          <ScInput 
            v-model="editForm.sysFileSystemGroupPath"
            placeholder="请输入分组路径，如 images"
          />
        </ScFormItem>
        <ScFormItem label="描述">
          <ScInput 
            v-model="editForm.sysFileSystemGroupDescription"
            type="textarea"
            :rows="2"
          />
        </ScFormItem>
        <ScFormItem label="图标">
          <ScInput 
            v-model="editForm.sysFileSystemGroupIcon"
            placeholder="ri:folder-line"
          />
        </ScFormItem>
        <ScFormItem label="颜色">
          <ScColorPicker v-model="editForm.sysFileSystemGroupColor" />
        </ScFormItem>
        <ScFormItem label="排序">
          <ScInputNumber 
            v-model="editForm.sysFileSystemGroupSort"
            :min="0"
            :max="999"
          />
        </ScFormItem>
        <ScFormItem label="状态">
          <ScRadioGroup v-model="editForm.sysFileSystemGroupStatus">
            <ScRadio :value="1">启用</ScRadio>
            <ScRadio :value="0">禁用</ScRadio>
          </ScRadioGroup>
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="showEditDialog = false">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="handleSave"
          >保存</el-button
        >
      </template>
    </sc-dialog>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message , ScMessageBox} from "@repo/utils";

import type { FormInstance, FormRules } from "element-plus";
import {
  addGroup,
  updateGroup,
  deleteGroup,
  initDefaultGroups,
  type SysFileSystemGroup,
} from "../../api/file";

interface Props {
  modelValue: boolean;
  groups: SysFileSystemGroup[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// 状态
const localGroups = ref<SysFileSystemGroup[]>([]);
const showEditDialog = ref(false);
const formRef = ref<FormInstance>();
const saving = ref(false);
const editForm = ref<SysFileSystemGroup>({});

const rules: FormRules = {
  sysFileSystemGroupName: [
    { required: true, message: "请输入分组名称", trigger: "blur" },
  ],
  sysFileSystemGroupPath: [
    { required: true, message: "请输入分组路径", trigger: "blur" },
  ],
};

// 监听数据变化
watch(
  () => props.groups,
  (val) => {
    localGroups.value = [...val];
  },
  { immediate: true }
);

// 新增
const handleAdd = () => {
  editForm.value = {
    sysFileSystemGroupStatus: 1,
    sysFileSystemGroupSort: 0,
  };
  showEditDialog.value = true;
};

// 编辑
const handleEdit = (row: SysFileSystemGroup) => {
  editForm.value = { ...row };
  showEditDialog.value = true;
};

// 保存
const handleSave = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    saving.value = true;
    try {
      let res;
      if (editForm.value.sysFileSystemGroupId) {
        res = await updateGroup(editForm.value);
      } else {
        res = await addGroup(editForm.value);
      }

      if (res.code === 200) {
        message("保存成功", { type: "success" });
        showEditDialog.value = false;
        emit("saved");
      } else {
        message(res.msg || "保存失败", { type: "error" });
      }
    } finally {
      saving.value = false;
    }
  });
};

// 删除
const handleDelete = async (row: SysFileSystemGroup) => {
  if (!row.sysFileSystemGroupId) return;

  try {
    await ScMessageBox.confirm("确定要删除该分组吗？", "确认删除", {
      type: "warning",
    });
    const res = await deleteGroup(row.sysFileSystemGroupId);
    if (res.code === 200) {
      message("删除成功", { type: "success" });
      emit("saved");
    } else {
      message(res.msg || "删除失败", { type: "error" });
    }
  } catch {
    // 取消
  }
};

// 初始化默认分组
const handleInitDefault = async () => {
  try {
    await ScMessageBox.confirm(
      "确定要初始化默认分组吗？这将创建默认分组。",
      "确认",
      { type: "info" }
    );
    const res = await initDefaultGroups();
    if (res.code === 200) {
      message("初始化成功", { type: "success" });
      emit("saved");
    } else {
      message(res.msg || "初始化失败", { type: "error" });
    }
  } catch {
    // 取消
  }
};
</script>

<style lang="scss" scoped>
.group-manager {
  .toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }
}

.group-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
