<template>
  <div class="dbm" :class="{ 'is-embedded': embedded }">
    <!-- 顶部工具栏
         页面级动作只留数据源切换与一个刷新：新建查询 / 新建库表 / 导入数据已下沉到右键菜单
         （表 / 库 / 空白 三套），与 Navicat 的操作面一致。
         表页签激活时把「统计总数 + 列显示设置 + 恢复默认设置」这簇表视图设置挂到 hero：
         表格工具条第一行因此只放表名 / 显示模式 / 4 个数据动作，第二行分页独占右对齐 ——
         点分页、切统计总数、总位数变化都只动分页器自己的左缘，整页零位移（防抖结构）。 -->
    <div class="dbm-toolbar re-surface re-surface--dense">
      <div class="dbm-toolbar-left">
        <span class="dbm-toolbar-hint">右键表 / 库 / 空白处可执行新建、导入导出等操作</span>
      </div>
      <div class="dbm-toolbar-right">
        <!-- 刷新连接树必须保持 DOM 第一位：套件用 .dbm-toolbar-right .rs-btn :first 命中它 -->
        <ReButton layout="square" icon="Refresh" tip="刷新连接树" data-testid="dsm-btn-refresh" @click="refreshTree" />
        <!-- 表视图设置簇：与 .dbm-table-view 同一 v-if 条件，表页签激活才出现 -->
        <template v-if="activeTabObj && activeTabObj.type === 'table'">
          <label class="dbm-switch">
            <ReSwitch v-model="showTotal" />
            <span>统计总数</span>
          </label>
          <ReButton layout="square" icon="Operation" tip="列显示设置（显示 / 固定列）" @click="openColumnViewDialog" />
          <ReButton layout="square" icon="RefreshLeft" tip="恢复默认设置（视图偏好与各表筛选条件）" @click="resetViewSettings" />
        </template>
        <!-- 内嵌模式不显示数据源下拉：宿主页签已经表明当前浏览的是哪个数据源，
             再放一个下拉会和宿主左栏的选择打架（两个可改同一个值）。 -->
        <template v-if="!embedded">
          <!-- 共享数据源选择器（外部选项模式）：本页的候选是「默认主数据源」+ 台账，
               且 id 在本页是 number（要喂给各 API），所以由本页出选项、组件只管渲染。
               用 watch 而非 @change：ReSelect 不发 change 事件 -->
          <DatasourceSelect
            class="dbm-ds-select"
            placeholder="选择数据源"
            :model-value="String(currentDatasourceId)"
            :options="datasourceOptions"
            @update:model-value="onDatasourcePick"
          />
        </template>
        <span v-else class="dbm-ds-chip">
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
          <div class="dbm-tree-node dbm-tree-root" @click="toggleNode('root')">
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
                    @contextmenu.prevent="onTableContextMenu($event, view.name, db)"
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
                : 'Grid'"
              size="12"
            />
            <span class="dbm-tab-title">{{ tab.title }}</span>
            <ReIcon name="Close" size="12" class="dbm-tab-close" @click.stop="closeTab(tab.id)" />
          </div>
        </div>

        <!-- 表数据视图 -->
        <div v-if="activeTabObj && activeTabObj.type === 'table'" class="dbm-table-view">
          <div class="dbm-table-toolbar">
            <span class="dbm-table-name">{{ qualified(activeTabObj) }}</span>
            <!-- 表头显示模式：字段 / 注释 / 字段+注释 -->
            <div class="dbm-subtabs">
              <span
                v-for="m in HEADER_MODES"
                :key="m.value"
                class="dbm-subtab"
                :class="{ active: headerMode === m.value }"
                @click="headerMode = m.value"
              >{{ m.label }}</span>
            </div>
            <!-- 行显示模式：数据 / 数据+注释（三档的表头模式在上面的 HEADER_MODES） -->
            <div class="dbm-subtabs">
              <span
                v-for="m in ROW_MODES"
                :key="m.value"
                class="dbm-subtab"
                :class="{ active: rowMode === m.value }"
                @click="rowMode = m.value"
              >{{ m.label }}</span>
            </div>
            <span class="dbm-spacer" />
            <!-- 4 个数据动作留在表页签本地（套件 .dbm-table-toolbar 按钮计数/导出入口依赖这里）；
                 「统计总数 + 列显示 + 恢复默认」已迁到 hero。 -->
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
            <!-- 分页独占一整行（flex-basis:100%）且右对齐：分页器宽度随页码数/总位数/
                 统计总数开关变化时，只有它自己的左缘在动，第一行内容与工具条高度
                 恒定 —— 这是「点分页不抖动」的结构保证。 -->
            <div class="dbm-pager-row">
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
          </div>
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
          <ReTable
            :data="tableData.rows"
            :columns="tableColumns"
            :row-key="gridRowKey"
            :loading="tableLoading"
            :pagination="false"
            :border="true"
            column-draggable
            show-selection
            stripe
            height="calc(100% - 100px)"
            :context-menu="gridMenuItems"
            @selection-change="onSelectionChange"
            @sort-change="onSortChange"
            @context-menu-select="onGridMenuSelect"
          >
            <template v-for="col in tableData.columns" :key="'cell-' + col" #[`col-${col}`]="{ row, value }">
              <div v-if="editingCell && editingCell.row === row && editingCell.column === col" class="dbm-cell-edit" @click.stop>
                <ReInput
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
            <div v-loading="designLoading" class="dbm-dgrid">
              <div class="dbm-dgrid-head">
                <span>#</span>
                <span>字段名</span>
                <span>类型</span>
                <span>长度</span>
                <span>可空</span>
                <span>主键</span>
                <span>默认值</span>
                <span>注释</span>
                <span>操作</span>
              </div>
              <div
                v-for="(row, i) in designRows"
                :key="row.originalName || row.name"
                class="dbm-dgrid-row"
                :class="{ dirty: isDesignDirty(row) }"
              >
                <span class="dbm-dgrid-idx">{{ i + 1 }}</span>
                <ReInput v-model="row.name" class="dbm-mono" @dblclick="openColumnDialog('edit', row)" />
                <ReSelect v-model="row.type" :options="columnTypeOptions.map(t => ({ label: t, value: t }))" />
                <ReInputNumber :model-value="row.size ?? undefined" @update:model-value="row.size = $event ?? null" :min="1" :max="65535" controls-position="right" style="width: 100%" />
                <ReSwitch v-model="row.nullable" size="small" />
                <span class="dbm-dgrid-pk"><ReIcon v-if="row.isPrimaryKey" name="Key" :size="13" /></span>
                <ReInput v-model="row.defaultValue" class="dbm-mono" placeholder="默认值" />
                <ReInput v-model="row.comment" placeholder="注释" />
                <span class="dbm-dgrid-ops">
                  <ReButton
                    icon="Setting"
                    layout="square"
                    tip="列属性"
                    @click="openColumnDialog('edit', row)"
                  />
                  <ReButton
                    icon="Check"
                    layout="square"
                    tip="保存该行"
                    :disabled="!isDesignDirty(row)"
                    @click="saveDesignRow(row)"
                  />
                  <ReButton icon="Delete" layout="square" type="danger" tip="删除列" @click="removeColumn(row as never)" />
                </span>
              </div>
              <ReEmpty v-if="designRows.length === 0" description="暂无字段" :image-size="40" />
            </div>
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
                <ReSwitch v-model="txWanted" />
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

        <!-- ER 图页签（Navicat 的表关系可视化） -->
        <div v-if="activeTabObj && activeTabObj.type === 'er'" class="dbm-er-view">
          <div class="dbm-er-toolbar">
            <span class="dbm-table-name">{{ qualifiedEr }}</span>
            <ReInput
              v-model="erTableFilter"
              class="dbm-mono dbm-er-filter"
              placeholder="只画匹配这些表的图（支持 % 与 _，留空为全部）"
              clearable
              @keyup.enter="loadErDiagram"
            />
            <ReButton layout="square" type="primary" icon="Search" tip="按过滤条件重画" @click="loadErDiagram" />
            <span class="dbm-spacer" />
            <span class="dbm-er-stat">{{ erStatText }}</span>
            <ReSelect v-model="erLayout" class="dbm-er-layout" placeholder="布局">
              <ReOption v-for="l in ER_LAYOUT_CHOICES" :key="l.value" :label="l.label" :value="l.value" />
            </ReSelect>
            <ReButton
              layout="square"
              :type="erShowLabels ? 'primary' : ''"
              icon="Label"
              tip="显示 / 隐藏关系名"
              @click="erShowLabels = !erShowLabels"
            />
            <ReButton layout="square" icon="Refresh" tip="重新读取元数据" @click="loadErDiagram" />
            <ReButton layout="square" icon="Download" tip="导出为 DOT（Graphviz）" @click="exportErDot" />
          </div>
          <div v-if="erLoading" class="dbm-er-mask">正在读取表与外键…</div>
          <ReEmpty
            v-else-if="erError"
            class="dbm-er-empty"
            :description="erError"
          />
          <ReEmpty
            v-else-if="erNodes.length === 0"
            class="dbm-er-empty"
            :description="erTableFilter ? '没有匹配的表' : '这个库里还没有表'"
          />
          <ReRelationGraph
            v-else
            ref="erGraphRef"
            class="dbm-er-graph"
            :nodes="erNodes"
            :edges="erEdges"
            :layout="erLayout"
            highlight="adjacent"
            :toolbar="true"
            :minimap="true"
            @node-dblclick="onErNodeDblClick"
          />
          <!-- 表清单侧栏：图上双击要靠坐标命中，100 张表时图本身就没法导航。
               清单给出确定的入口，也让「这张表有几条关系」一眼可见。 -->
          <div class="dbm-er-list">
            <div
              v-for="t in erTables"
              :key="t.name"
              class="dbm-er-list-row"
              :class="{ missing: erMissingTables.has(t.name) }"
              :title="t.comment || t.name"
              @click="highlightErNode(t.name)"
              @dblclick="openErColumns(t.name)"
            >
              <span class="dbm-er-list-name">{{ t.name }}</span>
              <span class="dbm-spacer" />
              <span class="dbm-er-list-deg">{{ erDegree(t.name) }}</span>
            </div>
          </div>
          <!-- 双击节点后的列清单：ER 图上看列才能定位到具体字段 -->
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
              <ReButton @click="erColumnsVisible = false">关闭</ReButton>
            </template>
          </ReDialog>
        </div>

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
        <div v-if="tabs.length === 0" class="dbm-empty">
          <ReIcon name="Grid" size="64" class="dbm-empty-icon" />
          <p class="dbm-empty-text">从左侧选择表查看数据，或点击"新建查询"执行 SQL</p>
        </div>
      </div>
    </div>

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
          <div class="dbm-context-item" @click="renameTable(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="EditPen" :size="14" />重命名表
          </div>
          <div class="dbm-context-item" @click="duplicateTable(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="CopyDocument" :size="14" />复制表
          </div>
          <div class="dbm-context-item" @click="copyText(contextMenu.tableName)">
            <ReIcon name="CopyDocument" :size="14" />复制表名
          </div>
          <div class="dbm-context-divider" />
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
          <div class="dbm-context-item dbm-danger" @click="confirmTruncate(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Delete" :size="14" />清空表
          </div>
          <div class="dbm-context-item dbm-danger" @click="deleteTable(contextMenu.tableName, contextMenu.database)">
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
          <div class="dbm-context-item" @click="openErDiagram(contextMenu.database)">
            <ReIcon name="Share" :size="14" />ER 图（表关系）
          </div>
          <div class="dbm-context-item" @click="openStructureSync(contextMenu.database)">
            <ReIcon name="Sort" :size="14" />结构同步（与目标库比较）
          </div>
          <div class="dbm-context-item" @click="openDocumentExport(contextMenu.database)">
            <ReIcon name="Document" :size="14" />导出数据库文档
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

    <!-- 结构同步（比较两个库并生成同步脚本） -->
    <ReDialog v-model="syncVisible" title="结构同步" width="900px">
      <div class="dbm-sync">
        <div class="dbm-sync-bar">
          <span class="dbm-sync-side">
            源库
            <ReSelect v-model="syncSourceDb" placeholder="源库" class="dbm-sync-select">
              <ReOption v-for="db in databases" :key="'s' + db" :label="dbLabel(db)" :value="db" />
            </ReSelect>
          </span>
          <ReIcon name="Right" :size="16" />
          <span class="dbm-sync-side">
            目标库
            <ReSelect v-model="syncTargetDb" placeholder="目标库" class="dbm-sync-select">
              <ReOption v-for="db in databases" :key="'t' + db" :label="dbLabel(db)" :value="db" />
            </ReSelect>
          </span>
          <ReInput
            v-model="syncTableFilter"
            class="dbm-mono dbm-sync-filter"
            placeholder="只比较匹配的表（支持 % 与 _，留空为全部）"
            clearable
          />
          <ReButton layout="square" type="primary" icon="Search" tip="比较" :loading="syncLoading" @click="runStructureDiff" />
        </div>
        <ReEmpty
          v-if="!syncLoading && !syncDiffError && !syncRan"
          description="选好源库与目标库后点「比较」"
        />
        <ReEmpty
          v-else-if="syncDiffError"
          :description="syncDiffError"
        />
        <ReEmpty
          v-else-if="syncItems.length === 0"
          description="两个库的结构已经一致，没有需要同步的差异"
        />
        <div v-else class="dbm-sync-body">
          <div class="dbm-sync-summary">
            {{ syncItems.length }} 处差异 ·
            {{ syncActionableCount }} 处可直接同步 ·
            {{ syncExtraCount }} 处是目标多出来的（不会自动删除）
          </div>
          <div class="dbm-sync-list">
            <div v-for="(d, i) in syncItems" :key="i" class="dbm-sync-row" :class="d.kind">
              <span class="dbm-sync-kind">{{ SYNC_KIND_LABELS[d.kind] || d.kind }}</span>
              <span class="dbm-sync-obj">{{ d.table }}.{{ d.object }}</span>
              <span class="dbm-sync-detail">{{ d.detail }}</span>
            </div>
          </div>
          <div v-if="syncScript" class="dbm-sync-script-wrap">
            <div class="dbm-sync-script-head">
              <span>生成的同步脚本（未执行）</span>
              <span class="dbm-spacer" />
              <ReButton layout="square" icon="DocumentCopy" tip="复制脚本" @click="copyText(syncScript)" />
              <ReButton
                layout="square"
                type="primary"
                icon="VideoPlay"
                tip="在目标库执行这段脚本"
                @click="runStructureScript"
              />
            </div>
            <pre class="dbm-sync-script">{{ syncScript }}</pre>
          </div>
        </div>
      </div>
      <template #footer>
        <ReButton @click="syncVisible = false">关闭</ReButton>
      </template>
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
            <ReSwitch v-model="blobEditing" />
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
        <ReButton @click="blobVisible = false">关闭</ReButton>
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

    <!-- 导入数据弹窗 -->
    <ReDialog v-model="importVisible" title="导入向导" width="920px">
      <div class="dbm-import">
        <!-- 第 1 步：选文件 + 解析参数 -->
        <div class="dbm-import-step">
          <span class="dbm-import-step-no">1</span>
          <span class="dbm-import-step-title">选择文件</span>
          <ReButton
            layout="square"
            icon="Upload"
            :tip="importFile ? '重新选择文件' : '选择文件'"
            @click="importFileInput?.click()"
          />
          <input
            ref="importFileInput"
            type="file"
            class="dbm-file-input"
            accept=".csv,.tsv,.tab,.json,.sql,.txt"
            @change="onImportFilePicked"
          />
          <span v-if="importFile" class="dbm-import-file">
            {{ importFile.name }}
            <em>（{{ importFile.size }} 字节）</em>
          </span>
          <span v-else class="dbm-hint">支持 CSV / TSV / JSON 数组 / SQL 脚本</span>
        </div>
        <div class="dbm-import-params">
          <div class="dbm-form-item">
            <label>格式</label>
            <!-- ReSelect 只发 update:modelValue，不发 change；用 watch 触发重新解析 -->
            <ReSelect v-model="importFormat" style="width: 150px">
              <ReOption label="自动识别" value="auto" />
              <ReOption label="CSV" value="csv" />
              <ReOption label="TSV" value="tsv" />
              <ReOption label="JSON 数组" value="json" />
              <ReOption label="SQL 脚本" value="sql" />
            </ReSelect>
          </div>
          <div class="dbm-form-item">
            <label>首行是表头</label>
            <ReSwitch v-model="importHasHeader" @change="runImportPreview" />
          </div>
          <div class="dbm-form-item">
            <label>字符集</label>
            <ReSelect v-model="importEncoding" style="width: 150px">
              <ReOption label="UTF-8" value="" />
              <ReOption label="GBK" value="GBK" />
              <ReOption label="GB18030" value="GB18030" />
              <ReOption label="ISO-8859-1" value="ISO-8859-1" />
            </ReSelect>
          </div>
        </div>

        <!-- 第 2 步：目标与映射 -->
        <div class="dbm-import-step">
          <span class="dbm-import-step-no">2</span>
          <span class="dbm-import-step-title">目标与字段映射</span>
        </div>
        <div class="dbm-import-params">
          <div class="dbm-form-item">
            <label>目标表</label>
            <ReSelect v-model="importTableName" filterable placeholder="选择表" style="width: 240px">
              <ReOption v-for="t in getTablesForDb(importDatabase)" :key="t.name" :label="t.name" :value="t.name" />
            </ReSelect>
            <span class="dbm-hint">库：{{ importDatabase }}</span>
          </div>
          <div class="dbm-form-item">
            <label>冲突策略</label>
            <ReSelect v-model="importConflict" style="width: 190px">
              <ReOption label="跳过冲突行" value="skip" />
              <ReOption label="替换冲突行" value="replace" />
            </ReSelect>
          </div>
          <div class="dbm-form-item">
            <label>每批行数</label>
            <ReInputNumber v-model="importBatchSize" :min="1" :max="5000" controls-position="right" style="width: 120px" />
          </div>
          <div class="dbm-form-item">
            <label>导入前清空表</label>
            <ReSwitch v-model="importTruncate" />
            <span v-if="importTruncate" class="dbm-danger-hint">会删除目标表全部现有数据</span>
          </div>
        </div>

        <!-- 预览 + 映射 -->
        <div v-if="importPreviewing" class="dbm-import-preview-hint">正在解析文件…</div>
        <div v-else-if="importPreview && importPreview.columns.length" class="dbm-import-preview">
          <div class="dbm-import-preview-head">
            已解析 <strong>{{ importPreview.rowCount }}</strong> 行、
            <strong>{{ importPreview.columns.length }}</strong> 列
            <span class="dbm-hint">下方逐列配置映射，示例值取自前 {{ importPreview.rows.length }} 行</span>
            <ReButton layout="square" icon="Refresh" tip="重新解析文件" @click="runImportPreview" />
          </div>
          <ReTable
            :data="importPreviewRows"
            :columns="importPreviewColumns"
            :pagination="false"
            stripe
            border
            column-draggable
            height="240px"
          >
            <template #col-mapping="{ row }">
              <div class="dbm-mapping-cell">
                <span class="dbm-mapping-src">{{ row.__src }}</span>
                <span class="dbm-mapping-arrow">→</span>
                <ReSelect v-model="importMapping[row.__src]" size="small" placeholder="不导入" style="width: 130px">
                  <ReOption label="（不导入）" value="" />
                  <ReOption v-for="c in importTargetColumns" :key="c" :label="c" :value="c" />
                </ReSelect>
              </div>
            </template>
          </ReTable>
          <div v-if="importMappingConflict" class="dbm-danger-hint">映射冲突：{{ importMappingConflict }}</div>
        </div>

        <!-- 结果与错误报告 -->
        <div v-if="importResult" class="dbm-import-result">
          <div class="dbm-import-result-head">
            总行数 <strong>{{ importResult.totalRows }}</strong>，
            新增 <strong>{{ importResult.inserted }}</strong>，
            替换 <strong>{{ importResult.replaced }}</strong>，
            跳过 <strong>{{ importResult.skipped }}</strong>
          </div>
          <div v-if="importResult.errors.length" class="dbm-import-errors">
            <div class="dbm-import-errors-title">错误明细（最多 50 条）</div>
            <div v-for="(err, i) in importResult.errors" :key="i" class="dbm-import-error">{{ err }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <ReButton @click="closeImportWizard">关闭</ReButton>
        <ReButton
          type="primary"
          :loading="importing"
          :disabled="!importReady"
          @click="doImportData"
        >开始导入</ReButton>
      </template>
    </ReDialog>

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
            <ReOption v-for="c in importTargetColumns" :key="c" :label="c" :value="c" />
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
        <ReInput v-else-if="isDateCol(col)" v-model="rowForm[col]" type="date" :placeholder="`输入 ${col}`" />
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
        <ReSwitch v-model="columnForm.unsigned" />
      </div>
      <div
        v-if="columnForm.unsigned && columnForm.type !== 'FLOAT' && columnForm.type !== 'DOUBLE'"
        class="dbm-form-item"
      >
        <label>补零</label>
        <ReSwitch v-model="columnForm.zerofill" />
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
        <ReSwitch v-model="columnForm.nullable" />
      </div>
      <div v-if="columnAllowsUnsigned" class="dbm-form-item">
        <label>自动递增</label>
        <ReSwitch v-model="columnForm.autoIncrement" />
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
        <ReSwitch v-model="indexForm.unique" />
      </div>
      <div class="dbm-form-item">
        <label>设为主键</label>
        <ReSwitch v-model="indexForm.primary" />
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
        <ReButton @click="aiDialogVisible = false">关闭</ReButton>
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
        <ReButton @click="ddlVisible = false">关闭</ReButton>
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
// 类型分组与长度/小数位/UNSIGNED 适用范围：与「设计表」建表对话框共用一份
import { COLUMN_TYPE_GROUPS, SCALE_ALLOWED, SIZE_REQUIRED, UNSIGNED_ALLOWED } from "../../utils/columnTypes";
import ReTable from "@repo/ui/re-table";
import ReRelationGraph from "@repo/ui/re-relation-graph";
import { ReFormItem, ReOption } from "@repo/ui/re-kit";
import DbSqlEditor from "../../components/console/DbSqlEditor.vue";
import CreateTableDialog from "../../components/console/CreateTableDialog.vue";
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
  previewDbImport,
  importDbFile,
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
  type DbImportPreview,
  type DbImportResult,
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
  type: "table" | "design" | "query" | "object" | "er";
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
];
const headerMode = ref<"name" | "comment" | "both">(viewPref.headerMode);

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
 * 表头文案（按显示模式）
 * @param col 列名
 */
