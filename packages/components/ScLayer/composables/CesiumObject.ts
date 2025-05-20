/**
 * Cesium对象类
 * 处理Cesium相关功能，包括3D模型添加、管理等
 * @author AI
 * @date 2023-03-06
 */
import * as Cesium from 'cesium';
import OLCesium from 'olcs';
import { Map as OlMap } from 'ol';
import logger from './LogObject';
import { CesiumModelObject, Model3DOptions, ModelEventHandlers } from './CesiumModelObject';

// 视角配置
export interface ViewOptions {
  position: {
    longitude: number;
    latitude: number;
    height?: number;
  };
  heading?: number;
  pitch?: number;
  roll?: number;
  duration?: number;
}

export class CesiumObject {
  private olCesium: OLCesium | null = null; // OLCesium实例
  private modelObject: CesiumModelObject | null = null; // 模型对象实例
  private enabled: boolean = false;
  private cesiumBaseUrl: string;
  private olMap: OlMap | null = null;
  
  // 视图模式
  private viewMode: '2D' | '3D' | '2.5D' = '2D';

  /**
   * 构造函数
   * @param olMap OpenLayers地图实例
   * @param cesiumBaseUrl Cesium资源基础URL
   */
  constructor(olMap: OlMap | null, cesiumBaseUrl: string = 'https://unpkg.com/cesium@1.109.0/Build/Cesium/') {
    this.cesiumBaseUrl = cesiumBaseUrl;
    this.olMap = olMap;
    
    if (olMap) {
      try {
        this.olCesium = new OLCesium({ 
          map: olMap,
          cesiumBaseUrl: this.cesiumBaseUrl
        });
        this.olCesium.setEnabled(false);
        logger.info('CesiumObject实例已创建');
        
        // 创建模型对象实例
        this.modelObject = new CesiumModelObject(null);
      } catch (error) {
        logger.error('创建OLCesium实例失败:', error);
      }
    } else {
      logger.warn('创建CesiumObject时未提供有效的OpenLayers地图实例');
    }
  }

  /**
   * 启用或禁用3D模式
   * @param value 是否启用
   * @param viewMode 视图模式 2D/3D/2.5D
   * @returns 是否成功切换
   */
  public setEnabled(value: boolean, viewMode: '2D' | '3D' | '2.5D' = '3D'): boolean {
    if (!this.olCesium) {
      logger.error('无法切换3D模式: OLCesium实例未初始化');
      return false;
    }

    try {
      // 保存当前模式设置
      if (value) {
        this.viewMode = viewMode;
      } else {
        this.viewMode = '2D';
      }
      
      // 启用/禁用 3D 模式
      this.olCesium.setEnabled(value);
      this.enabled = value;
      
      // 启用3D后，配置场景控制器
      if (value && this.olCesium.getCesiumScene) {
        const scene = this.olCesium.getCesiumScene();
        this.configureScene(scene, viewMode);
        
        // 将场景传递给模型对象
        if (this.modelObject) {
          this.modelObject.setScene(scene);
        }
      }
      
      logger.info(`已${value ? '启用' : '禁用'} ${viewMode} 模式`);
      return true;
    } catch (error) {
      logger.error(`切换3D模式失败:`, error);
      return false;
    }
  }

