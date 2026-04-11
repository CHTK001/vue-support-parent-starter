<template>
  <SoftWorkspace title="软件目录">
    <template #actions>
      <el-tooltip content="仓库管理" placement="top">
        <el-button circle @click="router.push('/soft/repositories')">
          <IconifyIconOnline icon="ri:database-2-line" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="服务器管理" placement="top">
        <el-button circle @click="router.push('/server/list')">
          <IconifyIconOnline icon="ri:server-line" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="录入软件" placement="top">
        <el-button circle type="success" @click="openIngestDialog">
          <IconifyIconOnline icon="ri:upload-cloud-2-line" />
        </el-button>
      </el-tooltip>
      <el-tooltip content="刷新目录" placement="top">
        <el-button circle type="primary" @click="loadPackages">
          <IconifyIconOnline icon="ri:refresh-line" />
        </el-button>
      </el-tooltip>
    </template>

    <section class="soft-toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索软件名称、编码、分类"
        clearable
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <el-select v-model="osFilter" clearable placeholder="操作系统">
        <el-option label="全部系统" value="" />
        <el-option
          v-for="option in osFilterOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        >
          <div class="soft-option">
            <IconifyIconOnline :icon="osIcon(option.value)" />
            <span>{{ option.label }}</span>
          </div>
        </el-option>
      </el-select>
      <el-select v-model="architectureFilter" clearable placeholder="架构">
        <el-option label="全部架构" value="" />
        <el-option
          v-for="option in architectureFilterOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <div class="soft-toolbar__meta">
        <span>当前软件 {{ filteredPackages.length }}</span>
        <span>可安装服务器 {{ enabledServerCount }}</span>
        <span>已启用仓库 {{ enabledRepositoryCount }}</span>
      </div>
    </section>

    <ScTable
      v-loading="loading"
      :data="filteredPackages"
      layout="card"
      card-layout="default"
      row-key="softwareKey"
      :col-size="3"
      :hide-pagination="true"
      :border="false"
      :stripe="false"
      class="soft-card-table"
    >
      <template #default="{ row }">
        <article class="soft-card">
          <header class="soft-card__header">
            <div class="soft-card__title">
              <div class="soft-card__avatar">
                <img
                  v-if="row.iconUrl"
                  :src="row.iconUrl"
                  :alt="row.packageName"
                />
                <span v-else>{{ packageInitials(row.packageName) }}</span>
              </div>
              <div>
                <h3>{{ row.packageName }}</h3>
                <p>{{ row.packageCode }}</p>
              </div>
            </div>
            <div class="soft-card__badges">
              <el-tooltip
                v-for="platform in row.platforms"
                :key="`${row.softwareKey}-${platform.value}`"
                :content="platform.description"
                placement="top"
              >
                <span class="soft-chip soft-chip--platform">
                  <IconifyIconOnline :icon="platform.icon" />
                  <span>{{ platform.label }}</span>
                </span>
              </el-tooltip>
              <el-tooltip
                v-if="row.architectures.length"
                :content="
                  row.architectures
                    .map((item) => architectureLabel(item))
                    .join(' / ')
                "
                placement="top"
              >
                <span class="soft-chip">
                  <IconifyIconOnline icon="ri:cpu-line" />
                  <span>{{ row.architectures.length }} 架构</span>
                </span>
              </el-tooltip>
            </div>
          </header>

          <div class="soft-card__meta">
            <span>{{ row.packageCategory || "未分类" }}</span>
            <span>{{ compatibleServerCount(row) }} 台匹配服务器</span>
            <span>{{ row.platforms.length }} 个系统</span>
            <span>{{ profileLabel(row.profileCode) }}</span>
          </div>

          <p class="soft-card__desc">
            {{
              row.description ||
              "该软件尚未补充描述，可直接选择服务器进入安装引导。"
            }}
          </p>

          <footer class="soft-card__actions">
            <el-tooltip content="整理元数据" placement="top">
              <el-button circle @click="openPackageEdit(row)">
                <IconifyIconOnline icon="ri:edit-2-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="查看详情" placement="top">
              <el-button circle @click="openDetail(row)">
                <IconifyIconOnline icon="ri:information-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="安装到服务器" placement="top">
              <el-button
                circle
                type="primary"
                :disabled="compatibleServerCount(row) === 0"
                @click="openInstall(row)"
              >
                <IconifyIconOnline icon="ri:download-cloud-2-line" />
              </el-button>
            </el-tooltip>
          </footer>
        </article>
      </template>
      <template #empty>
        <div class="soft-empty">
          <el-empty
            description="当前还没有软件主档。先配置仓库定义与服务器，再回到这里进行搜索、同步和安装。"
          />
          <div class="soft-empty__actions">
            <el-button @click="router.push('/soft/repositories')">
              去配置仓库
            </el-button>
            <el-button type="primary" @click="router.push('/server/list')">
              去维护服务器
            </el-button>
          </div>
        </div>
      </template>
    </ScTable>

    <el-dialog
      v-model="installVisible"
      width="1160px"
      :title="
        selectedSoftware ? `安装 ${selectedSoftware.packageName}` : '安装软件'
      "
    >
      <el-steps :active="installStep" simple class="install-steps">
        <el-step title="选择操作系统与服务器" />
        <el-step title="选择版本与引导配置" />
        <el-step title="提交与日志" />
      </el-steps>

      <section
        v-if="installStep === 0"
        class="install-step install-step--servers"
      >
        <article class="guide-section">
          <header class="section-header">
            <div>
              <h3>选择操作系统</h3>
              <p>
                同一软件的不同系统版本会聚合展示，先选目标操作系统再匹配服务器
              </p>
            </div>
            <span>{{ installPlatformOptions.length }} 项</span>
          </header>

          <div class="platform-switch-grid">
            <button
              v-for="item in installPlatformOptions"
              :key="String(item.value)"
              type="button"
              class="platform-pill"
              :class="{ 'is-selected': selectedOsType === item.value }"
              @click="handlePlatformChange(String(item.value))"
            >
              <IconifyIconOnline
                :icon="String(item.icon || 'ri:apps-2-line')"
              />
              <span>{{ item.label }}</span>
              <small>{{ item.description }}</small>
            </button>
          </div>
        </article>

        <div class="install-basic-grid">
          <el-form-item
            v-if="selectedVariantOptions.length > 1"
            label="安装包架构"
          >
            <el-select
              v-model="selectedVariantPackageId"
              placeholder="选择架构"
              style="width: 100%"
              @change="handleVariantChange"
            >
              <el-option
                v-for="variant in selectedVariantOptions"
                :key="variant.value"
                :label="variant.label"
                :value="variant.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="实例名称">
            <el-input v-model="installForm.installationName" />
          </el-form-item>
          <el-form-item label="安装路径">
            <el-input
              v-model="installForm.installPath"
              placeholder="可选，默认按服务器基础目录生成"
            />
          </el-form-item>
          <el-form-item label="服务名称">
            <el-input
              v-model="installForm.serviceName"
              placeholder="可选，默认按软件编码生成"
            />
          </el-form-item>
        </div>

        <article v-if="selectedPackage" class="install-variant-summary">
          <header class="section-header">
            <div>
              <h3>已选安装包</h3>
              <p>
                按所选操作系统收口到具体安装包，版本和服务器都基于这个包匹配
              </p>
            </div>
          </header>
          <div class="soft-card__meta">
            <span>{{ selectedPackage.packageCode }}</span>
            <span>{{ osLabel(selectedPackage.osType) || "通用系统" }}</span>
            <span>{{ architectureLabel(selectedPackage.architecture) }}</span>
          </div>
        </article>

        <article class="guide-section">
          <header class="section-header">
            <div>
              <h3>匹配服务器</h3>
              <p>
                仅显示与当前操作系统和架构兼容且已启用的服务器，可多选批量安装
              </p>
            </div>
            <div class="section-header__actions">
              <span>{{ matchedServers.length }} 台</span>
              <el-tooltip content="全选匹配服务器" placement="top">
                <el-button circle @click="selectAllMatchedServers">
                  <IconifyIconOnline icon="ri:checkbox-multiple-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="清空已选服务器" placement="top">
                <el-button circle @click="clearSelectedServers">
                  <IconifyIconOnline icon="ri:close-circle-line" />
                </el-button>
              </el-tooltip>
            </div>
          </header>

          <ScSelect
            v-model="selectedServerIds"
            :options="matchedServerOptions"
            layout="dropdown"
            multiple
            width="100%"
            class="server-select"
            dropdown-title="选择匹配服务器"
            dropdown-placeholder="搜索服务器名称、地址或目录"
            dropdown-icon="ri:server-line"
            :dropdown-show-batch-actions="true"
            :dropdown-col="1"
            display-mode="large"
          >
            <template #content="{ option }">
              <div class="server-select-option">
                <div class="server-select-option__title">
                  <strong>{{ option.label }}</strong>
                  <div class="server-select-option__icons">
                    <IconifyIconOnline
                      :icon="String(option.icon || 'ri:server-line')"
                    />
                    <IconifyIconOnline
                      :icon="osIcon(String(option.osType || ''))"
                    />
                  </div>
                </div>
                <div class="server-select-option__meta">
                  <span
                    >{{ option.host || "-"
                    }}{{ option.port ? `:${option.port}` : "" }}</span
                  >
                  <span>{{
                    architectureLabel(String(option.architecture || ""))
                  }}</span>
                  <span>{{ option.targetTypeLabel || "-" }}</span>
                </div>
                <p>
                  {{
                    option.baseDirectory ||
                    option.description ||
                    "未配置基础目录"
                  }}
                </p>
              </div>
            </template>
          </ScSelect>

          <div v-if="selectedServers.length" class="server-select-summary">
            <article
              v-for="server in selectedServers"
              :key="server.serverId"
              class="server-select-card"
            >
              <div class="server-select-card__title">
                <strong>{{ server.serverName }}</strong>
                <div class="server-select-option__icons">
                  <IconifyIconOnline
                    :icon="targetTypeIcon(server.serverType)"
                  />
                  <IconifyIconOnline :icon="osIcon(server.osType)" />
                </div>
              </div>
              <div class="server-select-option__meta">
                <span
                  >{{ server.host || "-"
                  }}{{ server.port ? `:${server.port}` : "" }}</span
                >
                <span>{{ architectureLabel(server.architecture) }}</span>
                <span>{{ targetTypeLabel(server.serverType) }}</span>
              </div>
              <p>
                {{
                  server.baseDirectory || server.description || "未配置基础目录"
                }}
              </p>
            </article>
          </div>

          <el-empty
            v-if="!matchedServers.length"
            description="当前没有匹配的软件安装服务器，请先到服务器管理中补充对应操作系统与架构"
          />
        </article>
      </section>

      <section v-else-if="installStep === 1" class="install-step">
        <article class="guide-section">
          <header class="section-header">
            <div>
              <h3>选择版本</h3>
              <p>默认已选最新版本，可在提交前切换到其他可安装版本</p>
            </div>
            <span>{{ versions.length }} 个版本</span>
          </header>

          <div class="install-basic-grid install-basic-grid--single">
            <el-form-item label="软件版本">
              <el-select
                v-model="installForm.softPackageVersionId"
                placeholder="选择版本"
                style="width: 100%"
                :disabled="!selectedPackage"
              >
                <el-option
                  v-for="version in versions"
                  :key="version.softPackageVersionId"
                  :label="`${version.versionName} (${version.versionCode})`"
                  :value="version.softPackageVersionId"
                />
              </el-select>
            </el-form-item>
          </div>
        </article>

        <div v-if="guideLoading" class="guide-loading">
          <el-skeleton :rows="8" animated />
        </div>
        <template v-else>
          <section
            v-for="section in guideSections"
            :key="section.key"
            class="guide-section"
          >
            <header class="section-header">
              <div>
                <h3>{{ section.title }}</h3>
                <p>{{ section.hint }}</p>
              </div>
              <span>{{ section.fields.length }} 项</span>
            </header>

            <div v-if="section.fields.length" class="guide-fields">
              <template
                v-for="field in section.fields"
                :key="`${section.key}-${field.fieldKey}`"
              >
                <el-form-item
                  v-if="shouldRenderField(field)"
                  :label="field.fieldLabel || field.fieldKey"
                  :required="Boolean(field.requiredFlag)"
                  class="guide-field"
                >
                  <template v-if="isTextareaField(field)">
                    <el-input
                      v-model="resolveModel(section.scope)[field.fieldKey]"
                      type="textarea"
                      :rows="4"
                      :disabled="isFieldDisabled(field)"
                      :placeholder="
                        field.fieldDescription ||
                        `请输入${field.fieldLabel || field.fieldKey}`
                      "
                    />
                  </template>
                  <template v-else-if="isNumberField(field)">
                    <el-input-number
                      v-model="resolveModel(section.scope)[field.fieldKey]"
                      :min="numberValidation(field.validation, 'min')"
                      :max="numberValidation(field.validation, 'max')"
                      :disabled="isFieldDisabled(field)"
                      style="width: 100%"
                    />
                  </template>
                  <template v-else-if="isBooleanField(field)">
                    <el-switch
                      :model-value="
                        Boolean(resolveModel(section.scope)[field.fieldKey])
                      "
                      @change="
                        updateBooleanModel(
                          section.scope,
                          field.fieldKey,
                          $event,
                        )
                      "
                      :disabled="isFieldDisabled(field)"
                    />
                  </template>
                  <template v-else-if="field.options?.length">
                    <el-select
                      v-model="resolveModel(section.scope)[field.fieldKey]"
                      :disabled="isFieldDisabled(field)"
                      clearable
                      style="width: 100%"
                    >
                      <el-option
                        v-for="option in normalizeOptions(field.options)"
                        :key="`${field.fieldKey}-${option.value}`"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </template>
                  <template v-else>
                    <el-input
                      v-model="resolveModel(section.scope)[field.fieldKey]"
                      :disabled="isFieldDisabled(field)"
                      :type="isPasswordField(field) ? 'password' : 'text'"
                      :show-password="isPasswordField(field)"
                      :placeholder="
                        field.fieldDescription ||
                        `请输入${field.fieldLabel || field.fieldKey}`
                      "
                    />
                  </template>
                  <div v-if="field.fieldDescription" class="guide-field__hint">
                    {{ field.fieldDescription }}
                  </div>
                </el-form-item>
              </template>
            </div>
            <el-empty v-else description="当前画像未定义该分组字段" />
          </section>

          <article v-if="previewResult" class="guide-preview">
            <header class="section-header">
              <div>
                <h3>渲染预览</h3>
                <p>配置模板、日志路径和落地路径预览</p>
              </div>
              <span
                >{{
                  previewResult.renderedConfigFiles?.length || 0
                }}
                个配置文件</span
              >
            </header>

            <div class="guide-preview__grid">
              <div class="guide-preview__card">
                <h4>配置文件</h4>
                <ul>
                  <li
                    v-for="item in previewResult.renderedConfigFiles || []"
                    :key="item.templatePath || item.templateCode"
                  >
                    <strong>{{
                      item.templateName || item.templateCode
                    }}</strong>
                    <span>{{ item.templatePath || "-" }}</span>
                  </li>
                </ul>
              </div>
              <div class="guide-preview__card">
                <h4>运行路径</h4>
                <ul>
                  <li v-for="path in previewPaths" :key="path">
                    {{ path }}
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </template>
      </section>

      <section v-else class="install-step">
        <div class="install-review-grid">
          <article class="install-review-card">
            <header class="section-header">
              <div>
                <h3>目标服务器</h3>
                <p>本次会逐台创建安装票据并进入统一日志面板</p>
              </div>
              <span>{{ selectedServers.length }} 台</span>
            </header>
            <ul class="review-list">
              <li v-for="server in selectedServers" :key="server.serverId">
                <strong>{{ server.serverName }}</strong>
                <span
                  >{{ osLabel(server.osType) }} /
                  {{ targetTypeLabel(server.serverType) }}</span
                >
              </li>
            </ul>
          </article>

          <article class="install-review-card">
            <header class="section-header">
              <div>
                <h3>安装摘要</h3>
                <p>版本、实例、路径与服务名</p>
              </div>
            </header>
            <ul class="review-list">
              <li>
                <strong>版本</strong>
                <span>{{ selectedVersionLabel }}</span>
              </li>
              <li>
                <strong>实例</strong>
                <span>{{ installForm.installationName || "-" }}</span>
              </li>
              <li>
                <strong>安装路径</strong>
                <span>{{
                  installForm.installPath || "按服务器默认目录生成"
                }}</span>
              </li>
              <li>
                <strong>服务名称</strong>
                <span>{{ installForm.serviceName || "按软件编码生成" }}</span>
              </li>
            </ul>
          </article>
        </div>

        <div v-if="batchTasks.length" class="inline-task-list">
          <header class="section-header">
            <div>
              <h3>已提交任务</h3>
              <p>点击左侧任务可查看对应安装日志</p>
            </div>
            <span>{{ batchTasks.length }} 个</span>
          </header>
          <div class="inline-task-list__items">
            <button
              v-for="task in batchTasks"
              :key="task.taskKey"
              type="button"
              class="inline-task-item"
              :class="{ 'is-active': task.operationId === activeOperationId }"
              @click="selectTask(task.operationId)"
            >
              <strong>{{ task.serverName }}</strong>
              <span
                >#{{ task.operationId || "-" }} ·
                {{ operationStatusLabel(task.status) }}</span
              >
            </button>
          </div>
        </div>
      </section>

      <template #footer>
        <el-button @click="installVisible = false">取消</el-button>
        <el-button v-if="installStep > 0" @click="installStep -= 1"
          >上一步</el-button
        >
        <el-button
          v-if="installStep === 0"
          type="primary"
          :disabled="
            !selectedOsType ||
            !selectedPackage?.softPackageId ||
            !selectedServerIds.length
          "
          @click="installStep = 1"
        >
          下一步
        </el-button>
        <el-button
          v-if="installStep === 1"
          :disabled="!installForm.softPackageVersionId"
          :loading="previewing"
          @click="previewGuide"
        >
          渲染预览
        </el-button>
        <el-button
          v-if="installStep === 1"
          type="primary"
          :disabled="!installForm.softPackageVersionId"
          @click="installStep = 2"
        >
          下一步
        </el-button>
        <el-button
          v-if="installStep === 2"
          type="primary"
          :loading="installing"
          @click="submitInstall"
        >
          提交安装
        </el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="operationVisible" title="安装日志" size="54%">
      <div class="operation-layout">
        <aside class="operation-task-list">
          <button
            v-for="task in batchTasks"
            :key="task.taskKey"
            type="button"
            class="operation-task"
            :class="{ 'is-active': task.operationId === activeOperationId }"
            @click="selectTask(task.operationId)"
          >
            <strong>{{ task.serverName }}</strong>
            <span>#{{ task.operationId || "-" }}</span>
            <small
              >{{ operationStatusLabel(task.status) }} ·
              {{ task.progressPercent || 0 }}%</small
            >
          </button>
        </aside>

        <section class="operation-panel">
          <template v-if="activeTask">
            <div class="operation-panel__header">
              <div>
                <strong>{{ activeTask.serverName }}</strong>
                <p>
                  #{{ activeTask.operationId || "-" }} ·
                  {{ operationStatusLabel(activeTask.status) }}
                </p>
              </div>
              <el-button
                v-if="
                  activeTask.installationId && selectedPackage?.softPackageId
                "
                link
                type="primary"
                @click="openInstallationDetail(activeTask)"
              >
                打开详情
              </el-button>
            </div>

            <el-progress
              :percentage="activeTask.progressPercent || 0"
              :status="
                activeTask.status === 'FAILED'
                  ? 'exception'
                  : activeTask.status === 'SUCCESS'
                    ? 'success'
                    : undefined
              "
              :stroke-width="14"
            />

            <div class="operation-metrics">
              <span>阶段 {{ stageLabel(activeTask.stage) }}</span>
              <span>状态 {{ operationStatusLabel(activeTask.status) }}</span>
              <span>实例 {{ activeTask.installationId || "-" }}</span>
            </div>

            <el-alert
              v-if="operationState.error"
              :title="operationState.error"
              type="error"
              :closable="false"
            />

            <el-scrollbar height="460px" class="operation-console">
              <pre>{{ activeTaskOutput }}</pre>
            </el-scrollbar>
          </template>
          <el-empty v-else description="暂无安装任务" />
        </section>
      </div>
    </el-drawer>

    <el-dialog v-model="ingestVisible" title="录入软件" width="760px">
      <div class="ingest-layout">
        <el-alert
          title="软件新增统一走仓库驱动。"
          type="info"
          :closable="false"
          description="本地目录仓库支持直接上传安装包，远程目录型仓库通过同步拉取新增版本。"
        />

        <div class="install-basic-grid install-basic-grid--single">
          <el-form-item label="选择仓库">
            <el-select
              v-model="ingestForm.softRepositoryId"
              placeholder="选择软件仓库"
              style="width: 100%"
            >
              <el-option
                v-for="item in repositories"
                :key="item.softRepositoryId"
                :label="`${item.repositoryName} (${item.repositoryType})`"
                :value="item.softRepositoryId"
              />
            </el-select>
          </el-form-item>
        </div>

        <article v-if="selectedIngestRepository" class="guide-section">
          <header class="section-header">
            <div>
              <h3>{{ selectedIngestRepository.repositoryName }}</h3>
              <p>
                {{
                  ingestUsesUpload
                    ? "当前仓库会把安装包直接写入本地目录，再自动同步成软件与版本。"
                    : "当前仓库以同步为主，适合 HTTP 目录、RPM 仓库和镜像站。"
                }}
              </p>
            </div>
            <span>{{ selectedIngestRepository.repositoryType }}</span>
          </header>

          <el-upload
            v-if="ingestUsesUpload"
            drag
            multiple
            :auto-upload="false"
            :file-list="ingestUploadFiles"
            :on-change="handleIngestFileChange"
            :on-remove="handleIngestFileRemove"
          >
            <IconifyIconOnline icon="ri:upload-cloud-2-line" />
            <div class="el-upload__text">
              拖拽或点击选择 `rpm/deb/exe/msi/zip/tar.gz/bin`
            </div>
            <template #tip>
              <div class="el-upload__tip">
                上传后会自动写入仓库目录并执行同步，无需手工维护 JSON。
              </div>
            </template>
          </el-upload>

          <el-empty
            v-else
            description="当前仓库不支持直传安装包，将直接执行同步并刷新软件目录。"
          />
        </article>
      </div>

      <template #footer>
        <el-button @click="ingestVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="ingesting"
          @click="submitIngest"
        >
          {{ ingestUsesUpload ? "上传并同步" : "立即同步" }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="editVisible" title="整理软件" width="1040px">
      <div v-if="editingSoftware" class="edit-layout">
        <div class="install-basic-grid">
          <el-form-item
            v-if="editingSoftware.variants.length > 1"
            label="软件包变体"
          >
            <el-select
              v-model="editingPackageId"
              style="width: 100%"
              @change="handleEditingPackageChange"
            >
              <el-option
                v-for="variant in editingSoftware.variants"
                :key="variant.softPackageId"
                :label="`${osLabel(variant.osType) || '通用系统'} / ${architectureLabel(variant.architecture)}`"
                :value="variant.softPackageId"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="软件名称">
            <el-input v-model="packageEditForm.packageName" />
          </el-form-item>
          <el-form-item label="分类">
            <el-input v-model="packageEditForm.packageCategory" />
          </el-form-item>
          <el-form-item label="画像编码">
            <el-input v-model="packageEditForm.profileCode" />
          </el-form-item>
          <el-form-item label="图标 URL">
            <el-input v-model="packageEditForm.iconUrl" />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="描述">
            <el-input
              v-model="packageEditForm.description"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
        </div>

        <article class="guide-section">
          <header class="section-header">
            <div>
              <h3>版本整理</h3>
              <p>只整理自动解析后的版本信息，不手工创建空白版本。</p>
            </div>
            <span>{{ editingVersions.length }} 个版本</span>
          </header>

          <el-table :data="editingVersions" border>
            <el-table-column label="版本" min-width="220">
              <template #default="{ row }">
                <div class="version-cell">
                  <strong>{{ row.versionName }}</strong>
                  <small>{{ row.versionCode }}</small>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                {{ row.enabled === false ? "停用" : "启用" }}
              </template>
            </el-table-column>
            <el-table-column label="下载源" min-width="220">
              <template #default="{ row }">
                {{ (row.downloadUrls || []).join(" / ") || "-" }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-tooltip content="编辑版本" placement="top">
                  <el-button circle @click="openVersionEdit(row)">
                    <IconifyIconOnline icon="ri:edit-line" />
                  </el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </article>
      </div>

      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="submitPackageEdit">
          保存软件整理
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="versionEditVisible" title="整理版本" width="960px">
      <div class="edit-layout">
        <div class="install-basic-grid">
          <el-form-item label="版本显示名">
            <el-input v-model="versionEditForm.versionName" />
          </el-form-item>
          <el-form-item label="启用状态">
            <el-switch v-model="versionEditForm.enabled" />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="下载地址 JSON">
            <el-input
              v-model="versionEditForm.downloadUrlsJson"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="安装脚本">
            <el-input
              v-model="versionEditForm.installScript"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="启动脚本">
            <el-input
              v-model="versionEditForm.startScript"
              type="textarea"
              :rows="4"
            />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="停止脚本">
            <el-input
              v-model="versionEditForm.stopScript"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="重启脚本">
            <el-input
              v-model="versionEditForm.restartScript"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="状态脚本">
            <el-input
              v-model="versionEditForm.statusScript"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="日志路径 JSON">
            <el-input
              v-model="versionEditForm.logPathsJson"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item label="配置路径 JSON">
            <el-input
              v-model="versionEditForm.configPathsJson"
              type="textarea"
              :rows="3"
            />
          </el-form-item>
          <el-form-item class="server-form-grid__span-2" label="扩展元数据 JSON">
            <el-input
              v-model="versionEditForm.metadataJson"
              type="textarea"
              :rows="5"
            />
          </el-form-item>
        </div>
      </div>

      <template #footer>
        <el-button @click="versionEditVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="editSaving"
          @click="submitVersionEdit"
        >
          保存版本整理
        </el-button>
      </template>
    </el-dialog>
  </SoftWorkspace>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { message } from "@repo/utils";
import { ElMessageBox, type UploadUserFile } from "element-plus";
import {
  createSoftTarget,
  getSoftPackageDetail,
  getSoftVersionGuide,
  installSoftPackage,
  listSoftOperationLogs,
  listSoftPackages,
  listSoftRepositories,
  listSoftTargets,
  previewSoftPackageGuide,
  syncSoftRepository,
  updateSoftPackage,
  updateSoftPackageVersion,
  updateSoftTarget,
  uploadSoftRepositoryArtifacts,
  type SoftGuideField,
  type SoftGuidePreviewResponse,
  type SoftInstallRequest,
  type SoftOperationLog,
  type SoftPackage,
  type SoftPackageGuide,
  type SoftPackageVersion,
  type SoftRepository,
  type SoftTarget,
} from "../api";
import {
  getServerHost,
  listServerHosts,
  type ServerHost,
} from "../../../server/src/api";
import { useSoftOperationStream } from "../composables/useSoftOperationStream";
import SoftWorkspace from "../components/SoftWorkspace.vue";

type GuideScope = "install" | "service" | "config";

type GuideSection = {
  key: string;
  title: string;
  hint: string;
  scope: GuideScope;
  fields: SoftGuideField[];
};

type GuideOption = {
  label: string;
  value: unknown;
};

type BatchInstallTask = {
  taskKey: string;
  serverId: number;
  serverName: string;
  operationId: number;
  installationId?: number;
  status?: string;
  stage?: string;
  progressPercent?: number;
  message?: string;
};

type CatalogPlatform = {
  value: string;
  label: string;
  icon: string;
  description: string;
  architectures: string[];
  variants: SoftPackage[];
};

type CatalogSoftware = {
  softwareKey: string;
  packageName: string;
  packageCode: string;
  packageCategory?: string;
  profileCode?: string;
  description?: string;
  iconUrl?: string;
  variants: SoftPackage[];
  platforms: CatalogPlatform[];
  architectures: string[];
};

type ServerSelectOption = {
  label: string;
  value: number;
  icon: string;
  host?: string;
  port?: number;
  osType?: string;
  architecture?: string;
  targetTypeLabel?: string;
  baseDirectory?: string;
  description?: string;
};

type IngestMode = "upload" | "sync";

const toNumericId = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

const router = useRouter();
const loading = ref(false);
const guideLoading = ref(false);
const previewing = ref(false);
const installing = ref(false);
const ingesting = ref(false);
const editSaving = ref(false);
const installVisible = ref(false);
const operationVisible = ref(false);
const ingestVisible = ref(false);
const editVisible = ref(false);
const versionEditVisible = ref(false);
const installStep = ref(0);
const keyword = ref("");
const osFilter = ref("");
const architectureFilter = ref("");
const packages = ref<SoftPackage[]>([]);
const repositories = ref<SoftRepository[]>([]);
const softTargets = ref<SoftTarget[]>([]);
const servers = ref<ServerHost[]>([]);
const versions = ref<SoftPackageVersion[]>([]);
const selectedSoftware = ref<CatalogSoftware | null>(null);
const selectedPackage = ref<SoftPackage | null>(null);
const selectedOsType = ref("");
const selectedVariantPackageId = ref<number | null>(null);
const selectedServerIds = ref<number[]>([]);
const ingestUploadFiles = ref<UploadUserFile[]>([]);
const guide = ref<SoftPackageGuide | null>(null);
const previewResult = ref<SoftGuidePreviewResponse | null>(null);
const batchTasks = ref<BatchInstallTask[]>([]);
const activeOperationId = ref<number | null>(null);
const taskLogs = ref<Record<number, string[]>>({});
const editingSoftware = ref<CatalogSoftware | null>(null);
const editingPackageId = ref<number | null>(null);
const editingVersions = ref<SoftPackageVersion[]>([]);
const editingVersionId = ref<number | null>(null);
let operationPollTimer: number | undefined;
const versionCache = new Map<number, SoftPackageVersion[]>();

const installOptions = reactive<Record<string, unknown>>({});
const serviceOptions = reactive<Record<string, unknown>>({});
const configOptions = reactive<Record<string, unknown>>({});
const ingestForm = reactive<{
  softRepositoryId: number;
  mode: IngestMode;
}>({
  softRepositoryId: 0,
  mode: "upload",
});
const packageEditForm = reactive<{
  packageName: string;
  packageCategory: string;
  description: string;
  iconUrl: string;
  profileCode: string;
}>({
  packageName: "",
  packageCategory: "",
  description: "",
  iconUrl: "",
  profileCode: "",
});
const versionEditForm = reactive<{
  versionName: string;
  enabled: boolean;
  downloadUrlsJson: string;
  installScript: string;
  startScript: string;
  stopScript: string;
  restartScript: string;
  statusScript: string;
  logPathsJson: string;
  configPathsJson: string;
  metadataJson: string;
}>({
  versionName: "",
  enabled: true,
  downloadUrlsJson: "[]",
  installScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  logPathsJson: "[]",
  configPathsJson: "[]",
  metadataJson: "{}",
});

const {
  state: operationStateRef,
  latest: operationLatest,
  lines: operationLines,
  connect: connectOperation,
  disconnect: disconnectOperation,
} = useSoftOperationStream();

const installForm = reactive<SoftInstallRequest>({
  softPackageId: 0,
  softPackageVersionId: 0,
  softTargetId: 0,
  installationName: "",
  installPath: "",
  serviceName: "",
  installOptions,
  serviceOptions,
  configOptions,
});

const operationState = computed(() => operationStateRef.value);

const variantTokenSet = new Set([
  "windows",
  "win",
  "linux",
  "mac",
  "macos",
  "darwin",
  "amd64",
  "arm64",
  "aarch64",
  "x64",
  "x86_64",
  "x86",
]);

const compactText = (value?: string | null) =>
  String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const stripVariantTokens = (value?: string | null) => {
  const normalized = compactText(value);
  if (!normalized) {
    return "";
  }
  const stripped = normalized
    .split(" ")
    .filter((part) => !variantTokenSet.has(part.toLowerCase()))
    .join(" ")
    .trim();
  return stripped || normalized;
};

const normalizeSoftwareKey = (value?: string | null) =>
  compactText(value)
    .toLowerCase()
    .split(" ")
    .filter((part) => !variantTokenSet.has(part))
    .join("-");

const softwareDisplayName = (item: SoftPackage) =>
  stripVariantTokens(item.packageName) || item.packageName;

const softwareDisplayCode = (item: SoftPackage) =>
  normalizeSoftwareKey(item.packageCode) ||
  normalizeSoftwareKey(item.packageName) ||
  item.profileCode ||
  item.packageCode;

const buildCatalogPlatforms = (variants: SoftPackage[]) => {
  const platformMap = new Map<string, CatalogPlatform>();
  for (const variant of variants) {
    const osType = normalizeOs(variant.osType) || "generic";
    if (!platformMap.has(osType)) {
      platformMap.set(osType, {
        value: osType,
        label: osLabel(osType) || "通用系统",
        icon: osIcon(osType),
        description: "",
        architectures: [],
        variants: [],
      });
    }
    const platform = platformMap.get(osType)!;
    platform.variants.push(variant);
    const arch = normalizeArch(variant.architecture);
    if (arch && !platform.architectures.includes(arch)) {
      platform.architectures.push(arch);
    }
  }
  return Array.from(platformMap.values()).map((platform) => ({
    ...platform,
    description: `${platform.label}${platform.architectures.length ? ` · ${platform.architectures.map((item) => architectureLabel(item)).join(" / ")}` : ""}`,
    variants: [...platform.variants].sort((left, right) =>
      architectureLabel(left.architecture).localeCompare(
        architectureLabel(right.architecture),
      ),
    ),
  }));
};

const catalogSoftwares = computed<CatalogSoftware[]>(() => {
  const mapping = new Map<string, CatalogSoftware>();
  for (const item of packages.value) {
    const softwareKey =
      normalizeSoftwareKey(item.softwareKey) ||
      softwareDisplayCode(item) ||
      String(item.softPackageId || "");
    if (!mapping.has(softwareKey)) {
      mapping.set(softwareKey, {
        softwareKey,
        packageName: softwareDisplayName(item),
        packageCode: softwareDisplayCode(item),
        packageCategory: item.packageCategory,
        profileCode: item.profileCode,
        description: item.description,
        iconUrl: item.iconUrl,
        variants: [],
        platforms: [],
        architectures: [],
      });
    }
    const software = mapping.get(softwareKey)!;
    software.variants.push(item);
    if (!software.description && item.description) {
      software.description = item.description;
    }
    if (!software.iconUrl && item.iconUrl) {
      software.iconUrl = item.iconUrl;
    }
  }
  return Array.from(mapping.values())
    .map((software) => {
      const platforms = buildCatalogPlatforms(software.variants);
      const architectures = Array.from(
        new Set(
          software.variants
            .map((item) => normalizeArch(item.architecture))
            .filter(Boolean),
        ),
      );
      return {
        ...software,
        variants: [...software.variants].sort((left, right) => {
          const osCompare = osLabel(left.osType).localeCompare(
            osLabel(right.osType),
          );
          if (osCompare !== 0) {
            return osCompare;
          }
          return architectureLabel(left.architecture).localeCompare(
            architectureLabel(right.architecture),
          );
        }),
        platforms,
        architectures,
      };
    })
    .sort((left, right) => left.packageName.localeCompare(right.packageName));
});

const visibleSoftwareVariants = (
  software: CatalogSoftware,
  osType = osFilter.value,
  architecture = architectureFilter.value,
) =>
  software.variants.filter(
    (item) =>
      (!osType || normalizeOs(item.osType) === osType) &&
      (!architecture || normalizeArch(item.architecture) === architecture),
  );

const filteredPackages = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  return catalogSoftwares.value.filter(
    (item) =>
      (!text ||
        [
          item.packageName,
          item.packageCode,
          item.packageCategory,
          item.profileCode,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text))) &&
      visibleSoftwareVariants(item).length > 0,
  );
});

