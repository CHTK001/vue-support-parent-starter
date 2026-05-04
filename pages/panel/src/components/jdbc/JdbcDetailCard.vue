<template>
  <section class="detail-shell">
    <ScLayout
      v-model="railTabValue"
      class="detail-layout"
      rail-close-button-mode="always"
      :rail-round="railRound"
      :rail-tabs="railTabs"
      @tab-remove="handleRailTabRemove($event.name)"
    >
      <template #default>
        <div class="detail-main">
          <section
            v-if="activeWorkbenchTab"
            :key="`workbench-${activeWorkbenchTab.tabId}-${activeWorkbenchTab.tabType}`"
            ref="documentPaperRef"
            class="workbench-shell"
          >
            <header class="workbench-head">
          <div class="workbench-head__title">
            <small>{{ workbenchHeaderLabel }}</small>
            <strong>{{ activeWorkbenchTab.tabName }}</strong>
            <span>{{ tablePath }}</span>
          </div>

          <div
            v-if="activeWorkbenchTab.tabType === 'table-edit'"
            :key="`workbench-tools-${activeWorkbenchTab.tabId}-table-edit`"
            class="workbench-head__tools"
          >
            <div class="toolbar-segment" role="tablist" aria-label="设计表分组">
              <button
                v-for="item in editSectionOptions"
                :key="item.value"
                type="button"
                class="toolbar-segment__item"
                :class="{ 'is-active': editSection === item.value }"
                @click="editSection = item.value"
              >
                {{ item.label }}
              </button>
            </div>
            <ElTooltip content="复制当前 DDL">
              <ElButton
                circle
                :icon="DocumentCopy"
                @click="handleCopyEditDdl"
              />
            </ElTooltip>
            <ElTooltip content="复制变更 SQL">
              <ElButton
                circle
                :disabled="!activeAlterSql"
                :icon="CopyDocument"
                @click="handleCopyAlterSql"
              />
            </ElTooltip>
            <ElTooltip content="写入 SQL 工作区">
              <ElButton circle :icon="Promotion" @click="handleUseEditSql" />
            </ElTooltip>
            <ElTooltip content="保存变更">
              <ElButton
                circle
                type="primary"
                :disabled="!activeAlterSql"
                :icon="VideoPlay"
                @click="handleRunAlterSql"
              />
            </ElTooltip>
          </div>
          <div
            v-else-if="activeWorkbenchTab.tabType === 'table'"
            :key="`workbench-tools-${activeWorkbenchTab.tabId}-table`"
            class="workbench-head__tools"
          >
            <div class="toolbar-segment" role="tablist" aria-label="工作台视图">
              <button
                v-for="item in workbenchViewOptions"
                :key="item.value"
                type="button"
                class="toolbar-segment__item"
                :class="{ 'is-active': tableView === item.value }"
                @click="tableView = item.value"
              >
                {{ item.label }}
              </button>
            </div>
            <ElTooltip
              v-if="activeDataDirtyCount"
              content="保存修改 (Ctrl+S)"
            >
              <ElButton
                circle
                type="primary"
                :icon="FolderChecked"
                @click="handleSaveTableChanges"
              />
            </ElTooltip>
            <ElTooltip content="刷新当前表数据">
              <ElButton
                circle
                :icon="RefreshRight"
                @click="handleRefreshActiveTable"
              />
            </ElTooltip>
          </div>
          <div
            v-else-if="activeWorkbenchTab.tabType === 'database-document'"
            :key="`workbench-tools-${activeWorkbenchTab.tabId}-database-document`"
            class="workbench-head__tools"
          >
            <ScTag class="toolbar-chip" effect="plain">
              表 {{ activeWorkbenchTab.databaseDocument?.panelTableCount || 0 }}
            </ScTag>
            <ScTag class="toolbar-chip" effect="plain">
              Schema
              {{ activeWorkbenchTab.databaseDocument?.panelSchemaCount || 0 }}
            </ScTag>
            <ElButton
              :icon="Download"
              @click="handleExportMarkdown"
            >
              MD
            </ElButton>
            <ElButton size="small" :icon="Download" @click="handleExportWord">
              DOCX
            </ElButton>
            <ElButton size="small" :icon="Download" @click="handleExportPdf">
              PDF
            </ElButton>
          </div>
        </header>

        <div class="workbench-body">
          <template v-if="activeWorkbenchTab.tabType === 'account'">
            <div class="workbench-panel">
              <div class="account-summary-grid">
                <article class="summary-card">
                  <small>账号总数</small>
                  <strong>{{ activeAccounts.length }}</strong>
                </article>
                <article class="summary-card">
                  <small>授权语句</small>
                  <strong>{{ activeGrantCount }}</strong>
                </article>
                <article class="summary-card">
                  <small>Host 数量</small>
                  <strong>{{ activeAccountHosts.length }}</strong>
                </article>
              </div>
              <div class="account-layout">
                <div class="account-table-shell">
                  <ElTable
                    :data="activeAccounts"
                    border
                    height="100%"
                    @row-click="handleAccountRowClick"
                  >
                    <ElTableColumn label="账号" min-width="200">
                      <template #default="{ row }">
                        <div
                          class="account-cell"
                          :class="{
                            'account-cell--active':
                              buildAccountKey(row) === activeSelectedAccountKey,
                          }"
                        >
                          <strong>{{ row.panelAccountName || "-" }}</strong>
                          <small>{{ row.panelHost || "%" }}</small>
                        </div>
                      </template>
                    </ElTableColumn>
                    <ElTableColumn label="授权数" min-width="90" align="center">
                      <template #default="{ row }">{{
                        (row.panelGrants || []).length
                      }}</template>
                    </ElTableColumn>
                    <ElTableColumn label="权限预览" min-width="260">
                      <template #default="{ row }">
                        <div class="grant-cell">
                          <ScTag
                            v-for="grant in (row.panelGrants || []).slice(0, 2)"
                            :key="grant"
                            class="toolbar-chip"
                            effect="plain"
                            size="small"
                          >
                            {{ grant }}
                          </ScTag>
                          <span v-if="!(row.panelGrants || []).length"
                            >暂无可见授权</span
                          >
                          <small v-else-if="(row.panelGrants || []).length > 2">
                            +{{ (row.panelGrants || []).length - 2 }} 条
                          </small>
                        </div>
                      </template>
                    </ElTableColumn>
                  </ElTable>
                </div>

                <aside class="account-detail-shell">
                  <header class="account-detail__head">
                    <div class="account-detail__title">
                      <small>ACCOUNT DETAIL</small>
                      <strong>{{
                        activeSelectedAccount?.panelAccountName || "未选中账号"
                      }}</strong>
                      <span>{{ activeSelectedAccount?.panelHost || "%" }}</span>
                    </div>

                    <div class="account-detail__actions">
                      <ElTooltip content="创建账号">
                        <ElButton
                          circle
                          :icon="Plus"
                          @click="openAccountDialog('create')"
                        />
                      </ElTooltip>
                      <ElTooltip content="复制 user@host">
                        <ElButton
                          circle
                          :disabled="!activeSelectedAccount"
                          :icon="CopyDocument"
                          @click="handleCopyAccountPrincipal"
                        />
                      </ElTooltip>
                      <ElTooltip content="复制授权 SQL">
                        <ElButton
                          circle
                          :disabled="!activeSelectedGrantText"
                          :icon="DocumentCopy"
                          @click="handleCopyAccountGrants"
                        />
                      </ElTooltip>
                      <ElTooltip content="修改密码">
                        <ElButton
                          circle
                          :disabled="!activeSelectedAccount"
                          :icon="EditPen"
                          @click="openAccountDialog('update')"
                        />
                      </ElTooltip>
                      <ElTooltip content="授予权限">
                        <ElButton
                          circle
                          :disabled="!activeSelectedAccount"
                          :icon="Promotion"
                          @click="openPrivilegeDialog('grant')"
                        />
                      </ElTooltip>
                      <ElTooltip content="回收权限">
                        <ElButton
                          circle
                          :disabled="!activeSelectedAccount"
                          :icon="QuestionFilled"
                          @click="openPrivilegeDialog('revoke')"
                        />
                      </ElTooltip>
                      <ElTooltip content="删除账号">
                        <ElButton
                          circle
                          :disabled="!activeSelectedAccount"
                          :icon="Delete"
                          @click="handleDeleteAccount"
                        />
                      </ElTooltip>
                    </div>
                  </header>

                  <div class="account-detail__meta">
                    <ScTag class="toolbar-chip" effect="plain">
                      授权 {{ activeSelectedAccountGrantCount }}
                    </ScTag>
                    <ScTag class="toolbar-chip" effect="plain">
                      Host {{ activeSelectedAccount?.panelHost || "%" }}
                    </ScTag>
                    <ScTag class="toolbar-chip" effect="plain">
                      用户 {{ activeSelectedAccount?.panelAccountName || "-" }}
                    </ScTag>
                  </div>

                  <article class="message-card">
                    <strong>授权语句</strong>
                    <pre>{{
                      activeSelectedGrantText ||
                      "当前账号无可见授权或权限不足。"
                    }}</pre>
                  </article>

                  <article class="message-card">
                    <strong>授权标签</strong>
                    <div class="grant-cell">
                      <ScTag
                        v-for="grant in activeSelectedAccount?.panelGrants ||
                        []"
                        :key="grant"
                        class="toolbar-chip"
                        effect="plain"
                        size="small"
                      >
                        {{ grant }}
                      </ScTag>
                      <span
                        v-if="
                          !(activeSelectedAccount?.panelGrants || []).length
                        "
                      >
                        当前账号无可见授权或权限不足。
                      </span>
                    </div>
                  </article>
                </aside>
              </div>
            </div>
          </template>

          <template v-else-if="activeWorkbenchTab.tabType === 'table-edit'">
            <div
              v-if="editSection === 'columns'"
              :key="`table-edit-columns-${activeWorkbenchTab.tabId}`"
              class="workbench-panel"
            >
              <div class="table-edit-toolbar">
                <span class="table-edit-toolbar__hint">
                  <ElIcon><Rank /></ElIcon>
                  拖动字段左侧手柄可调整顺序
                </span>
                <ElTooltip content="新增字段">
                  <ElButton circle :icon="Plus" @click="handleAddEditColumn" />
                </ElTooltip>
                <ElTooltip content="重置为原始结构">
                  <ElButton
                    circle
                    :icon="RefreshRight"
                    @click="handleResetEditColumns"
                  />
                </ElTooltip>
              </div>
              <ElTable
                ref="editTableRef"
                :data="activeEditableColumns"
                border
                height="100%"
              >
                <ElTableColumn label="" width="60" align="center">
                  <template #default>
                    <button
                      type="button"
                      class="table-edit__drag"
                      title="拖动排序"
                    >
                      <ElIcon><Rank /></ElIcon>
                    </button>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="#" type="index" width="54" />
                <ElTableColumn label="字段名" min-width="180">
                  <template #default="{ row }">
                    <ElInput
                      v-model="row.name"
                      class="table-edit__control"
                      size="small"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="类型" min-width="180">
                  <template #default="{ row }">
                    <ElSelect
                      v-model="row.type"
                      allow-create
                      class="table-edit__control"
                      default-first-option
                      filterable
                      size="small"
                    >
                      <ElOption
                        v-for="option in editableTypeOptions"
                        :key="option"
                        :label="option"
                        :value="option"
                      />
                    </ElSelect>
                  </template>
                </ElTableColumn>
                <ElTableColumn label="长度" min-width="112">
                  <template #default="{ row }">
                    <ElInputNumber
                      v-model="row.size"
                      class="table-edit__control"
                      :controls="false"
                      :min="0"
                      size="small"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="小数位" min-width="112">
                  <template #default="{ row }">
                    <ElInputNumber
                      v-model="row.scale"
                      class="table-edit__control"
                      :controls="false"
                      :min="0"
                      size="small"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="主键" min-width="86">
                  <template #default="{ row }">
                    <ElSwitch v-model="row.panelPrimary" />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="允许空" min-width="90">
                  <template #default="{ row }">
                    <ElSwitch v-model="row.nullable" />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="默认值" min-width="140">
                  <template #default="{ row }">
                    <ElInput
                      v-model="row.defaultValue"
                      class="table-edit__control"
                      size="small"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="备注" min-width="220">
                  <template #default="{ row }">
                    <ElInput
                      v-model="row.comment"
                      class="table-edit__control"
                      size="small"
                    />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="操作" width="70" fixed="right">
                  <template #default="{ $index }">
                    <ElButton
                      circle
                      :icon="Delete"
                      @click="handleRemoveEditColumn($index)"
                    />
                  </template>
                </ElTableColumn>
              </ElTable>
            </div>

            <div
              v-else-if="editSection === 'indexes'"
              :key="`table-edit-indexes-${activeWorkbenchTab.tabId}`"
              class="workbench-panel"
            >
              <ElTable :data="activeIndexes" border height="100%">
                <ElTableColumn label="索引名" min-width="220" prop="name" />
                <ElTableColumn label="列" min-width="180" prop="column" />
                <ElTableColumn label="唯一" min-width="80">
                  <template #default="{ row }">{{
                    row.nonUnique ? "NO" : "YES"
                  }}</template>
                </ElTableColumn>
                <ElTableColumn label="类型" min-width="100" prop="type" />
              </ElTable>
            </div>

            <div
              v-else-if="editSection === 'ddl'"
              :key="`table-edit-ddl-${activeWorkbenchTab.tabId}`"
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{
                activeEditDdl || activeWorkbenchTab.ddlText || "-- 暂无 DDL"
              }}</pre>
            </div>

            <div
              v-else-if="editSection === 'changes'"
              :key="`table-edit-changes-${activeWorkbenchTab.tabId}`"
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{
                activeAlterSql || "-- 当前设计与原表一致，无需变更"
              }}</pre>
            </div>

            <div
              v-else-if="editSection === 'triggers'"
              :key="`table-edit-triggers-${activeWorkbenchTab.tabId}`"
              class="workbench-panel"
            >
              <ElTable
                v-if="activeTriggers.length"
                :data="activeTriggers"
                border
                height="100%"
              >
                <ElTableColumn label="触发器" min-width="180" prop="name" />
                <ElTableColumn label="时机" min-width="120" prop="timing" />
                <ElTableColumn label="事件" min-width="120" prop="event" />
                <ElTableColumn
                  label="创建时间"
                  min-width="180"
                  prop="created"
                />
                <ElTableColumn
                  label="定义"
                  min-width="360"
                  prop="statement"
                  show-overflow-tooltip
                />
              </ElTable>
              <ElEmpty v-else description="当前表没有可见触发器。" />
            </div>

            <div
              v-else
              :key="`table-edit-placeholder-${activeWorkbenchTab.tabId}-${editSection}`"
              class="workbench-panel workbench-panel--placeholder"
            >
              <ElEmpty
                :description="`${editSectionLabel} 暂按当前数据库能力预留。`"
              />
            </div>
          </template>

          <template v-else-if="activeWorkbenchTab.tabType === 'table'">
            <div
              v-if="tableView === 'data'"
              :key="`table-view-data-${activeWorkbenchTab.tabId}`"
              class="workbench-panel workbench-panel--data"
            >
              <div class="data-preview-head">
                <div class="data-preview-head__top">
                  <div class="data-preview-head__summary">
                    <div class="data-preview-head__summary-line">
                      <code
                        >page {{ activeWorkbenchTab.pageNum }} / size
                        {{ activeWorkbenchTab.pageSize }}</code
                      >
                      <ScTag
                        v-if="
                          activeWorkbenchTab.dataResult?.panelElapsedMillis !==
                          undefined
                        "
                        class="toolbar-chip data-preview-head__elapsed"
                        effect="plain"
                        size="small"
                      >
                        {{ activeWorkbenchTab.dataResult?.panelElapsedMillis }} ms
                      </ScTag>
                      <ScTag
                        class="toolbar-chip data-preview-head__elapsed"
                        effect="plain"
                        size="small"
                      >
                        rows {{ activeDisplayRows.length }}
                      </ScTag>
                      <ScTag
                        v-if="activeFilterCount"
                        class="toolbar-chip data-preview-head__elapsed"
                        effect="plain"
                        size="small"
                      >
                        filters {{ activeFilterCount }}
                      </ScTag>
                    </div>
                    <ElInput
                      v-model="tableFilterKeyword"
                      class="data-preview-head__filter"
                      clearable
                      :prefix-icon="Search"
                      placeholder="筛选整张表"
                    />
                  </div>
                  <div class="data-preview-head__actions">
                    <ScTag
                      v-if="activeFilterCount"
                      class="toolbar-chip"
                      effect="plain"
                      size="small"
                      type="warning"
                    >
                      filters {{ activeFilterCount }}
                    </ScTag>
                    <ScTag
                      v-if="activeDataDirtyCount"
                      class="toolbar-chip"
                      effect="plain"
                      size="small"
                      type="danger"
                    >
                      dirty {{ activeDataDirtyCount }}
                    </ScTag>
                  </div>
                </div>
                <div
                  v-if="showAdvancedFilterPanel"
                  class="data-preview-filter-panel"
                >
                  <div class="data-preview-filter-panel__head">
                    <div class="toolbar-segment" role="tablist" aria-label="筛选关系">
                      <button
                        v-for="item in [
                          { label: '且', value: 'and' },
                          { label: '或', value: 'or' },
                        ]"
                        :key="item.value"
                        type="button"
                        class="toolbar-segment__item"
                        :class="{ 'is-active': activeTableFilterJoin === item.value }"
                        @click="handleAdvancedFilterJoinChange(item.value)"
                      >
                        {{ item.label }}
                      </button>
                    </div>
                    <ElButton plain size="small" @click="handleAddAdvancedFilter">
                      添加条件
                    </ElButton>
                    <ElButton plain size="small" @click="panelFilterPanelOpen = false">
                      收起
                    </ElButton>
                  </div>
                  <div
                    v-if="activeTableFilters.length"
                    class="data-preview-filter-list"
                  >
                    <div
                      v-for="(filter, index) in activeTableFilters"
                      :key="`${filter.panelColumnName}-${index}`"
                      class="data-preview-filter-item"
                    >
                      <ElSelect
                        :model-value="filter.panelColumnName"
                        class="data-preview-filter-item__column"
                        size="small"
                        @update:model-value="
                          handleAdvancedFilterColumnChange(index, String($event))
                        "
                      >
                        <ElOption
                          v-for="column in activeFilterableColumns"
                          :key="column.value"
                          :label="column.label"
                          :value="column.value"
                        />
                      </ElSelect>
                      <ElSelect
                        :model-value="filter.panelOperator"
                        class="data-preview-filter-item__operator"
                        size="small"
                        @update:model-value="
                          handleAdvancedFilterOperatorChange(
                            index,
                            String($event)
                          )
                        "
                      >
                        <ElOption
                          v-for="operator in getFilterOperators(filter.panelColumnName)"
                          :key="operator.value"
                          :label="operator.label"
                          :value="operator.value"
                        />
                      </ElSelect>
                      <ElInput
                        :model-value="filter.panelValue"
                        class="data-preview-filter-item__value"
                        clearable
                        :disabled="isValuelessFilterOperator(filter.panelOperator)"
                        placeholder="输入筛选值"
                        size="small"
                        @update:model-value="
                          handleAdvancedFilterValueChange(index, String($event))
                        "
                      />
                      <ElButton
                        circle
                        plain
                        size="small"
                        @click="handleRemoveAdvancedFilter(index)"
                      >
                        <ElIcon><Delete /></ElIcon>
                      </ElButton>
                    </div>
                  </div>
                  <div v-else class="data-preview-filter-panel__empty">
                    添加条件后按列筛选，仍会与“筛选整张表”共同生效
                  </div>
                </div>
              </div>
              <div class="data-table-shell" @contextmenu.prevent="handleTableShellContextMenu">
                <ElTable
                  v-if="activeDataColumns.length"
                  ref="panelDataTableRef"
                  :key="`panel-data-table-${activeWorkbenchTab.tabId}`"
                  :data="activeDisplayRows"
                  :border="true"
                  :height="'100%'"
                  :row-key="'__panelRowIndex'"
                  :row-class-name="resolveDataRowClass"
                  class="data-table-native"
                  @cell-dblclick="(row, col) => handleCellDblClick(row.__panelRow, col)"
                  @cell-contextmenu="(row, col, cell, e) => openCellViewer(e, row.__panelRow[col?.property], col?.property)"
                >
                  <ElTableColumn
                    v-if="activeWorkbenchTab.showSequence"
                    align="center"
                    fixed="left"
                    label="#"
                    width="60"
                  >
                    <template #default="{ row }">
                      {{ resolveSequence(row.__panelRowIndex) }}
                    </template>
                  </ElTableColumn>
                  <ElTableColumn
                    v-for="col in activeOrderedDataColumns"
                    :key="col"
                    :column-key="col"
                    :fixed="resolveColumnFixed(col) || undefined"
                    :min-width="measurePanelDataColumnWidth(col, activeDisplayRows)"
                    :prop="col"
                    :show-overflow-tooltip="true"
                    :sortable="false"
                  >
                    <template #header>
                      <div class="col-header-wrapper">
                        <div class="col-header-row">
                          <span class="col-header-title">{{ resolveColumnHeader(col) }}</span>
                          <span class="col-header-sort" @click.stop="handleHeaderSortClick(col)">
                            <ElIcon
                              v-if="activeWorkbenchTab?.sortField === col && activeWorkbenchTab?.sortOrder === 'asc'"
                              class="col-sort-icon col-sort-icon--asc"
                            ><Top /></ElIcon>
                            <ElIcon
                              v-else-if="activeWorkbenchTab?.sortField === col && activeWorkbenchTab?.sortOrder === 'desc'"
                              class="col-sort-icon col-sort-icon--desc"
                            ><Bottom /></ElIcon>
                            <ElIcon v-else class="col-sort-icon col-sort-icon--idle"><DCaret /></ElIcon>
                          </span>
                        </div>
                        <small
                          v-if="colHeaderMenuState.showColumnType && activeColumnMetaMap[col]?.type"
                          class="col-type"
                        >{{ activeColumnMetaMap[col]?.type }}</small>
                        <small
                          v-if="colHeaderMenuState.showColumnComment && (activeColumnMetaMap[col]?.comment || activeColumnMetaMap[col]?.remark)"
                          class="col-comment"
                        >{{ activeColumnMetaMap[col]?.comment || activeColumnMetaMap[col]?.remark }}</small>
                      </div>
                    </template>
                    <template #default="{ row }">
                      <div
                        class="data-cell"
                        :class="{ 'data-cell--dirty': isDirtyCell(row.__panelRowIndex, col) }"
                        @click="activateCellEdit(row.__panelRowIndex, col)"
                      >
                        <template v-if="isEditingCell(row.__panelRowIndex, col)">
                          <ElInput
                            :model-value="editingCell.value"
                            autofocus
                            class="data-cell__editor"
                            size="small"
                            type="textarea"
                            :autosize="{ minRows: 1, maxRows: 3 }"
                            resize="none"
                            @update:model-value="editingCell.value = $event"
                            @blur="commitCellEdit"
                            @keydown="handlePanelCellKeydown"
                            @click.stop
                          />
                        </template>
                        <template v-else>
                          <span class="data-cell__value">{{ formatCellValue(row.__panelRow[col]) }}</span>
                          <small
                            v-if="colHeaderMenuState.showDataComment && activeColumnCommentMap[col]"
                            class="data-cell__comment"
                          >{{ activeColumnCommentMap[col] }}</small>
                        </template>
                      </div>
                    </template>
                  </ElTableColumn>
                </ElTable>
                <ElEmpty
                  v-else
                  description="当前还没有表数据，点击刷新后重试。"
                />
                <ColumnHeaderMenu
                  :visible="colHeaderMenuState.visible"
                  :position="colHeaderMenuState.position"
                  :column="colHeaderMenuState.column"
                  :column-meta="colHeaderMenuState.columnMeta"
                  :show-column-type="colHeaderMenuState.showColumnType"
                  :show-column-comment="colHeaderMenuState.showColumnComment"
                  :show-data-comment="colHeaderMenuState.showDataComment"
                  :all-columns="activeOrderedDataColumns"
                  :frozen-columns="activeFrozenColumns"
                  :has-filters="activeTableFilters.length > 0"
                  :table-comment-mode="activeWorkbenchTab?.tableCommentMode || 'native'"
                  :data-comment-mode="activeWorkbenchTab?.dataCommentMode || 'native'"
                  :show-sequence="activeWorkbenchTab?.showSequence ?? true"
                  :load-total="activeWorkbenchTab?.loadTotal ?? false"
                  :pagination-mode="activeWorkbenchTab?.paginationMode || 'pagination'"
                  @close="colHeaderMenuState.visible = false"
                  @sort-asc="handleColHeaderSortAsc"
                  @sort-desc="handleColHeaderSortDesc"
                  @toggle-type="colHeaderMenuState.showColumnType = !colHeaderMenuState.showColumnType; saveColHeaderMenuState()"
                  @toggle-comment="colHeaderMenuState.showColumnComment = !colHeaderMenuState.showColumnComment; saveColHeaderMenuState()"
                  @toggle-data-comment="colHeaderMenuState.showDataComment = !colHeaderMenuState.showDataComment; saveColHeaderMenuState()"
                  @edit-annotation="handleEditAnnotation"
                  @filter-column="handleColHeaderFilterColumn"
                  @clear-filters="handleClearAdvancedFilters"
                  @toggle-freeze-column="handleToggleFreezeColumn"
                  @change-table-comment-mode="updateActiveTabSetting({ tableCommentMode: $event })"
                  @change-data-comment-mode="updateActiveTabSetting({ dataCommentMode: $event })"
                  @toggle-sequence="updateActiveTabSetting({ showSequence: !(activeWorkbenchTab?.showSequence ?? true) })"
                  @toggle-load-total="updateActiveTabSetting({ loadTotal: !(activeWorkbenchTab?.loadTotal ?? false), pageNum: 1, viewMode: 'data' })"
                  @change-pagination-mode="handlePaginationModeChange($event)"
                />
              </div>
              <!-- 单元格查看器 -->
              <Teleport to="body">
                <div
                  v-if="cellViewer.visible"
                  class="cell-viewer"
                  :style="{ top: `${cellViewer.y}px`, left: `${cellViewer.x}px` }"
                  @click.stop
                  @contextmenu.prevent
                >
                  <div class="cell-viewer__head">
                    <span class="cell-viewer__col">{{ cellViewer.column }}</span>
                    <div class="cell-viewer__tabs">
                      <button
                        v-for="mode in cellViewerModes"
                        :key="mode.value"
                        type="button"
                        class="cell-viewer__tab"
                        :class="{ 'is-active': cellViewer.mode === mode.value }"
                        @click="cellViewer.mode = mode.value"
                      >{{ mode.label }}</button>
                    </div>
                    <button type="button" class="cell-viewer__close" @click="cellViewer.visible = false">×</button>
                  </div>
                  <div class="cell-viewer__body">
                    <!-- 文本模式 -->
                    <pre v-if="cellViewer.mode === 'text'" class="cell-viewer__text">{{ cellViewer.value ?? 'NULL' }}</pre>
                    <!-- 图片模式 -->
                    <div v-else-if="cellViewer.mode === 'image'" class="cell-viewer__image-wrap">
                      <img
                        v-if="cellViewerImageSrc"
                        :src="cellViewerImageSrc"
                        class="cell-viewer__image"
                        alt="预览"
                      />
                      <span v-else class="cell-viewer__empty">无法识别为图片</span>
                    </div>
                    <!-- Base64 解码模式 -->
                    <pre v-else-if="cellViewer.mode === 'base64'" class="cell-viewer__text">{{ cellViewerBase64Decoded }}</pre>
                    <!-- JSON 模式 -->
                    <pre v-else-if="cellViewer.mode === 'json'" class="cell-viewer__text cell-viewer__text--json">{{ cellViewerJsonFormatted }}</pre>
                  </div>
                </div>
              </Teleport>
              <ScCellEditor
                v-model="cellEditorState.value"
                v-model:visible="cellEditorState.visible"
                :field-name="cellEditorState.fieldName"
                :field-type="cellEditorState.fieldType"
                @save="handleCellEditorSave"
              />
              <div
                v-if="activeWorkbenchTab.paginationMode === 'pagination' && activeDataColumns.length"
                class="data-pagination"
              >
                <ElPagination
                  background
                  layout="prev, pager, next, sizes, total"
                  :current-page="activeWorkbenchTab.pageNum"
                  :page-size="activeWorkbenchTab.pageSize"
                  :page-sizes="[50, 100, 200]"
                  :total="
                    activeWorkbenchTab.loadTotal
                      ? Math.max(
                          activeWorkbenchTab.dataResult?.panelTotal || 0,
                          0
                        )
                      : activeWorkbenchTab.pageNum * activeWorkbenchTab.pageSize
                  "
                  @current-change="
                    updateActiveTabSetting({
                      pageNum: $event,
                      viewMode: 'data',
                    })
                  "
                  @size-change="
                    updateActiveTabSetting({
                      pageNum: 1,
                      pageSize: $event,
                      viewMode: 'data',
                    })
                  "
                />
              </div>
              <div v-else-if="activeDataColumns.length" class="data-pagination data-pagination--summary">
                <span>非分页模式</span>
                <small
                  >当前按一次性结果集显示，最多返回
                  {{ previewLimit }} 行。</small
                >
              </div>
            </div>

            <div
              v-else-if="tableView === 'ddl'"
              :key="`table-view-ddl-${activeWorkbenchTab.tabId}`"
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{ activeWorkbenchTab.ddlText || "-- 暂无 DDL" }}</pre>
            </div>

            <div
              v-else-if="tableView === 'ai'"
              :key="`table-view-ai-${activeWorkbenchTab.tabId}`"
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{
                activeWorkbenchTab.aiContent || "暂无 AI 结构说明。"
              }}</pre>
            </div>

            <div
              v-else
              :key="`table-view-indexes-${activeWorkbenchTab.tabId}`"
              class="workbench-panel"
            >
              <ElTable :data="activeIndexes" border height="100%">
                <ElTableColumn label="索引名" min-width="220" prop="name" />
                <ElTableColumn label="列" min-width="180" prop="column" />
                <ElTableColumn label="唯一" min-width="80">
                  <template #default="{ row }">{{
                    row.nonUnique ? "NO" : "YES"
                  }}</template>
                </ElTableColumn>
                <ElTableColumn label="类型" min-width="100" prop="type" />
              </ElTable>
            </div>
          </template>

          <template
            v-else-if="activeWorkbenchTab.tabType === 'database-document'"
          >
            <div class="workbench-panel workbench-panel--doc-shell">
              <JdbcDatabaseDocument
                :document="activeWorkbenchTab.databaseDocument || null"
              />
            </div>
          </template>
        </div>
      </section>

      <section
        v-else-if="activeTabId === 'metadata'"
        key="metadata-shell"
        class="metadata-shell"
      >
        <header class="sql-toolbar sql-toolbar--plain">
          <div class="sql-toolbar__title">
            <small>DATASOURCE PROFILE</small>
            <strong>{{
              datasourceMetadata?.databaseProductName || "数据库元信息"
            }}</strong>
          </div>
        </header>
        <div class="metadata-body">
          <JdbcDatasourceProfile
            :capabilities="capabilities"
            :catalogs="catalogs"
            :metadata="datasourceMetadata"
          />
        </div>
      </section>

      <section
        v-else-if="activeTabId === 'mysql-process'"
        key="mysql-process-shell"
        class="metadata-shell"
      >
        <header class="sql-toolbar sql-toolbar--plain">
          <div class="sql-toolbar__title">
            <small>MYSQL PROCESS</small>
            <strong>MySQL 进程</strong>
          </div>
          <div class="sql-toolbar__actions">
            <ScSelect
              :model-value="mysqlProcessRefreshInterval"
              layout="list"
              width="120px"
              :options="mysqlProcessRefreshOptions"
              :list-select-button="true"
              list-select-icon="ri:timer-line"
              :list-borde="true"
              :list-select-show-value="true"
              list-height="430px"
              :list-show-search="false"
              :list-show-batch-actions="false"
              :disabled="submitting || !isMysqlDatasource"
              @change="handleMysqlProcessIntervalChange"
            />
            <ElTooltip content="批量关闭选中进程">
              <ElButton
                circle
                :disabled="
                  submitting ||
                  !isMysqlDatasource ||
                  !selectedMysqlProcessIds.length
                "
                :icon="Delete"
                @click="handleKillMysqlProcessBatch"
              />
            </ElTooltip>
            <ElTooltip content="刷新进程" v-if="!mysqlProcessRefreshInterval">
              <ElButton
                circle
                :disabled="submitting || !isMysqlDatasource"
                :icon="RefreshRight"
                @click="handleLoadMysqlProcess"
              />
            </ElTooltip>
          </div>
        </header>
        <div class="metadata-body mysql-process-body">
          <div v-if="!isMysqlDatasource" class="footer-placeholder">
            当前连接不是 MySQL / MariaDB，无法读取进程列表。
          </div>
          <template v-else>
            <div class="mysql-process-tip">
              点击「刷新进程」将执行
              <code>show full processlist</code>
              并在此区域显示结果。
            </div>
            <div
              v-if="queryResult?.query && queryResult.columns?.length"
              class="mysql-process-table"
            >
              <ElTable
                :data="queryResult.rows || []"
                border
                height="100%"
                @selection-change="handleMysqlProcessSelectionChange"
              >
                <ElTableColumn type="selection" width="46" />
                <ElTableColumn label="操作" width="78" fixed="left">
                  <template #default="{ row }">
                    <ElTooltip content="关闭进程">
                      <ElButton
                        circle
                        :disabled="submitting"
                        :icon="Delete"
                        @click.stop="handleKillMysqlProcessRow(row)"
                      />
                    </ElTooltip>
                  </template>
                </ElTableColumn>
                <ElTableColumn
                  v-for="column in queryResult.columns"
                  :key="column"
                  :prop="column"
                  :label="column"
                  min-width="120"
                  show-overflow-tooltip
                />
              </ElTable>
            </div>
            <div v-else class="footer-placeholder">
              暂无进程数据，请先点击「刷新进程」。
            </div>
          </template>
        </div>
      </section>

      <section v-else key="workspace-shell" class="sql-shell">
        <header class="sql-toolbar">
          <div class="sql-toolbar__title">
            <small>
              <span>SQL WORKSPACE</span>
            </small>
            <strong>
                <span
                  v-if="queryResult?.elapsedMillis !== undefined"
                  class="sql-toolbar__elapsed"
                >
                  <IconifyIconOnline icon="ri:timer-line" />
                  {{ queryResult.elapsedMillis }} ms
                </span>
            </strong>
          </div>

          <div class="sql-toolbar__actions">
            <ElTooltip content="执行全部 SQL (Ctrl/Cmd + Enter)">
              <ElButton
                circle
                :disabled="submitting"
                :icon="VideoPlay"
                type="primary"
                @click="$emit('execute')"
              />
            </ElTooltip>
            <ElTooltip content="执行选中部分 (Ctrl/Cmd + Shift + Enter)">
              <ElButton
                circle
                :disabled="submitting || !hasSelection"
                :icon="CaretRight"
                @click="handleExecuteSelection"
              />
            </ElTooltip>
            <ElTooltip content="SQL 美化">
              <ElButton
                circle
                :disabled="submitting || formatPending"
                :icon="MagicStick"
                @click="handleFormatSql"
              />
            </ElTooltip>
            <ElTooltip content="执行 EXPLAIN">
              <ElButton
                circle
                :disabled="submitting"
                :icon="QuestionFilled"
                @click="$emit('explain')"
              />
            </ElTooltip>
            <ElTooltip content="AI 生成 SQL">
              <ElButton
                circle
                :disabled="submitting"
                :icon="Promotion"
                @click="aiDialogVisible = true"
              />
            </ElTooltip>
            <ElTooltip content="复制 SQL 代码块">
              <ElButton
                circle
                :icon="DocumentCopy"
                @click="handleCopyCodeBlock"
              />
            </ElTooltip>
            <ElTooltip content="保存 SQL">
              <ElButton circle :icon="FolderChecked" @click="handleSaveSql" />
            </ElTooltip>
          </div>
        </header>

        <div class="sql-editor-wrap">
          <ScCodeEditor
            ref="sqlEditorRef"
            :height="'100%'"
            :model-value="sqlText"
            :on-cursor-activity="syncSelectionState"
            :on-input="handleEditorInput"
            :options="editorOptions"
            mode="sql"
            theme="idea"
            @update:model-value="$emit('update:sqlText', $event)"
          />
        </div>

        <section class="sql-footer" :style="{ height: sqlFooterHeight + 'px' }">
          <div
            class="sql-footer__resizer"
            @mousedown="startSqlFooterResize"
          />
          <div class="sql-footer__tabs">
            <button
              type="button"
              class="footer-tab"
              :class="{ 'is-active': bottomPanel === 'result' }"
              @click="bottomPanel = 'result'"
            >
              结果
            </button>
            <button
              type="button"
              class="footer-tab"
              :class="{ 'is-active': bottomPanel === 'message' }"
              @click="bottomPanel = 'message'"
            >
              消息
            </button>
          </div>

          <div class="sql-footer__body">
            <div v-if="bottomPanel === 'result'" class="footer-panel">
              <div
                v-if="queryResult?.query && queryResult.columns?.length"
                class="sql-result-table"
              >
                <ElAutoResizer>
                  <template #default="{ height, width }">
                    <ElTableV2
                      :columns="queryResultVirtualColumns"
                      :data="queryResultVirtualRows"
                      :header-height="40"
                      :height="Math.max(height - 44, 180)"
                      :row-height="40"
                      :width="width"
                    />
                  </template>
                </ElAutoResizer>
                <!-- 分页 -->
                <div v-if="queryResult.pageSize && queryResult.pageSize > 0" class="sql-result-pagination">
                  <ElPagination
                    background
                    layout="prev, pager, next, total"
                    :current-page="queryResult.pageNum || 1"
                    :page-size="queryResult.pageSize"
                    :total="queryResult.total && queryResult.total >= 0 ? Number(queryResult.total) : (queryResult.pageNum || 1) * queryResult.pageSize"
                    @current-change="$emit('execute-page', $event)"
                  />
                </div>
              </div>

              <div v-else class="footer-placeholder">
                <strong>{{
                  queryResult?.query ? "查询完成" : "等待执行 SQL"
                }}</strong>
                <span>
                  {{
                    queryResult
                      ? `影响行数 ${queryResult.affectedRows}`
                      : "执行结果会固定展示在这里，不再随点击抖动。"
                  }}
                </span>
              </div>
            </div>

            <div v-else class="footer-panel footer-panel--message">
              <div class="message-head">
                <ElTag effect="plain" size="small" type="success">
                  JDBC {{ capabilities?.jdbcEnabled ? "ON" : "OFF" }}
                </ElTag>
                <ElTag
                  effect="plain"
                  size="small"
                  :type="capabilities?.aiEnabled ? 'primary' : 'info'"
                >
                  AI {{ capabilities?.aiEnabled ? "ON" : "OFF" }}
                </ElTag>
                <ElTag
                  effect="plain"
                  size="small"
                  :type="capabilities?.aiStarterEnabled ? 'warning' : 'info'"
                >
                  Starter {{ capabilities?.aiStarterEnabled ? "ON" : "OFF" }}
                </ElTag>
              </div>

              <article
                v-if="errorMessage"
                class="message-card message-card--error"
              >
                <strong>执行异常</strong>
                <p>{{ errorMessage }}</p>
              </article>

              <article v-if="capabilities?.message" class="message-card">
                <strong>能力结果</strong>
                <p>{{ capabilities.message }}</p>
              </article>

              <article class="message-card message-card--code">
                <strong>SQL 解释</strong>
                <JdbcExplainFlow :rows="sqlExplainRows" />
                <pre>{{
                  sqlExplainContent ||
                  "点击工具栏解释按钮后，这里显示分析结果。"
                }}</pre>
              </article>
            </div>
          </div>
          </section>
        </section>
        </div>
      </template>
    </ScLayout>

    <ElDialog v-model="aiDialogVisible" title="AI 生成 SQL" width="480px">
      <ElInput
        v-model="aiPrompt"
        :autosize="{ minRows: 4, maxRows: 8 }"
        placeholder="输入中文需求，例如：查询最近 7 天新增订单，并按天统计。"
        type="textarea"
      />
      <template #footer>
        <ElButton @click="aiDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleGenerateSql">生成</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="accountDialogVisible"
      :title="accountDialogMode === 'create' ? '创建账号' : '修改密码'"
      width="420px"
    >
      <div class="dialog-form">
        <label class="dialog-field">
          <span class="dialog-field__label dialog-field__label--required">
            账号
          </span>
          <ElInput
            v-model="accountForm.panelAccountName"
            :disabled="accountDialogMode === 'update'"
            placeholder="账号"
          />
          <small
            class="dialog-field__error"
            :class="{
              'dialog-field__error--hidden': !accountFormErrors.panelAccountName,
            }"
          >
            {{ accountFormErrors.panelAccountName || " " }}
          </small>
        </label>
        <label class="dialog-field">
          <span class="dialog-field__label">Host</span>
          <ElInput v-model="accountForm.panelHost" placeholder="Host，默认 %" />
        </label>
        <label class="dialog-field">
          <span class="dialog-field__label dialog-field__label--required">
            {{ accountDialogMode === "create" ? "密码" : "新密码" }}
          </span>
          <ElInput
            v-model="accountForm.panelPassword"
            :placeholder="
              accountDialogMode === 'create' ? '密码' : '请输入新密码'
            "
            show-password
          />
          <small
            class="dialog-field__error"
            :class="{
              'dialog-field__error--hidden': !accountFormErrors.panelPassword,
            }"
          >
            {{ accountFormErrors.panelPassword || " " }}
          </small>
        </label>
      </div>
      <template #footer>
        <span class="dialog-footer-tip">带 * 为必填</span>
        <ElButton @click="accountDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitAccountDialog">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog
      v-model="privilegeDialogVisible"
      :title="privilegeDialogMode === 'grant' ? '授予权限' : '回收权限'"
      width="460px"
    >
      <div class="dialog-form">
        <label class="dialog-field">
          <span class="dialog-field__label">账号</span>
          <ElInput
            v-model="privilegeForm.panelAccountName"
            disabled
            placeholder="账号"
          />
        </label>
        <label class="dialog-field">
          <span class="dialog-field__label">Host</span>
          <ElInput
            v-model="privilegeForm.panelHost"
            disabled
            placeholder="Host"
          />
        </label>
        <label class="dialog-field">
          <span class="dialog-field__label dialog-field__label--required">
            权限
          </span>
          <ElInput
            :model-value="privilegeForm.panelPrivileges.join(', ')"
            placeholder="权限，逗号分隔，例如 SELECT, INSERT"
            @update:model-value="handlePrivilegeInput"
          />
          <small
            class="dialog-field__error"
            :class="{
              'dialog-field__error--hidden':
                !privilegeFormErrors.panelPrivileges,
            }"
          >
            {{ privilegeFormErrors.panelPrivileges || " " }}
          </small>
        </label>
        <label class="dialog-field">
          <span class="dialog-field__label">数据库</span>
          <ElInput
            v-model="privilegeForm.panelCatalogName"
            placeholder="数据库，默认 *"
          />
        </label>
        <label class="dialog-field">
          <span class="dialog-field__label">表</span>
          <ElInput
            v-model="privilegeForm.panelTableName"
            placeholder="表，默认 *"
          />
        </label>
        <div class="dialog-form__inline">
          <span>WITH GRANT OPTION</span>
          <ElSwitch
            v-model="privilegeForm.panelGrantOption"
            :disabled="privilegeDialogMode !== 'grant'"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer-tip">带 * 为必填</span>
        <ElButton @click="privilegeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitPrivilegeDialog">确定</ElButton>
      </template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  Bottom,
  CaretRight,
  CopyDocument,
  DataAnalysis,
  DCaret,
  Delete,
  Download,
  Document,
  DocumentCopy,
  EditPen,
  FolderChecked,
  MagicStick,
  Monitor,
  Plus,
  RefreshRight,
  Promotion,
  QuestionFilled,
  Rank,
  Search,
  Tickets,
  Top,
  VideoPlay,
} from "@element-plus/icons-vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import ScLayout from "@repo/components/ScLayout";
import ScSelect from "@repo/components/ScSelect/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import ScCellEditor from "@repo/components/ScCellEditor/index.vue";
import ColumnHeaderMenu from "@repo/components/ScTable/plugins/ColumnHeaderMenu.vue";
import {
  ElButton,
  ElAutoResizer,
  ElDialog,
  ElEmpty,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElOption,
  ElPagination,
  ElMessage,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTableV2,
  ElTag,
  ElTooltip,
} from "element-plus";
import Sortable from "sortablejs";
import { format as formatSqlText } from "sql-formatter";
import {
  computed,
  h,
  markRaw,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import type {
  JdbcConnectionMetadata,
  PanelJdbcAccountSaveRequest,
  JdbcQueryResult,
  PanelJdbcPrivilegeRequest,
  JdbcTableStructure,
  PanelDatabaseDocumentView,
  PanelJdbcAccountView,
  PanelCapabilitySummary,
  PanelTableFilterItem,
  PanelTableFilterJoin,
  PanelTableRowUpdate,
  PanelTableDataView,
} from "../../api";
import {
  exportDatabaseDocumentToMarkdown,
  exportDatabaseDocumentToWord,
  exportDocumentToPdf,
  exportStructureToMarkdown,
  exportStructureToWord,
} from "../../utils/documentExport";
import JdbcDatabaseDocument from "./JdbcDatabaseDocument.vue";
import JdbcDatasourceProfile from "./JdbcDatasourceProfile.vue";
import JdbcExplainFlow from "./JdbcExplainFlow.vue";

type InspectorTabType =
  | "account"
  | "database-document"
  | "table"
  | "table-edit";
type InspectorViewMode =
  | "account"
  | "data"
  | "ddl"
  | "database-document"
  | "ai"
  | "indexes"
  | "columns";
type PaginationMode = "full" | "pagination";
type EditSection =
  | "changes"
  | "columns"
  | "ddl"
  | "indexes"
  | "foreign-keys"
  | "triggers"
  | "options";
type CommentMode = "comment" | "mixed" | "native";
type RailShape = "default" | "round";
type SortOrder = "" | "asc" | "desc";
type FilterOperator =
  | "contains"
  | "notContains"
  | "equals"
  | "notEquals"
  | "startsWith"
  | "endsWith"
  | "gt"
  | "ge"
  | "lt"
  | "le"
  | "isEmpty"
  | "isNotEmpty"
  | "isNull"
  | "isNotNull";
type EditableColumn = {
  comment: string;
  defaultValue: string;
  name: string;
  nullable: boolean;
  panelPrimary: boolean;
  scale: number | null;
  size: number | null;
  type: string;
};

type DataDraftState = {
  originalRows: Record<string, any>[];
  rows: Record<string, any>[];
};
type PanelDraftRow = {
  __panelRow: Record<string, any>;
  __panelRowIndex: number;
};

interface InspectorTableTab {
  accounts: PanelJdbcAccountView[];
  aiContent: string;
  columnOrder: string[];
  databaseDocument?: PanelDatabaseDocumentView | null;
  dataCommentMode: CommentMode;
  dataResult: PanelTableDataView | null;
  ddlText: string;
  documentContent: string;
  filterKeyword: string;
  filterJoin: PanelTableFilterJoin;
  filters: PanelTableFilterItem[];
  frozenColumns: string[];
  hiddenColumns: string[];
  loadTotal: boolean;
  node: Record<string, any>;
  paginationMode: PaginationMode;
  pageNum: number;
  pageSize: number;
  railShape: RailShape;
  showSequence: boolean;
  sortField: string;
  sortOrder: SortOrder;
  structure: JdbcTableStructure | null;
  tabId: string;
  tabName: string;
  tableCommentMode: CommentMode;
  tabType: InspectorTabType;
  viewMode: InspectorViewMode;
}

const SQL_DRAFT_STORAGE_KEY = "panel:sql-draft:v1";

const props = defineProps<{
  activePath: string;
  activeTabId: string;
  capabilities: PanelCapabilitySummary | null;
  catalogs: string[];
  datasourceMetadata: JdbcConnectionMetadata | null;
  errorMessage: string;
  mysqlProcessRefreshInterval: number;
  previewLimit: number;
  queryResult: JdbcQueryResult | null;
  sqlResultPageNum?: number;
  sqlExplainContent: string;
  sqlExplainRows: Record<string, any>[];
  sqlSuggestions: string[];
  sqlText: string;
  submitting: boolean;
  tableTabs: InspectorTableTab[];
}>();

const emit = defineEmits<{
  (e: "activate-tab", value: string): void;
  (
    e: "change-tab-setting",
    tabId: string,
    patch: Partial<
      Pick<
        InspectorTableTab,
        | "columnOrder"
        | "dataCommentMode"
        | "filterJoin"
        | "filterKeyword"
        | "filters"
        | "frozenColumns"
        | "hiddenColumns"
        | "loadTotal"
        | "paginationMode"
        | "pageNum"
        | "pageSize"
        | "railShape"
        | "showSequence"
        | "sortField"
        | "sortOrder"
        | "tableCommentMode"
        | "viewMode"
      >
    >
  ): void;
  (e: "close-tab", value: string): void;
  (e: "execute"): void;
  (e: "execute-selected", value: string): void;
  (e: "execute-page", page: number): void;
  (e: "explain"): void;
  (e: "generate-sql", prompt: string): void;
  (e: "quick-run", sql: string): void;
  (e: "update-mysql-process-refresh-interval", value: number): void;
  (e: "refresh-mysql-process"): void;
  (e: "kill-mysql-process", processIds: number[]): void;
  (e: "refresh-table-data", tabId: string): void;
  (e: "save-table-design", tabId: string, sql: string): void;
  (
    e: "create-account",
    tabId: string,
    request: PanelJdbcAccountSaveRequest
  ): void;
  (
    e: "update-account",
    tabId: string,
    request: PanelJdbcAccountSaveRequest
  ): void;
  (
    e: "delete-account",
    tabId: string,
    accountName: string,
    host?: string
  ): void;
  (e: "grant-account", tabId: string, request: PanelJdbcPrivilegeRequest): void;
  (
    e: "revoke-account",
    tabId: string,
    request: PanelJdbcPrivilegeRequest
  ): void;
  (e: "save-table-data", tabId: string, updates: PanelTableRowUpdate[]): void;
  (e: "update:sqlText", value: string): void;
}>();

const sqlEditorRef = ref<any>(null);
const editTableRef = ref<any>(null);
const panelDataTableRef = ref<any>(null);
const cellEditorState = reactive({
  visible: false,
  column: '',
  value: null as any,
  fieldType: '',
  fieldName: '',
});

// 列头右键菜单状态
const colHeaderMenuState = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  column: null as { prop: string; label: string } | null,
  columnMeta: null as { type: string; comment: string } | null,
  showColumnType: false,
  showColumnComment: false,
  showDataComment: false,
});

