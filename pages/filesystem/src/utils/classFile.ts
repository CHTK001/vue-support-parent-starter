/**
 * Java class 文件最小解析：只取「类名 + 版本 + 访问标志」。
 *
 * <p>为什么需要它：前端反编译（CFR 的 JS/WASM 移植）要求调用方传入**内部类名**
 * （如 {@code com/foo/Bar}），而预览页拿到的只是字节流。与其猜文件名（可能是
 * {@code Foo$1.class}、也可能被重命名过），不如按 JVMS 规范把 {@code this_class}
 * 读出来——常量池解析只有几十行，且能顺带拿到版本号做展示。</p>
 *
 * <p>只解析常量池与类头，不碰字段/方法/属性：反编译本身由 CFR 负责。</p>
 */

/** 类文件基本信息 */
export interface ClassInfo {
  /** 内部名（斜杠分隔，如 com/foo/Bar） */
  internalName: string;
  /** 点分全名（如 com.foo.Bar） */
  name: string;
  /** 次版本号 */
  minor: number;
  /** 主版本号（45 = Java 1.1，69 ≈ Java 25） */
  major: number;
  /** 访问标志 */
  accessFlags: number;
  /** 常量池条目数 */
  constantPoolCount: number;
}

/** 常量池条目（只保留后续会用到的两类） */
interface CpEntry {
  tag: number;
  /** CONSTANT_Utf8 的字符串 */
  utf8?: string;
  /** CONSTANT_Class 的 name_index */
  nameIndex?: number;
}

/**
 * 解析 class 文件头。
 *
 * @param buf 文件字节
 * @returns 类基本信息
 * @throws 当魔数不是 0xCAFEBABE、或常量池结构损坏时
 */
export function parseClassInfo(buf: ArrayBuffer): ClassInfo {
  const dv = new DataView(buf);
  if (dv.byteLength < 10) throw new Error("文件过小，不是有效的 class 文件");
  if (dv.getUint32(0, false) !== 0xcafebabe) {
    throw new Error("不是 class 文件（缺少 0xCAFEBABE 魔数）");
  }
  const minor = dv.getUint16(4, false);
  const major = dv.getUint16(6, false);
  const count = dv.getUint16(8, false);
  if (count === 0) throw new Error("class 常量池为空");

  const cp: Array<CpEntry | null> = new Array(count).fill(null);
  let p = 10;

  /** 读一个 u16 并前进 */
  const u2 = (): number => {
    if (p + 2 > dv.byteLength) throw new Error("class 常量池越界");
    const v = dv.getUint16(p, false);
    p += 2;
    return v;
  };
  const skip = (n: number): void => {
    if (p + n > dv.byteLength) throw new Error("class 常量池越界");
    p += n;
  };

  for (let i = 1; i < count; i++) {
    if (p + 1 > dv.byteLength) throw new Error("class 常量池越界");
    const tag = dv.getUint8(p++);
    switch (tag) {
      case 1: {
        // CONSTANT_Utf8
        const len = u2();
        if (p + len > dv.byteLength) throw new Error("class 常量池 Utf8 越界");
        const bytes = new Uint8Array(buf, p, len);
        cp[i] = { tag, utf8: new TextDecoder("utf-8").decode(bytes) };
        p += len;
        break;
      }
      case 7: // CONSTANT_Class
        cp[i] = { tag, nameIndex: u2() };
        break;
      case 8: // CONSTANT_String
      case 16: // CONSTANT_MethodType
      case 19: // CONSTANT_Module
      case 20: // CONSTANT_Package
        skip(2);
        cp[i] = { tag };
        break;
      case 15: // CONSTANT_MethodHandle
        skip(3);
        cp[i] = { tag };
        break;
      case 3: // Integer
      case 4: // Float
      case 9: // Fieldref
      case 10: // Methodref
      case 11: // InterfaceMethodref
      case 12: // NameAndType
      case 17: // Dynamic
      case 18: // InvokeDynamic
        skip(4);
        cp[i] = { tag };
        break;
      case 5: // Long（占两个槽位）
      case 6: // Double
        skip(8);
        cp[i] = { tag };
        i++;
        break;
      default:
        throw new Error(`未知的常量池 tag：${tag}`);
    }
  }

  const accessFlags = u2();
  const thisClass = u2();
  const entry = thisClass > 0 && thisClass < count ? cp[thisClass] : null;
  if (!entry || entry.tag !== 7 || entry.nameIndex == null) {
    throw new Error("class 的 this_class 指向非法常量池项");
  }
  const nameEntry = entry.nameIndex < count ? cp[entry.nameIndex] : null;
  if (!nameEntry?.utf8) throw new Error("class 的 this_class 缺少类名");

  return {
    internalName: nameEntry.utf8,
    name: nameEntry.utf8.replace(/\//g, "."),
    minor,
    major,
    accessFlags,
    constantPoolCount: count,
  };
}
