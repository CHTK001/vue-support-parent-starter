<template>
  <div class="sc-panel-example">
    <h2 class="example-title">ScPanel 面板组件</h2>
    <p class="example-description">ScPanel是一个灵活的面板组件，支持多种类型、主题和尺寸，可用于页面中的内容分区、数据卡片展示等场景。</p>

    <el-divider content-position="left">基础用法</el-divider>
    <div class="example-section">
      <div class="example-row">
        <ScPanel title="默认面板">
          <div class="panel-content">
            <p>这是一个基于Element Plus的面板组件，默认使用el-card实现。</p>
            <p>支持标题、内容和底部插槽。</p>
          </div>
        </ScPanel>
      </div>
    </div>

    <el-divider content-position="left">面板类型</el-divider>
    <div class="example-section">
      <p class="section-description">ScPanel支持多种不同类型的面板，包括基础类型和高级类型。</p>
      <h4>基础面板类型</h4>
      <div class="example-row">
        <ScPanel type="default" title="默认面板" class="example-item">
          <div class="panel-content">
            <p>基于Element Plus的el-card组件实现</p>
          </div>
        </ScPanel>

        <ScPanel type="card" title="卡片面板" class="example-item">
          <div class="panel-content">
            <p>自定义卡片样式的面板</p>
          </div>
        </ScPanel>

        <ScPanel type="border" title="边框面板" class="example-item">
          <div class="panel-content">
            <p>带彩色边框的面板</p>
          </div>
        </ScPanel>

        <ScPanel type="shadow" title="阴影面板" class="example-item">
          <div class="panel-content">
            <p>带阴影和悬停效果的面板</p>
          </div>
        </ScPanel>
      </div>

      <h4>高级面板类型</h4>
      <div class="example-row">
        <ScPanel type="glassmorphism" title="玻璃态面板" theme="primary" class="example-item">
          <div class="panel-content">
            <p>玻璃态效果，适合有背景图的界面</p>
          </div>
        </ScPanel>

        <ScPanel type="frosted" title="磨砂面板" theme="success" class="example-item">
          <div class="panel-content">
            <p>磨砂玻璃效果，透明度更高</p>
          </div>
        </ScPanel>

        <ScPanel type="stacked" title="堆叠面板" theme="warning" class="example-item">
          <div class="panel-content">
            <p>多层堆叠效果，悬停时有动画</p>
          </div>
        </ScPanel>

        <ScPanel type="floating" title="悬浮面板" theme="danger" class="example-item">
          <div class="panel-content">
            <p>悬浮效果，鼠标悬停时会上浮</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-row">
        <ScPanel type="neumorphism" title="新拟态面板" class="example-item">
          <div class="panel-content">
            <p>新拟态设计风格面板</p>
          </div>
        </ScPanel>

        <ScPanel type="animated-gradient" title="渐变动画面板" class="example-item">
          <div class="panel-content">
            <p>带有动态渐变背景的面板</p>
          </div>
        </ScPanel>

        <ScPanel type="3d" title="3D效果面板" class="example-item">
          <div class="panel-content">
            <p>具有3D视觉效果的面板</p>
          </div>
        </ScPanel>

        <ScPanel type="dashboard" title="仪表盘面板" class="example-item">
          <div class="panel-content">
            <p>仪表盘风格面板，带刷新和全屏功能</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;!-- 基础面板类型 --&gt;
