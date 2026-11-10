<template>
  <div class="pj">
    <div class="pj-body">
      <!-- 左侧：项目列表（rail 分组列表，双击行开日志；拖安装包到行上即升级） -->
      <aside class="pj-rail" :class="{ 'is-collapsed': railCollapsed }" :style="{ '--pj-rail-width': railWidth + 'px' }">
            <!-- 折叠态：只留一条竖条，展开按钮压在底部 -->
            <div v-if="railCollapsed" class="rail-strip">
              <button type="button" class="rail-strip__count" title="展开项目列表" @click="toggleRail">
                <b>{{ visibleCount }}</b>
                <span>/{{ list.length }}</span>
              </button>
              <span class="rail-strip__dots">
                <i class="is-on" :title="`运行中 ${statusCounts.running}`" />
                <i class="is-off" :title="`已停止 ${statusCounts.stopped}`" />
              </span>
              <span class="rail-strip__gap"></span>
              <button type="button" class="rail-strip__toggle" title="展开项目列表" @click="toggleRail">
                <ReIcon name="ArrowRight" :size="13" />
              </button>
            </div>

            <!-- 头部：标题 + 计数 + 刷新/新增 -->
            <div v-show="!railCollapsed" class="rail-head">
              <div class="rail-head__row">
                <button type="button" class="rail-tool" title="返回发布管理" @click="goBack">
                  <ReIcon name="Back" :size="12" />
                </button>
                <span class="rail-head__title">项目列表</span>
                <span class="rail-head__count">{{ visibleCount }}<i>/{{ list.length }}</i></span>
                <span class="rail-head__gap"></span>
                <button type="button" class="rail-tool" title="刷新列表" :disabled="loading" @click="loadList">
                  <ReIcon name="Refresh" :size="12" />
                </button>
                <button type="button" class="rail-tool is-primary" title="新增项目" @click="openCreateDialog">
                  <ReIcon name="Plus" :size="12" />
                </button>
              </div>
              <ReInput
                v-model="keyword"
                placeholder="搜索项目名称 / 路径 / 日志"
                clearable
                class="rail-head__search"
                prefix-icon="Search"
              />
              <div class="rail-filters">
                <button
                  v-for="f in statusFilters"
                  :key="f.key"
                  type="button"
                  class="rail-chip"
                  :class="{ 'is-active': statusFilter === f.key }"
                  @click="statusFilter = f.key"
                >
                  <span>{{ f.label }}</span>
                  <b>{{ f.count }}</b>
                </button>
              </div>
            </div>

            <!-- 分组列表：按状态分桶，空组保留占位 -->
            <ReScrollbar v-show="!railCollapsed" class="rail-list">
              <div v-for="g in groupedProjects" :key="g.key" class="rail-group">
                <button type="button" class="rail-group__head" @click="toggleGroup(g.key)">
                  <ReIcon :name="collapsedGroups.has(g.key) ? 'ArrowRight' : 'ArrowDown'" :size="11" />
                  <span class="rail-group__dot" :class="`is-${g.key}`"></span>
                  <span class="rail-group__name">{{ g.label }}</span>
                  <span class="rail-group__stat"><b>{{ g.items.length }}</b></span>
                </button>
                <template v-if="!collapsedGroups.has(g.key)">
                  <div
                    v-for="item in g.items"
                    :key="item.id"
                    class="rail-host"
                    :class="{
                      'is-active': selectedProject?.id === item.id,
                      'is-disabled': item.enabled === false,
                      'is-dragover': dragOverId === item.id,
                    }"
                    @click="onRowClick(item)"
                    @dblclick="handleViewLog(item)"
                    @contextmenu.prevent.stop="openContextMenu(item, $event)"
                    @dragover.prevent="item.enabled !== false && (dragOverId = item.id)"
                    @dragleave.prevent="dragOverId = null"
                    @drop.prevent="onDropFile(item, $event)"
                  >
                    <span class="rail-host__os" :class="[statusKey(item), mediaTone(item)]">
                      <ReIcon :name="displayIcon(item)" :size="15" />
                    </span>
                    <span class="rail-host__meta">
                      <b class="rail-host__name">{{ item.projectName }}</b>
                      <span class="rail-host__addr mono">
                        {{ statusLabel(item) }}<template v-if="statusKey(item) !== 'running'"> · {{ statusSub(item) }}</template>
                      </span>
                    </span>
                    <span class="rail-host__right">
                      <template v-if="statusKey(item) === 'running'">
                        <span class="rail-host__pid mono" :title="`PID ${item.pid || '—'}`">PID {{ item.pid || '—' }}</span>
                        <span class="rail-host__uptime mono" :title="`已运行 ${runtimeLabel(item)}`">{{ runtimeLabel(item) }}</span>
                      </template>
                      <i class="rail-host__dot" :class="`is-${statusKey(item)}`"></i>
                    </span>
                    <!-- 行内操作：悬停浮出，不占常态宽度 -->
                    <span class="rail-host__ops">
                      <template v-if="item.enabled !== false && item.runtimeProcess !== false">
                        <button v-if="item.status !== 'running'" type="button" title="启动" @click.stop="handleStart(item)">
                          <ReIcon name="VideoPlay" :size="13" />
                        </button>
                        <template v-else>
                          <button type="button" title="停止" @click.stop="handleStop(item)">
                            <ReIcon name="VideoPause" :size="13" />
                          </button>
                          <button type="button" title="重启" @click.stop="handleRestart(item)">
                            <ReIcon name="RefreshRight" :size="13" />
                          </button>
                        </template>
                      </template>
                      <button v-if="item.enabled !== false" type="button" title="用安装包升级" @click.stop="openUpgradeDialog(item)">
                        <ReIcon name="Top" :size="13" />
                      </button>
                      <el-dropdown trigger="click" placement="bottom-end" @click.stop @command="(c: string) => onMoreCommand(item, c)">
                        <button type="button" title="更多操作" @click.stop>
                          <ReIcon name="MoreFilled" :size="13" />
                        </button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item command="edit">
                              <ReIcon name="EditPen" :size="15" class="dd-ic" />编辑
                            </el-dropdown-item>
                            <el-dropdown-item command="files">
                              <ReIcon name="FolderOpened" :size="15" class="dd-ic" />文件管理
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.gitUrl" command="git-repo">
                              <ReIcon name="GitBranch" :size="15" class="dd-ic" />打开 Git 仓库
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.logPath" command="log">
                              <ReIcon name="Tickets" :size="15" class="dd-ic" />系统日志
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.projectPath" command="copy-path">
                              <ReIcon name="DocumentCopy" :size="15" class="dd-ic" />复制项目地址
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.logPath" command="copy-log">
                              <ReIcon name="DocumentCopy" :size="15" class="dd-ic" />复制日志地址
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.enabled !== false && isJavaProject(item)" command="arthas">
                              <ReIcon name="Monitor" :size="15" class="dd-ic" />Arthas 诊断
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.enabled !== false && item.javaProcess" command="swagger">
                              <ReIcon name="Link" :size="15" class="dd-ic" />Swagger 接口文档
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.enabled !== false && item.javaProcess" command="actuator">
                              <ReIcon name="DataAnalysis" :size="15" class="dd-ic" />Actuator 运行指标
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.enabled !== false && hasObservableApm(item)" command="apm">
                              <ReIcon name="DataLine" :size="15" class="dd-ic" />APM 观测
                            </el-dropdown-item>
                            <el-dropdown-item
                              v-if="item.enabled !== false && item.projectType === 'separated'"
                              command="update-lib"
                            >
                              <ReIcon name="Box" :size="15" class="dd-ic" />更新依赖包
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.enabled !== false" command="backup">
                              <ReIcon name="FolderChecked" :size="15" class="dd-ic" />备份
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.enabled !== false" command="rollback">
                              <ReIcon name="RefreshLeft" :size="15" class="dd-ic" />回滚
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.enabled !== false && item.gitUrl" command="git-deploy">
                              <ReIcon name="GitBranch" :size="15" class="dd-ic dd-success" />从 Git 更新
                            </el-dropdown-item>
                            <el-dropdown-item command="copy">
                              <ReIcon name="CopyDocument" :size="15" class="dd-ic" />复制到其他服务器
                            </el-dropdown-item>
                            <el-dropdown-item command="op-log" divided>
                              <ReIcon name="Tickets" :size="15" class="dd-ic" />操作日志
                            </el-dropdown-item>
                            <el-dropdown-item command="toggle">
                              <ReIcon :name="item.enabled === false ? 'Unlock' : 'Lock'" :size="15" class="dd-ic" />{{ item.enabled === false ? '激活' : '禁用' }}
                            </el-dropdown-item>
                            <el-dropdown-item command="delete" divided>
                              <ReIcon name="Delete" :size="15" class="dd-ic dd-danger" />删除
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </span>

                    <div v-if="dragOverId === item.id" class="pj-drop">
                      <ReIcon name="Upload" />松开即可用安装包升级「{{ item.projectName }}」
                    </div>
                  </div>
                </template>
              </div>

              <div v-if="!list.length" class="rail-empty">
                <ReIcon name="Files" :size="22" />
                <span>暂无项目，点击右上角「新增项目」创建</span>
                <ReButton type="primary" icon="Plus" :show-text="true" @click="openCreateDialog">新增项目</ReButton>
              </div>
              <div v-else-if="!visibleCount" class="rail-empty">
                <ReIcon name="Search" :size="22" />
                <span>没有符合筛选条件的项目，换个关键词或状态</span>
                <ReButton icon="Refresh" :show-text="true" @click="resetFilters">重置筛选</ReButton>
              </div>
            </ReScrollbar>

            <!-- 底部：状态统计 + 收起按钮 -->
            <div v-show="!railCollapsed" class="rail-foot">
              <div class="rail-foot__row">
                <span class="rail-foot__sum"><i class="is-on"></i>{{ statusCounts.running }}</span>
                <span class="rail-foot__sum"><i class="is-off"></i>{{ list.length - statusCounts.running }}</span>
              </div>
              <button type="button" class="rail-foot__fold" title="收起项目列表" @click="toggleRail">
                <ReIcon name="ArrowLeft" :size="12" />
              </button>
            </div>
          </aside>

          <!-- 分栏手柄：拖拽改左栏宽度，双击复位，偏好存本地 -->
          <ReRailSplit
            v-model:width="railWidth"
            class="pj-split"
            storage-key="projects.rail.width.v1"
            :default-width="268"
            label="拖拽调整项目列表宽度"
          />

          <!-- 右侧：多标签实时日志工作区 -->
          <section class="pj-workspace">
            <ReTabs
              v-model="activeWorkspaceTab"
              :tabs="workspaceTabs"
              closable
              show-close-all
              empty-text="点击左侧项目行查看系统信息；双击打开系统日志"
              :context-menu="workspaceTabMenu"
              @context-command="onWorkspaceTabCommand"
              @close="closeWorkspaceTab"
              @close-all="closeAllWorkspaceTabs"
            >
              <template #default="{ tab }">
                <ProjectLogColumn
                  v-if="logSessionByTab.get(tab.name)"
                  :key="tab.name"
                  v-model:auto-scroll="logSessionByTab.get(tab.name)!.autoScroll"
                  :project-id="logSessionByTab.get(tab.name)!.projectId"
                  :title="logSessionByTab.get(tab.name)!.projectName"
                  :source="logSessionByTab.get(tab.name)!.source"
                  :lines="logSessionByTab.get(tab.name)!.lines"
                  :notice="logSessionByTab.get(tab.name)!.notice"
                  :push-offline="logSessionByTab.get(tab.name)!.pushOffline"
                  @popup="openLogPopup(logSessionByTab.get(tab.name)!)"
                  @close="closeLogSession(logSessionByTab.get(tab.name)!)"
                />
                <ProjectInfoPanel
                  v-else-if="infoProjectOf(tab.name)"
                  :key="tab.name"
                  :project="infoProjectOf(tab.name)!"
                  :host-label="releaseHostLabel"
                  :endpoint="endpointCache[infoProjectOf(tab.name)!.id] || null"
                  :probing="!!probingIds[infoProjectOf(tab.name)!.id]"
                  :lib-count="libCountMap[infoProjectOf(tab.name)!.id] || 0"
                  :apm-label="apmLabelOf(infoProjectOf(tab.name)!)"
                  :apm-observable="hasObservableApm(infoProjectOf(tab.name)!)"
                  :can-log="!!infoProjectOf(tab.name)!.logPath"
                  @action="(c: string) => onInfoAction(infoProjectOf(tab.name)!, c)"
                />
                <HostFileManager
                  v-else-if="filesTabOf(tab.name)"
                  :key="`${tab.name}:${filesReloadSeq[Number(tab.name.slice(6))] ?? 0}`"
                  :host-id="releaseHostId"
                  :platform="hostPlatform"
                  :initial-path="filesTabOf(tab.name)!.initPath"
                />
              </template>
              <template #empty>
                <div class="pj-workspace-empty">
                  <div class="pj-workspace-empty-ic"><ReIcon name="InfoFilled" :size="26" /></div>
                  <div class="pj-workspace-empty-title">选中左侧项目查看系统信息</div>
                  <div class="pj-workspace-empty-sub">左键单击看系统信息，右键可取文件管理 / 系统日志 / 升级 / 下载源码；双击项目行直接打开系统日志</div>
                </div>
              </template>
            </ReTabs>

            <!-- 底部：激活日志页签项目的指标条（无激活页签时回退到左侧选中项目） -->
            <div v-if="metricsProject" class="pj-metrics-bar">
              <span class="pj-metrics-name" :title="metricsProject.projectName">{{ metricsProject.projectName }}</span>
              <span class="pj-metrics-chip" :class="`is-${statusKey(metricsProject)}`">
                <i class="pj-metrics-dot"></i>{{ statusLabel(metricsProject) }}
              </span>
              <span class="pj-metrics-sep"></span>
              <template v-if="statusKey(metricsProject) === 'running'">
                <span class="pj-metrics-seg">
                  <span class="pj-metrics-k">PID</span>
                  <span class="pj-metrics-v">{{ metricsProject.pid || '—' }}</span>
                </span>
                <span class="pj-metrics-sep"></span>
                <span class="pj-metrics-seg">
                  <span class="pj-metrics-k">运行</span>
                  <span class="pj-metrics-v">{{ runtimeLabel(metricsProject) }}</span>
                </span>
                <span class="pj-metrics-sep"></span>
              </template>
              <span v-else class="pj-metrics-note">{{ statusSub(metricsProject) }}</span>
              <!-- Actuator 可用时补一行运行态：健康状态 + 指标数（悬停看指标名） -->
              <template v-if="metricsEndpoint?.actuator && statusKey(metricsProject) === 'running'">
                <span class="pj-metrics-seg">
                  <span class="pj-metrics-k">健康</span>
                  <span class="pj-metrics-v">{{ metricsEndpoint.health || 'UP' }}</span>
                </span>
                <span class="pj-metrics-sep"></span>
                <el-popover placement="top" trigger="hover" :width="360" :show-after="120">
                  <template #reference>
                    <span class="pj-metrics-seg is-hover">
                      <span class="pj-metrics-k">指标</span>
                      <span class="pj-metrics-v">{{ metricsEndpoint.metricCount ?? 0 }} 项</span>
                    </span>
                  </template>
                  <div class="pj-metrics-pop">
                    <div class="pj-metrics-pop-title">
                      Actuator 指标（{{ metricsEndpoint.metricCount ?? 0 }}）
                    </div>
                    <div class="pj-metrics-pop-list">
                      <span v-for="m in (metricsEndpoint.metrics || []).slice(0, 24)" :key="m">{{ m }}</span>
                      <span v-if="!(metricsEndpoint.metrics || []).length" class="is-muted">后端未返回指标名</span>
                    </div>
                  </div>
                </el-popover>
                <span class="pj-metrics-sep"></span>
              </template>
              <span class="pj-metrics-type" :title="typeLabel(metricsProject.projectType)">{{ typeLabel(metricsProject.projectType) }}</span>
            </div>
          </section>
        </div>

    <!-- 新增/编辑对话框 -->
    <ReDialog v-model="dialogVisible" :title="editingId != null ? '编辑项目' : '新增项目'" width="960px" :close-on-click-modal="false">
      <ReTab v-model="activeTab" :tabs="editTabs" class="edit-tab">
        <!-- 基础信息 -->
        <template #basic>
          <div class="tab-grid">
            <ReForm :model="form" label-position="top" class="tab-form">
              <ReFormItem label="项目名称" required>
                <ReInput v-model="form.projectName" placeholder="如：用户服务" style="width:100%" />
              </ReFormItem>
              <ReFormItem label="项目类型" required>
                <ReSelect v-model="form.projectType" placeholder="选择项目类型" style="width:100%">
                  <ReOption label="SpringBoot 单体" value="springboot" />
                  <ReOption label="FatJar" value="fatjar" />
                  <ReOption label="Git 源码部署" value="git" />
                  <ReOption label="分离式部署" value="separated" />
                  <ReOption label="模型" value="model" />
                  <ReOption label="静态页面" value="static" />
                  <ReOption label="Nginx" value="nginx" />
                </ReSelect>
              </ReFormItem>
              <ReFormItem v-if="needsEntry" label="主入口名称" :required="mainEntryRequired">
                <ReInput v-model="form.mainEntry" :placeholder="entryPlaceholder" style="width:100%" />
              </ReFormItem>
              <!-- Git 源码部署：仓库与构建参数属于「项目类型」本身，随类型就地展开 -->
              <template v-if="showGitSection">
                <div class="git-tip">
                  <ReIcon name="GitBranch" class="git-tip-ic" />
                  <div>
                    <div class="git-tip-title">Git 源码构建</div>
                    <div class="git-tip-sub">
                      配置仓库后可在项目卡片上一键「从 Git 更新」：拉取最新代码 → Maven 构建 → 上传产物 → 备份并重启。
                      管理端无需预装 Maven，系统会自动检测并在缺失时下载。
                    </div>
                  </div>
                </div>
                <ReFormItem label="Git 仓库地址" :required="form.projectType === 'git'">
                  <ReInput
                    v-model="form.gitUrl"
                    placeholder="如 https://github.com/org/repo.git"
                    style="width:100%"
                  />
                </ReFormItem>
                <ReFormItem label="Git 分支">
                  <ReInput v-model="form.gitBranch" placeholder="默认 main" style="width:100%" />
                </ReFormItem>
                <ReFormItem label="认证方式">
                  <ReSelect v-model="form.gitAuthType" style="width:100%">
                    <ReOption label="无认证（公开仓库）" value="none" />
                    <ReOption label="Token 认证（Personal Access Token）" value="token" />
                  </ReSelect>
                </ReFormItem>
                <ReFormItem v-if="form.gitAuthType === 'token'" label="访问令牌" required>
                  <ReInput
                    v-model="form.gitToken"
                    type="password"
                    show-password
                    placeholder="粘贴 Personal Access Token"
                    style="width:100%"
                  />
                </ReFormItem>
                <ReFormItem label="Maven 构建目标">
                  <ReInput
                    v-model="form.gitBuildGoals"
                    placeholder="逗号分隔，默认 clean,package"
                    style="width:100%"
                  />
                </ReFormItem>
                <ReFormItem label="跳过测试">
                  <el-switch v-model="form.gitSkipTests" />
                  <span class="git-skip-hint">构建时跳过单元测试，加快发布速度</span>
                </ReFormItem>
                <ReFormItem label="Maven 安装路径（可选，留空则自动检测 / 自动下载）">
                  <ReInput
                    v-model="form.mavenHome"
                    placeholder="如 /opt/maven 或 C:/apache-maven-3.9.9"
                    style="width:100%"
                  />
                </ReFormItem>
                <ReFormItem label="Maven 版本（自动下载时使用）">
                  <ReInput v-model="form.mavenVersion" placeholder="默认 3.9.9" style="width:100%" />
                </ReFormItem>
              </template>
              <ReFormItem label="项目地址" required>
                <ReInput v-model="form.projectPath" placeholder="如：/opt/app/user-service" style="width:100%">
                  <template #suffix>
                    <button
                      type="button"
                      class="pj-path-browse"
                      title="从主机文件管理选择目录"
                      @click="openPathPicker('projectPath')"
                    >
                      <ReIcon name="FolderOpened" :size="14" />
                    </button>
                  </template>
                </ReInput>
              </ReFormItem>
              <ReFormItem label="日志地址" required>
                <ReInput v-model="form.logPath" placeholder="如：/opt/app/user-service/logs/app.log" style="width:100%">
                  <template #suffix>
                    <button
                      type="button"
                      class="pj-path-browse"
                      title="从主机文件管理选择日志文件"
                      @click="openPathPicker('logPath')"
                    >
                      <ReIcon name="Document" :size="14" />
                    </button>
                  </template>
                </ReInput>
              </ReFormItem>
              <ReFormItem label="重启时日志">
                <ReSelect v-model="form.logMode" style="width:100%">
                  <ReOption label="追加（保留历史日志）" value="append" />
                  <ReOption label="清空（重新写入）" value="truncate" />
                </ReSelect>
              </ReFormItem>
              <ReFormItem v-if="form.projectType === 'separated'" label="配置目录（可选，相对项目地址，如 config）">
                <ReInput v-model="form.configDir" placeholder="如：config" style="width:100%" />
              </ReFormItem>
              <ReFormItem v-if="form.projectType === 'separated'" label="依赖库目录（可选，相对项目地址，如 lib）">
                <ReInput v-model="form.libDir" placeholder="如：lib" style="width:100%" />
              </ReFormItem>
              <ReFormItem v-if="form.projectType === 'nginx'" label="Nginx 目录（nginx 安装 / 配置目录）">
                <ReInput v-model="form.nginxDir" placeholder="如：/usr/local/nginx 或 ./nginx" style="width:100%">
                  <template #suffix>
                    <button
                      type="button"
                      class="pj-path-browse"
                      title="从主机文件管理选择目录"
                      @click="openPathPicker('nginxDir')"
                    >
                      <ReIcon name="FolderOpened" :size="14" />
                    </button>
                  </template>
                </ReInput>
              </ReFormItem>
              <ReFormItem v-if="form.projectType === 'model'" label="上传目标目录（相对项目地址，如 models/onnx）" required>
                <ReInput v-model="form.uploadTargetDir" placeholder="如：models/onnx" style="width:100%" />
              </ReFormItem>
              <ReFormItem v-if="form.projectType === 'model'" label="上传时是否解压">
                <ReSelect v-model="form.uploadExtract" style="width:100%">
                  <ReOption label="解压（jar/zip/tar 自动解压）" :value="true" />
                  <ReOption label="不解压（保留原文件结构）" :value="false" />
                </ReSelect>
              </ReFormItem>
              <ReFormItem v-if="form.projectType === 'separated'" label="默认部署类型">
                <ReSelect v-model="form.deployType" style="width:100%">
                  <ReOption label="仅主包" value="main" />
                  <ReOption label="仅依赖" value="lib" />
                  <ReOption label="全部" value="both" />
                </ReSelect>
              </ReFormItem>
              <!-- 「上传后自动升级」属于投放策略，不放在基础信息里：右键「系统配置」统一改 -->
              <ReFormItem label="项目图标">
                <ReIconSelect v-model="form.icon" placeholder="留空则按类型使用默认图标" style="width:100%" />
              </ReFormItem>
              <ReFormItem label="描述">
                <ReInput v-model="form.description" type="textarea" :rows="3" placeholder="项目描述" style="width:100%" />
              </ReFormItem>
            </ReForm>
          </div>
        </template>

        <!-- 脚本配置 -->
        <template #scripts>
          <!-- 脚本模式：默认「自动」，用户不用写一行脚本也能直接运行 -->
          <div class="script-mode">
            <div class="sm-tabs" role="tablist">
              <button
                type="button"
                class="sm-tab"
                :class="{ 'is-active': scriptMode === 'auto' }"
                @click="switchScriptMode('auto')"
              >
                <ReIcon name="MagicStick" :size="13" />
                <span>自动生成（推荐）</span>
              </button>
              <button
                type="button"
                class="sm-tab"
                :class="{ 'is-active': scriptMode === 'custom' }"
                @click="switchScriptMode('custom')"
              >
                <ReIcon name="EditPen" :size="13" />
                <span>自定义脚本</span>
              </button>
            </div>
            <div class="sm-hint">
              {{ scriptMode === 'auto'
                ? '按「项目类型 + 项目地址 + 日志地址 + 主入口」自动生成 启动/停止/重启/状态，保存时生效，无需手写'
                : '四个脚本可自由编辑，下方模板仍可一键生成后微调' }}
            </div>
          </div>

          <div v-if="scriptMode === 'auto'" class="script-auto">
            <div v-if="!scriptAutoReady" class="sa-blocked">
              <ReIcon name="WarningFilled" />
              <span>先在「基础信息」选择项目类型并填写项目地址，脚本会自动生成</span>
            </div>
            <div v-else class="sa-preview">
              <!-- 手改过就不再实时覆盖：用户一旦动过输入框，基础信息变化只提示不重算 -->
              <div v-if="scriptAutoDirty" class="sa-dirty">
                <ReIcon name="EditPen" />
                <span>已手动修改脚本：基础信息再变化不会覆盖这里的命令</span>
                <ReButton icon="Refresh" :show-text="true" @click="regenerateScripts(true)">恢复自动生成</ReButton>
              </div>
              <div v-for="s in scriptPreviewRows" :key="s.key" class="sa-row">
                <div class="sa-row-head">
                  <span class="sa-row-title">{{ s.label }}</span>
                  <span class="sa-row-tag" :class="`is-${hostOs}`">{{ hostOs === 'windows' ? 'PowerShell' : 'Shell' }}</span>
                </div>
                <textarea
                  class="sa-row-code sa-row-edit"
                  spellcheck="false"
                  :value="form[s.key]"
                  placeholder="（待生成）"
                  @input="onAutoScriptEdit(s.key, $event)"
                ></textarea>
              </div>
              <div class="sa-foot">
                <span>变量设置里的环境变量 / JVM 参数 / 程序参数会在保存时自动注入启动脚本</span>
                <ReButton icon="Refresh" :show-text="false" title="重新生成" @click="regenerateScripts(true)" />
              </div>
            </div>
          </div>

          <template v-else>
            <div class="script-autogen">
              <div class="sa-text">
                <ReIcon name="MagicStick" class="sa-ic" />
                <div>
                  <div class="sa-title">一键生成脚本</div>
                  <div class="sa-sub">
                    {{ anyScriptEmpty ? '脚本未填写完整，点右侧按 项目地址/日志/主入口 生成' : '可用内置模板一键覆盖为 启动·停止·重启·状态 四个命令' }}
                  </div>
                </div>
              </div>
              <ReButton icon="MagicStick" type="primary" :loading="autogenLoading" @click="autoGenerateScripts">一键生成四个脚本</ReButton>
            </div>
            <div class="script-list">
              <ReCommand v-model="form.startScript" :context="scriptContext" :os="hostOs" :project-type="form.projectType" label="启动命令" :rows="4" script-kind="start" />
              <ReCommand v-model="form.stopScript" :context="scriptContext" :os="hostOs" :project-type="form.projectType" label="停止命令" :rows="4" script-kind="stop" />
              <ReCommand v-model="form.restartScript" :context="scriptContext" :os="hostOs" :project-type="form.projectType" label="重启命令" :rows="4" script-kind="restart" />
              <ReCommand v-model="form.statusScript" :context="scriptContext" :os="hostOs" :project-type="form.projectType" label="状态命令" :rows="3" script-kind="status" />
            </div>
          </template>
        </template>

        <!-- 变量设置 -->
        <template #vars>
          <div class="vars-summary">
            <div v-if="supportsAppConfig" class="vars-block">
              <div class="vars-card" @click="openAppConfigDialog">
                <ReIcon name="Files" class="vars-card-ic" />
                <div class="vars-card-meta">
                  <div class="vars-card-title">项目配置（Spring Boot 外部配置）</div>
                  <div class="vars-card-count">{{ form.appConfig.length }} 项 · 生成 config/application.properties 覆盖 jar 内配置</div>
                </div>
                <ReButton icon="ArrowRight" layout="square" title="编辑" @click.stop="openAppConfigDialog" />
              </div>
            </div>
            <div v-for="v in varCards" :key="v.cat" class="vars-block">
              <div class="vars-card" @click="openVarsDialog(v.cat)">
                <ReIcon :name="v.icon" class="vars-card-ic" />
                <div class="vars-card-meta">
                  <div class="vars-card-title">{{ v.title }}</div>
                  <div class="vars-card-count">{{ v.count }}</div>
                </div>
                <ReButton
                  :icon="varsExpanded === v.cat ? 'ArrowDown' : 'ArrowRight'"
                  layout="square"

                  :title="varsExpanded === v.cat ? '折叠' : '展开'"
                  @click.stop="toggleVarsExpand(v.cat)"
                />
              </div>
              <div v-show="varsExpanded === v.cat" class="vars-inline">
                <div v-if="!v.items.length" class="vars-inline-empty">暂无配置，点击卡片添加</div>
                <span v-for="(s, i) in v.items" :key="i" class="vars-chip">{{ s }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 系统管理 -->
        <template #system>
          <div class="sys-pane">
            <div class="sys-card">
              <div class="sys-card-head">
                <ReIcon name="Connection" class="sys-head-ic" />
                <div class="sys-head-text">
                  <div class="sys-card-title">系统服务</div>
                  <div class="sys-card-sub">将项目挂载为系统服务，统一管理生命周期</div>
                </div>
                <el-tag v-if="form.serviceName" type="success" effect="light" round >已挂载</el-tag>
                <el-tag v-else type="info" effect="plain" round >未挂载</el-tag>
              </div>

              <ReForm label-position="top" class="sys-form">
                <ReFormItem label="服务名称（留空自动生成；挂载后如需变更请先卸载）">
                  <ReInput
                    v-model="form.serviceName"
                    :disabled="!!form.serviceName"
                    :placeholder="`自动生成，如 ${serviceNamePreview}`"
                  />
                </ReFormItem>
              </ReForm>

              <div class="sys-switches">
                <div class="sys-switch">
                  <div class="ssw-text">
                    <div class="ssw-title">开机自启动</div>
                    <div class="ssw-desc">主机开机 / 登录后自动拉起项目</div>
                  </div>
                  <el-switch v-model="form.autostart" />
                </div>
                <div class="sys-switch">
                  <div class="ssw-text">
                    <div class="ssw-title">守护进程</div>
                    <div class="ssw-desc">定时检测状态，进程异常退出自动重启（需状态命令）</div>
                  </div>
                  <el-switch v-model="form.guardian" />
                </div>
              </div>

              <div class="sys-actions">
                <ReButton v-if="!form.serviceName" icon="Connection" type="primary" @click="handleInstallService">挂载系统服务</ReButton>
                <ReButton v-else icon="Delete" type="danger" @click="handleUninstallService">卸载系统服务</ReButton>
              </div>
            </div>
          </div>
        </template>

        <template #backups>
          <div class="bk-pane">
            <div class="bk-toolbar">
              <ReIcon name="Files" class="bk-toolbar-ic" />
              <div class="bk-toolbar-text">
                <div class="bk-title">备份记录</div>
                <div class="bk-sub">备份保存在项目目录 backups/ 下，可用于升级前备份与回滚</div>
              </div>
              <ReButton icon="FolderChecked" type="primary" :loading="backupActionLoading" @click="handleBackupNow">立即备份</ReButton>
            </div>
            <div v-if="backupLoading" class="bk-state-tip">加载备份记录…</div>
            <div v-else-if="backupError" class="bk-state-tip bk-state-tip--error">
              <ReIcon name="WarningFilled" />
              <div>
                <div>{{ backupError }}</div>
                <div class="bk-state-hint">备份记录依赖目标主机的远程执行能力：请先在「主机管理」为该主机打开 SSH 并确认 OpenSSH 已启动，再回来重试。</div>
              </div>
            </div>
            <div v-else-if="!backupRows.length" class="bk-empty">
              <ReIcon name="FolderOpened" :size="30" />
              <div>暂无备份记录，点击右上角「立即备份」创建</div>
            </div>
            <div v-else class="bk-list">
              <div v-for="b in backupRows" :key="b.name" class="bk-row">
                <ReIcon :name="b.kind === 'dir' ? 'Folder' : 'Document'" class="bk-row-ic" />
                <div class="bk-row-main">
                  <div class="bk-row-name">{{ b.name }}</div>
                  <div class="bk-row-meta">{{ formatBackupTime(b.time) }} · {{ b.kind === 'dir' ? '目录镜像' : '压缩包' }}<template v-if="b.size != null"> · {{ formatSize(b.size) }}</template></div>
                </div>
                <ReButton icon="RefreshLeft" @click="handleRollbackTo(b)">回滚</ReButton>
              </div>
            </div>
          </div>
        </template>

        <!-- APM 注入（高级选项，仅 Java 类项目显示） -->
        <template #apm>
          <div class="apm-pane">
            <div class="apm-tip">
              APM JavaAgent 高级选项：选择后在项目启动脚本（java -jar）中挂载 agent，重启项目即开始上报
              调用链与监控信息。jar 路径为<b>目标主机上</b>的绝对路径，保存前请确认 agent 已就位。
            </div>
            <ReForm label-position="top" class="apm-form">
              <ReFormItem label="APM 类型">
                <ReSelect v-model="form.apmType" style="width:100%">
                  <ReOption label="不启用" value="none" />
                  <ReOption label="平台自有 APM（runtime-agent）" value="platform" />
                  <ReOption label="SkyWalking" value="skywalking" />
                  <ReOption label="Arthas 诊断" value="arthas" />
                </ReSelect>
              </ReFormItem>

              <template v-if="form.apmType === 'platform'">
                <ReFormItem label="Agent jar 路径（目标主机绝对路径）">
                  <ReInput v-model="form.apmJarPath" placeholder="如 /opt/agent/apm-agent.jar" style="width:100%" />
                </ReFormItem>
                <ReFormItem label="agent 参数（逗号分隔，不含前缀）">
                  <ReInput v-model="form.apmOptions" placeholder="如 port=4567" style="width:100%" />
                </ReFormItem>
              </template>

              <template v-if="form.apmType === 'skywalking'">
                <ReFormItem label="SkyWalking agent jar 路径（目标主机绝对路径）">
                  <ReInput v-model="form.swJarPath" placeholder="如 /opt/skywalking/skywalking-agent.jar" style="width:100%" />
                </ReFormItem>
                <ReFormItem label="service_name（服务名，上报到 OAP 后按此聚合）">
                  <ReInput v-model="form.swServiceName" :placeholder="`默认 ${form.projectName || '项目名'}`" style="width:100%" />
                </ReFormItem>
                <ReFormItem label="collector.backend_service（OAP 地址，如 oap:11800）">
                  <ReInput v-model="form.swBackendService" placeholder="如 192.168.50.198:11800" style="width:100%" />
                </ReFormItem>
                <ReFormItem label="其它 -Dskywalking 参数（空格分隔，可选）">
                  <ReInput v-model="form.swExtraArgs" placeholder="如 -Dskywalking.logging.dir=/opt/skywalking/logs" style="width:100%" />
                </ReFormItem>
              </template>

              <template v-if="form.apmType === 'arthas'">
                <ReFormItem label="Arthas agent jar 路径（目标主机绝对路径）">
                  <ReInput v-model="form.arthasJarPath" placeholder="如 /opt/arthas/arthas-agent.jar" style="width:100%" />
                </ReFormItem>
                <ReFormItem label="Telnet 端口（Arthas 交互端口）">
                  <ReInput v-model.number="form.arthasTelnetPort" type="number" style="width:100%" />
                </ReFormItem>
                <ReFormItem label="HTTP 端口（Arthas Web 控制台端口）">
                  <ReInput v-model.number="form.arthasHttpPort" type="number" style="width:100%" />
                </ReFormItem>
                <div class="apm-tip" style="margin-top:8px">
                  <ReIcon name="InfoFilled" />
                  <span>Arthas 通过 javaagent 挂载后，提供 telnet 交互式诊断（dashboard / thread / jvm 等命令）。也可在 Arthas 管理页运行时 attach，无需重启项目。</span>
                </div>
              </template>

              <ReFormItem v-if="form.apmType !== 'none'" label="启动命令预览">
                <pre class="apm-preview">java {{ apmPreviewArgs }} -jar {{ form.mainEntry || '&lt;主入口&gt;' }} ...</pre>
              </ReFormItem>
            </ReForm>
          </div>
        </template>

        <!-- 定时发布（仅编辑已存在项目） -->
        <template #schedule>
          <div class="sched-pane">
            <div class="sched-card">
              <div class="sched-head">
                <ReIcon name="Timer" class="sched-ic" />
                <div class="sched-head-text">
                  <div class="sched-title">一次性定时发布</div>
                  <div class="sched-sub">到点自动执行一次「升级发布」，完成后任务自动注销</div>
                </div>
                <el-switch v-model="form.scheduleEnabled" />
              </div>
              <div v-if="form.scheduleEnabled" class="sched-body">
                <ReFormItem label="发布时间" required>
                  <el-date-picker
                    v-model="form.scheduleTime"
                    type="datetime"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    placeholder="选择发布时间"
                    style="width:100%"
                  />
                </ReFormItem>
                <div class="sched-tip">
                  <ReIcon name="InfoFilled" />
                  <span>时间需晚于当前时间；使用「升级」的默认配置（备份 / 解压 / 重启 / 回滚）。</span>
                </div>
              </div>
              <div v-if="editingId != null" class="sched-runtime">
                <span class="sched-runtime-k">运行态</span>
                <span class="sched-runtime-v">{{ publishStatusText(scheduleStatusMap[editingId]) }}</span>
                <span v-if="form.scheduleStatus" class="sched-runtime-status">{{ form.scheduleStatus }}</span>
              </div>
            </div>

            <div v-if="form.gitUrl" class="sched-card">
              <div class="sched-head">
                <ReIcon name="GitBranch" class="sched-ic" />
                <div class="sched-head-text">
                  <div class="sched-title">Git 定时拉取</div>
                  <div class="sched-sub">按 cron 检查远端分支，有更新才拉取构建并自动发布</div>
                </div>
                <el-switch v-model="form.gitPollEnabled" />
              </div>
              <div v-if="form.gitPollEnabled" class="sched-body">
                <ReFormItem label="检查频率（cron）" required>
                  <ReCron v-model="form.gitPollCron" />
                </ReFormItem>
                <div class="sched-tip">
                  <ReIcon name="InfoFilled" />
                  <span>默认每 5 分钟检查一次（0 */5 * * * ?）；无更新时不会触发构建。</span>
                </div>
              </div>
              <div v-if="editingId != null" class="sched-runtime">
                <span class="sched-runtime-k">运行态</span>
                <span class="sched-runtime-v">{{ gitPollStatusText(scheduleStatusMap[editingId]) }}</span>
                <span v-if="form.gitLastCommit" class="sched-runtime-commit" :title="form.gitLastCommit">
                  {{ form.gitLastCommit.slice(0, 8) }}
                </span>
              </div>
            </div>

            <div v-else class="sched-tip sched-tip-alone">
              <ReIcon name="InfoFilled" />
              <span>先在上方填写「Git 仓库地址」并保存，才能开启 Git 定时拉取。</span>
            </div>
          </div>
        </template>
      </ReTab>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="handleSave">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 变量设置弹窗 -->
    <ReDialog v-model="varsVisible" title="变量设置" width="720px" :close-on-click-modal="false">
      <div class="vd-cats">
        <span class="vd-cat" :class="{ active: varsCategory === 'env' }" @click="varsCategory = 'env'">环境变量</span>
        <span class="vd-cat" :class="{ active: varsCategory === 'jvm' }" @click="varsCategory = 'jvm'">JVM 参数</span>
        <span class="vd-cat" :class="{ active: varsCategory === 'app' }" @click="varsCategory = 'app'">命令参数</span>
      </div>

      <div class="vd-ph">
        <span class="vd-ph-hint">值支持占位符，执行时解析：</span>
        <span class="vd-ph-chip" @click="insertPlaceholder('${KEY:默认值}')">${KEY:默认值}</span>
        <span class="vd-ph-chip" @click="insertPlaceholder('${now(yyyy-MM-dd)}')">${now(yyyy-MM-dd)}</span>
        <span class="vd-ph-chip" @click="insertPlaceholder('${now(yyyyMMddHHmmss)}')">${now(时间戳)}</span>
        <span class="vd-ph-chip" @click="insertPlaceholder('${uuid}')">${uuid}</span>
        <span class="vd-ph-chip" @click="insertPlaceholder('${random(100)}')">${random(n)}</span>
      </div>

      <div class="vd-rows">
        <div v-for="(row, idx) in varsRows" :key="idx" class="vd-row">
          <el-select
            v-model="row.key"
            filterable
            allow-create
            default-first-option
            :reserve-keyword="false"
            class="vd-key"
            :placeholder="keyPlaceholder"
          >
            <el-option v-for="o in currentCatalog" :key="o.flag" :label="o.flag" :value="o.flag">
              <span class="vd-opt-flag">{{ o.flag }}</span>
              <span class="vd-opt-desc">{{ o.desc }}</span>
            </el-option>
          </el-select>
          <el-input
            v-if="!isBooleanRow(row)"
            v-model="row.value"
            class="vd-val"
            :placeholder="valuePlaceholder"
            @focus="onValFocus"
          />
          <span v-else class="vd-boolean">开关项（无需值）</span>
          <ReButton icon="Close" layout="square" title="移除" @click="varsRows.splice(idx, 1)" />
        </div>
        <ReButton icon="Plus" :show-text="true" class="vd-add" @click="varsRows.push({ key: '', value: '' })">添加一行</ReButton>
      </div>
      <template #footer>
        <ReButton @click="varsVisible = false">取消</ReButton>
        <ReButton type="primary" @click="confirmVars">确定</ReButton>
      </template>
    </ReDialog>

    <!-- SpringBoot 项目配置弹窗 -->
    <ReDialog v-model="appCfgVisible" title="项目配置 · Spring Boot 外部配置" width="720px" :close-on-click-modal="false">
      <div class="acfg-tip">
        保存后在项目目录生成 <code>config/application.properties</code>，Spring Boot 会自动加载且优先级高于 jar 内配置。
      </div>
      <div class="vd-rows">
        <div v-for="(row, idx) in appCfgRows" :key="idx" class="vd-row">
          <el-input v-model="row.key" class="vd-key-acfg" placeholder="配置键，如 server.port" />
          <el-input v-model="row.value" class="vd-val" placeholder="配置值，如 8081" />
          <ReButton icon="Close" layout="square" title="移除" @click="appCfgRows.splice(idx, 1)" />
        </div>
        <ReButton icon="Plus" :show-text="true" class="vd-add" @click="appCfgRows.push({ key: '', value: '' })">添加一项</ReButton>
      </div>
      <template #footer>
        <ReButton @click="appCfgVisible = false">取消</ReButton>
        <ReButton type="primary" @click="confirmAppConfig">确定</ReButton>
      </template>
    </ReDialog>

    <!-- 手动升级对话框：按项目默认配置预填 -->
    <ReDialog
      v-model="upgVisible"
      :title="`升级项目 · ${upgProject?.projectName || ''}`"
      width="620px"
      :close-on-click-modal="false"
    >
      <div class="upg-pane" v-loading="upgLoading">
        <!-- 项目级基线：这些值来自项目自身配置，不是全局残留 -->
        <div class="upg-baseline">
          <div class="upg-base-row">
            <span class="upg-base-k">项目类型</span>
            <span class="upg-base-v">{{ typeLabel(upgProject?.projectType || '') }}</span>
            <span class="upg-base-k">部署类型</span>
            <span class="upg-base-v">{{ deployTypeLabel(upgProject?.deployType) }}</span>
          </div>
          <div class="upg-base-row">
            <span class="upg-base-k">主入口</span>
            <span class="upg-base-v mono">{{ upgProject?.mainEntry || '—' }}</span>
          </div>
          <div class="upg-base-row">
            <span class="upg-base-k">上传目录</span>
            <span class="upg-base-v mono">{{ upgProject?.uploadTargetDir || '—' }}</span>
          </div>
          <div class="upg-base-note">
            <ReIcon name="InfoFilled" class="upg-base-note-ic" />
            <span>
              {{ upgHasProjectCfg
                ? '已载入该项目保存过的默认配置，可再次调整并保存。'
                : '当前显示该项目自身配置的默认值（部署类型 / 解压 / 上传目录均取自项目）。' }}
            </span>
          </div>
        </div>

        <ReForm label-position="top">
          <!-- 本地安装包：先传到目标主机的 uploads/，再把远端绝对路径回填到下面 -->
          <ReFormItem label="本地安装包（可选：上传后自动回填路径）">
            <div
              class="upg-upload"
              :class="{ 'is-busy': upgUploading }"
              @dragover.prevent
              @drop.prevent="onUpgDrop"
            >
              <ReIcon name="Upload" class="upg-upload-ic" />
              <div class="upg-upload-body">
                <div class="upg-upload-title">
                  <template v-if="upgUploading">正在上传到目标主机…</template>
                  <template v-else>
                    拖入安装包，或
                    <button type="button" class="upg-upload-link" @click="pickUpgFile">选择文件</button>
                  </template>
                </div>
                <div class="upg-upload-sub">
                  {{
                    upgUploadedName
                      ? `已上传：${upgUploadedName}`
                      : '上传到项目目录的 uploads/，不会自动覆盖正在运行的包'
                  }}
                </div>
              </div>
              <input ref="upgFileInput" type="file" class="upg-upload-input" @change="onUpgFilePicked" />
            </div>
          </ReFormItem>
          <ReFormItem label="安装包路径（主机上的绝对路径，jar / tar.gz / zip；为空则仅执行重启）">
            <ReInput v-model="upgForm.packagePath" placeholder="如：/home/ubuntu/uploads/app.tar.gz" />
          </ReFormItem>
          <ReFormItem v-if="upgProject?.projectType === 'separated'" label="部署类型">
            <ReSelect v-model="upgForm.deployType" style="width:100%">
              <ReOption label="仅主包" value="main" />
              <ReOption label="仅依赖" value="lib" />
              <ReOption label="全部" value="both" />
            </ReSelect>
          </ReFormItem>
          <ReFormItem
            v-if="upgProject?.projectType === 'model' || upgProject?.projectType === 'separated'"
            label="是否解压"
          >
            <ReSelect v-model="upgForm.uploadExtract" style="width:100%">
              <ReOption label="解压（jar/zip/tar 自动解压）" :value="true" />
              <ReOption label="不解压（保留原文件结构）" :value="false" />
            </ReSelect>
          </ReFormItem>
          <ReFormItem
            v-if="upgProject?.projectType === 'model'"
            label="上传目标目录（相对项目地址）"
          >
            <ReInput v-model="upgForm.uploadTargetDir" placeholder="如：models/onnx" />
          </ReFormItem>
        </ReForm>

        <div class="upg-switches">
          <label class="upg-switch"><el-checkbox v-model="upgForm.autoBackup" />自动备份</label>
          <label class="upg-switch"><el-checkbox v-model="upgForm.autoExtract" />自动解压（压缩包）</label>
          <label class="upg-switch"><el-checkbox v-model="upgForm.autoRestart" />自动重启</label>
          <label class="upg-switch"><el-checkbox v-model="upgForm.autoRollback" />失败自动回滚（需状态命令）</label>
        </div>
      </div>
      <template #footer>
        <ReButton @click="saveGlobalConfig">保存为全局默认</ReButton>
        <ReButton icon="CollectionTag" @click="saveProjectConfig">保存为项目默认</ReButton>
        <ReButton @click="upgVisible = false">取消</ReButton>
        <ReButton type="primary" @click="executeUpgrade">执行升级</ReButton>
      </template>
    </ReDialog>

    <!-- 系统配置（右键）：上传后自动升级 + 升级默认选项，统一放在这里而不是编辑页 -->
    <ReDialog
      v-model="sysCfgVisible"
      :title="sysCfgProject ? `系统配置 - ${sysCfgProject.projectName}` : '系统配置'"
      width="560px"
      :close-on-click-modal="false"
    >
      <div v-loading="sysCfgLoading" class="syscfg">
        <section class="syscfg-section">
          <div class="syscfg-title"><ReIcon name="Upload" :size="13" />投放策略</div>
          <div class="syscfg-row">
            <div class="syscfg-label">
              <b>上传后自动升级</b>
              <span>上传安装包后立即投放并重启；关闭时只上传到上传目录，确认后再手动升级</span>
            </div>
            <el-switch v-model="sysCfg.uploadAutoUpgrade" />
          </div>
        </section>

        <section class="syscfg-section">
          <div class="syscfg-title"><ReIcon name="Top" :size="13" />升级默认配置</div>
          <div class="upg-switches">
            <label class="upg-switch"><el-checkbox v-model="sysCfg.autoBackup" />自动备份</label>
            <label class="upg-switch"><el-checkbox v-model="sysCfg.autoExtract" />自动解压（压缩包）</label>
            <label class="upg-switch"><el-checkbox v-model="sysCfg.autoRestart" />自动重启</label>
            <label class="upg-switch"><el-checkbox v-model="sysCfg.autoRollback" />失败自动回滚（需状态命令）</label>
          </div>
        </section>

        <section class="syscfg-section">
          <div class="syscfg-title"><ReIcon name="Document" :size="13" />日志</div>
          <div class="syscfg-row">
            <div class="syscfg-label">
              <b>读取多少行日志</b>
              <span>打开日志列与实时跟随的历史回放行数，10 ~ 5000 行，默认 100</span>
            </div>
            <el-input-number
              v-model="sysCfg.logLines"
              :min="10"
              :max="5000"
              :step="50"
              size="small"
              controls-position="right"
              style="width: 130px"
            />
          </div>
        </section>

        <section v-if="sysCfgActuatorAvailable" class="syscfg-section">
          <div class="syscfg-title"><ReIcon name="DataAnalysis" :size="13" />Actuator 定时采集</div>
          <div class="syscfg-row">
            <div class="syscfg-label">
              <b>定时采集运行指标</b>
              <span>由全局时间轮统一采集，结果经发布管理 SSE 推送到页面；关闭后只保留手动探测</span>
            </div>
            <el-switch v-model="sysCfg.actuatorMonitorEnabled" />
          </div>
          <div v-if="sysCfg.actuatorMonitorEnabled" class="syscfg-row">
            <div class="syscfg-label">
              <b>采集间隔</b>
              <span>5 ~ 3600 秒，所有项目共用同一个时间轮与一条长连接</span>
            </div>
            <el-input-number
              v-model="sysCfg.actuatorIntervalSeconds"
              :min="5"
              :max="3600"
              :step="5"
              size="small"
              controls-position="right"
              style="width: 130px"
            />
          </div>
        </section>

        <div class="syscfg-note">
          <ReIcon name="InfoFilled" />
          <span>保存后作为该项目的升级默认值；每次升级弹框里仍可临时调整，不影响这里的默认。</span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="sysCfgVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="sysCfgSaving" @click="saveSystemConfig">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 主机路径选择器：项目地址 / 日志地址 / Nginx 目录 -->
    <ReDialog
      v-model="pathPickerVisible"
      :title="pathPickerTitle"
      width="900px"
      :close-on-click-modal="false"
    >
      <div class="path-picker-body">
        <div v-if="!releaseHostId" class="path-picker-empty">该发布未绑定主机，无法浏览主机文件</div>
        <HostFileManager
          v-else-if="pathPickerVisible"
          :host-id="releaseHostId"
          :platform="hostPlatform"
          :initial-path="pathPickerInit"
          pick-mode
          @pick="onPathPicked"
        />
      </div>
    </ReDialog>

    <!-- 项目 Git 仓库：分支 / 提交 / 工作区改动 + 拉取（不可关闭的进度弹窗） -->
    <GitRepositoryDialog ref="gitDialogRef" :project="gitRepoProject" @edit="onGitRepoEdit" />

    <!-- 单项目操作日志：启动/升级/回滚等审计记录，按项目过滤 -->
    <ReDialog
      v-model="projOpLogVisible"
      :title="projOpLogProject ? `操作日志 - ${projOpLogProject.projectName}` : '操作日志'"
      width="1000px"
      :close-on-click-modal="false"
    >
      <ProjectOpLogPanel v-if="projOpLogVisible" :project-id="projOpLogProject?.id" />
      <template #footer>
        <ReButton @click="projOpLogVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 系统日志弹窗：每个会话一个，关闭弹窗不影响内嵌列 -->
    <ReDialog
      v-for="session in logSessions"
      :key="`log-popup-${session.projectId}`"
      v-model="session.popupVisible"
      :title="`系统日志 - ${session.projectName}`"
      width="900px"
      :close-on-click-modal="false"
    >
      <ProjectLogColumn
        popup
        v-model:auto-scroll="session.popupAutoScroll"
        :project-id="session.projectId"
        :title="session.projectName"
        :source="session.source"
        :lines="session.lines"
        :notice="session.notice"
        :push-offline="session.pushOffline"
        @close="closeLogSession(session)"
      />
    </ReDialog>

    <!-- 复制项目到其他服务器 -->
    <ReDialog v-model="copyDialogVisible" :title="`复制项目 - ${copySource?.projectName || ''}`" width="560px" :close-on-click-modal="false">
      <div v-loading="copyLoading" class="copy-wrap">
        <div class="copy-tip">
          <ReIcon name="InfoFilled" />
          <span>复制会带上项目的全部配置（脚本 / 变量 / 路径 / Git 配置等），只把「发布」换成目标服务器；目标机上的进程需自行启动。</span>
        </div>
        <ReFormItem label="目标服务器（可多选）" required>
          <el-select v-model="copyTargets" multiple filterable placeholder="选择目标服务器" style="width:100%">
            <el-option
              v-for="r in copyReleases"
              :key="r.id"
              :label="`${r.releaseName}${r.hostIp ? ' · ' + r.hostIp : ''}`"
              :value="r.id"
            />
          </el-select>
        </ReFormItem>
        <div v-if="!copyLoading && !copyReleases.length" class="copy-empty">暂无其他服务器可复制（先在发布管理里创建发布）</div>
      </div>
      <template #footer>
        <ReButton @click="copyDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="copySubmitting" @click="submitCopy">开始复制</ReButton>
      </template>
    </ReDialog>

    <!-- Swagger / Actuator 入口 -->
    <ReDialog v-model="endpointDialogVisible" :title="`服务入口 - ${endpointProject?.projectName || ''}`" width="700px">
      <div v-loading="endpointLoading" class="ep-wrap">
        <div class="ep-card" :class="{ 'is-ok': endpointData?.swagger }">
          <div class="ep-head">
            <ReIcon name="Link" class="ep-ic" />
            <span class="ep-name">Swagger 接口文档</span>
            <el-tag size="small" :type="endpointData?.swagger ? 'success' : 'info'" effect="light">
              {{ endpointData?.swagger ? '可用' : '未探测到' }}
            </el-tag>
            <span v-if="endpointData?.port" class="ep-port">端口 {{ endpointData.port }}</span>
          </div>
          <div class="ep-body">
            <template v-if="endpointData?.swagger">
              <a class="ep-link" :href="endpointData.swaggerUrl" target="_blank" rel="noreferrer">{{ endpointData.swaggerUrl }}</a>
              <a class="ep-link ep-link-sub" :href="endpointData.swaggerApiUrl" target="_blank" rel="noreferrer">
                OpenAPI JSON：{{ endpointData.swaggerApiUrl }}
              </a>
            </template>
            <div v-else class="ep-empty">
              {{ endpointData?.message || '未探测到 Swagger（项目需引入 springdoc-openapi / knife4j）' }}
            </div>
          </div>
          <div class="ep-actions">
            <ReButton icon="Refresh" size="small" @click="endpointProject && openEndpointDialog(endpointProject, 'swagger')">重新探测</ReButton>
            <ReButton v-if="endpointData?.swagger" icon="TopRight" size="small" type="primary" @click="openInNewTab(endpointData?.swaggerUrl)">打开</ReButton>
          </div>
        </div>

        <div class="ep-card" :class="{ 'is-ok': endpointData?.actuator }">
          <div class="ep-head">
            <ReIcon name="DataAnalysis" class="ep-ic" />
            <span class="ep-name">Actuator 运行指标</span>
            <el-tag size="small" :type="endpointData?.actuator ? 'success' : 'info'" effect="light">
              {{ endpointData?.actuator ? '可用' : '未探测到' }}
            </el-tag>
          </div>
          <div class="ep-body">
            <template v-if="endpointData?.actuator">
              <div class="ep-health">
                <span class="ep-health-k">健康状态</span>
                <el-tag size="small" :type="endpointData.health === 'UP' ? 'success' : 'warning'" effect="dark">
                  {{ endpointData.health || 'UNKNOWN' }}
                </el-tag>
                <span v-if="endpointData.metricCount != null" class="ep-health-k">指标 {{ endpointData.metricCount }} 项</span>
              </div>
              <a class="ep-link" :href="endpointData.actuatorUrl" target="_blank" rel="noreferrer">{{ endpointData.actuatorUrl }}</a>
              <div v-if="endpointData.metrics?.length" class="ep-metrics">
                <span v-for="m in endpointData.metrics" :key="m" class="ep-metric">{{ m }}</span>
              </div>
            </template>
            <div v-else class="ep-empty">
              {{ endpointData?.message || '未探测到 Actuator（需暴露 management.endpoints.web.exposure.include）' }}
            </div>
          </div>
          <div class="ep-actions">
            <ReButton icon="Refresh" size="small" @click="endpointProject && openEndpointDialog(endpointProject, 'actuator')">重新探测</ReButton>
            <ReButton v-if="endpointData?.actuator" icon="TopRight" size="small" type="primary" @click="openInNewTab(endpointData?.actuatorUrl)">打开</ReButton>
          </div>
        </div>
      </div>
    </ReDialog>

    <!-- 健康检测对话框 -->
    <ReDialog v-model="healthVisible" :title="`健康检测 - ${healthProject?.projectName || ''}`" width="640px">
      <div class="hc-wrap">
        <div class="hc-tip">在项目所在主机上发起 HTTP 请求，仅状态码 200 判定为健康。</div>
        <div class="hc-field">
          <span class="hc-label">检测地址</span>
          <ReInput
            v-model="healthUrl"
            placeholder="http://127.0.0.1:8080/actuator/health"
            style="width:100%"
          />
        </div>
        <div class="hc-actions">
          <ReButton icon="DocumentChecked" :loading="healthSaving" @click="saveHealthUrl">保存地址</ReButton>
          <ReButton icon="Refresh" type="primary" :loading="healthChecking" @click="runHealthCheck">立即检测</ReButton>
        </div>
        <div v-if="healthResult" class="hc-result" :class="healthResult.ok ? 'is-ok' : 'is-bad'">
          <div class="hc-result-head">
            <el-tag size="small" :type="healthResult.ok ? 'success' : 'danger'" effect="dark">
              {{ healthResult.ok ? '健康' : '异常' }}
            </el-tag>
            <span class="hc-code">HTTP {{ healthResult.statusCode || '—' }}</span>
            <span class="hc-cost">{{ healthResult.elapsedMs }} ms</span>
          </div>
          <div class="hc-result-msg">{{ healthResult.message }}</div>
          <div class="hc-result-url">{{ healthResult.url }}</div>
          <div class="hc-result-time">检测时间 {{ healthResult.checkedAt }}</div>
        </div>
      </div>
    </ReDialog>

    <!-- Arthas 诊断对话框 -->
    <ReDialog v-model="arthasDialogVisible" :title="`Arthas 诊断 - ${arthasProject?.projectName || ''}`" width="860px" :close-on-click-modal="false" :footer-hidden="true">
      <div class="arthas-wrap">
        <!-- 状态栏 -->
        <div class="arthas-status-bar">
          <span class="arthas-badge" :class="{ 'arthas-badge-on': arthasRunning }">
            {{ arthasRunning ? '运行中' : '已停止' }}
          </span>
          <span v-if="arthasPid" class="arthas-pid">PID: {{ arthasPid }}</span>
          <div class="arthas-status-actions">
            <ReButton v-if="!arthasRunning" size="small" type="primary" :loading="arthasAttaching" @click="doArthasAttach">Attach</ReButton>
            <ReButton v-else size="small" type="danger" :loading="arthasDetaching" @click="doArthasDetach">Detach</ReButton>
            <ReButton size="small" @click="loadArthasConsole">刷新输出</ReButton>
          </div>
        </div>

        <!-- 终端输出 -->
        <div class="arthas-terminal" ref="arthasTerminalEl">
          <pre>{{ arthasConsoleOutput || '（无输出，请先 Attach Arthas）' }}</pre>
        </div>

        <!-- 命令输入 -->
        <div class="arthas-input-row">
          <ReInput
            v-model="arthasCommand"
            placeholder="输入 Arthas 命令，如 dashboard / thread / jvm"
            @keyup.enter="doArthasExec"
          />
          <ReButton type="primary" :loading="arthasExecLoading" @click="doArthasExec">执行</ReButton>
        </div>

        <!-- 快捷命令 -->
        <div class="arthas-quick">
          <button v-for="cmd in arthasQuickCommands" :key="cmd" class="arthas-quick-cmd" @click="execArthasQuick(cmd)">{{ cmd }}</button>
        </div>
      </div>
    </ReDialog>

    <!-- 项目右键菜单：与「更多」下拉同一套命令 -->
    <Teleport to="body">
      <template v-if="ctxMenu.visible">
        <div class="pj-ctx-mask" @click="closeContextMenu" @contextmenu.prevent="closeContextMenu"></div>
        <div class="pj-ctx" :class="{ 'is-flip': ctxMenu.flip }" :style="{ left: `${ctxMenu.x}px`, top: `${ctxMenu.y}px` }" @contextmenu.prevent>
          <div class="pj-ctx__head">
            <ReIcon name="Files" :size="13" />
            <span :title="ctxMenu.item?.projectName">{{ ctxMenu.item?.projectName }}</span>
          </div>
          <div
            v-for="c in ctxCommands"
            :key="c.command"
            class="pj-ctx__item"
            :class="{ 'is-danger': c.danger, 'is-divided': c.divided, 'has-sub': !!c.children?.length }"
            @click="c.children?.length ? undefined : onCtxCommand(c.command)"
          >
            <ReIcon :name="c.icon" :size="14" />
            <span>{{ c.label }}</span>
            <ReIcon v-if="c.children?.length" name="ArrowRight" :size="12" class="pj-ctx__arrow" />
            <!-- 二级菜单：链路追踪 / APM / Actuator 等观测入口收在这里，右键不再一长条 -->
            <div v-if="c.children?.length" class="pj-ctx__sub">
              <div
                v-for="k in c.children"
                :key="k.command"
                class="pj-ctx__item"
                :class="{ 'is-danger': k.danger }"
                @click.stop="onCtxCommand(k.command)"
              >
                <ReIcon :name="k.icon" :size="14" />
                <span>{{ k.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Teleport>

    <!-- 操作失败详情：给出后端原因 + 最近日志，而不是一句「操作触发失败」 -->
    <ReDialog v-model="failureVisible" title="操作失败详情" width="640px">
      <div class="fail-pane">
        <div class="fail-head">
          <span class="fail-op">{{ failureDetail.operation }}</span>
          <span class="fail-project">{{ failureDetail.project }}</span>
        </div>
        <div class="fail-msg">{{ failureDetail.message || '后端未返回具体原因' }}</div>
        <div v-if="failureDetail.logs.length" class="fail-logs">
          <div class="fail-logs-title">最近日志</div>
          <pre>{{ failureDetail.logs.join('\n') }}</pre>
        </div>
        <div v-else class="fail-logs-empty">没有可展示的任务日志，可点下方「查看实时日志」看远端输出。</div>
      </div>
      <template #footer>
        <ReButton @click="failureVisible = false">关闭</ReButton>
        <ReButton type="primary" @click="openFailureLog">查看实时日志</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { message } from '@repo/core';
import { http, unwrapResult } from '@repo/utils';
import { fillTemplate, bestTemplate } from '@repo/ui/components/ReCommand/templates';
import ReCron from '@repo/ui/re-cron';
import ReTabs from '@repo/ui/re-tabs';
import type { ReTabsItem, ReTabsContextItem } from '@repo/ui/re-tabs';
import ReRailSplit, { readRailWidth } from '@repo/ui/re-rail-split';
import { trackTask, type ProcessTask } from '../../utils/processTasks';
import { errorText, toastError } from '../../utils/errors';
import { downloadHostFile } from '../../api';
import { releaseSse } from '../../services/releaseRealtime';
import HostFileManager from '../../components/HostFileManager.vue';
import ProjectInfoPanel from '../../components/ProjectInfoPanel.vue';
import ProjectLogColumn from '../../components/ProjectLogColumn.vue';
import ProjectOpLogPanel from '../../components/ProjectOpLogPanel.vue';
import GitRepositoryDialog from '../../components/GitRepositoryDialog.vue';

const BASE = '/ms/server/release';

const router = useRouter();
const route = useRoute();

interface Project {
  id: number;
  releaseId: number;
  projectName: string;
  projectType: string;
  mainEntry: string;
  startScript: string;
  stopScript: string;
  restartScript: string;
  statusScript: string;
  status: string;
  projectPath: string;
  logPath: string;
  logMode: string;
  description: string;
  icon: string;
  envVars: string;
  cmdArgs: string;
  jvmArgs: string;
  serviceName: string;
  autostart: boolean;
  guardian: boolean;
  enabled: boolean;
  pid: string;
  appConfig: string;
  configDir: string;
  libDir: string;
  nginxDir: string;
  runningSince?: string;
  gitUrl?: string;
  gitBranch?: string;
  gitAuthType?: string;
  gitToken?: string;
  gitBuildGoals?: string;
  gitSkipTests?: boolean;
  mavenHome?: string;
  mavenVersion?: string;
  uploadExtract?: boolean;
  uploadTargetDir?: string;
  deployType?: string;
  /** 该类型是否有常驻进程（后端按类型 SPI 回填）：模型仓库等只发布文件的项目为 false */
  runtimeProcess?: boolean;
  /** 该类型是否为 JVM 进程（后端回填） */
  javaProcess?: boolean;
  /** 上传后是否自动升级（默认 false：安装包只上传到 uploads/，不覆盖运行中的包） */
  uploadAutoUpgrade?: boolean;
  /** 是否开启一次性定时发布 */
  scheduleEnabled?: boolean;
  /** 定时发布时间（后端 LocalDateTime，序列化为 ISO 字符串） */
  scheduleTime?: string;
  /** 定时发布状态：NONE / PENDING / RUNNING / DONE / FAILED */
  scheduleStatus?: string;
  /** 是否开启 Git 定时拉取（有更新才自动发布） */
  gitPollEnabled?: boolean;
  /** Git 轮询 cron（6 段：秒 分 时 日 月 周） */
  gitPollCron?: string;
  /** 最近一次轮询到的远端 commit */
  gitLastCommit?: string;
}

const list = ref<Project[]>([]);
const libCountMap = ref<Record<number, number>>({});
const loading = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const releaseId = ref(Number(route.query.releaseId) || 0);
const activeTab = ref('basic');

const hostOs = ref<'linux' | 'windows'>('linux');
/** 发布绑定的主机 ID（路径选择器需要用它连主机）；0 表示未识别到 */
const releaseHostId = ref(0);
/** 发布绑定的主机展示名（系统信息面板用） */
const releaseHostLabel = ref('');
/** 发布绑定的主机平台（LINUX / WINDOWS），传给文件管理器决定分隔符 */
const hostPlatform = ref('LINUX');

// ---- 状态分组 / 筛选 / 搜索（纯前端，不额外发请求） ----
type StatusKey = 'running' | 'stopped' | 'disabled' | 'ready';
const statusFilter = ref<'all' | StatusKey>('all');
const keyword = ref('');

/** 一个项目归到哪一组：禁用优先，其次看是否有常驻进程，最后看进程状态 */
function statusKey(item: Project): StatusKey {
  if (item.enabled === false) return 'disabled';
  // 无常驻进程的类型（模型仓库）：不展示「运行中/已停止」，统一为「已发布」
  if (item.runtimeProcess === false) return 'ready';
  return item.status === 'running' ? 'running' : 'stopped';
}

function statusLabel(item: Project): string {
  const k = statusKey(item);
  if (k === 'running') return '运行中';
  if (k === 'ready') return '已发布';
  return k === 'stopped' ? '已停止' : '已禁用';
}

/**
 * 非运行项目的状态补充说明（运行中项目的 PID / 运行时长已挪到行尾指标条）
 */
function statusSub(item: Project): string {
  const k = statusKey(item);
  if (k === 'disabled') return '激活后可操作';
  if (k === 'ready') return '文件已发布，无常驻进程';
  return '进程未运行';
}

const STATUS_GROUPS: { key: StatusKey; label: string }[] = [
  { key: 'running', label: '运行中' },
  { key: 'stopped', label: '已停止' },
  { key: 'ready', label: '已发布' },
  { key: 'disabled', label: '已禁用' },
];

const statusFilters = computed(() => {
  const counts: Record<StatusKey, number> = { running: 0, stopped: 0, ready: 0, disabled: 0 };
  list.value.forEach((i) => { counts[statusKey(i)] += 1; });
  return [
    { key: 'all' as const, label: '全部', count: list.value.length },
    ...STATUS_GROUPS.map((g) => ({ key: g.key, label: g.label, count: counts[g.key] })),
  ];
});

/** 各状态项目数（竖条折叠态 / 底部小结用） */
const statusCounts = computed<Record<StatusKey, number>>(() => {
  const counts: Record<StatusKey, number> = { running: 0, stopped: 0, ready: 0, disabled: 0 };
  list.value.forEach((i) => { counts[statusKey(i)] += 1; });
  return counts;
});

/** 重置筛选 / 搜索，并展开全部分组 */
function resetFilters() {
  statusFilter.value = 'all';
  keyword.value = '';
  collapsedGroups.value = new Set();
}

/** 扁平化过滤列表：按状态筛选 + 关键字搜索（纯前端，不额外发请求） */
const visibleList = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return list.value.filter((i) => {
    if (statusFilter.value !== 'all' && statusKey(i) !== statusFilter.value) return false;
    if (!kw) return true;
    return i.projectName.toLowerCase().includes(kw)
      || (i.projectPath || '').toLowerCase().includes(kw)
      || (i.logPath || '').toLowerCase().includes(kw);
  });
});

const visibleCount = computed(() => visibleList.value.length);

// 运行时长：前端每秒 tick 实时计算（不轮询后端），基准为项目 runningSince
const nowTs = ref(Date.now());
let runtimeTimer: ReturnType<typeof setInterval> | null = null;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 依据 runningSince 实时计算运行时长：不足 1 小时显示 mm:ss，否则 HH:mm:ss，超过 1 天加「N天」 */
function formatRuntime(item: Project) {
  if (!item.runningSince) return '-';
  const start = new Date(item.runningSince).getTime();
  if (Number.isNaN(start)) return '-';
  let sec = Math.max(0, Math.floor((nowTs.value - start) / 1000));
  const days = Math.floor(sec / 86400);
  sec -= days * 86400;
  const h = Math.floor(sec / 3600);
  sec -= h * 3600;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  const clock = `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
  return days > 0 ? `${days}天 ${clock}` : clock;
}

/** 指标条运行时长文案：运行中但缺少 runningSince 基准时退化为「运行中」 */
function runtimeLabel(item: Project): string {
  return item.runningSince ? formatRuntime(item) : '运行中';
}

interface EnvVar { key: string; value: string; }
interface KVRow { key: string; value: string; }

const form = ref({
  projectName: '',
  projectType: '',
  mainEntry: '',
  startScript: '',
  stopScript: '',
  restartScript: '',
  statusScript: '',
  projectPath: '',
  logPath: '',
  logMode: 'append',
  description: '',
  icon: '',
  envVars: [] as EnvVar[],
  jvmArgs: [] as string[],
  cmdArgs: [] as string[],
  serviceName: '',
  autostart: false,
  guardian: false,
  enabled: true,
  pid: '',
  appConfig: [] as EnvVar[],
  configDir: '',
  libDir: '',
  nginxDir: '',
  // Git 自动发布配置
  gitUrl: '',
  gitBranch: 'main',
  gitAuthType: 'none',
  gitToken: '',
  gitBuildGoals: 'clean,package',
  gitSkipTests: true,
  // Maven 配置
  mavenHome: '',
  mavenVersion: '3.9.9',
  // 上传配置
  uploadExtract: true,
  uploadTargetDir: '',
  deployType: 'main',
  // 上传后自动升级：默认关闭，安装包先落到 uploads/，确认无误再手动投递
  uploadAutoUpgrade: false,
  // 一次性定时发布
  scheduleEnabled: false,
  scheduleTime: '',
  // 定时发布状态（后端维护，只读展示）
  scheduleStatus: '',
  // Git 定时拉取（有更新才自动发布）
  gitPollEnabled: false,
  gitPollCron: '0 */5 * * * ?',
  // 最近一次轮询到的 commit（只读展示，不提交）
  gitLastCommit: '',
  // APM 高级选项：none=不注入，platform=平台自有 APM，skywalking=SkyWalking，arthas=Arthas 诊断
  apmType: 'none' as 'none' | 'platform' | 'skywalking' | 'arthas',
  apmJarPath: '',
  apmOptions: 'port=4567',
  swJarPath: '',
  swServiceName: '',
  swBackendService: '',
  swExtraArgs: '',
  arthasJarPath: '',
  arthasTelnetPort: 3658,
  arthasHttpPort: 8563,
});

/** Java 类项目类型（启动脚本走 java -jar，支持 -javaagent 挂载） */
const JAVA_APM_TYPES = ['springboot', 'fatjar', 'git'];

const editTabs = computed(() => {
  const tabs = [
    { name: 'basic', label: '基础信息', icon: 'InfoFilled' },
    { name: 'scripts', label: '脚本配置', icon: 'EditPen' },
    { name: 'vars', label: '变量设置', icon: 'Operation' },
    { name: 'system', label: '系统管理', icon: 'Setting' },
  ];
  // APM 注入属高级选项，仅 Java 类项目（启动脚本走 java -jar）提供
  if (JAVA_APM_TYPES.includes(form.value.projectType)) {
    tabs.push({ name: 'apm', label: 'APM 注入', icon: 'Cpu' });
  }
  // 备份记录仅在编辑已存在项目时可用（新建项目尚无 backups/）
  if (editingId.value != null) {
    tabs.push({ name: 'schedule', label: '定时发布', icon: 'Timer' });
    tabs.push({ name: 'backups', label: '备份记录', icon: 'Files' });
  }
  return tabs;
});

const entryPlaceholder = computed(() => {
  switch (form.value.projectType) {
    case 'springboot':
    case 'fatjar':
    case 'git':
      return '如：user-service.jar';
    case 'separated':
      return '如：app（可执行文件名）或 app.js';
    case 'static':
    case 'nginx':
    case 'model':
      return '此类型无需主入口';
    default:
      return '请先选择项目类型';
  }
});

const MAIN_ENTRY_REQUIRED_TYPES = ['springboot', 'separated', 'git'];
const mainEntryRequired = computed(() => MAIN_ENTRY_REQUIRED_TYPES.includes(form.value.projectType));
// 静态页面 / Nginx / 模型无主入口；其余类型显示主入口
const needsEntry = computed(() => !['static', 'nginx', 'model'].includes(form.value.projectType));
// Git 源码构建参数：类型为 git 时展开；老项目（非 git 类型但配过 gitUrl）保留可编辑，避免升级入口失配
const showGitSection = computed(() => form.value.projectType === 'git' || !!form.value.gitUrl);

const scriptContext = computed(() => ({
  entry: form.value.mainEntry,
  log: form.value.logPath,
  path: form.value.projectPath,
  appName: form.value.projectName,
}));

/** APM tab 启动命令预览：展示保存后将会合入 jvmArgs 的 javaagent 参数 */
const apmPreviewArgs = computed(() => {
  const apm: ApmForm = {
    apmType: form.value.apmType,
    apmJarPath: form.value.apmJarPath,
    apmOptions: form.value.apmOptions,
    swJarPath: form.value.swJarPath,
    swServiceName: form.value.swServiceName,
    swBackendService: form.value.swBackendService,
    swExtraArgs: form.value.swExtraArgs,
    arthasJarPath: form.value.arthasJarPath,
    arthasTelnetPort: form.value.arthasTelnetPort,
    arthasHttpPort: form.value.arthasHttpPort,
  };
  return materializeApmArgs(apm, []).join(' ');
});

function typeLabel(t: string) {
  return ({
    springboot: 'SpringBoot',
    fatjar: 'FatJar',
    git: 'Git 源码部署',
    separated: '分离式',
    model: '模型',
    static: '静态页面',
    nginx: 'Nginx',
  } as Record<string, string>)[t] || t || '未知';
}

/**
 * 部署类型的中文标签（升级弹框的项目基线信息用）
 *
 * @param t 部署类型
 * @returns 中文标签；空值显示「未设置」
 */
function deployTypeLabel(t?: string): string {
  return ({
    main: '仅主包',
    lib: '仅依赖',
    both: '主包 + 依赖',
  } as Record<string, string>)[t || ''] || '未设置';
}

function defaultIconByType(t: string) {
  switch (t) {
    case 'springboot':
    case 'fatjar':
      return 'Cpu';
    case 'git':
      return 'GitBranch';
    case 'separated':
      return 'Box';
    case 'model':
      return 'Files';
    case 'static':
      return 'Picture';
    case 'nginx':
      return 'Connection';
    default:
      return 'Folder';
  }
}
function displayIcon(item: Project) {
  return item.icon || defaultIconByType(item.projectType);
}

/**
 * 卡片左侧色块的类型色调类名。
 *
 * <p>每种项目类型一个渐变色，让「一眼分辨这是 Java 服务还是静态站」不依赖读文字；
 * 未知类型落到默认灰蓝色。</p>
 *
 * @param item 项目
 * @returns 色调类名，如 tone-springboot
 */
function mediaTone(item: Project): string {
  return `tone-${item.projectType || 'unknown'}`;
}

async function loadList() {
  loading.value = true;
  try {
    const res = await http().get(`${BASE}/${releaseId.value}/projects`);
    list.value = unwrapResult<Project[]>(res) || [];
    fetchLibCounts();
  } catch (e) {
    message.error('加载项目列表失败');
  } finally {
    loading.value = false;
  }
}

async function fetchLibCounts() {
  const separated = list.value.filter((p) => p.projectType === 'separated' && p.libDir);
  if (separated.length === 0) return;
  for (const p of separated) {
    try {
      const res = await http().get(`${BASE}/project/${p.id}/lib/count`);
      const count = unwrapResult<number>(res);
      if (typeof count === 'number') {
        libCountMap.value[p.id] = count;
      }
    } catch {
      // 忽略单个项目计数失败
    }
  }
}

async function loadHostOs() {
  try {
    const relRes = await http().get(`${BASE}/list`);
    const releases = unwrapResult<any[]>(relRes) || [];
    const rel = releases.find((r) => r.id === releaseId.value);
    if (!rel?.hostId) {
      return;
    }
    // 路径选择器要用它打开该主机的文件管理，先记住
    releaseHostId.value = rel.hostId;
    const hostRes = await http().get('/ms/server/host');
    const hosts = unwrapResult<any[]>(hostRes) || [];
    const host = hosts.find((h) => h.id === rel.hostId);
    if (host) {
      releaseHostLabel.value = String(host.serverName || host.serverHostName || host.name || '');
      const os = String(host.serverHostOsType || '').toUpperCase();
      hostPlatform.value = os === 'WINDOWS' ? 'WINDOWS' : 'LINUX';
      if (os === 'WINDOWS') {
        hostOs.value = 'windows';
      }
    }
  } catch (e) {
    // 识别失败保持默认 linux
  }
}

function resetForm() {
  form.value = {
    projectName: '',
    projectType: '',
    mainEntry: '',
    startScript: '',
    stopScript: '',
    restartScript: '',
    statusScript: '',
    projectPath: '',
    logPath: '',
    logMode: 'append',
    description: '',
    icon: '',
    envVars: [],
    jvmArgs: [],
    cmdArgs: [],
    serviceName: '',
    autostart: false,
    guardian: false,
    enabled: true,
    pid: '',
    appConfig: [],
    configDir: '',
    libDir: '',
    nginxDir: '',
    gitUrl: '',
    gitBranch: 'main',
    gitAuthType: 'none',
    gitToken: '',
    gitBuildGoals: 'clean,package',
    gitSkipTests: true,
    mavenHome: '',
    mavenVersion: '3.9.9',
    uploadExtract: true,
    uploadTargetDir: '',
    deployType: 'main',
    uploadAutoUpgrade: false,
    scheduleEnabled: false,
    scheduleTime: '',
    scheduleStatus: '',
    gitPollEnabled: false,
    gitPollCron: '0 */5 * * * ?',
    gitLastCommit: '',
    apmType: 'none' as 'none' | 'platform' | 'skywalking' | 'arthas',
    apmJarPath: '',
    apmOptions: 'port=4567',
    swJarPath: '',
    swServiceName: '',
    swBackendService: '',
    swExtraArgs: '',
    arthasJarPath: '',
    arthasTelnetPort: 3658,
    arthasHttpPort: 8563,
  };
}

function openCreateDialog() {
  editingId.value = null;
  resetForm();
  // 新建默认自动生成脚本：选完类型/地址就能直接跑
  scriptMode.value = 'auto';
  scriptAutoDirty.value = false;
  activeTab.value = 'basic';
  dialogVisible.value = true;
}

function openEditDialog(item: Project) {
  editingId.value = item.id;
  form.value = {
    projectName: item.projectName ?? '',
    projectType: item.projectType ?? '',
    // 后端对空值字段可能整体省略（非空序列化），一律兜空，避免 handleSave 里 .trim() 抛错
    mainEntry: item.mainEntry ?? '',
    startScript: item.startScript ?? '',
    stopScript: item.stopScript ?? '',
    restartScript: item.restartScript ?? '',
    statusScript: item.statusScript ?? '',
    projectPath: item.projectPath ?? '',
    logPath: item.logPath ?? '',
    logMode: item.logMode || 'append',
    description: item.description ?? '',
    icon: item.icon ?? '',
    envVars: parseJson<EnvVar>(item.envVars, [])
      .filter((r) => r && typeof r.key === 'string')
      .map((r) => ({ key: r.key, value: r.value ?? '' })),
    jvmArgs: parseJson<string>(item.jvmArgs, []).filter((a) => typeof a === 'string'),
    cmdArgs: parseJson<string>(item.cmdArgs, []).filter((a) => typeof a === 'string'),
    serviceName: item.serviceName || '',
    autostart: !!item.autostart,
    guardian: !!item.guardian,
    enabled: item.enabled === undefined ? true : !!item.enabled,
    pid: item.pid || '',
    appConfig: parseJson<EnvVar>(item.appConfig, [])
      .filter((r) => r && typeof r.key === 'string')
      .map((r) => ({ key: r.key, value: r.value ?? '' })),
    configDir: item.configDir || '',
    libDir: item.libDir || '',
    nginxDir: item.nginxDir || '',
    gitUrl: item.gitUrl || '',
    gitBranch: item.gitBranch || 'main',
    gitAuthType: item.gitAuthType || 'none',
    gitToken: item.gitToken || '',
    gitBuildGoals: item.gitBuildGoals || 'clean,package',
    gitSkipTests: item.gitSkipTests === undefined ? true : !!item.gitSkipTests,
    mavenHome: item.mavenHome || '',
    mavenVersion: item.mavenVersion || '3.9.9',
    uploadExtract: item.uploadExtract === undefined ? true : !!item.uploadExtract,
    uploadTargetDir: item.uploadTargetDir || '',
    deployType: item.deployType || 'main',
    uploadAutoUpgrade: !!item.uploadAutoUpgrade,
    scheduleEnabled: !!item.scheduleEnabled,
    // el-date-picker 的 value-format 与后端 LocalDateTime 对齐，秒级即可
    scheduleTime: item.scheduleTime ? String(item.scheduleTime).replace(' ', 'T').slice(0, 19) : '',
    scheduleStatus: item.scheduleStatus || '',
    gitPollEnabled: !!item.gitPollEnabled,
    gitPollCron: item.gitPollCron || '0 */5 * * * ?',
    gitLastCommit: item.gitLastCommit || '',
    ...parseApmConfig(parseJson<string>(item.jvmArgs, [])),
  };
  // 已有项目默认自定义：保留线上正在用的脚本，用户想重算可手动切「自动生成」
  scriptMode.value = 'custom';
  scriptAutoDirty.value = false;
  activeTab.value = 'basic';
  dialogVisible.value = true;
}

/** APM 类型描述（仅现有 jvmArgs 中的 javaagent 项会出现在这里） */
type ApmType = 'none' | 'platform' | 'skywalking' | 'arthas';

interface ApmForm {
  apmType: ApmType;
  apmJarPath: string;
  apmOptions: string;
  swJarPath: string;
  swServiceName: string;
  swBackendService: string;
  swExtraArgs: string;
  arthasJarPath: string;
  arthasTelnetPort: number;
  arthasHttpPort: number;
}

/**
 * 项目卡片显示的 APM 配置徽标；无 APM 注入时返回空串。
 * SkyWalking 依据 agent 文件名/SkyWalking 参数识别，其余 javaagent 视为平台自有 APM。
 */
function apmLabel(item: Project): string {
  if (!JAVA_APM_TYPES.includes(item.projectType)) return '';
  const cfg = parseApmConfig(parseJson<string>(item.jvmArgs, []));
  if (cfg.apmType === 'skywalking') return 'SkyWalking';
  if (cfg.apmType === 'arthas') return 'Arthas';
  if (cfg.apmType === 'platform') return 'APM';
  return '';
}

/**
 * 该项目是否注入了会向 APM 观测台上报数据的 agent。
 *
 * <p>Arthas 只是运行时诊断工具，不产生观测数据，因此不算；平台自有 APM 与
 * SkyWalking 才在服务列表里有对应的服务名。</p>
 *
 * @param item 项目
 * @returns 是否可跳转 APM 观测台
 */
function hasObservableApm(item: Project): boolean {
  if (!JAVA_APM_TYPES.includes(item.projectType)) return false;
  const cfg = parseApmConfig(parseJson<string>(item.jvmArgs, []));
  return cfg.apmType === 'platform' || cfg.apmType === 'skywalking';
}

/**
 * 从项目持久化后的 jvmArgs 反解 APM 高级配置。
 * SkyWalking 依据 agent 文件/参数标记识别；Arthas 依据 agent 文件名识别；其余 javaagent 视为平台自有 APM。
 */
function parseApmConfig(jvm: string[]): ApmForm {
  const agent = jvm.find((a) => a.startsWith('-javaagent:'));
  // Java 语法：-javaagent:jarpath[=options]，options 由首个 = 分隔
  const raw = agent ? agent.slice('-javaagent:'.length) : '';
  const eq = raw.indexOf('=');
  const path = eq >= 0 ? raw.slice(0, eq) : raw;
  const options = eq >= 0 ? raw.slice(eq + 1) : '';
  const swName = jvm.find((a) => a.startsWith('-Dskywalking.agent.service_name='));
  const swBackend = jvm.find((a) => a.startsWith('-Dskywalking.collector.backend_service='));
  const swExtra = jvm
    .filter((a) => a.startsWith('-Dskywalking.') && a !== swName && a !== swBackend)
    .join(' ');
  const isSkyWalking = /skywalking|sky-agent/i.test(path) || !!swName || !!swBackend;
  const isArthas = /arthas/i.test(path);
  if (isSkyWalking) {
    return {
      apmType: 'skywalking',
      apmJarPath: '',
      apmOptions: 'port=4567',
      swJarPath: path,
      swServiceName: swName ? swName.split('=').slice(1).join('=') : '',
      swBackendService: swBackend ? swBackend.split('=').slice(1).join('=') || '' : '',
      swExtraArgs: swExtra,
      arthasJarPath: '',
      arthasTelnetPort: 3658,
      arthasHttpPort: 8563,
    };
  }
  if (isArthas) {
    return {
      apmType: 'arthas',
      apmJarPath: '',
      apmOptions: '',
      swJarPath: '',
      swServiceName: '',
      swBackendService: '',
      swExtraArgs: '',
      arthasJarPath: path,
      arthasTelnetPort: 3658,
      arthasHttpPort: 8563,
    };
  }
  if (agent) {
    return {
      apmType: 'platform',
      apmJarPath: path,
      apmOptions: options || 'port=4567',
      swJarPath: '',
      swServiceName: '',
      swBackendService: '',
      swExtraArgs: '',
      arthasJarPath: '',
      arthasTelnetPort: 3658,
      arthasHttpPort: 8563,
    };
  }
  return {
    apmType: 'none',
    apmJarPath: '',
    apmOptions: 'port=4567',
    swJarPath: '',
    swServiceName: '',
    swBackendService: '',
    swExtraArgs: '',
    arthasJarPath: '',
    arthasTelnetPort: 3658,
    arthasHttpPort: 8563,
  };
}

/** 保存前把 APM 高级选项合入 jvmArgs（选择启用时替换旧的 APM javaagent / skywalking 项） */
function materializeApmArgs(apm: ApmForm, jvm: string[]): string[] {
  if (apm.apmType === 'none') {
    return jvm;
  }
  const rest = jvm.filter(
    (a) => !a.startsWith('-javaagent:') && !a.startsWith('-Dskywalking.agent.service_name=') && !a.startsWith('-Dskywalking.collector.backend_service='),
  );
  if (apm.apmType === 'platform' && apm.apmJarPath.trim()) {
    const base = `-javaagent:${apm.apmJarPath.trim()}`;
    const opts = apm.apmOptions?.trim();
    return [opts ? `${base}=${opts}` : base, ...rest];
  }
  if (apm.apmType === 'skywalking' && apm.swJarPath.trim()) {
    const out = [`-javaagent:${apm.swJarPath.trim()}`, ...rest];
    if (apm.swServiceName?.trim()) out.push(`-Dskywalking.agent.service_name=${apm.swServiceName.trim()}`);
    if (apm.swBackendService?.trim()) out.push(`-Dskywalking.collector.backend_service=${apm.swBackendService.trim()}`);
    out.push(...(apm.swExtraArgs || '').split(/\s+/).map((x) => x.trim()).filter(Boolean));
    return out;
  }
  if (apm.apmType === 'arthas' && apm.arthasJarPath.trim()) {
    const out = [`-javaagent:${apm.arthasJarPath.trim()}`, ...rest];
    if (apm.arthasTelnetPort) out.push(`-Darthas.telnet.port=${apm.arthasTelnetPort}`);
    if (apm.arthasHttpPort) out.push(`-Darthas.http.port=${apm.arthasHttpPort}`);
    return out;
  }
  return rest;
}

function parseJson<T>(raw: string | null | undefined, fallback: T[]): T[] {
  if (!raw || !raw.trim()) return fallback;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : fallback;
  } catch {
    return fallback;
  }
}

// ---- 变量写入脚本（托管块，幂等） ----
const VARS_BEGIN = '# >>> VARS (auto-managed) >>>';
const VARS_END = '# <<< VARS (auto-managed) <<<';
const VARS_BLOCK_RE = /# >>> VARS \(auto-managed\) >>>[\s\S]*?# <<< VARS \(auto-managed\) <<<\n?/;

function buildVarsBlock(): string {
  const envs = form.value.envVars.filter((r) => r.key.trim());
  const jvms = form.value.jvmArgs.map((a) => a.trim()).filter(Boolean);
  const args = form.value.cmdArgs.map((a) => a.trim()).filter(Boolean);
  if (!envs.length && !jvms.length && !args.length) return '';
  const ps = hostOs.value === 'windows';
  const lines: string[] = [VARS_BEGIN];
  if (ps) {
    envs.forEach((r) => lines.push(`$env:${r.key.trim()} = '${r.value.replace(/'/g, "''")}'`));
    lines.push(`$JvmArgs = @(${jvms.map((a) => `'${a.replace(/'/g, "''")}'`).join(',')})`);
    lines.push(`$AppArgs = @(${args.map((a) => `'${a.replace(/'/g, "''")}'`).join(',')})`);
  } else {
    envs.forEach((r) => lines.push(`export ${r.key.trim()}='${r.value.replace(/'/g, "'\\''")}'`));
    lines.push(`JVM_ARGS='${jvms.map((a) => a.replace(/'/g, "'\\''")).join(' ')}'`);
    lines.push(`APP_ARGS='${args.map((a) => a.replace(/'/g, "'\\''")).join(' ')}'`);
  }
  lines.push(VARS_END);
  return lines.join('\n');
}