const osFilterOptions = computed(() =>
  Array.from(
    new Set(
      packages.value.map((item) => normalizeOs(item.osType)).filter(Boolean),
    ),
  ).map((value) => ({
    value,
    label: osLabel(value),
  })),
);

const architectureFilterOptions = computed(() =>
  Array.from(
    new Set(
      packages.value
        .map((item) => normalizeArch(item.architecture))
        .filter(Boolean),
    ),
  ).map((value) => ({
    value,
    label: architectureLabel(value),
  })),
);

const enabledServerCount = computed(
  () => servers.value.filter((item) => item.enabled !== false).length,
);

const enabledRepositoryCount = computed(
  () => repositories.value.filter((item) => item.enabled !== false).length,
);

const normalizedSelectedVariantPackageId = computed(() => {
  return toNumericId(selectedVariantPackageId.value);
});

const selectedServers = computed(() =>
  servers.value.filter((item) =>
    selectedServerIds.value.includes(item.serverId || -1),
  ),
);

const selectedIngestRepository = computed(
  () =>
    repositories.value.find(
      (item) => item.softRepositoryId === ingestForm.softRepositoryId,
    ) || null,
);

const ingestUsesUpload = computed(
  () => selectedIngestRepository.value?.repositoryType === "LOCAL_DIR",
);

