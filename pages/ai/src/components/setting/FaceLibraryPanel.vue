<template>
  <!--
    人脸底库管理（系统设置 → 底库 → 人脸底库）

    版面与「图像底库」保持一致：页头 + 统计卡 + 拖放区 + 列表区（工具栏 / 网格 / 列表 / 翻页）
    + 批量操作条 + 底栏。样式与图像底库**同源**（components/setting/library-panel.css），
    改动样式只改那一份，两个面板一起生效，不会漂移。

    与图像底库的差异只有「业务动作」：
      · 图像底库的拖放区直接把图上传入库；人脸登记需要档案字段（姓名/身份证等，身份证为必填），
        所以拖放区改为**打开登记弹窗**，视觉与交互形态保持与图像底库一致。
      · 状态筛选按「有图片 / 无图片」分（有图 = 服务端登记图或本机缩略图；图像底库按 hasOriginal）。

    数据来源：服务端 GET /v2/face/list 是**权威**（跨浏览器/账号以它为准），
    登记图由服务端落存（GET /v2/face/{id}/image），本机缩略图只作优先展示；按 id 合并，服务端优先。
  -->
  <div class="lib-page">
    <!-- ── 页头 ───────────────────────────────────────────── -->
    <header class="lib-head">
      <div class="lib-head-text">
        <h2 class="lib-head-title">人脸底库</h2>
        <p class="lib-head-sub">当前账号的人脸底库，登记后可用于 1:N 人脸识别与检索</p>
      </div>
      <div class="lib-head-actions">
        <!--
          隐私显示开关（默认关闭 = 全部不预览）。
          人脸属敏感个人信息，且底库常在投屏/录屏演示场景下打开；
          以前缩略图无条件渲染，只做了身份证脱敏，图是完全敞开的。
        -->
        <el-switch v-model="showFaces" inline-prompt active-text="显示" inactive-text="隐藏"
          class="lib-privacy-switch">
          <template #active><el-icon><View /></el-icon></template>
          <template #inactive><el-icon><Hide /></el-icon></template>
        </el-switch>
        <span class="lib-privacy-hint">{{ showFaces ? '人脸图已显示' : '人脸图已隐藏' }}</span>
        <el-button :disabled="loading" @click="load(page)">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="primary" :disabled="loading || !canEnroll" @click="openEnroll">
          <el-icon><Upload /></el-icon>人脸登记入库
        </el-button>
      </div>
    </header>

    <!-- ── 统计（行内迷你口径：来自服务端 stats，不受检索/筛选影响）── -->
    <div class="fl07-metrics">
      <span>已登记 <b>{{ stats.total }}</b></span>
      <span>有图片 <b>{{ stats.withImage }}</b></span>
      <span>无图片 <b>{{ stats.total - stats.withImage }}</b></span>
      <span>身份证已填 <b>{{ stats.withIdCard }}</b></span>
    </div>

    <!-- 服务端有条目、但两边都没图：说清原因，别让人以为底库丢了 -->
    <el-alert
      v-if="stats.total - stats.withImage > 0"
      class="fl-alert"
      type="info"
      :closable="false"
      show-icon
      :title="`有 ${stats.total - stats.withImage} 条没有人脸图`"
      description="图片优先取服务端登记图（登记时落存的裁剪脸，换浏览器也在）；改造前登记的老数据两边都没有。底库条目本身以服务端为准，1:N 识别不受影响。"
    />

    <!-- ── 登记入口已收敛到页头「人脸登记入库」按钮，此处不再放大卡 ── -->

    <FaceEnrollDialog v-model="enrollVisible" :record="editItem" :group="group" @enrolled="() => load(page)" />

    <!-- 特征点弹窗：仅在关键点模型已配置时按钮可见（openLandmark 里还有一道守卫） -->
    <FaceLandmarkDialog
      v-model="lmVisible"
      :face-id="lmItem?.id ?? ''"
      :face-name="lmItem?.name"
      :fallback-thumb="lmItem?.localThumb"
      :group="group"
    />

    <!-- ── 分组页签（07 方向：分组 = 顶部横向 Tabs，带人数角标）── -->
    <div class="fl07-tabs" role="tablist" aria-label="人脸底库分组">
      <button
        v-for="g in groupOptions"
        :key="g"
        type="button"
        role="tab"
        class="fl07-tab"
        :class="{ 'is-active': g === group }"
        :aria-selected="g === group ? 'true' : 'false'"
        @click="group = g"
        :title="`分组是第一层隔离：不同分组各有一套人脸库`"
      >
        {{ g }}
        <span class="fl07-tab-count">{{ g === group ? total : '' }}</span>
      </button>
      <el-select
        v-model="group"
        class="fl07-add-tab"
        filterable
        allow-create
        default-first-option
        placeholder="＋ 分组"
        title="输入新分组名立即创建（登记落进去即存在）"
      >
        <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
      </el-select>
    </div>

        <!-- ── 列表区 ─────────────────────────────────────────── -->
    <section class="lib-panel">
      <div class="lib-toolbar">
        <div class="lib-panel-title">
          人脸列表
          <span class="lib-panel-count">共 {{ total }} 条</span>
        </div>

        <el-input v-model="keyword" placeholder="按姓名/身份证检索（服务端）" clearable class="lib-search"
          @input="commitKeyword()" @keyup.enter="commitKeyword(true)" @clear="commitKeyword(true)">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select v-model="statusFilter" class="lib-filter" @change="load(1)">
          <el-option label="全部状态" value="all" />
          <el-option label="有图片" value="thumb" />
          <el-option label="无图片" value="noThumb" />
        </el-select>

        <div class="lib-view-toggle">
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'grid' }"
            title="网格视图" @click="viewMode = 'grid'">
            <el-icon><Grid /></el-icon>
          </button>
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'list' }"
            title="列表视图" @click="viewMode = 'list'">
            <el-icon><Menu /></el-icon>
          </button>
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'table' }"
            title="表格视图（服务端分页/排序，适合大量条目）" @click="viewMode = 'table'">
            <el-icon><Tickets /></el-icon>
          </button>
        </div>
      </div>

      <!-- 网格视图：viewerjs 挂在本容器上，点任意图即可缩放/左右切换 -->
      <div v-if="viewMode === 'grid'" ref="gridRef" v-loading="loading" class="lib-grid">
        <figure v-for="item in visibleItems" :key="item.id" class="lib-cell"
          :class="{ 'is-selected': selected.has(item.id), 'is-active': isActive(item) }"
          @click="activate(item)">
          <div class="lib-thumb">
            <img v-if="thumbVisible(item)" :src="item.thumb" :alt="item.name" loading="lazy" />
            <div v-else class="fl-thumb-fallback">
              <el-icon :size="26"><Hide v-if="!showFaces" /><UserFilled v-else /></el-icon>
            </div>

            <span class="lib-check" @click.stop="toggleSelect(item)">
              <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
            </span>

            <span class="lib-badges">
              <span v-if="item.restored" class="lib-badge is-repaired" title="该条登记图经过修复（超分/去噪）后重新入库，向量来自修复后的图像">
                <el-icon><MagicStick /></el-icon>已修复
              </span>
              <span v-if="item.hasImage" class="lib-badge is-ok">有图片</span>
              <span v-else class="lib-badge is-warn">无图片</span>
            </span>

            <div class="lib-actions">
              <button v-if="landmarkReady" type="button" class="lib-act" title="查看特征点"
                @click.stop="openLandmark(item)">
                <el-icon><Aim /></el-icon>
              </button>
              <button v-if="restoreReady" type="button" class="lib-act" title="修复人脸并重新入库"
                :disabled="busy" @click.stop="repairOne(item)">
                <el-icon><MagicStick /></el-icon>
              </button>
              <button type="button" class="lib-act" title="编辑信息" @click.stop="openEdit(item)">
                <el-icon><EditPen /></el-icon>
              </button>
              <button type="button" class="lib-act" title="查看大图" @click.stop="preview(item)">
                <el-icon><ZoomIn /></el-icon>
              </button>
              <button type="button" class="lib-act is-danger" title="删除" :disabled="busy"
                @click.stop="removeOne(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>

          <figcaption class="lib-meta">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
          </figcaption>
        </figure>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的人脸"
          class="lib-empty" />
      </div>

      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'" v-loading="loading" class="lib-list">
        <div v-for="item in visibleItems" :key="item.id" class="lib-row"
          :class="{ 'is-selected': selected.has(item.id), 'is-active': isActive(item) }"
          @click="activate(item)">
          <span class="lib-check is-inline" @click.stop="toggleSelect(item)">
            <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
          </span>
          <img v-if="thumbVisible(item)" class="lib-row-thumb" :src="item.thumb" :alt="item.name"
            loading="lazy" @click="preview(item)" />
          <div v-else class="lib-row-thumb fl-thumb-fallback" @click="showFaces && preview(item)">
            <el-icon><Hide v-if="!showFaces" /><UserFilled v-else /></el-icon>
          </div>
          <div class="lib-row-body">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
          </div>
          <span class="lib-badges is-inline">
            <span v-if="item.restored" class="lib-badge is-repaired" title="该条登记图经过修复（超分/去噪）后重新入库，向量来自修复后的图像">
              <el-icon><MagicStick /></el-icon>已修复
            </span>
            <span v-if="item.hasImage" class="lib-badge is-ok">有图片</span>
            <span v-else class="lib-badge is-warn">无图片</span>
          </span>
          <button v-if="landmarkReady" type="button" class="lib-act is-onlight" title="查看特征点"
            @click.stop="openLandmark(item)">
            <el-icon><Aim /></el-icon>
          </button>
          <button v-if="restoreReady" type="button" class="lib-act is-onlight" title="修复人脸并重新入库"
            :disabled="busy" @click.stop="repairOne(item)">
            <el-icon><MagicStick /></el-icon>
          </button>
          <button type="button" class="lib-act is-onlight" title="编辑信息" @click.stop="openEdit(item)">
            <el-icon><EditPen /></el-icon>
          </button>
          <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
            @click.stop="removeOne(item)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的人脸" />
      </div>

      <!--
        表格视图（ReTable）：真正的表格形态，为「上万条底库」准备 ——
        分页/检索/排序全部走服务端（loader → GET /v2/face/list），
        列可排序（sortable=custom → 服务端排序）、可显隐/拖列（ReTable 列配置持久化），
        带总数/跳页/每页条数的完整分页器。勾选列接批量删除条。
      -->
      <div v-else class="lib-table">
        <ReTable
          ref="tableRef"
          table-id="face-lib-table"
          :loader="tableLoader"
          :columns="tableColumns"
          :params="tableParams"
          :loading="loading"
          :show-selection="true"
          :pagination="true"
          row-key="id"
          empty-text="没有符合条件的人脸"
          @sort-change="onTableSort"
          @row-click="onTableRowClick"
          @selection-change="onTableSelection"
        >
          <template #thumb="{ row }">
            <!-- 用 hasImage 判，别用 id 判：没有图的条目 id 也在，thumbFor 会给出一个必然 404 的地址，
                 表格视图是默认视图，破图会直接被看到 -->
            <img v-if="showFaces && row.hasImage" class="lt-thumb" :src="thumbFor(String(row.id))" alt=""
              loading="lazy" @click.stop="previewById(String(row.id))" />
            <span v-else class="lt-thumb lt-thumb-empty">
              <el-icon><Hide v-if="!showFaces" /><UserFilled v-else /></el-icon>
            </span>
          </template>
          <template #idCard="{ row }">
            <span class="lt-mono">{{ maskIdCard(String(row.idCard ?? '')) || '—' }}</span>
          </template>
          <template #hasImage="{ row }">
            <span v-if="row.hasImage" class="lib-badge is-ok">有图片</span>
            <span v-else class="lib-badge is-warn">无图片</span>
          </template>
          <template #actions="{ row }">
            <div class="lt-actions">
              <button v-if="landmarkReady" type="button" class="lib-act is-onlight" title="查看特征点"
                @click.stop="openLandmark(asRow(row))">
                <el-icon><Aim /></el-icon>
              </button>
              <button type="button" class="lib-act is-onlight" title="编辑信息"
                @click.stop="openEdit(asRow(row))">
                <el-icon><EditPen /></el-icon>
              </button>
              <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
                @click.stop="removeOne(asRow(row))">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </ReTable>
      </div>

      <!-- 翻页（表格视图用 ReTable 自带分页器） -->
      <div v-if="viewMode !== 'table' && total > pageSize" class="lib-pager">
        <el-button :disabled="page <= 1 || loading" @click="load(page - 1)">上一页</el-button>
        <span class="lib-pager-text">{{ page }} / {{ pageCount }}</span>
        <el-button :disabled="page >= pageCount || loading" @click="load(page + 1)">下一页</el-button>
      </div>

      <!--
        右侧常驻档案抽屉（02 方向）：列表负责「找」，抽屉负责「看这个人」。
        不用 el-drawer —— 那会盖住列表，来回点选要开关两次；
        常驻一栏点一行换一栏，管一百多条时才是连续的动作。
      -->
      <aside class="fl-drawer" :class="{ 'is-empty': !activeRow }" aria-live="polite">
        <template v-if="activeRow">
          <header class="fl-drawer-head">
            <div class="fl-drawer-id">
              <span class="fl-drawer-name" :title="activeRow.name">{{ activeRow.name || '未命名' }}</span>
              <span class="fl-drawer-sub">{{ activeRow.group }} · {{ ageBucket(activeRow.age) }}</span>
            </div>
            <button type="button" class="fl-drawer-close" title="收起档案" @click="closeActive">
              <el-icon><Close /></el-icon>
            </button>
          </header>

          <div class="fl-drawer-tags">
            <span v-if="activeRow.hasImage" class="lib-badge is-ok">有图片</span>
            <span v-else class="lib-badge is-warn">无图片</span>
            <span v-if="activeRow.restored" class="lib-badge is-repaired">
              <el-icon><MagicStick /></el-icon>已修复
            </span>
          </div>

          <div class="fl-drawer-body">
            <div class="fl-drawer-figure" @click="previewActive">
              <!-- 用 hasImage 判：表格行即使没有图，thumb 也是一个待解析地址（恒真），
                   拿它当条件会给无图条目渲染一张破图 -->
              <img v-if="showFaces && activeRow.hasImage"
                :src="thumbFor(activeRow.id)" :alt="activeRow.name" loading="lazy" />
              <span v-else class="fl-thumb-fallback">
                <el-icon :size="26"><Hide v-if="!showFaces" /><UserFilled v-else /></el-icon>
              </span>
            </div>

            <dl class="fl-metrics">
              <div class="fl-metric">
                <dt>年龄段</dt>
                <dd>{{ ageBucket(activeRow.age) }}</dd>
              </div>
              <div class="fl-metric">
                <dt>颜值</dt>
                <dd>{{ activeRow.photogenic }}</dd>
              </div>
              <div class="fl-metric">
                <dt>坐标</dt>
                <dd>{{ activeRow.lat != null || activeRow.lng != null ? '已标注' : '未标注' }}</dd>
              </div>
            </dl>

            <h4 class="fl-drawer-title">身份信息</h4>
            <dl class="fl-fields">
              <div class="fl-field">
                <dt>身份证</dt>
                <dd class="fl-mono">{{ maskIdCard(activeRow.idCard) || '未填写' }}</dd>
              </div>
              <div class="fl-field">
                <dt>性别</dt>
                <dd>{{ activeRow.gender || '未知' }}</dd>
              </div>
              <div class="fl-field">
                <dt>发型</dt>
                <dd>{{ activeRow.hair || '—' }}</dd>
              </div>
              <div class="fl-field">
                <dt>登记坐标</dt>
                <dd class="fl-mono">{{ formatGeo(activeRow) || '—' }}</dd>
              </div>
              <div class="fl-field is-block">
                <dt>备注</dt>
                <dd>{{ activeRow.note || '—' }}</dd>
              </div>
            </dl>
          </div>

          <footer class="fl-drawer-actions">
            <el-button size="small" @click="openEdit(activeRow)">
              <el-icon><EditPen /></el-icon>编辑档案
            </el-button>
            <el-button v-if="landmarkReady" size="small" @click="openLandmark(activeRow)">
              <el-icon><Aim /></el-icon>特征点
            </el-button>
            <el-button v-if="restoreReady" size="small" :disabled="busy" @click="repairOne(activeRow)">
              <el-icon><MagicStick /></el-icon>修复
            </el-button>
            <el-button size="small" type="danger" plain :disabled="busy" @click="removeOne(activeRow)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </footer>
        </template>

        <div v-else class="fl-drawer-empty">
          <el-icon :size="22"><Tickets /></el-icon>
          <p>点选左侧任意一条，这里显示完整档案</p>
          <span>底库按分组隔离，切分组后档案会跟着换</span>
        </div>
      </aside>
    </section>

    <!-- ── 批量操作条 ─────────────────────────────────────── -->
    <footer class="lib-batch" :class="{ 'is-visible': selected.size > 0 }">
      <span class="lib-batch-count">已选 {{ selected.size }} 条</span>
      <div class="lib-batch-actions">
        <el-button :disabled="busy" @click="clearSelection">取消选择</el-button>
        <el-button type="danger" :disabled="busy" @click="removeSelected">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>
    </footer>

    <!-- 底栏：把当前生效的识别参数亮出来，排查「搜不到」时先看这两个值 -->
    <div class="lib-foot">
      <span class="lib-foot-value">人脸检测模型：{{ detectorModel || '未配置' }} · 特征模型：{{ featureModel || '未配置' }}</span>
      <span v-if="faceUnregisteredMsg" class="lib-foot-warn">
        <span>{{ faceUnregisteredMsg }}</span>
        <el-button size="small" type="warning" plain :loading="fixingModels" @click="fixUnregisteredModels">
          一键修复模型名
        </el-button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 人脸底库管理面板。
 *
 * <p>版面与「图像库」的老面板同源（共用 `library-panel.css`），
 * 差别只在业务动作：图像库已升级为整页的台账/画布工作台
 * （{@code components/library/ImageLibraryPage.vue}），人脸登记则仍留在本面板 ——
 * 拖放区打开登记弹窗而不是直接上传。</p>
 *
 * <p>数据：服务端 `GET /v2/face/list` 权威（每条 `{id, metadata, hasImage}`），
 * 登记图由服务端落存（`GET /v2/face/{id}/image`），本机缩略图优先展示、服务端图兜底，
 * 按 id 合并、字段服务端优先。</p>
 *
 * <p>「特征点」按钮**只在关键点模型已配置时渲染**（口径同后端
 * `FaceClientManager.isModelConfigured("landmark_model")`）—— 没配置就不给入口。</p>
 */