function injectVarsBlock(script: string, block: string): string {
  if (VARS_BLOCK_RE.test(script)) {
    return script.replace(VARS_BLOCK_RE, block ? block + '\n' : '');
  }
  return block ? block + '\n' + script : script;
}

function applyArgsToken(script: string): string {
  return script
    .replace(/__JVMARGS__/g, hostOs.value === 'windows' ? '$JvmArgs' : '$JVM_ARGS')
    .replace(/__ARGS__/g, hostOs.value === 'windows' ? '$AppArgs' : '$APP_ARGS');
}

function materializeVars() {
  const block = buildVarsBlock();
  form.value.startScript = applyArgsToken(injectVarsBlock(form.value.startScript || '', block));
  form.value.restartScript = applyArgsToken(injectVarsBlock(form.value.restartScript || '', block));
}

// ---- 一键生成全部脚本 ----
const anyScriptEmpty = computed(() =>
  [!form.value.startScript, !form.value.stopScript, !form.value.restartScript, !form.value.statusScript].some(Boolean),
);
const autogenLoading = ref(false);

/**
 * 用内置模板补齐为空的脚本（已手写的不覆盖）
 *
 * @param silent 静默模式：保存前自动补全时不弹校验/成功提示
 * @returns 是否成功套用模板
 */
