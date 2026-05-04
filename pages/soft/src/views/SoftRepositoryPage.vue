<template>
  <SoftWorkspace
    title="仓库管理"
    subtitle="统一管理主定义源、参考同步源与安装包上传入口。"
    :metrics="workspaceMetrics"
  >
    <template #actions>
      <el-dropdown trigger="click" @command="applyRepositoryPreset">
        <ScButton circle>
          <IconifyIconOnline icon="ri:apps-2-line" />
        </ScButton>
      </el-dropdown>
      <el-tooltip content="刷新定义" placement="top">
        <ScButton circle @click="loadRepositories">
          <IconifyIconOnline icon="ri:refresh-line" />
        </ScButton>
      </el-tooltip>
      <el-tooltip content="新建仓库定义" placement="top">
        <ScButton circle type="primary" @click="openCreate">
          <IconifyIconOnline icon="ri:add-line" />
        </ScButton>
      </el-tooltip>
    </template>

    <section class="repository-toolbar">
      <el-input
        v-model="keyword"
        clearable
        placeholder="搜索仓库名称、编码、地址"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <ScSelect
        v-model="statusFilter"
        placeholder="全部状态"
        :options="statusFilterOptions"
        layout="dropdown"
        width="100%"
        dropdown-title="仓库状态"
        dropdown-placeholder="全部状态"
        dropdown-icon="ri:toggle-line"
        :dropdown-col="1"
        display-mode="normal"
      />
      <div class="repository-toolbar__meta">
        <span>仓库定义 {{ repositories.length }}</span>
        <span>启用 {{ enabledCount }}</span>
        <span>参考源 {{ multiSourceCount }}</span>
      </div>
    </section>

    <ScTable
      v-loading="loading"
      :data="filteredRepositories"
      layout="card"
      card-layout="default"
      row-key="softRepositoryId"
      :col-size="4"
      :hide-pagination="true"
      :border="false"
      :stripe="false"
      class="repository-card-table"
    >
      <template #default="{ row }">
        <article class="repository-card">
          <header class="repository-card__header">
            <div class="repository-card__title">
              <div class="repository-card__icon">
                <IconifyIconOnline :icon="repositoryIcon(row.repositoryType)" />
              </div>
              <div>
                <h3>{{ row.repositoryName }}</h3>
                <p>{{ row.repositoryCode }}</p>
              </div>
            </div>
            <div class="repository-card__flags">
              <el-tag
                size="small"
                effect="light"
                :type="row.enabled ? 'success' : 'info'"
              >
                {{ row.enabled ? "启用" : "停用" }}
              </el-tag>
              <el-tag
                size="small"
                effect="light"
                :type="syncTagType(row.lastSyncStatus)"
              >
                {{ syncStatusLabel(row.lastSyncStatus) }}
              </el-tag>
            </div>
          </header>

          <div class="repository-card__body">
            <div class="repository-card__meta">
              <span>{{ repositoryTypeLabel(row.repositoryType) }}</span>
              <span>源 {{ getExtraSources(row).length }}</span>
            </div>

            <div class="repository-card__block">
              <label>主地址</label>
              <strong>{{ describePrimarySource(row) }}</strong>
            </div>

            <small class="repository-card__hint">
              {{ row.lastSyncMessage || "未同步" }}
            </small>
          </div>

          <footer class="repository-card__actions">
            <el-tooltip content="同步参考版本" placement="top">
              <ScButton
                circle
                :loading="syncingId === row.softRepositoryId"
                @click="syncRepository(row.softRepositoryId)"
              >
                <IconifyIconOnline icon="ri:download-cloud-2-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip
              v-if="row.repositoryType === 'LOCAL_DIR'"
              content="上传安装包并自动同步"
              placement="top"
            >
              <ScButton
                circle
                type="success"
                plain
                :loading="uploadingId === row.softRepositoryId"
                @click="openArtifactUpload(row)"
              >
                <IconifyIconOnline icon="ri:upload-2-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip
              :content="row.enabled ? '停用仓库' : '启用仓库'"
              placement="top"
            >
              <ScButton circle @click="toggleRepository(row)">
                <IconifyIconOnline
                  :icon="
                    row.enabled ? 'ri:pause-circle-line' : 'ri:play-circle-line'
                  "
                />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="编辑仓库" placement="top">
              <ScButton circle type="primary" plain @click="openEdit(row)">
                <IconifyIconOnline icon="ri:edit-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="删除仓库" placement="top">
              <ScButton
                circle
                type="danger"
                plain
                @click="removeRepository(row.softRepositoryId)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </ScButton>
            </el-tooltip>
          </footer>
        </article>
      </template>
      <template #empty>
        <el-empty
          description="当前没有仓库定义。仓库只负责在线搜索、本地目录索引和版本参考同步，软件添加在软件目录里完成。"
        />
      </template>
    </ScTable>

    <ScDialog v-model="visible" width="980px" :title="dialogTitle">
      <el-form
        ref="formRef"
        :model="form"
        :rules="repositoryRules"
        label-position="top"
        class="repository-dialog-form"
      >
        <div class="repository-form-grid">
          <el-form-item label="仓库名称" prop="repositoryName">
            <el-input v-model="form.repositoryName" />
          </el-form-item>
          <el-form-item label="仓库编码" prop="repositoryCode">
            <el-input v-model="form.repositoryCode" />
          </el-form-item>
          <el-form-item label="仓库类型" prop="repositoryType">
            <ScSelect
              v-model="form.repositoryType"
              :options="repositoryTypeOptions"
              layout="dropdown"
              width="100%"
              dropdown-title="选择仓库类型"
              dropdown-placeholder="选择仓库类型"
              dropdown-icon="ri:database-2-line"
              :dropdown-col="1"
              display-mode="normal"
            />
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch
              v-model="form.enabled"
              inline-prompt
              active-text="启用"
              inactive-text="停用"
            />
          </el-form-item>
          <el-form-item
            v-if="
              isRemoteRepositoryType(form.repositoryType)
            "
            label="主定义地址"
            prop="repositoryUrl"
          >
            <el-input
              v-model="form.repositoryUrl"
              :placeholder="
                form.repositoryType === 'HTTP_DIR'
                  ? '填写可直接列目录的在线地址，软件添加时会基于它搜索和识别安装包'
                  : form.repositoryType === 'RPM_REPO'
                    ? '填写 RPM 远程仓库目录地址，自动解析 rpm 文件名与版本'
                    : form.repositoryType === 'MIRROR_REPO'
                      ? '填写镜像仓库目录地址，适合站点镜像或分发目录'
                      : '在线搜索索引主地址，管理员添加软件时会优先参考这里'
              "
            />
          </el-form-item>
          <el-form-item
            v-if="form.repositoryType === 'LOCAL_DIR'"
            label="本地扫描目录"
            prop="localDirectory"
          >
            <el-input
              v-model="form.localDirectory"
              placeholder="扫描本地 rpm、deb、exe、msi、zip、tar.gz 等目录，为软件添加和在线搜索建立索引"
            />
          </el-form-item>
          <el-form-item label="认证类型" prop="authType">
            <ScSelect v-model="form.authType" clearable style="width: 100%">
              <ScOption label="无认证" value="" />
              <ScOption label="Basic" value="BASIC" />
              <ScOption label="Bearer" value="BEARER" />
            </ScSelect>
          </el-form-item>
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="令牌" prop="token">
            <el-input v-model="form.token" type="password" show-password />
          </el-form-item>
          <el-form-item
            label="参考同步表达式"
            class="repository-form-grid__span-2"
          >
            <el-input
              v-model="form.syncCron"
              placeholder="可选，例如 0 */30 * * * ?"
            />
          </el-form-item>
          <el-form-item label="仓库说明" class="repository-form-grid__span-2">
            <el-input
              v-model="form.syncConfig"
              type="textarea"
              :rows="4"
              placeholder="填写搜索规则、索引说明、本地扫描备注或参考同步策略"
            />
          </el-form-item>
          <el-form-item label="参考同步源" class="repository-form-grid__span-2" prop="sourceConfigs">
            <div class="repository-source-editor">
              <div
                v-for="(source, index) in form.sourceConfigs"
                :key="`source-${index}`"
                class="repository-source-item"
              >
                <div class="repository-source-item__head">
                  <div>
                    <strong>{{
                      source.sourceName || `同步源 ${index + 1}`
                    }}</strong>
                    <span>
                      {{ sourceKindLabel(source.sourceKind) }} / {{ repositoryTypeLabel(source.sourceType) }}
                    </span>
                  </div>
                  <div class="repository-source-item__actions">
                    <el-switch
                      v-model="source.enabled"
                      inline-prompt
                      active-text="启用"
                      inactive-text="停用"
                    />
                    <el-tooltip content="删除同步源" placement="top">
                      <ScButton
                        circle
                        type="danger"
                        plain
                        :loading="deletingSourceId === source.softRepositorySourceId"
                        @click="removeSource(index)"
                      >
                        <IconifyIconOnline icon="ri:delete-bin-line" />
                      </ScButton>
                    </el-tooltip>
                  </div>
                </div>
                <div class="repository-source-item__grid">
                  <el-input v-model="source.sourceName" placeholder="源名称" />
                  <ScSelect
                    v-model="source.sourceKind"
                    :options="sourceKindOptions"
                    layout="icon"
                    width="100%"
                    dropdown-title="选择来源分类"
                    dropdown-placeholder="选择来源分类"
                    dropdown-icon="ri:price-tag-3-line"
                    :dropdown-col="1"
                    display-mode="normal"
                  />
                  <ScSelect
                    v-model="source.sourceType"
                    :options="repositoryTypeOptions"
                    layout="dropdown"
                    width="100%"
                    dropdown-title="选择源类型"
                    dropdown-placeholder="选择源类型"
                    dropdown-icon="ri:links-line"
                    :dropdown-col="1"
                    display-mode="normal"
                  />
                  <el-input
                    v-if="source.sourceType !== 'LOCAL_DIR'"
                    v-model="source.sourceUrl"
                    :placeholder="
                      source.sourceType === 'HTTP_DIR'
                        ? '在线目录地址或安装包直链'
                        : source.sourceType === 'RPM_REPO'
                          ? 'RPM 仓库目录地址'
                          : source.sourceType === 'MIRROR_REPO'
                            ? '镜像仓库目录地址'
                        : '在线搜索源地址'
                    "
                  />
                  <el-input
                    v-else
                    v-model="source.localDirectory"
                    placeholder="本地扫描目录"
                  />
                  <el-input
                    v-model="source.sourceConfig"
                    placeholder="附加说明 / 索引策略"
                  />
                </div>
              </div>
              <div class="repository-source-editor__footer">
                <el-tooltip content="添加参考源" placement="top">
                  <ScButton circle plain @click="addSource">
                    <IconifyIconOnline icon="ri:add-line" />
                  </ScButton>
                </el-tooltip>
                <span>支持多个在线搜索源、在线安装包目录和本地扫描目录</span>
              </div>
            </div>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <ScButton @click="visible = false">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="submit">
          保存定义
        </ScButton>
      </template>
    </ScDialog>

    <input
      ref="artifactInputRef"
      type="file"
      class="repository-hidden-input"
      multiple
      accept=".rpm,.deb,.exe,.msi,.zip,.tar,.gz,.tgz,.tar.gz,.jar,.war,.7z,.bin"
      @change="handleArtifactFileChange"
    />
  </SoftWorkspace>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@repo/utils";
