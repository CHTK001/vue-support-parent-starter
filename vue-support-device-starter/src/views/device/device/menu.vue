<template>
    <el-button class="small-icon" type="primary" size="small" icon="sc-icon-database" text plain @click="doDatabase(item)" title="设备数据"></el-button>
    <el-button class="small-icon" v-if="item.deviceLatitude && item.deviceLongitude" type="primary" size="small" icon="sc-icon-position" text plain @click="doPosition(item)" title="设备位置"></el-button>
    <el-button class="small-icon" v-if="this.groupMap['upload'] && item.deviceServiceName" type="primary" size="small" icon="el-icon-upload" text plain @click="doUpload(item)" :title="this.groupMap['upload']['desc']"></el-button>
    <el-button class="small-icon" v-if="this.groupMap['camera'] && (item.deviceTypeCode == 'VIDEO' || item.deviceTypeCode == 'SHE_XIANGTOU' || item.deviceTypeCode == 'CAMERA')" type="primary" size="small" icon="el-icon-camera" text plain @click="doCamera(item)" :title="this.groupMap['camera']['desc']"></el-button>
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
    },
    methods: {
        doCamera(item) {
            this.$API.device.cloudPlatform.service.liveAddress.post(item).then(res => {
                if(res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                const data = res.data;
                this.$router.push({ path: '/device/device/camera/' + data.url });
            }).finally(() => this.loadDeviceStatus = false);
        }
    }
}
</script>
<style scoped>
.small-icon {
    margin-left: 0px;
    border-radius: 5px;
}
</style>