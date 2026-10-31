<template>
  <div class="page-container">
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">学生管理</h1>
          <p class="page-header__sub">
            维护学生、班级与教师档案；学生首次进「学生端」时用登录账号绑定自己的档案
          </p>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="st in statCards" :key="st.title" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">{{ st.title }}</div>
            <div class="stat-card__value">{{ st.value }}</div>
            <div class="stat-card__hint">{{ st.hint }}</div>
          </div>
          <div class="stat-card__icon" :style="{ background: st.bg }">
            <el-icon :size="22"><component :is="st.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="table-card">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- ============ 学生 ============ -->
        <el-tab-pane label="学生" name="student">
          <!-- 筛选区：与古诗库/成语库同构的 filter-card + filter-grid（带 label 的栅格） -->
          <el-card shadow="never" class="filter-card">
            <div class="filter-grid">
              <div class="filter-field">
                <label class="filter-field__label">关键字</label>
                <el-input
                  v-model="stuKeyword"
                  clearable
                  placeholder="姓名 / 学号 / 绑定账号"
                  :prefix-icon="Search"
                />
              </div>
              <div class="filter-field">
                <label class="filter-field__label">学段</label>
                <el-select v-model="stuLevel" clearable placeholder="全部学段" style="width: 100%">
                  <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </div>
              <div class="filter-field">
                <label class="filter-field__label">班级</label>
                <el-select v-model="stuClassId" clearable placeholder="全部班级" style="width: 100%">
                  <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
                </el-select>
              </div>
              <div class="filter-actions">
                <el-button type="primary" plain :icon="Search" @click="commitStudentSearch">查询</el-button>
                <el-button :icon="RefreshLeft" :loading="loading" @click="loadAll">刷新</el-button>
              </div>
            </div>
          </el-card>

          <!-- 学生表：后端分页（ReTable loader 模式）。筛选提交后由 loadStudents 带参请求。 -->
          <ReTable
            ref="studentTableRef"
            :loader="loadStudents"
            :columns="studentColumns"
            :params="studentParams"
            :row-key="'studentId'"
            v-model:page="studentPage"
            v-model:page-size="studentPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="table"
            :layout-switch="false"
            :toolbar="false"
            stripe
            @load="onStudentLoad"
            @load-error="pageLoadError"
            @row-click="(row: Record<string, unknown>) => openStudent(row as unknown as EduStudent)"
          >
            <template #toolbar>
              <el-button type="primary" :icon="Plus" @click="openStudent()">新增学生</el-button>
            </template>
            <!-- 空态门控：loader 模式下 ReTable 自带 loading/error 处理，空态由表格空数据渲染 -->
            <template #empty>
              <el-empty :image-size="80" description="暂无学生，点击「新增学生」创建" />
            </template>
            <!-- 学号：发给家长的登录凭据，最常被「念一遍 / 贴进群里」：
                 给一个一键复制，省掉手工框选。按钮必须 .stop ——
                 ReTable 绑了 @row-click="openStudent"，不挡冒泡会顺带打开编辑弹窗。 -->
            <template #col-studentNo="{ row }">
              <span class="no-cell">
                <span class="no-cell__text">{{ row.studentNo || "—" }}</span>
                <!-- 复制学号：不是按钮，用 ReIcon；默认隐藏，鼠标经过该单元格才显示。
                     必须 .stop —— ReTable 绑了 @row-click="openStudent"，不挡冒泡会顺带打开编辑弹窗。 -->
                <span
                  v-if="row.studentNo"
                  class="no-cell__copy"
                  role="button"
                  tabindex="0"
                  title="复制学号"
                  aria-label="复制学号"
                  @click.stop="copyStudentNo(row.studentNo)"
                  @keydown.enter.stop="copyStudentNo(row.studentNo)"
                >
                  <ReIcon name="CopyDocument" :size="14" aria-hidden="true" />
                </span>
              </span>
            </template>
            <template #col-studentGradeLevel="{ row }">{{ levelText(row.studentGradeLevel) }}</template>
            <template #col-studentClassId="{ row }">{{ className(row.studentClassId) }}</template>
            <template #col-accountBind="{ row }">
              <span class="tag-pill" :class="row.studentAccount ? 'is-green' : 'is-grey'">
                {{ row.studentAccount ? "已绑定" : "未绑定" }}
              </span>
            </template>
            <template #col-studentParentPhone="{ row }">
              <span v-if="row.studentParentPhone">{{ row.studentParentPhone }}</span>
              <span v-else class="cell-muted">未填</span>
            </template>
            <template #col-studentStatus="{ row }">
              <span class="tag-pill" :class="row.studentStatus === 1 ? 'is-blue' : 'is-grey'">
                {{ row.studentStatus === 1 ? "在读" : "离校" }}
              </span>
            </template>
            <template #col-actions="{ row }">
              <!-- 操作列按钮必须 .stop：ReTable 上绑了 @row-click="openStudent"，
                   不阻止冒泡会让「点任何按钮」都额外触发一次「打开编辑弹窗」
                   （实测：点代入/重置密码/删除都会弹出编辑学生对话框）。 -->
              <ReButton
                layout="square"
                type="success"
                :icon="View"
                tip="代入该学生"
                @click.stop="impersonate(row as unknown as EduStudent)"
              />
              <ReButton
                layout="square"
                type="primary"
                :icon="EditPen"
                tip="编辑"
                @click.stop="openStudent(row as unknown as EduStudent)"
              />
              <ReButton
                layout="square"
                type="warning"
                :icon="Key"
                tip="重置密码"
                @click.stop="openResetPassword(row as unknown as EduStudent)"
              />
              <ReButton
                layout="square"
                type="danger"
                :icon="Delete"
                tip="删除"
                @click.stop="removeStudent(row as unknown as EduStudent)"
              />
            </template>
          </ReTable>
        </el-tab-pane>

        <!-- ============ 班级 ============ -->
        <el-tab-pane :label="`班级 (${classTotal})`" name="class">
          <ReTable
            ref="classTableRef"
            :loader="loadClasses"
            :columns="classColumns"
            :row-key="'classId'"
            v-model:page="classPage"
            v-model:page-size="classPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="table"
            :layout-switch="false"
            :toolbar="false"
            stripe
            @load="onClassLoad"
            @load-error="pageLoadError"
            @row-click="(row: Record<string, unknown>) => openClass(row as unknown as EduClass)"
          >
            <template #toolbar>
              <el-button type="primary" :icon="Plus" @click="openClass()">新增班级</el-button>
              <el-button :icon="RefreshLeft" :loading="loading" @click="loadAll">刷新</el-button>
            </template>
            <template #empty>
              <el-empty :image-size="80" description="暂无班级" />
            </template>
            <template #col-classGradeLevel="{ row }">{{ levelText(row.classGradeLevel) }}</template>
            <template #col-studentCount="{ row }">{{ row.studentCount ?? 0 }}</template>
            <template #col-actions="{ row }">
              <!-- .stop：ReTable 绑了 @row-click="openClass"，不挡冒泡会顺带打开编辑 -->
              <ReButton
                layout="square"
                type="primary"
                :icon="EditPen"
                tip="编辑"
                @click.stop="openClass(row as unknown as EduClass)"
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
        </el-tab-pane>

        <!-- ============ 教师 ============ -->
        <el-tab-pane :label="`教师 (${teacherTotal})`" name="teacher">
          <ReTable
            ref="teacherTableRef"
            :loader="loadTeachers"
            :columns="teacherColumns"
            :row-key="'teacherId'"
            v-model:page="teacherPage"
            v-model:page-size="teacherPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="table"
            :layout-switch="false"
            :toolbar="false"
            stripe
            @load="onTeacherLoad"
            @load-error="pageLoadError"
            @row-click="(row: Record<string, unknown>) => openTeacher(row as unknown as EduTeacher)"
          >
            <template #toolbar>
              <el-button type="primary" :icon="Plus" @click="openTeacher()">新增教师</el-button>
              <el-button :icon="RefreshLeft" :loading="loading" @click="loadAll">刷新</el-button>
            </template>
            <template #empty>
              <el-empty v-if="!loading" :image-size="80" description="暂无教师" />
            </template>
            <template #col-accountBind="{ row }">
              <span class="tag-pill" :class="row.teacherAccount ? 'is-green' : 'is-grey'">
                {{ row.teacherAccount ? "已绑定" : "未绑定" }}
              </span>
            </template>
            <template #col-teacherStatus="{ row }">
              <span class="tag-pill" :class="row.teacherStatus === 1 ? 'is-blue' : 'is-grey'">
                {{ row.teacherStatus === 1 ? "在职" : "离职" }}
              </span>
            </template>
            <template #col-classCount="{ row }">
              <span
                class="tag-pill is-blue"
                :title="classNamesOf(row as unknown as EduTeacher)"
              >
                {{ row.classCount ?? classesOf(row as unknown as EduTeacher).length }} 个班级
              </span>
            </template>
            <template #col-actions="{ row }">
              <!-- .stop：ReTable 绑了 @row-click="openTeacher"，不挡冒泡会顺带打开编辑 -->
              <ReButton
                layout="square"
                type="primary"
                :icon="OfficeBuilding"
                tip="配置班级（决定老师端数据范围）"
                @click.stop="openTeacherClasses(row as unknown as EduTeacher)"
              />
              <ReButton
                layout="square"
                type="primary"
                :icon="EditPen"
                tip="编辑"
                @click.stop="openTeacher(row as unknown as EduTeacher)"
              />
              <ReButton
                layout="square"
                type="danger"
                :icon="Delete"
                tip="删除"
                @click.stop="removeTeacher(row as unknown as EduTeacher)"
              />
            </template>
          </ReTable>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- ============ 学生对话框 ============ -->
    <ReDialog v-model="stuVisible" class="q-dialog" width="920" :show-close="false" :show-window-shell="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon"><el-icon :size="18"><Star /></el-icon></span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ stuForm.studentId ? "编辑学生" : "新增学生" }}</div>
              <div class="dialog-head__sub">学号是学生端绑定的关键字段，一旦启用不要随意修改</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="stuVisible = false" />
        </div>
      </template>
      <!-- 左右结构：左=学生画像（跟随表单实时预览），右=编辑区（基本资料 / 修改密码） -->
      <div class="rec-editor">
        <aside class="rec-profile">
          <div class="rec-profile__hero">
            <!-- 头像即上传入口：点头像选图 -> 上传 -> 写回 stuForm.studentAvatar（保存时提交）。
                 头像要在 <img> 里显示，而后端预览路径已 whitelist（img 带不了令牌）。 -->
            <button
              type="button"
              class="rec-profile__avatar-btn"
              :title="stuForm.studentAvatar ? '点击更换头像' : '点击上传头像'"
              @click="pickStuAvatar"
            >
              <el-avatar :size="84" :src="stuAvatarSrc" class="rec-profile__avatar">
                {{ (stuForm.studentName || "学").slice(0, 1) }}
              </el-avatar>
              <span class="rec-profile__avatar-hint">换头像</span>
            </button>
            <input
              ref="stuAvatarInput"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/bmp"
              class="rec-profile__file"
              @change="onStuAvatarPicked"
            />
            <div class="rec-profile__name">{{ stuForm.studentName || "未命名学生" }}</div>
            <div class="rec-profile__sub">{{ stuProfileSubline }}</div>
          </div>
          <ul class="rec-profile__list">
            <li v-for="it in stuProfileItems" :key="it.label" class="rec-profile__item">
              <span class="rec-profile__ico"><el-icon :size="16"><component :is="it.icon" /></el-icon></span>
              <div class="rec-profile__meta">
                <span class="rec-profile__label">{{ it.label }}</span>
                <span class="rec-profile__value">{{ it.value }}</span>
              </div>
            </li>
          </ul>
        </aside>

        <section class="rec-editor__main">
          <el-tabs v-model="stuTab">
            <el-tab-pane label="基本资料" name="basic">
              <div class="rec-editor__head">
                <div class="rec-editor__title">基本资料</div>
                <div class="rec-editor__desc">维护学生的姓名、学段、班级与联系方式</div>
              </div>
              <el-form :model="stuForm" label-width="88" @submit.prevent>
                <el-form-item label="学号">
                  <!-- 学号是登录身份，由系统生成：新增提交后回填，编辑只读 -->
                  <el-input
                    :model-value="stuForm.studentNo || '保存后自动生成'"
                    readonly
                    disabled
                    placeholder="保存后自动生成"
                  />
                </el-form-item>
                <el-form-item label="姓名" required>
                  <el-input v-model="stuForm.studentName" placeholder="如 小明" />
                </el-form-item>
                <el-form-item label="学段">
                  <el-select v-model="stuForm.studentGradeLevel" clearable placeholder="选择学段" style="width: 100%">
                    <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
                  </el-select>
                </el-form-item>
                <el-form-item label="年级">
                  <el-select v-model="stuForm.studentGrade" clearable placeholder="选择年级" style="width: 100%">
                    <el-option v-for="g in gradeSource" :key="g" :label="g" :value="g" />
                  </el-select>
                </el-form-item>
                <el-form-item label="班级">
                  <el-select v-model="stuForm.studentClassId" clearable placeholder="选择班级" style="width: 100%">
                    <el-option v-for="c in classes" :key="c.classId" :label="c.className" :value="c.classId" />
                  </el-select>
                </el-form-item>
                <el-form-item label="家长手机号">
                  <el-input
                    v-model="stuForm.studentParentPhone"
                    maxlength="11"
                    placeholder="学生端可用此号登录，非必填"
                  />
                </el-form-item>
                <el-form-item label="身份证号">
                  <el-input
                    v-model="stuForm.studentIdCard"
                    maxlength="18"
                    placeholder="仅管理端维护，学生端不可见"
                  />
                </el-form-item>
                <el-form-item label="入学年份">
                  <ReInputNumber
                    :model-value="stuForm.studentEnrollYear ?? undefined"
                    :min="2000"
                    :max="2100"
                    controls-position="right"
                    style="width: 100%"
                    @update:model-value="(v?: number) => (stuForm.studentEnrollYear = v ?? null)"
                  />
                </el-form-item>
                <el-form-item label="状态">
                  <el-radio-group v-model="stuForm.studentStatus">
                    <el-radio-button :value="1">在读</el-radio-button>
                    <el-radio-button :value="0">离校</el-radio-button>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="绑定账号">
                  <el-input
                    :model-value="stuForm.studentAccount || (stuForm.studentNo ? `将自动设为 ${stuForm.studentNo}` : '（保存后按学号自动生成）')"
                    disabled
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="修改密码" name="pwd">
              <div class="rec-editor__head">
                <div class="rec-editor__title">登录密码</div>
                <div class="rec-editor__desc">学生端用「学号 / 家长手机号」+ 此口令登录；留空表示不修改</div>
              </div>
              <el-form label-width="88" @submit.prevent>
                <el-form-item label="登录密码">
                  <el-input
                    v-model="stuForm.studentPwdInput"
                    type="password"
                    show-password
                    maxlength="32"
                    :placeholder="stuForm.studentId ? '留空表示不修改' : '非必填，留空则暂不能登录'"
                  />
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </section>
      </div>
      <template #footer>
        <div class="dialog-foot">
          <el-button @click="stuVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveStudent">保存</el-button>
        </div>
      </template>
    </ReDialog>

    <!-- ============ 班级对话框 ============ -->
    <ReDialog v-model="clsVisible" class="q-dialog" width="860" :show-close="false" :show-window-shell="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon"><el-icon :size="18"><Grid /></el-icon></span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ clsForm.classId ? "编辑班级" : "新增班级" }}</div>
              <div class="dialog-head__sub">学生端登记时填的班级名会自动建立，这里可手工维护</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="clsVisible = false" />
        </div>
      </template>
      <div class="rec-editor">
        <aside class="rec-profile">
          <div class="rec-profile__hero">
            <span class="rec-profile__badge"><el-icon :size="34"><Grid /></el-icon></span>
            <div class="rec-profile__name">{{ clsForm.className || "未命名班级" }}</div>
            <div class="rec-profile__sub">{{ clsProfileSubline }}</div>
          </div>
          <ul class="rec-profile__list">
            <li v-for="it in clsProfileItems" :key="it.label" class="rec-profile__item">
              <span class="rec-profile__ico"><el-icon :size="16"><component :is="it.icon" /></el-icon></span>
              <div class="rec-profile__meta">
                <span class="rec-profile__label">{{ it.label }}</span>
                <span class="rec-profile__value">{{ it.value }}</span>
              </div>
            </li>
          </ul>
        </aside>

        <section class="rec-editor__main">
          <div class="rec-editor__head">
            <div class="rec-editor__title">基本资料</div>
            <div class="rec-editor__desc">班级是学生的必填归属；学生端登记时填的班级名也会自动建立</div>
          </div>
          <el-form :model="clsForm" label-width="88" @submit.prevent>
            <el-form-item label="班级名称" required>
              <el-input v-model="clsForm.className" placeholder="如 三年二班" />
            </el-form-item>
            <el-form-item label="班级编码">
              <el-input v-model="clsForm.classCode" placeholder="留空自动生成" />
            </el-form-item>
            <el-form-item label="学段">
              <el-select v-model="clsForm.classGradeLevel" clearable placeholder="选择学段" style="width: 100%">
                <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
            <el-form-item label="年级">
              <el-select v-model="clsForm.classGrade" clearable placeholder="选择年级" style="width: 100%">
                <el-option v-for="g in gradeSource" :key="g" :label="g" :value="g" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="clsForm.classStatus">
                <el-radio-button :value="1">启用</el-radio-button>
                <el-radio-button :value="0">停用</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </section>
      </div>
      <template #footer>
        <div class="dialog-foot">
          <el-button @click="clsVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveClass">保存</el-button>
        </div>
      </template>
    </ReDialog>

    <!-- ============ 教师对话框 ============ -->
    <ReDialog v-model="teaVisible" class="q-dialog" width="860" :show-close="false" :show-window-shell="false" align-center>
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon"><el-icon :size="18"><Reading /></el-icon></span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">{{ teaForm.teacherId ? "编辑教师" : "新增教师" }}</div>
              <div class="dialog-head__sub">工号是老师端绑定的关键字段</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="teaVisible = false" />
        </div>
      </template>
      <div class="rec-editor">
        <aside class="rec-profile">
          <div class="rec-profile__hero">
            <span class="rec-profile__badge"><el-icon :size="34"><Reading /></el-icon></span>
            <div class="rec-profile__name">{{ teaForm.teacherName || "未命名教师" }}</div>
            <div class="rec-profile__sub">{{ teaProfileSubline }}</div>
          </div>
          <ul class="rec-profile__list">
            <li v-for="it in teaProfileItems" :key="it.label" class="rec-profile__item">
              <span class="rec-profile__ico"><el-icon :size="16"><component :is="it.icon" /></el-icon></span>
              <div class="rec-profile__meta">
                <span class="rec-profile__label">{{ it.label }}</span>
                <span class="rec-profile__value">{{ it.value }}</span>
              </div>
            </li>
          </ul>
        </aside>

        <section class="rec-editor__main">
          <div class="rec-editor__head">
            <div class="rec-editor__title">基本资料</div>
            <div class="rec-editor__desc">工号是老师端绑定的关键字段；绑定账号由老师首次进老师端时自行绑定</div>
          </div>
          <el-form :model="teaForm" label-width="88" @submit.prevent>
            <el-form-item label="工号" required>
              <el-input v-model="teaForm.teacherNo" placeholder="如 T2024001" />
            </el-form-item>
            <el-form-item label="姓名" required>
              <el-input v-model="teaForm.teacherName" placeholder="如 王老师" />
            </el-form-item>
            <el-form-item label="任教学科">
              <el-input v-model="teaForm.teacherSubjectCode" placeholder="如 MATH" />
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="teaForm.teacherStatus">
                <el-radio-button :value="1">在职</el-radio-button>
                <el-radio-button :value="0">离职</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="绑定账号">
              <el-input :model-value="teaForm.teacherAccount || '（老师首次进老师端时自行绑定）'" disabled />
            </el-form-item>
          </el-form>
        </section>
      </div>
      <template #footer>
        <div class="dialog-foot">
          <el-button @click="teaVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveTeacher">保存</el-button>
        </div>
      </template>
    </ReDialog>

    <!-- ============ 教师班级配置对话框 ============ -->
    <ReDialog
      v-model="teaClassVisible"
      class="q-dialog tea-class-dialog"
      width="920"
      :show-close="false"
      :show-window-shell="false"
      align-center
    >
      <template #header>
        <div class="dialog-head">
          <div class="dialog-head__left">
            <span class="dialog-head__icon"><el-icon :size="18"><OfficeBuilding /></el-icon></span>
            <div class="dialog-head__text">
              <div class="dialog-head__title">配置教师班级</div>
              <div class="dialog-head__sub">仅勾选该教师需要管理的班级，保存后将覆盖原有配置</div>
            </div>
          </div>
          <ReButton layout="square" :icon="Close" tip="关闭" @click="teaClassVisible = false" />
        </div>
      </template>

      <!-- 工具栏：搜索 + 全选/反选 -->
      <div class="tea-class-toolbar">
        <div class="tea-class-search">
          <el-icon class="tea-class-search__icon"><Search /></el-icon>
          <input
            v-model="teaClassKeyword"
            type="text"
            class="tea-class-search__input"
            placeholder="搜索班级名称或编号"
          />
        </div>
        <div class="tea-class-actions">
          <el-button size="small" @click="selectAllTeaClasses">全选</el-button>
          <el-button size="small" @click="invertTeaClasses">反选</el-button>
        </div>
      </div>

      <!-- 班级网格（两列卡片勾选） -->
      <div class="tea-class-list">
        <el-alert
          v-if="!classes.length"
          type="warning"
          :closable="false"
          title="还没有班级，请先在「班级」页签新增"
        />
        <div v-else class="tea-class-grid">
          <label
            v-for="c in filteredTeaClasses"
            :key="c.classId"
            class="tea-class-item"
            :class="{ 'is-checked': teaClassForm.classIds.includes(c.classId) }"
          >
            <input
              type="checkbox"
              class="tea-class-item__checkbox"
              :checked="teaClassForm.classIds.includes(c.classId)"
              @change="toggleTeaClass(c)"
            />
            <span class="tea-class-item__body">
              <span class="tea-class-item__name">{{ c.className }}</span>
              <span class="tea-class-item__meta">{{ levelText(c.classGradeLevel) }}{{ c.classGrade ? ` · ${c.classGrade}` : "" }}</span>
            </span>
          </label>
        </div>
      </div>

      <template #footer>
        <div class="dialog-foot">
          <el-button @click="teaClassVisible = false">取消</el-button>
          <el-button type="primary" :loading="teaClassSaving" @click="submitTeacherClasses">保存</el-button>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentManageView —— 学生管理（数据配置）
 *
 * 三个标签页：学生 / 班级 / 教师。对应关系是「学生挂班级、教师可带班级」，
 * 缺任何一块都录不进学生（班级是学生的必填归属）。
 *
 * 与「学生端」的分工：
 *   - 这里由**管理员**维护档案（建学生、分班、设学号）；
 *   - 学生本人首次进 /edu/student 时，用学号/姓名自己绑定登录账号
 *     （落到 edu_student.student_account），因此这里的「绑定账号」是只读状态。
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { Close, Delete, EditPen, Grid, Key, Plus, Reading, RefreshLeft, Search, Star, View,
  Calendar, CircleCheck, Collection, CreditCard, Iphone, Link, OfficeBuilding, Postcard, School, User } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import { createPageLoader, pageLoadError, strParam } from "../api/pageLoader";

