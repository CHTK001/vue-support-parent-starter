<template>
  <!--
    图像库（全页）

    版式取自定稿稿 test/ai-image/ui-redesign/final：
      · 台账（按分组分段的表格）与画布（单图舞台）是同一屏的两个视图；
      · 特征空间是独立 tab，深色舞台；
      · 左栏分组 + 特征状态筛选，右栏检查器。

    数据全部来自真实接口 /image-search/*。定稿稿里没有后端来源的字段
    （SKU、来源批次、置信度、处理失败、近邻同款）一律不渲染，也不摆假按钮：
    没有接口的能力就明说，而不是给一个点了没反应的控件。

    ★ 两个入口一份实现：独立路由 /image-library 与「设置 → 图像库」共用本组件，
      embedded=true 时交出标题栏，只保留一条操作条。
  -->
  <div
    class="il"
    :class="{ 'il--embedded': embedded, 'il--drag': dragging }"
    data-page="image-library"
    @dragover.prevent="canUpload && (dragging = true)"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <PageHeader v-if="!embedded" title="图像库">
      <template #actions>
        <div class="il-tools">
          <button type="button" class="il-btn" :disabled="loading" @click="refresh">
            <ArrowSync24Regular class="il-ico" /><span>刷新</span>
          </button>
          <button type="button" class="il-btn" :disabled="!visibleItems.length" @click="exportCsv">
            <ArrowDownload24Regular class="il-ico" /><span>导出 CSV</span>
          </button>
          <button type="button" class="il-btn il-btn--primary" :disabled="!canUpload" @click="pickFiles">
            <ArrowUpload24Regular class="il-ico" /><span>上传图片</span>
          </button>
        </div>
      </template>
    </PageHeader>

    <div v-else class="il-toolrow">
      <span class="il-toolrow__sub">
        当前分组 <b>{{ groupLabel }}</b>
        <template v-if="modelName"> · <code>{{ modelName }}</code></template>
        <template v-if="statusLoaded && !modelConfig.imageReady"> · 未配置特征模型</template>
      </span>
      <div class="il-tools">
        <button type="button" class="il-btn il-btn--sm" :disabled="loading" @click="refresh">
          <ArrowSync24Regular class="il-ico" /><span>刷新</span>
        </button>
        <button type="button" class="il-btn il-btn--sm" :disabled="!visibleItems.length" @click="exportCsv">
          <ArrowDownload24Regular class="il-ico" /><span>导出 CSV</span>
        </button>
        <button type="button" class="il-btn il-btn--sm il-btn--primary" :disabled="!canUpload" @click="pickFiles">
          <ArrowUpload24Regular class="il-ico" /><span>上传图片</span>
        </button>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/png,image/jpeg" multiple class="il-hidden" @change="onPicked" />

    <div v-if="dragging" class="il-dropmask">
      <CloudArrowUp24Regular class="il-dropmask__ico" />
      <b>释放以上传到「{{ groupLabel }}」</b>
      <span>PNG / JPG · 单张不超过 20MB · 短边不小于 128px</span>
    </div>

    <!-- 没有特征模型时整页只留一条能走通的引导：此时上传必然失败、检索必然为空 -->
    <section v-if="blockedReason" class="il-blocked">
      <Alert24Regular class="il-blocked__ico" />
      <h2 class="il-blocked__title">{{ blockedReason.title }}</h2>
      <p class="il-blocked__desc">{{ blockedReason.desc }}</p>
      <p class="il-blocked__current">
        当前配置的图像特征模型：<strong>{{ modelName || '（未配置）' }}</strong>
      </p>
      <button type="button" class="il-btn il-btn--primary" @click="goModelConfig">
        <Settings24Regular class="il-ico" /><span>去配置模型</span>
      </button>
    </section>

    <template v-else>
      <div class="il-tabs">
        <button type="button" class="il-tab" :class="{ 'is-on': tab === 'library' }" @click="tab = 'library'">
          <List24Regular class="il-ico" />图像库
          <span class="il-tab__n">{{ formatNumber(total) }}</span>
        </button>
        <button type="button" class="il-tab" :class="{ 'is-on': tab === 'space' }" @click="tab = 'space'">
          <Layer24Regular class="il-ico" />特征空间
          <span class="il-tab__n">{{ spaceClusters.length }} 簇</span>
        </button>
        <div class="il-tabs__right">
          <span class="il-state" :class="coverage >= 90 ? 'is-ok' : coverage > 0 ? 'is-warn' : ''">
            <i class="il-dot" />特征覆盖率 {{ coverage }}%（当前页）
          </span>
          <span class="il-tag il-tag--line il-mono">cosine · {{ dimension || '—' }} 维</span>
        </div>
      </div>

      <div v-if="uploading" class="il-uploadbar">
        <div class="il-uploadbar__track"><i :style="{ width: progress + '%' }" /></div>
        <span class="il-mono">{{ progress }}%</span>
        <span class="il-uploadbar__text">{{ progressText }}</span>
      </div>

      <!-- ══════════════ 图像库：台账 / 画布 ══════════════ -->
      <div v-if="tab === 'library'" class="il-panel">
        <aside class="il-groups">
          <div class="il-eyebrow">分组</div>
          <button
            v-for="g in groupOptions"
            :key="g"
            type="button"
            class="il-grp"
            :class="{ 'is-on': g === group }"
            :title="g === 'default' ? '后端默认分组；历史数据也归在这里' : g"
            @click="selectGroup(g)"
          >
            <Folder24Regular class="il-ico" />
            <span class="il-grp__name">{{ groupLabelOf(g) }}</span>
            <span v-if="g === group" class="il-grp__n">{{ formatNumber(total) }}</span>
          </button>
          <button type="button" class="il-grp-new" @click="createGroup">
            <Add24Regular class="il-ico" />新建分组
          </button>

          <div class="il-groups__filters">
            <div class="il-eyebrow">按特征状态</div>
            <button
              v-for="f in statusFilters"
              :key="f.key"
              type="button"
              class="il-grp-filter"
              :class="{ 'is-on': statusFilter === f.key }"
              :title="f.title"
              @click="setStatusFilter(f.key)"
            >
              <i v-if="f.dot" class="il-dot" :class="f.dot" />
              <span>{{ f.label }}</span>
              <span class="il-grp__n">{{ f.count }}</span>
            </button>
          </div>

          <div class="il-groups__foot">
            <div class="il-meter-row">
              <span>当前页特征覆盖率</span>
              <b class="il-mono">{{ coverage }}%</b>
            </div>
            <div class="il-meter"><i :style="{ width: coverage + '%' }" /></div>
            <div class="il-meter-row">
              <span>仅缩略图 / 重复</span>
              <b class="il-mono">{{ thumbOnlyCount }} / {{ duplicateCount }}</b>
            </div>
            <div class="il-note">状态计数按当前页统计，翻页后重新计算</div>
          </div>
        </aside>

        <section class="il-stage">
          <div class="il-viewbar">
            <div class="il-seg">
              <button type="button" :class="{ 'is-on': view === 'table' }" @click="view = 'table'">
                <List24Regular class="il-ico" />台账
              </button>
              <button type="button" :class="{ 'is-on': view === 'canvas' }" @click="view = 'canvas'">
                <Image24Regular class="il-ico" />画布
              </button>
            </div>

            <label class="il-search" title="按名称与关键词检索（回车生效）">
              <Search24Regular class="il-ico" />
              <input
                v-model="keyword"
                type="search"
                class="il-search__input"
                placeholder="搜索名称 / 关键词"
                @keyup.enter="applyKeyword"
              />
              <button
                v-if="keyword"
                type="button"
                class="il-search__clear"
                title="清空检索"
                @click="clearKeyword"
              >
                <Dismiss24Regular class="il-ico" />
              </button>
            </label>

            <div class="il-viewbar__right">
              <span v-if="view === 'table'" class="il-mono">共 {{ formatNumber(total) }} 条</span>
              <span v-else class="il-mono">第 {{ activeIndex + 1 }} / {{ visibleItems.length }} 张</span>
              <span>{{ view === 'table' ? '入库时间倒序' : '当前页内翻页' }}</span>
            </div>
          </div>

          <!-- 台账 -->
          <div v-if="view === 'table'" class="il-tablearea">
            <div class="il-tblwrap">
              <table class="il-tbl">
                <thead>
                  <tr>
                    <th class="il-tbl__ck">
                      <span
                        class="il-ck"
                        :class="{ 'is-on': allSelected, 'is-partial': selected.size > 0 && !allSelected }"
                        role="checkbox"
                        :aria-checked="allSelected"
                        title="全选当前页"
                        @click="toggleSelectAll"
                      />
                    </th>
                    <th>文件</th>
                    <th>关键词</th>
                    <th>特征状态</th>
                    <th>分辨率</th>
                    <th>大小</th>
                    <th>入库时间</th>
                    <th class="il-tbl__acts">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="il-grp-row">
                    <td colspan="8">
                      <Folder24Regular class="il-ico" />
                      {{ groupLabel }}
                      <span class="il-grp-row__n">{{ visibleItems.length }} / {{ formatNumber(total) }} 张</span>
                      <span class="il-grp-row__r">
                        {{ thumbOnlyCount ? `${thumbOnlyCount} 张缺特征 · 不参与以图搜图` : '当前页均参与以图搜图' }}
                      </span>
                    </td>
                  </tr>

                  <template v-if="loading">
                    <tr v-for="n in 6" :key="'sk' + n" class="il-row is-skel">
                      <td colspan="8"><span class="il-skel" /></td>
                    </tr>
                  </template>

                  <template v-else>
                  <tr
                    v-for="item in visibleItems"
                    :key="item.id"
                    class="il-row"
                    :class="{ 'is-on': activeItem && activeItem.id === item.id }"
                    @click="activeId = item.id"
                  >
                    <td>
                      <span
                        class="il-ck"
                        :class="{ 'is-on': selected.has(item.id) }"
                        role="checkbox"
                        :aria-checked="selected.has(item.id)"
                        :title="selected.has(item.id) ? '取消勾选' : '勾选以批量删除'"
                        @click.stop="toggleSelect(item)"
                      />
                    </td>
                    <td>
                      <div class="il-file">
                        <img class="il-file__ph" :src="resolveUrl(item)" :alt="item.name || ''" loading="lazy" />
                        <div class="il-file__tx">
                          <b :title="item.name || ''">{{ item.name || '未命名' }}</b>
                          <span>{{ fileFormat(item) }} · {{ resolutionOf(item) }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span v-if="item.tags && item.tags.length" class="il-tags">
                        <span v-for="t in item.tags.slice(0, 2)" :key="t" class="il-tag" :title="t">{{ t }}</span>
                        <span v-if="item.tags.length > 2" class="il-tag">+{{ item.tags.length - 2 }}</span>
                      </span>
                      <span v-else class="il-dim">—</span>
                    </td>
                    <td>
                      <span class="il-tags">
                        <span v-if="isDuplicate(item)" class="il-tag il-tag--err">重复</span>
                        <span v-if="item.hasOriginal" class="il-tag il-tag--ok">特征已入库</span>
                        <span v-else class="il-tag il-tag--warn">仅缩略图</span>
                      </span>
                    </td>
                    <td class="il-mono il-dim">{{ resolutionOf(item) }}</td>
                    <td class="il-mono il-dim">{{ item.size ? formatSize(item.size) : '—' }}</td>
                    <td class="il-mono il-dim">{{ formatDateTime(item.createdAt) }}</td>
                    <td>
                      <div class="il-rowact">
                        <button type="button" class="il-iconbtn" title="查看大图" @click.stop="preview(item)">
                          <Eye24Regular class="il-ico" />
                        </button>
                        <button type="button" class="il-iconbtn" title="以此图搜同款" @click.stop="goSearchSimilar(item)">
                          <Search24Regular class="il-ico" />
                        </button>
                        <button
                          type="button"
                          class="il-iconbtn is-danger"
                          title="删除"
                          :disabled="busy"
                          @click.stop="removeOne(item)"
                        >
                          <Delete24Regular class="il-ico" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  </template>
                </tbody>
              </table>

              <div v-if="!loading && !visibleItems.length" class="il-empty">
                <ImageMultiple24Regular class="il-empty__ico" />
                <b>{{ items.length ? '没有符合筛选条件的图片' : '当前分组还没有图片' }}</b>
                <span>{{ items.length ? '换一个特征状态，或清空检索词。' : '上传后自动提取特征，随后就能以图搜同款。' }}</span>
                <button v-if="!items.length && canUpload" type="button" class="il-btn il-btn--primary" @click="pickFiles">
                  <ArrowUpload24Regular class="il-ico" /><span>上传图片</span>
                </button>
                <button v-else-if="items.length" type="button" class="il-btn" @click="resetFilters">
                  清空筛选
                </button>
              </div>
            </div>
          </div>

          <!-- 画布 -->
          <div v-else class="il-canvas">
            <template v-if="activeItem">
              <div class="il-canvas__bar">
                <span class="il-tag il-tag--line il-mono">
                  IMG {{ String(activeIndex + 1).padStart(4, '0') }} / {{ visibleItems.length }}
                </span>
                <b :title="activeItem.name || ''">{{ activeItem.name || '未命名' }}</b>
                <span v-if="isDuplicate(activeItem)" class="il-tag il-tag--err">重复文件</span>
                <span v-if="activeItem.hasOriginal" class="il-tag il-tag--ok">特征已入库</span>
                <span v-else class="il-tag il-tag--warn">仅缩略图</span>
                <div class="il-canvas__bar-right">
                  <button type="button" class="il-iconbtn" title="上一张（←）" :disabled="activeIndex <= 0" @click="step(-1)">
                    <ChevronRight24Regular class="il-ico is-flip" />
                  </button>
                  <button
                    type="button"
                    class="il-iconbtn"
                    title="下一张（→）"
                    :disabled="activeIndex >= visibleItems.length - 1"
                    @click="step(1)"
                  >
                    <ChevronRight24Regular class="il-ico" />
                  </button>
                </div>
              </div>

              <div class="il-canvas__frame" @dblclick="preview(activeItem)">
                <img class="il-canvas__img" :src="resolveUrl(activeItem)" :alt="activeItem.name || ''" />
                <div class="il-canvas__corner">
                  <span class="il-tag il-tag--onphoto">{{ activeItem.tags && activeItem.tags[0] ? activeItem.tags[0] : '无关键词' }}</span>
                  <span class="il-tag il-tag--onphoto">{{ groupLabel }}</span>
                </div>
                <div class="il-canvas__foot">
                  <div>
                    <b>{{ activeItem.name || '未命名' }}</b><br />
                    <span>{{ resolutionOf(activeItem) }} · {{ activeItem.size ? formatSize(activeItem.size) : '体积未知' }} · {{ fileFormat(activeItem) }}</span>
                  </div>
                  <div class="il-canvas__foot-right">
                    <span class="il-tag">双击查看原图</span>
                    <span class="il-tag">← → 切换</span>
                  </div>
                </div>
              </div>

              <div class="il-canvas__meta">
                <div class="il-cell">
                  <span>特征状态</span>
                  <b :class="activeItem.hasOriginal ? 'is-ok' : 'is-warn'">
                    {{ activeItem.hasOriginal ? `已入库 · ${dimension || '—'} 维` : '仅缩略图 · 未留存原图' }}
                  </b>
                </div>
                <div class="il-cell">
                  <span>关键词</span>
                  <b :title="(activeItem.tags || []).join(' / ')">
                    {{ activeItem.tags && activeItem.tags.length ? activeItem.tags.join(' / ') : '—' }}
                  </b>
                </div>
                <div class="il-cell">
                  <span>分组</span>
                  <b>{{ groupLabel }}</b>
                </div>
                <div class="il-cell">
                  <span>入库时间</span>
                  <b class="il-mono">{{ formatDateTime(activeItem.createdAt) }}</b>
                </div>
                <div class="il-cell">
                  <span>分辨率</span>
                  <b class="il-mono">{{ resolutionOf(activeItem) }}</b>
                </div>
                <div class="il-cell">
                  <span>大小 / 格式</span>
                  <b class="il-mono">
                    {{ activeItem.size ? formatSize(activeItem.size) : '未知' }} · {{ fileFormat(activeItem) }}
                  </b>
                </div>
                <div class="il-cell">
                  <span>原图</span>
                  <b>{{ activeItem.hasOriginal ? '已留存' : '未留存' }}</b>
                </div>
                <div class="il-cell">
                  <span>特征模型</span>
                  <b class="il-mono" :title="modelName">{{ modelName || '未配置' }}</b>
                </div>
              </div>

              <div class="il-canvas__acts">
                <button type="button" class="il-btn il-btn--primary" @click="goSearchSimilar(activeItem)">
                  <Search24Regular class="il-ico" /><span>以此图搜同款</span>
                </button>
                <button type="button" class="il-btn" @click="downloadItem(activeItem)">
                  <ArrowDownload24Regular class="il-ico" /><span>下载原图</span>
                </button>
                <span class="il-canvas__acts-note">
                  当前页 {{ duplicateCount }} 张重复 · {{ thumbOnlyCount }} 张缺特征
                </span>
                <button type="button" class="il-btn il-btn--danger" :disabled="busy" @click="removeOne(activeItem)">
                  <Delete24Regular class="il-ico" /><span>删除</span>
                </button>
              </div>

              <div class="il-canvas__film">
                <button
                  v-for="(item, i) in visibleItems"
                  :key="item.id"
                  type="button"
                  class="il-film"
                  :class="{ 'is-on': activeItem.id === item.id }"
                  :title="item.name || ''"
                  @click="activeId = item.id"
                >
                  <img class="il-film__ph" :src="resolveUrl(item)" :alt="item.name || ''" loading="lazy" />
                  <span class="il-film__cap">
                    <b>{{ shortName(item) }}</b>
                    <span class="il-mono">{{ String(i + 1).padStart(2, '0') }}</span>
                  </span>
                </button>
              </div>
            </template>

            <div v-else class="il-empty il-empty--stage">
              <ImageMultiple24Regular class="il-empty__ico" />
              <b>当前页没有可展示的图片</b>
              <span>换一个特征状态，或清空检索词再看。</span>
              <button type="button" class="il-btn" @click="resetFilters">清空筛选</button>
            </div>
          </div>

          <!-- 批量操作条：有勾选才出现，避免常驻占位 -->
          <div v-if="selected.size" class="il-batchbar">
            <span class="il-batchbar__count">已选 {{ selected.size }} 张</span>
            <span class="il-note">逐张删除，失败项会单独报出</span>
            <div class="il-batchbar__acts">
              <button type="button" class="il-btn il-btn--sm" :disabled="busy" @click="clearSelection">取消选择</button>
              <button type="button" class="il-btn il-btn--sm il-btn--danger" :disabled="busy" @click="removeSelected">
                <Delete24Regular class="il-ico" /><span>删除</span>
              </button>
            </div>
          </div>

          <div v-if="view === 'table'" class="il-tblfoot">
            <span>共 {{ formatNumber(total) }} 条 · <i class="il-dim">已选 {{ selected.size }} 条</i></span>
            <span class="il-state is-warn">
              <i class="il-dot il-dot--warn" />{{ thumbOnlyCount }} 张仅缩略图不参与检索
            </span>
            <div class="il-pager">
              <button
                type="button"
                class="il-iconbtn is-bordered"
                title="上一页"
                :disabled="page <= 1 || loading"
                @click="load(page - 1)"
              >
                <ChevronRight24Regular class="il-ico is-flip" />
              </button>
              <b>{{ page }}</b>
              <span class="il-mono">/ {{ pageCount }}</span>
              <button
                type="button"
                class="il-iconbtn is-bordered"
                title="下一页"
                :disabled="page >= pageCount || loading"
                @click="load(page + 1)"
              >
                <ChevronRight24Regular class="il-ico" />
              </button>
              <span class="il-pager__size">每页 {{ pageSize }}</span>
            </div>
          </div>
        </section>

        <!-- 检查器：只描述「当前选中」，与台账共用同一份数据 -->
        <aside class="il-insp">
          <div class="il-eyebrow">检查器 · 当前选中</div>
          <template v-if="activeItem">
            <div class="il-insp__preview">
              <img :src="resolveUrl(activeItem)" :alt="activeItem.name || ''" />
            </div>
            <div class="il-insp__name" :title="activeItem.name || ''">{{ activeItem.name || '未命名' }}</div>
            <div class="il-insp__path">{{ groupLabel }} · {{ activeItem.vectorId || `img-${activeItem.id}` }}</div>
            <div class="il-insp__kv">
              <div><span>记录 ID</span><b>{{ activeItem.id }}</b></div>
              <div><span>尺寸</span><b>{{ resolutionOf(activeItem) }}</b></div>
              <div><span>文件大小</span><b>{{ activeItem.size ? formatSize(activeItem.size) : '未知' }}</b></div>
              <div><span>关键词</span><b :title="(activeItem.tags || []).join(' / ')">{{ activeItem.tags && activeItem.tags.length ? activeItem.tags.join(' / ') : '—' }}</b></div>
              <div><span>入库时间</span><b>{{ formatDateTime(activeItem.createdAt) }}</b></div>
              <div><span>特征向量</span><b>{{ activeItem.hasOriginal ? `${dimension || '—'} 维` : '未生成' }}</b></div>
            </div>
            <div class="il-insp__feat">
              <div class="il-insp__feat-row">
                <span class="il-tag" :class="activeItem.hasOriginal ? 'il-tag--brand' : 'il-tag--warn'">
                  {{ activeItem.hasOriginal ? '已入库' : '仅缩略图' }}
                </span>
                <code>{{ dimension || '—' }}d</code>
              </div>
              <p :title="modelName">{{ modelName || '未配置特征模型' }}</p>
            </div>
            <div class="il-insp__acts">
              <button type="button" class="il-btn il-btn--sm" @click="downloadItem(activeItem)">
                <ArrowDownload24Regular class="il-ico" /><span>下载</span>
              </button>
              <button type="button" class="il-btn il-btn--sm" @click="goSearchSimilar(activeItem)">
                <Search24Regular class="il-ico" /><span>搜同款</span>
              </button>
              <button
                type="button"
                class="il-btn il-btn--sm il-btn--danger il-btn--icon"
                title="删除"
                :disabled="busy"
                @click="removeOne(activeItem)"
              >
                <Delete24Regular class="il-ico" />
              </button>
            </div>
            <div class="il-insp__hint">
              点表格任意一行切换选中；双击缩略图看大图，← → 在当前页内翻页。删除会同时删掉向量索引与原图快照。
            </div>
          </template>
          <div v-else class="il-insp__empty">
            <Scan24Regular class="il-ico" />
            <span>在台账里点一行，查看它的元数据与特征状态。</span>
          </div>
        </aside>
      </div>

      <!-- ══════════════ 特征空间 ══════════════ -->
      <div v-else class="il-spacewrap">
        <div class="il-space">
          <div v-if="!spaceNodes.length" class="il-space__empty">
            <ImageMultiple24Regular class="il-ico" />
            <b>当前页没有可展示的图片</b>
            <span>上传图片或切换分组后再看特征空间。</span>
          </div>
          <div class="il-space__dots">
            <i v-for="(d, i) in spaceDots" :key="'d' + i" :style="{ left: d.x, top: d.y }" />
          </div>

          <div
            v-for="b in spaceClusters"
            :key="b.key"
            class="il-space__blob"
            :class="b.cls"
            :style="{ left: b.x, top: b.y, width: b.w, height: b.h }"
          >
            <div class="il-space__blob-label"><i /><span>{{ b.label }}</span><b>{{ b.count }}</b></div>
          </div>

          <svg class="il-space__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <line
              v-for="(l, i) in spaceLinks"
              :key="'l' + i"
              :x1="l[0]"
              :y1="l[1]"
              :x2="l[2]"
              :y2="l[3]"
              :opacity="l[4]"
              vector-effect="non-scaling-stroke"
            />
          </svg>

          <div
            v-for="n in spaceNodes"
            :key="n.id"
            class="il-node"
            :class="n.cls"
            :style="{ left: n.x, top: n.y }"
          >
            <div class="il-node__ph" :style="{ width: n.size + 'px', height: n.size + 'px' }">
              <img :src="n.src" :alt="n.name" loading="lazy" />
            </div>
            <div class="il-node__lb">
              <b>#{{ n.id }}</b>
              <span>{{ n.short }}</span>
            </div>
          </div>

          <div class="il-space__ov il-space__ov--tl">
            <div class="il-glass">
              <Layer24Regular class="il-ico" />布局示意
              <b>非真实降维</b>· 按关键词分簇
            </div>
            <div class="il-legend">
              <span><i style="background: var(--brand-300, #93c5fd)" />已入库<em>{{ originalCount }}</em></span>
              <span><i style="background: var(--el-color-warning, #d97706)" />仅缩略图<em>{{ thumbOnlyCount }}</em></span>
              <span><i style="background: var(--el-color-danger, #dc2626)" />重复<em>{{ duplicateCount }}</em></span>
            </div>
          </div>

          <div class="il-space__ov il-space__ov--bl">
            <div class="il-legend">
              <span>节点<em>{{ spaceNodes.length }}</em></span>
              <span>簇<em>{{ spaceClusters.length }}</em></span>
              <span>计数口径<em>当前页</em></span>
            </div>
          </div>

          <aside class="il-space__panel">
            <div class="il-eyebrow">库概览</div>
            <div class="il-sp-head">
              <div class="il-sp-head__ph">
                <img v-if="activeItem" :src="resolveUrl(activeItem)" :alt="activeItem.name || ''" />
              </div>
              <div>
                <b>{{ formatNumber(total) }} 张 · {{ groupLabel }}</b>
                <span>特征覆盖率 {{ coverage }}% · {{ dimension || '—' }} 维</span>
              </div>
            </div>
            <div class="il-sp-stats">
              <div><span>特征已入库</span><b>{{ originalCount }}<i> 张</i></b></div>
              <div><span>仅缩略图</span><b>{{ thumbOnlyCount }}<i> 张</i></b></div>
              <div><span>重复文件</span><b>{{ duplicateCount }}<i> 张</i></b></div>
              <div>
                <span>已知体积</span>
                <b>{{ sizeText }}<i v-if="sizeText !== '—'"> </i></b>
              </div>
            </div>
            <div class="il-sp-sec">
              <span>当前页分布</span>
              <span class="il-mono">{{ statusInfo?.storage || '存储引擎未知' }}</span>
            </div>
            <div class="il-sp-top">
              <span class="il-sp-top__n">A</span>
              <span class="il-sp-top__nm">仅缩略图 · 未留存原图</span>
              <span class="il-sp-top__sc is-warn">{{ thumbOnlyCount }}</span>
            </div>
            <div class="il-sp-top">
              <span class="il-sp-top__n">B</span>
              <span class="il-sp-top__nm">重复 · 缩略图指纹一致</span>
              <span class="il-sp-top__sc is-err">{{ duplicateCount }}</span>
            </div>
            <p class="il-sp-note">
              后端未提供向量降维与聚类接口：这里按关键词把当前页分簇，
              分区、连线与位置不代表真实向量距离，也不参与检索判定。
            </p>
            <div class="il-sp-acts">
              <button type="button" class="il-btn" @click="refresh">
                <ArrowSync24Regular class="il-ico" /><span>刷新</span>
              </button>
              <button type="button" class="il-btn il-btn--primary" @click="goModelConfig">
                <Settings24Regular class="il-ico" /><span>模型设置</span>
              </button>
            </div>
            <div class="il-sp-meta">
              <span>{{ modelName || '未配置模型' }}</span>
              <span>{{ dimension || '—' }} 维 · cosine</span>
            </div>
          </aside>

          <div class="il-space__footnote">
            <Info24Regular class="il-ico" />
            布局为示意：后端没有降维 / 聚类接口，节点按关键词分簇、位置不表达距离。
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import {
  Add24Regular,
  Alert24Regular,
  ArrowDownload24Regular,
  ArrowSync24Regular,
  ArrowUpload24Regular,
  ChevronRight24Regular,
  CloudArrowUp24Regular,
  Delete24Regular,
  Dismiss24Regular,
  Eye24Regular,
  Folder24Regular,
  Image24Regular,
  ImageMultiple24Regular,
  Info24Regular,
  Layer24Regular,
  List24Regular,
  Scan24Regular,
  Search24Regular,
  Settings24Regular,
} from '@vicons/fluent'

import PageHeader from '../PageHeader.vue'
import { apiService } from '@/services/ApiService'
import type { ImageItem, ImageSearchStatus } from '@/services/modules/image-search.api'
import { resolveImageUrl } from '@/utils/imageSearchUrl'
import { createAuthImageLoader, downloadAuthenticatedFile } from '@/utils/authImage'
import { toErrorMessage } from '@/utils/errors'
import { usePopup } from '@/composables/usePopup'
import { useLibraryGroups } from '@/composables/useLibraryGroups'
import { useModelConfigStore } from '@/stores/modelConfig'

/**
 * 图像库（台账 / 画布 + 特征空间）。
 *
 * <p>数据只有一处来源：{@code /image-search/*}。定稿稿里那些没有后端字段的
 * 装饰（SKU、来源批次、置信度、处理失败、近邻同款）一律不渲染 —— 台账里出现的
 * 每个值都能在 {@link ImageItem} 上找到出处，或者明确标注为「当前页」口径。</p>
 *
 * <p><b>为什么叫 ImageLibraryPage 而不是 Panel。</b>它有两种宿主形态：
 * 独立路由 {@code /image-library}（带 PageHeader）与设置页的「图像库」页签
 * （{@code embedded}，标题栏由 SystemSettings 提供）。两者共用同一份实现，
 * 避免又一次「两块代码各自漂移」。</p>
 */

