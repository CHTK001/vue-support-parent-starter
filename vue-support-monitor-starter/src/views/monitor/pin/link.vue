<template>
  <div class="text-white">链路追踪</div>
  <div id="mountNode1" class="h-full " v-if="!loading">
    <div ref="containerRef" style="height: 100%; width: 100%;overflow: auto;" @keyup="keyEvent">
      <div id="mountNode" class="h-full"></div>
    </div>
  </div>
</template>

<script>
import { default as AnsiUp } from 'ansi_up';
import Base64 from "@/utils/base64";
import { inject } from "vue"
import G6 from '@antv/g6';
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';

const { getLabelPosition, transform } = G6.Util;

const ansi_up = new AnsiUp();

const lineDash = [4, 2, 1, 2];
G6.registerEdge(
  'line-dash',
  {
    afterDraw(cfg, group) {
      // get the first shape in the group, it is the edge's path here=
      const shape = group.get('children')[0];

      const arrow = group.addShape("marker", {
        attrs: {
          x: 16,
          y: 0,
          r: 8,
          lineWidth: 2,
          stroke: "#3370ff",
          fill: "#fff",
          symbol: (x, y, r) => {
            return [
              ["M", x - 6, y - 4],
              ["L", x - 2, y],
              ["L", x - 6, y + 4]
            ];
          }
        }
      });
      arrow.animate(
        (ratio) => {
          // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
          // get the position on the edge according to the ratio
          const tmpPoint = shape.getPoint(ratio);
          const pos = getLabelPosition(shape, ratio);
          let matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
          matrix = transform(matrix, [
            ["t", -tmpPoint.x, -tmpPoint.y],
            ["r", pos.angle],
            ["t", tmpPoint.x, tmpPoint.y]
          ]);

          // returns the modified configurations here, x and y here
          return {
            x: tmpPoint.x,
            y: tmpPoint.y,
            matrix
          };
        },
        {
          repeat: true, // Whether executes the animation repeatly
          duration: 3000 // the duration for executing once
        }
      );
      let index = 0;
      // Define the animation
      shape.animate(
        () => {
          index++;
          if (index > 9) {
            index = 0;
          }
          const res = {
            lineDash,
            lineDashOffset: -index,
          };
          // returns the modified configurations here, lineDash and lineDashOffset here
          return res;
        },
        {
          repeat: true, // whether executes the animation repeatly
          duration: 3000, // the duration for executing once
        },
      );
    },
  },
  'cubic', // extend the built-in edge 'cubic'
);

G6.registerEdge(
  "arrow-running",
  {
    afterDraw(cfg, group) {
      // get the first shape in the group, it is the edge's path here=
      const shape = group.get("children")[0];

      const arrow = group.addShape("marker", {
        attrs: {
          x: 16,
          y: 0,
          r: 8,
          lineWidth: 2,
          stroke: "#3370ff",
          fill: "#fff",
          symbol: (x, y, r) => {
            return [
              ["M", x - 6, y - 4],
              ["L", x - 2, y],
              ["L", x - 6, y + 4]
            ];
          }
        }
      });

      // animation for the red circle
      arrow.animate(
        (ratio) => {
          // the operations in each frame. Ratio ranges from 0 to 1 indicating the prograss of the animation. Returns the modified configurations
          // get the position on the edge according to the ratio
          const tmpPoint = shape.getPoint(ratio);
          const pos = getLabelPosition(shape, ratio);
          let matrix = [1, 0, 0, 0, 1, 0, 0, 0, 1];
          matrix = transform(matrix, [
            ["t", -tmpPoint.x, -tmpPoint.y],
            ["r", pos.angle],
            ["t", tmpPoint.x, tmpPoint.y]
          ]);

          // returns the modified configurations here, x and y here
          return {
            x: tmpPoint.x,
            y: tmpPoint.y,
            matrix
          };
        },
        {
          repeat: true, // Whether executes the animation repeatly
          duration: 3000 // the duration for executing once
        }
      );
    }
  },
  "cubic" // extend the built-in edge 'cubic'
);