const installPlatformOptions = computed(() =>
  (selectedSoftware.value?.platforms || []).map((platform) => ({
    value: platform.value,
    label: platform.label,
    icon: platform.icon,
    description: platform.architectures.length
      ? platform.architectures
          .map((item) => architectureLabel(item))
          .join(" / ")
      : "通用架构",
  })),
);

const selectedPlatformVariants = computed(() =>
  (selectedSoftware.value?.variants || []).filter(
    (item) =>
      !selectedOsType.value ||
      normalizeOs(item.osType) === selectedOsType.value,
  ),
);

const editingPackage = computed(
  () =>
    editingSoftware.value?.variants.find(
      (item) =>
        toNumericId(item.softPackageId) === toNumericId(editingPackageId.value),
    ) || null,
);

const selectedVariantOptions = computed(() =>
  selectedPlatformVariants.value.map((item) => ({
    value: item.softPackageId!,
    label: `${architectureLabel(item.architecture)} · ${item.packageCode}`,
  })),
);

const matchedServerOptions = computed<ServerSelectOption[]>(() =>
  matchedServers.value.map((server) => ({
    value: server.serverId!,
    label: server.serverName,
    icon: targetTypeIcon(server.serverType),
    host: server.host,
    port: server.port,
    osType: server.osType,
    architecture: server.architecture,
    targetTypeLabel: targetTypeLabel(server.serverType),
    baseDirectory: server.baseDirectory,
    description: server.description,
  })),
);

