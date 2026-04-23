<template>
  <section class="soft-home-page">
    <section class="soft-stage">
      <div class="soft-stage__content">
            <header class="soft-hero">
              <div>
                <small>SOFT / HOME</small>
                <h1>软件列表</h1>
                <p>单页软件目录，支持新增、删除与完整详情查看。</p>
              </div>
              <div class="soft-hero__actions">
                <el-tooltip content="添加软件" placement="top">
                  <ScButton type="primary" circle @click="openCreatePackageWizard">
                    <IconifyIconOnline icon="ri:add-line" />
                  </ScButton>
                </el-tooltip>
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
                <small>软件包记录</small>
                <strong>{{ packages.length }}</strong>
              </article>
              <article class="soft-summary__card">
                <small>常用预设</small>
                <strong>{{ commonSoftwarePresets.length }}</strong>
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
                    <span>{{ item.osTypes.map((v) => osLabel(v)).join(" / ") || "未配置系统" }}</span>
                    <span>
                    {{
                      item.architectures
                        .map((value) => architectureLabel(value))
                        .join(" / ") || "未配置架构"
                    }}
                    </span>
                    <button
                      type="button"
                      class="software-card__meta-link"
                      @click.stop="openSoftwareHistory(item)"
                    >
                      安装服务器 {{ item.installedServerCount }} 台
                    </button>
                  </div>

                <footer class="software-card__actions">
                  <el-tooltip content="完整详情" placement="top">
                    <ScButton circle plain type="primary" @click.stop="openSoftwareDetail(item)">
                      <IconifyIconOnline icon="ri:information-line" />
                    </ScButton>
                  </el-tooltip>
                  <el-tooltip content="安装历史与时间轴" placement="top">
                    <ScButton circle plain @click.stop="openSoftwareHistory(item)">
                      <IconifyIconOnline icon="ri:timeline-view" />
                    </ScButton>
                  </el-tooltip>
                  <el-tooltip content="删除软件" placement="top">
                    <ScButton
                      circle
                      plain
                      type="danger"
                      :loading="deletingPackageId === item.defaultPackageId || deletingSoftwareKey === item.key"
                      @click.stop="removePackageBySoftware(item)"
                    >
                      <IconifyIconOnline icon="ri:delete-bin-6-line" />
                    </ScButton>
                  </el-tooltip>
                </footer>
              </article>
            </div>
            <el-empty v-else description="没有匹配的软件" />
      </div>
    </section>

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
                <small>软件主档只维护基础信息，安装统一走脚本。</small>
              </div>
            </div>
            <div class="create-step-chip" :class="{ 'is-active': packageCreateStep === 2 }">
              <span>2</span>
              <div>
                <strong>版本与脚本</strong>
                <small>每个版本分离维护基础字段和生命周期脚本。</small>
              </div>
            </div>
          </div>

          <template v-if="packageCreateStep === 1">
            <el-form :model="packageCreateForm" label-position="top" class="create-version-dialog-form">
              <div class="source-form-grid source-form-grid--row">
                <el-form-item label="常用软件预设">
                  <ScSelect
                    v-model="selectedCreatePresetKey"
                    clearable
                    filterable
                    placeholder="选择预设后自动填充"
                    @change="handleCreatePresetChange"
                  >
                    <ScOption
                      v-for="preset in commonSoftwarePresets"
                      :key="preset.key"
                      :label="`${preset.packageName} · ${preset.packageCategory}`"
                      :value="preset.key"
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
                <ScTabs type="border-card" class="soft-form-tabs">
                  <ScTabPane label="基础信息">
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
                      <el-form-item label="日志路径" class="create-form-span-2">
                        <el-input
                          v-model="item.logPathsText"
                          type="textarea"
                          :rows="2"
                          placeholder="每行一个日志路径"
                        />
                      </el-form-item>
                      <el-form-item label="配置路径" class="create-form-span-2">
                        <el-input
                          v-model="item.configPathsText"
                          type="textarea"
                          :rows="2"
                          placeholder="每行一个配置路径"
                        />
                      </el-form-item>
                    </div>
                  </ScTabPane>
                  <ScTabPane label="脚本">
                    <div class="source-form-grid source-form-grid--row">
                      <el-form-item label="安装脚本" class="create-form-span-2">
                        <el-input v-model="item.installScript" type="textarea" :rows="4" />
                      </el-form-item>
                      <el-form-item label="启动脚本" class="create-form-span-2">
                        <el-input v-model="item.startScript" type="textarea" :rows="3" />
                      </el-form-item>
                      <el-form-item label="停止脚本" class="create-form-span-2">
                        <el-input v-model="item.stopScript" type="textarea" :rows="3" />
                      </el-form-item>
                      <el-form-item label="重启脚本" class="create-form-span-2">
                        <el-input v-model="item.restartScript" type="textarea" :rows="3" />
                      </el-form-item>
                      <el-form-item label="状态检查脚本" class="create-form-span-2">
                        <el-input v-model="item.statusScript" type="textarea" :rows="3" />
                      </el-form-item>
                      <el-form-item label="卸载脚本" class="create-form-span-2">
                        <el-input v-model="item.uninstallScript" type="textarea" :rows="3" />
                      </el-form-item>
                      <el-form-item label="服务注册脚本" class="create-form-span-2">
                        <el-input v-model="item.serviceRegisterScript" type="textarea" :rows="3" />
                      </el-form-item>
                      <el-form-item label="服务卸载脚本" class="create-form-span-2">
                        <el-input v-model="item.serviceUnregisterScript" type="textarea" :rows="3" />
                      </el-form-item>
                    </div>
                  </ScTabPane>
                </ScTabs>
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
                <el-input
                  v-model="createForm.versionCode"
                  placeholder="例如: 8.4.3"
                  @change="handleCreateVersionCodeChange"
                />
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
          <el-tag v-if="currentSoftwareResolvedPackage" size="small" effect="light">
            {{ currentSoftwareResolvedVersions.length }} 个版本
          </el-tag>
        </div>
      </template>
      <template v-if="currentSoftwareResolvedPackage">
        <section class="software-detail">
          <header class="software-detail__head">
            <div class="software-detail__identity">
              <div class="software-detail__icon">
                <img
                  v-if="currentSoftwareResolvedPackage.iconUrl"
                  :src="currentSoftwareResolvedPackage.iconUrl"
                  :alt="`${currentSoftwareResolvedPackage.packageName} 图标`"
                  loading="lazy"
                />
                <span v-else>{{ softwareAvatarText(currentSoftwareResolvedPackage.packageName) }}</span>
              </div>
              <div>
                <h3>{{ currentSoftwareResolvedPackage.packageName }}</h3>
                <p>{{ currentSoftwareResolvedPackage.packageCode }}</p>
              </div>
            </div>
            <ScSelect
              v-if="currentSoftwareVariants.length > 1"
              v-model="softwareDetailPackageId"
              class="software-detail__variant-select"
              filterable
              placeholder="选择软件变体"
            >
              <ScOption
                v-for="item in currentSoftwareVariants"
                :key="item.softPackageId"
                :label="`${item.packageName} · ${osLabel(item.osType)} / ${architectureLabel(item.architecture)}`"
                :value="item.softPackageId"
              />
            </ScSelect>
          </header>

          <p class="software-detail__desc">
            {{ currentSoftwareResolvedPackage.description || "暂无描述" }}
          </p>

          <div class="software-detail__meta">
            <span>{{ currentSoftwareResolvedPackage.packageCategory || "未分类" }}</span>
            <el-tag  size="small" effect="light">
              {{ osLabel(currentSoftwareResolvedPackage.osType) }}
            </el-tag>
            <el-tag size="small" effect="light">
              {{ architectureLabel(currentSoftwareResolvedPackage.architecture) }}
            </el-tag>
          </div>

          <ScTabs v-model="softwareDetailTab" type="border-card" class="soft-form-tabs">
            <ScTabPane label="基础信息" name="basic">
              <div v-loading="softwareDetailLoading" class="software-detail__basic-grid">
                <article class="software-detail__basic-card">
                  <small>软件编码</small>
                  <strong>{{ currentSoftwareResolvedPackage.packageCode || "-" }}</strong>
                  <span>{{ currentSoftwareResolvedPackage.profileCode || "未配置画像编码" }}</span>
                </article>
                <article class="software-detail__basic-card">
                  <small>系统 / 架构</small>
                  <strong>
                    {{ osLabel(currentSoftwareResolvedPackage.osType) }} / {{ architectureLabel(currentSoftwareResolvedPackage.architecture) }}
                  </strong>
                  <span>{{ currentSoftwareResolvedPackage.packageCategory || "未分类" }}</span>
                </article>
                <article class="software-detail__basic-card">
                  <small>版本数量</small>
                  <strong>{{ currentSoftwareResolvedVersions.length }}</strong>
                  <span>{{ currentSoftwareResolvedPackage.description || "脚本安装模式，支持自定义下载与生命周期脚本。" }}</span>
                </article>
              </div>

              <article class="software-detail__install">
                <header class="software-detail__install-head">
                  <div>
                    <small>INSTALL / SERVER</small>
                    <h4>安装到服务器</h4>
                    <p>直接复用服务器侧的软件安装向导，脚本内容与软件版本主档保持一致。</p>
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
            </ScTabPane>

            <ScTabPane label="版本列表" name="versions">
              <div v-loading="softwareDetailLoading" class="software-detail__version-list">
                <el-collapse
                  v-model="softwareDetailExpandedVersion"
                  accordion
                  class="software-detail__version-collapse"
                >
                  <el-collapse-item
                    v-for="version in currentSoftwareResolvedVersions"
                    :key="version.softPackageVersionId || version.versionCode"
                    :name="String(version.softPackageVersionId || version.versionCode || '-')"
                    class="software-detail__version-card"
                  >
                    <template #title>
                      <header class="software-detail__version-head">
                        <div>
                          <strong>{{ version.versionName || version.versionCode }}</strong>
                          <p>{{ version.versionCode }}</p>
                        </div>
                        <el-tag size="small" effect="plain">
                          {{ installModeLabel(version.installMode) }}
                        </el-tag>
                      </header>
                    </template>
                    <ScTabs
                      v-model="softwareDetailVersionTabs[String(version.softPackageVersionId || version.versionCode)]"
                      type="border-card"
                      class="soft-form-tabs"
                    >
                      <ScTabPane label="基础信息" name="basic">
                        <dl class="software-detail__version-grid">
                          <div>
                            <dt>系统</dt>
                            <dd>{{ osLabel(version.osType) }}</dd>
                          </div>
                          <div>
                            <dt>架构</dt>
                            <dd>{{ architectureLabel(version.architecture) }}</dd>
                          </div>
                          <div>
                            <dt>启用状态</dt>
                            <dd>{{ version.enabled === false ? "停用" : "启用" }}</dd>
                          </div>
                          <div>
                            <dt>下载地址</dt>
                            <dd>{{ version.downloadUrl || (Array.isArray(version.downloadUrls) ? version.downloadUrls[0] : "-") || "-" }}</dd>
                          </div>
                          <div class="software-detail__version-span-2">
                            <dt>全部下载地址</dt>
                            <dd>{{ Array.isArray(version.downloadUrls) && version.downloadUrls.length ? version.downloadUrls.join(" \n ") : (version.downloadUrl || "-") }}</dd>
                          </div>
                          <div class="software-detail__version-span-2">
                            <dt>日志路径</dt>
                            <dd>{{ Array.isArray(version.logPaths) && version.logPaths.length ? version.logPaths.join(" \n ") : "-" }}</dd>
                          </div>
                          <div class="software-detail__version-span-2">
                            <dt>配置路径</dt>
                            <dd>{{ Array.isArray(version.configPaths) && version.configPaths.length ? version.configPaths.join(" \n ") : "-" }}</dd>
                          </div>
                        </dl>
                      </ScTabPane>
                      <ScTabPane label="脚本" name="scripts">
                        <div class="software-detail__script-list">
                          <article class="software-detail__script-card">
                            <small>安装脚本</small>
                            <pre>{{ version.installScript || "未配置安装脚本" }}</pre>
                          </article>
                          <article class="software-detail__script-card">
                            <small>启动脚本</small>
                            <pre>{{ version.startScript || "未配置启动脚本" }}</pre>
                          </article>
                          <article class="software-detail__script-card">
                            <small>停止脚本</small>
                            <pre>{{ version.stopScript || "未配置停止脚本" }}</pre>
                          </article>
                          <article class="software-detail__script-card">
                            <small>重启脚本</small>
                            <pre>{{ version.restartScript || "未配置重启脚本" }}</pre>
                          </article>
                          <article class="software-detail__script-card">
                            <small>状态检查脚本</small>
                            <pre>{{ version.statusScript || "未配置状态检查脚本" }}</pre>
                          </article>
                          <article class="software-detail__script-card">
                            <small>卸载脚本</small>
                            <pre>{{ version.uninstallScript || "未配置卸载脚本" }}</pre>
                          </article>
                          <article class="software-detail__script-card">
                            <small>服务注册脚本</small>
                            <pre>{{ version.serviceRegisterScript || "未配置服务注册脚本" }}</pre>
                          </article>
                          <article class="software-detail__script-card">
                            <small>服务卸载脚本</small>
                            <pre>{{ version.serviceUnregisterScript || "未配置服务卸载脚本" }}</pre>
                          </article>
                        </div>
                      </ScTabPane>
                    </ScTabs>
                  </el-collapse-item>
                </el-collapse>
                <el-empty
                  v-if="!softwareDetailLoading && !currentSoftwareResolvedVersions.length"
                  description="当前软件还没有维护版本脚本"
                />
              </div>
            </ScTabPane>
          </ScTabs>
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

    <ScTaskMessageDialog
      v-model:visible="installTaskDialogVisible"
      title="软件安装任务"
      :task="installTaskDialogModel"
      @refresh="refreshInstallTaskDialog"
    />

    <ScDialog
      v-model="softwareHistoryVisible"
      title="安装历史与时间轴"
      width="920px"
      layout="simple"
      destroy-on-close
    >
      <template v-if="historySoftwareCard">
        <section class="software-history">
          <header class="software-history__summary">
            <article class="software-history__summary-card">
              <small>软件</small>
              <strong>{{ historySoftwareCard.name }}</strong>
            </article>
            <article class="software-history__summary-card">
              <small>安装服务器</small>
              <strong>{{ historySoftwareCard.installedServerCount }} 台</strong>
            </article>
            <article class="software-history__summary-card">
              <small>安装实例</small>
              <strong>{{ historySoftwareCard.installationCount }} 个</strong>
            </article>
            <article class="software-history__summary-card">
              <small>安装事件</small>
              <strong>{{ historyTimelineItems.length }} 条</strong>
            </article>
          </header>
          <el-empty
            v-if="!historyTimelineItems.length"
            description="暂无安装历史数据"
          />
          <el-timeline v-else class="software-history__timeline">
            <el-timeline-item
              v-for="item in historyTimelineItems"
              :key="item.id"
              :type="item.type"
              :timestamp="item.timestampText"
            >
              <article class="software-history__item">
                <header>
                  <strong>{{ item.title }}</strong>
                  <el-tag size="small" :type="item.tagType">{{ item.statusLabel }}</el-tag>
                </header>
                <p>{{ item.message || "任务状态已更新" }}</p>
                <small>
                  目标：{{ item.targetName || "-" }} · 实例：{{ item.installationName || "-" }} ·
                  阶段：{{ item.stage || "-" }} · 进度：{{ item.progress }}%
                </small>
              </article>
            </el-timeline-item>
          </el-timeline>
        </section>
      </template>
      <el-empty v-else description="未选择软件" />
    </ScDialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { resolveRuntimeProviders } from "@layout/default";