function fillScriptsFromTemplate(silent = false): boolean {
  if (!form.value.projectType) {
    if (!silent) {
      message.error('请先在「基础信息」选择项目类型');
      activeTab.value = 'basic';
    }
    return false;
  }
  if (!form.value.projectPath) {
    if (!silent) {
      message.error('请先在「基础信息」填写项目地址');
      activeTab.value = 'basic';
    }
    return false;
  }
  // 模板按「OS + 类型」精确挑选，不再依赖数组顺序（模型等类型以前会错拿通用模板）
  const tpl = bestTemplate(hostOs.value, form.value.projectType);
  if (!tpl) {
    if (!silent) message.error('当前类型暂无内置模板');
    return false;
  }
  try {
    const filled = fillTemplate(tpl, {
      entry: form.value.mainEntry,
      log: form.value.logPath,
      path: form.value.projectPath,
      appName: form.value.projectName,
      logOp: form.value.logMode === 'truncate' ? '>' : '>>',
    });
    // 仅填充为空的脚本，已手写的不覆盖
    if (!form.value.startScript) form.value.startScript = filled.start;
    if (!form.value.stopScript) form.value.stopScript = filled.stop;
    if (!form.value.restartScript) form.value.restartScript = filled.restart;
    if (!form.value.statusScript && filled.status) form.value.statusScript = filled.status;
    if (!silent) message.success('已根据基础配置生成脚本');
    return true;
  } catch (e: any) {
    if (!silent) message.error(e?.message || '脚本生成失败');
    return false;
  }
}

