<script setup lang="ts">
/**
 * 访问名单（黑白名单）页签
 *
 * <p>两张子表：IP 网段名单与账号名单，规则完全一致，只是主键与匹配字段不同。</p>
 *
 * <p><b>名单优先级</b>：IP 或账号命中黑名单立即拒绝，白名单不能覆盖黑名单。
 * 白名单是「放行豁免」不是准入名单：命中的 IP 跳过限流，
 * 未列入任何名单的 IP 仍默认放行。</p>
 */
import { message } from "@repo/core";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessageBox } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReInput from "@repo/ui/re-input";
import ReDialog from "@repo/ui/re-dialog";
import ReTable from "@repo/ui/re-table";
import ReTab from "@repo/ui/re-tab";
import ReTag from "@repo/ui/re-tag";
import type { RePageResult, ReTableColumn, ReTableLoadParams } from "@repo/ui/re-table";
import {
  deleteAccountBw,
  deleteIp,
  pageForAccountBw,
  pageForIp,
  saveAccountBw,
  saveIp,
  updateAccountBw,
  updateIp,
} from "../../../../api/systemApi";
import type { AccountBlackwhite, SysIpBlackwhite } from "../../../../api/types";
import { TABLE_TOOLBAR, rowKeyOf, useFirstLoadGuard } from "../shared/policyTable";
import { usePolicyHitContext } from "../composables/policyHitContext";
import PolicyHitCell from "../components/PolicyHitCell.vue";

const { t } = useI18n();
const { ipHitType, accHitType, loadHitCounts } = usePolicyHitContext();
/** 首次 loader 返回前不展示空态，避免切进页签时闪一下「暂无IP名单 / 暂无账号名单」 */
const { ready, markReady } = useFirstLoadGuard();

type SubTab = "ip" | "account";
type AccountType = NonNullable<AccountBlackwhite["type"]>;
type AccountStatus = NonNullable<AccountBlackwhite["status"]>;

interface IpQuery {
  page: number;
  pageSize: number;
  sysIpIp?: string;
  sysIpType?: number;
  sysIpStatus?: number;
}
interface AccountQuery {
  page: number;
  pageSize: number;
  account?: string;
  type?: AccountType;
  status?: AccountStatus;
}
interface IpSearchModel {
  sysIpIp?: string;
  sysIpType?: number;
  sysIpStatus?: number;
}
interface AccountSearchModel {
  account?: string;
  type?: AccountType;
  status?: AccountStatus;
}

interface TableReloadRef {
  reload: () => Promise<void> | void;
}

const subTab = ref<SubTab>("ip");
const ipTableRef = ref<TableReloadRef>();
const accTableRef = ref<TableReloadRef>();
const ipQuery = ref<IpQuery>({ page: 1, pageSize: 10 });
const ipSearchModel = ref<IpSearchModel>({});
const accQuery = ref<AccountQuery>({ page: 1, pageSize: 10 });
const accSearchModel = ref<AccountSearchModel>({});

const ipDialogVisible = ref(false);
const ipSaving = ref(false);
const ipIsEdit = ref(false);
const ipDeleteLoadingId = ref<number | null>(null);
const ipForm = ref<SysIpBlackwhite>({});
const accDialogVisible = ref(false);
const accSaving = ref(false);
const accIsEdit = ref(false);
const accDeleteLoadingId = ref<number | null>(null);
const accForm = ref<AccountBlackwhite>({});

const subTabs = computed(() => [
  { name: "ip", label: t("policy.nav.bw.ip") },
  { name: "account", label: t("policy.nav.bw.account") },
]);

const ipSearchFilters = computed(() => [
  { key: "sysIpIp", label: "IP / CIDR", type: "input" as const, placeholder: t("policy.bw.phIp") },
  {
    key: "sysIpType",
    label: t("policy.common.listType"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.whitelist"), value: 0 },
      { label: t("policy.common.blacklist"), value: 1 },
    ],
  },
  {
    key: "sysIpStatus",
    label: t("policy.common.status"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.enable"), value: 0 },
      { label: t("policy.common.disabled"), value: 1 },
    ],
  },
]);

