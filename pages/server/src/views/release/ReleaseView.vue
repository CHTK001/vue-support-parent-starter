<template>
  <div class="px tel-page release-page">
    <ReSectionHead description="管理服务器发布与项目 · 支持启动/停止/重启/升级/备份/回滚">
      <template #title>发布管理</template>
      <template #actions>
        <ReButton icon="Connection" :show-text="true" @click="openGlobalApm">全局 APM</ReButton>
        <ReButton icon="Tickets" :show-text="true" @click="opLogVisible = true">日志管理</ReButton>
        <ReButton icon="Top" :show-text="true" :loading="batchLoading" @click="openBatchUpgrade">批量升级</ReButton>
        <ReButton icon="Plus" :show-text="true" type="primary" @click="openCreateDialog">新增发布</ReButton>
      </template>
    </ReSectionHead>

    <div class="release-wrap">
      <ReEmpty v-if="!list.length" description="点击右上角「新增发布」创建发布" :image-size="80" style="padding: 56px 0" />
      <div v-else class="card-grid">
        <div v-for="item in list" :key="item.id" class="release-card" @click="goToProjects(item)">
          <!-- 左侧：服务器背景图 / 平台图标（按服务器平台着色） -->
          <div class="card-media" :class="osType(item)">
            <img v-if="item.backgroundImage" :src="item.backgroundImage" class="media-img" alt="" />
            <template v-else>
              <span class="media-ico" v-html="osIconSvg(hostOsOf(item))"></span>
              <span class="media-os">{{ osLabel(hostOsOf(item)) }}</span>
            </template>
          </div>

          <!-- 右侧：详情 -->
          <div class="card-content">
            <!-- 悬停浮现：编辑 / 删除 -->
            <div class="card-actions" @click.stop>
              <button class="mini-ico" title="编辑" @click="openEditDialog(item)">
                <el-icon><EditPen /></el-icon>
              </button>
              <button class="mini-ico danger" title="删除" @click="handleDelete(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </div>

            <div class="content-top">
              <h3 class="release-name" :title="item.releaseName">{{ item.releaseName }}</h3>
              <span class="proj-count">
                <el-icon><Files /></el-icon>{{ counts[item.id] ?? 0 }} 个项目
              </span>
              <span v-if="releaseSwEnabled(item)" class="apm-chip">SkyWalking</span>
            </div>
            <div class="host-line">
              <span class="host-chip">{{ hostNameOf(item) }}</span>
              <span class="host-ip">{{ item.hostIp || '未绑定主机' }}</span>
            </div>
            <p class="release-desc" :class="{ muted: !item.description }">
              {{ item.description || '暂无描述，点击卡片添加项目' }}
            </p>
            <div class="card-footer" @click.stop>
              <button class="ghost-ico" title="软件仓库" @click="goToHost(item)">
                <el-icon><Box /></el-icon><span>软件仓库</span>
              </button>
              <button class="enter-link" @click="goToProjects(item)">
                进入项目<el-icon><ArrowRight /></el-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对话框：左「基础」右「APM」，两块各管一件事，不再上下堆成一长条 -->
    <ReDialog
      v-model="dialogVisible"
      :title="editingId != null ? '编辑发布' : '新增发布'"
      width="920px"
      :close-on-click-modal="false"
    >
      <div class="rel-edit">
        <!-- 左：发布本身（叫什么、落在哪台机器、长什么样） -->
        <section class="rel-edit__col">
          <header class="rel-edit__head">
            <span class="rel-edit__title">基础信息</span>
            <span class="rel-edit__note">名称、主机与展示</span>
          </header>
          <ReForm :model="form" label-position="top" class="rel-edit__form">
            <ReFormItem label="发布名称" required>
              <ReInput v-model="form.releaseName" placeholder="如：生产环境发布" style="width:100%" />
            </ReFormItem>
            <ReFormItem label="主机" required>
              <ReSelect v-model="form.hostId" placeholder="选择主机（仅列出已开启 SSH 或本机的主机）" style="width:100%" filterable :teleported="true" popper-class="host-select-popper">
                <ReOption v-for="host in selectableHosts" :key="host.id" :label="host.serverHostName" :value="host.id">
                  <span style="float:left">{{ host.serverHostName }}</span>
                  <span style="float:right;color:var(--el-text-color-secondary);font-size:12px">
                    {{ host.serverHostAddress }}<template v-if="!sshEnabled(host)"> · 未开启 SSH</template>
                  </span>
                </ReOption>
              </ReSelect>
              <!-- 本机：平台所在机器。发布动作本地执行、不经 OpenSSH，因此不受「开启 SSH」限制；
                   没有本机主机时一键建好并选中，省得先跳去「主机管理」手填一遍 -->
              <div class="rel-local">
                <button type="button" class="rel-local__btn" :disabled="addingLocalHost" @click="useLocalHost">
                  <Monitor style="width:12px;height:12px" />{{ localHostHost ? '选中本机' : '添加本机' }}
                </button>
                <span class="rel-local__hint">
                  <template v-if="localHostHost">本机（{{ localHostHost.serverHostAddress }}）已在列表中，发布动作本地执行</template>
                  <template v-else>平台所在机器：备份/启停/日志/升级本地执行，不经 SSH</template>
                </span>
              </div>
              <div v-if="sshBlockedCount" class="apm-divider-sub" style="margin-top:6px">
                另有 {{ sshBlockedCount }} 台主机未开启 SSH，未列在上面的选项里：发布模块的备份/启停/日志/升级都走 OpenSSH，
                这类主机选了也执行不了。需要用到它们时，先到「主机管理」打开「开启 SSH」并确认 OpenSSH 已启动。
              </div>
              <div v-if="currentHostUnusable" class="apm-warn">
                当前绑定的主机未开启 SSH，该发布下的项目无法备份/启停/升级；请先开启 SSH，或改绑到已开启 SSH 的主机。
              </div>
            </ReFormItem>
            <ReFormItem label="描述">
              <ReInput v-model="form.description" type="textarea" :rows="3" placeholder="发布描述" style="width:100%" />
            </ReFormItem>
            <ReFormItem label="背景图URL">
              <ReInput v-model="form.backgroundImage" placeholder="输入背景图URL（可选）" style="width:100%" />
            </ReFormItem>
          </ReForm>
        </section>

        <!-- 右：APM 注入（发布级默认值，项目级仍可覆盖） -->
        <section class="rel-edit__col rel-edit__col--apm">
          <header class="rel-edit__head">
            <span class="rel-edit__title">APM 注入</span>
            <el-tooltip
              content="启用后，该发布下新建/复制的项目自动挂载 agent jar 并上报到集群 OAP；项目级 APM 选项仍优先。"
              placement="top"
              :show-after="150"
            >
              <span class="apm-tip" aria-label="说明">ⓘ</span>
            </el-tooltip>
            <span class="apm-chip">SkyWalking</span>
            <span class="rel-edit__note">该发布下新项目默认继承</span>
          </header>
          <ReForm :model="form" label-position="top" class="rel-edit__form">
            <ReFormItem label="启用状态">
              <div class="sw-toggle">
                <ReSwitch :model-value="!!form.swEnabled" @change="(v: any) => form.swEnabled = !!v" />
                <span class="apm-divider-sub">
                  {{ form.swEnabled ? "新项目自动带 -javaagent" : "不注入，项目按自己的配置走" }}
                </span>
              </div>
            </ReFormItem>
            <ReFormItem label="agent jar 路径" :required="!!form.swEnabled && !globalFallbackActive">
              <div class="apm-row">
                <ReInput v-model="form.swJarPath" placeholder="如 /opt/skywalking/skywalking-agent.jar" style="flex:1;min-width:0" />
                <el-tooltip
                  content="目标主机上的绝对路径；留空则取全局兜底。Windows 与 Linux 路径不同，跨平台请由发布分别配置。"
                  placement="top"
                  :show-after="150"
                >
                  <span class="apm-tip" aria-label="说明">ⓘ</span>
                </el-tooltip>
              </div>
              <div v-if="swMissingJar" class="apm-warn">
                已勾选启用，但 agent jar 路径为空：该发布不会注入 agent。
              </div>
            </ReFormItem>
            <ReFormItem label="service_name 前缀">
              <div class="apm-row">
                <ReInput v-model="form.swServiceNamePrefix" placeholder="如 prod，最终为 prod-项目名" style="flex:1;min-width:0" />
                <el-tooltip content="留空则服务名只取项目名。" placement="top" :show-after="150">
                  <span class="apm-tip" aria-label="说明">ⓘ</span>
                </el-tooltip>
              </div>
            </ReFormItem>
            <ReFormItem label="OAP 上报地址" :required="!!form.swEnabled && !globalFallbackActive">
              <div class="apm-row">
                <ReInput v-model="form.swBackendService" placeholder="如 192.168.50.198:11800" style="flex:1;min-width:0" />
                <el-tooltip
                  content="写入 agent 的 collector.backend_service（gRPC 11800）；留空取全局兜底。"
                  placement="top"
                  :show-after="150"
                >
                  <span class="apm-tip" aria-label="说明">ⓘ</span>
                </el-tooltip>
              </div>
              <div v-if="swMissingBackend" class="apm-warn">
                已勾选启用，但发布与全局都没有 OAP 地址：agent 起来了也上报不到任何后端。
              </div>
            </ReFormItem>
            <ReFormItem v-if="form.swEnabled && form.swJarPath && form.swBackendService" label="启动命令预览">
              <pre class="apm-preview">java {{ releaseJvmArgs }} -jar &lt;入口&gt; ...</pre>
            </ReFormItem>
          </ReForm>
        </section>
      </div>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="handleSave">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 日志管理：所有项目操作的审计记录（含失败原因、耗时、操作人） -->
    <ReDialog v-model="opLogVisible" title="日志管理" width="1080px">
      <ProjectOpLogPanel />
    </ReDialog>

    <!-- 集群批量升级：先选第一个项目定类型，再批量勾选同类型项目 -->
    <ReDialog v-model="batchVisible" title="集群批量升级" width="760px" :close-on-click-modal="false">
      <div class="batch-pane">
        <div class="batch-tip">
          <el-icon class="batch-tip-ic"><InfoFilled /></el-icon>
          <div>
            <div class="batch-tip-title">同类型项目一次下发</div>
            <div class="batch-tip-sub">
              先选一个项目作为「类型基准」，下面自动只列所有发布里与它同类型的项目；
              勾选后按同一份配置逐个下发升级，用于集群升级。
            </div>
          </div>
        </div>

        <el-form label-position="top" class="batch-form">
          <el-form-item label="类型基准项目（决定本次升级的项目类型）">
            <el-select v-model="batchAnchorId" filterable clearable placeholder="选择第一个项目" style="width:100%">
              <el-option
                v-for="p in allProjects"
                :key="p.id"
                :label="`${p.releaseName} / ${p.projectName}`"
                :value="p.id"
              >
                <span class="opt-name">{{ p.releaseName }} / {{ p.projectName }}</span>
                <span class="opt-meta">{{ typeLabel(p.projectType) }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="升级产物（从主机文件选，或直接上传；不选则仅重启）">
            <div v-if="batchPkg.path" class="batch-pkg">
              <span class="batch-pkg-name" :title="batchPkg.path">{{ batchPkg.name || batchPkg.path }}</span>
              <button type="button" class="batch-pkg-clear" @click="clearBatchPkg">清除</button>
            </div>
            <div v-else class="batch-pkg-actions">
              <el-button @click="batchPickerVisible = true">从主机文件选</el-button>
              <el-button :loading="batchUploading" @click="pickBatchPkg">
                {{ batchUploading ? `上传中 ${batchUploadPercent}%` : '直接上传' }}
              </el-button>
              <input ref="batchFileInput" type="file" style="display:none" @change="onBatchPkgPicked" />
            </div>
            <div class="batch-tip-sub" style="width:100%; margin-top:2px">
              选中或上传后，后端会把同一个包分别推到各目标主机的 uploads/ 再逐个升级；
              不选产物表示只重启这些项目。
            </div>
          </el-form-item>
        </el-form>

        <div class="batch-switches">
          <el-checkbox v-model="batchForm.autoBackup">自动备份</el-checkbox>
          <el-checkbox v-model="batchForm.autoExtract">自动解压（压缩包）</el-checkbox>
          <el-checkbox v-model="batchForm.autoRestart">自动重启</el-checkbox>
          <el-checkbox v-model="batchForm.autoRollback">失败自动回滚</el-checkbox>
        </div>

        <div class="batch-list-head">
          <span class="blh-title">同类型项目</span>
          <span class="blh-count">已选 {{ batchSelected.length }} / {{ sameTypeProjects.length }}</span>
          <button v-if="sameTypeProjects.length" class="blh-all" @click="toggleBatchAll">
            {{ batchSelected.length === sameTypeProjects.length ? '取消全选' : '全选' }}
          </button>
        </div>
        <div v-if="!batchAnchorId" class="batch-empty">先在上方选择一个项目，类型相同的项目会列在这里</div>
        <div v-else-if="!sameTypeProjects.length" class="batch-empty">没有其它同类型项目</div>
        <div v-else class="batch-list">
          <label v-for="p in sameTypeProjects" :key="p.id" class="batch-row">
            <el-checkbox
              :model-value="batchSelected.includes(p.id)"
              @change="(v: any) => toggleBatchPick(p.id, !!v)"
            />
            <span class="batch-row-name">{{ p.projectName }}</span>
            <span class="batch-row-release">{{ p.releaseName }}</span>
            <span class="batch-row-host">{{ p.hostName }}</span>
            <span v-if="p.enabled === false" class="batch-row-off">已禁用</span>
          </label>
        </div>
      </div>
      <template #footer>
        <ReButton @click="batchVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="batchLoading" :disabled="!batchSelected.length" @click="submitBatchUpgrade">
          开始升级（{{ batchSelected.length }}）
        </ReButton>
      </template>
    </ReDialog>

    <!-- 批量升级的产物来源：与单项目升级同一套主机文件 -->
    <HostFilePicker v-model="batchPickerVisible" @select="onBatchPkgSelected" />

    <!-- 全局 APM 兜底：发布级留空的字段统一取这里；项目自身 APM 永远优先 -->
    <ReDialog
      v-model="globalApmVisible"
      title="全局 APM 兜底"
      width="640px"
      :close-on-click-modal="false"
    >
      <div class="global-apm">
        <ReForm label-position="top">
          <ReFormItem label="启用全局兜底">
            <div class="sw-toggle">
              <ReSwitch v-model="globalApmForm.enabled" />
              <span class="apm-divider-sub">
                {{ globalApmForm.enabled ? "发布留空字段用下面的统一配置" : "只用发布自身配置" }}
              </span>
              <el-tooltip
                content="发布自身填了 agent / OAP 时优先用发布配置，留空才取这里；项目 jvmArgs 里已声明的 APM 参数优先级最高，不会被覆盖。"
                placement="top"
                :show-after="150"
              >
                <span class="apm-tip" aria-label="说明">ⓘ</span>
              </el-tooltip>
            </div>
          </ReFormItem>
          <ReFormItem label="OAP 上报地址">
            <div class="apm-row">
              <ReInput
                v-model="globalApmForm.backendService"
                placeholder="如 oap-vip:11800（单机填 OAP_IP:11800）"
                style="flex:1;min-width:0"
              />
              <el-tooltip
                content="写入 collector.backend_service（gRPC 11800）。单机填 OAP 的 IP；集群或聚合填统一 VIP / 负载均衡 / 域名。观测台查询地址另在「APM 设置 → OAP 地址」（HTTP 12800）。"
                placement="top"
                :show-after="150"
              >
                <span class="apm-tip" aria-label="说明">ⓘ</span>
              </el-tooltip>
            </div>
          </ReFormItem>
          <ReFormItem label="agent jar 路径">
            <div class="apm-row">
              <ReInput
                v-model="globalApmForm.jarPath"
                placeholder="如 /opt/skywalking/agent.jar"
                style="flex:1;min-width:0"
              />
              <el-tooltip
                content="仅当发布未填 jar 时使用。目标主机绝对路径；不同操作系统路径不同，跨平台请由发布分别配置。"
                placement="top"
                :show-after="150"
              >
                <span class="apm-tip" aria-label="说明">ⓘ</span>
              </el-tooltip>
            </div>
          </ReFormItem>
          <ReFormItem label="service_name 前缀">
            <div class="apm-row">
              <ReInput
                v-model="globalApmForm.serviceNamePrefix"
                placeholder="如 prod，最终为 prod-项目名"
                style="flex:1;min-width:0"
              />
              <el-tooltip content="留空则服务名只取项目名。" placement="top" :show-after="150">
                <span class="apm-tip" aria-label="说明">ⓘ</span>
              </el-tooltip>
            </div>
          </ReFormItem>
        </ReForm>
      </div>
      <template #footer>
        <ReButton @click="globalApmVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="globalApmSaving" @click="saveGlobalApm">保存并同步</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessageBox } from 'element-plus';
import { Files, Box, ArrowRight, EditPen, Delete, InfoFilled, Top, Monitor } from '@element-plus/icons-vue';
import { http, unwrapResult } from '@repo/utils';
import { fetchLocalAddress, saveHost } from '../../api';
import { osIconSvg, osLabel } from '../../utils/osIcon';
import { trackTask } from '../../utils/processTasks';
import { toastError } from '../../utils/errors';
import { releaseSse } from '../../services/releaseRealtime';
import ProjectOpLogPanel from '../../components/ProjectOpLogPanel.vue';
import HostFilePicker from '../../components/HostFilePicker.vue';
import { upgradeFromHostFile, uploadReleaseHostFile } from '../../api/releaseHostFile';

const BASE = '/ms/server/release';

/** 日志管理对话框 */
const opLogVisible = ref(false);

async function api<T>(path: string): Promise<T> {
  const res = await http().get(BASE + path);
  return unwrapResult<T>(res);
}

const router = useRouter();

interface Release {
  id: number;
  releaseName: string;
  hostId: number;
  hostIp: string;
  description: string;
  backgroundImage: string;
  swEnabled?: boolean;
  swJarPath?: string;
  swServiceNamePrefix?: string;
  swBackendService?: string;
}

interface Host {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostOsType?: string;
  /** 1=已开启 SSH；0/null=未开启（发布模块全部动作都走 SSH，未开启的主机不可用） */
  serverHostSshEnabled?: number | null;
  /** 采集方式：LOCAL=平台所在机器，发布动作本地执行、不经 SSH */
  serverHostCollectMode?: string | null;
}

/** 全局 APM 兜底配置（发布留空字段时使用） */
interface GlobalApm {
  enabled: boolean;
  jarPath: string;
  backendService: string;
  serviceNamePrefix: string;
}

const list = ref<Release[]>([]);
const hosts = ref<Host[]>([]);
const counts = ref<Record<number, number>>({});
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const globalApmVisible = ref(false);
const globalApmSaving = ref(false);
const globalApm = ref<GlobalApm>({ enabled: false, jarPath: '', backendService: '', serviceNamePrefix: '' });
const globalApmForm = ref<GlobalApm>({ enabled: false, jarPath: '', backendService: '', serviceNamePrefix: '' });

const form = ref({
  releaseName: '',
  hostId: undefined as number | undefined,
  description: '',
  backgroundImage: '',
  swEnabled: false,
  swJarPath: '',
  swServiceNamePrefix: '',
  swBackendService: '',
});

/** 全局兜底是否生效：关闭时只使用发布自身配置 */
const globalFallbackActive = computed(() => !!globalApm.value.enabled);

/** 当前表单的生效 agent jar：发布填写优先，否则取全局兜底 */
const effectiveJar = computed(() =>
  !isBlank(form.value.swJarPath) ? form.value.swJarPath : (globalFallbackActive.value ? globalApm.value.jarPath : ''),
);

/** 当前表单的生效 OAP 上报地址：发布填写优先，否则取全局兜底 */
const effectiveBackend = computed(() =>
  !isBlank(form.value.swBackendService) ? form.value.swBackendService : (globalFallbackActive.value ? globalApm.value.backendService : ''),
);

/** 当前表单的生效 service_name 前缀：发布填写优先，否则取全局兜底 */
const effectivePrefix = computed(() =>
  !isBlank(form.value.swServiceNamePrefix) ? form.value.swServiceNamePrefix : (globalFallbackActive.value ? globalApm.value.serviceNamePrefix : ''),
);

/** 发布级 SkyWalking 启动参数预览（展示生效值，不修改表单） */
const releaseJvmArgs = computed(() => {
  const jar = effectiveJar.value || '<agent.jar>';
  const backend = effectiveBackend.value || '<OAP:11800>';
  const prefix = effectivePrefix.value;
  const serviceName = isBlank(prefix) ? '<项目名>' : `${prefix}-<项目名>`;
  return [
    `-javaagent:${jar}`,
    `-Dskywalking.agent.service_name=${serviceName}`,
    `-Dskywalking.collector.backend_service=${backend}`,
  ].join(' ');
});

/** 空值/空白字符串快速判断 */
function isBlank(value?: string): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * 主机是否可被发布使用。
 *
 * <p>口径与后端 {@code ReleaseServiceImpl#prepare} 一致：本机（collect_mode=LOCAL）主机
 * 由平台自身在本地执行，<b>不需要</b> OpenSSH；其余主机走 SSH，按「显式设置优先，
 * 未设置时非 Windows 视为开启、Windows 视为关闭」判定。</p>
 *
 * <p>为什么要在这里挡：发布模块的备份/启停/日志/升级对远程主机全部走 OpenSSH，
 * 主机没开 SSH 时任何动作都只会得到一句「无法执行发布操作」。与其让用户配完发布、
 * 建完项目、点一次失败一次，不如在选主机这一步就不提供这类主机。</p>
 *
 * @param h 主机
 * @returns 是否可被发布使用
 */
function sshEnabled(h: Host): boolean {
  if (isLocalHost(h)) {
    return true;
  }
  const v = h.serverHostSshEnabled;
  if (v !== null && v !== undefined) {
    return Number(v) === 1;
  }
  return String(h.serverHostOsType || '').toUpperCase() !== 'WINDOWS';
}

/** 是否为本机主机（平台所在机器，发布动作本地执行） */
function isLocalHost(h: Host): boolean {
  return String(h.serverHostCollectMode || '').toUpperCase() === 'LOCAL';
}

/** 已存在的本机主机（没有时「添加本机」才会真的新建一条） */
const localHostHost = computed(() => hosts.value.find((h) => isLocalHost(h)) || null);

/** 添加本机中（防连点重复建号） */
const addingLocalHost = ref(false);

/**
 * 「添加本机」：已存在本机主机就直接选中，否则按平台地址新建一条 LOCAL 主机。
 *
 * <p>地址取服务端首选网卡 IPv4（后端 {@code /local-address}），拿不到时退回 127.0.0.1 ——
 * 回环地址同样通过后端的「确属本机」校验。采集方式 LOCAL 决定执行通道，
 * 平台类型由后端按运行机器的 {@code os.name} 覆盖，这里给的值只是必填占位。</p>
 */
async function useLocalHost(): Promise<void> {
  if (localHostHost.value) {
    form.value.hostId = localHostHost.value.id;
    message.info(`已选中本机主机（${localHostHost.value.serverHostAddress}）`);
    return;
  }
  if (addingLocalHost.value) return;
  addingLocalHost.value = true;
  try {
    let address = '';
    try {
      address = (await fetchLocalAddress()) || '';
    } catch {
      address = '';
    }
    const created = await saveHost(null, {
      serverHostName: '本机（服务端）',
      serverHostAddress: address || '127.0.0.1',
      serverHostPort: 22,
      // 后端按本机操作系统覆盖，这里给必填占位
      serverHostOsType: 'LINUX',
      serverHostCollectMode: 'LOCAL',
      serverHostSshEnabled: 1,
      serverHostRemoteEnabled: 1,
      serverHostStatus: 1,
      serverHostDescription: '平台所在机器：发布动作本地执行，不经 SSH',
    } as any);
    if (created) {
      hosts.value = [...hosts.value, created];
      form.value.hostId = created.id;
    }
    message.success('已添加本机主机');
  } catch (e: any) {
    toastError(e, '添加本机主机失败');
  } finally {
    addingLocalHost.value = false;
  }
}

/** 主机下拉可选项：只列开启 SSH 的主机；编辑时保留当前已绑定的那台（便于改配置/查看问题） */
const selectableHosts = computed(() =>
  hosts.value.filter((h) => sshEnabled(h) || h.id === form.value.hostId),
);

/** 因未开启 SSH 而被隐藏的主机数量（0 时不提示） */
const sshBlockedCount = computed(() => hosts.value.filter((h) => !sshEnabled(h)).length);

/** 当前选中的主机是否本身不可用（编辑已绑定未开 SSH 的发布时给出警示） */
const currentHostUnusable = computed(() => {
  const h = hosts.value.find((x) => x.id === form.value.hostId);
  return !!h && !sshEnabled(h);
});

/** 发布是否已下发 SkyWalking APM（生效值均非空才接单） */
function releaseSwEnabled(item: Release): boolean {
  const jar = !isBlank(item.swJarPath) ? item.swJarPath : (globalFallbackActive.value ? globalApm.value.jarPath : '');
  const backend = !isBlank(item.swBackendService)
    ? item.swBackendService
    : (globalFallbackActive.value ? globalApm.value.backendService : '');
  return !!item.swEnabled && !isBlank(jar) && !isBlank(backend);
}

/** 勾了启用但生效 agent jar 仍为空：保存后不会注入，必须在表单里说清楚 */
const swMissingJar = computed(() => !!form.value.swEnabled && isBlank(effectiveJar.value));

/** 勾了启用但生效 OAP 地址仍为空：同样只在界面提示，不阻断保存（项目级仍可覆盖） */
const swMissingBackend = computed(() => !!form.value.swEnabled && isBlank(effectiveBackend.value));

/** 平台类型 -> 样式类 */
function osType(item: Release): string {
  const h = hosts.value.find((x) => x.id === item.hostId);
  const t = String(h?.serverHostOsType || '').toUpperCase();
  if (t === 'WINDOWS') return 'win';
  if (t === 'MACOS') return 'mac';
  return 'linux';
}

/** 主机名称 */
function hostNameOf(item: Release): string {
  const h = hosts.value.find((x) => x.id === item.hostId);
  return h ? h.serverHostName : '未绑定主机';
}

/** 主机平台类型（供平台图标/名称使用） */
function hostOsOf(item: Release): string {
  const h = hosts.value.find((x) => x.id === item.hostId);
  return h?.serverHostOsType || '';
}

async function loadList() {
  try {
    const res = await api<Release[]>('/list');
    list.value = res || [];
    loadCounts();
  } catch (e: any) {
    toastError(e, '加载发布列表失败');
  }
}

/** 并行加载每个发布的项目数量（一次性，非轮询） */
async function loadCounts() {
  await Promise.all(
    list.value.map(async (r) => {
      try {
        const res = await http().get(`${BASE}/${r.id}/projects`);
        const projects = unwrapResult<any[]>(res) || [];
        counts.value[r.id] = projects.length;
      } catch (e) {
        counts.value[r.id] = 0;
      }
    }),
  );
}

async function loadHosts() {
  // 自动重试：后端启动中 / 网络抖动等瞬时失败时，避免主机下拉永久“无数据”
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await http().get('/ms/server/host');
      hosts.value = unwrapResult(res) || [];
      return;
    } catch (e) {
      console.error('加载主机列表失败:', e);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
  }
}

/** 打开对话框前确保主机列表已加载（首次失败也能在点击新增/编辑时重新拉取） */
async function ensureHosts() {
  if (!hosts.value.length) {
    await loadHosts();
  }
}

async function openCreateDialog() {
  await ensureHosts();
  editingId.value = null;
  form.value = {
    releaseName: '', hostId: undefined, description: '', backgroundImage: '',
    swEnabled: false, swJarPath: '', swServiceNamePrefix: '', swBackendService: '',
  };
  dialogVisible.value = true;
}

async function openEditDialog(item: Release) {
  await ensureHosts();
  editingId.value = item.id;
  form.value = {
    releaseName: item.releaseName,
    hostId: item.hostId,
    description: item.description,
    backgroundImage: item.backgroundImage || '',
    swEnabled: !!item.swEnabled,
    swJarPath: item.swJarPath || '',
    swServiceNamePrefix: item.swServiceNamePrefix || '',
    swBackendService: item.swBackendService || '',
  };
  dialogVisible.value = true;
}

async function handleSave() {
  try {
    const body = { ...form.value, swEnabled: form.value.swEnabled };
    // 未配置完整时给出提示，避免“开了开关但没下发”的空转；全局兜底也算生效值
    if (body.swEnabled && (isBlank(effectiveJar.value) || isBlank(effectiveBackend.value))) {
      message.warning('启用 SkyWalking 注入需要配置 agent jar 路径与 OAP 地址（可留空由全局兜底）');
    }
    // 主机没开 SSH：保存不拦（可能还在装 OpenSSH），但必须说明后果
    if (currentHostUnusable.value) {
      message.warning('该主机未开启 SSH：保存后发布下的项目将无法备份、启停、升级');
    }
    if (editingId.value != null) {
      await http().put(BASE + `/${editingId.value}`).data(body);
      message.success('更新成功');
    } else {
      await http().post(BASE).data(body);
      message.success('创建成功');
    }
    dialogVisible.value = false;
    loadList();
  } catch (e: any) {
    toastError(e, '保存失败');
  }
}

/** 把后端返回的全局配置归一成表单结构（空值/null 都变成空串） */
function normalizeGlobalApm(raw: any): GlobalApm {
  return {
    enabled: !!raw?.enabled,
    jarPath: raw?.jarPath || '',
    backendService: raw?.backendService || '',
    serviceNamePrefix: raw?.serviceNamePrefix || '',
  };
}

/** 读取全局 APM 兜底配置；读不到时保持关闭，不影响发布编辑 */
async function loadGlobalApm() {
  try {
    globalApm.value = normalizeGlobalApm(await api<GlobalApm>('/apm/global'));
  } catch (e) {
    console.warn('加载全局 APM 配置失败:', e);
  }
}

/** 打开全局 APM 对话框前重新读取，避免别处改过之后用旧值覆盖 */
async function openGlobalApm() {
  await loadGlobalApm();
  globalApmForm.value = { ...globalApm.value };
  globalApmVisible.value = true;
}

/** 保存全局 APM 兜底配置；后端会立即重算所有发布下的项目 */
async function saveGlobalApm() {
  if (globalApmForm.value.enabled
    && isBlank(globalApmForm.value.backendService)
    && isBlank(globalApmForm.value.jarPath)) {
    message.warning('启用全局兜底但 OAP 地址和 agent jar 都为空，保存后不会产生实际注入');
  }
  globalApmSaving.value = true;
  try {
    const res = await http().put(BASE + '/apm/global').data(globalApmForm.value);
    const saved = unwrapResult<GlobalApm>(res);
    globalApm.value = normalizeGlobalApm(saved);
    globalApmVisible.value = false;
    await loadList();
    message.success('全局 APM 配置已保存并同步');
  } catch (e: any) {
    toastError(e, '保存全局 APM 配置失败');
  } finally {
    globalApmSaving.value = false;
  }
}

async function handleDelete(item: Release) {
  try {
    await ElMessageBox.confirm(`确定删除发布「${item.releaseName}」吗？其下项目将一并删除。`, '提示', { type: 'warning' });
    await http().delete(BASE + `/${item.id}`);
    message.success('删除成功');
    loadList();
  } catch (e) {
    if (e !== 'cancel') {
      message.error('删除失败');
    }
  }
}

function goToProjects(item: Release) {
  router.push(`/projects?releaseId=${item.id}`);
}

/**
 * 软件仓库：进入该主机资产工作区的「软件管理」页签。
 *
 * <p>此前跳 {@code /host/:id}（主机监控详情），点「软件仓库」看到的却是监控图表。
 * 现在改为跳到资产页并带上深链参数，落地直接打开软件管理页签。</p>
 */
function goToHost(item: Release) {
  if (!item.hostId) {
    message.warning('该发布未绑定主机');
    return;
  }
  router.push({ path: '/assets', query: { hostId: String(item.hostId), tab: 'software' } });
}

// ==================== 集群批量升级 ====================

/** 所有发布下的全部项目（批量升级的候选池） */
interface BatchProject {
  id: number;
  projectName: string;
  projectType: string;
  enabled: boolean;
  releaseId: number;
  releaseName: string;
  hostName: string;
}

const allProjects = ref<BatchProject[]>([]);
const batchVisible = ref(false);
const batchLoading = ref(false);
/** 类型基准项目：决定本次批量升级的项目类型 */
const batchAnchorId = ref<number | undefined>(undefined);
const batchSelected = ref<number[]>([]);
const batchForm = ref({
  packagePath: '',
  autoBackup: true,
  autoExtract: true,
  autoRestart: true,
  autoRollback: false,
});
/** 批量升级选中的主机文件（key 非空时逐个项目走「先推到目标机再升级」） */
const batchPkg = ref<{ key: string; name: string; path: string }>({ key: '', name: '', path: '' });
/** 主机文件选择器可见性 */
const batchPickerVisible = ref(false);
/** 直接上传进度 */
const batchUploading = ref(false);
const batchUploadPercent = ref(0);
const batchFileInput = ref<HTMLInputElement | null>(null);

/** 打开浏览器文件选择（批量升级直接上传产物） */
function pickBatchPkg() {
  batchFileInput.value?.click();
}

/**
 * 主机文件选择器选中：记下 key，逐项目升级时由后端推到各自主机。
 *
 * @param item 选中的文件
 */
function onBatchPkgSelected(item: { key: string; name: string; hostPath?: string }) {
  batchPkg.value = { key: item.key, name: item.name, path: item.hostPath || item.key };
  message.success(`已选择主机文件：${item.name}`);
}

/**
 * 直接上传批量升级产物：传进主机文件存储后按路径回填。
 *
 * @param e input change
 */
async function onBatchPkgPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  batchUploading.value = true;
  batchUploadPercent.value = 0;
  try {
    const item = await uploadReleaseHostFile(file, '', (p) => {
      batchUploadPercent.value = p;
    });
    if (!item) {
      message.warning('上传完成但没有在主机文件里找到该文件，请到「主机文件」页确认');
      return;
    }
    batchPkg.value = { key: item.key, name: item.name, path: item.hostPath || item.key };
    message.success(`已上传：${file.name}`);
  } catch (err: any) {
    toastError(err, '上传产物失败');
  } finally {
    batchUploading.value = false;
  }
}

