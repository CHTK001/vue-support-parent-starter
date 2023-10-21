<template>
    <div style="height: calc(100% - 150px); position: relative;" id="container">
        <div id="mountNode"></div>
    </div>
</template>
<script>
import G6 from '@antv/g6';
import insertCss from 'insert-css';
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
    props: {
        data: {type: Object, default: () => {}},
        miniMap: {type: Boolean, default: false},
        tooltip: {type: Boolean, default: false},
        width: {type: Number, default: 0},
        height: {type: Number, default: 0},
        layout: {type: Object, default: () => {
            return {
                layout: {
                    type: 'force2',
                    center: [ 200, 200 ],     // 可选，默认为图的中心
                    linkDistance: 250,         // 可选，边长
                },
            }
        }},
        options: {type: Object, default: () => {
            return {
                animate: true,
                modes: {
                    default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'activate-relations'], // 允许拖拽画布、放缩画布、拖拽节点
                },
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
                
            };
        }
        },
    },
    data() {
        return {
            graph: null,
            nodes: this.data?.nodes ||  [],
            edges: this.data?.edges ||  [],
        }
    },
    mounted(){
        if(this.nodes.length > 0 || this.edges.length > 0) {
            this.registerGraph();
        }
    },
    methods: {
        addNode(node) {
            this.graph.addItem('node', node);
            this.nodes.push(node);
        },
        addNodes(nodes) {
            for(const node of nodes) {
                this.addNode(node);
            }
        },
        addEdge(edge) {
            this.graph.addItem('edge', edge);
            this.edges.push(edge);
        },

        addEdges(edges) {
            for(const edge of edges) {
                this.addEdge(edge);
            }
        },
        remove(nodeId) {
            this.graph.removeItem( nodeId);
        },
        layout(){
            this.graph.layout();
        },
        destroy(){
            if(!this.graph) {
                return;
            }
            this.graph.destroy();
        },
        refresh(data){
            this.nodes = data?.nodes || [];
            this.edges = data?.edges || [];
            this.registerGraph();

        },
        registerGraph() {
            // 实例化 minimap 插件
            const container = document.getElementById('container');
            const width1 = this.width || container.scrollWidth;
            const height1 = this.height || container.scrollHeight || 500;
            const plugins = [];
            if(this.miniMap) {
                plugins.push(this.registerMiniMap());
            }
            if(this.tooltip) {
                plugins.push(this.registerTooltip());
            }
            const config = {
                container: 'mountNode', // String | HTMLElement，必须，在 Step 1 中创建的容器 id 或容器本身
                width: width1, // Number，必须，图的宽度
                height: height1, // Number，必须，图的高度
                fitCenter: true,
                plugins: plugins, // 将 minimap 实例配置到图上
            };
            Object.assign(config, this.options);
            Object.assign(config, this.layout);
            this.graph = new G6.Graph(config);
            this.graph.data({
                nodes: this.nodes,
                edges: this.edges
            }); // 读取 Step 2 中的数据源到图上
            this.graph.render(); // 渲染图
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
    }
}
</script>