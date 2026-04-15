<template>
  <section class="soft-home-page">
    <ScLayout
      v-model="railTab"
      class="soft-home-layout"
      rail-close-button-mode="always"
      :main-min-width="320"
      :rail-width="48"
      :rail-tabs="railTabs"
      @tab-remove="handleRailTabRemove($event.name)"
    >
      <template #default>
        <section class="soft-stage">
          <div class="soft-stage__content" :class="{ 'is-workbench-open': isWorkbenchOpen }">
            <header class="soft-hero">
              <div>
                <small>SOFT / HOME</small>
                <h1>软件列表</h1>
                <p>主区固定展示软件目录，右侧图标与底部操作负责打开主工作区工作台。</p>
              </div>
              <div class="soft-hero__actions">
                <el-tooltip content="刷新软件目录" placement="top">
                  <el-button circle :loading="loading" @click="loadHomeData">
                    <IconifyIconOnline icon="ri:refresh-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </header>

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
              <el-select v-model="architectureFilter" clearable placeholder="按架构筛选">
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
                  <div class="software-card__identity">
                    <div class="software-card__icon">
                      <img
                        v-if="item.iconUrl"
                        :src="item.iconUrl"
                        :alt="`${item.name} 图标`"
                        loading="lazy"
                      />
                      <span v-else>{{ softwareAvatarText(item.name) }}</span>
                    </div>
                    <div>
                      <strong>{{ item.name }}</strong>
                      <p>{{ item.code }}</p>
                    </div>
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
                  <el-button plain @click.stop="openSoftwareDetail(item)">
                    查看详情
                  </el-button>
                  <el-button @click.stop="openDetailPage(item.defaultPackageId)">
                    打开详情页
                  </el-button>
                </footer>
              </article>
            </div>
            <el-empty v-else description="没有匹配的软件" />
          </div>

          <aside v-if="isWorkbenchOpen" class="soft-stage__workbench">
            <header class="soft-workbench__header">
              <div>
                <small>
                  {{ railTab === SOURCE_TAB ? "SOURCE / SETTING" : "CREATE / PACKAGE" }}
                </small>
                <h3>{{ railTab === SOURCE_TAB ? "下载源设置" : "添加软件" }}</h3>
                <p>
                  {{
                    railTab === SOURCE_TAB
                      ? "下载源设置会覆盖主工作区，专注完成仓库与检索源编辑。"
                      : "新增软件工作台覆盖主工作区，录入完成后可直接联动安装向导。"
                  }}
                </p>
              </div>
            </header>

            <div class="soft-workbench__body">

        <template v-if="railTab === SOURCE_TAB">
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
                    <el-button plain @click="addSourceConfig">
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
                    plain
                    :disabled="!createInstallHostId"
                    :loading="creatingPackage"
                    @click="submitCreatePackage(true)"
                  >
                    保存并安装
                  </el-button>
                  <el-button
                    type="primary"
                    :loading="creatingPackage"
                    @click="submitCreatePackage"
                  >
                    保存软件
                  </el-button>
                </div>
              </header>

              <el-form
                ref="createFormRef"
                :model="createForm"
                :rules="createFormRules"
                label-position="top"
                class="create-editor-form"
              >
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
                      plain
                      :loading="creatingPackageAiDraft"
                      @click="generateCreatePackageAiDraft"
                    >
                      AI 生成并回填表单
                    </el-button>
                  </div>
                </section>

                <section class="create-group create-group--accent">
                  <div class="create-group__title">
                    <div>
                      <h4>创建后安装到服务器</h4>
                      <p>新增完成后直接接入 pages/server 的安装向导，继续选择版本和引导参数。</p>
                    </div>
                    <el-tag size="small" effect="plain">Server Flow</el-tag>
                  </div>
                  <div class="create-install-panel">
                    <el-form-item label="目标服务器">
                      <el-select
                        v-model="createInstallHostId"
                        clearable
                        filterable
                        :loading="installContextLoading"
                        placeholder="选择兼容服务器"
                      >
                        <el-option
                          v-for="host in createCompatibleHosts"
                          :key="host.serverId"
                          :label="formatHostOptionLabel(host)"
                          :value="host.serverId"
                        />
                      </el-select>
                    </el-form-item>
                    <p class="create-install-panel__hint">
                      {{
                        createCompatibleHosts.length
                          ? `当前有 ${createCompatibleHosts.length} 台兼容服务器可直接联动安装`
                          : installContextLoading
                            ? "正在加载服务器列表..."
                            : "先补充操作系统和架构，可自动筛出可安装服务器"
                      }}
                    </p>
                  </div>
                </section>

                <section class="create-group">
                  <h4>基础信息</h4>
                  <div class="source-form-grid source-form-grid--row">
                    <el-form-item label="仓库" prop="softRepositoryId">
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
                    <el-form-item label="软件编码" prop="packageCode">
                      <el-input v-model="createForm.packageCode" placeholder="例如: mysql-community" />
                    </el-form-item>
                    <el-form-item label="软件名称" prop="packageName">
                      <el-input v-model="createForm.packageName" placeholder="例如: MySQL Community" />
                    </el-form-item>
                    <el-form-item label="软件分类" prop="packageCategory">
                      <el-input v-model="createForm.packageCategory" placeholder="例如: database" />
                    </el-form-item>
                    <el-form-item label="画像编码">
                      <el-input v-model="createForm.profileCode" placeholder="可选" />
                    </el-form-item>
                    <el-form-item label="操作系统" prop="osType">
                      <el-select v-model="createForm.osType" clearable placeholder="可选">
                        <el-option
                          v-for="option in osFilterOptions"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="架构" prop="architecture">
                      <el-select v-model="createForm.architecture" clearable placeholder="可选">
                        <el-option
                          v-for="option in architectureFilterOptions"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="图标地址" prop="iconUrl">
                      <el-input v-model="createForm.iconUrl" placeholder="可选" />
                    </el-form-item>
                    <el-form-item label="描述" class="create-form-span-2" prop="description">
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
                    <el-form-item label="版本编码" prop="versionCode">
                      <el-input v-model="createForm.versionCode" placeholder="例如: 8.4.3" />
                    </el-form-item>
                    <el-form-item label="版本名称">
                      <el-input v-model="createForm.versionName" placeholder="可选，默认等于版本编码" />
                    </el-form-item>
                    <el-form-item label="下载地址" class="create-form-span-2" prop="downloadUrlsText">
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
                    <el-form-item label="安装脚本" class="create-form-span-2" prop="installScript">
                      <el-input v-model="createForm.installScript" type="textarea" :rows="4" />
                    </el-form-item>
                    <el-form-item label="初始化脚本" class="create-form-span-2">
                      <el-input v-model="createForm.initScript" type="textarea" :rows="3" />
                    </el-form-item>
                    <el-form-item label="启动脚本" class="create-form-span-2" prop="startScript">
                      <el-input v-model="createForm.startScript" type="textarea" :rows="3" />
                    </el-form-item>
                    <el-form-item label="停止脚本" class="create-form-span-2" prop="stopScript">
                      <el-input v-model="createForm.stopScript" type="textarea" :rows="3" />
                    </el-form-item>
                    <el-form-item label="卸载脚本" class="create-form-span-2" prop="uninstallScript">
                      <el-input v-model="createForm.uninstallScript" type="textarea" :rows="3" />
                    </el-form-item>
                    <el-form-item
                      label="服务注册脚本"
                      class="create-form-span-2"
                      prop="serviceRegisterScript"
                    >
                      <el-input v-model="createForm.serviceRegisterScript" type="textarea" :rows="3" />
                    </el-form-item>
                    <el-form-item
                      label="服务卸载脚本"
                      class="create-form-span-2"
                      prop="serviceUnregisterScript"
                    >
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
                      <el-form-item label="服务编码" prop="serverServiceCode">
                        <el-input v-model="createForm.serverServiceCode" placeholder="例如: mysql-service" />
                      </el-form-item>
                      <el-form-item label="服务名称" prop="serverServiceName">
                        <el-input v-model="createForm.serverServiceName" placeholder="例如: MySQL Service" />
                      </el-form-item>
                      <el-form-item label="服务类型" prop="serverServiceType">
                        <el-input v-model="createForm.serverServiceType" placeholder="例如: SYSTEMD / WINDOWS_SERVICE" />
                      </el-form-item>
                      <el-form-item label="启动方式" prop="serverServiceStartMode">
                        <el-input v-model="createForm.serverServiceStartMode" placeholder="例如: AUTO / MANUAL" />
                      </el-form-item>
                      <el-form-item label="执行通道" prop="serverExecutionProvider">
                        <el-input v-model="createForm.serverExecutionProvider" placeholder="例如: LOCAL / SSH / WINRM" />
                      </el-form-item>
                    </template>
                  </div>
                </section>
              </el-form>
            </article>
          </section>
        </template>
            </div>
          </aside>
        </section>
      </template>

      <template #rail-footer>
        <div class="soft-rail-footer">
          <el-tooltip content="设置" placement="left">
            <button
              type="button"
              class="soft-rail-footer__action"
              :class="{ 'is-active': railTab === SOURCE_TAB }"
              @click="openSourceSettingsTab"
            >
              <el-icon><Setting /></el-icon>
            </button>
          </el-tooltip>
          <el-tooltip content="新增" placement="left">
            <button
              type="button"
              class="soft-rail-footer__action"
              :class="{ 'is-active': railTab === CREATE_TAB }"
              @click="openCreatePackageTab"
            >
              <el-icon><Plus /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </template>
    </ScLayout>

    <el-dialog
      v-model="softwareDetailVisible"
      width="920px"
      title="软件详情"
      draggable="t"
      destroy-on-close
    >
      <template v-if="currentSoftwareDetail">
        <section class="software-detail">
          <header class="software-detail__head">
            <div class="software-detail__identity">
              <div class="software-detail__icon">
                <img
                  v-if="currentSoftwareDetail.iconUrl"
                  :src="currentSoftwareDetail.iconUrl"
                  :alt="`${currentSoftwareDetail.name} 图标`"
                  loading="lazy"
                />
                <span v-else>{{ softwareAvatarText(currentSoftwareDetail.name) }}</span>
              </div>
              <div>
                <h3>{{ currentSoftwareDetail.name }}</h3>
                <p>{{ currentSoftwareDetail.code }}</p>
              </div>
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
            <el-tag  size="small" effect="light">
              {{
                currentSoftwareDetail.osTypes.map((value) => osLabel(value)).join(" / ") || "通用系统"
              }}
            </el-tag>
            <el-tag size="small" effect="light">
              {{
                currentSoftwareDetail.architectures
                  .map((value) => architectureLabel(value))
                  .join(" / ") || "通用架构"
              }}
            </el-tag>
          </div>

          <article class="software-detail__install">
            <header class="software-detail__install-head">
              <div>
                <small>INSTALL / SERVER</small>
                <h4>安装到服务器</h4>
                <p>这里直接复用 pages/server 的安装向导，先选软件包，再选兼容服务器。</p>
              </div>
              <el-tag size="small" effect="plain">Server Wizard</el-tag>
            </header>

            <div class="software-detail__install-grid">
              <el-form-item label="软件包">
                <el-select
                  v-model="detailInstallPackageId"
                  clearable
                  filterable
                  placeholder="选择一个软件包"
                >
                  <el-option
                    v-for="item in currentSoftwareVariants"
                    :key="item.softPackageId"
                    :label="`${item.packageName} · ${osLabel(item.osType)} / ${architectureLabel(item.architecture)}`"
                    :value="item.softPackageId"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="目标服务器">
                <el-select
                  v-model="detailInstallHostId"
                  clearable
                  filterable
                  :loading="installContextLoading"
                  placeholder="选择兼容服务器"
                >
                  <el-option
                    v-for="host in compatibleDetailHosts"
                    :key="host.serverId"
                    :label="formatHostOptionLabel(host)"
                    :value="host.serverId"
                  />
                </el-select>
              </el-form-item>
            </div>

            <div class="software-detail__install-actions">
              <span class="software-detail__install-hint">
                {{
                  compatibleDetailHosts.length
                    ? `当前有 ${compatibleDetailHosts.length} 台兼容服务器可用`
                    : installContextLoading
                      ? "正在加载服务器列表..."
                      : "当前没有与该软件包系统 / 架构兼容的服务器"
                }}
              </span>
              <el-button
                type="primary"
                :disabled="!detailInstallPackageId || !detailInstallHostId"
                @click="openDetailInstallWizard"
              >
                安装到服务器
              </el-button>
            </div>
          </article>

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

    <ServerInstallWizardDialog
      v-model="installVisible"
      :host="installHost"
      :step="installStep"
      :package-id="installPackageId"
      :package-options="installPackageOptions"
      :versions="installVersions"
      :guide-sections="installGuideSections"
      :guide-loading="installGuideLoading"
      :submitting="installSubmitting"
      :task="installTask"
      :form="installForm"
      :install-models="installModels"
      :selected-package-name="installSelectedPackageName"
      :selected-version-label="installSelectedVersionLabel"
      @update:step="installStep = $event"
      @update:package-id="handleInstallPackageChange"
      @next-step="goInstallVersionStep"
      @submit="submitInstallFromCatalog"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { House, Plus, Setting } from "@element-plus/icons-vue";