/**
 * 一键生成四个脚本：按「OS + 项目类型」内置模板 + 项目字段展开，
 * 覆盖 启动/停止/重启/状态，并立即展开 __JVMARGS__/__ARGS__ 为可直接执行的命令。
 */
async function autoGenerateScripts() {
  if (!form.value.projectType) {
    message.error('请先在「基础信息」选择项目类型');
    activeTab.value = 'basic';
    return;
  }
  if (!form.value.projectPath) {
    message.error('请先在「基础信息」填写项目地址');
    activeTab.value = 'basic';
    return;
  }
  const tpl = bestTemplate(hostOs.value, form.value.projectType);
  if (!tpl) {
    message.error('当前类型暂无内置模板');
    return;
  }
  const hasAny = [form.value.startScript, form.value.stopScript, form.value.restartScript, form.value.statusScript]
    .some((s) => (s || '').trim());
  if (hasAny) {
    try {
      await ElMessageBox.confirm('将用内置模板覆盖当前四个脚本，是否继续？', '一键生成脚本', { type: 'warning' });
    } catch {
      return;
    }
  }
  autogenLoading.value = true;
  try {
    const filled = fillTemplate(tpl, {
      entry: form.value.mainEntry,
      log: form.value.logPath,
      path: form.value.projectPath,
      appName: form.value.projectName,
      logOp: form.value.logMode === 'truncate' ? '>' : '>>',
    });
    form.value.startScript = filled.start;
    form.value.stopScript = filled.stop;
    form.value.restartScript = filled.restart;
    form.value.statusScript = filled.status || '';
    // 展开 __JVMARGS__/__ARGS__ 为 $JVM_ARGS/$APP_ARGS（或 PS 变量）并注入变量块，保证生成即可用
    materializeVars();
    message.success('已生成 启动·停止·重启·状态 四个脚本');
  } catch (e: any) {
    message.error(e?.message || '脚本生成失败');
  } finally {
    autogenLoading.value = false;
  }
}

// ---- 脚本模式：自动生成（默认） / 自定义 ----
/** 自动=按类型+地址生成；custom=用户自己编辑四个脚本 */
const scriptMode = ref<'auto' | 'custom'>('auto');

/** 自动模式是否有足够信息生成脚本 */
const scriptAutoReady = computed(() => !!form.value.projectType && !!form.value.projectPath.trim());

/** 用户在自动模式里手改过任一脚本：之后基础信息变化不再实时覆盖 */
const scriptAutoDirty = ref(false);

type ScriptField = 'startScript' | 'stopScript' | 'restartScript' | 'statusScript';

/** 自动模式预览（直接读当前四个脚本字段，保存时用的就是它们） */
const scriptPreviewRows: { key: ScriptField; label: string }[] = [
  { key: 'startScript', label: '启动命令' },
  { key: 'stopScript', label: '停止命令' },
  { key: 'restartScript', label: '重启命令' },
  { key: 'statusScript', label: '状态命令' },
];

/**
 * 自动模式里直接编辑某条脚本：写入表单并标记「已手改」。
 *
 * @param key 脚本字段
 * @param e   输入事件
 */
function onAutoScriptEdit(key: ScriptField, e: Event) {
  form.value[key] = (e.target as HTMLTextAreaElement).value;
  scriptAutoDirty.value = true;
}

/**
 * 按当前基础配置重新生成四个脚本（自动模式）。
 *
 * @param notify 是否弹成功提示（自动刷新调用时不弹）
 * @returns 是否生成成功
 */
function regenerateScripts(notify = false): boolean {
  if (!form.value.projectType || !form.value.projectPath.trim()) {
    return false;
  }
  const tpl = bestTemplate(hostOs.value, form.value.projectType);
  if (!tpl) {
    return false;
  }
  try {
    const filled = fillTemplate(tpl, {
      entry: form.value.mainEntry,
      log: form.value.logPath,
      path: form.value.projectPath,
      appName: form.value.projectName,
      logOp: form.value.logMode === 'truncate' ? '>' : '>>',
    });
    form.value.startScript = filled.start;
    form.value.stopScript = filled.stop;
    form.value.restartScript = filled.restart;
    form.value.statusScript = filled.status || '';
    // 展开 __JVMARGS__/__ARGS__ 并注入变量块，保证「生成即可用」
    materializeVars();
    // 程序化重算意味着放弃手改，重新回到实时跟随
    scriptAutoDirty.value = false;
    if (notify) message.success('已按当前配置重新生成脚本');
    return true;
  } catch (e: any) {
    if (notify) message.error(e?.message || '脚本生成失败');
    return false;
  }
}

/**
 * 切换脚本模式；切回自动时立即重算，避免展示过期脚本。
 *
 * @param mode 目标模式
 */
function switchScriptMode(mode: 'auto' | 'custom') {
  scriptMode.value = mode;
  if (mode === 'auto' && scriptAutoReady.value) {
    regenerateScripts(false);
  }
}

// 自动模式：基础信息一改就重算，用户始终看到「保存后真正会执行」的脚本
watch(
  [
    () => form.value.projectType,
    () => form.value.projectPath,
    () => form.value.logPath,
    () => form.value.mainEntry,
    () => form.value.projectName,
    () => form.value.logMode,
    hostOs,
  ],
  () => {
    if (!dialogVisible.value || scriptMode.value !== 'auto') return;
    // 用户手改过脚本后不再实时覆盖，避免刚敲的命令被基础字段一变就冲掉
    if (scriptAutoDirty.value) return;
    regenerateScripts(false);
  },
);

async function handleSave() {
  if (!form.value.projectName.trim()) {
    message.error('请填写「项目名称」');
    return;
  }
  if (!form.value.projectType) {
    message.error('请选择「项目类型」');
    return;
  }
  if (!form.value.projectPath.trim()) {
    message.error('请填写「项目地址」');
    return;
  }
  if (!form.value.logPath.trim()) {
    message.error('请填写「日志地址」');
    return;
  }
  if (mainEntryRequired.value && !(form.value.mainEntry ?? '').trim()) {
    message.error('当前项目类型必须填写「主入口名称」');
    return;
  }
  if (form.value.scheduleEnabled && !form.value.scheduleTime) {
    message.error('请选择「定时发布时间」');
    return;
  }
  if (form.value.gitPollEnabled && !form.value.gitPollCron.trim()) {
    message.error('请填写「Git 轮询 cron」');
    return;
  }
  // 规范化自定义服务名（仅小写字母数字、-、_）
  form.value.serviceName = form.value.serviceName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');
  try {
    // 脚本：自动模式下未手改则按当前配置重算；手改过就保留用户命令（仅补空项）
    if (scriptMode.value === 'auto') {
      if (scriptAutoDirty.value) {
        fillScriptsFromTemplate(true);
        materializeVars();
      } else if (!regenerateScripts(false)) {
        message.error('自动生成脚本失败：当前项目类型暂无内置模板');
        return;
      }
    } else {
      fillScriptsFromTemplate(true);
      materializeVars();
    }
    // APM 高级选项合入 jvmArgs（javaagent 参数随启动脚本生效；APM 字段本身不落库）
    form.value.jvmArgs = materializeApmArgs(
      {
        apmType: form.value.apmType,
        apmJarPath: form.value.apmJarPath,
        apmOptions: form.value.apmOptions,
        swJarPath: form.value.swJarPath,
        swServiceName: form.value.swServiceName,
        swBackendService: form.value.swBackendService,
        swExtraArgs: form.value.swExtraArgs,
        arthasJarPath: form.value.arthasJarPath,
        arthasTelnetPort: form.value.arthasTelnetPort,
        arthasHttpPort: form.value.arthasHttpPort,
      },
      form.value.jvmArgs,
    );
    const { apmType, apmJarPath, apmOptions, swJarPath, swServiceName, swBackendService, swExtraArgs, arthasJarPath, arthasTelnetPort, arthasHttpPort, gitLastCommit, scheduleStatus, ...projectForm } = form.value;
    const payload = {
      ...projectForm,
      // 空串要转 null：后端 null 表示「不修改」，空串会让 LocalDateTime 反序列化失败
      scheduleTime: form.value.scheduleTime ? form.value.scheduleTime.replace(' ', 'T').slice(0, 19) : null,
      envVars: JSON.stringify(form.value.envVars),
      jvmArgs: JSON.stringify(form.value.jvmArgs),
      cmdArgs: JSON.stringify(form.value.cmdArgs),
      appConfig: JSON.stringify(form.value.appConfig),
    };
    if (editingId.value != null) {
      await http().put(`${BASE}/project/${editingId.value}`).data(payload);
      message.success('更新成功');
    } else {
      await http().post(`${BASE}/project`).data({ ...payload, releaseId: releaseId.value });
      message.success('创建成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch (e: any) {
    toastError(e, '保存失败');
  }
}

// ---- 禁用 / 激活 ----
async function toggleEnabled(item: Project) {
  const next = item.enabled === false;
  try {
    await http().put(`${BASE}/project/${item.id}`).data({ enabled: next });
    message.success(next ? '已激活' : '已禁用');
    loadList();
  } catch (e: any) {
    toastError(e, '操作失败');
  }
}

function onMoreCommand(item: Project, command: string) {
  switch (command) {
    case 'info':
      openInfoTab(item);
      break;
    case 'edit':
      openEditDialog(item);
      break;
    case 'log':
      openLogTab(item);
      break;
    case 'apm':
      openApmWorkbench(item);
      break;
    case 'traces':
      openApmTraces(item);
      break;
    case 'files':
      openFilesTab(item);
      break;
    case 'health':
      openHealthCheck(item);
      break;
    case 'upgrade':
      openUpgradeDialog(item);
      break;
    case 'download-source':
      downloadProjectSource(item);
      break;
    case 'system-config':
      openSystemConfig(item);
      break;
    case 'git-repo':
      openGitRepository(item);
      break;
    case 'copy-path':
      copyText(item.projectPath, '项目地址');
      break;
    case 'copy-log':
      copyText(item.logPath, '日志地址');
      break;
    case 'op-log':
      openProjectOpLog(item);
      break;
    case 'arthas':
      openArthasDialog(item);
      break;
    case 'swagger':
      openEndpointDialog(item, 'swagger');
      break;
    case 'actuator':
      openEndpointDialog(item, 'actuator');
      break;
    case 'update-lib':
      handleUpdateLib(item);
      break;
    case 'backup':
      handleBackup(item);
      break;
    case 'rollback':
      handleRollback(item);
      break;
    case 'git-deploy':
      handleGitDeploy(item);
      break;
    case 'copy':
      openCopyDialog(item);
      break;
    case 'toggle':
      toggleEnabled(item);
      break;
    case 'delete':
      handleDelete(item);
      break;
  }
}

// ---- 操作中文名（失败提示 / 任务浮层共用口径） ----
const OP_LABELS: Record<string, string> = {
  start: '启动',
  stop: '停止',
  restart: '重启',
  upgrade: '升级',
  backup: '备份',
  rollback: '回滚',
  deploy: 'Git发布',
  install: '安装',
  uninstall: '卸载',
  'install-service': '挂载系统服务',
  'uninstall-service': '卸载系统服务',
  'update-lib': '更新依赖包',
  'git-deploy': 'Git发布',
};

/**
 * 取操作中文名。
 *
 * @param operation 操作类型
 * @returns 中文名；未登记时原样返回
 */
function opLabel(operation: string) {
  return OP_LABELS[operation] || operation || '操作';
}

// ---- 右键菜单（与「更多」下拉同一套命令） ----
interface CtxCommandItem {
  command: string;
  label: string;
  icon: string;
  danger?: boolean;
  divided?: boolean;
  /** 二级菜单项：有子项时该行只做分组，不直接执行 */
  children?: CtxCommandItem[];
}

/** 右键菜单状态（Teleport 到 body，避免被 rail 的 overflow 裁切） */
const ctxMenu = reactive<{ visible: boolean; x: number; y: number; item: Project | null; flip: boolean }>({
  visible: false,
  x: 0,
  y: 0,
  item: null,
  flip: false,
});

/** 菜单宽度 / 行高（用于贴边翻转，元素未渲染前先按此估算） */
const CTX_MENU_WIDTH = 196;
const CTX_ROW_HEIGHT = 32;
const CTX_HEAD_HEIGHT = 38;
/**
 * 某个项目在右键菜单里的命令列表（条件与「更多」下拉一致）。
 *
 * @param item 项目
 * @returns 命令列表
 */
function ctxCommandsFor(item: Project): CtxCommandItem[] {
  const out: CtxCommandItem[] = [
    { command: 'info', label: '系统信息', icon: 'InfoFilled' },
    { command: 'edit', label: '编辑', icon: 'EditPen' },
    // 文件管理直接开成右侧页签，不再弹模态框盖住整个项目列表
    { command: 'files', label: '文件管理', icon: 'FolderOpened' },
    // 健康检测：配置一个检测地址，按 HTTP 200 判定服务是否健康
    { command: 'health', label: '健康检测', icon: 'FirstAidKit' },
  ];
  // 系统日志：内容来自项目配置的 logPath（目录时服务端取最新文件），配了才有入口；
  // 项目被禁用也不挡查看 —— 停止的服务往往正是最需要翻日志的时候
  if (item.logPath) out.push({ command: 'log', label: '系统日志', icon: 'Tickets' });
  // Git 仓库：配了地址才给入口，点了看分支/提交/改动并能拉取
  if (item.gitUrl) {
    out.push({ command: 'git-repo', label: '打开 Git 仓库', icon: 'GitBranch' });
  }

  // 观测与诊断收进二级菜单：类型不同能用的入口不同，运行时再按条件拼
  const observe: CtxCommandItem[] = [];
  if (item.enabled !== false) {
    if (item.javaProcess) {
      observe.push({ command: 'swagger', label: 'Swagger 接口文档', icon: 'Link' });
      observe.push({ command: 'actuator', label: 'Actuator 运行指标', icon: 'DataAnalysis' });
    }
    // 只有注入过会向上报数据的 agent（平台自有 / SkyWalking）才给 APM 与链路追踪，
    // 未接入的项目点进去只会看到一个空观测台
    if (hasObservableApm(item)) {
      observe.push({ command: 'apm', label: 'APM 观测', icon: 'DataLine' });
      observe.push({ command: 'traces', label: '链路追踪', icon: 'Share' });
    }
    if (isJavaProject(item)) observe.push({ command: 'arthas', label: 'Arthas 诊断', icon: 'Monitor' });
  }
  if (observe.length) {
    out.push({ command: 'observe', label: '观测与诊断', icon: 'Compass', children: observe, divided: true });
  }

  if (item.enabled !== false) {
    out.push({ command: 'upgrade', label: '升级（安装包）', icon: 'Top', divided: true });
    if (item.projectType === 'separated') {
      out.push({ command: 'update-lib', label: '更新依赖包', icon: 'Box' });
    }
    out.push({ command: 'backup', label: '备份', icon: 'FolderChecked' });
    out.push({ command: 'rollback', label: '回滚', icon: 'RefreshLeft' });
    if (item.gitUrl) out.push({ command: 'git-deploy', label: '从 Git 更新', icon: 'GitBranch' });
  }
  // 下载源码：把项目目录整体打包下载，排障 / 存档不必再开文件管理器逐层翻
  if (item.projectPath) {
    out.push({ command: 'download-source', label: '下载源码', icon: 'Download', divided: true });
  }
  // 系统配置：上传后自动升级 + 升级默认选项（从编辑页挪出来的高级配置）
  out.push({ command: 'system-config', label: '系统配置', icon: 'Setting' });
  // 路径复制：排障时经常要把项目目录/日志文件贴到终端或工单里
  if (item.projectPath) {
    out.push({ command: 'copy-path', label: '复制项目地址', icon: 'DocumentCopy' });
  }
  if (item.logPath) {
    out.push({ command: 'copy-log', label: '复制日志地址', icon: 'DocumentCopy' });
  }
  out.push({ command: 'op-log', label: '操作日志', icon: 'Tickets', divided: true });
  out.push({ command: 'copy', label: '复制到其他服务器', icon: 'CopyDocument' });
  out.push({
    command: 'toggle',
    label: item.enabled === false ? '激活' : '禁用',
    icon: item.enabled === false ? 'Unlock' : 'Lock',
  });
  out.push({ command: 'delete', label: '删除', icon: 'Delete', danger: true, divided: true });
  return out;
}

/** 当前菜单项对应的命令列表 */
const ctxCommands = computed<CtxCommandItem[]>(() => (ctxMenu.item ? ctxCommandsFor(ctxMenu.item) : []));

/**
 * 打开项目右键菜单（贴边时自动翻转，保证菜单完整可见）。
 *
 * @param item  项目
 * @param event 鼠标事件
 */
function openContextMenu(item: Project, event: MouseEvent) {
  selectedProject.value = item;
  const commands = ctxCommandsFor(item);
  const menuHeight = CTX_HEAD_HEIGHT + commands.length * CTX_ROW_HEIGHT + 8;
  const maxX = Math.max(8, window.innerWidth - CTX_MENU_WIDTH - 8);
  const maxY = Math.max(8, window.innerHeight - menuHeight - 8);
  ctxMenu.item = item;
  ctxMenu.x = Math.min(Math.max(8, event.clientX), maxX);
  ctxMenu.y = Math.min(Math.max(8, event.clientY), maxY);
  // 二级菜单默认向右展开；贴着右边缘时整组向左翻
  ctxMenu.flip = ctxMenu.x + CTX_MENU_WIDTH + 200 > window.innerWidth;
  ctxMenu.visible = true;
}

/** 关闭右键菜单 */
function closeContextMenu() {
  ctxMenu.visible = false;
}

/**
 * 执行右键菜单命令（复用「更多」下拉的分发逻辑）。
 *
 * @param command 命令
 */
function onCtxCommand(command: string) {
  const item = ctxMenu.item;
  closeContextMenu();
  if (item) onMoreCommand(item, command);
}

/** 菜单打开时按 Esc 关闭 */
function onCtxKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && ctxMenu.visible) closeContextMenu();
}

