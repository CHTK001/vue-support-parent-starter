<template>
  <div class="page-container">
    <!-- 左：维度脊柱 —— 学段 → 年级 的只读层级；点学段筛右侧学科，点年级直接编辑 -->
    <aside class="taxo">
      <div class="taxo__head">
        <div class="taxo__title">教学维度</div>
        <div class="taxo__figs">
          <div><b>{{ subjects.length }}</b><span>学科</span></div>
          <div><b>{{ grades.length }}</b><span>年级</span></div>
          <div><b>{{ classes.length }}</b><span>班级</span></div>
        </div>
      </div>

      <div class="taxo__spine">
        <div
          v-for="opt in gradeLevelOptions"
          :key="opt.value"
          class="band"
          :class="{ 'is-on': levelFilter === opt.value }"
        >
          <span class="band__tick" />
          <button
            type="button"
            class="band__head"
            :aria-pressed="levelFilter === opt.value"
            :title="levelFilter === opt.value ? '取消学段筛选' : `只看${opt.label}`"
            @click="toggleLevelFilter(opt.value)"
          >
            <span class="band__name">{{ opt.label }}</span>
            <span class="band__code">{{ opt.value }}</span>
            <span class="band__stat">{{ levelSubjectCount(opt.value) }} 学科 · {{ gradeCount(opt.value) }} 年级</span>
          </button>

          <div class="band__grades">
            <button
              v-for="g in gradesOfLevel(opt.value)"
              :key="g.gradeId"
              type="button"
              class="gchip"
              :title="`排序 ${g.gradeOrder ?? 0} · 创建于 ${g.createTime || '—'}`"
              @click="openGradeEdit(g)"
            >
              {{ g.gradeName }}
            </button>
            <button
              type="button"
              class="gchip gchip--add"
              :title="`在${opt.label}新增年级`"
              @click="openGradeCreate(opt.value)"
            >
              +
            </button>
            <span v-if="!gradesOfLevel(opt.value).length" class="gchip gchip--empty">暂无年级</span>
          </div>
        </div>
      </div>

      <div class="taxo__foot">
        学段为系统内置枚举（{{ gradeLevelOptions.length }} 个），不落库、只读；点学段可筛选学科，点年级可编辑
      </div>
    </aside>

    <!-- 右：主区 —— 学科 / 班级 / 组卷模板 用页签切换，学段与年级留在左侧脊柱 -->
    <div class="main">
      <header class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">维度数据</h1>
          <p class="page-header__sub">管理学科、学段、年级、班级等教学基础维度</p>
        </div>
        <div class="metrics">
          <div class="metric">
            <b>{{ subjects.length }}</b>
            <span>学科总数</span>
            <em>{{ subjectCoverHint }}</em>
          </div>
          <div class="metric">
            <b>{{ gradeLevelOptions.length }}</b>
            <span>学段数</span>
            <em>系统内置</em>
          </div>
          <div class="metric">
            <b>{{ enableRate }}%</b>
            <span>启用率</span>
            <em>{{ enableRateHint }}</em>
          </div>
        </div>
      </header>

      <!-- 三块内容各自一个页签：ReTabs 负责页签条与面板外壳，面板常驻（v-show），
           切走再切回不丢滚动位置、搜索词与已拉取的数据。面板内容按 tab.name 只挂一份。 -->
      <ReTabs v-model="activeBlock" :tabs="blockTabs" :closable="false" class="dim-tabs">
        <!-- 卡头右侧：当前页签的操作行随 activeBlock 切换（搜索 / 筛选 / 新增），
             三个面板共用同一条卡头，所以操作区放在 #actions 而不是各自面板里 -->
        <template #actions>
          <div v-if="activeBlock === 'subject'" class="block__ops">
            <button v-if="levelFilter" type="button" class="filter-tag" @click="levelFilter = ''">
              {{ levelLabel(levelFilter) }}学段 ×
            </button>
            <el-input
              v-model="subjectKeyword"
              class="subject-search"
              clearable
              placeholder="搜索学科 / 编码"
              :prefix-icon="Search"
            />
            <el-button :icon="Upload" @click="onImport">批量导入</el-button>
            <el-button type="primary" :icon="Plus" @click="openSubjectCreate">新增学科</el-button>
          </div>

          <div v-else-if="activeBlock === 'classes'" class="block__ops">
            <el-select
              v-model="classLevelFilter"
              clearable
              placeholder="全部学段"
              style="width: 150px"
              @change="loadClasses"
            >
              <el-option
                v-for="opt in gradeLevelOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="openClassCreate">新增班级</el-button>
          </div>

          <div v-else class="block__ops">
            <el-input
              v-model="templateKeyword"
              class="subject-search"
              clearable
              placeholder="搜索模板名称"
              :prefix-icon="Search"
            />
            <el-button type="primary" :icon="Plus" @click="openTemplateCreate">新增模板</el-button>
          </div>
        </template>

        <template #default="{ tab }">
          <!-- ==================== 学科 ==================== -->
          <section v-if="tab.name === 'subject'" class="block">
            <!-- 表头行：与 .row 共用同一套列宽，读起来像一张真表格 -->
            <div class="thead">
              <span />
              <span>学科</span>
              <span>适用学段</span>
              <span>排序</span>
              <span>状态</span>
              <span class="thead__ops">操作</span>
            </div>

            <div v-loading="subjectLoading" class="rows">
              <div
                v-for="s in filteredSubjects"
                :key="s.subjectId"
                class="row"
                role="button"
                tabindex="0"
                :title="`编辑学科「${s.subjectName}」`"
                @click="openSubjectEdit(s)"
                @keydown.enter.prevent="openSubjectEdit(s)"
              >
                <span class="row__icon" :style="{ background: subjectTheme(s).bg }">
                  <el-icon :size="17"><component :is="subjectTheme(s).icon" /></el-icon>
                </span>

                <span class="row__id">
                  <span class="row__name">{{ s.subjectName }}</span>
                  <span class="row__code">{{ s.subjectCode }}</span>
                </span>

                <span class="row__levels">
                  <span
                    v-for="opt in gradeLevelOptions"
                    :key="opt.value"
                    class="lvdot"
                    :class="{ 'is-on': splitLevels(s.subjectGradeLevels).includes(opt.value) }"
                    :title="opt.label"
                  >{{ opt.label.slice(0, 1) }}</span>
                </span>

                <span class="row__sort">排序 <b>{{ s.subjectSortOrder ?? 0 }}</b></span>

                <span class="status-pill" :class="s.subjectStatus === 1 ? 'is-on' : 'is-off'">
                  <i class="status-dot" />{{ s.subjectStatus === 1 ? "启用中" : "已停用" }}
                </span>

                <span class="row__ops">
                  <button type="button" class="icon-btn" title="编辑" @click.stop="openSubjectEdit(s)">
                    <el-icon><EditPen /></el-icon>
                  </button>
                  <button
                    type="button"
                    class="icon-btn"
                    :title="s.subjectStatus === 1 ? '停用' : '启用'"
                    @click.stop="toggleSubject(s)"
                  >
                    <el-icon><component :is="s.subjectStatus === 1 ? CircleCheckFilled : Close" /></el-icon>
                  </button>
                  <button type="button" class="icon-btn is-danger" title="删除" @click.stop="confirmDeleteSubject(s)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </span>
              </div>

              <div v-if="!subjectLoading && !filteredSubjects.length" class="empty-panel">
                {{ levelFilter ? "该学段下暂无学科，点击「新增学科」创建" : "暂无学科，点击「新增学科」创建" }}
              </div>
            </div>
          </section>

          <!-- ==================== 班级 ==================== -->
          <section v-else-if="tab.name === 'classes'" class="block block--pad">
            <ReTable
              v-loading="classLoading"
              :data="classes"
              :columns="classColumns"
              row-key="classId"
              layout="table"
              :layout-switch="false"
              :layout-table="{ fill: false, minHeight: 168 }"
              stripe
              @row-click="(row: Record<string, unknown>) => openClassEdit(row as unknown as EduClass)"
              :config="{ toolbar: { enable: false } }"
            >
              <template #empty>
                <el-empty :image-size="80" description="暂无班级，点击「新增班级」创建" />
              </template>
              <template #col-classGradeLevel="{ row }">{{ levelLabel(row.classGradeLevel) }}</template>
              <template #col-studentCount="{ row }">{{ classStudentCount(row.classId) }} 人</template>
              <template #col-classStatus="{ row }">
                <span class="status-pill" :class="row.classStatus === 1 ? 'is-on' : 'is-off'">
                  <i class="status-dot" />
                  {{ row.classStatus === 1 ? "启用" : "停用" }}
                </span>
              </template>
              <template #col-actions="{ row }">
                <!-- .stop：ReTable 绑了 @row-click="openClassEdit"，不挡冒泡会顺带打开编辑 -->
                <ReButton
                  layout="square"
                  type="primary"
                  :icon="EditPen"
                  tip="编辑"
                  @click.stop="openClassEdit(row as unknown as EduClass)"
                />
                <ReButton
                  layout="square"
                  type="danger"
                  :icon="Delete"
                  tip="删除"
                  @click.stop="removeClass(row as unknown as EduClass)"
                />
              </template>
            </ReTable>
          </section>

          <!-- ==================== 组卷模板 ==================== -->
          <section v-else class="block block--pad">
            <!-- 组卷模板：ReTable 的 view 模式（一行一块：左边信息、右边操作同屏）。
                 fill:false —— 本页是整页滚动容器，参与「撑满视口」计算会与 ResizeObserver
                 形成高度正反馈（行高一路涨到上千、整页滚动条反复抖动）。 -->
            <ReTable
              v-loading="templateLoading"
              :data="filteredTemplates"
              row-key="templateId"
              layout="view"
              :layout-table="{ fill: false }"
              empty-text="暂无组卷模板，点击「新增模板」创建"
            >
              <ReTableColumn prop="templateName" label="模板名称" />
              <ReTableColumn label="大标题风格" />
              <ReTableColumn label="纸张" />
              <ReTableColumn label="方向" />
              <ReTableColumn label="状态" />
              <template #view="{ row }">
                <div class="tpl-view">
                  <div class="tpl-view__main">
                    <div class="tpl-view__name">{{ asTpl(row).templateName }}</div>
                    <div class="tpl-view__meta">
                      <span class="tpl-chip">{{ templateStyleLabel(asTpl(row).templateStyle) }}</span>
                      <span class="tpl-chip">{{ asTpl(row).templatePageSize || "A4" }}</span>
                      <span class="tpl-chip">{{ templateOrientationLabel(asTpl(row).templateOrientation) }}</span>
                      <span class="status-pill" :class="asTpl(row).templateStatus === 1 ? 'is-on' : 'is-off'">
                        <i class="status-dot" />{{ asTpl(row).templateStatus === 1 ? "启用" : "停用" }}
                      </span>
                    </div>
                  </div>
                  <!-- 操作用 .stop：view 行本身绑了 row-click，不阻止会连点两下 -->
                  <div class="tpl-view__ops">
                    <el-button link type="primary" @click.stop="openTemplateEdit(asTpl(row))">编辑</el-button>
                    <el-popconfirm :title="`确认删除模板「${asTpl(row).templateName}」?`" @confirm="removeTemplate(asTpl(row))">
                      <template #reference>
                        <el-button link type="danger" @click.stop>删除</el-button>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </template>
            </ReTable>
          </section>
        </template>
      </ReTabs>
    </div>

    <!-- 新增/编辑学科（对齐原型） -->
    <ReDialog
      v-model="subjectDialogVisible"
      width="560px"
      class="card-dialog subject-dialog"
      align-center
      :show-close="false"
      :show-window-shell="false"
    >
      <template #header>
        <div class="dlg-header">
          <div class="dlg-header__icon" aria-hidden="true">
            <el-icon :size="26"><Reading /></el-icon>
          </div>
          <div class="dlg-header__text">
            <div class="dlg-header__title">{{ subjectForm.subjectId ? "编辑学科" : "新增学科" }}</div>
            <div class="dlg-header__sub">{{ subjectForm.subjectId ? "更新学科分类信息" : "创建新的学科分类" }}</div>
          </div>
          <button type="button" class="dlg-close" aria-label="关闭" @click="subjectDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="dlg-body">
        <!-- 选择图标 -->
        <div class="pick-section">
          <div class="pick-section__label">选择图标</div>
          <div class="icon-picker">
            <button
              v-for="ic in ICON_OPTIONS"
              :key="ic.key"
              type="button"
              class="icon-opt"
              :class="{ 'is-active': (subjectForm.subjectIcon || 'book') === ic.key }"
              :style="{ '--opt-bg': ic.bg, '--opt-fg': ic.fg }"
              :title="ic.label"
              @click="subjectForm.subjectIcon = ic.key"
            >
              <el-icon :size="26"><component :is="ic.icon" /></el-icon>
            </button>
          </div>
        </div>

        <div class="dlg-divider" />

        <!-- 选择颜色 -->
        <div class="pick-section">
          <div class="pick-section__label">选择颜色</div>
          <div class="color-picker">
            <button
              v-for="c in COLOR_OPTIONS"
              :key="c"
              type="button"
              class="color-dot"
              :class="{ 'is-active': (subjectForm.subjectColor || '#3b82f6') === c }"
              :style="{ background: c }"
              :title="c"
              @click="subjectForm.subjectColor = c"
            />
          </div>
        </div>

        <div class="dlg-divider" />

        <!-- 基本信息 -->
        <div class="block-title">基本信息</div>
        <el-form :model="subjectForm" label-width="96px" label-position="left" class="card-form subject-form">
          <el-form-item label="学科名称" required>
            <el-input v-model="subjectForm.subjectName" placeholder="输入学科名称，如 语文" />
          </el-form-item>
          <el-form-item label="学科编码" required>
            <el-input v-model="subjectForm.subjectCode" placeholder="自动生成，如 chinese" />
          </el-form-item>
        </el-form>

        <!-- 适用学段 -->
        <div class="block-title">适用学段</div>
        <div class="level-pills">
          <button
            v-for="opt in gradeLevelOptions"
            :key="opt.value"
            type="button"
            class="level-pill"
            :class="{ 'is-on': subjectLevels.includes(opt.value) }"
            @click="toggleSubjectLevel(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="dlg-divider" />

        <!-- 其他设置 -->
        <div class="block-title">其他设置</div>
        <el-form :model="subjectForm" label-width="96px" label-position="left" class="card-form subject-form">
          <el-form-item label="排序">
            <ReInputNumber
              v-model="subjectForm.subjectSortOrder"
              :min="0"
              :max="999"
              :controls="false"
              class="num-input is-center"
            />
          </el-form-item>
          <el-form-item label="状态" class="status-item">
            <ReSwitch
              layout="square"
              :model-value="(subjectForm.subjectStatus ?? 1) === 1"
              active-icon="ep:circle-check"
              inactive-icon="ep:circle-close"
              @update:model-value="(v: boolean) => (subjectForm.subjectStatus = v ? 1 : 0)"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="dialog-btn" @click="subjectDialogVisible = false">取消</el-button>
          <el-button class="dialog-btn is-primary" type="primary" :loading="subjectSaving" @click="saveSubject">
            保存学科
          </el-button>
        </div>
      </template>
    </ReDialog>

    <!-- 新增/编辑年级（对齐原型） -->
    <ReDialog
      v-model="gradeDialogVisible"
      width="560px"
      class="card-dialog subject-dialog grade-dialog"
      align-center
      :show-close="false"
      :show-window-shell="false"
    >
      <template #header>
        <div class="dlg-header">
          <div class="dlg-header__icon" aria-hidden="true">
            <el-icon :size="26"><Calendar /></el-icon>
          </div>
          <div class="dlg-header__text">
            <div class="dlg-header__title">{{ gradeForm.gradeId ? "编辑年级" : "新增年级" }}</div>
            <div class="dlg-header__sub">{{ gradeForm.gradeId ? "更新年级分类信息" : "创建新的年级分类" }}</div>
          </div>
          <button type="button" class="dlg-close" aria-label="关闭" @click="gradeDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="dlg-body">
        <!-- 选择学段 -->
        <div class="block-title">选择学段</div>
        <div class="level-pills">
          <button
            v-for="opt in gradeLevelOptions"
            :key="opt.value"
            type="button"
            class="level-pill"
            :class="{ 'is-on': (gradeForm.gradeLevel || 'PRIMARY') === opt.value }"
            @click="onGradeLevelPick(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="dlg-divider" />

        <!-- 基本信息 -->
        <div class="block-title">基本信息</div>
        <el-form :model="gradeForm" label-position="top" class="card-form grade-form">
          <el-form-item label="年级名称" required>
            <el-input v-model="gradeForm.gradeName" placeholder="输入年级名称，如 一年级 / 大一" />
            <div class="field-hint">学段选择后可快速选择常用年级</div>
          </el-form-item>
        </el-form>

        <!-- 快捷选择 -->
        <div class="block-title">快捷选择</div>
        <div class="quick-grid">
          <button
            v-for="name in gradeQuickNames"
            :key="name"
            type="button"
            class="level-pill quick-pill"
            :class="{ 'is-on': gradeForm.gradeName === name }"
            @click="gradeForm.gradeName = name"
          >
            {{ name }}
          </button>
        </div>

        <div class="dlg-divider" />

        <!-- 顺序设置 -->
        <div class="block-title">顺序设置</div>
        <el-form :model="gradeForm" label-width="72px" label-position="left" class="card-form grade-form">
          <el-form-item label="排序">
            <ReInputNumber
              v-model="gradeForm.gradeOrder"
              :min="0"
              :max="999"
              :controls="false"
              class="num-input is-center"
            />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <!-- 二次确认时整条底栏换成「提示 + 取消 + 确认删除」，避免出现两个「取消」 -->
          <template v-if="gradeConfirmDelete">
            <span class="del-confirm__text">删除「{{ gradeForm.gradeName }}」后不可恢复</span>
            <el-button class="dialog-btn" @click="cancelDeleteGrade">取消</el-button>
            <el-button class="dialog-btn is-danger-solid" :loading="gradeSaving" @click="confirmDeleteGrade">
              确认删除
            </el-button>
          </template>
          <template v-else>
            <!-- 年级在脊柱上只是挂片，没有表格行可放删除按钮，删除入口收进编辑弹框 -->
            <span v-if="gradeForm.gradeId" class="dialog-footer__left">
              <el-button class="dialog-btn is-danger" @click="askDeleteGrade">删除年级</el-button>
            </span>
            <el-button class="dialog-btn" @click="gradeDialogVisible = false">取消</el-button>
            <el-button class="dialog-btn is-primary" type="primary" :loading="gradeSaving" @click="saveGrade">
              保存年级
            </el-button>
          </template>
        </div>
      </template>
    </ReDialog>

    <!-- 新增/编辑班级 -->
    <ReDialog
      v-model="classDialogVisible"
      width="560px"
      class="card-dialog subject-dialog grade-dialog"
      align-center
      :show-close="false"
      :show-window-shell="false"
    >
      <template #header>
        <div class="dlg-header">
          <div class="dlg-header__icon" aria-hidden="true">
            <el-icon :size="26"><Grid /></el-icon>
          </div>
          <div class="dlg-header__text">
            <div class="dlg-header__title">{{ classForm.classId ? "编辑班级" : "新增班级" }}</div>
            <div class="dlg-header__sub">班级是学生的必填归属；学生端登记时填的班级名也会自动建立</div>
          </div>
          <button type="button" class="dlg-close" aria-label="关闭" @click="classDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="dlg-body">
        <div class="block-title">选择学段</div>
        <div class="level-pills">
          <button
            v-for="opt in gradeLevelOptions"
            :key="opt.value"
            type="button"
            class="level-pill"
            :class="{ 'is-on': classForm.classGradeLevel === opt.value }"
            @click="classForm.classGradeLevel = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <div class="dlg-divider" />

        <div class="block-title">基本信息</div>
        <el-form :model="classForm" label-position="top" class="card-form grade-form">
          <el-form-item label="班级名称" required>
            <el-input v-model="classForm.className" placeholder="如 三年二班" />
          </el-form-item>
          <el-form-item label="班级编码">
            <el-input v-model="classForm.classCode" placeholder="留空自动生成" />
            <div class="field-hint">唯一标识，留空由后端生成；已有学生挂靠时不要随意改</div>
          </el-form-item>
          <el-form-item label="年级">
            <el-select v-model="classForm.classGrade" clearable placeholder="选择年级" style="width: 100%">
              <el-option v-for="g in classGradeOptions" :key="g" :label="g" :value="g" />
            </el-select>
          </el-form-item>
        </el-form>

        <div class="block-title">状态</div>
        <ReSwitch
          layout="square"
          :model-value="(classForm.classStatus ?? 1) === 1"
          active-icon="ep:circle-check"
          inactive-icon="ep:circle-close"
          @update:model-value="(v: boolean) => (classForm.classStatus = v ? 1 : 0)"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="dialog-btn" @click="classDialogVisible = false">取消</el-button>
          <el-button class="dialog-btn is-primary" type="primary" :loading="classSaving" @click="saveClass">
            保存班级
          </el-button>
        </div>
      </template>
    </ReDialog>

    <!-- 新增/编辑组卷模板 -->
    <ReDialog
      v-model="templateDialogVisible"
      width="640px"
      class="card-dialog subject-dialog template-dialog"
      align-center
      :show-close="false"
      :show-window-shell="false"
    >
      <template #header>
        <div class="dlg-header">
          <div class="dlg-header__icon" aria-hidden="true">
            <el-icon :size="26"><Document /></el-icon>
          </div>
          <div class="dlg-header__text">
            <div class="dlg-header__title">{{ templateForm.templateId ? "编辑组卷模板" : "新增组卷模板" }}</div>
            <div class="dlg-header__sub">{{ templateForm.templateId ? "更新模板样式与页眉页脚" : "创建可复用的组卷模板" }}</div>
          </div>
          <button type="button" class="dlg-close" aria-label="关闭" @click="templateDialogVisible = false">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </template>

      <div class="dlg-body">
        <!-- 基本信息 -->
        <div class="block-title">基本信息</div>
        <el-form :model="templateForm" label-width="96px" label-position="left" class="card-form subject-form">
          <el-form-item label="模板名称" required>
            <el-input v-model="templateForm.templateName" placeholder="输入模板名称，如 期末考试卷" />
          </el-form-item>
          <el-form-item label="大标题风格">
            <el-select v-model="templateForm.templateStyle" style="width: 100%">
              <el-option
                v-for="opt in TEMPLATE_STYLE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="纸张规格">
            <el-select v-model="templateForm.templatePageSize" style="width: 100%">
              <el-option
                v-for="opt in TEMPLATE_PAGE_SIZE_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="纸张方向">
            <el-select v-model="templateForm.templateOrientation" style="width: 100%">
              <el-option label="纵向" value="PORTRAIT" />
              <el-option label="横向" value="LANDSCAPE" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" class="status-item">
            <ReSwitch
              layout="square"
              :model-value="(templateForm.templateStatus ?? 1) === 1"
              active-icon="ep:circle-check"
              inactive-icon="ep:circle-close"
              @update:model-value="(v: boolean) => (templateForm.templateStatus = v ? 1 : 0)"
            />
          </el-form-item>
        </el-form>

        <div class="dlg-divider" />

        <!-- 页眉 / 页脚（富文本） -->
        <div class="block-title">页眉（富文本）</div>
        <ReRichText v-model="templateForm.templateHeader" placeholder="如：XX 学校 2026 学年第一学期期末考试" />

        <div class="block-title">页脚（富文本）</div>
        <ReRichText v-model="templateForm.templateFooter" placeholder="如：考试时间 90 分钟，满分 100 分" />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="dialog-btn" @click="templateDialogVisible = false">取消</el-button>
          <el-button class="dialog-btn is-primary" type="primary" :loading="templateSaving" @click="saveTemplate">
            保存模板
          </el-button>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 维度数据 —— 彻底重构（2026-10）：
 * - 取消 5 个 Tab：整条层级链（学段 → 年级 → 班级，学科按「适用学段」挂靠）一屏铺开
 * - 左「维度脊柱」：学段为节点、年级为挂片；点学段筛右侧学科，点年级直接进编辑，+ 就地新增
 * - 右主区：页头内联读数（学科总数 / 学段数 / 启用率）+ 学科行 + 班级表 + 组卷模板
 * - 学科行：图标/编码/学段字母块/排序/启停/编辑删除，整行可点（表格同款 row-click 约定）
 * - 学段仍为系统内置枚举，只读；年级 / 班级 / 组卷模板仍是弹框 CRUD
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  Aim,
  MagicStick,
  Calendar,
  CircleCheckFilled,
  Close,
  Collection,
  DataLine,
  Delete,
  Document,
  Edit,
  EditPen,
  Files,
  Flag,
  Grid,
  Lightning,
  Monitor,
  Plus,
  Reading,
  Search,
  Upload,
} from "@element-plus/icons-vue";
import type { Component } from "vue";
import { eduaiApi } from "../api/eduaiApi";
import type { EduClass, EduGrade, EduStudent, EduSubject, GradeLevelOption, PaperTemplate } from "../api/types";
import ReRichText from "@repo/ui/re-rich-text";
import ReDialog from "@repo/ui/re-dialog";
import ReTabs from "@repo/ui/re-tabs";
import type { ReTabsItem } from "@repo/ui/re-tabs";
import ReInputNumber from "@repo/ui/re-input-number";
import type { ReTableColumn } from "@repo/ui/re-table";

