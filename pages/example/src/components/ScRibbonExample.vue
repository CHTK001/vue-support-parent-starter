<template>
  <div class="ribbon-example">
    <el-card class="intro-card">
      <template #header>
        <div class="card-header-content">
          <IconifyIconOnline
            icon="ri:price-tag-3-line"
            :style="{ fontSize: '24px', color: 'var(--el-color-primary)' }"
          />
          <div>
            <h2>ScRibbon 绸带组件</h2>
            <p class="subtitle">20种精美绸带样式，支持多种颜色和尺寸</p>
          </div>
        </div>
      </template>

        <el-alert title="提示" type="info" :closable="false">
          <p>
            本组件提供20种不同风格的绸带效果，包括徽章、角标、对角线、横幅、折叠、书签、标签、悬挂、斜绶带、盾牌、波浪、箭头、圆形、星形、六边形、爆炸星、双层、梯形、三角旗和飘带等样式，适用于徽章、标签、促销标识等多种场景
          </p>
        </el-alert>
    </el-card>

    <!-- 1. Badge 徽章 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:medal-line" /> Badge - 徽章绸带</h3>
      </template>
      <div class="badge-demo">
        <ScRibbon text="默认" variant="badge" />
        <ScRibbon text="成功" variant="badge" color="#67c23a" />
        <ScRibbon text="警告" variant="badge" color="#e6a23c" />
        <ScRibbon text="危险" variant="badge" color="#f56c6c" />
        <ScRibbon text="信息" variant="badge" color="#909399" />
        <ScRibbon
          text="带图标"
          variant="badge"
          icon="ri:star-fill"
          color="#ff9800"
        />
      </div>
      <CodeDisplay :code="badgeCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 2. Corner 角标 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:pushpin-line" /> Corner - 角标绸带</h3>
      </template>
      <div class="grid-demo">
        <div v-for="pos in cornerPositions" :key="pos.value" class="demo-card">
          <div class="demo-card-body">
            <p>{{ pos.label }}</p>
          </div>
          <ScRibbon
            :text="pos.text"
            variant="corner"
            :position="pos.value"
            :color="pos.color"
            :icon="pos.icon"
          />
        </div>
      </div>
      <CodeDisplay :code="cornerCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 3. Diagonal 对角线 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:layout-masonry-line" /> Diagonal -
          对角线绸带
        </h3>
      </template>
      <div class="grid-demo">
        <div
          v-for="pos in diagonalPositions"
          :key="pos.value"
          class="demo-card"
        >
          <div class="demo-card-body">
            <p>{{ pos.label }}</p>
          </div>
          <ScRibbon
            :text="pos.text"
            variant="diagonal"
            :position="pos.value"
            :color="pos.color"
          />
        </div>
      </div>
      <CodeDisplay :code="diagonalCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 4. Banner 横幅 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:flag-line" /> Banner - 横幅绸带</h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="活动进行中"
              variant="banner"
              width="80%"
              icon="ri:fire-fill"
              color="#ff6b6b"
            />
          </div>
        </div>
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="限时优惠"
              variant="banner"
              width="70%"
              icon="ri:ticket-line"
              color="#4ecb71"
            />
          </div>
        </div>
      </div>
      <CodeDisplay :code="bannerCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 5. Folded 折叠 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:bookmark-line" /> Folded - 折叠绸带</h3>
      </template>
      <div class="grid-demo">
        <div v-for="pos in foldedPositions" :key="pos.value" class="demo-card">
          <div class="demo-card-body">
            <p>{{ pos.label }}</p>
          </div>
          <ScRibbon
            :text="pos.text"
            variant="folded"
            :position="pos.value"
            :color="pos.color"
          />
        </div>
      </div>
      <CodeDisplay :code="foldedCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 6. Bookmark 书签 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:bookmark-fill" /> Bookmark - 书签绸带
        </h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card">
          <div class="demo-card-body">
            <p>左侧书签</p>
          </div>
          <ScRibbon
            text="推荐"
            variant="bookmark"
            position="lt"
            color="#8b5cf6"
            icon="ri:thumb-up-fill"
          />
        </div>
        <div class="demo-card">
          <div class="demo-card-body">
            <p>右侧书签</p>
          </div>
          <ScRibbon
            text="精选"
            variant="bookmark"
            position="rt"
            color="#ec4899"
            icon="ri:heart-fill"
          />
        </div>
      </div>
      <CodeDisplay :code="bookmarkCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 7. Tag 标签 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:price-tag-line" /> Tag - 标签绸带</h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card">
          <div class="demo-card-body">
            <p>左侧标签</p>
          </div>
          <ScRibbon
            text="-30%"
            variant="tag"
            position="lt"
            color="#f59e0b"
            size="lg"
          />
        </div>
        <div class="demo-card">
          <div class="demo-card-body">
            <p>右侧标签</p>
          </div>
          <ScRibbon
            text="NEW"
            variant="tag"
            position="rt"
            color="#10b981"
            size="lg"
          />
        </div>
      </div>
      <CodeDisplay :code="tagCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 8. Hanging 悬挂 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:t-shirt-line" /> Hanging - 悬挂绸带</h3>
      </template>
      <div class="hanging-demo">
        <ScRibbon
          text="限量版"
          variant="hanging"
          color="#6366f1"
          icon="ri:vip-crown-fill"
        />
        <ScRibbon
          text="Best Seller"
          variant="hanging"
          color="#ef4444"
          icon="ri:trophy-fill"
          size="lg"
        />
        <ScRibbon text="特价" variant="hanging" color="#14b8a6" size="sm" />
      </div>
      <CodeDisplay :code="hangingCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 9. Sash 斜绶带 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:palette-line" /> Sash - 斜绶带</h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card large">
          <div class="demo-card-body">
            <p class="demo-title">获奖产品</p>
          </div>
          <ScRibbon
            text="Winner"
            variant="sash"
            position="lt"
            color="#d946ef"
          />
        </div>
        <div class="demo-card large">
          <div class="demo-card-body">
            <p class="demo-title">畅销商品</p>
          </div>
          <ScRibbon
            text="Best Seller"
            variant="sash"
            position="rt"
            color="#3b82f6"
          />
        </div>
      </div>
      <CodeDisplay :code="sashCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 10. Shield 盾牌 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:shield-star-line" /> Shield - 盾牌绸带
        </h3>
      </template>
      <div class="shield-demo">
        <ScRibbon variant="shield" color="#8b5cf6">
          <template #default>
            <div class="shield-content">
              <IconifyIconOnline
                icon="ri:vip-crown-2-fill"
                :style="{ fontSize: '20px' }"
              />
              <span>VIP</span>
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="shield" color="#ef4444">
          <template #default>
            <div class="shield-content">
              <IconifyIconOnline
                icon="ri:award-fill"
                :style="{ fontSize: '20px' }"
              />
              <span>TOP</span>
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="shield" color="#10b981">
          <template #default>
            <div class="shield-content">
              <IconifyIconOnline
                icon="ri:medal-fill"
                :style="{ fontSize: '20px' }"
              />
              <span>PRO</span>
            </div>
          </template>
        </ScRibbon>
      </div>
      <CodeDisplay :code="shieldCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 尺寸对比 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:ruler-line" /> 尺寸对比 (Size)</h3>
      </template>
      <div class="size-demo">
        <div class="size-group">
          <span class="size-label">Small:</span>
          <ScRibbon text="Small" variant="badge" size="sm" />
          <ScRibbon
            text="Small"
            variant="badge"
            size="sm"
            color="#67c23a"
            icon="ri:check-line"
          />
        </div>
        <div class="size-group">
          <span class="size-label">Medium:</span>
          <ScRibbon text="Medium" variant="badge" size="md" />
          <ScRibbon
            text="Medium"
            variant="badge"
            size="md"
            color="#e6a23c"
            icon="ri:star-fill"
          />
        </div>
        <div class="size-group">
          <span class="size-label">Large:</span>
          <ScRibbon text="Large" variant="badge" size="lg" />
          <ScRibbon
            text="Large"
            variant="badge"
            size="lg"
            color="#f56c6c"
            icon="ri:fire-fill"
          />
        </div>
      </div>
      <CodeDisplay :code="sizeCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 11. Wave 波浪 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:water-flash-line" /> Wave - 波浪绸带
        </h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="Summer Sale"
              variant="wave"
              width="85%"
              color="#06b6d4"
              icon="ri:sun-line"
            />
          </div>
        </div>
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="Ocean Theme"
              variant="wave"
              width="75%"
              color="#0ea5e9"
              size="lg"
            />
          </div>
        </div>
      </div>
      <CodeDisplay :code="waveCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 12. Arrow 箭头 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:arrow-right-line" /> Arrow - 箭头绸带
        </h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card">
          <div class="demo-card-body">
            <p>左侧箭头</p>
          </div>
          <ScRibbon
            text="点击查看"
            variant="arrow"
            position="lt"
            color="#8b5cf6"
            icon="ri:arrow-right-s-line"
          />
        </div>
        <div class="demo-card">
          <div class="demo-card-body">
            <p>右侧箭头</p>
          </div>
          <ScRibbon
            text="立即购买"
            variant="arrow"
            position="rt"
            color="#ec4899"
            icon="ri:shopping-cart-line"
          />
        </div>
      </div>
      <CodeDisplay :code="arrowCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 13. Circle 圆形 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:record-circle-line" /> Circle - 圆形徽章
        </h3>
      </template>
      <div class="shape-demo">
        <ScRibbon variant="circle" color="#3b82f6">
          <template #default>
            <div class="circle-content">
              <IconifyIconOnline
                icon="ri:medal-line"
                :style="{ fontSize: '24px' }"
              />
              <span style="font-size: 10px">金牌</span>
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="circle" color="#ef4444" size="lg">
          <template #default>
            <div class="circle-content">
              <span style="font-size: 20px; font-weight: 800">50%</span>
              <span style="font-size: 10px">OFF</span>
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="circle" color="#10b981" size="sm">
          <template #default>
            <div class="circle-content">
              <IconifyIconOnline
                icon="ri:check-line"
                :style="{ fontSize: '20px' }"
              />
            </div>
          </template>
        </ScRibbon>
      </div>
      <CodeDisplay :code="circleCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 14. Star 星形 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:star-line" /> Star - 星形徽章</h3>
      </template>
      <div class="shape-demo">
        <ScRibbon variant="star" color="#f59e0b">
          <template #default>
            <div class="star-content">
              <span style="font-size: 16px; font-weight: 800">TOP</span>
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="star" color="#ec4899" size="lg">
          <template #default>
            <div class="star-content">
              <IconifyIconOnline
                icon="ri:star-fill"
                :style="{ fontSize: '28px' }"
              />
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="star" color="#8b5cf6">
          <template #default>
            <div class="star-content">
              <span style="font-size: 14px; font-weight: 800">VIP</span>
            </div>
          </template>
        </ScRibbon>
      </div>
      <CodeDisplay :code="starCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 15. Hexagon 六边形 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:shape-line" /> Hexagon - 六边形徽章</h3>
      </template>
      <div class="shape-demo">
        <ScRibbon variant="hexagon" color="#06b6d4">
          <template #default>
            <div class="hex-content">
              <span style="font-size: 16px; font-weight: 800">PRO</span>
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="hexagon" color="#10b981" size="lg">
          <template #default>
            <div class="hex-content">
              <IconifyIconOnline
                icon="ri:shield-check-fill"
                :style="{ fontSize: '28px' }"
              />
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="hexagon" color="#f59e0b" size="sm">
          <template #default>
            <div class="hex-content">
              <span style="font-size: 12px; font-weight: 800">NEW</span>
            </div>
          </template>
        </ScRibbon>
      </div>
      <CodeDisplay :code="hexagonCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 16. Starburst 爆炸星 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:flashlight-fill" /> Starburst - 爆炸星徽章
          (带动画)
        </h3>
      </template>
      <div class="shape-demo">
        <ScRibbon variant="starburst" color="#ef4444">
          <template #default>
            <div class="burst-content">
              <span style="font-size: 18px; font-weight: 800">HOT</span>
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="starburst" color="#f59e0b" size="lg">
          <template #default>
            <div class="burst-content">
              <IconifyIconOnline
                icon="ri:fire-fill"
                :style="{ fontSize: '32px' }"
              />
            </div>
          </template>
        </ScRibbon>
        <ScRibbon variant="starburst" color="#ec4899">
          <template #default>
            <div class="burst-content">
              <span style="font-size: 16px; font-weight: 800">SALE</span>
            </div>
          </template>
        </ScRibbon>
      </div>
      <CodeDisplay :code="starburstCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 17. Double 双层 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:stack-line" /> Double - 双层绸带</h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="双倍积分"
              variant="double"
              width="80%"
              color="#8b5cf6"
              icon="ri:gift-line"
            />
          </div>
        </div>
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="Premium Offer"
              variant="double"
              width="70%"
              color="#3b82f6"
              size="lg"
            />
          </div>
        </div>
      </div>
      <CodeDisplay :code="doubleCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 18. Trapezoid 梯形 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:contrast-2-line" /> Trapezoid - 梯形绸带
        </h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="限时抢购"
              variant="trapezoid"
              width="75%"
              color="#ef4444"
              icon="ri:time-line"
            />
          </div>
        </div>
        <div class="demo-card large">
          <div class="demo-card-body">
            <ScRibbon
              text="Flash Deal"
              variant="trapezoid"
              width="65%"
              color="#f59e0b"
              size="lg"
            />
          </div>
        </div>
      </div>
      <CodeDisplay :code="trapezoidCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 19. Pennant 三角旗 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:flag-2-line" /> Pennant - 三角旗绸带
        </h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card">
          <div class="demo-card-body">
            <p>左侧三角旗</p>
          </div>
          <ScRibbon
            text="优选"
            variant="pennant"
            position="lt"
            color="#10b981"
            icon="ri:trophy-line"
          />
        </div>
        <div class="demo-card">
          <div class="demo-card-body">
            <p>右侧三角旗</p>
          </div>
          <ScRibbon
            text="精品"
            variant="pennant"
            position="rt"
            color="#6366f1"
            icon="ri:gem-line"
          />
        </div>
      </div>
      <CodeDisplay :code="pennantCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 20. Swoosh 飘带 -->
    <el-card class="section-card">
      <template #header>
        <h3>
          <IconifyIconOnline icon="ri:flight-takeoff-line" /> Swoosh - 飘带绸带
        </h3>
      </template>
      <div class="grid-demo">
        <div class="demo-card">
          <div class="demo-card-body">
            <p>左侧飘带</p>
          </div>
          <ScRibbon
            text="Fresh"
            variant="swoosh"
            position="lt"
            color="#14b8a6"
            icon="ri:leaf-line"
          />
        </div>
        <div class="demo-card">
          <div class="demo-card-body">
            <p>右侧飘带</p>
          </div>
          <ScRibbon
            text="Trendy"
            variant="swoosh"
            position="rt"
            color="#a855f7"
            icon="ri:sparkles-line"
          />
        </div>
      </div>
      <CodeDisplay :code="swooshCode" language="vue" class="mt-3" />
    </el-card>

    <!-- 实际应用场景 -->
    <el-card class="section-card">
      <template #header>
        <h3><IconifyIconOnline icon="ri:shopping-bag-line" /> 实际应用场景</h3>
      </template>
      <div class="grid-demo">
        <!-- 商品卡片1 -->
        <div class="product-card">
          <div
            class="product-image"
            style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            "
          >
            <IconifyIconOnline
              icon="ri:smartphone-line"
              :style="{ fontSize: '48px', color: 'white' }"
            />
          </div>
          <div class="product-info">
            <h4>iPhone 15 Pro</h4>
            <p class="price">¥7,999</p>
          </div>
          <ScRibbon
            text="HOT"
            variant="corner"
            position="lt"
            color="#f56c6c"
            icon="ri:fire-fill"
          />
          <ScRibbon
            text="Free Shipping"
            variant="diagonal"
            position="rb"
            color="#67c23a"
          />
        </div>

        <!-- 商品卡片2 -->
        <div class="product-card">
          <div
            class="product-image"
            style="
              background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            "
          >
            <IconifyIconOnline
              icon="ri:macbook-line"
              :style="{ fontSize: '48px', color: 'white' }"
            />
          </div>
          <div class="product-info">
            <h4>MacBook Pro</h4>
            <p class="price">¥14,999</p>
          </div>
          <ScRibbon
            text="NEW"
            variant="tag"
            position="lt"
            color="#3b82f6"
            size="lg"
          />
          <ScRibbon
            text="Best Choice"
            variant="sash"
            position="rt"
            color="#8b5cf6"
          />
        </div>

        <!-- 商品卡片3 -->
        <div class="product-card">
          <div
            class="product-image"
            style="
              background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            "
          >
            <IconifyIconOnline
              icon="ri:headphone-line"
              :style="{ fontSize: '48px', color: 'white' }"
            />
          </div>
          <div class="product-info">
            <h4>AirPods Pro</h4>
            <p class="price">¥1,999</p>
          </div>
          <ScRibbon
            text="-20%"
            variant="folded"
            position="lt"
            color="#ef4444"
            size="lg"
          />
          <ScRibbon
            text="推荐"
            variant="bookmark"
            position="rt"
            color="#10b981"
            icon="ri:thumb-up-fill"
          />
        </div>

        <!-- 商品卡片4 -->
        <div class="product-card">
          <div
            class="product-image"
            style="
              background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
            "
          >
            <IconifyIconOnline
              icon="ri:tablet-line"
              :style="{ fontSize: '48px', color: 'white' }"
            />
          </div>
          <div class="product-info">
            <h4>iPad Air</h4>
            <p class="price">¥4,799</p>
          </div>
          <ScRibbon
            text="LIMITED"
            variant="banner"
            width="90%"
            color="#ff6b6b"
            icon="ri:time-line"
          />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ScRibbon from "@repo/components/ScRibbon/index.vue";
