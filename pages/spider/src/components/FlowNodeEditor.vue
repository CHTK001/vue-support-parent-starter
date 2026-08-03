<template>
  <el-form label-width="84" size="small">
    <!-- 基础字段：所有节点都有 -->
    <el-form-item label="名称">
      <el-input :model-value="node.data?.name" @update:model-value="onNameUpdate" />
    </el-form-item>

    <!-- 各类型专属配置 -->
    <template v-if="type === 'request'">
      <el-form-item label="HTTP 方法">
        <el-select :model-value="config.method" @update:model-value="(v: any) => setConfig('method', v)">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
        </el-select>
      </el-form-item>
      <el-form-item label="URL">
        <el-input :model-value="config.url" placeholder="https://example.com/api/list" @update:model-value="(v: any) => setConfig('url', v)" />
      </el-form-item>
      <el-form-item label="超时(ms)">
        <el-input-number :model-value="config.timeoutMs ?? 30000" :min="1000" :max="120000" :step="1000" @update:model-value="(v: any) => setConfig('timeoutMs', v)" />
      </el-form-item>
      <el-form-item label="Headers(JSON)">
        <el-input :model-value="config.headersJson" type="textarea" :rows="3" placeholder='{"User-Agent":"spider-flow/1.0"}' @update:model-value="(v: any) => setConfig('headersJson', v)" />
      </el-form-item>
      <el-form-item label="Body">
        <el-input :model-value="config.body" type="textarea" :rows="3" placeholder="POST/PUT 请求体" @update:model-value="(v: any) => setConfig('body', v)" />
      </el-form-item>
      <el-form-item label="保存为">
        <el-input :model-value="config.saveAs" placeholder="resp" @update:model-value="(v: any) => setConfig('saveAs', v)" />
      </el-form-item>
    </template>

    <template v-else-if="type === 'extract'">
      <el-form-item label="源变量">
        <el-input :model-value="config.source" placeholder="resp" @update:model-value="(v: any) => setConfig('source', v)" />
      </el-form-item>
      <el-form-item label="抽取类型">
        <el-select :model-value="config.extractorType" @update:model-value="(v: any) => setConfig('extractorType', v)">
          <el-option label="JSONPath" value="jsonpath" />
          <el-option label="正则" value="regex" />
          <el-option label="文本" value="text" />
        </el-select>
      </el-form-item>
      <el-form-item label="表达式">
        <el-input :model-value="config.expression" :placeholder="expressionPlaceholder" @update:model-value="(v: any) => setConfig('expression', v)" />
      </el-form-item>
      <el-form-item label="保存为">
        <el-input :model-value="config.saveAs" @update:model-value="(v: any) => setConfig('saveAs', v)" />
      </el-form-item>
      <el-form-item label="是否列表">
        <el-switch :model-value="!!config.isList" @update:model-value="(v: any) => setConfig('isList', v)" />
      </el-form-item>
    </template>

    <template v-else-if="type === 'loop'">
      <el-form-item label="列表变量">
        <el-input :model-value="config.source" placeholder="items" @update:model-value="(v: any) => setConfig('source', v)" />
      </el-form-item>
      <el-form-item label="元素变量">
        <el-input :model-value="config.itemVar" placeholder="item" @update:model-value="(v: any) => setConfig('itemVar', v)" />
      </el-form-item>
      <el-form-item label="索引变量">
        <el-input :model-value="config.indexVar" placeholder="index" @update:model-value="(v: any) => setConfig('indexVar', v)" />
      </el-form-item>
      <el-form-item label="最大循环数">
        <el-input-number :model-value="config.maxLoops ?? 1000" :min="1" :max="100000" @update:model-value="(v: any) => setConfig('maxLoops', v)" />
      </el-form-item>
    </template>

    <template v-else-if="type === 'script'">
      <el-form-item label="语言">
        <el-select :model-value="config.language ?? 'js'" @update:model-value="(v: any) => setConfig('language', v)">
          <el-option label="JavaScript (Nashorn)" value="js" />
        </el-select>
      </el-form-item>
      <el-form-item label="脚本">
        <el-input :model-value="config.script" type="textarea" :rows="8" placeholder='vars.put("foo", "bar");' @update:model-value="(v: any) => setConfig('script', v)" />
      </el-form-item>
      <el-form-item label="保存为">
        <el-input :model-value="config.saveAs" @update:model-value="(v: any) => setConfig('saveAs', v)" />
      </el-form-item>
    </template>

    <template v-else-if="type === 'db'">
      <el-form-item label="数据源">
        <el-input :model-value="config.dataSource" placeholder="master" @update:model-value="(v: any) => setConfig('dataSource', v)" />
      </el-form-item>
      <el-form-item label="操作">
        <el-select :model-value="config.operation ?? 'select'" @update:model-value="(v: any) => setConfig('operation', v)">
          <el-option label="select (列表)" value="select" />
          <el-option label="selectOne (单行)" value="selectOne" />
          <el-option label="selectInt (整数)" value="selectInt" />
          <el-option label="update (写)" value="update" />
        </el-select>
      </el-form-item>
      <el-form-item label="SQL">
        <el-input :model-value="config.sql" type="textarea" :rows="5" placeholder="select * from t where id = #${id}#" @update:model-value="(v: any) => setConfig('sql', v)" />
      </el-form-item>
      <el-form-item label="参数 JSON">
        <el-input :model-value="config.paramsJson" type="textarea" :rows="2" placeholder='{"id":"${lastId}"}' @update:model-value="(v: any) => setConfig('paramsJson', v)" />
      </el-form-item>
      <el-form-item label="保存为">
        <el-input :model-value="config.saveAs" @update:model-value="(v: any) => setConfig('saveAs', v)" />
      </el-form-item>
    </template>

    <template v-else-if="type === 'sql'">
      <el-form-item label="数据源">
        <el-input :model-value="config.dataSource" placeholder="master" @update:model-value="(v: any) => setConfig('dataSource', v)" />
      </el-form-item>
      <el-form-item label="SQL">
        <el-input :model-value="config.sql" type="textarea" :rows="5" @update:model-value="(v: any) => setConfig('sql', v)" />
      </el-form-item>
    </template>

    <template v-else-if="type === 'function'">
      <el-form-item label="函数名">
        <el-input :model-value="config.name" placeholder="myFunc" @update:model-value="(v: any) => setConfig('name', v)" />
      </el-form-item>
      <el-form-item label="备注">
        <div class="hint">由前置 Script 节点把函数对象塞入 ctx.var，名称一致即可调用。</div>
      </el-form-item>
    </template>

    <template v-else-if="type === 'output'">
      <el-form-item label="变量名">
        <el-input :model-value="config.source" placeholder="items" @update:model-value="(v: any) => setConfig('source', v)" />
      </el-form-item>
      <el-form-item label="仅预览">
        <el-switch :model-value="config.preview !== false" @update:model-value="(v: any) => setConfig('preview', v)" />
      </el-form-item>
    </template>

    <template v-else>
      <el-form-item label="备注">
        <div class="hint">此节点无需配置。</div>
      </el-form-item>
    </template>
  </el-form>