import { message } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus';
import {
  Aim, Close, Delete, EditPen, Grid, Hide, MagicStick, Menu, Refresh, Search, Select,
  Tickets, Upload, UserFilled, View, Warning, ZoomIn,
} from '@element-plus/icons-vue'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn, ReTableLoadParams, RePageResult } from '@repo/ui/re-table'
import { apiService } from '@/services/ApiService'
import { useFaceRegistry, ageBucket, maskIdCard, normalizeGroupName, type FaceRecord } from '@/composables/useFaceRegistry'
import { useLibraryGroups } from '@/composables/useLibraryGroups'
import { createAuthImageLoader, pendingPlaceholder } from '@/utils/authImage'
import { configuredValue } from '@/utils/modelConfigStatus'
import { toErrorMessage } from '@/utils/errors'
import { useModelConfigStore } from '@/stores/modelConfig'
import FaceEnrollDialog from '../management/FaceEnrollDialog.vue'
import FaceLandmarkDialog from '../management/FaceLandmarkDialog.vue'

/** 合并后的展示行 */
interface Row {
  id: string
  name: string
  /** 所属分组（表格「分组」列与元信息行展示用） */
  group: string
  age: number | null
  gender: string
  hair: string
  idCard: string
  photogenic: number
  note: string
  /** 展示用图地址（服务端登记图优先，回落本机缩略图；都可能为空串） */
  thumb: string
  /** 本机（localStorage 登记簿）缩略图，仅用于服务端没图时的兜底绘制 */
  localThumb: string
  /** 是否有图可看（服务端 `hasImage` 或本机缩略图）—— 统计与筛选按它算，别按展示地址算 */
  hasImage: boolean
  /** 登记图是否经过修复（超分/去噪）后重新入库 */
  restored: boolean
  /** 登记时的档案字段原样保留：修复后重新入库必须整体回写，否则姓名/身份证会被清空 */
  meta: Record<string, unknown>
  /**
   * 登记地点纬度（非必填）。
   *
   * <p>服务端放在条目**顶层**（{@code sys_ai_face_library_lat} 列），不在 metadata 里——
   * 列是唯一真相，meta 里可能残留历史副本。故这里显式建模，不走 {@code pick()}。</p>
   */
  lat: number | null
  /** 登记地点经度（非必填），语义同 {@link lat} */
  lng: number | null
}

