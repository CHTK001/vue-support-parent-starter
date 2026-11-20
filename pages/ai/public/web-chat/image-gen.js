/**
 * Web 浏览器推理 · 程序化生图（Canvas 2D，纯浏览器端渲染）
 *
 * 浏览器端「文生图」模型：解析提示词里的场景关键词，以提示词为随机种子，
 * 在 Canvas 2D 上程序化绘制整幅场景（分层：天空/天体/远景/水面/前景），
 * 输出为 Markdown 图片（dataURL）直接进会话正文。
 *
 * 与扩散模型不同，这是确定性的程序化渲染 —— 同一提示词永远得到同一幅图；
 * 换提示词里的关键词（海、雪山、城市、极光…）会得到完全不同的画面。
 * 它真实运行在浏览器端、真实产出图像，适合演示 Web 推理链路与做轻量配图。
 *
 * 契约同 echo-demo.js：默认导出 createClient(modelInfo) → { chat }。
 * 画布尺寸可经 js_path 查询参数覆盖：/web-chat/image-gen.js?w=960&h=640
 */

import { lastUserText, streamOut } from './_shared.js'

/** js_path 查询参数：/web-chat/image-gen.js?w=960&h=640 */
function pathOptions() {
  try {
    const url = new URL(import.meta.url, (typeof location !== 'undefined' && location.href) || 'http://localhost/')
    return url.searchParams
  } catch (e) {
    return new URLSearchParams()
  }
}