// ---- 操作失败详情 ----
/** 失败详情对话框是否可见 */
const failureVisible = ref(false);
/** 失败详情内容 */
const failureDetail = reactive<{
  operation: string;
  project: string;
  projectId: number | null;
  message: string;
  logs: string[];
}>({ operation: '', project: '', projectId: null, message: '', logs: [] });

/**
 * 展示任务失败详情：后端原因 + 最近任务日志。
 *
 * @param task 任务（已结束且失败）
 * @param item 项目（可空：升级弹框等场景只有名称）
 */
function openFailureDetail(task: ProcessTask, item?: Project | null) {
  failureDetail.operation = opLabel(task.operation);
  failureDetail.project = item?.projectName || task.title;
  failureDetail.projectId = item?.id ?? null;
  failureDetail.message = task.message || '操作失败，后端未返回具体原因';
  failureDetail.logs = task.logs.slice(-40);
  failureVisible.value = true;
}

/** 从失败详情直接跳到该项目的实时日志 */
function openFailureLog() {
  failureVisible.value = false;
  const id = failureDetail.projectId;
  if (id == null) {
    message.info('该操作没有关联项目，请在项目行右键查看实时日志');
    return;
  }
  const item = list.value.find((p) => p.id === id);
  if (item) void openLogTab(item);
}

// ---- 项目操作 ----
async function runOperation(item: Project, operation: string, path: string) {
  try {
    const res = await http().post(BASE + path);
    const taskId = unwrapResult<string>(res);
    if (!taskId) {
      message.warning('项目有操作正在进行，请稍后再试');
      return;
    }
    const task = trackTask(taskId, item.projectName, operation);
    // 任务结束：刷新列表；失败时弹「操作失败详情」，把后端原因和最近日志直接摆出来
    const stopWatch = watch(() => task.finished, (fin) => {
      if (!fin) return;
      stopWatch();
      loadList();
      if (!task.success) openFailureDetail(task, item);
    });
  } catch (e) {
    // 同步失败（后端还没建任务就返回原因，例如主机未开 SSH）也要弹同一套详情：
    // toast 一闪而过、无法复制，用户仍然只知道「失败」却不知道该改什么。
    failureDetail.operation = opLabel(operation);
    failureDetail.project = item.projectName;
    failureDetail.projectId = item.id;
    failureDetail.message = errorText(e, `「${opLabel(operation)}」触发失败`);
    failureDetail.logs = [];
    failureVisible.value = true;
  }
}

function handleStart(row: Project) {
  return runOperation(row, 'start', `/project/${row.id}/start`);
}
function handleStop(row: Project) {
  return runOperation(row, 'stop', `/project/${row.id}/stop`);
}
function handleRestart(row: Project) {
  return runOperation(row, 'restart', `/project/${row.id}/restart`);
}
function handleGitDeploy(row: Project) {
  return runOperation(row, 'deploy', `/project/${row.id}/git/deploy`);
}
function handleBackup(row: Project) {
  return runOperation(row, 'backup', `/project/${row.id}/backup`);
}
async function handleRollback(row: Project) {
  try {
    await ElMessageBox.confirm(`确定回滚项目「${row.projectName}」到上一个版本吗？`, '回滚确认', { type: 'warning' });
  } catch {
    return;
  }
  await runOperation(row, 'rollback', `/project/${row.id}/rollback`);
}

// ---- 变量设置弹窗 ----
const varsVisible = ref(false);
const varsCategory = ref<'env' | 'jvm' | 'app'>('env');

interface CatalogItem { flag: string; desc: string; boolean?: boolean; sep?: ':' | '=' | 'concat' | ' '; }

const ENV_CATALOG: CatalogItem[] = [
  { flag: 'JAVA_HOME', desc: 'JDK 安装路径，如 /usr/lib/jvm/jdk-17' },
  { flag: 'JRE_HOME', desc: 'JRE 安装路径' },
  { flag: 'JAVA_OPTS', desc: 'JVM 额外参数（启动时追加），如 -Xmx512m' },
  { flag: 'JAVA_TOOL_OPTIONS', desc: 'JVM 启动时自动注入的参数，如 -Dfile.encoding=UTF-8' },
  { flag: 'SPRING_PROFILES_ACTIVE', desc: 'Spring 激活的 Profile，如 prod' },
  { flag: 'SPRING_APPLICATION_JSON', desc: 'Spring 内联 JSON 配置' },
  { flag: 'SPRING_CONFIG_LOCATION', desc: 'Spring 外部配置文件位置' },
  { flag: 'CLASSPATH', desc: '类搜索路径，如 ./lib/*' },
  { flag: 'PATH', desc: '可执行文件搜索路径' },
  { flag: 'TZ', desc: '时区，如 Asia/Shanghai' },
  { flag: 'LANG', desc: '语言与编码，如 en_US.UTF-8' },
  { flag: 'LC_ALL', desc: '强制区域设置，如 en_US.UTF-8' },
  { flag: 'HOME', desc: '用户主目录' },
  { flag: 'APP_HOME', desc: '应用安装目录' },
  { flag: 'LOG_PATH', desc: '日志输出目录' },
  { flag: 'HTTP_PROXY', desc: 'HTTP 代理地址，如 http://proxy:8080' },
  { flag: 'HTTPS_PROXY', desc: 'HTTPS 代理地址' },
  { flag: 'NO_PROXY', desc: '代理排除地址，如 localhost,127.0.0.1' },
  { flag: 'NODE_ENV', desc: 'Node 运行环境，如 production' },
];

const JVM_CATALOG: CatalogItem[] = [
  // —— 内存 ——
  { flag: '-Xmx', desc: '最大堆内存，如 512m / 2g', sep: 'concat' },
  { flag: '-Xms', desc: '初始堆内存，如 256m', sep: 'concat' },
  { flag: '-Xmn', desc: '年轻代大小，如 256m', sep: 'concat' },
  { flag: '-Xss', desc: '每个线程栈大小，如 512k', sep: 'concat' },
  { flag: '-XX:MaxMetaspaceSize', desc: '元空间最大值，如 256m' },
  { flag: '-XX:MetaspaceSize', desc: '元空间初始阈值，如 128m' },
  { flag: '-XX:MaxDirectMemorySize', desc: '最大直接内存，如 512m' },
  { flag: '-XX:SurvivorRatio', desc: 'Eden / Survivor 比例，如 8' },
  { flag: '-XX:NewRatio', desc: '老年代 / 年轻代比例，如 2' },
  { flag: '-XX:MaxRAMPercentage', desc: '堆占容器内存百分比，如 75.0' },
  { flag: '-XX:InitialRAMPercentage', desc: '初始堆占内存百分比，如 50.0' },
  // —— 垃圾回收 ——
  { flag: '-XX:+UseG1GC', desc: '启用 G1 垃圾收集器（推荐）', boolean: true },
  { flag: '-XX:+UseParallelGC', desc: '启用 ParallelGC（吞吐优先）', boolean: true },
  { flag: '-XX:+UseZGC', desc: '启用 ZGC（超低延迟，JDK15+）', boolean: true },
  { flag: '-XX:+UseShenandoahGC', desc: '启用 ShenandoahGC（低延迟）', boolean: true },
  { flag: '-XX:+UseSerialGC', desc: '启用 SerialGC（单线程，小应用）', boolean: true },
  { flag: '-XX:MaxGCPauseMillis', desc: 'GC 最大停顿目标毫秒，如 200' },
  { flag: '-XX:GCTimeRatio', desc: 'GC 时间占比（0-100，越大越少），如 99' },
  { flag: '-XX:+UseStringDeduplication', desc: 'G1 字符串去重，节省内存', boolean: true },
  { flag: '-Xlog:gc*', desc: 'GC 日志输出（JDK11+），如 gc.log:time', sep: ':' },
  // —— OOM 与诊断 ——
  { flag: '-XX:+HeapDumpOnOutOfMemoryError', desc: 'OOM 时自动 dump 堆快照', boolean: true },
  { flag: '-XX:HeapDumpPath', desc: '堆 dump 输出路径，如 ./heap.hprof' },
  { flag: '-XX:+ExitOnOutOfMemoryError', desc: 'OOM 时直接退出进程（便于守护重启）', boolean: true },
  { flag: '-XX:OnOutOfMemoryError', desc: 'OOM 时执行的命令，如 ./restart.sh' },
  // —— 编码 / 时区 / 语言 ——
  { flag: '-Dfile.encoding', desc: '文件编码，如 UTF-8' },
  { flag: '-Dsun.jnu.encoding', desc: 'JNU 文件名编码，如 UTF-8' },
  { flag: '-Duser.timezone', desc: '时区，如 Asia/Shanghai' },
  { flag: '-Duser.language', desc: '语言，如 zh' },
  { flag: '-Duser.country', desc: '国家/地区，如 CN' },
  // —— Classpath / Loader ——
  { flag: '-cp', desc: '类路径，如 ./lib/*', sep: ' ' },
  { flag: '-Djava.ext.dirs', desc: '扩展类目录（JDK8），如 ./ext' },
  { flag: '-Dloader.path', desc: 'Spring Boot PropertiesLauncher 加载路径，如 lib' },
  { flag: '-Djava.class.path', desc: '类路径，如 ./classes;./lib/*' },
  // —— Agent / 远程调试 ——
  { flag: '-javaagent', desc: '挂载 Java Agent，如 /opt/agent/skywalking-agent.jar', sep: ':' },
  { flag: '-agentlib:jdwp', desc: '远程调试，如 transport=dt_socket,server=y,suspend=n,address=*:5005', sep: ':' },
  { flag: '-agentlib', desc: '挂载本地代理库，如 hprof', sep: ':' },
  { flag: '-agentpath', desc: '本地代理库绝对路径', sep: ':' },
  { flag: '-verbose:class', desc: '打印类加载信息', boolean: true },
  // —— 三方 APM / 诊断 ——
  { flag: '-Dskywalking.agent.service_name', desc: 'SkyWalking 服务名，如 user-service' },
  { flag: '-Dskywalking.collector.backend_service', desc: 'SkyWalking OAP 地址，如 oap:11800' },
  { flag: '-Dskywalking.logging.dir', desc: 'SkyWalking Agent 日志目录' },
  { flag: '-Darthas.appName', desc: 'Arthas 应用名（配合 arthas agent）' },
  { flag: '-Darthas.tunnelServer', desc: 'Arthas Tunnel 地址，如 tunnel:7777' },
  // —— 网络代理 ——
  { flag: '-Dhttp.proxyHost', desc: 'HTTP 代理主机' },
  { flag: '-Dhttp.proxyPort', desc: 'HTTP 代理端口，如 8080' },
  { flag: '-Dhttps.proxyHost', desc: 'HTTPS 代理主机' },
  { flag: '-Dhttps.proxyPort', desc: 'HTTPS 代理端口' },
  // —— 日志 ——
  { flag: '-Dlogging.level.root', desc: '根日志级别，如 INFO / DEBUG' },
  { flag: '-Dlogging.config', desc: '日志配置文件，如 classpath:logback-spring.xml' },
  { flag: '-Dlogback.configurationFile', desc: 'Logback 配置文件路径' },
  { flag: '-Dlog4j.configurationFile', desc: 'Log4j2 配置文件路径' },
];

const APP_CATALOG: CatalogItem[] = [
  { flag: '--spring.profiles.active', desc: 'Spring 激活的 Profile，如 prod' },
  { flag: '--spring.application.name', desc: '应用名，如 user-service' },
  { flag: '--server.port', desc: '服务监听端口，如 8080' },
  { flag: '--server.servlet.context-path', desc: '上下文路径，如 /api' },
  { flag: '--spring.config.location', desc: '外部配置文件位置' },
  { flag: '--spring.config.additional-location', desc: '额外配置文件位置' },
  { flag: '--spring.config.name', desc: '配置文件名（无扩展名），如 application' },
  { flag: '--spring.main.web-application-type', desc: 'Web 类型，servlet / reactive / none' },
  { flag: '--logging.level.root', desc: '根日志级别，如 DEBUG' },
  { flag: '--logging.file.name', desc: '日志文件名，如 app.log' },
  { flag: '--logging.file.path', desc: '日志输出目录' },
  { flag: '--management.endpoints.web.exposure.include', desc: 'Actuator 暴露端点，如 health,info,*' },
  { flag: '--management.endpoint.health.show-details', desc: '健康检查显示详情，如 always' },
  { flag: '--spring.datasource.url', desc: '数据源 JDBC URL' },
  { flag: '--spring.datasource.username', desc: '数据源用户名' },
  { flag: '--spring.datasource.password', desc: '数据源密码' },
  { flag: '--spring.redis.host', desc: 'Redis 主机' },
  { flag: '--spring.redis.port', desc: 'Redis 端口，如 6379' },
  { flag: '--spring.jpa.show-sql', desc: '打印 SQL 语句', boolean: true },
  { flag: '--spring.cloud.nacos.discovery.server-addr', desc: 'Nacos 注册中心地址' },
  { flag: '--spring.cloud.nacos.config.server-addr', desc: 'Nacos 配置中心地址' },
  { flag: '--spring.profiles.include', desc: '附加 Profile，如 dev,common' },
  { flag: '--debug', desc: '开启调试日志', boolean: true },
];

const currentCatalog = computed<CatalogItem[]>(() => ({
  env: ENV_CATALOG,
  jvm: JVM_CATALOG,
  app: APP_CATALOG,
}[varsCategory.value]));

const varsBuffer = ref<{ env: KVRow[]; jvm: KVRow[]; app: KVRow[] }>({ env: [], jvm: [], app: [] });
const varsRows = computed<KVRow[]>(() => varsBuffer.value[varsCategory.value]);

// 变量 tab：卡片摘要 + 箭头内联展开（手风琴）
const varsExpanded = ref<'env' | 'jvm' | 'app' | null>(null);
function toggleVarsExpand(cat: 'env' | 'jvm' | 'app') {
  varsExpanded.value = varsExpanded.value === cat ? null : cat;
}
const varCards = computed(() => [
  {
    cat: 'env' as const,
    title: '环境变量',
    icon: 'Operation',
    count: `${form.value.envVars.length} 项`,
    items: form.value.envVars.filter((r) => r.key).map((r) => `${r.key}=${r.value}`),
  },
  {
    cat: 'jvm' as const,
    title: 'JVM 参数',
    icon: 'Cpu',
    count: `${form.value.jvmArgs.length} 项（-jar 之前）`,
    items: form.value.jvmArgs,
  },
  {
    cat: 'app' as const,
    title: '命令参数',
    icon: 'Tickets',
    count: `${form.value.cmdArgs.length} 项（应用参数）`,
    items: form.value.cmdArgs,
  },
]);

const serviceNamePreview = computed(() => {
  const base = (form.value.projectName || 'project')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'project';
  return `ms-${base}`;
});

const keyPlaceholder = computed(() => ({
  env: '选择或输入变量名，如 JAVA_HOME',
  jvm: '选择或输入 JVM 参数，如 -Xmx',
  app: '选择或输入命令参数，如 --server.port',
}[varsCategory.value]));
const valuePlaceholder = computed(() => ({
  env: '变量值',
  jvm: '参数值，如 512m',
  app: '参数值，如 8080',
}[varsCategory.value]));

function isBooleanRow(row: KVRow) {
  if (varsCategory.value === 'jvm') {
    if (/^-XX:[+-]/.test(row.key)) return true;
  }
  return currentCatalog.value.some((o) => o.flag === row.key && o.boolean);
}