/**
 * 清空批量升级产物（回到「仅重启」）。
 */
function clearBatchPkg() {
  batchPkg.value = { key: '', name: '', path: '' };
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  springboot: 'SpringBoot',
  fatjar: 'FatJar',
  git: 'Git 源码部署',
  separated: '分离式',
  model: '模型',
  static: '静态页面',
  nginx: 'Nginx',
};

function typeLabel(t: string): string {
  return PROJECT_TYPE_LABELS[t] || t || '未知';
}

/** 基准项目的类型；未选基准时为 undefined */
const anchorType = computed(() => {
  if (batchAnchorId.value == null) return undefined;
  return allProjects.value.find(p => p.id === batchAnchorId.value)?.projectType;
});

/** 与基准项目同类型的全部项目 */
const sameTypeProjects = computed(() => {
  const t = anchorType.value;
  if (t == null) return [];
  return allProjects.value.filter(p => p.projectType === t);
});

/** 打开批量升级弹框：拉取所有发布下的项目 */
async function openBatchUpgrade() {
  batchLoading.value = true;
  try {
    if (!list.value.length) await loadList();
    if (!hosts.value.length) await loadHosts();
    const rows: BatchProject[] = [];
    await Promise.all(
      list.value.map(async (r) => {
        try {
          const res = await http().get(`${BASE}/${r.id}/projects`);
          const projects = unwrapResult<any[]>(res) || [];
          const host = hosts.value.find(h => h.id === r.hostId);
          for (const p of projects) {
            rows.push({
              id: p.id,
              projectName: p.projectName,
              projectType: p.projectType,
              enabled: p.enabled !== false,
              releaseId: r.id,
              releaseName: r.releaseName,
              hostName: host?.serverHostName || r.hostIp || '未知主机',
            });
          }
        } catch {
          // 单个发布读取失败不影响其它发布
        }
      }),
    );
    allProjects.value = rows;
    batchAnchorId.value = undefined;
    batchSelected.value = [];
    batchForm.value = {
      packagePath: '',
      autoBackup: true,
      autoExtract: true,
      autoRestart: true,
      autoRollback: false,
    };
    batchPkg.value = { key: '', name: '', path: '' };
    batchVisible.value = true;
  } finally {
    batchLoading.value = false;
  }
}

