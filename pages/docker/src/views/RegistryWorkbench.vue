<script setup lang="ts">
/**
 * 镜像库工作台（页面级「镜像库」页签）
 *
 * <p>左栏列出全部镜像库（内置 Docker Hub 带标记、不可删除），右栏编辑
 * 名称 / 类型 / 地址 / 账号 / 密码 / 命名空间 / 启用状态，并提供「测试连接」。</p>
 *
 * <p>类型不写死：优先取后端 {@code /registries/types}（SPI 可扩展），
 * 接口未落地时回落到 dockerhub / generic-v2 两项，保证页面可用。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/core";
import { deleteRegistry, listRegistries, listRegistryTypes, saveRegistry, testRegistry } from "../api";
import type { DockerRegistry, DockerRegistryType } from "../api";

/* ==================== 清单 ==================== */

const registries = ref<DockerRegistry[]>([]);
const loading = ref(false);
const loadError = ref("");
const selectedId = ref("");

/** 类型清单（SPI） */
const types = ref<DockerRegistryType[]>([]);

/** 当前选中的库 */
const selected = computed(() => registries.value.find((it) => String(it.id) === selectedId.value) ?? null);

/** 读取镜像库列表 */
async function load(): Promise<void> {
  loading.value = true;
  loadError.value = "";
  try {
    const list = await listRegistries();
    registries.value = Array.isArray(list) ? list : [];
    if (!registries.value.some((it) => String(it.id) === selectedId.value)) {
      selectedId.value = String(registries.value[0]?.id ?? "");
    }
  } catch (e: any) {
    loadError.value = e?.message ?? "读取镜像库失败";
    registries.value = [];
  } finally {
    loading.value = false;
  }
}

/** 读取类型清单 */
async function loadTypes(): Promise<void> {
  types.value = await listRegistryTypes();
}

/* ==================== 编辑表单 ==================== */

/** 表单模型（密码留空表示沿用后端已保存的密码） */
interface RegistryForm {
  id: string;
  name: string;
  type: string;
  url: string;
  username: string;
  password: string;
  namespace: string;
  enabled: boolean;
  builtin: boolean;
  hasPassword: boolean;
}

/** 空表单 */
function emptyForm(): RegistryForm {
  return {
    id: "",
    name: "",
    type: types.value[0]?.type ?? "dockerhub",
    url: "",
    username: "",
    password: "",
    namespace: "",
    enabled: true,
    builtin: false,
    hasPassword: false,
  };
}

const form = reactive<RegistryForm>(emptyForm());
const saving = ref(false);
const testing = ref(false);
const testResult = ref<{ ok: boolean; message: string } | null>(null);

/** 是否新增态 */
const isNew = computed(() => !form.id);

/** 用选中项填充表单 */
function fillForm(item: DockerRegistry | null): void {
  testResult.value = null;
  if (!item) {
    Object.assign(form, emptyForm());
    return;
  }
  Object.assign(form, {
    id: String(item.id ?? ""),
    name: item.name ?? "",
    type: item.type ?? types.value[0]?.type ?? "dockerhub",
    url: item.url ?? "",
    username: item.username ?? "",
    password: "",
    namespace: item.namespace ?? "",
    enabled: item.enabled !== false,
    builtin: item.builtin === true,
    hasPassword: item.hasPassword === true,
  });
}

watch(selected, (item) => fillForm(item), { immediate: true });

/* ==================== 操作 ==================== */

/** 新建 */
function createNew(): void {
  selectedId.value = "";
  fillForm(null);
}