/** 组件入参：embedded = 由宿主（设置页）提供标题栏，本组件只交内容区 */
withDefaults(defineProps<{ embedded?: boolean }>(), { embedded: false })

const { toast, confirm, prompt } = usePopup()
const router = useRouter()

/**
 * 单组定位口径：列表 / 删除 / 入库都按压当前分组。
 *
 * <p>后端 {@code /image-search/list} 只接受单个分组名，不传即 default ——
 * 所以「没选分组」不等于「看全部」，页面必须把当前分组显式亮出来。</p>
 */
const { group, groupOptions, loadGroups } = useLibraryGroups('image')

const fileInput = ref<HTMLInputElement | null>(null)

/** 当前页记录（服务端分页，page/size 由本页维护） */
const items = ref<ImageItem[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(24)
/** 输入框里的检索词（回车才提交） */
const keyword = ref('')
/** 已提交的检索词：列表查询与导出口径一致 */
const kwApplied = ref('')

/** 视图：台账 / 画布（同一屏两个视图，共用数据源） */
const view = ref<'table' | 'canvas'>('table')
/** 页签：图像库 / 特征空间 */
const tab = ref<'library' | 'space'>('library')
/** 特征状态筛选（前端按当前页过滤，后端 list 没有这个维度） */
const statusFilter = ref<'all' | 'original' | 'thumbOnly' | 'duplicate'>('all')

const loading = ref(false)
/** 删除进行中（批量 / 单张共用） */
const busy = ref(false)
const dragging = ref(false)
const uploading = ref(false)
const progress = ref(0)
const progressText = ref('')

/** null = 尚未探测；false = 未配置特征模型 */
const available = ref<boolean | null>(null)
const modelName = ref('')
/** 配置的模型是否真的在能力清单里；null = 未探测或查询失败（不据此拦页面） */
const modelRegistered = ref<boolean | null>(null)
const statusInfo = ref<ImageSearchStatus | null>(null)
const statusLoaded = ref(false)

/** 勾选集合（批量删除作用域） */
const selected = ref<Set<number>>(new Set())
/** 当前查看的单图；null 时回落到当页第一张 */
const activeId = ref<number | null>(null)

/** 模型配置门禁：只认「当前用户本人覆盖」，系统种子不算配置 */
const modelConfig = useModelConfigStore()

/** 带鉴权的图片地址加载器（卸载时自动 revoke object URL） */
const authImages = createAuthImageLoader()

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

const groupLabel = computed(() => (group.value === 'default' ? '默认分组' : group.value))

/**
 * 分组展示名。
 *
 * @param g 分组名
 * @returns 展示文案（default 加中文说明，其余原样）
 */
function groupLabelOf(g: string): string {
  return g === 'default' ? '默认分组' : g
}

/**
 * 整页是否该拦成「去配置模型」。
 *
 * <p>两种情况都拦：① 压根没配特征模型；② 配了但名字不在能力清单里。
 * 第二种文案必须不同 —— 否则用户会以为自己配对了，却怎么都搜不到。</p>
 */
const blockedReason = computed<{ title: string; desc: string } | null>(() => {
  if (available.value === false || modelRegistered.value === false) {
    return {
      title: modelRegistered.value === false ? '图像特征模型不可用' : '图像库未启用',
      desc:
        modelRegistered.value === false
          ? '配置的图像特征模型不在后端可用模型清单中，上传与检索都会失败。请到模型配置页改选一个已注册的图像特征模型。'
          : '图像库需要「图像特征模型」才能提取特征。当前未配置，上传与检索都不可用。',
    }
  }
  // null = 仍在探测，避免首屏闪一下拦截页
  return null
})

/** 仅当没被拦、且不在上传中才允许选文件 / 拖拽 */
const canUpload = computed(() => !uploading.value && !blockedReason.value)

const originalCount = computed(() => items.value.filter((x) => x.hasOriginal).length)
const thumbOnlyCount = computed(() => items.value.filter((x) => !x.hasOriginal).length)

/** 当前页特征覆盖率（按张数算，不含未入库的缩略图记录） */
const coverage = computed(() => {
  const n = items.value.length
  if (!n) {
    return 0
  }
  return Math.round((originalCount.value / n) * 100)
})

/** 特征维度：来自 /image-search/status；未知时为 0，模板统一显示「—」 */
const dimension = computed(() => Number(statusInfo.value?.dimension || 0))

/** 当前页已知体积合计；历史记录 size 为 null 的不计入，避免把未知当 0 */
const sizeText = computed(() => {
  const known = items.value
    .map((x) => x.size)
    .filter((n): n is number => typeof n === 'number' && n > 0)
  if (!known.length) {
    return '—'
  }
  return formatSize(known.reduce((a, b) => a + b, 0))
})

/**
 * 重复图片指纹。
 *
 * <p>用缩略图内容算而不是按文件名：同名不同图、不同名同图都很常见，
 * 只有像素内容一致才是真重复。同一后端同一压缩参数下，同图必然同串。</p>
 */
const duplicateIds = computed(() => {
  const seen = new Map<string, number[]>()
  for (const item of items.value) {
    const key = item.thumbnail
    if (!key) {
      continue
    }
    const list = seen.get(key) || []
    list.push(item.id)
    seen.set(key, list)
  }
  const dup = new Set<number>()
  for (const list of seen.values()) {
    if (list.length > 1) {
      list.forEach((id) => dup.add(id))
    }
  }
  return dup
})

const duplicateCount = computed(() => duplicateIds.value.size)

/**
 * 该记录是否与当页另一张重复。
 *
 * @param item 记录
 * @returns 当页存在缩略图指纹相同的另一张时为 true
 */
function isDuplicate(item: ImageItem): boolean {
  return duplicateIds.value.has(item.id)
}

/** 状态筛选在前端做：底库单页条数不大，后端 list 未提供该维度 */
const visibleItems = computed(() => {
  switch (statusFilter.value) {
    case 'original':
      return items.value.filter((x) => x.hasOriginal)
    case 'thumbOnly':
      return items.value.filter((x) => !x.hasOriginal)
    case 'duplicate':
      return items.value.filter((x) => isDuplicate(x))
    default:
      return items.value
  }
})

/** 当前查看项；选中项不在筛选结果里时回落到第一张 */
const activeItem = computed<ImageItem | null>(() => {
  const list = visibleItems.value
  if (!list.length) {
    return null
  }
  return list.find((x) => x.id === activeId.value) || list[0]
})

const activeIndex = computed(() => {
  const cur = activeItem.value
  return cur ? visibleItems.value.findIndex((x) => x.id === cur.id) : -1
})

/** 左栏特征状态筛选（计数口径写明：全部为服务端 total，其余为当前页） */
const statusFilters = computed(() => [
  {
    key: 'all' as const,
    label: '全部图片',
    count: formatNumber(total.value),
    dot: '',
    title: '服务端按检索词命中的总数',
  },
  {
    key: 'original' as const,
    label: '特征已入库',
    count: originalCount.value,
    dot: 'is-ok',
    title: '当前页里有原图、可参与检索的张数',
  },
  {
    key: 'thumbOnly' as const,
    label: '仅缩略图',
    count: thumbOnlyCount.value,
    dot: 'is-warn',
    title: '当前页里只留存缩略图的张数（不参与检索）',
  },
  {
    key: 'duplicate' as const,
    label: '重复文件',
    count: duplicateCount.value,
    dot: 'is-err',
    title: '当前页里缩略图指纹相同的张数',
  },
])

const allSelected = computed(
  () => visibleItems.value.length > 0 && visibleItems.value.every((x) => selected.value.has(x.id)),
)

/* ─────────────────────── 特征空间（示意布局） ─────────────────────── */

/**
 * 特征空间分簇。
 *
 * <p><b>这是示意布局，不是降维结果。</b>后端没有向量投影 / 聚类接口，
 * 所以这里按「关键词」把当页记录分组（出现最多的前 4 个关键词，其余合并），
 * 位置由簇序号与记录序号决定 —— 稳定但没有任何距离语义。节点连线只表示
 * 「属于同一簇」，不表示相似度。</p>
 */
const spaceBuckets = computed(() => {
  const byTag = new Map<string, ImageItem[]>()
  const untagged: ImageItem[] = []
  for (const item of visibleItems.value) {
    const tag = (item.tags || []).map((t) => String(t ?? '').trim()).find(Boolean)
    if (!tag) {
      untagged.push(item)
      continue
    }
    const list = byTag.get(tag) || []
    list.push(item)
    byTag.set(tag, list)
  }
  const buckets = [...byTag.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([label, list]) => ({ key: label, label, items: list }))
  if (buckets.length > 4) {
    const rest = buckets.splice(4)
    buckets.push({ key: '__other', label: '其他关键词', items: rest.flatMap((b) => b.items) })
  }
  if (untagged.length) {
    buckets.push({ key: '__none', label: '无关键词', items: untagged })
  }
  return buckets.slice(0, 6)
})

/** 簇心（百分比坐标）；数量上限与空间位置一一对应 */
const SPACE_CENTERS = [
  { x: 26, y: 30 },
  { x: 56, y: 24 },
  { x: 42, y: 62 },
  { x: 70, y: 58 },
  { x: 16, y: 64 },
  { x: 66, y: 38 },
]

const spaceClusters = computed(() =>
  spaceBuckets.value.map((b, i) => {
    const c = SPACE_CENTERS[i % SPACE_CENTERS.length]
    const r = 8 + Math.min(5, Math.sqrt(b.items.length) * 2)
    return {
      key: b.key,
      label: b.label,
      count: b.items.length,
      cls: `is-tone-${(i % 4) + 1}`,
      cx: c.x,
      cy: c.y,
      r,
      x: `${c.x}%`,
      y: `${c.y}%`,
      w: `${(r * 2.3).toFixed(1)}%`,
      h: `${(r * 1.8).toFixed(1)}%`,
    }
  }),
)

const spaceNodes = computed(() => {
  const out: Array<{
    id: number
    x: string
    y: string
    size: number
    src: string
    name: string
    short: string
    cls: string
  }> = []
  spaceClusters.value.forEach((c, ci) => {
    const list = spaceBuckets.value[ci]?.items ?? []
    list.slice(0, 10).forEach((item, idx) => {
      const n = Math.max(1, list.length)
      const angle = (idx / n) * Math.PI * 2 + (ci + 1) * 0.6
      const rr = c.r * (0.42 + 0.5 * ((idx % 3) / 2))
      const x = c.cx + Math.cos(angle) * rr * 1.2
      const y = c.cy + Math.sin(angle) * rr * 0.8
      out.push({
        id: item.id,
        x: `${Math.min(84, Math.max(4, x)).toFixed(2)}%`,
        y: `${Math.min(90, Math.max(6, y)).toFixed(2)}%`,
        size: item.hasOriginal ? 46 : 38,
        src: resolveUrl(item),
        name: item.name || '',
        short: shortName(item),
        cls: isDuplicate(item) ? 'is-dup' : item.hasOriginal ? 'is-ok' : 'is-warn',
      })
    })
  })
  return out
})

/** 簇心到节点的连线；只表达归属，不代表任何距离 */
const spaceLinks = computed(() => {
  const out: Array<[number, number, number, number, number]> = []
  spaceClusters.value.forEach((c, ci) => {
    const list = spaceBuckets.value[ci]?.items ?? []
    list.slice(0, 10).forEach((item) => {
      const node = spaceNodes.value.find((x) => x.id === item.id)
      if (!node) {
        return
      }
      out.push([
        c.cx,
        c.cy,
        Number.parseFloat(node.x),
        Number.parseFloat(node.y),
        item.hasOriginal ? 0.3 : 0.16,
      ])
    })
  })
  return out
})

/** 背景点阵：固定种子，避免每次渲染都跳动 */
const spaceDots = computed(() => {
  const out: Array<{ x: string; y: string }> = []
  let seed = 20260101
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let i = 0; i < 48; i++) {
    out.push({
      x: `${(rnd() * 96 + 2).toFixed(2)}%`,
      y: `${(rnd() * 86 + 7).toFixed(2)}%`,
    })
  }
  return out
})

