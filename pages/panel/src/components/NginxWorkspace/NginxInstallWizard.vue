<template>
  <ElDialog
    v-model="visible"
    title="软件安装向导"
    width="760px"
    :close-on-click-modal="false"
    class="install-wizard-dialog"
    @close="onClose"
  >
    <div class="wizard-body">
      <!-- 左侧：软件列表 -->
      <div class="wizard-sidebar">
        <div class="wizard-sidebar__title">选择软件</div>
        <div
          v-for="pkg in packages"
          :key="pkg.id"
          class="pkg-item"
          :class="{ 'is-active': selected?.id === pkg.id }"
          @click="selectPkg(pkg)"
        >
          <span class="pkg-item__icon">{{ pkg.icon }}</span>
          <div class="pkg-item__info">
            <span class="pkg-item__name">{{ pkg.name }}</span>
            <span class="pkg-item__desc">{{ pkg.desc }}</span>
          </div>
        </div>
        <div class="pkg-item pkg-item--custom" :class="{ 'is-active': isCustom }" @click="selectCustom">
          <span class="pkg-item__icon">⚙️</span>
          <div class="pkg-item__info">
            <span class="pkg-item__name">自定义脚本</span>
            <span class="pkg-item__desc">手动编写安装脚本</span>
          </div>
        </div>
      </div>

      <!-- 右侧：脚本编辑 + 执行 -->
      <div class="wizard-main">
        <template v-if="selected || isCustom">
          <div class="wizard-main__header">
            <span class="wizard-main__title">
              {{ isCustom ? '自定义脚本' : selected!.name + ' 安装脚本' }}
            </span>
            <div class="wizard-main__actions">
              <ElButton v-if="!isCustom" size="small" @click="resetScript">重置</ElButton>
              <ElButton
                type="primary"
                size="small"
                :loading="running"
                :disabled="!script.trim()"
                @click="runScript"
              >
                <ElIcon><VideoPlay /></ElIcon>
                执行
              </ElButton>
            </div>
          </div>

          <div class="script-editor-wrap">
            <div ref="lineNumbersEl" class="line-numbers">
              <div v-for="n in scriptLineCount" :key="n" class="line-number">{{ n }}</div>
            </div>
            <textarea
              ref="scriptRef"
              v-model="script"
              class="script-editor"
              spellcheck="false"
              placeholder="# 在此编写 shell 脚本..."
              @scroll="syncScroll"
            />
          </div>

          <div v-if="output !== null" class="output-panel">
            <div class="output-panel__header">
              <span class="output-panel__title">
                <ElIcon><Document /></ElIcon>
                执行输出
              </span>
              <div style="display:flex;gap:6px;align-items:center">
                <ElTag v-if="exitOk === true" type="success" size="small">✓ 成功</ElTag>
                <ElTag v-else-if="exitOk === false" type="danger" size="small">✗ 失败</ElTag>
                <ElButton size="small" @click="output = null; exitOk = null">清空</ElButton>
              </div>
            </div>
            <div ref="outputRef" class="output-content">
              <pre class="output-pre">{{ output }}</pre>
            </div>
          </div>
        </template>

        <div v-else class="wizard-placeholder">
          <ElEmpty description="← 选择左侧软件开始安装" :image-size="64" />
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { Document, VideoPlay } from '@element-plus/icons-vue'
import { ElButton, ElDialog, ElEmpty, ElIcon, ElMessage, ElTag } from 'element-plus'
import { computed, nextTick, ref } from 'vue'
import { executeNginxScript } from '../../api/nginx'

const props = defineProps<{ connectionId: string }>()
const visible = defineModel<boolean>({ default: false })

interface Package { id: string; name: string; icon: string; desc: string; script: string }

