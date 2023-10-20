<template>
    <div style="height: calc(100% - 150px); position: relative;" id="container">
        <div id="mountNode"></div>
        <div class="properties absolute left-0 top-0">
            <el-row class="hover:shadow-xl cursor-default mt-6 h-12 p-4 flex-1 w-64 rounded-lg flex items-center justify-center bg-blue-500 shadow-lg">
                <span class="text-white" style="text-align: 12px; line-height: 12px; font-weight: 800;">节点数量: {{ node?.data }}</span>
            </el-row>

            <el-row class="hover:shadow-xl mt-6 h-12 cursor-default p-4 flex-1 w-64 rounded-lg flex items-center justify-center bg-blue-500 shadow-lg">
                <span class="text-white" style="text-align: 12px; line-height: 12px; font-weight: 800;">关系数量: {{ relation?.data }}</span>
            </el-row>

            <!-- <el-row class="hover:shadow-xl mt-6 h-12 cursor-default p-4 flex-1 w-64 rounded-lg flex items-center justify-center bg-blue-500 shadow-lg">
                <p class="text-white" style="text-align: 12px; line-height: 12px;">properties</p>
            </el-row> -->
        </div>
        <sc-code-editor class="absolute top-0 mt-6"  v-if="false"
            :options="{height: 30}" 
            style="width: 50vw; left: calc((100% - 50vw) / 2);" ref="input"  v-model="input" mode="yml"
        ></sc-code-editor>

        <el-row class="absolute top-0 mt-6" style="width: 50vw; left: calc((100% - 50vw) / 2);">
            <el-col :span="18">
                <el-input style="float: left;"  ref="input" v-model="input" placeholder="搜索" size="large" clearable prefix-icon="el-icon-search" @keyup.enter.stop="enterQuery" :trigger-on-focus="false" />
            </el-col>
            <el-col :span="6">
                <el-button :loading="isSearchload" style="float: left; height: 38px; margin-left: 10px" @click="enterQuery" icon="el-icon-search" type="primary" ></el-button>
            </el-col>
        </el-row>
    </div>
</template>
<script>
import G6 from '@antv/g6';
import insertCss from 'insert-css';
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
insertCss(`
  .g6-component-tooltip {
    border: 1px solid #e2e2e2;
    border-radius: 4px;
    font-size: 12px;
    color: #000;
    background-color: rgba(255, 255, 255, 0.9);
    padding: 10px 8px;
    box-shadow: rgb(174, 174, 174) 0px 0px 10px;
  }
`);

