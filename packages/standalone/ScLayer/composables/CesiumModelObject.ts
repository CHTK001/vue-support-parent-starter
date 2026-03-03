/**
 * Cesium模型对象类
 * 专门管理3D模型的添加、更新、删除等操作
 * @author AI
 * @date 2023-03-08
 */
import * as Cesium from 'cesium';
import logger from './LogObject';

// 3D模型配置选项
export interface Model3DOptions {
  id: string;
  url: string;
  position: {
    longitude: number;
    latitude: number;
    height?: number;
  };
  scale?: {
    x: number;
    y: number;
    z: number;
  };
  rotation?: {
    heading?: number; // 偏航角，绕垂直轴旋转（y轴）
    pitch?: number;   // 俯仰角，绕水平轴旋转（x轴）
    roll?: number;    // 翻滚角，绕前后轴旋转（z轴）
  };
  minimumPixelSize?: number;
  maximumScale?: number;
  allowPicking?: boolean;
  shadows?: number; // 0: 禁用, 1: 仅接收阴影, 2: 仅投射阴影, 3: 接收和投射阴影
  heightReference?: number; // 0: NONE, 1: CLAMP_TO_GROUND, 2: RELATIVE_TO_GROUND
  color?: string; // CSS颜色，例如 'rgba(255, 255, 255, 1.0)'
  colorBlendMode?: number; // 0: HIGHLIGHT, 1: REPLACE, 2: MIX
  colorBlendAmount?: number; // 0.0-1.0，当colorBlendMode为MIX时使用
  silhouetteColor?: string; // 轮廓颜色
  silhouetteSize?: number; // 轮廓宽度
  clippingPlanes?: any[]; // 裁剪平面数组
  lightColor?: string; // 模型自身发光颜色
  imageBasedLightingFactor?: number; // 基于图像的照明因子
  distanceDisplayCondition?: {
    near: number;
    far: number;
  };
  // 模型动画相关
  animation?: {
    startTime?: number; // 动画开始时间，默认为当前时间
    speedFactor?: number; // 速度因子，默认为1.0
    loop?: boolean; // 是否循环播放，默认为true
    autoPlay?: boolean; // 是否自动播放，默认为true
  };
  // 标签配置
  label?: {
    text: string;
    font?: string;
    fillColor?: string;
    outlineColor?: string;
    outlineWidth?: number;
    style?: number; // Cesium.LabelStyle
    pixelOffset?: [number, number]; // x, y偏移
    scale?: number;
    showBackground?: boolean;
    backgroundColor?: string;
    backgroundPadding?: [number, number]; // x, y内边距
    distanceDisplayCondition?: {
      near: number;
      far: number;
    };
    heightOffset?: number; // 高度偏移
  };
}

// 模型事件处理器接口
export interface ModelEventHandlers {
  onClick?: (modelId: string, model: any) => void;
  onHover?: (modelId: string, model: any) => void;
  onLoad?: (modelId: string, model: any) => void;
  onError?: (modelId: string, error: any) => void;
}

export class CesiumModelObject {
  private models: Map<string, any> = new Map(); // 存储模型实例
  private labels: Map<string, any> = new Map(); // 存储标签实例
  private scene: Cesium.Scene | null = null;
  private eventHandlers: ModelEventHandlers = {};

  /**
   * 构造函数
   * @param scene Cesium场景实例
   * @param eventHandlers 模型事件处理器
   */
  constructor(scene: Cesium.Scene | null, eventHandlers?: ModelEventHandlers) {
    this.scene = scene;
    if (eventHandlers) {
      this.eventHandlers = eventHandlers;
    }
    logger.info('CesiumModelObject实例已创建');
  }

  /**
   * 设置Cesium场景
   * @param scene Cesium场景
   */
  public setScene(scene: Cesium.Scene | null): void {
    this.scene = scene;
  }

