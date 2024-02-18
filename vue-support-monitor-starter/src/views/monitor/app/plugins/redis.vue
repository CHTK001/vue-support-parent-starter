<template>
    <el-dialog v-model="visiable" class="bg-blue-gray-50/50" width="60%" draggable style="background-color: #f6f8f9;"  :title="appName + '[Redis配置]'">

        <template #header="{ close, titleId, titleClass }">
            <div class="my-header">
                <h4 :id="titleId" :class="titleClass">{{ appName }} [Redis配置] </h4>

                <el-icon class="refresh" @click="open(row)"><component is="el-icon-refresh"></component></el-icon>
            </div>
        </template>

        <redis-layout :data="data"></redis-layout>

        
    </el-dialog>
</template>

<script>
import RedisLayout from '../../layout/redis.vue';
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import Base64 from "@/utils/base64";
export default {
    components: { scSelectFilter, RedisLayout },
    data() {
        return {
            params: {

            },
            apiObj: this.$API.monitor.actuator.page,
            selectedValues: {

            },
            selectedValuesItem: [{
                title: "日志级别",
                key: "levels",
                multiple: !1,
                options: []
            }],
            visiable: false,
            form: {
                pageSize: 10
            },
            dialogVisible: 0,
            row: {},
            data: [],
            loggers: {},
            title: '',
            total: 0,
            profile: '',
            appName: '',
        }
    },

    methods: {
        open(item) {
            this.appName = item?.appName;
            this.profile = item?.profile;
            this.visiable = true;
            this.title = item.appName + 'redis配置';
            this.dialogVisible = !0;
            this.row = item;
            this.loggers.length = 0;
            this.data.length = 0;
            this.apiObj.get({ dataId: 1, command: 'redis', method: 'get', data: JSON.stringify(item) }).then(res => {
                if (res.code === '00000') {
                    this.data = res.data;
                }
            })
        },
       
    }

}

</script>
<style>
.refresh {
    font-size: 16px;
    margin-top: 4px;
    margin-right: 6px;
    color: gray;
    z-index: 999999999999;
    cursor: pointer;
}
.my-header {
  display: flex;
  flex-direction: row;
}
</style>