const FALLBACK_GRADE_LEVELS: GradeLevelOption[] = [
  { value: "PRIMARY", label: "小学" },
  { value: "JUNIOR", label: "初中" },
  { value: "SENIOR", label: "高中" },
  { value: "UNIVERSITY", label: "大学" },
];

/** 学段下拉：优先 dimensionDropdown.gradeLevels，回退内置枚举 */
const gradeLevelMeta = ref<GradeLevelOption[]>([]);
const gradeLevelOptions = computed<GradeLevelOption[]>(() =>
  gradeLevelMeta.value.length ? gradeLevelMeta.value : FALLBACK_GRADE_LEVELS,
);

/** 对话框图标选项（对齐原型 8 枚） */
const ICON_OPTIONS: { key: string; label: string; icon: Component; bg: string; fg: string }[] = [
  { key: "book", label: "书本", icon: Files, bg: "var(--el-color-primary-light-9)", fg: "var(--el-color-primary)" },
  { key: "calculator", label: "计算器", icon: DataLine, bg: "var(--el-color-info-light-9)", fg: "var(--el-color-info)" },
  { key: "letter", label: "字母", icon: Aim, bg: "var(--el-color-success-light-9)", fg: "var(--el-color-success)" },
  { key: "atom", label: "原子", icon: MagicStick, bg: "var(--el-color-warning-light-9)", fg: "var(--el-color-warning)" },
  { key: "flask", label: "实验", icon: Collection, bg: "var(--el-color-success-light-8)", fg: "var(--el-color-success-dark-2)" },
  { key: "leaf", label: "自然", icon: Grid, bg: "var(--el-color-danger-light-9)", fg: "var(--el-color-danger)" },
  { key: "clock", label: "历史", icon: Reading, bg: "var(--el-color-warning-light-8)", fg: "var(--el-color-warning-dark-2)" },
  { key: "globe", label: "地理", icon: Monitor, bg: "var(--el-color-primary-light-8)", fg: "var(--el-color-primary-dark-2)" },
];

