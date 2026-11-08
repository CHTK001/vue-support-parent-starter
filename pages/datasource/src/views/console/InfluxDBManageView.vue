<template>
  <div class="dsm tel-page">
    <!-- 顶部工具栏 -->
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="DataAnalysis" :size="18" class="dsm-title-icon" />
        <span class="dsm-title">InfluxDB 时序数据库管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <!-- 查询方言：与「服务端是不是 v3」无关，可按实例实际支持情况就地切换 -->
        <div class="dsm-dialect" data-testid="dsm-dialect-switch">
          <button
            type="button"
            class="dsm-dialect-btn"
            :class="{ 'is-active': !useSql }"
            :disabled="isV3 || isV1"
            :title="isV3 || isV1 ? (isV1 ? 'v1 只有 InfluxQL，没有 Flux' : 'v3 已移除 Flux，只能用 SQL') : '按 Flux 语法查询（需服务端 flux-enabled=true）'"
            data-testid="dsm-dialect-flux"
            @click="switchDialect('flux')"
          >
            Flux
          </button>
          <button
            type="button"
            class="dsm-dialect-btn"
            :class="{ 'is-active': useSql }"
            title="按 SQL / InfluxQL 语法查询"
            data-testid="dsm-dialect-sql"
            @click="switchDialect('sql')"
          >
            SQL
          </button>
        </div>
        <ReButton layout="square" tip="测试连接" icon="Connection" data-testid="dsm-btn-test" :disabled="!source" @click="testConnection" />
        <ReButton layout="square" tip="刷新" icon="Refresh" data-testid="dsm-btn-refresh" @click="refresh" />
        <ReButton layout="square" type="primary" :tip="useSql ? 'SQL 查询' : 'Flux 查询'" icon="Search" data-testid="dsm-btn-query" @click="openQuery" />
        <ReButton layout="square" type="primary" :tip="databaseModel ? '新建数据库' : '新建 Bucket'" icon="Plus" data-testid="dsm-btn-create" :disabled="!source" :loading="bucketSaving" @click="openCreateBucket" />
        <ReButton layout="square" tip="写入数据" icon="EditPen" data-testid="dsm-btn-write" :disabled="!source" :loading="writeSaving" @click="openWritePoint" />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <div class="dsm-body">
      <!-- 左侧连接树 -->
      <div class="dsm-sidebar">
        <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" @click="toggleNode('root')">
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="Coin" size="14" class="dsm-tree-icon dsm-influx-icon" />
            <span class="dsm-tree-label">{{ connectionName }}</span>
          </div>

          <div v-if="expandedNodes.has('root')" class="dsm-tree-children">
            <div class="dsm-tree-node" @click="toggleNode('buckets')">
              <ReIcon :name="expandedNodes.has('buckets') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">{{ databaseModel ? "数据库 (Databases)" : "存储桶 (Buckets)" }}</span>
              <span class="dsm-tree-count">{{ buckets.length }}</span>
            </div>
            <div v-if="expandedNodes.has('buckets')" class="dsm-tree-children">
              <div
                v-for="bucket in buckets"
                :key="bucket.name"
                class="dsm-tree-node dsm-leaf-node"
                :class="{ active: activeBucket === bucket.name }"
                @click="selectBucket(bucket.name)"
                @contextmenu.prevent="onBucketContextMenu($event, bucket.name)"
              >
                <ReIcon name="Collection" size="14" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ bucket.name }}</span>
              </div>
            </div>

            <div class="dsm-tree-node" @click="toggleNode('measurements')">
              <ReIcon :name="expandedNodes.has('measurements') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="TrendCharts" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">测量 (Measurements)</span>
              <span class="dsm-tree-count">{{ measurements.length }}</span>
            </div>
            <div v-if="expandedNodes.has('measurements')" class="dsm-tree-children">
              <div
                v-for="m in measurements"
                :key="m.name"
                class="dsm-tree-node dsm-leaf-node"
                @click="selectMeasurement(m.name)"
                @contextmenu.prevent="onMeasurementContextMenu($event, m.name)"
              >
                <ReIcon name="DataLine" size="14" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ m.name }}</span>
              </div>
              <div v-if="measurements.length === 0" class="dsm-tree-node dsm-leaf-node">
                <span class="dsm-tree-label">暂无测量</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="dsm-content">
        <!-- 工作区页签（对齐 jdbc dbm-tabs）：总览 + 查询页签 + 打开表 + 设计表，可多开、切换保留 -->
        <div class="dsm-tabs">
          <div class="dsm-tab" :class="{ active: activeWorkspaceTab === 'overview' }" @click="activeWorkspaceTab = 'overview'">
            <ReIcon name="Collection" size="12" />
            <span class="dsm-tab-title">总览</span>
          </div>
          <div
            v-for="t in tableTabs"
            :key="t.id"
            class="dsm-tab"
            :class="{ active: activeWorkspaceTab === t.id }"
            @click="activeWorkspaceTab = t.id"
          >
            <ReIcon name="Grid" size="12" />
            <span class="dsm-tab-title">{{ t.measurement }}</span>
            <ReIcon name="Close" size="12" class="dsm-tab-close" @click.stop="closeTableTab(t.id)" />
          </div>
          <div
            v-for="t in designTabs"
            :key="t.id"
            class="dsm-tab"
            :class="{ active: activeWorkspaceTab === t.id }"
            @click="activeWorkspaceTab = t.id"
          >
            <ReIcon name="Setting" size="12" />
            <span class="dsm-tab-title">{{ t.measurement }} - 设计</span>
            <ReIcon name="Close" size="12" class="dsm-tab-close" @click.stop="closeDesignTab(t.id)" />
          </div>
          <div
            v-for="t in queryTabs"
            :key="t.id"
            class="dsm-tab"
            :class="{ active: activeWorkspaceTab === t.id }"
            @click="activeWorkspaceTab = t.id"
          >
            <ReIcon name="Edit" size="12" />
            <span class="dsm-tab-title">{{ t.title }}</span>
            <ReIcon name="Close" size="12" class="dsm-tab-close" @click.stop="closeQueryTab(t.id)" />
          </div>
        </div>
        <!-- 总览（对齐 jdbc 单卡片：整块可滚动，内部区块不再各自悬浮成卡） -->
        <div v-show="activeWorkspaceTab === 'overview'" class="dsm-overview">
        <!-- 连接信息 -->
        <div class="dsm-info-card">
          <div class="dsm-info-row">
            <span class="dsm-info-label">数据源</span>
            <span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接地址</span>
            <span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 8086}` : "—" }}</span>
          </div>
          <div class="dsm-info-row" v-if="!isV3 && !isV1">
            <span class="dsm-info-label">组织 (Org)</span>
            <span class="dsm-info-value mono">{{ orgInfo.orgName || source?.username || "自动探测" }}</span>
          </div>
          <div class="dsm-info-row" v-if="!isV3 && !isV1">
            <span class="dsm-info-label">Org ID</span>
            <span class="dsm-info-value mono">{{ orgInfo.orgId || "—" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <div class="dsm-info-status">
              <ReTag :type="gap ? 'danger' : 'success'" >{{ gap ? "读取失败" : "正常" }}</ReTag>
              <span class="dsm-info-sub">服务版本 {{ influxVersion || "未探测" }}</span>
            </div>
          </div>
        </div>

        <!-- 存储桶列表 -->
        <div class="dsm-section">
          <div class="dsm-section-title">{{ databaseModel ? "数据库列表" : "存储桶列表" }}</div>
          <ReTable
            :data="buckets"
            :columns="bucketColumns"
            :loading="loading"
            stripe
            border
            :layout-table="{ height: '300px' }"
            :context-menu="bucketTableMenu"
            @context-menu-select="onBucketTableMenuSelect"
          >
            <template #action="{ row }">
              <div class="dsm-row-ops">
                <ReButton icon="EditPen" layout="square" title="编辑保留期" @click="openEditRetention(row)" />
                <ReButton icon="Delete" layout="square" type="danger" title="删除" @click="confirmDeleteBucket(row)" />
              </div>
            </template>
          </ReTable>
        </div>

        <!-- 测量列表 -->
        <div class="dsm-section" v-if="activeBucket">
          <div class="dsm-section-title">
            {{ activeBucket }} - 测量列表
            <ReButton text @click="loadMeasurements">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
            <span class="dsm-section-hint">点击行按该度量生成{{ useSql ? " SQL" : " Flux" }}查询</span>
          </div>
          <ReTable
            :data="measurements"
            :columns="measurementColumns"
            :loading="loading"
            stripe
            border
            :layout-table="{ height: '220px' }"
            @row-click="onMeasurementRowClick"
          />
        </div>

        <!-- 最近数据 -->
        <div class="dsm-section" v-if="activeBucket">
          <div class="dsm-section-title">
            {{ activeBucket }} - 最近数据
            <ReButton text @click="loadBucketData">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
          </div>
          <ReTable
            :data="recentData"
            :columns="dataColumns"
            :loading="dataLoading"
            stripe
            border
            :layout-table="{ height: '250px' }"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="!activeBucket && buckets.length === 0" class="dsm-empty">
          <ReIcon name="Collection" size="48" class="dsm-empty-icon" />
          <p>{{ gap ? (databaseModel ? "未读取到真实数据库" : "未读取到真实存储桶") : (databaseModel ? "暂无数据库，点击「刷新」重新加载" : "暂无存储桶，点击「刷新」重新加载") }}</p>
        </div>
        </div>

        <!-- 打开表页签内容（对齐 jdbc 表数据 tab：时间窗 + field 过滤 + 数据表格） -->
        <div
          v-for="t in tableTabs"
          v-show="activeWorkspaceTab === t.id"
          :key="t.id"
          class="dsm-browser-tab"
        >
          <div class="dsm-browser-bar">
            <ReSelect v-model="t.range" style="width: 130px" @change="runTableTabQuery(t)">
              <ReOption label="最近 1 小时" value="-1h" />
              <ReOption label="最近 6 小时" value="-6h" />
              <ReOption label="最近 24 小时" value="-24h" />
              <ReOption label="最近 7 天" value="-7d" />
            </ReSelect>
            <ReSelect v-model="t.field" clearable placeholder="按 field 过滤" style="width: 160px" @change="runTableTabQuery(t)">
              <ReOption v-for="f in t.fields" :key="f" :label="f" :value="f" />
            </ReSelect>
            <span class="dsm-browser-meta">{{ t.rows.length }} 行</span>
            <span class="dsm-spacer" />
            <ReButton
              layout="square"
              type="primary"
              icon="EditPen"
              tip="添加数据（写入数据点）"
              data-testid="dsm-browser-add"
              @click="openWritePointFor(t)"
            />
            <ReButton
              layout="square"
              type="danger"
              icon="Delete"
              tip="删除测量（删该测量的全部数据）"
              data-testid="dsm-browser-drop"
              @click="confirmDeleteMeasurement(t.measurement)"
            />
            <ReButton text @click="runTableTabQuery(t)">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
          </div>
          <!-- 高度不写死：ReTable 的 fill 模式（缺省开启）会吃满本页签剩余高度、
               表头固定、表体内部滚动。原来这里传 height: calc(100vh - 220px)，
               那是「按视口猜容器高度」——220 这个数既不含页签条也不含本页自己的
               工具栏，猜大了几十像素，而 .dsm-content 是 overflow: hidden，
               多出来的部分直接被裁掉且不产生任何滚动条：底下几行数据永远看不到。
               父容器 .dsm-browser-tab 有确定高度（flex:1 + min-height:0），
               fill 判定得出可用高度，不需要再猜。 -->
          <ReTable
            :data="t.rows"
            :columns="t.columns"
            :loading="t.loading"
            stripe
            border
          />
        </div>

        <!-- 设计表页签内容（对齐 jdbc 设计表：单个可编辑字段网格 + 增删改查；InfluxDB 字段只增不改） -->
        <div
          v-for="t in designTabs"
          v-show="activeWorkspaceTab === t.id"
          :key="t.id"
          class="dsm-design-view"
        >
          <div class="dsm-design-toolbar">
            <span class="dsm-table-name">{{ activeBucket }}.{{ t.measurement }}</span>
            <span class="dsm-kind-chip" :class="designChipTone()">{{ designChipText() }}</span>
            <span class="dsm-spacer" />
            <ReButton
              layout="square"
              type="primary"
              icon="Plus"
              tip="新增字段（保存时写入样例点创建，v1/v2/v3 通用）"
              data-testid="dsm-design-add"
              @click="addDesignField(t)"
            />
            <ReButton
              layout="square"
              icon="Check"
              :tip="dirtyDesignCount(t) > 0 ? `保存 ${dirtyDesignCount(t)} 处新字段` : '保存（无待创建的新字段）'"
              :disabled="dirtyDesignCount(t) === 0"
              data-testid="dsm-design-save"
              @click="saveDesign(t)"
            />
            <ReButton
              layout="square"
              type="danger"
              plain
              icon="Delete"
              :tip="`删除测量「${t.measurement}」（删除该测量全部数据，不可恢复）`"
              data-testid="dsm-design-drop"
              @click="confirmDeleteMeasurement(t.measurement)"
            />
            <ReButton layout="square" icon="Refresh" tip="刷新结构" @click="runDesignTabQuery(t)" />
          </div>
          <div class="dsm-col-hint">InfluxDB 字段只增不改：已存在字段不可重命名 / 改类型 / 单独删除（引擎限制），只能整测量删除；新增字段 = 保存时写入一条含该字段的样例数据点</div>
          <!-- 同「打开表」页签：高度交给 ReTable 的 fill（吃满剩余高度 + 表体内滚），
               不再用 maxHeight: calc(100% - 54px) 猜「工具条 + 说明行」有多高 ——
               说明行会换行，54 这个数一换行就不够，多出来的字段行会被裁掉。 -->
          <ReTable
            :data="designRowsOf(t)"
            :columns="designColumns"
            :loading="t.loading"
            engine="element"
            stripe
            border
            size="mini"
            empty-text="暂未读取到字段"
          >
            <template #col-name="{ row }">
              <ReInput
                v-if="row.isNew"
                v-model="row.name"
                size="small"
                class="dsm-mono-editor"
                placeholder="新字段名（如 temp）"
                @change="markDesignDirty(t, row)"
              />
              <span v-else class="dsm-field-name" :title="'不可重命名（InfluxDB 只增不改）'">{{ row.name }}</span>
            </template>
            <template #col-kind="{ row }">
              <span class="dsm-kind-badge" :class="row.kind === 'field' ? 'is-field' : 'is-tag'">
                {{ row.kind === "field" ? "field" : "tag" }}
              </span>
            </template>
            <template #col-type="{ row }">
              <ReSelect
                v-if="row.isNew && row.kind === 'field'"
                v-model="row.type"
                size="small"
                style="width: 110px"
                @change="markDesignDirty(t, row)"
              >
                <ReOption v-for="tp in INFLUX_FIELD_TYPES" :key="tp.value" :label="tp.label" :value="tp.value" />
              </ReSelect>
              <span v-else class="dsm-type-chip">{{ row.type || (row.kind === "tag" ? "string" : "—") }}</span>
            </template>
            <template #col-actions="{ row }">
              <template v-if="row.isNew">
                <ReButton
                  layout="square"
                  type="danger"
                  icon="Delete"
                  tip="移除该行（未保存，不会入库）"
                  @click="removeDesignRow(t, row)"
                />
              </template>
              <span v-else class="dsm-lock" :title="'InfluxDB 不支持删除单个字段'">🔒</span>
            </template>
          </ReTable>
        </div>

        <!-- Flux 查询页签内容（对齐 jdbc 查询页：方钮工具栏 + 编辑器 + 结果表；多开、切换保留） -->
        <div
          v-for="t in queryTabs"
          v-show="activeWorkspaceTab === t.id"
          :key="t.id"
          class="dsm-query-area"
        >
          <div class="dsm-query-toolbar">
            <ReButton
              layout="square"
              type="primary"
              icon="VideoPlay"
              tip="执行（Ctrl+Enter）"
              data-testid="dsm-btn-exec"
              :loading="t.executing"
              @click="executeQuery(t)"
            />
            <ReButton
              layout="square"
              icon="Delete"
              tip="清空编辑器"
              data-testid="dsm-btn-clear"
              @click="t.flux = ''"
            />
            <span class="dsm-spacer" />
            <span class="dsm-query-hint">{{ useSql ? (isV3 ? "表/列名与 SQL 关键字输入即提示" : "InfluxQL 语句，目标桶由当前选中的桶带入") : "桶/测量名与 Flux 函数输入即提示" }}</span>
          </div>
          <!-- 编辑器与结果表之间可上下拖拽分隔条（拖动改变两者高度，默认 45% / 55%） -->
          <div class="dsm-query-split">
            <div
              class="dsm-query-editor-pane"
              :style="{ height: `calc((100% - 24px) * ${t.editorRatio})` }"
            >
              <DbSqlEditor
                v-model="t.flux"
                :language="useSql ? 'sql' : 'flux'"
                :keywords="useSql ? [] : fluxKeywords"
                :tables="isV3 && useSql ? sqlTables : undefined"
                :column-resolver="isV3 && useSql ? resolveSqlColumns : undefined"
                :max-height="`${t.editorRatio * 100}vh`"
                data-testid="dsm-flux-editor"
                @execute="executeQuery(t)"
              />
            </div>
            <div
              class="dsm-splitter"
              :data-testid="`dsm-splitter-${t.id}`"
              :title="'上下拖拽调整编辑器与结果区高度'"
              @mousedown.prevent="startSplitDrag($event, t)"
            >
              <ReIcon name="Rank" size="12" class="dsm-splitter-icon" />
            </div>
            <div class="dsm-query-result">
              <div class="dsm-query-header">
                查询结果
                <span v-if="t.result.rows.length > 0" class="dsm-query-meta">
                  {{ t.result.rows.length }} 行 · {{ t.elapsed }} ms
                  <span v-if="t.truncated" class="dsm-query-warn">已截断，服务端共 {{ t.totalRows }} 行，请加 limit 或收窄时间窗</span>
                </span>
              </div>
              <ReTable
                v-if="t.result.columns.length > 0"
                :data="t.result.rows"
                :columns="t.result.columns"
                stripe
                border
                :layout-table="{ height: '100%' }"
              />
              <ReEmpty v-else description="执行查询后显示结果" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建 / 编辑 Bucket 弹窗 -->
    <ReDialog v-model="bucketDialogVisible" :title="bucketForm.id ? '编辑保留期' : (isV3 ? '新建数据库' : '新建 Bucket')" width="460px">
      <ReForm label-width="110px">
        <ReFormItem :label="databaseModel ? '数据库名称' : 'Bucket 名称'" required>
          <ReInput v-model="bucketForm.name" :disabled="!!bucketForm.id" placeholder="如 telemetry" />
        </ReFormItem>
        <ReFormItem label="保留时长(小时)">
          <ReInputNumber v-model="bucketForm.retentionHours" :min="0" :step="24" placeholder="0 = 永久保留" />
          <span class="dsm-form-hint">0 表示永久保留</span>
        </ReFormItem>
        <ReFormItem v-if="!bucketForm.id" label="描述">
          <ReInput v-model="bucketForm.description" type="textarea" :rows="2" placeholder="可选" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="bucketDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="bucketSaving" @click="submitBucket">
          <template #icon><ReIcon name="Check" /></template>确定
        </ReButton>
      </template>
    </ReDialog>

    <!-- 写入数据弹窗 -->
    <ReDialog v-model="writeVisible" title="写入数据点" width="560px">
      <ReForm label-width="110px">
        <ReFormItem :label="databaseModel ? '数据库' : 'Bucket'" required>
          <ReInput v-model="writeForm.bucket" :disabled="!!activeBucket" :placeholder="databaseModel ? '数据库名' : 'Bucket 名'" />
        </ReFormItem>
        <ReFormItem label="Measurement" required>
          <ReInput v-model="writeForm.measurement" placeholder="如 cpu" />
        </ReFormItem>
        <ReFormItem label="Tags">
          <ReInput v-model="writeForm.tags" type="textarea" :rows="2" placeholder="key=value 每行一个，如：&#10;host=server01&#10;region=cn" />
        </ReFormItem>
        <ReFormItem label="Fields" required>
          <ReInput v-model="writeForm.fields" type="textarea" :rows="3" placeholder="key=value 每行一个，值自动识别数字/字符串，如：&#10;usage=82.5&#10;unit=percent" />
        </ReFormItem>
        <ReFormItem label="时间戳">
          <ReInput v-model="writeForm.timestamp" placeholder="留空 = 当前时间" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="writeVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="writeSaving" @click="submitWrite">
          <template #icon><ReIcon name="Check" /></template>写入
        </ReButton>
      </template>
    </ReDialog>
    <!-- 桶/测量行右键菜单（第九批统一 zk 模板） -->
    <DsmContextMenu
      v-model:visible="sideMenu.visible"
      :x="sideMenu.x"
      :y="sideMenu.y"
      :items="sideMenuItems"
      @select="onSideMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * InfluxDB 管理页
 *
 * <p>基于「数据源管理」登记的 influxdb 数据源，通过 /ms/monitor/influxdb/** 读取真实 Bucket、
 * 度量与 Flux 查询结果；接口缺失或连接失败时只展示失败原因，不回落任何演示数据。</p>
 * @author CH
 * @since 4.0.0
 */
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { EditPen, CopyDocument, Delete } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReForm from "@repo/ui/re-form";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { ReFormItem, ReOption } from "@repo/ui/re-kit";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { copyToClipboard } from "../../utils/clipboard";
import DsmContextMenu from "../../components/console/DsmContextMenu.vue";
import DbSqlEditor from "../../components/console/DbSqlEditor.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import { extraText } from "../../utils/externalDatasource";
import {
  fetchInfluxdbBuckets,
  fetchInfluxdbMeasurements,
  testInfluxdbConnection,
  type InfluxdbBucket,
  type InfluxdbMeasurement,
} from "../../api/manageConsoles";
import {
  createInfluxdbBucket,
  deleteInfluxdbBucket,
  dropInfluxdbMeasurement,
  fetchInfluxdbOrg,
  updateInfluxdbBucketRetention,
  writeInfluxdbPoints,
  type InfluxdbOrg,
} from "../../api/influxdbNginxApi";

import { useInfluxdbQuery, type Column } from "../../composables/useInfluxdbQuery";

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 侧栏根节点名称：真实数据源名 */
const connectionName = computed(() => (source.value ? source.value.name : "InfluxDB 时序数据库"));

// 树状态
const expandedNodes = ref(new Set(["root", "buckets", "measurements"]));
const activeBucket = ref("");

// 数据
const loading = ref(false);
const dataLoading = ref(false);
const testing = ref(false);
const influxVersion = ref("");
/**
 * 服务端大版本号（去掉 `v` 前缀后的首位）。
 *
 * <p>三个版本都要认：v1 的 `/ping` 给的是 `v1.11.8`（**带 v 前缀**），
 * 不剥掉就会被当成 v2。</p>
 */
const serverMajor = computed(() => influxVersion.value.trim().replace(/^v/i, "").split(".")[0] ?? "");
/** 是否 InfluxDB 3.x（v3 为 Rust 重写：SQL/InfluxQL + 数据库模型，已移除 Flux 与组织） */
const isV3 = computed(() => serverMajor.value === "3");
/** 是否 InfluxDB 1.x（只有 InfluxQL，容器是 database，无 Flux、无组织） */
const isV1 = computed(() => serverMajor.value === "1");
/**
 * 容器是否叫「数据库」。
 *
 * <p>v1 的 database 对应 v2 的 bucket、v3 的 database；只有 v2 侧才叫「存储桶」。
 * 决定文案用，真正调哪个接口由后端按探测到的版本自行分发。</p>
 */
const databaseModel = computed(() => isV3.value || isV1.value);
/**
 * 查询方言（Flux / SQL+InfluxQL）。
 *
 * <p>与 `isV3` 正交：`isV3` 说的是<b>服务端是什么</b>（组织/桶 还是 数据库），
 * 方言说的是<b>语句怎么写</b>。两者必须分开，因为 InfluxDB 2.x 的 Flux 是可选组件
 * （`flux-enabled=false` 时只认 InfluxQL）——「2.x 实例 + SQL 方言」是真实存在的组合，
 * 用大版本去推方言会让这种实例完全没法查。</p>
 */
const dialect = ref<"flux" | "sql">("flux");
/**
 * 当前是否按 SQL / InfluxQL 方言工作。
 *
 * <p>用户选择之外还要按服务端能力兜底：v1 压根没有 Flux、v3 已移除 Flux，
 * 这两种实例上即便登记了「v2」，也必须走 InfluxQL——否则只会拿到一串 403。</p>
 */
const useSql = computed(() => dialect.value === "sql" || isV3.value || isV1.value);
const buckets = ref<InfluxdbBucket[]>([]);

/** 桶/测量行右键菜单（第九批统一 zk 模板）：侧栏共用一个菜单实例，按 kind 切换条目 */
const sideMenu = reactive({ visible: false, x: 0, y: 0, kind: "bucket" as "bucket" | "measurement", key: "" });
const sideMenuItems = computed(() =>
  sideMenu.kind === "bucket"
    ? [
        { key: "view", label: databaseModel.value ? "查看该库数据" : "查看该桶数据", icon: "Collection" },
        { key: "copy", label: databaseModel.value ? "复制数据库名" : "复制桶名", icon: "Document" },
        { key: "delete", label: databaseModel.value ? "删除数据库" : "删除 Bucket", icon: "Delete", danger: true, divided: true },
      ]
    : [
        // 对齐 jdbc 表右键：打开表（数据浏览 tab）/ 设计表（字段结构 tab）/ 查询该测量 / 删除表
        { key: "open", label: "打开表", icon: "Grid" },
        { key: "design", label: "设计表", icon: "EditPen" },
        { key: "query", label: "查询该测量", icon: "Search" },
        { key: "copy", label: "复制名称", icon: "Document" },
        { key: "delete", label: "删除表（删该测量）", icon: "Delete", danger: true, divided: true },
      ],
);
/** 存储桶表格行右键（ReTable 内置菜单，图标为组件引用） */
const bucketTableMenu = computed(() => [
  { key: "retention", label: "编辑保留期", icon: EditPen },
  { key: "copy", label: databaseModel.value ? "复制数据库名" : "复制桶名", icon: CopyDocument },
  { key: "delete", label: databaseModel.value ? "删除数据库" : "删除 Bucket", icon: Delete, divided: true },
]);
/** 打开侧栏桶行右键菜单 */
function onBucketContextMenu(e: MouseEvent, name: string) {
  Object.assign(sideMenu, { visible: true, x: e.clientX, y: e.clientY, kind: "bucket", key: name });
}
/** 打开侧栏测量行右键菜单 */
function onMeasurementContextMenu(e: MouseEvent, name: string) {
  Object.assign(sideMenu, { visible: true, x: e.clientX, y: e.clientY, kind: "measurement", key: name });
}
/** 复制文本（菜单动作共用） */
async function copyMenuText(text: string, okMsg: string) {
  if (await copyToClipboard(text)) message.success(okMsg);
  else message.error("复制失败");
}
/** 侧栏菜单分发 */
function onSideMenuSelect(action: string) {
  const name = sideMenu.key;
  if (!name) return;
  if (action === "copy") {
    copyMenuText(name, isV3.value ? "已复制数据库名" : "已复制名称");
    return;
  }
  if (action === "view") {
    if (sideMenu.kind === "bucket") selectBucket(name);
    else selectMeasurement(name);
    return;
  }
  if (action === "open" || action === "design") {
    if (sideMenu.kind === "measurement") {
      if (action === "design") openDesignTab(name);
      else onMeasurementRowClick({ name });
    }
    return;
  }
  if (action === "query") {
    if (sideMenu.kind === "measurement") selectMeasurement(name);
    return;
  }
  if (action === "delete") {
    if (sideMenu.kind === "bucket") {
      const row = buckets.value.find(b => b.name === name);
      if (row) confirmDeleteBucket(row);
    } else if (sideMenu.kind === "measurement") {
      confirmDeleteMeasurement(name);
    }
  }
}
/** 存储桶表格菜单分发 */
function onBucketTableMenuSelect(item: { key: string }, ctx: { row: Record<string, unknown> }) {
  const row = ctx.row as InfluxdbBucket;
  if (item.key === "retention") openEditRetention(row);
  else if (item.key === "copy") copyMenuText(String(row.name ?? ""), isV3.value ? "已复制数据库名" : "已复制桶名");
  else if (item.key === "delete") confirmDeleteBucket(row);
}
const measurements = ref<InfluxdbMeasurement[]>([]);

/** 查询能力收口：语句生成 + 执行 + 结果列推导（v2 Flux / v3 SQL 双版本，见 composable 文档） */
const {
  runQuery,
  buildDefaultStatement,
  buildBrowserStatement,
  deriveColumns,
  deriveFieldOptions,
  resolveSqlColumns,
} = useInfluxdbQuery({ datasourceId, useSql, isV3, activeBucket, measurements });

/**
 * 连接信息（地址/端口/组织/版本）。
 *
 * <p>由 {@code applyConnectionInfo()} 写入。当前模板不直接读取它，
 * 但保留写入行为以便后续展示，故此处补上声明（此前迁移遗漏导致引用悬空）。</p>
 */
const connectionInfo = { host: "-", port: 0, organization: "-", version: "-" };

/** 连通状态。同上：脚本内写入，模板暂未读取，保留写入行为 */
const connected = ref(false);
const recentData = ref<Record<string, unknown>[]>([]);

// 列定义
const bucketColumns: Column[] = [
  { prop: "name", label: "存储桶名称", minWidth: 180 },
  { prop: "retentionHours", label: "保留时长(h)", width: 120 },
  { prop: "createdAt", label: "创建时间", minWidth: 170 },
  { prop: "action", label: "操作", width: 130, slot: "action", fixed: "right" as const, align: "center" as const },
];
const measurementColumns: Column[] = [
  { prop: "name", label: "度量名称", minWidth: 160 },
  { prop: "fieldCount", label: "字段数", width: 90 },
  { prop: "tagCount", label: "标签数", width: 90 },
  { prop: "lastWriteTime", label: "最后写入", minWidth: 170 },
];
const dataColumns = computed<Column[]>(() => deriveColumns(recentData.value));

// Flux 查询（工作区页签：jdbc「查询 N」式，可多开、各自保留编辑器与结果）
interface QueryTab {
  id: string;
  title: string;
  flux: string;
  executing: boolean;
  elapsed: number;
  truncated: boolean;
  totalRows: number;
  /** 编辑器区域占比（0~1），随分隔条拖拽变化 */
  editorRatio: number;
  result: { columns: Column[]; rows: Record<string, unknown>[] };
}
const queryTabs = ref<QueryTab[]>([]);
const activeWorkspaceTab = ref<string>("overview");
let queryTabSeq = 0;

// ---------- 「打开表」页签（对齐 jdbc table tab：时间窗 + field 过滤 + 数据表格） ----------

/** 打开表页签状态 */
interface TableTab {
  id: string;
  measurement: string;
  range: string;
  field: string;
  fields: string[];
  rows: Record<string, unknown>[];
  columns: Column[];
  loading: boolean;
}
const tableTabs = ref<TableTab[]>([]);
let tableTabSeq = 0;

// ---------- 「设计表」页签（对齐 jdbc 设计表：可编辑字段网格 + 增删改查） ----------

/** 设计表的一行：一个字段（field）或标签（tag）定义 */
interface DesignFieldRow {
  /** 行唯一 id（ReTable row-key） */
  key: string;
  name: string;
  kind: "field" | "tag";
  /** 类型：field 为 v3/influxql SHOW FIELD KEYS 给出的类型；tag 恒为 string */
  type: string;
  /** 是否是未落库的新增行（可改名/改类型/删除；保存后转已存在行） */
  isNew: boolean;
  /** 行是否被改动（新增行默认 true） */
  dirty: boolean;
}

/** 设计表页签状态 */
interface DesignTab {
  id: string;
  measurement: string;
  /** 字段网格行（单列清单：field 在前、tag 在后，统一渲染） */
  rows: DesignFieldRow[];
  loading: boolean;
}
const designTabs = ref<DesignTab[]>([]);
let designTabSeq = 0;

/** 可新增字段类型（保存时按类型生成样例数据点；InfluxDB SQL 字段类型） */
const INFLUX_FIELD_TYPES = [
  { label: "float", value: "float" },
  { label: "integer", value: "integer" },
  { label: "uinteger", value: "uinteger" },
  { label: "boolean", value: "boolean" },
  { label: "string", value: "string" },
] as const;

/** 设计表网格列（对齐 jdbc 表结构单表：名称 / 归属 / 类型 / 操作） */
const designColumns: Column[] = [
  { prop: "name", label: "名称", minWidth: 200, slot: "name" },
  { prop: "kind", label: "归属", width: 90, align: "center" as const, slot: "kind" },
  { prop: "type", label: "类型", width: 130, slot: "type" },
  { prop: "actions", label: "操作", width: 80, align: "center" as const, slot: "actions" },
];

/** ReTable 数据桥接：DesignFieldRow 没有索引签名，直接传会报 TS2322 */
function designRowsOf(tab: DesignTab): Array<Record<string, unknown>> {
  return tab.rows as unknown as Array<Record<string, unknown>>;
}

/** 行是否改动（新增行恒为脏；已存在行目前只读不可改） */
function isDesignRowDirty(row: DesignFieldRow): boolean {
  return row.dirty || row.isNew;
}

/** 页签里待保存的改动数（只会是新增行） */
function dirtyDesignCount(tab: DesignTab): number {
  return tab.rows.filter(r => isDesignRowDirty(r)).length;
}

/** 设计表能力角标文案（按服务端模型区分） */
function designChipText(): string {
  if (isV3.value) return "v3 SQL · 字段来自 information_schema（只增不改）";
  if (isV1.value) return "v1 InfluxQL · 字段随写入自动创建（只增不改）";
  return "v2 · schema-less · 字段随写入自动创建（只增不改）";
}

/** 设计表能力角标色调 */
function designChipTone(): "ok" | "muted" {
  return isV3.value ? "ok" : "muted";
}

/** 新增一行字段（未落库，可改名/改类型/删除） */
function addDesignField(tab: DesignTab) {
  tab.rows.push({
    key: `n${++designTabSeq}`,
    name: "",
    kind: "field",
    type: "float",
    isNew: true,
    dirty: true,
  });
}

/** 移除一行（只有新增行允许删除；已存在字段受引擎「只增不改」限制） */
function removeDesignRow(tab: DesignTab, row: DesignFieldRow) {
  if (!row.isNew) return;
  const idx = tab.rows.findIndex(r => r === row);
  if (idx >= 0) tab.rows.splice(idx, 1);
}

/** 新增行被改动：标记脏（名称/类型变更后生效） */
function markDesignDirty(_tab: DesignTab, row: DesignFieldRow) {
  row.dirty = true;
}

/**
 * 保存设计表：把新增行转成一条 line protocol 样例数据点写入，落库后刷新结构。
 *
 * <p>InfluxDB 没有列级 DDL（v3 也是 additive-only，且 SQL 无 ALTER TABLE），
 * 在 schema-less 模型里「新增字段」= 写入一条含该字段的数据点，字段随之出现。
 * 因此保存 = 构造一条点到 Write API，而不是发 ALTER TABLE。已存在字段
 * 不可改不可删（引擎限制），保存按钮只处理新增行。</p>
 */
async function saveDesign(tab: DesignTab) {
  if (!activeBucket.value) return;
  const drafts = tab.rows.filter(r => r.isNew);
  if (drafts.length === 0) return;
  // 新增行必须是「已命名 + 类型已选」：未命名直接拦截，提醒补名
  const unnamed = drafts.filter(d => !String(d.name || "").trim());
  if (unnamed.length > 0) {
    message.warning("新增字段必须先填写名称");
    return;
  }
  // 构造 line protocol：measurement,tag=... field=...；数字给 0、字符串给空串、
  // 布尔给 false —— 值类型必须与声明的字段类型一致，否则 InfluxDB 会按值推断类型
  const tabName = tab.measurement.replace(/,/g, "\\,").replace(/ /g, "\\ ");
  const tagParts = drafts.filter(d => d.kind === "tag").map(d =>
    `${d.name.trim().replace(/,/g, "\\,").replace(/ /g, "\\ ")}=probe`);
  const fieldParts = drafts.filter(d => d.kind === "field").map(d => {
    const key = d.name.trim().replace(/,/g, "\\,").replace(/ /g, "\\ ");
    return `${key}=${sampleValue(d.type)}`;
  });
  if (fieldParts.length === 0 && tagParts.length === 0) return;
  let line = tabName;
  if (tagParts.length) line += "," + tagParts.join(",");
  if (fieldParts.length) line += " " + fieldParts.join(",");
  tab.loading = true;
  try {
    await writeInfluxdbPoints({
      datasourceId: datasourceId.value,
      bucket: activeBucket.value,
      precision: "ns",
      lines: line,
    });
    message.success(`已创建 ${drafts.length} 个新字段，正在刷新结构…`);
    // 落库后新增行转已存在行，随后整表重取 schema
    await runDesignTabQuery(tab);
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/write");
  } finally {
    tab.loading = false;
  }
}

/** 按字段类型生成写样例点的值（与 InfluxDB 字段类型一一对应） */
function sampleValue(type: string): string {
  switch (type) {
    case "integer":
      return "0i";
    case "uinteger":
      return "0u";
    case "boolean":
      return "false";
    case "string":
      return "\"\"";
    default:
      return "0.0";
  }
}

/** 查询分隔条拖拽状态 */
const splitDragging = ref(false);
/** 正在拖拽的目标页签 */
let splitTarget: QueryTab | null = null;

/**
 * 开始拖拽分隔条：记录起始 Y 与页签，之后在 window 上监听 move/up，
 * move 时按容器高度换算编辑区占比并夹取在 25%~80% 之间。
 */
function startSplitDrag(e: MouseEvent, tab: QueryTab) {
  if (e.button !== 0) return;
  splitDragging.value = true;
  splitTarget = tab;
  const startY = e.clientY;
  const startRatio = tab.editorRatio;
  const container = (e.currentTarget as HTMLElement)?.closest(".dsm-query-split") as HTMLElement | null;
  const containerHeight = container?.getBoundingClientRect().height ?? 400;

  const onMove = (ev: MouseEvent) => {
    if (!splitTarget) return;
    const delta = (ev.clientY - startY) / containerHeight;
    splitTarget.editorRatio = Math.min(0.8, Math.max(0.25, startRatio + delta));
  };
  const onUp = () => {
    splitDragging.value = false;
    splitTarget = null;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  };

  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  document.body.style.cursor = "row-resize";
  document.body.style.userSelect = "none";
}
/** Flux 补全候选：桶名 + 已加载的测量名（输入即提示，随数据异步刷新） */
const fluxKeywords = computed(() => [
  ...buckets.value.map(b => b.name),
  ...measurements.value.map(m => m.name),
]);
/** v3 SQL 编辑器的表候选：度量即 SQL 表 */
const sqlTables = computed(() => measurements.value.map(m => m.name));

// Org 信息
const orgInfo = ref<InfluxdbOrg>({ orgId: "", orgName: "" });

// Bucket 新建/编辑
const bucketDialogVisible = ref(false);
const bucketSaving = ref(false);
const bucketForm = ref<{ id: string; name: string; retentionHours: number; description: string }>({
  id: "",
  name: "",
  retentionHours: 0,
  description: "",
});

// 写入数据点
const writeVisible = ref(false);
const writeSaving = ref(false);
const writeForm = ref({
  bucket: "",
  measurement: "",
  tags: "",
  fields: "",
  timestamp: "",
});

/**
 * 收集结果行的全部列（按首次出现顺序）
 * @param rows 结果行
 * @returns 列名数组
 */
function columnsOf(rows: Record<string, unknown>[]): string[] {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  return columns;
}

/**
 * 保留时长格式化
 * @param hours 保留小时数，0 或负数表示永久
 * @returns 可读文本
 */
function formatRetention(hours: number): string {
  if (!hours || hours <= 0) return "永久";
  if (hours % 24 === 0) return `${hours / 24}d`;
  if (hours % 60 === 0) return `${hours / 60}h`;
  return `${hours}h`;
}

/**
 * ISO 时间转为本地可读时间
 * @param value ISO 时间文本
 * @returns 本地时间文本
 */
function formatTime(value: unknown): string {
  const text = String(value ?? "");
  if (!text) return "-";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

/**
 * 回填连接信息（地址、组织、已登记方言）
 *
 * <p>登记的 version 是<b>查询方言</b>的用户选择，这里只用来定默认方言；
 * <b>不再</b>拿它去推服务端模型——那会让「2.x 实例选了 SQL」被误当成 v3，
 * 从而把控制台切到数据库/组织那套根本不存在的 v3 接口上。服务端模型以实测
 * 版本号为准（进入页面时探测，见 {@code probeServerVersion()}）。</p>
 */
function applyConnectionInfo() {
  const info = source.value;
  connectionInfo.host = info?.host ?? "-";
  connectionInfo.port = info?.port ?? 0;
  connectionInfo.organization = extraText(info, ["organization", "org"], info?.database ?? "-");
  if (info?.type === "influxdb" && (info.version === "2" || info.version === "3")) {
    dialect.value = info.version === "3" ? "sql" : "flux";
  }
  connectionInfo.version = info?.version || "-";
}

/**
 * 探测服务端真实版本，驱动「组织/桶 还是 数据库」这套服务端模型。
 *
 * <p>只读、不抛错：探不到时保持 v2 侧栏（更保守，v3 专有接口不会被打出去）。</p>
 */
async function probeServerVersion() {
  if (!datasourceId.value) return;
  try {
    const result = await testInfluxdbConnection({ datasourceId: datasourceId.value });
    if (result?.version) {
      influxVersion.value = result.version;
      // v1 无 Flux、v3 已移除 Flux：探测到这两种就把方言钉在 SQL（Flux 按钮也会禁用）
      if (isV3.value || isV1.value) {
        dialect.value = "sql";
      }
    }
  } catch {
    // 探测失败不阻断页面，沿用登记信息渲染
  }
}

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) {
    expandedNodes.value.delete(key);
  } else {
    expandedNodes.value.add(key);
  }
}

/**
 * 选中 Bucket 后加载度量与最近数据
 * @param name Bucket 名
 */
async function selectBucket(name: string) {
  activeBucket.value = name;
  await loadMeasurements();
  loadBucketData();
}

/**
 * 选中度量，按该度量新建一个查询页签并激活
 * @param name 度量名
 */
function selectMeasurement(name: string) {
  openQueryTab(
    useSql.value
      ? `SELECT * FROM "${name.replace(/"/g, '""')}" ORDER BY time DESC LIMIT 50`
      : `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n` +
        `  |> filter(fn: (r) => r._measurement == "${name}")\n  |> limit(n: 50)`
  );
}