/* ─────────────────────── 格式化 ─────────────────────── */

/**
 * 千分位数字。
 *
 * @param n 数值
 * @returns 本地化字符串
 */
function formatNumber(n: number): string {
  return Number(n || 0).toLocaleString('zh-CN')
}

/**
 * 字节数格式化。
 *
 * @param bytes 字节数
 * @returns 人类可读体积；非正数返回「未知」
 */
function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '未知'
  }
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 入库时间格式化。
 *
 * @param v 后端时间串
 * @returns `YYYY-MM-DD HH:mm`；缺失或非法时返回「—」
 */
function formatDateTime(v?: string | null): string {
  if (!v) {
    return '—'
  }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) {
    return String(v)
  }
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/**
 * 分辨率文案。
 *
 * @param item 记录
 * @returns `宽×高`；缺字段时「未知」
 */
function resolutionOf(item: ImageItem): string {
  return item.width && item.height ? `${item.width}×${item.height}` : '未知'
}

/**
 * 文件格式（从名称或地址的扩展名推断）。
 *
 * @param item 记录
 * @returns 大写扩展名；推断不出时「图片」
 */
function fileFormat(item: ImageItem): string {
  const m = /\.([a-z0-9]{2,5})$/i.exec(item.name || item.url || '')
  return m ? m[1].toUpperCase() : '图片'
}