import type { EduClass, EduStudent, EduTeacher } from "../api/types";
import ReTable from "@repo/ui/components/ReTable/ReTable.vue";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";

const loading = ref(false);
const saving = ref(false);
const activeTab = ref("student");

/** 学生表 ref（loader 模式） */
const studentTableRef = ref();
/** 班级表 ref（loader 模式） */
const classTableRef = ref();
/** 教师表 ref（loader 模式） */
const teacherTableRef = ref();

/** 各表分页状态（独立于 ReTable 内部） */
const studentPage = ref(1);
const studentPageSize = ref(20);
const classPage = ref(1);
const classPageSize = ref(20);
const teacherPage = ref(1);
const teacherPageSize = ref(20);

/** 后端分页 total（统计卡 + 底部总数用） */
const studentTotal = ref(0);
const classTotal = ref(0);
const teacherTotal = ref(0);

/** 班级全量（学生筛选下拉 + 学生行班级名映射） */
const classes = ref<EduClass[]>([]);
/** 班级数据仍保留：学生筛选的班级下拉需要全量班级名，37 条量级可接受 */
const teachers = ref<EduTeacher[]>([]);

/** 学段下拉：后端内置枚举 */
const levelOptions = ref<{ value: string; label: string }[]>([]);

// ---------- 学生筛选 ----------
const stuKeyword = ref("");
const stuLevel = ref("");
const stuClassId = ref<number | null>(null);