import { ScTabs, ScTabPane } from "@repo/components/ScTabs";
import ScTaskMessageDialog from "@repo/components/ScTaskMessageDialog";
import type { TaskDialogModel } from "@repo/components/ScTaskMessageDialog/types";
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
  createSoftPackage,
  deleteSoftPackage,
  deleteSoftRepositorySource,
  generateSoftPackageAiDraft,
  getSoftPackageDetail,
  getSoftVersionGuide,
  installSoftPackage,
  listSoftInstallations,
  listSoftOperationLogs,
  listSoftPackages,
  listSoftRepositories,
  searchSoftRepositoryPackages,
  listSoftTargets,
  registerSoftTargetHost,
  updateSoftPackage,
  updateSoftRepositorySource,
  updateSoftPackageVersion,
} from "../api";
import type {
  SoftGuideField,
  SoftInstallation,
  SoftInstallRequest,
  SoftOperationLog,
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
import { useSoftOperationStream } from "../composables/useSoftOperationStream";

type SourceDraft = SoftRepositorySource & {
  draftId: string;
};
type SourceType = SoftRepositorySource["sourceType"];
type SourceKind = NonNullable<SoftRepositorySource["sourceKind"]>;

type SoftwareCard = {
  architectures: string[];
  category?: string;
  code: string;
  defaultPackageId: number | null;
  description?: string;
  iconUrl?: string;
  installedServerCount: number;
  installationCount: number;
  key: string;
  name: string;
  osTypes: string[];
  packageCount: number;
};

type SoftwareHistoryTimelineItem = {
  id: string;
  title: string;
  statusLabel: string;
  tagType: "success" | "danger" | "warning" | "info";
  type: "success" | "danger" | "warning" | "info" | "primary";
  message: string;
  installationName?: string;
  targetName?: string;
  stage?: string;
  progress: number;
  timestampText: string;
  timestampValue: number;
};

type PackageVersionDraft = {
  architecture: string;
  artifactPath: string;
  configPathsText: string;
  downloadUrl: string;
  downloadUrlsText: string;
  enabled: boolean;
  installMode: "PKG_MANAGER" | "LOCAL_UPLOAD" | "REMOTE_DOWNLOAD";
  installScript: string;
  logPathsText: string;
  osType: string;
  restartScript: string;
  serviceRegisterScript: string;
  serviceUnregisterScript: string;
  sourceKind: SourceKind;
  startScript: string;
  statusScript: string;
  stopScript: string;
  uninstallScript: string;
  versionCode: string;
  versionName: string;
};
type SoftwarePreset = {
  key: string;
  label: string;
  packageCode: string;
  packageName: string;
  packageCategory: string;
  description: string;
  osType: string;
  architecture: string;
  iconUrl?: string;
  versionCode: string;
  versionName: string;
  downloadUrl: string;
  installScript: string;
  startScript: string;
  stopScript: string;
  restartScript: string;
  statusScript: string;
  uninstallScript: string;
  serviceRegisterScript: string;
  serviceUnregisterScript: string;
};
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
const deletingSoftwareKey = ref<string>("");
const packageCreateDialogVisible = ref(false);
const packageCreateStep = ref(1);
const packageCreateSubmitting = ref(false);
const sourceDialogRepositoryId = ref<number | null>(null);
const repositoryOverlayVisible = ref(false);

const createStep = ref(1);
const softwareDetailVisible = ref(false);
const softwareDetailLoading = ref(false);
const softwareDetailTab = ref("basic");
const softwareDetailPackageId = ref<number | null>(null);
const softwareDetailVersionTabs = ref<Record<string, string>>({});
const softwareDetailExpandedVersion = ref("");
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
const installTaskDialogVisible = ref(false);
const installTaskDialogModel = ref<TaskDialogModel | null>(null);
const installOperationId = ref<number | null>(null);
const detailInstallPackageId = ref<number | null>(null);
const detailInstallHostId = ref<number | null>(null);
const softwareHistoryVisible = ref(false);
const historySoftwareKey = ref("");
const packageSearchVisible = ref(false);
const packageSearchMode = ref<"apply" | "browse">("apply");
const packageSearchLoading = ref(false);
const packageSearchKeyword = ref("");
const packageSearchResults = ref<SoftRepositoryPackageSearchItem[]>([]);
const createVersionCandidates = ref<SoftRepositoryPackageSearchVersion[]>([]);
const createCurrentPackage = ref<SoftPackage | null>(null);
const createCurrentVersions = ref<SoftPackageVersion[]>([]);
const softwareDetailPackage = ref<SoftPackage | null>(null);
const softwareDetailVersions = ref<SoftPackageVersion[]>([]);
const editingVersionId = ref<number | null>(null);
const sourceDialogMode = ref<"create" | "edit">("create");
const editingSourceId = ref<number | null>(null);
// 统一 provider 解析：lay-xx -> @repo/core -> 本地兜底。
const runtimeProviders = resolveRuntimeProviders({
  module: "soft.catalog.install",
  socketName: "soft-install",
});
const runtimeMessage = runtimeProviders.message.provider;
const runtimeTask = runtimeProviders.task.provider;
const {
  latest: installOperationLatestRef,
  connect: connectInstallOperationStream,
  disconnect: disconnectInstallOperationStream,
} = useSoftOperationStream();

const packages = ref<SoftPackage[]>([]);
const repositories = ref<SoftRepository[]>([]);
const installations = ref<SoftInstallation[]>([]);
const operationLogs = ref<SoftOperationLog[]>([]);
const serverHosts = ref<ServerHost[]>([]);
const softTargets = ref<SoftTarget[]>([]);

const keyword = ref("");
const osFilter = ref("");
const architectureFilter = ref("");
const manageKeyword = ref("");
const selectedCreatePresetKey = ref("");

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
  configPathsText: "",
  downloadUrl: "",
  downloadUrlsText: "",
  enabled: true,
  installMode: "REMOTE_DOWNLOAD",
  installScript: "",
  logPathsText: "",
  osType: packageCreateForm.osType || "",
  restartScript: "",
  serviceRegisterScript: "",
  serviceUnregisterScript: "",
  sourceKind: "THIRD_PARTY",
  startScript: "",
  statusScript: "",
  stopScript: "",
  uninstallScript: "",
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
  restartScript: "",
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
  statusScript: "",
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
  { label: "脚本源", value: "THIRD_PARTY" },
];

