<!--
  流程分类管理（左树右表单）。

  契约要点：collectCategoryTreeId 由服务端计算、前端只读；collectCategoryPid 顶级为 0；
  删除时若仍有子分类或流程引用，后端直接 400，把它的中文 msg 透出来即可。
-->
<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import { msgError, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReTree from "@repo/ui/re-tree";
import { deleteCategory, fetchCategoryTree, saveCategory, updateCategory } from "../api/collectApi";
import { errText } from "../composables/useCollectView";
import type { CollectCategoryNode } from "../types/collect";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const TREE_PROPS = { label: "collectCategoryName", children: "children" };

const tree = ref<CollectCategoryNode[]>([]);
const loading = ref(false);
const saving = ref(false);
const form = reactive({
  collectCategoryId: null as number | null,
  collectCategoryName: "",
  collectCategoryPid: 0,
  collectCategorySort: 0,
  collectCategoryRemark: "",
});

/** 父级下拉：全部节点 + 顶级；编辑自身时排除自己及子孙，避免环 */
const parentOptions = ref<{ value: number; label: string }[]>([{ value: 0, label: "顶级分类" }]);

/** 把树拍平成 {value,label} 列表，label 带层级缩进 */
function flatten(nodes: CollectCategoryNode[], depth = 0, exclude = 0): { value: number; label: string }[] {
  const out: { value: number; label: string }[] = [];
  nodes.forEach(node => {
    if (node.collectCategoryId === exclude) {
      return;
    }
    out.push({ value: node.collectCategoryId, label: `${"— ".repeat(depth)}${node.collectCategoryName}` });
    out.push(...flatten(node.children ?? [], depth + 1, exclude));
  });
  return out;
}

async function reload(): Promise<void> {
  loading.value = true;
  try {
    tree.value = await fetchCategoryTree();
    parentOptions.value = [{ value: 0, label: "顶级分类" }, ...flatten(tree.value, 0, form.collectCategoryId ?? 0)];
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

function reset(id: number | null, name: string, pid: number): void {
  form.collectCategoryId = id;
  form.collectCategoryName = name;
  form.collectCategoryPid = pid;
  form.collectCategorySort = 0;
  form.collectCategoryRemark = "";
  parentOptions.value = [{ value: 0, label: "顶级分类" }, ...flatten(tree.value, 0, id ?? 0)];
}

function onNodeClick(input: Record<string, unknown>): void {
  const node = input as unknown as CollectCategoryNode;
  reset(node.collectCategoryId, node.collectCategoryName, node.collectCategoryPid ?? 0);
  form.collectCategorySort = node.collectCategorySort ?? 0;
  form.collectCategoryRemark = node.collectCategoryRemark ?? "";
}

async function save(): Promise<void> {
  if (!form.collectCategoryName.trim()) {
    msgError("请输入分类名称");
    return;
  }
  saving.value = true;
  try {
    const dto = {
      collectCategoryId: form.collectCategoryId,
      collectCategoryName: form.collectCategoryName.trim(),
      collectCategoryPid: form.collectCategoryPid,
      collectCategorySort: form.collectCategorySort,
      collectCategoryRemark: form.collectCategoryRemark,
    };
    if (form.collectCategoryId) {
      await updateCategory(dto);
      msgSuccess("分类已更新");
    } else {
      const created = await saveCategory(dto);
      form.collectCategoryId = created.collectCategoryId ?? null;
      msgSuccess("分类已创建");
    }
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function remove(): Promise<void> {
  if (!form.collectCategoryId) {
    msgError("请先在左侧选择要删除的分类");
    return;
  }
  try {
    await deleteCategory(form.collectCategoryId);
    msgSuccess("分类已删除");
    reset(null, "", 0);
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}

watch(
  () => props.modelValue,
  visible => {
    if (visible) {
      reset(null, "", 0);
      void reload();
    }
  },
);
</script>

<template>
  <ReDialog
    :model-value="modelValue"
    title="流程分类"
    :width="680"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="collect-category">
      <div v-loading="loading" class="category-tree">
        <ReTree
          :data="tree"
          :props="TREE_PROPS"
          node-key="collectCategoryId"
          default-expand-all
          highlight-current
          empty-text="暂无分类"
          @node-click="onNodeClick"
        >
          <template #label="{ node }">
            <span class="category-node">
              <span>{{ node.collectCategoryName }}</span>
              <em>{{ node.flowCount }}</em>
            </span>
          </template>
        </ReTree>
      </div>

      <div class="category-form">
        <div class="collect-form">
          <div class="collect-form__item collect-form__item--stack">
            <span class="collect-form__label"><i class="req">*</i>名称</span>
            <ReInput v-model="form.collectCategoryName" size="small" placeholder="分类名称"/>
          </div>
          <div class="collect-form__item collect-form__item--stack">
            <span class="collect-form__label">上级分类</span>
            <ReSelect v-model="form.collectCategoryPid" size="small" style="width: 100%" :options="parentOptions"/>
          </div>
          <div class="collect-form__item collect-form__item--stack">
            <span class="collect-form__label">排序</span>
            <ReInputNumber v-model="form.collectCategorySort" size="small" :controls="false" style="width: 100%"/>
          </div>
          <div class="collect-form__item collect-form__item--stack">
            <span class="collect-form__label">备注</span>
            <ReInput v-model="form.collectCategoryRemark" size="small" type="textarea" :rows="2"/>
          </div>
          <div class="category-actions">
            <ReButton size="small" plain icon="DocumentAdd" @click="reset(null, '', 0)">新建</ReButton>
            <ReButton size="small" type="primary" :loading="saving" @click="save">保存</ReButton>
            <ReButton size="small" type="danger" plain :disabled="!form.collectCategoryId" @click="remove">删除</ReButton>
          </div>
          <div class="collect-hint collect-hint--muted">数字是该分类直属流程数；有子分类或流程时无法删除。</div>
        </div>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.collect-category {
  display: flex;
  gap: 14px;
}

.category-tree {
  flex: 1 1 auto;
  min-width: 0;
  max-height: 340px;
  overflow: auto;
  padding: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-blank);
}

.category-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.category-node em {
  padding: 0 5px;
  border-radius: 7px;
  font-style: normal;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

.category-form {
  width: 240px;
  flex: 0 0 240px;
}

.category-actions {
  display: flex;
  gap: 6px;
}
</style>