const guideSections = computed<GuideSection[]>(() => [
  {
    key: "install",
    title: "基础安装",
    hint: "安装目录、端口和初始化参数",
    scope: "install",
    fields: groupAndSortFields(guide.value?.installFields, [
      "基础安装",
      "目录与端口",
      "账号凭证",
    ]),
  },
  {
    key: "config",
    title: "配置初始化",
    hint: "初始化配置模板和配置文件参数",
    scope: "config",
    fields: groupAndSortFields(guide.value?.configFields, ["配置初始化"]),
  },
  {
    key: "service",
    title: "服务引导",
    hint: "服务注册、服务启动和运行控制参数",
    scope: "service",
    fields: groupAndSortFields(guide.value?.serviceFields, ["服务引导"]),
  },
]);

const previewPaths = computed(() => {
  const values = new Set<string>();
  previewResult.value?.configPaths?.forEach((item) => item && values.add(item));
  previewResult.value?.logPaths?.forEach((item) => item && values.add(item));
  return Array.from(values);
});

const selectedVersionLabel = computed(() => {
  const version = versions.value.find(
    (item) =>
      toNumericId(item.softPackageVersionId) ===
      toNumericId(installForm.softPackageVersionId),
  );
  return version ? `${version.versionName} (${version.versionCode})` : "-";
});

