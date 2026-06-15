<template>
  <section class="hub-shell">
    <header class="hub-toolbar">
      <div class="hub-toolbar__title">
        <small>Panel Workspace Hub</small>
        <strong>数据源管理</strong>
        <span
          >工作台只能从已保存的数据源进入，连接配置已为 JDBC / Redis
          预留。</span
        >
      </div>

      <div class="hub-toolbar__actions">
        <label class="hub-search">
          <ElIcon><Search /></ElIcon>
          <ElInput
            :model-value="keyword"
            clearable
            placeholder="搜索名称 / 主机 / 数据库"
            @update:model-value="keyword = String($event || '')"
          />
        </label>
        <ElButton
          v-if="selectedJdbcSources.length"
          type="primary"
          plain
          @click="openSelectedJdbcConsole"
        >
          ?? JDBC ????{{ selectedJdbcSources.length }}?
        </ElButton>
        <ElButton circle :icon="RefreshRight" @click="keyword = ''" />
        <ElButton circle type="primary" @click="openCreateDialog">
          <ElIcon><Plus /></ElIcon>
        </ElButton>
        <ElTooltip content="管理配置" placement="bottom">
          <ElButton circle @click="adminVisible = true">
            <IconifyIconOnline icon="ep:setting" />
          </ElButton>
        </ElTooltip>
      </div>
    </header>

    <div class="hub-summary">
      <article class="summary-chip">
        <small>已保存</small>
        <strong>{{ sourceList.length }}</strong>
      </article>
      <article class="summary-chip">
        <small>缓存连接</small>
        <strong>{{ cachedCount }}</strong>
      </article>
      <article class="summary-chip">
        <small>收藏</small>
        <strong>{{ favoriteCount }}</strong>
      </article>
    </div>

    <div class="hub-grid">
      <article
        v-for="row in sourceList"
        :key="row.sourceId"
        class="source-card"
        :class="{ 'source-card--selected': isSelectedJdbcSource(row) }"
        @dblclick="$emit('open-source', row)"
      >
        <div class="source-card__head">
          <div class="source-card__identity">
            <span class="source-card__avatar">
              <ElIcon>
                <component :is="sourceAvatarIcon(row.sourceType)" />
              </ElIcon>
            </span>
            <div>
              <el-tooltip :content="row.host + ':' + row.port">
                <strong>{{ row.connectionName }}</strong>
              </el-tooltip>
              <span
                >
                {{ row.databaseName || "-" }}</span
              >
            </div>
          </div>
          <div class="source-card__head-actions">
            <ElCheckbox
              v-if="isJdbcRow(row)"
              :model-value="isSelectedJdbcSource(row)"
              @click.stop
              @update:model-value="toggleJdbcSelection(row, Boolean($event))"
            />
            <button
              class="source-card__icon-btn source-card__icon-btn--edit source-card__hover-only"
              type="button"
              @click.stop="openEditDialog(row)"
            >
              <ElIcon><EditPen /></ElIcon>
            </button>
            <button
              class="source-card__icon-btn source-card__icon-btn--delete source-card__hover-only"
              type="button"
              @click.stop="$emit('delete-source', row.sourceId)"
            >
              <ElIcon><Delete /></ElIcon>
            </button>
           
            <button
              class="source-card__icon-btn source-card__icon-btn--favorite"
              :class="{ 'source-card__icon-btn--favorite-active': row.favorite }"
              type="button"
              @click.stop="$emit('toggle-favorite', row.sourceId)"
            >
              <ElIcon><Star /></ElIcon>
            </button>
          </div>
        </div>

        <div class="source-card__strip">
          <ScTag class="source-card__type" size="small" effect="plain">{{
            row.sourceType
          }}</ScTag>
          <span class="source-card__updated">{{
            formatTime(row.updatedAt)
          }}</span>
        </div>

        <dl class="source-card__facts">
          <div class="source-card__fact">
            <dt>地址</dt>
            <dd>{{ row.host }}:{{ row.port }}</dd>
          </div>
          <div class="source-card__fact">
            <dt>数据库</dt>
            <dd>{{ row.databaseName || "未指定" }}</dd>
          </div>
          <div class="source-card__fact">
            <dt>账号</dt>
            <dd>{{ row.username || "未填写" }}</dd>
          </div>
        </dl>

        <p class="source-card__note">
          {{ row.note || "未填写备注" }}
        </p>

        <div class="source-card__meta-strip">
          <el-tag type="primary" size="small" v-if="row.environment">{{
            parseEnvironement(row.environment)
          }}</el-tag>
          <span v-if="row.owner">Owner {{ row.owner }}</span>
          <span v-if="row.detectedVersion">{{ row.detectedVersion }}</span>
          <span v-if="row.lastLatencyMs">最近 {{ row.lastLatencyMs }} ms</span>
        </div>

        <div class="source-card__footer">
          <ElButton
            class="source-card__open"
            :disabled="
              row.sourceType !== 'JDBC' &&
              row.sourceType !== 'REDIS' &&
              row.sourceType !== 'MONGODB' &&
              row.sourceType !== 'ZOOKEEPER' &&
              row.sourceType !== 'PROMETHEUS' &&
              row.sourceType !== 'INFLUXDB2' &&
              row.sourceType !== 'INFLUXDB3' &&
              row.sourceType !== 'NACOS' &&
              row.sourceType !== 'NGINX' &&
              row.sourceType !== 'SSH' &&
              row.sourceType !== 'DOCKER' &&
              row.sourceType !== 'KAFKA' &&
              row.sourceType !== 'RABBITMQ' &&
              row.sourceType !== 'MQTT'
            "
            type="primary"
            @click.stop="$emit('open-source', row)"
          >
            <ElIcon><FolderOpened /></ElIcon>
            打开工作台
          </ElButton>
        </div>
      </article>

      <div v-if="!sourceList.length" class="hub-empty">
        <ElEmpty description="先保存一个数据源，再从这里进入工作台。" />
      </div>
    </div>

    <ScDialog
      v-model="dialogVisible"
      :border-radius="28"
      width="760px"
      title="连接配置"
      mode="element"
      :show-confirm-button="false"
      :show-cancel-button="false"
      :show-footer="false"
    >
      <div class="dialog-shell">
        <div class="dialog-grid">
          <label class="field">
            <span class="field__label field__label--required">数据源类型</span>
            <ElSelect
              :model-value="modelValue.sourceType"
              placeholder="选择数据源类型"
              @update:model-value="
                handleSourceTypeChange(String($event || 'JDBC'))
              "
            >
              <ElOption
                v-for="option in sourceTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.sourceType }"
            >
              {{ fieldErrors.sourceType || " " }}
            </small>
          </label>

          <label v-if="isJdbcSource" class="field field--full">
            <span class="field__label field__label--required">数据库类型</span>
            <ScSelect
              :model-value="modelValue.jdbcDialectType"
              :columns="3"
              :gap="10"
              :options="jdbcDialectOptions"
              layout="icon"
              @update:model-value="
                handleJdbcDialectChange(String($event || 'MYSQL'))
              "
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.jdbcDialectType }"
            >
              {{ fieldErrors.jdbcDialectType || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label field__label--required">名称</span>
            <ElInput
              :model-value="modelValue.connectionName"
              placeholder="例如：生产 MySQL / 财务库"
              @update:model-value="updateField('connectionName', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.connectionName }"
            >
              {{ fieldErrors.connectionName || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label field__label--required">主机</span>
            <ElInput
              :model-value="modelValue.host"
              placeholder="172.16.0.40"
              @update:model-value="updateField('host', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.host }"
            >
              {{ fieldErrors.host || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label field__label--required">端口</span>
            <ElInputNumber
              :controls="false"
              :min="0"
              :model-value="modelValue.port"
              @update:model-value="updateNumberField('port', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.port }"
            >
              {{ fieldErrors.port || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label">{{ databaseLabel }}</span>
            <ElInput
              :model-value="modelValue.databaseName"
              :placeholder="databasePlaceholder"
              @update:model-value="updateField('databaseName', $event)"
            />
          </label>

          <label class="field field--full">
            <span class="field__label">{{ protocolLabel }}</span>
            <ElInput
              :model-value="modelValue.protocol"
              :placeholder="protocolPlaceholder"
              @update:model-value="updateField('protocol', $event)"
            />
          </label>


          <label v-if="isJdbcSource" class="field field--full">
            <span class="field__label field__label--required">驱动类</span>
            <!-- 自定义类型：纯文本输入 -->
            <ElInput
              v-if="modelValue.jdbcDialectType === 'CUSTOM'"
              :model-value="modelValue.driverClassName"
              placeholder="例如：com.example.jdbc.Driver"
              @update:model-value="
                updateField('driverClassName', String($event || ''))
              "
            />
            <!-- 其他类型：下拉 + 可自定义输入 -->
            <ElSelect
              v-else
              :model-value="modelValue.driverClassName"
              allow-create
              default-first-option
              filterable
              placeholder="选择或输入 JDBC Driver"
              @update:model-value="
                updateField('driverClassName', String($event || ''))
              "
            >
              <ElOption
                v-for="option in driverClassOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.driverClassName }"
            >
              {{ fieldErrors.driverClassName || " " }}
            </small>
          </label>

          <label v-if="isJdbcSource" class="field field--full">
            <span class="field__label">驱动包</span>
            <div class="field__upload">
              <div class="field__upload-row">
                <ElUpload
                  :auto-upload="false"
                  :show-file-list="false"
                  accept=".jar"
                  :before-upload="handleBeforeDriverUpload"
                >
                  <ElButton :loading="uploadingDriver" plain>
                    上传 .jar
                  </ElButton>
                </ElUpload>
                <span class="field__upload-sep">或</span>
                <ElInput
                  v-model="driverDownloadUrl"
                  class="field__upload-url"
                  placeholder="输入 jar 下载地址（http/https）"
                  clearable
                >
                  <template #append>
                    <ElButton
                      :loading="downloadingDriver"
                      @click="handleDownloadDriver"
                      >下载</ElButton
                    >
                  </template>
                </ElInput>
              </div>
              <div class="field__upload-meta">
                <ScTag
                  v-if="modelValue.driverJarName"
                  class="field__driver-tag"
                  effect="plain"
                  type="success"
                >
                  {{ modelValue.driverJarName }}
                </ScTag>
                <small>服务器没有内置驱动时上传 jar，连接会优先使用它。</small>
                <ElButton
                  v-if="modelValue.driverJarPath"
                  link
                  type="danger"
                  @click="clearDriverJar"
                >
                  移除驱动包
                </ElButton>
              </div>
            </div>
          </label>

          <label class="field">
            <span
              class="field__label"
              :class="{
                'field__label--required': isUsernameRequired,
              }"
            >
              {{ usernameLabel }}
            </span>
            <ElInput
              :model-value="modelValue.username"
              :placeholder="usernamePlaceholder"
              @update:model-value="updateField('username', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.username }"
            >
              {{ fieldErrors.username || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label">{{
              modelValue.sourceType === "INFLUXDB2" ||
              modelValue.sourceType === "INFLUXDB3"
                ? "Token"
                : "密码"
            }}</span>
            <ElInput
              :model-value="modelValue.password"
              :placeholder="
                modelValue.sourceType === 'INFLUXDB2' ||
                modelValue.sourceType === 'INFLUXDB3'
                  ? '请输入 InfluxDB Token'
                  : '请输入连接密码'
              "
              show-password
              type="password"
              @update:model-value="updateField('password', $event)"
            />
            <small class="field__error field__error--hidden"> </small>
          </label>

          <label class="field field--full">
            <span>备注</span>
            <ElInput
              :autosize="{ minRows: 3, maxRows: 5 }"
              :model-value="modelValue.note || ''"
              placeholder="建议记录用途、权限边界、owner 和风险说明。"
              type="textarea"
              @update:model-value="updateField('note', $event)"
            />
          </label>

          <section class="advanced-panel field field--full">
            <div
              class="advanced-panel__head"
              style="cursor: pointer; user-select: none"
              @click="advancedCollapsed = !advancedCollapsed"
            >
              <div style="display: flex; align-items: center; gap: 6px">
                <strong>高级配置</strong>
                <ElIcon :style="{ transform: advancedCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }">
                  <ArrowDown />
                </ElIcon>
              </div>
              <span>按数据源类型补充元信息、网络超时和专属连接参数。</span>
            </div>

            <div v-show="!advancedCollapsed" class="advanced-panel__grid">
              <label class="field">
                <span class="field__label">环境</span>
                <ElSelect
                  :model-value="modelValue.environment"
                  @update:model-value="
                    updateField('environment', String($event || 'dev'))
                  "
                >
                  <ElOption label="开发" value="dev" />
                  <ElOption label="测试" value="test" />
                  <ElOption label="预发" value="stage" />
                  <ElOption label="生产" value="prod" />
                </ElSelect>
              </label>

              <label class="field">
                <span class="field__label">负责人</span>
                <ElInput
                  :model-value="modelValue.owner"
                  placeholder="例如：data-platform"
                  @update:model-value="
                    updateField('owner', String($event || ''))
                  "
                />
              </label>

              <label class="field">
                <span class="field__label">连接超时(ms)</span>
                <ElInputNumber
                  :controls="false"
                  :min="0"
                  :model-value="modelValue.connectTimeoutMillis"
                  @update:model-value="
                    updateNumberField('connectTimeoutMillis', $event)
                  "
                />
              </label>

              <label class="field">
                <span class="field__label">读写超时(ms)</span>
                <ElInputNumber
                  :controls="false"
                  :min="0"
                  :model-value="modelValue.socketTimeoutMillis"
                  @update:model-value="
                    updateNumberField('socketTimeoutMillis', $event)
                  "
                />
              </label>

              <label class="field">
                <span class="field__label">字符集</span>
                <ElInput
                  :model-value="modelValue.charset"
                  placeholder="utf8mb4"
                  @update:model-value="
                    updateField('charset', String($event || ''))
                  "
                />
              </label>

              <label class="field field__switch">
                <span class="field__label">只读模式</span>
                <ElSwitch
                  :model-value="modelValue.readOnly"
                  @update:model-value="updateField('readOnly', Boolean($event))"
                />
              </label>

              <label class="field field__switch">
                <span class="field__label">启用 SSL</span>
                <ElSwitch
                  :model-value="modelValue.sslEnabled"
                  @update:model-value="
                    updateField('sslEnabled', Boolean($event))
                  "
                />
              </label>

              <label
                v-if="modelValue.sourceType === 'JDBC'"
                class="field field--full"
              >
                <span class="field__label">JDBC 额外参数</span>
                <ElInput
                  :model-value="String(modelValue.attributes.extraParams || '')"
                  placeholder="例如：serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true"
                  @update:model-value="updateAttribute('extraParams', $event)"
                />
              </label>

              <label v-if="modelValue.sourceType === 'REDIS'" class="field">
                <span class="field__label">默认 DB</span>
                <ElInputNumber
                  :controls="false"
                  :min="0"
                  :model-value="Number(modelValue.attributes.dbIndex || 0)"
                  @update:model-value="updateAttributeNumber('dbIndex', $event)"
                />
              </label>

              <label
                v-if="modelValue.sourceType === 'REDIS'"
                class="field field__switch"
              >
                <span class="field__label">Cluster 模式</span>
                <ElSwitch
                  :model-value="Boolean(modelValue.attributes.clusterMode)"
                  @update:model-value="
                    updateAttributeBoolean('clusterMode', $event)
                  "
                />
              </label>

              <label
                v-if="modelValue.sourceType === 'REDIS'"
                class="field field--full"
              >
                <span class="field__label">Sentinel 节点</span>
                <ElInput
                  :model-value="
                    String(modelValue.attributes.sentinelNodes || '')
                  "
                  placeholder="host1:26379,host2:26379"
                  @update:model-value="updateAttribute('sentinelNodes', $event)"
                />
              </label>

              <label v-if="modelValue.sourceType === 'MONGODB'" class="field">
                <span class="field__label">认证库</span>
                <ElInput
                  :model-value="
                    String(
                      modelValue.attributes.authDatabase ||
                        modelValue.databaseName ||
                        '',
                    )
                  "
                  placeholder="admin"
                  @update:model-value="updateAttribute('authDatabase', $event)"
                />
              </label>

              <label v-if="modelValue.sourceType === 'MONGODB'" class="field">
                <span class="field__label">副本集</span>
                <ElInput
                  :model-value="String(modelValue.attributes.replicaSet || '')"
                  placeholder="rs0"
                  @update:model-value="updateAttribute('replicaSet', $event)"
                />
              </label>

              <label
                v-if="modelValue.sourceType === 'MONGODB'"
                class="field field--full"
              >
                <span class="field__label">连接串</span>
                <ElInput
                  :model-value="
                    String(modelValue.attributes.connectionUri || '')
                  "
                  placeholder="mongodb://user:pass@host:27017/admin?replicaSet=rs0"
                  @update:model-value="updateAttribute('connectionUri', $event)"
                />
              </label>

              <label v-if="modelValue.sourceType === 'ZOOKEEPER'" class="field">
                <span class="field__label">Session Timeout(ms)</span>
                <ElInputNumber
                  :controls="false"
                  :min="1000"
                  :model-value="
                    Number(modelValue.attributes.sessionTimeoutMillis || 30000)
                  "
                  @update:model-value="
                    updateAttributeNumber('sessionTimeoutMillis', $event)
                  "
                />
              </label>

              <label
                v-if="modelValue.sourceType === 'NGINX' || modelValue.sourceType === 'SSH'"
                class="field field--full"
              >
                <span class="field__label">SSH 私钥</span>
                <ElInput
                  :autosize="{ minRows: 4, maxRows: 8 }"
                  :model-value="String(modelValue.attributes.privateKey || '')"
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                  type="textarea"
                  @update:model-value="updateAttribute('privateKey', $event)"
                />
              </label>
            </div>
          </section>
        </div>

        <div class="dialog-footer">
          <span>
            带 <strong>*</strong> 为必填。保存后才允许进入工作台，非 JDBC
            类型当前仅保留配置入口。
          </span>
          <div class="dialog-footer__actions">
            <ElButton @click="dialogVisible = false">取消</ElButton>
            <ElButton :loading="testingConnection" plain @click="handleTest">
              测试连接
            </ElButton>
            <ElButton :loading="submitting" type="primary" @click="handleSave">
              保存数据源
            </ElButton>
          </div>
        </div>
      </div>
    </ScDialog>

    <!-- Admin Config Dialog -->
    <ElDialog v-model="adminVisible" title="管理配置" width="680px" class="admin-dlg" destroy-on-close>
      <ElTabs v-model="adminTab">
        <ElTabPane label="系统概览" name="overview">
          <div class="admin-overview">
            <div class="admin-stats">
              <div class="admin-stat-card">
                <IconifyIconOnline icon="ep:connection" class="admin-stat-icon" />
                <div>
                  <span class="admin-stat-label">数据源总数</span>
                  <strong class="admin-stat-value">{{ props.sources.length }}</strong>
                </div>
              </div>
              <div class="admin-stat-card">
                <IconifyIconOnline icon="ep:coin" class="admin-stat-icon" />
                <div>
                  <span class="admin-stat-label">缓存连接</span>
                  <strong class="admin-stat-value">{{ props.cachedCount }}</strong>
                </div>
              </div>
              <div class="admin-stat-card">
                <IconifyIconOnline icon="ep:star" class="admin-stat-icon admin-stat-icon--warn" />
                <div>
                  <span class="admin-stat-label">收藏数</span>
                  <strong class="admin-stat-value">{{ favoriteCount }}</strong>
                </div>
              </div>
            </div>
            <div class="admin-type-dist">
              <h4>数据源类型分布</h4>
              <div class="admin-type-grid">
                <div v-for="item in sourceTypeDistribution" :key="item.type" class="admin-type-item">
                  <span class="admin-type-dot" :style="{ background: item.color }" />
                  <span class="admin-type-name">{{ item.type }}</span>
                  <span class="admin-type-count">{{ item.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </ElTabPane>
        <ElTabPane label="数据源管理" name="sources">
          <div class="admin-sources">
            <div class="admin-source-list">
              <div v-for="row in props.sources" :key="row.sourceId" class="admin-source-row">
                <span class="admin-source-icon">
                  <ElIcon><component :is="sourceAvatarIcon(row.sourceType)" /></ElIcon>
                </span>
                <div class="admin-source-info">
                  <strong>{{ row.connectionName }}</strong>
                  <span>{{ row.host }}:{{ row.port }} / {{ row.databaseName || '-' }}</span>
                </div>
                <ElTag size="small" effect="plain">{{ row.sourceType }}</ElTag>
              </div>
              <ElEmpty v-if="!props.sources.length" description="暂无数据源" :image-size="48" />
            </div>
          </div>
        </ElTabPane>
        <ElTabPane label="快捷操作" name="actions">
          <div class="admin-actions">
            <div class="admin-action-card" @click="emit('open-service-panel'); adminVisible = false">
              <IconifyIconOnline icon="ep:monitor" class="admin-action-icon" />
              <div>
                <strong>服务面板</strong>
                <span>管理服务器软件安装与 Docker 容器</span>
              </div>
            </div>
            <div class="admin-action-card" @click="showBackupDialog = true">
              <IconifyIconOnline icon="ep:document" class="admin-action-icon" />
              <div>
                <strong>连接备份</strong>
                <span>导入/导出数据源连接配置</span>
              </div>
            </div>
            <div class="admin-action-card" @click="emit('open-system-log'); adminVisible = false">
              <IconifyIconOnline icon="ep:data-line" class="admin-action-icon" />
              <div>
                <strong>系统日志</strong>
                <span>查看操作日志和系统事件</span>
              </div>
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </ElDialog>

    <!-- Backup Dialog -->
    <ElDialog v-model="showBackupDialog" title="连接备份" width="520px" class="admin-dlg" destroy-on-close>
      <ElTabs v-model="backupTab">
        <ElTabPane label="导出" name="export">
          <p class="backup-hint">将所有数据源连接配置导出为 JSON 文件。</p>
          <div class="backup-preview">
            <div class="backup-preview-header">
              <span>共 {{ props.sources.length }} 个数据源</span>
            </div>
            <div v-for="s in props.sources" :key="s.sourceId" class="backup-item">
              <span class="backup-item-name">{{ s.connectionName }}</span>
              <ElTag size="small" effect="plain">{{ s.sourceType }}</ElTag>
              <span class="backup-item-host">{{ s.host }}:{{ s.port }}</span>
            </div>
          </div>
          <div style="margin-top:14px;">
            <ElButton type="primary" :icon="Plus" @click="handleExportSources">导出 JSON</ElButton>
          </div>
        </ElTabPane>
        <ElTabPane label="导入" name="import">
          <p class="backup-hint">从 JSON 文件导入数据源连接配置。</p>
          <ElUpload
            accept=".json"
            :auto-upload="false"
            :show-file-list="true"
            :on-change="handleImportSources"
          >
            <ElButton type="primary" :icon="Plus">选择文件</ElButton>
            <template #tip><span class="backup-hint">支持 .json 格式</span></template>
          </ElUpload>
        </ElTabPane>
      </ElTabs>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowDown,
  ChatDotRound,
  Coin,
  Delete,
  EditPen,
  FolderOpened,
  Grid,
  Plus,
  RefreshRight,
  Search,
  SetUp,
  Star,
} from "@element-plus/icons-vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import {
  ElButton,
  ElCheckbox,
  ElEmpty,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElSwitch,
  ElUpload,
} from "element-plus";
import { computed, reactive, ref } from "vue";
import type {
  JdbcConnectionForm,
  PanelSavedSource,
  PanelSourceType,
} from "../panel";
import { iterate } from "localforage";

const props = defineProps<{
  cachedCount: number;
  modelValue: JdbcConnectionForm;
  sources: PanelSavedSource[];
  submitting: boolean;
  testingConnection: boolean;
  uploadingDriver: boolean;
}>();

const emit = defineEmits<{
  (e: "delete-source", sourceId: string): void;
  (e: "edit-source", source: PanelSavedSource): void;
  (e: "open-source", source: PanelSavedSource): void;
  (e: "open-sources", sources: PanelSavedSource[]): void;
  (e: "open-project-management", source: PanelSavedSource): void;
  (e: "open-service-panel"): void;
  (e: "open-system-log"): void;
  (e: "reset-form"): void;
  (e: "save-source"): void;
  (e: "test-source"): void;
  (e: "toggle-favorite", sourceId: string): void;
  (e: "upload-driver", file: File): void;
  (e: "update:modelValue", value: JdbcConnectionForm): void;
}>();

const dialogVisible = ref(false);
const keyword = ref("");
const driverDownloadUrl = ref("");
const downloadingDriver = ref(false);
const advancedCollapsed = ref(true);
const adminVisible = ref(false);
const adminTab = ref("overview");
const showBackupDialog = ref(false);
const backupTab = ref("export");
const selectedJdbcSourceIds = ref<string[]>([]);
const fieldErrors = reactive<Record<string, string>>({
  sourceType: "",
  jdbcDialectType: "",
  connectionName: "",
  host: "",
  port: "",
  driverClassName: "",
  username: "",
});

const sourceTypeOptions = [
  { label: "JDBC / SQL", value: "JDBC" },
  { label: "Redis", value: "REDIS" },
  { label: "MongoDB", value: "MONGODB" },
  { label: "ZooKeeper", value: "ZOOKEEPER" },
  { label: "Prometheus", value: "PROMETHEUS" },
  { label: "InfluxDB 2.x", value: "INFLUXDB2" },
  { label: "InfluxDB 3.x", value: "INFLUXDB3" },
  { label: "Nacos", value: "NACOS" },
  { label: "Nginx (SSH)", value: "NGINX" },
  { label: "Docker", value: "DOCKER" },
  { label: "Kafka", value: "KAFKA" },
  { label: "RabbitMQ", value: "RABBITMQ" },
  { label: "MQTT", value: "MQTT" },
  { label: "SSH 服务器", value: "SSH" },
] as const;

const jdbcDialectOptions = [
  {
    label: "MySQL",
    value: "MYSQL",
    icon: "logos:mysql",
    description: "MySQL / Percona",
    defaultPort: 3306,
    driverClassName: "com.mysql.cj.jdbc.Driver",
  },
  {
    label: "MariaDB",
    value: "MARIADB",
    icon: "simple-icons:mariadb",
    description: "MariaDB",
    defaultPort: 3306,
    driverClassName: "org.mariadb.jdbc.Driver",
  },
  {
    label: "Oracle",
    value: "ORACLE",
    icon: "simple-icons:oracle",
    description: "Oracle / OJDBC",
    defaultPort: 1521,
    driverClassName: "oracle.jdbc.OracleDriver",
  },
  {
    label: "PostgreSQL",
    value: "POSTGRESQL",
    icon: "logos:postgresql",
    description: "PostgreSQL",
    defaultPort: 5432,
    driverClassName: "org.postgresql.Driver",
  },
  {
    label: "SQL Server",
    value: "SQLSERVER",
    icon: "simple-icons:microsoftsqlserver",
    description: "Microsoft SQL Server",
    defaultPort: 1433,
    driverClassName: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
  },
  {
    label: "ClickHouse",
    value: "CLICKHOUSE",
    icon: "simple-icons:clickhouse",
    description: "ClickHouse",
    defaultPort: 8123,
    driverClassName: "com.clickhouse.jdbc.ClickHouseDriver",
  },
  {
    label: "自定义",
    value: "CUSTOM",
    icon: "ep:setting",
    description: "自定义 JDBC",
    defaultPort: 3306,
    driverClassName: "",
  },
] as const;

const parseEnvironement = (it) => {
  if (it === "dev") {
    return "开发";
  }

  if (it === "test") {
    return "测试";
  }

  if (it === "prod") {
    return "生产";
  }
};

const sourceList = computed(() =>
  (Array.isArray(props.sources) ? props.sources : []).filter(
    (source): source is PanelSavedSource => {
      if (!source || typeof source !== "object") {
        return false;
      }
      const term = keyword.value.trim().toLowerCase();
      if (!term) {
        return true;
      }
      return [
        source.connectionName,
        source.host,
        source.databaseName,
        source.username,
        source.environment,
        source.owner,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    },
  ),
);

const favoriteCount = computed(
  () => sourceList.value.filter((source) => source.favorite).length,
);

const selectedJdbcSources = computed(() =>
  sourceList.value.filter((source) => selectedJdbcSourceIds.value.includes(source.sourceId) && isJdbcRow(source)),
);

const typeColors: Record<string, string> = {
  JDBC: "#6366f1", REDIS: "#ef4444", MONGODB: "#22c55e", ZOOKEEPER: "#f59e0b",
  PROMETHEUS: "#ec4899", INFLUXDB2: "#06b6d4", INFLUXDB3: "#06b6d4",
  NACOS: "#8b5cf6", NGINX: "#10b981", DOCKER: "#3b82f6", KAFKA: "#f97316",
  RABBITMQ: "#e84393", MQTT: "#00b894", SSH: "#64748b",
};
const sourceTypeDistribution = computed(() => {
  const map = new Map<string, number>();
  for (const s of sourceList.value) {
    const st = s.sourceType || "UNKNOWN";
    map.set(st, (map.get(st) || 0) + 1);
  }
  return [...map.entries()].map(([type, count]) => ({
    type, count, color: typeColors[type] || "#64748b",
  })).sort((a, b) => b.count - a.count);
});

const isJdbcRow = (row: PanelSavedSource) => String(row.sourceType || "").trim().toUpperCase() === "JDBC";

const isSelectedJdbcSource = (row: PanelSavedSource) =>
  isJdbcRow(row) && selectedJdbcSourceIds.value.includes(row.sourceId);

const toggleJdbcSelection = (row: PanelSavedSource, selected: boolean) => {
  if (!isJdbcRow(row)) {
    return;
  }
  const ids = new Set(selectedJdbcSourceIds.value);
  if (selected) {
    ids.add(row.sourceId);
  } else {
    ids.delete(row.sourceId);
  }
  selectedJdbcSourceIds.value = [...ids];
};

const openSelectedJdbcConsole = () => {
  if (!selectedJdbcSources.value.length) {
    return;
  }
  emit("open-sources", selectedJdbcSources.value);
};

const isNginxSource = (row: PanelSavedSource) => {
  const type = String(row.sourceType || "").trim().toUpperCase();
  return type === "NGINX" || type === "NGINX_HTTP" || type === "NGINX_WORKSPACE";
};

const isJdbcSource = computed(() => props.modelValue.sourceType === "JDBC");

const isDockerSocketProtocol = computed(() => {
  const t = props.modelValue.sourceType;
  const p = (props.modelValue.protocol || "").toLowerCase();
  return t === "DOCKER" && ["unix", "socket"].includes(p);
});

const currentDialectPreset = computed(
  () =>
    jdbcDialectOptions.find(
      (option) => option.value === props.modelValue.jdbcDialectType,
    ) || jdbcDialectOptions[0],
);

const databaseLabel = computed(() => {
  const t = props.modelValue.sourceType as string;
  if (t === "REDIS") return "默认库";
  if (t === "MONGODB") return "默认数据库";
  if (t === "ZOOKEEPER") return "初始路径";
  if (t === "PROMETHEUS") return "默认命名空间";
  if (t === "INFLUXDB2") return "Bucket";
  if (t === "INFLUXDB3") return "默认数据库";
  if (t === "NACOS") return "命名空间";
  if (t === "NGINX") return "站点标签";
  if (t === "SSH") return "标签";
  if (t === "DOCKER") return isDockerSocketProtocol.value ? "Socket 路径" : "API 版本";
  if (t === "KAFKA") return "默认命名空间";
  if (props.modelValue.jdbcDialectType === "ORACLE") return "服务名 / SID";
  return "数据库";
});

const databasePlaceholder = computed(() => {
  const t = props.modelValue.sourceType as string;
  if (t === "REDIS") return "例如：0";
  if (t === "MONGODB") return "例如：admin / app";
  if (t === "ZOOKEEPER") return "例如：/";
  if (t === "PROMETHEUS") return "可选";
  if (t === "INFLUXDB2") return "例如：my-bucket";
  if (t === "INFLUXDB3") return "例如：my-database";
  if (t === "NACOS") return "例如：public / dev-namespace";
  if (t === "NGINX") return "例如：prod-web-01";
  if (t === "SSH") return "例如：prod-web-01";
  if (t === "DOCKER") return isDockerSocketProtocol.value ? "/var/run/docker.sock" : "可选";
  if (t === "KAFKA") return "可选";
  if (props.modelValue.jdbcDialectType === "ORACLE")
    return "例如：xe / orcl / service_name";
  return "例如：mysql / analytics";
});

const protocolLabel = computed(() => {
  const t = props.modelValue.sourceType as string;
  if (t === "REDIS") return "连接地址";
  if (t === "MONGODB") return "连接字符串（可选）";
  if (t === "INFLUXDB2") return "Org（组织）";
  if (t === "INFLUXDB3") return "协议";
  if (t === "NACOS") return "协议";
  if (t === "PROMETHEUS") return "协议";
  if (t === "NGINX") return "认证方式";
  if (t === "SSH") return "认证方式";
  if (t === "DOCKER") return "协议";
  if (t === "KAFKA") return "协议";
  return "JDBC URL";
});

const protocolPlaceholder = computed(() => {
  const t = props.modelValue.sourceType as string;
  if (t === "REDIS") return "redis://127.0.0.1:6379/0";
  if (t === "MONGODB")
    return "mongodb://host:27017（可留空，按上方配置自动拼装）";
  if (t === "INFLUXDB2") return "例如：my-org";
  if (t === "INFLUXDB3") return "http 或 https";
  if (t === "NACOS") return "http 或 https";
  if (t === "PROMETHEUS") return "http 或 https";
  if (t === "NGINX") return "password 或 privateKey（留空使用密码认证）";
  if (t === "SSH") return "password 或 privateKey（留空使用密码认证）";
  if (t === "DOCKER") return "tcp / http / https / unix / socket";
  if (t === "KAFKA") return "plaintext / SASL_SSL / SSL";
  return "可留空，后端会按数据库类型自动拼装 JDBC URL";
});
const isUsernameRequired = computed(
  () => props.modelValue.sourceType === "JDBC",
);

const usernameLabel = computed(() => {
  const t = props.modelValue.sourceType as string;
  if (t === "INFLUXDB2") return "Org（组织）";
  if (t === "NACOS") return "用户名（可选）";
  return "用户名";
});

const usernamePlaceholder = computed(() => {
  const t = props.modelValue.sourceType as string;
  if (t === "INFLUXDB2") return "例如：my-org";
  if (t === "NACOS") return "可选，开启鉴权时填写";
  if (t === "PROMETHEUS") return "Basic Auth 用户名（可选）";
  return "root";
});

const driverClassOptions = computed(() => {
  // 只显示当前选中方言的驱动类
  const preset = currentDialectPreset.value;
  const options: { label: string; value: string }[] = [];

  if (preset) {
    // 当前方言的默认驱动
    options.push({
      label: `${preset.label} 默认 · ${preset.driverClassName}`,
      value: preset.driverClassName,
    });
  }

  // 如果当前填写的驱动不在列表里，加入
  const currentValue = String(props.modelValue.driverClassName || "").trim();
  if (currentValue && !options.some((o) => o.value === currentValue)) {
    options.unshift({ label: `自定义 · ${currentValue}`, value: currentValue });
  }

  return options;
});

const formatTime = (value?: string) =>
  value ? value.replace("T", " ").slice(0, 16) : "未记录";
const sourceAvatarIcon = (type?: string) => {
  if (type === "REDIS") return SetUp;
  if (type === "MONGODB") return Grid;
  if (type === "DOCKER") return SetUp;
  if (type === "KAFKA") return Grid;
  if (type === "MQTT") return ChatDotRound;
  return Coin;
};

const updateAttribute = (key: string, value: unknown) => {
  emit("update:modelValue", {
    ...props.modelValue,
    attributes: {
      ...(props.modelValue.attributes || {}),
      [key]: value,
    },
  });
};

const updateAttributeNumber = (
  key: string,
  value: number | null | undefined,
) => {
  updateAttribute(key, Number(value || 0));
};

const updateAttributeBoolean = (
  key: string,
  value: string | number | boolean,
) => {
  updateAttribute(key, Boolean(value));
};

const updateField = <K extends keyof JdbcConnectionForm>(
  key: K,
  value: JdbcConnectionForm[K],
) => {
  if (key in fieldErrors) {
    fieldErrors[String(key)] = "";
  }
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
};

const SOURCE_TYPE_DEFAULTS: Record<
  PanelSourceType,
  Partial<JdbcConnectionForm>
> = {
  JDBC: { port: 3306, driverClassName: "" },
  REDIS: { port: 6379, driverClassName: "" },
  MONGODB: { port: 27017, driverClassName: "" },
  ZOOKEEPER: { port: 2181, driverClassName: "" },
  PROMETHEUS: { port: 9090, driverClassName: "" },
  INFLUXDB2: { port: 8086, driverClassName: "" },
  INFLUXDB3: { port: 8086, driverClassName: "" },
  NACOS: { port: 8848, driverClassName: "" },
  NGINX: { port: 22, driverClassName: "" },
  SSH: { port: 22, driverClassName: "" },
  DOCKER: { port: 2375, protocol: "tcp", driverClassName: "" },
  KAFKA: { port: 9092, driverClassName: "" },
  RABBITMQ: { port: 5672, driverClassName: "" },
  MQTT: { port: 1883, driverClassName: "" },
};

const handleSourceTypeChange = (value: string) => {
  const nextSourceType = (sourceTypeOptions.find((item) => item.value === value)
    ?.value || "JDBC") as PanelSourceType;
  const defaults =
    SOURCE_TYPE_DEFAULTS[nextSourceType] || SOURCE_TYPE_DEFAULTS.JDBC;
  fieldErrors.sourceType = "";
  emit("update:modelValue", {
    ...props.modelValue,
    ...defaults,
    sourceType: nextSourceType,
    port:
      nextSourceType === "JDBC"
        ? currentDialectPreset.value.defaultPort
        : Number(defaults.port || props.modelValue.port),
    jdbcDialectType:
      nextSourceType === "JDBC"
        ? props.modelValue.jdbcDialectType || currentDialectPreset.value.value
        : props.modelValue.jdbcDialectType,
    driverClassName:
      nextSourceType === "JDBC"
        ? props.modelValue.driverClassName ||
          currentDialectPreset.value.driverClassName
        : "",
  });
};

const handleJdbcDialectChange = (value: string) => {
  const nextPreset =
    jdbcDialectOptions.find((option) => option.value === value) ||
    jdbcDialectOptions[0];
  const previousPreset = currentDialectPreset.value;
  fieldErrors.jdbcDialectType = "";
  const isCustom = nextPreset.value === "CUSTOM";
  emit("update:modelValue", {
    ...props.modelValue,
    jdbcDialectType: nextPreset.value,
    // 自定义类型：清空驱动类让用户手动填；其他类型：切换时自动填对应驱动
    driverClassName: isCustom
      ? ""
      : !props.modelValue.driverClassName ||
          props.modelValue.driverClassName === previousPreset.driverClassName
        ? nextPreset.driverClassName
        : props.modelValue.driverClassName,
    // 端口始终跟随方言默认值（自定义类型保留当前值）
    port: isCustom
      ? props.modelValue.port || nextPreset.defaultPort
      : nextPreset.defaultPort,
  });
};

const updateNumberField = (
  key: keyof JdbcConnectionForm,
  value: number | null | undefined,
) => {
  if (key in fieldErrors) {
    fieldErrors[String(key)] = "";
  }
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: Number(value || 0),
  });
};

const validateForm = () => {
  fieldErrors.sourceType = props.modelValue.sourceType
    ? ""
    : "请选择数据源类型";
  fieldErrors.jdbcDialectType =
    !isJdbcSource.value || String(props.modelValue.jdbcDialectType || "").trim()
      ? ""
      : "请选择数据库类型";
  fieldErrors.connectionName = String(
    props.modelValue.connectionName || "",
  ).trim()
    ? ""
    : "请输入数据源名称";
  fieldErrors.host = String(props.modelValue.host || "").trim()
    ? ""
    : "请输入主机地址";
  fieldErrors.port = Number(props.modelValue.port) > 0 ? "" : "请输入有效端口";
  fieldErrors.driverClassName =
    !isJdbcSource.value || String(props.modelValue.driverClassName || "").trim()
      ? ""
      : "请选择 JDBC 驱动类";
  fieldErrors.username =
    !isUsernameRequired.value || String(props.modelValue.username || "").trim()
      ? ""
      : "JDBC 数据源必须填写用户名";

  return !Object.values(fieldErrors).some(Boolean);
};

const openCreateDialog = () => {
  emit("reset-form");
  dialogVisible.value = true;
};

const openEditDialog = (source: PanelSavedSource) => {
  emit("edit-source", source);
  dialogVisible.value = true;
};

const handleSave = () => {
  if (!validateForm()) {
    return;
  }
  emit("save-source");
  dialogVisible.value = false;
};

const handleTest = () => {
  if (!validateForm()) {
    return;
  }
  emit("test-source");
};

const handleBeforeDriverUpload = (file: File) => {
  emit("upload-driver", file);
  return false;
};

const handleDownloadDriver = async () => {
  const url = driverDownloadUrl.value.trim();
  if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) {
    return;
  }
  downloadingDriver.value = true;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const fileName = url.split("/").pop()?.split("?")[0] || "driver.jar";
    const file = new File([blob], fileName, {
      type: "application/java-archive",
    });
    emit("upload-driver", file);
    driverDownloadUrl.value = "";
  } catch (e: any) {
    // 静默失败，让父组件处理
  } finally {
    downloadingDriver.value = false;
  }
};

const clearDriverJar = () => {
  emit("update:modelValue", {
    ...props.modelValue,
    driverJarName: "",
    driverJarPath: "",
  });
};

// ─── Backup / Import ───────────────────────────────────────────────────────

const handleExportSources = () => {
  const data = JSON.stringify(props.sources, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `panel-sources-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  ElMessage.success("数据源配置已导出");
  showBackupDialog.value = false;
};

const handleImportSources = (file: any) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const json = JSON.parse(e.target?.result as string);
      if (!Array.isArray(json)) {
        ElMessage.warning("无效的备份文件：需要 JSON 数组");
        return;
      }
      // 将导入的数据源保存到 localStorage，触发父组件处理
      const existing = JSON.parse(localStorage.getItem("panel:sources:v3") || "[]");
      for (const item of json) {
        if (item.sourceId && !existing.find((s: any) => s.sourceId === item.sourceId)) {
          existing.push(item);
        }
      }
      localStorage.setItem("panel:sources:v3", JSON.stringify(existing));
      ElMessage.success(`已导入 ${json.length} 个数据源（跳过重复项）`);
      showBackupDialog.value = false;
      window.location.reload();
    } catch {
      ElMessage.error("解析备份文件失败");
    }
  };
  reader.readAsText(file.raw || file);
  return false;
};
</script>

<style scoped lang="scss">
.hub-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 18px;
  box-sizing: border-box;
  overflow: hidden;
  background:
    radial-gradient(
      circle at top left,
      rgba(99, 102, 241, 0.10),
      transparent 36%
    ),
    radial-gradient(
      circle at top right,
      rgba(139, 92, 246, 0.08),
      transparent 32%
    ),
    radial-gradient(
      circle at bottom center,
      rgba(99, 102, 241, 0.05),
      transparent 50%
    ),
    linear-gradient(135deg, #f1f5f9 0%, #e8ecf4 50%, #f0f2f8 100%);
}

.hub-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.hub-toolbar__title {
  display: grid;
  gap: 4px;
}

.hub-toolbar__title small {
  color: #6366f1;
  font-size: 11px;
  letter-spacing: 0.08em;
  font-weight: 600;
}

.hub-toolbar__title strong {
  color: #1e293b;
  font-size: 28px;
  line-height: 1.1;
  background: linear-gradient(135deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hub-toolbar__title span {
  color: #64748b;
  font-size: 13px;
}

.hub-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 320px;
  padding: 0 12px;
  border: 1px solid rgba(125, 142, 154, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: rgba(99, 102, 241, 0.3);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
  }
}

.hub-search :deep(.el-input__wrapper) {
  box-shadow: none;
  background: transparent;
}

.hub-summary {
  display: flex;
  gap: 12px;
}

.summary-chip {
  display: grid;
  gap: 4px;
  min-width: 140px;
  padding: 12px 14px 12px 16px;
  border: 1px solid rgba(121, 138, 149, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: default;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 3px;
    height: 100%;
    border-radius: 3px 0 0 3px;
    background: linear-gradient(180deg, #6366f1, #8b5cf6);
    opacity: 0.6;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(15, 37, 52, 0.08);
  }
}

.summary-chip small {
  color: #6366f1;
  font-size: 11px;
  font-weight: 600;
}

.summary-chip strong {
  color: #1e293b;
  font-size: 22px;
  line-height: 1;
}

.hub-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  align-content: start;
  padding: 2px 0 16px;
}

.source-card {
  display: grid;
  gap: 12px;
  width: 100%;
  min-height: 228px;
  padding: 16px;
  border: 1px solid rgba(99, 102, 241, 0.10);
  border-radius: 22px;
  background:
    radial-gradient(
      circle at top right,
      rgba(99, 102, 241, 0.08),
      transparent 34%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.96),
      rgba(248, 249, 252, 0.94)
    );
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  animation: source-card-enter 0.4s ease-out backwards;
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  @keyframes source-card-enter {
    from { opacity: 0; transform: translateY(16px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @for $i from 1 through 20 {
    &:nth-child(#{$i}) { animation-delay: #{$i * 0.04}s; }
  }
}

.source-card--selected,
.source-card--selected:hover {
  border-color: rgba(99, 102, 241, 0.66);
  box-shadow: 0 18px 42px rgba(79, 70, 229, 0.2);
}

.source-card:hover {
  border-color: rgba(99, 102, 241, 0.3);
  box-shadow: 0 24px 48px rgba(15, 37, 52, 0.14);
  transform: translateY(-4px);
}

.source-card__head,
.source-card__footer,
.source-card__identity,
.source-card__strip,
.source-card__actions {
  display: flex;
  align-items: center;
}

.source-card__head,
.source-card__footer {
  justify-content: space-between;
  gap: 10px;
}

.source-card__identity {
  gap: 12px;
  min-width: 0;
}

.source-card__identity > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.source-card__identity strong {
  color: #102534;
  font-size: 15px;
  line-height: 1.2;
}

.source-card__identity span,
.source-card__note {
  color: #6e8595;
  font-size: 12px;
}

.source-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: linear-gradient(135deg, #6366f1, #38bdf8);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.source-card:hover .source-card__avatar {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.3);
}

.source-card__avatar :deep(.el-icon) {
  color: #fff;
  font-size: 18px;
}

.source-card__icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(125, 142, 154, 0.24);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #5f7381;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease,
    color 0.16s ease;
}

.source-card__icon-btn:hover {
  border-color: rgba(59, 130, 246, 0.28);
  color: #2563eb;
}

.source-card__head-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.source-card__icon-btn--project {
  color: #2563eb;
  border-color: rgba(59, 130, 246, 0.2);
}

.source-card__icon-btn--favorite {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.18);
}

.source-card__icon-btn--favorite-active {
  background: rgba(245, 158, 11, 0.16);
  color: #c2410c;
  border-color: rgba(245, 158, 11, 0.3);
}

.source-card__icon-btn--delete {
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.22);
}

.source-card__icon-btn--delete:hover {
  color: #b91c1c;
  border-color: rgba(220, 38, 38, 0.32);
}

.source-card__icon-btn :deep(.el-icon) {
  font-size: 15px;
}

.source-card__strip {
  justify-content: space-between;
  gap: 10px;
}

.source-card__type {
  border-color: rgba(59, 130, 246, 0.2);
  background: rgba(59, 130, 246, 0.08);
  color: #0f4c81;
}

.source-card__updated {
  color: #7a8f9d;
  font-size: 11px;
  white-space: nowrap;
}

.source-card__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.source-card__fact {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(127, 144, 155, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.source-card__fact dt {
  color: #7b8f9d;
  font-size: 11px;
}

.source-card__fact dd {
  margin: 0;
  overflow: hidden;
  color: #132c3e;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source-card__note {
  min-height: 48px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(240, 245, 249, 0.9);
  line-height: 1.6;
}

.source-card__meta-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.source-card__meta-strip span {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(15, 76, 129, 0.08);
  color: #456577;
  font-size: 11px;
}

.source-card__footer {
  margin-top: auto;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.source-card__open {
  width: 100%;
  border-radius: 14px;
}

.source-card__hover-only {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    visibility 0.2s ease,
    transform 0.2s ease;
  transform: translateY(4px);
}

.source-card:hover .source-card__hover-only {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translateY(0);

  &:nth-child(1) { transition-delay: 0.02s; }
  &:nth-child(2) { transition-delay: 0.04s; }
  &:nth-child(3) { transition-delay: 0.06s; }
}

.hub-empty {
  grid-column: 1 / -1;
  display: grid;
  place-items: center;
  min-height: 320px;
}

.field__upload-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.field__upload-sep {
  font-size: 12px;
  color: #8a9aaa;
  flex-shrink: 0;
}

.field__upload-url {
  flex: 1;
  min-width: 200px;
}

.dialog-shell {
  display: grid;
  gap: 18px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
  grid-template-rows: auto minmax(42px, auto) 16px;
}

.field__label {
  color: #60798a;
  font-size: 12px;
}

.field__label--required::after {
  content: " *";
  color: #dc2626;
}

.field__error {
  min-height: 16px;
  color: #dc2626;
  font-size: 12px;
  line-height: 1.4;
}

.field__error--hidden {
  visibility: hidden;
}

.field--full {
  grid-column: 1 / -1;
}

.field :deep(.el-input-number),
.field :deep(.el-select) {
  width: 100%;
}

.field :deep(.el-input__wrapper),
.field :deep(.el-select__wrapper),
.field :deep(.el-textarea__inner),
.field :deep(.el-input-number .el-input__wrapper) {
  min-height: 42px;
  border-radius: 18px;
}

.field :deep(.el-textarea__inner) {
  padding: 12px 14px;
}

.field__switch {
  grid-template-rows: auto auto 0;
}

.field__switch :deep(.el-switch) {
  margin-top: 10px;
}

.field__upload {
  display: grid;
  gap: 10px;
}

.advanced-panel {
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(125, 142, 154, 0.12);
  border-radius: 20px;
  background: rgba(247, 250, 252, 0.88);
}

.advanced-panel__head {
  display: grid;
  gap: 4px;
}

.advanced-panel__head strong {
  color: #102534;
  font-size: 13px;
}

.advanced-panel__head span {
  color: #688194;
  font-size: 12px;
  line-height: 1.5;
}

.advanced-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field__upload-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.field__upload-meta small {
  color: #688194;
  line-height: 1.5;
}

.field__driver-tag {
  max-width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.dialog-footer span {
  color: #6f8796;
  font-size: 12px;
}

.dialog-footer__actions {
  display: flex;
  gap: 10px;
}

/* ── 深色模式 ── */
html.dark {
  .hub-shell {
    background:
      radial-gradient(
        circle at top left,
        rgba(99, 102, 241, 0.08),
        transparent 36%
      ),
      radial-gradient(
        circle at top right,
        rgba(16, 185, 129, 0.04),
        transparent 32%
      ),
      linear-gradient(180deg, #0f1520, #0a0f18);
  }

  .hub-search {
    background: rgba(30, 35, 50, 0.88);
    border-color: rgba(148, 163, 184, 0.1);
  }

  .summary-chip {
    background: rgba(30, 35, 50, 0.88);
    border-color: rgba(148, 163, 184, 0.08);
  }

  .source-card {
    background:
      radial-gradient(
        circle at top right,
        rgba(99, 102, 241, 0.08),
        transparent 34%
      ),
      linear-gradient(
        180deg,
        rgba(20, 25, 40, 0.96),
        rgba(15, 20, 32, 0.92)
      );
    border-color: rgba(148, 163, 184, 0.08);
    box-shadow: 0 16px 34px rgba(0, 0, 0, 0.3);
  }

  .source-card:hover {
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }

  .source-card__avatar {
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
  }

  .source-card__fact {
    background: rgba(20, 25, 40, 0.6);
    border-color: rgba(148, 163, 184, 0.06);
  }

  .source-card__fact dt { color: #8899a8; }
  .source-card__fact dd { color: #d0dce8; }

  .source-card__note {
    background: rgba(20, 25, 40, 0.6);
    color: #8899a8;
  }

  .source-card__icon-btn {
    background: rgba(30, 35, 50, 0.9);
    border-color: rgba(148, 163, 184, 0.1);
    color: #8899a8;
  }

  .source-card__type {
    background: rgba(99, 102, 241, 0.1);
    color: #a5b4fc;
  }

  .source-card__meta-strip span {
    background: rgba(99, 102, 241, 0.08);
    color: #8899a8;
  }

  .hub-toolbar__title small,
  .hub-toolbar__title span {
    color: #8899a8;
  }

  .hub-toolbar__title strong {
    color: #e8edf2;
  }

  .advanced-panel {
    background: rgba(20, 25, 40, 0.6);
    border-color: rgba(148, 163, 184, 0.06);
  }

  .advanced-panel__head strong { color: #d0dce8; }
  .advanced-panel__head span { color: #8899a8; }
}

@media (max-width: 960px) {
  .hub-toolbar,
  .dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .hub-toolbar__actions,
  .hub-search,
  .dialog-footer__actions {
    width: 100%;
  }

  .hub-summary {
    flex-wrap: wrap;
  }

  .hub-grid {
    grid-template-columns: 1fr;
  }

  .source-card__facts {
    grid-template-columns: 1fr;
  }

  .dialog-grid {
    grid-template-columns: 1fr;
  }

  .advanced-panel__grid {
    grid-template-columns: 1fr;
  }
}

/* ─── Admin Dialog ─── */
:deep(.admin-dlg) {
  .el-dialog {
    border-radius: 18px;
    overflow: hidden;
  }
  .el-dialog__header {
    padding: 20px 24px 0;
    .el-dialog__title { font-size: 18px; font-weight: 700; }
  }
  .el-dialog__body { padding: 16px 24px 24px; }
}
.admin-overview {
  display: grid;
  gap: 20px;
}
.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.admin-stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04));
  border: 1px solid rgba(99,102,241,0.12);
  transition: transform 0.2s, box-shadow 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(99,102,241,0.1); }
}
.admin-stat-icon {
  font-size: 28px;
  color: #6366f1;
  &--warn { color: #f59e0b; }
}
.admin-stat-label {
  display: block;
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}
.admin-stat-value {
  display: block;
  font-size: 24px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
}
.admin-type-dist h4 {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
  margin: 0 0 12px;
}
.admin-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}
.admin-type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(241,245,249,0.8);
  font-size: 13px;
}
.admin-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.admin-type-name { flex: 1; color: #334155; font-weight: 500; }
.admin-type-count { color: #6366f1; font-weight: 700; font-size: 14px; }

.admin-source-list {
  display: grid;
  gap: 6px;
  max-height: 360px;
  overflow-y: auto;
}
.admin-source-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(125,142,154,0.1);
  transition: background 0.15s;
  &:hover { background: rgba(99,102,241,0.04); }
}
.admin-source-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08));
  color: #6366f1;
  font-size: 16px;
  flex-shrink: 0;
}
.admin-source-info {
  flex: 1;
  min-width: 0;
  strong { display: block; font-size: 13px; color: #1e293b; }
  span { display: block; font-size: 11px; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}
.admin-actions {
  display: grid;
  gap: 10px;
}
.admin-action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  border-radius: 12px;
  border: 1px solid rgba(125,142,154,0.12);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: rgba(99,102,241,0.04);
    border-color: rgba(99,102,241,0.2);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99,102,241,0.08);
  }
  strong { display: block; font-size: 14px; color: #1e293b; }
  span { display: block; font-size: 12px; color: #64748b; }
}
.admin-action-icon {
  font-size: 24px;
  color: #6366f1;
  flex-shrink: 0;
}

/* ─── Backup Dialog ─── */
.backup-hint {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 12px;
  line-height: 1.5;
}
.backup-preview {
  border: 1px solid rgba(125, 142, 154, 0.12);
  border-radius: 10px;
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
}
.backup-preview-header {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  background: rgba(99, 102, 241, 0.04);
  border-bottom: 1px solid rgba(125, 142, 154, 0.1);
}
.backup-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 13px;
  border-bottom: 1px solid rgba(125, 142, 154, 0.06);
  transition: background 0.15s;
}
.backup-item:last-child { border-bottom: none; }
.backup-item:hover { background: rgba(99, 102, 241, 0.03); }
.backup-item-name {
  flex: 1;
  min-width: 0;
  font-weight: 500;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.backup-item-host {
  font-size: 12px;
  color: #94a3b8;
  font-family: monospace;
}
</style>
