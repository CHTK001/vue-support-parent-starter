<!-- 字典数据 -->
<script setup lang="ts">
defineOptions({
	name: "DictData",
	inheritAttrs: false,
});

import {addDict, deleteDict, getDictFormData, getDictPage, updateDict,} from "@/api/dict";
import {DictForm, DictPageVO, DictQuery} from "@/api/dict/types";

const props = defineProps({
	typeCode: {
		type: String,
		default: () => {
			return "";
		},
	},
	typeName: {
		type: String,
		default: () => {
			return "";
		},
	},
});

watch(
		() => props.typeCode,
		(newVal: string) => {
			queryParams.dictTypeCode = newVal;
			resetQuery();
		}
);

const queryFormRef = ref(ElForm);
const dataFormRef = ref(ElForm);

const loading = ref(false);
const ids = ref<number[]>([]);
const total = ref(0);

const queryParams = reactive<DictQuery>({
	pageNum: 1,
	pageSize: 10,
	keywords: undefined,
	dictTypeCode: props.typeCode,
});

const dictList = ref<DictPageVO[]>();

const dialog = reactive<DialogOption>({
	visible: false,
});

const formData = reactive<DictForm>({
	dictStatus: 1,
	dictTypeCode: props.typeCode,
	dictSort: 1,
});

const rules = reactive({
	dictName: [{required: true, message: "请输入字典名称", trigger: "blur"}],
	dictValue: [{required: true, message: "请输入字典值", trigger: "blur"}],
});

/**
 * 查询
 */
function handleQuery() {
	if (queryParams.dictTypeCode) {
		loading.value = true;
		getDictPage(queryParams)
				.then(({data}) => {
					dictList.value = data.list;
					total.value = data.total;
				})
				.finally(() => (loading.value = false));
	}
}

/**
 * 重置查询
 */
function resetQuery() {
	queryFormRef.value.resetFields();
	queryParams.keywords = undefined;
	queryParams.pageNum = 1;
	handleQuery();
}

/**
 * 行checkbox change事件
 *
 * @param selection
 */
function handleSelectionChange(selection: any) {
	ids.value = selection.map((item: any) => item.id);
}

/**
 * 打开字典表单弹窗
 *
 * @param dictId 字典ID
 */
function openDialog(dictId?: number) {
	dialog.visible = true;
	if (dictId) {
		dialog.title = "修改字典";
		getDictFormData(dictId).then(({data}) => {
			Object.assign(formData, data);
		});
	} else {
		dialog.title = "新增字典";
	}
}

/**
 * 字典表单提交
 */
function handleSubmit() {
	loading.value = false;
	dataFormRef.value.validate((isValid: boolean) => {
		if (isValid) {
			const dictId = formData.dictId;
			if (dictId) {
				updateDict(dictId, formData)
						.then(() => {
							ElMessage.success("修改成功");
							closeDialog();
							resetQuery();
						})
						.finally(() => (loading.value = false));
			} else {
				addDict(formData)
						.then(() => {
							ElMessage.success("新增成功");
							closeDialog();
							resetQuery();
						})
						.finally(() => (loading.value = false));
			}
		}
	});
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
	dataFormRef.value.resetFields();
	dataFormRef.value.clearValidate();

	formData.dictId = undefined;
	formData.dictStatus = 1;
	formData.dictSort = 1;
	formData.dictTypeCode = props.typeCode;
}

/**
 * 删除字典
 */
function handleDelete(dictId?: number) {
	const dictIds = [dictId || ids.value].join(",");
	if (!dictIds) {
		ElMessage.warning("请勾选删除项");
		return;
	}

	ElMessageBox.confirm("确认删除已选中的数据项?", "警告", {
		confirmButtonText: "确定",
		cancelButtonText: "取消",
		type: "warning",
	}).then(() => {
		deleteDict(dictIds).then(() => {
			ElMessage.success("删除成功");
			resetQuery();
		});
	});
}

