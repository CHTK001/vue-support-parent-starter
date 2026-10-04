<template>
  <div class="dbm" :class="{ 'is-embedded': embedded }">
    <!-- 顶部工具栏
         刻意**只有**数据源切换与一个刷新：新建查询 / 新建数据库 / 新建表 / 导入数据
         四个动作已下沉到右键菜单（表 / 库 / 空白 三套），与 Navicat 的操作面一致。
         5 个带文字的按钮占了整行高度却很少被点，压缩后主内容区能多出约 36px。 -->
    <div class="dbm-toolbar">
      <div class="dbm-toolbar-left">
        <span class="dbm-toolbar-hint">右键表 / 库 / 空白处可执行新建、导入导出等操作</span>
      </div>
      <div class="dbm-toolbar-right">
        <ReButton layout="square" icon="Refresh" tip="刷新连接树" @click="refreshTree" />
        <!-- 内嵌模式不显示数据源下拉：宿主页签已经表明当前浏览的是哪个数据源，
             再放一个下拉会和宿主左栏的选择打架（两个可改同一个值）。 -->
        <template v-if="!embedded">
          <!-- 用 watch 而非 @change：ReSelect 不发 change 事件 -->
          <ReSelect v-model="currentDatasourceId" placeholder="选择数据源" style="width: 200px">
            <ReOption v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
          </ReSelect>
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
                <span class="dbm-tree-label">{{ db }}</span>
              </div>

              <!-- 表 / 视图（挂在本库之下，Navicat 式分组） -->
              <div v-if="expandedNodes.has('db:' + db)" class="dbm-tree-children">
                <div v-if="tablesOf(db).length" class="dbm-tree-group">表（{{ tablesOf(db).length }}）</div>
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

                <div v-if="viewsOf(db).length" class="dbm-tree-group">视图（{{ viewsOf(db).length }}）</div>
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
        <!-- 标签页 -->
        <div class="dbm-tabs" v-if="tabs.length > 0">
          <div
            v-for="tab in tabs"
            :key="tab.id"
            class="dbm-tab"
            :class="{ active: activeTab === tab.id }"
            @click="selectTab(tab.id)"
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
            <!-- 行显示模式：数据 / 数据+注释 -->
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
            <label class="dbm-switch">
              <ReSwitch v-model="showTotal" />
              <span>统计总数</span>
            </label>
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
          <!-- 过滤条（Navicat 式 WHERE 条件 + 快捷筛选） -->
          <div class="dbm-filter-bar">
            <span class="dbm-filter-label">WHERE</span>
            <ReInput
              v-model="filterWhere"

              class="dbm-mono dbm-filter-input"
              placeholder="例：status = 1 AND name LIKE 'a%'（留空不过滤）"
              clearable
              @keyup.enter="applyFilter"
            />
            <ReButton layout="square" type="primary" icon="Search" tip="应用过滤（Enter）" @click="applyFilter" />
            <ReButton layout="square" icon="RefreshLeft" tip="清除过滤" @click="clearFilter" />
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
          <!-- 行/单元格操作走右键菜单（无操作列） -->
          <ReTable
            :data="tableData.rows"
            :columns="tableColumns"
            :row-key="gridRowKey"
            :loading="tableLoading"
            :pagination="false"
            :border="true"
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
                <ReInputNumber v-model="row.size" :min="1" :max="65535" controls-position="right" style="width: 100%" />
                <ReSwitch v-model="row.nullable" />
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
              <ReButton layout="square" icon="MagicStick" tip="格式化 SQL" @click="formatSql" />
              <ReSelect v-model="activeTabObj.database" placeholder="目标库" style="width: 200px">
                <ReOption v-for="db in databases" :key="db" :label="db" :value="db" />
              </ReSelect>
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
              height="calc(100% - 40px)"
            />
            <ReEmpty v-else description="执行 SQL 后显示结果" />
          </div>
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

    <!-- 新建表弹窗 -->
    <ReDialog v-model="createTableVisible" title="新建表" width="600px">
      <div class="dbm-create-form">
        <div class="dbm-form-item">
          <label>目标库</label>
          <ReInput :model-value="newTableDatabase" disabled />
        </div>
        <div class="dbm-form-item">
          <label>表名</label>
          <ReInput v-model="newTableName" placeholder="请输入表名" />
        </div>
        <div class="dbm-form-item">
          <label>表注释</label>
          <ReInput v-model="newTableRemark" placeholder="请输入表注释" />
        </div>
        <div class="dbm-form-item">
          <label>初始字段</label>
          <ReInput v-model="newTableFields" type="textarea" :rows="4" placeholder="id BIGINT PRIMARY KEY AUTO_INCREMENT,&#10;name VARCHAR(255) NOT NULL,&#10;created_at DATETIME" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="createTableVisible = false">取消</ReButton>
        <ReButton type="primary" @click="confirmCreateTable">创建</ReButton>
      </template>
    </ReDialog>

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
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from "vue";
import { EditPen, CopyDocument, Delete, RefreshRight } from "@element-plus/icons-vue";
import DbSqlEditor from "../components/DbSqlEditor.vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchDbDatabases,
  fetchDbTables,
  fetchTableColumns,
  fetchTableData,
  fetchTableDdl,
  fetchForeignKeys,
  executeDbSql,
  dropDbTable,
  createDbDatabase,
  dropDbDatabase,
  type DbTableInfo,
  type DbColumnInfo,
  type DbTableDataResult,
  type DbQueryResult,
  type DbForeignKeyInfo,
} from "../monitorApi";
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
} from "../dbManageApi";

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
      ElMessage.error(`读取定义失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("定义不能为空");
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
    ElMessage.success("已保存");
    objectDirty.value = false;
    if (tab.database) {
      await loadDbObjects(tab.database);
      await loadDbObjectList(tab.database, tab.objectCategory);
    }
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success("已删除");
    if (tab.database) {
      await loadDbObjects(tab.database);
      await loadDbObjectList(tab.database, tab.objectCategory);
    }
    closeTab(tab.id);
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
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
      ElMessage.error(`加载字段失败: ${String((e as Error)?.message ?? e)}`);
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
  type: "table" | "design" | "query" | "object";
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
const tableData = reactive<DbTableDataResult>({ columns: [], rows: [], total: 0, page: 1, pageSize: 50 });

// ==================== 数据视图：表头/行显示模式 + 总数开关 ====================
/** 表头显示模式 */
const HEADER_MODES = [
  { label: "字段", value: "name" as const },
  { label: "注释", value: "comment" as const },
  { label: "字段+注释", value: "both" as const },
];
const headerMode = ref<"name" | "comment" | "both">("name");

/** 行显示模式 */
const ROW_MODES = [
  { label: "数据", value: "data" as const },
  { label: "数据+注释", value: "data-comment" as const },
];
const rowMode = ref<"data" | "data-comment">("data");

/** 是否统计总数（关闭后跳过 COUNT，走「上一页/下一页」模式） */
const showTotal = ref(localStorage.getItem("dbm-show-total") !== "false");
/** 列注释映射（表头/行显示模式） */
const columnComments = reactive<Record<string, string>>({});

/** WHERE 过滤条件（已应用值） */
const filterWhere = ref("");
/** 当前排序（服务器端） */
const sortState = reactive<{ prop: string; order: "ASC" | "DESC" | "" }>({ prop: "", order: "" });

/**
 * 清空排序与过滤条件。
 *
 * <p>这两个是**共享状态**，不是页签私有：切表时若不清，会把上一张表的 {@code ORDER BY} 列名
 * 发给新表。新表没有该列时后端直接报错，而 {@code loadTableData} 的 catch 只弹一条提示、
 * **不会清空 {@code tableData}**，于是网格静默保留上一张表的列与数据——现象就是
 * 「页签已切到新表，表头却还是旧表的列」，并连带 {@code pkColumns} 也是旧的，
 * 造成「主键列不可编辑」误判。2026-10-02 JDBC 工作台验收实测复现（无主键表 + score 排序）。</p>
 */
function resetTableQueryState() {
  sortState.prop = "";
  sortState.order = "";
  filterWhere.value = "";
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
  void loadTableData(tab, 1);
}

/** 清除 WHERE 过滤 */
function clearFilter(): void {
  filterWhere.value = "";
  applyFilter();
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
      ElMessage.warning(`已删除 ${affected} 行；请求的 ${rows.length} 行中有 ${rows.length - affected} 行未命中（可能已被他人删除）`);
    } else {
      ElMessage.success(`已删除 ${affected} 行`);
    }
    selection.value = [];
    await refreshTableData();
  } catch (e) {
    ElMessage.error(`批量删除失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success("已插入副本行");
    await refreshTableData();
  } catch (e) {
    ElMessage.error(`插入副本失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("请输入数据库名称");
    return;
  }
  const name = newDbName.value.trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(name)) {
    ElMessage.warning("数据库名只能由字母、数字和下划线组成，且不能以数字开头");
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
    ElMessage.success("数据库创建成功");
    createDbVisible.value = false;
    await loadTree();
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("请先在左侧选择一个数据库");
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
    ElMessage.warning(`读取目标表结构失败：${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("请先选择文件");
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
    ElMessage.error(`解析失败: ${String((e as Error)?.message ?? e)}`);
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
  { prop: "__src", label: "源列 → 目标列", minWidth: 230, slot: "mapping", fixed: "left" },
  { prop: "__sample", label: "示例值", minWidth: 180, showOverflowTooltip: true },
]);

/**
 * 执行导入。
 */
async function doImportData(): Promise<void> {
  if (!importTableName.value) {
    ElMessage.warning("请选择目标表");
    return;
  }
  if (!importFile.value) {
    ElMessage.warning("请选择要导入的文件");
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
      ElMessage.warning("请至少配置一个字段映射");
      return;
    }
    if (importMappingConflict.value) {
      ElMessage.warning(`字段映射有冲突：${importMappingConflict.value}`);
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
      ElMessage.warning(`导入完成：成功 ${done} 行，跳过 ${result.skipped} 行（见下方错误报告）`);
    } else {
      ElMessage.success(`导入完成：成功 ${done} 行`);
    }
    openTableData(importTableName.value, importDatabase.value);
  } catch (e) {
    ElMessage.error(`导入失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("请先选择要导出的表");
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
      ElMessage.warning("没有可导出的内容");
      return;
    }
    downloadText(result.fileName || `${exportTable.value}.${exportFormat.value}`, result.content,
      EXPORT_MIME[exportFormat.value] ?? "text/plain");
    ElMessage.success(
      `已导出 ${result.rowCount} 行${result.truncated ? `（达到上限 ${exportLimit.value} 行，已截断）` : ""}`
    );
    exportVisible.value = false;
  } catch (e) {
    ElMessage.error(`导出失败: ${String((e as Error)?.message ?? e)}`);
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
      ElMessage.success('新增行成功');
    } else {
      // 编辑行：构建 UPDATE SQL（无主键元数据时退化为全字段等值定位）
      const sets = Object.keys(rowForm.value).map(k => `${k} = ${sqlLiteral(rowForm.value[k])}`);
      const wheres = Object.keys(editingRow.value || {}).map(k => sqlWhereEq(k, editingRow.value?.[k]));
      const sql = `UPDATE ${tableName} SET ${sets.join(', ')} WHERE ${wheres.join(' AND ')}`;
      const res = await executeDbSql(sql, currentDatasourceId.value, database);
      if (res?.affectedRows === 0) {
        ElMessage.warning('未匹配到任何行，数据可能已被其他会话修改，请刷新后重试');
      } else {
        ElMessage.success('更新行成功');
      }
    }
    rowDialogVisible.value = false;
    await refreshTableData();
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
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
      ElMessage.warning('该行无可定位字段，已取消删除');
      return;
    }
    const wheres = keys.map(k => sqlWhereEq(k, row[k])).join(' AND ');
    const sql = `DELETE FROM ${tableName} WHERE ${wheres}`;
    const res = await executeDbSql(sql, currentDatasourceId.value, activeTabObj.value.database || activeDatabase.value);
    if (res?.affectedRows === 0) {
      ElMessage.warning('未匹配到任何行，数据可能已被其他会话修改，请刷新后重试');
    } else {
      ElMessage.success('删除行成功');
    }
    await refreshTableData();
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

const exportTableCsv = () => {
  if (tableData.rows.length === 0) {
    ElMessage.warning('没有数据可导出');
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
  ElMessage.success('导出成功');
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
type Column = { prop: string; label: string; width?: number; minWidth?: number; showOverflowTooltip?: boolean; slot?: string; fixed?: string; sortable?: boolean | "custom"; formatter?: (row: any) => string };
const tableColumns = computed<Column[]>(() =>
  // 表头按显示模式取「字段 / 注释 / 字段+注释」；行操作统一走右键菜单，不设操作列
  // sortable= custom：排序在服务端执行（大数据表整表排序），由 sort-change 触发重载
  tableData.columns.map(col => ({
    prop: col,
    label: headerLabel(col),
    minWidth: 130,
    showOverflowTooltip: true,
    sortable: "custom" as const,
  })),
);

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
    ElMessage.success(`字段 ${row.name} 已保存`);
    await loadTableDesign(tab);
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success(`已保存 ${dirty.length} 个字段变更`);
    await loadTableDesign(tab);
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
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
  { prop: "__actions", label: "操作", width: 90, slot: "actions", fixed: "right" },
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
  { prop: "__actions", label: "操作", width: 80, slot: "fk-actions", fixed: "right" },
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
    ElMessage.warning(`读取引用表结构失败：${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("请填写完整的约束名、本表列、引用表与引用列");
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
    ElMessage.success("外键已创建");
    fkDialogVisible.value = false;
    await loadForeignKeys();
  } catch (e) {
    ElMessage.error(`新增外键失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("该外键没有名称，无法删除");
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除外键「${row.fkName}」？`, "确认删除", { type: "warning" });
  } catch {
    return;
  }
  try {
    await dropDbForeignKey(tab.tableName, row.fkName, currentDatasourceId.value, tab.database);
    ElMessage.success("已删除");
    await loadForeignKeys();
  } catch (e) {
    ElMessage.error(`删除外键失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.error(`加载外键失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    fkLoading.value = false;
  }
}

// 列编辑弹窗
const columnDialogVisible = ref(false);
const columnDialogMode = ref<"add" | "edit">("add");

/**
 * 列类型全集（按类别分组，与后端 `DbColumnDef.SUPPORTED_TYPES` 对齐）。
 *
 * <p>此前只有 10 种，用户想建 ENUM / JSON / MEDIUMINT 时根本选不到，
 * 只能去别处改结构。按类别分组是为了下拉可读，不是为了分批请求。</p>
 */
const COLUMN_TYPE_GROUPS: Array<{ label: string; types: string[] }> = [
  { label: "整数", types: ["TINYINT", "SMALLINT", "MEDIUMINT", "INT", "INTEGER", "BIGINT"] },
  { label: "布尔 / 位", types: ["BIT", "BOOL", "BOOLEAN"] },
  { label: "定点 / 浮点", types: ["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "DOUBLE PRECISION"] },
  { label: "字符", types: ["CHAR", "VARCHAR", "TINYTEXT", "TEXT", "MEDIUMTEXT", "LONGTEXT"] },
  { label: "二进制", types: ["BINARY", "VARBINARY", "TINYBLOB", "BLOB", "MEDIUMBLOB", "LONGBLOB"] },
  { label: "日期时间", types: ["DATE", "TIME", "DATETIME", "TIMESTAMP", "YEAR"] },
  { label: "枚举 / 集合", types: ["ENUM", "SET"] },
  { label: "JSON", types: ["JSON"] },
];
const columnTypeOptions = COLUMN_TYPE_GROUPS.flatMap(g => g.types);

/**
 * 列类型下拉项（ReSelect 用 `group` 字段做分组标题，不是 el-option-group）。
 *
 * <p>分组是可计算属性而不是常量：`openColumnDialog` 在遇到后端类型表以外的类型时
 * 会往分组里补一条「其他」，若下拉项是常量快照就看不到新补的项。</p>
 */
const columnTypeSelectOptions = computed(() =>
  COLUMN_TYPE_GROUPS.flatMap(g => g.types.map(t => ({ label: t, value: t, group: g.label })))
);

/** 允许 UNSIGNED 的类型（与后端 UNSIGNED_ALLOWED 一致，用于置灰而不是让用户试错） */
const UNSIGNED_ALLOWED = new Set([
  "TINYINT", "SMALLINT", "MEDIUMINT", "INT", "INTEGER", "BIGINT",
  "DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL", "DOUBLE PRECISION", "BIT", "YEAR",
]);
/** 需要长度输入的类型 */
const SIZE_REQUIRED = new Set(["CHAR", "VARCHAR", "BINARY", "VARBINARY", "DECIMAL", "NUMERIC"]);
/** 允许小数位的类型 */
const SCALE_ALLOWED = new Set(["DECIMAL", "NUMERIC", "FLOAT", "DOUBLE", "REAL"]);
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
function setEditingCellValue(v: string): void {
  if (editingCell.value) {
    editingCell.value.value = v;
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
    ElMessage.info("主键列不可编辑");
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
    ElMessage.warning("该表无主键，无法定位更新");
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
      ElMessage.warning(`未找到要更新的行（主键 ${JSON.stringify(pk)}），可能已被他人删除，请刷新后重试`);
      refreshTableData();
      return;
    }
    ElMessage.success(`已更新 ${col}`);
    row[col] = newValue;
    loadPkInfo(tab);
    refreshTableData();
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
    refreshTableData();
  }
}

/** 清空表：二次确认后 TRUNCATE/DELETE */
async function confirmTruncate(tableName?: string, database?: string) {
  if (!tableName) {
    ElMessage.warning("请先选择一个表");
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
    ElMessage.success("表已清空");
    const tab = activeTabObj.value;
    if (tab?.type === "table" && tab.tableName === tableName) {
      refreshTableData();
    }
  } catch (e) {
    ElMessage.error(`清空失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.error(`加载索引失败: ${String((e as Error)?.message ?? e)}`);
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
function onColumnCharsetChange(charset: string | undefined) {
  if (!charset) {
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
function onOptionsCharsetChange(charset: string | undefined) {
  if (!charset) return;
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
    ElMessage.warning("请输入索引名");
    return;
  }
  if (indexForm.columns.length === 0) {
    ElMessage.warning("请选择至少一列");
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
    ElMessage.success(indexForm.primary ? "已设为主键" : "索引已创建");
    indexDialogVisible.value = false;
    await loadIndexes();
    await loadTableDesign(tab);
    loadPkInfo(tab);
  } catch (e) {
    ElMessage.error(`${indexForm.primary ? "设置主键" : "创建索引"}失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.error(`读取表属性失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.info("没有改动");
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
    ElMessage.success("表属性已保存");
    optionsDialogVisible.value = false;
    // 表属性变了会连带影响行的存储格式，重新读一次设计视图让用户看到最终态
    await loadTableDesign(tab);
  } catch (e) {
    ElMessage.error(`保存表属性失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success(clearing ? "主键已清除" : "主键已保存");
    pkDialogVisible.value = false;
    await loadTableDesign(tab);
    loadPkInfo(tab);
  } catch (e) {
    ElMessage.error(`设置主键失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success("索引已删除");
    loadIndexes();
  } catch (e) {
    ElMessage.error(`删除索引失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("请输入列名");
    return;
  }
  // 前端先做一遍与后端同口径的校验：目的是给出**就地**提示，
  // 而不是让用户发一次请求、再从内核报错里读懂自己填错了什么。
  if (columnNeedsSize.value && !columnForm.size) {
    ElMessage.warning(`${columnForm.type} 必须指定长度`);
    return;
  }
  if (columnIsEnum.value && parseEnumValues().length === 0) {
    ElMessage.warning(`${columnForm.type} 必须至少配置一个取值`);
    return;
  }
  if (columnForm.autoIncrement && columnForm.nullable) {
    ElMessage.warning("自动递增的列不能可空");
    return;
  }
  if (columnForm.unsigned && !columnAllowsUnsigned.value) {
    ElMessage.warning(`${columnForm.type} 不支持无符号`);
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
      ElMessage.success("列已新增");
    } else {
      await modifyDbColumn(tab.tableName, columnForm.columnName.trim(), payload);
      ElMessage.success("列已修改");
    }
    columnDialogVisible.value = false;
    await loadTableDesign(tab);
    loadPkInfo(tab);
    refreshTableData();
  } catch (e) {
    ElMessage.error(`保存列失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success("列已删除");
    await loadTableDesign(tab);
    refreshTableData();
  } catch (e) {
    ElMessage.error(`删除列失败: ${String((e as Error)?.message ?? e)}`);
  }
}

// SQL 查询
const queryResult = reactive<DbQueryResult>({});
const queryColumns = computed(() =>
  (queryResult.columns || []).map(col => ({ prop: col, label: col, minWidth: 120, showOverflowTooltip: true }))
);

// 右键菜单
const contextMenu = reactive({ visible: false, x: 0, y: 0, tableName: "", database: "" });

// 新建表
const createTableVisible = ref(false);
const newTableName = ref("");
const newTableRemark = ref("");
const newTableFields = ref("id BIGINT PRIMARY KEY AUTO_INCREMENT,\nname VARCHAR(255) NOT NULL,\ncreated_at DATETIME");
/** 新建表的目标库，来自左侧树选中节点 */
const newTableDatabase = ref("");

// 初始化
onMounted(async () => {
  await loadDatasources();
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
    const requested = resolveDatasourceId();
    if (requested > 0) {
      if (jdbc.some(d => d.id === requested)) {
        currentDatasourceId.value = requested;
      } else {
        // 内嵌模式不做弹窗：宿主的左栏可能选中了 Redis/Nginx 这类非 JDBC 数据源，
        // 弹一次「已改用默认主数据源」会把用户从这个页签里推走，体验比留空更差。
        if (!embedded) {
          ElMessage.warning(`数据源 #${requested} 未登记或不是 JDBC 类型，已改用默认主数据源`);
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

async function loadTree() {
  try {
    databases.value = await fetchDbDatabases(currentDatasourceId.value);
    if (databases.value.length > 0) {
      expandedNodes.value.add("db:" + databases.value[0]);
      await loadTables(databases.value[0]);
    }
  } catch (e) {
    ElMessage.error(`加载数据库树失败: ${String((e as Error)?.message ?? e)}`);
  }
}

async function loadTables(db: string) {
  try {
    tablesByDb[db] = await fetchDbTables(currentDatasourceId.value, db);
    activeDatabase.value = db;
  } catch (e) {
    ElMessage.error(`加载 ${db} 表列表失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("请先在左侧选择一个表");
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
    ElMessage.warning("请先在左侧选择一个表");
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
      ElMessage.error(`加载表数据失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.error(`加载表结构失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    designLoading.value = false;
  }
}

async function executeQuery() {
  const tab = activeTabObj.value;
  if (!tab?.sql) return;
  Object.assign(queryResult, { columns: [], rows: [], rowCount: 0, truncated: false, affectedRows: undefined, message: undefined });
  try {
    const result = await executeDbSql(tab.sql, currentDatasourceId.value, tab.database || activeDatabase.value || undefined);
    Object.assign(queryResult, result);
  } catch (e) {
    queryResult.message = "执行失败: " + String((e as Error)?.message ?? e);
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
  activeDatabase.value = database;
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
  activeDatabase.value = database;
}

function onSidebarContextMenu(e: MouseEvent) {
  contextMenu.visible = true;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.tableName = "";
  contextMenu.database = "";
}

function closeContextMenu() {
  contextMenu.visible = false;
}

/** 右键菜单估算高度（项高 32 + 上下内边距 + 按节点类型的分割线） */
function menuEstimatedHeight(): number {
  const count = contextMenu.tableName ? 11 : contextMenu.database ? 5 : 4;
  const dividers = contextMenu.tableName ? 4 : contextMenu.database ? 2 : 1;
  return count * 32 + dividers * 11 + 10;
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

function openCreateTable(database?: string) {
  newTableDatabase.value = database || activeDatabase.value;
  if (!newTableDatabase.value) {
    ElMessage.warning("请先在左侧选择一个数据库");
    return;
  }
  newTableName.value = "";
  newTableRemark.value = "";
  createTableVisible.value = true;
}

async function confirmCreateTable() {
  const name = newTableName.value.trim();
  if (!name) {
    ElMessage.warning("请输入表名");
    return;
  }
  let sql = `CREATE TABLE \`${name}\` (\n${newTableFields.value}\n)`;
  if (newTableRemark.value) {
    sql += ` COMMENT='${newTableRemark.value.replace(/'/g, "''")}'`;
  }
  try {
    await executeDbSql(sql, currentDatasourceId.value, newTableDatabase.value);
    ElMessage.success(`表 ${name} 创建成功`);
    createTableVisible.value = false;
    await loadTables(newTableDatabase.value);
  } catch (e) {
    ElMessage.error(`创建表失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success(`表 ${tableName} 已删除`);
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
    ElMessage.error(`删除表失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.success(`数据库 ${database} 已删除`);
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
    ElMessage.error(`删除数据库失败: ${String((e as Error)?.message ?? e)}`);
  }
}

// ==================== Navicat 风格辅助动作 ====================
/** 总数开关：切换后按新模式重载当前表 */
watch(showTotal, value => {
  localStorage.setItem("dbm-show-total", String(value));
  const tab = activeTabObj.value;
  if (tab?.type === "table") {
    tableData.page = 1;
    void loadTableData(tab, 1);
  }
});

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
      ElMessage.success("已复制");
      return;
    } catch {
      // 权限被拒或非安全上下文：走下面的兜底
    }
  }
  if (legacyCopy(text)) {
    ElMessage.success("已复制");
    return;
  }
  ElMessage.warning("复制失败，请手动选中文本复制");
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
    await executeDbSql(`ALTER TABLE \`${tableName}\` RENAME TO \`${name}\``, currentDatasourceId.value, db);
    ElMessage.success(`表已重命名为 ${name}`);
    tabs.value = tabs.value.filter(t => !(t.tableName === tableName && (t.database || "") === (db || "")));
    if (!tabs.value.some(t => t.id === activeTab.value)) {
      activeTab.value = tabs.value[0]?.id || "";
    }
    await loadTables(db);
  } catch (e) {
    ElMessage.error(`重命名失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.error(`复制表失败: ${String((lastError as Error)?.message ?? lastError)}`);
    return;
  }
  ElMessage.success(`已复制为 ${name}`);
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
    ElMessage.error(`获取建表语句失败: ${String((e as Error)?.message ?? e)}`);
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
    ElMessage.warning("没有可导出的查询结果");
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
  ElMessage.success(`已导出 ${rows.length} 行`);
  // 复位成空：否则连续导出同一格式第二次是同值，change 不再触发
  queryExportFormat.value = "";
}

onMounted(() => {
  document.addEventListener("click", closeContextMenu);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", closeContextMenu);
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

/* 工具条：动作已下沉到右键，这里只留提示 + 数据源切换 + 刷新，
   因此压到 6px 内边距、取消圆角与阴影，把纵向空间让给主内容区。 */
.dbm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 4px);
}
.dbm-toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.dbm-toolbar-hint { font-size: 12px; color: var(--el-text-color-placeholder); }
/* 右侧：数据源下拉与刷新按钮之间不留多余间距 */
.dbm-toolbar-right { display: flex; align-items: center; gap: 8px; }

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
.dbm-result-header { font-size: 12.5px; color: var(--el-text-color-secondary); }
.dbm-result-message { color: var(--el-color-success); }

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

/* 过滤条（Navicat WHERE + 批量操作） */
.dbm-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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
.dbm-filter-input { width: 420px; max-width: 46vw; }
.dbm-sel-count { font-size: 12.5px; color: var(--el-text-color-secondary); }

/* 树分组标题（表 / 视图） */
.dbm-tree-group {
  padding: 8px 10px 2px 22px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--el-text-color-placeholder);
}
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
  grid-template-columns: 44px minmax(150px, 1.2fr) 130px 110px 70px 56px minmax(120px, 1fr) minmax(150px, 1.2fr) 92px;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  min-width: 1080px;
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

/* ==================== SQL 编辑器 ==================== */
.dbm-sql-component { margin-top: 2px; }
</style>