/**
 * 缩略名称（画布胶片条用）。
 *
 * @param item 记录
 * @returns 最多 12 个字符的名称
 */
function shortName(item: ImageItem): string {
  const n = item.name || `#${item.id}`
  return n.length > 12 ? `${n.slice(0, 11)}…` : n
}

/**
 * 时间戳（导出文件名用）。
 *
 * @returns `YYYYMMDD-HHmm`
 */
function timestamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

/**
 * 取可直接给 img.src 用的地址。
 *
 * <p>令牌不进 URL：{@link resolveImageUrl} 内部走 {@link createAuthImageLoader}
 * 的 fetch + blob 地址；未就绪时给透明占位图，不出现裂图。</p>
 *
 * @param item 记录
 * @returns blob / data URL
 */
function resolveUrl(item: ImageItem): string {
  return resolveImageUrl(item, authImages)
}

/* ─────────────────────── 数据加载 ─────────────────────── */

/**
 * 拉当前页。
 *
 * @param target 页码（从 1 开始）
 */
async function load(target = 1): Promise<void> {
  loading.value = true
  try {
    const data = await apiService.listImage({
      page: target,
      size: pageSize.value,
      keyword: kwApplied.value || undefined,
      group: group.value,
    })
    items.value = data?.items ?? []
    total.value = data?.total ?? 0
    page.value = target
    // 翻页后旧勾选指向上一页记录，必须清掉
    clearSelection()
    if (!activeItem.value) {
      activeId.value = items.value[0]?.id ?? null
    }
  } catch (e: unknown) {
    items.value = []
    total.value = 0
    toast.error(toErrorMessage(e, '加载图像库失败'))
  } finally {
    loading.value = false
    await nextTick()
  }
}

