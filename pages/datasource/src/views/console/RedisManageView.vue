<template>
  <div class="dsm tel-page" :class="{ resizing }">
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="Coin" :size="18" class="dsm-title-icon dsm-redis-icon" />
        <span class="dsm-title">Redis 缓存管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <div class="dsm-db-select" data-testid="dsm-db-select">
          <ReSelect
            v-model="activeDb"
            :options="dbOptions"
            :disabled="databases.length === 0"
            :placeholder="databases.length ? '选择逻辑库' : (gap ? '未读取到库' : '—')"
            filterable
            @change="onDbChange"
          />
        </div>
        <ReButton layout="square" icon="Connection" tip="测试连接" data-testid="dsm-btn-test" :disabled="!source" :loading="testing" @click="testConnection" />
        <ReButton layout="square" icon="InfoFilled" tip="服务器信息" data-testid="dsm-btn-info" :disabled="!source" @click="openInfo" />
        <ReButton layout="square" icon="Refresh" tip="刷新" data-testid="dsm-btn-refresh" :loading="loading" @click="refresh" />
        <ReButton layout="square" type="primary" icon="Plus" tip="新建键" data-testid="dsm-btn-create" :disabled="!source" @click="openCreate" />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <div class="dsm-body">
      <div class="dsm-sidebar" :style="{ width: leftWidth + 'px' }">
        <!-- 键搜索 -->
        <div class="dsm-search-section">
          <ReInput v-model="pattern" placeholder="匹配模式，如 user:*" @keyup.enter="reloadKeys" />
          <ReButton type="primary" :loading="loading" @click="reloadKeys"><template #icon><ReIcon name="Search" size="12" /></template>查询</ReButton>
        </div>

        <!-- 视图切换：平铺 / 树形 -->
        <div class="dsm-view-bar">
          <span class="dsm-view-count">{{ keys.length }} 键</span>
          <span class="dsm-view-spacer" />
          <ReButton
            layout="square"
            icon="Grid"
            tip="平铺"
            data-testid="dsm-view-flat"
            :type="viewMode === 'flat' ? 'primary' : ''"
            @click="viewMode = 'flat'"
          />
          <ReButton
            layout="square"
            icon="Share"
            tip="树形"
            data-testid="dsm-view-tree"
            :type="viewMode === 'tree' ? 'primary' : ''"
            @click="viewMode = 'tree'"
          />
        </div>

        <!-- 键列表（平铺 / 树形）；顶部细扫描条 = 静默刷新中（删空集合/目录后自动重扫） -->
        <div class="dsm-key-list">
          <div class="dsm-scan-bar" :class="{ 'is-active': loading }" data-testid="dsm-scan-bar"><span /></div>
          <template v-if="viewMode === 'flat'">
            <div
              v-for="row in keys"
              :key="'k:' + row.key"
              class="dsm-tree-node"
              :class="{ active: activeKey === row.key }"
              @click="selectKey(row.key)"
            >
              <ReIcon name="Document" size="13" class="dsm-tree-icon" />
              <span class="dsm-tree-label" :title="row.key">{{ row.key }}</span>
              <ReTag :type="typeTagType(row.type)">{{ row.type }}</ReTag>
              <!-- 悬停工具条：复制键名 / 删除（点击不触发行选中） -->
              <div class="dsm-row-actions" data-testid="dsm-row-actions" @click.stop>
                <ReButton layout="square" size="small" icon="CopyDocument" tip="复制键名" data-testid="dsm-row-copy" @click="copyKeyName(row.key)" />
                <ReButton layout="square" size="small" icon="Delete" tip="删除" data-testid="dsm-row-delete" @click="confirmDeleteKey(row.key)" />
              </div>
            </div>
          </template>
          <template v-else>
            <div
              v-for="row in treeRows"
              :key="'tr:' + row.kind + ':' + row.path"
              class="dsm-tree-node"
              :class="{ 'is-dir': row.kind === 'dir', active: row.kind === 'leaf' && activeKey === row.path }"
              :style="{ paddingLeft: `${12 + row.depth * 14}px` }"
              @click="onTreeRowClick(row)"
            >
              <ReIcon
                v-if="row.kind === 'dir'"
                :name="row.expanded ? 'ArrowDown' : 'ArrowRight'"
                size="12"
                class="dsm-tree-icon dsm-tree-caret"
              />
              <!-- 目录图标：展开 FolderOpened / 收起 Folder -->
              <ReIcon
                v-if="row.kind === 'dir'"
                :name="row.expanded ? 'FolderOpened' : 'Folder'"
                size="13"
                class="dsm-tree-icon dsm-tree-folder"
              />
              <ReIcon v-else name="Document" size="13" class="dsm-tree-icon" />
              <span class="dsm-tree-label" :title="row.path">{{ row.name }}</span>
              <ReTag v-if="row.kind === 'leaf' && row.item" :type="typeTagType(row.item.type)">{{ row.item.type }}</ReTag>
              <!-- 悬停工具条：目录=整目录删除（级联删全部子键），叶子=复制/删除 -->
              <div class="dsm-row-actions" data-testid="dsm-row-actions" @click.stop>
                <template v-if="row.kind === 'dir'">
                  <ReButton
                    layout="square"
                    size="small"
                    type="danger"
                    icon="Delete"
                    tip="删除目录下全部键"
                    data-testid="dsm-row-delete-dir"
                    @click="confirmDeleteDir(row.path)"
                  />
                </template>
                <template v-else>
                  <ReButton layout="square" size="small" icon="CopyDocument" tip="复制键名" data-testid="dsm-row-copy" @click="copyKeyName(row.path)" />
                  <ReButton layout="square" size="small" icon="Delete" tip="删除" data-testid="dsm-row-delete" @click="confirmDeleteKey(row.path)" />
                </template>
              </div>
            </div>
          </template>
          <div v-if="keys.length === 0" class="dsm-tree-node">
            <span class="dsm-tree-label">{{ gap ? "未读取到键" : "该模式下暂无键" }}</span>
          </div>
          <div v-if="nextCursor !== '0'" class="dsm-load-more">
            <ReButton text :loading="loading" @click="loadMore"><template #icon><ReIcon name="ArrowDown" size="12" /></template>加载更多（已加载 {{ keys.length }}）</ReButton>
          </div>
        </div>
      </div>

      <!-- 拖拽调节左右宽度 -->
      <div class="dsm-split" :class="{ active: resizing }" title="拖拽调节宽度" @mousedown.prevent="startResize" />

      <div class="dsm-content">
        <!-- 工作区切换：键详情 / 命令控制台（dsm-seg 分段，与字符串视图同一风格） -->
        <div class="dsm-content-bar">
          <div class="dsm-seg" data-testid="dsm-console-views" role="group" aria-label="工作区">
            <button type="button" :class="{ 'is-active': consoleMode === 'detail' }" data-testid="dsm-console-detail" @click="consoleMode = 'detail'">
              <ReIcon name="Document" size="12" />键详情
            </button>
            <button type="button" :class="{ 'is-active': consoleMode === 'command' }" data-testid="dsm-console-command" @click="consoleMode = 'command'">
              <ReIcon name="Terminal" size="12" />命令控制台
            </button>
          </div>
        </div>

        <!-- 命令控制台：任意 Redis 命令（JSON.GET / TS.RANGE / GEOSEARCH 等模块命令的通用通道） -->
        <div v-if="consoleMode === 'command'" class="dsm-command-panel" data-testid="dsm-command-panel">
          <div class="dsm-command-actions">
            <ReButton layout="square" type="primary" icon="VideoPlay" tip="执行（Ctrl+Enter）" data-testid="dsm-btn-run-command" :disabled="!source || !commandText.trim()" :loading="commandRunning" @click="runCommand" />
            <ReButton layout="square" icon="Delete" tip="清空编辑器" data-testid="dsm-btn-clear-command" :disabled="!commandText" @click="clearCommand" />
            <span class="dsm-command-hint">支持任意命令：JSON.GET / TS.RANGE / GEOSEARCH 等；危险命令由服务端拒绝</span>
          </div>
          <DbSqlEditor v-model="commandText" language="redis" data-testid="dsm-redis-editor" @execute="runCommand" />
          <!-- 服务端拒绝 / 网络错误 -->
          <div v-if="commandError" class="dsm-command-error" data-testid="dsm-command-error">{{ commandError }}</div>
          <!-- 结果区：按回复形态渲染（标量 / JSON 美化 / 键值表 / 通用表） -->
          <div v-if="commandResult" class="dsm-command-result" data-testid="dsm-command-result">
            <div class="dsm-data-title">
              执行结果
              <div class="dsm-section-actions">
                <ReButton layout="square" icon="CopyDocument" tip="复制结果" data-testid="dsm-btn-copy-result" @click="copyResult" />
              </div>
            </div>
            <pre v-if="resultView.kind === 'scalar'" class="dsm-reply-pre">{{ resultView.text }}</pre>
            <pre v-else-if="resultView.kind === 'json'" class="dsm-reply-pre" data-testid="dsm-reply-json">{{ resultView.text }}</pre>
            <div v-else-if="resultView.kind === 'nil'" class="dsm-reply-nil" data-testid="dsm-reply-nil">nil</div>
            <div v-else class="dsm-table-wrap">
              <ReTable :data="resultView.rows" :columns="resultView.columns" :pagination="false" stripe border height="240px" />
            </div>
          </div>
        </div>

        <!-- 键详情工作区 -->
        <template v-else>
        <!-- 卡片视觉（圆角/透明边框/双层投影）走 re-surface 统一底座 -->
        <div class="dsm-info-card re-surface">
          <div class="dsm-info-row"><span class="dsm-info-label">数据源</span><span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">连接地址</span><span class="dsm-info-value mono">{{ source ? `${source.host || "127.0.0.1"}:${source.port || 6379}` : "—" }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">当前库</span><span class="dsm-info-value mono">db{{ activeDb }}</span></div>
          <div class="dsm-info-row"><span class="dsm-info-label">本批键数</span><span class="dsm-info-value mono">{{ keys.length }}{{ nextCursor !== "0" ? "（还有更多）" : "" }}</span></div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <ReTag :type="gap ? 'danger' : 'success'">{{ gap ? "读取失败" : "正常" }}</ReTag>
          </div>
          <div class="dsm-info-row"><span class="dsm-info-label">服务端版本</span><span class="dsm-info-value mono">{{ info.redis_version || "未探测" }}</span></div>
        </div>

        <!-- 未选择键：value 区空态（el-empty） -->
        <div v-if="!activeKey" class="dsm-section dsm-value-empty" data-testid="dsm-value-empty">
          <el-empty description="暂无数据" :image-size="72" />
        </div>

        <!-- 键详情 -->
        <div v-if="activeKey" class="dsm-section">
          <div class="dsm-section-title">
            键详情 - {{ activeKey }}
            <div class="dsm-section-actions">
              <ReButton text @click="openExpire"><template #icon><ReIcon name="Timer" size="12" /></template>设置 TTL</ReButton>
            </div>
          </div>
          <template v-if="detail">
            <div class="dsm-node-detail">
              <div class="dsm-detail-row"><span class="dsm-detail-label">键名</span><span class="dsm-detail-value mono">{{ detail.key }}</span></div>
              <div class="dsm-detail-row">
                <span class="dsm-detail-label">类型</span>
                <ReTag :type="typeTagType(detail.type)">{{ detail.type }}</ReTag>
              </div>
              <div class="dsm-detail-row"><span class="dsm-detail-label">TTL</span><span class="dsm-detail-value mono" data-testid="dsm-detail-ttl">{{ ttlCountdown !== null ? `${ttlCountdown} 秒` : formatTtl(detail.ttl) }}</span></div>
              <div class="dsm-detail-row"><span class="dsm-detail-label">{{ detail.type === "STRING" ? "字符数" : "元素数" }}</span><span class="dsm-detail-value mono">{{ detail.size }}</span></div>
            </div>

            <!-- STRING -->
            <div v-if="detail.type === 'STRING'" class="dsm-data-section">
              <div class="dsm-data-title">
                值
                <div class="dsm-section-actions">
                  <div class="dsm-seg" data-testid="dsm-string-views">
                    <button type="button" :class="{ 'is-active': stringView === 'text' }" data-testid="dsm-view-text" @click="setStringView('text')">
                      <ReIcon name="Document" size="12" />字符串
                    </button>
                    <button type="button" :class="{ 'is-active': stringView === 'hex' }" data-testid="dsm-view-hex" @click="setStringView('hex')">
                      <ReIcon name="Coin" size="12" />HEX
                    </button>
                    <button type="button" :class="{ 'is-active': stringView === 'json' }" data-testid="dsm-view-json" @click="setStringView('json')">
                      <ReIcon name="Files" size="12" />JSON
                    </button>
                  </div>
                  <!-- 保存：字符串 / JSON 可保存，HEX 为只读字节视图不可保存。本轮补 tip：
                       与工具栏/行内 square 按钮同一契约（aria-label=保存值） -->
                  <ReButton layout="square" icon="Save" tip="保存值" v-if="stringView !== 'hex'" type="primary" :loading="saving" data-testid="dsm-btn-save" @click="saveStringValue" />
                </div>
              </div>
              <textarea
                v-if="stringView === 'text'"
                v-model="stringValue"
                class="dsm-node-data dsm-fill"
                rows="8"
                placeholder="UTF-8 文本"
                data-testid="dsm-input-string"
              />
              <pre v-else-if="stringView === 'hex'" class="dsm-data-content dsm-value-view dsm-fill" data-testid="dsm-value-hex">{{ hexViewText }}</pre>
              <!-- JSON：高亮层（只读，pointer-events:none）+ 透明文字编辑层叠加，编辑与高亮同源 jsonEdit -->
              <div v-else class="dsm-json-editor dsm-fill" data-testid="dsm-value-json">
                <pre class="dsm-json-hl dsm-value-view" data-testid="dsm-json-hl" aria-hidden="true" v-html="jsonHtml" />
                <textarea
                  v-model="jsonEdit"
                  class="dsm-node-data dsm-json-input"
                  rows="8"
                  spellcheck="false"
                  data-testid="dsm-input-json"
                  @scroll="syncJsonScroll"
                />
              </div>
            </div>

            <!-- HASH -->
            <div v-else-if="detail.type === 'HASH'" class="dsm-data-section">
              <div class="dsm-data-title">字段（{{ hashFields.length }}）</div>
              <div class="dsm-add-row">
                <ReInput v-model="newHashField" placeholder="字段名" />
                <ReInput v-model="newHashValue" placeholder="值" />
                <ReButton type="primary" :loading="saving" @click="addHashField"><template #icon><ReIcon name="Plus" size="12" /></template>添加字段</ReButton>
              </div>
              <div class="dsm-table-wrap">
                <ReTable :data="hashFields" :columns="hashColumns" :pagination="false" stripe border>
                  <template #col-actions="{ row }">
                    <div class="dsm-cell-actions">
                      <ReButton layout="square" size="small" icon="Edit" tip="编辑字段" data-testid="dsm-cell-edit" @click="editHashField((row as RedisHashField).field, (row as RedisHashField).value)" />
                      <ReButton layout="square" size="small" icon="Delete" tip="删除字段" data-testid="dsm-cell-del" @click="removeHashField((row as RedisHashField).field)" />
                    </div>
                  </template>
                </ReTable>
              </div>
            </div>

            <!-- LIST -->
            <div v-else-if="detail.type === 'LIST'" class="dsm-data-section">
              <div class="dsm-data-title">元素（{{ listRows.length }}）</div>
              <div class="dsm-add-row">
                <ReInput v-model="newListValue" placeholder="新元素" class="dsm-add-grow" />
                <ReButton type="primary" :loading="saving" @click="pushListElement"><template #icon><ReIcon name="Plus" size="12" /></template>追加元素</ReButton>
              </div>
              <div class="dsm-table-wrap">
                <ReTable :data="listRows" :columns="listColumns" :pagination="false" stripe border>
                  <template #col-actions="{ row }">
                    <div class="dsm-cell-actions">
                      <ReButton layout="square" size="small" icon="Edit" tip="编辑元素" data-testid="dsm-cell-edit" @click="editListElement((row as ListRow).index, (row as ListRow).value)" />
                      <ReButton layout="square" size="small" icon="Delete" tip="删除元素" data-testid="dsm-cell-del" @click="removeListElement((row as ListRow).index)" />
                    </div>
                  </template>
                </ReTable>
              </div>
            </div>

            <!-- SET -->
            <div v-else-if="detail.type === 'SET'" class="dsm-data-section">
              <div class="dsm-data-title">成员（{{ setRows.length }}）</div>
              <div class="dsm-add-row">
                <ReInput v-model="newSetMember" placeholder="新成员" class="dsm-add-grow" />
                <ReButton type="primary" :loading="saving" @click="addSetMember"><template #icon><ReIcon name="Plus" size="12" /></template>添加成员</ReButton>
              </div>
              <div class="dsm-table-wrap">
                <ReTable :data="setRows" :columns="memberColumns" :pagination="false" stripe border>
                  <template #col-member="{ row }"><span class="mono">{{ (row as MemberRow).member }}</span></template>
                  <template #col-actions="{ row }">
                    <div class="dsm-cell-actions">
                      <ReButton layout="square" size="small" icon="Edit" tip="编辑成员" data-testid="dsm-cell-edit" @click="editSetMember((row as MemberRow).member)" />
                      <ReButton layout="square" size="small" icon="Delete" tip="删除成员" data-testid="dsm-cell-del" @click="removeSetMember((row as MemberRow).member)" />
                    </div>
                  </template>
                </ReTable>
              </div>
            </div>

            <!-- ZSET -->
            <div v-else-if="detail.type === 'ZSET'" class="dsm-data-section">
              <div class="dsm-data-title">成员（{{ zsetRows.length }}）</div>
              <div class="dsm-add-row">
                <ReInput v-model="newZsetMember" placeholder="成员" />
                <ReInput v-model="newZsetScore" placeholder="分值，如 1" class="dsm-add-narrow" />
                <ReButton type="primary" :loading="saving" @click="addZsetMember"><template #icon><ReIcon name="Plus" size="12" /></template>添加成员</ReButton>
              </div>
              <div class="dsm-table-wrap">
                <ReTable :data="zsetRows" :columns="zsetColumns" :pagination="false" stripe border>
                  <template #col-score="{ row }"><span class="mono">{{ (row as MemberRow).score }}</span></template>
                  <template #col-actions="{ row }">
                    <div class="dsm-cell-actions">
                      <ReButton layout="square" size="small" icon="Edit" tip="编辑分值" data-testid="dsm-cell-edit" @click="editZsetScore((row as MemberRow).member, (row as MemberRow).score ?? 0)" />
                      <ReButton layout="square" size="small" icon="Delete" tip="删除成员" data-testid="dsm-cell-del" @click="removeZsetMember((row as MemberRow).member)" />
                    </div>
                  </template>
                </ReTable>
              </div>
            </div>

            <!-- STREAM -->
            <div v-else-if="detail.type === 'STREAM'" class="dsm-data-section">
              <div class="dsm-data-title">消息（{{ streamEntries.length }}）</div>
              <div class="dsm-add-row">
                <ReInput v-model="newStreamField" placeholder="字段名" />
                <ReInput v-model="newStreamValue" placeholder="值" />
                <ReButton type="primary" :loading="saving" @click="appendStreamEntry"><template #icon><ReIcon name="Plus" size="12" /></template>追加消息</ReButton>
              </div>
              <div class="dsm-table-wrap">
                <ReTable :data="streamEntries" :columns="streamColumns" :pagination="false" stripe border>
                  <template #col-id="{ row }"><span class="mono">{{ (row as RedisStreamEntry).id }}</span></template>
                  <template #col-fields="{ row }">
                    <span v-for="(f, fi) in (row as RedisStreamEntry).fields" :key="fi" class="dsm-stream-field">
                      <ReTag type="info">{{ f.field }}</ReTag>
                      <span class="mono">{{ f.value }}</span>
                    </span>
                  </template>
                </ReTable>
              </div>
            </div>

            <!-- 其他类型 -->
            <div v-else class="dsm-data-section">
              <div class="dsm-data-title">值</div>
              <pre class="dsm-data-content dsm-fill">{{ formatPlainValue(detail.value) }}</pre>
            </div>
          </template>
          <div v-else class="dsm-empty-inline">正在读取…</div>
        </div>
        </template>
      </div>
    </div>

    <!-- 新建键弹窗 -->
    <ReDialog v-model="createVisible" title="新建键" width="620px">
      <div class="dsm-node-form">
        <div class="dsm-form-item">
          <label>键名</label>
          <ReInput v-model="createForm.key" placeholder="如 user:1001" />
        </div>
        <div class="dsm-form-item">
          <label>类型</label>
          <ReSelect v-model="createForm.type" :options="KEY_TYPE_OPTIONS" data-testid="dsm-create-type" style="width: 100%" />
        </div>
        <div class="dsm-form-item">
          <label>TTL（秒，0 或留空表示永久）</label>
          <ReInput v-model="createForm.ttl" placeholder="0 = 永久" />
        </div>
        <div class="dsm-form-item">
          <label>{{ createValueLabel }}</label>
          <textarea v-model="createForm.value" class="dsm-node-data" rows="8" :placeholder="createValuePlaceholder"></textarea>
          <span class="dsm-form-hint">{{ createValueHint }}</span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="createVisible = false"><template #icon><ReIcon name="Close" size="12" /></template>取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submitCreate"><template #icon><ReIcon name="Check" /></template>创建</ReButton>
      </template>
    </ReDialog>

    <!-- 服务器信息弹窗 -->
    <ReDialog v-model="infoVisible" title="Redis 服务器信息" width="720px">
      <ReTable :data="infoRows" :columns="infoColumns" :pagination="false" stripe border height="420px" />
      <template #footer>
        <ReButton @click="infoVisible = false"><template #icon><ReIcon name="Close" size="12" /></template>关闭</ReButton>
        <ReButton type="primary" :loading="infoLoading" @click="reloadInfo"><template #icon><ReIcon name="Refresh" /></template>刷新</ReButton>
      </template>
    </ReDialog>

    <!-- 设置 TTL 弹窗 -->
    <ReDialog v-model="ttlVisible" title="设置 TTL" width="440px">
      <div class="dsm-node-form">
        <div class="dsm-form-item">
          <label>过期秒数（-1 永久）</label>
          <ReInput v-model="ttlValue" placeholder="如 300；-1 表示永久" />
        </div>
      </div>
      <template #footer>
        <ReButton @click="ttlVisible = false"><template #icon><ReIcon name="Close" size="12" /></template>取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="submitExpire"><template #icon><ReIcon name="Check" /></template>设置</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Redis 数据源管理页（datasourceId 版控制台）。
 *
 * <p>只读取与操作「数据源管理」里登记的 Redis 数据源（type=redis），
 * 后端走 {@code /ms/monitor/redis-manage}，每次请求临时建连。与应用自身
 * Redis（{@code /ms/monitor/system/redis}）无关，也不依赖任何演示数据。</p>
 *
 * <p>旧的 {@code /redis} 监控页已退役，本页路由为 {@code /redis-manage}。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { copyToClipboard } from "../../utils/clipboard";
