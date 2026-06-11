<template>
  <TuiProvider>
    <div class="bigscreen-layout bigscreen-layout--preview">
      <TuiThemeToggle class="bigscreen-theme-toggle" />

      <div class="bigscreen-body">
        <div class="bigscreen-canvas-area">
          <div class="bigscreen-canvas-viewport" style="width: 1920px; height: 1080px;">
            <div class="bigscreen-canvas">
              <!-- 网格背景 -->
              <svg class="bigscreen-canvas__grid">
                <defs>
                  <pattern id="grid-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0, 246, 255, 0.08)" stroke-width="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>

              <!-- ===== 顶部标题 ===== -->
              <div class="widget-item" style="position: absolute; left: 0px; top: 0px; width: 1920px; height: 80px;">
                <div class="widget-item__body">
                  <ScifiHeaderA1 title="数据可视化大屏" sub-title="DATA VISUALIZATION" />
                </div>
              </div>

              <!-- ===== 左上面板 A1 ===== -->
              <div class="widget-item" style="position: absolute; left: 20px; top: 100px; width: 460px; height: 300px;">
                <div class="widget-item__body">
                  <ScifiPanelA1 title="系统指标" :background-opacity="0.75">
                    <div class="panel-content">
                      <div class="metric-row">
                        <span class="metric-label">CPU</span>
                        <span class="metric-value" style="color: #00ffff;">45.2%</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">内存</span>
                        <span class="metric-value" style="color: #22c55e;">62.8%</span>
                      </div>
                      <div class="metric-row">
                        <span class="metric-label">网络</span>
                        <span class="metric-value" style="color: #3b82f6;">1.2 Gbps</span>
                      </div>
                    </div>
                  </ScifiPanelA1>
                </div>
              </div>

              <!-- ===== 中上面板 A2 ===== -->
              <div class="widget-item" style="position: absolute; left: 500px; top: 100px; width: 920px; height: 300px;">
                <div class="widget-item__body">
                  <ScifiPanelA2 title="实时数据流" :background-opacity="0.75">
                    <div class="panel-content chart-placeholder">
                      <div class="chart-area">
                        <svg viewBox="0 0 800 200" width="100%" height="100%">
                          <polyline fill="none" stroke="#00ffff" stroke-width="2"
                            points="0,180 40,160 80,170 120,120 160,140 200,80 240,100 280,60 320,90 360,40 400,70 440,30 480,50 520,20 560,45 600,25 640,35 680,15 720,30 760,10 800,20" />
                          <polyline fill="none" stroke="#3b82f6" stroke-width="1.5" opacity="0.5"
                            points="0,160 40,140 80,150 120,100 160,120 200,60 240,80 280,40 320,70 360,20 400,50 440,10 480,30 520,5 560,25 600,15 640,20 680,8 720,18 760,5 800,10" />
                        </svg>
                      </div>
                    </div>
                  </ScifiPanelA2>
                </div>
              </div>

              <!-- ===== 右上面板 DV1 ===== -->
              <div class="widget-item" style="position: absolute; left: 1440px; top: 100px; width: 460px; height: 300px;">
                <div class="widget-item__body">
                  <ScifiPanelDV1 title="告警信息" :background-opacity="0.75">
                    <div class="panel-content">
                      <div class="alert-item" style="color: #ef4444;">⚠ 节点延迟 > 500ms</div>
                      <div class="alert-item" style="color: #f59e0b;">⚠ 磁盘使用率 85%</div>
                      <div class="alert-item" style="color: #22c55e;">✓ 所有服务正常</div>
                    </div>
                  </ScifiPanelDV1>
                </div>
              </div>

              <!-- ===== 中排左面板 B1 ===== -->
              <div class="widget-item" style="position: absolute; left: 20px; top: 420px; width: 460px; height: 300px;">
                <div class="widget-item__body">
                  <ScifiPanelB1 title="节点拓扑" :background-opacity="0.75">
                    <div class="panel-content">
                      <div class="topo-row">
                        <span class="topo-dot" style="background: #10b981;"></span>
                        <span>采集节点 (12)</span>
                      </div>
                      <div class="topo-row">
                        <span class="topo-dot" style="background: #3b82f6;"></span>
                        <span>处理节点 (8)</span>
                      </div>
                      <div class="topo-row">
                        <span class="topo-dot" style="background: #8b5cf6;"></span>
                        <span>输出节点 (6)</span>
                      </div>
                    </div>
                  </ScifiPanelB1>
                </div>
              </div>

              <!-- ===== 中排中面板 B2 ===== -->
              <div class="widget-item" style="position: absolute; left: 500px; top: 420px; width: 920px; height: 300px;">
                <div class="widget-item__body">
                  <ScifiPanelB2 title="架构图" :background-opacity="0.75">
                    <div class="panel-content">
                      <div class="arch-flow">
                        <div class="arch-node" style="--nc: #10b981;">
                          <span class="arch-badge">SOURCE</span>
                          <span class="arch-label">数据源</span>
                        </div>
                        <div class="arch-arrow">→</div>
                        <div class="arch-node" style="--nc: #3b82f6;">
                          <span class="arch-badge">COLLECT</span>
                          <span class="arch-label">采集层</span>
                        </div>
                        <div class="arch-arrow">→</div>
                        <div class="arch-node" style="--nc: #8b5cf6;">
                          <span class="arch-badge">PIPELINE</span>
                          <span class="arch-label">管线层</span>
                        </div>
                        <div class="arch-arrow">→</div>
                        <div class="arch-node" style="--nc: #f59e0b;">
                          <span class="arch-badge">SINK</span>
                          <span class="arch-label">存储层</span>
                        </div>
                      </div>
                    </div>
                  </ScifiPanelB2>
                </div>
              </div>

              <!-- ===== 中排右面板 DV2 ===== -->
              <div class="widget-item" style="position: absolute; left: 1440px; top: 420px; width: 460px; height: 300px;">
                <div class="widget-item__body">
                  <ScifiPanelDV2 title="数据统计" :background-opacity="0.75">
                    <div class="panel-content">
                      <div class="stat-big">1,284,592</div>
                      <div class="stat-sub">今日处理数据量</div>
                      <div class="stat-bar">
                        <div class="stat-bar-fill" style="width: 72%;"></div>
                      </div>
                      <div class="stat-footer">较昨日 +12.4%</div>
                    </div>
                  </ScifiPanelDV2>
                </div>
              </div>

              <!-- ===== 底部装饰线 ===== -->
              <div class="widget-item" style="position: absolute; left: 20px; top: 740px; width: 1880px; height: 30px;">
                <div class="widget-item__body">
                  <ScifiDecoA1 width="100%" height="30" />
                </div>
              </div>

              <!-- ===== 底部左侧面板 A3 ===== -->
              <div class="widget-item" style="position: absolute; left: 20px; top: 790px; width: 600px; height: 260px;">
                <div class="widget-item__body">
                  <ScifiPanelA3 title="管线状态" :background-opacity="0.75">
                    <div class="panel-content">
                      <div class="pipeline-status">
                        <span class="status-tag running">运行中 (4)</span>
                        <span class="status-tag paused">已暂停 (2)</span>
                        <span class="status-tag error">异常 (1)</span>
                      </div>
                    </div>
                  </ScifiPanelA3>
                </div>
              </div>

              <!-- ===== 底部中间面板 B3 ===== -->
              <div class="widget-item" style="position: absolute; left: 640px; top: 790px; width: 640px; height: 260px;">
                <div class="widget-item__body">
                  <ScifiPanelB3 title="实时日志" :background-opacity="0.75">
                    <div class="panel-content log-area">
                      <div class="log-line">[INFO] 管线 pipeline-1 处理完成</div>
                      <div class="log-line">[WARN] 节点 parse-3 延迟 120ms</div>
                      <div class="log-line">[INFO] 数据下沉至 clickhouse</div>
                    </div>
                  </ScifiPanelB3>
                </div>
              </div>

              <!-- ===== 底部右侧面板 B4 ===== -->
              <div class="widget-item" style="position: absolute; left: 1300px; top: 790px; width: 600px; height: 260px;">
                <div class="widget-item__body">
                  <ScifiPanelB4 title="订阅客户端" :background-opacity="0.75">
                    <div class="panel-content">
                      <div class="client-row">
                        <ScifiGeomHexagon width="24" height="24" />
                        <span>Web Console</span>
                      </div>
                      <div class="client-row">
                        <ScifiGeomHexagon width="24" height="24" />
                        <span>Data Sink #1</span>
                      </div>
                      <div class="client-row">
                        <ScifiGeomHexagon width="24" height="24" />
                        <span>Monitor Agent</span>
                      </div>
                    </div>
                  </ScifiPanelB4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TuiProvider>
