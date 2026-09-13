<script setup lang="ts">
/**
 * 岗位管理页面
 *
 * 岗位分页查询 + 新增/编辑/删除。
 * 全部使用 ReXxx modern 组件渲染，风格对齐 UserManage.vue。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { pageForPost, savePost, updatePost, deletePost } from "../api/systemApi";
import type { SysPost } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const postStatusOptions = [
  { label: "启用", value: 0 },
  { label: "禁用", value: 1 },
] as const;

const query = ref<{
  page: number;
  pageSize: number;
  sysPostName?: string;
  sysPostCode?: string;
  sysPostStatus?: number;
}>({
  page: 1,
  pageSize: 10,
});

async function loadPosts({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForPost({
    page,
    pageSize,
    sysPostName: (params.sysPostName as string) || undefined,
    sysPostCode: (params.sysPostCode as string) || undefined,
    sysPostStatus:
      params.sysPostStatus === "" || params.sysPostStatus === undefined
        ? undefined
        : (params.sysPostStatus as number),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();
const deleteLoading = ref<number>(0);

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysPost>({});

function handleAdd() {
  isEdit.value = false;
  form.value = { sysPostStatus: 0, sysPostSort: 0 };
  dialogVisible.value = true;
}

function handleEdit(row: Record<string, unknown>) {
  isEdit.value = true;
  form.value = { ...(row as unknown as SysPost) };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysPostName) {
    ElMessage.warning("请输入岗位名称");
    return;
  }
  if (!form.value.sysPostCode) {
    ElMessage.warning("请输入岗位编码");
    return;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updatePost(form.value);
      ElMessage.success("修改成功");
    } else {
      await savePost(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const post = row as unknown as SysPost;
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除岗位「${post.sysPostName}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  deleteLoading.value = post.sysPostId!;
  try {
    await deletePost(post.sysPostId!);
    ElMessage.success("删除成功");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

const columns: ReTableColumn[] = [
  { prop: "sysPostName", label: "岗位名称", minWidth: 150 },
  { prop: "sysPostCode", label: "岗位编码", minWidth: 140 },
  { prop: "sysPostSort", label: "排序", width: 90, align: "center" },
  { prop: "sysPostStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "userCount", label: "关联用户数", width: 110, align: "center" },
  { prop: "createTime", label: "创建时间", width: 170 },
  { prop: "action", label: "操作", width: 180, slot: "action", fixed: "right" },
];

onMounted(() => {
  tableRef.value?.reload();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" :add-button="false">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysPostName"
            placeholder="岗位名称"
            clearable
            class="!w-48"
            @keyup.enter="tableRef?.reload()"
          />
          <ReInput
            layout="modern"
            v-model="query.sysPostCode"
            placeholder="岗位编码"
            clearable
            class="!w-48"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysPostStatus"
            placeholder="状态"
            clearable
            class="!w-32"
            :data="[
              { label: '启用', value: 0 },
              { label: '禁用', value: 1 },
            ]"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
          <ReButton layout="modern" type="success" icon="Plus" v-admin @click="handleAdd">新增</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-post"
        :loader="loadPosts"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysPostId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        class="mt-2"
      >
        <template #status="{ row }">
          <ReTag :type="row.sysPostStatus === 0 ? 'success' : 'danger'" size="small">
            {{ row.sysPostStatus === 0 ? "启用" : "禁用" }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="primary" icon="Edit" v-admin @click="handleEdit(row)">编辑</ReButton>
          <ReButton layout="square" type="danger" icon="Delete" v-admin :loading="deleteLoading === row.sysPostId" @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>

    <!-- 新增/编辑岗位弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑岗位' : '新增岗位'"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      :confirm-loading="saving"
      @ok="handleSubmit"
    >
      <el-form label-width="90px" :model="form">
        <el-form-item label="岗位名称" required>
          <ReInput layout="modern" v-model="form.sysPostName" placeholder="请输入岗位名称" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="岗位编码" required>
          <ReInput layout="modern" v-model="form.sysPostCode" placeholder="请输入岗位编码" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysPostSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="状态">
          <el-segmented v-model="form.sysPostStatus" :options="postStatusOptions" />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysPostRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
</style>
