<template>
    <el-button style="margin-left: 0px;" type="primary" size="small" icon="sc-icon-database" text plain @click="doDatabase(item)" title="设备数据"></el-button>
    <el-button style="margin-left: 0px;" v-if="item.deviceLatitude && item.deviceLongitude" type="primary" size="small" icon="sc-icon-position" text plain @click="doPosition(item)" title="设备位置"></el-button>
    <el-button style="margin-left: 0px;" v-if="this.groupMap['upload'] && item.deviceServiceName" type="primary" size="small" icon="el-icon-upload" text plain @click="doUpload(item)" :title="this.groupMap['upload']['desc']"></el-button>
    <el-button style="margin-left: 0px;" v-if="this.groupMap['download'] && item.deviceServiceName" type="primary" size="small" icon="el-icon-download" text plain @click="doDowload(item)" :title="this.groupMap['download']['desc']"></el-button>
</template>
<script>

export default {
    props: {
        item: {
            type: Object,
            default: () => {
                return {}
            }
        }
    },
    data() {
        return {
            groupMap: {}
        }
    },
    mounted() {
        for(const item of this.item.group || []) {
            this.groupMap[item.value] = item;
        }
    }
}
</script>
