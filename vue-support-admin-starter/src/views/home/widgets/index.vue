<template>
	<div :class="['widgets-home', customizing?'customizing':'']" ref="main">
		<div class="widgets-content">
			<div class="widgets-top">
				<div class="widgets-top-title">
					控制台
				</div>
				<div class="widgets-top-actions">
					<el-button v-if="customizing" type="primary" icon="el-icon-check" round @click="save">完成</el-button>
					<el-button v-else type="primary" icon="el-icon-edit" round @click="custom">自定义</el-button>
				</div>
			</div>
			<div class="widgets" ref="widgets">
				<div class="widgets-wrapper">
					<div v-if="nowCompsList.length<=0" class="no-widgets">
						<el-empty :image="getImg('no-widgets.svg')" description="没有部件啦" :image-size="280"></el-empty>
					</div>
					<el-row :gutter="15">
						<el-col v-for="(item, index) in grid.layout" v-bind:key="index" :md="item" :xs="24">
							<draggable @end="update" v-model="grid.copmsList[index]" animation="200" handle=".customize-overlay" group="people" item-key="com" dragClass="aaaaa" force-fallback fallbackOnBody class="draggable-box">
								<template #item="{ element }">
									<div class="widgets-item">
										<component :is="allComps[element]"></component>
										<div v-if="customizing" class="customize-overlay">
											<el-button class="close" type="danger" plain icon="el-icon-close" size="small" @click="remove(element)"></el-button>
											<label><el-icon><component :is="allComps[element].icon" /></el-icon>{{ allComps[element].title }}</label>
										</div>
									</div>
								</template>
							</draggable>
						</el-col>
					</el-row>
				</div>
			</div>
		</div>
		<div v-if="customizing" class="widgets-aside">
			<el-container>
				<el-header>
					<div class="widgets-aside-title"><el-icon><el-icon-circle-plus-filled/></el-icon>添加部件</div>
					<div class="widgets-aside-close" @click="close()"><el-icon><el-icon-close /></el-icon></div>
				</el-header>
				<el-header style="height:auto">
					<div class="selectLayout">
						<div class="selectLayout-item item01" :class="{active:grid.layout.join(',')=='12,6,6'}" @click="setLayout([12,6,6])">
							<el-row :gutter="2">
								<el-col :span="12"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
							</el-row>
						</div>
						<div class="selectLayout-item item02" :class="{active:grid.layout.join(',')=='24,16,8'}" @click="setLayout([24,16,8])">
							<el-row :gutter="2">
								<el-col :span="24"><span></span></el-col>
								<el-col :span="16"><span></span></el-col>
								<el-col :span="8"><span></span></el-col>
							</el-row>
						</div>
						<div class="selectLayout-item item03" :class="{active:grid.layout.join(',')=='24'}" @click="setLayout([24])">
							<el-row :gutter="2">
								<el-col :span="24"><span></span></el-col>
								<el-col :span="24"><span></span></el-col>
								<el-col :span="24"><span></span></el-col>
							</el-row>
						</div>
						<div class="selectLayout-item item04" :class="{active:grid.layout.join(',')=='6,6,12'}" @click="setLayout([6,6,12])">
							<el-row :gutter="2">
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
								<el-col :span="12"><span></span></el-col>
							</el-row>
						</div>
						<div class="selectLayout-item item05" :class="{active:grid.layout.join(',')=='6,6,6,6'}" @click="setLayout([6,6,6,6])">
							<el-row :gutter="2">
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
							</el-row>
						</div>
						<div class="selectLayout-item item02" :class="{active:grid.layout.join(',')=='24,6,6,6,6'}"  @click="setLayout([24,6,6,6,6])">
							<el-row :gutter="2">
								<el-col :span="24"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
								<el-col :span="6"><span></span></el-col>
							</el-row>
						</div>
					</div>
				</el-header>
				<el-main class="nopadding">
					<div class="widgets-list">
						<div v-if="myCompsList.length<=0" class="widgets-list-nodata">
							<el-empty description="没有部件啦" :image-size="60"></el-empty>
						</div>
						<div v-for="item in myCompsList" :key="item.title" class="widgets-list-item">
							<div class="item-logo"><el-icon><component :is="item.icon" /></el-icon></div>
							<div class="item-info">
								<h2>{{ item.title }}</h2>
								<p>{{ item.description }}</p>
							</div>
							<div class="item-actions">
								<el-button type="primary" icon="el-icon-plus" size="small" @click="push(item)"></el-button>
							</div>
						</div>
					</div>
				</el-main>
				<el-footer style="height:51px;">
					<el-button size="small" @click="backDefaul()">恢复默认</el-button>
				</el-footer>
			</el-container>
		</div>
	</div>