import CodeDisplay from "./CodeDisplay.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 角标位置配置
const cornerPositions = ref([
  {
    value: "lt" as const,
    label: "左上角",
    text: "NEW",
    color: "#409eff",
    icon: "ri:flashlight-fill",
  },
  {
    value: "rt" as const,
    label: "右上角",
    text: "HOT",
    color: "#f56c6c",
    icon: "ri:fire-fill",
  },
  {
    value: "lb" as const,
    label: "左下角",
    text: "SALE",
    color: "#67c23a",
    icon: "ri:price-tag-3-fill",
  },
  {
    value: "rb" as const,
    label: "右下角",
    text: "PRO",
    color: "#e6a23c",
    icon: "ri:vip-crown-fill",
  },
]);

// 对角线位置配置
const diagonalPositions = ref([
  { value: "lt" as const, label: "左上角", text: "BETA", color: "#8b5cf6" },
  { value: "rt" as const, label: "右上角", text: "ALPHA", color: "#3b82f6" },
  { value: "lb" as const, label: "左下角", text: "DEV", color: "#10b981" },
  { value: "rb" as const, label: "右下角", text: "PREVIEW", color: "#f59e0b" },
]);

// 折叠位置配置
const foldedPositions = ref([
  { value: "lt" as const, label: "左上", text: "-50%", color: "#ef4444" },
  { value: "rt" as const, label: "右上", text: "SALE", color: "#f59e0b" },
  { value: "lb" as const, label: "左下", text: "OFF", color: "#8b5cf6" },
  { value: "rb" as const, label: "右下", text: "DEAL", color: "#10b981" },
]);

