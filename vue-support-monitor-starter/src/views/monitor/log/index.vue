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
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { default as AnsiUp } from 'ansi_up';
import sysConfig from '@/config'
import io from 'socket.io-client';


const ansi_up = new AnsiUp();
export default {
    name: 'log',
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
            socket: null,
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted() {
    },
    beforeUnmount() {
        try {
            this.closeSocket();
        } catch (e) { }
    },
    created() {
        var _this = this;
        this.openSocket();
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
        openSocket() {
            const _this = this;
            const headers = {};
            headers[sysConfig.TOKEN_NAME2] = this.$TOOL.cookie.get(sysConfig.TOKEN);
            this.closeSocket();
            this.socket = io(this.$API.monitor.socket.url, {
                transports: ["websocket"],
                query: headers
            });
            this.socket.on('connect', (data) => {
                console.log('open:', data);
            });

            this.socket.on('log', (data) => {
                _this.data.push(ansi_up.ansi_to_html(data).replaceAll('\n', '<br/>'));
                if (_this.data.length > 10000) {
                    _this.data.shift();
                }

                _this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            })

            this.socket.on('close', () => {
                console.log('socket连接关闭');
            });
        },
        closeSocket(){
            if(this.socket) {
                this.socket.close();
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
    }
}
</script>