/**
 * 加载当前 Bucket 下的度量列表
 */
async function loadMeasurements() {
  try {
    measurements.value = (await fetchInfluxdbMeasurements(datasourceId.value, activeBucket.value)) || [];
    ready();
  } catch (e) {
    measurements.value = [];
    fail(e, "/ms/monitor/influxdb/measurements");
  }
}

/**
 * 点击度量行打开表页签（对齐 jdbc「打开表」）
 * @param row 度量行
 */
function onMeasurementRowClick(row: Record<string, unknown>) {
  const name = String(row?.name ?? "");
  if (name) {
    openTableTab(name);
  }
}

/**
 * 探测当前数据源的 InfluxDB 连通性并显示版本
 */
async function testConnection() {
  testing.value = true;
  try {
    const result = await testInfluxdbConnection({ datasourceId: datasourceId.value });
    if (result?.connected) {
      influxVersion.value = result.version || "";
      ready();
      message.success(result.version ? `连接成功 · InfluxDB ${result.version}` : "连接成功");
    } else {
      message.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/test");
  } finally {
    testing.value = false;
  }
}

/**
 * 刷新 Bucket 列表，并在已选中 Bucket 时级联刷新度量
 */
async function refresh() {
  if (!source.value) {
    await bind("influxdb");
    if (!source.value) return;
  }
  loading.value = true;
  try {
    buckets.value = (await fetchInfluxdbBuckets(datasourceId.value)) || [];
    ready();
    await loadOrg();
    if (buckets.value.length > 0 && !buckets.value.some(b => b.name === activeBucket.value)) {
      selectBucket(buckets.value[0].name);
    } else if (activeBucket.value && buckets.value.some(b => b.name === activeBucket.value)) {
      // 已选中的库仍在列表中：同样级联刷新度量与最近数据（与函数文档一致）
      await loadMeasurements();
      loadBucketData();
    }
  } catch (e) {
    buckets.value = [];
    fail(e, "/ms/monitor/influxdb/buckets");
  } finally {
    loading.value = false;
  }
}

/**
 * 读取当前库的最近数据（v2 用 Flux，v3 用 SQL 取第一个度量的最近数据）
 */
async function loadBucketData() {
  if (!activeBucket.value) {
    recentData.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    const statement = buildDefaultStatement();
    if (!statement) {
      // v3 且当前库尚无度量：无数据可取
      recentData.value = [];
      return;
    }
    const { rows } = await runQuery(statement);
    recentData.value = rows;
    ready();
  } catch (e) {
    recentData.value = [];
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    dataLoading.value = false;
  }
}

/**
 * 新建一个查询页签并激活（jdbc「查询 N」式，可多开）
 * @param flux 预填语句，缺省按当前库生成
 * @returns 新页签
 */
function openQueryTab(flux?: string): QueryTab {
  const seq = ++queryTabSeq;
  const tab: QueryTab = {
    id: `q${seq}`,
    title: `查询 ${seq}`,
    flux: flux ?? buildDefaultStatement(),
    executing: false,
    elapsed: 0,
    truncated: false,
    totalRows: 0,
    editorRatio: 0.45,
    result: { columns: [], rows: [] },
  };
  queryTabs.value.push(tab);
  activeWorkspaceTab.value = tab.id;
  // 返回数组里的**响应式代理**，不是上面那个原始对象。
  // ref([]) 的 push 存的是原始对象，之后往原始对象上写（tab.result = …）不会触发重渲染，
  // 查询结果就永远停在初始的空结果上 —— 表现为「执行完查询还是空的」，
  // 直到别的响应式变化顺带把这一帧刷出来才突然出现。
  return queryTabs.value[queryTabs.value.length - 1]!;
}

/**
 * 关闭查询页签；关的是当前页签时回退到相邻页签或总览
 * @param id 页签 ID
 */
function closeQueryTab(id: string) {
  const idx = queryTabs.value.findIndex(t => t.id === id);
  if (idx < 0) return;
  queryTabs.value.splice(idx, 1);
  if (activeWorkspaceTab.value === id) {
    const next = queryTabs.value[idx] || queryTabs.value[idx - 1];
    activeWorkspaceTab.value = next ? next.id : "overview";
  }
}

/**
 * 工具栏「Flux 查询」：新建一个查询页签
 */
function openQuery() {
  openQueryTab();
}

/**
 * 切换查询方言。
 *
 * <p>方言与服务端版本无关，所以切方言只影响语句生成与编辑器语言，不重新拉桶/度量。
 * 当前页签若还空着，就按新方言补一条缺省语句，免得用户面对上一种语言的残留。</p>
 *
 * @param next 目标方言
 */
function switchDialect(next: "flux" | "sql") {
  if (next === dialect.value) return;
  dialect.value = next;
  const tab = queryTabs.value.find(item => item.id === activeWorkspaceTab.value);
  if (tab && !tab.flux.trim()) {
    tab.flux = buildDefaultStatement();
  }
}

/**
 * 执行指定页签里的查询
 * @param tab 查询页签
 */
async function executeQuery(tab: QueryTab) {
  if (!tab.flux.trim()) {
    message.warning(useSql.value ? "请输入 SQL 查询语句" : "请输入 Flux 查询语句");
    return;
  }
  tab.executing = true;
  try {
    const res = await runQuery(tab.flux);
    tab.elapsed = res.elapsed;
    tab.truncated = res.truncated;
    tab.totalRows = res.totalRows;
    tab.result = { columns: deriveColumns(res.rows), rows: res.rows };
    ready();
  } catch (e) {
    tab.result = { columns: [], rows: [] };
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    tab.executing = false;
  }
}

/**
 * 加载当前数据源 Org 信息（v3 已移除组织概念，无需请求）
 */
async function loadOrg() {
  if (!datasourceId.value || isV3.value || isV1.value) return;
  try {
    orgInfo.value = (await fetchInfluxdbOrg(datasourceId.value)) || { orgId: "", orgName: "" };
  } catch {
    // Org 信息读取失败不阻断主流程
  }
}

/**
 * 打开新建 Bucket 弹窗
 */
function openCreateBucket() {
  bucketForm.value = { id: "", name: "", retentionHours: 0, description: "" };
  bucketDialogVisible.value = true;
}

/**
 * 打开编辑保留期弹窗
 * @param row Bucket 行
 */
function openEditRetention(row: InfluxdbBucket) {
  bucketForm.value = {
    id: row.id,
    name: row.name,
    retentionHours: row.retentionHours ?? 0,
    description: "",
  };
  bucketDialogVisible.value = true;
}

/**
 * 提交新建或编辑保留期
 */
async function submitBucket() {
  if (!bucketForm.value.name.trim()) {
    message.warning("请输入 Bucket 名称");
    return;
  }
  bucketSaving.value = true;
  try {
    if (bucketForm.value.id) {
      await updateInfluxdbBucketRetention(bucketForm.value.id, bucketForm.value.retentionHours, datasourceId.value);
      message.success("保留期已更新");
    } else {
      await createInfluxdbBucket({
        datasourceId: datasourceId.value,
        name: bucketForm.value.name.trim(),
        retentionHours: bucketForm.value.retentionHours,
        description: bucketForm.value.description,
      });
      message.success("Bucket 创建成功");
    }
    bucketDialogVisible.value = false;
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/bucket");
  } finally {
    bucketSaving.value = false;
  }
}

/**
 * 删除测量（InfluxDB 的「表」）—— 二次确认后调用后端 DROP MEASUREMENT / DROP TABLE。
 * @param measurement 度量名
 */
async function confirmDeleteMeasurement(measurement: string) {
  if (!activeBucket.value || !measurement) return;
  try {
    await ElMessageBox.confirm(
      `确认删除测量「${measurement}」？该操作会删除该测量的全部数据，不可恢复。`,
      "删除测量",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  try {
    await dropInfluxdbMeasurement(activeBucket.value, measurement, datasourceId.value);
    message.success("测量已删除");
    await loadMeasurements();
    // 已打开的「打开表 / 设计表」页签不再指向被删测量：从页签列表移除
    const tableIdx = tableTabs.value.findIndex(t => t.measurement === measurement);
    if (tableIdx >= 0) closeTableTab(tableTabs.value[tableIdx].id);
    const designIdx = designTabs.value.findIndex(t => t.measurement === measurement);
    if (designIdx >= 0) closeDesignTab(designTabs.value[designIdx].id);
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/measurement/drop");
  }
}

/**
 * 删除 Bucket / 数据库（二次确认）
 * @param row Bucket 行
 */
async function confirmDeleteBucket(row: InfluxdbBucket) {
  try {
    await ElMessageBox.confirm(
      isV3.value
        ? `确认删除数据库「${row.name}」？该操作会删除库内全部数据，不可恢复。`
        : `确认删除 Bucket「${row.name}」？该操作会删除桶内全部数据，不可恢复。`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  try {
    await deleteInfluxdbBucket(row.id, datasourceId.value);
    message.success(databaseModel.value ? "数据库已删除" : "Bucket 已删除");
    if (activeBucket.value === row.name) activeBucket.value = "";
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/bucket");
  }
}

/**
 * 打开表页签（对齐 jdbc「打开表」：工作区 tab，不是弹窗）。
 * @param measurement 度量名
 */
function openTableTab(measurement: string) {
  const existing = tableTabs.value.find(t => t.measurement === measurement);
  if (existing) {
    activeWorkspaceTab.value = existing.id;
    return;
  }
  const id = `t${++tableTabSeq}`;
  const tab: TableTab = {
    id,
    measurement,
    range: "-1h",
    field: "",
    fields: [],
    rows: [],
    columns: [],
    loading: false,
  };
  tableTabs.value.push(tab);
  activeWorkspaceTab.value = id;
  // 用数组里的响应式代理跑查询（理由见 openQueryTab 的注释）：
  // 传 push 前的原始对象，tab.rows / tab.columns 的写入不会触发重渲染，
  // 「查看」页签会一直显示「0 行」的空表。
  runTableTabQuery(tableTabs.value[tableTabs.value.length - 1]!);
}

/** 关闭打开表页签 */
function closeTableTab(id: string) {
  const idx = tableTabs.value.findIndex(t => t.id === id);
  if (idx < 0) return;
  tableTabs.value.splice(idx, 1);
  if (activeWorkspaceTab.value === id) {
    const next = tableTabs.value[idx] || queryTabs.value[queryTabs.value.length - 1];
    activeWorkspaceTab.value = next ? next.id : "overview";
  }
}

/**
 * 执行打开表页签的查询（时间窗 + field 过滤）。
 * @param tab 页签
 */
async function runTableTabQuery(tab: TableTab) {
  if (!activeBucket.value || !tab.measurement) return;
  tab.loading = true;
  try {
    const statement = buildBrowserStatement(tab.measurement, tab.range, tab.field || undefined);
    const { rows } = await runQuery(statement);
    tab.rows = rows;
    tab.columns = deriveColumns(rows);
    tab.fields = deriveFieldOptions(rows);
    ready();
  } catch (e) {
    tab.rows = [];
    tab.columns = [];
    tab.fields = [];
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    tab.loading = false;
  }
}

/**
 * 设计表页签（对齐 jdbc「设计表」：工作区 tab 展示测量字段结构）。
 *
 * <p>InfluxDB 测量没有固定列，设计表 = 查看该测量的 field 键（含类型）与
 * tag 键：v3 用 {@code information_schema.columns}，v1/v2 InfluxQL 用
 * {@code SHOW FIELD KEYS / SHOW TAG KEYS}。</p>
 *
 * @param measurement 度量名
 */
function openDesignTab(measurement: string) {
  const existing = designTabs.value.find(t => t.measurement === measurement);
  if (existing) {
    activeWorkspaceTab.value = existing.id;
    return;
  }
  const id = `d${++designTabSeq}`;
  const tab: DesignTab = { id, measurement, rows: [], loading: false };
  designTabs.value.push(tab);
  activeWorkspaceTab.value = id;
  // 同样传响应式代理（见 openQueryTab 注释）
  void runDesignTabQuery(designTabs.value[designTabs.value.length - 1]!);
}

/** 关闭设计表页签 */
function closeDesignTab(id: string) {
  const idx = designTabs.value.findIndex(t => t.id === id);
  if (idx < 0) return;
  designTabs.value.splice(idx, 1);
  if (activeWorkspaceTab.value === id) {
    const next = designTabs.value[idx] || queryTabs.value[queryTabs.value.length - 1] || tableTabs.value[tableTabs.value.length - 1];
    activeWorkspaceTab.value = next ? next.id : "overview";
  }
}

/**
 * 执行设计表查询：拉取测量的 field 键（含类型）与 tag 键，统一进网格行。
 *
 * <p>v3 走 {@code information_schema.columns}（data_type 即字段类型）；
 * v1/v2 走 {@code SHOW FIELD KEYS}（field + 类型）与 {@code SHOW TAG KEYS}
 * （tag，类型恒为 string）。已存在行全部只读（InfluxDB 只增不改）。</p>
 *
 * @param tab 页签
 */
async function runDesignTabQuery(tab: DesignTab) {
  if (!activeBucket.value || !tab.measurement) return;
  tab.loading = true;
  try {
    const rows: DesignFieldRow[] = [];
    if (isV3.value) {
      const safe = tab.measurement.replace(/'/g, "''");
      const { rows: cols } = await runQuery(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${safe}' ORDER BY ordinal_position`,
      );
      for (const r of cols) {
        const name = String(r.column_name ?? "");
        if (!name || name.toLowerCase() === "time") continue;
        rows.push({ key: `c${rows.length}`, name, kind: "field", type: String(r.data_type ?? ""), isNew: false, dirty: false });
      }
    } else {
      const { rows: fieldRows } = await runQuery(`SHOW FIELD KEYS FROM ${sqlIdentifier(tab.measurement)}`);
      for (const r of fieldRows) {
        const name = String(r.fieldKey ?? r[""] ?? r.name ?? "");
        const type = String(r.fieldType ?? r.type ?? "");
        if (name) rows.push({ key: `f${rows.length}`, name, kind: "field", type, isNew: false, dirty: false });
      }
      const { rows: tagRows } = await runQuery(`SHOW TAG KEYS FROM ${sqlIdentifier(tab.measurement)}`);
      for (const r of tagRows) {
        const name = String(r.tagKey ?? r[""] ?? r.name ?? "");
        if (name) rows.push({ key: `t${rows.length}`, name, kind: "tag", type: "string", isNew: false, dirty: false });
      }
    }
    tab.rows = rows;
    ready();
  } catch (e) {
    tab.rows = [];
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    tab.loading = false;
  }
}

/** InfluxQL 标识符转义：双引号包裹并转义内部引号 */
function sqlIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * 打开写入数据点弹窗（工具栏入口：测量名优先取当前激活的「打开表」页签）
 */
function openWritePoint() {
  const activeTable = tableTabs.value.find(t => t.id === activeWorkspaceTab.value);
  writeForm.value = {
    bucket: activeBucket.value,
    measurement: activeTable?.measurement || "",
    tags: "",
    fields: "",
    timestamp: "",
  };
  writeVisible.value = true;
}

/**
 * 从「打开表」页签打开写入弹窗（预填该页签的测量名）
 * @param tab 打开表页签
 */
function openWritePointFor(tab: TableTab) {
  writeForm.value = {
    bucket: activeBucket.value,
    measurement: tab.measurement,
    tags: "",
    fields: "",
    timestamp: "",
  };
  writeVisible.value = true;
}

/**
 * 把多行 key=value 文本解析成有序字符串
 * @param text 多行文本
 * @param escapeValue 是否对值做 line protocol 转义
 * @returns 拼接好的 key=value 段
 */
function parseKv(text: string, escapeValue: boolean): string {
  const parts: string[] = [];
  for (const line of (text || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const k = trimmed.slice(0, idx).trim();
    let v = trimmed.slice(idx + 1).trim();
    if (!k) continue;
    // 去掉值两侧引号
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    // line protocol 中 tag key/value 和 field key 不能有逗号空格
    const safeKey = k.replace(/,/g, "\\,").replace(/ /g, "\\ ");
    if (escapeValue) {
      // field 值：数字直接写，字符串加引号
      if (/^-?\d+(\.\d+)?$/.test(v)) {
        parts.push(`${safeKey}=${v}`);
      } else {
        parts.push(`${safeKey}="${v.replace(/"/g, '\\"')}"`);
      }
    } else {
      parts.push(`${safeKey}=${v.replace(/,/g, "\\,").replace(/ /g, "\\ ")}`);
    }
  }
  return parts.join(",");
}

/**
 * 提交写入数据点
 */
async function submitWrite() {
  if (!writeForm.value.bucket.trim()) {
    message.warning("请选择 Bucket");
    return;
  }
  if (!writeForm.value.measurement.trim()) {
    message.warning("请输入 Measurement");
    return;
  }
  if (!writeForm.value.fields.trim()) {
    message.warning("请至少填写一个 Field");
    return;
  }
  // measurement 转义
  const measurement = writeForm.value.measurement.trim().replace(/,/g, "\\,").replace(/ /g, "\\ ");
  const tags = parseKv(writeForm.value.tags, false);
  const fields = parseKv(writeForm.value.fields, true);
  if (!fields) {
    message.warning("Field 格式无效，应为 key=value");
    return;
  }
  let line = measurement;
  if (tags) line += "," + tags;
  line += " " + fields;
  if (writeForm.value.timestamp.trim()) {
    line += " " + writeForm.value.timestamp.trim();
  }
  writeSaving.value = true;
  try {
    await writeInfluxdbPoints({
      datasourceId: datasourceId.value,
      bucket: writeForm.value.bucket.trim(),
      precision: "ns",
      lines: line,
    });
    message.success("写入成功");
    writeVisible.value = false;
    // 写入后级联刷新度量与最近数据：新写入的测量要立刻出现在测量列表里
    if (activeBucket.value) await selectBucket(activeBucket.value);
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/write");
  } finally {
    writeSaving.value = false;
  }
}

onMounted(async () => {
  await bind("influxdb");
  if (source.value) {
    await refresh();
  }
});

// 数据源变化（含首次进入）时整体刷新
//
// 触发源只能是 datasourceId，绝不能带上 gap：refresh() 内部的失败路径会调 fail()
// 改写 gap（每条文案还各带端点名：org 404 / measurements 403 / query 403 互不相同），
// 而 gap 一旦在监听源里，就等于让 refresh 自己触发下一次 refresh——一次 refresh
// 改 3~4 次 gap → 触发 3~4 次 refresh → 指数放大。实测该页在远端为 v1.11.8
// （Flux 403 + /api/v2/orgs 404）时 15 秒打了 1148 个请求（约 76 请求/秒），
// 页面主线程响应从 1ms 劣化到 548ms，浏览器被压崩、后端 OOM 死亡都是这一条引起的。
// 缺数据源的提示改为回调里直接读 gap.value：展示需要它，但不让它当触发器。
watch(
  datasourceId,
  async (id) => {
    applyConnectionInfo();
    if (!id) {
      buckets.value = [];
      measurements.value = [];
      recentData.value = [];
      activeBucket.value = "";
      connected.value = false;
      connectionInfo.version = "-";
      influxVersion.value = "";
      if (gap.value) message.warning(gap.value);
      return;
    }
    // 先探服务端真实版本，再拉桶/组织：服务端模型（组织/桶 还是 数据库）
    // 必须由服务端决定，登记的 version 只定查询方言。
    await probeServerVersion();
    await refresh();
  },
  { immediate: true }
);

// 数据源信息变更时刷新连接信息展示
watch(source, applyConnectionInfo);
</script>

<style scoped>
.dsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--bg-fill);
}

.dsm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.dsm-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dsm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.dsm-title-icon {
  color: var(--brand-500, var(--apm-brand-500));
}

.dsm-toolbar-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 查询方言切换：两组按钮长得像一体，但它们表达的是「语句怎么写」，
   与服务端大版本无关，故独立于上方工具条成一组，避免被误读成版本开关。 */
.dsm-dialect {
  display: inline-flex;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.dsm-dialect-btn {
  padding: 4px 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
  background: var(--bg-container);
  border: 0;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.dsm-dialect-btn + .dsm-dialect-btn {
  border-left: 1px solid var(--border-subtle);
}

.dsm-dialect-btn:hover:not(:disabled):not(.is-active) {
  color: var(--text-primary);
}

.dsm-dialect-btn.is-active {
  color: var(--brand-500, var(--apm-brand-500));
  background: var(--bg-hover, var(--apm-bg-hover));
  font-weight: 600;
}

.dsm-dialect-btn:disabled {
  color: var(--text-disabled, #c0c4cc);
  cursor: not-allowed;
}

.dsm-body {
  display: flex;
  flex: 1;
  gap: 16px;
  min-height: 0;
}

/* 左侧连接树卡（对齐 jdbc .dbm-sidebar） */
.dsm-sidebar {
  width: 280px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  overflow: hidden;
}

.dsm-tree {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 12px;
}

.dsm-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s;
}

.dsm-tree-node:hover {
  background: var(--el-fill-color-light);
}

.dsm-tree-node.active {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.dsm-tree-root {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dsm-tree-children {
  padding-left: 14px;
}

.dsm-tree-icon {
  flex-shrink: 0;
}

.dsm-influx-icon {
  color: var(--el-color-primary, var(--brand-500, var(--apm-brand-500)));
}

.dsm-tree-label {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--el-text-color-regular, var(--text-primary));
}

.dsm-tree-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder, var(--text-tertiary));
  background: var(--el-fill-color-light, var(--bg-fill));
  padding: 1px 6px;
  border-radius: 10px;
}

/* 工作区页签（对齐 jdbc dbm-tabs）：总览 + 查询/表数据页签，可多开、切换保留 */
.dsm-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
  flex-shrink: 0;
}

.dsm-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--el-radius-md, 8px) var(--el-radius-md, 8px) 0 0;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease, color 0.15s ease;
}

.dsm-tab:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }

.dsm-tab.active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 600;
  border-color: var(--el-border-color-lighter);
}

.dsm-tab-title { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dsm-tab-close { opacity: 0.5; transition: opacity 0.15s ease; }

.dsm-tab-close:hover { opacity: 1; color: var(--el-color-danger); }

/* 右侧内容区（对齐 jdbc .dbm-content）：单张 16px 卡，内部各视图整块滚动 */
.dsm-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  overflow: hidden;
}

/* 总览（卡内整块滚动） */
.dsm-overview {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  padding: 12px 14px 2px;
}

/* 连接信息：卡内顶部浅底信息条（不再是独立浮卡） */
.dsm-info-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-extra-light, var(--border-subtle));
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-extra-light, var(--bg-container));
}