const accSearchFilters = computed(() => [
  { key: "account", label: t("policy.common.account"), type: "input" as const, placeholder: t("policy.bw.phAccount") },
  {
    key: "type",
    label: t("policy.common.listType"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.blacklist"), value: 1 },
      { label: t("policy.common.whitelist"), value: 2 },
    ],
  },
  {
    key: "status",
    label: t("policy.common.status"),
    type: "select" as const,
    placeholder: t("policy.common.all"),
    options: [
      { label: t("policy.common.enable"), value: 1 },
      { label: t("policy.common.disabled"), value: 0 },
    ],
  },
]);

const ipColumns = computed<ReTableColumn[]>(() => [
  { prop: "sysIpIp", label: "IP / CIDR", minWidth: 220 },
  { prop: "sysIpType", label: t("policy.common.listType"), width: 110, slot: "type", align: "center" },
  { prop: "sysIpStatus", label: t("policy.common.status"), width: 100, slot: "status", align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "sysIpRemark", label: t("policy.common.remark"), minWidth: 320, showOverflowTooltip: true },
  { prop: "createTime", label: t("policy.common.createTime"), minWidth: 180 },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

const accColumns = computed<ReTableColumn[]>(() => [
  { prop: "account", label: t("policy.common.account"), minWidth: 240 },
  { prop: "type", label: t("policy.common.listType"), width: 110, slot: "type", align: "center" },
  { prop: "status", label: t("policy.common.status"), width: 100, slot: "status", align: "center" },
  { prop: "hit", label: t("policy.common.hits"), width: 120, slot: "hit", align: "center" },
  { prop: "remark", label: t("policy.common.remark"), minWidth: 320, showOverflowTooltip: true },
  { prop: "createTime", label: t("policy.common.createTime"), minWidth: 180 },
  { prop: "action", label: t("policy.common.action"), width: 150, slot: "action", fixed: "right", align: "center" },
]);

/**
 * 加载 IP 名单分页
 *
 * <p>注意：这里读 {@code res.data.total} / {@code res.data.data} 就是对的。
 * /v2/ip/page 原始响应确实多一层 {@code {code:0,msg,data:{...}}}，但 http 响应拦截器
 * （packages/core/src/httpCrypto.ts checkApiResponse）已把内层展平，
 * 业务侧拿到的是 {@code {code:"00000", data:{total, data:[...]}}}。
 * 别再手工多剥一层 —— 那会把本来正确的读法改坏。</p>
 *
 * @param params ReTable 传入的分页参数
 * @returns 分页结果
 */
async function loadIps(params?: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForIp({
    page: params?.page ?? ipQuery.value.page,
    pageSize: params?.pageSize ?? ipQuery.value.pageSize,
    sysIpIp: ipQuery.value.sysIpIp,
    sysIpType: ipQuery.value.sysIpType,
    sysIpStatus: ipQuery.value.sysIpStatus,
  });
  markReady();
  return { total: res.data?.total ?? 0, data: (res.data?.data ?? []) as Record<string, unknown>[] };
}

/**
 * 加载账号名单分页
 *
 * @param params ReTable 传入的分页参数
 * @returns 分页结果
 */
async function loadAccounts(params?: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForAccountBw({
    page: params?.page ?? accQuery.value.page,
    pageSize: params?.pageSize ?? accQuery.value.pageSize,
    account: accQuery.value.account,
    type: accQuery.value.type,
    status: accQuery.value.status,
  });
  markReady();
  return { total: res.data?.total ?? 0, data: (res.data?.list ?? []) as Record<string, unknown>[] };
}

/** 应用 IP 搜索条件 */
function handleIpSearch(): void {
  ipQuery.value = {
    page: 1,
    pageSize: ipQuery.value.pageSize,
    sysIpIp: ipSearchModel.value.sysIpIp?.trim() || undefined,
    sysIpType: ipSearchModel.value.sysIpType,
    sysIpStatus: ipSearchModel.value.sysIpStatus,
  };
}

/** 重置 IP 搜索条件 */
function handleIpReset(): void {
  ipSearchModel.value = {};
  ipQuery.value = { page: 1, pageSize: 10 };
}

/** 应用账号搜索条件 */
function handleAccSearch(): void {
  accQuery.value = {
    page: 1,
    pageSize: accQuery.value.pageSize,
    account: accSearchModel.value.account?.trim() || undefined,
    type: accSearchModel.value.type,
    status: accSearchModel.value.status,
  };
}

/** 重置账号搜索条件 */
function handleAccReset(): void {
  accSearchModel.value = {};
  accQuery.value = { page: 1, pageSize: 10 };
}

/** 打开新增 IP 弹窗 */
function handleIpAdd(): void {
  ipIsEdit.value = false;
  ipForm.value = { sysIpType: ipQuery.value.sysIpType ?? 1, sysIpStatus: ipQuery.value.sysIpStatus ?? 0 };
  ipDialogVisible.value = true;
}

/** 打开编辑 IP 弹窗 */
function handleIpEdit(row: Record<string, unknown>): void {
  ipIsEdit.value = true;
  ipForm.value = { ...(row as SysIpBlackwhite) };
  ipDialogVisible.value = true;
}

/**
 * 校验 IPv4 地址
 *
 * @param value 地址文本
 * @returns 是否合法
 */
function validIpv4(value: string): boolean {
  return value.split(".").length === 4 && value.split(".").every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const number = Number(part);
    return number >= 0 && number <= 255;
  });
}