const activeTask = computed(
  () =>
    batchTasks.value.find(
      (item) => item.operationId === activeOperationId.value,
    ) || null,
);

const activeTaskOutput = computed(() => {
  const operationId = activeOperationId.value;
  if (operationId && taskLogs.value[operationId]?.length) {
    return taskLogs.value[operationId].join("\n");
  }
  return activeTask.value?.message || "等待安装日志...";
});

const clearOperationPoller = () => {
  if (operationPollTimer) {
    window.clearTimeout(operationPollTimer);
    operationPollTimer = undefined;
  }
};

const isFinishedStatus = (status?: string) =>
  status === "SUCCESS" || status === "FAILED";

const normalizeOs = (value?: string | null) => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) {
    return "";
  }
  if (text.includes("win")) {
    return "windows";
  }
  if (text.includes("linux")) {
    return "linux";
  }
  if (text.includes("mac") || text.includes("darwin")) {
    return "macos";
  }
  return text;
};

const normalizeArch = (value?: string | null) => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) {
    return "";
  }
  if (["x64", "x86_64", "amd64"].includes(text)) {
    return "amd64";
  }
  if (["arm64", "aarch64"].includes(text)) {
    return "arm64";
  }
  return text;
};

const osLabel = (value?: string | null) =>
  normalizeOs(value) === "windows"
    ? "Windows"
    : normalizeOs(value) === "linux"
      ? "Linux"
      : normalizeOs(value) === "macos"
        ? "macOS"
        : value || "";

const osIcon = (value?: string | null) =>
  normalizeOs(value) === "windows"
    ? "ri:windows-line"
    : normalizeOs(value) === "linux"
      ? "ri:ubuntu-line"
      : normalizeOs(value) === "macos"
        ? "ri:apple-line"
        : "ri:apps-2-line";

const targetTypeLabel = (value?: string | null) =>
  value === "LOCAL"
    ? "本机"
    : value === "SSH"
      ? "SSH"
      : value === "WINRM"
        ? "WinRM"
        : value || "-";

const targetTypeIcon = (value?: string | null) =>
  value === "LOCAL"
    ? "ri:computer-line"
    : value === "SSH"
      ? "ri:terminal-box-line"
      : value === "WINRM"
        ? "ri:remote-control-line"
        : "ri:server-line";

const architectureLabel = (value?: string | null) => {
  const normalized = normalizeArch(value);
  if (!normalized) {
    return "通用架构";
  }
  if (normalized === "amd64") {
    return "AMD64";
  }
  if (normalized === "arm64") {
    return "ARM64";
  }
  return String(value || normalized).toUpperCase();
};

const profileLabel = (value?: string | null) =>
  value === "mysql"
    ? "MySQL 画像"
    : value === "redis"
      ? "Redis 画像"
      : value === "nginx"
        ? "Nginx 画像"
        : value === "minio"
          ? "MinIO 画像"
          : value === "generic" || !value
            ? "通用画像"
            : `${String(value).toUpperCase()} 画像`;

const operationStatusLabel = (value?: string | null) =>
  value === "SUCCESS"
    ? "成功"
    : value === "FAILED"
      ? "失败"
      : value === "RUNNING"
        ? "执行中"
        : value === "PENDING"
          ? "待执行"
          : value === "CANCELLED"
            ? "已取消"
            : value || "待执行";

const stageLabel = (value?: string | null) =>
  value === "PREPARE"
    ? "准备"
    : value === "VALIDATE"
      ? "校验"
      : value === "RENDER"
        ? "渲染"
        : value === "CONFIGURE"
          ? "配置"
          : value === "BACKUP"
            ? "备份"
            : value === "DOWNLOAD"
              ? "下载"
              : value === "INSTALL"
                ? "安装"
                : value === "UNINSTALL"
                  ? "卸载"
                  : value === "EXECUTE"
                    ? "执行"
                    : value === "WRITE"
                      ? "写入"
                      : value === "SERVICE_GUIDE"
                        ? "服务引导"
                        : value === "VERIFY"
                          ? "校验结果"
                          : value === "FINISH"
                            ? "完成"
                            : value || "准备";

const packageInitials = (value?: string | null) =>
  String(value || "SO")
    .trim()
    .slice(0, 2)
    .toUpperCase();

const matchPackageServer = (
  softPackage: SoftPackage | null,
  server: ServerHost,
) => {
  if (!softPackage) {
    return true;
  }
  const packageOs = normalizeOs(softPackage.osType);
  const serverOs = normalizeOs(server.osType);
  if (packageOs && serverOs && packageOs !== serverOs) {
    return false;
  }
  const packageArch = normalizeArch(softPackage.architecture);
  const serverArch = normalizeArch(server.architecture);
  if (packageArch && serverArch && packageArch !== serverArch) {
    return false;
  }
  return true;
};

const resolvePreferredVariant = (
  software: CatalogSoftware | null,
  preferredOs = osFilter.value,
  preferredArchitecture = architectureFilter.value,
) => {
  if (!software) {
    return null;
  }
  const visibleVariants = visibleSoftwareVariants(
    software,
    preferredOs,
    preferredArchitecture,
  );
  if (visibleVariants.length) {
    return visibleVariants[0];
  }
  const osMatched = software.variants.filter(
    (item) => !preferredOs || normalizeOs(item.osType) === preferredOs,
  );
  if (osMatched.length) {
    return osMatched[0];
  }
  return software.variants[0] || null;
};

const matchedServers = computed(() =>
  servers.value.filter(
    (server) =>
      server.enabled !== false &&
      matchPackageServer(selectedPackage.value, server),
  ),
);

const compatibleServerCount = (software: CatalogSoftware) =>
  servers.value.filter(
    (server) =>
      server.enabled !== false &&
      visibleSoftwareVariants(software).some((variant) =>
        matchPackageServer(variant, server),
      ),
  ).length;