</template>

<script setup lang="ts">
/**
 * 节点属性配置面板：按节点类型动态渲染对应的表单字段。
 *
 * 通过 RelationGraph 的 data.config JSON 与节点双向绑定，
 * 修改字段后调用 setConfig 即时写回画布节点的 data.config。
 */
import { computed, reactive, watch } from 'vue';

interface Props {
  node: any;
}
const props = defineProps<Props>();

const type = computed<string>(() => String(props.node?.data?.type || ''));

const config = reactive<Record<string, any>>({});

watch(
  () => props.node?.data?.config,
  (v: any) => {
    Object.keys(config).forEach(k => delete config[k]);
    Object.assign(config, v || {});
  },
  { immediate: true, deep: true }
);

const expressionPlaceholder = computed(() => {
  switch (config.extractorType) {
    case 'regex':
      return '<title>(.+?)</title>';
    case 'text':
      return '0,200';
    case 'jsonpath':
    default:
      return '$.data.items[*]';
  }
});

function setConfig(key: string, value: any) {
  config[key] = value;
  if (props.node && props.node.data) {
    props.node.data.config = { ...config };
  }
}

function onNameUpdate(name: string) {
  if (props.node && props.node.data) {
    props.node.data.name = name;
    props.node.text = name;
  }
}
</script>

<style scoped>
.hint {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}
</style>

