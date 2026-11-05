/**
 * model3d-loader.test.ts — 台账里 3D 那几条 FAIL 的「样本 vs 加载器」归属
 *
 * <p>台账 `文件预览.md` 里 fbx / wrl / vrml / iges / igs 标 FAIL，说明写的是
 * 「三方加载器解析缺陷」或「样本内容不合规」。这两句话在代码上必须能分辨：</p>
 *
 * <ul>
 *   <li><b>加载器缺陷</b> → 合法样本也解析不出来，那是代码要修；</li>
 *   <li><b>样本不合规</b> → 合法样本能解析、坏样本被正确拒绝，那是样本的问题。</li>
 * </ul>
 *
 * <p>这里直接拿 three 的加载器在 Node 里跑：<b>合法的最小样本必须解析出几何</b>。
 * 只要这条成立，台账里那些 FAIL 就都属于「样本问题」，不是未修的缺陷。</p>
 *
 * <p>用 JsonConfig 之外的裸数组顶点，避免依赖 DOM / WebGL——
 * FBXLoader 与 VRMLLoader 的 parse 路径都只产出对象树，不碰渲染上下文。</p>
 */
import { describe, expect, it } from "vitest";
import { detectModel3dFormat } from "./model3d";

/** ASCII FBX 7.4：一个立方体（12 三角面）
 *
 * <p>注意：three 的 TextParser 要求每个属性都在节点（`{}`）内——
 * 顶层裸属性（形如 `Creator: "x"`）会让 `getCurrentNode()` 返回 undefined。</p>
 */
const FBX_ASCII = `; FBX 7.4.0 project file
FBXHeaderExtension:  {
\tFBXHeaderVersion: 1003
\tFBXVersion: 7400
\tCreator: "fs-test"
}
GlobalSettings:  {
\tVersion: 1000
\tProperties70:  {
\t\tP: "UpAxis", "int", "Integer", "",1
\t\tP: "UnitScaleFactor", "double", "Number", "",1
\t}
}
Objects:  {
\tGeometry: 1, "Geometry::Box", "Mesh" {
\t\tVertices: *24 {
\t\t\ta: -1,-1,-1,1,-1,-1,1,1,-1,-1,1,-1,-1,-1,1,1,-1,1,1,1,1,-1,1,1
\t\t}
\t\tPolygonVertexIndex: *24 {
\t\t\ta: 0,1,2,-4,4,7,6,-5,0,4,5,-2,1,5,6,-3,2,6,7,-4,3,7,4,-1
\t\t}
\t\tGeometryVersion: 124
\t}
\tModel: 2, "Model::Box", "Mesh" {
\t\tVersion: 232
\t\tProperties70:  {
\t\t\tP: "Lcl Translation", "Lcl Translation", "", "A",0,0,0
\t\t}
\t\tShading: T
\t\tCulling: "CullingOff"
\t}
}
Connections:  {
\tC: "OO",1,2
}
`;

/** VRML 2.0：一个立方体 */
const WRL = `#VRML V2.0 utf8
Shape {
  appearance Appearance { material Material { diffuseColor 0.4 0.7 0.9 } }
  geometry Box { size 1 1 1 }
}
`;

/**
 * 把文本编成 ArrayBuffer（FBX 走字节流，wrl 走文本解码）
 *
 * @param text 文本
 * @returns 字节
 */
function toBuffer(text: string): ArrayBuffer {
  const enc = new TextEncoder().encode(text);
  return enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength) as ArrayBuffer;
}

describe("3D 加载器：合法样本必须能解析（区分代码缺陷 vs 样本不合规）", () => {
  it("wrl / vrml 都识别为 three 的 VRML 通道", () => {
    expect(detectModel3dFormat("a.wrl")).toBe("wrl");
    // vrml 曾因不在 EXT_TO_FORMAT 里而一律落二进制检视（台账 vrml 那条的根因）
    expect(detectModel3dFormat("a.vrml")).toBe("wrl");
  });

  it("FBXLoader 能解析合法的 ASCII FBX 立方体（台账 fbx「解析缺陷」不成立）", async () => {
    const { FBXLoader } = await import("three/addons/loaders/FBXLoader.js");
    // 关键回归：必须整段喂 ArrayBuffer。此前按魔数分流、ASCII 喂字符串，
    // FBXLoader 内部 convertArrayBufferToString 取空文本 → 找不到 FBXVersion。
    const object = new FBXLoader().parse(toBuffer(FBX_ASCII), "");
    expect(object).toBeTruthy();
    const meshes: unknown[] = [];
    object.traverse((o) => {
      if ((o as { isMesh?: boolean }).isMesh) meshes.push(o);
    });
    expect(meshes.length).toBeGreaterThan(0);
  });

  it("VRMLLoader 能解析合法的 VRML 2.0 立方体（台账 wrl / vrml FAIL 属样本问题）", async () => {
    const { VRMLLoader } = await import("three/addons/loaders/VRMLLoader.js");
    const scene = new VRMLLoader().parse(WRL, "");
    expect(scene).toBeTruthy();
    let meshes = 0;
    scene.traverse((o) => {
      if ((o as { isMesh?: boolean }).isMesh) meshes += 1;
    });
    expect(meshes).toBeGreaterThan(0);
  });

  it("坏样本仍被正确拒绝（失败时不留半成品对象）", async () => {
    const { VRMLLoader } = await import("three/addons/loaders/VRMLLoader.js");
    expect(() => new VRMLLoader().parse("这不是 VRML", "")).toThrow();
  });
});