const readMetadata = (value?: string) => {
  if (!value) {
    return {};
  }
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const buildSoftTargetPayload = (server: ServerHost): SoftTarget => ({
  targetName: server.serverName,
  targetCode: `server-${server.serverId}`,
  targetType: server.serverType,
  osType: server.osType,
  architecture: server.architecture,
  host: server.serverType === "LOCAL" ? "127.0.0.1" : server.host,
  port: server.port,
  username: server.username,
  password: server.password,
  privateKey: server.privateKey,
  baseDirectory: server.baseDirectory,
  enabled: server.enabled,
  description: server.description,
  metadataJson: JSON.stringify({
    source: "server-host",
    serverId: server.serverId,
    serverCode: server.serverCode,
  }),
});

const findExistingSoftTarget = (server: ServerHost) =>
  softTargets.value.find((target) => {
    const metadata = readMetadata(target.metadataJson);
    return (
      String(metadata.serverId || "") === String(server.serverId || "") ||
      target.targetCode === `server-${server.serverId}`
    );
  });

const ensureSoftTargetForServer = async (server: ServerHost) => {
  const payload = buildSoftTargetPayload(server);
  const existing = findExistingSoftTarget(server);
  if (existing?.softTargetId) {
    const result = await updateSoftTarget(existing.softTargetId, {
      ...payload,
      softTargetId: existing.softTargetId,
    });
    const saved = result.data;
    softTargets.value = softTargets.value.map((item) =>
      item.softTargetId === saved.softTargetId ? saved : item,
    );
    return saved.softTargetId!;
  }
  const result = await createSoftTarget(payload);
  const saved = result.data;
  softTargets.value = [saved, ...softTargets.value];
  return saved.softTargetId!;
};

const updateTaskFromRecord = (record: SoftOperationLog) => {
  batchTasks.value = batchTasks.value.map((task) =>
    task.operationId === record.softOperationLogId
      ? {
          ...task,
          installationId: record.softInstallationId,
          status: record.operationStatus,
          stage: record.operationStage,
          progressPercent: record.progressPercent,
          message:
            record.detailMessage ||
            record.operationOutput ||
            record.operationMessage ||
            task.message,
        }
      : task,
  );
};

const refreshOperationTasks = async () => {
  if (!batchTasks.value.length) {
    clearOperationPoller();
    return;
  }
  const result = await listSoftOperationLogs();
  const mapping = new Map(
    (result.data || []).map((item) => [item.softOperationLogId, item]),
  );
  batchTasks.value.forEach((task) => {
    const record = mapping.get(task.operationId);
    if (record) {
      updateTaskFromRecord(record);
    }
  });
  if (batchTasks.value.some((task) => !isFinishedStatus(task.status))) {
    operationPollTimer = window.setTimeout(() => {
      void refreshOperationTasks();
    }, 1500);
  }
};

const selectTask = (operationId?: number | null) => {
  if (!operationId) {
    return;
  }
  activeOperationId.value = operationId;
  connectOperation(operationId);
};

const selectAllMatchedServers = () => {
  selectedServerIds.value = matchedServers.value
    .map((server) => server.serverId!)
    .filter(Boolean);
};

const clearSelectedServers = () => {
  selectedServerIds.value = [];
};

const loadPackages = async () => {
  loading.value = true;
  try {
    const [packageResult, repositoryResult, targetResult, serverResult] =
      await Promise.all([
        listSoftPackages(),
        listSoftRepositories(),
        listSoftTargets(),
        listServerHosts({ enabled: true }),
      ]);
    packages.value = packageResult.data || [];
    repositories.value = repositoryResult.data || [];
    softTargets.value = targetResult.data || [];
    servers.value = Array.isArray(serverResult.data) ? serverResult.data : [];
  } finally {
    loading.value = false;
  }
};

const openIngestDialog = () => {
  const repository =
    repositories.value.find((item) => item.enabled !== false) ||
    repositories.value[0] ||
    null;
  ingestForm.softRepositoryId = repository?.softRepositoryId || 0;
  ingestForm.mode =
    repository?.repositoryType === "LOCAL_DIR" ? "upload" : "sync";
  ingestUploadFiles.value = [];
  ingestVisible.value = true;
};

const handleIngestFileChange = (_file: UploadUserFile, files: UploadUserFile[]) => {
  ingestUploadFiles.value = [...files];
};

const handleIngestFileRemove = (_file: UploadUserFile, files: UploadUserFile[]) => {
  ingestUploadFiles.value = [...files];
};

const submitIngest = async () => {
  const repositoryId = ingestForm.softRepositoryId;
  if (!repositoryId) {
    message("请先选择仓库", { type: "warning" });
    return;
  }
  ingesting.value = true;
  try {
    const beforeIds = new Set(
      packages.value
        .map((item) => item.softPackageId)
        .filter((item): item is number => Number.isFinite(Number(item))),
    );
    if (ingestUsesUpload.value) {
      const files = ingestUploadFiles.value
        .map((item) => item.raw)
        .filter((item): item is File => item instanceof File);
      if (!files.length) {
        message("本地目录仓库请至少选择一个安装包", { type: "warning" });
        return;
      }
      await uploadSoftRepositoryArtifacts(repositoryId, files);
    } else {
      await syncSoftRepository(repositoryId);
    }
    await loadPackages();
    const addedCount = packages.value.filter(
      (item) => item.softPackageId && !beforeIds.has(item.softPackageId),
    ).length;
    message(
      ingestUsesUpload.value
        ? `软件录入完成，新增 ${addedCount} 个软件包版本`
        : `仓库同步完成，新增 ${addedCount} 个软件包版本`,
      { type: "success" },
    );
    ingestVisible.value = false;
  } finally {
    ingesting.value = false;
  }
};

const openDetail = (software: CatalogSoftware) => {
  const variant = resolvePreferredVariant(software);
  if (!variant?.softPackageId) {
    return;
  }
  router.push(`/soft/detail/${variant.softPackageId}`);
};

const patchPackageEditForm = (softPackage: SoftPackage | null) => {
  packageEditForm.packageName = softPackage?.packageName || "";
  packageEditForm.packageCategory = softPackage?.packageCategory || "";
  packageEditForm.description = softPackage?.description || "";
  packageEditForm.iconUrl = softPackage?.iconUrl || "";
  packageEditForm.profileCode = softPackage?.profileCode || "";
};

const patchVersionEditForm = (version: SoftPackageVersion | null) => {
  versionEditForm.versionName = version?.versionName || "";
  versionEditForm.enabled = version?.enabled !== false;
  versionEditForm.downloadUrlsJson = version?.downloadUrlsJson || "[]";
  versionEditForm.installScript = version?.installScript || "";
  versionEditForm.startScript = version?.startScript || "";
  versionEditForm.stopScript = version?.stopScript || "";
  versionEditForm.restartScript = version?.restartScript || "";
  versionEditForm.statusScript = version?.statusScript || "";
  versionEditForm.logPathsJson = version?.logPathsJson || "[]";
  versionEditForm.configPathsJson = version?.configPathsJson || "[]";
  versionEditForm.metadataJson = version?.metadataJson || "{}";
};

const openPackageEdit = async (software: CatalogSoftware) => {
  const variant = resolvePreferredVariant(software) || software.variants[0] || null;
  if (!variant?.softPackageId) {
    return;
  }
  editingSoftware.value = software;
  editingPackageId.value = variant.softPackageId;
  patchPackageEditForm(variant);
  editingVersions.value = await loadPackageVersions(variant.softPackageId, true);
  editVisible.value = true;
};

const handleEditingPackageChange = async (
  value: string | number | Array<string | number>,
) => {
  const packageId = Array.isArray(value) ? Number(value[0]) : Number(value);
  const nextPackage =
    editingSoftware.value?.variants.find(
      (item) => item.softPackageId === packageId,
    ) || null;
  editingPackageId.value = nextPackage?.softPackageId || null;
  patchPackageEditForm(nextPackage);
  editingVersions.value = nextPackage?.softPackageId
    ? await loadPackageVersions(nextPackage.softPackageId, true)
    : [];
};

const submitPackageEdit = async () => {
  if (!editingPackage.value?.softPackageId) {
    return;
  }
  editSaving.value = true;
  try {
    await updateSoftPackage(editingPackage.value.softPackageId, {
      packageName: packageEditForm.packageName,
      packageCategory: packageEditForm.packageCategory,
      description: packageEditForm.description,
      iconUrl: packageEditForm.iconUrl,
      profileCode: packageEditForm.profileCode,
    });
    await loadPackages();
    message("软件元数据已更新", { type: "success" });
    editVisible.value = false;
  } finally {
    editSaving.value = false;
  }
};

const openVersionEdit = (version: SoftPackageVersion) => {
  editingVersionId.value = version.softPackageVersionId || null;
  patchVersionEditForm(version);
  versionEditVisible.value = true;
};

const submitVersionEdit = async () => {
  if (!editingPackage.value?.softPackageId || !editingVersionId.value) {
    return;
  }
  editSaving.value = true;
  try {
    await updateSoftPackageVersion(
      editingPackage.value.softPackageId,
      editingVersionId.value,
      {
        versionName: versionEditForm.versionName,
        enabled: versionEditForm.enabled,
        downloadUrlsJson: versionEditForm.downloadUrlsJson,
        installScript: versionEditForm.installScript,
        startScript: versionEditForm.startScript,
        stopScript: versionEditForm.stopScript,
        restartScript: versionEditForm.restartScript,
        statusScript: versionEditForm.statusScript,
        logPathsJson: versionEditForm.logPathsJson,
        configPathsJson: versionEditForm.configPathsJson,
        metadataJson: versionEditForm.metadataJson,
      },
    );
    editingVersions.value = await loadPackageVersions(
      editingPackage.value.softPackageId,
      true,
    );
    await loadPackages();
    message("版本元数据已更新", { type: "success" });
    versionEditVisible.value = false;
  } finally {
    editSaving.value = false;
  }
};

const openInstallationDetail = (task: BatchInstallTask) => {
  if (!task.installationId || !selectedPackage.value?.softPackageId) {
    return;
  }
  router.push(
    `/soft/detail/${selectedPackage.value.softPackageId}?installationId=${task.installationId}`,
  );
};

const applyFieldDefaults = (
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
    if (isBooleanField(field)) {
      model[field.fieldKey] = false;
    }
  }
};

const resolvePreviewTargetId = () => {
  const firstServer = selectedServers.value[0];
  if (!firstServer) {
    return undefined;
  }
  return findExistingSoftTarget(firstServer)?.softTargetId;
};

