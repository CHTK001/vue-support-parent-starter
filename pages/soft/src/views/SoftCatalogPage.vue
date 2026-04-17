<template>
  <section class="soft-home-page">
    <ScLayout
      v-model="railTab"
      class="soft-home-layout"
      rail-close-button-mode="hover"
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
                  <ScButton circle :loading="loading" @click="loadHomeData">
                    <IconifyIconOnline icon="ri:refresh-line" />
                  </ScButton>
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
              <ScSelect v-model="osFilter" clearable placeholder="按操作系统筛选">
                <ScOption label="全部系统" value="" />
                <ScOption
                  v-for="option in osFilterOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ScSelect>
              <ScSelect v-model="architectureFilter" clearable placeholder="按架构筛选">
                <ScOption label="全部架构" value="" />
                <ScOption
                  v-for="option in architectureFilterOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ScSelect>
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
              </article>
            </div>
            <el-empty v-else description="没有匹配的软件" />
          </div>

          <aside v-if="isWorkbenchOpen" class="soft-stage__workbench">
            <div class="soft-workbench__body">

        <template v-if="railTab === SOURCE_TAB">
          <section class="source-panel">
            <div class="source-panel__toolbar source-panel__toolbar--compact">
              <div class="source-panel__context">
                <small>SOURCE DIRECTORY</small>
                <strong>下载源目录</strong>
                <p>
                  默认展示全部仓库，共 {{ repositories.length }} 个仓库；每个仓库都可独立维护下载源。
                </p>
              </div>
            </div>

            <div v-if="repositories.length" class="source-repository-grid">
              <article
                v-for="repository in repositories"
                :key="repository.softRepositoryId"
                class="source-repository-card"
              >
                <header class="source-card__header-row">
                  <div>
                    <strong>{{ repository.repositoryName || repository.repositoryCode }}</strong>
                    <small>
                      {{ repository.repositoryCode }} · {{ repositoryTypeLabel(repository.repositoryType) }}
                    </small>
                  </div>
                  <div class="source-panel__actions">
                    <ScButton
                      circle
                      type="primary"
                      :disabled="!toNumericId(repository.softRepositoryId)"
                      @click="openSourceDraftDialog(undefined, repository.softRepositoryId)"
                    >
                      <IconifyIconOnline icon="ri:add-line" />
                    </ScButton>
                  </div>
                </header>

                <div v-if="repositorySourceItems(repository).length" class="source-directory">
                  <article
                    v-for="(item, index) in repositorySourceItems(repository)"
                    :key="item.draftId"
                    class="source-entry"
                  >
                    <div class="source-entry__head">
                      <div>
                        <strong>{{ item.sourceName || `源 ${index + 1}` }}</strong>
                        <p>
                          {{ sourceKindLabel(item.sourceKind) }}
                          <span>·</span>
                          {{ repositoryTypeLabel(item.sourceType) }}
                        </p>
                      </div>
                      <div class="source-entry__badges">
                        <el-tag size="small" effect="light">
                          {{ item.sourceType }}
                        </el-tag>
                        <el-tag
                          size="small"
                          effect="light"
                          :type="item.enabled === false ? 'info' : 'success'"
                        >
                          {{ item.enabled === false ? "停用" : "启用" }}
                        </el-tag>
                      </div>
                    </div>

                    <div class="source-entry__grid">
                      <div class="source-entry__field">
                        <label>地址 / 目录</label>
                        <code>{{ describeSourceAddress(item) }}</code>
                      </div>
                      <div class="source-entry__field">
                        <label>来源信息</label>
                        <span>{{ item.sourceConfig || "未填写来源说明" }}</span>
                      </div>
                    </div>

                    <div class="source-entry__actions">
                      <ScButton plain @click="editSourceConfig(repository, item)">
                        编辑
                      </ScButton>
                      <ScButton
                        plain
                        type="danger"
                        :loading="deletingSourceId === item.softRepositorySourceId"
                        @click="removeSourceConfig(repository, item, index)"
                      >
                        删除
                      </ScButton>
                    </div>
                  </article>
                </div>
                <el-empty v-else description="当前仓库还没有下载源，点击右上角新增" />
              </article>
            </div>
            <el-empty v-else description="暂无仓库数据" />
          </section>
        </template>

        <template v-else-if="railTab === CREATE_TAB">
          <section class="create-panel">
            <article class="source-card">
              <header class="source-card__header-row">
                <div>
                  <strong>软件管理</strong>
                  <small>使用表格统一管理软件主档，支持增删查改。</small>
                </div>
                <div class="source-panel__actions">
                  <el-input
                    v-model="manageKeyword"
                    clearable
                    class="software-manage-search"
                    placeholder="搜索名称、编码、分类"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:search-line" />
                    </template>
                  </el-input>
                  <ScButton type="primary" @click="openCreatePackageWizard">
                    新增软件
                  </ScButton>
                </div>
              </header>

              <ScTable v-if="managedPackages.length" :data="managedPackages" border stripe style="width: 100%">
                <ScTableColumn label="软件名称" min-width="200" show-overflow-tooltip prop="packageName" />
                <ScTableColumn label="软件编码" min-width="180" show-overflow-tooltip prop="packageCode" />
                <ScTableColumn label="分类" min-width="140" show-overflow-tooltip prop="packageCategory" />
                <ScTableColumn label="系统 / 架构" min-width="180">
                  <template #default="{ row }">
                    {{ osLabel(row.osType) }} / {{ architectureLabel(row.architecture) }}
                  </template>
                </ScTableColumn>
                <ScTableColumn label="操作" width="260">
                  <template #default="{ row }">
                    <ScButton link type="primary" @click="openPackageEditor(row)">编辑</ScButton>
                    <ScButton link @click="openDetailPage(row.softPackageId)">详情</ScButton>
                    <ScButton
                      link
                      type="danger"
                      :loading="deletingPackageId === toNumericId(row.softPackageId)"
                      @click="removePackage(row)"
                    >
                      删除
                    </ScButton>
                  </template>
                </ScTableColumn>
              </ScTable>
              <el-empty v-else description="暂无软件主档，点击“新增软件”创建" />
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
          <el-tooltip content="软件管理" placement="left">
            <button
              type="button"
              class="soft-rail-footer__action"
              :class="{ 'is-active': railTab === CREATE_TAB }"
              @click="openCreatePackageTab"
            >
              <el-icon><Grid /></el-icon>
            </button>
          </el-tooltip>
        </div>
      </template>
    </ScLayout>

    <ScDialog
      v-model="packageSearchVisible"
      width="1120px"
      :title="packageSearchMode === 'browse' ? '检索源软件搜索' : '跨仓库搜索软件'"
      destroy-on-close
     layout="simple">
      <section class="source-panel">
        <div class="source-panel__toolbar">
          <el-input
            v-model="packageSearchKeyword"
            clearable
            placeholder="输入软件编码、名称或关键词"
            @keyup.enter="performRepositoryPackageSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          <ScButton
            type="primary"
            :loading="packageSearchLoading"
            @click="performRepositoryPackageSearch"
          >
            搜索
          </ScButton>
        </div>

        <el-table v-loading="packageSearchLoading" :data="packageSearchRows" border>
          <el-table-column prop="repositoryName" label="仓库" min-width="160" />
          <el-table-column prop="packageName" label="软件名称" min-width="180" />
          <el-table-column prop="packageCode" label="软件编码" min-width="160" />
          <el-table-column label="版本" min-width="220">
            <template #default="{ row }">
              <div class="package-search-row__version">
                <strong>{{ row.versionName || row.versionCode || "-" }}</strong>
                <span>
                  {{ osLabel(row.osType) }} / {{ architectureLabel(row.architecture) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="下载地址" min-width="280">
            <template #default="{ row }">
              <div class="package-search-row__download">
                <code>{{ packageSearchDownloadLabel(row) }}</code>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="来源信息" min-width="220">
            <template #default="{ row }">
              <div class="package-search-row__source">
                <strong>{{ row.repositorySourceName || sourceKindLabel(row.sourceKind) }}</strong>
                <span>
                  {{ sourceKindLabel(row.sourceKind) }} / {{ installModeLabel(row.installMode) }}
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            v-if="packageSearchMode === 'apply'"
            label="操作"
            width="120"
          >
            <template #default="{ row }">
              <ScButton
                type="primary"
                link
                @click="applyRepositorySearchSelection(row.rawItem, row.rawVersion)"
              >
                回填
              </ScButton>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </ScDialog>

    <ScDialog
      v-model="sourceDialogVisible"
      width="760px"
      :title="sourceDialogMode === 'edit' ? '编辑下载源' : '新增下载源'"
      destroy-on-close
     layout="simple">
      <section class="create-panel">
        <article class="source-card">
          <el-form
            ref="sourceFormRef"
            :model="sourceDraftForm"
            :rules="sourceDraftRules"
            label-position="top"
            class="create-version-dialog-form"
          >
            <div class="source-form-grid source-form-grid--row">
              <el-form-item label="源名称" prop="sourceName">
                <el-input v-model="sourceDraftForm.sourceName" placeholder="例如：CentOS 7 Packages" />
              </el-form-item>
              <el-form-item label="来源分类" prop="sourceKind">
                <ScSelect v-model="sourceDraftForm.sourceKind" placeholder="选择来源分类">
                  <ScOption
                    v-for="option in sourceKindOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="源类型" prop="sourceType">
                <ScSelect v-model="sourceDraftForm.sourceType" placeholder="选择源类型">
                  <ScOption
                    v-for="option in sourceTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="启用状态">
                <el-switch
                  v-model="sourceDraftForm.enabled"
                  inline-prompt
                  active-text="启用"
                  inactive-text="停用"
                />
              </el-form-item>
              <el-form-item
                v-if="requiresRepositoryUrl(sourceDraftForm.sourceType)"
                label="源地址"
                class="create-form-span-2"
                prop="sourceUrl"
              >
                <el-input
                  v-model="sourceDraftForm.sourceUrl"
                  placeholder="例如：https://vault.centos.org/7.9.2009/os/x86_64/Packages/"
                />
              </el-form-item>
              <el-form-item
                v-if="requiresLocalDirectory(sourceDraftForm.sourceType)"
                label="本地目录"
                class="create-form-span-2"
                prop="localDirectory"
              >
                <el-input
                  v-model="sourceDraftForm.localDirectory"
                  placeholder="例如：H:/workspace/soft-repository"
                />
              </el-form-item>
              <el-form-item label="来源说明" class="create-form-span-2">
                <el-input
                  v-model="sourceDraftForm.sourceConfig"
                  type="textarea"
                  :rows="3"
                  placeholder="例如：CentOS 7 x86_64 官方归档包目录"
                />
              </el-form-item>
            </div>
          </el-form>
        </article>
      </section>

      <template #footer>
        <ScButton @click="sourceDialogVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="sourceDialogSaving" @click="saveSourceDraft">
          保存
        </ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="packageCreateDialogVisible"
      width="980px"
      title="新增软件"
      destroy-on-close
      layout="simple"
    >
      <section class="create-panel">
        <article class="source-card">
          <div class="create-step-strip">
            <div class="create-step-chip" :class="{ 'is-active': packageCreateStep === 1 }">
              <span>1</span>
              <div>
                <strong>软件主档</strong>
                <small>先填写软件基础信息并选择归属仓库。</small>
              </div>
            </div>
            <div class="create-step-chip" :class="{ 'is-active': packageCreateStep === 2 }">
              <span>2</span>
              <div>
                <strong>版本列表</strong>
                <small>可连续追加多个版本并一次提交。</small>
              </div>
            </div>
          </div>

          <template v-if="packageCreateStep === 1">
            <el-form :model="packageCreateForm" label-position="top" class="create-version-dialog-form">
              <div class="source-form-grid source-form-grid--row">
                <el-form-item label="所属仓库">
                  <ScSelect v-model="packageCreateForm.softRepositoryId" clearable placeholder="选择仓库">
                    <ScOption
                      v-for="repo in repositories"
                      :key="repo.softRepositoryId || repo.repositoryName"
                      :label="repo.repositoryName || '未命名仓库'"
                      :value="repo.softRepositoryId"
                    />
                  </ScSelect>
                </el-form-item>
                <el-form-item label="软件编码">
                  <el-input
                    v-model="packageCreateForm.packageCode"
                    placeholder="例如：mysql-community-server"
                  />
                </el-form-item>
                <el-form-item label="软件名称">
                  <el-input v-model="packageCreateForm.packageName" placeholder="例如：MySQL Community Server" />
                </el-form-item>
                <el-form-item label="软件分类">
                  <el-input v-model="packageCreateForm.packageCategory" placeholder="例如：Database" />
                </el-form-item>
                <el-form-item label="画像编码">
                  <el-input v-model="packageCreateForm.profileCode" placeholder="可选" />
                </el-form-item>
                <el-form-item label="操作系统">
                  <ScSelect v-model="packageCreateForm.osType" clearable placeholder="选择操作系统">
                    <ScOption
                      v-for="option in osFilterOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ScSelect>
                </el-form-item>
                <el-form-item label="架构">
                  <ScSelect v-model="packageCreateForm.architecture" clearable placeholder="选择架构">
                    <ScOption
                      v-for="option in architectureFilterOptions"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </ScSelect>
                </el-form-item>
                <el-form-item label="图标地址" class="create-form-span-2">
                  <el-input v-model="packageCreateForm.iconUrl" placeholder="可选，http/https URL" />
                </el-form-item>
                <el-form-item label="描述" class="create-form-span-2">
                  <el-input
                    v-model="packageCreateForm.description"
                    type="textarea"
                    :rows="3"
                    placeholder="软件说明、用途、运行要求"
                  />
                </el-form-item>
              </div>
            </el-form>
          </template>

          <template v-else>
            <div class="create-version-actions">
              <el-tag size="small" effect="plain">
                {{ packageCreateForm.packageCode || "PACKAGE" }}
              </el-tag>
              <ScButton plain @click="addPackageVersionDraft">追加版本</ScButton>
            </div>
            <div class="create-version-list">
              <article v-for="(item, index) in packageVersionDrafts" :key="`draft-${index}`" class="source-entry">
                <header class="source-entry__head">
                  <div>
                    <strong>版本 #{{ index + 1 }}</strong>
                    <p>{{ item.versionCode || "未填写版本编码" }}</p>
                  </div>
                  <ScButton
                    plain
                    type="danger"
                    :disabled="packageVersionDrafts.length <= 1"
                    @click="removePackageVersionDraft(index)"
                  >
                    删除
                  </ScButton>
                </header>
                <div class="source-form-grid source-form-grid--row">
                  <el-form-item label="版本编码">
                    <el-input v-model="item.versionCode" placeholder="例如：8.4.3" />
                  </el-form-item>
                  <el-form-item label="版本名称">
                    <el-input v-model="item.versionName" placeholder="可选，默认同版本编码" />
                  </el-form-item>
                  <el-form-item label="来源分类">
                    <ScSelect v-model="item.sourceKind" placeholder="选择来源分类">
                      <ScOption
                        v-for="option in sourceKindOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ScSelect>
                  </el-form-item>
                  <el-form-item label="安装模式">
                    <ScSelect v-model="item.installMode" placeholder="选择安装模式">
                      <ScOption
                        v-for="option in installModeOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ScSelect>
                  </el-form-item>
                  <el-form-item label="操作系统">
                    <ScSelect v-model="item.osType" clearable placeholder="选择操作系统">
                      <ScOption
                        v-for="option in osFilterOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ScSelect>
                  </el-form-item>
                  <el-form-item label="架构">
                    <ScSelect v-model="item.architecture" clearable placeholder="选择架构">
                      <ScOption
                        v-for="option in architectureFilterOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ScSelect>
                  </el-form-item>
                  <el-form-item label="下载地址列表" class="create-form-span-2">
                    <el-input
                      v-model="item.downloadUrlsText"
                      type="textarea"
                      :rows="2"
                      placeholder="每行一个地址，或用英文逗号分隔"
                    />
                  </el-form-item>
                  <el-form-item label="主下载地址">
                    <el-input v-model="item.downloadUrl" placeholder="可选" />
                  </el-form-item>
                  <el-form-item label="本地包路径">
                    <el-input v-model="item.artifactPath" placeholder="本地安装模式可填写" />
                  </el-form-item>
                  <el-form-item label="启用版本">
                    <el-switch
                      v-model="item.enabled"
                      inline-prompt
                      active-text="启用"
                      inactive-text="停用"
                    />
                  </el-form-item>
                </div>
              </article>
            </div>
          </template>
        </article>
      </section>

      <template #footer>
        <ScButton @click="packageCreateDialogVisible = false">取消</ScButton>
        <ScButton v-if="packageCreateStep === 2" @click="packageCreateStep = 1">上一步</ScButton>
        <ScButton v-if="packageCreateStep === 1" type="primary" @click="goPackageCreateNextStep">
          下一步
        </ScButton>
        <ScButton
          v-else
          type="primary"
          :loading="packageCreateSubmitting"
          @click="submitPackageCreateWizard"
        >
          提交
        </ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="createVersionVisible"
      width="820px"
      title="逐条新增版本"
      destroy-on-close
     layout="simple">
      <section class="create-panel">
        <article class="source-card">
          <header class="source-card__header-row">
            <div>
              <strong>版本基础信息</strong>
              <small>每次只新增一个版本，脚本和路径继续在版本列表里逐条补齐。</small>
            </div>
            <el-tag size="small" effect="plain">
              {{ createCurrentPackage?.packageCode || "VERSION" }}
            </el-tag>
          </header>

          <el-form
            ref="createVersionFormRef"
            :model="createForm"
            :rules="createFormRules"
            label-position="top"
            class="create-version-dialog-form"
          >
            <div class="source-form-grid source-form-grid--row">
              <el-form-item label="版本编码" prop="versionCode">
                <ScSelect
                  v-model="createForm.versionCode"
                  filterable
                  allow-create
                  default-first-option
                  clearable
                  placeholder="例如: 8.4.3"
                  @change="handleCreateVersionCodeChange"
                >
                  <ScOption
                    v-for="option in createVersionCandidates"
                    :key="option.softPackageVersionId || option.versionCode"
                    :label="repositoryVersionLabel(option)"
                    :value="option.versionCode || ''"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="版本名称">
                <el-input v-model="createForm.versionName" placeholder="可选，默认等于版本编码" />
              </el-form-item>
              <el-form-item label="来源分类">
                <ScSelect v-model="createForm.sourceKind" placeholder="选择来源分类">
                  <ScOption
                    v-for="option in sourceKindOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="安装模式">
                <ScSelect v-model="createForm.installMode" placeholder="选择安装模式">
                  <ScOption
                    v-for="option in installModeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="下载地址" class="create-form-span-2" prop="downloadUrlsText">
                <el-input
                  v-model="createForm.downloadUrlsText"
                  type="textarea"
                  :rows="3"
                  placeholder="每行一个地址，或使用英文逗号分隔"
                />
              </el-form-item>
              <el-form-item label="主下载地址">
                <el-input
                  v-model="createForm.downloadUrl"
                  placeholder="远程下载安装模式可填写单一主下载地址"
                />
              </el-form-item>
              <el-form-item label="本地包路径">
                <el-input
                  v-model="createForm.artifactPath"
                  placeholder="本地仓库模式可填写仓库内制品路径"
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
            </div>
          </el-form>
        </article>
      </section>

      <template #footer>
        <ScButton @click="createVersionVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="creatingVersion" @click="submitCreateVersion">
          保存版本
        </ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="versionEditorVisible"
      width="820px"
      title="版本脚本配置"
      destroy-on-close
     layout="simple">
      <section class="create-panel">
        <article class="source-card">
          <header class="source-card__header-row">
            <div>
              <strong>版本脚本与路径</strong>
              <small>单独维护安装、启动、停止、卸载、服务脚本，以及日志/配置路径。</small>
            </div>
            <el-tag size="small" effect="plain">
              {{ createCurrentPackage?.packageCode || "VERSION" }}
            </el-tag>
          </header>

          <div class="source-form-grid source-form-grid--row">
            <el-form-item label="版本名称">
              <el-input v-model="versionEditorForm.versionName" />
            </el-form-item>
            <el-form-item label="来源分类">
              <ScSelect v-model="versionEditorForm.sourceKind">
                <ScOption
                  v-for="option in sourceKindOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ScSelect>
            </el-form-item>
            <el-form-item label="安装模式">
              <ScSelect v-model="versionEditorForm.installMode">
                <ScOption
                  v-for="option in installModeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ScSelect>
            </el-form-item>
            <el-form-item label="主下载地址">
              <el-input v-model="versionEditorForm.downloadUrl" />
            </el-form-item>
            <el-form-item label="下载地址列表" class="create-form-span-2">
              <el-input
                v-model="versionEditorForm.downloadUrlsText"
                type="textarea"
                :rows="3"
                placeholder="每行一个下载地址"
              />
            </el-form-item>
            <el-form-item label="安装脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.installScript" type="textarea" :rows="4" />
            </el-form-item>
            <el-form-item label="启动脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.startScript" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="停止脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.stopScript" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="重启脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.restartScript" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="状态检查脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.statusScript" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="卸载脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.uninstallScript" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="服务注册脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.serviceRegisterScript" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="服务卸载脚本" class="create-form-span-2">
              <el-input v-model="versionEditorForm.serviceUnregisterScript" type="textarea" :rows="3" />
            </el-form-item>
            <el-form-item label="日志路径" class="create-form-span-2">
              <el-input
                v-model="versionEditorForm.logPathsText"
                type="textarea"
                :rows="2"
                placeholder="每行一个日志路径"
              />
            </el-form-item>
            <el-form-item label="配置路径" class="create-form-span-2">
              <el-input
                v-model="versionEditorForm.configPathsText"
                type="textarea"
                :rows="2"
                placeholder="每行一个配置路径"
              />
            </el-form-item>
            <el-form-item label="扩展元数据 JSON" class="create-form-span-2">
              <el-input
                v-model="versionEditorForm.metadataJson"
                type="textarea"
                :rows="3"
                placeholder="可选，填写扩展元数据 JSON"
              />
            </el-form-item>
            <el-form-item label="启用版本">
              <el-switch
                v-model="versionEditorForm.enabled"
                inline-prompt
                active-text="启用"
                inactive-text="停用"
              />
            </el-form-item>
          </div>
        </article>
      </section>

      <template #footer>
        <ScButton @click="versionEditorVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="versionEditorSaving" @click="saveVersionEditor">
          保存版本配置
        </ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="packageEditorVisible"
      width="760px"
      title="编辑软件主档"
      destroy-on-close
      layout="simple"
    >
      <section class="create-panel">
        <article class="source-card">
          <el-form
            ref="packageEditorFormRef"
            :model="packageEditorForm"
            :rules="packageEditorRules"
            label-position="top"
            class="create-version-dialog-form"
          >
            <div class="source-form-grid source-form-grid--row">
              <el-form-item label="软件编码">
                <el-input v-model="packageEditorForm.packageCode" disabled />
              </el-form-item>
              <el-form-item label="软件名称" prop="packageName">
                <el-input v-model="packageEditorForm.packageName" />
              </el-form-item>
              <el-form-item label="软件分类" prop="packageCategory">
                <el-input v-model="packageEditorForm.packageCategory" />
              </el-form-item>
              <el-form-item label="画像编码">
                <el-input v-model="packageEditorForm.profileCode" placeholder="可选" />
              </el-form-item>
              <el-form-item label="操作系统" prop="osType">
                <ScSelect v-model="packageEditorForm.osType" clearable>
                  <ScOption
                    v-for="option in osFilterOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="架构" prop="architecture">
                <ScSelect v-model="packageEditorForm.architecture" clearable>
                  <ScOption
                    v-for="option in architectureFilterOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="图标地址" prop="iconUrl" class="create-form-span-2">
                <el-input v-model="packageEditorForm.iconUrl" placeholder="可选" />
              </el-form-item>
              <el-form-item label="描述" class="create-form-span-2">
                <el-input
                  v-model="packageEditorForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="软件说明、用途、运行要求"
                />
              </el-form-item>
            </div>
          </el-form>
        </article>
      </section>

      <template #footer>
        <ScButton @click="packageEditorVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="packageEditorSaving" @click="savePackageEditor">
          保存主档
        </ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="softwareDetailVisible"
      width="920px"
      title="软件详情"
      :draggable="true"
      destroy-on-close
    >
      <template #header>
        <div class="soft-dialog-header">
          <div>
            <small>SOFTWARE DETAIL</small>
            <strong>软件详情</strong>
          </div>
          <el-tag v-if="currentSoftwareDetail" size="small" effect="light">
            {{ currentSoftwareDetail.packageCount }} 包
          </el-tag>
        </div>
      </template>
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
                <ScSelect
                  v-model="detailInstallPackageId"
                  clearable
                  filterable
                  placeholder="选择一个软件包"
                >
                  <ScOption
                    v-for="item in currentSoftwareVariants"
                    :key="item.softPackageId"
                    :label="`${item.packageName} · ${osLabel(item.osType)} / ${architectureLabel(item.architecture)}`"
                    :value="item.softPackageId"
                  />
                </ScSelect>
              </el-form-item>
              <el-form-item label="目标服务器">
                <ScSelect
                  v-model="detailInstallHostId"
                  clearable
                  filterable
                  :loading="installContextLoading"
                  placeholder="选择兼容服务器"
                >
                  <ScOption
                    v-for="host in compatibleDetailHosts"
                    :key="host.serverId"
                    :label="formatHostOptionLabel(host)"
                    :value="host.serverId"
                  />
                </ScSelect>
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
              <ScButton
                type="primary"
                :disabled="!detailInstallPackageId || !detailInstallHostId"
                @click="openDetailInstallWizard"
              >
                安装到服务器
              </ScButton>
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
                <ScButton
                  link
                  type="primary"
                  @click="openDetailPage(row.softPackageId)"
                >
                  打开完整详情
                </ScButton>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </template>
      <el-empty v-else description="未选择软件" />
    </ScDialog>

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
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { Grid, House, Setting } from "@element-plus/icons-vue";
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
  createSoftRepositorySource,
  createSoftPackageVersion,
  createSoftTarget,
  createSoftPackage,
  deleteSoftPackage,
  deleteSoftRepositorySource,
  generateSoftPackageAiDraft,
  getSoftPackageDetail,
  getSoftVersionGuide,
  installSoftPackage,
  listSoftPackages,
  listSoftRepositories,
  searchSoftRepositoryPackages,
  listSoftTargets,
  updateSoftPackage,
  updateSoftRepositorySource,
  updateSoftPackageVersion,
  updateSoftTarget,
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
  SoftPackageVersionCreateRequest,
  SoftRepository,
  SoftRepositoryPackageSearchItem,
  SoftRepositoryPackageSearchVersion,
  SoftRepositorySource,
  SoftTarget,
} from "../api";

const HOME_TAB = "software-home";
const SOURCE_TAB = "source-settings";
const CREATE_TAB = "package-create";

type SourceDraft = SoftRepositorySource & {
  draftId: string;
};
type SourceType = SoftRepositorySource["sourceType"];
type SourceKind = NonNullable<SoftRepositorySource["sourceKind"]>;
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

type PackageVersionDraft = {
  architecture: string;
  artifactPath: string;
  downloadUrl: string;
  downloadUrlsText: string;
  enabled: boolean;
  installMode: "PKG_MANAGER" | "LOCAL_UPLOAD" | "REMOTE_DOWNLOAD";
  osType: string;
  sourceKind: SourceKind;
  versionCode: string;
  versionName: string;
};

const router = useRouter();
const loading = ref(false);
const deletingSourceId = ref<number | null>(null);
const creatingPackage = ref(false);
const creatingVersion = ref(false);
const creatingPackageAiDraft = ref(false);
const createVersionVisible = ref(false);
const versionEditorVisible = ref(false);
const versionEditorSaving = ref(false);
const sourceDialogVisible = ref(false);
const sourceDialogSaving = ref(false);
const packageEditorVisible = ref(false);
const packageEditorSaving = ref(false);
const deletingPackageId = ref<number | null>(null);
const packageCreateDialogVisible = ref(false);
const packageCreateStep = ref(1);
const packageCreateSubmitting = ref(false);
const sourceDialogRepositoryId = ref<number | null>(null);

const railTab = ref<string>(HOME_TAB);
const sourceTabVisible = ref(false);
const createTabVisible = ref(false);
const createStep = ref(1);
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
const packageSearchVisible = ref(false);
const packageSearchMode = ref<"apply" | "browse">("apply");
const packageSearchLoading = ref(false);
const packageSearchKeyword = ref("");
const packageSearchResults = ref<SoftRepositoryPackageSearchItem[]>([]);
const createVersionCandidates = ref<SoftRepositoryPackageSearchVersion[]>([]);
const createCurrentPackage = ref<SoftPackage | null>(null);
const createCurrentVersions = ref<SoftPackageVersion[]>([]);
const editingVersionId = ref<number | null>(null);
const sourceDialogMode = ref<"create" | "edit">("create");
const editingSourceId = ref<number | null>(null);

const packages = ref<SoftPackage[]>([]);
const repositories = ref<SoftRepository[]>([]);
const serverHosts = ref<ServerHost[]>([]);
const softTargets = ref<SoftTarget[]>([]);

const keyword = ref("");
const osFilter = ref("");
const architectureFilter = ref("");
const manageKeyword = ref("");

const createPackageAiPrompt = ref("");
const createFormRef = ref<FormInstance>();
const createVersionFormRef = ref<FormInstance>();
const sourceFormRef = ref<FormInstance>();
const packageEditorFormRef = ref<FormInstance>();

const packageEditorForm = reactive({
  softPackageId: null as number | null,
  softRepositoryId: null as number | null,
  packageCode: "",
  packageName: "",
  packageCategory: "",
  profileCode: "",
  osType: "",
  architecture: "",
  iconUrl: "",
  description: "",
});
const packageCreateForm = reactive({
  softRepositoryId: null as number | null,
  packageCode: "",
  packageName: "",
  packageCategory: "",
  profileCode: "",
  osType: "",
  architecture: "",
  iconUrl: "",
  description: "",
});
const packageVersionDrafts = ref<PackageVersionDraft[]>([]);
const createDefaultVersionDraft = (): PackageVersionDraft => ({
  architecture: packageCreateForm.architecture || "",
  artifactPath: "",
  downloadUrl: "",
  downloadUrlsText: "",
  enabled: true,
  installMode: "REMOTE_DOWNLOAD",
  osType: packageCreateForm.osType || "",
  sourceKind: "THIRD_PARTY",
  versionCode: "",
  versionName: "",
});
const sourceDraftForm = reactive({
  sourceName: "",
  sourceKind: "THIRD_PARTY" as SourceKind,
  sourceType: "HTTP_JSON" as SourceType,
  sourceUrl: "",
  localDirectory: "",
  enabled: true,
  sourceConfig: "",
});

const createForm = reactive({
  architecture: "",
  artifactPath: "",
  description: "",
  downloadUrl: "",
  downloadUrlsText: "",
  enabled: true,
  iconUrl: "",
  initScript: "",
  installMode: "REMOTE_DOWNLOAD",
  installScript: "",
  integrateServerService: false,
  osType: "",
  packageCategory: "",
  packageCode: "",
  packageName: "",
  profileCode: "",
  repositorySourceId: null as number | null,
  serverExecutionProvider: "",
  serverServiceCode: "",
  serverServiceName: "",
  serverServiceStartMode: "",
  serverServiceType: "",
  serviceRegisterScript: "",
  serviceUnregisterScript: "",
  softRepositoryId: null as number | null,
  sourceKind: "THIRD_PARTY" as SourceKind,
  startScript: "",
  stopScript: "",
  uninstallScript: "",
  versionCode: "",
  versionName: "",
});
const versionEditorForm = reactive({
  configPathsText: "",
  downloadUrl: "",
  downloadUrlsText: "",
  enabled: true,
  installMode: "REMOTE_DOWNLOAD",
  installScript: "",
  logPathsText: "",
  metadataJson: "",
  repositorySourceId: null as number | null,
  restartScript: "",
  serviceRegisterScript: "",
  serviceUnregisterScript: "",
  sourceKind: "THIRD_PARTY" as SourceKind,
  startScript: "",
  statusScript: "",
  stopScript: "",
  uninstallScript: "",
  versionName: "",
});
const softwareCodeReg = /^[a-z0-9][a-z0-9-_]{1,63}$/;
const versionCodeReg = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const sourceDraftRules: FormRules<typeof sourceDraftForm> = {
  sourceName: [{ required: true, message: "请填写源名称", trigger: "blur" }],
  sourceKind: [{ required: true, message: "请选择来源分类", trigger: "change" }],
  sourceType: [{ required: true, message: "请选择源类型", trigger: "change" }],
  sourceUrl: [
    {
      validator: (_rule, value, callback) => {
        if (requiresRepositoryUrl(sourceDraftForm.sourceType) && !normalizeText(value)) {
          callback(new Error("当前源类型必须填写源地址"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
  localDirectory: [
    {
      validator: (_rule, value, callback) => {
        if (requiresLocalDirectory(sourceDraftForm.sourceType) && !normalizeText(value)) {
          callback(new Error("当前源类型必须填写本地目录"));
          return;
        }
        callback();
      },
      trigger: "blur",
    },
  ],
};

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
        if (createForm.installMode === "PKG_MANAGER") {
          callback();
          return;
        }
        if (createForm.installMode === "LOCAL_UPLOAD") {
          if (normalizeText(createForm.artifactPath)) {
            callback();
            return;
          }
          if (!urls.length) {
            callback(new Error("本地仓库模式至少填写一个下载地址或本地包路径"));
            return;
          }
        } else if (!urls.length && !normalizeText(createForm.downloadUrl)) {
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
};
const packageEditorRules: FormRules<typeof packageEditorForm> = {
  packageName: [
    { required: true, message: "请填写软件名称", trigger: "blur" },
    { min: 2, max: 64, message: "软件名称长度需在 2 到 64 个字符之间", trigger: "blur" },
  ],
  packageCategory: [{ required: true, message: "请填写软件分类", trigger: "blur" }],
  osType: [{ required: true, message: "请选择操作系统", trigger: "change" }],
  architecture: [{ required: true, message: "请选择架构", trigger: "change" }],
  iconUrl: [
    {
      validator: (_rule, value, callback) => {
        const text = normalizeText(value);
        if (!text || /^https?:\/\/\S+/i.test(text)) {
          callback();
          return;
        }
        callback(new Error("图标地址需为 http/https URL"));
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

const sourceKindOptions: Array<{ label: string; value: SourceKind }> = [
  { label: "Linux 默认源", value: "LINUX_DEFAULT" },
  { label: "本地仓库", value: "LOCAL_REPOSITORY" },
  { label: "第三方下载源", value: "THIRD_PARTY" },
];

const installModeOptions = [
  { label: "包管理器安装", value: "PKG_MANAGER" },
  { label: "本地包安装", value: "LOCAL_UPLOAD" },
  { label: "远程下载安装", value: "REMOTE_DOWNLOAD" },
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
      icon: markRaw(Grid),
      name: CREATE_TAB,
      title: "软件管理",
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

const managedPackages = computed(() => {
  const text = normalizeText(manageKeyword.value)?.toLowerCase();
  const base = [...packages.value].sort((left, right) =>
    String(left.packageName || left.packageCode || "").localeCompare(
      String(right.packageName || right.packageCode || ""),
    ),
  );
  if (!text) {
    return base;
  }
  return base.filter((item) =>
    [
      item.packageName,
      item.packageCode,
      item.packageCategory,
      item.description,
      item.profileCode,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(text)),
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

const repositorySourceItems = (repository: SoftRepository): SourceDraft[] => {
  const items = Array.isArray(repository.sourceConfigs) ? repository.sourceConfigs : [];
  return items.map((item, index) => ({
    draftId: `${repository.softRepositoryId || "repo"}-${item.softRepositorySourceId || index}`,
    softRepositorySourceId: item.softRepositorySourceId,
    sourceName: normalizeText(item.sourceName) || "",
    sourceKind: toSourceKind(item.sourceKind, item.sourceType),
    sourceType: toSourceType(item.sourceType),
    sourceUrl: normalizeText(item.sourceUrl) || "",
    localDirectory: normalizeText(item.localDirectory) || "",
    enabled: item.enabled !== false,
    sourceConfig: normalizeText(item.sourceConfig) || "",
  }));
};

const packageSearchRows = computed(() =>
  packageSearchResults.value.flatMap((item) => {
    const versions = Array.isArray(item.versions) ? item.versions : [];
    if (!versions.length) {
      return [{
        architecture: "",
        downloadUrl: "",
        installMode: "",
        osType: "",
        packageCode: item.packageCode,
        packageName: item.packageName,
        rawItem: item,
        rawVersion: undefined,
        repositoryName: item.repositoryName,
        repositorySourceName: "",
        sourceKind: "",
        versionCode: "",
        versionName: "",
      }];
    }
    return versions.map((version) => ({
      architecture: version.architecture,
      downloadUrl: firstNonBlank(
        version.downloadUrl,
        Array.isArray(version.downloadUrls) ? version.downloadUrls[0] : "",
      ),
      installMode: version.installMode,
      osType: version.osType,
      packageCode: item.packageCode,
      packageName: firstNonBlank(version.packageName, item.packageName),
      rawItem: item,
      rawVersion: version,
      repositoryName: item.repositoryName,
      repositorySourceName: version.repositorySourceName,
      sourceKind: version.sourceKind,
      versionCode: version.versionCode,
      versionName: version.versionName,
    }));
  }),
);

const installHost = computed(
  () =>
    serverHosts.value.find(
      (item) => toNumericId(item.serverId) === toNumericId(installHostId.value),
    ) || null,
);

const compatibleDetailHosts = computed(() =>
  detailInstallPackage.value
    ? serverHosts.value.filter((host) =>
        matchPackageServer(detailInstallPackage.value, host),
      )
    : [],
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

const resetPackageCreateWizard = () => {
  packageCreateStep.value = 1;
  packageCreateSubmitting.value = false;
  packageCreateForm.softRepositoryId = toNumericId(repositories.value[0]?.softRepositoryId);
  packageCreateForm.packageCode = "";
  packageCreateForm.packageName = "";
  packageCreateForm.packageCategory = "";
  packageCreateForm.profileCode = "";
  packageCreateForm.osType = "";
  packageCreateForm.architecture = "";
  packageCreateForm.iconUrl = "";
  packageCreateForm.description = "";
  packageVersionDrafts.value = [createDefaultVersionDraft()];
};

const openCreatePackageWizard = async () => {
  if (!repositories.value.length) {
    await loadHomeData();
  }
  if (!repositories.value.length) {
    ElMessage.warning("请先初始化至少一个仓库");
    return;
  }
  resetPackageCreateWizard();
  packageCreateDialogVisible.value = true;
};

const addPackageVersionDraft = () => {
  packageVersionDrafts.value.push(createDefaultVersionDraft());
};

const removePackageVersionDraft = (index: number) => {
  if (packageVersionDrafts.value.length <= 1) {
    ElMessage.warning("至少保留一个版本");
    return;
  }
  packageVersionDrafts.value.splice(index, 1);
};

const validatePackageCreateStepOne = () => {
  const packageCode = normalizeText(packageCreateForm.packageCode);
  const packageName = normalizeText(packageCreateForm.packageName);
  const packageCategory = normalizeText(packageCreateForm.packageCategory);
  const osType = normalizeText(packageCreateForm.osType);
  const architecture = normalizeText(packageCreateForm.architecture);
  const iconUrl = normalizeText(packageCreateForm.iconUrl);

  if (!packageCode || !softwareCodeReg.test(packageCode)) {
    ElMessage.warning("软件编码必填，且仅允许小写字母、数字、-、_");
    return false;
  }
  if (!packageName || packageName.length < 2 || packageName.length > 64) {
    ElMessage.warning("软件名称长度需在 2 到 64 个字符之间");
    return false;
  }
  if (!packageCategory) {
    ElMessage.warning("请填写软件分类");
    return false;
  }
  if (!osType) {
    ElMessage.warning("请选择操作系统");
    return false;
  }
  if (!architecture) {
    ElMessage.warning("请选择架构");
    return false;
  }
  if (iconUrl && !/^https?:\/\/\S+/i.test(iconUrl)) {
    ElMessage.warning("图标地址需为 http/https URL");
    return false;
  }
  return true;
};

const validatePackageVersionDraft = (draft: PackageVersionDraft, index: number) => {
  const versionCode = normalizeText(draft.versionCode);
  if (!versionCode || !versionCodeReg.test(versionCode)) {
    ElMessage.warning(`第 ${index + 1} 个版本编码不合法`);
    return false;
  }
  const urls = parseDownloadUrls(draft.downloadUrlsText);
  const mode = normalizeInstallModeChoice(draft.installMode, draft.sourceKind);
  if (mode === "LOCAL_UPLOAD") {
    if (!urls.length && !normalizeText(draft.artifactPath)) {
      ElMessage.warning(`第 ${index + 1} 个版本缺少下载地址或本地包路径`);
      return false;
    }
  } else if (mode !== "PKG_MANAGER" && !urls.length && !normalizeText(draft.downloadUrl)) {
    ElMessage.warning(`第 ${index + 1} 个版本至少需要一个下载地址`);
    return false;
  }
  const invalid = urls.find((item) => item.length < 3 || /\s/.test(item));
  if (invalid) {
    ElMessage.warning(`第 ${index + 1} 个版本下载地址不合法: ${invalid}`);
    return false;
  }
  return true;
};

const goPackageCreateNextStep = () => {
  if (!validatePackageCreateStepOne()) {
    return;
  }
  if (!packageVersionDrafts.value.length) {
    packageVersionDrafts.value = [createDefaultVersionDraft()];
  }
  packageCreateStep.value = 2;
};

const submitPackageCreateWizard = async () => {
  if (!validatePackageCreateStepOne()) {
    packageCreateStep.value = 1;
    return;
  }
  if (!packageVersionDrafts.value.length) {
    ElMessage.warning("请至少添加一个版本");
    return;
  }
  for (let i = 0; i < packageVersionDrafts.value.length; i += 1) {
    if (!validatePackageVersionDraft(packageVersionDrafts.value[i], i)) {
      packageCreateStep.value = 2;
      return;
    }
  }

  const payload: SoftPackageCreateRequest = {
    architecture: toOptionalText(packageCreateForm.architecture),
    description: toOptionalText(packageCreateForm.description),
    iconUrl: toOptionalText(packageCreateForm.iconUrl),
    osType: toOptionalText(packageCreateForm.osType),
    packageCategory: toOptionalText(packageCreateForm.packageCategory),
    packageCode: toOptionalText(packageCreateForm.packageCode) || "",
    packageName: toOptionalText(packageCreateForm.packageName) || "",
    profileCode: toOptionalText(packageCreateForm.profileCode),
    softRepositoryId: toNumericId(packageCreateForm.softRepositoryId) || undefined,
  };

  packageCreateSubmitting.value = true;
  try {
    const created = await createSoftPackage(payload);
    const packageId = toNumericId(resolveCreatedPackage(created.data)?.softPackageId);
    if (!packageId) {
      ElMessage.error("软件主档创建失败");
      return;
    }
    for (const draft of packageVersionDrafts.value) {
      const versionCode = toOptionalText(draft.versionCode) || "";
      const versionPayload: SoftPackageVersionCreateRequest = {
        architecture: toOptionalText(draft.architecture),
        artifactPath: toOptionalText(draft.artifactPath),
        downloadUrl: toOptionalText(draft.downloadUrl),
        downloadUrls: parseDownloadUrls(draft.downloadUrlsText),
        enabled: draft.enabled !== false,
        installMode: normalizeInstallModeChoice(draft.installMode, draft.sourceKind),
        osType: toOptionalText(draft.osType),
        packageName: toOptionalText(packageCreateForm.packageName),
        sourceKind: toSourceKind(draft.sourceKind),
        versionCode,
        versionName: toOptionalText(draft.versionName),
      };
      await createSoftPackageVersion(packageId, versionPayload);
    }
    await loadHomeData();
    packageCreateDialogVisible.value = false;
    resetPackageCreateWizard();
    ElMessage.success("软件与版本已创建");
  } finally {
    packageCreateSubmitting.value = false;
  }
};

const removePackage = async (value: SoftPackage) => {
  const packageId = toNumericId(value.softPackageId);
  if (!packageId) {
    ElMessage.warning("未找到可删除的软件");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除软件“${value.packageName || value.packageCode || packageId}”吗？`,
      "删除软件",
      { type: "warning" },
    );
  } catch {
    return;
  }
  deletingPackageId.value = packageId;
  try {
    await deleteSoftPackage(packageId);
    if (toNumericId(createCurrentPackage.value?.softPackageId) === packageId) {
      createCurrentPackage.value = null;
      createCurrentVersions.value = [];
    }
    await loadHomeData();
    ElMessage.success("软件已删除");
  } finally {
    deletingPackageId.value = null;
  }
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

const resetSourceDraftForm = (source?: Partial<SoftRepositorySource> | null) => {
  sourceDraftForm.sourceName = normalizeText(source?.sourceName) || "";
  sourceDraftForm.sourceKind = toSourceKind(source?.sourceKind, source?.sourceType);
  sourceDraftForm.sourceType = toSourceType(source?.sourceType);
  sourceDraftForm.sourceUrl = normalizeText(source?.sourceUrl) || "";
  sourceDraftForm.localDirectory = normalizeText(source?.localDirectory) || "";
  sourceDraftForm.enabled = source?.enabled !== false;
  sourceDraftForm.sourceConfig = normalizeText(source?.sourceConfig) || "";
  sourceFormRef.value?.clearValidate();
};

const openSourceDraftDialog = (
  source?: Partial<SoftRepositorySource> | null,
  repositoryId?: number | null,
) => {
  sourceDialogMode.value = source?.softRepositorySourceId ? "edit" : "create";
  editingSourceId.value = toNumericId(source?.softRepositorySourceId);
  sourceDialogRepositoryId.value = toNumericId(repositoryId);
  resetSourceDraftForm(source);
  sourceDialogVisible.value = true;
};

const editSourceConfig = (repository: SoftRepository, source: SourceDraft) => {
  openSourceDraftDialog(source, repository.softRepositoryId);
};

const saveSourceDraft = async () => {
  const repositoryId = toNumericId(sourceDialogRepositoryId.value);
  if (!repositoryId) {
    ElMessage.warning("请先选择仓库");
    return;
  }
  try {
    await sourceFormRef.value?.validate();
  } catch {
    return;
  }
  const payload: SoftRepositorySource = {
    enabled: sourceDraftForm.enabled !== false,
    localDirectory: toOptionalText(sourceDraftForm.localDirectory),
    sourceConfig: toOptionalText(sourceDraftForm.sourceConfig),
    sourceKind: toSourceKind(sourceDraftForm.sourceKind, sourceDraftForm.sourceType),
    sourceName: toOptionalText(sourceDraftForm.sourceName),
    sourceType: toSourceType(sourceDraftForm.sourceType),
    sourceUrl: toOptionalText(sourceDraftForm.sourceUrl),
  };
  sourceDialogSaving.value = true;
  try {
    if (editingSourceId.value) {
      await updateSoftRepositorySource(repositoryId, editingSourceId.value, payload);
      ElMessage.success("下载源已更新");
    } else {
      await createSoftRepositorySource(repositoryId, payload);
      ElMessage.success("下载源已新增");
    }
    sourceDialogVisible.value = false;
    await loadHomeData();
  } finally {
    sourceDialogSaving.value = false;
  }
};

const removeSourceConfig = async (
  repository: SoftRepository,
  target: SourceDraft,
  index: number,
) => {
  const repositoryId = toNumericId(repository.softRepositoryId);
  const sourceId = toNumericId(target.softRepositorySourceId);
  if (!repositoryId || !sourceId) {
    return;
  }
  await ElMessageBox.confirm(
    `确认删除检索源“${target.sourceName || `源 ${index + 1}`}”吗？`,
    "删除检索源",
    { type: "warning" },
  );
  deletingSourceId.value = sourceId;
  try {
    await deleteSoftRepositorySource(repositoryId, sourceId);
    ElMessage.success("检索源已删除");
    await loadHomeData();
  } finally {
    deletingSourceId.value = null;
  }
};

const resetCreatePackageForm = () => {
  createStep.value = 1;
  createPackageAiPrompt.value = "";
  packageSearchKeyword.value = "";
  packageSearchResults.value = [];
  createVersionCandidates.value = [];
  createCurrentPackage.value = null;
  createCurrentVersions.value = [];
  editingVersionId.value = null;
  createVersionVisible.value = false;
  versionEditorVisible.value = false;
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
  createForm.sourceKind = "THIRD_PARTY";
  createForm.installMode = "REMOTE_DOWNLOAD";
  createForm.repositorySourceId = null;
  createForm.artifactPath = "";
  createForm.downloadUrl = "";
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
  versionEditorForm.versionName = "";
  versionEditorForm.sourceKind = "THIRD_PARTY";
  versionEditorForm.installMode = "REMOTE_DOWNLOAD";
  versionEditorForm.repositorySourceId = null;
  versionEditorForm.downloadUrl = "";
  versionEditorForm.downloadUrlsText = "";
  versionEditorForm.installScript = "";
  versionEditorForm.startScript = "";
  versionEditorForm.stopScript = "";
  versionEditorForm.restartScript = "";
  versionEditorForm.statusScript = "";
  versionEditorForm.uninstallScript = "";
  versionEditorForm.serviceRegisterScript = "";
  versionEditorForm.serviceUnregisterScript = "";
  versionEditorForm.logPathsText = "";
  versionEditorForm.configPathsText = "";
  versionEditorForm.metadataJson = "";
  versionEditorForm.enabled = true;
  createFormRef.value?.clearValidate();
  createVersionFormRef.value?.clearValidate();
};

const resetVersionDraft = (preserveVersionCandidates = true) => {
  if (!preserveVersionCandidates) {
    createVersionCandidates.value = [];
  }
  createForm.versionCode = "";
  createForm.versionName = "";
  createForm.sourceKind = "THIRD_PARTY";
  createForm.installMode = "REMOTE_DOWNLOAD";
  createForm.repositorySourceId = null;
  createForm.artifactPath = "";
  createForm.downloadUrl = "";
  createForm.downloadUrlsText = "";
  createForm.enabled = true;
  createForm.installScript = "";
  createForm.initScript = "";
  createForm.startScript = "";
  createForm.stopScript = "";
  createForm.uninstallScript = "";
  createForm.serviceRegisterScript = "";
  createForm.serviceUnregisterScript = "";
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

const toJsonArrayText = (value: string) => {
  const items = parseDownloadUrls(value);
  return items.length ? JSON.stringify(items) : undefined;
};

const toOptionalText = (value?: string | null) => {
  const normalized = normalizeText(value);
  return normalized || undefined;
};

const firstNonBlank = (left?: string | null, right?: string | null) =>
  normalizeText(left) || normalizeText(right);

const openRepositoryPackageSearch = async () => {
  if (!repositories.value.length) {
    await loadHomeData();
  }
  packageSearchMode.value = "apply";
  packageSearchVisible.value = true;
  packageSearchKeyword.value =
    normalizeText(createForm.packageCode) ||
    normalizeText(createForm.packageName) ||
    normalizeText(packageSearchKeyword.value);
  if (!packageSearchResults.value.length) {
    await performRepositoryPackageSearch();
  }
};

const performRepositoryPackageSearch = async () => {
  const keyword =
    normalizeText(packageSearchKeyword.value) ||
    normalizeText(createForm.packageCode) ||
    normalizeText(createForm.packageName);
  if (!keyword) {
    ElMessage.warning("请先输入软件编码或名称");
    return;
  }
  packageSearchLoading.value = true;
  try {
    const repositoryId = packageSearchMode.value === "browse"
      ? null
      : toNumericId(createForm.softRepositoryId);
    const result = await searchSoftRepositoryPackages({
      keyword,
      osType: toOptionalText(createForm.osType),
      repositoryIds: repositoryId ? [repositoryId] : [],
    });
    packageSearchResults.value = Array.isArray(result.data) ? result.data : [];
    if (!packageSearchResults.value.length) {
      ElMessage.warning("当前仓库范围内没有搜索到匹配软件");
    }
  } catch (error) {
    console.error(error);
    packageSearchResults.value = [];
    ElMessage.error("仓库搜索失败");
  } finally {
    packageSearchLoading.value = false;
  }
};

const applyRepositorySearchSelection = (
  item: SoftRepositoryPackageSearchItem,
  version?: SoftRepositoryPackageSearchVersion,
) => {
  const selectedVersion = version || item.versions?.[0];
  createForm.softRepositoryId = toNumericId(item.repositoryId);
  createForm.packageCode = firstNonBlank(item.packageCode, createForm.packageCode);
  createForm.packageName = firstNonBlank(
    selectedVersion?.packageName || item.packageName,
    createForm.packageName,
  );
  createVersionCandidates.value = Array.isArray(item.versions) ? [...item.versions] : [];
  if (selectedVersion?.versionCode) {
    createForm.versionCode = selectedVersion.versionCode;
    createForm.versionName = firstNonBlank(
      selectedVersion.versionName,
      selectedVersion.versionCode,
    );
    createForm.osType = firstNonBlank(selectedVersion.osType, createForm.osType);
    createForm.architecture = firstNonBlank(
      selectedVersion.architecture,
      createForm.architecture,
    );
    createForm.sourceKind = toSourceKind(
      selectedVersion.sourceKind || createForm.sourceKind,
    );
    createForm.installMode = normalizeInstallModeChoice(
      selectedVersion.installMode,
      createForm.sourceKind,
    );
  }
  packageSearchVisible.value = false;
  ElMessage.success("仓库搜索结果已回填");
};

const handleCreateVersionCodeChange = (value?: string) => {
  const selectedVersion = createVersionCandidates.value.find(
    (item) => normalizeText(item.versionCode) === normalizeText(value),
  );
  if (!selectedVersion) {
    return;
  }
  createForm.versionName = firstNonBlank(selectedVersion.versionName, createForm.versionName);
  createForm.packageName = firstNonBlank(selectedVersion.packageName, createForm.packageName);
  createForm.osType = firstNonBlank(selectedVersion.osType, createForm.osType);
  createForm.architecture = firstNonBlank(selectedVersion.architecture, createForm.architecture);
  createForm.sourceKind = toSourceKind(selectedVersion.sourceKind || createForm.sourceKind);
  createForm.installMode = normalizeInstallModeChoice(
    selectedVersion.installMode,
    createForm.sourceKind,
  );
};

const validateCreateFields = async (fields: string[]) => {
  try {
    await createFormRef.value?.validateField(fields);
    return true;
  } catch {
    return false;
  }
};

const loadCreatedPackageFlow = async (packageId?: number | null) => {
  const targetId = toNumericId(packageId);
  if (!targetId) {
    createCurrentPackage.value = null;
    createCurrentVersions.value = [];
    return;
  }
  const result = await getSoftPackageDetail(targetId);
  createCurrentPackage.value = result.data?.package || null;
  createCurrentVersions.value = Array.isArray(result.data?.versions)
    ? [...result.data.versions]
    : [];
};

const submitCreatePackage = async () => {
  const isValid = await validateCreateFields([
    "packageCode",
    "packageName",
    "packageCategory",
    "osType",
    "architecture",
    "iconUrl",
  ]);
  if (!isValid) {
    ElMessage.warning("请先修正表单校验错误后再保存");
    return;
  }

  const packageCode = toOptionalText(createForm.packageCode);
  const packageName = toOptionalText(createForm.packageName);
  if (!packageCode || !packageName) {
    ElMessage.warning("软件编码和软件名称为必填项");
    return;
  }

  const payload: SoftPackageCreateRequest = {
    architecture: toOptionalText(createForm.architecture),
    description: toOptionalText(createForm.description),
    iconUrl: toOptionalText(createForm.iconUrl),
    osType: toOptionalText(createForm.osType),
    packageCategory: toOptionalText(createForm.packageCategory),
    packageCode,
    packageName,
    profileCode: toOptionalText(createForm.profileCode),
    softRepositoryId:
      Number(createForm.softRepositoryId || 0) > 0
        ? Number(createForm.softRepositoryId)
        : undefined,
  };

  creatingPackage.value = true;
  try {
    const result = await createSoftPackage(payload);
    const createdPackage = resolveCreatedPackage(result.data);
    const createdPackageId = toNumericId(createdPackage?.softPackageId);
    if (!createdPackageId) {
      ElMessage.error("软件主档创建结果缺少主键");
      return;
    }
    await loadCreatedPackageFlow(createdPackageId);
    await loadHomeData();
    createStep.value = 2;
    ElMessage.success("软件主档已创建，继续新增版本");
  } finally {
    creatingPackage.value = false;
  }
};

const fillPackageEditorForm = (value?: SoftPackage | null) => {
  packageEditorForm.softPackageId = toNumericId(value?.softPackageId);
  packageEditorForm.softRepositoryId = toNumericId(value?.softRepositoryId);
  packageEditorForm.packageCode = normalizeText(value?.packageCode) || "";
  packageEditorForm.packageName = normalizeText(value?.packageName) || "";
  packageEditorForm.packageCategory = normalizeText(value?.packageCategory) || "";
  packageEditorForm.profileCode = normalizeText(value?.profileCode) || "";
  packageEditorForm.osType = normalizeText(value?.osType) || "";
  packageEditorForm.architecture = normalizeText(value?.architecture) || "";
  packageEditorForm.iconUrl = normalizeText(value?.iconUrl) || "";
  packageEditorForm.description = normalizeText(value?.description) || "";
  packageEditorFormRef.value?.clearValidate();
};

const openPackageEditor = async (value: SoftPackage) => {
  const packageId = toNumericId(value.softPackageId);
  if (!packageId) {
    ElMessage.warning("未找到可编辑的软件主档");
    return;
  }
  try {
    const detail = await getSoftPackageDetail(packageId);
    fillPackageEditorForm(detail.data?.package || value);
    packageEditorVisible.value = true;
  } catch (error) {
    console.error(error);
    ElMessage.error("加载软件主档详情失败");
  }
};

const savePackageEditor = async () => {
  const packageId = toNumericId(packageEditorForm.softPackageId);
  if (!packageId) {
    ElMessage.warning("未找到可保存的软件主档");
    return;
  }
  try {
    await packageEditorFormRef.value?.validate();
  } catch {
    return;
  }
  packageEditorSaving.value = true;
  try {
    await updateSoftPackage(packageId, {
      architecture: toOptionalText(packageEditorForm.architecture),
      description: toOptionalText(packageEditorForm.description),
      iconUrl: toOptionalText(packageEditorForm.iconUrl),
      osType: toOptionalText(packageEditorForm.osType),
      packageCategory: toOptionalText(packageEditorForm.packageCategory),
      packageCode: toOptionalText(packageEditorForm.packageCode) || undefined,
      packageName: toOptionalText(packageEditorForm.packageName) || undefined,
      profileCode: toOptionalText(packageEditorForm.profileCode),
      softRepositoryId: toNumericId(packageEditorForm.softRepositoryId) || undefined,
    });
    await loadHomeData();
    if (toNumericId(createCurrentPackage.value?.softPackageId) === packageId) {
      await loadCreatedPackageFlow(packageId);
    }
    packageEditorVisible.value = false;
    ElMessage.success("软件主档已更新");
  } finally {
    packageEditorSaving.value = false;
  }
};

const submitCreateVersion = async () => {
  const packageId = toNumericId(createCurrentPackage.value?.softPackageId);
  if (!packageId) {
    ElMessage.warning("请先创建软件主档");
    return;
  }
  const isValid = await validateCreateFields([
    "versionCode",
    "downloadUrlsText",
  ]);
  if (!isValid) {
    ElMessage.warning("请先修正版本表单错误后再保存");
    return;
  }

  const versionCode = toOptionalText(createForm.versionCode);
  if (!versionCode) {
    ElMessage.warning("版本编码不能为空");
    return;
  }

  const payload: SoftPackageVersionCreateRequest = {
    architecture: toOptionalText(createForm.architecture),
    artifactPath: toOptionalText(createForm.artifactPath),
    downloadUrl: toOptionalText(createForm.downloadUrl),
    downloadUrls: parseDownloadUrls(createForm.downloadUrlsText),
    enabled: createForm.enabled,
    installMode: normalizeInstallModeChoice(createForm.installMode, createForm.sourceKind),
    osType: toOptionalText(createForm.osType),
    packageName: toOptionalText(createForm.packageName),
    repositorySourceId: toNumericId(createForm.repositorySourceId) || undefined,
    sourceKind: toSourceKind(createForm.sourceKind),
    versionCode,
    versionName: toOptionalText(createForm.versionName),
  };

  creatingVersion.value = true;
  try {
    await createSoftPackageVersion(packageId, payload);
    await Promise.all([loadCreatedPackageFlow(packageId), loadHomeData()]);
    resetVersionDraft();
    createVersionVisible.value = false;
    createVersionFormRef.value?.clearValidate();
    ElMessage.success("版本已新增，可继续配置脚本");
  } finally {
    creatingVersion.value = false;
  }
};

const openCreateVersionDialog = () => {
  if (!createCurrentPackage.value?.softPackageId) {
    ElMessage.warning("请先创建软件主档");
    return;
  }
  createVersionVisible.value = true;
};

const openVersionEditor = (version: SoftPackageVersion) => {
  editingVersionId.value = toNumericId(version.softPackageVersionId);
  versionEditorForm.versionName = version.versionName || version.versionCode || "";
  versionEditorForm.sourceKind = toSourceKind(version.sourceKind);
  versionEditorForm.installMode = normalizeInstallModeChoice(
    version.installMode,
    version.sourceKind,
  );
  versionEditorForm.repositorySourceId = toNumericId(version.repositorySourceId);
  versionEditorForm.downloadUrl = normalizeText(version.downloadUrl);
  versionEditorForm.downloadUrlsText = Array.isArray(version.downloadUrls)
    ? version.downloadUrls.join("\n")
    : "";
  versionEditorForm.installScript = normalizeText(version.installScript);
  versionEditorForm.startScript = normalizeText(version.startScript);
  versionEditorForm.stopScript = normalizeText(version.stopScript);
  versionEditorForm.restartScript = normalizeText(version.restartScript);
  versionEditorForm.statusScript = normalizeText(version.statusScript);
  versionEditorForm.uninstallScript = normalizeText(version.uninstallScript);
  versionEditorForm.serviceRegisterScript = normalizeText(version.serviceRegisterScript);
  versionEditorForm.serviceUnregisterScript = normalizeText(version.serviceUnregisterScript);
  versionEditorForm.logPathsText = Array.isArray(version.logPaths)
    ? version.logPaths.join("\n")
    : "";
  versionEditorForm.configPathsText = Array.isArray(version.configPaths)
    ? version.configPaths.join("\n")
    : "";
  versionEditorForm.metadataJson = normalizeText(version.metadataJson);
  versionEditorForm.enabled = version.enabled !== false;
  versionEditorVisible.value = true;
};

const saveVersionEditor = async () => {
  const packageId = toNumericId(createCurrentPackage.value?.softPackageId);
  const versionId = toNumericId(editingVersionId.value);
  if (!packageId || !versionId) {
    ElMessage.warning("未找到可编辑的版本");
    return;
  }
  versionEditorSaving.value = true;
  try {
    await updateSoftPackageVersion(packageId, versionId, {
      configPathsJson: toJsonArrayText(versionEditorForm.configPathsText),
      downloadUrl: toOptionalText(versionEditorForm.downloadUrl),
      downloadUrlsJson: toJsonArrayText(versionEditorForm.downloadUrlsText),
      enabled: versionEditorForm.enabled,
      installMode: normalizeInstallModeChoice(
        versionEditorForm.installMode,
        versionEditorForm.sourceKind,
      ),
      installScript: toOptionalText(versionEditorForm.installScript),
      logPathsJson: toJsonArrayText(versionEditorForm.logPathsText),
      metadataJson: toOptionalText(versionEditorForm.metadataJson),
      repositorySourceId: toNumericId(versionEditorForm.repositorySourceId) || undefined,
      restartScript: toOptionalText(versionEditorForm.restartScript),
      serviceRegisterScript: toOptionalText(versionEditorForm.serviceRegisterScript),
      serviceUnregisterScript: toOptionalText(versionEditorForm.serviceUnregisterScript),
      sourceKind: toSourceKind(versionEditorForm.sourceKind),
      startScript: toOptionalText(versionEditorForm.startScript),
      statusScript: toOptionalText(versionEditorForm.statusScript),
      stopScript: toOptionalText(versionEditorForm.stopScript),
      uninstallScript: toOptionalText(versionEditorForm.uninstallScript),
      versionName: toOptionalText(versionEditorForm.versionName),
    });
    await Promise.all([loadCreatedPackageFlow(packageId), loadHomeData()]);
    versionEditorVisible.value = false;
    ElMessage.success("版本脚本配置已保存");
  } finally {
    versionEditorSaving.value = false;
  }
};

const goToCreatedPackageDetail = () => {
  if (createCurrentPackage.value?.softPackageId) {
    openDetailPage(createCurrentPackage.value.softPackageId);
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

const versionScriptSummary = (version: SoftPackageVersion) => {
  const names = [
    version.installScript ? "安装" : "",
    version.startScript ? "启动" : "",
    version.stopScript ? "停止" : "",
    version.uninstallScript ? "卸载" : "",
    version.serviceRegisterScript ? "注册服务" : "",
    version.serviceUnregisterScript ? "卸载服务" : "",
  ].filter(Boolean);
  return names.length ? names.join(" / ") : "未配置脚本";
};

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

function toSourceKind(value?: string | null, sourceType?: string | null): SourceKind {
  const normalized = normalizeText(value).toUpperCase();
  if (
    normalized === "LINUX_DEFAULT" ||
    normalized === "LOCAL_REPOSITORY" ||
    normalized === "THIRD_PARTY"
  ) {
    return normalized;
  }
  const normalizedType = normalizeText(sourceType).toUpperCase();
  if (normalizedType === "LOCAL_DIR") {
    return "LOCAL_REPOSITORY";
  }
  if (normalizedType === "RPM_REPO") {
    return "LINUX_DEFAULT";
  }
  return "THIRD_PARTY";
}

function normalizeInstallModeChoice(value?: string | null, sourceKind?: string | null) {
  const normalized = normalizeText(value).toUpperCase();
  if (
    normalized === "PKG_MANAGER" ||
    normalized === "LOCAL_UPLOAD" ||
    normalized === "REMOTE_DOWNLOAD"
  ) {
    return normalized;
  }
  const nextKind = toSourceKind(sourceKind);
  if (nextKind === "LINUX_DEFAULT") {
    return "PKG_MANAGER";
  }
  if (nextKind === "LOCAL_REPOSITORY") {
    return "LOCAL_UPLOAD";
  }
  return "REMOTE_DOWNLOAD";
}

function sourceKindLabel(value?: string | null) {
  const normalized = toSourceKind(value);
  return sourceKindOptions.find((item) => item.value === normalized)?.label || normalized;
}

function installModeLabel(value?: string | null) {
  const normalized = normalizeInstallModeChoice(value);
  return installModeOptions.find((item) => item.value === normalized)?.label || normalized;
}

function repositoryVersionLabel(version?: SoftRepositoryPackageSearchVersion | null) {
  if (!version) {
    return "未命名版本";
  }
  const versionCode = normalizeText(version.versionCode) || "未命名版本";
  const tags = [
    normalizeText(version.versionName),
    osLabel(version.osType),
    architectureLabel(version.architecture),
    sourceKindLabel(version.sourceKind),
    installModeLabel(version.installMode),
  ].filter(Boolean);
  return [versionCode, ...tags].join(" / ");
}

function packageSearchDownloadLabel(row: {
  downloadUrl?: string;
  rawVersion?: SoftRepositoryPackageSearchVersion;
}) {
  const primary = normalizeText(row.downloadUrl);
  if (primary) {
    return primary;
  }
  const urls = Array.isArray(row.rawVersion?.downloadUrls)
    ? row.rawVersion?.downloadUrls?.filter(Boolean)
    : [];
  return urls.length ? urls.join(" / ") : "未提供下载地址";
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

function describeSourceAddress(source?: Partial<SoftRepositorySource> | null) {
  if (!source) {
    return "未填写";
  }
  return normalizeText(source.sourceUrl) || normalizeText(source.localDirectory) || "未填写";
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
  min-width: 0;
  overflow: hidden;
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
  grid-template-rows: minmax(0, 1fr);
  gap: 0;
  height: 100%;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
  padding: 12px;
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
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.soft-stage__content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.soft-stage__content.is-workbench-open {
  pointer-events: none;
  opacity: 0.14;
  filter: saturate(0.75);
}

.soft-workbench__body {
  display: grid;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.soft-workbench__body::-webkit-scrollbar {
  width: 0;
  height: 0;
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
  min-height: 0;
}

.create-version-dialog-form {
  display: grid;
  gap: 12px;
}

.create-step-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.create-step-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 18px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.create-step-chip span {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: var(--soft-chip-bg);
  color: var(--soft-chip-text);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.create-step-chip strong,
.create-step-chip small {
  display: block;
}

.create-step-chip strong {
  color: var(--soft-text-primary);
  font-size: 14px;
}

.create-step-chip small {
  margin-top: 4px;
  color: var(--soft-text-muted);
  font-size: 12px;
}

.create-step-chip.is-active {
  border-color: var(--soft-accent-border);
  box-shadow: var(--soft-shadow-card);
}

.create-step-chip.is-active span {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(16, 185, 129, 0.16));
  color: var(--soft-text-primary);
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

.create-group--success {
  border-color: rgba(16, 185, 129, 0.28);
  background:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 32%),
    var(--soft-surface);
}

.create-group--pending {
  border-style: dashed;
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

.create-version-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.create-created-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.create-created-summary span {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--soft-chip-bg);
  color: var(--soft-chip-text);
  font-size: 12px;
}

.create-version-actions {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.create-version-list {
  display: grid;
  gap: 10px;
}

.create-form-span-2 {
  grid-column: 1 / -1;
}

.source-card__header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.source-card header strong,
.source-card header small {
  margin: 0;
}

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

.source-panel__toolbar--compact {
  grid-template-columns: minmax(0, 1fr);
  padding: 12px 14px;
  border-radius: 20px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.source-panel__context small,
.soft-dialog-header small {
  display: block;
  color: var(--soft-accent-text);
  letter-spacing: 0.12em;
  font-size: 11px;
  font-weight: 700;
}

.source-panel__context strong,
.soft-dialog-header strong {
  display: block;
  margin-top: 6px;
  color: var(--soft-text-primary);
  font-size: 18px;
}

.source-panel__context p {
  margin: 6px 0 0;
  color: var(--soft-text-muted);
  font-size: 13px;
  line-height: 1.6;
}

.source-panel__toolbar-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.source-panel__action-strip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.source-directory {
  display: flex;
  gap: 12px;
  height: 300px;
  align-items: stretch;
}

.source-entry {
  display: grid;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 20px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.source-entry__head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.source-entry__head strong,
.package-search-row__version strong,
.package-search-row__source strong {
  display: block;
  color: var(--soft-text-primary);
}

.source-entry__head p,
.package-search-row__version span,
.package-search-row__source span {
  margin: 6px 0 0;
  color: var(--soft-text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.source-entry__head p span {
  margin: 0 6px;
}

.source-entry__badges {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.source-entry__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.source-entry__field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.source-entry__field label {
  color: var(--soft-text-muted);
  font-size: 12px;
}

.source-entry__field span,
.source-entry__field code,
.package-search-row__download code {
  display: block;
  min-width: 0;
  overflow-wrap: anywhere;
  color: var(--soft-text-primary);
  font-size: 13px;
  line-height: 1.6;
}

.source-entry__field code,
.package-search-row__download code {
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.04);
}

.source-entry__actions {
  display: inline-flex;
  gap: 10px;
  flex-wrap: wrap;
}

.source-panel__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: stretch;
}

.source-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 20px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
  min-height: 0;
  flex: 1 1 360px;
}

.source-panel__grid > .source-card:first-child {
  flex: 1 1 320px;
}

.source-panel__grid > .source-card:last-child {
  flex: 1 1 560px;
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

.source-form-grid--row {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.package-search-row__version,
.package-search-row__source,
.package-search-row__download {
  display: grid;
  gap: 4px;
}

.soft-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
  .create-step-strip,
  .source-directory,
  .source-panel__toolbar,
  .source-panel__toolbar-main,
  .source-form-grid,
  .source-form-grid--row,
  .source-entry__grid,
  .software-detail__install-grid {
    grid-template-columns: 1fr;
  }

  .soft-hero,
  .software-card__actions,
  .source-card__header-row,
  .source-entry__head,
  .software-detail__install-actions,
  .create-group__title {
    display: grid;
  }

  .soft-hero__actions {
    justify-content: flex-start;
  }
}
</style>
