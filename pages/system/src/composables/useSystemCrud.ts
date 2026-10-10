/**
 * 系统管理通用 CRUD 组合式函数
 *
 * 封装列表加载、分页、重置、新增/编辑弹窗、提交、删除等重复逻辑。
 * 与 ReTable 配合时，可将 loadList / loading / list 等只用于兼容旧 el-table 页面；
 * ReTable 页面主要复用 dialogVisible / dialogMode / form / handleAdd / handleEdit / handleSubmit。
 */
import { message } from "@repo/core";
import { reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import type { PageQuery } from "../api/types";
import type { DialogMode, UseSystemCrudOptions, UseSystemCrudReturn } from "../types/crud";

export function useSystemCrud<T, Q extends PageQuery, F>(
  options: UseSystemCrudOptions<T, Q, F>,
): UseSystemCrudReturn<T, Q, F> {
  const query = reactive<Q>({ ...options.query });
  const list = ref<T[]>([]) as UseSystemCrudReturn<T, Q, F>["list"];
  const total = ref(0);
  const loading = ref(false);

  const dialogVisible = ref(false);
  const dialogMode = ref<DialogMode>("create");
  const saving = ref(false);
  const form = reactive<F>(options.initForm ? options.initForm() : ({} as F));

  async function loadList(): Promise<void> {
    loading.value = true;
    try {
      const res = await options.load(query);
      const data = res?.data;
      list.value = (data?.data ?? data?.records ?? []) as T[];
      total.value = data?.total ?? 0;
    } catch (e) {
      message.error((e as Error)?.message ?? "列表加载失败");
    } finally {
      loading.value = false;
    }
  }

  async function handleSearch(): Promise<void> {
    query.page = 1;
    await loadList();
  }

  async function handleReset(fields?: Partial<Q>): Promise<void> {
    Object.assign(query, { ...options.query, ...fields, page: 1 });
    await loadList();
  }

  function handleAdd(): void {
    dialogMode.value = "create";
    Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
    if (options.initForm) {
      Object.assign(form, options.initForm());
    }
    dialogVisible.value = true;
  }

  function handleEdit(row: T): void {
    dialogMode.value = "edit";
    Object.keys(form).forEach((k) => delete (form as Record<string, unknown>)[k]);
    Object.assign(form, JSON.parse(JSON.stringify(row)));
    dialogVisible.value = true;
  }

  function closeDialog(): void {
    dialogVisible.value = false;
  }

  async function handleSubmit(): Promise<void> {
    if (options.validate) {
      const err = options.validate(form, dialogMode.value);
      if (err) {
        message.warning(err);
        return;
      }
    }

    const isEdit = dialogMode.value === "edit";
    const api = isEdit ? options.update : options.save;
    if (!api) {
      message.warning("未配置保存接口");
      return;
    }

    saving.value = true;
    try {
      await api(form);
      message.success(isEdit ? (options.messages?.update ?? "修改成功") : (options.messages?.save ?? "新增成功"));
      dialogVisible.value = false;
      await loadList();
    } catch (e) {
      message.error((e as Error)?.message ?? "保存失败");
    } finally {
      saving.value = false;
    }
  }

  async function handleDelete(row: T, idKey: keyof T = "id" as keyof T): Promise<void> {
    if (!options.remove) {
      message.warning("未配置删除接口");
      return;
    }
    const id = row[idKey] as string | number;
    try {
      await ElMessageBox.confirm(`确认删除该记录？`, "提示", { type: "warning" });
      await options.remove(id);
      message.success(options.messages?.remove ?? "删除成功");
      await loadList();
    } catch (e) {
      if (e !== "cancel") {
        message.error((e as Error)?.message ?? "删除失败");
      }
    }
  }

  return {
    query,
    list,
    total,
    loading,
    loadList,
    handleSearch,
    handleReset,
    dialogVisible,
    dialogMode,
    form,
    saving,
    handleAdd,
    handleEdit,
    handleSubmit,
    handleDelete,
    closeDialog,
  };
}