/** 对话框颜色选项（对齐原型 8 色） */
const COLOR_OPTIONS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f97316", "#14b8a6", "#facc15", "#ec4899", "#ef4444"];

/**
 * 年级表里 gradeLevel 存的是**中文标签**（小学/初中/高中/大学），学科表里存的是
 * **学段码**（PRIMARY/JUNIOR/...）。历史数据两种都出现过，所以统一先归一成码再比较，
 * 否则左侧脊柱按码分组会一个年级都匹配不上。
 */
const levelOf = (v?: string | null) => {
  const s = String(v ?? "").trim();
  if (!s) return "";
  const hit = gradeLevelOptions.value.find((o) => o.value === s || o.label === s);
  return hit ? hit.value : s;
};

const levelLabel = (v?: string | null) => {
  const code = levelOf(v);
  return gradeLevelOptions.value.find((o) => o.value === code)?.label || v || "";
};

/** 左侧脊柱的学段筛选：空串＝全部学段 */
const levelFilter = ref("");

/** 再点一次同一学段即取消筛选 */
const toggleLevelFilter = (level: string) => {
  levelFilter.value = levelFilter.value === level ? "" : level;
};

// ==================== 统计 ====================
const subjectCoverHint = computed(() => {
  const n = subjects.value.length;
  if (!n) return "暂无学科";
  const levels = gradeLevelOptions.value;
  return `覆盖${levels[0]?.label || ""}至${levels[levels.length - 1]?.label || ""}`;
});

