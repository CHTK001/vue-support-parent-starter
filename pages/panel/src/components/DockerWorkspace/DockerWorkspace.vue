<template>
  <section class="docker-workspace">
    <ScLayout
      v-model="railTabValue"
      class="docker-layout"
      left-enabled
      :left-width="260"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <template #left>
        <div class="left-panel">
          <div class="left-header"><strong>{{ selectedTabTitle }}</strong></div>
          <div class="left-hint">Docker {{ dockerVersion }}</div>
        </div>
      </template>

      <template #default>
        <div class="main-content">

          <!-- ═══ 概览 ═══ -->
          <template v-if="railTabValue === 'overview'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">系统概览</span>
                <div class="panel-header__right" style="gap:6px">
                  <ElTag v-if="realtimeStatus === 'connected'" type="success" size="small" effect="plain">实时</ElTag>
                  <ElTag v-else type="danger" size="small" effect="plain">离线</ElTag>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="infoLoading" @click="loadInfo" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="infoLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <template v-else>
                  <div class="info-grid">
                    <div v-for="item in overviewCards" :key="item.label" class="info-card">
                      <span class="info-card__label">{{ item.label }}</span>
                      <span class="info-card__value">{{ item.value }}</span>
                    </div>
                  </div>
                  <div class="chart-grid" v-if="realtimeHistory.length > 1">
                    <div class="chart-box">
                      <div class="chart-title">CPU 使用率</div>
                      <div ref="cpuChartRef" class="chart-canvas" />
                    </div>
                    <div class="chart-box">
                      <div class="chart-title">内存使用率</div>
                      <div ref="memChartRef" class="chart-canvas" />
                    </div>
                  </div>
                </template>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 容器 ═══ -->
          <template v-else-if="railTabValue === 'containers'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">容器列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showCreateContainer = true">创建</ElButton>
                  <ElSwitch v-model="showAllContainers" size="small" active-text="全部" inactive-text="运行中" style="margin-right:8px" />
                  <ElButton :icon="RefreshRight" circle size="small" :loading="containersLoading" @click="loadContainers" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="containersLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!containers.length" class="panel-empty"><ElEmpty description="暂无容器" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr>
                      <th>ID</th><th>名称</th><th>镜像</th><th>状态</th>
                      <th>运行时间</th><th>端口</th><th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in containers" :key="c.id">
                      <td class="cell-mono">{{ shortId(c.id) }}</td>
                      <td>{{ containerName(c) }}</td>
                      <td>{{ c.image }}</td>
                      <td><span class="status-dot" :class="`is-${c.state}`" />{{ c.state }}</td>
                      <td>{{ c.status }}</td>
                      <td class="cell-mono">{{ formatPorts(c.ports) }}</td>
                      <td>
                        <ElDropdown trigger="click" @command="(cmd:string)=>handleContainerAction(c.id, cmd)">
                          <ElButton size="small">操作<ElIcon><ArrowDown /></ElIcon></ElButton>
                          <template #dropdown>
                            <ElDropdownMenu>
                              <ElDropdownItem command="start" :disabled="c.state==='running'" icon="VideoPlay">启动</ElDropdownItem>
                              <ElDropdownItem command="stop" :disabled="c.state!=='running'" icon="VideoPause">停止</ElDropdownItem>
                              <ElDropdownItem command="restart" icon="Refresh">重启</ElDropdownItem>
                              <ElDropdownItem command="kill" :disabled="c.state!=='running'" icon="Remove">终止</ElDropdownItem>
                              <ElDropdownItem command="pause" :disabled="c.state!=='running'" icon="CirclePause">暂停</ElDropdownItem>
                              <ElDropdownItem command="unpause" :disabled="c.state!=='paused'" icon="VideoPlay">恢复</ElDropdownItem>
                              <ElDropdownItem divided command="logs" icon="ChatLineSquare">日志</ElDropdownItem>
                              <ElDropdownItem command="stats" icon="DataLine">统计</ElDropdownItem>
                              <ElDropdownItem command="inspect" icon="InfoFilled">详情</ElDropdownItem>
                              <ElDropdownItem command="exec" icon="Monitor">交互式终端</ElDropdownItem>
                              <ElDropdownItem command="process" icon="List">进程</ElDropdownItem>
                              <ElDropdownItem command="diff" icon="List">文件变更</ElDropdownItem>
                              <ElDropdownItem divided command="update" icon="Setting">更新资源</ElDropdownItem>
                              <ElDropdownItem command="network" icon="Connection">连接网络</ElDropdownItem>
                              <ElDropdownItem divided command="rename" icon="Edit">重命名</ElDropdownItem>
                              <ElDropdownItem command="commit" icon="Upload">提交为镜像</ElDropdownItem>
                              <ElDropdownItem divided command="remove" icon="Delete">删除</ElDropdownItem>
                            </ElDropdownMenu>
                          </template>
                        </ElDropdown>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 镜像 ═══ -->
          <template v-else-if="railTabValue === 'images'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">镜像列表</span>
                <div class="panel-header__right">
                  <ElButton v-if="imageSelectedIds.length > 0" size="small" type="danger" :icon="Delete" @click="handleBatchDeleteImages">
                    批量删除 ({{ imageSelectedIds.length }})
                  </ElButton>
                  <ElButton size="small" type="primary" :icon="Plus" @click="showPullImage = true">拉取</ElButton>
                  <ElButton size="small" :icon="DocumentAdd" @click="showBuildImage = true">构建</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="imagesLoading" @click="loadImages" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="imagesLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!sortedImages.length" class="panel-empty"><ElEmpty description="暂无镜像" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr>
                      <th style="width:40px"><ElCheckbox :indeterminate="imageSelectedIds.length > 0 && imageSelectedIds.length < images.length" :model-value="imageSelectedIds.length === sortedImages.length && sortedImages.length > 0" @change="(v:any)=>onImageSelectAll(v)" /></th>
                      <th>ID</th>
                      <th class="sortable-th" @click="toggleImageSort('repotags')">标签 <span v-if="imageSortField==='repotags'">{{ imageSortOrder==='asc'?'▲':'▼' }}</span></th>
                      <th class="sortable-th" @click="toggleImageSort('size')">大小 <span v-if="imageSortField==='size'">{{ imageSortOrder==='asc'?'▲':'▼' }}</span></th>
                      <th class="sortable-th" @click="toggleImageSort('created')">创建时间 <span v-if="imageSortField==='created'">{{ imageSortOrder==='asc'?'▲':'▼' }}</span></th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="img in sortedImages" :key="img.id">
                      <td><ElCheckbox :model-value="imageSelectedIds.includes(img.id)" @change="(v:any)=>onImageSelect(img.id, v)" /></td>
                      <td class="cell-mono">{{ shortId(img.id) }}</td>
                      <td>{{ formatTags(img.repotags) }}</td>
                      <td>{{ formatBytes(img.size) }}</td>
                      <td>{{ formatDate(img.created) }}</td>
                      <td>
                        <ElDropdown trigger="click" @command="(cmd:string)=>handleImageAction(img.id, cmd)">
                          <ElButton size="small">操作<ElIcon><ArrowDown /></ElIcon></ElButton>
                          <template #dropdown>
                            <ElDropdownMenu>
                              <ElDropdownItem command="inspect" icon="InfoFilled">详情</ElDropdownItem>
                              <ElDropdownItem command="tag" icon="Edit">标记</ElDropdownItem>
                              <ElDropdownItem command="push" icon="Upload">推送</ElDropdownItem>
                              <ElDropdownItem divided command="remove" icon="Delete">删除</ElDropdownItem>
                            </ElDropdownMenu>
                          </template>
                        </ElDropdown>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 网络 ═══ -->
          <template v-else-if="railTabValue === 'networks'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">网络列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showCreateNetwork = true">创建</ElButton>
                  <ElButton size="small" :icon="Delete" @click="handlePruneNetworks">清理</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="networksLoading" @click="loadNetworks" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="networksLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!networks.length" class="panel-empty"><ElEmpty description="暂无网络" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>ID</th><th>名称</th><th>驱动</th><th>范围</th><th>容器数</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="n in networks" :key="n.id">
                      <td class="cell-mono">{{ shortId(n.id) }}</td>
                      <td>{{ n.name }}</td>
                      <td>{{ n.driver }}</td>
                      <td>{{ n.scope }}</td>
                      <td>{{ n.containers?.length || 0 }}</td>
                      <td>
                        <ElButton size="small" :icon="InfoFilled" @click="handleInspectNetwork(n.id, n.name)" />
                        <ElButton size="small" :icon="Delete" @click="handleRemoveNetwork(n.id)" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 卷 ═══ -->
          <template v-else-if="railTabValue === 'volumes'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">卷列表</span>
                <div class="panel-header__right">
                  <ElButton size="small" type="primary" :icon="Plus" @click="showCreateVolume = true">创建</ElButton>
                  <ElButton size="small" :icon="Delete" @click="handlePruneVolumes">清理</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="volumesLoading" @click="loadVolumes" />
                </div>
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="volumesLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!volumes.length" class="panel-empty"><ElEmpty description="暂无卷" :image-size="48" /></div>
                <table v-else class="data-table">
                  <thead>
                    <tr><th>名称</th><th>驱动</th><th>挂载点</th><th>操作</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="v in volumes" :key="v.name">
                      <td>{{ v.name }}</td>
                      <td>{{ v.driver }}</td>
                      <td class="cell-mono">{{ v.mountpoint }}</td>
                      <td>
                        <ElButton size="small" :icon="InfoFilled" @click="handleInspectVolume(v.name)" />
                        <ElButton size="small" :icon="Delete" @click="handleRemoveVolume(v.name)" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ═══ 系统 ═══ -->
          <template v-else-if="railTabValue === 'system'">
            <div class="panel-view">
              <div class="panel-header">
                <span class="panel-title">系统信息</span>
                <ElButton :icon="RefreshRight" circle size="small" @click="loadSystemInfo" />
              </div>
              <ElScrollbar class="panel-scroll">
                <div v-if="systemLoading" class="panel-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else class="system-content">
                  <ElDescriptions title="Docker 版本" :column="2" border size="small" style="margin:16px">
                    <ElDescriptionsItem v-for="(v,k) in dockerVersionInfo" :key="k" :label="k">{{ v }}</ElDescriptionsItem>
                  </ElDescriptions>
                  <ElDescriptions title="磁盘使用" :column="2" border size="small" style="margin:16px">
                    <ElDescriptionsItem label="镜像数">{{ diskUsage.imageCount }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="容器数">{{ diskUsage.containerCount }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="卷数">{{ diskUsage.volumeCount }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="镜像大小">{{ formatBytes(diskUsage.imagesSize) }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="容器大小">{{ formatBytes(diskUsage.containersSize) }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="卷大小">{{ formatBytes(diskUsage.volumesSize) }}</ElDescriptionsItem>
                    <ElDescriptionsItem label="可回收">{{ formatBytes(diskUsage.layersSize) }}</ElDescriptionsItem>
                  </ElDescriptions>
                  <div class="panel-actions" style="padding:0 16px 16px">
                    <ElButton type="danger" :icon="Delete" @click="handlePruneAll">清理未使用资源</ElButton>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

        </div>
      </template>
    </ScLayout>

    <!-- ─── 新式日志对话框 ─── -->
    <DockerContainerLogStreamDialog
      v-model:visible="showLogDialog"
      :connection-id="connectionId"
      :container-id="logContainerId"
      :container-name="logContainerName"
    />

    <!-- ─── 新式统计对话框 ─── -->
    <DockerContainerStatsDialog
      v-model:visible="showStatsDialog"
      :connection-id="connectionId"
      :container-id="statsContainerId"
      :container-name="statsContainerName"
    />

    <!-- ─── 新式容器资源更新对话框 ─── -->
    <DockerContainerUpdateDialog
      v-model:visible="showUpdateDialog"
      :connection-id="connectionId"
      :container-id="updateContainerId"
    />

    <!-- ─── 容器进程对话框 ─── -->
    <DockerContainerProcessDialog
      v-model:visible="showProcessDialog"
      :connection-id="connectionId"
      :container-id="processContainerId"
      :container-name="processContainerName"
    />

    <!-- ─── 容器网络管理对话框 ─── -->
    <DockerContainerNetworkDialog
      v-model:visible="showNetworkDialog"
      :connection-id="connectionId"
      :container-id="networkContainerId"
      :container-name="networkContainerName"
    />

    <!-- ─── 交互式终端对话框 ─── -->
    <DockerExecTerminalDialog
      v-model:visible="showExecDialog"
      :binding="null"
      :container-id="execContainerId"
      :connection-id="connectionId"
    />

    <!-- ─── 创建容器对话框 ─── -->
    <ElDialog v-model="showCreateContainer" title="创建容器" width="650px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="镜像名" required>
          <div style="display:flex;gap:6px;width:100%">
            <ElInput v-model="createForm.imageName" placeholder="nginx:latest" style="flex:1" />
            <ElButton size="small" :icon="List" @click="showTemplateBrowser = true">选择模板</ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="容器名"><ElInput v-model="createForm.containerName" placeholder="可选" /></ElFormItem>
        <ElFormItem label="命令"><ElInput v-model="createForm.command" placeholder="如: nginx -g daemon off;" /></ElFormItem>
        <ElFormItem label="重启策略">
          <ElSelect v-model="createForm.restartPolicy" placeholder="默认不重启">
            <ElOption label="无" value="" />
            <ElOption label="总是 (always)" value="always" />
            <ElOption label="失败时 (on-failure)" value="on-failure" />
            <ElOption label="除非停止 (unless-stopped)" value="unless-stopped" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="环境变量">
          <div class="kv-table">
            <div v-for="(item, idx) in createEnvVars" :key="idx" class="kv-row">
              <ElInput v-model="item.key" placeholder="KEY" size="small" style="flex:1" />
              <ElInput v-model="item.value" placeholder="VALUE" size="small" style="flex:2" />
              <ElButton :icon="Delete" size="small" circle @click="createEnvVars.splice(idx, 1)" />
            </div>
            <ElButton size="small" :icon="Plus" @click="createEnvVars.push({ key: '', value: '' })">添加</ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="端口映射">
          <div class="kv-table">
            <div v-for="(item, idx) in createPorts" :key="idx" class="kv-row">
              <ElInput v-model="item.host" placeholder="宿主机端口" size="small" style="flex:1" />
              <span style="padding:0 4px">:</span>
              <ElInput v-model="item.container" placeholder="容器端口" size="small" style="flex:1" />
              <ElButton :icon="Delete" size="small" circle @click="createPorts.splice(idx, 1)" />
            </div>
            <ElButton size="small" :icon="Plus" @click="createPorts.push({ host: '', container: '' })">添加</ElButton>
          </div>
        </ElFormItem>
        <ElFormItem label="挂载卷">
          <div class="kv-table">
            <div v-for="(item, idx) in createVolumes" :key="idx" class="kv-row">
              <ElInput v-model="item.host" placeholder="宿主机路径" size="small" style="flex:2" />
              <span style="padding:0 4px">:</span>
              <ElInput v-model="item.container" placeholder="容器路径" size="small" style="flex:2" />
              <ElButton :icon="Delete" size="small" circle @click="createVolumes.splice(idx, 1)" />
            </div>
            <ElButton size="small" :icon="Plus" @click="createVolumes.push({ host: '', container: '' })">添加</ElButton>
          </div>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateContainer = false">取消</ElButton>
        <ElButton type="primary" :loading="creatingContainer" @click="handleCreateContainer">创建</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 新式拉取镜像对话框 ─── -->
    <DockerImagePullDialog
      v-model:visible="showPullImage"
      :connection-id="connectionId"
      @pulled="handlePullComplete"
      @create-from-image="handleCreateFromImage"
    />

    <!-- ─── 构建镜像对话框 ─── -->
    <ElDialog v-model="showBuildImage" title="构建镜像" width="650px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="Dockerfile" required>
          <ElInput v-model="buildDockerfile" type="textarea" :rows="10" placeholder="FROM nginx:latest&#10;COPY . /usr/share/nginx/html" />
        </ElFormItem>
        <ElFormItem label="标签">
          <ElInput v-model="buildTags" placeholder="my-image:latest, 逗号分隔" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showBuildImage = false">取消</ElButton>
        <ElButton type="primary" :loading="buildingImage" @click="handleBuildImage">构建</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 容器详情对话框（原始 JSON） ─── -->
    <ElDialog v-model="showInspect" title="容器详情" width="800px" destroy-on-close>
      <pre class="inspect-viewer">{{ inspectData }}</pre>
      <template #footer><ElButton @click="showInspect = false">关闭</ElButton></template>
    </ElDialog>

    <!-- ─── 镜像详情对话框 ─── -->
    <ElDialog v-model="showImageInspect" title="镜像详情" width="700px" destroy-on-close>
      <pre class="inspect-viewer">{{ imageInspectData }}</pre>
      <template #footer><ElButton @click="showImageInspect = false">关闭</ElButton></template>
    </ElDialog>

    <!-- ─── 创建网络对话框 ─── -->
    <ElDialog v-model="showCreateNetwork" title="创建网络" width="450px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="网络名" required>
          <ElInput v-model="networkForm.name" placeholder="my-network" />
        </ElFormItem>
        <ElFormItem label="驱动">
          <ElSelect v-model="networkForm.driver">
            <ElOption label="bridge" value="bridge" />
            <ElOption label="overlay" value="overlay" />
            <ElOption label="macvlan" value="macvlan" />
            <ElOption label="host" value="host" />
            <ElOption label="none" value="none" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateNetwork = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreateNetwork">创建</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 创建卷对话框 ─── -->
    <ElDialog v-model="showCreateVolume" title="创建卷" width="450px" destroy-on-close>
      <ElForm label-width="100px">
        <ElFormItem label="卷名" required>
          <ElInput v-model="volumeForm.name" placeholder="my-volume" />
        </ElFormItem>
        <ElFormItem label="驱动">
          <ElSelect v-model="volumeForm.driver">
            <ElOption label="local" value="local" />
            <ElOption label="nfs" value="nfs" />
            <ElOption label="tmpfs" value="tmpfs" />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateVolume = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreateVolume">创建</ElButton>
      </template>
    </ElDialog>

    <!-- ─── 卷详情对话框 ─── -->
    <DockerVolumeInspectDialog
      v-model:visible="showVolumeInspect"
      :connection-id="connectionId"
      :volume-name="inspectVolumeName"
    />

    <!-- ─── 网络详情对话框 ─── -->
    <DockerNetworkInspectDialog
      v-model:visible="showNetworkInspect"
      :connection-id="connectionId"
      :network-id="inspectNetworkId"
      :network-name="inspectNetworkName"
    />

    <!-- ─── 模板浏览器对话框 ─── -->
    <DockerTemplateBrowserDialog
      v-model:visible="showTemplateBrowser"
      @selected="handleSelectPreset"
    />
  </section>
</template>

<script setup lang="ts">
import {
  ArrowDown, ChatLineSquare, Connection, DataLine, Delete, DocumentAdd,
  Edit, InfoFilled, List, Loading, Monitor, Plus, Refresh, RefreshRight,
  Remove, Search, Setting, Upload, VideoPlay, VideoPause,
} from "@element-plus/icons-vue";
import {
  ElButton, ElCheckbox, ElDescriptions, ElDescriptionsItem, ElDialog, ElDropdown,
  ElDropdownItem, ElDropdownMenu, ElEmpty, ElForm, ElFormItem,
  ElIcon, ElInput, ElMessage, ElMessageBox, ElOption, ElScrollbar, ElSelect, ElSwitch, ElTooltip,
} from "element-plus";
import { computed, markRaw, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import ScLayout from "@repo/components/ScLayout";
import * as dockerApi from "../../api/docker";
import DockerContainerStatsDialog from "./DockerContainerStatsDialog.vue";
import DockerContainerLogStreamDialog from "./DockerContainerLogStreamDialog.vue";
import DockerContainerUpdateDialog from "./DockerContainerUpdateDialog.vue";
import DockerContainerProcessDialog from "./DockerContainerProcessDialog.vue";
import DockerContainerNetworkDialog from "./DockerContainerNetworkDialog.vue";
import DockerImagePullDialog from "./DockerImagePullDialog.vue";
import DockerVolumeInspectDialog from "./DockerVolumeInspectDialog.vue";
import DockerNetworkInspectDialog from "./DockerNetworkInspectDialog.vue";
import DockerTemplateBrowserDialog from "./DockerTemplateBrowserDialog.vue";
import DockerExecTerminalDialog from "../ServicePanel/DockerExecTerminalDialog.vue";

const props = defineProps<{ connectionId: string }>();

const railTabs = [
  { name: "overview", title: "概览", icon: markRaw(RefreshRight) },
  { name: "containers", title: "容器", icon: markRaw(VideoPlay) },
  { name: "images", title: "镜像", icon: markRaw(Refresh) },
  { name: "networks", title: "网络", icon: markRaw(DataLine) },
  { name: "volumes", title: "卷", icon: markRaw(List) },
  { name: "system", title: "系统", icon: markRaw(Monitor) },
];
const railTabValue = ref("overview");
const selectedTabTitle = computed(() => railTabs.find(t => t.name === railTabValue.value)?.title || "Docker");

// ─── 概览 ───
const dockerInfo = ref<Record<string, any>>({});
const dockerVersion = ref("");
const infoLoading = ref(false);
const overviewCards = computed(() => [
  { label: "版本", value: dockerInfo.value.serverVersion || "-" },
  { label: "操作系统", value: dockerInfo.value.operatingSystem || "-" },
  { label: "内核", value: dockerInfo.value.kernelVersion || "-" },
  { label: "架构", value: dockerInfo.value.architecture || "-" },
  { label: "CPU", value: dockerInfo.value.nCPU ?? "-" },
  { label: "内存", value: formatBytes(dockerInfo.value.memTotal) },
  { label: "容器总数", value: dockerInfo.value.containers ?? "-" },
  { label: "运行中", value: dockerInfo.value.containersRunning ?? "-" },
  { label: "已暂停", value: dockerInfo.value.containersPaused ?? "-" },
  { label: "已停止", value: dockerInfo.value.containersStopped ?? "-" },
  { label: "镜像数", value: dockerInfo.value.images ?? "-" },
  { label: "存储驱动", value: dockerInfo.value.driver || "-" },
]);

// ─── 容器 ───
const containers = ref<any[]>([]);
const containersLoading = ref(false);
const showAllContainers = ref(false);

// 新式对话框状态
const showLogDialog = ref(false);
const logContainerId = ref("");
const logContainerName = ref("");
const showStatsDialog = ref(false);
const statsContainerId = ref("");
const statsContainerName = ref("");
const showUpdateDialog = ref(false);
const updateContainerId = ref("");
const showProcessDialog = ref(false);
const processContainerId = ref("");
const processContainerName = ref("");
const showNetworkDialog = ref(false);
const networkContainerId = ref("");
const networkContainerName = ref("");
const showExecDialog = ref(false);
const execContainerId = ref("");

const showInspect = ref(false);
const inspectData = ref("");

// 创建容器
const showCreateContainer = ref(false);
const creatingContainer = ref(false);
const createForm = reactive({ imageName: "", containerName: "", command: "", restartPolicy: "" });
const createEnvVars = ref<{ key: string; value: string }[]>([]);
const createPorts = ref<{ host: string; container: string }[]>([]);
const createVolumes = ref<{ host: string; container: string }[]>([]);

// ─── 镜像 ───
const images = ref<any[]>([]);
const imagesLoading = ref(false);
const imageSelectedIds = ref<string[]>([]);
const imageSortField = ref<string>("created");
const imageSortOrder = ref<"asc" | "desc">("desc");

const sortedImages = computed(() => {
  const list = [...images.value];
  const field = imageSortField.value;
  const dir = imageSortOrder.value === "asc" ? 1 : -1;
  list.sort((a, b) => {
    let va: any, vb: any;
    if (field === "created") {
      va = a.created || 0; vb = b.created || 0;
    } else if (field === "size") {
      va = a.size || 0; vb = b.size || 0;
    } else {
      const ta = formatTags(a.repotags) || "";
      const tb = formatTags(b.repotags) || "";
      va = ta.toLowerCase(); vb = tb.toLowerCase();
      return va < vb ? -dir : va > vb ? dir : 0;
    }
    return (va - vb) * dir;
  });
  return list;
});

const toggleImageSort = (field: string) => {
  if (imageSortField.value === field) {
    imageSortOrder.value = imageSortOrder.value === "asc" ? "desc" : "asc";
  } else {
    imageSortField.value = field;
    imageSortOrder.value = field === "created" ? "desc" : "asc";
  }
};

const onImageSelect = (id: string, val: boolean) => {
  if (val) imageSelectedIds.value.push(id);
  else imageSelectedIds.value = imageSelectedIds.value.filter((i) => i !== id);
};

const onImageSelectAll = (val: boolean) => {
  imageSelectedIds.value = val ? sortedImages.value.map((i) => i.id) : [];
};

const handleBatchDeleteImages = async () => {
  const ids = [...imageSelectedIds.value];
  if (ids.length === 0) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 个镜像？`, "批量删除", { type: "warning" });
    for (const imgId of ids) {
      try {
        await dockerApi.removeDockerImage(props.connectionId, imgId, true);
      } catch { /* skip failures */ }
    }
    ElMessage.success(`已删除 ${ids.length} 个镜像`);
    imageSelectedIds.value = [];
    loadImages();
  } catch { /* cancelled */ }
};
const showPullImage = ref(false);
const showBuildImage = ref(false);
const buildingImage = ref(false);
const buildDockerfile = ref("");
const buildTags = ref("");
const showImageInspect = ref(false);
const imageInspectData = ref("");

// ─── 概览实时图表 ───
const cpuChartRef = ref<HTMLElement | null>(null);
const memChartRef = ref<HTMLElement | null>(null);
let cpuChart: any = null;
let memChart: any = null;
let realtimeTimer: ReturnType<typeof setInterval> | null = null;
const realtimeStatus = ref<"connecting" | "connected" | "offline">("offline");
const MAX_POINTS = 60;
const realtimeHistory = ref<{ time: string; cpu: number; mem: number }[]>([]);

const initCpuChart = () => {
  if (!cpuChartRef.value) return;
  const echarts = (window as any).echarts;
  if (!echarts) return;
  cpuChart = echarts.init(cpuChartRef.value);
  cpuChart.setOption({
    grid: { left: 45, right: 10, top: 10, bottom: 25 },
    xAxis: { type: "category", data: [], axisLabel: { fontSize: 10 } },
    yAxis: { type: "value", max: 100, axisLabel: { fontSize: 10, formatter: "{value}%" } },
    series: [{ type: "line", data: [], smooth: true, areaStyle: { opacity: 0.15 }, lineStyle: { width: 2 }, itemStyle: { color: "#409eff" } }],
    tooltip: { trigger: "axis" },
  });
};
const initMemChart = () => {
  if (!memChartRef.value) return;
  const echarts = (window as any).echarts;
  if (!echarts) return;
  memChart = echarts.init(memChartRef.value);
  memChart.setOption({
    grid: { left: 45, right: 10, top: 10, bottom: 25 },
    xAxis: { type: "category", data: [], axisLabel: { fontSize: 10 } },
    yAxis: { type: "value", max: 100, axisLabel: { fontSize: 10, formatter: "{value}%" } },
    series: [{ type: "line", data: [], smooth: true, areaStyle: { opacity: 0.15 }, lineStyle: { width: 2 }, itemStyle: { color: "#22c55e" } }],
    tooltip: { trigger: "axis" },
  });
};
const resizeCharts = () => { cpuChart?.resize(); memChart?.resize(); };

const startRealtimePolling = () => {
  stopRealtimePolling();
  if (!props.connectionId) return;
  realtimeStatus.value = "connecting";
  realtimeHistory.value = [];
  const memTotal = dockerInfo.value?.memTotal || 1;
  const sample = async () => {
    try {
      const res = await dockerApi.fetchDockerInfo(props.connectionId);
      const info = res?.data || {};
      // 读取容器 stats 聚合 CPU/内存
      const containers = await dockerApi.listDockerContainers(props.connectionId, false);
      const containersList = containers?.data || [];
      let cpuSum = 0; let memSum = 0; let count = 0;
      for (const c of containersList) {
        try {
          const statsRes = await dockerApi.fetchDockerContainerStats(props.connectionId, c.id);
          const s = statsRes?.data;
          if (s) {
            cpuSum += parseFloat(s.cpuPercent) || 0;
            memSum += parseFloat(s.memoryUsage) || 0;
            count++;
          }
        } catch { /* skip */ }
      }
      const memPct = memTotal > 0 ? Math.round((memSum / memTotal) * 10000) / 100 : 0;
      const now = new Date();
      const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      realtimeHistory.value.push({ time: ts, cpu: Math.round(cpuSum * 100) / 100, mem: memPct });
      if (realtimeHistory.value.length > MAX_POINTS) realtimeHistory.value.shift();
      updateCharts();
      realtimeStatus.value = "connected";
    } catch { realtimeStatus.value = "offline"; }
  };
  sample();
  realtimeTimer = setInterval(sample, 3000);
};
const stopRealtimePolling = () => {
  if (realtimeTimer) { clearInterval(realtimeTimer); realtimeTimer = null; }
  realtimeStatus.value = "offline";
};
const updateCharts = () => {
  const times = realtimeHistory.value.map((d) => d.time);
  const cpus = realtimeHistory.value.map((d) => d.cpu);
  const mems = realtimeHistory.value.map((d) => d.mem);
  if (cpuChart) cpuChart.setOption({ xAxis: { data: times }, series: [{ data: cpus }] });
  if (memChart) memChart.setOption({ xAxis: { data: times }, series: [{ data: mems }] });
};

// ─── 网络 ───
const networks = ref<any[]>([]);
const networksLoading = ref(false);
const showCreateNetwork = ref(false);
const networkForm = reactive({ name: "", driver: "bridge" });

// ─── 卷 ───
const volumes = ref<any[]>([]);
const volumesLoading = ref(false);
const showCreateVolume = ref(false);
const volumeForm = reactive({ name: "", driver: "local" });

// 卷/网络检查 + 模板
const showVolumeInspect = ref(false);
const inspectVolumeName = ref("");
const showNetworkInspect = ref(false);
const inspectNetworkId = ref("");
const inspectNetworkName = ref("");
const showTemplateBrowser = ref(false);
const pendingImageName = ref("");

// ─── 系统 ───
const systemLoading = ref(false);
const dockerVersionInfo = ref<Record<string, any>>({});
const diskUsage = ref<Record<string, any>>({});

// ═══ 加载 ═══

const loadInfo = async () => {
  infoLoading.value = true;
  try {
    const [pingRes, infoRes] = await Promise.all([
      dockerApi.pingDocker(props.connectionId),
      dockerApi.fetchDockerInfo(props.connectionId),
    ]);
    dockerInfo.value = infoRes?.data || {};
    dockerVersion.value = dockerInfo.value.serverVersion || "";
  } catch { ElMessage.error("加载 Docker 信息失败"); }
  finally { infoLoading.value = false; }
};

const loadContainers = async () => {
  containersLoading.value = true;
  try {
    const res = await dockerApi.listDockerContainers(props.connectionId, showAllContainers.value);
    containers.value = res?.data || [];
  } catch { ElMessage.error("加载容器列表失败"); }
  finally { containersLoading.value = false; }
};

const loadImages = async () => {
  imagesLoading.value = true;
  try {
    const res = await dockerApi.listDockerImages(props.connectionId);
    images.value = res?.data || [];
  } catch { ElMessage.error("加载镜像列表失败"); }
  finally { imagesLoading.value = false; }
};

const loadNetworks = async () => {
  networksLoading.value = true;
  try {
    const res = await dockerApi.listDockerNetworks(props.connectionId);
    networks.value = res?.data || [];
  } catch { ElMessage.error("加载网络列表失败"); }
  finally { networksLoading.value = false; }
};

const loadVolumes = async () => {
  volumesLoading.value = true;
  try {
    const res = await dockerApi.listDockerVolumes(props.connectionId);
    volumes.value = res?.data || [];
  } catch { ElMessage.error("加载卷列表失败"); }
  finally { volumesLoading.value = false; }
};

const loadSystemInfo = async () => {
  systemLoading.value = true;
  try {
    const [ver, du] = await Promise.all([
      dockerApi.fetchDockerVersion(props.connectionId),
      dockerApi.fetchDockerDiskUsage(props.connectionId),
    ]);
    dockerVersionInfo.value = ver?.data || {};
    diskUsage.value = du?.data || {};
  } catch { ElMessage.error("加载系统信息失败"); }
  finally { systemLoading.value = false; }
};

// ═══ 容器操作 ═══

const handleContainerAction = async (containerId: string, cmd: string) => {
  const c = containers.value.find(x => x.id === containerId);
  const cName = c ? containerName(c) : "";
  switch (cmd) {
    case "start": await dockerApi.startDockerContainer(props.connectionId, containerId); break;
    case "stop": await dockerApi.stopDockerContainer(props.connectionId, containerId); break;
    case "restart": await dockerApi.restartDockerContainer(props.connectionId, containerId); break;
    case "kill": await dockerApi.killDockerContainer(props.connectionId, containerId); break;
    case "pause": await dockerApi.pauseDockerContainer(props.connectionId, containerId); break;
    case "unpause": await dockerApi.unpauseDockerContainer(props.connectionId, containerId); break;
    case "logs":
      logContainerId.value = containerId;
      logContainerName.value = cName;
      showLogDialog.value = true;
      return;
    case "stats":
      statsContainerId.value = containerId;
      statsContainerName.value = cName;
      showStatsDialog.value = true;
      return;
    case "inspect": return handleInspect(containerId);
    case "exec":
      execContainerId.value = containerId;
      showExecDialog.value = true;
      return;
    case "process":
      processContainerId.value = containerId;
      processContainerName.value = cName;
      showProcessDialog.value = true;
      return;
    case "diff": return handleDiff(containerId);
    case "update":
      updateContainerId.value = containerId;
      showUpdateDialog.value = true;
      return;
    case "network":
      networkContainerId.value = containerId;
      networkContainerName.value = cName;
      showNetworkDialog.value = true;
      return;
    case "rename": return handleRename(containerId);
    case "commit": return handleCommit(containerId);
    case "remove": return handleRemoveConfirm(containerId);
  }
  ElMessage.success(`容器${cmd}操作已执行`);
  await loadContainers();
};

const handleInspect = async (id: string) => {
  try {
    const res = await dockerApi.inspectDockerContainer(props.connectionId, id);
    inspectData.value = JSON.stringify(res?.data || {}, null, 2);
    showInspect.value = true;
  } catch { ElMessage.error("获取详情失败"); }
};

const handleDiff = async (id: string) => {
  try {
    const res = await dockerApi.fetchDockerContainerDiff(props.connectionId, id);
    inspectData.value = JSON.stringify(res?.data || [], null, 2);
    showInspect.value = true;
  } catch { ElMessage.error("获取文件变更失败"); }
};

const handleRename = async (id: string) => {
  const { value: name } = await ElMessageBox.prompt("输入新名称", "重命名容器", { inputValue: "new-name" });
  if (!name) return;
  try {
    await dockerApi.renameDockerContainer(props.connectionId, id, name);
    ElMessage.success("已重命名");
    await loadContainers();
  } catch { ElMessage.error("重命名失败"); }
};

const handleCommit = async (id: string) => {
  const { value: tag } = await ElMessageBox.prompt("输入镜像标签", "提交为镜像", { inputValue: "my-image:latest" });
  if (!tag) return;
  try {
    const parts = tag.split(":");
    await dockerApi.commitDockerContainer(props.connectionId, id, parts[0], parts[1] || "latest");
    ElMessage.success("已提交");
    await loadImages();
  } catch { ElMessage.error("提交失败"); }
};

const handleRemoveConfirm = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定删除此容器？", "确认");
    await dockerApi.removeDockerContainer(props.connectionId, id, true);
    ElMessage.success("已删除");
    await loadContainers();
  } catch { /* cancelled */ }
};

const handleCreateContainer = async () => {
  if (!createForm.imageName) { ElMessage.warning("请输入镜像名"); return; }
  creatingContainer.value = true;
  try {
    const env: Record<string, string> = {};
    createEnvVars.value.forEach(item => { if (item.key) env[item.key.trim()] = item.value.trim(); });
    const ports: Record<string, string> = {};
    createPorts.value.forEach(item => { if (item.container) ports[item.container.trim()] = item.host.trim() || ""; });
    const volumes: Record<string, string> = {};
    createVolumes.value.forEach(item => { if (item.host && item.container) volumes[item.host.trim()] = item.container.trim(); });
    await dockerApi.createDockerContainer(props.connectionId, {
      imageName: createForm.imageName,
      containerName: createForm.containerName || undefined,
      env: Object.keys(env).length ? env : undefined,
      ports: Object.keys(ports).length ? ports : undefined,
      volumes: Object.keys(volumes).length ? volumes : undefined,
    });
    ElMessage.success("容器已创建");
    showCreateContainer.value = false;
    // Reset form
    createForm.imageName = ""; createForm.containerName = ""; createForm.command = ""; createForm.restartPolicy = "";
    createEnvVars.value = []; createPorts.value = []; createVolumes.value = [];
    await loadContainers();
  } catch { ElMessage.error("创建失败"); }
  finally { creatingContainer.value = false; }
};

// ═══ 镜像操作 ═══

const handleImageAction = async (imageId: string, cmd: string) => {
  switch (cmd) {
    case "inspect": return handleImageInspect(imageId);
    case "tag": return handleImageTag(imageId);
    case "push": return handleImagePush(imageId);
    case "remove": return handleImageRemove(imageId);
  }
};

const handleImageInspect = async (id: string) => {
  try {
    const res = await dockerApi.inspectDockerImage(props.connectionId, id);
    imageInspectData.value = JSON.stringify(res?.data || {}, null, 2);
    showImageInspect.value = true;
  } catch { ElMessage.error("获取镜像详情失败"); }
};

const handleImageTag = async (id: string) => {
  const { value: tag } = await ElMessageBox.prompt("输入仓库:标签", "标记镜像", { inputValue: "my-repo/my-image:latest" });
  if (!tag) return;
  try {
    const idx = tag.lastIndexOf(":");
    const repo = idx > 0 ? tag.substring(0, idx) : tag;
    const t = idx > 0 ? tag.substring(idx + 1) : "latest";
    await dockerApi.tagDockerImage(props.connectionId, id, repo, t);
    ElMessage.success("已标记");
  } catch { ElMessage.error("标记失败"); }
};

const handleImagePush = async (id: string) => {
  await ElMessageBox.confirm("确定推送此镜像？", "确认");
  try {
    await dockerApi.pushDockerImage(props.connectionId, id);
    ElMessage.success("已推送");
  } catch { ElMessage.error("推送失败"); }
};

const handleImageRemove = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定删除此镜像？", "确认");
    await dockerApi.removeDockerImage(props.connectionId, id, true);
    ElMessage.success("已删除");
    await loadImages();
  } catch { /* cancelled */ }
};

const handlePullComplete = async () => {
  await loadImages();
};

const handleBuildImage = async () => {
  if (!buildDockerfile.value) { ElMessage.warning("请输入 Dockerfile"); return; }
  buildingImage.value = true;
  try {
    const tags = buildTags.value ? buildTags.value.split(",").map(s => s.trim()).filter(Boolean) : undefined;
    const res = await dockerApi.buildDockerImage(props.connectionId, buildDockerfile.value, tags);
    showBuildImage.value = false;
    ElMessageBox.alert(res?.data?.buildLog || "(empty)", "构建日志", { dangerouslyUseHTMLString: false });
    await loadImages();
  } catch { ElMessage.error("构建失败"); }
  finally { buildingImage.value = false; }
};

// ═══ 网络操作 ═══

const handleCreateNetwork = async () => {
  if (!networkForm.name) { ElMessage.warning("请输入网络名"); return; }
  try {
    await dockerApi.createDockerNetwork(props.connectionId, networkForm.name, networkForm.driver);
    ElMessage.success("网络已创建");
    showCreateNetwork.value = false;
    await loadNetworks();
  } catch { ElMessage.error("创建失败"); }
};

const handleRemoveNetwork = async (id: string) => {
  try {
    await ElMessageBox.confirm("确定删除此网络？", "确认");
    await dockerApi.removeDockerNetwork(props.connectionId, id);
    ElMessage.success("已删除");
    await loadNetworks();
  } catch { /* cancelled */ }
};

const handlePruneNetworks = async () => {
  try {
    await ElMessageBox.confirm("确定清理未使用的网络？", "确认");
    const res = await dockerApi.pruneDockerNetworks(props.connectionId);
    ElMessage.success(`已清理 ${(res?.data?.networksDeleted || []).length} 个网络`);
    await loadNetworks();
  } catch { /* cancelled */ }
};

// ═══ 卷操作 ═══

const handleCreateVolume = async () => {
  if (!volumeForm.name) { ElMessage.warning("请输入卷名"); return; }
  try {
    await dockerApi.createDockerVolume(props.connectionId, volumeForm.name, volumeForm.driver);
    ElMessage.success("卷已创建");
    showCreateVolume.value = false;
    await loadVolumes();
  } catch { ElMessage.error("创建失败"); }
};

const handleRemoveVolume = async (name: string) => {
  try {
    await ElMessageBox.confirm(`确定删除卷 ${name}？`, "确认");
    await dockerApi.removeDockerVolume(props.connectionId, name, true);
    ElMessage.success("已删除");
    await loadVolumes();
  } catch { /* cancelled */ }
};

const handlePruneVolumes = async () => {
  try {
    await ElMessageBox.confirm("确定清理未使用的卷？", "确认");
    await dockerApi.pruneDockerVolumes(props.connectionId);
    ElMessage.success("已清理");
    await loadVolumes();
  } catch { /* cancelled */ }
};

const handlePruneAll = async () => {
  try {
    await ElMessageBox.confirm("确定清理所有未使用的 Docker 资源？此操作不可撤销。", "确认", { confirmButtonText: "清理", type: "warning" });
    await Promise.all([
      dockerApi.pruneDockerContainers(props.connectionId).catch(() => {}),
      dockerApi.pruneDockerImages(props.connectionId).catch(() => {}),
      dockerApi.pruneDockerNetworks(props.connectionId).catch(() => {}),
      dockerApi.pruneDockerVolumes(props.connectionId).catch(() => {}),
    ]);
    ElMessage.success("已清理");
    await loadSystemInfo();
  } catch { /* cancelled */ }
};

// ═══ 卷/网络检查 + 模板 ═══

const handleInspectVolume = (name: string) => {
  inspectVolumeName.value = name;
  showVolumeInspect.value = true;
};

const handleInspectNetwork = (id: string, name: string) => {
  inspectNetworkId.value = id;
  inspectNetworkName.value = name;
  showNetworkInspect.value = true;
};

const handleCreateFromImage = (imageName: string) => {
  showPullImage.value = false;
  pendingImageName.value = imageName;
  showCreateContainer.value = true;
};

const handleSelectPreset = (key: string, preset: any) => {
  showTemplateBrowser.value = false;
  if (preset.image) createForm.imageName = preset.image;
  if (preset.ports) {
    const ports = preset.ports.split(/[,\s]+/).filter(Boolean);
    createPorts.value = ports.map((p: string) => {
      const parts = p.includes(":") ? p.split(":") : ["", p];
      return { host: parts[0], container: parts[1] || parts[0] };
    });
  }
  if (preset.env) {
    createEnvVars.value = Object.entries(preset.env).map(([key, value]) => ({ key, value: String(value) }));
  }
  if (preset.volumes) {
    createVolumes.value = preset.volumes.map((v: any) => ({ host: v.hostPath, container: v.containerPath }));
  }
};

// ═══ 工具 ═══

const shortId = (id: string) => (id || "").substring(0, 12);
const containerName = (c: any) => {
  const names = c.names || [];
  return names.length ? names[0].replace(/^\//, "") : c.id?.substring(0, 12);
};
const formatPorts = (ports: any[]) => {
  if (!ports?.length) return "-";
  return ports.map((p: any) => `${p.privatePort}${p.publicPort ? `:${p.publicPort}` : ""}/${p.type || "tcp"}`).join(", ");
};
const formatTags = (tags: string[]) => {
  if (!tags?.length) return "<none>";
  return tags.join(", ");
};
const formatBytes = (bytes: number) => {
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(1)} ${units[i]}`;
};
const formatDate = (ts: number) => {
  if (!ts) return "-";
  return new Date(ts * 1000).toLocaleString("zh-CN");
};

// Pre-fill image name from pull dialog
watch(() => showCreateContainer.value, (v) => {
  if (v && pendingImageName.value) {
    createForm.imageName = pendingImageName.value;
    pendingImageName.value = "";
  }
});

onMounted(() => {
  loadInfo();
  loadContainers();
  loadImages();
  loadNetworks();
  loadVolumes();
});

// 概览 tab 时启动实时图表
watch(railTabValue, async (tab) => {
  if (tab === "overview") {
    await nextTick();
    initCpuChart();
    initMemChart();
    startRealtimePolling();
  } else {
    stopRealtimePolling();
  }
});

onUnmounted(() => {
  stopRealtimePolling();
  cpuChart?.dispose();
  memChart?.dispose();
});
</script>

<style scoped lang="scss">
.docker-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.docker-layout { height: 100%; }
.left-panel {
  display: flex; flex-direction: column; height: 100%;
  padding: 16px; background: #f8fafc;
}
.left-header { font-size: 14px; color: #0f2534; margin-bottom: 4px; }
.left-hint { font-size: 12px; color: #9aacb8; }
.main-content {
  display: flex; flex-direction: column; height: 100%;
  min-height: 0; overflow: hidden;
}
.panel-view { display: flex; flex-direction: column; height: 100%; }
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(127,144,155,0.12);
  background: rgba(248,250,252,0.9);
}
.panel-header__right { display: flex; align-items: center; gap: 8px; }
.panel-title { font-size: 15px; font-weight: 700; color: #0f2534; }
.panel-scroll { flex: 1; min-height: 0; }
.panel-loading, .panel-empty { display: flex; align-items: center; justify-content: center; padding: 48px; }
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px; padding: 16px;
}
.info-card {
  display: grid; gap: 6px; padding: 14px;
  border: 1px solid rgba(127,144,155,0.14);
  border-radius: 14px; background: #fff;
}
.info-card__label { font-size: 11px; color: #7a8f9d; }
.info-card__value { font-size: 16px; font-weight: 700; color: #0f2534; line-height: 1; }
.data-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
  th {
    padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600;
    color: #7a8f9d; background: rgba(248,250,252,0.9);
    border-bottom: 1px solid rgba(127,144,155,0.12); white-space: nowrap;
  }
  th.sortable-th {
    cursor: pointer; user-select: none; transition: color .15s;
  }
  th.sortable-th:hover { color: #409eff; }
  td {
    padding: 8px 12px; border-bottom: 1px solid rgba(127,144,155,0.08);
    color: #1e3a4f;
  }
  tr:hover td { background: rgba(59,130,246,0.04); }
}
.cell-mono { font-family: "JetBrains Mono", monospace; font-size: 11px; color: #4a6070; }
.status-dot {
  display: inline-block; width: 7px; height: 7px; border-radius: 50%;
  margin-right: 6px;
  &.is-running { background: #22c55e; }
  &.is-exited { background: #ef4444; }
  &.is-paused { background: #f59e0b; }
  &.is-created { background: #3b82f6; }
}
.inspect-viewer {
  max-height: 500px; padding: 12px; background: #1e293b;
  color: #e2e8f0; font-size: 12px;
  font-family: "JetBrains Mono", monospace; border-radius: 8px;
  overflow: auto; white-space: pre-wrap;
}
.system-content { padding-bottom: 16px; }
.panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.kv-table { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.kv-row { display: flex; align-items: center; gap: 4px; }

/* ─── 实时图表 ─── */
.chart-grid { display: flex; gap: 16px; margin-top: 16px; flex-wrap: wrap; }
.chart-box { flex: 1; min-width: 280px; background: var(--el-fill-color-lighter); border-radius: 10px; padding: 12px; }
.chart-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--el-text-color-primary); }
.chart-canvas { width: 100%; height: 200px; }
</style>