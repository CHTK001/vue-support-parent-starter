<template>
	  <el-container style="background-color: #ccc; position: relative;">
		<el-header>
			<div class="left-panel">
                <el-button type="primary" icon="el-icon-plus" @click="doSave"></el-button>
				<el-button type="primary" icon="el-icon-refresh" @click="afterPropertiesSet"></el-button>
			</div>
			<div class="right-panel">
                
			</div>
		</el-header>
		<el-main class="nopadding">
			<div ref="table"  :style="{ 'height': _table_height, 'background' : 'rgb(226 232 240 / 30%)' }">
				<div class="flex flex-nowrap grid grid-cols-6 mr-6  p-2">
					<div @click="doEdit(item)" style="margin-right: 5px; align-item: center; margin-left: 5px;" class="bg-white relative hover:shadow-lg order-1 gap-4 shadow-md h-38 grid grid-cols-2 content-center cursor-pointer" v-for="item in returnData">
						<div class="indexItem">
							<el-image :src="item.manufacturerPhoto" :lazy="true" fit="fit">
								<template #error>
									<div class="image-slot">
										<el-icon><icon-picture /></el-icon>
									</div>
								</template>
							</el-image>
						</div>
						<el-button :loading="deleteStatus" size="small" type="danger" text plain icon="el-icon-delete" class="absolute right-0" @click.stop="doDelete(item)"></el-button>
						<div class="p-2">
							<div class="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
								{{ item.manufacturerName}}
								({{ item.manufacturerCode }})
							</div>
							<a @click.stop v-if="item.manufacturerAddress" target="_blank" :href="item.manufacturerAddress" class="z-9999 block mt-1 text-lg leading-tight font-medium text-black hover:underline">
								官网
							</a>
							<p class="mt-2 text-gray-500" v-if="item.manufacturerRemark">
								{{ item.manufacturerRemark }}
							</p>
							<p class="mt-2 text-gray-500" v-else>
								<p >电话: {{ item.manufacturerPhone ?? '-'}}</p>
								<p v-if="item.manufacturerEmail">邮箱: {{ item.manufacturerEmail  }}</p>
							</p>
						</div>
					</div>
				</div>
			</div>
			<el-pagination style="bottom: 10px; left: 4px" class="absolute" :page-size="form.pageSize"  background layout="total, sizes, prev, pager, next" :small="true" @current-change="paginationChange" @update:page-size="pageSizeChange"  :total="returnTotal" ></el-pagination>
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
			deleteStatus: false,
			form: {
				page: 1,
				pageSize: 10,
			},
			height: '100%',
			lineNum: 6,
			returnData: [],
			returnTotal: 0,
			apiObj: this.$API.device.manufacturer.page
		}
	},
	computed: {
		_height() {
			return Number(this.height) ? Number(this.height) + 'px' : this.height
		},
		_table_height() {
			return "calc(100% - 50px)"
		}
	},
	mounted() {
		this.afterPropertiesSet();
	},

	methods: {
		//分页点击
		paginationChange(page) {
			this.form.page = page;
			this.afterPropertiesSet();
		},
		//条数变化
		pageSizeChange(size) {
			this.form.pageSize = size;
			this.afterPropertiesSet();
		},
		doSave() {
			this.saveDialogStatus = true;
			this.$nextTick(() => {
				this.$refs.saveDialog.open('add').setData({});
			});
		},
		doDelete(item) {
			this.$API.device.manufacturer.delete.delete({id: item.manufacturerId}).then(res => {
				if(res.code != '00000') {
					this.$message.error(res.msg);
					return;
				}
				this.returnData = this.returnData.filter(it => it.manufacturerId != item.manufacturerId);
				this.returnTotal = this.returnData.length;
			})
		},
		doEdit(item) {
			this.saveDialogStatus = true;
			this.$nextTick(() => {
				this.$refs.saveDialog.open('edit').setData(item);
			});
		},
		afterPropertiesSet() {
			this.apiObj.get(this.form).then(res => {
				if(res.code == '00000') {
					this.returnData = res.data.data;
					this.returnTotal = res.data.total;
				}
			})
		},
	}
}
</script>
<style scoped>
.demo-image__error .block {
  padding: 30px 0;
  text-align: center;
  border-right: solid 1px var(--el-border-color);
  display: inline-block;
  width: 49%;
  box-sizing: border-box;
  vertical-align: top;
}
.demo-image__error .demonstration {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  margin-bottom: 20px;
}
.indexItem {
      display: flex;
      justify-content: space-between;
      align-items: center;
	}
.demo-image__error .el-image {
  padding: 0 5px;
  max-width: 300px;
  max-height: 200px;
  width: 100%;
  height: 200px;
}

.demo-image__error .image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 30px;
}
.demo-image__error .image-slot .el-icon {
  font-size: 30px;
}
</style>