// 代码示例
const badgeCode = `<ScRibbon text="默认" variant="badge" />
<ScRibbon text="成功" variant="badge" color="#67c23a" />
<ScRibbon text="带图标" variant="badge" icon="ri:star-fill" color="#ff9800" />`;

const cornerCode = `<div class="card">
  <ScRibbon 
    text="NEW" 
    variant="corner" 
    position="lt" 
    icon="ri:flashlight-fill" 
  />
</div>`;

const diagonalCode = `<div class="card">
  <ScRibbon 
    text="BETA" 
    variant="diagonal" 
    position="lt" 
    color="#8b5cf6" 
  />
</div>`;

const bannerCode = `<div class="card">
  <ScRibbon 
    text="活动进行中" 
    variant="banner" 
    width="80%" 
    icon="ri:fire-fill" 
    color="#ff6b6b" 
  />
</div>`;

const foldedCode = `<div class="card">
  <ScRibbon 
    text="-50%" 
    variant="folded" 
    position="lt" 
    color="#ef4444" 
  />
</div>`;

const bookmarkCode = `<div class="card">
  <ScRibbon 
    text="推荐" 
    variant="bookmark" 
    position="lt" 
    color="#8b5cf6" 
    icon="ri:thumb-up-fill" 
  />
</div>`;