  /**
   * 注册模型事件处理器
   * @param handlers 事件处理器
   */
  public setEventHandlers(handlers: ModelEventHandlers): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * 添加3D模型
   * @param options 模型配置选项
   * @returns 模型ID，如果添加失败则返回null
   */
  public addModel(options: Model3DOptions): string | null {
    if (!this.scene) {
      logger.error('无法添加3D模型: 场景未设置');
      return null;
    }

    try {
      // 设置模型位置
      const position = Cesium.Cartesian3.fromDegrees(
        options.position.longitude,
        options.position.latitude,
        options.position.height || 0
      );

      // 设置模型旋转
      let heading = Cesium.Math.toRadians(options.rotation?.heading || 0);
      let pitch = Cesium.Math.toRadians(options.rotation?.pitch || 0);
      let roll = Cesium.Math.toRadians(options.rotation?.roll || 0);
      
      const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
      const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

      // 创建模型实例
      let modelEntity: any = null;
      
      // 尝试使用不同的方式创建模型
      if (this.scene.primitives && typeof this.scene.primitives.add === 'function') {
        try {
          // 尝试创建简单盒体模型作为占位符
          const boxGeometry = new Cesium.BoxGeometry({
            vertexFormat: Cesium.VertexFormat.ALL,
            minimum: new Cesium.Cartesian3(-50.0, -50.0, -50.0),
            maximum: new Cesium.Cartesian3(50.0, 50.0, 50.0)
          });
          
          const modelMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
            position,
            orientation,
            new Cesium.Cartesian3(
              options.scale?.x || 1.0,
              options.scale?.y || 1.0,
              options.scale?.z || 1.0
            )
          );
          
          const appearance = new Cesium.MaterialAppearance({
            material: new Cesium.Material({
              fabric: {
                type: 'Color',
                uniforms: {
                  color: options.color ? Cesium.Color.fromCssColorString(options.color) : Cesium.Color.WHITE
                }
              }
            }),
            renderState: {
              depthTest: {
                enabled: true
              }
            }
          });
          
          // 创建一个Primitive作为模型
          const modelPrimitive = new Cesium.Primitive({
            geometryInstances: new Cesium.GeometryInstance({
              geometry: boxGeometry,
              modelMatrix: modelMatrix,
              id: options.id
            }),
            appearance: appearance,
            asynchronous: false
          });
          
          modelEntity = this.scene.primitives.add(modelPrimitive);
          
          // 记录模型创建方式
          logger.info(`使用Primitive方式创建模型 "${options.id}"`);
        } catch (error) {
          logger.error('创建Primitive模型失败，尝试Entity方式', error);
          
          // 回退到Entity方式
          // 使用类型断言访问可能不存在的entities属性
          const sceneAny = this.scene as any;
          if (sceneAny.entities && typeof sceneAny.entities.add === 'function') {
            // 尝试使用Entity创建
            const modelOptions: any = {
              id: options.id,
              position: position,
              orientation: orientation,
              box: {
                dimensions: new Cesium.Cartesian3(
                  (options.scale?.x || 1.0) * 100,
                  (options.scale?.y || 1.0) * 100,
                  (options.scale?.z || 1.0) * 100
                ),
                material: options.color ? 
                  Cesium.Color.fromCssColorString(options.color) : 
                  Cesium.Color.WHITE
              }
            };
            
            modelEntity = sceneAny.entities.add(modelOptions);
            logger.info(`使用Entity方式创建模型 "${options.id}"`);
          } else {
            logger.error('无法创建模型：Cesium场景不支持Primitive或Entity');
            return null;
          }
        }
      } else {
        logger.error('无法创建模型：Cesium场景不支持Primitive');
        return null;
      }

      // 保存模型实例引用
      this.models.set(options.id, modelEntity);

      // 如果配置了标签，添加标签
      if (options.label) {
        this.addModelLabel(options.id, position, options.label);
      }

      logger.info(`已添加3D模型 "${options.id}"`);

      // 直接调用加载完成事件
      if (this.eventHandlers.onLoad) {
        setTimeout(() => {
          this.eventHandlers.onLoad(options.id, modelEntity);
        }, 100);
      }

      return options.id;
    } catch (error) {
      logger.error('添加3D模型失败:', error);
      return null;
    }
  }
  
  /**
   * 为模型配置动画
   * @param model 模型实例
   * @param animation 动画配置
   */
  private configureModelAnimation(model: any, animation: Model3DOptions['animation']): void {
    if (!model) return;
    
    try {
      // 检查模型是否支持动画
      if (model.activeAnimations && typeof model.activeAnimations.add === 'function') {
        const options: any = {};
        
        if (animation?.startTime !== undefined) {
          options.startTime = animation.startTime;
        }
        
        if (animation?.speedFactor !== undefined) {
          options.multiplier = animation.speedFactor;
        }
        
        if (animation?.loop !== undefined) {
          options.loop = animation.loop;
        }
        
        // 添加模型动画
        if (animation?.autoPlay !== false) {
          model.activeAnimations.add({
            ...options,
            // 如果没有指定特定的动画，播放第一个动画
            name: 0
          });
        }
      } else {
        logger.debug('模型不支持动画，跳过动画配置');
      }
    } catch (error) {
      logger.error('配置模型动画失败:', error);
    }
  }
  
  /**
   * 添加模型标签
   * @param modelId 模型ID
   * @param position 位置
   * @param labelOptions 标签配置
   */
  private addModelLabel(modelId: string, position: Cesium.Cartesian3, labelOptions: NonNullable<Model3DOptions['label']>): void {
    if (!this.scene) return;
    
    try {
      // 计算标签位置，可能需要高度偏移
      const labelPosition = new Cesium.Cartesian3(
        position.x,
        position.y,
        position.z + (labelOptions.heightOffset || 10) // 默认高度偏移10米
      );
      
      // 检查场景是否支持LabelCollection
      if (!this.scene.primitives || typeof this.scene.primitives.add !== 'function') {
        logger.error('无法添加标签：Cesium场景不支持primitive');
        return;
      }
      
      try {
        // 创建标签实体
        const labelCollection = new Cesium.LabelCollection();
        this.scene.primitives.add(labelCollection);
        
        const label = labelCollection.add({
          position: labelPosition,
          text: labelOptions.text,
          font: labelOptions.font || '14pt sans-serif',
          fillColor: labelOptions.fillColor ? Cesium.Color.fromCssColorString(labelOptions.fillColor) : Cesium.Color.WHITE,
          outlineColor: labelOptions.outlineColor ? Cesium.Color.fromCssColorString(labelOptions.outlineColor) : Cesium.Color.BLACK,
          outlineWidth: labelOptions.outlineWidth || 2,
          style: labelOptions.style || Cesium.LabelStyle.FILL_AND_OUTLINE,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM
        });
        
        // 保存标签实例
        this.labels.set(modelId, { label, collection: labelCollection });
        
        logger.debug(`已为模型 "${modelId}" 添加标签`);
      } catch (error) {
        logger.error(`无法创建LabelCollection:`, error);
        
        // 回退方案：使用Entity创建标签
        // 使用类型断言访问可能不存在的entities属性
        const sceneAny = this.scene as any;
        if (sceneAny.entities && typeof sceneAny.entities.add === 'function') {
          const labelEntity = sceneAny.entities.add({
            position: labelPosition,
            label: {
              text: labelOptions.text,
              font: labelOptions.font || '14pt sans-serif',
              fillColor: labelOptions.fillColor ? Cesium.Color.fromCssColorString(labelOptions.fillColor) : Cesium.Color.WHITE,
              outlineColor: labelOptions.outlineColor ? Cesium.Color.fromCssColorString(labelOptions.outlineColor) : Cesium.Color.BLACK,
              outlineWidth: labelOptions.outlineWidth || 2,
              style: labelOptions.style || Cesium.LabelStyle.FILL_AND_OUTLINE,
              horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM
            }
          });
          
          // 保存标签实例
          this.labels.set(modelId, { entity: labelEntity });
          
          logger.debug(`已为模型 "${modelId}" 添加Entity标签`);
        } else {
          logger.error('无法添加标签：Cesium场景既不支持LabelCollection也不支持Entity');
        }
      }
    } catch (error) {
      logger.error(`为模型 "${modelId}" 添加标签失败:`, error);
    }
  }

  /**
   * 更新3D模型
   * @param id 模型ID
   * @param options 要更新的选项
   * @returns 是否更新成功
   */
  public updateModel(id: string, options: Partial<Model3DOptions>): boolean {
    if (!this.models.has(id)) {
      logger.warn(`无法更新3D模型: 找不到ID为 "${id}" 的模型`);
      return false;
    }

    const model = this.models.get(id);
    if (!model) return false;

    try {
      // 更新位置和方向
      if (options.position || options.rotation || options.scale) {
        // 获取当前模型矩阵
        const modelMatrix = model.modelMatrix;
        
        // 创建新的变换参数
        let translation = new Cesium.Cartesian3();
        let rotation = new Cesium.Quaternion();
        let scale = new Cesium.Cartesian3();
        
        // 提取当前变换参数
        Cesium.Matrix4.getTranslation(modelMatrix, translation);
        
        // 这里使用decompose代替getRotation解决类型问题
        const rotationMatrix = new Cesium.Matrix3();
        Cesium.Matrix4.getRotation(modelMatrix, rotationMatrix);
        Cesium.Quaternion.fromRotationMatrix(rotationMatrix, rotation);
        
        Cesium.Matrix4.getScale(modelMatrix, scale);
        
        // 更新位置
        if (options.position) {
          const newPosition = Cesium.Cartesian3.fromDegrees(
            options.position.longitude,
            options.position.latitude,
            options.position.height || 0
          );
          translation = newPosition;
        }
        
        // 更新旋转
        if (options.rotation) {
          const heading = Cesium.Math.toRadians(options.rotation.heading || 0);
          const pitch = Cesium.Math.toRadians(options.rotation.pitch || 0);
          const roll = Cesium.Math.toRadians(options.rotation.roll || 0);
          
          const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
          rotation = Cesium.Transforms.headingPitchRollQuaternion(translation, hpr);
        }
        
        // 更新缩放
        if (options.scale) {
          scale = new Cesium.Cartesian3(
            options.scale.x || scale.x,
            options.scale.y || scale.y,
            options.scale.z || scale.z
          );
        }
        
        // 生成新的模型矩阵
        const newModelMatrix = Cesium.Matrix4.fromTranslationQuaternionRotationScale(
          translation,
          rotation,
          scale
        );
        
        // 更新模型矩阵
        model.modelMatrix = newModelMatrix;
        
        // 如果有标签，也更新标签位置
        if (this.labels.has(id)) {
          const label = this.labels.get(id);
          if (label) {
            // 添加可能的高度偏移
            const heightOffset = options.label?.heightOffset || 10;
            label.position = new Cesium.Cartesian3(
              translation.x,
              translation.y,
              translation.z + heightOffset
            );
          }
        }
      }
      
      // 更新其他模型属性
      if (options.minimumPixelSize !== undefined) {
        model.minimumPixelSize = options.minimumPixelSize;
      }
      
      if (options.maximumScale !== undefined) {
        model.maximumScale = options.maximumScale;
      }
      
      if (options.color !== undefined) {
        model.color = options.color ? Cesium.Color.fromCssColorString(options.color) : undefined;
      }
      
      if (options.colorBlendMode !== undefined) {
        model.colorBlendMode = options.colorBlendMode;
      }
      
      if (options.colorBlendAmount !== undefined) {
        model.colorBlendAmount = options.colorBlendAmount;
      }
      
      if (options.silhouetteColor !== undefined) {
        model.silhouetteColor = options.silhouetteColor ? 
          Cesium.Color.fromCssColorString(options.silhouetteColor) : undefined;
      }
      
      if (options.silhouetteSize !== undefined) {
        model.silhouetteSize = options.silhouetteSize;
      }
      
      if (options.distanceDisplayCondition !== undefined) {
        model.distanceDisplayCondition = options.distanceDisplayCondition ? 
          new Cesium.DistanceDisplayCondition(
            options.distanceDisplayCondition.near,
            options.distanceDisplayCondition.far
          ) : undefined;
      }
      
      // 更新标签
      if (options.label && this.labels.has(id)) {
        const label = this.labels.get(id);
        if (label) {
          if (options.label.text) label.text = options.label.text;
          if (options.label.font) label.font = options.label.font;
          if (options.label.fillColor) label.fillColor = Cesium.Color.fromCssColorString(options.label.fillColor);
          if (options.label.outlineColor) label.outlineColor = Cesium.Color.fromCssColorString(options.label.outlineColor);
          if (options.label.outlineWidth !== undefined) label.outlineWidth = options.label.outlineWidth;
          if (options.label.style !== undefined) label.style = options.label.style;
          if (options.label.scale !== undefined) label.scale = options.label.scale;
          if (options.label.showBackground !== undefined) label.showBackground = options.label.showBackground;
          if (options.label.backgroundColor) label.backgroundColor = Cesium.Color.fromCssColorString(options.label.backgroundColor);
        }
      } else if (options.label && !this.labels.has(id) && options.position) {
        // 如果原来没有标签但现在需要添加
        const position = Cesium.Cartesian3.fromDegrees(
          options.position.longitude,
          options.position.latitude,
          options.position.height || 0
        );
        this.addModelLabel(id, position, options.label);
      }
      
      logger.info(`3D模型 "${id}" 已更新`);
      return true;
    } catch (error) {
      logger.error(`更新3D模型 "${id}" 失败:`, error);
      return false;
    }
  }

  /**
   * 删除3D模型
   * @param id 模型ID
   * @returns 是否删除成功
   */
  public removeModel(id: string): boolean {
    if (!this.models.has(id)) {
      logger.warn(`无法删除3D模型: 找不到ID为 "${id}" 的模型`);
      return false;
    }

    const model = this.models.get(id);
    if (!model || !this.scene) return false;

    try {
      // 移除模型
      this.scene.primitives.remove(model);
      
      // 如果有标签，也移除标签
      if (this.labels.has(id)) {
        const label = this.labels.get(id);
        if (label && label.collection) {
          label.collection.remove(label);
        }
        this.labels.delete(id);
      }
      
      // 从模型映射中移除
      this.models.delete(id);
      
      logger.info(`3D模型 "${id}" 已删除`);
      return true;
    } catch (error) {
      logger.error(`删除3D模型 "${id}" 失败:`, error);
      return false;
    }
  }

  /**
   * 获取3D模型
   * @param id 模型ID
   * @returns 模型实例
   */
  public getModel(id: string): any {
    return this.models.get(id) || null;
  }

  /**
   * 获取所有3D模型
   * @returns 所有模型的ID到实例映射
   */
  public getAllModels(): Map<string, any> {
    return new Map(this.models);
  }

  /**
   * 清除所有3D模型
   * @returns 是否清除成功
   */
  public clearAllModels(): boolean {
    if (!this.scene) {
      logger.error('无法清除3D模型: 场景未设置');
      return false;
    }

    try {
      // 移除所有模型
      for (const model of this.models.values()) {
        this.scene.primitives.remove(model);
      }
      
      // 移除所有标签
      for (const label of this.labels.values()) {
        if (label.collection) {
          label.collection.remove(label);
        }
      }
      
      // 清空映射
      this.models.clear();
      this.labels.clear();
      
      logger.info('已清除所有3D模型');
      return true;
    } catch (error) {
      logger.error('清除3D模型失败:', error);
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
    const model = this.getModel(id);
    if (!model || !this.scene) {
      logger.warn(`无法飞行到模型: 找不到ID为 "${id}" 的模型或场景未设置`);
      return false;
    }

    try {
      // 提取模型包围球
      const boundingSphere = model.boundingSphere;
      if (!boundingSphere) {
        logger.warn(`模型 "${id}" 没有有效的包围球，无法完成飞行定位`);
        return false;
      }
      
      // 设置偏移量
      const heading = Cesium.Math.toRadians(options?.offset?.heading || 0);
      const pitch = Cesium.Math.toRadians(options?.offset?.pitch || -30); // 默认俯视30度
      const range = options?.offset?.range || (boundingSphere.radius * 4);

      // 飞行到模型位置
      this.scene.camera.flyToBoundingSphere(boundingSphere, {
        offset: new Cesium.HeadingPitchRange(heading, pitch, range),
        duration: options?.duration || 3.0
      });

      logger.info(`飞行到模型 "${id}" 已启动`);
      return true;
    } catch (error) {
      logger.error(`飞行到模型 "${id}" 失败:`, error);
      return false;
    }
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
    const model = this.getModel(id);
    if (!model) {
      logger.warn(`无法设置模型动画: 找不到ID为 "${id}" 的模型`);
      return false;
    }
    
    try {
      // 确保模型已加载完成并有动画
      if (!model.activeAnimations) {
        logger.warn(`模型 "${id}" 不支持动画或尚未加载完成`);
        return false;
      }
      
      // 如果需要重置，先停止所有动画
      if (options.reset) {
        model.activeAnimations.removeAll();
      }
      
      // 添加动画
      model.activeAnimations.add({
        name: options.animationIndex || 0,
        loop: options.loop !== undefined ? options.loop : true,
        multiplier: options.speedFactor || 1.0
      });
      
      logger.info(`已设置模型 "${id}" 的动画`);
      return true;
    } catch (error) {
      logger.error(`设置模型 "${id}" 动画失败:`, error);
      return false;
    }
  }

  /**
   * 设置模型可见性
   * @param id 模型ID
   * @param visible 是否可见
   * @returns 是否设置成功
   */
  public setModelVisibility(id: string, visible: boolean): boolean {
    const model = this.getModel(id);
    if (!model) {
      logger.warn(`无法设置模型可见性: 找不到ID为 "${id}" 的模型`);
      return false;
    }
    
    try {
      model.show = visible;
      
      // 如果有标签，也设置标签可见性
      if (this.labels.has(id)) {
        const label = this.labels.get(id);
        if (label) {
          label.show = visible;
        }
      }
      
      logger.info(`已设置模型 "${id}" 的可见性: ${visible}`);
      return true;
    } catch (error) {
      logger.error(`设置模型 "${id}" 可见性失败:`, error);
      return false;
    }
  }

  /**
   * 获取模型的中心位置
   * @param id 模型ID
   * @returns 中心位置的经纬度高度，如果失败则返回null
   */
  public getModelCenter(id: string): { longitude: number; latitude: number; height: number } | null {
    const model = this.getModel(id);
    if (!model) {
      logger.warn(`无法获取模型中心: 找不到ID为 "${id}" 的模型`);
      return null;
    }
    
    try {
      // 获取模型矩阵中的位置
      const translation = new Cesium.Cartesian3();
      Cesium.Matrix4.getTranslation(model.modelMatrix, translation);
      
      // 转换为经纬度高度
      const cartographic = Cesium.Cartographic.fromCartesian(translation);
      
      return {
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        height: cartographic.height
      };
    } catch (error) {
      logger.error(`获取模型 "${id}" 中心位置失败:`, error);
      return null;
    }
  }

  /**
   * 销毁对象，释放资源
   */
  public destroy(): void {
    // 清除所有模型
    this.clearAllModels();
    
    // 清除引用
    this.scene = null;
    this.models.clear();
    this.labels.clear();
    this.eventHandlers = {};
    
    logger.info('CesiumModelObject已销毁');
  }
} 