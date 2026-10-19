<template>
  <div class="px tel-page">
    <ReSectionHead description="项目管理 · 启动/停止/重启/升级/备份/回滚，支持拖拽安装包到卡片升级">
      <template #title>
        <ReButton icon="Back" layout="square" title="返回发布管理" @click="goBack" style="margin-right: 8px" />
        项目管理
      </template>
      <template #actions>
        <ReButton icon="Plus" :show-text="true" type="primary" @click="openCreateDialog">新增项目</ReButton>
      </template>
    </ReSectionHead>

    <div class="projects-wrap">
      <ReEmpty v-if="!list.length" description="点击右上角「新增项目」创建项目" :image-size="80" style="padding: 48px 0" />
      <div v-else class="card-grid">
        <div
          v-for="item in list"
          :key="item.id"
          class="project-card"
          :class="{ 'is-dragover': dragOverId === item.id, 'is-disabled': item.enabled === false }"
          @dragover.prevent="item.enabled !== false && (dragOverId = item.id)"
          @dragleave.prevent="dragOverId = null"
          @drop.prevent="onDropFile(item, $event)"
        >
          <div class="card-left">
            <div class="big-icon-wrap" :class="item.status === 'running' ? 'running' : 'stopped'">
              <ReIcon :name="displayIcon(item)" class="big-icon" />
            </div>
            <span class="status-dot" :class="item.status === 'running' ? 'running' : 'stopped'"></span>
          </div>

          <div class="card-right">
            <div class="card-header">
              <div class="title-row">
                <h3 :title="item.projectName">{{ item.projectName }}</h3>
                <el-tag v-if="item.enabled === false" type="info" effect="plain" round>已禁用</el-tag>
              </div>
              <el-tag effect="plain" round>{{ typeLabel(item.projectType) }}</el-tag>
            </div>

            <div class="card-body">
              <div class="info-row">
                <ReIcon name="FolderOpened" class="info-ic" />
                <span class="info-val" :title="item.projectPath">{{ item.projectPath || '未设置' }}</span>
              </div>
              <div class="info-row">
                <ReIcon name="Document" class="info-ic" />
                <span class="info-val" :title="item.logPath">{{ item.logPath || '未设置' }}</span>
              </div>
              <div v-if="item.status === 'running' && item.pid" class="info-row">
                <ReIcon name="Cpu" class="info-ic" />
                <span class="info-val">PID：<b class="pid-val">{{ item.pid }}</b></span>
              </div>
              <div v-if="item.status === 'running' && item.runningSince" class="info-row">
                <ReIcon name="Timer" class="info-ic" />
                <span class="info-val">运行时长：<b class="runtime-val">{{ formatRuntime(item) }}</b></span>
              </div>
              <div v-if="item.serviceName" class="info-row">
                <ReIcon name="Connection" class="info-ic" />
                <span class="info-val service-badge">已挂载系统服务</span>
              </div>
            </div>

            <div class="drop-hint">
              <ReIcon name="Upload" />
              拖拽安装包到此卡片即可升级
            </div>

            <div class="card-footer">
              <div v-if="item.enabled !== false" class="actions-group">
                <ReButton v-if="item.status !== 'running'" icon="VideoPlay" layout="square" title="启动" @click="handleStart(item)" />
                <template v-else>
                  <ReButton icon="VideoPause" layout="square" title="停止" @click="handleStop(item)" />
                  <ReButton icon="RefreshRight" layout="square" title="重启" @click="handleRestart(item)" />
                </template>
                <ReButton icon="Top" layout="square" title="升级" @click="openUpgradeDialog(item)" />
              </div>
              <div v-else class="disabled-tip">该项目已禁用，激活后可操作</div>
              <div class="actions-group">
                <el-dropdown trigger="click" placement="top" @command="(c: string) => onMoreCommand(item, c)">
                  <ReButton icon="MoreFilled" layout="square" title="更多" />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <ReIcon name="EditPen" :size="15" class="dd-ic" />编辑
                      </el-dropdown-item>
                      <el-dropdown-item v-if="item.enabled !== false && item.logPath" command="log">
                        <ReIcon name="Tickets" :size="15" class="dd-ic" />实时日志
                      </el-dropdown-item>
                      <el-dropdown-item v-if="item.enabled !== false" command="backup">
                        <ReIcon name="FolderChecked" :size="15" class="dd-ic" />备份
                      </el-dropdown-item>
                      <el-dropdown-item v-if="item.enabled !== false" command="rollback">
                        <ReIcon name="RefreshLeft" :size="15" class="dd-ic" />回滚
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
              </div>
            </div>
          </div>
        </div>
      </div>
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
                  <ReOption label="分离式部署" value="separated" />
                  <ReOption label="静态页面" value="static" />
                  <ReOption label="Nginx" value="nginx" />
                </ReSelect>
              </ReFormItem>
              <ReFormItem v-if="needsEntry" label="主入口名称" :required="mainEntryRequired">
                <ReInput v-model="form.mainEntry" :placeholder="entryPlaceholder" style="width:100%" />
              </ReFormItem>
              <ReFormItem label="项目地址" required>
                <ReInput v-model="form.projectPath" placeholder="如：/opt/app/user-service" style="width:100%" />
              </ReFormItem>
              <ReFormItem label="日志地址" required>
                <ReInput v-model="form.logPath" placeholder="如：/opt/app/user-service/logs/app.log" style="width:100%" />
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
                <ReInput v-model="form.nginxDir" placeholder="如：/usr/local/nginx 或 ./nginx" style="width:100%" />
              </ReFormItem>
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

    <!-- 手动升级对话框 -->
    <ReDialog v-model="upgVisible" :title="`升级项目 · ${upgProject?.projectName || ''}`" width="560px" :close-on-click-modal="false">
      <div class="upg-pane">
        <ReForm label-position="top">
          <ReFormItem label="安装包路径（主机上的绝对路径，jar / tar.gz / zip；为空则仅执行重启）">
            <ReInput v-model="upgForm.packagePath" placeholder="如：/home/ubuntu/uploads/app.tar.gz" />
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
        <ReButton @click="upgVisible = false">取消</ReButton>
        <ReButton type="primary" @click="executeUpgrade">执行升级</ReButton>
      </template>
    </ReDialog>

    <!-- 实时日志对话框 -->
    <ReDialog v-model="logDialogVisible" :title="`实时日志 - ${currentLogProject?.projectName || ''}`" width="820px" :close-on-click-modal="false">
      <div class="log-wrap">
        <div ref="logBoxEl" class="log-container" @scroll="onLogScroll">
          <div v-for="(line, i) in logLines" :key="i" class="log-line">{{ line || ' ' }}</div>
          <div v-if="!logLines.length" class="log-tip">等待日志输出…</div>
        </div>
        <div class="log-state" :class="{ paused: !logAutoScroll }">
          <span class="ls-dot"></span>{{ logAutoScroll ? '自动滚动' : '已暂停跟随' }}
        </div>
        <transition name="ls-fade">
          <div v-if="!logAutoScroll" class="log-resume" @click="resumeLogScroll">
            <ReIcon name="Bottom" :size="14" />回到底部
          </div>
        </transition>
      </div>
      <template #footer>
        <ReButton @click="logDialogVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import {getGlobalSocketService, message} from '@repo/core';
