<template>
	<el-container>
		<el-aside width="300px" v-loading="loading">
			<el-container>
				<el-header>
					<el-input placeholder="输入关键字进行过滤" v-model="keyword" clearable></el-input>
				</el-header>
				<el-main class="nopadding">
					<el-tree ref="dic" class="menu" node-key="fsId" :data="bucketList" :props="bucketProps" 
						:highlight-current="true" :expand-on-click-node="false" :filter-node-method="dicFilterNode" @node-click="bucketClick">
						<template #default="{node, data}">
							<span class="custom-tree-node">
								<span>{{ node.label }}</span>
								<span class="code">
									<sc-status-indicator v-if="data.fsStatus == 1" pulse type="success"></sc-status-indicator>
									<sc-status-indicator type="info" v-else></sc-status-indicator>
								</span>
								<span class="do">
									<el-button-group>
										<el-button icon="el-icon-edit" size="small" @click.stop="bucketEdit(data)"></el-button>
										<el-button icon="el-icon-delete" size="small" @click.stop="bucketDel(node, data)"></el-button>
									</el-button-group>
								</span>
							</span>
						</template>
					</el-tree>
				</el-main>
				<el-footer style="height:51px;">
					<el-button type="primary" size="small" icon="el-icon-plus" style="width: 100%;" @click="addBucket">新增bucket</el-button>
				</el-footer>
			</el-container>
		</el-aside>
		<el-container>
			<el-main class="nopadding" style="padding:20px;" ref="main">
				<save ref="save" @success="onSuccess" :menu="menuList"></save>
			</el-main>
		</el-container>
	</el-container>
</template>

<script>
let newMenuIndex = 1;
import save from './save.vue'

export default {
	name: "settingMenu",
	components: {
		save
	},
	data() {
		return {
			bucketProps: {
				label: (data) => {
					return data?.fsName
				}
			},
			bucketList: [],
			loading: false,
			ossType: [],
			keyword: ""
		}
	},
	watch: {
		menuFilterText(val) {
			this.$refs.menu.filter(val);
		}
	},
	mounted() {
		this.getMenu();
	},
	methods: {
		//加载树数据
		getMenu() {
			this.search();
			this.$API.system.oss.type.get().then(res => {
				if (res.code === '00000') {
					this.ossType = res.data;
				}
			})

		},
		search() {
			this.menuloading = true
			this.$API.system.oss.page.get().then(res => {
				if (res.code === '00000') {
					this.bucketList = res.data?.data;
				}
			}).finally(() => {
				this.menuloading = false
			});
		},
		onSuccess(data) {
			this.search();
		},
		//树点击
		bucketEdit(data, node) {
			this.$refs.save.setData(data, null, this.ossType, 'edit')
			this.$refs.main.$el.scrollTop = 0
		},
		bucketDel(node, data) {
			this.$API.system.oss.delete.delete(data)
				.then(res => {
					if (res.code != '00000') {
						this.$message.error(res.msg)
						return;
					} 
					this.search();
				});
			this.$refs.main.$el.scrollTop = 0
		},
		//树点击
		bucketClick(data, node) {
			this.$refs.save.setData(data, null, this.ossType, 'view')
			this.$refs.main.$el.scrollTop = 0
		},
		//树过滤
		menuFilterNode(value, data) {
			if (!value) return true;
			var targetText = data.meta.title;
			return targetText.indexOf(value) !== -1;
		},
		//树拖拽
		nodeDrop(draggingNode, dropNode, dropType) {
			this.$refs.save.setData({})
			draggingNode.data.parentId = dropNode.data.parentId;
			debugger
			this.$API.system.menu.save.post(draggingNode.data).then(data => {
				if (data.code == '00000') {
					this.$notify.success(data.msg);
				} else {
					this.$notify.error(data.msg);
				}
			})
		},
		//删除
		async del(node, data) {
			this.$API.system.menu.delete.delete({ menuId: data.id }).then(data => {
				if (data.code == '00000') {
					this.$notify.success(data.msg);
					this.$refs.menu.remove(node)
				} else {
					this.$notify.warning(data.msg)
				}
			}).finally(() => {
				this.menuloading = false
			})
		},
		//增加
		async addBucket() {
			this.$refs.save.setData({}, null, this.ossType, 'save');
		},
		
	}
}
</script>

<style scoped>
.menu:deep(.el-tree-node__label) {
	display: flex;
	flex: 1;
	height: 100%;
}

.custom-tree-node {
	display: flex;
	flex: 1;
	align-items: center;
	justify-content: space-between;
	font-size: 14px;
	height: 100%;
	padding-right: 24px;
}

.custom-tree-node .label {
	display: flex;
	align-items: center;
	;
	height: 100%;
}

.custom-tree-node .label .el-tag {
	margin-left: 5px;
}

.custom-tree-node .do {
	display: none;
}

.custom-tree-node .do i {
	margin-left: 5px;
	color: #999;
}

.custom-tree-node .do i:hover {
	color: #333;
}

.custom-tree-node:hover .do {
	display: inline-block;
}

.removeRadio .el-radio__inner {
	border-radius: 0;
	border: 0;
	width: 170px;
	height: 34px;
	background-color: transparent;
	cursor: pointer;
	box-sizing: border-box;
	position: absolute;
	top: -18px;
	left: -19px;
}

.removeRadio .el-radio__input.is-checked .el-radio__inner {
	background: transparent;
}</style>
