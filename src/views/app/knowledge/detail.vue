<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {Search, Upload, InfoFilled, ArrowLeft} from '@element-plus/icons-vue'
import {useRoute, useRouter} from 'vue-router'
import Sidebar from '../sidebar.vue'
import {
  ragKnowledgeDataPageApi,
  ragKnowledgeDetailApi, ragKnowledgeDocImportApi,
  ragKnowledgeDocPageApi,
  ragKnowledgeDocPreviewApi
} from "@/api/ai/rag";
import type {
  RagDataQuery,
  RagDocImportBo,
  RagDocPreviewBo,
  RagKnowledgeDocQuery,
  RagKnowledgeVo
} from "@/api/ai/rag/types.ts";

// 路由实例
const route = useRoute()
const router = useRouter()

// 知识库信息
const knowledgeInfo = reactive<RagKnowledgeVo>({
  id: route.params.id,
})

// 搜索条件
const searchForm = reactive({
  fileName: '',
  status: ''
})

// 文档列表
const documentList = ref<any[]>([])

// 分页信息
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 加载状态
const loading = ref(false)

// 切片查看相关
const showSliceView = ref(false)
const currentDocument = ref<any>(null)
const sliceList = ref<any[]>([])

// 数据查看相关
const showDataView = ref(false)
const tableData = ref<any[]>([])
const tableColumns = ref<string[]>([])

// 导入数据相关
const files = ref<FileItem[]>([])
const importDialogVisible = ref(false)
const importForm = reactive({
  slicingMethod: 'smart', // 智能切分
  maxSegmentLength: 600,
  segmentOverlapLength: 100,
  customSlicingType: 'length', // 按长度切分
  customRegex: ''
})

// 切片方式选项
const slicingOptions = [
  {
    value: 'smart',
    label: '智能切分',
    description: '在通用文档上的最优chunk切分方法,经过评测可在多数文档上获得最佳的检索效果'
  },
  {
    value: 'character',
    label: '按长度切分',
    description: '适合对 Token 数量有严格要求的场景,比如使用上下文长度较小的模型时。'
  },
  {
    value: 'paragraph',
    label: '按标题切分',
    description: '适合于用标题划分并传达独立主题的文档,要求不同级标题下的内容不会混杂在同一文本切片中。'
  },
  {
    value: 'regex',
    label: '按照正则切分',
    description: '依据设置的正则表达式,对知识库中的文本进行切分。'
  }
]

// 预览数据相关
const previewData = ref<any[]>([])
const showPreview = ref(false)
const activePreviewTab = ref(0)

// 状态选项
const statusOptions = [
  {label: '全部状态', value: ''},
  {label: '解析完成', value: '6'},
  {label: '解析中', value: '1'},
  {label: '解析失败', value: '2'}
]

// 初始化
onMounted(() => {
  initData()
})

// 初始化数据
const initData = () => {
  // 从路由参数获取知识库信息
  loadKnowledgeInfo()
  // 加载文档列表
  loadDocumentList()
}

const loadKnowledgeInfo = async () => {
  ragKnowledgeDetailApi(route.params.id).then((res: any) => {
    if (res.code === 0) {
      Object.assign(knowledgeInfo, res.data)
    }
  })
}