/** FNV-1a 字符串哈希 → 32 位种子 */
function hashSeed(str) {
  let h = 2166136261
  for (const ch of String(str || '')) {
    h ^= ch.codePointAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 PRNG：确定性随机数，同一 seed 画出同一幅图 */
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------------- 主题注册：关键词 → 绘制配方 ---------------- */

const THEMES = [
  {
    id: 'starry', label: '星空夜景',
    keys: ['星空', '银河', '宇宙', '夜空', '星云', 'star', 'galaxy', 'space', 'night'],
    sky: ['#050816', '#0d1533', '#1c2a5e', '#31427f'],
    paint(ctx, r, W, H, band) {
      band.stars(220, 0.9)
      band.milkyWay()
      band.mountains([[0.72, '#0a0f24'], [0.8, '#111a38'], [0.9, '#182347']], 0.5)
      if (r() > 0.4) band.moon(0.78, 0.2, '#e8ecff')
    },
  },
  {
    id: 'sunset-sea', label: '海上日落',
    keys: ['日落', '夕阳', '海边', '海洋', '大海', '海', 'sunset', 'sea', 'ocean', 'beach'],
    sky: ['#2a1035', '#7a2d4e', '#e0653a', '#ffc46b'],
    paint(ctx, r, W, H, band) {
      band.sun(0.62, 0.16, '#ffdf9e', '#ff8f4d')
      band.clouds(5, 'rgba(255,190,140,0.35)')
      band.sea(['#3c1d4d', '#8a3b52', '#e07a4b', '#ffc46b'])
      band.boat()
    },
  },
  {
    id: 'snow-mountain', label: '雪山远眺',
    keys: ['雪山', '山峰', '山脉', '高原', '登山', 'mountain', 'snow', 'peak', 'alps'],
    sky: ['#0e2038', '#274b6d', '#6fa3b8', '#d8e8ec'],
    paint(ctx, r, W, H, band) {
      band.clouds(6, 'rgba(255,255,255,0.5)')
      band.peakRange()
      band.fog(0.55, 0.18)
    },
  },
  {
    id: 'forest', label: '森林晨雾',
    keys: ['森林', '树林', '松林', '晨雾', '迷雾', 'forest', 'woods', 'fog', 'mist'],
    sky: ['#12241f', '#2c4a3b', '#6e9482', '#c8dccb'],
    paint(ctx, r, W, H, band) {
      band.fog(0.3, 0.22)
      band.treeLayers()
      band.fog(0.62, 0.16)
    },
  },
  {
    id: 'city', label: '城市夜景',
    keys: ['城市', '夜景', '都市', '霓虹', '高楼', '赛博', 'city', 'urban', 'cyberpunk', 'neon'],
    sky: ['#070b1c', '#131c3e', '#28345e', '#4b4a7a'],
    paint(ctx, r, W, H, band) {
      band.stars(90, 0.6)
      band.city()
      band.reflection(['#0a0f22', '#141b38'], 0.12)
    },
  },
  {
    id: 'aurora', label: '极光雪原',
    keys: ['极光', '雪原', '冰原', '北极', 'aurora', 'arctic', 'polar'],
    sky: ['#03101c', '#0a2436', '#123a4a', '#1d5a5e'],
    paint(ctx, r, W, H, band) {
      band.stars(150, 0.8)
      band.aurora()
      band.mountains([[0.78, '#0c1d2a'], [0.88, '#132a3a']], 0.35)
      band.snowGround()
    },
  },
  {
    id: 'flower-field', label: '花田微风',
    keys: ['花田', '花海', '草地', '春天', '野花', 'flower', 'meadow', 'garden', 'spring'],
    sky: ['#1d3a5f', '#4a7ba6', '#9cc4d4', '#e8f2e4'],
    paint(ctx, r, W, H, band) {
      band.clouds(4, 'rgba(255,255,255,0.65)')
      band.meadow()
      band.flowers()
    },
  },
  {
    id: 'abstract', label: '抽象流体',
    keys: ['抽象', '流体', '艺术', '梦境', '幻想', 'abstract', 'dream', 'fluid', 'surreal'],
    sky: ['#1a0b2e', '#43165f', '#8a2f6e', '#e0653a'],
    paint(ctx, r, W, H, band) {
      band.blobs(14)
      band.stars(60, 0.5)
    },
  },
]

/* ---------------- 绘制底座 ---------------- */

function drawScene(ctx, theme, seed, W, H) {
  const r = mulberry32(seed)
  const g = ctx.createLinearGradient(0, 0, 0, H)
  const stops = theme.sky
  stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c))
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  /** 场景元件集合：每个主题的 paint 从这里取笔 */
  const band = {
    /** 星点 */
    stars(n, maxR) {
      for (let i = 0; i < n; i++) {
        const x = r() * W
        const y = r() * H * 0.6
        const rad = (0.4 + r() * 1.4) * (maxR * 1.6)
        ctx.globalAlpha = 0.25 + r() * 0.75
        ctx.fillStyle = r() > 0.85 ? '#ffe9c4' : '#ffffff'
        ctx.beginPath()
        ctx.arc(x, y, rad, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    },
    /** 银河带：斜向柔光椭圆群 */
    milkyWay() {
      ctx.save()
      ctx.translate(W * 0.5, H * 0.32)
      ctx.rotate(-0.35)
      for (let i = 0; i < 46; i++) {
        const x = (r() - 0.5) * W * 1.4
        const y = (r() - 0.5) * H * 0.34
        const rad = 12 + r() * 42
        const grad = ctx.createRadialGradient(x, y, 0, x, y, rad)
        grad.addColorStop(0, 'rgba(200,214,255,' + (0.05 + r() * 0.1).toFixed(3) + ')')
        grad.addColorStop(1, 'rgba(200,214,255,0)')
        ctx.fillStyle = grad
        ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
      }
      ctx.restore()
    },
    /** 月亮/太阳（光晕 + 盘面） */
    moon(fx, fy, color) {
      const x = W * fx
      const y = H * (1 - fy) * 0.62
      const rad = Math.min(W, H) * 0.07
      const glow = ctx.createRadialGradient(x, y, rad * 0.4, x, y, rad * 4)
      glow.addColorStop(0, 'rgba(255,255,240,0.5)')
      glow.addColorStop(1, 'rgba(255,255,240,0)')
      ctx.fillStyle = glow
      ctx.fillRect(x - rad * 4, y - rad * 4, rad * 8, rad * 8)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fill()
      // 月面阴影坑
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      for (let i = 0; i < 4; i++) {
        const a = r() * Math.PI * 2
        const d = r() * rad * 0.6
        ctx.beginPath()
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rad * (0.1 + r() * 0.2), 0, Math.PI * 2)
        ctx.fill()
      }
    },
    /** 落日：半沉入海平线的大光球 */
    sun(fx, fy, inner, outer) {
      const x = W * fx
      const y = H * fy
      const rad = Math.min(W, H) * 0.13
      const glow = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad * 5)
      glow.addColorStop(0, outer)
      glow.addColorStop(1, 'rgba(255,150,80,0)')
      ctx.globalAlpha = 0.55
      ctx.fillStyle = glow
      ctx.fillRect(x - rad * 5, y - rad * 5, rad * 10, rad * 10)
      ctx.globalAlpha = 1
      const disc = ctx.createRadialGradient(x, y, rad * 0.1, x, y, rad)
      disc.addColorStop(0, inner)
      disc.addColorStop(1, outer)
      ctx.fillStyle = disc
      ctx.beginPath()
      ctx.arc(x, y, rad, 0, Math.PI * 2)
      ctx.fill()
    },
    /** 云团（若干椭圆叠加） */
    clouds(n, color) {
      ctx.fillStyle = color
      for (let i = 0; i < n; i++) {
        const cx = r() * W
        const cy = H * (0.08 + r() * 0.3)
        const s = W * (0.04 + r() * 0.09)
        for (let j = 0; j < 5; j++) {
          const ox = (r() - 0.5) * s * 2.4
          const oy = (r() - 0.5) * s * 0.5
          ctx.beginPath()
          ctx.ellipse(cx + ox, cy + oy, s * (0.5 + r() * 0.7), s * (0.22 + r() * 0.3), 0, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    },
    /** 折线山脊（多层剪影） */
    mountains(layers, rough) {
      layers.forEach(([baseY, color], li) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.moveTo(0, H)
        const y0 = H * baseY
        let x = 0
        let y = y0
        ctx.lineTo(0, y)
        while (x < W) {
          x += W * (0.06 + r() * 0.12)
          y = y0 - (r() - 0.35) * H * 0.16 * (1 + rough)
          y = Math.min(H * 0.98, Math.max(H * (baseY - 0.22), y))
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W, H)
        ctx.closePath()
        ctx.fill()
      })
    },
    /** 雪峰：尖顶三角 + 雪帽 + 山体阴影 */
    peakRange() {
      const layers = [[0.5, '#5b7f96', '#eef6f8'], [0.66, '#3c5f78', '#dcebee'], [0.82, '#274459', '#c9dfe8']]
      layers.forEach(([top, body, snow]) => {
        let x = -W * 0.1
        while (x < W * 1.1) {
          const w = W * (0.16 + r() * 0.22)
          const h = H * (0.28 + r() * 0.34) * (1 - (top - 0.5))
          const px = x + w / 2
          const py = H * top
          ctx.fillStyle = body
          ctx.beginPath()
          ctx.moveTo(px - w / 2, py)
          ctx.lineTo(px, py - h)
          ctx.lineTo(px + w / 2, py)
          ctx.closePath()
          ctx.fill()
          // 雪帽（山顶 1/3）
          ctx.fillStyle = snow
          ctx.beginPath()
          ctx.moveTo(px, py - h)
          ctx.lineTo(px - w * 0.18, py - h * 0.62)
          ctx.lineTo(px - w * 0.05, py - h * 0.68)
          ctx.lineTo(px + w * 0.08, py - h * 0.6)
          ctx.lineTo(px + w * 0.2, py - h * 0.66)
          ctx.closePath()
          ctx.fill()
          x += w * 0.72
        }
      })
    },
    /** 海面：渐变 + 波光横线 + 日光倒影 */
    sea(colors) {
      const seaTop = H * 0.62
      const g = ctx.createLinearGradient(0, seaTop, 0, H)
      colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c))
      ctx.fillStyle = g
      ctx.fillRect(0, seaTop, W, H - seaTop)
      // 波光
      ctx.strokeStyle = 'rgba(255,230,190,0.5)'
      for (let i = 0; i < 60; i++) {
        const y = seaTop + r() * (H - seaTop)
        const len = W * (0.01 + r() * 0.05)
        const x = r() * W
        ctx.globalAlpha = 0.15 + r() * 0.5
        ctx.lineWidth = 1 + r()
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + len, y)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    },
    /** 小帆船剪影 */
    boat() {
      const x = W * (0.25 + r() * 0.5)
      const y = H * 0.66
      const s = Math.min(W, H) * 0.05
      ctx.fillStyle = 'rgba(20,16,28,0.85)'
      ctx.beginPath()
      ctx.moveTo(x - s, y)
      ctx.lineTo(x + s, y)
      ctx.lineTo(x + s * 0.6, y + s * 0.28)
      ctx.lineTo(x - s * 0.6, y + s * 0.28)
      ctx.closePath()
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(x, y - s * 1.5)
      ctx.lineTo(x + s * 0.55, y - s * 0.1)
      ctx.lineTo(x, y - s * 0.1)
      ctx.closePath()
      ctx.fill()
    },
    /** 晨雾带（半透明白色横带） */
    fog(at, thick) {
      const y = H * at
      const h = H * thick
      const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2)
      g.addColorStop(0, 'rgba(235,244,240,0)')
      g.addColorStop(0.5, 'rgba(235,244,240,0.35)')
      g.addColorStop(1, 'rgba(235,244,240,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, y - h / 2, W, h)
    },
    /** 层叠树影（近深远浅） */
    treeLayers() {
      const layers = [[0.62, '#16281f', 0.55], [0.74, '#1e3529', 0.75], [0.88, '#284733', 1]]
      layers.forEach(([top, color, density]) => {
        ctx.fillStyle = color
        let x = 0
        while (x < W * 1.05) {
          const h = H * (0.1 + r() * 0.16) * density
          const w = h * (0.34 + r() * 0.2)
          const baseY = H * top + (r() - 0.5) * H * 0.03
          ctx.beginPath()
          ctx.moveTo(x, baseY)
          ctx.lineTo(x + w / 2, baseY - h)
          ctx.lineTo(x + w, baseY)
          ctx.closePath()
          ctx.fill()
          x += w * (0.5 + r() * 0.4)
        }
      })
    },
    /** 城市楼群 + 窗灯 */
    city() {
      const baseY = H * 0.78
      let x = 0
      while (x < W * 1.05) {
        const w = W * (0.04 + r() * 0.07)
        const h = H * (0.18 + r() * 0.5)
        const hue = 220 + r() * 40
        ctx.fillStyle = 'hsl(' + hue + ',30%,' + (8 + r() * 8) + '%)'
        ctx.fillRect(x, baseY - h, w, h)
        // 窗灯
        const cols = Math.max(2, Math.floor(w / 9))
        const rows = Math.max(3, Math.floor(h / 13))
        for (let c = 0; c < cols; c++) {
          for (let rw = 0; rw < rows; rw++) {
            if (r() > 0.72) {
              ctx.fillStyle = r() > 0.5 ? 'rgba(255,214,140,0.9)' : 'rgba(160,220,255,0.75)'
              ctx.fillRect(x + 3 + c * (w - 6) / cols, baseY - h + 4 + rw * (h - 8) / rows, 2.4, 3.2)
            }
          }
        }
        x += w * (1.02 + r() * 0.3)
      }
    },
    /** 水面倒影（城市灯火的碎光） */
    reflection(colors, strength) {
      const top = H * 0.86
      const g = ctx.createLinearGradient(0, top, 0, H)
      colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c))
      ctx.fillStyle = g
      ctx.fillRect(0, top, W, H - top)
      for (let i = 0; i < 70; i++) {
        const y = top + r() * (H - top)
        ctx.strokeStyle = r() > 0.5 ? 'rgba(255,214,140,' + strength * 3 + ')' : 'rgba(140,200,255,' + strength * 2.4 + ')'
        ctx.lineWidth = 1
        ctx.beginPath()
        const x = r() * W
        ctx.moveTo(x, y)
        ctx.lineTo(x + W * (0.01 + r() * 0.03), y)
        ctx.stroke()
      }
    },
    /** 极光带 */
    aurora() {
      for (let band = 0; band < 3; band++) {
        const hue = 140 + band * 40 + r() * 20
        ctx.beginPath()
        const y0 = H * (0.16 + band * 0.07)
        ctx.moveTo(-W * 0.05, y0)
        for (let x = 0; x <= W * 1.05; x += W * 0.05) {
          const y = y0 + Math.sin(x / W * Math.PI * (1.5 + band * 0.6) + seed % 7 + band) * H * 0.06 + (r() - 0.5) * H * 0.02
          ctx.lineTo(x, y)
        }
        ctx.lineTo(W * 1.05, y0 - H * 0.3)
        for (let x = W * 1.05; x >= -W * 0.05; x -= W * 0.05) {
          const y = y0 + Math.sin(x / W * Math.PI * (1.5 + band * 0.6) + seed % 7 + band) * H * 0.06
          ctx.lineTo(x, y - H * (0.22 + band * 0.05))
        }
        ctx.closePath()
        const g = ctx.createLinearGradient(0, y0 - H * 0.3, 0, y0)
        g.addColorStop(0, 'hsla(' + hue + ',80%,60%,0)')
        g.addColorStop(1, 'hsla(' + hue + ',85%,65%,0.4)')
        ctx.fillStyle = g
        ctx.fill()
      }
    },
    /** 雪原地面 */
    snowGround() {
      const g = ctx.createLinearGradient(0, H * 0.8, 0, H)
      g.addColorStop(0, '#dfe9f2')
      g.addColorStop(1, '#b8cadb')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, H)
      ctx.lineTo(0, H * 0.86)
      for (let x = 0; x <= W; x += W * 0.08) {
        ctx.lineTo(x, H * 0.86 + Math.sin(x / W * 4 + seed % 5) * H * 0.015 + (r() - 0.5) * H * 0.01)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()
    },
    /** 草地（花田的地面） */
    meadow() {
      const g = ctx.createLinearGradient(0, H * 0.6, 0, H)
      g.addColorStop(0, '#3f7d4e')
      g.addColorStop(1, '#1f4a30')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.moveTo(0, H)
      ctx.lineTo(0, H * 0.68)
      for (let x = 0; x <= W; x += W * 0.06) {
        ctx.lineTo(x, H * 0.68 + Math.sin(x / W * 5 + seed % 6) * H * 0.02 + (r() - 0.5) * H * 0.015)
      }
      ctx.lineTo(W, H)
      ctx.closePath()
      ctx.fill()
    },
    /** 野花点 */
    flowers() {
      const palette = ['#ff8fb1', '#ffd166', '#f4f1de', '#c084fc', '#ff6b6b', '#f9f871']
      for (let i = 0; i < 90; i++) {
        const x = r() * W
        const y = H * (0.66 + r() * 0.32)
        const rad = 1.6 + r() * 3.2
        ctx.fillStyle = palette[Math.floor(r() * palette.length)]
        ctx.globalAlpha = 0.65 + r() * 0.35
        ctx.beginPath()
        ctx.arc(x, y, rad, 0, Math.PI * 2)
        ctx.fill()
        if (r() > 0.6) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)'
          ctx.beginPath()
          ctx.arc(x, y, rad * 0.35, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    },
    /** 抽象流体圆斑（大半透明圆 + 描边） */
    blobs(n) {
      const palette = ['#ff6b6b', '#f9c74f', '#90be6d', '#4ea8de', '#b388eb', '#ff8fab']
      for (let i = 0; i < n; i++) {
        const x = r() * W
        const y = r() * H
        const rad = Math.min(W, H) * (0.05 + r() * 0.22)
        const color = palette[Math.floor(r() * palette.length)]
        const g = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad)
        g.addColorStop(0, color + 'cc')
        g.addColorStop(1, color + '00')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, rad, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
    },
  }

  theme.paint(ctx, r, W, H, band)
}