import DbSqlEditor from "../../components/console/DbSqlEditor.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import { testDataSource } from "../../api";
import {
  createRedisKey,
  deleteRedisKeys,
  executeRedisCommand,
  expireRedisKey,
  fetchRedisDatabases,
  fetchRedisInfo,
  fetchRedisKey,
  hdelRedisField,
  hsetRedisField,
  lremRedisIndex,
  lsetRedisElement,
  rpushRedisElement,
  saddRedisMember,
  scanRedisKeys,
  setRedisString,
  sremRedisMember,
  xaddRedisStream,
  zaddRedisMember,
  zremRedisMember,
  type RedisCommandResult,
  type RedisHashField,
  type RedisKeyDetail,
  type RedisKeyItem,
  type RedisMemberScore,
  type RedisStreamEntry,
} from "../../api/redisManageApi";

defineOptions({ name: "RedisManageView" });

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 可新建的键类型（STREAM 需先有键，不提供空建） */
const KEY_TYPES = ["STRING", "HASH", "LIST", "SET", "ZSET"];
/** 新建键类型下拉选项（ReSelect 统一控件） */
const KEY_TYPE_OPTIONS = KEY_TYPES.map(t => ({ label: t, value: t }));

/** LIST 表行 */
interface ListRow {
  [key: string]: unknown;
  index: number;
  value: string;
}
/** SET/ZSET 表行 */
interface MemberRow {
  [key: string]: unknown;
  member: string;
  score?: number;
}

