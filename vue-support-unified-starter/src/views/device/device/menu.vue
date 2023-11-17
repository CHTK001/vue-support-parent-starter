<template>
    <el-button class="small-icon" type="primary" size="small" icon="sc-icon-database" text plain @click="doDatabase(item)" title="设备数据"></el-button>
    <!-- 有经纬度-->
    <span v-if="item.deviceLatitude && item.deviceLongitude">
        <el-button class="small-icon" type="primary" size="small" icon="sc-icon-position" text plain @click="doPosition(item)" title="设备位置"></el-button>
    </span>

    <!-- 可以上报到云服务-->
    <span v-if="item.deviceServiceName" >
        <span v-if="hasComponent('upload')">
            <el-button class="small-icon" type="primary" size="small" icon="el-icon-upload" text plain @click="doUpload(item)" :title="getComponentDesc('upload')"></el-button>
        </span>

        <!-- 有access_event-->
        <span v-if="hasComponent('access_xxz_event')">
            <el-button :loading="loadAccessStatus"  class="small-icon" type="primary" size="small" icon="sc-icon-cloud-down" text plain @click="doSyncXxzDevice(item)" :title="getComponentDesc('access_xxz_event')"></el-button>
        </span>
    </span>

    <!-- 摄像头-->
    <span v-if=" (item.deviceTypeCode == 'VIDEO' || item.deviceTypeCode == 'SHE_XIANGTOU' || item.deviceTypeCode == 'CAMERA')">
        <el-button class="small-icon" v-if="hasComponent('camera')" type="primary" size="small" icon="el-icon-camera" text plain @click="doCamera(item)" :title="getComponentDesc('camera')"></el-button>
    </span>

    <sc-table-select ref="seRef" v-if="visible" @visibleChange="visibleChange" v-model="channel" :apiObj="apiObj" :params="params" :table-width="600" :props="props" @change="change">
        <el-table-column prop="channelName" label="管道名称">
            <template #default="scope">
                <span><el-icon><component :is="scope.row.channelIcon" /></el-icon>{{ scope.row.channelName }}</span>
            </template>
        </el-table-column>
        <el-table-column prop="channelNo" label="管道号"></el-table-column>
        <el-table-column prop="channelTag" label="管道标签"></el-table-column>
    </sc-table-select>

    <camera ref="cameraRef" v-if="cameraVisible"/>

</template>
<script>
import camera from './camera.vue'
export default {
    components: {camera},
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
            cameraVisible : false,
            visible: false,
            props: {
                label: 'user',
                value: 'id',
                keyword: "keyword"
            },
            form: {},
            params: {
                deviceId:  this.item.deviceId
            },
            apiObj: this.$API.device.device.channel.list
        }
    },
    created() {
    },
    methods: {
        doSyncXxzDevice(){
            this.loadAccessStatus = true;
            console.log("开始同步气象站事件");
            this.form.deviceImsi = this.item.deviceImsi;
            this.form.deviceConnectorId = this.item.deviceConnectorId;
            this.form.eventType = 'QI_XIANG_ZHAN';
            this.$API.device.cloudPlatform.service.accessEvent.post(this.form).then(res => {
                if (res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                const data = res.data;
                this.$message.success('同步气象站事件成功, 总共同步[' + data.total + "]条记录, 其中成功[" + data.successTotal + "], 失败: [" + data.failureTotal + "]");
            }).finally(() => {this.loadAccessStatus = false; this.loadAccessDialogStatus = false});
        },
        hasComponent(name) {
            const groupMap = {};
            for(const item of this.item.group || []) {
                groupMap[item.value] = item;
            }

            return !!groupMap[name];
        },
        getComponentDesc(name) {
            const groupMap = {};
            for(const item of this.item.group || []) {
                groupMap[item.value] = item;
            }

            return groupMap[name]['desc'];
        },
        visibleChange(item) {
            if(!item) {
                this.visible = false;
            }
        },
        doDatabase(item) {
            if(item.deviceTypeCode == 'ACCESS') {
                this.$router.push({ path: `/device/data/access/${item.deviceImsi}` })
                return;
            }
            debugger
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
                    this.openCamera(data.url, item.deviceName);
                }).finally(() => {this.loadDeviceStatus = false;  this.isSend = false; this.visible = false;});
                return false;
        },
        doCamera(item) {
            this.cameraVisible = false;
            if(!item.channels || item.channels.length < 2) {
                this.$API.device.cloudPlatform.service.liveAddress.post(item).then(res => {
                    if(res.code !== '00000') {
                        this.$message.error(res.msg);
                        return;
                    }
                    const data = res.data;
                    this.openCamera(data.url, item.deviceName);
                }).finally(() => this.loadDeviceStatus = false);
                return false;
            }
            
            // this.openCamera('https://open.ys7.com/v3/openlive/AF7891684_1_1.m3u8?expire=1698700805&id=639151555135672320&t=4c6c65abbc2bfb8e341b18d1a0bbe17f468fe08de937092757096e7b044ca6ba&ev=100', item.deviceName);
            this.visible = true;
        },
        openCamera(url, name) {
            this.cameraVisible = true;
            this.$nextTick(() => {
                this.$refs.cameraRef.open(url, name);
            })
        },

    }
}
</script>
<style scoped>
.small-icon {
    margin-left: 0px;
    border-radius: 5px;
}
</style>