<template>
    <div class="container">
            <el-container style="height: 100%">
                <el-container>
                    <el-header>
                        <div class="right-panel">
                            <span>
                                <el-icon style="margin-right: 10px; cursor: pointer;" title="首页" @click="goHome"><component is="el-icon-home-filled"></component></el-icon>
                                <el-icon style="margin-right: 10px; cursor: pointer;" title="返回" @click="goBack"><component is="el-icon-arrow-left"></component></el-icon>
                                <span>当前目录: {{ form.databaseId }}</span>
                            </span>
                        </div>
                        <el-button plain text :loading="loading" icon="el-icon-refresh" @click="doRefreshDatabase">刷新</el-button>
                    </el-header>
                    <el-main class="nopadding">
                        <el-skeleton :loading="loading" animated>

                            <div class="oss-card" style="overflow: hidden;">
                                <el-row :gutter="8" >
                                    <el-col  :span="2" :body-style="{ padding: '0px !important' }" v-for="item in returnResult" :key="item.id" class="demo-progress">
                                        <el-card  style="height: 150px" shadow="always" :title="item.label" class="content-card" @click.right.native="rightclickOpenTable(item, null)">
                                            <div class="content">
                                                <div @click="onClick(item)" style="margin-left: 14px; cursor: pointer;" v-if="item.type === 'DIRECTORY' || item.type === 'FOLDER'">
                                                    <el-image :src="getImg('folder')" fit="cover" class="image image2" />
                                                </div>
                                                <div  @click="onClick(item)"  v-else-if="item.subType !== 'image'" style="margin-left: 14px; cursor: pointer;">
                                                    <el-image :src="getImg(item.type)"  fit="cover" class="image image2" />
                                                </div>
                                                <div  @click="onClick(item)" v-else-if="item.subType === 'image'" style="margin-left: 0px;  cursor: pointer;" >
                                                    <el-image :src="getImgUrl(item)"  style="height: 90px;" fit="cover" class="image image2" />
                                                </div>
                                                <div class="ext" style="margin-top: 10px;">
                                                    <p style="text-align: center; cursor: default;" class="ext-text">{{ item.label }}</p>
                                                    <p style="text-align: center;  cursor: default;margin-top: 5px" v-time="item.time"></p>
                                                </div>
                                            </div>
                                            <div style="position: absolute; top: 0px; right: 0px">
                                                <el-tag style="text-align: center; cursor: default;">{{ item.remark }}</el-tag>
                                            </div>
                                        </el-card>
                                    </el-col>
                                    <el-col :span="2">
                                        <el-card style="min-height: 150px" shadow="always" >
                                            <el-skeleton :animated="true" :loading="isSave">
                                                <el-upload :auto-upload="false" style="height: 100%; width: 100%;" drag :on-change="changeHandler">
                                                    <el-icon class="el-icon-plus" >
                                                        <component is="el-icon-plus"/>
                                                    </el-icon>
                                                </el-upload>
                                            </el-skeleton>
                                        </el-card>
                                    </el-col>
                                </el-row>
                            </div>
                        </el-skeleton>
                    </el-main>
                </el-container>
            </el-container>
	    
    </div>
    <el-dialog  v-model="previewStatus" title="预览" draggable :close-on-click-modal="false" style="height: 600px;" :destroy-on-close="true">
        <div style="height: 500px;overflow: auto;">
            <el-image :src="src" v-if="isImage"></el-image>
            <highlightjs :code="code" language="yaml" :autodetect="false"   style="height: 500px; overflow: auto;font-size: 14px; font-weight: 800; font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;" />
        </div>
    </el-dialog>
    <!-- 右键菜单 -->
	<right-menu :class-index="0" :rightclickInfo="rightclickInfoOpenTable"  @onDelete="deleleObjects" @onDownload="downloadObjects" @onPreview="onPreview"></right-menu>
</template>
<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import RightMenu from "@/components/menu/RightMenu.vue";
import 'highlight.js/styles/github.css';
import { api as viewerApi } from "v-viewer"