const loadPackageVersions = async (softPackageId: number, force = false) => {
  const cached = versionCache.get(softPackageId);
  if (cached && !force) {
    return cached;
  }
  const detailResult = await getSoftPackageDetail(softPackageId);
  const nextVersions = detailResult.data?.versions || [];
  versionCache.set(softPackageId, nextVersions);
  return nextVersions;
};

const applySelectedPackage = async (
  nextPackage: SoftPackage | null,
  preserveVersion = false,
) => {
  selectedPackage.value = nextPackage;
  installForm.softPackageId = nextPackage?.softPackageId || 0;
  previewResult.value = null;
  if (!nextPackage?.softPackageId) {
    versions.value = [];
    installForm.softPackageVersionId = 0;
    guide.value = null;
    return;
  }
  const nextVersions = await loadPackageVersions(nextPackage.softPackageId);
  versions.value = nextVersions;
  const keepCurrentVersion =
    preserveVersion &&
    nextVersions.some(
      (item) => item.softPackageVersionId === installForm.softPackageVersionId,
    );
  installForm.softPackageVersionId = keepCurrentVersion
    ? installForm.softPackageVersionId
    : nextVersions[0]?.softPackageVersionId || 0;
};

const handlePlatformChange = async (
  value: string | number | Array<string | number>,
) => {
  const osType = Array.isArray(value)
    ? String(value[0] || "")
    : String(value || "");
  selectedOsType.value = osType;
  const nextPackage =
    selectedPlatformVariants.value.find(
      (item) =>
        toNumericId(item.softPackageId) === normalizedSelectedVariantPackageId.value,
    ) ||
    resolvePreferredVariant(
      selectedSoftware.value,
      osType,
      architectureFilter.value,
    ) ||
    selectedPlatformVariants.value[0] ||
    null;
  selectedVariantPackageId.value = nextPackage?.softPackageId || null;
  await applySelectedPackage(nextPackage, false);
};

const handleVariantChange = async (
  value: string | number | Array<string | number>,
) => {
  const packageId = Array.isArray(value) ? Number(value[0]) : Number(value);
  const nextPackage =
    selectedPlatformVariants.value.find(
      (item) => toNumericId(item.softPackageId) === packageId,
    ) || null;
  selectedVariantPackageId.value = nextPackage?.softPackageId || null;
  await applySelectedPackage(nextPackage, true);
};

const reloadGuide = async () => {
  if (
    !selectedPackage.value?.softPackageId ||
    !installForm.softPackageVersionId
  ) {
    guide.value = null;
    return;
  }
  guideLoading.value = true;
  try {
    const result = await getSoftVersionGuide(
      selectedPackage.value.softPackageId,
      installForm.softPackageVersionId,
      { targetId: resolvePreviewTargetId() },
    );
    guide.value = result.data || null;
    applyFieldDefaults(guide.value?.installFields, installOptions);
    applyFieldDefaults(guide.value?.serviceFields, serviceOptions);
    applyFieldDefaults(guide.value?.configFields, configOptions);
    previewResult.value = null;
  } finally {
    guideLoading.value = false;
  }
};

const openInstall = async (item: CatalogSoftware) => {
  selectedSoftware.value = item;
  installStep.value = 0;
  installForm.softPackageId = 0;
  installForm.softPackageVersionId = 0;
  installForm.installationName = item.packageName;
  installForm.installPath = "";
  installForm.serviceName = item.packageCode;
  batchTasks.value = [];
  activeOperationId.value = null;
  taskLogs.value = {};
  selectedServerIds.value = [];
  guide.value = null;
  previewResult.value = null;
  installVisible.value = true;

  const preferredVariant = resolvePreferredVariant(item);
  if (!preferredVariant) {
    await ElMessageBox.alert("该软件当前没有可安装的平台版本。", "无法安装", {
      type: "warning",
    });
    installVisible.value = false;
    return;
  }
  selectedOsType.value = normalizeOs(preferredVariant.osType);
  selectedVariantPackageId.value = preferredVariant.softPackageId || null;
  await applySelectedPackage(preferredVariant, false);
  if (!versions.value.length) {
    await ElMessageBox.alert("该软件当前没有可安装版本。", "无法安装", {
      type: "warning",
    });
    installVisible.value = false;
    return;
  }
  selectedServerIds.value = matchedServers.value
    .slice(0, 1)
    .map((server) => server.serverId!)
    .filter(Boolean);
  await reloadGuide();
};

const previewGuide = async () => {
  if (!selectedPackage.value?.softPackageId) {
    return;
  }
  previewing.value = true;
  try {
    const result = await previewSoftPackageGuide(
      selectedPackage.value.softPackageId,
      {
        softPackageVersionId: installForm.softPackageVersionId,
        softTargetId: resolvePreviewTargetId(),
        installationName: installForm.installationName,
        installPath: installForm.installPath,
        serviceName: installForm.serviceName,
        installOptions: { ...installOptions },
        serviceOptions: { ...serviceOptions },
        configOptions: { ...configOptions },
      },
    );
    previewResult.value = result.data || null;
    message("已生成安装预览", { type: "success" });
  } finally {
    previewing.value = false;
  }
};

const submitInstall = async () => {
  if (
    !selectedPackage.value?.softPackageId ||
    !selectedServerIds.value.length
  ) {
    message("请至少选择一台服务器", { type: "warning" });
    return;
  }
  installing.value = true;
  batchTasks.value = [];
  taskLogs.value = {};
  try {
    for (const serverId of selectedServerIds.value) {
      try {
        const serverResult = await getServerHost(serverId);
        const server = serverResult.data;
        const softTargetId = await ensureSoftTargetForServer(server);
        const installResult = await installSoftPackage({
          ...installForm,
          softTargetId,
          installOptions: { ...installOptions },
          serviceOptions: { ...serviceOptions },
          configOptions: { ...configOptions },
        });
        const ticket = installResult.data;
        if (!ticket?.operationId) {
          continue;
        }
        batchTasks.value = [
          ...batchTasks.value,
          {
            taskKey: `${serverId}-${ticket.operationId}`,
            serverId,
            serverName: server.serverName,
            operationId: ticket.operationId,
            installationId: ticket.installationId,
            status: ticket.operationStatus,
            stage: "PREPARE",
            progressPercent: 0,
            message: `安装任务已提交到 ${server.serverName}`,
          },
        ];
      } catch (error) {
        message(`服务器 ${serverId} 安装提交失败`, { type: "error" });
        console.error(error);
      }
    }
    if (batchTasks.value.length) {
      operationVisible.value = true;
      installStep.value = 2;
      selectTask(batchTasks.value[0].operationId);
      clearOperationPoller();
      void refreshOperationTasks();
      message(`已提交 ${batchTasks.value.length} 个安装任务`, {
        type: "success",
      });
    }
  } finally {
    installing.value = false;
  }
};

const resolveModel = (scope: GuideScope) => {
  if (scope === "service") {
    return serviceOptions;
  }
  if (scope === "config") {
    return configOptions;
  }
  return installOptions;
};

const updateBooleanModel = (
  scope: GuideScope,
  fieldKey: string,
  value: string | number | boolean,
) => {
  resolveModel(scope)[fieldKey] = Boolean(value);
};

const normalizeOptions = (
  options?: Array<Record<string, unknown>>,
): GuideOption[] =>
  (options || []).map((item) => ({
    label: String(item.label ?? item.name ?? item.text ?? item.value ?? "-"),
    value: item.value ?? item.key ?? item.code ?? item.label,
  }));

const groupAndSortFields = (
  fields: SoftGuideField[] | undefined,
  preferredGroups: string[],
) => {
  const groupOrder = new Map(
    preferredGroups.map((item, index) => [item, index]),
  );
  return [...(fields || [])].sort((left, right) => {
    const leftGroup =
      groupOrder.get(left.groupName || "") ?? preferredGroups.length;
    const rightGroup =
      groupOrder.get(right.groupName || "") ?? preferredGroups.length;
    if (leftGroup !== rightGroup) {
      return leftGroup - rightGroup;
    }
    if ((left.sortOrder || 0) !== (right.sortOrder || 0)) {
      return (left.sortOrder || 0) - (right.sortOrder || 0);
    }
    return String(left.fieldKey || "").localeCompare(
      String(right.fieldKey || ""),
    );
  });
};

const conditionState = computed<Record<string, unknown>>(() => ({
  ...installOptions,
  ...serviceOptions,
  ...configOptions,
  targetType: selectedServers.value[0]?.serverType,
  targetOsType: selectedServers.value[0]?.osType,
  profileCode: guide.value?.profileCode,
}));

const readConditionValue = (
  source: Record<string, unknown>,
  keys: string[],
) => {
  for (const key of keys) {
    if (key in source) {
      return source[key];
    }
  }
  return undefined;
};

const conditionMatches = (condition?: Record<string, unknown>) => {
  if (!condition || !Object.keys(condition).length) {
    return true;
  }
  const source = conditionState.value;
  const fieldKey = String(
    condition.fieldKey ?? condition.dependsOn ?? condition.key ?? "",
  );
  const actual = readConditionValue(
    source,
    [fieldKey, String(condition.targetPath ?? "")].filter(Boolean),
  );
  if (condition.equals !== undefined) {
    return actual === condition.equals;
  }
  if (condition.notEquals !== undefined) {
    return actual !== condition.notEquals;
  }
  if (Array.isArray(condition.in)) {
    return condition.in.includes(actual);
  }
  if (Array.isArray(condition.notIn)) {
    return !condition.notIn.includes(actual);
  }
  if (condition.truthy !== undefined) {
    return Boolean(actual) === Boolean(condition.truthy);
  }
  return true;
};

