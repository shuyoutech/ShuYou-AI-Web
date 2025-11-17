<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {ArrowLeft, InfoFilled, Document, Check} from '@element-plus/icons-vue'
import {useRoute, useRouter} from 'vue-router'
import Sidebar from '../sidebar.vue'
import {ragDataSearchApi, ragKnowledgeDetailApi, ragKnowledgeUpdateApi} from "@/api/ai/rag";
import type {RagDataSearchBo, RagKnowledgeVo} from "@/api/ai/rag/types.ts";

// 路由实例
const route = useRoute()
const router = useRouter()

// 知识库信息
const knowledgeInfo = reactive<RagKnowledgeVo>({
  id: route.params.id,
  name: ''
})

// 搜索配置
const searchConfig = reactive({
  searchMethod: 'dense',
  enableReorder: true,
  reorderWeight: 0.5,
  reorderModel: 'BAAI ReRanker-Base',
  referenceLimit: 5000,
  minRelevance: 0,
  recallCount: 5,
  enableOptimization: true,
  aiModel: 'Qwen-max',
  conversationBackground: ''
})

// 搜索查询
const searchQuery = ref('')

// 搜索结果
const searchResults = ref<any[]>([])

// 配置标签
const activeConfigTab = ref('search')

// 配置标签
const configTabs = [
  {key: 'search', label: '搜索方式', icon: 'Operation'},
  {key: 'filter', label: '搜索过滤', icon: 'Filter'},
  {key: 'optimization', label: '问题优化', icon: 'TrendCharts'}
]

// 搜索方式选项
const searchMethods = [
  {
    value: 'dense',
    label: '语义检索',
    description: '使用向量进行文本相关性查询'
  },
  {
    value: 'sparse',
    label: '全文检索',
    description: '使用传统的全文检索,适合查找一些关键词和主谓语特殊的数据'
  },
  {
    value: 'hybrid',
    label: '混合检索',
    description: '使用向量检索与全文检索的综合结果返回,使用 RRF 算法进行排序。'
  }
]

// 初始化数据
const initData = () => {
  // 从路由参数获取知识库信息
  loadKnowledgeInfo()
}

// 加载知识库信息
const loadKnowledgeInfo = async () => {
  ragKnowledgeDetailApi(route.params.id).then((res: any) => {
    if (res.code === 0) {
      Object.assign(knowledgeInfo, res.data)
      if (knowledgeInfo.searchConfigJson) {
        const searchJson = JSON.parse(knowledgeInfo.searchConfigJson)
        searchConfig.searchMethod = searchJson.searchMode
        searchConfig.enableReorder = searchJson.enableRank
        searchConfig.reorderModel = searchJson.rankModelId
        searchConfig.reorderWeight = searchJson.rankScore
        searchConfig.recallCount = searchJson.topK
        searchConfig.minRelevance = searchJson.score
        searchConfig.enableOptimization = searchJson.enableRewrite
        searchConfig.referenceLimit = searchJson.maxTokens
      }
    }
  })

}

// 返回知识库列表
const goBack = () => {
  try {
    router.push('/app/knowledge')
  } catch (error) {
    console.error('返回失败:', error)
    // 如果路由失败，使用浏览器历史记录
    window.history.back()
  }
}

// 处理测试
const handleTest = () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索文本')
    return
  }
  let data: RagDataSearchBo = {
    knowledgeId: knowledgeInfo.id,
    text: searchQuery.value.trim(),
  }
  ragDataSearchApi(data).then((res: any) => {
    if (res.code === 0) {
      searchResults.value = res.data
      ElMessage.success('搜索完成')
    }
  })

}

// 处理图片加载错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  ElMessage.warning('图片加载失败')
}

// 切换配置标签
const switchConfigTab = (tabKey: string) => {
  activeConfigTab.value = tabKey
}

// 切换结果重排
const toggleReorder = () => {
  searchConfig.enableReorder = !searchConfig.enableReorder
}

// 调整重排权重
const adjustWeight = (delta: number) => {
  const newWeight = searchConfig.reorderWeight + delta
  if (newWeight >= 0 && newWeight <= 1) {
    searchConfig.reorderWeight = Math.round(newWeight * 10) / 10
  }
}