const loading = ref(false)
const busy = ref(false)
/** 一键修复「onnx: 前缀模型名 → 裸模型名」的进行中状态 */
const fixingModels = ref(false)
const enrollVisible = ref(false)
/** 正在编辑的行；null = 新增登记模式 */
const editItem = ref<FaceRecord | null>(null)
const keyword = ref('')
/** 已提交的检索词（回车/清空/防抖后生效）：网格与表格共用同一口径 */
const kwApplied = ref('')
const statusFilter = ref<'all' | 'thumb' | 'noThumb'>('all')
/**
 * 当前视图。默认 **table**（02 方向）：底库的常态是「一百多条要管」，
 * 满屏可扫的表格 + 右侧常驻档案抽屉比网格更适合；网格/列表仍保留给看图场景。
 */
const viewMode = ref<'grid' | 'list' | 'table'>('table')
const page = ref(1)
const pageSize = 24
/** 服务端排序（表格列头点出来的）；空 = 登记顺序 */
const sortField = ref('')
const sortOrder = ref('')
const selected = ref<Set<string>>(new Set())
const serverItems = ref<Array<Record<string, unknown>>>([])
/**
 * 当前分组。
 *
 * <p>分组是第一层隔离：列表、删除、取图、登记都只作用于它。默认 default 与后端
 * 「不带分组」的语义一致（历史数据也归属 default）—— 也就是说「没选分组」不代表
 * 「看全库」，页面必须把当前分组显式标出来。</p>
 */