&lt;ScPanel type="default" title="默认面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="card" title="卡片面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="border" title="边框面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="shadow" title="阴影面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;!-- 高级面板类型 --&gt;
&lt;ScPanel type="glassmorphism" title="玻璃态面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="frosted" title="磨砂面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="stacked" title="堆叠面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="floating" title="悬浮面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="neumorphism" title="新拟态面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="animated-gradient" title="渐变动画面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="3d" title="3D效果面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="dashboard" title="仪表盘面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">主题颜色</el-divider>
    <div class="example-section">
      <p class="section-description">所有面板类型都支持不同的主题颜色：default、primary、success、warning、danger和info。</p>
      <div class="example-row">
        <ScPanel type="border" title="默认主题" theme="default" class="example-item">
          <div class="panel-content">
            <p>默认主题</p>
          </div>
        </ScPanel>

        <ScPanel type="border" title="主要主题" theme="primary" class="example-item">
          <div class="panel-content">
            <p>主要主题</p>
          </div>
        </ScPanel>

        <ScPanel type="border" title="成功主题" theme="success" class="example-item">
          <div class="panel-content">
            <p>成功主题</p>
          </div>
        </ScPanel>

        <ScPanel type="border" title="警告主题" theme="warning" class="example-item">
          <div class="panel-content">
            <p>警告主题</p>
          </div>
        </ScPanel>

        <ScPanel type="border" title="危险主题" theme="danger" class="example-item">
          <div class="panel-content">
            <p>危险主题</p>
          </div>
        </ScPanel>

        <ScPanel type="border" title="信息主题" theme="info" class="example-item">
          <div class="panel-content">
            <p>信息主题</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel type="border" title="标题" theme="primary"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">可折叠面板</el-divider>
    <div class="example-section">
      <p class="section-description">通过设置collapsible属性可以让面板支持折叠/展开功能，collapsed控制面板的默认折叠状态。</p>
      <div class="example-row">
        <ScPanel title="可折叠面板" collapsible class="example-item">
          <div class="panel-content">
            <p>点击标题可以折叠/展开面板内容</p>
          </div>
        </ScPanel>

        <ScPanel title="默认折叠" collapsible collapsed class="example-item">
          <div class="panel-content">
            <p>这个面板默认是折叠的</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel title="可折叠面板" collapsible&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel title="默认折叠" collapsible collapsed&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">尺寸大小</el-divider>
    <div class="example-section">
      <p class="section-description">面板组件支持三种尺寸：small、default和large。</p>
      <div class="example-row">
        <ScPanel title="小型面板" size="small" class="example-item">
          <div class="panel-content">
            <p>小型面板（small）</p>
          </div>
        </ScPanel>

        <ScPanel title="默认面板" class="example-item">
          <div class="panel-content">
            <p>默认面板（default）</p>
          </div>
        </ScPanel>

        <ScPanel title="大型面板" size="large" class="example-item">
          <div class="panel-content">
            <p>大型面板（large）</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel title="小型面板" size="small"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel title="默认面板"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel title="大型面板" size="large"&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">自定义插槽</el-divider>
    <div class="example-section">
      <p class="section-description">ScPanel提供了多个插槽，方便自定义面板的各个部分。</p>
      <div class="example-row">
        <ScPanel title="自定义头部" class="example-item">
          <template #header-extra>
            <el-button type="primary" size="small">操作按钮</el-button>
          </template>
          <div class="panel-content">
            <p>使用 header-extra 插槽在头部添加额外内容</p>
          </div>
        </ScPanel>

        <ScPanel title="自定义底部" class="example-item" showFooter>
          <div class="panel-content">
            <p>使用 footer 和 footer-extra 插槽自定义底部内容</p>
          </div>
          <template #footer>
            <span>底部内容</span>
          </template>
          <template #footer-extra>
            <el-button type="text" size="small">查看更多</el-button>
          </template>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel title="自定义头部"&gt;
  &lt;template #header-extra&gt;
    &lt;el-button type="primary" size="small"&gt;操作按钮&lt;/el-button&gt;
  &lt;/template&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel title="自定义底部" showFooter&gt;
  &lt;div&gt;内容&lt;/div&gt;
  &lt;template #footer&gt;
    &lt;span&gt;底部内容&lt;/span&gt;
  &lt;/template&gt;
  &lt;template #footer-extra&gt;
    &lt;el-button type="text" size="small"&gt;查看更多&lt;/el-button&gt;
  &lt;/template&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">加载状态</el-divider>
    <div class="example-section">
      <p class="section-description">通过设置loading属性可以显示面板的加载状态。</p>
      <div class="example-row">
        <ScPanel title="加载中" loading class="example-item">
          <div class="panel-content">
            <p>这个内容在加载状态下不会显示</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel title="加载中" loading&gt;
  &lt;div&gt;内容&lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">分组面板</el-divider>
    <div class="example-section">
      <p class="section-description">可以将多个面板组合在一起，形成分组面板。</p>
      <div class="example-row" style="display: block">
        <div class="panel-group">
          <ScPanel title="面板分组 - 面板1" type="card" theme="primary" class="group-panel">
            <div class="panel-content">
              <p>这是分组中的第一个面板</p>
            </div>
          </ScPanel>
          <ScPanel title="面板分组 - 面板2" type="card" theme="primary" class="group-panel">
            <div class="panel-content">
              <p>这是分组中的第二个面板</p>
            </div>
          </ScPanel>
          <ScPanel title="面板分组 - 面板3" type="card" theme="primary" class="group-panel">
            <div class="panel-content">
              <p>这是分组中的第三个面板</p>
            </div>
          </ScPanel>
        </div>
      </div>

      <div class="example-code">
        <pre><code>&lt;div class="panel-group"&gt;
  &lt;ScPanel title="面板分组 - 面板1" type="card" theme="primary" class="group-panel"&gt;
    &lt;div&gt;内容1&lt;/div&gt;
  &lt;/ScPanel&gt;
  &lt;ScPanel title="面板分组 - 面板2" type="card" theme="primary" class="group-panel"&gt;
    &lt;div&gt;内容2&lt;/div&gt;
  &lt;/ScPanel&gt;
  &lt;ScPanel title="面板分组 - 面板3" type="card" theme="primary" class="group-panel"&gt;
    &lt;div&gt;内容3&lt;/div&gt;
  &lt;/ScPanel&gt;