// 调整引用上限
const adjustReferenceLimit = (delta: number) => {
  const newLimit = searchConfig.referenceLimit + delta
  if (newLimit >= 100 && newLimit <= 10000) {
    searchConfig.referenceLimit = newLimit
  }
}

// 调整最低相关度
const adjustMinRelevance = (delta: number) => {
  const newRelevance = searchConfig.minRelevance + delta
  if (newRelevance >= 0 && newRelevance <= 1) {
    searchConfig.minRelevance = Math.round(newRelevance * 100) / 100
  }
}

// 调整召回数量
const adjustRecallCount = (delta: number) => {
  const newCount = searchConfig.recallCount + delta
  if (newCount >= 1 && newCount <= 100) {
    searchConfig.recallCount = newCount
  }
}

// 切换问题优化
const toggleOptimization = () => {
  searchConfig.enableOptimization = !searchConfig.enableOptimization
}

// 保存配置
const saveConfig = () => {
  let data = {
    searchMode: searchConfig.searchMethod,
    embedModelId: '5b352c7074a12359f6c5e8eadb969d58076e0f8c314a49b4661f48cdbb9d42bf',
    embedModelName: 'text-embedding-v4',
    enableRank: searchConfig.enableReorder,
    rankModelId: searchConfig.reorderModel,
    rankModelName: searchConfig.reorderModel,
    rankScore: searchConfig.reorderWeight,
    topK: searchConfig.recallCount,
    score: searchConfig.minRelevance,
    enableRewrite: searchConfig.enableOptimization,
    rewriteModelId: searchConfig.enableOptimization,
    rewritePrompt: searchConfig.enableOptimization,
    maxTokens: searchConfig.referenceLimit,
  }
  ragKnowledgeUpdateApi({
    id: knowledgeInfo.id,
    searchConfigJson: JSON.stringify(data),
  }).then((res: any) => {
    if (res.code === 0) {
      ElMessage.success('配置保存成功')
      createDialogVisible.value = false
      resetCreateForm()
      loadKnowledgeData()
    } else {
      ElMessage.error(res.msg || '配置保存失败')
    }
  })
}

// 组件挂载
onMounted(() => {
  initData()
})
</script>