/**
 * 校验 IP 或 CIDR
 *
 * <p>网段要在这里拦：写成 {@code 10.0.0.0/33} 或 {@code 10.0.0.0/8} 之外的
 * 掩码，后端要么静默丢弃要么按 /32 处理，用户会以为规则生效了其实没有。</p>
 *
 * @param value 地址或 CIDR
 * @returns 是否合法
 */
function validIpRule(value: string): boolean {
  const [address, prefix = "32"] = value.split("/");
  if (!validIpv4(address)) return false;
  return /^\d{1,2}$/.test(prefix) && Number(prefix) >= 0 && Number(prefix) <= 32;
}

/** 保存 IP 规则 */
async function handleIpSubmit(): Promise<void> {
  const address = ipForm.value.sysIpIp?.trim() ?? "";
  if (!address) {
    message.warning(t("policy.bw.errIpBlank"));
    return;
  }
  if (!validIpRule(address)) {
    message.warning(t("policy.bw.errIpInvalid"));
    return;
  }

  ipSaving.value = true;
  try {
    const payload: SysIpBlackwhite = { ...ipForm.value, sysIpIp: address };
    const res = ipIsEdit.value ? await updateIp(payload) : await saveIp(payload);
    if (ipIsEdit.value && res.data === false) throw new Error(t("policy.bw.errIpNotUpdated"));
    message.success(ipIsEdit.value ? t("policy.bw.ipSaved") : t("policy.bw.ipCreated"));
    ipDialogVisible.value = false;
    await ipTableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    ipSaving.value = false;
  }
}