const tagCode = `<div class="card">
  <ScRibbon 
    text="-30%" 
    variant="tag" 
    position="lt" 
    color="#f59e0b" 
    size="lg" 
  />
</div>`;

const hangingCode = `<ScRibbon 
  text="限量版" 
  variant="hanging" 
  color="#6366f1" 
  icon="ri:vip-crown-fill" 
/>`;

const sashCode = `<div class="card">
  <ScRibbon 
    text="Winner" 
    variant="sash" 
    position="lt" 
    color="#d946ef" 
  />
</div>`;

const shieldCode = `<ScRibbon variant="shield" color="#8b5cf6">
  <template #default>
    <div class="shield-content">
      <IconifyIconOnline icon="ri:vip-crown-2-fill" />
      <span>VIP</span>
    </div>
  </template>
</ScRibbon>`;

const sizeCode = `<ScRibbon text="Small" variant="badge" size="sm" />
<ScRibbon text="Medium" variant="badge" size="md" />
<ScRibbon text="Large" variant="badge" size="lg" />`;

const waveCode = `<div class="card">
  <ScRibbon 
    text="Summer Sale" 
    variant="wave" 
    width="85%" 
    color="#06b6d4" 
    icon="ri:sun-line" 
  />
</div>`;

const arrowCode = `<div class="card">
  <ScRibbon 
    text="点击查看" 
    variant="arrow" 
    position="lt" 
    color="#8b5cf6" 
    icon="ri:arrow-right-s-line" 
  />
</div>`;

