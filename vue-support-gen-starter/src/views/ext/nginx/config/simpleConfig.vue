<template>
    <el-container style="overflow: hidden;">
        <el-main class="nopadding">
            <div class="code-toolbar">
                <el-button plain text :loading="isSave" icon="el-icon-plus" @click="addHttpConfig()">添加http参数</el-button>
                <!--<el-button plain text :loading="isOpen" icon="el-icon-monitor" @click="doMonitor">服务器信息</el-button> -->
                <el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="addSimpleConfig">简易配置向导</el-button>
                <!-- <el-button plain text :loading="isSaveBtn" icon="sc-icon-save" @click="doSaveBtn">保存</el-button> -->
                <!-- <el-button plain text  icon="el-icon-warning" @click="doLog">日志</el-button> -->
            </div>
            <div class="code-toolbar">
            </div>
            <div>
            </div>
        </el-main>

    </el-container>
</template>
<script>
export default {
    name: 'SimpleConfig',
    data() {
        return {
            form: {},
        }
    },
    mounted() {
        this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
    },
    methods: {
    }

}
</script>