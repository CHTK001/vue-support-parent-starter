<template>
  <div class="da">
    <!-- ==================== 左：三分支树 + 设备列表右区 ==================== -->
    <div class="da-body">
      <!-- 左侧：设备分组（含「全部」） -->
      <aside class="da-rail" :class="{ 'is-collapsed': railCollapsed }">
        <!-- 折叠态：只留计数与展开按钮 -->
        <div v-if="railCollapsed" class="da-strip">
          <button type="button" class="da-strip__count" title="展开分组树" @click="toggleRail">
            <b>{{ filtered.length }}</b>
            <span>/{{ rows.length }}</span>
          </button>
          <span class="da-strip__dots">
            <i class="is-on" :title="`在线 ${onlineCount}`" />
            <i class="is-off" :title="`离线 ${offlineCount}`" />
          </span>
          <span class="da-strip__gap" />
          <button type="button" class="da-strip__toggle" title="展开分组树" @click="toggleRail">
            <ReIcon name="ArrowRight" :size="13" />
          </button>
        </div>

        <div v-show="!railCollapsed" class="da-rail__head">
          <div class="da-rail__row">
            <span class="da-rail__title">设备资产</span>
            <span class="da-rail__count">{{ filtered.length }}<i>/{{ rows.length }}</i></span>
            <span class="da-rail__gap" />
            <button type="button" class="da-tool" title="刷新" :disabled="loading" @click="fetchAll">
              <ReIcon name="RefreshRight" :size="12" />
            </button>
            <button type="button" class="da-tool" title="设备大屏" @click="goScreen">
              <ReIcon name="DataBoard" :size="12" />
            </button>
            <button type="button" class="da-tool" title="厂商接入" @click="goProvider">
              <ReIcon name="Connection" :size="12" />
            </button>
            <button type="button" class="da-tool" title="导出台账" :disabled="!rows.length" @click="exportDevices">
              <ReIcon name="Download" :size="12" />
            </button>
            <button type="button" class="da-tool is-primary" title="新增设备" @click="openCreate">
              <ReIcon name="Plus" :size="12" />
            </button>
          </div>
          <ReInput v-model="keyword" placeholder="搜索名称 / 编码 / IP" clearable class="da-search" />
          <div class="da-filters">
            <button
              v-for="f in statusFilters"
              :key="f.value"
              type="button"
              class="da-chip"
              :class="{ 'is-active': onlineFilter === f.value }"
              @click="onlineFilter = f.value"
            >
              <span>{{ f.label }}</span>
              <b>{{ f.count }}</b>
            </button>
          </div>
        </div>

        <!-- 左侧树：上方切换维度（组织 / 分组 / 厂家），下面只显示当前维度的树 -->
        <ReScrollbar v-show="!railCollapsed" class="da-tree">
          <div class="da-tree__ops">
            <button type="button" class="da-tree__op" title="新建分组" @click="openGroupCreate(null)">
              <ReIcon name="Plus" :size="12" />
            </button>
            <button type="button" class="da-tree__op" title="刷新" :disabled="loading" @click="fetchAll">
              <ReIcon :name="loading ? 'Loading' : 'RefreshRight'" :size="12" />
            </button>
          </div>

          <!-- 维度切换：一次只显示一个维度，避免三棵树同时摊开 -->
          <div class="da-tree__modes">
            <button
              v-for="mode in railModes"
              :key="mode.value"
              type="button"
              class="da-tree__mode"
              :class="{ 'is-active': railMode === mode.value }"
              @click="switchRail(mode.value)"
            >
              {{ mode.label }}
            </button>
          </div>

          <!-- 清筛选：始终在最上面，点它回到全部设备 -->
          <div
            class="da-tree__item da-tree__item--root"
            :class="{ 'is-active': !filterState && !leafDeviceId }"
            @click="selectFilter(null)"
          >
            <span class="da-tree__caret is-leaf" />
            <span class="da-tree__dot is-all" />
            <span class="da-tree__name">全部设备</span>
            <span class="da-tree__count">{{ rows.length }}</span>
          </div>

          <!--
            树行：组织 / 分组 / 厂家 / 设备叶子共用一套行结构。
            左键 = 筛选（设备叶子则是回到台账定位），右键统一交给 ReContextMenu。
          -->
          <div
            v-for="row in treeNodes"
            :key="row.key"
            class="da-tree__item"
            :class="{
              'is-active': row.kind === 'device'
                ? leafDeviceId === row.id
                : filterState?.kind === row.kind && filterState?.id === row.id,
              'is-dragging': draggingRow?.key === row.key,
              'is-drop': dropTarget?.key === row.key
            }"
            :style="{ paddingLeft: `${10 + row.depth * 14}px` }"
            :title="row.label"
            :draggable="canDragRow(row)"
            @click="onTreeRowClick(row)"
            @contextmenu="openTreeMenu($event, row)"
            @dragstart="onTreeDragStart($event, row)"
            @dragover="onTreeDragOver($event, row)"
            @dragleave="onTreeDragLeave(row)"
            @drop="onTreeDrop($event, row)"
            @dragend="onTreeDragEnd"
          >
            <span
              v-if="row.hasChildren"
              class="da-tree__caret"
              :class="{ 'is-open': row.expanded }"
              @click.stop="toggleNode(row.key)"
            >
              <ReIcon name="ArrowRight" :size="10" />
            </span>
            <span v-else class="da-tree__caret is-leaf" />

            <!-- 设备叶子用大类图标，其余用维度色点 -->
            <ReIcon v-if="row.kind === 'device'" :name="row.icon || 'Grid'" :size="13" class="da-tree__icon" />
            <span v-else class="da-tree__dot" :class="`is-${row.kind}`" />

            <span class="da-tree__name">{{ row.label }}</span>
            <span v-if="row.hint" class="da-tree__hint">{{ row.hint }}</span>
            <i
              v-if="row.kind === 'device'"
              class="da-tree__state"
              :class="row.online ? 'is-on' : 'is-off'"
              :title="row.online ? '在线' : '离线'"
            />
            <span v-else class="da-tree__count">{{ row.count }}</span>
          </div>

          <div v-if="!treeNodes.length" class="da-tree__empty">
            {{ railMode === 'vendor' ? '暂无厂家数据' : railMode === 'org' ? '暂无组织数据' : '暂无分组' }}
          </div>
        </ReScrollbar>

        <!-- 左树右键菜单：组织 / 分组 / 厂家 / 设备叶子共用，命令全部按上下文分发 -->
        <ReContextMenu
          ref="treeMenuRef"
          :items="treeMenuItems"
          :title="treeMenuTarget?.label || ''"
          :subtitle="treeMenuSubtitle"
          @select="onTreeMenuSelect"
        />

        <div v-show="!railCollapsed" class="da-rail__foot">
          <div class="da-rail__row">
            <span class="da-foot__sum">
              <i class="is-on" />{{ onlineCount }}
              <i class="is-off" />{{ offlineCount }}
            </span>
            <span class="da-foot__hint">{{ rows.length }} 台设备</span>
          </div>
          <button type="button" class="da-rail__fold" title="收起分组树" @click="toggleRail">
            <ReIcon name="ArrowLeft" :size="12" />
          </button>
        </div>
      </aside>

      <!-- 右侧：工作区页签（「设备资产」固定页签 + 设备详情 / 通道 / 日志 / 拓扑页签） -->
      <section class="da-work">
        <ReTabs
          v-model="activeTab"
          :tabs="workTabs"
          closable
          show-close-all
          :context-menu="tabContextMenu"
          empty-text="右键左侧设备叶子，选择要打开的功能"
          @close="closeWorkTab"
          @close-all="closeAllWorkTabs"
          @context-command="onTabCommand"
        >
          <template #default="{ tab }">
            <!-- ============ 设备资产：台账列表 + 批量工具条 + 底部信息条 ============ -->
            <div v-if="tab.name === ASSETS_TAB" class="da-assets">
              <!-- 台账工具条：左侧是概览 / 批量操作，右侧固定「卡片 / 表格」视图切换 -->
              <div class="da-batch" :class="{ 'is-batch': selection.length > 0 }">
                <div class="da-batch__left">
                  <template v-if="selection.length">
                    <span class="da-batch__text">已选 <b>{{ selection.length }}</b> 台设备</span>
                    <div class="da-batch__ops">
                      <ReButton icon="VideoCamera" :show-text="true" size="small" type="primary" plain @click="openVideoWizard">视频预览</ReButton>
                      <ReButton icon="Refresh" :show-text="true" size="small" @click="batchReconnect">批量重连</ReButton>
                      <ReButton icon="FolderOpened" :show-text="true" size="small" @click="openBatchGroups">设置分组</ReButton>
                      <ReButton icon="Delete" :show-text="true" size="small" type="danger" plain @click="batchRemove">批量删除</ReButton>
                    </div>
                  </template>
                  <template v-else>
                    <span class="da-batch__text">
                      共 <b>{{ filtered.length }}</b> 台设备
                      <span v-if="filterState" class="da-batch__filter">
                        · 已筛选「{{ filterLabel }}」
                        <button type="button" class="da-batch__clear" @click="filterState = undefined">清除</button>
                      </span>
                      <span v-if="leafDeviceId" class="da-batch__filter">
                        · 已定位「{{ leafDeviceLabel }}」
                        <button type="button" class="da-batch__clear" @click="clearLeafDevice">清除</button>
                      </span>
                    </span>
                    <span class="da-batch__hint">
                      {{ viewMode === 'card' ? '点卡片看基础信息，双击开详情，右键是全部功能' : '点行看基础信息，双击开详情，右键是全部功能' }}
                    </span>
                  </template>
                </div>
                <div class="da-view" role="group" aria-label="视图切换">
                  <button
                    type="button"
                    class="da-view__btn"
                    :class="{ 'is-active': viewMode === 'card' }"
                    title="卡片台账"
                    @click="viewMode = 'card'"
                  >
                    <ReIcon name="Grid" :size="12" />卡片
                  </button>
                  <button
                    type="button"
                    class="da-view__btn"
                    :class="{ 'is-active': viewMode === 'table' }"
                    title="表格台账"
                    @click="viewMode = 'table'"
                  >
                    <ReIcon name="List" :size="12" />表格
                  </button>
                </div>
              </div>

              <!-- ============ 卡片台账（默认视图） ============ -->
              <div v-if="viewMode === 'card'" class="da-cards">
                <ReScrollbar class="da-cards__scroll">
                  <div v-if="filtered.length" class="da-cards__grid">
                    <article
                      v-for="row in filtered"
                      :key="row.deviceInfoId"
                      class="da-card"
                      :class="[
                        `is-${row.deviceInfoCategory || 'other'}`,
                        {
                          'is-active': activeDevice?.deviceInfoId === row.deviceInfoId,
                          'is-selected': isCardSelected(row),
                          'is-offline': !row.deviceInfoOnline
                        }
                      ]"
                      @click="onCardClick($event, row)"
                      @dblclick="openDetail(row)"
                      @contextmenu="openCardMenu($event, row)"
                    >
                      <header class="da-card__head">
                        <span class="da-card__icon">
                          <ReIcon :name="getCategoryIcon(row.deviceInfoCategory)" :size="16" />
                        </span>
                        <span class="da-card__title">
                          <b :title="row.deviceInfoName">
                            <i class="da-card__dot" :class="row.deviceInfoOnline ? 'is-on' : 'is-off'" />
                            {{ row.deviceInfoName }}
                          </b>
                          <span class="da-card__code mono">{{ row.deviceInfoCode || '未编码' }}</span>
                        </span>
                      </header>

                      <div class="da-card__facts">
                        <span class="da-card__fact mono" :title="row.deviceInfoIp || '平台接入'">
                          <ReIcon name="Monitor" :size="11" />
                          <span class="da-card__ellipsis">{{ row.deviceInfoIp ? `${row.deviceInfoIp}:${row.deviceInfoPort ?? ''}` : '平台接入' }}</span>
                        </span>
                        <span class="da-card__fact" :title="`${vendorLabel(row.deviceInfoVendor)} · ${row.deviceInfoModel || '—'}`">
                          <ReIcon name="Shop" :size="11" />
                          <span class="da-card__ellipsis">{{ vendorLabel(row.deviceInfoVendor) }} · {{ row.deviceInfoModel || '—' }}</span>
                        </span>
                        <span class="da-card__fact">
                          <ReIcon name="Clock" :size="11" />
                          <ReTime
                            :value="row.deviceInfoLastOnlineAt"
                            format="MM-DD HH:mm"
                            relative
                            placeholder="从未上线"
                          />
                        </span>
                      </div>

                      <div class="da-card__tags">
                        <span class="da-card__cat">{{ getCategoryLabel(row.deviceInfoCategory) }}</span>
                        <ReTag
                          v-for="g in deviceGroupLabels(row).slice(0, 2)"
                          :key="g.groupId"
                          type="primary"
                          effect="plain"
                          size="small"
                          @click.stop="selectGroup(g)"
                        >
                          {{ g.groupName }}
                        </ReTag>
                        <span v-if="deviceGroupLabels(row).length > 2" class="da-card__more">
                          +{{ deviceGroupLabels(row).length - 2 }}
                        </span>
                      </div>

                      <footer class="da-card__foot">
                        <span class="da-card__where">
                          <ReIcon name="LocationInformation" :size="11" />
                          {{ hasLocation(row) ? '已定位' : '未定位' }}
                          <template v-if="row.deviceInfoOwnerName"> · {{ row.deviceInfoOwnerName }}</template>
                        </span>
                        <div class="da-card__acts">
                          <button
                            v-if="isPlayable(row, vendors)"
                            type="button"
                            class="da-card__act is-play"
                            title="播放"
                            @click.stop="openPlay(row)"
                          >
                            <ReIcon name="VideoPlay" :size="12" /><span>播放</span>
                          </button>
                          <button type="button" class="da-card__act" title="设备详情" @click.stop="openDetail(row)">
                            <ReIcon name="Position" :size="12" /><span>详情</span>
                          </button>
                        </div>
                      </footer>

                      <button
                        type="button"
                        class="da-card__check"
                        :class="{ 'is-on': isCardSelected(row) }"
                        title="勾选设备以批量操作"
                        @click.stop="toggleCardSelection(row)"
                      >
                        <ReIcon :name="isCardSelected(row) ? 'Select' : 'CircleCheck'" :size="13" />
                      </button>
                    </article>
                  </div>
                  <div v-else class="da-empty">
                    <span class="da-empty__icon"><ReIcon name="Files" :size="24" /></span>
                    <span class="da-empty__title">没有符合条件的设备</span>
                    <span class="da-empty__text">试试清除筛选或换个关键词。</span>
                  </div>
                </ReScrollbar>
              </div>

              <!-- ============ 表格台账 ============ -->
              <div v-else class="da-table-wrap">
                <ReTable
                  class="da-table"
                  table-id="device-assets"
                  :data="tableRows"
                  :columns="columns"
                  :loading="loading"
                  :pagination="false"
                  :toolbar="false"
                  row-key="deviceInfoId"
                  :layout-table="{ fill: true }"
                  :context-menu="tableMenu"
                  show-selection
                  stripe
                  @row-click="onRowClick"
                  @cell-click="onCellClick"
                  @selection-change="onSelectionChange"
                  @context-menu-select="onTableMenuSelect"
                >
                  <template #col-device="{ row }">
                    <div class="da-dev">
                      <span class="da-dev__icon" :class="`is-${row.deviceInfoCategory || 'other'}`" :title="getCategoryLabel(row.deviceInfoCategory)">
                        <ReIcon :name="getCategoryIcon(row.deviceInfoCategory)" :size="14" />
                      </span>
                      <div class="da-dev__text">
                        <div class="da-dev__top">
                          <span class="da-dev__name" :title="row.deviceInfoName">{{ row.deviceInfoName }}</span>
                          <el-tag :type="statusMeta(row.deviceInfoStatus).type" size="small" effect="plain">
                            {{ statusMeta(row.deviceInfoStatus).label }}
                          </el-tag>
                          <el-tag v-if="row.deviceInfoSource === 'vendor'" size="small" effect="plain" type="info">同步</el-tag>
                        </div>
                        <div class="da-dev__code mono">{{ row.deviceInfoCode || '未编码' }}</div>
                      </div>
                    </div>
                  </template>
                  <template #col-vendor="{ row }">
                    <div class="da-vendor__name">{{ vendorLabel(row.deviceInfoVendor) }}</div>
                    <div class="da-vendor__model">{{ row.deviceInfoModel || '—' }}</div>
                  </template>
                  <template #col-ip="{ row }">
                    <span v-if="row.deviceInfoIp" class="da-ip mono">
                      <ReIcon name="Monitor" :size="12" />
                      {{ row.deviceInfoIp }}:{{ row.deviceInfoPort ?? '' }}
                    </span>
                    <span v-else class="da-muted">平台接入</span>
                  </template>
                  <template #col-status="{ row }">
                    <div class="da-status">
                      <DeviceStatusPulse :online="row.deviceInfoOnline" />
                      <div class="da-status__hint">{{ row.deviceInfoOnline ? '心跳正常' : '当前离线' }}</div>
                    </div>
                  </template>
                  <template #col-lastOnline="{ row }">
                    <ReTime
                      :value="row.deviceInfoLastOnlineAt"
                      format="YYYY-MM-DD HH:mm"
                      relative
                      placeholder="从未上线"
                      class="da-time"
                    />
                  </template>
                  <template #col-location="{ row }">
                    <DeviceLocationCell :device="asDevice(row)" />
                  </template>
                  <template #col-owner="{ row }">
                    <DeviceOwnerCell :device="asDevice(row)" />
                  </template>

                  <template #col-group="{ row }">
                    <div class="da-group-list">
                      <ReTag v-for="g in deviceGroupLabels(row)" :key="g.groupId" type="primary" effect="plain" size="small" @click="selectGroup(g)">
                        {{ g.groupName }}
                      </ReTag>
                    </div>
                  </template>
                  <template #empty>
                    <div class="da-empty">
                      <span class="da-empty__icon"><ReIcon name="Files" :size="24" /></span>
                      <span class="da-empty__title">暂无设备</span>
                      <span class="da-empty__text">可点左上角「+」新增，或前往「厂商接入」同步。</span>
                    </div>
                  </template>
                </ReTable>
              </div>

              <!-- 卡片右键菜单：与表格共用同一套设备命令 -->
              <ReContextMenu
                ref="cardMenuRef"
                :items="cardMenuItems"
                :title="cardMenuTarget?.deviceInfoName || ''"
                :subtitle="cardMenuSubtitle"
                @select="onCardMenuSelect"
              />

              <!-- 底部信息条：选中设备的 IP / 在线 / 经纬度 等基础信息 -->
              <footer class="da-bar">
                <template v-if="statusDevice">
                  <div class="da-bar__id">
                    <span class="da-bar__name" :title="statusDevice.deviceInfoName">{{ statusDevice.deviceInfoName }}</span>
                    <el-tag size="small" effect="plain" :type="statusDevice.deviceInfoOnline ? 'success' : 'info'">
                      {{ statusDevice.deviceInfoOnline ? '在线' : '离线' }}
                    </el-tag>
                  </div>
                  <div class="da-bar__item mono">
                    <ReIcon name="Monitor" :size="12" />
                    <span>{{ statusDevice.deviceInfoIp ? `${statusDevice.deviceInfoIp}:${statusDevice.deviceInfoPort ?? ''}` : '平台接入' }}</span>
                  </div>
                  <div class="da-bar__item" :title="hasLocation(statusDevice) ? formatCoord(statusDevice.deviceInfoLatitude, statusDevice.deviceInfoLongitude) : '未配置经纬度'">
                    <ReIcon name="LocationInformation" :size="12" />
                    <span>{{ hasLocation(statusDevice) ? formatCoord(statusDevice.deviceInfoLatitude, statusDevice.deviceInfoLongitude) : '未定位' }}</span>
                  </div>
                  <div class="da-bar__item">
                    <ReIcon name="Shop" :size="12" />
                    <span>{{ vendorLabel(statusDevice.deviceInfoVendor) }} / {{ statusDevice.deviceInfoModel || '—' }}</span>
                  </div>
                  <div class="da-bar__item">
                    <ReIcon name="Grid" :size="12" />
                    <span>{{ getCategoryLabel(statusDevice.deviceInfoCategory) }}</span>
                  </div>
                  <div class="da-bar__item" v-if="statusDevice.deviceInfoOwnerName">
                    <ReIcon name="User" :size="12" />
                    <span>{{ statusDevice.deviceInfoOwnerName }}</span>
                  </div>
                  <div class="da-bar__gap" />
                  <ReButton icon="Position" :show-text="true" size="small" @click="openDetail(statusDevice)">详情</ReButton>
                </template>
                <template v-else>
                  <div class="da-bar__id">
                    <span class="da-bar__name">设备资产</span>
                  </div>
                  <div class="da-bar__item">共 <b>{{ filtered.length }}</b> 台</div>
                  <div class="da-bar__item"><ReIcon name="Position" :size="12" />在线 {{ onlineCount }}</div>
                  <div class="da-bar__item"><ReIcon name="LocationInformation" :size="12" />已定位 {{ locatedCount }}</div>
                  <div class="da-bar__gap" />
                  <span class="da-bar__hint">点选设备查看基础信息，右键打开功能菜单</span>
                </template>
              </footer>
            </div>

            <!-- ============ 设备详情 ============ -->
            <ReDeviceDetailPanel
              v-else-if="tabKindOf(tab.name) === 'detail'"
              :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
              :device="deviceOfTab(tab.name)"
              :devices="rows"
              :vendors="vendors"
              @edit="openEdit"
              @refreshed="refreshAll"
            />

            <!-- ============ 播放（纯画面页签，仅可播放设备） ============ -->
            <ReDevicePlayPanel
              v-else-if="tabKindOf(tab.name) === 'play'"
              :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
              mode="device"
              :device="deviceOfTab(tab.name)"
              :devices="rows"
              :vendors="vendors"
            />

            <!-- ============ 通道管理 ============ -->
            <DeviceChannelView
              v-else-if="tabKindOf(tab.name) === 'channels'"
              :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
              :device-id="tabOf(tab.name)?.deviceId || ''"
            />

            <!-- ============ 设备日志 ============ -->
            <DeviceEventLogView
              v-else-if="tabKindOf(tab.name) === 'events'"
              :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
              :device-id="tabOf(tab.name)?.deviceId || ''"
            />

            <!-- ============ 机房拓扑 ============ -->
            <DeviceTopoView
              v-else-if="tabKindOf(tab.name) === 'topo'"
              :key="`${tab.name}#${reloadSeqOf(tab.name)}`"
              :filter="tabOf(tab.name)?.topoFilter || null"
            />
          </template>

          <template #empty>
            <div class="da-empty">
              <span class="da-empty__icon"><ReIcon name="Files" :size="24" /></span>
              <span class="da-empty__title">还没有打开其它页签</span>
              <span class="da-empty__text">右键左侧设备叶子可打开详情 / 通道 / 日志 / 拓扑。</span>
            </div>
          </template>
        </ReTabs>
      </section>
    </div>

    <!-- 设备大屏：页内播放台，左侧可拖拽画面源，右侧拼墙 -->
    <ReDeviceWallPlayer v-model="wallVisible" :devices="rows" :vendors="vendors" />

    <!-- 新增 / 编辑 -->
    <ReDeviceFormDialog
      v-model="formVisible"
      :device="editingDevice"
      :vendors="vendors"
      :org-tree="orgTree"
      @saved="onDeviceSaved"
    />

    <!-- 新建 / 编辑分组：按组织添加，分组所有权归组织 -->
    <ReDialog v-model="groupCreateVisible" title="新建分组" width="480px">
      <el-form label-position="top" class="da-group-form">
        <el-form-item label="分组名称" required>
          <el-input v-model="groupForm.groupName" placeholder="例如 研发中心 / 一期机房" maxlength="64" />
        </el-form-item>
        <el-form-item :label="groupCreateKind === 'sub' ? '上级分组' : '上级组织'">
          <el-select v-model="groupForm.groupParent" :placeholder="groupCreateKind === 'sub' ? '选一个上级分组' : '按组织把分组挂上去（可选新分组）'" clearable class="w-full">
            <el-option v-for="option in parentOptions" :key="option.value" :label="option.label" :value="option.value" />
          </el-select>
          <div class="da-group-form__hint">按组织添加：分组随组织归集，车间/大厦/楼层看组织的结构</div>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="groupForm.groupRemark" type="textarea" :rows="2" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <ReButton @click="groupCreateVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="groupCreating" @click="saveGroup">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 分配设备到分组（全量替换分组下的设备） -->
    <ReDialog v-model="assignVisible" title="分配设备" width="800px">
      <div class="da-assign-tip">全量替换：操作会覆盖该分组下已有设备，请确认。</div>
      <div class="da-assign-list">
        <div
          v-for="d in assignDevices"
          :key="d.deviceInfoId"
          class="da-assign-cell"
          :class="{ 'is-assigned': pendingAssigned.has(d.deviceInfoId || '') }"
          @click="pendingToggle(d)"
        >
          <div class="da-assign-cell__head">
            <span class="da-assign-cell__name">{{ d.deviceInfoName }}</span>
            <el-icon class="da-assign-cell__check">
              <Check v-if="pendingAssigned.has(d.deviceInfoId || '')" /><Plus v-else />
            </el-icon>
          </div>
          <div class="da-assign-cell__meta">{{ vendorLabel(d.deviceInfoVendor) }} · {{ d.deviceInfoIp || '无 IP' }}</div>
        </div>
      </div>
      <template #footer>
        <ReButton @click="assignVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="assignSaving" @click="onAssignSave">确认分配 ({{ pendingAssigned.size }})</ReButton>
      </template>
    </ReDialog>

    <!-- 详情抽屉 / 通道 / 日志 / 拓扑抽屉已收进右侧工作区页签 -->

    <!-- 资产 / 位置各自独立的配置弹窗：只提交本分区字段 -->
    <ReDeviceAssetDialog
      v-model="assetDialogVisible"
      :device="assetDialogDevice"
      :section="assetDialogSection"
      @saved="onAssetSaved"
    />

    <!-- 视频预览向导 -->
    <ReDialog v-model="videoWizardVisible" title="视频预览" width="480px" destroy-on-close>
      <div class="space-y-4">
        <div>
          <div class="text-sm mb-2">布局</div>
          <el-radio-group v-model="videoLayout">
            <el-radio-button :value="1">1×1</el-radio-button>
            <el-radio-button :value="4">2×2</el-radio-button>
            <el-radio-button :value="9">3×3</el-radio-button>
            <el-radio-button :value="16">4×4</el-radio-button>
          </el-radio-group>
        </div>
        <div>
          <div class="text-sm mb-2">打开方式</div>
          <el-radio-group v-model="videoOpenMode">
            <el-radio value="current">当前页</el-radio>
            <el-radio value="new">新窗口</el-radio>
          </el-radio-group>
        </div>
        <el-checkbox v-model="videoRemind">打开后提示（remind=true）</el-checkbox>
        <div class="text-xs text-el-text-secondary">
          已选 {{ selection.length }} 台设备；超出布局数量时按布局分页轮播，单画面全屏默认主码流。
        </div>
      </div>
      <template #footer>
        <el-button @click="videoWizardVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmVideoWizard">打开预览</el-button>
      </template>
    </ReDialog>

    <!-- 设置分组（单台 / 批量） -->
    <el-dialog v-model="groupDialogVisible" :title="groupDialogTitle" width="460px" destroy-on-close>
      <div class="text-xs text-el-text-secondary mb-3">
        一台设备可以同时属于多个分组；保存会用勾选结果整体替换{{ groupDialogDeviceIds.length > 1 ? '这些设备' : '该设备' }}的分组。
      </div>
      <div v-if="groupOptions.length" class="max-h-[360px] overflow-auto">
        <el-checkbox-group v-model="groupDialogChecked" class="flex flex-col gap-2">
          <el-checkbox v-for="node in groupOptions" :key="node.groupId" :value="node.groupId">
            {{ node.label }}
          </el-checkbox>
        </el-checkbox-group>
      </div>
      <div v-else class="py-6 text-center text-sm text-el-text-secondary">
        还没有分组，先到「设备分组」页创建。
      </div>
      <template #footer>
        <el-button @click="groupDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="groupSaving" @click="saveDeviceGroups">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备资产（Deck 布局，对齐主机资产）
 *
 * 左侧是设备分组（含「全部」），右侧是 ReTable 设备列表；
 * 底部常驻条显示选中设备的 IP / 在线 / 经纬度 / 厂商 / 分类 / 负责人等基础信息。
 *
 * 交互约定：单击设备行只选中（底部条跟随），双击打开详情，
 * <b>全部功能入口统一收敛到设备行右键菜单</b>：详情 / 编辑 / 通道管理 / 设备日志 /
 * 重连 / 刷新状态 / 设置分组 / 视频预览 / 删除。
 * 通道管理与设备日志不再是独立菜单页，作为右键菜单项以抽屉方式嵌入。
 *
 * 列表不挂自动刷新：状态以手动刷新（左栏刷新按钮 / 右键「刷新状态」）为准。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, defineAsyncComponent, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Connection,
  Check,
  Delete,
  EditPen,
  FolderOpened,
  Grid,
  Plus,
  Position,
  Refresh,
  RefreshRight,
  Tickets,
  VideoCamera,
  VideoPlay
} from '@element-plus/icons-vue'
import { message } from '@repo/core'
import ReDialog from '@repo/ui/re-dialog'
import ReIcon from '@repo/ui/re-icon'
import ReInput from '@repo/ui/re-input'
import ReScrollbar from '@repo/ui/re-scrollbar'
import ReButton from '@repo/ui/re-button'
import ReTable from '@repo/ui/re-table'
import type {
  ReTableCellClickPayload,
  ReTableColumn,
  ReTableContextMenuContext,
  ReTableContextMenuItem
} from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import ReTabs from '@repo/ui/re-tabs'
import type { ReTabsContextItem, ReTabsItem } from '@repo/ui/re-tabs'
import ReContextMenu from '@repo/ui/re-context-menu'
import type { ReContextMenuItem } from '@repo/ui/re-context-menu'
import ReTime from '@repo/ui/re-time'

