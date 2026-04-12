<template>
  <div class="user-save-container">
    <sc-dialog
      v-model="visible"
      :title="dialogTitle"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      width="1200px"
      class="user-dialog"
      @close="close"
    >
      <ScForm
        ref="dialogFormRef"
        :model="form"
        :rules="rules"
        :disabled="mode === 'show'"
        label-position="top"
        class="user-form"
      >
        <div class="user-editor">
          <ScTabs v-model="activeEditorTab" class="editor-tabs" stretch>
            <ScTabPane label="主信息" name="account" lazy>
              <div class="editor-layout">
                <aside class="editor-column editor-column--preview">
                  <div class="profile-card editor-summary">
                    <div class="editor-summary__main">
                      <ScUpload
                        class="avatar-uploader"
                        action="#"
                        :show-file-list="false"
                        :auto-upload="false"
                        :disabled="mode === 'show'"
                        :on-change="handleAvatarChange"
                        accept="image/*"
                      >
                        <div class="profile-avatar" :class="getAvatarClass()">
                          <ScAvatar
                            v-if="form.sysUserAvatar"
                            :size="108"
                            :src="form.sysUserAvatar"
                          />
                          <div v-else class="avatar-placeholder">
                            {{ getAvatarText() }}
                          </div>
                          <div v-if="mode !== 'show'" class="avatar-overlay">
                            <IconifyIconOnline
                              icon="ri:camera-line"
                              :size="22"
                            />
                            <span>{{
                              avatarLoading ? "上传中..." : "更换头像"
                            }}</span>
                          </div>
                        </div>
                      </ScUpload>

                      <div class="editor-summary__content">
                        <div class="profile-copy">
                          <div class="profile-eyebrow">用户档案</div>
                          <h3>
                            {{
                              form.sysUserNickname ||
                              form.sysUserUsername ||
                              "新用户"
                            }}
                          </h3>
                          <p>{{ profileSubtitle }}</p>
                        </div>

                        <div class="profile-badges">
                          <ScTag size="small" effect="plain">{{
                            modeLabel
                          }}</ScTag>
                          <ScTag
                            size="small"
                            :type="
                              form.sysUserStatus === 1 ? 'success' : 'info'
                            "
                          >
                            {{ form.sysUserStatus === 1 ? "启用中" : "已禁用" }}
                          </ScTag>
                          <ScTag
                            size="small"
                            :type="form.sysUserInSystem ? 'warning' : 'info'"
                          >
                            {{ form.sysUserInSystem ? "系统账号" : "普通账号" }}
                          </ScTag>
                          <ScTag
                            v-if="identityInsight.valid"
                            size="small"
                            type="success"
                          >
                            身份证已识别
                          </ScTag>
                        </div>
                      </div>
                    </div>

                    <div class="profile-metrics">
                      <div class="summary-item">
                        <span>所属部门</span>
                        <strong>{{ deptDisplayLabel }}</strong>
                      </div>
                      <div class="summary-item">
                        <span>角色数量</span>
                        <strong>{{ form.roleIds.length }}</strong>
                      </div>
                      <div class="summary-item">
                        <span>最后登录</span>
                        <strong>{{ lastLoginLabel }}</strong>
                      </div>
                      <div class="summary-item">
                        <span>最后地点</span>
                        <strong>{{
                          form.sysUserLastAddress || "未记录"
                        }}</strong>
                      </div>
                    </div>
                  </div>
                </aside>

                <div class="editor-column editor-column--content">
                  <section class="form-panel form-panel--emphasis">
                    <div class="panel-header">
                      <div>
                        <div class="panel-eyebrow">基础信息</div>
                        <h4>必填与常用资料</h4>
                      </div>
                      <ScTag size="small" effect="plain">{{
                        dialogTitle
                      }}</ScTag>
                    </div>

                    <ScRow :gutter="18" class="form-grid form-grid--compact">
                      <ScCol :xl="12" :lg="12" :md="12" :sm="24" :span="24">
                        <ScFormItem label="账号名称" prop="sysUserUsername">
                          <ScInput
                            v-model="form.sysUserUsername"
                            placeholder="请输入账号名称"
                          >
                            <template #prefix>
                              <IconifyIconOnline icon="mdi:account" />
                            </template>
                          </ScInput>
                        </ScFormItem>
                      </ScCol>
                      <ScCol :xl="12" :lg="12" :md="12" :sm="24" :span="24">
                        <ScFormItem label="用户昵称" prop="sysUserNickname">
                          <ScInput
                            v-model="form.sysUserNickname"
                            placeholder="请输入用户昵称"
                          >
                            <template #prefix>
                              <IconifyIconOnline
                                icon="mdi:badge-account-horizontal"
                              />
                            </template>
                          </ScInput>
                        </ScFormItem>
                      </ScCol>
                      <ScCol :xl="12" :lg="12" :md="12" :sm="24" :span="24">
                        <ScFormItem label="手机号" prop="sysUserPhone">
                          <ScInput
                            v-model="form.sysUserPhone"
                            placeholder="请输入手机号"
                            maxlength="11"
                          >
                            <template #prefix>
                              <IconifyIconOnline icon="mdi:phone-outline" />
                            </template>
                          </ScInput>
                        </ScFormItem>
                      </ScCol>
                      <ScCol :xl="12" :lg="12" :md="12" :sm="24" :span="24">
                        <ScFormItem
                          label="所属部门"
                          prop="sysDeptId"
                          class="field-highlight"
                        >
                          <ScSelect
                            :key="`dept-tree-${selectRenderSeed}-${form.sysDeptId ?? 'empty'}-${deptTreeOptions.length}`"
                            v-model="form.sysDeptId"
                            layout="tree"
                            :options="deptTreeOptions"
                            :props="deptTreeProps"
                            :height="280"
                            :tree-show-actions="false"
                            :tree-default-expand-all="true"
                            :tree-expand-on-click-node="true"
                            tree-search-placeholder="搜索部门名称"
                            class="outlined-control"
                            placeholder="请选择部门"
                            clearable
                          />
                        </ScFormItem>
                      </ScCol>
                      <ScCol :xl="12" :lg="12" :md="12" :sm="24" :span="24">
                        <ScFormItem label="邮箱地址" prop="sysUserEmail">
                          <ScInput
                            v-model="form.sysUserEmail"
                            placeholder="请输入邮箱地址"
                            maxlength="120"
                          >
                            <template #prefix>
                              <IconifyIconOnline icon="mdi:email-outline" />
                            </template>
                          </ScInput>
                        </ScFormItem>
                      </ScCol>
                    </ScRow>
                  </section>

                  <section
                    class="form-panel form-panel--secondary identity-summary-card"
                  >
                    <div class="panel-header">
                      <div>
                        <div class="panel-eyebrow">身份信息</div>
                        <h4>证件录入与识别统计</h4>
                      </div>
                      <ScTag
                        size="small"
                        :type="identityTagType"
                        effect="plain"
                      >
                        {{ identityInsight.statusText }}
                      </ScTag>
                    </div>

                    <div
                      class="identity-summary-banner"
                      :class="identityStateClass"
                    >
                      <div class="identity-summary-banner__icon">
                        <IconifyIconOnline
                          :icon="
                            identityStateClass === 'is-valid'
                              ? 'mdi:badge-account-horizontal-outline'
                              : 'mdi:card-account-details-outline'
                          "
                        />
                      </div>
                      <div class="identity-summary-banner__content">
                        <strong>{{ identityInsight.statusText }}</strong>
                        <span>{{ identityInsight.message }}</span>
                      </div>
                    </div>

                    <ScRow :gutter="18" class="form-grid form-grid--compact">
                      <ScCol :xl="12" :lg="12" :md="24" :sm="24" :span="24">
                        <ScFormItem label="身份证号" prop="sysUserCard">
                          <ScInput
                            v-model="form.sysUserCard"
                            placeholder="请输入 15 或 18 位身份证号"
                          >
                            <template #prefix>
                              <IconifyIconOnline
                                icon="mdi:card-account-details-outline"
                              />
                            </template>
                          </ScInput>
                        </ScFormItem>
                      </ScCol>
                      <ScCol :xl="12" :lg="12" :md="24" :sm="24" :span="24">
                        <div class="identity-stats">
                          <div class="identity-stat">
                            <div class="identity-stat__label">
                              <IconifyIconOnline
                                icon="mdi:check-decagram-outline"
                              />
                              <span>识别状态</span>
                            </div>
                            <strong>{{ identityInsight.statusText }}</strong>
                          </div>
                          <div class="identity-stat">
                            <div class="identity-stat__label">
                              <IconifyIconOnline icon="mdi:human-male-female" />
                              <span>证件性别</span>
                            </div>
                            <strong>{{ identityInsight.genderLabel }}</strong>
                          </div>
                          <div class="identity-stat">
                            <div class="identity-stat__label">
                              <IconifyIconOnline
                                icon="mdi:cake-variant-outline"
                              />
                              <span>识别生日</span>
                            </div>
                            <strong>{{ identityInsight.birthdayLabel }}</strong>
                          </div>
                          <div class="identity-stat">
                            <div class="identity-stat__label">
                              <IconifyIconOnline
                                icon="mdi:calendar-account-outline"
                              />
                              <span>识别年龄</span>
                            </div>
                            <strong>{{ identityInsight.ageLabel }}</strong>
                          </div>
                        </div>
                      </ScCol>
                    </ScRow>
                  </section>

                  <div class="content-stack">
                    <section
                      class="form-panel identity-panel"
                      :class="identityStateClass"
                    >
                      <div class="panel-header identity-panel__header">
                        <div>
                          <div class="panel-eyebrow">身份校验</div>
                          <h4>识别结果与人工修正</h4>
                        </div>
                      </div>

                      <p class="identity-card__message">
                        {{ identityInsight.message }}
                      </p>

                      <ScRow :gutter="18" class="form-grid form-grid--compact">
                        <ScCol :span="24">
                          <ScFormItem label="当前性别" prop="sysUserSex">
                            <el-segmented
                              v-model="form.sysUserSex"
                              :options="sexOptions"
                              class="panel-segmented"
                              @change="handleSexManualChange"
                            >
                              <template #default="{ item }">
                                <div class="segmented-item">
                                  <IconifyIconOnline
                                    :icon="
                                      item.value === 1
                                        ? 'mdi:gender-male'
                                        : item.value === 0
                                          ? 'mdi:gender-female'
                                          : 'mdi:gender-non-binary'
                                    "
                                  />
                                  <span>{{ item.label }}</span>
                                </div>
                              </template>
                            </el-segmented>
                          </ScFormItem>
                        </ScCol>
                        <ScCol :span="24">
                          <div class="identity-adjustment-note">
                            <div class="identity-adjustment-note__item">
                              <IconifyIconOnline icon="mdi:sync-circle" />
                              <span>{{ identitySyncText }}</span>
                            </div>
                            <div class="identity-adjustment-note__item">
                              <IconifyIconOnline
                                icon="mdi:card-account-details-outline"
                              />
                              <span>
                                生日、证件性别、年龄已汇总在上方“身份信息统计”卡片中展示。
                              </span>
                            </div>
                          </div>
                        </ScCol>
                      </ScRow>

                      <div class="identity-card__footer">
                        {{ identitySyncText }}
                      </div>
                    </section>

                    <section
                      class="form-panel form-panel--secondary form-panel--collapse"
                    >
                      <el-collapse
                        v-model="collapsedPanels"
                        class="detail-collapse"
                      >
                        <el-collapse-item name="account">
                          <template #title>
                            <div class="collapse-title">
                              <div>
                                <div class="panel-eyebrow">账号设置</div>
                                <strong>权限、状态与居住信息</strong>
                              </div>
                            </div>
                          </template>

                          <ScRow
                            :gutter="18"
                            class="form-grid form-grid--compact"
                          >
                            <ScCol
                              :xl="12"
                              :lg="12"
                              :md="24"
                              :sm="24"
                              :span="24"
                            >
                              <ScFormItem
                                label="角色"
                                prop="roleIds"
                                class="field-highlight"
                              >
                                <ScSelect
                                  :key="`role-${selectRenderSeed}-${form.roleIds.join('-')}-${roleOptions.length}`"
                                  v-model="form.roleIds"
                                  class="outlined-control"
                                  placeholder="请选择角色"
                                  clearable
                                  filterable
                                  multiple
                                  collapse-tags
                                  collapse-tags-tooltip
                                >
                                  <template #prefix>
                                    <IconifyIconOnline
                                      icon="mdi:shield-account"
                                    />
                                  </template>
                                  <ScOption
                                    v-for="item in roleOptions"
                                    :key="item.sysRoleId"
                                    :value="item.sysRoleId"
                                    :label="item.sysRoleName"
                                  >
                                    <div class="role-option">
                                      <span>{{ item.sysRoleName }}</span>
                                      <small>{{ item.sysRoleCode }}</small>
                                    </div>
                                  </ScOption>
                                </ScSelect>
                              </ScFormItem>
                            </ScCol>
                            <ScCol
                              :xl="12"
                              :lg="12"
                              :md="12"
                              :sm="24"
                              :span="24"
                            >
                              <ScFormItem label="用户状态" prop="sysUserStatus">
                                <el-segmented
                                  v-model="form.sysUserStatus"
                                  :options="statusOptions"
                                  class="panel-segmented"
                                />
                              </ScFormItem>
                            </ScCol>
                            <ScCol
                              :xl="12"
                              :lg="12"
                              :md="12"
                              :sm="24"
                              :span="24"
                            >
                              <ScFormItem
                                label="登录密码"
                                prop="sysUserPassword"
                              >
                                <ScInput
                                  v-model="form.sysUserPassword"
                                  placeholder="新增必填，编辑留空则不修改"
                                  type="password"
                                  show-password
                                >
                                  <template #prefix>
                                    <IconifyIconOnline
                                      icon="mdi:lock-outline"
                                    />
                                  </template>
                                </ScInput>
                              </ScFormItem>
                            </ScCol>
                            <ScCol
                              :xl="12"
                              :lg="12"
                              :md="24"
                              :sm="24"
                              :span="24"
                            >
                              <ScFormItem
                                label="居住地址"
                                prop="sysUserFullAddress"
                              >
                                <ScInput
                                  v-model="form.sysUserFullAddress"
                                  placeholder="请输入当前居住地址"
                                  :maxlength="160"
                                  show-word-limit
                                >
                                  <template #prefix>
                                    <IconifyIconOnline
                                      icon="mdi:home-city-outline"
                                    />
                                  </template>
                                </ScInput>
                              </ScFormItem>
                            </ScCol>
                          </ScRow>
                        </el-collapse-item>

                        <el-collapse-item name="note">
                          <template #title>
                            <div class="collapse-title">
                              <div>
                                <div class="panel-eyebrow">补充说明</div>
                                <strong>备注与系统轨迹说明</strong>
                              </div>
                            </div>
                          </template>

                          <div class="system-field-note">
                            <strong>系统轨迹字段自动维护</strong>
                            <span>
                              最后登录地点、注册
                              IP、注册地点由系统根据登录与注册行为回写，已移动到“账号快照”页查看，不在基础资料中手动维护。
                            </span>
                          </div>

                          <ScFormItem label="备注" prop="sysUserRemark">
                            <ScInput
                              v-model="form.sysUserRemark"
                              placeholder="请输入备注"
                              type="textarea"
                              :rows="4"
                              maxlength="200"
                              show-word-limit
                            />
                          </ScFormItem>
                        </el-collapse-item>
                      </el-collapse>
                    </section>
                  </div>
                </div>
              </div>
            </ScTabPane>

            <ScTabPane label="账号快照" name="snapshot" lazy>
              <div class="editor-grid editor-grid--single">
                <section class="form-panel form-panel--wide">
                  <div class="panel-header">
                    <div>
                      <div class="panel-eyebrow">系统视角</div>
                      <h4>账号快照</h4>
                    </div>
                  </div>

                  <div class="overview-list">
                    <div class="overview-item">
                      <span>账号类型</span>
                      <strong>{{
                        form.sysUserInSystem ? "系统账号" : "普通账号"
                      }}</strong>
                    </div>
                    <div class="overview-item">
                      <span>最后登录时间</span>
                      <strong>{{ lastLoginLabel }}</strong>
                    </div>
                    <div class="overview-item">
                      <span>最后登录 IP</span>
                      <strong>{{ form.sysUserLastIp || "未记录" }}</strong>
                    </div>
                    <div class="overview-item">
                      <span>最后登录地点</span>
                      <strong>{{ form.sysUserLastAddress || "未记录" }}</strong>
                    </div>
                    <div class="overview-item">
                      <span>注册 IP</span>
                      <strong>{{ form.sysUserRegisterIp || "未记录" }}</strong>
                    </div>
                    <div class="overview-item">
                      <span>注册地点</span>
                      <strong>{{
                        form.sysUserRegisterAddress || "未记录"
                      }}</strong>
                    </div>
                  </div>
                </section>
              </div>
            </ScTabPane>

            <ScTabPane label="登录日志" name="loginLog" lazy>
              <div class="editor-grid editor-grid--single">
                <section class="form-panel form-panel--wide form-panel--stack">
                  <div class="panel-header">
                    <div>
                      <div class="panel-eyebrow">行为轨迹</div>
                      <h4>登录日志</h4>
                    </div>
                    <ScButton
                      v-if="canLoadUserLogs"
                      size="small"
                      plain
                      @click="loadUserLogs(true)"
                    >
                      刷新日志
                    </ScButton>
                  </div>

                  <div class="login-log-shell">
                    <div
                      v-if="!canLoadUserLogs"
                      class="panel-empty panel-empty--fit"
                    >
                      新增用户尚未入库，保存后再查看登录日志。
                    </div>
                    <div
                      v-else-if="loginLogState.loading"
                      class="panel-empty panel-empty--fit"
                    >
                      正在加载最近登录日志...
                    </div>
                    <div
                      v-else-if="
                        loginLogState.loaded && !loginLogState.rows.length
                      "
                      class="panel-empty panel-empty--fit"
                    >
                      当前账号暂无登录或退出日志。
                    </div>
                    <ScScrollbar
                      v-else
                      height="420px"
                      class="login-log-scroll"
                      wrap-class="login-log-scroll__wrap thin-scroller"
                      view-class="login-log-scroll__view"
                    >
                      <div class="login-log-list">
                        <article
                          v-for="item in loginLogState.rows"
                          :key="item.sysLogId"
                          class="login-log-item"
                        >
                          <div class="login-log-item__header">
                            <div>
                              <strong>{{
                                resolveLogFromLabel(item.sysLogFrom)
                              }}</strong>
                              <span>{{
                                item.createTime || item.updateTime || "--"
                              }}</span>
                            </div>
                            <ScTag
                              size="small"
                              effect="plain"
                              :type="resolveLogStatusType(item.sysLogStatus)"
                            >
                              {{ resolveLogStatusLabel(item.sysLogStatus) }}
                            </ScTag>
                          </div>
                          <div class="login-log-meta">
                            <span>IP：{{ item.sysLogIp || "--" }}</span>
                            <span>地址：{{ item.sysLogAddress || "--" }}</span>
                            <span
                              >登录方式：{{
                                item.sysLogLoginType || "--"
                              }}</span
                            >
                          </div>
                          <p class="login-log-ua">
                            {{
                              item.sysLogUa ||
                              item.sysLogUrl ||
                              "未记录客户端信息"
                            }}
                          </p>
                        </article>
                      </div>
                    </ScScrollbar>
                  </div>
                </section>
              </div>
            </ScTabPane>
          </ScTabs>
        </div>
      </ScForm>

      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="visible = false">取消</ScButton>
          <ScButton
            v-if="mode !== 'show'"
            type="primary"
            :loading="loading"
            @click="submit"
          >
            保存
          </ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components/ReIcon";