const COL_HEADER_MENU_KEY = computed(
  () => `sc_table_column_header_panel-data-${activeWorkbenchTab.value?.tabId || 'shared'}`
);

const loadColHeaderMenuState = () => {
  try {
    const raw = localStorage.getItem(COL_HEADER_MENU_KEY.value);
    if (raw) {
      const s = JSON.parse(raw);
      colHeaderMenuState.showColumnType = !!s.showColumnType;
      colHeaderMenuState.showColumnComment = !!s.showColumnComment;
      colHeaderMenuState.showDataComment = !!s.showDataComment;
    }
  } catch { /* ignore */ }
};

const saveColHeaderMenuState = () => {
  try {
    localStorage.setItem(COL_HEADER_MENU_KEY.value, JSON.stringify({
      showColumnType: colHeaderMenuState.showColumnType,
      showColumnComment: colHeaderMenuState.showColumnComment,
      showDataComment: colHeaderMenuState.showDataComment,
    }));
  } catch { /* ignore */ }
};

const handleTableShellContextMenu = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  // 表头区域右键 → 列头菜单
  const th = target.closest('th.el-table__cell') as HTMLElement | null;
  if (th) {
    const colKey = th.getAttribute('column-key') || th.getAttribute('data-column-key');
    if (colKey && colKey !== '__panelSequence') {
      openColHeaderMenu(event, colKey);
    } else if (!colKey) {
      // 没有 column-key 的表头（如序列列），用第一个有效列兜底
      const firstCol = activeOrderedDataColumns.value[0];
      if (firstCol) openColHeaderMenu(event, firstCol);
    }
    return;
  }
  // 非表头区域不处理（单元格右键由 @cell-contextmenu 处理）
};