/** 删除 IP 规则 */
async function handleIpDelete(row: Record<string, unknown>): Promise<void> {
  const ip = row as SysIpBlackwhite;
  if (ip.sysIpId == null || ipDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(
      t("policy.bw.deleteIpBody", { ip: ip.sysIpIp ?? "-" }),
      t("policy.bw.deleteIpTitle"),
      { type: "warning", confirmButtonText: t("policy.common.remove"), cancelButtonText: t("policy.common.cancel") },
    );
  } catch {
    return;
  }
  ipDeleteLoadingId.value = ip.sysIpId;
  try {
    const res = await deleteIp(ip.sysIpId);
    if (res.data === false) throw new Error(t("policy.bw.errIpNotDeleted"));
    message.success(t("policy.bw.ipDeleted"));
    await ipTableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    ipDeleteLoadingId.value = null;
  }
}

/** 打开新增账号弹窗 */
function handleAccAdd(): void {
  accIsEdit.value = false;
  accForm.value = { type: accQuery.value.type ?? 1, status: accQuery.value.status ?? 1 };
  accDialogVisible.value = true;
}

/** 打开编辑账号弹窗 */
function handleAccEdit(row: Record<string, unknown>): void {
  accIsEdit.value = true;
  accForm.value = { ...(row as AccountBlackwhite) };
  accDialogVisible.value = true;
}

/** 保存账号规则 */
async function handleAccSubmit(): Promise<void> {
  const account = accForm.value.account?.trim() ?? "";
  if (!account) {
    message.warning(t("policy.bw.phAccount"));
    return;
  }
  if (account.length > 100) {
    message.warning(t("policy.bw.errAccTooLong"));
    return;
  }
  if (accForm.value.type !== 1 && accForm.value.type !== 2) {
    message.warning(t("policy.bw.errPickType"));
    return;
  }
  if (accForm.value.status !== 0 && accForm.value.status !== 1) {
    message.warning(t("policy.bw.errPickStatus"));
    return;
  }

  accSaving.value = true;
  try {
    const payload: AccountBlackwhite = { ...accForm.value, account };
    const res = accIsEdit.value ? await updateAccountBw(payload) : await saveAccountBw(payload);
    if (accIsEdit.value && res.data === false) throw new Error(t("policy.bw.errAccNotUpdated"));
    message.success(accIsEdit.value ? t("policy.bw.accSaved") : t("policy.bw.accCreated"));
    accDialogVisible.value = false;
    await accTableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.saveFailed"));
  } finally {
    accSaving.value = false;
  }
}

/** 删除账号规则 */
async function handleAccDelete(row: Record<string, unknown>): Promise<void> {
  const account = row as AccountBlackwhite;
  if (account.sysAccountBwId == null || accDeleteLoadingId.value != null) return;
  try {
    await ElMessageBox.confirm(
      t("policy.bw.deleteAccBody", { account: account.account ?? "-" }),
      t("policy.bw.deleteAccTitle"),
      { type: "warning", confirmButtonText: t("policy.common.remove"), cancelButtonText: t("policy.common.cancel") },
    );
  } catch {
    return;
  }
  accDeleteLoadingId.value = account.sysAccountBwId;
  try {
    const res = await deleteAccountBw(account.sysAccountBwId);
    if (res.data === false) throw new Error(t("policy.bw.errAccNotDeleted"));
    message.success(t("policy.bw.accDeleted"));
    await accTableRef.value?.reload();
  } catch (error) {
    message.error(error instanceof Error ? error.message : t("policy.common.deleteFailed"));
  } finally {
    accDeleteLoadingId.value = null;
  }
}

/** 切子表：另一张表自己挂载时会 loader，这里只补一次命中统计（类型随子表变） */
function handleSubTabChange(): void {
  void loadHitCounts();
}

/** 顶部刷新：只刷当前子表 */
async function reload(): Promise<void> {
  if (subTab.value === "ip") await ipTableRef.value?.reload();
  else await accTableRef.value?.reload();
  void loadHitCounts();
}

defineExpose({ reload });
</script>

