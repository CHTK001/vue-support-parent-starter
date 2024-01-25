<template>
	<el-dialog draggable status-icon v-model="visible" title="爬虫配置" width="30%">
        <el-form ref="dialogForm" :model="form" :rules="rules" label-width="120px">
            <el-form-item label="spiderId" prop="spiderId" v-if="false">
                <el-input v-model="form.taskId" readonly disable />
            </el-form-item>
            <el-form-item label="爬虫名称" prop="spiderName">
                <el-input :max="255" v-model="form.spiderName" clearable placeholder="请输入爬虫名称" />
            </el-form-item>

            <el-tooltip class="box-item" effect="dark" content="请输入爬取的URL" placement="right">
                <el-form-item label="URL" prop="spiderHome">
                    <el-input v-model="form.spiderHome"  clearable placeholder="请输入爬取的URL" />
                </el-form-item>
            </el-tooltip>

			<el-tooltip class="box-item" effect="dark" content="(秒)" placement="right">
                <el-form-item label="等待时间" prop="taskExpire">
                    <el-input v-model="form.spiderSleepTime" type="number" clearable placeholder="请输入配置名称" />
                </el-form-item>
            </el-tooltip>

			<el-tooltip class="box-item" effect="dark" content="请输入下载器" placement="right">
                <el-form-item label="下载器" prop="spiderDownloader">
					<el-select v-model="form.spiderDownloader" placeholder="">
					  <el-option value="com.chua.htmlunit.support.spider.downloader.HtmlunitDownloader" label="htmlunit"></el-option>
					  <el-option value="com.chua.httpclient.support.downloader.HttpClientDownloader" label="httpClient"></el-option>
					  <el-option value="com.chua.common.support.lang.spider.downloader.JsoupDownloader" label="jsoup"></el-option>
					  <el-option value="com.chua.common.support.lang.spider.downloader.PhantomJSDownloader" label="phantomJS"></el-option>
					</el-select>
					<div class="el-form-item-msg">网页的下载器</div>
                </el-form-item>
            </el-tooltip>

			<el-form-item label="解析器" prop="spiderBean" style="position: relative;">
				<el-select v-model="form.spiderBean" placeholder="">
					<el-option value="bean" label="bean"></el-option>
					<el-option value="script" label="script"></el-option>
				</el-select>
				<div class="el-form-item-msg">网页的数据的解析器, Bean采用规则解析, Script自动编写解析代码</div>
				<div style="position: absolute; right: 40%; top: 7px">
					<el-icon class="icon" @click="showScriptFunc" v-if="form.spiderBean==='script'" :size="20"><component is="sc-icon-script" /></el-icon>
					<el-icon v-if="form.spiderBean==='bean'" :size="20"><component is="sc-icon-scheduler" /></el-icon>
				</div>
			</el-form-item>

			<el-form-item label="完成时是否退出" prop="taskOver">
				<el-checkbox v-model="form.spiderExitWhenComplete"  :max="2" :true-label="1" :false-label="0">是否退出</el-checkbox>
				<div class="el-form-item-msg">完成时是否退出</div>
			</el-form-item>
            
            <el-form-item label="线程数" prop="value">
                <el-input v-model="form.spiderThread" :max="2" type="number" clearable placeholder="请输入线程数" />
            </el-form-item>
            <el-form-item label="描述" prop="value">
                <el-input v-model="form.taskMarker" :max="255" :rows="5" type="textarea" clearable placeholder="请输入描述" />
            </el-form-item>
        </el-form>
		<template #footer>
		    <el-button @click="visible = false">取消</el-button>
                <el-button type="primary" @click="submit()" :loading="isSaveing">提交</el-button>
		</template>
    </el-dialog>


	<el-dialog v-model="showScript" draggable status-icon width="70%" :title="form.spiderName ?? '爬虫脚本'">
        <sc-code-editor ref="coder" v-model="form.spiderScript" :height="700" mode="groovy"></sc-code-editor>
	</el-dialog>
</template>

<script>
	import scCron from '@/components/scCron/index.vue';
	import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
	export default {
		components: {
			scCron, scCodeEditor
		},
		emits: ['success', 'closed'],
		data() {
			return {
				mode: "add",
				titleMap: {
					add: '新增计划任务',
					edit: '编辑计划任务',
				},
				form: {
					spiderThread: 1,
					spiderSleepTime: 300,
					spiderExitWhenComplete: 1,
					spiderDownloader: 'jsoup',
					spiderScript: '',
				},
				apiObj: this.$API.system.tasks.options,
				taskType: [],
				rules: {
					spiderDownloader: [{ required: true, message: "下载器不能为空", trigger: 'blur' }],
                    spiderThread: [{ required: true, message: "线程数不能为空", trigger: 'blur' }],
                    spiderName: [{ required: true, message: "名称不能为空", trigger: 'blur' }],
                    spiderHome: [{ required: true, message: "地址不能为空", trigger: 'blur' }]
				},
				showScript: false,
				visible: false,
				isSaveing: false,
				shortcuts: [
					
				]
			}
		},
		mounted() {
			// this.initial();
		},
		methods: {
			showScriptFunc() {
				this.showScript = true;
				if(!this.form.spiderScript) {
					this.form.spiderScript = `
import com.chua.common.support.lang.spider.Page;
import com.chua.common.support.lang.spider.ResultItems;
import com.chua.common.support.lang.spider.Site;
import com.chua.common.support.lang.spider.Spider;
import com.chua.common.support.lang.spider.processor.PageProcessor;

import java.util.ArrayList;
import java.util.List;

public class Page${this.form.spiderDownloader + 1}Processor implements PageProcessor {

	@Override
	public void process(Page page) {
		//page.putField("name", page.getHtml().css("dl.lemmaWgt-lemmaTitle h1", "text").toString());
	}
}

					`
				}
			},
			getValue(row) {
				debugger
			},
			initial() {
				this.$API.system.tasks.options.get().then((res) => {
					if (res.code === '00000') {
						this.taskType = res.data;
					} else {
						this.$notify.error({ title: '提示', message: res.msg })
					}
				}).finally(() => {
					this.loading = false
				})
			},
			//显示
			open(mode='add'){
				this.mode = mode;
				this.visible = true;
				return this;
			},
			handleDirChange: function (data) {
				this.form.taskType = data.split(',')[0];
				this.form.taskCid = data.split(',')[1];
			},
			//表单提交方法
			submit(){
				this.$refs.dialogForm.validate((valid) => {
					if (valid) {
						this.isSaveing = true;
						this.form.taskCid = this.form.taskType;
						this.$API.system.tasks.save.post(this.form).then(res => {
							if (res.code === '00000') {
								this.$emit('success', res.data, this.mode)
								this.visible = false;
							} else {
								this.$notify.error({title: '提示', message: res.msg})
							}
						}).finally(() =>{this.isSaveing = false})
					}
				})
			},
			//表单注入数据
			setData(data){
				Object.assign(this.form, data)
			}
		}
	}
</script>

<style>
.select-width {
	width: 100%;
}
.icon {
	z-index: 20230809;
	cursor: pointer;
}
</style>
