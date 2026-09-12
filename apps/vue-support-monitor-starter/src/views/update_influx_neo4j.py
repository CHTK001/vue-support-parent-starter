import io

# 更新 InfluxDBManageView.vue
with io.open('InfluxDBManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

old_import = 'import { computed, onMounted, reactive, ref } from "vue";'
new_import = '''import { computed, onMounted, reactive, ref } from "vue";
import { fetchInfluxdbBuckets, fetchInfluxdbMeasurements, executeInfluxdbQuery } from "../monitorApi";'''
content = content.replace(old_import, new_import, 1)

old_mount = '''onMounted(() => {
  // 模拟加载
});'''
new_mount = '''onMounted(() => {
  loadBuckets();
  loadMeasurements();
});

async function loadBuckets() {
  try {
    const data = await fetchInfluxdbBuckets();
    buckets.value = data || [];
  } catch (e) {
    console.error("加载存储桶失败", e);
  }
}

async function loadMeasurements() {
  try {
    const data = await fetchInfluxdbMeasurements();
    measurements.value = data || [];
  } catch (e) {
    console.error("加载测量列表失败", e);
  }
}'''
content = content.replace(old_mount, new_mount, 1)

# 修改执行查询函数
old_query = '''function executeQuery() {
  if (!fluxQuery.value.trim()) return;
  queryResult.value = [
    { time: "2024-01-15T10:00:00Z", _measurement: "cpu", _field: "usage_user", _value: 25.5, host: "server-01" },
    { time: "2024-01-15T10:01:00Z", _measurement: "cpu", _field: "usage_user", _value: 30.2, host: "server-01" },
    { time: "2024-01-15T10:02:00Z", _measurement: "cpu", _field: "usage_user", _value: 28.7, host: "server-01" },
  ];
}'''
new_query = '''async function executeQuery() {
  if (!fluxQuery.value.trim()) return;
  try {
    const data = await executeInfluxdbQuery(fluxQuery.value);
    queryResult.value = data?.rows || [];
  } catch (e) {
    console.error("执行查询失败", e);
    queryResult.value = [];
  }
}'''
content = content.replace(old_query, new_query, 1)

with io.open('InfluxDBManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)
print('InfluxDBManageView.vue 已更新')

# 更新 Neo4jManageView.vue
with io.open('Neo4jManageView.vue', 'r', encoding='utf-8') as f:
    content = f.read()

old_import2 = 'import { computed, onMounted, reactive, ref } from "vue";'
new_import2 = '''import { computed, onMounted, reactive, ref } from "vue";
import { fetchNeo4jLabels, fetchNeo4jRelationships, executeNeo4jQuery } from "../monitorApi";'''
content = content.replace(old_import2, new_import2, 1)

old_mount2 = '''onMounted(() => {
  // 模拟加载
});'''
new_mount2 = '''onMounted(() => {
  loadLabels();
  loadRelationships();
});

async function loadLabels() {
  try {
    const data = await fetchNeo4jLabels();
    labels.value = data || [];
  } catch (e) {
    console.error("加载节点标签失败", e);
  }
}

async function loadRelationships() {
  try {
    const data = await fetchNeo4jRelationships();
    relationships.value = data || [];
  } catch (e) {
    console.error("加载关系类型失败", e);
  }
}'''
content = content.replace(old_mount2, new_mount2, 1)

# 修改执行查询函数
old_query2 = '''function executeQuery() {
  if (!cypherQuery.value.trim()) return;
  queryResult.value = [
    { id: 1, name: "张三", labels: ["Person"], properties: { age: 30 } },
    { id: 2, name: "李四", labels: ["Person"], properties: { age: 25 } },
    { id: 3, name: "王五", labels: ["Person"], properties: { age: 35 } },
  ];
}'''
new_query2 = '''async function executeQuery() {
  if (!cypherQuery.value.trim()) return;
  try {
    const data = await executeNeo4jQuery(cypherQuery.value);
    queryResult.value = data?.rows || [];
  } catch (e) {
    console.error("执行查询失败", e);
    queryResult.value = [];
  }
}'''
content = content.replace(old_query2, new_query2, 1)

with io.open('Neo4jManageView.vue', 'w', encoding='utf-8') as f:
    f.write(content)
print('Neo4jManageView.vue 已更新')
