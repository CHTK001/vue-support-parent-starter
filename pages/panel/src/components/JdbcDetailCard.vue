<template>
  <section class="detail-shell">
    <div class="detail-main">
      <section
        v-if="activeWorkbenchTab"
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
            class="workbench-head__tools"
          >
            <ScTabs v-model="editSection" class="toolbar-tabs toolbar-tabs--compact">
              <ScTabPane
                v-for="item in editSectionOptions"
                :key="item.value"
                :label="item.label"
                :name="item.value"
              />
            </ScTabs>
            <ElTooltip content="复制当前 DDL">
              <ElButton
                circle
                size="small"
                :icon="DocumentCopy"
                @click="handleCopyEditDdl"
              />
            </ElTooltip>
            <ElTooltip content="复制变更 SQL">
              <ElButton
                circle
                size="small"
                :disabled="!activeAlterSql"
                :icon="CopyDocument"
                @click="handleCopyAlterSql"
              />
            </ElTooltip>
            <ElTooltip content="写入 SQL 工作区">
              <ElButton
                circle
                size="small"
                :icon="Promotion"
                @click="handleUseEditSql"
              />
            </ElTooltip>
            <ElTooltip content="保存变更">
              <ElButton
                circle
                size="small"
                type="primary"
                :disabled="!activeAlterSql"
                :icon="VideoPlay"
                @click="handleRunAlterSql"
              />
            </ElTooltip>
          </div>
          <div
            v-else-if="activeWorkbenchTab.tabType === 'table'"
            class="workbench-head__tools workbench-head__tools--stack"
          >
            <div class="toolbar-row">
              <ScTabs v-model="tableView" class="toolbar-tabs toolbar-tabs--compact">
                <ScTabPane
                  v-for="item in workbenchViewOptions"
                  :key="item.value"
                  :label="item.label"
                  :name="item.value"
                />
              </ScTabs>
              <ElTooltip
                v-if="activeDataDirtyCount"
                content="保存修改 (Ctrl+S)"
              >
                <ElButton
                  circle
                  size="small"
                  type="primary"
                  :icon="FolderChecked"
                  @click="handleSaveTableChanges"
                />
              </ElTooltip>
              <ElTooltip content="刷新当前表数据">
                <ElButton
                  circle
                  size="small"
                  :icon="RefreshRight"
                  @click="handleRefreshActiveTable"
                />
              </ElTooltip>
            </div>
            <div class="toolbar-row">
              <span class="toolbar-label">表头</span>
              <ScTabs v-model="tableCommentTab" class="toolbar-tabs toolbar-tabs--compact">
                <ScTabPane
                  v-for="item in commentModeOptions"
                  :key="`head-${item.value}`"
                  :label="item.label"
                  :name="item.value"
                />
              </ScTabs>
              <span class="toolbar-label">数据</span>
              <ScTabs v-model="dataCommentTab" class="toolbar-tabs toolbar-tabs--compact">
                <ScTabPane
                  v-for="item in commentModeOptions"
                  :key="`data-${item.value}`"
                  :label="item.label"
                  :name="item.value"
                />
              </ScTabs>
              <span class="toolbar-label">页签形状</span>
              <ScTabs v-model="railShapeTab" class="toolbar-tabs toolbar-tabs--compact">
                <ScTabPane
                  v-for="item in railShapeOptions"
                  :key="`shape-${item.value}`"
                  :label="item.label"
                  :name="item.value"
                />
              </ScTabs>
              <span class="toolbar-label">查总量</span>
              <ElSwitch
                :model-value="activeWorkbenchTab.loadTotal"
                @update:model-value="
                  updateActiveTabSetting({
                    loadTotal: Boolean($event),
                    pageNum: 1,
                    viewMode: 'data',
                  })
                "
              />
            </div>
            <div class="toolbar-row">
              <span class="toolbar-label">数据模式</span>
              <ScTabs v-model="paginationModeTab" class="toolbar-tabs toolbar-tabs--compact">
                <ScTabPane
                  v-for="item in paginationModeOptions"
                  :key="`mode-${item.value}`"
                  :label="item.label"
                  :name="item.value"
                />
              </ScTabs>
              <span class="toolbar-label">显示序列</span>
              <ElSwitch
                :model-value="activeWorkbenchTab.showSequence"
                @update:model-value="
                  updateActiveTabSetting({ showSequence: Boolean($event) })
                "
              />
              <ElPopover placement="bottom-end" trigger="click" width="320">
                <template #reference>
                  <ElButton
                    circle
                    size="small"
                    :icon="SetUp"
                    title="冻结列"
                  />
                </template>
                <div class="column-setting-popover">
                  <strong>冻结列</strong>
                  <ElCheckboxGroup
                    :model-value="activeWorkbenchTab.frozenColumns"
                    class="column-setting-group"
                    @update:model-value="handleFrozenColumnsChange"
                  >
                    <ElCheckbox
                      v-for="column in activeDataColumns"
                      :key="column"
                      :label="column"
                    >
                      {{ resolveColumnHeader(column) }}
                    </ElCheckbox>
                  </ElCheckboxGroup>
                </div>
              </ElPopover>
            </div>
          </div>
          <div
            v-else-if="activeWorkbenchTab.tabType === 'database-document'"
            class="workbench-head__tools"
          >
            <ScTag class="toolbar-chip" effect="plain">
              表 {{ activeWorkbenchTab.databaseDocument?.panelTableCount || 0 }}
            </ScTag>
            <ScTag class="toolbar-chip" effect="plain">
              Schema
              {{ activeWorkbenchTab.databaseDocument?.panelSchemaCount || 0 }}
            </ScTag>
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
                          size="small"
                          :icon="Plus"
                          @click="openAccountDialog('create')"
                        />
                      </ElTooltip>
                      <ElTooltip content="复制 user@host">
                        <ElButton
                          circle
                          size="small"
                          :disabled="!activeSelectedAccount"
                          :icon="CopyDocument"
                          @click="handleCopyAccountPrincipal"
                        />
                      </ElTooltip>
                      <ElTooltip content="复制授权 SQL">
                        <ElButton
                          circle
                          size="small"
                          :disabled="!activeSelectedGrantText"
                          :icon="DocumentCopy"
                          @click="handleCopyAccountGrants"
                        />
                      </ElTooltip>
                      <ElTooltip content="修改密码">
                        <ElButton
                          circle
                          size="small"
                          :disabled="!activeSelectedAccount"
                          :icon="EditPen"
                          @click="openAccountDialog('update')"
                        />
                      </ElTooltip>
                      <ElTooltip content="授予权限">
                        <ElButton
                          circle
                          size="small"
                          :disabled="!activeSelectedAccount"
                          :icon="Promotion"
                          @click="openPrivilegeDialog('grant')"
                        />
                      </ElTooltip>
                      <ElTooltip content="回收权限">
                        <ElButton
                          circle
                          size="small"
                          :disabled="!activeSelectedAccount"
                          :icon="QuestionFilled"
                          @click="openPrivilegeDialog('revoke')"
                        />
                      </ElTooltip>
                      <ElTooltip content="删除账号">
                        <ElButton
                          circle
                          size="small"
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
            <div v-if="editSection === 'columns'" class="workbench-panel">
              <div class="table-edit-toolbar">
                <ElTooltip content="新增字段">
                  <ElButton
                    circle
                    size="small"
                    :icon="Plus"
                    @click="handleAddEditColumn"
                  />
                </ElTooltip>
                <ElTooltip content="重置为原始结构">
                  <ElButton
                    circle
                    size="small"
                    :icon="RefreshRight"
                    @click="handleResetEditColumns"
                  />
                </ElTooltip>
              </div>
              <ElTable :data="activeEditableColumns" border height="100%">
                <ElTableColumn label="#" type="index" width="54" />
                <ElTableColumn label="字段名" min-width="180">
                  <template #default="{ row }">
                    <ElInput v-model="row.name" class="table-edit__control" size="small" />
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
                    <ElInput v-model="row.defaultValue" class="table-edit__control" size="small" />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="备注" min-width="220">
                  <template #default="{ row }">
                    <ElInput v-model="row.comment" class="table-edit__control" size="small" />
                  </template>
                </ElTableColumn>
                <ElTableColumn label="操作" width="70" fixed="right">
                  <template #default="{ $index }">
                    <ElButton
                      circle
                      size="small"
                      :icon="Delete"
                      @click="handleRemoveEditColumn($index)"
                    />
                  </template>
                </ElTableColumn>
              </ElTable>
            </div>

            <div v-else-if="editSection === 'indexes'" class="workbench-panel">
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
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{
                activeEditDdl || activeWorkbenchTab.ddlText || "-- 暂无 DDL"
              }}</pre>
            </div>

            <div
              v-else-if="editSection === 'changes'"
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{
                activeAlterSql || "-- 当前设计与原表一致，无需变更"
              }}</pre>
            </div>

            <div v-else-if="editSection === 'triggers'" class="workbench-panel">
              <ElTable
                v-if="activeTriggers.length"
                :data="activeTriggers"
                border
                height="100%"
              >
                <ElTableColumn label="触发器" min-width="180" prop="name" />
                <ElTableColumn label="时机" min-width="120" prop="timing" />
                <ElTableColumn label="事件" min-width="120" prop="event" />
                <ElTableColumn label="创建时间" min-width="180" prop="created" />
                <ElTableColumn
                  label="定义"
                  min-width="360"
                  prop="statement"
                  show-overflow-tooltip
                />
              </ElTable>
              <ElEmpty v-else description="当前表没有可见触发器。" />
            </div>

            <div v-else class="workbench-panel workbench-panel--placeholder">
              <ElEmpty
                :description="`${editSectionLabel} 暂按当前数据库能力预留。`"
              />
            </div>
          </template>

          <template v-else-if="activeWorkbenchTab.tabType === 'table'">
            <div v-if="tableView === 'data'" class="workbench-panel workbench-panel--data">
              <div class="data-preview-head">
                <div class="data-preview-head__summary">
                  <span>直接编辑数据</span>
                  <ElInput
                    :model-value="activeWorkbenchTab.filterKeyword"
                    clearable
                    placeholder="筛选当前结果集"
                    size="small"
                    class="data-preview-head__filter"
                    @update:model-value="
                      updateActiveTabSetting({
                        filterKeyword: String($event || ''),
                      })
                    "
                  />
                </div>
                <div class="data-preview-head__actions">
                  <ElTooltip
                    v-if="capabilities?.aiStarterEnabled"
                    content="基于表结构生成示例数据"
                  >
                    <ElButton
                      circle
                      size="small"
                      :icon="MagicStick"
                      @click="$emit('generate-sample-data', activeWorkbenchTab.tabId)"
                    />
                  </ElTooltip>
                  <code
                    >page {{ activeWorkbenchTab.pageNum }} / size
                    {{ activeWorkbenchTab.pageSize }}</code
                  >
                  <ScTag
                    v-if="activeDataDirtyCount"
                    class="toolbar-chip data-preview-head__elapsed"
                    effect="plain"
                    size="small"
                  >
                    dirty {{ activeDataDirtyCount }}
                  </ScTag>
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
                </div>
              </div>
              <div class="data-table-shell">
                <ElTable
                  v-if="activeDataColumns.length"
                  :data="activeDisplayRows"
                  border
                  height="100%"
                  table-layout="fixed"
                  :row-class-name="resolveDataRowClass"
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
                    v-for="column in activeDataColumns"
                    :key="column"
                    :fixed="resolveColumnFixed(column)"
                    :label="resolveColumnHeader(column)"
                    :min-width="140"
                    show-overflow-tooltip
                  >
                    <template #default="{ row }">
                      <div
                        class="data-cell"
                        :class="{
                          'data-cell--editing': isEditingCell(
                            row.__panelRowIndex,
                            column,
                          ),
                        }"
                        @click="activateCellEdit(row.__panelRowIndex, column)"
                      >
                        <ElInput
                          v-if="isEditingCell(row.__panelRowIndex, column)"
                          :model-value="editingCell.value"
                          :autosize="{ minRows: 1, maxRows: 1 }"
                          autofocus
                          class="data-cell__editor"
                          resize="none"
                          size="small"
                          type="textarea"
                          @blur="commitCellEdit"
                          @keydown.enter.exact.prevent="commitCellEdit"
                          @keydown.esc.prevent="cancelCellEdit"
                          @update:model-value="editingCell.value = $event"
                        />
                        <div v-else class="data-cell__content">
                          <span class="data-cell__value">{{
                            formatCellValue(row.__panelRow[column])
                          }}</span>
                          <small v-if="resolveCellComment(column)">{{
                            resolveCellComment(column)
                          }}</small>
                        </div>
                      </div>
                    </template>
                  </ElTableColumn>
                </ElTable>
                <ElEmpty
                  v-else
                  description="当前还没有表数据，点击刷新后重试。"
                />
              </div>
              <div
                v-if="activeWorkbenchTab.paginationMode === 'pagination'"
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
              <div v-else class="data-pagination data-pagination--summary">
                <span>非分页模式</span>
                <small>当前按一次性结果集显示，最多返回 {{ previewLimit }} 行。</small>
              </div>
            </div>

            <div
              v-else-if="tableView === 'ddl'"
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{ activeWorkbenchTab.ddlText || "-- 暂无 DDL" }}</pre>
            </div>

            <div
              v-else-if="tableView === 'ai'"
              class="workbench-panel workbench-panel--code"
            >
              <pre>{{
                activeWorkbenchTab.aiContent || "暂无 AI 结构说明。"
              }}</pre>
            </div>

            <div v-else class="workbench-panel">
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

      <section v-else-if="activeTabId === 'metadata'" class="metadata-shell">
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
            :metadata="datasourceMetadata"
          />
        </div>
      </section>

      <section v-else class="sql-shell">
        <header class="sql-toolbar">
          <div class="sql-toolbar__title">
            <small>SQL WORKSPACE</small>
            <strong>{{ activePath || "未选中对象" }}</strong>
            <span
              v-if="queryResult?.elapsedMillis !== undefined"
              class="sql-toolbar__elapsed"
            >
              {{ queryResult.elapsedMillis }} ms
            </span>
          </div>

          <div class="sql-toolbar__actions">
            <ElTooltip content="执行全部 SQL (Ctrl/Cmd + Enter)">
              <ElButton
                circle
                :disabled="submitting"
                :icon="VideoPlay"
                size="small"
                type="primary"
                @click="$emit('execute')"
              />
            </ElTooltip>
            <ElTooltip content="执行选中部分 (Ctrl/Cmd + Shift + Enter)">
              <ElButton
                circle
                :disabled="submitting || !hasSelection"
                :icon="CaretRight"
                size="small"
                @click="handleExecuteSelection"
              />
            </ElTooltip>
            <ElTooltip content="SQL 美化">
              <ElButton
                circle
                :disabled="submitting || formatPending"
                :icon="MagicStick"
                size="small"
                @click="handleFormatSql"
              />
            </ElTooltip>
            <ElTooltip content="执行 EXPLAIN">
              <ElButton
                circle
                :disabled="submitting"
                :icon="QuestionFilled"
                size="small"
                @click="$emit('explain')"
              />
            </ElTooltip>
            <ElTooltip content="AI 生成 SQL">
              <ElButton
                circle
                :disabled="submitting"
                :icon="Promotion"
                size="small"
                @click="aiDialogVisible = true"
              />
            </ElTooltip>
            <ElTooltip content="复制 SQL 代码块">
              <ElButton
                circle
                :icon="DocumentCopy"
                size="small"
                @click="handleCopyCodeBlock"
              />
            </ElTooltip>
            <ElTooltip content="保存 SQL">
              <ElButton
                circle
                :icon="FolderChecked"
                size="small"
                @click="handleSaveSql"
              />
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

        <section class="sql-footer">
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
              <ElTable
                v-if="queryResult?.query && queryResult.columns?.length"
                :data="queryResult.rows"
                border
                height="100%"
              >
                <ElTableColumn
                  v-for="column in queryResult.columns"
                  :key="column"
                  :label="column"
                  :min-width="140"
                >
                  <template #default="{ row }">{{
                    row[column] ?? "-"
                  }}</template>
                </ElTableColumn>
              </ElTable>

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

    <ScTabsRailLayout
      v-model="railTabValue"
      close-button-mode="always"
      :items="railTabs"
      :round="railRound"
      @tab-remove="handleRailTabRemove"
    />

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
        <ElInput
          v-model="accountForm.panelAccountName"
          :disabled="accountDialogMode === 'update'"
          placeholder="账号"
        />
        <ElInput v-model="accountForm.panelHost" placeholder="Host，默认 %" />
        <ElInput
          v-model="accountForm.panelPassword"
          placeholder="密码"
          show-password
        />
      </div>
      <template #footer>
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
        <ElInput v-model="privilegeForm.panelAccountName" disabled placeholder="账号" />
        <ElInput v-model="privilegeForm.panelHost" disabled placeholder="Host" />
        <ElInput
          :model-value="privilegeForm.panelPrivileges.join(', ')"
          placeholder="权限，逗号分隔，例如 SELECT, INSERT"
          @update:model-value="handlePrivilegeInput"
        />
        <ElInput v-model="privilegeForm.panelCatalogName" placeholder="数据库，默认 *" />
        <ElInput v-model="privilegeForm.panelTableName" placeholder="表，默认 *" />
        <div class="dialog-form__inline">
          <span>WITH GRANT OPTION</span>
          <ElSwitch
            v-model="privilegeForm.panelGrantOption"
            :disabled="privilegeDialogMode !== 'grant'"
          />
        </div>
      </div>
      <template #footer>
        <ElButton @click="privilegeDialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="submitPrivilegeDialog">确定</ElButton>
      </template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  CaretRight,
  CopyDocument,
  DataAnalysis,
  Delete,
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
  SetUp,
  Tickets,
  VideoPlay,
} from "@element-plus/icons-vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import ScTabsRailLayout from "@repo/components/ScTabsRailLayout/index.vue";
import { ScTabs, ScTabPane } from "@repo/components/ScTabs";
import {
  ElButton,
  ElCheckbox,
  ElCheckboxGroup,
  ElDialog,
  ElEmpty,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElOption,
  ElPagination,
  ElMessage,
  ElPopover,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTooltip,
} from "element-plus";
import { format as formatSqlText } from "sql-formatter";
import {
  computed,
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
  PanelTableRowUpdate,
  PanelTableDataView,
} from "../api";
import {
  exportDocumentToPdf,
  exportStructureToWord,
} from "../utils/documentExport";
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