const loading = ref(false);
const testing = ref(false);
const saving = ref(false);
const activeDb = ref(0);
const activeKey = ref("");
const pattern = ref("*");
const keys = ref<RedisKeyItem[]>([]);
/** SCAN 游标，"0" 表示扫完 */
const nextCursor = ref("0");
/** 键列表视图：平铺 / 树形（沿用旧 /redis 页的 localStorage 键） */
/** 视图模式：每次进入控制台默认平铺（不恢复上次树形，2026-10-07 需求） */
const viewMode = ref<"flat" | "tree">("flat");

/** 侧栏宽度持久化键（沿用旧 /redis 页） */
const LEFT_WIDTH_KEY = "redis-left-width";
/** 侧栏宽度（拖拽调节，记录到 localStorage） */
const leftWidth = ref<number>(Number(localStorage.getItem(LEFT_WIDTH_KEY)) || 340);
/** 是否正在拖拽（拖拽中禁用文本选择） */
const resizing = ref(false);

/**
 * 开始拖拽调节左侧宽度。
 *
 * @param e 鼠标按下事件
 */
function startResize(e: MouseEvent): void {
  resizing.value = true;
  const startX = e.clientX;
  const startWidth = leftWidth.value;
  const onMove = (ev: MouseEvent): void => {
    leftWidth.value = Math.min(560, Math.max(260, startWidth + ev.clientX - startX));
  };
  const onUp = (): void => {
    resizing.value = false;
    localStorage.setItem(LEFT_WIDTH_KEY, String(leftWidth.value));
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  };
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
}
const databases = ref<{ db: number; keys: number; expires: number }[]>([]);
/** 逻辑库下拉选项（label 带键数；ReSelect 统一控件） */
const dbOptions = computed(() => databases.value.map(d => ({ label: `db${d.db}（${d.keys} 键）`, value: d.db })));
const info = ref<Record<string, string>>({});
const infoVisible = ref(false);
const infoLoading = ref(false);
const detail = ref<RedisKeyDetail | null>(null);

/** STRING 编辑缓冲 */
const stringValue = ref("");
/** STRING 值视图：字符串（可编辑）/ HEX（字节只读）/ JSON（可编辑，高亮叠加） */
const stringView = ref<"text" | "hex" | "json">("text");
/** JSON 视图编辑缓冲：进入 JSON 视图时初始化为美化文本，保存时写回 stringValue */
const jsonEdit = ref("");
/** TTL 逐秒倒计时（null = 非倒计时态：永久/不存在/未加载）；配合 ttlTimer 使用 */
const ttlCountdown = ref<number | null>(null);
/** TTL 倒计时定时器句柄；切键/卸载/改 TTL 时必须清理，防止泄漏 */
let ttlTimer: ReturnType<typeof setInterval> | null = null;
/** HASH 添加行 */
const newHashField = ref("");
const newHashValue = ref("");
/** LIST 追加行 */
const newListValue = ref("");
/** SET 添加行 */
const newSetMember = ref("");
/** ZSET 添加行 */
const newZsetMember = ref("");
const newZsetScore = ref("");
/** STREAM 追加行 */
const newStreamField = ref("");
const newStreamValue = ref("");

const createVisible = ref(false);
const ttlVisible = ref(false);
const ttlValue = ref("");
const createForm = reactive({ key: "", type: "STRING", ttl: "", value: "" });

const hashColumns = [
  { prop: "field", label: "字段", minWidth: 200 },
  { prop: "value", label: "值", minWidth: 300 },
  { prop: "actions", label: "操作", width: 100, fixed: "right" as const, slot: "col-actions" },
];
const listColumns = [
  { prop: "index", label: "下标", width: 80 },
  { prop: "value", label: "值", minWidth: 360 },
  { prop: "actions", label: "操作", width: 100, fixed: "right" as const, slot: "col-actions" },
];
const memberColumns = [
  { prop: "member", label: "成员", minWidth: 320, slot: "col-member" },
  { prop: "actions", label: "操作", width: 100, fixed: "right" as const, slot: "col-actions" },
];
const zsetColumns = [
  { prop: "member", label: "成员", minWidth: 260 },
  { prop: "score", label: "分值", width: 120, slot: "col-score" },
  { prop: "actions", label: "操作", width: 100, fixed: "right" as const, slot: "col-actions" },
];
const streamColumns = [
  { prop: "id", label: "消息 ID", width: 200, slot: "col-id" },
  { prop: "fields", label: "字段", minWidth: 360, slot: "col-fields" },
];
const infoColumns = [
  { prop: "field", label: "字段", width: 240 },
  { prop: "value", label: "值", minWidth: 360 },
];

// ==================== 命令控制台 ====================

