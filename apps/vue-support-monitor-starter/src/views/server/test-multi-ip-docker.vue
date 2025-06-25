<template>
  <div class="test-multi-ip-docker">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>多IP和Docker配置测试</span>
          <el-button type="primary" @click="testSaveServer">测试保存</el-button>
        </div>
      </template>
      
      <el-form :model="testForm" label-width="120px">
        <el-form-item label="服务器名称">
          <el-input v-model="testForm.monitorSysGenServerName" placeholder="请输入服务器名称" />
        </el-form-item>
        
        <el-form-item label="服务器地址">
          <el-input v-model="testForm.monitorSysGenServerHost" placeholder="请输入服务器地址" />
        </el-form-item>
        
        <el-form-item label="端口">
          <el-input-number v-model="testForm.monitorSysGenServerPort" :min="1" :max="65535" />
        </el-form-item>
        
        <el-form-item label="用户名">
          <el-input v-model="testForm.monitorSysGenServerUsername" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-divider content-position="left">多IP配置</el-divider>
        
        <el-form-item label="额外IP地址">
          <div class="extra-ips-container">
            <div v-for="(ip, index) in testForm.monitorSysGenServerIpAddresses" :key="index" class="extra-ip-item">
              <el-input
                v-model="testForm.monitorSysGenServerIpAddresses[index]"
                placeholder="请输入IP地址"
                clearable
                size="small"
              />
              <el-button
                type="danger"
                size="small"
                text
                @click="removeIp(index)"
                :disabled="testForm.monitorSysGenServerIpAddresses.length <= 1"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" size="small" text @click="addIp">
              添加IP
            </el-button>
          </div>
        </el-form-item>
        
        <el-divider content-position="left">Docker配置</el-divider>
        
        <el-form-item label="Docker支持">
          <el-switch
            v-model="testForm.monitorSysGenServerDockerEnabled"
            :active-value="1"
            :inactive-value="0"
            active-text="支持"
            inactive-text="不支持"
          />
        </el-form-item>
        
        <el-form-item v-if="testForm.monitorSysGenServerDockerEnabled" label="连接方式">
          <el-select v-model="testForm.monitorSysGenServerDockerConnectionType" style="width: 100%">
            <el-option label="Shell命令行" value="SHELL" />
            <el-option label="TCP连接" value="TCP" />
          </el-select>
        </el-form-item>
        
        <template v-if="testForm.monitorSysGenServerDockerEnabled && testForm.monitorSysGenServerDockerConnectionType === 'TCP'">
          <el-form-item label="Docker主机">
            <el-input v-model="testForm.monitorSysGenServerDockerHost" placeholder="请输入Docker主机地址" />
          </el-form-item>
          
          <el-form-item label="Docker端口">
            <el-input-number v-model="testForm.monitorSysGenServerDockerPort" :min="1" :max="65535" />
          </el-form-item>
        </template>
      </el-form>
      
      <el-divider />
      
      <div v-if="lastSubmitData">
        <h3>最后提交的数据：</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="服务器名称">{{ lastSubmitData.monitorSysGenServerName }}</el-descriptions-item>
          <el-descriptions-item label="服务器地址">{{ lastSubmitData.monitorSysGenServerHost }}:{{ lastSubmitData.monitorSysGenServerPort }}</el-descriptions-item>
          <el-descriptions-item label="多IP地址">{{ lastSubmitData.monitorSysGenServerIpAddresses }}</el-descriptions-item>
          <el-descriptions-item label="本地服务器">{{ lastSubmitData.monitorSysGenServerIsLocal ? '是' : '否' }}</el-descriptions-item>
          <el-descriptions-item label="Docker支持">{{ lastSubmitData.monitorSysGenServerDockerEnabled ? '支持' : '不支持' }}</el-descriptions-item>
          <el-descriptions-item label="Docker连接方式" v-if="lastSubmitData.monitorSysGenServerDockerEnabled">
            {{ lastSubmitData.monitorSysGenServerDockerConnectionType }}
          </el-descriptions-item>
          <el-descriptions-item label="Docker主机" v-if="lastSubmitData.monitorSysGenServerDockerHost">
            {{ lastSubmitData.monitorSysGenServerDockerHost }}:{{ lastSubmitData.monitorSysGenServerDockerPort }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <div v-if="lastResponse">
        <h3>服务器响应：</h3>
        <el-alert
          :title="lastResponse.success ? '保存成功' : '保存失败'"
          :type="lastResponse.success ? 'success' : 'error'"
          :description="lastResponse.message"
          show-icon
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "@repo/utils";
import { saveServer } from "@/api/server";

// 测试表单
const testForm = reactive({
  monitorSysGenServerName: "测试服务器",
  monitorSysGenServerHost: "192.168.1.100",
  monitorSysGenServerPort: 22,
  monitorSysGenServerProtocol: "SSH",
  monitorSysGenServerUsername: "root",
  monitorSysGenServerIpAddresses: ["192.168.1.101", "10.0.0.100"] as string[],
  monitorSysGenServerDockerEnabled: 1,
  monitorSysGenServerDockerConnectionType: "TCP",
  monitorSysGenServerDockerHost: "192.168.1.100",
  monitorSysGenServerDockerPort: 2376,
});

// 最后提交的数据
const lastSubmitData = ref<any>(null);
// 最后的响应
const lastResponse = ref<any>(null);

// 添加IP
const addIp = () => {
  testForm.monitorSysGenServerIpAddresses.push("");
};

// 删除IP
const removeIp = (index: number) => {
  if (testForm.monitorSysGenServerIpAddresses.length > 1) {
    testForm.monitorSysGenServerIpAddresses.splice(index, 1);
  }
};

// 测试保存服务器
const testSaveServer = async () => {
  try {
    // 准备提交数据
    const submitData = {
      ...testForm,
      monitorSysGenServerIpAddresses: JSON.stringify(testForm.monitorSysGenServerIpAddresses.filter(ip => ip.trim() !== "")),
      // 确保数字类型正确
      monitorSysGenServerPort: Number(testForm.monitorSysGenServerPort),
      monitorSysGenServerDockerEnabled: Number(testForm.monitorSysGenServerDockerEnabled),
      monitorSysGenServerDockerPort: testForm.monitorSysGenServerDockerPort ? Number(testForm.monitorSysGenServerDockerPort) : null,
      monitorSysGenServerReportEnabled: 1,
      monitorSysGenServerMonitorEnabled: 1,
      monitorSysGenServerStatus: 1,
    };
    
    console.log("测试提交数据:", submitData);
    lastSubmitData.value = submitData;
    
    const res = await saveServer(submitData);
    
    if (res.code === "00000") {
      lastResponse.value = {
        success: true,
        message: "保存成功，服务器ID: " + res.data?.monitorSysGenServerId
      };
      message.success("测试保存成功");
    } else {
      lastResponse.value = {
        success: false,
        message: res.msg || "保存失败"
      };
      message.error("测试保存失败: " + res.msg);
    }
  } catch (error) {
    console.error("测试保存失败:", error);
    lastResponse.value = {
      success: false,
      message: "网络错误: " + error
    };
    message.error("测试保存失败");
  }
};
</script>

<style scoped>
.test-multi-ip-docker {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.extra-ips-container {
  width: 100%;
}

.extra-ip-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.extra-ip-item .el-input {
  flex: 1;
}
</style>
