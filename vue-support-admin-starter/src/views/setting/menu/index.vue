<template>
	<el-container>
		<el-aside width="300px" v-loading="menuloading">
			<el-container>
				<el-header>
					<el-input placeholder="输入关键字进行过滤" v-model="menuFilterText" clearable></el-input>
				</el-header>
				<el-main class="nopadding">
					<el-tree ref="menu" class="menu" node-key="id" :data="menuList" :props="menuProps" draggable
						highlight-current :expand-on-click-node="false" check-strictly show-checkbox
						:filter-node-method="menuFilterNode" @node-click="menuClick" @node-drop="nodeDrop">

						<template #default="{ node, data }">
							<span class="custom-tree-node">
								<span class="label">
									{{ node.label }}
								</span>
								<span class="do">
									<el-button icon="el-icon-plus" size="small" @click.stop="add(node, data)"></el-button>
									<el-button icon="el-icon-Minus" size="small" @click.stop="del(node, data)"></el-button>
								</span>
							</span>
						</template>

					</el-tree>
				</el-main>
				<el-footer style="height:51px;">
					<el-button type="primary" size="small" icon="el-icon-plus" @click="add()"></el-button>
					<el-button type="danger" size="small" plain icon="el-icon-delete" @click="delMenu"></el-button>
				</el-footer>
			</el-container>
		</el-aside>
		<el-container>
			<el-main class="nopadding" style="padding:20px;" ref="main">
				<save ref="save" :menu="menuList"></save>
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
			menuloading: false,
			menuList: [],
			menuProps: {
				label: (data) => {
					return data.meta.title
				}
			},
			menuFilterText: ""
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
			this.menuloading = true
			this.$API.system.menu.list.get().then(res => {
				if (res.code === '00000') {
					this.menuList = res.data;
				}
			}).finally(() => {
				this.menuloading = false
			})

		},
		//树点击
		menuClick(data, node) {
			var pid = node.level == 1 ? undefined : node.parent.data.id;
			this.$refs.save.setData(data, pid)
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
			draggingNode.data.meta.sort=draggingNode.data.menuSort = dropNode.data.menuSort + 1;

			this.$API.system.menu.save.post(draggingNode.data).then(data => {
				if (data.code == '00000') {
					this.$message.success(data.msg);
				} else {
					this.$message.error(data.msg);
				}
			})
		},
		//删除
		async del(node, data) {
			this.$API.system.menu.delete.delete({ menuId: data.id }).then(data => {
				if (data.code == '00000') {
					this.$message.success(data.msg);
					this.$refs.menu.remove(node)
				} else {
					this.$message.warning(data.msg)
				}
			}).finally(() => {
				this.menuloading = false
			})
		},
		//增加
		async add(node, data) {
			console.log()
			var newMenuName = "未命名" + newMenuIndex++;
			var newMenuData = {
				parentId: data ? data.id : "",
				name: '',
				path: "/",
				menuTreePath: data ? (data.menuTreePath ? (data.menuTreePath + "," + data.id) : '') : '',
				component: "",
				meta: {
					title: newMenuName,
					type: "menu"
				}
			}
			this.menuloading = true
			var res = await this.$API.system.menu.save.post(newMenuData)
			this.menuloading = false
			newMenuData.id = res.data.menuId

			this.$refs.menu.append(newMenuData, node)
			this.$refs.menu.setCurrentKey(newMenuData.id)
			var pid = node ? node.data.id : ""
			this.$refs.save.setData(newMenuData, pid);
		},
		//删除菜单
		async delMenu() {
			var CheckedNodes = this.$refs.menu.getCheckedNodes()
			if (CheckedNodes.length == 0) {
				this.$message.warning("请选择需要删除的项")
				return false;
			}

			var confirm = await this.$confirm('确认删除已选择的菜单吗？', '提示', {
				type: 'warning',
				confirmButtonText: '删除',
				confirmButtonClass: 'el-button--danger'
			}).catch(() => { })
			if (confirm != 'confirm') {
				return false
			}

			this.menuloading = true
			var reqData = {
				ids: CheckedNodes.map(item => item.id)
			}
			this.$API.system.menu.delete.delete({ menuId: reqData.ids.join(',') }).then(data => {
				if (data.code == '00000') {
					CheckedNodes.forEach(item => {
						var node = this.$refs.menu.getNode(item)
						if (node.isCurrent) {
							this.$refs.save.setData({})
						}
						this.$refs.menu.remove(item)
					})
				} else {
					this.$message.warning(data.msg)
				}
			}).finally(() => {
				this.menuloading = false
			})
		}
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