&lt;/div&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">带状态的面板</el-divider>
    <div class="example-section">
      <p class="section-description">可以在面板中添加状态指示，如信息卡片或统计数据。</p>
      <div class="example-row">
        <ScPanel title="用户统计" type="shadow" class="example-item">
          <div class="status-panel">
            <div class="status-icon">
              <el-icon><IconifyIconOnline icon="ep:user" /></el-icon>
            </div>
            <div class="status-content">
              <div class="status-value">4,356</div>
              <div class="status-label">活跃用户</div>
            </div>
            <div class="status-footer">
              <el-tag type="success" size="small">
                <el-icon><IconifyIconOnline icon="ep:arrow-up" /></el-icon>
                13% 增长
              </el-tag>
            </div>
          </div>
        </ScPanel>

        <ScPanel title="收入统计" type="shadow" class="example-item">
          <div class="status-panel">
            <div class="status-icon" style="background-color: #e6f7ff">
              <el-icon><IconifyIconOnline icon="ep:money" /></el-icon>
            </div>
            <div class="status-content">
              <div class="status-value">￥23,589</div>
              <div class="status-label">月收入</div>
            </div>
            <div class="status-footer">
              <el-tag type="danger" size="small">
                <el-icon><IconifyIconOnline icon="ep:arrow-down" /></el-icon>
                2% 下降
              </el-tag>
            </div>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel title="用户统计" type="shadow"&gt;
  &lt;div class="status-panel"&gt;
    &lt;div class="status-icon"&gt;
      &lt;el-icon&gt;&lt;User /&gt;&lt;/el-icon&gt;
    &lt;/div&gt;
    &lt;div class="status-content"&gt;
      &lt;div class="status-value"&gt;4,356&lt;/div&gt;
      &lt;div class="status-label"&gt;活跃用户&lt;/div&gt;
    &lt;/div&gt;
    &lt;div class="status-footer"&gt;
      &lt;el-tag type="success" size="small"&gt;13% 增长&lt;/el-tag&gt;
    &lt;/div&gt;
  &lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">引用面板</el-divider>
    <div class="example-section">
      <p class="section-description">可以使用边框面板创建引用式的内容展示。</p>
      <div class="example-row">
        <ScPanel type="border" headerPosition="left" theme="primary" class="example-item quote-panel">
          <div class="panel-content">
            <p class="quote-content">设计是一种思考方式，不仅仅是表面的装饰。好的设计能够简化复杂的问题，提升用户体验。</p>
            <p class="quote-author">— 乔布斯</p>
          </div>
        </ScPanel>

        <ScPanel type="border" headerPosition="top" theme="warning" class="example-item quote-panel">
          <div class="panel-content">
            <p class="quote-content">简单比复杂更难，你必须努力让你的想法变得清晰明了，才能使其变得简单。</p>
            <p class="quote-author">— 乔纳森·伊夫</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel type="border" headerPosition="left" theme="primary" class="quote-panel"&gt;
  &lt;div class="panel-content"&gt;
    &lt;p class="quote-content"&gt;设计是一种思考方式，不仅仅是表面的装饰。&lt;/p&gt;
    &lt;p class="quote-author"&gt;— 乔布斯&lt;/p&gt;
  &lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">简约面板</el-divider>
    <div class="example-section">
      <p class="section-description">简约风格的面板，适合展示简单内容。</p>
      <div class="example-row">
        <ScPanel type="card" class="example-item minimal-panel">
          <template #header>
            <div class="minimal-header">
              <IconifyIconOnline icon="ep:bell" class="minimal-icon" />
              <span>通知提醒</span>
            </div>
          </template>
          <div class="panel-content">
            <ul class="minimal-list">
              <li>系统将于今晚22:00进行维护更新</li>
              <li>您有3条未读消息</li>
              <li>新版本已发布，请及时更新</li>
            </ul>
          </div>
        </ScPanel>

        <ScPanel type="card" class="example-item minimal-panel">
          <template #header>
            <div class="minimal-header">
              <IconifyIconOnline icon="ep:calendar" class="minimal-icon" />
              <span>近期活动</span>
            </div>
          </template>
          <div class="panel-content">
            <ul class="minimal-list">
              <li>6月1日 产品发布会</li>
              <li>6月15日 技术分享会</li>
              <li>6月30日 团队建设活动</li>
            </ul>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel type="card" class="minimal-panel"&gt;
  &lt;template #header&gt;
    &lt;div class="minimal-header"&gt;
      &lt;el-icon&gt;&lt;Bell /&gt;&lt;/el-icon&gt;
      &lt;span&gt;通知提醒&lt;/span&gt;
    &lt;/div&gt;
  &lt;/template&gt;
  &lt;div class="panel-content"&gt;
    &lt;ul class="minimal-list"&gt;
      &lt;li&gt;系统将于今晚22:00进行维护更新&lt;/li&gt;
      &lt;li&gt;您有3条未读消息&lt;/li&gt;
      &lt;li&gt;新版本已发布，请及时更新&lt;/li&gt;
    &lt;/ul&gt;
  &lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">标签式面板</el-divider>
    <div class="example-section">
      <p class="section-description">标签式面板支持在面板头部显示多个标签页，点击标签可以切换内容。</p>
      <div class="example-row" style="display: block">
        <ScPanel
          type="tab"
          :tabs="[
            { title: '标签一', icon: 'ep:document' },
            { title: '标签二', icon: 'ep:setting' },
            { title: '标签三', icon: 'ep:user' },
          ]"
          :defaultActiveTab="0"
          class="example-item"
          style="margin-bottom: 24px"
          @tab-change="handleTabChange"
        >
          <div v-if="activeTabIndex === 0" class="panel-content">
            <p>这是标签一的内容</p>
            <p>标签式面板允许你在一个面板中展示多个分组的内容</p>
          </div>
          <div v-else-if="activeTabIndex === 1" class="panel-content">
            <p>这是标签二的内容</p>
            <p>你可以通过点击不同的标签来切换内容</p>
          </div>
          <div v-else-if="activeTabIndex === 2" class="panel-content">
            <p>这是标签三的内容</p>
            <p>标签式面板特别适合展示分类信息</p>
          </div>
        </ScPanel>

        <ScPanel
          type="tab"
          :tabs="[
            { title: '今日', icon: 'ep:calendar' },
            { title: '本周', icon: 'ep:calendar' },
            { title: '本月', icon: 'ep:calendar' },
          ]"
          theme="primary"
          shadow
          :defaultActiveTab="1"
          class="example-item"
        >
          <div class="panel-content">
            <p>标签面板还支持设置主题颜色和阴影效果</p>
            <p>可以用来展示时间段或类别的数据</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel 
  type="tab" 
  :tabs="[
    { title: '标签一', icon: 'ep:document' },
    { title: '标签二', icon: 'ep:setting' },
    { title: '标签三', icon: 'ep:user' }
  ]"
  :defaultActiveTab="0"
  @tab-change="handleTabChange"
