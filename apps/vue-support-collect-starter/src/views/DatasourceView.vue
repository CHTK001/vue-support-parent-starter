<!--
  数据源管理：SQL 节点与输出节点的业务表落库位置。

  后端语义：名称保留字 app 表示应用主库；密码只写不读（VO 用 passwordSet 表达是否已设），
  编辑时留空即保持原密码；被流程引用的数据源删除会被拒绝。
-->
<script setup lang="ts">
import { computed, onActivated, reactive, ref } from "vue";
import { msgError, msgInfo, msgSuccess, msgWarning } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { deleteDatasource, listDatasources, saveDatasource, testDatasource, updateDatasource } from "../api/collectApi";
import { confirmAction, errText, useCollectView } from "../composables/useCollectView";
import type { ReTableColumn } from "@repo/ui/re-table";
import type { CollectDatasource, CollectDatasourceVO } from "../types/collect";

defineOptions({ name: "CollectDatasource" });

/** keep-alive 命中后挂载只跑一次，重进页面靠激活钩子取新数据 */
let firstActivation = true;
onActivated(() => {
  if (firstActivation) {
    firstActivation = false;
    return;
  }
  void reload();
});

/** 与后端驱动默认值对齐，切换类型时顺带填驱动类 */
const DRIVERS: Record<string, string> = {
  MYSQL: "com.mysql.cj.jdbc.Driver",
  H2: "org.h2.Driver",
  POSTGRESQL: "org.postgresql.Driver",
};

const TYPE_OPTIONS = Object.keys(DRIVERS).map(type => ({ label: type, value: type }));

const rows = ref<CollectDatasourceVO[]>([]);
const visible = ref(false);
const saving = ref(false);
const testing = ref(false);
const form = reactive({
  collectDatasourceId: null as number | null,
  collectDatasourceName: "",
  collectDatasourceType: "",
  collectDatasourceDriverClassName: "",
  collectDatasourceJdbcUrl: "",
  collectDatasourceUsername: "",
  collectDatasourcePassword: "",
  collectDatasourceStatus: 1,
  collectDatasourceRemark: "",
});

const { loading, reload } = useCollectView(async () => {
  rows.value = (await listDatasources()) ?? [];
});

const columns = computed<ReTableColumn[]>(() => [
  { prop: "collectDatasourceName", label: "名称", minWidth: 140 },
  { prop: "collectDatasourceType", label: "类型", width: 110, align: "center" },
  { prop: "collectDatasourceJdbcUrl", label: "JDBC 地址", minWidth: 260, showOverflowTooltip: true },
  { prop: "collectDatasourceUsername", label: "账号", width: 120 },
  { prop: "passwordSet", label: "密码", width: 88, slot: "password", align: "center" },
  { prop: "collectDatasourceStatus", label: "启用", width: 76, slot: "status", align: "center" },
  { prop: "collectDatasourceRemark", label: "备注", minWidth: 140, showOverflowTooltip: true },
  { prop: "action", label: "操作", width: 120, slot: "action", fixed: "right" },
]);

function openCreate(): void {
  form.collectDatasourceId = null;
  form.collectDatasourceName = "";
  form.collectDatasourceType = "";
  form.collectDatasourceDriverClassName = "";
  form.collectDatasourceJdbcUrl = "";
  form.collectDatasourceUsername = "";
  form.collectDatasourcePassword = "";
  form.collectDatasourceStatus = 1;
  form.collectDatasourceRemark = "";
  visible.value = true;
}

