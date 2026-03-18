/**
 * 节日粒子系统组合函数
 * @description 提供粒子特效的创建和管理功能
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue';

export interface ParticleConfig {
  /** 粒子类型 */
  type: 'snow' | 'firework' | 'confetti' | 'sparkle' | 'leaf';
  /** 粒子数量 */
  count?: number;
  /** 粒子颜色 */
  colors?: string[];
  /** 粒子大小范围 */
  sizeRange?: [number, number];
  /** 速度范围 */
  speedRange?: [number, number];
  /** 生命周期（毫秒） */
  lifetime?: number;
  /** 容器元素 */
  container?: HTMLElement | string;
  /** 是否启用 */
  enabled?: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  lifetime: number;
  age: number;
  rotation: number;
  rotationSpeed: number;
}

export interface ParticleSystemInstance {
  id: string;
  config: ParticleConfig;
  particles: Particle[];
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  animationId: number | null;
  isRunning: boolean;
}

export function useFestivalParticles() {
  const systems: Ref<ParticleSystemInstance[]> = ref([]);

  /**
   * 创建粒子系统
   */
  const createParticleSystem = (config: ParticleConfig): string => {
    const id = `particle-system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建 canvas
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '9999';
    
    // 获取容器
    let container: HTMLElement;
    if (typeof config.container === 'string') {
      container = document.querySelector(config.container) || document.body;
    } else {
      container = config.container || document.body;
    }
    
    container.appendChild(canvas);
    
    // 设置 canvas 尺寸
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const ctx = canvas.getContext('2d');
    
    const instance: ParticleSystemInstance = {
      id,
      config,
      particles: [],
      canvas,
      ctx,
      animationId: null,
      isRunning: false,
    };

    // 初始化粒子
    initParticles(instance);
    
    systems.value.push(instance);
    
    // 自动启动
    if (config.enabled !== false) {
      start(id);
    }
    
    return id;
  };

  /**
   * 初始化粒子
   */
  const initParticles = (instance: ParticleSystemInstance): void => {
    const { config } = instance;
    const count = config.count || 50;
    const colors = config.colors || ['#ffffff'];
    const sizeRange = config.sizeRange || [2, 5];
    const speedRange = config.speedRange || [1, 3];
    const lifetime = config.lifetime || 5000;

    instance.particles = [];
    
    for (let i = 0; i < count; i++) {
      instance.particles.push(createParticle(config.type, colors, sizeRange, speedRange, lifetime));
    }
  };

  /**
   * 创建单个粒子
   */
  const createParticle = (
    type: string,
    colors: string[],
    sizeRange: [number, number],
    speedRange: [number, number],
    lifetime: number
  ): Particle => {
    const id = `particle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const x = Math.random() * window.innerWidth;
    const y = type === 'snow' ? -10 : Math.random() * window.innerHeight;
    const size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    let vx = 0;
    let vy = 0;
    
    switch (type) {
      case 'snow':
        vx = (Math.random() - 0.5) * 0.5;
        vy = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
        break;
      case 'firework':
        const angle = Math.random() * Math.PI * 2;
        const speed = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
        vx = Math.cos(angle) * speed;
        vy = Math.sin(angle) * speed;
        break;
      case 'confetti':
        vx = (Math.random() - 0.5) * 2;
        vy = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
        break;
      default:
        vx = (Math.random() - 0.5) * 2;
        vy = speedRange[0] + Math.random() * (speedRange[1] - speedRange[0]);
    }

    return {
      id,
      x,
      y,
      vx,
      vy,
      size,
      color,
      alpha: 1,
      lifetime,
      age: 0,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
    };
  };

  /**
   * 更新粒子
   */
  const updateParticles = (instance: ParticleSystemInstance, deltaTime: number): void => {
    const { particles, config } = instance;
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // 更新位置
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.rotation += particle.rotationSpeed;
      
      // 更新年龄
      particle.age += deltaTime;
      
      // 更新透明度
      particle.alpha = 1 - (particle.age / particle.lifetime);
      
      // 重力效果
      if (config.type === 'confetti' || config.type === 'firework') {
        particle.vy += 0.1;
      }
      
      // 移除过期粒子
      if (particle.age >= particle.lifetime || particle.y > window.innerHeight + 10) {
        particles.splice(i, 1);
        // 补充新粒子
        const colors = config.colors || ['#ffffff'];
        const sizeRange = config.sizeRange || [2, 5];
        const speedRange = config.speedRange || [1, 3];
        const lifetime = config.lifetime || 5000;
        particles.push(createParticle(config.type, colors, sizeRange, speedRange, lifetime));
      }
    }
  };

  /**
   * 渲染粒子
   */
  const renderParticles = (instance: ParticleSystemInstance): void => {
    const { ctx, canvas, particles } = instance;
    if (!ctx || !canvas) return;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制粒子
    particles.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.alpha;
      ctx.translate(particle.x, particle.y);
      ctx.rotate(particle.rotation);
      
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  };

  /**
   * 动画循环
   */
  const animate = (instance: ParticleSystemInstance, lastTime: number) => {
    if (!instance.isRunning) return;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - lastTime;
    
    updateParticles(instance, deltaTime);
    renderParticles(instance);
    
    instance.animationId = requestAnimationFrame(() => animate(instance, currentTime));
  };

  /**
   * 启动粒子系统
   */
  const start = (id: string): void => {
    const instance = systems.value.find(s => s.id === id);
    if (instance && !instance.isRunning) {
      instance.isRunning = true;
      animate(instance, performance.now());
    }
  };

  /**
   * 停止粒子系统
   */
  const stop = (id: string): void => {
    const instance = systems.value.find(s => s.id === id);
    if (instance) {
      instance.isRunning = false;
      if (instance.animationId) {
        cancelAnimationFrame(instance.animationId);
        instance.animationId = null;
      }
    }
  };

  /**
   * 移除粒子系统
   */
  const removeParticleSystem = (id: string): void => {
    const index = systems.value.findIndex(s => s.id === id);
    if (index !== -1) {
      const instance = systems.value[index];
      stop(id);
      if (instance.canvas && instance.canvas.parentNode) {
        instance.canvas.parentNode.removeChild(instance.canvas);
      }
      systems.value.splice(index, 1);
    }
  };

  /**
   * 清空所有粒子系统
   */
  const clearParticleSystems = (): void => {
    systems.value.forEach(instance => {
      stop(instance.id);
      if (instance.canvas && instance.canvas.parentNode) {
        instance.canvas.parentNode.removeChild(instance.canvas);
      }
    });
    systems.value = [];
  };

  /**
   * 清理
   */
  onUnmounted(() => {
    clearParticleSystems();
  });

  return {
    systems,
    createParticleSystem,
    start,
    stop,
    removeParticleSystem,
    clearParticleSystems,
  };
}
