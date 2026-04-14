<template>
  <section class="soft-home-page">
    <ScLayout
      v-model="railTab"
      class="soft-home-layout"
      rail-close-button-mode="always"
      :left-enabled="false"
      :rail-tabs="railTabs"
      @tab-remove="handleRailTabRemove($event.name)"
    >
      <template #default>
        <header class="soft-hero">
          <div>
            <small>SOFT / HOME</small>
            <h1>软件列表</h1>
            <p>主区聚合展示软件，右侧 tab 负责下载源编辑与检索。</p>
          </div>
          <div class="soft-hero__actions">
            <el-tooltip content="刷新软件目录" placement="top">
              <el-button circle :loading="loading" @click="loadHomeData">
                <IconifyIconOnline icon="ri:refresh-line" />
              </el-button>
            </el-tooltip>
          </div>
        </header>

        <template v-if="railTab === HOME_TAB">
          <div class="soft-summary">
            <article class="soft-summary__card">
              <small>软件数量</small>
              <strong>{{ softwareList.length }}</strong>
            </article>
            <article class="soft-summary__card">
              <small>当前筛选</small>
              <strong>{{ filteredSoftware.length }}</strong>
            </article>
            <article class="soft-summary__card">
              <small>仓库定义</small>
              <strong>{{ repositories.length }}</strong>
            </article>
            <article class="soft-summary__card">
              <small>下载源数量</small>
              <strong>{{ totalSourceCount }}</strong>
            </article>
          </div>

          <section class="soft-toolbar">
            <el-input v-model="keyword" clearable placeholder="搜索软件名称、编码、分类">
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-select v-model="osFilter" clearable placeholder="按操作系统筛选">
              <el-option label="全部系统" value="" />
              <el-option
                v-for="option in osFilterOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-select
              v-model="architectureFilter"
              clearable
              placeholder="按架构筛选"
            >
              <el-option label="全部架构" value="" />
              <el-option
                v-for="option in architectureFilterOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </section>

          <div v-if="filteredSoftware.length" class="software-grid">
            <article
              v-for="item in filteredSoftware"
              :key="item.key"
              class="software-card"
              @click="openSoftwareDetail(item)"
            >
              <header class="software-card__header">
                <div>
                  <strong>{{ item.name }}</strong>
                  <p>{{ item.code }}</p>
                </div>
                <el-tag size="small" effect="light">{{ item.packageCount }} 包</el-tag>
              </header>

              <p class="software-card__desc">
                {{ item.description || "暂无描述，点击详情查看版本与安装实例。" }}
              </p>

              <div class="software-card__meta">
                <span>{{ item.category || "未分类" }}</span>
                <span>{{ item.osTypes.map((v) => osLabel(v)).join(" / ") || "通用系统" }}</span>
                <span>
                  {{
                    item.architectures
                      .map((value) => architectureLabel(value))
                      .join(" / ") || "通用架构"
                  }}
                </span>
              </div>

              <footer class="software-card__actions">
                <el-button
                  type="primary"
                  plain
                  @click.stop="openSoftwareDetail(item)"
                >
                  查看详情
                </el-button>
                <el-button @click.stop="openDetailPage(item.defaultPackageId)">
                  打开详情页
                </el-button>
              </footer>
            </article>
          </div>
          <el-empty v-else description="没有匹配的软件" />
        </template>

        <template v-else-if="railTab === SOURCE_TAB">
          <section class="source-panel">
            <header class="source-panel__header">
              <div>
                <h3>下载源设置</h3>
                <p>编辑仓库主下载源与检索源，保存后立即生效。</p>
              </div>
              <div class="source-panel__actions">
                <el-button :loading="sourceSearchLoading" @click="reloadSourceSearch">
                  检索源
                </el-button>
                <el-button
                  type="warning"
                  :loading="syncingRepository"
                  :disabled="!currentRepository?.softRepositoryId"
                  @click="syncCurrentRepository"
                >
                  同步仓库
                </el-button>
                <el-button
                  type="primary"
                  :loading="savingSources"
                  :disabled="!currentRepository?.softRepositoryId"
                  @click="saveCurrentRepositorySources"
                >
                  保存下载源
                </el-button>
              </div>
            </header>

            <div class="source-panel__toolbar">
              <el-select
                v-model="activeRepositoryId"
                filterable
                clearable
                placeholder="选择仓库"
              >
                <el-option
                  v-for="item in repositories"
                  :key="item.softRepositoryId"
                  :label="`${item.repositoryName} (${item.repositoryCode})`"
                  :value="item.softRepositoryId"
                />
              </el-select>

              <el-input
                v-model="sourceSearchKeyword"
                clearable
                placeholder="检索源：支持源名称、类型、地址、仓库编码"
                @keyup.enter="reloadSourceSearch"
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:search-line" />
                </template>
              </el-input>
            </div>

            <template v-if="currentRepository">
              <div class="source-panel__grid">
                <article class="source-card">
                  <header>
                    <strong>主下载源</strong>
                    <small>{{ repositoryTypeLabel(sourceEditor.repositoryType) }}</small>
                  </header>
                  <div class="source-form-grid">
                    <el-form-item label="仓库类型">
                      <el-select v-model="sourceEditor.repositoryType" disabled>
                        <el-option
                          v-for="item in sourceTypeOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item v-if="requiresRepositoryUrl(sourceEditor.repositoryType)" label="主地址">
                      <el-input
                        v-model="sourceEditor.repositoryUrl"
                        placeholder="例如: https://repo.example.com/index.json"
                      />
                    </el-form-item>
                    <el-form-item v-if="requiresLocalDirectory(sourceEditor.repositoryType)" label="本地目录">
                      <el-input
                        v-model="sourceEditor.localDirectory"
                        placeholder="例如: H:/workspace/soft-repository"
                      />
                    </el-form-item>
                  </div>
                </article>

                <article class="source-card">
                  <header class="source-card__header-row">
                    <div>
                      <strong>检索源</strong>
                      <small>用于在线检索、补充索引与版本发现</small>
                    </div>
                    <el-button type="primary" plain @click="addSourceConfig">
                      新增源
                    </el-button>
                  </header>

                  <div v-if="sourceEditor.sourceConfigs.length" class="source-config-list">
                    <div
                      v-for="(item, index) in sourceEditor.sourceConfigs"
                      :key="item.draftId"
                      class="source-config-item"
                    >
                      <div class="source-config-item__head">
                        <strong>{{ item.sourceName || `源 ${index + 1}` }}</strong>
                        <el-button link type="danger" @click="removeSourceConfig(index)">
                          删除
                        </el-button>
                      </div>

                      <div class="source-form-grid source-form-grid--row">
                        <el-input
                          v-model="item.sourceName"
                          placeholder="源名称（可选）"
                        />
                        <el-select v-model="item.sourceType" placeholder="源类型">
                          <el-option
                            v-for="option in sourceTypeOptions"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                          />
                        </el-select>
                        <el-input
                          v-if="requiresRepositoryUrl(item.sourceType)"
                          v-model="item.sourceUrl"
                          placeholder="源地址"
                        />
                        <el-input
                          v-if="requiresLocalDirectory(item.sourceType)"
                          v-model="item.localDirectory"
                          placeholder="本地目录"
                        />
                        <el-input
                          v-model="item.sourceConfig"
                          placeholder="源配置（可选 JSON）"
                        />
                        <el-switch
                          v-model="item.enabled"
                          inline-prompt
                          active-text="启用"
                          inactive-text="停用"
                        />
                      </div>
                    </div>
                  </div>
                  <el-empty v-else description="还没有检索源，点击新增源添加" />
                </article>
              </div>
            </template>
            <el-empty v-else description="请先选择一个仓库再编辑下载源" />

            <article class="source-card source-search-result">
              <header>
                <strong>检索结果</strong>
                <small>共 {{ sourceSearchResults.length }} 条</small>
              </header>
              <el-table :data="sourceSearchResults" size="small" border>
                <el-table-column prop="repositoryName" label="仓库" min-width="160" />
                <el-table-column prop="repositoryCode" label="编码" min-width="130" />
                <el-table-column prop="sourceName" label="源名称" min-width="160" />
                <el-table-column prop="sourceType" label="类型" width="120" />
                <el-table-column prop="sourceAddress" label="地址/目录" min-width="240" show-overflow-tooltip />
                <el-table-column label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.enabled ? 'success' : 'info'" effect="light" size="small">
                      {{ row.enabled ? '启用' : '停用' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </article>
          </section>
        </template>

        <template v-else-if="railTab === CREATE_TAB">
          <section class="create-panel">
            <article class="source-card">
              <header class="source-card__header-row">
                <div>
                  <strong>添加软件</strong>
                  <small>录入软件信息、脚本与服务接入配置，保存后立即可见。</small>
                </div>
                <div class="source-panel__actions">
                  <el-button @click="resetCreatePackageForm">重置</el-button>
                  <el-button
                    type="primary"
                    :loading="creatingPackage"
                    @click="submitCreatePackage"
                  >
                    保存软件
                  </el-button>
                </div>
              </header>

              <section class="create-group">
                <h4>AI 草稿</h4>
                <el-input
                  v-model="createPackageAiPrompt"
                  type="textarea"
                  :rows="3"
                  placeholder="描述你要添加的软件，例如：在 Linux AMD64 上部署 MySQL 8.4，接入 systemd 服务，给出安装/启动/停止/卸载脚本"
                />
                <div class="source-panel__actions">
                  <el-button
                    type="warning"
                    :loading="creatingPackageAiDraft"
                    @click="generateCreatePackageAiDraft"
                  >
                    AI 生成并回填表单
                  </el-button>
                </div>
              </section>

              <section class="create-group">
                <h4>基础信息</h4>
                <div class="source-form-grid source-form-grid--row">
                  <el-form-item label="仓库">
                    <el-select
                      v-model="createForm.softRepositoryId"
                      clearable
                      filterable
                      placeholder="可选，默认使用当前可用仓库"
                    >
                      <el-option
                        v-for="item in repositories"
                        :key="item.softRepositoryId"
                        :label="`${item.repositoryName} (${item.repositoryCode})`"
                        :value="item.softRepositoryId"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="软件编码">
                    <el-input v-model="createForm.packageCode" placeholder="例如: mysql-community" />
                  </el-form-item>
                  <el-form-item label="软件名称">
                    <el-input v-model="createForm.packageName" placeholder="例如: MySQL Community" />
                  </el-form-item>
                  <el-form-item label="软件分类">
                    <el-input v-model="createForm.packageCategory" placeholder="例如: database" />
                  </el-form-item>
                  <el-form-item label="画像编码">
                    <el-input v-model="createForm.profileCode" placeholder="可选" />
                  </el-form-item>
                  <el-form-item label="操作系统">
                    <el-select v-model="createForm.osType" clearable placeholder="可选">
                      <el-option
                        v-for="option in osFilterOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="架构">
                    <el-select v-model="createForm.architecture" clearable placeholder="可选">
                      <el-option
                        v-for="option in architectureFilterOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="图标地址">
                    <el-input v-model="createForm.iconUrl" placeholder="可选" />
                  </el-form-item>
                  <el-form-item label="描述" class="create-form-span-2">
                    <el-input
                      v-model="createForm.description"
                      type="textarea"
                      :rows="3"
                      placeholder="软件说明、用途、运行要求"
                    />
                  </el-form-item>
                </div>
              </section>

              <section class="create-group">
                <h4>版本信息</h4>
                <div class="source-form-grid source-form-grid--row">
                  <el-form-item label="版本编码">
                    <el-input v-model="createForm.versionCode" placeholder="例如: 8.4.3" />
                  </el-form-item>
                  <el-form-item label="版本名称">
                    <el-input v-model="createForm.versionName" placeholder="可选，默认等于版本编码" />
                  </el-form-item>
                  <el-form-item label="下载地址" class="create-form-span-2">
                    <el-input
                      v-model="createForm.downloadUrlsText"
                      type="textarea"
                      :rows="3"
                      placeholder="每行一个地址，或使用英文逗号分隔"
                    />
                  </el-form-item>
                </div>
              </section>

              <section class="create-group">
                <h4>脚本信息</h4>
                <div class="source-form-grid source-form-grid--row">
                  <el-form-item label="安装脚本" class="create-form-span-2">
                    <el-input v-model="createForm.installScript" type="textarea" :rows="4" />
                  </el-form-item>
                  <el-form-item label="初始化脚本" class="create-form-span-2">
                    <el-input v-model="createForm.initScript" type="textarea" :rows="3" />
                  </el-form-item>
                  <el-form-item label="启动脚本" class="create-form-span-2">
                    <el-input v-model="createForm.startScript" type="textarea" :rows="3" />
                  </el-form-item>
                  <el-form-item label="停止脚本" class="create-form-span-2">
                    <el-input v-model="createForm.stopScript" type="textarea" :rows="3" />
                  </el-form-item>
                  <el-form-item label="卸载脚本" class="create-form-span-2">
                    <el-input v-model="createForm.uninstallScript" type="textarea" :rows="3" />
                  </el-form-item>
                  <el-form-item label="服务注册脚本" class="create-form-span-2">
                    <el-input v-model="createForm.serviceRegisterScript" type="textarea" :rows="3" />
                  </el-form-item>
                  <el-form-item label="服务卸载脚本" class="create-form-span-2">
                    <el-input v-model="createForm.serviceUnregisterScript" type="textarea" :rows="3" />
                  </el-form-item>
                </div>
              </section>

              <section class="create-group">
                <h4>服务化接入</h4>
                <div class="source-form-grid source-form-grid--row">
                  <el-form-item label="接入 server 服务">
                    <el-switch
                      v-model="createForm.integrateServerService"
                      inline-prompt
                      active-text="接入"
                      inactive-text="不接入"
                    />
                  </el-form-item>
                  <el-form-item label="启用版本">
                    <el-switch
                      v-model="createForm.enabled"
                      inline-prompt
                      active-text="启用"
                      inactive-text="停用"
                    />
                  </el-form-item>
                  <template v-if="createForm.integrateServerService">
                    <el-form-item label="服务编码">
                      <el-input v-model="createForm.serverServiceCode" placeholder="例如: mysql-service" />
                    </el-form-item>
                    <el-form-item label="服务名称">
                      <el-input v-model="createForm.serverServiceName" placeholder="例如: MySQL Service" />
                    </el-form-item>
                    <el-form-item label="服务类型">
                      <el-input v-model="createForm.serverServiceType" placeholder="例如: SYSTEMD / WINDOWS_SERVICE" />
                    </el-form-item>
                    <el-form-item label="启动方式">
                      <el-input v-model="createForm.serverServiceStartMode" placeholder="例如: AUTO / MANUAL" />
                    </el-form-item>
                    <el-form-item label="执行通道">
                      <el-input v-model="createForm.serverExecutionProvider" placeholder="例如: LOCAL / SSH / WINRM" />
                    </el-form-item>
                  </template>
                </div>
              </section>
            </article>
          </section>
        </template>
      </template>

      <template #rail-footer>
        <div class="soft-rail-footer">
          <el-tooltip content="下载源设置" placement="left">
            <el-button circle type="primary" @click="openSourceSettingsTab">
              <IconifyIconOnline icon="ri:settings-4-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="添加软件" placement="left">
            <el-button circle type="success" @click="openCreatePackageTab">
              <IconifyIconOnline icon="ri:add-line" />
            </el-button>
          </el-tooltip>
        </div>
      </template>
    </ScLayout>

    <el-dialog
      v-model="softwareDetailVisible"
      width="860px"
      title="软件详情"
      destroy-on-close
    >
      <template v-if="currentSoftwareDetail">
        <section class="software-detail">
          <header class="software-detail__head">
            <div>
              <h3>{{ currentSoftwareDetail.name }}</h3>
              <p>{{ currentSoftwareDetail.code }}</p>
            </div>
            <el-tag size="small" effect="light">
              {{ currentSoftwareDetail.packageCount }} 包
            </el-tag>
          </header>

          <p class="software-detail__desc">
            {{ currentSoftwareDetail.description || "暂无描述" }}
          </p>

          <div class="software-detail__meta">
            <span>{{ currentSoftwareDetail.category || "未分类" }}</span>
            <span>
              {{
                currentSoftwareDetail.osTypes.map((value) => osLabel(value)).join(" / ") || "通用系统"
              }}
            </span>
            <span>
              {{
                currentSoftwareDetail.architectures
                  .map((value) => architectureLabel(value))
                  .join(" / ") || "通用架构"
              }}
            </span>
          </div>

          <el-table :data="currentSoftwareVariants" size="small" border>
            <el-table-column prop="packageName" label="软件包" min-width="180" />
            <el-table-column prop="packageCode" label="编码" min-width="150" />
            <el-table-column prop="osType" label="系统" width="120">
              <template #default="{ row }">
                {{ osLabel(row.osType) }}
              </template>
            </el-table-column>
            <el-table-column prop="architecture" label="架构" width="120">
              <template #default="{ row }">
                {{ architectureLabel(row.architecture) }}
              </template>
            </el-table-column>
            <el-table-column prop="softPackageId" label="操作" width="140">
              <template #default="{ row }">
                <el-button
                  link
                  type="primary"
                  @click="openDetailPage(row.softPackageId)"
                >
                  打开完整详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </template>
      <el-empty v-else description="未选择软件" />
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import ScLayout from "@repo/components/ScLayout";
import {
  createSoftPackage,
  generateSoftPackageAiDraft,
  listSoftPackages,
  listSoftRepositories,
  listSoftRepositorySources,
  syncSoftRepository,
  updateSoftRepositorySources,
} from "../api";
import type {
  SoftPackageAiDraftResponse,
  SoftPackage,
  SoftPackageCreateRequest,
  SoftRepository,
  SoftRepositorySource,
  SoftRepositorySourceSearchItem,
} from "../api";

const HOME_TAB = "software-home";
const SOURCE_TAB = "source-settings";
const CREATE_TAB = "package-create";

type SourceDraft = SoftRepositorySource & {
  draftId: string;
};
type SourceType = SoftRepositorySource["sourceType"];
type RailTabItem = {
  closable?: boolean;
  name: string;
  title: string;
};

type SoftwareCard = {
  architectures: string[];
  category?: string;
  code: string;
  defaultPackageId: number | null;
  description?: string;
  key: string;
  name: string;
  osTypes: string[];
  packageCount: number;
};

const router = useRouter();
const loading = ref(false);
const syncingRepository = ref(false);
const savingSources = ref(false);
const sourceSearchLoading = ref(false);
const creatingPackage = ref(false);
const creatingPackageAiDraft = ref(false);

const railTab = ref<string>(HOME_TAB);
const sourceTabVisible = ref(false);
const createTabVisible = ref(false);
const softwareDetailVisible = ref(false);
const activeSoftwareKey = ref("");

const packages = ref<SoftPackage[]>([]);
const repositories = ref<SoftRepository[]>([]);
const sourceSearchResults = ref<SoftRepositorySourceSearchItem[]>([]);

const keyword = ref("");
const osFilter = ref("");
const architectureFilter = ref("");

const activeRepositoryId = ref<number | null>(null);
const sourceSearchKeyword = ref("");
const createPackageAiPrompt = ref("");

const sourceEditor = reactive({
  repositoryType: "MANUAL",
  repositoryUrl: "",
  localDirectory: "",
  sourceConfigs: [] as SourceDraft[],
});

const createForm = reactive({
  architecture: "",
  description: "",
  downloadUrlsText: "",
  enabled: true,
  iconUrl: "",
  initScript: "",
  installScript: "",
  integrateServerService: false,
  osType: "",
  packageCategory: "",
  packageCode: "",
  packageName: "",
  profileCode: "",
  serverExecutionProvider: "",
  serverServiceCode: "",
  serverServiceName: "",
  serverServiceStartMode: "",
  serverServiceType: "",
  serviceRegisterScript: "",
  serviceUnregisterScript: "",
  softRepositoryId: null as number | null,
  startScript: "",
  stopScript: "",
  uninstallScript: "",
  versionCode: "",
  versionName: "",
});

const sourceTypeOptions: Array<{ label: string; value: SourceType }> = [
  { label: "手工维护", value: "MANUAL" },
  { label: "HTTP JSON", value: "HTTP_JSON" },
  { label: "HTTP 目录", value: "HTTP_DIR" },
  { label: "本地目录", value: "LOCAL_DIR" },
  { label: "RPM 仓库", value: "RPM_REPO" },
  { label: "镜像目录", value: "MIRROR_REPO" },
];

const osFilterOptions = [
  { label: "Linux", value: "LINUX" },
  { label: "Windows", value: "WINDOWS" },
  { label: "MacOS", value: "MACOS" },
  { label: "Unix", value: "UNIX" },
];

const architectureFilterOptions = [
  { label: "amd64", value: "amd64" },
  { label: "arm64", value: "arm64" },
  { label: "x86", value: "x86" },
];

const railTabs = computed<RailTabItem[]>(() => {
  const tabs: RailTabItem[] = [
    {
      name: HOME_TAB,
      title: "软件列表",
    },
  ];
  if (sourceTabVisible.value) {
    tabs.push({
      name: SOURCE_TAB,
      title: "下载源设置",
      closable: true,
    });
  }
  if (createTabVisible.value) {
    tabs.push({
      name: CREATE_TAB,
      title: "添加软件",
      closable: true,
    });
  }
  return tabs;
});

const softwareList = computed<SoftwareCard[]>(() => {
  const grouped = new Map<string, SoftwareCard>();
  packages.value.forEach((item) => {
    const code = normalizeText(item.packageCode) || "unknown";
    const key = normalizeText(item.softwareKey) || code;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        architectures: normalizeArray(item.architecture),
        category: normalizeText(item.packageCategory) || undefined,
        code,
        defaultPackageId: Number.isFinite(Number(item.softPackageId))
          ? Number(item.softPackageId)
          : null,
        description: normalizeText(item.description) || undefined,
        key,
        name: normalizeText(item.packageName) || code,
        osTypes: normalizeArray(item.osType),
        packageCount: 1,
      });
      return;
    }

    existing.packageCount += 1;
    existing.osTypes = unique([...existing.osTypes, ...normalizeArray(item.osType)]);
    existing.architectures = unique([
      ...existing.architectures,
      ...normalizeArray(item.architecture),
    ]);

    if (!existing.description && normalizeText(item.description)) {
      existing.description = normalizeText(item.description) || undefined;
    }
    if (!existing.category && normalizeText(item.packageCategory)) {
      existing.category = normalizeText(item.packageCategory) || undefined;
    }
  });

  return [...grouped.values()].sort((left, right) => left.name.localeCompare(right.name));
});