</template>

<script>
	import draggable from 'vuedraggable'
	import allComps from './components'
	import sysConfig from "@/config";
	import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';

	export default {
		components: {
			draggable
		},
		data() {
			return {
				customizing: false,
				allComps: allComps,
				selectLayout: [],
				defaultGrid: this.$CONFIG.DEFAULT_GRID,
				grid: []
			}
		},
		created(){
			this.grid = this.$TOOL.data.get(sysConfig.GRID) || JSON.parse(JSON.stringify(this.defaultGrid))
		},
		mounted() {
			this.filter();
			this.$emit('on-mounted')
		},
		computed: {
			allCompsList(){
				var allCompsList = []
				const owner = this.$TOOL.data.get(sysConfig.DASHBOARD_GRID);
				for(var key in this.allComps){
					if(owner.indexOf(key) == -1) {
						continue;
					}

					allCompsList.push({
						key: key,
						title: allComps[key].title,
						icon: allComps[key].icon,
						description: allComps[key].description
					})
				}
				var myCopmsList = this.grid.copmsList.reduce(function(a, b){return a.concat(b)})
				for(let comp of allCompsList){
					const _item = myCopmsList.find((item)=>{return item === comp.key})
					if(_item){
						comp.disabled = true
					}
				}
				return allCompsList
			},
			myCompsList(){
				var myGrid = this.$TOOL.data.get(sysConfig.DASHBOARD_GRID) || [];
				return this.allCompsList.filter(item => !item.disabled && myGrid.includes(item.key));
			},
			nowCompsList(){
				return this.grid.copmsList.reduce(function(a, b){return a.concat(b)});
			}
		},
		methods: {
			getImg(name) {
				return getAssetsImages(name);
			},
			update(d) {
			},
			//删除多余组件
			async filter() {
				const owner = this.$TOOL.data.get(sysConfig.DASHBOARD_GRID);
				this.filter2(owner, this.grid.copmsList);
			},
			filter2(owner, c) {
				const tpl = [];
				for(const item of c) {
					for(const index in item) {
						if(owner.indexOf(item[index]) == -1) {
							item.splice(index, 1);
							this.filter();
						}
					}
				}
			},
			//开启自定义
			custom(){
				this.customizing = true
				const oldWidth = this.$refs.widgets.offsetWidth
				this.$nextTick(() => {
					const scale =  this.$refs.widgets.offsetWidth / oldWidth
					this.$refs.widgets.style.setProperty('transform', `scale(${scale})`)
				})
			},
			//设置布局
			setLayout(layout){
				this.grid.layout = layout
				if(layout.join(',')=='24'){
					this.grid.copmsList[0] = [...this.grid.copmsList[0],...this.grid.copmsList[1],...this.grid.copmsList[2],...this.grid.copmsList[3] || [],...this.grid.copmsList[4] || []]
					this.grid.copmsList[1] = []
					this.grid.copmsList[2] = []
					this.grid.copmsList[3] = []
					this.grid.copmsList[4] = []
				}
			},
			//追加
			push(item){
				let target = this.grid.copmsList[0]
				target.push(item.key)
			},
			//隐藏组件
			remove(item){
				var newCopmsList = this.grid.copmsList
				newCopmsList.forEach((obj, index) => {
					var newObj = obj.filter(o=>o!=item)
					newCopmsList[index] = newObj;
				})
			},
			//保存
			save(){
				this.customizing = false
				this.$refs.widgets.style.removeProperty('transform')
				this.$TOOL.data.set(sysConfig.GRID, this.grid)
				this.grid.layout = this.grid.layout.join(',');
				this.grid.copmsList = JSON.stringify(this.grid.copmsList);
				this.$API.auth.grid.post(this.grid).then(data => {
					if(data.code === '00000') {
						this.$notify.success({
							title: '提示',
							message: data.msg
						});
						return !0;
					} 
					this.$notify.error({
						title: '提示',
						message: data.msg
					});
				})
			},
			//恢复默认
			backDefaul(){
				this.customizing = false
				this.$refs.widgets.style.removeProperty('transform')
				this.grid =  JSON.parse(JSON.stringify(this.defaultGrid))
				this.$TOOL.data.remove(sysConfig.GRID)
			},
			//关闭
			close(){
				this.customizing = false
				this.$refs.widgets.style.removeProperty('transform')
			}
		}
	}