import { computed, nextTick, reactive, ref, watch } from "vue";
import {
  fetchPageUserLog,
  fetchUpdateUser,
  fetchSaveUser,
  fetchUploadAvatar,
  type UserLog,
} from "@repo/core";
import { message } from "@repo/utils";
import { Md5 } from "ts-md5";
import { REGEXP_PWD } from "@pages/common/login/utils/rule";
import { $t, transformI18n } from "@repo/config";
import { fetchPageRole } from "@/api/manage/role";
import { fetchListDept } from "@/api/manage/dept";

interface SelectOption {
  label: string;
  value: number | string;
  plainLabel?: string;
}

interface TreeSelectOption extends SelectOption {
  children?: TreeSelectOption[];
}

interface UserForm {
  sysUserId?: number | string;
  sysUserInSystem?: number;
  sysDeptId?: number | string | null;
  sysDeptName?: string;
  updateTime?: string | null;
  sysUserUsername: string;
  sysUserNickname: string;
  sysUserPassword: string | null;
  sysUserPhone: string;
  sysUserEmail: string;
  sysUserAvatar: string;
  sysUserSex: number;
  sysUserStatus: number;
  sysUserCard: string;
  sysUserRemark: string;
  sysUserFullAddress?: string;
  sysUserLastIp?: string;
  sysUserLastAddress?: string;
  sysUserLastLoginTime?: string;
  sysUserRegisterIp?: string;
  sysUserRegisterAddress?: string;
  roleIds: number[];
  userRoles?: { sysRoleId: number }[];
}