// ---- 占位符快捷插入（插入到当前聚焦的值输入框光标处） ----
let focusedValEl: HTMLInputElement | null = null;
function onValFocus(e: FocusEvent) {
  focusedValEl = e.target as HTMLInputElement;
}
function insertPlaceholder(snippet: string) {
  const el = focusedValEl;
  if (!el) {
    // 未聚焦任何值框：追加到当前分类最后一行
    const rows = varsRows.value;
    if (!rows.length) return;
    rows[rows.length - 1].value += snippet;
    return;
  }
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + snippet + el.value.slice(end);
  // 通过原生 setter 赋值并派发 input，确保 Vue v-model 同步
  const desc = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
  if (desc && desc.set) {
    desc.set.call(el, next);
  } else {
    el.value = next;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  const pos = start + snippet.length;
  el.setSelectionRange(pos, pos);
  el.focus();
}

function openVarsDialog(cat: 'env' | 'jvm' | 'app') {
  varsBuffer.value = {
    env: form.value.envVars.map((r) => ({ key: r.key, value: r.value })),
    jvm: form.value.jvmArgs.map(splitJvm),
    app: form.value.cmdArgs.map(splitApp),
  };
  varsCategory.value = cat;
  varsVisible.value = true;
}

function splitJvm(s: string): KVRow {
  const t = s.trim();
  if (t.startsWith('-D')) {
    const i = t.indexOf('=');
    return i >= 0 ? { key: t.slice(0, i), value: t.slice(i + 1) } : { key: t, value: '' };
  }
  const cm = t.match(/^(-javaagent|-agentlib|-agentpath|-Xlog|-Xbootclasspath(?:\/a)?):(.+)$/);
  if (cm) return { key: cm[1], value: cm[2] };
  if (t.startsWith('-XX:')) {
    const body = t.slice(4);
    if (body.startsWith('+') || body.startsWith('-')) return { key: t, value: '' };
    const i = body.indexOf('=');
    return i >= 0 ? { key: '-XX:' + body.slice(0, i), value: body.slice(i + 1) } : { key: t, value: '' };
  }
  for (const p of ['-Xmx', '-Xms', '-Xss', '-Xmn']) {
    if (t.startsWith(p)) return { key: p, value: t.slice(p.length) };
  }
  const cp = t.match(/^(-cp|-classpath)\s+(.+)$/);
  if (cp) return { key: cp[1], value: cp[2] };
  return { key: t, value: '' };
}

function joinJvm(r: KVRow): string {
  const k = r.key.trim();
  if (!k) return '';
  const v = r.value.trim();
  const cat = JVM_CATALOG.find((c) => c.flag === k);
  if (cat?.boolean || /^-XX:[+-]/.test(k)) return k;
  let sep = cat?.sep;
  if (!sep) {
    if (k.startsWith('-D') || k.startsWith('-XX:')) sep = '=';
    else if (['-Xmx', '-Xms', '-Xss', '-Xmn'].includes(k)) sep = 'concat';
    else if (/^-(javaagent|agentlib|agentpath|Xlog|Xbootclasspath)/.test(k)) sep = ':';
    else if (k === '-cp' || k === '-classpath') sep = ' ';
    else sep = '=';
  }
  if (!v) return k;
  return sep === 'concat' ? k + v : k + sep + v;
}

function splitApp(s: string): KVRow {
  const i = s.indexOf('=');
  return i >= 0 ? { key: s.slice(0, i), value: s.slice(i + 1) } : { key: s, value: '' };
}
function joinApp(r: KVRow): string {
  const k = r.key.trim();
  if (!k) return '';
  return r.value.trim() ? `${k}=${r.value.trim()}` : k;
}

function confirmVars() {
  form.value.envVars = varsBuffer.value.env
    .filter((r) => r.key.trim())
    .map((r) => ({ key: r.key.trim(), value: r.value }));
  form.value.jvmArgs = varsBuffer.value.jvm.map(joinJvm).filter(Boolean);
  form.value.cmdArgs = varsBuffer.value.app.map(joinApp).filter(Boolean);
  varsVisible.value = false;
}

// ---- SpringBoot 项目配置 ----
const supportsAppConfig = computed(() => ['springboot', 'fatjar', 'git'].includes(form.value.projectType));
const appCfgVisible = ref(false);
const appCfgRows = ref<KVRow[]>([]);
function openAppConfigDialog() {
  appCfgRows.value = form.value.appConfig.map((r) => ({ key: r.key, value: r.value }));
  appCfgVisible.value = true;
}
function confirmAppConfig() {
  form.value.appConfig = appCfgRows.value
    .filter((r) => r.key.trim())
    .map((r) => ({ key: r.key.trim(), value: r.value }));
  appCfgVisible.value = false;
}

// ---- 系统服务 ----
async function handleInstallService() {
  if (form.value.guardian && !form.value.statusScript) {
    message.error('开启守护进程需先在「脚本配置」中配置状态命令');
    return;
  }
  await handleSave();
  if (!dialogVisible.value) {
    try {
      const res = await http().post(`${BASE}/project/${editingId.value}/service/install`);
      const taskId = unwrapResult<string>(res);
      if (taskId) trackTask(taskId, form.value.projectName, 'install-service');
    } catch (e: any) {
      toastError(e, '挂载服务失败');
    }
  }
}
async function handleUninstallService() {
  try {
    const res = await http().post(`${BASE}/project/${editingId.value}/service/uninstall`);
    const taskId = unwrapResult<string>(res);
    form.value.serviceName = '';
    if (taskId) trackTask(taskId, form.value.projectName, 'uninstall-service');
  } catch (e: any) {
    toastError(e, '卸载服务失败');
  }
}

// ---- 项目文件管理（右键「文件管理」在右侧开页签） ----
/** 已打开的文件管理页签（按项目去重） */
const filesTabs = ref<{ projectId: number; projectName: string; initPath: string }[]>([]);
/** 已打开的系统信息页签（项目 id） */
const infoTabs = ref<number[]>([]);

/** 单项目操作日志弹框 */
const projOpLogVisible = ref(false);
/** 操作日志当前项目（标题用） */
const projOpLogProject = ref<Project | null>(null);

/** Git 仓库面板（右键「打开 Git 仓库」） */
const gitDialogRef = ref<{ open: (p: { id: number; projectName: string }) => void } | null>(null);
/** Git 面板当前项目（标题与拉取进度文案用） */
const gitRepoProject = ref<{ id: number; projectName: string } | null>(null);

/**
 * 复制文本到剪贴板。
 *
 * <p>非安全上下文（http 且非 localhost）下 {@code navigator.clipboard} 不存在，
 * 必须退回 {@code execCommand}，否则右键「复制地址」点了没反应、也没有任何提示。</p>
 *
 * @param text  待复制文本
 * @param label 内容名（提示用）
 */
async function copyText(text: string, label: string) {
  const value = String(text || '').trim();
  if (!value) {
    message.warning(`该项目的${label}为空`);
    return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const el = document.createElement('textarea');
      el.value = value;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    message.success(`已复制${label}：${value}`);
  } catch (e: any) {
    message.error(`复制${label}失败：${errorText(e)}`);
  }
}

/**
 * 打开单项目操作日志（只看这个项目的启动/升级/回滚记录）。
 *
 * @param item 项目
 */
function openProjectOpLog(item: Project) {
  projOpLogProject.value = item;
  projOpLogVisible.value = true;
}

/**
 * 打开项目的文件管理（右侧页签）。
 *
 * <p>为什么落到项目地址而不是主机根目录：右键是从某个项目上发起的，用户要看的是
 * 「这个项目的文件」；从根目录开始翻等于把路径再手抄一遍。项目地址为空时才退回
 * 日志目录，再没有就交给组件用默认根目录。</p>
 *
 * @param item 项目
 */
function openFilesTab(item: Project) {
  if (!releaseHostId.value) {
    message.warning('未识别到该发布绑定的主机，无法浏览主机文件');
    return;
  }
  const dir = String(item.projectPath || '').trim();
  const initPath = dir || dirOf(String(item.logPath || '')) || '';
  const existing = filesTabs.value.find((f) => f.projectId === item.id);
  if (existing) {
    existing.initPath = initPath;
  } else {
    filesTabs.value.push({ projectId: item.id, projectName: item.projectName, initPath });
  }
  selectedProject.value = item;
  activeWorkspaceTab.value = `files:${item.id}`;
}

/**
 * 左键点击项目行：在右侧打开该项目的「系统信息」页签（复用已开的）。
 *
 * @param item 项目
 */
function openInfoTab(item: Project) {
  selectedProject.value = item;
  if (!infoTabs.value.includes(item.id)) infoTabs.value.push(item.id);
  activeWorkspaceTab.value = `info:${item.id}`;
  // 只有 Java 服务且运行中才值得走 SSH 探测，其余类型不打扰主机
  if (item.enabled !== false && item.javaProcess) ensureEndpoint(item);
}

/** 项目行左键：右侧显示系统信息（双击另开日志） */
function onRowClick(item: Project) {
  openInfoTab(item);
}

/**
 * 打开 APM 链路追踪页签，并按该项目的服务名筛选。
 *
 * @param item 项目
 */
function openApmTraces(item: Project) {
  const cfg = parseApmConfig(parseJson<string>(item.jvmArgs, []));
  const service = String(cfg.swServiceName || item.projectName || '').trim();
  const target = router.resolve({
    path: '/apm',
    query: { tab: 'traces', ...(service ? { service } : {}) },
  });
  if (!target.matched.length) {
    message.warning('当前宿主未挂载 APM 观测台，无法打开链路追踪');
    return;
  }
  router.push(target.fullPath);
}

/**
 * 下载项目源码：把目标主机上的项目目录整体打包下载。
 *
 * @param item 项目
 */
async function downloadProjectSource(item: Project) {
  if (!releaseHostId.value) {
    message.warning('未识别到该发布绑定的主机，无法下载源码');
    return;
  }
  const dir = String(item.projectPath || '').trim();
  if (!dir) {
    message.warning('该项目未配置项目地址，无法下载源码');
    return;
  }
  try {
    message.info('正在打包项目目录，较大的项目需要等待…');
    const blob = await downloadHostFile(releaseHostId.value, dir);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const base = dir.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || item.projectName;
    a.href = url;
    a.download = `${base}-source.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (e: any) {
    toastError(e, '下载源码失败');
  }
}

/**
 * 项目注入的 APM 类型标签（空串 = 未接入）。
 *
 * @param item 项目
 */
function apmLabelOf(item: Project): string {
  const cfg = parseApmConfig(parseJson<string>(item.jvmArgs, []));
  if (cfg.apmType === 'platform') return '平台自有 APM';
  if (cfg.apmType === 'skywalking') return 'SkyWalking';
  if (cfg.apmType === 'arthas') return 'Arthas';
  return '';
}

/**
 * 系统信息面板里的操作统一回到页面既有命令，避免两套确认/任务浮层走岔。
 *
 * @param item    项目
 * @param command 面板动作
 */
function onInfoAction(item: Project, command: string) {
  switch (command) {
    case 'start':
      handleStart(item);
      break;
    case 'stop':
      handleStop(item);
      break;
    case 'restart':
      handleRestart(item);
      break;
    case 'vars':
      openEditDialog(item);
      activeTab.value = 'vars';
      break;
    default:
      onMoreCommand(item, command);
  }
}

/**
 * 打开项目的 Git 仓库面板（分支 / 提交 / 工作区改动，可拉取）。
 *
 * @param item 项目
 */
function openGitRepository(item: Project) {
  gitRepoProject.value = { id: item.id, projectName: item.projectName };
  gitDialogRef.value?.open({ id: item.id, projectName: item.projectName });
}

/**
 * Git 面板里「去配置」：关掉面板并打开项目的编辑弹框。
 *
 * @param p 项目引用
 */
function onGitRepoEdit(p: { id: number; projectName: string }) {
  const item = list.value.find((row) => row.id === p.id);
  if (item) {
    openEditDialog(item);
  }
}

/**
 * 打开 APM 观测台并定位到该项目的服务。
 *
 * <p>只做一次跨页跳转，不在这里直接查 APM 接口：观测台是页签式单页，
 * 服务名通过 URL query 带过去，由工作台在 setup 阶段暂存成
 * {@code ApmTabContext}。这样落地页的「服务」页签会直接按该服务筛选，
 * 而不是让用户在下拉里再选一次（APM 跨页下钻的既有口径）。</p>
 *
 * @param item 项目
 */
function openApmWorkbench(item: Project) {
  const cfg = parseApmConfig(parseJson<string>(item.jvmArgs, []));
  // SkyWalking 有显式 service_name；平台自有 APM 按项目名注册
  const service = String(cfg.swServiceName || item.projectName || '').trim();
  const target = router.resolve({
    path: '/apm',
    query: service ? { tab: 'services', service } : { tab: 'services' },
  });
  if (!target.matched.length) {
    message.warning('当前宿主未挂载 APM 观测台，无法打开');
    return;
  }
  router.push(target.fullPath);
}

// ---- 主机路径选择器（项目地址 / 日志地址 / Nginx 目录） ----
/** 路径选择器弹框 */
const pathPickerVisible = ref(false);
/** 正在挑选的字段名 */
const pathPickerField = ref<'projectPath' | 'logPath' | 'nginxDir' | ''>('');
/** 选择器初始目录 */
const pathPickerInit = ref('');

const PATH_FIELD_LABELS: Record<string, string> = {
  projectPath: '项目地址',
  logPath: '日志地址',
  nginxDir: 'Nginx 目录',
};

const pathPickerTitle = computed(
  () => `选择${PATH_FIELD_LABELS[pathPickerField.value] || '路径'} · 主机文件管理`,
);

/**
 * 取路径的父目录。
 *
 * <p>日志地址指向的是文件，选择器应当从该文件所在目录开始，
 * 否则用户一进弹框就停在一个「文件」上，看不到同级文件。</p>
 *
 * @param p 路径
 * @returns 父目录；无分隔符时原样返回
 */
function dirOf(p: string): string {
  const s = (p || '').trim();
  if (!s) return '';
  const idx = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'));
  if (idx <= 0) return s;
  return s.slice(0, idx);
}

/**
 * 打开主机文件管理选择路径。
 *
 * @param field 要回填的表单字段
 */
function openPathPicker(field: 'projectPath' | 'logPath' | 'nginxDir') {
  if (!releaseHostId.value) {
    message.warning('未识别到该发布绑定的主机，无法浏览主机文件');
    return;
  }
  pathPickerField.value = field;
  const cur = String(form.value[field] || '');
  pathPickerInit.value = field === 'projectPath' ? cur : dirOf(cur);
  pathPickerVisible.value = true;
}

/**
 * 选择器回调：把主机路径写回表单字段。
 *
 * @param p 主机上的绝对路径
 */
function onPathPicked(p: string) {
  const field = pathPickerField.value;
  pathPickerVisible.value = false;
  if (!field || !p) return;
  form.value[field] = p;
  // 选了项目地址后，日志地址若不是以它开头，顺手补一个默认位置，减少手填
  if (field === 'projectPath' && !form.value.logPath.trim()) {
    const sep = hostPlatform.value === 'WINDOWS' ? '\\' : '/';
    form.value.logPath = `${p.replace(/[\\/]+$/, '')}${sep}logs${sep}app.log`;
  }
  message.success(`已选择：${p}`);
}

// ---- 拖拽升级 ----
const dragOverId = ref<number | null>(null);
/**
 * 拖拽上传安装包并按项目默认配置升级。
 *
 * @param item 项目
 * @param ev   拖拽事件
 */
async function onDropFile(item: Project, ev: DragEvent) {
  dragOverId.value = null;
  const file = ev.dataTransfer?.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await http().post(`${BASE}/project/${item.id}/upload`).data(fd);
    const taskId = unwrapResult<string>(res);
    if (typeof taskId === 'string' && taskId.startsWith('upload-only:')) {
      // 项目未开启「上传后自动升级」：安装包只落到 uploads/，不覆盖正在运行的包
      message.success(`已上传到 ${taskId.slice('upload-only:'.length)}（未开启自动升级）`);
      return;
    }
    if (taskId) {
      trackTask(taskId, item.projectName, 'upgrade');
    } else {
      message.error('上传升级失败');
    }
  } catch (e: any) {
    toastError(e, '上传升级失败');
  }
}

/**
 * 更新依赖包：只投递依赖（lib），不动主包。
 *
 * <p>分离式项目的依赖包与主包是两套文件，拖拽卡片默认按「主包」升级；
 * 依赖变更时必须在操作里单独选，否则会被当成主包替换，重启后直接起不来。
 * 这里用一个隐藏的 file input 选包，然后带 {@code deployType=lib} 调用同一个上传接口。</p>
 *
 * @param item 项目
 */
function handleUpdateLib(item: Project) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.jar,.zip,.tar,.tar.gz,.tgz';
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await http()
        .post(`${BASE}/project/${item.id}/upload?deployType=lib&autoRestart=false`)
        .data(fd);
      const taskId = unwrapResult<string>(res);
      if (taskId) {
        trackTask(taskId, `${item.projectName} · 依赖包`, 'upgrade');
        message.success('依赖包上传中，完成后可手动重启生效');
      } else {
        message.error('依赖包更新失败');
      }
    } catch {
      message.error('依赖包更新失败');
    }
  };
  input.click();
}

// ---- 系统配置（右键）：上传后自动升级 + 升级默认选项 ----
const sysCfgVisible = ref(false);
const sysCfgProject = ref<Project | null>(null);
const sysCfgLoading = ref(false);
const sysCfgSaving = ref(false);
const sysCfg = ref({
  uploadAutoUpgrade: false,
  autoBackup: true,
  autoExtract: true,
  autoRestart: true,
  autoRollback: false,
  actuatorMonitorEnabled: false,
  actuatorIntervalSeconds: 30,
  logLines: 100,
});

/** 该项目是否探测到 Actuator：只有可用时才显示定时采集配置 */
const sysCfgActuatorAvailable = ref(false);

/**
 * 打开项目系统配置：上传投放策略 + 升级默认选项一次改完。
 *
 * @param item 项目
 */
async function openSystemConfig(item: Project) {
  sysCfgProject.value = item;
  sysCfg.value = {
    uploadAutoUpgrade: !!item.uploadAutoUpgrade,
    autoBackup: true,
    autoExtract: item.uploadExtract ?? true,
    autoRestart: true,
    autoRollback: false,
    actuatorMonitorEnabled: false,
    actuatorIntervalSeconds: 30,
    logLines: 100,
  };
  sysCfgActuatorAvailable.value = !!endpointCache[item.id]?.actuator;
  // Actuator 是否可用决定「定时采集」区块是否出现：缓存没有就静默探一次
  void ensureEndpoint(item).then(() => {
    if (sysCfgProject.value?.id === item.id) {
      sysCfgActuatorAvailable.value = !!endpointCache[item.id]?.actuator;
    }
  });
  sysCfgVisible.value = true;
  sysCfgLoading.value = true;
  try {
    const res = await http().get(`${BASE}/upgrade/config?projectId=${item.id}`);
    const cfg = unwrapResult<any>(res) || {};
    const base = { ...(cfg.global || {}), ...(cfg.project || {}) };
    sysCfg.value = {
      uploadAutoUpgrade: !!(base.uploadAutoUpgrade ?? item.uploadAutoUpgrade),
      autoBackup: base.autoBackup ?? true,
      autoExtract: base.autoExtract ?? item.uploadExtract ?? true,
      autoRestart: base.autoRestart ?? true,
      autoRollback: base.autoRollback ?? false,
      actuatorMonitorEnabled: false,
      actuatorIntervalSeconds: 30,
      logLines: 100,
    };
    // 定时采集配置独立存放（项目级开关 + 间隔），与升级默认值互不覆盖
    const mon = unwrapResult<any>(
      await http().get(`${BASE}/project/${item.id}/endpoints/monitor`),
    ) || {};
    sysCfg.value.actuatorMonitorEnabled = !!mon.enabled;
    const interval = Number(mon.intervalSeconds);
    sysCfg.value.actuatorIntervalSeconds = Number.isFinite(interval) && interval >= 5 ? interval : 30;
    // 日志回放行数同样是项目级配置，默认 100
    const lines = unwrapResult<number>(
      await http().get(`${BASE}/project/${item.id}/log/lines`),
    );
    const lineNum = Number(lines);
    sysCfg.value.logLines = Number.isFinite(lineNum) && lineNum >= 10 ? lineNum : 100;
  } catch {
    // 接口失败时用项目字段兜底，仍可保存
  } finally {
    sysCfgLoading.value = false;
  }
}

/** 保存系统配置：项目级升级默认 + 项目自身的「上传后自动升级」 */
async function saveSystemConfig() {
  const item = sysCfgProject.value;
  if (!item) return;
  sysCfgSaving.value = true;
  try {
    // 升级默认值里不混入采集与日志配置，各存各的
    const { actuatorMonitorEnabled, actuatorIntervalSeconds, logLines, ...upgradeCfg } = sysCfg.value;
    await http()
      .put(`${BASE}/upgrade/config?scope=project&projectId=${item.id}`)
      .data(upgradeCfg);
    await http().put(`${BASE}/project/${item.id}`).data({
      uploadAutoUpgrade: sysCfg.value.uploadAutoUpgrade,
    });
    await http().put(`${BASE}/project/${item.id}/endpoints/monitor`).data({
      enabled: actuatorMonitorEnabled,
      intervalSeconds: actuatorIntervalSeconds,
    });
    await http().post(`${BASE}/project/${item.id}/log/lines?lines=${logLines ?? 100}`);
    message.success(`已保存「${item.projectName}」的系统配置`);
    sysCfgVisible.value = false;
    loadList();
  } catch (e: any) {
    toastError(e, '保存系统配置失败');
  } finally {
    sysCfgSaving.value = false;
  }
}

// ---- 手动升级弹窗 ----
const upgVisible = ref(false);
const upgProject = ref<Project | null>(null);
const upgLoading = ref(false);
/** 该项目是否已有显式保存过的项目级默认配置 */
const upgHasProjectCfg = ref(false);
const upgForm = ref({
  autoBackup: true,
  autoExtract: true,
  autoRestart: true,
  autoRollback: false,
  packagePath: '',
  deployType: '',
  uploadExtract: true,
  uploadTargetDir: '',
});
/** 本地安装包上传：文件选择器、上传中状态、最近一次上传的文件名 */
const upgFileInput = ref<HTMLInputElement | null>(null);
const upgUploading = ref(false);
const upgUploadedName = ref('');

/** 触发本地文件选择（弹框内的「选择文件」） */
function pickUpgFile() {
  upgFileInput.value?.click();
}

/**
 * 上传本地安装包到目标主机。
 *
 * <p>升级弹框以前只有「主机上的绝对路径」，本地包无处可传，只能先手动
 * scp 再回来填路径。这里复用项目卡片拖拽用的同一个接口：
 * 文件落到 {@code <项目目录>/uploads/}，再把远端绝对路径回填到
 * {@code packagePath}，用户点「执行升级」才真正投递。</p>
 *
 * <p>接口返回 {@code upload-only:<path>} 表示项目未开启「上传后自动升级」，
 * 只上传不部署；返回 taskId 则说明项目开了自动升级，后端已开始升级。</p>
 *
 * @param file 本地文件
 */
async function uploadUpgPackage(file: File) {
  const project = upgProject.value;
  if (!project) return;
  upgUploading.value = true;
  try {
    const fd = new FormData();
    fd.append('file', file);
    const res = await http().post(`${BASE}/project/${project.id}/upload`).data(fd);
    const out = unwrapResult<string>(res);
    if (typeof out === 'string' && out.startsWith('upload-only:')) {
      const remote = out.slice('upload-only:'.length);
      upgForm.value.packagePath = remote;
      upgUploadedName.value = file.name;
      message.success(`已上传到 ${remote}，点「执行升级」开始`);
      return;
    }
    if (out) {
      // 项目开启了「上传后自动升级」：后端已直接开始升级
      upgVisible.value = false;
      trackTask(out, project.projectName, 'upgrade');
      message.success('已上传，升级任务已开始');
      return;
    }
    message.error('上传失败：未返回安装包路径');
  } catch (e: any) {
    toastError(e, '上传安装包失败');
  } finally {
    upgUploading.value = false;
  }
}

/** 文件选择器回调 */
async function onUpgFilePicked(ev: Event) {
  const input = ev.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) await uploadUpgPackage(file);
}

/** 拖入文件上传 */
async function onUpgDrop(ev: DragEvent) {
  const file = ev.dataTransfer?.files?.[0];
  if (file) await uploadUpgPackage(file);
}

/**
 * 打开升级弹框：按「该项目自己的默认配置」预填。
 *
 * <p>以前这里读 last/global，导致给 A 项目调好的选项会带到 B 项目上
 * （例如分离式项目残留 deployType=lib，Java 项目会只投依赖而不更新主包）。
 * 现在请求 {@code /upgrade/config?projectId=}，后端以项目自身字段为基线
 * （deployType / uploadExtract / uploadTargetDir / mainEntry），再叠加用户
 * 显式保存过的项目级覆盖值。</p>
 *
 * @param item 项目
 */
async function openUpgradeDialog(item: Project) {
  upgProject.value = item;
  upgLoading.value = true;
  upgUploadedName.value = '';
  // 先用项目自身的字段兜底，接口失败也能用
  upgForm.value = {
    autoBackup: true,
    autoExtract: item.uploadExtract ?? true,
    autoRestart: true,
    autoRollback: false,
    packagePath: '',
    deployType: item.deployType || '',
    uploadExtract: item.uploadExtract ?? true,
    uploadTargetDir: item.uploadTargetDir || '',
  };
  upgHasProjectCfg.value = false;
  try {
    const res = await http().get(`${BASE}/upgrade/config?projectId=${item.id}`);
    const cfg = unwrapResult<any>(res) || {};
    const saved = cfg.project || {};
    upgHasProjectCfg.value = !!saved.__saved;
    const base = { ...(cfg.global || {}), ...saved };
    upgForm.value = {
      autoBackup: base.autoBackup ?? true,
      autoExtract: base.autoExtract ?? true,
      autoRestart: base.autoRestart ?? true,
      autoRollback: base.autoRollback ?? false,
      packagePath: '',
      deployType: base.deployType || item.deployType || '',
      uploadExtract: base.uploadExtract ?? item.uploadExtract ?? true,
      uploadTargetDir: base.uploadTargetDir || item.uploadTargetDir || '',
    };
    // 从配置里带出来的包路径是上一次的，不作为本次默认（避免误升同一个旧包）
    upgForm.value.packagePath = '';
  } catch {
    // 使用项目字段兜底
  } finally {
    upgLoading.value = false;
    upgVisible.value = true;
  }
}

/** 保存为全局默认（对没有项目级配置的项目生效） */
async function saveGlobalConfig() {
  try {
    await http().put(`${BASE}/upgrade/config?scope=global`).data(upgForm.value);
    message.success('已保存为全局默认');
  } catch (e: any) {
    toastError(e, '保存失败');
  }
}

/** 保存为当前项目的默认配置：下次打开这个项目的升级弹框就是这套值 */
async function saveProjectConfig() {
  const item = upgProject.value;
  if (!item) return;
  try {
    await http()
      .put(`${BASE}/upgrade/config?scope=project&projectId=${item.id}`)
      .data(upgForm.value);
    upgHasProjectCfg.value = true;
    message.success(`已保存为「${item.projectName}」的项目默认配置`);
  } catch (e: any) {
    toastError(e, '保存项目默认配置失败');
  }
}

async function executeUpgrade() {
  if (!upgProject.value) return;
  try {
    await http().put(`${BASE}/upgrade/config?scope=last`).data(upgForm.value);
    const res = await http()
      .post(`${BASE}/project/${upgProject.value.id}/upgrade/run`)
      .data(upgForm.value);
    const taskId = unwrapResult<string>(res);
    upgVisible.value = false;
    if (taskId) trackTask(taskId, upgProject.value.projectName, 'upgrade');
  } catch (e: any) {
    toastError(e, '升级触发失败');
  }
}

// ---- 实时日志（多项目并排 / 弹窗） ----
/**
 * 单个项目的日志会话：连接与缓冲都挂在这里，内嵌列与弹窗共用同一份数据。
 *
 * <p>多项目并排看日志时，每个项目各自持有自己的 SSE 订阅与缓冲，
 * 关掉一个不会影响别的项目。日志行由发布管理全局 SSE 定向推送，
 * 页面内不再轮询后端。</p>
 */
interface LogSession {
  projectId: number;
  projectName: string;
  /** 日志来源（项目配置的 logPath；目录时由服务端取最新文件） */
  source: string;
  lines: string[];
  notice: string;
  pushOffline: boolean;
  /** 内嵌列自动滚动（由 ProjectLogColumn 的 v-model:auto-scroll 维护） */
  autoScroll: boolean;
  /** 弹窗形态自动滚动 */
  popupAutoScroll: boolean;
  /** 是否在弹窗中放大展示 */
  popupVisible: boolean;
  /** 日志来源：sse=实时推送；snapshot=打开时的一次性尾部快照 */
  mode: 'snapshot' | 'sse';
  sessionId: string | null;
  unsub: (() => void) | null;
  stopped: boolean;
}

/** 单个会话最多保留的日志行数，避免长时间挂机把内存撑爆 */
const LOG_MAX_LINES = 2000;

/** 实时通道断开时的提示文案（重连成功后按它判断是否需要清除） */
const LOG_DISCONNECT_NOTICE = '实时推送已断开，正在重连…（断线期间的行可能缺失，可重新打开该页签补齐）';

/** 已打开的日志会话：默认在项目管理下方多列展示，可单独弹窗放大 */
const logSessions = ref<LogSession[]>([]);

function logPushLine(session: LogSession, line: string) {
  session.lines.push(line);
  if (session.lines.length > LOG_MAX_LINES) {
    session.lines.splice(0, session.lines.length - LOG_MAX_LINES);
  }
}

function findLogSession(projectId: number): LogSession | undefined {
  return logSessions.value.find((s) => s.projectId === projectId);
}

/**
 * 拉一次某个会话的日志尾部快照（只在打开日志时调用，不参与轮询）。
 *
 * @param session 日志会话
 */
async function loadLogTail(session: LogSession) {
  if (session.stopped) return;
  try {
    const res = await http().get(`${BASE}/project/${session.projectId}/log`);
    const text = unwrapResult<string>(res);
    if (typeof text !== 'string') return;
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    if (lines.length && lines[lines.length - 1] === '') lines.pop();
    session.lines = lines.length > LOG_MAX_LINES ? lines.slice(-LOG_MAX_LINES) : lines;
  } catch {
    // 静默失败：尾部快照只是打开瞬间的内容，报错会掩盖真正的问题
  }
}

/**
 * 启动（或重连后补启动）某个会话的服务端日志跟随。
 *
 * <p>服务端按 clientId 定向推送，因此必须在 SSE 已连接时才能启动，
 * 否则推出来的行没人接收。</p>
 *
 * @param session 日志会话
 */
async function ensureLogStream(session: LogSession) {
  if (session.stopped || session.sessionId) return;
  if (!releaseSse.online) {
    session.notice = '等待实时通道连接…';
    return;
  }
  try {
    const res = await http().post(
      `${BASE}/project/${session.projectId}/log/start?clientId=${encodeURIComponent(releaseSse.getClientId())}`,
    );
    if (!session.stopped) {
      session.sessionId = unwrapResult<string>(res);
      session.notice = '';
    }
  } catch (e) {
    session.notice = errorText(e, '无法启动实时日志采集');
  }
}

/**
 * 打开一个项目的实时日志（已打开则复用，不重复订阅）。
 *
 * <p>先拉一次尾部快照、再启动服务端跟随：打开瞬间就能看到内容，
 * 之后的行由全局 SSE 实时推送。</p>
 *
 * @param item 项目
 * @returns 日志会话
 */
async function startLogSession(item: Project): Promise<LogSession> {
  const existing = findLogSession(item.id);
  if (existing) return existing;
  const session: LogSession = {
    projectId: item.id,
    projectName: item.projectName,
    source: String(item.logPath || ''),
    lines: [],
    notice: '',
    pushOffline: !releaseSse.online,
    autoScroll: true,
    popupAutoScroll: true,
    popupVisible: false,
    mode: 'snapshot',
    sessionId: null,
    unsub: null,
    stopped: false,
  };
  logSessions.value.push(session);
  // push 之后必须用数组里的响应式代理：继续改原始对象不会触发模板更新（内嵌列不刷新）
  const tracked = logSessions.value[logSessions.value.length - 1] ?? session;

  tracked.unsub = releaseSse.onProjectLog((frame) => {
    if (tracked.stopped) return;
    // sessionId 要等 start 接口返回，返回前先按 projectId 收帧，避免丢掉开头几行
    const matched = tracked.sessionId
      ? frame.sessionId === tracked.sessionId
      : String(frame.projectId) === String(tracked.projectId);
    if (!matched) return;
    if (frame.status === 'LINE' && typeof frame.line === 'string') {
      if (tracked.mode !== 'sse') {
        // tail -n N -F 连接时会先重放最近 N 行，清掉快照内容避免重复
        tracked.mode = 'sse';
        tracked.lines = [];
        tracked.notice = '';
      }
      logPushLine(tracked, frame.line);
    } else if (frame.status === 'ERROR') {
      tracked.notice = frame.message || '日志采集失败';
    } else if (frame.status === 'STARTED') {
      tracked.notice = '';
    }
  });

  // 打开瞬间先给一份尾部快照，推送连上后第一行到达时会清空重放
  void loadLogTail(tracked);
  void ensureLogStream(tracked);
  return tracked;
}

/** 「实时日志」入口（More 菜单）：在右侧工作区打开页签 */
function handleViewLog(item: Project) {
  void openLogTab(item);
}

/** 在弹窗中放大某个会话（内嵌列保留） */
function openLogPopup(session: LogSession) {
  session.popupVisible = true;
}

/** 停掉一个会话的连接（不动列表，关闭前回收资源） */
function stopLogSession(session: LogSession) {
  session.stopped = true;
  const sessionId = session.sessionId;
  if (sessionId) {
    http().post(`${BASE}/project/log/${sessionId}/stop`).catch(() => {});
    session.sessionId = null;
  }
  session.unsub?.();
  session.unsub = null;
  session.mode = 'snapshot';
}

/** 关闭一列：停连接并从列表移除（对应弹窗一并关闭） */
function closeLogSession(session: LogSession) {
  stopLogSession(session);
  session.popupVisible = false;
  const index = logSessions.value.indexOf(session);
  if (index >= 0) logSessions.value.splice(index, 1);
}

/** 页面卸载时统一清理所有会话 */
function cleanupAllLogSessions() {
  logSessions.value.slice().forEach((session) => stopLogSession(session));
  logSessions.value = [];
}

// ---- 右侧多标签工作区 ----
/** 当前激活的日志页签 name（ReTabs v-model，空串表示没有激活页签） */
const activeWorkspaceTab = ref('');

/** 页签列表：系统信息 / 文件管理 / 系统日志三类，name = `kind:${projectId}` */
const workspaceTabs = computed<ReTabsItem[]>(() => {
  const tabs: ReTabsItem[] = [];
  // 系统信息（左键单击）
  for (const id of infoTabs.value) {
    const item = list.value.find((p) => p.id === id);
    if (!item) continue;
    tabs.push({
      name: `info:${id}`,
      label: item.projectName,
      hint: '系统信息',
      icon: 'InfoFilled',
      closable: true,
      status: statusKeyOfLog({ projectId: id }),
    });
  }
  // 文件管理（右键）
  for (const f of filesTabs.value) {
    tabs.push({
      name: `files:${f.projectId}`,
      label: f.projectName,
      hint: '文件管理',
      icon: 'FolderOpened',
      closable: true,
      status: statusKeyOfLog({ projectId: f.projectId }),
    });
  }
  // 系统日志（双击 / 右键）
  for (const s of logSessions.value) {
    tabs.push({
      name: `log:${s.projectId}`,
      label: s.projectName,
      hint: '系统日志',
      icon: 'Tickets',
      closable: true,
      status: statusKeyOfLog(s),
    });
  }
  return tabs;
});

/** `info:` 页签对应的项目 */
function infoProjectOf(name: string): Project | null {
  if (!name.startsWith('info:')) return null;
  const id = Number(name.slice(5));
  return list.value.find((p) => p.id === id) ?? null;
}

/** `files:` 页签对应的项目与初始目录 */
function filesTabOf(name: string): { initPath: string } | null {
  if (!name.startsWith('files:')) return null;
  const id = Number(name.slice(6));
  const f = filesTabs.value.find((x) => x.projectId === id);
  return f ? { initPath: f.initPath } : null;
}

/** 日志页签状态点：运行中=绿 / 已停止=灰 / 推送离线=红 */
function statusKeyOfLog(s: { projectId: number }): 'online' | 'offline' | 'alarm' {
  const item = list.value.find((p) => p.id === s.projectId);
  if (!item) return 'offline';
  if (statusKey(item) !== 'running') return 'offline';
  const session = findLogSession(item.id);
  return session?.pushOffline ? 'alarm' : 'online';
}

/** 打开（或复用）某个项目的实时日志页签 */
async function openLogTab(item: Project) {
  const session = await startLogSession(item);
  activeWorkspaceTab.value = `log:${session.projectId}`;
}

/** 关闭一个页签：按类型清资源（日志停连接、信息/文件移除记录），active 兜底切到相邻 */
function closeWorkspaceTab(name: string) {
  if (name.startsWith('log:')) {
    const session = logSessions.value.find((s) => `log:${s.projectId}` === name);
    if (session) closeLogSession(session);
  } else if (name.startsWith('info:')) {
    const id = Number(name.slice(5));
    infoTabs.value = infoTabs.value.filter((x) => x !== id);
  } else if (name.startsWith('files:')) {
    const id = Number(name.slice(6));
    filesTabs.value = filesTabs.value.filter((x) => x.projectId !== id);
  }
  const rest = workspaceTabs.value.filter((t) => t.name !== name);
  if (activeWorkspaceTab.value === name) {
    activeWorkspaceTab.value = rest[rest.length - 1]?.name ?? '';
  }
}

/** 关闭全部页签 */
function closeAllWorkspaceTabs() {
  logSessions.value.slice().forEach((session) => closeLogSession(session));
  infoTabs.value = [];
  filesTabs.value = [];
  activeWorkspaceTab.value = '';
}

/** 文件管理页签的重新挂载代次：刷新即换 key，按初始目录重新加载 */
const filesReloadSeq = reactive<Record<number, number>>({});

/** 页签右键菜单：刷新与关闭类命令 */
const workspaceTabMenu = computed<ReTabsContextItem[]>(() => {
  const tabs = workspaceTabs.value;
  const idx = tabs.findIndex((t) => t.name === activeWorkspaceTab.value);
  const hasRight = idx >= 0 && idx < tabs.length - 1;
  return [
    { key: 'refresh', label: '刷新当前页签', icon: 'RefreshRight' },
    { key: 'close', label: '关闭当前页签', icon: 'Close', divided: true },
    { key: 'close-others', label: '关闭其它页签', icon: 'CircleClose', disabled: tabs.length <= 1 },
    { key: 'close-right', label: '关闭右侧页签', icon: 'DArrowRight', disabled: !hasRight },
    { key: 'close-all', label: '关闭全部页签', icon: 'Delete', danger: true, divided: true },
  ];
});

/**
 * 刷新一个页签：日志重连、系统信息重新探测、文件管理重新挂载。
 *
 * @param name 页签 name（`kind:projectId`）
 */
function refreshWorkspaceTab(name: string) {
  const id = Number(name.slice(name.indexOf(':') + 1));
  const item = list.value.find((p) => p.id === id);
  if (name.startsWith('log:')) {
    const session = logSessions.value.find((s) => `log:${s.projectId}` === name);
    if (!item || !session) return;
    // 重开一次会话：停掉旧跟随，再按打开时的口径拉尾部快照并重新订阅
    closeLogSession(session);
    void startLogSession(item);
    return;
  }
  if (name.startsWith('info:')) {
    if (!item) return;
    delete endpointCache[item.id];
    void ensureEndpoint(item);
    return;
  }
  if (name.startsWith('files:')) {
    filesReloadSeq[id] = (filesReloadSeq[id] ?? 0) + 1;
  }
}

/**
 * 页签右键命令分发。
 *
 * @param payload.key 命令标识
 * @param payload.tab 触发菜单的页签
 */
function onWorkspaceTabCommand(payload: { key: string; tab: ReTabsItem }) {
  const name = payload.tab.name;
  const tabs = workspaceTabs.value;
  const idx = tabs.findIndex((t) => t.name === name);
  switch (payload.key) {
    case 'refresh':
      refreshWorkspaceTab(name);
      break;
    case 'close':
      closeWorkspaceTab(name);
      break;
    case 'close-others':
      tabs.filter((t) => t.name !== name).forEach((t) => closeWorkspaceTab(t.name));
      activeWorkspaceTab.value = name;
      break;
    case 'close-right':
      if (idx >= 0) tabs.slice(idx + 1).forEach((t) => closeWorkspaceTab(t.name));
      activeWorkspaceTab.value = name;
      break;
    case 'close-all':
      closeAllWorkspaceTabs();
      break;
  }
}

/** 关闭页签后 ReTabs 只回传 update:modelValue（active），父级必须自己兜底修正 */
watch(workspaceTabs, (tabs) => {
  if (tabs.length && !tabs.some((t) => t.name === activeWorkspaceTab.value)) {
    activeWorkspaceTab.value = tabs[tabs.length - 1]!.name;
  } else if (!tabs.length && activeWorkspaceTab.value) {
    activeWorkspaceTab.value = '';
  }
});

/** 右面板要展示的项目：优先激活页签对应项目，其次左侧选中的项目 */
const metricsProject = computed<Project | null>(() => {
  const active = workspaceTabs.value.find((t) => t.name === activeWorkspaceTab.value);
  if (active) {
    const pid = Number(active.name.replace(/^(info|files|log):/, ''));
    return list.value.find((p) => p.id === pid) ?? null;
  }
  return selectedProject.value;
});

/** 底部指标条要展示的 Actuator 探测结果（未探测到时为空） */
const metricsEndpoint = computed<EndpointProbe | null>(() => {
  const item = metricsProject.value;
  if (!item) return null;
  return endpointCache[item.id] ?? null;
});

// 激活项目变化时做一次静默探测（watch 定义在 selectedProject 之后，避免 setup 阶段 TDZ）

const logSessionByTab = computed(() => {
  const map = new Map<string, LogSession>();
  logSessions.value.forEach((s) => map.set(`log:${s.projectId}`, s));
  return map;
});

// ---- 左侧 rail：折叠 / 分组 ----
/** 左栏是否折叠成竖条（本地持久化） */
const railCollapsed = ref(localStorage.getItem('projects-rail-collapsed') === '1');
/** 左栏宽度偏好（拖拽手柄改的就是它，折叠时仍保留，展开后恢复） */
const RAIL_WIDTH_KEY = 'projects.rail.width.v1';
const railWidth = ref(readRailWidth(RAIL_WIDTH_KEY, 268));
function toggleRail() {
  railCollapsed.value = !railCollapsed.value;
  localStorage.setItem('projects-rail-collapsed', railCollapsed.value ? '1' : '0');
}

/** 当前折叠的状态分组（默认全展开） */
const collapsedGroups = ref<Set<StatusKey>>(new Set());
function toggleGroup(key: StatusKey) {
  const next = new Set(collapsedGroups.value);
  if (next.has(key)) next.delete(key); else next.add(key);
  collapsedGroups.value = next;
}

/** 左侧当前选中的项目（右键菜单 / 底部指标条兜底） */
const selectedProject = ref<Project | null>(null);

// 激活项目变化时静默探测一次；放在 selectedProject 之后，避免 setup 阶段 computed 踩 TDZ
watch(metricsProject, (item) => {
  if (item && item.enabled !== false && item.javaProcess && statusKey(item) === 'running') {
    ensureEndpoint(item);
  }
});

/** 按 STATUS_GROUPS 顺序分桶：全部组都展示（含空组，方便看到底下还有哪些状态） */
const groupedProjects = computed(() =>
  STATUS_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    items: visibleList.value.filter((i) => statusKey(i) === g.key),
  })),
);

// ---- 复制项目到其他服务器 ----
interface ReleaseOption {
  id: number;
  releaseName: string;
  hostIp?: string;
  hostName?: string;
}

const copyDialogVisible = ref(false);
const copySource = ref<Project | null>(null);
const copyTargets = ref<number[]>([]);
const copyReleases = ref<ReleaseOption[]>([]);
const copyLoading = ref(false);
const copySubmitting = ref(false);

/** 打开复制对话框：列出除当前发布外的所有服务器 */
async function openCopyDialog(item: Project) {
  copySource.value = item;
  copyTargets.value = [];
  copyReleases.value = [];
  copyDialogVisible.value = true;
  copyLoading.value = true;
  try {
    const res = await http().get(`${BASE}/list`);
    const rows = unwrapResult<ReleaseOption[]>(res) || [];
    copyReleases.value = rows.filter((r) => r.id !== releaseId.value);
  } catch (e: any) {
    toastError(e, '加载服务器列表失败');
  } finally {
    copyLoading.value = false;
  }
}

async function submitCopy() {
  if (!copySource.value) return;
  if (!copyTargets.value.length) {
    message.error('请选择目标服务器');
    return;
  }
  copySubmitting.value = true;
  try {
    const res = await http().post(`${BASE}/project/copy`).data({
      projectIds: [copySource.value.id],
      releaseIds: copyTargets.value,
    });
    const data = unwrapResult<{ count?: number; failed?: any[] }>(res);
    const count = data?.count ?? 0;
    const failed = data?.failed?.length ?? 0;
    if (count > 0) message.success(`已复制到 ${count} 个服务器`);
    if (failed > 0) message.error(`${failed} 个目标复制失败`);
    if (count > 0) copyDialogVisible.value = false;
  } catch (e: any) {
    toastError(e, '复制失败');
  } finally {
    copySubmitting.value = false;
  }
}

// ---- Swagger / Actuator 端点探测 ----
interface EndpointProbe {
  swagger?: boolean;
  actuator?: boolean;
  port?: number;
  swaggerUrl?: string;
  swaggerApiUrl?: string;
  actuatorUrl?: string;
  health?: string;
  metricCount?: number;
  metrics?: string[];
  message?: string;
}

const endpointDialogVisible = ref(false);
const endpointProject = ref<Project | null>(null);
const endpointKind = ref<'swagger' | 'actuator'>('swagger');
const endpointLoading = ref(false);
const endpointData = ref<EndpointProbe | null>(null);
/** 每项目探测结果缓存：同一次停留内反复打开不用重复 SSH */
const endpointCache = reactive<Record<number, EndpointProbe>>({});
/** 正在探测的项目（面板显示「探测中」，也防重复请求） */
const probingIds = reactive<Record<number, boolean>>({});

/**
 * 静默探测一次，已有缓存或正在探测则跳过。
 *
 * @param item 项目
 */
async function ensureEndpoint(item: Project) {
  if (endpointCache[item.id] || probingIds[item.id]) return;
  probingIds[item.id] = true;
  try {
    await probeProject(item, true);
  } finally {
    probingIds[item.id] = false;
  }
}

async function probeProject(item: Project, silent = false): Promise<EndpointProbe | null> {
  try {
    const res = await http().get(`${BASE}/project/${item.id}/endpoints`);
    const data = unwrapResult<EndpointProbe>(res);
    if (data) endpointCache[item.id] = data;
    return data ?? null;
  } catch (e: any) {
    if (!silent) toastError(e, '端点探测失败');
    return null;
  }
}

/**
 * 打开 Swagger / Actuator 入口。
 *
 * @param item 项目
 * @param kind swagger=接口文档；actuator=运行指标
 */
async function openEndpointDialog(item: Project, kind: 'swagger' | 'actuator') {
  endpointProject.value = item;
  endpointKind.value = kind;
  endpointData.value = endpointCache[item.id] ?? null;
  endpointDialogVisible.value = true;
  endpointLoading.value = true;
  const data = await probeProject(item);
  endpointData.value = data;
  endpointLoading.value = false;
  if (data && kind === 'swagger' && !data.swagger) {
    message.warning(data.message || '该项目未探测到 Swagger，可确认是否引入 springdoc / knife4j');
  }
  if (data && kind === 'actuator' && !data.actuator) {
    message.warning(data.message || '该项目未探测到 Actuator，可确认是否暴露 /actuator 端点');
  }
}

// ---- 定时发布运行态 ----
interface ScheduleStatus {
  publishJobKey?: string;
  publishRegistered?: boolean;
  publishNextFireMs?: number;
  publishLastFireMs?: number;
  publishEnabled?: boolean;
  gitPollJobKey?: string;
  gitPollRegistered?: boolean;
  gitPollNextFireMs?: number;
  gitPollLastFireMs?: number;
  gitPollEnabled?: boolean;
}

const scheduleStatusMap = reactive<Record<number, ScheduleStatus>>({});

async function loadScheduleStatus(item: Project) {
  try {
    const res = await http().get(`${BASE}/project/${item.id}/schedule`);
    scheduleStatusMap[item.id] = unwrapResult<ScheduleStatus>(res) || {};
  } catch {
    // 运行态只做展示，失败静默，不影响编辑
  }
}

/** 时间戳格式化为「年-月-日 时:分:秒」，空值显示 — */
function fmtFireMs(ms?: number): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** 新标签页打开外部地址（Swagger / Actuator） */
function openInNewTab(url?: string) {
  if (url) window.open(url, '_blank', 'noopener');
}

// ---- 健康检测（配置检测地址 + 在目标主机上按 HTTP 200 判定） ----
interface HealthCheckResult {
  url: string;
  ok: boolean;
  statusCode: number;
  elapsedMs: number;
  checkedAt: string;
  message: string;
}

const healthVisible = ref(false);
const healthProject = ref<Project | null>(null);
const healthUrl = ref('');
const healthSaving = ref(false);
const healthChecking = ref(false);
const healthResult = ref<HealthCheckResult | null>(null);

/**
 * 打开健康检测对话框：读已保存地址，没有则预填按端口推导的建议地址。
 *
 * @param item 项目
 */
async function openHealthCheck(item: Project) {
  healthProject.value = item;
  healthResult.value = null;
  healthUrl.value = '';
  healthVisible.value = true;
  try {
    const res = await http().get(`${BASE}/project/${item.id}/health`);
    const data = unwrapResult<{ url?: string; defaultUrl?: string }>(res);
    healthUrl.value = (data?.url || data?.defaultUrl || '').trim();
  } catch (e) {
    toastError(e, '读取健康检测配置失败');
  }
}

/** 保存检测地址（不改动检测结果） */
async function saveHealthUrl() {
  const item = healthProject.value;
  if (!item) return;
  healthSaving.value = true;
  try {
    await http().post(`${BASE}/project/${item.id}/health?url=${encodeURIComponent(healthUrl.value.trim())}`);
    message.success('检测地址已保存');
  } catch (e) {
    toastError(e, '保存检测地址失败');
  } finally {
    healthSaving.value = false;
  }
}

/** 立即检测：后端会在项目所在主机上取 HTTP 状态码 */
async function runHealthCheck() {
  const item = healthProject.value;
  if (!item) return;
  healthChecking.value = true;
  healthResult.value = null;
  try {
    const res = await http().post(
      `${BASE}/project/${item.id}/health/check?url=${encodeURIComponent(healthUrl.value.trim())}`,
    );
    healthResult.value = unwrapResult<HealthCheckResult>(res);
  } catch (e) {
    toastError(e, '健康检测失败');
  } finally {
    healthChecking.value = false;
  }
}

function publishStatusText(st?: ScheduleStatus): string {
  if (!st) return '未加载';
  if (!st.publishRegistered) return '未登记';
  if (st.publishEnabled === false) return '已停用';
  return `下次 ${fmtFireMs(st.publishNextFireMs)}`;
}

function gitPollStatusText(st?: ScheduleStatus): string {
  if (!st) return '未加载';
  if (!st.gitPollRegistered) return '未登记';
  if (st.gitPollEnabled === false) return '已停用';
  return `下次 ${fmtFireMs(st.gitPollNextFireMs)}`;
}

// ---- Arthas 诊断 ----
const arthasDialogVisible = ref(false);
const arthasProject = ref<Project | null>(null);
const arthasRunning = ref(false);
const arthasPid = ref('');
const arthasConsoleOutput = ref('');
const arthasAttaching = ref(false);
const arthasDetaching = ref(false);
const arthasExecLoading = ref(false);
const arthasCommand = ref('');
const arthasTerminalEl = ref<HTMLElement>();
const arthasQuickCommands = ['dashboard', 'thread', 'jvm', 'sysprop', 'sc *Service*', 'jad --source-only', 'trace', 'watch'];
let arthasPollTimer: number | null = null;

watch(arthasDialogVisible, (visible) => {
  if (!visible) stopArthasPoll();
});

function isJavaProject(item: Project): boolean {
  return JAVA_APM_TYPES.includes(item.projectType);
}

async function openArthasDialog(item: Project) {
  arthasProject.value = item;
  arthasConsoleOutput.value = '';
  arthasCommand.value = '';
  arthasDialogVisible.value = true;
  await loadArthasStatus();
  await loadArthasConsole();
  startArthasPoll();
}

function closeArthasDialog() {
  arthasDialogVisible.value = false;
  stopArthasPoll();
}

async function loadArthasStatus() {
  if (!arthasProject.value) return;
  try {
    const res = await http().get(`/ms/server/arthas/project/${arthasProject.value.id}/status`);
    const data = unwrapResult<any>(res);
    if (data) {
      arthasRunning.value = !!data.arthasRunning;
      arthasPid.value = data.jvmPid || '';
    }
  } catch (e) {
    // 静默失败
  }
}

async function doArthasAttach() {
  if (!arthasProject.value) return;
  arthasAttaching.value = true;
  try {
    const res = await http().post(`/ms/server/arthas/project/${arthasProject.value.id}/attach`).query({
      telnetPort: 3658,
    });
    message.success(unwrapResult<string>(res));
    await loadArthasStatus();
    await loadArthasConsole();
  } catch (e: any) {
    // 后端会给出可操作的原因（如「arthas-boot.jar 不存在，请先上传」），
    // 只弹「Attach 失败」会让用户无从下手
    message.error(e?.message || 'Attach 失败');
  } finally {
    arthasAttaching.value = false;
  }
}

async function doArthasDetach() {
  if (!arthasProject.value) return;
  arthasDetaching.value = true;
  try {
    await http().post(`/ms/server/arthas/project/${arthasProject.value.id}/detach`);
    message.success('Arthas 已卸载');
    await loadArthasStatus();
  } catch (e) {
    message.error('卸载失败');
  } finally {
    arthasDetaching.value = false;
  }
}

async function loadArthasConsole() {
  if (!arthasProject.value) return;
  try {
    const res = await http().get(`/ms/server/arthas/project/${arthasProject.value.id}/console`).query({ lines: 100 });
    const data = unwrapResult<string>(res);
    arthasConsoleOutput.value = data || '';
    await nextTick();
    scrollArthasTerminal();
  } catch (e) {
    arthasConsoleOutput.value += '\n[获取输出失败]\n';
  }
}

async function doArthasExec() {
  if (!arthasProject.value || !arthasCommand.value.trim()) return;
  arthasExecLoading.value = true;
  const cmd = arthasCommand.value.trim();
  arthasConsoleOutput.value += `\n$ ${cmd}\n`;
  try {
    const res = await http().post(`/ms/server/arthas/project/${arthasProject.value.id}/exec`).query({ command: cmd });
    const data = unwrapResult<string>(res);
    arthasConsoleOutput.value += data + '\n';
  } catch (e) {
    arthasConsoleOutput.value += `[错误: 执行失败]\n`;
  } finally {
    arthasExecLoading.value = false;
    arthasCommand.value = '';
    await nextTick();
    scrollArthasTerminal();
  }
}

async function execArthasQuick(cmd: string) {
  arthasCommand.value = cmd;
  await doArthasExec();
}

function clearArthasConsole() {
  arthasConsoleOutput.value = '';
}

function scrollArthasTerminal() {
  if (arthasTerminalEl.value) {
    arthasTerminalEl.value.scrollTop = arthasTerminalEl.value.scrollHeight;
  }
}

function startArthasPoll() {
  stopArthasPoll();
  arthasPollTimer = window.setInterval(() => {
    if (arthasRunning.value) {
      loadArthasConsole();
    }
  }, 5000);
}

function stopArthasPoll() {
  if (arthasPollTimer) {
    clearInterval(arthasPollTimer);
    arthasPollTimer = null;
  }
}

async function handleDelete(row: Project) {
  try {
    await ElMessageBox.confirm(`确定删除项目「${row.projectName}」吗？`, '提示', { type: 'warning' });
    await http().delete(`${BASE}/project/${row.id}`);
    message.success('删除成功');
    loadList();
  } catch (e) {
    if (e !== 'cancel') message.error('删除失败');
  }
}

// ---- 备份记录（编辑页 backups tab） ----
interface BackupRow { name: string; time: number | null; size: number | null; kind: string; }
const backupRows = ref<BackupRow[]>([]);
const backupLoading = ref(false);
const backupActionLoading = ref(false);
/** 备份列表加载失败的原因（页内常驻显示，不随 toast 消失） */
const backupError = ref('');

function formatBackupTime(ms: number | null) {
  if (ms == null) return '时间未知';
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '时间未知';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function loadBackups() {
  if (editingId.value == null) { backupRows.value = []; return; }
  backupLoading.value = true;
  backupError.value = '';
  try {
    const res = await http().get(`${BASE}/project/${editingId.value}/backups`);
    backupRows.value = unwrapResult<BackupRow[]>(res) || [];
  } catch (e: any) {
    // 失败原因同时进 toast 与页内常驻提示：toast 会自己消失，
    // 「主机未开 SSH」这种要用户去改配置的原因必须留在页面上。
    backupError.value = errorText(e, '加载备份记录失败');
    toastError(e, '加载备份记录失败');
  } finally {
    backupLoading.value = false;
  }
}

async function handleBackupNow() {
  if (editingId.value == null) return;
  backupActionLoading.value = true;
  try {
    const res = await http().post(`${BASE}/project/${editingId.value}/backup`);
    const taskId = unwrapResult<string>(res);
    if (taskId) {
      const task = trackTask(taskId, form.value.projectName, 'backup');
      const stopWatch = watch(() => task.finished, (fin) => {
        if (!fin) return;
        stopWatch();
        loadBackups();
        if (!task.success) openFailureDetail(task, list.value.find((p) => p.id === editingId.value) ?? null);
      });
    } else {
      message.error('备份触发失败：项目有操作正在进行，请稍后再试');
    }
  } catch (e: any) {
    backupError.value = errorText(e, '备份失败');
    toastError(e, '备份失败');
  } finally {
    backupActionLoading.value = false;
  }
}

async function handleRollbackTo(b: BackupRow) {
  if (editingId.value == null) return;
  try {
    await ElMessageBox.confirm(`确定用备份「${b.name}」回滚项目吗？当前未保存的状态将被覆盖。`, '回滚确认', { type: 'warning' });
  } catch { return; }
  try {
    const res = await http().post(`${BASE}/project/${editingId.value}/rollback?backup=${encodeURIComponent(b.name)}`);
    const taskId = unwrapResult<string>(res);
    if (taskId) {
      const task = trackTask(taskId, form.value.projectName, 'rollback');
      const stopWatch = watch(() => task.finished, (fin) => {
        if (!fin) return;
        stopWatch();
        loadBackups();
        loadList();
        if (!task.success) openFailureDetail(task, list.value.find((p) => p.id === editingId.value) ?? null);
      });
    } else {
      message.error('回滚触发失败：项目有操作正在进行，请稍后再试');
    }
  } catch (e: any) {
    backupError.value = errorText(e, '回滚失败');
    toastError(e, '回滚失败');
  }
}

// 切到备份 / 定时发布 tab 时加载（事件驱动，非轮询）
watch(activeTab, (tab) => {
  if (tab === 'backups' && editingId.value != null) loadBackups();
  if (tab === 'schedule' && editingId.value != null) {
    const item = list.value.find((p) => p.id === editingId.value);
    if (item) loadScheduleStatus(item);
  }
});

// 任务结束经全局 SSE 驱动列表刷新（不再轮询）
const unsubTaskRefresh = releaseSse.onProjectTask((frame) => {
  if (frame.phase === 'COMPLETE' || frame.phase === 'ERROR') {
    loadList();
  }
});

// 全局时间轮采集的 Actuator 结果：直接写入缓存，底部指标条随当前项目刷新
const unsubProjectEndpoints = releaseSse.onProjectEndpoints((push) => {
  const pid = Number(push.projectId);
  if (!Number.isFinite(pid)) return;
  endpointCache[pid] = {
    swagger: push.swagger,
    actuator: push.actuator,
    port: push.port,
    swaggerUrl: push.swaggerUrl,
    swaggerApiUrl: push.swaggerApiUrl,
    actuatorUrl: push.actuatorUrl,
    health: push.health,
    metricCount: push.metricCount,
    metrics: push.metrics,
    message: push.message,
  };
});

// 全局 SSE 连接状态：实时日志面板据此显示「推送离线」提示，重连后补启动未生效的日志会话
const unsubReleaseStatus = releaseSse.onStatus((status) => {
  const online = status === 'connected';
  for (const session of logSessions.value) {
    if (session.stopped) continue;
    session.pushOffline = !online;
    if (online) {
      if (session.notice === LOG_DISCONNECT_NOTICE) session.notice = '';
      // 断线前没启动成功的日志跟随，重连后补上
      void ensureLogStream(session);
    } else {
      session.notice = LOG_DISCONNECT_NOTICE;
    }
  }
});

function goBack() {
  router.push('/release');
}

onMounted(() => {
  // 发布管理全局 SSE：任务进度 / 实时日志 / 操作日志都走这一条连接
  releaseSse.open();
  loadList();
  loadHostOs();
  nowTs.value = Date.now();
  runtimeTimer = setInterval(() => { nowTs.value = Date.now(); }, 1000);
  window.addEventListener('keydown', onCtxKeydown);
});

onBeforeUnmount(() => {
  cleanupAllLogSessions();
  unsubTaskRefresh?.();
  unsubProjectEndpoints?.();
  unsubReleaseStatus?.();
  releaseSse.close();
  closeContextMenu();
  window.removeEventListener('keydown', onCtxKeydown);
  stopArthasPoll();
  if (runtimeTimer) { clearInterval(runtimeTimer); runtimeTimer = null; }
});
</script>

<style scoped>
/* ===== 页面骨架 ===== */
.pj {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* 左右两栏：左侧可拖拽定宽，右侧吃掉剩余，与主机资产页同构 */
.pj-body {
  display: flex;
  flex: 1 1 auto;
  /* 间距交给分栏手柄本身，避免 gap + 手柄叠出一段空档 */
  gap: 0;
  min-height: 0;
}
/* ===== 左侧：项目列表（rail 分组列表） ===== */
.pj-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  /* 宽度由分栏手柄写入 --pj-rail-width（可拖拽，存本地偏好） */
  width: var(--pj-rail-width, 268px);
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* 折叠态：268px → 44px，中间工作区净增 224px。只留计数、运行/停止点
   和底部展开按钮，不保留任何需要横向空间的内容。 */
.pj-rail.is-collapsed {
  width: 44px;
}

.rail-strip {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 10px;
}

.rail-strip__count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 0;
  font-size: 10px;
  line-height: 1.1;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  background: transparent;
  border: none;
  cursor: pointer;
}

.rail-strip__count b {
  font-size: 13px;
  color: var(--el-color-primary);
}

.rail-strip__dots {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rail-strip__dots i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.rail-strip__dots i.is-on {
  background: var(--el-color-success);
}

.rail-strip__dots i.is-off {
  background: var(--el-text-color-placeholder);
}

.rail-strip__gap {
  flex: 1;
}

.rail-strip__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.rail-strip__toggle:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

/* ===== 右侧：多标签日志工作区 ===== */
.pj-workspace {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

/* ===== 头部：标题 + 计数 + 刷新/新增 + 搜索 + 状态筛选 ===== */
.rail-head {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 10px;
  padding: 12px 12px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.rail-head__row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rail-head__title {
  flex: none;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--el-text-color-primary);
}

.rail-head__count {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--el-color-primary);
}

.rail-head__count i {
  font-style: normal;
  font-weight: 400;
  color: var(--el-text-color-placeholder);
}

.rail-head__gap {
  flex: 1;
}

.rail-head__search {
  width: 100%;
}

/* 状态筛选：胶囊分段，计数跟在文案后面 */
.rail-filters {
  display: flex;
  gap: 3px;
  padding: 3px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}

/* 刷新/新增小工具按钮：和标题同高，方形 */
.rail-tool {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  transition: background 0.15s ease, color 0.15s ease;
}

.rail-tool:hover:not(:disabled) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.rail-tool:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.rail-tool.is-primary {
  color: #fff;
  background: var(--el-color-primary);
}

.rail-tool.is-primary:hover {
  color: #fff;
  background: var(--el-color-primary-light-3);
}

.rail-chip {
  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  height: 24px;
  padding: 0 3px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  transition: background 0.15s ease, color 0.15s ease;
}

.rail-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.rail-chip b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

.rail-chip:hover {
  color: var(--el-text-color-primary);
}

.rail-chip.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.rail-chip.is-active b {
  color: var(--el-color-primary);
}

/* ===== 分组列表：唯一可滚动区 ===== */
.rail-list {
  flex: 1 1 auto;
  min-height: 0;
  padding: 6px;
}

.rail-group {
  margin-bottom: 2px;
}

.rail-group__head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 28px;
  padding: 0 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
}

.rail-group__head:hover {
  background: var(--el-fill-color-light);
}

.rail-group__dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.rail-group__dot.is-running { background: var(--el-color-success); }
.rail-group__dot.is-stopped { background: var(--el-text-color-placeholder); }
.rail-group__dot.is-ready { background: var(--el-color-info, #3b82f6); }
.rail-group__dot.is-disabled { background: var(--el-color-warning); }

.rail-group__name {
  flex: 1;
  overflow: hidden;
  font-weight: 600;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-group__stat {
  flex: none;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder);
}

.rail-group__stat b {
  color: var(--el-color-success);
}

/* ===== 项目行：类型图标 + 名称 + 状态 + 运行指标 ===== */
.rail-host {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid transparent;
  transition: background 0.12s ease, border-color 0.12s ease;
}

.rail-host:hover {
  background: var(--el-fill-color-light);
}

.rail-host.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.rail-host.is-disabled .rail-host__name {
  color: var(--el-text-color-secondary);
}

.rail-host.is-dragover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 类型图标块：与发布管理卡片同构的色调 */
.rail-host__os {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 15px;
  color: #fff;
  line-height: 1;
  border-radius: var(--el-radius-md, 8px);
  background: linear-gradient(150deg, #64748b, #475569);
  flex-shrink: 0;
}

.rail-host__os.tone-springboot { background: linear-gradient(150deg, #3b82f6, #2563eb); }
.rail-host__os.tone-fatjar { background: linear-gradient(150deg, #6366f1, #4f46e5); }
.rail-host__os.tone-git { background: linear-gradient(150deg, #f97316, #ea580c); }
.rail-host__os.tone-separated { background: linear-gradient(150deg, #8b5cf6, #7c3aed); }
.rail-host__os.tone-model { background: linear-gradient(150deg, #0ea5e9, #0284c7); }
.rail-host__os.tone-static { background: linear-gradient(150deg, #10b981, #059669); }
.rail-host__os.tone-nginx { background: linear-gradient(150deg, #14b8a6, #0d9488); }
.rail-host__os:is(.stopped, .disabled, .ready) {
  filter: grayscale(0.55) brightness(0.98);
}
.rail-host__os :deep(svg) {
  display: block;
}

.rail-host__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.rail-host__name {
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-host__addr {
  overflow: hidden;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rail-host__right {
  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
}

.rail-host__pid,
.rail-host__uptime {
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.rail-host__dot {
  width: 7px;
  height: 7px;
  flex: none;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.rail-host__dot.is-running {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent);
}

.rail-host__dot.is-ready {
  background: var(--el-color-info, #3b82f6);
}

.rail-host__dot.is-disabled {
  background: var(--el-color-warning);
}

/* 行内操作：悬停浮出，不占常态宽度 */
.rail-host__ops {
  position: absolute;
  top: 50%;
  right: 6px;
  display: flex;
  gap: 2px;
  padding: 2px;
  opacity: 0;
  pointer-events: none;
  background: color-mix(in srgb, var(--el-bg-color) 92%, transparent);
  border-radius: var(--el-radius-sm, 4px);
  transform: translateY(-50%);
  transition: opacity 0.12s ease;
  z-index: 2;
}

.rail-host:hover .rail-host__ops,
.rail-host:focus-within .rail-host__ops {
  opacity: 1;
  pointer-events: auto;
}

.rail-host__ops button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: var(--el-radius-sm, 4px);
}

.rail-host__ops button:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 空态 */
.rail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 16px;
  font-size: 12.5px;
  text-align: center;
  color: var(--el-text-color-placeholder);
}

/* 底部：状态小结 + 收起按钮 */
.rail-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 8px 8px 12px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  border-top: 1px solid var(--el-border-color-lighter);
}

.rail-foot__row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.rail-foot__sum {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-variant-numeric: tabular-nums;
}

.rail-foot__sum i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.rail-foot__sum i.is-on {
  background: var(--el-color-success);
}

.rail-foot__sum i.is-off {
  background: var(--el-text-color-placeholder);
}

/* 收起按钮：贴左栏右下角。收起后这一整列变成 44px 竖条，
   展开按钮落在竖条底部（即「右侧下方」），位置保持一致不会跳。 */
.rail-foot__fold {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: auto;
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.rail-foot__fold:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

/* ===== 右侧工作区：空白态 ===== */
.pj-workspace-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 32px 16px;
  color: var(--el-text-color-placeholder);
  font-size: 12.5px;
  text-align: center;
}

.pj-workspace-empty-ic {
  font-size: 24px;
  line-height: 1;
  margin-bottom: 4px;
  opacity: 0.6;
  display: flex;
}

.pj-workspace-empty-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.pj-workspace-empty-sub {
  max-width: 400px;
  line-height: 1.6;
}

/* ===== 底部选中项目指标条 ===== */
.pj-metrics-bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 6px 12px;
  font-size: 11.5px;
  color: var(--text-secondary);
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  white-space: nowrap;
}

.pj-metrics-name {
  flex: none;
  max-width: 180px;
  font-weight: 600;
  font-size: 12.5px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
}

.pj-metrics-type {
  flex: none;
  margin-left: auto;
  padding: 1px 8px;
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-fill-secondary);
  border-radius: 999px;
}

.pj-metrics-chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 4px;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 11px;
}

.pj-metrics-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pj-metrics-chip.is-running {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-success) 30%, transparent);
}

.pj-metrics-chip.is-stopped {
  color: var(--text-tertiary);
  background: var(--bg-fill-secondary);
}

.pj-metrics-chip.is-ready {
  color: var(--el-color-info, #3b82f6);
  background: color-mix(in srgb, var(--el-color-info) 12%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-info) 30%, transparent);
}

.pj-metrics-chip.is-disabled {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 12%, var(--el-bg-color));
  border-color: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
}

.pj-metrics-seg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.pj-metrics-k {
  color: var(--text-tertiary);
  font-size: 10.5px;
}

.pj-metrics-v {
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.pj-metrics-sep {
  width: 1px;
  height: 10px;
  background: var(--border-secondary);
}

.pj-metrics-note {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 底部 Actuator 指标：悬停弹出指标名清单 */
.pj-metrics-seg.is-hover {
  padding: 1px 6px;
  margin: -1px -2px;
  border-radius: 6px;
  cursor: help;
}
.pj-metrics-seg.is-hover:hover {
  background: var(--bg-fill);
}
.pj-metrics-pop-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
}
.pj-metrics-pop-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 220px;
  overflow: auto;
}
.pj-metrics-pop-list span {
  padding: 2px 7px;
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-radius: 5px;
}
.pj-metrics-pop-list span.is-muted {
  font-family: inherit;
  color: var(--text-tertiary);
}

/* ===== 系统配置弹框 ===== */
.syscfg {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 4px 2px;
}
.syscfg-section {
  padding: 12px 14px;
  background: var(--bg-fill, #f7f8fa);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.syscfg-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-secondary);
}
.syscfg-row {
  display: flex;
  align-items: center;
  gap: 16px;
}
.syscfg-label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.syscfg-label b {
  font-size: 13px;
  color: var(--text-primary);
}
.syscfg-label span {
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--text-tertiary);
}
.syscfg-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--text-tertiary);
}

.pj-drop {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--brand-50) 88%, transparent);
  color: var(--brand-600);
  font-size: 12.5px;
  font-weight: 600;
  pointer-events: none;
  z-index: 3;
}

/* 窄屏：左栏占满一行，不强制并排 */
@media (max-width: 720px) {
  .pj-body { flex-direction: column; }
  /* 上下堆叠时没有左右分栏，手柄一并收起 */
  .pj-split { display: none; }
}

/* 编辑 tab */
.edit-tab {
  margin-top: 4px;
}
.tab-grid {
  padding-top: 8px;
}
.tab-form {
  max-width: 640px;
  margin: 0 auto;
}
.script-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 12px;
}
.script-autogen {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--brand-50, #f6f4ff);
  border: 1px solid var(--brand-100, #ece9ff);
  border-radius: 10px;
}
.sa-text {
  display: flex;
  align-items: center;
  gap: 11px;
}
.sa-ic {
  font-size: 24px;
  color: var(--brand-500, #6d5dfc);
}
.sa-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.sa-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* ===== 脚本模式切换 / 自动生成预览 ===== */
.script-mode {
  margin-top: 12px;
  padding: 12px 14px;
  background: var(--bg-fill, #f7f8fa);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
}
.sm-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 3px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 9px;
}
.sm-tab {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sm-tab:hover {
  color: var(--el-color-primary);
}
.sm-tab.is-active {
  color: var(--brand-600, #5a4bd9);
  background: var(--brand-50, #f6f4ff);
  font-weight: 600;
}
.sm-hint {
  margin-top: 9px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.script-auto {
  padding-top: 12px;
}
.sa-blocked {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-size: 12.5px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9, #fdf6ec);
  border: 1px dashed var(--el-color-warning-light-5);
  border-radius: 10px;
}
.sa-preview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sa-row {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
}
.sa-row-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  background: var(--bg-fill, #f7f8fa);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.sa-row-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.sa-row-tag {
  margin-left: auto;
  padding: 1px 7px;
  font-size: 11px;
  border-radius: 999px;
}
.sa-row-tag.is-linux {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.sa-row-tag.is-windows {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sa-row-code {
  margin: 0;
  padding: 10px 12px;
  max-height: 180px;
  overflow: auto;
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  line-height: 1.65;
  color: var(--text-primary, #1f2430);
  background: var(--el-bg-color);
  white-space: pre-wrap;
  word-break: break-all;
}
/* 自动模式的四条命令就地可编辑：用户改过即停止实时覆盖 */
.sa-row-edit {
  display: block;
  width: 100%;
  min-height: 62px;
  border: none;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}
.sa-row-edit:focus {
  background: var(--bg-fill, #f7f8fa);
  box-shadow: inset 0 0 0 1px var(--brand-500, #6d5dfc);
}
.sa-dirty {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 8px;
}
.sa-dirty span {
  flex: 1;
  min-width: 0;
}
.sa-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ===== 项目右键菜单 ===== */
.pj-ctx-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
}
.pj-ctx {
  position: fixed;
  z-index: 3001;
  width: 196px;
  padding: 5px;
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(15, 20, 40, 0.16);
}
.pj-ctx__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px 8px;
  margin-bottom: 3px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.pj-ctx__head span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.pj-ctx__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 9px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
}
.pj-ctx__item:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
.pj-ctx__item.is-danger {
  color: var(--el-color-danger);
}
.pj-ctx__item.is-danger:hover {
  background: var(--el-color-danger-light-9);
}
.pj-ctx__item.is-divided {
  margin-top: 5px;
  border-top: 1px solid var(--el-border-color-lighter);
  border-radius: 0 0 7px 7px;
  padding-top: 4px;
  height: 34px;
}
/* 二级菜单：悬停展开到右侧，链路追踪 / APM 等观测入口不再堆在一级 */
.pj-ctx__item.has-sub {
  position: relative;
}
.pj-ctx__arrow {
  margin-left: auto;
  opacity: 0.6;
}
.pj-ctx__sub {
  display: none;
  position: absolute;
  left: calc(100% + 6px);
  top: -5px;
  z-index: 3002;
  width: 188px;
  padding: 5px;
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  box-shadow: 0 10px 28px rgba(15, 20, 40, 0.16);
}
.pj-ctx__item.has-sub:hover > .pj-ctx__sub {
  display: block;
}
/* 菜单贴近右边缘时二级菜单向左翻，避免出屏 */
.pj-ctx.is-flip .pj-ctx__sub {
  left: auto;
  right: calc(100% + 6px);
}

/* ===== 操作失败详情 ===== */
.fail-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.fail-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fail-op {
  padding: 2px 9px;
  font-size: 12px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 999px;
}
.fail-project {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.fail-msg {
  padding: 12px 14px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9, #fef0f0);
  border: 1px solid var(--el-color-danger-light-7, #fbc4c4);
  border-radius: 9px;
  white-space: pre-wrap;
  word-break: break-word;
}
.fail-logs-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.fail-logs pre {
  margin: 0;
  padding: 10px 12px;
  max-height: 260px;
  overflow: auto;
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--text-primary, #1f2430);
  background: var(--bg-fill, #f7f8fa);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 9px;
  white-space: pre-wrap;
  word-break: break-all;
}
.fail-logs-empty {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.acfg-tip {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
  padding: 10px 13px;
  margin-bottom: 14px;
  background: var(--bg-fill, #f7f8fa);
  border-radius: 9px;
}
.acfg-tip code {
  font-family: "Cascadia Code", Consolas, monospace;
  color: var(--brand-600, #5a4bd9);
}
.vd-key-acfg {
  width: 260px;
  flex-shrink: 0;
}

/* 变量设置 tab 摘要 */
.vars-summary {
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 640px;
  margin: 0 auto;
}
.vars-block {
  display: flex;
  flex-direction: column;
}
.vars-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.vars-card:hover {
  border-color: var(--brand-500, #6d5dfc);
  background: var(--brand-50, #f6f4ff);
}
.vars-card-ic {
  font-size: 22px;
  color: var(--brand-500, #6d5dfc);
}
.vars-card-meta {
  flex: 1;
}
.vars-card-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.vars-card-count {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.vars-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  padding: 11px 14px;
  margin: 6px 4px 0;
  background: var(--bg-fill, #f7f8fa);
  border: 1px dashed var(--border-default, #e3e6ef);
  border-radius: 9px;
}
.vars-inline-empty {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.vars-chip {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  color: var(--brand-600, #5a4bd9);
  background: var(--brand-50, #f6f4ff);
  border: 1px solid var(--brand-100, #ece9ff);
  border-radius: 999px;
  max-width: 100%;
  word-break: break-all;
}

/* 变量弹窗 */
.vd-cats {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-fill, #f7f8fa);
  border-radius: 10px;
  margin: 4px 0 16px;
}
.vd-cat {
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 7px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  transition: all 0.15s;
}
.vd-cat.active {
  background: var(--bg-container, #fff);
  color: var(--brand-600, #5a4bd9);
  font-weight: 600;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(16, 24, 40, 0.06));
}
.vd-ph {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0 0 14px;
  padding: 9px 12px;
  background: var(--brand-50, #f6f4ff);
  border: 1px solid var(--brand-100, #ece9ff);
  border-radius: 9px;
}
.vd-ph-hint {
  font-size: 12px;
  color: var(--brand-600, #5a4bd9);
  margin-right: 2px;
}
.vd-ph-chip {
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 11.5px;
  color: var(--brand-600, #5a4bd9);
  background: var(--bg-container, #fff);
  border: 1px solid var(--brand-100, #ece9ff);
  border-radius: 999px;
  padding: 2px 9px;
  cursor: pointer;
  transition: all 0.15s;
}
.vd-ph-chip:hover {
  background: var(--brand-100, #ece9ff);
  border-color: var(--brand-500, #6d5dfc);
}
.vd-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}
.vd-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.vd-key {
  width: 260px;
  flex-shrink: 0;
}
.vd-val {
  flex: 1;
  min-width: 0;
}
.vd-boolean {
  flex: 1;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.vd-add {
  align-self: flex-start;
}
.vd-opt-flag {
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 12px;
}
.vd-opt-desc {
  float: right;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-left: 16px;
}

/* 系统管理 tab */
.sys-pane {
  padding-top: 14px;
  max-width: 660px;
  margin: 0 auto;
}
.sys-card {
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: 12px;
  padding: 18px;
  background: var(--bg-container, #fff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(16, 24, 40, 0.04));
}
.sys-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.sys-head-ic {
  font-size: 24px;
  color: var(--brand-500, #6d5dfc);
}
.sys-head-text {
  flex: 1;
}
.sys-card-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.sys-card-sub {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.sys-form {
  margin-bottom: 6px;
}
.sys-switches {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0 14px;
}
.sys-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: 10px;
}
.ssw-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.ssw-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top:2px;
}
.sys-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

/* 升级弹窗 */
.upg-pane {
  padding-top: 4px;
}
/* 项目级基线信息：告诉用户这些默认值来自项目本身，不是上一次的全局残留 */
.upg-baseline {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-fill);
}
.upg-base-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  line-height: 1.9;
  min-width: 0;
}
.upg-base-k {
  flex-shrink: 0;
  color: var(--text-tertiary);
}
.upg-base-v {
  color: var(--text-primary);
  font-weight: 500;
}
.upg-base-v.mono {
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  font-size: 12px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.upg-base-note {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-subtle);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.upg-base-note-ic {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--brand-500);
}
.upg-switches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 4px;
}
.upg-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}
/* 本地安装包上传区：拖拽 + 选择文件，命中后回填远端路径 */
.upg-upload {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px dashed var(--border-subtle);
  border-radius: 10px;
  background: var(--bg-fill);
  transition: border-color 0.15s ease, background 0.15s ease;
}
.upg-upload:hover {
  border-color: var(--brand-500);
}
.upg-upload.is-busy {
  opacity: 0.7;
  pointer-events: none;
}
.upg-upload-ic {
  flex-shrink: 0;
  color: var(--text-tertiary);
}
.upg-upload-body {
  min-width: 0;
  line-height: 1.5;
}
.upg-upload-title {
  font-size: 13px;
  color: var(--text-primary);
}
.upg-upload-link {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: var(--brand-500);
  cursor: pointer;
}
.upg-upload-link:hover {
  text-decoration: underline;
}
.upg-upload-sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
  word-break: break-all;
}
.upg-upload-input {
  display: none;
}

/* 表单路径输入框内的「浏览主机文件」图标：贴着输入框右侧，避免独立方按钮的撕裂感 */
.pj-path-browse {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}
.pj-path-browse:hover {
  color: var(--brand-500, #6d5dfc);
  background: var(--bg-fill);
}

/* 主机路径选择器弹框：给文件管理器一个稳定高度 */
.path-picker-body {
  height: 460px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow: hidden;
}
.path-picker-body > * {
  flex: 1;
  min-height: 0;
}
.path-picker-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-tertiary);
}

/* 日志 */
/* 备份记录 tab */
.bk-pane { display: flex; flex-direction: column; gap: 14px; }
.bk-toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  background: var(--bg-elevated, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-lg, 12px);
}
.bk-toolbar-ic { font-size: 24px; color: var(--brand-500, #6d5dfc); }
.bk-toolbar-text { flex: 1; min-width: 0; }
.bk-title { font-size: 14px; font-weight: 600; color: var(--text-primary, #1f2430); }
.bk-sub { font-size: 12px; color: var(--text-secondary, #6b7280); margin-top: 2px; }
.bk-state-tip { padding: 30px; text-align: center; color: var(--text-secondary, #6b7280); font-size: 13px; }
/* 失败态用常驻块而不是只弹 toast：原因（如主机未开 SSH）要能一直看到 */
.bk-state-tip--error {
  display: flex; align-items: flex-start; gap: 10px; text-align: left;
  padding: 16px 18px; color: var(--el-color-danger, #f56c6c); font-size: 13px;
  background: var(--el-color-danger-light-9, #fef0f0);
  border: 1px solid var(--el-color-danger-light-7, #fab6b6);
  border-radius: var(--radius-lg, 12px);
}
.bk-state-tip--error .bk-state-hint { margin-top: 4px; color: var(--text-secondary, #6b7280); font-size: 12px; }
.bk-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 44px 20px; color: var(--text-secondary, #6b7280); font-size: 13px;
  border: 1px dashed var(--border-default, #e3e6ef); border-radius: var(--radius-lg, 12px);
}
.bk-list { display: flex; flex-direction: column; gap: 8px; }
.bk-row {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 14px;
  background: var(--bg-elevated, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-md, 8px);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.bk-row:hover { border-color: var(--brand-500, #6d5dfc); box-shadow: var(--shadow-sm, 0 1px 4px rgba(0,0,0,0.06)); }
.bk-row-ic { font-size: 20px; color: var(--brand-500, #6d5dfc); }
.bk-row-main { flex: 1; min-width: 0; }
.bk-row-name { font-size: 13px; font-weight: 600; color: var(--text-primary, #1f2430); word-break: break-all; }
.bk-row-meta { font-size: 12px; color: var(--text-secondary, #6b7280); margin-top: 2px; }

/* APM 注入（高级选项）tab */
.apm-pane { display: flex; flex-direction: column; gap: 14px; max-width: 640px; }
.apm-tip {
  font-size: 12.5px; line-height: 1.6; color: var(--text-secondary, #6b7280);
  padding: 12px 14px;
  background: var(--bg-fill, #f7f8fa);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-md, 8px);
}
.apm-tip b { color: var(--text-primary, #1f2430); }
.apm-form { display: flex; flex-direction: column; gap: 4px; }
.apm-preview {
  margin: 0; padding: 10px 12px; width: 100%; box-sizing: border-box;
  font-family: "Cascadia Code", Consolas, monospace; font-size: 12px;
  color: var(--terminal-fg, #e6edf3);
  background: var(--terminal-bg, #0d1117);
  border-radius: var(--radius-md, 8px);
  white-space: pre-wrap; word-break: break-all;
  line-height: 1.6;
}

/* ---- Git 源码构建（已并入「基础信息」，随项目类型展开） ---- */
.git-tip {
  display: flex; gap: 12px; align-items: flex-start;
  font-size: 12.5px; line-height: 1.6; color: var(--text-secondary, #6b7280);
  padding: 12px 14px;
  background: var(--bg-fill, #f7f8fa);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-md, 8px);
}
.git-tip-ic { color: #2563eb; flex-shrink: 0; margin-top: 1px; }
.git-tip-title { font-weight: 600; color: var(--text-primary, #1f2430); margin-bottom: 2px; }
.git-tip-sub code {
  font-family: "Cascadia Code", Consolas, monospace;
  font-size: 11.5px;
  background: var(--bg-fill-secondary, #eef0f6);
  padding: 1px 5px;
  border-radius: 4px;
}
.git-skip-hint {
  margin-left: 10px; font-size: 12px; color: var(--text-tertiary, #9ca3af);
}
.dd-success { color: #2563eb; }

/* Arthas 诊断 */
.arthas-wrap { display: flex; flex-direction: column; gap: 12px; }
.arthas-status-bar { display: flex; align-items: center; gap: 12px; }
.arthas-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--muted);
  color: var(--muted-foreground);
}
.arthas-badge-on {
  background: var(--success);
  color: white;
}
.arthas-pid {
  font-size: 12px;
  color: var(--muted-foreground);
  font-family: 'Courier New', monospace;
}
.arthas-status-actions { margin-left: auto; display: flex; gap: 8px; }
.arthas-terminal {
  background: #1a1a2e;
  color: #00ff88;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 16px;
  height: 380px;
  overflow-y: auto;
  border-radius: 8px;
}
.arthas-terminal pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
.arthas-input-row { display: flex; gap: 8px; }
.arthas-input-row :deep(.el-input) { flex: 1; }
.arthas-quick { display: flex; flex-wrap: wrap; gap: 6px; }
.arthas-quick-cmd {
  padding: 4px 10px;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  background: var(--muted);
  color: var(--muted-foreground);
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.arthas-quick-cmd:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* ===== 上传后自动升级开关 ===== */
.up-auto {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.up-auto-hint {
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-tertiary);
}

/* ===== 复制项目到其他服务器 ===== */
.copy-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 120px;
}
.copy-tip {
  display: flex;
  gap: 8px;
  padding: 9px 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}
.copy-tip .re-icon {
  flex: none;
  margin-top: 2px;
  color: var(--brand-500);
}
.copy-empty {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ===== Swagger / Actuator 入口 ===== */
.ep-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ep-card {
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--bg-container);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ep-card.is-ok {
  border-color: rgba(47, 191, 113, 0.45);
  box-shadow: 0 0 0 1px rgba(47, 191, 113, 0.12);
}
.ep-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ep-ic {
  color: var(--brand-500);
}
.ep-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.ep-port {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
.ep-body {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ep-link {
  font-size: 12.5px;
  color: var(--brand-600, #4f46e5);
  text-decoration: none;
  word-break: break-all;
}
.ep-link:hover {
  text-decoration: underline;
}
.ep-link-sub {
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.ep-empty {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-tertiary);
}
.ep-health {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ep-health-k {
  font-size: 12px;
  color: var(--text-secondary);
}
.ep-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}
.ep-metric {
  padding: 2px 8px;
  font-size: 11px;
  font-family: "Cascadia Code", Consolas, monospace;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
}
.ep-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

/* ===== 健康检测 ===== */
.hc-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.hc-tip {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary, #667085);
}
.hc-field {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hc-label {
  flex: none;
  width: 64px;
  font-size: 13px;
  color: var(--text-secondary, #667085);
}
.hc-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.hc-result {
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: 10px;
  padding: 12px 14px;
  background: var(--bg-container, #fff);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hc-result.is-ok {
  border-color: var(--success-300, #6ce9a6);
  background: var(--success-50, #ecfdf3);
}
.hc-result.is-bad {
  border-color: var(--danger-300, #fda29b);
  background: var(--danger-50, #fef3f2);
}
.hc-result-head {
  display: flex;
  align-items: center;
  gap: 10px;
}
.hc-code {
  font-size: 13px;
  font-weight: 600;
}
.hc-cost {
  font-size: 12px;
  color: var(--text-secondary, #667085);
}
.hc-result-msg {
  font-size: 13px;
  line-height: 1.6;
}
.hc-result-url,
.hc-result-time {
  font-size: 12px;
  color: var(--text-secondary, #667085);
  word-break: break-all;
}

/* ===== 定时发布 tab ===== */
.sched-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 14px;
  max-width: 720px;
  margin: 0 auto;
}
.sched-card {
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: 12px;
  padding: 16px 18px;
  background: var(--bg-container, #fff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(16, 24, 40, 0.04));
}
.sched-head {
  display: flex;
  align-items: center;
  gap: 12px;
}
.sched-ic {
  flex: none;
  color: var(--brand-500, #6d5dfc);
}
.sched-head-text {
  flex: 1;
  min-width: 0;
}
.sched-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.sched-sub {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-tertiary);
}
.sched-body {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sched-tip {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 8px 11px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-radius: 8px;
}
.sched-tip .re-icon {
  flex: none;
  margin-top: 2px;
  color: var(--text-tertiary);
}
.sched-tip-alone {
  margin-top: 2px;
}
.sched-runtime {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-subtle);
  font-size: 12px;
}
.sched-runtime-k {
  color: var(--text-tertiary);
}
.sched-runtime-v {
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.sched-runtime-status,
.sched-runtime-commit {
  margin-left: auto;
  padding: 1px 8px;
  font-size: 11px;
  font-family: "Cascadia Code", Consolas, monospace;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-radius: 999px;
}
</style>
