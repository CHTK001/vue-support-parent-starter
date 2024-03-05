<template>

<el-dialog @close="onClose" :destroy-on-close="true" :show-close="false" style="background: transparent; display: flex; flex-direction: column;" title="日志" 
        top="20px"
        append-to-body="body" :model-value="true" width="70%" >
        <aYinTechBorderA1 style="height: 80vh;" :config="config">
            <div v-if="data && data.length > 0" style="; margin-top: 32px">
                <div  style="display: grid; grid-auto-flow: column; grid-template-columns: repeat(auto-fill, 10%); grid-template-rows: repeat(auto-fill, 200px);">
                    <div v-for="item of data">
                        <decoFrameA2 :config="labelConfig">
                            <DigitalTransform :value="item.count" dislocation :interval="200"></DigitalTransform>
                        </decoFrameA2>
                        <div>{{ item.ip }}</div>
                        <span class="el-form-item-msg" style="margin-left: 10px;">{{ item.city }}</span>
                    </div>
                </div>
            </div>
            <el-empty v-if="!data || data.length == 0" class="h-full" />
        </aYinTechBorderA1>
    </el-dialog>

</template>
<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import Base64 from "@/utils/base64";

export default {

    data(){
        return {
            form: {},
            data: [],
            config: {
                title: "最近访问地址" 
            },
            labelConfig: {
                textColor:$c.cyl5,
                scale: 1,
                directionAlt:true,
                glow: true,
                backgroundOpacity:.5,
                decorationColor:$c.rel3
            }
        }
    },
    mounted() {
        try{
            this.form.appValue = getQueryString("appName");
            this.form.appName = this.form.appValue;
            const item = JSON.parse(Base64.decode(getQueryString("data")));
            this.form.appModelValue = item.serverHost + ':' + item.serverPort;
    }catch(e){}
        this.afterPrepertiesSet();
    },
    methods: {
        afterPrepertiesSet(){
            this.$API.monitor.ip.handler({
                appName: this.form.appName,
                serverAddress: this.form.appModelValue?.replace(":", "_")
            }).then(res => {
                if(res.code === '00000') {
                    this.data = res.data;
                }
            })
        },
        onClose(){
            this.$emit('success', this);
        
        },
    }

}
</script>