import { http, unwrapResult } from '@repo/utils';
import { fillTemplate, listTemplates } from '@repo/ui/components/ReCommand/templates';
import { getProcessTasks, trackTask } from '../utils/processTasks';

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
}

const list = ref<Project[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const releaseId = ref(Number(route.query.releaseId) || 0);
const activeTab = ref('basic');

const hostOs = ref<'linux' | 'windows'>('linux');

/** 当前发布绑定的主机ID：生成脚本时交给服务端据此选择 OS 模板 */
const hostId = ref<number>(0);

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
});

const editTabs = computed(() => {
  const tabs = [
    { name: 'basic', label: '基础信息', icon: 'InfoFilled' },
    { name: 'scripts', label: '脚本配置', icon: 'EditPen' },
    { name: 'vars', label: '变量设置', icon: 'Operation' },
    { name: 'system', label: '系统管理', icon: 'Setting' },
  ];
  // 备份记录仅在编辑已存在项目时可用（新建项目尚无 backups/）
  if (editingId.value != null) {
    tabs.push({ name: 'backups', label: '备份记录', icon: 'Files' });
  }
  return tabs;
});

const entryPlaceholder = computed(() => {
  switch (form.value.projectType) {
    case 'springboot':
    case 'fatjar':
      return '如：user-service.jar';
    case 'separated':
      return '如：app（可执行文件名）或 app.js';
    case 'static':
    case 'nginx':
      return '静态站点通常无需主入口';
    default:
      return '请先选择项目类型';
  }
});

