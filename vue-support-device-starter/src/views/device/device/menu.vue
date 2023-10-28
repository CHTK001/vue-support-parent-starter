<template>
    <el-button class="small-icon" type="primary" size="small" icon="sc-icon-database" text plain @click="doDatabase(item)" title="设备数据"></el-button>
    <el-button class="small-icon" v-if="item.deviceLatitude && item.deviceLongitude" type="primary" size="small" icon="sc-icon-position" text plain @click="doPosition(item)" title="设备位置"></el-button>
    <el-button class="small-icon" v-if="this.groupMap['upload'] && item.deviceServiceName" type="primary" size="small" icon="el-icon-upload" text plain @click="doUpload(item)" :title="this.groupMap['upload']['desc']"></el-button>
    <el-button class="small-icon" v-if="this.groupMap['camera'] && (item.deviceTypeCode == 'VIDEO' || item.deviceTypeCode == 'SHE_XIANGTOU' || item.deviceTypeCode == 'CAMERA')" type="primary" size="small" icon="el-icon-camera" text plain @click="doCamera(item)" :title="this.groupMap['camera']['desc']"></el-button>


    <el-dialog title="选择管道" v-model="visible" :width="200" destroy-on-close @closed="$emit('closed')" draggable :close-on-click-modal="false">
        <el-select v-model="channel">
            <el-option v-for="item in channelList" :key="item.channelNo" :value="item.channelNo" :label="item.channelName">
            	<span><el-icon><component :is="item.channelIcon" /></el-icon><span class="pl-1">{{ item.channelName }}</span></span>
                <span class="el-form-item-msg" style="margin-left: 10px;">{{ item.channelTag }}</span>
            </el-option>
        </el-select>
        <template #footer>
			<el-button @click="visible = false">取 消</el-button>
			<el-button  type="primary" :loading="isSend" @click="submit()">打开</el-button>
		</template>
    </el-dialog>
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
            channelList: [],
            visible: false,
            groupMap: {}
        }
    },
    mounted() {
        for(const item of this.item.group || []) {
            this.groupMap[item.value] = item;
        }
    },
    methods: {
        submit(){
            if(!this.channel) {
                this.$message.error('请选择直播通道');
                return false;
            }
            this.isSend = true;
            const req = {};
            Object.assign(req, this.item);
            req['deviceChannel'] = this.channel;
            this.$API.device.cloudPlatform.service.liveAddress.post(req).then(res => {
                    if(res.code !== '00000') {
                        this.$message.error(res.msg);
                        return;
                    }
                    const data = res.data;
                    this.$router.push({ path: '/device/device/camera/' + data.url });
                }).finally(() => {this.loadDeviceStatus = false;  this.isSend = false;});
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

            this.channelList = item.channels;
            this.visible = true;
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