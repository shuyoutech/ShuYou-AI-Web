<script setup lang="ts">
import {ref, reactive, onMounted, watch} from 'vue'
import Sidebar from './sidebar.vue'
import {modelPageApi} from '@/api/ai/model'
import type {ModelVo, ModelQuery} from '@/api/ai/model/types'
import {ElMessage} from "element-plus";

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedProvider = ref('')
const selectedModality = ref('')

// 模型数据
const modelList = ref<ModelVo[]>([])

// 分页参数
const pagination = reactive({
  pageNum: 1,
  pageSize: 12,
  total: 0
})

// 加载模型数据
const loadModelData = async () => {
  loading.value = true
  try {
    const queryParams: ModelQuery = {}

    // 添加搜索关键词
    if (searchKeyword.value) {
      queryParams.name = searchKeyword.value
    }

    // 添加供应商过滤
    if (selectedProvider.value) {
      queryParams.provider = selectedProvider.value
    }

    // 添加模型类型过滤
    if (selectedModality.value) {
      queryParams.type = selectedModality.value
    }

    const query: PageQuery<ModelQuery> = {
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      query: queryParams
    }

    const response: any = await modelPageApi(query)
    if (response.code === 0) {
      modelList.value = response.data.rows || []
      pagination.total = response.data.total || 0
    }
  } catch (error) {
    console.error('加载模型数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 过滤触发函数
const handleFilter = () => {
  pagination.pageNum = 1 // 重置到第一页
  loadModelData()
}

// 搜索处理函数
const handleSearch = () => {
  handleFilter()
}

// 监听过滤条件变化
watch([selectedProvider, selectedModality], () => {
  handleFilter()
})

// 初始化
onMounted(() => {
  loadModelData()
})

function formatRemark(model: ModelVo) {
  try {
    const price = JSON.parse(model.price || '{}')
    const currency = price.currency === 'CNY' ? '¥' : '$'
    const contextWindow = model.contextWindowStr ? model.contextWindowStr : model.contextWindow
    let arrList = []
    if (price.promptPrice) {
      arrList.push(currency + price.promptPrice + '/M input tokens')
    }
    if (price.completionPrice) {
      arrList.push(currency + price.completionPrice + '/M output tokens')
    }
    if (price.perPrice) {
      if (model.types?.includes('IG')) {
        arrList.push(currency + price.perPrice + '/张')
      }
      if (model.types?.includes('VG')) {
        arrList.push(currency + price.perPrice + '/s')
      }
    }
    if (model.contextWindow && model.contextWindow > 0) {
      arrList.push(contextWindow)
    }
    return arrList.join(' | ')
  } catch (error) {
    console.error('formatRemark error:', error)
    return `${model.provider}`
  }
}

// 显示描述详情
function showDescriptionDetail(model: ModelVo) {
  if (model.remark && model.remark.length > 50) {
    ElMessage({
      message: model.remark,
      type: 'info',
      duration: 5000,
      showClose: true
    })
  }
}


// 复制模型名称
function copyModelName(modelName: string) {
  if (modelName) {
    navigator.clipboard.writeText(modelName).then(() => {
      ElMessage({
        message: `已复制: ${modelName}`,
        type: 'success',
        duration: 2000
      })
    }).catch(() => {
      // 降级处理：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = modelName
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      ElMessage({
        message: `已复制: ${modelName}`,
        type: 'success',
        duration: 2000
      })
    })
  }
}

</script>

<template>
  <div class="model-container">
    <div class="model-layout">
      <!-- 左侧筛选面板 -->
      <div class="sidebar-section">
        <Sidebar
          v-model:selectedProvider="selectedProvider"
          v-model:selectedModality="selectedModality"
        />
      </div>

      <!-- 右侧主内容区 -->
      <div class="main-content">
        <!-- 顶部标题和搜索 -->
        <div class="content-header">
          <div class="header-info">
            <h2 class="header-title">模型 <span class="model-count">{{ pagination.total }}</span></h2>
          </div>
          <div class="search-section">
            <div class="search-input-wrapper">
              <FaIcon name="i-ep:search" class="search-icon"/>
              <input
                v-model="searchKeyword"
                type="text"
                placeholder="请输入模型名称"
                class="search-input"
                @keyup.enter="handleSearch"
              />
            </div>
          </div>
        </div>

        <!-- 模型卡片网格 -->
        <div class="models-grid">
          <div
            v-for="model in modelList"
            :key="model.id"
            class="model-card"
          >
            <div class="model-card-header">
              <div class="model-icon">
                <img
                  v-if="model.providerIcon"
                  :src="model.providerIcon"
                  :alt="model.name"
                  class="model-icon-img"
                />
                <div v-else class="default-icon">
                  <FaIcon name="i-ri:robot-line" class="default-icon-svg"/>
                </div>
              </div>
              <div class="model-title">
                {{ model.alias }}
                <FaIcon
                  name="i-ri:file-copy-line"
                  class="copy-name-icon"
                  @click="copyModelName(model.name)"
                  :title="`模型名称: ${model.name || model.alias} (点击复制)`"
                />
              </div>
              <div class="model-badges">
                <span v-if="model.enableThinking" class="badge version-badge">思考</span>
                <span v-if="model.enableSearch" class="badge version-badge">搜索</span>
              </div>
            </div>

            <div class="model-card-content">
              <p
                class="model-description"
                :title="model.remark || ''"
              >
                {{ model.remark || '' }}
              </p>

              <div class="model-tags-row">
                <div class="model-tags">
                  <span
                    v-for="tag in model.typeNames"
                    :key="tag"
                    class="tag"
                  >
                    {{ tag }}
                  </span>
                </div>
                <span v-if="model.chargeTypeName" class="charge-type">{{ model.chargeTypeName }}</span>
              </div>

              <div class="model-meta">
                <span class="provider-name">{{ formatRemark(model) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="modelList.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">
            <FaIcon name="i-ep:search" class="empty-search-icon"/>
          </div>
          <h3 class="empty-title">未找到相关模型</h3>
          <p class="empty-description">请尝试调整搜索条件或筛选器</p>
        </div>

        <!-- 分页组件 -->
        <div v-if="pagination.total > 0" class="pagination-wrapper">
          <FaPagination
            :page="pagination.pageNum"
            :size="pagination.pageSize"
            :total="pagination.total"
            @page-change="(page) => {pagination.pageNum = page;loadModelData()}"
            class="pagination"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.model-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  padding: 0;
  margin: 0;
  width: 100%;
  position: relative;
  overflow: auto;
}

.model-layout {
  display: flex;
  gap: 20px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  height: 100%;
}

.sidebar-section {
  flex-shrink: 0;
  width: 320px;
  min-width: 320px;
  height: fit-content;
}

.main-content {
  flex: 1;
  min-width: 0;
  overflow: visible;
  position: relative;
  z-index: 1;
}

/* 内容头部 */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
}

.header-info {
  flex-shrink: 0;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-count {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.search-section {
  flex: 1;
  max-width: 400px;
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1rem;
  z-index: 2;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

/* 模型网格 */
.models-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
  position: relative;
  z-index: 1;
}

.model-card {
  background: white;
  border-radius: 10px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.model-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.model-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.model-card:hover::before {
  opacity: 1;
}

.model-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  position: relative;
  z-index: 2;
  gap: 8px;
}

.model-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.model-title {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
}

.copy-name-icon {
  font-size: 0.8rem;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  opacity: 0.7;
}

.copy-name-icon:hover {
  color: #667eea;
  opacity: 1;
}

.model-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 3px;
}

.default-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.default-icon-svg {
  width: 14px;
  height: 14px;
  color: #667eea;
}

.model-badges {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.new-badge {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: white;
}

.version-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.model-card-content {
  position: relative;
  z-index: 2;
}

.model-description {
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

.model-description:hover {
  color: #667eea;
}

.model-tags-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.model-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.tag-secondary {
  background: rgba(156, 163, 175, 0.1);
  color: #6b7280;
  border: 1px solid rgba(156, 163, 175, 0.2);
}

.model-meta {
  margin-top: 2px;
  padding-top: 2px;
  border-top: 1px solid rgba(0, 0, 0, 0.04);
}

.provider-name {
  font-size: 0.7rem;
  color: #6b7280;
  font-weight: 400;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.charge-type {
  font-size: 0.75rem;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.model-date {
  font-size: 0.75rem;
  color: #9ca3af;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.empty-icon {
  margin-bottom: 20px;
}

.empty-search-icon {
  font-size: 3rem;
  color: #d1d5db;
}

.empty-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
}

/* 分页组件样式 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 24px 0;
  margin-top: 20px;
}

.pagination-wrapper {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.pagination {
  /* FaPagination 组件样式 */
}


/* 响应式设计 */
@media (max-width: 1200px) {
  .model-layout {
    flex-direction: column;
    gap: 16px;
  }

  .sidebar-section {
    width: 100%;
  }

  .models-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .model-layout {
    padding: 16px;
  }

  .content-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .search-section {
    max-width: none;
  }

  .models-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .model-card {
    padding: 16px;
  }
}
</style>