import {
  createSoftRepository,
  deleteSoftRepository,
  deleteSoftRepositorySource,
  listSoftRepositories,
  listSoftRepositorySourceItems,
  syncSoftRepository,
  uploadSoftRepositoryArtifacts,
  updateSoftRepository,
  type SoftRepository,
  type SoftRepositorySource,
} from "../api";
import SoftWorkspace from "../components/SoftWorkspace.vue";

const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const syncingId = ref<number | null>(null);
const uploadingId = ref<number | null>(null);
const deletingSourceId = ref<number | null>(null);
const editingId = ref<number | null>(null);
const keyword = ref("");
const statusFilter = ref<"enabled" | "disabled" | "">("");
const repositories = ref<SoftRepository[]>([]);
const artifactInputRef = ref<HTMLInputElement | null>(null);
const pendingUploadRepositoryId = ref<number | null>(null);
const formRef = ref<FormInstance>();

const repositoryTypeOptions = [
  {
    label: "手工定义仓库",
    value: "MANUAL",
    icon: "ri:edit-2-line",
    description: "仅维护定义，不自动同步",
  },
  {
    label: "在线搜索索引库",
    value: "HTTP_JSON",
    icon: "ri:cloud-line",
    description: "远程 JSON 索引，适合软件搜索",
  },
  {
    label: "在线安装包目录",
    value: "HTTP_DIR",
    icon: "ri:hard-drive-3-line",
    description: "远程目录自动识别 exe、zip、rpm 等安装包",
  },
  {
    label: "本地扫描目录",
    value: "LOCAL_DIR",
    icon: "ri:folder-2-line",
    description: "扫描本地安装包目录生成索引",
  },
  {
    label: "RPM 远程仓库",
    value: "RPM_REPO",
    icon: "ri:archive-stack-line",
    description: "针对远程 RPM 目录的版本同步",
  },
  {
    label: "镜像安装包仓库",
    value: "MIRROR_REPO",
    icon: "ri:git-repository-private-line",
    description: "镜像站或分发镜像目录",
  },
] as const;