const packages: Package[] = [
  {
    id: 'zookeeper', name: 'ZooKeeper', icon: '🦓', desc: '分布式协调服务',
    script: `#!/bin/bash
set -e
ZK_VERSION="3.9.2"
ZK_DIR="/opt/zookeeper"
ZK_TAR="apache-zookeeper-\${ZK_VERSION}-bin.tar.gz"
ZK_URL="https://downloads.apache.org/zookeeper/zookeeper-\${ZK_VERSION}/\${ZK_TAR}"
echo "==> 安装 Java"
which java || (apt-get update -y && apt-get install -y default-jdk 2>/dev/null || yum install -y java-11-openjdk 2>/dev/null)
echo "==> 下载 ZooKeeper \${ZK_VERSION}"
cd /tmp && wget -q "\${ZK_URL}" -O "\${ZK_TAR}"
echo "==> 解压到 \${ZK_DIR}"
mkdir -p "\${ZK_DIR}" && tar -xzf "\${ZK_TAR}" -C "\${ZK_DIR}" --strip-components=1 && rm -f "\${ZK_TAR}"
cp "\${ZK_DIR}/conf/zoo_sample.cfg" "\${ZK_DIR}/conf/zoo.cfg"
mkdir -p /var/lib/zookeeper
sed -i 's|dataDir=.*|dataDir=/var/lib/zookeeper|' "\${ZK_DIR}/conf/zoo.cfg"
"\${ZK_DIR}/bin/zkServer.sh" start
"\${ZK_DIR}/bin/zkServer.sh" status
echo "ZooKeeper 安装完成！端口: 2181"`,
  },
  {
    id: 'nacos', name: 'Nacos', icon: '🌊', desc: '服务注册与配置中心',
    script: `#!/bin/bash
set -e
NACOS_VERSION="2.3.2"
NACOS_DIR="/opt/nacos"
NACOS_TAR="nacos-server-\${NACOS_VERSION}.tar.gz"
NACOS_URL="https://github.com/alibaba/nacos/releases/download/\${NACOS_VERSION}/\${NACOS_TAR}"
which java || (apt-get update -y && apt-get install -y default-jdk 2>/dev/null || yum install -y java-11-openjdk 2>/dev/null)
cd /tmp && wget -q "\${NACOS_URL}" -O "\${NACOS_TAR}"
mkdir -p /opt && tar -xzf "\${NACOS_TAR}" -C /opt && rm -f "\${NACOS_TAR}"
"\${NACOS_DIR}/bin/startup.sh" -m standalone
sleep 8
echo "Nacos 安装完成！访问: http://\$(hostname -I | awk '{print \$1}'):8848/nacos (nacos/nacos)"`,
  },
  {
    id: 'influxdb', name: 'InfluxDB', icon: '📊', desc: '时序数据库',
    script: `#!/bin/bash
set -e
if command -v apt-get &>/dev/null; then
  wget -q https://repos.influxdata.com/influxdata-archive_compat.key
  echo '393e8779c89ac8d958f81f942f9ad7fb82a25e133faddaf92e15b16e6ac9ce4c influxdata-archive_compat.key' | sha256sum -c
  cat influxdata-archive_compat.key | gpg --dearmor | tee /etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg > /dev/null
  echo 'deb [signed-by=/etc/apt/trusted.gpg.d/influxdata-archive_compat.gpg] https://repos.influxdata.com/debian stable main' | tee /etc/apt/sources.list.d/influxdata.list
  apt-get update -y && apt-get install -y influxdb2
  systemctl enable influxdb && systemctl start influxdb
elif command -v yum &>/dev/null; then
  cat > /etc/yum.repos.d/influxdata.repo << 'EOF'
[influxdata]
name = InfluxData Repository
baseurl = https://repos.influxdata.com/rhel/\$releasever/\$basearch/stable
enabled = 1
gpgcheck = 1
gpgkey = https://repos.influxdata.com/influxdata-archive_compat.key
EOF
  yum install -y influxdb2 && systemctl enable influxdb && systemctl start influxdb
fi
echo "InfluxDB 安装完成！端口: 8086"`,
  },
  {
    id: 'redis', name: 'Redis', icon: '🔴', desc: '内存数据库/缓存',
    script: `#!/bin/bash
set -e
if command -v apt-get &>/dev/null; then
  apt-get update -y && apt-get install -y redis-server
  systemctl enable redis-server && systemctl start redis-server
elif command -v yum &>/dev/null; then
  yum install -y epel-release && yum install -y redis
  systemctl enable redis && systemctl start redis
fi
redis-cli ping
echo "Redis 安装完成！端口: 6379"`,
  },
  {
    id: 'mysql', name: 'MySQL', icon: '🐬', desc: '关系型数据库',
    script: `#!/bin/bash
set -e
ROOT_PASS="Admin@123456"
if command -v apt-get &>/dev/null; then
  apt-get update -y && apt-get install -y mysql-server
  systemctl enable mysql && systemctl start mysql
  mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '\${ROOT_PASS}';"
  mysql -u root -p"\${ROOT_PASS}" -e "CREATE USER 'root'@'%' IDENTIFIED BY '\${ROOT_PASS}'; GRANT ALL PRIVILEGES ON *.* TO 'root'@'%'; FLUSH PRIVILEGES;"
elif command -v yum &>/dev/null; then
  yum install -y mysql-server && systemctl enable mysqld && systemctl start mysqld
  TEMP_PASS=\$(grep 'temporary password' /var/log/mysqld.log | awk '{print \$NF}')
  mysql -u root -p"\${TEMP_PASS}" --connect-expired-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '\${ROOT_PASS}';"
fi
echo "MySQL 安装完成！端口: 3306，root 密码: \${ROOT_PASS}"`,
  },
  {
    id: 'mongodb', name: 'MongoDB', icon: '🍃', desc: '文档型数据库',
    script: `#!/bin/bash
set -e
if command -v apt-get &>/dev/null; then
  apt-get install -y gnupg curl
  curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
  echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
  apt-get update -y && apt-get install -y mongodb-org
  systemctl enable mongod && systemctl start mongod
elif command -v yum &>/dev/null; then
  cat > /etc/yum.repos.d/mongodb-org-7.0.repo << 'EOF'
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/redhat/\$releasever/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF
  yum install -y mongodb-org && systemctl enable mongod && systemctl start mongod
fi
echo "MongoDB 安装完成！端口: 27017"`,
  },
  {
    id: 'prometheus', name: 'Prometheus', icon: '🔥', desc: '监控与告警系统',
    script: `#!/bin/bash
set -e
PROM_VERSION="2.51.2"
PROM_DIR="/opt/prometheus"
cd /tmp
wget -q "https://github.com/prometheus/prometheus/releases/download/v\${PROM_VERSION}/prometheus-\${PROM_VERSION}.linux-amd64.tar.gz" -O prom.tar.gz
mkdir -p "\${PROM_DIR}" && tar -xzf prom.tar.gz -C "\${PROM_DIR}" --strip-components=1 && rm -f prom.tar.gz
cat > /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus
After=network.target
[Service]
ExecStart=/opt/prometheus/prometheus --config.file=/opt/prometheus/prometheus.yml --storage.tsdb.path=/var/lib/prometheus
Restart=always
[Install]
WantedBy=multi-user.target
EOF
mkdir -p /var/lib/prometheus
systemctl daemon-reload && systemctl enable prometheus && systemctl start prometheus
echo "Prometheus 安装完成！端口: 9090"`,
  },
]