<template>
  <div class="knowledge-search-container">
    <div class="knowledge-layout">
      <!-- 左侧边栏 -->
      <div class="sidebar-section">
        <Sidebar/>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="search-header">
          <div class="header-left">
            <button class="back-btn" @click="goBack">
              <el-icon>
                <ArrowLeft/>
              </el-icon>
              返回
            </button>
            <div class="search-info">
              <h1 class="search-title">知识库命中测试</h1>
              <span class="search-subtitle">{{ knowledgeInfo.name }}</span>
            </div>
          </div>
        </div>

        <div class="search-content">
          <!-- 左侧配置面板 -->
          <div class="config-panel">
            <div class="config-section">
              <h3 class="config-title">知识库搜索配置</h3>

              <!-- Tab标签 -->
              <div class="config-tabs">
                <div
                  v-for="tab in configTabs"
                  :key="tab.key"
                  class="config-tab"
                  :class="{ active: activeConfigTab === tab.key }"
                  @click="switchConfigTab(tab.key)"
                >
                  <el-icon>
                    <component :is="tab.icon"/>
                  </el-icon>
                  <span>{{ tab.label }}</span>
                </div>
              </div>


              <!-- 搜索方式配置 -->
              <div v-if="activeConfigTab === 'search'" class="config-tab-content">
                <div class="search-method-section">
                  <h4 class="section-title">搜索方式</h4>
                  <div class="search-method-options">
                    <div
                      v-for="method in searchMethods"
                      :key="method.value"
                      class="search-method-option"
                    >
                      <label class="method-radio-label">
                        <input
                          type="radio"
                          v-model="searchConfig.searchMethod"
                          :value="method.value"
                          class="method-radio"
                        />
                        <div class="method-content">
                          <h5 class="method-title">{{ method.label }}</h5>
                          <p class="method-description">{{ method.description }}</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div class="result-reorder-section">
                  <div class="reorder-header">
                    <label class="reorder-label">
                      结果重排
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </label>
                    <div class="toggle-switch" :class="{ active: searchConfig.enableReorder }" @click="toggleReorder">
                      <div class="toggle-slider"></div>
                    </div>
                  </div>

                  <div v-if="searchConfig.enableReorder" class="reorder-config">
                    <div class="reorder-weight">
                      <label class="weight-label">重排权重</label>
                      <div class="weight-control">
                        <input
                          type="range"
                          v-model="searchConfig.reorderWeight"
                          min="0"
                          max="1"
                          step="0.1"
                          class="weight-slider"
                        />
                        <div class="weight-input-group">
                          <button class="weight-btn" @click="adjustWeight(-0.1)">-</button>
                          <input
                            v-model="searchConfig.reorderWeight"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            class="weight-input"
                          />
                          <button class="weight-btn" @click="adjustWeight(0.1)">+</button>
                        </div>
                      </div>
                    </div>

                    <div class="reorder-model">
                      <label class="model-label">重排模型</label>
                      <select v-model="searchConfig.reorderModel" class="model-select">
                        <option value="BAAI ReRanker-Base">BAAI ReRanker-Base</option>
                        <option value="BAAI ReRanker-Large">BAAI ReRanker-Large</option>
                        <option value="Custom Model">Custom Model</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 搜索过滤配置 -->
              <div v-if="activeConfigTab === 'filter'" class="config-tab-content">
                <div class="filter-section">
                  <div class="filter-item">
                    <label class="filter-label">
                      召回数量
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </label>
                    <div class="filter-control">
                      <input
                        type="range"
                        v-model="searchConfig.recallCount"
                        min="1"
                        max="100"
                        step="1"
                        class="filter-slider"
                      />
                      <div class="filter-input-group">
                        <button class="filter-btn" @click="adjustRecallCount(-1)">-</button>
                        <input
                          v-model="searchConfig.recallCount"
                          type="number"
                          step="1"
                          min="1"
                          max="100"
                          class="filter-input"
                        />
                        <button class="filter-btn" @click="adjustRecallCount(1)">+</button>
                      </div>
                    </div>
                  </div>

                  <div class="filter-item">
                    <label class="filter-label">
                      引用上限
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </label>
                    <div class="filter-control">
                      <input
                        type="range"
                        v-model="searchConfig.referenceLimit"
                        min="100"
                        max="10000"
                        step="100"
                        class="filter-slider"
                      />
                      <div class="filter-input-group">
                        <button class="filter-btn" @click="adjustReferenceLimit(-100)">-</button>
                        <input
                          v-model="searchConfig.referenceLimit"
                          type="number"
                          step="100"
                          min="100"
                          max="10000"
                          class="filter-input"
                        />
                        <button class="filter-btn" @click="adjustReferenceLimit(100)">+</button>
                      </div>
                    </div>
                  </div>

                  <div class="filter-item">
                    <label class="filter-label">
                      最低相关度
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </label>
                    <div class="filter-control">
                      <input
                        type="range"
                        v-model="searchConfig.minRelevance"
                        min="0"
                        max="1"
                        step="0.01"
                        class="filter-slider"
                      />
                      <div class="filter-input-group">
                        <button class="filter-btn" @click="adjustMinRelevance(-0.01)">-</button>
                        <input
                          v-model="searchConfig.minRelevance"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          class="filter-input"
                        />
                        <button class="filter-btn" @click="adjustMinRelevance(0.01)">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 问题优化配置 -->
              <div v-if="activeConfigTab === 'optimization'" class="config-tab-content">
                <div class="optimization-section">
                  <div class="optimization-description">
                    <p>
                      开启问题优化功能,可以提高提高连续对话时,知识库搜索的精度。开启该功能后,在进行知识库搜索时,会根据对话记录,利用AI补全问题缺失的信息。</p>
                  </div>

                  <div class="optimization-config">
                    <div class="optimization-item">
                      <label class="optimization-label">使用问题优化</label>
                      <div class="toggle-switch" :class="{ active: searchConfig.enableOptimization }"
                           @click="toggleOptimization">
                        <div class="toggle-slider"></div>
                      </div>
                    </div>

                    <div v-if="searchConfig.enableOptimization" class="optimization-details">
                      <div class="ai-model">
                        <label class="model-label">AI 模型</label>
                        <select v-model="searchConfig.aiModel" class="model-select">
                          <option value="Qwen-max">Qwen-max</option>
                          <option value="GPT-4">GPT-4</option>
                          <option value="Claude-3">Claude-3</option>
                        </select>
                      </div>

                      <div class="conversation-background">
                        <label class="background-label">
                          对话背景描述
                          <el-icon class="info-icon">
                            <InfoFilled/>
                          </el-icon>
                        </label>
                        <textarea
                          v-model="searchConfig.conversationBackground"
                          class="background-textarea"
                          placeholder="例如:&#10;关于Python 的介绍和使用等问题。&#10;当前对话与游戏《GTA5》有关。"
                          rows="4"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 保存配置按钮 -->
              <div class="config-save-section">
                <button class="save-config-btn" @click="saveConfig">
                  <el-icon>
                    <Check/>
                  </el-icon>
                  保存配置
                </button>
              </div>
            </div>
          </div>

          <!-- 右侧搜索区域 -->
          <div class="search-panel">
            <!-- 输入区域 -->
            <div class="input-section">
              <div class="input-container">
                <textarea
                  v-model="searchQuery"
                  class="search-textarea"
                  placeholder="请输入文本"
                  rows="8"
                ></textarea>
                <button class="test-btn-inline" @click="handleTest">测试</button>
              </div>
            </div>

            <!-- 召回结果区域 -->
            <div class="results-section">
              <h4 class="section-title">召回结果</h4>
              <div v-if="searchResults.length === 0" class="empty-results">
                <div class="empty-icon">
                  <el-icon>
                    <Document/>
                  </el-icon>
                </div>
                <p class="empty-text">无召回结果</p>
              </div>
              <div v-else class="results-list">
                <div
                  v-for="(result, index) in searchResults"
                  :key="index"
                  class="result-item"
                >
                  <div class="result-header">
                    <span class="result-index">结果 {{ index + 1 }}</span>
                    <span class="result-score">相似度: {{ result.score }}</span>
                  </div>
                  <div class="result-content">
                    <!-- 图片类型显示图片 -->
                    <div v-if="result.image_url" class="result-image">
                      <img
                        :src="result.image_url"
                        class="result-image-preview"
                        @error="handleImageError"
                      />
                    </div>
                    <!-- 文本类型显示文本 -->
                    <div v-else class="result-text">
                      {{ result.text }}
                    </div>
                  </div>
                  <!--                  <div class="result-meta">
                                      <span class="result-source">{{ result.source }}</span>
                                      <span class="result-chunk">块 {{ result.chunkIndex }}</span>
                                    </div>-->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.knowledge-search-container {
  min-height: calc(100vh - 101px);
  background: #f5f7fa;
  display: flex;
}

