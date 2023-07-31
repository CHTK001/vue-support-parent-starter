<template>
	<el-container>
		<el-aside style="width: 50%;">
			<el-container>
				<el-main>
                    <sc-upload v-model="source"  :cropper="true" :compress="1" :aspectRatio="1/1"></sc-upload>
                </el-main>
			</el-container>
		</el-aside>
		<el-aside style="width: 50%;">
			<el-container>
				<el-main>
                    <sc-upload v-model="target"  :cropper="true" :compress="1" :aspectRatio="1/1"></sc-upload>
                </el-main>
			</el-container>
		</el-aside>
	</el-container>
</template>

<script>
	export default {
		name: 'layoutLCR',
		data() {
			return {

			}
		}
	}
</script>

<style>
</style>