const enableRate = computed(() => {
  const total = subjects.value.length;
  if (!total) return 0;
  const on = subjects.value.filter((s) => s.subjectStatus === 1).length;
  return Math.round((on / total) * 100);
});

const enableRateHint = computed(() =>
  enableRate.value === 100 ? "全部正常启用" : `${subjects.value.filter((s) => s.subjectStatus === 1).length}/${subjects.value.length} 正常启用`,
);

// ==================== 学科 ====================
const subjects = ref<EduSubject[]>([]);
const subjectLoading = ref(false);
const subjectSaving = ref(false);
const subjectDialogVisible = ref(false);
const subjectForm = reactive<Partial<EduSubject>>({});
const subjectLevels = ref<string[]>([]);
const subjectKeyword = ref("");

const filteredSubjects = computed(() => {
  const lv = levelFilter.value;
  // 学段筛选先收窄池子，再叠关键字；两者都不改原数组
  const pool = lv ? subjects.value.filter((s) => splitLevels(s.subjectGradeLevels).includes(lv)) : subjects.value;
  const kw = subjectKeyword.value.trim().toLowerCase();
  if (!kw) return pool;
  return pool.filter(
    (s) =>
      String(s.subjectName ?? "").toLowerCase().includes(kw) ||
      String(s.subjectCode ?? "").toLowerCase().includes(kw),
  );
});