&gt;
  &lt;div v-if="activeTabIndex === 0"&gt;
    这是标签一的内容
  &lt;/div&gt;
  &lt;div v-else-if="activeTabIndex === 1"&gt;
    这是标签二的内容
  &lt;/div&gt;
  &lt;div v-else-if="activeTabIndex === 2"&gt;
    这是标签三的内容
  &lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">步骤式面板</el-divider>
    <div class="example-section">
      <p class="section-description">步骤式面板可以显示分步操作的流程，适合向导、表单分步提交等场景。</p>
      <div class="example-row" style="display: block">
        <ScPanel
          type="steps"
          title="分步操作指引"
          :steps="[
            { title: '步骤一', description: '基本信息' },
            { title: '步骤二', description: '详细配置' },
            { title: '步骤三', description: '完成确认' },
          ]"
          :activeStep="currentStep"
          theme="primary"
          class="example-item"
          style="margin-bottom: 24px"
          @step-change="handleStepChange"
          @finish="handleStepsFinish"
        >
          <div v-if="currentStep === 0" class="panel-content">
            <h3>步骤一：填写基本信息</h3>
            <p>在这一步，您需要填写基本的信息，如姓名、联系方式等。</p>
            <p>点击"下一步"按钮继续。</p>
          </div>
          <div v-else-if="currentStep === 1" class="panel-content">
            <h3>步骤二：设置详细配置</h3>
            <p>在这一步，您需要设置一些详细的配置项。</p>
            <p>完成后点击"下一步"按钮继续，或点击"上一步"返回修改基本信息。</p>
          </div>
          <div v-else-if="currentStep === 2" class="panel-content">
            <h3>步骤三：确认提交</h3>
            <p>请确认您填写的所有信息无误，然后点击"完成"按钮提交。</p>
            <p>如需修改，可以点击"上一步"返回。</p>
          </div>
        </ScPanel>

        <ScPanel
          type="steps"
          title="简洁风格步骤"
          :steps="[
            { title: '已完成', icon: 'ep:check' },
            { title: '进行中', icon: 'ep:loading' },
            { title: '待处理', icon: 'ep:waiting' },
          ]"
          :activeStep="1"
          simpleSteps
          stepsAlignCenter
          theme="success"
          class="example-item"
        >
          <div class="panel-content">
            <p>步骤面板还支持简洁风格的步骤条和不同的主题颜色</p>
            <p>可以使用图标来增强视觉效果</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;ScPanel 
  type="steps" 
  title="分步操作指引"
  :steps="[
    { title: '步骤一', description: '基本信息' },
    { title: '步骤二', description: '详细配置' },
    { title: '步骤三', description: '完成确认' }
  ]"
  :activeStep="currentStep"
  theme="primary"
  @step-change="handleStepChange"
  @finish="handleStepsFinish"