</script>

<style scoped lang="scss">
	.widgets-home {display: flex;flex-direction: row;flex: 1;height: 100%;}
	.widgets-content {flex: 1;overflow: auto;overflow-x:hidden;padding:15px;}
	.widgets-aside {width: 360px;background: #fff;box-shadow: 0 0 10px rgba(0,0,0,.1);position: relative;overflow: auto;}
	.widgets-aside-title {font-size: 14px;display: flex;align-items: center;justify-content: center;}
	.widgets-aside-title i {margin-right: 10px;font-size: 18px;}
	.widgets-aside-close {font-size: 18px;width:30px;height: 30px;display: flex;align-items: center;justify-content: center;border-radius: 3px;cursor: pointer;}
	.widgets-aside-close:hover {background: rgba(180,180,180,0.1);}

	.widgets-top {margin-bottom: 15px;display: flex;justify-content: space-between;align-items: center;}
	.widgets-top-title {font-size: 18px;font-weight: bold;}

	.widgets {transform-origin: top left;transition: transform .15s;}

	.draggable-box {height: 100%;}

	.customizing .widgets-wrapper {margin-right:-360px}
	.customizing .widgets-wrapper .el-col {padding-bottom:15px;}
	.customizing .widgets-wrapper .draggable-box {border: 1px dashed var(--el-color-primary);padding:15px;}
	.customizing .widgets-wrapper .no-widgets {display: none;}
	.customizing .widgets-item {position: relative;margin-bottom: 15px;}
	.customize-overlay {position: absolute;top:0;right:0;bottom:0;left:0;z-index: 1;display: flex;flex-direction: column;align-items: center;justify-content: center;background: rgba(255,255,255,0.9);cursor: move;}
	.customize-overlay label {background: var(--el-color-primary);color: #fff;height:40px;padding:0 30px;border-radius: 40px;font-size: 18px;display: flex;align-items: center;justify-content: center;cursor: move;}
	.customize-overlay label i {margin-right: 15px;font-size: 24px;}
	.customize-overlay .close {position: absolute;top:15px;right:15px;}
	.customize-overlay .close:focus, .customize-overlay .close:hover {background: var(--el-button-hover-color);}

	.widgets-list {}
	.widgets-list-item {display: flex;flex-direction: row;padding:15px;align-items: center;}
	.widgets-list-item .item-logo {width: 40px;height: 40px;border-radius: 50%;background: rgba(180,180,180,0.1);display: flex;align-items: center;justify-content: center;font-size: 18px;margin-right: 15px;color: #6a8bad;}
	.widgets-list-item .item-info {flex: 1;}
	.widgets-list-item .item-info h2 {font-size: 16px;font-weight: normal;cursor: default;}
	.widgets-list-item .item-info p {font-size: 12px;color: #999;cursor: default;}
	.widgets-list-item:hover {background: rgba(180,180,180,0.1);}

	.widgets-wrapper .sortable-ghost {opacity: 0.5;}

	.selectLayout {width: 100%;display: flex;}
	.selectLayout-item {width:60px;height:60px;border: 2px solid var(--el-border-color-light);padding:5px;cursor: pointer;margin-right: 15px;}
	.selectLayout-item span {display: block;background: var(--el-border-color-light);height:46px;}
	.selectLayout-item.item02 span {height:30px;}
	.selectLayout-item.item02 .el-col:nth-child(1) span {height:14px;margin-bottom: 2px;}
	.selectLayout-item.item03 span {height:14px;margin-bottom: 2px;}
	.selectLayout-item:hover {border-color: var(--el-color-primary);}
	.selectLayout-item.active {border-color: var(--el-color-primary);}
	.selectLayout-item.active span {background: var(--el-color-primary);}


	.dark {
		.widgets-aside {background: #2b2b2b;}
		.customize-overlay {background: rgba(43,43,43,0.9);}
	}

	@media (max-width: 992px){
		.customizing .widgets {transform: scale(1) !important;}
		.customizing .widgets-aside {width: 100%;position: absolute;top:50%;right:0;bottom:0;}
		.customizing .widgets-wrapper {margin-right:0;}
	}

</style>
