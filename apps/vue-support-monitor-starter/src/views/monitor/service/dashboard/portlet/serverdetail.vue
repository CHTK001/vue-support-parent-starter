<template>
  <div class="datav">
    <scDrag ref="dragRef" v-model="visible" :draggable="false" :mini="true" height="80vh" width="80vw" :tech="datav" @close="onClose" @refresh="doQuery">
      <div class="h-full z-[10]">
        <div id="container1" key="node" ref="echartsRef" height="100%" width="100%" style="height: calc(100% - 60px)" />
      </div>
    </scDrag>
  </div>
</template>
<script>
import { fetchIndicatorHGet } from "@/api/monitor/service";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import scDrag from "@repo/components/ScDrag/index.vue";
import { dateFormat } from "@repo/utils";
import { Md5 } from "ts-md5";
import { Graph } from "@antv/g6";

const graph = {
  value: null
};
export default {
  components: { scDrag },
  props: {
    form: Object,
    datav: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      time: [],
      visible: false,
      confirmLoading: false
    };
  },
  mounted() {
    this.time[1] = new Date().getTime();
    this.time[0] = new Date().getTime() - 86400000;
  },
  methods: {
    useRenderIcon,
    afterPropertiesSet() {
      const container = document.getElementById("container1");
      const width = container.scrollWidth;
      const height = container.scrollHeight || 500;
      graph.value = new Graph({
        container: "container1",
        width,
        height,
        behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
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
      this.doQuery();
    },
    doQuery() {
      const q = {};
      Object.assign(q, this.form.condition);
      q.name = "server:" + Md5.hashStr("SERVER:" + this.form.host + this.form.port);
      q.fromTimestamp = this.time[0];
      q.count = 100;
      q.toTimestamp = this.time[1];
      fetchIndicatorHGet(q).then(res => {
        try {
          const data = res.data;
          const keys = Object.keys(data);
          keys.forEach(key => {
            const item = data[key];
            this.refresh(JSON.parse(item));
          });
          graph.value.render();
        } catch (error) {}
      });
    },
    refresh(data) {
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
    },
    onClose() {
      this.visible = false;
      this.confirmLoading = false;
      graph.value?.destroy();
      this.$emit("close");
    },
    open() {
      this.visible = true;
      this.$nextTick(() => {
        setTimeout(() => {
          this.afterPropertiesSet();
        }, 500);
      });
    }
  }
};
</script>
<style lang="scss" scoped>
.datav {
  position: relative;
  top: 10px;
}
:deep(.el-picker__popper) {
  z-index: 10;
}
</style>
