<template>
  <section class="rabbitmq-workspace">
    <ScLayout
      v-model="railTabValue"
      class="rabbitmq-layout"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="52"
    >
      <template #default>
        <div class="main-content">
          <!-- overview -->
          <template v-if="railTabValue === 'overview'">
            <div class="kv">
              <div class="kv-header">
                <div class="kv-hleft">
                  <span class="kv-title">集群概览</span>
                  <ElTag size="small" class="kv-badge">{{ overviewData?.cluster_name || '...' }}</ElTag>
                  <ElTag size="small" type="info" class="kv-badge">{{ rabbitmqVersion }} </ElTag>
                </div>
                <ElButton :icon="RefreshRight" circle size="small" :loading="healthLoading" @click="loadOverview" />
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="healthLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else>
                  <div class="stats-row">
                    <div class="stat-card">
                      <span class="stat-label">节点数</span>
                      <span class="stat-value">{{ overviewData?.object_totals?.nodes ?? '-' }}</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">队列</span>
                      <span class="stat-value">{{ overviewData?.object_totals?.queues ?? '-' }}</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">连接</span>
                      <span class="stat-value">{{ overviewData?.object_totals?.connections ?? '-' }}</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">Channel</span>
                      <span class="stat-value">{{ overviewData?.object_totals?.channels ?? '-' }}</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">交换机</span>
                      <span class="stat-value">{{ overviewData?.object_totals?.exchanges ?? '-' }}</span>
                    </div>
                    <div class="stat-card">
                      <span class="stat-label">消息总数</span>
                      <span class="stat-value">{{ overviewData?.queue_totals?.messages ?? '-' }}</span>
                    </div>
                  </div>
                  <div class="kv-section">
                    <div class="kv-stitle">节点列表</div>
                    <table class="ktable">
                      <thead><tr><th>名称</th><th>运行</th><th>Mem</th><th>Disk</th><th>FD</th></tr></thead>
                      <tbody>
                        <tr v-for="n in nodes" :key="n.name">
                          <td class="mono">{{ shortName(n.name) }}</td>
                          <td><ElTag :type="n.running ? 'success' : 'danger'" size="small">{{ n.running ? '是' : '否' }}</ElTag></td>
                          <td class="mono">{{ formatBytes(n.mem_used) }}</td>
                          <td class="mono">{{ formatBytes(n.disk_free) }}</td>
                          <td class="mono">{{ n.fd_used }}/{{ n.fd_total }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- queues -->
          <template v-else-if="railTabValue === 'queues'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">队列列表</span>
                <div style="display:flex;gap:6px;">
                  <ElButton type="primary" size="small" :icon="Plus" @click="openCreateQueue">创建队列</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="queuesLoading" @click="loadQueues" />
                </div>
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="queuesLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!queues.length" class="kv-empty"><ElEmpty description="暂无队列" :image-size="48" /></div>
                <table v-else class="ktable">
                  <thead><tr><th>名称</th><th>就绪</th><th>未确认</th><th>总数</th><th>消费者</th><th>操作</th></tr></thead>
                  <tbody>
                    <tr v-for="q in queues" :key="q.name">
                      <td><a class="queue-link" @click="viewQueueDetail(q)">{{ q.name }}</a></td>
                      <td>{{ q.messages_ready }}</td>
                      <td>{{ q.messages_unacknowledged }}</td>
                      <td>
                        <ElTag :type="q.messages > 0 ? 'warning' : 'info'" size="small">{{ q.messages }}</ElTag>
                      </td>
                      <td>{{ q.consumers }}</td>
                      <td class="ops-cell">
                        <ElButton size="small" text @click="handlePurgeQueue(q.name)">清空</ElButton>
                        <ElButton size="small" text type="danger" @click="handleDeleteQueue(q.name)">删除</ElButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- exchanges -->
          <template v-else-if="railTabValue === 'exchanges'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">交换机列表</span>
                <div style="display:flex;gap:6px;">
                  <ElButton type="primary" size="small" :icon="Plus" @click="openCreateExchange">创建交换机</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="exchangesLoading" @click="loadExchanges" />
                </div>
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="exchangesLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!exchanges.length" class="kv-empty"><ElEmpty description="暂无交换机" :image-size="48" /></div>
                <table v-else class="ktable">
                  <thead><tr><th>名称</th><th>类型</th><th>特性</th><th>绑定</th><th>操作</th></tr></thead>
                  <tbody>
                    <tr v-for="e in exchanges" :key="e.name">
                      <td><a class="queue-link" @click="viewExchangeDetail(e)">{{ e.name || '(AMQP default)' }}</a></td>
                      <td><ElTag size="small">{{ e.type }}</ElTag></td>
                      <td>
                        <ElTag v-if="e.durable" size="small" type="success">D</ElTag>
                        <ElTag v-if="e.auto_delete" size="small" type="warning">AD</ElTag>
                        <ElTag v-if="e.internal" size="small" type="info">I</ElTag>
                      </td>
                      <td>{{ exchangeBindings(e.name).length }}</td>
                      <td>
                        <ElButton size="small" text @click="openPublish(e.name)">发送</ElButton>
                        <ElButton v-if="e.name" size="small" text type="danger" @click="handleDeleteExchange(e.name)">删除</ElButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- connections -->
          <template v-else-if="railTabValue === 'connections'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">连接 &amp; Channel</span>
                <ElButton :icon="RefreshRight" circle size="small" :loading="connsLoading" @click="loadConnections" />
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="connsLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <template v-else>
                  <div class="kv-stitle">连接 ({{ connections.length }})</div>
                  <table v-if="connections.length" class="ktable">
                    <thead><tr><th>名称</th><th>用户</th><th>状态</th><th>Channels</th><th>协议</th></tr></thead>
                    <tbody>
                      <tr v-for="c in connections" :key="c.name">
                        <td class="mono small">{{ shortName(c.name) }}</td>
                        <td>{{ c.user }}</td>
                        <td><ElTag :type="c.state === 'running' ? 'success' : 'warning'" size="small">{{ c.state }}</ElTag></td>
                        <td>{{ c.channels }}</td>
                        <td>{{ c.protocol }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else class="kv-empty"><ElEmpty description="无活动连接" :image-size="48" /></div>

                  <div class="kv-stitle" style="margin-top:12px;">Channel ({{ channels.length }})</div>
                  <table v-if="channels.length" class="ktable">
                    <thead><tr><th>名称</th><th>连接</th><th>模式</th><th>Unconfirmed</th><th>Prefetch</th></tr></thead>
                    <tbody>
                      <tr v-for="ch in channels" :key="ch.name">
                        <td class="mono small">{{ shortName(ch.name) }}</td>
                        <td class="mono small">{{ shortName(ch.connection_name || '') }}</td>
                        <td>{{ ch.transactional ? 'Tx' : 'Notx' }}</td>
                        <td>{{ ch.unconfirmed }}</td>
                        <td>{{ ch.global_prefetch_count }}</td>
                      </tr>
                    </tbody>
                  </table>
                </template>
              </ElScrollbar>
            </div>
          </template>

          <!-- users -->
          <template v-else-if="railTabValue === 'users'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">用户管理</span>
                <div style="display:flex;gap:6px;">
                  <ElButton type="primary" size="small" :icon="Plus" @click="openCreateUser">创建用户</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="usersLoading" @click="loadUsers" />
                </div>
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="usersLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!users.length" class="kv-empty"><ElEmpty description="暂无用户" :image-size="48" /></div>
                <table v-else class="ktable">
                  <thead><tr><th>用户名</th><th>标签</th><th>权限</th><th>操作</th></tr></thead>
                  <tbody>
                    <tr v-for="u in users" :key="u.name">
                      <td class="mono">{{ u.name }}</td>
                      <td>
                        <ElTag v-for="tag in parseUserTags(u.tags)" :key="tag" size="small" style="margin-right:4px;">{{ tag }}</ElTag>
                        <span v-if="!u.tags" style="color:var(--el-text-color-placeholder);">-</span>
                      </td>
                      <td>
                        <ElButton size="small" text @click="viewUserPermissions(u.name)">查看权限</ElButton>
                      </td>
                      <td class="ops-cell">
                        <ElButton size="small" text @click="openSetPermissions(u.name)">设置权限</ElButton>
                        <ElButton size="small" text type="danger" @click="handleDeleteUser(u.name)">删除</ElButton>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- vhosts -->
          <template v-else-if="railTabValue === 'vhosts'">
            <div class="kv">
              <div class="kv-header">
                <span class="kv-title">虚拟主机管理</span>
                <div style="display:flex;gap:6px;">
                  <ElButton type="primary" size="small" :icon="Plus" @click="openCreateVhost">创建虚拟主机</ElButton>
                  <ElButton :icon="RefreshRight" circle size="small" :loading="vhostsLoading" @click="loadVhosts" />
                </div>
              </div>
              <ElScrollbar class="kv-body">
                <div v-if="vhostsLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
                <div v-else-if="!vhosts.length" class="kv-empty"><ElEmpty description="暂无虚拟主机" :image-size="48" /></div>
                <table v-else class="ktable">
                  <thead><tr><th>名称</th><th>消息总数</th><th>就绪</th><th>未确认</th><th>操作</th></tr></thead>
                  <tbody>
                    <tr v-for="v in vhosts" :key="v.name">
                      <td class="mono">{{ v.name || '/' }}</td>
                      <td>{{ v.messages ?? '-' }}</td>
                      <td>{{ v.messages_ready ?? '-' }}</td>
                      <td>{{ v.messages_unacknowledged ?? '-' }}</td>
                      <td class="ops-cell">
                        <ElButton v-if="v.name !== '/'" size="small" text type="danger" @click="handleDeleteVhost(v.name)">删除</ElButton>
                        <span v-else style="color:var(--el-text-color-placeholder);font-size:12px;">默认</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </ElScrollbar>
            </div>
          </template>

          <!-- ============ Dialogs ============ -->

          <!-- Queue Detail Dialog -->
          <ElDialog v-model="queueDetailVisible" :title="queueDetail?.name || ''" class="rmq-dlg" width="80%" top="3vh">
            <div v-if="queueDetail" class="dlg-body">
              <div class="dlg-meta">
                <div class="dlg-mitem"><span class="dlg-ml">状态</span><ElTag :type="queueDetail.consumers > 0 ? 'success' : 'info'" effect="dark">{{ queueDetail.consumers > 0 ? '活跃' : '空闲' }}</ElTag></div>
                <div class="dlg-mitem"><span class="dlg-ml">就绪/未确认/总数</span><span class="dlg-mv">{{ queueDetail.messages_ready }} / {{ queueDetail.messages_unacknowledged }} / {{ queueDetail.messages }}</span></div>
                <div class="dlg-mitem"><span class="dlg-ml">消费者</span><span class="dlg-mv">{{ queueDetail.consumers }}</span></div>
                <div class="dlg-mitem"><span class="dlg-ml">节点</span><span class="dlg-mv mono">{{ shortName(queueDetail.node || '') }}</span></div>
              </div>
              <div class="kv-stitle">消息消费</div>
              <div class="dlg-tbar">
                <div class="msg-fgroup">
                  <span class="msg-flabel">条数</span>
                  <ElInputNumber v-model="queueMsgCount" :min="1" :max="500" :controls="false" class="msg-inum" />
                </div>
                <ElButton size="small" type="primary" @click="loadQueueMessages">查询</ElButton>
                <ElButton size="small" :icon="Delete" text @click="handlePurgeQueue(queueDetail.name)">清空</ElButton>
              </div>
              <div v-if="queueMsgsLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
              <table v-else-if="queueMessages.length" class="ktable mini" style="margin-top:4px;">
                <thead><tr><th>#</th><th>Routing Key</th><th>Exchange</th><th>Redelivered</th><th>Payload</th></tr></thead>
                <tbody>
                  <tr v-for="(msg, i) in queueMessages" :key="i">
                    <td>{{ i + 1 }}</td>
                    <td class="mono">{{ msg.routing_key || '-' }}</td>
                    <td class="mono">{{ msg.exchange || '-' }}</td>
                    <td>{{ msg.redelivered ? '是' : '否' }}</td>
                    <td class="val">
                      <span v-if="isJson(msg.payload)" class="json">{{ formatJson(msg.payload) }}</span>
                      <span v-else class="raw">{{ msg.payload }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="kv-empty" style="margin-top:4px;"><ElEmpty description="无消息" :image-size="48" /></div>
            </div>
            <template #footer><ElButton @click="queueDetailVisible = false">关闭</ElButton></template>
          </ElDialog>

          <!-- Exchange Detail Dialog -->
          <ElDialog v-model="exchangeDetailVisible" :title="exchangeDetail?.name || '(AMQP default)'" class="rmq-dlg" width="75%" top="3vh">
            <div v-if="exchangeDetail" class="dlg-body">
              <div class="dlg-meta">
                <div class="dlg-mitem"><span class="dlg-ml">类型</span><ElTag>{{ exchangeDetail.type }}</ElTag></div>
                <div class="dlg-mitem"><span class="dlg-ml">特性</span>
                  <ElTag v-if="exchangeDetail.durable" size="small" type="success">Durable</ElTag>
                  <ElTag v-if="exchangeDetail.auto_delete" size="small" type="warning">Auto Delete</ElTag>
                  <ElTag v-if="exchangeDetail.internal" size="small" type="info">Internal</ElTag>
                </div>
              </div>
              <div class="kv-stitle">绑定
                <ElButton v-if="exchangeDetail.name" size="small" text type="primary" style="margin-left:8px;" @click="openCreateBinding(exchangeDetail.name)">创建绑定</ElButton>
              </div>
              <table class="ktable mini">
                <thead><tr><th>来源</th><th>目标</th><th>Routing Key</th><th>参数</th></tr></thead>
                <tbody>
                  <tr v-for="b in exchangeBindings(exchangeDetail.name)" :key="b.id || b.properties_key">
                    <td class="mono">{{ b.source || '-' }}</td>
                    <td class="mono">{{ b.destination || '-' }}</td>
                    <td class="mono">{{ b.routing_key || '-' }}</td>
                    <td class="mono">{{ b.arguments ? JSON.stringify(b.arguments) : '-' }}</td>
                  </tr>
                </tbody>
              </table>
              <div class="kv-stitle" style="margin-top:8px;">发送消息</div>
              <div class="dlg-form">
                <label>Routing Key</label>
                <ElInput v-model="publishRoutingKey" placeholder="routing key" />
                <label>Payload</label>
                <ElInput v-model="publishPayload" type="textarea" :rows="3" placeholder="消息内容" />
              </div>
              <div class="dlg-tbar" style="margin-top:8px;">
                <ElButton type="primary" :loading="publishLoading" @click="handlePublish(exchangeDetail.name)">发送</ElButton>
              </div>
            </div>
            <template #footer><ElButton @click="exchangeDetailVisible = false">关闭</ElButton></template>
          </ElDialog>

          <!-- Create Queue Dialog -->
          <ElDialog v-model="createQueueVisible" title="创建队列" class="rmq-dlg" width="480px">
            <div class="dlg-form">
              <label>队列名称</label>
              <ElInput v-model="createQueueForm.name" placeholder="my-queue" />
              <div style="display:flex;gap:16px;margin-top:10px;">
                <label style="margin:0;display:flex;align-items:center;gap:4px;">
                  <ElSwitch v-model="createQueueForm.durable" /> 持久化
                </label>
                <label style="margin:0;display:flex;align-items:center;gap:4px;">
                  <ElSwitch v-model="createQueueForm.autoDelete" /> 自动删除
                </label>
              </div>
            </div>
            <template #footer>
              <ElButton @click="createQueueVisible = false">取消</ElButton>
              <ElButton type="primary" :loading="createQueueLoading" @click="handleCreateQueue">创建</ElButton>
            </template>
          </ElDialog>

          <!-- Create Exchange Dialog -->
          <ElDialog v-model="createExchangeVisible" title="创建交换机" class="rmq-dlg" width="520px">
            <div class="dlg-form">
              <label>交换机名称</label>
              <ElInput v-model="createExchangeForm.name" placeholder="my-exchange" />
              <label>类型</label>
              <ElSelect v-model="createExchangeForm.type" style="width:100%;">
                <ElOption label="direct" value="direct" />
                <ElOption label="fanout" value="fanout" />
                <ElOption label="topic" value="topic" />
                <ElOption label="headers" value="headers" />
              </ElSelect>
              <div style="display:flex;gap:16px;margin-top:10px;">
                <label style="margin:0;display:flex;align-items:center;gap:4px;">
                  <ElSwitch v-model="createExchangeForm.durable" /> 持久化
                </label>
                <label style="margin:0;display:flex;align-items:center;gap:4px;">
                  <ElSwitch v-model="createExchangeForm.autoDelete" /> 自动删除
                </label>
                <label style="margin:0;display:flex;align-items:center;gap:4px;">
                  <ElSwitch v-model="createExchangeForm.internal" /> 内部
                </label>
              </div>
            </div>
            <template #footer>
              <ElButton @click="createExchangeVisible = false">取消</ElButton>
              <ElButton type="primary" :loading="createExchangeLoading" @click="handleCreateExchange">创建</ElButton>
            </template>
          </ElDialog>

          <!-- Create Binding Dialog -->
          <ElDialog v-model="createBindingVisible" title="创建绑定" class="rmq-dlg" width="520px">
            <div class="dlg-form">
              <label>交换机</label>
              <ElInput v-model="createBindingForm.exchange" disabled />
              <label>队列</label>
              <ElSelect v-model="createBindingForm.queue" filterable allow-create placeholder="选择或输入队列名" style="width:100%;">
                <ElOption v-for="q in queues" :key="q.name" :label="q.name" :value="q.name" />
              </ElSelect>
              <label>Routing Key</label>
              <ElInput v-model="createBindingForm.routingKey" placeholder="routing key (可选)" />
            </div>
            <template #footer>
              <ElButton @click="createBindingVisible = false">取消</ElButton>
              <ElButton type="primary" :loading="createBindingLoading" @click="handleCreateBinding">绑定</ElButton>
            </template>
          </ElDialog>

          <!-- Create User Dialog -->
          <ElDialog v-model="createUserVisible" title="创建用户" class="rmq-dlg" width="480px">
            <div class="dlg-form">
              <label>用户名</label>
              <ElInput v-model="createUserForm.username" placeholder="新用户名" />
              <label>密码</label>
              <ElInput v-model="createUserForm.password" type="password" placeholder="密码" show-password />
              <label>标签</label>
              <ElSelect v-model="createUserForm.tags" multiple filterable allow-create default-first-option style="width:100%;">
                <ElOption label="administrator" value="administrator" />
                <ElOption label="monitoring" value="monitoring" />
                <ElOption label="management" value="management" />
                <ElOption label="policymaker" value="policymaker" />
              </ElSelect>
              <div style="font-size:11px;color:var(--el-text-color-placeholder);margin-top:4px;">标签用逗号分隔，如: administrator,management</div>
            </div>
            <template #footer>
              <ElButton @click="createUserVisible = false">取消</ElButton>
              <ElButton type="primary" :loading="createUserLoading" @click="handleCreateUser">创建</ElButton>
            </template>
          </ElDialog>

          <!-- User Permissions View Dialog -->
          <ElDialog v-model="userPermVisible" :title="'用户权限 - ' + userPermUsername" class="rmq-dlg" width="600px">
            <div v-if="userPermLoading" class="kv-loading"><ElIcon class="is-loading"><Loading /></ElIcon></div>
            <table v-else-if="userPerms.length" class="ktable">
              <thead><tr><th>虚拟主机</th><th>Configure</th><th>Write</th><th>Read</th></tr></thead>
              <tbody>
                <tr v-for="p in userPerms" :key="p.vhost">
                  <td class="mono">{{ p.vhost }}</td>
                  <td class="mono">{{ p.configure }}</td>
                  <td class="mono">{{ p.write }}</td>
                  <td class="mono">{{ p.read }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="kv-empty"><ElEmpty description="无权限配置" :image-size="48" /></div>
            <template #footer><ElButton @click="userPermVisible = false">关闭</ElButton></template>
          </ElDialog>

          <!-- Set Permission Dialog -->
          <ElDialog v-model="setPermVisible" :title="'设置权限 - ' + setPermForm.username" class="rmq-dlg" width="520px">
            <div class="dlg-form">
              <label>虚拟主机</label>
              <ElSelect v-model="setPermForm.vhost" filterable allow-create default-first-option style="width:100%;">
                <ElOption v-for="v in vhosts" :key="v.name" :label="v.name || '/'" :value="v.name || '/'" />
              </ElSelect>
              <label>Configure 正则</label>
              <ElInput v-model="setPermForm.configure" placeholder=".*" />
              <label>Write 正则</label>
              <ElInput v-model="setPermForm.write" placeholder=".*" />
              <label>Read 正则</label>
              <ElInput v-model="setPermForm.read" placeholder=".*" />
            </div>
            <template #footer>
              <ElButton @click="setPermVisible = false">取消</ElButton>
              <ElButton type="primary" :loading="setPermLoading" @click="handleSetPermissions">保存</ElButton>
            </template>
          </ElDialog>

          <!-- Create Vhost Dialog -->
          <ElDialog v-model="createVhostVisible" title="创建虚拟主机" class="rmq-dlg" width="420px">
            <div class="dlg-form">
              <label>虚拟主机名称</label>
              <ElInput v-model="createVhostForm.name" placeholder="my-vhost" />
            </div>
            <template #footer>
              <ElButton @click="createVhostVisible = false">取消</ElButton>
              <ElButton type="primary" :loading="createVhostLoading" @click="handleCreateVhost">创建</ElButton>
            </template>
          </ElDialog>
        </div>
      </template>
    </ScLayout>
  </section>
</template>

<script setup lang="ts">
import {
  ChatDotRound,
  Connection,
  Delete,
  Document,
  FolderOpened,
  Loading,
  Lock,
  Odometer,
  Plus,
  RefreshRight,
  User,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElScrollbar,
  ElSelect,
  ElOption,
  ElSwitch,
  ElTag,
} from "element-plus";
import { computed, markRaw, onMounted, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import {
  fetchRabbitMQOverview,
  listRabbitMQNodes,
  listRabbitMQQueues,
  listRabbitMQExchanges,
  listRabbitMQBindings,
  listRabbitMQConnections,
  listRabbitMQChannels,
  fetchRabbitMQQueueDetail,
  getRabbitMQMessages,
  purgeRabbitMQQueue,
  deleteRabbitMQQueue,
  publishRabbitMQMessage,
  createRabbitMQQueue,
  createRabbitMQExchange,
  deleteRabbitMQExchange,
  createRabbitMQBinding,
  listRabbitMQUsers,
  createRabbitMQUser,
  deleteRabbitMQUser,
  fetchRabbitMQUserPermissions,
  setRabbitMQUserPermissions,
  listRabbitMQVhosts,
  createRabbitMQVhost,
  deleteRabbitMQVhost,
} from "../../api/rabbitmq";

const props = defineProps<{ connectionId: string }>();

const railTabs = [
  { name: "overview", title: "概览", icon: markRaw(Odometer) },
  { name: "queues", title: "队列", icon: markRaw(Document) },
  { name: "exchanges", title: "交换机", icon: markRaw(FolderOpened) },
  { name: "connections", title: "连接", icon: markRaw(Connection) },
  { name: "users", title: "用户", icon: markRaw(User) },
  { name: "vhosts", title: "虚拟主机", icon: markRaw(Lock) },
];
const railTabValue = ref("overview");

// ─── Overview ────────────────────────────────────────────────────────────

const overviewData = ref<Record<string, any>>({});
const nodes = ref<any[]>([]);
const rabbitmqVersion = ref("");
const healthLoading = ref(false);

const loadOverview = async () => {
  healthLoading.value = true;
  try {
    const [ovRes, ndRes] = await Promise.all([
      fetchRabbitMQOverview(props.connectionId),
      listRabbitMQNodes(props.connectionId),
    ]);
    overviewData.value = ovRes?.data || {};
    nodes.value = ndRes?.data || [];
    rabbitmqVersion.value = overviewData.value.rabbitmq_version || "";
  } catch {
    ElMessage.error("加载概览信息失败");
  } finally {
    healthLoading.value = false;
  }
};

// ─── Queues ──────────────────────────────────────────────────────────────

const queues = ref<any[]>([]);
const queuesLoading = ref(false);

const loadQueues = async () => {
  queuesLoading.value = true;
  try {
    const res = await listRabbitMQQueues(props.connectionId);
    queues.value = res?.data || [];
  } catch {
    ElMessage.error("加载队列列表失败");
  } finally {
    queuesLoading.value = false;
  }
};

// ─── Exchanges ───────────────────────────────────────────────────────────

const exchanges = ref<any[]>([]);
const exchangesLoading = ref(false);

const loadExchanges = async () => {
  exchangesLoading.value = true;
  try {
    const res = await listRabbitMQExchanges(props.connectionId);
    exchanges.value = res?.data || [];
  } catch {
    ElMessage.error("加载交换机列表失败");
  } finally {
    exchangesLoading.value = false;
  }
};

// ─── Bindings ────────────────────────────────────────────────────────────

const bindings = ref<any[]>([]);
const bindingsLoading = ref(false);

const loadBindings = async () => {
  bindingsLoading.value = true;
  try {
    const res = await listRabbitMQBindings(props.connectionId);
    bindings.value = res?.data || [];
  } catch {
    // ignore
  } finally {
    bindingsLoading.value = false;
  }
};

const exchangeBindings = (exchangeName: string) => {
  return bindings.value.filter(
    (b) => (b.source || "amq.default") === (exchangeName || "amq.default"),
  );
};

// ─── Connections & Channels ──────────────────────────────────────────────

const connections = ref<any[]>([]);
const channels = ref<any[]>([]);
const connsLoading = ref(false);

const loadConnections = async () => {
  connsLoading.value = true;
  try {
    const [cRes, chRes] = await Promise.all([
      listRabbitMQConnections(props.connectionId),
      listRabbitMQChannels(props.connectionId),
    ]);
    connections.value = cRes?.data || [];
    channels.value = chRes?.data || [];
  } catch {
    ElMessage.error("加载连接信息失败");
  } finally {
    connsLoading.value = false;
  }
};

// ─── Queue Detail Dialog ─────────────────────────────────────────────────

const queueDetailVisible = ref(false);
const queueDetail = ref<Record<string, any> | null>(null);
const queueMessages = ref<any[]>([]);
const queueMsgCount = ref(10);
const queueMsgsLoading = ref(false);

const viewQueueDetail = async (q: any) => {
  try {
    const res = await fetchRabbitMQQueueDetail(props.connectionId, q.name);
    queueDetail.value = res?.data || q;
    queueDetailVisible.value = true;
    queueMessages.value = [];
  } catch {
    ElMessage.error("加载队列详情失败");
  }
};

const loadQueueMessages = async () => {
  if (!queueDetail.value) return;
  queueMsgsLoading.value = true;
  try {
    const res = await getRabbitMQMessages(
      props.connectionId,
      queueDetail.value.name,
      queueMsgCount.value,
    );
    queueMessages.value = res?.data || [];
  } catch {
    ElMessage.error("消费消息失败");
  } finally {
    queueMsgsLoading.value = false;
  }
};

// ─── Exchange Detail Dialog ──────────────────────────────────────────────

const exchangeDetailVisible = ref(false);
const exchangeDetail = ref<Record<string, any> | null>(null);
const publishRoutingKey = ref("");
const publishPayload = ref("");
const publishLoading = ref(false);

const viewExchangeDetail = async (e: any) => {
  exchangeDetail.value = e;
  exchangeDetailVisible.value = true;
  publishRoutingKey.value = "";
  publishPayload.value = "";
};

const openPublish = (exchangeName: string) => {
  publishRoutingKey.value = "";
  publishPayload.value = "";
  publishLoading.value = false;
  // Use a lightweight approach: prompt in a dialog
  exchangeDetailVisible.value = true;
  // Load exchange detail for context
  const found = exchanges.value.find((e) => e.name === exchangeName);
  exchangeDetail.value = found || null;
};

// ─── Actions ─────────────────────────────────────────────────────────────

const handlePurgeQueue = async (queueName: string) => {
  try {
    await ElMessageBox.confirm(`确定清空队列 "${queueName}" 中的所有消息？`, "确认", {
      confirmButtonText: "清空",
      cancelButtonText: "取消",
      type: "warning",
    });
    await purgeRabbitMQQueue(props.connectionId, queueName);
    ElMessage.success("队列已清空");
    await loadQueues();
    if (queueDetail.value?.name === queueName) {
      queueDetail.value.messages = 0;
      queueDetail.value.messages_ready = 0;
      queueMessages.value = [];
    }
  } catch {
    // cancelled
  }
};

const handlePublish = async (exchangeName: string) => {
  publishLoading.value = true;
  try {
    await publishRabbitMQMessage(
      props.connectionId,
      exchangeName,
      publishRoutingKey.value,
      publishPayload.value,
    );
    ElMessage.success("消息已发送");
    publishRoutingKey.value = "";
    publishPayload.value = "";
  } catch {
    ElMessage.error("消息发送失败");
  } finally {
    publishLoading.value = false;
  }
};

// ─── Create Queue ───────────────────────────────────────────────────────

const createQueueVisible = ref(false);
const createQueueLoading = ref(false);
const createQueueForm = ref({ name: "", durable: true, autoDelete: false });

const openCreateQueue = () => {
  createQueueForm.value = { name: "", durable: true, autoDelete: false };
  createQueueVisible.value = true;
};

const handleCreateQueue = async () => {
  if (!createQueueForm.value.name.trim()) {
    ElMessage.warning("请输入队列名称");
    return;
  }
  createQueueLoading.value = true;
  try {
    await createRabbitMQQueue(
      props.connectionId,
      createQueueForm.value.name,
      createQueueForm.value.durable,
      createQueueForm.value.autoDelete,
    );
    ElMessage.success("队列创建成功");
    createQueueVisible.value = false;
    await loadQueues();
  } catch {
    ElMessage.error("创建队列失败");
  } finally {
    createQueueLoading.value = false;
  }
};

// ─── Delete Queue ───────────────────────────────────────────────────────

const handleDeleteQueue = async (queueName: string) => {
  try {
    await ElMessageBox.confirm(`确定删除队列 "${queueName}"？此操作不可撤销！`, "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteRabbitMQQueue(props.connectionId, queueName);
    ElMessage.success("队列已删除");
    await loadQueues();
  } catch {
    // cancelled
  }
};

// ─── Create Exchange ────────────────────────────────────────────────────

const createExchangeVisible = ref(false);
const createExchangeLoading = ref(false);
const createExchangeForm = ref({ name: "", type: "direct", durable: true, autoDelete: false, internal: false });

const openCreateExchange = () => {
  createExchangeForm.value = { name: "", type: "direct", durable: true, autoDelete: false, internal: false };
  createExchangeVisible.value = true;
};

const handleCreateExchange = async () => {
  if (!createExchangeForm.value.name.trim()) {
    ElMessage.warning("请输入交换机名称");
    return;
  }
  createExchangeLoading.value = true;
  try {
    await createRabbitMQExchange(
      props.connectionId,
      createExchangeForm.value.name,
      createExchangeForm.value.type,
      createExchangeForm.value.durable,
      createExchangeForm.value.autoDelete,
      createExchangeForm.value.internal,
    );
    ElMessage.success("交换机创建成功");
    createExchangeVisible.value = false;
    await loadExchanges();
    await loadBindings();
  } catch {
    ElMessage.error("创建交换机失败");
  } finally {
    createExchangeLoading.value = false;
  }
};

// ─── Delete Exchange ────────────────────────────────────────────────────

const handleDeleteExchange = async (exchangeName: string) => {
  try {
    await ElMessageBox.confirm(`确定删除交换机 "${exchangeName}"？此操作不可撤销！`, "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteRabbitMQExchange(props.connectionId, exchangeName);
    ElMessage.success("交换机已删除");
    await loadExchanges();
    await loadBindings();
  } catch {
    // cancelled
  }
};

// ─── Create Binding ─────────────────────────────────────────────────────

const createBindingVisible = ref(false);
const createBindingLoading = ref(false);
const createBindingForm = ref({ exchange: "", queue: "", routingKey: "" });

const openCreateBinding = (exchangeName: string) => {
  createBindingForm.value = { exchange: exchangeName, queue: "", routingKey: "" };
  createBindingVisible.value = true;
};

const handleCreateBinding = async () => {
  if (!createBindingForm.value.queue.trim()) {
    ElMessage.warning("请选择队列");
    return;
  }
  createBindingLoading.value = true;
  try {
    await createRabbitMQBinding(
      props.connectionId,
      createBindingForm.value.exchange,
      createBindingForm.value.queue,
      createBindingForm.value.routingKey,
    );
    ElMessage.success("绑定创建成功");
    createBindingVisible.value = false;
    await loadBindings();
  } catch {
    ElMessage.error("创建绑定失败");
  } finally {
    createBindingLoading.value = false;
  }
};

// ─── Users ──────────────────────────────────────────────────────────────

const users = ref<any[]>([]);
const usersLoading = ref(false);

const loadUsers = async () => {
  usersLoading.value = true;
  try {
    const res = await listRabbitMQUsers(props.connectionId);
    users.value = res?.data || [];
  } catch {
    ElMessage.error("加载用户列表失败");
  } finally {
    usersLoading.value = false;
  }
};

const parseUserTags = (tags: string | null): string[] => {
  if (!tags) return [];
  return tags.split(",").map((t: string) => t.trim()).filter(Boolean);
};

// Create User
const createUserVisible = ref(false);
const createUserLoading = ref(false);
const createUserForm = ref({ username: "", password: "", tags: [] as string[] });

const openCreateUser = () => {
  createUserForm.value = { username: "", password: "", tags: [] };
  createUserVisible.value = true;
};

const handleCreateUser = async () => {
  if (!createUserForm.value.username.trim()) {
    ElMessage.warning("请输入用户名");
    return;
  }
  if (!createUserForm.value.password.trim()) {
    ElMessage.warning("请输入密码");
    return;
  }
  createUserLoading.value = true;
  try {
    await createRabbitMQUser(
      props.connectionId,
      createUserForm.value.username,
      createUserForm.value.password,
      createUserForm.value.tags.join(","),
    );
    ElMessage.success("用户创建成功");
    createUserVisible.value = false;
    await loadUsers();
  } catch {
    ElMessage.error("创建用户失败");
  } finally {
    createUserLoading.value = false;
  }
};

// Delete User
const handleDeleteUser = async (username: string) => {
  try {
    await ElMessageBox.confirm(`确定删除用户 "${username}"？此操作不可撤销！`, "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteRabbitMQUser(props.connectionId, username);
    ElMessage.success("用户已删除");
    await loadUsers();
  } catch {
    // cancelled
  }
};

// View Permissions
const userPermVisible = ref(false);
const userPermUsername = ref("");
const userPerms = ref<any[]>([]);
const userPermLoading = ref(false);

const viewUserPermissions = async (username: string) => {
  userPermUsername.value = username;
  userPermVisible.value = true;
  userPermLoading.value = true;
  userPerms.value = [];
  try {
    const res = await fetchRabbitMQUserPermissions(props.connectionId, username);
    userPerms.value = res?.data || [];
  } catch {
    userPerms.value = [];
  } finally {
    userPermLoading.value = false;
  }
};

// Set Permissions
const setPermVisible = ref(false);
const setPermLoading = ref(false);
const setPermForm = ref({ username: "", vhost: "/", configure: ".*", write: ".*", read: ".*" });

const openSetPermissions = (username: string) => {
  setPermForm.value = { username, vhost: "/", configure: ".*", write: ".*", read: ".*" };
  setPermVisible.value = true;
  // Ensure vhosts are loaded for the dropdown
  if (!vhosts.value.length) loadVhosts();
};

const handleSetPermissions = async () => {
  setPermLoading.value = true;
  try {
    await setRabbitMQUserPermissions(
      props.connectionId,
      setPermForm.value.username,
      setPermForm.value.vhost,
      setPermForm.value.configure,
      setPermForm.value.write,
      setPermForm.value.read,
    );
    ElMessage.success("权限设置成功");
    setPermVisible.value = false;
  } catch {
    ElMessage.error("设置权限失败");
  } finally {
    setPermLoading.value = false;
  }
};

// ─── Vhosts ─────────────────────────────────────────────────────────────

const vhosts = ref<any[]>([]);
const vhostsLoading = ref(false);

const loadVhosts = async () => {
  vhostsLoading.value = true;
  try {
    const res = await listRabbitMQVhosts(props.connectionId);
    vhosts.value = res?.data || [];
  } catch {
    ElMessage.error("加载虚拟主机列表失败");
  } finally {
    vhostsLoading.value = false;
  }
};

// Create Vhost
const createVhostVisible = ref(false);
const createVhostLoading = ref(false);
const createVhostForm = ref({ name: "" });

const openCreateVhost = () => {
  createVhostForm.value = { name: "" };
  createVhostVisible.value = true;
};

const handleCreateVhost = async () => {
  if (!createVhostForm.value.name.trim()) {
    ElMessage.warning("请输入虚拟主机名称");
    return;
  }
  createVhostLoading.value = true;
  try {
    await createRabbitMQVhost(props.connectionId, createVhostForm.value.name);
    ElMessage.success("虚拟主机创建成功");
    createVhostVisible.value = false;
    await loadVhosts();
  } catch {
    ElMessage.error("创建虚拟主机失败");
  } finally {
    createVhostLoading.value = false;
  }
};

// Delete Vhost
const handleDeleteVhost = async (vhostName: string) => {
  try {
    await ElMessageBox.confirm(`确定删除虚拟主机 "${vhostName}"？此操作会删除该主机下的所有队列和交换机！`, "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await deleteRabbitMQVhost(props.connectionId, vhostName);
    ElMessage.success("虚拟主机已删除");
    await loadVhosts();
  } catch {
    // cancelled
  }
};

// ─── Utilities ───────────────────────────────────────────────────────────

const shortName = (name: string) => {
  if (!name) return "-";
  const parts = name.split("/");
  return parts[parts.length - 1] || name;
};

const formatBytes = (bytes: number) => {
  if (bytes == null) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(1)} ${units[i]}`;
};

const isJson = (str: string) => {
  if (!str || typeof str !== "string") return false;
  const s = str.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return false;
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
};

const formatJson = (str: string) => {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
};

// ─── Init ────────────────────────────────────────────────────────────────

onMounted(async () => {
  await Promise.all([
    loadOverview(),
    loadQueues(),
    loadExchanges(),
    loadBindings(),
    loadUsers(),
    loadVhosts(),
  ]);
});
</script>

<style scoped>
/* ─── RabbitMQ Workspace ─── CSS Variables Modern Theme ─── */
.rabbitmq-workspace {
  height: 100%;
  background: var(--el-bg-color);
}
.rabbitmq-layout {
  height: 100%;
}
.main-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ─── Shared: same as KafkaWorkspace ─── */
.kv-loading,
.kv-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.kv {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.kv-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}
.kv-hleft {
  display: flex;
  align-items: center;
  gap: 8px;
}
.kv-hright {
  display: flex;
  align-items: center;
  gap: 6px;
}
.kv-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.kv-badge {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  border: none;
}
.kv-body {
  flex: 1;
  padding: 0;
}
.kv-section {
  margin-top: 0;
}
.kv-stitle {
  padding: 12px 16px 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  letter-spacing: .4px;
}

/* ─── Stats Cards ─── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  padding: 16px 20px;
}
.stat-card {
  background: var(--el-fill-color-light);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--el-border-color-light);
  position: relative;
  overflow: hidden;
  transition: transform .2s, box-shadow .2s;
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 3px; height: 100%;
    border-radius: 0 2px 2px 0;
    background: linear-gradient(180deg, var(--el-color-primary), #ec4899);
    opacity: .5;
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,.08);
  }
}
.stat-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: .4px;
  font-weight: 600;
}
.stat-value {
  font-size: 22px;
  font-weight: 700;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  color: var(--el-text-color-primary);
}

/* ─── Tables ─── */
.ktable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  th {
    text-align: left;
    padding: 10px 14px;
    font-size: 11px;
    font-weight: 700;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-light);
    letter-spacing: .3px;
    white-space: nowrap;
  }
  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-regular);
    transition: background .12s;
  }
  tr {
    transition: background .12s;
    &:hover td { background: var(--el-color-primary-light-9); }
    &:last-child td { border-bottom: none; }
  }
  &.mini {
    font-size: 12px;
    th, td { padding: 7px 10px; }
    th { font-size: 10px; }
  }
}

/* ─── Links ─── */
.queue-link {
  color: var(--el-color-primary);
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  transition: color .15s;
  &:hover {
    text-decoration: underline;
    color: var(--el-color-primary-light-3);
    text-underline-offset: 2px;
  }
}
.ops-cell {
  white-space: nowrap;
}

/* ─── Shared typography ─── */
.mono {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: .92em;
}
.mono.small {
  font-size: .8em;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.val {
  max-width: 360px;
  overflow-x: auto;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: .92em;
  .json {
    white-space: pre-wrap;
    color: var(--el-color-success);
    font-weight: 500;
  }
  .raw {
    white-space: pre-wrap;
    word-break: break-all;
  }
}

/* ─── Dialogs ─── */
:deep(.rmq-dlg) {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
  }
  .el-dialog__header {
    padding: 20px 24px 0;
    .el-dialog__title { font-size: 17px; font-weight: 700; }
  }
  .el-dialog__body { padding: 18px 24px; }
  .el-dialog__footer {
    padding: 0 24px 18px;
    border-top: 1px solid var(--el-border-color-light);
    padding-top: 14px;
  }
}
.dlg-body {
  padding: 0;
  display: grid;
  gap: 14px;
}
.dlg-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  background: var(--el-fill-color-light);
  border-radius: 10px;
  padding: 14px 18px;
  border: 1px solid var(--el-border-color-lighter);
}
.dlg-mitem {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dlg-ml {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: .3px;
  font-weight: 600;
}
.dlg-mv {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dlg-tbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dlg-thint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex: 1;
}
.dlg-form label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin: 8px 0 3px;
}

/* ─── Message filters reused ─── */
.msg-fgroup {
  display: flex;
  align-items: center;
  gap: 4px;
}
.msg-flabel {
  font-size: 12px;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}
.msg-inum {
  width: 80px;
}
</style>