&gt;
  &lt;div v-if="currentStep === 0"&gt;
    &lt;!-- 步骤一的内容 --&gt;
  &lt;/div&gt;
  &lt;div v-else-if="currentStep === 1"&gt;
    &lt;!-- 步骤二的内容 --&gt;
  &lt;/div&gt;
  &lt;div v-else-if="currentStep === 2"&gt;
    &lt;!-- 步骤三的内容 --&gt;
  &lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">特殊功能面板</el-divider>
    <div class="example-section">
      <p class="section-description">一些高级面板类型具有特殊功能和交互效果。</p>

      <h4>磨砂和玻璃态效果</h4>
      <div class="example-row" style="position: relative; overflow: hidden">
        <!-- 背景图效果 -->
        <div class="bg-pattern"></div>

        <ScPanel type="glassmorphism" title="玻璃态效果" theme="primary" class="example-item transparent-panel">
          <div class="panel-content">
            <p>玻璃态效果可以让背景模糊透明，适合有背景图的界面。</p>
            <p>这种效果在iOS和macOS风格的界面中常见。</p>
          </div>
        </ScPanel>

        <ScPanel type="frosted" title="磨砂效果" theme="success" class="example-item transparent-panel">
          <div class="panel-content">
            <p>磨砂玻璃效果有更高的透明度，适合轻量级内容。</p>
            <p>背景会呈现更加模糊的效果。</p>
          </div>
        </ScPanel>
      </div>

      <h4>仪表盘面板</h4>
      <div class="example-row" style="display: block">
        <ScPanel type="dashboard" title="数据概览" theme="primary" class="example-item" style="margin-bottom: 20px" @refresh="handleDashboardRefresh" @fullscreen-change="handleFullscreenChange">
          <div class="dashboard-demo">
            <div class="dashboard-card">
              <div class="dashboard-value">{{ dashboardData.users }}</div>
              <div class="dashboard-label">用户数</div>
            </div>
            <div class="dashboard-card">
              <div class="dashboard-value">{{ dashboardData.orders }}</div>
              <div class="dashboard-label">订单数</div>
            </div>
            <div class="dashboard-card">
              <div class="dashboard-value">{{ dashboardData.sales }}万</div>
              <div class="dashboard-label">销售额</div>
            </div>
            <div class="dashboard-card">
              <div class="dashboard-value">{{ dashboardData.visitors }}</div>
              <div class="dashboard-label">访问量</div>
            </div>
          </div>
          <p class="dashboard-tip">点击右上角的刷新按钮可以更新数据，点击全屏按钮可以全屏查看</p>
        </ScPanel>
      </div>

      <h4>交互式面板</h4>
      <div class="example-row">
        <ScPanel type="floating" title="悬浮效果" theme="primary" class="example-item">
          <div class="panel-content">
            <p>鼠标悬停时会有上浮效果和阴影增强</p>
            <p>适合卡片式布局和强调重要内容</p>
          </div>
        </ScPanel>

        <ScPanel type="stacked" title="堆叠效果" theme="warning" class="example-item">
          <div class="panel-content">
            <p>多层堆叠的视觉效果</p>
            <p>悬停时背景层会产生动态效果</p>
          </div>
        </ScPanel>

        <ScPanel type="3d" title="3D效果" theme="danger" class="example-item">
          <div class="panel-content">
            <p>鼠标移动时会产生3D视差效果</p>
            <p>增强用户交互体验</p>
          </div>
        </ScPanel>

        <ScPanel type="neumorphism" title="新拟态效果" class="example-item">
          <div class="panel-content">
            <p>柔和的阴影和浮雕效果</p>
            <p>符合当代设计趋势</p>
          </div>
        </ScPanel>
      </div>

      <div class="example-code">
        <pre><code>&lt;!-- 磨砂和玻璃态效果 --&gt;
