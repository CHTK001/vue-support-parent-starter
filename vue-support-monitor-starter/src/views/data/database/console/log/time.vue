<template>
    <el-dialog v-model="editDialogStatus" :close-on-click-modal="false" :destroy-on-close="true"  width="550px" draggable title="检索日志" @close="close">
        <el-form :inline="true" class="demo-form-inline ">
            <el-form-item>
                <el-date-picker v-model="rangTimeValue" type="datetimerange" range-separator="-" start-placeholder="开始时间" end-placeholder="结束时间" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" @click="doSearch" icon="el-icon-search"></el-button>
            </el-form-item>
        </el-form>
    </el-dialog>
    <search-dialog v-if="searchDialogStatus" ref="searchDialogRef"></search-dialog>

</template>

<script>
import SearchDialog from './search.vue'

export default {
    components:{
        SearchDialog
    },
    data(){
        return {
            editDialogStatus: false,
            searchDialogStatus: false,
            rangTimeValue: [],
            form: {}
        }
    },
    mounted(){
        this.rangTimeValue[1] = new Date();
        this.rangTimeValue[0] = new Date(new Date().getTime() - 86400 * 1000);
    },
    methods: {
        doSearch(){
            if (!this.rangTimeValue || this.rangTimeValue.length != 2) {
                this.$message.error('请选择时间');
                return;
            }

            this.searchDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.searchDialogRef.open(this.rangTimeValue, this.form);
                this.close();
            })
        },
        open(form){
            Object.assign(this.form, form);
            this.editDialogStatus = true;
        },
        close() {
            this.editDialogStatus = false;
            this.form = {};
        }
        
    }
}
</script>