function openEdit(input: Record<string, unknown>): void {
  const row = input as unknown as CollectDatasourceVO;
  form.collectDatasourceId = row.collectDatasourceId;
  form.collectDatasourceName = row.collectDatasourceName ?? "";
  form.collectDatasourceType = row.collectDatasourceType ?? "";
  form.collectDatasourceDriverClassName = row.collectDatasourceDriverClassName ?? "";
  form.collectDatasourceJdbcUrl = row.collectDatasourceJdbcUrl ?? "";
  form.collectDatasourceUsername = row.collectDatasourceUsername ?? "";
  form.collectDatasourcePassword = "";
  form.collectDatasourceStatus = row.collectDatasourceStatus ?? 1;
  form.collectDatasourceRemark = row.collectDatasourceRemark ?? "";
  visible.value = true;
}

function onTypeChange(type: unknown): void {
  const key = String(type ?? "");
  if (!form.collectDatasourceDriverClassName || DRIVERS[key]) {
    form.collectDatasourceDriverClassName = DRIVERS[key] ?? "";
  }
}

function dtoOf(): CollectDatasource {
  return {
    collectDatasourceId: form.collectDatasourceId,
    collectDatasourceName: form.collectDatasourceName.trim(),
    collectDatasourceType: form.collectDatasourceType,
    collectDatasourceDriverClassName: form.collectDatasourceDriverClassName.trim(),
    collectDatasourceJdbcUrl: form.collectDatasourceJdbcUrl.trim(),
    collectDatasourceUsername: form.collectDatasourceUsername.trim(),
    collectDatasourcePassword: form.collectDatasourcePassword,
    collectDatasourceStatus: form.collectDatasourceStatus,
    collectDatasourceRemark: form.collectDatasourceRemark,
  };
}

/** 基础校验：名称与 jdbc: 前缀是后端硬要求，先在前端挡住 */
function checkBasic(): boolean {
  if (!form.collectDatasourceName.trim()) {
    msgWarning("请填写数据源名称");
    return false;
  }
  if (form.collectDatasourceName.trim().toLowerCase() === "app") {
    msgWarning("app 是应用主库的保留名，不能作为数据源名称");
    return false;
  }
  if (!form.collectDatasourceJdbcUrl.trim().startsWith("jdbc:")) {
    msgWarning("JDBC 地址必须以 jdbc: 开头");
    return false;
  }
  return true;
}

async function save(): Promise<void> {
  if (!checkBasic()) {
    return;
  }
  saving.value = true;
  try {
    if (form.collectDatasourceId) {
      await updateDatasource(dtoOf());
      msgSuccess("数据源已更新");
    } else {
      await saveDatasource(dtoOf());
      msgSuccess("数据源已创建");
    }
    visible.value = false;
    await reload();
  } catch (error) {
    msgError(errText(error));
  } finally {
    saving.value = false;
  }
}

async function test(): Promise<void> {
  if (!checkBasic()) {
    return;
  }
  testing.value = true;
  try {
    msgInfo(`连接成功：${await testDatasource(dtoOf())}`);
  } catch (error) {
    msgError(errText(error));
  } finally {
    testing.value = false;
  }
}