&lt;div style="position: relative; overflow: hidden;"&gt;
  &lt;!-- 背景图或花纹 --&gt;
  &lt;div class="bg-pattern"&gt;&lt;/div&gt;
  
  &lt;ScPanel type="glassmorphism" title="玻璃态效果" theme="primary"&gt;
    &lt;div&gt;内容会透出背景&lt;/div&gt;
  &lt;/ScPanel&gt;
  
  &lt;ScPanel type="frosted" title="磨砂效果" theme="success"&gt;
    &lt;div&gt;更高透明度的效果&lt;/div&gt;
  &lt;/ScPanel&gt;
&lt;/div&gt;

&lt;!-- 仪表盘面板 --&gt;
&lt;ScPanel 
  type="dashboard" 
  title="数据概览" 
  theme="primary" 
  @refresh="handleDashboardRefresh"
  @fullscreen-change="handleFullscreenChange"
&gt;
  &lt;div&gt;仪表盘内容&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;!-- 互动效果面板 --&gt;
&lt;ScPanel type="floating" title="悬浮效果" theme="primary"&gt;
  &lt;div&gt;悬停时上浮&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="stacked" title="堆叠效果" theme="warning"&gt;
  &lt;div&gt;多层堆叠效果&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="3d" title="3D效果" theme="danger"&gt;
  &lt;div&gt;3D视差效果&lt;/div&gt;
