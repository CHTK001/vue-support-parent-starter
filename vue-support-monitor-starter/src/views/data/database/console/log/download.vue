<template>
    <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true"  width="550px" draggable title="下载备份" @close="close">
        <el-form :inline="true" class="demo-form-inline " >
            <el-form-item >
                <el-date-picker v-model="rangTimeValue" :editable="false" type="daterange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
            </el-form-item>
            <el-form-item >
                <el-button type="primary" @click="doSearch" icon="sc-icon-download"></el-button>
            </el-form-item>
        </el-form>
    </el-dialog>

</template>

<script>

export default {
    components:{
    },
    data(){
        return {
            editDialogStatus: false,
            searchDialogStatus: false,
            query: {},
            rangTimeValue: [],
            form: {
                tableName: null,
                action: null
            }
        }
    },
    mounted(){
        this.rangTimeValue[1] = new Date();
        this.rangTimeValue[0] = new Date(new Date().getTime() - 86400 * 1000);
    },
    methods: {
        async doSearch(){
            if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
                this.$message.error('请选择时间');
                return;
            }

            const startDay = this.$TOOL.dateFormat(this.getTime(0), 'yyyy-MM-dd');
            const endDay =  this.$TOOL.dateFormat(this.getTime(1), 'yyyy-MM-dd');

            const fileUrl = this.$API.gen.backup2.download.url + `?genId=${this.form.genId}&startDay=${startDay}&endDay=${endDay}`
            window.open(fileUrl);
        },
        getTime(i) {
            try {
                return this.rangTimeValue[i].getTime();
            } catch (error) {
                return this.rangTimeValue[i].$d.getTime();
            }
        },
        open(form){
            Object.assign(this.form, form);
            this.editDialogStatus = true;
        },
        close() {
            this.editDialogStatus = false;
            this.form = {};
            // this.query.tableName = null;
            // this.query.action = null;
        }
        
    }
}
</script>