const openColHeaderMenu = (event: MouseEvent, colProp: string) => {
  event.preventDefault();
  const meta = activeColumnMetaMap.value[colProp];
  colHeaderMenuState.column = { prop: colProp, label: resolveColumnHeader(colProp) };
  colHeaderMenuState.columnMeta = meta
    ? { type: String(meta.type || ''), comment: String(meta.comment || meta.remark || '') }
    : null;
  colHeaderMenuState.position = { x: event.clientX + 2, y: event.clientY + 2 };
  colHeaderMenuState.visible = true;
};

const handleColHeaderSortAsc = ({ prop }: { prop: string }) => {
  updateActiveTabSetting({ sortField: prop, sortOrder: 'asc', pageNum: 1, viewMode: 'data' });
};

const handleColHeaderSortDesc = ({ prop }: { prop: string }) => {
  updateActiveTabSetting({ sortField: prop, sortOrder: 'desc', pageNum: 1, viewMode: 'data' });
};

const handleHeaderSortClick = (col: string) => {
  const tab = activeWorkbenchTab.value;
  if (!tab) return;
  const current = tab.sortField === col ? tab.sortOrder : '';
  if (!current) {
    updateActiveTabSetting({ sortField: col, sortOrder: 'asc', pageNum: 1, viewMode: 'data' });
  } else if (current === 'asc') {
    updateActiveTabSetting({ sortField: col, sortOrder: 'desc', pageNum: 1, viewMode: 'data' });
  } else {
    updateActiveTabSetting({ sortField: '', sortOrder: '', pageNum: 1, viewMode: 'data' });
  }
};

