<template>

    <el-dialog v-model="visible" :width="260" title="下次执行时间">
        <div v-if="data.length > 0" >
            <div v-for="item of data" style="margin-top: 20px">
                <el-tag>
                    {{ item }}
                </el-tag>
            </div>
        </div>

        <el-empty v-else></el-empty>
    </el-dialog>

</template>

<script>
export default {
    data(){
        return {
            visible: false,
            data: []
        }
    },
    methods: {
        setData(row) {
            this.visible = true;
            this.$API.monitor.job.nextTime.handler({
                scheduleType: row.jobType,
                scheduleConf: row.jobConf
            }).then(res => {
                if(res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }

                this.data = res.data;

            })
        }
    }
}
</script>