const filteredSoftware = computed(() => {
  const text = normalizeText(keyword.value)?.toLowerCase();
  const os = normalizeText(osFilter.value)?.toUpperCase();
  const arch = normalizeText(architectureFilter.value)?.toLowerCase();

  return softwareList.value.filter((item) => {
    if (
      text &&
      ![item.name, item.code, item.category, item.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(text))
    ) {
      return false;
    }
    if (os && !item.osTypes.map((value) => value.toUpperCase()).includes(os)) {
      return false;
    }
    if (
      arch &&
      !item.architectures.map((value) => value.toLowerCase()).includes(arch)
    ) {
      return false;
    }
    return true;
  });
});

const currentSoftwareDetail = computed(() =>
  softwareList.value.find((item) => item.key === activeSoftwareKey.value) || null,
);

const currentSoftwareVariants = computed(() => {
  const softwareKey = activeSoftwareKey.value;
  if (!softwareKey) {
    return [];
  }
  return packages.value.filter(
    (item) => resolveSoftwareKey(item) === softwareKey,
  );
});

const totalSourceCount = computed(() =>
  repositories.value.reduce((count, item) => {
    const extra = Array.isArray(item.sourceConfigs) ? item.sourceConfigs.length : 0;
    return count + extra + 1;
  }, 0),
);