import ScLayout from "@repo/components/ScLayout";
import ServerInstallWizardDialog from "../../../server/src/components/ServerInstallWizardDialog.vue";
import type {
  GuideScope,
  GuideSection,
  ServerInstallTask,
} from "../../../server/src/components/server-types";
import { listServerHosts, type ServerHost } from "../../../server/src/api";
import {
  hostAddress,
  normalizeArch as normalizeServerArch,
  normalizeOs as normalizeServerOs,
} from "../../../server/src/utils/serverHost";
import {
  createSoftTarget,
  createSoftPackage,
  generateSoftPackageAiDraft,
  getSoftPackageDetail,
  getSoftVersionGuide,
  installSoftPackage,
  listSoftPackages,
  listSoftRepositories,
  listSoftRepositorySources,
  listSoftTargets,
  syncSoftRepository,
  updateSoftTarget,
  updateSoftRepositorySources,
} from "../api";
import type {
  SoftGuideField,
  SoftInstallRequest,
  SoftPackageAiDraftResponse,
  SoftPackage,
  SoftPackageCreateResult,
  SoftPackageCreateRequest,
  SoftPackageDetail,
  SoftPackageGuide,
  SoftPackageVersion,
  SoftRepository,
  SoftRepositorySource,
  SoftRepositorySourceSearchItem,
  SoftTarget,
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
  icon?: any;
  label?: string;
  name: string;
  title: string;
};

