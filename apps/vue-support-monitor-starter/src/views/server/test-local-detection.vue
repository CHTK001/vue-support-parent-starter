<template>
  <div class="test-local-detection">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>本地IP检测测试</span>
          <el-button type="primary" @click="testLocalDetection">测试检测</el-button>
        </div>
      </template>
      
      <el-form :model="testForm" label-width="120px">
        <el-form-item label="测试IP地址">
          <el-input 
            v-model="testForm.host" 
            placeholder="请输入要测试的IP地址或域名"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="检测结果">
          <div v-if="detectionResult">
            <el-tag 
              :type="detectionResult.isLocal ? 'success' : 'info'"
              size="large"
            >
              <IconifyIconOnline 
                :icon="detectionResult.isLocal ? 'ri:home-line' : 'ri:cloud-line'" 
                class="mr-1" 
              />
              {{ detectionResult.isLocal ? '本地服务器' : '远程服务器' }}
            </el-tag>
            
            <div v-if="detectionResult" class="mt-4">
              <h4>检测结果详细信息：</h4>
              <el-descriptions :column="2" border>
                <el-descriptions-item label="测试地址">
                  {{ detectionResult.testHost }}
                </el-descriptions-item>
                <el-descriptions-item label="检测时间">
                  {{ detectionResult.timestamp }}
                </el-descriptions-item>
                <el-descriptions-item label="服务器类型" span="2">
                  <el-tag
                    :type="detectionResult.isLocal ? 'success' : 'info'"
                    size="large"
                  >
                    <IconifyIconOnline
                      :icon="detectionResult.isLocal ? 'ri:home-line' : 'ri:cloud-line'"
                      class="mr-1"
                    />
                    {{ detectionResult.isLocal ? '本地服务器' : '远程服务器' }}
                  </el-tag>
                </el-descriptions-item>

                <template v-if="detectionResult.isLocal">
                  <el-descriptions-item label="操作系统">
                    {{ detectionResult.osType }} {{ detectionResult.osVersion }}
                  </el-descriptions-item>
                  <el-descriptions-item label="系统架构">
                    {{ detectionResult.osArch }}
                  </el-descriptions-item>
                  <el-descriptions-item label="Docker支持">
                    <el-tag :type="detectionResult.dockerEnabled ? 'success' : 'info'">
                      {{ detectionResult.dockerEnabled ? '支持' : '不支持' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="Docker连接方式" v-if="detectionResult.dockerEnabled">
                    {{ detectionResult.dockerConnectionType }}
                  </el-descriptions-item>
                  <el-descriptions-item label="检测到的IP地址" span="2">
                    <div v-if="detectionResult.ipAddresses && detectionResult.ipAddresses.length > 0">
                      <el-tag
                        v-for="(ip, index) in detectionResult.ipAddresses"
                        :key="index"
                        class="mr-1 mb-1"
                        size="small"
                        :type="ip.includes(':') ? 'warning' : 'primary'"
                      >
                        <IconifyIconOnline
                          :icon="ip.includes(':') ? 'ri:global-line' : 'ri:computer-line'"
                          class="mr-1"
                        />
                        {{ ip }}
                        <el-text size="small" type="info" class="ml-1">
                          ({{ ip.includes(':') ? 'IPv6' : 'IPv4' }})
                        </el-text>
                      </el-tag>
                    </div>
                    <el-text v-else type="info">未检测到IP地址</el-text>
                  </el-descriptions-item>
                </template>
              </el-descriptions>
            </div>
          </div>
          <el-text v-else type="info">请输入IP地址并点击测试检测</el-text>
        </el-form-item>
      </el-form>
      
      <el-divider />
      
      <h3>常用测试地址：</h3>
      <div class="test-addresses">
        <el-button 
          v-for="addr in testAddresses" 
          :key="addr.value"
          @click="testForm.host = addr.value; testLocalDetection()"
          size="small"
          :type="addr.type"
        >
          {{ addr.label }}
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components";

// 测试表单
const testForm = reactive({
  host: "127.0.0.1"
});

// 检测结果
const detectionResult = ref<any>(null);

// 测试地址列表
const testAddresses = [
  { label: "localhost", value: "localhost", type: "success" },
  { label: "127.0.0.1", value: "127.0.0.1", type: "success" },
  { label: "本机IP", value: "", type: "warning" }, // 需要动态获取
  { label: "百度", value: "www.baidu.com", type: "info" },
  { label: "谷歌DNS", value: "8.8.8.8", type: "info" },
];

// 测试本地检测功能
const testLocalDetection = async () => {
  if (!testForm.host.trim()) {
    message.warning("请输入要测试的IP地址");
    return;
  }

  try {
    // 调用后端API进行检测
    const response = await fetch(`/api/v1/gen/server/test-local-ip?host=${encodeURIComponent(testForm.host)}`);
    const result = await response.json();

    if (result.code === "00000") {
      const serverInfo = result.data.detectionResult;

      detectionResult.value = {
        isLocal: serverInfo.isLocal === 1,
        osType: serverInfo.osType,
        osVersion: serverInfo.osVersion,
        osArch: serverInfo.osArch,
        dockerEnabled: serverInfo.dockerEnabled === 1,
        dockerConnectionType: serverInfo.dockerConnectionType,
        ipAddresses: serverInfo.ipAddresses ? JSON.parse(serverInfo.ipAddresses) : [],
        testHost: result.data.testHost,
        timestamp: result.data.timestamp
      };

      message.success("检测完成");
    } else {
      message.error("检测失败: " + result.msg);
      detectionResult.value = null;
    }
  } catch (error) {
    console.error("检测失败:", error);
    message.error("检测失败: " + error.message);
    detectionResult.value = null;
  }
};

// 获取本机IP地址
const getLocalIp = async () => {
  try {
    // 调用本地IP检测API获取本机IP
    const response = await fetch('/api/v1/gen/server/test-local-ip?host=127.0.0.1');
    const result = await response.json();

    if (result.code === "00000") {
      const serverInfo = result.data.detectionResult;
      if (serverInfo.ipAddresses) {
        const ipList = JSON.parse(serverInfo.ipAddresses);
        // 返回第一个非回环的IPv4地址
        for (const ip of ipList) {
          if (!ip.includes(':') && ip !== '127.0.0.1') {
            return ip;
          }
        }
      }
    }
    return "192.168.1.100"; // 默认值
  } catch (error) {
    console.error("获取本机IP失败:", error);
    return "192.168.1.100"; // 默认值
  }
};

// 初始化本机IP
getLocalIp().then(ip => {
  if (ip) {
    testAddresses[2].value = ip;
    testAddresses[2].label = `本机IP (${ip})`;
  }
});
</script>

<style scoped>
.test-local-detection {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-addresses {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mt-4 {
  margin-top: 16px;
}

.mr-1 {
  margin-right: 4px;
}

.mb-1 {
  margin-bottom: 4px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