const MAIN_ENTRY_REQUIRED_TYPES = ['springboot', 'separated'];
const mainEntryRequired = computed(() => MAIN_ENTRY_REQUIRED_TYPES.includes(form.value.projectType));
// 静态页面 / Nginx 无主入口；其余类型显示主入口
const needsEntry = computed(() => !['static', 'nginx'].includes(form.value.projectType));

const scriptContext = computed(() => ({
  entry: form.value.mainEntry,
  log: form.value.logPath,
  path: form.value.projectPath,
  appName: form.value.projectName,
}));

function typeLabel(t: string) {
  return ({
    springboot: 'SpringBoot',
    fatjar: 'FatJar',
    separated: '分离式',
    static: '静态页面',
    nginx: 'Nginx',
  } as Record<string, string>)[t] || t || '未知';
}

function defaultIconByType(t: string) {
  switch (t) {
    case 'springboot':
    case 'fatjar':
      return 'Cpu';
    case 'separated':
      return 'Box';
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

async function loadList() {
  loading.value = true;
  try {
    const res = await http().get(`${BASE}/${releaseId.value}/projects`);
    list.value = unwrapResult<Project[]>(res) || [];
  } catch (e) {
    message.error('加载项目列表失败');
  } finally {
    loading.value = false;
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
    hostId.value = rel.hostId;
    const hostRes = await http().get('/ms/server/host');
    const hosts = unwrapResult<any[]>(hostRes) || [];
    const host = hosts.find((h) => h.id === rel.hostId);
    if (host && String(host.serverHostOsType).toUpperCase() === 'WINDOWS') {
      hostOs.value = 'windows';
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
  };
}

function openCreateDialog() {
  editingId.value = null;
  resetForm();
  activeTab.value = 'basic';
  dialogVisible.value = true;
}

function openEditDialog(item: Project) {
  editingId.value = item.id;
  form.value = {
    projectName: item.projectName,
    projectType: item.projectType,
    mainEntry: item.mainEntry,
    startScript: item.startScript,
    stopScript: item.stopScript,
    restartScript: item.restartScript,
    statusScript: item.statusScript,
    projectPath: item.projectPath,
    logPath: item.logPath,
    logMode: item.logMode || 'append',
    description: item.description,
    icon: item.icon,
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
  };
  activeTab.value = 'basic';
  dialogVisible.value = true;
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
 * 取服务端权威脚本（与执行期同源）。
 *
 * <p>后端 `ProjectScripts` 是 Windows/Linux 模板的唯一权威来源：孤儿回收、
 * 计划任务回退、进程树解析等修复只在这里演进。前端仍保留本地模板作为
 * 离线兜底，但在线时必须优先用服务端结果，避免两侧漂移。</p>
 *
 * @returns 四段脚本；后端不可用或未关联主机时返回 null
 */
async function fetchServerScripts(): Promise<{ start: string; stop: string; restart: string; status: string } | null> {
  if (!hostId.value || !form.value.projectType) {
    return null;
  }
  try {
    const res = await http().get(`${BASE}/script/template`).query({
      hostId: hostId.value,
      projectType: form.value.projectType,
      mainEntry: form.value.mainEntry || '',
      projectPath: form.value.projectPath || '',
      logPath: form.value.logPath || '',
      appName: form.value.projectName || '',
      envVars: JSON.stringify(form.value.envVars || []),
      jvmArgs: JSON.stringify(form.value.jvmArgs || []),
      cmdArgs: JSON.stringify(form.value.cmdArgs || []),
    });
    const data = unwrapResult<Record<string, string>>(res);
    if (data?.startScript) {
      return {
        start: data.startScript,
        stop: data.stopScript || '',
        restart: data.restartScript || '',
        status: data.statusScript || '',
      };
    }
  } catch {
    // 网络/后端异常：回落到本地模板，保证离线可用
  }
  return null;
}

/**
 * 用内置模板补齐为空的脚本（已手写的不覆盖）
 *
 * <p>优先取服务端权威模板；后端不可用时回落到本地模板。</p>
 *
 * @param silent 静默模式：保存前自动补全时不弹校验/成功提示
 * @returns 是否成功套用模板
 */
async function fillScriptsFromTemplate(silent = false): Promise<boolean> {
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
  const server = await fetchServerScripts();
  if (server) {
    // 仅填充为空的脚本，已手写的不覆盖
    if (!form.value.startScript) form.value.startScript = server.start;
    if (!form.value.stopScript) form.value.stopScript = server.stop;
    if (!form.value.restartScript) form.value.restartScript = server.restart;
    if (!form.value.statusScript) form.value.statusScript = server.status;
    if (!silent) message.success('已根据基础配置生成脚本');
    return true;
  }
  const templates = listTemplates(hostOs.value, form.value.projectType);
  // 优先精确匹配类型，其次取第一个可用模板
  const tpl = templates.find((t) => t.types.includes(form.value.projectType)) || templates[0];
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
 * 一键生成四个脚本：优先取服务端权威模板（与执行期同源），
 * 后端不可用时回落到本地「OS + 项目类型」模板，覆盖 启动/停止/重启/状态。
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
  const server = await fetchServerScripts();
  // 本地模板只在后端不可用时才需要（同时用于判断是否有可用模板）
  const templates = listTemplates(hostOs.value, form.value.projectType);
  const tpl = templates.find((t) => t.types.includes(form.value.projectType)) || templates[0];
  if (!server && !tpl) {
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
    if (server) {
      form.value.startScript = server.start;
      form.value.stopScript = server.stop;
      form.value.restartScript = server.restart;
      form.value.statusScript = server.status;
    } else {
      const filled = fillTemplate(tpl!, {
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
    }
    // 展开 __JVMARGS__/__ARGS__ 为 $JVM_ARGS/$APP_ARGS（或 PS 变量）并注入变量块，保证生成即可用
    materializeVars();
    message.success('已生成 启动·停止·重启·状态 四个脚本');
  } catch (e: any) {
    message.error(e?.message || '脚本生成失败');
  } finally {
    autogenLoading.value = false;
  }
}

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
  if (mainEntryRequired.value && !form.value.mainEntry.trim()) {
    message.error('当前项目类型必须填写「主入口名称」');
    return;
  }
  // 规范化自定义服务名（仅小写字母数字、-、_）
  form.value.serviceName = form.value.serviceName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/(^-|-$)/g, '');
  try {
    // 保存前自动补齐未填写的脚本（服务端权威模板 + 占位符展开），用户无需手写
    await fillScriptsFromTemplate(true);
    materializeVars();
    const payload = {
      ...form.value,
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
  } catch (e) {
    message.error('保存失败');
  }
}

// ---- 禁用 / 激活 ----
async function toggleEnabled(item: Project) {
  const next = item.enabled === false;
  try {
    await http().put(`${BASE}/project/${item.id}`).data({ enabled: next });
    message.success(next ? '已激活' : '已禁用');
    loadList();
  } catch {
    message.error('操作失败');
  }
}

function onMoreCommand(item: Project, command: string) {
  switch (command) {
    case 'edit':
      openEditDialog(item);
      break;
    case 'log':
      handleViewLog(item);
      break;
    case 'backup':
      handleBackup(item);
      break;
    case 'rollback':
      handleRollback(item);
      break;
    case 'toggle':
      toggleEnabled(item);
      break;
    case 'delete':
      handleDelete(item);
      break;
  }
}

// ---- 项目操作 ----
async function runOperation(item: Project, operation: string, path: string) {
  try {
    const res = await http().post(BASE + path);
    const taskId = unwrapResult<string>(res);
    if (taskId) {
      trackTask(taskId, item.projectName, operation);
    }
  } catch (e) {
    message.error('操作触发失败');
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
function handleBackup(row: Project) {
  return runOperation(row, 'backup', `/project/${row.id}/backup`);
}
async function handleRollback(row: Project) {
  try {
    await ElMessageBox.confirm(`确定回滚项目「${row.projectName}」到上一个版本吗？`, '回滚确认', { type: 'warning' });
    await runOperation(row, 'rollback', `/project/${row.id}/rollback`);
  } catch (e) {
    if (e !== 'cancel') message.error('回滚失败');
  }
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
const supportsAppConfig = computed(() => ['springboot', 'fatjar'].includes(form.value.projectType));
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
    } catch {
      message.error('挂载服务失败');
    }
  }
}
async function handleUninstallService() {
  try {
    const res = await http().post(`${BASE}/project/${editingId.value}/service/uninstall`);
    const taskId = unwrapResult<string>(res);
    form.value.serviceName = '';
    if (taskId) trackTask(taskId, form.value.projectName, 'uninstall-service');
  } catch {
    message.error('卸载服务失败');
  }
}

// ---- 拖拽升级 ----
const dragOverId = ref<number | null>(null);
async function onDropFile(item: Project, ev: DragEvent) {
  dragOverId.value = null;
  const file = ev.dataTransfer?.files?.[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await http().post(`${BASE}/project/${item.id}/upload`).data(fd);
    const taskId = unwrapResult<string>(res);
    if (taskId) {
      trackTask(taskId, item.projectName, 'upgrade');
    } else {
      message.error('上传升级失败');
    }
  } catch {
    message.error('上传升级失败');
  }
}

// ---- 手动升级弹窗 ----
const upgVisible = ref(false);
const upgProject = ref<Project | null>(null);
const upgForm = ref({ autoBackup: true, autoExtract: true, autoRestart: true, autoRollback: false, packagePath: '' });

async function openUpgradeDialog(item: Project) {
  upgProject.value = item;
  try {
    const res = await http().get(`${BASE}/upgrade/config`);
    const cfg = unwrapResult<any>(res) || {};
    const base = cfg.last || cfg.global || {};
    upgForm.value = {
      autoBackup: base.autoBackup ?? true,
      autoExtract: base.autoExtract ?? true,
      autoRestart: base.autoRestart ?? true,
      autoRollback: base.autoRollback ?? false,
      packagePath: base.packagePath ?? '',
    };
  } catch {
    // 使用默认
  }
  upgVisible.value = true;
}
async function saveGlobalConfig() {
  try {
    await http().put(`${BASE}/upgrade/config?scope=global`).data(upgForm.value);
    message.success('已保存为全局默认');
  } catch {
    message.error('保存失败');
  }
}
async function executeUpgrade() {
  if (!upgProject.value) return;
  try {
    await http().put(`${BASE}/upgrade/config?scope=last`).data(upgForm.value);
    const res = await http().post(`${BASE}/project/${upgProject.value.id}/upgrade/run`).data(upgForm.value);
    const taskId = unwrapResult<string>(res);
    upgVisible.value = false;
    if (taskId) trackTask(taskId, upgProject.value.projectName, 'upgrade');
  } catch {
    message.error('升级触发失败');
  }
}

// ---- 实时日志 ----
const logDialogVisible = ref(false);
const logLines = ref<string[]>([]);
const currentLogProject = ref<Project | null>(null);
const logBoxEl = ref<HTMLElement>();
const logAutoScroll = ref(true);
let logSessionId: string | null = null;
let logUnsub: (() => void) | null = null;

async function handleViewLog(item: Project) {
  currentLogProject.value = item;
  logLines.value = [];
  logAutoScroll.value = true;
  logDialogVisible.value = true;

  const socket = getGlobalSocketService();
  logUnsub = socket?.subscribe('project', 'log', (msg: any) => {
    const data = msg?.data ?? msg;
    if (!data || data.sessionId !== logSessionId) return;
    if (data.status === 'LINE' && typeof data.line === 'string') {
      logLines.value.push(data.line);
    } else if (data.status === 'ERROR') {
      logLines.value.push(`[错误] ${data.message || '日志采集失败'}`);
    }
  }) ?? null;

  try {
    const res = await http().post(`${BASE}/project/${item.id}/log/start`);
    logSessionId = unwrapResult<string>(res);
  } catch (e) {
    logLines.value.push('[错误] 无法启动日志采集');
  }
}

function cleanupLog() {
  const sessionId = logSessionId;
  if (sessionId) {
    http().post(`${BASE}/project/log/${sessionId}/stop`).catch(() => {});
    logSessionId = null;
  }
  logUnsub?.();
  logUnsub = null;
}

watch(logDialogVisible, (visible) => {
  if (!visible) cleanupLog();
});
/** 距底部小于该阈值(px)视为仍贴底，保持自动滚动 */
const LOG_STICK_THRESHOLD = 24;

function onLogScroll(e: Event) {
  const el = e.target as HTMLElement;
  const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
  logAutoScroll.value = dist < LOG_STICK_THRESHOLD;
}

function resumeLogScroll() {
  logAutoScroll.value = true;
  if (logBoxEl.value) logBoxEl.value.scrollTop = logBoxEl.value.scrollHeight;
}

watch(logLines, () => {
  // 仅在贴底自动跟随；用户上滚查看历史时不打断（滚动解锁）
  if (logAutoScroll.value && logBoxEl.value) {
    logBoxEl.value.scrollTop = logBoxEl.value.scrollHeight;
  }
});

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
  try {
    const res = await http().get(`${BASE}/project/${editingId.value}/backups`);
    backupRows.value = unwrapResult<BackupRow[]>(res) || [];
  } catch {
    message.error('加载备份记录失败');
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
        if (fin) { stopWatch(); loadBackups(); }
      });
    } else {
      message.error('备份触发失败');
    }
  } catch {
    message.error('备份失败');
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
        if (fin) { stopWatch(); loadBackups(); loadList(); }
      });
    } else {
      message.error('回滚触发失败');
    }
  } catch {
    message.error('回滚失败');
  }
}