/** 按提示词挑主题：命中关键词优先，否则按种子随机 */
function pickTheme(prompt, seed) {
  const p = String(prompt || '').toLowerCase()
  let best = null
  let bestScore = 0
  for (const t of THEMES) {
    let score = 0
    for (const k of t.keys) if (p.includes(k.toLowerCase())) score += k.length
    if (score > bestScore) { bestScore = score; best = t }
  }
  if (best) return best
  return THEMES[seed % THEMES.length]
}

export default function createClient(modelInfo) {
  const name = (modelInfo && (modelInfo.name || modelInfo.id)) || 'web-image-gen'
  const q = pathOptions()
  const W = Math.min(1280, Math.max(320, Number(q.get('w') || 720)))
  const H = Math.min(1280, Math.max(240, Number(q.get('h') || 480)))

  return {
    async load() {},

    /**
     * 生图：提示词 → 主题与种子 → Canvas 程序化渲染 → Markdown 图片输出。
     *
     * @param {Array<{role:string,content:string}>} messages 会话消息
     * @param {{onDelta?:(chunk:string)=>void, signal?:AbortSignal}} opts
     * @returns {Promise<string>} 输出全文（含 markdown 图片）
     */
    async chat(messages, opts = {}) {
      const onDelta = typeof opts.onDelta === 'function' ? opts.onDelta : null
      const signal = opts.signal
      const prompt = lastUserText(messages) || '随机来一张'
      const emit = (s) => { if (onDelta) onDelta(s) }

      emit('🖌️ [' + name + '] 提示词：「' + (prompt.length > 60 ? prompt.slice(0, 60) + '…' : prompt) + '」\n')
      emit('正在浏览器端渲染（纯 Canvas 2D，无服务端参与）…\n\n')

      const seed = hashSeed(prompt)
      const theme = pickTheme(prompt, seed)
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      drawScene(ctx, theme, seed, W, H)
      if (signal && signal.aborted) throw new Error('aborted')

      // 落款：右下角细字（模型名 + 主题 + 种子）
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.font = '11px system-ui, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(name + ' · ' + theme.label + ' · seed ' + seed, W - 10, H - 8)

      const dataUrl = canvas.toDataURL('image/png')
      const lines = [
        '🎨 主题判定：**' + theme.label + '**（种子 ' + seed + '，画布 ' + W + '×' + H + '）',
        '',
        '![' + prompt.replace(/[\[\]()]/g, ' ').slice(0, 60) + '](' + dataUrl + ')',
        '',
        '—— 同一提示词稳定复现同一画面；换关键词（海、雪山、城市、极光、花田…）试试其它主题。',
      ]
      await streamOut(lines.join('\n'), onDelta, { signal, step: 80, delay: 10 })
      return lines.join('\n')
    },

    dispose() {},
  }
}
