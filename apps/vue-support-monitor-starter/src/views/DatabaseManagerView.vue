<template>
  <div class="dbm">
    <!-- 顶部工具栏 -->
    <div class="dbm-toolbar">
      <div class="dbm-toolbar-left">
        <ReButton size="small" @click="openNewQuery">
          <template #icon><ReIcon name="Edit" /></template>新建查询
        </ReButton>
        <ReButton size="small" @click="openCreateDatabase">
          <template #icon><ReIcon name="FolderAdd" /></template>新建数据库
        </ReButton>
        <ReButton size="small" @click="openCreateTable()">
          <template #icon><ReIcon name="Plus" /></template>新建表
        </ReButton>
        <ReButton size="small" @click="openImportDataFromToolbar">
          <template #icon><ReIcon name="Upload" /></template>导入数据
        </ReButton>
        <ReButton size="small" @click="refreshTree">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
      </div>
      <div class="dbm-toolbar-right">
        <ReSelect v-model="currentDatasourceId" placeholder="选择数据源" size="small" style="width: 200px" @change="onDatasourceChange">
          <ReOption v-for="ds in datasources" :key="ds.id" :label="ds.name" :value="ds.id" />
        </ReSelect>
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
            <ReIcon :name="tab.type === 'query' ? 'Edit' : 'Grid'" size="12" />
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
              <ReSwitch v-model="showTotal" size="small" />
              <span>统计总数</span>
            </label>
            <ReButton size="small" type="primary" icon="Plus" :show-text="true" @click="openAddRowDialog">新增行</ReButton>
            <ReButton size="small" icon="Download" :show-text="true" @click="exportTableCsv">导出 CSV</ReButton>
            <ReButton size="small" icon="RefreshRight" :show-text="true" @click="refreshTableData">刷新</ReButton>
            <ReButton size="small" type="danger" plain icon="Delete" :show-text="true" @click="confirmTruncate(activeTabObj.tableName, activeTabObj.database)">清空表</ReButton>
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
              <ReButton size="small" text :disabled="tableData.page <= 1" @click="onPageChange(tableData.page - 1)">上一页</ReButton>
              <span class="dbm-hint">第 {{ tableData.page }} 页（未统计总数）</span>
              <ReButton size="small" text :disabled="(tableData.rows?.length ?? 0) < tableData.pageSize" @click="onPageChange(tableData.page + 1)">下一页</ReButton>
            </span>
          </div>
          <!-- 过滤条（Navicat 式 WHERE 条件 + 快捷筛选） -->
          <div class="dbm-filter-bar">
            <span class="dbm-filter-label">WHERE</span>
            <ReInput
              v-model="filterWhere"
              size="small"
              class="dbm-mono dbm-filter-input"
              placeholder="例：status = 1 AND name LIKE 'a%'（留空不过滤）"
              clearable
              @keyup.enter="applyFilter"
            />
            <ReButton size="small" type="primary" icon="Search" :show-text="true" @click="applyFilter">应用</ReButton>
            <ReButton size="small" icon="RefreshLeft" :show-text="true" @click="clearFilter">清除</ReButton>
            <span class="dbm-spacer" />
            <span v-if="selection.length" class="dbm-sel-count">已选 {{ selection.length }} 行</span>
            <ReButton
              v-if="selection.length"
              size="small"
              type="danger"
              plain
              icon="Delete"
              :show-text="true"
              @click="deleteSelectedRows"
            >删除选中</ReButton>
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
                  size="small"
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

        <!-- 表设计视图 -->
        <div v-if="activeTabObj && activeTabObj.type === 'design'" class="dbm-design-view">
          <div class="dbm-design-toolbar">
            <span class="dbm-table-name">{{ qualified(activeTabObj) }}</span>
            <div class="dbm-subtabs">
              <span class="dbm-subtab" :class="{ active: designSubTab === 'columns' }" @click="designSubTab = 'columns'">表结构</span>
              <span class="dbm-subtab" :class="{ active: designSubTab === 'indexes' }" @click="openIndexes">索引</span>
              <span class="dbm-subtab" :class="{ active: designSubTab === 'foreignKeys' }" @click="openForeignKeys">外键</span>
            </div>
            <span class="dbm-context-hint">表结构可编辑：新增 / 修改 / 删除列</span>
            <ReButton size="small" @click="reloadDesignArea">
              <template #icon><ReIcon name="Refresh" /></template>刷新
            </ReButton>
          </div>

          <template v-if="designSubTab === 'columns'">
            <div class="dbm-col-actions">
              <ReButton size="small" type="primary" icon="Plus" :show-text="true" @click="openColumnDialog('add')">新增列</ReButton>
              <ReButton
                size="small"
                type="primary"
                plain
                icon="Check"
                :show-text="true"
                :disabled="designDirtyCount === 0"
                @click="saveDesignAll"
              >保存{{ designDirtyCount > 0 ? `（${designDirtyCount}）` : "" }}</ReButton>
              <ReButton size="small" icon="RefreshRight" :show-text="true" @click="reloadDesignArea">刷新</ReButton>
              <span class="dbm-hint">单元格可直接编辑，改动行高亮，保存后生效</span>
            </div>
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
                <ReInput v-model="row.name" size="small" class="dbm-mono" />
                <ReSelect v-model="row.type" size="small" :options="columnTypeOptions.map(t => ({ label: t, value: t }))" />
                <ReInputNumber v-model="row.size" size="small" :min="1" :max="65535" controls-position="right" style="width: 100%" />
                <ReSwitch v-model="row.nullable" size="small" />
                <span class="dbm-dgrid-pk"><ReIcon v-if="row.isPrimaryKey" name="Key" :size="13" /></span>
                <ReInput v-model="row.defaultValue" size="small" class="dbm-mono" placeholder="默认值" />
                <ReInput v-model="row.comment" size="small" placeholder="注释" />
                <span class="dbm-dgrid-ops">
                  <ReButton
                    icon="Check"
                    layout="square"
                    size="small"
                    title="保存该行"
                    :disabled="!isDesignDirty(row)"
                    @click="saveDesignRow(row)"
                  />
                  <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除列" @click="removeColumn(row as never)" />
                </span>
              </div>
              <ReEmpty v-if="designRows.length === 0" description="暂无字段" :image-size="40" />
            </div>
          </template>

          <template v-else-if="designSubTab === 'indexes'">
            <div class="dbm-col-actions">
              <ReButton size="small" type="primary" @click="openIndexDialog">
                <template #icon><ReIcon name="Plus" /></template>新建索引
              </ReButton>
            </div>
            <ReTable
              :data="indexes"
              :columns="indexColumnDefs"
              :loading="indexLoading"
              :pagination="false"
              stripe
              border
              height="calc(100% - 104px)"
            >
              <template #col-actions="{ row }">
                <ReButton size="small" text type="danger" @click="removeIndex(row)">删除</ReButton>
              </template>
            </ReTable>
          </template>

          <!-- 外键（只读，Navicat 外键页签） -->
          <template v-else>
            <div class="dbm-col-actions">
              <ReButton size="small" icon="RefreshRight" :show-text="true" @click="loadForeignKeys">刷新外键</ReButton>
              <span class="dbm-hint">外键由建表 DDL 维护；此处只读展示</span>
            </div>
            <ReTable
              :data="foreignKeys"
              :columns="foreignKeyColumnDefs"
              :loading="fkLoading"
              :pagination="false"
              stripe
              border
              height="calc(100% - 104px)"
            />
          </template>
        </div>

        <!-- SQL 查询视图 -->
        <div v-if="activeTabObj && activeTabObj.type === 'query'" class="dbm-query-view">
          <div class="dbm-query-editor">
            <div class="dbm-query-toolbar">
              <ReButton size="small" type="primary" @click="executeQuery">
                <template #icon><ReIcon name="VideoPlay" /></template>执行 (Ctrl+Enter)
              </ReButton>
              <ReButton size="small" @click="formatSql">
                <template #icon><ReIcon name="MagicStick" /></template>格式化
              </ReButton>
              <ReSelect v-model="activeTabObj.database" placeholder="目标库" size="small" style="width: 200px">
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
              <ReButton
                v-if="queryResult.columns && queryResult.columns.length > 0"
                size="small"
                icon="Download"
                :show-text="true"
                @click="exportQueryCsv"
              >导出 CSV</ReButton>
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
          <div class="dbm-context-divider" />
          <div class="dbm-context-item" @click="renameTable(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="EditPen" :size="14" />重命名表
          </div>
          <div class="dbm-context-item" @click="duplicateTable(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="CopyDocument" :size="14" />复制表
          </div>
          <div class="dbm-context-item" @click="showTableDdl(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Document" :size="14" />查看建表语句
          </div>
          <div class="dbm-context-item" @click="copyText(contextMenu.tableName)">
            <ReIcon name="CopyDocument" :size="14" />复制表名
          </div>
          <div class="dbm-context-divider" />
          <div class="dbm-context-item" @click="openImportDataFor(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Upload" :size="14" />导入数据
          </div>
          <div class="dbm-context-item" @click="exportTableCsvFor(contextMenu.tableName, contextMenu.database)">
            <ReIcon name="Download" :size="14" />导出 CSV
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
          <ReSelect v-model="newDbCharset" style="width: 100%" @change="onCharsetChange">
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
    <ReDialog v-model="importVisible" title="导入数据" width="640px">
      <div class="dbm-create-form">
        <div class="dbm-form-item">
          <label>目标库</label>
          <ReInput :model-value="importDatabase" disabled />
        </div>
        <div class="dbm-form-item">
          <label>目标表</label>
          <ReSelect v-model="importTableName" filterable placeholder="选择表" style="width: 100%">
            <ReOption v-for="t in getTablesForDb(importDatabase)" :key="t.name" :label="t.name" :value="t.name" />
          </ReSelect>
        </div>
        <div class="dbm-form-item">
          <label>数据格式</label>
          <ReSelect v-model="importFormat" style="width: 100%">
            <ReOption label="CSV" value="csv" />
            <ReOption label="JSON 数组" value="json" />
            <ReOption label="SQL 语句" value="sql" />
          </ReSelect>
        </div>
        <div v-if="importFormat === 'csv'" class="dbm-form-item">
          <label>跳过表头</label>
          <ReSwitch v-model="importSkipHeader" />
        </div>
        <div class="dbm-form-item">
          <label>数据内容</label>
          <ReInput
            v-model="importData"
            type="textarea"
            :rows="8"
            :placeholder="importFormat === 'sql' ? '多条 INSERT / UPDATE 语句，以分号分隔' : importFormat === 'json' ? '[{&quot;id&quot;:1,&quot;name&quot;:&quot;a&quot;}]' : '列1,列2,列3\n值1,值2,值3'"
          />
        </div>
      </div>
      <template #footer>
        <ReButton @click="importVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="importing" @click="doImportData">导入</ReButton>
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

  <!-- 新增/修改列弹窗 -->
  <ReDialog v-model="columnDialogVisible" :title="columnDialogMode === 'add' ? '新增列' : '修改列'" width="560px">
    <ReForm label-width="100px">
      <ReFormItem label="列名">
        <ReInput v-model="columnForm.columnName" :disabled="columnDialogMode === 'edit'" placeholder="请输入列名" />
      </ReFormItem>
      <ReFormItem label="类型">
        <ReSelect v-model="columnForm.type" style="width: 100%">
          <ReOption v-for="t in columnTypeOptions" :key="t" :label="t" :value="t" />
        </ReSelect>
      </ReFormItem>
      <ReFormItem v-if="columnForm.type === 'VARCHAR' || columnForm.type === 'DECIMAL'" label="长度">
        <ReInputNumber v-model="columnForm.size" :min="1" :max="65535" style="width: 100%" />
      </ReFormItem>
      <ReFormItem label="可空">
        <ReSwitch v-model="columnForm.nullable" />
      </ReFormItem>
      <ReFormItem label="默认值">
        <ReInput v-model="columnForm.defaultValue" placeholder="留空则不设置默认值" />
      </ReFormItem>
      <ReFormItem label="注释">
        <ReInput v-model="columnForm.comment" placeholder="列注释（可选）" />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="columnDialogVisible = false">取消</ReButton>
      <ReButton type="primary" @click="saveColumn">保存</ReButton>
    </template>
  </ReDialog>

  <!-- 新建索引弹窗 -->
  <ReDialog v-model="indexDialogVisible" title="新建索引" width="520px">
    <ReForm label-width="100px">
      <ReFormItem label="索引名">
        <ReInput v-model="indexForm.indexName" placeholder="请输入索引名" />
      </ReFormItem>
      <ReFormItem label="索引列">
        <ReSelect v-model="indexForm.columns" multiple style="width: 100%" placeholder="可多选">
          <ReOption v-for="c in designColumns" :key="c.name" :label="c.name" :value="c.name" />
        </ReSelect>
      </ReFormItem>
      <ReFormItem label="唯一索引">
        <ReSwitch v-model="indexForm.unique" />
      </ReFormItem>
    </ReForm>
      <template #footer>
        <ReButton @click="indexDialogVisible = false">取消</ReButton>
        <ReButton type="primary" @click="saveIndex">创建</ReButton>
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
  type DbIndexInfo,
} from "../dbManageApi";

