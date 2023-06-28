<script setup lang="ts">
defineOptions({
	// eslint-disable-next-line vue/no-reserved-component-names
	name: "Menu",
	inheritAttrs: false,
});

import {MenuForm, MenuQuery, MenuVO} from "@/api/menu/types";
import {addMenu, deleteMenu, getMenuForm, listMenuOptions, listMenus, updateMenu,} from "@/api/menu";

import {MenuTypeEnum} from "@/enums/MenuTypeEnum";

import SvgIcon from "@/components/SvgIcon/index.vue";
import IconSelect from "@/components/IconSelect/index.vue";

const queryFormRef = ref(ElForm);
const menuFormRef = ref(ElForm);

const loading = ref(false);
const dialog = reactive<DialogOption>({
	visible: false,
});

const queryParams = reactive<MenuQuery>({});
const menuList = ref<MenuVO[]>([]);

const menuOptions = ref<OptionType[]>([]);

const formData = reactive<MenuForm>({
	menuParentId: 0,
	menuVisible: 1,
	menuSort: 1,
	menuType: MenuTypeEnum.MENU,
});

const rules = reactive({
	menuParentId: [{required: true, message: "请选择顶级菜单", trigger: "blur"}],
	menuName: [{required: true, message: "请输入菜单名称", trigger: "blur"}],
	menuType: [{required: true, message: "请选择菜单类型", trigger: "blur"}],
	menuPath: [{required: true, message: "请输入路由路径", trigger: "blur"}],
	menuComponent: [
		{required: true, message: "请输入组件完整路径", trigger: "blur"},
	],
});

// 选择表格的行菜单ID
const selectedRowMenuId = ref<number | undefined>();

const menuCacheData = reactive({
	type: "",
	path: "",
});

const extendTree = [0, 1];
/**
 * 查询
 */
function handleQuery() {
	// 重置父组件
	loading.value = true;
	listMenus(queryParams)
			.then(({data}) => {
				menuList.value = data;
			})
			.then(() => {
        loading.value = false;
        if (menuList.value.length >= 1) {
          extendTree.push(menuList.value[0].menuId as number);
        }
      });
}

/**
 * 查询重置
 */
function resetQuery() {
	queryFormRef.value.resetFields();
	handleQuery();
}

/**
 * 行点击事件
 *
 * @param row
 */
function onRowClick(row: MenuVO) {
	selectedRowMenuId.value = row.menuId;
}

/**
 * 打开表单弹窗
 *
 * @param parentId 父菜单ID
 * @param menuId 菜单ID
 */
function openDialog(parentId?: number, menuId?: number) {
	listMenuOptions()
			.then(({data}) => {
				menuOptions.value = [{value: 0, label: "顶级菜单", children: data}];
			})
			.then(() => {
				dialog.visible = true;
				if (menuId) {
					dialog.title = "编辑菜单";
					getMenuForm(menuId).then(({data}) => {
						Object.assign(formData, data);
						menuCacheData.type = data.menuType;
						menuCacheData.path = data.menuPath ?? "";
					});
				} else {
					dialog.title = "新增菜单";
					formData.menuParentId = parentId;
				}
			});
}

/**
 * 菜单类型 change
 */
function onMenuTypeChange() {
	// 如果菜单类型改变，清空路由路径；未改变在切换后还原路由路径
	if (formData.menuType !== menuCacheData.type) {
		formData.menuPath = "";
	} else {
		formData.menuPath = menuCacheData.path;
	}
}

/**
 * 菜单提交
 */
function submitForm() {
	menuFormRef.value.validate((isValid: boolean) => {
		if (isValid) {
			const menuId = formData.menuId;
			if (menuId) {
				updateMenu(menuId, formData).then(() => {
					ElMessage.success("修改成功");
					closeDialog();
					handleQuery();
				});
			} else {
				addMenu(formData).then(() => {
					ElMessage.success("新增成功");
					closeDialog();
					handleQuery();
				});
			}
		}
	});
}

/**
 * 删除菜单
 */
function handleDelete(menuId: number, menuName: string) {
	if (!menuId) {
		ElMessage.warning("请勾选删除项");
		return false;
	}

	ElMessageBox.confirm("确认删除【"+ menuName +"】已选中的数据项?", "警告", {
		confirmButtonText: "确定",
		cancelButtonText: "取消",
		type: "warning",
	})
			.then(() => {
				deleteMenu(menuId).then(() => {
					ElMessage.success("删除成功");
					handleQuery();
				});
			})
			.catch(() => ElMessage.info("已取消删除"));
}