interface IdentityInsight {
  normalized: string;
  valid: boolean;
  statusText: string;
  message: string;
  birthdayLabel: string;
  ageLabel: string;
  genderLabel: string;
  genderValue: number;
}

const emit = defineEmits<{
  (e: "success"): void;
}>();

const dialogFormRef = ref();
const avatarLoading = ref(false);
const visible = ref(false);
const loading = ref(false);
const mode = ref("save");
const activeEditorTab = ref("account");
const collapsedPanels = ref(["account"]);
const roleOptions = ref<any[]>([]);
const deptOptions = ref<SelectOption[]>([]);
const deptTreeOptions = ref<TreeSelectOption[]>([]);
const selectRenderSeed = ref(0);
const syncingSexFromCard = ref(false);
const sexSource = ref<"default" | "card" | "manual">("default");
const loginLogState = reactive<{
  loading: boolean;
  loaded: boolean;
  rows: UserLog[];
}>({
  loading: false,
  loaded: false,
  rows: [],
});

const createDefaultForm = (): UserForm => ({
  sysUserUsername: "",
  sysUserNickname: "",
  sysUserPassword: "",
  sysUserPhone: "",
  sysUserEmail: "",
  sysUserAvatar: "",
  sysUserSex: 2,
  sysUserStatus: 1,
  sysUserCard: "",
  sysUserRemark: "",
  sysUserFullAddress: "",
  sysUserInSystem: 0,
  sysDeptId: null,
  sysDeptName: "",
  roleIds: [],
  sysUserLastIp: "",
  sysUserLastAddress: "",
  sysUserLastLoginTime: "",
  sysUserRegisterIp: "",
  sysUserRegisterAddress: "",
  updateTime: "",
});

