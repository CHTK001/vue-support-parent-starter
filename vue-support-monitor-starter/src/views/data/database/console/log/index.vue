<template>
    <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true" width="80%" top="10px" draggable :title="title" @close="close">
        <div class="relative h-full">
            <div class="absolute" style="top: -70px;left: 38%;">
                <el-form :inline="true" class="demo-form-inline ">
                    <el-form-item>
                        <el-date-picker v-model="rangTimeValue" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="doSearch" icon="el-icon-search"></el-button>
                    </el-form-item>
                </el-form>
            </div>
            <div ref="containerRef" style="height: 70vh; overflow: auto;" @keyup.native="keyEvent">
                <ul>
                    <li v-for="(item, index) in data">
                        <p style="margin:10px"><el-tag>{{ index + 1 }}</el-tag><span v-html="item" style="margin-left:10px"></span></p>
                    </li>
                </ul>

                <el-empty v-if="!data || data.length == 0" />

            </div>
        </div>

    </el-dialog>


    <el-dialog v-model="detailVisiable" title="查询日志" :close-on-click-modal="false" draggable width="60%">
        <div style="height: 600px; overflow: auto;">
            <el-empty v-if="detailData.length == 0"></el-empty>
            <el-timeline style="max-width: 600px" v-else>
                <el-timeline-item v-for="(item, index) in detailData" :key="index" :timestamp="dateFormat(item.timestamp)" color="#0bbd87" icon="MoreFilled">
                    <el-card style="width: 100%;">
                        <pre ref="sqlPre">
                        <code class="language-sql">
                            {{ getMessage(item.text) }}
                        </code>
                    </pre>
                    </el-card>
                </el-timeline-item>
            </el-timeline>

        </div>
    </el-dialog>
</template>
<script>
import { format } from 'sql-formatter'
import { inject, defineAsyncComponent } from "vue"
// 引入Prism.js
import Prism from 'prismjs';
// 引入SQL语言插件
import 'prismjs/components/prism-sql.min.js';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'consoleLog',
    components: { scCodeEditor },
    data() {
        return {
            detailVisiable: false,
            rangTimeValue: [],
            editDialogStatus: false,
            form: {},
            input: '',
            detailData: [],
            detailTotal: 0,
            showFile: 0,
            title: '',
            data: [],
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
        this.highlightSQL();
        this.rangTimeValue[1] = new Date();
        this.rangTimeValue[0] = new Date(new Date().getTime() - 86400 * 1000);
    },
    methods: {
        getMessage(msg) {
            return ansi_up.ansi_to_html(msg);
        },
        dateFormat(date) {
            return this.$TOOL.dateFormat(parseInt(date));
        },
        highlightSQL() {
            // 假设你的SQL代码在模板的pre标签中
            const pre = this.$refs.sqlPre;
            // 使用Prism.highlightElement来高亮代码
            Prism.highlightElement(pre);
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
            if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
                this.$message.error('请选择时间');
                return;
            }
            this.afterPropertiesSet();
        },
        async afterPropertiesSet() {
            this.detailVisiable = true;
            this.$API.gen.log.query.get({
                genId: this.form.genId,
                startDate: this.getTime(0),
                endDate: this.getTime(1),
                tableName: null,
                action: null,
                size: 10,
                page: 1,
            }).then(res => {
                this.detailData.length = 0;
                this.detailTotal = 0;
                if (res.code == '00000') {
                    this.detailData = res.data.data;
                    this.detailTotal = res.data.total;
                }
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
                _this.data.push(ansi_up.ansi_to_html(value)
                    .replaceAll('\n', '<br/>')
                    .replaceAll('color:rgb(0,0,187)', 'color: rgb(96 215 59)')
                    .replaceAll('color:rgb(187,0,0)', 'color: rgb(255 154 154)')
                );
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
            this.socket.off('log-gen-' + this.form.genId)
        },
    }

}
</script>