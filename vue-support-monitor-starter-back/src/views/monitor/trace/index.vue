<template>
    <div ref="containerRef" :style="{'height': height +'px', 'overflow': 'hidden', 'background-color' : 'var(--el-tree-node-hover-bg-color)'}"
        @keyup.native="keyEvent">
        <el-button type="danger" size="small" title="清除日志" icon="el-icon-delete" class="absolute" style="border: 0; right: 10px; z-index: 20240229" circle  @click="data.length = 0"></el-button>
       
        <el-tree :data="data" style="height: calc(100% - 20px); background-color: var(--el-tree-node-hover-bg-color); overflow: auto;" :props="defaultProps" >
            <template #default="{ node, data }">
                <div class="flex flex-wrap">
                    <div class="w-full max-w-full px-3 sm:flex-0 shrink-0">
                        <div
                            class="relative flex flex-col min-w-0  break-words bg-white dark:bg-gray-950 shadow-soft-xl dark:shadow-soft-dark-xl rounded-2xl bg-clip-border">
                            <div class="flex-auto">
                                <span class="custom-tree-node" :title="data.message">
                                    <span v-if="data.id == data.linkId">
                                        <span v-if="(data.message || '').indexOf('span') > -1"
                                            v-html="data.message || data.ex"></span>
                                        <span v-else>Http {{ data.message || data.ex }}</span>
                                    </span>
                                    <span v-else>
                                        <span>
                                            <span v-if="(data.message || '').indexOf('span') > -1"
                                                v-html="data.message || data.ex"></span>
                                            <span
                                                v-else-if="(data.typeMethod || '').indexOf('span') > -1 || (data.typeMethod || '').indexOf('el-tag') > -1"
                                                v-html="data.typeMethod"></span>
                                            <span v-else class="text-pretty">{{ data.message }}</span>
                                        </span>
                                        <span>

                                        </span>
                                    </span>
                                    @<el-tag style="height: 26px;" v-time="data?.enterTimeMill"></el-tag> 耗时: <el-tag
                                        style="height: 26px;">{{ data?.costTime }} ms</el-tag>
                                    <span>
                                        <svg style="height: 14px; z-index:20230819" @click.stop="showTrack(data)"
                                            viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-ea893728="">
                                            <path fill="currentColor"
                                                d="M512 64a448 448 0 1 1 0 896.064A448 448 0 0 1 512 64zm67.2 275.072c33.28 0 60.288-23.104 60.288-57.344s-27.072-57.344-60.288-57.344c-33.28 0-60.16 23.104-60.16 57.344s26.88 57.344 60.16 57.344zM590.912 699.2c0-6.848 2.368-24.64 1.024-34.752l-52.608 60.544c-10.88 11.456-24.512 19.392-30.912 17.28a12.992 12.992 0 0 1-8.256-14.72l87.68-276.992c7.168-35.136-12.544-67.2-54.336-71.296-44.096 0-108.992 44.736-148.48 101.504 0 6.784-1.28 23.68.064 33.792l52.544-60.608c10.88-11.328 23.552-19.328 29.952-17.152a12.8 12.8 0 0 1 7.808 16.128L388.48 728.576c-10.048 32.256 8.96 63.872 55.04 71.04 67.84 0 107.904-43.648 147.456-100.416z">
                                            </path>
                                        </svg>
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </el-tree>
    </div>

    <el-drawer :size="'40%'" ref="drawerRef" v-model="dialog" direction="rtl" class="demo-drawer" :destroy-on-close="true">
        <div class="demo-drawer__content">
            <div v-if="detail.header">
                <div v-if="detail.model != 'sql'">
                    <highlightjs language="yaml" :autodetect="false" :code="detail.header.join('\r\n')" style="
                            font-size: 14px; 
                            font-weight: 800;
                            font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;
                            "></highlightjs>
                </div>
                <highlightjs v-else language="Sql" :autodetect="false" :code="detail.header[0]" style="
                            font-size: 14px; 
                            font-weight: 800;
                            font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;
                            "></highlightjs>
            </div>
            <div v-else>
                <highlightjs language="java" :autodetect="false" :code="detail.stack.join('\r\n')" style="
                            font-size: 14px; 
                            font-weight: 800;
                            font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;
                            "></highlightjs>
            </div>
        </div>
    </el-drawer>

</template>
<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'

import { inject, ref, reactive, onMounted, onUpdated } from 'vue'

import { default as AnsiUp } from 'ansi_up';
import { defineAsyncComponent } from 'vue';
import Base64 from "@/utils/base64";

const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
const ansi_up = new AnsiUp();
export default {
    name: 'UniformLog',
    components: {
        scCodeEditor,
        scSelectFilter
    },
    props: {
        h: {
            type: Number,
            default: 700
        },
        value: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data() {
        return {
            height: this.h,
            showStack: {},
            input: '',
            dialog: 0,
            selectedValues: {

            },
            apps: [],
            appsModel: {},
            form: {
                appValue: '',
                appModelValue: ''
            },
            selectedValuesItem: [{
                title: "模块",
                key: "module",
                multiple: !1,
                options: []
            }],
            showFile: 0,
            data: [],
            detail: undefined,
            defaultProps: {
                children: 'children',
                label: 'ex',
            },
            socket: inject('socket')

        }
    },
    watch: {
        "form.appValue": {
            handler: function (val) {
                //this.form.appModelValue = '';
            },
            deep: true,
            immediate: true
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted() {
        try{
            this.form = this.value;
            if(this.$route.query.appName) {
                this.form.appValue = this.$route.query.appName;
            }
            const item = JSON.parse(Base64.decode(this.$route.query.data));
            this.form.appModelValue = item.serverHost + ':' + item.serverPort;
        }catch(e){}
        this.afterPrepertiesSet();
    },
    beforeUnmount() {
        this.closeSocket();
    },
    created() {
        this.openSocket();
    },
    methods: {
        async afterPrepertiesSet() {
        },
        isMatchResource(item) {
            const isShow = this.form.isShow;
            if (!isShow) {
                return true;
            }

            return !item.message.indexOf(".js") &&
                !item.message.indexOf(".css")
        },
        isMatch(item) {
            const appValue = this.form.appValue;
            const appModelValue = this.form.appModelValue;
            if (!appModelValue && !appValue) {
                return true;
            }

            if (appModelValue && !appValue) {
                return appModelValue == item.serverHost + ':' + item.serverPort;
            }

            if (!appModelValue && appValue) {
                return item.appName == appValue;
            }
            return (appModelValue == item.serverHost + ':' + item.serverPort) && (item.appName == appValue);
        },
        openSocket() {
            const _this = this;
            this.socket.on('trace', (data) => {
                const value = data;
                data = value.data;
                if (!this.isMatch(value)) {
                    return false;
                }

                if (!this.isMatchResource(value)) {
                    return false;
                }

                const msg = JSON.parse(data)
                _this.data.push(msg);
                if (_this.data.length > 10000) {
                    _this.data.shift();
                }

                _this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            })

        },
        closeSocket() {
            this.socket.off('trace');
        },
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
}

* {
    font-size: 12px;
}</style>