  /**
   * 配置Cesium场景
   * @param scene Cesium场景
   * @param viewMode 视图模式
   */
  private configureScene(scene: Cesium.Scene, viewMode: '2D' | '3D' | '2.5D'): void {
    if (!scene) return;
    
    try {
      // 获取场景控制器
      const controller = scene.screenSpaceCameraController;
      if (!controller) return;
      
      // 根据视图模式配置控制器
      if (viewMode === '3D') {
        // 完全3D模式 - 开启所有控制
        controller.enableRotate = true;      // 允许旋转
        controller.enableTranslate = true;   // 允许平移
        controller.enableZoom = true;        // 允许缩放
        controller.enableTilt = true;        // 允许倾斜
        controller.enableLook = true;        // 允许四处查看
        
        // 安全地使用CameraEventType
        if (Cesium.CameraEventType) {
          // 启用右键拖动控制视角
          controller.tiltEventTypes = [
            Cesium.CameraEventType.RIGHT_DRAG, // 右键拖动
            Cesium.CameraEventType.PINCH       // 捏合手势
          ];
          
          // 启用鼠标滚轮缩放
          controller.zoomEventTypes = [
            Cesium.CameraEventType.WHEEL,     // 滚轮缩放
            Cesium.CameraEventType.PINCH      // 捏合手势
          ];
        }
        
        // 配置相机默认视图
        scene.globe.enableLighting = true;     // 启用光照
        scene.fog.enabled = true;              // 启用雾效果
        scene.globe.depthTestAgainstTerrain = true; // 启用深度测试
      } else if (viewMode === '2.5D') {
        // 2.5D模式 - 限制部分控制
        controller.enableRotate = true;      // 允许旋转
        controller.enableTranslate = true;   // 允许平移
        controller.enableZoom = true;        // 允许缩放
        controller.enableTilt = true;        // 允许倾斜，但限制角度
        controller.enableLook = false;       // 禁用四处查看
        
        // 限制倾斜角度
        controller.minimumZoomDistance = 1;  // 最小缩放距离
        controller.maximumZoomDistance = 20000000; // 最大缩放距离
        
        // 安全地使用CameraEventType
        if (Cesium.CameraEventType) {
          // 禁用右键拖动控制视角，使用左键单一控制
          controller.tiltEventTypes = [
            Cesium.CameraEventType.MIDDLE_DRAG, // 中键拖动
            Cesium.CameraEventType.PINCH        // 捏合手势
          ];
        }
        
        // 相机设置
        scene.globe.enableLighting = false;    // 禁用光照
        scene.fog.enabled = true;              // 启用雾效果
        scene.globe.depthTestAgainstTerrain = false; // 禁用深度测试
      } else {
        // 2D模式 - 最受限制的控制
        controller.enableRotate = false;     // 禁用旋转
        controller.enableTranslate = true;   // 允许平移
        controller.enableZoom = true;        // 允许缩放
        controller.enableTilt = false;       // 禁用倾斜
        controller.enableLook = false;       // 禁用四处查看
        
        // 相机设置
        scene.globe.enableLighting = false;    // 禁用光照
        scene.fog.enabled = false;             // 禁用雾效果
        scene.globe.depthTestAgainstTerrain = false; // 禁用深度测试
      }
      
      // 配置地形 - 使用try-catch处理可能不存在的属性
      try {
        if (scene.globe && 'terrainExaggeration' in scene.globe) {
          scene.globe.terrainExaggeration = viewMode === '3D' ? 1.0 : 1.0;
        }
      } catch (e) {
        logger.debug('当前Cesium版本不支持terrainExaggeration');
      }
      
      // 配置基础渲染参数
      try {
        if (scene && 'fxaa' in scene) {
          scene.fxaa = true; // 抗锯齿
        }
      } catch (e) {
        logger.debug('当前Cesium版本不支持fxaa');
      }
      
      // 设置雾密度
      scene.fog.density = 0.0001; 
      
      // 部分版本可能不支持skyAtmosphere
      if (scene.skyAtmosphere) {
        scene.skyAtmosphere.show = viewMode !== '2D'; // 只在3D和2.5D模式显示大气层
      }
      
      // 设置地球基本颜色
      scene.globe.baseColor = Cesium.Color.WHITE;
      
      // 设置基础阴影参数
      if (scene.shadowMap) {
        scene.shadowMap.enabled = viewMode === '3D';
      }
      
      logger.debug(`场景已配置为 ${viewMode} 模式`);
    } catch (error) {
      logger.error('配置场景时出错:', error);
    }
  }

  /**
   * 获取3D模式状态
   * @returns 是否已启用3D模式
   */
  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 获取当前视图模式
   * @returns 当前视图模式
   */
  public getViewMode(): '2D' | '3D' | '2.5D' {
    return this.viewMode;
  }

  /**
   * 切换视图模式
   * @param mode 视图模式
   * @returns 是否成功切换
   */
  public switchViewMode(mode: '2D' | '3D' | '2.5D'): boolean {
    // 如果当前已启用3D模式，只需要重新配置场景
    if (this.enabled) {
      try {
        this.viewMode = mode;
        
        // 配置场景
        if (this.olCesium && this.olCesium.getCesiumScene) {
          const scene = this.olCesium.getCesiumScene();
          this.configureScene(scene, mode);
        }
        
        logger.info(`已切换至 ${mode} 模式`);
        return true;
      } catch (error) {
        logger.error(`切换到 ${mode} 模式失败:`, error);
        return false;
      }
    } else {
      // 如果当前是2D模式，需要先启用3D
      return this.setEnabled(true, mode);
    }
  }

  /**
   * 切换2D/3D视图模式
   * 如果当前是2D模式，则切换到3D；如果当前是3D模式，则切换到2D
   * @returns 是否成功切换
   */
  public toggle3D(): boolean {
    if (this.enabled) {
      // 当前已启用3D模式，禁用3D
      return this.setEnabled(false);
    } else {
      // 当前是2D模式，启用3D
      return this.setEnabled(true, '3D');
    }
  }