const currentRepository = computed(() =>
  repositories.value.find(
    (item) => Number(item.softRepositoryId || 0) === Number(activeRepositoryId.value || 0),
  ) || null,
);

const loadHomeData = async () => {
  loading.value = true;
  try {
    const [packageResult, repositoryResult] = await Promise.all([
      listSoftPackages(),
      listSoftRepositories(),
    ]);
    packages.value = Array.isArray(packageResult.data) ? packageResult.data : [];
    repositories.value = Array.isArray(repositoryResult.data) ? repositoryResult.data : [];

    if (
      activeRepositoryId.value &&
      !repositories.value.some(
        (item) => Number(item.softRepositoryId || 0) === Number(activeRepositoryId.value || 0),
      )
    ) {
      activeRepositoryId.value = null;
    }

    if (!activeRepositoryId.value && repositories.value.length) {
      activeRepositoryId.value = Number(repositories.value[0].softRepositoryId || 0) || null;
    }
    if (!createForm.softRepositoryId && repositories.value.length) {
      createForm.softRepositoryId =
        Number(repositories.value[0].softRepositoryId || 0) || null;
    }
  } finally {
    loading.value = false;
  }
};

const openSourceSettingsTab = async () => {
  sourceTabVisible.value = true;
  railTab.value = SOURCE_TAB;
  if (!repositories.value.length) {
    await loadHomeData();
  }
  await reloadSourceSearch();
};