const splitLevels = (v?: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

/** 某学段下的学科数（左侧脊柱上的「N 学科」） */
const levelSubjectCount = (level: string) =>
  subjects.value.filter((s) => splitLevels(s.subjectGradeLevels).includes(level)).length;

/** 学科卡片配色与图标（优先用存储的 subjectColor/subjectIcon） */
const subjectTheme = (s: EduSubject): { bg: string; icon: Component } => {
  const iconKey = String(s.subjectIcon || "");
  const fromIcon = ICON_OPTIONS.find((o) => o.key === iconKey);
  if (fromIcon && s.subjectColor) return { bg: s.subjectColor, icon: fromIcon.icon };
  if (s.subjectColor) {
    const fallbackIcon = fromIcon?.icon
      || (() => {
        const code = String(s.subjectCode || "").toLowerCase();
        const name = String(s.subjectName || "");
        if (code.includes("chinese") || name.includes("语")) return Files;
        if (code.includes("math") || name.includes("数")) return DataLine;
        if (code.includes("english") || name.includes("英")) return Aim;
        if (code.includes("physics") || name.includes("物")) return Lightning;
        if (code.includes("chemistry") || name.includes("化")) return Collection;
        if (code.includes("history") || name.includes("历")) return Reading;
        if (code.includes("geography") || name.includes("地")) return Monitor;
        if (code.includes("politic") || name.includes("政")) return Flag;
        return Grid;
      })();
    return { bg: s.subjectColor, icon: fallbackIcon };
  }
  if (fromIcon) return { bg: fromIcon.fg, icon: fromIcon.icon };
  const code = String(s.subjectCode || "").toLowerCase();
  const name = String(s.subjectName || "");
  if (code.includes("chinese") || name.includes("语")) return { bg: "var(--el-color-primary)", icon: Files };
  if (code.includes("math") || name.includes("数")) return { bg: "var(--el-color-primary-dark-2)", icon: DataLine };
  if (code.includes("english") || name.includes("英")) return { bg: "var(--el-color-success)", icon: Aim };
  if (code.includes("physics") || name.includes("物")) return { bg: "var(--el-color-warning)", icon: Lightning };
  if (code.includes("chemistry") || name.includes("化")) return { bg: "var(--el-color-success-dark-2)", icon: Collection };
  if (code.includes("biology") || name.includes("生")) return { bg: "var(--el-color-info)", icon: Grid };
  if (code.includes("history") || name.includes("历")) return { bg: "var(--el-color-warning-dark-2)", icon: Reading };
  if (code.includes("geography") || name.includes("地")) return { bg: "var(--el-color-danger)", icon: Monitor };
  if (code.includes("politic") || name.includes("政") || name.includes("道")) return { bg: "var(--el-color-danger-dark-2)", icon: Flag };
  if (name.includes("科")) return { bg: "var(--el-color-info-dark-2)", icon: Edit };
  return { bg: "var(--el-color-primary)", icon: Grid };
};

const loadGradeLevels = async () => {
  try {
    const drop = await eduaiApi.dimensionDropdown();
    gradeLevelMeta.value = Array.isArray(drop?.gradeLevels) ? drop.gradeLevels : [];
  } catch {
    gradeLevelMeta.value = [];
  }
};

const loadSubjects = async () => {
  subjectLoading.value = true;
  try {
    const res = await eduaiApi.listSubjects();
    subjects.value = Array.isArray(res) ? res : [];
  } catch {
    message.error("加载学科失败");
  } finally {
    subjectLoading.value = false;
  }
};

const openSubjectCreate = () => {
  Object.assign(subjectForm, {
    subjectId: undefined,
    subjectCode: "",
    subjectName: "",
    subjectSortOrder: subjects.value.length,
    subjectStatus: 1,
    subjectIcon: "book",
    subjectColor: "#3b82f6",
  });
  subjectLevels.value = [];
  subjectDialogVisible.value = true;
};

const openSubjectEdit = (row: EduSubject) => {
  Object.assign(subjectForm, {
    ...row,
    subjectIcon: row.subjectIcon || "book",
    subjectColor: row.subjectColor || "#3b82f6",
  });
  subjectLevels.value = splitLevels(row.subjectGradeLevels);
  subjectDialogVisible.value = true;
};

const toggleSubjectLevel = (value: string) => {
  const i = subjectLevels.value.indexOf(value);
  if (i >= 0) subjectLevels.value.splice(i, 1);
  else subjectLevels.value.push(value);
};

const saveSubject = async () => {
  if (!subjectForm.subjectName?.trim()) {
    message.warning("学科名称必填");
    return;
  }
  if (!subjectForm.subjectCode?.trim()) {
    message.warning("学科编码必填");
    return;
  }
  if (!subjectLevels.value.length) {
    message.warning("请至少选择一个适用学段");
    return;
  }
  subjectSaving.value = true;
  try {
    await eduaiApi.saveSubject({
      ...subjectForm,
      subjectGradeLevels: subjectLevels.value.join(","),
      subjectIcon: subjectForm.subjectIcon || "book",
      subjectColor: subjectForm.subjectColor || "#3b82f6",
    });
    message.success("保存成功");
    subjectDialogVisible.value = false;
    void loadSubjects();
  } catch {
    message.error("保存失败");
  } finally {
    subjectSaving.value = false;
  }
};

const toggleSubject = async (row: EduSubject) => {
  try {
    await eduaiApi.saveSubject({
      ...row,
      subjectStatus: row.subjectStatus === 1 ? 0 : 1,
    });
    message.success(row.subjectStatus === 1 ? "已停用" : "已启用");
    void loadSubjects();
  } catch {
    message.error("操作失败");
  }
};

const confirmDeleteSubject = async (row: EduSubject) => {
  try {
    await ElMessageBox.confirm(`确认删除学科「${row.subjectName}」?`, "提示", { type: "warning" });
    await removeSubject(row);
  } catch {
    /* cancel */
  }
};

const removeSubject = async (row: EduSubject) => {
  try {
    await eduaiApi.deleteSubject(row.subjectId as number);
    message.success("删除成功");
    void loadSubjects();
  } catch {
    message.error("删除失败");
  }
};

const onImport = () => {
  message.info("批量导入开发中，可先逐条新增");
};

// ==================== 年级 ====================
const grades = ref<EduGrade[]>([]);
const gradeLoading = ref(false);
const gradeSaving = ref(false);
const gradeDialogVisible = ref(false);
const gradeForm = reactive<Partial<EduGrade>>({});

/**
 * 年级全量拉取：左侧脊柱要按学段分组展示，所以不再按学段过滤请求；
 * 筛选改由脊柱点击驱动学科列表（年级本就该全量可见）。
 */
const loadGrades = async () => {
  gradeLoading.value = true;
  try {
    const res = await eduaiApi.listGrades();
    grades.value = Array.isArray(res) ? res : [];
  } catch {
    message.error("加载年级失败");
  } finally {
    gradeLoading.value = false;
  }
};

const gradesOfLevel = (level: string) => grades.value.filter((g) => levelOf(g.gradeLevel) === level);
const gradeCount = (level: string) => gradesOfLevel(level).length;

/** 各学段快捷年级名（对齐原型） */
const GRADE_QUICK_NAMES: Record<string, string[]> = {
  PRIMARY: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  JUNIOR: ["七年级", "八年级", "九年级"],
  SENIOR: ["高一", "高二", "高三"],
  UNIVERSITY: ["大一", "大二", "大三", "大四"],
};

const gradeQuickNames = computed(() => GRADE_QUICK_NAMES[gradeForm.gradeLevel || "PRIMARY"] || []);

const onGradeLevelPick = (value: string) => {
  gradeForm.gradeLevel = value;
};

/** level 由脊柱上的「+」传入；不传则回落到第一个学段 */
const openGradeCreate = (level?: string) => {
  gradeConfirmDelete.value = false;
  Object.assign(gradeForm, {
    gradeId: undefined,
    gradeLevel: level || gradeLevelOptions.value[0]?.value || "PRIMARY",
    gradeName: "",
    gradeOrder: grades.value.length || 10,
  });
  gradeDialogVisible.value = true;
};

const openGradeEdit = (row: EduGrade) => {
  // 老数据 gradeLevel 是中文标签，进弹框前归一成学段码，否则单选组一个都选不中
  gradeConfirmDelete.value = false;
  Object.assign(gradeForm, { ...row, gradeLevel: levelOf(row.gradeLevel) || "PRIMARY" });
  gradeDialogVisible.value = true;
};

const saveGrade = async () => {
  if (!gradeForm.gradeLevel || !gradeForm.gradeName?.trim()) {
    message.warning("学段与年级名称必填");
    return;
  }
  gradeSaving.value = true;
  try {
    await eduaiApi.saveGrade(gradeForm);
    message.success("保存成功");
    gradeDialogVisible.value = false;
    void loadGrades();
  } catch {
    message.error("保存失败");
  } finally {
    gradeSaving.value = false;
  }
};

/**
 * 弹框内两步确认删除：ElMessageBox 的层级会被 ReDialog 遮罩压住（点不到按钮），
 * 所以年级删除改成就地二次确认，不弹 MessageBox。
 */
const gradeConfirmDelete = ref(false);
const askDeleteGrade = () => {
  gradeConfirmDelete.value = true;
};
const cancelDeleteGrade = () => {
  gradeConfirmDelete.value = false;
};

const confirmDeleteGrade = async () => {
  const row = gradeForm as EduGrade;
  if (!row.gradeId) return;
  await removeGrade(row);
};

const removeGrade = async (row: EduGrade) => {
  gradeSaving.value = true;
  try {
    await eduaiApi.deleteGrade(row.gradeId as number);
    message.success("删除成功");
    gradeConfirmDelete.value = false;
    gradeDialogVisible.value = false;
    void loadGrades();
  } catch {
    message.error("删除失败");
  } finally {
    gradeSaving.value = false;
  }
};

// ==================== 班级 ====================
const classes = ref<EduClass[]>([]);
const classLoading = ref(false);
const classSaving = ref(false);
const classDialogVisible = ref(false);
const classForm = reactive<Partial<EduClass>>({});
const classLevelFilter = ref("");
/** 仅用于「班级学生数」展示：与班级一起懒加载，避免进页面就多发一次请求 */
const classStudents = ref<EduStudent[]>([]);

/** 班级表列定义 */
const classColumns: ReTableColumn[] = [
  // 列宽：能给 minWidth 的都给 minWidth，让 vxe 把剩余宽度摊给它们。
  // 原来的定宽合计 920px > 卡片正文 866px，会横向溢出，「状态」列被右侧固定的「操作」列压住只露出半个字。
  { prop: "className", label: "班级名称", minWidth: 180, showOverflowTooltip: true },
  { prop: "classCode", label: "班级编码", minWidth: 150, showOverflowTooltip: true },
  { prop: "classGradeLevel", label: "学段", width: 88, slot: "col-classGradeLevel" },
  { prop: "classGrade", label: "年级", minWidth: 100 },
  { prop: "studentCount", label: "学生数", width: 92, align: "center", slot: "col-studentCount" },
  { prop: "classStatus", label: "状态", width: 92, align: "center", slot: "col-classStatus" },
  { prop: "actions", label: "操作", width: 110, align: "center", fixed: "right", slot: "col-actions", className: "op-col" },
];

const loadClasses = async () => {
  classLoading.value = true;
  try {
    const [cls, stu] = await Promise.all([
      eduaiApi.listClasses(classLevelFilter.value ? { gradeLevel: classLevelFilter.value } : {}),
      // 学生数按班级聚合展示，失败不影响班级列表本身
      eduaiApi.listStudents().catch(() => [] as EduStudent[]),
    ]);
    classes.value = Array.isArray(cls) ? cls : [];
    classStudents.value = Array.isArray(stu) ? stu : [];
  } catch {
    message.error("加载班级失败");
  } finally {
    classLoading.value = false;
  }
};

/** 某班级下的学生数 */
const classStudentCount = (classId?: number) =>
  classId ? classStudents.value.filter((s) => s.studentClassId === classId).length : 0;

/** 班级表单的年级候选：跟随所选学段；未选学段时给全量 */
const classGradeOptions = computed(() => {
  const level = classForm.classGradeLevel;
  return (level ? gradesOfLevel(level) : grades.value).map((g) => g.gradeName).filter(Boolean) as string[];
});

const openClassCreate = () => {
  Object.assign(classForm, {
    classId: undefined,
    className: "",
    classCode: "",
    classGradeLevel: classLevelFilter.value || "",
    classGrade: "",
    classStatus: 1,
  });
  classDialogVisible.value = true;
};

const openClassEdit = (row: EduClass) => {
  Object.assign(classForm, { ...row });
  classDialogVisible.value = true;
};

const saveClass = async () => {
  if (!classForm.className?.trim()) {
    message.warning("班级名称必填");
    return;
  }
  classSaving.value = true;
  try {
    await eduaiApi.saveClass({
      ...classForm,
      className: classForm.className.trim(),
      classCode: classForm.classCode?.trim() || undefined,
    });
    message.success("保存成功");
    classDialogVisible.value = false;
    void loadClasses();
  } catch {
    message.error("保存失败");
  } finally {
    classSaving.value = false;
  }
};

const removeClass = async (row: EduClass) => {
  try {
    await eduaiApi.deleteClass(row.classId as number);
    message.success("删除成功");
    void loadClasses();
  } catch {
    message.error("删除失败");
  }
};

// ==================== 组卷模板 ====================

/** 大标题风格选项（与后端 classic/modern/simple/exam 对齐） */
const TEMPLATE_STYLE_OPTIONS = [
  { value: "classic", label: "经典" },
  { value: "modern", label: "现代" },
  { value: "simple", label: "简约" },
  { value: "exam", label: "考试专用" },
];

/** 纸张规格选项 */
const TEMPLATE_PAGE_SIZE_OPTIONS = [
  { value: "A4", label: "A4" },
  { value: "A3", label: "A3" },
  { value: "A5", label: "A5" },
  { value: "B5", label: "B5" },
  { value: "LETTER", label: "LETTER" },
];

const templateStyleLabel = (v?: string) => TEMPLATE_STYLE_OPTIONS.find((o) => o.value === v)?.label || v || "-";
const templateOrientationLabel = (v?: string) => (v === "LANDSCAPE" ? "横向" : "纵向");
/** ReTable view 插槽里 row 是 Record<string, unknown>，收敛成模板类型，避免模板里到处 as */
const asTpl = (row: Record<string, unknown>) => row as unknown as PaperTemplate;

const templates = ref<PaperTemplate[]>([]);
const templateLoading = ref(false);
const templateSaving = ref(false);
const templateDialogVisible = ref(false);
const templateKeyword = ref("");
const templateForm = reactive<Partial<PaperTemplate>>({});

/** 模板名称前端过滤 */
const filteredTemplates = computed(() => {
  const kw = templateKeyword.value.trim().toLowerCase();
  if (!kw) {
    return templates.value;
  }
  return templates.value.filter((t) => String(t.templateName ?? "").toLowerCase().includes(kw));
});

/**
 * 右侧三块内容各占 ReTabs 的一个页签（面板常驻，切换只改可见性）。
 *
 * <p>学段/年级不占页签：它们是左侧脊柱上的层级，切页签时仍然要看得到。</p>
 */
const activeBlock = ref<"subject" | "classes" | "templates">("subject");
const blockTabs = computed<ReTabsItem[]>(() => [
  { name: "subject", label: "学科", badge: subjects.value.length },
  { name: "classes", label: "班级", badge: classes.value.length },
  { name: "templates", label: "组卷模板", badge: templates.value.length },
]);

const loadTemplates = async () => {
  templateLoading.value = true;
  try {
    const res = await eduaiApi.getPaperTemplatePage({ pageNum: 1, pageSize: 100 });
    templates.value = Array.isArray(res?.data) ? res.data : [];
  } catch {
    message.error("加载组卷模板失败");
  } finally {
    templateLoading.value = false;
  }
};

const openTemplateCreate = () => {
  Object.assign(templateForm, {
    templateId: undefined,
    templateName: "",
    templateStyle: "classic",
    templateHeader: "",
    templateFooter: "",
    templatePageSize: "A4",
    templateOrientation: "PORTRAIT",
    templateStatus: 1,
  });
  templateDialogVisible.value = true;
};

const openTemplateEdit = (row: PaperTemplate) => {
  Object.assign(templateForm, {
    templateId: row.templateId,
    templateName: row.templateName,
    templateStyle: row.templateStyle || "classic",
    templateHeader: row.templateHeader || "",
    templateFooter: row.templateFooter || "",
    templatePageSize: row.templatePageSize || "A4",
    templateOrientation: row.templateOrientation || "PORTRAIT",
    templateStatus: row.templateStatus ?? 1,
  });
  templateDialogVisible.value = true;
};

const saveTemplate = async () => {
  if (!templateForm.templateName?.trim()) {
    message.warning("模板名称必填");
    return;
  }
  const payload: Partial<PaperTemplate> = {
    templateName: templateForm.templateName.trim(),
    templateStyle: templateForm.templateStyle ?? "classic",
    templateHeader: templateForm.templateHeader ?? "",
    templateFooter: templateForm.templateFooter ?? "",
    templatePageSize: templateForm.templatePageSize,
    templateOrientation: templateForm.templateOrientation,
    templateStatus: templateForm.templateStatus ?? 1,
  };
  templateSaving.value = true;
  try {
    const templateId = templateForm.templateId;
    if (templateId) {
      await eduaiApi.updatePaperTemplate(templateId, payload);
    } else {
      await eduaiApi.savePaperTemplate(payload);
    }
    message.success("保存成功");
    templateDialogVisible.value = false;
    void loadTemplates();
  } catch {
    message.error("保存失败");
  } finally {
    templateSaving.value = false;
  }
};

const removeTemplate = async (row: PaperTemplate) => {
  try {
    await eduaiApi.deletePaperTemplate(row.templateId);
    message.success("删除成功");
    void loadTemplates();
  } catch {
    message.error("删除失败");
  }
};

onMounted(() => {
  void loadGradeLevels();
  void loadSubjects();
  void loadGrades();
  // 一屏全铺之后班级 / 组卷模板不再是「切 Tab 才拉」，进页面即加载
  void loadClasses();
  void loadTemplates();
});
</script>

<style scoped>
/* ---------- 页面骨架：左脊柱 + 右主区（整页滚动，不再分 Tab） ---------- */
.page-container {
  /* 本页两张卡（左脊柱 / 右内容）共用一套「面」：白底 + 1px 浅边框 + 一层很轻的投影。
     注意不能写 `0 2px 10px var(--el-box-shadow-lighter)`——那个变量本身已是完整
     shadow（`0 0 6px #0000001f`），拼进来会变成 6 个长度值，整条声明被浏览器丢弃。 */
  --dim-card-shadow: 0 1px 2px color-mix(in srgb, var(--el-color-black) 4%, transparent),
    0 4px 14px color-mix(in srgb, var(--el-color-black) 5%, transparent);
  /* 学科表列宽：表头（.thead）与数据行（.row）共用一份，改一处两边同时跟着变。
     学段列必须是定宽——用 auto 时表头按「适用学段」四个字算宽、数据行按四个字母块算宽，
     两个 grid 各自算各自的 auto，列就错开了。 */
  --dim-cols: 34px minmax(120px, 1.4fr) 96px 84px 96px 108px;
  height: 100%;
  overflow: auto;
  background: var(--el-bg-color-page);
  display: grid;
  grid-template-columns: 236px minmax(0, 1fr);
  /* 行高：min 取 max-content、max 取 1fr。
     - 下限 max-content：容器有确定高度（height:100%），行若交给纯 auto 隐式行，
       浏览器会把行按容器高度重新分配——单列时左卡（224px）被压进 100px 的行里，
       卡片溢出压到页头上。
     - 上限 1fr：内容比视口矮时（班级/模板空态）卡片撑满剩余高度，而不是缩成一小块。 */
  grid-template-rows: minmax(max-content, 1fr);
  align-content: start;
  align-items: start;
}

/* ---------- 左：维度脊柱（独立成卡：与右侧内容卡同一套「面」） ---------- */
.taxo {
  position: sticky;
  top: 14px;
  /* 与右侧内容卡同高：内容不够高时也要吃满整行，不能只裹住自己的文字。
     （narrow 单列时这一行是 max-content，stretch 等于内容高，行为不变） */
  align-self: stretch;
  display: flex;
  flex-direction: column;
  min-height: 0;
  /* 下边距 20 与右侧内容卡（.dim-tabs）一致，两张卡的底边才能落在同一条线上 */
  margin: 14px 0 20px 16px;
  padding: 14px 0 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--dim-card-shadow);
}

