<template>
  <div class="h-full w-full">
    <el-empty v-if="!hasData" />
    <scEcharts v-else key="node" ref="echartsRef" height="100%" width="100%" :option="serverOptions" />
  </div>
</template>
<script setup>
import { fetchIndicatorHGet } from "@/api/monitor/service";
import { Md5 } from "ts-md5";
import { computed, defineExpose, defineProps, nextTick, onBeforeMount, onUnmounted, reactive, ref } from "vue";
import scEcharts from "@/components/ScEcharts/index.vue";

const props = defineProps({
  history: Boolean,
  form: Object,
  condition: Object
});
const edges = ref([]);
const nodes = ref([]);
const nodesIds = ref([]);
const hasData = computed(() => {
  return nodes.value.length > 0;
});
const serverOptions = reactive({
  series: [
    {
      type: "graph",
      layout: "force",
      animation: false,
      data: nodes.value,
      symbolSize: 40,
      edgeSymbolSize: [4, 10],
      roam: true,
      label: {
        show: true,
        fontSize: 12,
        position: "right",
        formatter: "{b}"
      },
      force: {
        repulsion: 100,
        edgeLength: 140
      },
      lineStyle: {
        width: 3,
        color: "#fff"
      },
      edges: edges.value
    }
  ],
  animationDurationUpdate: 1500,
  animationEasingUpdate: "quinticInOut"
});
const echartsRef = ref();

const initial = async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    const sourceNodeId = "127.0.0.1" + props.form.port;
    if (nodesIds.value.indexOf(sourceNodeId) == -1) {
      nodes.value.push({
        id: sourceNodeId,
        name: "主机",
        data: {}
      });
      nodesIds.value.push(sourceNodeId);
    }
    q.name = "server:" + Md5.hashStr("SERVER:" + props.form.host + props.form.port);
    fetchIndicatorHGet(q).then(res => {
      try {
        const data = res.data;
        const keys = Object.keys(data);
        keys.forEach(key => {
          const item = data[key];
          refresh(JSON.parse(item));
        });
      } catch (error) {}
    });
  }
};
onBeforeMount(async () => {
  initial();
});

const refresh = async data => {
  data.id = Md5.hashStr(data.sourceHost + data.sourcePort + data.targetHost + data.targetPort);
  const sourceNodeId = data.sourceHost + data.sourcePort;
  const targetNodeId = data.targetHost + data.targetPort;
  if (nodesIds.value.indexOf(targetNodeId) == -1) {
    nodes.value.push({
      id: targetNodeId,
      name: data.name + "\n" + data.targetHost + ":" + data.targetPort,
      data: data
    });
    nodesIds.value.push(targetNodeId);
  }
  edges.value.push({
    source: sourceNodeId,
    target: targetNodeId
  });
};
const update = async data => {
  refresh(data);
};

defineExpose({
  update
});
</script>
