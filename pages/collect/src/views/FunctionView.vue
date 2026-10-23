<!--
  自定义函数库。

  后端语义必须在界面上体现：
  1. 函数名要小写字母开头，且不能与内置函数同名（内置清单由 /designer/runtime 下发，保存期由后端拒绝）；
  2. 函数体必须是 Groovy 闭包字面量，形参个数由后端按闭包签名推导，前端只读；
  3. 保存前编译，编译不过不落库，因此列表里的函数都是能跑的；
  4. 试跑走与流程运行同一条派发链（按名字进注册表），命中才回值，
     停用或被内置函数遮蔽会明确报"函数未生效"；
  5. 调用方写法：流程参数表达式里 ${名字(...)}、${宿主.名字(参数)}、${命名空间.名字(参数)}，
     脚本节点里 名字(...) 或 fn.名字(...)，三种拼法在后端解析到同一张白名单表。
-->
<script setup lang="ts">
import { computed, onActivated, reactive, ref } from "vue";
import { msgError, msgInfo, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTime from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import { deleteFunction, fetchRuntime, listFunctions, saveFunction, testFunction, updateFunction } from "../api/collectApi";
import { COLLECT_ACTIONS } from "../constants/actionColumns";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { ReTableColumn, ReTableSearchConfig } from "@repo/ui/re-table";
import type { CollectFunction, CollectFunctionTestResult } from "../types/collect";

defineOptions({ name: "CollectFunction" });

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reload();
});

/** 闭包写法示例，新建时直接填进去，改起来比看提示快 */
const EXAMPLE_SCRIPT = "{ a, b -> a + b }";

/** 内置函数名由 /designer/runtime 下发，别在前手抄一份（抄的那份已经和后端漂移过） */
const builtinNames = ref<string[]>([]);

const rows = ref<CollectFunction[]>([]);
/** 内置搜索区的草稿值：keyword 为空表示不按关键字过滤 */
const searchModel = ref<Record<string, unknown>>({ keyword: "" });
const visible = ref(false);
const saving = ref(false);
const testing = ref(false);
const testVisible = ref(false);
const testTarget = ref<CollectFunction | null>(null);
const testArgs = ref<string[]>([]);
const testResult = ref<CollectFunctionTestResult | null>(null);
const form = reactive({
  collectFunctionId: null as number | null,
  collectFunctionName: "",
  collectFunctionScript: "",
  collectFunctionDescription: "",
  collectFunctionEnabled: 1,
});

const SEARCH: ReTableSearchConfig = {
  title: "搜索函数",
  showRefreshBtn: false,
  filters: [{ key: "keyword", label: "关键字", type: "input", placeholder: "函数名或说明" }],
};

const { loading, reload } = useCollectView(async () => {
  const [list, runtimeInfo] = await Promise.all([
    listFunctions(String(searchModel.value.keyword ?? "").trim() || undefined),
    fetchRuntime().catch(() => null),
  ]);
  rows.value = list ?? [];
  builtinNames.value = runtimeInfo?.builtinFunctions ?? [];
});

/** 查询/重置：本页是前端整表加载，ReTable 不会替我们回源，必须重拉一次清单 */
function applySearch(): void {
  void reload();
}

/** 试跑对话框里的实参个数，跟闭包签名走 */
const argumentCount = computed<number>(() => Math.max(0, testTarget.value?.collectFunctionParameters ?? 0));

/** 实参输入框的下标列表 */
const argumentSlots = computed<number[]>(() => Array.from({ length: argumentCount.value }, (_, index) => index));

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectFunctionName", label: "函数名", minWidth: 140, showOverflowTooltip: true },
  { prop: "collectFunctionParameters", label: "形参", width: 62, slot: "args", align: "center" },
  { prop: "collectFunctionScript", label: "函数体", minWidth: 240, slot: "script", showOverflowTooltip: true },
  { prop: "collectFunctionDescription", label: "说明", minWidth: 140, slot: "description", showOverflowTooltip: true },
  { prop: "collectFunctionEnabled", label: "启用", width: 76, slot: "enabled", align: "center" },
  { prop: "collectFunctionLastResult", label: "最近结果", minWidth: 220, slot: "last" },
  { prop: "action", label: "操作", width: 140, slot: "action", fixed: "right" },
]);

