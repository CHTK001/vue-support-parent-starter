<template>
  <div class="jvm-info-container system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:cpu-line" class="title-icon" />
            JVM 监控
          </h1>
          <p class="page-subtitle">实时查看 JVM 运行状态与性能指标</p>
        </div>
        <div class="header-actions">
          <ScButton type="success" @click="showOptimizationDialog">
            <IconifyIconOnline icon="ri:magic-line" />
            优化建议
          </ScButton>
          <ScButton type="info" @click="showThreadDumpDialog">
            <IconifyIconOnline icon="ri:file-list-3-line" />
            线程Dump
          </ScButton>
          <ScButton type="primary" @click="showMemoryLeakDialog">
            <IconifyIconOnline icon="ri:bug-line" />
            泄漏检测
          </ScButton>
          <ScButton @click="showDiagnosticDialog">
            <IconifyIconOnline icon="ri:tools-line" />
            诊断信息
          </ScButton>
          <ScButton @click="loadData" :loading="loading">
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新
          </ScButton>
          <ScButton type="warning" @click="handleGc" :loading="gcLoading">
            <IconifyIconOnline icon="ri:recycle-line" />
            手动 GC
          </ScButton>
          <ScSwitch 
            v-model="autoRefresh"
            active-text="自动刷新"
            inactive-text=""
            style="margin-left: 12px"
          />
        </div>
      </div>
    </div>

    <div class="content-wrapper" v-loading="loading">
      <!-- 综合概览仪表板 -->
      <div class="dashboard-overview">
        <!-- 核心指标卡片 -->
        <div class="metric-cards">
          <div class="metric-card cpu-card">
            <div class="metric-card-icon">
              <IconifyIconOnline icon="ri:cpu-line" />
            </div>
            <div class="metric-card-content">
              <div class="metric-card-value">{{ (jvmInfo.cpuInfo?.processCpuLoad || 0).toFixed(1) }}%</div>
              <div class="metric-card-label">进程CPU</div>
            </div>
            <ScProgress 
              type="circle"
              :percentage="jvmInfo.cpuInfo?.processCpuLoad || 0"
              :width="50"
              :stroke-width="4"
              :color="getProgressColor(jvmInfo.cpuInfo?.processCpuLoad || 0)"
            />
          </div>

          <div class="metric-card memory-card">
            <div class="metric-card-icon">
              <IconifyIconOnline icon="ri:hard-drive-2-line" />
            </div>
            <div class="metric-card-content">
              <div class="metric-card-value">{{ (jvmInfo.heapMemory?.usagePercent || 0).toFixed(1) }}%</div>
              <div class="metric-card-label">堆内存</div>
              <div class="metric-card-detail">{{ formatBytes(jvmInfo.heapMemory?.used) }} / {{ formatBytes(jvmInfo.heapMemory?.max) }}</div>
            </div>
            <ScProgress 
              type="circle"
              :percentage="jvmInfo.heapMemory?.usagePercent || 0"
              :width="50"
              :stroke-width="4"
              :color="getProgressColor(jvmInfo.heapMemory?.usagePercent || 0)"
            />
          </div>

          <div class="metric-card thread-card">
            <div class="metric-card-icon">
              <IconifyIconOnline icon="ri:stack-line" />
            </div>
            <div class="metric-card-content">
              <div class="metric-card-value">{{ jvmInfo.threadInfo?.threadCount || 0 }}</div>
              <div class="metric-card-label">活动线程</div>
              <div class="metric-card-detail">峰值: {{ jvmInfo.threadInfo?.peakThreadCount || 0 }}</div>
            </div>
            <div class="thread-mini-stats">
              <span :class="{'danger': (jvmInfo.threadInfo?.deadlockedThreadCount || 0) > 0}">
                死锁: {{ jvmInfo.threadInfo?.deadlockedThreadCount || 0 }}
              </span>
            </div>
          </div>

          <div class="metric-card class-card">
            <div class="metric-card-icon">
              <IconifyIconOnline icon="ri:file-code-line" />
            </div>
            <div class="metric-card-content">
              <div class="metric-card-value">{{ formatNumber(jvmInfo.classLoadingInfo?.loadedClassCount) }}</div>
              <div class="metric-card-label">已加载类</div>
              <div class="metric-card-detail">卸载: {{ formatNumber(jvmInfo.classLoadingInfo?.unloadedClassCount) }}</div>
            </div>
          </div>

          <div class="metric-card gc-card">
            <div class="metric-card-icon">
              <IconifyIconOnline icon="ri:recycle-line" />
            </div>
            <div class="metric-card-content">
              <div class="metric-card-value">{{ getTotalGcCount() }}</div>
              <div class="metric-card-label">GC次数</div>
              <div class="metric-card-detail">{{ formatDuration(getTotalGcTime()) }}</div>
            </div>
          </div>

          <div class="metric-card uptime-card">
            <div class="metric-card-icon">
              <IconifyIconOnline icon="ri:time-line" />
            </div>
            <div class="metric-card-content">
              <div class="metric-card-value">{{ formatDuration(jvmInfo.uptime) }}</div>
              <div class="metric-card-label">运行时长</div>
              <div class="metric-card-detail">{{ formatTime(jvmInfo.startTime) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- JVM & 系统信息 -->
      <div class="stats-row">
        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:information-line" />
              <span>JVM 信息</span>
            </div>
          </template>
          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="JVM 名称">{{ jvmInfo.jvmName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="JVM 版本">{{ jvmInfo.jvmVersion || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Java 版本">{{ jvmInfo.javaVersion || '-' }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ jvmInfo.jvmVendor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="Java Home" :span="2">
              <el-text truncated>{{ jvmInfo.javaHome || '-' }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </ScCard>

        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:computer-line" />
              <span>系统信息</span>
            </div>
          </template>
          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="操作系统">{{ jvmInfo.osInfo?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="架构">{{ jvmInfo.osInfo?.arch || '-' }}</el-descriptions-item>
            <el-descriptions-item label="CPU 核心数">{{ jvmInfo.osInfo?.availableProcessors || '-' }}</el-descriptions-item>
            <el-descriptions-item label="系统负载">{{ jvmInfo.osInfo?.systemLoadAverage?.toFixed(2) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="物理内存">
              {{ formatBytes(jvmInfo.osInfo?.freePhysicalMemory) }} / {{ formatBytes(jvmInfo.osInfo?.totalPhysicalMemory) }}
            </el-descriptions-item>
            <el-descriptions-item label="系统CPU">{{ (jvmInfo.cpuInfo?.systemCpuLoad || 0).toFixed(1) }}%</el-descriptions-item>
          </el-descriptions>
        </ScCard>
      </div>

      <!-- 编译 & 运行时信息 -->
      <div class="stats-row">
        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:code-s-slash-line" />
              <span>编译信息</span>
            </div>
          </template>
          <el-descriptions :column="1" size="small">
            <el-descriptions-item label="编译器">
              {{ jvmInfo.compilationInfo?.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="编译总时间">
              {{ formatDuration(jvmInfo.compilationInfo?.totalCompilationTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="时间监控">
              <ScTag :type="jvmInfo.compilationInfo?.compilationTimeMonitoringSupported ? 'success' : 'info'" size="small">
                {{ jvmInfo.compilationInfo?.compilationTimeMonitoringSupported ? '支持' : '不支持' }}
              </ScTag>
            </el-descriptions-item>
          </el-descriptions>
        </ScCard>

        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:terminal-box-line" />
              <span>运行时信息</span>
            </div>
          </template>
          <el-descriptions :column="2" size="small">
            <el-descriptions-item label="进程ID">
              <ScTag type="primary" size="small">{{ jvmInfo.runtimeInfo?.pid || '-' }}</ScTag>
            </el-descriptions-item>
            <el-descriptions-item label="管理规范版本">{{ jvmInfo.runtimeInfo?.managementSpecVersion || '-' }}</el-descriptions-item>
            <el-descriptions-item label="规范名称" :span="2">
              <el-text truncated>{{ jvmInfo.runtimeInfo?.specName || '-' }}</el-text>
            </el-descriptions-item>
          </el-descriptions>
        </ScCard>
      </div>

      <!-- 缓冲池 & 文件描述符 -->
      <div class="stats-row">
        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:ram-line" />
              <span>缓冲池</span>
            </div>
          </template>
          <div v-if="jvmInfo.bufferPools?.length" class="buffer-pool-list">
            <div v-for="pool in jvmInfo.bufferPools" :key="pool.name" class="buffer-pool-item">
              <div class="pool-header">
                <span class="pool-name">{{ pool.name }}</span>
                <span class="pool-count">{{ pool.count }} 个缓冲区</span>
              </div>
              <div class="pool-stats">
                <span>已用: {{ formatBytes(pool.memoryUsed) }}</span>
                <span>容量: {{ formatBytes(pool.totalCapacity) }}</span>
              </div>
              <ScProgress 
                :percentage="pool.totalCapacity ? ((pool.memoryUsed || 0) / pool.totalCapacity * 100) : 0"
                :stroke-width="6"
                :color="getProgressColor(pool.totalCapacity ? ((pool.memoryUsed || 0) / pool.totalCapacity * 100) : 0)"
              />
            </div>
          </div>
          <ScEmpty v-else description="无缓冲池信息" :image-size="40" />
        </ScCard>

        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:file-list-2-line" />
              <span>文件描述符</span>
            </div>
          </template>
          <div v-if="jvmInfo.fileDescriptorInfo" class="fd-info">
            <div class="metric-grid">
              <div class="metric-item">
                <div class="metric-value">{{ formatNumber(jvmInfo.fileDescriptorInfo?.openFileDescriptorCount) }}</div>
                <div class="metric-label">已打开</div>
              </div>
              <div class="metric-item">
                <div class="metric-value">{{ formatNumber(jvmInfo.fileDescriptorInfo?.maxFileDescriptorCount) }}</div>
                <div class="metric-label">最大限制</div>
              </div>
            </div>
            <ScProgress 
              :percentage="jvmInfo.fileDescriptorInfo?.usagePercent || 0"
              :stroke-width="10"
              :color="getProgressColor(jvmInfo.fileDescriptorInfo?.usagePercent || 0)"
              :format="(p: number) => p.toFixed(1) + '%'"
              style="margin-top: 12px"
            />
            <div class="fd-usage-text">文件描述符使用率</div>
          </div>
          <ScEmpty v-else description="无文件描述符信息 (仅Unix系统可用)" :image-size="40" />
        </ScCard>
      </div>

      <!-- CPU & 内存详情 -->
      <div class="stats-row">
        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:cpu-line" />
              <span>CPU 使用率</span>
            </div>
          </template>
          <div class="gauge-container">
            <div class="gauge-item">
              <ScProgress 
                type="dashboard"
                :percentage="jvmInfo.cpuInfo?.processCpuLoad || 0"
                :color="getProgressColor(jvmInfo.cpuInfo?.processCpuLoad || 0)"
                :stroke-width="10"
              />
              <div class="gauge-label">进程 CPU</div>
            </div>
            <div class="gauge-item">
              <ScProgress 
                type="dashboard"
                :percentage="jvmInfo.cpuInfo?.systemCpuLoad || 0"
                :color="getProgressColor(jvmInfo.cpuInfo?.systemCpuLoad || 0)"
                :stroke-width="10"
              />
              <div class="gauge-label">系统 CPU</div>
            </div>
          </div>
        </ScCard>

        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:hard-drive-2-line" />
              <span>内存使用</span>
              <ScButton type="primary" link style="margin-left: auto" @click="showHeapDialog">
                <IconifyIconOnline icon="ri:pie-chart-line" />
                内存分析
              </ScButton>
            </div>
          </template>
          <div class="gauge-container">
            <div class="gauge-item">
              <ScProgress 
                type="dashboard"
                :percentage="jvmInfo.heapMemory?.usagePercent || 0"
                :color="getProgressColor(jvmInfo.heapMemory?.usagePercent || 0)"
                :stroke-width="10"
              />
              <div class="gauge-label">堆内存</div>
              <div class="gauge-detail">
                {{ formatBytes(jvmInfo.heapMemory?.used) }} / {{ formatBytes(jvmInfo.heapMemory?.max) }}
              </div>
            </div>
            <div class="gauge-item">
              <ScProgress 
                type="dashboard"
                :percentage="jvmInfo.nonHeapMemory?.usagePercent || 0"
                :color="getProgressColor(jvmInfo.nonHeapMemory?.usagePercent || 0)"
                :stroke-width="10"
              />
              <div class="gauge-label">非堆内存</div>
              <div class="gauge-detail">
                {{ formatBytes(jvmInfo.nonHeapMemory?.used) }} / {{ formatBytes(jvmInfo.nonHeapMemory?.max) }}
              </div>
            </div>
          </div>
        </ScCard>
      </div>

      <!-- 线程 & 类加载 -->
      <div class="stats-row">
        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:stack-line" />
              <span>线程信息</span>
            </div>
          </template>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-value">{{ jvmInfo.threadInfo?.threadCount || 0 }}</div>
              <div class="metric-label">当前线程</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ jvmInfo.threadInfo?.peakThreadCount || 0 }}</div>
              <div class="metric-label">峰值线程</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ jvmInfo.threadInfo?.daemonThreadCount || 0 }}</div>
              <div class="metric-label">守护线程</div>
            </div>
            <div class="metric-item">
              <div class="metric-value" :class="{ 'danger': (jvmInfo.threadInfo?.deadlockedThreadCount || 0) > 0 }">
                {{ jvmInfo.threadInfo?.deadlockedThreadCount || 0 }}
              </div>
              <div class="metric-label">死锁线程</div>
            </div>
          </div>
        </ScCard>

        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:file-code-line" />
              <span>类加载信息</span>
            </div>
          </template>
          <div class="metric-grid">
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(jvmInfo.classLoadingInfo?.loadedClassCount) }}</div>
              <div class="metric-label">已加载类</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(jvmInfo.classLoadingInfo?.totalLoadedClassCount) }}</div>
              <div class="metric-label">总加载类</div>
            </div>
            <div class="metric-item">
              <div class="metric-value">{{ formatNumber(jvmInfo.classLoadingInfo?.unloadedClassCount) }}</div>
              <div class="metric-label">已卸载类</div>
            </div>
          </div>
        </ScCard>
      </div>

      <!-- 线程状态分布 & JIT编译统计 -->
      <div class="stats-row">
        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:pie-chart-2-line" />
              <span>线程状态分布</span>
            </div>
          </template>
          <div class="thread-state-chart">
            <div class="state-bars">
              <div class="state-bar-item" v-for="state in threadStateItems" :key="state.name">
                <div class="state-bar-header">
                  <span class="state-name">{{ state.name }}</span>
                  <span class="state-count">{{ state.count }}</span>
                </div>
                <ScProgress 
                  :percentage="state.percent"
                  :stroke-width="8"
                  :color="state.color"
                  :show-text="false"
                />
              </div>
            </div>
            <div class="state-summary">
              <span>总线程: {{ jvmInfo.threadStateDistribution?.totalCount || 0 }}</span>
            </div>
          </div>
        </ScCard>

        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:speed-line" />
              <span>JIT 编译统计</span>
            </div>
          </template>
          <div v-if="jvmInfo.jitCompilationStats" class="jit-stats">
            <el-descriptions :column="1" size="small">
              <el-descriptions-item label="编译器">
                {{ jvmInfo.jitCompilationStats?.compilerName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="总编译时间">
                {{ formatDuration(jvmInfo.jitCompilationStats?.totalCompilationTime) }}
              </el-descriptions-item>
              <el-descriptions-item label="估计编译方法数">
                {{ formatNumber(jvmInfo.jitCompilationStats?.compiledMethodCount) }}
              </el-descriptions-item>
              <el-descriptions-item label="平均编译时间">
                {{ (jvmInfo.jitCompilationStats?.avgCompilationTime || 0).toFixed(3) }} ms/方法
              </el-descriptions-item>
            </el-descriptions>
          </div>
          <ScEmpty v-else description="无JIT编译信息" :image-size="40" />
        </ScCard>
      </div>

      <!-- 代码缓存信息 -->
      <div class="stats-row" v-if="jvmInfo.codeCacheInfo">
        <ScCard class="stat-card code-cache-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:database-line" />
              <span>代码缓存 (Code Cache)</span>
              <ScTag v-if="jvmInfo.codeCacheInfo?.nearFull" type="danger" size="small" style="margin-left: 8px">接近满</ScTag>
            </div>
          </template>
          <div class="code-cache-info">
            <div class="cache-progress">
              <ScProgress 
                type="dashboard"
                :percentage="jvmInfo.codeCacheInfo?.usagePercent || 0"
                :color="getProgressColor(jvmInfo.codeCacheInfo?.usagePercent || 0)"
                :stroke-width="10"
                :width="100"
              />
              <div class="cache-label">使用率</div>
            </div>
            <div class="cache-details">
              <div class="cache-detail-item">
                <span class="label">已使用</span>
                <span class="value">{{ formatBytes(jvmInfo.codeCacheInfo?.used) }}</span>
              </div>
              <div class="cache-detail-item">
                <span class="label">已提交</span>
                <span class="value">{{ formatBytes(jvmInfo.codeCacheInfo?.committed) }}</span>
              </div>
              <div class="cache-detail-item">
                <span class="label">最大容量</span>
                <span class="value">{{ formatBytes(jvmInfo.codeCacheInfo?.max) }}</span>
              </div>
            </div>
          </div>
        </ScCard>
      </div>

      <!-- GC统计 & 元空间 -->
      <div class="stats-row">
        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:recycle-line" />
              <span>GC 统计</span>
            </div>
          </template>
          <div v-if="jvmInfo.gcStats" class="gc-stats-panel">
            <div class="gc-overview">
              <div class="gc-stat-item">
                <div class="gc-stat-value">{{ formatNumber(jvmInfo.gcStats?.totalCollectionCount) }}</div>
                <div class="gc-stat-label">总次数</div>
              </div>
              <div class="gc-stat-item">
                <div class="gc-stat-value">{{ formatDuration(jvmInfo.gcStats?.totalCollectionTime) }}</div>
                <div class="gc-stat-label">总时间</div>
              </div>
              <div class="gc-stat-item">
                <div class="gc-stat-value">{{ (jvmInfo.gcStats?.avgCollectionTime || 0).toFixed(2) }}ms</div>
                <div class="gc-stat-label">平均时间</div>
              </div>
            </div>
            <ScDivider style="margin: 12px 0" />
            <div class="gc-detail-stats">
              <div class="gc-type-row">
                <span class="gc-type-label">
                  <ScTag type="success" size="small">Young GC</ScTag>
                </span>
                <span class="gc-type-value">{{ jvmInfo.gcStats?.youngGcCount || 0 }} 次 / {{ formatDuration(jvmInfo.gcStats?.youngGcTime) }}</span>
              </div>
              <div class="gc-type-row">
                <span class="gc-type-label">
                  <ScTag type="warning" size="small">Old GC</ScTag>
                </span>
                <span class="gc-type-value">{{ jvmInfo.gcStats?.oldGcCount || 0 }} 次 / {{ formatDuration(jvmInfo.gcStats?.oldGcTime) }}</span>
              </div>
              <div class="gc-type-row">
                <span class="gc-type-label">GC频率</span>
                <span class="gc-type-value">{{ (jvmInfo.gcStats?.gcPerMinute || 0).toFixed(2) }} 次/分</span>
              </div>
              <div class="gc-type-row">
                <span class="gc-type-label">GC时间占比</span>
                <span class="gc-type-value" :class="{'text-danger': (jvmInfo.gcStats?.gcTimePercent || 0) > 5}">
                  {{ (jvmInfo.gcStats?.gcTimePercent || 0).toFixed(3) }}%
                </span>
              </div>
            </div>
          </div>
          <ScEmpty v-else description="无GC统计信息" :image-size="40" />
        </ScCard>

        <ScCard class="stat-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:archive-line" />
              <span>元空间 (Metaspace)</span>
            </div>
          </template>
          <div v-if="jvmInfo.metaspaceInfo" class="metaspace-panel">
            <div class="metaspace-main">
              <ScProgress 
                type="dashboard"
                :percentage="jvmInfo.metaspaceInfo?.usagePercent || 0"
                :color="getProgressColor(jvmInfo.metaspaceInfo?.usagePercent || 0)"
                :stroke-width="8"
                :width="80"
              />
              <div class="metaspace-details">
                <div class="detail-row">
                  <span class="label">已用</span>
                  <span class="value">{{ formatBytes(jvmInfo.metaspaceInfo?.used) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">已提交</span>
                  <span class="value">{{ formatBytes(jvmInfo.metaspaceInfo?.committed) }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">最大</span>
                  <span class="value">{{ formatBytes(jvmInfo.metaspaceInfo?.max) }}</span>
                </div>
              </div>
            </div>
            <ScDivider style="margin: 12px 0" />
            <div class="compressed-class-space" v-if="jvmInfo.metaspaceInfo?.compressedClassSpaceUsed">
              <div class="ccs-header">压缩类空间</div>
              <ScProgress 
                :percentage="jvmInfo.metaspaceInfo?.compressedClassSpaceUsagePercent || 0"
                :stroke-width="6"
                :color="getProgressColor(jvmInfo.metaspaceInfo?.compressedClassSpaceUsagePercent || 0)"
              />
              <div class="ccs-detail">
                {{ formatBytes(jvmInfo.metaspaceInfo?.compressedClassSpaceUsed) }} / {{ formatBytes(jvmInfo.metaspaceInfo?.compressedClassSpaceMax) }}
              </div>
            </div>
          </div>
          <ScEmpty v-else description="无元空间信息" :image-size="40" />
        </ScCard>
      </div>

      <!-- 直接内存 -->
      <div class="stats-row" v-if="jvmInfo.directMemoryInfo?.used">
        <ScCard class="stat-card direct-memory-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:ram-2-line" />
              <span>直接内存 (Direct Memory)</span>
            </div>
          </template>
          <div class="direct-memory-panel">
            <div class="direct-memory-section">
              <div class="dm-title">Direct 缓冲区</div>
              <div class="dm-stats">
                <div class="dm-stat">
                  <span class="label">已用</span>
                  <span class="value">{{ formatBytes(jvmInfo.directMemoryInfo?.used) }}</span>
                </div>
                <div class="dm-stat">
                  <span class="label">容量</span>
                  <span class="value">{{ formatBytes(jvmInfo.directMemoryInfo?.totalCapacity) }}</span>
                </div>
                <div class="dm-stat">
                  <span class="label">数量</span>
                  <span class="value">{{ jvmInfo.directMemoryInfo?.count || 0 }}</span>
                </div>
              </div>
              <ScProgress 
                v-if="jvmInfo.directMemoryInfo?.usagePercent"
                :percentage="jvmInfo.directMemoryInfo?.usagePercent || 0"
                :stroke-width="8"
                :color="getProgressColor(jvmInfo.directMemoryInfo?.usagePercent || 0)"
                style="margin-top: 8px"
              />
            </div>
            <div class="direct-memory-section" v-if="jvmInfo.directMemoryInfo?.mappedUsed">
              <div class="dm-title">Mapped 缓冲区</div>
              <div class="dm-stats">
                <div class="dm-stat">
                  <span class="label">已用</span>
                  <span class="value">{{ formatBytes(jvmInfo.directMemoryInfo?.mappedUsed) }}</span>
                </div>
                <div class="dm-stat">
                  <span class="label">容量</span>
                  <span class="value">{{ formatBytes(jvmInfo.directMemoryInfo?.mappedCapacity) }}</span>
                </div>
                <div class="dm-stat">
                  <span class="label">数量</span>
                  <span class="value">{{ jvmInfo.directMemoryInfo?.mappedCount || 0 }}</span>
                </div>
              </div>
            </div>
            <div class="max-direct-memory" v-if="jvmInfo.directMemoryInfo?.maxDirectMemory">
              <span>最大直接内存: {{ formatBytes(jvmInfo.directMemoryInfo?.maxDirectMemory) }}</span>
            </div>
          </div>
        </ScCard>
      </div>

      <!-- 内存分配速率 -->
      <div class="stats-row" v-if="jvmInfo.memoryAllocationRate">
        <ScCard class="stat-card memory-allocation-card" shadow="never">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:speed-line" />
              <span>内存分配速率</span>
            </div>
          </template>
          <div class="memory-allocation-panel">
            <div class="allocation-sections">
              <div class="allocation-section">
                <div class="section-title">Eden 区</div>
                <ScProgress 
                  :percentage="jvmInfo.memoryAllocationRate?.edenUsagePercent || 0"
                  :stroke-width="10"
                  :color="getProgressColor(jvmInfo.memoryAllocationRate?.edenUsagePercent || 0)"
                />
                <div class="section-detail">
                  {{ formatBytes(jvmInfo.memoryAllocationRate?.edenUsed) }} / {{ formatBytes(jvmInfo.memoryAllocationRate?.edenMax) }}
                </div>
              </div>
              <div class="allocation-section">
                <div class="section-title">Survivor 区</div>
                <div class="section-detail">
                  <span class="label">已用</span>
                  <span class="value">{{ formatBytes(jvmInfo.memoryAllocationRate?.survivorUsed) }}</span>
                  <span class="label" style="margin-left: 12px">最大</span>
                  <span class="value">{{ formatBytes(jvmInfo.memoryAllocationRate?.survivorMax) }}</span>
                </div>
              </div>
              <div class="allocation-section">
                <div class="section-title">Old 区</div>
                <ScProgress 
                  :percentage="jvmInfo.memoryAllocationRate?.oldUsagePercent || 0"
                  :stroke-width="10"
                  :color="getProgressColor(jvmInfo.memoryAllocationRate?.oldUsagePercent || 0)"
                />
                <div class="section-detail">
                  {{ formatBytes(jvmInfo.memoryAllocationRate?.oldUsed) }} / {{ formatBytes(jvmInfo.memoryAllocationRate?.oldMax) }}
                </div>
              </div>
            </div>
            <ScDivider style="margin: 12px 0" />
            <div class="rate-stats">
              <div class="rate-item">
                <span class="rate-label">分配速率</span>
                <span class="rate-value">{{ formatBytes(jvmInfo.memoryAllocationRate?.allocationRatePerSecond) }}/s</span>
              </div>
              <div class="rate-item">
                <span class="rate-label">晒升速率</span>
                <span class="rate-value">{{ formatBytes(jvmInfo.memoryAllocationRate?.promotionRatePerSecond) }}/s</span>
              </div>
            </div>
          </div>
        </ScCard>
      </div>

      <!-- 类加载详情 & 安全信息 -->
      <div class="stats-row" v-if="jvmInfo.classLoadingDetail || jvmInfo.securityInfo">
        <ScCard class="stat-card class-loading-detail-card" shadow="never" v-if="jvmInfo.classLoadingDetail">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:file-code-line" />
              <span>类加载详情</span>
            </div>
          </template>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="当前加载">
              <span class="highlight-value">{{ jvmInfo.classLoadingDetail?.currentLoadedCount?.toLocaleString() }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="总加载">
              {{ jvmInfo.classLoadingDetail?.totalLoadedCount?.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="卸载类数">
              {{ jvmInfo.classLoadingDetail?.unloadedCount?.toLocaleString() }}
            </el-descriptions-item>
            <el-descriptions-item label="详细输出">
              <ScTag :type="jvmInfo.classLoadingDetail?.verbose ? 'success' : 'info'" size="small">
                {{ jvmInfo.classLoadingDetail?.verbose ? '已启用' : '未启用' }}
              </ScTag>
            </el-descriptions-item>
            <el-descriptions-item label="加载速率">
              {{ (jvmInfo.classLoadingDetail?.loadRatePerMinute || 0).toFixed(2) }} 类/分钟
            </el-descriptions-item>
            <el-descriptions-item label="卸载速率">
              {{ (jvmInfo.classLoadingDetail?.unloadRatePerMinute || 0).toFixed(2) }} 类/分钟
            </el-descriptions-item>
          </el-descriptions>
        </ScCard>

        <ScCard class="stat-card security-info-card" shadow="never" v-if="jvmInfo.securityInfo">
          <template #header>
            <div class="card-header">
              <IconifyIconOnline icon="ri:shield-check-line" />
              <span>安全管理器</span>
            </div>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="状态">
              <ScTag :type="jvmInfo.securityInfo?.securityManagerEnabled ? 'success' : 'info'" size="small">
                {{ jvmInfo.securityInfo?.securityManagerEnabled ? '已启用' : '未启用' }}
              </ScTag>
            </el-descriptions-item>
            <el-descriptions-item label="管理器类" v-if="jvmInfo.securityInfo?.securityManagerClass">
              <span class="mono-text">{{ jvmInfo.securityInfo?.securityManagerClass }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="策略文件" v-if="jvmInfo.securityInfo?.policyFile">
              <span class="mono-text">{{ jvmInfo.securityInfo?.policyFile }}</span>
            </el-descriptions-item>
          </el-descriptions>
          <div class="security-tip" v-if="!jvmInfo.securityInfo?.securityManagerEnabled">
            <ScAlert type="info" :closable="false" show-icon>
              <template #title>
                安全管理器未启用，应用运行无额外安全限制
              </template>
            </ScAlert>
          </div>
        </ScCard>
      </div>

      <!-- CPU 热点代码分析 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:fire-line" />
            <span>CPU 热点代码分析</span>
            <ScButton type="success" link style="margin-left: auto" @click="showBusinessAnalysisDialog">
              <IconifyIconOnline icon="ri:code-box-line" />
              业务归因分析
            </ScButton>
            <ScButton type="primary" link @click="showHotspotDialog">
              <IconifyIconOnline icon="ri:search-line" />
              详细分析
            </ScButton>
          </div>
        </template>
        <div class="hotspot-quick-view" v-loading="hotspotLoading">
          <div v-if="hotspotAnalysis?.hotspots?.length" class="hotspot-list">
            <div v-for="(hotspot, index) in (hotspotAnalysis?.hotspots || []).slice(0, 10)" :key="index" class="hotspot-item">
              <div class="hotspot-rank">{{ index + 1 }}</div>
              <div class="hotspot-info">
                <div class="hotspot-method" :title="hotspot.fullMethod">
                  <span class="method-class">{{ getSimpleClassName(hotspot.className) }}</span>.<span class="method-name">{{ hotspot.methodName }}</span>()
                </div>
                <div class="hotspot-location" v-if="hotspot.fileName">
                  {{ hotspot.fileName }}:{{ hotspot.lineNumber }}
                </div>
              </div>
              <div class="hotspot-stats">
                <ScProgress 
                  :percentage="hotspot.percentage || 0"
                  :stroke-width="6"
                  :color="getProgressColor((hotspot.percentage || 0) * 1.5)"
                  :format="(p: number) => p.toFixed(1) + '%'"
                  style="width: 100px"
                />
              </div>
            </div>
          </div>
          <div v-else class="hotspot-empty">
            <ScButton type="primary" @click="runHotspotAnalysis" :loading="hotspotLoading">
              <IconifyIconOnline icon="ri:play-line" />
              开始分析
            </ScButton>
            <p>点击开始采样分析 CPU 热点代码</p>
          </div>
        </div>
      </ScCard>

      <!-- 线程 CPU 占用分析 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:bar-chart-line" />
            <span>线程 CPU 占用分析 (Top 20)</span>
            <ScButton type="primary" link style="margin-left: auto" @click="showAllThreads">
              <IconifyIconOnline icon="ri:list-check" />
              查看全部线程
            </ScButton>
          </div>
        </template>
        <ScTable :data="jvmInfo.topCpuThreads || []" stripe border max-height="400">
          <ScTableColumn prop="threadId" label="ID" width="70" />
          <ScTableColumn prop="threadName" label="线程名称" min-width="200" show-overflow-tooltip />
          <ScTableColumn label="状态" width="100">
            <template #default="{ row }">
              <ScTag :type="getStateType(row.state)" size="small">{{ row.state }}</ScTag>
            </template>
          </ScTableColumn>
          <ScTableColumn label="CPU 占比" width="140">
            <template #default="{ row }">
              <ScProgress 
                :percentage="row.cpuUsage || 0"
                :color="getProgressColor(row.cpuUsage || 0)"
                :stroke-width="8"
                :format="(p: number) => p.toFixed(2) + '%'"
              />
            </template>
          </ScTableColumn>
          <ScTableColumn label="CPU 时间" width="100">
            <template #default="{ row }">
              {{ formatNanoTime(row.cpuTime) }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="用户时间" width="100">
            <template #default="{ row }">
              {{ formatNanoTime(row.userTime) }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="阻塞" width="80">
            <template #default="{ row }">
              <span :class="{ 'danger-text': (row.blockedCount || 0) > 100 }">{{ row.blockedCount || 0 }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn label="等待" width="80">
            <template #default="{ row }">
              {{ row.waitedCount || 0 }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <ScButton type="primary" link size="small" @click="viewThreadStack(row)">
                堆栈
              </ScButton>
            </template>
          </ScTableColumn>
        </ScTable>
      </ScCard>

      <!-- GC 信息 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:recycle-line" />
            <span>垃圾收集器</span>
          </div>
        </template>
        <ScTable :data="jvmInfo.garbageCollectors || []" stripe border>
          <ScTableColumn prop="name" label="收集器名称" min-width="150" />
          <ScTableColumn prop="collectionCount" label="收集次数" min-width="100" />
          <ScTableColumn label="收集时间" min-width="120">
            <template #default="{ row }">
              {{ formatDuration(row.collectionTime) }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="内存池" min-width="200">
            <template #default="{ row }">
              <ScTag v-for="pool in row.memoryPoolNames" :key="pool" size="small" style="margin: 2px;">
                {{ pool }}
              </ScTag>
            </template>
          </ScTableColumn>
        </ScTable>
      </ScCard>

      <!-- 内存池信息 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:database-2-line" />
            <span>内存池</span>
          </div>
        </template>
        <ScTable :data="jvmInfo.memoryPools || []" stripe border>
          <ScTableColumn prop="name" label="内存池名称" min-width="180" />
          <ScTableColumn prop="type" label="类型" min-width="100">
            <template #default="{ row }">
              <ScTag :type="row.type === 'HEAP' ? 'success' : 'info'" size="small">
                {{ row.type }}
              </ScTag>
            </template>
          </ScTableColumn>
          <ScTableColumn label="已使用" min-width="120">
            <template #default="{ row }">
              {{ formatBytes(row.usage?.used) }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="已提交" min-width="120">
            <template #default="{ row }">
              {{ formatBytes(row.usage?.committed) }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="最大" min-width="120">
            <template #default="{ row }">
              {{ formatBytes(row.usage?.max) }}
            </template>
          </ScTableColumn>
          <ScTableColumn label="使用率" min-width="150">
            <template #default="{ row }">
              <ScProgress 
                :percentage="row.usage?.usagePercent || 0"
                :color="getProgressColor(row.usage?.usagePercent || 0)"
                :stroke-width="8"
              />
            </template>
          </ScTableColumn>
        </ScTable>
      </ScCard>

      <!-- 操作系统信息 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:computer-line" />
            <span>操作系统信息</span>
          </div>
        </template>
        <el-descriptions :column="3" border>
          <el-descriptions-item label="操作系统">{{ jvmInfo.osInfo?.name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="版本">{{ jvmInfo.osInfo?.version || '-' }}</el-descriptions-item>
          <el-descriptions-item label="架构">{{ jvmInfo.osInfo?.arch || '-' }}</el-descriptions-item>
          <el-descriptions-item label="处理器数量">{{ jvmInfo.osInfo?.availableProcessors || '-' }}</el-descriptions-item>
          <el-descriptions-item label="系统负载">{{ jvmInfo.osInfo?.systemLoadAverage?.toFixed(2) || '-' }}</el-descriptions-item>
          <el-descriptions-item label="物理内存">
            {{ formatBytes(jvmInfo.osInfo?.freePhysicalMemory) }} / {{ formatBytes(jvmInfo.osInfo?.totalPhysicalMemory) }}
          </el-descriptions-item>
          <el-descriptions-item label="交换空间" :span="3">
            {{ formatBytes(jvmInfo.osInfo?.freeSwapSpace) }} / {{ formatBytes(jvmInfo.osInfo?.totalSwapSpace) }}
          </el-descriptions-item>
        </el-descriptions>
      </ScCard>

      <!-- JVM 参数 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:settings-3-line" />
            <span>JVM 启动参数</span>
          </div>
        </template>
        <div class="args-container">
          <ScTag 
            v-for="(arg, index) in jvmInfo.inputArguments"
            :key="index"
            class="arg-tag"
            type="info"
          >
            {{ arg }}
          </ScTag>
          <ScEmpty v-if="!jvmInfo.inputArguments?.length" description="无启动参数" :image-size="60" />
        </div>
      </ScCard>

      <!-- 线程Dump概览 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:file-list-3-line" />
            <span>线程 Dump</span>
            <ScButton type="primary" link style="margin-left: auto" @click="runThreadDump" :loading="threadDumpLoading">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </ScButton>
            <ScButton type="success" link @click="downloadThreadDump" :disabled="!threadDumpData">
              <IconifyIconOnline icon="ri:download-line" />
              下载
            </ScButton>
            <ScButton link @click="showThreadDumpDialog">
              <IconifyIconOnline icon="ri:fullscreen-line" />
              详情
            </ScButton>
          </div>
        </template>
        <div v-loading="threadDumpLoading">
          <div v-if="threadDumpData" class="thread-dump-overview">
            <div class="dump-stats">
              <div class="dump-stat-item">
                <div class="stat-value">{{ threadDumpData.threadCount }}</div>
                <div class="stat-label">线程总数</div>
              </div>
              <div class="dump-stat-item" :class="{'danger': (threadDumpData.deadlockedCount || 0) > 0}">
                <div class="stat-value">{{ threadDumpData.deadlockedCount || 0 }}</div>
                <div class="stat-label">死锁线程</div>
              </div>
              <div class="dump-stat-item">
                <div class="stat-value">{{ formatTime(threadDumpData.timestamp) }}</div>
                <div class="stat-label">采集时间</div>
              </div>
            </div>
            <ScTable :data="(threadDumpData.threads || []).slice(0, 10)" stripe border size="small" max-height="300">
              <ScTableColumn prop="threadId" label="ID" width="60" />
              <ScTableColumn prop="threadName" label="线程名" min-width="180" show-overflow-tooltip />
              <ScTableColumn label="状态" width="100">
                <template #default="{ row }">
                  <ScTag :type="getThreadStateType(row.state)" size="small">{{ row.state }}</ScTag>
                </template>
              </ScTableColumn>
              <ScTableColumn label="堆栈深度" width="80">
                <template #default="{ row }">{{ row.stackTrace?.length || 0 }}</template>
              </ScTableColumn>
              <ScTableColumn label="操作" width="70">
                <template #default="{ row }">
                  <ScButton type="primary" link size="small" @click="showThreadDumpStack(row)">查看</ScButton>
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
          <div v-else class="empty-panel">
            <ScButton type="primary" @click="runThreadDump" :loading="threadDumpLoading">
              <IconifyIconOnline icon="ri:play-line" />
              获取线程Dump
            </ScButton>
            <p>点击获取当前 JVM 的线程Dump信息</p>
          </div>
        </div>
      </ScCard>

      <!-- 内存泄漏检测概览 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:bug-line" />
            <span>内存泄漏检测</span>
            <ScInputNumber v-model="leakIntervalSeconds" :min="3" :max="30" :step="1" size="small" style="width: 100px; margin-left: auto" />
            <span style="font-size: 12px; color: #909399; margin: 0 8px">秒</span>
            <ScButton type="primary" link @click="runMemoryLeakAnalysis" :loading="memoryLeakLoading">
              <IconifyIconOnline icon="ri:play-line" />
              开始检测
            </ScButton>
            <ScButton link @click="showMemoryLeakDialog">
              <IconifyIconOnline icon="ri:fullscreen-line" />
              详情
            </ScButton>
          </div>
        </template>
        <div v-loading="memoryLeakLoading" :element-loading-text="`正在采集内存快照，请等待 ${leakIntervalSeconds} 秒...`">
          <div v-if="memoryLeakAnalysis" class="memory-leak-overview">
            <div class="leak-risk-banner" :class="'risk-' + (memoryLeakAnalysis.leakRiskLevel || 'LOW').toLowerCase()">
              <IconifyIconOnline :icon="getLeakRiskIcon(memoryLeakAnalysis.leakRiskLevel)" class="risk-icon" />
              <div class="risk-info">
                <div class="risk-level">风险等级: {{ memoryLeakAnalysis.leakRiskLevel }}</div>
                <div class="risk-conclusion">{{ memoryLeakAnalysis.conclusion }}</div>
              </div>
              <div class="risk-stats">
                <div>堆增长: <span :class="{'text-danger': (memoryLeakAnalysis.heapGrowthPercent || 0) > 10}">{{ formatBytes(memoryLeakAnalysis.heapGrowth) }} ({{ (memoryLeakAnalysis.heapGrowthPercent || 0).toFixed(1) }}%)</span></div>
                <div>间隔: {{ ((memoryLeakAnalysis.intervalMs || 0) / 1000).toFixed(1) }}秒</div>
              </div>
            </div>
            <ScTable :data="(memoryLeakAnalysis.growingObjects || []).slice(0, 8)" stripe border size="small" max-height="250">
              <ScTableColumn label="#" width="40">
                <template #default="{ $index }">
                  <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn prop="simpleClassName" label="类名" min-width="200" show-overflow-tooltip />
              <ScTableColumn label="内存增长" width="100">
                <template #default="{ row }">
                  <span class="text-danger">+{{ formatBytes(row.bytesGrowth) }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="实例增长" width="80">
                <template #default="{ row }">
                  <span class="text-warning">+{{ formatNumber(row.countGrowth) }}</span>
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
          <div v-else class="empty-panel">
            <ScButton type="primary" @click="runMemoryLeakAnalysis" :loading="memoryLeakLoading">
              <IconifyIconOnline icon="ri:play-line" />
              开始内存泄漏检测
            </ScButton>
            <p>对比两次堆快照，检测内存增长情况</p>
          </div>
        </div>
      </ScCard>

      <!-- JVM诊断信息概览 -->
      <ScCard class="info-card" shadow="never">
        <template #header>
          <div class="card-header">
            <IconifyIconOnline icon="ri:tools-line" />
            <span>JVM 诊断信息</span>
            <ScButton type="primary" link style="margin-left: auto" @click="runDiagnostic" :loading="diagnosticLoading">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </ScButton>
            <ScButton link @click="showDiagnosticDialog">
              <IconifyIconOnline icon="ri:fullscreen-line" />
              详情
            </ScButton>
          </div>
        </template>
        <div v-loading="diagnosticLoading">
          <div v-if="diagnosticInfo" class="diagnostic-overview">
            <ScTabs v-model="diagnosticOverviewTab" type="border-card" class="compact-tabs">
              <ScTabPane label="VM Flags" name="flags">
                <ScTable :data="(diagnosticInfo.vmFlags || []).slice(0, 10)" stripe size="small" max-height="250">
                  <ScTableColumn prop="name" label="参数" min-width="200" show-overflow-tooltip />
                  <ScTableColumn prop="value" label="值" min-width="120" show-overflow-tooltip />
                  <ScTableColumn prop="origin" label="来源" width="100">
                    <template #default="{ row }">
                      <ScTag :type="getFlagOriginType(row.origin)" size="small">{{ row.origin }}</ScTag>
                    </template>
                  </ScTableColumn>
                </ScTable>
              </ScTabPane>
              <ScTabPane label="系统属性" name="sysProps">
                <ScTable :data="Object.entries(diagnosticInfo.systemProperties || {}).slice(0, 10).map(([k, v]) => ({key: k, value: v}))" stripe size="small" max-height="250">
                  <ScTableColumn prop="key" label="属性名" width="150" />
                  <ScTableColumn prop="value" label="值" min-width="300" show-overflow-tooltip />
                </ScTable>
              </ScTabPane>
              <ScTabPane label="内存池" name="memoryPools">
                <ScTable :data="diagnosticInfo.memoryPoolDetails || []" stripe size="small" max-height="250">
                  <ScTableColumn prop="name" label="名称" width="150" show-overflow-tooltip />
                  <ScTableColumn label="使用率" width="120">
                    <template #default="{ row }">
                      <ScProgress 
                        :percentage="row.usage?.usagePercent || 0"
                        :stroke-width="6"
                        :color="getProgressColor(row.usage?.usagePercent || 0)"
                        :format="(p: number) => p.toFixed(0) + '%'"
                      />
                    </template>
                  </ScTableColumn>
                  <ScTableColumn label="已用/最大" min-width="120">
                    <template #default="{ row }">{{ formatBytes(row.usage?.used) }} / {{ formatBytes(row.usage?.max) }}</template>
                  </ScTableColumn>
                </ScTable>
              </ScTabPane>
              <ScTabPane label="类加载器" name="classLoaders">
                <ScTable :data="diagnosticInfo.classLoaders || []" stripe size="small" max-height="250">
                  <ScTableColumn prop="name" label="名称" width="150" />
                  <ScTableColumn prop="type" label="类型" min-width="250" show-overflow-tooltip />
                  <ScTableColumn prop="parent" label="父加载器" min-width="200" show-overflow-tooltip />
                </ScTable>
              </ScTabPane>
            </ScTabs>
          </div>
          <div v-else class="empty-panel">
            <ScButton type="primary" @click="runDiagnostic" :loading="diagnosticLoading">
              <IconifyIconOnline icon="ri:play-line" />
              获取诊断信息
            </ScButton>
            <p>获取 JVM 详细诊断信息，包括 VM Flags、系统属性等</p>
          </div>
        </div>
      </ScCard>
    </div>

    <!-- 线程列表对话框 -->
    <sc-dialog v-model="threadDialogVisible" title="线程列表" width="90%" top="5vh">
      <div class="thread-dialog-toolbar">
        <ScInput 
          v-model="threadSearchKey"
          placeholder="搜索线程名称..."
          clearable
          style="width: 250px"
          @input="filterThreads"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </ScInput>
        <ScSelect v-model="threadStateFilter" placeholder="线程状态" clearable style="width: 140px" @change="filterThreads">
          <ScOption label="全部" value="" />
          <ScOption label="RUNNABLE" value="RUNNABLE" />
          <ScOption label="BLOCKED" value="BLOCKED" />
          <ScOption label="WAITING" value="WAITING" />
          <ScOption label="TIMED_WAITING" value="TIMED_WAITING" />
          <ScOption label="NEW" value="NEW" />
          <ScOption label="TERMINATED" value="TERMINATED" />
        </ScSelect>
        <ScButton @click="loadAllThreads" :loading="threadsLoading">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </ScButton>
      </div>
      <ScTable :data="filteredThreads" stripe border max-height="60vh" v-loading="threadsLoading">
        <ScTableColumn prop="threadId" label="ID" width="70" sortable />
        <ScTableColumn prop="threadName" label="线程名称" min-width="200" show-overflow-tooltip />
        <ScTableColumn label="状态" width="120" sortable prop="state">
          <template #default="{ row }">
            <ScTag :type="getStateType(row.state)" size="small">{{ row.state }}</ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn label="CPU 占比" width="140" sortable prop="cpuUsage">
          <template #default="{ row }">
            <ScProgress 
              :percentage="row.cpuUsage || 0"
              :color="getProgressColor(row.cpuUsage || 0)"
              :stroke-width="8"
              :format="(p: number) => p.toFixed(2) + '%'"
            />
          </template>
        </ScTableColumn>
        <ScTableColumn label="CPU 时间" width="100" sortable prop="cpuTime">
          <template #default="{ row }">
            {{ formatNanoTime(row.cpuTime) }}
          </template>
        </ScTableColumn>
        <ScTableColumn label="用户时间" width="100">
          <template #default="{ row }">
            {{ formatNanoTime(row.userTime) }}
          </template>
        </ScTableColumn>
        <ScTableColumn label="守护" width="70">
          <template #default="{ row }">
            <ScTag :type="row.daemon ? 'info' : 'success'" size="small">
              {{ row.daemon ? '是' : '否' }}
            </ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="priority" label="优先级" width="80" />
        <ScTableColumn label="阻塞" width="80" sortable prop="blockedCount">
          <template #default="{ row }">
            <span :class="{ 'danger-text': (row.blockedCount || 0) > 100 }">{{ row.blockedCount || 0 }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="等待" width="80" sortable prop="waitedCount">
          <template #default="{ row }">
            {{ row.waitedCount || 0 }}
          </template>
        </ScTableColumn>
        <ScTableColumn label="锁信息" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.lockName">{{ row.lockName }}</span>
            <span v-else class="text-muted">-</span>
          </template>
        </ScTableColumn>
        <ScTableColumn label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <ScButton type="primary" link size="small" @click="viewThreadStack(row)">
              堆栈
            </ScButton>
          </template>
        </ScTableColumn>
      </ScTable>
    </sc-dialog>

    <!-- 线程堆栈对话框 -->
    <sc-dialog v-model="stackDialogVisible" :title="`线程堆栈 - ${selectedThread?.threadName}`" width="70%" top="5vh">
      <div v-loading="stackLoading">
        <el-descriptions :column="2" border size="small" v-if="selectedThread">
          <el-descriptions-item label="线程 ID">{{ selectedThread.threadId }}</el-descriptions-item>
          <el-descriptions-item label="线程名称">{{ selectedThread.threadName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <ScTag :type="getStateType(selectedThread.state)" size="small">{{ selectedThread.state }}</ScTag>
          </el-descriptions-item>
          <el-descriptions-item label="CPU 时间">{{ formatNanoTime(selectedThread.cpuTime) }}</el-descriptions-item>
          <el-descriptions-item label="阻塞次数/时间">{{ selectedThread.blockedCount }} / {{ formatDuration(selectedThread.blockedTime) }}</el-descriptions-item>
          <el-descriptions-item label="等待次数/时间">{{ selectedThread.waitedCount }} / {{ formatDuration(selectedThread.waitedTime) }}</el-descriptions-item>
          <el-descriptions-item label="锁信息" :span="2" v-if="selectedThread.lockName">
            {{ selectedThread.lockName }}
            <span v-if="selectedThread.lockOwnerName"> (拥有者: {{ selectedThread.lockOwnerName }})</span>
          </el-descriptions-item>
        </el-descriptions>
        <div class="stack-trace-container" v-if="selectedThread?.stackTrace?.length">
          <div class="stack-trace-header">堆栈跟踪</div>
          <div class="stack-trace-content">
            <div v-for="(frame, index) in selectedThread.stackTrace" :key="index" class="stack-frame">
              <span class="frame-index">{{ index }}</span>
              <span class="frame-content">{{ frame }}</span>
            </div>
          </div>
        </div>
        <ScEmpty v-else description="无堆栈信息" />
      </div>
    </sc-dialog>

    <!-- CPU 热点分析对话框 -->
    <sc-dialog v-model="hotspotDialogVisible" title="CPU 热点代码分析" width="90%" top="3vh">
      <div class="hotspot-dialog-toolbar">
        <ScInput 
          v-model="hotspotPackageFilter"
          placeholder="包名过滤 (如: com.example)"
          clearable
          style="width: 200px"
        />
        <ScInputNumber v-model="hotspotSampleCount" :min="5" :max="100" :step="5" style="width: 130px">
          <template #prefix>采样次数</template>
        </ScInputNumber>
        <ScInputNumber v-model="hotspotInterval" :min="10" :max="500" :step="10" style="width: 130px">
          <template #prefix>间隔(ms)</template>
        </ScInputNumber>
        <ScButton type="primary" @click="runHotspotAnalysis" :loading="hotspotLoading">
          <IconifyIconOnline icon="ri:play-line" />
          开始分析
        </ScButton>
      </div>

      <div v-if="hotspotAnalysis" class="hotspot-summary">
        <ScTag type="info">采样 {{ hotspotAnalysis.sampleCount }} 次</ScTag>
        <ScTag type="info">耗时 {{ hotspotAnalysis.sampleDuration }} ms</ScTag>
        <ScTag type="info">分析线程 {{ hotspotAnalysis.threadCount }} 个</ScTag>
      </div>

      <ScTabs v-model="hotspotActiveTab" v-loading="hotspotLoading">
        <ScTabPane label="热点方法" name="methods">
          <ScTable :data="hotspotAnalysis?.hotspots || []" stripe border max-height="50vh">
            <ScTableColumn label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </ScTableColumn>
            <ScTableColumn label="方法" min-width="300">
              <template #default="{ row }">
                <div class="method-cell">
                  <div class="method-name-full" :title="row.fullMethod">
                    <span class="class-name">{{ getSimpleClassName(row.className) }}</span>.<span class="method-name">{{ row.methodName }}</span>()
                  </div>
                  <div class="method-location" v-if="row.fileName">
                    <IconifyIconOnline icon="ri:file-line" />
                    {{ row.fileName }}:{{ row.lineNumber }}
                  </div>
                </div>
              </template>
            </ScTableColumn>
            <ScTableColumn label="占比" width="150" sortable prop="percentage">
              <template #default="{ row }">
                <ScProgress 
                  :percentage="row.percentage || 0"
                  :stroke-width="8"
                  :color="getProgressColor((row.percentage || 0) * 1.5)"
                  :format="(p: number) => p.toFixed(2) + '%'"
                />
              </template>
            </ScTableColumn>
            <ScTableColumn prop="hitCount" label="命中次数" width="100" sortable />
            <ScTableColumn label="调用者" min-width="200">
              <template #default="{ row }">
                <div v-if="row.callers?.length" class="callers-list">
                  <div v-for="caller in row.callers" :key="caller" class="caller-item">{{ caller }}</div>
                </div>
                <span v-else class="text-muted">-</span>
              </template>
            </ScTableColumn>
          </ScTable>
        </ScTabPane>

        <ScTabPane label="热点类" name="classes">
          <ScTable :data="hotspotAnalysis?.classHotspots || []" stripe border max-height="50vh">
            <ScTableColumn label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </ScTableColumn>
            <ScTableColumn prop="className" label="类名" min-width="300" show-overflow-tooltip />
            <ScTableColumn label="占比" width="150" sortable prop="percentage">
              <template #default="{ row }">
                <ScProgress 
                  :percentage="row.percentage || 0"
                  :stroke-width="8"
                  :color="getProgressColor((row.percentage || 0) * 1.5)"
                  :format="(p: number) => p.toFixed(2) + '%'"
                />
              </template>
            </ScTableColumn>
            <ScTableColumn prop="hitCount" label="命中次数" width="100" sortable />
            <ScTableColumn prop="methodCount" label="方法数" width="100" />
          </ScTable>
        </ScTabPane>

        <ScTabPane label="热点包" name="packages">
          <ScTable :data="hotspotAnalysis?.packageHotspots || []" stripe border max-height="50vh">
            <ScTableColumn label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </ScTableColumn>
            <ScTableColumn prop="packageName" label="包名" min-width="300" show-overflow-tooltip />
            <ScTableColumn label="占比" width="150" sortable prop="percentage">
              <template #default="{ row }">
                <ScProgress 
                  :percentage="row.percentage || 0"
                  :stroke-width="8"
                  :color="getProgressColor((row.percentage || 0) * 1.5)"
                  :format="(p: number) => p.toFixed(2) + '%'"
                />
              </template>
            </ScTableColumn>
            <ScTableColumn prop="hitCount" label="命中次数" width="100" sortable />
            <ScTableColumn prop="classCount" label="类数" width="100" />
          </ScTable>
        </ScTabPane>
      </ScTabs>
    </sc-dialog>

    <!-- 业务代码归因分析对话框 -->
    <sc-dialog v-model="businessAnalysisDialogVisible" title="业务代码归因分析" width="90%" top="3vh">
      <div class="hotspot-dialog-toolbar">
        <ScInput 
          v-model="businessPackageFilter"
          placeholder="业务包前缀 (如: com.chua)"
          clearable
          style="width: 200px"
        />
        <ScInputNumber v-model="businessSampleCount" :min="10" :max="100" :step="5" style="width: 130px">
          <template #prefix>采样次数</template>
        </ScInputNumber>
        <ScInputNumber v-model="businessInterval" :min="10" :max="500" :step="10" style="width: 130px">
          <template #prefix>间隔(ms)</template>
        </ScInputNumber>
        <ScButton type="primary" @click="runBusinessAnalysis" :loading="businessAnalysisLoading">
          <IconifyIconOnline icon="ri:play-line" />
          开始分析
        </ScButton>
      </div>

      <div v-if="businessAnalysis" class="hotspot-summary">
        <ScTag type="info">采样 {{ businessAnalysis.sampleCount }} 次</ScTag>
        <ScTag type="info">耗时 {{ businessAnalysis.analysisTime }} ms</ScTag>
        <ScTag type="success">业务包 {{ businessAnalysis.businessPackage }}</ScTag>
      </div>

      <ScTabs v-model="businessActiveTab" v-loading="businessAnalysisLoading">
        <ScTabPane label="CPU 影响" name="cpu">
          <div class="business-analysis-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:cpu-line" />
              业务代码对 CPU 的影响
            </div>
            <ScTable :data="businessAnalysis?.cpuImpacts || []" stripe border max-height="45vh">
              <ScTableColumn label="排名" width="60">
                <template #default="{ $index }">
                  <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="业务方法" min-width="280">
                <template #default="{ row }">
                  <div class="method-cell">
                    <div class="method-name-full" :title="row.businessMethod">
                      <span class="class-name">{{ getSimpleClassName(row.className) }}</span>.<span class="method-name">{{ row.methodName }}</span>()
                    </div>
                    <div class="method-location" v-if="row.fileName">
                      <IconifyIconOnline icon="ri:file-line" />
                      {{ row.fileName }}:{{ row.lineNumber }}
                    </div>
                  </div>
                </template>
              </ScTableColumn>
              <ScTableColumn label="影响占比" width="140" sortable prop="impactPercentage">
                <template #default="{ row }">
                  <ScProgress 
                    :percentage="row.impactPercentage || 0"
                    :stroke-width="8"
                    :color="getProgressColor((row.impactPercentage || 0) * 1.5)"
                    :format="(p: number) => p.toFixed(1) + '%'"
                  />
                </template>
              </ScTableColumn>
              <ScTableColumn prop="impactScore" label="影响分数" width="90" sortable />
              <ScTableColumn prop="callCount" label="调用次数" width="90" sortable />
              <ScTableColumn label="关联热点" min-width="200">
                <template #default="{ row }">
                  <div v-if="row.relatedHotspots?.length" class="callers-list">
                    <div v-for="hp in row.relatedHotspots" :key="hp" class="caller-item">{{ hp }}</div>
                  </div>
                  <span v-else class="text-muted">-</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="描述" min-width="180" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.description }}
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
        </ScTabPane>

        <ScTabPane label="内存影响" name="memory">
          <div class="business-analysis-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:hard-drive-2-line" />
              业务代码对内存的影响
            </div>
            <ScTable :data="businessAnalysis?.memoryImpacts || []" stripe border max-height="45vh">
              <ScTableColumn label="排名" width="60">
                <template #default="{ $index }">
                  <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="业务方法" min-width="280">
                <template #default="{ row }">
                  <div class="method-cell">
                    <div class="method-name-full" :title="row.businessMethod">
                      <span class="class-name">{{ getSimpleClassName(row.className) }}</span>.<span class="method-name">{{ row.methodName }}</span>()
                    </div>
                    <div class="method-location" v-if="row.fileName">
                      <IconifyIconOnline icon="ri:file-line" />
                      {{ row.fileName }}:{{ row.lineNumber }}
                    </div>
                  </div>
                </template>
              </ScTableColumn>
              <ScTableColumn label="影响占比" width="140" sortable prop="impactPercentage">
                <template #default="{ row }">
                  <ScProgress 
                    :percentage="row.impactPercentage || 0"
                    :stroke-width="8"
                    :color="getProgressColor((row.impactPercentage || 0) * 1.5)"
                    :format="(p: number) => p.toFixed(1) + '%'"
                  />
                </template>
              </ScTableColumn>
              <ScTableColumn prop="impactScore" label="影响分数" width="90" sortable />
              <ScTableColumn prop="callCount" label="调用次数" width="90" sortable />
              <ScTableColumn label="内存操作" min-width="200">
                <template #default="{ row }">
                  <div v-if="row.relatedHotspots?.length" class="memory-ops-list">
                    <ScTag v-for="op in row.relatedHotspots" :key="op" size="small" type="warning" class="memory-op-tag">
                      {{ op }}
                    </ScTag>
                  </div>
                  <span v-else class="text-muted">-</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="描述" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.description }}
                </template>
              </ScTableColumn>
            </ScTable>
            <ScEmpty v-if="!businessAnalysis?.memoryImpacts?.length && !businessAnalysisLoading" description="未检测到明显的内存分配" />
          </div>
        </ScTabPane>

        <ScTabPane label="调用链" name="chains">
          <div class="business-analysis-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:flow-chart" />
              业务调用链分析
            </div>
            <ScTable :data="businessAnalysis?.callChains || []" stripe border max-height="45vh">
              <ScTableColumn label="排名" width="60">
                <template #default="{ $index }">
                  <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="业务入口" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="entry-method">{{ row.businessEntry }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="热点方法" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="hotspot-method-text">{{ row.hotspotMethod }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="出现占比" width="140" sortable prop="percentage">
                <template #default="{ row }">
                  <ScProgress 
                    :percentage="row.percentage || 0"
                    :stroke-width="8"
                    :color="getProgressColor((row.percentage || 0) * 1.5)"
                    :format="(p: number) => p.toFixed(1) + '%'"
                  />
                </template>
              </ScTableColumn>
              <ScTableColumn prop="occurrenceCount" label="出现次数" width="90" sortable />
              <ScTableColumn label="调用链路" min-width="300">
                <template #default="{ row }">
                  <div v-if="row.callChain?.length" class="call-chain">
                    <span v-for="(step, idx) in row.callChain" :key="idx" class="chain-step">
                      <span class="step-text">{{ step }}</span>
                      <IconifyIconOnline v-if="idx < row.callChain.length - 1" icon="ri:arrow-right-s-line" class="chain-arrow" />
                    </span>
                  </div>
                  <span v-else class="text-muted">-</span>
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
        </ScTabPane>

        <ScTabPane label="入口点" name="entries">
          <div class="business-analysis-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:login-box-line" />
              业务入口点分析
            </div>
            <ScTable :data="businessAnalysis?.entryPoints || []" stripe border max-height="45vh">
              <ScTableColumn label="排名" width="60">
                <template #default="{ $index }">
                  <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="入口方法" min-width="280">
                <template #default="{ row }">
                  <div class="method-cell">
                    <div class="method-name-full" :title="row.entryMethod">
                      <span class="class-name">{{ getSimpleClassName(row.className) }}</span>.<span class="method-name">{{ row.methodName }}</span>()
                    </div>
                  </div>
                </template>
              </ScTableColumn>
              <ScTableColumn label="入口类型" width="120">
                <template #default="{ row }">
                  <ScTag :type="getEntryTypeTag(row.entryType)" size="small">
                    {{ row.entryType }}
                  </ScTag>
                </template>
              </ScTableColumn>
              <ScTableColumn prop="triggerCount" label="触发次数" width="100" sortable />
              <ScTableColumn prop="cpuImpactScore" label="CPU 影响" width="100" sortable />
              <ScTableColumn prop="relatedHotspotCount" label="关联热点" width="100" />
              <ScTableColumn label="描述" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.description }}
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
        </ScTabPane>
      </ScTabs>
    </sc-dialog>

    <!-- 内存分析对话框 -->
    <sc-dialog v-model="heapDialogVisible" title="堆内存分析" width="90%" top="3vh">
      <div class="hotspot-dialog-toolbar">
        <ScInput 
          v-model="heapPackageFilter"
          placeholder="包名过滤 (如: com.example)"
          clearable
          style="width: 200px"
        />
        <ScButton type="primary" @click="runHeapAnalysis" :loading="heapLoading">
          <IconifyIconOnline icon="ri:play-line" />
          开始分析
        </ScButton>
      </div>

      <div v-if="heapAnalysis" class="hotspot-summary">
        <ScTag type="success">对象总数 {{ formatNumber(heapAnalysis.totalObjects) }}</ScTag>
        <ScTag type="warning">内存占用 {{ formatBytes(heapAnalysis.totalBytes) }}</ScTag>
        <ScTag type="info">类数量 {{ heapAnalysis.classCount }}</ScTag>
        <ScTag type="primary">堆使用 {{ formatBytes(heapAnalysis.heapUsage?.used) }} / {{ formatBytes(heapAnalysis.heapUsage?.max) }}</ScTag>
      </div>

      <ScTabs v-model="heapActiveTab" v-loading="heapLoading">
        <ScTabPane label="按内存排序" name="byBytes">
          <ScTable :data="heapAnalysis?.topByBytes || []" stripe border max-height="50vh">
            <ScTableColumn label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </ScTableColumn>
            <ScTableColumn label="类名" min-width="300">
              <template #default="{ row }">
                <div class="class-cell">
                  <div class="class-simple">{{ row.simpleClassName }}</div>
                  <div class="class-full" v-if="row.className !== row.simpleClassName" :title="row.className">
                    {{ row.className }}
                  </div>
                </div>
              </template>
            </ScTableColumn>
            <ScTableColumn label="内存占比" width="150" sortable prop="percentage">
              <template #default="{ row }">
                <ScProgress 
                  :percentage="row.percentage || 0"
                  :stroke-width="8"
                  :color="getProgressColor((row.percentage || 0) * 2)"
                  :format="(p: number) => p.toFixed(2) + '%'"
                />
              </template>
            </ScTableColumn>
            <ScTableColumn label="占用内存" width="120" sortable prop="bytes">
              <template #default="{ row }">
                {{ formatBytes(row.bytes) }}
              </template>
            </ScTableColumn>
            <ScTableColumn label="实例数" width="120" sortable prop="instanceCount">
              <template #default="{ row }">
                {{ formatNumber(row.instanceCount) }}
              </template>
            </ScTableColumn>
          </ScTable>
        </ScTabPane>

        <ScTabPane label="按数量排序" name="byCount">
          <ScTable :data="heapAnalysis?.topByCount || []" stripe border max-height="50vh">
            <ScTableColumn label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </ScTableColumn>
            <ScTableColumn label="类名" min-width="300">
              <template #default="{ row }">
                <div class="class-cell">
                  <div class="class-simple">{{ row.simpleClassName }}</div>
                  <div class="class-full" v-if="row.className !== row.simpleClassName" :title="row.className">
                    {{ row.className }}
                  </div>
                </div>
              </template>
            </ScTableColumn>
            <ScTableColumn label="实例数" width="120" sortable prop="instanceCount">
              <template #default="{ row }">
                {{ formatNumber(row.instanceCount) }}
              </template>
            </ScTableColumn>
            <ScTableColumn label="占用内存" width="120" sortable prop="bytes">
              <template #default="{ row }">
                {{ formatBytes(row.bytes) }}
              </template>
            </ScTableColumn>
            <ScTableColumn label="内存占比" width="150" sortable prop="percentage">
              <template #default="{ row }">
                <ScProgress 
                  :percentage="row.percentage || 0"
                  :stroke-width="8"
                  :color="getProgressColor((row.percentage || 0) * 2)"
                  :format="(p: number) => p.toFixed(2) + '%'"
                />
              </template>
            </ScTableColumn>
          </ScTable>
        </ScTabPane>

        <ScTabPane label="按包统计" name="byPackage">
          <ScTable :data="heapAnalysis?.packageMemory || []" stripe border max-height="50vh">
            <ScTableColumn label="排名" width="60">
              <template #default="{ $index }">
                <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
              </template>
            </ScTableColumn>
            <ScTableColumn prop="packageName" label="包名" min-width="300" show-overflow-tooltip />
            <ScTableColumn label="内存占比" width="150" sortable prop="percentage">
              <template #default="{ row }">
                <ScProgress 
                  :percentage="row.percentage || 0"
                  :stroke-width="8"
                  :color="getProgressColor((row.percentage || 0) * 2)"
                  :format="(p: number) => p.toFixed(2) + '%'"
                />
              </template>
            </ScTableColumn>
            <ScTableColumn label="占用内存" width="120" sortable prop="bytes">
              <template #default="{ row }">
                {{ formatBytes(row.bytes) }}
              </template>
            </ScTableColumn>
            <ScTableColumn label="实例数" width="120" sortable prop="instanceCount">
              <template #default="{ row }">
                {{ formatNumber(row.instanceCount) }}
              </template>
            </ScTableColumn>
            <ScTableColumn prop="classCount" label="类数" width="100" />
          </ScTable>
        </ScTabPane>
      </ScTabs>
    </sc-dialog>

    <!-- JVM优化建议对话框 -->
    <sc-dialog v-model="optimizationDialogVisible" title="JVM 优化建议" width="90%" top="3vh">
      <div class="hotspot-dialog-toolbar">
        <ScInputNumber v-model="targetLatency" :min="50" :max="1000" :step="50" style="width: 180px">
          <template #prefix>目标延迟(ms)</template>
        </ScInputNumber>
        <ScInputNumber v-model="targetThroughput" :min="80" :max="99" :step="1" style="width: 180px">
          <template #prefix>目标吞吐量(%)</template>
        </ScInputNumber>
        <ScButton type="primary" @click="runOptimizationAnalysis" :loading="optimizationLoading">
          <IconifyIconOnline icon="ri:play-line" />
          重新分析
        </ScButton>
      </div>

      <div v-if="optimizationAdvice" class="optimization-header">
        <div class="health-score" :class="getHealthScoreClass(optimizationAdvice.healthScore)">
          <div class="score-value">{{ optimizationAdvice.healthScore }}</div>
          <div class="score-label">健康评分</div>
        </div>
        <div class="diagnostics-list" v-if="optimizationAdvice.diagnostics?.length">
          <div v-for="(diag, idx) in optimizationAdvice.diagnostics" :key="idx" class="diagnostic-item">
            {{ diag }}
          </div>
        </div>
      </div>

      <ScTabs v-model="optimizationActiveTab" v-loading="optimizationLoading">
        <ScTabPane label="概览" name="overview">
          <div class="optimization-overview" v-if="optimizationAdvice">
            <!-- 推荐启动命令 -->
            <div class="command-section">
              <div class="section-title">
                <IconifyIconOnline icon="ri:terminal-line" />
                推荐启动命令
                <ScButton type="primary" link size="small" @click="copyCommand" style="margin-left: auto">
                  <IconifyIconOnline icon="ri:file-copy-line" />
                  复制
                </ScButton>
              </div>
              <div class="command-text">
                <code>{{ optimizationAdvice.fullCommand }}</code>
              </div>
            </div>

            <!-- 核心建议概要 -->
            <div class="advice-cards">
              <div class="advice-card memory-card">
                <div class="card-icon"><IconifyIconOnline icon="ri:hard-drive-2-line" /></div>
                <div class="card-content">
                  <div class="card-title">内存建议</div>
                  <div class="card-value">-Xmx{{ optimizationAdvice.memoryAdvice?.recommendedHeapSize }}</div>
                  <div class="card-desc">{{ optimizationAdvice.memoryAdvice?.memoryPressureAssessment }}</div>
                </div>
              </div>
              <div class="advice-card gc-card">
                <div class="card-icon"><IconifyIconOnline icon="ri:recycle-line" /></div>
                <div class="card-content">
                  <div class="card-title">GC 建议</div>
                  <div class="card-value">{{ optimizationAdvice.gcAdvice?.recommendedGc }}</div>
                  <div class="card-desc">{{ optimizationAdvice.gcAdvice?.reason }}</div>
                </div>
              </div>
              <div class="advice-card thread-card">
                <div class="card-icon"><IconifyIconOnline icon="ri:stack-line" /></div>
                <div class="card-content">
                  <div class="card-title">线程建议</div>
                  <div class="card-value">-Xss{{ optimizationAdvice.threadAdvice?.recommendedStackSize }}</div>
                  <div class="card-desc">{{ optimizationAdvice.threadAdvice?.threadCountAssessment }}</div>
                </div>
              </div>
            </div>

            <!-- 性能问题 -->
            <div v-if="optimizationAdvice.performanceAdvices?.length" class="performance-issues">
              <div class="section-title">
                <IconifyIconOnline icon="ri:alert-line" />
                性能问题
              </div>
              <div class="issue-list">
                <div v-for="(issue, idx) in optimizationAdvice.performanceAdvices" :key="idx" 
                     class="issue-item" :class="issue.level?.toLowerCase()">
                  <div class="issue-header">
                    <ScTag :type="getIssueLevelType(issue.level)" size="small">{{ issue.category }}</ScTag>
                    <span class="issue-title">{{ issue.title }}</span>
                  </div>
                  <div class="issue-desc">{{ issue.description }}</div>
                  <div class="issue-action">
                    <strong>建议:</strong> {{ issue.action }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScTabPane>

        <ScTabPane label="内存参数" name="memory">
          <div class="param-section" v-if="optimizationAdvice?.memoryAdvice">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="推荐堆大小">{{ optimizationAdvice.memoryAdvice.recommendedHeapSize }}</el-descriptions-item>
              <el-descriptions-item label="推荐初始堆">{{ optimizationAdvice.memoryAdvice.recommendedInitialHeap }}</el-descriptions-item>
              <el-descriptions-item label="推荐新生代">{{ optimizationAdvice.memoryAdvice.recommendedNewGenSize }}</el-descriptions-item>
              <el-descriptions-item label="推荐元空间">{{ optimizationAdvice.memoryAdvice.recommendedMetaspaceSize }}</el-descriptions-item>
              <el-descriptions-item label="当前堆使用率">{{ (optimizationAdvice.memoryAdvice.currentHeapUsage || 0).toFixed(1) }}%</el-descriptions-item>
              <el-descriptions-item label="内存压力评估">{{ optimizationAdvice.memoryAdvice.memoryPressureAssessment }}</el-descriptions-item>
              <el-descriptions-item label="建议说明" :span="2">{{ optimizationAdvice.memoryAdvice.advice }}</el-descriptions-item>
            </el-descriptions>

            <ScTable :data="optimizationAdvice.memoryAdvice.memoryParams || []" stripe border style="margin-top: 16px">
              <ScTableColumn prop="name" label="参数" width="180" />
              <ScTableColumn prop="currentValue" label="当前值" width="120" />
              <ScTableColumn prop="recommendedValue" label="推荐值" width="120">
                <template #default="{ row }">
                  <span class="recommended-value">{{ row.recommendedValue }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="优先级" width="100">
                <template #default="{ row }">
                  <ScTag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</ScTag>
                </template>
              </ScTableColumn>
              <ScTableColumn prop="description" label="说明" min-width="150" />
              <ScTableColumn prop="reason" label="推荐原因" min-width="200" />
            </ScTable>
          </div>
        </ScTabPane>

        <ScTabPane label="GC 参数" name="gc">
          <div class="param-section" v-if="optimizationAdvice?.gcAdvice">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="当前GC收集器">{{ optimizationAdvice.gcAdvice.currentGc || '未知' }}</el-descriptions-item>
              <el-descriptions-item label="推荐GC收集器">
                <span class="recommended-value">{{ optimizationAdvice.gcAdvice.recommendedGc }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="GC频率评估">{{ optimizationAdvice.gcAdvice.gcFrequencyAssessment }}</el-descriptions-item>
              <el-descriptions-item label="GC停顿评估">{{ optimizationAdvice.gcAdvice.gcPauseAssessment }}</el-descriptions-item>
              <el-descriptions-item label="推荐原因" :span="2">{{ optimizationAdvice.gcAdvice.reason }}</el-descriptions-item>
            </el-descriptions>

            <ScTable :data="optimizationAdvice.gcAdvice.gcParams || []" stripe border style="margin-top: 16px">
              <ScTableColumn prop="name" label="参数" width="200" />
              <ScTableColumn prop="currentValue" label="当前值" width="120" />
              <ScTableColumn prop="recommendedValue" label="推荐值" width="120">
                <template #default="{ row }">
                  <span class="recommended-value">{{ row.recommendedValue }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="优先级" width="100">
                <template #default="{ row }">
                  <ScTag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</ScTag>
                </template>
              </ScTableColumn>
              <ScTableColumn prop="description" label="说明" min-width="150" />
              <ScTableColumn prop="reason" label="推荐原因" min-width="200" />
            </ScTable>
          </div>
        </ScTabPane>

        <ScTabPane label="线程参数" name="thread">
          <div class="param-section" v-if="optimizationAdvice?.threadAdvice">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="当前线程数">{{ optimizationAdvice.threadAdvice.currentThreadCount }}</el-descriptions-item>
              <el-descriptions-item label="推荐线程栈大小">
                <span class="recommended-value">{{ optimizationAdvice.threadAdvice.recommendedStackSize }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="线程数评估">{{ optimizationAdvice.threadAdvice.threadCountAssessment }}</el-descriptions-item>
              <el-descriptions-item label="建议说明">{{ optimizationAdvice.threadAdvice.advice }}</el-descriptions-item>
            </el-descriptions>

            <ScTable :data="optimizationAdvice.threadAdvice.threadParams || []" stripe border style="margin-top: 16px">
              <ScTableColumn prop="name" label="参数" width="120" />
              <ScTableColumn prop="currentValue" label="当前值" width="120" />
              <ScTableColumn prop="recommendedValue" label="推荐值" width="120">
                <template #default="{ row }">
                  <span class="recommended-value">{{ row.recommendedValue }}</span>
                </template>
              </ScTableColumn>
              <ScTableColumn label="优先级" width="100">
                <template #default="{ row }">
                  <ScTag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</ScTag>
                </template>
              </ScTableColumn>
              <ScTableColumn prop="description" label="说明" min-width="150" />
              <ScTableColumn prop="reason" label="推荐原因" min-width="200" />
            </ScTable>
          </div>
        </ScTabPane>

        <ScTabPane label="全部参数" name="all">
          <ScTable :data="optimizationAdvice?.recommendedParams || []" stripe border max-height="50vh">
            <ScTableColumn prop="name" label="参数" width="200" />
            <ScTableColumn prop="currentValue" label="当前值" width="120" />
            <ScTableColumn prop="recommendedValue" label="推荐值" width="120">
              <template #default="{ row }">
                <span class="recommended-value">{{ row.recommendedValue }}</span>
              </template>
            </ScTableColumn>
            <ScTableColumn label="类型" width="100">
              <template #default="{ row }">
                <ScTag size="small">{{ row.type }}</ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn label="优先级" width="100">
              <template #default="{ row }">
                <ScTag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn prop="description" label="说明" min-width="150" />
            <ScTableColumn prop="reason" label="推荐原因" min-width="200" />
          </ScTable>
        </ScTabPane>

        <ScTabPane label="当前参数" name="current">
          <div class="current-args">
            <div v-if="optimizationAdvice?.currentArgs?.length" class="args-list">
              <ScTag v-for="(arg, idx) in optimizationAdvice.currentArgs" :key="idx" type="info" class="arg-tag">
                {{ arg }}
              </ScTag>
            </div>
            <ScEmpty v-else description="未获取到当前JVM参数" />
          </div>
        </ScTabPane>
      </ScTabs>
    </sc-dialog>

    <!-- 线程Dump导出对话框 -->
    <sc-dialog v-model="threadDumpDialogVisible" title="线程 Dump" width="80%" top="3vh">
      <div class="hotspot-dialog-toolbar">
        <ScButton type="primary" @click="runThreadDump" :loading="threadDumpLoading">
          <IconifyIconOnline icon="ri:refresh-line" />
          重新获取
        </ScButton>
        <ScButton type="success" @click="downloadThreadDump" :disabled="!threadDumpData">
          <IconifyIconOnline icon="ri:download-line" />
          下载
        </ScButton>
        <ScButton @click="copyThreadDump" :disabled="!threadDumpData">
          <IconifyIconOnline icon="ri:file-copy-line" />
          复制
        </ScButton>
      </div>

      <div v-if="threadDumpData" class="thread-dump-summary">
        <el-descriptions :column="4" border>
          <el-descriptions-item label="生成时间">{{ formatTime(threadDumpData.timestamp) }}</el-descriptions-item>
          <el-descriptions-item label="JVM">
            {{ threadDumpData.jvmName }} {{ threadDumpData.jvmVersion }}
          </el-descriptions-item>
          <el-descriptions-item label="线程数">{{ threadDumpData.threadCount }}</el-descriptions-item>
          <el-descriptions-item label="死锁数">
            <ScTag :type="(threadDumpData.deadlockedCount || 0) > 0 ? 'danger' : 'success'">
              {{ threadDumpData.deadlockedCount || 0 }}
            </ScTag>
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <ScTabs v-model="threadDumpActiveTab" v-loading="threadDumpLoading">
        <ScTabPane label="线程列表" name="threads">
          <ScTable :data="threadDumpData?.threads || []" stripe border max-height="50vh">
            <ScTableColumn prop="threadId" label="ID" width="80" />
            <ScTableColumn prop="threadName" label="线程名" min-width="200" show-overflow-tooltip />
            <ScTableColumn label="状态" width="100">
              <template #default="{ row }">
                <ScTag :type="getThreadStateType(row.state)" size="small">{{ row.state }}</ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn label="守护" width="70">
              <template #default="{ row }">
                <ScTag v-if="row.daemon" type="info" size="small">是</ScTag>
                <span v-else>-</span>
              </template>
            </ScTableColumn>
            <ScTableColumn prop="priority" label="优先级" width="80" />
            <ScTableColumn prop="lockInfo" label="等待锁" min-width="200" show-overflow-tooltip />
            <ScTableColumn label="堆栈" width="100">
              <template #default="{ row }">
                <ScButton type="primary" link @click="showThreadDumpStack(row)">
                  查看({{ row.stackTrace?.length || 0 }})
                </ScButton>
              </template>
            </ScTableColumn>
          </ScTable>
        </ScTabPane>

        <ScTabPane label="文本格式" name="text">
          <pre class="thread-dump-text">{{ threadDumpData?.dumpContent || '暂无数据' }}</pre>
        </ScTabPane>
      </ScTabs>
    </sc-dialog>

    <!-- 线程Dump堆栈详情 -->
    <sc-dialog v-model="threadDumpStackVisible" title="线程堆栈详情" width="70%">
      <div v-if="selectedDumpThread" class="thread-stack-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="线程ID">{{ selectedDumpThread.threadId }}</el-descriptions-item>
          <el-descriptions-item label="线程名">{{ selectedDumpThread.threadName }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <ScTag :type="getThreadStateType(selectedDumpThread.state)">{{ selectedDumpThread.state }}</ScTag>
          </el-descriptions-item>
          <el-descriptions-item label="优先级">{{ selectedDumpThread.priority }}</el-descriptions-item>
          <el-descriptions-item label="等待锁" :span="2">{{ selectedDumpThread.lockInfo || '-' }}</el-descriptions-item>
          <el-descriptions-item label="锁持有者" :span="2">{{ selectedDumpThread.lockOwner || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedDumpThread.lockedMonitors?.length" style="margin-top: 12px">
          <div class="section-title">持有的监视器</div>
          <ScTag v-for="(m, i) in selectedDumpThread.lockedMonitors" :key="i" style="margin: 4px">{{ m }}</ScTag>
        </div>

        <div v-if="selectedDumpThread.lockedSynchronizers?.length" style="margin-top: 12px">
          <div class="section-title">持有的同步器</div>
          <ScTag v-for="(s, i) in selectedDumpThread.lockedSynchronizers" :key="i" style="margin: 4px" type="warning">{{ s }}</ScTag>
        </div>

        <div style="margin-top: 12px">
          <div class="section-title">堆栈跟踪</div>
          <pre class="stack-trace-text">{{ (selectedDumpThread.stackTrace || []).map(s => '\tat ' + s).join('\n') || '无堆栈信息' }}</pre>
        </div>
      </div>
    </sc-dialog>

    <!-- 内存泄漏检测对话框 -->
    <sc-dialog v-model="memoryLeakDialogVisible" title="内存泄漏检测" width="85%" top="3vh">
      <div class="hotspot-dialog-toolbar">
        <ScInputNumber v-model="leakIntervalSeconds" :min="3" :max="60" :step="1" style="width: 180px">
          <template #prefix>检测间隔(秒)</template>
        </ScInputNumber>
        <ScInputNumber v-model="leakTopN" :min="10" :max="100" :step="10" style="width: 150px">
          <template #prefix>显示数量</template>
        </ScInputNumber>
        <ScButton type="primary" @click="runMemoryLeakAnalysis" :loading="memoryLeakLoading">
          <IconifyIconOnline icon="ri:play-line" />
          开始检测
        </ScButton>
      </div>

      <ScAlert 
        v-if="memoryLeakLoading"
        type="info"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        正在采集内存快照，请等待 {{ leakIntervalSeconds }} 秒...
      </ScAlert>

      <div v-if="memoryLeakAnalysis" class="memory-leak-result">
        <div class="leak-summary">
          <div class="leak-risk" :class="'risk-' + (memoryLeakAnalysis.leakRiskLevel || 'LOW').toLowerCase()">
            <div class="risk-level">
              <IconifyIconOnline :icon="getLeakRiskIcon(memoryLeakAnalysis.leakRiskLevel)" class="risk-icon" />
              <span>风险等级: {{ memoryLeakAnalysis.leakRiskLevel }}</span>
            </div>
            <div class="risk-conclusion">{{ memoryLeakAnalysis.conclusion }}</div>
          </div>

          <el-descriptions :column="4" border style="margin-top: 12px">
            <el-descriptions-item label="第一次快照">{{ formatTime(memoryLeakAnalysis.firstSnapshotTime) }}</el-descriptions-item>
            <el-descriptions-item label="第二次快照">{{ formatTime(memoryLeakAnalysis.secondSnapshotTime) }}</el-descriptions-item>
            <el-descriptions-item label="间隔时间">{{ ((memoryLeakAnalysis.intervalMs || 0) / 1000).toFixed(1) }}秒</el-descriptions-item>
            <el-descriptions-item label="堆增长">
              <span :class="{'text-danger': (memoryLeakAnalysis.heapGrowthPercent || 0) > 10}">
                {{ formatBytes(memoryLeakAnalysis.heapGrowth) }} ({{ (memoryLeakAnalysis.heapGrowthPercent || 0).toFixed(1) }}%)
              </span>
            </el-descriptions-item>
          </el-descriptions>

          <div v-if="memoryLeakAnalysis.suggestions?.length" class="leak-suggestions">
            <div class="section-title">
              <IconifyIconOnline icon="ri:lightbulb-line" />
              建议
            </div>
            <ul>
              <li v-for="(s, i) in memoryLeakAnalysis.suggestions" :key="i">{{ s }}</li>
            </ul>
          </div>
        </div>

        <div class="section-title" style="margin-top: 16px">
          <IconifyIconOnline icon="ri:bar-chart-box-line" />
          增长最快的对象
        </div>
        <ScTable :data="memoryLeakAnalysis.growingObjects || []" stripe border max-height="45vh">
          <ScTableColumn label="排名" width="60">
            <template #default="{ $index }">
              <span :class="['rank-badge', `rank-${$index + 1}`]">{{ $index + 1 }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn prop="simpleClassName" label="类名" min-width="250" show-overflow-tooltip />
          <ScTableColumn label="内存增长" width="130" sortable prop="bytesGrowth">
            <template #default="{ row }">
              <span class="text-danger">+{{ formatBytes(row.bytesGrowth) }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn label="内存增长率" width="120">
            <template #default="{ row }">
              <span :class="{'text-danger': (row.bytesGrowthPercent || 0) > 50}">
                {{ (row.bytesGrowthPercent || 0).toFixed(1) }}%
              </span>
            </template>
          </ScTableColumn>
          <ScTableColumn label="实例增长" width="100" sortable prop="countGrowth">
            <template #default="{ row }">
              <span class="text-warning">+{{ formatNumber(row.countGrowth) }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn label="第一次" width="100">
            <template #default="{ row }">{{ formatNumber(row.firstCount) }}</template>
          </ScTableColumn>
          <ScTableColumn label="第二次" width="100">
            <template #default="{ row }">{{ formatNumber(row.secondCount) }}</template>
          </ScTableColumn>
        </ScTable>
      </div>

      <ScEmpty v-else-if="!memoryLeakLoading" description="点击“开始检测”进行内存泄漏分析" />
    </sc-dialog>

    <!-- JVM诊断信息对话框 -->
    <sc-dialog v-model="diagnosticDialogVisible" title="JVM 诊断信息" width="85%" top="3vh">
      <div class="hotspot-dialog-toolbar">
        <ScCheckbox v-model="includeEnvVars">包含环境变量</ScCheckbox>
        <ScButton type="primary" @click="runDiagnostic" :loading="diagnosticLoading">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </ScButton>
      </div>

      <ScTabs v-model="diagnosticActiveTab" v-loading="diagnosticLoading">
        <ScTabPane label="VM Flags" name="flags">
          <ScTable :data="diagnosticInfo?.vmFlags || []" stripe border max-height="50vh">
            <ScTableColumn prop="name" label="参数名" min-width="250" show-overflow-tooltip />
            <ScTableColumn prop="value" label="值" min-width="150" show-overflow-tooltip />
            <ScTableColumn prop="origin" label="来源" width="150">
              <template #default="{ row }">
                <ScTag :type="getFlagOriginType(row.origin)" size="small">{{ row.origin }}</ScTag>
              </template>
            </ScTableColumn>
          </ScTable>
        </ScTabPane>

        <ScTabPane label="系统属性" name="sysProps">
          <ScTable :data="Object.entries(diagnosticInfo?.systemProperties || {}).map(([k, v]) => ({key: k, value: v}))" stripe border max-height="50vh">
            <ScTableColumn prop="key" label="属性名" width="200" />
            <ScTableColumn prop="value" label="值" min-width="400" show-overflow-tooltip />
          </ScTable>
        </ScTabPane>

        <ScTabPane label="环境变量" name="envVars" v-if="includeEnvVars && diagnosticInfo?.environmentVariables">
          <ScTable :data="Object.entries(diagnosticInfo?.environmentVariables || {}).map(([k, v]) => ({key: k, value: v}))" stripe border max-height="50vh">
            <ScTableColumn prop="key" label="变量名" width="200" />
            <ScTableColumn prop="value" label="值" min-width="400" show-overflow-tooltip />
          </ScTable>
        </ScTabPane>

        <ScTabPane label="类加载器" name="classLoaders">
          <ScTable :data="diagnosticInfo?.classLoaders || []" stripe border max-height="50vh">
            <ScTableColumn prop="name" label="名称" width="200" />
            <ScTableColumn prop="type" label="类型" min-width="300" show-overflow-tooltip />
            <ScTableColumn prop="parent" label="父加载器" min-width="250" show-overflow-tooltip />
          </ScTable>
        </ScTabPane>

        <ScTabPane label="内存池" name="memoryPools">
          <ScTable :data="diagnosticInfo?.memoryPoolDetails || []" stripe border max-height="50vh">
            <ScTableColumn prop="name" label="名称" width="200" />
            <ScTableColumn prop="type" label="类型" width="100">
              <template #default="{ row }">
                <ScTag :type="row.type === 'HEAP' ? 'success' : 'info'" size="small">{{ row.type }}</ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn label="当前使用" width="150">
              <template #default="{ row }">
                <ScProgress 
                  :percentage="row.usage?.usagePercent || 0"
                  :stroke-width="8"
                  :color="getProgressColor(row.usage?.usagePercent || 0)"
                  :format="(p: number) => p.toFixed(0) + '%'"
                />
              </template>
            </ScTableColumn>
            <ScTableColumn label="已用/最大" min-width="150">
              <template #default="{ row }">
                {{ formatBytes(row.usage?.used) }} / {{ formatBytes(row.usage?.max) }}
              </template>
            </ScTableColumn>
            <ScTableColumn label="峰值" width="120">
              <template #default="{ row }">{{ formatBytes(row.peakUsage?.used) }}</template>
            </ScTableColumn>
            <ScTableColumn label="超阈值" width="80">
              <template #default="{ row }">
                <ScTag v-if="row.usageThresholdExceeded" type="danger" size="small">是</ScTag>
                <span v-else>-</span>
              </template>
            </ScTableColumn>
          </ScTable>
        </ScTabPane>

        <ScTabPane label="VM命令" name="vmCommands">
          <div class="vm-command-section">
            <div class="command-selector">
              <ScSelect v-model="selectedVmCommand" placeholder="选择命令" style="width: 200px">
                <ScOption label="vmFlags - VM参数" value="vmFlags" />
                <ScOption label="vmInfo - VM信息" value="vmInfo" />
                <ScOption label="vmVersion - VM版本" value="vmVersion" />
                <ScOption label="vmCommandLine - 启动命令" value="vmCommandLine" />
                <ScOption label="vmUptime - 运行时间" value="vmUptime" />
                <ScOption label="gcHeapInfo - GC堆信息" value="gcHeapInfo" />
                <ScOption label="vmSystemProperties - 系统属性" value="vmSystemProperties" />
                <ScOption label="threadPrint - 线程信息" value="threadPrint" />
              </ScSelect>
              <ScButton type="primary" @click="runVmCommand" :loading="vmCommandLoading">
                <IconifyIconOnline icon="ri:terminal-line" />
                执行
              </ScButton>
            </div>
            <pre class="vm-command-output">{{ vmCommandOutput || '选择命令并点击执行' }}</pre>
          </div>
        </ScTabPane>
      </ScTabs>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">

import ScTabPane from "@repo/components/ScTabs";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { ScMessage, ScMessageBox } from "@repo/utils";
import { fetchJvmInfo, triggerGc, fetchThreadDetails, fetchThreadDetail, analyzeCpuHotspots, analyzeHeap, analyzeBusinessCode, getJvmOptimization, getThreadDump, analyzeMemoryLeak, getJvmDiagnostic, executeVmCommand, type JvmInfo, type ThreadDetail, type CpuHotspotAnalysis, type HeapAnalysis, type BusinessCodeAnalysis, type JvmOptimizationAdvice, type ThreadDump, type ThreadDumpDetail, type MemoryLeakAnalysis, type JvmDiagnostic } from "../api/jvm";

defineOptions({
  name: "JvmInfoIndex"
});

const loading = ref(false);
const gcLoading = ref(false);
const autoRefresh = ref(false);
const jvmInfo = ref<JvmInfo>({});
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 线程列表相关
const threadDialogVisible = ref(false);
const threadsLoading = ref(false);
const allThreads = ref<ThreadDetail[]>([]);
const threadSearchKey = ref("");
const threadStateFilter = ref("");

// 线程堆栈相关
const stackDialogVisible = ref(false);
const stackLoading = ref(false);
const selectedThread = ref<ThreadDetail | null>(null);

// CPU 热点分析相关
const hotspotLoading = ref(false);
const hotspotDialogVisible = ref(false);
const hotspotAnalysis = ref<CpuHotspotAnalysis | null>(null);
const hotspotSampleCount = ref(20);
const hotspotInterval = ref(50);
const hotspotPackageFilter = ref("");
const hotspotActiveTab = ref("methods");

// 内存分析相关
const heapLoading = ref(false);
const heapDialogVisible = ref(false);
const heapAnalysis = ref<HeapAnalysis | null>(null);
const heapPackageFilter = ref("");
const heapActiveTab = ref("byBytes");

// 业务代码归因分析相关
const businessAnalysisLoading = ref(false);
const businessAnalysisDialogVisible = ref(false);
const businessAnalysis = ref<BusinessCodeAnalysis | null>(null);
const businessPackageFilter = ref("com.chua");
const businessSampleCount = ref(30);
const businessInterval = ref(50);
const businessActiveTab = ref("cpu");

// JVM优化建议相关
const optimizationLoading = ref(false);
const optimizationDialogVisible = ref(false);
const optimizationAdvice = ref<JvmOptimizationAdvice | null>(null);
const targetLatency = ref(200);
const targetThroughput = ref(95);
const optimizationActiveTab = ref("overview");

// 线程Dump相关
const threadDumpLoading = ref(false);
const threadDumpDialogVisible = ref(false);
const threadDumpData = ref<ThreadDump | null>(null);
const threadDumpActiveTab = ref("threads");
const threadDumpStackVisible = ref(false);
const selectedDumpThread = ref<ThreadDumpDetail | null>(null);

// 内存泄漏检测相关
const memoryLeakLoading = ref(false);
const memoryLeakDialogVisible = ref(false);
const memoryLeakAnalysis = ref<MemoryLeakAnalysis | null>(null);
const leakIntervalSeconds = ref(5);
const leakTopN = ref(20);

// JVM诊断相关
const diagnosticLoading = ref(false);
const diagnosticDialogVisible = ref(false);
const diagnosticInfo = ref<JvmDiagnostic | null>(null);
const diagnosticActiveTab = ref("flags");
const diagnosticOverviewTab = ref("flags");
const includeEnvVars = ref(false);
const selectedVmCommand = ref("vmFlags");
const vmCommandLoading = ref(false);
const vmCommandOutput = ref("");

/**
 * 过滤后的线程列表
 */
const filteredThreads = computed(() => {
  let threads = allThreads.value;
  if (threadSearchKey.value) {
    const key = threadSearchKey.value.toLowerCase();
    threads = threads.filter(t => t.threadName?.toLowerCase().includes(key));
  }
  if (threadStateFilter.value) {
    threads = threads.filter(t => t.state === threadStateFilter.value);
  }
  return threads;
});

/**
 * 线程状态分布数据
 */
const threadStateItems = computed(() => {
  const dist = jvmInfo.value.threadStateDistribution;
  const total = dist?.totalCount || 1;
  return [
    { name: 'RUNNABLE', count: dist?.runnableCount || 0, percent: ((dist?.runnableCount || 0) / total) * 100, color: '#67C23A' },
    { name: 'WAITING', count: dist?.waitingCount || 0, percent: ((dist?.waitingCount || 0) / total) * 100, color: '#909399' },
    { name: 'TIMED_WAITING', count: dist?.timedWaitingCount || 0, percent: ((dist?.timedWaitingCount || 0) / total) * 100, color: '#E6A23C' },
    { name: 'BLOCKED', count: dist?.blockedCount || 0, percent: ((dist?.blockedCount || 0) / total) * 100, color: '#F56C6C' },
    { name: 'NEW', count: dist?.newCount || 0, percent: ((dist?.newCount || 0) / total) * 100, color: '#409EFF' },
  ].filter(s => s.count > 0);
});

/**
 * 过滤线程
 */
const filterThreads = () => {
  // 触发 computed 重新计算
};

/**
 * 加载 JVM 信息
 */
const loadData = async () => {
  loading.value = true;
  try {
    const res = await fetchJvmInfo();
    if (res.success) {
      jvmInfo.value = res.data || {};
    } else {
      ScMessage.error(res.msg || "获取 JVM 信息失败");
    }
  } catch (error) {
    ScMessage.error("获取 JVM 信息失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 手动 GC
 */
const handleGc = async () => {
  try {
    await ScMessageBox.confirm(
      "确定要执行手动垃圾回收吗？这可能会导致短暂的性能波动。",
      "确认执行 GC",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    gcLoading.value = true;
    const res = await triggerGc();
    if (res.success) {
      ScMessage.success(res.data || "GC 执行成功");
      await loadData();
    } else {
      ScMessage.error(res.msg || "GC 执行失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      ScMessage.error("GC 执行失败");
    }
  } finally {
    gcLoading.value = false;
  }
};

/**
 * 获取GC总次数
 */
const getTotalGcCount = () => {
  if (!jvmInfo.value.garbageCollectors) return 0;
  return jvmInfo.value.garbageCollectors.reduce((sum, gc) => sum + (gc.collectionCount || 0), 0);
};

/**
 * 获取GC总时间
 */
const getTotalGcTime = () => {
  if (!jvmInfo.value.garbageCollectors) return 0;
  return jvmInfo.value.garbageCollectors.reduce((sum, gc) => sum + (gc.collectionTime || 0), 0);
};

/**
 * 格式化字节
 */
const formatBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === null || bytes < 0) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * 格式化时间戳
 */
const formatTime = (timestamp?: number) => {
  if (!timestamp) return "-";
  return new Date(timestamp).toLocaleString();
};

/**
 * 格式化时长
 */
const formatDuration = (ms?: number) => {
  if (ms === undefined || ms === null) return "-";
  if (ms < 1000) return `${ms} ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}天 ${hours % 24}时 ${minutes % 60}分`;
  } else if (hours > 0) {
    return `${hours}时 ${minutes % 60}分 ${seconds % 60}秒`;
  } else if (minutes > 0) {
    return `${minutes}分 ${seconds % 60}秒`;
  } else {
    return `${seconds}秒`;
  }
};

/**
 * 格式化数字
 */
const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return "-";
  return num.toLocaleString();
};

/**
 * 获取进度条颜色
 */
const getProgressColor = (percentage: number) => {
  if (percentage < 60) return "#67C23A";
  if (percentage < 80) return "#E6A23C";
  return "#F56C6C";
};

/**
 * 格式化纳秒时间
 */
const formatNanoTime = (ns?: number) => {
  if (ns === undefined || ns === null) return "-";
  if (ns < 1000000) return `${(ns / 1000).toFixed(2)} μs`;
  if (ns < 1000000000) return `${(ns / 1000000).toFixed(2)} ms`;
  return `${(ns / 1000000000).toFixed(2)} s`;
};

/**
 * 获取线程状态标签类型
 */
const getStateType = (state?: string) => {
  switch (state) {
    case "RUNNABLE": return "success";
    case "BLOCKED": return "danger";
    case "WAITING": return "warning";
    case "TIMED_WAITING": return "warning";
    case "NEW": return "info";
    case "TERMINATED": return "info";
    default: return "info";
  }
};

/**
 * 查看所有线程
 */
const showAllThreads = async () => {
  threadDialogVisible.value = true;
  await loadAllThreads();
};

/**
 * 加载所有线程
 */
const loadAllThreads = async () => {
  threadsLoading.value = true;
  try {
    const res = await fetchThreadDetails(200, false);
    if (res.success) {
      allThreads.value = res.data || [];
    } else {
      ScMessage.error(res.msg || "获取线程列表失败");
    }
  } catch (error) {
    ScMessage.error("获取线程列表失败");
  } finally {
    threadsLoading.value = false;
  }
};

/**
 * 查看线程堆栈
 */
const viewThreadStack = async (thread: ThreadDetail) => {
  selectedThread.value = thread;
  stackDialogVisible.value = true;
  stackLoading.value = true;
  try {
    const res = await fetchThreadDetail(thread.threadId!);
    if (res.success) {
      selectedThread.value = res.data || thread;
    } else {
      ScMessage.error(res.msg || "获取线程堆栈失败");
    }
  } catch (error) {
    ScMessage.error("获取线程堆栈失败");
  } finally {
    stackLoading.value = false;
  }
};

/**
 * 运行热点分析
 */
const runHotspotAnalysis = async () => {
  hotspotLoading.value = true;
  try {
    const res = await analyzeCpuHotspots(
      hotspotSampleCount.value,
      hotspotInterval.value,
      30,
      true,
      hotspotPackageFilter.value || undefined
    );
    if (res.success) {
      hotspotAnalysis.value = res.data || null;
    } else {
      ScMessage.error(res.msg || "CPU 热点分析失败");
    }
  } catch (error) {
    ScMessage.error("CPU 热点分析失败");
  } finally {
    hotspotLoading.value = false;
  }
};

/**
 * 显示热点分析对话框
 */
const showHotspotDialog = () => {
  hotspotDialogVisible.value = true;
  if (!hotspotAnalysis.value) {
    runHotspotAnalysis();
  }
};

/**
 * 获取简化类名
 */
const getSimpleClassName = (className?: string) => {
  if (!className) return "";
  const lastDot = className.lastIndexOf(".");
  return lastDot > 0 ? className.substring(lastDot + 1) : className;
};

/**
 * 获取入口类型标签颜色
 */
const getEntryTypeTag = (entryType?: string) => {
  switch (entryType) {
    case "Controller": return "primary";
    case "Service": return "success";
    case "Scheduler": return "warning";
    case "MessageListener": return "danger";
    case "Filter": return "info";
    case "Interceptor": return "info";
    case "Repository": return "";
    default: return "info";
  }
};

/**
 * 显示内存分析对话框
 */
const showHeapDialog = () => {
  heapDialogVisible.value = true;
  if (!heapAnalysis.value) {
    runHeapAnalysis();
  }
};

/**
 * 运行内存分析
 */
const runHeapAnalysis = async () => {
  heapLoading.value = true;
  try {
    const res = await analyzeHeap(50, heapPackageFilter.value || undefined);
    if (res.success) {
      heapAnalysis.value = res.data || null;
    } else {
      ScMessage.error(res.msg || "内存分析失败");
    }
  } catch (error) {
    ScMessage.error("内存分析失败");
  } finally {
    heapLoading.value = false;
  }
};

/**
 * 显示业务代码归因分析对话框
 */
const showBusinessAnalysisDialog = () => {
  businessAnalysisDialogVisible.value = true;
  if (!businessAnalysis.value) {
    runBusinessAnalysis();
  }
};

/**
 * 运行业务代码归因分析
 */
const runBusinessAnalysis = async () => {
  businessAnalysisLoading.value = true;
  try {
    const res = await analyzeBusinessCode(
      businessPackageFilter.value,
      businessSampleCount.value,
      businessInterval.value,
      20
    );
    if (res.success) {
      businessAnalysis.value = res.data || null;
    } else {
      ScMessage.error(res.msg || "业务代码归因分析失败");
    }
  } catch (error) {
    ScMessage.error("业务代码归因分析失败");
  } finally {
    businessAnalysisLoading.value = false;
  }
};

/**
 * 显示JVM优化建议对话框
 */
const showOptimizationDialog = () => {
  optimizationDialogVisible.value = true;
  if (!optimizationAdvice.value) {
    runOptimizationAnalysis();
  }
};

/**
 * 运行JVM优化分析
 */
const runOptimizationAnalysis = async () => {
  optimizationLoading.value = true;
  try {
    const res = await getJvmOptimization(targetLatency.value, targetThroughput.value);
    if (res.success) {
      optimizationAdvice.value = res.data || null;
    } else {
      ScMessage.error(res.msg || "JVM优化分析失败");
    }
  } catch (error) {
    ScMessage.error("JVM优化分析失败");
  } finally {
    optimizationLoading.value = false;
  }
};

/**
 * 获取健康评分类名
 */
const getHealthScoreClass = (score?: number) => {
  if (!score) return "score-low";
  if (score >= 80) return "score-high";
  if (score >= 60) return "score-medium";
  return "score-low";
};

/**
 * 获取问题级别类型
 */
const getIssueLevelType = (level?: string) => {
  switch (level) {
    case "CRITICAL": return "danger";
    case "WARNING": return "warning";
    case "INFO": return "info";
    default: return "info";
  }
};

/**
 * 获取优先级类型
 */
const getPriorityType = (priority?: string) => {
  switch (priority) {
    case "HIGH": return "danger";
    case "MEDIUM": return "warning";
    case "LOW": return "info";
    default: return "info";
  }
};

/**
 * 复制启动命令
 */
const copyCommand = async () => {
  if (optimizationAdvice.value?.fullCommand) {
    try {
      await navigator.clipboard.writeText(optimizationAdvice.value.fullCommand);
      ScMessage.success("启动命令已复制到剪贴板");
    } catch (error) {
      ScMessage.error("复制失败");
    }
  }
};

// ==================== 线程Dump相关方法 ====================

/**
 * 显示线程Dump对话框
 */
const showThreadDumpDialog = () => {
  threadDumpDialogVisible.value = true;
  if (!threadDumpData.value) {
    runThreadDump();
  }
};

/**
 * 获取线程Dump
 */
const runThreadDump = async () => {
  threadDumpLoading.value = true;
  try {
    const res = await getThreadDump();
    if (res.success) {
      threadDumpData.value = res.data || null;
    } else {
      ScMessage.error(res.msg || "获取线程Dump失败");
    }
  } catch (error) {
    ScMessage.error("获取线程Dump失败");
  } finally {
    threadDumpLoading.value = false;
  }
};

/**
 * 下载线程Dump
 */
const downloadThreadDump = () => {
  if (!threadDumpData.value?.dumpContent) return;
  const blob = new Blob([threadDumpData.value.dumpContent], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `thread-dump-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  ScMessage.success("线程Dump已下载");
};

/**
 * 复制线程Dump
 */
const copyThreadDump = async () => {
  if (!threadDumpData.value?.dumpContent) return;
  try {
    await navigator.clipboard.writeText(threadDumpData.value.dumpContent);
    ScMessage.success("线程Dump已复制到剪贴板");
  } catch (error) {
    ScMessage.error("复制失败");
  }
};

/**
 * 显示线程Dump堆栈详情
 */
const showThreadDumpStack = (thread: ThreadDumpDetail) => {
  selectedDumpThread.value = thread;
  threadDumpStackVisible.value = true;
};

/**
 * 获取线程状态类型
 */
const getThreadStateType = (state?: string) => {
  switch (state) {
    case "RUNNABLE": return "success";
    case "BLOCKED": return "danger";
    case "WAITING": return "warning";
    case "TIMED_WAITING": return "info";
    case "NEW": return "info";
    case "TERMINATED": return "";
    default: return "info";
  }
};

// ==================== 内存泄漏检测相关方法 ====================

/**
 * 显示内存泄漏检测对话框
 */
const showMemoryLeakDialog = () => {
  memoryLeakDialogVisible.value = true;
};

/**
 * 运行内存泄漏分析
 */
const runMemoryLeakAnalysis = async () => {
  memoryLeakLoading.value = true;
  memoryLeakAnalysis.value = null;
  try {
    const res = await analyzeMemoryLeak(leakIntervalSeconds.value, leakTopN.value);
    if (res.success) {
      memoryLeakAnalysis.value = res.data || null;
    } else {
      ScMessage.error(res.msg || "内存泄漏检测失败");
    }
  } catch (error) {
    ScMessage.error("内存泄漏检测失败");
  } finally {
    memoryLeakLoading.value = false;
  }
};

/**
 * 获取泄漏风险图标
 */
const getLeakRiskIcon = (level?: string) => {
  switch (level) {
    case "HIGH": return "ri:error-warning-fill";
    case "MEDIUM": return "ri:alert-fill";
    case "LOW": return "ri:checkbox-circle-fill";
    default: return "ri:information-fill";
  }
};

// ==================== JVM诊断相关方法 ====================

/**
 * 显示JVM诊断对话框
 */
const showDiagnosticDialog = () => {
  diagnosticDialogVisible.value = true;
  if (!diagnosticInfo.value) {
    runDiagnostic();
  }
};

/**
 * 获取JVM诊断信息
 */
const runDiagnostic = async () => {
  diagnosticLoading.value = true;
  try {
    const res = await getJvmDiagnostic(includeEnvVars.value);
    if (res.success) {
      diagnosticInfo.value = res.data || null;
    } else {
      ScMessage.error(res.msg || "获取JVM诊断信息失败");
    }
  } catch (error) {
    ScMessage.error("获取JVM诊断信息失败");
  } finally {
    diagnosticLoading.value = false;
  }
};

/**
 * 执行VM命令
 */
const runVmCommand = async () => {
  if (!selectedVmCommand.value) {
    ScMessage.warning("请选择命令");
    return;
  }
  vmCommandLoading.value = true;
  try {
    const res = await executeVmCommand(selectedVmCommand.value);
    if (res.success) {
      vmCommandOutput.value = res.data || "执行完成，无输出";
    } else {
      vmCommandOutput.value = res.msg || "执行失败";
    }
  } catch (error) {
    vmCommandOutput.value = "执行失败";
  } finally {
    vmCommandLoading.value = false;
  }
};

/**
 * 获取Flag来源类型
 */
const getFlagOriginType = (origin?: string) => {
  if (origin?.includes("command")) return "danger";
  if (origin?.includes("ergonomic")) return "warning";
  if (origin?.includes("management")) return "success";
  return "info";
};

/**
 * 监听自动刷新
 */
const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  if (autoRefresh.value) {
    refreshTimer = setInterval(() => {
      loadData();
    }, 5000);
  }
};

// 监听自动刷新开关
import { watch } from "vue";
watch(autoRefresh, () => {
  startAutoRefresh();
});

onMounted(() => {
  loadData();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style lang="scss" scoped>
.jvm-info-container {
  padding: 20px;
  min-height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
}

.page-header {
  margin-bottom: 20px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title-section {
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #303133;
      margin: 0 0 8px 0;
      display: flex;
      align-items: center;
      gap: 10px;

      .title-icon {
        font-size: 28px;
        color: var(--el-color-primary);
      }
    }

    .page-subtitle {
      font-size: 14px;
      color: #909399;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// 仪表板概览样式
.dashboard-overview {
  margin-bottom: 4px;

  .metric-cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 16px;

    @media (max-width: 1200px) {
      grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .metric-card {
    display: flex;
    align-items: center;
    padding: 16px;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    gap: 12px;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .metric-card-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      flex-shrink: 0;
    }

    .metric-card-content {
      flex: 1;
      min-width: 0;

      .metric-card-value {
        font-size: 20px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
      }

      .metric-card-label {
        font-size: 12px;
        color: #909399;
        margin-top: 2px;
      }

      .metric-card-detail {
        font-size: 11px;
        color: #c0c4cc;
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .thread-mini-stats {
      font-size: 12px;
      color: #909399;

      .danger {
        color: #f56c6c;
        font-weight: 600;
      }
    }

    &.cpu-card {
      .metric-card-icon {
        background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
        color: #fff;
      }
    }

    &.memory-card {
      .metric-card-icon {
        background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
        color: #fff;
      }
    }

    &.thread-card {
      .metric-card-icon {
        background: linear-gradient(135deg, #e6a23c 0%, #f0b86c 100%);
        color: #fff;
      }
    }

    &.class-card {
      .metric-card-icon {
        background: linear-gradient(135deg, #909399 0%, #b4b4b4 100%);
        color: #fff;
      }
    }

    &.gc-card {
      .metric-card-icon {
        background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%);
        color: #fff;
      }
    }

    &.uptime-card {
      .metric-card-icon {
        background: linear-gradient(135deg, #9b59b6 0%, #b07cc6 100%);
        color: #fff;
      }
    }
  }
}

.info-card {
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  :deep(.el-card__header) {
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
  }
}

.gauge-container {
  display: flex;
  justify-content: space-around;
  padding: 20px 0;
}

.gauge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  .gauge-label {
    font-size: 14px;
    color: #606266;
    font-weight: 500;
  }

  .gauge-detail {
    font-size: 12px;
    color: #909399;
  }
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 20px;
  padding: 20px;
}

.metric-item {
  text-align: center;

  .metric-value {
    font-size: 28px;
    font-weight: 600;
    color: var(--el-color-primary);

    &.danger {
      color: var(--el-color-danger);
    }
  }

  .metric-label {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
  }
}

.args-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 0;

  .arg-tag {
    max-width: 100%;
    word-break: break-all;
  }
}

:deep(.el-progress__text) {
  font-size: 16px !important;
  font-weight: 500;
}

:deep(.el-descriptions__label) {
  font-weight: 500;
  width: 120px;
}

.danger-text {
  color: var(--el-color-danger);
  font-weight: 600;
}

.text-muted {
  color: #909399;
}

.thread-dialog-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.stack-trace-container {
  margin-top: 16px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  overflow: hidden;

  .stack-trace-header {
    padding: 10px 16px;
    background: #f5f7fa;
    font-weight: 500;
    color: #303133;
    border-bottom: 1px solid #ebeef5;
  }

  .stack-trace-content {
    max-height: 400px;
    overflow-y: auto;
    background: #fafafa;
  }

  .stack-frame {
    display: flex;
    padding: 6px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f0f7ff;
    }

    .frame-index {
      width: 30px;
      color: #909399;
      flex-shrink: 0;
    }

    .frame-content {
      color: #303133;
      word-break: break-all;
    }
  }
}

// 热点分析样式
.hotspot-quick-view {
  min-height: 200px;

  .hotspot-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .hotspot-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: #fafafa;
    border-radius: 6px;
    transition: background 0.2s;

    &:hover {
      background: #f0f7ff;
    }
  }

  .hotspot-rank {
    width: 24px;
    height: 24px;
    background: var(--el-color-primary-light-7);
    color: var(--el-color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .hotspot-info {
    flex: 1;
    min-width: 0;
  }

  .hotspot-method {
    font-size: 13px;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .method-class {
      color: #606266;
    }

    .method-name {
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }

  .hotspot-location {
    font-size: 11px;
    color: #909399;
    margin-top: 2px;
  }

  .hotspot-stats {
    flex-shrink: 0;
  }

  .hotspot-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 180px;
    color: #909399;

    p {
      margin-top: 12px;
      font-size: 13px;
    }
  }
}

.hotspot-dialog-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.hotspot-summary {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  background: #e4e7ed;
  color: #909399;

  &.rank-1 {
    background: #ffd700;
    color: #fff;
  }

  &.rank-2 {
    background: #c0c0c0;
    color: #fff;
  }

  &.rank-3 {
    background: #cd7f32;
    color: #fff;
  }
}

.method-cell {
  .method-name-full {
    font-size: 13px;

    .class-name {
      color: #606266;
    }

    .method-name {
      color: var(--el-color-primary);
      font-weight: 500;
    }
  }

  .method-location {
    font-size: 11px;
    color: #909399;
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
}

.callers-list {
  .caller-item {
    font-size: 11px;
    color: #606266;
    padding: 2px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:not(:last-child) {
      border-bottom: 1px dashed #ebeef5;
    }
  }
}

.class-cell {
  .class-simple {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-color-primary);
  }

  .class-full {
    font-size: 11px;
    color: #909399;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

// 业务代码归因分析样式
.business-analysis-section {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
  }
}

.memory-ops-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;

  .memory-op-tag {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.call-chain {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;

  .chain-step {
    display: inline-flex;
    align-items: center;
  }

  .step-text {
    font-size: 11px;
    color: #606266;
    padding: 2px 6px;
    background: #f5f7fa;
    border-radius: 4px;
  }

  .chain-arrow {
    color: #c0c4cc;
    font-size: 14px;
    margin: 0 2px;
  }
}

.entry-method {
  color: var(--el-color-success);
  font-weight: 500;
}

.hotspot-method-text {
  color: var(--el-color-danger);
  font-weight: 500;
}

// JVM优化建议样式
.optimization-header {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
}

.health-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  flex-shrink: 0;

  .score-value {
    font-size: 36px;
    font-weight: 700;
  }

  .score-label {
    font-size: 12px;
    margin-top: 4px;
  }

  &.score-high {
    background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    color: #fff;
  }

  &.score-medium {
    background: linear-gradient(135deg, #e6a23c 0%, #f0b86c 100%);
    color: #fff;
  }

  &.score-low {
    background: linear-gradient(135deg, #f56c6c 0%, #f89898 100%);
    color: #fff;
  }
}

.diagnostics-list {
  flex: 1;

  .diagnostic-item {
    padding: 6px 12px;
    margin-bottom: 6px;
    background: #fff;
    border-radius: 4px;
    font-size: 13px;
    color: #606266;
    border-left: 3px solid var(--el-color-primary);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.optimization-overview {
  .command-section {
    margin-bottom: 24px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .command-text {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;

      code {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 13px;
        word-break: break-all;
        white-space: pre-wrap;
      }
    }
  }

  .advice-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }

  .advice-card {
    display: flex;
    padding: 16px;
    border-radius: 8px;
    gap: 12px;

    .card-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .card-content {
      flex: 1;
    }

    .card-title {
      font-size: 13px;
      color: #909399;
      margin-bottom: 4px;
    }

    .card-value {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 6px;
    }

    .card-desc {
      font-size: 12px;
      color: #909399;
    }

    &.memory-card {
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      .card-icon, .card-value { color: #4caf50; }
    }

    &.gc-card {
      background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
      .card-icon, .card-value { color: #2196f3; }
    }

    &.thread-card {
      background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
      .card-icon, .card-value { color: #ff9800; }
    }
  }

  .performance-issues {
    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .issue-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .issue-item {
      padding: 12px 16px;
      border-radius: 6px;
      border-left: 4px solid;

      &.critical {
        background: #fef0f0;
        border-color: #f56c6c;
      }

      &.warning {
        background: #fdf6ec;
        border-color: #e6a23c;
      }

      &.info {
        background: #f4f4f5;
        border-color: #909399;
      }

      .issue-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }

      .issue-title {
        font-weight: 500;
        color: #303133;
      }

      .issue-desc {
        font-size: 13px;
        color: #606266;
        margin-bottom: 6px;
      }

      .issue-action {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.param-section {
  padding: 8px 0;
}

.recommended-value {
  color: var(--el-color-success);
  font-weight: 600;
}

.current-args {
  .args-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;

    .arg-tag {
      max-width: 100%;
      word-break: break-all;
    }
  }
}

// 线程Dump样式
.thread-dump-summary {
  margin-bottom: 16px;
}

.thread-dump-text {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  max-height: 50vh;
  overflow: auto;
  white-space: pre;
}

.thread-stack-detail {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 8px;
  }
}

.stack-trace-text {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  max-height: 40vh;
  overflow: auto;
  white-space: pre;
}

// 内存泄漏检测样式
.memory-leak-result {
  .leak-summary {
    margin-bottom: 16px;
  }

  .leak-risk {
    padding: 16px;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .risk-level {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
    }

    .risk-icon {
      font-size: 24px;
    }

    .risk-conclusion {
      font-size: 14px;
    }

    &.risk-high {
      background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
      color: #f56c6c;
    }

    &.risk-medium {
      background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
      color: #e6a23c;
    }

    &.risk-low {
      background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
      color: #67c23a;
    }
  }

  .leak-suggestions {
    margin-top: 12px;
    padding: 12px;
    background: #f5f7fa;
    border-radius: 6px;

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 8px;
    }

    ul {
      margin: 0;
      padding-left: 20px;

      li {
        font-size: 13px;
        color: #606266;
        margin-bottom: 4px;
      }
    }
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 15px;
    font-weight: 500;
    color: #303133;
    margin-bottom: 12px;
  }

  .text-danger {
    color: #f56c6c;
    font-weight: 500;
  }

  .text-warning {
    color: #e6a23c;
    font-weight: 500;
  }
}

// JVM诊断样式
.vm-command-section {
  .command-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .vm-command-output {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 16px;
    border-radius: 6px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    max-height: 50vh;
    overflow: auto;
    white-space: pre;
    min-height: 200px;
  }
}

// 概览面板样式
.empty-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #909399;

  p {
    margin-top: 12px;
    font-size: 13px;
  }
}

// 线程Dump概览样式
.thread-dump-overview {
  .dump-stats {
    display: flex;
    gap: 24px;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: #f5f7fa;
    border-radius: 8px;

    .dump-stat-item {
      text-align: center;

      .stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }

      &.danger {
        .stat-value {
          color: #f56c6c;
        }
      }
    }
  }
}

// 内存泄漏概览样式
.memory-leak-overview {
  .leak-risk-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 16px;

    .risk-icon {
      font-size: 32px;
      flex-shrink: 0;
    }

    .risk-info {
      flex: 1;

      .risk-level {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 4px;
      }

      .risk-conclusion {
        font-size: 13px;
      }
    }

    .risk-stats {
      text-align: right;
      font-size: 12px;

      div {
        margin-bottom: 4px;
      }
    }

    &.risk-high {
      background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
      color: #f56c6c;
    }

    &.risk-medium {
      background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
      color: #e6a23c;
    }

    &.risk-low {
      background: linear-gradient(135deg, #f0f9eb 0%, #e1f3d8 100%);
      color: #67c23a;
    }
  }

  .text-danger {
    color: #f56c6c;
    font-weight: 500;
  }

  .text-warning {
    color: #e6a23c;
    font-weight: 500;
  }
}

// 诊断信息概览样式
.diagnostic-overview {
  .compact-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__content) {
      padding: 8px 0 0 0;
    }
  }
}

// 缓冲池样式
.buffer-pool-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;

  .buffer-pool-item {
    .pool-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;

      .pool-name {
        font-weight: 500;
        color: #303133;
        font-size: 14px;
      }

      .pool-count {
        font-size: 12px;
        color: #909399;
      }
    }

    .pool-stats {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #606266;
      margin-bottom: 8px;
    }
  }
}

// 文件描述符样式
.fd-info {
  padding: 8px 0;

  .fd-usage-text {
    text-align: center;
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
  }
}

// 线程状态分布样式
.thread-state-chart {
  padding: 8px 0;

  .state-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .state-bar-item {
    .state-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;

      .state-name {
        font-size: 13px;
        color: #606266;
        font-weight: 500;
      }

      .state-count {
        font-size: 13px;
        color: #303133;
        font-weight: 600;
      }
    }
  }

  .state-summary {
    margin-top: 12px;
    text-align: center;
    font-size: 12px;
    color: #909399;
  }
}

// JIT编译统计样式
.jit-stats {
  padding: 8px 0;
}

// 代码缓存样式
.code-cache-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }
}

.code-cache-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 16px 0;

  .cache-progress {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .cache-label {
      font-size: 14px;
      color: #606266;
      font-weight: 500;
    }
  }

  .cache-details {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .cache-detail-item {
      display: flex;
      justify-content: space-between;
      gap: 24px;

      .label {
        font-size: 13px;
        color: #909399;
      }

      .value {
        font-size: 13px;
        color: #303133;
        font-weight: 500;
      }
    }
  }
}

// GC统计样式
.gc-stats-panel {
  padding: 8px 0;

  .gc-overview {
    display: flex;
    justify-content: space-around;
    text-align: center;

    .gc-stat-item {
      .gc-stat-value {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }

      .gc-stat-label {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .gc-detail-stats {
    .gc-type-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;

      .gc-type-label {
        font-size: 13px;
        color: #606266;
      }

      .gc-type-value {
        font-size: 13px;
        color: #303133;
        font-weight: 500;
      }
    }
  }
}

// 元空间样式
.metaspace-panel {
  padding: 8px 0;

  .metaspace-main {
    display: flex;
    align-items: center;
    gap: 20px;

    .metaspace-details {
      flex: 1;

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;

        .label {
          font-size: 13px;
          color: #909399;
        }

        .value {
          font-size: 13px;
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }

  .compressed-class-space {
    .ccs-header {
      font-size: 13px;
      font-weight: 500;
      color: #606266;
      margin-bottom: 8px;
    }

    .ccs-detail {
      font-size: 12px;
      color: #909399;
      margin-top: 4px;
      text-align: right;
    }
  }
}

// 直接内存样式
.direct-memory-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }
}

.direct-memory-panel {
  display: flex;
  gap: 40px;
  padding: 8px 0;
  flex-wrap: wrap;

  .direct-memory-section {
    flex: 1;
    min-width: 200px;

    .dm-title {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 12px;
    }

    .dm-stats {
      display: flex;
      gap: 24px;

      .dm-stat {
        .label {
          font-size: 12px;
          color: #909399;
          display: block;
        }

        .value {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }

  .max-direct-memory {
    width: 100%;
    text-align: center;
    font-size: 12px;
    color: #909399;
    padding-top: 8px;
    border-top: 1px solid #ebeef5;
    margin-top: 8px;
  }
}

.text-danger {
  color: #f56c6c !important;
}

// 内存分配速率样式
.memory-allocation-card {
  grid-column: span 2;

  @media (max-width: 768px) {
    grid-column: span 1;
  }
}

.memory-allocation-panel {
  .allocation-sections {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .allocation-section {
      .section-title {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
      }

      .section-detail {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;

        .label {
          color: #909399;
        }

        .value {
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }

  .rate-stats {
    display: flex;
    justify-content: center;
    gap: 60px;

    .rate-item {
      text-align: center;

      .rate-label {
        display: block;
        font-size: 13px;
        color: #909399;
        margin-bottom: 4px;
      }

      .rate-value {
        font-size: 16px;
        font-weight: 600;
        color: #409eff;
      }
    }
  }
}

// 类加载详情样式
.class-loading-detail-card {
  flex: 1;
  min-width: 300px;

  .highlight-value {
    font-weight: 600;
    color: #409eff;
  }
}

// 安全管理器样式
.security-info-card {
  flex: 1;
  min-width: 280px;

  .mono-text {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    word-break: break-all;
  }

  .security-tip {
    margin-top: 12px;
  }
}
</style>
