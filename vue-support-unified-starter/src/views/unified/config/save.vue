<template>

    <el-dialog draggable v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="环境" prop="unifiedConfigProfile">
                <el-select allow-create	filterable v-model="row.unifiedConfigProfile">
                    <el-option v-for="it in profiles" :label="it.unifiedProfileDesc" :value="it.unifiedProfileName"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item label="应用名称" prop="unifiedAppname">
                <el-select allow-create	filterable v-model="row.unifiedAppname">
                    <el-option v-for="it in applications" :label="it.unifiedExecuterName" :value="it.unifiedAppname"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item  label="配置名称" prop="unifiedConfigName">
				<el-input  v-model="row.unifiedConfigName" clearable></el-input>
			</el-form-item>
            <el-form-item label="配置值" prop="unifiedConfigValue">
				<el-input v-model="row.unifiedConfigValue" clearable></el-input>
			</el-form-item>
            <el-form-item label="描述" prop="unifiedConfigDesc">
				<el-input v-model="row.unifiedConfigValue" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submitFormUpdate()">保 存</el-button>
		</template>
	</el-dialog>
</template>
<script>
export default {
    data() {
        return {
            visible: 0,
            profiles: [],
            applications: [],
            list: {
                apiObj: this.$API.unified.config.page,
                apiObjUpdate: this.$API.unified.config.update,
                apiObjSave: this.$API.unified.config.save,
                apiObjDelete: this.$API.unified.config.delete,
            },
        }
    },
}

</script>