.knowledge-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

/* 左侧边栏 */
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

/* 主内容区域 */
.main-content {
  flex: 1;
  margin-left: 239px;
  padding: 20px;
  overflow-y: auto;
  min-height: calc(100vh - 101px);
}

/* 搜索头部 */
.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.back-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.search-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.search-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.search-subtitle {
  font-size: 0.9rem;
  color: #6b7280;
}

.test-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.test-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
}

/* 搜索内容区域 */
.search-content {
  display: flex;
  gap: 20px;
  flex: 1;
}

/* 左侧配置面板 */
.config-panel {
  width: 400px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-right: 1px solid #e2e8f0;
  padding: 16px;
  overflow-y: auto;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.05);
}

.config-section {
  background: white;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(59, 130, 246, 0.1);
  height: fit-content;
  position: relative;
  overflow: hidden;
}

.config-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
}

.config-title {
  margin: 0 0 18px 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  text-align: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
}

.config-title::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
  }
}

/* 相似度阈值配置 */
.threshold-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.threshold-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.threshold-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
}

.info-icon {
  color: #6b7280;
  font-size: 0.8rem;
}

.threshold-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

.threshold-input:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.threshold-slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.threshold-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.threshold-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
}

.threshold-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #8b5cf6;
  cursor: pointer;
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
}


/* 右侧搜索面板 */
.search-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-section,
.results-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* 输入区域 */
.input-container {
  position: relative;
}

.search-textarea {
  width: 100%;
  padding: 12px 60px 12px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 120px;
  font-family: inherit;
  text-align: left;
}

.search-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.search-textarea::placeholder {
  color: #9ca3af;
  text-align: left;
}