import DeviceStatusPulse from '@pages/device/src/components/DeviceStatusPulse.vue'
import DeviceOwnerCell from '@pages/device/src/components/DeviceOwnerCell.vue'
import DeviceLocationCell from '@pages/device/src/components/DeviceLocationCell.vue'
import ReDeviceFormDialog from '@pages/device/src/components/ReDeviceFormDialog.vue'
import ReDeviceAssetDialog from '@pages/device/src/components/ReDeviceAssetDialog.vue'
import ReDeviceDetailPanel from '@pages/device/src/components/ReDeviceDetailPanel.vue'
import ReDevicePlayPanel from '@pages/device/src/components/ReDevicePlayPanel.vue'
import ReDeviceWallPlayer from '@pages/device/src/components/ReDeviceWallPlayer.vue'
import DeviceChannelView from '@pages/device/src/views/DeviceChannelView.vue'
import DeviceEventLogView from '@pages/device/src/views/DeviceEventLogView.vue'

/** 账台账拓扑页签按需加载：首屏不背着机房拓扑的代码 */
const DeviceTopoView = defineAsyncComponent(() => import('@pages/device/src/views/DeviceTopoView.vue'))

import { deviceApi } from '@pages/device/src/api/deviceApi'
import { getCategoryIcon, getCategoryLabel } from '@pages/device/src/utils/deviceCategory'
import { isPlayable } from '@pages/device/src/utils/deviceCapability'
import {
  buildOrgTree,
  formatCoord,
  hasLocation,
  statusMeta
} from '@pages/device/src/utils/deviceFormat'
import type {
  DeviceGroupNode,
  DeviceInfo,
  DeviceVendorDescriptor,
  OrgNode
} from '@pages/device/src/types/device'