function headerLabel(col: string): string {
  const comment = columnComment(col);
  if (headerMode.value === "name" || !comment) return col;
  return headerMode.value === "comment" ? comment : `${col}（${comment}）`;
}

/** 网格右键菜单（Navicat 风格：行操作 + 复制为 SQL + 表操作，替代操作列；icon 传组件） */
const gridMenuItems = [
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
    case "delete": void deleteRow(ctx.row); break;
    case "refresh": refreshTableData(); break;
    case "truncate": if (tab) void confirmTruncate(tab.tableName, tab.database); break;
    case "drop": if (tab?.tableName) void deleteTable(tab.tableName, tab.database); break;
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

// ==================== 导入向导 ====================
/**
 * 导入向导（对齐 Navicat）：选文件 → 预览解析结果 → 字段映射 → 执行 + 错误报告。
 *
 * <p>解析与写入都走后端 {@code /db/import}，前端**不再拼 SQL**：
 * 早期实现在前端逐条拼 INSERT 再调 {@code /db/execute}，既绕过了批量写入与
 * 类型转换，也让「一行坏数据」会中断整批，且 CSV 引号/换行解析不正确。</p>
 */
const importVisible = ref(false);
const importTableName = ref("");
const importDatabase = ref("");
/** 选中的文件（原生 File，不落 base64，省内存） */
const importFile = ref<File | null>(null);
/** 格式：auto 让后端按后缀与内容探测 */
const importFormat = ref("auto");
/** 首行是否为表头 */
const importHasHeader = ref(true);
/** 字符集，空表示 UTF-8 */
const importEncoding = ref("");
/** 预览结果（解析但不写库） */
const importPreview = ref<DbImportPreview | null>(null);
/** 预览中（调后端解析） */
const importPreviewing = ref(false);
/**
 * 源列名 → 目标列名。
 *
 * <p>用 {@code ref} 包普通对象（而非 {@code reactive}）：预填时要**整体替换**这个对象，
 * {@code ref} 天然支持；改成 {@code reactive} 后逐键赋值不会让已渲染的下拉重算选中值。</p>
 */
const importMapping = ref<Record<string, string>>({});
/** 导入前清空目标表（破坏性） */
const importTruncate = ref(false);
/** 冲突策略 */
const importConflict = ref<"skip" | "replace">("skip");
/** 每批行数 */
const importBatchSize = ref(500);
/** 执行中 */
const importing = ref(false);
/** 导入结果（用于展示错误报告） */
const importResult = ref<DbImportResult | null>(null);
/** 原生 file input 的 DOM 引用 */
const importFileInput = ref<HTMLInputElement | null>(null);
/** 目标表的列（映射下拉候选），按「库.表」缓存 */
const importColumns = ref<DbColumnInfo[]>([]);
const importColumnsKey = ref("");

const openImportData = async (tableName?: string, database?: string) => {
  const db = database || activeDatabase.value;
  if (!db) {
    message.warning("请先在左侧选择一个数据库");
    return;
  }
  importDatabase.value = db;
  // 表列表是展开树节点时才缓存的，未展开过要补一次，否则目标表下拉是空的
  if (!tablesByDb[db]?.length) {
    await loadTables(db);
  }
  const list = tablesByDb[db] || [];
  importTableName.value = tableName || list[0]?.name || "";
  importFormat.value = "auto";
  importFile.value = null;
  importPreview.value = null;
  importResult.value = null;
  importTruncate.value = false;
  importConflict.value = "skip";
  importBatchSize.value = 500;
  importVisible.value = true;
  // 必须主动拉一次结构：映射下拉的候选来自目标表列，
  // 而列只在**树节点展开**时才缓存。从右键进来时目标表未必展开过，
  // 不拉一次就会拿到空候选 → 映射全落「不导入」→ 「开始导入」常灰。
  await loadImportTargetColumns();
};

/**
 * 拉取目标表的列，作为字段映射的候选。
 *
 * <p>按「库.表」缓存，已缓存直接复用，避免每次开向导都打接口。</p>
 */
async function loadImportTargetColumns(): Promise<void> {
  const db = importDatabase.value;
  const table = importTableName.value;
  if (!db || !table) {
    return;
  }
  const key = `${db}.${table}`;
  if (importColumnsKey.value === key && importColumns.value.length) {
    return;
  }
  try {
    importColumns.value = (await fetchTableColumns(table, currentDatasourceId.value, db)) || [];
    importColumnsKey.value = key;
  } catch (e) {
    importColumns.value = [];
    message.warning(`读取目标表结构失败：${String((e as Error)?.message ?? e)}`);
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

/**
 * 目标表的列（映射下拉的候选）。
 *
 * <p>用 {@link loadImportTargetColumns} 主动拉的缓存，而不是树节点的展开缓存 ——
 * 后者只在用户展开过该表节点时有值，从右键入口进来时是空的。</p>
 */
const importTargetColumns = computed<string[]>(() => importColumns.value.map(c => c.name));

/**
 * 是否允许提交导入。
 *
 * <p>SQL 脚本没有列概念，只要求「选了文件 + 选了表」；其余格式必须先解析出列，
 * 否则等于盲写。</p>
 */
const importReady = computed(() => {
  if (!importFile.value || !importTableName.value) return false;
  if (importFormat.value === "sql" || /\.sql$/i.test(importFile.value.name)) return true;
  return (importPreview.value?.columns.length ?? 0) > 0;
});

/** 映射里已选中的目标列（检测两个源列映射到同一目标列） */
const importMappingConflict = computed(() => {
  const used = new Map<string, string>();
  for (const [source, target] of Object.entries(importMapping.value)) {
    if (!target) continue;
    if (used.has(target)) return `${used.get(target)} 与 ${source} 都映射到 ${target}`;
    used.set(target, source);
  }
  return "";
});

/**
 * 选中文件后自动触发一次预览（用户能立刻看到解析对不对）。
 * @param event input 的 change 事件
 */
function onImportFilePicked(event: Event) {
  const input = event.target as HTMLInputElement;
  importFile.value = input.files?.[0] ?? null;
  importPreview.value = null;
  importResult.value = null;
  if (importFile.value) {
    void runImportPreview();
  }
}

/**
 * 请求后端解析文件（不写库），并按同名列自动预填字段映射。
 */
async function runImportPreview(): Promise<void> {
  const file = importFile.value;
  if (!file) {
    message.warning("请先选择文件");
    return;
  }
  importPreviewing.value = true;
  try {
    const preview = await previewDbImport(file, importFormat.value, importHasHeader.value, importEncoding.value || undefined);
    importPreview.value = preview;
    // 整体替换成新对象：逐键删除/赋值不会让已渲染的 ReSelect 重算选中值
    const next: Record<string, string> = {};
    for (const col of preview.columns) {
      next[col] = importTargetColumns.value.find(c => c === col) ?? "";
    }
    importMapping.value = next;
  } catch (e) {
    importPreview.value = null;
    message.error(`解析失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    importPreviewing.value = false;
  }
}

/**
 * 切换目标表后重跑映射预填（列集合变了）。
 */
/**
 * 目标表变了 → 拉新表结构并按同名重新预填映射。
 */
watch(importTableName, async () => {
  await loadImportTargetColumns();
  prefillImportMapping();
});

/** 切换数据源 → 重载树与库列表 */
watch(currentDatasourceId, () => {
  void onDatasourceChange();
});

/** 新建库对话框里选了字符集 → 刷新可选排序规则 */
watch(newDbCharset, () => {
  onCharsetChange();
});

/**
 * 解析参数变了 → 自动重新解析。
 *
 * <p>用 watch 而不是模板上的 {@code @change}：{@code ReSelect} 只发
 * {@code update:modelValue}，**不发 {@code change}**（见 packages/ui 的 ReSelect
 * 两个 layout 都只 emit 了 update:modelValue）。挂 {@code @change} 会静默不触发，
 * 表现为「换了格式/字符集但预览不变」。</p>
 */
watch([importFormat, importEncoding], () => {
  if (importFile.value) {
    void runImportPreview();
  }
});

/**
 * 预览结果或目标列变化时按同名预填映射。
 *
 * <p>必须双向兜底：选文件触发的 {@link runImportPreview} 与开向导时的
 * {@link loadImportTargetColumns} 是**并行**的，预览先回来时目标列还没到。
 * 只在预览里写一次映射会让下拉停在「不导入」——而后端会按同名列兜底，
 * 于是**界面显示不导入、实际却导入了**，属于误导性 UI。</p>
 */
watch([importPreview, importColumns], () => {
  prefillImportMapping();
});

/**
 * 按同名规则预填字段映射（已配置的不覆盖）。
 *
 * <p>用 {@code importMapping.value = next} **整体替换**而不是逐键赋值：映射对象是
 * {@code reactive} 的普通对象，键在渲染之后才动态加进来时，逐键赋值不会让已渲染的
 * {@code ReSelect} 重算选中值，表现为「下拉里有目标列、当前值却还停在「不导入」」。</p>
 */
function prefillImportMapping(): void {
  const preview = importPreview.value;
  if (!preview) return;
  const targets = importTargetColumns.value;
  const next: Record<string, string> = { ...importMapping.value };
  let changed = false;
  for (const col of preview.columns) {
    if (next[col]) continue;
    const hit = targets.find(c => c === col);
    if (hit) {
      next[col] = hit;
      changed = true;
    }
  }
  if (changed) {
    importMapping.value = next;
  }
}

/**
 * 预览表格的数据：**一行一个源列**（左侧是映射下拉，右侧是该列在各预览行里的取值）。
 *
 * <p><b>不能直接渲染 {@code preview.rows}</b>：那些行是「数据行」，一行里含所有列，
 * 而字段映射是「一个源列 → 一个目标列」，粒度不同。直接渲染会让
 * {@code row.__src} 取到 undefined，映射全写到 {@code "undefined"} 键上，
 * 界面停在「不导入」而后端却按同名列兜底导入 —— 界面与实际行为不一致。</p>
 */
const importPreviewRows = computed(() => {
  const preview = importPreview.value;
  if (!preview) return [];
  const sample = preview.rows[0] ?? {};
  return preview.columns.map(column => ({
    __src: column,
    __sample: sample[column] === null || sample[column] === undefined ? "" : String(sample[column]),
  }));
});

/** 预览表的列定义 */
const importPreviewColumns = computed(() => [
  { prop: "__src", label: "源列 → 目标列", minWidth: 230, slot: "mapping", fixed: "left" as const },
  { prop: "__sample", label: "示例值", minWidth: 180, showOverflowTooltip: true },
]);

/**
 * 执行导入。
 */
async function doImportData(): Promise<void> {
  if (!importTableName.value) {
    message.warning("请选择目标表");
    return;
  }
  if (!importFile.value) {
    message.warning("请选择要导入的文件");
    return;
  }
  // SQL 脚本自带完整语句，**不需要也不应该**配字段映射；
  // 拿映射去要求用户配置会把它挡在门外（实测报「请至少配置一个字段映射」）。
  const isSqlScript = importFormat.value === "sql" || /\.sql$/i.test(importFile.value.name);
  const mapping: Record<string, string> = {};
  for (const [source, target] of Object.entries(importMapping.value)) {
    if (target) mapping[source] = target;
  }
  if (!isSqlScript) {
    if (Object.keys(mapping).length === 0) {
      message.warning("请至少配置一个字段映射");
      return;
    }
    if (importMappingConflict.value) {
      message.warning(`字段映射有冲突：${importMappingConflict.value}`);
      return;
    }
  }
  if (importTruncate.value) {
    try {
      await ElMessageBox.confirm(
        `导入前会**清空目标表 ${importTableName.value} 的全部数据**，此操作不可撤销。确定继续？`,
        "确认清空并导入",
        { type: "warning", confirmButtonText: "清空并导入", cancelButtonText: "取消" }
      );
    } catch {
      return;
    }
  }
  importing.value = true;
  importResult.value = null;
  try {
    const result = await importDbFile(importFile.value, {
      fileName: importFile.value.name,
      format: importFormat.value,
      hasHeader: importHasHeader.value,
      encoding: importEncoding.value || undefined,
      database: importDatabase.value,
      tableName: importTableName.value,
      columnMapping: mapping,
      truncateFirst: importTruncate.value,
      onConflict: importConflict.value,
      batchSize: importBatchSize.value,
      datasourceId: currentDatasourceId.value,
    });
    importResult.value = result;
    const done = result.inserted + result.replaced;
    if (result.skipped > 0) {
      message.warning(`导入完成：成功 ${done} 行，跳过 ${result.skipped} 行（见下方错误报告）`);
    } else {
      message.success(`导入完成：成功 ${done} 行`);
    }
    openTableData(importTableName.value, importDatabase.value);
  } catch (e) {
    message.error(`导入失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    importing.value = false;
  }
}

/** 关闭向导并清掉临时状态 */
function closeImportWizard(): void {
  importVisible.value = false;
  resetImportWizard();
}

/**
 * 清空向导的临时状态。
 *
 * <p>不能挂在 ReDialog 的关闭事件上：该组件只发 {@code ok / cancel / update:modelValue /
 * close-fab / fullscreen-change}，**没有 {@code closed}**，挂上去不会触发。
 * 改为 watch 可见性，点右上角 ×、按 ESC、点遮罩都能清干净。</p>
 */
function resetImportWizard(): void {
  importFile.value = null;
  importPreview.value = null;
  importResult.value = null;
  if (importFileInput.value) {
    // 清掉已选文件，否则同名文件再选一次不会触发 change
    importFileInput.value.value = "";
  }
}

watch(importVisible, visible => {
  if (!visible) {
    resetImportWizard();
  }
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

/** 从工具栏/右键打开导出对话框 */
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
  exportVisible.value = true;
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
  rowForm.value = { ...row };
  editingRow.value = row;
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
  scale?: number;
}

/**
 * 设计行：包含原始值快照用于脏检测。
 *
 * <p>除表格里显示的几列外，还带上了列的**完整属性**（无符号 / 字符集 / 自增 /
 * 枚举取值等）。这些在网格里不显示，但「列属性」弹窗要靠它们回填 ——
 * 若不带上，打开弹窗只能看到空值，用户一点保存就把属性全清掉。</p>
 */
interface DesignRow {
  originalName: string;
  name: string;
  type: string;
  size: number | null;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string;
  comment: string;
  default?: string;
  remark?: string;
  baseType?: string;
  unsigned?: boolean;
  zerofill?: boolean;
  autoIncrement?: boolean;
  charset?: string;
  collation?: string;
  enumValues?: string[];
  scale?: number;
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
    isPrimaryKey: r.isPrimaryKey,
    default: r.defaultValue,
    remark: r.comment,
  }) as DbColumnInfo),
);

/**
 * 行是否有改动
 * @param row 设计行
 */
function isDesignDirty(row: DesignRow): boolean {
  const o = row.origin;
  return row.name !== o.name
    || row.type !== o.type
    || (row.size ?? null) !== (o.size ?? null)
    || row.nullable !== o.nullable
    || row.defaultValue !== o.defaultValue
    || row.comment !== o.comment;
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
async function saveDesignRow(row: DesignRow): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab?.tableName || !isDesignDirty(row)) return;
  try {
    await modifyDbColumn(tab.tableName, row.originalName, { ...designPayload(row), database: tab.database });
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
 * ReTable 多选聚合键。
 *
 * <p>ReTable 按 rowKey 字段聚合选中行，默认值是 id；被管理的库表未必有 id 列
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
  // 只有可解码成文本的二进制才提供「文本」视图
  if (blobIsBinary.value && blobText.value && !/�/.test(blobText.value)) {
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
function isDateCol(col: string) {
  return /DATE|TIME|YEAR/.test(columnTypes.value.get(col) || "");
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
    loadPkInfo(tab);
    refreshTableData();
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

// 右键菜单（tableName=表节点 / database=库节点 / tabId=页签 / 全空=侧栏空白）
const contextMenu = reactive({ visible: false, x: 0, y: 0, tableName: "", database: "", tabId: "" });

// 新建表：表单与 SQL 拼装都在共享组件里，这里只保留「弹窗开关 + 目标库」
const createTableVisible = ref(false);
/** 新建表的目标库，来自左侧树选中节点 */
const newTableDatabase = ref("");

// 初始化
onMounted(async () => {
  await loadDatasources();
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
const erLayout = ref<(typeof ER_LAYOUT_CHOICES)[number]["value"]>("dagre");
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

/** 图上的节点 */
const erNodes = computed(() => erTables.value.map(t => ({
  id: t.name,
  label: t.comment ? `${t.name}\n${t.comment}` : t.name,
  type: "rect" as const,
  size: [180, 52] as [number, number],
  style: {
    fill: erMissingTables.value.has(t.name) ? "var(--el-fill-color-dark)" : "var(--el-bg-color-overlay)",
    stroke: erMissingTables.value.has(t.name) ? "var(--el-color-warning)" : "var(--el-color-primary)",
    lineWidth: 1,
    radius: 6,
    labelFill: "var(--el-text-color-primary)",
    labelFontSize: 12,
    cursor: "pointer",
  },
  data: { tableName: t.name, missing: erMissingTables.value.has(t.name) },
})));

/** 只被外键引用、却不在表清单里的表（跨库外键等） */
const erMissingTables = computed(() => new Set(
  erTables.value.filter(t => t.comment?.startsWith("（")).map(t => t.name),
));

/** 外键规则码 → 中文（JDBC 规范：0=RESTRICT 1=CASCADE 2=SET NULL 3=NO ACTION 4=SET DEFAULT） */
function fkRuleText(code?: number): string {
  switch (code) {
    case 0: return "限制";
    case 1: return "级联";
    case 2: return "置空";
    case 3: return "无动作";
    case 4: return "设默认";
    default: return "";
  }
}

/** 图上的边：一条外键一条边，指向被引用的表 */
const erEdges = computed(() => erRelations.value.map((r, i) => {
  const label = [
    r.fromColumn ? `${r.fromColumn} → ${r.toColumn ?? "?"}` : "",
    r.name ?? "",
    fkRuleText(r.deleteRule) ? `删除:${fkRuleText(r.deleteRule)}` : "",
  ].filter(Boolean).join("  ");
  return {
    id: `fk-${i}-${r.fromTable}-${r.toTable}`,
    source: r.fromTable,
    target: r.toTable,
    label: erShowLabels.value ? label : undefined,
    // 复合外键会产生多条同名边，靠列名区分开，否则 id 冲突
    type: "cubic-horizontal" as const,
    directed: true,
    style: {
      stroke: "var(--el-color-primary-light-3)",
      lineWidth: 1.2,
      endArrow: true,
      labelFill: "var(--el-text-color-secondary)",
      labelFontSize: 10,
      labelBackground: true,
      labelBackgroundFill: "var(--el-bg-color-overlay)",
      labelBackgroundRadius: 2,
    },
    data: r,
  };
}));

/** 工具条右侧的统计文本 */
const erStatText = computed(() => {
  if (erLoading.value) return "";
  return `${erTables.value.length} 张表 · ${erRelations.value.length} 条外键`;
});

/** 页签标题里的库名 */
const qualifiedEr = computed(() => {
  const db = activeTabObj.value?.database || "";
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
  const id = "er-" + database;
  let tab = tabs.value.find(t => t.id === id);
  if (!tab) {
    tab = { id, type: "er", title: tabTitle(database, "") + " - ER 图", database };
    tabs.value.push(tab);
  }
  activeTab.value = id;
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
const syncSourceDb = ref("");
const syncTargetDb = ref("");
const syncTableFilter = ref("");
const syncItems = ref<DbStructureDiffItem[]>([]);

/** 需要同步的差异数（排除只提示的那些） */
const syncActionableCount = computed(
  () => syncItems.value.filter(d => !SYNC_EXTRA_KINDS.has(d.kind)).length,
);
/** 目标多出来的差异数 */
const syncExtraCount = computed(
  () => syncItems.value.filter(d => SYNC_EXTRA_KINDS.has(d.kind)).length,
);
/** 生成的脚本：只拼可执行的那些 */
const syncScript = computed(
  () => syncItems.value.filter(d => d.ddl).map(d => d.ddl).join("\n"),
);

/**
 * 打开结构同步弹窗。
 *
 * <p>默认把「当前库当源、第一个不是它的库当目标」——
 * 用户从某个库的右键点进来时，这个方向最可能是他要的。
 * 方向永远是用户显式选的：结构同步是单向操作，
 * 「以谁为准」不该由实现替用户定。</p>
 *
 * @param database 当前库，作为源
 */
function openStructureSync(database = activeDatabase.value) {
  if (!database) {
    message.warning("请先在左侧选择一个库");
    return;
  }
  syncSourceDb.value = database;
  syncTargetDb.value = databases.value.find(db => db && db !== database) || "";
  syncTableFilter.value = "";
  syncItems.value = [];
  syncDiffError.value = "";
  syncRan.value = false;
  syncVisible.value = true;
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

/** 比较两个库 */
async function runStructureDiff(): Promise<void> {
  if (!syncSourceDb.value || !syncTargetDb.value) {
    message.warning("请同时选择源库与目标库");
    return;
  }
  if (syncSourceDb.value === syncTargetDb.value) {
    message.warning("源库与目标库相同，没有可比较的差异");
    return;
  }
  syncLoading.value = true;
  syncDiffError.value = "";
  try {
    syncItems.value = await compareDbStructure({
      sourceDatasourceId: currentDatasourceId.value,
      sourceDatabase: syncSourceDb.value,
      targetDatasourceId: currentDatasourceId.value,
      targetDatabase: syncTargetDb.value,
      tables: syncTableFilter.value.trim() || undefined,
    });
    syncRan.value = true;
  } catch (e) {
    syncDiffError.value = `比较失败：${String((e as Error)?.message ?? e)}`;
    syncItems.value = [];
    syncRan.value = true;
  } finally {
    syncLoading.value = false;
  }
}

/**
 * 在目标库执行生成的脚本，然后重新比较一次。
 *
 * <p>执行前必须二次确认：脚本里含 {@code DROP INDEX} 与
 * {@code MODIFY COLUMN}，是不可逆的。用户看过脚本再点一次是有意义的，
 * 但不能靠「他应该看过了」。</p>
 */
async function runStructureScript(): Promise<void> {
  const script = syncScript.value;
  if (!script) return;
  const lines = script.split("\n").filter(Boolean).length;
  try {
    await ElMessageBox.confirm(
      `将向目标库「${syncTargetDb.value}」执行 ${lines} 条语句，其中含不可逆的 DROP INDEX / MODIFY COLUMN。确定执行？`,
      "执行同步脚本",
      { type: "warning", confirmButtonText: "执行", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  syncLoading.value = true;
  try {
    const result = await executeDbSqlBatch(script, currentDatasourceId.value, syncTargetDb.value);
    // 批量结果里没有 success 字段：失败是「有 message 且没有结果集/影响行数」，
    // 逐条判断要按 DbStatementResult 的实际形状来，不能套一个想当然的 success
    const bad = (result.results || []).filter(
      r => !!r.message && r.columns === undefined && r.affectedRows === undefined,
    );
    if (bad.length > 0) {
      message.error(`${bad.length}/${lines} 条语句失败：` + String(bad[0].message || "").slice(0, 120));
    } else {
      message.success(`已执行 ${lines} 条语句，正在重新比较`);
    }
  } catch (e) {
    message.error(`执行失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    syncLoading.value = false;
  }
  await runStructureDiff();
}

/**
 * 读取并绘制 ER 图。
 *
 * <p>只在这一个页签需要时才拉数据：ER 图对大库是**一次性整体视图**，
 * 在每次切库/切页签时都重拉会让浏览树的过程明显变慢。</p>
 */
async function loadErDiagram(): Promise<void> {
  const tab = activeTabObj.value;
  if (!tab || tab.type !== "er") return;
  erLoading.value = true;
  erError.value = "";
  try {
    const data = await fetchErDiagram(
      erTableFilter.value.trim() || undefined,
      currentDatasourceId.value,
      tab.database,
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
  } catch (e) {
    erError.value = `读取失败：${String((e as Error)?.message ?? e)}`;
    erTables.value = [];
    erRelations.value = [];
  } finally {
    erLoading.value = false;
  }
}

/** ER 图组件实例（用于从清单跳转时高亮/居中） */
const erGraphRef = ref<unknown>(null);

/** 双击图上的节点：列出该表的列 */
async function onErNodeDblClick(node: { id?: string }): Promise<void> {
  await openErColumns(String(node?.id ?? ""));
}

/** 打开某张表的列清单 */
async function openErColumns(name: string): Promise<void> {
  if (!name) return;
  erPickedTable.value = name;
  erColumnsVisible.value = true;
  erPickedColumns.value = [];
  try {
    const cols = await fetchTableColumns(name, currentDatasourceId.value, activeTabObj.value?.database);
    erPickedColumns.value = cols || [];
  } catch (e) {
    message.error(`读取列失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 每张表参与的外键条数（清单上显示，一眼看出「这张表是孤立的」） */
function erDegree(name: string): number {
  return erRelations.value.filter(r => r.fromTable === name || r.toTable === name).length;
}

/** 点清单里的一行：在图上高亮该节点并居中 */
function highlightErNode(name: string): void {
  const api = erGraphRef.value as {
    highlight?: (ids: string[]) => void;
    centerOn?: (id: string) => void;
  } | null;
  api?.highlight?.([name]);
  api?.centerOn?.(name);
}

/** 从 ER 图打开该表的数据页签 */
function openErTableData(tableName: string) {
  if (!tableName) return;
  erColumnsVisible.value = false;
  openTableData(tableName, activeTabObj.value?.database || activeDatabase.value);
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
    `${activeTabObj.value?.database || "er"}-${Date.now()}.dot`,
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
        originalName: c.name,
        ...origin,
        isPrimaryKey: !!c.isPrimaryKey,
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
        scale: c.scale ?? 0,
        origin,
      };
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

function onTableContextMenu(e: MouseEvent, tableName: string, database: string) {
  e.stopPropagation();
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = tableName;
  contextMenu.database = database;
  contextMenu.tabId = "";
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
  activeDatabase.value = database;
  void clampContextMenuPosition();
}

function onSidebarContextMenu(e: MouseEvent) {
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = "";
  contextMenu.database = "";
  contextMenu.tabId = "";
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

/** 右键菜单估算高度（项高 32 + 上下内边距 + 按节点类型的分割线） */
function menuEstimatedHeight(): number {
  // 项数必须与模板四套菜单实际条目同步：表 13 项/3 分割线、库 8 项/2 分割线、页签 3 项/1 分割线、空白 5 项/1 分割线。
  // 曾硬编码库 5 项（实际 8 项）→ 低估 96px → 靠近窗口底部时菜单溢出视口，
  // 末项「删除数据库」落在屏幕外永远点不到（普通点击超时、force 点到屏外无响应）
  const count = contextMenu.tableName ? 13 : contextMenu.database ? 8 : contextMenu.tabId ? 3 : 5;
  const dividers = contextMenu.tableName ? 3 : contextMenu.database ? 2 : 1;
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
  [headerMode, rowMode, erLayout, erShowLabels, erTableFilter],
  () => {
    saveViewPref({
      headerMode: headerMode.value,
      rowMode: rowMode.value,
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

/* 独立模式的数据源下拉：宽度与原 ReSelect 一致，避免工具栏布局跳动 */
.dbm-ds-select {
  width: 200px;
}

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
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
}
.dbm-toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; flex: 0 1 auto; min-width: 0; }
.dbm-toolbar-hint { font-size: 12px; color: var(--el-text-color-placeholder); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* 右侧：数据源下拉与刷新按钮之间不留多余间距 */
.dbm-toolbar-right { display: flex; align-items: center; gap: 8px; flex: none; flex-wrap: nowrap; }
/* 统计总数开关（ConsoleSwitch 的 radio 胶囊）：ep-radio-group 是换行 flex，
   一旦被压窄就会把「是 / 否」竖着叠成两行，连带把整个工具条顶高 ——
   钉死不缩，胶囊恒定单行，工具条高度才不随页签切换抖动。 */
.dbm-toolbar-right .dbm-switch { flex: none; }

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
/* 设计视图：动作条跟在同一行，右侧对齐；不再单独占一行 */
.dbm-design-toolbar .dbm-col-actions { margin-left: auto; }
/* 表名过长时用省略号收住，否则会把第一行内容顶到第二行 */
.dbm-table-toolbar .dbm-table-name {
  flex: 0 1 auto;
  min-width: 60px;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 工具条第一行：模式分段与动作按钮都是固定宽度，不缩不换 */
.dbm-table-toolbar .dbm-subtabs { flex: none; }
.dbm-table-toolbar .re-button__tip-wrap { flex: none; }
/* 分页独占一整行（flex-basis 100%）且右对齐：页码数 / 总位数 / 统计总数开关
   变化时只动分页器自己的左缘，第一行内容与工具条总高恒定 —— 点分页零位移的关键。
   52px = el-pagination 的自然高度（实测），与简易分页形态共用这个高度，
   切「统计总数」开关时两种形态高度一致，工具条总高不变。 */
.dbm-pager-row {
  flex: 1 0 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 52px;
}
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
.dbm-sync { display: flex; flex-direction: column; gap: 10px; }
.dbm-sync-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dbm-sync-side {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dbm-sync-select { width: 170px; }
.dbm-sync-filter { width: 220px; }
.dbm-sync-body { display: flex; flex-direction: column; gap: 8px; }
.dbm-sync-summary {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.dbm-sync-list {
  max-height: 220px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
}
.dbm-sync-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 5px 10px;
  font-size: 12.5px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dbm-sync-row:last-child { border-bottom: none; }
.dbm-sync-kind {
  flex-shrink: 0;
  padding: 0 6px;
  font-size: 11px;
  line-height: 17px;
  border-radius: 3px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9, var(--el-fill-color-light));
}
/* 「目标多出来的」用中性色：它不是待办事项，是提示 */
.dbm-sync-row.EXTRA_TABLE .dbm-sync-kind,
.dbm-sync-row.EXTRA_COLUMN .dbm-sync-kind {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.dbm-sync-obj {
  flex-shrink: 0;
  font-family: var(--el-font-family-mono, monospace);
}
.dbm-sync-detail {
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dbm-sync-script-wrap { display: flex; flex-direction: column; gap: 6px; }
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

/* ER 图视图 */
.dbm-er-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}
.dbm-er-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 8px;
}
.dbm-er-filter { width: 280px; }
.dbm-er-layout { width: 150px; }
.dbm-er-stat {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.dbm-er-mask,
.dbm-er-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}
/* 图本身撑满剩余高度：ER 图是「整体视图」，
   给固定高度会让 40 张表的图挤成一团且没法滚 */
.dbm-er-graph {
  flex: 1;
  min-height: 320px;
}
/* 表清单侧栏：100 张表时图本身没法导航，给一个确定入口 */
.dbm-er-list {
  flex: 0 0 240px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
  background: var(--el-bg-color-overlay);
}
.dbm-er-list-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  font-size: 12.5px;
  cursor: pointer;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dbm-er-list-row:hover { background: var(--el-fill-color-light); }
.dbm-er-list-row.missing {
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9, transparent);
}
.dbm-er-list-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--el-font-family-mono, monospace);
}
/* 关系条数：0 表示孤立表，一眼可辨 */
.dbm-er-list-deg {
  flex-shrink: 0;
  padding: 0 6px;
  font-size: 11px;
  line-height: 17px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 8px;
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
  margin: -4px -8px;
  padding: 4px 8px;
  background: var(--el-color-primary-light-9);
}
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

/* ==================== 表设计网格 ==================== */
.dbm-dgrid {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.dbm-dgrid-head,
.dbm-dgrid-row {
  display: grid;
  /* 「可空」那格现在是 ReRadio 分段单选（是/否），比原来的开关宽：
     70px 会把两枚按钮挤到换行/溢出，撑到 96px。 */
  grid-template-columns: 44px minmax(150px, 1.2fr) 130px 110px 96px 56px minmax(120px, 1fr) minmax(150px, 1.2fr) 100px;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  min-width: 1120px;
}
.dbm-dgrid-head {
  position: sticky;
  top: 0;
  z-index: 2;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.dbm-dgrid-row { border-top: 1px solid var(--el-border-color-lighter); }
.dbm-dgrid-row:hover { background: var(--el-fill-color-extra-light, var(--el-fill-color-light)); }
.dbm-dgrid-row.dirty { background: var(--el-color-warning-light-9); }
.dbm-dgrid-idx {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}
.dbm-dgrid-pk { display: grid; place-items: center; color: var(--el-color-warning); }
.dbm-dgrid-ops { display: flex; gap: 4px; justify-content: center; }
.dbm-mono .el-input__inner {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
}

/* ==================== 设计网格「可空」那格的分段单选 ====================
   这格是 ReSwitch（radio 布局）的「是/否」分段。re-kit 给每个分段定了
   min-width: 64px —— 那是独立控件的口径，两枚加起来 128px，塞不进 96px 的
   轨道，于是两枚完全叠在一起（用户截图里看到的就是这个）。
   只在网格里收窄，re-kit 那份全局的 64px 别动（控制台开关要它）。
   类写两遍是为了把特异性抬到 re-kit 那条 (0,3,0) 之上。 */
.dbm-dgrid-row.dbm-dgrid-row :deep(.re-switch-radio),
.dbm-dgrid-row.dbm-dgrid-row :deep(.re-radio-group) {
  width: 100%;
  min-width: 0;
}
.dbm-dgrid-row.dbm-dgrid-row :deep(.re-radio-group .el-radio-button) {
  flex: 1 1 0;
  min-width: 0;
}
.dbm-dgrid-row.dbm-dgrid-row :deep(.re-radio-group .el-radio-button__inner) {
  width: 100%;
  min-width: 0;
  padding: 0 6px;
  font-size: 12px;
}

/* ==================== SQL 编辑器 ==================== */
.dbm-sql-component { margin-top: 2px; }
</style>