/** 保存（id 为空即新增） */
async function save(): Promise<void> {
  if (!form.name.trim()) {
    message.warning("请填写镜像库名称");
    return;
  }
  if (!form.type) {
    message.warning("请选择镜像库类型");
    return;
  }
  saving.value = true;
  try {
    const saved = await saveRegistry({
      id: form.id || undefined,
      name: form.name.trim(),
      type: form.type,
      url: form.url.trim() || undefined,
      username: form.username.trim() || undefined,
      password: form.password || undefined,
      namespace: form.namespace.trim() || undefined,
      enabled: form.enabled,
      builtin: form.builtin || undefined,
    });
    message.success(isNew.value ? "镜像库已新增" : "镜像库已保存");
    await load();
    if (saved?.id) selectedId.value = String(saved.id);
    testResult.value = null;
  } catch (e: any) {
    message.error(e?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

/** 测试连接（必须先保存，后端按 id 取配置） */
async function test(): Promise<void> {
  if (!form.id) {
    message.warning("请先保存镜像库，再测试连接");
    return;
  }
  testing.value = true;
  testResult.value = null;
  try {
    const res = await testRegistry(form.id);
    testResult.value = { ok: res?.ok !== false, message: res?.message ?? (res?.ok ? "连接正常" : "连接失败") };
    if (res?.ok) message.success("连接正常");
    else message.error(res?.message ?? "连接失败");
  } catch (e: any) {
    testResult.value = { ok: false, message: e?.message ?? "测试连接失败" };
    message.error(testResult.value.message);
  } finally {
    testing.value = false;
  }
}

/** 删除（内置库不可删） */
async function remove(): Promise<void> {
  if (!form.id || form.builtin) return;
  try {
    await ElMessageBox.confirm(`确认删除镜像库「${form.name}」？删除后该库的检索与凭据一并失效。`, "删除镜像库", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await deleteRegistry(form.id);
    message.success("镜像库已删除");
    selectedId.value = "";
    await load();
  } catch (e: any) {
    message.error(e?.message ?? "删除失败");
  }
}

/** 类型显示名 */
function typeLabel(type?: string): string {
  return types.value.find((it) => it.type === type)?.label ?? type ?? "-";
}

void loadTypes();
void load();
</script>

<template>
  <div class="dk-body">
    <!-- 左栏：库列表 -->
    <div class="dk-pane dk-pane--list">
      <div class="dk-pane-head">
        <ReIcon name="Coin" :size="14" />
        <b>镜像库</b>
        <span class="dk-pill">{{ registries.length }}</span>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="Plus" tip="新增镜像库" @click="createNew" />
        <ReButton layout="square" link icon="Refresh" tip="刷新列表" :loading="loading" @click="load" />
      </div>

      <div class="dk-pane-body dk-pane-body--flush">
        <div v-if="loading && !registries.length" v-loading="true" class="dk-loading" />
        <div v-else-if="loadError" class="dk-empty">
          <ReIcon name="Warning" :size="22" />
          <b>读取失败</b>
          <span>{{ loadError }}</span>
          <ReButton size="small" icon="Refresh" @click="load">重试</ReButton>
        </div>
        <div v-else-if="!registries.length" class="dk-empty">
          <ReIcon name="Coin" :size="22" />
          <b>还没有镜像库</b>
          <span>点击右上角「+」新增，或等待后端初始化内置 Docker Hub</span>
        </div>
        <ul v-else class="dk-items">
          <li
            v-for="r in registries"
            :key="String(r.id)"
            class="dk-item dk-item--static"
            :class="{ on: String(r.id) === selectedId }"
            @click="selectedId = String(r.id)"
          >
            <span class="dk-dot" :class="r.enabled === false ? 'is-off' : 'is-ok'" />
            <span class="dk-item-main">
              <span class="dk-item-name">
                {{ r.name }}
                <span v-if="r.builtin" class="dk-pill">内置</span>
              </span>
              <span class="dk-item-sub">{{ typeLabel(r.type) }}<template v-if="r.url"> · {{ r.url }}</template></span>
            </span>
            <span class="dk-item-meta">
              <span class="dk-item-time">{{ r.enabled === false ? "已停用" : "启用" }}</span>
              <span class="dk-item-time">{{ r.hasPassword ? "已存凭据" : "" }}</span>
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 右栏：编辑 -->
    <div class="dk-pane dk-pane--main">
      <div class="dk-pane-head">
        <ReIcon name="SetUp" :size="14" />
        <b>{{ isNew ? "新增镜像库" : `编辑 · ${form.name}` }}</b>
        <span v-if="form.builtin" class="dk-pill is-info">内置</span>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="Connection" tip="测试连接（需先保存）" :loading="testing" @click="test" />
        <ReButton
          layout="square"
          link
          icon="Delete"
          type="danger"
          :tip="form.builtin ? '内置镜像库不可删除' : '删除镜像库'"
          :disabled="isNew || form.builtin"
          @click="remove"
        />
      </div>

      <div class="dk-pane-body">
        <div v-if="testResult" class="dk-banner" :class="testResult.ok ? 'is-ok' : 'is-bad'">
          {{ testResult.ok ? "✔ 连接正常" : "✖ 连接失败" }}：{{ testResult.message }}
        </div>

        <div class="dk-form">
          <div class="dk-row">
            <label class="dk-field">
              <span>名称 <i>*</i></span>
              <input v-model="form.name" class="dk-input" placeholder="如 公司私有库" />
            </label>
            <label class="dk-field">
              <span>类型 <i>*</i></span>
              <select v-model="form.type" class="dk-select" :disabled="form.builtin">
                <option v-for="t in types" :key="t.type" :value="t.type">{{ t.label }}（{{ t.type }}）</option>
              </select>
            </label>
          </div>

          <label class="dk-field">
            <span>地址 <em> · 留空使用类型默认地址（Docker Hub 可填镜像加速地址）</em></span>
            <input v-model="form.url" class="dk-input" placeholder="https://registry.example.com" />
          </label>

          <div class="dk-row">
            <label class="dk-field">
              <span>账号</span>
              <input v-model="form.username" class="dk-input" autocomplete="off" placeholder="Basic Auth 用户名" />
            </label>
            <label class="dk-field">
              <span>密码 <em v-if="form.hasPassword"> · 已保存，留空不修改</em></span>
              <input
                v-model="form.password"
                class="dk-input"
                type="password"
                autocomplete="new-password"
                :placeholder="form.hasPassword ? '••••••••（留空不修改）' : '保存后仅显示「已存凭据」'"
              />
            </label>
          </div>

          <label class="dk-field">
            <span>命名空间 <em> · 检索与 pullRef 的默认前缀，可空</em></span>
            <input v-model="form.namespace" class="dk-input" placeholder="如 library / team-a" />
          </label>

          <label class="dk-check">
            <input v-model="form.enabled" type="checkbox" />
            启用（停用后不参与在线检索）
          </label>

          <p class="dk-note">
            密码只提交不回显：后端读取时仅返回 hasPassword。安装 / 下载时由后端在会话内 docker login，
            不把密码写进命令行历史。
          </p>
        </div>
      </div>

      <div class="dk-form-foot">
        <ReButton v-if="!isNew" icon="RefreshLeft" tip="放弃改动并重新载入" @click="fillForm(selected)">重置</ReButton>
        <span class="dk-spacer" />
        <ReButton type="primary" icon="Check" tip="保存镜像库配置" :loading="saving" @click="save">保存</ReButton>
      </div>
    </div>
  </div>
</template>
