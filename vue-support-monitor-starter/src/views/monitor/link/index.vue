<template>
    <el-container id="mountNode1">
        <el-header>
            <div class="left-panel">
                <el-select v-model="form.appName" clearable placeholder="请选择应用">
                    <el-option v-for="item in apps" :key="item.monitorAppname" :value="item.monitorAppname" :label="item.monitorAppname">
                    	<span>{{ item.monitorAppname }}</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">{{ item.monitorName }}</span>
                    </el-option>
                </el-select>
                <el-select v-if="form.appValue"  v-model="form.appModelValue" clearable placeholder="请选择系统">
                    <el-option v-for="item in appsModel[form.appValue]" :key="item"  :value="item" :label="item.serverHost + ':' + item.serverPort ">
                    	<span>{{ item.serverHost }}:{{ item.serverPort }}</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">{{ item.contextPath }}</span>
                    </el-option>
                </el-select>

                <el-button type="primary pl-1" style="margin-left: 10px" icon="el-icon-search" @click="query"></el-button>
            </div>
        </el-header>
        <el-main>
            <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
                <div id="mountNode"></div>
            </div>

            <el-button type="danger" icon="el-icon-delete" 
                style="position: fixed; right: 0; top: 55%; width: 40px; height: 40px;" @click="data.length = 0"></el-button>
            <el-dialog draggable v-model="showFile">
                <el-input ref="input" v-model="input" placeholder="搜索" size="large" clearable prefix-icon="el-icon-search"
                    @keyup.enter="enterQuery" :trigger-on-focus="false" />
            </el-dialog>
        </el-main>
    </el-container>
</template>

<script>
import { default as AnsiUp } from 'ansi_up';
import Base64 from "@/utils/base64";
import  { inject } from "vue"
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
    data() {
        return {
            input: '',
            showFile: 0,
            data: [],
            apps: [],
            appsModel: {},
            form: {
                appName: '',
                appModelValue: ''
            },
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
        try{
            this.form.appValue = this.$route.query.appName;
            this.form.appModelValue = JSON.parse(Base64.decode(this.$route.query.data));
        }catch(e){}
        this.afterPrepertiesSet();
    },
    methods: {
        intialMinimap(){
            return new G6.Minimap({
                size: [100, 100],
                className: 'minimap',
                type: 'delegate',
            });
        },
        getImg(name) {
				return getAssetsImages(name + ".png");
			},
        query(){
            this.nodes.length = 0;
            this.edges.length = 0;
            if(null != this.graph) {
                this.graph.destroy();
            }

            if(!this.form.appName) {
                this.$message.error('请选择应用');
                return false;
            }
            const serverAddressValue = this.form.appModelValue.serverHost ?  this.form.appModelValue.serverHost +"_" + this.form.appModelValue.serverPort: null
            this.$API.monitor.link.get({
                appName: this.form.appName,
                serverAddress:serverAddressValue
            }).then(res => {
                if (res.code === '00000') {
                    res.data.forEach(element => {
                        this.nodes.push({
                            id: element.sourceHost+element.sourcePort,
                            label:element.sourceHost+':' + element.sourcePort,
                            size: 20,
                            type: 'image',
                            img: this.getImg(element?.sourceName?.toLowerCase() || element.name.toLowerCase())
                        });
                        this.nodes.push({
                            id: element.targetHost+element.targetPort,
                            label:element.targetHost+':' + element.targetPort,
                            size: 20,
                            type: 'image',
                            img: this.getImg(element.name.toLowerCase())
                        });

                        this.edges.push({
                            source: element.sourceHost+element.sourcePort,
                            target: element.targetHost+element.targetPort,
                        });
                    })
                    this.$nextTick(() => {
                        this.graph = new G6.Graph({
                            container: 'mountNode', // String | HTMLElement，必须，在 Step 1 中创建的容器 id 或容器本身
                            width: this.$refs.containerRef.offsetWidth - 20, // Number，必须，图的宽度
                            height: this.$refs.containerRef.offsetHeight - 200, // Number，必须，图的高度
                            fitView: true,
                            defaultEdge: {
                                type: 'line-dash',
                                style: {
                                    lineWidth: 2,
                                    stroke: '#bae7ff',
                                },
                            },
                            modes: {
                                default: ['drag-canvas', 'zoom-canvas', 'drag-node'], // 允许拖拽画布、放缩画布、拖拽节点
                            },
                            layout: {
                                type: 'force2',
                                animate: true, // 设置为 false 可关闭布局动画
                                maxSpeed: 50,
                                linkDistance: 50,
                            },
                            plugins: [this.intialMinimap()]
                        });
                        this.graph.data({nodes: this.nodes, edges: this.edges}); // 读取 Step 2 中的数据源到图上
                        this.graph.render(); // 渲染图
                    })
                }
            })
        },
        async afterPrepertiesSet(){
            this.$API.monitor.app.list.get().then(res => {
                if(res.code === '00000') {
                    this.apps = res.data;
                    this.apps.forEach(item => {
                        this.appsModel[item.monitorAppname] = item?.monitorRequests || [];
                    })
                }
            });
        },
    }
}
</script>