// 单元格查看器
const cellViewer = reactive({
  visible: false,
  x: 0,
  y: 0,
  value: null as any,
  column: '',
  mode: 'text' as 'text' | 'image' | 'base64' | 'json',
});

const cellViewerModes = [
  { label: '文本', value: 'text' },
  { label: '图片', value: 'image' },
  { label: 'Base64', value: 'base64' },
  { label: 'JSON', value: 'json' },
];

const cellViewerImageSrc = computed(() => {
  const v = cellViewer.value;
  if (!v) return '';
  const s = String(v);
  if (s.startsWith('data:image')) return s;
  // 尝试 base64 图片
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(s.trim())) {
      return `data:image/png;base64,${s.trim()}`;
    }
  } catch { /* ignore */ }
  return '';
});

const cellViewerBase64Decoded = computed(() => {
  try {
    return atob(String(cellViewer.value ?? ''));
  } catch {
    return '无法解码为 Base64';
  }
});

const cellViewerJsonFormatted = computed(() => {
  try {
    return JSON.stringify(JSON.parse(String(cellViewer.value ?? '')), null, 2);
  } catch {
    return String(cellViewer.value ?? 'NULL');
  }
});

const openCellViewer = (event: MouseEvent, value: any, column: string) => {
  event.preventDefault();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = 360, h = 280;
  cellViewer.x = Math.min(event.clientX + 4, vw - w - 8);
  cellViewer.y = Math.min(event.clientY + 4, vh - h - 8);
  cellViewer.value = value;
  cellViewer.column = column || '';
  // 自动检测模式
  const s = String(value ?? '');
  if (s.startsWith('{') || s.startsWith('[')) {
    cellViewer.mode = 'json';
  } else if (s.startsWith('data:image') || /^[A-Za-z0-9+/=]{20,}$/.test(s.trim())) {
    cellViewer.mode = 'image';
  } else {
    cellViewer.mode = 'text';
  }
  cellViewer.visible = true;
};

// 点击外部关闭查看器
const handleCellViewerOutsideClick = (e: MouseEvent) => {
  if (!cellViewer.visible) return;
  const target = e.target as HTMLElement;
  if (!target.closest('.cell-viewer')) {
    cellViewer.visible = false;
  }
};

const handleColHeaderFilterColumn = ({ prop }: { prop: string }) => {
  // 添加一条针对该列的筛选条件并展开筛选面板
  const nextOperator = getFilterOperators(prop)[0]?.value || 'contains';
  updateAdvancedFilters([
    ...activeTableFilters.value,
    { panelColumnName: prop, panelOperator: nextOperator, panelValue: '' },
  ]);
  panelFilterPanelOpen.value = true;
};

const handleToggleFreezeColumn = ({ col }: { col: string }) => {
  const current = activeFrozenColumns.value;
  const next = current.includes(col)
    ? current.filter(c => c !== col)
    : [...current, col];
  updateActiveTabSetting({ frozenColumns: next });
};
const documentPaperRef = ref<HTMLElement | null>(null);
const panelFilterPanelOpen = ref(false);
const sqlFooterHeight = ref(280);

const startSqlFooterResize = (e: MouseEvent) => {
  e.preventDefault();
  const startY = e.clientY;
  const startH = sqlFooterHeight.value;
  const onMove = (ev: MouseEvent) => {
    const delta = startY - ev.clientY;
    sqlFooterHeight.value = Math.max(120, Math.min(600, startH + delta));
  };
  const onUp = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
};
const aiDialogVisible = ref(false);
const accountDialogVisible = ref(false);
const privilegeDialogVisible = ref(false);
const aiPrompt = ref("");
const accountDialogMode = ref<"create" | "update">("create");
const privilegeDialogMode = ref<"grant" | "revoke">("grant");
const bottomPanel = ref<"message" | "result">("result");
const tableViewState = reactive<Record<string, InspectorViewMode>>({});
const tableEditDrafts = reactive<Record<string, EditableColumn[]>>({});
const tableDataDrafts = reactive<Record<string, DataDraftState>>({});
const accountSelectionState = reactive<Record<string, string>>({});
const editSection = ref<EditSection>("columns");
const hasSelection = ref(false);
const formatPending = ref(false);
const editingCell = reactive<{
  column: string;
  rowIndex: number;
  value: string;
}>({
  column: "",
  rowIndex: -1,
  value: "",
});
const accountForm = reactive<PanelJdbcAccountSaveRequest>({
  panelAccountName: "",
  panelHost: "%",
  panelPassword: "",
});
const accountFormErrors = reactive<Record<string, string>>({
  panelAccountName: "",
  panelPassword: "",
});
const privilegeForm = reactive<PanelJdbcPrivilegeRequest>({
  panelAccountName: "",
  panelCatalogName: "*",
  panelGrantOption: false,
  panelHost: "%",
  panelPrivileges: [],
  panelTableName: "*",
});
const privilegeFormErrors = reactive<Record<string, string>>({
  panelPrivileges: "",
});

const editSectionOptions = [
  { label: "字段", value: "columns" },
  { label: "索引", value: "indexes" },
  { label: "DDL", value: "ddl" },
  { label: "变更", value: "changes" },
  { label: "外键", value: "foreign-keys" },
  { label: "触发器", value: "triggers" },
  { label: "选项", value: "options" },
] satisfies Array<{ label: string; value: EditSection }>;

const workbenchViewOptions = [
  { label: "数据", value: "data" },
  { label: "索引", value: "indexes" },
  { label: "DDL", value: "ddl" },
  { label: "AI", value: "ai" },
] satisfies Array<{ label: string; value: InspectorViewMode }>;

const paginationModeOptions = [
  { label: "分页", value: "pagination" },
  { label: "全部", value: "full" },
] satisfies Array<{ label: string; value: PaginationMode }>;

const commentModeOptions = [
  { label: "原生", value: "native" },
  { label: "注释", value: "comment" },
  { label: "混合", value: "mixed" },
] satisfies Array<{ label: string; value: CommentMode }>;

const railShapeOptions = [
  { label: "默认", value: "default" },
  { label: "圆形", value: "round" },
] satisfies Array<{ label: string; value: RailShape }>;

const filterOperatorOptions = {
  boolean: [
    { label: "等于", value: "equals" },
    { label: "不等于", value: "notEquals" },
    { label: "为空", value: "isNull" },
    { label: "非空", value: "isNotNull" },
  ],
  date: [
    { label: "等于", value: "equals" },
    { label: "不等于", value: "notEquals" },
    { label: "大于", value: "gt" },
    { label: "大于等于", value: "ge" },
    { label: "小于", value: "lt" },
    { label: "小于等于", value: "le" },
    { label: "为空", value: "isNull" },
    { label: "非空", value: "isNotNull" },
  ],
  number: [
    { label: "等于", value: "equals" },
    { label: "不等于", value: "notEquals" },
    { label: "大于", value: "gt" },
    { label: "大于等于", value: "ge" },
    { label: "小于", value: "lt" },
    { label: "小于等于", value: "le" },
    { label: "为空", value: "isNull" },
    { label: "非空", value: "isNotNull" },
  ],
  text: [
    { label: "包含", value: "contains" },
    { label: "不包含", value: "notContains" },
    { label: "等于", value: "equals" },
    { label: "不等于", value: "notEquals" },
    { label: "开头是", value: "startsWith" },
    { label: "结尾是", value: "endsWith" },
    { label: "空串", value: "isEmpty" },
    { label: "非空串", value: "isNotEmpty" },
    { label: "为空", value: "isNull" },
    { label: "非空", value: "isNotNull" },
  ],
} satisfies Record<
  "boolean" | "date" | "number" | "text",
  Array<{ label: string; value: FilterOperator }>
>;

const valuelessFilterOperators = new Set<FilterOperator>([
  "isEmpty",
  "isNotEmpty",
  "isNull",
  "isNotNull",
]);

const activeWorkbenchTab = computed(
  () => props.tableTabs.find((item) => item.tabId === props.activeTabId) || null
);
const workbenchHeaderLabel = computed(() => {
  if (activeWorkbenchTab.value?.tabType === "table-edit") {
    return "TABLE DESIGN";
  }
  if (activeWorkbenchTab.value?.tabType === "account") {
    return "ACCOUNT CENTER";
  }
  if (activeWorkbenchTab.value?.tabType === "database-document") {
    return "DATABASE DOCUMENT";
  }
  return "TABLE WORKBENCH";
});

const activeColumns = computed(
  () => activeWorkbenchTab.value?.structure?.columns || []
);
const activeIndexes = computed(
  () => activeWorkbenchTab.value?.structure?.indexes || []
);
const activeTriggers = computed(
  () => activeWorkbenchTab.value?.structure?.triggers || []
);
const activeDataColumns = computed(
  () => activeWorkbenchTab.value?.dataResult?.panelColumns || []
);
const activeColumnMetaMap = computed(() =>
  activeColumns.value.reduce(
    (acc, column) => {
      const key = String(column.name || "");
      if (key) {
        acc[key] = column;
      }
      return acc;
    },
    {} as Record<string, Record<string, any>>
  )
);
const activeColumnMeta = computed(() =>
  activeColumns.value.map(col => ({
    name: String(col.name || ''),
    type: String(col.type || ''),
    comment: String(col.comment || col.remark || ''),
  }))
);
const resolveFilterColumnFamily = (columnName: string) => {
  const rawType = String(activeColumnMetaMap.value[columnName]?.type || "")
    .trim()
    .toLowerCase();
  if (
    rawType.includes("int") ||
    rawType.includes("decimal") ||
    rawType.includes("numeric") ||
    rawType.includes("double") ||
    rawType.includes("float") ||
    rawType.includes("real") ||
    rawType.includes("serial")
  ) {
    return "number" as const;
  }
  if (
    rawType.includes("date") ||
    rawType.includes("time") ||
    rawType.includes("year")
  ) {
    return "date" as const;
  }
  if (
    rawType.includes("bool") ||
    rawType === "bit" ||
    rawType === "boolean"
  ) {
    return "boolean" as const;
  }
  return "text" as const;
};
const activeFilterableColumns = computed(() =>
  activeDataColumns.value.map((column) => ({
    label: resolveColumnHeader(column),
    typeFamily: resolveFilterColumnFamily(column),
    value: column,
  }))
);
const activeTableFilters = computed(
  () => activeWorkbenchTab.value?.filters || []
);
const activeTableFilterJoin = computed<PanelTableFilterJoin>({
  get() {
    return activeWorkbenchTab.value?.filterJoin || "and";
  },
  set(value) {
    updateActiveTabSetting({
      filterJoin: value,
      pageNum: 1,
      viewMode: "data",
    });
  },
});
const activeFilterCount = computed(() =>
  activeTableFilters.value.filter(
    (item) =>
      item?.panelColumnName &&
      (valuelessFilterOperators.has(
        (item?.panelOperator || "contains") as FilterOperator
      ) ||
        String(item?.panelValue || "").trim())
  ).length
);
const showAdvancedFilterPanel = computed(
  () => panelFilterPanelOpen.value || activeTableFilters.value.length > 0
);
const activeDataDraft = computed(() => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table") {
    return null;
  }
  return tableDataDrafts[tab.tabId] || null;
});
const activeDataRows = computed(() => activeDataDraft.value?.rows || []);
const activeDisplayRows = computed(() => {
  const draft = activeDataDraft.value;
  if (!draft) {
    return [] as PanelDraftRow[];
  }
  return draft.rows
    .map((row, index) => ({
      __panelRow: row,
      __panelRowIndex: index,
    })) as PanelDraftRow[];
});
const activeDataTablePayload = computed(() => ({
  data: activeDisplayRows.value,
  total: activeDisplayRows.value.length,
}));
const activeAccounts = computed(() => activeWorkbenchTab.value?.accounts || []);
const activeGrantCount = computed(() =>
  activeAccounts.value.reduce(
    (count, item) => count + (item.panelGrants || []).length,
    0
  )
);
const activeAccountHosts = computed(() => [
  ...new Set(activeAccounts.value.map((item) => item.panelHost || "%")),
]);
const activeSelectedAccountKey = computed(() => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "account") {
    return "";
  }
  return accountSelectionState[tab.tabId] || "";
});
const activeSelectedAccount = computed(
  () =>
    activeAccounts.value.find(
      (item) => buildAccountKey(item) === activeSelectedAccountKey.value
    ) ||
    activeAccounts.value[0] ||
    null
);
const activeSelectedAccountGrantCount = computed(
  () => (activeSelectedAccount.value?.panelGrants || []).length
);
const activeSelectedGrantText = computed(() =>
  (activeSelectedAccount.value?.panelGrants || []).join("\n")
);
const activeDataDirtyCount = computed(() => {
  const draft = activeDataDraft.value;
  if (!draft) {
    return 0;
  }
  return draft.rows.reduce((count, row, index) => {
    const original = draft.originalRows[index] || {};
    return JSON.stringify(row) === JSON.stringify(original) ? count : count + 1;
  }, 0);
});
const activeFrozenColumns = computed(
  () => activeWorkbenchTab.value?.frozenColumns || []
);
const activeHiddenColumns = computed(
  () => activeWorkbenchTab.value?.hiddenColumns || []
);
const activeOrderedDataColumns = computed(() => {
  const sourceColumns = activeDataColumns.value;
  const orderedColumns = activeWorkbenchTab.value?.columnOrder || [];
  const resolvedOrder = orderedColumns.filter((column) =>
    sourceColumns.includes(column)
  );
  return [
    ...resolvedOrder,
    ...sourceColumns.filter((column) => !resolvedOrder.includes(column)),
  ];
});
const railRound = computed(
  () => activeWorkbenchTab.value?.railShape === "round"
);
const railIconByTabType = (tabType: InspectorTabType) => {
  if (tabType === "table-edit") {
    return markRaw(EditPen);
  }
  if (tabType === "database-document") {
    return markRaw(Document);
  }
  return markRaw(Tickets);
};
const railTabs = computed(() => [
  {
    icon: markRaw(Monitor),
    name: "workspace",
    title: "工作区",
  },
  {
    icon: markRaw(DataAnalysis),
    name: "metadata",
    title: "数据源信息",
  },
  {
    icon: markRaw(DCaret),
    name: "mysql-process",
    title: "MySQL 进程",
  },
  ...props.tableTabs.map((tab) => ({
    closable: true,
    icon: railIconByTabType(tab.tabType),
    name: tab.tabId,
    title: tab.tabName,
  })),
]);
const railTabValue = computed<string>({
  get() {
    return String(props.activeTabId || "workspace");
  },
  set(value) {
    emit("activate-tab", value);
  },
});
const isMysqlDatasource = computed(() => {
  const product = String(props.datasourceMetadata?.databaseProductName || "").toLowerCase();
  return product.includes("mysql") || product.includes("mariadb");
});