const router = useRouter()

const rows = ref<DeviceInfo[]>([])
const vendors = ref<DeviceVendorDescriptor[]>([])
const orgTree = ref<OrgNode[]>([])
const groups = ref<DeviceGroupNode[]>([])
const assignments = ref<Array<{ deviceId: string; groupId: string }>>([])
const loading = ref(false)
const selection = ref<DeviceInfo[]>([])

/** 台账视图：B 版默认卡片台账，可切回表格 */
const viewMode = ref<'card' | 'table'>('card')
/** 设备大屏播放台 */
const wallVisible = ref(false)

/* ==================== 左侧分组列 ==================== */
const railCollapsed = ref(false)
const keyword = ref('')
const onlineFilter = ref<'all' | 'online' | 'offline'>('all')

/* ==================== 左侧树：组织 / 分组 / 厂家 三维度切换 ==================== */
/** 厂家节点：从当前台账归并（显示名优先取厂商描述符） */
const vendorNodes = computed<Array<{ vendor: string; label: string; count: number }>>(() => {
  const map = new Map<string, { vendor: string; label: string; count: number }>()
  for (const device of rows.value) {
    const vendor = device.deviceInfoVendor || ''
    if (!vendor) continue
    const item = map.get(vendor) || { vendor, label: vendors.value.find((v) => v.vendor === vendor)?.name || vendor, count: 0 }
    item.count += 1
    map.set(vendor, item)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})

/** 当前维度：组织树 / 分组树 / 厂家列表，一次只显示一棵 */
type RailMode = 'org' | 'group' | 'vendor'
const railMode = ref<RailMode>('group')
const railModes: Array<{ value: RailMode; label: string }> = [
  { value: 'org', label: '组织' },
  { value: 'group', label: '分组' },
  { value: 'vendor', label: '厂家' }
]

/** 切维度时清掉不匹配的筛选，避免右侧列表还挂着上一维度的条件 */
function switchRail(mode: RailMode): void {
  railMode.value = mode
  leafDeviceId.value = ''
  const f = filterState.value
  if (f && f.kind !== mode) filterState.value = undefined
}

/** 树节点折叠态：按「维度 + 节点 id」记，默认展开 */
const collapsed = ref<Set<string>>(new Set())
function toggleNode(key: string): void {
  const next = new Set(collapsed.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsed.value = next
}
function isCollapsed(key: string): boolean {
  return collapsed.value.has(key)
}

/** 左侧树筛选：一次只保留一组（组织 / 分组 / 厂家）；再点同一节点即取消 */
const filterState = ref<{ kind: RailMode; id: string } | undefined>(undefined)
function selectFilter(payload: { kind: RailMode; id: string } | null): void {
  // 任何一次筛选变更都解除「设备叶子定位」，两者是互斥的收敛口径
  leafDeviceId.value = ''
  if (!payload) {
    filterState.value = undefined
    return
  }
  const current = filterState.value
  filterState.value = current && current.kind === payload.kind && current.id === payload.id ? undefined : payload
}

/** 当前筛选项的显示名（台账工具条用） */
const filterLabel = computed(() => {
  const f = filterState.value
  if (!f) return ''
  if (f.kind === 'org') {
    return orgFlat.value.find((node) => node.deviceOrganizationId === f.id)?.deviceOrganizationName || f.id
  }
  if (f.kind === 'group') {
    return flatGroups.value.find((node) => node.groupId === f.id)?.groupName || f.id
  }
  return vendorNodes.value.find((node) => node.vendor === f.id)?.label || f.id
})

/** 组织树平铺（带 depth），供父级选项与组织行用 */
const orgFlat = computed<Array<OrgNode & { depth: number }>>(() => {
  const out: Array<OrgNode & { depth: number }> = []
  const walk = (nodes: OrgNode[], depth: number) => {
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
      out.push({ ...node, depth })
      if (node.children?.length) walk(node.children, depth + 1)
    }
  }
  walk(orgTree.value, 0)
  return out
})

/** 上级选项：新增分组 = 组织树（分组归属组织），新增子分组/重命名 = 分组树 */
const parentOptions = computed<Array<{ value: string; label: string }>>(() => {
  if (groupCreateKind.value === 'sub') {
    return flatGroups.value.map((node) => ({
      value: node.groupId,
      label: `${'　'.repeat(node.depth)}${node.groupName}`
    }))
  }
  return orgFlat.value.map((node) => ({
    value: node.deviceOrganizationId,
    label: `${'　'.repeat(node.depth)}${node.deviceOrganizationName}`
  }))
})

/** 组织（含其下的子孙组织）关联的设备数 */
const orgDeviceCount = (orgId: string): number => {
  const ids = orgDescendants(orgId)
  return rows.value.filter((d) => ids.has(d.deviceInfoOrgId || '')).length
}

/** 组织 id 集合：含后代（设备 id 不在组织树时，回退为自身） */
const orgDescendants = (orgId: string): Set<string> => {
  const ids = new Set<string>([orgId])
  const walk = (nodes?: OrgNode[]) => {
    if (!nodes) return
    for (const node of nodes) {
      ids.add(node.deviceOrganizationId)
      walk(node.children)
    }
  }
  const node = orgFlat.value.find((n) => n.deviceOrganizationId === orgId)
  walk(node?.children)
  return ids
}

/** 子树是否应展开：折叠集合里没有它，且任一祖先都没被折叠 */
function subtreeOpen(ancestors: string[]): boolean {
  return !ancestors.some((key) => isCollapsed(key))
}

/**
 * 当前维度的树行（已按折叠态裁剪）。
 *
 * <p>组织与分组是真树：父节点折叠时其子孙整段不出现；厂家是平铺一行一个。
 * 每个组织 / 分组 / 厂家节点展开后，末尾挂上它直属的设备叶子——
 * 左键点设备叶子回台账定位，右键开功能页签（详情 / 通道 / 日志 / 拓扑）。</p>
 */
const treeNodes = computed<Array<TreeRow>>(() => {
  const out: Array<TreeRow> = []
  /** 追加某个节点下的设备叶子 */
  const pushDevices = (nodeKey: string, list: DeviceInfo[], depth: number) => {
    for (const device of list) {
      out.push({
        key: `${nodeKey}#dev-${device.deviceInfoId}`,
        kind: 'device',
        label: device.deviceInfoName || device.deviceInfoCode || device.deviceInfoId,
        depth,
        id: device.deviceInfoId,
        count: 0,
        hasChildren: false,
        expanded: false,
        icon: getCategoryIcon(device.deviceInfoCategory),
        online: !!device.deviceInfoOnline
      })
    }
  }
  if (railMode.value === 'org') {
    const walk = (nodes: OrgNode[], depth: number) => {
      for (const node of nodes) {
        const key = `org-${node.deviceOrganizationId}`
        const devices = directOrgDevices(node.deviceOrganizationId)
        const hasChildren = !!node.children?.length || devices.length > 0
        const open = hasChildren && subtreeOpen([key])
        out.push({
          key,
          kind: 'org',
          label: node.deviceOrganizationName,
          depth,
          id: node.deviceOrganizationId,
          count: orgDeviceCount(node.deviceOrganizationId),
          hasChildren,
          expanded: open
        })
        if (!open) continue
        pushDevices(key, devices, depth + 1)
        if (node.children?.length) walk(node.children, depth + 1)
      }
    }
    walk(orgTree.value, 0)
    return out
  }
  if (railMode.value === 'group') {
    const walk = (nodes: DeviceGroupNode[], depth: number) => {
      for (const node of nodes) {
        if (!node.groupId) continue
        const key = `group-${node.groupId}`
        const devices = directGroupDevices(node.groupId)
        const hasChildren = !!node.children?.length || devices.length > 0
        const open = hasChildren && subtreeOpen([key])
        const parent = node.groupParent
        out.push({
          key,
          kind: 'group',
          label: node.groupName,
          depth,
          id: node.groupId,
          count: groupDeviceIds(node.groupId).size,
          remark: node.groupRemark,
          hint: parent && !isGroupId(parent) ? orgLabelOf(parent) : undefined,
          hasChildren,
          expanded: open
        })
        if (!open) continue
        pushDevices(key, devices, depth + 1)
        if (node.children?.length) walk(node.children, depth + 1)
      }
    }
    walk(groups.value, 0)
    return out
  }
  for (const node of vendorNodes.value) {
    const key = `vendor-${node.vendor}`
    const devices = vendorDevices(node.vendor)
    const hasChildren = devices.length > 0
    const open = hasChildren && subtreeOpen([key])
    out.push({
      key,
      kind: 'vendor',
      label: node.label,
      depth: 0,
      id: node.vendor,
      count: node.count,
      hasChildren,
      expanded: open
    })
    if (open) pushDevices(key, devices, 1)
  }
  return out
})

/** 组织直属（不含子孙组织）的设备 */
function directOrgDevices(orgId: string): DeviceInfo[] {
  return rows.value.filter((device) => (device.deviceInfoOrgId || '') === orgId)
}

/** 分组直属（不含子分组）的设备 */
function directGroupDevices(groupId: string): DeviceInfo[] {
  const ids = new Set(
    assignments.value.filter((item) => item.groupId === groupId).map((item) => item.deviceId)
  )
  if (!ids.size) return []
  // 一台设备可同时挂在父分组与子分组：只把它挂到最深的那个节点下，
  // 否则同一台设备会在整条路径上重复出现，树看着像坏了。
  const descendants = groupSubtreeIds(groupId)
  descendants.delete(groupId)
  const takenByChildren = new Set(
    assignments.value.filter((item) => descendants.has(item.groupId)).map((item) => item.deviceId)
  )
  return rows.value.filter(
    (device) => ids.has(device.deviceInfoId) && !takenByChildren.has(device.deviceInfoId)
  )
}

/** 某厂家的设备 */
function vendorDevices(vendor: string): DeviceInfo[] {
  return rows.value.filter((device) => (device.deviceInfoVendor || '') === vendor)
}

/** 组织名（分组行的提示用） */
function orgLabelOf(orgId: string): string | undefined {
  return orgFlat.value.find((node) => node.deviceOrganizationId === orgId)?.deviceOrganizationName
}

/** 该 id 是分组而不是组织？（分组树的上级既可能是分组，也可能是组织） */
function isGroupId(id?: string): boolean {
  return !!id && flatGroups.value.some((node) => node.groupId === id)
}

/** 分组的直接上级：可能是上级分组，也可能是所属组织（分组树根节点的 groupParent 指向组织） */
function groupParentIdOf(groupId: string): string | undefined {
  return flatGroups.value.find((node) => node.groupId === groupId)?.groupParent || undefined
}

/* ==================== 右侧工作区页签（ReTabs） ==================== */
/** 「设备资产」固定页签名：台账列表常驻，不可关闭 */
const ASSETS_TAB = 'assets'

/** 页签类别 */
type WorkTabKind = 'assets' | 'detail' | 'play' | 'channels' | 'events' | 'topo'

/**
 * 工作区页签：比 ReTabsItem 多带业务上下文。
 *
 * <p>ReTabs 只回传页签 name，内容区分支一律按 name 回查本数组，
 * 不往 ReTabsItem 上强转业务字段。</p>
 */
interface WorkTab extends ReTabsItem {
  /** 页签类别 */
  kind: WorkTabKind
  /** 设备类页签的设备 id */
  deviceId?: string
  /** 拓扑页签的视图限制 */
  topoFilter?: { kind: 'group' | 'vendor' | 'device'; id: string; label?: string }
}

const workTabs = ref<WorkTab[]>([
  { name: ASSETS_TAB, kind: 'assets', label: '设备资产', hint: '台账', icon: 'Files', closable: false }
])
const activeTab = ref(ASSETS_TAB)

/** 按 name 回查页签 */
function tabOf(name: string): WorkTab | undefined {
  return workTabs.value.find((tab) => tab.name === name)
}

/** 按 name 取页签类别（模板里做内容分支用） */
function tabKindOf(name: string): WorkTabKind | undefined {
  return tabOf(name)?.kind
}

/** 页签详情绑定的设备：始终取刷新后的最新对象 */
function deviceOfTab(name: string): DeviceInfo | null {
  const id = tabOf(name)?.deviceId
  if (!id) return null
  return rows.value.find((device) => device.deviceInfoId === id) ?? null
}

/** 页签刷新代次：右键「刷新」时 +1，作为子组件 key 的一部分重建内容 */
const tabReloadSeq = reactive<Record<string, number>>({})
function reloadSeqOf(name: string): number {
  return tabReloadSeq[name] ?? 0
}

/**
 * 打开一个功能页签。
 *
 * <p>同「设备 + 功能」只开一次：重复点同一个动作是切过去，不是再开一个副本。</p>
 */
function openWorkTab(tab: WorkTab): void {
  const exist = tabOf(tab.name)
  if (exist) {
    // 设备快照随刷新更新，重开时用最新数据覆盖
    Object.assign(exist, tab)
  } else {
    workTabs.value = [...workTabs.value, tab]
  }
  activeTab.value = tab.name
}

/** 设备详情页签 */
function openDetail(device: DeviceInfo): void {
  openWorkTab({
    name: `device:${device.deviceInfoId}:detail`,
    kind: 'detail',
    label: device.deviceInfoName,
    hint: '设备详情',
    icon: 'Position',
    deviceId: device.deviceInfoId,
    status: device.deviceInfoOnline ? 'online' : 'offline'
  })
}

/** 播放页签：纯画面，只有能出流的设备才允许打开 */
function openPlay(device: DeviceInfo): void {
  if (!isPlayable(device, vendors.value)) {
    message.warning('该设备不支持视频播放')
    return
  }
  openWorkTab({
    name: `device:${device.deviceInfoId}:play`,
    kind: 'play',
    label: device.deviceInfoName,
    hint: '播放',
    icon: 'VideoPlay',
    deviceId: device.deviceInfoId,
    status: device.deviceInfoOnline ? 'online' : 'offline'
  })
}

/** 通道管理页签 */
function openChannels(device: DeviceInfo): void {
  openWorkTab({
    name: `device:${device.deviceInfoId}:channels`,
    kind: 'channels',
    label: device.deviceInfoName,
    hint: '通道管理',
    icon: 'Connection',
    deviceId: device.deviceInfoId,
    status: device.deviceInfoOnline ? 'online' : 'offline'
  })
}

/** 设备日志页签 */
function openEvents(device: DeviceInfo): void {
  openWorkTab({
    name: `device:${device.deviceInfoId}:events`,
    kind: 'events',
    label: device.deviceInfoName,
    hint: '设备日志',
    icon: 'Tickets',
    deviceId: device.deviceInfoId,
    status: device.deviceInfoOnline ? 'online' : 'offline'
  })
}

/** 在拓扑中查看（按分组 / 厂商 / 设备给拓扑加上视图限制） */
function openTopology(groupId?: string, vendor?: string, deviceId?: string): void {
  const kind = groupId ? ('group' as const) : vendor ? ('vendor' as const) : ('device' as const)
  const id = groupId ?? vendor ?? deviceId
  if (!id) return
  const label =
    kind === 'group' ? flatGroups.value.find((g) => g.groupId === id)?.groupName
      : kind === 'vendor' ? vendorNodes.value.find((v) => v.vendor === id)?.label
        : rows.value.find((d) => d.deviceInfoId === id)?.deviceInfoName
  openWorkTab({
    name: `topo:${kind}:${id}`,
    kind: 'topo',
    label: label || id,
    hint: '机房拓扑',
    icon: 'Grid',
    topoFilter: { kind, id, label: label || id }
  })
}

/** 关闭页签：关的是当前页签时自动切到相邻（右优先，其次左）；「设备资产」不可关闭 */
function closeWorkTab(name: string): void {
  if (name === ASSETS_TAB) return
  const idx = workTabs.value.findIndex((tab) => tab.name === name)
  if (idx < 0) return
  const rest = workTabs.value.filter((tab) => tab.name !== name)
  workTabs.value = rest
  if (activeTab.value !== name) return
  activeTab.value = rest[idx]?.name ?? rest[idx - 1]?.name ?? ASSETS_TAB
}

/** 关闭其它页签（保留目标页签；「设备资产」始终保留） */
function closeOtherWorkTabs(name: string): void {
  workTabs.value = workTabs.value.filter((tab) => tab.name === name || tab.name === ASSETS_TAB)
  activeTab.value = name
}

/** 关闭右侧页签 */
function closeWorkTabsToRight(name: string): void {
  const idx = workTabs.value.findIndex((tab) => tab.name === name)
  if (idx < 0) return
  workTabs.value = workTabs.value.slice(0, idx + 1)
  if (!workTabs.value.some((tab) => tab.name === activeTab.value)) activeTab.value = name
}

/** 关闭全部页签：回到「设备资产」 */
function closeAllWorkTabs(): void {
  workTabs.value = workTabs.value.filter((tab) => tab.name === ASSETS_TAB)
  activeTab.value = ASSETS_TAB
}

/** 页签右键菜单 */
const tabContextMenu = computed<ReTabsContextItem[]>(() => {
  const idx = workTabs.value.findIndex((tab) => tab.name === activeTab.value)
  const isAssets = activeTab.value === ASSETS_TAB
  const hasRight = idx >= 0 && idx < workTabs.value.length - 1
  return [
    { key: 'refresh', label: '刷新当前页签', icon: 'RefreshRight', disabled: isAssets },
    { key: 'close', label: '关闭当前页签', icon: 'Close', divided: true, disabled: isAssets },
    { key: 'close-others', label: '关闭其它页签', icon: 'CircleClose', disabled: workTabs.value.length <= 2 },
    { key: 'close-right', label: '关闭右侧页签', icon: 'DArrowRight', disabled: !hasRight },
    { key: 'close-all', label: '关闭全部页签', icon: 'Delete', danger: true, divided: true, disabled: workTabs.value.length <= 1 }
  ]
})

/** 页签右键命令分发 */
function onTabCommand(payload: { key: string; tab: ReTabsItem }): void {
  const name = payload.tab.name
  switch (payload.key) {
    case 'close':
      closeWorkTab(name)
      break
    case 'close-others':
      closeOtherWorkTabs(name)
      break
    case 'close-right':
      closeWorkTabsToRight(name)
      break
    case 'close-all':
      closeAllWorkTabs()
      break
    case 'refresh':
      if (name !== ASSETS_TAB) tabReloadSeq[name] = reloadSeqOf(name) + 1
      else fetchAll()
      break
    default:
      break
  }
}

/* ==================== 左树设备叶子 ==================== */
/** 左树点中的设备：右侧列表收敛到这一台（清筛选 / 清关键词时解除） */
const leafDeviceId = ref('')
const leafDeviceLabel = computed(
  () => rows.value.find((device) => device.deviceInfoId === leafDeviceId.value)?.deviceInfoName || ''
)

/** 左键点设备叶子：回到「设备资产」页签，并把列表收敛到这一台 */
function focusLeafDevice(row: TreeRow): void {
  const device = rows.value.find((item) => item.deviceInfoId === row.id)
  if (device) activeDevice.value = device
  leafDeviceId.value = row.id
  activeTab.value = ASSETS_TAB
}

function clearLeafDevice(): void {
  leafDeviceId.value = ''
}

/* ==================== 左树拖拽：松手即静默保存 ==================== */
const draggingRow = ref<TreeRow | null>(null)
const dropTarget = ref<TreeRow | null>(null)

/** 只有分组和设备可以拖 */
function canDragRow(row: TreeRow): boolean {
  return row.kind === 'device' || row.kind === 'group'
}

/** 合法落点：分组/设备 → 分组或组织；分组不能拖进自己或自己的子孙 */
function canDropOn(target: TreeRow): boolean {
  const source = draggingRow.value
  if (!source || source.key === target.key) return false
  if (source.kind === 'group' && target.kind === 'group') {
    return !groupSubtreeIds(source.id).has(target.id)
  }
  if (source.kind === 'group') return target.kind === 'org'
  if (source.kind === 'device') return target.kind === 'group' || target.kind === 'org'
  return false
}

function onTreeDragStart(event: DragEvent, row: TreeRow): void {
  if (!canDragRow(row)) return
  draggingRow.value = row
  event.dataTransfer?.setData('text/plain', row.key)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move'
}

function onTreeDragOver(event: DragEvent, row: TreeRow): void {
  if (!canDropOn(row)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dropTarget.value = row
}

function onTreeDragLeave(row: TreeRow): void {
  if (dropTarget.value?.key === row.key) dropTarget.value = null
}

function onTreeDragEnd(): void {
  draggingRow.value = null
  dropTarget.value = null
}

/**
 * 松手落点：按「拖的是什么 / 落在哪」决定保存动作，成功后只刷新数据、不弹确认。
 *
 * <ul>
 *   <li>分组 → 分组 / 组织：改 groupParent，分组连同其子分组整体挪过去</li>
 *   <li>设备 → 分组：追加一条分组归属（设备可同时属于多个分组）</li>
 *   <li>设备 → 组织：改 deviceInfoOrgId，原有分组归属保持不变</li>
 * </ul>
 */
async function onTreeDrop(event: DragEvent, target: TreeRow): Promise<void> {
  event.preventDefault()
  const source = draggingRow.value
  const valid = canDropOn(target)
  onTreeDragEnd()
  if (!source || !valid) return

  // 分组挪窝：上级可能是另一个分组，也可能是组织
  if (source.kind === 'group') {
    const node = flatGroups.value.find((item) => item.groupId === source.id)
    if (!node) return
    try {
      await deviceApi.updateGroup(source.id, {
        groupName: node.groupName,
        groupParent: target.id,
        groupRemark: node.groupRemark
      })
      await fetchGroups()
    } catch (err) {
      message.error('移动分组失败：' + errorText(err))
    }
    return
  }

  // 设备拖进分组：追加归属，不动已有分组
  if (target.kind === 'group') {
    const current = assignments.value
      .filter((item) => item.deviceId === source.id)
      .map((item) => item.groupId)
    if (current.includes(target.id)) return
    try {
      await deviceApi.assignDeviceGroups(source.id, [...current, target.id])
      await fetchGroups()
    } catch (err) {
      message.error('移入分组失败：' + errorText(err))
    }
    return
  }

  // 设备拖进组织：只改所属组织
  const device = rows.value.find((item) => item.deviceInfoId === source.id)
  if (!device || device.deviceInfoOrgId === target.id) return
  try {
    await deviceApi.update(source.id, { deviceInfoOrgId: target.id })
    await fetchAll()
  } catch (err) {
    message.error('调整组织失败：' + errorText(err))
  }
}

/* ==================== 左树右键菜单（ReContextMenu） ==================== */
/** 左树右键菜单实例 */
const treeMenuRef = ref<{ open: (x: number, y: number) => void; close: () => void } | null>(null)
/** 右键落点行 */
const treeMenuTarget = ref<TreeRow | null>(null)

/** 菜单头部副文本：分组显示所属组织，设备显示编码 / IP */
const treeMenuSubtitle = computed(() => {
  const row = treeMenuTarget.value
  if (!row) return ''
  if (row.kind === 'device') {
    const device = rows.value.find((item) => item.deviceInfoId === row.id)
    if (!device) return ''
    return [device.deviceInfoCode, device.deviceInfoIp].filter(Boolean).join(' · ')
  }
  if (row.kind === 'group') return row.hint || '分组'
  if (row.kind === 'org') return '组织'
  return '厂家'
})

/** 左树行左键：设备叶子回台账定位，其余按维度筛选 */
function onTreeRowClick(row: TreeRow): void {
  if (row.kind === 'device') {
    focusLeafDevice(row)
    return
  }
  selectFilter({ kind: row.kind, id: row.id })
}

/** 打开左树右键菜单 */
function openTreeMenu(event: MouseEvent, row: TreeRow): void {
  event.preventDefault()
  event.stopPropagation()
  treeMenuTarget.value = row
  // 右键同时把底部信息条 / 台账定位切到这台设备
  if (row.kind === 'device') {
    const device = rows.value.find((item) => item.deviceInfoId === row.id)
    if (device) activeDevice.value = device
  }
  treeMenuRef.value?.open(event.clientX, event.clientY)
}

/**
 * 左树右键菜单项：按行类别给出不同能力。
 *
 * <p>功能入口统一走「打开工作区页签」，与右侧台账行右键保持一致，
 * 不再有抽屉与页签两套并存。</p>
 */
const treeMenuItems = computed<ReContextMenuItem[]>(() => {
  const row = treeMenuTarget.value
  if (!row) return []
  if (row.kind === 'device') {
    const device = rows.value.find((item) => item.deviceInfoId === row.id) || null
    return [
      { label: '播放', icon: 'VideoPlay', command: 'play', disabled: !isPlayable(device, vendors.value) },
      { label: '设备详情', icon: 'Position', command: 'detail' },
      { label: '通道管理', icon: 'Connection', command: 'channels' },
      { label: '设备日志', icon: 'Tickets', command: 'events' },
      { label: '在拓扑中查看', icon: 'Grid', command: 'topo' },
      { separator: true },
      { label: '配置资产信息', icon: 'EditPen', command: 'asset' },
      { label: '配置位置信息', icon: 'LocationInformation', command: 'location' },
      { separator: true },
      { label: '在台账中定位', icon: 'Aim', command: 'locate' },
      { label: '重新连接', icon: 'RefreshRight', command: 'reconnect' },
      { label: '刷新状态', icon: 'Refresh', command: 'refresh' },
      { label: '设置分组', icon: 'FolderOpened', command: 'groups' },
      { label: '视频预览', icon: 'VideoCamera', command: 'preview' },
      { separator: true },
      { label: '删除设备', icon: 'Delete', command: 'remove', danger: true }
    ]
  }
  if (row.kind === 'group') {
    return [
      { label: '在拓扑中查看', icon: 'Grid', command: 'topo' },
      { label: '筛选该分组', icon: 'Filter', command: 'filter' },
      { separator: true },
      { label: '新增子分组', icon: 'Plus', command: 'add' },
      { label: '分配设备', icon: 'FolderOpened', command: 'assign' },
      { label: '清空分组设备', icon: 'Delete', command: 'clear' },
      { label: '重命名', icon: 'EditPen', command: 'edit' },
      { separator: true },
      { label: '删除分组', icon: 'Delete', command: 'delete', danger: true }
    ]
  }
  if (row.kind === 'vendor') {
    return [
      { label: '在拓扑中查看', icon: 'Grid', command: 'topo' },
      { label: '筛选该厂家', icon: 'Filter', command: 'filter' }
    ]
  }
  return [
    { label: '筛选该组织', icon: 'Filter', command: 'filter' },
    { label: '新增分组到此组织', icon: 'Plus', command: 'add-group' }
  ]
})

/** 左树右键命令分发 */
function onTreeMenuSelect(command: string): void {
  const row = treeMenuTarget.value
  if (!row) return
  if (row.kind === 'device') {
    const device = rows.value.find((item) => item.deviceInfoId === row.id)
    if (!device) return
    switch (command) {
      case 'play': openPlay(device); break
      case 'detail': openDetail(device); break
      case 'channels': openChannels(device); break
      case 'events': openEvents(device); break
      case 'topo': openTopology(undefined, undefined, device.deviceInfoId); break
      case 'asset': openAssetDialog(device, 'asset'); break
      case 'location': openAssetDialog(device, 'location'); break
      case 'locate': focusLeafDevice(row); break
      case 'reconnect': reconnect(device); break
      case 'refresh': refreshStatus(device); break
      case 'groups': openDeviceGroups(device); break
      case 'preview': openPreviewWindow(device); break
      case 'remove': removeDevice(device); break
    }
    return
  }
  if (row.kind === 'group') {
    switch (command) {
      case 'topo': openTopology(row.id); break
      case 'filter': selectFilter({ kind: 'group', id: row.id }); break
      case 'add': openGroupCreate(row.id); break
      case 'assign': openDeviceAssign(row); break
      case 'clear': clearGroup(row); break
      case 'edit': openGroupEdit(row); break
      case 'delete': removeGroup(row); break
    }
    return
  }
  if (row.kind === 'vendor') {
    if (command === 'topo') openTopology(undefined, row.id)
    else if (command === 'filter') selectFilter({ kind: 'vendor', id: row.id })
    return
  }
  if (command === 'filter') selectFilter({ kind: 'org', id: row.id })
  else if (command === 'add-group') openGroupCreate(null, row.id)
}

const statusFilters = computed(() => {
  const list = filtered.value
  const online = list.filter((item) => item.deviceInfoOnline).length
  return [
    { label: '全部', value: 'all' as const, count: list.length },
    { label: '在线', value: 'online' as const, count: online },
    { label: '离线', value: 'offline' as const, count: list.length - online }
  ]
})

/** 底部信息条跟随的设备：最近点选 / 右键的行优先，其次唯一勾选的那台 */
const statusDevice = computed<DeviceInfo | null>(
  () => activeDevice.value ?? (selection.value.length === 1 ? selection.value[0] : null)
)

const onlineCount = computed(() => rows.value.filter((item) => item.deviceInfoOnline).length)
const offlineCount = computed(() => rows.value.length - onlineCount.value)
const locatedCount = computed(() => rows.value.filter((item) => hasLocation(item)).length)

const filtered = computed<DeviceInfo[]>(() => {
  let list = rows.value
  const f = filterState.value
  if (f) {
    if (f.kind === 'org') {
      const ids = orgDescendants(f.id)
      list = list.filter((d) => ids.has(d.deviceInfoOrgId || ''))
    } else if (f.kind === 'group') {
      const ids = groupDeviceIds(f.id)
      list = list.filter((d) => ids.has(d.deviceInfoId || ''))
    } else if (f.kind === 'vendor') {
      list = list.filter((d) => (d.deviceInfoVendor || '') === f.id)
    }
  }
  if (onlineFilter.value === 'online') list = list.filter((d) => d.deviceInfoOnline)
  else if (onlineFilter.value === 'offline') list = list.filter((d) => !d.deviceInfoOnline)
  // 左树设备叶子：定位到单台设备
  if (leafDeviceId.value) list = list.filter((d) => d.deviceInfoId === leafDeviceId.value)
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (d) =>
        `${d.deviceInfoName || ''} ${d.deviceInfoCode || ''} ${d.deviceInfoIp || ''} ${d.deviceInfoSerial || ''}`
          .toLowerCase()
          .includes(kw)
    )
  }
  return list
})