const circleCode = `<ScRibbon variant="circle" color="#ef4444" size="lg">
  <template #default>
    <div class="circle-content">
      <span style="font-size: 20px; font-weight: 800">50%</span>
      <span style="font-size: 10px">OFF</span>
    </div>
  </template>
</ScRibbon>`;

const starCode = `<ScRibbon variant="star" color="#f59e0b">
  <template #default>
    <div class="star-content">
      <span style="font-size: 16px; font-weight: 800">TOP</span>
    </div>
  </template>
</ScRibbon>`;

const hexagonCode = `<ScRibbon variant="hexagon" color="#06b6d4">
  <template #default>
    <div class="hex-content">
      <span style="font-size: 16px; font-weight: 800">PRO</span>
    </div>
  </template>
</ScRibbon>`;

const starburstCode = `<ScRibbon variant="starburst" color="#ef4444">
  <template #default>
    <div class="burst-content">
      <span style="font-size: 18px; font-weight: 800">HOT</span>
    </div>
  </template>
</ScRibbon>`;

const doubleCode = `<div class="card">
  <ScRibbon 
    text="双倍积分" 
    variant="double" 
    width="80%" 
    color="#8b5cf6" 
    icon="ri:gift-line" 
  />
</div>`;

const trapezoidCode = `<div class="card">
  <ScRibbon 
    text="限时抢购" 
    variant="trapezoid" 
    width="75%" 
    color="#ef4444" 
    icon="ri:time-line" 
  />
</div>`;

