<template>
  <el-dialog
    v-model="visible"
    title="分组管理"
    width="700px"
    destroy-on-close
    :close-on-click-modal="false"
  >
    <div class="group-manager">
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <IconifyIconOnline icon="ri:add-line" />
          新增分组
        </el-button>
        <el-button @click="handleInitDefault">
          <IconifyIconOnline icon="ri:refresh-line" />
          初始化默认分组
        </el-button>
      </div>

      <!-- 分组列表 -->
      <el-table :data="localGroups" row-key="sysFileSystemGroupId" border>
        <el-table-column
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
              <el-tag
                v-if="row.sysFileSystemGroupIsDefault"
                size="small"
                type="success"
                >默认</el-tag
              >
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="sysFileSystemGroupPath"
          label="路径"
          width="120"
        />
        <el-table-column
          prop="sysFileSystemGroupDescription"
          label="描述"
          min-width="150"
        />
        <el-table-column
          prop="sysFileSystemGroupSort"
          label="排序"
          width="80"
          align="center"
        />
        <el-table-column
          prop="sysFileSystemGroupStatus"
          label="状态"
          width="80"
          align="center"
        >
          <template #default="{ row }">
            <el-tag
              :type="row.sysFileSystemGroupStatus === 1 ? 'success' : 'info'"
              size="small"
            >
              {{ row.sysFileSystemGroupStatus === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              link
              size="small"
              :disabled="row.sysFileSystemGroupIsDefault"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditDialog"
      :title="editForm.sysFileSystemGroupId ? '编辑分组' : '新增分组'"
      width="500px"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="editForm"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分组名称" prop="sysFileSystemGroupName">
          <el-input
            v-model="editForm.sysFileSystemGroupName"
            placeholder="请输入分组名称"
          />
        </el-form-item>
        <el-form-item label="分组路径" prop="sysFileSystemGroupPath">
          <el-input
            v-model="editForm.sysFileSystemGroupPath"
            placeholder="请输入分组路径，如 images"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editForm.sysFileSystemGroupDescription"
            type="textarea"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="图标">
          <el-input
            v-model="editForm.sysFileSystemGroupIcon"
            placeholder="ri:folder-line"
          />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="editForm.sysFileSystemGroupColor" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number
            v-model="editForm.sysFileSystemGroupSort"
            :min="0"
            :max="999"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="editForm.sysFileSystemGroupStatus">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
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
    await ElMessageBox.confirm("确定要删除该分组吗？", "确认删除", {
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
    await ElMessageBox.confirm(
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
