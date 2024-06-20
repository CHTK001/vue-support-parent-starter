<template>
    <el-drawer :title="title" direction="rtl" show-close v-model="visible" size="90%" :destroy-on-close="true">
        <div id="root-techui" >
            <adaptivePanel :config="APConfig">
               <layout :terminal="item"></layout>
            </adaptivePanel>
        </div>
    </el-drawer>
</template>

<script>
import Layout from './layout/layout.vue';
export default {
    components:{Layout},
    data(){
        return {
            visible: false,
            item: {},
            title: '',
            APConfig: {
                backgroundFillAll: true,
                backgroundName: "A2",
                loading: false,
            },
        }
    },
    methods: {
        open() {
            this.visible = true;
            return this;
        },
        setData(item) {
            this.item = item;
            this.title = item.terminalHost + " 指标"
        },
    }
}
</script>
