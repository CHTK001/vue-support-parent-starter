import io

with io.open('DatabaseManagerView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在表数据工具栏添加新增行和导出CSV按钮
old_toolbar = '''          <div class="dbm-table-toolbar">
            <span class="dbm-table-name">{{ activeTabObj.tableName }}</span>
            <ReButton size="small" @click="refreshTableData">
              <template #icon><ReIcon name="Refresh" /></template>刷新
            </ReButton>
            <RePagination'''

new_toolbar = '''          <div class="dbm-table-toolbar">
            <span class="dbm-table-name">{{ activeTabObj.tableName }}</span>
            <ReButton size="small" type="primary" @click="openAddRowDialog">
              <template #icon><ReIcon name="Plus" /></template>新增行
            </ReButton>
            <ReButton size="small" @click="exportTableCsv">
              <template #icon><ReIcon name="Download" /></template>导出CSV
            </ReButton>
            <ReButton size="small" @click="refreshTableData">
              <template #icon><ReIcon name="Refresh" /></template>刷新
            </ReButton>
            <RePagination'''

if old_toolbar in content:
    content = content.replace(old_toolbar, new_toolbar, 1)
    print('1. 添加工具栏按钮成功')
else:
    print('1. 未找到工具栏')

# 2. 修改 tableColumns computed，添加操作列
old_columns = '''const tableColumns = computed(() =>
  tableData.columns.map(col => ({ prop: col, label: col, minWidth: 120, showOverflowTooltip: true }))
);'''

new_columns = '''const tableColumns = computed(() => {
  const cols = tableData.columns.map(col => ({ prop: col, label: col, minWidth: 120, showOverflowTooltip: true }));
  cols.push({ prop: '__actions', label: '操作', width: 120, slot: 'actions', fixed: 'right' });
  return cols;
});'''

if old_columns in content:
    content = content.replace(old_columns, new_columns, 1)
    print('2. 添加操作列成功')
else:
    print('2. 未找到列定义')

# 3. 在 ReTable 中添加操作列插槽
old_table = '''          <ReTable
            :data="tableData.rows"
            :columns="tableColumns"
            :loading="tableLoading"
            stripe
            border
            height="calc(100% - 60px)"
          />'''

new_table = '''          <ReTable
            :data="tableData.rows"
            :columns="tableColumns"
            :loading="tableLoading"
            stripe
            border
            height="calc(100% - 60px)"
          >
            <template #col-actions="{ row }">
              <ReButton size="small" text type="primary" @click="openEditRowDialog(row)">编辑</ReButton>
              <ReButton size="small" text type="danger" @click="deleteRow(row)">删除</ReButton>
            </template>
          </ReTable>'''

if old_table in content:
    content = content.replace(old_table, new_table, 1)
    print('3. 添加操作列插槽成功')
else:
    print('3. 未找到表格')

# 4. 在 </template> 前添加编辑行弹窗
old_template_end = '''  </div>
</template>'''

new_template_end = '''  </div>

  <!-- 编辑/新增行弹窗 -->
  <ReDialog v-model="rowDialogVisible" :title="rowDialogMode === 'edit' ? '编辑行' : '新增行'" width="600px">
    <ReForm label-width="120px">
      <ReFormItem v-for="col in tableData.columns" :key="col" :label="col">
        <ReInput v-model="rowForm[col]" :placeholder="`输入 ${col}`" />
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="rowDialogVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="rowSaving" @click="saveRow">保存</ReButton>
    </template>
  </ReDialog>
</template>'''

if old_template_end in content:
    content = content.replace(old_template_end, new_template_end, 1)
    print('4. 添加编辑行弹窗成功')
else:
    print('4. 未找到模板结束位置')

# 5. 在 script 中添加行编辑相关的变量和函数
old_script = '''// 表数据
const tableData = reactive<DbTableDataResult>({ columns: [], rows: [], total: 0, page: 1, pageSize: 50 });'''

new_script = '''// 表数据
const tableData = reactive<DbTableDataResult>({ columns: [], rows: [], total: 0, page: 1, pageSize: 50 });

// ==================== 行编辑 ====================
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
    if (rowDialogMode.value === 'add') {
      // 新增行：构建 INSERT SQL
      const cols = Object.keys(rowForm.value).filter(k => rowForm.value[k] !== '');
      const vals = cols.map(c => `'${String(rowForm.value[c]).replace(/'/g, "''")}'`);
      const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
      await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
      ElMessage.success('新增行成功');
    } else {
      // 编辑行：构建 UPDATE SQL（需要主键，这里用所有字段作为 WHERE 条件）
      const sets = Object.keys(rowForm.value).map(k => `${k} = '${String(rowForm.value[k]).replace(/'/g, "''")}'`);
      const wheres = Object.keys(editingRow.value || {}).map(k => `${k} = '${String(editingRow.value?.[k]).replace(/'/g, "''")}'`);
      const sql = `UPDATE ${tableName} SET ${sets.join(', ')} WHERE ${wheres.join(' AND ')}`;
      await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
      ElMessage.success('更新行成功');
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
    const wheres = Object.keys(row).map(k => `${k} = '${String(row[k]).replace(/'/g, "''")}'`);
    const sql = `DELETE FROM ${tableName} WHERE ${wheres.join(' AND ')}`;
    await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
    ElMessage.success('删除行成功');
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
  const csv = '\\ufeff' + headers + '\\n' + rows.join('\\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${activeTabObj.value?.tableName || 'table'}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
  ElMessage.success('导出成功');
};'''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('5. 添加行编辑函数成功')
else:
    print('5. 未找到 script 位置')

with io.open('DatabaseManagerView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nDatabaseManagerView.vue 行编辑功能添加完成')