&lt;/ScPanel&gt;

&lt;ScPanel type="neumorphism" title="新拟态效果"&gt;
  &lt;div&gt;柔和的阴影和浮雕效果&lt;/div&gt;
&lt;/ScPanel&gt;</code></pre>
      </div>
    </div>

    <el-divider content-position="left">API参考</el-divider>
    <div class="example-section">
      <h3>属性</h3>
      <el-table :data="apiProps" border style="width: 100%">
        <el-table-column prop="name" label="属性名" width="180" />
        <el-table-column prop="type" label="类型" width="180" />
        <el-table-column prop="default" label="默认值" width="180" />
        <el-table-column prop="description" label="说明" />
      </el-table>

      <h3 class="mt-20">插槽</h3>
      <el-table :data="apiSlots" border style="width: 100%">
        <el-table-column prop="name" label="插槽名" width="180" />
        <el-table-column prop="description" label="说明" />
      </el-table>

      <h3 class="mt-20">事件</h3>
      <el-table :data="apiEvents" border style="width: 100%">
        <el-table-column prop="name" label="事件名" width="180" />
        <el-table-column prop="description" label="说明" />
        <el-table-column prop="params" label="参数" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import ScPanel from "@repo/components/ScPanel/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { ref } from "vue";

// 标签式面板当前激活的标签
const activeTabIndex = ref(0);

// 步骤式面板当前步骤
const currentStep = ref(0);

// 仪表盘数据
const dashboardData = ref({
  users: 4356,
  orders: 1289,
  sales: 53.6,
  visitors: 12470,
});

// 标签切换事件处理
const handleTabChange = (index) => {
  activeTabIndex.value = index;
};

// 步骤变化事件处理
const handleStepChange = (step) => {
  currentStep.value = step;
};

// 步骤完成事件处理
const handleStepsFinish = () => {
  // 这里可以处理完成后的逻辑
  alert("操作已完成！");
};

// 仪表盘刷新处理
const handleDashboardRefresh = () => {
  // 模拟数据更新
  dashboardData.value = {
    users: Math.floor(Math.random() * 1000) + 4000,
    orders: Math.floor(Math.random() * 500) + 1000,
    sales: (Math.random() * 20 + 40).toFixed(1),
    visitors: Math.floor(Math.random() * 3000) + 10000,
  };
};

// 仪表盘全屏变化处理
const handleFullscreenChange = (isFullscreen) => {
  console.log("全屏状态变更:", isFullscreen);
};

// API文档数据
const apiProps = [
  { name: "type", type: "string", default: "default", description: "面板类型，可选值：default, card, border, shadow, tab, steps, glassmorphism, frosted, animated-gradient, stacked, floating, neumorphism, 3d, dashboard" },
  { name: "title", type: "string", default: "", description: "面板标题" },
  { name: "theme", type: "string", default: "default", description: "主题颜色，可选值：default, primary, success, warning, danger, info" },
  { name: "size", type: "string", default: "default", description: "尺寸，可选值：small, default, large" },
  { name: "showHeader", type: "boolean", default: "true", description: "是否显示头部" },
  { name: "showFooter", type: "boolean", default: "false", description: "是否显示底部" },
  { name: "collapsible", type: "boolean", default: "false", description: "是否可折叠" },
  { name: "collapsed", type: "boolean", default: "false", description: "是否默认折叠" },
  { name: "loading", type: "boolean", default: "false", description: "是否显示加载状态" },
  { name: "className", type: "string", default: "", description: "自定义类名" },
  { name: "headerPosition", type: "string", default: "left", description: "边框面板的边框位置，可选值：left, top, right, bottom" },
  { name: "tabs", type: "Array", default: "[]", description: "标签式面板的标签列表，每个标签对象包含title和可选的icon" },
  { name: "defaultActiveTab", type: "number", default: "0", description: "标签式面板默认激活的标签索引" },
  { name: "steps", type: "Array", default: "[]", description: "步骤式面板的步骤列表，每个步骤对象包含title、可选的description和icon" },
  { name: "activeStep", type: "number", default: "0", description: "步骤式面板当前激活的步骤索引" },
  { name: "stepsAlignCenter", type: "boolean", default: "false", description: "步骤式面板的步骤是否居中对齐" },
  { name: "stepsDirection", type: "string", default: "horizontal", description: "步骤式面板的步骤方向，可选值：horizontal, vertical" },
  { name: "simpleSteps", type: "boolean", default: "false", description: "步骤式面板是否使用简洁风格的步骤条" },
  { name: "showStepButtons", type: "boolean", default: "true", description: "步骤式面板是否显示步骤按钮（上一步、下一步等）" },
];

