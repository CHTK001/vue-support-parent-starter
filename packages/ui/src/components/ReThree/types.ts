import type * as THREE from "three";

/** Three.js 渲染上下文，暴露给 render/animate 回调 */
export interface ReThreeContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  THREE: typeof THREE;
}