/**
 * 读模型门禁状态。
 *
 * <p>不用 {@code /image-search/status} 的 available：它会把系统种子
 * {@code cn-clip-rn50-image} 当成「已配置」，与设置中心显示不一致。</p>
 */
async function loadStatus(): Promise<void> {
  try {
    await modelConfig.load()
    available.value = modelConfig.imageReady
    modelName.value = modelConfig.imageFeatureModel
    statusInfo.value = await apiService.status()
  } catch {
    /* 状态读不到不阻断页面：列表仍然可看，只是缺维度信息 */
  } finally {
    statusLoaded.value = true
  }
  await checkModelRegistered()
}

/**
 * 用能力清单校验配置的模型是否真的可选。
 *
 * <p>查询失败不拦页面：宁可放过，也不要因为辅助接口抖动把整页判成不可用。</p>
 */
async function checkModelRegistered(): Promise<void> {
  const want = modelName.value
  if (!want) {
    modelRegistered.value = null
    return
  }
  try {
    const raw = await apiService._request('/ai/models/capability/feature')
    // 该接口可能返回双层包装，两种形态都兼容
    const list = Array.isArray(raw) ? raw : raw?.data
    modelRegistered.value = Array.isArray(list) ? list.includes(want) : null
  } catch {
    modelRegistered.value = null
  }
}

/** 刷新：状态 + 分组 + 当前页 */
async function refresh(): Promise<void> {
  await loadStatus()
  await loadGroups()
  await load(page.value)
}

/** 切分组 = 换一个库：回第 1 页，清勾选与选中项 */
async function selectGroup(g: string): Promise<void> {
  if (g === group.value) {
    return
  }
  group.value = g
  selected.value = new Set()
  activeId.value = null
  await load(1)
}

/**
 * 新建分组。
 *
 * <p>后端没有「建空分组」接口：分组在第一次上传时随记录落下。这里做的是
 * 「切到一个新组名」，切过去之后的上传就落在新组里。</p>
 */
async function createGroup(): Promise<void> {
  const input = await prompt('新建分组', {
    placeholder: '分组名，例如 产品图 / 竞品图',
    confirmText: '切换过去',
  })
  const name = (input || '').trim()
  if (!name) {
    return
  }
  if (groupOptions.value.includes(name)) {
    toast.info(`分组「${name}」已存在，已切换`)
  }
  group.value = name
  selected.value = new Set()
  activeId.value = null
  await load(1)
  if (!groupOptions.value.includes(name) || !items.value.length) {
    toast.success(`已切到「${name}」：上传到该分组的图片独立成库`)
  }
}

/** 提交检索词（回车生效）：回第 1 页 */
async function applyKeyword(): Promise<void> {
  kwApplied.value = keyword.value.trim()
  await load(1)
}

/** 清空检索词并重查 */
async function clearKeyword(): Promise<void> {
  keyword.value = ''
  kwApplied.value = ''
  await load(1)
}

/** 清空筛选：状态回到「全部图片」并清检索词 */
async function resetFilters(): Promise<void> {
  statusFilter.value = 'all'
  keyword.value = ''
  kwApplied.value = ''
  await load(1)
}

/**
 * 切换特征状态筛选。
 *
 * @param key 状态键
 */
function setStatusFilter(key: 'all' | 'original' | 'thumbOnly' | 'duplicate'): void {
  statusFilter.value = key
}

/* ─────────────────────── 选择 / 删除 ─────────────────────── */

/**
 * 勾选 / 取消勾选一张。
 *
 * @param item 记录
 */
function toggleSelect(item: ImageItem): void {
  const next = new Set(selected.value)
  if (next.has(item.id)) {
    next.delete(item.id)
  } else {
    next.add(item.id)
  }
  selected.value = next
}

/** 全选 / 取消全选当前可见项 */
function toggleSelectAll(): void {
  selected.value = allSelected.value ? new Set() : new Set(visibleItems.value.map((x) => x.id))
}

/** 清空勾选 */
function clearSelection(): void {
  selected.value = new Set()
}

/**
 * 删除一张。
 *
 * @param item 记录
 */
async function removeOne(item: ImageItem): Promise<void> {
  if (
    !(await confirm(
      '删除图片',
      `确定把「${item.name || '未命名'}」从图像库删除？删除后无法恢复。`,
    ))
  ) {
    return
  }
  busy.value = true
  try {
    await apiService.deleteImage(item.id, group.value)
    toast.success('已删除')
    const next = new Set(selected.value)
    next.delete(item.id)
    selected.value = next
    await reloadKeepPage()
  } catch (e: unknown) {
    toast.error(toErrorMessage(e, '删除失败'))
  } finally {
    busy.value = false
  }
}

/**
 * 批量删除（逐张串行）。
 *
 * <p>先把 id 快照下来再删：删除过程中 {@link selected} 会变，
 * 直接遍历它会把「删过的集合」当成「待删集合」。没有批接口，逐张删还能
 * 准确报出失败的是哪几张。</p>
 */
async function removeSelected(): Promise<void> {
  const ids = [...selected.value]
  if (!ids.length) {
    return
  }
  if (!(await confirm('批量删除', `确定删除选中的 ${ids.length} 张图片？删除后无法恢复。`))) {
    return
  }
  busy.value = true
  const failed: string[] = []
  let ok = 0
  try {
    for (const id of ids) {
      try {
        await apiService.deleteImage(id, group.value)
        ok++
      } catch (e: unknown) {
        const name = items.value.find((x) => x.id === id)?.name || `#${id}`
        failed.push(`${name}：${toErrorMessage(e, '未知错误')}`)
      }
    }
  } finally {
    busy.value = false
  }
  if (ok) {
    toast.success(`已删除 ${ok} 张`)
  }
  if (failed.length) {
    toast.error(`${failed.length} 张删除失败：${failed.slice(0, 3).join('；')}`)
  }
  clearSelection()
  await reloadKeepPage()
}

/** 删除后重载；当前页被删空则退回上一页，避免停在空白页 */
async function reloadKeepPage(): Promise<void> {
  const remain = visibleItems.value.length
  const target = remain === 0 && page.value > 1 ? page.value - 1 : page.value
  await load(target)
}

/* ─────────────────────── 上传 ─────────────────────── */

/** 上传上限：兼顾清晰度与传输开销 */
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024
/** 短边下限：CLIP 类模型在 128px 以下基本没有可分辨语义 */
const MIN_UPLOAD_EDGE = 128

/**
 * 读取图片像素尺寸。
 *
 * @param file 图片文件
 * @returns 宽高；读取失败时 null
 */
function readImageSize(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    const done = (v: { w: number; h: number } | null) => {
      URL.revokeObjectURL(url)
      resolve(v)
    }
    img.onload = () => done({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => done(null)
    img.src = url
  })
}

/**
 * 上传前校验（体积 + 分辨率）。
 *
 * <p>过小的图能入库但特征近乎噪声，检索永远不中；过大的图会顶到服务端
 * multipart 上限整批失败。两头都在前端先说清楚。</p>
 *
 * @param file 待上传文件
 * @returns 通过返回 null，否则返回拒绝原因
 */
async function validateImage(file: File): Promise<string | null> {
  if (!file.type.startsWith('image/')) {
    return '不是图片文件'
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `体积 ${(file.size / 1024 / 1024).toFixed(1)}MB 超过 20MB 上限，请压缩后再上传`
  }
  try {
    const size = await readImageSize(file)
    if (size && Math.min(size.w, size.h) < MIN_UPLOAD_EDGE) {
      return `分辨率 ${size.w}×${size.h} 过低，短边需不小于 ${MIN_UPLOAD_EDGE}px（过小的图提不出可用特征，检索时不会命中）`
    }
  } catch {
    /* 尺寸读不出来不拦：后端解码判据更准 */
  }
  return null
}

/** 打开文件选择框 */
function pickFiles(): void {
  if (!canUpload.value) {
    return
  }
  fileInput.value?.click()
}

/**
 * 选完文件。
 *
 * @param event input change 事件
 */
async function onPicked(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (files.length) {
    await upload(files)
  }
}

/**
 * 拖拽离开：只有真正离开组件才收起遮罩。
 *
 * @param event 拖拽事件
 */
function onDragLeave(event: DragEvent): void {
  const el = event.currentTarget as HTMLElement | null
  const to = event.relatedTarget as Node | null
  if (el && to && el.contains(to)) {
    return
  }
  dragging.value = false
}

/**
 * 拖拽放下。
 *
 * @param event 拖拽事件
 */
async function onDrop(event: DragEvent): Promise<void> {
  dragging.value = false
  if (!canUpload.value) {
    return
  }
  const files = Array.from(event.dataTransfer?.files ?? [])
  if (files.length) {
    await upload(files)
  }
}

/**
 * 逐张上传。
 *
 * <p>串行而不是并发：入库要跑特征提取，并发只会互相抢 CPU/GPU，
 * 还会把后端线程池打满；串行顺带能给出准确的「第几张」进度。</p>
 *
 * @param files 选中的文件
 */
async function upload(files: File[]): Promise<void> {
  uploading.value = true
  progress.value = 0
  progressText.value = '正在校验图片…'
  let ok = 0
  const failed: string[] = []
  // 进度分母只算通过校验的，避免被刷掉的文件把进度条顶住不动
  const accepted: File[] = []
  for (const file of files) {
    const reason = await validateImage(file)
    if (reason) {
      failed.push(`${file.name}：${reason}`)
    } else {
      accepted.push(file)
    }
  }
  if (!accepted.length) {
    uploading.value = false
    progressText.value = ''
    toast.error(`${failed.length} 张全部被拒：${failed.slice(0, 3).join('；')}`)
    return
  }
  try {
    for (let i = 0; i < accepted.length; i++) {
      const file = accepted[i]
      progressText.value = `正在入库 ${i + 1}/${accepted.length}：${file.name}`
      try {
        // 必须带当前分组：传到别的组，本页就看不到了
        await apiService.indexImage(file, file.name, group.value)
        ok++
      } catch (e: unknown) {
        failed.push(`${file.name}：${toErrorMessage(e, '未知错误')}`)
      }
      progress.value = Math.round(((i + 1) / accepted.length) * 100)
    }
  } finally {
    uploading.value = false
    progress.value = 0
    progressText.value = ''
  }
  if (ok) {
    toast.success(`成功入库 ${ok} 张`)
  }
  if (failed.length) {
    // 逐条报出来，别只给一句「部分失败」让人猜是哪几张
    toast.error(`${failed.length} 张未入库：${failed.slice(0, 3).join('；')}`)
  }
  // 全部被拒时服务端没变，不必再闪一次加载态
  if (ok > 0) {
    await load(1)
  }
}

/* ─────────────────────── 预览 / 下载 / 跳转 ─────────────────────── */

/**
 * viewerjs 预览：把当页可见项都塞进临时容器，支持缩放与左右切换。
 *
 * @param item 要打开的那张
 */
function preview(item: ImageItem): void {
  const list = visibleItems.value
  const index = Math.max(0, list.findIndex((x) => x.id === item.id))
  const holder = document.createElement('div')
  holder.style.display = 'none'
  for (const it of list) {
    const img = document.createElement('img')
    img.src = resolveUrl(it)
    img.alt = it.name || ''
    holder.appendChild(img)
  }
  document.body.appendChild(holder)
  const temp = new Viewer(holder, {
    navbar: false,
    title: (image: HTMLImageElement) => image.alt || '',
    hidden: () => {
      temp.destroy()
      holder.remove()
    },
  })
  temp.view(index)
}