/** 工作区视图：键详情 / 命令控制台 */
const consoleMode = ref<"detail" | "command">("detail");
/** 命令编辑器文本 */
const commandText = ref("");
/** 命令执行中 */
const commandRunning = ref(false);
/** 最近一次命令执行结果 */
const commandResult = ref<RedisCommandResult | null>(null);
/** 最近一次命令错误（服务端拒绝/网络错误） */
const commandError = ref("");

/** 命令结果表格列 */
interface CommandColumn {
  prop: string;
  label: string;
  minWidth?: number;
  width?: number;
}

/** 命令结果渲染形态 */
interface CommandResultView {
  kind: "nil" | "scalar" | "json" | "rows";
  text?: string;
  columns: CommandColumn[];
  rows: Record<string, unknown>[];
}

/** 明确只读、执行后无需刷新左侧键列表的命令头 */
const READ_ONLY_COMMAND_HEADS = new Set([
  "PING", "ECHO", "GET", "MGET", "STRLEN", "EXISTS", "TYPE", "TTL", "PTTL",
  "KEYS", "SCAN", "DBSIZE", "INFO", "TIME", "LASTSAVE", "COMMAND", "CONFIG", "CLIENT",
  "MEMORY", "OBJECT", "DUMP", "RANDOMKEY",
  "HGET", "HMGET", "HGETALL", "HKEYS", "HVALS", "HLEN", "HEXISTS", "HSTRLEN",
  "LRANGE", "LINDEX", "LLEN",
  "SMEMBERS", "SISMEMBER", "SMISMEMBER", "SCARD", "SRANDMEMBER", "SUNION", "SINTER", "SDIFF",
  "ZRANGE", "ZREVRANGE", "ZRANGEBYSCORE", "ZSCORE", "ZMSCORE", "ZCARD", "ZCOUNT",
  "ZRANK", "ZREVRANK", "ZRANDMEMBER", "ZUNION", "ZINTER", "ZDIFF",
  "XRANGE", "XREVRANGE", "XLEN", "XPENDING", "XINFO",
  "GEODIST", "GEOPOS", "GEOHASH", "GEORADIUS", "GEORADIUSBYMEMBER", "GEOSEARCH",
  "JSON.GET", "JSON.TYPE", "JSON.OBJKEYS", "JSON.OBJLEN", "JSON.STRLEN",
  "JSON.ARRLEN", "JSON.ARRINDEX", "JSON.RESP",
  "TS.GET", "TS.RANGE", "TS.REVRANGE", "TS.INFO", "TS.MGET", "TS.MRANGE", "TS.QUERYINDEX",
  "FT.SEARCH", "FT.AGGREGATE", "FT.INFO", "FT.SUGGET", "FT.SYNDUMP",
  "VEMB", "VCARD", "VDIM", "VGETATTR", "VINFO", "VISMEMBER", "VLINKS", "VRANDMEMBER", "VSIM",
]);

/** 命令头（首词大写） */
function commandHead(command: string): string {
  const m = command.trim().match(/^([A-Za-z.]+)/);
  return m ? m[1].toUpperCase() : "";
}

/** 单元格标量化：对象/数组转 JSON 文本，其余原样 */
function cellScalar(value: unknown): unknown {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return value;
}

/**
 * 命令回复 → 渲染形态。
 *
 * <p>HGETALL 平铺数组配对为 字段/值 行；TS.RANGE/TS.REVRANGE 数组对配对为
 * 时间戳/值 行；JSON.GET 尝试解析后美化；对象数组按并集列渲染、数组数组按
 * 通用列渲染、标量数组单列渲染、Map 转键值对、标量直出。</p>
 */
const resultView = computed<CommandResultView>(() => {
  const empty: CommandResultView = { kind: "nil", columns: [], rows: [] };
  const result = commandResult.value;
  const reply = result?.reply;
  if (reply === null || reply === undefined) return empty;
  const head = result ? commandHead(result.command) : "";

  // HGETALL：RESP2 平铺 [f1,v1,f2,v2...] → 字段/值 行
  if (head === "HGETALL" && Array.isArray(reply) && reply.length % 2 === 0
    && reply.every(x => typeof x === "string")) {
    const rows: Record<string, unknown>[] = [];
    for (let i = 0; i < reply.length; i += 2) {
      rows.push({ field: reply[i], value: reply[i + 1] });
    }
    return {
      kind: "rows",
      columns: [
        { prop: "field", label: "字段", minWidth: 240 },
        { prop: "value", label: "值", minWidth: 360 },
      ],
      rows,
    };
  }

  // TS.RANGE / TS.REVRANGE：[[ts, val], ...] → 时间戳/值 行
  if ((head === "TS.RANGE" || head === "TS.REVRANGE") && Array.isArray(reply)
    && reply.every(x => Array.isArray(x) && x.length >= 2)) {
    const rows = (reply as unknown[][]).map(pair => ({
      timestamp: cellScalar(pair[0]),
      value: cellScalar(pair[1]),
    }));
    return {
      kind: "rows",
      columns: [
        { prop: "timestamp", label: "时间戳", width: 220 },
        { prop: "value", label: "值", minWidth: 360 },
      ],
      rows,
    };
  }

  // JSON.GET：字符串形态的 JSON → 解析美化
  if (head === "JSON.GET" && typeof reply === "string") {
    try {
      return { kind: "json", text: JSON.stringify(JSON.parse(reply), null, 2), columns: [], rows: [] };
    } catch {
      return { kind: "scalar", text: reply, columns: [], rows: [] };
    }
  }

  if (Array.isArray(reply)) {
    // 对象数组 → 并集列
    if (reply.length > 0 && reply.every(x => x !== null && typeof x === "object" && !Array.isArray(x))) {
      const props: string[] = [];
      for (const item of reply as Record<string, unknown>[]) {
        for (const key of Object.keys(item)) {
          if (!props.includes(key)) props.push(key);
        }
      }
      const columns = props.map(p => ({ prop: p, label: p, minWidth: 180 }));
      const rows = (reply as Record<string, unknown>[]).map(item => {
        const row: Record<string, unknown> = {};
        for (const p of props) row[p] = cellScalar(item[p]);
        return row;
      });
      return { kind: "rows", columns, rows };
    }
    // 数组数组 → 通用列（列1..列N）
    if (reply.length > 0 && reply.every(x => Array.isArray(x))) {
      const width = Math.max(...(reply as unknown[][]).map(r => r.length));
      const columns = Array.from({ length: width }, (_, i) => ({ prop: `c${i}`, label: `列${i + 1}`, minWidth: 180 }));
      const rows = (reply as unknown[][]).map(arr => {
        const row: Record<string, unknown> = {};
        for (let i = 0; i < width; i++) row[`c${i}`] = cellScalar(arr[i]);
        return row;
      });
      return { kind: "rows", columns, rows };
    }
    // 标量数组（含空数组）→ 单列
    return {
      kind: "rows",
      columns: [{ prop: "value", label: "值", minWidth: 360 }],
      rows: reply.map(x => ({ value: cellScalar(x) })),
    };
  }

  // Map（RESP3）→ 键值对
  if (typeof reply === "object") {
    const rows = Object.entries(reply as Record<string, unknown>).map(([field, value]) => ({
      field,
      value: cellScalar(value),
    }));
    return {
      kind: "rows",
      columns: [
        { prop: "field", label: "字段", minWidth: 240 },
        { prop: "value", label: "值", minWidth: 360 },
      ],
      rows,
    };
  }

  // 标量
  return { kind: "scalar", text: String(reply), columns: [], rows: [] };
});

/** 执行命令控制台命令 */
async function runCommand(): Promise<void> {
  const command = commandText.value.trim();
  if (!command) {
    message.warning("请输入命令");
    return;
  }
  commandRunning.value = true;
  commandError.value = "";
  commandResult.value = null;
  try {
    commandResult.value = await executeRedisCommand({
      datasourceId: datasourceId.value,
      db: activeDb.value,
      command,
    });
    // 写命令后同步左侧键列表；明确只读命令跳过，避免每次查询都重扫。
    // 这里必须 await：refresh() 内部要重新 bind/loadSideData/scanKeys，
    // 不等会让后续 UI 读到的还是旧快照。
    if (source.value && !READ_ONLY_COMMAND_HEADS.has(commandHead(command))) {
      await refresh();
    }
  } catch (e) {
    commandResult.value = null;
    commandError.value = e instanceof Error ? e.message : String(e);
  } finally {
    commandRunning.value = false;
  }
}

/** 清空命令编辑器与结果 */
function clearCommand(): void {
  commandText.value = "";
  commandResult.value = null;
  commandError.value = "";
}

/** 复制结果（表格 → TSV，其余 → 原文本） */
async function copyResult(): Promise<void> {
  const view = resultView.value;
  let text = "";
  if (view.kind === "rows") {
    const header = view.columns.map(c => c.label).join("\t");
    const body = view.rows
      .map(row => view.columns.map(c => String(row[c.prop] ?? "")).join("\t"))
      .join("\n");
    text = `${header}\n${body}`;
  } else if (view.text !== undefined) {
    text = view.text;
  }
  if (await copyToClipboard(text)) message.success("结果已复制");
  else message.warning("复制失败");
}

/** 详情 value → HASH 字段数组（detail.value 是信封 {key,type,ttl,value,size}，字段在嵌套 value 里） */
const hashFields = computed<RedisHashField[]>(() => {
  const v = detail.value;
  if (!v || v.type !== "HASH") return [];
  const payload = v.value;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  return Object.entries(payload as Record<string, unknown>).map(([field, value]) => ({ field, value: String(value ?? "") }));
});

/** 详情 value → LIST 元素行（带下标） */
const listRows = computed<ListRow[]>(() => {
  const v = detail.value;
  if (!v || v.type !== "LIST" || !Array.isArray(v.value)) return [];
  return (v.value as unknown[]).map((x, index) => ({ index, value: String(x ?? "") }));
});

