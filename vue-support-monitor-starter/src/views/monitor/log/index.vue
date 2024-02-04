<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <el-select v-model="form.appValue" clearable placeholder="请选择应用">
                    <el-option v-for="item in apps" :key="item.monitorAppname" :value="item.monitorAppname" :label="item.monitorAppname">
                    	<span>{{ item.monitorAppname }}</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">{{ item.monitorName }}</span>
                    </el-option>
                </el-select>
                <el-select v-if="form.appValue"  v-model="form.appModelValue" clearable placeholder="请选择系统">
                    <el-option v-for="item in appsModel[form.appValue]" :key="item"  :value="item" :label="item.serverHost + ':' + item.serverPort ">
                    	<span>{{ item.serverHost }}:{{ item.serverPort }}</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">{{ item.contextPath }}</span>
                    </el-option>
                </el-select>
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

            <el-button type="danger" icon="el-icon-delete" 
                style="position: fixed; right: 0; top: 55%; width: 40px; height: 40px;" @click="data.length = 0"></el-button>
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
            apps: [],
            appsModel: {},
            form: {
                appValue: '',
                appModelValue: ''
            },
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
        try{
            this.form.appValue = this.$route.query.appName;
            this.form.appModelValue = JSON.parse(this.$route.query.data);
        }catch(e){}
        this.afterPrepertiesSet();
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
        async afterPrepertiesSet(){
            this.$API.monitor.app.list.get().then(res => {
                if(res.code === '00000') {
                    this.apps = res.data;
                    this.apps.forEach(item => {
                        this.appsModel[item.monitorAppname] = item?.monitorRequests || [];
                    })
                }
            });
        },
        isMathch(item) {
            const appValue = this.form.appValue;
            const appModelValue = this.form.appModelValue;
            if(!appModelValue && !appValue) {
                return true;
            }

            if(appModelValue && !appValue) {
                return item.serverHost == appModelValue.serverHost && item.serverPort == appModelValue.serverPort;
            }

            if(!appModelValue && appValue) {
                return item.appName == appValue;
            }
            return (item.serverHost == appModelValue.serverHost && item.serverPort == appModelValue.serverPort)&& (item.appName == appValue);
        },
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
                const value = JSON.parse(data);
                data = value.data;
                if(!this.isMathch(value)) {
                    return false;
                }
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