export default {
    components:{scCodeEditor},
    data() {
        return {
            isSearchload: false,
            form: {},
            node: null,
            relation: null,
            properties: null,
            graph: null,
            input: null,
            nodes: [],
            edges: []
        }
    },
    unmounted(){
        // window.removeEventListener("keydown", this.enterQuery);
    },
    mounted() {
        // window.addEventListener("keydown", this.enterQuery, false);
        this.form.genId = this.$route.params.genId;
        if (!this.form.genId || this.form.genId === 'null') {
            delete this.form.genId;
        }
        this.input = "MATCH (n1) -[r]->(n2) RETURN * LIMIT 100";
        this.doRefresh();
        this.registerLineDash();
        this.registerGraph();
    },
    methods: {
       async enterQuery(event){
            if(!this.input) {
                return;
            }

            this.isSearchload = true;
            try {
                const res = await this.$API.gen.session.execute.post({content: this.input, genId: this.form.genId});
                if (res.code === '00000') {
                    for(const node of this.nodes) {
                        this.graph.removeItem(node.id);
                    }
                    for(const edge of this.edges) {
                        this.graph.removeItem(edge.id);
                    }

                    this.resultData = res.data.data[0];
                    this.nodes = this.resultData.nodes;
                    for(const node of this.nodes) {
                        this.graph.addItem('node', node);
                    }
                    this.edges = this.resultData.edges;
                    for(const edge of this.edges) {
                        this.graph.addItem('edge', edge);
                    }
                    this.graph.layout();
                    this.cost = res.data?.cost;
                } else {
                    this.message = res.msg;
                    this.resultData = {};
                    this.resultTotal = 0;
                }
            }catch(e) {}
            this.isSearchload = false;
        },
        async doRefresh() {
            this.isLoaded = true;
            this.$API.gen.session.info.post(this.form).then(res => {
                if (res.code == '00000') {
                    this.data = res.data?.data;
                    for (const item of this.data) {
                        if (item.name === 'node') {
                            this.node = item;
                            continue
                        }

                        if (item.name === 'relation') {
                            this.relation = item;
                            continue
                        }

                        if (item.name === 'properties') {
                            this.properties = item;
                            continue
                        }
                    }
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isLoaded = false);

        },
        registerTooltip() {
            return new G6.Tooltip({
                offsetX: 10,
                offsetY: 10,
                fixToNode: [1, 0.5],
                // the types of items that allow the tooltip show up
                // 允许出现 tooltip 的 item 类型
                itemTypes: ['node', 'edge'],
                // custom the tooltip's content
                // 自定义 tooltip 内容
                getContent: (e) => {
                    const outDiv = document.createElement('div');
                    outDiv.style.width = 'fit-content';
                    outDiv.style.height = 'fit-content';
                    const model = e.item.getModel();
                    if (e.item.getType() === 'node') {
                        outDiv.innerHTML = `${model.label}`;
                    } else {
                        const source = e.item.getSource();
                        const target = e.item.getTarget();
                        outDiv.innerHTML = `来源：${source.getModel().label}<br/>去向：${target.getModel().label}`;
                    }
                    return outDiv;
                },
            });
        },
        registerMiniMap() {
            return new G6.Minimap({
                size: [100, 100],
                className: 'minimap',
                position: 'bottom',
                type: 'delegate',
            });
        },
        registerGraph() {
            // 实例化 minimap 插件
            const container = document.getElementById('container');
            const width = container.scrollWidth;
            const height = container.scrollHeight || 500;
            this.graph = new G6.Graph({
                container: 'mountNode', // String | HTMLElement，必须，在 Step 1 中创建的容器 id 或容器本身
                width, // Number，必须，图的宽度
                height, // Number，必须，图的高度
                defaultEdge: {
                    type: 'line-dash',
                    style: {
                        lineWidth: 2,
                        stroke: '#bae7ff',
                    },
                },
                defaultNode: {
                    type: "circle",
                    size: [60],
                    labelCfg: {
                        position: 'bottom',
                        style: {
                            fontSize: 12
                        }
                    },
                    icon: {
                        show: true,
                    }
                },
                fitCenter: true,
                modes: {
                    default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'activate-relations'], // 允许拖拽画布、放缩画布、拖拽节点
                },
                plugins: [this.registerMiniMap(), this.registerTooltip()], // 将 minimap 实例配置到图上
                animate: true,
                layout: {
                    type: 'force2',
                    center: [ 200, 200 ],     // 可选，默认为图的中心
                    linkDistance: 50,         // 可选，边长
                    nodeStrength: 30,         // 可选
                    edgeStrength: 0.1,        // 可选
                    nodeSize: 30,             // 可选
                    onTick: () => {           // 可选
                    console.log('ticking');
                    },
                    onLayoutEnd: () => {      // 可选
                    console.log('force layout done');
                    },
                    workerEnabled: true,      // 可选，开启 web-worker
                },
            });
            this.graph.data({}); // 读取 Step 2 中的数据源到图上
            this.graph.render(); // 渲染图
        },
        registerLineDash() {
            const lineDash = [4, 2, 1, 2];
            G6.registerEdge(
                'line-dash',
                {
                    afterDraw(cfg, group) {
                        // get the first shape in the group, it is the edge's path here=
                        const shape = group.get('children')[0];
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

        }
    }
}
</script>