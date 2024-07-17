<template>
    <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true" width="80%" top="10px" draggable :title="title" @close="close">
        <div class="relative h-full">
            <div class="absolute" style="top: 1%;right: 0%;">
                <el-button circle type="primary" @click="doSearch" icon="el-icon-search"></el-button>
            </div>
            <div ref="containerRef" style="height: 70vh; overflow: auto;" @keyup.native="keyEvent">
                <ul>
                    <li v-for="(item, index) in data">
                        <el-card style="width: 100%;">
                            <pre ref="sqlPre" class="language-sql line-numbers inline-color"> <code class="language-sql line-numbers inline-color"> {{ getMessage(item) }} </code> </pre>
                        </el-card>
                    </li>
                </ul>

                <el-empty v-if="!data || data.length == 0" />

            </div>
        </div>

    </el-dialog>

    <search-dialog v-if="searchDialogStatus" ref="searchDialogRef"></search-dialog>
</template>
<script>
import { format } from 'sql-formatter'
import { inject, defineAsyncComponent } from "vue"
// 引入Prism.js
import Prism from 'prismjs';
// 引入SQL语言插件
import 'prismjs/components/prism-sql.min.js';
import "prismjs/themes/prism-tomorrow.min.css"
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css"
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css"
import "prismjs/plugins/inline-color/prism-inline-color.min.css"
import SearchDialog from './time.vue'
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'consoleLog',
    components: { scCodeEditor, SearchDialog },
    data() {
        return {
            searchDialogStatus: false,
            rangTimeValue: [],
            editDialogStatus: false,
            form: {},
            loading: false,
            noMore: false,
            disabled: false,
            input: '',
            detailData: [],
            searchTitle: '查询日志',
            detailTotal: 0,
            showFile: 0,
            title: '',
            data: [],
            current: 0,
            pages: 0,
            total: 0,
            socket: inject('socket'),
            eventSource: null,
            options: {
                hintOptions: { // 自定义提示选项
                    completeSingle: false,
                    tables: {
                        users: ['name', 'score', 'birthDate'],
                        countries: ['name', 'population', 'size'],
                        score: ['zooao']
                    }
                }
            },
        }
    },
    beforeUnmount() {
        this.close();
    },
    created() {

    },
    mounted() {
        Prism.highlightAll();
    },
    methods: {
        getMessage(msg) {
            return '' + format(msg);
        },
        dateFormat(date) {
            return this.$TOOL.dateFormat(parseInt(date));
        },
        highlightSQL() {
            setTimeout(() => {
                const _this = this;
                Prism.highlightAll();
                this.$nextTick(() => {
                    // 假设你的SQL代码在模板的pre标签中
                    const pre = _this.$refs.sqlPre;
                    // 使用Prism.highlightElement来高亮代码
                    try {
                        Prism.highlightElement(pre);
                    } catch (error) {
                    }
                })
            }, 300)
        },
        getTime(i) {
            try {
                return this.rangTimeValue[i].getTime();
            } catch (error) {
                return this.rangTimeValue[i].$d.getTime();
            }
        },
        close() {
            this.closeSocket();
        },
        doSearch() {
            this.searchDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.searchDialogRef.open( this.form);
            })
        },
        open(row) {
            this.form = row;
            this.editDialogStatus = true;
            this.title = row.genName + '日志';
            this.openSocket();
            return this;
        },
        openSocket() {
            const _this = this;
            this.socket.on('log-gen-' + this.form.genId, (data) => {
                const value = data;
                _this.data.push(value);
                if (_this.data.length > 10000) {
                    _this.data.shift();
                }

                _this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                    this.highlightSQL();
                });
            })
        },
        closeSocket() {
            this.socket.off('log-gen-' + this.form.genId)
        },
    }

}
</script>