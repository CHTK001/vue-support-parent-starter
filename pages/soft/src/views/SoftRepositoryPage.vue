<template>
  <SoftWorkspace title="仓库管理">
    <template #actions>
      <el-dropdown trigger="click" @command="applyRepositoryPreset">
        <el-button circle>
          <IconifyIconOnline icon="ri:apps-2-line" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item
              v-for="preset in repositoryPresets"
              :key="preset.key"
              :command="preset.key"
            >
              {{ preset.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <el-tooltip content="刷新定义" placement="top">
        <el-button circle @click="loadRepositories">
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="新建仓库定义" placement="top">
        <el-button circle type="primary" @click="openCreate">
          <IconifyIconOnline icon="ri:add-line" />
        </el-button>
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
      :col-size="3"
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
              <span>参考源 {{ getExtraSources(row).length }}</span>
              <span>启用源 {{ enabledSourceCount(row) }}</span>
            </div>

            <div class="repository-card__block">
              <label>主定义源</label>
              <strong>{{ describePrimarySource(row) }}</strong>
            </div>

            <div class="repository-card__block">
              <label>版本参考同步</label>
              <span>{{ row.lastSyncMessage || "尚未同步参考版本信息" }}</span>
            </div>

            <div
              v-if="getExtraSources(row).length"
              class="repository-card__sources"
            >
              <div
                v-for="(source, index) in getExtraSources(row)"
                :key="`${row.softRepositoryId}-${index}`"
                class="repository-card__source"
              >
                <div>
                  <strong>{{ source.sourceName || `源 ${index + 1}` }}</strong>
                  <span>{{ sourceLabel(source) }}</span>
                </div>
                <el-tag
                  size="small"
                  effect="light"
                  :type="source.enabled === false ? 'info' : 'success'"
                >
                  {{ source.enabled === false ? "停用" : "启用" }}
                </el-tag>
              </div>
            </div>
          </div>

          <footer class="repository-card__actions">
            <el-tooltip content="同步参考版本" placement="top">
              <el-button
                circle
                :loading="syncingId === row.softRepositoryId"
                @click="syncRepository(row.softRepositoryId)"
              >
                <IconifyIconOnline icon="ri:download-cloud-2-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="row.repositoryType === 'LOCAL_DIR'"
              content="上传安装包并自动同步"
              placement="top"
            >
              <el-button
                circle
                type="success"
                plain
                :loading="uploadingId === row.softRepositoryId"
                @click="openArtifactUpload(row)"
              >
                <IconifyIconOnline icon="ri:upload-2-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              :content="row.enabled ? '停用仓库' : '启用仓库'"
              placement="top"
            >
              <el-button circle @click="toggleRepository(row)">
                <IconifyIconOnline
                  :icon="
                    row.enabled ? 'ri:pause-circle-line' : 'ri:play-circle-line'
                  "
                />
              </el-button>
            </el-tooltip>
            <el-tooltip content="编辑仓库" placement="top">
              <el-button circle type="primary" plain @click="openEdit(row)">
                <IconifyIconOnline icon="ri:edit-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除仓库" placement="top">
              <el-button
                circle
                type="danger"
                plain
                @click="removeRepository(row.softRepositoryId)"
              >
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
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

    <el-dialog v-model="visible" width="960px" :title="dialogTitle">
      <el-form label-position="top">
        <div class="repository-form-grid">
          <el-form-item label="仓库名称">
            <el-input v-model="form.repositoryName" />
          </el-form-item>
          <el-form-item label="仓库编码">
            <el-input v-model="form.repositoryCode" />
          </el-form-item>
          <el-form-item label="仓库类型">
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
          >
            <el-input
              v-model="form.localDirectory"
              placeholder="扫描本地 rpm、deb、exe、msi、zip、tar.gz 等目录，为软件添加和在线搜索建立索引"
            />
          </el-form-item>
          <el-form-item label="认证类型">
            <el-select v-model="form.authType" clearable style="width: 100%">
              <el-option label="无认证" value="" />
              <el-option label="Basic" value="BASIC" />
              <el-option label="Bearer" value="BEARER" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="form.username" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" type="password" show-password />
          </el-form-item>
          <el-form-item label="令牌">
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
          <el-form-item label="参考同步源" class="repository-form-grid__span-2">
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
                    <span>{{ repositoryTypeLabel(source.sourceType) }}</span>
                  </div>
                  <div class="repository-source-item__actions">
                    <el-switch
                      v-model="source.enabled"
                      inline-prompt
                      active-text="启用"
                      inactive-text="停用"
                    />
                    <el-tooltip content="删除同步源" placement="top">
                      <el-button
                        circle
                        type="danger"
                        plain
                        @click="removeSource(index)"
                      >
                        <IconifyIconOnline icon="ri:delete-bin-line" />
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
                <div class="repository-source-item__grid">
                  <el-input v-model="source.sourceName" placeholder="源名称" />
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
                  <el-button circle plain @click="addSource">
                    <IconifyIconOnline icon="ri:add-line" />
                  </el-button>
                </el-tooltip>
                <span>支持多个在线搜索源、在线安装包目录和本地扫描目录</span>
              </div>
            </div>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">
          保存定义
        </el-button>
      </template>
    </el-dialog>

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
import { message } from "@repo/utils";
import {
  createSoftRepository,
  deleteSoftRepository,
  listSoftRepositories,
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
const editingId = ref<number | null>(null);
const keyword = ref("");
const statusFilter = ref<"enabled" | "disabled" | "">("");
const repositories = ref<SoftRepository[]>([]);
const artifactInputRef = ref<HTMLInputElement | null>(null);
const pendingUploadRepositoryId = ref<number | null>(null);

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
      sourceConfigs: [
        {
          sourceName: "主索引仓库",
          sourceType: "HTTP_JSON",
          sourceUrl: "http://127.0.0.1:18901/soft-repo-main/index.json",
          enabled: true,
          sourceConfig: "主软件索引",
        },
        {
          sourceName: "补充索引仓库",
          sourceType: "HTTP_JSON",
          sourceUrl: "http://127.0.0.1:18901/soft-repo-extra/index.json",
          enabled: true,
          sourceConfig: "额外软件与版本定义",
        },
        {
          sourceName: "RPM 远程仓库",
          sourceType: "RPM_REPO",
          sourceUrl: "http://127.0.0.1:18901/soft-artifacts/rpm/",
          enabled: true,
          sourceConfig: "RPM 版本同步",
        },
        {
          sourceName: "镜像安装目录",
          sourceType: "MIRROR_REPO",
          sourceUrl: "http://127.0.0.1:18901/soft-artifacts/mirror/",
          enabled: true,
          sourceConfig: "镜像安装包同步",
        },
        {
          sourceName: "禁用镜像目录",
          sourceType: "MIRROR_REPO",
          sourceUrl: "http://127.0.0.1:18901/soft-artifacts/disabled/",
          enabled: false,
          sourceConfig: "停用源示例",
        },
      ],
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

const dialogTitle = computed(() => (editingId.value ? "编辑仓库" : "新建仓库"));

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

const openEdit = (row: SoftRepository) => {
  editingId.value = row.softRepositoryId || null;
  patchForm(row);
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
  if (!form.repositoryName || !form.repositoryCode) {
    message("仓库名称和编码不能为空", { type: "warning" });
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
  editingId.value = null;
  patchForm({
    ...emptyForm(),
    ...preset.repository,
    sourceConfigs: normalizeSourceConfigs(preset.repository.sourceConfigs),
  } as SoftRepository);
  visible.value = true;
};

const addSource = () => {
  form.sourceConfigs = [
    ...(form.sourceConfigs || []),
    {
      sourceName: "",
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

const removeSource = (index: number) => {
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
      sourceName: normalizeText(source.sourceName),
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
  margin-bottom: 16px;
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
  gap: 14px;
  height: 100%;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(241, 245, 249, 0.92)
  );
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
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
  font-size: 17px;
}

.repository-card__title p {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.repository-card__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f172a, #0ea5e9);
  color: #f8fafc;
  font-size: 18px;
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
  gap: 12px;
}

.repository-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.repository-card__meta span {
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}

.repository-card__block {
  display: grid;
  gap: 4px;
}

.repository-card__block label {
  color: #64748b;
  font-size: 12px;
}

.repository-card__block strong,
.repository-card__block span {
  color: #0f172a;
  line-height: 1.6;
  word-break: break-all;
}

.repository-card__sources {
  display: grid;
  gap: 10px;
}

.repository-card__source {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.repository-card__source strong,
.repository-card__source span {
  display: block;
}

.repository-card__source strong {
  color: #0f172a;
  font-size: 13px;
}

.repository-card__source span {
  margin-top: 2px;
  color: #64748b;
  font-size: 12px;
  word-break: break-all;
}

.repository-card__actions {
  justify-content: flex-end;
  align-items: center;
}

.repository-form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.repository-form-grid__span-2 {
  grid-column: 1 / -1;
}

.repository-form-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.repository-source-editor {
  display: grid;
  gap: 12px;
  width: 100%;
}

.repository-source-editor__footer {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.repository-source-item {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 16px;
  background: var(--el-fill-color-light);
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
