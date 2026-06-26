<template>
  <div class="sv2-page">
    <div class="sv2-action-bar">
      <el-button type="primary" @click="handleAdd">新增菜单</el-button>
      <el-button @click="expandAll = !expandAll">{{ expandAll ? '折叠' : '展开' }}全部</el-button>
    </div>
    <el-table :data="menuList" border stripe v-loading="loading" row-key="menuId"
      :default-expand-all="expandAll" lazy :tree-props="{ children: 'children' }">
      <el-table-column prop="menuName" label="菜单名称" />
      <el-table-column prop="icon" label="图标" width="80">
        <template #default="{ row }"><el-icon v-if="row.icon"><component :is="row.icon" /></el-icon></template>
      </el-table-column>
      <el-table-column prop="menuType" label="类型" width="80">
        <template #default="{ row }">
          <el-tag :type="row.menuType === 'M' ? '' : row.menuType === 'C' ? 'success' : 'warning'" size="small">
            {{ { M: '目录', C: '菜单', F: '按钮' }[row.menuType] || row.menuType }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="path" label="路由路径" />
      <el-table-column prop="component" label="组件路径" />
      <el-table-column prop="orderNum" label="排序" width="70" />
      <el-table-column prop="isVisible" label="可见" width="70">
        <template #default="{ row }">{{ row.isVisible === '1' ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="primary" @click="handleAddChild(row)">新增子菜单</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
            <template #reference><el-button link type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="上级菜单">
          <el-tree-select v-model="form.parentId" :data="menuList" :props="{ label: 'menuName', value: 'menuId' }"
            placeholder="顶级菜单" check-strictly clearable />
        </el-form-item>
        <el-form-item label="菜单类型" prop="menuType">
          <el-radio-group v-model="form.menuType">
            <el-radio value="M">目录</el-radio>
            <el-radio value="C">菜单</el-radio>
            <el-radio value="F">按钮</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName"><el-input v-model="form.menuName" /></el-form-item>
        <el-form-item label="路由地址" prop="path" v-if="form.menuType !== 'F'"><el-input v-model="form.path" /></el-form-item>
        <el-form-item label="组件路径" v-if="form.menuType === 'C'"><el-input v-model="form.component" /></el-form-item>
        <el-form-item label="图标" v-if="form.menuType !== 'F'"><el-input v-model="form.icon" /></el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.orderNum" /></el-form-item>
        <el-form-item label="可见" v-if="form.menuType !== 'F'">
          <el-radio-group v-model="form.isVisible"><el-radio value="1">显示</el-radio><el-radio value="0">隐藏</el-radio></el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { apiMenu } from "../../api/index";

const loading = ref(false);
const menuList = ref<any[]>([]);
const expandAll = ref(true);
const dialogVisible = ref(false);
const dialogTitle = ref("");
const formRef = ref<any>(null);

const form = reactive<any>({ parentId: "", menuName: "", menuType: "C", path: "", component: "", icon: "", orderNum: 0, isVisible: "1" });
const rules = { menuName: [{ required: true, message: "请输入菜单名称", trigger: "blur" }] };

async function fetchData() {
  loading.value = true;
  try {
    const res = await apiMenu.tree();
    menuList.value = res.data || [];
  } finally { loading.value = false; }
}

function handleAdd() { dialogTitle.value = "新增菜单"; Object.assign(form, { parentId: "", menuName: "", menuType: "C", path: "", component: "", icon: "", orderNum: 0, isVisible: "1" }); dialogVisible.value = true; }
function handleAddChild(row: any) { dialogTitle.value = "新增子菜单"; Object.assign(form, { parentId: row.menuId, menuName: "", menuType: "C", path: "", component: "", icon: "", orderNum: 0, isVisible: "1" }); dialogVisible.value = true; }
function handleEdit(row: any) { dialogTitle.value = "编辑菜单"; Object.assign(form, { ...row }); dialogVisible.value = true; }
async function handleDelete(row: any) { await apiMenu.delete(row.menuId); ElMessage.success("删除成功"); fetchData(); }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.menuId) await apiMenu.update(form); else await apiMenu.save(form);
  ElMessage.success("保存成功"); dialogVisible.value = false; fetchData();
}

onMounted(fetchData);
</script>

<style scoped>
.sv2-page { padding: 16px; }
.sv2-action-bar { margin-bottom: 16px; }
</style>