/** 学生筛选参数：提交后作为 loader 的 params */
const studentParams = computed(() => ({
  keyword: strParam(stuKeyword.value),
  gradeLevel: strParam(stuLevel.value),
  classId: stuClassId.value ?? undefined,
}));

/** 学生分页 loader（后端筛选） */
const loadStudents = createPageLoader((page, size, params) =>
  eduaiApi.pageStudents({
    ...params,
    pageNum: page,
    pageSize: size,
  }),
);

/** 班级分页 loader */
const loadClasses = createPageLoader((page, size, params) =>
  eduaiApi.pageClasses({
    ...params,
    pageNum: page,
    pageSize: size,
  }),
);

/** 教师分页 loader */
const loadTeachers = createPageLoader((page, size, params) =>
  eduaiApi.pageTeachers({
    ...params,
    pageNum: page,
    pageSize: size,
  }),
);

/** 学生筛选提交：回到第一页并重查 */
function commitStudentSearch() {
  void studentTableRef.value?.goto(1);
}

/** ReTable 学生页加载完成后同步总数（统计卡 / 底部总数） */
function onStudentLoad(r: { total?: number }) {
  studentTotal.value = r?.total ?? 0;
}

/** ReTable 班级页加载完成后同步总数 */
function onClassLoad(r: { total?: number }) {
  classTotal.value = r?.total ?? 0;
}

