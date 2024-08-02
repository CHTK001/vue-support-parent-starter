<template>
    <el-dialog v-model="visiable" top="20px" width="70%" :title="title" @close="close" :close-on-click-modal="false" :destroy-on-close="true" draggable>
        <el-skeleton :loading="loading" :count="6"></el-skeleton>
        <div v-if="!loading">
            <div>
                <el-button v-if="mode != 'view' && !updating" icon="el-icon-plus" type="primary" size="default" @click="addColumn"></el-button>
                <el-button v-if="mode != 'view' && !updating" icon="sc-icon-save" type="primary" size="default" @click="updateTable"></el-button>
                
            </div>
            <el-table :data="this.columns" border stripe :height="600">
                <el-table-column type="index" label="序号" width="50px"></el-table-column>
                <el-table-column  label="字段"  show-overflow-tooltip>
                    <template #default="{row}">
                        <el-row>
                            <el-col :span="5">
                                <el-icon icon="el-icon-key" v-if="mode == 'view' && row.pk" style="color: orange; ">
                                    <component is="el-icon-key" />
                                </el-icon>
                                <el-button icon="el-icon-key" v-if="mode !== 'view' && row.pk" style="color: orange; ">
                                </el-button>
                            </el-col>
                            <el-col :span="19">
                                <span v-if="mode == 'view'">{{ row.name }} </span>
                                <el-input v-else v-model="row.name" ></el-input>
                            </el-col>
                        </el-row>
                    </template>
                </el-table-column>
                <el-table-column  label="类型">
                    <template #default="{row}">
                        <span v-if="mode == 'view'">
                            {{ row?.jdbcType }}
                        </span>
                        <el-select v-else v-model="row.jdbcType" >
                            <el-option v-for="(item, index) in jdbcType[form.genJdbcType]" :key="index" :label="index" :value="index">
                                <span>{{ index }}</span>
                                <span class="el-form-item-msg" style="margin-left: 2px;">{{ item }}</span>
                            </el-option>
                        </el-select>
                        
                    </template>
                </el-table-column>
                <el-table-column  label="长度">
                    <template #default="{row}">
                        <span v-if="mode == 'view'">
                            {{ row?.length }}
                        </span>
                        <el-input v-else v-model="row.length" type="number"></el-input>
                    </template>
                </el-table-column>
                <el-table-column  label="精度">
                    <template #default="{row}">
                        <span v-if="mode == 'view'">
                            {{ row.precision }}
                        </span>
                        <el-input v-else v-model="row.precision" type="number"></el-input>
                    </template>
                </el-table-column>
                <el-table-column  label="不可为空" width="80px">
                    <template #default="{row}">
                        <span v-if="mode == 'view'">
                            {{ row?.nullable && row.nullable == true ? '是' : '否' }}
                        </span>
                        <el-switch v-else v-model="row.nullable" :active-value="false" :inactive-value="true"></el-switch>
                    </template>
                </el-table-column>
                <el-table-column  label="描述" show-overflow-tooltip>
                    <template #default="{row}">
                        <span v-if="mode == 'view'">
                            {{ row.comment }}
                        </span>
                        <el-input v-else v-model="row.comment" type="textarea"></el-input>
                    </template>
                </el-table-column>
                <el-table-column  label="操作" show-overflow-tooltip v-if="mode != 'view'">
                    <template #default="{row, $index}">
                        <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteColumn($index)"></el-button>
                    </template>
                </el-table-column>
            </el-table>
            
        </div>
    </el-dialog>
</template>
<script>
export default {

    data(){
        return {
            form: {},
            currentTable: null,
            mode: 'edit',
            updating: false,
            visiable: false,
            loading: false,
            jdbcType: {
                MYSQL: {
                    'VARCHAR': '字符串',
                    'CHAR': '字符串',
                    'INT': '整数',
                    'BIGINT': '整数',
                    'TINYINT': '整数',
                    'SMALLINT': '整数',
                    'MEDIUMINT': '整数',
                    'FLOAT': '浮点数',
                    'DOUBLE': '浮点数',
                    'DECIMAL': '浮点数',
                    'DATE': '日期',
                    'TIME': '时间',
                    'DATETIME': '日期时间',
                    'TIMESTAMP': '日期时间',
                    'YEAR': '年',
                    'BIT': '布尔',
                    'BLOB': '二进制',
                    'TEXT': '文本',
                    'LONGTEXT': '文本',
                    'TINYTEXT': '文本',
                    'MEDIUMTEXT': '文本',
                    'LONGTEXT': '文本',
                    'ENUM': '枚举',
                    'SET': '集合',
                    'JSON': 'JSON',
                    'GEOMETRY': '几何',
                    'POINT': '点',
                    'LINESTRING': '线',
                    'POLYGON': '多边形',
                    'MULTIPOINT': '多点',
                    'MULTILINESTRING': '多线',
                    'MULTIPOLYGON': '多边形',
                    'GEOMETRYCOLLECTION': '几何集合',
                    'CLOB': '文本',
                    'BOOLEAN': '布尔',
                    'BINARY': '二进制',
                    'VARBINARY': '二进制',
                    'TINYBLOB': '二进制',
                    'MEDIUMBLOB': '二进制',
                    'LONGBLOB': '二进制',
                    'BLOB': '二进制',
                }
            }
        }
    },
    methods: {
        updateTable(){
            this.updating = true;
            this.currentTable.children = this.columns;
            this.currentTable.genId = this.form.genId;
            this.$API.gen.database.updateTable.put(this.currentTable).then(res => {
                if (res.code === '00000') {
                    this.$message.success('保存成功');
                } else {
                    this.$message.error(res.msg);
                }
            }).finally(() => {
                this.updating = false;
            })
        },
        addColumn(){
            this.columns.push({
                name: '',
                javaType: {
                    jdbcType: 'VARCHAR'
                },
                length: 255,
                precision: 0,
                nullable: false,
                comment: ''
            })
        },
        deleteColumn(index) {
            this.columns.splice(index, 1);
        },
        setData(form, currentTable) {
            Object.assign(this.form, form);
            this.currentTable = currentTable;
            this.columns = this.currentTable?.children;
            return this;
        },
        open(mode = 'edit') {
            this.mode = mode;
            this.title = (mode == 'edit' ? '修改' : '新增') + ' - ' +this.currentTable?.name + (!this.currentTable?.comment ? '' : '('+ this.currentTable?.comment +')');
            this.visiable = true;
            this.loading = false;
        },
        close() {
            this.visiable = false;
            this.loading = false;
            this.$emit('closed');
            this.$nextTick(() => {
                this.form = {};
                this.currentTable = null;
            })
        }
    }

}
</script>