const form = ref<UserForm>(createDefaultForm());

const normalizeOptionalNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const normalized = Number(value);
  return Number.isNaN(normalized) ? null : normalized;
};

const normalizeNumericList = (value: unknown): number[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => Number(item))
    .filter((item) => !Number.isNaN(item));
};

const identityInsight = ref<IdentityInsight>({
  normalized: "",
  valid: false,
  statusText: "未填写",
  message: "填写身份证后会自动识别生日和性别，不会额外增加存储字段。",
  birthdayLabel: "--",
  ageLabel: "--",
  genderLabel: "--",
  genderValue: 2,
});

const rules = reactive<Record<string, any>>({
  sysUserUsername: [
    { required: true, message: "请输入账号名称", trigger: "blur" },
  ],
  sysUserPhone: [
    {
      validator: (_rule, value, callback) => {
        if (!value || /^1\d{10}$/.test(String(value))) {
          callback();
          return;
        }
        callback(new Error("手机号格式不正确"));
      },
      trigger: "blur",
    },
  ],
  sysUserEmail: [
    {
      validator: (_rule, value, callback) => {
        if (!value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
          callback();
          return;
        }
        callback(new Error("邮箱格式不正确"));
      },
      trigger: "blur",
    },
  ],
  sysUserCard: [
    {
      validator: (_rule, value, callback) => {
        if (!value) {
          callback();
          return;
        }
        const parsed = parseIdentityCard(value);
        if (parsed.valid) {
          callback();
          return;
        }
        callback(new Error(parsed.message));
      },
      trigger: "blur",
    },
  ],
});

const statusOptions = [
  { label: "开启", value: 1 },
  { label: "禁用", value: 0 },
];

const sexOptions = [
  { label: "男", value: 1 },
  { label: "女", value: 0 },
  { label: "其他", value: 2 },
];

const dialogTitle = computed(() => {
  if (mode.value === "save") return "新增用户";
  return mode.value === "show" ? "查看用户" : "编辑用户";
});

const modeLabel = computed(() => {
  if (mode.value === "save") return "新增模式";
  return mode.value === "show" ? "只读模式" : "编辑模式";
});

const profileSubtitle = computed(() => {
  return [
    form.value.sysUserEmail || "未设置邮箱",
    form.value.sysUserPhone || "未设置手机号",
  ].join(" · ");
});

const deptDisplayLabel = computed(() => {
  const current = deptOptions.value.find(
    (item) => String(item.value) === String(form.value.sysDeptId ?? ""),
  );
  return current?.plainLabel || form.value.sysDeptName || "未分配部门";
});

const isSyntheticLastLoginState = () => {
  return (
    !form.value.sysUserLastLoginTime &&
    !form.value.updateTime &&
    Boolean(form.value.sysUserLastIp || form.value.sysUserLastAddress) &&
    form.value.sysUserLastIp === form.value.sysUserRegisterIp &&
    form.value.sysUserLastAddress === form.value.sysUserRegisterAddress
  );
};

const resolveLastLoginTime = () => {
  if (isSyntheticLastLoginState()) {
    return "";
  }
  return (
    form.value.sysUserLastLoginTime ||
    ((form.value.sysUserLastIp || form.value.sysUserLastAddress) &&
      form.value.updateTime) ||
    ""
  );
};

const lastLoginLabel = computed(() => {
  return resolveLastLoginTime() || "从未登录";
});

const canLoadUserLogs = computed(() =>
  Boolean(form.value.sysUserId && form.value.sysUserUsername),
);

const identityStateClass = computed(() => {
  if (!identityInsight.value.normalized) return "is-empty";
  return identityInsight.value.valid ? "is-valid" : "is-invalid";
});

const identityTagType = computed(() => {
  if (!identityInsight.value.normalized) return "info";
  return identityInsight.value.valid ? "success" : "warning";
});

const identitySyncText = computed(() => {
  if (!identityInsight.value.valid) {
    return "身份证未通过校验时，不会自动改动当前性别。";
  }
  return sexSource.value === "manual"
    ? "当前性别已手动调整，后续以当前选择为准。"
    : "身份证校验通过后，系统已自动同步当前性别。";
});

const normalizeCard = (value: string | null | undefined) => {
  return String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
};

const isValidDateString = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