const { group, groupOptions, loadGroups, rememberGroups } = useLibraryGroups('face')
/** 命中总数（受 keyword/status 影响）与全库统计（不受影响）——都以服务端为准 */
const total = ref(0)
const stats = ref({ total: 0, withImage: 0, withIdCard: 0 })
const detectorModel = ref('')
const featureModel = ref('')
/** 模型配置门禁：底栏与入口统一用设置中心同源的合并视图，不再读会返回种子默认值的配置口 */
const modelConfig = useModelConfigStore()
/**
 * 关键点模型（`landmark_model`）对**当前用户**的生效值；空 = 未配置。
 *
 * <p><b>为什么取合并视图而不是 {@code /face/config}：</b>系统设置保存 face 分组走的是
 * **用户覆盖层**（face 属于 userScoped 组，管理员也写自己），而 {@code /face/config} 只回
 * 全局层 —— 两边可能不一致。后端 {@code isModelConfigured} 读的是
 * {@code GlobalSettingReader.getStr}（覆盖优先、空也算显式清空），与
 * {@code GET /v2/settings/face/merged} 同一口径。读失败按未配置处理（fail-closed）：
 * 宁可不给入口，也不显示一个点了必然报「能力未启用」的按钮。</p>
 */
const landmarkModel = ref('')
/** 修复模型（`restore_model`）对当前用户的生效值；空 = 未配置，隐藏「修复」入口 */
const restoreModel = ref('')
const registry = useFaceRegistry()
const gridRef = ref<HTMLElement | null>(null)
/** 表格视图实例：删除/登记后让它重新拉当页、清空它的勾选 */
const tableRef = ref<{ reload: () => void; clearAllSelection: () => void } | null>(null)
let viewer: InstanceType<typeof Viewer> | null = null

/**
 * 服务端登记图加载器。
 *
 * <p>底库缩略图与「特征点」弹窗都要拿到那张登记时的裁剪脸。令牌走请求头、不进 URL，
 * 与以图搜图 / 图像底库同一条口径（见 {@code utils/authImage}）。</p>
 */
const authImages = createAuthImageLoader()

/**
 * 是否显示人脸图。默认 **false**：底库属敏感个人信息，缩略图整屏铺开，
 * 而这个页面常在投屏/录屏演示时打开。以前是无条件渲染（只脱敏了身份证），
 * 等于默认敞开。开关本身记在 localStorage，用户主动开一次后保持。
 */
const SHOW_FACES_KEY = 'face_library_show_faces'
const showFaces = ref<boolean>(readShowFacesPref())

function readShowFacesPref(): boolean {
  try {
    return localStorage.getItem(SHOW_FACES_KEY) === '1'
  } catch {
    // 隐私模式/存储被禁用时保持默认隐藏
    return false
  }
}
watch(showFaces, (v) => {
  try {
    localStorage.setItem(SHOW_FACES_KEY, v ? '1' : '0')
  } catch { /* 存不了也只是下次不记住，不影响本次会话 */ }
  // 关闭时把已解析的 blob 全部 revoke，避免人脸图继续留在内存与浏览器缓存里
  if (!v) authImages.revokeAll()
})

/** 缩略图是否应展示：隐私开关关闭，或该条本来就无图 */
function thumbVisible(item: { thumb?: string; localThumb?: string }): boolean {
  return showFaces.value && !!(item.thumb || item.localThumb)
}
/** 特征点弹窗：正在查看的条目 */
const lmVisible = ref(false)
const lmItem = ref<Row | null>(null)

/** 关键点模型是否已配置：决定「特征点」按钮是否显示 */
const landmarkReady = computed(() => String(landmarkModel.value ?? '').trim() !== '')

/** 修复入口是否可用：与关键点按钮同一判据（读用户覆盖优先的合并视图） */
const restoreReady = computed(() => String(restoreModel.value ?? '').trim() !== '')

/** 已配置但模型已从注册清单消失（登记/识别必然后端报“模型未注册”） */
const faceUnregistered = computed(() => modelConfig.unregisteredConfigured)

/** 登记是否可点：既要求字段真配置，也要求模型当前仍在 /api/providers 注册可用 */
const canEnroll = computed(() =>
  modelConfig.faceReady && modelConfig.unregisteredConfigured.length === 0,
)

/** 未注册模型对应的字段中文名（提示用） */
const FACE_FIELD_LABELS: Record<string, string> = {
  detector_model: '人脸检测模型',
  feature_model: '人脸特征模型',
  landmark_model: '人脸关键点模型',
  restore_model: '人脸修复模型',
}

/** 已配置但未注册时的统一提示 */
const faceUnregisteredMsg = computed(() =>
  faceUnregistered.value.length
    ? `人脸识别模型当前不可用：${faceUnregistered.value
        .map((f) => FACE_FIELD_LABELS[f] ?? f)
        .join('、')} 已配置的模型未在后端注册。请到「系统设置 → 默认模型 → 人脸识别」重新选择当前可用的模型`
    : '',
)

/**
 * 服务端条目 → 展示行（网格/列表/表格三视图共用同一映射）。
 *
 * @param s 服务端条目（{@code {id, metadata, hasImage}}）
 * @return 展示行
 */
function toRow(s: Record<string, unknown>): Row {
  const id = String(s.id ?? '')
  const meta = (s.metadata && typeof s.metadata === 'object' ? s.metadata : {}) as Record<string, unknown>
  const local = registry.byId(id, group.value)
  const pick = (k: string): unknown => (meta[k] != null && meta[k] !== '' ? meta[k] : (local as any)?.[k])
  const ageRaw = pick('age')
  const photoRaw = pick('photogenic')
  return {
    id,
    name: String(pick('name') ?? pick('label') ?? ''),
    // 分组以服务端条目为准（列表本身就是按分组查的），本机登记簿只作兜底
    group: normalizeGroupName((s.group as string | undefined) ?? local?.group ?? group.value),
    age: typeof ageRaw === 'number' ? ageRaw : ageRaw == null || ageRaw === '' ? null : Number(ageRaw),
    gender: String(pick('gender') ?? ''),
    hair: String(pick('hair') ?? ''),
    idCard: String(pick('idCard') ?? ''),
    photogenic: typeof photoRaw === 'number' ? photoRaw : photoRaw == null || photoRaw === '' ? 3 : Number(photoRaw),
    note: String(pick('note') ?? ''),
    // 缩略图优先本地（登记它的浏览器立刻就有），否则取**服务端落存的登记图** ——
    // 换浏览器/换账号也能看到图，这正是「在图上画特征点」的前提。
    thumb: local?.thumb || authImages.resolve(faceImagePath(id)),
    localThumb: local?.thumb ?? '',
    hasImage: !!s.hasImage || !!local?.thumb,
    // 修复标记存在元数据里（由「修复并重新入库」写入）。元数据会被本机登记簿覆盖，
    // 所以两侧都认：服务端没写但本机写了也算已修复，避免换浏览器后标签消失。
    restored: meta.restored === true || meta.restored === 'true' || (local as any)?.restored === true,
    // 经纬度取条目顶层（服务端以列为准）；本机登记簿作为兜底，保证刚登记还没刷新时也能显示
    lat: numberOrNull(s.lat ?? (local as any)?.lat),
    lng: numberOrNull(s.lng ?? (local as any)?.lng),
    meta,
  }
}