type SoftwareCard = {
  architectures: string[];
  category?: string;
  code: string;
  defaultPackageId: number | null;
  description?: string;
  iconUrl?: string;
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
const installContextLoading = ref(false);
const installContextLoaded = ref(false);
const installVisible = ref(false);
const installStep = ref(0);
const installHostId = ref<number | null>(null);
const installPackageId = ref<number | null>(null);
const installVersions = ref<SoftPackageVersion[]>([]);
const installGuide = ref<SoftPackageGuide | null>(null);
const installGuideLoading = ref(false);
const installSubmitting = ref(false);
const installTask = ref<ServerInstallTask | null>(null);
const detailInstallPackageId = ref<number | null>(null);
const detailInstallHostId = ref<number | null>(null);
const createInstallHostId = ref<number | null>(null);

const packages = ref<SoftPackage[]>([]);
const repositories = ref<SoftRepository[]>([]);
const sourceSearchResults = ref<SoftRepositorySourceSearchItem[]>([]);
const serverHosts = ref<ServerHost[]>([]);
const softTargets = ref<SoftTarget[]>([]);

const keyword = ref("");
const osFilter = ref("");
const architectureFilter = ref("");

const activeRepositoryId = ref<number | null>(null);
const sourceSearchKeyword = ref("");
const createPackageAiPrompt = ref("");
const createFormRef = ref<FormInstance>();

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
const softwareCodeReg = /^[a-z0-9][a-z0-9-_]{1,63}$/;
const versionCodeReg = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

const createFormRules: FormRules<typeof createForm> = {
  packageCode: [
    { required: true, message: "请填写软件编码", trigger: "blur" },
    {
      pattern: softwareCodeReg,
      message: "软件编码仅允许小写字母、数字、-、_，且必须以字母或数字开头",
      trigger: "blur",
    },
  ],
  packageName: [
    { required: true, message: "请填写软件名称", trigger: "blur" },
    { min: 2, max: 64, message: "软件名称长度需在 2 到 64 个字符之间", trigger: "blur" },
  ],
  packageCategory: [{ required: true, message: "请填写软件分类", trigger: "blur" }],
  osType: [{ required: true, message: "请选择操作系统", trigger: "change" }],
  architecture: [{ required: true, message: "请选择架构", trigger: "change" }],
  versionCode: [
    { required: true, message: "请填写版本编码", trigger: "blur" },
    {
      pattern: versionCodeReg,
      message: "版本编码仅允许字母、数字、点、短横线、下划线",
      trigger: "blur",
    },
  ],
  downloadUrlsText: [
    {
      validator: (_rule, value, callback) => {
        const urls = parseDownloadUrls(String(value || ""));
        if (!urls.length) {
          callback(new Error("请至少填写一个下载地址"));
          return;
        }
        const invalid = urls.find((item) => item.length < 3 || /\s/.test(item));
        if (invalid) {
          callback(new Error(`下载地址不合法: ${invalid}`));
          return;
        }
        callback();
      },
      trigger: ["blur", "change"],
    },
  ],
  installScript: [{ required: true, message: "请填写安装脚本", trigger: "blur" }],
  startScript: [{ required: true, message: "请填写启动脚本", trigger: "blur" }],
  stopScript: [{ required: true, message: "请填写停止脚本", trigger: "blur" }],
  uninstallScript: [{ required: true, message: "请填写卸载脚本", trigger: "blur" }],
  serviceRegisterScript: [
    {
      validator: (_rule, value, callback) => {
        if (createForm.integrateServerService && !normalizeText(value)) {
          callback(new Error("接入服务时必须填写服务注册脚本"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  serviceUnregisterScript: [
    {
      validator: (_rule, value, callback) => {
        if (createForm.integrateServerService && !normalizeText(value)) {
          callback(new Error("接入服务时必须填写服务卸载脚本"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  iconUrl: [
    {
      validator: (_rule, value, callback) => {
        const text = normalizeText(value);
        if (!text) {
          callback();
          return;
        }
        if (/^https?:\/\/\S+/i.test(text)) {
          callback();
          return;
        }
        callback(new Error("图标地址需为 http/https URL"));
      },
      trigger: "blur",
    },
  ],
  serverServiceCode: [
    {
      validator: (_rule, value, callback) => {
        if (createForm.integrateServerService && !normalizeText(value)) {
          callback(new Error("请填写服务编码"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  serverServiceName: [
    {
      validator: (_rule, value, callback) => {
        if (createForm.integrateServerService && !normalizeText(value)) {
          callback(new Error("请填写服务名称"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  serverServiceType: [
    {
      validator: (_rule, value, callback) => {
        if (createForm.integrateServerService && !normalizeText(value)) {
          callback(new Error("请填写服务类型"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  serverServiceStartMode: [
    {
      validator: (_rule, value, callback) => {
        if (createForm.integrateServerService && !normalizeText(value)) {
          callback(new Error("请填写启动方式"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  serverExecutionProvider: [
    {
      validator: (_rule, value, callback) => {
        if (createForm.integrateServerService && !normalizeText(value)) {
          callback(new Error("请填写执行通道"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
};
const installForm = reactive<SoftInstallRequest>({
  softPackageId: 0,
  softPackageVersionId: 0,
  softTargetId: 0,
  installationName: "",
  installPath: "",
  serviceName: "",
});
const installOptions = reactive<Record<string, unknown>>({});
const installServiceOptions = reactive<Record<string, unknown>>({});
const installConfigOptions = reactive<Record<string, unknown>>({});
const installModels: Record<GuideScope, Record<string, unknown>> = {
  install: installOptions,
  service: installServiceOptions,
  config: installConfigOptions,
};
const installVersionCache = new Map<number, SoftPackageVersion[]>();

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

const isWorkbenchOpen = computed(
  () =>
    (railTab.value === SOURCE_TAB && sourceTabVisible.value) ||
    (railTab.value === CREATE_TAB && createTabVisible.value),
);

const railTabs = computed<RailTabItem[]>(() => {
  const tabs: RailTabItem[] = [
    {
      icon: markRaw(House),
      name: HOME_TAB,
      title: "软件列表",
    },
  ];
  if (sourceTabVisible.value) {
    tabs.push({
      icon: markRaw(Setting),
      name: SOURCE_TAB,
      title: "下载源设置",
      closable: true,
    });
  }
  if (createTabVisible.value) {
    tabs.push({
      icon: markRaw(Plus),
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
        iconUrl: normalizeText(item.iconUrl) || undefined,
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
    if (!existing.iconUrl && normalizeText(item.iconUrl)) {
      existing.iconUrl = normalizeText(item.iconUrl) || undefined;
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

const detailInstallPackage = computed(
  () =>
    currentSoftwareVariants.value.find(
      (item) => toNumericId(item.softPackageId) === detailInstallPackageId.value,
    ) || null,
);

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

const installHost = computed(
  () =>
    serverHosts.value.find(
      (item) => toNumericId(item.serverId) === toNumericId(installHostId.value),
    ) || null,
);

const createPackageMatcher = computed(
  (): Partial<SoftPackage> => ({
    osType: createForm.osType,
    architecture: createForm.architecture,
  }),
);

const compatibleDetailHosts = computed(() =>
  detailInstallPackage.value
    ? serverHosts.value.filter((host) =>
        matchPackageServer(detailInstallPackage.value, host),
      )
    : [],
);

const createCompatibleHosts = computed(() =>
  serverHosts.value.filter((host) =>
    matchPackageServer(createPackageMatcher.value, host),
  ),
);

const compatibleInstallPackages = computed(() =>
  packages.value.filter(
    (item) =>
      toNumericId(item.softPackageId) !== null &&
      matchPackageServer(item, installHost.value),
  ),
);

const installPackageOptions = computed<Array<Record<string, unknown>>>(() =>
  compatibleInstallPackages.value.reduce<Array<Record<string, unknown>>>(
    (options, item) => {
      const packageId = toNumericId(item.softPackageId);
      if (!packageId) {
        return options;
      }
      options.push({
        label: item.packageName,
        value: packageId,
        packageCode: item.packageCode,
        packageCategory: item.packageCategory,
        description: item.description,
      });
      return options;
    },
    [],
  ),
);

const installSelectedPackage = computed(
  () =>
    compatibleInstallPackages.value.find(
      (item) => toNumericId(item.softPackageId) === toNumericId(installPackageId.value),
    ) || null,
);

const installSelectedPackageName = computed(
  () => installSelectedPackage.value?.packageName || "",
);

const installSelectedVersionLabel = computed(() => {
  const version = installVersions.value.find(
    (item) =>
      toNumericId(item.softPackageVersionId) ===
      toNumericId(installForm.softPackageVersionId),
  );
  return version
    ? `${version.versionName} (${version.versionCode})`
    : "未选择版本";
});

const installGuideSections = computed<GuideSection[]>(() => {
  if (!installGuide.value) {
    return [];
  }
  return [
    {
      key: "install",
      title: "基础安装",
      hint: "安装阶段参数会映射到脚本和配置模板。",
      scope: "install" as GuideScope,
      fields: installGuide.value.installFields || [],
    },
    {
      key: "service",
      title: "服务引导",
      hint: "服务注册、启动和状态检查相关参数。",
      scope: "service" as GuideScope,
      fields: installGuide.value.serviceFields || [],
    },
    {
      key: "config",
      title: "配置初始化",
      hint: "配置模板与初始化变量。",
      scope: "config" as GuideScope,
      fields: installGuide.value.configFields || [],
    },
  ].filter((section) => section.fields.length);
});

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
  } catch (error) {
    console.error(error);
    packages.value = [];
    repositories.value = [];
    ElMessage.error("加载软件首页数据失败");
  } finally {
    loading.value = false;
  }
};

const openSourceSettingsTab = async () => {
  sourceTabVisible.value = true;
  await nextTick();
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
  await nextTick();
  railTab.value = CREATE_TAB;
  void loadInstallContext();
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
  } catch (error) {
    console.error(error);
    sourceSearchResults.value = [];
    ElMessage.error("加载检索源失败");
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
  const normalizedRepositoryType = normalizeText(sourceEditor.repositoryType).toUpperCase();
  const normalizedRepositoryUrl = normalizeText(sourceEditor.repositoryUrl);
  const normalizedLocalDirectory = normalizeText(sourceEditor.localDirectory);
  if (requiresRepositoryUrl(normalizedRepositoryType) && !normalizedRepositoryUrl) {
    ElMessage.warning("当前仓库类型需要填写主地址");
    return;
  }
  if (requiresLocalDirectory(normalizedRepositoryType) && !normalizedLocalDirectory) {
    ElMessage.warning("当前仓库类型需要填写本地目录");
    return;
  }

  const normalizedSourceConfigs = sourceEditor.sourceConfigs.map((item) => ({
    sourceName: normalizeText(item.sourceName),
    sourceType: toSourceType(item.sourceType),
    sourceUrl: normalizeText(item.sourceUrl),
    localDirectory: normalizeText(item.localDirectory),
    enabled: item.enabled !== false,
    sourceConfig: normalizeText(item.sourceConfig),
  }));

  const invalidSource = normalizedSourceConfigs.find((item) => {
    if (item.enabled === false) {
      return false;
    }
    if (requiresRepositoryUrl(item.sourceType) && !item.sourceUrl) {
      return true;
    }
    if (requiresLocalDirectory(item.sourceType) && !item.localDirectory) {
      return true;
    }
    return false;
  });
  if (invalidSource) {
    ElMessage.warning("启用中的检索源必须填写完整地址或目录");
    return;
  }

  savingSources.value = true;
  try {
    await updateSoftRepositorySources(repositoryId, {
      repositoryUrl: normalizedRepositoryUrl,
      localDirectory: normalizedLocalDirectory,
      sourceConfigs: normalizedSourceConfigs,
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
  createInstallHostId.value = null;
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
  createFormRef.value?.clearValidate();
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

const submitCreatePackage = async (installAfterCreate = false) => {
  const isValid = await createFormRef.value
    ?.validate()
    .then(() => true)
    .catch(() => false);
  if (!isValid) {
    ElMessage.warning("请先修正表单校验错误后再保存");
    return;
  }

  if (installAfterCreate && !toNumericId(createInstallHostId.value)) {
    ElMessage.warning("请先选择一台兼容服务器");
    return;
  }
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
    const createdPackage = resolveCreatedPackage(result.data);
    const createdPackageId =
      toNumericId(createdPackage?.softPackageId) ||
      findPackageIdByKey(
        normalizeText(createdPackage?.softwareKey) ||
          normalizeText(createdPackage?.packageCode),
      );
    const createdKey =
      normalizeText(createdPackage?.softwareKey) ||
      normalizeText(createdPackage?.packageCode);
    if (installAfterCreate && createdPackageId && createInstallHostId.value) {
      createTabVisible.value = false;
      railTab.value = HOME_TAB;
      await openInstallWizardForPackage(createdPackageId, createInstallHostId.value);
    } else if (createdKey) {
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
  void loadInstallContext();
};

const openSoftwareDetailByPackageId = (packageId: number) => {
  const targetPackage = packages.value.find(
    (item) => Number(item.softPackageId || 0) === packageId,
  );
  const softwareKey = resolveSoftwareKey(targetPackage);
  if (!softwareKey) {
    ElMessage.warning("未找到可打开的软件详情");
    return;
  }
  activeSoftwareKey.value = softwareKey;
  softwareDetailVisible.value = true;
  railTab.value = HOME_TAB;
  void loadInstallContext();
};

const isSoftSinglePageMode = () =>
  typeof window !== "undefined" &&
  (window as Window & { __SOFT_SINGLE_PAGE__?: boolean }).__SOFT_SINGLE_PAGE__ === true;

const openDetailPage = (id?: number | null) => {
  const packageId =
    Number.isFinite(Number(id)) && Number(id) > 0
      ? Number(id)
      : Number(currentSoftwareVariants.value[0]?.softPackageId || 0);
  if (!packageId) {
    ElMessage.warning("未找到可打开的软件详情");
    return;
  }
  if (isSoftSinglePageMode()) {
    openSoftwareDetailByPackageId(packageId);
    return;
  }
  if (router.hasRoute("SoftDetail")) {
    softwareDetailVisible.value = false;
    router.push(`/soft/detail/${packageId}`);
    return;
  }
  openSoftwareDetailByPackageId(packageId);
};

const toNumericId = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const resolveCreatedPackage = (value?: SoftPackageCreateResult | null) =>
  value?.package || null;

const findPackageIdByKey = (softwareKey: string) =>
  toNumericId(
    packages.value.find((item) => resolveSoftwareKey(item) === softwareKey)?.softPackageId,
  );

const normalizeHostList = (value: unknown): ServerHost[] => {
  if (Array.isArray(value)) {
    return value as ServerHost[];
  }
  if (value && typeof value === "object") {
    const container = value as Record<string, unknown>;
    if (Array.isArray(container.records)) return container.records as ServerHost[];
    if (Array.isArray(container.list)) return container.list as ServerHost[];
    if (Array.isArray(container.items)) return container.items as ServerHost[];
    if (Array.isArray(container.data)) return container.data as ServerHost[];
  }
  return [];
};

const parseJsonObject = (value?: string | null) => {
  const text = normalizeText(value);
  if (!text) {
    return {} as Record<string, unknown>;
  }
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch (error) {
    console.warn("parseJsonObject failed", error);
    return {} as Record<string, unknown>;
  }
};

const loadInstallContext = async (force = false) => {
  if (installContextLoading.value) {
    return;
  }
  if (installContextLoaded.value && !force) {
    return;
  }
  installContextLoading.value = true;
  try {
    const [hostResult, targetResult] = await Promise.all([
      listServerHosts(),
      listSoftTargets(),
    ]);
    serverHosts.value = normalizeHostList(hostResult.data).filter(
      (item) => item.enabled !== false,
    );
    softTargets.value = Array.isArray(targetResult.data) ? targetResult.data : [];
    installContextLoaded.value = true;
  } catch (error) {
    console.error(error);
    serverHosts.value = [];
    softTargets.value = [];
    ElMessage.warning("安装联动上下文加载失败");
  } finally {
    installContextLoading.value = false;
  }
};

const matchPackageServer = (
  softPackage: Partial<SoftPackage> | null | undefined,
  server: ServerHost | null | undefined,
) => {
  if (!softPackage || !server) {
    return false;
  }
  const packageOs = normalizeServerOs(softPackage.osType);
  const serverOs = normalizeServerOs(server.osType);
  if (packageOs && serverOs && packageOs !== serverOs) {
    return false;
  }
  const packageArch = normalizeServerArch(softPackage.architecture);
  const serverArch = normalizeServerArch(server.architecture);
  if (packageArch && serverArch && packageArch !== serverArch) {
    return false;
  }
  return true;
};

const matchesHostWithSoftTarget = (host: ServerHost, target: SoftTarget) => {
  if (!host.serverId) return false;
  const metadata = parseJsonObject(target.metadataJson);
  const metadataServerId = Number(
    metadata.serverId ?? metadata.monitorServerId ?? metadata.hostId ?? 0,
  );
  if (metadataServerId && metadataServerId === host.serverId) return true;
  const metadataServerCode = String(metadata.serverCode || "");
  if (
    metadataServerCode &&
    host.serverCode &&
    metadataServerCode === host.serverCode
  ) {
    return true;
  }
  if (target.targetCode === `server-${host.serverId}`) return true;
  const sameHost =
    normalizeText(target.host) &&
    normalizeText(host.host) &&
    normalizeText(target.host) === normalizeText(host.host);
  const sameUser =
    normalizeText(target.username) &&
    normalizeText(host.username) &&
    normalizeText(target.username) === normalizeText(host.username);
  return Boolean(sameHost && (sameUser || host.serverType === "LOCAL"));
};

const findSoftTargetForHost = (host: ServerHost) =>
  softTargets.value.find((target) => matchesHostWithSoftTarget(host, target));

const buildSoftTargetPayload = (host: ServerHost): SoftTarget => ({
  targetName: host.serverName,
  targetCode: `server-${host.serverId}`,
  targetType: host.serverType,
  osType: host.osType,
  architecture: host.architecture,
  host: host.serverType === "LOCAL" ? "127.0.0.1" : host.host,
  port: host.port,
  username: host.username,
  password: host.password,
  privateKey: host.privateKey,
  baseDirectory: host.baseDirectory,
  enabled: host.enabled,
  description: host.description,
  metadataJson: JSON.stringify({
    source: "server-host",
    serverId: host.serverId,
    serverCode: host.serverCode,
  }),
});

const ensureSoftTargetForHost = async (host: ServerHost) => {
  const existing = findSoftTargetForHost(host);
  const payload = buildSoftTargetPayload(host);
  if (existing?.softTargetId) {
    const result = await updateSoftTarget(existing.softTargetId, {
      ...payload,
      softTargetId: existing.softTargetId,
    });
    const saved = result.data;
    if (saved?.softTargetId) {
      softTargets.value = softTargets.value.map((item) =>
        item.softTargetId === saved.softTargetId ? saved : item,
      );
      return saved.softTargetId;
    }
  }
  const result = await createSoftTarget(payload);
  const saved = result.data;
  if (!saved?.softTargetId) {
    throw new Error("创建软目标失败");
  }
  softTargets.value = [saved, ...softTargets.value];
  return saved.softTargetId;
};

const clearInstallModels = () => {
  Object.keys(installOptions).forEach((key) => delete installOptions[key]);
  Object.keys(installServiceOptions).forEach((key) => delete installServiceOptions[key]);
  Object.keys(installConfigOptions).forEach((key) => delete installConfigOptions[key]);
};

const isInstallBooleanField = (field: SoftGuideField) =>
  ["switch", "boolean", "checkbox"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const applyInstallFieldDefaults = (
  fields: SoftGuideField[] | undefined,
  model: Record<string, unknown>,
) => {
  Object.keys(model).forEach((key) => delete model[key]);
  for (const field of fields || []) {
    if (
      field.defaultValue !== undefined &&
      field.defaultValue !== null &&
      field.defaultValue !== ""
    ) {
      model[field.fieldKey] = field.defaultValue;
      continue;
    }
    if (isInstallBooleanField(field)) {
      model[field.fieldKey] = false;
    }
  }
};

const loadInstallPackageVersions = async (softPackageId: number, force = false) => {
  const cached = installVersionCache.get(softPackageId);
  if (cached && !force) {
    return cached;
  }
  const detailResult = await getSoftPackageDetail(softPackageId);
  const versions = (detailResult.data as SoftPackageDetail | undefined)?.versions || [];
  installVersionCache.set(softPackageId, versions);
  return versions;
};

const reloadInstallGuide = async () => {
  const packageId =
    toNumericId(installSelectedPackage.value?.softPackageId) ||
    toNumericId(installPackageId.value);
  const versionId = toNumericId(installForm.softPackageVersionId);
  if (!packageId || !versionId) {
    installGuide.value = null;
    return;
  }
  installGuideLoading.value = true;
  try {
    const targetId = installHost.value
      ? await ensureSoftTargetForHost(installHost.value)
      : undefined;
    const result = await getSoftVersionGuide(packageId, versionId, { targetId });
    installGuide.value = result.data || null;
    applyInstallFieldDefaults(installGuide.value?.installFields, installOptions);
    applyInstallFieldDefaults(installGuide.value?.serviceFields, installServiceOptions);
    applyInstallFieldDefaults(installGuide.value?.configFields, installConfigOptions);
  } finally {
    installGuideLoading.value = false;
  }
};

const resetInstallDialog = () => {
  installStep.value = 0;
  installPackageId.value = null;
  installVersions.value = [];
  installGuide.value = null;
  installTask.value = null;
  installForm.softPackageId = 0;
  installForm.softPackageVersionId = 0;
  installForm.softTargetId = 0;
  installForm.installationName = "";
  installForm.installPath = "";
  installForm.serviceName = "";
  clearInstallModels();
};

const handleInstallPackageChange = (value: number | null) => {
  installPackageId.value = toNumericId(value);
  installStep.value = 0;
  installVersions.value = [];
  installGuide.value = null;
  installTask.value = null;
  installForm.softPackageId = 0;
  installForm.softPackageVersionId = 0;
  clearInstallModels();
};

const formatHostOptionLabel = (host: ServerHost) =>
  `${host.serverName} · ${hostAddress(host)} · ${osLabel(host.osType)} / ${architectureLabel(
    host.architecture,
  )}`;

const openInstallWizardForPackage = async (
  packageId: number,
  hostId: number,
  immediateStep = true,
) => {
  await loadInstallContext();
  const host = serverHosts.value.find(
    (item) => toNumericId(item.serverId) === toNumericId(hostId),
  );
  const softPackage = packages.value.find(
    (item) => toNumericId(item.softPackageId) === toNumericId(packageId),
  );
  if (!host || !softPackage) {
    ElMessage.warning("安装上下文加载失败，请重新选择");
    return;
  }
  installHostId.value = toNumericId(host.serverId);
  resetInstallDialog();
  installVisible.value = true;
  installPackageId.value = toNumericId(packageId);
  if (immediateStep) {
    await goInstallVersionStep();
  }
};

const openDetailInstallWizard = async () => {
  const packageId = toNumericId(detailInstallPackageId.value);
  const hostId = toNumericId(detailInstallHostId.value);
  if (!packageId || !hostId) {
    ElMessage.warning("请先选择软件包和服务器");
    return;
  }
  softwareDetailVisible.value = false;
  await openInstallWizardForPackage(packageId, hostId);
};

const goInstallVersionStep = async () => {
  const softPackageId = toNumericId(installPackageId.value);
  const selectedPackage =
    installSelectedPackage.value ||
    packages.value.find(
      (item) => toNumericId(item.softPackageId) === softPackageId,
    ) ||
    null;
  if (!softPackageId || !selectedPackage) {
    ElMessage.warning("请先选择一个可安装的软件包");
    return;
  }
  installForm.softPackageId = softPackageId;
  installForm.installationName =
    selectedPackage.packageName || selectedPackage.packageCode;
  installForm.serviceName =
    selectedPackage.packageCode || selectedPackage.packageName;
  try {
    installVersions.value = await loadInstallPackageVersions(softPackageId);
    installForm.softPackageVersionId =
      toNumericId(installVersions.value[0]?.softPackageVersionId) || 0;
    await reloadInstallGuide();
    installStep.value = 1;
  } catch (error) {
    console.error(error);
    ElMessage.error("加载安装版本与引导失败");
  }
};

const submitInstallFromCatalog = async () => {
  if (
    !installHost.value ||
    !installSelectedPackage.value ||
    !toNumericId(installForm.softPackageVersionId)
  ) {
    ElMessage.warning("请先选择软件和版本");
    return;
  }
  installSubmitting.value = true;
  try {
    const softTargetId = await ensureSoftTargetForHost(installHost.value);
    const packageId = toNumericId(installSelectedPackage.value.softPackageId) || 0;
    const result = await installSoftPackage({
      ...installForm,
      softPackageId: packageId,
      softPackageVersionId: toNumericId(installForm.softPackageVersionId) || 0,
      softTargetId,
      installOptions: { ...installOptions },
      serviceOptions: { ...installServiceOptions },
      configOptions: { ...installConfigOptions },
    });
    const ticket = result.data;
    installTask.value = {
      operationId: ticket.operationId,
      installationId: ticket.installationId,
      status: ticket.operationStatus,
      message: `安装任务已提交到 ${installHost.value.serverName}`,
    };
    installStep.value = 2;
    ElMessage.success("安装任务已提交");
    installVisible.value = false;
    if (
      packageId &&
      ticket.installationId &&
      !isSoftSinglePageMode() &&
      router.hasRoute("SoftDetail")
    ) {
      router.push(`/soft/detail/${packageId}?installationId=${ticket.installationId}`);
    } else if (packageId) {
      openSoftwareDetailByPackageId(packageId);
    }
  } finally {
    installSubmitting.value = false;
  }
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

watch(
  currentSoftwareVariants,
  (variants) => {
    const variantIds = new Set(
      variants
        .map((item) => toNumericId(item.softPackageId))
        .filter((item): item is number => item !== null),
    );
    if (!variantIds.has(toNumericId(detailInstallPackageId.value) || -1)) {
      detailInstallPackageId.value = toNumericId(variants[0]?.softPackageId);
    }
  },
  { immediate: true },
);

watch(
  compatibleDetailHosts,
  (hosts) => {
    const current = toNumericId(detailInstallHostId.value);
    if (!hosts.some((item) => toNumericId(item.serverId) === current)) {
      detailInstallHostId.value = toNumericId(hosts[0]?.serverId);
    }
  },
  { immediate: true },
);

watch(
  createCompatibleHosts,
  (hosts) => {
    const current = toNumericId(createInstallHostId.value);
    if (!hosts.some((item) => toNumericId(item.serverId) === current)) {
      createInstallHostId.value = toNumericId(hosts[0]?.serverId);
    }
  },
  { immediate: true },
);

watch(
  () => createForm.integrateServerService,
  () => {
    createFormRef.value?.validateField([
      "serverServiceCode",
      "serverServiceName",
      "serverServiceType",
      "serverServiceStartMode",
      "serverExecutionProvider",
      "serviceRegisterScript",
      "serviceUnregisterScript",
    ]);
  },
);

watch(
  () => installForm.softPackageVersionId,
  (value, previous) => {
    if (
      installVisible.value &&
      installStep.value === 1 &&
      toNumericId(value) &&
      value !== previous
    ) {
      void reloadInstallGuide();
    }
  },
);

function normalizeText(value?: string | null) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function softwareAvatarText(name?: string | null) {
  const text = normalizeText(name);
  if (!text) {
    return "S";
  }
  return text.slice(0, 1).toUpperCase();
}

function normalizeArray(value?: string | null) {
  return (
  normalizeText(value)
    .split(/[\s,|/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
  );
}

function unique(value: string[]) {
  return [...new Set(value)];
}

function resolveSoftwareKey(item?: SoftPackage | null) {
  const fromMetadata = normalizeText(item?.softwareKey);
  if (fromMetadata) {
    return fromMetadata;
  }
  return normalizeText(item?.packageCode);
}

function toSourceType(value?: string | null): SourceType {
  const normalized = normalizeText(value).toUpperCase();
  const hit = sourceTypeOptions.find((item) => item.value === normalized);
  return hit ? hit.value : "HTTP_JSON";
}

function requiresRepositoryUrl(type?: string | null) {
  const normalized = normalizeText(type).toUpperCase();
  return ["HTTP_JSON", "HTTP_DIR", "RPM_REPO", "MIRROR_REPO"].includes(normalized);
}

function requiresLocalDirectory(type?: string | null) {
  return normalizeText(type).toUpperCase() === "LOCAL_DIR";
}

function osLabel(value?: string | null) {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return "通用";
  if (normalized.startsWith("WIN")) return "Windows";
  if (normalized.startsWith("LINUX")) return "Linux";
  if (normalized.startsWith("MAC")) return "MacOS";
  return normalized;
}

function architectureLabel(value?: string | null) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return "通用";
  if (normalized === "amd64" || normalized === "x86_64") return "amd64";
  if (normalized === "arm64" || normalized === "aarch64") return "arm64";
  return normalized;
}

function repositoryTypeLabel(value?: string | null) {
  return (
    sourceTypeOptions.find((item) => item.value === normalizeText(value).toUpperCase())
      ?.label || normalizeText(value) || "MANUAL"
  );
}

onMounted(loadHomeData);
</script>

<style scoped lang="scss">
.soft-home-page {
  --soft-panel-border: rgba(148, 163, 184, 0.18);
  --soft-panel-border-strong: rgba(148, 163, 184, 0.36);
  --soft-surface: rgba(255, 255, 255, 0.9);
  --soft-surface-strong: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98),
    rgba(248, 250, 252, 0.96)
  );
  --soft-workbench-surface:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 34%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.12), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  --soft-hero-surface:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 24%),
    linear-gradient(135deg, #ffffff, #eef6ff);
  --soft-text-primary: #0f172a;
  --soft-text-regular: #475569;
  --soft-text-muted: #64748b;
  --soft-accent-text: #0f766e;
  --soft-chip-bg: rgba(15, 23, 42, 0.06);
  --soft-chip-text: #334155;
  --soft-shadow: 0 14px 32px rgba(15, 23, 42, 0.08);
  --soft-shadow-card: 0 12px 26px rgba(15, 23, 42, 0.07);
  --soft-shadow-workbench: 0 24px 60px rgba(15, 23, 42, 0.08);
  --soft-accent-border: rgba(14, 165, 233, 0.38);
  --soft-accent-bg:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 32%),
    rgba(240, 253, 250, 0.9);
  --soft-accent-border-strong: rgba(16, 185, 129, 0.24);
  --soft-accent-dashed: rgba(16, 185, 129, 0.28);
  --soft-accent-plain: rgba(255, 255, 255, 0.74);
  height: 100%;
  min-height: 0;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}

:global(html.dark .soft-home-page),
:global(html[data-theme="dark"] .soft-home-page) {
  --soft-panel-border: rgba(71, 85, 105, 0.38);
  --soft-panel-border-strong: rgba(100, 116, 139, 0.46);
  --soft-surface: rgba(15, 23, 42, 0.84);
  --soft-surface-strong: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.96),
    rgba(15, 23, 42, 0.88)
  );
  --soft-workbench-surface:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 34%),
    radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.16), transparent 30%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.92));
  --soft-hero-surface:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.12), transparent 24%),
    linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.86));
  --soft-text-primary: #e2e8f0;
  --soft-text-regular: #cbd5e1;
  --soft-text-muted: #94a3b8;
  --soft-accent-text: #5eead4;
  --soft-chip-bg: rgba(148, 163, 184, 0.14);
  --soft-chip-text: #cbd5e1;
  --soft-shadow: 0 18px 40px rgba(2, 6, 23, 0.36);
  --soft-shadow-card: 0 16px 34px rgba(2, 6, 23, 0.28);
  --soft-shadow-workbench: 0 24px 60px rgba(2, 6, 23, 0.42);
  --soft-accent-bg:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.16), transparent 32%),
    rgba(15, 23, 42, 0.88);
  --soft-accent-border-strong: rgba(45, 212, 191, 0.3);
  --soft-accent-dashed: rgba(45, 212, 191, 0.34);
  --soft-accent-plain: rgba(15, 23, 42, 0.72);
}

:global(html[data-skin="future-tech"] .soft-home-page),
:global(html.theme-future-tech .soft-home-page) {
  --soft-panel-border: rgba(102, 248, 255, 0.24);
  --soft-panel-border-strong: rgba(102, 248, 255, 0.34);
  --soft-surface: linear-gradient(
    180deg,
    rgba(5, 10, 31, 0.92),
    rgba(10, 26, 58, 0.88)
  );
  --soft-surface-strong: linear-gradient(
    180deg,
    rgba(5, 10, 31, 0.98),
    rgba(10, 26, 58, 0.92)
  );
  --soft-workbench-surface:
    radial-gradient(circle at top left, rgba(102, 248, 255, 0.18), transparent 34%),
    radial-gradient(circle at bottom right, rgba(46, 204, 255, 0.16), transparent 30%),
    linear-gradient(180deg, rgba(5, 10, 31, 0.98), rgba(10, 26, 58, 0.92));
  --soft-hero-surface:
    radial-gradient(circle at top right, rgba(102, 248, 255, 0.14), transparent 24%),
    linear-gradient(135deg, rgba(8, 21, 48, 0.98), rgba(5, 10, 31, 0.9));
  --soft-text-primary: #e0fbff;
  --soft-text-regular: rgba(210, 244, 255, 0.88);
  --soft-text-muted: rgba(162, 222, 238, 0.74);
  --soft-accent-text: #66f8ff;
  --soft-chip-bg: rgba(102, 248, 255, 0.12);
  --soft-chip-text: #d8fbff;
  --soft-shadow: 0 18px 40px rgba(2, 8, 23, 0.42);
  --soft-shadow-card: 0 16px 34px rgba(2, 8, 23, 0.34);
  --soft-shadow-workbench: 0 24px 60px rgba(2, 8, 23, 0.5);
  --soft-accent-border: rgba(102, 248, 255, 0.34);
  --soft-accent-bg:
    radial-gradient(circle at top right, rgba(102, 248, 255, 0.16), transparent 32%),
    rgba(8, 21, 48, 0.9);
  --soft-accent-border-strong: rgba(102, 248, 255, 0.26);
  --soft-accent-dashed: rgba(102, 248, 255, 0.34);
  --soft-accent-plain: rgba(8, 21, 48, 0.8);
}

.soft-home-layout {
  height: 100%;
  min-height: 0;
}

.soft-stage {
  position: relative;
  height: 100%;
  min-height: 0;
  min-width: 0;
}

.soft-stage__workbench {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: 14px;
  border-radius: 28px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-workbench-surface);
  box-shadow: var(--soft-shadow-workbench);
}

.soft-stage__content {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: auto;
}

.soft-stage__content.is-workbench-open {
  pointer-events: none;
  opacity: 0.14;
  filter: saturate(0.75);
}

.soft-workbench__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  padding: 4px 6px 14px;
  border-bottom: 1px solid var(--soft-panel-border);
}

.soft-workbench__header small {
  color: var(--soft-accent-text);
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 700;
}

.soft-workbench__header h3 {
  margin: 6px 0 8px;
  font-size: 22px;
  color: var(--soft-text-primary);
}

.soft-workbench__header p {
  margin: 0;
  color: var(--soft-text-regular);
  line-height: 1.6;
}

.soft-workbench__body {
  display: grid;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.soft-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-hero-surface);
  box-shadow: var(--soft-shadow);
}

.soft-hero small {
  color: var(--soft-text-muted);
  letter-spacing: 0.08em;
}

.soft-hero h1 {
  margin: 4px 0 8px;
  color: var(--soft-text-primary);
  font-size: 28px;
}

.soft-hero p {
  margin: 0;
  color: var(--soft-text-regular);
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
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.soft-summary__card small {
  color: var(--soft-text-muted);
}

.soft-summary__card strong {
  color: var(--soft-text-primary);
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.software-card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface-strong);
  box-shadow: var(--soft-shadow-card);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.software-card:hover {
  transform: translateY(-2px);
  border-color: var(--soft-accent-border);
  box-shadow: 0 20px 38px rgba(15, 23, 42, 0.12);
}

.software-card__header,
.software-card__actions {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.software-card__identity {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.software-card__icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 1px solid var(--soft-panel-border);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(16, 185, 129, 0.14));
  color: var(--soft-text-primary);
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.software-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.software-card__header strong {
  color: var(--soft-text-primary);
  font-size: 15px;
}

.software-card__header p,
.software-card__desc {
  margin: 0;
  color: var(--soft-text-muted);
}

.software-card__header p {
  font-size: 12px;
}

.software-card__desc {
  min-height: 38px;
  line-height: 1.55;
  font-size: 12px;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.software-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.software-card__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--soft-chip-bg);
  color: var(--soft-chip-text);
  font-size: 11px;
}

.source-panel {
  margin-top: 16px;
  display: grid;
  gap: 14px;
}

.create-panel {
  margin-top: 0;
}

.create-editor-form {
  display: grid;
  gap: 14px;
}

.create-group {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.create-group--accent {
  border-color: var(--soft-accent-border-strong);
  background: var(--soft-accent-bg);
}

.create-group h4 {
  margin: 0;
  color: var(--soft-text-primary);
  font-size: 15px;
}

.create-group__title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.create-group__title p {
  margin: 6px 0 0;
  color: var(--soft-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.create-install-panel {
  display: grid;
  gap: 12px;
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed var(--soft-accent-dashed);
  background: var(--soft-accent-plain);
}

.create-install-panel__hint {
  margin: 0;
  color: var(--soft-text-regular);
  font-size: 13px;
  line-height: 1.6;
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
  color: var(--soft-text-muted);
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
  padding: 14px;
  border-radius: 20px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.source-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.source-form-grid :deep(.el-form-item) {
  margin-bottom: 0;
  width: 100%;
}

.source-form-grid :deep(.el-input),
.source-form-grid :deep(.el-select),
.source-form-grid :deep(.el-select__wrapper),
.source-form-grid :deep(.el-textarea) {
  width: 100%;
}

.source-config-list {
  display: grid;
  gap: 10px;
}

.source-config-item {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  border: 1px dashed var(--soft-panel-border-strong);
  background: var(--soft-surface);
}

.source-config-item__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.source-form-grid--row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.source-search-result {
  margin-top: 2px;
}

.soft-rail-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.soft-rail-footer__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  min-width: 48px;
  height: 48px;
  margin: 0;
  padding: 0;
  flex: 0 0 48px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  box-shadow: none;
  color: #5f7686;
  cursor: pointer;
  appearance: none;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.soft-rail-footer__action + .soft-rail-footer__action {
  margin-left: 0;
}

.soft-rail-footer__action:hover {
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
}

.soft-rail-footer__action.is-active {
  background: rgba(15, 23, 42, 0.1);
  color: #0f172a;
}

.soft-rail-footer__action:focus-visible {
  outline: none;
}

.soft-rail-footer__action :deep(.el-icon) {
  font-size: 18px;
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

.software-detail__identity {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.software-detail__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  overflow: hidden;
  display: grid;
  place-items: center;
  border: 1px solid var(--soft-panel-border);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(16, 185, 129, 0.15));
  color: var(--soft-text-primary);
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
}

.software-detail__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.software-detail__actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.software-detail__head h3,
.software-detail__head p {
  margin: 0;
}

.software-detail__head p,
.software-detail__desc {
  color: var(--soft-text-muted);
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
  background: var(--soft-chip-bg);
  color: var(--soft-chip-text);
  font-size: 12px;
}

.software-detail__install {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.software-detail__install-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.software-detail__install-head small {
  color: var(--soft-accent-text);
  letter-spacing: 0.12em;
  font-weight: 700;
}

.software-detail__install-head h4 {
  margin: 6px 0;
  color: var(--soft-text-primary);
  font-size: 18px;
}

.software-detail__install-head p {
  margin: 0;
  color: var(--soft-text-muted);
}

.software-detail__install-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.software-detail__install-grid :deep(.el-form-item) {
  margin-bottom: 0;
}

.software-detail__install-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.software-detail__install-hint {
  color: var(--soft-text-regular);
  font-size: 13px;
  line-height: 1.6;
}

@media (max-width: 1800px) {
  .software-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 1500px) {
  .software-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1300px) {
  .software-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .source-panel__grid {
    grid-template-columns: 1fr;
  }

  .source-form-grid,
  .source-form-grid--row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .soft-stage__workbench {
    border-radius: 22px;
  }
}

@media (max-width: 900px) {
  .soft-summary,
  .soft-toolbar,
  .software-grid,
  .source-panel__toolbar,
  .source-form-grid,
  .source-form-grid--row,
  .software-detail__install-grid {
    grid-template-columns: 1fr;
  }

  .soft-hero,
  .software-card__actions,
  .source-panel__header,
  .source-card__header-row,
  .software-detail__install-actions,
  .create-group__title {
    display: grid;
  }

  .soft-hero__actions {
    justify-content: flex-start;
  }
}
</style>
