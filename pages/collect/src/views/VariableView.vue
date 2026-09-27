<!--
  全局变量管理。

  两条后端语义必须在界面上体现：
  1. 密文变量读回恒为掩码 "******"，update 时原样提交掩码表示不改值；
  2. 变量名规则 [A-Za-z_][A-Za-z0-9_]{0,63} 且全局唯一，重名后端直接 400。

  清单一次性拉全，所以 ReTable 内置搜索区的关键字在前端过滤，但仍是「点查询才生效」的草稿语义。
-->
<script setup lang="ts">
import { computed, onActivated, reactive, ref } from "vue";
import { msgError, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { deleteVariable, listVariables, saveVariable, updateVariable } from "../api/collectApi";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { ReTableColumn, ReTableSearchConfig } from "@repo/ui/re-table";
import type { CollectVariable } from "../types/collect";

defineOptions({ name: "CollectVariable" });

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reload();
});

/** 后端读回密文值时下发的掩码，提交它即「保持原值不变」 */
const MASK = "******";
const NAME_RULE = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

const rows = ref<CollectVariable[]>([]);
/** 搜索区里的草稿值与真正生效的条件：清单是一次性拉全的，所以过滤在前端做，但同样只在点「查询」时才生效 */
const searchModel = ref({ keyword: "" });
const applied = ref({ keyword: "" });
const SEARCH: ReTableSearchConfig = {
  title: "搜索变量",
  showRefreshBtn: false,
  filters: [{ key: "keyword", label: "关键字", type: "input", placeholder: "变量名或说明" }],
};
const visible = ref(false);
const saving = ref(false);
const form = reactive({
  collectVariableId: null as number | null,
  collectVariableName: "",
  collectVariableValue: "",
  collectVariableEncrypted: 0,
  collectVariableDescription: "",
});

const { loading, reload } = useCollectView(async () => {
  rows.value = (await listVariables()) ?? [];
});

const visibleRows = computed(() => {
  const kw = applied.value.keyword.trim().toLowerCase();
  if (!kw) {
    return rows.value;
  }
  return rows.value.filter(row =>
    [row.collectVariableName, row.collectVariableDescription]
      .some(text => String(text ?? "").toLowerCase().includes(kw)),
  );
});

/** 点「查询」：把搜索区里的草稿值提交给过滤逻辑 */
function applySearch(): void {
  applied.value = { keyword: String(searchModel.value.keyword ?? "") };
}

/** 点「重置」：不依赖组件清空与事件的先后，直接把草稿与生效条件一起归零 */
function resetSearch(): void {
  searchModel.value = { keyword: "" };
  applied.value = { keyword: "" };
}

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectVariableName", label: "变量名", minWidth: 160 },
  { prop: "collectVariableValue", label: "值", minWidth: 220, slot: "value" },
  { prop: "collectVariableEncrypted", label: "密文", width: 80, slot: "encrypted", align: "center" },
  { prop: "collectVariableDescription", label: "说明", minWidth: 180, showOverflowTooltip: true },
  { prop: "updateTime", label: "更新时间", width: 160 },
  { prop: "action", label: "操作", width: 100, slot: "action", fixed: "right" },
]);

function openCreate(): void {
  form.collectVariableId = null;
  form.collectVariableName = "";
  form.collectVariableValue = "";
  form.collectVariableEncrypted = 0;
  form.collectVariableDescription = "";
  visible.value = true;
}

function openEdit(row: Record<string, unknown>): void {
  const item = row as unknown as CollectVariable;
  form.collectVariableId = item.collectVariableId ?? null;
  form.collectVariableName = item.collectVariableName ?? "";
  form.collectVariableValue = item.collectVariableValue ?? "";
  form.collectVariableEncrypted = item.collectVariableEncrypted ?? 0;
  form.collectVariableDescription = item.collectVariableDescription ?? "";
  visible.value = true;
}