</template>

<script setup lang="ts">
import { ScifiHeaderA1, ScifiPanelA1, ScifiPanelA2, ScifiPanelA3, ScifiPanelB1, ScifiPanelB2, ScifiPanelB3, ScifiPanelB4, ScifiPanelDV1, ScifiPanelDV2, ScifiDecoA1, ScifiGeomHexagon, TuiProvider, TuiThemeToggle } from "@techui/scifi";
</script>

<style scoped>
.bigscreen-layout {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: transparent;
}
.bigscreen-layout--preview {
  background: transparent;
}
.bigscreen-theme-toggle {
  position: absolute;
  right: 18px;
  top: 9px;
  z-index: 10;
}
.bigscreen-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.bigscreen-canvas-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: 20px;
}
.bigscreen-canvas-viewport {
  flex-shrink: 0;
  overflow: hidden;
}
.bigscreen-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.bigscreen-canvas__grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  width: 100%;
  height: 100%;
}
.widget-item {
  position: absolute;
  box-sizing: border-box;
}
.widget-item__body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 面板内容样式 */
.panel-content {
  padding: 16px;
  color: #94a3b8;
  font-size: 13px;
}
.metric-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 246, 255, 0.06);
}
.metric-label { color: #64748b; }
.metric-value { font-weight: 600; font-family: "JetBrains Mono", monospace; }
.chart-placeholder { padding: 8px; height: calc(100% - 16px); }
.chart-area { width: 100%; height: 100%; }
.alert-item { padding: 6px 0; font-size: 12px; }
.topo-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
.topo-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.arch-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
}
.arch-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--nc) 40%, transparent);
  border-radius: 8px;
  background: color-mix(in srgb, var(--nc) 8%, transparent);
}
.arch-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--nc);
  font-family: "JetBrains Mono", monospace;
}
.arch-label { font-size: 12px; color: #e2e8f0; }
.arch-arrow { color: #64748b; font-size: 18px; }
.stat-big {
  font-size: 32px;
  font-weight: 700;
  color: #00ffff;
  font-family: "JetBrains Mono", monospace;
}
.stat-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
.stat-bar {
  margin-top: 12px;
  height: 4px;
  background: rgba(0, 246, 255, 0.1);
  border-radius: 2px;
}
.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #6366f1);
  border-radius: 2px;
}
.stat-footer { font-size: 11px; color: #64748b; margin-top: 8px; }
.pipeline-status { display: flex; gap: 8px; }
.status-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
}
.status-tag.running { background: rgba(34,197,94,0.12); color: #22c55e; border: 1px solid rgba(34,197,94,0.2); }
.status-tag.paused { background: rgba(245,158,11,0.12); color: #f59e0b; border: 1px solid rgba(245,158,11,0.2); }
.status-tag.error { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.2); }
.log-area { font-family: "JetBrains Mono", monospace; font-size: 11px; }
.log-line { padding: 3px 0; color: #94a3b8; }
.client-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; }
</style>
