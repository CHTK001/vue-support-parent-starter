<template>
    <el-button :loading="loadDeviceStatus" style="margin-left: 0px;" v-if="this.groupMap['device'] " 
    type="primary" size="small" icon="sc-icon-device" text plain @click="syncDevice(item)" :title="this.groupMap['device']['desc']"></el-button>

    <el-button :loading="loadOrgStatus" style="margin-left: 0px;" v-if="this.groupMap['org'] " 
    type="primary" size="small" icon="sc-icon-org" text plain @click="syncOrg(item)" :title="this.groupMap['org']['desc']"></el-button>
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
            loadDeviceStatus: false,
            loadOrgStatus: false,
            groupMap: {}
        }
    },
    mounted() {
        for(const item of this.item.group || []) {
            this.groupMap[item.value] = item;
        }
    },
    methods: {
        syncOrg(item) {
            console.log("开始同步组织机构");
            this.loadOrgStatus = true;
            this.$API.device.cloudPlatform.service.syncOrg.post({deviceConnectorId: item.deviceConnectorId}).then(res => {
                if(res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
            }).finally(() => this.loadOrgStatus = false);
        },
        syncDevice(item) {
            this.loadDeviceStatus = true;
            console.log("开始同步设备");
            this.$API.device.cloudPlatform.service.syncDevice.post({deviceConnectorId: item.deviceConnectorId}).then(res => {
                if(res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
            }).finally(() => this.loadDeviceStatus = false);
        },
    }
}
</script>
