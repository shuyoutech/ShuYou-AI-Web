<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import Sidebar from './sidebar.vue'
import {ElMessage} from 'element-plus'
import {promptPageApi} from "@/api/ai/prompt";
import type {AigcPromptQuery, AigcPromptVo} from "@/api/ai/prompt/types.ts";
import {queryHotDataApi} from "@/api/api";

// 当前选中的菜单
const selectedMenu = ref('prompt')

// 搜索关键词
const searchKeyword = ref('')

// 分页数据
const pagination = reactive({
  pageNum: 1,
  pageSize: 12,
  total: 0
})

// 提示词列表
const promptList = ref<AigcPromptVo[]>([])

// 显示完整内容的提示框
const showContentTooltip = ref<{ id: string, content: string, x: number, y: number } | null>(null)

// 筛选条件
const selectedModelType = ref('')
const selectedScene = ref('')

// 搜索处理
const handleSearch = () => {
  pagination.pageNum = 1
  loadPromptData()
}

// 筛选处理
const handleFilter = () => {
  pagination.pageNum = 1
  loadPromptData()
}

// 复制模板内容
const copyTemplateContent = (content: string) => {
  navigator.clipboard.writeText(content).then(() => {
    ElMessage.success('模板内容已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

// 显示内容提示框
const showContentTooltipHandler = (event: MouseEvent, promptId: string, content: string) => {
  event.stopPropagation()
  console.log('显示提示框:', {promptId, content: content.substring(0, 50)})
  showContentTooltip.value = {
    id: promptId,
    content: content,
    x: event.clientX,
    y: event.clientY - 10
  }
}

// 隐藏内容提示框
const hideContentTooltip = () => {
  showContentTooltip.value = null
}

// 初始化
onMounted(() => {
  initData()
  // 添加全局点击事件来关闭提示框
  document.addEventListener('click', () => {
    hideContentTooltip()
  })
})

// 初始化数据
const initData = async () => {
  loadTypeOptions()
  loadSceneOptions()
  loadPromptData()
}

const typeOptions = ref<Options[]>([])
const loadTypeOptions = () => {
  queryHotDataApi('dict_aigc_prompt_type').then(({data}) => {
    typeOptions.value.push({value: '', label: '全部'})
    typeOptions.value.push(...data)
    selectedModelType.value = typeOptions.value[0].value
  })
}

const sceneOptions = ref<Options[]>([])
const loadSceneOptions = () => {
  queryHotDataApi('dict_aigc_prompt_scene').then(({data}) => {
    sceneOptions.value.push({value: '', label: '全部'})
    sceneOptions.value.push(...data)
    selectedScene.value = sceneOptions.value[0].value
  })
}


const loadPromptData = () => {
  let query = <PageQuery<AigcPromptQuery>>({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    query: {
      type: selectedModelType.value,
      scene: selectedScene.value,
      name: searchKeyword.value,
    }
  })
  promptPageApi(query).then((res: any) => {
    promptList.value = res.data.rows
    pagination.total = res.data.total
    if (promptList.value.length > 0) {
      for (let i = 0; i < promptList.value.length; i++) {
        promptList.value[i].tags = [promptList.value[i].typeName, promptList.value[i].sceneName]
      }
    }
  })
}


</script>

<template>
  <div class="prompt-container">
    <div class="prompt-layout">
      <!-- 左侧筛选面板 -->
      <div class="sidebar-section">
        <Sidebar
          v-model:selectedMenu="selectedMenu"
        />
      </div>

      <!-- 右侧主内容区 -->
      <div class="main-content">
        <!-- 筛选条件 -->
        <div class="filter-section">
          <div class="filter-content">
            <!-- 模型类型 -->
            <div class="filter-group">
              <label class="filter-label">模型类型</label>
              <div class="filter-options">
                <button
                  v-for="type in typeOptions"
                  :key="type.value"
                  class="filter-option"
                  :class="{ active: selectedModelType === type.value }"
                  @click="selectedModelType = type.value; handleFilter()"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>

            <!-- 使用场景 -->
            <div class="filter-group">
              <label class="filter-label">使用场景</label>
              <div class="filter-options">
                <button
                  v-for="scene in sceneOptions"
                  :key="scene.value"
                  class="filter-option"
                  :class="{ active: selectedScene === scene.value}"
                  @click="selectedScene = scene.value; handleFilter()"
                >
                  {{ scene.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 顶部标题和搜索 -->
        <div class="content-header">
          <div class="header-info">
            <h2 class="header-title">提示词模板 <span class="template-count">{{ pagination.total }}</span></h2>
          </div>
          <div class="search-section">
            <div class="search-input-wrapper">
              <FaIcon name="i-ep:search" class="search-icon"/>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="搜索prompt模板"
                class="search-input"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
        </div>

        <!-- 提示词卡片网格 -->
        <div class="prompt-grid">
          <div
            v-for="prompt in promptList"
            :key="prompt.id"
            class="prompt-card"
          >
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="template-icon">
                <FaIcon :name="'i-ri:magic-line'" class="icon-svg"/>
              </div>
              <div class="template-info">
                <div class="template-name">
                  {{ prompt.name }}
                  <FaIcon
                    name="i-ri:file-copy-line"
                    class="copy-icon"
                    @click="copyTemplateContent(prompt.content)"
                    :title="`模板内容: ${prompt.content.substring(0, 50)}... (点击复制)`"
                  />
                </div>

              </div>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div
                class="template-content"
                @click="showContentTooltipHandler($event, prompt.id, prompt.content)"
                title="鼠标悬停查看完整内容"
              >
                {{ prompt.content }}
              </div>

              <!-- 标签 -->
              <div class="template-tags">
                <span
                  v-for="tag in prompt.tags"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="promptList.length === 0" class="empty-state">
          <div class="empty-icon">
            <FaIcon name="i-ep:search" class="empty-search-icon"/>
          </div>
          <h3 class="empty-title">未找到相关模板</h3>
          <p class="empty-description">请尝试调整搜索条件或筛选器</p>
        </div>

        <!-- 分页组件 -->
        <div v-if="pagination.total > 0" class="pagination-wrapper">
          <FaPagination
            :page="pagination.pageNum"
            :size="pagination.pageSize"
            :total="pagination.total"
            @page-change="(page) => {pagination.pageNum = page;loadPromptData()}"
            class="pagination"
          />
        </div>
      </div>
    </div>

    <!-- 内容提示框 -->
    <div
      v-if="showContentTooltip"
      class="content-tooltip"
      :style="{
        left: showContentTooltip.x + 'px',
        top: showContentTooltip.y + 'px'
      }"
    >
      <div class="tooltip-content">
        {{ showContentTooltip.content }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.prompt-container {
  min-height: calc(100vh - 101px);
  background: #f5f7fa;
  display: flex;
}

.prompt-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 左侧筛选面板 */
.sidebar-section {
  width: 239px;
  min-width: 239px;
  flex-shrink: 0;
  background: white;
  border-right: 1px solid #e9ecef;
  position: fixed;
  left: 0;
  top: 60px;
  height: calc(100% - 60px);
  overflow-y: auto;
  z-index: 100;
}

.filter-section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.clear-btn {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.clear-btn:hover {
  background: rgba(102, 126, 234, 0.1);
}

.filter-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #4a5568;
  white-space: nowrap;
  min-width: 80px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.filter-option {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #4a5568;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-option:hover {
  background: #f8f9fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.filter-option.active {
  background: #e0e7ff;
  color: #5b21b6;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
}

/* 右侧主内容区 */
.main-content {
  flex: 1;
  margin-left: 239px;
  padding: 20px;
  overflow-y: auto;
  min-height: calc(100vh - 101px);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px 0;
}

.header-info {
  flex: 1;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.template-count {
  color: #667eea;
  font-weight: 500;
}

.search-section {
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #9ca3af;
  font-size: 1rem;
  z-index: 1;
}

.search-input {
  width: 280px;
  padding: 10px 12px 10px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 提示词卡片网格 */
.prompt-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 20px;
}

.prompt-card {
  background: white;
  border-radius: 20px;
  padding: 16px 16px 12px 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  min-height: auto;
  max-height: 220px;
  position: relative;
  overflow: hidden;
}

.prompt-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.prompt-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-color: rgba(102, 126, 234, 0.2);
}

.prompt-card:hover::before {
  opacity: 1;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.template-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.25);
  position: relative;
  overflow: hidden;
}

.template-icon::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  transition: all 0.3s ease;
}

.template-icon:hover::before {
  animation: shimmer 1.5s ease-in-out;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

.icon-svg {
  width: 20px;
  height: 20px;
  color: white;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.prompt-card:hover .icon-svg {
  transform: scale(1.1);
}

.template-info {
  flex: 1;
  min-width: 0;
}

.template-name {
  font-size: 1rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  height: 36px;
}

.copy-icon {
  font-size: 0.8rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.copy-icon:hover {
  color: #667eea;
}

.template-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: auto;
  padding: 4px 0 0 0;
  margin-bottom: 0;
}

.tag {
  padding: 2px 6px !important;
  border-radius: 6px !important;
  font-size: 0.65rem !important;
  font-weight: 500 !important;
  background: rgba(102, 126, 234, 0.08) !important;
  color: #667eea !important;
  border: 1px solid rgba(102, 126, 234, 0.15) !important;
  transition: all 0.2s ease !important;
  line-height: 1.2 !important;
}

.badge {
  padding: 4px 8px !important;
  border-radius: 6px !important;
  font-size: 0.75rem !important;
  font-weight: 500 !important;
  background: rgba(102, 126, 234, 0.1) !important;
  color: #667eea !important;
  border: 1px solid rgba(102, 126, 234, 0.2) !important;
}

.feature-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.badge-secondary {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.2);
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
}

.template-content {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.3;
  margin: 0 0 6px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  transition: color 0.2s ease;
}

.template-content:hover {
  color: #667eea;
}

.template-meta {
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.template-id {
  font-size: 0.75rem;
  color: #9ca3af;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
  word-break: break-all;
}

.template-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.tag {
  padding: 2px 8px;
  background: #f8f9fa;
  color: #6b7280;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-search-icon {
  font-size: 3rem;
  color: #d1d5db;
}

.empty-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 0.9rem;
  color: #9ca3af;
  margin: 0;
}

/* 分页 */
.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.pagination {
  /* FaPagination 组件样式 */
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .prompt-layout {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
    min-width: auto;
    flex-direction: row;
    gap: 20px;
  }

  .search-input {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .prompt-container {
    padding: 16px;
  }

  .prompt-layout {
    gap: 16px;
  }

  .sidebar-section {
    flex-direction: column;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .search-input {
    width: 100%;
  }

  .prompt-grid {
    grid-template-columns: 1fr;
  }

  .header-title {
    font-size: 1.3rem;
  }

  .filter-content {
    flex-direction: column;
    gap: 16px;
  }
}

/* 内容提示框样式 */
.content-tooltip {
  position: fixed;
  z-index: 9999;
  transform: translateX(-50%);
  pointer-events: none;
  max-width: 400px;
  min-width: 300px;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.tooltip-content {
  background: #1e3a8a;
  color: white;
  padding: 16px 20px;
  border-radius: 12px;
  font-size: 0.9rem;
  line-height: 1.5;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
  word-wrap: break-word;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.tooltip-content::after {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-bottom: 8px solid #1e3a8a;
}
</style>