const selected = ref<Package | null>(null)
const isCustom = ref(false)
const script = ref('')
const running = ref(false)
const output = ref<string | null>(null)
const exitOk = ref<boolean | null>(null)
const scriptRef = ref<HTMLTextAreaElement | null>(null)
const lineNumbersEl = ref<HTMLDivElement | null>(null)
const outputRef = ref<HTMLDivElement | null>(null)

const scriptLineCount = computed(() => Math.max(script.value.split('\n').length, 1))

const syncScroll = () => {
  if (lineNumbersEl.value && scriptRef.value) {
    lineNumbersEl.value.scrollTop = scriptRef.value.scrollTop
  }
}

const selectPkg = (pkg: Package) => {
  selected.value = pkg; isCustom.value = false
  script.value = pkg.script; output.value = null; exitOk.value = null
}

const selectCustom = () => {
  selected.value = null; isCustom.value = true
  script.value = '#!/bin/bash\nset -e\n\n# 在此编写安装脚本\n'
  output.value = null; exitOk.value = null
}

const resetScript = () => { if (selected.value) script.value = selected.value.script }

const runScript = async () => {
  if (!script.value.trim()) return
  running.value = true; output.value = '正在执行...\n'; exitOk.value = null
  try {
    const res = await executeNginxScript(props.connectionId, script.value)
    output.value = res?.data ?? ''
    exitOk.value = !output.value.toLowerCase().includes('error') && !output.value.toLowerCase().includes('failed')
    ElMessage.success('脚本执行完成')
  } catch (e: any) {
    output.value = 'ERROR: ' + (e?.message ?? '执行失败'); exitOk.value = false
    ElMessage.error('脚本执行失败')
  } finally {
    running.value = false
    await nextTick()
    if (outputRef.value) outputRef.value.scrollTop = outputRef.value.scrollHeight
  }
}

