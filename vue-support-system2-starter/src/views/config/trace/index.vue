<template>
    <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
        <el-tree :data="data" :props="defaultProps" @node-click="handleNodeClick">
            <template #default="{ node, data }">
                <span class="custom-tree-node" :title="data.title">
                    <span v-if="data.id == data.linkId">
                        <span>Http {{ data.ex ?? data.message }}</span>
                    </span>
                    <span v-else>
                        <span>
                            <span v-if="(data.message || '').indexOf('span') > -1" v-html="data.ex ?? data.message"></span>
                            <span
                                v-else-if="(data.typeMethod || '').indexOf('span') > -1 || (data.typeMethod || '').indexOf('el-tag') > -1"
                                v-html="data.typeMethod"></span>
                            <span v-else>{{ data.typeMethod }}</span>
                        </span>
                        <span>

                        </span>
                    </span>
                    @<el-tag style="height: 26px;" v-time="data?.enterTime"></el-tag> 耗时: <el-tag style="height: 26px;">{{ data?.costTime }} ms</el-tag>
                    <span>
                        <svg v-if="!dialog" style="height: 14px; z-index:20230819"
                            @click.stop="showTrack(data)" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"
                            data-v-ea893728="">
                            <path fill="currentColor" d="M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64zm67.2 275.072c33.28 0 60.288-23.104 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.104-60.16 57.344s26.88 57.344 60.16 57.344zM590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.992 12.992 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z"></path>
                        </svg>
                    </span>
                </span>
            </template>
        </el-tree>
    </div>

    <el-drawer :size="'40%'" ref="drawerRef" v-model="dialog"  direction="rtl" class="demo-drawer" :destroy-on-close="true">
        <div class="demo-drawer__content">
            <div v-if="detail.header" >
                <div v-if="detail.model != 'sql'" >
                    <highlightjs language="yaml" :autodetect="false" :code="detail.header.join('\r\n')"
                        style="
                            font-size: 14px; 
                            font-weight: 800;
                            font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;
                            "
                    ></highlightjs>
                </div>
                <highlightjs v-else language="Sql" :autodetect="false" :code="detail.header[0]"
                        style="
                            font-size: 14px; 
                            font-weight: 800;
                            font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;
                            "
                ></highlightjs>
            </div>
            <div v-else  >
                <highlightjs language="java" :autodetect="false" :code="detail.stack.join('\r\n')"
                        style="
                            font-size: 14px; 
                            font-weight: 800;
                            font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;
                            "
                ></highlightjs>
            </div>
        </div>
    </el-drawer>

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
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
const ansi_up = new AnsiUp();
export default {
    name: 'UniformLog',
    components: {
        scCodeEditor
    },
    data() {
        return {
            showStack: {},
            input: '',
            dialog: 0,
            showFile: 0,
            data: [],
            detail: undefined,
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
        showTrack(data) {
            this.dialog = !this.dialog;
            this.detail = data;
            return 0;
        },
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
                console.log2(msg)
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
    height: inherit !important;
    padding: 5px;
}

:deep(.el-tree-node .is-focusable) {
    margin-bottom: 6px;
    margin: 8px;
}

:deep(.el-tag),
span {
    font-size: 14px;
    white-space: normal;
    word-break: break-all;
    height: 100%;
}

.header-detail {
    padding: 5px;
    margin-left: 12px;
}</style>