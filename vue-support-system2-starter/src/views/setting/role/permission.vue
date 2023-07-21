<template>
	<el-dialog title="角色权限设置" :loading="fullLoading" :close-on-click-modal="false" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-tabs tab-position="top">
			<el-tab-pane label="菜单权限">
				<div class="treeMain">
					<el-tree ref="menu" node-key="id" :data="menu.list" :props="menu.props" show-checkbox :default-checked-keys="menu.checked"></el-tree>
				</div>
			</el-tab-pane>
			<el-tab-pane label="数据权限">
				<el-form label-width="100px" label-position="left">
					<el-form-item label="规则类型">
						<el-select v-model="data.dataType" placeholder="请选择">
							<el-option label="全部可见" value="1"></el-option>
							<el-option label="本人可见" value="2"></el-option>
							<el-option label="所在部门可见" value="3"></el-option>
							<el-option label="所在部门及子级可见" value="4"></el-option>
							<!-- <el-option label="选择的部门可见" value="5"></el-option> -->
							<el-option label="自定义" value="6"></el-option>
						</el-select>
					</el-form-item>
					<el-form-item label="选择部门" v-show="data.dataType == '5'">
						<div class="treeMain" style="width: 100%;">
							<el-tree ref="dept" node-key="id" :data="data.list" :props="data.props" show-checkbox></el-tree>
						</div>
					</el-form-item>
					<el-form-item label="规则值" v-show="data.dataType == '6'">
						<el-input v-model="data.rule" clearable type="textarea" :rows="6"
							placeholder="请输入自定义规则代码"></el-input>
					</el-form-item>
				</el-form>
			</el-tab-pane>
			<el-tab-pane label="控制台模块">
				<div class="treeMain">
					<el-tree ref="grid" node-key="key" :data="grid.list" :props="grid.props"
						:default-checked-keys="grid.checked" show-checkbox @check-change = "setCheckedNodes"></el-tree>
				</div>
			</el-tab-pane>
			<el-tab-pane label="控制台">
				<el-form label-width="100px" label-position="left">
					<el-form-item label="控制台视图">
						<el-select v-model="dashboard" placeholder="请选择">
							<el-option v-for="item in dashboardOptions" :key="item.value" :label="item.label"
								:value="item.value">
								<span style="float: left">{{ item.label }}</span>
								<span style="float: right; color: #8492a6; font-size: 12px">{{ item.views }}</span>
							</el-option>
						</el-select>
						<div class="el-form-item-msg">用于控制角色登录后控制台的视图</div>
					</el-form-item>
				</el-form>
			</el-tab-pane>
		</el-tabs>
		<template #footer>
			<el-button @click="visible = false">取 消</el-button>
			<el-button type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
		</template>
	</el-dialog>
</template>

<script>
import allComps from '@/views/home/widgets/components'

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			fullLoading: false,
			visible: false,
			isSaveing: false,
			log: new Logger('permission'),
			menu: {
				list: [],
				checked: [],
				props: {
					label: (data) => {
						return data.meta.title
					}
				}
			},
			grid: {
				list: [],
				checked: [],
				props: {
					label: (data) => {
						return data.title
					},
					disabled: (data) => {
						return data.isFixed
					}
				}
			},
			data: {
				dataType: "1",
				list: [],
				checked: [],
				props: {},
				rule: ""
			},
			dashboard: "0",
			dashboardOptions: [
				{
					value: '0',
					label: '数据统计',
					views: 'stats'

				},
				{
					value: '1',
					label: '工作台',
					views: 'work'
				},
			]
		}
	},
	mounted() {
		this.getMenu()
		// this.getDept()
		this.getGrid()
	},
	methods: {
		setCheckedNodes: function(data, check) {
			if(check) {
				this.grid.checked.push(data.key);
			} else {
				this.grid.checked.splice(this.grid.checked.indexOf(data.key), 1);
			}
		},
		open(role) {
			this.roles = role;
			this.visible = true;
			this.initial();
		},
		submit() {
			this.isSaveing = true;

			//选中的和半选的合并后传值接口
			var checkedKeys = this.$refs.menu.getCheckedKeys().concat(this.$refs.menu.getHalfCheckedKeys())
			this.log.info('菜单', checkedKeys);

			// var checkedKeys_dept = this.$refs.dept.getCheckedKeys().concat(this.$refs.dept.getHalfCheckedKeys())
			// this.log.info(checkedKeys_dept)
			// this.log.info('部门' + checkedKeys_dept)

			this.log.info('数据权限 -> 数据类型' + this.data.dataType + ", 规则: " + this.data.rule)
			this.log.info('自定义组件', this.grid.checked)
			this.log.info('控制台类型', this.dashboard)
			this.log.info('当前角色', this.roles)

			this.$API.system.role.updateRole.post({
				menuIds: checkedKeys,
				depts: [],
				roleDataScope: this.data.dataType,
				roleDataRule: this.data.rule,
				roleDashboard: this.dashboard,
				roleGrid: this.grid.checked,
				roleId: this.roles,
			}).then(res => {
				if(res.code === '00000') {
					this.visible = false;
					this.$emit('success')
					this.$notify.success({title: '提示', message : "操作成功"})
				}else{
					this.$notify.error({title: '提示', message : res.msg})
				}
			}).finally(() => this.isSaveing = false);
			// setTimeout(()=>{
			// this.isSaveing = false;
			// 	this.visible = false;
			// 	this.$message.success("操作成功")
			// 	this.$emit('success')
			// },1000)
		},
		//根据角色初始化
		async initial() {
			this.fullLoading = true;
			var res = await this.$API.system.role.getRole.get({roleId: this.roles})
			this.fullLoading = false;
			if(res.code === '00000') {
				this.dashboard = res.data.roleDashboard;
				this.grid.checked = res.data.roleGrid;
				this.menu.checked = res.data.menuIds;
				this.data.dataType = res.data.roleDataScope;
				this.data.rule = res.data.roleDataRule;
				return;
			}
			this.$notify.error({title: '提示', message: res.msg});
		},
		async getMenu() {
			var res = await this.$API.system.menu.list.get()
			this.menu.list = res.data

			//获取接口返回的之前选中的和半选的合并，处理过滤掉有叶子节点的key
			this.menu.checked = ["system", "user", "user.add", "user.edit", "user.del", "directive.edit", "other", "directive"]
			this.$nextTick(() => {
				let filterKeys = this.menu.checked.filter(key => {
					const node = this.$refs.menu.getNode(key);
					return node ? node.isLeaf : false;
				})
				this.$refs.menu.setCheckedKeys(filterKeys, true)
			})
		},
		async getDept() {
			var res = await this.$API.system.dept.list.get();
			this.data.list = res.data
			this.data.checked = ["12", "2", "21", "22", "1"]
			this.$nextTick(() => {
				let filterKeys = this.data.checked.filter(key => this.$refs.dept.getNode(key).isLeaf)
				this.$refs.dept.setCheckedKeys(filterKeys, true)
			})
		},
		getGrid() {
			const comp = allComps;
			const tpl = [];

			for(const item in comp) {
				const item1 = {
					key: item,
					title: comp[item]['title'],
					isFixed: ['welcome', 'ver'].indexOf(item) > -1
				};
				tpl.push(item1);

				if(item1.isFixed) {
					this.grid.checked.push(item1.key)
				}
			}
			this.grid.list = tpl
		}
	}
}
</script>

<style scoped>.treeMain {
	height: 280px;
	overflow: auto;
	border: 1px solid #dcdfe6;
	margin-bottom: 10px;
}</style>