const shouldRenderField = (field: SoftGuideField) => {
  const metadata = field.metadata || {};
  const visibleCondition =
    (metadata.visibleCondition as Record<string, unknown> | undefined) ||
    field.condition;
  return conditionMatches(visibleCondition);
};

const isFieldDisabled = (field: SoftGuideField) => {
  const metadata = field.metadata || {};
  const disabled = metadata.disabled;
  if (typeof disabled === "boolean") {
    return disabled;
  }
  const disabledCondition = metadata.disabledCondition as
    | Record<string, unknown>
    | undefined;
  return disabledCondition ? conditionMatches(disabledCondition) : false;
};

const isTextareaField = (field: SoftGuideField) =>
  ["textarea", "code", "json", "script"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isNumberField = (field: SoftGuideField) =>
  ["number", "port", "integer"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isBooleanField = (field: SoftGuideField) =>
  ["switch", "boolean", "checkbox"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isPasswordField = (field: SoftGuideField) =>
  ["password", "secret"].includes(
    String(field.componentType || "").toLowerCase(),
  ) ||
  ["password", "token", "secret"].some((item) =>
    String(field.fieldKey || "")
      .toLowerCase()
      .includes(item),
  );

const numberValidation = (
  validation: Record<string, unknown> | undefined,
  key: "min" | "max",
) => {
  const value = validation?.[key];
  if (typeof value === "number") {
    return value;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

watch(
  () => [installForm.softPackageVersionId, installVisible.value],
  async ([versionId, visible], [oldVersionId, oldVisible]) => {
    if (!visible || !selectedPackage.value?.softPackageId) {
      return;
    }
    if (versionId === oldVersionId && visible === oldVisible) {
      return;
    }
    await reloadGuide();
  },
);

watch(matchedServers, (current) => {
  const validIds = new Set(current.map((item) => item.serverId));
  selectedServerIds.value = selectedServerIds.value.filter((id) =>
    validIds.has(id),
  );
  if (!selectedServerIds.value.length && current.length) {
    selectedServerIds.value = [current[0].serverId!];
  }
});

watch(
  () => selectedIngestRepository.value?.repositoryType,
  (repositoryType) => {
    if (!repositoryType) {
      return;
    }
    ingestForm.mode = repositoryType === "LOCAL_DIR" ? "upload" : "sync";
    if (repositoryType !== "LOCAL_DIR") {
      ingestUploadFiles.value = [];
    }
  },
);

watch(
  operationLines,
  (value) => {
    if (!activeOperationId.value) {
      return;
    }
    taskLogs.value = {
      ...taskLogs.value,
      [activeOperationId.value]: [...value],
    };
  },
  { deep: true },
);

watch(
  operationLatest,
  (payload) => {
    if (!payload?.operationId) {
      return;
    }
    batchTasks.value = batchTasks.value.map((task) =>
      task.operationId === payload.operationId
        ? {
            ...task,
            installationId: payload.installationId || task.installationId,
            status: payload.status || task.status,
            stage: payload.stage || task.stage,
            progressPercent: payload.progressPercent ?? task.progressPercent,
            message: payload.detail || payload.message || task.message,
          }
        : task,
    );
  },
  { deep: true },
);

watch(
  () => operationVisible.value,
  (visible) => {
    if (!visible) {
      disconnectOperation();
    }
  },
);

watch(
  () => editVisible.value,
  (visible) => {
    if (!visible) {
      editingSoftware.value = null;
      editingPackageId.value = null;
      editingVersions.value = [];
    }
  },
);

onMounted(loadPackages);
onUnmounted(() => {
  clearOperationPoller();
  disconnectOperation();
});
</script>

<style scoped lang="scss">
.soft-toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1.2fr) 180px 180px auto;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.soft-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.soft-toolbar__meta {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 12px;
}

.soft-card-table {
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
}

.soft-card {
  display: grid;
  position: relative;
  isolation: isolate;
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
  overflow: hidden;
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.08),
    0 1px 0 rgba(255, 255, 255, 0.8) inset;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.soft-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at top right,
      rgba(14, 165, 233, 0.14),
      transparent 38%
    ),
    linear-gradient(135deg, rgba(255, 255, 255, 0.35), transparent 46%);
}

.soft-card > * {
  position: relative;
  z-index: 1;
}

.soft-card:hover {
  transform: translateY(-4px);
  border-color: rgba(14, 165, 233, 0.24);
  box-shadow:
    0 24px 42px rgba(15, 23, 42, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.86) inset;
}

.soft-card__header,
.soft-card__actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.soft-card__title {
  display: flex;
  gap: 12px;
  min-width: 0;
}

.soft-card__title h3,
.soft-card__title p {
  margin: 0;
}

.soft-card__title h3 {
  color: #0f172a;
  font-size: 18px;
}

.soft-card__title p {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.soft-card__avatar {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, #0f172a, #0ea5e9);
  color: #f8fafc;
  font-weight: 700;
  overflow: hidden;
}

.soft-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.soft-card__badges,
.soft-card__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.soft-chip,
.soft-card__meta span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}

.soft-chip {
  min-width: 30px;
  padding: 0 8px;
}

.soft-chip--platform {
  padding: 0 12px;
}

.soft-card__desc {
  min-height: 48px;
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.soft-card__actions {
  justify-content: flex-end;
}

.ingest-layout,
.edit-layout {
  display: grid;
  gap: 16px;
}

.version-cell {
  display: grid;
  gap: 4px;
}

.version-cell strong {
  color: #0f172a;
}

.version-cell small {
  color: #64748b;
}

.server-form-grid__span-2 {
  grid-column: 1 / -1;
}

.soft-empty {
  display: grid;
  place-items: center;
  gap: 14px;
  padding: 28px 0 12px;
}

.soft-empty__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.install-steps {
  margin-bottom: 18px;
}

.install-step {
  display: grid;
  gap: 18px;
}

.install-basic-grid,
.guide-fields,
.guide-preview__grid,
.install-review-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.install-basic-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.section-header h3,
.section-header p {
  margin: 0;
}

.section-header p {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.section-header span {
  color: #475569;
  font-size: 12px;
  white-space: nowrap;
}

.section-header__actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.platform-switch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  width: 100%;
}

.platform-pill {
  display: grid;
  gap: 10px;
  min-height: 110px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #334155;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.platform-pill small {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.platform-pill:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
}

.platform-pill.is-selected {
  border-color: rgba(14, 165, 233, 0.36);
  background: linear-gradient(
    180deg,
    rgba(224, 242, 254, 0.96),
    rgba(240, 249, 255, 0.9)
  );
  color: #0f172a;
  box-shadow: 0 10px 24px rgba(14, 165, 233, 0.14);
}

.install-variant-summary {
  padding: 16px 18px;
  border: 1px dashed rgba(148, 163, 184, 0.28);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
}

.server-select {
  width: 100%;
}

.server-select-option,
.server-select-card {
  display: grid;
  gap: 10px;
}

.server-select-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.server-select-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.88);
}

.server-select-option__title,
.server-select-card__title,
.server-select-option__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.server-select-option__title strong,
.server-select-card__title strong {
  color: #0f172a;
}

.server-select-option__icons {
  display: inline-flex;
  gap: 8px;
  color: #0369a1;
}

.server-select-option__meta,
.server-select-option p,
.server-select-card p {
  color: #64748b;
  font-size: 13px;
}

.server-select-option p,
.server-select-card p {
  margin: 0;
}

.guide-loading,
.guide-section,
.guide-preview,
.install-review-card,
.inline-task-list {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: rgba(248, 250, 252, 0.82);
}

.guide-field :deep(.el-form-item__content) {
  display: grid;
}

.guide-field__hint {
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
}

.guide-preview__card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94),
    rgba(226, 232, 240, 0.88)
  );
}

.guide-preview__card h4 {
  margin: 0 0 12px;
  color: #0f172a;
}

.guide-preview__card ul,
.review-list {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.guide-preview__card li,
.review-list li {
  display: grid;
  gap: 4px;
  color: #334155;
  font-size: 13px;
  line-height: 1.6;
}

.review-list li strong {
  color: #0f172a;
}

.inline-task-list__items {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.inline-task-item,
.operation-task {
  display: grid;
  gap: 4px;
  width: 100%;
  padding: 14px 16px;
  text-align: left;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  cursor: pointer;
}

.inline-task-item.is-active,
.operation-task.is-active {
  border-color: rgba(14, 165, 233, 0.36);
  box-shadow: 0 14px 28px rgba(14, 165, 233, 0.12);
}

.operation-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 16px;
  min-height: 540px;
}

.operation-task-list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.operation-panel {
  display: grid;
  gap: 16px;
}

.operation-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.operation-panel__header strong,
.operation-panel__header p {
  display: block;
  margin: 0;
}

.operation-panel__header p {
  margin-top: 6px;
  color: #64748b;
}

.operation-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: #475569;
  font-size: 13px;
}

.operation-console {
  padding: 18px;
  border-radius: 20px;
  background: #020617;
  color: #dbeafe;
}

.operation-console pre {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .soft-toolbar,
  .install-basic-grid,
  .guide-fields,
  .guide-preview__grid,
  .install-review-grid,
  .operation-layout {
    grid-template-columns: 1fr;
  }

  .soft-toolbar__meta {
    justify-content: flex-start;
  }
}
</style>
