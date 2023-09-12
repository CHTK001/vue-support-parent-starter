<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <sc-select-filter :data="selectedValuesItem" :selected-values="selectedValues" :label-width="80"
                    @on-change="change"></sc-select-filter>
                <br />
            </div>
        </el-header>
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
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'UniformLog',
    components: { scSelectFilter },
    data() {
        return {
            input: '',
            showFile: 0,
            data: [],
            selectedValues: {

            },
            selectedValuesItem: [{
                title: "模块",
                key: "module",
                multiple: !1,
                options: []
            }],
            eventSource: null
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted() {
        this.initial();
        this.change({ module: '' })
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
        change(selected) {
            this.selectedValues = selected;
            this.subscribe((this.selectedValues.module || 'log') == 'log' ? 'log' : 'log' + this.selectedValues.module);
        },
        async initial() {
            const res1 = await this.$API.config.actuator.applications.get();
            if (res1.code === '00000') {
                if (this.selectedValuesItem[0].options.length == 0) {
                    this.selectedValuesItem[0].options.push({
                        label: "全部",
                        value: ""
                    })
                    for (const k of res1.data) {
                        this.selectedValuesItem[0].options.push({
                            label: k,
                            value: k
                        })
                    }

                }
            }

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
            if (!!this.eventSource) {
                try {
                    this.eventSource.close();
                } catch (e) { }
            }
            this.eventSource = new EventSourcePolyfill(this.$API.config.uniform.url + mode);
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