function toggleBatchPick(id: number, checked: boolean) {
  if (checked) {
    if (!batchSelected.value.includes(id)) batchSelected.value = [...batchSelected.value, id];
  } else {
    batchSelected.value = batchSelected.value.filter(x => x !== id);
  }
}

function toggleBatchAll() {
  batchSelected.value = batchSelected.value.length === sameTypeProjects.value.length
    ? []
    : sameTypeProjects.value.map(p => p.id);
}

/** 下发批量升级：每个项目独立异步任务，逐个跟踪 */
async function submitBatchUpgrade() {
  if (!batchSelected.value.length) {
    message.warning('请先勾选要升级的项目');
    return;
  }
  batchLoading.value = true;
  try {
    // 选了主机文件：逐个项目走单项目入口（后端会先把包推到各自主机的 uploads/）
    if (batchPkg.value.key) {
      const { packagePath, ...cfg } = batchForm.value;
      let ok = 0;
      let fail = 0;
      for (const id of batchSelected.value) {
        try {
          const taskId = await upgradeFromHostFile(id, batchPkg.value.key, cfg);
          if (taskId) {
            ok += 1;
            const p = allProjects.value.find(x => x.id === id);
            trackTask(taskId, p?.projectName || `项目 ${id}`, 'upgrade');
          } else {
            fail += 1;
          }
        } catch {
          fail += 1;
        }
      }
      if (fail === 0) {
        message.success(`已下发 ${ok} 个项目的升级任务`);
      } else {
        message.warning(`已下发 ${ok} 个，${fail} 个触发失败`);
      }
      batchVisible.value = false;
      loadList();
      return;
    }
    // 未选产物：只重启
    const res = await http()
      .post(`${BASE}/project/batch-upgrade`)
      .data({ projectIds: batchSelected.value, config: { ...batchForm.value, packagePath: '' } });
    const results = unwrapResult<any[]>(res) || [];
    let ok = 0;
    let fail = 0;
    for (const r of results) {
      const p = allProjects.value.find(x => x.id === r.projectId);
      if (r.ok && r.taskId) {
        ok += 1;
        trackTask(r.taskId, p?.projectName || `项目 ${r.projectId}`, 'upgrade');
      } else {
        fail += 1;
      }
    }
    if (fail === 0) {
      message.success(`已下发 ${ok} 个项目的升级任务`);
    } else {
      message.warning(`已下发 ${ok} 个，${fail} 个触发失败`);
    }
    batchVisible.value = false;
    loadList();
  } catch {
    message.error('批量升级触发失败');
  } finally {
    batchLoading.value = false;
  }
}