  /**
   * 获取Cesium场景实例
   * @returns Cesium场景实例
   */
  public getScene(): Cesium.Scene | null {
    if (!this.olCesium || !this.enabled) {
      logger.warn('无法获取Cesium场景: 3D模式未启用');
      return null;
    }
    
    try {
      return this.olCesium.getCesiumScene();
    } catch (error) {
      logger.error('获取Cesium场景失败:', error);
      return null;
    }
  }

  /**
   * 添加3D模型
   * @param options 模型配置选项
   * @returns 模型ID，如果添加失败则返回null
   */
  public addModel(options: Model3DOptions): string | null {
    // 如果3D模式未启用，先启用
    if (!this.enabled) {
      if (!this.setEnabled(true)) {
        logger.error('无法添加3D模型: 启用3D模式失败');
        return null;
      }
    }

    // 使用模型对象添加模型
    if (this.modelObject) {
      return this.modelObject.addModel(options);
    } else {
      logger.error('无法添加3D模型: 模型对象未初始化');
      return null;
    }
  }

  /**
   * 更新3D模型
   * @param id 模型ID
   * @param options 要更新的选项
   * @returns 是否更新成功
   */
  public updateModel(id: string, options: Partial<Model3DOptions>): boolean {
    if (!this.modelObject) {
      logger.error('无法更新3D模型: 模型对象未初始化');
      return false;
    }
    
    return this.modelObject.updateModel(id, options);
  }

  /**
   * 删除3D模型
   * @param id 模型ID
   * @returns 是否删除成功
   */
  public removeModel(id: string): boolean {
    if (!this.modelObject) {
      logger.error('无法删除3D模型: 模型对象未初始化');
      return false;
    }
    
    return this.modelObject.removeModel(id);
  }

  /**
   * 获取3D模型
   * @param id 模型ID
   * @returns 模型实例
   */
  public getModel(id: string): any {
    if (!this.modelObject) return null;
    return this.modelObject.getModel(id);
  }

  /**
   * 获取所有3D模型
   * @returns 所有模型的ID到实例映射
   */
  public getAllModels(): Map<string, any> {
    if (!this.modelObject) return new Map();
    return this.modelObject.getAllModels();
  }

  /**
   * 清除所有3D模型
   * @returns 是否清除成功
   */
  public clearAllModels(): boolean {
    if (!this.modelObject) {
      logger.error('无法清除3D模型: 模型对象未初始化');
      return false;
    }
    
    return this.modelObject.clearAllModels();
  }