function toggleRail(): void {
  railCollapsed.value = !railCollapsed.value
}

/* ==================== 设备表（ReTable） ==================== */
/** 行数据：ReTable 只收 Record 数组，真实结构是 DeviceInfo */
const tableRows = computed<Array<Record<string, unknown>>>(
  () => filtered.value as unknown as Array<Record<string, unknown>>
)

const columns: ReTableColumn[] = [
  { prop: 'deviceInfoName', label: '设备', slot: 'device', minWidth: 250 },
  { prop: 'deviceInfoVendor', label: '厂商 / 型号', slot: 'vendor', minWidth: 150 },
  { prop: 'deviceInfoIp', label: 'IP : 端口', slot: 'ip', minWidth: 150 },
  { prop: 'deviceInfoOnline', label: '在线状态', slot: 'status', width: 130 },
  { prop: 'deviceInfoLastOnlineAt', label: '最后上线', slot: 'lastOnline', width: 165 },
  { prop: 'deviceInfoLatitude', label: '位置', slot: 'location', minWidth: 170 },
  { prop: 'deviceInfoOwnerName', label: '负责人', slot: 'owner', minWidth: 130 },
  { prop: 'deviceInfoGroup', label: '分组', slot: 'group', width: 190 }
]

/** 插槽里的行数据回退成 DeviceInfo */
function asDevice(row: Record<string, unknown>): DeviceInfo {
  return row as unknown as DeviceInfo
}