/** 详情 value → SET 成员行 */
const setRows = computed<MemberRow[]>(() => {
  const v = detail.value;
  if (!v || v.type !== "SET" || !Array.isArray(v.value)) return [];
  return (v.value as unknown[]).map(x => ({ member: String(x ?? "") }));
});

/** 详情 value → ZSET 成员行 */
const zsetRows = computed<MemberRow[]>(() => {
  const v = detail.value;
  if (!v || v.type !== "ZSET" || !Array.isArray(v.value)) return [];
  return (v.value as RedisMemberScore[]).map(m => ({ member: String(m?.member ?? ""), score: Number(m?.score ?? 0) }));
});

/** 详情 value → STREAM 消息 */
const streamEntries = computed<RedisStreamEntry[]>(() => {
  const v = detail.value;
  if (!v || v.type !== "STREAM" || !Array.isArray(v.value)) return [];
  return v.value as RedisStreamEntry[];
});

/** INFO 弹窗行数据 */
const infoRows = computed(() => Object.entries(info.value).map(([field, value]) => ({ field, value })));

/** 树形视图行 */
interface TreeRow {
  kind: "dir" | "leaf";
  path: string;
  name: string;
  depth: number;
  expanded: boolean;
  item?: RedisKeyItem;
}

/** 已折叠的目录路径集合 */
const collapsedDirs = ref<string[]>([]);

/** 折叠 / 展开目录 */
function toggleTreeDir(path: string): void {
  const idx = collapsedDirs.value.indexOf(path);
  if (idx >= 0) collapsedDirs.value.splice(idx, 1);
  else collapsedDirs.value.push(path);
}

/** 树形行点击：目录=折叠/展开，叶子=选中键 */
function onTreeRowClick(row: TreeRow): void {
  if (row.kind === "dir") toggleTreeDir(row.path);
  else void selectKey(row.path);
}

/**
 * 树形视图行：按 `:` 分层的 DFS 展开。
 *
 * <p>2026-10-07 修复：旧实现先平铺全部目录再平铺全部叶子，导致所有叶子都挂到
 * 最后一个目录节点下面。现在构建 trie 后按 DFS 输出：进入目录行 → 递归输出该目录
 * 的直接子目录与直接子叶（同层按名字混排，同名时叶子在前，避免 leaf/dir 同 path
 * 的 v-for key 冲突），折叠的目录直接不再下钻。</p>
 */
const treeRows = computed<TreeRow[]>(() => {
  interface TrieNode {
    dirs: Map<string, TrieNode>;
    leaves: RedisKeyItem[];
  }
  const newNode = (): TrieNode => ({ dirs: new Map(), leaves: [] });

  const root = newNode();
  for (const item of keys.value) {
    const segs = item.key.split(":");
    let node = root;
    for (let i = 0; i < segs.length - 1; i++) {
      const seg = segs[i];
      let child = node.dirs.get(seg);
      if (!child) {
        child = newNode();
        node.dirs.set(seg, child);
      }
      node = child;
    }
    node.leaves.push(item);
  }

  const rows: TreeRow[] = [];
  const visit = (node: TrieNode, parentPath: string, depth: number): void => {
    // 同层：目录与叶子混排按名排序；同名时叶子在前（key 加 kind 去重后语义一致）
    type Entry = { isDir: boolean; name: string; path: string; item?: RedisKeyItem; child?: TrieNode };
    const entries: Entry[] = [];
    for (const [name, child] of node.dirs) {
      entries.push({ isDir: true, name, path: parentPath ? `${parentPath}:${name}` : name, child });
    }
    for (const item of node.leaves) {
      const name = item.key.split(":").pop() || item.key;
      entries.push({ isDir: false, name, path: item.key, item });
    }
    entries.sort((a, b) => a.name.localeCompare(b.name) || (a.isDir === b.isDir ? 0 : a.isDir ? 1 : -1));

    for (const entry of entries) {
      if (entry.isDir && entry.child) {
        const collapsed = collapsedDirs.value.includes(entry.path);
        rows.push({ kind: "dir", path: entry.path, name: entry.name, depth, expanded: !collapsed });
        if (!collapsed) visit(entry.child, entry.path, depth + 1);
      } else if (entry.item) {
        rows.push({ kind: "leaf", path: entry.path, name: entry.name, depth, expanded: true, item: entry.item });
      }
    }
  };
  visit(root, "", 0);
  return rows;
});

/** 新建弹窗：按类型给不同标签/占位/提示 */
const createValueLabel = computed(() => {
  switch (createForm.type) {
    case "HASH": return "初始字段（每行 field=value）";
    case "LIST": return "初始元素（每行一个）";
    case "SET": return "初始成员（每行一个）";
    case "ZSET": return "初始成员（每行 member=score）";
    default: return "值";
  }
});
const createValuePlaceholder = computed(() => {
  switch (createForm.type) {
    case "HASH": return "name=张三\nrole=admin";
    case "LIST": return "第一行\n第二行";
    case "SET": return "member-a\nmember-b";
    case "ZSET": return "alice=100\nbob=95.5";
    default: return "UTF-8 文本";
  }
});
const createValueHint = computed(() => {
  switch (createForm.type) {
    case "HASH": case "LIST": case "SET": case "ZSET":
      return "非 STRING 类型至少要有一行初始数据（Redis 无法创建空的集合键）";
    default:
      return "留空则创建空字符串键";
  }
});
/**
 * 类型 → 标签颜色。
 *
 * @param type 键类型
 * @returns ReTag 类型
 */
function typeTagType(type: string): "success" | "warning" | "info" | "primary" | "danger" {
  switch ((type || "").toUpperCase()) {
    case "STRING": return "success";
    case "HASH": return "warning";
    case "LIST": return "primary";
    case "SET": return "info";
    case "ZSET": return "danger";
    default: return "info";
  }
}

/**
 * TTL 展示。
 *
 * @param ttl 后端返回的 TTL（-1 永久 / -2 键不存在）
 * @returns 展示文本
 */
function formatTtl(ttl: number): string {
  if (ttl === -1) return "永久";
  if (ttl === -2) return "键不存在";
  return `${ttl} 秒`;
}

/**
 * 非结构化值的兜底展示。
 *
 * @param value 任意值
 * @returns 文本
 */
function formatPlainValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/** JSON 视图文本：合法 JSON 美化展示，否则原样输出 */
const jsonViewText = computed(() => {
  const raw = stringValue.value;
  if (!raw) return "";
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
});

/**
 * JSON 视图高亮 HTML：先整体转义（&lt;&gt;&amp;）防注入，再对 token 包 span。
 * 数据源是 jsonEdit（编辑缓冲），与透明编辑层 textarea 同源 → 高亮随输入实时更新；
 * 非法 JSON（parse 失败）只转义不高亮，保持原样展示。
 * token 顺序：键（字符串+冒号）→ 字符串 → 数字 → true/false/null → 结构符号。
 */
const jsonHtml = computed(() => {
  const text = jsonEdit.value;
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  try {
    JSON.parse(text);
  } catch {
    return esc;
  }
  return esc.replace(
    /("(?:[^"\\]|\\.)*")(\s*:)|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b|([{}[\],:])/g,
    (_m, keyStr: string, colon: string, str: string, num: string, lit: string, punct: string) => {
      if (keyStr !== undefined) return `<span class="dsm-json-key">${keyStr}</span>${colon}`;
      if (str !== undefined) return `<span class="dsm-json-str">${str}</span>`;
      if (num !== undefined) return `<span class="dsm-json-num">${num}</span>`;
      if (lit !== undefined) return `<span class="dsm-json-lit">${lit}</span>`;
      return `<span class="dsm-json-punct">${punct}</span>`;
    }
  );
});