const openCreatePackageTab = async () => {
  if (!repositories.value.length) {
    await loadHomeData();
  }
  if (!createForm.softRepositoryId && repositories.value.length) {
    createForm.softRepositoryId =
      Number(repositories.value[0].softRepositoryId || 0) || null;
  }
  createTabVisible.value = true;
  railTab.value = CREATE_TAB;
};

const handleRailTabRemove = (name: string | number) => {
  const tabName = String(name);
  if (tabName === SOURCE_TAB) {
    sourceTabVisible.value = false;
  }
  if (tabName === CREATE_TAB) {
    createTabVisible.value = false;
  }
  railTab.value = HOME_TAB;
};

const reloadSourceSearch = async () => {
  sourceSearchLoading.value = true;
  try {
    const result = await listSoftRepositorySources(sourceSearchKeyword.value);
    sourceSearchResults.value = Array.isArray(result.data) ? result.data : [];
  } finally {
    sourceSearchLoading.value = false;
  }
};

const syncCurrentRepository = async () => {
  const repositoryId = Number(currentRepository.value?.softRepositoryId || 0);
  if (!repositoryId) {
    ElMessage.warning("请先选择仓库");
    return;
  }
  syncingRepository.value = true;
  try {
    await syncSoftRepository(repositoryId);
    ElMessage.success("仓库同步已提交");
    await loadHomeData();
    await reloadSourceSearch();
  } finally {
    syncingRepository.value = false;
  }
};