/**
 * 服务端登记图地址（按分组定位）。
 *
 * <p>必须带分组：同一个 id 可能同时存在于多个分组，不带分组会取到 default 里的
 * 同名条目图，缩略图与列表行对不上。分组名也参与 authImages 的缓存键，
 * 因此切组后不会串用上一组解析出来的 blob。</p>
 *
 * @param id 人脸标识
 * @param suffix 端点后缀（image / original）
 * @returns 相对地址（authImages 会自行拼 baseURL）
 */
function faceImagePath(id: string, suffix = 'image'): string {
  return `/face/${encodeURIComponent(id)}/${suffix}?group=${encodeURIComponent(normalizeGroupName(group.value))}`
}

/**
 * 把任意入参转成数字或 null。
 *
 * <p>后端用 BigDecimal 序列化成数字，但本机登记簿可能存的是字符串，
 * 这里统一掉，避免 `'31.23'` 让坐标判断/格式化出错。</p>
 *
 * @param v 入参
 * @returns 数字；非法或空值返回 null
 */
function numberOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * 当前页行（网格/列表用）。
 *
 * <p>检索与分页已下沉到服务端（{@code GET /v2/face/list?page&size&keyword&status}），
 * 这里只做「服务端条目 → 展示行」的字段映射，不再本地过滤 —— 1 万条时浏览器
 * 只会拿到当页 24 条。</p>
 */
const visibleItems = computed<Row[]>(() => serverItems.value.map(toRow))

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

/* ── 右侧档案抽屉（02 方向） ───────────────────────────────────── */

/**
 * 抽屉当前展示的行；null = 没有选中项（抽屉显示引导语）。
 *
 * <p>存的是**点选那一刻的行对象**，不是 id 再回查：表格视图的分页/排序由 ReTable
 * 自己发请求，{@code serverItems} 停在网格/列表那一套页码上，按 id 回查会在
 * 用户翻到第 2 页后突然查不到人、抽屉变空。行对象只作快照展示，改档案走弹窗，
 * 不会出现「抽屉里改了一半」的状态。</p>
 */
const activeRow = ref<Row | null>(null)

/**
 * 该行是不是抽屉里正在看的那一条（网格/列表上给出「正在看」态）。
 *
 * @param item 展示行
 * @return 是否正在看
 */
function isActive(item: Row): boolean {
  return activeRow.value?.id === item.id
}

/**
 * 点选一行 → 右侧抽屉换成这个人的档案。
 *
 * @param item 展示行
 */
function activate(item: Row) {
  activeRow.value = item
}

/** 收起抽屉（不动列表勾选：那是批量删除用的另一套状态） */
function closeActive() {
  activeRow.value = null
}

/**
 * 表格行点击 → 打开该行的档案抽屉。
 *
 * <p>ReTable 从 cell-click 合成 row-click，行内操作按钮的点击也会冒上来：
 * 这里只切抽屉，不拦按钮自己的动作，两边互不影响。</p>
 *
 * @param row 表格行
 */
function onTableRowClick(row: Record<string, unknown>) {
  activate(asRow(row))
}

/**
 * 表格行的登记图地址。
 *
 * <p>不能直接用 {@code Row.thumb}：那是加载时求值一次的字符串，blob 未就绪时
 * 会**永远停在占位图**（表格行存的是 ReTable 内部状态，不随 blobUrls 重算）。
 * 这里在渲染期调用 {@code resolve}，blobUrls 是响应式映射，加载完成自动重渲染。</p>
 *
 * @param id 人脸标识
 * @return 可直接给 img.src 的地址（本地优先、服务端图兜底）
 */
function thumbFor(id: string): string {
  return registry.byId(id, group.value)?.thumb || authImages.resolve(faceImagePath(id))
}

/**
 * 表格行 → 展示行（loader 已按 {@link toRow} 产出，这里只是槽位的类型收窄）。
 *
 * @param row 表格行
 * @return 展示行
 */
function asRow(row: unknown): Row {
  return row as Row
}

/**
 * 表格缩略图点击：blob 就绪时新开页放大（表格视图没有 viewerjs 容器）。
 *
 * @param id 人脸标识
 */
function previewById(id: string) {
  if (!showFaces.value) {
    message.info('人脸图当前处于隐藏状态，请先打开页头的显示开关')
    return
  }
  const url = thumbFor(id)
  if (!url || url === pendingPlaceholder) {
    message.info('图片加载中或该条没有人脸图（老数据重新登记一次即可）')
    return
  }
  window.open(url, '_blank')
}

/**
 * 抽屉里点登记图放大。
 *
 * <p>表格视图的行是 ReTable 的快照，{@code thumb} 停在加载那一刻的地址；
 * 这里按 id 现取一次（blob 加载完成就能拿到真地址），网格/列表仍走 viewerjs。</p>
 */
function previewActive() {
  const item = activeRow.value
  if (!item) return
  if (viewMode.value === 'table') {
    previewById(item.id)
    return
  }
  preview(item)
}

/**
 * 输入防抖提交检索词（300ms）：先本地改输入框，停顿后一次性打服务端。
 *
 * <p>回车/清空立即生效（见模板）——「敲完回车就查」是检索框的通用预期。</p>
 */
let kwTimer: ReturnType<typeof setTimeout> | null = null
function commitKeyword(immediate = false) {
  if (kwTimer) {
    clearTimeout(kwTimer)
    kwTimer = null
  }
  const apply = () => {
    kwTimer = null
    if (kwApplied.value === keyword.value.trim()) {
      return
    }
    kwApplied.value = keyword.value.trim()
    // 表格视图：kwApplied 变化即 tableParams 变化，ReTable 自己回第 1 页重查，
    // 这里再发一次就是双请求；网格/列表才需要手动 load
    if (viewMode.value !== 'table') void load(1)
  }
  if (immediate) {
    apply()
  } else {
    kwTimer = setTimeout(apply, 300)
  }
}

// 状态筛选立即生效；服务端按 status 过滤后回第 1 页（表格视图同理由 ReTable 自行重查）
watch(statusFilter, () => {
  if (viewMode.value !== 'table') void load(1)
})

// 切换分组 = 换了一整套向量库：表格视图由 tableParams 变化自动重查，网格/列表手动重载。
// 顺带清掉勾选：跨分组的选中状态既无意义，批量删除还会删到别的组里去。
watch(group, () => {
  selected.value = new Set()
  // 换分组 = 换一整套库：右侧档案跟着清掉，免得留着别的组的人
  activeRow.value = null
  tableRef.value?.clearAllSelection()
  rememberGroups([group.value])
  if (viewMode.value !== 'table') void load(1)
})

// 切回网格/列表时用最新检索条件补一次加载（表格期间可能改过条件）
watch(viewMode, (m) => {
  if (m !== 'table') void load(page.value)
})

// 表格视图的参数（交给 ReTable：变化自动回第 1 页并重载 loader）
const tableParams = computed(() => ({
  keyword: kwApplied.value,
  status: statusFilter.value === 'all' ? '' : statusFilter.value,
  sortField: sortField.value,
  sortOrder: sortOrder.value,
  // 分组也进参数：切组时 ReTable 自动回第 1 页重查，不必手动 reload
  group: group.value,
}))

