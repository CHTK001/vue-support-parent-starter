<template>
    <el-skeleton :rows="5" :animated="true" :loading="codeLoading">
        <el-tabs v-model="activeName" class="demo-tabs" >
            <el-tab-pane label="基本信息" name="first">
                <el-empty v-if="editData == null"></el-empty>
                <el-form v-else :model="editData" label-width="120px">
                    <el-row :gutter="10">
                        <el-col :span="12">
                            <el-form-item label="表名称">
                                <el-input readonly disabled v-model="editData.tabName" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="实体类名称">
                                <el-input v-model="editData.tabClassName" />
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="10">
                        <el-col :span="12">
                            <el-form-item label="表描述">
                                <el-input v-model="editData.tabDesc" />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                        </el-col>
                    </el-row>
                    <el-row :gutter="10">
                        <el-col :span="24">
                            <el-form-item label="备注">
                                <el-input v-model="editData.tabRemark" type="textarea" :rows="5"/>
                            </el-form-item>
                        </el-col>
                    </el-row>
                    <el-row :gutter="10">
                        <el-col :span="24" style="text-align:-webkit-center">
                            <el-form-item style="width: max-content">
                                <el-button type="primary" @click="saveFirst" :loading="saveLoading">保存</el-button>
                                <el-button @click="callback">返回</el-button>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </el-tab-pane>
            <el-tab-pane label="字段信息" name="second">
                <el-empty v-if="editData == null"></el-empty>
                <el-form v-else label-width="100px">
                    <el-form-item prop="list">
                        <sc-form-table ref="table" v-model="tabColumns" :addTemplate="addTemplate" :height="550" placeholder="暂无数据">
                            <el-table-column fixed  prop="colColumnName" label="字段名称" width="180">
                                <template #default="scope">
                                    <el-input v-model="scope.row.colColumnName" ></el-input>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colColumnComment" label="字段描述" min-width="10%">
                                <template #default="scope">
                                    <el-input v-model="scope.row.colColumnComment" ></el-input>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colColumnType" label="字段类型" min-width="10%">
                                <template #default="scope">
                                    <el-select v-model="scope.row.colColumnType" placeholder="请选择" :filterable="true" :allow-create="true">
                                        <el-option v-for="item in typeDic" :key="item.value" :label="item.label" :value="item.value"></el-option>
                                    </el-select>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colColumnLength" label="字段长度" min-width="10%">
                                <template #default="scope">
                                    <el-input v-model="scope.row.colColumnLength" type="number"></el-input>
                                </template>
                            </el-table-column>
                            
                            <el-table-column prop="colColumnDecimal" label="小数点" min-width="5%">
                                <template #default="scope">
                                    <el-input v-model="scope.row.colColumnDecimal" type="number"></el-input>
                                </template>
                            </el-table-column>

                            
                            <el-table-column prop="colJavaType" label="Java类型" min-width="11%">
                                <template #default="scope">
                                    <el-select v-model="scope.row.colJavaType" placeholder="请选择">
                                        <el-option label="Long" value="Long" />
                                        <el-option label="String" value="String" />
                                        <el-option label="Integer" value="Integer" />
                                        <el-option label="Double" value="Double" />
                                        <el-option label="BigDecimal" value="BigDecimal" />
                                        <el-option label="Date" value="Date" />
                                        <el-option label="Boolean" value="Boolean" />
                                    </el-select>
                                </template>
                            </el-table-column>
                            <el-table-column prop="colJavaField" label="Java属性" min-width="10%">
                                <template #default="scope">
                                    <el-input v-model="scope.row.colJavaField" ></el-input>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colIsInsert" label="插入" min-width="5%" align="center">
                                <template #default="scope">
                                    <el-checkbox v-model="scope.row.colIsInsert" true-label="1"></el-checkbox>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colIsEdit" label="编辑" min-width="5%" align="center">
                                <template #default="scope">
                                    <el-checkbox v-model="scope.row.colIsEdit" true-label="1"></el-checkbox>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colIsList" label="列表" min-width="5%" align="center">
                                <template #default="scope">
                                    <el-checkbox v-model="scope.row.colIsList" true-label="1"></el-checkbox>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colIsQuery" label="查询" min-width="5%" align="center">
                                <template #default="scope">
                                    <el-checkbox v-model="scope.row.colIsQuery" true-label="1"></el-checkbox>
                                </template>
                            </el-table-column>

                            <el-table-column prop="colQueryType" label="查询方式" min-width="10%">
                                <template #default="scope">
                                    <el-select v-model="scope.row.colQueryType" placeholder="请选择">
                                        <el-option label="=" value="EQ" />
                                        <el-option label="!=" value="NE" />
                                        <el-option label=">" value="GT" />
                                        <el-option label=">=" value="GE" />
                                        <el-option label="<" value="LT" />
                                        <el-option label="<=" value="LE" />
                                        <el-option label="LIKE" value="LIKE" />
                                        <el-option label="BETWEEN" value="BETWEEN" />
                                    </el-select>
                                </template>
                            </el-table-column>

                            <el-table-column label="必填" min-width="5%">
                                <template #default="scope">
                                <el-checkbox v-model="scope.row.colIsRequired" false-label="0" true-label="1"></el-checkbox>
                                </template>
                            </el-table-column>
                          
                            <el-table-column label="显示类型" min-width="12%">
                                <template  #default="scope">
                                    <el-select v-model="scope.row.colHtmlType">
                                        <el-option label="文本框" value="input" />
                                        <el-option label="文本域" value="textarea" />
                                        <el-option label="下拉框" value="select" />
                                        <el-option label="单选框" value="radio" />
                                        <el-option label="复选框" value="checkbox" />
                                        <el-option label="日期控件" value="datetime" />
                                        <el-option label="图片上传" value="imageUpload" />
                                        <el-option label="文件上传" value="fileUpload" />
                                        <el-option label="富文本控件" value="editor" />
                                    </el-select>
                                </template>
                            </el-table-column>
                        </sc-form-table>
                    </el-form-item>
                    <el-row :gutter="10">
                        <el-col :span="24" style="text-align:-webkit-center">
                            <el-form-item style="width: max-content">
                                <el-button type="primary" @click="saveSecond" :loading="saveLoading">保存</el-button>
                                <el-button @click="callback">返回</el-button>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </el-tab-pane>
            <!-- <el-tab-pane label="生成信息" name="third">
                <el-empty v-if="editData == null"></el-empty>

            </el-tab-pane> -->
    </el-tabs>
    </el-skeleton>
