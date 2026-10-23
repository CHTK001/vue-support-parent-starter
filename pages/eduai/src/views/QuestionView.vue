<template>
  <div class="page-container">
    <!-- 上区：渐变页头 + 右侧悬浮正方形统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">题库管理</h1>
          <p class="page-header__sub">管理题目、试卷与知识点关联</p>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="st in statCards" :key="st.title" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">{{ st.title }}</div>
            <div class="stat-card__value">{{ st.value }}</div>
            <div v-if="st.hint" class="stat-card__hint" v-html="st.hint" />
          </div>
          <div class="stat-card__icon" :style="{ background: st.bg }">
            <el-icon :size="22"><component :is="st.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <div class="filter-field filter-field--search">
          <el-input
            v-model="searchDraft.keyword"
            clearable
            placeholder="搜索题干、知识点…"
            :prefix-icon="Search"
            @keyup.enter="commitSearch"
            @change="commitSearch"
            @clear="commitSearch"
          />
        </div>
        <div class="filter-field">
          <el-select
            v-model="searchDraft.subject"
            clearable
            filterable
            placeholder="全部学科"
            style="width: 100%"
            @change="commitSearch"
          >
            <el-option v-for="s in subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
        <div class="filter-field filter-field--inline">
          <label class="filter-field__label">题型</label>
          <el-select v-model="searchDraft.type" clearable placeholder="全部题型" style="width: 100%" @change="commitSearch">
            <el-option v-for="t in QUESTION_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </div>
        <div class="filter-field filter-field--inline">
          <label class="filter-field__label">难度</label>
          <el-select v-model="searchDraft.difficulty" clearable placeholder="全部难度" style="width: 100%" @change="commitSearch">
            <el-option v-for="d in DIFFICULTIES" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </div>
        <div class="filter-field">
          <el-select v-model="searchDraft.status" clearable placeholder="全部状态" style="width: 100%" @change="commitSearch">
            <el-option v-for="s in STATUS_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
        <div class="filter-field">
          <el-select v-model="searchDraft.auditStatus" clearable placeholder="全部审核" style="width: 100%" @change="commitSearch">
            <el-option v-for="s in AUDIT_OPTIONS" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" :loading="loading" @click="commitSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
        </div>
      </div>
    </el-card>

    <!-- 工具条 + 表格 -->
    <el-card shadow="never" class="table-card">
      <div class="table-toolbar">
        <div class="table-toolbar__left">
          <el-button type="primary" :icon="Plus" @click="openCreate" text>新增题目</el-button>
          <el-button :icon="Upload" @click="openImport" text>批量导入</el-button>
          <template v-if="isAdmin()">
            <el-button
              type="success"
              text
              :disabled="!selectedIds.length"
              @click="() => batchAudit(true)"
            >
              批量通过{{ selectedIds.length ? `(${selectedIds.length})` : "" }}
            </el-button>
            <el-button
              type="danger"
              text
              :disabled="!selectedIds.length"
              @click="() => batchAudit(false)"
            >
              批量驳回{{ selectedIds.length ? `(${selectedIds.length})` : "" }}
            </el-button>
            <el-button :icon="Setting" @click="openConfig" text>老师上传配置</el-button>
          </template>
        </div>
        <ReTab
          v-model="applied.orderBy"
          class="sort-tabs"
          variant="capsule"
          nav-only
          :tabs="SORT_TABS"
          @tab-change="onSortTabChange"
        />
        <div class="view-toggle" role="group" aria-label="视图切换">
          <button
            type="button"
            class="view-toggle__btn"
            :class="{ 'is-active': viewMode === 'list' }"
            title="列表视图"
            @click="viewMode = 'list'"
          >
            <el-icon><Menu /></el-icon>
          </button>
          <button
            type="button"
            class="view-toggle__btn"
            :class="{ 'is-active': viewMode === 'card' }"
            title="卡片视图"
            @click="viewMode = 'card'"
          >
            <el-icon><Grid /></el-icon>
          </button>
        </div>
      </div>

      <div v-loading="loading" class="table-wrap">
        <!-- 列表视图 -->
        <template v-if="viewMode === 'list'">
          <!--
            列表视图：改用 ReTable（题库管理是最后一个还用裸 el-table 的管理页，
            其余 9 个已是 ReTable）。
            本页自己的「列表/卡片」切换与底部 el-pagination 保留不动，
            所以关掉 ReTable 自带的 toolbar / pagination，避免出现两套分页与工具条。
          -->
          <ReTable
            :data="rows"
            :columns="questionColumns"
            :row-key="'questionId'"
            layout="table"
            :layout-switch="false"
            :pagination="false"
            :toolbar="false"
            :show-selection="isAdmin()"
            border
            stripe
            class="question-table"
            empty-text="暂无题目，点击「新增题目」创建"
            @row-click="(row: Record<string, unknown>) => openEdit(row as unknown as Question)"
            @selection-change="onSelectionChange"
          >
            <template #col-questionType="{ row }">
              <span class="tag-pill" :class="typeClass(row.questionType)">
                {{ typeLabel(row.questionType) }}
              </span>
            </template>
            <template #col-gradeRange="{ row }">
              {{ levelLabel(row.questionGradeLevel) }}{{ row.questionGrade || "" }}
            </template>
            <template #col-questionDifficulty="{ row }">
              <span class="tag-pill" :class="diffClass(row.questionDifficulty)">
                {{ diffLabel(row.questionDifficulty) }}
              </span>
            </template>
            <template #col-stem="{ row }">
              <span class="stem-cell" v-html="stemSummary(row as unknown as Question)" />
            </template>
            <template #col-questionUseCount="{ row }">{{ row.questionUseCount ?? 0 }}次</template>
            <!--
              添加次数：被新加入某张试卷的次数（改分、重复提交不重复计）。
              与「使用次数」语义不同，单独一列；点上方「添加最多」可按它排序。
            -->
            <template #col-questionAddCount="{ row }">
              <span :class="{ 'add-count--hot': (row.questionAddCount ?? 0) > 0 }">
                {{ row.questionAddCount ?? 0 }}次
              </span>
            </template>
            <template #col-questionAuditStatus="{ row }">
              <el-tooltip
                :content="auditTip(row as unknown as Question)"
                placement="top"
                :disabled="!auditTip(row as unknown as Question)"
              >
                <span class="tag-pill" :class="auditClass(row.questionAuditStatus)">
                  {{ auditLabel(row.questionAuditStatus) }}
                </span>
              </el-tooltip>
              <span v-if="(row.questionAuditCount ?? 0) > 0" class="audit-count" title="累计审核次数">
                ×{{ row.questionAuditCount }}
              </span>
            </template>
            <template #col-questionStatus="{ row }">
              <span class="status-dot" :class="row.questionStatus === 0 ? 'is-off' : 'is-on'" />
              <span class="status-text">{{ row.questionStatus === 0 ? "草稿" : "已发布" }}</span>
            </template>
            <template #col-actions="{ row }">
              <!-- 必须 .stop：ReTable 绑了 @row-click 打开编辑，不阻止冒泡会再多弹一次 -->
              <ReButton
                layout="square"
                type="primary"
                :icon="EditPen"
                tip="编辑"
                @click.stop="openEdit(row as unknown as Question)"
              />
              <template v-if="isAdmin()">
                <ReButton
                  layout="square"
                  type="success"
                  :icon="CircleCheck"
                  tip="审核通过"
                  @click.stop="auditOne(row as unknown as Question, true)"
                />
                <ReButton
                  layout="square"
                  type="danger"
                  :icon="CircleClose"
                  tip="驳回（需填理由）"
                  @click.stop="auditOne(row as unknown as Question, false)"
                />
              </template>
            </template>
            <!-- 空态门控：本页 loading 是自己 div 上的 v-loading，没传给 ReTable，
                 所以这里显式跟随 —— 加载窗口内不画空态，杜绝「暂无数据」闪现 -->
            <template #empty>
              <el-empty
                v-if="!loading"
                description="暂无题目，点击「新增题目」创建"
                :image-size="96"
              />
            </template>
          </ReTable>
        </template>

        <!-- 卡片视图 -->
        <template v-else>
          <div v-if="rows.length" class="q-card-grid">
            <!-- 卡片本身可点：补 role/tabindex 让键盘能聚焦，:focus-visible 的焦点环才有意义 -->
            <div
              v-for="row in rows"
              :key="row.questionId"
              class="q-card"
              role="button"
              tabindex="0"
              @click="openEdit(row)"
            >
              <div class="q-card__top">
                <span class="tag-pill" :class="typeClass(row.questionType)">
                  {{ typeLabel(row.questionType) }}
                </span>
                <span class="q-card__id">#{{ row.questionId }}</span>
              </div>
              <div class="q-card__stem" v-html="stemSummary(row)" />
              <div class="q-card__meta">
                <span class="q-card__meta-item">{{ row.questionSubject || "—" }}</span>
                <span class="q-card__meta-item">
                  {{ levelLabel(row.questionGradeLevel) }}{{ row.questionGrade || "" }}
                </span>
                <span class="tag-pill tag-pill--sm" :class="diffClass(row.questionDifficulty)">
                  {{ diffLabel(row.questionDifficulty) }}
                </span>
              </div>
              <div class="q-card__footer">
                <el-tooltip
                  :content="auditTip(row)"
                  placement="top"
                  :disabled="!auditTip(row)"
                >
                  <span class="tag-pill tag-pill--sm" :class="auditClass(row.questionAuditStatus)">
                    {{ auditLabel(row.questionAuditStatus) }}
                  </span>
                </el-tooltip>
                <span v-if="(row.questionAuditCount ?? 0) > 0" class="audit-count" title="累计审核次数">
                  ×{{ row.questionAuditCount }}
                </span>
                <span class="status-dot" :class="row.questionStatus === 0 ? 'is-off' : 'is-on'" />
                <span class="status-text">{{ row.questionStatus === 0 ? "草稿" : "已发布" }}</span>
                <span class="q-card__use">使用 {{ row.questionUseCount ?? 0 }}次</span>
                <span class="q-card__use">加入 {{ row.questionAddCount ?? 0 }}次</span>
                <ReButton
                  layout="square"
                  type="primary"
                  :icon="EditPen"
                  tip="编辑"
                  @click.stop="openEdit(row)"
                />
              </div>
            </div>
          </div>
          <el-empty
            v-else-if="!loading"
            description="暂无题目，点击「新增题目」创建"
          />
        </template>
      </div>

      <div class="table-footer">
        <span class="table-footer__total">共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          background
          @current-change="loadPage"
          @size-change="onSizeChange"
        />
      </div>
    </el-card>

    <!-- 编辑/新增对话框（按原型分节） -->
    <ReDialog
      v-model="dialogVisible"
      class="q-dialog"
      width="1120"
      :show-close="false"
      :show-window-shell="false"
      align-center
    >
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon">
              <el-icon :size="18"><Document /></el-icon>
            </span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ form.questionId ? "编辑题目" : "新增题目" }}</div>
              <div class="dialog-head__sub">创建新的题目，关联知识点</div>
            </div>
          </div>
          <button type="button" class="dialog-head__close" aria-label="关闭" @click="dialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="q-dialog__body">
        <div class="dialog-grid">
          <div class="dialog-col dialog-col--form">
        <el-form :model="form" label-width="110" @submit.prevent>
          <!-- 分节：基本信息 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />基本信息</div>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="题型" required>
              <el-select v-model="form.questionType" placeholder="选择题型" style="width: 100%">
                <el-option
                  v-for="t in QUESTION_TYPES"
                  :key="t.value"
                  :label="t.label"
                  :value="t.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="学科" required>
              <el-select
                v-model="form.questionSubject"
                filterable
                allow-create
                default-first-option
                placeholder="选择学科"
                style="width: 100%"
              >
                <el-option
                  v-for="s in subjectMeta"
                  :key="s.subjectCode || s.subjectName"
                  :label="s.subjectName"
                  :value="s.subjectName"
                />
              </el-select>
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="总分" required>
              <ReInputNumber
                v-model="form.questionScore"
                :min="1"
                :max="150"
                :step="1"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="难度">
              <div class="difficulty-row">
                <el-rate v-model="form.questionDifficulty" :max="5" />
                <span class="difficulty-row__text">{{ difficultyText }}</span>
              </div>
            </el-form-item>
          </div>
          <div class="form-grid form-grid--2">
            <el-form-item label="学段">
              <el-select
                v-model="form.questionGradeLevel"
                placeholder="选择学段"
                style="width: 100%"
                @change="onGradeLevelChange"
              >
                <el-option v-for="lv in GRADE_LEVELS" :key="lv.code" :label="lv.label" :value="lv.code" />
              </el-select>
            </el-form-item>
            <el-form-item label="年级" required>
              <!-- 纯选择：学段+年级都有完整词表（4 学段 / 16 年级），不允许自由输入 -->
              <el-select v-model="form.questionGrade" placeholder="选择年级" style="width: 100%">
                <el-option
                  v-for="g in gradeMetaOptions"
                  :key="g.gradeName"
                  :label="g.gradeName"
                  :value="g.gradeName"
                />
              </el-select>
            </el-form-item>
          </div>

          <!-- 分节：题干 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />题干</div>
          </div>
          <el-form-item required>
            <ReRichText
              v-model="form.questionStem"
              placeholder="请输入题目题干内容，支持加粗/列表/图片等富文本…"
              class="w-full"
            />
          </el-form-item>

          <!-- 分节：选项设置 -->
          <template v-if="isChoice">
            <div class="form-section">
              <div class="form-section__title"><span class="form-section__bar" />选项设置</div>
            </div>
            <div class="option-list">
              <div v-for="(opt, idx) in optionRows" :key="idx" class="option-row">
                <span class="option-badge" :class="optionBadgeClass(idx)">{{ optionLetter(idx) }}</span>
                <ScFormulaField
                  v-model="optionRows[idx]"
                  :placeholder="`选项 ${optionLetter(idx)} 内容（点击 ƒx 打开公式编辑）`"
                  class="option-row__field"
                />
                <button
                  type="button"
                  class="option-row__del"
                  :disabled="optionRows.length <= 2"
                  :title="`删除选项 ${optionLetter(idx)}`"
                  @click="removeOption(idx)"
                >
                  <el-icon :size="16"><Delete /></el-icon>
                </button>
              </div>
              <button type="button" class="option-add" @click="optionRows.push('')">
                <el-icon><Plus /></el-icon> 添加选项
              </button>
            </div>

            <div class="answer-row">
              <span class="answer-row__label">标准答案</span>
              <div class="answer-chips">
                <button
                  v-if="form.questionType === 'SINGLE_CHOICE'"
                  v-for="(opt, idx) in optionRows"
                  :key="idx"
                  type="button"
                  class="answer-chip"
                  :class="{ 'is-active': answerSingle[0] === optionLetter(idx), 'is-disabled': !opt.trim() }"
                  :disabled="!opt.trim()"
                  @click="answerSingle = [optionLetter(idx)]"
                >{{ optionLetter(idx) }}</button>
                <template v-else>
                  <button
                    v-for="(opt, idx) in optionRows"
                    :key="idx"
                    type="button"
                    class="answer-chip"
                    :class="{ 'is-active': answerMulti.includes(optionLetter(idx)), 'is-disabled': !opt.trim() }"
                    :disabled="!opt.trim()"
                    @click="toggleMultiAnswer(optionLetter(idx))"
                  >{{ optionLetter(idx) }}</button>
                </template>
              </div>
            </div>
          </template>

          <!-- 非选择题答案（判断/填空/简答/作文） -->
          <template v-else>
            <div class="form-section">
              <div class="form-section__title"><span class="form-section__bar" />标准答案</div>
            </div>
            <template v-if="form.questionType === 'JUDGE'">
              <div class="answer-chips answer-chips--judge">
                <button
                  type="button"
                  class="answer-chip answer-chip--judge"
                  :class="{ 'is-active': form.questionAnswer === '对' }"
                  @click="form.questionAnswer = '对'"
                >对</button>
                <button
                  type="button"
                  class="answer-chip answer-chip--judge"
                  :class="{ 'is-active': form.questionAnswer === '错' }"
                  @click="form.questionAnswer = '错'"
                >错</button>
              </div>
            </template>
            <el-form-item v-else-if="form.questionType === 'FILL'" required>
              <el-input
                v-model="form.questionAnswer"
                type="textarea"
                :rows="2"
                placeholder="多个空用 / 或 | 分隔，如：1、"
              />
            </el-form-item>
            <el-form-item v-else required>
              <ReRichText
                v-model="answerRich"
                :placeholder="form.questionType === 'ESSAY' ? '评分标准 / 范文要点（富文本）' : '参考答案（富文本，可列表、加粗）'"
                class="w-full"
              />
            </el-form-item>
          </template>

          <!-- 分节：解析与知识点 -->
          <div class="form-section">
            <div class="form-section__title"><span class="form-section__bar" />解析与知识点</div>
          </div>
          <el-form-item label="解析">
            <ReRichText v-model="analysisRich" placeholder="题目解析（富文本，支持列表、加粗、下划线）" class="w-full" />
          </el-form-item>
          <el-form-item label="知识点">
            <el-select
              v-model="knowledgeIds"
              multiple
              filterable
              remote
              clearable
              reserve-keyword
              placeholder="输入关键字远程检索知识点"
              :remote-method="searchKnowledge"
              :loading="kpLoading"
              style="width: 100%"
              @change="syncKnowledgeIds"
            >
              <el-option
                v-for="kp in kpOptions"
                :key="kp.knowledgePointId"
                :label="kp.knowledgePointName"
                :value="String(kp.knowledgePointId)"
              >
                <span>{{ kp.knowledgePointName }}</span>
                <span v-if="kp.knowledgePointCode" class="kp-code">{{ kp.knowledgePointCode }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="来源">
            <el-input
              v-model="form.questionSource"
              maxlength="200"
              show-word-limit
              placeholder="题目来源；题库手动新增默认“手动录入”，采集入库自动填任务名"
            />
          </el-form-item>
        </el-form>
          </div>

          <!-- 右侧：实时题面预览（公式直接渲染，不显示源码） -->
          <aside class="dialog-col dialog-col--preview">
            <div class="preview-head">
              <span class="preview-head__title">实时预览</span>
              <span class="preview-head__tip">随左侧表单更新</span>
            </div>
            <div class="preview-card">
              <div class="preview-card__meta">
                <span class="tag-pill" :class="typeClass(form.questionType)">{{ typeLabel(form.questionType) }}</span>
                <span class="preview-card__chip">{{ form.questionSubject || "未选学科" }}</span>
                <span class="preview-card__chip">{{ previewGradeText }}</span>
                <span class="preview-card__chip">{{ form.questionScore ?? 5 }} 分</span>
                <span class="tag-pill tag-pill--sm" :class="diffClass(form.questionDifficulty)">
                  {{ diffLabel(form.questionDifficulty) }}
                </span>
              </div>

              <div class="preview-block">
                <div class="preview-block__label">题干</div>
                <div v-if="previewStemHtml" class="preview-stem" v-html="previewStemHtml" />
                <div v-else class="preview-ph">（未填写题干）</div>
              </div>

              <div v-if="isChoice" class="preview-block">
                <div class="preview-block__label">选项</div>
                <div class="preview-options">
                  <div
                    v-for="o in previewOptions"
                    :key="o.letter"
                    class="preview-option"
                    :class="{ 'is-answer': previewAnswerLetters.includes(o.letter) }"
                  >
                    <span class="preview-option__letter">{{ o.letter }}</span>
                    <span class="preview-option__text" v-html="o.html || '（未填写）'" />
                  </div>
                </div>
              </div>

              <div class="preview-block">
                <div class="preview-block__label">参考答案</div>
                <div v-if="isChoice" class="preview-answer-letters">
                  <span v-if="!previewAnswerLetters.length" class="preview-ph">（未选择）</span>
                  <span v-for="l in previewAnswerLetters" :key="l" class="preview-answer-letter">{{ l }}</span>
                </div>
                <div v-else-if="form.questionType === 'JUDGE'" class="preview-text">
                  <span v-if="form.questionAnswer">{{ form.questionAnswer }}</span>
                  <span v-else class="preview-ph">（未选择）</span>
                </div>
                <div v-else class="preview-text">
                  <span v-if="previewAnswerTextHtml" v-html="previewAnswerTextHtml" />
                  <span v-else class="preview-ph">（未填写）</span>
                </div>
              </div>

              <div class="preview-block">
                <div class="preview-block__label">解析</div>
                <div v-if="previewAnalysisHtml" class="preview-stem" v-html="previewAnalysisHtml" />
                <div v-else class="preview-ph">（未填写解析）</div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            v-if="isAdmin() && !form.questionId"
            type="success"
            :loading="saving"
            @click="() => save(true)"
          >
            保存并审核
          </el-button>
          <el-button class="dialog-foot__save" type="primary" :loading="saving" @click="() => save(false)">
            保存题目
          </el-button>
        </div>
      </template>
    </ReDialog>

    <!-- 批量导入对话框 -->
    <ReDialog v-model="importDialogVisible" title="批量导入题目（JSON 数组）" width="720">
      <el-input v-model="importJson" type="textarea" :rows="12" placeholder='[{"questionType":"JUDGE","questionSubject":"数学","questionGradeLevel":"小学","questionGrade":"三年级","questionStem":"...","questionAnswer":"T"}]' />
      <p class="import-hint">必填：题型 questionType、学科 questionSubject、学段 questionGradeLevel、年级 questionGrade、题干 questionStem、答案 questionAnswer；选择题选项需为 JSON 字符串。</p>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importing" @click="doImport">导入</el-button>
      </template>
    </ReDialog>

    <!-- 老师上传配置对话框（管理员）：老师上传题目是否自动通过 -->
    <ReDialog v-model="configVisible" title="老师上传配置" width="460">
      <el-form label-width="130px">
        <el-form-item label="老师上传自动通过">
          <el-switch v-model="autoApprove" />
          <span class="config-hint">
            开启后老师上传的题目直接入库为「已通过」；关闭则进入待审核队列，需管理员在题库审批
          </span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="configVisible = false">取消</el-button>
        <el-button type="primary" :loading="configSaving" @click="saveConfig">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * QuestionView —— 题库管理（按原型重构）
 *
 * - 页头渐变 + 右侧悬浮统计卡 + 筛选 + 表格（与知识库/维度数据同风格）
 * - 统计：题目总数 / 今日新增 / 待审核（拉全量近似，规模可控）
 * - 编辑对话框与批量导入逻辑保持原样
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import {
  CircleCheck,
  CircleClose,
  Close,
  Delete,
  Document,
  EditPen,
  Grid,
  Menu,
  Plus,
  RefreshLeft,
  Search,
  Setting,
  Upload,
  Warning,
} from "@element-plus/icons-vue";
import type { Component } from "vue";
import { eduaiApi } from "../api/eduaiApi";
import { strParam } from "../api/pageLoader";
import type { EduGrade, EduSubject, KnowledgePoint, Question, QuestionGradeDimension } from "../api/types";
import ReRichText from "@repo/ui/re-rich-text";
import ReTab from "@repo/ui/re-tab";
import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import {isAdmin, message} from "@repo/core";
import ScFormulaField from "../components/ScFormulaField.vue";
import { htmlToMathText, renderMathSummary, renderMixedText, renderRichWithMath } from "../utils/mathText";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";

/** 学段词表：码值与 edu_question 落库值一致 */
const GRADE_LEVELS = [
  { code: "PRIMARY", label: "小学" },
  { code: "JUNIOR", label: "初中" },
  { code: "SENIOR", label: "高中" },
  { code: "UNIVERSITY", label: "大学" },
  { code: "OTHER", label: "其他" },
];

const QUESTION_TYPES = [
  { value: "SINGLE_CHOICE", label: "单选题" },
  { value: "MULTIPLE_CHOICE", label: "多选题" },
  { value: "JUDGE", label: "判断题" },
  { value: "FILL", label: "填空题" },
  { value: "SHORT_ANSWER", label: "简答题" },
  { value: "SUBJECTIVE", label: "主观题" },
  { value: "ESSAY", label: "作文" },
];

const DIFFICULTIES = [1, 2, 3, 4, 5].map((n) => ({
  value: n,
  label: `${n} · ${["很易", "较易", "中等", "较难", "很难"][n - 1]}`,
}));

const STATUS_OPTIONS = [
  { label: "启用", value: 1 },
  { label: "停用", value: 0 },
];

/** 审核状态筛选项（题库管理筛选区用，传后端 auditStatus） */
const AUDIT_OPTIONS = [
  { label: "待审核", value: 0 },
  { label: "已通过", value: 1 },
  { label: "驳回", value: 2 },
];

const levelLabel = (code?: string | null) =>
  !code ? "" : GRADE_LEVELS.find((lv) => lv.code === code)?.label ?? "";

const typeLabel = (t?: string) => QUESTION_TYPES.find((x) => x.value === t)?.label ?? t ?? "-";

const typeClass = (t?: string) => {
  const m: Record<string, string> = {
    SINGLE_CHOICE: "is-blue",
    MULTIPLE_CHOICE: "is-green",
    JUDGE: "is-purple",
    FILL: "is-cyan",
    SHORT_ANSWER: "is-orange",
    ESSAY: "is-pink",
  };
  return m[t || ""] || "is-gray";
};

const diffLabel = (n?: number) => {
  if (n == null) return "-";
  if (n <= 2) return "简单";
  if (n === 3) return "中等";
  return "困难";
};

const diffClass = (n?: number) => {
  if (n == null) return "is-gray";
  if (n <= 2) return "is-green";
  if (n === 3) return "is-orange";
  return "is-red";
};

const auditLabel = (n?: number) =>
  ({ 1: "已通过", 2: "驳回", 0: "待审核" } as Record<number, string>)[n ?? 0] || "-";

const auditClass = (n?: number) =>
  ({ 1: "is-green", 2: "is-red", 0: "is-orange" } as Record<number, string>)[n ?? 0] || "is-gray";

/** 审核提示：驳回显示理由，无理由/非驳回不弹 tooltip */
const auditTip = (row: Question) =>
  (row.questionAuditStatus === 2 && row.questionAuditRemark?.trim()
    ? `驳回理由：${row.questionAuditRemark.trim()}`
    : "");

/** 题干摘要：去标签、截断，公式（$...$ / 行内公式节点）渲染为公式 */
const plainText = (html?: string) => htmlToMathText(html);

const stemSummary = (row: Question) => renderMathSummary(row.questionStem, 80) || "-";

// ========== 筛选草稿 + 分页 ==========

const viewMode = ref<"list" | "card">("list");
const loading = ref(false);
const rows = ref<Question[]>([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const dimensions = ref<QuestionGradeDimension[]>([]);

const blankSearch = () => ({ keyword: "", subject: "", type: "", gradeLevel: undefined as string | undefined, grade: undefined as string | undefined, difficulty: null as number | null, status: null as number | null, auditStatus: null as number | null, orderBy: "createTime" });
const searchDraft = reactive(blankSearch());
const applied = reactive(blankSearch());

/**
 * 排序页签（ReTab nav-only）。
 *
 * <p>name 传后端 {@code QuestionQueryDTO.orderBy} 的白名单值（createTime / addCount /
 * useCount / difficulty），后端用 {@code <choose>} 映射到真实列，不做 ${} 拼接。</p>
 */
const SORT_TABS = [
  { name: "createTime", label: "最新", icon: "Clock" },
  { name: "addCount", label: "加入最多", icon: "Collection" },
  { name: "useCount", label: "使用最多", icon: "TrendCharts" },
  { name: "difficulty", label: "难度", icon: "Sort" },
];

/**
 * 题目列表的列定义（ReTable 表格模式用）。
 *
 * <p>自定义单元格一律走 {@code #col-<prop>} 插槽，插槽名与这里的 {@code slot} 字段一一对应；
 * 不在行数据上的两列（{@code gradeRange} / {@code stem}）只是插槽载体，没有真实字段。</p>
 *
 * <p>操作列宽 70 与迁移前一致，并保持 {@code fixed="right"}：横向滚动时编辑按钮不会被推走。</p>
 */
const questionColumns: ReTableColumn[] = [
  { prop: "questionId", label: "ID", width: 80 },
  { prop: "questionType", label: "题型", width: 110, slot: "col-questionType" },
  { prop: "questionSubject", label: "学科", width: 90 },
  { prop: "gradeRange", label: "学段/年级", width: 130, slot: "col-gradeRange" },
  { prop: "questionDifficulty", label: "难度", width: 90, slot: "col-questionDifficulty" },
  { prop: "stem", label: "题干摘要", minWidth: 280, slot: "col-stem" },
  { prop: "questionUseCount", label: "使用次数", width: 100, align: "right", slot: "col-questionUseCount" },
  { prop: "questionAddCount", label: "添加次数", width: 100, align: "right", slot: "col-questionAddCount" },
  { prop: "questionAuditStatus", label: "审核状态", width: 130, slot: "col-questionAuditStatus" },
  { prop: "questionStatus", label: "状态", width: 100, slot: "col-questionStatus" },
  { prop: "actions", label: "操作", width: 150, align: "center", fixed: "right", slot: "col-actions" },
];

const subjectOptions = computed(() => {
  const names = subjectMeta.value.map((s) => s.subjectName).filter(Boolean);
  return [{ label: "全部学科", value: "" }, ...names.map((s) => ({ label: s, value: s }))];
});

const questionStatsValue = reactive({
  total: 0,
  pendingAudit: 0,
  todayNew: 0,
  subjectCount: 0,
});

const statCards = computed(() => {
  const yesterdayDelta = Math.max(0, Number(questionStatsValue.todayNew) - 5);
  return [
    {
      title: "今日审核",
      value: questionStatsValue.pendingAudit,
      icon: Warning,
      bg: "var(--el-color-warning)",
      hint: "需人工审核",
    },
    {
      title: "题目总数",
      value: Number(questionStatsValue.total || total.value).toLocaleString("en-US"),
      icon: Document,
      bg: "var(--el-color-primary)",
      hint: `覆盖${questionStatsValue.subjectCount || "—"}学科`,
    },
    {
      title: "今日新增",
      value: questionStatsValue.todayNew,
      icon: Plus,
      bg: "var(--el-color-success)",
      hint: `较昨日 +${yesterdayDelta}`,
    },
  ];
});

async function loadPage() {
  loading.value = true;
  try {
    const res = await eduaiApi.pageQuestions({
      pageNum: pageNo.value,
      pageSize: pageSize.value,
      keyword: strParam(applied.keyword),
      subject: strParam(applied.subject),
      gradeLevel: strParam(applied.gradeLevel),
      grade: strParam(applied.grade),
      type: strParam(applied.type),
      difficulty: applied.difficulty ?? undefined,
      status: applied.status ?? undefined,
      auditStatus: applied.auditStatus ?? undefined,
      orderBy: applied.orderBy,
      orderDir: "desc",
    });
    rows.value = res?.data ?? [];
    total.value = res?.total ?? rows.value.length;
  } catch (e) {
    message.error("加载题目失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
}

const onSizeChange = () => {
  pageNo.value = 1;
  void loadPage();
};

/** 后端统计：总数 / 待审 / 今日新增 / 学科数 */
const reloadStats = async () => {
  try {
    const res = await eduaiApi.questionStats();
    questionStatsValue.total = Number(res?.total ?? 0);
    questionStatsValue.pendingAudit = Number(res?.pendingAudit ?? 0);
    questionStatsValue.todayNew = Number(res?.todayNew ?? 0);
    questionStatsValue.subjectCount = Number(res?.subjectCount ?? 0);
  } catch {
    // 统计失败不阻断列表；保留上一次成功值
  }
};

const commitSearch = () => {
  // 排序页签直接写 applied，不经过 searchDraft（它没有对应的搜索输入框）
  for (const k of Object.keys(searchDraft) as (keyof typeof searchDraft)[]) {
    if (k === "orderBy") continue;
    (applied as Record<string, unknown>)[k] = searchDraft[k];
  }
  pageNo.value = 1;
  void loadPage();
  void loadDimensions();
};

/** 切换排序页签：立即回到第一页并按新排序重新取数 */
const onSortTabChange = () => {
  pageNo.value = 1;
  void loadPage();
  void reloadStats();
};

const handleReset = () => {
  Object.assign(searchDraft, blankSearch());
  commitSearch();
};

const loadDimensions = async () => {
  try {
    dimensions.value = (await eduaiApi.questionGradeDimensions({})) ?? [];
  } catch {
    dimensions.value = [];
  }
};

// ========== 题型动态表单状态 ==========

const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<Question>>({});

const importDialogVisible = ref(false);
const importJson = ref("");
const importing = ref(false);

const isChoice = computed(
  () => form.questionType === "SINGLE_CHOICE" || form.questionType === "MULTIPLE_CHOICE",
);

const optionRows = ref<string[]>([]);
const answerSingle = ref<string[]>([]);
const answerMulti = ref<string[]>([]);
const answerRich = ref("");
const analysisRich = ref("");

const optionLetter = (i: number) => String.fromCharCode(65 + i);
const optionBadgeClass = (i: number) => `option-badge--${Math.min(i, 5)}`;
const difficultyText = computed(() => {
  const n = form.questionDifficulty ?? 3;
  if (n <= 2) return "简单难度";
  if (n === 3) return "中等难度";
  return "困难难度";
});

function toggleMultiAnswer(letter: string) {
  const i = answerMulti.value.indexOf(letter);
  if (i >= 0) answerMulti.value.splice(i, 1);
  else answerMulti.value.push(letter);
}

// ========== 学科 / 年级下拉元数据 ==========
const subjectMeta = ref<EduSubject[]>([]);
const gradeMeta = ref<EduGrade[]>([]);

const gradeMetaOptions = computed(() => {
  const level = form.questionGradeLevel || "";
  /*
    码值必须先转成 label 再比对：
    form.questionGradeLevel 存的是码值（PRIMARY/JUNIOR/…），
    而后端 gradeMeta[].gradeLevel 返回的是中文（小学/初中/…）。
    直接拿码值比中文永远不命中，会让年级下拉列出全部 16 项、学段筛选形同失效。
  */
  const levelName = level ? (GRADE_LEVELS.find((lv) => lv.code === level)?.label ?? level) : "";
  const list = gradeMeta.value.filter((g) => !levelName || !g.gradeLevel || g.gradeLevel === levelName);
  if (!list.length) return gradeMeta.value;
  return list;
});

const onGradeLevelChange = () => {
  const cur = form.questionGrade || "";
  const ok = gradeMetaOptions.value.some((g) => g.gradeName === cur);
  if (!ok) form.questionGrade = "";
};

async function loadDimensionMeta() {
  try {
    const res = await eduaiApi.dimensionDropdown();
    subjectMeta.value = res?.subjects ?? [];
    gradeMeta.value = res?.grades ?? [];
  } catch {
    try {
      subjectMeta.value = (await eduaiApi.listSubjects()) ?? [];
      gradeMeta.value = (await eduaiApi.listGrades()) ?? [];
    } catch {
      subjectMeta.value = [];
      gradeMeta.value = [];
    }
  }
}

function removeOption(idx: number) {
  optionRows.value.splice(idx, 1);
}

watch(
  optionRows,
  () => {
    const cleaned = optionRows.value.map((s) => s.trim()).filter(Boolean);
    form.questionOptions = cleaned.length ? JSON.stringify(cleaned) : "";
    const valid = cleaned.map((_, i) => optionLetter(i));
    answerSingle.value = answerSingle.value.filter((a) => valid.includes(a));
    answerMulti.value = answerMulti.value.filter((a) => valid.includes(a));
  },
  { deep: true },
);

watch(answerSingle, () => {
  if (form.questionType === "SINGLE_CHOICE") {
    form.questionAnswer = answerSingle.value[0] || "";
  }
});
watch(answerMulti, () => {
  if (form.questionType === "MULTIPLE_CHOICE") {
    form.questionAnswer = answerMulti.value.join(",");
  }
});
watch(answerRich, () => {
  if (!isChoice.value && form.questionType !== "JUDGE" && form.questionType !== "FILL") {
    form.questionAnswer = answerRich.value;
  }
});
watch(analysisRich, () => {
  form.questionAnalysis = analysisRich.value;
});

watch(
  () => form.questionType,
  (t, prev) => {
    if (!t || t === prev) return;
    rebuildAnswerControls(t, form.questionAnswer || "");
  },
);

function parseOptions(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((x) => String(x)) : [];
  } catch {
    return String(raw)
      .split(/\r?\n|;/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

function rebuildAnswerControls(type: string | undefined, answer: string) {
  if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
    const letters = (answer || "")
      .split(/[,，\s]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]$/.test(s));
    if (type === "SINGLE_CHOICE") {
      answerSingle.value = letters.slice(0, 1);
    } else {
      answerMulti.value = letters;
    }
    answerRich.value = "";
  } else if (type === "JUDGE" || type === "FILL") {
    answerSingle.value = [];
    answerMulti.value = [];
    answerRich.value = "";
  } else {
    answerRich.value = answer || "";
    answerSingle.value = [];
    answerMulti.value = [];
  }
  analysisRich.value = form.questionAnalysis || "";
}

// ========== 知识点远程多选 ==========

const knowledgeIds = ref<string[]>([]);
const kpOptions = ref<KnowledgePoint[]>([]);
const kpLoading = ref(false);
const kpPinned = ref<Map<string, KnowledgePoint>>(new Map());

async function searchKnowledge(keyword: string) {
  kpLoading.value = true;
  try {
    const list = (await eduaiApi.listKnowledge({ keyword: keyword || "", limit: 50 })) ?? [];
    const byId = new Map<string, KnowledgePoint>();
    kpPinned.value.forEach((v, k) => byId.set(k, v));
    list.forEach((kp) => byId.set(String(kp.knowledgePointId), kp));
    knowledgeIds.value.forEach((id) => {
      if (!byId.has(id) && kpPinned.value.has(id)) byId.set(id, kpPinned.value.get(id)!);
    });
    kpOptions.value = [...byId.values()];
  } catch {
    kpOptions.value = [...kpPinned.value.values()];
  } finally {
    kpLoading.value = false;
  }
}

function syncKnowledgeIds(ids: string[]) {
  ids.forEach((id) => {
    const hit = kpOptions.value.find((o) => String(o.knowledgePointId) === id);
    if (hit) kpPinned.value.set(id, hit);
  });
  form.questionKnowledgePointIds = ids.join(",");
}

async function hydrateKnowledge(idsStr?: string) {
  const ids = (idsStr || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  knowledgeIds.value = ids;
  kpPinned.value = new Map();
  if (!ids.length) {
    kpOptions.value = [];
    return;
  }
  kpLoading.value = true;
  try {
    const all = (await eduaiApi.listKnowledge({ keyword: "", limit: 200 })) ?? [];
    const map = new Map(all.map((kp) => [String(kp.knowledgePointId), kp]));
    ids.forEach((id) => {
      const hit = map.get(id);
      if (hit) kpPinned.value.set(id, hit);
    });
    kpOptions.value = [...kpPinned.value.values()];
  } catch {
    kpOptions.value = [...kpPinned.value.values()];
  } finally {
    kpLoading.value = false;
  }
}

// ========== 增删改 ==========

const reset = () => {
  Object.assign(form, {
    questionId: undefined,
    // 不预设题型/学段：留空才能显示 placeholder「选择题型」「选择学段」，
    // 也让用户明确做一次选择；题型为空时选项设置区自然隐藏。
    questionType: "",
    questionSubject: applied.subject || "",
    questionGradeLevel: "",
    questionGrade: "",
    questionScore: 5,
    questionDifficulty: 3,
    questionStem: "",
    questionOptions: "",
    questionAnswer: "",
    questionAnalysis: "",
    questionKnowledgePointIds: "",
    questionSource: "手动录入",
    questionSourceType: "MANUAL",
    questionAuditStatus: 0,
    questionStatus: 1,
  });
  optionRows.value = ["", "", "", ""];
  answerSingle.value = [];
  answerMulti.value = [];
  answerRich.value = "";
  analysisRich.value = "";
  knowledgeIds.value = [];
  kpOptions.value = [];
  kpPinned.value = new Map();
  void searchKnowledge("");
};

const openCreate = () => {
  reset();
  dialogVisible.value = true;
};

const openEdit = (row: Question) => {
  Object.assign(form, { ...row });
  optionRows.value = parseOptions(row.questionOptions);
  if (!optionRows.value.length && (row.questionType === "SINGLE_CHOICE" || row.questionType === "MULTIPLE_CHOICE")) {
    optionRows.value = ["", "", "", ""];
  }
  rebuildAnswerControls(row.questionType, row.questionAnswer || "");
  void hydrateKnowledge(row.questionKnowledgePointIds);
  dialogVisible.value = true;
};

const save = async (auditOnSave = false) => {
  const stemPlain = plainText(form.questionStem);
  if (!form.questionType || !form.questionSubject || !stemPlain) {
    message.warning("请填写题型/学科/题干");
    return;
  }
  if (!form.questionScore || form.questionScore < 1) {
    form.questionScore = 5;
  }
  if (isChoice.value) {
    const cleaned = optionRows.value.map((s) => s.trim()).filter(Boolean);
    form.questionOptions = cleaned.length ? JSON.stringify(cleaned) : "";
    if (form.questionType === "SINGLE_CHOICE") {
      form.questionAnswer = answerSingle.value[0] || "";
    } else {
      form.questionAnswer = answerMulti.value.join(",");
    }
  } else if (form.questionType !== "JUDGE" && form.questionType !== "FILL") {
    form.questionAnswer = answerRich.value;
  }
  form.questionAnalysis = analysisRich.value;
  form.questionKnowledgePointIds = knowledgeIds.value.join(",");
  const plainAnswer = String(form.questionAnswer || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
  if (!plainAnswer && isChoice.value) {
    message.warning("请选择标准答案");
    return;
  }
  if (!plainAnswer && (form.questionType === "JUDGE" || form.questionType === "FILL")) {
    message.warning("请填写标准答案");
    return;
  }
  if (!plainAnswer && (form.questionType === "SHORT_ANSWER" || form.questionType === "ESSAY" || form.questionType === "SUBJECTIVE")) {
    message.warning("请填写标准答案");
    return;
  }
  saving.value = true;
  try {
    // 审核态由服务端裁定：前端不经 save 直写 auditStatus；保存并审核走 auditOnSave 通道。
    const { questionAuditStatus: _omitAudit, questionAuditRemark: _omitRemark, ...payload } = form;
    await eduaiApi.saveQuestion({ ...payload, auditOnSave } as Parameters<typeof eduaiApi.saveQuestion>[0]);
    message.success(auditOnSave ? "已保存并审核通过" : "保存成功");
    dialogVisible.value = false;
    await reloadStats();
  } catch (e) {
    message.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    saving.value = false;
  }
};

// ========== 审核（仅管理员；行内单审 + 工具条批量） ==========

/** 当前页勾选项 ID（ReTable selection-change 回写） */
const selectedIds = ref<number[]>([]);

const onSelectionChange = (rows: Question[]) => {
  selectedIds.value = (rows ?? []).map((r) => r.questionId).filter((n) => n > 0);
};

/** 单条审核：通过直接调，驳回弹理由输入框 */
const auditOne = async (row: Question, passed: boolean) => {
  let remark = "";
  if (!passed) {
    try {
      const { value } = await ElMessageBox.prompt("请填写驳回理由（将展示给题目作者）", "驳回题目", {
        confirmButtonText: "确认驳回",
        cancelButtonText: "取消",
        inputPlaceholder: "如：答案与解析不一致",
        inputValidator: (v) => !!v?.trim() || "驳回理由不能为空",
      });
      remark = (value || "").trim();
    } catch {
      return;
    }
  }
  try {
    await eduaiApi.auditQuestion(row.questionId, passed, remark || undefined);
    message.success(passed ? "已通过" : "已驳回");
    await reloadStats();
  } catch (e) {
    message.error("审核失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

/** 批量审核：通过直接调，驳回弹理由输入框；空选时按钮已禁用，这里再兜一层 */
const batchAudit = async (passed: boolean) => {
  if (!selectedIds.value.length) {
    message.warning("请先勾选题目");
    return;
  }
  let remark = "";
  if (!passed) {
    try {
      const { value } = await ElMessageBox.prompt(
        `批量驳回 ${selectedIds.value.length} 题，请填写理由（将展示给题目作者）`,
        "批量驳回",
        {
          confirmButtonText: "确认驳回",
          cancelButtonText: "取消",
          inputPlaceholder: "如：题干表述不清",
          inputValidator: (v) => !!v?.trim() || "驳回理由不能为空",
        },
      );
      remark = (value || "").trim();
    } catch {
      return;
    }
  } else {
    try {
      await ElMessageBox.confirm(`确认批量通过 ${selectedIds.value.length} 题吗？`, "批量通过", {
        type: "success",
        confirmButtonText: "通过",
        cancelButtonText: "取消",
      });
    } catch {
      return;
    }
  }
  try {
    const count = await eduaiApi.auditQuestions(selectedIds.value, passed, remark || undefined);
    message.success(`审核完成，成功 ${count} 条`);
    selectedIds.value = [];
    await reloadStats();
  } catch (e) {
    message.error("批量审核失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

const remove = async (row: Question) => {
  try {
    await ElMessageBox.confirm(`确认删除题目 ${row.questionId} 吗？`, "删除题目", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await eduaiApi.deleteQuestion(row.questionId);
    message.success("已删除");
    await reloadStats();
  } catch (e) {
    message.error("删除失败: " + (e instanceof Error ? e.message : String(e)));
  }
};

const openImport = () => {
  importJson.value = "";
  importDialogVisible.value = true;
};

const doImport = async () => {
  if (!importJson.value.trim()) {
    message.warning("请粘贴 JSON");
    return;
  }
  try {
    const parsed = JSON.parse(importJson.value);
    if (!Array.isArray(parsed)) throw new Error("必须是 JSON 数组");
    importing.value = true;
    const result = await eduaiApi.importQuestions(parsed);
    if (result.successCount === 0 && result.failedCount === 0) {
      message.warning("数组为空，没有可导入的数据");
      return;
    }
    // 失败原因必须透出：后端逐条容错，只回成功条数时用户无从得知缺了什么
    if (result.failedCount > 0) {
      const detail = result.errors.slice(0, 3).join("；");
      const more = result.failedCount > 3 ? `（等 ${result.failedCount} 条失败）` : "";
      message.warning(`导入成功 ${result.successCount} 条，失败 ${result.failedCount} 条：${detail}${more}`);
    } else {
      message.success(`导入成功 ${result.successCount} 条`);
    }
    if (result.successCount > 0) {
      importDialogVisible.value = false;
      await reloadStats();
    }
  } catch (e) {
    message.error("导入失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    importing.value = false;
  }
};

// ========== 实时预览（公式直接渲染，不显示源码） ==========
const previewStemHtml = computed(() => renderRichWithMath(form.questionStem) || "");
const previewAnalysisHtml = computed(() => renderRichWithMath(form.questionAnalysis) || "");
const previewOptions = computed(() =>
  optionRows.value.map((text, idx) => ({
    letter: optionLetter(idx),
    html: renderMixedText(String(text || "")),
  })),
);
const previewAnswerLetters = computed(() => {
  if (form.questionType === "SINGLE_CHOICE") return answerSingle.value;
  if (form.questionType === "MULTIPLE_CHOICE") return answerMulti.value;
  return [];
});
const previewAnswerTextHtml = computed(() => {
  const t = form.questionType;
  if (t === "SHORT_ANSWER" || t === "ESSAY" || t === "SUBJECTIVE") return renderRichWithMath(answerRich.value) || "";
  return renderMixedText(String(form.questionAnswer || ""));
});
const previewGradeText = computed(
  () => `${levelLabel(form.questionGradeLevel)}${form.questionGrade || ""}` || "—",
);

// ========== 老师上传配置（管理员：老师上传题目是否自动通过） ==========
const configVisible = ref(false);
const autoApprove = ref(false);
const configSaving = ref(false);
/** 配置键：与后端 EduAppConfigService 的 KEY 一致 */
const TEACHER_AUTO_APPROVE_KEY = "teacher-question-auto-approve";

/** 读取配置（GET /v2/edu/app-config/{key}；无记录返回 null 按关闭处理） */
async function loadAutoApprove() {
  try {
    const v = await eduaiApi.getAppConfig(TEACHER_AUTO_APPROVE_KEY);
    autoApprove.value = v === "1" || v === "true";
  } catch {
    autoApprove.value = false;
  }
}

const openConfig = () => {
  void loadAutoApprove();
  configVisible.value = true;
};

const saveConfig = async () => {
  configSaving.value = true;
  try {
    await eduaiApi.saveAppConfig(TEACHER_AUTO_APPROVE_KEY, autoApprove.value ? "1" : "0");
    message.success("已保存");
    configVisible.value = false;
  } catch (e) {
    message.error("保存失败: " + (e instanceof Error ? e.message : String(e)));
  } finally {
    configSaving.value = false;
  }
};

onMounted(() => {
  void loadPage();
  void reloadStats();
  void loadDimensions();
  void loadDimensionMeta();
  // 管理员：预读老师上传自动通过配置（工具条「老师上传配置」用）
  if (isAdmin()) {
    void loadAutoApprove();
  }
});
</script>

<style scoped>
.page-container {
  height: 100%;
  overflow: auto;
  background: var(--el-bg-color-page);
}

/* 批量导入对话框的必填字段提示 */
.import-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* 老师上传配置：开关说明 */
.config-hint {
  margin-left: 12px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* ---------- 上区：页头 + 右侧悬浮正方形统计卡 ---------- */
.top-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: -74px;
  position: relative;
  z-index: 2;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
  padding-top: 4px;
  min-width: 0;
  flex: 1;
}
.page-header__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.25;
}
.page-header__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* ---------- 统计：右侧并排正方形悬浮卡 ---------- */
.stats-row {
  display: flex;
  flex-shrink: 0;
  gap: 14px;
  margin-bottom: 0;
}
.stat-card {
  width: 148px;
  height: 148px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  /* koi 卡片不加投影：已有一条边框承载边界，边界色再提浅一档（-light → -lighter） */
  border: 1px solid var(--el-border-color-lighter);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  /* 浮起反馈是 koi 唯一允许的卡片投影 */
  box-shadow: 0 12px 28px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
.stat-card__body {
  min-width: 0;
  width: 100%;
}
.stat-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stat-card__value {
  font-size: 30px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.1;
}
.stat-card__hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stat-card__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-lg, 12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  flex-shrink: 0;
  align-self: flex-end;
}

/* ---------- 筛选（被统计卡下半压住） ---------- */
.filter-card {
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  margin-bottom: 14px;
  border: 0;
  position: relative;
  z-index: 1;
}
.filter-card :deep(.el-card__body) {
  padding: 92px 20px 18px;
}
.filter-grid {
  display: grid;
  grid-template-columns: minmax(200px, 1.6fr) repeat(3, minmax(130px, 1fr)) minmax(120px, 0.9fr) minmax(120px, 0.9fr) auto;
  gap: 14px;
  align-items: center;
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.filter-field--inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.filter-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  flex-shrink: 0;
}
.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.filter-actions .el-button {
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  min-width: 88px;
  font-weight: 600;
}

/* ---------- 表格卡 ---------- */
.table-card {
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  border: 0;
  position: relative;
  z-index: 1;
}
.table-card :deep(.el-card__body) {
  padding: 16px 20px 18px;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

/* 排序页签：占左侧按钮位，与右侧视图切换分居两端 */
.sort-tabs {
  flex: 0 1 auto;
  min-width: 0;
}

/* 「添加次数」大于 0 时标主色，便于一眼看出哪些题已被组卷取用 */
.add-count--hot {
  color: var(--el-color-primary);
  font-weight: 600;
}
.table-toolbar__left {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.table-toolbar__left .el-button {
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  font-weight: 600;
}

.view-toggle {
  display: inline-flex;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
}
.view-toggle__btn {
  width: 40px;
  height: 36px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.view-toggle__btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.view-toggle__btn.is-active {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.table-wrap {
  /* 固定容器高度（同汉字库）：消除滚动条液面高度随滚动反复重算的抖动。
     579 = 本页实测值：wrap.top 503 + 分页条与其间距 50 + 卡片 body 底部内边距 18
     + 余量 8；表格 + 分页正好落在 page-container 可视区（底 892）内，
     不再纵向滚动（消掉残留的 18px 小滚动条）。
     min-height 由 440 收到 300：579 下 900 视口只剩 321，440/320 的下限都会把
     固定高度顶破、页面重新出现纵向滚动。contain: layout size 让 ReTable 走 height:100%。 */
  height: calc(100vh - 579px);
  min-height: 300px;
  contain: layout size;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.question-table {
  width: 100%;
}
.question-table :deep(.el-table__header th) {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  font-weight: 700;
  font-size: 13px;
}
.question-table :deep(.el-table__row) {
  cursor: pointer;
}
.question-table :deep(.el-table__row:hover > td) {
  background: var(--el-color-primary-light-9) !important;
}
.question-table :deep(.el-table__cell) {
  padding: 12px 0;
}
.stem-cell :deep(.katex) {
  font-size: 0.95em;
}

/* ---------- 卡片视图 ---------- */
.q-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  padding: 14px;
}
.q-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 16px;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.q-card:hover {
  border-color: var(--el-color-primary-light-5);
  /* 浮起反馈是 koi 唯一允许的卡片投影 */
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
.q-card:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.q-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.q-card__id {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: 600;
}
.q-card__stem {
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 66px;
}
.q-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.q-card__meta-item {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  padding: 2px 8px;
}
.tag-pill--sm {
  font-size: 11px;
  padding: 2px 8px;
}
/* 审核次数：跟在审核状态 pill 后面的小字（×N），只在审过时渲染 */
.audit-count {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-left: 4px;
  white-space: nowrap;
}
.q-card__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.q-card__use {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-left: auto;
}

/* ---------- 对话框（按原型分节） ---------- */
.q-dialog :deep(.el-dialog__header) {
  padding: 0;
  margin-right: 0;
}
.q-dialog :deep(.el-dialog__body) {
  padding: 0;
}
.q-dialog :deep(.el-dialog__footer) {
  padding: 12px 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
}
.dialog-head__left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.dialog-head__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dialog-head__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.dialog-head__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.dialog-head__close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  font-size: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.dialog-head__close:hover {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}
.dialog-head__close:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.q-dialog__body {
  padding: 0;
}
.dialog-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  align-items: stretch;
}
.dialog-col--form {
  padding: 18px 22px 6px 24px;
  max-height: min(70vh, 760px);
  overflow: auto;
}
.dialog-col--preview {
  padding: 18px 24px 12px 20px;
  max-height: min(70vh, 760px);
  overflow: auto;
  border-left: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
}
.preview-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}
.preview-head__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.preview-head__tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.preview-card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.preview-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.preview-card__chip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-sm, 6px);
  padding: 2px 8px;
}
.preview-block__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}
.preview-stem,
.preview-text {
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
.preview-stem :deep(img) {
  max-width: 100%;
  border-radius: var(--el-radius-sm, 6px);
}
.preview-stem :deep(.katex),
.preview-option__text :deep(.katex) {
  font-size: 1.05em;
}
.preview-ph {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
.preview-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.preview-option {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 14px;
  color: var(--el-text-color-primary);
  padding: 4px 8px;
  border-radius: var(--el-radius-md, 8px);
  border: 1px solid var(--el-border-color-lighter);
}
.preview-option.is-answer {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}
.preview-option__letter {
  flex: 0 0 22px;
  height: 22px;
  /* 选项序号圆用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.preview-option.is-answer .preview-option__letter {
  background: var(--el-color-success);
  color: var(--el-color-white);
}
.preview-option__text {
  flex: 1;
  min-width: 0;
  line-height: 1.7;
  word-break: break-word;
}
.preview-answer-letters {
  display: flex;
  gap: 6px;
}
.preview-answer-letter {
  width: 26px;
  height: 26px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-color-success);
  color: var(--el-color-white);
  font-weight: 700;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.form-section {
  display: flex;
  align-items: center;
  margin: 4px 0 14px;
}
.form-section__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--el-color-primary);
}
.form-section__bar {
  display: none;
}
.form-grid {
  display: grid;
  gap: 0 16px;
}
.form-grid--2 {
  grid-template-columns: 1fr 1fr;
}
.form-grid--3 {
  grid-template-columns: 1fr 1fr 1fr;
}
.difficulty-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.difficulty-row__text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.option-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.option-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.option-row__field {
  flex: 1;
  min-width: 0;
}
.option-row .option-badge,
.option-row .option-row__del {
  margin-top: 2px;
}
.option-badge {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  /* 选项字母圆底用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--el-color-white);
  font-size: 13px;
}
.option-badge--0 { background: var(--el-color-primary); }
.option-badge--1 { background: var(--el-color-success); }
.option-badge--2 { background: var(--el-color-warning); }
.option-badge--3 { background: var(--el-color-danger); }
.option-badge--4 { background: var(--el-color-info); }
.option-badge--5 { background: var(--el-color-primary-dark-2); }
.option-row__del {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  border-radius: var(--el-radius-md, 8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.option-row__del:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}
.option-row__del:disabled {
  color: var(--el-text-color-disabled);
  cursor: not-allowed;
}
.option-row__del:not(:disabled):hover {
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.option-add {
  align-self: flex-start;
  border: 1px dashed var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.option-add:hover {
  background: var(--el-color-primary-light-8);
}
.option-add:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.answer-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.answer-row__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.answer-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.answer-chip {
  min-width: 44px;
  height: 40px;
  padding: 0 16px;
  border: 1.5px solid var(--el-border-color-lighter);
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.answer-chip:hover:not(:disabled):not(.is-disabled) {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.answer-chip:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.answer-chip.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  /* 原选中态投影去掉：主色实心底已足够表达「已选」 */
}
.answer-chip.is-disabled,
.answer-chip:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.answer-chips--judge {
  margin-bottom: 16px;
}
.answer-chip--judge {
  min-width: 72px;
  height: 44px;
  font-size: 16px;
}
.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.dialog-foot .el-button {
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  min-width: 96px;
  font-weight: 600;
}

/* 空态：koi 主题把 empty-block 设成 absolute + translate(-50%,-50%)，
   与 min-height 叠加会把 el-empty 压到顶部成一条细条，这里显式改回静态流式并居中撑高 */
.question-table :deep(.el-table__empty-block) {
  position: static;
  top: auto;
  left: auto;
  transform: none;
  min-height: 440px;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.question-table :deep(.el-table__empty-text) {
  width: 100%;
  min-width: 0;
  padding: 0 16px;
}
.question-table :deep(.el-empty) {
  padding: 40px 0 56px;
}
.question-table :deep(.el-empty__description) {
  margin-top: 10px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* 题型 / 难度 / 审核 pill */
.tag-pill {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-white);
  line-height: 1.4;
  white-space: nowrap;
}
.tag-pill.is-blue { background: var(--el-color-primary); }
.tag-pill.is-green { background: var(--el-color-success); }
.tag-pill.is-orange { background: var(--el-color-warning); }
.tag-pill.is-purple { background: var(--el-color-info); }
.tag-pill.is-cyan {
  background: var(--el-color-primary-light-7);
  color: var(--el-color-primary-dark-2);
}
.tag-pill.is-pink {
  background: var(--el-color-danger-light-3);
  color: var(--el-color-danger-dark-2);
}
.tag-pill.is-red { background: var(--el-color-danger); }
.tag-pill.is-gray {
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}

/* 状态圆点 */
.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  /* 状态圆点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  margin-right: 6px;
  vertical-align: middle;
}
.status-dot.is-on { background: var(--el-color-success); }
.status-dot.is-off { background: var(--el-text-color-placeholder); }
.status-text {
  font-size: 13px;
  color: var(--el-text-color-primary);
  vertical-align: middle;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.table-footer__total {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}
/* 底部分页按钮圆角：el-pagination 的 上一页/下一页/页码 按钮统一读 --el-pagination-border-radius
   （Element 默认 2px，近乎直角）。这里覆盖成与全局按钮一致的圆角（--el-border-radius-base，
   koi 映射到 6px）。走 :deep 是因为 el-pagination 是子组件，其内部类名不带本文件的 scoped 标记。 */
.table-footer :deep(.el-pagination) {
  --el-pagination-border-radius: var(--el-border-radius-base, 6px);
}

/* 表单辅助 */
.option-list { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.option-row { display: flex; align-items: center; gap: 8px; }
.option-letter {
  flex: 0 0 28px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  font-weight: 600;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
  color: var(--el-text-color-primary);
}
.kp-code { margin-left: 8px; font-size: 12px; color: var(--el-text-color-secondary); }
.w-full { width: 100%; }

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(3, minmax(140px, 1fr));
  }
  .stat-card {
    width: 128px;
    height: 128px;
  }
  .stat-card__value {
    font-size: 24px;
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .q-card,
  .answer-chip {
    transition: none;
  }
  /* 位移也是动效：关掉后 :hover 只剩边框/颜色/投影反馈 */
  .stat-card:hover {
    transform: none;
  }
}
</style>