onMounted(() => {
  // 发布管理全局 SSE（与主机资产独立）：任务进度 / 实时日志 / 操作日志共用
  releaseSse.open();
  loadList();
  loadHosts();
  loadGlobalApm();
});

onBeforeUnmount(() => {
  releaseSse.close();
});
</script>

<style scoped>
/* 页面内边距：.tel-page 全局归零，发布管理自己补一圈留白，
   否则标题、按钮、卡片都贴在容器边上（本次「内部添加间距」的根因）。 */
.release-page {
  padding: 24px 28px 30px;
  box-sizing: border-box;
}
.release-page :deep(.re-section-head) {
  margin-bottom: 18px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
  padding: 0;
}

/* ===== 发布卡片（左右结构） ===== */
.release-card {
  position: relative;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  min-height: 172px;
  transition: transform 0.22s var(--ease-out), box-shadow 0.22s var(--ease-out), border-color 0.22s;
}
.release-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--brand-100);
}

/* 左侧媒体：平台色块 / 背景图 */
.card-media {
  position: relative;
  flex: 0 0 112px;
  width: 112px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
}
.card-media.linux { background: linear-gradient(150deg, #3b82f6, #2563eb); }
.card-media.win { background: linear-gradient(150deg, #0ea5e9, #0284c7); }
.card-media.mac { background: linear-gradient(150deg, #8b5cf6, #7c3aed); }
.media-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-ico {
  font-size: 38px;
  line-height: 1;
  color: #fff;
  display: flex;
}
.media-ico :deep(svg) { display: block; }
.media-os {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.92);
}

/* 右上角操作（悬停浮现） */
.card-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.2s, transform 0.2s;
  z-index: 3;
}
.release-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}
.mini-ico {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: background 0.15s, color 0.15s;
}
.mini-ico:hover { color: var(--brand-600); background: #fff; }
.mini-ico.danger:hover { color: var(--el-color-danger); }

/* 右侧详情 */
.card-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 18px 12px;
}
.content-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-right: 64px;
}
.release-name {
  margin: 0;
  font-size: 16px;
  font-weight: 650;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.proj-count {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-fill);
  padding: 2px 8px;
  border-radius: 10px;
}
.host-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 11px 0 9px;
}
.host-chip {
  font-size: 12.5px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host-ip {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  white-space: nowrap;
}
.release-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.release-desc.muted { color: var(--text-tertiary); font-style: italic; }

/* 底部操作 */
.card-footer {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}
.ghost-ico {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  padding: 4px 6px;
  border-radius: 8px;
  transition: background 0.15s, color 0.15s;
}
.ghost-ico:hover { color: var(--brand-600); background: var(--brand-50); }
.enter-link {
  border: none;
  background: transparent;
  color: var(--brand-600);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 6px;
  border-radius: 8px;
  transition: background 0.15s;
}
.enter-link:hover { background: var(--brand-50); }
.enter-link .el-icon { font-size: 14px; }

/* ===== 发布级 SkyWalking APM 注入 ===== */
/* 编辑弹框：左「基础」右「APM」两栏。
   为什么不在手机上堆叠之外还做断点：发布名称/主机这两项是必填主干，APM 是可选下发，
   左右分开后「APM 关着」时右栏也不空（有开关与说明），比原来一长条更容易看出哪些是必填。 */
.rel-edit {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.rel-edit__col {
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle, #eef0f6);
  border-radius: var(--radius-md, 10px);
  background: var(--bg-surface, #fff);
}
/* APM 栏用浅底分色：它是「默认值」，不是发布本身的信息 */
.rel-edit__col--apm {
  background: var(--bg-fill, #f7f8fa);
}
.rel-edit__head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, #eef0f6);
}
.rel-edit__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #1f2430);
}
.rel-edit__note {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-tertiary, #9aa1ad);
}
/* 输入框 + 说明图标：说明收进 tip，行内只留一个 ⓘ */
.apm-row {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}
.apm-tip {
  flex: none;
  display: inline-grid;
  place-items: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 12px;
  line-height: 1;
  color: var(--text-tertiary, #9aa1ad);
  cursor: help;
  user-select: none;
}
.apm-tip:hover {
  color: var(--el-color-primary, #5a4bd9);
}
.rel-edit__form :deep(.el-form-item) {
  margin-bottom: 14px;
}
.rel-edit__form :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
.sw-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
/* 窄屏：两栏改上下，顺序仍是「基础 → APM」 */
@media (max-width: 900px) {
  .rel-edit {
    grid-template-columns: minmax(0, 1fr);
  }
}
/* 主机不可用警示：未开启 SSH 的发布，任何发布动作都会失败，需在选主机时就提示 */
.apm-warn {
  margin-top: 6px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-color-warning-dark-2, #b88230);
  background: var(--el-color-warning-light-9, #fdf6ec);
  border: 1px solid var(--el-color-warning-light-7, #f5dab1);
  border-radius: 8px;
}
.apm-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  font-weight: 600;
  color: #2563eb;
  background: var(--brand-50, #eff6ff);
  border: 1px solid var(--brand-200, #bfdbfe);
  border-radius: 10px;
  padding: 1px 8px;
  white-space: nowrap;
}
.apm-divider-sub {
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary, #6b7280);
}
/* 本机快捷入口：与主机下拉同一行信息层级，按钮是轻量文字按钮 */
.rel-local {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}
.rel-local__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, #ecf5ff);
  border: 1px solid var(--el-color-primary-light-7, #b3d8ff);
  border-radius: 6px;
  cursor: pointer;
}
.rel-local__btn:hover:not(:disabled) {
  border-color: var(--el-color-primary);
}
.rel-local__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.rel-local__hint {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}
.apm-preview {
  margin: 0; padding: 12px 14px; width: 100%; box-sizing: border-box;
  font-family: "Cascadia Code", Consolas, monospace; font-size: 11.5px;
  color: var(--terminal-fg, #e6edf3);
  background: var(--terminal-bg, #0d1117);
  border-radius: var(--radius-md, 8px);
  white-space: pre-wrap; word-break: break-all;
  line-height: 1.6;
}

/* ===== 集群批量升级弹框 ===== */
.batch-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.batch-tip {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--brand-50);
  border: 1px solid var(--brand-100);
}
.batch-tip-ic {
  font-size: 18px;
  color: var(--brand-600);
  flex-shrink: 0;
  margin-top: 1px;
}
.batch-tip-title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.batch-tip-sub {
  margin-top: 4px;
  font-size: 12.5px;
  line-height: 1.65;
  color: var(--text-secondary);
}
.batch-form {
  margin: 0;
}
/* 批量升级的产物来源：已选摘要 / 两个入口 */
.batch-pkg {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.batch-pkg-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12.5px;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.batch-pkg-clear {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  text-decoration: underline;
}
.batch-pkg-actions {
  display: flex;
  gap: 8px;
}
.batch-switches {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  padding: 10px 14px;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.batch-list-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--text-secondary);
}
.blh-title {
  font-weight: 600;
  color: var(--text-primary);
}
.blh-count {
  margin-left: auto;
  font-variant-numeric: tabular-nums;
}
.blh-all {
  border: none;
  background: transparent;
  color: var(--brand-600);
  font-size: 12.5px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}
.blh-all:hover {
  background: var(--brand-50);
}
.batch-list {
  display: flex;
  flex-direction: column;
  max-height: 260px;
  overflow-y: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
}
.batch-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-subtle);
}
.batch-row:last-child {
  border-bottom: none;
}
.batch-row:hover {
  background: var(--bg-fill);
}
.batch-row-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}
.batch-row-release {
  font-size: 12px;
  color: var(--text-tertiary);
}
.batch-row-host {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-secondary);
  font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
}
.batch-row-off {
  font-size: 11.5px;
  color: var(--warning);
}
.batch-empty {
  padding: 22px 0;
  text-align: center;
  font-size: 12.5px;
  color: var(--text-tertiary);
  border: 1px dashed var(--border-default);
  border-radius: 10px;
}
.opt-name {
  float: left;
}
.opt-meta {
  float: right;
  margin-left: 16px;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ===== 主机下拉框宽度限制 ===== */
:deep(.host-select-popper) {
  width: 320px !important;
  max-width: 320px !important;
}
:deep(.host-select-popper .el-select-dropdown__item) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