.dsm-info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsm-info-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder, var(--text-tertiary));
}

.dsm-info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary, var(--text-primary));
}

.dsm-info-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-info-sub {
  font-size: 12px;
  color: var(--el-text-color-placeholder, var(--text-tertiary));
}

.dsm-section-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-placeholder, var(--text-tertiary));
}

.dsm-query-warn {
  margin-left: 8px;
  color: var(--el-color-warning, var(--status-warning, var(--apm-status-warning)));
}

.dsm-section {
  border: 1px solid var(--el-border-color-extra-light, var(--border-subtle));
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color, var(--bg-container));
  overflow: hidden;
  flex-shrink: 0;
}

.dsm-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary, var(--text-primary));
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--border-subtle));
}

.dsm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-tertiary);
}

.dsm-empty-icon {
  opacity: 0.3;
}

.dsm-query-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  flex: 1;
  padding: 12px 14px 2px;
}

/* 查询/结果上下拖拽分栏 */
.dsm-query-split {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: 8px;
}
.dsm-query-editor-pane {
  flex: none;
  min-height: 120px;
}
.dsm-splitter {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 16px;
  cursor: row-resize;
  color: var(--text-tertiary, var(--apm-text-tertiary));
  border-radius: 6px;
  user-select: none;
  transition: background 0.15s, color 0.15s;
}
.dsm-splitter:hover {
  background: var(--bg-hover, var(--apm-bg-hover));
  color: var(--brand-500, var(--apm-brand-500));
}
.dsm-splitter-icon {
  transition: transform 0.15s;
}
.dsm-splitter:hover .dsm-splitter-icon {
  transform: scale(1.15);
}
.dsm-query-result {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dsm-query-result :deep(.rs-table-wrap) {
  flex: 1;
  min-height: 0;
}
.dsm-query-result :deep(.rs-table__body-wrapper),
.dsm-query-result :deep(.el-scrollbar) {
  height: 100%;
}

/* 查询工具栏：对齐 jdbc 查询页（方钮 + 弹性占位 + 提示文案） */
.dsm-query-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-spacer {
  flex: 1;
}

.dsm-query-hint {
  font-size: 12px;
  color: var(--text-secondary, var(--apm-text-secondary));
}

.dsm-query-editor {
  width: 100%;
  padding: 12px;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 13px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  resize: vertical;
  outline: none;
}

.dsm-query-editor:focus {
  border-color: var(--brand-400);
  box-shadow: var(--focus-ring);
}

.dsm-query-result {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.dsm-query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-bottom: 1px solid var(--border-subtle);
}

.dsm-query-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.dsm-row-ops {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.dsm-form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-browser-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dsm-browser-meta {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 打开表页签（对齐 jdbc 表数据 tab）
   flex: 1 + min-height: 0 而不是 height: 100%：页签条是它的兄弟节点，
   100% 会把页签条那 40 多像素也算进来，撑出父容器后又被 overflow: hidden 裁掉。
   flex: 1 拿的是「页签条之外剩下的高度」，这才是表格真正可用的高度。 */
.dsm-browser-tab {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 12px 14px 2px;
}

/* 设计表页签（对齐 jdbc 设计表：工具条 + 说明行 + 可编辑字段网格）
   与 .dsm-browser-tab 同理：flex: 1 吃剩余高度，不用 height: 100% */
.dsm-design-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 10px;
  min-height: 0;
  padding: 12px 14px 2px;
}
.dsm-design-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex: none;
}
/* 表名与能力角标（对齐 jdbc .dbm-table-name / .dbm-kind-chip） */
.dsm-table-name {
  flex: 0 1 auto;
  min-width: 60px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 700;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.dsm-kind-chip {
  flex: none;
  font-size: 11px;
  line-height: 1;
  padding: 4px 9px;
  border-radius: 999px;
  white-space: nowrap;
}
.dsm-kind-chip.ok {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}
.dsm-kind-chip.muted {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
/* 说明行（对齐 jdbc .dbm-col-hint） */
.dsm-col-hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  padding: 2px 0;
  flex: none;
}
/* 字段网格单元格 */
.dsm-mono-editor {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
}
.dsm-field-name {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12px;
  color: var(--el-text-color-primary);
}
.dsm-kind-badge {
  display: inline-block;
  font-size: 11px;
  line-height: 1;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 600;
}
.dsm-kind-badge.is-field {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}
.dsm-kind-badge.is-tag {
  background: #f6ffed;
  color: #389e0d;
}
.dsm-type-chip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dsm-lock {
  font-size: 12px;
  opacity: 0.45;
  cursor: default;
}
.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
}
</style>