export default {
  name: 'log',
  props: {
    data: {
      type: Object,
      default: () => {
        return {}
      }
    },
    loadLink: {
      type: Boolean,
      default: true
    },
  },
  data() {
    return {
      loading: this.loadLink,
      input: '',
      showFile: 0,
      data: [],
      apps: [],
      appsModel: {},
      form: this.data,
      selectedValues: {

      },
      nodes: [],
      edges: [],
      selectedValuesItem: [{
        title: "模块",
        key: "module",
        multiple: !1,
        options: []
      }],
      socket: inject('socket'),
      graph: null
    }
  },
  updated() {
    this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
  },
  mounted() {
    this.afterPrepertiesSet();
    this.query();
  },
  methods: {
    intialMinimap() {
      return new G6.Minimap({
        size: [100, 100],
        className: 'minimap',
        type: 'delegate',
      });
    },
    getImg(name) {
      return getAssetsImages(name + ".png");
    },
    query() {
      this.nodes.length = 0;
      this.edges.length = 0;
      if (null != this.graph) {
        this.graph.destroy();
      }

      if (!this.form.appName) {
        this.$message.error('请选择应用');
        return false;
      }
      this.$API.monitor.link.get({
        appName: this.form.appName,
        serverAddress: this.form.appModelValue?.replace(":", "_")
      }).then(res => {
        this.loading = false;
        this.$emit('success', true)
        if (res.code === '00000') {
          res.data.forEach(element => {
            this.nodes.push({
              id: element.sourceHost + element.sourcePort,
              label: element.sourceHost + (element.sourcePort ? (':' + element.sourcePort) : ''),
              size: 20,
              type: 'image',
              fill: '#fff',
              style: {
                  fill: '#5B8FF9', // 填充颜色
                },
              img: this.getImg(element?.sourceName?.toLowerCase() )
            });
            this.nodes.push({
              id: element.targetHost + element.targetPort,
              label: element.targetHost + (element.targetPort ? (':' + element.targetPort) : ''),
              size: 20,
              fill: '#fff',
              type: 'image',
              img: this.getImg(element.name?.toLowerCase())
            });

            this.edges.push({
              source: element.sourceHost + element.sourcePort,
              target: element.targetHost + element.targetPort,
            });
          })
          this.$nextTick(() => {
            this.graph = new G6.Graph({
              container: 'mountNode', // String | HTMLElement，必须，在 Step 1 中创建的容器 id 或容器本身
              width: (this.$refs.containerRef.offsetWidth || document.getElementById('pane-0').offsetWidth) - 20, // Number，必须，图的宽度
              height: (this.$refs.containerRef.offsetHeight || document.getElementById('pane-0').offsetHeight) - 10, // Number，必须，图的高度
              defaultEdge: {
                type: 'line-dash',
                style: {
                  lineWidth: 2,
                  stroke: '#bae7ff',
                },
              },
              fitView: true,
              fitViewPadding: [0, 0, 0, 0],
              defaultNode: {
                labelCfg: {
                  // 节点上的标签文本样式配置
                  style: {
                    fill: '#fff', // 节点标签文字颜色
                  },
                },
                style: {
                  fill: '#5B8FF9', // 填充颜色
                }
              },
              modes: {
                default: ['drag-canvas', 'zoom-canvas', 'drag-node'], // 允许拖拽画布、放缩画布、拖拽节点
              },
              layout: {
                type: 'force2',
                animate: false, // 设置为 false 可关闭布局动画
                maxSpeed: 100,
                linkDistance: 100,
              },
              //plugins: [this.intialMinimap()]
            });
            this.graph.data({ nodes: this.nodes, edges: this.edges }); // 读取 Step 2 中的数据源到图上
            this.graph.render(); // 渲染图
          })
        }
      }).finally(() => {
        this.loading = false;
        this.$emit('success', true)
      })
    },
    async afterPrepertiesSet() {
      // this.$API.monitor.app.list.get().then(res => {
      //     if(res.code === '00000') {
      //         this.apps = res.data;
      //         this.apps.forEach(item => {
      //             this.appsModel[item.monitorAppname] = item?.monitorRequests || [];
      //         })
      //     }
      // });
    },
  }
}
</script>