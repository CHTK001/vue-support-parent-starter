#!/usr/bin/env python3
"""
构建字体加密用的映射 woff2。

原理（真字体加密）：
  - 把常用汉字集合映射到 PUA 私用区码位（U+E000 起）
  - 在字体 cmap 表里写入：PUA 码位 -> 该汉字的真实字形
  - 浏览器渲染 PUA 码位时，用的是字体里映射过去的真字形
  - 所以 DOM 是乱码、视觉是真字，且字形由字体渲染（可选中/可缩放）

用法：
  python build-obf-font.py --charset-file charset.txt --out-font out.woff2 --out-map map.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from fontTools.ttLib import TTFont


def unique_visible_chars(text: str) -> list[str]:
    seen = set()
    chars: list[str] = []
    for ch in text:
        cp = ord(ch)
        if ch in ("\n", "\r", "\t") or cp < 0x20:
            continue
        if ch not in seen:
            seen.add(ch)
            chars.append(ch)
    return chars


def build_mapping(charset: str, base_codepoint: int) -> dict[int, int]:
    mapping: dict[int, int] = {}
    for idx, ch in enumerate(unique_visible_chars(charset)):
        mapping[ord(ch)] = base_codepoint + idx
    return mapping


def write_mapped_font(src_font: Path, out_font: Path, mapping: dict[int, int]) -> dict[int, int]:
    font = TTFont(str(src_font))
    best_cmap = font.getBestCmap()

    missing = [cp for cp in mapping if cp not in best_cmap]
    if missing:
        sample = ", ".join(f"U+{cp:04X}" for cp in missing[:20])
        print(f"[font-obf] WARN: 源字体缺字形: {sample}（已跳过）", file=sys.stderr)
        for cp in missing:
            mapping.pop(cp, None)

    # 核心：把 PUA 码位指向真实字形
    for table in font["cmap"].tables:
        if not table.isUnicode():
            continue
        for src_cp, obf_cp in mapping.items():
            table.cmap[obf_cp] = best_cmap[src_cp]

    out_font.parent.mkdir(parents=True, exist_ok=True)
    font.flavor = "woff2"
    font.save(str(out_font))
    return mapping


def write_map(out_map: Path, mapping: dict[int, int]) -> None:
    payload = {
        "count": len(mapping),
        "baseCodepoint": f"U+{min(mapping.values()):04X}" if mapping else None,
        "entries": [
            {
                "src": chr(src_cp),
                "srcCodepoint": f"U+{src_cp:04X}",
                "obf": chr(obf_cp),
                "obfCodepoint": f"U+{obf_cp:04X}",
            }
            for src_cp, obf_cp in mapping.items()
        ],
    }
    out_map.parent.mkdir(parents=True, exist_ok=True)
    out_map.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--src-font", default=r"C:\Windows\Fonts\simhei.ttf")
    ap.add_argument("--charset-file", required=True, type=Path)
    ap.add_argument("--out-font", required=True, type=Path)
    ap.add_argument("--out-map", required=True, type=Path)
    ap.add_argument("--base-codepoint", default="0xE000")
    args = ap.parse_args()

    src = Path(args.src_font)
    if not src.exists():
        raise FileNotFoundError(f"源字体不存在: {src}")

    charset = args.charset_file.read_text(encoding="utf-8")
    base = int(args.base_codepoint, 16) if args.base_codepoint.lower().startswith("0x") else int(args.base_codepoint)
    mapping = build_mapping(charset, base)
    print(f"[font-obf] 字符数={len(mapping)} 基址=U+{base:04X} 源字体={src.name}")

    mapping = write_mapped_font(src, args.out_font, mapping)
    write_map(args.out_map, mapping)
    print(f"[font-obf] 输出字体={args.out_font} ({args.out_font.stat().st_size} bytes)")
    print(f"[font-obf] 输出映射={args.out_map}")


if __name__ == "__main__":
    main()
