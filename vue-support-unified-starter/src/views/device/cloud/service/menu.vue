<template>

      <!-- 有device-->
     <span v-if="this.groupMap['device']">
        <el-button :loading="loadDeviceStatus" style="margin-left: 0px;"  type="primary" size="small" icon="sc-icon-cloud-down" text plain @click="syncDevice(item)" :title="this.groupMap['device']['desc']"></el-button>
    </span>
    <!-- 有org-->
    <span v-if="this.groupMap['org']">
        <el-button :loading="loadOrgStatus" style="margin-left: 0px;" type="primary" size="small" icon="sc-icon-org" text plain @click="syncOrg(item)" :title="this.groupMap['org']['desc']"></el-button>
    </span>

      <!-- 有access_event-->
      <span v-if="this.groupMap['access_event']">
        <el-button :loading="loadAccessStatus" style="margin-left: 0px;" v-if="this.groupMap['access_event']" type="primary" size="small" icon="sc-icon-access" text plain @click="syncAccessEvent(item)" :title="this.groupMap['access_event']['desc']"></el-button>
    </span>



    <el-dialog title="查询同步门禁事件" v-model="loadAccessDialogStatus" draggable :close-on-click-modal="false" width="30%" :destroy-on-close="true">
        <el-form :model="form" label-width="120px">
            <el-form-item label="时间范围">
                <el-date-picker v-model="form.date" type="datetimerange" format="YYYY-MM-DD HH:mm:ss" range-separator="-" start-placeholder="开始时间" end-placeholder="结束事件"       />
            </el-form-item>

            <el-form-item>
                <el-button type="primary" :loading="loadAccessStatus" @click="onSyncAccessEvent">提交</el-button>
                <el-button @click="loadAccessDialogStatus = false">取消</el-button>
            </el-form-item>
        </el-form>
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
            form: {},
            loadAccessDialogStatus: false,
            loadDeviceStatus: false,
            loadAccessStatus: false,
            loadOrgStatus: false,
            groupMap: {}
        }
    },
    mounted() {
        this.afterPropertiesSet();
    },
    methods: {
        afterPropertiesSet(){
            this.loadAccessDialogStatus= false,
            this.loadDeviceStatus=  false,
            this.loadAccessStatus = false,
            this.loadOrgStatus = false;
            for (const item of this.item.group || []) {
                this.groupMap[item.value] = item;
            }
        },
        syncOrg(item) {
            console.log("开始同步组织机构");
            this.loadOrgStatus = true;
            this.$API.device.cloudPlatform.service.syncOrg.post({ deviceConnectorId: item.deviceConnectorId }).then(res => {
                if (res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                const data = res.data;
                this.$message.success('组织同步成功, 总共同步[' + data.total + "]组织, 其中成功[" + data.successTotal + "], 失败: [" + data.failureTotal + "]");
            }).finally(() => this.loadOrgStatus = false);
        },
        syncDevice(item) {
            this.loadDeviceStatus = true;
            console.log("开始同步设备");
            this.$API.device.cloudPlatform.service.syncDevice.post({ deviceConnectorId: item.deviceConnectorId }).then(res => {
                if (res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                const data = res.data;
                this.$message.success('设备同步成功, 总共同步[' + data.total + "]设备, 其中成功[" + data.successTotal + "], 失败: [" + data.failureTotal + "]");
            }).finally(() =>{
                this.loadDeviceStatus = false;
                
            });
        },
        onSyncAccessEvent() {
            this.loadAccessStatus = true;
            console.log("开始同步门户事件");
            this.form.startTime = this.form.date[0];
            this.form.endTime = this.form.date[1];
            this.form.eventType = 'ACCESS';
            this.$API.device.cloudPlatform.service.accessEvent.post(this.form).then(res => {
                if (res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                const data = res.data;
                this.$message.success('同步门户事件成功, 总共同步[' + data.total + "]条记录, 其中成功[" + data.successTotal + "], 失败: [" + data.failureTotal + "]");
            }).finally(() => {this.loadAccessStatus = false; this.loadAccessDialogStatus = false});
        },
        syncAccessEvent(item) {
            this.loadAccessDialogStatus = true;
            this.form.deviceConnectorId = item.deviceConnectorId;
        },
    }
}
</script>