const route = useRoute();

/** 后端把 datasourceId=0/null 解析为主数据源，这里把它显式作为下拉首项 */
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
  type: "table" | "design" | "query";
  title: string;
  tableName?: string;
  database?: string;
  sql?: string;
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
    for (const row of rows) {
      const keys = Object.keys(row);
      if (keys.length === 0) continue;
      const wheres = keys.map(k => sqlWhereEq(k, (row as Record<string, unknown>)[k])).join(" AND ");
      await executeDbSql(`DELETE FROM ${tab.tableName} WHERE ${wheres}`, currentDatasourceId.value, tab.database);
    }
    ElMessage.success(`已删除 ${rows.length} 行`);
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

// ==================== 导入数据 ====================
const importVisible = ref(false);
const importTableName = ref("");
const importDatabase = ref("");
const importFormat = ref("csv");
const importData = ref("");
const importSkipHeader = ref(true);
const importing = ref(false);

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
  importFormat.value = "csv";
  importData.value = "";
  importVisible.value = true;
};

/**
 * 工具栏入口：不带参数调用时不能把 MouseEvent 当成表名
 */
const openImportDataFromToolbar = () => openImportData();

/**
 * 右键菜单入口
 * @param tableName 表名，可为空
 * @param database 库名
 */
const openImportDataFor = (tableName: string, database: string) => openImportData(tableName || undefined, database);