interface InspectorTableTab {
  accounts: PanelJdbcAccountView[];
  aiContent: string;
  databaseDocument?: PanelDatabaseDocumentView | null;
  dataCommentMode: CommentMode;
  dataResult: PanelTableDataView | null;
  ddlText: string;
  documentContent: string;
  filterKeyword: string;
  frozenColumns: string[];
  loadTotal: boolean;
  node: Record<string, any>;
  paginationMode: PaginationMode;
  pageNum: number;
  pageSize: number;
  railShape: RailShape;
  showSequence: boolean;
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
  datasourceMetadata: JdbcConnectionMetadata | null;
  errorMessage: string;
  previewLimit: number;
  queryResult: JdbcQueryResult | null;
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
        | "dataCommentMode"
        | "filterKeyword"
        | "frozenColumns"
        | "loadTotal"
        | "paginationMode"
        | "pageNum"
        | "pageSize"
        | "railShape"
        | "showSequence"
        | "tableCommentMode"
        | "viewMode"
      >
    >
  ): void;
  (e: "close-tab", value: string): void;
  (e: "execute"): void;
  (e: "execute-selected", value: string): void;
  (e: "explain"): void;
  (e: "generate-sample-data", tabId: string): void;
  (e: "generate-sql", prompt: string): void;
  (e: "quick-run", sql: string): void;
  (e: "refresh-table-data", tabId: string): void;
  (e: "create-account", tabId: string, request: PanelJdbcAccountSaveRequest): void;
  (e: "update-account", tabId: string, request: PanelJdbcAccountSaveRequest): void;
  (e: "delete-account", tabId: string, accountName: string, host?: string): void;
  (e: "grant-account", tabId: string, request: PanelJdbcPrivilegeRequest): void;
  (e: "revoke-account", tabId: string, request: PanelJdbcPrivilegeRequest): void;
  (e: "save-table-data", tabId: string, updates: PanelTableRowUpdate[]): void;
  (e: "update:sqlText", value: string): void;
}>();

