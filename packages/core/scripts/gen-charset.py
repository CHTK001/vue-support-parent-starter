#!/usr/bin/env python3
"""
生成字体加密的字符集文件（charset.txt）。

范围：
  - ASCII 可打印字符 0x20-0x7E
  - GB2312 全部汉字（一级 3755 + 二级 3008）
  - 常用中文标点

输出一行字符，供 build-obf-font.py 消费。
"""
from __future__ import annotations

import sys
from pathlib import Path


def gb2312_hanzi() -> list[str]:
    """按 GB2312 编码枚举全部汉字（一级 + 二级）。"""
    chars: list[str] = []
    for hi in range(0xB0, 0xF8):
        for lo in range(0xA1, 0xFF):
            try:
                ch = bytes([hi, lo]).decode("gb2312")
            except UnicodeDecodeError:
                continue
            chars.append(ch)
    return chars


def main() -> None:
    out = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("charset.txt")

    parts: list[str] = []
    # ASCII 可打印（含空格）
    parts.extend(chr(c) for c in range(0x20, 0x7F))
    # GB2312 汉字
    hanzi = gb2312_hanzi()
    parts.extend(hanzi)
    # 中文标点
    parts.extend("，。、；：？！“”‘’（）《》【】—…·￥％＃＠＆＊＋－／＝＜＞")

    # 去重保序
    seen = set()
    uniq: list[str] = []
    for ch in parts:
        if ch not in seen:
            seen.add(ch)
            uniq.append(ch)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("".join(uniq), encoding="utf-8")
    print(f"[charset] {len(uniq)} 字符（汉字 {len(hanzi)}）-> {out}")


if __name__ == "__main__":
    main()