export default {
    name: 'FTP',
    components: {RightMenu},
    data() {
        return {
            loading: false,
            isSave: false,
            previewStatus: false,
            form: {
                databaseId: null
            },
            code: '',
            src: '',
            returnResult: [],
            rightclickInfoOpenTable: {},
            isImage: '',
        }
    },
    mounted(){
        this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
		this.initialTables();
    },
    methods: {  
        onPreview() {
            // if(it.row.type !== 'FOLDER') {
            //     const tpl = {};
            //     this.code = '';
            const imags = [];
            for(const item of this.returnResult) {
                imags.push(this.$API.gen.session.previewDoc.url + `?genId=${this.form.genId}&dataId=${item.tableName}`)
            }
            viewerApi({ images: imags })
            return;
        },
        deleleObjects(it) {
            this.$API.gen.session.delete.post({
                dataId: it.row?.tableName,
                genId: this.form.genId,
            }).then(res => {
                if(res.code == '00000') {
                    this.$message.success('保存成功');
                    this.dialogStatus = false;
                    this.returnResult = this.returnResult.filter(item => item.tableName !== it.row?.tableName);
                    this.$emit('success', this.form, this.mode)
                    return;
                }
                this.$message.error(res.msg);
            });
        },
        goBack() {
            this.form.databaseId = this.form.databaseId.substring(0, this.form.databaseId.lastIndexOf('/'));
            this.initialTables();
        },
        goHome() {
            this.form.databaseId = '/';
            this.initialTables();
        },
        changeHandler(file)  {
            this.isSave = true;
            this.$API.gen.session.saveForm.post({
                dataId: this.form.databaseId,
                genId: this.form.genId,
                file: file?.raw
            }).then(res => {
                if(res.code == '00000') {
                    this.$message.success('保存成功');
                    this.dialogStatus = false;
                    const name = file?.name;
                    var suffix = '';
                    if(name) {
                        const index = name.lastIndexOf('.');
                        if(index > -1) {
                            suffix = name.substring(index + 1);
                        }
                    }
                    const itemOne = {
                        label: name,
                        tableName: this.form.databaseId + name,
                        type:suffix,
                        remark: file?.size,
                    }
                    this.returnResult.push(itemOne);
                    this.$emit('success', this.form, this.mode)
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => {
                this.isSave = false;
            });
        },
        async onClick(item){
            if(item.subType !== 'image' && item.type !== 'FOLDER') {

                return;
            }

            if(item.subType === 'image') {
                this.onPreview();
                return;
            }


            this.form.databaseId = item.tableName;
            this.loading = true;
			const res = await this.$API.gen.session.children.get(this.form);
			if (res.code === '00000') {
                this.returnResult = res.data;
			}
            this.loading = false;
        },
        async initialTables() {
            this.loading = true;
			const res = await this.$API.gen.session.children.get(this.form);
			if (res.code === '00000') {
                if(res.data.length > 0) {
                    this.returnResult = res.data;
                }
			}
            this.loading = false;
		},
       doRefreshDatabase(){
			this.isLoadDatabase = true;
			this.initialTables();
			this.isLoadDatabase = false;
		},
        //获取封面图片
		getImg: function (data, name) {
			const fileIcon = getAssetsImages(data + ".png");
			return (fileIcon && !fileIcon.endsWith('undefined')) ? fileIcon : getAssetsImages("unknown.png");
		},
        getImgUrl(item) {
            return this.$API.gen.session.previewDoc.url + `?genId=${this.form.genId}&dataId=${item.tableName}`
        },
        //右键
		rightclickOpenTable(row, column, event = window.event) {
			this.rightclickInfoOpenTable = {
				position: {
					x: event.clientX,
					y: event.clientY,
				},
				menulists: [
					{
						fnName: "onPreview",
						params: { row, column, event },
						icoName: "menu-icon el-icon-warning",
						btnName: "预览",
					},
					{
						fnName: "onDownload",
						params: { row, column, event },
						icoName: "menu-icon icon-table-multiple",
						btnName: "下載",
					},
					{
						fnName: "onDelete",
						params: { row, column, event },
						icoName: "menu-icon el-icon-delete",
						btnName: "刪除",
					},
				],
			};
			event.preventDefault(); // 阻止默认的鼠标右击事件
		},
    }
}
</script>
<style lang="less" scoped>
:deep('.el-card__body') {
    padding-left: 0px;
    padding-right: 0px;
}
.ext-text{
    width: 90px;
    text-overflow:ellipsis;
    overflow:hidden;
    white-space:nowrap;
}
</style>