const handleLoadMysqlProcess = () => {
  emit("refresh-mysql-process");
};

const selectedMysqlProcessIds = ref<number[]>([]);

const mysqlProcessRefreshOptions = [
  { label: "0s（关闭）", value: 0, icon: "ri:stop-circle-line" },
  { label: "5s", value: 5000, icon: "ri:timer-2-line" },
  { label: "10s", value: 10000, icon: "ri:timer-line" },
  { label: "30s", value: 30000, icon: "ri:alarm-line" },
  { label: "60s", value: 60000, icon: "ri:time-line" },
];

const handleMysqlProcessSelectionChange = (rows: Record<string, any>[]) => {
  const ids = (rows || [])
    .map((row) => Number(row?.Id ?? row?.id ?? row?.ID))
    .filter((id) => Number.isFinite(id) && id > 0);
  selectedMysqlProcessIds.value = ids;
};

const handleKillMysqlProcessRow = (row: Record<string, any>) => {
  const processId = Number(row?.Id ?? row?.id ?? row?.ID);
  if (!Number.isFinite(processId) || processId <= 0) {
    return;
  }
  emit("kill-mysql-process", [processId]);
};

const handleKillMysqlProcessBatch = () => {
  if (!selectedMysqlProcessIds.value.length) {
    return;
  }
  emit("kill-mysql-process", [...selectedMysqlProcessIds.value]);
};

const handleMysqlProcessIntervalChange = (value: unknown) => {
  const interval = Number(value);
  if (!Number.isFinite(interval) || interval < 0) {
    return;
  }
  emit("update-mysql-process-refresh-interval", interval);
};
const tablePath = computed(() =>
  [
    activeWorkbenchTab.value?.structure?.catalogName ||
      activeWorkbenchTab.value?.node?.catalogName,
    activeWorkbenchTab.value?.structure?.schemaName ||
      activeWorkbenchTab.value?.node?.schemaName,
    activeWorkbenchTab.value?.structure?.tableName ||
      activeWorkbenchTab.value?.tabName,
  ]
    .filter(Boolean)
    .join(".")
);
const activeEditableColumns = computed(() => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return [];
  }
  ensureTableEditDraft(tab);
  return tableEditDrafts[tab.tabId] || [];
});
const editableTypeOptions = computed(() => {
  const options = new Set([
    "bigint",
    "boolean",
    "date",
    "datetime",
    "decimal",
    "double",
    "int",
    "json",
    "text",
    "timestamp",
    "tinyint",
    "varchar",
  ]);
  [...activeColumns.value, ...activeEditableColumns.value].forEach((column) => {
    const rawType = String(column.type || "")
      .trim()
      .toLowerCase();
    if (!rawType) {
      return;
    }
    options.add(rawType);
    options.add(rawType.replace(/\(.+\)$/, ""));
  });
  return [...options];
});
const activeEditDdl = computed(() => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return "";
  }
  return buildEditableDdl(tab);
});
const activeAlterSql = computed(() => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return "";
  }
  return buildAlterSql(tab);
});
const tableCommentTab = computed<CommentMode>({
  get() {
    return activeWorkbenchTab.value?.tableCommentMode || "native";
  },
  set(value) {
    updateActiveTabSetting({ tableCommentMode: value });
  },
});
const dataCommentTab = computed<CommentMode>({
  get() {
    return activeWorkbenchTab.value?.dataCommentMode || "native";
  },
  set(value) {
    updateActiveTabSetting({ dataCommentMode: value });
  },
});
const railShapeTab = computed<RailShape>({
  get() {
    return activeWorkbenchTab.value?.railShape || "default";
  },
  set(value) {
    updateActiveTabSetting({ railShape: value });
  },
});
const paginationModeTab = computed<PaginationMode>({
  get() {
    return activeWorkbenchTab.value?.paginationMode || "pagination";
  },
  set(value) {
    handlePaginationModeChange(value);
  },
});
const tableFilterKeyword = computed<string>({
  get() {
    return activeWorkbenchTab.value?.filterKeyword || "";
  },
  set(value) {
    updateActiveTabSetting({
      filterKeyword: value,
      pageNum: 1,
      viewMode: "data",
    });
  },
});

const createEmptyAdvancedFilter = (): PanelTableFilterItem => ({
  panelColumnName: activeFilterableColumns.value[0]?.value || "",
  panelOperator: "contains",
  panelValue: "",
});

const getFilterOperators = (columnName: string) =>
  filterOperatorOptions[resolveFilterColumnFamily(columnName)];

const isValuelessFilterOperator = (operator: string) =>
  valuelessFilterOperators.has((operator || "contains") as FilterOperator);

const toggleAdvancedFilterPanel = () => {
  panelFilterPanelOpen.value = !panelFilterPanelOpen.value;
};

const updateAdvancedFilters = (filters: PanelTableFilterItem[]) => {
  updateActiveTabSetting({
    filters,
    pageNum: 1,
    viewMode: "data",
  });
};

const handleAddAdvancedFilter = () => {
  updateAdvancedFilters([...activeTableFilters.value, createEmptyAdvancedFilter()]);
  panelFilterPanelOpen.value = true;
};

const handleAdvancedFilterJoinChange = (value: string) => {
  updateActiveTabSetting({
    filterJoin: value === "or" ? "or" : "and",
    pageNum: 1,
    viewMode: "data",
  });
};

const handleClearAdvancedFilters = () => {
  updateActiveTabSetting({
    filterJoin: "and",
    filters: [],
    pageNum: 1,
    viewMode: "data",
  });
};

const handleRemoveAdvancedFilter = (index: number) => {
  updateAdvancedFilters(
    activeTableFilters.value.filter((_, currentIndex) => currentIndex !== index)
  );
};

const handleAdvancedFilterColumnChange = (index: number, columnName: string) => {
  const nextFilters = activeTableFilters.value.map((item, currentIndex) => {
    if (currentIndex !== index) {
      return item;
    }
    const nextOperator = getFilterOperators(columnName)[0]?.value || "contains";
    return {
      ...item,
      panelColumnName: columnName,
      panelOperator: nextOperator,
      panelValue: "",
    };
  });
  updateAdvancedFilters(nextFilters);
};

const handleAdvancedFilterOperatorChange = (
  index: number,
  operator: string
) => {
  const nextOperator = (operator || "contains") as FilterOperator;
  const nextFilters = activeTableFilters.value.map((item, currentIndex) =>
    currentIndex !== index
      ? item
      : {
          ...item,
          panelOperator: nextOperator,
          panelValue: valuelessFilterOperators.has(nextOperator)
            ? ""
            : item.panelValue || "",
        }
  );
  updateAdvancedFilters(nextFilters);
};

const handleAdvancedFilterValueChange = (index: number, value: string) => {
  const nextFilters = activeTableFilters.value.map((item, currentIndex) =>
    currentIndex !== index
      ? item
      : {
          ...item,
          panelValue: value,
        }
  );
  updateAdvancedFilters(nextFilters);
};

const tableView = computed<InspectorViewMode>({
  get() {
    const tab = activeWorkbenchTab.value;
    if (!tab) {
      return "data";
    }
    return tableViewState[tab.tabId] || tab.viewMode || "data";
  },
  set(value) {
    const tab = activeWorkbenchTab.value;
    if (!tab) {
      return;
    }
    tableViewState[tab.tabId] = value;
    emit("change-tab-setting", tab.tabId, { viewMode: value });
  },
});

const editSectionLabel = computed(
  () =>
    editSectionOptions.find((item) => item.value === editSection.value)
      ?.label || "当前页"
);

const activeColumnCommentMap = computed(() =>
  activeColumns.value.reduce(
    (acc, column) => {
      const key = String(column.name || "");
      if (key) {
        acc[key] = String(column.comment || "");
      }
      return acc;
    },
    {} as Record<string, string>
  )
);

const codeMirrorHints = computed(() =>
  props.sqlSuggestions.reduce(
    (acc, label) => {
      if (label) {
        acc[label] = [];
      }
      return acc;
    },
    {} as Record<string, string[]>
  )
);

const measureQueryResultColumnWidth = (column: string, rows: Record<string, any>[]) => {
  const samples = rows.slice(0, 20).map((row) => String(row?.[column] ?? "-"));
  const maxLength = Math.max(
    String(column || "").length,
    ...samples.map((value) => value.length),
  );
  return Math.min(Math.max(maxLength * 12, 160), 320);
};
const measurePanelDataColumnWidth = (column: string, rows: PanelDraftRow[]) => {
  const samples = rows
    .slice(0, 20)
    .map((row) => String(row?.__panelRow?.[column] ?? "-"));
  const maxLength = Math.max(
    String(resolveColumnHeader(column) || column).length,
    ...samples.map((value) => value.length),
  );
  return Math.min(Math.max(maxLength * 12, 160), 320);
};

const queryResultVirtualColumns = computed(() =>
  (props.queryResult?.columns || []).map((column) => ({
    key: column,
    dataKey: column,
    title: column,
    width: measureQueryResultColumnWidth(column, props.queryResult?.rows || []),
    cellRenderer: ({ cellData }: { cellData: unknown }) =>
      String(cellData ?? "-"),
  }))
);

const queryResultVirtualRows = computed(() => props.queryResult?.rows || []);
const activeDataTableColumns = computed(() => {
  const currentEditingCell = `${editingCell.rowIndex}:${editingCell.column}`;
  const currentDataCommentMode =
    activeWorkbenchTab.value?.dataCommentMode || "native";
  void currentEditingCell;
  void currentDataCommentMode;
  const rows = activeDisplayRows.value;
  const columns: Array<Record<string, any>> = [];

  if (activeWorkbenchTab.value?.showSequence) {
    columns.push({
      align: "center",
      fixed: "left",
      formatter: (row: PanelDraftRow) => resolveSequence(row.__panelRowIndex),
      label: "#",
      prop: "__panelSequence",
      width: 60,
    });
  }

  activeOrderedDataColumns.value.forEach((column) => {
    columns.push({
      fixed: resolveColumnFixed(column) || undefined,
      formatter: (row: PanelDraftRow) => renderPanelDataCell(row, column),
      hide: activeHiddenColumns.value.includes(column),
      label: resolveColumnHeader(column),
      prop: column,
      sortable: false,
      width: measurePanelDataColumnWidth(column, rows),
    });
  });

  return columns;
});

const buildAccountKey = (account: PanelJdbcAccountView) =>
  `${account.panelAccountName || ""}@${account.panelHost || "%"}`;

const stripDraftRowMeta = (row: Record<string, any>) => {
  const nextRow = { ...(row || {}) };
  delete nextRow.__panelNewRow;
  return nextRow;
};

const cloneRows = (rows: Record<string, any>[]) =>
  JSON.parse(JSON.stringify((rows || []).map(stripDraftRowMeta))) as Record<
    string,
    any
  >[];

const editorOptions = computed(() => ({
  completeSingle: false,
  lineNumbers: true,
  lineWrapping: true,
  tabSize: 2,
  tables: codeMirrorHints.value,
}));

const buildEditableColumns = (tab: InspectorTableTab): EditableColumn[] =>
  (tab.structure?.columns || []).map((column) => ({
    comment: String(column.comment || ""),
    defaultValue: String(column.defaultValue || ""),
    name: String(column.name || ""),
    nullable: Boolean(column.nullable),
    panelPrimary: (tab.structure?.primaryKeys || []).includes(
      String(column.name || "")
    ),
    scale:
      column.scale === undefined || column.scale === null
        ? null
        : Number(column.scale),
    size:
      column.size === undefined || column.size === null
        ? null
        : Number(column.size),
    type: String(column.type || ""),
  }));

const ensureTableEditDraft = (tab: InspectorTableTab) => {
  if (tab.tabType !== "table-edit") {
    return;
  }
  const currentDraft = tableEditDrafts[tab.tabId];
  const sourceColumns = tab.structure?.columns || [];
  if (currentDraft?.length) {
    return;
  }
  if (!currentDraft || sourceColumns.length) {
    tableEditDrafts[tab.tabId] = buildEditableColumns(tab);
  }
};

const ensureTableDataDraft = (tab: InspectorTableTab) => {
  if (tab.tabType !== "table") {
    return;
  }
  const rows = tab.dataResult?.panelRows || [];
  const nextRows = JSON.parse(JSON.stringify(rows || [])) as Record<
    string,
    any
  >[];
  tableDataDrafts[tab.tabId] = {
    originalRows: rows.map((row) =>
      row?.__panelNewRow ? {} : stripDraftRowMeta(row)
    ),
    rows: nextRows,
  };
};

