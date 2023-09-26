<template>
    <el-container>
        <el-main>
            <div ref="containerRef" style="height: 100%; overflow: auto;" @keyup.native="keyEvent">
                <ul>
                    <li v-for="item in data">
                        <span v-html="item"></span>
                    </li>
                </ul>

                <el-empty v-if="!data || data.length == 0" />

            </div>

            <el-button type="primary" icon="el-icon-search"
                style="position: fixed; right: 0; top: 50%; width: 40px; height: 40px;" @click="showFile = !0"></el-button>

            <el-dialog draggable v-model="showFile">
                <el-input ref="input" v-model="input" placeholder="搜索" size="large" clearable prefix-icon="el-icon-search"
                    @keyup.enter="enterQuery" :trigger-on-focus="false" />
            </el-dialog>
        </el-main>
    </el-container>
</template>
<script>
import {EventSourcePolyfill } from "event-source-polyfill"
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'consoleLog',
    data() {
        return {
            form: {},
            input: '',
            showFile: 0,
            data: [],
            eventSource: null
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
        if(!this.form.tabId || this.form.tabId === 'null') {
            delete  this.form.tabId;
        }
        if(!this.form.genId || this.form.genId === 'null') {
            delete  this.form.genId;
        }
        this.subscribe(!!this.form.tabId ? "TABLE" : "DATABASE");
    },
    methods: {
        subscribe: function (mode) {
            const _this = this;
            var ansi_up = new AnsiUp();
            if (!!this.eventSource) {
                try {
                    this.eventSource.close();
                } catch (e) { }
            }
            this.eventSource = new EventSourcePolyfill(this.$API.gen.table.subscribe.url + (this.form.tabId || this.form.genId)+ "/" + mode);
            this.eventSource.addEventListener(mode, (event) => {
                const data = JSON.parse(event.data);
                this.data.push(ansi_up.ansi_to_html(data.message).replaceAll('\n', '<br/>'));
                if (this.data.length > 10000) {
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