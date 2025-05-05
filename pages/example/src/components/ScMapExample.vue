<template>
  <div class="sc-map-example">
    <h2>ScMap 地图组件示例</h2>

    <div class="example-content">
      <!-- 左侧地图区域 -->
      <div class="map-area">
        <div class="map-container">
          <sc-map ref="mapRef" :layer-type="'NORMAL'" :map-type="config.mapType" :center="config.center"
            :zoom="config.zoom" :height="`${config.height}px`" :dragging="config.dragging"
            :scroll-wheel-zoom="config.scrollWheelZoom" :url="config.apiKey ? undefined : undefined"
            :api-key="config.apiKey" :toolbar-config="toolbarConfig" :show-toolbar="config.showToolbar"
            :aggregation-config="aggregationConfig" :heat-map-config="config.heatMapConfig"
            :migration-impl="migrationImpl" @tool-activated="onToolActivated" @tool-deactivated="onToolDeactivated"
            @update:zoom="onZoomChange" @update:center="onCenterChange" @shape-click="onShapeClick"
            @shape-created="onShapeCreated" @shape-removed="onShapeRemoved" @marker-click="onMarkerClick"
            @marker-created="onMarkerCreated" @marker-removed="onMarkerRemoved" @map-click="onMapClick">
            <!-- 自定义标记点弹窗模板 -->
            <template #marker="{ latlng, data }">
              <div class="simple-popup">
                <div class="simple-popup-content">
                  <div class="simple-data-row">
                    <span class="simple-label">位置:</span>
                    <span class="simple-value">{{ latlng.lat.toFixed(4) }}, {{ latlng.lng.toFixed(4) }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 自定义形状弹窗模板 -->
            <template #shape="{ data, type }">
              <div class="simple-popup">
                <div class="simple-popup-content">
                  <div class="simple-data-row">
                    <span class="simple-label">形状类型:</span>
                    <span class="simple-value">{{ getShapeTypeName(type) }}</span>
                  </div>
                  <div class="simple-data-row" v-if="data.name">
                    <span class="simple-label">名称:</span>
                    <span class="simple-value">{{ data.name }}</span>
                  </div>
                  <div class="simple-data-row" v-if="data.description">
                    <span class="simple-label">描述:</span>
                    <span class="simple-value">{{ data.description }}</span>
                  </div>
                  <div class="simple-data-row" v-if="data.id">
                    <span class="simple-label">ID:</span>
                    <span class="simple-value">{{ data.id }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 自定义形状弹窗标题 -->
            <template #shape-header="{ data }">
              <div class="custom-shape-header">
                <span class="shape-title">{{ data.name || '图形详情' }}</span>
                <span class="shape-tag" v-if="data.category">{{ data.category }}</span>
              </div>
            </template>
          </sc-map>
        </div>
      </div>

      <!-- 右侧配置区域 -->
      <div class="config-area thin-scrollbar">
        <h3>配置参数</h3>

        <div class="config-section">
          <div class="config-item">
            <div class="label">交互控制</div>
            <div class="controls">
              <div class="control-row">
                <span>可拖动:</span>
                <el-switch v-model="config.dragging" />
                <span class="status-text">{{ config.dragging ? '开启' : '关闭' }}</span>
              </div>
              <div class="control-row">
                <span>滚轮缩放:</span>
                <el-switch v-model="config.scrollWheelZoom" />
                <span class="status-text">{{ config.scrollWheelZoom ? '开启' : '关闭' }}</span>
              </div>
              <div class="control-row">
                <span>缩放级别:</span>
                <el-slider v-model="config.zoom" :min="3" :max="18" :step="1" @change="updateZoom" />
                <span class="value">{{ config.zoom }}</span>
              </div>
              <div class="control-row">
                <span>飞线级别:</span>
                <el-button size="small" @click="() => {
                  config.zoom = 5;
                  updateZoom(5);
               }"></el-button>
              </div>
              <div class="control-row">
                <span>飞线视图:</span>
                <el-button size="small" type="primary" @click="setOptimalZoomForMigration">
                  设置飞线最佳视图
                </el-button>
              </div>
            </div>
          </div>

          <div class="config-item">
            <div class="label">工具栏设置</div>
            <div class="controls">
              <div class="control-row">
                <span>显示工具栏:</span>
                <el-switch v-model="config.showToolbar" />
              </div>
              <div class="control-row buttons-row" v-if="config.showToolbar">
                <span>工具栏位置:</span>
                <el-radio-group v-model="toolbarSettings.position" size="small">
                  <el-radio-button label="top-left">左上角</el-radio-button>
                  <el-radio-button label="top-right">右上角</el-radio-button>
                  <el-radio-button label="bottom-left">左下角</el-radio-button>
                  <el-radio-button label="bottom-right">右下角</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>排列方向:</span>
                <el-radio-group v-model="toolbarSettings.direction" size="small">
                  <el-radio-button label="horizontal">横向</el-radio-button>
                  <el-radio-button label="vertical">纵向</el-radio-button>
                </el-radio-group>
              </div>
              <div class="control-row" v-if="config.showToolbar">
                <span>每行工具数:</span>
                <el-slider v-model="toolbarSettings.itemsPerLine" :min="1" :max="10" :step="1" />
                <span class="value">{{ toolbarSettings.itemsPerLine }}</span>
              </div>
            </div>
          </div>

          <!-- 添加标记点操作区域 -->
          <div class="config-item">
            <div class="label">标记点操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" @click="addRandomMarkers(3)">添加随机标记</el-button>
                <el-button size="small" @click="clearAllMarkers">清除所有标记</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addRandomMarkers(10)" type="primary">添加多个随机点位</el-button>
                <el-button size="small" @click="addRandomMarkersWithCount">自定义添加点位</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addMarkerGroup('group1', 'red')">添加红色组</el-button>
                <el-button size="small" @click="addMarkerGroup('group2', 'blue')">添加蓝色组</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addMarkersWithAutoLabel">添加自动显示标签</el-button>
                <el-button size="small" @click="addMarkersWithCustomClick">添加自定义点击</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="toggleGroupVisibility('group1')">
                  {{ groupVisible.group1 ? '隐藏红色组' : '显示红色组' }}
                </el-button>
                <el-button size="small" @click="toggleGroupVisibility('group2')">
                  {{ groupVisible.group2 ? '隐藏蓝色组' : '显示蓝色组' }}
                </el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="toggleAllMarkers">
                  {{ allMarkersVisible ? '隐藏所有标记' : '显示所有标记' }}
                </el-button>
                <el-button size="small" @click="toggleAllLabels">
                  {{ allLabelsVisible ? '隐藏所有标签' : '显示所有标签' }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- 添加形状操作区域 -->
          <div class="config-item">
            <div class="label">形状操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" @click="addCircle">添加圆形</el-button>
                <el-button size="small" @click="addRectangle">添加矩形</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addPolygon">添加多边形</el-button>
                <el-button size="small" @click="addPolyline">添加折线</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addNamedShapes">添加命名形状</el-button>
                <el-button size="small" @click="clearAllShapes">清除所有形状</el-button>
              </div>
            </div>
          </div>

          <!-- 添加轨迹操作区域 -->
          <div class="config-item">
            <div class="label">轨迹操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" @click="addSampleTrack">添加示例轨迹</el-button>
                <el-button size="small" @click="clearAllTracks">清除所有轨迹</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addMultipleTracks">添加多条轨迹</el-button>
                <el-button size="small" @click="addCircularTrack">添加环形轨迹</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addZigzagTrack">添加Z字形轨迹</el-button>
                <el-button size="small" @click="addRandomTrack">添加随机轨迹</el-button>
              </div>
            </div>
          </div>

          <!-- 添加一个新的路径数据操作区域，放在飞线图操作区域之后 -->
          <div class="config-item">
            <div class="label">飞线图操作</div>
            <div class="controls">
              <!-- 添加飞线图功能开关 -->
              <div class="control-row">
                <span>启用飞线图:</span>
                <el-switch v-model="migrationSettings.enabled" @change="toggleMigrationFeature" />
              </div>

              <!-- 飞线图数据和配置按钮 -->
              <div class="control-row buttons-row">
                <el-button size="small" @click="addSampleMigration" :disabled="!migrationSettings.enabled">
                  添加飞线数据
                </el-button>
                <el-button size="small" @click="clearMigrationData" :disabled="!migrationSettings.enabled">
                  清除飞线数据
                </el-button>
              </div>

              <!-- 飞线动画控制按钮 -->
              <div class="control-row buttons-row">
                <el-button size="small" type="primary" @click="startMigrationAnimation"
                  :disabled="!migrationSettings.enabled || migrationSettings.isPlaying">
                  开始飞线动画
                </el-button>
                <el-button size="small" type="danger" @click="stopMigrationAnimation"
                  :disabled="!migrationSettings.enabled || !migrationSettings.isPlaying">
                  停止飞线动画
                </el-button>
              </div>

              <!-- 快捷示例按钮 -->
              <div class="control-row buttons-row" style="margin-top: 10px;">
                <el-button size="small" type="success" @click="quickEnableMigration"
                  :disabled="migrationSettings.isPlaying">
                  <i class="el-icon-connection"></i> 一键开启飞线
                </el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" type="primary" @click="addSampleMigration">添加飞线图示例</el-button>
                <el-button size="small" @click="addAdvancedMigration">添加高级飞线图示例</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" type="success" @click="addCityMigration" title="使用leaflet-charts5实现">添加城市间飞线图
                  (Echarts 5)</el-button>
                <el-button size="small" type="warning" @click="addSequentialMigration">添加顺序飞线</el-button>
              </div>

              <!-- 添加飞线图样式控制 -->
              <div v-if="migrationSettings.enabled" class="migration-style-controls">
                <div class="control-subtitle">飞线样式设置</div>

                <div class="control-row">
                  <span class="label">使用ECharts 5:</span>
                  <el-switch v-model="migrationSettings.useECharts5" @change="toggleMigrationImpl" />
                  <span class="value">{{ migrationSettings.useECharts5 ? '是' : '否' }}</span>
                </div>

                <!-- 线条样式设置 -->
                <div class="control-subtitle">线条样式</div>

                <div class="control-row">
                  <span>线条宽度:</span>
                  <el-slider v-model="migrationOptions.lineStyle.width" :min="1" :max="5" :step="0.5"
                    @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.lineStyle.width }}</span>
                </div>

                <div class="control-row">
                  <span>透明度:</span>
                  <el-slider v-model="migrationOptions.lineStyle.opacity" :min="0.1" :max="1" :step="0.1"
                    @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.lineStyle.opacity }}</span>
                </div>

                <div class="control-row">
                  <span>曲线度:</span>
                  <el-slider v-model="migrationOptions.lineStyle.curveness" :min="0" :max="0.5" :step="0.05"
                    @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.lineStyle.curveness }}</span>
                </div>

                <div class="control-row">
                  <span>线条类型:</span>
                  <el-select v-model="migrationOptions.lineStyle.type" size="small" @change="updateMigrationStyle">
                    <el-option label="实线" value="solid" />
                    <el-option label="虚线" value="dashed" />
                    <el-option label="点线" value="dotted" />
                  </el-select>
                </div>

                <div class="control-row">
                  <span>线条颜色:</span>
                  <el-color-picker v-model="migrationOptions.lineStyle.color" size="small"
                    @change="updateMigrationStyle" />
                </div>

                <!-- 散点样式设置 -->
                <div class="control-subtitle">散点样式</div>


                <div class="control-row">
                  <span>散点波动:</span>
                  <el-switch v-model="migrationOptions.symbolEffectEnabled" @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.symbolEffectEnabled ? '开启' : '关闭' }}</span>
                </div>

                <div class="control-row">
                  <span>波动周期:</span>
                  <el-slider v-model="migrationOptions.rippleEffect.period" :min="1" :max="8" :step="0.5"
                    :disabled="!migrationOptions.symbolEffectEnabled" @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.rippleEffect.period }}</span>
                </div>

                <div class="control-row">
                  <span>波动大小:</span>
                  <el-slider v-model="migrationOptions.rippleEffect.scale" :min="1" :max="10" :step="0.5"
                    :disabled="!migrationOptions.symbolEffectEnabled" @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.rippleEffect.scale }}</span>
                </div>

                <div class="control-row">
                  <span>波动样式:</span>
                  <el-select v-model="migrationOptions.rippleEffect.brushType" size="small"
                    :disabled="!migrationOptions.symbolEffectEnabled" @change="updateMigrationStyle">
                    <el-option label="填充" value="fill" />
                    <el-option label="描边" value="stroke" />
                  </el-select>
                </div>

                <div class="control-row">
                  <span>显示名称:</span>
                  <el-switch v-model="migrationOptions.showSymbolName" @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.showSymbolName ? '开启' : '关闭' }}</span>
                </div>

                <!-- 飞线动画效果设置 -->
                <div class="control-subtitle">飞线动画效果</div>

                <div class="control-row">
                  <span>动画速度:</span>
                  <el-slider v-model="migrationOptions.effect.period" :min="1" :max="10" :step="1"
                    @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.effect.period }}</span>
                </div>
                <div class="control-row">
                  <span>图标大小:</span>
                  <el-slider v-model="migrationOptions.symbolSize" :min="4" :max="24" :step="1"
                    @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.symbolSize }}</span>
                </div>
                <div class="control-row">
                  <span>拖尾:</span>
                  <el-slider v-model="migrationOptions.effect.trailLength" :min="0" :max="0.9" :step="0.1"
                    @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.effect.trailLength }}</span>
                </div>

                <div class="control-row">
                  <span>动画类型:</span>
                  <el-select v-model="migrationOptions.effect.animationType" size="small"
                    @change="updateMigrationStyle">
                    <el-option label="均匀移动" value="normal" />
                    <el-option label="弹跳效果" value="bounce" />
                  </el-select>
                </div>

                <div class="control-row">
                  <span>动画图标:</span>
                  <el-select v-model="migrationOptions.pathSymbol" size="small" @change="updateMigrationStyle">
                    <el-option label="圆形" value="circle" />
                    <el-option label="矩形" value="rect" />
                    <el-option label="三角形" value="triangle" />
                    <el-option label="菱形" value="diamond" />
                    <el-option label="箭头" value="arrow" />
                    <el-option label="飞机"
                      value="path://M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z" />
                  </el-select>
                </div>

                <div class="control-row">
                  <span>效果颜色:</span>
                  <el-color-picker v-model="migrationOptions.effect.color" size="small"
                    @change="updateMigrationStyle" />
                </div>

                <div class="control-row">
                  <span>循环播放:</span>
                  <el-switch v-model="migrationOptions.loop" @change="updateMigrationStyle" />
                </div>

                <!-- 高级设置 -->
                <div class="control-subtitle">高级设置</div>

                <div class="control-row">
                  <span>启用3D:</span>
                  <el-switch v-model="migrationOptions.enable3D" @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.enable3D ? '开启' : '关闭' }}</span>
                </div>

                <div class="control-row">
                  <span>悬停动画:</span>
                  <el-switch v-model="migrationOptions.hoverAnimation" @change="updateMigrationStyle" />
                  <span class="value">{{ migrationOptions.hoverAnimation ? '开启' : '关闭' }}</span>
                </div>

                <div class="control-subtitle">样式应用</div>

                <div class="control-row">
                  <el-button size="small" type="primary" @click="applyMigrationStyle" style="width: 100%;">
                    应用飞线样式
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 添加单独的路径数据操作区域 -->
          <div class="config-item">
            <div class="label">路径数据操作</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" type="primary" @click="addPathlineExample">添加高速公路路径</el-button>
                <el-button size="small" type="primary" @click="addCircularPathline">添加环形路径</el-button>
              </div>
              <div class="control-row">
                <span>路径样式:</span>
                <el-select v-model="pathlineSettings.style" size="small" @change="updatePathlineStyle">
                  <el-option label="实线" value="solid" />
                  <el-option label="虚线" value="dashed" />
                  <el-option label="点线" value="dotted" />
                </el-select>
                <el-color-picker v-model="pathlineSettings.color" size="small" @change="updatePathlineStyle" />
              </div>
              <div class="control-row">
                <span>线条宽度:</span>
                <el-slider v-model="pathlineSettings.width" :min="1" :max="8" :step="1" @change="updatePathlineStyle" />
                <span class="value">{{ pathlineSettings.width }}</span>
              </div>
              <div class="control-row">
                <span>曲率:</span>
                <el-slider v-model="pathlineSettings.curveness" :min="0" :max="0.3" :step="0.05" @change="updatePathlineStyle" />
                <span class="value">{{ pathlineSettings.curveness }}</span>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" type="warning" @click="clearPathline">清除路径</el-button>
                <el-button size="small" type="success" @click="applyPathlineStyle">应用路径样式</el-button>
              </div>
            </div>
          </div>

          <!-- 添加热力图操作区域 -->
          <div class="config-item">
            <div class="label">热力图操作</div>
            <div class="controls">
              <div class="control-row">
                <span>启用热力图:</span>
                <el-switch v-model="config.heatMapConfig.enabled" @change="toggleHeatMap" />
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="generateRandomHeatMap" :disabled="!config.heatMapConfig.enabled">
                  生成随机热力图
                </el-button>
                <el-button size="small" @click="generateHeatMapFromMarkers" :disabled="!config.heatMapConfig.enabled">
                  从标记点生成
                </el-button>
              </div>
              <div class="control-row">
                <span>热力点半径:</span>
                <el-slider v-model="config.heatMapConfig.options.radius" :min="10" :max="50" :step="1"
                  @change="updateHeatMapOptions" />
                <span class="value">{{ config.heatMapConfig.options.radius }}</span>
              </div>
              <div class="control-row">
                <span>模糊度:</span>
                <el-slider v-model="config.heatMapConfig.options.blur" :min="5" :max="30" :step="1"
                  @change="updateHeatMapOptions" />
                <span class="value">{{ config.heatMapConfig.options.blur }}</span>
              </div>
            </div>
          </div>

          <!-- 添加地图工具操作区域 -->
          <div class="config-item">
            <div class="label">地图工具</div>
            <div class="controls">
              <div class="control-row buttons-row">
                <el-button size="small" @click="getVisibleBoundsInfo">获取可视区域坐标</el-button>
                <el-button size="small" @click="toggleDragging">{{ config.dragging ? '禁用拖动' : '启用拖动' }}</el-button>
              </div>
              <div class="control-row buttons-row">
                <el-button size="small" @click="addCustomTool">添加自定义工具</el-button>
                <el-button size="small" @click="toggleToolbar">{{ config.showToolbar ? '隐藏工具栏' : '显示工具栏' }}</el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="preset-section">
          <h4>预设位置</h4>
          <div class="preset-buttons">
            <el-button @click="setPreset('beijing')">北京</el-button>
            <el-button @click="setPreset('shanghai')">上海</el-button>
            <el-button @click="setPreset('guangzhou')">广州</el-button>
            <el-button @click="setPreset('chongqing')">重庆</el-button>
          </div>
        </div>

        <div class="map-info">
          <div class="info-item">
            <span class="info-label">当前中心点:</span>
            <span class="info-value">{{ config.center[0].toFixed(4) }}, {{ config.center[1].toFixed(4) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">当前缩放:</span>
            <span class="info-value">{{ config.zoom }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">交互状态:</span>
            <span class="info-value">{{ config.dragging ? '可拖动' : '禁止拖动' }}, {{ config.scrollWheelZoom ? '可缩放' : '禁止缩放'
              }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">活动工具:</span>
            <span class="info-value">{{ activeTool || '无' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件日志显示区域 -->
    <div class="event-logs">
      <h4>事件日志</h4>
      <div v-if="eventLogs.length === 0" class="no-logs">
        暂无事件记录
      </div>
      <ul v-else class="logs-list">
        <li v-for="(log, index) in eventLogs" :key="index" class="log-item">
          <span class="log-time">{{ formatTime(log.time) }}</span>
          <span class="log-event">{{ log.event }}</span>
          <span class="log-data">{{ JSON.stringify(log.data).substring(0, 100) }}{{ JSON.stringify(log.data).length >
            100 ? '...' : '' }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import ScMap from '@repo/components/ScMap/index.vue';
import type { ScMapProps } from '@repo/components/ScMap/types';
import MAP_TYPES from '@repo/components/ScMap/types/default';
import { ShapeType } from '@repo/components/ScMap/plugin/Shape';
import * as logUtil from '@repo/utils';
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 导入Leaflet库（实际使用时可能需要安装leaflet包）
// import L from 'leaflet';

const { info, warn, error } = logUtil;

// 创建自己的日志工具包装函数，解决参数问题
const log = {
  info: (message: string) => info(message),
  warn: (message: string) => warn(message),
  error: (message: string) => error(message)
};

// 地图类型引用
const mapTypes = ref(MAP_TYPES);
const mapRef = ref<InstanceType<typeof ScMap> | null>(null);
const activeTool = ref<string>('');
const customToolCount = ref(0);
const allMarkersVisible = ref(true);
const allLabelsVisible = ref(true);
const groupVisible = reactive({
  group1: true,
  group2: true
});

// 基本配置
const config = reactive({
  center: [39.92, 116.40] as [number, number], // 默认北京
  zoom: 12,
  height: 500,
  mapType: MAP_TYPES,
  dragging: true,
  scrollWheelZoom: true,
  apiKey: '',
  showToolbar: true,
  aggregationConfig: { enabled: false }, // 初始化聚合配置
  heatMapConfig: { // 添加热力图配置
    enabled: false,
    options: {
      radius: 25,
      blur: 15,
      maxOpacity: 0.8,
      gradient: {
        0.4: 'blue',
        0.6: 'cyan',
        0.7: 'lime',
        0.8: 'yellow',
        1.0: 'red'
      }
    }
  }
});

// 工具栏配置
const toolbarSettings = reactive({
  position: 'top-left' as const,
  direction: 'horizontal' as const,
  itemsPerLine: 8,
  size: 36
});

// 合并为toolbarConfig
const toolbarConfig = computed(() => ({
  position: toolbarSettings.position,
  direction: toolbarSettings.direction,
  itemsPerLine: toolbarSettings.itemsPerLine,
  size: toolbarSettings.size
}));

// 聚合设置
const aggregationSettings = reactive({
  enabled: false,
  maxClusterRadius: 50,
  showCount: true,
  color: '#1890ff'
});

// 计算聚合配置
const aggregationConfig = computed(() => {
  if (!aggregationSettings.enabled) {
    return { enabled: false };
  }
  
  return {
    enabled: aggregationSettings.enabled,
    maxClusterRadius: aggregationSettings.maxClusterRadius,
    showCount: aggregationSettings.showCount,
    color: aggregationSettings.color,
    borderColor: '#ffffff',
    useWeightAsSize: true,
    pulseScale: 1.3,
    // 设置聚合点大小缩放比例为原来的1/3
    maxClusterSize: 25, // 最大聚合点大小
    minClusterSize: 15  // 最小聚合点大小
  };
});

// 设置预设位置
const setPreset = (city: string): void => {
  switch(city) {
    case 'beijing':
      config.center = [39.92, 116.40] as [number, number];
      config.zoom = 12;
      break;
    case 'shanghai':
      config.center = [31.23, 121.47] as [number, number];
      config.zoom = 11;
      break;
    case 'guangzhou':
      config.center = [23.13, 113.26] as [number, number];
      config.zoom = 10;
      break;
    case 'chongqing':
      config.center = [29.56, 106.55] as [number, number];
      config.zoom = 9;
      break;
  }
};

// 添加随机标记点
const addRandomMarkers = (count: number = 3) => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.05; // 经纬度偏移范围
  
  try {
    for (let i = 0; i < count; i++) {
      // 计算随机位置（当前中心点附近）
      const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
      const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
      
      // 生成随机颜色
      const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加标记，并处理可能的错误
      try {
        const marker = map.addMarker({ lat, lng }, {
          markerId: `marker-random-${Date.now()}-${i}`,
          markerLabel: `标记 ${i+1}`,
          markerShowLabel: true,
          markerColor: color,
          markerClickable: true
        });
        
        if (!marker) {
          log.warn(`标记 ${i+1} 添加失败，可能地图组件尚未完全初始化`);
        }
      } catch (err) {
        log.error(`添加标记 ${i+1} 失败: ${err}`);
      }
    }
  } catch (e) {
    log.error(`添加随机标记失败: ${e}`);
  }
};

// 清除所有标记
const clearAllMarkers = () => {
  if (!mapRef.value) return;
  
  // 使用removeAllMarkers代替clearMarkers
  mapRef.value.removeAllMarkers();
  allMarkersVisible.value = true;
  info('所有标记已清除');
};

// 添加标记分组
const addMarkerGroup = (groupName: string, color: string) => {
  if (!mapRef.value) return;
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.04; // 经纬度偏移范围
  const count = 3; // 每组标记数量
  
  // 设置颜色
  const markerColor = color === 'red' ? '#FF5252' : '#448AFF';
  
  for (let i = 0; i < count; i++) {
    // 计算随机位置（当前中心点附近）
    const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
    const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
    
    // 添加标记
    map.addMarker({ lat, lng }, {
      markerId: `marker-${groupName}-${Date.now()}-${i}`,
      markerGroup: groupName,
      markerLabel: `${color}组 ${i+1}`,
      markerColor,
      markerClickable: true
    });
  }
  
  // 更新分组可见性
  groupVisible[groupName] = true;
  log.info(`已添加${color}色标记组 (${count}个标记)`);
};

// 切换分组可见性
const toggleGroupVisibility = (groupName: string) => {
  if (!mapRef.value) return;
  
  if (groupVisible[groupName as keyof typeof groupVisible]) {
    // 隐藏分组
    mapRef.value.hideGroup(groupName);
    groupVisible[groupName as keyof typeof groupVisible] = false;
  } else {
    // 显示分组
    mapRef.value.showGroup(groupName);
    groupVisible[groupName as keyof typeof groupVisible] = true;
  }
};

// 切换所有标记可见性
const toggleAllMarkers = () => {
  if (!mapRef.value) return;
  
  try {
    if (allMarkersVisible.value) {
      // 隐藏所有标记
      mapRef.value.hideAllMarkers();
      allMarkersVisible.value = false;
    } else {
      // 显示所有标记
      mapRef.value.showAllMarkers();
      allMarkersVisible.value = true;
    }
    log.info(`标记点已${allMarkersVisible.value ? '显示' : '隐藏'}`);
  } catch (e) {
    log.error(`切换所有标记可见性失败: ${e}`);
  }
};

// 切换所有标签可见性
const toggleAllLabels = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  try {
    if (allLabelsVisible.value) {
      // 隐藏标签逻辑 - 直接使用mapRef.value的属性来处理
      const map = mapRef.value;
      map.getMap()?.closeTooltip();
      document.querySelectorAll('.leaflet-tooltip').forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });
      allLabelsVisible.value = false;
      log.info('标记点标签已隐藏');
    } else {
      // 显示标签逻辑 - 刷新地图以重新渲染标签
      setTimeout(() => {
        document.querySelectorAll('.leaflet-tooltip').forEach(el => {
          (el as HTMLElement).style.display = '';
        });
        allLabelsVisible.value = true;
        log.info('标记点标签已显示');
      }, 50);
    }
  } catch (e) {
    log.error(`切换所有标签可见性失败: ${e}`);
  }
};

// 添加轨迹相关的状态和方法
const hasTrack = ref(false);
const isPlaying = ref(false);
const trackPlayerSettings = reactive({
  speed: 2,
  followMarker: true,
  loop: true
});

// 监听聚合设置变化并立即应用
watch(
  [
    () => aggregationSettings.enabled,
    () => aggregationSettings.maxClusterRadius,
    () => aggregationSettings.showCount,
    () => aggregationSettings.color
  ],
  () => {
    // 当任何聚合参数变化时，立即应用更新
    info('聚合参数已更新，正在应用...');
    
    // 短暂延迟确保绑定值已更新
    setTimeout(() => {
      // 尝试调用更新聚合方法
      updateAggregation();
      
      // 如果当前地图上没有足够的点位来展示聚合效果，提示用户添加更多点位
      const map = mapRef.value;
      if (map && aggregationSettings.enabled) {
        const markerCount = document.querySelectorAll('.leaflet-marker-icon').length;
        if (markerCount < 10) {
          info('当前点位数量较少，可能难以观察到聚合效果，建议添加更多点位');
        }
      }
    }, 100);
  }
);

// 监听聚合开关
watch(
  () => aggregationSettings.enabled,
  (newValue) => {
    if (newValue) {
      info('聚合功能已启用');
    } else {
      info('聚合功能已禁用');
    }
  }
);

// 更新聚合设置
const updateAggregation = () => {
  if (!mapRef.value) return;
  
  // 直接从组件实例获取地图实例
  const map = mapRef.value;
  
  try {
    // 尝试获取内部地图实例 - 使用any类型避免TypeScript错误
    const mapInstance = map as any;
    
    // 首先尝试通过prop直接更新配置
    config.aggregationConfig = {
      enabled: aggregationSettings.enabled,
    };
    
    // 然后尝试刷新聚合
    if (mapInstance._map && typeof mapInstance._map.refreshClusters === 'function') {
      // 如果有Leaflet地图实例并且有刷新聚合的方法
      mapInstance._map.refreshClusters();
      info('已刷新聚合');
    } else if (typeof map.$forceUpdate === 'function') {
      // 使用Vue的$forceUpdate方法强制组件更新
      map.$forceUpdate();
      info('已强制更新组件');
    } else {
      // 最后的办法:重绘地图
      info('请尝试调整地图缩放级别来触发聚合效果');
    }
  } catch (e) {
    error('刷新聚合失败:', e);
  }
};

// 添加示例轨迹
const addSampleTrack = () => {
  try {
    // 创建示例轨迹数据
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    
    // 生成一条简单的轨迹，沿着当前视图中心向东前进
    for (let i = 0; i < 20; i++) {
      const offset = i * 0.005; // 每步骤移动的距离
      points.push({
        lat: center[0], 
        lng: center[1] + offset,
        time: now + i * 60, // 每分钟一个点
        dir: 90,  // 向东
        title: `轨迹点 ${i+1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: '45 km/h' },
          { key: '方向', value: '90°' }
        ]
      });
    }
    
    // 创建轨迹对象
    const track = {
      id: 'sample-track',
      name: '示例轨迹',
      points: points,
      color: '#FF5252',
      visible: true
    };
    
    // 直接添加轨迹
    mapRef.value.addTrack(track);
    hasTrack.value = true;
    info(`已添加示例轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: '示例轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加示例轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 清除所有轨迹
const clearAllTracks = () => {
  try {
    // 直接停止轨迹播放器，更简洁的实现
    mapRef.value.stopTrackPlayer();
    
    hasTrack.value = false;
    log.info('所有轨迹已清除');
    
    // 提示用户
    ElMessage({
      message: '轨迹数据已清除',
      type: 'success',
      duration: 2000
    });
  } catch (e) {
    log.error(`清除轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '清除轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 验证轨迹数据是否有效
const validateTrackData = (points: any[]): boolean => {
  // 至少需要2个点
  if (!points || points.length < 2) {
    warn('轨迹数据无效: 至少需要2个点');
    return false;
  }
  
  // 验证每个点的格式
  for (const point of points) {
    if (point.lat === undefined || point.lng === undefined || point.time === undefined) {
      warn('轨迹数据无效: 点缺少必要的属性(lat, lng, time)');
      return false;
    }
    
    // 确保经纬度是数字
    if (typeof point.lat !== 'number' || typeof point.lng !== 'number') {
      warn('轨迹数据无效: 经纬度必须是数字类型');
      return false;
    }
    
    // 确保时间戳是数字
    if (typeof point.time !== 'number') {
      warn('轨迹数据无效: 时间戳必须是数字类型');
      return false;
    }
  }
  
  return true;
};

// 添加轨迹到地图
const addTrackToMap = (id: string, name: string, points: any[], color: string) => {
  // 创建轨迹对象
  const track = {
    id: id, // 确保ID不变
    name: name,
    points: points,
    color: color,
    visible: true
  };
  
  // 添加到地图
  try {
    // 直接添加轨迹
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    info(`已添加轨迹: ${name}，包含 ${points.length} 个点`);
  } catch (e) {
    error(`添加轨迹失败: ${name}`, e);
  }
};

// 添加多条轨迹
const addMultipleTracks = () => {
  try {
    // 生成多条轨迹
    const center = config.center;
    const tracks = [];
    
    // 生成四条不同方向的轨迹
    const directions = ['north', 'east', 'south', 'west'];
    const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107'];
    
    for (let i = 0; i < directions.length; i++) {
      const direction = directions[i];
      const points = generateDirectionalTrack(center, direction, 0.05, 10);
      
      tracks.push({
        id: `track-${direction}`,
        name: `${direction}向轨迹`,
        points: points,
        color: colors[i],
        visible: true
      });
    }
    
    // 添加所有轨迹
    let addedCount = 0;
    tracks.forEach(track => {
      try {
        mapRef.value.addTrack(track);
        addedCount++;
      } catch (e) {
        log.error(`添加轨迹 ${track.name} 失败: ${e}`);
      }
    });
    
    if (addedCount > 0) {
      hasTrack.value = true;
      
      // 调整视图以包含所有轨迹
      fitTracksInView();
      
      log.info(`已添加 ${addedCount} 条轨迹`);
      
      // 提示用户
      ElMessage({
        message: `已添加 ${addedCount} 条轨迹`,
        type: 'success',
        duration: 3000
      });
    } else {
      log.warn('未能添加任何轨迹');
      
      // 提示用户
      ElMessage({
        message: '添加轨迹失败，请检查控制台日志',
        type: 'warning',
        duration: 3000
      });
    }
  } catch (e) {
    log.error(`添加多条轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加多条轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加环形轨迹
const addCircularTrack = () => {
  try {
    // 生成环形轨迹
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const radius = 0.02; // 大约2公里的半径
    const steps = 36; // 36个点，每10度一个点
    
    for (let i = 0; i <= steps; i++) {
      const angle = (i * 10) * (Math.PI / 180); // 转换为弧度
      const lat = center[0] + radius * Math.sin(angle);
      const lng = center[1] + radius * Math.cos(angle);
      const direction = (i * 10 + 90) % 360; // 切线方向
      
      points.push({
        lat,
        lng,
        time: now + i * 60, // 每分钟一个点
        dir: direction,
        title: `环形轨迹点 ${i+1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: '30 km/h' },
          { key: '方向', value: `${direction}°` }
        ]
      });
    }
    
    // 创建轨迹对象
    const track = {
      id: 'circular-track',
      name: '环形轨迹',
      points: points,
      color: '#8E44AD', // 紫色
      visible: true
    };
    
    // 添加轨迹
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    
    // 调整视图以包含轨迹
    fitTracksInView();
    
    log.info(`已添加环形轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: '环形轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加环形轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加环形轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加Z字形轨迹
const addZigzagTrack = () => {
  try {
    // 生成Z字形轨迹
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    
    // Z字形的五个关键点
    const keyPoints = [
      { lat: center[0] - 0.02, lng: center[1] - 0.02 }, // 左上
      { lat: center[0] - 0.02, lng: center[1] + 0.02 }, // 右上
      { lat: center[0], lng: center[1] - 0.01 }, // 中间
      { lat: center[0] + 0.02, lng: center[1] - 0.02 }, // 左下
      { lat: center[0] + 0.02, lng: center[1] + 0.02 }, // 右下
    ];
    
    // 为每个关键点之间插入中间点
    for (let i = 0; i < keyPoints.length - 1; i++) {
      const start = keyPoints[i];
      const end = keyPoints[i + 1];
      const steps = 5; // 每段插入5个点
      
      for (let j = 0; j <= steps; j++) {
        const ratio = j / steps;
        const lat = start.lat + (end.lat - start.lat) * ratio;
        const lng = start.lng + (end.lng - start.lng) * ratio;
        
        // 计算方向（使用简单的角度计算）
        const direction = Math.atan2(end.lat - start.lat, end.lng - start.lng) * (180 / Math.PI);
        
        points.push({
          lat,
          lng,
          time: now + (i * steps + j) * 60, // 每分钟一个点
          dir: direction,
          title: `Z字形轨迹点 ${points.length + 1}`,
          info: [
            { key: '时间', value: new Date((now + (i * steps + j) * 60) * 1000).toLocaleTimeString() },
            { key: '速度', value: '40 km/h' },
            { key: '方向', value: `${Math.round(direction)}°` }
          ]
        });
      }
    }
    
    // 创建轨迹对象
    const track = {
      id: 'zigzag-track',
      name: 'Z字形轨迹',
      points: points,
      color: '#E74C3C', // 红色
      visible: true
    };
    
    // 添加轨迹并启动播放
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    
    // 调整视图以包含轨迹
    fitTracksInView();
    
    log.info(`已添加Z字形轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: 'Z字形轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加Z字形轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加Z字形轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加随机轨迹
const addRandomTrack = () => {
  try {
    // 生成随机轨迹
    const center = config.center;
    const now = Math.floor(Date.now() / 1000);
    const points = [];
    const pointsCount = 20 + Math.floor(Math.random() * 10); // 20-30个点
    
    // 初始点
    let currentLat = center[0] + (Math.random() * 0.02 - 0.01);
    let currentLng = center[1] + (Math.random() * 0.02 - 0.01);
    
    for (let i = 0; i < pointsCount; i++) {
      // 随机漫步
      const latChange = (Math.random() * 0.004 - 0.002);
      const lngChange = (Math.random() * 0.004 - 0.002);
      
      currentLat += latChange;
      currentLng += lngChange;
      
      // 计算移动方向
      const direction = Math.atan2(latChange, lngChange) * (180 / Math.PI);
      
      // 随机速度 (30-60 km/h)
      const speed = 30 + Math.floor(Math.random() * 30);
      
      points.push({
        lat: currentLat,
        lng: currentLng,
        time: now + i * 60, // 每分钟一个点
        dir: direction,
        title: `随机轨迹点 ${i+1}`,
        info: [
          { key: '时间', value: new Date((now + i * 60) * 1000).toLocaleTimeString() },
          { key: '速度', value: `${speed} km/h` },
          { key: '方向', value: `${Math.round(direction)}°` }
        ]
      });
    }
    
    // 创建轨迹对象
    const track = {
      id: 'random-track',
      name: '随机轨迹',
      points: points,
      color: '#3498DB', // 蓝色
      visible: true
    };
    
    // 添加轨迹并启动播放
    mapRef.value.addTrack(track);
    
    // 如果有startTrackPlayer方法，就启动播放
    if (typeof mapRef.value.startTrackPlayer === 'function') {
      mapRef.value.startTrackPlayer(track.id);
    }
    
    hasTrack.value = true;
    
    // 调整视图以包含轨迹
    fitTracksInView();
    
    log.info(`已添加随机轨迹，包含 ${points.length} 个点`);
    
    // 提示用户
    ElMessage({
      message: '随机轨迹已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加随机轨迹失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加随机轨迹失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 生成方向性轨迹
const generateDirectionalTrack = (center: [number, number], direction: string, distance: number, points: number) => {
  const now = Math.floor(Date.now() / 1000);
  const interval = 60; // 每点间隔1分钟
  const result = [];
  
  // 每点之间的距离
  const step = distance / (points - 1);
  
  // 方向转换为度数
  let dirDegrees = 0;
  let latMultiplier = 0;
  let lngMultiplier = 0;
  
  switch (direction) {
    case 'north':
      dirDegrees = 0;
      latMultiplier = 1;
      lngMultiplier = 0;
      break;
    case 'east':
      dirDegrees = 90;
      latMultiplier = 0;
      lngMultiplier = 1;
      break;
    case 'south':
      dirDegrees = 180;
      latMultiplier = -1;
      lngMultiplier = 0;
      break;
    case 'west':
      dirDegrees = 270;
      latMultiplier = 0;
      lngMultiplier = -1;
      break;
  }
  
  // 生成轨迹点
  for (let i = 0; i < points; i++) {
    const lat = center[0] + latMultiplier * i * step;
    const lng = center[1] + lngMultiplier * i * step;
    
    result.push({
      lat,
      lng,
      time: now + i * interval,
      dir: dirDegrees,
      title: `${direction}向轨迹点 ${i+1}`,
      info: [
        { key: '时间', value: new Date(now + i * interval * 1000).toLocaleTimeString() },
        { key: '速度', value: '45 km/h' },
        { key: '方向', value: `${dirDegrees}°` }
      ]
    });
  }
  
  return result;
};

// 调整视图以包含所有轨迹
const fitTracksInView = () => {
  if (!mapRef.value) return;
  
  try {
    // 直接调整中心点和缩放级别
    if (config.zoom > 10) {
      config.zoom = 10;
    }
  } catch (e) {
    error('调整视图失败:', e);
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 延迟一点时间确保地图已完全加载
  setTimeout(() => {
    // 移除自动添加点位的功能，改为让用户手动添加
    // addDefaultMarkers();
    
    // 提示用户可以使用一键开启飞线功能
    setTimeout(() => {
      ElMessage({
        message: '提示：您可以点击"一键开启飞线"按钮来体验新的飞线图功能',
        type: 'info',
        duration: 5000,
        showClose: true
      });
    }, 2000);
  }, 1000);
});

// 添加默认标记点
const addDefaultMarkers = () => {
  if (!mapRef.value) {
    warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  
  try {
    // 添加一些默认标记点，形成一个方形阵列
    const range = 0.03; // 经纬度范围
    const step = 0.01;  // 间隔
    const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
    
    let count = 0;
    for (let lat = center[0] - range; lat <= center[0] + range; lat += step) {
      for (let lng = center[1] - range; lng <= center[1] + range; lng += step) {
        const color = colors[count % colors.length];
        const label = `点位${++count}`;
        
        map.addMarker({ lat, lng }, {
          markerId: `default-marker-${count}`,
          markerGroup: 'default-group',
          markerLabel: label,
          markerShowLabel: count % 3 === 0, // 每隔3个点显示标签
          markerColor: color,
          markerClickable: true
        });
      }
    }
    
    info(`默认添加了 ${count} 个点位`);
  } catch (e) {
    error('添加默认标记点失败:', e);
  }
};

// 热力图相关方法
// 切换热力图状态
const toggleHeatMap = (enabled: boolean) => {
  if (!mapRef.value) return;
  
  try {
    // 使用toggleHeatMap方法切换热力图
    mapRef.value.toggleHeatMap(enabled);
    log.info(`热力图已${enabled ? '启用' : '禁用'}`);
  } catch (e) {
    log.error(`切换热力图状态失败: ${e}`);
  }
};

// 更新热力图选项
const updateHeatMapOptions = () => {
  if (!mapRef.value || !config.heatMapConfig.enabled) {
    return;
  }
  
  try {
    const options = {
      radius: config.heatMapConfig.options.radius,
      blur: config.heatMapConfig.options.blur,
      maxOpacity: config.heatMapConfig.options.maxOpacity,
      gradient: config.heatMapConfig.options.gradient
    };
    
    mapRef.value.updateHeatMapOptions(options);
    log.info('热力图选项已更新');
  } catch (e) {
    log.error(`更新热力图选项失败: ${e}`);
  }
};

// 从标记点生成热力图
const generateHeatMapFromMarkers = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  try {
    // 确保启用热力图
    if (!config.heatMapConfig.enabled) {
      config.heatMapConfig.enabled = true;
      // 使用toggleHeatMap代替enableHeatMap
      mapRef.value.toggleHeatMap(true);
    }
    
    // 生成随机点位置
    const center = config.center;
    const range = 0.01; // 范围更小，集中在标记点附近
    const pointsCount = 50; // 生成少量随机点
    
    // 生成随机点位置
    const heatPoints = [];
    for (let i = 0; i < pointsCount; i++) {
      // 随机位置，越靠近中心点密度越大
      const latOffset = (Math.random() - 0.5) * range * 2;
      const lngOffset = (Math.random() - 0.5) * range * 2;
      
      heatPoints.push({
        lat: center[0] + latOffset,
        lng: center[1] + lngOffset,
        value: 0.3 + Math.random() * 0.7
      });
    }
    
    // 设置热力图数据
    mapRef.value.setHeatMapData(heatPoints);
    log.info('已从标记点附近生成热力图');
  } catch (e) {
    log.error(`从标记点生成热力图失败: ${e}`);
  }
};

// 生成随机热力图数据
const generateRandomHeatMap = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  try {
    // 确保启用热力图
    if (!config.heatMapConfig.enabled) {
      config.heatMapConfig.enabled = true;
      // 使用toggleHeatMap代替enableHeatMap
      mapRef.value.toggleHeatMap(true);
    }
    
    const center = config.center;
    const range = 0.05; // 约5公里的范围
    const pointsCount = 100; // 生成100个随机点
    
    // 生成随机点位置
    const heatPoints = [];
    for (let i = 0; i < pointsCount; i++) {
      // 随机位置，越靠近中心点密度越大
      const latOffset = (Math.random() - 0.5) * range * 2;
      const lngOffset = (Math.random() - 0.5) * range * 2;
      
      // 距离中心点的距离影响权重
      const distanceRatio = Math.sqrt(latOffset * latOffset + lngOffset * lngOffset) / range;
      // 权重随机，但距离中心点越近权重越大的可能性越高
      const weight = Math.random() * (1 - distanceRatio * 0.7);
      
      heatPoints.push({
        lat: center[0] + latOffset,
        lng: center[1] + lngOffset,
        value: weight
      });
    }
    
    // 添加几个固定的高权重热点
    heatPoints.push({
      lat: center[0],
      lng: center[1],
      value: 1.0 // 中心点最高权重
    });
    
    heatPoints.push({
      lat: center[0] + range * 0.3,
      lng: center[1] + range * 0.3,
      value: 0.8
    });
    
    heatPoints.push({
      lat: center[0] - range * 0.4,
      lng: center[1] + range * 0.2,
      value: 0.7
    });
    
    // 设置热力图数据
    mapRef.value.setHeatMapData(heatPoints);
    log.info(`已生成随机热力图数据: ${heatPoints.length}个点`);
  } catch (e) {
    log.error(`生成随机热力图失败: ${e}`);
  }
};

// 添加带有自动显示标签的标记点
const addMarkersWithAutoLabel = () => {
  if (!mapRef.value) {
    log.warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.03; // 经纬度偏移范围
  
  try {
    for (let i = 0; i < 3; i++) {
      // 计算随机位置（当前中心点附近）
      const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
      const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
      
      // 生成随机颜色
      const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加带有自动显示标签的标记点
      map.addMarker({ lat, lng }, {
        markerId: `marker-auto-label-${Date.now()}-${i}`,
        markerGroup: 'auto-label-group',
        markerLabel: `自动标签 ${i+1}`,
        markerColor: color,
        markerClickable: true,
        markerShowLabel: true // 设置自动显示标签
      });
    }
    
    log.info('已添加带有自动显示标签的标记点');
  } catch (e) {
    log.error(`添加带有自动显示标签的标记点失败: ${e}`);
  }
};

// 添加一个带有自定义点击函数的标记组
const addMarkersWithCustomClick = () => {
  if (!mapRef.value) {
    warn('地图实例未初始化');
    return;
  }
  
  const map = mapRef.value;
  const center = config.center;
  const offsetRange = 0.03; // 经纬度偏移范围
  
  try {
    for (let i = 0; i < 3; i++) {
      // 计算随机位置（当前中心点附近）
      const lat = center[0] + (Math.random() * offsetRange * 2 - offsetRange);
      const lng = center[1] + (Math.random() * offsetRange * 2 - offsetRange);
      
      // 生成随机颜色
      const colors = ['#FF5252', '#448AFF', '#66BB6A', '#FFC107', '#AB47BC'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // 添加一些自定义数据
      const customData = {
        id: `data-${i}`,
        importance: Math.floor(Math.random() * 5) + 1,
        category: ['重要', '普通', '低优先级'][Math.floor(Math.random() * 3)],
        timestamp: new Date().toLocaleString()
      };
      
      // 添加带有自定义点击函数的标记
      map.addMarker({ lat, lng }, {
        markerId: `marker-custom-click-${Date.now()}-${i}`,
        markerGroup: 'custom-click-group',
        markerLabel: `自定义点击 ${i+1}`,
        markerColor: color,
        markerClickable: true,
        markerCustomData: customData,
        markerClickFunction: (marker, event) => {
          // 创建自定义的点击处理逻辑
          ElMessage({
            message: `点击了标记 - ${customData.category}级别 (重要性:${customData.importance})`,
            type: customData.importance > 3 ? 'warning' : 'success',
            showClose: true,
            duration: 3000
          });
          
          // 可以执行更多自定义逻辑或调用其他函数
          console.log('标记点击事件:', marker, event, customData);
        }
      });
    }
    
    info('已添加带有自定义点击函数的标记点');
  } catch (e) {
    error('添加带有自定义点击函数的标记点失败:', e);
  }
};

// 获取形状类型的中文名称
const getShapeTypeName = (type: string): string => {
  switch (type) {
    case ShapeType.CIRCLE:
      return '圆形';
    case ShapeType.RECTANGLE:
      return '矩形';
    case ShapeType.POLYGON:
      return '多边形';
    case ShapeType.POLYLINE:
      return '折线';
    default:
      return '未知形状';
  }
};

// 添加圆形
const addCircle = () => {
  if (!mapRef.value) return;
  
  try {
  const center = config.center;
    const radius = 500; // 500米
    
    // 使用addShapes方法而不是直接访问shapeTool
    mapRef.value.addShapes([{
      type: ShapeType.CIRCLE,
      coordinates: {
        center: [center[0], center[1]],
        radius: radius
      },
      options: {
        color: '#FF5252',
        fillColor: '#FF5252',
        fillOpacity: 0.2,
        weight: 3,
        data: {
          name: '示例圆形',
          id: `circle-${Date.now()}`,
          description: '这是一个示例圆形',
          category: '示例'
        }
      }
    }]);
    
    ElMessage.success('已添加圆形');
    console.log('添加圆形成功');
  } catch (e) {
    error('添加圆形失败:', e);
    console.error('添加圆形详细错误:', e);
    ElMessage.error(`添加圆形失败: ${e}`);
  }
};

// 添加矩形
const addRectangle = () => {
  if (!mapRef.value) return;
  
  const center = config.center;
  const halfSize = 0.01; // 约1公里左右的大小
  
  try {
    // 使用addShapes方法而不是直接访问shapeTool
    mapRef.value.addShapes([{
      type: ShapeType.RECTANGLE,
      coordinates: {
        bounds: [
          [center[0] - halfSize, center[1] - halfSize],
          [center[0] + halfSize, center[1] + halfSize]
        ]
      },
      options: {
        color: '#FF5252',
        fillColor: '#FF5252',
        fillOpacity: 0.2,
        weight: 3,
        data: {
          name: '随机矩形',
          createdAt: new Date().toISOString()
        }
      }
    }]);
    
    ElMessage.success('已添加矩形');
    console.log('添加矩形成功');
  } catch (e) {
    error('添加矩形失败:', e);
    console.error('添加矩形详细错误:', e);
    ElMessage.error(`添加矩形失败: ${e}`);
  }
      };
      
// 添加多边形
const addPolygon = () => {
  if (!mapRef.value) return;
  
  const center = config.center;
  const size = 0.015; // 多边形大小
  
  try {
    // 创建多边形的点集
    const points = {
      latlngs: [
        [center[0], center[1] - size],
        [center[0] - size, center[1]],
        [center[0], center[1] + size],
        [center[0] + size, center[1]]
      ]
    };
    
    // 添加多边形
    mapRef.value.addShapes([{
      type: ShapeType.POLYGON,
      coordinates: points,
      options: {
        color: '#66BB6A',
        fillColor: '#66BB6A',
        fillOpacity: 0.2,
        weight: 3,
        data: {
          name: '随机多边形',
          createdAt: new Date().toISOString()
        }
      }
    }]);
    
    ElMessage.success('已添加多边形');
    console.log('添加多边形成功');
  } catch (e) {
    error('添加多边形失败:', e);
    console.error('添加多边形详细错误:', e);
    ElMessage.error(`添加多边形失败: ${e}`);
  }
};

// 添加折线
const addPolyline = () => {
  if (!mapRef.value) return;
  
  const center = config.center;
  const size = 0.02; // 线段长度
  
  try {
    // 创建折线的点集
    const points = {
      latlngs: [
        [center[0] - size, center[1] - size],
        [center[0], center[1]],
        [center[0] + size, center[1] + size]
      ]
    };
    
    // 添加折线
    mapRef.value.addShapes([{
      type: ShapeType.POLYLINE,
      coordinates: points,
      options: {
        color: '#FFC107',
        weight: 4,
        data: {
          name: '随机折线',
          createdAt: new Date().toISOString()
        }
      }
    }]);
    
    ElMessage.success('已添加折线');
    console.log('添加折线成功');
  } catch (e) {
    error('添加折线失败:', e);
    console.error('添加折线详细错误:', e);
    ElMessage.error(`添加折线失败: ${e}`);
            }
};

// 添加命名形状
const addNamedShapes = () => {
  if (!mapRef.value) return;
  
  try {
    const center = config.center;
    const shapes = [
      {
        type: ShapeType.CIRCLE,
        coordinates: {
          center: [center[0] + 0.02, center[1] - 0.02],
          radius: 500
        },
        options: {
          id: 'named-circle',
          color: '#e91e63',
          fillColor: '#e91e63',
          fillOpacity: 0.3,
          data: { name: '命名圆形', type: 'poi', id: 'circle-poi-1' }
        }
      },
      {
        type: ShapeType.RECTANGLE,
        coordinates: {
          bounds: [
            [center[0] - 0.03, center[1] - 0.02],
            [center[0] - 0.01, center[1] + 0.02]
          ]
        },
        options: {
          id: 'named-rectangle',
          color: '#9c27b0',
          fillColor: '#9c27b0',
          fillOpacity: 0.3,
          data: { name: '命名矩形', type: 'area', id: 'rect-area-1' }
        }
      }
    ];
      
    // 添加所有形状
    mapRef.value.addShapes(shapes);
    
    ElMessage.success('已添加命名形状');
    console.log('添加命名形状成功');
  } catch (e) {
    error('添加命名形状失败:', e);
    console.error('添加命名形状详细错误:', e);
    ElMessage.error(`添加命名形状失败: ${e}`);
  }
};

// 清除所有形状
const clearAllShapes = () => {
  if (!mapRef.value) return;
  
  try {
    mapRef.value.clearShapes();
    ElMessage.success('已清除所有形状');
  } catch (e) {
    error('清除形状失败:', e);
    ElMessage.error(`清除形状失败: ${e}`);
  }
};

// 处理查看更多标记详情事件
const onMarkerDetailView = (data: any) => {
  console.log('查看标记详情:', data);
  const markerData = data.data;
  
  if (markerData && markerData.type) {
    switch (markerData.type) {
      case 'attraction':
        ElMessage.success(`查看景点: ${markerData.name}`);
        break;
      case 'restaurant':
        ElMessage.success(`查看餐厅: ${markerData.name}`);
        break;
      case 'hotel':
        ElMessage.success(`查看酒店: ${markerData.name}`);
        break;
      default:
        ElMessage.info(`查看详情: ${data.id}`);
    }
  } else {
    ElMessage.info(`查看标记详情: ${data.id}`);
  }
};

// 在地图初始化后添加ScMap组件的引用
onMounted(() => {
  if (mapRef.value) {
    log.info('地图组件已初始化');
  }
});

// 导出到模板的函数
const mapTools = {
  addSampleTrack,
  clearAllTracks,
  addMultipleTracks,
  addCircularTrack,
  addZigzagTrack,
  addRandomTrack,
  // ... 其他地图操作函数
};

// 添加飞线图示例数据
const addSampleMigration = () => {
  try {
    // 创建飞线图示例数据，使用真实经纬度
    const migrationData = [
      {
        from: [116.4074, 39.9042] as [number, number], // 北京
        to: [117.2010, 39.0842] as [number, number], // 天津
        labels: {
          from: '北京',
          to: '天津'
        },
        color: '#FF5252',
        weight: 3
      },
      {
        from: [116.4074, 39.9042] as [number, number], // 北京
        to: [115.4995, 38.8006] as [number, number], // 保定
        labels: {
          from: '北京',
          to: '保定'
        },
        color: '#448AFF',
        weight: 2
      },
      {
        from: [116.4074, 39.9042] as [number, number], // 北京
        to: [114.5149, 38.0428] as [number, number], // 石家庄
        labels: {
          from: '北京',
          to: '石家庄'
        },
        color: '#66BB6A',
        weight: 4
      },
      {
        from: [114.5149, 38.0428] as [number, number], // 石家庄
        to: [114.5391, 36.6256] as [number, number], // 邯郸
        labels: {
          from: '石家庄',
          to: '邯郸'
        },
        color: '#FFC107',
        weight: 2
      }
    ];
    
    // 启用飞线图功能
    mapRef.value.enableMigration();
    
    // 应用当前飞线图样式设置
    updateMigrationStyle();
    
    // 设置飞线图数据
    mapRef.value.setMigrationData(migrationData, true);
    
    // 开始播放飞线动画
    mapRef.value.startMigration();
    
    isMigrationEnabled.value = true;
    
    // 提示用户
    ElMessage({
      message: '飞线图示例数据已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加飞线图示例数据失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加飞线图示例数据失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加高级飞线图示例
const addAdvancedMigration = () => {
  try {
    // 创建更复杂的飞线数据，形成放射状图案
    const centerPoint: [number, number] = [116.4074, 39.9042]; // 北京
    const migrationData = [];
    
    // 设置目标城市及其真实经纬度
    const destinations = [
      { name: '上海', position: [121.4737, 31.2304] as [number, number] },
      { name: '广州', position: [113.2644, 23.1291] as [number, number] },
      { name: '成都', position: [104.0668, 30.5728] as [number, number] },
      { name: '西安', position: [108.9402, 34.3416] as [number, number] },
      { name: '哈尔滨', position: [126.5358, 45.8031] as [number, number] },
      { name: '乌鲁木齐', position: [87.6168, 43.8256] as [number, number] },
      { name: '拉萨', position: [91.1119, 29.6625] as [number, number] },
      { name: '昆明', position: [102.8329, 24.8801] as [number, number] },
      { name: '香港', position: [114.1694, 22.3193] as [number, number] },
      { name: '台北', position: [121.5654, 25.0330] as [number, number] },
      { name: '海口', position: [110.3306, 20.0371] as [number, number] },
      { name: '沈阳', position: [123.4315, 41.8057] as [number, number] }
    ];
    
    // 为每个目的地创建飞线
    destinations.forEach((destination, index) => {
      // 计算颜色（彩虹色渐变）
      const hue = (360 * index) / destinations.length;
      const color = `hsl(${hue}, 100%, 50%)`;
      
      // 根据距离设置权重
      const weight = 2 + Math.random() * 3;
      
      // 添加飞线数据
      migrationData.push({
        from: centerPoint,
        to: destination.position,
        labels: {
          from: '北京',
          to: destination.name
        },
        color: color,
        weight: weight,
        // 设置不同的动画速度
        time: 400 + Math.floor(Math.random() * 800)
      });
    });
    
    // 启用飞线图功能
    mapRef.value.enableMigration();
    
    // 应用当前飞线图样式设置
    updateMigrationStyle();
    
    // 设置飞线图数据
    mapRef.value.setMigrationData(migrationData, true);
    
    // 开始播放飞线动画
    mapRef.value.startMigration();
    
    isMigrationEnabled.value = true;
    
    // 提示用户
    ElMessage({
      message: '高级飞线图示例已添加到地图上',
      type: 'success',
      duration: 3000
    });
  } catch (e) {
    log.error(`添加高级飞线图示例失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加高级飞线图示例失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 基于当前中心点计算偏移位置
const offsetCenter = (latOffset: number, lngOffset: number): [number, number] => {
  const [lat, lng] = config.center;
  return [lat + latOffset, lng + lngOffset];
};

// 添加事件记录区域
const eventLogs = ref<{event: string, data: any, time: Date}[]>([]);

// 获取可视区域边界坐标
const getVisibleBoundsInfo = () => {
  if (!mapRef.value) {
    ElMessage.warning('地图实例未初始化');
    return;
  }
  
  try {
    const bounds = mapRef.value.getVisibleBounds();
    
    if (bounds) {
      // 格式化坐标显示
      const southWest = bounds[0];
      const northEast = bounds[1];
      
      // 左上角 (西北角) 坐标为 [northEast[0], southWest[1]]
      // 右下角 (东南角) 坐标为 [southWest[0], northEast[1]]
      const message = `
        左上角坐标: [${northEast[0].toFixed(6)}, ${southWest[1].toFixed(6)}]
        右下角坐标: [${southWest[0].toFixed(6)}, ${northEast[1].toFixed(6)}]
        西南角坐标: [${southWest[0].toFixed(6)}, ${southWest[1].toFixed(6)}]
        东北角坐标: [${northEast[0].toFixed(6)}, ${northEast[1].toFixed(6)}]
      `;
      
      ElMessage({
        message,
        type: 'success',
        duration: 8000
      });
      
      // 添加到事件日志
      addEventLog('get-visible-bounds', {
        leftTop: [northEast[0].toFixed(6), southWest[1].toFixed(6)],
        rightBottom: [southWest[0].toFixed(6), northEast[1].toFixed(6)],
        southWest: [southWest[0].toFixed(6), southWest[1].toFixed(6)],
        northEast: [northEast[0].toFixed(6), northEast[1].toFixed(6)]
      });
      
      log.info(`获取可视区域边界: ${JSON.stringify(bounds)}`);
    } else {
      ElMessage.warning('获取可视区域边界失败');
    }
  } catch (e) {
    ElMessage.error(`获取可视区域边界发生错误: ${e}`);
    log.error(`获取可视区域边界发生错误: ${e}`);
  }
};

// 工具激活事件处理
const onToolActivated = (toolId: string) => {
  activeTool.value = toolId;
  log.info(`工具激活: ${toolId}`);
  
  // 添加到事件日志
  addEventLog('tool-activated', { toolId });
};

// 工具停用事件处理
const onToolDeactivated = (toolId: string) => {
  if (activeTool.value === toolId) {
    activeTool.value = '';
  }
  log.info(`工具停用: ${toolId}`);
  
  // 添加到事件日志
  addEventLog('tool-deactivated', { toolId });
};

// 缩放变更事件处理
const onZoomChange = (zoom: number) => {
  config.zoom = zoom;
  log.info(`缩放级别变更: ${zoom}`);
  
  // 添加到事件日志
  addEventLog('zoom-change', { zoom });
};

// 中心点变更事件处理
const onCenterChange = (center: [number, number]) => {
};

// 形状点击事件处理
const onShapeClick = (data: any) => {
  log.info(`形状点击: ID=${data.id}, 类型=${data.type}, 中心点=[${data.center[0].toFixed(4)}, ${data.center[1].toFixed(4)}]`);
  
  // 添加到事件日志
  addEventLog('shape-click', data);
};

// 形状创建事件处理
const onShapeCreated = (data: any) => {
  log.info(`形状创建: ID=${data.id}, 类型=${data.type}`);
  
  // 添加到事件日志
  addEventLog('shape-created', data);
};

// 形状移除事件处理
const onShapeRemoved = (data: any) => {
  log.info(`形状移除: ID=${data.id}`);
  
  // 添加到事件日志
  addEventLog('shape-removed', data);
};

// 标记点击事件处理
const onMarkerClick = (data: any) => {
  log.info(`标记点击: ID=${data.id}, 位置=[${data.latlng[0].toFixed(4)}, ${data.latlng[1].toFixed(4)}]`);
  
  // 添加到事件日志
  addEventLog('marker-click', data);
};

// 标记创建事件处理
const onMarkerCreated = (data: any) => {
  log.info(`标记创建: ID=${data.id}, 位置=[${data.latlng[0].toFixed(4)}, ${data.latlng[1].toFixed(4)}]`);
  
  // 添加到事件日志
  addEventLog('marker-created', data);
};

// 标记移除事件处理
const onMarkerRemoved = (data: any) => {
  log.info(`标记移除: ID=${data.id}`);
  
  // 添加到事件日志
  addEventLog('marker-removed', data);
};

// 地图点击事件处理
const onMapClick = (event: any) => {
  if (event && event.latlng) {
    log.info(`地图点击: [${event.latlng.lat.toFixed(4)}, ${event.latlng.lng.toFixed(4)}]`);
    
    // 添加到事件日志
    addEventLog('map-click', { 
      latlng: [event.latlng.lat.toFixed(6), event.latlng.lng.toFixed(6)] 
    });
  }
};

// 添加事件到日志
const addEventLog = (event: string, data: any) => {
  // 使用深拷贝来避免引用关系导致的递归更新
  // 将复杂对象转换为字符串然后保存，而不是直接保存引用
  try {
    const safeData = JSON.parse(JSON.stringify(data));
    eventLogs.value.unshift({
      event,
      data: safeData,
      time: new Date()
    });
  } catch (e) { }
  
  // 限制日志数量，防止过多
  if (eventLogs.value.length > 50) {
    eventLogs.value = eventLogs.value.slice(0, 50);
  }
};

// 格式化时间显示
const formatTime = (date: Date): string => {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}.${date.getMilliseconds().toString().padStart(3, '0')}`;
};

// 切换拖动状态
const toggleDragging = () => {
  config.dragging = !config.dragging;
  if (mapRef.value) {
    if (config.dragging) {
      mapRef.value.enableDragging();
    } else {
      mapRef.value.disableDragging();
    }
  }
};

// 切换工具栏显示状态
const toggleToolbar = () => {
  config.showToolbar = !config.showToolbar;
};

// 添加自定义工具
const addCustomTool = () => {
  if (!mapRef.value) return;
  
  customToolCount.value++;
  const toolId = `customTool${customToolCount.value}`;
  
  try {
    mapRef.value.addToolItem({
      id: toolId,
      icon: 'el-icon-star-on',
      name: `自定义工具 ${customToolCount.value}`,
      tooltip: `这是自定义工具 ${customToolCount.value}`,
      multi: true,
      handler: () => {
        // 使用 console.log 替代 ElMessage
        console.log(`点击了自定义工具 ${customToolCount.value}`);
        log.info(`点击了自定义工具 ${customToolCount.value}`);
      }
    });
    
    // 移除直接的 ElMessage 调用
    // ElMessage.success(`添加了自定义工具 ${customToolCount.value}`);
  } catch (e) {
    console.error(`添加自定义工具失败: ${e}`);
    // ElMessage.error(`添加自定义工具失败: ${e}`);
  }
};

// 添加城市间飞线图示例
const addCityMigration = () => {
  try {
    // 先设置地图组件使用leaflet-charts5实现
    if (mapRef.value) {
      // 设置迁徙图实现类型 - 通过响应式变量
      migrationImpl.value = 'leafletCharts5' as any;
      
      // 记录日志
      log.info('已设置地图组件使用leaflet-charts5实现飞线图');
      
      // 确保地图已完全初始化和渲染
      mapRef.value.getMap()?.invalidateSize(true);
    }
    
    // 中国主要城市坐标（经度,纬度）- 真实经纬度
    const cities = {
      '北京': [116.4074, 39.9042],
      '上海': [121.4737, 31.2304],
      '广州': [113.2644, 23.1291],
      '深圳': [114.0579, 22.5431],
      '成都': [104.0668, 30.5728],
      '重庆': [106.5528, 29.5627],
      '武汉': [114.3055, 30.5928],
      '西安': [108.9402, 34.3416],
      '南京': [118.7969, 32.0603],
      '杭州': [120.2052, 30.2507],
      '济南': [117.1205, 36.6510],
      '天津': [117.2010, 39.0842],
      '青岛': [120.3826, 36.0671],
      '大连': [121.6147, 38.9140],
      '哈尔滨': [126.5358, 45.8031]
    };

    // 设置不同等级的城市连接
    const cityConnections = [
      // 一线城市互联
      {from: '北京', to: '上海', weight: 5, color: '#FF5252'},
      {from: '北京', to: '广州', weight: 4, color: '#FF5252'},
      {from: '上海', to: '广州', weight: 4, color: '#FF5252'},
      {from: '广州', to: '深圳', weight: 5, color: '#FF5252'},
      
      // 二线城市连接
      {from: '北京', to: '成都', weight: 3, color: '#448AFF'},
      {from: '上海', to: '武汉', weight: 3, color: '#448AFF'},
      {from: '广州', to: '重庆', weight: 3, color: '#448AFF'},
      {from: '上海', to: '杭州', weight: 4, color: '#448AFF'},
      {from: '上海', to: '南京', weight: 4, color: '#448AFF'},
      
      // 其他城市连接
      {from: '成都', to: '重庆', weight: 3, color: '#66BB6A'},
      {from: '武汉', to: '西安', weight: 2, color: '#66BB6A'},
      {from: '北京', to: '天津', weight: 3, color: '#66BB6A'},
      {from: '济南', to: '天津', weight: 2, color: '#66BB6A'},
      {from: '杭州', to: '南京', weight: 3, color: '#66BB6A'},
      {from: '武汉', to: '南京', weight: 2, color: '#66BB6A'},
      {from: '青岛', to: '济南', weight: 3, color: '#66BB6A'},
      {from: '哈尔滨', to: '大连', weight: 2, color: '#66BB6A'},
      {from: '北京', to: '哈尔滨', weight: 3, color: '#66BB6A'}
    ];

    // 设置地图视图以包含所有城市
    // 中国大致边界
    mapRef.value.fitBounds(
      [[18, 73], [54, 135]], 
      {padding: 50, maxZoom: 5}
    );
    
    // 稍等片刻让地图视图变化完成
    setTimeout(() => {
      // 先清除之前可能存在的标记点
      mapRef.value.removeAllMarkers();
      
      // 清空之前可能存在的迁移数据
      try {
        // 如果正在播放，停止动画
        if (migrationSettings.isPlaying) {
          mapRef.value.stopMigration();
        }
        
        // 禁用迁移
        mapRef.value.disableMigration();
        
        // 稍等片刻后再次操作，确保DOM更新
        setTimeout(() => {
          // 转换为飞线图数据
          const migrationData = cityConnections.map(conn => ({
            from: cities[conn.from] as [number, number],
            to: cities[conn.to] as [number, number],
            labels: {
              from: conn.from,
              to: conn.to
            },
            color: conn.color,
            weight: conn.weight,
            time: 800 - conn.weight * 100 // 权重越大，动画越快
          }));
          
          // 添加城市标记
          Object.keys(cities).forEach(cityName => {
            const [lng, lat] = cities[cityName];
            const cityType = cityTypes[cityName] || '其他城市';
            const iconStyle = cityIcons[cityType];
            
            // 为每个城市添加标记
            const markerId = mapRef.value.addMarker(
              { lat, lng },
              {
                icon: iconStyle,
                markerLabel: cityName,
                markerGroup: cityType,
                markerCustomData: {
                  cityName: cityName,
                  cityType: cityType,
                  population: Math.floor(Math.random() * 2000) / 100 + 'M', // 模拟数据
                  connections: cityConnections.filter(c => c.from === cityName || c.to === cityName).length
                }
              }
            );
          });
          
          // 重新调整地图大小确保容器正确
          mapRef.value.getMap()?.invalidateSize(true);
          
          // 再次等待DOM刷新
          setTimeout(() => {
            // 应用当前飞线图样式设置
            updateMigrationStyle();
          
            // 等待配置应用后再启用飞线图
            setTimeout(() => {
              // 再次启用迁移
              mapRef.value.enableMigration();
              
              // 再次等待组件渲染和初始化
              setTimeout(() => {
                // 设置飞线图数据，但不自动开始动画
                mapRef.value.setMigrationData(migrationData, false);
                
                // 稍等片刻后手动启动动画
                setTimeout(() => {
                  // 启用飞线图
                  mapRef.value.startMigration();
                  migrationSettings.isPlaying = true;
                  
                  // 提示用户
                  ElMessage({
                    message: '城市间飞线图示例已添加到地图上 (使用新版Echarts 5实现)',
                    type: 'success',
                    duration: 3000
                  });
                }, 500);
              }, 500);
            }, 300);
          }, 300);
        }, 300);
      } catch (e) {
        log.error(`添加城市间飞线图示例失败: ${e}`);
        
        // 提示用户
        ElMessage({
          message: '添加城市间飞线图示例失败，请检查控制台日志',
          type: 'error',
          duration: 3000
        });
      }
    }, 500);
  } catch (e) {
    log.error(`添加城市间飞线图示例失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加城市间飞线图示例失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 切换飞线图状态
const toggleMigration = () => {
  if (!mapRef.value) return;
  
  try {
    // 如果要开启飞线图
    if (!isMigrationEnabled.value) {
      // 应用当前飞线图样式设置
      updateMigrationStyle();
      
      // 启用飞线图功能
      mapRef.value.enableMigration();
      
      // 尝试开始播放飞线动画
      try {
        mapRef.value.startMigration();
        isMigrationEnabled.value = true;
      } catch (err) {
        // 如果启用失败或没有数据，调用quickEnableMigration来添加默认数据
        log.warn(`开始播放飞线失败: ${err}, 尝试添加默认数据`);
        quickEnableMigration();
      }
    } else {
      // 停止飞线动画
      mapRef.value.stopMigration();
      
      // 关闭飞线图功能
      mapRef.value.disableMigration();
      
      isMigrationEnabled.value = false;
    }
    
    // 显示状态信息
    log.info(`飞线图已${isMigrationEnabled.value ? '开启' : '关闭'}`);
  } catch (e) {
    log.error(`切换飞线图状态失败: ${e}`);
  }
};

// 是否启用飞线图
const isMigrationEnabled = ref(false);

// 清除迁徙图
const clearMigration = () => {
  try {
    // 停止飞线动画
    mapRef.value.stopMigration();
    
    // 禁用飞线图功能
    mapRef.value.disableMigration();
    
    // 清除飞线图数据
    mapRef.value.setMigrationData([]);
    
    // 更新状态
    isMigrationEnabled.value = false;
    
    // 提示用户
    ElMessage({
      message: '飞线图已清除',
      type: 'success',
      duration: 2000
    });
  } catch (e) {
    log.error(`清除飞线图失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '清除飞线图失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加顺序飞线示例
const addSequentialMigration = () => {
  try {
    // 先清除当前飞线图
    clearMigration();
    
    // 创建线性飞线路径，使用真实经纬度
    
    // 定义路径点
    const pathPoints = [
      { position: [116.4074, 39.9042] as [number, number], name: '北京' },
      { position: [117.2010, 39.0842] as [number, number], name: '天津' },
      { position: [117.1205, 36.6510] as [number, number], name: '济南' },
      { position: [118.7969, 32.0603] as [number, number], name: '南京' },
      { position: [120.2052, 30.2507] as [number, number], name: '杭州' },
      { position: [121.4737, 31.2304] as [number, number], name: '上海' }
    ];
    
    // 生成飞线数据
    const migrationData = [];
    
    // 先添加标记点
    pathPoints.forEach((point, index) => {
      mapRef.value.addMarker(
        { lat: point.position[1], lng: point.position[0] },
        {
          markerLabel: point.name,
          markerShowLabel: true,
          markerCustomData: {
            index: index,
            name: point.name,
            isStart: index === 0,
            isEnd: index === pathPoints.length - 1
          }
        }
      );
    });

    // 生成飞线路径
    for (let i = 0; i < pathPoints.length - 1; i++) {
      migrationData.push({
        from: pathPoints[i].position,
        to: pathPoints[i + 1].position,
        labels: {
          from: pathPoints[i].name,
          to: pathPoints[i + 1].name
        },
        color: `hsl(${30 * i}, 100%, 50%)`,
        weight: 3,
        time: 800 // 统一速度
      });
    }
    
    // 停止当前动画
    mapRef.value.stopMigration();
    
    // 应用当前飞线图样式设置
    updateMigrationStyle();
    
    // 设置飞线图数据
    mapRef.value.setMigrationData(migrationData, false);
    
    // 启用飞线图
    mapRef.value.startMigration();
    isMigrationEnabled.value = true;
    
    // 提示用户准备开始
    ElMessage({
      message: '依次演示飞线路径',
      type: 'success',
      duration: 2000
    });

    // 依次展示每条飞线路径
    let currentIndex = 0;

    // 更新飞线图数据，只显示当前索引的路径
    const showPath = () => {
      if (currentIndex >= migrationData.length) {
        // 全部展示完毕，重置
        currentIndex = 0;
        
        // 展示所有路径
        mapRef.value.setMigrationData(migrationData, true);
        return;
      }

      // 只显示当前路径
      mapRef.value.setMigrationData([migrationData[currentIndex]], true);
      
      // 显示当前路径信息
      ElMessage({
        message: `从 ${migrationData[currentIndex].labels.from} 到 ${migrationData[currentIndex].labels.to}`,
        type: 'info',
        duration: 2000
      });
      
      // 延迟显示下一条路径
      currentIndex++;
      setTimeout(showPath, 2500);
    };

    // 开始展示
    showPath();
    
  } catch (e) {
    log.error(`添加顺序飞线路径失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加顺序飞线路径失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加一键开启飞线的大按钮
const quickEnableMigration = () => {
  try {
    // 如果没有现有的飞线数据，先添加一个默认的飞线图
    if (!mapRef.value || !migrationSettings.isPlaying) {
      // 设置使用新的leaflet-charts5实现
      migrationImpl.value = 'echarts5';
      
      // 记录当前使用的实现
      migrationSettings.useECharts5 = true;
      
      // 等待DOM刷新和组件重新渲染
      setTimeout(() => {
        // 确保飞线功能已启用
        if (!migrationSettings.enabled) {
          mapRef.value.enableMigration();
          migrationSettings.enabled = true;
        }
        
        // 创建一些基本的飞线数据
        const defaultMigrationData = generateDefaultMigrationData();
        
        // 应用当前样式设置
        updateMigrationStyle();
        
        // 等待选项应用后设置数据
        setTimeout(() => {
          // 设置飞线图数据
          mapRef.value.setMigrationData(defaultMigrationData as any, false);
          migrationSettings.hasData = true;
          
          // 等待数据应用后开始动画
          setTimeout(() => {
            // 开始播放飞线动画
            mapRef.value.startMigration();
            migrationSettings.isPlaying = true;
            
            ElMessage({
              message: '已开启飞线图 (使用新版Echarts 5实现)',
              type: 'success',
              duration: 2000
            });
          }, 300);
        }, 300);
      }, 300);
    }
  } catch (e) {
    log.error(`开启飞线图失败: ${e}`);
    
    ElMessage({
      message: '开启飞线图失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 生成默认飞线图数据
const generateDefaultMigrationData = () => {
  try {
    // 使用硬编码的安全坐标
    const testData = [
      {
        from: [116.4074, 39.9042], // 北京 [经度, 纬度]
        to: [121.4737, 31.2304],   // 上海 [经度, 纬度]
        labels: {
          from: '北京',
          to: '上海'
        },
        color: '#FF5252'
      },
      {
        from: [116.4074, 39.9042], // 北京
        to: [113.2644, 23.1291],   // 广州
        labels: {
          from: '北京',
          to: '广州'
        },
        color: '#448AFF'
      },
      {
        from: [116.4074, 39.9042], // 北京
        to: [114.0579, 22.5431],   // 深圳
        labels: {
          from: '北京',
          to: '深圳'
        },
        color: '#4CAF50'
      },
      {
        from: [116.4074, 39.9042], // 北京
        to: [104.0668, 30.5728],   // 成都
        labels: {
          from: '北京',
          to: '成都'
        },
        color: '#FFC107'
      }
    ];
    
    log.info(`已生成${testData.length}条飞线数据`);
    return testData;
  } catch (e) {
    log.error(`生成飞线数据失败: ${e}`);
    return [];
  }
};

// 更新飞线图样式
const updateMigrationStyle = () => {
  if (!mapRef.value || !isMigrationEnabled.value) return;
  
  try {
    // 检测当前使用的飞线图实现类型
    const isUsingECharts5 = mapRef.value.migrationImpl === 'echarts5';
    
    // 根据UI控制更新一些关联属性
    migrationOptions.label.show = migrationOptions.showSymbolName;
    migrationOptions.effect.symbolSize = migrationOptions.symbolSize;
    migrationOptions.pathSymbolColor = migrationOptions.effect.color;
    
    // 记录波动效果设置，用于调试
    const wasEffectEnabled = migrationOptions.symbolEffectEnabled;
    const rippleScale = migrationOptions.rippleEffect.scale;
    
    if (isUsingECharts5) {
      // 直接传递符合MigrationOptions接口的配置对象
      const options = {
        // 动画相关
        animation: migrationOptions.animation,
        animationDuration: migrationOptions.animationDuration,
        animationEasing: migrationOptions.animationEasing,
        animationDelay: migrationOptions.animationDelay,
        
        // 线条样式 - 统一使用lineStyle
        lineStyle: migrationOptions.lineStyle,
        
        // 符号大小
        symbolSize: migrationOptions.symbolSize,
        
        // 路径效果相关
        pathEffect: migrationOptions.pathEffect,
        pathSymbol: migrationOptions.pathSymbol,
        pathSymbolColor: migrationOptions.pathSymbolColor,
        
        // 飞线动画效果配置
        effect: {
          show: migrationOptions.effect.show,
          period: migrationOptions.effect.period,
          trailLength: migrationOptions.effect.trailLength,
          color: migrationOptions.effect.color,
          symbolSize: migrationOptions.symbolSize,
          symbol: migrationOptions.pathSymbol,
          animationType: migrationOptions.effect.animationType,
          loop: migrationOptions.effect.loop,
          delay: migrationOptions.effect.delay,
          duration: migrationOptions.effect.duration,
          constantSpeed: migrationOptions.effect.constantSpeed
        },
        
        // 3D效果
        enable3D: migrationOptions.enable3D,
        
        // 自动播放和循环
        autoStart: migrationOptions.autoStart,
        loop: migrationOptions.loop,
        
        // 标签设置
        label: {
          show: migrationOptions.showSymbolName,
          position: migrationOptions.label.position,
          formatter: migrationOptions.label.formatter,
          fontSize: migrationOptions.label.fontSize,
          color: migrationOptions.label.color,
          textBorderColor: migrationOptions.label.textBorderColor,
          textBorderWidth: migrationOptions.label.textBorderWidth
        },
        
        // 涟漪效果配置 - 确保show属性与symbolEffectEnabled保持同步
        rippleEffect: {
          show: migrationOptions.symbolEffectEnabled, // 关键:确保show属性与UI开关状态同步
          period: migrationOptions.rippleEffect.period,
          scale: migrationOptions.symbolEffectEnabled ? migrationOptions.rippleEffect.scale : 0, // 当关闭时强制设为0
          brushType: migrationOptions.rippleEffect.brushType
        },
        
        // 鼠标悬停动画
        hoverAnimation: migrationOptions.hoverAnimation
      };
      
      // 应用配置更新
      mapRef.value.updateMigrationOptions(options);
      
      // 添加调试日志，记录关键参数值
      log.info(`更新飞线图配置: symbolSize=${migrationOptions.symbolSize}, 波动效果=${migrationOptions.symbolEffectEnabled ? '开启' : '关闭'}, 波动大小=${migrationOptions.rippleEffect.scale}, 显示名称=${migrationOptions.showSymbolName ? '开启' : '关闭'}`);
      
      // 如果波动效果设置发生变化，则立即刷新图表
      if (typeof mapRef.value.refreshMigration === 'function') {
        log.info('正在刷新飞线图以应用波动效果设置...');
        
        try {
          // 使用refreshMigration方法立即刷新飞线图表
          const refreshResult = mapRef.value.refreshMigration();
          
          if (refreshResult) {
            log.info(`飞线图刷新成功，波动效果已${migrationOptions.symbolEffectEnabled ? '启用' : '禁用'}, 波动大小=${migrationOptions.rippleEffect.scale}`);
          } else {
            log.warn('飞线图刷新失败，波动效果可能未正确应用');
          }
        } catch (err) {
          log.warn(`刷新飞线图失败: ${err}`);
        }
      } else {
        // 如果refreshMigration不可用，尝试通过重新开始动画来强制刷新
        log.warn('refreshMigration方法不可用，尝试其他方式刷新');
        
        // 保存当前动画状态
        const wasPlaying = migrationSettings.isPlaying;
        
        if (wasPlaying) {
          // 先停止动画
          mapRef.value.stopMigration();
          
          // 短暂延迟后重新开始动画
          setTimeout(() => {
            mapRef.value.startMigration();
            log.info('通过重新开始动画方式刷新飞线图');
          }, 200);
        }
      }
    } else {
      // 传统格式 - 为antPath或其他实现
      mapRef.value.updateMigrationOptions({
        lineStyle: migrationOptions.lineStyle,
        effect: {
          ...migrationOptions.effect,
          rippleEffect: migrationOptions.symbolEffectEnabled,
          showSymbolName: migrationOptions.showSymbolName
        },
        label: migrationOptions.label,
        autoStart: migrationOptions.autoStart,
        loop: migrationOptions.loop
      });
    }
    
    log.info(`飞线图样式已更新 (${isUsingECharts5 ? 'ECharts 5' : '传统'}格式)`);
  } catch (e) {
    log.error(`更新飞线图样式失败: ${e}`);
  }
};

// 添加飞线图样式控制
const migrationOptions = reactive({
  // 全局设置
  enable3D: false,
  autoStart: true,
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut',
  animationDelay: 0,
  
  // 符号大小
  symbolSize: 12,
  
  // 线条相关 - 统一使用lineStyle
  lineStyle: {
    width: 2,
    opacity: 0.8,
    curveness: 0.2,
    color: '#FF5252',
    type: 'solid'
  },
  
  // 路径效果
  pathEffect: 'path',
  pathSymbol: 'circle',
  pathSymbolColor: '#FFFFFF',
  
  // 飞线动画效果配置
  effect: {
    show: true,
    period: 5,
    trailLength: 0, // 与slider中改为从0开始匹配
    color: '#FFFFFF',
    symbol: 'circle',
    symbolSize: 12, // 保持与外层symbolSize同步
    animationType: 'normal',
    loop: true,
    delay: 0,
    duration: 1000,
    constantSpeed: 0.2
  },
  
  // 波动效果配置
  rippleEffect: {
    period: 3,
    scale: 3.5,
    brushType: 'fill'
  },
  
  // 标签显示配置
  label: {
    show: false, // 初始值设为false，与showSymbolName保持同步
    position: 'right',
    formatter: '{b}',
    fontSize: 12,
    color: '#ffffff',
    textBorderColor: '#000000',
    textBorderWidth: 2
  },
  
  // 全局控制
  loop: true,
  hoverAnimation: true,
  
  // 兼容UI控制的扩展属性 (不属于MigrationOptions接口，但用于UI控制)
  symbolEffectEnabled: true,  // 控制rippleEffect.scale值
  showSymbolName: false       // 控制label.show值，初始值设为false
});

// 添加飞线图配置和状态
const migrationSettings = reactive({
  enabled: false,
  isPlaying: false,
  hasData: false,
  useECharts5: true
});

// 切换飞线图功能状态（开启/关闭）
const toggleMigrationFeature = (enabled: boolean) => {
  if (!mapRef.value) return;
  
  try {
    if (enabled) {
      // 启用飞线图功能
      mapRef.value.enableMigration();
      migrationSettings.enabled = true;
      
      
      ElMessage({
        message: '飞线图功能已开启',
        type: 'success',
        duration: 2000
      });
    } else {
      // 如果正在播放，先停止动画
      if (migrationSettings.isPlaying) {
        stopMigrationAnimation();
      }
      
      // 禁用飞线图功能
      mapRef.value.disableMigration();
      migrationSettings.enabled = false;
      
      ElMessage({
        message: '飞线图功能已关闭',
        type: 'info',
        duration: 2000
      });
    }
  } catch (e) {
    log.error(`切换飞线图功能失败: ${e}`);
    
    // 恢复状态
    migrationSettings.enabled = !enabled;
    
    ElMessage({
      message: '切换飞线图功能失败',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加飞线图样本数据
const addSampleMigrationData = () => {
  if (!mapRef.value || !migrationSettings.enabled) return;
  
  try {
    log.info('正在添加飞线图样本数据...');
    
    // 在进行所有操作前，给予充足时间让DOM完全渲染
    setTimeout(() => {
      try {
        // 创建一些基本的飞线数据
        const defaultMigrationData = generateDefaultMigrationData();
        
        // 确保数据格式正确
        if (!defaultMigrationData.length) {
          throw new Error('无法生成飞线数据');
        }
        
        log.info(`已生成${defaultMigrationData.length}条飞线数据`);
        
        // 第二步：等待一小段时间再设置数据
        setTimeout(() => {
          try {
            // 先禁用动画，减少初始化复杂度
            mapRef.value.updateMigrationOptions({
              animation: false
            });
            
            // 设置飞线图数据，但不自动开始动画
            mapRef.value.setMigrationData(defaultMigrationData as any, false);
            migrationSettings.hasData = true;
            
            log.info('飞线数据设置完成，等待渲染...');
            
            // 第三步：等待数据应用后再启用动画效果
            setTimeout(() => {
              try {
                // 重新启用动画效果
                mapRef.value.updateMigrationOptions({
                  animation: true
                });
                
                // 手动开始动画
                mapRef.value.startMigration();
                migrationSettings.isPlaying = true;
                
                ElMessage({
                  message: '已添加飞线数据并开始动画',
                  type: 'success',
                  duration: 2000
                });
              } catch (e) {
                log.error(`启动飞线动画失败: ${e}`);
              }
            }, 500);
          } catch (e) {
            log.error(`设置飞线数据失败: ${e}`);
            ElMessage({
              message: '设置飞线数据失败',
              type: 'error',
              duration: 3000
            });
          }
        }, 300);
      } catch (e) {
        log.error(`生成飞线数据失败: ${e}`);
        ElMessage({
          message: '生成飞线数据失败',
          type: 'error',
          duration: 3000
        });
      }
    }, 500); // 增加延迟，确保DOM已完全渲染
  } catch (e) {
    log.error(`添加飞线图数据失败: ${e}`);
    
    ElMessage({
      message: '添加飞线数据失败',
      type: 'error',
      duration: 3000
    });
  }
};

// 清除飞线数据
const clearMigrationData = () => {
  if (!mapRef.value || !migrationSettings.enabled) return;
  
  try {
    // 如果正在播放，先停止动画
    if (migrationSettings.isPlaying) {
      stopMigrationAnimation();
    }
    
    // 清除飞线图数据
    mapRef.value.setMigrationData([]);
    migrationSettings.hasData = false;
    
    ElMessage({
      message: '已清除飞线数据',
      type: 'success',
      duration: 2000
    });
  } catch (e) {
    log.error(`清除飞线数据失败: ${e}`);
    
    ElMessage({
      message: '清除飞线数据失败',
      type: 'error',
      duration: 3000
    });
  }
};

// 开始飞线动画
const startMigrationAnimation = () => {
  if (!mapRef.value || !migrationSettings.enabled || migrationSettings.isPlaying) return;
  
  try {
    // 如果没有数据，先添加数据
    if (!migrationSettings.hasData) {
      addSampleMigrationData();
    }
    
    // 开始播放飞线动画
    mapRef.value.startMigration();
    migrationSettings.isPlaying = true;
    
    ElMessage({
      message: '飞线动画已开始播放',
      type: 'success',
      duration: 2000
    });
  } catch (e) {
    log.error(`开始飞线动画失败: ${e}`);
    
    ElMessage({
      message: '开始飞线动画失败',
      type: 'error',
      duration: 3000
    });
  }
};

// 停止飞线动画
const stopMigrationAnimation = () => {
  if (!mapRef.value || !migrationSettings.enabled || !migrationSettings.isPlaying) return;
  
  try {
    // 停止飞线动画
    mapRef.value.stopMigration();
    migrationSettings.isPlaying = false;
    
    ElMessage({
      message: '飞线动画已停止',
      type: 'info',
      duration: 2000
    });
  } catch (e) {
    log.error(`停止飞线动画失败: ${e}`);
    
    ElMessage({
      message: '停止飞线动画失败',
      type: 'error',
      duration: 3000
    });
  }
};

// 立即应用飞线样式
const applyMigrationStyle = () => {
  if (!mapRef.value || !migrationSettings.enabled) return;
  
  try {
    // 先调用updateMigrationStyle更新配置
    updateMigrationStyle();
    
    // 记录关键参数
    log.info(`应用飞线样式: 散点大小=${migrationOptions.symbolSize}, 波动效果=${migrationOptions.symbolEffectEnabled ? '开启' : '关闭'}, 波动大小=${migrationOptions.rippleEffect.scale}, 显示名称=${migrationOptions.showSymbolName ? '开启' : '关闭'}`);
    
    // 如果当前使用的是ECharts 5实现，使用refreshMigration方法刷新图表
    if (mapRef.value.migrationImpl === 'echarts5') {
      // 保存当前动画状态
      const wasAnimating = migrationSettings.isPlaying;
      
      // 如果正在播放动画，先停止
      if (wasAnimating) {
        mapRef.value.stopMigration();
        log.info('暂停动画以应用新的样式设置');
      }
      
      // 等待停止动画完成
      setTimeout(() => {
        // 尝试刷新飞线图
        if (typeof mapRef.value.refreshMigration === 'function') {
          const result = mapRef.value.refreshMigration();
          
          if (result) {
            log.info('飞线图已成功刷新，样式已应用');
            
            // 如果之前在播放，恢复动画
            if (wasAnimating) {
              setTimeout(() => {
                mapRef.value.startMigration();
                log.info('已恢复动画播放');
              }, 200);
            }
            
            ElMessage({
              message: '飞线样式已应用',
              type: 'success',
              duration: 2000
            });
          } else {
            log.warn('飞线图刷新失败，尝试重新加载数据');
            
            // 如果refreshMigration返回失败，尝试通过重新加载数据来刷新
            if (migrationSettings.hasData && typeof mapRef.value.getMigrationData === 'function') {
              // 获取当前数据
              const currentData = mapRef.value.getMigrationData();
              if (currentData && currentData.length > 0) {
                // 重新设置数据并启动动画
                mapRef.value.setMigrationData(currentData, wasAnimating);
                log.info('已通过重新加载数据方式刷新飞线图');
                
                ElMessage({
                  message: '已通过重新加载数据方式应用飞线样式',
                  type: 'success',
                  duration: 2000
                });
              }
            }
          }
        } else {
          // 如果refreshMigration方法不存在，尝试通过切换动画状态来刷新
          log.warn('组件不支持refreshMigration方法，尝试通过切换动画状态来刷新');
          
          // 如果当前有数据，先获取数据
          let currentData = [];
          if (typeof mapRef.value.getMigrationData === 'function') {
            currentData = mapRef.value.getMigrationData();
          }
          
          // 如果有数据，重新设置数据
          if (currentData && currentData.length > 0) {
            // 简单的延迟后重新设置数据
            setTimeout(() => {
              mapRef.value.setMigrationData(currentData, wasAnimating);
              log.info('已通过重新设置数据方式刷新飞线图');
              
              ElMessage({
                message: '飞线样式已应用',
                type: 'success',
                duration: 2000
              });
            }, 200);
          } else {
            // 如果没有数据或无法获取数据，提示用户先添加数据
            ElMessage({
              message: '请先添加飞线数据',
              type: 'warning',
              duration: 2000
            });
          }
        }
      }, 200);
    } else {
      // 对于非ECharts 5实现，样式更新可能立即生效
      log.info('对于非ECharts 5实现，样式已通过updateMigrationOptions更新');
      
      ElMessage({
        message: '飞线样式已更新',
        type: 'success',
        duration: 2000
      });
    }
  } catch (e) {
    log.error(`应用飞线样式失败: ${e}`);
    
    ElMessage({
      message: `应用飞线样式失败: ${e}`,
      type: 'error',
      duration: 3000
    });
  }
};

// 监听migrationSettings与isMigrationEnabled的变化，保持同步
watch(
  () => migrationSettings.isPlaying, 
  (isPlaying) => {
    isMigrationEnabled.value = isPlaying;
  }
);

watch(
  () => isMigrationEnabled.value, 
  (enabled) => {
    migrationSettings.isPlaying = enabled;
  }
);

// 切换飞线图实现类型
const migrationImpl = ref<'antPath' | 'echarts5'>('echarts5');

// 切换飞线图实现类型
const toggleMigrationImpl = (useECharts5) => {
  try {
    if (!mapRef.value) return;
    
    // 停止当前动画
    mapRef.value.stopMigration();
    
    // 禁用当前飞线图
    mapRef.value.disableMigration();
    
    // 设置飞线图实现类型
    const implType = useECharts5 ? 'echarts5' : 'antPath';
    migrationImpl.value = implType;
    
    // 等待DOM刷新和组件重新渲染
    setTimeout(() => {
      // 重新启用飞线图
      mapRef.value.enableMigration();
      
      // 应用当前样式设置
      updateMigrationStyle();
      
      // 等待配置应用后重新开始动画
      setTimeout(() => {
        // 如果之前在播放，重新开始
        if (migrationSettings.isPlaying) {
          mapRef.value.startMigration();
        }
        
        log.info(`飞线图实现已切换为: ${implType}`);
        
        ElMessage({
          message: `飞线图实现已切换为: ${useECharts5 ? 'ECharts 5' : '默认样式'}`,
          type: 'success',
          duration: 2000
        });
      }, 500);
    }, 300);
  } catch (e) {
    log.error(`切换飞线图实现失败: ${e}`);
    
    // 恢复状态
    migrationSettings.useECharts5 = !useECharts5;
    
    ElMessage({
      message: '切换飞线图实现失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 定义不同类型城市的图标样式
const cityIcons = {
  '一线城市': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  },
  '二线城市': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  },
  '其他城市': {
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  }
};

// 定义城市类型
const cityTypes = {
  '北京': '一线城市',
  '上海': '一线城市',
  '广州': '一线城市',
  '深圳': '一线城市',
  '成都': '二线城市',
  '重庆': '二线城市',
  '武汉': '二线城市',
  '西安': '二线城市',
  '南京': '二线城市',
  '杭州': '二线城市',
  '济南': '其他城市',
  '天津': '其他城市'
};

// 更新缩放级别
const updateZoom = (zoom: number) => {
  if (!mapRef.value) return;
  
  try {
    // 设置地图的缩放级别
    mapRef.value.setZoom(zoom);
    log.info(`已更新地图缩放级别: ${zoom}`);
  } catch (e) {
    log.error(`更新缩放级别失败: ${e}`);
  }
};

// 添加自定义数量的随机标记点
const addRandomMarkersWithCount = () => {
  // 使用ElMessageBox创建一个弹窗，让用户输入要添加的标记点数量
  ElMessageBox.prompt('请输入要添加的随机点位数量', '自定义添加点位', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[1-9][0-9]*$/,
    inputErrorMessage: '请输入正整数'
  }).then(({ value }) => {
    // 将输入值转换为数字
    const count = parseInt(value, 10);
    
    // 调用添加随机标记点的函数
    addRandomMarkers(count);
    
    // 显示成功消息
    ElMessage({
      message: `已添加 ${count} 个随机点位`,
      type: 'success',
      duration: 2000
    });
  });
};

// 设置飞线最佳视图
const setOptimalZoomForMigration = () => {
  if (!mapRef.value) return;
  
  try {
    // 设置适合飞线图显示的缩放级别
    config.zoom = 5;
    updateZoom(5);
    
    // 如果有城市数据，设置中国大致中心位置
    const chinaCenter: [number, number] = [35, 105]; // 中国大致中心位置
    mapRef.value.setCenter(chinaCenter);
    
    // 显示成功消息
    ElMessage({
      message: '已设置为飞线图最佳视图',
      type: 'success',
      duration: 2000
    });
    
    log.info('已设置飞线图最佳视图: 缩放级别=5, 中心点=[35, 105]');
  } catch (e) {
    log.error(`设置飞线图最佳视图失败: ${e}`);
  }
};

// 添加环形路径图
const addCircularPathline = () => {
  try {
    // 先清除当前飞线图
    clearMigration();
    
    // 创建环形路径数据
    const center = [116.3972, 39.9075] as [number, number]; // 北京中心
    const radius = 0.6; // 大约60公里的半径
    const pointsCount = 12; // 生成12个点形成环形
    const pathPoints = [];
    
    // 生成环形上的点
    for (let i = 0; i < pointsCount; i++) {
      const angle = (i / pointsCount) * Math.PI * 2;
      const lng = center[0] + Math.cos(angle) * radius;
      const lat = center[1] + Math.sin(angle) * radius;
      
      pathPoints.push({
        position: [lng, lat] as [number, number],
        name: `环形点${i+1}`
      });
    }
    
    // 添加中心点
    pathPoints.push({
      position: center,
      name: '中心'
    });
    
    // 生成路径数据 - 环形连接
    const pathData = [];
    
    // 先添加标记点
    pathPoints.forEach((point, index) => {
      mapRef.value.addMarker(
        { lat: point.position[1], lng: point.position[0] },
        {
          markerLabel: point.name,
          markerShowLabel: index === pathPoints.length - 1, // 只显示中心点标签
          markerCustomData: {
            index: index,
            name: point.name,
            isCenter: index === pathPoints.length - 1
          }
        }
      );
    });

    // 生成环形路径连接
    for (let i = 0; i < pointsCount; i++) {
      pathData.push({
        from: pathPoints[i].position,
        to: pathPoints[(i + 1) % pointsCount].position,
        color: `hsl(${(360 * i) / pointsCount}, 70%, 50%)`,
        weight: 3
      });
      
      // 添加到中心的辐射线
      pathData.push({
        from: pathPoints[i].position,
        to: center,
        color: '#999999',
        weight: 1.5
      });
    }
    
    // 确保飞线组件已启用，但配置为路径图模式
    mapRef.value.enableMigration();
    
    // 更新配置为路径图样式
    mapRef.value.updateMigrationOptions({
      lineStyle: {
        opacity: 0.8,
        type: 'solid',
        curveness: 0.05  // 很小的曲率
      },
      animation: false,
      effect: {
        show: false
      },
      symbol: ['none', 'none'], // 不显示起点和终点标记
      symbolSize: [0, 0]
    });
    
    // 设置路径数据
    mapRef.value.setMigrationData(pathData, false);
    
    // 更新状态
    isMigrationEnabled.value = true;
    
    // 提示用户
    ElMessage({
      message: '环形路径图已绘制',
      type: 'success',
      duration: 2000
    });
    
    // 调整地图视图
    mapRef.value.setCenter([center[1], center[0]]);
    mapRef.value.setZoom(9);
    
  } catch (e) {
    log.error(`添加环形路径图失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加环形路径图失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 在飞线图相关代码之后添加路径图函数

// 添加路径图示例
const addPathlineExample = () => {
  try {
    // 先清除当前飞线图
    clearMigration();
    
    // 创建线性路径，使用真实经纬度
    
    // 定义路径点 - 使用中国高速公路路线示例
    const pathPoints = [
      { position: [116.4074, 39.9042] as [number, number], name: '北京' },
      { position: [116.7969, 39.2847] as [number, number], name: '廊坊' },
      { position: [117.2010, 39.0842] as [number, number], name: '天津' },
      { position: [117.9249, 38.3125] as [number, number], name: '黄骅' },
      { position: [118.4575, 37.4639] as [number, number], name: '滨州' },
      { position: [118.7969, 36.6677] as [number, number], name: '淄博' },
      { position: [117.1205, 36.6510] as [number, number], name: '济南' }
    ];
    
    // 生成路径数据
    const pathData = [];
    
    // 先添加标记点
    pathPoints.forEach((point, index) => {
      mapRef.value.addMarker(
        { lat: point.position[1], lng: point.position[0] },
        {
          markerLabel: point.name,
          markerShowLabel: true,
          markerCustomData: {
            index: index,
            name: point.name,
            isStart: index === 0,
            isEnd: index === pathPoints.length - 1
          }
        }
      );
    });

    // 生成路径数据
    for (let i = 0; i < pathPoints.length - 1; i++) {
      pathData.push({
        from: pathPoints[i].position,
        to: pathPoints[i + 1].position,
        labels: {
          from: pathPoints[i].name,
          to: pathPoints[i + 1].name
        },
        color: pathlineSettings.color, // 使用路径设置中的颜色
        weight: pathlineSettings.width // 使用路径设置中的宽度
      });
    }
    
    // 保存路径数据以便后续应用样式
    pathlineSettings.lastPathData = pathData;
    
    // 确保飞线组件已启用，但配置为路径图模式
    mapRef.value.enableMigration();
    
    // 更新配置为路径图样式
    mapRef.value.updateMigrationOptions({
      lineStyle: {
        width: pathlineSettings.width,
        opacity: 0.9,
        type: pathlineSettings.style,
        curveness: pathlineSettings.curveness,
        color: pathlineSettings.color
      },
      animation: false, // 禁用动画效果
      effect: {
        show: false,   // 关闭线条动画效果
        period: 0,
        symbolSize: 0
      },
      showEffectOn: 'none',  // 不显示特效
      // 设置端点样式
      symbol: ['circle', 'arrow'], // 起点为圆形，终点为箭头
      symbolSize: [5, 8]  // 起点和终点的大小
    });
    
    // 设置路径数据
    mapRef.value.setMigrationData(pathData, false);
    
    // 更新状态
    isMigrationEnabled.value = true;
    pathlineSettings.enabled = true;
    
    // 提示用户
    ElMessage({
      message: '高速公路路径已绘制',
      type: 'success',
      duration: 2000
    });
    
    // 调整地图视图以显示全部路径
    const boundsArray = [
      [Math.min(...pathPoints.map(p => p.position[1])) - 0.5, Math.min(...pathPoints.map(p => p.position[0])) - 0.5],
      [Math.max(...pathPoints.map(p => p.position[1])) + 0.5, Math.max(...pathPoints.map(p => p.position[0])) + 0.5]
    ] as [[number, number], [number, number]];
    
    mapRef.value.fitBounds(boundsArray);
    
  } catch (e) {
    log.error(`添加路径图失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '添加路径图失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 添加路径设置数据，放在migrationSettings后面
const pathlineSettings = reactive({
  style: 'solid',
  width: 4,
  color: '#409EFF',
  curveness: 0.1,
  enabled: false,
  lastPathData: [] // 保存最后一次设置的路径数据
});

// 更新路径样式
const updatePathlineStyle = () => {
  if (!mapRef.value) return;
  
  try {
    // 确保飞线组件已启用，但配置为路径图模式
    if (!isMigrationEnabled.value) {
      mapRef.value.enableMigration();
      isMigrationEnabled.value = true;
    }
    
    // 更新配置为路径图样式
    mapRef.value.updateMigrationOptions({
      lineStyle: {
        width: pathlineSettings.width,
        opacity: 0.9,
        type: pathlineSettings.style,
        curveness: pathlineSettings.curveness,
        color: pathlineSettings.color
      },
      animation: false, // 禁用动画效果
      effect: {
        show: false,   // 关闭线条动画效果
        period: 0,
        symbolSize: 0
      },
      showEffectOn: 'none',  // 不显示特效
      // 设置端点样式
      symbol: ['circle', 'arrow'], // 起点为圆形，终点为箭头
      symbolSize: [5, 8]  // 起点和终点的大小
    });
    
    // 提示用户
    ElMessage({
      message: '路径样式已更新',
      type: 'success',
      duration: 2000
    });
  } catch (e) {
    log.error(`更新路径样式失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '更新路径样式失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 应用路径样式
const applyPathlineStyle = () => {
  if (!mapRef.value) return;
  
  try {
    // 更新路径样式
    updatePathlineStyle();
    
    // 如果有已保存的路径数据，重新应用
    if (pathlineSettings.lastPathData && pathlineSettings.lastPathData.length > 0) {
      // 重新设置路径数据
      mapRef.value.setMigrationData(pathlineSettings.lastPathData, false);
      
      // 提示用户
      ElMessage({
        message: '路径样式已应用到当前路径',
        type: 'success',
        duration: 2000
      });
    } else {
      ElMessage({
        message: '请先添加路径数据',
        type: 'warning',
        duration: 2000
      });
    }
  } catch (e) {
    log.error(`应用路径样式失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '应用路径样式失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

// 清除路径
const clearPathline = () => {
  if (!mapRef.value) return;
  
  try {
    // 清除迁移数据
    clearMigration();
    
    // 清除保存的路径数据
    pathlineSettings.lastPathData = [];
    
    // 提示用户
    ElMessage({
      message: '路径已清除',
      type: 'success',
      duration: 2000
    });
  } catch (e) {
    log.error(`清除路径失败: ${e}`);
    
    // 提示用户
    ElMessage({
      message: '清除路径失败，请检查控制台日志',
      type: 'error',
      duration: 3000
    });
  }
};

</script>

<style scoped>
.migration-style-controls {
  margin-top: 16px;
  padding: 14px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e6e8eb;
  transition: all 0.3s ease;
}

.migration-style-controls:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.control-subtitle {
  font-size: 14px;
  font-weight: bold;
  color: #1890ff;
  margin: 10px 0;
  padding-bottom: 6px;
  border-bottom: 1px dashed #e6e8eb;
  display: flex;
  align-items: center;
}

.control-subtitle::before {
  content: "•";
  margin-right: 6px;
  color: #1890ff;
  font-size: 18px;
  line-height: 1;
}

/* 为大按钮添加动画效果 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.el-button.el-button--large {
  transition: all 0.3s ease;
}

.el-button.el-button--large:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
  animation: pulse 1.5s infinite;
}

.sc-map-example {
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

h2 {
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: bold;
}

.example-content {
  display: flex;
  gap: 20px;
  min-height: 500px;
  flex: 1;
  overflow: hidden;
}

.map-area {
  flex: 1;
  min-width: 0;
}

.config-area {
  width: 400px;
  flex-shrink: 0;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  max-height: calc(100vh - 100px);
}

.map-container {
  height: 500px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
}

h4 {
  margin-top: 20px;
  margin-bottom: 10px;
  font-size: 16px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-weight: bold;
  color: #606266;
  display: flex;
  align-items: center;
}

.value-badge {
  margin-left: 8px;
  background-color: #409eff;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: normal;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-row span {
  width: 70px;
  flex-shrink: 0;
}

.value {
  width: 40px;
  text-align: right;
}

.status-text {
  font-size: 12px;
  color: #606266;
  width: auto !important;
}

.zoom-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 5px;
}

.preset-section {
  margin-top: 20px;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.custom-url-hint {
  font-size: 12px;
  color: #E6A23C;
  margin-top: 5px;
}

.map-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #ebeef5;
}

.info-item {
  display: flex;
  margin-bottom: 5px;
}

.info-label {
  font-weight: bold;
  width: 80px;
  flex-shrink: 0;
}

.info-value {
  color: #409eff;
}

.buttons-row {
  display: flex;
  justify-content: space-s;
  width: 100%;
}

.buttons-row .el-button {
  flex: 1;
  min-width: 0;
}

/* 自定义弹框样式 */
.simple-popup {
  font-size: 13px;
  color: #333;
}

.simple-popup-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.simple-data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.simple-label {
  font-weight: 600;
  color: #606266;
  margin-right: 8px;
}

.simple-value {
  color: #303133;
}

/* 自定义形状弹框标题样式 */
.custom-shape-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  margin-bottom: 12px;
}

.shape-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.shape-tag {
  font-size: 12px;
  padding: 2px 6px;
  background-color: #409eff;
  color: white;
  border-radius: 4px;
  white-space: nowrap;
}

/* 根据分类显示不同颜色的标签 */
.shape-tag:global(.安防) {
  background-color: #E91E63;
}

.shape-tag:global(.商业) {
  background-color: #9C27B0;
}

.shape-tag:global(.教育) {
  background-color: #009688;
}

.shape-tag:global(.示例) {
  background-color: #FF9800;
}

/* 事件日志显示区域 */
.event-logs {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  max-height: 300px;
  overflow-y: auto;
}

.event-logs h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #303133;
}

.no-logs {
  font-size: 14px;
  color: #909399;
  text-align: center;
  padding: 20px 0;
}

.logs-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.log-item {
  padding: 8px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item:hover {
  background-color: #f0f9ff;
}

.log-time {
  color: #909399;
  font-size: 11px;
}

.log-event {
  color: #1890ff;
  font-weight: 500;
}

.log-data {
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.control-row {
  margin-bottom: 10px;
}

.value {
  margin-left: 10px;
}
</style>

