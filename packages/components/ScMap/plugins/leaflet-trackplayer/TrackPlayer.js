import L from "leaflet";
import * as turf from "@turf/turf";
import "leaflet-polylinedecorator";
import "leaflet-rotatedmarker";
L.TrackPlayer = class {
  constructor(track, options = {}) {
    //格式化传入的轨迹数组，目的是传入的轨迹数组可以是任意格式（[{lng:xx,lat:xx}]/[[xx,xx]]）
    let leafletLatlngs = L.polyline(track)._latlngs;
    this.track = turf.lineString(
      leafletLatlngs.map(({ lng, lat }) => [lng, lat])
    );
    this.distanceSlice = [0];
    this.track.geometry.coordinates.forEach((item, index, arr) => {
      if(index!==0){
        let line = turf.lineString(arr.slice(0,index+1));
        this.distanceSlice.push(turf.length(line));
      }
    });
    this.distance = turf.length(this.track);
    this.addedToMap = false;
    this.options = {
      speed: options.speed ?? 600,
      weight: options.weight ?? 8,
      markerIcon: options.markerIcon,
      polylineDecoratorOptions: options.polylineDecoratorOptions ?? {
        patterns: [
          {
            offset: 30,
            repeat: 60,
            symbol: L.Symbol.arrowHead({
              pixelSize: 5,
              headAngle: 75,
              polygon: false,
              pathOptions: { stroke: true, weight: 3, color: "#fff" },
            }),
          },
        ],
      },
      passedLineColor: options.passedLineColor ?? "#0000ff",
      notPassedLineColor: options.notPassedLineColor ?? "#ff0000",
      panTo: options.panTo ?? false, // 默认不跟随相机
      markerRotationOrigin: options.markerRotationOrigin ?? "center",
      markerRotationOffset: options.markerRotationOffset ?? 0,
      markerRotation: options.markerRotation ?? true,
      progress: options.progress ?? 0,
    };
    this.initProgress = options.progress;
    this.isPaused = true;
    this.walkedDistance = 0;
    this.walkedDistanceTemp = 0;
    this.trackIndex = 0;
    //被监听的事件
    this.listenedEvents = {
      start: [],
      pause: [],
      finished: [],
      progressCallback: [],
    };
  }
  addTo(map) {
    if(this.addedToMap) return;
    this.map = map;
    this.addedToMap = true;
    if (this.options.markerIcon) {
      let start = this.track.geometry.coordinates[0];
      
      // 创建标记前根据 panTo 设置决定是否设置 autoPan 选项
      const markerOptions = {
        icon: this.options.markerIcon,
        // 当 panTo 为 false 时，禁用 autoPan
        autoPan: this.options.panTo === true,
        // 当 panTo 为 false 时，关闭任何可能导致地图移动的选项
        autoPanPadding: [0, 0],
        interactive: true
      };
      
      this.marker = L.marker([start[1],start[0]], markerOptions).addTo(this.map);
      
      // 储存原始方法引用，以便在 panTo 改变时可以恢复
      if (this.marker._bringToFront) {
        this.marker._originalBringToFront = this.marker._bringToFront;
      }
      
      // 当 panTo 为 false 时，覆盖可能导致地图平移的方法
      if (this.options.panTo === false) {
        // 覆盖_bringToFront方法，防止自动拉回视图
        if (this.marker._bringToFront) {
          this.marker._bringToFront = function() {
            // 只执行图层重排，不执行地图平移
            if (this._zoomAnimated) {
              this._element.style.zIndex = 9999;
            }
            return this;
          };
        }
        
        // 覆盖setLatLng方法，防止其导致地图移动
        const originalSetLatLng = this.marker.setLatLng;
        this.marker.setLatLng = function(latlng) {
          // 保存当前地图中心和缩放级别
          if (this._map) {
            const currentCenter = this._map.getCenter();
            const currentZoom = this._map.getZoom();
            
            // 调用原始的setLatLng方法
            const result = originalSetLatLng.call(this, latlng);
            
            // 如果地图中心点改变，恢复原来的位置
            if (!currentCenter.equals(this._map.getCenter()) || currentZoom !== this._map.getZoom()) {
              this._map.setView(currentCenter, currentZoom, {animate: false});
            }
            
            return result;
          }
          return originalSetLatLng.call(this, latlng);
        };
        
        // 覆盖bindPopup方法，确保popup不会导致地图移动
        const originalBindPopup = this.marker.bindPopup;
        this.marker.bindPopup = function(content, options) {
          // 合并选项，确保禁用autoPan
          const popupOptions = L.extend({}, options || {}, {
            autoPan: false,
            autoPanPadding: [0, 0],
            keepInView: false
          });
          return originalBindPopup.call(this, content, popupOptions);
        };
        
        // 如果已有popup，更新其选项
        if (this.marker.getPopup()) {
          const popup = this.marker.getPopup();
          popup.options.autoPan = false;
          popup.options.keepInView = false;
          
          // 覆盖popup的_updatePosition方法，防止其触发地图移动
          const originalUpdatePosition = popup._updatePosition;
          popup._updatePosition = function() {
            // 保存当前地图中心
            const currentCenter = this._map.getCenter();
            const currentZoom = this._map.getZoom();
            
            // 执行原始更新位置方法
            originalUpdatePosition.apply(this, arguments);
            
            // 如果地图中心发生变化，恢复原始中心
            if (!currentCenter.equals(this._map.getCenter()) || currentZoom !== this._map.getZoom()) {
              this._map.setView(currentCenter, currentZoom, {animate: false});
            }
          };
        }
      }
      
      if (this.options.markerRotation) {
        let coordinates = this.track.geometry.coordinates;
        this.marker.setRotationAngle(
          turf.bearing(coordinates[0], coordinates[1]) / 2 +
            this.options.markerRotationOffset / 2
        );
        this.marker.setRotationOrigin(
          this.options.markerRotationOrigin
        );
      }
    }

    let path = this.track.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    // 使用传入的渲染器或创建新的Canvas渲染器
    const renderer = this.options.renderer || L.canvas();
    
    // 创建未经过轨迹线，使用Canvas渲染器提高性能
    this.notPassedLine = L.polyline(path, {
      weight: this.options.weight,
      color: this.options.notPassedLineColor,
      // 使用Canvas渲染器
      renderer: renderer,
      // 线条平滑因子
      smoothFactor: this.options.rendererOptions?.smoothFactor || 1,
      // 提高线条绘制精度
      interactive: false, // 非交互式可提高性能
      // 确保线条完全绘制
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.map);

    // 创建已经过轨迹线，同样使用Canvas渲染器
    this.passedLine = L.polyline([], {
      weight: this.options.weight,
      color: this.options.passedLineColor,
      // 使用Canvas渲染器
      renderer: renderer,
      // 线条平滑因子
      smoothFactor: this.options.rendererOptions?.smoothFactor || 1,
      // 提高线条绘制精度
      interactive: false, // 非交互式可提高性能
      // 确保线条完全绘制
      lineJoin: 'round',
      lineCap: 'round'
    }).addTo(this.map);
    // 创建轨迹装饰器（箭头等），同样使用Canvas渲染
    this.polylineDecorator = L.polylineDecorator(
      path,
      {
        ...this.options.polylineDecoratorOptions,
        // 确保装饰器渲染在Canvas上以提高性能
        renderer: renderer
      }
    ).addTo(this.map);
    
    if (this.initProgress) {
      this.setProgress(this.initProgress);
    }
    return this;
  }
  remove() {
    if (this.addedToMap) {
      this.addedToMap = false;
      this.polylineDecorator.remove();
      this.polylineDecorator = null;
      this.notPassedLine.remove();
      this.notPassedLine = null;
      this.passedLine.remove();
      this.passedLine = null;
      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }
      this.finished = false;
      this.startTimestamp = 0;
      this.pauseTimestamp = 0;
      this.walkedDistanceTemp = 0;
      this.walkedDistance = 0;
      this.trackIndex = 0;
      this.isPaused = true;
      this.options.progress = this.initProgress;
    }
  }
  start() {
    
    if ((!this.isPaused && !this.finished) || !this.addedToMap) return;
    if (this.options.progress === 0 || this.options.progress === 1) {
      this.startTimestamp = 0;
      this.pauseTimestamp = 0;
      this.walkedDistanceTemp = 0;
      this.walkedDistance = 0;
    }
    this.isPaused = false;
    this.finished = false;
    if (this.pauseTimestamp && this.startTimestamp) {
      this.startTimestamp =
        this.startTimestamp + (Date.now() - this.pauseTimestamp);
    }
    this.startAction();
    this.listenedEvents.start.forEach((item) => item());
    if (this.initProgress) {
      this.setProgress(this.initProgress);
    }
  }
  pause() {
    if (this.isPaused || this.finished) return;
    this.pauseTimestamp = Date.now();
    this.isPaused = true;
    this.listenedEvents.pause.forEach((item) => item());
  }
  startAction() {
    //计算轨迹总长度
    let distance = this.distance;
    //开始播放轨迹
    let player = (timestamp) => {
      if (timestamp&&this.addedToMap) {
        let totalDuration = (distance / this.options.speed) * 3600 * 1000; // 总体播放时间（毫秒）
        this.startTimestamp ||= timestamp; //为播放开始时的时间戳赋值
        let takeTime = timestamp - this.startTimestamp; //从播放开始到此刻时间过去了多久
        this.walkedDistance =
          distance * (takeTime / totalDuration) + this.walkedDistanceTemp; //根据当前时间在整体时间的占比计算到下一个点位要前进多远距离
        this.playAction();
      }
     
      if (!this.isPaused && !this.finished) {
        requestAnimationFrame(player);
      }
    };
    player();
  }
  playAction(settingProgress = false) {
    if (this.isPaused && !settingProgress) return;
    let distance = this.distance;

    this.trackIndex = this.distanceSlice.findIndex((item,index,arr) => {
      return this.walkedDistance>=item&&this.walkedDistance<(arr[index+1]??Infinity);
    });

    let [lng, lat] = turf.along(this.track, this.walkedDistance).geometry
      .coordinates;
    this.markerPoint = [lat, lng];
    
    // 根据相机跟随设置决定是否平移地图
    // 只有当明确启用了相机跟随(panTo=true)时才执行平移操作
    if (this.options.panTo === true && this.map) {
      try {
        // 检查地图是否已准备好进行平移操作
        if (this.map._container && this.map._container.offsetWidth && 
            this.map._mapPane && this.map._mapPane._leaflet_pos) {
          this.map.panTo(this.markerPoint, {
            animate: false, // 播放过程中不使用动画以避免卡顿
          });
        } else {
          // 地图未准备好，跳过此次平移
          console.warn('地图未准备好进行平移操作，跳过此次平移');
        }
      } catch (err) {
        // 捕获任何可能的异常
        console.error('相机跟随时发生错误:', err);
      }
    }
    // 当panTo为false时，不执行任何平移操作，轨迹播放时地图保持静止
    
    // 更新marker位置时，根据panTo设置决定是否允许自动拉回视图
    if (this.marker) {
      // 处理 _bringToFront 方法
      if (!this.marker._originalBringToFront && this.marker._bringToFront) {
        this.marker._originalBringToFront = this.marker._bringToFront;
      }
      
      if (this.options.panTo === false && this.marker._originalBringToFront) {
        // 关闭相机跟随时，覆盖 _bringToFront 方法，防止自动拉回视图
        this.marker._bringToFront = function() {
          // 只执行图层重排，不执行地图平移
          if (this._zoomAnimated) {
            this._element.style.zIndex = 9999;
          }
          return this;
        };
        
        // 关闭相机跟随时，覆盖setLatLng方法
        if (!this.marker._originalSetLatLng) {
          this.marker._originalSetLatLng = this.marker.setLatLng;
        }
        
        this.marker.setLatLng = function(latlng) {
          // 保存当前地图中心和缩放级别
          if (this._map) {
            const currentCenter = this._map.getCenter();
            const currentZoom = this._map.getZoom();
            
            // 调用原始的setLatLng方法
            const result = this._originalSetLatLng.call(this, latlng);
            
            // 如果地图中心点改变，恢复原来的位置
            if (!currentCenter.equals(this._map.getCenter()) || currentZoom !== this._map.getZoom()) {
              this._map.setView(currentCenter, currentZoom, {animate: false});
            }
            
            return result;
          }
          return this._originalSetLatLng.call(this, latlng);
        };
      } else if (this.marker._originalBringToFront) {
        // 开启相机跟随时，恢复原始方法
        this.marker._bringToFront = this.marker._originalBringToFront;
        
        // 恢复原始的setLatLng方法
        if (this.marker._originalSetLatLng) {
          this.marker.setLatLng = this.marker._originalSetLatLng;
        }
      }
      
      // 更新 autoPan 相关属性
      if (this.marker.options) {
        this.marker.options.autoPan = this.options.panTo === true;
        this.marker.options.autoPanPadding = this.options.panTo === true ? [50, 50] : [0, 0];
      }
      
      // 处理弹出窗口 autoPan 设置
      if (this.marker.getPopup()) {
        const popup = this.marker.getPopup();
        popup.options.autoPan = this.options.panTo === true;
        popup.options.keepInView = this.options.panTo === true;
        
        // 在非panTo模式下，处理popup的位置更新
        if (this.options.panTo === false && popup._updatePosition) {
          // 保存原始方法
          if (!popup._originalUpdatePosition) {
            popup._originalUpdatePosition = popup._updatePosition;
          }
          
          // 覆盖更新位置的方法
          popup._updatePosition = function() {
            // 保存当前地图中心
            const currentCenter = this._map.getCenter();
            const currentZoom = this._map.getZoom();
            
            // 执行原始更新位置方法
            popup._originalUpdatePosition.apply(this, arguments);
            
            // 如果地图中心发生变化，恢复原始中心
            if (!currentCenter.equals(this._map.getCenter()) || currentZoom !== this._map.getZoom()) {
              this._map.setView(currentCenter, currentZoom, {animate: false});
            }
          };
        } else if (popup._originalUpdatePosition) {
          // 恢复原始方法
          popup._updatePosition = popup._originalUpdatePosition;
        }
      }
      
      // 根据panTo设置，决定是否使用特殊方式更新marker位置
      if (this.options.panTo === false) {
        try {
          // 确保markerPoint是有效的经纬度数组
          if (this.markerPoint && Array.isArray(this.markerPoint) && this.markerPoint.length === 2) {
            // 使用已覆盖的setLatLng方法更新位置，该方法会自动处理防止地图移动
            const latLng = L.latLng(this.markerPoint[0], this.markerPoint[1]);
            this.marker.setLatLng(latLng);
            
            // 触发移动事件，便于其他组件感知标记位置变化
            this.marker.fire('move', {latlng: latLng});
          }
        } catch (err) {
          console.error('更新标记位置时出错:', err);
        }
      } else {
        // 正常更新位置（当启用相机跟随时）
        this.marker.setLatLng(this.markerPoint);
      }
    }
    
    //计算未经过的轨迹
    if (this.walkedDistance >= distance) {
      this.notPassedLine.setLatLngs([]);
    } else {
      let sliced = turf.lineSliceAlong(this.track, this.walkedDistance);
      const notPassedCoords = sliced.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      
      // 确保全部点位都正确渲染
      if (notPassedCoords.length > 0) {
        // 如果启用了绘制所有点位的选项
        if (this.options.renderAllPoints) {
          // 使用高精度绘制所有点位
          const highResolutionCoords = [];
          
          // 处理相邻点之间的距离，如果太远则插入中间点
          for (let i = 0; i < notPassedCoords.length - 1; i++) {
            const p1 = notPassedCoords[i];
            const p2 = notPassedCoords[i + 1];
            
            // 添加当前点
            highResolutionCoords.push(p1);
            
            // 计算两点之间的距离
            const d = L.latLng(p1[0], p1[1]).distanceTo(L.latLng(p2[0], p2[1]));
            
            // 如果距离大于阈值，插入中间点
            if (d > 100) { // 100米阈值
              const steps = Math.ceil(d / 50); // 每50米一个点
              
              for (let step = 1; step < steps; step++) {
                const ratio = step / steps;
                const lat = p1[0] + (p2[0] - p1[0]) * ratio;
                const lng = p1[1] + (p2[1] - p1[1]) * ratio;
                highResolutionCoords.push([lat, lng]);
              }
            }
          }
          
          // 添加最后一个点
          if (notPassedCoords.length > 0) {
            highResolutionCoords.push(notPassedCoords[notPassedCoords.length - 1]);
          }
          
          this.notPassedLine.setLatLngs(highResolutionCoords);
        } else {
          // 使用默认方式设置坐标
          this.notPassedLine.setLatLngs(notPassedCoords);
        }
      } else {
        this.notPassedLine.setLatLngs([]);
      }
    }
    
    //计算已经过的路径
    if (this.walkedDistance > 0) {
      let sliced = turf.lineSliceAlong(this.track, 0, this.walkedDistance);
      const passedCoords = sliced.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      
      // 确保全部点位都正确渲染
      if (passedCoords.length > 0) {
        // 如果启用了绘制所有点位的选项
        if (this.options.renderAllPoints) {
          // 使用高精度绘制所有点位
          const highResolutionCoords = [];
          
          // 处理相邻点之间的距离，如果太远则插入中间点
          for (let i = 0; i < passedCoords.length - 1; i++) {
            const p1 = passedCoords[i];
            const p2 = passedCoords[i + 1];
            
            // 添加当前点
            highResolutionCoords.push(p1);
            
            // 计算两点之间的距离
            const d = L.latLng(p1[0], p1[1]).distanceTo(L.latLng(p2[0], p2[1]));
            
            // 如果距离大于阈值，插入中间点
            if (d > 100) { // 100米阈值
              const steps = Math.ceil(d / 50); // 每50米一个点
              
              for (let step = 1; step < steps; step++) {
                const ratio = step / steps;
                const lat = p1[0] + (p2[0] - p1[0]) * ratio;
                const lng = p1[1] + (p2[1] - p1[1]) * ratio;
                highResolutionCoords.push([lat, lng]);
              }
            }
          }
          
          // 添加最后一个点
          if (passedCoords.length > 0) {
            highResolutionCoords.push(passedCoords[passedCoords.length - 1]);
          }
          
          this.passedLine.setLatLngs(highResolutionCoords);
        } else {
          // 使用默认方式设置坐标
          this.passedLine.setLatLngs(passedCoords);
        }
      } else {
        this.passedLine.setLatLngs([]);
      }
    } else {
      this.passedLine.setLatLngs([]);
    }

    //修改箭头线使他和轨迹契合
    this.polylineDecorator.setPaths([
      ...this.passedLine.getLatLngs(),
      ...this.notPassedLine.getLatLngs(),
    ]);
    //计算marker旋转角度
    if (this.walkedDistance < distance) {
      if (this.options.markerRotation && this.marker) {
        //计算当前点位到下一个点位的角度
        let bearing = 0;
        bearing = turf.bearing(
          turf.point([lng, lat]),
          turf.point(
            this.track.geometry.coordinates[this.trackIndex+1]
          )
        );

        this.marker.setRotationAngle(
          bearing / 2 + this.options.markerRotationOffset / 2
        );
      }
    }
    //更新播放进度
    this.options.progress = Math.min(1, this.walkedDistance / distance);
    this.listenedEvents.progressCallback.forEach((item) =>
      item(
        this.options.progress,
        L.latLng(...this.markerPoint),
        this.trackIndex
      )
    );
    //判断是否播放完成
    if (this.walkedDistance >= distance) {
      this.walkedDistance = distance;
      this.finished = true;
      this.listenedEvents.finished.forEach((item) => item());
      if (this.options.markerRotation && this.marker) {
        //播放完成时将marker旋转角设置为倒数第二个位置和倒数第一个位置形成的角度
        //为了解决离开页面，再切回来时marker直接移动完成导致旋转角度计算不准确的问题
        let coordinates = this.track.geometry.coordinates;
        let bearing = turf.bearing(
          turf.point(coordinates.at(-2)),
          turf.point(coordinates.at(-1))
        );
        this.marker.setRotationAngle(
          bearing / 2 + this.options.markerRotationOffset / 2
        );
      }
    }
  }
  setSpeedAction(speed) {
    this.options.speed = speed;
    this.walkedDistanceTemp = this.walkedDistance; //记录当前点位已经前进了多少距离了
    this.startTimestamp = 0;
  }
  async setSpeed(speed, wait = 20) {
    if (wait) {
      clearTimeout(this.setSpeedTimeout);
      await new Promise((resolve) => {
        this.setSpeedTimeout = setTimeout(resolve, wait);
      });
    }
    this.setSpeedAction(speed);
  }
  setProgress(progress) {
    if (!this.addedToMap) return;
    if (
      (this.options.progress == 1 && progress == 1) ||
      (this.options.progress == 0 && progress == 0)
    )
      return;
    
    // 更新进度值
    this.options.progress = progress;
    
    // 计算新的行走距离
    this.walkedDistanceTemp = this.distance * progress;
    this.startTimestamp = 0;
    
    // 无论播放状态如何，立即更新轨迹上的移动点位置
    this.walkedDistance = this.walkedDistanceTemp;
    
    // 更新轨迹段索引
    this.trackIndex = this.distanceSlice.findIndex((item,index,arr) => {
      return this.walkedDistance>=item&&this.walkedDistance<(arr[index+1]??Infinity);
    });
    
    // 计算当前距离对应的坐标点位置
    let pointOnTrack = turf.along(this.track, this.walkedDistance);
    let [lng, lat] = pointOnTrack.geometry.coordinates;
    this.markerPoint = [lat, lng];
    
    // 更新标记位置 - 根据panTo设置决定是否影响地图视图
    if (this.marker) {
      // 根据panTo设置决定是否影响地图视图
      if (this.options.panTo === false && this.map) {
        try {
          // 保存当前地图中心
          const currentCenter = this.map.getCenter();
          const currentZoom = this.map.getZoom();
          
          // 更新标记位置
          this.marker.setLatLng(this.markerPoint);
          
          // 确保地图视图不受影响
          if (!currentCenter.equals(this.map.getCenter()) || currentZoom !== this.map.getZoom()) {
            this.map.setView(currentCenter, currentZoom, {animate: false});
          }
        } catch (err) {
          console.error('设置进度更新标记位置时出错:', err);
          // 退回到简单方法
          this.marker.setLatLng(this.markerPoint);
        }
      } else {
        // panTo=true模式下直接更新位置，允许地图跟随
        this.marker.setLatLng(this.markerPoint);
      }
      
      // 更新标记旋转角度
      if (this.options.markerRotation && this.trackIndex < this.track.geometry.coordinates.length - 1) {
        let bearing = turf.bearing(
          turf.point([lng, lat]),
          turf.point(this.track.geometry.coordinates[this.trackIndex + 1])
        );
        this.marker.setRotationAngle(bearing / 2 + this.options.markerRotationOffset / 2);
      }
    }
    
    // 立即更新轨迹线条显示状态
    this.playAction(true);
    
    // 对于暂停跟完成状态，调整进度
    if (this.isPaused || this.finished) {
      // 如果之前已完成但设置了新进度，则重置完成状态
      if (this.finished && progress < 1) {
        this.finished = false;
      }
      
      // 如果不是暂停状态，则启动播放
      if (!this.isPaused) {
        this.finished = false;
        this.isPaused = false;
        this.startAction();
      }
    }
    
    // 触发进度回调，确保UI能够获取到最新状态
    this.listenedEvents.progressCallback.forEach((item) =>
      item(
        this.options.progress,
        L.latLng(...this.markerPoint),
        this.trackIndex
      )
    );
  }
  // 添加 setPanTo 方法，动态设置是否跟随相机
  setPanTo(panTo) {
    // 保存原始状态以检测变化
    const previousState = this.options.panTo;
    // 更新跟随状态
    this.options.panTo = panTo;
    
    // 记录状态变化并输出调试信息
    if (previousState !== panTo) {
      console.log(`相机跟随状态已更改: ${panTo ? '开启' : '关闭'}`);
      
      // 当有 marker 时，根据 panTo 设置决定是否更新 marker 的相关属性
      if (this.marker) {
        // 处理 _bringToFront 方法
        if (!this.marker._originalBringToFront && this.marker._bringToFront) {
          this.marker._originalBringToFront = this.marker._bringToFront;
        }
        
        if (panTo === false && this.marker._originalBringToFront) {
          // 关闭相机跟随时，覆盖 _bringToFront 方法，防止自动拉回视图
          this.marker._bringToFront = function() {
            // 只执行图层重排，不执行地图平移
            if (this._zoomAnimated) {
              this._element.style.zIndex = 9999;
            }
            return this;
          };
          
          // 关闭相机跟随时，覆盖setLatLng方法
          if (!this.marker._originalSetLatLng) {
            this.marker._originalSetLatLng = this.marker.setLatLng;
          }
          
          this.marker.setLatLng = function(latlng) {
            // 保存当前地图中心和缩放级别
            if (this._map) {
              const currentCenter = this._map.getCenter();
              const currentZoom = this._map.getZoom();
              
              // 调用原始的setLatLng方法
              const result = this._originalSetLatLng.call(this, latlng);
              
              // 如果地图中心点改变，恢复原来的位置
              if (!currentCenter.equals(this._map.getCenter()) || currentZoom !== this._map.getZoom()) {
                this._map.setView(currentCenter, currentZoom, {animate: false});
              }
              
              return result;
            }
            return this._originalSetLatLng.call(this, latlng);
          };
        } else if (this.marker._originalBringToFront) {
          // 开启相机跟随时，恢复原始方法
          this.marker._bringToFront = this.marker._originalBringToFront;
          
          // 恢复原始的setLatLng方法
          if (this.marker._originalSetLatLng) {
            this.marker.setLatLng = this.marker._originalSetLatLng;
          }
        }
        
        // 更新 autoPan 相关属性
        if (this.marker.options) {
          this.marker.options.autoPan = panTo === true;
          this.marker.options.autoPanPadding = panTo === true ? [50, 50] : [0, 0];
        }
        
        // 处理弹出窗口 autoPan 设置
        if (this.marker.getPopup()) {
          const popup = this.marker.getPopup();
          popup.options.autoPan = panTo === true;
          popup.options.keepInView = panTo === true;
          
          // 在非panTo模式下，处理popup的位置更新
          if (!panTo && popup._updatePosition) {
            // 保存原始方法
            if (!popup._originalUpdatePosition) {
              popup._originalUpdatePosition = popup._updatePosition;
            }
            
            // 覆盖更新位置的方法
            popup._updatePosition = function() {
              // 保存当前地图中心
              const currentCenter = this._map.getCenter();
              const currentZoom = this._map.getZoom();
              
              // 执行原始更新位置方法
              popup._originalUpdatePosition.apply(this, arguments);
              
              // 如果地图中心发生变化，恢复原始中心
              if (!currentCenter.equals(this._map.getCenter()) || currentZoom !== this._map.getZoom()) {
                this._map.setView(currentCenter, currentZoom, {animate: false});
              }
            };
          } else if (popup._originalUpdatePosition) {
            // 恢复原始方法
            popup._updatePosition = popup._originalUpdatePosition;
          }
        }
      }
    }
    
    // 只有当启用相机跟随且状态发生了变化(从false变为true)时才执行平移
    // 这样可以确保关闭相机跟随时地图不会进行任何平移操作
    if (this.options.panTo === true && previousState === false) {
      // 如果已添加到地图且有定位点，立即更新地图视图位置
      if (this.addedToMap && this.markerPoint && this.map) {
        try {
          // 检查地图是否已准备好进行平移操作
          if (this.map._container && this.map._container.offsetWidth && 
              this.map._mapPane && this.map._mapPane._leaflet_pos) {
            // 无论播放状态如何，都立即移动相机到当前位置
            this.map.panTo(this.markerPoint, {
              animate: true, // 使用动画效果更平滑
              duration: 0.5  // 动画持续0.5秒
            });
            console.log('相机已移动到轨迹当前位置');
          } else {
            console.warn('地图未准备好进行平移操作，跳过初始平移');
          }
        } catch (err) {
          console.error('初始化相机跟随时发生错误:', err);
        }
      }
    }
  }
  on(evetName, callback) {
    switch (evetName) {
      case "start":
        this.listenedEvents.start.push(callback);
        break;
      case "pause":
        this.listenedEvents.pause.push(callback);
        break;
      case "finished":
        this.listenedEvents.finished.push(callback);
        break;
      case "progress":
        this.listenedEvents.progressCallback.push(callback);
        break;
    }
  }
  off(evetName, callback) {
    if (!callback) {
      this.listenedEvents[evetName] = [];
      return;
    }
    switch (evetName) {
      case "start":
        this.listenedEvents.start = this.listenedEvents.start.filter(
          (item) => item !== callback
        );
        break;
      case "pause":
        this.listenedEvents.pause = this.listenedEvents.pause.filter(
          (item) => item !== callback
        );
        break;
      case "finished":
        this.listenedEvents.finished = this.listenedEvents.finished.filter(
          (item) => item !== callback
        );
        break;
      case "progress":
        this.listenedEvents.progressCallback =
          this.listenedEvents.progressCallback.filter(
            (item) => item !== callback
          );
        break;
    }
  }
};