const sqlEditorRef = ref<any>(null);
const documentPaperRef = ref<HTMLElement | null>(null);
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
const privilegeForm = reactive<PanelJdbcPrivilegeRequest>({
  panelAccountName: "",
  panelCatalogName: "*",
  panelGrantOption: false,
  panelHost: "%",
  panelPrivileges: [],
  panelTableName: "*",
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
    return [] as Array<{
      __panelRow: Record<string, any>;
      __panelRowIndex: number;
    }>;
  }
  const keyword = String(activeWorkbenchTab.value?.filterKeyword || "")
    .trim()
    .toLowerCase();
  return draft.rows
    .map((row, index) => ({
      __panelRow: row,
      __panelRowIndex: index,
    }))
    .filter(({ __panelRow }) => {
      if (!keyword) {
        return true;
      }
      return Object.values(__panelRow || {}).some(value =>
        String(value ?? "").toLowerCase().includes(keyword)
      );
    });
});
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
const railRound = computed(
  () => activeWorkbenchTab.value?.railShape === "round"
);
const railTabs = computed(() => [
  {
    icon: Monitor,
    name: "workspace",
    title: "工作区",
  },
  {
    icon: DataAnalysis,
    name: "metadata",
    title: "数据源信息",
  },
  ...props.tableTabs.map(tab => ({
    closable: true,
    icon: tab.tabType === "table-edit"
      ? EditPen
      : tab.tabType === "database-document"
        ? Document
        : Tickets,
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
    const rawType = String(column.type || "").trim().toLowerCase();
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
  if (tab.tabType !== "table-edit" || tableEditDrafts[tab.tabId]) {
    return;
  }
  tableEditDrafts[tab.tabId] = buildEditableColumns(tab);
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
      | "dataCommentMode"
      | "filterKeyword"
      | "frozenColumns"
      | "loadTotal"
      | "paginationMode"
      | "pageNum"
      | "pageSize"
      | "railShape"
      | "showSequence"
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

const handleFrozenColumnsChange = (value: Array<string | number>) => {
  updateActiveTabSetting({
    frozenColumns: value.map(item => String(item)),
  });
};

const formatCellValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  return String(value);
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
  return (Math.max(tab.pageNum, 1) - 1) * Math.max(tab.pageSize, 1) + rowIndex + 1;
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
}: {
  row: { __panelRow: Record<string, any>; __panelRowIndex: number };
}) => {
  const draft = activeDataDraft.value;
  if (!draft) {
    return "";
  }
  const original = draft.originalRows[row.__panelRowIndex] || {};
  const current = draft.rows[row.__panelRowIndex] || {};
  return JSON.stringify(original) === JSON.stringify(current)
    ? ""
    : "panel-row--dirty";
};

const collectDataUpdates = (): PanelTableRowUpdate[] => {
  const draft = activeDataDraft.value;
  if (!draft) {
    return [];
  }
  return draft.rows.reduce((acc, row, index) => {
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
  if (mode === "update" && activeSelectedAccount.value) {
    accountForm.panelAccountName = activeSelectedAccount.value.panelAccountName || "";
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
  if (!request.panelAccountName) {
    ElMessage.warning("请输入账号");
    return;
  }
  if (
    accountDialogMode.value === "create" &&
    !request.panelPassword
  ) {
    ElMessage.warning("创建账号时请输入密码");
    return;
  }
  emit(
    accountDialogMode.value === "create" ? "create-account" : "update-account",
    tab.tabId,
    request,
  );
  accountDialogVisible.value = false;
};

const openPrivilegeDialog = (mode: "grant" | "revoke") => {
  if (!activeSelectedAccount.value) {
    ElMessage.warning("请先选择账号");
    return;
  }
  privilegeDialogMode.value = mode;
  privilegeForm.panelAccountName = activeSelectedAccount.value.panelAccountName || "";
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
    .map(item => item.trim())
    .filter(Boolean);
};

const submitPrivilegeDialog = () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || tab.tabType !== "account") {
    return;
  }
  if (!privilegeForm.panelPrivileges.length) {
    ElMessage.warning("请输入至少一个权限");
    return;
  }
  emit(
    privilegeDialogMode.value === "grant" ? "grant-account" : "revoke-account",
    tab.tabId,
    {
      panelAccountName: privilegeForm.panelAccountName,
      panelHost: privilegeForm.panelHost,
      panelPrivileges: [...privilegeForm.panelPrivileges],
      panelCatalogName: privilegeForm.panelCatalogName,
      panelTableName: privilegeForm.panelTableName,
      panelGrantOption: privilegeDialogMode.value === "grant" && Boolean(privilegeForm.panelGrantOption),
    },
  );
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
    activeSelectedAccount.value.panelHost,
  );
};

const handleRunAlterSql = () => {
  if (!activeAlterSql.value) {
    ElMessage.warning("当前设计没有变更");
    return;
  }
  emit("quick-run", activeAlterSql.value);
  emit("activate-tab", "workspace");
  ElMessage.success("已将变更 SQL 发送到工作区执行");
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
  codeMirrorHints,
  async () => {
    await nextTick();
    sqlEditorRef.value?.upgradeHits?.(codeMirrorHints.value);
    syncSelectionState();
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

const exportPdf = async () => {
  const tab = activeWorkbenchTab.value;
  if (!tab || !documentPaperRef.value) {
    ElMessage.warning("当前没有可导出的视图");
    return;
  }
  await exportDocumentToPdf(documentPaperRef.value, `${tab.tabName}-document`);
};

defineExpose({
  exportPdf,
  exportWord,
});

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped lang="scss">
.detail-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 52px;
  gap: 10px;
  min-height: 0;
  height: 100%;
  max-height: 100%;
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
  grid-template-rows: auto minmax(260px, 1fr) 300px;
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
  white-space: nowrap;
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
  min-height: 0;
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
  grid-template-rows: 44px minmax(0, 1fr);
  min-height: 0;
  border-top: 1px solid rgba(123, 138, 149, 0.16);
  background: rgba(249, 251, 253, 0.95);
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
  padding: 0 10px 10px;
}

.footer-panel {
  overflow: hidden;
}

.footer-panel :deep(.el-table),
.workbench-panel :deep(.el-table) {
  height: 100%;
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

.toolbar-tabs {
  min-width: 0;
}

.toolbar-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.toolbar-tabs :deep(.el-tabs__nav) {
  gap: 6px;
  border: 0;
}

.toolbar-tabs :deep(.el-tabs__nav-wrap::after),
.rail-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.toolbar-tabs :deep(.el-tabs__item) {
  height: 30px;
  padding: 0 12px !important;
  border: 0 !important;
  border-radius: 10px;
  color: #5f7686;
}

.toolbar-tabs :deep(.el-tabs__item:first-child),
.toolbar-tabs :deep(.el-tabs__item:last-child) {
  padding: 0 12px !important;
}

.toolbar-tabs :deep(.el-tabs__item.is-active) {
  background: rgba(37, 99, 235, 0.14);
  color: #1252aa;
}

.toolbar-tabs :deep(.el-tabs__active-bar),
.toolbar-tabs :deep(.el-tabs__content) {
  display: none;
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
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(123, 138, 149, 0.14);
  color: #5e7686;
  font-size: 12px;
}

.data-preview-head__summary {
  display: grid;
  gap: 8px;
  min-width: 0;
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

.table-edit-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 12px 10px;
}

.column-setting-popover {
  display: grid;
  gap: 10px;
}

.column-setting-popover strong {
  color: #173246;
  font-size: 13px;
}

.column-setting-group {
  display: grid;
  gap: 8px;
  max-height: 280px;
  overflow: auto;
}

.dialog-form {
  display: grid;
  gap: 12px;
}

.dialog-form__inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: #5f7686;
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
  .detail-shell {
    grid-template-columns: minmax(0, 1fr);
  }

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
}
</style>
