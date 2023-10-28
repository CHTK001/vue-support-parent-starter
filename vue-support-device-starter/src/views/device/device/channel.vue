<template>
    <el-dialog :title="title" v-model="visible" :width="700" destroy-on-close @closed="$emit('closed')" draggable :close-on-click-modal="false">
        <el-skeleton :loading="initialStatus" :animated="true"></el-skeleton>
        <sc-form-table v-if="!initialStatus" ref="table" v-model="tabColumns" :addTemplate="addTemplate"  placeholder="暂无数据">
            <el-table-column fixed prop="channelIcon" label="通道图标" width="70">
                <template #default="scope">
                    <sc-icon-select v-model="scope.row.channelIcon" clearable></sc-icon-select>
                </template>
            </el-table-column>

            <el-table-column fixed prop="channelName" label="通道名称" >
                <template #default="scope">
                    <el-input v-model="scope.row.channelName"></el-input>
                </template>
            </el-table-column>
            <el-table-column fixed prop="channelNo" label="通道号" width="80">
                <template #default="scope">
                    <el-input v-model="scope.row.channelNo"></el-input>
                </template>
            </el-table-column>
            <el-table-column fixed prop="channeTag" label="标签" >
                <template #default="scope">
                    <el-input v-model="scope.row.channeTag"></el-input>
                </template>
            </el-table-column>
        </sc-form-table>
        <template #footer>
			<el-button @click="visible = false">取 消</el-button>
			<el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
		</template>
    </el-dialog>
</template>

<script>
import scIconSelect from '@/components/scIconSelect/index.vue'

export default {
    components: {
		scIconSelect
	},
    data() {
        return {
            title: '',
            visible: false,
            isSaveing: false,
            initialStatus: false,
            form: {},
            mode: 'add',
            tabColumns: [],
            addTemplate: {
                deviceId: null,
                channelNo: 0,
                channelName: '管道0',
                channeTag: ''
            }
        }
    },
    methods: {
        submit(){
            this.isSaveing = true;
            this.$API.device.device.channel.save.post(this.tabColumns).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.visible = false;
            }).finally(() => {this.isSaveing = false;});
        },
        open(mode) {
            this.mode = mode;
            this.isSaveing = false;
            this.title = '新增';
            this.visible = true;
            return this;
        },
        setData(data) {
            Object.assign(this.form, data);
            this.addTemplate['deviceId'] = this.form.deviceId;
            this.initialStatus = true;
            this.$API.device.device.channel.list.get({ deviceId: data.deviceId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.tabColumns = res.data;
            }).finally(() => {this.initialStatus = false;});
        }
    },
    mounted() {
    },
}
</script>