// 切到备份 tab 时加载（事件驱动，非轮询）
watch(activeTab, (tab) => {
  if (tab === 'backups' && editingId.value != null) loadBackups();
});

// socket 驱动刷新，避免轮询
const socket = getGlobalSocketService();
const unsubTaskRefresh = socket?.subscribe('project', 'task', (msg: any) => {
  const data = msg?.data ?? msg;
  if (data && (data.phase === 'COMPLETE' || data.phase === 'ERROR')) {
    loadList();
  }
});

/**
 * 任务终态兜底刷新：socket 终帧可能丢失，此时上方的订阅不会触发，
 * 卡片会一直显示旧 PID 且运行时长继续累加。这里直接观察任务跟踪状态
 * （processTasks 内部已按固定间隔与服务端对账），任一任务进入终态即重载列表。
 */
const taskSignature = computed(() =>
  getProcessTasks().map(t => `${t.taskId}:${t.finished}:${t.success}`).join('|'),
);
watch(taskSignature, (next, prev) => {
  if (next !== prev) {
    loadList();
  }
});

function goBack() {
  router.push('/release');
}

onMounted(() => {
  loadList();
  loadHostOs();
  nowTs.value = Date.now();
  runtimeTimer = setInterval(() => { nowTs.value = Date.now(); }, 1000);
});