const pennantCode = `<div class="card">
  <ScRibbon 
    text="优选" 
    variant="pennant" 
    position="lt" 
    color="#10b981" 
    icon="ri:trophy-line" 
  />
</div>`;

const swooshCode = `<div class="card">
  <ScRibbon 
    text="Fresh" 
    variant="swoosh" 
    position="lt" 
    color="#14b8a6" 
    icon="ri:leaf-line" 
  />
</div>`;
</script>

<style scoped>
.ribbon-example {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.intro-card {
  margin-bottom: 24px;
}

.card-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-header-content h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: var(--el-text-color-primary);
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.section-card {
  margin-bottom: 24px;
}

.section-card h3 {
  margin: 0;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Badge Demo */
.badge-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

/* Grid Demo */
.grid-demo {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.demo-card {
  position: relative;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  overflow: hidden;
  transition: all 0.3s;
}

.demo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.demo-card.large {
  min-height: 180px;
}

.demo-card-body {
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  font-size: 16px;
}

.demo-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* Hanging Demo */
.hanging-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

/* Shield Demo */
.shield-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.shield-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* Size Demo */
.size-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.size-group {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.size-label {
  font-weight: 600;
  min-width: 80px;
  color: var(--el-text-color-primary);
}

/* Product Card */
.product-card {
  position: relative;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  background: var(--el-bg-color-overlay);
  overflow: hidden;
  transition: all 0.3s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.product-image {
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-info {
  padding: 16px;
}

.product-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.price {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.mt-3 {
  margin-top: 16px;
}

/* Shape Demo */
.shape-demo {
  display: flex;
  flex-wrap: wrap;
  gap: 32px;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 160px;
}

.circle-content,
.star-content,
.hex-content,
.burst-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

/* 响应式 */
@media (max-width: 768px) {
  .grid-demo {
    grid-template-columns: 1fr;
  }

  .product-card {
    max-width: 100%;
  }

  .shape-demo {
    gap: 24px;
  }
}
</style>