const escapeSqlString = (value: string) => value.replace(/'/g, "''");

const buildEditableColumnType = (column: EditableColumn) => {
  const baseType = String(column.type || "varchar").trim();
  if (!baseType) {
    return "varchar(255)";
  }
  if (baseType.includes("(") && baseType.includes(")")) {
    return baseType;
  }
  if (column.size === null || Number.isNaN(column.size)) {
    return baseType;
  }
  if (column.scale === null || Number.isNaN(column.scale)) {
    return `${baseType}(${column.size})`;
  }
  return `${baseType}(${column.size}, ${column.scale})`;
};

const buildEditableDdl = (tab: InspectorTableTab) => {
  const draftRows = (tableEditDrafts[tab.tabId] || []).filter((row) =>
    row.name.trim()
  );
  if (!draftRows.length) {
    return "";
  }
  const qualifiedTableName = buildQualifiedTableName(tab);
  const columnLines = draftRows.map((row) => {
    const parts = [`  ${row.name} ${buildEditableColumnType(row)}`];
    if (!row.nullable) {
      parts.push("not null");
    }
    if (row.defaultValue.trim()) {
      parts.push(`default '${escapeSqlString(row.defaultValue.trim())}'`);
    }
    if (row.comment.trim()) {
      parts.push(`comment '${escapeSqlString(row.comment.trim())}'`);
    }
    return parts.join(" ");
  });
  const primaryKeys = draftRows
    .filter((row) => row.panelPrimary && row.name.trim())
    .map((row) => row.name.trim());
  const primaryClause = primaryKeys.length
    ? `,\n  primary key (${primaryKeys.join(", ")})`
    : "";
  return `create table ${qualifiedTableName} (\n${columnLines.join(",\n")}${primaryClause}\n);`;
};

const normalizeEditableColumn = (column: EditableColumn) => ({
  comment: String(column.comment || "").trim(),
  defaultValue: String(column.defaultValue || "").trim(),
  name: String(column.name || "").trim(),
  nullable: Boolean(column.nullable),
  panelPrimary: Boolean(column.panelPrimary),
  scale:
    column.scale === null || Number.isNaN(column.scale)
      ? null
      : Number(column.scale),
  size:
    column.size === null || Number.isNaN(column.size)
      ? null
      : Number(column.size),
  type: String(column.type || "")
    .trim()
    .toLowerCase(),
});

const buildQualifiedTableName = (tab: InspectorTableTab) =>
  [
    tab.structure?.catalogName || tab.node?.catalogName,
    tab.structure?.schemaName || tab.node?.schemaName,
    tab.structure?.tableName || tab.tabName,
  ]
    .filter(Boolean)
    .join(".");

const buildColumnClause = (row: EditableColumn) => {
  const parts = [`${row.name} ${buildEditableColumnType(row)}`];
  if (!row.nullable) {
    parts.push("not null");
  }
  if (String(row.defaultValue || "").trim()) {
    parts.push(`default '${escapeSqlString(String(row.defaultValue).trim())}'`);
  }
  if (String(row.comment || "").trim()) {
    parts.push(`comment '${escapeSqlString(String(row.comment).trim())}'`);
  }
  return parts.join(" ");
};

const arraysEqual = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((item, index) => item === right[index]);

const buildAlterSql = (tab: InspectorTableTab) => {
  const qualifiedTableName = buildQualifiedTableName(tab);
  const originalColumns = buildEditableColumns(tab).map(
    normalizeEditableColumn
  );
  const draftColumns = (tableEditDrafts[tab.tabId] || [])
    .map(normalizeEditableColumn)
    .filter((row) => row.name);
  const originalMap = new Map(
    originalColumns.map((column) => [column.name, column])
  );
  const draftMap = new Map(draftColumns.map((column) => [column.name, column]));
  const statements: string[] = [];

  originalColumns.forEach((column) => {
    if (!draftMap.has(column.name)) {
      statements.push(
        `alter table ${qualifiedTableName} drop column ${column.name};`
      );
    }
  });

  draftColumns.forEach((column) => {
    const original = originalMap.get(column.name);
    if (!original) {
      statements.push(
        `alter table ${qualifiedTableName} add column ${buildColumnClause(column)};`
      );
      return;
    }
    const changed =
      JSON.stringify({
        ...column,
        panelPrimary: false,
      }) !==
      JSON.stringify({
        ...original,
        panelPrimary: false,
      });
    if (changed) {
      statements.push(
        `alter table ${qualifiedTableName} modify column ${buildColumnClause(column)};`
      );
    }
  });

  const originalPrimaryKeys = originalColumns
    .filter((column) => column.panelPrimary)
    .map((column) => column.name);
  const draftPrimaryKeys = draftColumns
    .filter((column) => column.panelPrimary)
    .map((column) => column.name);
  if (!arraysEqual(originalPrimaryKeys, draftPrimaryKeys)) {
    if (originalPrimaryKeys.length) {
      statements.push(`alter table ${qualifiedTableName} drop primary key;`);
    }
    if (draftPrimaryKeys.length) {
      statements.push(
        `alter table ${qualifiedTableName} add primary key (${draftPrimaryKeys.join(", ")});`
      );
    }
  }

  return statements.join("\n");
};

watch(
  () => props.tableTabs,
  (tabs) => {
    tabs.forEach((tab) => {
      tableViewState[tab.tabId] =
        tableViewState[tab.tabId] || tab.viewMode || "data";
      ensureTableEditDraft(tab);
      if (tab.tabType === "table") {
        ensureTableDataDraft(tab);
      }
    });
  },
  { deep: true, immediate: true }
);

watch(
  activeWorkbenchTab,
  (tab) => {
    if (!tab) {
      return;
    }
    ensureTableEditDraft(tab);
    if (tab.tabType === "table-edit") {
      if (tab.viewMode === "indexes") {
        editSection.value = "indexes";
        return;
      }
      if (tab.viewMode === "ddl") {
        editSection.value = "ddl";
        return;
      }
      if (tab.viewMode === "columns") {
        editSection.value = "columns";
        return;
      }
      editSection.value = "columns";
    }
    if (tab.tabType === "table") {
      ensureTableDataDraft(tab);
    }
    if (tab.tabType === "account" && activeAccounts.value.length) {
      const currentKey = accountSelectionState[tab.tabId];
      const fallbackKey = buildAccountKey(activeAccounts.value[0]);
      accountSelectionState[tab.tabId] = activeAccounts.value.some(
        (item) => buildAccountKey(item) === currentKey
      )
        ? currentKey
        : fallbackKey;
    }
  },
  { immediate: true }
);

watch(
  () => activeWorkbenchTab.value?.tabId || "",
  () => {
    panelFilterPanelOpen.value = activeTableFilters.value.length > 0;
  },
  { immediate: true }
);

watch(
  activeAccounts,
  (accounts) => {
    const tab = activeWorkbenchTab.value;
    if (!tab || tab.tabType !== "account" || !accounts.length) {
      return;
    }
    const currentKey = accountSelectionState[tab.tabId];
    if (
      !currentKey ||
      !accounts.some((item) => buildAccountKey(item) === currentKey)
    ) {
      accountSelectionState[tab.tabId] = buildAccountKey(accounts[0]);
    }
  },
  { deep: true, immediate: true }
);

const syncSelectionState = () => {
  hasSelection.value = !!String(
    sqlEditorRef.value?.coder?.getSelection?.() || ""
  ).trim();
};

const handleEditorInput = () => {
  sqlEditorRef.value?.upgradeHits?.(codeMirrorHints.value);
  syncSelectionState();
};

const getSelectedSql = () =>
  String(sqlEditorRef.value?.coder?.getSelection?.() || "").trim();

const updateActiveTabSetting = (
  patch: Partial<
    Pick<
      InspectorTableTab,
      | "columnOrder"
      | "dataCommentMode"
      | "filterJoin"
      | "filterKeyword"
      | "filters"
      | "frozenColumns"
      | "hiddenColumns"
      | "loadTotal"
      | "paginationMode"
      | "pageNum"
      | "pageSize"
      | "railShape"
      | "showSequence"
      | "sortField"
      | "sortOrder"
      | "tableCommentMode"
      | "viewMode"
    >
  >
) => {
  const tab = activeWorkbenchTab.value;
  if (!tab) {
    return;
  }
  emit("change-tab-setting", tab.tabId, patch);
};

const handleRefreshActiveTable = () => {
  if (!activeWorkbenchTab.value) {
    return;
  }
  cancelCellEdit();
  emit("refresh-table-data", activeWorkbenchTab.value.tabId);
};

const handlePaginationModeChange = (mode: PaginationMode) => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table") {
    return;
  }
  updateActiveTabSetting({
    paginationMode: mode,
    pageNum: 1,
    pageSize:
      mode === "full"
        ? Math.max(props.previewLimit, tab.pageSize || 100)
        : tab.pageSize || 100,
    viewMode: "data",
  });
};

const handleRailTabRemove = (name: string | number) => {
  emit("close-tab", String(name));
};

const handlePanelTableColumnConfigChange = (
  columns: Array<Record<string, any>>,
  detail?: {
    columnOrder?: string[];
    frozenColumns?: string[];
    hiddenColumns?: string[];
  }
) => {
  const nextColumns =
    detail?.columnOrder?.length ||
    detail?.frozenColumns?.length ||
    detail?.hiddenColumns?.length
      ? null
      : (columns || []).filter(
          (column) => String(column?.prop || "") !== "__panelSequence"
        );
  updateActiveTabSetting({
    columnOrder:
      detail?.columnOrder ||
      nextColumns?.map((column) => String(column?.prop || "")).filter(Boolean) ||
      [],
    frozenColumns:
      detail?.frozenColumns ||
      nextColumns
        ?.filter((column) => Boolean(column?.fixed))
        .map((column) => String(column?.prop || ""))
        .filter(Boolean) ||
      [],
    hiddenColumns:
      detail?.hiddenColumns ||
      nextColumns
        ?.filter((column) => Boolean(column?.hide))
        .map((column) => String(column?.prop || ""))
        .filter(Boolean) ||
      [],
  });
};

const normalizeTableSortOrder = (order?: string | null): SortOrder => {
  if (order === "asc" || order === "ascending") {
    return "asc";
  }
  if (order === "desc" || order === "descending") {
    return "desc";
  }
  return "";
};
const handlePanelTableSortChange = (payload: {
  order?: string | null;
  prop?: string;
}, detail?: {
  sortField?: string;
  sortOrder?: SortOrder;
}) => {
  const nextOrder = detail?.sortOrder || normalizeTableSortOrder(payload?.order);
  updateActiveTabSetting({
    pageNum: 1,
    sortField:
      detail?.sortField || (nextOrder && payload?.prop ? payload.prop : ""),
    sortOrder: nextOrder,
    viewMode: "data",
  });
};

const handleCellDblClick = (row: any, column: any) => {
  const colName = column?.property || column?.prop || '';
  if (!colName) return;
  const meta = activeColumnMetaMap.value[colName];
  cellEditorState.visible = true;
  cellEditorState.column = colName;
  cellEditorState.value = row?.[colName] ?? null;
  cellEditorState.fieldType = String(meta?.type || '');
  cellEditorState.fieldName = colName;
};

const handleCellEditorSave = ({ fieldName, value }: { fieldName: string; value: any }) => {
  const tab = activeWorkbenchTab.value;
  if (!tab?.tabId) return;
  emit('save-table-data', tab.tabId, []);
};

let editTableSortable: Sortable | null = null;

const destroyEditTableSortable = () => {
  if (!editTableSortable) {
    return;
  }
  editTableSortable.destroy();
  editTableSortable = null;
};

const moveEditableColumn = (oldIndex: number, newIndex: number) => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return;
  }
  const current = [...(tableEditDrafts[tab.tabId] || [])];
  if (
    oldIndex < 0 ||
    newIndex < 0 ||
    oldIndex >= current.length ||
    newIndex >= current.length ||
    oldIndex === newIndex
  ) {
    return;
  }
  const [moved] = current.splice(oldIndex, 1);
  current.splice(newIndex, 0, moved);
  tableEditDrafts[tab.tabId] = current;
};

const setupEditTableSortable = async () => {
  const tab = activeWorkbenchTab.value;
  if (
    !tab ||
    tab.tabType !== "table-edit" ||
    editSection.value !== "columns" ||
    activeEditableColumns.value.length <= 1
  ) {
    destroyEditTableSortable();
    return;
  }
  await nextTick();
  const tbody = editTableRef.value?.$el?.querySelector?.(
    ".el-table__body-wrapper tbody"
  ) as HTMLElement | null;
  if (!tbody) {
    destroyEditTableSortable();
    return;
  }
  destroyEditTableSortable();
  editTableSortable = Sortable.create(tbody, {
    animation: 180,
    ghostClass: "table-edit-row--ghost",
    handle: ".table-edit__drag",
    onEnd: ({ newIndex, oldIndex }) => {
      if (
        typeof oldIndex !== "number" ||
        typeof newIndex !== "number"
      ) {
        return;
      }
      moveEditableColumn(oldIndex, newIndex);
    },
  });
};

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  return String(value);
};

const isDirtyCell = (rowIndex: number, column: string) => {
  const draft = activeDataDraft.value;
  if (!draft) return false;
  const current = draft.rows[rowIndex];
  const original = draft.originalRows[rowIndex];
  if (!current || !original) return false;
  return JSON.stringify(current[column]) !== JSON.stringify(original[column]);
};

const handleEditAnnotation = ({ prop, currentComment }: { prop: string; currentComment: string }) => {
  // 暂时用 ElMessage 提示，后续可扩展为弹窗编辑
  ElMessage.info(`编辑注解：${prop}（当前：${currentComment || '无'}）`);
};
const handlePanelCellKeydown = (event: Event | KeyboardEvent) => {
  if (!(event instanceof KeyboardEvent)) {
    return;
  }
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    commitCellEdit();
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    cancelCellEdit();
  }
};
const renderPanelDataCell = (row: PanelDraftRow, column: string) => {
  if (isEditingCell(row.__panelRowIndex, column)) {
    return h("div", { class: ["data-cell", "data-cell--editing"] }, [
      h(ElInput, {
        "onUpdate:modelValue": (value: string) => {
          editingCell.value = value;
        },
        autosize: { minRows: 1, maxRows: 1 },
        autofocus: true,
        class: "data-cell__editor",
        modelValue: editingCell.value,
        onBlur: commitCellEdit,
        onKeydown: handlePanelCellKeydown,
        resize: "none",
        size: "small",
        type: "textarea",
      }),
    ]);
  }

  const comment = resolveCellComment(column);
  return h(
    "div",
    {
      class: "data-cell",
      onClick: () => activateCellEdit(row.__panelRowIndex, column),
    },
    [
      h("div", { class: "data-cell__content" }, [
        h("span", { class: "data-cell__value" }, formatCellValue(row.__panelRow[column])),
        comment ? h("small", comment) : null,
      ]),
    ],
  );
};

const isEditingCell = (rowIndex: number, column: string) =>
  editingCell.rowIndex === rowIndex && editingCell.column === column;

const resolveColumnFixed = (column: string) =>
  activeFrozenColumns.value.includes(column) ? "left" : false;

const resolveSequence = (rowIndex: number) => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.paginationMode === "full") {
    return rowIndex + 1;
  }
  return (
    (Math.max(tab.pageNum, 1) - 1) * Math.max(tab.pageSize, 1) + rowIndex + 1
  );
};

const activateCellEdit = (rowIndex: number, column: string) => {
  if (!isEditingCell(rowIndex, column) && editingCell.rowIndex >= 0) {
    commitCellEdit();
  }
  const row = activeDataRows.value[rowIndex];
  if (!row) {
    return;
  }
  editingCell.rowIndex = rowIndex;
  editingCell.column = column;
  editingCell.value =
    row[column] === null || row[column] === undefined
      ? ""
      : String(row[column]);
};

const commitCellEdit = () => {
  if (editingCell.rowIndex < 0 || !editingCell.column) {
    return;
  }
  const row = activeDataRows.value[editingCell.rowIndex];
  if (row) {
    row[editingCell.column] = editingCell.value;
  }
  cancelCellEdit();
};

const cancelCellEdit = () => {
  editingCell.rowIndex = -1;
  editingCell.column = "";
  editingCell.value = "";
};

const resolveDataRowClass = ({
  row,
  rowData,
}: {
  row?: PanelDraftRow;
  rowData?: PanelDraftRow;
}) => {
  const currentRow = row || rowData;
  if (!currentRow) {
    return "";
  }
  const draft = activeDataDraft.value;
  if (!draft) {
    return "";
  }
  const original = draft.originalRows[currentRow.__panelRowIndex] || {};
  const current = draft.rows[currentRow.__panelRowIndex] || {};
  return JSON.stringify(original) === JSON.stringify(current)
    ? ""
    : "panel-row--dirty";
};
const syncPanelDataTableSort = () => {
  const table = panelDataTableRef.value;
  const tab = activeWorkbenchTab.value;
  if (!table || !tab || tab.tabType !== "table" || tableView.value !== "data") {
    return;
  }
  if (tab.sortField && tab.sortOrder) {
    table.sort(tab.sortField, tab.sortOrder);
    return;
  }
  table.clearSort();
};
const panelDataTableSortSignature = computed(() => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table") {
    return "";
  }
  return [
    tab.tabId,
    tableView.value,
    tab.sortField,
    tab.sortOrder,
    activeDataColumns.value.join("|"),
  ].join("|");
});

