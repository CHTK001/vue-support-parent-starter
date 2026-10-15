/**
 * 内置浏览器「鹈鹕骑车」动画预览。
 *
 * 用 data URL 保持自包含：不依赖工作目录、会话数据或外部资源，
 * 任何会话点开「内置浏览器」都能直接看到动画。
 */
export const PELICAN_BIKE_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>鹈鹕骑车动画预览</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #0b2027; }
  .stage { position: relative; width: 100vw; height: 100vh; overflow: hidden; }
  svg { display: block; width: 100%; height: 100%; }
  .caption {
    position: absolute; left: 22px; top: 18px; z-index: 3;
    margin: 0; padding: 8px 14px; border: 1px solid rgba(255,255,255,.32);
    border-radius: 12px; background: rgba(7,26,35,.62); color: #fff;
    font: 600 16px/1.2 system-ui, "Microsoft YaHei", sans-serif;
    letter-spacing: 0; backdrop-filter: blur(8px);
  }
  .badge {
    position: absolute; right: 20px; top: 18px; z-index: 3;
    padding: 7px 12px; border-radius: 999px; background: rgba(17,194,183,.18);
    color: #bffcf4; font: 500 13px/1.2 system-ui, sans-serif;
    border: 1px solid rgba(17,194,183,.35);
  }
  @media (max-width: 700px) {
    .caption { font-size: 13px; padding: 6px 10px; top: 10px; left: 10px; }
    .badge { font-size: 11px; padding: 5px 9px; top: 10px; right: 10px; }
  }