.test-btn-inline {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.test-btn-inline:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

/* 结果区域 */
.empty-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-text {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* 结果列表 */
.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: #8b5cf6;
  background: #f8f9ff;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.result-index {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.result-score {
  background: #8b5cf6;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.result-content {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #1f2937;
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-image {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-image-preview {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: #fff;
  padding: 8px;
}

.result-image-caption {
  font-size: 0.85rem;
  color: #6b7280;
  font-style: italic;
  padding: 8px 12px;
  background: #f3f4f6;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.result-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.result-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #6b7280;
}

.result-source {
  font-weight: 500;
}

.result-chunk {
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar-section {
    position: static;
    margin-bottom: 20px;
  }

  .knowledge-layout {
    flex-direction: column;
    padding: 16px;
  }

  .search-content {
    flex-direction: column;
  }

  .config-panel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .knowledge-layout {
    padding: 16px;
  }

  .search-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .test-btn {
    align-self: flex-end;
  }
}

/* 配置标签 */
.config-tabs {
  display: flex;
  gap: 3px;
  margin-bottom: 18px;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 3px;
  border: 1px solid #e2e8f0;
  width: 100%;
}

.config-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  font-weight: 600;
  border-radius: 7px;
  position: relative;
  overflow: hidden;
  text-align: center;
  flex: 1;
  min-width: 0;
  width: 100%;
}

.config-tab::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.config-tab:hover {
  color: #1e293b;
  transform: translateY(-1px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px 12px;
}

.config-tab:hover::before {
  opacity: 0.1;
}

.config-tab.active {
  color: white;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px 12px;
}

.config-tab.active::before {
  opacity: 0;
}

/* 确保图标和文字组合居中 */
.config-tab .el-icon {
  flex-shrink: 0;
  font-size: 0.9rem;
}

.config-tab span {
  flex-shrink: 0;
  white-space: nowrap;
}

.config-tab-content {
  min-height: 250px;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  position: relative;
  z-index: 1;
}

/* 搜索方式配置 */
.search-method-section {
  margin-bottom: 18px;
}

.search-method-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-method-option {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.search-method-option::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 1;
}

.search-method-option:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.15);
}

.search-method-option:hover::before {
  opacity: 0.05;
}

.method-radio-label {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
  position: relative;
  z-index: 10;
}

.method-radio {
  margin: 0;
  margin-top: 2px;
  cursor: pointer;
  pointer-events: auto;
  z-index: 10;
  position: relative;
}

.method-content h5 {
  margin: 0 0 6px 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.method-content p {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.3;
}

/* 结果重排配置 */
.result-reorder-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 18px;
}

.reorder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.reorder-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #374151;
}

.toggle-switch {
  width: 48px;
  height: 26px;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-switch.active {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.toggle-slider {
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 50%;
  position: absolute;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(22px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.reorder-config {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reorder-weight,
.reorder-model {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.weight-label,
.model-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.85rem;
}

.weight-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weight-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.weight-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.weight-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.weight-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #6b7280;
}

.weight-btn:hover {
  background: #f3f4f6;
}

.weight-input {
  width: 50px;
  padding: 3px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 0.8rem;
}

.model-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  font-size: 0.8rem;
}

/* 搜索过滤配置 */
.filter-section {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 0.85rem;
}

.filter-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.filter-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.filter-input-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-btn {
  width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #6b7280;
}

.filter-btn:hover {
  background: #f3f4f6;
}

.filter-input {
  width: 70px;
  padding: 3px 6px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  text-align: center;
  font-size: 0.8rem;
}

/* 问题优化配置 */
.optimization-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.optimization-description {
  padding: 12px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #3b82f6;
}

.optimization-description p {
  margin: 0;
  font-size: 0.8rem;
  color: #374151;
  line-height: 1.4;
}

.optimization-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.optimization-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.optimization-label {
  font-weight: 500;
  color: #374151;
  font-size: 0.85rem;
}

.optimization-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.ai-model {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.conversation-background {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.background-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  color: #374151;
  font-size: 0.85rem;
}

.background-textarea {
  padding: 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  line-height: 1.4;
  resize: vertical;
  min-height: 70px;
  font-family: inherit;
}

.background-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.background-textarea::placeholder {
  color: #9ca3af;
}

/* 保存配置按钮 */
.config-save-section {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.save-config-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

.save-config-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.save-config-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.save-config-btn:hover::before {
  left: 100%;
}

.save-config-btn:active {
  transform: translateY(0);
}

</style>
