<template>
    <el-dialog v-model="dialogStatus" draggable title="服务器信息" width="90%" top="20px" :close-on-click-modal="false">
        <el-button plain text :loading="isLoaded" icon="el-icon-refresh" @click="doRefresh">刷新</el-button>
        <el-skeleton :animated="true" :loading="isLoaded" :rows="10">
            <el-row :gutter="12"  style="height: 700px; overflow: auto;">
                <el-col :span="12">
                    <el-card shadow="hover" style="width: 100%; overflow: auto;" v-for="item in data.filter(item => item.type == 'CHART')">
                        <el-descriptions  direction="vertical" class="margin-top" v-if="item.type == 'CHART'" :title="item.name" :column="3" :size="size" border >
                            <el-descriptions-item :label="it" v-for="it in item?.fields">
                                {{ item?.data[it] }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-card>
                </el-col>
                <el-col :span="12">
                    <el-card shadow="hover" style="width: 100%; overflow: auto;"  v-for="item in data.filter(item => item.type == 'TEXT')">
                        <el-descriptions  direction="vertical" class="margin-top"  :title="item.name" :column="3" :size="size" border >
                            <el-descriptions-item :label="it" v-for="it in item?.fields">
                                {{ item?.data[it] }}
                            </el-descriptions-item>
                        </el-descriptions>
                    </el-card>
                </el-col>
            </el-row>
        </el-skeleton>

    </el-dialog>
</template>
<script>
export default {
    name: 'Monitor',
    data() {
        return {
            isLoaded: false,
            dialogStatus: false,
            form: {
                genId: null,
            },
            data: [],

        }
    },
    methods: {
        async doRefresh() {
            this.isLoaded = true;
            this.$API.gen.session.info.post(this.form).then(res => {
                if (res.code == '00000') {
                    this.data = res.data?.data;
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.isLoaded = false);
				
		},
        open(form) {
            this.form.genId = form.genId;
            this.dialogStatus = true;
            this.doRefresh();
        }
    }
}
</script>