const doImportData = async () => {
  if (!importTableName.value) {
    ElMessage.warning("请选择目标表");
    return;
  }
  if (!importData.value.trim()) {
    ElMessage.warning("请输入数据内容");
    return;
  }
  importing.value = true;
  try {
    const statements: string[] = [];
    if (importFormat.value === "sql") {
      for (const raw of importData.value.split(";")) {
        const stmt = raw.trim();
        if (stmt) statements.push(stmt);
      }
    } else if (importFormat.value === "csv") {
      const lines = importData.value.trim().split("\n").map(l => l.trim()).filter(l => l);
      // 首行为表头时按其列名生成 INSERT 列清单（Navicat 行为：列数与表头一致即可，无需覆盖全表列）
      const headerColumns = importSkipHeader.value && lines.length > 0
        ? lines[0].split(",").map(c => c.trim()).filter(c => /^[A-Za-z_][A-Za-z0-9_]*$/.test(c))
        : [];
      const startIdx = importSkipHeader.value ? 1 : 0;
      const values = lines.slice(startIdx).map(line => {
        const fields = line.split(",").map(f => `'${f.trim().replace(/'/g, "''")}'`);
        return `(${fields.join(", ")})`;
      });
      if (values.length > 0) {
        const columnClause = headerColumns.length > 0
          ? ` (${headerColumns.map(c => `\`${c}\``).join(", ")})`
          : "";
        statements.push(`INSERT INTO \`${importTableName.value}\`${columnClause} VALUES ${values.join(", ")}`);
      }
    } else if (importFormat.value === "json") {
      const data = JSON.parse(importData.value);
      if (Array.isArray(data) && data.length > 0) {
        const columns = Object.keys(data[0]);
        const values = data.map(row => {
          const vals = columns.map(col => sqlLiteral(row[col]));
          return `(${vals.join(", ")})`;
        });
        statements.push(`INSERT INTO \`${importTableName.value}\` (${columns.map(c => `\`${c}\``).join(", ")}) VALUES ${values.join(", ")}`);
      }
    }
    if (statements.length === 0) {
      ElMessage.warning("没有解析到可执行的语句，请检查数据内容");
      return;
    }
    for (const stmt of statements) {
      await executeDbSql(stmt, currentDatasourceId.value, importDatabase.value);
    }
    ElMessage.success(`导入成功，共执行 ${statements.length} 条语句`);
    importVisible.value = false;
    openTableData(importTableName.value, importDatabase.value);
  } catch (e) {
    ElMessage.error(`导入失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    importing.value = false;
  }
};

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
/** 设计行：包含原始值快照用于脏检测 */
interface DesignRow {
  originalName: string;
  name: string;
  type: string;
  size: number | null;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: string;
  comment: string;
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

// 外键页签（只读）
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
];

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
const columnTypeOptions = ["VARCHAR", "INT", "BIGINT", "TEXT", "DATETIME", "DECIMAL", "FLOAT", "DOUBLE", "BOOLEAN", "BLOB"];
const columnForm = reactive({ columnName: "", type: "VARCHAR", size: 255, nullable: true, defaultValue: "", comment: "" });
const editingDesignColumn = ref<DbColumnInfo | null>(null);