const sourceKindOptions = [
  {
    label: "Linux 默认源",
    value: "LINUX_DEFAULT",
    icon: "ri:terminal-box-line",
    description: "使用系统包管理器安装",
  },
  {
    label: "本地仓库",
    value: "LOCAL_REPOSITORY",
    icon: "ri:folder-shared-line",
    description: "从本地仓库或制品目录安装",
  },
  {
    label: "第三方下载源",
    value: "THIRD_PARTY",
    icon: "ri:links-line",
    description: "从第三方地址下载安装",
  },
] as const;

const statusFilterOptions = [
  {
    label: "全部状态",
    value: "",
    icon: "ri:apps-2-line",
    description: "显示全部仓库定义",
  },
  {
    label: "启用",
    value: "enabled",
    icon: "ri:checkbox-circle-line",
    description: "只看已启用仓库",
  },
  {
    label: "停用",
    value: "disabled",
    icon: "ri:close-circle-line",
    description: "只看停用仓库",
  },
] as const;

const repositoryPresets = [
  {
    key: "local-artifacts",
    label: "本地安装包目录",
    repository: {
      repositoryName: "本地安装包仓库",
      repositoryCode: "local-artifacts",
      repositoryType: "LOCAL_DIR",
      localDirectory: "H:/workspace/2/tmp/soft-artifacts",
      syncConfig: "直接扫描本地 rpm、deb、exe、msi、zip、tar.gz 安装包目录",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "third-party-main",
    label: "第三方主索引仓库",
    repository: {
      repositoryName: "第三方软件主仓库",
      repositoryCode: "third-party-main",
      repositoryType: "HTTP_JSON",
      repositoryUrl: "http://127.0.0.1:18901/soft-repo-main/index.json",
      syncConfig: "测试态第三方远程索引仓库，启动静态文件服务后可直接同步",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "remote-artifacts-http",
    label: "第三方安装包目录",
    repository: {
      repositoryName: "第三方安装包仓库",
      repositoryCode: "remote-artifacts-http",
      repositoryType: "HTTP_DIR",
      repositoryUrl: "http://127.0.0.1:18901/soft-artifacts/",
      syncConfig:
        "远程 HTTP 安装包目录，自动识别 rpm、deb、exe、msi、zip、tar.gz、bin",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "rpm-third-party",
    label: "RPM 远程仓库",
    repository: {
      repositoryName: "RPM 远程仓库",
      repositoryCode: "rpm-third-party",
      repositoryType: "RPM_REPO",
      repositoryUrl: "http://127.0.0.1:18901/soft-artifacts/rpm/",
      syncConfig: "远程 RPM 安装包目录，自动解析包名、系统和版本。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "mirror-third-party",
    label: "镜像安装包仓库",
    repository: {
      repositoryName: "镜像安装包仓库",
      repositoryCode: "mirror-third-party",
      repositoryType: "MIRROR_REPO",
      repositoryUrl: "http://127.0.0.1:18901/soft-artifacts/mirror/",
      syncConfig: "镜像站安装包目录，适合多源分发和备份源。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "third-party-multi",
    label: "综合多源仓库",
    repository: {
      repositoryName: "综合多源软件仓库",
      repositoryCode: "real-soft-repo",
      repositoryType: "LOCAL_DIR",
      localDirectory: "H:/workspace/2/tmp/soft-artifacts",
      syncConfig: "本地目录 + 远程索引 + RPM 仓库 + 镜像仓库 + 禁用源示例",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "nodejs-dist",
    label: "Node.js 官方发布库",
    repository: {
      repositoryName: "Node.js 官方发布库",
      repositoryCode: "nodejs-dist",
      repositoryType: "HTTP_DIR",
      repositoryUrl: "https://nodejs.org/dist/",
      syncConfig: "Node.js 官方版本发布目录，适合搜索各平台二进制包与源码包。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "nginx-download",
    label: "NGINX 官方下载",
    repository: {
      repositoryName: "NGINX 官方下载",
      repositoryCode: "nginx-download",
      repositoryType: "HTTP_DIR",
      repositoryUrl: "https://nginx.org/download/",
      syncConfig: "NGINX 官方下载目录，支持 Linux 源码包和 Windows ZIP 包检索。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "redis-releases",
    label: "Redis 官方发布库",
    repository: {
      repositoryName: "Redis 官方发布库",
      repositoryCode: "redis-releases",
      repositoryType: "HTTP_DIR",
      repositoryUrl: "https://download.redis.io/releases/",
      syncConfig: "Redis 官方 release 目录，支持 tar.gz 版本包检索。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "kafka-apache-4-1",
    label: "Kafka 官方 4.1.1",
    repository: {
      repositoryName: "Kafka 官方二进制库",
      repositoryCode: "kafka-apache-4-1",
      repositoryType: "HTTP_DIR",
      repositoryUrl: "https://downloads.apache.org/kafka/4.1.1/",
      syncConfig: "Apache Kafka 官方 4.1.1 目录，可直接同步 tgz 包。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "apache-archive",
    label: "Apache Archive",
    repository: {
      repositoryName: "Apache Archive",
      repositoryCode: "apache-archive",
      repositoryType: "HTTP_DIR",
      repositoryUrl: "https://archive.apache.org/dist/",
      syncConfig: "Apache 历史发布归档目录，适合搜索 Kafka、Maven、Tomcat、Doris 等常见组件。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "maven-central",
    label: "Maven Central",
    repository: {
      repositoryName: "Maven Central",
      repositoryCode: "maven-central",
      repositoryType: "HTTP_DIR",
      repositoryUrl: "https://repo1.maven.org/maven2/",
      syncConfig: "Maven Central 制品目录，适合 Java 工具、jar 包、插件及依赖制品检索。",
    } satisfies Partial<SoftRepository>,
  },
  {
    key: "mysql-yum",
    label: "MySQL Yum 仓库",
    repository: {
      repositoryName: "MySQL Yum 仓库",
      repositoryCode: "mysql-yum",
      repositoryType: "RPM_REPO",
      repositoryUrl: "https://repo.mysql.com/yum/mysql-8.4-community/el/9/x86_64/",
      syncConfig: "MySQL 官方 Yum EL9 x86_64 目录，适合 Linux RPM 版本检索与同步。",
    } satisfies Partial<SoftRepository>,
  },
] as const;

const emptyForm = (): SoftRepository => ({
  repositoryName: "",
  repositoryCode: "",
  repositoryType: "MANUAL",
  repositoryUrl: "",
  localDirectory: "",
  authType: "",
  username: "",
  password: "",
  token: "",
  syncCron: "",
  syncConfig: "",
  sourceConfigsJson: "",
  sourceConfigs: [],
  enabled: true,
});

const form = reactive<SoftRepository>(emptyForm());
const repositoryCodeReg = /^[a-z0-9][a-z0-9-_]{1,63}$/;

const dialogTitle = computed(() => (editingId.value ? "编辑仓库" : "新建仓库"));
const workspaceMetrics = computed(() => [
  {
    label: "仓库定义",
    value: repositories.value.length,
    hint: "主定义 + 参考同步源",
  },
  {
    label: "启用仓库",
    value: enabledCount.value,
    hint: "当前参与同步与检索",
  },
  {
    label: "多源仓库",
    value: multiSourceCount.value,
    hint: "包含额外 source 配置",
  },
]);

const enabledCount = computed(
  () => repositories.value.filter((item) => item.enabled).length,
);

const multiSourceCount = computed(
  () =>
    repositories.value.filter((item) => getExtraSources(item).length > 0)
      .length,
);

const filteredRepositories = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  return repositories.value.filter((item) => {
    if (statusFilter.value === "enabled" && !item.enabled) {
      return false;
    }
    if (statusFilter.value === "disabled" && item.enabled) {
      return false;
    }
    if (!text) {
      return true;
    }
    return [
      item.repositoryName,
      item.repositoryCode,
      item.repositoryUrl,
      item.localDirectory,
      describePrimarySource(item),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(text));
  });
});

const patchForm = (value: SoftRepository) => {
  const next = emptyForm();
  const sourceConfigs = normalizeSourceConfigs(
    value.sourceConfigs || parseSourceConfigs(value.sourceConfigsJson),
  );
  Object.assign(next, value, { sourceConfigs });
  Object.assign(form, emptyForm(), next);
  formRef.value?.clearValidate();
};

const repositoryRules: FormRules<SoftRepository> = {
  repositoryName: [
    { required: true, message: "请输入仓库名称", trigger: "blur" },
    { min: 2, max: 64, message: "仓库名称长度需在 2 到 64 个字符之间", trigger: "blur" },
  ],
  repositoryCode: [
    { required: true, message: "请输入仓库编码", trigger: "blur" },
    {
      pattern: repositoryCodeReg,
      message: "仓库编码仅允许小写字母、数字、-、_，且必须以字母或数字开头",
      trigger: "blur",
    },
  ],
  repositoryType: [{ required: true, message: "请选择仓库类型", trigger: "change" }],
  repositoryUrl: [
    {
      validator: (_rule, value, callback) => {
        if (!isRemoteRepositoryType(form.repositoryType)) {
          callback();
          return;
        }
        if (normalizeText(value)) {
          callback();
          return;
        }
        callback(new Error("当前仓库类型必须填写主定义地址"));
      },
      trigger: ["blur", "change"],
    },
  ],
  localDirectory: [
    {
      validator: (_rule, value, callback) => {
        if (form.repositoryType !== "LOCAL_DIR") {
          callback();
          return;
        }
        if (normalizeText(value)) {
          callback();
          return;
        }
        callback(new Error("本地扫描目录不能为空"));
      },
      trigger: ["blur", "change"],
    },
  ],
  username: [
    {
      validator: (_rule, value, callback) => {
        if (form.authType !== "BASIC") {
          callback();
          return;
        }
        if (normalizeText(value)) {
          callback();
          return;
        }
        callback(new Error("Basic 认证必须填写用户名"));
      },
      trigger: "blur",
    },
  ],
  password: [
    {
      validator: (_rule, value, callback) => {
        if (form.authType !== "BASIC") {
          callback();
          return;
        }
        if (normalizeText(value)) {
          callback();
          return;
        }
        callback(new Error("Basic 认证必须填写密码"));
      },
      trigger: "blur",
    },
  ],
  token: [
    {
      validator: (_rule, value, callback) => {
        if (form.authType !== "BEARER") {
          callback();
          return;
        }
        if (normalizeText(value)) {
          callback();
          return;
        }
        callback(new Error("Bearer 认证必须填写令牌"));
      },
      trigger: "blur",
    },
  ],
  sourceConfigs: [
    {
      validator: (_rule, value, callback) => {
        const sources = Array.isArray(value) ? value : [];
        const invalid = sources.find((source) => {
          if (source.enabled === false) {
            return false;
          }
          if (source.sourceType === "LOCAL_DIR") {
            return !normalizeText(source.localDirectory);
          }
          return !normalizeText(source.sourceUrl);
        });
        if (invalid) {
          callback(new Error("启用中的参考同步源必须填写完整地址或本地目录"));
          return;
        }
        callback();
      },
      trigger: "change",
    },
  ],
};

const loadRepositories = async () => {
  loading.value = true;
  try {
    const result = await listSoftRepositories();
    repositories.value = result.data || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingId.value = null;
  patchForm(emptyForm());
  visible.value = true;
};

const openEdit = async (row: SoftRepository) => {
  editingId.value = row.softRepositoryId || null;
  patchForm(row);
  const repositoryId = Number(row.softRepositoryId || 0);
  if (repositoryId) {
    try {
      const result = await listSoftRepositorySourceItems(repositoryId);
      form.sourceConfigs = normalizeSourceConfigs(result.data || []);
    } catch (error) {
      console.error(error);
      message("加载仓库源明细失败，已回退到当前页面缓存", { type: "warning" });
    }
  }
  visible.value = true;
};

const isRemoteRepositoryType = (value?: string) =>
  value === "HTTP_JSON" ||
  value === "HTTP_DIR" ||
  value === "RPM_REPO" ||
  value === "MIRROR_REPO";

const toggleRepository = async (row: SoftRepository) => {
  if (!row.softRepositoryId) {
    return;
  }
  await updateSoftRepository(row.softRepositoryId, {
    ...row,
    enabled: !row.enabled,
    sourceConfigs: normalizeSourceConfigs(
      row.sourceConfigs || parseSourceConfigs(row.sourceConfigsJson),
    ),
  });
  message(row.enabled ? "仓库已停用" : "仓库已启用", { type: "success" });
  await loadRepositories();
};

const submit = async () => {
  const valid = await formRef.value
    ?.validate()
    .then(() => true)
    .catch(() => false);
  if (!valid) {
    message("请先修正仓库表单错误后再保存", { type: "warning" });
    return;
  }
  const sourceConfigs = normalizeSourceConfigs(form.sourceConfigs);
  const payload: SoftRepository = {
    ...form,
    repositoryUrl: normalizeText(form.repositoryUrl),
    localDirectory: normalizeText(form.localDirectory),
    syncConfig: normalizeText(form.syncConfig),
    sourceConfigs,
    sourceConfigsJson: sourceConfigs.length
      ? JSON.stringify(sourceConfigs)
      : "",
  };
  if (
    isRemoteRepositoryType(payload.repositoryType) &&
    !payload.repositoryUrl &&
    sourceConfigs.length === 0
  ) {
    message("至少配置一个远程源地址", { type: "warning" });
    return;
  }
  if (
    payload.repositoryType === "LOCAL_DIR" &&
    !payload.localDirectory &&
    sourceConfigs.length === 0
  ) {
    message("至少配置一个本地目录", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await updateSoftRepository(editingId.value, payload);
    } else {
      await createSoftRepository(payload);
    }
    message("仓库已保存", { type: "success" });
    visible.value = false;
    await loadRepositories();
  } finally {
    saving.value = false;
  }
};

const syncRepository = async (id?: number) => {
  if (!id) {
    return;
  }
  syncingId.value = id;
  try {
    const result = await syncSoftRepository(id);
    const syncStatus = result.data?.lastSyncStatus;
    message(result.data?.lastSyncMessage || result.msg || "仓库同步完成", {
      type:
        syncStatus === "FAILED"
          ? "error"
          : syncStatus === "PARTIAL_SUCCESS"
            ? "warning"
            : "success",
    });
    await loadRepositories();
  } finally {
    syncingId.value = null;
  }
};

const openArtifactUpload = (row: SoftRepository) => {
  if (!row.softRepositoryId) {
    return;
  }
  pendingUploadRepositoryId.value = row.softRepositoryId;
  if (artifactInputRef.value) {
    artifactInputRef.value.value = "";
    artifactInputRef.value.click();
  }
};

const handleArtifactFileChange = async (event: Event) => {
  const repositoryId = pendingUploadRepositoryId.value;
  const input = event.target as HTMLInputElement | null;
  const files = Array.from(input?.files || []);
  if (input) {
    input.value = "";
  }
  pendingUploadRepositoryId.value = null;
  if (!repositoryId || !files.length) {
    return;
  }
  uploadingId.value = repositoryId;
  try {
    const result = await uploadSoftRepositoryArtifacts(repositoryId, files);
    const payload = result.data || {};
    const uploadedNames = (payload.savedFiles || [])
      .map((item) => item.fileName)
      .filter(Boolean)
      .join("、");
    message(payload.message || "安装包已上传并完成同步", {
      type: "success",
    });
    await ElMessageBox.alert(
      [
        payload.localDirectory
          ? `入库目录：${payload.localDirectory}`
          : undefined,
        uploadedNames ? `已上传：${uploadedNames}` : undefined,
        payload.repository?.lastSyncMessage
          ? `同步结果：${payload.repository.lastSyncMessage}`
          : undefined,
      ]
        .filter(Boolean)
        .join("\n"),
      "安装包已入库",
      {
        confirmButtonText: "知道了",
      },
    );
    await loadRepositories();
  } finally {
    uploadingId.value = null;
  }
};

const removeRepository = async (id?: number) => {
  if (!id) {
    return;
  }
  await ElMessageBox.confirm(
    "删除后不会保留旧仓库记录，确认继续？",
    "删除仓库",
    {
      type: "warning",
    },
  );
  await deleteSoftRepository(id);
  message("仓库已删除", { type: "success" });
  await loadRepositories();
};

const applyRepositoryPreset = (command: string) => {
  const preset = repositoryPresets.find((item) => item.key === command);
  if (!preset) {
    return;
  }
  const presetRepository = preset.repository as Partial<SoftRepository>;
  editingId.value = null;
  patchForm({
    ...emptyForm(),
    ...presetRepository,
    sourceConfigs: normalizeSourceConfigs(presetRepository.sourceConfigs),
  } as SoftRepository);
  visible.value = true;
};

const addSource = () => {
  form.sourceConfigs = [
    ...(form.sourceConfigs || []),
    {
      sourceName: "",
      sourceKind:
        form.repositoryType === "LOCAL_DIR"
          ? "LOCAL_REPOSITORY"
          : form.repositoryType === "RPM_REPO"
            ? "LINUX_DEFAULT"
            : "THIRD_PARTY",
      sourceType:
        form.repositoryType === "LOCAL_DIR"
          ? "LOCAL_DIR"
          : form.repositoryType === "HTTP_DIR" ||
              form.repositoryType === "RPM_REPO" ||
              form.repositoryType === "MIRROR_REPO"
            ? form.repositoryType
            : "HTTP_JSON",
      sourceUrl: "",
      localDirectory: "",
      enabled: true,
      sourceConfig: "",
    },
  ];
};

const removeSource = async (index: number) => {
  const source = (form.sourceConfigs || [])[index];
  if (!source) {
    return;
  }
  const sourceId = Number(source.softRepositorySourceId || 0);
  if (editingId.value && sourceId > 0) {
    await ElMessageBox.confirm(
      `确认删除同步源“${source.sourceName || `同步源 ${index + 1}`}”吗？`,
      "删除同步源",
      { type: "warning" },
    );
    deletingSourceId.value = sourceId;
    try {
      await deleteSoftRepositorySource(editingId.value, sourceId);
      message("同步源已删除", { type: "success" });
    } finally {
      deletingSourceId.value = null;
    }
  }
  form.sourceConfigs = (form.sourceConfigs || []).filter(
    (_, itemIndex) => itemIndex !== index,
  );
};

const normalizeText = (value?: string) => {
  const text = value?.trim() || "";
  return text || undefined;
};

const parseSourceConfigs = (value?: string): SoftRepositorySource[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeSourceConfigs = (sources?: SoftRepositorySource[]) =>
  (sources || [])
    .map((source) => ({
      softRepositorySourceId: source.softRepositorySourceId,
      sourceName: normalizeText(source.sourceName),
      sourceKind: normalizeSourceKind(source.sourceKind, source.sourceType),
      sourceType: source.sourceType || "HTTP_JSON",
      sourceUrl: normalizeText(source.sourceUrl),
      localDirectory: normalizeText(source.localDirectory),
      enabled: source.enabled ?? true,
      sourceConfig: normalizeText(source.sourceConfig),
    }))
    .filter((source) => source.sourceUrl || source.localDirectory);

const getExtraSources = (repository: SoftRepository) =>
  normalizeSourceConfigs(
    repository.sourceConfigs ||
      parseSourceConfigs(repository.sourceConfigsJson),
  );

const enabledSourceCount = (repository: SoftRepository) =>
  getExtraSources(repository).filter((item) => item.enabled !== false).length;

const describePrimarySource = (repository: SoftRepository) => {
  if (repository.repositoryType === "LOCAL_DIR") {
    return repository.localDirectory || "未配置本地目录";
  }
  if (
    repository.repositoryType === "HTTP_DIR" ||
    repository.repositoryType === "RPM_REPO" ||
    repository.repositoryType === "MIRROR_REPO"
  ) {
    return repository.repositoryUrl || "未配置远程目录";
  }
  if (repository.repositoryType === "HTTP_JSON") {
    return repository.repositoryUrl || "未配置主地址";
  }
  return "手工维护";
};

const repositoryTypeLabel = (value?: string) =>
  value === "LOCAL_DIR"
    ? "本地扫描目录"
    : value === "HTTP_DIR"
      ? "在线安装包目录"
      : value === "RPM_REPO"
        ? "RPM 远程仓库"
        : value === "MIRROR_REPO"
          ? "镜像安装包仓库"
      : value === "HTTP_JSON"
        ? "在线搜索索引"
        : value === "MANUAL"
          ? "手工定义"
          : value || "未知类型";

const repositoryIcon = (value?: string) =>
  value === "LOCAL_DIR"
    ? "ri:folder-2-line"
    : value === "HTTP_DIR"
      ? "ri:hard-drive-3-line"
      : value === "RPM_REPO"
        ? "ri:archive-stack-line"
        : value === "MIRROR_REPO"
          ? "ri:git-repository-private-line"
      : value === "HTTP_JSON"
        ? "ri:cloud-line"
        : "ri:database-2-line";

const sourceLabel = (source: SoftRepositorySource) =>
  source.sourceType === "LOCAL_DIR"
    ? source.localDirectory || "未配置目录"
    : source.sourceType === "HTTP_DIR" ||
        source.sourceType === "RPM_REPO" ||
        source.sourceType === "MIRROR_REPO"
      ? source.sourceUrl || "未配置目录地址"
      : source.sourceUrl || "未配置地址";

const normalizeSourceKind = (value?: string, sourceType?: string) => {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "LINUX_DEFAULT" ||
    normalized === "LOCAL_REPOSITORY" ||
    normalized === "THIRD_PARTY"
  ) {
    return normalized;
  }
  if (sourceType === "LOCAL_DIR") {
    return "LOCAL_REPOSITORY";
  }
  if (sourceType === "RPM_REPO") {
    return "LINUX_DEFAULT";
  }
  return "THIRD_PARTY";
};

const sourceKindLabel = (value?: string) =>
  value === "LINUX_DEFAULT"
    ? "Linux 默认源"
    : value === "LOCAL_REPOSITORY"
      ? "本地仓库"
      : value === "THIRD_PARTY"
        ? "第三方下载源"
        : "第三方下载源";

const syncStatusLabel = (status?: string) =>
  status === "SUCCESS"
    ? "同步成功"
    : status === "PARTIAL_SUCCESS"
      ? "部分成功"
      : status === "FAILED"
        ? "同步失败"
        : status === "DISABLED"
          ? "已禁用"
          : "未同步";

const syncTagType = (status?: string) =>
  status === "SUCCESS"
    ? "success"
    : status === "PARTIAL_SUCCESS"
      ? "warning"
      : status === "FAILED"
        ? "danger"
        : "info";

onMounted(loadRepositories);
</script>

<style scoped lang="scss">
.repository-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 140px auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}

.repository-hidden-input {
  display: none;
}

.repository-toolbar__meta {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 12px;
}

.repository-card-table {
  :deep(.card-view-container) {
    padding: 0;
    overflow: visible;
  }

  :deep(.card-grid) {
    align-items: stretch;
  }

  :deep(.card-inner.card-default) {
    padding: 0;
    border-radius: 22px;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  :deep(.card-item-wrapper:hover) {
    transform: none;
  }
}

.repository-card {
  display: grid;
  gap: 10px;
  height: 100%;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.repository-card__header,
.repository-card__source,
.repository-card__actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.repository-card__title {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.repository-card__title h3,
.repository-card__title p {
  margin: 0;
}

.repository-card__title h3 {
  color: #0f172a;
  font-size: 15px;
}

.repository-card__title p {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.repository-card__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0f172a, #0ea5e9);
  color: #f8fafc;
  font-size: 16px;
  flex-shrink: 0;
}

.repository-card__flags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.repository-card__body {
  display: grid;
  gap: 8px;
}

.repository-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.repository-card__meta span {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 11px;
}

.repository-card__block {
  display: grid;
  gap: 2px;
}

.repository-card__block label {
  color: #64748b;
  font-size: 12px;
}

.repository-card__block strong,
.repository-card__block span {
  color: #0f172a;
  line-height: 1.4;
  word-break: break-all;
  font-size: 12px;
}

.repository-card__hint {
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
  word-break: break-word;
}

.repository-card__actions {
  justify-content: flex-end;
  align-items: center;
}

.repository-dialog-form {
  display: grid;
  gap: 14px;
}

.repository-form-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.repository-form-grid__span-2 {
  grid-column: 1 / -1;
}

.repository-form-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.repository-form-grid :deep(.el-input),
.repository-form-grid :deep(.el-select),
.repository-form-grid :deep(.el-select__wrapper),
.repository-form-grid :deep(.el-textarea) {
  width: 100%;
}

.repository-source-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-height: 0;
}

.repository-source-editor__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.repository-source-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 16px;
  background: var(--el-fill-color-light);
  width: 100%;
}

.repository-source-item__head,
.repository-source-item__actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.repository-source-item__head strong,
.repository-source-item__head span {
  display: block;
}

.repository-source-item__head span {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.repository-source-item__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 980px) {
  .repository-toolbar,
  .repository-form-grid,
  .repository-source-item__grid {
    grid-template-columns: 1fr;
  }

  .repository-toolbar__meta {
    justify-content: flex-start;
  }
}
</style>