.taxo__head {
  padding: 0 16px 10px;
}

.taxo__title {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
}

.taxo__figs {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.taxo__figs div {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.taxo__figs b {
  font-size: 19px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.taxo__figs span {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

/* 脊柱线 + 学段节点 */
.taxo__spine {
  position: relative;
  /* 吃满卡片剩余高度，把脚注压到底部（卡片长高时脊柱线也跟着延到底） */
  flex: 1 1 auto;
  min-height: 0;
  padding: 2px 0 8px 16px;
}

.taxo__spine::before {
  content: "";
  position: absolute;
  left: 21px;
  top: 14px;
  bottom: 14px;
  width: 1px;
  background: var(--el-border-color-lighter);
}

.band {
  position: relative;
  padding: 7px 10px 9px 18px;
  border-radius: 0 10px 10px 0;
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}

.band:hover {
  background: var(--el-fill-color-light);
}

.band.is-on {
  background: var(--el-color-primary-light-9);
}

/* 选中态用右侧短竖条，避免整块高亮压过内容 */
.band.is-on::after {
  content: "";
  position: absolute;
  right: 0;
  top: 8px;
  bottom: 8px;
  width: 2px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

.band__tick {
  position: absolute;
  left: 0;
  top: 13px;
  width: 9px;
  height: 9px;
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-bg-color);
  border: 1.5px solid var(--el-border-color);
}

.band.is-on .band__tick {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}

.band__head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
  outline: none;
}

.band__head:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  border-radius: 4px;
}

.band__name {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.band__code {
  font-family: var(--el-font-family-mono, ui-monospace, Menlo, monospace);
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
}

.band__stat {
  margin-left: auto;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.band__grades {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.gchip {
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font: inherit;
  font-size: 11.5px;
  line-height: 1.75;
  cursor: pointer;
  outline: none;
  transition:
    color var(--el-transition-duration-fast, 0.2s) ease,
    background var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

.gchip:hover {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.gchip:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.gchip--add {
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: 1px dashed var(--el-border-color);
}

.gchip--empty {
  color: var(--el-text-color-placeholder);
  background: transparent;
  border: 1px dashed var(--el-border-color-lighter);
  cursor: default;
}

.gchip--empty:hover {
  color: var(--el-text-color-placeholder);
  background: transparent;
  border-color: var(--el-border-color-lighter);
}

.taxo__foot {
  margin-top: auto;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
}

/* ---------- 右：主区 ---------- */
/* 页头是通栏白条、内容是一张卡，所以主区自己不再铺底色、也不再画左分隔线 */
.main {
  /* 主区是 flex 列：页头定高，内容卡吃满剩下的高度（内容不够高时也不缩成一小块） */
  display: flex;
  flex-direction: column;
  align-self: stretch;
  min-width: 0;
  min-height: 0;
  padding: 0;
  background: transparent;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding: 16px 20px 14px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.page-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--el-text-color-primary);
}

.page-header__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* 统计改为页头内联读数：不再用「半张卡压进内容区」的悬浮块 */
.metrics {
  display: flex;
  gap: 24px;
}

.metric {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.metric b {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.metric span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.metric em {
  margin-top: 2px;
  font-size: 11px;
  font-style: normal;
  color: var(--el-text-color-placeholder);
}

/* ---------- 分区容器：ReTabs 根节点即内容卡，页签条即卡头 ---------- */
.dim-tabs {
  margin: 16px 20px 20px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--dim-card-shadow);
}

/* 卡头：左侧分段 pill 页签，右侧放当前页签的操作行 */
.dim-tabs :deep(.re-tabs__bar) {
  min-height: 50px;
  padding: 0 14px;
  gap: 12px;
  background: transparent;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dim-tabs :deep(.re-tabs__nav) {
  flex: 0 1 auto;
  gap: 2px;
  margin: 9px 0;
  padding: 2px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
}

.dim-tabs :deep(.re-tabs__tab) {
  height: 30px;
  padding: 0 12px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-text-color-regular);
}

.dim-tabs :deep(.re-tabs__tab:hover) {
  background: transparent;
  color: var(--el-color-primary);
}

/* 选中页签浮成白色小片：与卡头同色，只有投影把它抬起来 */
.dim-tabs :deep(.re-tabs__tab.is-active) {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--el-color-black) 10%, transparent);
}

/* 操作区推到卡头最右 */
.dim-tabs :deep(.re-tabs__actions) {
  margin-left: auto;
  padding: 9px 0 9px 6px;
}

/* 面板内容：学科整表（行自带内边距），班级/模板自带表格外框，需要留白 */
.block {
  min-width: 0;
}

.block--pad {
  /* 卡片已经吃满高度，班级/模板两块跟着长高：表格在上、分页条压到卡片底部，
     否则分页会悬在卡片半空，下面留一大片空白 */
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 14px;
}

/* ReTable 根节点自带 1px 卡片边界 + 12px 内边距（它默认是独立一张卡）。
   本页外层（ReTabs 根节点）已经是一张卡，再套一层就成了「卡中卡」，边框叠边框。
   这里把内层压平，只留内容；外层的 padding 由 .block--pad 统一给。 */
.block--pad :deep(.re-table) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
}

/* 表格主体自带的第二层框（1px 边 + 16px 圆角 + 白底）：与外层卡片叠成双框，
   圆角也对不上（16 vs 12）。一并压平，让表头/数据行直接坐在卡片里。 */
.block--pad :deep(.re-table__main) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  border: 0;
  border-radius: 0;
}

/* 分页条压到卡片底部：表格在上、分页在下，中间留白；否则分页悬在卡片半空 */
.block--pad :deep(.re-table__footer) {
  margin-top: auto;
}

/* 表格本体跟着长高，空态插图才会落在卡片中部，而不是贴在最上面 */
.block--pad :deep(.vxe-table) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

/* vxe 内部是一串 block 定高的壳：主壳不撑满，空态就贴在上半部。
   把这几层串成 flex 链让它们吃满表格高度，空态块再居中。 */
.block--pad :deep(.vxe-table--render-wrapper) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.block--pad :deep(.vxe-table--layout-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
}

/* layout-wrapper 是横向 flex，真正的「表头 + 表格」纵列在 viewport-wrapper 里 */
.block--pad :deep(.vxe-table--viewport-wrapper) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.block--pad :deep(.vxe-table--main-wrapper) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.block--pad :deep(.vxe-table--body-wrapper) {
  flex: 1 1 auto;
  min-height: 0;
}

.block--pad :deep(.vxe-table--body-inner-wrapper) {
  height: 100%;
}

.block--pad :deep(.vxe-table--empty-block) {
  height: 100%;
  align-items: center;
  justify-content: center;
}

/* vxe 再叠一层外框线（纯装饰，不承载布局），同样去掉 */
.block--pad :deep(.vxe-table--border-line) {
  display: none;
}

.filter-tag {
  margin-left: 4px;
  padding: 1px 8px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font: inherit;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.filter-tag:hover {
  background: var(--el-color-primary-light-8);
}

.block__ops {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.subject-search {
  flex: 0 1 220px;
  min-width: 160px;
  width: 220px;
}

/* ---------- 学科：表头 + 数据行（共用一套列宽变量，读起来像一张真表格） ---------- */
.rows {
  display: flex;
  flex-direction: column;
  min-height: 80px;
}

.thead {
  display: grid;
  grid-template-columns: var(--dim-cols);
  align-items: center;
  gap: 14px;
  padding: 7px 14px;
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.thead__ops {
  text-align: right;
}

.row {
  display: grid;
  grid-template-columns: var(--dim-cols);
  align-items: center;
  gap: 14px;
  padding: 9px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition: background var(--el-transition-duration-fast, 0.2s) ease;
}

/* 斑马纹（空态面板也是 .rows 的子节点，用 .row 限定避免被染色） */
.rows > .row:nth-child(even) {
  background: color-mix(in srgb, var(--el-fill-color-light) 55%, var(--el-bg-color));
}

.row:last-child {
  border-bottom: 0;
}

.row:hover,
.rows > .row:nth-child(even):hover {
  background: var(--el-color-primary-light-9);
}

.row:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.row__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--el-radius-md, 8px);
  color: var(--el-color-white);
}

.row__id {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}

.row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.row__code {
  font-family: var(--el-font-family-mono, ui-monospace, Menlo, monospace);
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.row__levels {
  display: inline-flex;
  gap: 4px;
}

/* 学段字母块：实心=适用，描边灰=不适用（比一排文字标签更省空间） */
.lvdot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
  font-size: 10.5px;
  font-weight: 600;
}

.lvdot.is-on {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  box-shadow: inset 0 0 0 1px var(--el-color-primary-light-7);
}

.row__sort {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

.row__sort b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
}

.row__ops {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  /* 静息态别压太狠：0.45 时图标按钮只剩一圈几乎看不见的浅灰，整列操作像不存在 */
  opacity: 0.7;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.row:hover .row__ops,
.row:focus-within .row__ops {
  opacity: 1;
}

/* ---------- 状态 / 图标按钮（学科行与表格插槽共用） ---------- */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}

.status-pill.is-on {
  color: var(--el-color-success);
}

.status-pill.is-off {
  color: var(--el-text-color-placeholder);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--el-border-radius-circle, 50%);
  background: currentColor;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    background var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}

.icon-btn:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.icon-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.icon-btn.is-danger:hover {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.empty-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  margin: 14px;
  border: 1px dashed var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-placeholder);
}

/* ---------- 组卷模板 ReTable view 模式：一行一块 ---------- */
.tpl-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

.tpl-view__main {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.tpl-view__name {
  font-weight: 700;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tpl-view__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tpl-chip {
  padding: 1px 8px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.8;
}

.tpl-view__ops {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* ---------- 响应式 ---------- */
@media (max-width: 1240px) {
  .page-container {
    grid-template-columns: 208px minmax(0, 1fr);
  }

  /* 窄屏列宽变了（排序列收起），表头与数据行对不齐，索性隐掉表头 */
  .thead {
    display: none;
  }

  .page-container {
    --dim-cols: 34px minmax(96px, 1fr) 96px 96px 108px;
  }

  .row__sort {
    display: none;
  }

  .dim-tabs {
    margin: 14px 16px 18px;
  }
}

@media (max-width: 900px) {
  .page-container {
    grid-template-columns: 1fr;
    /* 单列时是两行：左脊柱按内容高、主区吃满剩下的高度 */
    grid-template-rows: max-content minmax(max-content, 1fr);
  }

  .taxo {
    position: static;
    margin: 12px 12px 0;
  }

  .taxo__spine {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0 8px;
    padding-left: 12px;
  }

  .taxo__spine::before {
    display: none;
  }

  .taxo__foot {
    display: none;
  }

  .page-header {
    padding: 14px 14px 12px;
  }

  .dim-tabs {
    margin: 12px;
  }

  .metrics {
    gap: 18px;
  }

  .page-container {
    --dim-cols: 34px minmax(80px, 1fr) 96px 96px;
  }

  .row {
    gap: 10px;
  }

  .row__sort,
  .row .status-pill {
    display: none;
  }

  /* 卡头改两行：页签独占一行，操作区整行靠右。
     否则操作区在页签右侧只剩半行宽，搜索框/批量导入/新增学科会折成参差的两三行。 */
  .dim-tabs :deep(.re-tabs__bar) {
    flex-wrap: wrap;
    gap: 8px;
    padding: 0 12px 8px;
  }

  .dim-tabs :deep(.re-tabs__nav) {
    margin: 8px 0 0;
  }

  .dim-tabs :deep(.re-tabs__actions) {
    flex: 1 1 100%;
    margin-left: 0;
    padding: 0;
  }

  .block__ops {
    width: 100%;
    justify-content: flex-end;
    gap: 8px;
  }

  .subject-search {
    flex: 1 1 160px;
    width: auto;
    min-width: 140px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .band,
  .gchip,
  .row,
  .row__ops,
  .icon-btn,
  .filter-tag,
  .dlg-close,
  .icon-opt,
  .color-dot,
  .level-pill {
    transition: none;
  }

  .icon-opt:hover,
  .color-dot:hover {
    transform: none;
  }
}

/* ---------- 对话框 ----------
 * 弹框「外壳」（.el-dialog / __header / __body / __footer）的样式不在本 scoped 块里：
 * ReDialog 把 class 挂在根节点 .el-dialog 上，而该根节点由 ReDialog 渲染、不继承本组件的
 * scope id，因此 .card-dialog :deep(.el-dialog__*) 一律命不中（写了也是死代码）。
 * 外壳统一走「koi 主题壳（flex 纵向：头尾固定、中间滚动）+ 文件末尾非 scoped 块」。
 * 这里只留弹框「内部」元素（.dlg-* / .level-pill / .dialog-btn …）的样式——它们在本模板里，带 scope id，正常生效。
 */

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.card-form :deep(.el-form-item) {
  margin-bottom: 18px;
  align-items: flex-start;
}

.card-form :deep(.el-form-item__label) {
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 36px;
  height: auto;
  justify-content: flex-start;
  text-align: left;
  white-space: nowrap;
  word-break: keep-all;
}

.card-form :deep(.el-form-item.is-required .el-form-item__label::before) {
  color: var(--el-color-danger);
  margin-right: 4px;
  align-self: center;
}

.card-form :deep(.el-input__wrapper),
.card-form :deep(.el-select__wrapper) {
  border-radius: var(--el-radius-md, 8px);
  min-height: 36px;
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

.card-form :deep(.el-input__wrapper:hover),
.card-form :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-border-color-hover) inset;
}

.card-form :deep(.el-input__wrapper.is-focus),
.card-form :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1.5px var(--el-color-primary) inset;
}

.card-form :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
  line-height: normal;
}

.num-input {
  width: 220px;
}

.num-input.is-center :deep(.el-input__wrapper) {
  text-align: center;
}

.num-input.is-center :deep(.el-input__inner) {
  text-align: center;
  font-weight: 600;
}

.status-item :deep(.el-form-item__content) {
  line-height: normal;
}

.dialog-btn {
  min-width: 96px;
  height: 36px;
  border-radius: var(--el-radius-md, 8px);
  font-weight: 600;
  font-size: 14px;
}

.dialog-btn.is-primary {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}

.dialog-btn.is-primary:hover {
  background: var(--el-color-primary-dark-2);
  border-color: var(--el-color-primary-dark-2);
}

/* 弹框左下的删除入口（年级没有表格行可挂删除按钮） */
.dialog-footer__left {
  margin-right: auto;
}

.del-confirm {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.del-confirm__text {
  margin-right: auto;
  font-size: 12.5px;
  color: var(--el-color-danger);
  white-space: nowrap;
}

.dialog-btn.is-danger {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}

.dialog-btn.is-danger:hover {
  color: var(--el-color-white);
  border-color: var(--el-color-danger);
  background: var(--el-color-danger);
}

.dialog-btn.is-danger-solid {
  color: var(--el-color-white);
  border-color: var(--el-color-danger);
  background: var(--el-color-danger);
}

.dialog-btn.is-danger-solid:hover {
  color: var(--el-color-white);
  border-color: var(--el-color-danger-dark-2);
  background: var(--el-color-danger-dark-2);
}

/* ---------- 新增学科对话框（对齐详细原型）：内部元素 ---------- */

.dlg-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  position: relative;
}

.dlg-header__icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 原投影去掉：主色实心图标底自身已足够突出 */
}

.dlg-header__text {
  min-width: 0;
  flex: 1;
}

.dlg-header__title {
  font-size: 18px;
  font-weight: 800;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}

.dlg-header__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.dlg-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  margin-left: auto;
  border: 0;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    background var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}

.dlg-close:hover {
  background: var(--el-border-color-lighter);
  color: var(--el-text-color-primary);
}

.dlg-close:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.dlg-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dlg-divider {
  height: 1px;
  background: var(--el-fill-color-light);
  margin: 2px 0;
}

.pick-section__label,
.block-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
}