/** 元信息一行：分组 · 年龄段 · 性别 · 发型 · 身份证(脱敏) · 经纬度 */
function formatMeta(item: Row): string {
  // 分组排最前：它是「这条数据属于哪套库」这一层信息，列表已按分组过滤，
  // 标出来用户才明白「为什么这里看不到另一组的人」
  const parts = [`分组 ${item.group}`, ageBucket(item.age), item.gender || '未知']
  if (item.hair) parts.push(item.hair)
  const id = maskIdCard(item.idCard)
  if (id) parts.push(id)
  // 经纬度是选填项，只有真的填了才显示，避免空库每条都拖一个「-」
  const geo = formatGeo(item)
  if (geo) parts.push(geo)
  return parts.join(' · ')
}

/**
 * 格式化经纬度。
 *
 * <p>保留 7 位小数与数据库 DECIMAL(10,7) 精度对齐，不做四舍五入截断——
 * 短于 7 位会在地图上错位到相邻街区。</p>
 *
 * @param item 展示行
 * @returns 形如 `121.4737000, 31.2304000`；两者都为空返回空串
 */
function formatGeo(item: Row): string {
  if (item.lat == null && item.lng == null) return ''
  const fmt = (v: number | null): string => (v == null ? '-' : v.toFixed(7))
  return `${fmt(item.lng)}, ${fmt(item.lat)}`
}

/**
 * 按页/检索词加载（服务端分页：网格与列表只拿当页 24 条）。
 *
 * @param target 目标页码
 */
async function load(target = 1) {
  loading.value = true
  try {
    const data = await apiService.listFaces({
      page: target,
      size: pageSize,
      keyword: kwApplied.value || undefined,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      group: group.value,
    })
    serverItems.value = data.items as Array<Record<string, unknown>>
    total.value = data.total
    // 条目带回的分组名一并并进下拉：后端 groups 接口没列到的历史分组也不该缺席
    rememberGroups(data.items.map((x) => (x as Record<string, unknown>).group as string | undefined))
    if (data.stats) {
      stats.value = data.stats
    } else if (target === 1 && data.items.length === data.total) {
      // 旧后端（无 stats）：全量回包时按当包推算，避免统计卡变哑
      const items = data.items as Array<Record<string, unknown>>
      stats.value = {
        total: data.total,
        withImage: items.filter((x) => !!x.hasImage).length,
        withIdCard: items.filter((x) => {
          const m = (x.metadata ?? {}) as Record<string, unknown>
          return typeof m.idCard === 'string' && m.idCard.trim() !== ''
        }).length,
      }
    }
    page.value = target
    // 越界兜底：删空最后一页后回落到上一页
    if (data.items.length === 0 && target > 1 && target > pageCount.value) {
      await load(pageCount.value)
      return
    }
    // 底栏与特征点/修复入口统一取设置中心同源的合并视图；
    // 种子默认值（SYSTEM_DEFAULT）不算已配置，读失败按未配置处理（fail-closed）。
    await modelConfig.load()
    detectorModel.value = modelConfig.faceDetectorModel
    featureModel.value = modelConfig.faceFeatureModel
    landmarkModel.value = configuredValue(modelConfig.faceMerged, 'landmark_model')
    restoreModel.value = configuredValue(modelConfig.faceMerged, 'restore_model')
    await mountViewer()
    // 表格模式下的删除/登记等动作：本函数顺带把表格也重查一遍（stats 以本次为准）
    if (viewMode.value === 'table' && target === page.value) {
      tableRef.value?.reload()
    }
  } catch (e: any) {
    message.error('加载人脸底库失败：' + toErrorMessage(e))
  } finally {
    loading.value = false
  }
}

/* ── 表格视图（ReTable · 后端分页/筛选/排序） ──────────────────── */

/**
 * 表格列（02 方向）：只留「扫一眼就要认人」的 5 列。
 *
 * <p>右侧常驻 340px 档案抽屉占掉一栏宽度，再摆 10 列会被横向挤成滚动条；
 * 年龄/性别/发型/备注/坐标都已在抽屉里，分组由页签与抽屉标明 —— 列上重复只是噪音。
 * 排序、列显隐、列宽拖拽仍由 ReTable 持久化（table-id 未变，老配置继续生效）。</p>
 */
const tableColumns: ReTableColumn[] = [
  { prop: 'thumb', label: '登记图', width: 72, slot: 'thumb', align: 'center' },
  { prop: 'name', label: '姓名', minWidth: 104, sortable: 'custom', showOverflowTooltip: true },
  { prop: 'idCard', label: '身份证', width: 140, sortable: 'custom', slot: 'idCard' },
  { prop: 'hasImage', label: '状态', width: 80, sortable: 'custom', slot: 'hasImage', align: 'center' },
  { prop: 'actions', label: '操作', width: 104, slot: 'actions', fixed: 'right', align: 'center' },
]

/**
 * 表格 loader：ReTable 注入 page/pageSize，params 来自 {@link tableParams}
 * （检索词/状态/排序任一变化都会让它自动回第 1 页重查）。
 *
 * @param p ReTable 传入的分页与查询参数
 * @return 分页结果（total 为服务端命中数）
 *
 * 返回类型保持裸 RePageResult：ReTableLoader 形参类型是非泛型的，
 * 声明成 RePageResult<Row> 反而赋不过去（TS2322）。
 * 与全仓其余 26 个 loader 的写法一致，行类型在返回处显式收敛。
 */
async function tableLoader(p: ReTableLoadParams): Promise<RePageResult> {
  const params = (p.params ?? {}) as Record<string, unknown>
  const kw = String(params.keyword ?? '').trim()
  const st = String(params.status ?? '')
  const data = await apiService.listFaces({
    page: p.page,
    size: p.pageSize,
    keyword: kw || undefined,
    status: st || undefined,
    sortField: String(params.sortField ?? '') || undefined,
    sortOrder: String(params.sortOrder ?? '') || undefined,
    group: group.value,
  })
  return {
    total: data.total,
    // Row 是带具体字段的展示行，对 RePageResult 的 Record<string, unknown> 形参做一次显式收敛；
    // 运行时值没有任何转换，ReTable 也只按列的 prop 取字段，不受这个断言影响。
    items: data.items.map((s) => toRow(s as Record<string, unknown>)) as unknown as Record<string, unknown>[],
  }
}

/**
 * 列头排序 → 写回 {@link tableParams}（触发 ReTable 回第 1 页重查）。
 *
 * @param payload 列头排序载荷（prop + ascending/descending/null）
 */
function onTableSort(payload: { prop?: string; order?: string | null }) {
  const order = payload?.order
  sortField.value = order ? String(payload.prop ?? '') : ''
  sortOrder.value = order === 'descending' ? 'desc' : order ? 'asc' : ''
}

/**
 * 表格勾选 → 同步到批量删除条（与网格/列表共用同一个 {@link selected}）。
 *
 * @param rows 当前勾选的行
 */
function onTableSelection(rows: Array<Record<string, unknown>>) {
  selected.value = new Set(rows.map((r) => String(r.id ?? '')))
}

/** viewerjs 挂到网格容器；网格重渲染后需要重建 */
async function mountViewer() {
  await nextTick()
  viewer?.destroy()
  viewer = null
  if (gridRef.value) {
    viewer = new Viewer(gridRef.value, { navbar: false, toolbar: true, title: false })
  }
}

function openEnroll() {
  if (!modelConfig.faceReady) {
    message.warning('人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型')
    return
  }
  if (faceUnregistered.value.length) {
    message.error(faceUnregisteredMsg.value)
    return
  }
  editItem.value = null
  enrollVisible.value = true
}

