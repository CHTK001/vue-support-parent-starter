<template>
  <div class="server-form">
    <div class="section-title">
      <IconifyIconOnline icon="ri:server-line" />
      <span>服务器配置</span>
    </div>

    <!-- 行1：连接类型 + 操作系统 -->
    <div class="form-row">
      <ScFormItem label="连接类型" prop="serverType" required>
        <ScSelect v-model="form.serverType" placeholder="请选择" :disabled="readonlyServer">
          <ScOption value="SSH" label="SSH" />
          <ScOption value="WINRM" label="WinRM" />
          <ScOption value="LOCAL" label="本机 (LOCAL)" />
        </ScSelect>
      </ScFormItem>

      <ScFormItem label="操作系统" prop="serverOs">
        <ScSelect v-model="form.serverOs" placeholder="请选择" :disabled="readonlyServer">
          <ScOption value="linux" label="Linux">
            <div class="os-opt"><IconifyIconOnline icon="mdi:linux" /> Linux</div>
          </ScOption>
          <ScOption value="windows" label="Windows">
            <div class="os-opt"><IconifyIconOnline icon="mdi:microsoft-windows" /> Windows</div>
          </ScOption>
          <ScOption value="macos" label="macOS">
            <div class="os-opt"><IconifyIconOnline icon="mdi:apple" /> macOS</div>
          </ScOption>
          <ScOption value="unknown" label="未知">
            <div class="os-opt"><IconifyIconOnline icon="mdi:server" /> 未知</div>
          </ScOption>
        </ScSelect>
      </ScFormItem>
    </div>

    <!-- 行2：主机地址 + 端口（LOCAL 时隐藏） -->
    <template v-if="form.serverType !== 'LOCAL'">
      <div class="form-row">
        <ScFormItem label="主机地址" prop="serverHost">
          <ScInput
            v-model="(form as any).serverHost"
            placeholder="如 192.168.1.100"
            clearable
            :disabled="readonlyServer"
          />
        </ScFormItem>
        <ScFormItem label="端口" prop="serverPort">
          <ScInputNumber
            v-model="(form as any).serverPort"
            :min="1"
            :max="65535"
            :placeholder="form.serverType === 'WINRM' ? '5985' : '22'"
            style="width: 100%"
            :disabled="readonlyServer"
          />
        </ScFormItem>
      </div>

      <!-- 行3：用户名 + 密码 -->
      <div class="form-row">
        <ScFormItem label="用户名" prop="serverUsername">
          <ScInput
            v-model="(form as any).serverUsername"
            placeholder="如 root"
            clearable
            :disabled="readonlyServer"
          />
        </ScFormItem>
        <ScFormItem label="密码" prop="serverPassword">
          <ScInput
            v-model="(form as any).serverPassword"
            type="password"
            placeholder="连接密码"
            show-password
            :disabled="readonlyServer"
          />
        </ScFormItem>
      </div>

      <!-- 行4：SSH 私钥（全宽，仅 SSH） -->
      <ScFormItem v-if="form.serverType === 'SSH'" label="SSH 私钥" prop="serverPrivateKey">
        <ScInput
          v-model="(form as any).serverPrivateKey"
          type="textarea"
          :rows="3"
          placeholder="粘贴 SSH 私钥内容（可选）"
          :disabled="readonlyServer"
        />
      </ScFormItem>
    </template>

    <!-- 行5：连接超时 + 日志路径 -->
    <div class="form-row">
      <ScFormItem label="连接超时" prop="serverConnectTimeout">
        <ScInputNumber
          v-model="(form as any).serverConnectTimeout"
          :min="5"
          :max="300"
          style="width: 100%"
        />
        <span class="unit">秒</span>
      </ScFormItem>
      <ScFormItem label="日志路径" prop="logPath">
        <ScInput
          v-model="(form as any).logPath"
          placeholder="如 /opt/app/logs/app.log"
          clearable
        />
      </ScFormItem>
    </div>

    <!-- 行6：配置路径 + 依赖路径 -->
    <div class="form-row">
      <ScFormItem label="配置路径" prop="configPath">
        <ScInput
          v-model="(form as any).configPath"
          placeholder="如 /opt/app/conf"
          clearable
        />
      </ScFormItem>
      <ScFormItem label="依赖路径" prop="libPath">
        <ScInput
          v-model="(form as any).libPath"
          placeholder="如 /opt/app/lib"
          clearable
        />
      </ScFormItem>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconifyIconOnline } from "@repo/components";
import type { SysProject } from "../../api/manage/project";
import ScOption from "@repo/components/ScOption";
import ScInputNumber from "@repo/components/ScInputNumber";

defineProps<{ form: Partial<SysProject>; readonlyServer?: boolean }>();
</script>

<style scoped lang="scss">
.server-form {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
  margin-top: 4px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

.os-opt {
  display: flex;
  align-items: center;
  gap: 6px;
}

.unit {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
</style>
