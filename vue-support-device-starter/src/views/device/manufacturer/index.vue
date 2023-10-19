<template>
	  <el-container>
		<el-header>
			<div class="left-panel">
                <el-button type="primary" icon="el-icon-plus" @click="doSave"></el-button>
				<el-button type="primary" icon="el-icon-refresh" @click="refresh"></el-button>
			</div>
			<div class="right-panel">
                
			</div>
		</el-header>
		<el-main class="nopadding">
			<scDymaicGrid ref="table" :apiObj="apiObj" row-key="id" :lineNum="4" stripe :templateFn="templateFn" />
		</el-main>
	</el-container>

	<save-dialog ref="saveDialog" v-if="saveDialogStatus"/>
</template>
<script>
import SaveDialog from './save.vue'
export default {
	components: {
		SaveDialog
	},
	data(){
		return {
			saveDialogStatus: false,
			apiObj: this.$API.device.manufacturer.page
		}
	},
	mounted() {
	},
	methods: {
		doSave() {
			this.saveDialogStatus = true;
			this.$nextTick(() => {
				this.$refs.saveDialog.open('add').setData({});
			});
		},
		afterPropertiesSet() {
			
		},
		templateFn(item) {
			return `
			<div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl ">
				<div class="md:flex">
					<div class="md:flex-shrink-0">
						<img class="h-48 w-full object-cover md:h-full md:w-48" src="${item.manufacturerPhoto}"
							alt="Man looking at item at a store">
					</div>
					<div class="p-8">
						<div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">${item.manufacturerName}(${item.manufacturerCode})</div>
						<a href="${item.manufacturerAddress ?? '无'}" target="_blank" class="block mt-1 text-lg leading-tight font-medium text-black hover:underline">
							网址
						</a>
						<p class="mt-2 text-gray-500">${item.manufacturerRemark ?? '无'}</p>
					</div>
				</div>
			</div>
			`;
		}
	}
}
</script>
<style>

</style>