/** ReTable 教师页加载完成后同步总数 */
function onTeacherLoad(r: { total?: number }) {
  teacherTotal.value = r?.total ?? 0;
}

const statCards = computed(() => {
  return [
    { title: "学生总数", value: studentTotal.value, hint: `已绑定 ${boundCount.value} 人`, icon: "Star", bg: "var(--el-color-primary-light-9)" },
    { title: "班级数", value: classTotal.value, hint: `教师 ${teacherTotal.value} 人`, icon: "Grid", bg: "var(--el-color-success-light-9)" },
    { title: "未绑定学生", value: Math.max(0, studentTotal.value - boundCount.value), hint: "尚未登录学生端", icon: "Warning", bg: "var(--el-color-warning-light-9)" },
  ];
});

/** 已绑定人数：后端分页无法从一页算全局，改由统计接口/全量轻查兜底 */
const boundCount = ref(0);
async function loadBoundCount() {
  try {
    const list = await eduaiApi.listStudents();
    boundCount.value = list?.filter((s) => !!s.studentAccount).length ?? 0;
  } catch {
    boundCount.value = 0;
  }
}

/**
 * 学段码转中文
 *
 * @param v 学段码
 * @returns 中文名
 */
function levelText(v?: string | null): string {
  if (!v) return "—";
  const hit = levelOptions.value.find((o) => o.value === v);
  return hit?.label ?? v;
}

/**
 * 班级 ID 转名称
 *
 * @param id 班级 ID
 * @returns 班级名，找不到时为 —
 */
function className(id?: number | null): string {
  if (!id) return "—";
  return classes.value.find((c) => c.classId === id)?.className ?? "—";
}

/**
 * 某班级下的学生数。
 *
 * <p>后端分页后班级行的学生数由 pageClasses 的 {@code studentCount} 字段提供；
 * 这里保留一个按班级查的兜底，供班级编辑弹窗 / 删除前校验使用。</p>
 */
async function studentsInClass(classId: number): Promise<number> {
  try {
    const page = await eduaiApi.pageStudents({ classId, pageNum: 1, pageSize: 1 });
    return page?.total ?? 0;
  } catch {
    return 0;
  }
}

// ==================== ReTable 列定义 ====================
/** ReTable loader 模式下数据由后端提供，此处仅保留列配置，不再有前端行 computed */

/**
 * 学生表列定义（原裸 el-table 迁移为 ReTable）
 *
 * 「操作」列带 className: "op-col" —— 透传给 el-table-column 的 class-name，
 * 按钮组的 flex 居中/清零 margin 样式依赖它。
 */
const studentColumns: ReTableColumn[] = [
  { prop: "studentId", label: "ID", width: 70 },
  { prop: "studentNo", label: "学号", width: 190, slot: "col-studentNo", showOverflowTooltip: true },
  { prop: "studentName", label: "姓名", width: 120 },
  { prop: "studentGradeLevel", label: "学段", width: 90, slot: "col-studentGradeLevel" },
  { prop: "studentGrade", label: "年级", width: 100 },
  { prop: "studentClassId", label: "班级", minWidth: 140, slot: "col-studentClassId" },
  { prop: "accountBind", label: "学生端绑定", width: 140, align: "center", slot: "col-accountBind" },
  { prop: "studentAccount", label: "绑定账号", width: 140, showOverflowTooltip: true },
  { prop: "studentParentPhone", label: "家长手机号", width: 130, slot: "col-studentParentPhone" },
  { prop: "studentStatus", label: "状态", width: 90, align: "center", slot: "col-studentStatus" },
  { prop: "actions", label: "操作", width: 200, align: "center", fixed: "right", slot: "col-actions", className: "op-col" },
];

/** 班级表列定义 */
const classColumns: ReTableColumn[] = [
  { prop: "classId", label: "ID", width: 70 },
  { prop: "classCode", label: "班级编码", width: 200, showOverflowTooltip: true },
  { prop: "className", label: "班级名称", minWidth: 160 },
  { prop: "classGradeLevel", label: "学段", width: 90, slot: "col-classGradeLevel" },
  { prop: "classGrade", label: "年级", width: 110 },
  { prop: "studentCount", label: "学生数", width: 90, align: "center", slot: "col-studentCount" },
  { prop: "actions", label: "操作", width: 120, align: "center", fixed: "right", slot: "col-actions", className: "op-col" },
];