/** 底部条跟随的行：点选 / 右键都算 */
const activeDevice = ref<DeviceInfo | null>(null)

/** 行右键菜单：功能入口全部打开工作区页签，资产 / 位置各走自己的配置弹窗 */
const tableMenu: ReTableContextMenuItem[] = [
  { key: 'play', label: '播放', icon: VideoPlay, disabled: (ctx) => !isPlayable(asDevice(ctx.row), vendors.value) },
  { key: 'detail', label: '设备详情', icon: Position },
  { key: 'channels', label: '通道管理', icon: Connection },
  { key: 'events', label: '设备日志', icon: Tickets },
  { key: 'topo', label: '在拓扑中查看', icon: Grid, divided: true },
  { key: 'asset', label: '配置资产信息', icon: EditPen, divided: true },
  { key: 'location', label: '配置位置信息', icon: 'LocationInformation' },
  { key: 'edit', label: '编辑设备', icon: EditPen },
  { key: 'reconnect', label: '重新连接', icon: RefreshRight, divided: true },
  { key: 'refresh', label: '刷新状态', icon: Refresh },
  { key: 'groups', label: '设置分组', icon: FolderOpened },
  { key: 'preview', label: '视频预览', icon: VideoCamera },
  { key: 'remove', label: '删除设备', icon: Delete, divided: true }
]