/**
 * 下载原图（令牌不进 URL）。
 *
 * @param item 记录
 */
async function downloadItem(item: ImageItem): Promise<void> {
  if (!item.url) {
    toast.error('这条记录只留了缩略图，没有可下载的原图')
    return
  }
  const base = (apiService.baseURL || '').replace(/\/+$/, '')
  const path = item.url.startsWith('/') ? item.url : `/${item.url}`
  const rawName = item.name || `image-${item.id}`
  const name = /\.[a-z0-9]{2,5}$/i.test(rawName) ? rawName : `${rawName}.png`
  const ok = await downloadAuthenticatedFile(`${base}${path}`, name)
  if (ok) {
    toast.success('已开始下载原图')
  } else {
    toast.error('下载失败：原图可能已被清理')
  }
}

/**
 * 以此图搜同款：带着记录 id 跳到以图搜图页，由它取原图并直接发起检索。
 *
 * @param item 记录
 */
function goSearchSimilar(item: ImageItem): void {
  void router.push({
    name: 'ImageSearch',
    query: { imageId: String(item.id), group: group.value },
  })
}

/** 去模型配置页（图像库没有特征模型时唯一的可用出路） */
function goModelConfig(): void {
  void router.push({ name: 'SystemSettings', params: { tab: 'default-models' } })
}

/** 画布翻页 */
function step(delta: number): void {
  const list = visibleItems.value
  if (!list.length) {
    return
  }
  const next = Math.min(list.length - 1, Math.max(0, activeIndex.value + delta))
  const target = list[next]
  if (target && target.id !== activeId.value) {
    activeId.value = target.id
  }
}

/**
 * 画布内 ← → 翻页（输入框里不抢键）。
 *
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent): void {
  if (tab.value !== 'library' || view.value !== 'canvas') {
    return
  }
  const target = e.target as HTMLElement | null
  const tag = target?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
    return
  }
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    step(-1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    step(1)
  }
}

/**
 * 导出当前页 CSV。
 *
 * <p>没有导出接口，这里按当前可见项在浏览器侧生成；带 BOM 保证 Excel
 * 打开中文不乱码。列表为空时按钮本身是禁用的。</p>
 */