const formatBirthday = (year: number, month: number, day: number) => {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const calculateAge = (birthday: string) => {
  const [year, month, day] = birthday.split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthOffset = today.getMonth() + 1 - month;
  const dayOffset = today.getDate() - day;
  if (monthOffset < 0 || (monthOffset === 0 && dayOffset < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : 0;
};

const parseIdentityCard = (
  value: string | null | undefined,
): IdentityInsight => {
  const normalized = normalizeCard(value);
  if (!normalized) {
    return {
      normalized,
      valid: false,
      statusText: "未填写",
      message: "填写身份证后会自动识别生日和性别，不会额外增加存储字段。",
      birthdayLabel: "--",
      ageLabel: "--",
      genderLabel: "--",
      genderValue: 2,
    };
  }

  if (!/^\d{15}$|^\d{17}[\dX]$/.test(normalized)) {
    return {
      normalized,
      valid: false,
      statusText: "格式错误",
      message: "身份证格式不正确，仅支持 15 位或 18 位中国大陆身份证。",
      birthdayLabel: "--",
      ageLabel: "--",
      genderLabel: "--",
      genderValue: 2,
    };
  }

  let year = 0;
  let month = 0;
  let day = 0;
  let genderCode = 0;

  if (normalized.length === 18) {
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCode = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];
    const total = normalized
      .slice(0, 17)
      .split("")
      .reduce((sum, item, index) => sum + Number(item) * weights[index], 0);
    if (checkCode[total % 11] !== normalized[17]) {
      return {
        normalized,
        valid: false,
        statusText: "校验失败",
        message: "身份证校验位不正确，请检查是否录入完整。",
        birthdayLabel: "--",
        ageLabel: "--",
        genderLabel: "--",
        genderValue: 2,
      };
    }
    year = Number(normalized.slice(6, 10));
    month = Number(normalized.slice(10, 12));
    day = Number(normalized.slice(12, 14));
    genderCode = Number(normalized[16]);
  } else {
    year = Number(`19${normalized.slice(6, 8)}`);
    month = Number(normalized.slice(8, 10));
    day = Number(normalized.slice(10, 12));
    genderCode = Number(normalized[14]);
  }

  if (!isValidDateString(year, month, day)) {
    return {
      normalized,
      valid: false,
      statusText: "生日无效",
      message: "身份证中的出生日期无效，请检查号码是否录入正确。",
      birthdayLabel: "--",
      ageLabel: "--",
      genderLabel: "--",
      genderValue: 2,
    };
  }

  const birthday = formatBirthday(year, month, day);
  const genderValue = genderCode % 2 === 0 ? 0 : 1;
  return {
    normalized,
    valid: true,
    statusText: "已识别",
    message: "身份证校验通过，生日和性别已从号码中识别。",
    birthdayLabel: birthday,
    ageLabel: `${calculateAge(birthday)} 岁`,
    genderLabel: genderValue === 1 ? "男" : "女",
    genderValue,
  };
};

watch(
  () => form.value.sysUserCard,
  (value, oldValue) => {
    if (normalizeCard(value) !== normalizeCard(oldValue)) {
      sexSource.value = "card";
    }
    identityInsight.value = parseIdentityCard(value);
    if (!identityInsight.value.valid || sexSource.value === "manual") {
      return;
    }
    syncingSexFromCard.value = true;
    form.value.sysUserSex = identityInsight.value.genderValue;
    sexSource.value = "card";
    syncingSexFromCard.value = false;
  },
  { immediate: true },
);

const flattenDeptOptions = (items: any[] = [], depth = 0): SelectOption[] => {
  return items.flatMap((item) => {
    const prefix = depth > 0 ? `${"— ".repeat(depth)}` : "";
    return [
      {
        label: `${prefix}${item.sysDeptName}`,
        plainLabel: item.sysDeptName,
        value: item.sysDeptId,
      },
      ...flattenDeptOptions(item.children || [], depth + 1),
    ];
  });
};

const buildDeptTreeOptions = (items: any[] = []): TreeSelectOption[] => {
  return items.map((item) => ({
    label: item.sysDeptName,
    plainLabel: item.sysDeptName,
    value: item.sysDeptId,
    children: buildDeptTreeOptions(item.children || []),
  }));
};

const deptTreeProps = {
  value: "value",
  label: "label",
  children: "children",
};

const resolveDeptName = (data: any) => {
  return (
    data?.sysDeptName ??
    data?.deptName ??
    data?.departmentName ??
    data?.sysUserDeptName ??
    data?.sysDept?.sysDeptName ??
    data?.sysDept?.deptName ??
    data?.sysDept?.name ??
    data?.department?.sysDeptName ??
    data?.department?.deptName ??
    data?.department?.name ??
    data?.dept?.sysDeptName ??
    data?.dept?.deptName ??
    data?.dept?.name ??
    ""
  );
};

const resolveDeptId = (data: any) => {
  return normalizeOptionalNumericValue(
    data?.sysDeptId ??
      data?.sysUserDeptId ??
      data?.departmentId ??
      data?.deptId ??
      data?.sysDept?.sysDeptId ??
      data?.sysDept?.deptId ??
      data?.sysDept?.id ??
      data?.department?.sysDeptId ??
      data?.department?.deptId ??
      data?.department?.id ??
      data?.dept?.sysDeptId ??
      data?.dept?.deptId ??
      data?.dept?.id ??
      null,
  );
};

const ensureCurrentDeptOption = (
  deptId: number | string | null | undefined,
  deptName?: string,
) => {
  if (deptId === null || deptId === undefined || deptId === "" || !deptName) {
    return;
  }
  const exists = deptOptions.value.some(
    (item) => String(item.value) === String(deptId),
  );
  if (exists) {
    return;
  }
  deptOptions.value = [
    {
      label: deptName,
      plainLabel: deptName,
      value: deptId,
    },
    ...deptOptions.value,
  ];
};

const getMatchedDeptOption = (
  deptId: number | string | null | undefined,
  deptName = "",
) => {
  if (deptId !== null && deptId !== undefined && deptId !== "") {
    const matchedById = deptOptions.value.find(
      (item) => String(item.value) === String(deptId),
    );
    if (matchedById) {
      return matchedById;
    }
  }

  if (!deptName) {
    return null;
  }

  return deptOptions.value.find((item) => item.plainLabel === deptName) || null;
};

const syncDeptSelection = (
  deptId: number | string | null | undefined,
  fallbackName = "",
  keepFallback = false,
) => {
  const normalizedFallbackName = String(fallbackName || "").trim();
  if (deptId === null || deptId === undefined || deptId === "") {
    if (keepFallback && normalizedFallbackName) {
      const matchedByName = getMatchedDeptOption(null, normalizedFallbackName);
      if (matchedByName) {
        form.value.sysDeptId = normalizeOptionalNumericValue(
          matchedByName.value,
        );
        form.value.sysDeptName =
          matchedByName.plainLabel || matchedByName.label || "";
        return;
      }
      form.value.sysDeptId = null;
      form.value.sysDeptName = normalizedFallbackName;
      return;
    }
    form.value.sysDeptId = null;
    form.value.sysDeptName = "";
    return;
  }

  const matched = getMatchedDeptOption(deptId, fallbackName);
  if (matched) {
    form.value.sysDeptId = normalizeOptionalNumericValue(matched.value);
    form.value.sysDeptName = matched.plainLabel || matched.label || "";
    return;
  }

  if (fallbackName) {
    ensureCurrentDeptOption(deptId, fallbackName);
    form.value.sysDeptId = normalizeOptionalNumericValue(deptId);
    form.value.sysDeptName = fallbackName;
  }
};

const syncDeptNameFromOptions = (
  deptId: number | string | null | undefined,
  fallbackName = "",
  keepFallback = false,
) => {
  syncDeptSelection(deptId, fallbackName, keepFallback);
};

const refreshSelects = async () => {
  await nextTick();
  selectRenderSeed.value += 1;
};

const loadRoleOptions = async () => {
  try {
    const res = await fetchPageRole({ page: 1, pageSize: 200 });
    const records = (res as any)?.data?.records || (res as any)?.data || [];
    roleOptions.value = Array.isArray(records) ? records : [];
  } catch (error) {
    roleOptions.value = [];
  }
};

const resolveLogFromLabel = (value?: string) => {
  const fromMap: Record<string, string> = {
    LOGIN: "登录成功",
    LOGIN_FAIL: "登录失败",
    LOGOUT: "退出登录",
  };
  return fromMap[String(value || "").toUpperCase()] || value || "未知事件";
};

const resolveLogStatusLabel = (value?: string | number) => {
  const normalized = String(value ?? "");
  return normalized === "1" ? "成功" : normalized === "0" ? "失败" : "未知";
};

const resolveLogStatusType = (value?: string | number) => {
  const normalized = String(value ?? "");
  return normalized === "1"
    ? "success"
    : normalized === "0"
      ? "danger"
      : "info";
};

const loadUserLogs = async (force = false) => {
  if (!canLoadUserLogs.value) {
    loginLogState.rows = [];
    loginLogState.loaded = true;
    return;
  }
  if (loginLogState.loading || (loginLogState.loaded && !force)) {
    return;
  }

  loginLogState.loading = true;
  try {
    const response: any = await fetchPageUserLog({
      page: 1,
      pageSize: 8,
      sysLogUsername: form.value.sysUserUsername,
    });
    const records =
      response?.data?.records ||
      response?.data?.rows ||
      response?.data?.data ||
      response?.data ||
      [];
    loginLogState.rows = Array.isArray(records) ? records : [];
  } catch {
    loginLogState.rows = [];
    message("加载登录日志失败", { type: "error" });
  } finally {
    loginLogState.loading = false;
    loginLogState.loaded = true;
  }
};

const loadDeptOptions = async () => {
  try {
    const res = await fetchListDept({});
    const records = (res as any)?.data || [];
    deptTreeOptions.value = buildDeptTreeOptions(
      Array.isArray(records) ? records : [],
    );
    deptOptions.value = flattenDeptOptions(
      Array.isArray(records) ? records : [],
    );
    if (form.value.sysDeptId === null && form.value.sysDeptName) {
      const matched = getMatchedDeptOption(null, form.value.sysDeptName);
      if (matched) {
        form.value.sysDeptId = normalizeOptionalNumericValue(matched.value);
      }
    }
    ensureCurrentDeptOption(form.value.sysDeptId, form.value.sysDeptName);
    syncDeptNameFromOptions(form.value.sysDeptId, form.value.sysDeptName, true);
  } catch (error) {
    deptTreeOptions.value = [];
    deptOptions.value = [];
  } finally {
    void refreshSelects();
  }
};

const close = async () => {
  visible.value = false;
  loading.value = false;
  avatarLoading.value = false;
  activeEditorTab.value = "account";
  collapsedPanels.value = ["account"];
  sexSource.value = "default";
  delete rules["sysUserPassword"];
  form.value = createDefaultForm();
  identityInsight.value = parseIdentityCard("");
  loginLogState.loading = false;
  loginLogState.loaded = false;
  loginLogState.rows = [];
};

const setData = async (data: any) => {
  const cloned = {
    ...createDefaultForm(),
    ...JSON.parse(JSON.stringify(data || {})),
  };
  cloned.sysDeptId = resolveDeptId(data);
  cloned.sysDeptName = resolveDeptName(data);
  cloned.sysUserAvatar = data?.sysUserAvatar || data?.avatar || "";
  cloned.sysUserSex = normalizeOptionalNumericValue(cloned.sysUserSex) ?? 2;
  cloned.sysUserStatus =
    normalizeOptionalNumericValue(cloned.sysUserStatus) ?? 1;
  cloned.roleIds = normalizeNumericList(
    data?.userRoles?.map((item: any) => item.sysRoleId) || data?.roleIds || [],
  );
  if (cloned.sysDeptId === null && cloned.sysDeptName) {
    const matched = getMatchedDeptOption(null, cloned.sysDeptName);
    if (matched) {
      cloned.sysDeptId = normalizeOptionalNumericValue(matched.value);
    }
  }
  form.value = cloned;
  ensureCurrentDeptOption(cloned.sysDeptId, cloned.sysDeptName);
  syncDeptNameFromOptions(cloned.sysDeptId, cloned.sysDeptName, true);
  await refreshSelects();
  activeEditorTab.value = "account";
  collapsedPanels.value = ["account"];
  sexSource.value = "default";
  identityInsight.value = parseIdentityCard(cloned.sysUserCard);
  loginLogState.loading = false;
  loginLogState.loaded = false;
  loginLogState.rows = [];
};

const getAvatarClass = () => {
  const sex = form.value.sysUserSex;
  if (sex === 1) return "is-male";
  if (sex === 0) return "is-female";
  return "is-other";
};

const getAvatarText = () => {
  const name = form.value.sysUserNickname || form.value.sysUserUsername || "";
  return name ? name[0].toUpperCase() : "?";
};

const handleSexManualChange = () => {
  if (syncingSexFromCard.value) return;
  sexSource.value = "manual";
};

const handleAvatarChange = async (uploadFile: any) => {
  if (!uploadFile.raw) return;

  if (!uploadFile.raw.type.startsWith("image/")) {
    message("请上传图片文件", { type: "warning" });
    return;
  }
  if (uploadFile.raw.size > 2 * 1024 * 1024) {
    message("头像文件不能超过2MB", { type: "warning" });
    return;
  }

  avatarLoading.value = true;
  try {
    const res = await fetchUploadAvatar(uploadFile.raw);
    if (res?.code === "00000" && res?.data?.url) {
      form.value.sysUserAvatar = res.data.url;
      message("头像上传成功", { type: "success" });
      return;
    }
    message(res?.msg || "头像上传失败", { type: "error" });
  } catch (error) {
    message("头像上传失败", { type: "error" });
  } finally {
    avatarLoading.value = false;
  }
};

const open = async (modeValue = "save") => {
  visible.value = true;
  mode.value = modeValue;
  await Promise.all([loadRoleOptions(), loadDeptOptions()]);
  await refreshSelects();

  if (mode.value === "edit") {
    form.value.sysUserPassword = null;
  }

  if (mode.value === "save") {
    rules["sysUserPassword"] = [
      {
        required: true,
        message: transformI18n($t("login.purePassWordReg")),
        trigger: "blur",
      },
      { min: 6, message: "密码长度不能小于6位", trigger: "blur" },
      { max: 20, message: "密码长度不能大于20位", trigger: "blur" },
      {
        pattern: REGEXP_PWD,
        message: transformI18n($t("login.purePassWordRuleReg")),
        trigger: "blur",
      },
    ];
  }
};

const submit = async () => {
  if (!form.value.sysUserNickname) {
    form.value.sysUserNickname = form.value.sysUserUsername;
  }

  if (
    form.value.sysUserPassword &&
    !REGEXP_PWD.test(form.value.sysUserPassword)
  ) {
    message(transformI18n($t("login.purePassWordRuleReg")), {
      type: "error",
    });
    return;
  }

  let valid = false;
  try {
    valid = await dialogFormRef.value?.validate();
  } catch (error) {
    valid = false;
  }

  if (!valid) return;

  loading.value = true;
  const newForm: any = {
    sysUserPassword: null,
    roleIds: [],
    updateRole: true,
  };
  Object.assign(newForm, form.value);

  if (newForm.sysUserPassword) {
    newForm.sysUserPassword = Md5.hashStr(newForm.sysUserPassword);
  }
  newForm.sysDeptId = normalizeOptionalNumericValue(newForm.sysDeptId);
  newForm.sysDeptName =
    deptOptions.value.find(
      (item) => String(item.value) === String(newForm.sysDeptId ?? ""),
    )?.plainLabel ||
    newForm.sysDeptName ||
    "";
  newForm.sysUserSex = normalizeOptionalNumericValue(newForm.sysUserSex) ?? 2;
  newForm.sysUserStatus =
    normalizeOptionalNumericValue(newForm.sysUserStatus) ?? 1;
  newForm.roleIds = normalizeNumericList(form.value.roleIds);

  try {
    const res: any =
      mode.value === "save"
        ? await fetchSaveUser(newForm)
        : await fetchUpdateUser(newForm);

    if (res?.code === "00000") {
      message(mode.value === "save" ? "添加成功" : "更新成功", {
        type: "success",
      });
      emit("success");
      visible.value = false;
      return;
    }
    message(res?.msg || "操作失败", { type: "error" });
  } catch (error) {
    message("操作失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

defineExpose({
  close,
  setData,
  open,
});

watch(
  () => form.value.sysDeptId,
  (value) => {
    syncDeptNameFromOptions(value, form.value.sysDeptName);
  },
);

watch(
  () =>
    deptOptions.value
      .map((item) => `${item.value}:${item.plainLabel || item.label}`)
      .join("|"),
  () => {
    syncDeptSelection(form.value.sysDeptId, form.value.sysDeptName, true);
  },
);

watch(
  activeEditorTab,
  (tab) => {
    if (tab === "loginLog") {
      void loadUserLogs();
    }
  },
  { flush: "post" },
);
</script>

<style lang="scss" scoped>
.user-save-container {
  .user-dialog {
    :deep(.el-dialog) {
      max-width: calc(100vw - 36px);
      overflow: hidden;
      border: 1px solid rgba(214, 224, 238, 0.96);
      border-radius: 26px;
      box-shadow: 0 28px 76px -42px rgb(15 23 42 / 34%);
    }

    :deep(.el-dialog__header) {
      padding: 18px 24px 16px;
      margin: 0;
      background: linear-gradient(180deg, #fff, #f8fbff);
      border-bottom: 1px solid rgba(224, 231, 255, 0.86);
    }

    :deep(.el-dialog__body) {
      padding: 22px;
      overflow-y: auto;
      max-height: calc(100vh - 174px);
      background:
        radial-gradient(
          circle at top left,
          rgba(59, 130, 246, 0.08),
          transparent 28%
        ),
        linear-gradient(180deg, #f6f9ff 0%, #f3f7fe 100%);
    }

    :deep(.el-dialog__footer) {
      padding: 16px 22px 20px;
      background: linear-gradient(180deg, #f8fbff, #fff);
      border-top: 1px solid rgba(224, 231, 255, 0.86);
    }
  }
}

.user-editor {
  min-height: 0;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(300px, 340px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.editor-column {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}

.editor-column--content {
  gap: 16px;
}

.content-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.profile-card,
.form-panel {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(210, 220, 235, 0.92);
  border-radius: 22px;
  box-shadow: 0 16px 36px -30px rgb(15 23 42 / 20%);
}

.profile-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 22px;
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.14),
      transparent 34%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.98),
      rgba(247, 250, 255, 0.95)
    );
}

.editor-summary__main {
  display: flex;
  gap: 18px;
  align-items: center;
}

.editor-summary__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.avatar-uploader {
  align-self: flex-start;
}

.profile-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  overflow: hidden;
  border-radius: 30px;
  border: 1px solid rgba(191, 219, 254, 0.96);
  box-shadow: 0 18px 30px -24px rgb(37 99 235 / 32%);
  cursor: pointer;

  &.is-male {
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
  }

  &.is-female {
    background: linear-gradient(135deg, #fff1f2, #ffe4e6);
  }

  &.is-other {
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  }
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 34px;
  font-weight: 700;
  color: #1f2937;
}

.avatar-overlay {
  position: absolute;
  inset: auto 10px 10px;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  padding: 6px 10px;
  font-size: 12px;
  color: #fff;
  background: rgba(15, 23, 42, 0.72);
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.profile-avatar:hover .avatar-overlay {
  opacity: 1;
}

.profile-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;

  h3 {
    margin: 0;
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #64748b;
    line-height: 1.6;
  }
}

.profile-eyebrow,
.panel-eyebrow {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.profile-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.profile-metrics,
.overview-list {
  display: grid;
  gap: 10px;
}

.profile-metrics {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.summary-item,
.overview-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;

  span {
    font-size: 12px;
    color: #64748b;
  }

  strong {
    color: #0f172a;
    line-height: 1.5;
    word-break: break-word;
  }
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 4px 0 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
  }
}

.identity-panel {
  position: relative;
  overflow: hidden;

  &.is-valid {
    border-color: rgba(16, 185, 129, 0.34);
    background: linear-gradient(180deg, #ffffff, #f0fdf4);
  }

  &.is-invalid {
    border-color: rgba(245, 158, 11, 0.34);
    background: linear-gradient(180deg, #ffffff, #fff7ed);
  }
}

.identity-card__message,
.identity-card__footer {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.identity-adjustment-note {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 18px;
}

.identity-adjustment-note__item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  color: #64748b;
  line-height: 1.6;

  .iconify {
    margin-top: 2px;
    font-size: 16px;
    color: #3b82f6;
    flex: none;
  }

  span {
    font-size: 13px;
  }
}

.identity-summary-card {
  gap: 14px;
}

.identity-summary-banner {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(241, 245, 249, 0.92), #fff);
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 18px;

  &.is-valid {
    border-color: rgba(16, 185, 129, 0.28);
    background: linear-gradient(135deg, rgba(236, 253, 245, 0.95), #fff);

    .identity-summary-banner__icon {
      color: #059669;
      background: rgba(16, 185, 129, 0.12);
    }
  }

  &.is-invalid {
    border-color: rgba(245, 158, 11, 0.28);
    background: linear-gradient(135deg, rgba(255, 247, 237, 0.95), #fff);

    .identity-summary-banner__icon {
      color: #d97706;
      background: rgba(245, 158, 11, 0.12);
    }
  }
}

.identity-summary-banner__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  font-size: 22px;
  color: #2563eb;
  background: rgba(37, 99, 235, 0.1);
  border-radius: 14px;
}

.identity-summary-banner__content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  strong {
    color: #0f172a;
    font-size: 15px;
    line-height: 1.4;
  }

  span {
    color: #64748b;
    font-size: 13px;
    line-height: 1.6;
  }
}

.identity-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  height: 100%;
}

.identity-stat {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-height: 72px;
  padding: 12px 14px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;

  span {
    font-size: 12px;
    color: #64748b;
  }

  strong {
    color: #0f172a;
    font-size: 15px;
    line-height: 1.4;
    word-break: break-word;
  }
}

.identity-stat__label {
  display: inline-flex;
  gap: 6px;
  align-items: center;

  .iconify {
    font-size: 15px;
    color: #3b82f6;
  }
}

.editor-tabs {
  display: block;

  :deep(.el-tabs__header) {
    margin: 0 0 18px;
  }

  :deep(.el-tabs__nav-wrap) {
    padding: 6px;
    background: rgba(255, 255, 255, 0.84);
    border: 1px solid rgba(214, 224, 238, 0.92);
    border-radius: 18px;
  }

  :deep(.el-tabs__item) {
    min-height: 42px;
    font-weight: 600;
    border-radius: 12px;
  }
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.editor-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.form-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
}

.form-panel--secondary {
  gap: 14px;
  background: rgba(255, 255, 255, 0.9);
}

.form-panel--collapse {
  padding: 12px 14px;
}

.detail-collapse {
  :deep(.el-collapse) {
    border: none;
  }

  :deep(.el-collapse-item) {
    border: 1px solid rgba(226, 232, 240, 0.92);
    border-radius: 18px;
    background: rgba(248, 250, 252, 0.88);
    overflow: hidden;

    & + .el-collapse-item {
      margin-top: 12px;
    }
  }

  :deep(.el-collapse-item__header) {
    min-height: 58px;
    padding: 0 16px;
    background: transparent;
    border: none;
    color: #0f172a;
  }

  :deep(.el-collapse-item__wrap) {
    border: none;
    background: transparent;
  }

  :deep(.el-collapse-item__content) {
    padding: 0 16px 16px;
  }
}

.collapse-title {
  display: flex;
  align-items: center;
  min-height: 58px;

  strong {
    display: block;
    margin-top: 4px;
    color: #0f172a;
    font-size: 15px;
    line-height: 1.35;
  }
}

.form-panel--stack {
  min-height: 340px;
}

.form-panel--wide {
  grid-column: span 2;
}

.form-grid {
  width: 100%;
}

.form-grid--compact {
  :deep(.el-row) {
    row-gap: 14px;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 6px;
    line-height: 1.3;
  }
}

.panel-segmented {
  width: 100%;
}

.segmented-item {
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.role-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;

  small {
    color: #94a3b8;
  }
}

.field-highlight {
  :deep(.el-form-item__label) {
    font-weight: 700;
    color: #0f172a;
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.panel-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  padding: 24px;
  color: #64748b;
  text-align: center;
  background: rgba(248, 250, 252, 0.92);
  border: 1px dashed rgba(203, 213, 225, 0.9);
  border-radius: 18px;
}

.panel-empty--fit {
  min-height: 100%;
  height: 100%;
}

.login-log-shell {
  min-height: 420px;
  max-height: 420px;
}

.login-log-list {
  display: grid;
  gap: 14px;
}

.login-log-scroll {
  height: 420px;
}

:deep(.login-log-scroll__wrap) {
  padding-right: 8px;
}

:deep(.login-log-scroll__view) {
  min-height: 100%;
}

.login-log-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  background: rgba(248, 250, 252, 0.88);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 18px;
}

.login-log-item__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  strong {
    display: block;
    color: #0f172a;
  }

  span {
    font-size: 12px;
    color: #64748b;
  }
}

.login-log-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  color: #475569;
  font-size: 13px;
}

.login-log-ua {
  margin: 0;
  color: #64748b;
  line-height: 1.6;
  word-break: break-word;
}

.system-field-note {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), #fff);
  border: 1px dashed rgba(148, 163, 184, 0.42);
  border-radius: 18px;

  strong {
    color: #0f172a;
    font-size: 13px;
    font-weight: 700;
  }

  span {
    color: #64748b;
    line-height: 1.65;
    font-size: 13px;
  }
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  min-height: var(--app-control-min-height, 30px);
  border: 1px solid var(--app-control-border, rgba(203, 213, 225, 0.96));
  border-radius: var(--app-control-radius, 14px);
  background: var(--app-control-bg, #fff);
  box-shadow: 0 0 0 1px transparent;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

:deep(.el-textarea__inner) {
  min-height: max(96px, calc(var(--app-control-min-height, 30px) * 3));
  border: 1px solid var(--app-control-border, rgba(203, 213, 225, 0.96));
  border-radius: var(--app-control-radius, 14px);
  background: var(--app-control-bg, #fff);
  box-shadow: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.outlined-control {
  display: block;

  :deep(.el-select__wrapper) {
    min-height: var(--app-control-min-height, 30px);
    border-width: 1px;
    border-style: solid;
    border-color: rgba(59, 130, 246, 0.42);
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.98), #f6faff), #fff;
    box-shadow:
      inset 0 0 0 1px rgba(59, 130, 246, 0.08),
      0 12px 24px -22px rgba(59, 130, 246, 0.55);
  }

  :deep(.el-select__wrapper:hover) {
    border-color: rgba(59, 130, 246, 0.72);
    box-shadow:
      inset 0 0 0 1px rgba(59, 130, 246, 0.12),
      0 14px 28px -22px rgba(59, 130, 246, 0.6);
  }
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focused),
:deep(.el-textarea__inner:focus) {
  border-color: rgba(59, 130, 246, 0.92);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

@media (width <= 1360px) {
  .editor-layout {
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
  }
}

@media (width <= 1080px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .content-stack {
    grid-template-columns: 1fr;
  }

  .editor-summary__main {
    align-items: flex-start;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  .form-panel--wide {
    grid-column: span 1;
  }
}

@media (width <= 768px) {
  .editor-summary__main {
    flex-direction: column;
    align-items: flex-start;
  }

  .profile-metrics,
  .identity-stats,
  .login-log-meta {
    grid-template-columns: 1fr;
  }

  .identity-summary-banner {
    align-items: flex-start;
  }

  .user-save-container {
    .user-dialog {
      :deep(.el-dialog__body) {
        padding: 16px;
      }
    }
  }

  .login-log-shell,
  .login-log-scroll {
    min-height: 360px;
    max-height: 360px;
    height: 360px;
  }
}
</style>
