<template>

    <el-dialog @close="onClose" :destroy-on-close="true" :show-close="false" style="background: transparent; display: flex; flex-direction: column;" title="日志" 
        top="20px"
        append-to-body="body" :model-value="true" width="90%" >
        <aYinTechBorderA1 style="height: 80vh;">
            <div style=" margin-top: 32px; overflow: auto;height: 100%;">
                <el-button type="danger" size="small" title="清除日志" icon="el-icon-delete" class="absolute" style="border: 0; right: 10px; " circle  @click="data.length = 0"></el-button>

                <div ref="containerRef" :style="{'height': height +'px', 'overflow': 'auto'}" @keyup.native="keyEvent">
                    <ul>
                        <li v-for="item in data">
                            <span v-html="'[' + item.appName + ']' + '[' + item.serverHost + ':' + item.serverPort + ']' + item.data"></span>
                        </li>
                    </ul>
                    <el-empty v-if="!data || data.length == 0" class="h-full" />
                </div>
            </div>
        </aYinTechBorderA1>
    </el-dialog>

</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { default as AnsiUp } from 'ansi_up';
import sysConfig from '@/config'
import io from 'socket.io-client';
import Base64 from "@/utils/base64";
import  { inject } from "vue"

import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';

const ansi_up = new AnsiUp();
export default {
    name: 'log',
    components: { scSelectFilter },
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
            socket: inject('socket'),
        }
    },
    watch:{
      "form.appValue": {
        handler: function (val) {
        //    this.form.appModelValue = '';
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
            this.form.appValue = getQueryString("appName");
            this.form.appName = this.form.appValue;
            const item = JSON.parse(Base64.decode(getQueryString("data")));
            this.form.appModelValue = item.serverHost + ':' + item.serverPort;
            document.title = this.form.appValue + '详情 - 监控管理';
            useTabs.setTitle(this.form.appValue + '详情');
            this.viliable = true;
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
        onClose(){
            this.$emit('success', this);
        
        },
        async afterPrepertiesSet(){
            // this.$API.monitor.app.list.get().then(res => {
            //     if(res.code === '00000') {
            //         this.apps = res.data;
            //         this.apps.forEach(item => {
            //             this.appsModel[item.monitorAppname] = item?.monitorRequests || [];
            //         })
            //     }
            // });
        },
        isMatch(item) {
            const appValue = this.form.appValue;
            const appModelValue = this.form.appModelValue;
            if(!appModelValue && !appValue) {
                return true;
            }

            if(appModelValue && !appValue) {
                return appModelValue == item.serverHost + ':' + item.serverPort;
            }

            if(!appModelValue && appValue) {
                return item.appName == appValue;
            }
            return (appModelValue == item.serverHost + ':' + item.serverPort)&& (item.appName == appValue);
        },
        openSocket() {
            const _this = this;
            this.socket.on('log', (data) => {
                const value = data;
                data = value;
                if(!this.isMatch(value)) {
                    return false;
                }
                data.data =  ansi_up.ansi_to_html(data.data)
                    .replaceAll('\n', '<br/>')
                    .replaceAll('color:rgb(0,0,187)', 'color: rgb(96 215 59)')
                    .replaceAll('color:rgb(187,0,0)', 'color: rgb(255 154 154)')
                ;
                _this.data.push(data);
                if (_this.data.length > 10000) {
                    _this.data.shift();
                }

                _this.$nextTick(() => {
                    let scrollEl = _this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            })
        },
        closeSocket(){
            this.socket.off('log')
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
<style scoped>
* {
    font-size: 12px;
}

ul span {
    color: white !important;
    font-size: 14px
}
</style>