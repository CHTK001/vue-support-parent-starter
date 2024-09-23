<template>
  <div class="h-full w-full">
    <div id="container" key="node" ref="echartsRef" height="100%" width="100%" class="h-[250px]" />
  </div>
</template>
<script setup>
import { fetchIndicatorHGet } from "@/api/monitor/service";
import { Md5 } from "ts-md5";
import { computed, defineExpose, defineProps, nextTick, onBeforeMount, onMounted, onUnmounted, reactive, ref } from "vue";
import scEcharts from "@/components/ScEcharts/index.vue";
import { Graph } from "@antv/g6";

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
const echartsRef = ref();
const graph = {
  value: null
};
const initialContainer = () => {
  const container = document.getElementById("container");
  const width = container.scrollWidth;
  const height = container.scrollHeight || 500;
  graph.value = new Graph({
    container: "container",
    width,
    height,
    behaviors: ["drag-canvas", "zoom-canvas"],
    layout: {
      type: "force",
      linkDistance: 50,
      clustering: true,
      nodeClusterBy: "cluster",
      clusterNodeStrength: 70
    },
    node: {
      style: {
        labelText: d => d.name,
        labelFill: "#fff",
        ports: []
      },
      palette: {
        type: "group",
        field: "cluster"
      }
    },
    defaultNode: {
      color: "#5B8FF9"
    },
    modes: {
      default: ["drag-canvas"]
    }
  });
  initial();
};
const initial = async () => {
  if (props.history) {
    const q = {};
    Object.assign(q, props.condition);
    q.name = "server:" + Md5.hashStr("SERVER:" + props.form.host + props.form.port);
    fetchIndicatorHGet(q).then(res => {
      try {
        const data = res.data;
        const keys = Object.keys(data);
        keys.forEach(key => {
          const item = data[key];
          refresh(JSON.parse(item));
        });
        graph.value.render();
      } catch (error) {}
    });
  }
};
onBeforeMount(async () => {});

onMounted(async () => {
  initialContainer();
});
const refresh = async data => {
  data.id = Md5.hashStr(data.sourceHost + data.sourcePort + data.targetHost + data.targetPort);
  const sourceNodeId = Md5.hashStr(data.sourceHost + data.sourcePort);
  const targetNodeId = Md5.hashStr(data.targetHost + data.targetPort);
  let nodes = [...graph.value.getNodeData()],
    edges = [];
  if (!graph.value.getNodeData(sourceNodeId)) {
    nodes.push({
      id: sourceNodeId,
      name: data.name + "\n" + data.sourceHost + ":" + data.sourcePort,
      data: data
    });
  }
  if (!graph.value.getNodeData(targetNodeId)) {
    nodes.push({
      id: targetNodeId,
      name: data.name + "\n" + data.targetHost + ":" + data.targetPort,
      data: data
    });
  }
  edges = [
    ...graph.value.getEdgeData(),
    {
      source: sourceNodeId,
      target: targetNodeId
    }
  ];

  graph.value.setData({
    nodes,
    edges
  });
};
const update = async data => {
  refresh(data);
  graph.value.render();
};

defineExpose({
  update
});
</script>