async function remove(input: Record<string, unknown>): Promise<void> {
  const row = input as unknown as CollectDatasourceVO;
  if (!(await confirmAction(`确认删除数据源 ${row.collectDatasourceName}？被流程引用时无法删除。`, "删除数据源"))) {
    return;
  }
  try {
    await deleteDatasource(row.collectDatasourceId);
    msgSuccess("数据源已删除");
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}

async function toggleStatus(input: Record<string, unknown>, value: boolean): Promise<void> {
  const row = input as unknown as CollectDatasourceVO;
  try {
    await updateDatasource({
      collectDatasourceId: row.collectDatasourceId,
      collectDatasourceName: row.collectDatasourceName,
      collectDatasourceType: row.collectDatasourceType,
      collectDatasourceDriverClassName: row.collectDatasourceDriverClassName,
      collectDatasourceJdbcUrl: row.collectDatasourceJdbcUrl,
      collectDatasourceUsername: row.collectDatasourceUsername,
      collectDatasourceStatus: value ? 1 : 0,
      collectDatasourceRemark: row.collectDatasourceRemark,
    });
    msgSuccess(value ? "已启用" : "已禁用");
    await reload();
  } catch (error) {
    msgError(errText(error));
  }
}
</script>

<template>
  <div class="collect-page">
    <div class="collect-card collect-card--head">
      <span class="collect-hint">SQL 节点与输出节点的「数据源」参数填这里的名称或 ID，留空即 app 主库</span>
      <span class="spacer"/>
      <ReButton size="small" icon="Refresh" @click="reload">刷新</ReButton>
      <ReButton size="small" type="primary" icon="Plus" @click="openCreate">新建数据源</ReButton>
    </div>

    <ReTable
      class="collect-card"
      table-id="collect-datasource"
      :loading="loading"
      :data="rows"
      :columns="columns"
      :pagination="false"
      row-key="collectDatasourceId"
      empty-text="暂无数据源，未配置时 SQL/输出节点只能使用应用主库 app"
      stripe
    >
      <template #password="{ row }">
        <ReTag size="small" :type="row.passwordSet ? 'success' : 'info'" effect="plain">
          {{ row.passwordSet ? "已设置" : "无" }}
        </ReTag>
      </template>
      <template #status="{ row }">
        <ReSwitch
          size="small"
          :model-value="row.collectDatasourceStatus === 1"
          @update:model-value="(v: unknown) => toggleStatus(row, v === true)"
        />
      </template>
      <template #action="{ row }">
        <ReButton size="small" text type="primary" @click="openEdit(row)">编辑</ReButton>
        <ReButton size="small" text type="danger" @click="remove(row)">删除</ReButton>
      </template>
    </ReTable>

    <ReDialog
      v-model="visible"
      :title="form.collectDatasourceId ? '编辑数据源' : '新建数据源'"
      :width="620"
      :close-on-click-modal="false"
    >
      <div class="collect-form collect-form--grid">
        <div class="collect-form__item">
          <span class="collect-form__label"><i class="req">*</i>名称</span>
          <ReInput v-model="form.collectDatasourceName" size="small" maxlength="64" placeholder="流程里引用它，不可为 app"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">类型</span>
          <ReSelect
            v-model="form.collectDatasourceType"
            size="small"
            clearable
            placeholder="留空按连接串自动识别"
            :options="TYPE_OPTIONS"
            style="width: 100%"
            @update:model-value="onTypeChange"
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">驱动类</span>
          <ReInput v-model="form.collectDatasourceDriverClassName" size="small" placeholder="留空由后端按 URL 推断"/>
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">账号</span>
          <ReInput v-model="form.collectDatasourceUsername" size="small" autocomplete="off"/>
        </div>
        <div class="collect-form__item collect-form__item--span">
          <span class="collect-form__label"><i class="req">*</i>JDBC 地址</span>
          <ReInput
            v-model="form.collectDatasourceJdbcUrl"
            size="small"
            type="textarea"
            :rows="2"
            placeholder="jdbc:mysql://127.0.0.1:3306/demo?useUnicode=true"
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">密码</span>
          <ReInput
            v-model="form.collectDatasourcePassword"
            size="small"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="form.collectDatasourceId ? '留空表示不修改原密码' : '明文提交，服务端加密存储'"
          />
        </div>
        <div class="collect-form__item">
          <span class="collect-form__label">启用</span>
          <ReSwitch v-model="form.collectDatasourceStatus" :active-value="1" :inactive-value="0"/>
        </div>
        <div class="collect-form__item collect-form__item--span">
          <span class="collect-form__label">备注</span>
          <ReInput v-model="form.collectDatasourceRemark" size="small" maxlength="200"/>
        </div>
      </div>
      <template #footer="{ cancel }">
        <ReButton size="small" @click="cancel">取消</ReButton>
        <ReButton size="small" :loading="testing" @click="test">测试连接</ReButton>
        <ReButton size="small" type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped>
.collect-form__item--span {
  grid-column: 1 / -1;
}
</style>
