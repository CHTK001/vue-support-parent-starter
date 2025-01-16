<template>
  <div>
    <el-dialog v-model="visible" width="80%" draggable :close-on-click-modal="false" :modal-append-to-body="false" @close="handleClose">
      <div class="!h-[500px] overflow-y-auto">
        <el-form :model="form" label-width="160px">
          <el-divider>
            <template #default>基础配置</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="客户端请求体大小">
                <el-input v-model="form.monitorNginxHttpClientBodyBufferSize" />
                <div class="el-form-item-msg">客户端请求体的大小</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="日志路径">
                <el-input v-model="form.monitorNginxHttpAccessLog" />
                <div class="el-form-item-msg">用了log_format指令设置了日志格式之后，需要用access_log指令指定日志文件的存放路径记录了哪些用户，哪些页面以及用户浏览器、ip和其他的访问信息</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="长连接超时时间">
                <el-input v-model="form.monitorNginxHttpKeepaliveTimeout" />
                <div class="el-form-item-msg">长连接超时时间，单位是秒</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="高效传输模式">
                <el-select v-model="form.monitorNginxHttpSendfile">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="el-form-item-msg">
                  开启高效文件传输模式，sendfile指令指定nginx是否调用sendfile函数来输出文件，对于普通应用设为
                  on，如果用来进行下载等应用磁盘IO重负载应用，可设置为off，以平衡磁盘与网络I/O处理速度，降低系统的负载。注意：如果图片显示不正常把这个改成off。
                </div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="一次发送">
                <el-select v-model="form.monitorNginxHttpTcpNopush" class="!min-w-[100px]">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="el-form-item-msg">告诉nginx在一个数据包里发送所有头文件，而不一个接一个的发送</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-divider>
            <template #default>gzip压缩</template>
          </el-divider>

          <el-row>
            <el-col :span="12">
              <el-form-item label="gzip压缩输出">
                <el-select v-model="form.monitorNginxHttpGzip">
                  <el-option value="on" label="是">是</el-option>
                  <el-option value="off" label="否">否</el-option>
                </el-select>
                <div class="el-form-item-msg">gzip模块设置，使用 gzip 压缩可以降低网站带宽消耗，同时提升访问速度</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="压缩缓冲区">
                <el-input v-model="form.monitorNginxHttpGzipBuffers" placeholder="4 16k" />
                <div class="el-form-item-msg">压缩缓冲区4 16k</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="压缩等级">
                <el-input v-model="form.monitorNginxHttpGzipCompLevel" type="number" placeholder="2" />
                <div class="el-form-item-msg">gzip_comp_level 2</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="压缩版本">
                <el-input v-model="form.monitorNginxHttpGzipHttpVersion" placeholder="1.0" />
                <div class="el-form-item-msg">gzip_http_version 1.0</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="最小压缩文件大小">
                <el-input v-model="form.monitorNginxHttpGzipMinLength" placeholder="1024" />
                <div class="el-form-item-msg">最小压缩文件大小，页面字节数从header头的Content-Length中获取。默认值为0，不管多大页面都压缩，建议设置成大于1K的字节数，小于1K可能会越压越大。</div>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="压缩类型">
                <el-input
                  v-model="form.monitorNginxHttpGzipTypes"
                  type="textarea"
                  placeholder="text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss"
                />
                <div class="el-form-item-msg">gzip_types text/plain text/css text/xml text/javascript application/json application/x-javascript application/xml application/xml+rss</div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-divider>
            <template #default>其它</template>
          </el-divider>
          <el-row>
            <el-col :span="12">
              <el-form-item label="限流">
                <el-input v-model="form.monitorNginxHttpLimitReqZone" placeholder="$binary_remote_addr 10m;" />
                <div class="el-form-item-msg">限流；limit_req_zone $binary_remote_addr zone=mylimit:10m rate=1r/s;</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="内部重定向">
                <el-input v-model="form.monitorNginxHttpServerNameInRedirect" />
                <div class="el-form-item-msg">让 nginx 在处理自己内部重定向时不默认使用 server_name设置中的第一个域名</div>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="包含配置">
                <el-input v-model="form.monitorNginxHttpInclude" placeholder="/etc/nginx/conf.d/*.conf;" />
                <div class="el-form-item-msg">包含其他的配置文件include /etc/nginx/conf.d/*.conf;</div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <div>
          <el-button @click="handleClose">关闭</el-button>
          <el-button :icon="useRenderIcon('ri:save-3-line')" type="primary" @click="handleSaveOrUpdate">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup>
import { fetchSaveOrUpdateNginxHttpServerConfig } from "@/api/monitor/nginx-http-server";
import { ref, reactive, defineExpose } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const visible = ref(false);
const form = reactive({});

const handleSaveOrUpdate = async () => {
  fetchSaveOrUpdateNginxHttpServerConfig(form).then(res => {
    if (res.code === "00000") {
      message("更新成功", { type: "success" });
      return;
    }
    message(res.msg, { type: "error" });
  });
};
const handleClose = async () => {
  visible.value = false;
};

const handleOpen = async data => {
  visible.value = true;
  Object.assign(form, data);
};

defineExpose({
  handleOpen,
  handleClose
});
</script>
