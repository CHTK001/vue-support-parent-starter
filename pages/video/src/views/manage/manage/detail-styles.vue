<style scoped>
/* 全局容器样式 */
.video-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow-x: hidden;
}

/* 页面头部样式 */
.detail-header {
  position: relative;
  padding: 30px 0;
  margin-bottom: 30px;
}

.header-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%);
  backdrop-filter: blur(10px);
}

.header-content {
  position: relative;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.header-title {
  flex: 1;
}

.detail-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  line-height: 1.2;
}

.title-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 5px;
  font-weight: 500;
}

/* 主要内容区域 */
.detail-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px;
  display: flex;
  gap: 40px;
  align-items: flex-start;
}

/* 海报区域样式 */
.poster-section {
  flex-shrink: 0;
  width: 320px;
}

.poster-wrapper {
  margin-bottom: 25px;
}

.poster-container {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.poster-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
}

.poster-image {
  width: 100%;
  height: 450px;
  object-fit: cover;
}

.poster-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
}

.no-poster {
  width: 100%;
  height: 450px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #6c757d;
  font-size: 16px;
  font-weight: 500;
}

.no-poster-icon {
  font-size: 48px;
  margin-bottom: 10px;
  opacity: 0.6;
}

/* 操作按钮样式 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.primary-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
}

.play-btn {
  background: linear-gradient(135deg, #56ab2f 0%, #a8e6cf 100%);
  border: none;
  box-shadow: 0 8px 20px rgba(86, 171, 47, 0.3);
}

.play-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(86, 171, 47, 0.4);
}

/* 信息区域样式 */
.info-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.info-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f8f9fa;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
}

.section-title h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
}

.title-icon {
  font-size: 24px;
  color: #667eea;
}

/* 评分区域样式 */
.ratings-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.score-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #ffd700 0%, #ffb347 100%);
  color: white;
  padding: 8px 16px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.star-icon {
  font-size: 18px;
}

.score-value {
  font-size: 18px;
  font-weight: 800;
}

.score-text {
  font-size: 14px;
  opacity: 0.9;
}

.external-ratings {
  display: flex;
  gap: 12px;
}

.rating-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  min-width: 70px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.rating-item.douban {
  background: linear-gradient(135deg, #00b51d 0%, #00a01a 100%);
  color: white;
}

.rating-item.imdb {
  background: linear-gradient(135deg, #f5c518 0%, #e6b800 100%);
  color: #000;
}

.rating-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.rating-name {
  font-weight: 700;
  margin-bottom: 3px;
}

.rating-score {
  font-size: 16px;
  font-weight: 800;
}

.rating-count {
  font-size: 10px;
  opacity: 0.8;
  margin-top: 2px;
}

/* 信息网格样式 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item:hover {
  background: rgba(102, 126, 234, 0.02);
  border-radius: 8px;
  padding: 15px;
  margin: 0 -15px;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #495057;
  min-width: 100px;
  margin-right: 20px;
}

.item-icon {
  font-size: 16px;
  color: #667eea;
}

.item-value {
  flex: 1;
  color: #2c3e50;
  font-weight: 500;
}

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.type-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.director-name,
.actor-name {
  font-weight: 600;
  color: #2c3e50;
}

/* 剧情简介样式 */
.plot-summary {
  line-height: 1.8;
  color: #495057;
  font-size: 15px;
}

.plot-text {
  margin: 0;
  text-align: justify;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 30px;
  background: rgba(108, 117, 125, 0.05);
  border-radius: 12px;
}

/* 下载区域样式 */
.add-link-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.add-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.download-tabs {
  margin-top: 20px;
}

.modern-tabs {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

/* 过滤器样式 */
.filter-container {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.filter-row {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filter-select {
  min-width: 150px;
}

.pan-type-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.pan-type-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  font-weight: 500;
}

.pan-type-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.pan-type-selected {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border-color: transparent !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

/* 下载列表样式 */
.download-list.compact {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.download-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.download-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.download-info {
  flex: 1;
  margin-right: 20px;
}

.download-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-size: 15px;
}

.download-icon {
  font-size: 18px;
  color: #667eea;
}

.download-icon.magnet-icon {
  color: #e74c3c;
}

.download-icon.pan-icon {
  color: #3498db;
}

.download-icon.online-icon {
  color: #27ae60;
}

.inline-tags {
  display: flex;
  gap: 8px;
  margin-left: 12px;
}

.inline-quality {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.inline-platform {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  color: #2d3436;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(255, 234, 167, 0.3);
}

.download-meta {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #6c757d;
  margin-top: 8px;
}

.download-size {
  font-weight: 600;
  color: #27ae60;
}

.download-date {
  color: #6c757d;
}

.download-count {
  color: #e67e22;
  font-weight: 500;
}

.download-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.download-actions .el-button {
  font-size: 12px;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.download-actions .el-button:hover {
  transform: translateY(-2px);
}

/* 标签和来源区域样式 */
.tags-section,
.source-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 30px;
  transition: all 0.3s ease;
}

.tags-section:hover,
.source-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #2d3436;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(168, 237, 234, 0.3);
  transition: all 0.3s ease;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 237, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .detail-content {
    gap: 30px;
  }
  
  .poster-section {
    width: 280px;
  }
  
  .info-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
    gap: 25px;
    padding: 0 15px 30px;
  }

  .poster-section {
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
  }

  .header-content {
    padding: 0 15px;
  }

  .detail-title {
    font-size: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }

  .download-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .download-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .back-button {
    align-self: flex-start;
  }

  .detail-title {
    font-size: 20px;
  }

  .info-card {
    padding: 20px;
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.detail-header {
  animation: fadeInUp 0.8s ease-out;
}

.poster-section {
  animation: slideInLeft 0.8s ease-out 0.2s both;
}

.info-section {
  animation: slideInRight 0.8s ease-out 0.4s both;
}

.info-card {
  animation: fadeInUp 0.6s ease-out var(--delay, 0s) both;
}

.info-card:nth-child(1) { --delay: 0.1s; }
.info-card:nth-child(2) { --delay: 0.2s; }
.info-card:nth-child(3) { --delay: 0.3s; }

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

/* 选择文本样式 */
::selection {
  background: rgba(102, 126, 234, 0.3);
  color: #2c3e50;
}

/* 焦点样式 */
.el-button:focus,
.el-select:focus,
.el-tag:focus {
  outline: 2px solid rgba(102, 126, 234, 0.5);
  outline-offset: 2px;
}
</style>