function exportCsv(): void {
  const rows = visibleItems.value
  if (!rows.length) {
    return
  }
  const head = [
    '记录ID',
    '名称',
    '分组',
    '特征状态',
    '是否重复',
    '分辨率',
    '体积(字节)',
    '入库时间',
    '关键词',
  ]
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const lines = [head.map(esc).join(',')]
  for (const item of rows) {
    lines.push(
      [
        item.id,
        item.name || '',
        group.value,
        item.hasOriginal ? '特征已入库' : '仅缩略图',
        isDuplicate(item) ? '是' : '否',
        resolutionOf(item),
        typeof item.size === 'number' && item.size > 0 ? item.size : '',
        formatDateTime(item.createdAt),
        (item.tags || []).join(' / '),
      ]
        .map(esc)
        .join(','),
    )
  }
  const blob = new Blob([`\ufeff${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `image-library-${group.value}-${timestamp()}.csv`
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // 延后释放：部分浏览器在 click 后仍异步读 href
  setTimeout(() => URL.revokeObjectURL(url), 2000)
  toast.success(`已导出当前页 ${rows.length} 条`)
}

/** 筛选变化后保证「当前选中」仍落在可见列表里 */
watch(visibleItems, (list) => {
  if (!list.length) {
    return
  }
  if (!list.some((x) => x.id === activeId.value)) {
    activeId.value = list[0].id
  }
})

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  await loadStatus()
  await loadGroups()
  await load(1)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})

defineExpose({ reload: refresh })
</script>

<style scoped>
/* ───────────────────────── 根 ───────────────────────── */
.il {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  color: var(--text-primary, #1f2329);
  background: var(--bg-page, #f6f7f9);
  font-size: 13px;
  line-height: 1.5;
  font-family: var(--el-font-family, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif);
}
.il *,
.il *::before,
.il *::after { box-sizing: border-box; }
.il button { font: inherit; color: inherit; }
.il ::selection { background: var(--selection-bg, #dbeafe); }
.il ::-webkit-scrollbar { width: 8px; height: 8px; }
.il ::-webkit-scrollbar-thumb {
  background: var(--el-border-color, #dcdfe6);
  border-radius: 8px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.il ::-webkit-scrollbar-track { background: transparent; }

/* 嵌入模式（设置 → 图像库）：外层已有页头与留白，这里不再自画底色边框 */
.il--embedded { border: 0; }
/* 拖拽悬停时只给一圈提示，真正的投放区提示由 .il-dropmask 负责 */
.il--drag { outline: 2px dashed var(--el-color-primary-light-5, #a0cfff); outline-offset: -4px; }

/* ───────────────────────── 操作条 ───────────────────────── */
.il-tools { display: flex; align-items: center; gap: 8px; }
.il-toolrow {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 44px;
  padding: 0 14px;
  background: var(--bg-container, #fff);
  border-bottom: 1px solid var(--border-subtle, #ebeef5);
}
.il-toolrow__sub { font-size: 12px; color: var(--text-tertiary, #86909c); }
.il-toolrow__sub b { color: var(--text-secondary, #4e5969); font-weight: 600; }
.il-toolrow__sub code {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 11px;
}

.il-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 30px;
  padding: 0 11px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-container, #fff);
  color: var(--text-secondary, #4e5969);
  font-size: 12.5px;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.il-btn:hover:not(:disabled) {
  color: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary-light-5, #a0cfff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.il-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.il-btn--primary {
  color: var(--el-color-white, #fff);
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff);
  box-shadow: var(--shadow-brand, 0 2px 8px rgba(59, 130, 246, 0.24));
}
.il-btn--primary:hover:not(:disabled) {
  color: var(--el-color-white, #fff);
  border-color: var(--el-color-primary-dark-2, #337ecc);
  background: var(--el-color-primary-dark-2, #337ecc);
}
.il-btn--sm { height: 26px; padding: 0 9px; font-size: 12px; }
.il-btn--icon { padding: 0; width: 26px; flex: none; }
.il-btn--danger {
  color: var(--status-error-text, #b91c1c);
  border-color: var(--status-error-border, #fecaca);
}
.il-btn--danger:hover:not(:disabled) {
  color: var(--status-error-text, #b91c1c);
  border-color: var(--status-error, #dc2626);
  background: var(--status-error-bg, #fef2f2);
}

.il-ico { width: 15px; height: 15px; flex: none; }
.il-ico.is-flip { transform: scaleX(-1); }

.il-hidden { display: none; }

/* ───────────────────────── 拖拽 / 拦截 ───────────────────────── */
.il-dropmask {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
  color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 8%, var(--bg-container, #fff));
  border: 2px dashed var(--el-color-primary, #409eff);
  border-radius: var(--radius-lg, 14px);
  font-size: 12.5px;
}
.il-dropmask__ico { width: 40px; height: 40px; }
.il-dropmask b { font-size: 14px; }
.il-dropmask span { font-size: 11.5px; color: var(--text-tertiary, #86909c); }

.il-blocked {
  flex: 1;
  min-height: 0;
  margin: 16px;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--bg-container, #fff);
  border: 1px solid var(--border-subtle, #ebeef5);
  border-radius: var(--radius-lg, 14px);
}
.il-blocked__ico { width: 34px; height: 34px; color: var(--status-warning, #f59e0b); }
.il-blocked__title { margin: 10px 0 0; font-size: 16px; font-weight: 650; }
.il-blocked__desc {
  margin: 6px 0 0;
  max-width: 560px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-secondary, #4e5969);
}
.il-blocked__current { margin: 10px 0 0; font-size: 12px; color: var(--text-tertiary, #86909c); }
.il-blocked__current strong { color: var(--text-primary, #1f2329); font-weight: 600; }
.il-blocked .il-btn { margin-top: 14px; }

/* ───────────────────────── tab 条 ───────────────────────── */
.il-tabs {
  flex: none;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 18px;
  background: var(--bg-container, #fff);
  border-bottom: 1px solid var(--border-subtle, #ebeef5);
}
.il-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  font-size: 13px;
  color: var(--text-secondary, #4e5969);
  cursor: pointer;
}
.il-tab .il-ico { opacity: 0.8; }
.il-tab:hover { color: var(--el-color-primary, #409eff); }
.il-tab.is-on { color: var(--el-color-primary, #409eff); font-weight: 600; }
.il-tab.is-on::after {
  content: "";
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--el-color-primary, #409eff);
}
.il-tab__n {
  padding: 0 5px;
  border-radius: 7px;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10px;
  line-height: 15px;
  color: var(--text-tertiary, #86909c);
  background: var(--el-fill-color, #f5f7fa);
}
.il-tab.is-on .il-tab__n {
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-8, #d9ecff);
}
.il-tabs__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 11.5px;
  color: var(--text-tertiary, #86909c);
}

.il-state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  white-space: nowrap;
  color: var(--text-tertiary, #86909c);
}
.il-state.is-ok { color: var(--el-color-success-dark-2, #529b2e); }
.il-state.is-warn { color: var(--el-color-warning-dark-2, #b88230); }
.il-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex: none;
  background: var(--pulse-offline, #94a3b8);
}
.il-dot.is-ok { background: var(--status-success, #22c55e); }
.il-dot.is-warn,
.il-dot--warn { background: var(--status-warning, #f59e0b); }
.il-dot.is-err { background: var(--status-error, #ef4444); }

.il-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 19px;
  padding: 0 6px;
  border-radius: var(--el-border-radius-small, 4px);
  font-size: 10.5px;
  line-height: 1;
  white-space: nowrap;
  color: var(--text-secondary, #4e5969);
  background: var(--el-fill-color, #f5f7fa);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.il-tag--ok { color: var(--el-color-success-dark-2, #529b2e); background: var(--el-color-success-light-9, #f0f9eb); }
.il-tag--warn { color: var(--el-color-warning-dark-2, #b88230); background: var(--el-color-warning-light-9, #fdf6ec); }
.il-tag--err { color: var(--status-error-text, #b91c1c); background: var(--status-error-bg, #fef2f2); }
.il-tag--brand { color: var(--el-color-primary, #409eff); background: var(--el-color-primary-light-9, #ecf5ff); }
.il-tag--line {
  color: var(--text-tertiary, #86909c);
  background: transparent;
  border: 1px solid var(--el-border-color, #dcdfe6);
}
.il-tag--onphoto {
  height: auto;
  padding: 3px 6px;
  color: var(--el-color-white, #fff);
  background: rgba(15, 23, 42, 0.62);
  backdrop-filter: blur(4px);
}
.il-mono {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-variant-numeric: tabular-nums;
}
.il-dim { color: var(--text-tertiary, #86909c); }
.il-note { font-size: 10.5px; line-height: 1.6; color: var(--text-tertiary, #86909c); }

/* ───────────────────────── 上传进度 ───────────────────────── */
.il-uploadbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 18px;
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-bottom: 1px solid var(--el-color-primary-light-8, #d9ecff);
  font-size: 11.5px;
  color: var(--text-secondary, #4e5969);
}
.il-uploadbar__track {
  flex: 1;
  height: 4px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-color-primary-light-8, #d9ecff);
}
.il-uploadbar__track i {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: var(--el-color-primary, #409eff);
  transition: width 0.2s;
}
.il-uploadbar__text {
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-tertiary, #86909c);
}

/* ───────────────────────── 三栏骨架 ───────────────────────── */
.il-panel { flex: 1; min-height: 0; display: flex; }

.il-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary, #86909c);
}

.il-groups {
  flex: 0 0 214px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 10px;
  overflow: auto;
  background: var(--bg-container, #fff);
  border-right: 1px solid var(--border-subtle, #ebeef5);
}
.il-groups .il-eyebrow { padding: 0 5px; margin-bottom: 6px; }

.il-grp {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  font-size: 12.5px;
  color: var(--text-secondary, #4e5969);
  text-align: left;
  cursor: pointer;
}
.il-grp .il-ico { opacity: 0.75; }
.il-grp:hover { background: var(--bg-hover, #f5f7fa); color: var(--text-primary, #1f2329); }
.il-grp.is-on {
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  font-weight: 600;
}
.il-grp__name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.il-grp__n {
  margin-left: auto;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10.5px;
  color: var(--text-tertiary, #86909c);
  flex: none;
}
.il-grp.is-on .il-grp__n { color: var(--el-color-primary, #409eff); }

.il-grp-new {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 100%;
  height: 30px;
  margin-top: 6px;
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  font-size: 12px;
  color: var(--text-tertiary, #86909c);
  cursor: pointer;
}
.il-grp-new .il-ico { width: 12px; height: 12px; }
.il-grp-new:hover {
  color: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary-light-5, #a0cfff);
}

.il-groups__filters { margin-top: 14px; }
.il-grp-filter {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 0;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  font-size: 12.5px;
  color: var(--text-secondary, #4e5969);
  text-align: left;
  cursor: pointer;
}
.il-grp-filter .il-grp__n { margin-left: auto; }
.il-grp-filter:hover { background: var(--bg-hover, #f5f7fa); }
.il-grp-filter.is-on {
  background: var(--el-fill-color, #f5f7fa);
  color: var(--text-primary, #1f2329);
  font-weight: 600;
}

.il-groups__foot {
  margin-top: auto;
  padding: 10px 5px 0;
  border-top: 1px solid var(--border-subtle, #ebeef5);
}
.il-meter-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 11px;
  color: var(--text-tertiary, #86909c);
}
.il-meter-row b { color: var(--text-secondary, #4e5969); }
.il-meter {
  height: 4px;
  margin-bottom: 8px;
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-fill-color, #f5f7fa);
}
.il-meter i {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--brand-400, #60a5fa), var(--brand-500, #3b82f6));
  transition: width 0.3s;
}

/* ───────────────────────── 舞台 ───────────────────────── */
.il-stage {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--bg-page, #f6f7f9);
}
.il-viewbar {
  flex: none;
  height: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  background: var(--bg-container, #fff);
  border-bottom: 1px solid var(--border-subtle, #ebeef5);
}
.il-seg {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-sm, 6px);
  background: var(--el-fill-color, #f5f7fa);
}
.il-seg button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 9px;
  border: 0;
  border-radius: var(--el-border-radius-small, 4px);
  background: transparent;
  color: var(--text-secondary, #4e5969);
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}
.il-seg button .il-ico { width: 12px; height: 12px; }
.il-seg button:hover { color: var(--el-color-primary, #409eff); }
.il-seg button.is-on {
  background: var(--bg-container, #fff);
  color: var(--el-color-primary, #409eff);
  font-weight: 600;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.06));
}
.il-search {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 236px;
  height: 30px;
  padding: 0 9px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-container, #fff);
  color: var(--text-tertiary, #86909c);
}
.il-search .il-ico { width: 13px; height: 13px; }
.il-search__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: 12px;
  color: var(--text-primary, #1f2329);
}
.il-search__input::-webkit-search-cancel-button { display: none; }
.il-search__clear {
  width: 18px;
  height: 18px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--text-tertiary, #86909c);
  cursor: pointer;
}
.il-search__clear:hover { color: var(--text-primary, #1f2329); }
.il-search__clear .il-ico { width: 11px; height: 11px; }
.il-viewbar__right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: var(--text-tertiary, #86909c);
}

/* ───────────────────────── 台账 ───────────────────────── */
.il-tablearea {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bg-container, #fff);
}
.il-tblwrap { min-height: 100%; background: var(--bg-container, #fff); }
.il-tbl { width: 100%; border-collapse: collapse; }
.il-tbl thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  height: 34px;
  padding: 0 10px;
  text-align: left;
  white-space: nowrap;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-tertiary, #86909c);
  background: var(--bg-elevated, #fafbfc);
  border-bottom: 1px solid var(--border-subtle, #ebeef5);
}
.il-tbl tbody td {
  height: 44px;
  padding: 0 10px;
  font-size: 12px;
  vertical-align: middle;
  border-bottom: 1px solid var(--border-subtle, #ebeef5);
}
.il-tbl tbody tr.il-row { cursor: pointer; }
.il-tbl tbody tr.il-row:hover td,
.il-tbl tbody tr.il-row.is-on td { background: var(--el-color-primary-light-9, #ecf5ff); }
.il-tbl__ck { width: 34px; }
.il-tbl__acts { width: 104px; }

.il-ck {
  display: block;
  width: 13px;
  height: 13px;
  position: relative;
  border: 1px solid var(--el-border-color-dark, #d4d7de);
  border-radius: 3px;
  background: var(--bg-container, #fff);
  cursor: pointer;
}
.il-ck.is-on {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary, #409eff)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m5 13 4 4L19 7'/%3E%3C/svg%3E")
    center / 9px no-repeat;
}
.il-ck.is-partial {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-8, #d9ecff);
}
.il-ck.is-partial::after {
  content: "";
  position: absolute;
  left: 2px;
  right: 2px;
  top: 5px;
  height: 2px;
  border-radius: 1px;
  background: var(--el-color-primary, #409eff);
}

.il-grp-row td {
  height: 32px;
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-bottom: 1px solid var(--el-color-primary-light-8, #d9ecff);
  color: var(--el-color-primary, #409eff);
  font-size: 11.5px;
  font-weight: 600;
}
.il-grp-row .il-ico { width: 12px; height: 12px; vertical-align: -2px; margin-right: 5px; }
.il-grp-row__n {
  margin-left: 6px;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-weight: 400;
  opacity: 0.8;
}
.il-grp-row__r { float: right; font-weight: 400; opacity: 0.8; }

.il-row.is-skel td { padding: 8px 10px; }
.il-skel {
  display: block;
  height: 26px;
  border-radius: var(--radius-sm, 6px);
  background: var(--el-fill-color, #f5f7fa);
  animation: il-skel 1.4s ease-in-out infinite;
}
@keyframes il-skel {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

.il-file { display: flex; align-items: center; gap: 8px; min-width: 0; }
.il-file__ph {
  width: 30px;
  height: 30px;
  flex: none;
  border-radius: var(--el-border-radius-small, 4px);
  object-fit: cover;
  background: var(--el-fill-color, #f5f7fa);
}
.il-file__tx { min-width: 0; }
.il-file__tx b {
  display: block;
  max-width: 240px;
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-file__tx span {
  display: block;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10px;
  color: var(--text-tertiary, #86909c);
}
.il-tags {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  overflow: hidden;
}
.il-rowact { display: flex; gap: 2px; }

.il-iconbtn {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid transparent;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--text-tertiary, #86909c);
  cursor: pointer;
}
.il-iconbtn .il-ico { width: 13px; height: 13px; }
.il-iconbtn:hover:not(:disabled) {
  color: var(--el-color-primary, #409eff);
  border-color: var(--el-border-color, #dcdfe6);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.il-iconbtn:disabled { opacity: 0.4; cursor: not-allowed; }
.il-iconbtn.is-danger:hover:not(:disabled) {
  color: var(--status-error-text, #b91c1c);
  border-color: var(--status-error-border, #fecaca);
  background: var(--status-error-bg, #fef2f2);
}
.il-iconbtn.is-bordered { border-color: var(--el-border-color, #dcdfe6); }

.il-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 20px;
  text-align: center;
}
.il-empty__ico { width: 34px; height: 34px; color: var(--text-tertiary, #86909c); opacity: 0.6; }
.il-empty b { font-size: 13px; font-weight: 600; }
.il-empty span { font-size: 11.5px; color: var(--text-tertiary, #86909c); }
.il-empty .il-btn { margin-top: 4px; }
.il-empty--stage { position: absolute; inset: 0; }

.il-tblfoot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 42px;
  padding: 0 14px;
  background: var(--bg-container, #fff);
  border-top: 1px solid var(--border-subtle, #ebeef5);
  font-size: 11.5px;
  color: var(--text-tertiary, #86909c);
}
.il-tblfoot i { font-style: normal; }
.il-pager { margin-left: auto; display: flex; align-items: center; gap: 6px; }
.il-pager b {
  min-width: 22px;
  height: 22px;
  display: grid;
  place-items: center;
  border-radius: var(--el-border-radius-small, 4px);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 11px;
}
.il-pager .il-iconbtn { width: 22px; height: 22px; }
.il-pager .il-iconbtn .il-ico { width: 10px; height: 10px; }
.il-pager__size { font-size: 10.5px; color: var(--text-tertiary, #86909c); }

/* 批量条 */
.il-batchbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 44px;
  padding: 0 14px;
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-top: 1px solid var(--el-color-primary-light-8, #d9ecff);
}
.il-batchbar__count { font-size: 12px; font-weight: 600; color: var(--el-color-primary, #409eff); }
.il-batchbar__acts { margin-left: auto; display: flex; gap: 6px; }

/* ───────────────────────── 画布 ───────────────────────── */
.il-canvas {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px 14px;
  overflow: hidden;
}
.il-canvas__bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 9px;
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border-subtle, #ebeef5);
  border-radius: var(--radius-sm, 6px);
  background: var(--bg-container, #fff);
  font-size: 12px;
  min-width: 0;
}
.il-canvas__bar b {
  font-size: 12.5px;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-canvas__bar-right { margin-left: auto; display: flex; align-items: center; gap: 6px; flex: none; }
.il-canvas__bar-right .il-iconbtn { border-color: var(--el-border-color, #dcdfe6); }

.il-canvas__frame {
  position: relative;
  flex: 1;
  min-height: 180px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
  border: 1px solid var(--border-subtle, #ebeef5);
  background: var(--el-fill-color, #f5f7fa);
}
.il-canvas__img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.il-canvas__corner { position: absolute; left: 10px; top: 10px; display: flex; gap: 6px; }
.il-canvas__foot {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  color: var(--el-color-white, #fff);
  background: linear-gradient(to top, rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0));
  font-size: 12px;
}
.il-canvas__foot b { font-size: 13px; font-weight: 600; }
.il-canvas__foot span,
.il-canvas__foot br + span { font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace); font-size: 11px; opacity: 0.85; }
.il-canvas__foot-right { margin-left: auto; display: flex; gap: 6px; flex: none; }
.il-canvas__foot .il-tag { background: rgba(255, 255, 255, 0.18); color: var(--el-color-white, #fff); }

.il-canvas__meta {
  flex: none;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 1px solid var(--border-subtle, #ebeef5);
  border-radius: var(--radius-md, 10px);
  background: var(--bg-container, #fff);
  overflow: hidden;
}
.il-cell { min-width: 0; padding: 7px 11px; border-right: 1px solid var(--border-subtle, #ebeef5); }
.il-cell:nth-child(4n) { border-right: 0; }
.il-cell:nth-child(-n + 4) { border-bottom: 1px solid var(--border-subtle, #ebeef5); }
.il-cell span { display: block; font-size: 10px; color: var(--text-tertiary, #86909c); }
.il-cell b {
  display: block;
  font-size: 12px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-cell b.is-ok { color: var(--el-color-success-dark-2, #529b2e); }
.il-cell b.is-warn { color: var(--el-color-warning-dark-2, #b88230); }

.il-canvas__acts { flex: none; display: flex; align-items: center; gap: 8px; }
.il-canvas__acts-note { margin-left: auto; font-size: 11px; color: var(--text-tertiary, #86909c); }

.il-canvas__film {
  flex: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 8px;
  max-height: 136px;
  overflow: auto;
  padding-bottom: 2px;
}
.il-film {
  padding: 0;
  border: 1px solid var(--border-subtle, #ebeef5);
  border-radius: var(--radius-sm, 6px);
  overflow: hidden;
  background: var(--bg-container, #fff);
  cursor: pointer;
}
.il-film__ph { display: block; width: 100%; aspect-ratio: 1 / 1; object-fit: cover; }
.il-film__cap {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  padding: 3px 6px;
  font-size: 10px;
  color: var(--text-tertiary, #86909c);
}
.il-film__cap b {
  min-width: 0;
  font-weight: 500;
  color: var(--text-secondary, #4e5969);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-film__cap span { flex: none; }
.il-film:hover { border-color: var(--el-color-primary-light-5, #a0cfff); }
.il-film.is-on {
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 2px var(--el-color-primary-light-8, #d9ecff);
}

/* ───────────────────────── 检查器 ───────────────────────── */
.il-insp {
  flex: 0 0 296px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px 14px;
  overflow: auto;
  background: var(--bg-container, #fff);
  border-left: 1px solid var(--border-subtle, #ebeef5);
}
.il-insp__preview {
  margin-top: 8px;
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, #ebeef5);
  overflow: hidden;
  background: var(--el-fill-color, #f5f7fa);
}
.il-insp__preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
.il-insp__name {
  margin-top: 9px;
  font-size: 12.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-insp__path {
  margin-top: 2px;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10.5px;
  color: var(--text-tertiary, #86909c);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-insp__kv { margin-top: 9px; border-top: 1px solid var(--border-subtle, #ebeef5); }
.il-insp__kv div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  padding: 5px 0;
  border-bottom: 1px solid var(--border-subtle, #ebeef5);
  font-size: 11px;
  color: var(--text-tertiary, #86909c);
}
.il-insp__kv b {
  max-width: 62%;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10.5px;
  font-weight: 500;
  color: var(--text-primary, #1f2329);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-insp__feat {
  margin-top: 10px;
  padding: 9px 10px;
  border: 1px solid var(--el-color-primary-light-8, #d9ecff);
  border-radius: var(--radius-sm, 6px);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.il-insp__feat-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.il-insp__feat code {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10px;
  color: var(--el-color-primary, #409eff);
}
.il-insp__feat p {
  margin: 4px 0 0;
  font-size: 10px;
  color: var(--text-tertiary, #86909c);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-insp__acts { margin-top: 10px; display: flex; gap: 6px; }
.il-insp__acts .il-btn { flex: 1; padding: 0 6px; }
.il-insp__acts .il-btn--icon { flex: none; width: 26px; }
.il-insp__hint { margin-top: 9px; font-size: 10px; line-height: 1.6; color: var(--text-tertiary, #86909c); }
.il-insp__empty {
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  font-size: 11.5px;
  color: var(--text-tertiary, #86909c);
}
.il-insp__empty .il-ico { width: 26px; height: 26px; opacity: 0.6; }

/* ───────────────────────── 特征空间（示意） ───────────────────────── */
.il-spacewrap { flex: 1; min-height: 0; display: flex; }
.il-space {
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 12px 14px 14px;
  border-radius: var(--radius-lg, 14px);
  overflow: hidden;
  background:
    radial-gradient(circle at 42% 46%, rgba(59, 130, 246, 0.16), transparent 58%),
    var(--terminal-bg, #0f172a);
  border: 1px solid rgba(59, 130, 246, 0.22);
}
.il-space__empty {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}
.il-space__empty .il-ico { width: 34px; height: 34px; opacity: 0.7; }
.il-space__empty b { font-size: 13px; color: rgba(255, 255, 255, 0.85); }
.il-space__empty span { font-size: 11.5px; }

.il-space__dots { position: absolute; inset: 0; }
.il-space__dots i {
  position: absolute;
  width: 2px;
  height: 2px;
  border-radius: 50%;
  background: rgba(147, 197, 253, 0.34);
}

.il-space__blob {
  position: absolute;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed rgba(96, 165, 250, 0.28);
  background: radial-gradient(circle, rgba(59, 130, 246, 0.1), transparent 70%);
}
.il-space__blob.is-tone-2 {
  border-color: rgba(245, 158, 11, 0.34);
  background: radial-gradient(circle, rgba(245, 158, 11, 0.1), transparent 70%);
}
.il-space__blob-label {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.62);
}
.il-space__blob-label i {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brand-300, #93c5fd);
}
.il-space__blob.is-tone-2 .il-space__blob-label i { background: var(--status-warning, #f59e0b); }
.il-space__blob-label b {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 11px;
  color: var(--el-color-white, #fff);
}

.il-space__links {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.il-space__links line { stroke: var(--brand-400, #60a5fa); stroke-width: 1; }

.il-node { position: absolute; width: 0; height: 0; }
.il-node__ph {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  border-radius: var(--radius-sm, 6px);
  overflow: hidden;
  border: 1px solid rgba(147, 197, 253, 0.55);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.6);
  background: rgba(255, 255, 255, 0.06);
}
.il-node__ph img { display: block; width: 100%; height: 100%; object-fit: cover; }
.il-node__lb {
  position: absolute;
  left: 0;
  top: 27px;
  transform: translateX(-50%);
  text-align: center;
  white-space: nowrap;
}
.il-node__lb b {
  display: block;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 10px;
  color: var(--brand-300, #93c5fd);
}
.il-node__lb span {
  display: block;
  max-width: 96px;
  margin: 0 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.55);
}
.il-node.is-warn .il-node__ph { border-color: rgba(245, 158, 11, 0.55); }
.il-node.is-warn .il-node__lb b { color: var(--status-warning, #f59e0b); }
.il-node.is-dup .il-node__ph { border-color: rgba(239, 68, 68, 0.6); }
.il-node.is-dup .il-node__lb b { color: var(--status-error, #ef4444); }

.il-space__ov {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 10.5px;
  color: rgba(255, 255, 255, 0.7);
}
.il-space__ov--tl { left: 14px; top: 14px; }
.il-space__ov--bl { left: 14px; bottom: 14px; }
.il-glass {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 9px;
  border-radius: var(--radius-sm, 6px);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);
}
.il-glass .il-ico { width: 12px; height: 12px; }
.il-glass b { font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace); color: var(--el-color-white, #fff); }
.il-legend { display: flex; gap: 12px; flex-wrap: wrap; }
.il-legend span { display: inline-flex; align-items: center; gap: 5px; }
.il-legend i { width: 6px; height: 6px; border-radius: 1px; display: inline-block; }
.il-legend em {
  font-style: normal;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  color: var(--el-color-white, #fff);
}

.il-space__panel {
  position: absolute;
  right: 14px;
  top: 14px;
  width: 268px;
  max-height: calc(100% - 28px);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 12px;
  border-radius: var(--radius-md, 10px);
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
}
.il-space__panel .il-eyebrow { color: rgba(255, 255, 255, 0.45); }
.il-sp-head { display: flex; align-items: center; gap: 8px; }
.il-sp-head__ph {
  width: 34px;
  height: 34px;
  flex: none;
  border-radius: var(--el-border-radius-small, 4px);
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
}
.il-sp-head__ph img { display: block; width: 100%; height: 100%; object-fit: cover; }
.il-sp-head b { display: block; font-size: 12px; color: var(--el-color-white, #fff); }
.il-sp-head span { font-size: 10px; }
.il-sp-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.il-sp-stats div {
  padding: 6px 7px;
  border-radius: var(--el-border-radius-small, 4px);
  background: rgba(255, 255, 255, 0.05);
  min-width: 0;
}
.il-sp-stats span { display: block; font-size: 9.5px; opacity: 0.7; }
.il-sp-stats b {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 13px;
  color: var(--el-color-white, #fff);
}
.il-sp-stats i { font-style: normal; font-size: 9.5px; font-weight: 400; opacity: 0.6; }
.il-sp-sec { display: flex; justify-content: space-between; gap: 8px; font-size: 10px; opacity: 0.65; }
.il-sp-top { display: flex; align-items: center; gap: 7px; }
.il-sp-top__n {
  width: 15px;
  height: 15px;
  display: grid;
  place-items: center;
  flex: none;
  border-radius: 4px;
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 9px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--el-color-white, #fff);
}
.il-sp-top__nm { flex: 1; min-width: 0; font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.il-sp-top__sc { font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace); }
.il-sp-top__sc.is-warn { color: var(--status-warning, #f59e0b); }
.il-sp-top__sc.is-err { color: var(--status-error, #ef4444); }
.il-sp-note { margin: 0; font-size: 10px; line-height: 1.6; color: rgba(255, 255, 255, 0.55); }
.il-sp-acts { display: flex; gap: 6px; }
.il-sp-acts .il-btn {
  flex: 1;
  height: 27px;
  padding: 0 6px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.14);
}
.il-sp-acts .il-btn:hover:not(:disabled) {
  color: var(--el-color-white, #fff);
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.22);
}
.il-sp-acts .il-btn--primary {
  color: var(--el-color-white, #fff);
  background: var(--el-color-primary, #409eff);
  border-color: var(--el-color-primary, #409eff);
}
.il-sp-meta { display: flex; justify-content: space-between; gap: 8px; font-size: 9.5px; opacity: 0.6; }
.il-space__footnote {
  position: absolute;
  left: 50%;
  bottom: 14px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: calc(100% - 340px);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}
.il-space__footnote .il-ico { width: 11px; height: 11px; flex: none; }

/* ───────────────────────── 窄屏 ───────────────────────── */
@media (max-width: 1180px) {
  .il-groups { flex-basis: 188px; }
  .il-insp { flex-basis: 252px; }
  .il-canvas__meta { grid-template-columns: repeat(2, 1fr); }
  .il-cell:nth-child(4n) { border-right: 1px solid var(--border-subtle, #ebeef5); }
  .il-cell:nth-child(2n) { border-right: 0; }
  .il-cell:nth-child(-n + 4) { border-bottom: 1px solid var(--border-subtle, #ebeef5); }
  .il-cell:nth-child(n + 7) { border-bottom: 0; }
  .il-space__footnote { display: none; }
}

@media (prefers-reduced-motion: reduce) {
  .il-btn,
  .il-meter i,
  .il-uploadbar__track i { transition: none; }
  .il-skel { animation: none; }
}
</style>
