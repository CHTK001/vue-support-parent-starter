<template>
    <el-drawer v-model="dialogStatus" size="50%"  title="日志" :close-on-click-modal="false" :destroy-on-close="true">
        <el-button plain text :loading="isLoadDatabase" icon="el-icon-refresh" @click="doRefreshDatabase">刷新</el-button>
        <el-table :data="returnData" border style="width: 100%">
            <el-table-column prop="id" label="id" width="80" />
            <el-table-column prop="timeStamp" label="执行时间" width="180" >
                <template #default="scope">
                    <el-tag v-time="scope.row.timeStamp"></el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="executionTime" label="耗时" width="80" ></el-table-column>
            <el-table-column prop="clientIpPort" label="客户端" width="180" >
                <template #default="scope">
                    <el-tag>{{ scope.row?.clientIpPort?.host || '未知' }}:{{ scope.row?.clientIpPort?.port }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="args" label="参数" >
                <template #default="scope">
                    <span>{{ scope.row.args?.join(" ") }}</span>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination small  layout="->, total, prev, pager, next" :total="returnTotal" @current-change="currentChange" @size-change="sizeChange"/>
    </el-drawer>    
</template>
<script>
export default {
    name: 'Log',
    data() {
        return {
            dialogStatus: false,
            isLoadDatabase: false,
            form:{
                pageSize: 10,
            },
            returnTotal: 0,
            returnData: [],
        }
    },
    mounted() {
        this.form.pageSize = 10;
    },
    methods: {
        currentChange(val) {
            this.form.page = val;
            this.search();
        },
        sizeChange(val) {
            this.form.pageSize = val;
            this.search();
        },
        open(data) {
            Object.assign(this.form, data);
            this.dialogStatus = true;
            this.search();
        },
        doRefreshDatabase() {
            this.search();
        },
        search() {
            this.isLoadDatabase = true;
            this.$API.gen.session.log.post(this.form).then(res => {
                if(res.code == '00000') {
                    this.returnData = res.data.data;
                    this.returnTotal = res.data.total;
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isLoadDatabase = false);
        }
    }
}
</script>