const saveCurrentRepositorySources = async () => {
  const repositoryId = Number(currentRepository.value?.softRepositoryId || 0);
  if (!repositoryId) {
    ElMessage.warning("请先选择仓库");
    return;
  }
  savingSources.value = true;
  try {
    await updateSoftRepositorySources(repositoryId, {
      repositoryUrl: normalizeText(sourceEditor.repositoryUrl),
      localDirectory: normalizeText(sourceEditor.localDirectory),
      sourceConfigs: sourceEditor.sourceConfigs.map((item) => ({
        sourceName: normalizeText(item.sourceName),
        sourceType: toSourceType(item.sourceType),
        sourceUrl: normalizeText(item.sourceUrl),
        localDirectory: normalizeText(item.localDirectory),
        enabled: item.enabled !== false,
        sourceConfig: normalizeText(item.sourceConfig),
      })),
    });
    ElMessage.success("下载源已保存");
    await loadHomeData();
    await reloadSourceSearch();
  } finally {
    savingSources.value = false;
  }
};

const addSourceConfig = () => {
  sourceEditor.sourceConfigs.push({
    draftId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    sourceName: "",
    sourceType: "HTTP_JSON",
    sourceUrl: "",
    localDirectory: "",
    enabled: true,
    sourceConfig: "",
  });
};

