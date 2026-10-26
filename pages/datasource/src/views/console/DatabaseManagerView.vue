<template>
  <div class="dbm" :class="{ 'is-embedded': embedded, 'dbm--fullscreen': isFullscreen }">
    <!-- 顶部工具栏
         页面级动作只留数据源切换与一个刷新：新建查询 / 新建库表 / 导入数据已下沉到右键菜单
         （表 / 库 / 空白 三套），与 Navicat 的操作面一致。
         表页签激活时把表名 / 模式 / 动作 / 分页全部挂到 hero：
         左侧吃下表名 + 字段-注释-类型 + 数据模式 + 新增/导出/刷新/清空，
         右侧在刷新树之后跟上分页条 —— 网格上方不再单独占行，数据区多出一整行。 -->
    <div class="dbm-toolbar re-surface re-surface--dense">
      <!-- 表数据视图的名字 / 模式 / 动作已上迁到这里：网格上方不再单独占一整行工具条，
            数据区因此多出一整行。标记 dbm-table-toolbar 锚类是为了让验收套件
            （.dbm-table-toolbar 下的按钮选择器）继续命中这簇控件；分页器在
            右侧簇的 .dbm-pager-bar 里，套件按其自身作用域选择，不走本锚类。 -->
      <template v-if="activeTabObj && activeTabObj.type === 'table'">
        <div class="dbm-toolbar-left dbm-table-toolbar">
          <span class="dbm-table-name">{{ qualified(activeTabObj) }}</span>
          <!-- 显示模式这一排可以收起：两组胶囊加起来占掉一整行高度，而它们都是
               「设置一次就不再动」的偏好。收起后功能不丢 —— 表头右键菜单里是同一组开关
               （同一个 headerMode / rowMode 状态源，不是两份实现）。
               默认展开：既有验收脚本按 .dbm-subtab 定位，折叠态是可选路径。 -->
          <button
            type="button"
            class="dbm-mode-toggle"
            :class="{ 'is-collapsed': modeRowCollapsed }"
            :aria-expanded="!modeRowCollapsed"
            :title="modeRowCollapsed ? '展开显示模式' : '收起显示模式（右键表头同样可切换）'"
            @click="modeRowCollapsed = !modeRowCollapsed"
          >
            <ReIcon name="ArrowDown" :size="12" />
          </button>
          <!-- 表头显示模式：字段 / 注释 / 字段+注释 / 类型 -->
          <div v-show="!modeRowCollapsed" class="dbm-subtabs">
            <span
              v-for="m in HEADER_MODES"
              :key="m.value"
              class="dbm-subtab"
              :class="{ active: headerMode === m.value }"
              @click="headerMode = m.value"
            >{{ m.label }}</span>
          </div>
          <!-- 行显示模式：数据 / 数据+注释 -->
          <div v-show="!modeRowCollapsed" class="dbm-subtabs">
            <span
              v-for="m in ROW_MODES"
              :key="m.value"
              class="dbm-subtab"
              :class="{ active: rowMode === m.value }"
              @click="rowMode = m.value"
            >{{ m.label }}</span>
          </div>
          <span class="dbm-spacer" />
          <ReButton layout="square" type="primary" icon="Plus" tip="新增行" @click="openAddRowDialog" />
          <ReButton
            layout="square"
            icon="Download"
            tip="导出数据"
            @click="openExportDialog(activeTabObj.tableName, activeTabObj.database)"
          />
          <ReButton layout="square" icon="Refresh" tip="刷新数据" @click="refreshTableData" />
          <ReButton
            layout="square"
            type="danger"
            plain
            icon="Delete"
            tip="清空表"
            @click="confirmTruncate(activeTabObj.tableName, activeTabObj.database)"
          />
        </div>
      </template>
      <template v-else>
        <div class="dbm-toolbar-left">
          <span class="dbm-toolbar-hint">右键表 / 库 / 空白处可执行新建、导入导出等操作</span>
        </div>
      </template>
      <div class="dbm-toolbar-right">
        <!-- 刷新连接树必须保持 DOM 第一位：套件用 .dbm-toolbar-right .rs-btn :first 命中它 -->
        <ReButton layout="square" icon="Refresh" tip="刷新连接树" data-testid="dsm-btn-refresh" @click="refreshTree" />
        <!-- 表视图设置簇：与 .dbm-table-view 同一 v-if 条件，表页签激活才出现。
             表名/模式/动作那簇已上迁到左侧（.dbm-table-toolbar 锚类），
             分页（统计总数/上一页下一页）也跟上来 —— 网格上方不再留任何工具条。 -->
        <template v-if="activeTabObj && activeTabObj.type === 'table'">
          <div class="dbm-pager-bar">
            <RePagination
              v-if="showTotal"
              v-model:current-page="tableData.page"
              :total="tableData.total"
              :page-size="tableData.pageSize"
              :page-sizes="[20, 50, 100, 200, 500]"
              pagination-layout="total, sizes, prev, pager, next"
              @current-change="onPageChange"
              @update:page-size="onPageSizeChange"
            />
            <span v-else class="dbm-simple-pager">
              <ReButton
                layout="square"
                icon="ArrowLeft"
                tip="上一页"
                :disabled="tableData.page <= 1"
                @click="onPageChange(tableData.page - 1)"
              />
              <span class="dbm-hint">第 {{ tableData.page }} 页（未统计总数）</span>
              <ReButton
                layout="square"
                icon="ArrowRight"
                tip="下一页"
                :disabled="(tableData.rows?.length ?? 0) < tableData.pageSize"
                @click="onPageChange(tableData.page + 1)"
              />
            </span>
          </div>
        </template>
        <!-- 表视图设置簇：与 .dbm-table-view 同一 v-if 条件，表页签激活才出现 -->
        <!-- 表视图设置簇：与 .dbm-table-view 同一 v-if 条件，表页签激活才出现 -->
        <template v-if="activeTabObj && activeTabObj.type === 'table'">
          <ReRadioGroup
            v-model="showTotalValue"
            class="dbm-total-select"
            :capsule="false"
            size="small"
            aria-label="统计总数"
          >
            <ReRadioButton value="yes">是</ReRadioButton>
            <ReRadioButton value="no">否</ReRadioButton>
          </ReRadioGroup>
          <ReButton layout="square" icon="Operation" tip="列显示设置（显示 / 固定列）" @click="openColumnViewDialog" />
          <ReButton layout="square" icon="SetUp" tip="恢复默认设置（视图偏好与各表筛选条件）" @click="resetViewSettings" />
        </template>
        <!-- 数据源选择已删除：独立路由 /db-manager 由外层数据源中心带 datasourceId 进入，
             页内再放一个下拉会和外层左栏的选择打架（两个可改同一个值）。
             这里只读展示当前浏览的数据源，切换请回到外层列表。 -->
        <span class="dbm-ds-chip">
          <ReIcon name="Coin" :size="13" />
          {{ currentDatasourceName }}
        </span>
      </div>
    </div>

    <div class="dbm-body">
      <!-- 左侧连接树 -->
      <div class="dbm-sidebar" @contextmenu.prevent="onSidebarContextMenu">
        <div class="dbm-tree" @contextmenu.prevent="onSidebarContextMenu">
          <!-- 数据源根节点 -->
          <div
            class="dbm-tree-node dbm-tree-root"
            @click="toggleNode('root')"
            @contextmenu.prevent="onRootContextMenu($event)"
          >
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" :size="12" class="dbm-arrow" />
            <ReIcon name="Connection" :size="15" class="dbm-tree-icon dbm-root-icon" />
            <span class="dbm-tree-label">{{ currentDatasourceName }}</span>
          </div>

          <template v-if="expandedNodes.has('root')">
            <div v-for="db in databases" :key="db">
              <!-- 库节点 -->
              <div
                class="dbm-tree-node"
                :class="{ active: activeDatabase === db && !activeTable }"
                @click="toggleNode('db:' + db)"
                @contextmenu.prevent="onDatabaseContextMenu($event, db)"
              >
                <ReIcon :name="expandedNodes.has('db:' + db) ? 'ArrowDown' : 'ArrowRight'" :size="12" class="dbm-arrow" />
                <ReIcon name="Coin" :size="15" class="dbm-tree-icon dbm-db-icon" />
                <span class="dbm-tree-label">{{ dbLabel(db) }}</span>
              </div>

              <!-- 表 / 视图（挂在本库之下，Navicat 式平铺：分组计数头「表（N）」第九批按需移除，
                   表用 Grid 图标、视图用 View 图标即可区分） -->
              <div v-if="expandedNodes.has('db:' + db)" class="dbm-tree-children">
                <template v-for="table in tablesOf(db)" :key="db + '.T.' + table.name">
                  <div
                    class="dbm-tree-node dbm-table-node"
                    :class="{ active: activeTable === table.name && activeDatabase === db }"
                    @click="selectTable(table.name, db)"
                    @contextmenu.prevent="onTableContextMenu($event, table.name, db)"
                  >
                    <ReIcon
                      :name="expandedTables.has(db + '.' + table.name) ? 'ArrowDown' : 'ArrowRight'"
                      :size="12"
                      class="dbm-arrow"
                      @click.stop="toggleTable(table.name, db)"
                    />
                    <ReIcon name="Grid" :size="14" class="dbm-tree-icon dbm-table-icon" />
                    <span class="dbm-tree-label" :title="table.remark || table.name">{{ table.name }}</span>
                    <span v-if="table.remark" class="dbm-tree-remark">{{ table.remark }}</span>
                  </div>
                  <div v-if="expandedTables.has(db + '.' + table.name)" class="dbm-tree-children">
                    <div v-for="col in columnsOf(db, table.name)" :key="col.name" class="dbm-tree-node dbm-column-node">
                      <ReIcon
                        :name="col.isPrimaryKey ? 'Key' : 'Document'"
                        :size="13"
                        class="dbm-tree-icon"
                        :class="col.isPrimaryKey ? 'dbm-pk-icon' : 'dbm-col-icon'"
                      />
                      <span class="dbm-tree-label" :title="col.remark || col.name">{{ col.name }}</span>
                      <span class="dbm-tree-type">{{ col.type }}</span>
                    </div>
                  </div>
                </template>

                <!-- 对象分类节点（存储过程 / 函数 / 触发器 / 事件，Navicat 式分组） -->
                <template v-for="cat in DB_OBJECT_CATEGORIES" :key="'cat:' + db + '.' + cat.value">
                  <div
                    class="dbm-tree-node dbm-tree-children"
                    :class="{ active: expandedObjects.has('obj:' + db + ':' + cat.value) }"
                    @click="toggleObjectNode(db, cat.value)"
                  >
                    <ReIcon
                      :name="objectNodeExpanded(db, cat.value) ? 'ArrowDown' : 'ArrowRight'"
                      :size="12"
                      class="dbm-arrow"
                    />
                    <ReIcon :name="cat.icon" :size="14" class="dbm-tree-icon dbm-col-icon" />
                    <span class="dbm-tree-label">{{ cat.label }}</span>
                    <span class="dbm-tree-remark">{{ objectCountOf(db, cat.value) }}</span>
                    <ReIcon
                      name="Plus"
                      :size="12"
                      class="dbm-tree-add"
                      title="新建"
                      @click.stop="openObjectDefinition(cat.value, '', db)"
                    />
                  </div>
                  <div v-if="objectNodeExpanded(db, cat.value)" class="dbm-tree-children">
                    <div v-if="objectErrorOf(db, cat.value)" class="dbm-tree-hint">
                      {{ objectErrorOf(db, cat.value) }}
                    </div>
                    <ReEmpty v-else-if="!objectsOf(db, cat.value).length" description="无对象" :image-size="24" />
                    <div
                      v-for="obj in objectsOf(db, cat.value)"
                      :key="'obj:' + db + ':' + cat.value + ':' + obj.name"
                      class="dbm-tree-node dbm-table-node"
                      @click="openObjectDefinition(cat.value, obj.name, db)"
                    >
                      <span class="dbm-arrow" />
                      <ReIcon :name="cat.icon" :size="13" class="dbm-tree-icon dbm-col-icon" />
                      <span class="dbm-tree-label" :title="obj.definer ? `DEFINER=${obj.definer}` : obj.name">{{ obj.name }}</span>
                      <span v-if="cat.value === 'trigger'" class="dbm-tree-remark">
                        {{ obj.timing }}·{{ obj.event }}
                      </span>
                      <span v-else-if="cat.value === 'event' && obj.status" class="dbm-tree-remark">
                        {{ obj.status }}
                      </span>
                    </div>
                  </div>
                </template>

                <template v-for="view in viewsOf(db)" :key="db + '.V.' + view.name">
                  <div
                    class="dbm-tree-node dbm-table-node"
                    :class="{ active: activeTable === view.name && activeDatabase === db }"
                    @click="selectTable(view.name, db)"
                    @contextmenu.prevent="onTableContextMenu($event, view.name, db, true)"
                  >
                    <ReIcon
                      :name="expandedTables.has(db + '.' + view.name) ? 'ArrowDown' : 'ArrowRight'"
                      :size="12"
                      class="dbm-arrow"
                      @click.stop="toggleTable(view.name, db)"
                    />
                    <ReIcon name="View" :size="14" class="dbm-tree-icon dbm-view-icon" />
                    <span class="dbm-tree-label" :title="view.remark || view.name">{{ view.name }}</span>
                    <span v-if="view.remark" class="dbm-tree-remark">{{ view.remark }}</span>
                  </div>
                  <div v-if="expandedTables.has(db + '.' + view.name)" class="dbm-tree-children">
                    <div v-for="col in columnsOf(db, view.name)" :key="col.name" class="dbm-tree-node dbm-column-node">
                      <ReIcon name="Document" :size="13" class="dbm-tree-icon dbm-col-icon" />
                      <span class="dbm-tree-label" :title="col.remark || col.name">{{ col.name }}</span>
                      <span class="dbm-tree-type">{{ col.type }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="dbm-content">
        <!-- 标签页（第九批：支持右键关闭当前/其他/全部） -->
        <div class="dbm-tabs" v-if="tabs.length > 0" @contextmenu.prevent>
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="dbm-tab"
            :class="{ active: activeTab === tab.id }"
            @click="selectTab(tab.id)"
            @contextmenu.prevent="onTabContextMenu($event, tab.id)"
          >
            <ReIcon
              :name="tab.type === 'query' ? 'Edit' : tab.type === 'object'
                ? (DB_OBJECT_CATEGORIES.find(c => c.value === tab.objectCategory)?.icon ?? 'Document')
                : tab.type === 'users' ? 'User' : 'Grid'"
              size="12"
            />
            <span class="dbm-tab-title">{{ tab.title }}</span>
            <ReIcon name="Close" size="12" class="dbm-tab-close" @click.stop="closeTab(tab.id)" />
          </div>
        </div>

        <!-- 表数据视图：表名/模式/动作/分页已全部上迁到顶部工具条（要求 1），
              网格上方不再单独占行。这里只剩折叠的过滤条 + 表格本身。 -->
        <div v-if="activeTabObj && activeTabObj.type === 'table'" class="dbm-table-view">
          <!-- 过滤条（Navicat 式 WHERE 条件 + 快捷筛选）：默认折叠，展开后才有 WHERE 输入行 -->
          <div class="dbm-filter-bar">
            <ReButton
              layout="square"
              :icon="filterBarOpen ? 'ArrowUp' : 'ArrowDown'"
              :tip="filterBarOpen ? '收起 WHERE 过滤' : '展开 WHERE 过滤'"
              @click="filterBarOpen = !filterBarOpen"
            />
            <!-- 折叠着但过滤正生效：条件被藏起来了，这里必须留个记号，否则只看到「数据变少」 -->
            <span v-if="!filterBarOpen && filterActive" class="dbm-filter-badge">过滤中</span>
            <template v-if="filterBarOpen">
              <span class="dbm-filter-label">WHERE</span>
              <!-- ReInput 根是 display:contents（无盒），width 落在根上等于没写。
                   这里用父作用域的 wrapper 产生真盒：内部 el-input 自动铺满 wrapper。 -->
              <span class="dbm-filter-input-wrap">
                <ReInput
                  v-model="filterWhere"

                  class="dbm-mono dbm-filter-input"
                  placeholder="例：status = 1 AND name LIKE 'a%'（留空不过滤）"
                  clearable
                  @keyup.enter="applyFilter"
                />
              </span>
              <ReButton layout="square" type="primary" icon="Search" tip="应用过滤（Enter）" @click="applyFilter" />
              <ReButton layout="square" icon="RefreshLeft" tip="清除过滤" @click="clearFilter" />
              <ReButton
                layout="square"
                icon="Filter"
                tip="高级筛选（列 + 运算符 + 值）"
                @click="openFilterDialog"
              />
              <span
                v-if="activeFilters.length"
                class="dbm-filter-badge"
              >{{ activeFilters.length }} 个条件</span>
            </template>
            <span class="dbm-spacer" />
            <span v-if="selection.length" class="dbm-sel-count">已选 {{ selection.length }} 行</span>
            <ReButton
              v-if="selection.length"
              layout="square"
              type="danger"
              plain
              icon="Delete"
              :tip="`删除选中的 ${selection.length} 行`"
              @click="deleteSelectedRows"
            />
          </div>
          <!-- 行/单元格操作走右键菜单（无操作列）；列可拖拽调序 —— ReTable 默认关闭，控制台这里开 -->
          <!-- @contextmenu 是原生监听：ReTable 是 inheritAttrs:true 的单根组件，
               监听会落在它的 .re-table 根上。表头区域由 onGridHeaderContextMenu 接管，
               单元格区域直接放行 —— ReTable 自己的 .re-ctx-menu 还要用这次事件。 -->
          <ReTable
            :data="tableData.rows"
            :columns="tableColumns"
            :row-key="gridRowKey"
            :loading="tableLoading"
            :pagination="false"
            :border="true"
            column-draggable
            :table-id="tableGridId"
            :header-show-overflow-tooltip="true"
            show-selection
            stripe
            size="mini"
            height="calc(100% - 56px)"
            :context-menu="gridMenuItems"
            @contextmenu="onGridHeaderContextMenu"
            @selection-change="onSelectionChange"
            @sort-change="onSortChange"
            @context-menu-select="onGridMenuSelect"
          >
            <template v-for="col in tableData.columns" :key="'cell-' + col" #[`col-${col}`]="{ row, value }">
              <div v-if="editingCell && editingCell.row === row && editingCell.column === col" class="dbm-cell-edit" @click.stop>
                <!-- 日期 / 时间列：弹选择器、选完即存（autoCommit）。
                     以前这里一律是文本框，DATETIME / TIME 得手敲 "2026-10-26 12:00:00"，
                     格式敲错就直接写进库或报错。 -->
                <DbTemporalEditor
                  v-if="temporalKindOf(col, editingCell.value)"
                  :type="columnTypes.get(col)"
                  :model-value="editingCell.value"
                  size="small"
                  autofocus
                  auto-commit
                  @update:model-value="setEditingCellValue"
                  @commit="saveCell(row, col)"
                  @cancel="cancelCell"
                />
                <ReInput
                  v-else
                  :model-value="editingCell.value"

                  autofocus
                  :type="longTextColumns.has(col) ? 'textarea' : 'text'"
                  @update:model-value="setEditingCellValue"
                  @keyup.enter="saveCell(row, col)"
                  @keyup.esc="cancelCell"
                  @blur="saveCell(row, col)"
                />
              </div>
              <!-- 二进制 / 长文本：不进格内编辑，走 Blob Viewer -->
              <div
                v-else-if="isBinaryCol(col) || isLongTextCol(col)"
                class="dbm-cell-box"
              >
                <button
                  type="button"
                  class="dbm-cell-blob"
                  :aria-label="`打开 ${col} 的内容查看器`"
                  @click.stop="openBlobViewer(row, col, value)"
                >
                  <ReIcon :name="blobIcon(col, value)" :size="12" />
                  <span class="dbm-cell-blob-text">{{ blobSummary(col, value) }}</span>
                </button>
              </div>
              <div v-else class="dbm-cell-box">
                <span
                  class="dbm-cell-value"
                  :class="{ 'dbm-cell-pk': pkColumns.has(col) }"
                  :title="pkColumns.has(col) ? '主键列不可编辑' : '点击编辑 / 右键更多操作'"
                  @click="startEditCell(row, col, value)"
                >{{ formatCellValue(value) }}</span>
                <span v-if="rowMode === 'data-comment' && columnComment(col)" class="dbm-cell-comment">{{ columnComment(col) }}</span>
              </div>
            </template>
          </ReTable>
        </div>

        <!-- 表设计视图
             表名 + 子页签 + 动作合成**一行**：此前是「工具条」与「动作条」两行，
             且两个「刷新」按钮指向同一个动作。主内容区因此少掉约 36px。 -->
        <div v-if="activeTabObj && activeTabObj.type === 'design'" class="dbm-design-view">
          <div class="dbm-design-toolbar">
            <span class="dbm-table-name">{{ qualified(activeTabObj) }}</span>
            <div class="dbm-subtabs">
              <span class="dbm-subtab" :class="{ active: designSubTab === 'columns' }" @click="designSubTab = 'columns'">表结构</span>
              <span class="dbm-subtab" :class="{ active: designSubTab === 'indexes' }" @click="openIndexes">索引</span>
              <span class="dbm-subtab" :class="{ active: designSubTab === 'foreignKeys' }" @click="openForeignKeys">外键</span>
            </div>
            <div class="dbm-col-actions">
              <template v-if="designSubTab === 'columns'">
                <ReButton layout="square" type="primary" icon="Plus" tip="新增列" @click="openColumnDialog('add')" />
                <ReButton
                  layout="square"
                  type="primary"
                  plain
                  icon="Check"
                  :tip="designDirtyCount > 0 ? `保存 ${designDirtyCount} 处改动` : '保存（无改动）'"
                  :disabled="designDirtyCount === 0"
                  @click="saveDesignAll"
                />
                <ReButton layout="square" icon="Setting" tip="表属性" @click="openTableOptionsDialog" />
                <ReButton layout="square" icon="Key" tip="设置主键" @click="openPkDialog" />
              </template>
              <template v-else-if="designSubTab === 'indexes'">
                <ReButton layout="square" type="primary" icon="Plus" tip="新建索引" @click="openIndexDialog" />
              </template>
              <template v-else>
                <ReButton layout="square" type="primary" icon="Plus" tip="新增外键" @click="openAddForeignKey" />
              </template>
              <ReButton layout="square" icon="Refresh" tip="刷新" @click="reloadDesignArea" />
            </div>
          </div>

          <template v-if="designSubTab === 'columns'">
            <div class="dbm-col-hint">单元格可直接编辑，改动行高亮，保存后生效</div>
            <!-- 表结构网格：与「新建表（设计表）」共用同一个 DesignColumnGrid，
                 列清单只在组件里维护一份（此前这里是手写 flex 网格，缺小数位且与弹窗各自为政）。 -->
            <DesignColumnGrid
              :rows="designRows"
              mode="existing"
              :loading="designLoading"
              :is-dirty="isDesignDirty"
              :max-height="designGridHeight"
              empty-text="暂无字段"
              @save-row="saveDesignRow"
              @remove-row="row => removeColumn(row as never)"
              @open-column="row => openColumnDialog('edit', row)"
              @reorder="onDesignReorder"
            />
          </template>

          <template v-else-if="designSubTab === 'indexes'">
            <div class="dbm-col-hint">索引与主键都是真实约束，创建后立即对写入与查询计划生效</div>
            <ReTable
              :data="indexes"
              :columns="indexColumnDefs"
              :loading="indexLoading"
              :pagination="false"
              stripe
              border
              size="mini"
              column-draggable
              height="calc(100% - 70px)"
            >
              <template #col-actions="{ row }">
                <ReButton layout="square" type="danger" icon="Delete" tip="删除索引" @click="removeIndex(row)" />
              </template>
            </ReTable>
          </template>

          <!-- 外键（可增删，Navicat 外键页签） -->
          <template v-else>
            <div class="dbm-col-hint">外键是真实约束，新增后立即对写入生效</div>
            <ReTable
              :data="foreignKeys"
              :columns="foreignKeyColumnDefs"
              :loading="fkLoading"
              :pagination="false"
              stripe
              border
              size="mini"
              column-draggable
              height="calc(100% - 70px)"
            >
              <template #col-fk-actions="{ row }">
                <ReButton layout="square" type="danger" icon="Delete" tip="删除外键" @click="removeForeignKey(row)" />
              </template>
            </ReTable>
          </template>
        </div>

        <!-- SQL 查询视图 -->
        <div v-if="activeTabObj && activeTabObj.type === 'query'" class="dbm-query-view">
          <div class="dbm-query-editor">
            <div class="dbm-query-toolbar">
              <ReButton layout="square" type="primary" icon="VideoPlay" tip="执行（Ctrl+Enter）" @click="executeQuery" />
              <ReButton layout="square" icon="Files" tip="执行脚本（逐条出结果）" @click="executeScript" />
              <ReButton layout="square" icon="Tickets" tip="执行计划" @click="executeExplain" />
              <ReButton layout="square" icon="Operation" tip="查询参数" @click="openParamDialog" />
              <!-- 事务开关：关着时一切照旧（各自独立自动提交），
                   开着时执行会挂进一个未提交的事务，由「提交/回滚」收尾 -->
              <label class="dbm-switch dbm-tx-switch" :class="{ on: txWanted || !!txId }">
                <ReSwitch v-model="txWanted" aria-label="事务" />
                <span>事务</span>
              </label>
              <template v-if="txId">
                <ReButton layout="square" type="success" icon="Select" tip="提交事务" @click="commitTx" />
                <ReButton layout="square" type="danger" plain icon="CloseBold" tip="回滚事务" @click="rollbackTx" />
              </template>
              <ReButton
                v-else-if="txBusy"
                layout="square"
                icon="Loading"
                tip="正在开启事务"
                disabled
              />
              <span class="dbm-spacer" />
              <ReButton layout="square" icon="MagicStick" tip="格式化 SQL" @click="formatSql" />
              <ReButton layout="square" icon="Download" tip="保存为 SQL 文件" @click="saveSqlFile" />
              <ReButton layout="square" icon="Upload" tip="打开 SQL 文件" @click="openSqlFile" />
              <ReButton layout="square" icon="Clock" tip="查询历史" @click="toggleHistory" />
              <!-- 第九批 7.2：SQL 模板（保存/回填，落 localStorage）；
                   text2sql 入口按后端探测结果 available 显示（有整个功能才出现） -->
              <ReButton layout="square" icon="DocumentAdd" tip="保存为 SQL 模板" @click="saveSqlTemplate" />
              <ReButton layout="square" icon="Collection" tip="SQL 模板列表" @click="toggleTemplates" />
              <ReButton
                v-if="dbAi.available"
                layout="square"
                icon="ChatDotSquare"
                tip="AI 生成 SQL（text2sql）"
                @click="openAiDialog"
              />
              <!-- 第九批 8.1：执行超时可配（默认 120s > 后端语句级 60s，
                   让后端超时先报、错误信息可读；原全局 10s 会把慢查询在前端掐断） -->
              <ReSelect v-model="execTimeoutSec" class="dbm-timeout-select" style="width: 96px">
                <ReOption v-for="opt in execTimeoutOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
              </ReSelect>
              <ReSelect v-model="activeTabObj.database" placeholder="目标库" style="width: 200px">
                <ReOption v-for="db in databases" :key="db" :label="dbLabel(db)" :value="db" />
              </ReSelect>
              <!-- 打开 .sql：隐藏的原生 file input。不能用按钮直接触发，
                   因为要拿到 file 对象必须走 input[type=file] 的 change 事件 -->
              <input
                ref="sqlFileInputRef"
                type="file"
                accept=".sql,text/plain"
                class="dbm-hidden-input"
                @change="onSqlFilePicked"
              />
            </div>
            <DbSqlEditor
              v-model="activeSqlModel"
              :tables="getTablesForDb(activeTabObj.database || activeDatabase).map(t => t.name)"
              :column-resolver="resolveColumnsForTable"
              class="dbm-sql-component"
              @execute="executeQuery"
            />
          </div>
          <div class="dbm-query-result">
            <!-- 多结果集页签：只有「执行脚本」且脚本里有多条语句时才出现。
                 单条执行的形状保持不变（data.columns/data.rows），
                 6 个既有 UI 套件按 .dbm-result-message 与表头断言，不受影响 -->
            <div v-if="resultSets.length > 1" class="dbm-result-set-tabs">
              <button
                v-for="(r, i) in resultSets"
                :key="i"
                type="button"
                class="dbm-result-set-tab"
                :class="{ active: activeResultSet === i }"
                @click="selectResultSet(i)"
              >{{ resultSetLabel(r, i) }}</button>
            </div>
            <div class="dbm-result-header">
              <span v-if="queryResult.message" class="dbm-result-message">{{ queryResult.message }}</span>
              <span v-else-if="queryResult.rowCount !== undefined" class="dbm-result-message">查询完成，共 {{ queryResult.rowCount }} 行{{ queryResult.truncated ? '（已截断）' : '' }}</span>
              <span v-else-if="queryResult.affectedRows !== undefined" class="dbm-result-message">执行完成，影响 {{ queryResult.affectedRows }} 行</span>
              <span class="dbm-spacer" />
              <ReSelect
                v-if="queryResult.columns && queryResult.columns.length > 0"
                v-model="queryExportFormat"
                placeholder="导出结果"
                style="width: 128px"
              >
                <ReOption label="导出 CSV" value="csv" />
                <ReOption label="导出 TSV" value="tsv" />
                <ReOption label="导出 JSON" value="json" />
                <ReOption label="导出 XML" value="xml" />
              </ReSelect>
            </div>
            <ReTable
              v-if="queryResult.columns && queryResult.columns.length > 0"
              :data="queryResult.rows || []"
              :columns="queryColumns"
              :pagination="false"
              stripe
              border
              size="mini"
              column-draggable
              height="calc(100% - 40px)"
            />
            <!-- 失败的那条没有结果集，但**必须把原因整段显示出来**：
                 只在标题栏放一句「执行失败」时，长 SQL + 长错误信息会被截断，
                 用户看不出是哪条语句、错在哪个库。 -->
            <div v-else-if="activeResultIsFailure" class="dbm-result-error">
              <div class="dbm-result-error-title">第 {{ activeResultSet + 1 }} 条执行失败</div>
              <pre class="dbm-result-error-body">{{ queryResult.message }}</pre>
            </div>
            <div v-else-if="activeResultIsUpdate" class="dbm-result-plain">
              第 {{ activeResultSet + 1 }} 条是更新语句，没有结果集（影响 {{ queryResult.affectedRows ?? 0 }} 行）
            </div>
            <ReEmpty v-else description="执行 SQL 后显示结果" />
          </div>
          <!-- 查询历史：落 localStorage（刷新后仍在），点条目回填编辑器 -->
          <div v-if="historyVisible" class="dbm-history">
            <div class="dbm-history-head">
              <span class="dbm-hint">查询历史（{{ queryHistory.length }} 条）</span>
              <span class="dbm-spacer" />
              <ReButton layout="square" icon="Delete" tip="清空查询历史" @click="clearQueryHistory" />
              <ReButton layout="square" icon="Close" tip="关闭查询历史" @click="historyVisible = false" />
            </div>
            <div class="dbm-history-list">
              <div
                v-for="(h, i) in queryHistory"
                :key="i"
                class="dbm-history-item"
                :title="h.sql"
                @click="loadFromHistory(h.sql)"
              >
                <span class="dbm-history-time">{{ h.at }}</span>
                <span class="dbm-history-sql">{{ h.sql }}</span>
                <span class="dbm-history-meta">{{ h.summary }}</span>
              </div>
              <ReEmpty v-if="queryHistory.length === 0" description="还没有执行记录" />
            </div>
          </div>

          <!-- SQL 模板（第九批 7.2：保存当前编辑器 SQL，点条目回填；与查询历史互斥显示） -->
          <div v-if="templatesVisible" class="dbm-history dbm-tpl-panel">
            <div class="dbm-history-head">
              <span class="dbm-hint">SQL 模板（{{ sqlTemplates.length }} 个）</span>
              <span class="dbm-spacer" />
              <ReButton layout="square" icon="Close" tip="关闭模板列表" @click="templatesVisible = false" />
            </div>
            <div class="dbm-history-list">
              <div
                v-for="t in sqlTemplates"
                :key="t.name"
                class="dbm-history-item dbm-tpl-item"
                :title="t.sql"
                @click="loadSqlTemplate(t)"
              >
                <span class="dbm-history-time">{{ t.at }}</span>
                <span class="dbm-tpl-name">{{ t.name }}</span>
                <span class="dbm-history-sql">{{ t.sql }}</span>
                <ReIcon name="Delete" size="14" class="dbm-tpl-del" @click.stop="removeSqlTemplate(t.name)" />
              </div>
              <ReEmpty v-if="sqlTemplates.length === 0" description="还没有保存的模板" />
            </div>
          </div>
        </div>

        <!-- ER 图页签：三栏 Inspector（左表清单 · 中画布 · 右检查器） -->
        <ErWorkspace
          v-if="activeTabObj && activeTabObj.type === 'er'"
          class="dbm-er-workspace"
          :tables="erTables"
          :relations="erRelations"
          :cols="erTableCols"
          :loading="erLoading"
          :error="erError"
          :qualified="qualifiedEr"
          :filter="erTableFilter"
          :layout="erLayout"
          :show-labels="erShowLabels"
          :layout-choices="ER_LAYOUT_CHOICES"
          @update:filter="erTableFilter = $event"
          @update:layout="erLayout = $event"
          @update:show-labels="erShowLabels = $event"
          @reload="loadErDiagram"
          @export="exportErDot"
          @ensure-cols="ensureErCols"
          @open-cols="openErColumns"
        />

        <!-- 右键「ER 图」弹框：筛选 + 按钮一行，图工具栏全部方形图标按钮，无底部删除 -->
        <ReDialog
          v-model="erExportDialogVisible"
          title="ER 图（表关系）"
          width="92%"
          top="6vh"
          class="dbm-er-dialog"
        >
          <ErWorkspace
            class="dbm-er-workspace dbm-er-workspace--dialog"
            compact
            :tables="erTables"
            :relations="erRelations"
            :cols="erTableCols"
            :loading="erLoading"
            :error="erError"
            :qualified="qualifiedEr"
            :filter="erTableFilter"
            :layout="erLayout"
            :show-labels="erShowLabels"
            :layout-choices="ER_LAYOUT_CHOICES"
            @update:filter="erTableFilter = $event"
            @update:layout="erLayout = $event"
            @update:show-labels="erShowLabels = $event"
            @reload="loadErDiagram"
            @export="exportErDot"
            @ensure-cols="ensureErCols"
            @open-cols="openErColumns"
          />
          <template #footer>
            <ReButton type="primary" icon="Download" :show-text="true" @click="exportErDot">导出 DOT</ReButton>
          </template>
        </ReDialog>

        <!-- 双击节点后的列清单（页签与弹框两个 ER 视图共用；必须挂在这两个视图之外，
             否则右键 ER 弹框打开时页签分支未挂载，列清单弹窗永远弹不出来） -->
        <ReDialog v-model="erColumnsVisible" :title="`${erPickedTable} 的列`" width="520px">
          <div class="dbm-er-cols">
            <div
              v-for="c in erPickedColumns"
              :key="c.name"
              class="dbm-er-col-row"
            >
              <span class="dbm-er-col-name">{{ c.name }}</span>
              <span class="dbm-er-col-type">{{ c.type }}</span>
              <span class="dbm-er-col-flags">
                <span v-if="c.isPrimaryKey" class="dbm-er-flag pk">PK</span>
                <span v-if="c.nullable" class="dbm-er-flag null">可空</span>
              </span>
            </div>
            <ReEmpty v-if="erPickedColumns.length === 0" description="没有列信息" />
          </div>
          <template #footer>
            <ReButton
              type="primary"
              @click="openErTableData(erPickedTable)"
            >打开该表数据</ReButton>
          </template>
        </ReDialog>

        <!-- 对象定义页签（存储过程 / 函数 / 触发器 / 事件） -->
    <div v-if="activeTabObj && activeTabObj.type === 'object'" class="dbm-object-view">
      <div class="dbm-object-toolbar">
        <span class="dbm-table-name">
          {{ objectTabTitle }}
        </span>
        <span class="dbm-hint">整段 DDL 直接交给数据库执行，保存即生效</span>
        <span class="dbm-spacer" />
        <ReButton
          v-if="activeTabObj.objectName"
          layout="square"
          type="danger"
          plain
          icon="Delete"
          tip="删除该对象"
          @click="deleteCurrentObject"
        />
        <ReButton
          layout="square"
          type="primary"
          icon="Check"
          tip="保存定义"
          :loading="objectSaving"
          @click="saveObjectDefinition"
        />
      </div>
      <div v-if="objectLoading" class="dbm-import-preview-hint">正在读取定义…</div>
      <ReInput
        v-else
        v-model="objectDefinition"
        type="textarea"
        class="dbm-mono dbm-object-editor"
        :rows="26"
        placeholder="CREATE PROCEDURE / FUNCTION / TRIGGER / EVENT …"
      />
    </div>

    <!-- 空状态 -->
        <div
          v-if="activeTabObj && activeTabObj.type === 'users'"
          class="dbm-users-view"
        >
          <DbUserManagePanel :datasource-id="currentDatasourceId" data-testid="dbm-users-panel" />
        </div>
        <div v-else-if="tabs.length === 0" class="dbm-empty">
          <ReIcon name="Grid" size="64" class="dbm-empty-icon" />
          <p class="dbm-empty-text">从左侧选择表查看数据，或点击"新建查询"执行 SQL</p>
        </div>
      </div>
    </div>

    <!-- 表头右键菜单（对齐 Navicat 的表头菜单，砍掉复制/粘贴那组：那是单元格的活儿，
         表头上复制整列值没有明确语义）。外观与树菜单同一套 .dbm-context-* 皮。 -->
    <Teleport to="body">
      <div
        v-if="headerMenu.visible"
        class="dbm-context-menu dbm-hmenu"
        :style="headerMenuStyle"
        @click.stop
        @contextmenu.prevent
      >
        <div class="dbm-context-item" @click="openColumnViewFromHeaderMenu">
          <ReIcon name="Operation" :size="14" />显示或隐藏列…
        </div>
        <div class="dbm-context-item" @click="openColumnViewFromHeaderMenu">
          <ReIcon name="Paperclip" :size="14" />冻结列…
          <span class="dbm-context-hint">固定在左侧</span>
        </div>
        <div class="dbm-context-divider" />
        <div class="dbm-context-group">表头显示</div>
        <div
          v-for="m in HEADER_MODES"
          :key="'hm-' + m.value"
          class="dbm-context-item"
          :class="{ 'is-checked': headerMode === m.value }"
          @click="setHeaderModeFromMenu(m.value)"
        >
          <span class="dbm-context-check">{{ headerMode === m.value ? "✓" : "" }}</span>{{ m.label }}
        </div>
        <div class="dbm-context-divider" />
        <div class="dbm-context-group">行显示</div>
        <div
          v-for="m in ROW_MODES"
          :key="'rm-' + m.value"
          class="dbm-context-item"
          :class="{ 'is-checked': rowMode === m.value }"
          @click="setRowModeFromMenu(m.value)"
        >
          <span class="dbm-context-check">{{ rowMode === m.value ? "✓" : "" }}</span>{{ m.label }}
        </div>
      </div>
    </Teleport>

    <!-- 右键菜单（对齐 Navicat：表 / 库 / 空白 三套动作） -->
    <Teleport to="body">
      <div
        v-if="contextMenu.visible"
        class="dbm-context-menu"
        :style="contextMenuStyle"
        @click.stop="closeContextMenu"
      >
        <!-- 表节点 -->
        <template v-if="contextMenu.tableName">
          <div class="dbm-context-item" @click="openTableData(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Grid" :size="14" />打开表
          </div>
          <div class="dbm-context-item" @click="openTableDesign(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Edit" :size="14" />设计表
          </div>
          <div class="dbm-context-item" @click="openQueryWithSql(`SELECT * FROM \`${contextMenu.tableName}\` LIMIT 100`, contextMenu.database)">
            <ReIcon name="EditPen" :size="14" />查询数据
          </div>
          <div class="dbm-context-item" @click="showTableDdl(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Document" :size="14" />查看建表语句
          </div>
          <div class="dbm-context-divider" />
          <!-- 视图实测（MariaDB，jdbc_acc）：RENAME TABLE 对视图**是成功的**，
               所以这项照常露出；唯独「复制表」三条候选（CREATE TABLE LIKE / AS SELECT / SELECT INTO）
               在视图上全部被内核拒绝，才对视图收起 -->
          <div class="dbm-context-item" @click="renameTable(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="EditPen" :size="14" />重命名表
          </div>
          <div v-if="!contextMenu.isView" class="dbm-context-item" @click="duplicateTable(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="CopyDocument" :size="14" />复制表
          </div>
          <div class="dbm-context-item" @click="copyText(contextMenu.tableName)">
            <ReIcon name="CopyDocument" :size="14" />复制表名
          </div>
          <div class="dbm-context-divider" />
          <!-- 导入数据对视图也保留：简单视图是可更新的（实测 INSERT 成功） -->
          <div class="dbm-context-item" @click="openImportDataFor(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Upload" :size="14" />导入数据
          </div>
          <div class="dbm-context-item" @click="openExportDialog(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Download" :size="14" />导出数据
          </div>
          <div class="dbm-context-item" @click="refreshTableInTree(contextMenu.database)">
            <ReIcon name="Refresh" :size="14" />刷新
          </div>
          <div class="dbm-context-divider" />
          <!-- 实测：TRUNCATE 对视图必败（'x' doesn't exist），DROP TABLE 同理 -->
          <div v-if="!contextMenu.isView" class="dbm-context-item dbm-danger" @click="confirmTruncate(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Delete" :size="14" />清空表
          </div>
          <div v-if="contextMenu.isView" class="dbm-context-item dbm-danger" @click="deleteView(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Delete" :size="14" />删除视图
          </div>
          <div v-else class="dbm-context-item dbm-danger" @click="deleteTable(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Delete" :size="14" />删除表
          </div>
        </template>

        <!-- 库节点 -->
        <template v-else-if="contextMenu.database">
          <div class="dbm-context-item" @click="openCreateTable(contextMenu.database)">
            <ReIcon name="Plus" :size="14" />新建表
          </div>
          <div class="dbm-context-item" @click="openImportDataForDb(contextMenu.database)">
            <ReIcon name="Upload" :size="14" />导入数据到本库
          </div>
          <div class="dbm-context-item" @click="openQueryWithSql('', contextMenu.database)">
            <ReIcon name="EditPen" :size="14" />新建查询
          </div>
          <div class="dbm-context-item" @click="openDocumentPreview(contextMenu.database)">
            <ReIcon name="View" :size="14" />查看文档
          </div>
          <div class="dbm-context-item" @click="openErExportDialog(contextMenu.database)">
            <ReIcon name="Share" :size="14" />ER 图（表关系）
          </div>
          <div class="dbm-context-item" @click="openStructureSync(contextMenu.database)">
            <ReIcon name="Sort" :size="14" />结构同步（与目标库比较）
          </div>
          <div class="dbm-context-item" @click="openDocumentExport(contextMenu.database)">
            <ReIcon name="Document" :size="14" />导出数据库文档
          </div>
          <div class="dbm-context-item" @click="openCreateUser(contextMenu.database)">
            <ReIcon name="User" :size="14" />添加用户
          </div>
          <!-- 用户管理入口始终显示：JDBC 控制台总是有这个页签，非 MySQL/MariaDB
               内核由 DbUserManagePanel 的 supported=false 降级提示，避免入口时有时无。 -->
          <div class="dbm-context-item" @click="openUsersTab()">
            <ReIcon name="UserFilled" :size="14" />用户管理
          </div>
          <div class="dbm-context-item" @click="copyText(contextMenu.database)">
            <ReIcon name="CopyDocument" :size="14" />复制库名
          </div>
          <div class="dbm-context-divider" />
          <div class="dbm-context-item" @click="loadTables(contextMenu.database)">
            <ReIcon name="Refresh" :size="14" />刷新
          </div>
          <div class="dbm-context-divider" />
          <div class="dbm-context-item dbm-danger" @click="deleteDatabase(contextMenu.database)">
            <ReIcon name="Delete" :size="14" />删除数据库
          </div>
        </template>

        <!-- 数据源根节点：整条连接的文档 / 新建 / 刷新。文档查看复用与主页
             （数据源中心右键「查看数据库文档」）同一管线 —— 数据源级，不带库名。 -->
        <template v-else-if="contextMenu.root">
          <div class="dbm-context-item" @click="openDatasourceDocument">
            <ReIcon name="View" :size="14" />查看数据库文档
          </div>
          <div class="dbm-context-item" @click="openCreateDatabase">
            <ReIcon name="FolderAdd" :size="14" />新建数据库
          </div>
          <div class="dbm-context-item" @click="openCreateTable()">
            <ReIcon name="Plus" :size="14" />新建表
          </div>
          <div class="dbm-context-item" @click="openNewQuery">
            <ReIcon name="EditPen" :size="14" />新建查询
          </div>
          <div class="dbm-context-item" @click="openImportDataFromToolbar">
            <ReIcon name="Upload" :size="14" />导入数据
          </div>
          <div class="dbm-context-divider" />
          <div class="dbm-context-item" @click="refreshTree">
            <ReIcon name="Refresh" :size="14" />刷新
          </div>
        </template>

        <!-- 页签右键：关闭当前 / 关闭其他 / 关闭全部 -->
        <template v-else-if="contextMenu.tabId">
          <div class="dbm-context-item" @click="closeTab(contextMenu.tabId)">
            <ReIcon name="Close" :size="14" />关闭当前
          </div>
          <div class="dbm-context-item" @click="closeOtherTabs(contextMenu.tabId)">
            <ReIcon name="CircleClose" :size="14" />关闭其他
          </div>
          <div class="dbm-context-divider" />
          <div class="dbm-context-item dbm-danger" @click="closeAllTabs()">
            <ReIcon name="Delete" :size="14" />关闭全部
          </div>
        </template>

        <!-- 空白区域 -->
        <template v-else>
          <div class="dbm-context-item" @click="openCreateDatabase">
            <ReIcon name="FolderAdd" :size="14" />新建数据库
          </div>
          <div class="dbm-context-item" @click="openCreateTable()">
            <ReIcon name="Plus" :size="14" />新建表
          </div>
          <div class="dbm-context-item" @click="openNewQuery">
            <ReIcon name="EditPen" :size="14" />新建查询
          </div>
          <div class="dbm-context-item" @click="openImportDataFromToolbar">
            <ReIcon name="Upload" :size="14" />导入数据
          </div>
          <div class="dbm-context-divider" />
          <div class="dbm-context-item" @click="refreshTree">
            <ReIcon name="Refresh" :size="14" />刷新
          </div>
        </template>
      </div>
    </Teleport>

    <!-- 结构同步（Navicat 复刻：选择源/目标 → 比较 → 差异 → 部署执行，SSE 实时日志） -->
    <ReDialog
      v-model="syncVisible"
      title="结构同步"
      width="980px"
      top="6vh"
      class="dbm-sync-dialog"
      :close-on-click-modal="false"
      :show-close="!syncComparing"
    >
      <div class="dbm-sync">
        <!-- ========== 顶部方向条（图 1 / 3 / 4 / 5 均保留）：源 连接.库 → 目标 连接.库 ========== -->
        <div class="dbm-sync-direction">
          <span class="dbm-sync-direction-side dbm-sync-direction-side--src">
            <span class="dbm-sync-db-icon dbm-sync-db-icon--src" />
            <span class="dbm-sync-conn">{{ syncOverviewSrc }}</span>
          </span>
          <ReIcon name="Right" :size="18" class="dbm-sync-direction-arrow" />
          <span class="dbm-sync-direction-side dbm-sync-direction-side--dst">
            <span class="dbm-sync-conn">{{ syncOverviewDst }}</span>
            <span class="dbm-sync-db-icon dbm-sync-db-icon--dst" />
          </span>
        </div>

        <!-- 中间内容区：唯一可滚动区域（底部操作条不参与滚动，永远贴底可见）。
             这里必须有 overflow:auto —— 否则矮视口下内容比弹窗 body 高，
             .el-dialog__body 的 overflow:hidden 会把底部操作条整条裁掉。 -->
        <div class="dbm-sync-body">

        <!-- ========== 视图一：选择源 / 目标（图 1） ========== -->
        <template v-if="syncView === 'select' || syncView === 'compare'">
          <div class="dbm-sync-panes">
            <!-- 源面板 -->
            <div class="dbm-sync-pane dbm-sync-pane--src">
              <div class="dbm-sync-pane-title">源</div>
              <div class="dbm-sync-field">
                <span class="dbm-sync-field-label">连接</span>
                <ReSelect
                  v-model="syncSrcDs"
                  placeholder="选择数据源（连接）"
                  class="dbm-sync-ds-select"
                  @change="onSyncSrcDsChange"
                >
                  <ReOption v-for="ds in syncDsOptions" :key="'ss' + ds.id" :label="dsLabel(ds)" :value="ds.id" />
                </ReSelect>
              </div>
              <div class="dbm-sync-field">
                <span class="dbm-sync-field-label">数据库</span>
                <ReSelect
                  v-model="syncSrcDb"
                  placeholder="选择数据库"
                  class="dbm-sync-db-select"
                  :disabled="!syncSrcDbs.length"
                  @change="onSyncSrcDbChange"
                >
                  <ReOption v-for="db in syncSrcDbs" :key="'sb' + db" :label="dbLabel(db)" :value="db" />
                </ReSelect>
              </div>
              <div class="dbm-sync-info">
                <div v-for="f in syncSrcInfo" :key="f.k" class="dbm-sync-info-row">
                  <span class="dbm-sync-info-k">{{ f.k }}</span>
                  <span class="dbm-sync-info-v">{{ f.v }}</span>
                </div>
              </div>
            </div>

            <!-- 双向切换：源/目标左右并排，所以用**水平**双向箭头（ep `Switch` ⇄）。
                 之前用的 `Sort` 是竖向双箭头（↑↓），在左右布局里读起来像「排序」而不是「互换」。 -->
            <div class="dbm-sync-swap">
              <ReButton layout="square" icon="Switch" tip="交换源与目标" @click="swapSyncSides" />
            </div>

            <!-- 目标面板 -->
            <div class="dbm-sync-pane dbm-sync-pane--dst">
              <div class="dbm-sync-pane-title">目标</div>
              <div class="dbm-sync-field">
                <span class="dbm-sync-field-label">连接</span>
                <ReSelect
                  v-model="syncDstDs"
                  placeholder="选择数据源（连接）"
                  class="dbm-sync-ds-select"
                  @change="onSyncDstDsChange"
                >
                  <ReOption v-for="ds in syncDsOptions" :key="'sd' + ds.id" :label="dsLabel(ds)" :value="ds.id" />
                </ReSelect>
              </div>
              <div class="dbm-sync-field">
                <span class="dbm-sync-field-label">数据库</span>
                <ReSelect
                  v-model="syncDstDb"
                  placeholder="选择数据库"
                  class="dbm-sync-db-select"
                  :disabled="!syncDstDbs.length"
                  @change="onSyncDstDbChange"
                >
                  <ReOption v-for="db in syncDstDbs" :key="'tb' + db" :label="dbLabel(db)" :value="db" />
                </ReSelect>
              </div>
              <div class="dbm-sync-info">
                <div v-for="f in syncDstInfo" :key="f.k" class="dbm-sync-info-row">
                  <span class="dbm-sync-info-k">{{ f.k }}</span>
                  <span class="dbm-sync-info-v">{{ f.v }}</span>
                </div>
              </div>
            </div>
          </div>

          <ReInput
            v-model="syncTableFilter"
            class="dbm-mono dbm-sync-filter"
            placeholder="只比较匹配的表（支持 % 与 _，留空为全部）"
            clearable
          />
          <ReEmpty v-if="syncDiffError" :description="syncDiffError" />
        </template>

        <!-- ========== 视图三：差异（图 3：源对象 / 操作 / 目标对象 三列，按操作分组折叠） ========== -->
        <template v-else-if="syncView === 'diff'">
          <div class="dbm-sync-groups">
            <div
              v-for="g in syncGroups"
              :key="g.key"
              class="dbm-sync-group"
              :class="g.key"
            >
              <div class="dbm-sync-group-head" @click="syncGroupOpen[g.key] = !syncGroupOpen[g.key]">
                <ReIcon :name="syncGroupOpen[g.key] ? 'ArrowDown' : 'ArrowRight'" :size="14" class="dbm-sync-group-caret" />
                <span class="dbm-sync-group-name">{{ g.name }}</span>
                <span class="dbm-sync-group-selected">已选择 {{ g.checkedCount }} 个（共 {{ g.items.length }} 个）</span>
                <span class="dbm-sync-group-actions" @click.stop>
                  <ReButton size="small" text @click="setGroupChecked(g.key, true)">全选</ReButton>
                  <ReButton size="small" text @click="setGroupChecked(g.key, false)">全不选</ReButton>
                  <ReButton size="small" text @click="invertGroupChecked(g.key)">反选</ReButton>
                </span>
              </div>
              <div v-if="syncGroupOpen[g.key]" class="dbm-sync-group-items">
                <div class="dbm-sync-grid-row dbm-sync-grid-row--head">
                  <span class="dbm-sync-grid-src">源对象</span>
                  <span class="dbm-sync-grid-op">操作</span>
                  <span class="dbm-sync-grid-dst">目标对象</span>
                </div>
                <div
                  v-for="(d, i) in g.items"
                  :key="g.key + i"
                  class="dbm-sync-grid-row"
                  :class="{ 'dbm-sync-grid-row--checked': d.checked }"
                >
                  <span class="dbm-sync-grid-src">
                    <input
                      v-model="d.checked"
                      type="checkbox"
                      class="dbm-sync-diff-check"
                      :aria-label="`勾选 ${d.object}`"
                    >
                    <span class="dbm-sync-diff-obj">{{ syncGridObj(d) }}</span>
                  </span>
                  <span class="dbm-sync-grid-op">
                    <span class="dbm-sync-diff-op" :class="syncOpClass(d)">
                      {{ syncOpIcon(d) }} {{ syncOpVerb(d) }}
                    </span>
                  </span>
                  <span class="dbm-sync-grid-dst">
                    <span class="dbm-sync-diff-obj">{{ syncGridObj(d) }}</span>
                    <span class="dbm-sync-diff-detail">{{ d.detail }}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ========== 视图四：部署执行（图 4：部署脚本 tab；图 5：消息日志 tab + 进度统计） ========== -->
        <template v-else>
          <div class="dbm-sync-tabs">
            <div
              class="dbm-sync-tab"
              :class="{ active: syncDeployTab === 'script' }"
              @click="switchSyncDeployTab('script')"
            >
              部署脚本
            </div>
            <div
              class="dbm-sync-tab"
              :class="{ active: syncDeployTab === 'log' }"
              @click="switchSyncDeployTab('log')"
            >
              消息日志
            </div>
          </div>

          <!-- 部署脚本 tab：可编辑脚本区，SQL 语法高亮（图 4） -->
          <div v-if="syncDeployTab === 'script'" class="dbm-sync-script-panel">
            <div class="dbm-sync-script-head">
              <span>部署脚本</span>
              <span class="dbm-spacer" />
              <ReButton size="small" plain icon="DocumentCopy" @click="copyText(syncDeployScript)">复制</ReButton>
            </div>
            <div class="dbm-sync-sql-editor">
              <!-- 下层：语法高亮预览（随上层 textarea 滚动同步） -->
              <pre
                ref="syncSqlHlEl"
                class="dbm-sync-sql-hl"
                aria-hidden="true"
              ><code v-html="sqlHighlight(syncDeployScript)"></code></pre>
              <!-- 上层：透明文字 textarea，负责编辑/滚动/选择（文字色透明、光标可见） -->
              <textarea
                v-model="syncDeployScript"
                class="dbm-sync-sql-input"
                spellcheck="false"
                wrap="off"
                @input="syncSqlScroll"
                @scroll="syncSqlScroll"
              />
            </div>
          </div>

          <!-- 消息日志 tab：进度统计 + SSE 逐条日志（图 5） -->
          <div v-else class="dbm-sync-log-panel">
            <div class="dbm-sync-run-stats">
              <span>进度：{{ syncRunDone ? syncRunTotal : syncRunOk + syncRunFail }}</span>
              <span>成功：{{ syncRunOk }}</span>
              <span>错误：{{ syncRunFail }}</span>
              <span>时间：{{ ((syncRunElapsed || 0) / 1000).toFixed(1) }}s</span>
            </div>
            <div ref="syncLogEl" class="dbm-sync-log">
              <div
                v-for="(line, i) in syncLog"
                :key="i"
                class="dbm-sync-log-line"
                :class="line.ok === undefined ? '' : line.ok ? 'dbm-sync-log-line--ok' : 'dbm-sync-log-line--fail'"
              >
                <template v-if="line.ok === undefined">
                  <span class="dbm-sync-log-no">{{ line.no }}</span>
                  <span class="dbm-sync-log-sql">{{ line.sql }}</span>
                  <span class="dbm-sync-log-msg">{{ line.msg }}</span>
                </template>
                <template v-else>
                  <span class="dbm-sync-log-no">{{ line.no }}</span>
                  <span class="dbm-sync-log-flag">{{ line.ok ? "✓" : "✗" }}</span>
                  <span class="dbm-sync-log-sql">{{ line.sql }}</span>
                  <span v-if="line.affected !== undefined" class="dbm-sync-log-msg">影响 {{ line.affected }} 行</span>
                  <span v-if="line.error" class="dbm-sync-log-msg">{{ line.error }}</span>
                </template>
              </div>
            </div>
          </div>
        </template>

        </div><!-- /.dbm-sync-body 中间内容区结束 -->

        <!-- ========== 底部导航（图 1：保存/加载/选项 + 比较；图 3：上一步/重新比较/下一步；图 4/5：开始） ========== -->
        <div class="dbm-sync-foot">
          <template v-if="syncView === 'select' || syncView === 'diff' || syncView === 'deploy'">
            <ReButton size="small" plain icon="Download" @click="saveSyncProfile">保存配置文件</ReButton>
            <ReButton size="small" plain icon="Upload" @click="loadSyncProfile">加载配置文件</ReButton>
            <ReButton size="small" plain icon="Setting" @click="syncOptVisible = true">部署选项</ReButton>
            <span class="dbm-spacer" />
          </template>
          <template v-if="syncView === 'select'">
            <ReButton
              size="small"
              type="primary"
              icon="Search"
              :loading="syncLoading"
              :disabled="!canCompare"
              @click="runStructureDiff"
            >
              比较
            </ReButton>
          </template>
          <template v-else-if="syncView === 'diff'">
            <ReButton size="small" plain @click="syncView = 'select'">上一步</ReButton>
            <ReButton size="small" plain icon="Refresh" @click="runStructureDiff">重新比较</ReButton>
            <ReButton
              size="small"
              type="primary"
              :disabled="!syncDeployScript.trim()"
              @click="goDeploy"
            >
              下一步
            </ReButton>
          </template>
          <template v-else-if="syncView === 'deploy'">
            <ReButton size="small" plain :disabled="syncRunning" @click="backFromDeploy">上一步</ReButton>
            <ReButton
              size="small"
              plain
              icon="Refresh"
              :disabled="syncRunning"
              @click="recompareFromDeploy"
            >
              重新比较
            </ReButton>
            <ReButton
              v-if="!syncRunDone"
              size="small"
              type="primary"
              icon="VideoPlay"
              :loading="syncRunning"
              :disabled="!syncDeployScript.trim() && !syncRunning"
              @click="syncRunning ? stopSyncRun() : runStructureSync()"
            >
              {{ syncRunning ? "停止" : "开始" }}
            </ReButton>
            <ReButton v-else size="small" type="primary" @click="closeSync">完成</ReButton>
          </template>
        </div>

        <!-- ========== 视图二：比较中（图 2：居中遮罩弹窗，背后面板保留） ==========
             必须挂在 .dbm-sync 直属层（不在 .dbm-sync-body 里，否则会被滚动区裁切），
             且**不能**插在 select / diff / deploy 三段之间：那会打断 v-if → v-else-if 链，
             让差异页在「选择」步骤里也跟着渲染。 -->
        <div v-if="syncView === 'compare'" class="dbm-sync-compare-mask">
          <div class="dbm-sync-compare">
            <ReIcon name="Refresh" :size="36" class="dbm-sync-compare-spin" />
            <div class="dbm-sync-compare-title">正在比较数据库…</div>
            <div class="dbm-sync-compare-sub">{{ syncComparePhase }}</div>
            <div class="dbm-sync-compare-track">
              <div class="dbm-sync-compare-bar" :style="{ width: syncComparePct + '%' }" />
            </div>
            <ReButton plain size="small" @click="cancelSyncCompare">取消</ReButton>
          </div>
        </div>
      </div>

      <!-- 选项弹窗 -->
      <ReDialog v-model="syncOptVisible" title="选项" width="420px" append-to-body>
        <div class="dbm-sync-opt">
          <label class="dbm-sync-opt-row">
            <input v-model="syncOptStopOnError" type="checkbox" class="dbm-sync-opt-check">
            执行时遇错即停
          </label>
          <label class="dbm-sync-opt-row">
            <input v-model="syncOptIncludeExtra" type="checkbox" class="dbm-sync-opt-check">
            包含「目标多出的对象」的删除语句（DROP）
          </label>
        </div>
        <template #footer>
          <ReButton @click="syncOptVisible = false">关闭</ReButton>
        </template>
      </ReDialog>
    </ReDialog>

    <!-- 导出数据库文档（表结构 / 主键 / 外键，渲染走后端既有的 DocumentProvider SPI） -->
    <ReDialog v-model="docExportVisible" title="导出数据库文档" width="520px">
      <div class="dbm-doc-export">
        <div class="dbm-doc-row">
          <span class="dbm-doc-label">目标库</span>
          <span class="dbm-doc-value">{{ docExportDatabase }}</span>
        </div>
        <div class="dbm-doc-row">
          <span class="dbm-doc-label">文档格式</span>
          <select v-model="docExportFormat" class="dbm-doc-select">
            <option v-for="f in docExportFormats" :key="f.format" :value="f.format">
              {{ DOC_FORMAT_LABELS[f.format] ?? f.format }}
            </option>
          </select>
        </div>
        <div class="dbm-doc-row">
          <span class="dbm-doc-label">模板样式</span>
          <select v-model="docExportTemplate" class="dbm-doc-select">
            <option v-for="t in docExportTemplates" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>
        <p class="dbm-doc-hint">
          导出内容为本库全部表与视图的字段、类型、主键与外键（不含数据行）。
          <br />
          格式由服务端已装配的渲染器决定；PDF 还需要服务端装有 wkhtmltopdf，否则会明确报错而不是给你一个空文件。
        </p>
        <p v-if="docExportFormatsError" class="dbm-doc-error">{{ docExportFormatsError }}</p>
      </div>
      <template #footer>
        <ReButton @click="docExportVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="docExportLoading" :disabled="!docExportFormats.length" @click="doDocumentExport">
          导出
        </ReButton>
      </template>
    </ReDialog>

    <!-- 在线查看数据库文档（右键「查看文档」/ 根节点「查看数据库文档」：markdown → HTML 弹窗预览） -->
    <ReDialog
      v-model="docPreviewVisible"
      :title="docPreviewDatabase ? `${docPreviewDatabase} · 数据库文档` : `${currentDatasourceName || '数据源'} · 数据库文档`"
      width="85%"
      top="6vh"
      class="dbm-doc-preview-dialog"
    >
      <div v-if="docPreviewLoading" class="dbm-doc-preview-loading">正在渲染文档…</div>
      <div v-else-if="docPreviewError" class="dbm-doc-preview-error">
        <p>预览失败：{{ docPreviewError }}</p>
        <ReButton type="primary" @click="doDocumentExport">改为下载文档</ReButton>
      </div>
      <iframe
        v-else-if="docPreviewContent"
        :srcdoc="docPreviewContent"
        class="dbm-doc-preview-iframe"
        sandbox="allow-same-origin"
        title="数据库文档预览"
      />
    </ReDialog>

    <!-- 列显示设置（Navicat 的字段显示 / 固定列） -->
    <ReDialog v-model="columnViewDialogVisible" title="列显示设置" width="440px">
      <div class="dbm-colset">
        <div class="dbm-colset-head">
          <span class="dbm-colset-hint">
            勾选 = 显示，📌 = 固定在左侧。偏好按「库.表」保存，只影响这张表。
          </span>
          <span class="dbm-spacer" />
          <ReButton size="small" @click="setAllColumnsVisible">全部显示</ReButton>
        </div>
        <div class="dbm-colset-list">
          <label
            v-for="c in columnViewDraft"
            :key="c.name"
            class="dbm-colset-row"
            :class="{ hidden: !c.visible }"
          >
            <input
              v-model="c.visible"
              type="checkbox"
              class="dbm-colset-check"
              :aria-label="`显示列 ${c.name}`"
            >
            <span class="dbm-colset-name">{{ headerLabel(c.name) }}</span>
            <span class="dbm-spacer" />
            <button
              type="button"
              class="dbm-colset-pin"
              :class="{ on: c.pinned && c.visible }"
              :disabled="!c.visible"
              :aria-label="`${c.pinned && c.visible ? '取消固定' : '固定'}列 ${c.name}`"
              :title="c.pinned && c.visible ? '取消固定' : '固定在左侧'"
              @click.prevent="c.pinned = !c.pinned"
            >📌</button>
          </label>
        </div>
      </div>
      <template #footer>
        <ReButton type="danger" plain @click="resetColumnViewSettings">恢复默认</ReButton>
        <ReButton @click="columnViewDialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="applyColumnViewSettings">应用</ReButton>
      </template>
    </ReDialog>

    <!-- BLOB / 二进制 / 长文本查看器（Navicat 的 Blob Viewer） -->
    <ReDialog v-model="blobVisible" :title="blobTitle" width="760px">
      <div class="dbm-blob">
        <div class="dbm-blob-head">
          <span class="dbm-blob-meta">{{ blobMeta }}</span>
          <span class="dbm-spacer" />
          <ReButton
            layout="square"
            icon="DocumentCopy"
            tip="复制为 base64"
            @click="copyText(blobBase64)"
          />
          <ReButton
            v-if="blobImageSrc"
            layout="square"
            icon="Download"
            tip="下载原始文件"
            @click="downloadBlob"
          />
        </div>
        <div class="dbm-blob-tabs">
          <button
            v-for="m in blobModes"
            :key="m"
            type="button"
            class="dbm-blob-tab"
            :class="{ active: blobMode === m }"
            @click="blobMode = m"
          >{{ BLOB_MODE_LABELS[m] }}</button>
          <span class="dbm-spacer" />
          <label class="dbm-switch">
            <ReSwitch v-model="blobEditing" aria-label="编辑二进制内容" />
            <span>编辑</span>
          </label>
        </div>
        <!-- 图片视图 -->
        <div v-if="blobMode === 'image'" class="dbm-blob-image">
          <img v-if="blobImageSrc" :src="blobImageSrc" alt="二进制内容预览" />
          <ReEmpty v-else description="不是可识别的图片格式" />
        </div>
        <!-- 文本视图（可编辑） -->
        <ReInput
          v-else-if="blobMode === 'text'"
          v-model="blobText"
          type="textarea"
          :rows="16"
          class="dbm-mono dbm-blob-text"
          :readonly="!blobEditing"
        />
        <!-- HEX 视图（只读：手改 hex 的收益远低于出错风险） -->
        <pre v-else class="dbm-blob-hex">{{ blobHex }}</pre>
      </div>
      <template #footer>
        <ReButton
          v-if="blobEditing"
          type="primary"
          :loading="blobSaving"
          @click="saveBlob"
        >保存</ReButton>
      </template>
    </ReDialog>

    <!-- 高级筛选弹窗（Navicat 式：列 + 运算符 + 值，多条按 AND 组合） -->
    <ReDialog v-model="filterDialogVisible" title="高级筛选" width="720px">
      <div class="dbm-filter-list">
        <div
          v-for="(row, i) in filterDraft"
          :key="i"
          class="dbm-filter-row"
          :data-filter-row="i"
        >
          <ReSelect
            v-model="row.column"
            placeholder="列"
            style="width: 190px"
            filterable
          >
            <ReOption
              v-for="c in filterColumns"
              :key="c.name"
              :label="columnOptionLabel(c)"
              :value="c.name"
            />
          </ReSelect>
          <ReSelect
            v-model="row.op"
            placeholder="运算符"
            style="width: 140px"
          >
            <ReOption v-for="o in DB_FILTER_OPS" :key="o" :label="o" :value="o" />
          </ReSelect>
          <template v-if="dbFilterTakesNoValue(row.op)">
            <span class="dbm-filter-novalue">该运算符不需要值</span>
          </template>
          <template v-else>
            <ReInput
              v-model="row.value"
              :placeholder="dbFilterTakesMultipleValues(row.op) ? '多个值用逗号分隔' : '值'"
              class="dbm-mono"
            />
            <ReInput
              v-if="dbFilterNeedsValue2(row.op)"
              v-model="row.value2"
              placeholder="上界"
              class="dbm-mono"
            />
          </template>
          <ReButton
            layout="square"
            type="danger"
            plain
            icon="Delete"
            tip="删除这一条条件"
            @click="filterDraft.splice(i, 1)"
          />
        </div>
        <ReEmpty v-if="filterDraft.length === 0" description="还没有条件，点「添加条件」开始" />
      </div>
      <template #footer>
        <ReButton
          icon="Plus"
          :show-text="true"
          @click="filterDraft.push({ column: '', op: '=', value: '', value2: '' })"
        >添加条件</ReButton>
        <ReButton @click="filterDialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="applyAdvancedFilter">应用筛选</ReButton>
      </template>
    </ReDialog>

    <!-- 新建表弹窗：设计表网格（列 → 结构化入参），SQL 拼装在方言层，前端不拼 MySQL-only 语句 -->
    <CreateTableDialog
      v-model="createTableVisible"
      :database="newTableDatabase"
      :datasource-id="currentDatasourceId"
      @created="(db: string) => loadTables(db)"
    />

    <!-- 新建数据库弹窗 -->
    <ReDialog v-model="createDbVisible" title="新建数据库" width="480px">
      <div class="dbm-create-form">
        <div class="dbm-form-item">
          <label>数据库名</label>
          <ReInput v-model="newDbName" placeholder="请输入数据库名" />
        </div>
        <div class="dbm-form-item">
          <label>字符集</label>
          <ReSelect v-model="newDbCharset" style="width: 100%">
            <ReOption label="utf8mb4" value="utf8mb4" />
            <ReOption label="utf8" value="utf8" />
            <ReOption label="gbk" value="gbk" />
            <ReOption label="latin1" value="latin1" />
          </ReSelect>
        </div>
        <div class="dbm-form-item">
          <label>排序规则</label>
          <ReInput v-model="newDbCollation" placeholder="如 utf8mb4_general_ci" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="createDbVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="creatingDb" @click="createDatabase">创建</ReButton>
      </template>
    </ReDialog>

    <!-- 添加用户弹窗 -->
    <ReDialog v-model="createUserVisible" title="添加用户" width="520px">
      <div class="dbm-create-form">
        <div class="dbm-form-item">
          <label>用户名</label>
          <ReInput v-model="userForm.username" placeholder="请输入用户名" data-testid="dbm-user-username" />
        </div>
        <div class="dbm-form-item">
          <label>主机</label>
          <ReInput v-model="userForm.host" placeholder="如 localhost / %" data-testid="dbm-user-host" />
        </div>
        <div class="dbm-form-item">
          <label>密码</label>
          <ReInput v-model="userForm.password" type="password" show-password placeholder="请输入密码" data-testid="dbm-user-password" />
        </div>
        <div class="dbm-form-item">
          <label>确认密码</label>
          <ReInput v-model="userForm.confirmPassword" type="password" show-password placeholder="请再次输入密码" data-testid="dbm-user-confirm" />
        </div>
        <div class="dbm-form-item">
          <label>授予权限</label>
          <div class="dbm-user-grants">
            <label v-for="g in USER_GRANTS" :key="g" class="dbm-user-grant">
              <ElCheckbox v-model="userForm.grants" :value="g" />
              <span>{{ g }}</span>
            </label>
          </div>
          <span class="dbm-hint">勾选后追加 <code>GRANT ... ON *.* TO 'user'@'host'</code></span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="createUserVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="creatingUser" @click="createUser">创建</ReButton>
      </template>
    </ReDialog>

    <!-- 导入向导：七步流程（对齐 Navicat），具体交互全在 DbImportWizard 里 -->
    <DbImportWizard
      v-model="importVisible"
      :datasource-id="currentDatasourceId"
      :database="importDatabase"
      :table-name="importTableName"
      @done="onImportDone"
    />

    <!-- 导出向导 -->
    <ReDialog v-model="exportVisible" title="导出向导" width="560px">
      <div class="dbm-create-form">
        <div class="dbm-form-item">
          <label>目标表</label>
          <ReInput :model-value="`${exportDatabase}.${exportTable}`" disabled />
        </div>
        <div class="dbm-form-item">
          <label>文件格式</label>
          <ReSelect v-model="exportFormat" style="width: 100%">
            <ReOption label="CSV（逗号分隔，Excel 友好）" value="csv" />
            <ReOption label="TSV（制表符分隔）" value="tsv" />
            <ReOption label="JSON 数组" value="json" />
            <ReOption label="XML" value="xml" />
            <ReOption label="SQL 脚本（可回灌）" value="sql" />
          </ReSelect>
        </div>
        <div class="dbm-form-item">
          <label>导出范围</label>
          <ReSelect v-model="exportScope" style="width: 100%">
            <ReOption label="仅数据" value="data" />
            <ReOption label="仅结构（建表语句）" value="structure" />
            <ReOption label="结构 + 数据" value="all" />
          </ReSelect>
        </div>
        <div v-if="exportScope !== 'structure'" class="dbm-form-item">
          <label>行数上限</label>
          <ReInputNumber v-model="exportLimit" :min="1" :max="200000" controls-position="right" style="width: 160px" />
          <span class="dbm-hint">后端硬上限 200000</span>
        </div>
        <div v-if="exportScope !== 'structure'" class="dbm-form-item">
          <label>WHERE 过滤</label>
          <ReInput v-model="exportWhere" class="dbm-mono" placeholder="留空导出全部；例：status = 1" clearable />
        </div>
        <div v-if="exportScope !== 'structure'" class="dbm-form-item">
          <label>排序</label>
          <ReSelect v-model="exportOrderBy" filterable clearable placeholder="不排序" style="width: 190px">
            <ReOption v-for="c in exportColumns" :key="c" :label="c" :value="c" />
          </ReSelect>
          <ReSelect v-model="exportOrderDir" style="width: 100px">
            <ReOption label="升序" value="ASC" />
            <ReOption label="降序" value="DESC" />
          </ReSelect>
        </div>
        <div v-if="exportFormat !== 'sql' && exportScope === 'structure'" class="dbm-danger-hint">
          结构只有建表语句，请选 SQL 格式
        </div>
      </div>
      <template #footer>
        <ReButton @click="exportVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="exporting" @click="doExport">导出并下载</ReButton>
      </template>
    </ReDialog>

    <!-- 新增外键弹窗 -->
    <ReDialog v-model="fkDialogVisible" title="新增外键" width="560px">
      <div class="dbm-create-form">
        <div class="dbm-form-item">
          <label>约束名</label>
          <ReInput v-model="fkForm.name" class="dbm-mono" placeholder="例：fk_child_parent" />
        </div>
        <div class="dbm-form-item">
          <label>本表列</label>
          <ReSelect v-model="fkForm.column" filterable placeholder="选择列" style="width: 100%">
            <ReOption v-for="c in designTableColumns()" :key="c.name" :label="`${c.name} (${c.type})`" :value="c.name" />
          </ReSelect>
        </div>
        <div class="dbm-form-item">
          <label>引用表</label>
          <ReSelect v-model="fkForm.refTable" filterable placeholder="选择表" style="width: 100%">
            <ReOption
              v-for="t in tablesOf(activeTabObj?.database ?? '')"
              :key="t.name"
              :label="t.name"
              :value="t.name"
            />
          </ReSelect>
        </div>
        <div class="dbm-form-item">
          <label>引用列</label>
          <ReSelect v-model="fkForm.refColumn" filterable placeholder="选择列" style="width: 100%">
            <ReOption
              v-for="c in fkRefColumns"
              :key="c.name"
              :label="`${c.name} (${c.type})`"
              :value="c.name"
            />
          </ReSelect>
        </div>
        <div class="dbm-form-item">
          <label>ON UPDATE</label>
          <ReSelect v-model="fkForm.onUpdate" style="width: 100%">
            <ReOption v-for="a in FK_ACTIONS" :key="'u' + a" :label="a" :value="a" />
          </ReSelect>
        </div>
        <div class="dbm-form-item">
          <label>ON DELETE</label>
          <ReSelect v-model="fkForm.onDelete" style="width: 100%">
            <ReOption v-for="a in FK_ACTIONS" :key="'d' + a" :label="a" :value="a" />
          </ReSelect>
        </div>
      </div>
      <template #footer>
        <ReButton @click="fkDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="fkSaving" @click="submitAddForeignKey">创建</ReButton>
      </template>
    </ReDialog>
  </div>

  <!-- 编辑/新增行弹窗 -->
  <ReDialog v-model="rowDialogVisible" :title="rowDialogMode === 'edit' ? '编辑行' : '新增行'" width="600px">
    <ReForm label-width="120px">
      <ReFormItem v-for="col in tableData.columns" :key="col" :label="col">
        <span v-if="rowDialogMode === 'add' && isAutoIncrement(col)" class="dbm-auto-hint">自增，留空自动生成</span>
        <ReInputNumber v-else-if="isNumericCol(col)" v-model="rowForm[col]" :placeholder="`输入 ${col}`" style="width: 100%" />
        <DbTemporalEditor
          v-else-if="temporalKindOf(col, rowForm[col])"
          :type="columnTypes.get(col)"
          :model-value="rowForm[col]"
          clearable
          @update:model-value="rowForm[col] = $event"
        />
        <ReInput v-else-if="longTextColumns.has(col)" v-model="rowForm[col]" type="textarea" :rows="3" :placeholder="`输入 ${col}`" />
        <ReInput v-else v-model="rowForm[col]" :placeholder="`输入 ${col}`" />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="rowDialogVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="rowSaving" @click="saveRow">保存</ReButton>
    </template>
  </ReDialog>

  <!-- 新增/修改列弹窗：属性维度对齐 Navicat「列属性」页 -->
  <ReDialog
    v-model="columnDialogVisible"
    :title="columnDialogMode === 'add' ? '新增列' : '修改列'"
    width="640px"
  >
    <div class="dbm-create-form">
      <div class="dbm-form-item">
        <label>列名</label>
        <ReInput v-model="columnForm.columnName" :disabled="columnDialogMode === 'edit'" placeholder="请输入列名" />
      </div>
      <div class="dbm-form-item">
        <label>类型</label>
        <ReSelect v-model="columnForm.type" filterable :options="columnTypeSelectOptions" />
      </div>
      <div v-if="columnNeedsSize" class="dbm-form-item">
        <label>长度</label>
        <ReInputNumber v-model="columnForm.size" :min="1" :max="65535" controls-position="right" />
      </div>
      <div v-if="columnAllowsScale" class="dbm-form-item">
        <label>小数位</label>
        <ReInputNumber v-model="columnForm.scale" :min="0" :max="30" controls-position="right" />
      </div>
      <div v-if="columnAllowsUnsigned" class="dbm-form-item">
        <label>无符号</label>
        <BooleanSegmented v-model="columnForm.unsigned" aria-label="无符号" />
      </div>
      <div
        v-if="columnForm.unsigned && columnForm.type !== 'FLOAT' && columnForm.type !== 'DOUBLE'"
        class="dbm-form-item"
      >
        <label>补零</label>
        <BooleanSegmented v-model="columnForm.zerofill" aria-label="补零" />
      </div>
      <div v-if="columnIsEnum" class="dbm-form-item">
        <label>{{ columnForm.type === "SET" ? "集合取值" : "枚举取值" }}</label>
        <ReInput
          v-model="columnForm.enumValues"
          type="textarea"
          :rows="3"
          placeholder="每行一个取值，也可用逗号分隔。例：待审&#10;通过&#10;驳回"
        />
      </div>
      <template v-if="columnIsChar">
        <div class="dbm-form-item">
          <label>字符集</label>
          <ReSelect
            v-model="columnForm.charset"
            filterable
            clearable
            placeholder="留空则跟随表"
            :options="charsetOptions"
            @update:model-value="onColumnCharsetChange"
          />
        </div>
        <div class="dbm-form-item">
          <label>排序规则</label>
          <ReSelect
            v-model="columnForm.collation"
            filterable
            clearable
            placeholder="留空则跟随表"
            :options="columnCollationOptions.map(c => ({ label: c.collation, value: c.collation }))"
          />
        </div>
      </template>
      <div class="dbm-form-item">
        <label>可空</label>
        <BooleanSegmented v-model="columnForm.nullable" aria-label="可空" />
      </div>
      <div v-if="columnAllowsUnsigned" class="dbm-form-item">
        <label>自动递增</label>
        <BooleanSegmented v-model="columnForm.autoIncrement" aria-label="自动递增" />
      </div>
      <div class="dbm-form-item">
        <label>默认值</label>
        <ReInput v-model="columnForm.defaultValue" placeholder="留空则不设置默认值" />
      </div>
      <div v-if="/DATE|TIME/.test(columnForm.type)" class="dbm-form-item">
        <label>自动更新</label>
        <ReSelect
          v-model="columnForm.onUpdate"
          :options="onUpdateOptions"
        />
      </div>
      <div class="dbm-form-item">
        <label>注释</label>
        <ReInput v-model="columnForm.comment" placeholder="列注释（可选）" />
      </div>
    </div>
    <template #footer>
      <ReButton @click="columnDialogVisible = false">取消</ReButton>
      <ReButton type="primary" @click="saveColumn">保存</ReButton>
    </template>
  </ReDialog>

  <!-- 新建索引弹窗：类型 / 列序 / 前缀长度 / 主键索引 -->
  <ReDialog v-model="indexDialogVisible" title="新建索引" width="600px">
    <div class="dbm-create-form">
      <div v-if="!indexForm.primary" class="dbm-form-item">
        <label>索引名</label>
        <ReInput v-model="indexForm.indexName" placeholder="请输入索引名" />
      </div>
      <div class="dbm-form-item">
        <label>索引类型</label>
        <ReSelect v-model="indexForm.indexType" :options="indexTypeOptions" />
      </div>
      <div class="dbm-form-item">
        <label>索引列</label>
        <div class="dbm-idx-cols">
          <ReSelect
            v-model="indexForm.columns"
            multiple
            placeholder="可多选；选择顺序即复合索引的列序"
            :options="designColumnOptions"
          />
          <div v-if="indexForm.columns.length > 1" class="dbm-idx-order">
            <span class="dbm-idx-order-label">列序</span>
            <span v-for="(c, i) in indexForm.columns" :key="c" class="dbm-idx-order-item">
              <span class="dbm-idx-order-no">{{ i + 1 }}</span>{{ c }}
              <button
                type="button"
                class="dbm-idx-order-move"
                aria-label="把该列上移"
                :disabled="i === 0"
                @click="moveIndexColumn(i, -1)"
              >
                <ReIcon name="ArrowUp" :size="11" />
              </button>
              <button
                type="button"
                class="dbm-idx-order-move"
                aria-label="把该列下移"
                :disabled="i === indexForm.columns.length - 1"
                @click="moveIndexColumn(i, 1)"
              >
                <ReIcon name="ArrowDown" :size="11" />
              </button>
            </span>
          </div>
        </div>
      </div>
      <div v-if="indexForm.columns.length > 0" class="dbm-form-item">
        <label>前缀长度</label>
        <div class="dbm-idx-prefix">
          <div v-for="(c, i) in indexForm.columns" :key="c" class="dbm-idx-prefix-row">
            <span class="dbm-idx-order-no">{{ i + 1 }}</span>
            <span class="dbm-mono dbm-idx-prefix-name">{{ c }}</span>
            <ReInputNumber
              v-model="indexForm.prefixes[i]"
              :min="0"
              :max="3072"
              size="small"
              controls-position="right"
            />
          </div>
          <span class="dbm-hint">0 表示整列（仅字符 / 二进制列可用前缀）</span>
        </div>
      </div>
      <div v-if="!indexForm.primary" class="dbm-form-item">
        <label>唯一索引</label>
        <BooleanSegmented v-model="indexForm.unique" aria-label="唯一索引" />
      </div>
      <div class="dbm-form-item">
        <label>设为主键</label>
        <BooleanSegmented v-model="indexForm.primary" aria-label="设为主键" />
      </div>
    </div>
      <template #footer>
        <ReButton @click="indexDialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="saveIndex">{{ indexForm.primary ? "设为主键" : "创建" }}</ReButton>
      </template>
    </ReDialog>

    <!-- 查询参数弹窗：把脚本里的 ${name} 收集出来一次性填值后执行 -->
    <ReDialog v-model="paramDialogVisible" title="查询参数" width="520px">
      <div class="dbm-create-form">
        <div v-if="paramNames.length === 0" class="dbm-hint">
          当前脚本里没有 <code>${name}</code> 形式的占位符，无需填参数。
        </div>
        <div
          v-for="name in paramNames"
          :key="name"
          class="dbm-form-item dbm-params-row"
          :data-param-name="name"
        >
          <label>{{ name }}</label>
          <ReInput
            v-model="paramValues[name]"
            :placeholder="'${' + name + '}'"
          />
        </div>
      </div>
      <template #footer>
        <ReButton @click="paramDialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="runWithParams">执行</ReButton>
      </template>
    </ReDialog>

    <!-- 第九批 7.2：AI text2sql。生成结果只落预览区，点「应用到编辑器」才写 SQL，绝不自动执行 -->
    <ReDialog v-model="aiDialogVisible" title="AI 生成 SQL" width="640px">
      <div class="dbm-ai-body">
        <ReInput
          v-model="aiPrompt"
          type="textarea"
          :rows="4"
          placeholder="用自然语言描述要查的数据，例如：查每张表的行数"
        />
        <div class="dbm-ai-hint">
          <span>模型：{{ dbAi.model || '未识别' }}</span>
          <span v-if="aiContextHint" class="dbm-ai-ctx" :title="aiContextHint">结构上下文：{{ aiContextHint }}</span>
        </div>
        <pre v-if="aiSql" class="dbm-ai-sql" data-testid="dbm-ai-sql">{{ aiSql }}</pre>
      </div>
      <template #footer>
        <ReButton :loading="aiBusy" type="primary" @click="generateAiSql">生成 SQL</ReButton>
        <ReButton v-if="aiSql" type="success" @click="applyAiSql">应用到编辑器</ReButton>
      </template>
    </ReDialog>

  <!-- 表属性弹窗 -->
  <ReDialog v-model="optionsDialogVisible" title="表属性" width="560px">
    <div class="dbm-create-form">
      <div class="dbm-form-item">
        <label>存储引擎</label>
        <ReSelect v-model="optionsForm.engine" filterable :options="engineOptions" />
      </div>
      <div class="dbm-form-item">
        <label>字符集</label>
        <ReSelect
          v-model="optionsForm.charset"
          filterable
          clearable
          placeholder="留空则不改"
          :options="charsetOptions"
          @update:model-value="onOptionsCharsetChange"
        />
      </div>
      <div class="dbm-form-item">
        <label>排序规则</label>
        <ReSelect
          v-model="optionsForm.collation"
          filterable
          clearable
          placeholder="留空则不改"
          :options="optionsCollationOptions"
        />
      </div>
      <div class="dbm-form-item">
        <label>自增起始</label>
        <ReInputNumber v-model="optionsForm.autoIncrement" :min="1" placeholder="不设置则不改" />
      </div>
      <div class="dbm-form-item">
        <label>表注释</label>
        <ReInput v-model="optionsForm.comment" type="textarea" :rows="2" placeholder="表注释（可选）" />
      </div>
    </div>
    <template #footer>
      <ReButton @click="optionsDialogVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="optionsSaving" @click="saveTableOptions">保存</ReButton>
    </template>
  </ReDialog>

  <!-- 主键设置弹窗 -->
  <ReDialog v-model="pkDialogVisible" title="设置主键" width="520px">
    <div class="dbm-pk-hint">
      按住列名拖动可调整顺序，<strong>顺序即复合主键的列序</strong>；不选任何列表示清除主键。
    </div>
    <ReSelect
      v-model="pkDialogColumns"
      multiple
      style="width: 100%"
      placeholder="选择构成主键的列"
      :options="designColumns.map(c => ({ label: c.name, value: c.name }))"
    />
    <div v-if="pkDialogColumns.length > 1" class="dbm-idx-order">
      <span class="dbm-idx-order-label">列序</span>
      <span v-for="(c, i) in pkDialogColumns" :key="c" class="dbm-idx-order-item">
        <span class="dbm-idx-order-no">{{ i + 1 }}</span>{{ c }}
        <button
          type="button"
          class="dbm-idx-order-move"
          aria-label="把该列上移"
          :disabled="i === 0"
          @click="movePkColumn(i, -1)"
        >
          <ReIcon name="ArrowUp" :size="11" />
        </button>
        <button
          type="button"
          class="dbm-idx-order-move"
          aria-label="把该列下移"
          :disabled="i === pkDialogColumns.length - 1"
          @click="movePkColumn(i, 1)"
        >
          <ReIcon name="ArrowDown" :size="11" />
        </button>
      </span>
    </div>
    <template #footer>
      <ReButton @click="pkDialogVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="pkSaving" @click="savePrimaryKey">
        {{ pkDialogColumns.length === 0 ? '清除主键' : '保存主键' }}
      </ReButton>
    </template>
  </ReDialog>

    <!-- 建表语句弹窗 -->
    <ReDialog v-model="ddlVisible" title="建表语句" width="680px">
      <div class="dbm-create-form">
        <textarea class="dbm-sql-editor dbm-ddl" readonly :value="ddlText" />
      </div>
      <template #footer>
        <ReButton type="primary" icon="CopyDocument" :show-text="true" @click="copyText(ddlText)">复制</ReButton>
      </template>
    </ReDialog>
  </template>

<script setup lang="ts">
/**
 * 数据库管理页
 *
 * 提供数据源/数据库/表/视图的浏览、SQL 查询执行、表结构查看与建表/删表操作。
 * @author CH
 * @since 4.0.0
 */
import { message } from "@repo/core";
import { http } from "@repo/utils";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，--dense 为 12px/10px 内距档）
import "@repo/ui/surface";
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch, nextTick } from "vue";
import { EditPen, CopyDocument, Delete, RefreshRight } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReForm from "@repo/ui/re-form";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import RePagination from "@repo/ui/re-pagination";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "../../components/console/ConsoleSwitch.vue";
import BooleanSegmented from "../../components/console/BooleanSegmented.vue";
import DesignColumnGrid from "../../components/console/DesignColumnGrid.vue";
import ErWorkspace from "../../components/console/ErWorkspace.vue";
import DbTemporalEditor from "../../components/console/DbTemporalEditor.vue";
import type { DesignColumnRow } from "../../components/console/designColumnModel";
// 类型分组与长度/小数位/UNSIGNED 适用范围：与「设计表」建表对话框共用一份
import { COLUMN_TYPE_GROUPS, SCALE_ALLOWED, SIZE_REQUIRED, UNSIGNED_ALLOWED } from "../../utils/columnTypes";
// 日期 / 时间列的形态识别：格内编辑与行弹窗共用同一份判定，避免两处漂移
import { resolveTemporalKind, toTemporalPickerValue } from "../../utils/dbTemporal";
import type { DbTemporalKind } from "../../utils/dbTemporal";
import ReTable from "@repo/ui/re-table";
import { ReFormItem, ReOption, ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";
import DbSqlEditor from "../../components/console/DbSqlEditor.vue";
import CreateTableDialog from "../../components/console/CreateTableDialog.vue";
import DbUserManagePanel from "../../components/console/DbUserManagePanel.vue";
import DbImportWizard from "../../components/console/DbImportWizard.vue";
// 数据源下拉走共享件：中文口径与停用项剔除规则全站一份
import { DatasourceSelect } from "@pages/datasource";
import type { CollectOption } from "@pages/datasource";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import {
  fetchDbDatabases,
  fetchDbTables,
  fetchTableColumns,
  fetchTableData,
  DB_FILTER_OPS,
  dbFilterNeedsValue2,
  dbFilterTakesNoValue,
  dbFilterTakesMultipleValues,
  type DbFilterCondition,
  fetchTableDdl,
  fetchForeignKeys,
  executeDbSql,
  dropDbTable,
  dropDbView,
  renameDbTable,
  createDbDatabase,
  dropDbDatabase,
  type DbTableInfo,
  type DbColumnInfo,
  type DbTableDataResult,
  type DbQueryResult,
  type DbForeignKeyInfo,
  fetchErDiagram,
  type DbErTable,
  type DbErRelation,
  compareDbStructure,
  type DbStructureDiffItem,
  fetchDbAiStatus,
  requestDbText2Sql,
  type DbAiStatus,
  dbDocumentFormats,
  downloadDbDocument,
  previewDbDocument,
  type DbDocumentFormat,
} from "../../api/manageConsoles";
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource";
import {
  updateDbCell,
  fetchDbIndexes,
  createDbIndex,
  dropDbIndex,
  truncateDbTable,
  addDbColumn,
  modifyDbColumn,
  dropDbColumn,
  exportDbTable,
  DB_OBJECT_CATEGORIES,
  fetchDbObjectSummary,
  fetchDbObjects,
  fetchDbObjectDefinition,
  saveDbObject,
  dropDbObject,
  addDbForeignKey,
  dropDbForeignKey,
  type DbIndexInfo,
  type DbObjectCategory,
  type DbObjectInfo,
  type DbCollationItem,
  fetchDbTableOptions,
  updateDbTableOptions,
  fetchDbTableOptionValues,
  setDbTablePrimaryKey,
} from "../../api/dbManageApi";
import {
  loadViewPref,
  saveViewPref,
  loadTablePref,
  saveTablePref,
  clearTablePref,
  pruneTablePrefs,
  resetAllPrefs,
} from "../../api/dbViewPref";
import {
  executeDbSqlBatch,
  scanSqlParams,
  beginDbTx,
  commitDbTx,
  rollbackDbTx,
  fetchDbTxStatus,
  type DbBatchResult,
  type DbStatementResult,
} from "../../api/dbQueryApi";

const route = useRoute();

/**
 * 组件属性。
 *
 * <p>内嵌到数据源中心（{@link ScDataCenterView}）时由宿主传入 datasourceId，
 * 并跟随宿主左栏的选中项切换；独立路由（/db-manager）则回落到 URL 上的
 * datasourceId。两处都不传时用默认主数据源。</p>
 */
const props = withDefaults(
  defineProps<{
    /** 宿主持有的数据源 ID；优先级高于路由 query */
    datasourceId?: number;
    /** 内嵌模式：隐藏与宿主重复的数据源下拉，并按宿主的栅格撑满高度 */
    embedded?: boolean;
  }>(),
  { datasourceId: undefined, embedded: false },
);
const { embedded } = props;

/** 全屏模式（/db-manager/full 等 standalone 路由）：无应用外壳，高度应吃满视口 */
const isFullscreen = computed(() => route.meta?.standalone === true);

/** 默认主数据源：后端把 datasourceId=0/null 解析为主数据源，这里把它显式作为下拉首项 */
const DEFAULT_DATASOURCE: DataSourceInfo = { id: 0, name: "默认主数据源", type: "master" };

// 数据源
const datasources = ref<DataSourceInfo[]>([DEFAULT_DATASOURCE]);
const currentDatasourceId = ref<number>(DEFAULT_DATASOURCE.id ?? 0);
const currentDatasourceName = computed(() => {
  const ds = datasources.value.find(d => d.id === currentDatasourceId.value);
  return ds ? ds.name : DEFAULT_DATASOURCE.name;
});

/**
 * 数据源下拉选项。
 *
 * <p>副标题给类型与地址：台账里有十几项时，光看名字分不出是哪个库。</p>
 */
const datasourceOptions = computed<CollectOption[]>(() =>
  datasources.value.map(ds => {
    const parts = [ds.type, ds.database || ds.host].filter(Boolean);
    return {
      value: String(ds.id ?? 0),
      label: ds.name,
      description: parts.length ? parts.join(" · ") : "",
    };
  }),
);

/** 选中数据源：组件给的是字符串，这里转回 number —— 本页的 id 要直接喂给各 API */
function onDatasourcePick(value: string): void {
  currentDatasourceId.value = Number(value) || 0;
}

// 连接树
const databases = ref<string[]>([]);
/** 按库缓存表列表，避免展开第二个库时显示上一个库的表 */
const tablesByDb = reactive<Record<string, DbTableInfo[]>>({});

/* ==================== 数据库对象（存储过程 / 函数 / 触发器 / 事件） ==================== */

/** 每个库的四类对象清单 */
const objectsByDb = reactive<Record<string, Record<string, DbObjectInfo[]>>>({});
/** 每个库的四类对象计数（树节点角标） */
const objectCounts = reactive<Record<string, Record<string, number>>>({});
/** 某一类读不到时的原因（权限不足 / 内核无此概念），显示在节点上 */
const objectErrors = reactive<Record<string, Record<string, string>>>({});

/** 拉取某库的对象清单与计数（展开分类节点时调用）。 */
async function loadDbObjects(db: string): Promise<void> {
  if (!db) return;
  try {
    const summary = await fetchDbObjectSummary(currentDatasourceId.value, db);
    objectCounts[db] = summary.counts as unknown as Record<string, number>;
    objectErrors[db] = (summary.errors ?? {}) as unknown as Record<string, string>;
  } catch (e) {
    objectCounts[db] = { procedure: 0, function: 0, trigger: 0, event: 0 };
    objectErrors[db] = {};
  }
}

/** 拉取某库某一类的对象清单。 */
async function loadDbObjectList(db: string, category: DbObjectCategory): Promise<void> {
  if (!db) return;
  if (!objectsByDb[db]) objectsByDb[db] = {};
  try {
    objectsByDb[db][category] = await fetchDbObjects(category, currentDatasourceId.value, db);
  } catch (e) {
    objectsByDb[db][category] = [];
    const hint = String((e as Error)?.message ?? e);
    if (!objectErrors[db]) objectErrors[db] = {};
    objectErrors[db][category] = hint;
  }
}

/** 某库某一类的对象清单 */
function objectsOf(db: string, category: DbObjectCategory): DbObjectInfo[] {
  return objectsByDb[db]?.[category] ?? [];
}

/** 某库某一类的对象数（清单未拉时回落到计数接口的值） */
function objectCountOf(db: string, category: DbObjectCategory): number {
  const loaded = objectsByDb[db]?.[category];
  if (loaded) return loaded.length;
  return objectCounts[db]?.[category] ?? 0;
}

/** 某库某一类的读取错误 */
function objectErrorOf(db: string, category: DbObjectCategory): string {
  return objectErrors[db]?.[category] ?? "";
}

/** 分类节点的树 key */
function objectNodeKey(db: string, category: DbObjectCategory): string {
  return `obj:${db}:${category}`;
}

/** 分类节点是否展开（用 dbm-tree 的箭头判断，避免与表节点状态混在一起） */
function objectNodeExpanded(db: string, category: DbObjectCategory): boolean {
  return expandedObjects.value.has(objectNodeKey(db, category));
}

/** 已展开的对象分类节点 */
const expandedObjects = ref(new Set<string>());

/**
 * 展开/收起对象分类节点：展开时才拉清单（避免每个库都打 4 个请求）。
 */
async function toggleObjectNode(db: string, category: DbObjectCategory): Promise<void> {
  const key = objectNodeKey(db, category);
  if (expandedObjects.value.has(key)) {
    expandedObjects.value.delete(key);
  } else {
    expandedObjects.value.add(key);
    await loadDbObjectList(db, category);
  }
  expandedObjects.value = new Set(expandedObjects.value);
}

/** 对象页签正在编辑的定义 */
const objectDefinition = ref("");
/** 对象定义是否已改动 */
const objectDirty = ref(false);
/** 读定义中 */
const objectLoading = ref(false);
/** 保存中 */
const objectSaving = ref(false);
/** 新建对象时的默认骨架 */
const objectTemplate = ref("");

/**
 * 打开对象定义页签。
 *
 * @param category 类别
 * @param name 对象名（新建时为空）
 * @param db 所属库
 */
async function openObjectDefinition(category: DbObjectCategory, name: string, db: string): Promise<void> {
  const tab: Tab = {
    id: `${category}:${db}.${name}`,
    type: "object",
    title: name ? `${name}` : `新建${categoryLabel(category)}`,
    database: db,
    objectCategory: category,
    objectName: name,
  };
  const existing = tabs.value.find(t => t.id === tab.id);
  if (!existing) {
    tabs.value.push(tab);
  }
  activeTab.value = tab.id;
  objectDirty.value = false;
  if (name) {
    objectLoading.value = true;
    try {
      objectDefinition.value = await fetchDbObjectDefinition(category, name, currentDatasourceId.value, db);
    } catch (e) {
      message.error(`读取定义失败: ${String((e as Error)?.message ?? e)}`);
      objectDefinition.value = "";
    } finally {
      objectLoading.value = false;
    }
  } else {
    objectDefinition.value = objectTemplateOf(category, db);
  }
}

/** 类别中文名 */
function categoryLabel(category: DbObjectCategory): string {
  return DB_OBJECT_CATEGORIES.find(c => c.value === category)?.label ?? category;
}

/**
 * 对象页签的标题。
 *
 * <p>放computed 而不是写在模板表达式里：模板里既不能用 TypeScript 的非空断言
 * {@code !}，也不适合拼多段逻辑。vue-tsc 不报错但 Babel 会在编译期炸掉，
 * 表现为页面整块白屏、树节点一个都不渲染。</p>
 */
const objectTabTitle = computed(() => {
  const tab = activeTabObj.value;
  if (tab?.objectName) {
    return `定义 ${tab.objectName}`;
  }
  return `新建${tab?.objectCategory ? categoryLabel(tab.objectCategory) : "对象"}`;
});

/**
 * 新建对象的默认骨架。
 *
 * <p>两点必须注意：</p>
 * <ol>
 *   <li><b>反引号里只能包名字</b>：写成 {@code `db.p_new`} 会把点号写进对象名 ——
 *       内核会建出一个名字真叫 {@code db.p_new} 的对象。库由会话定位
 *       （保存请求已带 database，后端会先 USE）。</li>
 *   <li><b>不要拿占位词当库名</b>：早先写死字面量 {@code db}，用户直接保存会得到
 *       {@code Access denied … to database 'information_schema'} 这种与上下文无关的权限错误。</li>
 * </ol>
 *
 * @param category 类别
 * @param db 目标库名
 * @returns 完整 DDL 骨架
 */
function objectTemplateOf(category: DbObjectCategory, db: string): string {
  const quoted = (n: string): string => `\`${n}\``;
  const table = tablesOf(db)[0]?.name;
  switch (category) {
    case "procedure":
      return `CREATE PROCEDURE ${quoted("p_new")}()\nBEGIN\n  SELECT 1;\nEND`;
    case "function":
      return `CREATE FUNCTION ${quoted("f_new")}(p INT) RETURNS INT DETERMINISTIC\nBEGIN\n  RETURN p;\nEND`;
    case "trigger":
      return table
        ? `-- 作用表：${table}\nCREATE TRIGGER ${quoted("tg_new")} BEFORE INSERT ON ${quoted(table)}\nFOR EACH ROW\nBEGIN\n  SET NEW.id = NEW.id;\nEND`
        : `-- 先在左侧展开本库，这里会自动填入第一张表名\nCREATE TRIGGER ${quoted("tg_new")} BEFORE INSERT ON ${quoted("your_table")}\nFOR EACH ROW\nBEGIN\nEND`;
    default:
      return `CREATE EVENT ${quoted("ev_new")} ON SCHEDULE EVERY 1 DAY\nDO\n  SELECT 1`;
  }
}

/**
 * 保存对象定义（存在同名则先删后建）。
 */
async function saveObjectDefinition(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab || tab.type !== "object" || !tab.objectCategory) return;
  const definition = objectDefinition.value.trim();
  if (!definition) {
    message.warning("定义不能为空");
    return;
  }
  objectSaving.value = true;
  try {
    await saveDbObject(
      tab.objectCategory,
      definition,
      { datasourceId: currentDatasourceId.value, database: tab.database },
      true
    );
    message.success("已保存");
    objectDirty.value = false;
    if (tab.database) {
      await loadDbObjects(tab.database);
      await loadDbObjectList(tab.database, tab.objectCategory);
    }
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    objectSaving.value = false;
  }
}

/**
 * 删除当前对象。
 */
async function deleteCurrentObject(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab || tab.type !== "object" || !tab.objectCategory || !tab.objectName) return;
  try {
    await ElMessageBox.confirm(`确定删除 ${categoryLabel(tab.objectCategory)}「${tab.objectName}」？`, "确认删除", {
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    await dropDbObject(
      tab.objectCategory,
      tab.objectName,
      { datasourceId: currentDatasourceId.value, database: tab.database },
      true
    );
    message.success("已删除");
    if (tab.database) {
      await loadDbObjects(tab.database);
      await loadDbObjectList(tab.database, tab.objectCategory);
    }
    closeTab(tab.id);
  } catch (e) {
    message.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
}
/** 当前选中的库，跨库查看数据/执行 SQL 都以它为准 */
const activeDatabase = ref("");
const expandedNodes = ref(new Set<string>(["root"]));

// ==================== 树：表展开字段 ====================
/** 已展开的表节点（db.table） */
const expandedTables = ref(new Set<string>());
/** 表字段缓存（展开表时懒加载） */
const tableColumnsCache = reactive<Record<string, DbColumnInfo[]>>({});

/**
 * 表节点 key
 * @param db 库名
 * @param table 表名
 */
function tableNodeKey(db: string, table: string): string {
  return db + "." + table;
}

/**
 * 展开/收起表节点并懒加载字段
 * @param table 表名
 * @param db    库名
 */
async function toggleTable(table: string, db: string): Promise<void> {
  const key = tableNodeKey(db, table);
  if (expandedTables.value.has(key)) {
    expandedTables.value.delete(key);
    return;
  }
  expandedTables.value.add(key);
  if (!tableColumnsCache[key]) {
    tableColumnsCache[key] = [];
    try {
      tableColumnsCache[key] = await fetchTableColumns(table, currentDatasourceId.value, db);
    } catch (e) {
      message.error(`加载字段失败: ${String((e as Error)?.message ?? e)}`);
    }
  }
}

/**
 * 已加载的表字段
 * @param db    库名
 * @param table 表名
 */
function columnsOf(db: string, table: string): DbColumnInfo[] {
  return tableColumnsCache[tableNodeKey(db, table)] || [];
}
const activeTable = ref<string>("");

// 标签页
interface Tab {
  id: string;
  /** object = 存储过程/函数/触发器/事件的定义页 */
  type: "table" | "design" | "query" | "object" | "er" | "users";
  title: string;
  tableName?: string;
  database?: string;
  sql?: string;
  /** object 页签：对象类别 */
  objectCategory?: DbObjectCategory;
  /** object 页签：对象名 */
  objectName?: string;
}
const tabs = ref<Tab[]>([]);
const activeTab = ref<string>("");
const activeTabObj = computed(() => tabs.value.find(t => t.id === activeTab.value));

/**
 * 当前查询标签的 SQL 绑定项。
 *
 * <p>{@link Tab#sql} 为可选字段，而 {@code DbSqlEditor} 的 v-model 契约为必填
 * {@code string}，此处以空串兜底并在写入时回填到当前标签，避免可选值直接参与双向绑定。
 *
 * @return 查询标签 SQL 的可读写计算属性
 */
const activeSqlModel = computed<string>({
  get: () => activeTabObj.value?.sql ?? "",
  set: (v: string) => {
    const t = activeTabObj.value;
    if (t) {
      t.sql = v;
    }
  },
});

// 表数据
/**
 * 视图偏好（F5：从本地存储恢复，见 dbViewPref.ts）。
 *
 * <p>声明放在这里而不是紧贴使用处：{@code tableData.pageSize} 在下面就要用到它，
 * 放到使用处后面会变成「先用后声明」。</p>
 *
 * <p>整体读一次、各字段取用 —— 这样「某个字段被写坏」只影响那一个字段，
 * 不会把整份偏好一起拖成默认值。</p>
 */
const viewPref = loadViewPref();

const tableData = reactive<DbTableDataResult>({ columns: [], rows: [], total: 0, page: 1, pageSize: viewPref.pageSize });

// ==================== 数据视图：表头/行显示模式 + 总数开关 ====================
/** 表头显示模式 */
const HEADER_MODES = [
  { label: "字段", value: "name" as const },
  { label: "注释", value: "comment" as const },
  { label: "字段+注释", value: "both" as const },
  { label: "类型", value: "type" as const },
];
const headerMode = ref<"name" | "comment" | "both" | "type">(viewPref.headerMode);

/**
 * 行显示模式。
 *
 * <p>只有两档：**数据 / 数据+注释**。三档（字段 / 注释 / 字段+注释）在
 * {@link HEADER_MODES}（表头显示模式）里，那是控制表头文字的；
 * 两者的 label 不要重名 —— {@code jdbc-workbench-acceptance.mjs} 用
 * {@code .dbm-subtab:has-text("字段")} 定位，重名后同一个选择器会命中两个元素，
 * {@code .first()} 拿到哪个取决于渲染顺序，断言就会变得不可预测。</p>
 */
const ROW_MODES = [
  { label: "数据", value: "data" as const },
  { label: "数据+注释", value: "data-comment" as const },
];
const rowMode = ref<"data" | "data-comment">(viewPref.rowMode);

/** 是否统计总数（关闭后跳过 COUNT，走「上一页/下一页」模式） */
const showTotal = ref(viewPref.showTotal);

/** 把 boolean 的 showTotal 转成 ReRadio 分段档能用的字符串，双向同步 */
const showTotalValue = computed<string>({
  get: () => (showTotal.value ? "yes" : "no"),
  set: (v: string) => {
    showTotal.value = v === "yes";
  },
});
/** 列注释映射（表头/行显示模式） */
const columnComments = reactive<Record<string, string>>({});

/** WHERE 过滤条件（已应用值） */
const filterWhere = ref("");
/**
 * WHERE 过滤条是否展开。
 *
 * <p>默认**折叠**：表页签一打开就是「干净的网格」，WHERE 那行只在需要时出现
 * （点条最左侧的箭头按钮展开）。真正生效的过滤条件会把 {@link filterActive}
 * 顶成 true，由下面的 watch 自动把条撑开——过滤是「改了就得看得见」的事，
 * 默认折叠不能变成「数据被过滤了却看不出为什么」。</p>
 */
const filterBarOpen = ref(false);
/** 当前排序（服务器端） */
const sortState = reactive<{ prop: string; order: "ASC" | "DESC" | "" }>({ prop: "", order: "" });

/**
 * 清空排序与过滤条件。
 *
 * <p>这三个是**共享状态**，不是页签私有：切表时若不清，会把上一张表的 {@code ORDER BY} 列名
 * 或高级筛选条件发给新表。新表没有该列时后端直接报错，而 {@code loadTableData} 的 catch
 * 只弹一条提示、**不会清空 {@code tableData}**，于是网格静默保留上一张表的列与数据——现象就是
 * 「页签已切到新表，表头却还是旧表的列」，并连带 {@code pkColumns} 也是旧的，
 * 造成「主键列不可编辑」误判。2026-10-02 JDBC 工作台验收实测复现（无主键表 + score 排序）。</p>
 *
 * <p><b>原实现漏了 {@code activeFilters}</b>（2026-10-05 F5 期间发现）：
 * 手动点「清除过滤」会清它，但切表这条路不会 ——
 * 于是给 A 表设了高级筛选后切到 B 表，B 表的加载请求带着 A 表的列名过去，
 * 必然报错且网格停在旧数据。{@link clearFilter} 的注释里已经写明
 * 「必须同时清掉 filterWhere 与 activeFilters」，这里就是漏了同一处。</p>
 */
function resetTableQueryState() {
  sortState.prop = "";
  sortState.order = "";
  filterWhere.value = "";
  activeFilters.value = [];
  filterDraft.value = [];
}
/** 当前选中的行 */
const selection = ref<Record<string, unknown>[]>([]);

/**
 * 记录表格多选（批量删除用）
 * @param rows 选中行
 */
function onSelectionChange(rows: Record<string, unknown>[]): void {
  selection.value = rows ?? [];
}

/**
 * 列头排序（服务器端）：切换升/降/取消并重载
 * @param payload ReTable 排序事件
 */
function onSortChange(payload: { prop: string; order: string | null }): void {
  if (!payload?.order) {
    sortState.prop = "";
    sortState.order = "";
  } else {
    sortState.prop = payload.prop;
    sortState.order = payload.order === "descending" ? "DESC" : "ASC";
  }
  const tab = activeTabObj.value;
  if (tab) {
    tableData.page = 1;
    void loadTableData(tab, 1);
  }
}

/** 应用 WHERE 过滤（回到第一页） */
function applyFilter(): void {
  const tab = activeTabObj.value;
  if (!tab) return;
  tableData.page = 1;
  // 条件变了就落盘：用户配好筛选条件后最小化的下一个动作就是刷新页面，
  // 那时候还在内存里的条件等于没配。
  persistTablePref();
  void loadTableData(tab, 1);
}

/**
 * 清除过滤。
 *
 * <p>必须**同时**清掉 {@link filterWhere} 与 {@link activeFilters}：
 * 只清文本框的话，「清除过滤」清不掉高级筛选设的条件，
 * 而工具条上「N 个条件」标识还亮着 —— 按钮名与实际效果对不上。</p>
 */
function clearFilter(): void {
  filterWhere.value = "";
  activeFilters.value = [];
  filterDraft.value = [];
  applyFilter();
}

// ---------- 高级筛选（Navicat 式：列 + 运算符 + 值） ----------
const filterDialogVisible = ref(false);
/**
 * 已生效的结构化筛选条件。
 *
 * <p>与 {@link filterWhere}（自由文本）是**两套独立机制**，同时给出时按 AND 组合：
 * 前者的列名过标识符白名单、值走 PreparedStatement 绑定；
 * 后者只能靠「拒绝分隔符」的黑名单。两条路径各自的安全性不该互相依赖。</p>
 */
const activeFilters = ref<DbFilterCondition[]>([]);
/**
 * 是否存在生效中的过滤（自由文本或结构化条件任一）。
 *
 * <p>两套机制独立（见上），但对「过滤条该不该自己弹开」这件事是一回事：
 * 只要数据被过滤了，条件就必须摆在明面上。</p>
 */
const filterActive = computed(() => filterWhere.value.trim() !== "" || activeFilters.value.length > 0);
watch(filterActive, (active) => {
  if (active) filterBarOpen.value = true;
});
/** 弹窗里正在编辑的草稿（点「取消」不影响已生效的条件） */
const filterDraft = ref<DbFilterCondition[]>([]);
/**
 * 筛选面板的列候选。
 *
 * <p>刻意**不复用** `designColumns`：那个只在「设计视图」加载，
 * 在数据页签下是空的，于是筛选面板的列下拉会「能打开但一个选项都没有」——
 * 面板正常、点得开、就是没东西可选，从界面上完全看不出哪里错了。
 * 这里独立拉一次列，筛选与设计视图互不依赖。</p>
 */
const filterColumns = ref<{ name: string; type?: string; remark?: string }[]>([]);

/**
 * 加载筛选面板用的列候选。
 *
 * @param tab 当前表页签
 */
async function loadFilterColumns(tab: Tab): Promise<void> {
  if (!tab.tableName) return;
  try {
    const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
    filterColumns.value = cols.map(c => ({ name: c.name, type: c.type, remark: c.remark }));
  } catch {
    filterColumns.value = [];
    message.error("加载列信息失败，筛选面板没有可选列");
  }
}

/**
 * 下拉里的列选项标签：带类型与注释，避免同名列（大小写不同）分不清。
 *
 * @param c 列
 * @returns 标签文本
 */
function columnOptionLabel(c: { name: string; type?: string; remark?: string }): string {
  const type = c.type ? `（${c.type}${c.remark ? " · " + c.remark : ""}）` : "";
  return `${c.name}${type}`;
}

/** 打开高级筛选：草稿初始化为已生效条件的副本 */
function openFilterDialog(): void {
  const tab = activeTabObj.value;
  if (!tab?.tableName) {
    message.info("先打开一张表再用高级筛选");
    return;
  }
  void loadFilterColumns(tab);
  filterDraft.value = activeFilters.value.map(f => ({ ...f }));
  if (filterDraft.value.length === 0) {
    filterDraft.value.push({ column: "", op: "=", value: "", value2: "" });
  }
  filterDialogVisible.value = true;
}

/**
 * 应用高级筛选。
 *
 * <p>无列名的行按「跳过」处理而不是拼进 SQL：用户在多行编辑时留一行空是常态，
 * 直接提交会让整条筛选失败并报「列名非法」，而界面上看不出是哪一行的问题。</p>
 */
function applyAdvancedFilter(): void {
  // 有行却一列都没选：当作「还没填完」而不是「清空全部条件」。
  // 否则用户不小心点掉列下拉再点应用，会**静默丢掉所有已生效的筛选**，
  // 表现是「我明明设了条件，怎么全表出来了」。
  if (filterDraft.value.length > 0 && filterDraft.value.every(f => !f.column.trim().length)) {
    message.warning("至少给一条条件选择列名");
    return;
  }
  const usable = filterDraft.value.filter(f => f.column.trim().length > 0);
  const bad = usable.find(f => !DB_FILTER_OPS.includes(f.op as (typeof DB_FILTER_OPS)[number]));
  if (bad) {
    message.warning(`运算符「${bad.op}」不可用`);
    return;
  }
  const missingValue = usable.find(f =>
    !dbFilterTakesNoValue(f.op)
    && (!f.value || !f.value.trim().length)
    && !(dbFilterTakesMultipleValues(f.op) && f.value));
  if (missingValue) {
    message.warning(`条件「${missingValue.column} ${missingValue.op}」还没填值`);
    return;
  }
  const betweenMissing = usable.find(f => dbFilterNeedsValue2(f.op) && !(f.value2 || "").trim().length);
  if (betweenMissing) {
    message.warning(`区间条件「${betweenMissing.column}」缺上界`);
    return;
  }
  activeFilters.value = usable.map(f => ({ ...f }));
  filterDialogVisible.value = false;
  const tab = activeTabObj.value;
  if (tab) {
    tableData.page = 1;
    // 必须落盘。这个函数**不走** applyFilter()（高级筛选是弹窗应用、
    // WHERE 是工具条按钮，两条路径），早先只在 applyFilter 里调
    // persistTablePref()，结果「高级筛选配好的条件刷新即丢」——
    // 而 WHERE 那条却正常，现象上像是「高级筛选功能有 bug」。
    persistTablePref();
    void loadTableData(tab, 1);
  }
}

/** 批量删除选中行（按主键定位；无主键时按全列等值定位） */
async function deleteSelectedRows(): Promise<void> {
  const tab = activeTabObj.value;
  const rows = selection.value;
  if (!tab?.tableName || rows.length === 0) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${rows.length} 行吗？`, "批量删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    // 统计后端真实影响行数，而不是拿请求条数当成功依据。
    // 并发场景下（别人刚删过其中几行）DELETE 会影响 0 行，
    // 原先直接报「已删除 N 行」属于谎报，用户会以为已经清干净。
    let affected = 0;
    for (const row of rows) {
      const keys = Object.keys(row);
      if (keys.length === 0) continue;
      const wheres = keys.map(k => sqlWhereEq(k, (row as Record<string, unknown>)[k])).join(" AND ");
      const res = await executeDbSql(`DELETE FROM ${tab.tableName} WHERE ${wheres}`, currentDatasourceId.value, tab.database);
      affected += typeof res?.affectedRows === "number" ? res.affectedRows : 0;
    }
    if (affected < rows.length) {
      message.warning(`已删除 ${affected} 行；请求的 ${rows.length} 行中有 ${rows.length - affected} 行未命中（可能已被他人删除）`);
    } else {
      message.success(`已删除 ${affected} 行`);
    }
    selection.value = [];
    await refreshTableData();
  } catch (e) {
    message.error(`批量删除失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 取列注释
 * @param col 列名
 */
function columnComment(col: string): string {
  return columnComments[col] || "";
}

/**
 * 表头文案（按显示模式）。
 *
 * <p>「类型」档展示列数据库类型而非列名：宽表看类型分布、
 * 排查「为什么这列排不了序 / 存不进值」时一眼可辨。类型取自跟随
 * 数据一起加载的 {@link columnTypes}（loadPkInfo 写入），没拿到时退回列名。</p>
 *
 * @param col 列名
 */
function headerLabel(col: string): string {
  if (headerMode.value === "type") {
    return columnTypes.value.get(col) || col;
  }
  const comment = columnComment(col);
  if (headerMode.value === "name" || !comment) return col;
  return headerMode.value === "comment" ? comment : `${col}（${comment}）`;
}

/**
 * 当前打开的是不是视图。
 *
 * <p>视图只能 SELECT：行级的编辑 / 删除 / INSERT / UPDATE / TRUNCATE / DROP TABLE
 * 打在它上面一律被内核拒绝。与其让用户逐个点出失败，不如按对象类型收菜单。</p>
 */
const activeIsView = computed(() => {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return false;
  const db = tab.database || activeDatabase.value;
  return (getTablesForDb(db).find(t => t.name === tab.tableName)?.type || "TABLE").toUpperCase() === "VIEW";
});

/** 网格右键菜单（Navicat 风格：行操作 + 复制为 SQL + 表操作，替代操作列；icon 传组件） */
const GRID_MENU_TABLE = [
  { key: "edit", label: "编辑该行", icon: EditPen },
  { key: "duplicate", label: "复制该行（插入副本）", icon: CopyDocument },
  { key: "copy-insert", label: "复制为 INSERT 语句", icon: CopyDocument },
  { key: "copy-update", label: "复制为 UPDATE 语句", icon: CopyDocument },
  { key: "copy-json", label: "复制该行 JSON", icon: CopyDocument },
  { key: "delete", label: "删除该行", icon: Delete, divided: true },
  { key: "refresh", label: "刷新", icon: RefreshRight, divided: true },
  { key: "truncate", label: "清空表", icon: Delete, divided: true },
  { key: "drop", label: "删除表", icon: Delete },
];

/** 视图只读性实测（MariaDB，jdbc_acc，2026-10-12）：简单视图可 UPDATE/DELETE/INSERT，
 *  SELECT/SHOW CREATE/DESCRIBE 一律正常；真正会失败的是 TRUNCATE、DROP TABLE，
 *  以及 duplicateTable 的三条 CREATE TABLE 候选。所以这里只收起那几项，
 *  不把编辑/删除该行这类对简单视图能用的功能一起砍掉。 */
const GRID_MENU_VIEW = [
  { key: "edit", label: "编辑该行", icon: EditPen },
  { key: "duplicate", label: "复制该行（插入副本）", icon: CopyDocument },
  { key: "copy-insert", label: "复制为 INSERT 语句", icon: CopyDocument },
  { key: "copy-update", label: "复制为 UPDATE 语句", icon: CopyDocument },
  { key: "copy-select", label: "复制为 SELECT 语句", icon: CopyDocument },
  { key: "copy-json", label: "复制该行 JSON", icon: CopyDocument },
  { key: "delete", label: "删除该行", icon: Delete, divided: true },
  { key: "refresh", label: "刷新", icon: RefreshRight, divided: true },
  { key: "drop", label: "删除视图", icon: Delete },
];

const gridMenuItems = computed(() => (activeIsView.value ? GRID_MENU_VIEW : GRID_MENU_TABLE));

/**
 * 生成 SELECT 语句（视图行唯一的复制形态：视图不可写，复制出来只能是查它的语句）
 * @param row 行数据
 */
function rowToSelect(row: Record<string, unknown>): string {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return "";
  const cols = tableData.columns.length ? tableData.columns : Object.keys(row);
  const where = cols
    .filter(c => row[c] !== null && row[c] !== undefined && row[c] !== "")
    .map(c => `\`${c}\` = ${sqlLiteral(row[c])}`)
    .join(" AND ");
  const proj = cols.map(c => `\`${c}\``).join(", ");
  return where ? `SELECT ${proj} FROM \`${tab.tableName}\` WHERE ${where};` : `SELECT ${proj} FROM \`${tab.tableName}\`;`;
}

/**
 * 生成 INSERT 语句（Navicat 式复制为 SQL）
 * @param row 行数据
 */
function rowToInsert(row: Record<string, unknown>): string {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return "";
  const cols = tableData.columns.length ? tableData.columns : Object.keys(row);
  const values = cols.map(c => sqlLiteral(row[c])).join(", ");
  return `INSERT INTO ${tab.tableName} (${cols.map(c => `\`${c}\``).join(", ")}) VALUES (${values});`;
}

/**
 * 生成 UPDATE 语句（无主键时按全列等值定位）
 * @param row 行数据
 */
function rowToUpdate(row: Record<string, unknown>): string {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return "";
  const cols = tableData.columns.length ? tableData.columns : Object.keys(row);
  const setCols = cols.filter(c => !pkColumns.value.has(c));
  const whereCols = pkColumns.value.size ? cols.filter(c => pkColumns.value.has(c)) : cols;
  const setSql = setCols.map(c => `\`${c}\` = ${sqlLiteral(row[c])}`).join(", ");
  const whereSql = whereCols.map(c => sqlWhereEq(c, row[c])).join(" AND ");
  return `UPDATE ${tab.tableName} SET ${setSql || "/* 无可更新列 */"} WHERE ${whereSql};`;
}

/**
 * 复制该行为新行（清掉自增列后插入）
 * @param row 行数据
 */
async function duplicateRow(row: Record<string, unknown>): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  const cols = (tableData.columns.length ? tableData.columns : Object.keys(row)).filter(c => !isAutoIncrement(c));
  const values = cols.map(c => sqlLiteral(row[c])).join(", ");
  try {
    await executeDbSql(
      `INSERT INTO ${tab.tableName} (${cols.map(c => `\`${c}\``).join(", ")}) VALUES (${values})`,
      currentDatasourceId.value,
      tab.database,
    );
    message.success("已插入副本行");
    await refreshTableData();
  } catch (e) {
    message.error(`插入副本失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 处理网格右键菜单动作
 * @param item 菜单项
 * @param ctx  右键上下文（含行数据）
 */
function onGridMenuSelect(item: { key: string }, ctx: { row: Record<string, unknown> }): void {
  const tab = activeTabObj.value;
  switch (item.key) {
    case "edit": openEditRowDialog(ctx.row); break;
    case "duplicate": void duplicateRow(ctx.row); break;
    case "copy-insert": void copyText(rowToInsert(ctx.row)); break;
    case "copy-update": void copyText(rowToUpdate(ctx.row)); break;
    case "copy-json": void copyText(JSON.stringify(ctx.row, null, 2)); break;
    case "copy-select": void copyText(rowToSelect(ctx.row)); break;
    case "delete": void deleteRow(ctx.row); break;
    case "refresh": refreshTableData(); break;
    case "truncate": if (tab) void confirmTruncate(tab.tableName, tab.database); break;
    case "drop": if (tab?.tableName) void (activeIsView.value ? deleteView(tab.tableName, tab.database) : deleteTable(tab.tableName, tab.database)); break;
    default: break;
  }
}

// ==================== 新建数据库 ====================
const createDbVisible = ref(false);
const newDbName = ref("");
const newDbCharset = ref("utf8mb4");
const newDbCollation = ref("utf8mb4_general_ci");
const creatingDb = ref(false);

const openCreateDatabase = () => {
  newDbName.value = "";
  createDbVisible.value = true;
};

/**
 * 切换字符集时同步默认排序规则建议
 */
const onCharsetChange = () => {
  newDbCollation.value = `${newDbCharset.value}_general_ci`;
};

const createDatabase = async () => {
  if (!newDbName.value.trim()) {
    message.warning("请输入数据库名称");
    return;
  }
  const name = newDbName.value.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(name)) {
    message.warning("数据库名只能由字母、数字和下划线组成，且不能以数字开头");
    return;
  }
  creatingDb.value = true;
  try {
    await createDbDatabase({
      name,
      datasourceId: currentDatasourceId.value,
      charset: newDbCharset.value || undefined,
      collation: newDbCollation.value || undefined,
    });
    message.success("数据库创建成功");
    createDbVisible.value = false;
    await loadTree();
  } catch (e) {
    message.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingDb.value = false;
  }
};

// ==================== 添加用户 ====================
/** 可授予的全局权限选项 */
const USER_GRANTS = [
  "ALL PRIVILEGES",
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "INDEX",
  "REFERENCES",
] as const;

const createUserVisible = ref(false);
const creatingUser = ref(false);
const userForm = reactive<{
  username: string;
  host: string;
  password: string;
  confirmPassword: string;
  grants: string[];
}>({
  username: "",
  host: "%",
  password: "",
  confirmPassword: "",
  grants: [],
});

/** 打开添加用户弹窗（默认库只为展示，用户名/主机/权限为全局对象） */
const openCreateUser = (_database?: string) => {
  userForm.username = "";
  userForm.host = "%";
  userForm.password = "";
  userForm.confirmPassword = "";
  userForm.grants = [];
  createUserVisible.value = true;
};

/**
 * 创建数据库用户：拼 `CREATE USER` + 可选 `GRANT`，走通用 DDL 通道执行。
 *
 * <p>通用 SQL 执行通道（{@code /db/execute}）与设计表/建库同一权限级别，可执行任意 DDL。
 * 语句不限定方言：MySQL / MariaDB 用 {@code 'user'@'host'}；PostgreSQL 的语法不同，
 * 执行失败会由后端回显服务端错误，因此先做内核无关的基础校验。</p>
 */
const createUser = async () => {
  const username = userForm.username.trim();
  const host = (userForm.host.trim() || "%").trim();
  const password = userForm.password;
  if (!username) {
    message.warning("请输入用户名");
    return;
  }
  if (!/^[A-Za-z0-9_$.]+$/.test(username)) {
    message.warning("用户名只能包含字母、数字、下划线、$ 和点");
    return;
  }
  if (!/^[A-Za-z0-9_$.%\-]+$/.test(host)) {
    message.warning("主机名不合法");
    return;
  }
  if (userForm.password !== userForm.confirmPassword) {
    message.warning("两次输入的密码不一致");
    return;
  }
  creatingUser.value = true;
  try {
    const stmts: string[] = [];
    // 无密码时 MySQL 的 IDENTIFIED BY '' 会被当成空密码，直接省略 IDENTIFIED BY
    const create = password
      ? `CREATE USER '${username}'@'${host}' IDENTIFIED BY '${password.replace(/'/g, "''")}'`
      : `CREATE USER '${username}'@'${host}'`;
    stmts.push(create);
    if (userForm.grants.length > 0) {
      const grants = userForm.grants.join(", ");
      stmts.push(`GRANT ${grants} ON *.* TO '${username}'@'${host}'`);
    }
    // 逐条执行：MySQL 的 Statement.execute 不支持一次多条（需 allowMultiQueries），
    // 拆开虽多一次往返，但任何一条失败都能准确定位
    for (const stmt of stmts) {
      await executeDbSql(stmt, currentDatasourceId.value);
    }
    message.success("用户创建成功");
    createUserVisible.value = false;
  } catch (e) {
    message.error(`创建用户失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingUser.value = false;
  }
};

// ==================== 导入向导 ====================
/**
 * 导入向导（对齐 Navicat）：选文件 → 预览解析结果 → 字段映射 → 执行 + 错误报告。
 *
 * <p>解析与写入都走后端 {@code /db/import}，前端**不再拼 SQL**：
 * 早期实现在前端逐条拼 INSERT 再调 {@code /db/execute}，既绕过了批量写入与
 * 类型转换，也让「一行坏数据」会中断整批，且 CSV 引号/换行解析不正确。</p>
 */
const importVisible = ref(false);
/** 从右键入口带进来的目标表（可空：库节点/空白处进来时为空） */
const importTableName = ref("");
/** 从右键入口带进来的库 */
const importDatabase = ref("");

/**
 * 打开导入向导。
 *
 * <p>这里只负责「从哪个库/哪张表进来的」，七步流程、文件解析、字段映射、
 * 导入模式与执行日志全在 {@code DbImportWizard} 里 —— 早期把整套流程内联在
 * 本视图里，既让文件膨胀，也因为前端自己拼 SQL 而无法支持导入模式与批量写入。</p>
 *
 * @param tableName 预填的目标表，可为空
 * @param database  目标库，为空时取当前选中的库
 */
const openImportData = async (tableName?: string, database?: string) => {
  const db = database || activeDatabase.value;
  if (!db) {
    message.warning("请先在左侧选择一个数据库");
    return;
  }
  importDatabase.value = db;
  // 表列表是展开树节点时才缓存的，未展开过要补一次，否则向导第 4 步的目标表下拉是空的
  if (!tablesByDb[db]?.length) {
    await loadTables(db);
  }
  // 只有从「某张表」的右键进来才预填表名。从根节点/空白处进来时不能拿库里
  // 第一张表兜底 —— 那会让用户毫无察觉地把数据追加进一张不相干的表。
  importTableName.value = tableName || "";
  importVisible.value = true;
};

/**
 * 导入成功后的收尾：刷新该库的表清单（新建表时要能立刻看到）并打开展示数据。
 *
 * @param payload 向导回传的目标表与库
 */
function onImportDone(payload: { table: string; database: string }): void {
  const db = payload.database || importDatabase.value;
  if (db) {
    void loadTables(db);
  }
  if (payload.table) {
    openTableData(payload.table, db);
  }
}

/**
 * 「导入数据」通用入口。
 *
 * <p>三个右键入口共用它：表节点（带表名）、库节点（只带库名，表名留空由用户填）、
 * 空白处（两个都不带）。</p>
 */
const openImportDataFromToolbar = () => openImportData();

/**
 * 右键菜单入口：针对某张表
 * @param tableName 表名，可为空
 * @param database 库名
 */
const openImportDataFor = (tableName: string, database: string) => openImportData(tableName || undefined, database);

/**
 * 右键菜单入口：只针对某个库（表名留空，导入向导第一步让用户填）。
 *
 * @param database 库名
 */
const openImportDataForDb = (database: string) => openImportData(undefined, database);

/**
 * 右键菜单入口：刷新某张表所在库的表清单。
 *
 * <p>表节点上的「刷新」刷的是**它所在的库**而不是单张表 —— 树是按库缓存表清单的
 * （`tablesByDb`），只刷一张表没有对应的数据源可刷。</p>
 *
 * @param database 库名
 */
function refreshTableInTree(database?: string): void {
  if (!database) {
    refreshTree();
    return;
  }
  void loadTables(database);
}

/** 切换数据源 → 重载树与库列表 */
watch(currentDatasourceId, () => {
  void onDatasourceChange();
});

/** 新建库对话框里选了字符集 → 刷新可选排序规则 */
watch(newDbCharset, () => {
  onCharsetChange();
});

// ==================== 导出向导 ====================
/**
 * 导出对话框（对齐 Navicat）：格式 + 范围 + 过滤条件。
 *
 * <p>导出走后端 {@code /db/export}，不再受「当前页 1000 行」限制；
 * 早期实现只在前端把当前页拼成 CSV，右键导出的表数据实际只有第一页。</p>
 */
const exportVisible = ref(false);
const exportTable = ref("");
const exportDatabase = ref("");
const exportFormat = ref<"csv" | "tsv" | "json" | "xml" | "sql">("csv");
const exportScope = ref<"structure" | "data" | "all">("data");
const exportWhere = ref("");
const exportOrderBy = ref("");
const exportOrderDir = ref<"ASC" | "DESC">("ASC");
const exportLimit = ref(10000);
const exporting = ref(false);
/**
 * 导出对话框里「排序列」的候选。
 *
 * <p>不能复用导入向导的列：两者来自不同的目标表，导出的排序列必须是被导出表的列，
 * 否则下拉里出现的是另一张表的字段，后端会报「未知列」。</p>
 */
const exportColumns = ref<string[]>([]);

/**
 * 从工具栏/右键打开导出对话框
 * @param tableName 表名
 * @param database  库名
 */
function openExportDialog(tableName?: string, database?: string): void {
  if (!tableName) {
    message.warning("请先选择要导出的表");
    return;
  }
  exportTable.value = tableName;
  exportDatabase.value = database || activeDatabase.value;
  exportFormat.value = "csv";
  exportScope.value = "data";
  exportWhere.value = "";
  exportOrderBy.value = "";
  exportOrderDir.value = "ASC";
  exportLimit.value = 10000;
  exportColumns.value = columnsOf(exportDatabase.value, tableName).map(c => c.name);
  exportVisible.value = true;
  // 树节点没展开过就没有列缓存，补一次，否则排序列下拉是空的
  if (!exportColumns.value.length) {
    void loadExportColumns();
  }
}

/**
 * 补拉导出目标表的列，供排序列下拉使用。
 */
async function loadExportColumns(): Promise<void> {
  const table = exportTable.value;
  const db = exportDatabase.value;
  if (!table || !db) {
    return;
  }
  try {
    const columns = await fetchTableColumns(table, currentDatasourceId.value, db);
    // 请求回来时用户可能已经换了目标表，丢弃过期结果
    if (exportTable.value === table && exportDatabase.value === db) {
      exportColumns.value = (columns || []).map(c => c.name);
    }
  } catch {
    // 拿不到列不影响导出本身，排序列留空即可
    exportColumns.value = [];
  }
}

/** 把后端返回的内容落盘为文件 */
function downloadText(filename: string, content: string, mime: string): void {
  // CSV 带 BOM，Excel 打开中文才不乱码
  const needsBom = mime.includes("csv");
  const blob = new Blob([needsBom ? "\ufeff" : "", content], { type: `${mime};charset=utf-8;` });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/** 导出格式 → MIME 与是否结构化（结构化格式的 scope 强制为结构） */
const EXPORT_MIME: Record<string, string> = {
  csv: "text/csv",
  tsv: "text/tab-separated-values",
  json: "application/json",
  xml: "application/xml",
  sql: "application/sql",
};

/**
 * 执行导出并下载。
 */
async function doExport(): Promise<void> {
  if (!exportTable.value) return;
  exporting.value = true;
  try {
    const result = await exportDbTable({
      tableName: exportTable.value,
      format: exportFormat.value,
      scope: exportScope.value,
      database: exportDatabase.value,
      datasourceId: currentDatasourceId.value,
      limit: exportLimit.value,
      where: exportWhere.value || undefined,
      orderBy: exportOrderBy.value || undefined,
      orderDir: exportOrderDir.value,
    });
    if (!result.content) {
      message.warning("没有可导出的内容");
      return;
    }
    downloadText(result.fileName || `${exportTable.value}.${exportFormat.value}`, result.content,
      EXPORT_MIME[exportFormat.value] ?? "text/plain");
    message.success(
      `已导出 ${result.rowCount} 行${result.truncated ? `（达到上限 ${exportLimit.value} 行，已截断）` : ""}`
    );
    exportVisible.value = false;
  } catch (e) {
    message.error(`导出失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    exporting.value = false;
  }
}

// ==================== 行编辑 ====================
/** 值 → SQL 字面量：NULL 必须还原为 NULL 关键字，包成 'null' 会把字符串写进库 */
const sqlLiteral = (v: unknown): string => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

/** 等值条件：NULL 只能用 IS NULL 比较，= 'null' 恒不成立 */
const sqlWhereEq = (key: string, v: unknown): string =>
  v === null || v === undefined ? `${key} IS NULL` : `${key} = ${sqlLiteral(v)}`;

const rowDialogVisible = ref(false);
const rowDialogMode = ref<'edit' | 'add'>('add');
const rowForm = ref<Record<string, any>>({});
const rowSaving = ref(false);
const editingRow = ref<Record<string, any> | null>(null);

const openAddRowDialog = () => {
  rowDialogMode.value = 'add';
  rowForm.value = {};
  tableData.columns.forEach(col => { rowForm.value[col] = ''; });
  editingRow.value = null;
  rowDialogVisible.value = true;
};

const openEditRowDialog = (row: Record<string, any>) => {
  rowDialogMode.value = 'edit';
  // 表单值与「定位原值」都换成可读的时间格式串：SET 与 WHERE 必须同源，
  // 否则 WHERE 里的毫秒数在 MySQL 上永远匹配不到（详见 normalizeRowValues）
  const normalized = normalizeRowValues(row);
  rowForm.value = { ...normalized };
  editingRow.value = normalized;
  rowDialogVisible.value = true;
};

const saveRow = async () => {
  if (!activeTabObj.value) return;
  rowSaving.value = true;
  try {
    const tableName = activeTabObj.value.tableName;
    const database = activeTabObj.value.database || activeDatabase.value;
    if (rowDialogMode.value === 'add') {
      // 新增行：留空字段直接省略，交给自增主键/默认值接管
      const cols = Object.keys(rowForm.value).filter(k => rowForm.value[k] !== "" && rowForm.value[k] != null);
      const vals = cols.map(c => sqlLiteral(rowForm.value[c]));
      const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
      await executeDbSql(sql, currentDatasourceId.value, database);
      message.success('新增行成功');
    } else {
      // 编辑行：构建 UPDATE SQL（无主键元数据时退化为全字段等值定位）
      const sets = Object.keys(rowForm.value).map(k => `${k} = ${sqlLiteral(rowForm.value[k])}`);
      const wheres = Object.keys(editingRow.value || {}).map(k => sqlWhereEq(k, editingRow.value?.[k]));
      const sql = `UPDATE ${tableName} SET ${sets.join(', ')} WHERE ${wheres.join(' AND ')}`;
      const res = await executeDbSql(sql, currentDatasourceId.value, database);
      if (res?.affectedRows === 0) {
        message.warning('未匹配到任何行，数据可能已被其他会话修改，请刷新后重试');
      } else {
        message.success('更新行成功');
      }
    }
    rowDialogVisible.value = false;
    await refreshTableData();
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    rowSaving.value = false;
  }
};

const deleteRow = async (row: Record<string, any>) => {
  if (!activeTabObj.value) return;
  try {
    await ElMessageBox.confirm('确定删除这一行吗？', '删除确认', { type: 'warning' });
  } catch {
    return;
  }
  try {
    const tableName = activeTabObj.value.tableName;
    const keys = Object.keys(row);
    if (keys.length === 0) {
      message.warning('该行无可定位字段，已取消删除');
      return;
    }
    const wheres = keys.map(k => sqlWhereEq(k, row[k])).join(' AND ');
    const sql = `DELETE FROM ${tableName} WHERE ${wheres}`;
    const res = await executeDbSql(sql, currentDatasourceId.value, activeTabObj.value.database || activeDatabase.value);
    if (res?.affectedRows === 0) {
      message.warning('未匹配到任何行，数据可能已被其他会话修改，请刷新后重试');
    } else {
      message.success('删除行成功');
    }
    await refreshTableData();
  } catch (e) {
    message.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

const exportTableCsv = () => {
  if (tableData.rows.length === 0) {
    message.warning('没有数据可导出');
    return;
  }
  const headers = tableData.columns.join(',');
  const rows = tableData.rows.map((row: any) =>
    tableData.columns.map(col => `"${String(row[col] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = '\ufeff' + headers + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${activeTabObj.value?.tableName || 'table'}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  message.success('导出成功');
};
const tableLoading = ref(false);
/**
 * 表数据请求序号：只接受最后一次请求的结果。
 *
 * <p>切表/刷新的请求是并发的，先发的请求可能后到。没有这个护栏时，旧响应会把
 * {@code tableData}（列/行）写回上一张表，表现为「页签已切到新表、网格表头却还是旧表的列」，
 * 并且 {@code loadPkInfo} 也会把主键集合写成旧表的——直接导致「主键列不可编辑」误判。
 * 2026-10-02 验收复现。</p>
 */
const tableDataReqSeq = ref(0);
/** 本地表格列定义（ReTable 的列结构） */
type Column = { prop: string; label: string; width?: number; minWidth?: number; showOverflowTooltip?: boolean; slot?: string; fixed?: boolean | "left" | "right"; sortable?: boolean | "custom"; formatter?: (row: any) => string };

// ---------- E2 列显示 / 固定列 / 排序标志 ----------
/**
 * 每张表的列偏好（隐藏哪些、固定哪些）。
 *
 * <p>按 `库.表` 存，**不是**全局一份 —— 宽表和大宽表的可见列集完全不同，
 * 用全局一份会导致在 A 表隐藏的列到 B 表也消失，用户完全无法预期。</p>
 */
const COLUMN_PREF_KEY = "dbm-column-pref";
interface ColumnPref {
  hidden?: string[];
  pinned?: string[];
}
const columnPrefs = ref<Record<string, ColumnPref>>({});

/** 读列偏好；存储被写坏时降级为空对象而不是抛错（偏好丢了不该打不开表） */
function loadColumnPrefs(): Record<string, ColumnPref> {
  try {
    const raw = localStorage.getItem(COLUMN_PREF_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
columnPrefs.value = loadColumnPrefs();

/** 当前表的偏好键 */
function columnPrefKey(): string {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return "";
  return `${tab.database || activeDatabase.value}.${tab.tableName}`;
}

/** 当前表的隐藏列集合 */
const hiddenColumns = computed(() => {
  const key = columnPrefKey();
  return new Set(key ? columnPrefs.value[key]?.hidden || [] : []);
});
/** 当前表的固定列集合 */
const pinnedColumns = computed(() => {
  const key = columnPrefKey();
  return new Set(key ? columnPrefs.value[key]?.pinned || [] : []);
});

/** 落盘列偏好 */
function saveColumnPref(key: string, pref: ColumnPref): void {
  if (!key) return;
  columnPrefs.value = { ...columnPrefs.value, [key]: pref };
  try {
    localStorage.setItem(COLUMN_PREF_KEY, JSON.stringify(columnPrefs.value));
  } catch {
    message.warning("列偏好无法持久化（浏览器存储不可用），本次会话内仍有效");
  }
}

// 列显示设置弹窗。
// 命名刻意与「列编辑（DDL）弹窗」的 columnDialogVisible / openColumnDialog 区分开：
// 那是改表结构的，这是改网格显示的，两个都叫「列设置」会让读代码的人以为是一个东西。
const columnViewDialogVisible = ref(false);
/** 弹窗草稿：勾选可见性与固定 */
const columnViewDraft = ref<{ name: string; visible: boolean; pinned: boolean }[]>([]);

/** 打开列显示设置 */
function openColumnViewDialog(): void {
  const tab = activeTabObj.value;
  if (!tab?.tableName) {
    message.info("先打开一张表");
    return;
  }
  const hidden = hiddenColumns.value;
  const pinned = pinnedColumns.value;
  columnViewDraft.value = tableData.columns.map(c => ({
    name: c,
    visible: !hidden.has(c),
    // 主键列默认固定是 Navicat 的行为：定位行全靠它
    pinned: pinned.has(c) || pkColumns.value.has(c),
  }));
  columnViewDialogVisible.value = true;
}

/**
 * 应用列显示设置。
 *
 * <p>隐藏全部列会让网格变成空白且没有出口，所以**至少留一列**：
 * 用户「全不勾」时给提示，而不是让他面对一个空表还找不到恢复入口。</p>
 */
function applyColumnViewSettings(): void {
  const key = columnPrefKey();
  if (!key) return;
  const visible = columnViewDraft.value.filter(c => c.visible);
  if (visible.length === 0) {
    message.warning("至少保留一列，否则表格会变成空白且无法恢复");
    return;
  }
  saveColumnPref(key, {
    hidden: columnViewDraft.value.filter(c => !c.visible).map(c => c.name),
    pinned: columnViewDraft.value.filter(c => c.pinned && c.visible).map(c => c.name),
  });
  columnViewDialogVisible.value = false;
}

/** 全部显示 */
function setAllColumnsVisible(): void {
  columnViewDraft.value = columnViewDraft.value.map(c => ({ ...c, visible: true }));
}
/** 恢复默认（取消隐藏与固定） */
function resetColumnViewSettings(): void {
  const key = columnPrefKey();
  if (key) {
    saveColumnPref(key, {});
  }
  columnViewDialogVisible.value = false;
}

const tableColumns = computed<Column[]>(() => {
  const hidden = hiddenColumns.value;
  const pinned = pinnedColumns.value;
  // 固定列必须排在前面，否则 element-plus 的 fixed 定位会错
  const cols = tableData.columns.filter(c => !hidden.has(c));
  return cols
    .map(col => ({
      prop: col,
      // 排序标志自己画：`sortable: "custom"` 是**远程**排序，
      // ReTable 手里没有排序态（数据是重载回来的），所以它不会显示箭头。
      // 不画的后果是「点完表头看不出当前排的是哪一列、朝哪边」——
      // 页码都变了却不知道按什么排的，等于没有排序反馈。
      label: headerLabel(col) + sortMark(col),
      minWidth: 130,
      showOverflowTooltip: true,
      sortable: "custom" as const,
      ...(pinned.has(col) ? { fixed: "left" as const } : {}),
    }))
    .sort((a, b) => Number(pinned.has(b.prop)) - Number(pinned.has(a.prop)));
});

/**
 * 当前排序列的表头标志（升 ▲ / 降 ▼）。
 *
 * @param col 列名
 * @returns 标志文本，不排序时是空串
 */
function sortMark(col: string): string {
  if (sortState.prop !== col) return "";
  return sortState.order === "ASC" ? " ▲" : " ▼";
}

// ==================== 表设计（可编辑网格，Navicat 风格） ====================
/**
 * 「列属性」弹窗的入参形状。
 *
 * <p>刻意用结构化窄类型而不是让 {@link DesignRow} `extends DbColumnInfo` ——
 * 两者对 `size` 的声明不一致（网格用 `number | null` 表示「无长度」，
 * 接口用 `number`），`extends` 会直接报 TS2430。
 * 这里只列弹窗真正要读的字段，于是 `DbColumnInfo`（接口层返回）与
 * `DesignRow`（网格行）都能满足同一个签名。</p>
 */
interface ColumnAttrSource {
  name: string;
  type?: string;
  default?: string;
  remark?: string;
  nullable?: boolean;
  baseType?: string;
  unsigned?: boolean;
  zerofill?: boolean;
  autoIncrement?: boolean;
  charset?: string;
  collation?: string;
  enumValues?: string[];
  scale?: number | null;
}

/**
 * 设计行：包含原始值快照用于脏检测。
 *
 * <p>字段与共享列网格模型 {@link DesignColumnRow} **同名同义**（primaryKey / size / scale
 * / enumText …），因此行对象可以直接喂给 `DesignColumnGrid`，不需要再映射一层 ——
 * 这也是「改一处两处同时生效」的前提。额外字段（originalName / origin / 无符号 / 字符集
 * 等）只服务于本视图的脏检测与列属性弹窗，网格不展示但会原样带回去。</p>
 */
interface DesignRow extends DesignColumnRow {
  originalName: string;
  default?: string;
  remark?: string;
  baseType?: string;
  unsigned?: boolean;
  zerofill?: boolean;
  charset?: string;
  collation?: string;
  /** 枚举取值（列属性弹窗回填用；网格里展示的是 {@link DesignColumnRow.enumText} 文本） */
  enumValues?: string[];
  origin: { name: string; type: string; size: number | null; nullable: boolean; defaultValue: string; comment: string };
}

const designRows = ref<DesignRow[]>([]);
const designLoading = ref(false);

/** 方言类型名 → 编辑用规范类型（H2 返回 CHARACTER VARYING 等） */
const COLUMN_TYPE_ALIAS: Record<string, string> = {
  "CHARACTER VARYING": "VARCHAR",
  CHARACTER: "VARCHAR",
  INTEGER: "INT",
  NUMERIC: "DECIMAL",
  TIMESTAMP: "DATETIME",
  DATE: "DATETIME",
  TIME: "DATETIME",
  BOOL: "BOOLEAN",
  BIT: "BOOLEAN",
  REAL: "FLOAT",
  "DOUBLE PRECISION": "DOUBLE",
  CLOB: "TEXT",
  BINARY: "BLOB",
  VARBINARY: "BLOB",
};

/**
 * 归一化方言类型名到设计网格下拉项
 * @param type 元数据类型名
 */
function normalizeColumnType(type?: string | null): string {
  const raw = String(type ?? "").toUpperCase().trim();
  const mapped = COLUMN_TYPE_ALIAS[raw] ?? raw;
  return columnTypeOptions.includes(mapped) ? mapped : "VARCHAR";
}

/** 列结构（供索引弹窗 / 建表语句兜底） */
const designColumns = computed<DbColumnInfo[]>(() =>
  designRows.value.map(r => ({
    name: r.name,
    type: r.type,
    size: r.size ?? undefined,
    nullable: r.nullable,
    // 共享网格编辑的是 primaryKey（唯一可信来源），isPrimaryKey 只是历史别名
    isPrimaryKey: r.primaryKey,
    default: r.defaultValue,
    remark: r.comment,
  }) as DbColumnInfo),
);

/** 拖动中的设计行下标（用于高亮放置目标） */
const designDragIdx = ref<number | null>(null);
/** 当前悬停的设计行下标（用于高亮放置目标） */
const designDragOverIdx = ref<number | null>(null);

/** 列拖拽开始：记录来源行；只允许列结构非空时拖 */
function onDesignDragStart(i: number, event: DragEvent): void {
  if (designRows.value.length < 2) {
    event.preventDefault();
    return;
  }
  designDragIdx.value = i;
  designDragOverIdx.value = null;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(i));
  }
}

/** 悬停目标：让放置行显示高亮 */
function onDesignDragOver(i: number): void {
  if (designDragIdx.value !== null) {
    designDragOverIdx.value = i;
  }
}

/** 放置：重排 designRows 并保存新的列顺序 */
async function onDesignDrop(i: number): Promise<void> {
  const from = designDragIdx.value;
  designDragIdx.value = null;
  designDragOverIdx.value = null;
  if (from === null || from === i || from < 0 || i < 0 || from >= designRows.value.length || i >= designRows.value.length) {
    return;
  }
  const rows = [...designRows.value];
  const [moved] = rows.splice(from, 1);
  rows.splice(i, 0, moved);
  designRows.value = rows;
  await saveColumnOrder();
}

/** 保存拖拽后的列顺序：逐列 MODIFY ... AFTER 前一列（第一列 FIRST） */
async function saveColumnOrder(): Promise<void> {
  const rows = designRows.value;
  const tab = activeTabObj.value;
  if (!tab?.tableName || rows.length < 2) return;
  designLoading.value = true;
  try {
    // 顺序是相对的：从第二列开始，把该列排到上一列之后；第一列排到最前。
    // 锚点必须用 originalName（数据库里真实存在的列名）：
    // 拖拽时行的 name 可能还是用户刚改的未保存值，拿它当 AFTER 锚会 1054。
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const afterColumn = idx === 0 ? "" : rows[idx - 1].originalName;
      await modifyDbColumn(tab.tableName, row.originalName, {
        ...designPayload(row),
        afterColumn,
        database: tab.database,
      });
    }
    message.success("列顺序已更新");
    await loadTableDesign(tab);
  } catch (e) {
    message.error(`保存列顺序失败: ${String((e as Error)?.message ?? e)}`);
    await loadTableDesign(tab);
  } finally {
    designLoading.value = false;
    designDragIdx.value = null;
    designDragOverIdx.value = null;
  }
}

/**
 * 行是否有改动
 *
 * <p>参数类型用共享模型 {@link DesignColumnRow}（不是更宽的 DesignRow）：共享列网格按
 * 这个签名回调，TS 的逆变规则下窄签名无法传入。内部再断言回 DesignRow 取 origin 快照。</p>
 *
 * @param row 设计行
 */
function isDesignDirty(row: DesignColumnRow): boolean {
  const full = row as DesignRow;
  const o = full.origin;
  return row.name !== o.name
    || row.type !== o.type
    || (row.size ?? null) !== (o.size ?? null)
    || row.nullable !== o.nullable
    || row.defaultValue !== o.defaultValue
    || row.comment !== o.comment;
}

/** 共享列网格的行 key 自增（行对象要能直接喂给 DesignColumnGrid） */
let designRowSeq = 0;

/**
 * 表结构网格高度：设计视图是整块区域，交给 ReTable 的 maxHeight 走内滚。
 *
 * <p>网格是共享的 DesignColumnGrid（内部 ReTable），自身不撑满高度；
 * 这里给一个足够大的上限，让行多时在表体内滚动而不是把工具栏顶出视口。</p>
 */
const designGridHeight = "calc(100vh - 320px)";

/**
 * 拖拽排序（共享网格回调）：重排 designRows 后落库列顺序。
 *
 * @param from 来源下标
 * @param to   目标下标
 */
async function onDesignReorder(from: number, to: number): Promise<void> {
  if (from === to || from < 0 || to < 0 || from >= designRows.value.length || to >= designRows.value.length) {
    return;
  }
  const rows = [...designRows.value];
  const [moved] = rows.splice(from, 1);
  rows.splice(to, 0, moved);
  designRows.value = rows;
  await saveColumnOrder();
}

/** 脏行数量（保存按钮角标） */
const designDirtyCount = computed<number>(() => designRows.value.filter(isDesignDirty).length);

/**
 * 组装列修改载荷
 * @param row 设计行
 */
function designPayload(row: DesignRow) {
  return {
    columnName: row.name,
    type: row.type,
    size: row.size ?? undefined,
    nullable: row.nullable,
    defaultValue: row.defaultValue,
    comment: row.comment,
    datasourceId: currentDatasourceId.value,
  };
}

/**
 * 保存单个字段（单元格编辑后行内「保存」）
 * @param row 设计行
 */
/**
 * 保存单行。
 *
 * <p>参数用共享模型 DesignColumnRow（共享网格的 @save-row 按此签名回调），
 * 内部断言回 DesignRow 取 originalName 做修改锚点。</p>
 *
 * @param row 设计行
 */
async function saveDesignRow(row: DesignColumnRow): Promise<void> {
  const full = row as DesignRow;
  const tab = activeTabObj.value;
  if (!tab?.tableName || !isDesignDirty(row)) return;
  try {
    await modifyDbColumn(tab.tableName, full.originalName, { ...designPayload(full), database: tab.database });
    message.success(`字段 ${row.name} 已保存`);
    await loadTableDesign(tab);
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 保存全部改动字段 */
async function saveDesignAll(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  const dirty = designRows.value.filter(isDesignDirty);
  if (!dirty.length) return;
  designLoading.value = true;
  try {
    for (const row of dirty) {
      await modifyDbColumn(tab.tableName, row.originalName, { ...designPayload(row), database: tab.database });
    }
    message.success(`已保存 ${dirty.length} 个字段变更`);
    await loadTableDesign(tab);
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    designLoading.value = false;
  }
}

// 设计页签内子页签：表结构 / 索引 / 外键
const designSubTab = ref<"columns" | "indexes" | "foreignKeys">("columns");
const indexes = ref<DbIndexInfo[]>([]);
const indexLoading = ref(false);
const indexColumnDefs = [
  { prop: "indexName", label: "索引名", minWidth: 160 },
  { prop: "columnName", label: "列名", minWidth: 120 },
  { prop: "nonUnique", label: "非唯一", width: 90, formatter: (r: any) => (r.nonUnique ? "是" : "否") },
  { prop: "indexType", label: "类型", width: 80 },
  { prop: "seqInIndex", label: "序号", width: 80 },
  { prop: "__actions", label: "操作", width: 90, slot: "actions", fixed: "right" as const },
];

// 外键页签（可增删）
const foreignKeys = ref<DbForeignKeyInfo[]>([]);
const fkLoading = ref(false);
const FOREIGN_KEY_RULE: Record<number, string> = {
  0: "CASCADE", 1: "RESTRICT", 2: "SET NULL", 3: "NO ACTION", 4: "SET DEFAULT",
};
const foreignKeyColumnDefs = [
  { prop: "fkName", label: "约束名", minWidth: 160 },
  { prop: "columnName", label: "本表列", minWidth: 130 },
  { prop: "refTable", label: "引用表", minWidth: 140 },
  { prop: "refColumn", label: "引用列", minWidth: 130 },
  { prop: "updateRule", label: "更新规则", width: 110, formatter: (r: any) => FOREIGN_KEY_RULE[r.updateRule] ?? r.updateRule ?? "" },
  { prop: "deleteRule", label: "删除规则", width: 110, formatter: (r: any) => FOREIGN_KEY_RULE[r.deleteRule] ?? r.deleteRule ?? "" },
  { prop: "__actions", label: "操作", width: 80, slot: "fk-actions", fixed: "right" as const },
];

/** 引用动作的可选项（与后端白名单一致） */
const FK_ACTIONS = ["CASCADE", "RESTRICT", "SET NULL", "NO ACTION"] as const;

/** 新增外键弹窗 */
const fkDialogVisible = ref(false);
const fkSaving = ref(false);
const fkForm = reactive({
  name: "",
  column: "",
  refTable: "",
  refColumn: "",
  onUpdate: "RESTRICT",
  onDelete: "RESTRICT",
});

/**
 * 当前表的列（新增外键时的本表列候选）。
 *
 * <p>先读树节点的展开缓存，取不到就退回设计页的列。
 * 树缓存只在**用户展开过该表节点**时才有值，而从工具栏/搜索进入设计视图时
 * 表节点未必展开过 —— 早先只读树缓存，导致「本表列」下拉是空的，用户没法建外键。</p>
 */
function designTableColumns(): DbColumnInfo[] {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return designColumns.value;
  const cached = columnsOf(tab.database ?? "", tab.tableName);
  return cached.length ? cached : designColumns.value;
}

/**
 * 打开新增外键弹窗，预填一个默认值。
 */
/**
 * 引用表的列（新增外键时的「引用列」候选）。
 *
 * <p><b>必须主动拉</b>：树缓存只在用户展开过该表节点时有值，而引用表往往是
 * 用户没展开过的另一张表；设计页兜底也只覆盖「引用表就是当前表」这一种情况。
 * 因此选了引用表就调一次接口，拿到后再渲染下拉。</p>
 */
const fkRefColumns = ref<DbColumnInfo[]>([]);

/** 拉取引用表的列 */
async function loadForeignKeyRefColumns(table: string): Promise<void> {
  const db = activeTabObj.value?.database ?? "";
  if (!db || !table) {
    fkRefColumns.value = [];
    return;
  }
  const cached = columnsOf(db, table);
  if (cached.length) {
    fkRefColumns.value = cached;
    return;
  }
  try {
    fkRefColumns.value = (await fetchTableColumns(table, currentDatasourceId.value, db)) || [];
  } catch (e) {
    fkRefColumns.value = [];
    message.warning(`读取引用表结构失败：${String((e as Error)?.message ?? e)}`);
  }
}

/** 切换引用表 → 重新加载其列，并清掉已选的引用列（不同表的列没有可比性） */
watch(() => fkForm.refTable, table => {
  fkForm.refColumn = "";
  void loadForeignKeyRefColumns(table);
});

/**
 * 打开新增外键弹窗，预填一个默认值。
 */
function openAddForeignKey(): void {
  const tab = activeTabObj.value;
  if (!tab?.tableName || !tab.database) return;
  const cols = designTableColumns();
  const firstCol = cols[0]?.name ?? "";
  const base = tab.tableName.replace(/[^A-Za-z0-9_]/g, "_");
  fkForm.name = `fk_${base}_1`;
  fkForm.column = firstCol;
  fkForm.refTable = tablesOf(tab.database).find(t => t.name !== tab.tableName)?.name ?? "";
  fkForm.refColumn = "";
  fkForm.onUpdate = "RESTRICT";
  fkForm.onDelete = "RESTRICT";
  fkRefColumns.value = [];
  fkDialogVisible.value = true;
}

/**
 * 提交新增外键。
 */
async function submitAddForeignKey(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.tableName || !tab.database) return;
  if (!fkForm.name || !fkForm.column || !fkForm.refTable || !fkForm.refColumn) {
    message.warning("请填写完整的约束名、本表列、引用表与引用列");
    return;
  }
  fkSaving.value = true;
  try {
    await addDbForeignKey(tab.tableName, {
      name: fkForm.name,
      columns: [fkForm.column],
      refTable: fkForm.refTable,
      refColumns: [fkForm.refColumn],
      onUpdate: fkForm.onUpdate,
      onDelete: fkForm.onDelete,
      datasourceId: currentDatasourceId.value,
      database: tab.database,
    });
    message.success("外键已创建");
    fkDialogVisible.value = false;
    await loadForeignKeys();
  } catch (e) {
    message.error(`新增外键失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    fkSaving.value = false;
  }
}

/**
 * 删除一个外键。
 *
 * <p>必须先判 {@code row.fkName} 存在：内核对外键名缺失的行仍会返回一条记录，
 * 拿 undefined 去拼路径会退化成删「表名/foreign-key/undefined」，
 * 报一个与真实原因无关的 404。</p>
 *
 * @param row 外键行
 */
async function removeForeignKey(row: DbForeignKeyInfo): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.tableName || !tab.database) return;
  if (!row.fkName) {
    message.warning("该外键没有名称，无法删除");
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除外键「${row.fkName}」？`, "确认删除", { type: "warning" });
  } catch {
    return;
  }
  try {
    await dropDbForeignKey(tab.tableName, row.fkName, currentDatasourceId.value, tab.database);
    message.success("已删除");
    await loadForeignKeys();
  } catch (e) {
    message.error(`删除外键失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 打开外键页签并加载 */
async function openForeignKeys(): Promise<void> {
  designSubTab.value = "foreignKeys";
  await loadForeignKeys();
}

/** 加载当前表外键 */
async function loadForeignKeys(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  fkLoading.value = true;
  try {
    foreignKeys.value = await fetchForeignKeys(tab.tableName, currentDatasourceId.value, tab.database);
  } catch (e) {
    foreignKeys.value = [];
    message.error(`加载外键失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    fkLoading.value = false;
  }
}

// 列编辑弹窗
const columnDialogVisible = ref(false);
const columnDialogMode = ref<"add" | "edit">("add");

/**
 * 列类型全集的两个视图：扁平下拉项与分组下拉项。
 *
 * <p>类型表本身（{@link COLUMN_TYPE_GROUPS}）已抽到 `utils/columnTypes.ts` ——
 * 「设计表」建表对话框要与这里用同一份，否则下拉选项会各改各的。</p>
 *
 * <p>分组项刻意是计算属性而不是常量：`openColumnDialog` 遇到后端类型表以外的类型时
 * 会往分组里补一条「其他」，常量快照看不到补进去的项。</p>
 */
const columnTypeOptions = COLUMN_TYPE_GROUPS.flatMap(g => g.types);
const columnTypeSelectOptions = computed(() =>
  COLUMN_TYPE_GROUPS.flatMap(g => g.types.map(t => ({ label: t, value: t, group: g.label })))
);

/** ON UPDATE 可选值（后端只放行这几个） */
const ON_UPDATE_OPTIONS = ["", "CURRENT_TIMESTAMP", "NOW()", "CURRENT_TIMESTAMP(3)", "CURRENT_TIMESTAMP(6)"];
/** ON UPDATE 下拉项 */
const onUpdateOptions = ON_UPDATE_OPTIONS.map(v => ({ label: v || "不设置", value: v }));
/** 索引类型下拉项（空 = 由内核决定） */
const indexTypeOptions = ["", "BTREE", "HASH", "RTREE"].map(v => ({
  label: v || "默认（内核决定）",
  value: v,
}));
/** 存储引擎下拉项（内核下发） */
const engineOptions = computed(() =>
  tableOptionValues.value.engines.map(e => ({ label: e, value: e }))
);
/** 设计视图的列候选（索引列 / 主键列共用） */
const designColumnOptions = computed(() =>
  designColumns.value.map(c => ({ label: c.name, value: c.name }))
);

/** 列属性表单（对齐后端 DbColumnDef 的全部维度） */
const columnForm = reactive({
  columnName: "",
  type: "VARCHAR",
  size: 255 as number | undefined,
  scale: undefined as number | undefined,
  unsigned: false,
  zerofill: false,
  charset: "",
  collation: "",
  nullable: true,
  defaultValue: "",
  onUpdate: "",
  autoIncrement: false,
  /** ENUM / SET 取值：用换行分隔录入，避免为每个取值再做一个输入框 */
  enumValues: "",
  comment: "",
});
/** 当前正在编辑的列（弹窗打开期间持有；仅弹窗内部读，不参与脏检测） */
const editingDesignColumn = ref<ColumnAttrSource | null>(null);

/** 当前列类型是否需要长度输入 */
const columnNeedsSize = computed<boolean>(() => SIZE_REQUIRED.has(columnForm.type));
/** 当前列类型是否允许小数位 */
const columnAllowsScale = computed<boolean>(() => SCALE_ALLOWED.has(columnForm.type));
/** 当前列类型是否允许 UNSIGNED */
const columnAllowsUnsigned = computed<boolean>(() => UNSIGNED_ALLOWED.has(columnForm.type));
/** 当前列类型是否是枚举/集合（决定是否要展示取值列表） */
const columnIsEnum = computed<boolean>(() => columnForm.type === "ENUM" || columnForm.type === "SET");
/** 当前列类型是否是字符类（决定是否展示字符集/排序规则） */
const columnIsChar = computed<boolean>(() =>
  /CHAR|TEXT|ENUM|SET|JSON/.test(columnForm.type)
);

/** 表属性 / 可选值（内核下发，不在前端硬编码） */
const tableOptionValues = ref<{ engines: string[]; collations: DbCollationItem[] }>({
  engines: [],
  collations: [],
});
/** 按当前列的字符集过滤后的排序规则 */
const columnCollationOptions = computed<DbCollationItem[]>(() => {
  const all = tableOptionValues.value.collations;
  if (!columnForm.charset) return all;
  return all.filter(c => c.charset === columnForm.charset);
});

// 索引新建弹窗
const indexDialogVisible = ref(false);
const indexForm = reactive({
  indexName: "",
  columns: [] as string[],
  unique: false,
  indexType: "BTREE",
  /** 各列前缀长度，与 columns 同序；0 表示整列 */
  prefixes: [] as number[],
  primary: false,
});

// 表属性弹窗
const optionsDialogVisible = ref(false);
const optionsSaving = ref(false);
const optionsForm = reactive({
  engine: "",
  charset: "",
  collation: "",
  comment: "",
  autoIncrement: undefined as number | undefined,
});
const tableOptionOriginal = reactive({
  engine: "",
  charset: "",
  collation: "",
  comment: "",
  autoIncrement: undefined as number | undefined,
});

/** 主键设置弹窗 */
const pkDialogVisible = ref(false);
const pkSaving = ref(false);
/** 待设为主键的列（顺序即复合主键列序）；名字避开已有的 pkColumns（数据网格用的主键列集合） */
const pkDialogColumns = ref<string[]>([]);

/** 表属性的排序规则候选（按当前所选字符集过滤） */
const optionsCollationList = computed<DbCollationItem[]>(() => {
  const all = tableOptionValues.value.collations;
  if (!optionsForm.charset) return all;
  return all.filter(c => c.charset === optionsForm.charset);
});
/** 表属性的排序规则下拉项 */
const optionsCollationOptions = computed(() =>
  optionsCollationList.value.map(c => ({ label: c.collation, value: c.collation }))
);

/**
 * 按字符集拉取可用的排序规则。
 *
 * <p>内核返回的排序规则有数百条，一次性塞进下拉既慢又难用；
 * 先按字符集筛一遍，选中字符集后再刷新。</p>
 *
 * @param charset 字符集，空表示全部
 */
async function loadTableOptionValues(charset?: string) {
  const tab = activeTabObj.value;
  try {
    const data = await fetchDbTableOptionValues(charset, currentDatasourceId.value, tab?.database);
    if (data?.engines || data?.collations) {
      tableOptionValues.value = { engines: data.engines ?? [], collations: data.collations ?? [] };
    }
  } catch {
    // 拉不到就让下拉保持上一次的结果，不阻塞主流程（内核可能不支持 information_schema.ENGINES）
  }
}

/**
 * 把 ENUM / SET 的文本录入解析成取值数组。
 *
 * <p>按逗号或换行分隔，并逐个 trim；空段直接丢弃（用户在末尾多打一个逗号是常态）。
 * 保留空格的取值（`ENUM('a b')` 是合法的），所以只在**首尾** trim。</p>
 *
 * @returns 取值数组
 */
function parseEnumValues(): string[] {
  return columnForm.enumValues
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// 单元格内联编辑：当前正在编辑的单元格（用行对象引用定位）
const editingCell = ref<{ row: Record<string, any>; column: string; value: string } | null>(null);

/**
 * 回写正在编辑的单元格文本。
 *
 * <p>模板内联箭头函数无法保留 {@code editingCell} 的非空收窄，统一收敛到此处判空后赋值。
 *
 * @param v 输入框回传的新值
 */
function setEditingCellValue(v: string | number | null | undefined): void {
  if (editingCell.value) {
    editingCell.value.value = v == null ? "" : String(v);
  }
}
// 主键列集合 + 列类型映射，用于判断可编辑/自增/数字/日期/长文本
const pkColumns = ref(new Set<string>());
const columnTypes = ref(new Map<string, string>());
const longTextColumns = ref(new Set<string>());

/**
 * 数据网格的 ReTable 持久化键：同一个 tableId 的列配置落在同一份存档里。
 *
 * <p>必须按「库.表」分键：DBM 是单 ReTable 实例复用、切表只换 props.columns；
 * 不传 tableId 时组件回落到路由 path（db-manager 路由），所有表的列序共用
 * 同一个存档 —— A 表拖完的顺序会把 B 表的覆盖掉，刷新就串。以前「表头列
 * 一动就丢失」的真因不是没落盘，是存档被别的表反复覆盖了。</p>
 *
 * @returns 数据源.库.表 三段键；切表时自动换键，组件的 tableId/columns
 * watcher 会重载对应存档（仅当季数据，无意义的顺序也被过滤）。
 */
const tableGridId = computed(() => {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return "";
  return `dbm-grid:${currentDatasourceId.value}.${tab.database || activeDatabase.value}.${tab.tableName}`;
});

/**
 * ReTable 多选聚合键。 按 rowKey 字段聚合选中行，默认值是 id；被管理的库表未必有 id 列
 * （例如 MySQL 任意业务表），rowKey 取不到值时选中行会被聚合成空数组，
 * 表现为勾选框可选但「已选 N 行 / 删除选中」不出现。这里优先用真实主键列，
 * 无主键表退回首列，仍无列时回退组件默认值。</p>
 */
const gridRowKey = computed<string>(() => {
  const pk = [...pkColumns.value][0];
  if (pk) {
    return pk;
  }
  return tableData.columns.length > 0 ? tableData.columns[0] : "id";
});

/** 拉取当前表的主键列与列类型元数据（单元格编辑/新增行按类型渲染依赖它） */
async function loadPkInfo(tab: Tab | undefined) {
  if (!tab?.tableName) return;
  try {
    const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
    // 期间可能已切表：过期响应会把主键集合/列类型写成上一张表的，必须丢弃
    if (activeTab.value !== tab.id) {
      return;
    }
    const pk = new Set<string>();
    const types = new Map<string, string>();
    const long = new Set<string>();
    cols.forEach(c => {
      types.set(c.name, (c.type || "").toUpperCase());
      if (c.isPrimaryKey) pk.add(c.name);
      const t = (c.type || "").toUpperCase();
      if (t.includes("TEXT") || t.includes("BLOB") || t.includes("CLOB")) long.add(c.name);
    });
    pkColumns.value = pk;
    columnTypes.value = types;
    longTextColumns.value = long;
  } catch {
    // 元数据加载失败不阻塞数据展示
  }
}

/** 单元格值展示：null 显示为空 */
function formatCellValue(v: unknown) {
  return v === null || v === undefined ? "" : String(v);
}

// ---------- BLOB / 二进制 / 长文本查看器（Navicat 的 Blob Viewer） ----------
/** 该列是不是二进制类型（值以 base64 下发，必须解成字节才看得出内容） */
function isBinaryCol(col: string): boolean {
  const t = (columnTypes.value.get(col) || "").toLowerCase();
  return t.includes("blob") || t.includes("binary") || t === "bytea";
}

/** 该列是不是长文本（值直接是文本，但太长不宜塞进格子） */
function isLongTextCol(col: string): boolean {
  return longTextColumns.value.has(col);
}

/** base64 解码成字节，失败返回空数组（宁可显示「无法解码」也不抛） */
function base64ToBytes(b64: string): Uint8Array {
  try {
    const raw = atob((b64 || "").replace(/\s+/g, ""));
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  } catch {
    return new Uint8Array(0);
  }
}

/** 字节的十六进制全文（连续大写） */
function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += b.toString(16).padStart(2, "0").toUpperCase();
  return s;
}

/** 字节按 UTF-8 解码（不可解码的字节用替换符，不抛） */
function bytesToText(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
}

/** 按 MIME 魔数猜图片类型，不是图片返回空串 */
function sniffImageMime(bytes: Uint8Array): string {
  if (bytes.length < 4) return "";
  const sig = (a: number, b: number, c: number, d: number) =>
    bytes[0] === a && bytes[1] === b && bytes[2] === c && bytes[3] === d;
  if (sig(0xff, 0xd8, 0xff, 0xe0) || sig(0xff, 0xd8, 0xff, 0xe1)) return "image/jpeg";
  if (sig(0x89, 0x50, 0x4e, 0x47)) return "image/png";
  if (sig(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (sig(0x42, 0x4d, 0x00, 0x00)) return "image/bmp";
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return "image/webp";
  }
  return "";
}

const BLOB_MODE_LABELS: Record<string, string> = {
  text: "文本",
  hex: "HEX",
  image: "图片",
};
const blobVisible = ref(false);
const blobEditing = ref(false);
const blobSaving = ref(false);
const blobMode = ref<"text" | "hex" | "image">("hex");
const blobColumn = ref("");
const blobBase64 = ref("");
const blobText = ref("");
const blobHex = ref("");
const blobImageSrc = ref("");
const blobIsBinary = ref(false);
/** 当前查看器对应的行（保存时要靠它定位主键） */
const blobRow = ref<Record<string, unknown> | null>(null);

const blobModes = computed(() => {
  const modes: ("text" | "hex" | "image")[] = [];
  if (!blobIsBinary.value) {
    modes.push("text");
  }
  modes.push("hex");
  if (blobImageSrc.value) {
    modes.push("image");
  }
  // 只有可解码成文本的二进制才提供「文本」视图。
  // bytesToText 对不可解码的字节会给出替换符 U+FFFD，因此「解码后没有替换符」才是可读文本；
  // 此前正则被写成了「至多一个 U+951F」，恒为真，导致纯二进制（图片、压缩包）也被塞进满是替换符的「文本」页签。
  if (blobIsBinary.value && blobText.value && !/\uFFFD/.test(blobText.value)) {
    modes.unshift("text");
  }
  return modes;
});

const blobTitle = computed(() => `内容查看器 · ${blobColumn.value}`);
const blobMeta = computed(() => {
  const bytes = blobBase64.value ? base64ToBytes(blobBase64.value).length : 0;
  return blobIsBinary.value
    ? `二进制 · ${formatBytes(bytes)}`
    : `文本 · ${blobText.value.length} 字符`;
});

/** 人类可读的字节数 */
function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** 格子里的摘要：一行就能看出「多大、什么类型」 */
function blobSummary(col: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "(空)";
  if (!isBinaryCol(col)) {
    const s = String(value);
    return `${s.length} 字符`;
  }
  const bytes = base64ToBytes(String(value)).length;
  const mime = sniffImageMime(base64ToBytes(String(value)));
  return `${formatBytes(bytes)}${mime ? " · 图片" : ""}`;
}

function blobIcon(col: string, value: unknown): string {
  if (!isBinaryCol(col)) return "Document";
  if (value === null || value === undefined || value === "") return "Document";
  const mime = sniffImageMime(base64ToBytes(String(value)));
  return mime ? "Picture" : "Coin";
}

/**
 * 打开内容查看器。
 *
 * @param row   当前行
 * @param col   列名
 * @param value 单元格原始值（二进制列是 base64 文本）
 */
function openBlobViewer(row: Record<string, unknown>, col: string, value: unknown): void {
  blobRow.value = row;
  blobColumn.value = col;
  blobEditing.value = false;
  blobIsBinary.value = isBinaryCol(col);
  if (value === null || value === undefined) {
    blobBase64.value = "";
    blobText.value = "";
    blobHex.value = "";
    blobImageSrc.value = "";
  } else if (blobIsBinary.value) {
    blobBase64.value = String(value);
    const bytes = base64ToBytes(String(value));
    blobHex.value = bytesToHex(bytes);
    blobText.value = bytesToText(bytes);
    const mime = sniffImageMime(bytes);
    blobImageSrc.value = mime
      ? `data:${mime};base64,${String(value).replace(/\s+/g, "")}`
      : "";
  } else {
    blobText.value = String(value);
    blobBase64.value = btoa(String(value).split("").map(c =>
      // 非 ASCII 用 encodeURIComponent 兜底，否则 btoa 会抛
      c.charCodeAt(0) < 128 ? c : "%" + c.charCodeAt(0).toString(16).padStart(2, "0"),
    ).join(""));
    blobHex.value = bytesToHex(base64ToBytes(blobBase64.value));
    blobImageSrc.value = "";
  }
  blobMode.value = blobImageSrc.value ? "image" : (blobIsBinary.value ? "hex" : "text");
  blobVisible.value = true;
}

/** 下载原始内容 */
function downloadBlob(): void {
  const bytes = base64ToBytes(blobBase64.value);
  const mime = sniffImageMime(bytes) || "application/octet-stream";
  // 包成 ArrayBuffer 再给 Blob：TS 的 Uint8Array 泛型与 BlobPart 不兼容
  const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${blobColumn.value}.${mime.split("/")[1] || "bin"}`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * 保存查看器里的编辑。
 *
 * <p>二进制列在文本视图里改完要**重新编码成 base64**；
 * 而后端会把 base64 解回字节再绑定（否则存进去的是 base64 的 ASCII 文本）。</p>
 */
async function saveBlob(): Promise<void> {
  const row = blobRow.value;
  const tab = activeTabObj.value;
  if (!row || !tab?.tableName) return;
  const keys = Object.keys(row);
  const primaryKey: Record<string, unknown> = {};
  for (const k of pkColumns.value) {
    if (keys.includes(k)) primaryKey[k] = row[k];
  }
  if (Object.keys(primaryKey).length === 0) {
    message.error("该表没有主键，无法定位要修改的行");
    return;
  }
  const value = blobIsBinary.value
    // 用 TextEncoder 重新编码：手工 charCodeAt 拼接对非 ASCII 会算错字节数
    ? bytesToBase64(new TextEncoder().encode(blobText.value))
    : blobText.value;
  blobSaving.value = true;
  try {
    await updateDbCell({
      tableName: tab.tableName,
      column: blobColumn.value,
      newValue: value,
      primaryKey,
      database: tab.database || activeDatabase.value,
      datasourceId: currentDatasourceId.value,
    });
    row[blobColumn.value] = value;
    blobEditing.value = false;
    blobBase64.value = value;
    if (blobIsBinary.value) {
      const bytes = base64ToBytes(String(value));
      blobHex.value = bytesToHex(bytes);
      const mime = sniffImageMime(bytes);
      blobImageSrc.value = mime ? `data:${mime};base64,${value}` : "";
    }
    message.success("已保存");
    void loadTableData(tab);
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    blobSaving.value = false;
  }
}

/** 字节数组 → base64（分块喂给 btoa，避免超长参数爆栈） */
function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** 按列类型决定提交值：数字列转 Number，空串转 null */
function normalizeCellValue(col: string, raw: string) {
  if (raw === "") return null;
  const t = (columnTypes.value.get(col) || "").toUpperCase();
  if (/INT|DECIMAL|NUMERIC|FLOAT|DOUBLE/.test(t)) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : raw;
  }
  return raw;
}

function isNumericCol(col: string) {
  return /INT|DECIMAL|NUMERIC|FLOAT|DOUBLE/.test(columnTypes.value.get(col) || "");
}
/**
 * 该列 + 该取值是否该用日期 / 时间选择器。
 *
 * <p>口径统一到 {@code utils/dbTemporal.resolveTemporalKind}，格内编辑与
 * 行弹窗都走它 —— 以前格内编辑压根不看类型（时间列只能当文本框手敲），
 * 弹窗则是另一份正则 {@code isDateCol}，两处判定必然漂移。</p>
 *
 * <p>{@code resolveTemporalKind} 还会做一次修正：类型名是 {@code DATE}
 * 但值里带非零时刻（Oracle DATE 是「日期 + 时刻」）时升级成 datetime，
 * 否则用户一选值就把时刻清零了，而界面上完全看不出丢了东西。</p>
 *
 * @param col   列名
 * @param value 当前取值（数据库原样下发）
 * @returns 选择器形态；不是日期时间类返回 null
 */
function temporalKindOf(col: string, value: unknown): DbTemporalKind | null {
  return resolveTemporalKind(columnTypes.value.get(col), value);
}

/**
 * 把一整行的日期 / 时间列收敛成选择器格式串。
 *
 * <p><b>为什么必须在父层做</b>：后端把 {@code DATE / TIME / TIMESTAMP / YEAR}
 * 序列化成 epoch 毫秒数（{@code d_col: 1792944000000}），原样带进行弹窗会出两种错：</p>
 * <ul>
 *   <li>{@code SET d_col = 1792944000000} —— 把毫秒数写进 DATE 列；</li>
 *   <li>{@code WHERE d_col = 1792944000000} —— MySQL 拿 DATE 列按数字比较
 *       （{@code 20261026}），永远匹配不到，UPDATE 静默影响 0 行，
 *       用户还以为保存成功了。</li>
 * </ul>
 *
 * <p>以前把希望寄托在子组件挂载时回写表单值上，但弹窗不销毁时子组件根本不会
 * 重新挂载，回写只发生在「第一次打开」—— 第二次打开就退回毫秒数。
 * 在这里一次性收敛，SET 与 WHERE 拿到的就是同一份可读值。</p>
 *
 * @param row 表格行原值
 * @returns 新对象，日期时间列已换成 {@code YYYY-MM-DD HH:mm:ss} 之类的格式串
 */
function normalizeRowValues(row: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...row };
  for (const col of Object.keys(out)) {
    const kind = resolveTemporalKind(columnTypes.value.get(col), out[col]);
    if (kind) {
      out[col] = toTemporalPickerValue(kind, out[col]);
    }
  }
  return out;
}
/** 自增主键：主键列且为整数类型，新增行时留空由数据库生成 */
function isAutoIncrement(col: string) {
  return pkColumns.value.has(col) && /INT/.test(columnTypes.value.get(col) || "");
}

function startEditCell(row: Record<string, any>, col: string, value: unknown) {
  if (pkColumns.value.has(col)) {
    message.info("主键列不可编辑");
    return;
  }
  editingCell.value = { row, column: col, value: value === null || value === undefined ? "" : String(value) };
}

function cancelCell() {
  editingCell.value = null;
}

async function saveCell(row: Record<string, any>, col: string) {
  const cell = editingCell.value;
  if (!cell) return;
  editingCell.value = null;
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  const pk: Record<string, unknown> = {};
  pkColumns.value.forEach(k => { pk[k] = row[k]; });
  if (Object.keys(pk).length === 0) {
    message.warning("该表无主键，无法定位更新");
    return;
  }
  const newValue = normalizeCellValue(col, cell.value);
  try {
    const affected = await updateDbCell({
      tableName: tab.tableName,
      column: col,
      newValue,
      primaryKey: pk,
      database: tab.database || activeDatabase.value,
      datasourceId: currentDatasourceId.value,
    });
    // 必须看影响行数，不能只看有没有抛异常。
    // 后端在「主键定位不到行」时返回 data=0 且 msg 仍是「操作成功」
    // （实测：主键指向已被删掉的行就是这种结果），不判就会对用户谎报成功，
    // 而且下面 row[col] = newValue 会把界面改成库里根本没有的值，
    // 直到下一次刷新才对 —— 现场排查时极具误导性。
    if (typeof affected === "number" && affected === 0) {
      message.warning(`未找到要更新的行（主键 ${JSON.stringify(pk)}），可能已被他人删除，请刷新后重试`);
      refreshTableData();
      return;
    }
    message.success(`已更新 ${col}`);
    row[col] = newValue;
    void silentRefreshTableData(tab);
  } catch (e) {
    message.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
    refreshTableData();
  }
}

/** 清空表：二次确认后 TRUNCATE/DELETE */
async function confirmTruncate(tableName?: string, database?: string) {
  if (!tableName) {
    message.warning("请先选择一个表");
    return;
  }
  const db = database || activeDatabase.value;
  try {
    await ElMessageBox.confirm(
      `确定清空表 ${tableName} 吗？将删除全部数据且不可恢复！`,
      "清空表",
      { type: "warning", confirmButtonText: "清空", cancelButtonText: "取消", confirmButtonClass: "el-button--danger" }
    );
  } catch {
    return;
  }
  try {
    await truncateDbTable(tableName, currentDatasourceId.value, db);
    message.success("表已清空");
    const tab = activeTabObj.value;
    if (tab?.type === "table" && tab.tableName === tableName) {
      refreshTableData();
    }
  } catch (e) {
    message.error(`清空失败: ${String((e as Error)?.message ?? e)}`);
  }
}

// ===== 索引 =====
function openIndexes() {
  designSubTab.value = "indexes";
  loadIndexes();
}

async function loadIndexes() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  indexLoading.value = true;
  try {
    indexes.value = await fetchDbIndexes(tab.tableName, currentDatasourceId.value, tab.database);
  } catch (e) {
    message.error(`加载索引失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    indexLoading.value = false;
  }
}

function reloadDesignArea() {
  if (designSubTab.value === "columns") {
    const tab = activeTabObj.value;
    if (tab) {
      loadTableDesign(tab);
    }
  } else if (designSubTab.value === "indexes") {
    loadIndexes();
  } else {
    void loadForeignKeys();
  }
}

function openIndexDialog() {
  Object.assign(indexForm, {
    indexName: "",
    columns: [] as string[],
    unique: false,
    indexType: "BTREE",
    prefixes: [] as number[],
    primary: false,
  });
  indexDialogVisible.value = true;
}

/**
 * 调整复合索引的列序。
 *
 * <p>索引列的顺序决定前缀能不能命中，改列序是复合索引最常做的调整，
 * 但下拉多选本身不提供排序控件，所以额外给上移/下移。
 * 后端按数组顺序原样建索引（不排序），因此这里的顺序就是最终列序。</p>
 *
 * @param index 当前列下标
 * @param delta 移动方向：-1 上移，1 下移
 */
function moveIndexColumn(index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= indexForm.columns.length) return;
  const cols = [...indexForm.columns];
  [cols[index], cols[next]] = [cols[next], cols[index]];
  indexForm.columns = cols;
  // 前缀长度跟着列一起走，否则改序后前缀会挂到错误的列上（且不会有任何提示）
  const prefixes = normalizePrefixes(cols, indexForm.prefixes);
  indexForm.prefixes = prefixes;
}

/**
 * 把前缀长度数组对齐到给定的列序列。
 *
 * <p>多选增删列会让 prefixes 与 columns 长度不一致，后端按下标取，
 * 对不齐就会把 A 列的前缀套到 B 列上 —— 这里统一按**当前列**重新排布，
 * 能按列名对上的沿用原值，对不上的置 0（整列）。</p>
 *
 * @param columns 当前列序列
 * @param previous 调整前的前缀数组（与旧列序列同序）
 * @returns 与 columns 等长的前缀数组
 */
function normalizePrefixes(columns: string[], previous: number[]): number[] {
  return columns.map((_, i) => {
    const value = previous[i];
    return typeof value === "number" && value > 0 ? value : 0;
  });
}

/**
 * 调整主键的列序。
 *
 * @param index 当前列下标
 * @param delta 移动方向：-1 上移，1 下移
 */
function movePkColumn(index: number, delta: number) {
  const next = index + delta;
  if (next < 0 || next >= pkDialogColumns.value.length) return;
  const cols = [...pkDialogColumns.value];
  [cols[index], cols[next]] = [cols[next], cols[index]];
  pkDialogColumns.value = cols;
}

/** 当前全部可选字符集（由内核下发） */
const charsetOptions = computed<Array<{ label: string; value: string }>>(() => {
  const seen = new Set<string>();
  const list: Array<{ label: string; value: string }> = [];
  for (const c of tableOptionValues.value.collations) {
    if (!c.charset || seen.has(c.charset)) continue;
    seen.add(c.charset);
    list.push({ label: c.charset, value: c.charset });
  }
  return list;
});

/**
 * 列的字符集变了就刷新排序规则下拉，并清掉不属于新字符集的旧排序规则。
 *
 * <p>不清的话会把 utf8mb4_general_ci 提交到 latin1 列上，内核会报
 * "COLLATION 'utf8mb4_general_ci' is not valid for CHARACTER SET 'latin1'" ——
 * 用户只能从报错里反推哪里错了。</p>
 *
 * @param charset 新选的字符集
 */
function onColumnCharsetChange(charset: string | number | (string | number)[] | null) {
  if (typeof charset !== "string" || !charset) {
    columnForm.collation = "";
    return;
  }
  void loadTableOptionValues(charset);
  const stillValid = tableOptionValues.value.collations.some(
    c => c.collation === columnForm.collation && c.charset === charset
  );
  if (!stillValid) {
    columnForm.collation = "";
  }
}

/**
 * 表属性的字符集变了就清掉不匹配的排序规则（同 {@link onColumnCharsetChange}）。
 *
 * @param charset 新选的字符集
 */
function onOptionsCharsetChange(charset: string | number | (string | number)[] | null) {
  if (typeof charset !== "string" || !charset) return;
  void loadTableOptionValues(charset);
  if (tableOptionValues.value.collations.length > 0) {
    const stillValid = tableOptionValues.value.collations.some(
      c => c.collation === optionsForm.collation && c.charset === charset
    );
    if (!stillValid) {
      optionsForm.collation = "";
    }
  }
}

async function saveIndex() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  if (!indexForm.primary && !indexForm.indexName.trim()) {
    message.warning("请输入索引名");
    return;
  }
  if (indexForm.columns.length === 0) {
    message.warning("请选择至少一列");
    return;
  }
  try {
    await createDbIndex(tab.tableName, {
      indexName: indexForm.indexName.trim(),
      columns: indexForm.columns,
      unique: indexForm.primary ? true : indexForm.unique,
      indexType: indexForm.indexType || undefined,
      prefixes: indexForm.prefixes.length > 0 ? indexForm.prefixes : undefined,
      primary: indexForm.primary,
      database: tab.database,
      datasourceId: currentDatasourceId.value,
    });
    message.success(indexForm.primary ? "已设为主键" : "索引已创建");
    indexDialogVisible.value = false;
    await loadIndexes();
    await loadTableDesign(tab);
    loadPkInfo(tab);
  } catch (e) {
    message.error(`${indexForm.primary ? "设置主键" : "创建索引"}失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 打开表属性弹窗。
 *
 * <p>同时拉两样东西：当前表属性（回填表单）与内核可选值（引擎 / 排序规则下拉）。
 * 可选值必须由内核下发 —— 不同内核、不同版本可用的引擎与排序规则不同，
 * 前端硬编码会让用户选到内核不认的值。</p>
 */
async function openTableOptionsDialog() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  await loadTableOptionValues();
  try {
    const data = await fetchDbTableOptions(tab.tableName, currentDatasourceId.value, tab.database);
    Object.assign(optionsForm, {
      engine: data?.engine ?? "",
      charset: data?.charset ?? "",
      collation: data?.collation ?? "",
      comment: data?.comment ?? "",
      autoIncrement: data?.autoIncrement ?? undefined,
    });
    Object.assign(tableOptionOriginal, { ...optionsForm });
    optionsDialogVisible.value = true;
  } catch (e) {
    message.error(`读取表属性失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 保存表属性。
 *
 * <p>只提交**真正改动过的字段**：后端把「未传」理解为不改，
 * 若把整个表单原样回传，会把用户没碰过的字段也写一遍，
 * 在大表上是纯粹的锁竞争。</p>
 */
async function saveTableOptions() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  const payload: Record<string, unknown> = {};
  if (optionsForm.engine !== tableOptionOriginal.engine) payload.engine = optionsForm.engine;
  if (optionsForm.charset !== tableOptionOriginal.charset) payload.charset = optionsForm.charset;
  if (optionsForm.collation !== tableOptionOriginal.collation) payload.collation = optionsForm.collation;
  if (optionsForm.comment !== tableOptionOriginal.comment) payload.comment = optionsForm.comment;
  if (optionsForm.autoIncrement !== tableOptionOriginal.autoIncrement) {
    payload.autoIncrement = optionsForm.autoIncrement;
  }
  if (Object.keys(payload).length === 0) {
    message.info("没有改动");
    optionsDialogVisible.value = false;
    return;
  }
  optionsSaving.value = true;
  try {
    await updateDbTableOptions(tab.tableName, {
      ...payload,
      database: tab.database,
      datasourceId: currentDatasourceId.value,
    } as never);
    message.success("表属性已保存");
    optionsDialogVisible.value = false;
    // 表属性变了会连带影响行的存储格式，重新读一次设计视图让用户看到最终态
    await loadTableDesign(tab);
  } catch (e) {
    message.error(`保存表属性失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    optionsSaving.value = false;
  }
}

/** 打开主键设置弹窗，并回填当前主键（按列序，复合主键的顺序不能乱） */
async function openPkDialog() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  await loadPkInfo(tab);
  const ordered = designColumns.value.filter(c => c.isPrimaryKey).map(c => c.name);
  pkDialogColumns.value = ordered;
  pkDialogVisible.value = true;
}

/** 保存主键（不选任何列 = 清除主键） */
async function savePrimaryKey() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  const clearing = pkDialogColumns.value.length === 0;
  if (clearing) {
    try {
      await ElMessageBox.confirm(
        "清除主键后，该表将不再有唯一性约束与自增基准，确定吗？",
        "清除主键",
        { type: "warning" }
      );
    } catch {
      return;
    }
  }
  pkSaving.value = true;
  try {
    await setDbTablePrimaryKey(
      tab.tableName,
      pkDialogColumns.value,
      currentDatasourceId.value,
      tab.database
    );
    message.success(clearing ? "主键已清除" : "主键已保存");
    pkDialogVisible.value = false;
    await loadTableDesign(tab);
    loadPkInfo(tab);
  } catch (e) {
    message.error(`设置主键失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    pkSaving.value = false;
  }
}

async function removeIndex(row: DbIndexInfo) {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  try {
    await ElMessageBox.confirm(`确定删除索引 ${row.indexName} 吗？`, "删除索引", { type: "warning" });
  } catch {
    return;
  }
  try {
    await dropDbIndex(tab.tableName, row.indexName, currentDatasourceId.value, tab.database);
    message.success("索引已删除");
    loadIndexes();
  } catch (e) {
    message.error(`删除索引失败: ${String((e as Error)?.message ?? e)}`);
  }
}

// ===== 列（表结构）编辑 =====
/**
 * 打开列编辑弹窗。
 *
 * <p>回填时优先用后端读出的 `baseType` / `unsigned` / `enumValues` 等属性 ——
 * 此前只从 `type` 文本里正则抠出类型名和长度，`int(10) unsigned` 会被当成 INT/10，
 * 无符号、字符集、自增、枚举取值全部丢失，用户一打开就是错的，再一点保存就把
 * 属性改没了。</p>
 *
 * @param mode add=新增 / edit=修改
 * @param row  被修改的列（add 时可空）
 */
async function openColumnDialog(mode: "add" | "edit", row?: ColumnAttrSource) {
  columnDialogMode.value = mode;
  // 字符集 / 排序规则下拉的数据源来自内核，**新增时也要加载**：
  // 此前只在「修改」分支里加载，导致「新增列」弹窗里这两个下拉是空的，
  // 用户无从设置（验收里表现为「字符集下拉由内核下发」PASS，但候选列表为空 —— 断言本身也写松了）。
  if (tableOptionValues.value.collations.length === 0) {
    await loadTableOptionValues(row?.charset);
  }
  if (mode === "edit" && row) {
    editingDesignColumn.value = row;
    const rawType = (row.type || "").toUpperCase();
    const m = /^([A-Z ]+?)\s*(?:\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\))?/.exec(rawType);
    const baseType = (row.baseType || m?.[1] || "VARCHAR").toUpperCase().replace(/\s+/g, " ");
    // 后端类型可能不在分组表里（例如从别的内核读来的），补进分组避免下拉显示空白。
    // 注意必须在计算 size 之前判断「是否本来就需要长度」，否则补进分组后
    // includes() 恒为 true，需要长度的类型会拿不到默认长度。
    const known = columnTypeOptions.includes(baseType);
    if (!known) {
      COLUMN_TYPE_GROUPS.push({ label: "其他", types: [baseType] });
    }
    const needsSizeByDefault = !known && (SIZE_REQUIRED.has(baseType) || /DATE|TIME/.test(baseType));
    Object.assign(columnForm, {
      columnName: row.name,
      type: baseType,
      size: m?.[2] ? Number(m[2]) : needsSizeByDefault ? 255 : undefined,
      scale: m?.[3] ? Number(m[3]) : row.scale || undefined,
      unsigned: row.unsigned === true,
      zerofill: row.zerofill === true,
      charset: row.charset ?? "",
      collation: row.collation ?? "",
      nullable: row.nullable !== false,
      defaultValue: row.default ?? "",
      // 内核只在 EXTRA 里给 on update CURRENT_TIMESTAMP，列元数据没这一项，
      // 所以这里不猜：有默认值且是日期时间类型时才提示，由用户决定要不要开
      onUpdate: "",
      autoIncrement: row.autoIncrement === true,
      enumValues: (row.enumValues ?? []).join("\n"),
      comment: row.remark ?? "",
    });
  } else {
    editingDesignColumn.value = null;
    Object.assign(columnForm, {
      columnName: "",
      type: "VARCHAR",
      size: 255,
      scale: undefined,
      unsigned: false,
      zerofill: false,
      charset: "",
      collation: "",
      nullable: true,
      defaultValue: "",
      onUpdate: "",
      autoIncrement: false,
      enumValues: "",
      comment: "",
    });
  }
  columnDialogVisible.value = true;
}

async function saveColumn() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  if (!columnForm.columnName.trim()) {
    message.warning("请输入列名");
    return;
  }
  // 前端先做一遍与后端同口径的校验：目的是给出**就地**提示，
  // 而不是让用户发一次请求、再从内核报错里读懂自己填错了什么。
  if (columnNeedsSize.value && !columnForm.size) {
    message.warning(`${columnForm.type} 必须指定长度`);
    return;
  }
  if (columnIsEnum.value && parseEnumValues().length === 0) {
    message.warning(`${columnForm.type} 必须至少配置一个取值`);
    return;
  }
  if (columnForm.autoIncrement && columnForm.nullable) {
    message.warning("自动递增的列不能可空");
    return;
  }
  if (columnForm.unsigned && !columnAllowsUnsigned.value) {
    message.warning(`${columnForm.type} 不支持无符号`);
    return;
  }
  const enumValues = columnIsEnum.value ? parseEnumValues() : undefined;
  const payload = {
    columnName: columnForm.columnName.trim(),
    type: columnForm.type,
    size: columnNeedsSize.value ? columnForm.size : undefined,
    scale: columnAllowsScale.value ? columnForm.scale : undefined,
    unsigned: columnAllowsUnsigned.value ? columnForm.unsigned : false,
    zerofill: columnForm.unsigned && columnForm.zerofill,
    charset: columnIsChar.value ? columnForm.charset || undefined : undefined,
    collation: columnIsChar.value ? columnForm.collation || undefined : undefined,
    nullable: columnForm.nullable,
    defaultValue: columnForm.defaultValue || undefined,
    onUpdate: columnForm.onUpdate || undefined,
    autoIncrement: columnForm.autoIncrement,
    enumValues,
    comment: columnForm.comment || undefined,
    database: tab.database,
    datasourceId: currentDatasourceId.value,
  };
  try {
    if (columnDialogMode.value === "add") {
      await addDbColumn(tab.tableName, payload);
      message.success("列已新增");
    } else {
      await modifyDbColumn(tab.tableName, columnForm.columnName.trim(), payload);
      message.success("列已修改");
    }
    columnDialogVisible.value = false;
    await loadTableDesign(tab);
    loadPkInfo(tab);
    refreshTableData();
  } catch (e) {
    message.error(`保存列失败: ${String((e as Error)?.message ?? e)}`);
  }
}

async function removeColumn(row: DbColumnInfo) {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  try {
    await ElMessageBox.confirm(`确定删除列 ${row.name} 吗？该列数据将一并删除！`, "删除列", { type: "warning" });
  } catch {
    return;
  }
  try {
    await dropDbColumn(tab.tableName, row.name, currentDatasourceId.value, tab.database);
    message.success("列已删除");
    await loadTableDesign(tab);
    refreshTableData();
  } catch (e) {
    message.error(`删除列失败: ${String((e as Error)?.message ?? e)}`);
  }
}

// SQL 查询
const queryResult = reactive<DbQueryResult>({});
/**
 * 多结果集（仅「执行脚本」会产生多条）。
 *
 * <p>单条执行**仍然只写 {@link queryResult}**，形状保持 `data.columns`/`data.rows` 不变 ——
 * 6 个既有 UI 验收套件按这个形状断言，改形状等于让它们的结论全部失效。</p>
 */
const resultSets = ref<DbStatementResult[]>([]);
/** 当前显示第几个结果集 */
const activeResultSet = ref(0);
/** 当前结果集是不是更新语句（无结果集，要给一句说明而不是空表格） */
const activeResultIsUpdate = computed(() => {
  const r = resultSets.value[activeResultSet.value];
  return !!r && r.columns === undefined && r.affectedRows !== undefined;
});
/** 当前结果集是不是失败的那条（有 message 但没有结果集） */
const activeResultIsFailure = computed(() => {
  const r = resultSets.value[activeResultSet.value];
  return !!r && r.columns === undefined && r.affectedRows === undefined && !!r.message;
});
/** 「打开 SQL 文件」用的隐藏 file input */
const sqlFileInputRef = ref<HTMLInputElement | null>(null);
const queryColumns = computed(() =>
  (queryResult.columns || []).map(col => ({ prop: col, label: col, minWidth: 120, showOverflowTooltip: true }))
);

/**
 * 结果集页签文案：既标第几条，也标这条是查询还是更新。
 *
 * <p>只写「第 3 条」不够 —— 用户看到第 3 条是空的，得知道那是因为它是
 * `UPDATE` 而不是「查询没查到东西」。</p>
 *
 * @param r 结果集
 * @param i 下标
 * @returns 页签文案
 */
function resultSetLabel(r: DbStatementResult, i: number): string {
  if (r.columns !== undefined) {
    return `第 ${i + 1} 条 · 查询 · ${r.rowCount ?? 0} 行`;
  }
  if (r.affectedRows !== undefined) {
    return `第 ${i + 1} 条 · 更新 · 影响 ${r.affectedRows} 行`;
  }
  if (r.message) {
    return `第 ${i + 1} 条 · 失败`;
  }
  return `第 ${i + 1} 条 · 无结果`;
}

/**
 * 切换当前显示的结果集。
 *
 * <p>必须经这个函数而不是直接改 {@link activeResultSet}：
 * 结果区只认 {@link queryResult}，只改下标的话表格内容纹丝不动，
 * 表现为「点页签没反应」。</p>
 *
 * @param i 结果集下标
 */
function selectResultSet(i: number): void {
  activeResultSet.value = i;
  showResultSet(resultSets.value[i]);
}

/** 把某个结果集写进 {@link queryResult}（结果区只认这一个） */
function showResultSet(r: DbStatementResult | undefined): void {
  Object.assign(queryResult, {
    columns: r?.columns,
    rows: r?.rows,
    rowCount: r?.rowCount,
    truncated: r?.truncated,
    affectedRows: r?.affectedRows,
    message: r?.message,
  });
}

// ---------- 查询历史（落 localStorage，刷新后仍在） ----------
const HISTORY_KEY = "dbm-query-history";
/** 历史条数上限：再往上浏览器存储会被撑大，而 200 条已经远超日常回溯需要 */
const HISTORY_LIMIT = 200;
interface QueryHistoryItem {
  /** 执行时刻 HH:MM:SS */
  at: string;
  sql: string;
  /** 结果摘要（行数 / 影响行数 / 失败原因） */
  summary: string;
}
/**
 * 从 localStorage 读历史。
 *
 * <p>存储损坏（被别的标签页写坏、手工改坏）时返回空数组而不是抛错 ——
 * 历史是便利功能，不该因为它坏了就打不开查询页签。</p>
 */
function loadQueryHistory(): QueryHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueryHistoryItem[]) : [];
  } catch {
    return [];
  }
}
const queryHistory = ref<QueryHistoryItem[]>(loadQueryHistory());
const historyVisible = ref(false);
/** 切换历史面板显示（与模板面板互斥，避免两个面板叠在一起） */
function toggleHistory(): void {
  historyVisible.value = !historyVisible.value;
  if (historyVisible.value) templatesVisible.value = false;
}
/** 记一条执行历史（最新在前；同一段 SQL 不重复记） */
function pushQueryHistory(sql: string, summary: string): void {
  const text = sql.trim();
  if (!text) return;
  const at = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  const rest = queryHistory.value.filter(h => h.sql !== text);
  queryHistory.value = [{ at, sql: text, summary }, ...rest].slice(0, HISTORY_LIMIT);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(queryHistory.value));
  } catch {
    // 配额满 / 隐私模式禁写：历史降级为「仅本次会话」，不影响查询功能
    message.warning("查询历史无法持久化（浏览器存储不可用），本次会话内仍可回看");
  }
}
/** 点历史条目把 SQL 回填编辑器 */
function loadFromHistory(sql: string): void {
  const tab = activeTabObj.value;
  if (!tab) return;
  tab.sql = sql;
  historyVisible.value = false;
}
/** 清空历史（localStorage 也要清，否则刷新后又回来） */
function clearQueryHistory(): void {
  queryHistory.value = [];
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // 同上：清不了就只清内存，提示一次
  }
  message.success("查询历史已清空");
}

// ---------- SQL 模板（第九批 7.2：保存/复用常用 SQL，落 localStorage，口径同历史） ----------
const TPL_KEY = "dbm-sql-templates";
/** 模板条数上限：单条就是一段 SQL，100 个已远超日常需要 */
const TPL_LIMIT = 100;
interface SqlTemplateItem {
  /** 模板名（用户起的，唯一键；同名覆盖） */
  name: string;
  /** 模板 SQL 原文 */
  sql: string;
  /** 保存时刻 */
  at: string;
}
/**
 * 从 localStorage 读模板。
 *
 * <p>存储损坏时返回空数组而不是抛错 —— 模板是便利功能，
 * 不该因为它坏了就打不开查询页签（与历史同一策略）。</p>
 *
 * @returns 模板列表
 */
function loadSqlTemplates(): SqlTemplateItem[] {
  try {
    const raw = localStorage.getItem(TPL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SqlTemplateItem[]) : [];
  } catch {
    return [];
  }
}
const sqlTemplates = ref<SqlTemplateItem[]>(loadSqlTemplates());
const templatesVisible = ref(false);
/** 持久化模板（配额满 / 隐私模式降级为仅本次会话，与历史同策略） */
function persistSqlTemplates(): void {
  try {
    localStorage.setItem(TPL_KEY, JSON.stringify(sqlTemplates.value));
  } catch {
    message.warning("SQL 模板无法持久化（浏览器存储不可用），本次会话内仍可使用");
  }
}
/** 切换模板面板显示（与查询历史互斥） */
function toggleTemplates(): void {
  templatesVisible.value = !templatesVisible.value;
  if (templatesVisible.value) historyVisible.value = false;
}
/** 把当前编辑器 SQL 存为模板（同名覆盖，走 prompt 与重命名表同款归一化） */
async function saveSqlTemplate(): Promise<void> {
  const tab = activeTabObj.value;
  const sql = (tab?.sql || "").trim();
  if (!sql) {
    message.warning("当前编辑器没有可保存的 SQL");
    return;
  }
  try {
    const res = await ElMessageBox.prompt("模板名称（同名将覆盖）", "保存 SQL 模板", {
      inputValue: "",
      inputPlaceholder: "如：近 7 天订单汇总",
      inputValidator: (v: string) => (v && v.trim() ? true : "请输入模板名称"),
    });
    const name = promptValue(res);
    if (!name) return;
    const at = new Date().toLocaleString("zh-CN", { hour12: false });
    const rest = sqlTemplates.value.filter(t => t.name !== name);
    sqlTemplates.value = [{ name, sql, at }, ...rest].slice(0, TPL_LIMIT);
    persistSqlTemplates();
    message.success(`模板「${name}」已保存`);
  } catch {
    // 用户取消 prompt（reject 是正常路径，不提示）
  }
}
/** 点模板条目把 SQL 回填编辑器 */
function loadSqlTemplate(t: SqlTemplateItem): void {
  const tab = activeTabObj.value;
  if (!tab) return;
  tab.sql = t.sql;
  templatesVisible.value = false;
  message.success(`已载入模板「${t.name}」`);
}
/** 删一个模板（localStorage 同步清） */
function removeSqlTemplate(name: string): void {
  sqlTemplates.value = sqlTemplates.value.filter(t => t.name !== name);
  persistSqlTemplates();
}

// ---------- 执行超时（第九批 8.1：可配「会话时间」，原全局 10s 慢查询被前端掐断） ----------
const EXEC_TIMEOUT_KEY = "dbm-exec-timeout-sec";
/**
 * 可选超时（秒）。
 *
 * <p>刻意**不含 60s**：后端语句级超时默认正好 60s，前后端同刻竞争会让用户
 * 看到 axios 的「timeout of 60000ms exceeded」而不是后端可读的超时原因。
 * 默认 120s（> 60s）保证后端先报、错误信息可读。</p>
 */
const execTimeoutOptions = [
  { label: "10s", value: 10 },
  { label: "30s", value: 30 },
  { label: "120s", value: 120 },
  { label: "300s", value: 300 },
  { label: "不限", value: 0 },
];
function loadExecTimeout(): number {
  // 注意：Number(localStorage.getItem(..)) 在键缺失时是 Number(null)=0，
  // 会恰好命中「不限」的 0 —— 默认值就从 120s 悄悄变成不限。必须先判空。
  const raw = localStorage.getItem(EXEC_TIMEOUT_KEY);
  if (raw == null || raw === "") return 120;
  const n = Number(raw);
  return execTimeoutOptions.some(o => o.value === n) ? n : 120;
}
const execTimeoutSec = ref<number>(loadExecTimeout());
watch(execTimeoutSec, v => {
  try {
    localStorage.setItem(EXEC_TIMEOUT_KEY, String(v));
  } catch {
    // 存不了就只在本次会话生效，不打扰用户
  }
});
/**
 * 当前执行超时毫秒。
 *
 * @returns {number} >0 为毫秒数；0 = 不限（axios timeout 0 即不设上限）
 */
function execTimeoutMs(): number {
  return execTimeoutSec.value > 0 ? execTimeoutSec.value * 1000 : 0;
}

// ---------- AI text2sql（第九批 7.2：后端有整个功能才显示入口） ----------
const dbAi = ref<DbAiStatus>({ available: false });
const aiDialogVisible = ref(false);
const aiPrompt = ref("");
const aiSql = ref("");
const aiBusy = ref(false);
/** 结构上下文提示（展示截断，发送时用全量表清单） */
const aiContextHint = computed(() => {
  const db = activeTabObj.value?.database || activeDatabase.value;
  const names = getTablesForDb(db).map(t => t.name);
  if (!names.length) return "";
  return `${db}：${names.slice(0, 8).join(", ")}${names.length > 8 ? ` 等 ${names.length} 张表` : ""}`;
});
/** 探测 text2sql 可用性（fetchDbAiStatus 内部已兜底，失败即隐藏入口） */
async function refreshAiStatus(): Promise<void> {
  dbAi.value = await fetchDbAiStatus();
}
function openAiDialog(): void {
  aiPrompt.value = "";
  aiSql.value = "";
  aiDialogVisible.value = true;
}
/**
 * 生成 SQL（不执行）。
 *
 * <p>结构上下文取当前库已加载的表清单 —— 后端提示词要求「只用真实存在的
 * 表与列」，带上表名能显著减少虚构；没加载过表清单时留空由后端自行兜底。</p>
 */
async function generateAiSql(): Promise<void> {
  const text = aiPrompt.value.trim();
  if (!text) {
    message.warning("请先输入查询需求");
    return;
  }
  aiBusy.value = true;
  try {
    const db = activeTabObj.value?.database || activeDatabase.value;
    const names = getTablesForDb(db).map(t => t.name);
    const context = names.length ? `库 ${db} 的表：${names.join(", ")}` : undefined;
    const res = await requestDbText2Sql(text, context, currentDatasourceId.value);
    aiSql.value = res.sql;
  } catch (e) {
    message.error((e as Error)?.message || "AI 生成失败");
  } finally {
    aiBusy.value = false;
  }
}
/** 把生成结果填入编辑器（不执行；执行仍由用户 Ctrl+Enter / 点执行） */
function applyAiSql(): void {
  const tab = activeTabObj.value;
  if (!tab || !aiSql.value) return;
  tab.sql = aiSql.value;
  aiDialogVisible.value = false;
  message.success("已填入编辑器（未执行，Ctrl+Enter 执行）");
}

// ---------- 查询参数 ----------
const paramDialogVisible = ref(false);
/** 脚本里用到的变量名（来自 /db/scan-params） */
const paramNames = ref<string[]>([]);
/** 变量取值 */
const paramValues = reactive<Record<string, string>>({});
/** 当前查询页签的目标库，批量/参数执行都要用它 */
function queryTargetDatabase(): string | undefined {
  return activeTabObj.value?.database || activeDatabase.value || undefined;
}
/**
 * 打开参数弹窗：先扫描占位符，再带上历史取值。
 *
 * <p>扫描走纯文本端点、不执行 SQL —— 编辑器每次改动都问一次后端的话，
 * 成本会体现在每次按键的延迟上。</p>
 */
async function openParamDialog(): Promise<void> {
  const sql = activeTabObj.value?.sql ?? "";
  if (!sql.trim()) {
    message.info("先写点 SQL 再填参数");
    return;
  }
  try {
    const names = await scanSqlParams(sql);
    paramNames.value = Array.isArray(names) ? names : [];
    // 已填过的值默认带回来：调试时反复改一个变量是常态
    for (const k of Object.keys(paramValues)) {
      if (!paramNames.value.includes(k)) delete paramValues[k];
    }
    for (const n of paramNames.value) {
      if (paramValues[n] === undefined) paramValues[n] = "";
    }
    paramDialogVisible.value = true;
  } catch (e) {
    message.error(`扫描参数失败: ${String((e as Error)?.message ?? e)}`);
  }
}
/** 填完参数直接执行（关弹窗） */
async function runWithParams(): Promise<void> {
  const missing = paramNames.value.filter(n => paramValues[n] === undefined || paramValues[n] === "");
  if (missing.length > 0) {
    message.warning(`请填写参数：${missing.join("、")}`);
    return;
  }
  paramDialogVisible.value = false;
  await executeScriptWithParams();
}

// 右键菜单（tableName=表节点 / database=库节点 / tabId=页签 / root=数据源根节点 / 全空=侧栏空白）
const contextMenu = reactive({ visible: false, x: 0, y: 0, tableName: "", database: "", tabId: "", isView: false, root: false });

// 新建表：表单与 SQL 拼装都在共享组件里，这里只保留「弹窗开关 + 目标库」
const createTableVisible = ref(false);
/** 新建表的目标库，来自左侧树选中节点 */
const newTableDatabase = ref("");

// 初始化
onMounted(async () => {
  await loadDatasources();
  // 数据源中心右键「用户管理」→ 打开全屏控制台并定位到用户管理页签（/db-manager/full?panel=users）
  // 入口对全部 JDBC 数据源开放；非 MySQL/MariaDB 内核由面板 supported=false 降级提示。
  if (String(route.query.panel ?? "").toLowerCase() === "users") {
    openUsersTab();
  }
  // text2sql 入口按后端能力显隐（未集成/未配置 = 隐藏），失败已在 API 内兜底
  void refreshAiStatus();
});

/**
 * 当前应当生效的数据源 ID。
 *
 * <p>优先级：宿主的 datasourceId 属性 &gt; 路由 query &gt; 默认主数据源（0）。
 * 属性排在前面是因为内嵌模式下 URL 上根本没有这个参数，而且宿主的选中项
 * 才是用户当前真正在看的那一个。</p>
 *
 * @return 数据源 ID；无有效来源时为默认主数据源的 0
 */
function resolveDatasourceId(): number {
  if (Number.isFinite(props.datasourceId) && (props.datasourceId ?? 0) > 0) {
    return props.datasourceId as number;
  }
  const fromQuery = Number(route.query.datasourceId);
  if (Number.isFinite(fromQuery) && fromQuery > 0) {
    return fromQuery;
  }
  return DEFAULT_DATASOURCE.id ?? 0;
}

async function loadDatasources() {
  try {
    const list = await fetchDataSources();
    const jdbc = list.filter(d => d.type === "jdbc");
    datasources.value = [DEFAULT_DATASOURCE, ...jdbc];
    let requested = resolveDatasourceId();
    // F5：没有显式指定（路由没带 datasourceId、也不是内嵌模式）时，
    // 回到上次用的数据源 —— Navicat 就是记住连接的。
    // 记下来的那个若已不存在，走下面的「未登记」分支如实告知，不静默失败。
    if (requested <= 0 && viewPref.lastDatasourceId > 0 && !embedded) {
      requested = viewPref.lastDatasourceId;
    }
    if (requested > 0) {
      if (jdbc.some(d => d.id === requested)) {
        currentDatasourceId.value = requested;
      } else {
        // 内嵌模式不做弹窗：宿主的左栏可能选中了 Redis/Nginx 这类非 JDBC 数据源，
        // 弹一次「已改用默认主数据源」会把用户从这个页签里推走，体验比留空更差。
        if (!embedded) {
          message.warning(`数据源 #${requested} 未登记或不是 JDBC 类型，已改用默认主数据源`);
        }
        currentDatasourceId.value = DEFAULT_DATASOURCE.id ?? 0;
      }
    }
  } catch (e) {
    console.error("加载数据源失败", e);
    datasources.value = [DEFAULT_DATASOURCE];
  }
  await loadTree();
}

/**
 * 清掉「表已不存在」的每表偏好。
 *
 * <p>表改名或删掉后偏好会一直占着位置，把真正在用的挤出 120 条上限。
 * 这里按「当前库里真实存在的表」对一遍，而不是等上限触发 ——
 * 等上限触发时，被挤掉的往往是用户**最近还在用**的那几张。</p>
 */
async function pruneStaleTablePrefs(): Promise<void> {
  const db = activeDatabase.value;
  if (!db) return;
  try {
    const tables = await fetchDbTables(currentDatasourceId.value, db);
    const exist = new Set((tables || []).map(t => `${db}.${t.name}`));
    if (exist.size === 0) return;
    const removed = pruneTablePrefs(exist);
    if (removed > 0) {
      console.info(`[dbm] 清理了 ${removed} 条已失效的表筛选偏好`);
    }
  } catch {
    // 读不到表清单就不清理：宁可多占点地方，也不要因为一次网络失败
    // 把用户精心配的筛选条件全删了。
  }
}

/** 数据源切换后：记住它，并清掉该数据源下已失效的每表筛选偏好 */
watch(currentDatasourceId, id => {
  if (id > 0) {
    saveViewPref({ lastDatasourceId: id });
  }
  // 换数据源意味着「库.表」这套键全部换了含义，
  // 上一批偏好对这里一张表都不适用，按真实存在的表清理掉。
  void pruneStaleTablePrefs();
  // 顺带重探 AI 能力（后端可能在会话期间重新部署/配置）
  void refreshAiStatus();
});

/**
 * 宿主（左栏）切换了数据源时跟随切换。
 *
 * <p>独立路由下这个属性恒为 undefined，watch 不会触发，行为与改造前一致。</p>
 */
watch(
  () => props.datasourceId,
  async (id, old) => {
    if (id === old || !id || !embedded) {
      return;
    }
    // 内嵌模式下数据源由宿主决定，用户没得选，因此不存在「选到一半改主意」，
    // 直接整体重置：清空树缓存、库选中、已打开的表页签，再重新拉树。
    Object.keys(tablesByDb).forEach(k => delete tablesByDb[k]);
    Object.keys(tableColumnsCache).forEach(k => delete tableColumnsCache[k]);
    expandedNodes.value = new Set(["root"]);
    expandedTables.value = new Set();
    activeDatabase.value = "";
    activeTable.value = "";
    tabs.value = [];
    activeTab.value = "";
    await loadDatasources();
  },
);

async function onDatasourceChange() {
  Object.keys(tablesByDb).forEach(k => delete tablesByDb[k]);
  activeDatabase.value = "";
  tabs.value = [];
  activeTab.value = "";
  await loadTree();
}

/** 树/下拉的展示名：文件库兜底出的空串库位显示「默认库」（值仍传 ""，链路不变） */
function dbLabel(db: string) {
  return db || "默认库";
}

async function loadTree() {
  try {
    databases.value = await fetchDbDatabases(currentDatasourceId.value);
    // 文件库（SQLite）没有「库」概念，接口返回 []：兜一个空串占位库，
    // 让树有根、首节点展开后走 fetchDbTables(id, "") 直连默认库拉表
    if (!databases.value.length) {
      databases.value = [""];
    }
    if (databases.value.length > 0) {
      expandedNodes.value.add("db:" + databases.value[0]);
      await loadTables(databases.value[0]);
    }
  } catch (e) {
    message.error(`加载数据库树失败: ${String((e as Error)?.message ?? e)}`);
  }
}

async function loadTables(db: string) {
  try {
    tablesByDb[db] = await fetchDbTables(currentDatasourceId.value, db);
    activeDatabase.value = db;
  } catch (e) {
    message.error(`加载 ${db} 表列表失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 获取指定数据库已加载的表列表
 * @param db 数据库名
 */
function getTablesForDb(db: string) {
  return tablesByDb[db] || [];
}

/**
 * 指定库中的表（TABLE，排除视图），供树分组
 * @param db 数据库名
 */
function tablesOf(db: string): DbTableInfo[] {
  return getTablesForDb(db).filter(t => (t.type || "TABLE").toUpperCase() !== "VIEW");
}

/**
 * 指定库中的视图（VIEW），供树分组
 * @param db 数据库名
 */
function viewsOf(db: string): DbTableInfo[] {
  return getTablesForDb(db).filter(t => (t.type || "").toUpperCase() === "VIEW");
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
    if (key.startsWith("db:")) {
      const db = key.replace("db:", "");
      activeDatabase.value = db;
      activeTable.value = "";
      loadTables(db);
      // 展开库时把四类对象的计数一起拉回来（树上要显示角标）；
      // 各类的**清单**仍然等到展开该分类节点时才拉，避免一次打满 4 个请求。
      void loadDbObjects(db);
    }
  }
}

/**
 * 刷新数据源/数据库/表树
 */
function refreshTree() {
  loadTree();
}

/**
 * 选中表节点（展开结构）
 * @param tableName 表名
 * @param database 所属库
 */
function selectTable(tableName: string, database: string) {
  activeTable.value = tableName;
  activeDatabase.value = database;
  openTableData(tableName, database);
}

/**
 * 打开表数据页签
 * @param tableName 表名
 * @param database 所属库，缺省用当前选中库
 */
function openTableData(tableName: string, database = activeDatabase.value) {
  if (!tableName) {
    message.warning("请先在左侧选择一个表");
    return;
  }
  const id = "table-" + database + "." + tableName;
  let tab = tabs.value.find(t => t.id === id);
  if (!tab) {
    tab = { id, type: "table", title: tabTitle(tableName, database), tableName, database };
    tabs.value.push(tab);
  }
  activeTab.value = id;
  // 排序/过滤是上一张表的条件，切表必须清掉，否则新表可能因列不存在而加载失败
  resetTableQueryState();
  // 再把这张表**自己**的条件恢复回来（F5）：清掉是必须的，
  // 但不能只清不恢复 —— 用户为这张表配好的条件会白配。
  restoreTablePref(tab);
  tableData.page = 1;
  // 后端看 count 参数：关闭统计总数（showTotal=false）时跳过 COUNT(*) ——
  // COUNT 是全表扫描，关掉后翻页请求只剩 SELECT+LIMIT/OFFSET（DbConsoleController.getTableData）。
  loadTableData(tab);
}

/**
 * 切换到指定页签：表数据与设计列是共享状态，换页签必须重新加载
 * @param id 页签 ID
 */
function selectTab(id: string) {
  activeTab.value = id;
  const tab = activeTabObj.value;
  if (tab?.type === "table") {
    resetTableQueryState();
    tableData.page = 1;
    loadTableData(tab);
  } else if (tab?.type === "design") {
    loadTableDesign(tab);
  }
}

/**
 * 打开表结构设计页签
 * @param tableName 表名
 * @param database 所属库，缺省用当前选中库
 */
function openTableDesign(tableName: string, database = activeDatabase.value) {
  if (!tableName) {
    message.warning("请先在左侧选择一个表");
    return;
  }
  designSubTab.value = "columns";
  const id = "design-" + database + "." + tableName;
  let tab = tabs.value.find(t => t.id === id);
  if (!tab) {
    tab = { id, type: "design", title: tabTitle(tableName, database) + " - 设计", tableName, database };
    tabs.value.push(tab);
  }
  activeTab.value = id;
  loadTableDesign(tab);
}

/**
 * 页签标题：带库名前缀，避免同名表页签看不出区别
 * @param tableName 表名
 * @param database 所属库
 */
function tabTitle(tableName: string, database: string) {
  return database ? `${database}.${tableName}` : tableName;
}

// ---------- F1 ER 图（表关系可视化） ----------

/** 可选布局。刻意只给非层级布局：树形布局在普通关系图上会抛
 *  "Tree structure not found"（G6 内部异步抛出，组件侧 try/catch 拦不住）。 */
const ER_LAYOUT_CHOICES = [
  { value: "dagre" as const, label: "有向分层" },
  { value: "antv-dagre" as const, label: "有向分层(antv)" },
  { value: "force" as const, label: "力导向" },
  { value: "d3-force" as const, label: "D3 力导向" },
  { value: "circular" as const, label: "环形" },
  { value: "grid" as const, label: "网格" },
];
/**
 * 当前布局。
 *
 * <p>刻意放宽成 {@code string} 而不是 {@code ER_LAYOUT_CHOICES} 的取值联合：
 * 布局控件现在由 {@code ErWorkspace} 渲染，它对外只承诺「字符串」，图组件那边
 * 才把它收窄成 {@code LayoutType}。这里保留联合类型只会让 {@code update:layout}
 * 的回传值（string）赋不回去。</p>
 */
const erLayout = ref<string>("dagre");
const erLoading = ref(false);
const erError = ref("");
const erTables = ref<DbErTable[]>([]);
const erRelations = ref<DbErRelation[]>([]);
/** 表名过滤（LIKE 模式） */
const erTableFilter = ref("");
/** 是否在边上显示约束名 */
const erShowLabels = ref(true);
/** 列清单弹窗 */
const erColumnsVisible = ref(false);
const erPickedTable = ref("");
const erPickedColumns = ref<DbColumnInfo[]>([]);
/** 右键「ER 图」改打开的弹框：不占页签，双击后即看即关 */
const erExportDialogVisible = ref(false);
/** 弹框内 ER 图对应的库名（页签与弹框分离后各自携带） */
const erDialogDatabase = ref("");

/** 表卡列缓存：表名 → 列清单。只在需要展示列预览时按需拉取，避免 144 张表 N+1。 */
const erTableCols = reactive(new Map<string, DbColumnInfo[]>());

/** 按需拉取某张表的列并缓存（已有缓存或拉取失败时幂等返回）。 */
async function ensureErCols(name: string): Promise<void> {
  if (erTableCols.has(name)) return;
  try {
    const cols = await fetchTableColumns(
      name,
      currentDatasourceId.value,
      erDialogDatabase.value || activeTabObj.value?.database,
    );
    erTableCols.set(name, cols || []);
  } catch {
    erTableCols.set(name, []);
  }
}

/** 页签标题里的库名 */
const qualifiedEr = computed(() => {
  const db = erDialogDatabase.value || activeTabObj.value?.database || "";
  return db ? `${db} · ER 图` : "ER 图";
});

/**
 * 打开 ER 图页签。
 *
 * @param database 库名；缺省用当前选中库
 */
function openErDiagram(database = activeDatabase.value) {
  if (!database) {
    message.warning("请先在左侧选择一个库");
    return;
  }
  erDialogDatabase.value = "";
  const id = "er-" + database;
  let tab = tabs.value.find(t => t.id === id);
  if (!tab) {
    tab = { id, type: "er", title: tabTitle(database, "") + " - ER 图", database };
    tabs.value.push(tab);
  }
  activeTab.value = id;
  void loadErDiagram();
}

/**
 * 右键「ER 图」打开弹框（不再跳页签）。
 *
 * @param database 库名；缺省用当前选中库
 */
function openErExportDialog(database = activeDatabase.value) {
  if (!database) {
    message.warning("请先在左侧选择一个库");
    return;
  }
  erDialogDatabase.value = database;
  erExportDialogVisible.value = true;
  erTableFilter.value = "";
  erPickedTable.value = "";
  erPickedColumns.value = [];
  void loadErDiagram();
}

// ---------- F3 结构同步（比较两个库并生成同步脚本） ----------

/** 差异类别 → 中文 */
const SYNC_KIND_LABELS: Record<string, string> = {
  MISSING_TABLE: "缺表",
  MISSING_COLUMN: "缺列",
  COLUMN_MISMATCH: "列不一致",
  MISSING_INDEX: "缺索引",
  INDEX_MISMATCH: "索引不一致",
  MISSING_FOREIGN_KEY: "缺外键",
  EXTRA_TABLE: "目标多表",
  EXTRA_COLUMN: "目标多列",
};
/** 只提示、不生成脚本的类别 */
const SYNC_EXTRA_KINDS = new Set(["EXTRA_TABLE", "EXTRA_COLUMN"]);

const syncVisible = ref(false);
const syncLoading = ref(false);
const syncRan = ref(false);
const syncDiffError = ref("");
/** 当前视图：select 选择源/目标 → compare 比较中 → diff 差异 → deploy 部署执行 */
const syncView = ref<"select" | "compare" | "diff" | "deploy">("select");
/** 比较中的阶段文案与进度（动画推进，非真实服务端进度） */
const syncComparePhase = ref("正在获取表结构…");
const syncComparePct = ref(0);
let syncCompareTimer: ReturnType<typeof setInterval> | null = null;
/** 来源数据源 ID 与数据库 */
const syncSrcDs = ref<number>(0);
const syncSrcDb = ref("");
const syncSrcDbs = ref<string[]>([]);
/** 目标数据源 ID 与数据库 */
const syncDstDs = ref<number>(0);
const syncDstDb = ref("");
const syncDstDbs = ref<string[]>([]);
const syncTableFilter = ref("");
const syncItems = ref<SyncDiffRow[]>([]);
/** 差异分组方式：action 按操作 / type 按对象类型 */
const syncGroupBy = ref<"action" | "type">("action");
/** 部署视图标签：script 部署脚本 / log 消息日志 */
const syncDeployTab = ref<"script" | "log">("script");
/** 中止结构同步执行（点「停止」置位，SSE onMessage 据此忽略后续事件） */
let syncStop = false;
/** 部署脚本（勾选差异自动生成，可编辑） */
const syncDeployScript = ref("");
/** SSE 执行日志 */
const syncLog = ref<StructureSyncLine[]>([]);
const syncRunning = ref(false);
const syncRunDone = ref(false);
const syncRunTotal = ref(0);
const syncRunOk = ref(0);
const syncRunFail = ref(0);
const syncRunElapsed = ref(0);
const syncLogEl = ref<HTMLElement>();
/** 选项 */
const syncOptVisible = ref(false);
const syncOptStopOnError = ref(true);
const syncOptIncludeExtra = ref(true);

/** 结构同步差异行：在服务端 DiffItem 之上加勾选标记与来源 kind */
interface SyncDiffRow extends DbStructureDiffItem {
  checked: boolean;
  originalKind: string;
}

/** 结构同步日志行 */
interface StructureSyncLine {
  no: string;
  sql: string;
  msg?: string;
  ok?: boolean;
  affected?: number;
  error?: string;
}

/** 可比较的数据源选项（默认主数据源 + JDBC），源/目标两侧共用 */
const syncDsOptions = computed(() =>
  datasources.value.filter(d => d.type === "jdbc" || (d.id ?? 0) === 0),
);

/** 数据源展示名 */
function dsLabel(ds: DataSourceInfo | undefined | null): string {
  if (!ds) return "未选择";
  return ds.id === 0 || ds.type === "master" ? ds.name || "默认主数据源" : ds.name || `数据源 #${ds.id}`;
}

function dsById(id: number): DataSourceInfo | undefined {
  return datasources.value.find(d => d.id === id);
}

/** 来源数据源切换：拉库列表并保留原选择 */
async function onSyncSrcDsChange() {
  syncSrcDb.value = "";
  syncSrcDbs.value = [];
  syncSrcDb.value = await loadSyncDbs(syncSrcDs.value, dbs => (syncSrcDbs.value = dbs));
}

/** 目标数据源切换 */
async function onSyncDstDsChange() {
  syncDstDb.value = "";
  syncDstDbs.value = [];
  syncDstDb.value = await loadSyncDbs(syncDstDs.value, dbs => (syncDstDbs.value = dbs));
}

/** 来源/目标库选择变化：清掉历史差异，防止“旧结果配新选择” */
function onSyncSrcDbChange() {
  resetSyncResult();
}

function onSyncDstDbChange() {
  resetSyncResult();
}

function resetSyncResult() {
  syncItems.value = [];
  syncDeployScript.value = "";
  syncRan.value = false;
}

async function loadSyncDbs(dsId: number, apply: (dbs: string[]) => void): Promise<string> {
  try {
    const dbs = await fetchDbDatabases(dsId);
    apply(dbs.length ? dbs : [""]);
    return dbs[0] ?? "";
  } catch (e) {
    message.error(`加载 ${dsLabel(dsById(dsId))} 的数据库列表失败: ${String((e as Error)?.message ?? e)}`);
    apply([]);
    return "";
  }
}

/** 目标数据源对象（模板展示用） */
const syncDstDsObj = computed(() => dsById(syncDstDs.value));

/** 源/目标两侧连接信息卡 */
const syncSrcInfo = computed(() => dbInfoRows(syncSrcDs.value, syncSrcDb.value));
const syncDstInfo = computed(() => dbInfoRows(syncDstDs.value, syncDstDb.value));

function dbInfoRows(dsId: number, db: string): { k: string; v: string }[] {
  const ds = dsById(dsId);
  if (!ds) {
    return ["云名称", "项目名称", "连接类型", "连接名称", "主机", "端口", "服务器版本"]
      .map(k => ({ k, v: "--" }));
  }
  const type = ds.type || "--";
  return [
    { k: "云名称", v: "--" },
    { k: "项目名称", v: "--" },
    { k: "连接类型", v: type === "master" ? "默认主数据源" : type.toUpperCase() },
    { k: "连接名称", v: ds.name || "--" },
    { k: "主机", v: ds.host || "--" },
    { k: "端口", v: ds.port != null ? String(ds.port) : "--" },
    { k: "服务器版本", v: ds.version || "--" },
  ];
}

/** 是否可以比较：源/目标都选了数据源与库（不同库） */
const canCompare = computed(
  () =>
    syncSrcDb.value.trim() !== "" &&
    syncDstDb.value.trim() !== "" &&
    (syncSrcDs.value !== syncDstDs.value || syncSrcDb.value !== syncDstDb.value),
);

/** 交换源与目标 */
function swapSyncSides() {
  const dsId = syncSrcDs.value;
  const db = syncSrcDb.value;
  const dbs = syncSrcDbs.value;
  syncSrcDs.value = syncDstDs.value;
  syncSrcDb.value = syncDstDb.value;
  syncSrcDbs.value = syncDstDbs.value;
  syncDstDs.value = dsId;
  syncDstDb.value = db;
  syncDstDbs.value = dbs;
  resetSyncResult();
}

/** 需要同步的差异数（排除只提示的那些） */
const syncActionableCount = computed(
  () => syncItems.value.filter(d => !SYNC_EXTRA_KINDS.has(d.kind)).length,
);
/** 目标多出来的差异数 */
const syncExtraCount = computed(
  () => syncItems.value.filter(d => SYNC_EXTRA_KINDS.has(d.kind)).length,
);

/** 差异按操作分组 */
const GROUP_ACTION_ORDER = [
  { key: "modify", name: "要修改的对象", kinds: ["COLUMN_MISMATCH", "INDEX_MISMATCH"] },
  { key: "create", name: "要创建的对象", kinds: ["MISSING_TABLE", "MISSING_COLUMN", "MISSING_INDEX", "MISSING_FOREIGN_KEY"] },
  { key: "delete", name: "要删除的对象", kinds: ["EXTRA_TABLE", "EXTRA_COLUMN"] },
  { key: "none", name: "无操作", kinds: [] },
];

/** 差异按对象类型分组 */
const GROUP_TYPE_ORDER = [
  { key: "table", name: "表", kinds: ["MISSING_TABLE", "EXTRA_TABLE"] },
  { key: "column", name: "列", kinds: ["MISSING_COLUMN", "EXTRA_COLUMN", "COLUMN_MISMATCH"] },
  { key: "index", name: "索引", kinds: ["MISSING_INDEX", "INDEX_MISMATCH"] },
  { key: "foreignKey", name: "外键", kinds: ["MISSING_FOREIGN_KEY"] },
];

/** 当前分组的完整列表（含空组，便于展示 0 计数） */
const syncGroupDefs = computed(() =>
  syncGroupBy.value === "action" ? GROUP_ACTION_ORDER : GROUP_TYPE_ORDER,
);

function kindGroupKey(kind: string, by: "action" | "type"): string {
  const defs = by === "action" ? GROUP_ACTION_ORDER : GROUP_TYPE_ORDER;
  const hit = defs.find(g => g.kinds.includes(kind));
  return hit ? hit.key : "none";
}

/** 分组展开状态（按分组 key 维护，避免模板里嵌套 ref 不解包） */
const syncGroupOpen = reactive<Record<string, boolean>>({
  modify: true,
  create: true,
  delete: true,
  none: false,
});

/** 分组视图：每个组带 open 状态、items（含勾选）、已勾选计数 */
const syncGroups = computed(() =>
  syncGroupDefs.value.map(def => {
    const known = def.kinds;
    const inGroup =
      def.key === "none"
        ? syncItems.value.filter(d => !GROUP_ACTION_ORDER.some(g => g.kinds.includes(d.kind)))
        : syncItems.value.filter(d => known.includes(d.kind));
    return {
      key: def.key,
      name: def.name,
      open: syncGroupOpen[def.key],
      items: inGroup,
      checkedCount: inGroup.filter(d => d.checked).length,
    };
  }),
);

/** 操作标记：创建 + / 修改 ~ / 删除 - / 无操作 = */
function syncOpIcon(d: SyncDiffRow): string {
  if (d.kind === "MISSING_TABLE" || d.kind === "MISSING_COLUMN"
      || d.kind === "MISSING_INDEX" || d.kind === "MISSING_FOREIGN_KEY") return "+";
  if (d.kind === "EXTRA_TABLE" || d.kind === "EXTRA_COLUMN") return "-";
  if (d.kind === "COLUMN_MISMATCH" || d.kind === "INDEX_MISMATCH") return "~";
  return "=";
}

function syncOpClass(d: SyncDiffRow): string {
  if (d.kind === "COLUMN_MISMATCH" || d.kind === "INDEX_MISMATCH") return "op-modify";
  if (d.ddl) return "op-create";
  return "op-delete";
}

/** 差异行「源对象 / 目标对象」列展示：表名或 表.对象（与 Navicat 列表一致） */
function syncGridObj(d: SyncDiffRow): string {
  if (!d.object) return d.table || "";
  return d.object === d.table ? d.table : `${d.table}.${d.object}`;
}

/** 操作列动词：创建 / 修改 / 删除 / 无操作 */
function syncOpVerb(d: SyncDiffRow): string {
  if (d.kind === "MISSING_TABLE" || d.kind === "MISSING_COLUMN"
      || d.kind === "MISSING_INDEX" || d.kind === "MISSING_FOREIGN_KEY") return "创建";
  if (d.kind === "EXTRA_TABLE" || d.kind === "EXTRA_COLUMN") return "删除";
  if (d.kind === "COLUMN_MISMATCH" || d.kind === "INDEX_MISMATCH") return "修改";
  return "无操作";
}

/** SQL 关键字（高亮用） */
const SQL_KEYWORDS = new Set([
  "SELECT","FROM","WHERE","AND","OR","NOT","NULL","IS","IN","LIKE","BETWEEN",
  "INSERT","INTO","VALUES","UPDATE","SET","DELETE","CREATE","TABLE","ALTER","ADD",
  "DROP","INDEX","PRIMARY","KEY","FOREIGN","REFERENCES","CONSTRAINT","UNIQUE",
  "DEFAULT","ENGINE","CHARSET","COMMENT","AUTO_INCREMENT","IF","EXISTS","USE",
  "BEGIN","COMMIT","ROLLBACK","TRUNCATE","RENAME","MODIFY","CHANGE","COLUMN",
  "VARCHAR","INT","BIGINT","TINYINT","CHAR","TEXT","LONGTEXT","DECIMAL","DOUBLE",
  "FLOAT","BOOLEAN","DATE","DATETIME","TIMESTAMP","JSON","BLOB","MEDIUMTEXT",
]);

function sqlHtmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 轻量 SQL 语法高亮：字符串/反引号标识符/注释/数字/关键字上色 */
function sqlHighlight(sql: string): string {
  if (!sql) return "";
  const re =
    /'([^'\\]|\\.)*'|`([^`\\]|\\.)*`|--[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b/gi;
  let out = "";
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(sql)) !== null) {
    out += sqlHtmlEscape(sql.slice(last, m.index));
    const tok = m[0];
    let cls = "";
    if (tok.startsWith("'")) cls = "sql-str";
    else if (tok.startsWith("`")) cls = "sql-id";
    else if (tok.startsWith("--") || tok.startsWith("/*")) cls = "sql-com";
    else if (/^\d/.test(tok)) cls = "sql-num";
    else if (SQL_KEYWORDS.has(tok.toUpperCase())) cls = "sql-kw";
    out += cls ? `<span class="${cls}">${sqlHtmlEscape(tok)}</span>` : sqlHtmlEscape(tok);
    last = re.lastIndex;
  }
  out += sqlHtmlEscape(sql.slice(last));
  return out;
}

/** 某分组内的全部项（不分有无 DDL：勾选态与行内 checkbox 完全一致） */
function groupItems(key: string): SyncDiffRow[] {
  const g = syncGroups.value.find(g => g.key === key);
  return g ? g.items : [];
}

/** 分组头：全选（作用于组内全部项，与行内勾选框一致；部署脚本仍只取有 DDL 的项） */
function setGroupChecked(key: string, value: boolean) {
  groupItems(key).forEach(d => (d.checked = value));
  syncDeployScript.value = buildDeployScript();
}

/** 分组头：反选 */
function invertGroupChecked(key: string) {
  groupItems(key).forEach(d => (d.checked = !d.checked));
  syncDeployScript.value = buildDeployScript();
}

/** 勾选差异拼接部署脚本 */
function buildDeployScript(): string {
  return syncItems.value
    .filter(d => d.checked && d.ddl)
    .map(d => d.ddl)
    .join("\n");
}

/** 逐项勾选/取消勾选差异时，部署脚本实时重算 */
watch(
  () => syncItems.value.map(d => d.checked).join(","),
  () => {
    if (syncView.value === "diff") {
      syncDeployScript.value = buildDeployScript();
    }
  },
);

/** 顶部概览文案 */
const syncOverviewSrc = computed(() => {
  const ds = dsById(syncSrcDs.value);
  return `${dsLabel(ds)} / ${syncSrcDb.value || "—"}`;
});
const syncOverviewDst = computed(() => {
  const ds = dsById(syncDstDs.value);
  return `${dsLabel(ds)} / ${syncDstDb.value || "—"}`;
});

/**
 * 打开结构同步弹窗。
 *
 * <p>默认把「当前数据源 + 当前库当来源、另一个库当目标」——
 * 用户从某个库的右键点进来时，这个方向最可能是他要的。
 * 方向永远是用户显式选的：结构同步是单向操作，
 * 「以谁为准」不该由实现替用户定。</p>
 *
 * @param database 当前库，作为来源
 */
function openStructureSync(database = activeDatabase.value) {
  if (!database) {
    message.warning("请先在左侧选择一个库");
    return;
  }
  syncView.value = "select";
  syncSrcDs.value = currentDatasourceId.value;
  syncSrcDb.value = database;
  syncTableFilter.value = "";
  syncItems.value = [];
  syncDiffError.value = "";
  syncRan.value = false;
  syncLog.value = [];
  syncRunning.value = false;
  syncRunDone.value = false;
  syncDeployScript.value = "";
  syncVisible.value = true;
  syncSrcDbs.value = databases.value.length ? databases.value : [database];
  // 目标默认选中第一个不是它的库（同一数据源内）
  const other = databases.value.find(db => db && db !== database) || "";
  syncDstDs.value = currentDatasourceId.value;
  syncDstDb.value = other;
  syncDstDbs.value = databases.value.length ? databases.value : [other || ""];
}

/** 比较两个库（选择视图点「比较」；比较通过才进入差异视图） */
async function runStructureDiff(): Promise<void> {
  if (syncComparing()) return;
  if (!canCompare.value) {
    message.warning("请同时选择来源与目标（数据源 + 数据库）");
    return;
  }
  syncView.value = "compare";
  startCompareAnimation();
  syncLoading.value = true;
  syncDiffError.value = "";
  try {
    const raw = await compareDbStructure({
      sourceDatasourceId: syncSrcDs.value,
      sourceDatabase: syncSrcDb.value,
      targetDatasourceId: syncDstDs.value,
      targetDatabase: syncDstDb.value,
      tables: syncTableFilter.value.trim() || undefined,
    });
    syncItems.value = raw.map(it => ({ ...it, checked: !!(it.ddl), originalKind: it.kind }));
    syncRan.value = true;
    syncDeployScript.value = buildDeployScript();
    stopCompareAnimation();
    syncView.value = "diff";
  } catch (e) {
    stopCompareAnimation();
    syncDiffError.value = `比较失败：${String((e as Error)?.message ?? e)}`;
    syncItems.value = [];
    syncRan.value = true;
    syncView.value = "select";
  } finally {
    syncLoading.value = false;
  }
}

function syncComparing(): boolean {
  return syncView.value === "compare";
}

/** 比较中的动画进度：阶段文案轮换，进度条推进到 90% 停住 */
function startCompareAnimation() {
  const phases = [
    "正在获取表结构…",
    "正在获取列…",
    "正在获取索引…",
    "正在获取外键…",
    "正在对比差异…",
  ];
  let i = 0;
  syncComparePct.value = 5;
  syncComparePhase.value = phases[0];
  syncCompareTimer = setInterval(() => {
    syncComparePct.value = Math.min(90, syncComparePct.value + 3 + Math.random() * 6);
    if (syncComparePct.value > 60 && i < phases.length - 1) {
      i++;
      syncComparePhase.value = phases[i];
    }
  }, 260);
}

function stopCompareAnimation() {
  if (syncCompareTimer) {
    clearInterval(syncCompareTimer);
    syncCompareTimer = null;
  }
  syncComparePct.value = 100;
}

function cancelSyncCompare() {
  stopCompareAnimation();
  syncView.value = "select";
  syncLoading.value = false;
}

/** 进入部署视图 */
function goDeploy() {
  syncView.value = "deploy";
  syncDeployTab.value = "script";
  syncLog.value = [];
  syncRunning.value = false;
  syncRunDone.value = false;
  syncRunElapsed.value = 0;
  syncStop = false;
}

/** 部署视图底部 tab 切换（部署脚本 ↔ 消息日志） */
function switchSyncDeployTab(tab: "script" | "log") {
  syncDeployTab.value = tab;
  if (tab === "log") void scrollSyncLog();
}

/** 部署视图「上一步」：回到差异视图 */
function backFromDeploy() {
  if (syncRunning.value) return;
  syncView.value = "diff";
}

/** 部署视图「重新比较」：回到选择视图重跑比较 */
function recompareFromDeploy() {
  if (syncRunning.value) return;
  runStructureDiff();
}

/** 点「停止」：标记中止，忽略后续 SSE 事件 */
function stopSyncRun() {
  syncStop = true;
  syncRunning.value = false;
  syncLog.value.push({
    no: "!",
    sql: "",
    msg: "已停止执行（后续日志忽略）",
  });
  void scrollSyncLog();
}

/**
 * 部署（第四步）：把部署脚本在目标库逐条执行，SSE 实时日志。
 *
 * <p>与后端 {@code /ms/monitor/db/structure-sync-run} 建 SSE 连接并传入
 * 前端勾选/编辑后的部署脚本；每执行一条语句服务端即推一条 {@code log} 事件，
 * 完成推 {@code done}、链路早期失败推 {@code error}。前端只负责追加渲染，
 * 不用轮询、不用等整体返回。</p>
 */
function runStructureSync(): void {
  if (syncRunning.value || syncRunDone.value) return;
  const script = syncDeployScript.value.trim();
  if (!script) {
    message.warning("部署脚本为空，无法执行");
    return;
  }
  syncStop = false;
  syncLog.value = [];
  syncRunning.value = true;
  syncRunDone.value = false;
  syncRunTotal.value = 0;
  syncRunOk.value = 0;
  syncRunFail.value = 0;
  syncRunElapsed.value = 0;
  // 点「开始」后直接切到消息日志 tab，实时展示执行过程（Navicat 行为）
  syncDeployTab.value = "log";
  void scrollSyncLog();
  const startedAt = Date.now();
  http()
    .post("/ms/monitor/db/structure-sync-run")
    .noToast(true)
    .data({
      sourceDatasourceId: syncSrcDs.value,
      sourceDatabase: syncSrcDb.value,
      targetDatasourceId: syncDstDs.value,
      targetDatabase: syncDstDb.value,
      tables: syncTableFilter.value.trim() || undefined,
      stopOnError: syncOptStopOnError.value,
      script,
    })
    .sse<Record<string, unknown>>({
      onMessage: (e) => {
        if (syncStop) return;
        const data = (e.data ?? {}) as Record<string, unknown>;
        if (e.event === "log") {
          syncLog.value.push({
            no: String(data.no ?? ""),
            sql: String(data.sql ?? ""),
            ok: data.ok === true,
            affected: typeof data.affectedRows === "number" ? data.affectedRows : undefined,
            error: data.error ? String(data.error) : undefined,
          });
          if (data.ok === true) syncRunOk.value += 1;
          else syncRunFail.value += 1;
          void scrollSyncLog();
        } else if (e.event === "done") {
          syncRunTotal.value = Number(data.total ?? 0);
          syncRunOk.value = Number(data.ok ?? 0);
          syncRunFail.value = Number(data.fail ?? 0);
          syncRunElapsed.value = Date.now() - startedAt;
          syncRunDone.value = true;
          syncRunning.value = false;
          void scrollSyncLog();
        } else if (e.event === "error") {
          syncLog.value.push({ no: "!", sql: "", error: String(data.message ?? "执行失败"), ok: false });
          syncRunDone.value = true;
          syncRunning.value = false;
          syncRunElapsed.value = Date.now() - startedAt;
          void scrollSyncLog();
        }
      },
      onError: (err) => {
        if (syncStop) return;
        syncLog.value.push({
          no: "!",
          sql: "",
          error: String((err as { message?: string } | null)?.message ?? err ?? "连接中断"),
          ok: false,
        });
        syncRunDone.value = true;
        syncRunning.value = false;
        syncRunElapsed.value = Date.now() - startedAt;
        void scrollSyncLog();
      },
    });
}

/** 日志追加后滚动到底部 */
function scrollSyncLog() {
  void nextTick(() => {
    const el = syncLogEl.value;
    if (el) el.scrollTop = el.scrollHeight;
  });
}

/** SQL 高亮层的 <pre>（部署脚本 tab 内，负责与上层 textarea 同步滚动） */
const syncSqlHlEl = ref<HTMLElement>();

/** textarea 滚动/输入时同步下层高亮 pre 的滚动位置（两者逐字对齐） */
function syncSqlScroll() {
  void nextTick(() => {
    const ta = syncSqlHlEl.value?.parentElement?.querySelector<HTMLTextAreaElement>(".dbm-sync-sql-input");
    const hl = syncSqlHlEl.value;
    if (!ta || !hl) return;
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
  });
}

/** 保存配置文件：把当前源/目标选择导出为 JSON 下载 */
function saveSyncProfile() {
  const payload = {
    sourceDatasourceId: syncSrcDs.value,
    sourceDatabase: syncSrcDb.value,
    targetDatasourceId: syncDstDs.value,
    targetDatabase: syncDstDb.value,
    tableFilter: syncTableFilter.value,
  };
  const json = JSON.stringify(payload, null, 2);
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "结构同步配置文件.json";
  link.click();
  URL.revokeObjectURL(url);
  message.success("已导出配置文件");
}

/** 加载配置文件：读取 JSON 还原源/目标选择 */
function loadSyncProfile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as {
        sourceDatasourceId?: number;
        sourceDatabase?: string;
        targetDatasourceId?: number;
        targetDatabase?: string;
        tableFilter?: string;
      };
      if (typeof data.sourceDatabase !== "string" || typeof data.targetDatabase !== "string") {
        message.error("配置文件缺少 source/target 数据库");
        return;
      }
      syncSrcDs.value = Number(data.sourceDatasourceId ?? syncSrcDs.value);
      syncSrcDb.value = data.sourceDatabase;
      syncSrcDbs.value = (await loadSyncDbs(syncSrcDs.value, dbs => (syncSrcDbs.value = dbs))) ? syncSrcDbs.value : [data.sourceDatabase];
      syncSrcDb.value = data.sourceDatabase;
      syncDstDs.value = Number(data.targetDatasourceId ?? syncDstDs.value);
      syncDstDb.value = data.targetDatabase;
      syncDstDbs.value = (await loadSyncDbs(syncDstDs.value, dbs => (syncDstDbs.value = dbs))) ? syncDstDbs.value : [data.targetDatabase];
      syncDstDb.value = data.targetDatabase;
      syncTableFilter.value = data.tableFilter ?? "";
      resetSyncResult();
      message.success("已加载配置文件");
    } catch (e) {
      message.error(`加载配置文件失败：${String((e as Error)?.message ?? e)}`);
    }
  };
  input.click();
}

function closeSync() {
  stopCompareAnimation();
  syncVisible.value = false;
}

// ==================== 导出数据库文档（后端复用 utils 层 DocumentProvider SPI） ====================

const docExportVisible = ref(false);
const docExportDatabase = ref("");
const docExportFormat = ref("markdown");
const docExportTemplate = ref("DEFAULT");
const docExportFormats = ref<DbDocumentFormat[]>([]);
const docExportTemplates = ref<string[]>([]);
const docExportLoading = ref(false);
const docExportFormatsError = ref("");

// 在线查看文档（右键「查看文档」→ markdown 转 HTML 弹窗预览）
const docPreviewVisible = ref(false);
const docPreviewLoading = ref(false);
const docPreviewContent = ref("");
const docPreviewError = ref("");
const docPreviewDatabase = ref("");

/** 格式中文名（渲染器名保持英文，与后端 SPI 名一致，便于对排查） */
const DOC_FORMAT_LABELS: Record<string, string> = {
  markdown: "Markdown（.md，纯文本）",
  html: "HTML（.html，浏览器可预览）",
  word: "Word（.docx）",
  pdf: "PDF（.pdf）",
};

/**
 * 打开文档导出对话框。
 *
 * <p>可选格式来自后端 {@code /document/formats} 的实际探测，不是前端写死四项：
 * word/pdf 的渲染器分属独立模块，宿主没引就没有，硬编码会给出点了就报
 * 「未找到文档导出实现」的选择项。</p>
 *
 * @param database 目标库
 */
async function openDocumentExport(database = activeDatabase.value) {
  if (!database) {
    message.warning("请先在左侧选择一个库");
    return;
  }
  docExportDatabase.value = database;
  docExportFormat.value = "markdown";
  docExportTemplate.value = "DEFAULT";
  docExportFormatsError.value = "";
  docExportVisible.value = true;
  try {
    const caps = await dbDocumentFormats();
    docExportFormats.value = caps?.formats ?? [];
    docExportTemplates.value = caps?.templates ?? [];
    if (docExportFormats.value.length === 0) {
      docExportFormatsError.value = "当前实例未装配任何文档导出渲染器";
    } else if (!docExportFormats.value.some(f => f.format === docExportFormat.value)) {
      docExportFormat.value = docExportFormats.value[0].format;
    }
  } catch (e) {
    docExportFormats.value = [];
    docExportFormatsError.value = `查询导出能力失败：${(e as Error).message}`;
  }
}

/**
 * 执行文档导出并落盘。
 *
 * <p>文件名取后端给的（它按文档标题生成），而不是前端拼一个：中文标题经
 * RFC 5987 编码后由后端给出，前端再拼一次容易出现两套命名。</p>
 */
async function doDocumentExport() {
  if (!docExportDatabase.value || docExportLoading.value) return;
  docExportLoading.value = true;
  try {
    const { blob, filename } = await downloadDbDocument({
      datasourceId: currentDatasourceId.value,
      database: docExportDatabase.value,
      format: docExportFormat.value,
      template: docExportTemplate.value,
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    docExportVisible.value = false;
    message.success(`文档已导出：${filename}`);
  } catch (e) {
    message.error(`文档导出失败：${(e as Error).message}`);
  } finally {
    docExportLoading.value = false;
  }
}

/**
 * 数据源根节点右键「查看数据库文档」：数据源级（不带库名），复用与
 * 数据中心主页同一条 {@code previewDbDocument} 管线。
 *
 * <p>与库级 {@link openDocumentPreview} 的区别只在粒度：库级带 {@code database}
 * 参数采集单个库，这里是整条连接（DocumentParser("database") 会遍历其全部库）。
 * 展示走同一个 doc 预览弹窗（markdown → HTML iframe），状态与文案复用。</p>
 */
async function openDatasourceDocument() {
  if (currentDatasourceId.value <= 0) {
    message.warning("请先连接一个数据源");
    return;
  }
  docPreviewDatabase.value = "";
  docPreviewLoading.value = true;
  docPreviewError.value = "";
  docPreviewContent.value = "";
  docPreviewVisible.value = true;
  try {
    docPreviewContent.value = await previewDbDocument({
      datasourceId: currentDatasourceId.value,
      template: docExportTemplate.value,
    });
  } catch (e) {
    docPreviewError.value = String((e as Error)?.message ?? e);
  } finally {
    docPreviewLoading.value = false;
  }
}

/**
 * 库右键「查看文档」：把数据库设计文档（markdown → HTML）在弹窗里在线预览。
 *
 * <p>与导出同一份采集/渲染链路，只是不落盘；word / pdf 是二进制，
 * 后端预览端点会返回 501，这里把错误原文展示给用户而不是假装成功。</p>
 *
 * @param database 目标库名
 */
async function openDocumentPreview(database = activeDatabase.value) {
  if (!database) {
    message.warning("请先在左侧选择一个库");
    return;
  }
  docPreviewDatabase.value = database;
  docPreviewLoading.value = true;
  docPreviewError.value = "";
  docPreviewContent.value = "";
  docPreviewVisible.value = true;
  try {
    docPreviewContent.value = await previewDbDocument({
      datasourceId: currentDatasourceId.value,
      database,
      template: docExportTemplate.value,
    });
  } catch (e) {
    docPreviewError.value = String((e as Error)?.message ?? e);
  } finally {
    docPreviewLoading.value = false;
  }
}

/**
 * 读取并绘制 ER 图。
 *
 * <p>页签与右键弹框共用同一份图状态：页签从 activeTabObj 取库名，
 * 弹框从 erDialogDatabase 取库名。ER 图对大库是**一次性整体视图**，
 * 在每次切库/切页签时都重拉会让浏览树的过程明显变慢。</p>
 */
async function loadErDiagram(): Promise<void> {
  const tab = activeTabObj.value;
  const database = erDialogDatabase.value || (tab && tab.type === "er" ? tab.database : "");
  if (!database) return;
  erLoading.value = true;
  erError.value = "";
  try {
    const data = await fetchErDiagram(
      erTableFilter.value.trim() || undefined,
      currentDatasourceId.value,
      database,
    );
    erTables.value = data.tables || [];
    erRelations.value = data.relations || [];
    // 关系指向的表若不在清单里，补一个占位节点：
    // 少一个节点的话，边会指向虚空，用户分不清是「表没画」还是「约束坏了」
    const names = new Set(erTables.value.map(t => t.name));
    for (const r of erRelations.value) {
      for (const n of [r.fromTable, r.toTable]) {
        if (n && !names.has(n)) {
          names.add(n);
          erTables.value.push({ name: n, comment: "（被外键引用，但不在当前库的表清单里）" });
        }
      }
    }
    // 表卡列预览：只对有关系的表预取列（关系表通常远少于全表，避免 N+1 打满库）。
    // 孤立表不预取，保持圆点形态；用户双击表卡时 ensureErCols 幂等补拉。
    const related = new Set<string>();
    for (const r of erRelations.value) {
      if (r.fromTable) related.add(r.fromTable);
      if (r.toTable) related.add(r.toTable);
    }
    for (const name of related) {
      void ensureErCols(name);
    }
  } catch (e) {
    erError.value = `读取失败：${String((e as Error)?.message ?? e)}`;
    erTables.value = [];
    erRelations.value = [];
  } finally {
    erLoading.value = false;
  }
}

/** 打开某张表的列清单 */
async function openErColumns(name: string): Promise<void> {
  if (!name) return;
  erPickedTable.value = name;
  erColumnsVisible.value = true;
  erPickedColumns.value = [];
  try {
    const cols = await fetchTableColumns(name, currentDatasourceId.value, erDialogDatabase.value || activeTabObj.value?.database);
    erPickedColumns.value = cols || [];
  } catch (e) {
    message.error(`读取列失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 从 ER 图打开该表的数据页签 */
function openErTableData(tableName: string) {
  if (!tableName) return;
  erColumnsVisible.value = false;
  openTableData(tableName, erDialogDatabase.value || activeTabObj.value?.database || activeDatabase.value);
}

/**
 * 导出为 Graphviz DOT。
 *
 * <p>不给 PNG 是因为那是**服务端渲染**，而这里只有浏览器 ——
 * 假装能导出图片、点下去给个空文件，比不给这个按钮更糟。
 * DOT 可以直接喂给本地 Graphviz 出图。</p>
 */
function exportErDot(): void {
  const q = (s: string) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  const lines = ["digraph er {", "  rankdir=LR;", '  node [shape=record, fontsize=10];'];
  for (const t of erTables.value) {
    const label = t.comment ? `${t.name}\\n${t.comment}` : t.name;
    lines.push(`  ${q(t.name)} [label="${label}"];`);
  }
  for (const r of erRelations.value) {
    lines.push(`  ${q(r.fromTable)} -> ${q(r.toTable)} `
      + `[label="${r.fromColumn ?? ""}${r.name ? ` (${r.name})` : ""}"];`);
  }
  lines.push("}");
  downloadText(
    `${erDialogDatabase.value || activeTabObj.value?.database || "er"}-${Date.now()}.dot`,
    lines.join("\n"),
    "text/plain",
  );
  message.success(`已导出 ${erRelations.value.length} 条关系`);
}

/**
 * 页签内显示的 库.表 全名
 * @param tab 当前页签
 */
function qualified(tab: Tab) {
  return tabTitle(tab.tableName || "", tab.database || "");
}

/**
 * 新建 SQL 查询页签
 */
function openNewQuery() {
  const id = "query-" + Date.now();
  const tab: Tab = { id, type: "query", title: "查询 " + (tabs.value.filter(t => t.type === "query").length + 1), sql: "", database: activeDatabase.value };
  tabs.value.push(tab);
  activeTab.value = id;
}

/**
 * 打开用户管理页签（内嵌面板）。
 *
 * <p>用户是连接级对象，不挂在某个库下 —— 库右键进到这里时只负责打开面板，
 * 面板内部按当前数据源查询 {@code mysql.user}。重复打开复用已有页签。</p>
 */
function openUsersTab() {
  const existing = tabs.value.find(t => t.type === "users");
  if (existing) {
    activeTab.value = existing.id;
    return;
  }
  const id = "users-" + Date.now();
  const tab: Tab = { id, type: "users", title: "用户管理" };
  tabs.value.push(tab);
  activeTab.value = id;
}

/**
 * 关闭页签
 * @param id 页签 ID
 */
function closeTab(id: string) {
  const idx = tabs.value.findIndex(t => t.id === id);
  if (idx >= 0) {
    tabs.value.splice(idx, 1);
    if (activeTab.value === id) {
      const next = tabs.value[Math.min(idx, tabs.value.length - 1)];
      if (next) {
        selectTab(next.id);
      } else {
        activeTab.value = "";
      }
    }
  }
}

/**
 * 当前表的查询偏好键（`库.表`）。
 *
 * <p>刻意按表分键：A 表的 `status = 1` 套到 B 表上会引用 B 表不存在的列，
 * 直接报错。E2 的列偏好已经踩过同一个坑（全局一份会让「在 A 表隐藏的列
 * 到 B 表也消失」）。</p>
 */
function tablePrefKey(tab?: { tableName?: string; database?: string }): string {
  const t = tab ?? activeTabObj.value;
  if (!t?.tableName) return "";
  return `${t.database || activeDatabase.value}.${t.tableName}`;
}

/**
 * 「正在恢复某张表的偏好」标志。
 *
 * <p>{@link restoreTablePref} 会先把旧条件清空再填新条件，这一帧不该被
 * 兜底落盘的 watch 看到 —— 否则会把**上一张表**的条件写进**这张表**的键，
 * 正好制造出「切表后刷新，A 表的条件跑到 B 表上」的故障。</p>
 */
let tabPrefRestoring = false;

/**
 * 切到某张表时恢复它自己的筛选条件。
 *
 * <p>不恢复的话，用户为宽表配了 5 个条件、刷新一次就得重配一遍 ——
 * 而筛选条件往往是「排查了半小时才凑出来」的。</p>
 */
function restoreTablePref(tab: { tableName?: string; database?: string }): void {
  const pref = loadTablePref(tablePrefKey(tab));
  // 恢复成「无筛选」而不是保留上一张表的：把 A 表的条件留在 B 表上
  // 会让 B 表直接报错，而用户完全不知道条件是哪来的。
  tabPrefRestoring = true;
  try {
    filterWhere.value = pref?.filterWhere ?? "";
    activeFilters.value = (pref?.filters ?? []).map(f => ({ ...f }));
  } finally {
    tabPrefRestoring = false;
  }
  if (pref && (pref.filterWhere || pref.filters.length > 0)) {
    message.info(`已恢复该表的筛选条件（${pref.filters.length} 个条件）`);
  }
}

/** 把当前表的筛选条件存进本地（筛选变更时调用） */
function persistTablePref(): void {
  const key = tablePrefKey();
  if (!key) return;
  if (!filterWhere.value && activeFilters.value.length === 0) {
    // 没有筛选就别留空记录，否则容量上限会被一堆空条目占满
    clearTablePref(key);
    return;
  }
  saveTablePref(key, {
    filterWhere: filterWhere.value,
    filters: activeFilters.value.map(f => ({ ...f })),
  });
}

async function loadTableData(tab: Tab | undefined, page?: number) {
  if (!tab?.tableName) return;
  const seq = ++tableDataReqSeq.value;
  tableLoading.value = true;
  try {
    const result = await fetchTableData(
      tab.tableName,
      page ?? tableData.page ?? 1,
      tableData.pageSize,
      sortState.prop || undefined,
      sortState.order || undefined,
      currentDatasourceId.value,
      tab.database,
      showTotal.value,
      filterWhere.value || undefined,
      activeFilters.value.length > 0 ? activeFilters.value : undefined,
    );
    // 期间可能已切表/切页签：过期响应直接丢弃，否则会把网格写回上一张表
    if (seq !== tableDataReqSeq.value || activeTab.value !== tab.id) {
      return;
    }
    Object.assign(tableData, result);
    if (!showTotal.value) {
      // 后端已经按 count 参数跳过 COUNT(*)（count=false 时 total 回 -1）：
      // COUNT 是全表扫描，大表关掉后翻页请求只剩 SELECT+LIMIT/OFFSET。
      tableData.total = -1;
    }
    void loadColumnComments(tab);
    loadPkInfo(tab);
  } catch (e) {
    if (seq === tableDataReqSeq.value) {
      message.error(`加载表数据失败: ${String((e as Error)?.message ?? e)}`);
    }
  } finally {
    // 只有最后一次请求才复位 loading，否则新请求的转圈会被旧请求提前关掉
    if (seq === tableDataReqSeq.value) {
      tableLoading.value = false;
    }
  }
}

/**
 * 加载列注释（表头/行「+注释」显示模式使用）
 * @param tab 当前表页签
 */
async function loadColumnComments(tab: Tab | undefined): Promise<void> {
  if (!tab?.tableName) return;
  try {
    const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
    for (const c of cols) {
      if (c.remark) {
        columnComments[c.name] = c.remark;
      }
    }
  } catch {
    // 注释加载失败不影响数据浏览
  }
}

function onPageChange(page: number) {
  loadTableData(activeTabObj.value, page);
}

/** 换每页条数只能从第一页重新开始 */
function onPageSizeChange(size: number) {
  tableData.pageSize = size;
  tableData.page = 1;
  // 后端看 count 参数：关闭统计总数（showTotal=false）时跳过 COUNT(*) ——
  // COUNT 是全表扫描，关掉后翻页请求只剩 SELECT+LIMIT/OFFSET（DbConsoleController.getTableData）。
  loadTableData(activeTabObj.value, 1);
}

/**
 * 刷新当前表数据
 */
function refreshTableData() {
  const tab = activeTabObj.value;
  if (tab?.tableName) {
    loadTableData(tab);
  }
}

/**
 * 静默刷新的写回：保持 rows / columns 两个数组的引用不变。
 *
 * <p>vxe-table 对 data prop 的换引用与长度变化各管一个 watch
 * （vxe-table es table.js 14185-14198），命中即走内部
 * loadTableData —— 期间 reactData.isRowLoading 为 true，
 * 整表 loading 遮罩会亮数帧（3796 置位、3894 经三轮
 * nextTick 才复位）；columns prop 换引用同样会触发列重建
 * （isColLoading）。遮罩一闪正是「静默刷新」要消灭的闪烁，
 * 故同行数时逐行写回字段、列名列表内容不变时保留原数组，
 * 让 prop 引用纹丝不动，vxe 的两个 watch 都不触发。</p>
 *
 * @param cur 当前表数据（被原地写回）
 * @param next 接口返回的新数据
 */
function writeBackSilently(cur: DbTableDataResult, next: DbTableDataResult): void {
  const rows = cur.rows;
  if (next.rows.length === rows.length) {
    // 同行数：逐行写回字段，数组与行对象引用都不变
    for (let i = 0; i < rows.length; i++) {
      Object.assign(rows[i], next.rows[i]);
    }
  } else {
    // 行数变了（他人并发增删）：真实数据变化，换数组走正常重载
    cur.rows = next.rows;
  }
  // 列名列表：内容不变就不换引用 —— tableColumns 依赖它，
  // 换引用会重算并换掉 ReTable 的 columns prop
  if (
    next.columns.length !== cur.columns.length ||
    next.columns.some((c, i) => c !== cur.columns[i])
  ) {
    cur.columns = next.columns;
  }
  cur.total = next.total;
  cur.page = next.page;
  cur.pageSize = next.pageSize;
}

/**
 * 静默刷新当前表数据（单元格编辑保存后用）：与 {@link refreshTableData} 同一条
 * 数据链路，区别是**不打开 tableLoading 遮罩** —— 整页刷新那下闪烁太明显，
 * 用户会以为页面重载了一次。实现上直接调 fetchTableData 并写回 tableData，
 * 不经过 loadTableData（它第一件事就是把 loading 顶成 true）。
 *
 * <p>写回走 {@link writeBackSilently} 原地写回：不换 rows / columns
 * 数组引用，否则 vxe 检测到 prop 换引用会走内部重载、亮起整表
 * loading 遮罩数帧（isRowLoading / isColLoading），那一下闪烁
 * 正是本函数要避免的。</p>
 *
 * <p>列注释 / 类型 / 主键不随单元格保存变化，这里不再
 * loadColumnComments / loadPkInfo —— 它们会重算 tableColumns
 * 换掉 columns prop，同样触发 vxe 列重建遮罩；首次开表时
 * loadTableData 已载好。</p>
 *
 * <p>切表/换页签的竞态照抄 loadTableData 的序号守卫：静默刷新飞在路上时
 * 用户切了表，过期响应直接丢弃。</p>
 *
 * @param tab 当前表页签
 */
async function silentRefreshTableData(tab: Tab | undefined) {
  if (!tab?.tableName) return;
  const seq = ++tableDataReqSeq.value;
  try {
    const result = await fetchTableData(
      tab.tableName,
      tableData.page,
      tableData.pageSize,
      sortState.prop || undefined,
      sortState.order || undefined,
      currentDatasourceId.value,
      tab.database,
      showTotal.value,
      filterWhere.value || undefined,
      activeFilters.value.length > 0 ? activeFilters.value : undefined,
    );
    if (seq !== tableDataReqSeq.value || activeTab.value !== tab.id) {
      return;
    }
    writeBackSilently(tableData, result);
    if (!showTotal.value) {
      tableData.total = -1;
    }
  } catch {
    // 静默刷新的失败不打断主流程：单元格的值已经乐观写进去了，
    // 刷不出来顶多是过期数据，下一次切页/排序/显式刷新会自然对齐。
  }
}

async function loadTableDesign(tab: Tab) {
  if (!tab.tableName) return;
  designLoading.value = true;
  try {
    const cols = await fetchTableColumns(tab.tableName, currentDatasourceId.value, tab.database);
    designRows.value = cols.map(c => {
      const origin = {
        name: c.name,
        type: normalizeColumnType(c.type),
        size: c.size ?? null,
        nullable: c.nullable !== false,
        defaultValue: c.default ?? "",
        comment: c.remark ?? "",
      };
      return {
        key: ++designRowSeq,
        originalName: c.name,
        ...origin,
        primaryKey: !!c.isPrimaryKey,
        // 把列的完整属性带进行内（类型文本保持内核原样：弹窗要靠它抠长度与小数位）
        type: c.type || origin.type,
        remark: c.remark ?? "",
        default: c.default ?? "",
        baseType: c.baseType,
        unsigned: c.unsigned === true,
        zerofill: c.zerofill === true,
        autoIncrement: c.autoIncrement === true,
        charset: c.charset ?? "",
        collation: c.collation ?? "",
        enumValues: c.enumValues ?? [],
        enumText: (c.enumValues ?? []).join(", "),
        scale: c.scale ?? null,
        origin,
      } as DesignRow;
    });
  } catch (e) {
    message.error(`加载表结构失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    designLoading.value = false;
  }
}

async function executeQuery() {
  const tab = activeTabObj.value;
  if (!tab?.sql) return;
  Object.assign(queryResult, { columns: [], rows: [], rowCount: 0, truncated: false, affectedRows: undefined, message: undefined });
  resultSets.value = [];
  activeResultSet.value = 0;
  const started = Date.now();
  try {
    const tx = await ensureTx();
    const result = await executeDbSql(tab.sql, currentDatasourceId.value, queryTargetDatabase(), tx || undefined, execTimeoutMs());
    Object.assign(queryResult, result);
    resultSets.value = [{ ...result }];
    activeResultSet.value = 0;
    pushQueryHistory(tab.sql, describeResult(result));
  } catch (e) {
    const msg = "执行失败: " + String((e as Error)?.message ?? e);
    queryResult.message = msg;
    // 失败也要入历史：调试时最想回看的恰恰是「刚才那条报错的」
    pushQueryHistory(tab.sql, "失败");
  }
  message.info(`耗时 ${Date.now() - started} ms`);
}

/**
 * 结果摘要（进查询历史）。
 *
 * @param r 单条结果
 * @returns 一行摘要
 */
function describeResult(r: DbQueryResult | DbStatementResult): string {
  if (r.columns !== undefined) return `${r.rowCount ?? 0} 行`;
  if (r.affectedRows !== undefined) return `影响 ${r.affectedRows} 行`;
  return "失败";
}

// ---------- E4 显式事务 ----------

/** 用户想要事务（工具条开关） */
const txWanted = ref(false);
/** 当前未提交事务的 ID，空串表示没有 */
const txId = ref("");
/** 事务绑定的库；改目标库后旧的 txId 就不再适用 */
const txDatabase = ref("");
/** 正在开启 / 提交 / 回滚 */
const txBusy = ref(false);
/** 正在接管孤儿事务（防止并发重复接管） */
let adoptingTx = false;

/**
 * 执行前确保事务已开启（若用户开了开关）。
 *
 * <p>懒开启而不是「开关一打开就开后端事务」：开关是意图，
 * 真正开事务的时机是第一次执行 —— 否则用户只是看一眼工具条
 * 就白白占住一条连接。</p>
 *
 * @returns 事务 ID；没开事务时返回空串
 */
async function ensureTx(): Promise<string> {
  if (!txWanted.value) return "";
  const db = queryTargetDatabase();
  if (txId.value && txDatabase.value === db) return txId.value;
  if (txId.value) {
    // 目标库变了：旧事务的改动在另一个库里，硬接下去会让提交与改动对不上。
    // 先回滚并如实告知，不静默丢弃用户的改动。
    try {
      await rollbackDbTx(txId.value);
      message.warning(`目标库已切换，原事务已回滚（改动在 ${txDatabase.value || "默认库"}）`);
    } catch {
      message.warning("目标库已切换，但原事务回滚失败，请刷新页面确认");
    }
    txId.value = "";
  }
  txBusy.value = true;
  try {
    const started = await beginDbTx(currentDatasourceId.value, db);
    txId.value = started.txId;
    txDatabase.value = started.database || db || "";
    message.success(`已开启事务（库：${txDatabase.value || "默认"}），执行后请提交或回滚`);
  } catch (e) {
    message.error(`开启事务失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    txBusy.value = false;
  }
  return txId.value;
}

/** 提交当前事务 */
async function commitTx(): Promise<void> {
  if (!txId.value) return;
  txBusy.value = true;
  try {
    await commitDbTx(txId.value);
    message.success("事务已提交");
    txId.value = "";
    txDatabase.value = "";
  } catch (e) {
    message.error(`提交失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    txBusy.value = false;
  }
}

/**
 * 回滚当前事务。
 *
 * <p>必须二次确认：回滚不可逆，而用户点它多半是「顺手点一下试试」，
 * 一屏改动的代价不该由误点承担。</p>
 */
async function rollbackTx(): Promise<void> {
  if (!txId.value) return;
  try {
    await ElMessageBox.confirm(
      "回滚会撤销本事务里的全部未提交改动，且不可恢复。确定回滚？",
      "回滚事务",
      { type: "warning", confirmButtonText: "回滚", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  txBusy.value = true;
  try {
    await rollbackDbTx(txId.value);
    message.success("事务已回滚");
    txId.value = "";
    txDatabase.value = "";
  } catch (e) {
    message.error(`回滚失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    txBusy.value = false;
  }
}

/**
 * 关闭页签 / 离开页面时兜底回滚。
 *
 * <p>没有这一步的话，用户开着事务直接关标签页，
 * 后端那条连接会一直挂着直到空闲超时（10 分钟）才被回收 ——
 * 而他根本不知道自己留了东西。</p>
 */
async function releaseTxOnUnmount(): Promise<void> {
  const tx = txId.value;
  if (!tx) return;
  txId.value = "";
  txDatabase.value = "";
  try {
    await rollbackDbTx(tx);
  } catch {
    // 页面正在卸载，报不出来也没人看；后端的空闲回收会兜底
  }
}

/**
 * 查一次后端有没有孤儿事务并接管。
 *
 * <p>前端状态在刷新后就没了，但后端那条连接还活着 —— 不查就会变成
 * 「用户看不见、也关不掉」的事务，白占一条连接直到空闲超时。</p>
 *
 * <p><b>只按数据源匹配，不按库匹配</b>：页面刷新后当前页签/库都没了，
 * 早先还拿 {@code queryTargetDatabase()} 去比，结果永远是匹配不上 ——
 * 功能看起来存在，实际一次都触发不了。</p>
 *
 * <p>同一数据源有多个未结束事务时只接管一个，并如实告知还剩几个：
 * 一次全接管会让用户面对一个说不清对应哪段操作的事务。
 * 每收掉一个，下次切数据源/刷新会再接管下一个。</p>
 */
async function adoptOrphanTx(): Promise<void> {
  if (adoptingTx) return;
  adoptingTx = true;
  try {
    const list = await fetchDbTxStatus();
    if (!list || list.length === 0) return;
    const dsId = currentDatasourceId.value;
    const mine = list.find(s => s.datasourceId === dsId);
    if (!mine) return;
    txId.value = mine.txId;
    txDatabase.value = mine.database || "";
    txWanted.value = true;
    const rest = list.filter(s => s.datasourceId === dsId).length - 1;
    message.warning(rest > 0
      ? `发现上次未结束的事务，已接管（另有 ${rest} 个待处理）`
      : "发现上次未结束的事务，已接管；请提交或回滚");
  } catch {
    // 查不到不影响使用：只是失去了一次自检机会
  } finally {
    adoptingTx = false;
  }
}

/**
 * 执行脚本：多条语句逐条出结果集。
 *
 * <p>默认「执行」按钮走单条端点、保持既有形状；这个入口是给多语句脚本用的，
 * 走 {@code /db/execute-batch}。两者共用同一套切分与参数替换规则
 * （在后端实现），所以同一条 SQL 在两条路径下行为一致。</p>
 */
async function executeScript(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.sql?.trim()) return;
  Object.assign(queryResult, { columns: [], rows: [], rowCount: 0, truncated: false, affectedRows: undefined, message: undefined });
  resultSets.value = [];
  activeResultSet.value = 0;
  const started = Date.now();
  try {
    const tx = await ensureTx();
    const batch = await executeDbSqlBatch(tab.sql, currentDatasourceId.value, queryTargetDatabase(), undefined, undefined, tx || undefined, execTimeoutMs());
    applyBatchResult(batch);
    pushQueryHistory(tab.sql, describeBatch(batch));
  } catch (e) {
    queryResult.message = "执行失败: " + String((e as Error)?.message ?? e);
    pushQueryHistory(tab.sql, "失败");
  }
  message.info(`耗时 ${Date.now() - started} ms`);
}

/** 带参数执行脚本（参数弹窗的「执行」） */
async function executeScriptWithParams(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.sql?.trim()) return;
  const params: Record<string, string> = {};
  for (const n of paramNames.value) params[n] = paramValues[n];
  Object.assign(queryResult, { columns: [], rows: [], rowCount: 0, truncated: false, affectedRows: undefined, message: undefined });
  resultSets.value = [];
  activeResultSet.value = 0;
  const started = Date.now();
  try {
    const batch = await executeDbSqlBatch(tab.sql, currentDatasourceId.value, queryTargetDatabase(), params, undefined, undefined, execTimeoutMs());
    applyBatchResult(batch);
    pushQueryHistory(tab.sql, describeBatch(batch));
  } catch (e) {
    queryResult.message = "执行失败: " + String((e as Error)?.message ?? e);
    pushQueryHistory(tab.sql, "失败");
  }
  message.info(`耗时 ${Date.now() - started} ms`);
}

/**
 * 把批量结果铺到结果区。
 *
 * <p>有失败时**停在第一条失败的结果集上**：用户第一眼要看到的是「错在哪」，
 * 而不是脚本第一段的正常输出。</p>
 *
 * @param batch 批量结果
 */
function applyBatchResult(batch: DbBatchResult): void {
  const sets = batch.results || [];
  // 失败那条语句**不在** results 里：后端在它出错的位置就把整批短路了，
  // results 只含「已成功执行」的那些。所以要把失败的那条补成一个条目，
  // 否则「第 2 条失败」在界面上根本不存在 —— 用户只看到第 1 条的结果，
  // 完全不知道后面还有两条、更不知道错在哪。
  const failedIndex = batch.failedIndex !== undefined && batch.failedIndex >= 0 ? batch.failedIndex : -1;
  const all: DbStatementResult[] = failedIndex >= 0 && sets.length === failedIndex
    ? [...sets, { message: batch.message || "该语句执行失败" }]
    : sets;
  resultSets.value = all;
  const target = failedIndex >= 0 ? Math.min(failedIndex, all.length - 1) : 0;
  activeResultSet.value = Math.max(0, target);
  showResultSet(all[activeResultSet.value]);
  if (all.length === 0) {
    queryResult.message = batch.message || "脚本里没有可执行的语句";
  }
}

/** 批量结果摘要（进查询历史） */
function describeBatch(batch: DbBatchResult): string {
  const n = batch.statementCount ?? batch.results?.length ?? 0;
  if (batch.failedIndex !== undefined && batch.failedIndex >= 0) {
    return `${n} 条，第 ${batch.failedIndex + 1} 条失败`;
  }
  return `${n} 条全部成功`;
}

/**
 * 执行计划（EXPLAIN）。
 *
 * <p>只在**单条**语句上有意义：EXPLAIN 后面跟多条语句时内核会报错，
 * 而报的是语法错误，看不出是「你选了多条」。所以这里先判一下并给明确提示。</p>
 */
async function executeExplain(): Promise<void> {
  const tab = activeTabObj.value;
  const sql = (tab?.sql ?? "").trim();
  if (!sql) {
    message.info("先写点 SQL 再看执行计划");
    return;
  }
  const withoutComments = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
    .replace(/#[^\n]*/g, " ")
    .trim();
  if (withoutComments.includes(";")) {
    message.warning("执行计划只支持单条语句：脚本含多条时，请先只选中要分析的那条");
    return;
  }
  const started = Date.now();
  try {
    // 用单条端点而不是批量：EXPLAIN 只需要一条的结果，批量会让页签多出一个壳
    const result = await executeDbSql(`EXPLAIN ${sql}`, currentDatasourceId.value, queryTargetDatabase(), undefined, execTimeoutMs());
    Object.assign(queryResult, result);
    resultSets.value = [{ ...result }];
    activeResultSet.value = 0;
    message.success(`执行计划已生成（${Date.now() - started} ms）`);
  } catch (e) {
    message.error(`生成执行计划失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 下载当前编辑器内容为 .sql（UTF-8 无 BOM：BOM 会让部分客户端报语法错） */
function saveSqlFile(): void {
  const sql = activeTabObj.value?.sql ?? "";
  if (!sql.trim()) {
    message.info("编辑器是空的，没什么可保存");
    return;
  }
  const db = queryTargetDatabase() || "sql";
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  // 用 Uint8Array 而不是 Blob 字符串：Blob 会带上 BOM
  const bytes = new TextEncoder().encode(sql);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/sql;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${db}_${stamp}.sql`;
  a.click();
  URL.revokeObjectURL(url);
  message.success("已保存为 .sql 文件");
}

/** 触发隐藏的 file input */
function openSqlFile(): void {
  sqlFileInputRef.value?.click();
}

/**
 * 读取用户选中的 .sql 并灌进编辑器。
 *
 * @param e input 的 change 事件
 */
async function onSqlFilePicked(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  // 先清空，否则同一个文件二次选择不会触发 change
  input.value = "";
  if (!file) return;
  const tab = activeTabObj.value;
  if (!tab) return;
  try {
    tab.sql = await file.text();
    message.success(`已打开 ${file.name}`);
  } catch (e) {
    message.error(`读取文件失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 格式化当前 SQL
 */
function formatSql() {
  if (activeTabObj.value?.sql) {
    activeTabObj.value.sql = activeTabObj.value.sql
      .replace(/\s+/g, " ")
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|ORDER BY|GROUP BY|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE)\b/gi, "\n$1");
  }
}

/**
 * 表 / 视图节点右键。
 *
 * <p>视图节点与表节点共用这一个菜单，但两者能做的操作并不相同：视图不能
 * RENAME、不能 TRUNCATE、不能 INSERT 进去，也不能被 DROP TABLE 删掉 ——
 * 这些操作打在视图上只会被内核拒绝（「'x' is a view」之类），用户只会看到一个
 * 必然失败的菜单项。所以这里记下 isView，由菜单决定露出哪几项。</p>
 *
 * @param e 右键事件
 * @param tableName 对象名
 * @param database 库名
 * @param isView 是否为视图节点
 */
function onTableContextMenu(e: MouseEvent, tableName: string, database: string, isView = false) {
  e.stopPropagation();
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = tableName;
  contextMenu.database = database;
  contextMenu.tabId = "";
  contextMenu.isView = isView;
  contextMenu.root = false;
  activeDatabase.value = database;
  void clampContextMenuPosition();
}

/**
 * 数据库节点右键：只带库名，菜单里给库级动作
 * @param e 右键事件
 * @param database 库名
 */
function onDatabaseContextMenu(e: MouseEvent, database: string) {
  e.stopPropagation();
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = "";
  contextMenu.database = database;
  contextMenu.tabId = "";
  contextMenu.isView = false;
  contextMenu.root = false;
  activeDatabase.value = database;
  void clampContextMenuPosition();
}

/**
 * 数据源根节点右键：整条连接的动作（查看数据库文档 / 刷新 / 新建库表等），
 * 不走「侧栏空白」分支 —— 空白分支是新库/新表/新查询这类零上下文动作，
 * 而根节点右键天然带着「当前数据源」这个上下文。
 */
function onRootContextMenu(e: MouseEvent) {
  e.stopPropagation();
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = "";
  contextMenu.database = "";
  contextMenu.tabId = "";
  contextMenu.isView = false;
  contextMenu.root = true;
  void clampContextMenuPosition();
}

function onSidebarContextMenu(e: MouseEvent) {
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = "";
  contextMenu.database = "";
  contextMenu.tabId = "";
  contextMenu.isView = false;
  contextMenu.root = false;
  void clampContextMenuPosition();
}

/**
 * 页签右键（第九批 item 7：顶部页签支持右键关闭）
 * @param e 右键事件
 * @param tabId 目标页签 ID
 */
function onTabContextMenu(e: MouseEvent, tabId: string) {
  e.stopPropagation();
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = "";
  contextMenu.database = "";
  contextMenu.tabId = tabId;
  contextMenu.isView = false;
  contextMenu.root = false;
  void clampContextMenuPosition();
}

/**
 * 关闭除指定页签外的全部页签，并把激活页签切到留下的那一个。
 * @param tabId 要保留的页签 ID
 */
function closeOtherTabs(tabId: string) {
  const keep = tabs.value.find(t => t.id === tabId);
  tabs.value = tabs.value.filter(t => t.id === tabId);
  if (keep) {
    selectTab(keep.id);
  } else {
    activeTab.value = "";
  }
}

/** 关闭全部页签（与逐个点 × 的终态一致：内容区回到空态） */
function closeAllTabs() {
  tabs.value = [];
  activeTab.value = "";
}

function closeContextMenu() {
  contextMenu.visible = false;
}

/**
 * 表头右键菜单。
 *
 * <p>vxe 的右键只覆盖**单元格**：ReTable 的 contextMenu 走 vxe 的 cell-menu 事件，
 * 表头没有任何人接管，右键表头弹的是浏览器默认菜单 —— 和树菜单那套 koi 皮完全两样。</p>
 *
 * <p>这里补一套同皮的表头菜单，并把顶部那排「表头显示 / 行显示」也放进来：
 * 顶部折叠起来之后，这两个开关就靠它（同一个 headerMode / rowMode 状态源，
 * 不是两份实现，不会出现顶部显示「字段」而菜单勾着「类型」的错位）。</p>
 */
const headerMenu = reactive({ visible: false, x: 0, y: 0 });

/** 顶部显示模式那一排是否收起（默认展开，见 dbViewPref.modeRowCollapsed 注释） */
const modeRowCollapsed = ref(viewPref.modeRowCollapsed);

/** 表头菜单定位（位置在打开时已按真实尺寸夹过视口，这里只做直出） */
const headerMenuStyle = computed<Record<string, string>>(() => ({
  left: headerMenu.x + "px",
  top: headerMenu.y + "px",
}));

/** 关表头菜单 */
function closeHeaderMenu(): void {
  headerMenu.visible = false;
}

/**
 * 表头右键：只在表头区域接管，其余一律放行。
 *
 * <p>判据是 vxe 的表头容器 `.vxe-table--header`。单元格 / 表体不能拦：
 * ReTable 自己的 `.re-ctx-menu` 还要靠这次 contextmenu 打开。</p>
 *
 * @param e 原生右键事件（挂在 ReTable 根元素上，由它冒泡上来）
 */
function onGridHeaderContextMenu(e: MouseEvent): void {
  const target = e.target as HTMLElement | null;
  if (!target || !target.closest(".vxe-table--header")) return;
  e.preventDefault();
  // 拦下冒泡：否则 vxe 的全局 contextmenu 处理还会再走一遍单元格那条路径
  e.stopPropagation();
  headerMenu.x = e.clientX;
  headerMenu.y = e.clientY;
  headerMenu.visible = true;
  void nextTick(clampHeaderMenuPosition);
}

/**
 * 按真实渲染尺寸把表头菜单夹回视口。
 *
 * <p>与树菜单 {@link clampContextMenuPosition} 同一套做法：首帧只能靠估算，
 * 而这里项数固定（7 项 + 2 分组标题 + 2 分割线），仍按实测校正一次更稳。</p>
 */
async function clampHeaderMenuPosition(): Promise<void> {
  await nextTick();
  const el = document.querySelector<HTMLElement>(".dbm-hmenu");
  if (!el) return;
  const rect = el.getBoundingClientRect();
  headerMenu.x = Math.min(Math.max(8, headerMenu.x), Math.max(8, window.innerWidth - rect.width - 8));
  headerMenu.y = Math.min(Math.max(8, headerMenu.y), Math.max(8, window.innerHeight - rect.height - 8));
}

/** 表头菜单里切表头显示模式 */
function setHeaderModeFromMenu(mode: "name" | "comment" | "both" | "type"): void {
  headerMode.value = mode;
  closeHeaderMenu();
}

/** 表头菜单里切行显示模式 */
function setRowModeFromMenu(mode: "data" | "data-comment"): void {
  rowMode.value = mode;
  closeHeaderMenu();
}

/** 表头菜单里打开「列显示设置」（显示或隐藏列 / 冻结列都落在那个弹窗里） */
function openColumnViewFromHeaderMenu(): void {
  closeHeaderMenu();
  openColumnViewDialog();
}

/** 右键菜单估算高度（项高 32 + 上下内边距 + 按节点类型的分割线） */
function menuEstimatedHeight(): number {
  // 项数必须与模板四套菜单实际条目同步：表 12 项/3 分割线、**视图 10 项/3 分割线**、
  // 库 8 项/2 分割线、**根节点 6 项/1 分割线**、页签 3 项/1 分割线、空白 5 项/1 分割线。
  // 曾硬编码库 5 项（实际 8 项）→ 低估 96px → 靠近窗口底部时菜单溢出视口，
  // 末项「删除数据库」落在屏幕外永远点不到（普通点击超时、force 点到屏外无响应）
  // 视图菜单比表少 2 项（复制表 / 清空表 对视图必败），沿用 12 会高估 64px。
  const count = contextMenu.tableName ? (contextMenu.isView ? 10 : 12) : contextMenu.database ? 8 : contextMenu.root ? 6 : contextMenu.tabId ? 3 : 5;
  const dividers = contextMenu.tableName ? 3 : contextMenu.database ? 2 : contextMenu.root ? 1 : 1;
  return count * 32 + dividers * 11 + 10;
}

/**
 * 菜单打开后用真实渲染尺寸二次夹取视口。
 * menuEstimatedHeight 的项数靠手维护，后续新增菜单项漏改就会低估 → 底部溢出。
 * 估算只影响首帧，这里在 nextTick 后按 getBoundingClientRect 校正 x/y，一劳永逸
 */
async function clampContextMenuPosition() {
  await nextTick();
  const el = document.querySelector<HTMLElement>(".dbm-context-menu");
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const x = Math.min(Math.max(8, contextMenu.x), Math.max(8, window.innerWidth - rect.width - 8));
  const y = Math.min(Math.max(8, contextMenu.y), Math.max(8, window.innerHeight - rect.height - 8));
  if (x !== contextMenu.x) contextMenu.x = x;
  if (y !== contextMenu.y) contextMenu.y = y;
}

/**
 * 右键菜单位置（贴近光标，临近视口边缘时翻转，避免溢出屏外点不到）
 */
const contextMenuStyle = computed<Record<string, string>>(() => {
  const width = 200;
  const height = menuEstimatedHeight();
  const maxX = Math.max(8, window.innerWidth - width - 8);
  const maxY = Math.max(8, window.innerHeight - height - 8);
  return {
    left: Math.min(Math.max(8, contextMenu.x), maxX) + "px",
    top: Math.min(Math.max(8, contextMenu.y), maxY) + "px",
  };
});

/** 打开新建表弹窗：只定目标库，表单与建表都在共享组件里 */
function openCreateTable(database?: string) {
  newTableDatabase.value = database || activeDatabase.value;
  if (!newTableDatabase.value) {
    message.warning("请先在左侧选择一个数据库");
    return;
  }
  createTableVisible.value = true;
}

/**
 * 删除视图。
 *
 * <p>与 {@link deleteTable} 分开：视图必须走 `DROP VIEW`，拿 `DROP TABLE` 去删
 * 会被内核拒绝成 `'x' is a view`（这正是原先视图删不掉的根因）。</p>
 *
 * @param viewName 视图名
 * @param database 库名
 */
async function deleteView(viewName: string, database?: string) {
  const db = database || contextMenu.database || activeDatabase.value;
  try {
    await ElMessageBox.confirm(`确定要删除视图 ${db ? db + "." : ""}${viewName} 吗？此操作不可恢复！`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await dropDbView(viewName, currentDatasourceId.value, db);
    message.success(`视图 ${viewName} 已删除`);
    if (db) {
      await loadTables(db);
    } else {
      await refreshTree();
    }
    tabs.value = tabs.value.filter(t => !(t.tableName === viewName && (t.database || "") === (db || "")));
    if (!tabs.value.some(t => t.id === activeTab.value)) {
      activeTab.value = tabs.value[0]?.id || "";
    }
  } catch (e) {
    message.error(`删除视图失败: ${String((e as Error)?.message ?? e)}`);
  }
}

async function deleteTable(tableName: string, database?: string) {
  const db = database || contextMenu.database || activeDatabase.value;
  try {
    await ElMessageBox.confirm(`确定要删除表 ${db ? db + "." : ""}${tableName} 吗？此操作不可恢复！`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await dropDbTable(tableName, currentDatasourceId.value, db);
    message.success(`表 ${tableName} 已删除`);
    if (db) {
      await loadTables(db);
    } else {
      await refreshTree();
    }
    tabs.value = tabs.value.filter(t => !(t.tableName === tableName && (t.database || "") === (db || "")));
    if (!tabs.value.some(t => t.id === activeTab.value)) {
      activeTab.value = tabs.value[0]?.id || "";
    }
  } catch (e) {
    message.error(`删除表失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 删除数据库：连带清掉该库的缓存表列表与页签
 * @param database 库名
 */
async function deleteDatabase(database: string) {
  try {
    await ElMessageBox.confirm(`确定要删除数据库 ${database} 吗？该库下的所有表都会被删除，此操作不可恢复！`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await dropDbDatabase(database, currentDatasourceId.value);
    message.success(`数据库 ${database} 已删除`);
    delete tablesByDb[database];
    tabs.value = tabs.value.filter(t => (t.database || "") !== database);
    if (!tabs.value.some(t => t.id === activeTab.value)) {
      activeTab.value = tabs.value[0]?.id || "";
    }
    if (activeDatabase.value === database) {
      activeDatabase.value = "";
      activeTable.value = "";
    }
    await loadTree();
  } catch (e) {
    message.error(`删除数据库失败: ${String((e as Error)?.message ?? e)}`);
  }
}

// ==================== Navicat 风格辅助动作 ====================
/** 总数开关：切换后按新模式重载当前表 */
watch(showTotal, value => {
  // 统一写进 dbViewPref（带版本号与逐字段校验），
  // 不再单独用裸 key —— 裸 key 没有版本，结构一变就是静默读出垃圾。
  saveViewPref({ showTotal: value });
  const tab = activeTabObj.value;
  if (tab?.type === "table") {
    tableData.page = 1;
    void loadTableData(tab, 1);
  }
});

/**
 * 视图偏好落盘（F5）。
 *
 * <p>表头/行模式、页大小、ER 图设置都是「刷新后应该还在」的东西。
 * 用一个 watcher 统一落，而不是在每个 setter 里各写一遍 ——
 * 各写一遍的必然结果是漏掉某个（早先 `dbm-show-total` 就是单独写的）。</p>
 */
watch(
  [headerMode, rowMode, modeRowCollapsed, erLayout, erShowLabels, erTableFilter],
  () => {
    saveViewPref({
      headerMode: headerMode.value,
      rowMode: rowMode.value,
      modeRowCollapsed: modeRowCollapsed.value,
      erLayout: erLayout.value,
      erShowLabels: erShowLabels.value,
      erTableFilter: erTableFilter.value,
    });
  },
  { deep: true },
);

/** 每页行数变化：落盘并回到第一页（否则第 N 页可能超出新页大小的范围） */
watch(() => tableData.pageSize, value => {
  saveViewPref({ pageSize: value });
});

/**
 * 筛选条件变化的**兜底**落盘。
 *
 * <p>不靠「记得在每个改动点调用 persistTablePref()」——
 * F5 第一版就是这么写的，结果漏了高级筛选弹窗那条路径
 * （它不走 {@code applyFilter}），表现为「WHERE 能记住、高级筛选记不住」。
 * 两条路径、两个入口，靠人记必然漏。watch 挂在数据上就没有漏的可能。</p>
 *
 * <p>{@code restoreTablePref} 恢复时会触发它，那正是我们要的
 * （恢复后的条件同样该落盘，保证下次刷新还在）。</p>
 */
watch(
  [filterWhere, activeFilters],
  () => {
    // 切表时 restoreTablePref 会先把旧条件清空再填新条件，
    // 中间这一帧不应该把「上一张表的偏好」写进「这张表的键」。
    // 用 tabPrefRestoring 挡住这一帧。
    if (tabPrefRestoring) return;
    persistTablePref();
  },
  { deep: true },
);

/**
 * 恢复默认设置：视图偏好 + 各表筛选条件 + 列显示偏好全清。
 *
 * <p>必须有这个出口：偏好存在浏览器里，用户能改就一定能清。
 * 只让用户去清浏览器数据的话，一旦偏好写坏了（别的代码写坏、手改、
 * 旧版本结构变更）就**没有任何界面上的恢复路径**。</p>
 */
async function resetViewSettings(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      "将清空本机保存的视图偏好（表头/行模式、每页行数、ER 图设置）与所有表的筛选条件。列显示偏好也会一并恢复默认。继续？",
      "恢复默认设置",
      { type: "warning", confirmButtonText: "恢复默认", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  resetAllPrefs();
  columnPrefs.value = {};
  headerMode.value = "name";
  rowMode.value = "data";
  modeRowCollapsed.value = false;
  showTotal.value = true;
  tableData.pageSize = 50;
  erLayout.value = "dagre";
  erShowLabels.value = true;
  erTableFilter.value = "";
  filterWhere.value = "";
  activeFilters.value = [];
  const tab = activeTabObj.value;
  if (tab?.type === "table") {
    tableData.page = 1;
    void loadTableData(tab, 1);
  } else if (tab?.type === "er") {
    void loadErDiagram();
  }
  message.success("已恢复默认设置");
}

/** SQL 编辑器补全字段缓存（库.表 → 字段名） */
const sqlColumnCache = new Map<string, string[]>();

/**
 * SQL 编辑器补全：解析指定表字段（带缓存）
 * @param table 表名
 */
async function resolveColumnsForTable(table: string): Promise<string[]> {
  const key = (activeDatabase.value + "." + table).toLowerCase();
  const cached = sqlColumnCache.get(key);
  if (cached) return cached;
  try {
    const cols = await fetchTableColumns(table, currentDatasourceId.value, activeDatabase.value);
    const names = cols.map(c => c.name);
    sqlColumnCache.set(key, names);
    return names;
  } catch {
    return [];
  }
}

/** 建表语句弹窗 */
const ddlVisible = ref(false);
const ddlText = ref("");

/**
 * 归一化 ElMessageBox.prompt 的返回值。
 *
 * <p>Element Plus 不同版本 prompt 的 resolve 结果可能是字符串，也可能是
 * {@code { value, action }}；统一取出并 trim，避免 {@code .trim is not a function}。</p>
 *
 * @param res prompt 结果
 */
function promptValue(res: unknown): string {
  const raw = typeof res === "string" ? res : (res as { value?: unknown } | null)?.value;
  return raw == null ? "" : String(raw).trim();
}

/**
 * 复制文本到剪贴板。
 *
 * <p><b>必须有 execCommand 兜底</b>：{@code navigator.clipboard} 只在**安全上下文**
 * （HTTPS 或 localhost）存在。本控制台在生产里是通过局域网 IP 的**明文 HTTP**
 * 访问的（如 {@code http://192.168.50.101:8848}），此时 {@code navigator.clipboard}
 * 是 {@code undefined}，直接调用会抛 TypeError —— 表现为「复制表名 / 复制库名 /
 * 复制建表语句」永远提示「复制失败」，而浏览器控制台里什么异常都看不到。</p>
 *
 * @param text 文本
 */
async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      message.success("已复制");
      return;
    } catch {
      // 权限被拒或非安全上下文：走下面的兜底
    }
  }
  if (legacyCopy(text)) {
    message.success("已复制");
    return;
  }
  message.warning("复制失败，请手动选中文本复制");
}

/**
 * 非安全上下文的复制兜底：用离屏 textarea + execCommand('copy')。
 *
 * <p>该命令虽然已废弃，但在明文 HTTP 下是唯一可行的路径，且各浏览器都还支持。
 * textarea 必须 {@code readonly} 且固定定位在视口内，否则移动端与
 * iOS Safari 会拒绝复制；复制完立刻移除，别留在 DOM 里。</p>
 *
 * @param text 文本
 * @returns 是否复制成功
 */
function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "true");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.width = "1px";
  area.style.height = "1px";
  area.style.padding = "0";
  area.style.border = "none";
  area.style.outline = "none";
  area.style.boxShadow = "none";
  area.style.background = "transparent";
  area.style.opacity = "0";
  document.body.appendChild(area);
  try {
    area.select();
    area.setSelectionRange(0, area.value.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}

/**
 * 以指定 SQL 打开新查询页签
 * @param sql      初始 SQL
 * @param database 目标库
 */
function openQueryWithSql(sql: string, database?: string): void {
  const id = "query-" + Date.now();
  const tab: Tab = {
    id,
    type: "query",
    title: "查询 " + (tabs.value.filter(t => t.type === "query").length + 1),
    sql,
    database: database || activeDatabase.value,
  };
  tabs.value.push(tab);
  activeTab.value = id;
}

/**
 * 重命名表（ALTER TABLE ... RENAME TO）
 * @param tableName 表名
 * @param database  所属库
 */
async function renameTable(tableName: string, database?: string): Promise<void> {
  const db = database || activeDatabase.value;
  let input = "";
  try {
    input = await ElMessageBox.prompt(`将表 ${tableName} 重命名为：`, "重命名表", {
      inputValue: tableName,
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  const name = promptValue(input);
  if (!name || name === tableName) return;
  try {
    await renameDbTable(tableName, name, currentDatasourceId.value, db);
    message.success(`表已重命名为 ${name}`);
    tabs.value = tabs.value.filter(t => !(t.tableName === tableName && (t.database || "") === (db || "")));
    if (!tabs.value.some(t => t.id === activeTab.value)) {
      activeTab.value = tabs.value[0]?.id || "";
    }
    await loadTables(db);
  } catch (e) {
    message.error(`重命名失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 复制表（CREATE TABLE ... LIKE）
 * @param tableName 源表
 * @param database  所属库
 */
async function duplicateTable(tableName: string, database?: string): Promise<void> {
  const db = database || activeDatabase.value;
  let input = "";
  try {
    input = await ElMessageBox.prompt(`复制表 ${tableName} 为：`, "复制表", {
      inputValue: `${tableName}_copy`,
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  const name = promptValue(input);
  if (!name || name === tableName) return;
  // 跨方言复制结构：MySQL 用 LIKE；H2/PG 用 CREATE TABLE AS ... WHERE 1=0；SQL Server 用 SELECT TOP 0 INTO
  const candidates = [
    `CREATE TABLE \`${name}\` LIKE \`${tableName}\``,
    `CREATE TABLE "${name}" AS SELECT * FROM "${tableName}" WHERE 1=0`,
    `SELECT TOP 0 * INTO ${name} FROM ${tableName}`,
  ];
  let lastError: unknown = null;
  for (const statement of candidates) {
    try {
      await executeDbSql(statement, currentDatasourceId.value, db);
      lastError = null;
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError) {
    message.error(`复制表失败: ${String((lastError as Error)?.message ?? lastError)}`);
    return;
  }
  message.success(`已复制为 ${name}`);
  await loadTables(db);
}

/**
 * 查看建表语句（SHOW CREATE TABLE，失败时按列结构兜底拼 DDL）
 * @param tableName 表名
 * @param database  所属库
 */
async function showTableDdl(tableName: string, database?: string): Promise<void> {
  const db = database || activeDatabase.value;
  try {
    // 服务端统一处理 SHOW CREATE TABLE 与跨方言兜底
    ddlText.value = await fetchTableDdl(tableName, currentDatasourceId.value, db);
  } catch (e) {
    message.error(`获取建表语句失败: ${String((e as Error)?.message ?? e)}`);
    return;
  }
  ddlVisible.value = true;
}

/**
 * 查询结果的导出格式。
 *
 * <p>初值空串（显示 placeholder），而不是 {@code "csv"}：下拉选中项会直接导出，
 * 若初值就是 {@code "csv"}，用户选「导出 CSV」属于**同值**，
 * el-select 的 {@code change} 不会触发，表现为「点了没反应」。</p>
 */
const queryExportFormat = ref<"" | "csv" | "tsv" | "json" | "xml">("");

/**
 * 选中某个导出格式就立刻导出。
 *
 * <p>同样不能用 {@code @change}：{@code ReSelect} 不发该事件。</p>
 */
watch(queryExportFormat, format => {
  if (format) {
    exportQueryCsv(format);
  }
});

/** 查询结果变化时复位，让下一次选择一定触发 */
watch(() => queryResult.columns, () => {
  queryExportFormat.value = "";
});

/**
 * 导出查询结果（客户端生成，结果集已在内存，无需回后端）。
 *
 * @param format 目标格式；SQL 格式对查询结果无意义，故不提供
 */
function exportQueryCsv(format: "csv" | "tsv" | "json" | "xml" = "csv"): void {
  const cols = queryResult.columns ?? [];
  const rows = queryResult.rows ?? [];
  if (!cols.length) {
    message.warning("没有可导出的查询结果");
    return;
  }
  const cell = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };
  let content: string;
  if (format === "json") {
    content = JSON.stringify(
      rows.map(row => Object.fromEntries(cols.map(c => [c, (row as Record<string, unknown>)[c] ?? null]))),
      null,
      2
    );
  } else if (format === "xml") {
    const esc = (s: string): string =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    content = '<?xml version="1.0" encoding="UTF-8"?>\n<rows>\n'
      + rows.map(row => `  <row>\n${cols.map(c => `    <${c}>${esc(cell((row as Record<string, unknown>)[c]))}</${c}>\n`).join("")}  </row>\n`).join("")
      + "</rows>\n";
  } else {
    const sep = format === "tsv" ? "\t" : ",";
    const quote = (v: string): string =>
      (format === "csv" && (v.includes(",") || v.includes('"') || v.includes("\n") || v.trim() !== v))
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    content = [cols.join(sep)]
      .concat(rows.map(row => cols.map(c => quote(cell((row as Record<string, unknown>)[c]))).join(sep)))
      .join("\n");
  }
  downloadText(`query-result-${Date.now()}.${format}`, content, EXPORT_MIME[format] ?? "text/plain");
  message.success(`已导出 ${rows.length} 行`);
  // 复位成空：否则连续导出同一格式第二次是同值，change 不再触发
  queryExportFormat.value = "";
}

onMounted(() => {
  document.addEventListener("click", closeContextMenu);
  // 表头菜单也吃这一下：点空白处 / 点别处右键都要收起来。
  // 用同一个 click 监听而不是另起一套，免得两个菜单的开关逻辑走岔。
  document.addEventListener("click", closeHeaderMenu);
  void adoptOrphanTx();
});

// 切数据源时也要查：孤儿事务是「用户忘了提交」留下的，
// 而用户很可能正是在切回那个数据源时才想把它收拾掉。
watch(currentDatasourceId, () => {
  if (!txId.value) {
    void adoptOrphanTx();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeContextMenu);
  document.removeEventListener("click", closeHeaderMenu);
  // 开着事务离开页面就等于把改动留在后端那条连接上，
  // 用户既看不见也关不掉（要等空闲超时才被回收）—— 这里兜底回滚。
  void releaseTxOnUnmount();
});
</script>

<style scoped>
/* ============================================================
   数据库管理（Web Navicat 风格）——与 Redis 控制中心同构：灰底双白卡
   全部使用 koi 变量（--el-* / --metric-* / --radius 等）
   ============================================================ */
.dbm {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: calc(100vh - 120px);
  min-height: 560px;
  padding: 4px 4px 8px;
  /* 浅灰画布：工具条 / 侧栏 / 内容区三张白卡浮在上面，层次来自这里 */
  background: var(--bg-fill);
}

/* 全屏模式（standalone 路由，无应用外壳）：吃满视口高度，不再减导航占位 */
.dbm.dbm--fullscreen {
  height: 100vh;
  height: 100dvh;
  min-height: 0;
}

/* 内嵌到数据源中心：宿主已经算好了可用高度（页签面板是 flex:1 + min-height:0），
   这里必须改成吃满父级而不是再算一次 100vh - 120px，否则会出现双层滚动条。
   同时去掉自身内边距，避免和宿主页签面板的内边距叠加出两层空白。 */
.dbm.is-embedded {
  height: 100%;
  min-height: 0;
  padding: 0;
}

/* 内嵌模式：父容器（数据源中心右栏）本身已占掉约 600px，
   侧栏再吃 300px 只剩约 520px 给表格，列被压得放不下几列。
   这里收到 240px，把宽度让给内容。 */
.dbm.is-embedded .dbm-sidebar {
  width: 240px;
}

/* 独立模式的数据源选择已删除；只读 chip 见 .dbm-ds-chip */

/* 内嵌模式的数据源标识：替代独立模式的下拉，只读展示当前浏览对象 */
.dbm-ds-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 9999px;
  font-size: 12px;
  line-height: 18px;
  white-space: nowrap;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 32%, transparent);
}

/* 工具条：页面级动作只留数据源切换 + 刷新 + 表页签激活时的一簇视图设置，
   因此压到 6px 内边距、取消圆角与阴影，把纵向空间让给主内容区。 */
/* 顶部工具条：视觉（圆角/边框/投影/底色/内距）由模板上的 re-surface 基类统一提供。
   这里用 --dense 档而不是默认档：DBM 是密集型控制台，工具条与下方
   .dbm-sidebar / .dbm-content 两张 16px 卡同宽并排，默认档 16px 18px 内距会把
   工具条撑高一档、左右卡片高度对不齐。scoped 里只留布局，不再自写一套卡片壳。 */
.dbm-toolbar {
  display: flex;
  /* 左/右簇与分页条、统计总数档、图标按钮统一 32px 高，各簇内部垂直居中，
     避免右侧分页把左侧图标顶得上不对齐。 */
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
}
.dbm-toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; align-content: center; flex: 0 1 auto; min-width: 0; min-height: 32px; }
.dbm-toolbar-hint { font-size: 12px; color: var(--el-text-color-placeholder); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* 右侧：数据源下拉与刷新按钮之间不留多余间距；
    表页签激活时这里还要吃下「分页条」，允许整体换行（.dbm-pager-bar），
    换行只发生在右侧簇内部 —— 左侧簇与右侧簇的主行对齐不受影响。 */
.dbm-toolbar-right { display: flex; align-items: center; gap: 8px; flex: none; flex-wrap: wrap; justify-content: flex-end; min-height: 32px; }
/* 分页条：表页签激活时跟在右侧簇末尾。高度与相邻 square 按钮 / ReRadio 对齐（32px），
   内部再垂直居中 —— 截图里「共0条/50条页/页码」与旁边图标不同水平线，
   就是因为容器高度 52px 而其它控件 32px，基线错位。 */
.dbm-pager-bar { display: flex; align-items: center; justify-content: flex-end; height: 32px; min-height: 32px; flex: none; }
.dbm-pager-bar .dbm-simple-pager { height: 32px; display: inline-flex; align-items: center; gap: 8px; }
/* 分页器内部控件统一垂直居中，避免数字/箭头/每页条数与相邻按钮水平基线不一致。
   注意 pages.css 全局对 .el-pagination 有 padding:16px 0 0，会把 32px 高内
   content 压成 16px、align-items:center 后内容中心整体下移 8px —— 这里清零。 */
.dbm-pager-bar :deep(.el-pagination) { display: inline-flex; align-items: center; height: 32px; overflow: hidden; padding: 0; }
.dbm-pager-bar :deep(.el-pagination .el-pagination__jump),
.dbm-pager-bar :deep(.el-pagination .btn-prev),
.dbm-pager-bar :deep(.el-pagination .btn-next),
.dbm-pager-bar :deep(.el-pagination .el-pager) {
  display: inline-flex;
  align-items: center;
  height: 32px;
}
/* 每页条数下拉（sizes）实测会把分页条撑高到 36px、把整条内容压偏下——
   强制与其它控件同高 32px 并垂直居中，否则分页数字与相邻按钮差一条基线。 */
.dbm-pager-bar :deep(.el-pagination__sizes) {
  display: inline-flex;
  align-items: center;
  height: 32px;
}
.dbm-pager-bar :deep(.el-pagination__sizes .el-select__wrapper),
.dbm-pager-bar :deep(.el-pagination__sizes .el-select) {
  height: 32px;
  display: inline-flex;
  align-items: center;
}
/* 统计总数开关（ConsoleSwitch 的 radio 胶囊）：ep-radio-group 是换行 flex，
   一旦被压窄就会把「是 / 否」竖着叠成两行，连带把整个工具条顶高 ——
   钉死不缩，胶囊恒定单行，工具条高度才不随页签切换抖动。 */
.dbm-toolbar-right .dbm-switch { flex: none; }
/* 统计总数方形档（ReRadio=square）：两个方形分段 是/否，与右侧图标按钮同高 32px */
.dbm-toolbar-right .dbm-total-select { flex: none; }
.dbm-total-select { width: auto; }

/* 主体 */
.dbm-body { display: flex; gap: 16px; flex: 1; min-height: 0; }

/* 左侧连接树卡 */
.dbm-sidebar {
  width: 300px;
  flex: none;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  overflow: hidden;
}
.dbm-tree { flex: 1; overflow-y: auto; padding: 8px 8px 12px; }
.dbm-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  transition: background 0.15s ease;
}
.dbm-tree-node:hover { background: var(--el-fill-color-light); }
.dbm-tree-node.active { background: var(--el-color-primary-light-9); }
.dbm-tree-node.active .dbm-tree-label { color: var(--el-color-primary); }
.dbm-tree-root { font-weight: 600; color: var(--el-text-color-primary); }
.dbm-tree-children { padding-left: 14px; }
.dbm-tree-icon { flex: none; }
.dbm-db-icon { color: var(--el-color-warning); }
.dbm-table-icon { color: var(--el-color-success); }
.dbm-tree-label {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dbm-tree-remark { margin-left: 4px; font-size: 11px; color: var(--el-text-color-placeholder); }

/* 右侧内容卡 */
.dbm-content {
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

/* 页签 */
.dbm-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 12px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}
.dbm-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: var(--el-radius-md, 8px) var(--el-radius-md, 8px) 0 0;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.dbm-tab:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.dbm-tab.active { color: var(--el-color-primary); background: var(--el-color-primary-light-9); font-weight: 600; }
.dbm-tab-close { opacity: 0.5; transition: opacity 0.15s ease; }
.dbm-tab-close:hover { opacity: 1; color: var(--el-color-danger); }

/* 视图容器 */
.dbm-table-view,
.dbm-design-view,
.dbm-query-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  overflow: hidden;
}
.dbm-table-toolbar,
.dbm-design-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
/* 顶层工具条里的表名/模式/动作行（要求 1 上迁）：锚类 .dbm-table-toolbar 只是
    为了让验收套件的选择器继续命中，布局复用左侧簇 —— 不缩不换的钉死规则
    只在网格那一层需要，上迁后由 .dbm-toolbar-left 的 wrap 自然换行。 */
/* 设计视图：动作条跟在同一行，右侧对齐；不再单独占一行 */
.dbm-design-toolbar .dbm-col-actions { margin-left: auto; }
/* 表名过长时用省略号收住，否则会把第一行内容顶到第二行 */
.dbm-table-name {
  flex: 0 1 auto;
  min-width: 60px;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 工具条第一行：模式分段与动作按钮都是固定宽度，不缩不换 */
.dbm-table-toolbar .dbm-subtabs { flex: none; }
.dbm-table-toolbar .re-button__tip-wrap { flex: none; }
/* 分页条已整体上迁到顶层工具条右侧（.dbm-pager-bar）：网格内的独占整行
    .dbm-pager-row 结构作废，分页 52px 等高规则见 .dbm-pager-bar 段。 */
.dbm-table-name { font-weight: 700; font-size: 14px; color: var(--el-text-color-primary); }
/* 动作条下方的说明行：合并工具条后单独一行，占位极小 */
.dbm-col-hint { font-size: 12px; color: var(--el-text-color-placeholder); padding: 2px 0; }

/* SQL 查询 */
.dbm-query-editor { display: flex; flex-direction: column; gap: 8px; }
.dbm-query-toolbar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dbm-sql-editor {
  width: 100%;
  height: 180px;
  padding: 12px 14px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}
.dbm-sql-editor:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.dbm-ddl { height: 300px; resize: vertical; }
.dbm-query-result { flex: 1; display: flex; flex-direction: column; gap: 8px; min-height: 0; overflow: hidden; }
.dbm-result-header { font-size: 12.5px; color: var(--el-text-color-secondary); display: flex; align-items: center; }
.dbm-result-message { color: var(--el-color-success); }
/* 失败那条：整段错误信息（可滚动），不要只留一句话 */
.dbm-result-error {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--el-color-danger-light-7, var(--el-border-color-lighter));
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-danger-light-9, var(--el-fill-color-lighter));
  box-sizing: border-box;
}
.dbm-result-error-title { font-size: 13px; color: var(--el-color-danger); }
.dbm-result-error-body {
  flex: 1;
  min-height: 0;
  margin: 0;
  overflow: auto;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

/* 列设置弹窗 */
/* 结构同步弹窗 */
/* ============ 结构同步（Navicat 业务链：选择→比较→差异→部署；风格用 Vue/koi 变量） ============ */
.dbm-sync { display: flex; flex-direction: column; gap: 10px; position: relative; flex: 1; min-height: 0; }
/* 中间内容区（方向条与底部操作条之间）：**唯一**的滚动容器。
   矮视口（1440x800 及以下）时 .dbm-sync 的内容比弹窗 body 高，body 是 overflow:hidden，
   以前底部操作条直接被裁到框外看不见。现在改由这一层滚，底部条固定贴底。 */
.dbm-sync-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  /* 滚动条出现时不要挤压内容宽度 */
  scrollbar-gutter: stable;
}
/* 顶部源→目标方向示意（图 1/3/4/5 均保留） */
.dbm-sync-direction {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 4px 8px 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dbm-sync-direction-side {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 40%;
}
.dbm-sync-direction-side--src { color: var(--el-color-success); }
.dbm-sync-direction-side--dst { color: var(--el-color-primary); }
.dbm-sync-conn {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12.5px;
}
.dbm-sync-db-icon {
  display: inline-block;
  width: 7px;
  height: 14px;
  border-radius: 1px 3px 3px 1px;
  border: 1px solid currentColor;
  box-sizing: content-box;
}
.dbm-sync-db-icon--src { background: var(--el-color-success); }
.dbm-sync-db-icon--dst { background: var(--el-color-primary); }
.dbm-sync-direction-arrow { color: var(--el-text-color-placeholder); }

/* 源/目标双面板：可以长（够高就撑满），但不许被压缩到比内容还矮 ——
   压不下去时由外层 .dbm-sync-body 滚，底部操作条才不会掉出弹窗。 */
.dbm-sync-panes {
  flex: 1 0 auto;
  min-height: 0;
  display: flex;
  align-items: stretch;
  gap: 10px;
}
.dbm-sync-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
}
.dbm-sync-pane--src { border-top: 3px solid var(--el-color-success); }
.dbm-sync-pane--dst { border-top: 3px solid var(--el-color-primary); }
.dbm-sync-pane-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.dbm-sync-field { display: flex; flex-direction: column; gap: 4px; }
.dbm-sync-field-label { font-size: 12px; color: var(--el-text-color-secondary); }
.dbm-sync-ds-select,
.dbm-sync-db-select { width: 100%; }

/* 连接信息只读卡 */
.dbm-sync-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 12px;
  padding: 8px 10px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  font-size: 12px;
}
.dbm-sync-info-row { display: flex; justify-content: space-between; gap: 8px; }
.dbm-sync-info-k { color: var(--el-text-color-secondary); }
.dbm-sync-info-v { color: var(--el-text-color-regular); font-family: var(--el-font-family-mono, monospace); }

/* 交换方向按钮 */
.dbm-sync-swap { align-self: center; }

.dbm-sync-filter { width: 100%; }

/* 比较中（图 2：居中遮罩弹窗，背后面板保留） */
.dbm-sync-compare-mask {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--el-mask-color, #000) 35%, transparent);
  border-radius: var(--el-radius-base, 4px);
}
.dbm-sync-compare {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  min-width: 360px;
  padding: 26px 22px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 6px);
  box-shadow: var(--el-box-shadow, 0 2px 12px rgba(0, 0, 0, 0.12));
}
.dbm-sync-compare-spin { color: var(--el-color-primary); animation: dbm-sync-spin 1s linear infinite; }
@keyframes dbm-sync-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.dbm-sync-compare-title { font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.dbm-sync-compare-sub { font-size: 12.5px; color: var(--el-text-color-secondary); }
.dbm-sync-compare-track {
  width: 100%;
  max-width: 300px;
  height: 8px;
  overflow: hidden;
  background: var(--el-fill-color);
  border-radius: 9999px;
}
.dbm-sync-compare-bar {
  height: 100%;
  background: var(--el-color-primary);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

/* 差异页分组列表（图 3：源对象 / 操作 / 目标对象 三列，按操作分组折叠）
   —— 这里不要再自带 overflow-y：滚动交给外层 .dbm-sync-body，否则出现嵌套双滚动条。 */
.dbm-sync-groups { display: flex; flex-direction: column; gap: 4px; flex: 1 0 auto; }
.dbm-sync-group { border: 1px solid var(--el-border-color-lighter); border-radius: var(--el-radius-base, 4px); }
.dbm-sync-group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
}
.dbm-sync-group-caret { color: var(--el-text-color-placeholder); }
.dbm-sync-group-selected {
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
/* 分组头「全选 / 全不选 / 反选」（图 3：每个分类一组小按钮，点击不触发折叠） */
.dbm-sync-group-actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.dbm-sync-group-actions :deep(.el-button) {
  height: 22px;
  padding: 0 6px;
  font-size: 12px;
  line-height: 20px;
}
.dbm-sync-group.modify .dbm-sync-group-name { color: var(--el-color-warning); }
.dbm-sync-group.create .dbm-sync-group-name { color: var(--el-color-success); }
.dbm-sync-group.delete .dbm-sync-group-name { color: var(--el-color-danger); }
.dbm-sync-group-items { padding: 2px 0; }
.dbm-sync-grid-row {
  display: grid;
  grid-template-columns: 1fr 120px 1fr;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  font-size: 12.5px;
  border-top: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}
.dbm-sync-grid-row--head {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}
.dbm-sync-grid-row--checked { background: var(--el-color-primary-light-9, var(--el-fill-color-light)); }
.dbm-sync-grid-src { display: flex; align-items: center; gap: 6px; min-width: 0; }
.dbm-sync-grid-op { display: flex; align-items: center; justify-content: flex-start; }
.dbm-sync-grid-dst { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dbm-sync-diff-check { flex: none; margin: 0; accent-color: var(--el-color-primary); }
.dbm-sync-diff-op {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 0 6px;
  font-size: 12px;
  font-weight: 700;
  line-height: 18px;
  border-radius: 3px;
}
.dbm-sync-diff-op.op-modify { color: var(--el-color-warning); background: var(--el-color-warning-light-9, var(--el-fill-color-light)); }
.dbm-sync-diff-op.op-create { color: var(--el-color-success); background: var(--el-color-success-light-9, var(--el-fill-color-light)); }
.dbm-sync-diff-op.op-delete { color: var(--el-color-danger); background: var(--el-color-danger-light-9, var(--el-fill-color-light)); }
.dbm-sync-diff-obj {
  font-family: var(--el-font-family-mono, monospace);
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dbm-sync-diff-detail {
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 部署视图底部双标签（图 4/5：部署脚本 / 消息日志） */
.dbm-sync-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--el-border-color-lighter); }
.dbm-sync-tab {
  padding: 7px 16px;
  font-size: 13px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  border-bottom: 2px solid transparent;
}
.dbm-sync-tab.active { color: var(--el-color-primary); border-bottom-color: var(--el-color-primary); font-weight: 600; }

/* 部署脚本：可编辑（图 4），SQL 语法高亮 overlay：下层 pre 高亮、上层透明 textarea 同步滚动 */
.dbm-sync-script-panel { display: flex; flex-direction: column; gap: 6px; flex: 1 0 auto; min-height: 180px; }
.dbm-sync-script-head { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--el-text-color-secondary); }
.dbm-sync-sql-editor {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-base, 4px);
  background: var(--el-fill-color-blank);
}
/* 下层高亮层：逐字对齐 textarea（相同字体/字号/行高/内边距），仅作显示 */
.dbm-sync-sql-hl {
  position: absolute;
  inset: 0;
  margin: 0;
  overflow: hidden;
  padding: 10px 12px;
  box-sizing: border-box;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre;
  color: var(--el-text-color-primary);
  pointer-events: none;
}
/* 上层 textarea：文字透明只留光标，负责编辑/选择/滚动 */
.dbm-sync-sql-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  resize: none;
  padding: 10px 12px;
  box-sizing: border-box;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre;
  overflow: auto;
  color: transparent;
  caret-color: var(--el-text-color-primary);
  background: transparent;
  border: none;
  outline: none;
}
.dbm-sync-sql-editor:focus-within { border-color: var(--el-color-primary); }
/* 高亮 token 配色（全用 Vue 变量，亮/暗主题都成立） */
.dbm-sync-sql-hl .sql-kw { color: var(--el-color-primary); font-weight: 600; }
.dbm-sync-sql-hl .sql-str { color: var(--el-color-success); }
.dbm-sync-sql-hl .sql-id { color: var(--el-color-warning); }
.dbm-sync-sql-hl .sql-num { color: var(--el-color-danger); }
.dbm-sync-sql-hl .sql-com { color: var(--el-text-color-placeholder); font-style: italic; }

/* 消息日志（图 5）：统计面板 + SSE 逐条日志 */
.dbm-sync-log-panel { display: flex; flex-direction: column; gap: 8px; flex: 1 0 auto; min-height: 180px; }
.dbm-sync-run-stats {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 8px 12px;
  font-size: 12.5px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
}
.dbm-sync-run-stats span { font-weight: 600; }
.dbm-sync-run-stats span:first-child { color: var(--el-text-color-secondary); font-weight: 400; }
.dbm-sync-run-stats span:nth-child(2) { color: var(--el-color-success); }
.dbm-sync-run-stats span:nth-child(3) { color: var(--el-color-danger); }
.dbm-sync-run-stats span:nth-child(4) { color: var(--el-text-color-placeholder); font-weight: 400; }

/* 执行日志（SSE 实时）：用 Vue 变量配色，不用自定义深色终端 */
.dbm-sync-log {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  font-family: var(--el-font-family-mono, Consolas, monospace);
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}
.dbm-sync-log-line { display: flex; gap: 8px; align-items: baseline; }
.dbm-sync-log-line--ok { color: var(--el-color-success); }
.dbm-sync-log-line--fail { color: var(--el-color-danger); }
.dbm-sync-log-no {
  flex: none;
  width: 26px;
  text-align: right;
  color: var(--el-text-color-placeholder);
}
.dbm-sync-log-flag { flex: none; }
.dbm-sync-log-sql {
  flex: 1;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dbm-sync-log-msg { flex: none; color: var(--el-text-color-secondary); }
.dbm-sync-log-line--fail .dbm-sync-log-msg { color: var(--el-color-danger); }

/* 底部导航：flex:none —— 无论中间滚到哪，这一条始终占住弹窗底边、不被压缩 */
.dbm-sync-foot {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 选项弹窗 */
.dbm-sync-opt { display: flex; flex-direction: column; gap: 10px; }
.dbm-sync-opt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}
.dbm-sync-opt-check { margin: 0; accent-color: var(--el-color-primary); }
.dbm-doc-export { display: flex; flex-direction: column; gap: 12px; }
.dbm-doc-row { display: flex; align-items: center; gap: 12px; }
.dbm-doc-label {
  flex: none;
  width: 72px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.dbm-doc-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dbm-doc-select {
  flex: 1;
  height: 32px;
  padding: 0 8px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
.dbm-doc-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.dbm-doc-error {
  margin: 0;
  font-size: 12px;
  color: var(--el-color-danger);
}
/* 在线查看数据库文档弹窗：加载 / 错误 / iframe 三种态，iframe 撑满弹窗主体
 *
 * 必须用 :global 而不是 :deep：ReDialog 把弹窗 Teleport 到 body，组件作用域的
 * data-v 属性不在弹窗节点上，:deep(.el-dialog__body) 编译出的
 * `.dbm-doc-preview-dialog[data-v-x] .el-dialog__body` 永远匹配不到，
 * 结果 el-dialog__body 按内容自适应高度、iframe(height:100%) 塌成一条，
 * 弹窗只露出页头。:global 生成不带 data-v 的选择器，才是这里要的。
 */
:global(.dbm-doc-preview-dialog .el-dialog__body) {
  padding: 0;
  overflow: hidden;
  height: 68vh;
}
.dbm-doc-preview-loading,
.dbm-doc-preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--el-text-color-secondary);
}
.dbm-doc-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}
.dbm-sync-script-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dbm-sync-script {
  max-height: 220px;
  margin: 0;
  overflow: auto;
  padding: 10px;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.7;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ER 图工作区：外壳样式全在 ErWorkspace 组件内，
   这里只管「页签里怎么占位」和「弹框里多高」 */
.dbm-er-workspace {
  height: 100%;
  min-height: 0;
}
/* 弹框正文去 padding：图要尽量撑满，四周留白交给对话框自身 */
.dbm-er-dialog :deep(.el-dialog__body) {
  padding: 8px 16px 0;
  overflow: hidden;
}
.dbm-er-dialog .dbm-er-workspace--dialog {
  height: 68vh;
  min-height: 0;
}
.dbm-er-cols {
  max-height: 360px;
  overflow-y: auto;
}
.dbm-er-col-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 8px;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dbm-er-col-name {
  font-family: var(--el-font-family-mono, monospace);
  min-width: 140px;
}
.dbm-er-col-type {
  flex: 1;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
}
.dbm-er-flag {
  padding: 0 6px;
  font-size: 11px;
  line-height: 17px;
  border-radius: 3px;
}
.dbm-er-flag.pk {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.dbm-er-flag.null {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}

/* 事务开关：开着时整条工具条染色。
   必要性：事务开着时所有写操作都**不会立刻落库**，
   而这一点除了这条提示之外没有任何界面证据 —— 用户会以为改动已经存了 */
.dbm-tx-switch.on {
  padding: 2px 8px;
  border-radius: var(--el-radius-base, 4px);
  background: var(--el-color-warning-light-9, var(--el-fill-color-light));
  box-shadow: inset 0 0 0 1px var(--el-color-warning);
}

.dbm-colset { display: flex; flex-direction: column; gap: 8px; }
.dbm-colset-head { display: flex; align-items: center; gap: 8px; }
.dbm-colset-hint { font-size: 12.5px; color: var(--el-text-color-secondary); }
.dbm-colset-list {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
}
.dbm-colset-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  cursor: pointer;
}
.dbm-colset-row:hover { background: var(--el-fill-color-light); }
/* 隐藏列留灰：勾的是「显示」，不显示的项要能一眼认出来 */
.dbm-colset-row.hidden .dbm-colset-name {
  color: var(--el-text-color-placeholder);
  text-decoration: line-through;
}
.dbm-colset-check { cursor: pointer; }
.dbm-colset-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}
.dbm-colset-pin {
  padding: 2px 6px;
  font-size: 13px;
  line-height: 1.4;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-radius-base, 4px);
  cursor: pointer;
  /* 未选中时压暗，避免满屏图钉抢注意力 */
  opacity: 0.3;
  filter: grayscale(1);
}
.dbm-colset-pin:hover:not(:disabled) { opacity: 0.7; }
.dbm-colset-pin.on {
  opacity: 1;
  filter: none;
  background: var(--el-color-primary-light-9, var(--el-fill-color-light));
  border-color: var(--el-color-primary);
}
.dbm-colset-pin:disabled { cursor: not-allowed; opacity: 0.15; }

/* 二进制 / 长文本格子：一行摘要，点开进内容查看器 */
.dbm-cell-blob {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 1px 6px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  cursor: pointer;
  max-width: 100%;
}
.dbm-cell-blob:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.dbm-cell-blob-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 内容查看器 */
.dbm-blob { display: flex; flex-direction: column; gap: 10px; }
.dbm-blob-head { display: flex; align-items: center; gap: 8px; }
.dbm-blob-meta { font-size: 12.5px; color: var(--el-text-color-secondary); }
.dbm-blob-tabs { display: flex; align-items: center; gap: 6px; }
.dbm-blob-tab {
  padding: 3px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  cursor: pointer;
}
.dbm-blob-tab.active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, var(--el-fill-color-light));
}
.dbm-blob-text {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12.5px;
}
.dbm-blob-hex {
  height: 320px;
  margin: 0;
  overflow: auto;
  padding: 10px;
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  word-break: break-all;
}
.dbm-blob-image {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  max-height: 340px;
  overflow: auto;
  padding: 10px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  /* 图片在深色底上要有对比边界，否则透明 PNG 会「看不见」 */
  background-image:
    linear-gradient(45deg, var(--el-border-color-lighter) 25%, transparent 25%),
    linear-gradient(-45deg, var(--el-border-color-lighter) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--el-border-color-lighter) 75%),
    linear-gradient(-45deg, transparent 75%, var(--el-border-color-lighter) 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
.dbm-blob-image img { max-width: 100%; max-height: 320px; }

/* 结果集里若有更新语句，它没有结果集；给一句说明而不是摆一张空表 */
.dbm-result-plain {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 多结果集页签：只有脚本执行且有多条时才出现，单条执行不占这一行 */
.dbm-result-set-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.dbm-result-set-tab {
  padding: 3px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  cursor: pointer;
  white-space: nowrap;
}
.dbm-result-set-tab:hover { border-color: var(--el-color-primary); }
.dbm-result-set-tab.active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, var(--el-fill-color-light));
}

/* 「打开 SQL 文件」的隐藏 input：不能用按钮直接选文件，必须走 input[type=file] 的 change */
.dbm-hidden-input { display: none; }

/* 查询历史面板：与结果区同层，点条目回填编辑器 */
.dbm-history {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 10px;
  box-sizing: border-box;
}
.dbm-history-head { display: flex; align-items: center; gap: 8px; }
.dbm-history-list { flex: 1; min-height: 0; overflow: auto; display: flex; flex-direction: column; gap: 6px; }
.dbm-history-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: baseline;
  padding: 6px 8px;
  border-radius: var(--el-radius-base, 4px);
  cursor: pointer;
  border: 1px solid transparent;
}
.dbm-history-item:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color-lighter);
}
.dbm-history-time { font-size: 12px; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; }
.dbm-history-sql {
  font-size: 12.5px;
  font-family: var(--el-font-family-mono, monospace);
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dbm-history-meta { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; }

/* SQL 模板面板（复用历史面板骨架；四列：时刻 | 名 | SQL 预览 | 删除） */
.dbm-tpl-item { grid-template-columns: auto auto 1fr auto; align-items: center; }
.dbm-tpl-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-color-primary);
  white-space: nowrap;
}
.dbm-tpl-del {
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: color 0.15s;
}
.dbm-tpl-item:hover .dbm-tpl-del { color: var(--el-text-color-secondary); }
.dbm-tpl-del:hover { color: var(--el-color-danger); }

/* AI text2sql 弹窗 */
.dbm-ai-body { display: flex; flex-direction: column; gap: 10px; }
.dbm-ai-hint {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dbm-ai-ctx {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.dbm-ai-sql {
  margin: 0;
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  font-family: var(--el-font-family-mono, monospace);
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 320px;
  overflow: auto;
}

/* 参数弹窗里的变量行 */
.dbm-params-row code { font-family: var(--el-font-family-mono, monospace); }

/* 空态 */
.dbm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.dbm-empty-icon { color: var(--el-text-color-placeholder); }
.dbm-empty-text { margin: 0; }

/* 用户管理面板（users 页签） */
.dbm-users-view {
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px 12px;
  overflow: auto;
}

/* 右键菜单（对齐 Navicat） */
.dbm-context-menu {
  position: fixed;
  z-index: 4000;
  min-width: 190px;
  max-height: calc(100vh - 16px);
  overflow-y: auto;
  padding: 5px;
  background: var(--el-bg-color-overlay, var(--el-bg-color));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-2));
}
.dbm-context-item {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 32px;
  padding: 0 9px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  border-radius: var(--el-radius-sm, 6px);
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
}
.dbm-context-item:hover { background: var(--el-fill-color-light); color: var(--el-color-primary); }
.dbm-context-item.dbm-danger { color: var(--el-color-danger); }
.dbm-context-item.dbm-danger:hover { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }
.dbm-context-hint { margin-left: auto; font-size: 11px; color: var(--el-text-color-placeholder); }
.dbm-context-divider { height: 1px; margin: 5px 7px; background: var(--el-border-color-lighter); }

/* 表头右键菜单：分组小标题 + 勾选态（与树菜单共用 .dbm-context-* 皮） */
.dbm-hmenu { min-width: 208px; }
.dbm-context-group {
  padding: 4px 9px 2px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-text-color-placeholder);
}
.dbm-context-check {
  display: inline-block;
  width: 12px;
  flex: none;
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1;
}
.dbm-context-item.is-checked { color: var(--el-color-primary); font-weight: 600; }

/* 顶部「显示模式」那一排的收起按钮 */
.dbm-mode-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: none;
  padding: 0;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  transition: transform 0.16s ease, background 0.12s ease, color 0.12s ease;
}
.dbm-mode-toggle:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color-lighter);
}
/* 收起后箭头转向，一眼看出点一下能展开 */
.dbm-mode-toggle.is-collapsed { transform: rotate(-90deg); }

/* 弹窗表单 */
.dbm-create-form { display: flex; flex-direction: column; gap: 14px; padding: 16px 20px 4px; }
.dbm-form-item { display: flex; flex-direction: column; gap: 6px; }
.dbm-form-item label { font-size: 13px; font-weight: 500; color: var(--el-text-color-regular); }

/* 单元格内联编辑 */
.dbm-cell-value {
  display: inline-block;
  padding: 2px 6px;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  transition: background 0.15s ease;
}
.dbm-cell-value:hover { background: var(--el-color-primary-light-9); }
.dbm-cell-pk { color: var(--el-text-color-placeholder); cursor: not-allowed; }
.dbm-cell-edit {
  margin: 0;
  padding: 0;
  background: var(--el-color-primary-light-9);
  /* 编辑框吃满整个格：ReInput 根是 display:contents（无盒），
     el-input 会自动铺到父盒宽度；左右 -4/-8 的负 margin 以前是
     想「出血」盖住格边框，实测反而留了一圈缝 —— 归零后贴边。 */
}
/* 吃满「整个」cell：vxe 单元格自带左右内边距（实测 12/16px），
   只归零 .dbm-cell-edit 自身仍比格窄一圈。编辑态把格链 padding
   一起清零，编辑框才真正贴满格边界（行高由 vxe 内联 height 决定，
   清 padding 不影响行高）。:has 只命中正在编辑的那一列。 */
:deep(.vxe-body--column):has(.dbm-cell-edit) {
  padding: 0 !important;
}
/* vxe 在省略列（show-overflow）还给 .vxe-cell 设内联
   width = renderWidth - cellOffsetWidth（border 表的滚动条补偿，
   实测 4px）——只清 padding 右缘仍差这 4px。编辑态覆盖为 auto，
   编辑框才真正吃满整个 td（.vxe-cell 是块级 flex，auto 即铺满
   td 内容盒）；:has 只命中正在编辑的那一列，不动其他列的补偿。 */
:deep(.vxe-body--column):has(.dbm-cell-edit) > .vxe-cell {
  padding: 0 !important;
  width: auto !important;
}
.dbm-cell-edit :deep(.el-input),
.dbm-cell-edit :deep(textarea) { width: 100%; }
.dbm-cell-edit :deep(.el-input__inner),
.dbm-cell-edit :deep(textarea) { background: transparent; }

/* 设计视图子页签（胶囊分段） */
.dbm-subtabs {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}
.dbm-subtab {
  padding: 3px 14px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.dbm-subtab:hover { color: var(--el-text-color-primary); }
.dbm-subtab.active {
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  font-weight: 600;
  box-shadow: var(--el-box-shadow-light, none);
}
.dbm-col-actions { display: flex; gap: 8px; }

.dbm-auto-hint { font-size: 12px; color: var(--el-text-color-placeholder); }

/* ==================== 树：箭头 / 字段 / 类型 ==================== */
.dbm-arrow { flex: none; color: var(--el-text-color-placeholder); cursor: pointer; }
.dbm-root-icon { color: var(--el-color-primary); }
.dbm-pk-icon { color: var(--el-color-warning); }
.dbm-col-icon { color: var(--el-text-color-placeholder); }
.dbm-column-node { cursor: default; }
.dbm-column-node:hover { background: transparent; }
.dbm-tree-type {
  margin-left: 6px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* ==================== 数据网格：模式开关 / 注释行 / 无总数分页 ==================== */
.dbm-spacer { flex: 1; }
.dbm-switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dbm-hint { font-size: 12px; color: var(--el-text-color-placeholder); }

/* 添加用户：权限多选网格 */
.dbm-user-grants { display: flex; flex-wrap: wrap; gap: 4px 16px; }
.dbm-user-grant { display: inline-flex; align-items: center; gap: 5px; font-size: 13px; cursor: pointer; color: var(--el-text-color-regular); }
.dbm-simple-pager { display: inline-flex; align-items: center; gap: 8px; }

/* ============================================================
   索引列序 / 前缀长度（弹窗内）
   ============================================================ */
.dbm-idx-cols { display: flex; flex-direction: column; gap: 8px; width: 100%; }

/* 列序条：把「多选下拉里选出来的顺序」显式摊开，否则用户无法确认也不调整 */
.dbm-idx-order {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-lighter);
}
.dbm-idx-order-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-right: 2px;
}
.dbm-idx-order-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px 2px 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 12px;
  background: var(--el-bg-color);
}
/* 序号圆点：让列序一眼可辨，不靠数组下标的隐式约定 */
.dbm-idx-order-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
/* 列序的上下移按钮：用原生 button 承载，图标只是装饰。
   原生 button 自带边框/背景/内边距，不重置就会在标签里出现一个灰色小块，
   且 disabled 态也需要真正禁用（图标元素做不到）。 */
.dbm-idx-order-move {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-placeholder);
}
.dbm-idx-order-move:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}
.dbm-idx-order-move:disabled { cursor: not-allowed; opacity: 0.35; }

.dbm-idx-prefix { display: flex; flex-direction: column; gap: 6px; width: 100%; }
.dbm-idx-prefix-row { display: flex; align-items: center; gap: 8px; }
.dbm-idx-prefix-name { flex: 1; font-size: 12px; }

.dbm-pk-hint {
  margin-bottom: 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* ============================================================
   导入 / 导出向导
   ============================================================ */
.dbm-import { display: flex; flex-direction: column; gap: 12px; padding: 14px 18px 4px; }

/* 步骤条：编号圆点 + 标题 */
.dbm-import-step { display: flex; align-items: center; gap: 8px; }
.dbm-import-step-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
  line-height: 1;
}
.dbm-import-step-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }

/* 原生 file input 藏起来，由按钮触发（ReUpload 不在组件库里） */
.dbm-file-input { display: none; }
.dbm-import-file { font-size: 13px; color: var(--el-text-color-regular); }
.dbm-import-file em { font-style: normal; color: var(--el-text-color-placeholder); font-size: 12px; }

/* 参数行：横向铺开，窄屏自动换行 */
.dbm-import-params {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 18px;
}
.dbm-import-params .dbm-form-item { flex-direction: row; align-items: center; gap: 8px; }
.dbm-import-params .dbm-form-item label { white-space: nowrap; }

.dbm-import-preview-hint { padding: 20px 0; text-align: center; color: var(--el-text-color-placeholder); font-size: 13px; }
.dbm-import-preview { display: flex; flex-direction: column; gap: 8px; }
.dbm-import-preview-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}

/* 映射单元：源列 → 目标列下拉 */
.dbm-mapping-cell { display: flex; align-items: center; gap: 6px; }
.dbm-mapping-src {
  flex: 1;
  min-width: 0;
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dbm-mapping-arrow { color: var(--el-text-color-placeholder); }

.dbm-danger-hint { font-size: 12px; color: var(--el-color-danger); }

/* ============================================================
   数据库对象（存储过程 / 函数 / 触发器 / 事件）
   ============================================================ */
/* 分类节点上的「新建」小按钮：hover 才显形，避免树里全是图标 */
.dbm-tree-add { opacity: 0; cursor: pointer; color: var(--el-text-color-placeholder); }
.dbm-tree-node:hover .dbm-tree-add { opacity: 1; }
.dbm-tree-add:hover { color: var(--el-color-primary); }
/* 某类对象读不到时的提示（权限不足 / 内核无此概念） */
.dbm-tree-hint {
  padding: 4px 8px 4px 28px;
  font-size: 12px;
  color: var(--el-color-warning);
  word-break: break-all;
}

.dbm-object-view { display: flex; flex-direction: column; gap: 10px; padding: 10px 12px; }
.dbm-object-toolbar { display: flex; align-items: center; gap: 10px; }
.dbm-object-editor { font-size: 13px; line-height: 1.6; }

/* 导入结果与错误报告 */
.dbm-import-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-lighter);
}
.dbm-import-result-head { font-size: 13px; color: var(--el-text-color-regular); }
.dbm-import-errors {
  max-height: 140px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.dbm-import-errors-title { font-size: 12px; font-weight: 600; color: var(--el-color-danger); }
.dbm-import-error {
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

/* 过滤条（Navicat WHERE + 批量操作）：nowrap —— 展开后输入与按钮永远一行，
   这样过滤条的展开/收起（47px 一行）不再让表格上下跳 */
.dbm-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  padding: 8px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
}
.dbm-filter-label {
  flex: none;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 11.5px;
  font-weight: 700;
  color: var(--el-color-primary);
}
/* ReInput 根是 display:contents（无盒），width 落在根上等于没写；
   真盒是这个父作用域 wrapper，内部 el-input 经 :deep 铺满它。 */
.dbm-filter-input-wrap {
  flex: 0 1 420px;
  min-width: 160px;
  max-width: 46vw;
  display: block;
}
.dbm-filter-input-wrap :deep(.el-input) { width: 100%; }
/* 已生效条件数：用户得知道「现在看到的行是被筛过的」 */
.dbm-filter-badge {
  flex: none;
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9, var(--el-fill-color-light));
  border: 1px solid var(--el-color-primary-light-7, var(--el-border-color-lighter));
  border-radius: var(--el-radius-base, 4px);
  padding: 1px 7px;
  white-space: nowrap;
}

/* 高级筛选弹窗 */
.dbm-filter-list { display: flex; flex-direction: column; gap: 10px; max-height: 52vh; overflow: auto; }
.dbm-filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dbm-filter-row .dbm-mono { width: 150px; }
.dbm-filter-novalue {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  width: 150px;
}
.dbm-sel-count { flex: none; font-size: 12.5px; color: var(--el-text-color-secondary); }

.dbm-view-icon { color: var(--metric-net, var(--el-color-info)); }
.dbm-cell-box { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.dbm-cell-comment {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 表设计网格 ====================
   列网格已收口到 components/console/DesignColumnGrid.vue（与「新建表」弹窗同一份实现），
   原来这里那套 .dbm-dgrid-* 手写 grid 样式随模板块一并删除，避免留下会误导人的死样式。 */
.dbm-mono .el-input__inner {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
}

/* ==================== SQL 编辑器 ==================== */
.dbm-sql-component { margin-top: 2px; }
</style>

<!-- 非 scoped：结构同步弹窗被 ReDialog Teleport 到 body，scoped 的 [data-v] 属性
     不会落到 .el-dialog 上（实测 .dbm-sync-dialog[data-v-xxx] 匹配不到），
     所以固定高度等穿透规则必须放这里（仅限本弹窗 class，不影响全局） -->
<style>
/* 弹窗主体固定高度：四步等高、内容区内滚、底部按钮始终可见（步骤切换高度不变） */
.dbm-sync-dialog .el-dialog__body {
  height: 58vh;
  min-height: 460px;
  padding: 12px 18px 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
/* ReDialog 把 slot 又包了一层 .dialog-content-wrapper，默认是 display:block + overflow:auto
   —— 等于「方向条 + 中间内容 + 底部操作条」整块一起滚：差异项一多（实测 4545px）或视口矮
   （1440x800 及以下）时，底部按钮就被滚出可视区，永远看不到「比较 / 下一步 / 开始」。
   这里把它改成定高 flex 列且不自己滚，高度约束才能传到 .dbm-sync，
   中间的 .dbm-sync-body 才拿得到确定高度、overflow:auto 才真正生效。
   ⚠ 必须限定在本弹窗的 class 下：.dialog-content-wrapper 是全站 ReDialog 共用的。 */
.dbm-sync-dialog .dialog-content-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}
</style>