function openCreate(): void {
  form.collectFunctionId = null;
  form.collectFunctionName = "";
  form.collectFunctionScript = EXAMPLE_SCRIPT;
  form.collectFunctionDescription = "";
  form.collectFunctionEnabled = 1;
  visible.value = true;
}

function openEdit(input: Record<string, unknown>): void {
  const row = input as unknown as CollectFunction;
  form.collectFunctionId = row.collectFunctionId ?? null;
  form.collectFunctionName = row.collectFunctionName ?? "";
  form.collectFunctionScript = row.collectFunctionScript ?? "";
  form.collectFunctionDescription = row.collectFunctionDescription ?? "";
  form.collectFunctionEnabled = row.collectFunctionEnabled ?? 1;
  visible.value = true;
}

async function save(): Promise<void> {
  if (!form.collectFunctionName.trim()) {
    msgWarning("请填写函数名");
    return;
  }
  if (!form.collectFunctionScript.trim()) {
    msgWarning("请填写函数体（Groovy 闭包字面量）");
    return;
  }
  saving.value = true;
  try {
    const dto: CollectFunction = {
      collectFunctionId: form.collectFunctionId,
      collectFunctionName: form.collectFunctionName.trim(),
      collectFunctionScript: form.collectFunctionScript,
      collectFunctionDescription: form.collectFunctionDescription,
      collectFunctionEnabled: form.collectFunctionEnabled,
    };
    if (form.collectFunctionId) {
      await updateFunction(dto);
      msgSuccess("函数已更新");
    } else {
      await saveFunction(dto);
      msgSuccess("函数已创建");
    }
    visible.value = false;
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(input: Record<string, unknown>, enabled: unknown): Promise<void> {
  const row = input as unknown as CollectFunction;
  if (!row.collectFunctionId) {
    return;
  }
  try {
    await updateFunction({ ...row, collectFunctionEnabled: Number(enabled) });
    msgSuccess(Number(enabled) === 1 ? "已启用" : "已停用");
  } catch (error) {
    msgError(errText(error));
  } finally {
    await reload();
  }
}

function openTest(input: Record<string, unknown>): void {
  const row = input as unknown as CollectFunction;
  testTarget.value = row;
  testArgs.value = Array.from({ length: Math.max(0, row.collectFunctionParameters ?? 0) }, () => "");
  testResult.value = null;
  testVisible.value = true;
}

async function runTest(): Promise<void> {
  const id = testTarget.value?.collectFunctionId;
  if (!id) {
    return;
  }
  testing.value = true;
  try {
    testResult.value = await testFunction({ collectFunctionId: id, arguments: testArgs.value });
    if (!testResult.value?.success) {
      msgError(`试跑失败：${testResult.value?.errorMessage ?? "未知原因"}`);
    }
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    testing.value = false;
  }
}

async function remove(input: Record<string, unknown>): Promise<void> {
  const row = input as unknown as CollectFunction;
  if (!row.collectFunctionId
    || !(await confirmAction(`确认删除函数「${row.collectFunctionName}」？`, "删除函数"))) {
    return;
  }
  try {
    await deleteFunction(row.collectFunctionId);
    msgSuccess("函数已删除");
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}

function showHelp(): void {
  const names = builtinNames.value.length ? builtinNames.value.join(" ") : "以后端 /designer/runtime 下发为准";
  const grammar = "写法三种：${fn(x)}、${宿主.fn(参数)}（如 ${resp.selector('a').attr('href')}）、"
    + "${命名空间.fn(参数)}（如 ${string.substring(s, 1, 4)}）。"
    + "宿主方法把宿主放在第一个实参上，所以 ${attr(selector(doc, 'a'), 'href')} 与链式写法等价。";
  msgInfo(grammar + `函数体是 Groovy 闭包字面量，如 ${EXAMPLE_SCRIPT}；内置函数 ${builtinNames.value.length} 个，名字不可占用：${names}`);
}
</script>

<template>
  <div class="collect-page">
    <ReTable
      class="collect-card"
      table-id="collect-function"
      :loading="loading"
      :data="rows"
      :columns="columns"
      :pagination="false"
      row-key="collectFunctionId"
      v-model:search-model="searchModel"
      :search="SEARCH"
      empty-text="暂无自定义函数"
      stripe
      @search="applySearch"
      @search-reset="applySearch"
      @refresh="reload"
    >
      <template #toolbar>
        <ReButton icon="QuestionFilled" title="查看函数调用写法与内置函数名单" @click="showHelp">查看函数调用写法与内置函数名单</ReButton>
        <ReButton icon="Plus" type="primary" title="新建函数" @click="openCreate">新建函数</ReButton>
        <span class="collect-hint">保存前编译，登记后流程参数表达式 ${name(...)} 与脚本节点里的 fn.name(...) 都能调</span>
      </template>

      <template #args="{ row }">{{ row.collectFunctionParameters ?? 0 }}</template>
      <template #script="{ row }">
        <span class="collect-cell-mono">{{ row.collectFunctionScript }}</span>
      </template>
      <template #description="{ row }">{{ row.collectFunctionDescription || "—" }}</template>
      <template #enabled="{ row }">
        <ReSwitch
          
          :model-value="row.collectFunctionEnabled ?? 1"
          :active-value="1"
          :inactive-value="0"
          @update:model-value="(v: unknown) => toggleEnabled(row, v)"
        />
      </template>
      <template #last="{ row }">
        <span
          class="collect-cell-ellipsis"
          :title="`${row.collectFunctionLastResult ?? ''}\n${row.collectFunctionLastTime ?? ''}`"
        >
          {{ row.collectFunctionLastResult || "—" }}
        </span>
      </template>
      <template #action="{ row }">
        <ReButton v-bind="COLLECT_ACTIONS.editFunction" layout="square" @click="openEdit(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.testFunction" layout="square" @click="openTest(row)"/>
        <ReButton v-bind="COLLECT_ACTIONS.deleteFunction" layout="square" @click="remove(row)"/>
      </template>
    </ReTable>

    <ReDialog
      v-model="visible"
      :title="form.collectFunctionId ? '编辑函数' : '新建函数'"
      :width="640"
      :close-on-click-modal="false"
    >
      <div class="collect-form">
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>函数名</span>
          <ReInput v-model="form.collectFunctionName"  maxlength="64" placeholder="小写字母开头，如 signName"/>
          <span class="collect-hint collect-hint--muted">不能与内置函数同名，全流程唯一</span>
        </div>
        <div class="collect-form__item collect-form__item--stack">
          <span class="collect-form__label"><i class="req">*</i>函数体</span>
          <ReInput
            v-model="form.collectFunctionScript"
            class="script-input"
            type="textarea"
            :rows="6"
            :placeholder="EXAMPLE_SCRIPT"
          />
          <span class="collect-hint collect-hint--muted">
            Groovy 闭包字面量，最后一条表达式即返回值；形参个数由闭包签名推导
          </span>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">说明</span>
          <ReInput v-model="form.collectFunctionDescription"  maxlength="255" placeholder="这个函数解决什么"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">启用</span>
          <ReSwitch v-model="form.collectFunctionEnabled" :active-value="1" :inactive-value="0"/>
        </div>
      </div>
      <template #footer="{ cancel }">
        <ReButton  @click="cancel">取消</ReButton>
        <ReButton  type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>

    <ReDialog v-model="testVisible" :title="`试跑 ${testTarget?.collectFunctionName ?? ''}`" :width="560">
      <div class="collect-form">
        <div v-for="index in argumentSlots" :key="index" class="collect-form__item">
          <span class="collect-form__label">实参 {{ index + 1 }}</span>
          <ReInput v-model="testArgs[index]"  placeholder="按字符串提交，闭包里自行转换"/>
        </div>
        <p v-if="!argumentCount" class="collect-hint collect-hint--muted">该函数没有形参，直接试跑</p>
        <div v-if="testResult" class="collect-callout" :class="testResult.success ? 'is-ok' : 'is-bad'">
          <span v-if="testResult.success">
            返回 {{ testResult.result }}（{{ testResult.resultType }}，<ReTime :value="costMs(testResult.costMs)" format="duration" placeholder="—" />）
          </span>
          <span v-else>{{ testResult.errorMessage || "试跑失败" }}</span>
        </div>
      </div>
      <template #footer>
        <ReButton  type="primary" :loading="testing" @click="runTest">试跑</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.script-input :deep(textarea) {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
}
</style>