/** 右键菜单选中：ctx.row 就是被右键的设备 */
function onTableMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void {
  runDeviceCommand(item.key, asDevice(ctx.row))
}

/**
 * 设备命令统一分发。
 *
 * <p>表格右键、卡片右键共用同一套命令，避免两处菜单各写一份 switch 后走偏；
 * 「播放」只对能出流的设备开放，菜单项本身也会置灰。</p>
 */
function runDeviceCommand(command: string, d: DeviceInfo): void {
  activeDevice.value = d
  switch (command) {
    case 'play':
      openPlay(d)
      break
    case 'detail':
      openDetail(d)
      break
    case 'edit':
      openEdit(d)
      break
    case 'topo':
      openTopology(undefined, undefined, d.deviceInfoId)
      break
    case 'channels':
      openChannels(d)
      break
    case 'events':
      openEvents(d)
      break
    case 'asset':
      openAssetDialog(d, 'asset')
      break
    case 'location':
      openAssetDialog(d, 'location')
      break
    case 'reconnect':
      reconnect(d)
      break
    case 'refresh':
      refreshStatus(d)
      break
    case 'groups':
      openDeviceGroups(d)
      break
    case 'preview':
      openPreviewWindow(d)
      break
    case 'remove':
      removeDevice(d)
      break
  }
}

function onRowClick(row: Record<string, unknown>): void {
  activeDevice.value = asDevice(row)
}

/** 双击（第二次 click 的 detail=2）打开详情 */
function onCellClick(payload: ReTableCellClickPayload): void {
  if (payload.event?.detail !== 2) return
  openDetail(asDevice(payload.row))
}

function onSelectionChange(value: Array<Record<string, unknown>>): void {
  selection.value = value.map(asDevice)
  // 只勾一台时，底部信息条跟着它走（勾选也算一次「点选」）
  if (value.length === 1) activeDevice.value = asDevice(value[0])
}

/* ==================== 卡片台账交互 ==================== */
/** 卡片是否在批量勾选集合里 */
function isCardSelected(row: DeviceInfo): boolean {
  return selection.value.some((item) => item.deviceInfoId === row.deviceInfoId)
}

/** 卡片右上角勾选：与表格勾选共用 selection，批量条实时联动 */
function toggleCardSelection(row: DeviceInfo): void {
  activeDevice.value = row
  const exists = isCardSelected(row)
  selection.value = exists
    ? selection.value.filter((item) => item.deviceInfoId !== row.deviceInfoId)
    : [...selection.value, row]
}

/** 单击卡片=定位（底部信息条跟随），Ctrl / Cmd + 单击=勾选 */
function onCardClick(event: MouseEvent, row: DeviceInfo): void {
  activeDevice.value = row
  if (event.ctrlKey || event.metaKey) toggleCardSelection(row)
}

/** 卡片右键菜单 */
const cardMenuRef = ref<{ open: (x: number, y: number) => void; close: () => void } | null>(null)
const cardMenuTarget = ref<DeviceInfo | null>(null)

function openCardMenu(event: MouseEvent, row: DeviceInfo): void {
  event.preventDefault()
  event.stopPropagation()
  activeDevice.value = row
  cardMenuTarget.value = row
  cardMenuRef.value?.open(event.clientX, event.clientY)
}

const cardMenuSubtitle = computed(() => {
  const d = cardMenuTarget.value
  return d ? [d.deviceInfoCode, d.deviceInfoIp].filter(Boolean).join(' · ') : ''
})

/** 卡片右键菜单项：与表格同一套设备命令，「播放」按能力位置灰 */
const cardMenuItems = computed<ReContextMenuItem[]>(() => {
  const d = cardMenuTarget.value
  if (!d) return []
  return [
    { label: '播放', icon: 'VideoPlay', command: 'play', disabled: !isPlayable(d, vendors.value) },
    { label: '设备详情', icon: 'Position', command: 'detail' },
    { label: '通道管理', icon: 'Connection', command: 'channels' },
    { label: '设备日志', icon: 'Tickets', command: 'events' },
    { label: '在拓扑中查看', icon: 'Grid', command: 'topo' },
    { separator: true },
    { label: '配置资产信息', icon: 'EditPen', command: 'asset' },
    { label: '配置位置信息', icon: 'LocationInformation', command: 'location' },
    { label: '编辑设备', icon: 'EditPen', command: 'edit' },
    { separator: true },
    { label: '重新连接', icon: 'RefreshRight', command: 'reconnect' },
    { label: '刷新状态', icon: 'Refresh', command: 'refresh' },
    { label: '设置分组', icon: 'FolderOpened', command: 'groups' },
    { label: '视频预览', icon: 'VideoCamera', command: 'preview' },
    { separator: true },
    { label: '删除设备', icon: 'Delete', command: 'remove', danger: true }
  ]
})

function onCardMenuSelect(command: string): void {
  const d = cardMenuTarget.value
  if (!d) return
  runDeviceCommand(command, d)
}

/**
 * 刷新后把选中态换成新列表里的同一台设备对象。
 *
 * <p>列表不挂自动刷新，状态只由手动刷新拉取；刷新回来的是**全新对象**，
 * 不重新对齐的话底部信息条会停在旧快照上（在线状态 / 经纬度不更新），
 * 设备已被删除时还会显示一台不存在的设备。</p>
 */
function syncPicked(list: DeviceInfo[]): void {
  const pick = (d: DeviceInfo | null): DeviceInfo | null =>
    d ? list.find((item) => item.deviceInfoId === d.deviceInfoId) ?? null : null
  activeDevice.value = pick(activeDevice.value)
  selection.value = selection.value
    .map((d) => pick(d))
    .filter((d): d is DeviceInfo => d !== null)
}

/** 单台预览：新窗口打开预览页（带设备 id、1×1 布局） */
function openPreviewWindow(device: DeviceInfo): void {
  if (!router.hasRoute('DevicePreview')) {
    message.warning('当前宿主未接入视频预览页')
    return
  }
  const target = router.resolve({
    name: 'DevicePreview',
    query: { ids: device.deviceInfoId, layout: '1', remind: 'true' }
  })
  window.open(target.href, '_blank', 'noopener')
}

/* ==================== 增删改 / 分组 ==================== */
const formVisible = ref(false)
const editingDevice = ref<DeviceInfo | null>(null)

const groupDialogVisible = ref(false)
const groupDialogDeviceIds = ref<string[]>([])
const groupDialogChecked = ref<string[]>([])
const groupSaving = ref(false)

const groupDialogTitle = computed(() =>
  groupDialogDeviceIds.value.length > 1
    ? `设置分组（${groupDialogDeviceIds.value.length} 台设备）`
    : '设置分组'
)

const groupOptions = computed(() => {
  const out: Array<{ groupId: string; groupName: string; label: string }> = []
  const walk = (nodes: DeviceGroupNode[], depth: number) => {
    /** 接口可能回传非数组（对象/字符串/空值），安全展开；空值走兜底 */
    if (!Array.isArray(nodes)) return
    for (const node of nodes) {
      if (!node.groupId) continue
      out.push({
        groupId: node.groupId,
        groupName: node.groupName,
        label: `${'　'.repeat(depth)}${node.groupName}`
      })
      if (node.children?.length) walk(node.children, depth + 1)
    }
  }
  walk(groups.value, 0)
  return out
})

function openCreate(): void {
  editingDevice.value = null
  formVisible.value = true
}

function openEdit(device: DeviceInfo): void {
  editingDevice.value = device
  formVisible.value = true
}

/* ==================== 资产 / 位置配置弹窗 ==================== */
const assetDialogVisible = ref(false)
const assetDialogDevice = ref<DeviceInfo | null>(null)
const assetDialogSection = ref<'asset' | 'location'>('asset')

/** 打开资产 / 位置配置弹窗（两套字段互不串写） */
function openAssetDialog(device: DeviceInfo, section: 'asset' | 'location'): void {
  assetDialogDevice.value = device
  assetDialogSection.value = section
  assetDialogVisible.value = true
}

function onAssetSaved(): void {
  assetDialogVisible.value = false
  refreshAll()
  // 详情页签若开着，同一次保存也要让它重取，避免页签里还是旧资产
  for (const tab of workTabs.value) {
    if (tab.kind === 'detail' && tab.deviceId === assetDialogDevice.value?.deviceInfoId) {
      tabReloadSeq[tab.name] = reloadSeqOf(tab.name) + 1
    }
  }
}

/** 分组：展开到最深层的节点（带深度），用于左侧树与「新增子分组」的上级选择 */
const flatGroups = computed<Array<DeviceGroupNode & { depth: number }>>(() => {
  const out: Array<DeviceGroupNode & { depth: number }> = []
  const walk = (nodes: DeviceGroupNode[], depth: number) => {
    /** 接口可能回传非数组（对象/字符串/空值），安全展开 */
    if (!Array.isArray(nodes)) return
    for (const n of nodes) {
      if (!n.groupId) continue
      out.push({ ...n, depth })
      if (n.children?.length) walk(n.children, depth + 1)
    }
  }
  walk(groups.value, 0)
  return out
})

/** 左侧树的显示行：组织 / 分组 / 厂家 / 设备，一次只渲染当前维度的一棵树 */
type TreeRow = {
  /** 行键（同时用作折叠态键） */
  key: string
  /** 行类别：组织 / 分组 / 厂家 / 设备叶子 */
  kind: RailMode | 'device'
  /** 显示名 */
  label: string
  /** 缩进深度 */
  depth: number
  /** 筛选值（设备叶子是 deviceInfoId） */
  id: string
  /** 计数（本节点及其子树的设备数） */
  count: number
  /** 分组备注 */
  remark?: string
  /** 节点附加说明（分组显示所属组织） */
  hint?: string
  /** 是否有下一级（决定是否显示展开箭头） */
  hasChildren: boolean
  /** 当前是否展开 */
  expanded: boolean
  /** 设备叶子的大类图标 */
  icon?: string
  /** 设备叶子的在线态 */
  online?: boolean
}

/** 分组筛选：点击左侧节点或列表里的分组标签 → 右侧按组筛选设备 */
function selectGroup(node: DeviceGroupNode | null): void {
  if (!node) {
    filterState.value = undefined
    return
  }
  // 列表里的分组标签可能来自「组织 / 厂家」维度，点它要顺带切回分组树
  if (railMode.value !== 'group') railMode.value = 'group'
  filterState.value = { kind: 'group', id: node.groupId }
}

/** 分组下设备的 id 集合（含子分组的设备，即当前视图的组数据源） */
function groupDeviceIds(groupId: string): Set<string> {
  const groupIds = groupSubtreeIds(groupId)
  return new Set(
    assignments.value
      .filter((item) => groupIds.has(item.groupId))
      .map((item) => item.deviceId)
  )
}