/** 教师表列定义 */
const teacherColumns: ReTableColumn[] = [
  { prop: "teacherId", label: "ID", width: 70 },
  { prop: "teacherNo", label: "工号", width: 160, showOverflowTooltip: true },
  { prop: "teacherName", label: "姓名", width: 130 },
  { prop: "teacherSubjectCode", label: "任教学科", width: 130 },
  { prop: "accountBind", label: "老师端绑定", width: 140, align: "center", slot: "col-accountBind" },
  { prop: "teacherStatus", label: "状态", width: 90, align: "center", slot: "col-teacherStatus" },
  { prop: "classCount", label: "配置班级", width: 120, align: "center", slot: "col-classCount" },
  { prop: "actions", label: "操作", width: 160, align: "center", fixed: "right", slot: "col-actions", className: "op-col" },
];

// ==================== 加载 ====================
/** 首次 / 刷新：只拉班级全量（筛选下拉 + 班级名映射），三张表由各自 loader 分页加载 */
async function loadAll() {
  loading.value = true;
  try {
    const [cls] = await Promise.all([
      eduaiApi.listClasses(),
      loadBoundCount(),
    ]);
    classes.value = cls ?? [];
    // 三个表重新加载（当前筛选条件不变，回到各自第一页）
    void studentTableRef.value?.reload();
    void classTableRef.value?.reload();
    void teacherTableRef.value?.reload();
  } catch (e) {
    message.error(`加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    loading.value = false;
  }
}

async function loadLevels() {
  try {
    const drop = await eduaiApi.dimensionDropdown();
    levelOptions.value = drop?.gradeLevels ?? [];
  } catch {
    // 学段枚举拿不到不该让页面打不开：用一个最小兜底
    levelOptions.value = [
      { value: "PRIMARY", label: "小学" },
      { value: "JUNIOR", label: "初中" },
      { value: "SENIOR", label: "高中" },
    ];
  }
  syncGradeSource();
}

/**
 * 学段 → 年级 的对应表
 *
 * 后端 edu_grade 也存了年级，但那是「可选的运营维度」，拉一次要多一个请求；
 * 这里前端内置一份，理由是年级取值就是这 14 个固定值，且表单需要**随学段联动**
 * ——联动要求在用户改学段的瞬间就刷新下拉，走接口做不到这个时延。
 * 与 StudentPortalView.GRADES 保持同一份口径。
 */
const GRADES_BY_LEVEL: Record<string, string[]> = {
  PRIMARY: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  JUNIOR: ["初一", "初二", "初三"],
  SENIOR: ["高一", "高二", "高三"],
};

/**
 * 年级下拉的数据源：学段为空时给全集（避免用户必须先选学段才能填年级）
 *
 * 只在这里声明，不在此处注册 watch：stuForm / clsForm 在下面才 const 出来，
 * watch 的 getter 会立即执行，提前注册会撞 TDZ（Cannot access before initialization），
 * setup 直接抛错导致整个页面空白。注册动作见文件末尾。
 */
const gradeSource = ref<string[]>([]);
function syncGradeSource() {
  const level = stuForm.studentGradeLevel || clsForm.classGradeLevel;
  gradeSource.value = level ? (GRADES_BY_LEVEL[level] ?? []) : Object.values(GRADES_BY_LEVEL).flat();
}

function onTabChange() {
  // 三张表各自分页，切标签不需要重新请求；表格已由 loader 自动加载
}

// ==================== 学生 ====================
const stuVisible = ref(false);
const stuForm = reactive<Partial<EduStudent>>({});
/** 编辑区当前页签：basic=基本资料，pwd=修改密码 */
const stuTab = ref("basic");

/**
 * 画像副标题：学段 · 年级 · 班级，全空时给「尚未分班」。
 *
 * 用「—」判定空值：levelText/className 找不到时返回「—」，
 * 直接拼接会出现「— · — · —」。
 */
const stuProfileSubline = computed(() => {
  const parts = [
    levelText(stuForm.studentGradeLevel),
    stuForm.studentGrade,
    className(stuForm.studentClassId),
  ].filter((x) => x && x !== "—");
  return parts.length ? parts.join(" · ") : "尚未分班";
});

/**
 * 画像信息卡：全部跟随 stuForm 实时预览（含未保存的改动），
 * 让管理员在右侧改动时左侧立刻看到结果。
 */
const stuProfileItems = computed(() => [
  { label: "学号", value: stuForm.studentNo || "保存后自动生成", icon: Postcard },
  { label: "姓名", value: stuForm.studentName || "未填", icon: User },
  { label: "学段", value: levelText(stuForm.studentGradeLevel) === "—" ? "未填" : levelText(stuForm.studentGradeLevel), icon: School },
  { label: "年级", value: stuForm.studentGrade || "未填", icon: Collection },
  { label: "班级", value: className(stuForm.studentClassId) === "—" ? "未分班" : className(stuForm.studentClassId), icon: OfficeBuilding },
  { label: "家长手机号", value: stuForm.studentParentPhone || "未填", icon: Iphone },
  { label: "身份证号", value: stuForm.studentIdCard || "未填", icon: CreditCard },
  {
    label: "绑定账号",
    value: stuForm.studentAccount || (stuForm.studentNo ? `将设为 ${stuForm.studentNo}` : "保存后生成"),
    icon: Link,
  },
  { label: "状态", value: stuForm.studentStatus === 0 ? "离校" : "在读", icon: CircleCheck },
  { label: "入学年份", value: stuForm.studentEnrollYear ? String(stuForm.studentEnrollYear) : "未填", icon: Calendar },
]);

/** 头像文件选择框（隐藏，点头像时 programmatic click） */
const stuAvatarInput = ref<HTMLInputElement | null>(null);
/** 头像显示地址：相对路径拼成后端预览地址，http/data: 原样返回 */
const stuAvatarSrc = computed(() => eduaiApi.studentAvatarUrl(stuForm.studentAvatar ?? undefined));

/** 点头像 -> 唤出文件选择 */
function pickStuAvatar() {
  stuAvatarInput.value?.click();
}

/**
 * 选完头像文件 -> 上传 -> 写回 stuForm.studentAvatar（保存表单时才落库）。
 *
 * <p>只上传不即存：与其它字段一致，统一由「保存」提交，避免误点头像就永久改档。
 * 上传成功只提示「点保存生效」，管理员仍可取消。</p>
 */
async function onStuAvatarPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  // 清空 value：否则连续选同一个文件不会再触发 change
  input.value = "";
  if (!file) {
    return;
  }
  if (!file.type.startsWith("image/")) {
    return message.warning("请选择图片文件");
  }
  if (file.size > 2 * 1024 * 1024) {
    return message.warning("头像图片不要超过 2MB");
  }
  try {
    const res = await eduaiApi.uploadStudentAvatar(file);
    if (!res?.filePath) {
      return message.error("上传失败");
    }
    stuForm.studentAvatar = res.filePath;
    message.success("头像已更新，点「保存」生效");
  } catch (err) {
    message.error(err instanceof Error ? err.message : "上传失败");
  }
}

function openStudent(row?: EduStudent) {
  Object.keys(stuForm).forEach((k) => delete (stuForm as Record<string, unknown>)[k]);
  if (row) {
    Object.assign(stuForm, row);
  } else {
    Object.assign(stuForm, { studentStatus: 1, studentEnrollYear: new Date().getFullYear() });
  }
  // 编辑态不回填口令：后端只返回是否已设置，从不回显明文，
  // 这里显式清空以免把上一条记录的输入残留到下一条。
  stuForm.studentPwdInput = "";
  // 每次打开都从「基本资料」开始，避免上一条停在「修改密码」页签造成误操作。
  stuTab.value = "basic";
  stuVisible.value = true;
}

/**
 * 复制学号。
 *
 * <p>不能只用 navigator.clipboard：它要求安全上下文，而本系统部署在
 * http://192.168.50.198 这种内网明文地址上，浏览器里 navigator.clipboard 直接是
 * undefined（dev 的 127.0.0.1 反而有），所以必须带 textarea + execCommand 的降级分支，
 * 否则会出现「本机好用、上线点不动」这种只在生产暴露的假绿。</p>
 *
 * @param studentNo 学号
 */
async function copyStudentNo(studentNo?: string): Promise<void> {
  const text = (studentNo ?? "").trim();
  if (!text) {
    message.warning("该学生还没有学号");
    return;
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    message.success(`已复制学号 ${text}`);
  } catch {
    message.error("复制失败，请手动选择后复制");
  }
}

/**
 * 代入指定学生：向管理员展示该学生看到的学生端页面。
 *
 * 走 oauth 的临时令牌能力 —— 令牌短期、只读、且被限制在学生端路径内，
 * 所以管理员能排查问题但既不会污染学生的学习记录，也碰不到管理端接口。
 * 令牌只在本次跳转的窗口里用一次，因此不写入本地存储（刷新即失效）。
 */
async function impersonate(row: EduStudent) {
  if (!row.studentId) return message.warning("该学生缺少标识，无法代入");
  try {
    const res = await eduaiApi.impersonateStudent({ studentId: row.studentId, expireSeconds: 300 });
    if (!res?.accessToken) {
      return message.error("签发临时令牌失败");
    }
    const url = `/edu/student?impersonate=${encodeURIComponent(res.accessToken)}`;
    const win = window.open(url, "_blank", "noopener");
    if (!win) {
      message.warning("浏览器拦截了新窗口，请允许弹窗后重试");
      return;
    }
    message.success(`已代入 ${row.studentName || row.studentNo}（5 分钟内有效）`);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "代入失败");
  }
}

async function saveStudent() {
  // 学号由系统生成：新增时不填（输入框 disabled），保存后回填；只有编辑态才要求它已存在。
  // 原先这里无条件要求学号，而输入框是 disabled —— 新增学生会被前端自己拦住。
  if (stuForm.studentId && !stuForm.studentNo?.trim()) {
    return message.warning("学号缺失，无法保存");
  }
  if (!stuForm.studentName?.trim()) return message.warning("请填写姓名");
  // 家长手机号非必填，但填了就必须是 11 位手机号 —— 它将来是登录凭据，
  // 格式错的号会让家长永远登不进来且查不出原因，故在提交前就拦。
  const phone = stuForm.studentParentPhone?.trim() ?? "";
  if (phone && !/^1\d{10}$/.test(phone)) {
    return message.warning("家长手机号格式不对，应为 11 位手机号");
  }
  // 口令非必填（留空表示本次不改），但填了就要够长 —— 后端只存加盐摘要，
  // 填得太短等于给学生留一个一猜就中的账号，故在提交前就拦。
  const pwd = stuForm.studentPwdInput?.trim() ?? "";
  if (pwd && (pwd.length < 6 || pwd.length > 32)) {
    return message.warning("登录密码长度需为 6 到 32 位");
  }
  saving.value = true;
  try {
    await eduaiApi.saveStudent({
      ...stuForm,
      // 新增时学号为空：传 undefined 让后端生成；直接 .trim() 会抛 TypeError。
      studentNo: stuForm.studentNo?.trim() || undefined,
      studentName: stuForm.studentName.trim(),
      // 留空时传 undefined 而非空串：后端据此判定「本次不改口令」，
      // 传空串会被当成「设置成空口令」。
      studentPwdInput: pwd || undefined,
    });
    message.success("已保存");
    stuVisible.value = false;
    await loadAll();
  } catch (e) {
    message.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeStudent(row: EduStudent) {
  try {
    await ElMessageBox.confirm(
      `确定删除学生「${row.studentName ?? row.studentNo}」？其学习进度与每日汇总会一并清除，且不可恢复。`,
      "删除学生",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteStudent(row.studentId);
    message[ok ? "success" : "warning"](ok ? "已删除" : "该记录已不存在");
    await loadAll();
  } catch (e) {
    message.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * 管理员重置学生登录口令。
 *
 * <p>用 prompt 而非独立弹窗：只有「确认 + 输入口令」两步，
 * 单独造一个对话框会多出一份状态与样式维护成本。
 * 口令规则由后端 StudentPasswordSupport 统一校验，前端不重复实现。</p>
 */
async function openResetPassword(row: EduStudent) {
  let input = "";
  try {
    const result = await ElMessageBox.prompt(
      `为学生「${row.studentName ?? row.studentNo}」设置新的登录口令。该学生需用新口令重新登录。`,
      "重置登录密码",
      {
        type: "warning",
        confirmButtonText: "重置",
        cancelButtonText: "取消",
        inputType: "password",
        inputPlaceholder: "6-32 位，建议字母与数字组合",
        inputValidator: (value: string) => {
          const raw = (value ?? "").trim();
          if (raw.length < 6) return "口令至少 6 位";
          if (raw.length > 32) return "口令最多 32 位";
          return true;
        },
      },
    );
    input = result.value;
  } catch {
    return;
  }
  try {
    await eduaiApi.resetStudentPassword(row.studentId, input);
    message.success("口令已重置");
  } catch (e) {
    message.error(`重置失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

// ==================== 班级 ====================
const clsVisible = ref(false);
const clsForm = reactive<Partial<EduClass>>({});
/** 班级画像副标题：学段 · 年级（全空给「未设置」） */
const clsProfileSubline = computed(() => {
  const parts = [levelText(clsForm.classGradeLevel), clsForm.classGrade].filter((x) => x && x !== "—");
  return parts.length ? parts.join(" · ") : "未设置学段年级";
});
/** 班级画像信息卡：跟随 clsForm 实时预览 */
const clsProfileItems = computed(() => [
  { label: "班级编码", value: clsForm.classCode || "保存后自动生成", icon: Grid },
  {
    label: "学段",
    value: levelText(clsForm.classGradeLevel) === "—" ? "未填" : levelText(clsForm.classGradeLevel),
    icon: School,
  },
  { label: "年级", value: clsForm.classGrade || "未填", icon: Collection },
  { label: "学生数", value: clsForm.classId ? `${clsStudentCount.value} 人` : "—", icon: User },
  { label: "状态", value: clsForm.classStatus === 0 ? "停用" : "启用", icon: CircleCheck },
]);

/** 班级编辑弹窗里的学生数：打开时从后端分页行的 studentCount 带过来 */
const clsStudentCount = ref(0);

function openClass(row?: EduClass) {
  Object.keys(clsForm).forEach((k) => delete (clsForm as Record<string, unknown>)[k]);
  if (row) {
    Object.assign(clsForm, row);
    clsStudentCount.value = (row as unknown as { studentCount?: number }).studentCount ?? 0;
  } else {
    Object.assign(clsForm, { classStatus: 1 });
    clsStudentCount.value = 0;
  }
  clsVisible.value = true;
}

async function saveClass() {
  const name = clsForm.className?.trim() ?? "";
  if (!name) return message.warning("请填写班级名称");
  // 班名是业务唯一（后端有唯一索引兜底）。先在已加载列表里查一次重名，
  // 目的是把"唯一索引冲突"变成一句人话，而不是等请求失败才报。
  const dup = classes.value.find((c) => c.className === name && c.classId !== clsForm.classId);
  if (dup) return message.warning(`班级名称「${name}」已存在，请换一个名称`);
  saving.value = true;
  try {
    await eduaiApi.saveClass({
      ...clsForm,
      className: name,
      classCode: clsForm.classCode?.trim() || undefined,
    });
    message.success("已保存");
    clsVisible.value = false;
    await loadAll();
  } catch (e) {
    message.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeClass(row: EduClass) {
  const inClass = await studentsInClass(row.classId);
  if (inClass > 0) {
    message.warning(`该班级下还有 ${inClass} 名学生，请先转班或删学生`);
    return;
  }
  try {
    await ElMessageBox.confirm(`确定删除班级「${row.className}」？`, "删除班级", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteClass(row.classId);
    message[ok ? "success" : "warning"](ok ? "已删除" : "该记录已不存在");
    await loadAll();
  } catch (e) {
    message.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

// ==================== 教师 ====================
const teaVisible = ref(false);
const teaForm = reactive<Partial<EduTeacher>>({});
/** 教师画像副标题：工号 · 任教学科（全空给「未设置」） */
const teaProfileSubline = computed(() => {
  const parts = [teaForm.teacherNo, teaForm.teacherSubjectCode].filter((x) => x && String(x).trim());
  return parts.length ? parts.join(" · ") : "未设置工号/学科";
});
/** 教师画像信息卡：跟随 teaForm 实时预览 */
const teaProfileItems = computed(() => [
  { label: "工号", value: teaForm.teacherNo || "未填", icon: Postcard },
  { label: "姓名", value: teaForm.teacherName || "未填", icon: User },
  { label: "任教学科", value: teaForm.teacherSubjectCode || "未填", icon: Reading },
  { label: "状态", value: teaForm.teacherStatus === 0 ? "离职" : "在职", icon: CircleCheck },
  { label: "绑定账号", value: teaForm.teacherAccount || "首次进老师端时自行绑定", icon: Link },
]);

function openTeacher(row?: EduTeacher) {
  Object.keys(teaForm).forEach((k) => delete (teaForm as Record<string, unknown>)[k]);
  if (row) {
    Object.assign(teaForm, row);
  } else {
    Object.assign(teaForm, { teacherStatus: 1 });
  }
  teaVisible.value = true;
}

async function saveTeacher() {
  if (!teaForm.teacherNo?.trim()) return message.warning("请填写工号");
  if (!teaForm.teacherName?.trim()) return message.warning("请填写姓名");
  saving.value = true;
  try {
    await eduaiApi.saveTeacher({
      ...teaForm,
      teacherNo: teaForm.teacherNo.trim(),
      teacherName: teaForm.teacherName.trim(),
    });
    message.success("已保存");
    teaVisible.value = false;
    await loadAll();
  } catch (e) {
    message.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeTeacher(row: EduTeacher) {
  try {
    await ElMessageBox.confirm(`确定删除教师「${row.teacherName ?? row.teacherNo}」？`, "删除教师", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    const ok = await eduaiApi.deleteTeacher(row.teacherId);
    message[ok ? "success" : "warning"](ok ? "已删除" : "该记录已不存在");
    await loadAll();
  } catch (e) {
    message.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

// ==================== 教师班级配置（老师端数据范围） ====================
/** 教师班级配置弹窗 */
const teaClassVisible = ref(false);
const teaClassSaving = ref(false);
const teaClassKeyword = ref("");
const teaClassForm = reactive<{
  teacherId: number | null;
  teacherName: string;
  classIds: number[];
}>({ teacherId: null, teacherName: "", classIds: [] });
/** 教师 → 已配置班级缓存（列表页「配置班级」列展示用） */
const teacherClassMap = ref<Record<number, EduClass[]>>({});

/** 按关键字过滤班级：名称或班级编码（图中搜索框语义） */
const filteredTeaClasses = computed(() => {
  const kw = teaClassKeyword.value.trim().toLowerCase();
  if (!kw) return classes.value;
  return classes.value.filter((c) =>
    [c.className, c.classCode].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw)),
  );
});

/** 切换单个班级勾选 */
function toggleTeaClass(c: EduClass): void {
  const id = c.classId;
  const i = teaClassForm.classIds.indexOf(id);
  if (i >= 0) {
    teaClassForm.classIds.splice(i, 1);
  } else {
    teaClassForm.classIds.push(id);
  }
}

/** 全选当前筛出的班级（不影响筛掉但已选中的班级） */
function selectAllTeaClasses(): void {
  const ids = new Set(teaClassForm.classIds);
  filteredTeaClasses.value.forEach((c) => ids.add(c.classId));
  teaClassForm.classIds = [...ids];
}

/** 反选当前筛出的班级（筛掉的班级保持原状态） */
function invertTeaClasses(): void {
  const current = new Set(filteredTeaClasses.value.map((c) => c.classId));
  const ids = new Set(teaClassForm.classIds);
  filteredTeaClasses.value.forEach((c) => {
    if (ids.has(c.classId)) {
      ids.delete(c.classId);
    } else {
      ids.add(c.classId);
    }
  });
  void current;
  teaClassForm.classIds = [...ids];
}

/** 教师已配置的班级列表（未拉取到时为空数组） */
function classesOf(teacher: EduTeacher): EduClass[] {
  return teacherClassMap.value[teacher.teacherId] ?? [];
}

/** 已配置班级名串联（列悬浮提示展示全名） */
function classNamesOf(teacher: EduTeacher): string {
  return classesOf(teacher).map((c) => c.className).join("、") || "未配置班级";
}

/**
 * 打开教师班级配置：先拉该教师已配置的班级进表单。
 *
 * @param teacher 教师行
 */
async function openTeacherClasses(teacher: EduTeacher) {
  teaClassForm.teacherId = teacher.teacherId;
  teaClassForm.teacherName = teacher.teacherName || teacher.teacherNo;
  teaClassForm.classIds = [];
  teaClassKeyword.value = "";
  teaClassVisible.value = true;
  try {
    const list = await eduaiApi.listTeacherClasses(teacher.teacherId);
    teacherClassMap.value[teacher.teacherId] = list ?? [];
    teaClassForm.classIds = (list ?? []).map((c) => c.classId);
  } catch (e) {
    message.error(`已配置班级加载失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

/** 保存教师班级配置（全量替换）：老师端数据范围即时生效 */
async function submitTeacherClasses() {
  if (teaClassForm.teacherId == null) {
    return;
  }
  teaClassSaving.value = true;
  try {
    await eduaiApi.saveTeacherClasses(teaClassForm.teacherId, teaClassForm.classIds);
    message.success("已保存，老师端数据范围即时生效");
    // 刷新缓存：列表页「配置班级」列随之更新
    const list = await eduaiApi.listTeacherClasses(teaClassForm.teacherId);
    teacherClassMap.value[teaClassForm.teacherId] = list ?? [];
    teaClassVisible.value = false;
  } catch (e) {
    message.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    teaClassSaving.value = false;
  }
}

// 学段一变，年级立刻跟着收窄：原来选中的年级若不在新学段里会被清空，
// 否则会存下「初中 + 一年级」这种自相矛盾的组合。
// 必须放在 stuForm / clsForm 声明之后 —— watch 的 getter 会立即求值，
// 声明之前注册会读到尚未初始化的 const（TDZ），setup 抛错、整页空白。
watch(() => stuForm.studentGradeLevel, syncGradeSource);
watch(() => clsForm.classGradeLevel, syncGradeSource);

onMounted(() => {
  // 首次也要同步一次：新建学生时表单是空的，年级下拉得有全集可选
  syncGradeSource();
  void loadLevels();
  void loadAll();
});
</script>

<style scoped>
/*
 * 版式基线对齐 PoemBankView / IdiomBankView（昆虫库版式）：
 * page-container（flex 列）→ top-zone（页头 + 横向统计卡）→ table-card（含 el-tabs）。
 * 统计卡是横向卡片，图标块靠右；表格区经 flex 链吃满剩余高度。
 */
.page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  /* 整页不再滚动：剩余高度全部交给表格区，避免 tab 内容不满高、底部留白 */
  overflow: hidden;
  background: var(--el-bg-color-page);
}

/* ---------- 上区：页头 + 横向统计卡 ---------- */
.top-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
}
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  flex: 1;
}
.page-header__left {
  min-width: 0;
}
.page-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.page-header__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stats-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 170px;
  padding: 12px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
}
.stat-card__body {
  min-width: 0;
}
.stat-card__title {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 0;
}
.stat-card__value {
  font-size: 24px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.stat-card__hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.stat-card__icon {
  width: 42px;
  height: 42px;
  border-radius: var(--el-radius-lg, 12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  flex-shrink: 0;
}
.table-card {
  border-radius: var(--el-radius-lg, 12px);
  /* 撑满 page-container 的剩余高度，让 tab 区「吃满」而不是按内容高度收缩 */
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.table-card :deep(.el-card__body) {
  padding: 20px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
/* page → card → el-tabs → content → tab-pane → table 纵向 flex 链 */
.table-card :deep(.el-tabs) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.table-card :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
}
.table-card :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.table-card :deep(.el-tab-pane > .el-table) {
  flex: 1;
  min-height: 0;
}
.table-card :deep(.el-table__inner-wrapper) {
  height: 100%;
}
/* 操作列（fixed="right"）表头必须与其它列表头同色：
   Element Plus 的固定列会给单元格上 background: var(--el-bg-color)（白），
   盖掉主题 element.scss 里 .el-table__header-wrapper th 的 --el-fill-color-light，
   于是「操作」表头看着是白的、与其它列不一致。这里把表头单元格背景钉回主题色。 */
.table-card :deep(.el-table__header-wrapper th.el-table__cell) {
  background: var(--el-fill-color-light);
}

/*
 * 空态兜底下限：保证「暂无数据」有可读高度，不会退化成一条细缝。
 * Element Plus 默认只有 60px。
 */
.table-card :deep(.el-table__empty-block) {
  min-height: 180px;
}
/* ---------- 筛选卡（与学生管理基线同构） ---------- */
.filter-card {
  border-radius: var(--el-radius-lg, 12px);
  margin-bottom: 14px;
}
.filter-card :deep(.el-card__body) {
  padding: 18px 20px;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 12px 16px;
  align-items: end;
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.filter-field__label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  white-space: nowrap;
}
.filter-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
/* 空值占位：与「—」同类语义，但中文更直白 */
.cell-muted {
  color: var(--el-text-color-placeholder);
}
/* 学号单元格：号码 + 复制图标同排，号码过长时省略而不是把图标挤出去 */
.no-cell {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}
.no-cell__text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
/* 复制图标：默认隐藏，鼠标经过单元格才显示（不是按钮，只是可点的图标） */
.no-cell__copy {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  opacity: 0;
  transition:
    opacity var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.no-cell:hover .no-cell__copy {
  opacity: 1;
}
.no-cell__copy:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
.no-cell__copy:focus-visible {
  opacity: 1;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  outline: none;
}
.tag-pill {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  border-radius: var(--el-radius-sm, 6px);
  padding: 1px 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}
.tag-pill.is-blue {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.tag-pill.is-green {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.tag-pill.is-grey {
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
}
/* ---------- 操作列：图标按钮组统一样式 ----------
   三张表（学生/班级/教师）的操作列共用 .op-col：
   用 flex + gap 统一间距与居中，并清零 ReButton(Square) 自带的 margin: 0 4px
   （不清零时首尾各多 4px，三张表的按钮组看起来不齐）。
   .rs-btn 是 ReButton 内部的 scoped 类，必须 :deep() 穿透。 */
:deep(.op-col .cell) {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
:deep(.op-col .cell .rs-btn) {
  margin: 0;
}

/* ---------- 弹窗：与古诗库/成语库同构 ---------- */
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
.form-grid {
  display: grid;
  gap: 0 14px;
}
.form-grid--2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.dialog-foot .el-button {
  border-radius: var(--el-radius-lg, 12px);
  min-width: 96px;
  font-weight: 600;
}
@media (max-width: 900px) {
  .form-grid--2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ============ 数据配置对话框：左右结构（学生 / 班级 / 教师 共用）============ */
/* 左画像 / 右编辑；学生用大头像，班级/教师无头像图故用图标牌 */
.rec-editor {
  display: grid;
  grid-template-columns: 296px minmax(0, 1fr);
  min-height: 440px;
}
@media (max-width: 860px) {
  .rec-editor {
    grid-template-columns: minmax(0, 1fr);
  }
  .rec-profile {
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}
/* 左：学生画像 */
.rec-profile {
  padding: 26px 18px;
  border-right: 1px solid var(--el-border-color-lighter);
  background: linear-gradient(180deg, var(--el-color-primary-light-9) 0%, var(--el-fill-color-blank) 240px);
}
.rec-profile__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 18px;
}
.rec-profile__avatar {
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: 0 2px 10px var(--el-box-shadow-lighter);
}
/* 头像即上传入口：去掉按钮默认外观，hover/聚焦时浮出「换头像」 */
.rec-profile__avatar-btn {
  position: relative;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  line-height: 0;
  border-radius: var(--el-radius-lg, 12px);
}
.rec-profile__avatar-btn:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.rec-profile__avatar-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 3px 0;
  border-radius: 0 0 var(--el-radius-lg, 12px) var(--el-radius-lg, 12px);
  background: color-mix(in srgb, var(--el-color-primary) 82%, transparent);
  color: var(--el-color-white);
  font-size: 11px;
  line-height: 1.4;
  opacity: 0;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease;
}
.rec-profile__avatar-btn:hover .rec-profile__avatar-hint,
.rec-profile__avatar-btn:focus-visible .rec-profile__avatar-hint {
  opacity: 1;
}
/* 隐藏的文件选择框：由点击头像触发 */
.rec-profile__file {
  display: none;
}
/* 无头像图的实体（班级/教师）用图标牌占据同一位置，保持两个对话框视觉一致 */
.rec-profile__badge {
  width: 84px;
  height: 84px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-lg, 12px);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  color: var(--el-color-white);
  box-shadow: 0 2px 10px var(--el-box-shadow-lighter);
}
.rec-profile__name {
  margin-top: 10px;
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.3;
}
.rec-profile__sub {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.rec-profile__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.rec-profile__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
}
.rec-profile__ico {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.rec-profile__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.rec-profile__label {
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}
.rec-profile__value {
  font-size: 13px;
  line-height: 1.5;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}
/* 右：编辑区 */
.rec-editor__main {
  padding: 18px 22px 4px;
  min-width: 0;
}
.rec-editor__head {
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.rec-editor__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.rec-editor__desc {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============
   ReButton 的动效由组件自身负责。 */

/* ---------- 教师班级配置：两列卡片勾选网格 ---------- */
.tea-class-dialog .dialog-head__sub {
  max-width: none;
}
.tea-class-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.tea-class-search {
  display: flex;
  align-items: center;
  flex: 1 1 280px;
  min-width: 220px;
  height: 34px;
  padding: 0 10px;
  gap: 6px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-base, 4px);
  background: var(--el-bg-color);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.tea-class-search:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.tea-class-search__icon {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
}
.tea-class-search__input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
  background: transparent;
}
.tea-class-search__input::placeholder {
  color: var(--el-text-color-placeholder);
}
.tea-class-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.tea-class-actions .el-button {
  height: 30px;
  padding: 0 14px;
  border-radius: var(--el-radius-base, 4px);
  font-size: 13px;
}
.tea-class-list {
  max-height: 46vh;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  padding: 10px;
  background: var(--el-fill-color-light);
  margin-bottom: 18px;
}
.tea-class-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}
.tea-class-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  cursor: pointer;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.tea-class-item:hover {
  border-color: var(--el-color-primary);
}
.tea-class-item.is-checked {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
}
.tea-class-item__checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  margin: 0;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-bg-color);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}
.tea-class-item.is-checked .tea-class-item__checkbox {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}
.tea-class-item.is-checked .tea-class-item__checkbox::after {
  content: "";
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid var(--el-color-white);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.tea-class-item__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}
.tea-class-item__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tea-class-item__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