async function save(): Promise<void> {
  if (!NAME_RULE.test(form.collectVariableName.trim())) {
    msgWarning("变量名需匹配 [A-Za-z_][A-Za-z0-9_]{0,63}");
    return;
  }
  if (form.collectVariableEncrypted === 1 && !form.collectVariableValue) {
    msgWarning("密文变量的值不能为空");
    return;
  }
  saving.value = true;
  try {
    const dto: CollectVariable = {
      collectVariableId: form.collectVariableId,
      collectVariableName: form.collectVariableName.trim(),
      collectVariableValue: form.collectVariableValue,
      collectVariableEncrypted: form.collectVariableEncrypted,
      collectVariableDescription: form.collectVariableDescription,
    };
    if (form.collectVariableId) {
      await updateVariable(dto);
      msgSuccess("变量已更新");
    } else {
      await saveVariable(dto);
      msgSuccess("变量已创建");
    }
    visible.value = false;
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function remove(input: Record<string, unknown>): Promise<void> {
  const row = input as unknown as CollectVariable;
  if (!row.collectVariableId || !(await confirmAction(`确认删除全局变量 ${row.collectVariableName}？`, "删除变量"))) {
    return;
  }
  try {
    await deleteVariable(row.collectVariableId);
    msgSuccess("变量已删除");
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}
</script>

<template>
  <div class="collect-page">
    <ReTable
      class="collect-card"
      table-id="collect-variable"
      :loading="loading"
      :data="visibleRows"
      :columns="columns"
      :pagination="false"
      :search="SEARCH"
      v-model:search-model="searchModel"
      row-key="collectVariableId"
      :empty-text="applied.keyword ? `没有匹配「${applied.keyword}」的全局变量` : '暂无全局变量'"
      stripe
      @search="applySearch"
      @search-reset="resetSearch"
      @refresh="reload"
    >
      <template #toolbar>
        <ReButton icon="Plus" type="primary" title="新建变量" @click="openCreate">新建变量</ReButton>
        <span class="collect-hint">全局变量在每次执行时合并进上下文，流程同名变量优先级更高；密文变量的值读回恒为掩码</span>
      </template>
      <template #value="{ row }">
        <span class="collect-cell-ellipsis" :title="String(row.collectVariableValue ?? '')">
          {{ row.collectVariableValue == null || row.collectVariableValue === "" ? "—" : row.collectVariableValue }}
        </span>
      </template>
      <template #encrypted="{ row }">
        <ReTag size="small" :type="row.collectVariableEncrypted === 1 ? 'warning' : 'info'" effect="plain">
          {{ row.collectVariableEncrypted === 1 ? "是" : "否" }}
        </ReTag>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" icon="Edit" type="primary" tip="编辑这个变量" @click="openEdit(row)"/>
        <ReButton layout="square" icon="Delete" type="danger" tip="删除这个变量" @click="remove(row)"/>
      </template>
    </ReTable>

    <ReDialog
      v-model="visible"
      :title="form.collectVariableId ? '编辑变量' : '新建变量'"
      :width="480"
      :close-on-click-modal="false"
    >
      <div class="collect-form">
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>变量名</span>
          <ReInput
            v-model="form.collectVariableName"
            size="small"
            :disabled="Boolean(form.collectVariableId)"
            placeholder="如 accessToken"
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">密文</span>
          <ReSwitch v-model="form.collectVariableEncrypted" :active-value="1" :inactive-value="0"/>
          <span class="collect-hint">密文以 b64 前缀存储，读取时只显示掩码</span>
        </div>
        <div class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label"><i class="req">*</i>值</span>
          <ReInput
            v-model="form.collectVariableValue"
            size="small"
            :type="form.collectVariableEncrypted === 1 ? 'password' : 'textarea'"
            :rows="2"
            show-password
            :placeholder="
              form.collectVariableId && form.collectVariableValue === MASK
                ? `保持原值请保留 ${MASK}`
                : '变量值，支持表达式以外的字面量'
            "
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">说明</span>
          <ReInput v-model="form.collectVariableDescription" size="small" maxlength="200"/>
        </div>
      </div>
      <template #footer="{ cancel }">
        <ReButton size="small" @click="cancel">取消</ReButton>
        <ReButton size="small" type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>