const removeSourceConfig = (index: number) => {
  sourceEditor.sourceConfigs.splice(index, 1);
};

const resetCreatePackageForm = () => {
  createPackageAiPrompt.value = "";
  createForm.softRepositoryId =
    Number(repositories.value[0]?.softRepositoryId || 0) || null;
  createForm.packageCode = "";
  createForm.packageName = "";
  createForm.packageCategory = "";
  createForm.profileCode = "";
  createForm.osType = "";
  createForm.architecture = "";
  createForm.description = "";
  createForm.iconUrl = "";
  createForm.versionCode = "";
  createForm.versionName = "";
  createForm.downloadUrlsText = "";
  createForm.installScript = "";
  createForm.initScript = "";
  createForm.startScript = "";
  createForm.stopScript = "";
  createForm.uninstallScript = "";
  createForm.serviceRegisterScript = "";
  createForm.serviceUnregisterScript = "";
  createForm.integrateServerService = false;
  createForm.serverServiceCode = "";
  createForm.serverServiceName = "";
  createForm.serverServiceType = "";
  createForm.serverServiceStartMode = "";
  createForm.serverExecutionProvider = "";
  createForm.enabled = true;
};

const applyCreatePackageAiDraft = (draft?: SoftPackageAiDraftResponse | null) => {
  if (!draft) {
    return;
  }
  createForm.packageCode = firstNonBlank(draft.packageCode, createForm.packageCode);
  createForm.packageName = firstNonBlank(draft.packageName, createForm.packageName);
  createForm.packageCategory = firstNonBlank(
    draft.packageCategory,
    createForm.packageCategory,
  );
  createForm.profileCode = firstNonBlank(draft.profileCode, createForm.profileCode);
  createForm.osType = firstNonBlank(draft.osType, createForm.osType);
  createForm.architecture = firstNonBlank(draft.architecture, createForm.architecture);
  createForm.description = firstNonBlank(draft.description, createForm.description);
  createForm.iconUrl = firstNonBlank(draft.iconUrl, createForm.iconUrl);
  createForm.versionCode = firstNonBlank(draft.versionCode, createForm.versionCode);
  createForm.versionName = firstNonBlank(draft.versionName, createForm.versionName);
  createForm.downloadUrlsText = Array.isArray(draft.downloadUrls)
    ? draft.downloadUrls.join("\n")
    : createForm.downloadUrlsText;
  createForm.installScript = firstNonBlank(draft.installScript, createForm.installScript);
  createForm.initScript = firstNonBlank(draft.initScript, createForm.initScript);
  createForm.startScript = firstNonBlank(draft.startScript, createForm.startScript);
  createForm.stopScript = firstNonBlank(draft.stopScript, createForm.stopScript);
  createForm.uninstallScript = firstNonBlank(
    draft.uninstallScript,
    createForm.uninstallScript,
  );
  createForm.serviceRegisterScript = firstNonBlank(
    draft.serviceRegisterScript,
    createForm.serviceRegisterScript,
  );
  createForm.serviceUnregisterScript = firstNonBlank(
    draft.serviceUnregisterScript,
    createForm.serviceUnregisterScript,
  );
  if (typeof draft.enabled === "boolean") {
    createForm.enabled = draft.enabled;
  }
  if (typeof draft.integrateServerService === "boolean") {
    createForm.integrateServerService = draft.integrateServerService;
  }
  createForm.serverServiceCode = firstNonBlank(
    draft.serverServiceCode,
    createForm.serverServiceCode,
  );
  createForm.serverServiceName = firstNonBlank(
    draft.serverServiceName,
    createForm.serverServiceName,
  );
  createForm.serverServiceType = firstNonBlank(
    draft.serverServiceType,
    createForm.serverServiceType,
  );
  createForm.serverServiceStartMode = firstNonBlank(
    draft.serverServiceStartMode,
    createForm.serverServiceStartMode,
  );
  createForm.serverExecutionProvider = firstNonBlank(
    draft.serverExecutionProvider,
    createForm.serverExecutionProvider,
  );
};