onMounted(() => {
	handleQuery();
});
</script>

<template>
	<div class="app-container">
		<div class="search">
			<!-- 搜索表单 -->
			<el-form ref="queryFormRef" :model="queryParams" :inline="true">
				<el-form-item label="关键字" prop="name">
					<el-input
							v-model="queryParams.keywords"
							placeholder="字典名称"
							clearable
					/>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="handleQuery"
					>
						<i-ep-search/>
					</el-button
					>
					<el-button @click="resetQuery">
						<i-ep-refresh/>

          </el-button>
				</el-form-item>
			</el-form>
		</div>
		<el-card shadow="never">
			<template #header>
				<el-button
						v-hasPerm="['sys:dict:add']"
						type="success"
						@click="openDialog()"
				>
					<i-ep-plus/>

        </el-button
				>
				<el-button
						v-hasPerm="['sys:dict:delete']"
						type="danger"
						:disabled="ids.length === 0"
						@click="handleDelete()"
				>
					<i-ep-delete/>

        </el-button
				>
			</template>

			<!-- 数据表格 -->
			<el-table
					v-loading="loading"
					:data="dictList"
					border
					@selection-change="handleSelectionChange"
			>
				<el-table-column type="selection" width="50"/>
				<el-table-column label="字典名称" prop="dictName"/>
				<el-table-column label="字典值" prop="dictValue"/>
				<el-table-column label="状态" align="center">
					<template #default="scope">
						<el-tag v-if="scope.row.dictStatus === 1" type="success">启用</el-tag>
						<el-tag v-else type="info">禁用</el-tag>
					</template>
				</el-table-column>
				<el-table-column fixed="right" label="操作" align="center">
					<template #default="scope">
						<el-button
								v-hasPerm="['sys:dict:edit']"
								type="primary"
								link
								@click="openDialog(scope.row.dictId)"
						>
							<i-ep-edit/>
							编辑
						</el-button
						>
						<el-button
								v-hasPerm="['sys:dict:delete']"
								type="primary"
								link
								@click.stop="handleDelete(scope.row.dictId)"
						>
							<i-ep-delete/>
							删除
						</el-button
						>
					</template>
				</el-table-column>
			</el-table>

			<pagination
          v-if="total > 0"
          layout="->, prev, pager, next, jumper, ->, total"
          v-model:total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="handleQuery"
      />
		</el-card>

		<!-- 表单弹窗 -->
		<el-dialog
				v-model="dialog.visible"
				:title="dialog.title"
				width="500px"
				@close="closeDialog"
		>
			<el-form
					ref="dataFormRef"
					:model="formData"
					:rules="rules"
					label-width="100px"
			>
				<el-form-item label="字典名称">
					<el-tag>{{ typeName }}</el-tag>
				</el-form-item>
				<el-form-item label="字典名称" prop="dictName">
					<el-input v-model="formData.dictName" placeholder="请输入字典名称"/>
				</el-form-item>
				<el-form-item label="字典值" prop="dictValue">
					<el-input v-model="formData.dictValue" placeholder="字典值"/>
				</el-form-item>
				<el-form-item label="排序" prop="dictSort">
					<el-input-number
							v-model="formData.dictSort"
							controls-position="right"
							:min="0"
					/>
				</el-form-item>
				<el-form-item label="状态" prop="dictStatus">
					<el-radio-group v-model="formData.dictStatus">
						<el-radio :label="1">正常</el-radio>
						<el-radio :label="0">停用</el-radio>
					</el-radio-group>
				</el-form-item>
				<el-form-item label="备注" prop="dictRemark">
					<el-input v-model="formData.dictRemark" type="textarea"></el-input>
				</el-form-item>
			</el-form>
			<template #footer>
				<div class="dialog-footer">
					<el-button type="primary" @click="handleSubmit">确 定</el-button>
					<el-button @click="closeDialog">取 消</el-button>
				</div>
			</template>
		</el-dialog>
	</div>
</template>
