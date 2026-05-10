<template>
  <section class="face-library-workbench system-container modern-bg">
    <!-- Header -->
    <header class="face-library__header">
      <button class="face-library__back" @click="router.push('/ai/home')">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </button>
      <div class="face-library__header-body">
        <h2 class="face-library__header-title">人脸库管理</h2>
        <p class="face-library__header-desc">注册、管理、识别人脸</p>
      </div>
      <nav class="face-library__nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="face-library__nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <IconifyIconOnline :icon="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </header>

    <!-- Group bar ────────────────────────────── -->
    <div class="face-library__group-bar">
      <div class="face-library__group-select">
        <span class="face-library__group-label">分组：</span>
        <select v-model="selectedGroup" class="face-library__group-select-input" @change="handleGroupChange">
          <option value="">全部</option>
          <option v-for="g in groupOptions" :key="g.sysAiFaceGroupId" :value="g.sysAiFaceGroupName">
            {{ g.sysAiFaceGroupName }}
          </option>
        </select>
      </div>
      <button class="face-library__btn face-library__btn--sm" @click="openGroupManager">
        <IconifyIconOnline icon="ri:list-settings-line" />
        <span>管理分组</span>
      </button>
    </div>

    <!-- Hidden file input (shared across upload zones) -->
    <input ref="fileInputRef" class="face-library__file-input" type="file" accept="image/*" @change="handleFilePick" />

    <!-- ─── Tab: List ─────────────────────────────── -->
    <section v-if="activeTab === 'list'" class="face-library__panel face-library__list-panel">
      <div class="face-library__list-toolbar">
        <span class="face-library__list-count">共 {{ faceList.length }} 条记录</span>
        <button class="face-library__btn face-library__btn--primary" @click="activeTab = 'register'">
          <IconifyIconOnline icon="ri:user-add-line" />
          <span>注册人脸</span>
        </button>
      </div>

      <div v-if="faceList.length === 0" class="face-library__empty">
        <div class="face-library__empty-icon">
          <IconifyIconOnline icon="ri:user-smile-line" />
        </div>
        <p class="face-library__empty-text">人脸库为空</p>
        <button class="face-library__btn face-library__btn--primary" @click="activeTab = 'register'">
          <IconifyIconOnline icon="ri:add-line" />
          <span>注册第一张人脸</span>
        </button>
      </div>

      <div v-else class="face-library__card-grid">
        <div
          v-for="item in faceList"
          :key="item.sysAiFaceLibraryId"
          class="face-library__card"
          @click="handleCardClick(item)"
        >
          <div class="face-library__card-img">
            <img v-if="item.sysAiFaceLibraryThumbnail" :src="item.sysAiFaceLibraryThumbnail" alt="" loading="lazy" />
            <IconifyIconOnline v-else icon="ri:user-smile-line" />
          </div>
          <div class="face-library__card-body">
            <div class="face-library__card-name">{{ item.sysAiFaceLibraryName }}</div>
            <div v-if="item.sysAiFaceLibraryFullName" class="face-library__card-sub">
              <IconifyIconOnline icon="ri:user-line" />{{ item.sysAiFaceLibraryFullName }}
            </div>
            <div v-if="item.sysAiFaceLibraryIdCard" class="face-library__card-sub">
              <IconifyIconOnline icon="ri:fingerprint-line" />{{ item.sysAiFaceLibraryIdCard }}
            </div>
            <div class="face-library__card-time">{{ item.createTime || '' }}</div>
          </div>
          <div class="face-library__card-actions" @click.stop>
            <button
              class="face-library__card-btn face-library__card-btn--danger"
              :disabled="deletingId === item.sysAiFaceLibraryId"
              @click="handleDelete(item)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Detail Dialog ──────────────────────────── -->
    <div v-if="showDetail" class="face-library__overlay" @click.self="closeDetail">
      <div class="face-library__dialog">
        <div class="face-library__dialog-head">
          <h3>{{ editing ? '编辑人脸信息' : '人脸详情' }}</h3>
          <button class="face-library__dialog-close" @click="closeDetail">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </div>

        <div class="face-library__dialog-body">
          <div class="face-library__dialog-avatar">
            <img v-if="detailItem.sysAiFaceLibraryThumbnail" :src="detailItem.sysAiFaceLibraryThumbnail" alt="" />
            <IconifyIconOnline v-else icon="ri:user-smile-line" />
          </div>

          <div class="face-library__dialog-fields">
            <label class="face-library__form-field">
              <span class="face-library__form-label">名称 <em>*</em></span>
              <input v-model="detailForm.name" class="face-library__form-input" :disabled="!editing" placeholder="输入名称" />
            </label>
            <label class="face-library__form-field">
              <span class="face-library__form-label">姓名</span>
              <input v-model="detailForm.fullName" class="face-library__form-input" :disabled="!editing" placeholder="输入姓名" />
            </label>
            <label class="face-library__form-field">
              <span class="face-library__form-label">身份证 <em>*</em></span>
              <input v-model="detailForm.idCard" class="face-library__form-input" :disabled="!editing" placeholder="输入身份证号" />
            </label>
            <label v-if="editing" class="face-library__form-field">
              <span class="face-library__form-label">分组</span>
              <select v-model="detailForm.group" class="face-library__form-input">
                <option v-for="g in groupOptions" :key="g.sysAiFaceGroupId" :value="g.sysAiFaceGroupName">
                  {{ g.sysAiFaceGroupName }}
                </option>
              </select>
            </label>
            <div class="face-library__dialog-meta">
              <div class="face-library__dialog-meta-item">
                <span class="face-library__dialog-meta-label">向量 ID</span>
                <span class="face-library__dialog-meta-value">{{ detailItem.sysAiFaceLibraryVectorId }}</span>
              </div>
              <div class="face-library__dialog-meta-item">
                <span class="face-library__dialog-meta-label">分组</span>
                <span class="face-library__dialog-meta-value">{{ detailItem.sysAiFaceLibraryGroup }}</span>
              </div>
              <div class="face-library__dialog-meta-item">
                <span class="face-library__dialog-meta-label">创建时间</span>
                <span class="face-library__dialog-meta-value">{{ detailItem.createTime || '-' }}</span>
              </div>
              <div class="face-library__dialog-meta-item">
                <span class="face-library__dialog-meta-label">状态</span>
                <span class="face-library__dialog-meta-value">{{ detailItem.sysAiFaceLibraryStatus === 1 ? '启用' : '禁用' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="face-library__dialog-foot">
          <template v-if="editing">
            <button class="face-library__btn" @click="cancelEdit">取消</button>
            <button class="face-library__btn face-library__btn--primary" :disabled="savingDetail" @click="handleSaveDetail">
              <IconifyIconOnline v-if="savingDetail" icon="ri:loader-4-line" class="face-library__spinner" />
              <span>{{ savingDetail ? '保存中...' : '保存' }}</span>
            </button>
          </template>
          <template v-else>
            <button class="face-library__btn" @click="closeDetail">关闭</button>
            <button class="face-library__btn face-library__btn--primary" @click="editing = true">
              <IconifyIconOnline icon="ri:edit-line" />
              <span>编辑</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- ─── Tab: Register ─────────────────────────── -->
    <section v-if="activeTab === 'register'" class="face-library__panel face-library__form-panel">
      <div class="face-library__form-layout">
        <div
          class="face-library__upload-zone"
          :class="{ 'is-dragging': dragging, 'is-filled': !!registerPreview }"
          @click="openFilePicker()"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
        >
          <img v-if="registerPreview" :src="registerPreview" alt="preview" class="face-library__upload-preview" />
          <div v-else class="face-library__upload-hint">
            <div class="face-library__upload-plus">
              <IconifyIconOnline icon="ri:add-line" />
            </div>
            <span>点击或拖拽上传人脸图片</span>
          </div>
        </div>

        <div class="face-library__form-body">
          <label class="face-library__form-field">
            <span class="face-library__form-label">名称 <em>*</em></span>
            <input v-model="registerForm.name" class="face-library__form-input" placeholder="输入人脸名称" />
          </label>
          <label class="face-library__form-field">
            <span class="face-library__form-label">姓名</span>
            <input v-model="registerForm.fullName" class="face-library__form-input" placeholder="输入姓名" />
          </label>
          <label class="face-library__form-field">
            <span class="face-library__form-label">身份证 <em>*</em></span>
            <input v-model="registerForm.idCard" class="face-library__form-input" placeholder="输入身份证号(必填)" />
            <span v-if="idCardError" class="face-library__field-error">{{ idCardError }}</span>
          </label>
          <label class="face-library__form-field">
            <span class="face-library__form-label">分组</span>
            <select v-model="registerForm.group" class="face-library__form-input">
              <option v-for="g in groupOptions" :key="g.sysAiFaceGroupId" :value="g.sysAiFaceGroupName">
                {{ g.sysAiFaceGroupName }}
              </option>
            </select>
          </label>
          <div class="face-library__form-actions">
            <button class="face-library__btn" @click="activeTab = 'list'">取消</button>
            <button
              class="face-library__btn face-library__btn--primary"
              :disabled="!registerForm.name || !registerForm.idCard || !registerPreview || registering"
              @click="handleRegister"
            >
              <IconifyIconOnline v-if="registering" icon="ri:loader-4-line" class="face-library__spinner" />
              <span>{{ registering ? '注册中...' : '注册' }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Tab: Recognize ────────────────────────── -->
    <section v-if="activeTab === 'recognize'" class="face-library__panel face-library__form-panel">
      <div class="face-library__recognize-layout">
        <div class="face-library__recognize-left">
          <div
            class="face-library__upload-zone face-library__upload-zone--compact"
            :class="{ 'is-dragging': dragging, 'is-filled': !!recognizePreview }"
            @click="openFilePicker()"
            @dragenter.prevent="dragging = true"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="handleDrop"
          >
            <img v-if="recognizePreview" :src="recognizePreview" alt="preview" class="face-library__upload-preview" />
            <div v-else class="face-library__upload-hint">
              <div class="face-library__upload-plus">
                <IconifyIconOnline icon="ri:add-line" />
              </div>
              <span>点击上传待识别图片</span>
            </div>
          </div>

          <div class="face-library__recognize-controls">
            <label class="face-library__ctrl">
              <span class="face-library__ctrl-label">返回 Top-K</span>
              <div class="face-library__ctrl-input">
                <el-input-number v-model="recognizeForm.topK" :min="1" :max="20" size="small" style="width:100px" />
              </div>
            </label>
            <label class="face-library__ctrl">
              <span class="face-library__ctrl-label">最低相似度</span>
              <div class="face-library__ctrl-input">
                <el-slider v-model="recognizeForm.minSimilarity" :min="0" :max="1" :step="0.05" style="width:140px" />
                <span class="face-library__ctrl-value">{{ (recognizeForm.minSimilarity * 100).toFixed(0) }}%</span>
              </div>
            </label>
            <label class="face-library__ctrl">
              <span class="face-library__ctrl-label">分组</span>
              <div class="face-library__ctrl-input">
                <select v-model="recognizeForm.group" class="face-library__settings-select" style="max-width:140px">
                  <option value="">全部</option>
                  <option v-for="g in groupOptions" :key="g.sysAiFaceGroupId" :value="g.sysAiFaceGroupName">
                    {{ g.sysAiFaceGroupName }}
                  </option>
                </select>
              </div>
            </label>
            <button
              class="face-library__btn face-library__btn--primary face-library__btn--lg"
              :disabled="!recognizePreview || recognizing"
              @click="handleRecognize"
            >
              <IconifyIconOnline v-if="recognizing" icon="ri:loader-4-line" class="face-library__spinner" />
              <IconifyIconOnline v-else icon="ri:search-eye-line" />
              <span>{{ recognizing ? '识别中...' : '开始识别' }}</span>
            </button>
          </div>
        </div>

        <div class="face-library__recognize-right">
          <div v-if="recognizeResults.length > 0" class="face-library__results">
            <h3 class="face-library__results-title">识别结果</h3>
            <div
              v-for="(r, idx) in recognizeResults"
              :key="'r-' + idx"
              class="face-library__result-card face-library__result-card--blur-in"
              :style="{ animationDelay: (idx * 0.2) + 's' }"
            >
              <div class="face-library__result-avatar">
                <img v-if="r.thumbnail" :src="r.thumbnail" alt="" />
                <IconifyIconOnline v-else icon="ri:user-smile-line" />
              </div>
              <div class="face-library__result-info">
                <div class="face-library__result-name">{{ r.name }}</div>
                <div v-if="r.fullName" class="face-library__result-sub">{{ r.fullName }}</div>
                <div v-if="r.idCard" class="face-library__result-sub">{{ r.idCard }}</div>
                <div v-if="r.group" class="face-library__result-sub">分组：{{ r.group }}</div>
                <div class="face-library__result-bar">
                  <div
                    class="face-library__result-bar-fill"
                    :class="scoreColor(r.similarity)"
                    :style="{ width: (r.similarity * 100) + '%' }"
                  />
                </div>
              </div>
              <div class="face-library__result-score" :class="scoreColor(r.similarity)">
                {{ (r.similarity * 100).toFixed(1) }}<small>%</small>
              </div>
            </div>
          </div>
          <div v-else-if="recognizedOnce" class="face-library__no-match">
            <IconifyIconOnline icon="ri:emotion-sad-line" />
            <p>未匹配到已知人脸</p>
          </div>
          <div v-else class="face-library__results-idle">
            <IconifyIconOnline icon="ri:search-eye-line" />
            <p>上传图片后点击识别</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Tab: Records ────────────────────────── -->
    <section v-if="activeTab === 'records'" class="face-library__panel face-library__records-panel">
      <div class="face-library__records-head">
        <h3>识别记录</h3>
        <span class="face-library__records-count">共 {{ recordsTotal }} 条</span>
      </div>

      <div v-if="records.length === 0" class="face-library__empty">
        <div class="face-library__empty-icon">
          <IconifyIconOnline icon="ri:file-list-3-line" />
        </div>
        <p class="face-library__empty-text">暂无识别记录</p>
      </div>

      <div v-else class="face-library__records-list">
        <div
          v-for="r in records"
          :key="r.sysAiFaceRecognizeRecordId"
          class="face-library__record-card"
          @click="openRecordDetail(r)"
        >
          <div class="face-library__record-thumb">
            <img v-if="r.sysAiFaceRecognizeRecordThumbnail" :src="r.sysAiFaceRecognizeRecordThumbnail" alt="" />
            <IconifyIconOnline v-else icon="ri:image-line" />
          </div>
          <div class="face-library__record-body">
            <div class="face-library__record-stats">
              <span class="face-library__record-stat">
                <IconifyIconOnline icon="ri:user-smile-line" />人脸 {{ r.sysAiFaceRecognizeRecordFaceCount }}
              </span>
              <span class="face-library__record-stat" :class="r.sysAiFaceRecognizeRecordMatchCount > 0 ? 'text-success' : 'text-muted'">
                <IconifyIconOnline icon="ri:check-line" />匹配 {{ r.sysAiFaceRecognizeRecordMatchCount }}
              </span>
              <span class="face-library__record-stat">
                <IconifyIconOnline icon="ri:timer-line" />{{ r.sysAiFaceRecognizeRecordCost }}ms
              </span>
              <span v-if="r.sysAiFaceRecognizeRecordGroup" class="face-library__record-stat">
                <IconifyIconOnline icon="ri:folder-line" />{{ r.sysAiFaceRecognizeRecordGroup }}
              </span>
            </div>
            <div class="face-library__record-time">{{ r.createTime || '' }}</div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="recordsTotal > pageSize" class="face-library__records-pagination">
        <button class="face-library__btn face-library__btn--sm" :disabled="currentPage <= 1" @click="loadRecords(currentPage - 1)">
          <IconifyIconOnline icon="ri:arrow-left-s-line" />上一页
        </button>
        <span class="face-library__records-page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="face-library__btn face-library__btn--sm" :disabled="currentPage >= totalPages" @click="loadRecords(currentPage + 1)">
          下一页<IconifyIconOnline icon="ri:arrow-right-s-line" />
        </button>
      </div>
    </section>

    <!-- ─── Group Management Dialog ─────────────────── -->
    <div v-if="showGroupManager" class="face-library__overlay" @click.self="closeGroupManager">
      <div class="face-library__dialog face-library__dialog--lg">
        <div class="face-library__dialog-head">
          <h3>管理分组</h3>
          <button class="face-library__dialog-close" @click="closeGroupManager">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </div>

        <div class="face-library__dialog-body">
          <div class="face-library__group-mgr-toolbar">
            <button class="face-library__btn face-library__btn--primary" @click="openCreateGroup">
              <IconifyIconOnline icon="ri:add-line" />
              <span>新增分组</span>
            </button>
          </div>

          <!-- Group form -->
          <div v-if="groupFormVisible" class="face-library__group-mgr-form">
            <label class="face-library__form-field">
              <span class="face-library__form-label">名称 <em>*</em></span>
              <input v-model="groupForm.name" class="face-library__form-input" placeholder="输入分组名称" />
            </label>
            <label class="face-library__form-field">
              <span class="face-library__form-label">排序</span>
              <el-input-number v-model="groupForm.sort" :min="0" :max="999" size="small" style="width:120px" />
            </label>
            <label class="face-library__form-field">
              <span class="face-library__form-label">备注</span>
              <input v-model="groupForm.remark" class="face-library__form-input" placeholder="可选备注" />
            </label>
            <div class="face-library__group-mgr-form-actions">
              <button class="face-library__btn" @click="groupFormVisible = false">取消</button>
              <button class="face-library__btn face-library__btn--primary" :disabled="savingGroup" @click="handleSaveGroup">
                <IconifyIconOnline v-if="savingGroup" icon="ri:loader-4-line" class="face-library__spinner" />
                <span>{{ savingGroup ? '保存中...' : '保存' }}</span>
              </button>
            </div>
          </div>

          <!-- Group table -->
          <div class="face-library__group-mgr-table-wrap">
            <table class="face-library__group-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>排序</th>
                  <th>备注</th>
                  <th style="width:120px">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="g in groupList" :key="g.sysAiFaceGroupId">
                  <td>{{ g.sysAiFaceGroupName }}</td>
                  <td>{{ g.sysAiFaceGroupSort }}</td>
                  <td class="face-library__group-table-remark">{{ g.sysAiFaceGroupRemark || '-' }}</td>
                  <td>
                    <button class="face-library__card-btn" title="编辑" @click="openEditGroup(g)">
                      <IconifyIconOnline icon="ri:edit-line" />
                    </button>
                    <button class="face-library__card-btn face-library__card-btn--danger" title="删除" @click="handleDeleteGroup(g)">
                      <IconifyIconOnline icon="ri:delete-bin-line" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Tab: Settings ─────────────────────────── -->
    <section v-if="activeTab === 'settings'" class="face-library__panel face-library__settings-panel">
      <div class="face-library__settings-head">
        <h3>全局识别设置</h3>
        <p>配置人脸检测、特征提取等默认模型，修改后影响后续注册和识别</p>
      </div>

      <div class="face-library__settings-body">
        <div class="face-library__settings-group">
          <h4 class="face-library__settings-group-title">模型配置</h4>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">人脸检测模型</span>
            <div class="face-library__settings-control">
              <select v-model="settings.defaultFaceDetectModel" class="face-library__settings-select">
                <option value="">请选择</option>
                <option v-for="m in detectModules" :key="m.sysAiModuleCode" :value="m.sysAiModuleCode">
                  {{ m.sysAiModuleName || m.sysAiModuleCode }}
                </option>
              </select>
            </div>
          </label>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">特征提取模型</span>
            <div class="face-library__settings-control">
              <select v-model="settings.defaultFaceFeatureModel" class="face-library__settings-select">
                <option value="">请选择</option>
                <option v-for="m in featureModules" :key="m.sysAiModuleCode" :value="m.sysAiModuleCode">
                  {{ m.sysAiModuleName || m.sysAiModuleCode }}
                </option>
              </select>
              <p class="face-library__settings-warn">
                <IconifyIconOnline icon="ri:alert-line" /> 更换特征模型会导致已有向量特征无法匹配，需重新注册所有人脸
              </p>
            </div>
          </label>

          <div class="face-library__settings-field">
            <span class="face-library__settings-label">人脸增强</span>
            <div class="face-library__settings-control">
              <label class="face-library__settings-switch">
                <input v-model="settings.faceEnhanceEnabled" type="checkbox" />
                <span class="face-library__settings-switch-track">
                  <span class="face-library__settings-switch-thumb" />
                </span>
                <span>{{ settings.faceEnhanceEnabled ? '已开启' : '已关闭' }}</span>
              </label>
            </div>
          </div>

          <div class="face-library__settings-field">
            <span class="face-library__settings-label">动漫人脸过滤</span>
            <div class="face-library__settings-control">
              <label class="face-library__settings-switch">
                <input v-model="settings.animationFaceFilterEnabled" type="checkbox" />
                <span class="face-library__settings-switch-track">
                  <span class="face-library__settings-switch-thumb" />
                </span>
                <span>{{ settings.animationFaceFilterEnabled ? '已开启' : '已关闭' }}</span>
              </label>
              <p class="face-library__settings-hint">开启后可防止动漫/插画图片通过人脸识别</p>
            </div>
          </div>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">动漫检测模型</span>
            <div class="face-library__settings-control">
              <select v-model="settings.animeFaceDetectModel" class="face-library__settings-select">
                <option value="">自动查找</option>
                <option v-for="m in animeModules" :key="m.sysAiModuleCode" :value="m.sysAiModuleCode">
                  {{ m.sysAiModuleName || m.sysAiModuleCode }}
                </option>
              </select>
              <p class="face-library__settings-hint">留空则自动查找可用的动漫分类模型</p>
            </div>
          </label>

          <label v-if="settings.faceEnhanceEnabled" class="face-library__settings-field">
            <span class="face-library__settings-label">增强模型</span>
            <div class="face-library__settings-control">
              <select v-model="settings.defaultFaceEnhanceModel" class="face-library__settings-select">
                <option value="">请选择</option>
                <option v-for="m in enhanceModules" :key="m.sysAiModuleCode" :value="m.sysAiModuleCode">
                  {{ m.sysAiModuleName || m.sysAiModuleCode }}
                </option>
              </select>
            </div>
          </label>
        </div>

        <div class="face-library__settings-group">
          <h4 class="face-library__settings-group-title">参数配置</h4>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">向量存储引擎</span>
            <div class="face-library__settings-control">
              <select v-model="settings.vectorStorageEngine" class="face-library__settings-select">
                <option value="jvector">JVector - 本地内存向量引擎</option>
                <option value="milvus">Milvus - 高性能分布式向量数据库</option>
                <option value="pinecone">Pinecone - 云端向量数据库服务</option>
                <option value="qdrant">Qdrant - 向量相似度搜索引擎</option>
                <option value="weaviate">Weaviate - 开源向量数据库</option>
                <option value="elasticsearch">Elasticsearch - 全文与向量混合搜索</option>
              </select>
            </div>
          </label>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">特征维度</span>
            <div class="face-library__settings-control">
              <el-input-number v-model="settings.featureDimension" :min="128" :max="2048" :step="128" style="width:120px" />
              <p class="face-library__settings-hint">必须与特征提取模型的输出维度一致</p>
            </div>
          </label>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">最低相似度</span>
            <div class="face-library__settings-control face-library__settings-control--inline">
              <el-slider v-model="settings.minSimilarity" :min="0" :max="1" :step="0.01" style="width:200px" />
              <span class="face-library__settings-value">{{ (settings.minSimilarity * 100).toFixed(0) }}%</span>
            </div>
          </label>
        </div>
      </div>

      <div class="face-library__settings-foot">
        <div class="face-library__settings-foot-info">
          <IconifyIconOnline icon="ri:information-line" />
          <span>设置自动保存在数据库中，对所有用户生效</span>
        </div>
        <button
          class="face-library__btn face-library__btn--primary"
          :disabled="savingSettings"
          @click="handleSaveSettings"
        >
          <IconifyIconOnline v-if="savingSettings" icon="ri:loader-4-line" class="face-library__spinner" />
          <span>{{ savingSettings ? '保存中...' : '保存设置' }}</span>
        </button>
      </div>
    </section>

    <!-- ─── Record Detail Dialog ─────────────────── -->
    <div v-if="showRecordDetail" class="face-library__overlay" @click.self="closeRecordDetail">
      <div class="face-library__dialog face-library__dialog--lg">
        <div class="face-library__dialog-head">
          <h3>识别记录详情</h3>
          <button class="face-library__dialog-close" @click="closeRecordDetail">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </div>

        <div class="face-library__dialog-body">
          <div class="face-library__record-detail-thumb">
            <img v-if="recordDetail?.sysAiFaceRecognizeRecordThumbnail" :src="recordDetail?.sysAiFaceRecognizeRecordThumbnail" alt="" />
            <IconifyIconOnline v-else icon="ri:image-line" />
          </div>

          <div class="face-library__dialog-meta">
            <div class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">检测人脸数</span>
              <span class="face-library__dialog-meta-value">{{ recordDetail?.sysAiFaceRecognizeRecordFaceCount ?? '-' }}</span>
            </div>
            <div class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">匹配数</span>
              <span class="face-library__dialog-meta-value">{{ recordDetail?.sysAiFaceRecognizeRecordMatchCount ?? '-' }}</span>
            </div>
            <div class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">分组</span>
              <span class="face-library__dialog-meta-value">{{ recordDetail?.sysAiFaceRecognizeRecordGroup || '全部' }}</span>
            </div>
            <div class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">耗时</span>
              <span class="face-library__dialog-meta-value">{{ recordDetail?.sysAiFaceRecognizeRecordCost || '-' }} ms</span>
            </div>
            <div class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">时间</span>
              <span class="face-library__dialog-meta-value">{{ recordDetail?.createTime || '-' }}</span>
            </div>
          </div>

          <template v-if="parsedResults.length > 0">
            <h4 style="font-size:14px;font-weight:700;margin:8px 0;color:var(--el-text-color-primary)">匹配结果</h4>
            <div
              v-for="(res, idx) in parsedResults"
              :key="'rd-' + idx"
              class="face-library__result-card"
            >
              <div class="face-library__result-avatar">
                <img v-if="res.thumbnail" :src="res.thumbnail" alt="" />
                <IconifyIconOnline v-else icon="ri:user-smile-line" />
              </div>
              <div class="face-library__result-info">
                <div class="face-library__result-name">{{ res.name }}</div>
                <div v-if="res.fullName" class="face-library__result-sub">{{ res.fullName }}</div>
                <div v-if="res.idCard" class="face-library__result-sub">{{ res.idCard }}</div>
                <div v-if="res.group" class="face-library__result-sub">分组：{{ res.group }}</div>
                <div class="face-library__result-bar">
                  <div
                    class="face-library__result-bar-fill"
                    :class="scoreColor(res.similarity)"
                    :style="{ width: (res.similarity * 100) + '%' }"
                  />
                </div>
              </div>
              <div class="face-library__result-score" :class="scoreColor(res.similarity)">
                {{ (res.similarity * 100).toFixed(1) }}<small>%</small>
              </div>
            </div>
          </template>

          <div v-else-if="recordDetail && recordDetail.sysAiFaceRecognizeRecordFaceCount > 0" class="face-library__no-match" style="padding:20px 0">
            <IconifyIconOnline icon="ri:emotion-sad-line" />
            <p>未匹配到已知人脸</p>
          </div>
        </div>

        <div class="face-library__dialog-foot">
          <button class="face-library__btn" @click="closeRecordDetail">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElInputNumber, ElMessageBox, ElSlider } from "element-plus";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { message } from "@repo/utils";
import { listFaceLibrary, registerFace, deleteFace, recognizeFace, getFaceDetail, updateFace, listFaceGroups, createFaceGroup, updateFaceGroup, deleteFaceGroup, getFaceGroupOptions, listRecognizeRecords, getRecognizeRecordDetail, type FaceLibraryItem, type FaceRecognizeResult, type FaceGroupItem, type RecognizeRecordItem } from "../../../api/ai/face-library";
import { listAiGlobalSettings, replaceAiGlobalSettings } from "../../../api/ai/global-setting";
import { listAiModules, type AiModule } from "../../../api/ai/module";

// ── Tabs ────────────────────────────────────────
const tabs = [
  { key: "recognize", label: "人脸识别", icon: "ri:search-eye-line" },
  { key: "list", label: "人脸库", icon: "ri:user-smile-line" },
  { key: "register", label: "注册人脸", icon: "ri:user-add-line" },
  { key: "records", label: "识别记录", icon: "ri:file-list-3-line" },
  { key: "settings", label: "控制设置", icon: "ri:settings-3-line" },
];
const activeTab = ref("recognize");

// ── Router ──────────────────────────────────────
const router = useRouter();

// ── Face list ───────────────────────────────────
const faceList = ref<FaceLibraryItem[]>([]);
const deletingId = ref<number | null>(null);

// ── Group ──────────────────────────────────────
const groupOptions = ref<FaceGroupItem[]>([]);
const selectedGroup = ref("");
const showGroupManager = ref(false);
const groupList = ref<FaceGroupItem[]>([]);
const groupForm = reactive({ id: 0, name: "", sort: 0, remark: "" });
const groupFormVisible = ref(false);
const editingGroupId = ref<number | null>(null);
const savingGroup = ref(false);

const openGroupManager = async () => {
  showGroupManager.value = true;
  openCreateGroup();
  await loadGroupList();
};

const closeGroupManager = () => {
  showGroupManager.value = false;
  groupFormVisible.value = false;
};

const loadGroupOptions = async () => {
  try {
    const res = await getFaceGroupOptions();
    groupOptions.value = res.data || [];
  } catch { /* ignore */ }
};

const loadGroupList = async () => {
  try {
    const res = await listFaceGroups();
    groupList.value = res.data || [];
  } catch { /* ignore */ }
};

const openCreateGroup = () => {
  editingGroupId.value = null;
  groupForm.id = 0;
  groupForm.name = "";
  groupForm.sort = 0;
  groupForm.remark = "";
  groupFormVisible.value = true;
};

const openEditGroup = (item: FaceGroupItem) => {
  editingGroupId.value = item.sysAiFaceGroupId;
  groupForm.id = item.sysAiFaceGroupId;
  groupForm.name = item.sysAiFaceGroupName;
  groupForm.sort = item.sysAiFaceGroupSort;
  groupForm.remark = item.sysAiFaceGroupRemark || "";
  groupFormVisible.value = true;
};

const handleSaveGroup = async () => {
  if (!groupForm.name) {
    message("分组名称不能为空", { type: "warning" });
    return;
  }
  savingGroup.value = true;
  try {
    if (editingGroupId.value) {
      await updateFaceGroup({ id: editingGroupId.value, name: groupForm.name, sort: groupForm.sort, remark: groupForm.remark });
      message("更新成功", { type: "success" });
    } else {
      await createFaceGroup({ name: groupForm.name, sort: groupForm.sort, remark: groupForm.remark });
      message("创建成功", { type: "success" });
    }
    openCreateGroup();
    await Promise.all([loadGroupList(), loadGroupOptions()]);
  } catch (e: any) {
    message(e?.message || "操作失败", { type: "error" });
  } finally {
    savingGroup.value = false;
  }
};

const handleDeleteGroup = async (item: FaceGroupItem) => {
  if (item.sysAiFaceGroupName === "default") {
    message("默认分组不可删除", { type: "warning" });
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除分组「${item.sysAiFaceGroupName}」？该分组下的人脸将自动移至 default 分组。`,
      "提示",
      { type: "warning" }
    );
  } catch {
    return;
  }
  try {
    await deleteFaceGroup(item.sysAiFaceGroupId);
    message("删除成功", { type: "success" });
    await Promise.all([loadGroupList(), loadGroupOptions(), loadFaceList()]);
  } catch (e: any) {
    message(e?.message || "删除失败", { type: "error" });
  }
};

const handleGroupChange = () => {
  loadFaceList();
};

const loadFaceList = async () => {
  const res = await listFaceLibrary(selectedGroup.value || undefined);
  faceList.value = res.data || [];
};

const handleDelete = async (item: FaceLibraryItem) => {
  try {
    await ElMessageBox.confirm(`确认删除「${item.sysAiFaceLibraryName}」？`, "提示", { type: "warning" });
  } catch {
    return;
  }
  deletingId.value = item.sysAiFaceLibraryId;
  try {
    await deleteFace(item.sysAiFaceLibraryId);
    message("删除成功", { type: "success" });
    await loadFaceList();
  } catch (e: any) {
    message(e?.message || "删除失败", { type: "error" });
  } finally {
    deletingId.value = null;
  }
};

// ── Detail dialog ──────────────────────────────
const showDetail = ref(false);
const editing = ref(false);
const savingDetail = ref(false);
const detailItem = ref<FaceLibraryItem>({} as FaceLibraryItem);
const detailForm = reactive({ name: "", fullName: "", idCard: "", group: "" });

const handleCardClick = async (item: FaceLibraryItem) => {
  try {
    const res = await getFaceDetail(item.sysAiFaceLibraryId);
    const data = res.data as FaceLibraryItem;
    if (!data) return;
    detailItem.value = data;
    detailForm.name = data.sysAiFaceLibraryName || "";
    detailForm.fullName = data.sysAiFaceLibraryFullName || "";
    detailForm.idCard = data.sysAiFaceLibraryIdCard || "";
    detailForm.group = data.sysAiFaceLibraryGroup || "";
    editing.value = false;
    showDetail.value = true;
  } catch (e: any) {
    message(e?.message || "获取详情失败", { type: "error" });
  }
};

const closeDetail = () => {
  showDetail.value = false;
  editing.value = false;
};

const cancelEdit = () => {
  const data = detailItem.value;
  detailForm.name = data.sysAiFaceLibraryName || "";
  detailForm.fullName = data.sysAiFaceLibraryFullName || "";
  detailForm.idCard = data.sysAiFaceLibraryIdCard || "";
  detailForm.group = data.sysAiFaceLibraryGroup || "";
  editing.value = false;
};

const handleSaveDetail = async () => {
  if (!detailForm.name || !detailForm.idCard) {
    message("名称和身份证号为必填项", { type: "warning" });
    return;
  }
  savingDetail.value = true;
  try {
    await updateFace({
      id: detailItem.value.sysAiFaceLibraryId,
      name: detailForm.name,
      fullName: detailForm.fullName || undefined,
      idCard: detailForm.idCard,
      group: detailForm.group || undefined,
    });
    message("更新成功", { type: "success" });
    showDetail.value = false;
    editing.value = false;
    await loadFaceList();
  } catch (e: any) {
    message(e?.message || "更新失败", { type: "error" });
  } finally {
    savingDetail.value = false;
  }
};

// ── File upload ─────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const registerPreview = ref("");
const recognizePreview = ref("");

const openFilePicker = () => fileInputRef.value?.click();

const handleFilePick = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) applyFile(file);
  (e.target as HTMLInputElement).value = "";
};

const handleDrop = (e: DragEvent) => {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) applyFile(file);
};

const applyFile = async (file: File) => {
  if (!file.type.startsWith("image/")) {
    message("请选择图片文件", { type: "warning" });
    return;
  }
  const dataUrl = await readFileAsDataUrl(file);
  if (activeTab.value === "register") {
    registerPreview.value = dataUrl;
    registerForm.image = dataUrl;
  } else {
    recognizePreview.value = dataUrl;
    recognizeForm.image = dataUrl;
  }
};

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Register ────────────────────────────────────
const registering = ref(false);
const idCardError = ref("");
const registerForm = reactive({ name: "", fullName: "", idCard: "", image: "", group: "default" });

const handleRegister = async () => {
  if (!registerForm.name || !registerForm.image || !registerForm.idCard) return;
  registering.value = true;
  idCardError.value = "";
  try {
    await registerFace({
      name: registerForm.name,
      fullName: registerForm.fullName || undefined,
      idCard: registerForm.idCard,
      image: registerForm.image,
      group: registerForm.group || undefined,
    });
    message("注册成功", { type: "success" });
    registerForm.name = "";
    registerForm.fullName = "";
    registerForm.idCard = "";
    registerForm.image = "";
    registerForm.group = "default";
    registerPreview.value = "";
    await loadFaceList();
    activeTab.value = "list";
  } catch (e: any) {
    const msg = e?.message || "注册失败";
    message(msg, { type: "error" });
    if (msg.includes("身份证")) {
      idCardError.value = msg;
    }
  } finally {
    registering.value = false;
  }
};

// ── Recognize ───────────────────────────────────
const recognizing = ref(false);
const recognizedOnce = ref(false);
const recognizeResults = ref<FaceRecognizeResult[]>([]);
const recognizeForm = reactive({ image: "", topK: 5, minSimilarity: 0.5, group: "" });

const handleRecognize = async () => {
  if (!recognizeForm.image) return;
  recognizing.value = true;
  recognizedOnce.value = false;
  recognizeResults.value = [];
  try {
    const res = await recognizeFace({
      image: recognizeForm.image,
      topK: recognizeForm.topK,
      minSimilarity: recognizeForm.minSimilarity,
      group: recognizeForm.group || undefined,
    });
    recognizeResults.value = res.data || [];
    recognizedOnce.value = true;
  } catch (e: any) {
    message(e?.message || "识别失败", { type: "error" });
  } finally {
    recognizing.value = false;
  }
};

const scoreColor = (s: number) => {
  if (s >= 0.8) return "score-high";
  if (s >= 0.5) return "score-mid";
  return "score-low";
};

// ── Records ──────────────────────────────────────
const records = ref<RecognizeRecordItem[]>([]);
const recordsTotal = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = ref(0);
const showRecordDetail = ref(false);
const recordDetail = ref<RecognizeRecordItem | null>(null);
const parsedResults = ref<FaceRecognizeResult[]>([]);

const loadRecords = async (page = 1) => {
  currentPage.value = page;
  try {
    const res = await listRecognizeRecords(page, pageSize.value);
    const data = res.data as any;
    records.value = data?.records || [];
    recordsTotal.value = data?.total || 0;
    const size = pageSize.value;
    totalPages.value = Math.max(1, Math.ceil(recordsTotal.value / size));
  } catch { /* ignore */ }
};

const openRecordDetail = async (item: RecognizeRecordItem) => {
  recordDetail.value = item;
  // Parse the results JSON
  if (item.sysAiFaceRecognizeRecordResult) {
    try {
      parsedResults.value = JSON.parse(item.sysAiFaceRecognizeRecordResult);
    } catch {
      parsedResults.value = [];
    }
  } else {
    parsedResults.value = [];
  }
  showRecordDetail.value = true;
};

const closeRecordDetail = () => {
  showRecordDetail.value = false;
  recordDetail.value = null;
  parsedResults.value = [];
};

// ── Settings ────────────────────────────────────
const savingSettings = ref(false);
const settings = reactive({
  defaultFaceDetectModel: "",
  defaultFaceFeatureModel: "",
  defaultFaceEnhanceModel: "",
  faceEnhanceEnabled: false,
  animationFaceFilterEnabled: true,
  animeFaceDetectModel: "",
  vectorStorageEngine: "jvector",
  featureDimension: 512,
  minSimilarity: 0.5,
});

const detectModules = ref<AiModule[]>([]);
const featureModules = ref<AiModule[]>([]);
const enhanceModules = ref<AiModule[]>([]);
const animeModules = ref<AiModule[]>([]);

const loadModules = async () => {
  try {
    const [detectRes, featureRes, enhanceRes, animeRes] = await Promise.all([
      listAiModules("FACE_DETECT").catch((e) => { console.warn("FACE_DETECT 加载失败", e); return { data: [] }; }),
      listAiModules("FACE_FEATURE").catch((e) => { console.warn("FACE_FEATURE 加载失败", e); return { data: [] }; }),
      listAiModules("FACE").catch((e) => { console.warn("FACE 加载失败", e); return { data: [] }; }),
      listAiModules("CLASSIFICATION").catch((e) => { console.warn("CLASSIFICATION 加载失败", e); return { data: [] }; }),
    ]);
    const toArray = (v: unknown) => (Array.isArray(v) ? v : []);
    detectModules.value = toArray(detectRes.data).filter((m: any) => m.sysAiModuleStatus !== 0);
    featureModules.value = toArray(featureRes.data).filter((m: any) => m.sysAiModuleStatus !== 0);
    enhanceModules.value = toArray(enhanceRes.data).filter((m: any) => m.sysAiModuleStatus !== 0);
    animeModules.value = toArray(animeRes.data).filter((m: any) => m.sysAiModuleStatus !== 0);
  } catch (e) {
    console.warn("模块加载失败", e);
  }
};

const loadSettings = async () => {
  try {
    const res = await listAiGlobalSettings("face_recognition");
    const list = res.data || [];
    const get = (field: string) => list.find((s) => s.sysAiGlobalSettingField === field)?.sysAiGlobalSettingValue;
    settings.defaultFaceDetectModel = get("default_face_detect_model") || "";
    settings.defaultFaceFeatureModel = get("default_face_feature_model") || "";
    settings.defaultFaceEnhanceModel = get("default_face_enhance_model") || "";
    settings.faceEnhanceEnabled = get("face_enhance_enabled") === "true";
    settings.animationFaceFilterEnabled = get("animation_face_filter_enabled") !== "false";
    settings.animeFaceDetectModel = get("anime_face_detect_model") || "";
    settings.vectorStorageEngine = get("vector_storage_engine") || "jvector";
    settings.featureDimension = parseInt(get("feature_dimension") || "512");
    settings.minSimilarity = parseFloat(get("min_similarity") || "0.5");
  } catch {
    // use defaults
  }
};

const handleSaveSettings = async () => {
  savingSettings.value = true;
  try {
    await replaceAiGlobalSettings([
      { sysAiGlobalSettingField: "default_face_detect_model", sysAiGlobalSettingValue: settings.defaultFaceDetectModel, sysAiGlobalSettingValueType: "STRING" },
      { sysAiGlobalSettingField: "default_face_feature_model", sysAiGlobalSettingValue: settings.defaultFaceFeatureModel, sysAiGlobalSettingValueType: "STRING" },
      { sysAiGlobalSettingField: "default_face_enhance_model", sysAiGlobalSettingValue: settings.defaultFaceEnhanceModel, sysAiGlobalSettingValueType: "STRING" },
      { sysAiGlobalSettingField: "face_enhance_enabled", sysAiGlobalSettingValue: String(settings.faceEnhanceEnabled), sysAiGlobalSettingValueType: "BOOLEAN" },
      { sysAiGlobalSettingField: "animation_face_filter_enabled", sysAiGlobalSettingValue: String(settings.animationFaceFilterEnabled), sysAiGlobalSettingValueType: "BOOLEAN" },
      { sysAiGlobalSettingField: "anime_face_detect_model", sysAiGlobalSettingValue: settings.animeFaceDetectModel, sysAiGlobalSettingValueType: "STRING" },
      { sysAiGlobalSettingField: "vector_storage_engine", sysAiGlobalSettingValue: settings.vectorStorageEngine, sysAiGlobalSettingValueType: "STRING" },
      { sysAiGlobalSettingField: "feature_dimension", sysAiGlobalSettingValue: String(settings.featureDimension), sysAiGlobalSettingValueType: "INT" },
      { sysAiGlobalSettingField: "min_similarity", sysAiGlobalSettingValue: String(settings.minSimilarity), sysAiGlobalSettingValueType: "FLOAT" },
    ], "face_recognition");
    message("设置已保存", { type: "success" });
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
  } finally {
    savingSettings.value = false;
  }
};

// ── Init ────────────────────────────────────────
onMounted(async () => {
  await Promise.allSettled([
    loadFaceList(),
    loadModules(),
    loadSettings(),
    loadGroupOptions(),
    loadRecords(),
  ]);
});
</script>

<style scoped lang="scss">
// ── Layout ────────────────────────────────────────
.face-library-workbench {
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
}

// ── Header ────────────────────────────────────────
.face-library__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px 8px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--el-bg-color) 88%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color));
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.face-library__back {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    color: var(--el-color-primary);
  }
}

.face-library__header-body {
  min-width: 0;
}

.face-library__header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
  line-height: 1.3;
}

.face-library__header-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin: 0;
  line-height: 1.3;
}

// ── Nav ────────────────────────────────────────────
.face-library__nav {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.face-library__nav-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color));
    color: var(--el-color-primary);
    box-shadow: inset 0 -1px 0 color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  }

  :deep(svg) { font-size: 16px; }
}

// ── Panel ──────────────────────────────────────────
.face-library__panel {
  flex: 1;
  min-height: 0;
  background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary));
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 14%, var(--el-border-color));
  padding: 18px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

// ── List panel ─────────────────────────────────────
.face-library__list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.face-library__list-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

// ── Empty state ────────────────────────────────────
.face-library__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--el-text-color-secondary);
}

.face-library__empty-icon {
  font-size: 52px;
  opacity: 0.25;
}

.face-library__empty-text {
  font-size: 15px;
  margin: 0;
}

// ── Card grid ──────────────────────────────────────
.face-library__card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.face-library__card {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  overflow: hidden;
  transition: transform 0.18s, box-shadow 0.18s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }
}

.face-library__card-img {
  height: 150px;
  background: #0f172a;
  display: grid;
  place-items: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s;
  }

  &:hover img { transform: scale(1.05); }

  :deep(svg) {
    font-size: 40px;
    opacity: 0.25;
  }
}

.face-library__card-body {
  padding: 10px 12px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.face-library__card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.face-library__card-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 3px;
  :deep(svg) { font-size: 12px; }
}

.face-library__card-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.face-library__card-actions {
  padding: 6px 12px 10px;
  display: flex;
  justify-content: flex-end;
}

.face-library__card-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.15s;
  background: transparent;
  color: var(--el-text-color-secondary);

  &:hover {
    background: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
    color: var(--el-color-danger);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

// ── Upload zone ────────────────────────────────────
.face-library__upload-zone {
  position: relative;
  min-height: 200px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: 1px dashed color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  transition: border-color 0.18s, background 0.18s;
  overflow: hidden;

  &.is-dragging {
    border-color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-bg-color) 84%, var(--el-color-primary));
  }

  &.is-filled {
    border-style: solid;
    background: #0f172a;
  }
}

.face-library__upload-zone--compact {
  min-height: 160px;
  max-height: 260px;
}

.face-library__file-input { display: none; }

.face-library__upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  pointer-events: none;
}

.face-library__upload-plus {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 28px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--el-color-primary) 80%, #0f172a),
    color-mix(in srgb, var(--el-color-info) 78%, #0f172a));
  color: #e8f3ff;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.face-library__upload-preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0f172a;
}

// ── Form ───────────────────────────────────────────
.face-library__form-panel {
  overflow: auto;
}

.face-library__form-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 800px;
  flex: 1;
  align-content: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.face-library__form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
}

.face-library__form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.face-library__form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  em {
    color: var(--el-color-danger);
    font-style: normal;
  }
}

.face-library__form-input {
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: var(--el-color-primary);
  }

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.face-library__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

// ── Buttons ────────────────────────────────────────
.face-library__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: #fff;
    &:hover { background: var(--el-color-primary-light-3); }
  }

  &--lg {
    padding: 9px 20px;
    font-size: 14px;
  }
}

.face-library__spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── Recognize layout ───────────────────────────────
.face-library__recognize-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.face-library__recognize-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.face-library__recognize-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.face-library__ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
}

.face-library__ctrl-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  min-width: 90px;
  flex-shrink: 0;
}

.face-library__ctrl-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.face-library__ctrl-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  min-width: 40px;
}

.face-library__recognize-right {
  min-height: 0;
  overflow: auto;
}

// ── Results ────────────────────────────────────────
.face-library__results-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--el-text-color-primary);
}

.face-library__results-idle,
.face-library__no-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  min-height: 200px;
  color: var(--el-text-color-secondary);
  font-size: 14px;

  :deep(svg) {
    font-size: 40px;
    opacity: 0.25;
  }

  p { margin: 0; }
}

.face-library__result-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
  margin-bottom: 8px;
  transition: background 0.15s;
  &:hover { background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary)); }
}

.face-library__result-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #0f172a;
  display: grid;
  place-items: center;

  img { width: 100%; height: 100%; object-fit: contain; }
  :deep(svg) { font-size: 24px; opacity: 0.3; }
}

.face-library__result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.face-library__result-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.face-library__result-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.face-library__result-bar {
  height: 5px;
  background: color-mix(in srgb, var(--el-border-color) 40%, transparent);
  border-radius: 3px;
  overflow: hidden;
}

.face-library__result-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
  &.score-high { background: linear-gradient(90deg, #34d399, #10b981); }
  &.score-mid { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  &.score-low { background: linear-gradient(90deg, #f87171, #ef4444); }
}

.face-library__result-score {
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  min-width: 60px;
  text-align: right;

  small { font-size: 12px; font-weight: 500; }
  &.score-high { color: #34d399; }
  &.score-mid { color: #fbbf24; }
  &.score-low { color: #f87171; }
}

// ── Settings panel ─────────────────────────────────
.face-library__settings-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.face-library__settings-head {
  flex-shrink: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  margin-bottom: 18px;

  h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.face-library__settings-body {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.face-library__settings-group {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  border-radius: 10px;
  padding: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary));
}

.face-library__settings-group-title {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
}

.face-library__settings-field {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  }
}

.face-library__settings-label {
  min-width: 110px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding-top: 6px;
  flex-shrink: 0;
}

.face-library__settings-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--inline {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
}

.face-library__settings-select {
  height: 36px;
  padding: 0 30px 0 12px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239399b4'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 18px;
  max-width: 360px;
  transition: border-color 0.15s;

  &:focus { border-color: var(--el-color-primary); }
}

.face-library__settings-switch {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;

  input { display: none; }

  .face-library__settings-switch-track {
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: color-mix(in srgb, var(--el-border-color) 60%, transparent);
    position: relative;
    transition: background 0.2s;
  }

  .face-library__settings-switch-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  }

  input:checked + .face-library__settings-switch-track {
    background: var(--el-color-primary);
    .face-library__settings-switch-thumb { transform: translateX(18px); }
  }
}

.face-library__settings-warn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--el-color-warning);
  line-height: 1.4;

  :deep(svg) { font-size: 13px; flex-shrink: 0; }
}

.face-library__settings-hint {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.face-library__settings-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
  min-width: 40px;
}

.face-library__settings-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  margin-top: 18px;
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
}

.face-library__settings-foot-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  :deep(svg) { font-size: 15px; }
}

// ── Field error ────────────────────────────────────
.face-library__field-error {
  font-size: 11px;
  color: var(--el-color-danger);
  margin-top: 2px;
  line-height: 1.3;
}

// ── Dialog overlay ─────────────────────────────────
.face-library__overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, #000 45%, transparent);
  backdrop-filter: blur(4px);
  animation: dialogFadeIn 0.18s ease;
}

@keyframes dialogFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.face-library__dialog {
  width: 480px;
  max-width: 92vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialogSlideIn 0.2s ease;
  overflow: hidden;
}

@keyframes dialogSlideIn {
  from { transform: translateY(20px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.face-library__dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.face-library__dialog-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    color: var(--el-text-color-primary);
  }
}

.face-library__dialog-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.face-library__dialog-avatar {
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  display: grid;
  place-items: center;
  align-self: center;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  :deep(svg) {
    font-size: 48px;
    opacity: 0.2;
  }
}

.face-library__dialog-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.face-library__dialog-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-fill-color) 60%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  margin-top: 4px;
}

.face-library__dialog-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.face-library__dialog-meta-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.face-library__dialog-meta-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  word-break: break-all;
  font-family: ui-monospace, monospace;
}

.face-library__dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

// ── Blur-in animation for recognize results ────────
.face-library__result-card--blur-in {
  animation: blurIn 0.6s ease both;
}

@keyframes blurIn {
  from {
    filter: blur(8px);
    opacity: 0.2;
    transform: translateY(6px);
  }
  to {
    filter: blur(0);
    opacity: 1;
    transform: translateY(0);
  }
}

// ── Group bar ───────────────────────────────────────
.face-library__group-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 2px;
  flex-shrink: 0;
}

.face-library__group-select {
  display: flex;
  align-items: center;
  gap: 6px;
}

.face-library__group-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.face-library__group-select-input {
  height: 32px;
  padding: 0 28px 0 10px;
  border-radius: 7px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239399b4'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  min-width: 140px;

  &:focus {
    border-color: var(--el-color-primary);
  }
}

.face-library__btn--sm {
  padding: 5px 12px;
  font-size: 12px;
}

// ── Group manager ───────────────────────────────────
.face-library__dialog--lg {
  width: 640px;
}

.face-library__group-mgr-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.face-library__group-mgr-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-fill-color) 50%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  margin-bottom: 14px;
}

.face-library__group-mgr-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.face-library__group-mgr-table-wrap {
  overflow: auto;
}

.face-library__group-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  th, td {
    text-align: left;
    padding: 10px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  th {
    font-weight: 600;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    white-space: nowrap;
  }

  td {
    color: var(--el-text-color-primary);
  }

  tbody tr:hover {
    background: color-mix(in srgb, var(--el-fill-color) 40%, transparent);
  }
}

.face-library__group-table-remark {
  color: var(--el-text-color-secondary) !important;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.face-library__card-btn--danger {
  &:hover {
    background: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
    color: var(--el-color-danger);
  }
}

// ── Records panel ───────────────────────────────────
.face-library__records-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.face-library__records-head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  margin-bottom: 14px;

  h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.face-library__records-count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.face-library__records-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.face-library__record-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary));
  }
}

.face-library__record-thumb {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #0f172a;
  display: grid;
  place-items: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  :deep(svg) {
    font-size: 24px;
    opacity: 0.3;
  }
}

.face-library__record-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.face-library__record-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.face-library__record-stat {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;

  :deep(svg) { font-size: 13px; }

  &.text-success { color: var(--el-color-success); }
  &.text-muted { color: var(--el-text-color-placeholder); }
}

.face-library__record-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.face-library__records-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  flex-shrink: 0;
}

.face-library__records-page-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 60px;
  text-align: center;
}

.face-library__record-detail-thumb {
  width: 160px;
  height: 160px;
  border-radius: 10px;
  overflow: hidden;
  background: #0f172a;
  display: grid;
  place-items: center;
  align-self: center;
  border: 1px solid var(--el-border-color-lighter);

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  :deep(svg) {
    font-size: 40px;
    opacity: 0.2;
  }
}

.face-library__record-detail-title {
  font-size: 14px;
  font-weight: 700;
  margin: 8px 0;
  color: var(--el-text-color-primary);
}

// ── Responsive ─────────────────────────────────────
@media (max-width: 640px) {
  .face-library__nav-item span { display: none; }
  .face-library__recognize-layout { grid-template-columns: 1fr; }
}
</style>
