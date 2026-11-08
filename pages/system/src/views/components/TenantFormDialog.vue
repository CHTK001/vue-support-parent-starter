<!--
  租户表单弹窗（当前未挂到任何页面：TenantManage 用的是内联表单）。

  保留原因：里面是「租户库实例来源」下拉的完整交互实现（选台账/平台自身后
  地址端口只读回显、显示库名与账号口令两类字段的取舍）。若要把 TenantManage
  的内联表单抽成组件，直接用这里，别重写一遍。

  独立数据库（选填）
-->
<script setup lang="ts">
import { message } from "@repo/core";
import { computed, reactive, ref, watch } from "vue";

import {
  saveTenant,
  tenantDatasourceOptions,
  updateTenant,
} from "../../api/systemApi";
import type { SysTenant, TenantDatasourceOption } from "../../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const model = defineModel<SysTenant>("model", { required: true });

const props = defineProps<{
  /** create-新增 / edit-编辑 */
  mode: "create" | "edit";
}>();

const emit = defineEmits<{
  (e: "success"): void;
}>();

const formRef = ref();

/** 表单数据（与 model 解耦，打开时按 model 快照） */
const form = reactive<Partial<SysTenant>>({});

/** 库来源下拉项：0=自填，-1=平台自身实例，>0=数据源台账 */
const datasourceOptions = ref<TenantDatasourceOption[]>([]);

/** 下拉项加载中 */
const datasourceLoading = ref(false);

/** 当前所选项；未选或为 0 都按「自填」处理 */
const selectedDatasource = computed<TenantDatasourceOption | undefined>(() => {
  const id = form.sysTenantDatasourceId;
  if (id === null || id === undefined) {
    return datasourceOptions.value.find((item) => item.id === 0);
  }
  return datasourceOptions.value.find((item) => item.id === Number(id));
});

/** 是否引用了现成实例（平台自身或台账）：此时地址/端口/账号/口令都来自实例，只填库名 */
const useSharedInstance = computed(() => {
  const id = form.sysTenantDatasourceId;
  return id !== null && id !== undefined && Number(id) !== 0;
});

/**
 * 引用实例时地址与端口展示用的只读值。
 *
 * <p>取下拉项里的实例信息；下拉项还没回来时退回租户记录里自填的字段，
 * 免得表单在打开瞬间显示成空白。</p>
 */
const readonlyEndpoint = computed(() => {
  const option = selectedDatasource.value;
  const id = form.sysTenantDatasourceId;
  const isSelf = id !== null && id !== undefined && Number(id) === -1;
  const host = option?.host || (isSelf ? "" : form.sysTenantHost) || "";
  const port = option?.port ?? (isSelf ? null : form.sysTenantPort) ?? null;
  return { host: host || (isSelf ? "（平台管理连接）" : "—"), port: port ? String(port) : "—" };
});

/** 加载库来源下拉项；失败时只保留「自填」，不让整个表单不可用 */
async function loadDatasourceOptions() {
  datasourceLoading.value = true;
  try {
    const result = await tenantDatasourceOptions();
    datasourceOptions.value = result.data ?? [];
  } catch {
    datasourceOptions.value = [
      { id: 0, name: "由租户自己填写实例信息", type: "manual" },
    ];
  } finally {
    datasourceLoading.value = false;
  }
}

/** 打开弹窗时按 model 重置表单 */
watch(
  () => visible.value,
  (open) => {
    if (!open) {
      return;
    }
    const source = model.value ?? {};
    Object.assign(form, source);
    if (props.mode === "create") {
      form.sysTenantStatus = 0;
      form.sysTenantDelete = 0;
      form.sysTenantDatasourceId = 0;
    }
    loadDatasourceOptions();
  },
);