const generateCreatePackageAiDraft = async () => {
  const prompt = normalizeText(createPackageAiPrompt.value);
  if (!prompt) {
    ElMessage.warning("请先输入 AI 描述");
    return;
  }
  creatingPackageAiDraft.value = true;
  try {
    const result = await generateSoftPackageAiDraft({
      architecture: toOptionalText(createForm.architecture),
      integrateServerService: createForm.integrateServerService,
      osType: toOptionalText(createForm.osType),
      packageCategory: toOptionalText(createForm.packageCategory),
      packageCode: toOptionalText(createForm.packageCode),
      packageName: toOptionalText(createForm.packageName),
      prompt,
      versionCode: toOptionalText(createForm.versionCode),
    });
    const draft = result.data;
    applyCreatePackageAiDraft(draft);
    const message = normalizeText(draft?.message);
    if (message) {
      ElMessage.success(message);
    } else {
      ElMessage.success("AI 草稿已回填");
    }
  } finally {
    creatingPackageAiDraft.value = false;
  }
};

const parseDownloadUrls = (value: string) =>
  value
    .split(/[\r\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const toOptionalText = (value?: string | null) => {
  const normalized = normalizeText(value);
  return normalized || undefined;
};

const firstNonBlank = (left?: string | null, right?: string | null) =>
  normalizeText(left) || normalizeText(right);

const submitCreatePackage = async () => {
  const packageCode = toOptionalText(createForm.packageCode);
  const packageName = toOptionalText(createForm.packageName);
  const versionCode = toOptionalText(createForm.versionCode);
  if (!packageCode || !packageName || !versionCode) {
    ElMessage.warning("软件编码、软件名称、版本编码为必填项");
    return;
  }

  const payload: SoftPackageCreateRequest = {
    architecture: toOptionalText(createForm.architecture),
    description: toOptionalText(createForm.description),
    downloadUrls: parseDownloadUrls(createForm.downloadUrlsText),
    enabled: createForm.enabled,
    iconUrl: toOptionalText(createForm.iconUrl),
    initScript: toOptionalText(createForm.initScript),
    installScript: toOptionalText(createForm.installScript),
    integrateServerService: createForm.integrateServerService,
    osType: toOptionalText(createForm.osType),
    packageCategory: toOptionalText(createForm.packageCategory),
    packageCode,
    packageName,
    profileCode: toOptionalText(createForm.profileCode),
    serverExecutionProvider: createForm.integrateServerService
      ? toOptionalText(createForm.serverExecutionProvider)
      : undefined,
    serverServiceCode: createForm.integrateServerService
      ? toOptionalText(createForm.serverServiceCode)
      : undefined,
    serverServiceName: createForm.integrateServerService
      ? toOptionalText(createForm.serverServiceName)
      : undefined,
    serverServiceStartMode: createForm.integrateServerService
      ? toOptionalText(createForm.serverServiceStartMode)
      : undefined,
    serverServiceType: createForm.integrateServerService
      ? toOptionalText(createForm.serverServiceType)
      : undefined,
    serviceRegisterScript: toOptionalText(createForm.serviceRegisterScript),
    serviceUnregisterScript: toOptionalText(createForm.serviceUnregisterScript),
    softRepositoryId:
      Number(createForm.softRepositoryId || 0) > 0
        ? Number(createForm.softRepositoryId)
        : undefined,
    startScript: toOptionalText(createForm.startScript),
    stopScript: toOptionalText(createForm.stopScript),
    uninstallScript: toOptionalText(createForm.uninstallScript),
    versionCode,
    versionName: toOptionalText(createForm.versionName),
  };

  creatingPackage.value = true;
  try {
    const result = await createSoftPackage(payload);
    ElMessage.success("软件创建成功");
    await loadHomeData();
    const createdPackage = result.data?.package;
    const createdKey =
      normalizeText(createdPackage?.softwareKey) ||
      normalizeText(createdPackage?.packageCode);
    if (createdKey) {
      activeSoftwareKey.value = createdKey;
      softwareDetailVisible.value = true;
      railTab.value = HOME_TAB;
      createTabVisible.value = false;
    }
    resetCreatePackageForm();
  } finally {
    creatingPackage.value = false;
  }
};

const openSoftwareDetail = (item: SoftwareCard) => {
  activeSoftwareKey.value = item.key;
  softwareDetailVisible.value = true;
};

const openDetailPage = (id?: number | null) => {
  const packageId =
    Number.isFinite(Number(id)) && Number(id) > 0
      ? Number(id)
      : Number(currentSoftwareVariants.value[0]?.softPackageId || 0);
  if (!packageId) {
    ElMessage.warning("未找到可打开的软件详情");
    return;
  }
  softwareDetailVisible.value = false;
  router.push(`/soft/detail/${packageId}`);
};

watch(
  currentRepository,
  (repository) => {
    if (!repository) {
      sourceEditor.repositoryType = "MANUAL";
      sourceEditor.repositoryUrl = "";
      sourceEditor.localDirectory = "";
      sourceEditor.sourceConfigs = [];
      return;
    }

    sourceEditor.repositoryType = normalizeText(repository.repositoryType) || "MANUAL";
    sourceEditor.repositoryUrl = normalizeText(repository.repositoryUrl) || "";
    sourceEditor.localDirectory = normalizeText(repository.localDirectory) || "";
    sourceEditor.sourceConfigs = (repository.sourceConfigs || []).map((item) => ({
      draftId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      sourceName: normalizeText(item.sourceName) || "",
      sourceType: toSourceType(item.sourceType),
      sourceUrl: normalizeText(item.sourceUrl) || "",
      localDirectory: normalizeText(item.localDirectory) || "",
      enabled: item.enabled !== false,
      sourceConfig: normalizeText(item.sourceConfig) || "",
    }));
  },
  { immediate: true },
);

const normalizeText = (value?: string | null) => {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
};

const normalizeArray = (value?: string | null) =>
  normalizeText(value)
    .split(/[\s,|/]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const unique = (value: string[]) => [...new Set(value)];

const resolveSoftwareKey = (item?: SoftPackage | null) => {
  const fromMetadata = normalizeText(item?.softwareKey);
  if (fromMetadata) {
    return fromMetadata;
  }
  return normalizeText(item?.packageCode);
};

const toSourceType = (value?: string | null): SourceType => {
  const normalized = normalizeText(value).toUpperCase();
  const hit = sourceTypeOptions.find((item) => item.value === normalized);
  return hit ? hit.value : "HTTP_JSON";
};

const requiresRepositoryUrl = (type?: string | null) => {
  const normalized = normalizeText(type).toUpperCase();
  return ["HTTP_JSON", "HTTP_DIR", "RPM_REPO", "MIRROR_REPO"].includes(normalized);
};

const requiresLocalDirectory = (type?: string | null) =>
  normalizeText(type).toUpperCase() === "LOCAL_DIR";

const osLabel = (value?: string | null) => {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return "通用";
  if (normalized.startsWith("WIN")) return "Windows";
  if (normalized.startsWith("LINUX")) return "Linux";
  if (normalized.startsWith("MAC")) return "MacOS";
  return normalized;
};

const architectureLabel = (value?: string | null) => {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return "通用";
  if (normalized === "amd64" || normalized === "x86_64") return "amd64";
  if (normalized === "arm64" || normalized === "aarch64") return "arm64";
  return normalized;
};

const repositoryTypeLabel = (value?: string | null) =>
  sourceTypeOptions.find((item) => item.value === normalizeText(value).toUpperCase())
    ?.label || normalizeText(value) || "MANUAL";

onMounted(loadHomeData);
</script>

<style scoped lang="scss">
.soft-home-page {
  width: 100%;
  min-width: 0;
}

.soft-home-layout {
  min-height: calc(100vh - 150px);
}

.soft-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(135deg, #ffffff, #eef6ff);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
}

.soft-hero small {
  color: #64748b;
  letter-spacing: 0.08em;
}

.soft-hero h1 {
  margin: 4px 0 8px;
  color: #0f172a;
  font-size: 28px;
}

.soft-hero p {
  margin: 0;
  color: #475569;
}

.soft-hero__actions {
  display: inline-flex;
  align-items: flex-start;
  gap: 10px;
}

.soft-summary {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.soft-summary__card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.88);
}

.soft-summary__card small {
  color: #64748b;
}

.soft-summary__card strong {
  color: #0f172a;
  font-size: 20px;
}

.soft-toolbar {
  margin-top: 14px;
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 12px;
}

.software-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.software-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.07);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.software-card:hover {
  transform: translateY(-2px);
  border-color: rgba(37, 99, 235, 0.35);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.12);
}

