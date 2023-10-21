<template>
    <div style="height: calc(100% - 150px); position: relative;" id="container">
        <div id="mountNode"></div>
    </div>
</template>
<script>
import G6 from '@antv/g6';
const { getLabelPosition, transform } = G6.Util;

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
        data: { type: Object, default: () => { } },
        miniMap: { type: Boolean, default: false },
        tooltip: { type: Boolean, default: false },
        width: { type: Number, default: 0 },
        height: { type: Number, default: 0 },
        layouts: {
            type: Object, default: () => {
                return {
                    layout: {
                        type: 'force2',
                        preventOverlap: true,
                        linkDistance: 200, // 指定边距离为100
                    },
                }
            }
        },
        options: {
            type: Object, default: () => {
                return {
                    modes: {
                        default: ['drag-canvas', 'zoom-canvas', 'drag-node', 'activate-relations'], // 允许拖拽画布、放缩画布、拖拽节点
                    },
                    defaultEdge: {
                        type: 'arrow-running',
                        style: {
                            lineWidth: 2,
                            stroke: '#bae7ff',
                        },
                        curveOffset: 1,
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
            nodes: this.data?.nodes || [],
            edges: this.data?.edges || [],
        }
    },
    unmounted() {
        this.destroy();
    },
    mounted() {
        this.registerArrowAnimation();
        this.registerDashAnimation();
        if (this.nodes.length > 0 || this.edges.length > 0) {
            this.registerGraph();
        }
    },
    methods: {
        addNode(node) {
            this.graph.addItem('node', node);
            this.nodes.push(node);
        },
        addNodes(nodes) {
            for (const node of nodes) {
                this.addNode(node);
            }
        },
        addEdge(edge) {
            this.graph.addItem('edge', edge);
            this.edges.push(edge);
        },

        addEdges(edges) {
            for (const edge of edges) {
                this.addEdge(edge);
            }
        },
        remove(nodeId) {
            this.graph.removeItem(nodeId);
        },
        layout() {
            this.graph.layout();
        },
        destroy() {
            if (!this.graph) {
                return;
            }
            this.graph.destroy();
        },
        refresh(data) {
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
            if (this.miniMap) {
                plugins.push(this.registerMiniMap());
            }
            if (this.tooltip) {
                plugins.push(this.registerTooltip());
            }
            const config = {
                container: 'mountNode', // String | HTMLElement，必须，在 Step 1 中创建的容器 id 或容器本身
                width: width1, // Number，必须，图的宽度
                height: height1, // Number，必须，图的高度
                fitCenter: true,
                autoPaint: false,
                plugins: plugins, // 将 minimap 实例配置到图上
            };
            Object.assign(config, this.options);
            Object.assign(config, this.layouts);
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
        registerDashAnimation() {
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

        },
        registerArrowAnimation() {
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


            G6.registerNode(
                'leaf-node',
                {
                    afterDraw(cfg, group) {
                        group.addShape('circle', {
                            attrs: {
                                x: 0,
                                y: 0,
                                r: 5,
                                fill: cfg.color || '#5B8FF9',
                            },
                            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
                            name: 'circle-shape',
                        });
                    },
                    getAnchorPoints() {
                        return [
                            [0, 0.5],
                            [1, 0.5],
                        ];
                    },
                },
                'circle',
            );

            G6.registerNode(
                'center-node',
                {
                    afterDraw(cfg, group) {
                        const r = cfg.size / 2;
                        group.addShape('circle', {
                            zIndex: -3,
                            attrs: {
                                x: 0,
                                y: 0,
                                r: r + 10,
                                fill: 'gray',
                                opacity: 0.4,
                            },
                            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
                            name: 'circle-shape1',
                        });
                        group.addShape('circle', {
                            zIndex: -2,
                            attrs: {
                                x: 0,
                                y: 0,
                                r: r + 20,
                                fill: 'gray',
                                opacity: 0.2,
                            },
                            // must be assigned in G6 3.3 and later versions. it can be any string you want, but should be unique in a custom item type
                            name: 'circle-shape2',
                        });
                        group.sort();
                    },
                    getAnchorPoints() {
                        return [
                            [0, 0.5],
                            [1, 0.5],
                        ];
                    },
                },
                'circle',
            );

            // lineDash array
            const lineDash = [4, 2, 1, 2];

            G6.registerEdge(
                'can-running',
                {
                    setState(name, value, item) {
                        const shape = item.get('keyShape');
                        if (name === 'running') {
                            if (value) {
                                let index = 0;
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
                                        // return the params for this frame
                                        return res;
                                    },
                                    {
                                        repeat: true,
                                        duration: 3000,
                                    },
                                );
                            } else {
                                shape.stopAnimate();
                                shape.attr('lineDash', null);
                            }
                        }
                    },
                },
                'cubic-horizontal',
            );


        }
    }
}
</script>