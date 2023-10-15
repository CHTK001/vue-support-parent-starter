<template>
    <el-container>
        <el-main>
            <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
                <ul>
                    <li v-for="(item,index) in data">
                        <el-card>
                            <el-tag >{{ data[index]['action'] }}</el-tag>
                            <sc-code-editor :options="options" :read-only="true" v-model="data[index]['message']" mode="sql"></sc-code-editor>
                        </el-card>
                    </li>
                </ul>

                <el-empty v-if="!data || data.length == 0" />

            </div>

            <el-button type="primary" icon="el-icon-delete"
                style="position: fixed; right: 0; top: 50%; width: 40px; height: 40px;" @click="data.length = 0"></el-button>

        </el-main>
    </el-container>
</template>
<script>
import { format } from 'sql-formatter'
import { defineAsyncComponent } from 'vue';

const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

import {EventSourcePolyfill } from "event-source-polyfill"
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'consoleLog',
    components:{scCodeEditor},
    data() {
        return {
            form: {},
            input: '',
            showFile: 0,
            data: [],
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
        if (!!this.eventSource) {
            try {
                this.eventSource.close();
            } catch (e) { }
        }
    },
    mounted(){
        this.form.tabId = this.$route.params.tabId;
        this.form.genId = this.$route.params.genId;
        if(!this.form.tabId || this.form.tabId === 'null'|| this.form.tabId === 'undefined') {
            delete  this.form.tabId;
        }
        if(!this.form.genId || this.form.genId === 'null') {
            delete  this.form.genId;
        }
        this.subscribe(!!this.form.tabId ? "TABLE" : "DATABASE");
    },
    methods: {
        formatSql(sql) {
            return format(sql);
        },
        subscribe: function (mode) {
            const _this = this;
            var ansi_up = new AnsiUp();
            if (!!this.eventSource) {
                try {
                    this.eventSource.close();
                } catch (e) { }
            }
            this.eventSource = new EventSourcePolyfill(this.$API.gen.table.subscribe.url + (this.form.tabId || this.form.genId)+ "/" + mode);
            this.eventSource.addEventListener(this.form.genId, (event) => {
                const data = JSON.parse(event.data);
                const json = JSON.parse(data.message);
                json['message'] = format(json['message']);
                this.data.push(json);
                if (this.data.length > 1000) {
                    this.data.shift();
                }

                this.$nextTick(() => {
                    let scrollEl = this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            });
            this.eventSource.onerror = function (event) {
            };
            this.eventSource.onopen = function (event) {
                _this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
            };
        },
    }

}
</script>