.block-title {
  margin-top: 2px;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.icon-opt {
  width: 52px;
  height: 52px;
  border-radius: var(--el-radius-lg, 12px);
  border: 2px solid var(--el-border-color-lighter);
  background: var(--opt-bg, var(--el-fill-color-light));
  color: var(--opt-fg, var(--el-color-primary));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}

.icon-opt:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
}

.icon-opt:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.icon-opt.is-active {
  border-color: var(--opt-fg, var(--el-color-primary));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--opt-fg, var(--el-color-primary)) 22%, transparent);
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: var(--el-radius-full, 9999px);
  border: 0;
  padding: 0;
  cursor: pointer;
  /* 内描边是为了在浅色（如 #facc15）色块上也能看清圆点边界，
     所以用「黑色 8% 混透明」而不是主题灰——换 --el-color-black 保持与原 rgba 同色 */
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-black) 8%, transparent);
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
  position: relative;
}

.color-dot:hover {
  transform: scale(1.08);
}

.color-dot:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.color-dot.is-active {
  box-shadow:
    0 0 0 2px var(--el-color-white),
    0 0 0 4px var(--el-color-primary);
}

.level-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.level-pill {
  appearance: none;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 600;
  padding: 8px 22px;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    background var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}

.level-pill:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.level-pill:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.level-pill.is-on {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}