/** 分组自身 + 全部子孙分组的 id 集合 */
function groupSubtreeIds(groupId: string): Set<string> {
  const ids = new Set<string>([groupId])
  const walk = (nodes: DeviceGroupNode[]): void => {
    for (const node of nodes) {
      if (ids.has(node.groupId)) {
        for (const child of node.children || []) {
          if (!ids.has(child.groupId)) {
            ids.add(child.groupId)
            walk([child])
          }
        }
      } else if (node.children?.length) {
        walk(node.children)
      }
    }
  }
  walk(groups.value)
  return ids
}

/** 某台设备所处的分组标签列表（可点，点它即筛选该组设备） */
function deviceGroupLabels(row: DeviceInfo): DeviceGroupNode[] {
  const ids = assignments.value
    .filter((item) => item.deviceId === row.deviceInfoId)
    .map((item) => item.groupId)
  return flatGroups.value.filter((node) => ids.includes(node.groupId))
}

/** 创建/编辑分组（parentId 为空时按上级组织建档，orgParentId 用于从组织行直接带入） */
const groupCreateKind = ref<'root' | 'sub'>('root')
const editingGroupId = ref('')
const groupCreateVisible = ref(false)
const groupCreating = ref(false)
const groupForm = reactive({ groupName: '', groupParent: '', groupRemark: '' })

function openGroupCreate(parentId?: string | null, orgParentId?: string): void {
  editingGroupId.value = ''
  groupForm.groupName = ''
  groupForm.groupParent = parentId || orgParentId || ''
  groupForm.groupRemark = ''
  groupCreateKind.value = parentId ? 'sub' : 'root'
  groupCreateVisible.value = true
}

/** 编辑分组（重命名） */
function openGroupEdit(row: TreeRow): void {
  editingGroupId.value = row.id!
  groupForm.groupName = row.label
  const parent = groupParentIdOf(row.id!)
  groupForm.groupParent = parent || ''
  groupForm.groupRemark = row.remark || ''
  /** 上级是分组时按分组选，否则按组织选 */
  groupCreateKind.value = isGroupId(parent) ? 'sub' : 'root'
  groupCreateVisible.value = true
}

/** 分配设备到分组（按分组全量替换） */
const assignVisible = ref(false)
const assignSaving = ref(false)
const assignGroupId = ref('')
const assignDevices = ref<DeviceInfo[]>([])
const pendingAssigned = ref<Set<string>>(new Set())

async function openDeviceAssign(row: TreeRow): Promise<void> {
  if (!row.id) return
  assignGroupId.value = row.id
  try {
    assignDevices.value = (await deviceApi.list()) as DeviceInfo[]
    // 分配弹窗只回显该分组的直属设备（子分组的归属不在这里改）
    pendingAssigned.value = new Set(
      assignments.value.filter((item) => item.groupId === row.id).map((item) => item.deviceId)
    )
  } catch {
    assignDevices.value = []
    pendingAssigned.value = new Set()
  }
  assignVisible.value = true
}

function pendingToggle(d: DeviceInfo): void {
  const id = d.deviceInfoId || ''
  if (pendingAssigned.value.has(id)) pendingAssigned.value.delete(id)
  else pendingAssigned.value.add(id)
}

async function onAssignSave(): Promise<void> {
  if (!assignGroupId.value) return
  assignSaving.value = true
  try {
    await deviceApi.assignGroupDevices(assignGroupId.value, [...pendingAssigned.value])
    message.success('分配成功')
    assignVisible.value = false
    await fetchGroups()
    refreshAll()
  } catch (err) {
    message.error('分配失败：' + errorText(err))
  } finally {
    assignSaving.value = false
  }
}

/** 清空分组下的设备 */
async function clearGroup(row: TreeRow): Promise<void> {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`清空分组「${row.label}」下的全部设备？`, '确认', { type: 'warning' })
  } catch { return }
  try {
    // 只清空该分组的直属设备，子分组的归属保持不变
    await deviceApi.assignGroupDevices(row.id, [])
    message.success('已清空')
    if (filterState.value?.kind === 'group' && filterState.value.id === row.id) filterState.value = undefined
    await fetchGroups()
  } catch (err) {
    message.error('操作失败：' + errorText(err))
  }
}

/** 删除分组（子孙分组一并删除，设备本身不动） */
async function removeGroup(row: TreeRow): Promise<void> {
  if (!row.id) return
  try {
    await ElMessageBox.confirm(`删除分组「${row.label}」？分组内设备将移出。`, '确认', { type: 'warning' })
  } catch { return }
  try {
    await deviceApi.deleteGroup(row.id)
    message.success('分组已删除')
    if (filterState.value?.kind === 'group' && filterState.value.id === row.id) filterState.value = undefined
    await fetchGroups()
  } catch (err) {
    message.error('删除失败：' + errorText(err))
  }
}

async function saveGroup() {
  if (!groupForm.groupName.trim()) {
    message.warning('请填写分组名称')
    return
  }
  groupCreating.value = true
  try {
    const body = { groupName: groupForm.groupName.trim(), groupParent: groupForm.groupParent || undefined, groupRemark: groupForm.groupRemark || undefined }
    if (editingGroupId.value) {
      await deviceApi.updateGroup(editingGroupId.value, body)
      message.success('分组已更新')
    } else {
      await deviceApi.createGroup(body)
      message.success('分组已创建')
    }
    groupCreateVisible.value = false
    await fetchGroups()
  } catch (err) {
    message.error('操作失败：' + errorText(err))
  } finally {
    groupCreating.value = false
  }
}

function onDeviceSaved(): void {
  formVisible.value = false
  editingDevice.value = null
  refreshAll()
}

/** 单台设备设置分组 */
async function openDeviceGroups(row: DeviceInfo) {
  groupDialogDeviceIds.value = [row.deviceInfoId]
  groupDialogChecked.value = assignments.value
    .filter((item) => item.deviceId === row.deviceInfoId)
    .map((item) => item.groupId)
  if (!groupDialogChecked.value.length) {
    try {
      groupDialogChecked.value = (await deviceApi.deviceGroups(row.deviceInfoId)) || []
    } catch {
      // 回显失败不阻断弹窗
    }
  }
  groupDialogVisible.value = true
}

/** 批量设置分组：以所选设备的共同分组为初始值 */
function openBatchGroups() {
  const ids = selection.value.map((item) => item.deviceInfoId).filter(Boolean)
  if (!ids.length) {
    message.warning('请先选择设备')
    return
  }
  groupDialogDeviceIds.value = ids
  const [first, ...rest] = ids
  const common = new Set(
    assignments.value.filter((item) => item.deviceId === first).map((item) => item.groupId)
  )
  for (const id of rest) {
    const own = new Set(
      assignments.value.filter((item) => item.deviceId === id).map((item) => item.groupId)
    )
    for (const groupId of [...common]) {
      if (!own.has(groupId)) common.delete(groupId)
    }
  }
  groupDialogChecked.value = [...common]
  groupDialogVisible.value = true
}

async function saveDeviceGroups() {
  const ids = groupDialogDeviceIds.value
  if (!ids.length) return
  groupSaving.value = true
  try {
    await Promise.all(ids.map((id) => deviceApi.assignDeviceGroups(id, groupDialogChecked.value)))
    message.success(ids.length > 1 ? `已更新 ${ids.length} 台设备的分组` : '分组已更新')
    groupDialogVisible.value = false
    await fetchGroups()
    refreshAll()
  } catch (err) {
    message.error('设置分组失败：' + errorText(err))
  } finally {
    groupSaving.value = false
  }
}

async function reconnect(row: DeviceInfo) {
  try {
    await deviceApi.reconnect(row.deviceInfoId)
    message.success('重连指令已下发')
    refreshStatus(row)
  } catch (err) {
    message.error('重连失败：' + errorText(err))
  }
}

async function refreshStatus(row: DeviceInfo) {
  try {
    await deviceApi.refreshStatus(row.deviceInfoId)
    message.success('状态已刷新')
    fetchAll()
  } catch (err) {
    message.error('刷新状态失败：' + errorText(err))
  }
}

async function removeDevice(row: DeviceInfo) {
  try {
    await ElMessageBox.confirm(
      `确认删除设备「${row.deviceInfoName}」？删除后将断开连接，且不可恢复。`,
      '删除设备',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await deviceApi.remove(row.deviceInfoId)
    message.success('设备已删除')
    refreshAll()
  } catch (err) {
    message.error('删除失败：' + errorText(err))
  }
}

async function batchReconnect() {
  const targets = [...selection.value]
  if (!targets.length) return
  const results = await Promise.allSettled(targets.map((row) => deviceApi.reconnect(row.deviceInfoId)))
  const ok = results.filter((item) => item.status === 'fulfilled').length
  message.success(`已下发 ${ok} 台设备的重连指令`)
  refreshAll()
}

async function batchRemove() {
  const targets = [...selection.value]
  if (!targets.length) return
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${targets.length} 台设备？该操作不可恢复。`,
      '批量删除',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  const results = await Promise.allSettled(targets.map((row) => deviceApi.remove(row.deviceInfoId)))
  const ok = results.filter((item) => item.status === 'fulfilled').length
  message.success(`已删除 ${ok} 台设备`)
  refreshAll()
}

/* ==================== 视频预览 ==================== */
const videoWizardVisible = ref(false)
const videoLayout = ref(4)
const videoOpenMode = ref<'current' | 'new'>('current')
const videoRemind = ref(true)

function openVideoWizard() {
  if (!selection.value.length) {
    message.warning('请先选择设备')
    return
  }
  videoWizardVisible.value = true
}

function confirmVideoWizard() {
  const ids = selection.value.map((item) => item.deviceInfoId).filter(Boolean).join(',')
  if (!ids) {
    message.warning('所选设备缺少设备 ID')
    return
  }
  if (!router.hasRoute('DevicePreview')) {
    message.warning('当前宿主未接入视频预览页')
    return
  }
  const target = router.resolve({
    name: 'DevicePreview',
    query: {
      ids,
      layout: String(videoLayout.value),
      remind: videoRemind.value ? 'true' : 'false'
    }
  })
  videoWizardVisible.value = false
  if (videoOpenMode.value === 'new') {
    window.open(target.href, '_blank', 'noopener')
  } else {
    router.push(target)
  }
}

/* ==================== 数据 ==================== */
function vendorLabel(vendor?: string): string {
  if (!vendor) return '—'
  return vendors.value.find((item) => item.vendor === vendor)?.name || vendor
}


/** 全量拉取设备（组织 / 在线 / 关键词均在前端过滤，无需分页） */
async function fetchAll() {
  loading.value = true
  try {
    const result = await deviceApi.page({ pageNo: 1, pageSize: 2000, sortBy: 'updatedAt', sortOrder: 'desc' })
    const list = (result as unknown as { data?: DeviceInfo[]; records?: DeviceInfo[] })?.data
      ?? (result as unknown as { records?: DeviceInfo[] })?.records
      ?? []
    rows.value = list
    syncPicked(list)
  } catch (err) {
    rows.value = []
    syncPicked([])
    message.error('加载设备列表失败：' + errorText(err))
  } finally {
    loading.value = false
  }
}

async function fetchVendors() {
  try {
    vendors.value = (await deviceApi.listVendors()) || []
  } catch {
    vendors.value = []
  }
}

async function fetchOrgTree() {
  try {
    const list = await deviceApi.getOrgTree()
    orgTree.value = buildOrgTree(list)
  } catch {
    orgTree.value = []
  }
}

async function fetchGroups() {
  try {
    const [tree, links] = await Promise.all([
      deviceApi.groupTree(),
      deviceApi.groupAssignments()
    ])
    groups.value = tree || []
    assignments.value = links || []
  } catch {
    groups.value = []
    assignments.value = []
  }
}

function refreshAll() {
  fetchAll()
}

/** 设备大屏：页内弹出播放台（左侧拖拽画面源组合），不再跳独立路由 */
function goScreen() {
  wallVisible.value = true
}

/** 厂商接入 = 「提供商配置」菜单页（宿主路由名 DeviceProviders，独立包为 DeviceProvider） */
function goProvider() {
  if (router.hasRoute('DeviceProviders')) {
    router.push({ name: 'DeviceProviders' })
    return
  }
  if (router.hasRoute('DeviceProvider')) {
    router.push({ name: 'DeviceProvider' })
  }
}

async function exportDevices() {
  try {
    const blob = await deviceApi.exportDevices()
    const url = URL.createObjectURL(new Blob([blob as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }))
    const link = document.createElement('a')
    link.href = url
    link.download = `设备台账_${new Date().toISOString().slice(0, 10)}.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    message.success('导出成功')
  } catch (err) {
    message.error('导出失败：' + errorText(err))
  }
}

function errorText(err: unknown): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    || (err as Error)?.message
    || '未知错误'
}

