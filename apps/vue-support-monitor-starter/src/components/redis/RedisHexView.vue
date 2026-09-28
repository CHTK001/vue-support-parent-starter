<script setup lang="ts">
/**
 * HEX 视图（Redis STRING 详情组件用，只读）
 *
 * <p>UTF-8 字节转 16 字节/行的十六进制转储：偏移 | HEX（8 字节分组）| ASCII。
 * 不可打印字节在 ASCII 列以“·”占位；编辑请切换「文本 / JSON」视图。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
import { ElMessage } from "element-plus";
import "./redis-value.css";

const props = defineProps<{
  /** 原始值 */
  text: string;
}>();

/** UTF-8 字节 */
const bytes = computed<Uint8Array>(() => new TextEncoder().encode(props.text ?? ""));

/** 十六进制转储行 */
interface HexRow {
  offset: string;
  hex: string;
  ascii: string;
}

const rows = computed<HexRow[]>(() => {
  const data = bytes.value;
  const list: HexRow[] = [];
  for (let i = 0; i < data.length; i += 16) {
    const slice = data.slice(i, i + 16);
    const parts: string[] = [];
    let ascii = "";
    for (let j = 0; j < 16; j++) {
      if (j < slice.length) {
        const b = slice[j];
        parts.push(b.toString(16).padStart(2, "0"));
        ascii += b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : "·";
      } else {
        parts.push("  ");
        ascii += " ";
      }
    }
    list.push({
      offset: i.toString(16).padStart(8, "0"),
      hex: `${parts.slice(0, 8).join(" ")}  ${parts.slice(8).join(" ")}`,
      ascii,
    });
  }
  return list;
});

/** 复制纯 HEX 串 */
async function copyHex(): Promise<void> {
  const hex = Array.from(bytes.value).map(b => b.toString(16).padStart(2, "0")).join(" ");
  try {
    await navigator.clipboard.writeText(hex);
    ElMessage.success("已复制 HEX");
  } catch {
    ElMessage.warning("复制失败");
  }
}
</script>

<template>
  <div class="rv-code-wrap">
    <div class="rv-code-bar">
      <span>HEX · {{ bytes.length }} 字节</span>
      <span class="rv-hint">只读视图，编辑请切换「文本 / JSON」</span>
      <span class="rv-spacer" />
      <ReButton icon="CopyDocument" layout="square" title="复制 HEX" @click="copyHex" />
    </div>
    <div class="rv-hex">
      <div v-for="row in rows" :key="row.offset" class="rv-hex-row">
        <span class="rv-hex-off">{{ row.offset }}</span>
        <span class="rv-hex-bytes">{{ row.hex }}</span>
        <span class="rv-hex-ascii">{{ row.ascii }}</span>
      </div>
      <ReEmpty v-if="bytes.length === 0" description="空值" :image-size="40" />
    </div>
  </div>
</template>