const collectDataUpdates = (): PanelTableRowUpdate[] => {
  const draft = activeDataDraft.value;
  if (!draft) {
    return [];
  }
  return draft.rows.reduce<PanelTableRowUpdate[]>((acc, row, index) => {
    const original = draft.originalRows[index] || {};
    if (JSON.stringify(row) !== JSON.stringify(original)) {
      acc.push({
        panelCurrentRow: stripDraftRowMeta(cloneRows([row])[0]),
        panelOriginalRow: stripDraftRowMeta(cloneRows([original])[0]),
      });
    }
    return acc;
  }, [] as PanelTableRowUpdate[]);
};

const handleSaveTableChanges = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table") {
    return;
  }
  commitCellEdit();
  const updates = collectDataUpdates();
  if (!updates.length) {
    ElMessage.info("当前没有需要保存的数据");
    return;
  }
  emit("save-table-data", tab.tabId, updates);
};

const handleAccountRowClick = (row: PanelJdbcAccountView) => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "account") {
    return;
  }
  accountSelectionState[tab.tabId] = buildAccountKey(row);
};

const handleAddEditColumn = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return;
  }
  ensureTableEditDraft(tab);
  tableEditDrafts[tab.tabId] = [
    ...tableEditDrafts[tab.tabId],
    {
      comment: "",
      defaultValue: "",
      name: `column_${tableEditDrafts[tab.tabId].length + 1}`,
      nullable: true,
      panelPrimary: false,
      scale: null,
      size: 64,
      type: "varchar",
    },
  ];
};

const handleRemoveEditColumn = (index: number) => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return;
  }
  ensureTableEditDraft(tab);
  tableEditDrafts[tab.tabId] = tableEditDrafts[tab.tabId].filter(
    (_, rowIndex) => rowIndex !== index
  );
};

const handleResetEditColumns = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return;
  }
  tableEditDrafts[tab.tabId] = buildEditableColumns(tab);
  ElMessage.success("已重置为当前表结构");
};

const handleCopyEditDdl = async () => {
  if (!activeEditDdl.value) {
    ElMessage.warning("当前没有可复制的 DDL");
    return;
  }
  await navigator.clipboard.writeText(activeEditDdl.value);
  ElMessage.success("DDL 已复制");
};

const handleUseEditDdl = () => {
  if (!activeEditDdl.value) {
    ElMessage.warning("当前没有可写入的 DDL");
    return;
  }
  emit("update:sqlText", activeEditDdl.value);
  emit("activate-tab", "workspace");
  ElMessage.success("DDL 已写入 SQL 工作区");
};

const handleUseEditSql = () => {
  const nextSql = activeAlterSql.value || activeEditDdl.value;
  if (!nextSql) {
    ElMessage.warning("当前没有可写入的 SQL");
    return;
  }
  emit("update:sqlText", nextSql);
  emit("activate-tab", "workspace");
  ElMessage.success(
    activeAlterSql.value
      ? "变更 SQL 已写入 SQL 工作区"
      : "DDL 已写入 SQL 工作区"
  );
};

const handleCopyAlterSql = async () => {
  if (!activeAlterSql.value) {
    ElMessage.warning("当前没有可复制的变更 SQL");
    return;
  }
  await navigator.clipboard.writeText(activeAlterSql.value);
  ElMessage.success("变更 SQL 已复制");
};

const handleCopyAccountPrincipal = async () => {
  if (!activeSelectedAccount.value) {
    ElMessage.warning("请先选择账号");
    return;
  }
  await navigator.clipboard.writeText(
    buildAccountKey(activeSelectedAccount.value)
  );
  ElMessage.success("账号标识已复制");
};

const handleCopyAccountGrants = async () => {
  if (!activeSelectedGrantText.value) {
    ElMessage.warning("当前账号没有可复制的授权语句");
    return;
  }
  await navigator.clipboard.writeText(activeSelectedGrantText.value);
  ElMessage.success("授权 SQL 已复制");
};

const openAccountDialog = (mode: "create" | "update") => {
  accountDialogMode.value = mode;
  accountFormErrors.panelAccountName = "";
  accountFormErrors.panelPassword = "";
  if (mode === "update" && activeSelectedAccount.value) {
    accountForm.panelAccountName =
      activeSelectedAccount.value.panelAccountName || "";
    accountForm.panelHost = activeSelectedAccount.value.panelHost || "%";
    accountForm.panelPassword = "";
  } else {
    accountForm.panelAccountName = "";
    accountForm.panelHost = "%";
    accountForm.panelPassword = "";
  }
  accountDialogVisible.value = true;
};

const submitAccountDialog = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "account") {
    return;
  }
  const request = {
    panelAccountName: String(accountForm.panelAccountName || "").trim(),
    panelHost: String(accountForm.panelHost || "%").trim() || "%",
    panelPassword: String(accountForm.panelPassword || ""),
  };
  accountFormErrors.panelAccountName = request.panelAccountName
    ? ""
    : "请输入账号";
  accountFormErrors.panelPassword = request.panelPassword
    ? ""
    : accountDialogMode.value === "create"
      ? "创建账号时必须填写密码"
      : "修改密码时必须填写新密码";

  if (accountFormErrors.panelAccountName || accountFormErrors.panelPassword) {
    return;
  }
  if (accountDialogMode.value === "create") {
    emit("create-account", tab.tabId, request);
  } else {
    emit("update-account", tab.tabId, request);
  }
  accountDialogVisible.value = false;
};

const openPrivilegeDialog = (mode: "grant" | "revoke") => {
  if (!activeSelectedAccount.value) {
    ElMessage.warning("请先选择账号");
    return;
  }
  privilegeDialogMode.value = mode;
  privilegeFormErrors.panelPrivileges = "";
  privilegeForm.panelAccountName =
    activeSelectedAccount.value.panelAccountName || "";
  privilegeForm.panelHost = activeSelectedAccount.value.panelHost || "%";
  privilegeForm.panelPrivileges = [];
  privilegeForm.panelCatalogName = "*";
  privilegeForm.panelTableName = "*";
  privilegeForm.panelGrantOption = false;
  privilegeDialogVisible.value = true;
};

const handlePrivilegeInput = (value: string) => {
  privilegeForm.panelPrivileges = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  privilegeFormErrors.panelPrivileges = "";
};

const submitPrivilegeDialog = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "account") {
    return;
  }
  privilegeFormErrors.panelPrivileges = privilegeForm.panelPrivileges.length
    ? ""
    : "请输入至少一个权限";
  if (privilegeFormErrors.panelPrivileges) {
    return;
  }
  const request = {
    panelAccountName: privilegeForm.panelAccountName,
    panelHost: privilegeForm.panelHost,
    panelPrivileges: [...privilegeForm.panelPrivileges],
    panelCatalogName: privilegeForm.panelCatalogName,
    panelTableName: privilegeForm.panelTableName,
    panelGrantOption:
      privilegeDialogMode.value === "grant" &&
      Boolean(privilegeForm.panelGrantOption),
  };
  if (privilegeDialogMode.value === "grant") {
    emit("grant-account", tab.tabId, request);
  } else {
    emit("revoke-account", tab.tabId, request);
  }
  privilegeDialogVisible.value = false;
};

const handleDeleteAccount = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "account" || !activeSelectedAccount.value) {
    return;
  }
  emit(
    "delete-account",
    tab.tabId,
    activeSelectedAccount.value.panelAccountName,
    activeSelectedAccount.value.panelHost
  );
};

const handleRunAlterSql = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "table-edit") {
    return;
  }
  if (!activeAlterSql.value) {
    ElMessage.warning("当前设计没有变更");
    return;
  }
  emit("save-table-design", tab.tabId, activeAlterSql.value);
};

const resolveColumnHeader = (columnName: string) => {
  const comment = activeColumnCommentMap.value[columnName] || "";
  const mode = activeWorkbenchTab.value?.tableCommentMode || "native";
  if (!comment || mode === "native") {
    return columnName;
  }
  if (mode === "comment") {
    return comment;
  }
  return `${columnName} · ${comment}`;
};

const resolveCellComment = (columnName: string) => {
  const comment = activeColumnCommentMap.value[columnName] || "";
  const mode = activeWorkbenchTab.value?.dataCommentMode || "native";
  if (!comment || mode === "native") {
    return "";
  }
  if (mode === "comment") {
    return comment;
  }
  return `${columnName} · ${comment}`;
};

watch(
  panelDataTableSortSignature,
  () => {
    nextTick(() => {
      syncPanelDataTableSort();
    });
  },
  { immediate: true }
);

watch(
  codeMirrorHints,
  async () => {
    await nextTick();
    sqlEditorRef.value?.upgradeHits?.(codeMirrorHints.value);
    syncSelectionState();
  },
  { immediate: true }
);

watch(
  () => [
    activeWorkbenchTab.value?.tabId || "",
    activeWorkbenchTab.value?.tabType || "",
    editSection.value,
    activeEditableColumns.value.length,
  ],
  async () => {
    await setupEditTableSortable();
  },
  { immediate: true }
);

const handleExecuteSelection = () => {
  emit("execute-selected", getSelectedSql());
};

const handleFormatSql = () => {
  if (formatPending.value) {
    return;
  }
  formatPending.value = true;
  window.setTimeout(() => {
    try {
      emit("update:sqlText", formatSqlText(props.sqlText, { language: "sql" }));
    } catch {
      ElMessage.warning("SQL 美化失败");
    } finally {
      formatPending.value = false;
    }
  }, 0);
};

const handleCopyCodeBlock = async () => {
  await navigator.clipboard.writeText(
    ["```sql", props.sqlText.trim(), "```"].join("\n")
  );
  ElMessage.success("已复制 SQL 代码块");
};

const handleSaveSql = () => {
  localStorage.setItem(SQL_DRAFT_STORAGE_KEY, props.sqlText);
  ElMessage.success("SQL 已保存到本地草稿");
};

const handleExportWord = async () => {
  await exportWord();
};

const handleExportMarkdown = async () => {
  await exportMarkdown();
};

const handleExportPdf = async () => {
  await exportPdf();
};

const handleGenerateSql = () => {
  const prompt = aiPrompt.value.trim();
  if (!prompt) {
    ElMessage.warning("请输入中文需求");
    return;
  }
  emit("generate-sql", prompt);
  aiDialogVisible.value = false;
  aiPrompt.value = "";
};

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    const tab = activeWorkbenchTab.value;
    if (tab?.tabType === "table-edit" && activeAlterSql.value) {
      event.preventDefault();
      handleRunAlterSql();
      return;
    }
    if (
      tab?.tabType === "table" &&
      tableView.value === "data" &&
      activeDataDirtyCount.value
    ) {
      event.preventDefault();
      handleSaveTableChanges();
      return;
    }
  }
  if (!(event.ctrlKey || event.metaKey) || event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  if (event.shiftKey) {
    if (!hasSelection.value) {
      return;
    }
    handleExecuteSelection();
    return;
  }
  emit("execute");
};

const exportWord = async () => {
  const tab = activeWorkbenchTab.value;
  if (tab?.tabType === "database-document" && tab.databaseDocument) {
    await exportDatabaseDocumentToWord(tab.databaseDocument);
    return;
  }
  if (!tab?.structure) {
    ElMessage.warning("当前没有可导出的表结构");
    return;
  }
  await exportStructureToWord(
    tab.structure,
    tab.documentContent || "",
    tab.aiContent || ""
  );
};

const exportMarkdown = async () => {
  const tab = activeWorkbenchTab.value;
  if (tab?.tabType === "database-document" && tab.databaseDocument) {
    await exportDatabaseDocumentToMarkdown(tab.databaseDocument);
    return;
  }
  if (!tab?.structure) {
    ElMessage.warning("当前没有可导出的文档");
    return;
  }
  await exportStructureToMarkdown(
    tab.structure,
    tab.documentContent || "",
    tab.aiContent || ""
  );
};

const exportPdf = async () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || !documentPaperRef.value) {
    ElMessage.warning("当前没有可导出的视图");
    return;
  }
  await exportDocumentToPdf(documentPaperRef.value, `${tab.tabName}-document`);
};

const resetTableEditDraft = (tabId: string) => {
  const tab = props.tableTabs.find((item) => item.tabId === tabId);
  if (!tab || tab.tabType !== "table-edit") {
    return;
  }
  tableEditDrafts[tabId] = buildEditableColumns(tab);
};

defineExpose({
  exportPdf,
  exportWord,
  resetTableEditDraft,
});

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  loadColHeaderMenuState();
  document.addEventListener("mousedown", handleCellViewerOutsideClick);
});

onBeforeUnmount(() => {
  destroyEditTableSortable();
  window.removeEventListener("keydown", handleKeydown);
  document.removeEventListener("mousedown", handleCellViewerOutsideClick);
});
</script>

<style scoped lang="scss">
.detail-shell {
  min-height: 0;
  height: 100%;
  max-height: 100%;
}

.detail-layout {
  width: 100%;
  height: 100%;
  padding: 0;
}

.detail-main {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.sql-shell,
.metadata-shell,
.workbench-shell {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 0;
  height: 100%;
  max-height: 100%;
  border: 1px solid rgba(117, 135, 146, 0.2);
  border-radius: 16px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96),
    rgba(243, 247, 250, 0.98)
  );
  overflow: hidden;
}

.sql-shell {
  display: flex;
  flex-direction: column;
  grid-template-rows: unset;
}

.sql-editor-wrap {
  flex: 1;
  min-height: 120px;
  overflow: hidden;
}

.sql-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.16);
  background: linear-gradient(
    180deg,
    rgba(247, 250, 252, 0.96),
    rgba(240, 245, 248, 0.92)
  );
}

.sql-toolbar--plain {
  border-bottom: 1px solid rgba(123, 138, 149, 0.16);
}

.sql-toolbar__title {
  display: flex;
  flex-direction: column;
}