const apiSlots = [
  { name: "default", description: "面板内容" },
  { name: "header", description: "自定义头部内容（会覆盖title属性）" },
  { name: "header-extra", description: "头部右侧额外内容" },
  { name: "footer", description: "底部内容（需设置showFooter为true）" },
  { name: "footer-extra", description: "底部右侧额外内容（需设置showFooter为true）" },
];

const apiEvents = [
  { name: "collapse", description: "面板折叠时触发", params: "无" },
  { name: "expand", description: "面板展开时触发", params: "无" },
  { name: "tab-change", description: "标签式面板标签切换时触发", params: "(index: number) - 当前激活的标签索引" },
  { name: "step-change", description: "步骤式面板步骤变化时触发", params: "(step: number) - 当前步骤索引" },
  { name: "finish", description: "步骤式面板完成按钮点击时触发", params: "无" },
];
</script>

<style scoped>
.sc-panel-example {
  padding: 20px;
}

.example-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 16px;
}

.example-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
}

.example-section {
  margin-bottom: 36px;
}

.section-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
}

.example-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.example-item {
  min-height: 120px;
}

.panel-content {
  padding: 10px 0;
}

.panel-content p {
  margin: 8px 0;
  line-height: 1.5;
}

.example-code {
  margin-top: 16px;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.example-code pre {
  margin: 0;
  white-space: pre-wrap;
}

.example-code code {
  font-family: "Courier New", Courier, monospace;
  color: #476582;
}

.mt-20 {
  margin-top: 20px;
}

.panel-group {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border-radius: 4px;
  overflow: hidden;
}

.group-panel {
  margin-bottom: 0 !important;
  border-radius: 0 !important;
}

.group-panel:first-child {
  border-top-left-radius: 4px !important;
  border-top-right-radius: 4px !important;
}

.group-panel:last-child {
  border-bottom-left-radius: 4px !important;
  border-bottom-right-radius: 4px !important;
}

.status-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.status-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f0f9eb;
  margin-bottom: 16px;
  font-size: 24px;
  color: var(--el-color-primary);
}

.status-content {
  text-align: center;
  margin-bottom: 16px;
}

.status-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
}

.status-label {
  font-size: 14px;
  color: #666;
}

.status-footer {
  text-align: center;
}

.quote-panel .panel-content {
  padding: 20px;
}

.quote-content {
  font-size: 16px;
  font-style: italic;
  line-height: 1.6;
  margin-bottom: 12px;
}

.quote-author {
  font-size: 14px;
  text-align: right;
  color: #888;
}

.minimal-panel {
  border: none !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.minimal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: normal;
}

.minimal-icon {
  font-size: 18px;
  color: var(--el-color-primary);
}

.minimal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.minimal-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.minimal-list li:last-child {
  border-bottom: none;
}

/* 玻璃态和磨砂效果背景 */
.bg-pattern {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(45deg, #4527a0, #00acc1, #43a047);
  background-size: 600% 600%;
  opacity: 0.15;
  z-index: -1;
  animation: gradientBG 20s ease infinite;
}

.transparent-panel {
  background-color: transparent !important;
  min-height: 200px;
}

/* 仪表盘演示 */
.dashboard-demo {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
  padding: 10px 0;
}

.dashboard-card {
  background-color: rgba(var(--el-color-primary-rgb), 0.05);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}

.dashboard-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 4px;
  color: var(--el-color-primary);
}

.dashboard-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.dashboard-tip {
  margin-top: 12px;
  font-size: 12px;
  color: #999;
  text-align: center;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