/**
 * 修复存量 `onnx:modelName` 配置：人脸设置应存裸模型名（后端 FaceClientManager
 * 按 ModelRegistry 裸 key 查会话），把带前缀的值去掉前缀重写用户覆盖，再刷新门禁。
 */
async function fixUnregisteredModels() {
  const entries = faceUnregistered.value
  if (!entries.length) return
  const payload: Record<string, string> = {}
  for (const field of entries) {
    const raw = String(configuredValue(modelConfig.faceMerged, field) ?? '')
    payload[field] = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw
  }
  if (!Object.keys(payload).length) return
  try {
    fixingModels.value = true
    await apiService.updateUserGroupOverrides('face', payload)
    await modelConfig.refresh()
    await load(page.value)
    message.success('已修复人脸检测 / 特征模型名称，可以重新登记了')
  } catch (e: any) {
    message.error('修复模型名称失败：' + (e?.message ?? e))
  } finally {
    fixingModels.value = false
  }
}

/**
 * 打开「编辑信息」：把当前行转成 FaceEnrollDialog 需要的 record 形状。
 *
 * <p>编辑只改档案字段，不重跑检测 —— 所以不需要照片在本地。</p>
 *
 * @param item 列表行
 */
function openEdit(item: Row) {
  editItem.value = {
    id: item.id,
    name: item.name,
    age: item.age,
    gender: item.gender,
    hair: item.hair,
    idCard: item.idCard,
    photogenic: item.photogenic,
    note: item.note,
    // 经纬度必须回填：编辑弹窗保存时会整体回写档案元数据，
    // 少了这两项就等于把用户填过的坐标静默清空。
    lat: item.lat,
    lng: item.lng,
    thumb: item.thumb,
    enrolledAt: 0,
    // 分组随行带走：编辑弹窗保存时会用同一分组回写，避免改完掉进 default
    group: item.group,
  }
  enrollVisible.value = true
}

/**
 * 打开「特征点」弹窗。
 *
 * <p>按钮在模型未配置时不渲染；这里再挡一道（配置可能在会话中途被改空），
 * 不让一个必然回「能力未启用」的请求打到后端。</p>
 *
 * @param item 列表行
 */
function openLandmark(item: Row) {
  if (!landmarkReady.value) {
    message.info('人脸关键点模型未配置：请先在「系统配置 → 人脸识别」中配置 landmark_model')
    return
  }
  lmItem.value = item
  lmVisible.value = true
}

function toggleSelect(item: Row) {
  const s = selected.value
  if (s.has(item.id)) s.delete(item.id)
  else s.add(item.id)
  // Set 是浅响应：换一个实例触发更新
  selected.value = new Set(s)
}

function clearSelection() {
  selected.value = new Set()
  // 表格视图有自己的勾选状态（ReTable 内部），不同步清会留下「看着没选、批量还删」的幽灵态
  tableRef.value?.clearAllSelection()
}

function preview(item: Row) {
  // 隐私开关关闭时不允许任何预览路径（含 viewerjs），否则「隐藏」形同虚设
  if (!showFaces.value) {
    message.info('人脸图当前处于隐藏状态，请先打开页头的显示开关')
    return
  }
  if (!item.thumb) {
    message.info('该条没有人脸图（老数据可能两边都没有，重新登记一次即可）')
    return
  }
  if (viewer) {
    const idx = visibleItems.value.findIndex((r) => r.id === item.id)
    if (idx >= 0) { viewer.view(idx); return }
  }
  // 列表视图等未挂载 viewerjs 的视图：直接新开页放大（与表格视图同一行为）
  window.open(item.thumb, '_blank')
}

/**
 * 删除一条：先删服务端，成功后再清本地缩略图。
 *
 * <p>顺序不能反 —— 先清本地再删服务端，一旦服务端失败，
 * 会留下「列表里有、永远没头像」的条目。</p>
 */
