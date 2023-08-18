<template>
    <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
        <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick">
            <template #default="{ node, data }">
                <span class="custom-tree-node" :title="data.title">
                    <span v-if="data.id == data.linkId">
                        <span>Http {{ data.ex ?? data.message }}</span>
                    </span>
                    <span v-else >
                        <span v-if="(data.ex || data.message || '').indexOf('span') > -1" v-html="data.ex ?? data.message"></span>
                        <span v-else>{{ data.ex ?? data.message }}</span>
                    </span>
                    <div v-if="showStack[data.id]">
                        <div v-for="it in data.stack">
                            {{ it }}
                        </div>
                </div>
                </span>
            </template>
        </el-tree>
    </div>

    <el-button type="primary" icon="el-icon-search" style="position: fixed; right: 0; top: 50%; width: 40px; height: 40px;"
        @click="showFile = !0"></el-button>

    <el-dialog draggable v-model="showFile">
        <el-input ref="input" v-model="input" placeholder="搜索" size="large" clearable prefix-icon="el-icon-search"
            @keyup.enter="enterQuery" :trigger-on-focus="false" />
    </el-dialog>
</template>

<script>
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'UniformLog',
    data() {
        return {
            showStack: {},
            input: '',
            showFile: 0,
            data: [],
            defaultProps: {
                children: 'children',
                label: 'ex',
            },
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted() {
        this.subscribe('trace');
    },
    created() {
        var _this = this;
        document.onkeydown = function (e) {
            let key = window.event.keyCode;
            if (key == 113) {
                _this.showFile = !0;
                _this.input = '';
                _this.nextTick(() => {
                    _this.$refs.input.focus();
                })
            }
        }
    },
    methods: {
        enterQuery() {
            this.$API.config.search.get({
                keyword: this.input,
            }).then(res => {
                if (res.code === '00000') {
                    this.data.length = 0;
                    this.data = res.data.map(it => ansi_up.ansi_to_html(it?.message));
                    this.showFile = 0;
                }
            })
        },
        subscribe: function (mode) {
            const _this = this;
            var ansi_up = new AnsiUp();
            const eventSource = new EventSource(this.$API.config.uniform.url + mode);
            eventSource.addEventListener("trace", (event) => {
                const data = JSON.parse(event.data);
                let msg = data.message;
                msg = msg.substring(msg.indexOf("[trace]") + 7);
                msg = JSON.parse(msg)
                this.data.push(msg[0]);
                if (this.data.length > 10000) {
                    this.data.shift();
                }
            });
            eventSource.onerror = function (event) {
            };
            eventSource.onopen = function (event) {
                _this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
            };
        },
    }
}
</script>
<style lang="less" scoped>
:deep(.el-tree-node__content) {
    background: white;
    box-shadow: 0px 3px 5px 0px #ccc;
}
:deep(.el-tree-node .is-focusable) {
    margin-bottom: 6px;
    margin: 8px;
}
</style>