/**
 * 关闭弹窗
 */
function closeDialog() {
	dialog.visible = false;
	resetForm();
}

/**
 * 重置表单
 */
function resetForm() {
	menuFormRef.value.resetFields();
	menuFormRef.value.clearValidate();

	formData.menuId = undefined;
	formData.menuParentId = 0;
	formData.menuVisible = 1;
	formData.menuSort = 1;
	formData.menuPerm = undefined;
}

onMounted(() => {
	handleQuery();
});
</script>

<template>
	<div class="app-container">
		<div class="search">
			<el-form ref="queryFormRef" :model="queryParams" :inline="true">
				<el-form-item label="关键字" prop="keywords">
					<el-input
							v-model="queryParams.keywords"
							placeholder="菜单名称"
							clearable
							@keyup.enter="handleQuery"
					/>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="handleQuery"
					>
						<template #icon>
							<i-ep-search/>
						</template>

          </el-button
					>
					<el-button @click="resetQuery">
						<template #icon>
							<i-ep-refresh/>
						</template>

          </el-button
					>
				</el-form-item>
			</el-form>
		</div>

		<el-card shadow="never" size="small">
			<template #header>
				<el-button
						v-hasPerm="['sys:menu:add']"
						type="success"
						@click="openDialog(0)"
				>
					<template #icon>
						<i-ep-plus/>
					</template>

        </el-button
				>
			</template>

			<el-table
          v-loading="loading"
          :data="menuList"
          highlight-current-row
          :tree-props="{
          children: 'children',
          hasChildren: 'hasChildren',
        }"
          row-key="menuId"
          border
          size="small"
          :expand-row-keys="extendTree"
          @row-click="onRowClick"
			>
				<el-table-column label="菜单名称" min-width="200">
					<template #default="scope">
						<svg-icon
								:icon-class="
                scope.row.menuType === MenuTypeEnum.BUTTON
                  ? 'button'
                  : scope.row.menuIcon
              "
						/>
						{{ scope.row.menuName }}
					</template>
				</el-table-column>

				<el-table-column label="类型" align="center" width="80">
					<template #default="scope">
						<el-tag
								v-if="scope.row.menuType === MenuTypeEnum.CATALOG"
								type="warning"
						>目录
						</el-tag
						>
            <el-tag v-if="scope.row.menuType === MenuTypeEnum.MENU" type="success"
            >菜单
            </el-tag
            >
            <el-tag v-if="scope.row.menuType === MenuTypeEnum.BUTTON" type="danger"
            >按钮
            </el-tag
            >
            <el-tag v-if="scope.row.menuType === MenuTypeEnum.EXTLINK" type="info"
            >外链
            </el-tag>

            <el-tag v-if="scope.row.menuType === MenuTypeEnum.FRAME" type="info"
            >frame
            </el-tag
            >
          </template>
				</el-table-column>
				<el-table-column
				label="路由路径"
				align="left"
				width="150"
				prop="menuPath"
				show-overflow-tooltip
				/>

				<el-table-column
						label="组件路径"
						align="left"
						width="250"
						prop="menuComponent"
				/>

				<el-table-column
						label="权限标识"
						align="center"
						width="200"
						prop="menuPerm"
				/>

				<el-table-column label="状态" align="center" width="80">
					<template #default="scope">
						<el-tag v-if="scope.row.menuVisible === 1" type="success">显示</el-tag>
						<el-tag v-else type="info">隐藏</el-tag>
					</template>
				</el-table-column>

				<el-table-column label="排序" align="center" width="80" prop="menuSort"/>

				<el-table-column fixed="right" align="center" label="操作" width="220">
					<template #default="scope">
						<el-button
								v-if="scope.row.menuType == 'CATALOG' || scope.row.menuType == 'MENU'"
								v-hasPerm="['sys:menu:add']"
								type="primary"
								link
								size="small"
								@click.stop="openDialog(scope.row.menuId)"
						>
							<i-ep-plus/>
							新增
						</el-button>

						<el-button
								v-hasPerm="['sys:menu:edit']"
								type="primary"
								link
								size="small"
								@click.stop="openDialog(undefined, scope.row.menuId)"
						>
							<i-ep-edit/>
							编辑
						</el-button>
						<el-button
								v-hasPerm="['sys:menu:delete']"
								type="primary"
								link
								size="small"
								@click.stop="handleDelete(scope.row.menuId, scope.row.menuName)"
						>
							<i-ep-delete/>
							删除
						</el-button>
					</template>
				</el-table-column>
			</el-table>
		</el-card>

		<el-dialog
				v-model="dialog.visible"
				:title="dialog.title"
				destroy-on-close
				append-to-body
				width="750px"
				@close="closeDialog"
		>
			<el-form
					ref="menuFormRef"
					:model="formData"
					:rules="rules"
					label-width="100px"
			>
				<el-form-item label="父级菜单" prop="menuParentId">
					<el-tree-select
							v-model="formData.menuParentId"
							placeholder="选择上级菜单"
							:data="menuOptions"
							filterable
							check-strictly
							:render-after-expand="false"
					/>
				</el-form-item>

				<el-form-item label="菜单名称" prop="menuName">
					<el-input v-model="formData.menuName" placeholder="请输入菜单名称"/>
				</el-form-item>

				<el-form-item label="菜单类型" prop="menuType">
					<el-radio-group v-model="formData.menuType" @change="onMenuTypeChange">
						<el-radio label="CATALOG">目录</el-radio>
						<el-radio label="MENU">菜单</el-radio>
						<el-radio label="BUTTON">按钮</el-radio>
						<el-radio label="EXTLINK">外链</el-radio>
            <el-radio label="FRAME">frame</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item
            v-if="formData.menuType == 'EXTLINK'"
            label="外链地址"
            prop="path"
        >
          <el-input v-model="formData.menuPath" placeholder="请输入外链完整路径"/>
        </el-form-item>

        <el-form-item
            v-if="formData.menuType == 'FRAME'"
            label="外链地址"
            prop="path"
        >
          <el-input v-model="formData.menuPath" placeholder="请输入外链完整路径"/>
        </el-form-item>

        <el-form-item
            v-if="
            formData.menuType == MenuTypeEnum.CATALOG ||
            formData.menuType == MenuTypeEnum.MENU
          "
            label="路由路径"
            prop="menuPath"
        >
          <el-input
							v-if="formData.menuType == MenuTypeEnum.CATALOG"
							v-model="formData.menuPath"
							placeholder="system"
					/>
					<el-input v-else v-model="formData.menuPath" placeholder="user"/>
				</el-form-item>

				<!-- 组件页面完整路径 -->
				<el-form-item
						v-if="formData.menuType == MenuTypeEnum.MENU"
						label="页面路径"
						prop="component"
				>
					<el-input
							v-model="formData.menuComponent"
							placeholder="system/user/index"
							style="width: 95%"
					>
						<template v-if="formData.menuType == MenuTypeEnum.MENU" #prepend
						>src/views/
						</template
						>
						<template v-if="formData.menuType == MenuTypeEnum.MENU" #append
						>.vue
						</template
						>
					</el-input>
				</el-form-item>

				<!-- 权限标识 -->
				<el-form-item
						v-if="formData.menuType == 'BUTTON'"
						label="权限标识"
						prop="menuPerm"
				>
					<el-input v-model="formData.menuPerm" placeholder="sys:user:add"/>
				</el-form-item>

				<el-form-item
						v-if="formData.menuType !== 'BUTTON'"
						label="图标"
						prop="icon"
				>
					<!-- 图标选择器 -->
					<icon-select v-model="formData.menuIcon"/>
				</el-form-item>

				<el-form-item
						v-if="formData.menuType == MenuTypeEnum.CATALOG"
						label="跳转路由"
				>
					<el-input v-model="formData.menuRedirect" placeholder="跳转路由"/>
				</el-form-item>

				<el-form-item v-if="formData.menuType !== 'BUTTON'" label="状态">
					<el-radio-group v-model="formData.menuVisible">
						<el-radio :label="1">显示</el-radio>
						<el-radio :label="0">隐藏</el-radio>
					</el-radio-group>
				</el-form-item>

				<el-form-item label="排序" prop="menuSort">
					<el-input-number
							v-model="formData.menuSort"
							style="width: 100px"
							controls-position="right"
							:min="0"
					/>
				</el-form-item>
			</el-form>

			<template #footer>
				<div class="dialog-footer">
					<el-button type="primary" @click="submitForm">确 定</el-button>
					<el-button @click="closeDialog">取 消</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>