</template>
<script>
export default {
    name: 'consoleEdit',
    data() {
        return {
            typeDic: [
                {value: "BITINT", label: "BITINT"},
                {value: "BINARY", label: "BINARY"},
                {value: "BIT", label: "BIT"},
                {value: "BLOB", label: "BLOB"},
                {value: "CHAR", label: "CHAR"},
                {value: "DATE", label: "DATE"},
                {value: "DATETIME", label: "DATETIME"},
                {value: "DECIMAL", label: "DECIMAL"},
                {value: "DOUBLE", label: "DOUBLE"},
                {value: "ENUM", label: "ENUM"},
                {value: "FLOAT", label: "FLOAT"},
                {value: "GEOMETRY", label: "GEOMETRY"},
                {value: "GEOMETRYCOLLECTION", label: "GEOMETRYCOLLECTION"},
                {value: "INT", label: "INT"},
                {value: "INTEGER", label: "INTEGER"},
                {value: "JSON", label: "JSON"},
                {value: "LONGBLOB", label: "LONGBLOB"},
                {value: "LONGTEXT", label: "LONGTEXT"},
                {value: "POINT", label: "POINT"},
                {value: "POLYGON", label: "POLYGON"},
                {value: "TEXT", label: "TEXT"},
                {value: "TIME", label: "TIME"},
                {value: "TIMESTAMP", label: "TIMESTAMP"},
                {value: "VARCHAR", label: "VARCHAR"},
                {value: "YEAR", label: "YEAR"},
            ],
             // 表格的高度
            tableHeight: document.documentElement.scrollHeight - 245 + 'px',
            addTemplate: {
                colId: '',
                colColumnComment: '',
                colColumnName: '',
                colColumnType: 'VARCHAR',
                colColumnLength: 255,
                colJavaField: '',
                colJavaType: 'String',
                colQueryType: 'EQ',
                colIsRequired: '0',
                colIsList: '1',
                colIsQuery: '1',
                colIsInsert: '1',
                colIsEdit: '1',
                colHtmlType: 'input',
            },
            editData: null,
            activeName: 'first',
            saveLoading: 0,
            codeLoading: 0,
            form: {},
            tabColumns: []
        }
    },
    watch:{
        activeName: {
            deep: !0,
            immediate: !0,
            handler(nv, ov) {
                if(ov) {
                    this.$TOOL.session.set('tabClicked', nv);
                }
            }
        },
    },
    mounted(){
        this.activeName = this.$TOOL.session.get('tabClicked');
        this.form.tabId = this.$route.params.tabId;
        this.addTemplate.tabId =  this.form.tabId;
        this.form.genId = this.$route.params.genId;
        if(!this.form.tabId || this.form.tabId === 'null') {
            delete  this.form.tabId;
        }
        if(!this.form.genId || this.form.genId === 'null') {
            delete  this.form.genId;
        }
        this.initial();
    },
    methods: {
        saveFirst(){
            this.saveLoading = true;
            this.$API.gen.table.update.put(this.editData).then(res => {
                if (res.code === '00000') {
                    this.$message.success("保存成功")
                    return;
                }

                this.$message.error(res.msg);
            }).finally(() => this.saveLoading = false)
        },
        saveSecond(){
            this.saveLoading = true;
            this.$API.gen.column.update.put({
                tabId: this.editData.tabId,
                columns: this.tabColumns
            }).then(res => {
                if (res.code === '00000') {
                    this.$message.success("保存成功")
                    return;
                }

                this.$message.error(res.msg);
            }).finally(() => this.saveLoading = false)
        },
        callback(){
            this.$router.push({ path: '/console/' +  this.form.genId});
        },
        initial() {
            this.$API.gen.column.info.get(this.form).then(res => {
                if (res.code === '00000') {
                    this.tabColumns = res.data;
                    return;
                }

                this.$message.error(res.msg);
            }).finally(() => this.codeLoading = false)
            this.$API.gen.table.info.get(this.form).then(res => {
                if (res.code === '00000') {
                    this.editData = res.data;
                    return;
                }

                this.$message.error(res.msg);
            }).finally(() => this.codeLoading = false)
        }
    }

}
</script>