// 加载文档列表
const loadDocumentList = async () => {
  loading.value = true
  try {
    let query = <PageQuery<RagKnowledgeDocQuery>>({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      query: {
        name: searchForm.fileName,
        knowledgeId: knowledgeInfo.id,
      }
    })
    const res = await ragKnowledgeDocPageApi(query)
    documentList.value = res.data.rows || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('加载文档列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.pageNum = 1
  loadDocumentList()
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

// 导入数据
const importData = () => {
  importDialogVisible.value = true
}

// 关闭导入对话框
const closeImportDialog = () => {
  importDialogVisible.value = false
  // 重置表单
  importForm.slicingMethod = 'smart'
  importForm.maxSegmentLength = 600
  importForm.segmentOverlapLength = 100
  importForm.customSlicingType = 'length'
  importForm.customRegex = ''
}

// 确认导入
const confirmImport = () => {
  console.log(JSON.stringify(files.value))
  if (files.value.length == 0) {
    ElMessage.error('文件不能为空')
    return
  }
  let data: RagDocPreviewBo = {
    knowledgeId: knowledgeInfo.id,
    fileIds: files.value?.map(item => String(item.id)),
    chunkSplitMode: importForm.slicingMethod,
    maxSegmentSize: importForm.maxSegmentLength,
    maxOverlapSize: importForm.segmentOverlapLength,
    regex: importForm.maxSegmentLength,
  }
  ragKnowledgeDocPreviewApi(data).then((res: any) => {
    if (res.code === 0) {
      console.log(JSON.stringify(res.data))
      previewData.value = res.data // 保存所有文件的数据
      activePreviewTab.value = 0 // 默认显示第一个文件
      showPreview.value = true
    }
  })
}

// 确认导入预览数据
const confirmPreviewImport = () => {
  // 根据预览数据构建files数组
  const filesData = previewData.value.map(file => ({
    fileId: file.fileId,
    fileName: file.fileName,
    fileType: file.fileType,
    fileSize: file.fileSize,
    tableCols: file.tableCols,
    tableRows: file.tableRows,
    texts: file.texts,
    chunkSplitMode: file.chunkSplitMode,
    maxSegmentSize: file.maxSegmentSize,
    maxOverlapSize: file.maxOverlapSize,
    regex: file.regex
  }))

  let data: RagDocImportBo = {
    knowledgeId: knowledgeInfo.id,
    files: filesData
  }

  console.log('导入数据:', JSON.stringify(data))

  ragKnowledgeDocImportApi(data).then((res: any) => {
    if (res.code === 0) {
      console.log('导入成功:', JSON.stringify(res.data))
      ElMessage.success('数据导入成功')
      showPreview.value = false
      previewData.value = []
      activePreviewTab.value = 0
      loadDocumentList()
    } else {
      ElMessage.error('导入失败: ' + (res.msg || '未知错误'))
    }
  }).catch((error) => {
    console.error('导入失败:', error)
    ElMessage.error('导入失败: ' + error.message)
  })

  closeImportDialog()
}

// 取消预览
const cancelPreview = () => {
  showPreview.value = false
  previewData.value = []
  activePreviewTab.value = 0
}

// 切换预览标签
const switchPreviewTab = (index: number) => {
  activePreviewTab.value = index
}

// 查看Meta信息
const viewMetaInfo = (doc: any) => {
  ElMessage.info(`查看 ${doc.fileName} 的Meta信息`)
}

// 查看切片
const viewSlices = async (doc: any) => {

  currentDocument.value = doc
  showSliceView.value = true

  try {
    let query = <PageQuery<RagDataQuery>>({
      pageNum: 1,
      pageSize: 100,
      query: {
        knowledgeId: knowledgeInfo.id,
        docId: doc.id,
      }
    })
    const res = await ragKnowledgeDataPageApi(query)

    // 处理切片数据
    sliceList.value = (res.data.rows || []).map((item: any, index: number) => ({
      id: item.id || `slice_${index}`,
      title: `切片${String(index).padStart(2, '0')}`,
      content: item.content || '',
      enabled: true
    }))

    ElMessage.success('切片数据加载完成')
  } catch (error) {
    console.error('加载切片数据失败:', error)
    ElMessage.error('加载切片数据失败')
  }
}

// 返回文档列表
const backToDocumentList = () => {
  showSliceView.value = false
  currentDocument.value = null
  sliceList.value = []
}

// 切换切片启用状态
const toggleSlice = (slice: any) => {
  slice.enabled = !slice.enabled
  ElMessage.success(`${slice.title} ${slice.enabled ? '已启用' : '已禁用'}`)
}

// 查看数据
const viewData = async (doc: any) => {
  currentDocument.value = doc
  showDataView.value = true

  try {
    let query = <PageQuery<RagDataQuery>>({
      pageNum: 1,
      pageSize: 100,
      query: {
        knowledgeId: knowledgeInfo.id,
        docId: doc.id,
      }
    })
    const res = await ragKnowledgeDataPageApi(query)

    // 处理metadata数据
    const processedData = (res.data.rows || []).map((item: any, index: number) => {
      let metadata = {}
      try {
        // 解析metadata字段的JSON字符串
        if (item.metadata && typeof item.metadata === 'string') {
          metadata = JSON.parse(item.metadata)
        } else if (item.metadata && typeof item.metadata === 'object') {
          metadata = item.metadata
        }
      } catch (error) {
        console.warn('解析metadata失败:', error)
        metadata = {}
      }

      return {
        ...metadata, // 展开metadata中的字段
      }
    })

    // 动态获取所有列名
    const allColumns = new Set<string>()
    processedData.forEach(row => {
      Object.keys(row).forEach(key => {
        allColumns.add(key)
      })
    })

    // 设置表格数据和列
    tableData.value = processedData
    tableColumns.value = Array.from(allColumns)

    ElMessage.success('数据加载完成')
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 返回文档列表
const backToDocumentListFromData = () => {
  showDataView.value = false
  currentDocument.value = null
  tableData.value = []
}

// 获取返回操作
const getBackAction = () => {
  if (showSliceView.value) {
    backToDocumentList()
  } else if (showDataView.value) {
    backToDocumentListFromData()
  } else {
    goBack()
  }
}

// 获取返回按钮文本
const getBackText = () => {
  if (showSliceView.value) {
    return '返回文档列表'
  } else if (showDataView.value) {
    return '返回文档列表'
  } else {
    return '返回知识库'
  }
}

// 删除文档
const deleteDocument = (doc: any) => {
  ElMessage.success(`删除 ${doc.fileName} 成功`)
  loadDocumentList()
}

// 获取状态样式类
const getStatusClass = (status: string) => {
  const statusMap: Record<string, string> = {
    '6': 'status-completed',
    '1': 'status-parsing',
    '2': 'status-failed'
  }
  return statusMap[status] || 'status-default'
}

</script>

<template>
  <div class="knowledge-container">
    <div class="knowledge-layout">
      <!-- 左侧边栏 -->
      <div class="sidebar-section">
        <Sidebar/>
      </div>

      <!-- 主内容区域 -->
      <div class="main-content">
        <div class="knowledge-detail-container">
          <!-- 头部导航 -->
          <div class="header-nav">
            <div class="nav-left">
              <button class="back-btn" @click="getBackAction()">
                <el-icon>
                  <ArrowLeft/>
                </el-icon>
                {{ getBackText() }}
              </button>
              <div class="knowledge-info">
                <h1 class="knowledge-title">{{ knowledgeInfo.name }}</h1>
                <span class="knowledge-type">{{ knowledgeInfo.type }}</span>
              </div>
            </div>
          </div>

          <!-- 文档列表视图 -->
          <div v-if="!showSliceView && !showDataView">
            <!-- 搜索和操作区域 -->
            <div class="search-actions-section">
              <div class="search-section">
                <div class="search-form">
                  <div class="search-input-group">
                    <input
                      v-model="searchForm.fileName"
                      type="text"
                      placeholder="搜索文件名称"
                      class="search-input"
                    />
                    <button class="search-btn" @click="handleSearch">
                      <el-icon>
                        <Search/>
                      </el-icon>
                      搜索
                    </button>
                  </div>
                </div>
              </div>

              <div class="actions-section">
                <button class="action-btn meta-btn" @click="viewMetaInfo({})">
                  <el-icon>
                    <InfoFilled/>
                  </el-icon>
                  Meta信息
                </button>
                <button class="action-btn import-btn primary" @click="importData">
                  <el-icon>
                    <Upload/>
                  </el-icon>
                  导入数据
                </button>
              </div>
            </div>

            <!-- 文档列表 -->
            <div class="document-list-section">
              <div class="table-container">
                <table class="document-table">
                  <thead>
                  <tr>
                    <th>文件名称</th>
                    <th>文件格式</th>
                    <th>文件大小</th>
                    <th>状态</th>
                    <th>导入时间</th>
                    <th>切片数量</th>
                    <th>操作</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="doc in documentList" :key="doc.id" class="document-row">
                    <td class="file-name-cell">
                      <div class="file-name-content">
                        <span class="file-name" @click="viewSlices(doc)">{{ doc.name }}</span>
                        <el-icon v-if="doc.hasInfo" class="info-icon">
                          <InfoFilled/>
                        </el-icon>
                      </div>
                    </td>
                    <td class="file-format-cell">
                      <div class="format-content">
                        <span class="format-text">{{ doc.fileType }}</span>
                      </div>
                    </td>
                    <td class="file-size-cell">{{ doc.fileSize || 0 }}</td>
                    <td class="status-cell">
                        <span class="status-badge" :class="getStatusClass(doc.status)">
                          <span class="status-icon">✓</span>
                          {{ doc.statusText }}
                        </span>
                    </td>
                    <td class="import-time-cell">{{ doc.createTime }}</td>
                    <td class="file-size-cell">{{ doc.chunkNum || 0 }}</td>
                    <td class="operations-cell">
                      <div class="operations">
                          <span
                            v-if="doc.type === 'document'"
                            class="operation-link"
                            @click="viewSlices(doc)"
                          >
                            查看切片
                          </span>
                        <span
                          v-else-if="doc.type === 'table' || doc.type === 'image'"
                          class="operation-link"
                          @click="viewData(doc)"
                        >
                            查看数据
                          </span>
                        <span class="operation-separator">|</span>
                        <span class="operation-link delete-link" @click="deleteDocument(doc)">删除</span>
                      </div>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>

              <!-- 分页 -->
              <div class="pagination-wrapper">
                <div class="pagination-info">
                  共 {{ pagination.total }} 条记录
                </div>
              </div>
            </div>
          </div>

          <!-- 切片列表视图 -->
          <div v-else-if="showSliceView" class="slice-list-section">
            <div class="slice-list-header">
              <div class="slice-list-info">
                <h2 class="slice-list-title">{{ currentDocument?.name }} - 切片列表</h2>
                <p class="slice-list-subtitle">管理文档的切片内容，可以启用或禁用特定切片</p>
              </div>
            </div>

            <div class="slice-list-content">
              <div class="slice-list">
                <div v-for="slice in sliceList" :key="slice.id" class="slice-item">
                  <div class="slice-header">
                    <div class="slice-title-section">
                      <h4 class="slice-title">{{ slice.title }}</h4>
                      <div class="slice-toggle">
                        <label class="toggle-switch">
                          <input
                            type="checkbox"
                            :checked="slice.enabled"
                            @change="toggleSlice(slice)"
                          />
                          <span class="toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="slice-content">
                    <p class="slice-text">{{ slice.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 数据列表视图 -->
          <div v-else-if="showDataView" class="data-list-section">
            <div class="data-list-header">
              <div class="data-list-info">
                <h2 class="data-list-title">{{ currentDocument?.name }} - 数据列表</h2>
                <p class="data-list-subtitle">查看和管理表格数据</p>
              </div>
            </div>

            <div class="data-list-content">
              <div class="data-table-container">
                <table class="data-table">
                  <thead>
                  <tr>
                    <th v-for="column in tableColumns" :key="column">{{ column }}</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="row in tableData" :key="row.id" class="data-row">
                    <td v-for="column in tableColumns" :key="column">{{ row[column] || '-' }}</td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入数据对话框 -->
    <div v-if="importDialogVisible" class="import-dialog-overlay" @click="closeImportDialog">
      <div class="import-dialog" @click.stop>
        <div class="import-dialog-header">
          <h3 class="import-dialog-title">导入数据</h3>
          <button class="close-btn" @click="closeImportDialog">
            <el-icon>
              <Close/>
            </el-icon>
          </button>
        </div>

        <div class="import-dialog-content">
          <!-- 文件上传区域 -->
          <div class="file-upload-section">
            <div v-if="knowledgeInfo.type == 'document'" class="file-upload-area">

              <FaFileUpload
                v-model="files"
                action="/file/upload"
                :after-upload="(response) => response.data.fileUrl"
                multiple
                :ext="['pdf','doc','docx','ppt','pptx', 'xlsx','xls','txt','md','html']"
                :size="20 * 1024 * 1024"
                :max="5"
                class="custom-audio-upload"
              />
            </div>
            <div v-else class="file-upload-area">

              <FaFileUpload
                v-model="files"
                action="/file/upload"
                :after-upload="(response) => response.data.fileUrl"
                multiple
                :ext="['xlsx','xls']"
                :size="10 * 1024 * 1024"
                :max="5"
                class="custom-audio-upload"
              />
            </div>
          </div>

          <!-- 切片配置区域（仅文档类型显示） -->
          <div v-if="knowledgeInfo.type === 'document'" class="slicing-config-section">
            <h4 class="section-title">切片方式 <span class="required">*</span></h4>

            <!-- 切片方式选择 -->
            <div class="slicing-method-grid">
              <div
                v-for="option in slicingOptions"
                :key="option.value"
                class="slicing-option"
              >
                <label class="slicing-card" :class="{ active: importForm.slicingMethod === option.value }">
                  <input
                    type="radio"
                    v-model="importForm.slicingMethod"
                    :value="option.value"
                    class="slicing-radio"
                  />
                  <div class="slicing-content">
                    <h5 class="slicing-title">{{ option.label }}</h5>
                    <p class="slicing-description">{{ option.description }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- 正则表达式配置 -->
            <div v-if="importForm.slicingMethod === 'regex'" class="regex-config">
              <div class="config-group">
                <label class="config-label">正则表达式</label>
                <input
                  v-model="importForm.customRegex"
                  type="text"
                  placeholder="请输入正则表达式"
                  class="config-input"
                />
              </div>
            </div>

            <!-- 分段参数配置 -->
            <div class="segment-params">
              <div class="param-group">
                <label class="param-label">
                  分段预估长度
                  <span class="param-value">{{ importForm.maxSegmentLength }}</span>
                </label>
                <div class="slider-container">
                  <input
                    type="range"
                    v-model="importForm.maxSegmentLength"
                    min="10"
                    max="6000"
                    class="param-slider"
                  />
                  <div class="slider-labels">
                    <span>10</span>
                    <span>6000</span>
                  </div>
                </div>
                <input
                  v-model="importForm.maxSegmentLength"
                  type="number"
                  min="10"
                  max="6000"
                  class="param-input"
                />
              </div>

              <div class="param-group">
                <label class="param-label">
                  分段重叠长度
                  <span class="param-value">{{ importForm.segmentOverlapLength }}</span>
                </label>
                <div class="slider-container">
                  <input
                    type="range"
                    v-model="importForm.segmentOverlapLength"
                    min="0"
                    max="1024"
                    class="param-slider"
                  />
                  <div class="slider-labels">
                    <span>0</span>
                    <span>1024</span>
                  </div>
                </div>
                <input
                  v-model="importForm.segmentOverlapLength"
                  type="number"
                  min="0"
                  max="1024"
                  class="param-input"
                />
              </div>
            </div>
          </div>

          <!-- 预览数据区域 -->
          <div v-if="showPreview && previewData.length > 0" class="preview-section">
            <h4 class="section-title">数据预览</h4>

            <!-- Tab标签 -->
            <div class="preview-tabs">
              <div
                v-for="(file, index) in previewData"
                :key="index"
                class="preview-tab"
                :class="{ active: activePreviewTab === index }"
                @click="switchPreviewTab(index)"
              >
                <span class="tab-name">{{ file.fileName }}</span>
                <span class="tab-type">{{ file.fileType }}</span>
              </div>
            </div>

            <!-- 当前选中文件的信息 -->
            <div v-if="previewData[activePreviewTab]" class="preview-info">
              <div class="preview-item">
                <span class="preview-label">文件名：</span>
                <span class="preview-value">{{ previewData[activePreviewTab].fileName }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">文件类型：</span>
                <span class="preview-value">{{ previewData[activePreviewTab].fileType }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">文件大小：</span>
                <span class="preview-value">{{ previewData[activePreviewTab].fileSize }}</span>
              </div>
            </div>

            <!-- 当前选中文件的数据展示 -->
            <div v-if="previewData[activePreviewTab]" class="preview-content-container">
              <!-- 表格数据展示（table和image类型） -->
              <div v-if="previewData[activePreviewTab].tableCols && previewData[activePreviewTab].tableRows" class="preview-table-container">
                <table class="preview-table">
                  <thead>
                   <tr>
                     <th v-for="col in previewData[activePreviewTab].tableCols" :key="col.prop">
                       {{ col.label }}
                     </th>
                   </tr>
                  </thead>
                  <tbody>
                   <tr v-for="(row, index) in previewData[activePreviewTab].tableRows" :key="index">
                     <td v-for="col in previewData[activePreviewTab].tableCols" :key="col.prop">
                       {{ row[col.prop] || '-' }}
                     </td>
                   </tr>
                  </tbody>
                </table>
              </div>

              <!-- 文本块展示（document类型） -->
              <div v-else-if="previewData[activePreviewTab].texts" class="preview-texts-container">
                <div class="texts-header">
                  <span class="texts-count">共 {{ previewData[activePreviewTab].texts.length }} 个文本块</span>
                </div>
                <div class="texts-list">
                  <div
                    v-for="(text, index) in previewData[activePreviewTab].texts"
                    :key="index"
                    class="text-block"
                  >
                    <div class="text-block-header">
                      <span class="text-block-number">块 {{ index + 1 }}</span>
                      <span class="text-block-length">{{ text.length }} 字符</span>
                    </div>
                    <div class="text-block-content">
                      {{ text }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="import-dialog-footer">
          <button class="cancel-btn" @click="showPreview ? cancelPreview() : closeImportDialog()">
            {{ showPreview ? '返回' : '取消' }}
          </button>
          <button
            v-if="!showPreview"
            class="confirm-btn"
            @click="confirmImport"
          >
            导入预览
          </button>
          <button
            v-if="showPreview"
            class="confirm-btn"
            @click="confirmPreviewImport"
          >
            确认导入
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-container {
  min-height: calc(100vh - 101px);
  background: #f5f7fa;
  display: flex;
}

.knowledge-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

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

.main-content {
  flex: 1;
  margin-left: 239px;
  padding: 20px;
  overflow-y: auto;
  min-height: calc(100vh - 101px);
}

.knowledge-detail-container {
  min-height: 100vh;
}

/* 头部导航 */
.header-nav {
  margin-bottom: 24px;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #f9fafb;
  color: #374151;
}

.knowledge-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.knowledge-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.knowledge-type {
  padding: 4px 12px;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* 搜索和操作区域 */
.search-actions-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
}

.search-section {
  flex: 1;
}

.search-form {
  display: flex;
  gap: 12px;
}

.search-input-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  width: 200px;
}

.status-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-btn:hover {
  background: #2563eb;
}

.actions-section {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f9fafb;
  color: #374151;
}

.action-btn.primary {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.action-btn.primary:hover {
  background: #2563eb;
}

/* 文档列表 */
.document-list-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

.document-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.document-table th {
  background: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.document-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
}

.document-row:hover {
  background: #f8f9fa;
}

/* 文件名称 */
.file-name-cell {
  min-width: 200px;
}

.file-name-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  color: #3b82f6;
  cursor: pointer;
  font-weight: 500;
}

.file-name:hover {
  text-decoration: underline;
}

.info-icon {
  color: #9ca3af;
  font-size: 0.8rem;
}

/* 文件格式 */
.file-format-cell {
  min-width: 120px;
}

.format-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.format-icon {
  font-size: 1.2rem;
}

.format-text {
  font-weight: 500;
}

/* 状态 */
.status-cell {
  min-width: 120px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-completed {
  background: #dcfce7;
  color: #16a34a;
}

.status-parsing {
  background: #fef3c7;
  color: #d97706;
}

.status-failed {
  background: #fee2e2;
  color: #dc2626;
}

.status-icon {
  font-size: 0.7rem;
}

/* 类目 */
.category-cell {
  min-width: 180px;
}

.category-text {
  color: #6b7280;
}

.external-icon {
  margin-left: 4px;
  color: #9ca3af;
  font-size: 0.8rem;
}

/* 操作 */
.operations-cell {
  min-width: 200px;
}

.operations {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operation-link {
  color: #3b82f6;
  cursor: pointer;
  font-size: 0.85rem;
}

.operation-link:hover {
  text-decoration: underline;
}

.operation-link.delete-link {
  color: #dc2626;
}

.operation-separator {
  color: #d1d5db;
  font-size: 0.8rem;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px;
  border-top: 1px solid #e5e7eb;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.9rem;
}

/* 切片列表视图 */
.slice-list-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.slice-list-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.slice-list-info {
  text-align: center;
}

.slice-list-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.slice-list-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
}

.slice-list-content {
  padding: 24px;
}

.slice-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.slice-item {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
}

.slice-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.slice-header {
  margin-bottom: 16px;
}

.slice-title-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slice-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.slice-toggle {
  display: flex;
  align-items: center;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #d1d5db;
  transition: 0.3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #3b82f6;
}

input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.slice-content {
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.slice-text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #374151;
  word-break: break-word;
}

/* 数据列表视图 */
.data-list-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.data-list-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.data-list-info {
  text-align: center;
}

.data-list-title {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
}

.data-list-subtitle {
  margin: 0;
  font-size: 1rem;
  color: #6b7280;
}

.data-list-content {
  padding: 24px;
}

.data-table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
  background: white;
}

.data-table th {
  background: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.data-table th:last-child {
  border-right: none;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  border-right: 1px solid #f3f4f6;
  color: #6b7280;
}

.data-table td:last-child {
  border-right: none;
}

.data-row:hover {
  background: #f8f9fa;
}

.content-cell {
  max-width: 200px;
}

.content-preview {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: help;
}

/* 导入数据对话框 */
.import-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.import-dialog {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.import-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.import-dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.import-dialog-content {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 文件上传区域 */
.file-upload-section {
  margin-bottom: 24px;
}

/* 预览数据区域 */
.preview-section {
  margin-bottom: 24px;
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

/* Tab标签样式 */
.preview-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0;
}

.preview-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;
  position: relative;
  bottom: -1px;
}

.preview-tab:hover {
  background: #f0f9ff;
  border-color: #3b82f6;
}

.preview-tab.active {
  background: white;
  border-color: #3b82f6;
  border-bottom: 1px solid white;
  z-index: 1;
}

.tab-name {
  font-weight: 500;
  color: #374151;
  font-size: 0.9rem;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.preview-tab.active .tab-name {
  color: #3b82f6;
  font-weight: 600;
}

.tab-type {
  font-size: 0.75rem;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 4px;
  text-transform: uppercase;
}

.preview-tab.active .tab-type {
  background: #dbeafe;
  color: #1d4ed8;
}

.preview-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-weight: 500;
  color: #374151;
  min-width: 80px;
}

.preview-value {
  color: #1f2937;
  font-weight: 500;
}

.preview-table-container {
  max-height: 300px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
}

.preview-table th {
  background: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1;
}

.preview-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #1f2937;
}

.preview-table tbody tr:hover {
  background: #f9fafb;
}

.preview-table tbody tr:last-child td {
  border-bottom: none;
}

/* 预览内容容器 */
.preview-content-container {
  width: 100%;
}

/* 文本块展示样式 */
.preview-texts-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

.texts-header {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
}

.texts-count {
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
}

.texts-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fafafa;
  overflow: hidden;
}

.text-block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f0f0f0;
  border-bottom: 1px solid #e5e7eb;
}

.text-block-number {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.text-block-length {
  font-size: 0.8rem;
  color: #6b7280;
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 4px;
}

.text-block-content {
  padding: 12px;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #1f2937;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.file-upload-area {
  text-align: center;
  padding: 40px 20px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.file-upload-area:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.file-upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.file-upload-btn:hover {
  background: #2563eb;
}

.file-upload-tip {
  margin: 12px 0 0 0;
  font-size: 0.9rem;
  color: #6b7280;
}

/* 切片配置区域 */
.slicing-config-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.required {
  color: #dc2626;
}

/* 切片方式选择 */
.slicing-method-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.slicing-option {
  width: 100%;
}

.slicing-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
  position: relative;
  height: 100%;
}

.slicing-card:hover {
  border-color: #d1d5db;
}

.slicing-card.active {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.slicing-radio {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 16px;
  height: 16px;
  margin: 0;
  cursor: pointer;
}

.slicing-content {
  padding-right: 24px;
}

.slicing-title {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
}

.slicing-description {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
  line-height: 1.4;
}

/* 正则表达式配置 */
.regex-config {
  margin-bottom: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
}

.config-group {
  margin-bottom: 16px;
}

.config-group:last-child {
  margin-bottom: 0;
}

.config-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
}

.config-select,
.config-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.config-select:focus,
.config-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* 分段参数配置 */
.segment-params {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.param-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.param-label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
  font-weight: 500;
  color: #374151;
}

.param-value {
  color: #3b82f6;
  font-weight: 600;
}

.slider-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
}

.param-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
}

.param-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #6b7280;
}

.param-input {
  width: 80px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

.param-input:focus {
  outline: none;
  border-color: #3b82f6;
}

/* 对话框底部 */
.import-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f8f9fa;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: white;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f9fafb;
  color: #374151;
}

.confirm-btn {
  background: #3b82f6;
  border: 1px solid #3b82f6;
  color: white;
}

.confirm-btn:hover {
  background: #2563eb;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar-section {
    position: static;
    margin-bottom: 20px;
  }

  .knowledge-layout {
    flex-direction: column;
  }

  /* Tab标签移动端适配 */
  .preview-tabs {
    flex-wrap: wrap;
    gap: 4px;
  }

  .preview-tab {
    min-width: 100px;
    padding: 8px 12px;
  }

  .tab-name {
    max-width: 80px;
    font-size: 0.8rem;
  }

  /* 切片方式网格移动端适配 */
  .slicing-method-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .slicing-card {
    padding: 12px;
  }

  .slicing-title {
    font-size: 0.9rem;
  }

  .slicing-description {
    font-size: 0.75rem;
  }
}

@media (max-width: 768px) {
  .knowledge-layout {
    padding: 16px;
  }

  .search-actions-section {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input-group {
    flex-wrap: wrap;
  }

  .search-input {
    width: 100%;
  }

  .actions-section {
    justify-content: center;
  }
}
</style>
