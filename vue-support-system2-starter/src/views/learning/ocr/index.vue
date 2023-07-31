<template>
	<el-container>
		<el-aside style="width: 30%">
			<el-container>
				<el-main>
                    <sc-upload :apiObj="apiObj" @onSuccess="onSuccess"  class="upload"   :compress="1" :aspectRatio="1/1">
                            </sc-upload>
                </el-main>
			</el-container>
		</el-aside>
		<el-container style="width: 70%">
			<el-main class="nopadding">
                <el-empty :description="this.$t('data.nodata')" />
			</el-main>
		</el-container>
	</el-container>
</template>

<script>
	export default {
		name: 'layoutLCR',
		data() {
			return {
                apiObj: this.$API.learning.ocr
			}
		},
        methods: {
            onSuccess(d) {
                debugger    
            }
        }
	}
</script>

<style scoped lang="less">
:deep(.el-upload--picture-card) {
    width: 100% !important;
    height: 100%  !important;
}
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}
.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}
.upload {
    width: 100% !important;
    height: 100%  !important;
}
.upload-bottom {
    border-bottom: 1px solid var(--el-border-color);
}
</style>