async function removeOne(item: Row) {
  const label = item.name || item.id
  try {
    await ElMessageBox.confirm(
      `确定把「${label}」从人脸底库删除？删除后不再参与 1:N 识别，且无法恢复。`,
      '删除人脸',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch { return }
  busy.value = true
  try {
    const ok = await apiService.deleteFace(item.id, group.value)
    if (!ok) {
      // 后端返回 false 表示「这次删除没生效」。不要直接报错——先回读一次：
      // 有些旧实例在「DB 有行、内存快照没有」时会返回 false，但行其实已经删掉了；
      // 以列表为准再判一次，避免把「已删除」显示成「删除失败」。
      await load(page.value)
      const stillThere = visibleItems.value.some((r) => r.id === item.id)
      if (stillThere) {
        message.error('删除失败：底库未确认删除')
        return
      }
      registry.remove(item.id, group.value)
      if (activeRow.value?.id === item.id) activeRow.value = null
      message.success(`已删除：${label}`)
      return
    }
    // 只删本组的本地档案：同一个 id 在别的分组里也是合法记录
    registry.remove(item.id, group.value)
    selected.value.delete(item.id)
    selected.value = new Set(selected.value)
    // 删掉的正是抽屉里那个人：收起档案，别留一张已不存在的记录
    if (activeRow.value?.id === item.id) activeRow.value = null
    message.success(`已删除：${label}`)
    await load(page.value)
  } catch (e: any) {
    message.error('删除失败：' + (e?.message ?? e))
  } finally {
    busy.value = false
  }
}

async function removeSelected() {
  const ids = [...selected.value]
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条人脸？删除后无法恢复。`, '批量删除', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
  } catch { return }
  busy.value = true
  let okCount = 0
  try {
    for (const id of ids) {
      try {
        if (await apiService.deleteFace(id, group.value)) { registry.remove(id, group.value); okCount++ }
      } catch { /* 单条失败继续，最后统一报数 */ }
    }
    message[okCount === ids.length ? 'success' : 'warning'](`已删除 ${okCount}/${ids.length} 条`)
    clearSelection()
    // 抽屉里那个人若在删除范围内，一并收起（否则会停在一条已不存在的档案上）
    if (activeRow.value && ids.includes(activeRow.value.id)) activeRow.value = null
    await load(page.value)
  } finally {
    busy.value = false
  }
}

/**
 * 修复人脸并重新入库（5.2）。
 *
 * <p>流程：取原图（没有就退裁剪脸）→ {@code POST /face/restore} 超分/去噪 →
 * 用修复后的图**重新走一遍登记管线**，并把 {@code restored:true} 写进档案。
 * 最后这步是必须的：特征向量必须来自修复后的图像，否则图变了、向量还是旧的，
 * 「修复」只是个装饰。</p>
 *
 * <p>档案字段必须**整体回写**：登记接口的 metadata 是覆盖语义，只传
 * {@code restored} 会把姓名/身份证/年龄全清空，等于抹掉这条档案。</p>
 *
 * @param item 目标行
 */
async function repairOne(item: Row) {
  const label = item.name || item.id
  busy.value = true
  try {
    // 优先原图：修复模型在原图上的效果与用户当初拍到的那张照片一致；
    // 只有老数据没有原图时才退裁剪脸
    const src = (await apiService.originalImageBlob(item.id, group.value))
      || (await apiService.faceImageBlob(item.id, group.value))
    if (!src) {
      message.error('该条没有可修复的图片，请重新登记一次')
      return
    }
    const repaired = await apiService.restoreFace(src, 'face.png')
    if (!repaired) {
      message.error('修复失败：请确认「系统设置 → 默认模型 → 人脸识别 → 修复模型」已配置')
      return
    }
    const meta = { ...item.meta, restored: true, restoredAt: Date.now() }
    // 重新入库必须回到**同一条记录所在的组**，否则会凭空多出一条 default 里的副本
    await apiService.enrollFace(item.id, repaired, meta, 'face-restored.png', group.value)
    message.success(`「${label}」已修复并重新入库`)
    await load(page.value)
  } catch (e: any) {
    message.error('修复失败：' + (e?.message ?? e))
  } finally {
    busy.value = false
  }
}

onMounted(async () => {
  // 先拉分组选项再拉列表：否则下拉里只有 default，用户看不到自己已有的分组
  await loadGroups()
  void load(1)
})
onBeforeUnmount(() => {
  viewer?.destroy()
  viewer = null
  authImages.dispose()
})
</script>

<style scoped src="./library-panel.css"></style>

<style scoped>
/* 仅有的一处人脸专有样式：无缩略图时的占位（图像底库恒有图，不需要） */
.fl-thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--rm-text-secondary, var(--el-text-color-placeholder));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.lib-foot-warn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  padding: 6px 10px;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: color-mix(in srgb, var(--rm-warning, var(--el-color-warning)) 12%, transparent);
  color: var(--rm-text-regular, var(--el-text-color-regular));
  font-size: 12px;
  line-height: 1.6;
}

.fl-alert {
  margin: 0;
}

/* ── 表格视图（ReTable 内的槽位内容，作用域样式经插槽作用到这些节点）── */
.lib-table {
  width: 100%;
}

.lt-thumb {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--rm-radius-sm, var(--el-border-radius-base, 4px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  cursor: zoom-in;
}

.lt-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rm-text-secondary, var(--el-text-color-placeholder));
  cursor: default;
}

.lt-mono {
  font-family: var(--el-font-family, monospace);
  font-size: var(--rm-font-sm, var(--el-font-size-small));
}

.lt-actions {
  display: inline-flex;
  gap: 4px;
}

/* ==================== 07 分组页签专属样式 ==================== */
.fl07-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  font-size: 12px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl07-metrics b {
  margin-left: 2px;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rm-text, var(--el-text-color-primary));
}

.fl07-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--lib-border, var(--el-border-color-lighter));
  border-radius: var(--lib-radius, var(--el-radius-lg, 12px));
  background: var(--lib-surface, var(--el-bg-color-overlay));
}

.fl07-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--rm-text-regular, var(--el-text-color-regular));
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  transition: background var(--lib-transition, 0.2s ease), color var(--lib-transition, 0.2s ease);
}

.fl07-tab:hover {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text, var(--el-text-color-primary));
}

.fl07-tab.is-active {
  background: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 12%, transparent);
  color: var(--rm-primary, var(--el-color-primary));
  font-weight: 600;
}

.fl07-tab-count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 16%, transparent);
  color: var(--rm-primary, var(--el-color-primary));
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.fl07-tab:not(.is-active) .fl07-tab-count {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl07-add-tab {
  width: 88px;
  margin-left: 4px;
}

.fl07-add-tab :deep(.el-select__wrapper) {
  min-height: 30px;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
}

.fl07-add-tab .el-select__placeholder {
  color: var(--rm-primary, var(--el-color-primary));
}

/* ==================== 02 方向：列表 + 常驻档案抽屉 ====================
   面板改成两栏网格：左栏是网格/列表/表格共用的列表位，右栏常驻档案。
   用 grid 分区而不是再包一层容器，是为了不动三个视图的既有结构 ——
   图像底库、重识别库与人脸底库共用 library-panel.css，这里只改人脸这一份，
   别把另外两个面板一起翻掉。 */
.lib-page .lib-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 16px;
}

.lib-page .lib-panel > .lib-toolbar {
  grid-column: 1 / -1;
  grid-row: 1;
}

.lib-page .lib-panel > .lib-grid,
.lib-page .lib-panel > .lib-list,
.lib-page .lib-panel > .lib-table {
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
}

.lib-page .lib-panel > .lib-pager {
  grid-column: 1;
  grid-row: 3;
}

.lib-page .lib-panel > .fl-drawer {
  grid-column: 2;
  grid-row: 2 / 4;
}

/* 「正在看」态：比勾选态弱一档 —— 勾选是批量删除的范围，别让两者混成一种颜色 */
.lib-cell.is-active {
  border-color: var(--lib-border, var(--el-border-color-lighter));
  box-shadow: inset 0 -2px 0 var(--rm-primary, var(--el-color-primary));
}

.lib-row.is-active {
  border-color: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 35%, var(--rm-border, var(--el-border-color-lighter)));
}

/* ── 档案抽屉 ─────────────────────────────────────────── */
.fl-drawer {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 160px);
  padding-left: 16px;
  border-left: 1px solid var(--rm-border, var(--el-border-color-lighter));
  overflow-y: auto;
}

/* 没选人时也给一栏高度：空着的一格若塌成 0，右栏边界会突然跳走 */
.fl-drawer.is-empty {
  justify-content: center;
  min-height: 260px;
}

.fl-drawer-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.fl-drawer-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.fl-drawer-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--rm-text, var(--el-text-color-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fl-drawer-sub {
  font-size: 12px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: transparent;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--rm-transition, var(--el-transition-duration-fast, 0.2s) ease), color var(--rm-transition, var(--el-transition-duration-fast, 0.2s) ease);
}

.fl-drawer-close:hover {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text, var(--el-text-color-primary));
}

.fl-drawer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 20px;
}

.fl-drawer-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 登记图：3:4 证件照比例，点开走 viewerjs 放大（与列表同一条预览路径） */
.fl-drawer-figure {
  width: 104px;
  height: 128px;
  border: 1px solid var(--rm-border, var(--el-border-color-lighter));
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  overflow: hidden;
  cursor: zoom-in;
}

.fl-drawer-figure img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fl-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.fl-metric {
  padding: 6px 8px;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-metric dt {
  font-size: 11px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-metric dd {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rm-text, var(--el-text-color-primary));
  font-variant-numeric: tabular-nums;
}

.fl-drawer-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.fl-field {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.fl-field dt {
  flex: 0 0 56px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-field dd {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--rm-text-regular, var(--el-text-color-regular));
  word-break: break-all;
}

/* 备注是长文本：标题压在上面，不跟内容抢一行 */
.fl-field.is-block {
  flex-direction: column;
  gap: 2px;
}

.fl-field.is-block dt {
  flex: none;
}

.fl-mono {
  font-family: var(--el-font-family, monospace);
  font-variant-numeric: tabular-nums;
}

.fl-drawer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--rm-border, var(--el-border-color-lighter));
}

.fl-drawer-actions .el-button {
  flex: 1 1 auto;
  min-width: 92px;
  margin-left: 0;
}

.fl-drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 36px 8px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  text-align: center;
}

.fl-drawer-empty p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--rm-text-regular, var(--el-text-color-regular));
}

.fl-drawer-empty span {
  font-size: 12px;
}

/* 窄屏：档案掉到列表下方，横排两栏会把表格挤到只剩滚动条 */
@media (max-width: 1240px) {
  .lib-page .lib-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .lib-page .lib-panel > .fl-drawer {
    grid-column: 1;
    grid-row: auto;
    position: static;
    max-height: none;
    padding: 12px 0 0;
    border-left: none;
    border-top: 1px solid var(--rm-border, var(--el-border-color-lighter));
  }

  .fl-drawer-figure {
    width: 88px;
    height: 110px;
  }
}
</style>