onBeforeUnmount(() => {
  cleanupLog();
  unsubTaskRefresh?.();
  if (runtimeTimer) { clearInterval(runtimeTimer); runtimeTimer = null; }
});
</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(430px, 1fr));
  gap: 16px;
  padding: 16px 4px;
}
.project-card {
  display: flex;
  flex-direction: row;
  padding: 16px;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(16, 24, 40, 0.04));
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, opacity 0.2s;
}
.project-card:hover {
  border-color: var(--border-default, #e3e6ef);
  box-shadow: var(--shadow-md, 0 6px 16px rgba(16, 24, 40, 0.08));
  transform: translateY(-2px);
}
.project-card.is-dragover {
  border-color: var(--brand-500, #6d5dfc);
  box-shadow: 0 0 0 3px var(--brand-100, #ece9ff);
}
.project-card.is-disabled {
  background: var(--bg-fill, #f7f8fa);
  opacity: 0.72;
}
.project-card.is-disabled:hover {
  transform: none;
}

/* 左侧图标 */
.card-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-right: 14px;
  margin-right: 14px;
  border-right: 1px solid var(--border-subtle, #eef0f6);
}
.big-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 12px;
}
.big-icon-wrap.running {
  background: var(--brand-50, #f6f4ff);
}
.big-icon-wrap.stopped {
  background: var(--bg-fill, #f7f8fa);
}
.big-icon {
  font-size: 28px;
  color: var(--brand-500, #6d5dfc);
}
.is-disabled .big-icon {
  color: var(--el-text-color-secondary);
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.status-dot.running {
  background: var(--pulse-online, #2fbf71);
  box-shadow: 0 0 0 3px rgba(47, 191, 113, 0.18);
}
.status-dot.stopped {
  background: var(--pulse-offline, #9aa3b2);
}

/* 右侧详情 */
.card-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.title-row h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  min-width: 0;
}
.info-ic {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
.info-val {
  color: var(--el-text-color-regular);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.service-badge {
  color: var(--brand-600, #5a4bd9);
  font-weight: 600;
}
.drop-hint {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--brand-600, #5a4bd9);
  background: var(--brand-50, #f6f4ff);
  border: 1px dashed var(--brand-500, #6d5dfc);
  border-radius: 8px;
}
.project-card.is-dragover .drop-hint {
  display: flex;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--border-subtle, #eef0f6);
}
.actions-group {
  display: flex;
  gap: 4px;
}
.disabled-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dd-ic {
  margin-right: 6px;
  vertical-align: -2px;
  color: var(--el-text-color-regular);
}
.dd-danger {
  color: var(--el-color-danger);
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
.pid-val {
  font-family: "Cascadia Code", Consolas, monospace;
  color: var(--brand-600, #5a4bd9);
}
.runtime-val {
  font-family: "Cascadia Code", Consolas, monospace;
  color: var(--brand-600, #5a4bd9);
  font-weight: 600;
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
.log-container {
  height: 420px;
  overflow-y: auto;
  background: var(--terminal-bg, #0d1117);
  border-radius: 8px;
  padding: 14px 16px;
}
.log-line {
  color: #c9d1d9;
  font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.log-tip {
  margin-top: 8px;
  color: #6e7681;
  font-size: 12px;
}
/* 实时日志：自动滚动状态 + 回到底部 */
.log-wrap { position: relative; }
.log-state {
  position: absolute;
  top: 10px;
  right: 12px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  font-size: 11.5px;
  color: #c9d1d9;
  background: rgba(13, 17, 23, 0.72);
  border: 1px solid rgba(110, 118, 129, 0.4);
  border-radius: 999px;
  pointer-events: none;
  backdrop-filter: blur(4px);
}
.log-state .ls-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #2fbf71;
  box-shadow: 0 0 0 2px rgba(47, 191, 113, 0.25);
}
.log-state.paused { color: #d29922; border-color: rgba(210, 153, 34, 0.5); }
.log-state.paused .ls-dot { background: #d29922; box-shadow: 0 0 0 2px rgba(210, 153, 34, 0.25); }
.log-resume {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  font-size: 12.5px;
  color: #fff;
  background: var(--brand-500, #6d5dfc);
  border-radius: 999px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
  transition: background 0.15s;
}
.log-resume:hover { background: var(--brand-600, #5a4bd9); }
.ls-fade-enter-active, .ls-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.ls-fade-enter-from, .ls-fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(6px); }
</style>