.sql-toolbar__title,
.workbench-head__title {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.sql-toolbar__title small,
.workbench-head__title small {
  color: #678092;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.sql-toolbar__title strong,
.workbench-head__title strong {
  color: #102534;
  font-size: 14px;
}

.sql-toolbar__title span,
.workbench-head__title span {
  color: #6c8393;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sql-toolbar__elapsed {
  display: inline-flex;
  align-items: center;
  padding-left: 10px;
  white-space: nowrap;
  font-size: 10px;
}

.sql-toolbar__actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.sql-elapsed {
  flex-shrink: 0;
}

.sql-editor-wrap {
  flex: 1;
  min-height: 120px;
  overflow: hidden;
  padding: 10px;
  background: linear-gradient(
    180deg,
    rgba(234, 241, 247, 0.78),
    rgba(242, 246, 250, 0.92)
  );
}

.sql-editor-wrap :deep(.sc-code-editor) {
  height: 100%;
  border: 1px solid rgba(120, 136, 148, 0.18);
  border-radius: 14px;
  overflow: hidden;
}

.sql-editor-wrap :deep(.CodeMirror) {
  height: 100%;
  font-size: 13px;
}

.sql-footer {
  display: grid;
  grid-template-rows: 8px 44px minmax(0, 1fr);
  min-height: 0;
  flex-shrink: 0;
  border-top: none;
  background: rgba(249, 251, 253, 0.95);
}

.sql-footer__resizer {
  height: 8px;
  cursor: ns-resize;
  background: transparent;
  border-top: 1px solid rgba(123, 138, 149, 0.16);
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sql-footer__resizer::after {
  content: '';
  width: 32px;
  height: 3px;
  border-radius: 2px;
  background: rgba(123, 138, 149, 0.3);
  transition: background 0.15s;
}

.sql-footer__resizer:hover { background: rgba(37, 99, 235, 0.06); }
.sql-footer__resizer:hover::after { background: rgba(37, 99, 235, 0.4); }

.sql-result-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 6px 10px;
  border-top: 1px solid rgba(123, 138, 149, 0.12);
  background: rgba(249, 251, 253, 0.95);
  flex-shrink: 0;
}

.sql-footer__tabs {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
}

.footer-tab {
  min-width: 92px;
  padding: 7px 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: #5f7686;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.footer-tab.is-active {
  border-color: rgba(59, 130, 246, 0.18);
  background: rgba(59, 130, 246, 0.08);
  color: #1454a8;
}

.sql-footer__body,
.footer-panel,
.workbench-body,
.workbench-panel,
.metadata-body {
  min-height: 0;
  height: 100%;
}

.sql-footer__body,
.metadata-body {
  padding: 8px 10px 10px;
}

.footer-panel {
  overflow: hidden;
  min-width: 0;
}

.footer-panel :deep(.el-table),
.workbench-panel :deep(.el-table) {
  height: 100%;
}

.sql-result-table {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.sql-result-table :deep(.el-auto-resizer) {
  width: 100%;
  height: 100%;
}

.sql-result-table :deep(.el-table-v2) {
  width: 100%;
  max-width: 100%;
}

.sql-result-table :deep(.el-table-v2__header-cell),
.sql-result-table :deep(.el-table-v2__row-cell) {
  padding: 0 12px;
}

.sql-result-table :deep(.el-table-v2__row-cell) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-placeholder,
.message-card {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
}

.footer-placeholder {
  place-items: center;
  height: 100%;
  text-align: center;
  color: #6a7f8f;
}

.footer-panel--message {
  display: grid;
  align-content: start;
  gap: 10px;
  overflow: auto;
}

.message-head {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-card--error {
  border-color: rgba(239, 68, 68, 0.18);
  background: rgba(254, 242, 242, 0.96);
}

.message-card--code pre,
.workbench-panel--code pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #213a4b;
  font-size: 12px;
  line-height: 1.65;
}

.metadata-body {
  overflow: auto;
}

.mysql-process-body {
  display: grid;
  gap: 10px;
  grid-template-rows: auto minmax(0, 1fr);
}

.mysql-process-tip {
  padding: 10px 12px;
  border: 1px solid rgba(59, 130, 246, 0.16);
  border-radius: 10px;
  color: #375b76;
  background: rgba(59, 130, 246, 0.06);
  font-size: 12px;
  line-height: 1.6;
}

.mysql-process-table {
  min-height: 0;
  height: 100%;
}

.workbench-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.16);
  background: linear-gradient(
    180deg,
    rgba(247, 250, 252, 0.96),
    rgba(240, 245, 248, 0.92)
  );
}

.workbench-head__tools {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.workbench-head__tools--stack {
  display: grid;
  gap: 8px;
  justify-items: end;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.toolbar-label {
  color: #68808f;
  font-size: 12px;
}

.toolbar-chip {
  cursor: pointer;
}

.toolbar-segment {
  min-width: 0;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}

.toolbar-segment__item {
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #5f7686;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
}

.toolbar-segment__item.is-active {
  background: rgba(37, 99, 235, 0.14);
  color: #1252aa;
  font-weight: 600;
}

.workbench-body {
  padding: 10px;
  overflow: hidden;
}

.workbench-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  min-height: 0;
  height: 100%;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  overflow: hidden;
}

.workbench-panel--placeholder {
  display: grid;
  place-items: center;
}

.workbench-panel--doc {
  overflow: auto;
  padding: 20px;
  background: linear-gradient(180deg, #f7f2ea, #f2ece1);
}

.workbench-panel--doc-shell {
  min-height: 0;
  overflow: auto;
}

.account-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 10px 12px 0;
}

.account-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 12px;
  min-height: 0;
  padding: 10px 12px 12px;
}

.account-table-shell,
.account-detail-shell {
  min-height: 0;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  overflow: hidden;
}

.account-detail-shell {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) minmax(0, 1fr);
}

.account-detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.14);
}

.account-detail__title {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.account-detail__title small {
  color: #6c8393;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.account-detail__title strong {
  color: #173246;
  font-size: 15px;
}

.account-detail__title span {
  color: #738999;
  font-size: 12px;
}

.account-detail__actions,
.account-detail__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.account-detail__actions {
  flex-shrink: 0;
}

.account-detail__meta {
  padding: 10px 12px 0;
}

.account-cell {
  display: grid;
  gap: 2px;
}

.account-cell strong {
  color: #173246;
  font-size: 13px;
}

.account-cell small {
  color: #6f8595;
  font-size: 11px;
}

.account-cell--active strong {
  color: #1454a8;
}

.summary-card {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96),
    rgba(244, 248, 251, 0.92)
  );
}

.summary-card small {
  color: #6d8393;
  font-size: 11px;
}

.summary-card strong {
  color: #173246;
  font-size: 18px;
  line-height: 1.2;
}

.document-paper {
  width: min(900px, 100%);
  margin: 0 auto;
  padding: 28px;
  border: 1px solid rgba(139, 122, 98, 0.18);
  border-radius: 10px;
  background: #fffdf8;
  box-shadow: 0 18px 34px rgba(126, 104, 79, 0.08);
}

.document-paper h2 {
  margin: 0 0 10px;
  color: #4b3726;
}

.document-paper p {
  margin: 0 0 12px;
  color: #5f5142;
  line-height: 1.7;
  white-space: pre-wrap;
}

.data-preview-head {
  display: grid;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.14);
  color: #5e7686;
  font-size: 12px;
}

.data-preview-head__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}

.data-preview-head__summary {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.data-preview-head__summary-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.data-preview-head__filter {
  max-width: 320px;
}

.data-preview-head code {
  color: #174b8c;
}

.data-table-shell {
  min-height: 0;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.data-table-native {
  width: 100%;
  height: 100%;
}

.data-table-native :deep(.el-table__cell .cell) {
  padding: 0 8px;
}

/* 单元格查看器 */
.cell-viewer {
  position: fixed;
  z-index: 9998;
  width: 360px;
  max-height: 320px;
  border: 1px solid rgba(112, 136, 151, 0.18);
  border-radius: 10px;
  background: rgba(250, 252, 255, 0.98);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: cellViewerIn 0.12s ease-out;
}

@keyframes cellViewerIn {
  from { opacity: 0; transform: scale(0.97) translateY(-4px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.cell-viewer__head {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 6px;
  border-bottom: 1px solid rgba(112, 136, 151, 0.12);
  flex-shrink: 0;
}

.cell-viewer__col {
  font-size: 11px;
  color: #8a9aaa;
  font-weight: 500;
  flex-shrink: 0;
}

.cell-viewer__tabs {
  display: flex;
  gap: 2px;
  flex: 1;
}

.cell-viewer__tab {
  padding: 2px 8px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #5a7080;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.1s;
}

.cell-viewer__tab:hover { background: rgba(37, 99, 235, 0.08); }
.cell-viewer__tab.is-active {
  background: rgba(37, 99, 235, 0.12);
  color: var(--el-color-primary, #409eff);
  font-weight: 500;
}

.cell-viewer__close {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: 50%;
  background: rgba(180, 35, 24, 0.08);
  color: #b42318;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cell-viewer__body {
  flex: 1;
  overflow: auto;
  padding: 8px 10px;
}

.cell-viewer__text {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #213a4b;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.cell-viewer__text--json { color: #1a5276; }

.cell-viewer__image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.cell-viewer__image {
  max-width: 100%;
  max-height: 220px;
  border-radius: 6px;
  object-fit: contain;
}

.cell-viewer__empty {
  font-size: 12px;
  color: #8a9aaa;
}

.col-header-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.3;
  min-width: 0;
}

.col-header-row {
  display: flex;
  align-items: center;
  gap: 3px;
  min-width: 0;
}

.col-header-title {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.col-header-sort {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.15s;
}

.col-header-sort:hover { opacity: 1; }

.col-sort-icon { font-size: 12px; }
.col-sort-icon--idle { color: #8a9aaa; }
.col-sort-icon--asc,
.col-sort-icon--desc {
  color: var(--el-color-primary, #409eff);
}

/* 当前列有排序时，图标始终可见 */
.col-header-sort:has(.col-sort-icon--asc),
.col-header-sort:has(.col-sort-icon--desc) {
  opacity: 1;
}

.col-type {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: normal;
}

.col-comment {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  font-weight: normal;
}

.data-cell__comment {
  display: block;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

/* 禁用数据表格的原生排序箭头 */
.data-table-native :deep(.el-table .caret-wrapper),
.data-table-shell :deep(.el-table .caret-wrapper) {
  display: none;
}

.data-preview-head__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.data-preview-head__elapsed {
  white-space: nowrap;
}

.data-preview-filter-panel {
  display: grid;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid rgba(123, 138, 149, 0.14);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.9);
}

.data-preview-filter-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.data-preview-filter-list {
  display: grid;
  gap: 8px;
}

.data-preview-filter-item {
  display: grid;
  grid-template-columns: minmax(180px, 1.1fr) minmax(140px, 0.9fr) minmax(180px, 1fr) auto;
  gap: 8px;
  align-items: center;
}

.data-preview-filter-item__column,
.data-preview-filter-item__operator,
.data-preview-filter-item__value {
  width: 100%;
}

.data-preview-filter-panel__empty {
  color: #718798;
  font-size: 12px;
}

.table-edit-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 12px 10px;
}

.table-edit-toolbar__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: auto;
  color: #6f8595;
  font-size: 12px;
}

.table-edit__drag {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: rgba(37, 99, 235, 0.08);
  color: #1454a8;
  cursor: move;
}

.table-edit__drag:hover {
  background: rgba(37, 99, 235, 0.14);
}

.workbench-panel :deep(.table-edit-row--ghost td.el-table__cell) {
  background: rgba(37, 99, 235, 0.08);
}

.dialog-form {
  display: grid;
  gap: 12px;
}

.dialog-field {
  display: grid;
  gap: 8px;
}

.dialog-field__label {
  color: #60798a;
  font-size: 12px;
}

.dialog-field__label--required::after {
  content: " *";
  color: #dc2626;
}

.dialog-field__error {
  min-height: 16px;
  color: #dc2626;
  font-size: 12px;
  line-height: 1.4;
}

.dialog-field__error--hidden {
  visibility: hidden;
}

.dialog-form__inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #5f7686;
  font-size: 12px;
}

.dialog-footer-tip {
  margin-right: auto;
  color: #6f8796;
  font-size: 12px;
}

.workbench-panel :deep(.el-select),
.workbench-panel :deep(.el-input-number) {
  width: 100%;
}

.field-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-edit__control {
  width: 100%;
}

.workbench-panel :deep(.table-edit__control .el-input__wrapper),
.workbench-panel :deep(.table-edit__control .el-select__wrapper),
.workbench-panel :deep(.table-edit__control .el-input-number__wrapper) {
  min-height: 34px;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.data-cell {
  display: flex;
  align-items: center;
  min-height: 34px;
  height: 100%;
  padding: 0;
  border-radius: 10px;
  cursor: text;
}

.data-cell:hover {
  background: rgba(37, 99, 235, 0.05);
}

.data-cell--editing {
  background: rgba(37, 99, 235, 0.08);
  border-radius: 0;
}

.data-cell__content {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
  padding: 4px 8px;
}

.data-cell__value {
  color: #132737;
  font-size: 12px;
  line-height: 1.4;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.data-cell__editor {
  width: 100%;
  height: 100%;
}

.data-cell__editor :deep(.el-textarea),
.data-cell__editor :deep(.el-textarea__inner) {
  height: 100%;
}

.data-cell__editor :deep(.el-textarea__inner) {
  min-height: 34px !important;
  line-height: 1.35;
  padding: 8px;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
  resize: none;
}

.data-cell small {
  color: #7a8f9d;
  font-size: 11px;
  line-height: 1.2;
  flex-shrink: 0;
  white-space: nowrap;
}

.workbench-panel :deep(.panel-row--dirty td.el-table__cell) {
  background: rgba(251, 191, 36, 0.1);
}

.workbench-panel :deep(.panel-row--dirty .virtual-table-cell) {
  background: rgba(251, 191, 36, 0.1);
}

.grant-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.account-detail-shell .message-card {
  margin: 10px 12px 12px;
  overflow: auto;
}

.account-detail-shell .message-card pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: #213a4b;
  font-size: 12px;
  line-height: 1.65;
}

.data-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px solid rgba(123, 138, 149, 0.14);
  background: rgba(248, 250, 252, 0.9);
}

.data-pagination--summary {
  justify-content: space-between;
}

.data-pagination--summary small {
  color: #6f8595;
}

@media (max-width: 1200px) {
  .account-summary-grid {
    grid-template-columns: 1fr;
  }

  .account-layout {
    grid-template-columns: 1fr;
  }

  .sql-shell,
  .metadata-shell,
  .workbench-shell {
    min-height: auto;
  }

  .data-preview-head__top,
  .data-preview-filter-item {
    grid-template-columns: 1fr;
  }
}

/* ── Dark Mode ── */
:global(html.dark) {
  .sql-shell,
  .metadata-shell,
  .workbench-shell {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.88),
      rgba(20, 30, 48, 0.84)
    );
    border-color: rgba(148, 163, 184, 0.08);
  }

  .sql-toolbar,
  .workbench-head {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.88),
      rgba(20, 30, 48, 0.84)
    );
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }

  .sql-toolbar__title small,
  .workbench-head__title small {
    color: #64748b;
  }

  .sql-toolbar__title strong,
  .workbench-head__title strong {
    color: #e2e8f0;
  }

  .sql-toolbar__title span,
  .workbench-head__title span {
    color: #94a3b8;
  }

  .info-card,
  .workbench-panel,
  .account-table-shell,
  .account-detail-shell {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(148, 163, 184, 0.08);
  }

  .workbench-panel--doc {
    background: rgba(15, 23, 42, 0.88);
  }

  .data-table-wrap :deep(.el-table),
  .data-table-native :deep(.el-table) {
    --el-table-bg-color: rgba(15, 23, 42, 0.7);
    --el-table-tr-bg-color: rgba(15, 23, 42, 0.7);
    --el-table-header-bg-color: rgba(15, 23, 42, 0.85);
    --el-table-row-hover-bg-color: rgba(99, 102, 241, 0.08);
    --el-table-border-color: rgba(148, 163, 184, 0.08);
    --el-table-text-color: #e2e8f0;
    --el-table-header-text-color: #94a3b8;
  }

  .data-cell__value {
    color: #e2e8f0;
  }

  .data-cell__comment {
    color: #64748b;
  }

  .col-header-title {
    color: #94a3b8;
  }

  .col-type {
    color: #64748b;
  }

  .col-comment {
    color: #64748b;
  }

  .data-pagination {
    background: rgba(15, 23, 42, 0.85);
    border-top-color: rgba(148, 163, 184, 0.08);
  }

  .data-pagination--summary small {
    color: #64748b;
  }

  .data-preview-foot {
    background: rgba(15, 23, 42, 0.85);
    border-top-color: rgba(148, 163, 184, 0.08);
  }

  .data-preview-foot__meta small {
    color: #64748b;
  }

  .mysql-process-tip {
    background: rgba(30, 58, 138, 0.2);
    border-color: rgba(59, 130, 246, 0.15);
    color: #93c5fd;
  }

  .account-detail__head {
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }

  .account-detail__title small {
    color: #64748b;
  }

  .account-detail__title strong {
    color: #e2e8f0;
  }

  .account-detail__title span {
    color: #94a3b8;
  }

  .account-detail-shell .message-card {
    border-color: rgba(148, 163, 184, 0.08);
    background: rgba(15, 23, 42, 0.5);
  }

  .account-detail-shell .message-card pre {
    color: #94a3b8;
  }

  .toolbar-segment__item {
    color: #94a3b8;
  }

  .toolbar-segment__item.is-active {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
  }

  .toolbar-label {
    color: #64748b;
  }

  .summary-card {
    background: rgba(15, 23, 42, 0.7);
    border-color: rgba(148, 163, 184, 0.08);
  }

  .summary-card small {
    color: #64748b;
  }

  .summary-card strong {
    color: #e2e8f0;
  }

  .info-card__head strong {
    color: #e2e8f0;
  }

  .info-card__head span {
    color: #64748b;
  }

  .metadata-head__title small {
    color: #64748b;
  }

  .metadata-head__title strong {
    color: #e2e8f0;
  }

  .metadata-body pre {
    color: #94a3b8;
  }

  .col-sort-icon {
    color: #64748b;
  }

  .col-sort-icon--asc,
  .col-sort-icon--desc {
    color: #818cf8;
  }

  .data-preview-filter-head span {
    color: #64748b;
  }

  .cell-viewer {
    background: rgba(15, 23, 42, 0.95);
    border-color: rgba(148, 163, 184, 0.12);
    box-shadow: 0 20px 40px rgba(2, 6, 23, 0.5);
  }

  .cell-viewer__head {
    background: rgba(15, 23, 42, 0.9);
    border-bottom-color: rgba(148, 163, 184, 0.08);
  }

  .cell-viewer__col {
    color: #e2e8f0;
  }

  .cell-viewer__tab {
    color: #94a3b8;
  }

  .cell-viewer__tab.is-active {
    background: rgba(99, 102, 241, 0.15);
    color: #a5b4fc;
  }

  .cell-viewer__close {
    color: #94a3b8;
  }

  .cell-viewer__text {
    color: #e2e8f0;
  }

  .cell-viewer__empty {
    color: #64748b;
  }
}
</style>