// 索引新建弹窗
const indexDialogVisible = ref(false);
const indexForm = reactive({ indexName: "", columns: [] as string[], unique: false });

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
    await updateDbCell({
      tableName: tab.tableName,
      column: col,
      newValue,
      primaryKey: pk,
      database: tab.database || activeDatabase.value,
      datasourceId: currentDatasourceId.value,
    });
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
  Object.assign(indexForm, { indexName: "", columns: [] as string[], unique: false });
  indexDialogVisible.value = true;
}

async function saveIndex() {
  const tab = activeTabObj.value;
  if (!tab?.tableName) return;
  if (!indexForm.indexName.trim()) {
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
      unique: indexForm.unique,
      database: tab.database,
      datasourceId: currentDatasourceId.value,
    });
    ElMessage.success("索引已创建");
    indexDialogVisible.value = false;
    loadIndexes();
  } catch (e) {
    ElMessage.error(`创建索引失败: ${String((e as Error)?.message ?? e)}`);
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
function openColumnDialog(mode: "add" | "edit", row?: DbColumnInfo) {
  columnDialogMode.value = mode;
  if (mode === "edit" && row) {
    editingDesignColumn.value = row;
    columnForm.columnName = row.name;
    const m = /^([A-Za-z]+)\s*(?:\(\s*(\d+)\s*\))?/.exec(row.type || "");
    columnForm.type = (m?.[1] || "VARCHAR").toUpperCase();
    columnForm.size = m?.[2] ? Number(m[2]) : 255;
    columnForm.nullable = row.nullable !== false;
    columnForm.defaultValue = row.default ?? "";
    columnForm.comment = row.remark ?? "";
  } else {
    editingDesignColumn.value = null;
    Object.assign(columnForm, { columnName: "", type: "VARCHAR", size: 255, nullable: true, defaultValue: "", comment: "" });
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
  const payload = {
    columnName: columnForm.columnName.trim(),
    type: columnForm.type,
    size: columnForm.size,
    nullable: columnForm.nullable,
    defaultValue: columnForm.defaultValue || undefined,
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

async function loadDatasources() {
  try {
    const list = await fetchDataSources();
    const jdbc = list.filter(d => d.type === "jdbc");
    datasources.value = [DEFAULT_DATASOURCE, ...jdbc];
    const requested = Number(route.query.datasourceId);
    if (Number.isFinite(requested) && requested > 0) {
      if (jdbc.some(d => d.id === requested)) {
        currentDatasourceId.value = requested;
      } else {
        ElMessage.warning(`数据源 #${requested} 未登记或不是 JDBC 类型，已改用默认主数据源`);
      }
    }
  } catch (e) {
    console.error("加载数据源失败", e);
    datasources.value = [DEFAULT_DATASOURCE];
  }
  await loadTree();
}

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
    Object.assign(tableData, result);
    if (!showTotal.value) {
      tableData.total = -1;
    }
    void loadColumnComments(tab);
    loadPkInfo(tab);
  } catch (e) {
    ElMessage.error(`加载表数据失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    tableLoading.value = false;
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
 * 复制文本到剪贴板
 * @param text 文本
 */
async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制");
  } catch {
    ElMessage.warning("复制失败");
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

/** 导出查询结果为 CSV */
function exportQueryCsv(): void {
  const cols = queryResult.columns ?? [];
  const rows = queryResult.rows ?? [];
  if (!cols.length) {
    ElMessage.warning("没有可导出的查询结果");
    return;
  }
  const lines = [cols.join(",")];
  for (const row of rows) {
    lines.push(cols.map(c => `"${String((row as Record<string, unknown>)[c] ?? "").replace(/"/g, '""')}"`).join(","));
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `query-result-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success(`已导出 ${rows.length} 行`);
}

/**
 * 导出指定表为 CSV（最多 1000 行，不依赖当前页签）
 * @param tableName 表名
 * @param database  所属库
 */
async function exportTableCsvFor(tableName: string, database?: string): Promise<void> {
  if (!tableName) return;
  try {
    const result = await fetchTableData(tableName, 1, 1000, undefined, undefined, currentDatasourceId.value, database);
    const cols = result?.columns ?? [];
    const lines = [cols.join(",")];
    for (const row of result?.rows ?? []) {
      lines.push(cols.map(col => `"${String((row as Record<string, unknown>)[col] ?? "").replace(/"/g, '""')}"`).join(","));
    }
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${tableName}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    ElMessage.success(`已导出 ${(result?.rows ?? []).length} 行（上限 1000）`);
  } catch (e) {
    ElMessage.error(`导出失败: ${String((e as Error)?.message ?? e)}`);
  }
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

/* 工具条 */
.dbm-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}
.dbm-toolbar-left { display: flex; gap: 8px; flex-wrap: wrap; }

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
.dbm-table-name { font-weight: 700; font-size: 14px; color: var(--el-text-color-primary); }

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
