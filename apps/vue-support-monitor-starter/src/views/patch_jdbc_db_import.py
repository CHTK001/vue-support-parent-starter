import io

with io.open('DatabaseManagerView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 在顶部工具栏添加新建数据库和导入数据按钮
old_top_toolbar = '''          <div class="dbm-toolbar">
            <ReButton size="small" type="primary" @click="openNewQuery">
              <template #icon><ReIcon name="Edit" /></template>新建查询
            </ReButton>
            <ReButton size="small" type="primary" @click="openCreateTable">
              <template #icon><ReIcon name="Plus" /></template>新建表
            </ReButton>
            <ReButton size="small" @click="refreshDatabases">
              <template #icon><ReIcon name="Refresh" /></template>刷新
            </ReButton>
          </div>'''

new_top_toolbar = '''          <div class="dbm-toolbar">
            <ReButton size="small" type="primary" @click="openNewQuery">
              <template #icon><ReIcon name="Edit" /></template>新建查询
            </ReButton>
            <ReButton size="small" type="primary" @click="openCreateTable">
              <template #icon><ReIcon name="Plus" /></template>新建表
            </ReButton>
            <ReButton size="small" @click="openCreateDatabase">
              <template #icon><ReIcon name="FolderAdd" /></template>新建数据库
            </ReButton>
            <ReButton size="small" @click="openImportData">
              <template #icon><ReIcon name="Upload" /></template>导入数据
            </ReButton>
            <ReButton size="small" @click="refreshDatabases">
              <template #icon><ReIcon name="Refresh" /></template>刷新
            </ReButton>
          </div>'''

if old_top_toolbar in content:
    content = content.replace(old_top_toolbar, new_top_toolbar, 1)
    print('1. 添加顶部工具栏按钮成功')
else:
    print('1. 未找到顶部工具栏')

# 2. 在编辑行弹窗后添加新建数据库和导入数据弹窗
old_dialog_end = '''  </div>
</template>'''

new_dialog_end = '''  </div>

  <!-- 新建数据库弹窗 -->
  <ReDialog v-model="createDbVisible" title="新建数据库" width="400px">
    <ReForm label-width="100px">
      <ReFormItem label="数据库名" required>
        <ReInput v-model="newDbName" placeholder="请输入数据库名称" />
      </ReFormItem>
      <ReFormItem label="字符集">
        <ReSelect v-model="newDbCharset" size="default" style="width: 100%">
          <ReOption label="utf8mb4" value="utf8mb4" />
          <ReOption label="utf8" value="utf8" />
          <ReOption label="latin1" value="latin1" />
        </ReSelect>
      </ReFormItem>
      <ReFormItem label="排序规则">
        <ReSelect v-model="newDbCollation" size="default" style="width: 100%">
          <ReOption label="utf8mb4_general_ci" value="utf8mb4_general_ci" />
          <ReOption label="utf8mb4_unicode_ci" value="utf8mb4_unicode_ci" />
          <ReOption label="utf8_general_ci" value="utf8_general_ci" />
        </ReSelect>
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="createDbVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="creatingDb" @click="createDatabase">创建</ReButton>
    </template>
  </ReDialog>

  <!-- 导入数据弹窗 -->
  <ReDialog v-model="importVisible" title="导入数据" width="600px">
    <ReForm label-width="100px">
      <ReFormItem label="目标表" required>
        <ReSelect v-model="importTableName" size="default" style="width: 100%">
          <ReOption v-for="t in tables" :key="t" :label="t" :value="t" />
        </ReSelect>
      </ReFormItem>
      <ReFormItem label="文件格式">
        <ReSelect v-model="importFormat" size="default" style="width: 100%">
          <ReOption label="CSV" value="csv" />
          <ReOption label="JSON" value="json" />
          <ReOption label="SQL" value="sql" />
        </ReSelect>
      </ReFormItem>
      <ReFormItem label="数据内容">
        <ReTextarea v-model="importData" :rows="8" :placeholder="importFormat === 'csv' ? 'id,name,age\\n1,张三,25\\n2,李四,30' : importFormat === 'json' ? '[{\"id\": 1, \"name\": \"张三\"}]' : 'INSERT INTO table_name VALUES (1, ...);'" />
      </ReFormItem>
      <ReFormItem label="跳过首行">
        <ReSwitch v-model="importSkipHeader" />
        <span style="margin-left: 8px; font-size: 12px; color: var(--text-tertiary)">CSV 格式时跳过表头行</span>
      </ReFormItem>
    </ReForm>
    <template #footer>
      <ReButton @click="importVisible = false">取消</ReButton>
      <ReButton type="primary" :loading="importing" @click="doImportData">开始导入</ReButton>
    </template>
  </ReDialog>
</template>'''

if old_dialog_end in content:
    content = content.replace(old_dialog_end, new_dialog_end, 1)
    print('2. 添加新建数据库和导入数据弹窗成功')
else:
    print('2. 未找到模板结束位置')

# 3. 在 script 中添加新建数据库和导入数据相关的变量和函数
old_script = '''// ==================== 行编辑 ===================='''

new_script = '''// ==================== 新建数据库 ====================
const createDbVisible = ref(false);
const newDbName = ref("");
const newDbCharset = ref("utf8mb4");
const newDbCollation = ref("utf8mb4_general_ci");
const creatingDb = ref(false);

const openCreateDatabase = () => {
  newDbName.value = "";
  createDbVisible.value = true;
};

const createDatabase = async () => {
  if (!newDbName.value.trim()) {
    ElMessage.warning("请输入数据库名称");
    return;
  }
  creatingDb.value = true;
  try {
    const sql = `CREATE DATABASE \`${newDbName.value}\` CHARACTER SET ${newDbCharset.value} COLLATE ${newDbCollation.value}`;
    await executeDbSql(sql, currentDatasourceId.value, null);
    ElMessage.success("数据库创建成功");
    createDbVisible.value = false;
    await refreshDatabases();
  } catch (e) {
    ElMessage.error(`创建失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    creatingDb.value = false;
  }
};

// ==================== 导入数据 ====================
const importVisible = ref(false);
const importTableName = ref("");
const importFormat = ref("csv");
const importData = ref("");
const importSkipHeader = ref(true);
const importing = ref(false);

const openImportData = () => {
  importTableName.value = tables.value[0] || "";
  importFormat.value = "csv";
  importData.value = "";
  importVisible.value = true;
};

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
    let sql = "";
    if (importFormat.value === "sql") {
      sql = importData.value;
    } else if (importFormat.value === "csv") {
      const lines = importData.value.trim().split("\\n");
      const startIdx = importSkipHeader.value ? 1 : 0;
      const values = lines.slice(startIdx).map(line => {
        const fields = line.split(",").map(f => `'${f.trim().replace(/'/g, "''")}'`);
        return `(${fields.join(", ")})`;
      });
      sql = `INSERT INTO \`${importTableName.value}\` VALUES ${values.join(", ")}`;
    } else if (importFormat.value === "json") {
      const data = JSON.parse(importData.value);
      if (Array.isArray(data) && data.length > 0) {
        const columns = Object.keys(data[0]);
        const values = data.map(row => {
          const vals = columns.map(col => `'${String(row[col] ?? "").replace(/'/g, "''")}'`);
          return `(${vals.join(", ")})`;
        });
        sql = `INSERT INTO \`${importTableName.value}\` (${columns.map(c => `\`${c}\``).join(", ")}) VALUES ${values.join(", ")}`;
      }
    }
    if (sql) {
      await executeDbSql(sql, currentDatasourceId.value, databases.value[0]);
      ElMessage.success("数据导入成功");
      importVisible.value = false;
      await refreshTableData();
    }
  } catch (e) {
    ElMessage.error(`导入失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    importing.value = false;
  }
};

// ==================== 行编辑 ===================='''

if old_script in content:
    content = content.replace(old_script, new_script, 1)
    print('3. 添加新建数据库和导入数据函数成功')
else:
    print('3. 未找到 script 位置')

with io.open('DatabaseManagerView.vue', 'w', encoding='utf-8') as f:
    f.write(content)

print('\nDatabaseManagerView.vue 新建数据库和导入数据功能添加完成')