onMounted(async () => {
  await Promise.all([fetchVendors(), fetchOrgTree(), fetchGroups()])
  fetchAll()
})
</script>

<style scoped>
.da {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

/* ============ 台账主体：左树 + 右列表 ============ */
.da-body {
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-height: 0;
}

/* ============ 左侧：分组树 ============ */
.da-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  width: 268px;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: width 0.18s ease;
}
.da-rail.is-collapsed {
  width: 44px;
}

.da-strip {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 10px;
}
.da-strip__count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 2px 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-mono, monospace);
}
.da-strip__count b { font-size: 15px; line-height: 1; }
.da-strip__count span { font-size: 10px; opacity: 0.6; }
.da-strip__dots {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.da-strip__dots i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.da-strip__dots i.is-on { background: var(--el-color-success); }
.da-strip__dots i.is-off { background: var(--el-color-info); }
.da-strip__gap { flex: 1; }
.da-strip__toggle {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  padding: 4px;
}

.da-rail__head {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 10px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.da-rail__row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.da-rail__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.da-rail__count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
  margin-left: 4px;
}
.da-rail__count i { font-style: normal; opacity: 0.55; }
.da-rail__gap { flex: 1; }

.da-tool {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: background 0.15s ease;
}
.da-tool:hover { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.da-tool.is-primary { background: var(--el-color-primary); color: var(--el-color-white); }
.da-tool.is-primary:hover { opacity: 0.9; }
.da-tool:disabled { opacity: 0.4; cursor: not-allowed; }

.da-search :deep(.re-input__inner) {
  height: 28px;
}

.da-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.da-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-bg-color-overlay);
  font-size: 11px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.da-chip b { font-family: var(--el-font-family-mono, monospace); }
.da-chip.is-active {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* 左侧树：上方维度切换（组织 / 分组 / 厂家），下方只显示一棵树 */
/* 设备叶子：大类图标 + 在线点，行结构与组织 / 分组 / 厂家共用 */
.da-tree__icon {
  flex: none;
  color: var(--el-text-color-secondary);
}
.da-tree__item.is-active .da-tree__icon { color: var(--el-color-primary); }
.da-tree__state {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.da-tree__state.is-on { background: var(--el-color-success); }
.da-tree__state.is-off { background: var(--el-text-color-placeholder); }

/* 维度切换：分段控件 */
.da-tree__modes {
  display: flex;
  gap: 3px;
  margin: 0 4px 8px;
  padding: 3px;
  background: var(--el-fill-color-light);
  border-radius: 9px;
}
.da-tree__mode {
  flex: 1;
  padding: 5px 8px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 0;
  border-radius: 7px;
  cursor: pointer;
  transition: color 0.16s ease, background 0.16s ease;
}
.da-tree__mode:hover { color: var(--el-color-primary); }
.da-tree__mode.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
  font-weight: 600;
}

/* 展开箭头：只有有下一级的节点才显示，点箭头只折叠不筛选 */
.da-tree__caret {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 12px;
  flex: none;
  color: var(--el-text-color-placeholder);
  transition: transform 0.16s ease;
}
.da-tree__caret.is-open { transform: rotate(90deg); }
.da-tree__caret.is-leaf { visibility: hidden; }

.da-tree__dot.is-org { background: var(--el-color-primary-light-3); }
.da-tree__dot.is-group { background: var(--el-color-success); }
.da-tree__dot.is-vendor { background: var(--el-color-warning); }
.da-tree__item--root {
  margin-bottom: 6px;
  padding-bottom: 7px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  border-radius: 6px 6px 0 0;
}
.da-tree__empty {
  padding: 12px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.da-tree {
  flex: 1;
  min-height: 0;
  padding: 8px 6px;
}
.da-tree__ops {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
  padding: 0 4px 6px;
}
.da-tree__op {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.da-tree__op:hover { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.da-tree__op.is-on { color: var(--el-color-primary); }
.da-tree__op:disabled { opacity: 0.4; cursor: not-allowed; }

.da-tree__item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: transparent;
  cursor: pointer;
}
.da-tree__item:hover { background: var(--el-fill-color-light, var(--el-color-primary-light-9)); }
.da-tree__item.is-active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.da-tree__item:active { background: var(--el-color-primary-light-8); }
/* 拖拽：被拖起的行淡出，合法落点高亮（松手即保存） */
.da-tree__item.is-dragging { opacity: 0.45; cursor: grabbing; }
.da-tree__item.is-drop {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-5);
}
.da-tree__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-info);
  flex: none;
}
.da-tree__dot.is-all {
  background: var(--el-color-primary);
}
.da-tree__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-tree__count {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
  background: var(--el-fill-color-light, var(--el-color-primary-light-9));
  border-radius: 999px;
  padding: 0 6px;
}
/* 分组行的所属组织：很淡，放名字右边，挤不下就先省略 */
.da-tree__hint {
  flex: 0 1 auto;
  max-width: 96px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.da-rail__foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.da-rail__row { flex: 1; min-width: 0; }
.da-foot__sum {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, monospace);
}
.da-foot__sum i {
  display: inline-block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.da-foot__sum i.is-on { background: var(--el-color-success); }
.da-foot__sum i.is-off { background: var(--el-color-info); }
.da-foot__hint { font-size: 11px; color: var(--el-text-color-secondary); }
.da-rail__fold {
  border: none;
  background: none;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  padding: 2px;
}
.da-rail__fold:hover { color: var(--el-color-primary); }

/* ============ 右侧：工作区页签 ============ */
.da-work {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.da-work > .re-tabs { flex: 1; min-height: 0; }

/* 「设备资产」页签内容：批量条 + 列表 + 底部信息条 */
.da-assets {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

/* 列表工具条：高度固定，未选中时是台账概览，选中后变成批量操作条
   —— 两种状态同高，多选时列表不会回流跳动 */
.da-batch {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 46px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-blank, var(--el-bg-color));
  border-radius: 10px;
  transition: background 0.16s ease, border-color 0.16s ease;
}
.da-batch.is-batch {
  border-color: var(--el-color-primary-light-7);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}
.da-batch__text { font-size: 13px; color: var(--el-text-color-primary); }
.da-batch__text b { font-family: var(--el-font-family-mono, monospace); }
.da-batch__hint { font-size: 12px; color: var(--el-text-color-secondary); }
.da-batch__ops { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
/* 左树定位到单台设备时，工具条上显示的收敛口径 + 一键解除 */
.da-batch__filter {
  margin-left: 6px;
  font-size: 12px;
  color: var(--el-color-primary);
}
.da-batch__clear {
  margin-left: 4px;
  padding: 0 2px;
  border: none;
  background: none;
  font-size: 12px;
  color: var(--el-color-primary);
  text-decoration: underline;
  cursor: pointer;
}

/* 工具条左侧：概览 / 批量操作共用一个可伸缩容器 */
.da-batch__left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.da-batch__left .da-batch__text {
  flex: none;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 视图切换：分段控件（卡片 / 表格） */
.da-view {
  flex: none;
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.da-view__btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.da-view__btn:hover { color: var(--el-color-primary); }
.da-view__btn.is-active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
  font-weight: 600;
}

/* ============ 卡片台账（B 版默认视图） ============ */
.da-cards {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
}
.da-cards__scroll {
  flex: 1;
  min-height: 0;
}
.da-cards__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(254px, 1fr));
  gap: 10px;
  padding: 2px 2px 14px;
  align-content: start;
}

.da-card {
  --cat: var(--el-text-color-secondary);
  --cat-soft: var(--el-fill-color-light);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 12px 13px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-lighter);
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
}
/* 分类色：左侧一条短色带，图标底色跟着分类走 */
.da-card::before {
  content: '';
  position: absolute;
  inset: 0 auto 0 0;
  width: 3px;
  border-radius: 12px 0 0 12px;
  background: var(--cat);
  opacity: 0.85;
}
.da-card:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--cat) 45%, var(--el-border-color-lighter));
  box-shadow: 0 6px 18px color-mix(in srgb, var(--cat) 12%, transparent);
}
.da-card.is-active {
  border-color: color-mix(in srgb, var(--cat) 60%, var(--el-border-color));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--cat) 18%, transparent);
}
.da-card.is-selected {
  outline: 2px solid color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  outline-offset: -1px;
}
.da-card.is-offline .da-card__icon {
  filter: grayscale(0.65);
  opacity: 0.75;
}

/* 分类色板：与表格里的分类图标保持一致 */
.da-card.is-camera { --cat: #409eff; --cat-soft: rgba(64, 158, 255, 0.12); }
.da-card.is-accessControl { --cat: #67c23a; --cat-soft: rgba(103, 194, 58, 0.13); }
.da-card.is-alarm { --cat: #e6a23c; --cat-soft: rgba(230, 162, 60, 0.15); }
.da-card.is-intercom { --cat: #8b5cf6; --cat-soft: rgba(139, 92, 246, 0.13); }
.da-card.is-other { --cat: #909399; --cat-soft: rgba(144, 147, 153, 0.14); }

.da-card__head {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.da-card__icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--cat-soft);
  color: var(--cat);
}
.da-card__title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  /* 给右上角勾选按钮留位 */
  padding-right: 22px;
}
.da-card__title b {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-card__dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.da-card__dot.is-on {
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px rgba(103, 194, 58, 0.16);
}
.da-card__dot.is-off { background: var(--el-text-color-placeholder); }
.da-card__code {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.da-card__facts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.da-card__fact {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.da-card__ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.da-card__tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  min-height: 20px;
}
.da-card__cat {
  flex: none;
  padding: 0 6px;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 600;
  line-height: 18px;
  color: var(--cat);
  background: var(--cat-soft);
}
.da-card__more {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.da-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.da-card__where {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}
.da-card__acts {
  display: inline-flex;
  gap: 4px;
  flex: none;
}
.da-card__act {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: transparent;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.da-card__act:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.da-card__act.is-play {
  color: var(--el-color-success);
  border-color: color-mix(in srgb, var(--el-color-success) 35%, var(--el-border-color-lighter));
}
.da-card__act.is-play:hover {
  color: var(--el-color-success);
  border-color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, transparent);
}

/* 卡片右上角勾选：平时淡出，悬浮 / 选中时出现 */
.da-card__check {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.da-card:hover .da-card__check { opacity: 1; }
.da-card__check.is-on {
  opacity: 1;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

/* ReTable 自带卡片内边距与边框，这里只负责让它吃满剩余高度 */
.da-table-wrap {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.da-table-wrap > .da-table {
  flex: 1 1 0;
  min-height: 0;
}

.da-dev {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
/* 设备大类图标：底色按大类区分（相机 / 门禁 / 报警 / 对讲 / 其他） */
.da-dev__icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
}
.da-dev__icon.is-camera { background: rgba(64, 158, 255, 0.12); color: var(--el-color-primary); }
.da-dev__icon.is-accessControl { background: rgba(103, 194, 58, 0.14); color: var(--el-color-success); }
.da-dev__icon.is-alarm { background: rgba(230, 162, 60, 0.16); color: var(--el-color-warning); }
.da-dev__icon.is-intercom { background: rgba(144, 147, 153, 0.16); color: var(--el-color-info); }
.da-dev__text { min-width: 0; }

.da-dev__top {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.da-dev__name {
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-dev__code {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.da-vendor__name { color: var(--el-text-color-regular); font-size: 12.5px; }
.da-vendor__model {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-status { line-height: 1.2; }
.da-status__hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
/* 最后上线：ReTime 的绝对时间 + 相对时间两行，压小一号 */
.da-time { font-size: 12px; line-height: 1.3; }
.da-muted { font-size: 11px; color: var(--el-text-color-secondary); }
.da-ip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--el-text-color-regular);
  font-size: 12.5px;
}

/* 空态：淡主题色底 + 虚线边 + 图标块。
   2026-11-07 反馈：原来是裸文字压在面板底色上，「直接底色不好看」。
   这里给一层可见但克制的主题色浅底（深浅色主题都由 color-mix 自适应）。 */
.da-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  margin: 10px;
  padding: 26px 20px;
  border: 1px dashed color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color));
  border-radius: var(--el-radius-xl, 16px);
  background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
  text-align: center;
}

.da-empty__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.da-empty__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.da-empty__text {
  max-width: 420px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.mono { font-family: var(--el-font-family-mono, monospace); }

/* ============ 底部信息条 ============ */
.da-bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding: 8px 14px;
  min-height: 40px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  font-size: 12.5px;
  color: var(--el-text-color-regular);
}
.da-bar__id {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.da-bar__name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.da-bar__item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}
.da-bar__item b { color: var(--el-text-color-primary); }
.da-bar__gap { flex: 1; }
.da-bar__hint { font-size: 12px; color: var(--el-text-color-secondary); }
</style>