const installModeOptions = [
  { label: "脚本安装", value: "REMOTE_DOWNLOAD" },
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

const buildServiceScripts = (
  packageCode: string,
  packageName: string,
  versionCode: string,
  downloadUrl: string,
  serviceName?: string,
) => {
  const service = normalizeText(serviceName) || packageCode;
  const hasService = Boolean(serviceName);
  return {
    installScript: `#!/usr/bin/env bash
set -euo pipefail

SOFT_CODE="${packageCode}"
SOFT_NAME="${packageName}"
SOFT_VERSION="${versionCode}"
DOWNLOAD_URL="${downloadUrl}"
INSTALL_DIR="/opt/${packageCode}"
ARCHIVE_FILE="/tmp/${packageCode}-${versionCode}.pkg"

mkdir -p "$INSTALL_DIR"
if command -v curl >/dev/null 2>&1; then
  curl -fL "$DOWNLOAD_URL" -o "$ARCHIVE_FILE"
elif command -v wget >/dev/null 2>&1; then
  wget -O "$ARCHIVE_FILE" "$DOWNLOAD_URL"
else
  echo "缺少 curl / wget，请先安装下载工具" >&2
  exit 1
fi

echo "已下载 $SOFT_NAME $SOFT_VERSION -> $ARCHIVE_FILE"
echo "请根据制品格式补充解压、移动、配置初始化等安装命令"
`,
    startScript: hasService
      ? `#!/usr/bin/env bash
set -euo pipefail
systemctl start ${service} || service ${service} start
`
      : `#!/usr/bin/env bash
set -euo pipefail
echo "请补充 ${packageName} 的启动命令"
`,
    stopScript: hasService
      ? `#!/usr/bin/env bash
set -euo pipefail
systemctl stop ${service} || service ${service} stop
`
      : `#!/usr/bin/env bash
set -euo pipefail
echo "请补充 ${packageName} 的停止命令"
`,
    restartScript: hasService
      ? `#!/usr/bin/env bash
set -euo pipefail
systemctl restart ${service} || service ${service} restart
`
      : `#!/usr/bin/env bash
set -euo pipefail
echo "请补充 ${packageName} 的重启命令"
`,
    statusScript: hasService
      ? `#!/usr/bin/env bash
set -euo pipefail
systemctl status ${service} --no-pager || service ${service} status
`
      : `#!/usr/bin/env bash
set -euo pipefail
ps -ef | grep ${packageCode} | grep -v grep
`,
    uninstallScript: `#!/usr/bin/env bash
set -euo pipefail
rm -rf "/opt/${packageCode}" "/etc/${packageCode}" "/var/log/${packageCode}"
echo "如安装了 systemd/service、数据目录或依赖包，请继续补充卸载命令"
`,
    serviceRegisterScript: hasService
      ? `#!/usr/bin/env bash
set -euo pipefail
echo "请在这里补充 ${service}.service 的生成与 systemctl daemon-reload"
`
      : `#!/usr/bin/env bash
set -euo pipefail
echo "当前软件默认不注册系统服务，可按需补充"
`,
    serviceUnregisterScript: hasService
      ? `#!/usr/bin/env bash
set -euo pipefail
systemctl disable ${service} || true
rm -f /etc/systemd/system/${service}.service
systemctl daemon-reload || true
`
      : `#!/usr/bin/env bash
set -euo pipefail
echo "当前软件没有默认服务卸载动作"
`,
  };
};

const createPreset = (preset: Omit<SoftwarePreset, "installScript" | "startScript" | "stopScript" | "restartScript" | "statusScript" | "uninstallScript" | "serviceRegisterScript" | "serviceUnregisterScript"> & {
  serviceName?: string;
}): SoftwarePreset => ({
  ...preset,
  ...buildServiceScripts(
    preset.packageCode,
    preset.packageName,
    preset.versionCode,
    preset.downloadUrl,
    preset.serviceName,
  ),
});

const createWindowsWingetPreset = (preset: {
  key: string;
  label: string;
  packageCode: string;
  packageName: string;
  packageCategory: string;
  description: string;
  wingetId: string;
  versionCode: string;
  versionName: string;
}): SoftwarePreset => ({
  key: preset.key,
  label: preset.label,
  packageCode: preset.packageCode,
  packageName: preset.packageName,
  packageCategory: preset.packageCategory,
  description: `${preset.description}（Windows 仅支持 winget 安装）`,
  osType: "WINDOWS",
  architecture: "amd64",
  versionCode: preset.versionCode,
  versionName: preset.versionName,
  downloadUrl: `winget:${preset.wingetId}`,
  installScript: `@echo off
where winget >nul 2>nul || (echo 未检测到 winget，当前软件不支持 Windows 安装 & exit /b 1)
winget install --id ${preset.wingetId} --accept-package-agreements --accept-source-agreements --silent
`,
  startScript: `@echo off
echo ${preset.packageName} 通常由系统服务或桌面入口启动，请按实际安装方式补充启动脚本
`,
  stopScript: `@echo off
echo ${preset.packageName} 默认不提供统一停止命令，请按实际进程补充
`,
  restartScript: `@echo off
echo ${preset.packageName} 默认不提供统一重启命令，请按实际服务补充
`,
  statusScript: `@echo off
winget list --id ${preset.wingetId}
`,
  uninstallScript: `@echo off
winget uninstall --id ${preset.wingetId} --silent
`,
  serviceRegisterScript: `@echo off
echo Windows 端默认不自动注册服务，如有需要请手工配置 NSSM/服务管理器
`,
  serviceUnregisterScript: `@echo off
echo Windows 端默认无服务注册清理动作
`,
});

const commonSoftwarePresets: SoftwarePreset[] = [
  createPreset({
    key: "nginx",
    label: "Nginx 1.26",
    packageCode: "nginx",
    packageName: "Nginx",
    packageCategory: "Web Server",
    description: "高性能 Web / 反向代理服务器，预设为 Linux 常见部署脚本。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "1.26.1",
    versionName: "stable",
    downloadUrl: "https://nginx.org/download/nginx-1.26.1.tar.gz",
    serviceName: "nginx",
  }),
  createPreset({
    key: "mysql",
    label: "MySQL 8.4",
    packageCode: "mysql",
    packageName: "MySQL Community Server",
    packageCategory: "Database",
    description: "MySQL 社区版数据库服务，脚本包含 systemd 服务占位。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "8.4.0",
    versionName: "lts",
    downloadUrl: "https://dev.mysql.com/get/mysql80-community-release-el7-7.noarch.rpm",
    serviceName: "mysqld",
  }),
  createPreset({
    key: "redis",
    label: "Redis 7.2",
    packageCode: "redis",
    packageName: "Redis",
    packageCategory: "Cache",
    description: "Redis 内存数据库与缓存服务。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "7.2.5",
    versionName: "stable",
    downloadUrl: "https://download.redis.io/releases/redis-7.2.5.tar.gz",
    serviceName: "redis",
  }),
  createPreset({
    key: "postgresql",
    label: "PostgreSQL 16",
    packageCode: "postgresql",
    packageName: "PostgreSQL",
    packageCategory: "Database",
    description: "PostgreSQL 关系型数据库。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "16.3",
    versionName: "stable",
    downloadUrl: "https://ftp.postgresql.org/pub/source/v16.3/postgresql-16.3.tar.gz",
    serviceName: "postgresql",
  }),
  createPreset({
    key: "mongodb",
    label: "MongoDB 7.0",
    packageCode: "mongodb",
    packageName: "MongoDB",
    packageCategory: "Database",
    description: "MongoDB 文档数据库。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "7.0.9",
    versionName: "community",
    downloadUrl: "https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel70-7.0.9.tgz",
    serviceName: "mongod",
  }),
  createPreset({
    key: "rabbitmq",
    label: "RabbitMQ 3.13",
    packageCode: "rabbitmq",
    packageName: "RabbitMQ",
    packageCategory: "MQ",
    description: "RabbitMQ 消息队列服务。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "3.13.2",
    versionName: "stable",
    downloadUrl: "https://github.com/rabbitmq/rabbitmq-server/releases/download/v3.13.2/rabbitmq-server-generic-unix-3.13.2.tar.xz",
    serviceName: "rabbitmq-server",
  }),
  createPreset({
    key: "kafka",
    label: "Kafka 3.7",
    packageCode: "kafka",
    packageName: "Apache Kafka",
    packageCategory: "MQ",
    description: "Kafka 消息流平台。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "3.7.0",
    versionName: "scala-2.13",
    downloadUrl: "https://downloads.apache.org/kafka/3.7.0/kafka_2.13-3.7.0.tgz",
    serviceName: "kafka",
  }),
  createPreset({
    key: "zookeeper",
    label: "ZooKeeper 3.9",
    packageCode: "zookeeper",
    packageName: "Apache ZooKeeper",
    packageCategory: "Coordination",
    description: "ZooKeeper 协调服务。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "3.9.2",
    versionName: "stable",
    downloadUrl: "https://downloads.apache.org/zookeeper/zookeeper-3.9.2/apache-zookeeper-3.9.2-bin.tar.gz",
    serviceName: "zookeeper",
  }),
  createPreset({
    key: "nacos",
    label: "Nacos 2.3",
    packageCode: "nacos",
    packageName: "Nacos",
    packageCategory: "Registry",
    description: "Nacos 注册配置中心。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "2.3.2",
    versionName: "stable",
    downloadUrl: "https://github.com/alibaba/nacos/releases/download/2.3.2/nacos-server-2.3.2.tar.gz",
    serviceName: "nacos",
  }),
  createPreset({
    key: "minio",
    label: "MinIO 2024",
    packageCode: "minio",
    packageName: "MinIO",
    packageCategory: "Object Storage",
    description: "MinIO 对象存储服务。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "2024-04-18",
    versionName: "latest",
    downloadUrl: "https://dl.min.io/server/minio/release/linux-amd64/minio",
    serviceName: "minio",
  }),
  createPreset({
    key: "elasticsearch",
    label: "Elasticsearch 8.13",
    packageCode: "elasticsearch",
    packageName: "Elasticsearch",
    packageCategory: "Search",
    description: "Elasticsearch 搜索引擎服务。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "8.13.4",
    versionName: "stable",
    downloadUrl: "https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-8.13.4-linux-x86_64.tar.gz",
    serviceName: "elasticsearch",
  }),
  createPreset({
    key: "prometheus",
    label: "Prometheus 2.52",
    packageCode: "prometheus",
    packageName: "Prometheus",
    packageCategory: "Monitoring",
    description: "Prometheus 监控采集服务。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "2.52.0",
    versionName: "stable",
    downloadUrl: "https://github.com/prometheus/prometheus/releases/download/v2.52.0/prometheus-2.52.0.linux-amd64.tar.gz",
    serviceName: "prometheus",
  }),
  createPreset({
    key: "grafana",
    label: "Grafana 11",
    packageCode: "grafana",
    packageName: "Grafana",
    packageCategory: "Monitoring",
    description: "Grafana 可视化监控平台。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "11.0.0",
    versionName: "stable",
    downloadUrl: "https://dl.grafana.com/oss/release/grafana-11.0.0.linux-amd64.tar.gz",
    serviceName: "grafana-server",
  }),
  createPreset({
    key: "jenkins",
    label: "Jenkins 2.452",
    packageCode: "jenkins",
    packageName: "Jenkins",
    packageCategory: "CI/CD",
    description: "Jenkins 自动化构建服务。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "2.452.1",
    versionName: "lts",
    downloadUrl: "https://get.jenkins.io/war-stable/2.452.1/jenkins.war",
    serviceName: "jenkins",
  }),
  createPreset({
    key: "docker",
    label: "Docker 26",
    packageCode: "docker",
    packageName: "Docker Engine",
    packageCategory: "Container",
    description: "Docker 容器引擎。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "26.1.1",
    versionName: "ce",
    downloadUrl: "https://download.docker.com/linux/static/stable/x86_64/docker-26.1.1.tgz",
    serviceName: "docker",
  }),
  createPreset({
    key: "openjdk",
    label: "OpenJDK 21",
    packageCode: "openjdk",
    packageName: "OpenJDK",
    packageCategory: "Runtime",
    description: "Java 运行时与开发工具链。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "21.0.3",
    versionName: "lts",
    downloadUrl: "https://download.oracle.com/java/21/latest/jdk-21_linux-x64_bin.tar.gz",
  }),
  createPreset({
    key: "nodejs",
    label: "Node.js 22",
    packageCode: "nodejs",
    packageName: "Node.js",
    packageCategory: "Runtime",
    description: "Node.js JavaScript 运行时。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "22.2.0",
    versionName: "current",
    downloadUrl: "https://nodejs.org/dist/v22.2.0/node-v22.2.0-linux-x64.tar.xz",
  }),
  createPreset({
    key: "python",
    label: "Python 3.12",
    packageCode: "python",
    packageName: "Python",
    packageCategory: "Runtime",
    description: "Python 运行时环境。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "3.12.3",
    versionName: "stable",
    downloadUrl: "https://www.python.org/ftp/python/3.12.3/Python-3.12.3.tgz",
  }),
  createPreset({
    key: "golang",
    label: "Go 1.22",
    packageCode: "golang",
    packageName: "Go",
    packageCategory: "Runtime",
    description: "Go 语言工具链。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "1.22.3",
    versionName: "stable",
    downloadUrl: "https://go.dev/dl/go1.22.3.linux-amd64.tar.gz",
  }),
  createPreset({
    key: "maven",
    label: "Maven 3.9",
    packageCode: "maven",
    packageName: "Apache Maven",
    packageCategory: "Build Tool",
    description: "Java 构建工具 Maven。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "3.9.7",
    versionName: "stable",
    downloadUrl: "https://downloads.apache.org/maven/maven-3/3.9.7/binaries/apache-maven-3.9.7-bin.tar.gz",
  }),
  createPreset({
    key: "tigervnc",
    label: "TigerVNC 1.14",
    packageCode: "tigervnc",
    packageName: "TigerVNC",
    packageCategory: "Remote Desktop",
    description: "常见 VNC 远程桌面服务端组件。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "1.14.1",
    versionName: "stable",
    downloadUrl: "https://sourceforge.net/projects/tigervnc/files/stable/1.14.1/tigervnc-1.14.1.tar.gz/download",
    serviceName: "vncserver",
  }),
  createPreset({
    key: "guacamole-server",
    label: "Guacamole 1.5",
    packageCode: "guacamole-server",
    packageName: "Apache Guacamole",
    packageCategory: "Remote Gateway",
    description: "常见 Web 远程桌面网关（RDP/VNC/SSH）。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "1.5.5",
    versionName: "stable",
    downloadUrl: "https://downloads.apache.org/guacamole/1.5.5/source/guacamole-server-1.5.5.tar.gz",
    serviceName: "guacd",
  }),
  createPreset({
    key: "vsftpd",
    label: "vsftpd 3.0",
    packageCode: "vsftpd",
    packageName: "vsftpd",
    packageCategory: "FTP",
    description: "常见 FTP 服务端。",
    osType: "LINUX",
    architecture: "amd64",
    versionCode: "3.0.5",
    versionName: "stable",
    downloadUrl: "https://security.appspot.com/downloads/vsftpd-3.0.5.tar.gz",
    serviceName: "vsftpd",
  }),
  createWindowsWingetPreset({
    key: "sunlogin-win",
    label: "向日葵 (Windows)",
    packageCode: "sunlogin-windows",
    packageName: "向日葵远程控制",
    packageCategory: "Remote Desktop",
    description: "常见国产远控软件向日葵。",
    wingetId: "Oray.SunLoginClient",
    versionCode: "latest",
    versionName: "winget",
  }),
  createWindowsWingetPreset({
    key: "git-win",
    label: "Git (Windows)",
    packageCode: "git-windows",
    packageName: "Git",
    packageCategory: "Dev Tool",
    description: "Windows Git 开发工具链。",
    wingetId: "Git.Git",
    versionCode: "latest",
    versionName: "winget",
  }),
  createWindowsWingetPreset({
    key: "vscode-win",
    label: "VS Code (Windows)",
    packageCode: "vscode-windows",
    packageName: "Visual Studio Code",
    packageCategory: "IDE",
    description: "Windows VS Code 编辑器。",
    wingetId: "Microsoft.VisualStudioCode",
    versionCode: "latest",
    versionName: "winget",
  }),
  createWindowsWingetPreset({
    key: "nodejs-win",
    label: "Node.js (Windows)",
    packageCode: "nodejs-windows",
    packageName: "Node.js",
    packageCategory: "Runtime",
    description: "Windows Node.js 运行时。",
    wingetId: "OpenJS.NodeJS",
    versionCode: "latest",
    versionName: "winget",
  }),
  createWindowsWingetPreset({
    key: "python-win",
    label: "Python (Windows)",
    packageCode: "python-windows",
    packageName: "Python",
    packageCategory: "Runtime",
    description: "Windows Python 运行时。",
    wingetId: "Python.Python.3.12",
    versionCode: "3.12",
    versionName: "winget",
  }),
  createWindowsWingetPreset({
    key: "openjdk-win",
    label: "OpenJDK 21 (Windows)",
    packageCode: "openjdk-windows",
    packageName: "OpenJDK",
    packageCategory: "Runtime",
    description: "Windows JDK 运行时。",
    wingetId: "EclipseAdoptium.Temurin.21.JDK",
    versionCode: "21",
    versionName: "winget",
  }),
  createWindowsWingetPreset({
    key: "dockerdesktop-win",
    label: "Docker Desktop (Windows)",
    packageCode: "docker-desktop-windows",
    packageName: "Docker Desktop",
    packageCategory: "Container",
    description: "Windows Docker Desktop。",
    wingetId: "Docker.DockerDesktop",
    versionCode: "latest",
    versionName: "winget",
  }),
];

const installationsByPackage = computed(() => {
  const grouped = new Map<number, SoftInstallation[]>();
  installations.value.forEach((item) => {
    const packageId = toNumericId(item.softPackageId);
    if (!packageId) {
      return;
    }
    const exists = grouped.get(packageId) || [];
    exists.push(item);
    grouped.set(packageId, exists);
  });
  return grouped;
});

const softwareInstallStats = computed(() => {
  const stats = new Map<string, { serverKeys: Set<string>; installationCount: number }>();
  packages.value.forEach((item) => {
    const softwareKey = resolveSoftwareKey(item);
    const packageId = toNumericId(item.softPackageId);
    if (!softwareKey || !packageId) {
      return;
    }
    const installationsForPackage = installationsByPackage.value.get(packageId) || [];
    const exists = stats.get(softwareKey) || {
      serverKeys: new Set<string>(),
      installationCount: 0,
    };
    exists.installationCount += installationsForPackage.length;
    installationsForPackage.forEach((installation) => {
      const targetId = toNumericId(installation.softTargetId);
      const targetName = normalizeText(installation.targetName);
      const serverKey = targetId
        ? `target-${targetId}`
        : targetName
          ? `name-${targetName}`
          : `installation-${toNumericId(installation.softInstallationId) || "unknown"}`;
      exists.serverKeys.add(serverKey);
    });
    stats.set(softwareKey, exists);
  });
  return stats;
});

const softwareList = computed<SoftwareCard[]>(() => {
  const grouped = new Map<string, SoftwareCard>();
  packages.value.forEach((item) => {
    const code = normalizeText(item.packageCode) || "unknown";
    const key = normalizeText(item.softwareKey) || code;
    const stats = softwareInstallStats.value.get(key);
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
        installedServerCount: stats?.serverKeys.size || 0,
        installationCount: stats?.installationCount || 0,
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
    existing.installedServerCount = stats?.serverKeys.size || existing.installedServerCount;
    existing.installationCount = stats?.installationCount || existing.installationCount;
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

const historySoftwareCard = computed(
  () => softwareList.value.find((item) => item.key === historySoftwareKey.value) || null,
);

const historyTimelineItems = computed<SoftwareHistoryTimelineItem[]>(() => {
  const softwareKey = historySoftwareKey.value;
  if (!softwareKey) {
    return [];
  }
  const packageIds = new Set(
    packages.value
      .filter((item) => resolveSoftwareKey(item) === softwareKey)
      .map((item) => toNumericId(item.softPackageId))
      .filter((item): item is number => item !== null),
  );
  if (!packageIds.size) {
    return [];
  }
  const relatedInstallations = installations.value.filter((item) =>
    packageIds.has(toNumericId(item.softPackageId) || -1),
  );
  const installationMap = new Map<number, SoftInstallation>();
  relatedInstallations.forEach((item) => {
    const installationId = toNumericId(item.softInstallationId);
    if (installationId) {
      installationMap.set(installationId, item);
    }
  });
  const statusLabelMap: Record<string, string> = {
    SUCCESS: "成功",
    FAILED: "失败",
    RUNNING: "执行中",
    PENDING: "等待中",
    CANCELLED: "已取消",
  };
  return operationLogs.value
    .filter((item) => installationMap.has(toNumericId(item.softInstallationId) || -1))
    .filter((item) => {
      const operationType = String(item.operationType || "").toUpperCase();
      return ["INSTALL", "UNINSTALL", "REGISTER_SERVICE", "START", "STOP", "RESTART", "STATUS"].includes(operationType);
    })
    .map((item) => {
      const operationId = toNumericId(item.softOperationLogId) || 0;
      const installation = installationMap.get(toNumericId(item.softInstallationId) || -1) || null;
      const status = String(item.operationStatus || "RUNNING").toUpperCase();
      const startTime = item.startTime ? Date.parse(item.startTime) : NaN;
      const endTime = item.endTime ? Date.parse(item.endTime) : NaN;
      const timestampValue = Number.isFinite(endTime)
        ? endTime
        : Number.isFinite(startTime)
          ? startTime
          : Date.now();
      const progress = Number(item.progressPercent || 0);
      const tagType = status === "SUCCESS"
        ? "success"
        : status === "FAILED" || status === "CANCELLED"
          ? "danger"
          : "warning";
      const timelineType = status === "SUCCESS"
        ? "success"
        : status === "FAILED" || status === "CANCELLED"
          ? "danger"
          : "primary";
      return {
        id: `operation-${operationId}-${timestampValue}`,
        title: `${String(item.operationType || "INSTALL")} · ${installation?.versionName || "-"}`,
        statusLabel: statusLabelMap[status] || status,
        tagType,
        type: timelineType,
        message: String(item.operationMessage || item.detailMessage || "").trim(),
        installationName: installation?.installationName,
        targetName: installation?.targetName,
        stage: String(item.operationStage || "").trim(),
        progress: Number.isFinite(progress) ? progress : 0,
        timestampText: new Date(timestampValue).toLocaleString(),
        timestampValue,
      };
    })
    .sort((left, right) => right.timestampValue - left.timestampValue);
});

const currentSoftwareVariants = computed(() => {
  const softwareKey = activeSoftwareKey.value;
  if (!softwareKey) {
    return [];
  }
  return packages.value.filter(
    (item) => resolveSoftwareKey(item) === softwareKey,
  );
});

const currentSoftwareResolvedPackage = computed(
  () =>
    softwareDetailPackage.value ||
    currentSoftwareVariants.value.find(
      (item) => toNumericId(item.softPackageId) === toNumericId(softwareDetailPackageId.value),
    ) ||
    null,
);

const currentSoftwareResolvedVersions = computed(
  () => softwareDetailVersions.value || [],
);

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

const isSimpleInstallServer = (host?: ServerHost | null) => {
  const type = normalizeText(host?.serverType)?.toUpperCase();
  return Boolean(
    host &&
      host.enabled !== false &&
      type &&
      ["LOCAL", "SSH", "WINRM"].includes(type),
  );
};

const compatibleDetailHosts = computed(() =>
  detailInstallPackage.value
    ? serverHosts.value.filter(
        (host) =>
          isSimpleInstallServer(host) &&
          matchPackageServer(detailInstallPackage.value, host),
      )
    : [],
);

const compatibleInstallPackages = computed(() =>
  isSimpleInstallServer(installHost.value)
    ? packages.value.filter(
        (item) =>
          toNumericId(item.softPackageId) !== null &&
          matchPackageServer(item, installHost.value),
      )
    : [],
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

const applyPresetToDraft = (draft: PackageVersionDraft, preset: SoftwarePreset) => {
  draft.architecture = preset.architecture;
  draft.artifactPath = "";
  draft.configPathsText = "";
  draft.downloadUrl = preset.downloadUrl;
  draft.downloadUrlsText = preset.downloadUrl;
  draft.enabled = true;
  draft.installMode = "REMOTE_DOWNLOAD";
  draft.installScript = preset.installScript;
  draft.logPathsText = "";
  draft.osType = preset.osType;
  draft.restartScript = preset.restartScript;
  draft.serviceRegisterScript = preset.serviceRegisterScript;
  draft.serviceUnregisterScript = preset.serviceUnregisterScript;
  draft.sourceKind = "THIRD_PARTY";
  draft.startScript = preset.startScript;
  draft.statusScript = preset.statusScript;
  draft.stopScript = preset.stopScript;
  draft.uninstallScript = preset.uninstallScript;
  draft.versionCode = preset.versionCode;
  draft.versionName = preset.versionName;
};

const handleCreatePresetChange = (value?: string | number | null) => {
  const preset = commonSoftwarePresets.find((item) => item.key === String(value || ""));
  if (!preset) {
    return;
  }
  packageCreateForm.packageCode = preset.packageCode;
  packageCreateForm.packageName = preset.packageName;
  packageCreateForm.packageCategory = preset.packageCategory;
  packageCreateForm.profileCode = "";
  packageCreateForm.osType = preset.osType;
  packageCreateForm.architecture = preset.architecture;
  packageCreateForm.iconUrl = preset.iconUrl || "";
  packageCreateForm.description = preset.description;
  if (!packageVersionDrafts.value.length) {
    packageVersionDrafts.value = [createDefaultVersionDraft()];
  }
  applyPresetToDraft(packageVersionDrafts.value[0], preset);
};

const loadSoftwareDetail = async (packageId?: number | null) => {
  const targetId = toNumericId(packageId);
  if (!targetId) {
    softwareDetailPackage.value = null;
    softwareDetailVersions.value = [];
    softwareDetailPackageId.value = null;
    return;
  }
  softwareDetailLoading.value = true;
  try {
    const result = await getSoftPackageDetail(targetId);
    softwareDetailPackage.value = result.data?.package || null;
    softwareDetailVersions.value = Array.isArray(result.data?.versions)
      ? result.data.versions
      : [];
    softwareDetailPackageId.value = targetId;
    detailInstallPackageId.value = targetId;
    softwareDetailTab.value = "basic";
    softwareDetailExpandedVersion.value = "";
    const nextTabs: Record<string, string> = {};
    softwareDetailVersions.value.forEach((item) => {
      const versionId = toNumericId(item.softPackageVersionId) || 0;
      if (versionId > 0) {
        nextTabs[String(versionId)] = "basic";
      }
    });
    softwareDetailVersionTabs.value = nextTabs;
  } catch (error) {
    console.error(error);
    ElMessage.error("加载软件详情失败");
  } finally {
    softwareDetailLoading.value = false;
  }
};

const shouldHideGuideField = (field?: SoftGuideField | null) => {
  const key = String(field?.fieldKey || "").toLowerCase();
  return (
    key === "installpath" ||
    key === "installdir" ||
    key === "installationpath" ||
    key === "install_dir" ||
    key === "install_path"
  );
};

const filteredGuideFields = (fields?: SoftGuideField[] | null) =>
  (Array.isArray(fields) ? fields : []).filter((item) => !shouldHideGuideField(item));

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
      fields: filteredGuideFields(installGuide.value.installFields),
    },
    {
      key: "service",
      title: "服务引导",
      hint: "服务注册、启动和状态检查相关参数。",
      scope: "service" as GuideScope,
      fields: filteredGuideFields(installGuide.value.serviceFields),
    },
    {
      key: "config",
      title: "配置初始化",
      hint: "配置模板与初始化变量。",
      scope: "config" as GuideScope,
      fields: filteredGuideFields(installGuide.value.configFields),
    },
  ].filter((section) => section.fields.length);
});

const loadHomeData = async () => {
  loading.value = true;
  try {
    const [packageResult, installationResult, operationResult] = await Promise.allSettled([
      listSoftPackages(),
      listSoftInstallations(),
      listSoftOperationLogs(),
    ]);
    packages.value =
      packageResult.status === "fulfilled" && Array.isArray(packageResult.value.data)
        ? packageResult.value.data
        : [];
    installations.value =
      installationResult.status === "fulfilled" && Array.isArray(installationResult.value.data)
        ? installationResult.value.data
        : [];
    operationLogs.value =
      operationResult.status === "fulfilled" && Array.isArray(operationResult.value.data)
        ? operationResult.value.data
        : [];
    repositories.value = [];
    if (softwareDetailVisible.value && toNumericId(softwareDetailPackageId.value)) {
      await loadSoftwareDetail(softwareDetailPackageId.value);
    }
  } catch (error) {
    console.error(error);
    packages.value = [];
    installations.value = [];
    operationLogs.value = [];
    repositories.value = [];
    ElMessage.error("加载软件首页数据失败");
  } finally {
    loading.value = false;
  }
};

const resetPackageCreateWizard = () => {
  packageCreateStep.value = 1;
  packageCreateSubmitting.value = false;
  selectedCreatePresetKey.value = "";
  packageCreateForm.softRepositoryId = null;
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
  if (!packages.value.length) {
    await loadHomeData();
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
  const osType = normalizeText(draft.osType);
  if (!osType) {
    ElMessage.warning(`第 ${index + 1} 个版本必须选择操作系统`);
    return false;
  }
  const architecture = normalizeText(draft.architecture);
  if (!architecture) {
    ElMessage.warning(`第 ${index + 1} 个版本必须选择架构`);
    return false;
  }
  const urls = parseDownloadUrls(draft.downloadUrlsText);
  const mode = normalizeInstallModeChoice(draft.installMode, draft.sourceKind);
  if (!normalizeText(draft.installScript)) {
    ElMessage.warning(`第 ${index + 1} 个版本缺少安装脚本`);
    return false;
  }
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
    softRepositoryId: undefined,
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
        configPathsJson: toJsonArrayText(draft.configPathsText),
        downloadUrl: toOptionalText(draft.downloadUrl),
        downloadUrls: parseDownloadUrls(draft.downloadUrlsText),
        enabled: draft.enabled !== false,
        installMode: normalizeInstallModeChoice(draft.installMode, draft.sourceKind),
        installScript: toOptionalText(draft.installScript),
        logPathsJson: toJsonArrayText(draft.logPathsText),
        osType: toOptionalText(draft.osType),
        packageName: toOptionalText(packageCreateForm.packageName),
        restartScript: toOptionalText(draft.restartScript),
        serviceRegisterScript: toOptionalText(draft.serviceRegisterScript),
        serviceUnregisterScript: toOptionalText(draft.serviceUnregisterScript),
        sourceKind: toSourceKind(draft.sourceKind),
        startScript: toOptionalText(draft.startScript),
        statusScript: toOptionalText(draft.statusScript),
        stopScript: toOptionalText(draft.stopScript),
        uninstallScript: toOptionalText(draft.uninstallScript),
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

const removePackageBySoftware = async (software: SoftwareCard) => {
  const variants = packages.value.filter(
    (item) => resolveSoftwareKey(item) === software.key && toNumericId(item.softPackageId),
  );
  if (!variants.length) {
    ElMessage.warning("未找到可删除的软件包");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除软件“${software.name}”吗？将删除 ${variants.length} 个软件包条目。`,
      "删除软件",
      { type: "warning" },
    );
  } catch {
    return;
  }
  deletingSoftwareKey.value = software.key;
  try {
    for (const variant of variants) {
      const packageId = toNumericId(variant.softPackageId);
      if (!packageId) {
        continue;
      }
      deletingPackageId.value = packageId;
      await deleteSoftPackage(packageId);
    }
    if (activeSoftwareKey.value === software.key) {
      softwareDetailVisible.value = false;
      activeSoftwareKey.value = "";
    }
    await loadHomeData();
    ElMessage.success(`软件 ${software.name} 已删除`);
  } finally {
    deletingSoftwareKey.value = "";
    deletingPackageId.value = null;
  }
};

const openSoftwareHistory = (software: SoftwareCard) => {
  historySoftwareKey.value = software.key;
  softwareHistoryVisible.value = true;
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
  createForm.restartScript = "";
  createForm.startScript = "";
  createForm.statusScript = "";
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
  createForm.restartScript = "";
  createForm.startScript = "";
  createForm.statusScript = "";
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
  createForm.restartScript = firstNonBlank(draft.restartScript, createForm.restartScript);
  createForm.statusScript = firstNonBlank(draft.statusScript, createForm.statusScript);
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
    installScript: toOptionalText(createForm.installScript),
    osType: toOptionalText(createForm.osType),
    packageName: toOptionalText(createForm.packageName),
    repositorySourceId: toNumericId(createForm.repositorySourceId) || undefined,
    restartScript: toOptionalText(createForm.restartScript),
    serviceRegisterScript: toOptionalText(createForm.serviceRegisterScript),
    serviceUnregisterScript: toOptionalText(createForm.serviceUnregisterScript),
    sourceKind: toSourceKind(createForm.sourceKind),
    startScript: toOptionalText(createForm.startScript),
    statusScript: toOptionalText(createForm.statusScript),
    stopScript: toOptionalText(createForm.stopScript),
    uninstallScript: toOptionalText(createForm.uninstallScript),
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

const openSoftwareDetail = async (item: SoftwareCard) => {
  const packageId = toNumericId(item.defaultPackageId);
  if (!packageId) {
    ElMessage.warning("未找到可打开的软件详情");
    return;
  }
  activeSoftwareKey.value = item.key;
  softwareDetailVisible.value = true;
  await loadSoftwareDetail(packageId);
  void loadInstallContext();
};

const openSoftwareDetailByPackageId = async (packageId: number) => {
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
  await loadSoftwareDetail(packageId);
  void loadInstallContext();
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
  void openSoftwareDetailByPackageId(packageId);
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
  if (existing?.softTargetId) {
    return existing.softTargetId;
  }
  const payload = buildSoftTargetPayload(host);
  const result = await registerSoftTargetHost(payload);
  const saved = result.data?.target;
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
    if (!softTargetId) {
      throw new Error("安装目标创建失败，请刷新后重试");
    }
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
    if (result.success === false) {
      throw new Error(result.message || result.msg || "安装任务提交失败");
    }
    const ticket = result.data;
    if (!ticket?.operationId) {
      throw new Error("安装任务提交失败：后端未返回 operationId");
    }
    const taskId = String(ticket.operationId || `soft-install-${Date.now()}`);
    installOperationId.value = toNumericId(ticket.operationId);
    if (installOperationId.value) {
      connectInstallOperationStream(installOperationId.value);
    } else {
      disconnectInstallOperationStream();
    }
    installTask.value = {
      operationId: ticket.operationId,
      installationId: ticket.installationId,
      status: ticket.operationStatus,
      message: `安装任务已提交到 ${installHost.value.serverName}`,
    };
    runtimeTask.updateTask(taskId, {
      requestId: ticket.operationId,
      title: `软件安装 · ${installSelectedPackage.value.packageName || installSelectedPackage.value.packageCode || "未命名软件"}`,
      description: `服务器 ${installHost.value.serverName}`,
      status:
        ticket.operationStatus === "FAILED" || ticket.operationStatus === "CANCELLED"
          ? "error"
          : ticket.operationStatus === "SUCCESS"
            ? "success"
            : "running",
      progress: ticket.operationStatus === "SUCCESS" ? 100 : 10,
      source: "system",
      mode: "stream",
      message: `安装任务已提交到 ${installHost.value.serverName}`,
      stageLabel: "等待执行",
    });
    installTaskDialogModel.value = {
      taskId,
      status: installTask.value.status || "RUNNING",
      message: installTask.value.message,
      serverIds: [installHost.value.serverId || "-"],
      summaryItems: [
        {
          label: "软件包",
          value:
            installSelectedPackage.value.packageName ||
            installSelectedPackage.value.packageCode ||
            "-",
        },
        {
          label: "版本",
          value: installSelectedVersionLabel.value || "-",
        },
        {
          label: "安装实例ID",
          value: ticket.installationId ? String(ticket.installationId) : "-",
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: [
        {
          stepKey: "SUBMIT",
          title: "安装任务提交",
          status: "SUCCESS",
          message: `任务已提交，operationId=${taskId}`,
          updatedAt: Date.now(),
        },
      ],
    };
    installTaskDialogVisible.value = true;
    installStep.value = 2;
    runtimeMessage.success("安装任务已提交");
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

const resolveTaskStatus = (status?: string | null) => {
  const normalized = String(status || "RUNNING").toUpperCase();
  if (normalized === "SUCCESS") return "SUCCESS";
  if (normalized === "FAILED" || normalized === "CANCELLED") return "FAILED";
  return "RUNNING";
};

const resolveRuntimeTaskState = (status?: string | null) => {
  const normalized = String(status || "RUNNING").toUpperCase();
  if (normalized === "SUCCESS") return "success";
  if (normalized === "FAILED" || normalized === "CANCELLED") return "error";
  return "running";
};

const resolveProgressByPayload = (payload: { progressPercent?: number; status?: string | null }) => {
  if (Number.isFinite(Number(payload.progressPercent))) {
    return Math.max(0, Math.min(100, Number(payload.progressPercent)));
  }
  return resolveTaskStatus(payload.status) === "SUCCESS" ? 100 : 50;
};

const resolveTaskStepTitle = (stage?: string | null) => {
  const normalized = String(stage || "").toUpperCase();
  const mapping: Record<string, string> = {
    PREPARE: "准备安装环境",
    DOWNLOAD: "下载安装包",
    RENDER_CONFIG: "渲染配置文件",
    INSTALL: "执行安装脚本",
    REGISTER_SERVICE: "注册服务",
    START_SERVICE: "启动服务",
    VERIFY: "安装验证",
    FINISH: "安装完成",
  };
  return mapping[normalized] || (normalized ? `阶段 ${normalized}` : "任务执行");
};

const refreshInstallTaskDialog = () => {
  if (!installTaskDialogModel.value) {
    return;
  }
  installTaskDialogModel.value = {
    ...installTaskDialogModel.value,
    updatedAt: Date.now(),
  };
};

watch(
  installOperationLatestRef,
  async (payload) => {
    if (!payload || !installTaskDialogModel.value) {
      return;
    }
    const status = resolveTaskStatus(payload.status);
    const progress = resolveProgressByPayload(payload);
    const stage = String(payload.stage || "").toUpperCase();
    const statusText = status === "SUCCESS" ? "安装成功" : status === "FAILED" ? "安装失败" : "安装执行中";
    const messageText = String(payload.message || payload.detail || statusText);
    const nextLogs = installTaskDialogModel.value.logs ? [...installTaskDialogModel.value.logs] : [];
    const line = String(payload.line || "").trim();
    if (line) {
      nextLogs.push(line);
    }
    const nextSteps = installTaskDialogModel.value.steps
      ? [...installTaskDialogModel.value.steps]
      : [];
    if (stage) {
      const stepKey = `STAGE_${stage}`;
      const exists = nextSteps.find((item) => item.stepKey === stepKey);
      if (exists) {
        exists.status = status;
        exists.message = messageText;
        exists.updatedAt = Date.now();
      } else {
        nextSteps.push({
          stepKey,
          title: resolveTaskStepTitle(stage),
          status,
          message: messageText,
          updatedAt: Date.now(),
        });
      }
    }
    installTaskDialogModel.value = {
      ...installTaskDialogModel.value,
      status,
      message: messageText,
      errorSummary: status === "FAILED" ? messageText : undefined,
      logs: nextLogs,
      updatedAt: Date.now(),
      steps: nextSteps,
    };
    installTask.value = {
      ...(installTask.value || {}),
      operationId: payload.operationId,
      installationId: payload.installationId,
      status,
      message: messageText,
    };
    runtimeTask.updateTask(installTaskDialogModel.value.taskId, {
      requestId: payload.operationId,
      status: resolveRuntimeTaskState(payload.status),
      progress,
      message: messageText,
      stageLabel: resolveTaskStepTitle(stage),
    });
    if (payload.finished) {
      if (status === "SUCCESS") {
        runtimeMessage.success("软件安装成功");
      } else if (status === "FAILED") {
        runtimeMessage.error("软件安装失败");
      }
      await loadHomeData();
    }
  },
  { deep: true },
);

watch(
  () => installTaskDialogVisible.value,
  (visible) => {
    if (!visible) {
      installOperationId.value = null;
      disconnectInstallOperationStream();
    }
  },
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
  () => softwareDetailPackageId.value,
  (value, previous) => {
    const nextId = toNumericId(value);
    if (!softwareDetailVisible.value || !nextId || nextId === toNumericId(previous)) {
      return;
    }
    void loadSoftwareDetail(nextId);
  },
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

.software-card__meta-link {
  border: 0;
  outline: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.14);
  color: #0369a1;
  font-size: 11px;
  transition: background-color 0.2s ease;
}

.software-card__meta-link:hover {
  background: rgba(14, 165, 233, 0.2);
}

.software-history {
  display: grid;
  gap: 14px;
}

.software-history__summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.software-history__summary-card {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.software-history__summary-card small {
  color: var(--soft-text-muted);
}

.software-history__summary-card strong {
  color: var(--soft-text-primary);
}

.software-history__timeline {
  max-height: 440px;
  overflow: auto;
  padding-right: 8px;
}

.software-history__item {
  display: grid;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
}

.software-history__item header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.software-history__item p {
  margin: 0;
  color: var(--soft-text-primary);
}

.software-history__item small {
  color: var(--soft-text-muted);
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

.soft-form-tabs {
  border-radius: 22px;
  overflow: hidden;
}

.software-detail__variant-select {
  min-width: 280px;
}

.software-detail__basic-grid,
.software-detail__version-grid,
.software-detail__script-list {
  display: grid;
  gap: 12px;
}

.software-detail__basic-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.software-detail__basic-card,
.software-detail__version-card,
.software-detail__script-card {
  padding: 16px;
  border-radius: 20px;
  border: 1px solid var(--soft-panel-border);
  background: var(--soft-surface);
  box-shadow: var(--soft-shadow-card);
}

.software-detail__basic-card {
  display: grid;
  gap: 8px;
}

.software-detail__basic-card small,
.software-detail__version-grid dt,
.software-detail__script-card small {
  color: var(--soft-text-muted);
  font-size: 12px;
}

.software-detail__basic-card strong,
.software-detail__version-head strong {
  color: var(--soft-text-primary);
  font-size: 16px;
}

.software-detail__basic-card span,
.software-detail__version-head p {
  margin: 0;
  color: var(--soft-text-regular);
  line-height: 1.6;
}

.software-detail__version-list {
  display: grid;
  gap: 14px;
}

.software-detail__version-collapse {
  border: none;
  background: transparent;
}

.software-detail__version-collapse :deep(.el-collapse-item__header) {
  height: auto;
  min-height: 56px;
  border: none;
  background: transparent;
  padding: 0;
}

.software-detail__version-collapse :deep(.el-collapse-item__arrow) {
  margin-left: 12px;
}

.software-detail__version-collapse :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.software-detail__version-collapse :deep(.el-collapse-item__content) {
  padding-bottom: 0;
}

.software-detail__version-card {
  display: grid;
  gap: 14px;
}

.software-detail__version-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.software-detail__version-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.software-detail__version-grid > div {
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.software-detail__version-grid dd {
  margin: 6px 0 0;
  color: var(--soft-text-primary);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}

.software-detail__version-span-2 {
  grid-column: span 2;
}

.software-detail__script-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.software-detail__script-card {
  display: grid;
  gap: 10px;
}

.software-detail__script-card pre {
  margin: 0;
  min-height: 116px;
  max-height: 240px;
  overflow: auto;
  padding: 12px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.92);
  color: #dbeafe;
  font-size: 12px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
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

  .software-detail__basic-grid,
  .software-detail__script-list {
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
  .software-history__summary,
  .create-step-strip,
  .source-directory,
  .source-panel__toolbar,
  .source-panel__toolbar-main,
  .source-form-grid,
  .source-form-grid--row,
  .source-entry__grid,
  .software-detail__install-grid,
  .software-detail__basic-grid,
  .software-detail__version-grid,
  .software-detail__script-list {
    grid-template-columns: 1fr;
  }

  .soft-hero,
  .software-card__actions,
  .source-card__header-row,
  .source-entry__head,
  .software-detail__install-actions,
  .create-group__title,
  .software-detail__head,
  .software-detail__version-head {
    display: grid;
  }

  .soft-hero__actions {
    justify-content: flex-start;
  }
}
</style>