/** 保存租户 */
async function handleSubmit() {
  await formRef.value?.validate?.();
  if (props.mode === "create") {
    await saveTenant({ ...form });
    message.success("租户创建成功，菜单已重置推送");
  } else {
    await updateTenant({ ...form });
    message.success("租户更新成功，菜单已重置推送");
  }
  visible.value = false;
  emit("success");
}
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="mode === 'create' ? '新增租户' : '编辑租户'"
    width="560px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="form" label-width="90px">
      <el-form-item
        label="租户名称"
        prop="sysTenantName"
        :rules="[{ required: true, message: '请输入租户名称', trigger: 'blur' }]"
      >
        <el-input v-model="form.sysTenantName" placeholder="请输入租户名称" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item
        label="租户账号"
        prop="sysTenantUsername"
        :rules="[{ required: true, message: '请输入租户账号', trigger: 'blur' }]"
      >
        <el-input v-model="form.sysTenantUsername" placeholder="租户端登录账号" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item
        v-if="mode === 'create'"
        label="初始密码"
        prop="sysTenantPassword"
        :rules="[{ required: true, message: '请输入初始密码', trigger: 'blur' }]"
      >
        <el-input v-model="form.sysTenantPassword" type="password" show-password placeholder="租户端登录密码" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input v-model="form.sysTenantContact" placeholder="联系人" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.sysTenantPhone" placeholder="手机号" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="邮箱">
        <el-input v-model="form.sysTenantEmail" placeholder="邮箱" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="公司">
        <el-input v-model="form.sysTenantCorporation" placeholder="公司" maxlength="255" show-word-limit />
      </el-form-item>
      <el-form-item label="访问地址">
        <el-input v-model="form.sysTenantHomeUrl" placeholder="租户访问地址" maxlength="500" show-word-limit />
      </el-form-item>
      <el-form-item label="状态">
        <el-radio-group v-model="form.sysTenantStatus">
          <el-radio :label="0">启用</el-radio>
          <el-radio :label="1">禁用</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.sysTenantRemark" type="textarea" :rows="2" placeholder="备注" maxlength="1000" show-word-limit />
      </el-form-item>

      <el-divider content-position="left">独立数据库（选填）</el-divider>
      <el-form-item label="实例来源">
        <el-select
          v-model="form.sysTenantDatasourceId"
          :loading="datasourceLoading"
          placeholder="选择数据库实例"
          style="width: 100%"
        >
          <el-option
            v-for="item in datasourceOptions"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <span>{{ item.name }}</span>
            <span v-if="item.host" class="tenant-db-option-host">
              {{ item.host }}{{ item.port ? `:${item.port}` : "" }}
            </span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="useSharedInstance" label="库地址">
        <div class="tenant-db-readonly">
          <span>{{ readonlyEndpoint.host }}</span>
          <span class="tenant-db-port">{{ readonlyEndpoint.port }}</span>
        </div>
      </el-form-item>
      <el-form-item v-else label="库地址">
        <div class="tenant-db-row">
          <el-input v-model="form.sysTenantHost" placeholder="数据库实例地址，如 10.0.0.8" maxlength="255" />
          <el-input v-model.number="form.sysTenantPort" placeholder="端口" maxlength="6" />
        </div>
      </el-form-item>
      <el-form-item label="库名">
        <el-input v-model="form.sysTenantDbname" placeholder="租户专属数据库名" maxlength="64" show-word-limit />
      </el-form-item>
      <template v-if="!useSharedInstance">
        <el-form-item label="库账号">
          <el-input v-model="form.sysTenantSqlUsername" placeholder="数据库登录账号" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="库口令">
          <el-input
            v-model="form.sysTenantSqlPassword"
            type="password"
            show-password
            :placeholder="mode === 'edit' ? '留空表示不修改' : '数据库登录口令'"
            maxlength="128"
          />
        </el-form-item>
      </template>
      <p class="tenant-db-hint">
        <template v-if="useSharedInstance">
          地址、端口与账号取自所选实例，这里只需填写该租户要用的库名。
          多个租户共用同一实例时，务必各自使用不同的库名。
        </template>
        <template v-else>
          填写完整后，登录该租户的用户请求会自动路由到该库；留空则继续走平台共享库。
        </template>
      </p>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">保存</el-button>
    </template>
  </ReDialog>
</template>

<style scoped>
.tenant-db-row {
  display: flex;
  gap: 8px;
  width: 100%;
}

.tenant-db-row > :first-child {
  flex: 1 1 auto;
}

.tenant-db-row > :last-child {
  flex: 0 0 110px;
}

.tenant-db-readonly {
  display: flex;
  gap: 8px;
  width: 100%;
  color: var(--el-text-color-regular);
}

.tenant-db-readonly > :first-child {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant-db-port {
  flex: 0 0 110px;
  color: var(--el-text-color-secondary);
}

.tenant-db-option-host {
  float: right;
  margin-left: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.tenant-db-hint {
  margin: 0 0 8px 90px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
