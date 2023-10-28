<template>
    <el-button class="small-icon" type="primary" size="small" icon="sc-icon-database" text plain @click="doDatabase(item)" title="设备数据"></el-button>
    <el-button class="small-icon" v-if="item.deviceLatitude && item.deviceLongitude" type="primary" size="small" icon="sc-icon-position" text plain @click="doPosition(item)" title="设备位置"></el-button>
    <el-button class="small-icon" v-if="this.groupMap['upload'] && item.deviceServiceName" type="primary" size="small" icon="el-icon-upload" text plain @click="doUpload(item)" :title="this.groupMap['upload']['desc']"></el-button>
    <el-button class="small-icon" v-if="this.groupMap['camera'] && (item.deviceTypeCode == 'VIDEO' || item.deviceTypeCode == 'SHE_XIANGTOU' || item.deviceTypeCode == 'CAMERA')" type="primary" size="small" icon="el-icon-camera" text plain @click="doCamera(item)" :title="this.groupMap['camera']['desc']"></el-button>


    <sc-table-select ref="seRef" v-if="visible" @visibleChange="visibleChange" v-model="channel" :apiObj="apiObj" :params="params" :table-width="600" :props="props" @change="change">
        <el-table-column prop="channelName" label="管道名称">
            <template #default="scope">
                <span><el-icon><component :is="scope.row.channelIcon" /></el-icon>{{ scope.row.channelName }}</span>
            </template>
        </el-table-column>
        <el-table-column prop="channelNo" label="管道号"></el-table-column>
        <el-table-column prop="channelTag" label="管道标签"></el-table-column>
    </sc-table-select>
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
            channel: null,
            isSend : false,
            visible: false,
            props: {
                label: 'user',
                value: 'id',
                keyword: "keyword"
            },
            groupMap: {},
            params: {},
            apiObj: this.$API.device.device.channel.list
        }
    },
    mounted() {
        for(const item of this.item.group || []) {
            this.groupMap[item.value] = item;
        }
        this.params['deviceId'] = this.item.deviceId;
    },
    methods: {
        visibleChange(item) {
            if(!item) {
                this.visible = false;
            }
        },
        change(item) {
            this.isSend = true;
            const req = {};
            Object.assign(req, this.item);
            req['deviceChannel'] = item.channelNo;
            this.$API.device.cloudPlatform.service.liveAddress.post(req).then(res => {
                    if(res.code !== '00000') {
                        this.$message.error(res.msg);
                        return;
                    }
                    const data = res.data;
                    this.$router.push({ path: '/device/device/camera/' + data.url });
                }).finally(() => {this.loadDeviceStatus = false;  this.isSend = false; this.visible = false;});
                return false;
        },
        doCamera(item) {
            if(!item.channels || item.channels.length < 2) {
                this.$API.device.cloudPlatform.service.liveAddress.post(item).then(res => {
                    if(res.code !== '00000') {
                        this.$message.error(res.msg);
                        return;
                    }
                    const data = res.data;
                    this.$router.push({ path: '/device/device/camera/' + data.url });
                }).finally(() => this.loadDeviceStatus = false);
                return false;
            }

            this.visible = true;
            // this.$nextTick(() =>{
            //     this.$refs.seRef.handleOuterBlur()
            // })
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