.software-card__header,
.software-card__actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.software-card__header strong {
  color: #0f172a;
  font-size: 17px;
}

.software-card__header p,
.software-card__desc {
  margin: 0;
  color: #64748b;
}

.software-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.software-card__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}

.source-panel {
  margin-top: 16px;
  display: grid;
  gap: 14px;
}

.create-panel {
  margin-top: 16px;
}

.create-group {
  display: grid;
  gap: 10px;
}

.create-group h4 {
  margin: 0;
  color: #0f172a;
  font-size: 14px;
}

.create-form-span-2 {
  grid-column: 1 / -1;
}

.source-panel__header,
.source-card__header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.source-panel__header h3,
.source-panel__header p,
.source-card header strong,
.source-card header small {
  margin: 0;
}

.source-panel__header p,
.source-card header small {
  margin-top: 6px;
  color: #64748b;
  font-size: 13px;
}

.source-panel__actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.source-panel__toolbar {
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;
}

.source-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.source-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.88);
}

.source-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.source-form-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.source-config-list {
  display: grid;
  gap: 10px;
}

.source-config-item {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  border: 1px dashed rgba(148, 163, 184, 0.36);
}

.source-config-item__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.source-form-grid--row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.source-search-result {
  margin-top: 2px;
}

.soft-rail-footer {
  display: grid;
  gap: 10px;
}

.software-detail {
  display: grid;
  gap: 14px;
}

.software-detail__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.software-detail__head h3,
.software-detail__head p {
  margin: 0;
}

.software-detail__head p,
.software-detail__desc {
  color: #64748b;
}

.software-detail__desc {
  margin: 0;
}

.software-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.software-detail__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .software-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .source-panel__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .soft-summary,
  .soft-toolbar,
  .software-grid,
  .source-panel__toolbar,
  .source-form-grid,
  .source-form-grid--row {
    grid-template-columns: 1fr;
  }

  .soft-hero {
    grid-template-columns: 1fr;
    display: grid;
  }

  .soft-hero__actions {
    justify-content: flex-start;
  }
}
</style>