/** HEX 视图文本：UTF-8 字节 16 字节/行，`偏移 hex |ascii|` */
const hexViewText = computed(() => {
  const raw = stringValue.value;
  if (!raw) return "";
  const bytes = Array.from(new TextEncoder().encode(raw));
  const lines: string[] = [];
  for (let i = 0; i < bytes.length; i += 16) {
    const chunk = bytes.slice(i, i + 16);
    const hex = chunk
      .map(b => b.toString(16).padStart(2, "0"))
      .join(" ")
      .padEnd(47, " ");
    const ascii = chunk.map(b => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${i.toString(16).padStart(8, "0")}  ${hex}  |${ascii}|`);
  }
  return lines.join("\n");
});

/**
 * 扫描当前库的键（reset=true 从游标 0 开始）。
 *
 * @param reset 是否重置游标与已加载列表
 */
async function scanKeys(reset: boolean) {
  if (!datasourceId.value) return;
  if (reset) {
    nextCursor.value = "0";
    keys.value = [];
  }
  loading.value = true;
  try {
    const res = await scanRedisKeys({
      datasourceId: datasourceId.value,
      db: activeDb.value,
      pattern: pattern.value.trim() || "*",
      cursor: nextCursor.value,
      count: 200,
    });
    const list = res?.keys || [];
    const seen = new Set(keys.value.map(k => k.key));
    keys.value = keys.value.concat(list.filter(k => !seen.has(k.key)));
    nextCursor.value = String(res?.nextCursor ?? "0");
    ready();
  } catch (e) {
    if (reset) keys.value = [];
    fail(e, "/ms/monitor/redis-manage/keys");
  } finally {
    loading.value = false;
  }
}

/** 搜索框回车/点查询：重置并扫描 */
async function reloadKeys() {
  await scanKeys(true);
}

/** 加载更多（游标续扫） */
async function loadMore() {
  await scanKeys(false);
}

/**
 * 读取键详情。
 *
 * @param key 键名
 */
async function selectKey(key: string) {
  activeKey.value = key;
  detail.value = null;
  stopTtlCountdown();
  try {
    detail.value = await fetchRedisKey(datasourceId.value, activeDb.value, key);
    stringValue.value = detail.value?.type === "STRING" ? String(detail.value.value ?? "") : "";
    jsonEdit.value = "";
    stringView.value = "text";
    startTtlCountdown(detail.value?.ttl ?? -1);
    ready();
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key");
  }
}

/** 逻辑库 ReSelect change → 切库（v-model 已落 activeDb，这里只做切库副作用） */
function onDbChange(value: string | number | null | undefined): void {
  if (value === "" || value == null) return;
  void switchDb(Number(value));
}

/** 切换逻辑库（v-model 已更新 activeDb，此处重置选中与详情并重扫） */
async function switchDb(db: number) {
  activeDb.value = db;
  activeKey.value = "";
  detail.value = null;
  stopTtlCountdown();
  await scanKeys(true);
}

/** 加载库列表与 INFO（不整页 loading，避免遮挡） */
async function loadSideData() {
  if (!datasourceId.value) return;
  try {
    databases.value = (await fetchRedisDatabases(datasourceId.value)) || [];
  } catch (e) {
    databases.value = [];
    fail(e, "/ms/monitor/redis-manage/databases");
  }
  try {
    info.value = (await fetchRedisInfo(datasourceId.value)) || {};
  } catch (e) {
    info.value = {};
    fail(e, "/ms/monitor/redis-manage/info");
  }
}

/** 测试连接（走数据源中心统一探测） */
async function testConnection() {
  if (!datasourceId.value) return;
  testing.value = true;
  try {
    const result = await testDataSource(datasourceId.value);
    if (result?.success) {
      message.success(`连接成功${result.version ? `（redis ${result.version}）` : ""}`);
      ready();
    } else {
      message.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/datasource/{id}/test");
  } finally {
    testing.value = false;
  }
}

/** 全量刷新 */
async function refresh() {
  await bind("redis");
  if (!source.value) return;
  await loadSideData();
  await scanKeys(true);
}

/** 打开服务器信息弹窗 */
async function openInfo() {
  infoVisible.value = true;
  await reloadInfo();
}

/** 弹窗内刷新 INFO */
async function reloadInfo() {
  if (!datasourceId.value) return;
  infoLoading.value = true;
  try {
    info.value = (await fetchRedisInfo(datasourceId.value)) || {};
    ready();
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/info");
  } finally {
    infoLoading.value = false;
  }
}
/** 打开新建键弹窗 */
function openCreate() {
  Object.assign(createForm, { key: "", type: "STRING", ttl: "", value: "" });
  createVisible.value = true;
}

/** 提交新建键 */
async function submitCreate() {
  const key = createForm.key.trim();
  if (!key) {
    message.warning("键名不能为空");
    return;
  }
  const type = createForm.type;
  const raw = createForm.value;
  const payload: Record<string, unknown> = {};
  if (type === "STRING") {
    payload.value = raw;
  } else {
    const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      message.warning(`${type} 类型至少需要一行初始数据`);
      return;
    }
    if (type === "HASH") {
      const fields = lines.map(l => {
        const idx = l.indexOf("=");
        return { field: idx >= 0 ? l.slice(0, idx) : l, value: idx >= 0 ? l.slice(idx + 1) : "" };
      }).filter(f => f.field.trim() !== "");
      if (fields.length === 0) {
        message.warning("至少一行 field=value");
        return;
      }
      payload.hashFields = fields;
    } else if (type === "LIST") {
      // 保留行内空格，只去掉行尾 \r 与末尾空行
      const items = raw.split("\n").map(l => l.replace(/\r$/, ""));
      while (items.length > 0 && items[items.length - 1].trim() === "") items.pop();
      payload.listItems = items;
    } else if (type === "SET") {
      payload.setItems = lines;
    } else if (type === "ZSET") {
      const members = lines.map(l => {
        const idx = l.lastIndexOf("=");
        const member = idx >= 0 ? l.slice(0, idx) : l;
        const score = idx >= 0 ? Number(l.slice(idx + 1)) : Number.NaN;
        return { member, score: Number.isFinite(score) ? score : 0 };
      }).filter(m => m.member.trim() !== "");
      if (members.length === 0) {
        message.warning("至少一行 member=score");
        return;
      }
      payload.zsetMembers = members;
    }
  }
  const ttl = Number(String(createForm.ttl).trim() || "0");
  saving.value = true;
  try {
    await createRedisKey(
      {
        datasourceId: datasourceId.value,
        key,
        type,
        ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : -1,
        ...payload,
      },
      activeDb.value,
    );
    message.success("键已创建");
    createVisible.value = false;
    await loadSideData();
    await scanKeys(true);
    await selectKey(key);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key");
  } finally {
    saving.value = false;
  }
}

/** 保存 STRING 值（字符串视图写 stringValue；JSON 视图先校验编辑缓冲再回写） */
async function saveStringValue() {
  if (!activeKey.value) return;
  if (stringView.value === "json") {
    try {
      JSON.parse(jsonEdit.value);
    } catch {
      message.warning("JSON 编辑内容不是合法 JSON，无法保存");
      return;
    }
    stringValue.value = jsonEdit.value;
  }
  saving.value = true;
  try {
    await setRedisString(datasourceId.value, activeDb.value, activeKey.value, stringValue.value);
    message.success("值已保存");
    ready();
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key");
  } finally {
    saving.value = false;
  }
}

/** 打开设置 TTL 弹窗 */
function openExpire() {
  ttlValue.value = detail.value ? String(detail.value.ttl) : "";
  ttlVisible.value = true;
}

/** 提交 TTL 设置 */
async function submitExpire() {
  const ttl = Number(ttlValue.value.trim());
  if (!Number.isFinite(ttl)) {
    message.warning("TTL 必须是数字");
    return;
  }
  saving.value = true;
  try {
    await expireRedisKey(datasourceId.value, activeDb.value, activeKey.value, ttl);
    message.success(ttl === -1 ? "已设置为永久" : `TTL 已设置为 ${ttl} 秒`);
    ttlVisible.value = false;
    ready();
    await scanKeys(false);
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/expire");
  } finally {
    saving.value = false;
  }
}

/**
 * 切换 STRING 值视图（字符串 / HEX / JSON）。
 *
 * <p>进入 JSON 视图时把编辑缓冲初始化为当前值的美化文本，高亮层与编辑层同源；
 * 回到字符串视图不回写（jsonEdit 仅在点「保存值」时落库）。</p>
 *
 * @param view 目标视图
 */
function setStringView(view: "text" | "hex" | "json"): void {
  if (view === "json") jsonEdit.value = jsonViewText.value;
  stringView.value = view;
}

/**
 * JSON 编辑层滚动 → 同步高亮层滚动（两层同尺寸叠放，保证行对齐）。
 *
 * @param e 滚动事件
 */
function syncJsonScroll(e: Event): void {
  const target = e.target as HTMLElement;
  const hl = document.querySelectorAll(".dsm-json-editor .dsm-json-hl")[0];
  if (hl) {
    hl.scrollTop = target.scrollTop;
    hl.scrollLeft = target.scrollLeft;
  }
}

/** 停掉 TTL 倒计时并清空显示态（切键、改 TTL、卸载时调用，防定时器泄漏） */
function stopTtlCountdown(): void {
  if (ttlTimer !== null) {
    clearInterval(ttlTimer);
    ttlTimer = null;
  }
  ttlCountdown.value = null;
}

/**
 * 按详情 TTL 启动逐秒倒计时（仅 ttl > 0 时）。
 *
 * <p>ttl ≤ 0（永久 -1 / 不存在 -2）走 formatTtl 展示，不启用定时器。
 * 启动前先 stop，保证同一时刻至多一个倒计时器。</p>
 *
 * @param ttl 详情返回的 TTL 秒数
 */
function startTtlCountdown(ttl: number): void {
  stopTtlCountdown();
  if (!Number.isFinite(ttl) || ttl <= 0) return;
  ttlCountdown.value = Math.floor(ttl);
  ttlTimer = setInterval(() => {
    if (ttlCountdown.value === null) {
      stopTtlCountdown();
      return;
    }
    if (ttlCountdown.value <= 1) {
      // 归零：键已过期，停表并重扫列表（键可能已消失）
      stopTtlCountdown();
      void scanKeys(false);
      return;
    }
    ttlCountdown.value -= 1;
  }, 1000);
}

/**
 * 删除键（单个，带确认）。
 *
 * @param key 键名
 */
async function confirmDeleteKey(key: string) {
  try {
    await ElMessageBox.confirm(`确定删除键 ${key} 吗？该操作不可恢复。`, "删除确认", { type: "warning", confirmButtonText: "删除" });
  } catch {
    return;
  }
  try {
    await deleteRedisKeys(datasourceId.value, activeDb.value, [key]);
    message.success("键已删除");
    activeKey.value = "";
    detail.value = null;
    ready();
    await loadSideData();
    await scanKeys(true);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key");
  }
}

/**
 * 复制键名到剪贴板（键列表悬停工具条）。
 *
 * @param key 键名
 */
async function copyKeyName(key: string) {
  if (await copyToClipboard(key)) message.success("键名已复制");
  else message.warning("复制失败，浏览器拒绝了剪贴板访问");
}

/**
 * 删除目录：扫描该前缀下全部键（含未加载批次）后一次确认、批量删除。
 * 目录 = 前缀 `dir:` 下的所有键；与树形「目录」行的语义一致（2026-10-07 需求）。
 *
 * @param dir 目录路径（如 `user:profile`）
 */
async function confirmDeleteDir(dir: string) {
  const prefix = `${dir}:`;
  // 全量收集前缀下所有键（游标扫完，不局限于已加载批次）
  const found: string[] = [];
  let cursor = "0";
  let guard = 0;
  try {
    do {
      const res = await scanRedisKeys({
        datasourceId: datasourceId.value,
        db: activeDb.value,
        pattern: `${prefix}*`,
        cursor,
        count: 500,
      });
      found.push(...(res?.keys || []).map(k => k.key));
      cursor = String(res?.nextCursor ?? "0");
      guard += 1;
    } while (cursor !== "0" && guard < 200);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/keys");
    return;
  }
  if (found.length === 0) {
    message.info("目录下没有键");
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除目录 ${dir} 下全部 ${found.length} 个键吗？该操作不可恢复。`, "删除确认", { type: "warning", confirmButtonText: "删除" });
  } catch {
    return;
  }
  try {
    await deleteRedisKeys(datasourceId.value, activeDb.value, found);
    message.success(`已删除目录下 ${found.length} 个键`);
    if (activeKey.value.startsWith(prefix)) {
      activeKey.value = "";
      detail.value = null;
    }
    ready();
    await loadSideData();
    await scanKeys(true);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key");
  }
}

/** HASH 添加字段 */
async function addHashField() {
  const field = newHashField.value.trim();
  if (!field) {
    message.warning("字段名不能为空");
    return;
  }
  saving.value = true;
  try {
    await hsetRedisField(datasourceId.value, activeDb.value, activeKey.value, { field, value: newHashValue.value });
    newHashField.value = "";
    newHashValue.value = "";
    ready();
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/hash");
  } finally {
    saving.value = false;
  }
}

/**
 * 删除类操作后的回拉：删空后 Redis 会自动删除整个键 → 清空选中并静默重扫
 * 左侧键列表（顶部扫描条 `.dsm-scan-bar` 随 loading 动画）；未删空则只刷新详情。
 *
 * @param keyGone 是否已删空（键已被 Redis 自动删除）
 */
async function reloadAfterRemoval(keyGone: boolean) {
  if (keyGone) {
    activeKey.value = "";
    detail.value = null;
    stopTtlCountdown();
    await scanKeys(true);
    return;
  }
  await selectKey(activeKey.value);
}

/**
 * HASH 编辑字段（同字段名 HSET 覆盖）。
 *
 * @param field 字段名
 * @param value 当前值
 */
async function editHashField(field: string, value: string) {
  let next: string;
  try {
    const res = await ElMessageBox.prompt(`修改字段 ${field}`, "编辑字段", {
      inputValue: value,
      inputPattern: /^[\s\S]*$/,
      inputErrorMessage: "值不能为空",
    });
    next = res.value;
  } catch {
    return;
  }
  saving.value = true;
  try {
    await hsetRedisField(datasourceId.value, activeDb.value, activeKey.value, { field, value: next });
    message.success("字段已更新");
    ready();
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/hash");
  } finally {
    saving.value = false;
  }
}

/**
 * HASH 删除字段。
 *
 * @param field 字段名
 */
async function removeHashField(field: string) {
  try {
    await ElMessageBox.confirm(`确定删除字段 ${field} 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  const wasLast = hashFields.value.length <= 1;
  try {
    await hdelRedisField(datasourceId.value, activeDb.value, activeKey.value, field);
    message.success(wasLast ? "字段已删除（键已删空，列表已刷新）" : "字段已删除");
    ready();
    await reloadAfterRemoval(wasLast);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/hash");
  }
}

/** LIST 追加元素 */
async function pushListElement() {
  if (!newListValue.value) {
    message.warning("元素值不能为空");
    return;
  }
  saving.value = true;
  try {
    await rpushRedisElement(datasourceId.value, activeDb.value, activeKey.value, newListValue.value);
    newListValue.value = "";
    ready();
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/list");
  } finally {
    saving.value = false;
  }
}

/**
 * LIST 编辑元素（弹输入框）。
 *
 * @param index 下标
 * @param value 当前值
 */
async function editListElement(index: number, value: string) {
  let next: string;
  try {
    const res = await ElMessageBox.prompt(`修改下标 ${index} 的元素`, "编辑元素", {
      inputValue: value,
      inputPattern: /^[\s\S]*$/,
      inputErrorMessage: "值不能为空",
    });
    next = res.value;
  } catch {
    return;
  }
  saving.value = true;
  try {
    await lsetRedisElement(datasourceId.value, activeDb.value, activeKey.value, index, next);
    message.success("元素已更新");
    ready();
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/list");
  } finally {
    saving.value = false;
  }
}

/**
 * LIST 删除元素。
 *
 * @param index 下标
 */
async function removeListElement(index: number) {
  try {
    await ElMessageBox.confirm(`确定删除下标 ${index} 的元素吗？删除后后续元素前移。`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  const wasLast = listRows.value.length <= 1;
  try {
    await lremRedisIndex(datasourceId.value, activeDb.value, activeKey.value, index);
    message.success(wasLast ? "元素已删除（键已删空，列表已刷新）" : "元素已删除");
    ready();
    await reloadAfterRemoval(wasLast);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/list");
  }
}

/** SET 添加成员 */
async function addSetMember() {
  const member = newSetMember.value.trim();
  if (!member) {
    message.warning("成员不能为空");
    return;
  }
  saving.value = true;
  try {
    const added = await saddRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
    newSetMember.value = "";
    ready();
    message.success(added ? "成员已添加" : "成员已存在，未重复添加");
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/set");
  } finally {
    saving.value = false;
  }
}

/**
 * SET 编辑成员（改名 = SADD 新成员 + SREM 旧成员）。
 *
 * @param member 当前成员
 */
async function editSetMember(member: string) {
  let next: string;
  try {
    const res = await ElMessageBox.prompt("修改成员（集合不支持原地改名，保存时新增新值并移除旧值）", "编辑成员", {
      inputValue: member,
      inputPattern: /\S+/,
      inputErrorMessage: "成员不能为空",
    });
    next = res.value.trim();
  } catch {
    return;
  }
  if (next === member) return;
  saving.value = true;
  try {
    await saddRedisMember(datasourceId.value, activeDb.value, activeKey.value, next);
    await sremRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
    message.success("成员已更新");
    ready();
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/set");
  } finally {
    saving.value = false;
  }
}

/**
 * SET 删除成员。
 *
 * @param member 成员
 */
async function removeSetMember(member: string) {
  try {
    await ElMessageBox.confirm(`确定删除成员 ${member} 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  const wasLast = setRows.value.length <= 1;
  try {
    await sremRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
    message.success(wasLast ? "成员已删除（键已删空，列表已刷新）" : "成员已删除");
    ready();
    await reloadAfterRemoval(wasLast);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/set");
  }
}

/** ZSET 添加成员 */
async function addZsetMember() {
  const member = newZsetMember.value.trim();
  if (!member) {
    message.warning("成员不能为空");
    return;
  }
  const score = Number(newZsetScore.value.trim());
  if (!Number.isFinite(score)) {
    message.warning("分值必须是数字");
    return;
  }
  saving.value = true;
  try {
    await zaddRedisMember(datasourceId.value, activeDb.value, activeKey.value, member, score);
    newZsetMember.value = "";
    newZsetScore.value = "";
    ready();
    message.success("成员已写入");
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/zset");
  } finally {
    saving.value = false;
  }
}

/**
 * ZSET 编辑分值（同成员 ZADD 覆盖 score）。
 *
 * @param member 成员
 * @param score 当前分值
 */
async function editZsetScore(member: string, score: number) {
  let next: string;
  try {
    const res = await ElMessageBox.prompt(`修改成员 ${member} 的分值`, "编辑分值", {
      inputValue: String(score),
      inputPattern: /^-?\d+(\.\d+)?$/,
      inputErrorMessage: "分值必须是数字",
    });
    next = res.value;
  } catch {
    return;
  }
  const num = Number(next);
  if (!Number.isFinite(num)) {
    message.warning("分值必须是数字");
    return;
  }
  saving.value = true;
  try {
    await zaddRedisMember(datasourceId.value, activeDb.value, activeKey.value, member, num);
    message.success("分值已更新");
    ready();
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/zset");
  } finally {
    saving.value = false;
  }
}

/**
 * ZSET 删除成员。
 *
 * @param member 成员
 */
async function removeZsetMember(member: string) {
  try {
    await ElMessageBox.confirm(`确定删除成员 ${member} 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  const wasLast = zsetRows.value.length <= 1;
  try {
    await zremRedisMember(datasourceId.value, activeDb.value, activeKey.value, member);
    message.success(wasLast ? "成员已删除（键已删空，列表已刷新）" : "成员已删除");
    ready();
    await reloadAfterRemoval(wasLast);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/zset");
  }
}

/** STREAM 追加消息 */
async function appendStreamEntry() {
  const field = newStreamField.value.trim();
  if (!field) {
    message.warning("字段名不能为空");
    return;
  }
  saving.value = true;
  try {
    await xaddRedisStream(datasourceId.value, activeDb.value, activeKey.value, [{ field, value: newStreamValue.value }]);
    newStreamField.value = "";
    newStreamValue.value = "";
    ready();
    message.success("消息已追加");
    await selectKey(activeKey.value);
  } catch (e) {
    fail(e, "/ms/monitor/redis-manage/key/stream");
  } finally {
    saving.value = false;
  }
}

onMounted(refresh);
// 卸载时停 TTL 倒计时，防定时器泄漏
onBeforeUnmount(stopTtlCountdown);
</script>

<style scoped>
.dsm { display: flex; flex-direction: column; height: 100%; min-height: 100%; background: var(--bg-fill); }
/* 顶部工具条：视觉（圆角/边框/投影/底色/内距）由模板上的 re-surface 类统一提供
   （16px 圆角、透明边框 + 双层柔光投影），这里只留布局——不再自写一套卡片壳防漂移 */
.dsm-toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
.dsm-toolbar-left { display: flex; align-items: center; gap: 10px; }
.dsm-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }
.dsm-redis-icon { color: #dc382d; }
.dsm-toolbar-right { display: flex; align-items: center; gap: 8px; }
.dsm-toolbar-right :deep(.rs-btn) { margin: 0; }
.dsm-db-select { width: 220px; flex-shrink: 0; }
.dsm-body { display: flex; flex: 1; gap: 0; overflow: hidden; }
.dsm.resizing { user-select: none; }
.dsm-split { position: relative; width: 16px; flex-shrink: 0; cursor: col-resize; }
.dsm-split::after { content: ""; position: absolute; top: 0; bottom: 0; left: 6px; width: 4px; border-radius: 2px; background: transparent; transition: background 0.15s; }
.dsm-split:hover::after, .dsm-split.active::after { background: var(--brand-400); }
.dsm-sidebar { width: 300px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; flex-shrink: 0; display: flex; flex-direction: column; }
.dsm-search-section { display: flex; gap: 6px; padding: 10px 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-search-section > *:first-child { flex: 1; }
.dsm-view-bar { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-bottom: 1px solid var(--border-subtle); }
.dsm-view-bar :deep(.rs-btn) { margin: 0; }
.dsm-view-count { font-size: 12px; color: var(--text-tertiary); }
.dsm-view-spacer { flex: 1; }
.dsm-key-list { flex: 1; padding: 6px 0; min-height: 80px; overflow-y: auto; }
.dsm-tree-node { position: relative; display: flex; align-items: center; gap: 6px; padding: 6px 12px; cursor: pointer; transition: background 0.15s; background: var(--bg-container); }
.dsm-tree-node:hover { background: var(--bg-hover); }
.dsm-tree-node.active { background: var(--brand-50); color: var(--brand-600); }
.dsm-tree-node.is-dir { font-weight: 600; color: var(--text-secondary); }
.dsm-tree-caret { color: var(--text-tertiary); }
.dsm-tree-icon { flex-shrink: 0; }
.dsm-tree-folder { color: var(--brand-500, var(--brand-600, #409eff)); }
/* 行悬停工具条：默认隐藏，鼠标经过行才显示；绝对定位覆盖右侧，避免出现时挤压布局。
   背景 inherit 跟随行的三态（默认/hover/active），按钮图标覆盖其后的类型 ReTag。 */
.dsm-row-actions { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); display: none; align-items: center; gap: 2px; padding-left: 18px; background: inherit; }
.dsm-tree-node:hover .dsm-row-actions { display: flex; }
.dsm-row-actions :deep(.rs-btn) { margin: 0; }
.dsm-tree-label { flex: 1; font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsm-load-more { padding: 6px 8px; text-align: center; }
.dsm-content { flex: 1; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; }
.dsm-content-bar { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
/* 命令控制台面板：编辑器 + 操作行 + 结果区纵向排列，结果区吃掉剩余高度 */
.dsm-command-panel { flex: 1; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
.dsm-command-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.dsm-command-actions :deep(.rs-btn) { margin: 0; }
.dsm-command-hint { margin-left: 2px; font-size: 12px; color: var(--text-tertiary); }
.dsm-command-error { padding: 10px 14px; font-size: 13px; color: var(--danger, #f56c6c); background: color-mix(in srgb, var(--danger, #f56c6c) 8%, transparent); border: 1px solid color-mix(in srgb, var(--danger, #f56c6c) 30%, transparent); border-radius: 6px; word-break: break-all; flex-shrink: 0; }
.dsm-command-result { flex: 1; display: flex; flex-direction: column; min-height: 260px; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; padding: 12px 14px; }
.dsm-command-result :deep(.dsm-table-wrap) { flex: 1; min-height: 0; }
.dsm-reply-pre { margin: 0; padding: 12px; background: var(--bg-fill); border-radius: 6px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 12.5px; line-height: 1.6; color: var(--text-primary); white-space: pre-wrap; word-break: break-all; overflow: auto; max-height: 480px; flex-shrink: 0; }
.dsm-reply-nil { padding: 12px; color: var(--text-tertiary); font-family: "JetBrains Mono", "Consolas", monospace; font-size: 12.5px; flex-shrink: 0; }
/* 顶部信息带：视觉（圆角/边框/投影/底色）由模板上的 re-surface 类统一提供（16px 圆角、
   透明边框 + 双层柔光投影），这里只留网格布局——不再自写一套卡片壳防漂移（surface:check） */
.dsm-info-card { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; flex-shrink: 0; }
.dsm-info-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-info-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-info-value { font-size: 14px; font-weight: 500; color: var(--text-primary); }
/* 值区吃满高度：section 吃掉 content 剩余空间 → data-section 吃掉 section 剩余 →
   值元素（textarea/pre/表格容器）flex:1 填底；min-height:0 保证超高时能压回内滚链。 */
.dsm-section { flex: 1; display: flex; flex-direction: column; border: 1px solid var(--border-subtle); border-radius: 8px; background: var(--bg-container); overflow: hidden; }
.dsm-section-title { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; font-size: 14px; font-weight: 600; color: var(--text-primary); border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
.dsm-section-actions { display: flex; align-items: center; gap: 6px; }
.dsm-node-detail { padding: 14px 16px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }
.dsm-detail-row { display: flex; flex-direction: column; gap: 4px; }
.dsm-detail-label { font-size: 12px; color: var(--text-tertiary); }
.dsm-detail-value { font-size: 13px; color: var(--text-primary); word-break: break-all; }
.dsm-data-section { flex: 1; display: flex; flex-direction: column; min-height: 0; padding: 14px 16px; }
.dsm-data-title { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; flex-shrink: 0; }
/* 表格容器：吃掉值区剩余高度（ReTable 缺省 fill 会量父容器高度，父链 flex 定高） */
.dsm-table-wrap { flex: 1; display: flex; min-height: 260px; }
.dsm-table-wrap > * { flex: 1; min-width: 0; }
/* 值元素填底：横向铺满、超出内滚 */
.dsm-fill { flex: 1; min-height: 160px; }
.dsm-data-content { margin: 0; padding: 12px; background: var(--bg-fill); border-radius: 6px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 12px; color: var(--text-primary); white-space: pre-wrap; word-break: break-all; overflow-y: auto; }
.dsm-add-row { display: flex; gap: 8px; margin-bottom: 10px; flex-shrink: 0; }
.dsm-add-grow { flex: 1; }
.dsm-add-narrow { width: 140px; }
/* 单元格行内操作（ReButton square 图标组） */
.dsm-cell-actions { display: inline-flex; align-items: center; gap: 4px; }
.dsm-cell-actions :deep(.rs-btn) { margin: 0; }
/* 键列表顶部扫描条：静默重扫时走动画（删空集合后自动刷新左侧） */
.dsm-scan-bar { position: sticky; top: 0; z-index: 2; height: 2px; overflow: hidden; background: transparent; opacity: 0; transition: opacity 0.15s; }
.dsm-scan-bar.is-active { opacity: 1; }
.dsm-scan-bar span { display: block; width: 40%; height: 100%; background: linear-gradient(90deg, transparent, var(--brand-500, #409eff), transparent); transform: translateX(-100%); }
.dsm-scan-bar.is-active span { animation: dsm-scan-slide 1s linear infinite; }
@keyframes dsm-scan-slide { to { transform: translateX(350%); } }
.dsm-stream-field { display: inline-flex; align-items: center; gap: 6px; margin-right: 10px; }
.dsm-empty-inline { padding: 16px; color: var(--text-tertiary); font-size: 13px; }
.mono { font-family: "JetBrains Mono", "Consolas", monospace; }
.dsm-node-form { display: flex; flex-direction: column; gap: 14px; }
.dsm-form-item { display: flex; flex-direction: column; gap: 6px; }
.dsm-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.dsm-form-hint { font-size: 12px; line-height: 1.5; color: var(--text-tertiary); }
.dsm-seg { display: inline-flex; border: 1px solid var(--border-default); border-radius: 6px; overflow: hidden; background: var(--bg-elevated); }
.dsm-seg button { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 12px; color: var(--text-secondary); background: transparent; border: none; border-right: 1px solid var(--border-default); cursor: pointer; transition: background 0.15s, color 0.15s; }
.dsm-seg button:last-child { border-right: none; }
.dsm-seg button:hover { background: var(--bg-hover); color: var(--text-primary); }
.dsm-seg button.is-active { background: var(--brand-50); color: var(--brand-600); font-weight: 600; }
.dsm-value-view { min-height: 80px; }
/* JSON 叠加编辑器：高亮层绝对定位铺满（只读、透明度不透出），编辑层透明文字叠在其上；
   两层同 font/padding/white-space，保证逐字符对齐；滚动由编辑层驱动、高亮层跟随。 */
.dsm-json-editor { position: relative; flex: 1; min-height: 160px; }
.dsm-json-hl { position: absolute; inset: 0; margin: 0; padding: 12px; overflow: hidden; background: var(--bg-fill); border-radius: 6px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; line-height: 1.5; color: var(--text-primary); white-space: pre-wrap; word-break: break-all; pointer-events: none; }
.dsm-json-input { position: relative; z-index: 1; width: 100%; height: 100%; min-height: 160px; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-all; color: transparent; caret-color: var(--text-primary); background: transparent; border: 1px solid var(--border-default); border-radius: 6px; resize: none; outline: none; }
.dsm-json-input:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
/* JSON 高亮（v-html 注入的 span 不带 scope 属性 → 必须 :deep） */
.dsm-json-hl:deep(.dsm-json-key) { color: var(--brand-600, #409eff); font-weight: 600; }
.dsm-json-hl:deep(.dsm-json-str) { color: var(--success, #67c23a); }
.dsm-json-hl:deep(.dsm-json-num) { color: var(--warning, #e6a23c); }
.dsm-json-hl:deep(.dsm-json-lit) { color: var(--danger, #f56c6c); font-style: italic; }
.dsm-json-hl:deep(.dsm-json-punct) { color: var(--text-tertiary); }
.dsm-node-data { width: 100%; padding: 12px; font-family: "JetBrains Mono", "Consolas", monospace; font-size: 13px; border: 1px solid var(--border-default); border-radius: 6px; background: var(--bg-elevated); color: var(--text-primary); resize: vertical; outline: none; }
.dsm-node-data:focus { border-color: var(--brand-400); box-shadow: var(--focus-ring); }
</style>