.subject-form {
  margin-bottom: 0;
}

.grade-form {
  margin-bottom: 0;
}

.grade-form :deep(.el-form-item) {
  margin-bottom: 8px;
}

.grade-form :deep(.el-form-item__label) {
  font-weight: 700;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  margin-bottom: 8px;
  padding-bottom: 0;
}

.field-hint {
  width: 100%;
  margin-top: 8px;
  font-size: 13px;
  color: var(--el-color-primary);
  line-height: 1.4;
}

.quick-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.quick-pill {
  min-width: 96px;
  justify-content: center;
  display: inline-flex;
  align-items: center;
  padding: 9px 18px;
}

.grade-form .num-input {
  width: 220px;
}

/* ---------- 组卷模板 ---------- */
.template-dialog .block-title ~ .block-title {
  margin-top: 14px;
}
</style>

<!--
  弹框外壳 — 必须是非 scoped 块
  ────────────────────────────────────────────────────────────────
  ReDialog 把 class 挂在它渲染的根节点 .el-dialog 上，该节点不继承本组件的 scope id，
  所以上面 scoped 块里的 .card-dialog :deep(.el-dialog__*) 全部命不中。这里只做三件
  事，且优先复用 koi 主题留的口子，而不是去覆盖 padding / overflow 本体：

  1) 内容区留白：koi 主题把 .el-dialog__body 的 padding 收敛为 --el-dialog-body-padding
     （默认 0，声明带 !important），要留白就改这个变量 —— 正是主题注释推荐的用法。
     取值 8px 20px 12px：左右 20px 与 koi 卡头的 20px 对齐（叠加 .el-dialog 自身的 16px
     内边距后，卡头/内容/底栏三者的左基线都在 36px）；上 8px + 卡头的 margin-bottom 8px、
     下 12px + 底栏的 4px，都刚好 16px。
  2) 滚动条留位：koi 的 .dialog-content-wrapper 自带 4px 右侧内边距并透传给子元素，
     会让内容右侧比左侧多 8px；这里清掉，左右留白统一由 1) 负责。
  3) 纵向滚动：不重复写 overflow —— koi 壳已是「max-height: 92vh + 头尾 flex: 0 0 auto
     + body flex: 1 1 auto」，长内容（例如模板弹框的页脚富文本）在 .dialog-content-wrapper
     里滚动，不会再被 .el-dialog 的 overflow: hidden 裁掉、底栏按钮也始终可见。
-->
<style>
.card-dialog {
  --el-dialog-body-padding: 8px 20px 12px;
}

/* 三级类名是为了盖过 koi 组件内 .dialog-content-wrapper[data-v-*] 的同名声明 */
.card-dialog .el-dialog__body .dialog-content-wrapper,
.card-dialog .el-dialog__body .dialog-content-wrapper > * {
  padding-right: 0;
}
</style>