</style>
</head>
<body>
<div class="stage">
  <div class="caption">鹈鹕骑车</div>
  <div class="badge">内置浏览器 · 动画验收</div>
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7fd6ff"/>
        <stop offset="58%" stop-color="#bde9ff"/>
        <stop offset="100%" stop-color="#eefcff"/>
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#78b66a"/>
        <stop offset="100%" stop-color="#3f7d45"/>
      </linearGradient>
      <radialGradient id="sun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff6c9"/>
        <stop offset="55%" stop-color="#ffd75e"/>
        <stop offset="100%" stop-color="#ffb84d"/>
      </radialGradient>
    </defs>

    <rect width="1200" height="720" fill="url(#sky)"/>
    <circle cx="1000" cy="118" r="68" fill="url(#sun)" opacity=".95"/>

    <g fill="#ffffff" opacity=".8">
      <ellipse class="cloud-a" cx="230" cy="115" rx="92" ry="34"/>
      <ellipse class="cloud-a" cx="176" cy="96" rx="46" ry="24"/>
      <ellipse class="cloud-a" cx="288" cy="98" rx="52" ry="27"/>
      <ellipse class="cloud-b" cx="760" cy="185" rx="104" ry="34"/>
      <ellipse class="cloud-b" cx="700" cy="165" rx="48" ry="24"/>
      <ellipse class="cloud-b" cx="825" cy="168" rx="58" ry="26"/>
    </g>

    <path d="M0 560 L220 430 L360 510 L540 420 L720 540 L900 455 L1080 535 L1200 465 L1200 720 L0 720 Z"
      fill="#9bc98a" opacity=".55"/>
    <rect y="560" width="1200" height="160" fill="url(#ground)"/>
    <rect y="560" width="1200" height="10" fill="#e8f7d5" opacity=".65"/>

    <g class="road-stripes" fill="#eafbe7" opacity=".85">
      <rect x="30" y="668" width="150" height="14" rx="7"/>
      <rect x="290" y="668" width="150" height="14" rx="7"/>
      <rect x="550" y="668" width="150" height="14" rx="7"/>
      <rect x="810" y="668" width="150" height="14" rx="7"/>
      <rect x="1070" y="668" width="150" height="14" rx="7"/>
    </g>

    <g class="speed-line" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".42">
      <line x1="70" y1="420" x2="190" y2="420"/>
      <line x1="30" y1="470" x2="170" y2="470" opacity=".34"/>
      <line x1="90" y1="520" x2="220" y2="520" opacity=".28"/>
    </g>

    <g class="bike-group">
      <circle cx="560" cy="470" r="85" fill="#f7fbf8" stroke="#263238" stroke-width="8"/>
      <circle cx="560" cy="470" r="12" fill="#263238"/>
      <g stroke="#79868b" stroke-width="4">
        <animateTransform attributeName="transform" type="rotate" from="0 560 470" to="360 560 470" dur="0.55s" repeatCount="indefinite"/>
        <line x1="560" y1="385" x2="560" y2="555"/>
        <line x1="475" y1="470" x2="645" y2="470"/>
        <line x1="500" y1="405" x2="620" y2="535"/>
        <line x1="620" y1="405" x2="500" y2="535"/>
      </g>

      <circle cx="830" cy="470" r="85" fill="#f7fbf8" stroke="#263238" stroke-width="8"/>
      <circle cx="830" cy="470" r="12" fill="#263238"/>
      <g stroke="#79868b" stroke-width="4">
        <animateTransform attributeName="transform" type="rotate" from="0 830 470" to="360 830 470" dur="0.55s" repeatCount="indefinite"/>
        <line x1="830" y1="385" x2="830" y2="555"/>
        <line x1="745" y1="470" x2="915" y2="470"/>
        <line x1="770" y1="405" x2="890" y2="535"/>
        <line x1="890" y1="405" x2="770" y2="535"/>
      </g>

      <g stroke="#e53935" stroke-width="9" stroke-linecap="round" fill="none">
        <line x1="560" y1="470" x2="650" y2="345"/>
        <line x1="650" y1="345" x2="790" y2="345"/>
        <line x1="560" y1="470" x2="790" y2="345"/>
        <line x1="790" y1="345" x2="830" y2="470"/>
        <line x1="650" y1="345" x2="620" y2="400"/>
      </g>
      <ellipse cx="650" cy="336" rx="27" ry="8" fill="#263238"/>
      <rect x="645" y="340" width="10" height="18" fill="#546e7a"/>
      <line x1="790" y1="345" x2="812" y2="318" stroke="#546e7a" stroke-width="8" stroke-linecap="round"/>
      <line x1="796" y1="315" x2="828" y2="315" stroke="#263238" stroke-width="8" stroke-linecap="round"/>

      <g stroke="#8d9aa0" stroke-width="5" stroke-dasharray="8 8">
        <line x1="560" y1="462" x2="620" y2="400"/>
        <line x1="830" y1="462" x2="790" y2="400"/>
      </g>

      <g>
        <circle cx="620" cy="400" r="11" fill="#455a64"/>
        <g stroke="#37474f" stroke-width="6" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 620 400" to="360 620 400" dur="0.55s" repeatCount="indefinite"/>
          <line x1="620" y1="400" x2="594" y2="426"/>
          <line x1="620" y1="400" x2="646" y2="374"/>
        </g>
      </g>

      <g>
        <circle cx="650" cy="470" r="10" fill="#5d4037"/>
        <path d="M570 470 L612 470 L616 458 L590 452 Z" fill="#f7fbf8" stroke="#263238" stroke-width="3"/>
      </g>

      <g class="pelican-bob">
        <ellipse cx="650" cy="278" rx="57" ry="68" fill="#f7f8fa" stroke="#a9b0b5" stroke-width="4"/>
        <ellipse cx="650" cy="278" rx="38" ry="62" fill="#ffffff" opacity=".55"/>

        <path d="M618 268 Q570 232 582 280 Q574 294 606 302 Z" fill="#d9dee1" stroke="#a9b0b5" stroke-width="3"/>
        <path d="M684 268 Q732 232 720 280 Q728 294 696 302 Z" fill="#d9dee1" stroke="#a9b0b5" stroke-width="3"/>

        <g class="wing-left">
          <path d="M600 262 Q552 242 556 278 Q550 294 588 302 Z" fill="#eef1f3" stroke="#98a1a6" stroke-width="3"/>
        </g>
        <g class="wing-right">
          <path d="M702 262 Q750 242 746 278 Q752 294 714 302 Z" fill="#eef1f3" stroke="#98a1a6" stroke-width="3"/>
        </g>

        <path d="M648 236 Q640 182 650 158" fill="none" stroke="#eef1f3" stroke-width="30"/>
        <path d="M648 236 Q640 182 650 158" fill="none" stroke="#d2d7da" stroke-width="26"/>

        <g class="head-bob">
          <ellipse cx="654" cy="136" rx="43" ry="36" fill="#f7f8fa" stroke="#a9b0b5" stroke-width="4"/>
          <path d="M630 110 Q640 84 668 90 Q692 96 690 120 Q676 102 650 104 Q638 106 630 110 Z" fill="#d9dee1"/>
          <circle cx="686" cy="125" r="8" fill="#fff" stroke="#263238" stroke-width="3"/>
          <circle cx="690" cy="124" r="4" fill="#263238"/>
          <circle cx="692" cy="122" r="1.6" fill="#fff"/>

          <path d="M700 130 Q746 122 782 128 Q792 132 786 137 Q768 146 738 146 Q710 147 700 138 Z" fill="#f4a261" stroke="#d4844a" stroke-width="4"/>
          <path d="M706 124 Q746 116 782 121 Q788 125 782 129 Q746 122 706 128 Z" fill="#e8c39e" stroke="#d4844a" stroke-width="3"/>

          <g class="beak-lower">
            <path d="M706 138 Q742 152 784 146 Q786 152 780 158 Q756 166 724 162 Q708 158 704 146 Z" fill="#f8c98b" stroke="#d4844a" stroke-width="4"/>
            <path d="M772 124 Q788 128 794 138 Q788 144 780 142 Q784 134 772 130 Z" fill="#e8a95d" stroke="#d4844a" stroke-width="3"/>
          </g>

          <path d="M622 124 Q632 100 656 94 Q680 100 688 124" fill="#e53935" stroke="#b71c1c" stroke-width="4"/>
          <rect x="618" y="122" width="74" height="8" rx="4" fill="#c62828"/>
          <rect x="646" y="108" width="9" height="6" rx="2" fill="#b71c1c"/>
          <rect x="662" y="108" width="9" height="6" rx="2" fill="#b71c1c"/>
          <path d="M628 130 Q640 152 658 156" fill="none" stroke="#37474f" stroke-width="4" stroke-dasharray="6 5"/>
        </g>
      </g>
    </g>
  </svg>
</div>
</body>
</html>
`;

export function buildPelicanBikeUrl(): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(PELICAN_BIKE_HTML)}`;
}
