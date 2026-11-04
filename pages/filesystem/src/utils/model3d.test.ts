/**
 * 3D 解析回归（台账里 fbx / wrl / vrml 三条「解析不出来」的钉子）
 *
 * <p>为什么值得单测：这三条在台账上的结论是「三方加载器解析缺陷」，而当时的样本已经丢失，
 * 无法复现。这里用**手写的最小合法样本**（VRML 一个 Box、ASCII FBX 一个立方体）
 * 把「加载器本身能不能解析」钉住 —— 只要样本合法却解析不出来，就是代码问题。</p>
 *
 * <p>只测解析（纯 JS），不测渲染：渲染要 WebGL，属于面板层的另一件事。</p>
 *
 * @author Buffy
 * @since 2026/11/04
 */
import { describe, expect, it } from "vitest";
import { detectModel3dFormat, parseModel3d } from "./model3d";

/**
 * 把文本编码成 ArrayBuffer
 *
 * @param text 文本
 * @returns 字节
 */
function bytesOf(text: string): ArrayBuffer {
  const buf = new TextEncoder().encode(text);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** VRML 2.0 最小合法样本：一个 2×2×2 的 Box */
const VRML_CUBE = `#VRML V2.0 utf8
Shape {
  geometry Box { size 2 2 2 }
}
`;

/**
 * ASCII FBX 最小合法样本：一个立方体（8 个角点、6 个四边形）
 *
 * <p>要点：{@code Vertices} / {@code PolygonVertexIndex} 前面的 {@code *N} 是元素个数，
 * 末位索引用 {@code -(index+1)} 表示「这个多边形到此结束」——FBX 的既定编码，
 * 加载器靠它切面。</p>
 */
const FBX_CUBE_ASCII = `; FBX 7.3.0 project file
FBXHeaderExtension:  {
	FBXHeaderVersion: 1003
	FBXVersion: 7300
	Creator: "minimal-cube"
}
GlobalSettings:  {
	Version: 1000
}
Definitions:  {
	Version: 100
	Count: 2
}
Objects:  {
	Geometry: 1000000, "Geometry::Cube", "Mesh" {
		Vertices: *24 {
			a: -1,-1,-1,1,-1,-1,1,1,-1,-1,1,-1,-1,-1,1,1,-1,1,1,1,1,-1,1,1
		}
		PolygonVertexIndex: *24 {
			a: 0,1,2,3,-5,4,7,6,-9,0,4,5,-2,1,6,7,-3,2,6,5,-8,3,7,4,-6
		}
		GeometryVersion: 124
	}
	Model: 2000000, "Model::Cube", "Mesh" {
		Version: 232
	}
}
Connections:  {
	C: "OO",1000000,2000000
	C: "OO",2000000,0
}
`;

describe("detectModel3dFormat（扩展名 → 格式）", () => {
  it("wrl / vrml 都归到 VRML 通道", () => {
    expect(detectModel3dFormat("a.wrl")).toBe("wrl");
    expect(detectModel3dFormat("a.VRML")).toBe("wrl");
  });

  it("fbx / igs / stp 归到各自格式", () => {
    expect(detectModel3dFormat("a.fbx")).toBe("fbx");
    expect(detectModel3dFormat("a.igs")).toBe("iges");
    expect(detectModel3dFormat("a.stp")).toBe("step");
  });

  it("不支持的扩展名返回 null（调用方落到别的预览通道）", () => {
    expect(detectModel3dFormat("a.txt")).toBeNull();
    expect(detectModel3dFormat("noext")).toBeNull();
  });
});

describe("parseModel3d（three 加载器路径）", () => {
  it("VRML Box 能解析出网格与三角面", async () => {
    const parsed = await parseModel3d("wrl", bytesOf(VRML_CUBE));
    expect(parsed.meshCount).toBeGreaterThanOrEqual(1);
    expect(parsed.triangleCount).toBeGreaterThan(0);
  }, 30_000);

  it("ASCII FBX 立方体能解析出网格与三角面", async () => {
    const parsed = await parseModel3d("fbx", bytesOf(FBX_CUBE_ASCII));
    expect(parsed.meshCount).toBeGreaterThanOrEqual(1);
    expect(parsed.triangleCount).toBeGreaterThan(0);
  }, 30_000);

  it("内容损坏时给出中文可读错误（不是空场景静默通过）", async () => {
    await expect(parseModel3d("fbx", bytesOf("这不是 FBX"))).rejects.toThrow(/FBX|解析|几何|无法/);
  }, 30_000);
});