const onClose = () => {
  selected.value = null; isCustom.value = false
  script.value = ''; output.value = null; exitOk.value = null
}
</script>

<style scoped lang="scss">
.install-wizard-dialog { :deep(.el-dialog__body) { padding: 0; } }

.wizard-body { display: flex; height: 600px; overflow: hidden; }

.wizard-sidebar {
  width: 200px; flex-shrink: 0;
  border-right: 1px solid rgba(148,163,184,.15);
  background: #f8fafc; overflow-y: auto; padding: 12px 0;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(99,102,241,.2); border-radius: 2px; }
}

.wizard-sidebar__title {
  font-size: 11px; font-weight: 600; color: #94a3b8;
  letter-spacing: .08em; text-transform: uppercase; padding: 0 14px 8px;
}

.pkg-item {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  cursor: pointer; transition: background .15s; border-left: 3px solid transparent;
  &:hover { background: rgba(99,102,241,.06); }
  &.is-active { background: rgba(99,102,241,.1); border-left-color: #6366f1; }
  &--custom { margin-top: 8px; border-top: 1px solid rgba(148,163,184,.12); padding-top: 14px; }
}

.pkg-item__icon { font-size: 20px; flex-shrink: 0; width: 28px; text-align: center; }
.pkg-item__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pkg-item__name { font-size: 13px; font-weight: 600; color: #1e293b; }
.pkg-item__desc { font-size: 11px; color: #94a3b8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.wizard-main { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #0f172a; }

.wizard-main__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: rgba(15,23,42,.96);
  border-bottom: 1px solid rgba(99,102,241,.15); flex-shrink: 0;
}

.wizard-main__title { font-size: 13px; font-weight: 600; color: #e2e8f0; }
.wizard-main__actions { display: flex; gap: 6px; }

.wizard-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; background: #f8fafc; }

.script-editor-wrap { display: flex; flex: 1; min-height: 0; overflow: hidden; max-height: 320px; }

.line-numbers {
  width: 36px; flex-shrink: 0; background: #0a1120;
  border-right: 1px solid rgba(99,102,241,.1); overflow: hidden; padding: 14px 0; user-select: none;
}

.line-number {
  height: 20px; line-height: 20px; font-size: 11px;
  font-family: 'JetBrains Mono', monospace; color: #475569; text-align: right; padding-right: 8px;
}

.script-editor {
  flex: 1; padding: 14px; background: #0f172a; color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12.5px;
  line-height: 20px; border: none; outline: none; resize: none; tab-size: 2;
  &::placeholder { color: #334155; }
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(99,102,241,.3); border-radius: 3px; }
}

.output-panel { flex-shrink: 0; max-height: 220px; display: flex; flex-direction: column; border-top: 1px solid rgba(99,102,241,.15); }

.output-panel__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; background: rgba(15,23,42,.96);
  border-bottom: 1px solid rgba(99,102,241,.1); flex-shrink: 0;
}

.output-panel__title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: #94a3b8;
  .el-icon { color: #6366f1; }
}

.output-content {
  flex: 1; overflow-y: auto; background: #020817;
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: rgba(99,102,241,.25); border-radius: 3px; }
}

.output-pre {
  margin: 0; padding: 12px 14px;
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  line-height: 1.7; color: #94a3b8; white-space: pre-wrap; word-break: break-all;
}

// ── Dark Mode ──
:global(html.dark) {
  .wizard-sidebar {
    background: rgba(15, 23, 42, 0.88);
    border-right-color: rgba(148, 163, 184, 0.08);
  }
  .wizard-sidebar__title { color: #64748b; }

  .pkg-item {
    &:hover { background: rgba(99, 102, 241, 0.1); }
    &.is-active { background: rgba(99, 102, 241, 0.15); border-left-color: #818cf8; }
    &--custom { border-top-color: rgba(148, 163, 184, 0.1); }
  }
  .pkg-item__name { color: #e2e8f0; }
  .pkg-item__desc { color: #64748b; }

  .wizard-placeholder { background: rgba(15, 23, 42, 0.88); }
}
</style>