<template>
  <section class="policy-view">
    <div class="policy-view__head">
      <div>
        <span class="policy-section__eyebrow">ACCESS CONTROL</span>
        <h2>{{ t("policy.nav.blackwhite.label") }}</h2>
        <p>{{ t("policy.bw.desc") }}</p>
      </div>
      <ReButton
        layout="modern"
        type="primary"
        icon="Plus"
        @click="subTab === 'ip' ? handleIpAdd() : handleAccAdd()"
      >
        {{ t("policy.bw.addRule", { kind: subTab === "ip" ? " IP" : t("policy.nav.bw.account") }) }}
      </ReButton>
    </div>

    <ReTab v-model="subTab" :tabs="subTabs" variant="capsule" nav-only class="policy-subnav" @tab-change="handleSubTabChange" />

    <template v-if="subTab === 'ip'">
      <ReTable
        :layout-switch="false"
        ref="ipTableRef"
        table-id="policy-ip"
        :loader="loadIps"
        :columns="ipColumns"
        :pagination="true"
        :params="ipQuery"
        :search="{ filters: ipSearchFilters, title: t('policy.nav.bw.ip') }"
        :toolbar-config="TABLE_TOOLBAR"
        row-key="sysIpId"
        v-model:search-model="ipSearchModel"
        v-model:page="ipQuery.page"
        v-model:page-size="ipQuery.pageSize"
        :empty-text="t('policy.bw.emptyIp')"
        @search="handleIpSearch"
        @search-reset="handleIpReset"
      >
        <template #type="{ row }">
          <ReTag :type="(row as SysIpBlackwhite).sysIpType === 0 ? 'success' : 'danger'" effect="light" round>
            {{ (row as SysIpBlackwhite).sysIpType === 0 ? t("policy.common.whitelist") : t("policy.common.blacklist") }}
          </ReTag>
        </template>
        <template #status="{ row }">
          <ReTag :type="(row as SysIpBlackwhite).sysIpStatus === 0 ? 'success' : 'info'" effect="light" round>
            {{ (row as SysIpBlackwhite).sysIpStatus === 0 ? t("policy.common.enable") : t("policy.common.disabled") }}
          </ReTag>
        </template>
        <template #hit="{ row }">
          <PolicyHitCell
            :type="ipHitType((row as SysIpBlackwhite).sysIpType)"
            :hit-key="(row as SysIpBlackwhite).sysIpIp ?? ''"
            :label="t('policy.bw.hitTitleIp', { ip: (row as SysIpBlackwhite).sysIpIp ?? '' })"
          />
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleIpEdit(row)" />
          <ReButton
            layout="square"
            type="danger"
            icon="Delete"
            :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
            :loading="ipDeleteLoadingId === (row as SysIpBlackwhite).sysIpId"
            @click="handleIpDelete(row)"
          />
        </template>
        <template #empty>
          <p v-if="ready" class="policy-table-empty">{{ t("policy.bw.emptyIp") }}</p>
        </template>
      </ReTable>
    </template>

    <template v-else>
      <ReTable
        :layout-switch="false"
        ref="accTableRef"
        table-id="policy-account"
        :loader="loadAccounts"
        :columns="accColumns"
        :pagination="true"
        :params="accQuery"
        :search="{ filters: accSearchFilters, title: t('policy.nav.bw.account') }"
        :toolbar-config="TABLE_TOOLBAR"
        row-key="sysAccountBwId"
        v-model:search-model="accSearchModel"
        v-model:page="accQuery.page"
        v-model:page-size="accQuery.pageSize"
        :empty-text="t('policy.bw.emptyAccount')"
        @search="handleAccSearch"
        @search-reset="handleAccReset"
      >
        <template #type="{ row }">
          <ReTag :type="(row as AccountBlackwhite).type === 2 ? 'success' : 'danger'" effect="light" round>
            {{ (row as AccountBlackwhite).type === 2 ? t("policy.common.whitelist") : t("policy.common.blacklist") }}
          </ReTag>
        </template>
        <template #status="{ row }">
          <ReTag :type="(row as AccountBlackwhite).status === 1 ? 'success' : 'info'" effect="light" round>
            {{ (row as AccountBlackwhite).status === 1 ? t("policy.common.enable") : t("policy.common.disabled") }}
          </ReTag>
        </template>
        <template #hit="{ row }">
          <PolicyHitCell
            :type="accHitType((row as AccountBlackwhite).type)"
            :hit-key="(row as AccountBlackwhite).account ?? ''"
            :label="t('policy.bw.hitTitleAccount', { account: (row as AccountBlackwhite).account ?? '' })"
          />
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="primary" icon="Edit" :tip="t('policy.common.editOf', { name: rowKeyOf(row) })" @click="handleAccEdit(row)" />
          <ReButton
            layout="square"
            type="danger"
            icon="Delete"
            :tip="t('policy.common.deleteOf', { name: rowKeyOf(row) })"
            :loading="accDeleteLoadingId === (row as AccountBlackwhite).sysAccountBwId"
            @click="handleAccDelete(row)"
          />
        </template>
        <template #empty>
          <p v-if="ready" class="policy-table-empty">{{ t("policy.bw.emptyAccount") }}</p>
        </template>
      </ReTable>
    </template>

    <!-- IP 规则弹窗 -->
    <ReDialog
      v-model="ipDialogVisible"
      :title="ipIsEdit ? t('policy.bw.dialogIpEdit') : t('policy.bw.dialogIpAdd')"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="ipSaving"
      :footer-hidden="false" @ok="handleIpSubmit"
    >
      <el-form label-width="100px" :model="ipForm">
        <el-form-item label="IP / CIDR" required>
          <ReInput v-model="ipForm.sysIpIp" layout="modern" maxlength="64" placeholder="192.168.1.0/24" aria-label="IP / CIDR" />
        </el-form-item>
        <el-form-item :label="t('policy.common.listType')">
          <el-segmented
            v-model="ipForm.sysIpType"
            :options="[
              { label: t('policy.common.whitelist'), value: 0 },
              { label: t('policy.common.blacklist'), value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.status')">
          <el-segmented
            v-model="ipForm.sysIpStatus"
            :options="[
              { label: t('policy.common.enable'), value: 0 },
              { label: t('policy.common.disabled'), value: 1 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="ipForm.sysIpRemark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit :aria-label="t('policy.common.remark')" />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 账号规则弹窗 -->
    <ReDialog
      v-model="accDialogVisible"
      :title="accIsEdit ? t('policy.bw.dialogAccEdit') : t('policy.bw.dialogAccAdd')"
      width="580px"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="accSaving"
      :footer-hidden="false" @ok="handleAccSubmit"
    >
      <el-form label-width="100px" :model="accForm">
        <el-form-item :label="t('policy.common.account')" required>
          <ReInput v-model="accForm.account" layout="modern" maxlength="100" :placeholder="t('policy.rate.meta.account.target')" :aria-label="t('policy.common.account')" />
        </el-form-item>
        <el-form-item :label="t('policy.common.listType')">
          <el-segmented
            v-model="accForm.type"
            :options="[
              { label: t('policy.common.blacklist'), value: 1 },
              { label: t('policy.common.whitelist'), value: 2 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.status')">
          <el-segmented
            v-model="accForm.status"
            :options="[
              { label: t('policy.common.enable'), value: 1 },
              { label: t('policy.common.disabled'), value: 0 },
            ]"
          />
        </el-form-item>
        <el-form-item :label="t('policy.common.remark')">
          <ReInput v-model="accForm.remark" layout="modern" type="textarea" :rows="2" maxlength="255" show-word-limit :aria-label="t('policy.common.remark')" />
        </el-form-item>
      </el-form>
    </ReDialog>
  </section>
</template>

<style lang="scss">
/* 非 scoped：页签骨架由各页签共用，规则必须一致，放在共享表里一起引。 */
@use "../policyShared.scss";
</style>