  /**
   * 飞行到指定位置
   * @param options 飞行选项
   * @returns 是否成功
   */
  public flyTo(options: ViewOptions): boolean {
    if (!this.olCesium || !this.enabled) {
      logger.warn('无法执行飞行: 3D模式未启用');
      return false;
    }

    try {
      const scene = this.getScene();
      if (!scene) {
        logger.error('无法执行飞行: 无法获取场景');
        return false;
      }

      // 设置相机飞行目的地
      scene.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          options.position.longitude,
          options.position.latitude,
          options.position.height || 1000
        ),
        orientation: {
          heading: Cesium.Math.toRadians(options.heading || 0),
          pitch: Cesium.Math.toRadians(options.pitch || -30), // 默认俯视30度
          roll: Cesium.Math.toRadians(options.roll || 0)
        },
        duration: options.duration || 3.0 // 默认3秒
      });

      logger.info('相机飞行已启动');
      return true;
    } catch (error) {
      logger.error('执行相机飞行失败:', error);
      return false;
    }
  }

  /**
   * 飞行到指定模型
   * @param id 模型ID
   * @param options 额外飞行选项
   * @returns 是否成功
   */
  public flyToModel(id: string, options?: {
    offset?: {
      heading?: number;
      pitch?: number;
      range?: number;
    };
    duration?: number;
  }): boolean {
    if (!this.modelObject) {
      logger.error('无法飞行到模型: 模型对象未初始化');
      return false;
    }
    
    return this.modelObject.flyToModel(id, options);
  }

  /**
   * 设置模型事件处理器
   * @param handlers 事件处理器
   */
  public setModelEventHandlers(handlers: ModelEventHandlers): void {
    if (!this.modelObject) {
      logger.warn('无法设置模型事件处理器: 模型对象未初始化');
      return;
    }
    
    this.modelObject.setEventHandlers(handlers);
  }

  /**
   * 设置模型动画
   * @param id 模型ID
   * @param options 动画选项
   * @returns 是否设置成功
   */
  public setModelAnimation(id: string, options: {
    animationIndex?: number;
    speedFactor?: number;
    loop?: boolean;
    reset?: boolean;
  }): boolean {
    if (!this.modelObject) {
      logger.error('无法设置模型动画: 模型对象未初始化');
      return false;
    }
    
    return this.modelObject.setModelAnimation(id, options);
  }

  /**
   * 设置模型可见性
   * @param id 模型ID
   * @param visible 是否可见
   * @returns 是否设置成功
   */
  public setModelVisibility(id: string, visible: boolean): boolean {
    if (!this.modelObject) {
      logger.error('无法设置模型可见性: 模型对象未初始化');
      return false;
    }
    
    return this.modelObject.setModelVisibility(id, visible);
  }

  /**
   * 获取OLCesium实例
   * @returns OLCesium实例
   */
  public getOLCesium(): OLCesium | null {
    return this.olCesium;
  }

  /**
   * 获取模型对象实例
   * @returns 模型对象实例
   */
  public getModelObject(): CesiumModelObject | null {
    return this.modelObject;
  }

  /**
   * 设置地形高度夸张程度
   * @param scale 高度夸张比例
   * @returns 是否设置成功
   */
  public setTerrainExaggeration(scale: number): boolean {
    const scene = this.getScene();
    if (!scene) {
      logger.warn('无法设置地形高度夸张程度: 场景未获取');
      return false;
    }
    
    try {
      // 使用类型断言和安全访问
      const globe = scene.globe as any;
      if (globe && 'terrainExaggeration' in globe) {
        globe.terrainExaggeration = scale;
        logger.info(`已设置地形高度夸张程度: ${scale}`);
        return true;
      } else {
        logger.warn('当前Cesium版本不支持设置地形高度夸张');
        return false;
      }
    } catch (error) {
      logger.error('设置地形高度夸张程度失败:', error);
      return false;
    }
  }

  /**
   * 启用/禁用阴影
   * @param enabled 是否启用阴影
   * @returns 是否设置成功
   */
  public setShadows(enabled: boolean): boolean {
    const scene = this.getScene();
    if (!scene) {
      logger.warn('无法设置阴影: 场景未获取');
      return false;
    }
    
    try {
      if (scene.shadowMap) {
        scene.shadowMap.enabled = enabled;
        logger.info(`已${enabled ? '启用' : '禁用'}阴影`);
        return true;
      } else {
        logger.warn('当前Cesium版本不支持设置阴影');
        return false;
      }
    } catch (error) {
      logger.error('设置阴影失败:', error);
      return false;
    }
  }

  /**
   * 设置太阳光方向
   * @param date 日期时间，影响太阳位置
   * @returns 是否设置成功
   */
  public setSunLightDirection(date?: Date): boolean {
    const scene = this.getScene();
    if (!scene) {
      logger.warn('无法设置太阳光方向: 场景未获取');
      return false;
    }
    
    try {
      if (scene.sun) {
        // 使用更安全的方式设置太阳位置
        const julianDate = date ? Cesium.JulianDate.fromDate(date) : Cesium.JulianDate.now();
        
        // 使用类型断言避免类型错误
        if (Cesium.Transforms && typeof (Cesium.Transforms as any).computeSunPosition === 'function') {
          // 优先使用computeSunPosition
          const sunPosition = (Cesium.Transforms as any).computeSunPosition(julianDate);
          (scene.sun as any).position = sunPosition;
        } else if ((Cesium as any).Simon1994PlanetaryPositions) {
          // 或者使用其他方法
          const position = (Cesium as any).Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame(julianDate);
          (scene.sun as any).position = position;
        } else {
          logger.warn('当前Cesium版本不支持计算太阳位置');
          return false;
        }
        
        logger.info('已设置太阳光方向');
        return true;
      } else {
        logger.warn('当前Cesium版本不支持设置太阳光方向');
        return false;
      }
    } catch (error) {
      logger.error('设置太阳光方向失败:', error);
      return false;
    }
  }

  /**
   * 设置雾效果
   * @param enabled 是否启用雾效果
   * @param density 雾密度
   * @returns 是否设置成功
   */
  public setFog(enabled: boolean, density: number = 0.0001): boolean {
    const scene = this.getScene();
    if (!scene) {
      logger.warn('无法设置雾效果: 场景未获取');
      return false;
    }
    
    try {
      scene.fog.enabled = enabled;
      scene.fog.density = density;
      
      logger.info(`已${enabled ? '启用' : '禁用'}雾效果，密度: ${density}`);
      return true;
    } catch (error) {
      logger.error('设置雾效果失败:', error);
      return false;
    }
  }

  /**
   * 销毁对象，释放资源
   */
  public destroy(): void {
    // 销毁模型对象
    if (this.modelObject) {
      this.modelObject.destroy();
      this.modelObject = null;
    }
    
    // 禁用3D模式
    if (this.olCesium) {
      this.olCesium.setEnabled(false);
    }
    
    // 清除引用
    this.olCesium = null;
    this.olMap = null;
    this.enabled = false;
    
    logger.info('CesiumObject已销毁');
  }
} 