<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import {ElMessage} from 'element-plus'
import {Search, Plus, ZoomIn, Edit, Delete, Close, Check, ArrowDown} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'
import Sidebar from './sidebar.vue'
import type {RagKnowledgeBo, RagKnowledgeQuery, RagKnowledgeVo} from "@/api/ai/rag/types.ts";
import {ragKnowledgeDeleteApi, ragKnowledgePageApi, ragKnowledgeSaveApi, ragKnowledgeUpdateApi} from "@/api/ai/rag";

// 路由实例
const router = useRouter()

// 当前选中的标签
const activeTab = ref('全部')

// 标签选项
const tabs = ref([
  {label: '全部', value: '全部'},
  {label: '文档', value: '文档'},
  {label: '数据', value: '数据'},
  {label: '图片', value: '图片'}
])

// 知识库列表
const knowledgeList = ref<RagKnowledgeVo[]>([])

// 分页信息
const pagination = reactive({
  pageNum: 1,
  pageSize: 12,
  total: 0
})

// 搜索关键词
const searchKeyword = ref('')

// 加载状态
const loading = ref(false)

// 文档数量映射
const docCountMap = ref<Record<string, number>>({})

// 创建知识库对话框
const createDialogVisible = ref(false)
const createForm = reactive({
  name: '',
  type: '',
  scenario: 'basic',
  description: '',
  dataSource: 'upload',
  category: 'default',
  uploadedFiles: []
})

// 表格数据
const tableData = ref<any[]>([])
const tableColumns = ref<any[]>([])

// 添加行对话框
const addRowDialogVisible = ref(false)
const newRowData = ref<any>({})

// 当前编辑的行索引
const editingRowIndex = ref(-1)

// 编辑模式状态
const isEditMode = ref(false)
const editingKnowledgeId = ref('')

// 图片预览
const imagePreviewVisible = ref(false)
const previewImageUrl = ref('')

// 初始化
onMounted(() => {
  initData()
})

// 初始化数据
const initData = async () => {
  loadKnowledgeData()
}

// 加载知识库数据
const loadKnowledgeData = async () => {
  loading.value = true
  try {
    let query = <PageQuery<RagKnowledgeQuery>>({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      query: {
        type: activeTab.value === '全部' ? undefined : getTypeByTab(activeTab.value),
        name: searchKeyword.value,
      }
    })
    const res = await ragKnowledgePageApi(query)
    knowledgeList.value = res.data.rows || []
    pagination.total = res.data.total || 0

    // 加载每个知识库的文档数量
    await loadDocCounts()
  } catch (error) {
    console.error('加载知识库数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 创建/更新知识库
const createKnowledge = () => {
  if (!createForm.name.trim()) {
    ElMessage.warning('请输入知识库名称')
    return
  }

  // 从表格数据中获取 tableConfig
  const tableConfig = tableData.value.map(item => ({
    key: item.field_name,
    name: item.field_remark,
    type: item.field_type,
    enableSearch: item.is_searchable || false,
    enableLlm: item.is_model_reply || false
  }))

  let data = <RagKnowledgeBo>({
    type: createForm.type,
    name: createForm.name,
    remark: createForm.description,
    tableConfig: tableConfig
  })

  if (isEditMode.value) {
    data.id = editingKnowledgeId.value
    ragKnowledgeUpdateApi(data).then((res: any) => {
      if (res.code === 0) {
        ElMessage.success('知识库更新成功')
        createDialogVisible.value = false
        resetCreateForm()
        loadKnowledgeData()
      } else {
        ElMessage.error(res.msg || '更新失败')
      }
    }).catch((error) => {
      console.error('更新知识库失败:', error)
    })
  } else {
    ragKnowledgeSaveApi(data).then((res: any) => {
      if (res.code === 0) {
        ElMessage.success('知识库创建成功')
        createDialogVisible.value = false
        resetCreateForm()
        loadKnowledgeData()
      } else {
        ElMessage.error(res.msg || '创建失败')
      }
    }).catch((error) => {
      console.error('创建知识库失败:', error)
    })
  }

}

// 重置创建表单
const resetCreateForm = () => {
  createForm.name = ''
  createForm.type = 'document'
  createForm.scenario = 'basic'
  createForm.description = ''
  createForm.dataSource = 'upload'
  createForm.category = 'default'
  createForm.uploadedFiles = []
  // 清空表格数据
  tableData.value = []
  // 重置编辑模式状态
  isEditMode.value = false
  editingKnowledgeId.value = ''
}

// 删除知识库
const deleteKnowledge = (id: string) => {
  ragKnowledgeDeleteApi([id]).then((res: any) => {
    if (res.code === 0) {
      ElMessage.success('删除成功')
    }
  })
  loadKnowledgeData()
}

// 搜索处理
const handleSearch = () => {
  pagination.pageNum = 1
  loadKnowledgeData()
}

// 筛选处理
const handleFilter = () => {
  pagination.pageNum = 1
  loadKnowledgeData()
}

// 打开图片预览
const openImagePreview = (imageUrl: string) => {
  previewImageUrl.value = imageUrl
  imagePreviewVisible.value = true
}

// 关闭图片预览
const closeImagePreview = () => {
  imagePreviewVisible.value = false
  previewImageUrl.value = ''
}

// 根据标签获取类型
const getTypeByTab = (tab: string) => {
  const typeMap: Record<string, string> = {
    '文档': 'document',
    '数据': 'table',
    '图片': 'image'
  }
  return typeMap[tab]
}

// 获取卡片图标
const getCardIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    'document': '📄',
    'table': '📊',
    'image': '🖼️'
  }
  return iconMap[type] || '📄'
}

// 获取卡片图标样式类
const getCardIconClass = (type: string) => {
  const classMap: Record<string, string> = {
    'document': 'icon-document',
    'table': 'icon-data',
    'image': 'icon-image'
  }
  return classMap[type] || 'icon-document'
}

// 加载文档数量
const loadDocCounts = async () => {
  // 这里可以调用API获取每个知识库的文档数量
  // 暂时使用模拟数据
  knowledgeList.value.forEach(knowledge => {
    docCountMap.value[knowledge.id] = Math.floor(Math.random() * 10) + 1
  })
}

// 编辑知识库
const editKnowledge = (knowledge: RagKnowledgeVo) => {
  // 设置编辑模式
  isEditMode.value = true
  editingKnowledgeId.value = knowledge.id

  // 填充表单数据
  createForm.name = knowledge.name
  createForm.type = knowledge.type
  createForm.description = knowledge.remark

  // 如果有表格配置数据，解析并填充到表格中
  if (knowledge.tableConfigJson) {
    try {
      const tableConfig = JSON.parse(knowledge.tableConfigJson)
      tableData.value = tableConfig.map((item: any) => ({
        field_name: item.key || item.fieldName,
        field_remark: item.name || item.fieldRemark,
        field_type: item.type || item.fieldType,
        is_searchable: item.enableSearch || item.isSearchable || false,
        is_model_reply: item.enableLlm || item.isModelReply || false
      }))
    } catch (error) {
      console.error('解析表格配置失败:', error)
      tableData.value = []
    }
  } else {
    tableData.value = []
  }

  // 初始化表格列
  initTableColumns()

  // 打开编辑对话框
  createDialogVisible.value = true
}

// 检索知识库
const searchKnowledge = (knowledge: RagKnowledgeVo) => {
  console.log('检索知识库:', knowledge)
  try {
    // 跳转到知识库搜索页面
    const targetPath = `/app/knowledge/${knowledge.id}/search`
    console.log('跳转路径:', targetPath)

    router.push(targetPath).then(() => {
      console.log('路由跳转成功')
    }).catch((error) => {
      console.error('路由跳转失败:', error)
      ElMessage.error('页面跳转失败: ' + error.message)
    })
  } catch (error) {
    console.error('检索知识库失败:', error)
    ElMessage.error('检索知识库失败')
  }
}

// 进入知识库
const enterKnowledge = (knowledge: RagKnowledgeVo) => {
  console.log('进入知识库:', knowledge)
  try {
    // 跳转到知识库详情页面
    const targetPath = `/app/knowledge/${knowledge.id}`
    console.log('跳转路径:', targetPath)

    // 使用简单的路径跳转
    router.push(targetPath).then(() => {
      console.log('路由跳转成功')
    }).catch((error) => {
      console.error('路由跳转失败:', error)
      ElMessage.error('页面跳转失败: ' + error.message)
    })
  } catch (error) {
    console.error('进入知识库失败:', error)
    ElMessage.error('进入知识库失败')
  }
}

// 分页大小改变
const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  loadKnowledgeData()
}

// 当前页改变
const handleCurrentChange = (page: number) => {
  pagination.pageNum = page
  loadKnowledgeData()
}

// 初始化表格列
const initTableColumns = () => {
  tableColumns.value = [
    {key: 'field_name', label: '字段名称', type: 'text', required: true},
    {key: 'field_remark', label: '字段描述', type: 'text', required: false},
    {
      key: 'field_type',
      label: '字段类型',
      type: 'select',
      options: ['string', 'int', 'boolean', 'url'],
      required: true
    },
    {key: 'is_searchable', label: '是否参与检索', type: 'checkbox', required: false},
    {key: 'is_model_reply', label: '是否参与模型回复', type: 'checkbox', required: false}
  ]
}

// 添加新行
const addNewRow = () => {
  newRowData.value = {}
  editingRowIndex.value = -1
  addRowDialogVisible.value = true
}

// 编辑行
const editRow = (index: number) => {
  newRowData.value = {...tableData.value[index]}
  editingRowIndex.value = index
  addRowDialogVisible.value = true
}

// 删除行
const deleteRow = (index: number) => {
  tableData.value.splice(index, 1)
  ElMessage.success('删除成功')
}

// 保存行数据
const saveRowData = () => {
  if (editingRowIndex.value >= 0) {
    // 编辑模式
    tableData.value[editingRowIndex.value] = {...newRowData.value}
    ElMessage.success('更新成功')
  } else {
    // 新增模式
    tableData.value.push({...newRowData.value})
    ElMessage.success('添加成功')
  }
  addRowDialogVisible.value = false
  newRowData.value = {}
  editingRowIndex.value = -1
}

// 取消编辑
const cancelEdit = () => {
  addRowDialogVisible.value = false
  newRowData.value = {}
  editingRowIndex.value = -1
}

// 监听类型变化
const onTypeChange = () => {
  initTableColumns()
  tableData.value = []
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
        <!-- 内容头部 -->
        <div class="content-header">
          <div class="header-info">
            <h1 class="header-title">
              知识库 {{ pagination.total }}
            </h1>
          </div>

          <!-- 标签导航和搜索创建区域 -->
          <div class="center-right-section">
            <!-- 标签导航 -->
            <div class="tabs-section">
              <div class="tabs-list">
                <button
                  v-for="tab in tabs"
                  :key="tab.value"
                  class="tab-btn"
                  :class="{ active: activeTab === tab.value }"
                  @click="activeTab = tab.value; handleFilter()"
                >
                  {{ tab.label }}
                </button>
              </div>
            </div>

            <!-- 搜索和创建按钮区域 -->
            <div class="search-create-section">
              <div class="search-input-wrapper">
                <input
                  v-model="searchKeyword"
                  type="text"
                  placeholder="搜索知识库..."
                  class="search-input"
                  @keyup.enter="handleSearch"
                />
                <el-icon class="search-icon">
                  <Search/>
                </el-icon>
              </div>

              <button class="create-btn" @click="createDialogVisible = true; isEditMode = false">
                <el-icon>
                  <Plus/>
                </el-icon>
                创建知识库
              </button>
            </div>
          </div>
        </div>

        <!-- 知识库列表 -->
        <div v-if="knowledgeList.length > 0" class="knowledge-list">
          <div class="knowledge-grid">
            <div
              v-for="knowledge in knowledgeList"
              :key="knowledge.id"
              class="knowledge-card"
            >
              <div class="card-header">
                <div class="card-title-row">
                  <div class="card-icon" :class="getCardIconClass(knowledge.type)">
                    {{ getCardIcon(knowledge.type) }}
                  </div>
                  <h3 class="card-title">{{ knowledge.name }}</h3>
                </div>
                <div class="card-actions">
                  <button class="action-btn" @click="editKnowledge(knowledge)">
                    <el-icon>
                      <Edit/>
                    </el-icon>
                  </button>
                  <button class="action-btn delete" @click="deleteKnowledge(knowledge.id)">
                    <el-icon>
                      <Delete/>
                    </el-icon>
                  </button>
                </div>
              </div>

              <div class="card-content">
                <p class="card-description">{{ knowledge.remark }}</p>
                <div class="card-footer">
                  <div class="meta-item">
                    <span class="meta-label">更新时间:</span>
                    <span class="meta-value small">{{ knowledge.createTime }}</span>
                  </div>
                  <div class="card-actions-footer">
                    <button class="search-btn" @click="searchKnowledge(knowledge)">
                      检索
                    </button>
                    <button class="enter-btn" @click="enterKnowledge(knowledge)">
                      详情
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- 分页组件 -->
          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="pagination.pageNum"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[12, 24, 48, 96]"
              :total="pagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!loading" class="empty-state">
          <div class="empty-icon">
            <div class="cubes-illustration">
              <div class="cube cube-1"></div>
              <div class="cube cube-2"></div>
              <div class="cube cube-3"></div>
            </div>
          </div>
          <h3 class="empty-title">你还没有知识库</h3>
          <p class="empty-description">请按照以下流程去创建</p>
          <button class="create-now-btn" @click="createDialogVisible = true; isEditMode = false">
            立即创建
          </button>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p class="loading-text">加载中...</p>
        </div>

        <!-- 创建流程图片预览 -->
        <div class="creation-preview">
          <div class="preview-container">
            <div class="preview-step">
              <div class="step-header">
                <div class="step-number">1</div>
                <div class="step-title">创建多类型知识库</div>
              </div>
              <div class="step-preview"
                   @click="openImagePreview('https://img.alicdn.com/imgextra/i4/O1CN01e3sMfe1zFKOY1qFYr_!!6000000006684-2-tps-1280-720.png')">
                <img src="https://img.alicdn.com/imgextra/i4/O1CN01e3sMfe1zFKOY1qFYr_!!6000000006684-2-tps-1280-720.png"
                     alt="创建多类型知识库" class="preview-image"/>
                <div class="image-overlay">
                  <el-icon class="zoom-icon">
                    <ZoomIn/>
                  </el-icon>
                </div>
              </div>
            </div>

            <div class="preview-step">
              <div class="step-header">
                <div class="step-number">2</div>
                <div class="step-title">知识切片配置</div>
              </div>
              <div class="step-preview"
                   @click="openImagePreview('https://img.alicdn.com/imgextra/i4/O1CN012rzZru1dgQHHLHcrj_!!6000000003765-2-tps-1280-720.png')">
                <img src="https://img.alicdn.com/imgextra/i4/O1CN012rzZru1dgQHHLHcrj_!!6000000003765-2-tps-1280-720.png"
                     alt="知识切片配置" class="preview-image"/>
                <div class="image-overlay">
                  <el-icon class="zoom-icon">
                    <ZoomIn/>
                  </el-icon>
                </div>
              </div>
            </div>

            <div class="preview-step">
              <div class="step-header">
                <div class="step-number">3</div>
                <div class="step-title">知识命中测试与管理</div>
              </div>
              <div class="step-preview"
                   @click="openImagePreview('https://img.alicdn.com/imgextra/i2/O1CN01kGvm7Q1XK5GbKWupM_!!6000000002904-2-tps-1280-720.png')">
                <img src="https://img.alicdn.com/imgextra/i2/O1CN01kGvm7Q1XK5GbKWupM_!!6000000002904-2-tps-1280-720.png"
                     alt="知识命中测试与管理" class="preview-image"/>
                <div class="image-overlay">
                  <el-icon class="zoom-icon">
                    <ZoomIn/>
                  </el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <div v-if="imagePreviewVisible" class="image-preview-overlay" @click="closeImagePreview">
      <div class="image-preview-container" @click.stop>
        <button class="preview-close-btn" @click="closeImagePreview">
          ✕
        </button>
        <img :src="previewImageUrl" alt="预览图片" class="preview-full-image"/>
      </div>
    </div>

    <!-- 创建知识库对话框 -->
    <div v-if="createDialogVisible" class="create-dialog-overlay" @click="createDialogVisible = false">
      <div class="create-dialog" @click.stop>
        <div class="dialog-content">
          <!-- 知识库名称 -->
          <div class="form-group">
            <label class="form-label">知识库名称</label>
            <div class="input-with-counter">
              <input
                v-model="createForm.name"
                type="text"
                placeholder="请输入知识库名称"
                class="form-input"
                maxlength="20"
              />
              <span class="char-counter">{{ createForm.name.length }}/20</span>
            </div>
          </div>

          <!-- 知识库描述 -->
          <div class="form-group">
            <label class="form-label">知识库描述</label>
            <div class="textarea-with-counter">
                <textarea
                  v-model="createForm.description"
                  placeholder="请输入知识库描述,介绍知识库中包含的内容,描述会用于指导智能体调用知识库"
                  class="form-textarea"
                  rows="4"
                  maxlength="1000"
                ></textarea>
              <span class="char-counter">{{ createForm.description.length }}/1000</span>
            </div>
          </div>

          <!-- 知识库类型 -->
          <div class="form-group">
            <label class="form-label">知识库类型</label>
            <div class="type-options">
              <label class="type-option" :class="{ active: createForm.type === 'document' }">
                <input v-model="createForm.type" type="radio" value="document" class="type-radio"
                       @change="onTypeChange"/>
                <div class="type-icon">
                  📄
                </div>
                <div class="type-content">
                  <div class="type-name">文档搜索</div>
                  <div class="type-description">
                    构建文档、文件、图片、Excel混合型索引知识库,利用切片方案,构建常规混合搜索知识库
                  </div>
                </div>
                <div class="radio-indicator"></div>
              </label>
              <label class="type-option" :class="{ active: createForm.type === 'table' }">
                <input v-model="createForm.type" type="radio" value="table" class="type-radio" @change="onTypeChange"/>
                <div class="type-icon">
                  📊
                </div>
                <div class="type-content">
                  <div class="type-name">数据查询</div>
                  <div class="type-description">
                    构建仅以数据表结构查询的数据索引体系,NL2SQL思路,查询表头、列头,实现相对灵活的数据查询能力
                  </div>
                </div>
                <div class="radio-indicator"></div>
              </label>
              <label class="type-option" :class="{ active: createForm.type === 'image' }">
                <input v-model="createForm.type" type="radio" value="image" class="type-radio" @change="onTypeChange"/>
                <div class="type-icon">
                  🖼️
                </div>
                <div class="type-content">
                  <div class="type-name">图片问答</div>
                  <div class="type-description">
                    构建仅以图片索引为主的知识库,基于多模态Embedding能力,支持图片名称和图片信息,构建图片搜索的索引
                  </div>
                </div>
                <div class="radio-indicator"></div>
              </label>
            </div>
          </div>

          <!-- 表结构/图片数据 -->
          <div v-if="createForm.type === 'table' || createForm.type === 'image'" class="form-group">
            <div class="table-header">
              <label class="form-label">
                表结构
              </label>
              <button type="button" class="add-row-btn" @click="addNewRow">
                <el-icon>
                  <Plus/>
                </el-icon>
                添加表数据
              </button>
            </div>

            <div v-if="tableData.length > 0" class="data-table">
              <div class="table-container">
                <table class="data-table-content">
                  <thead>
                  <tr>
                    <th v-for="column in tableColumns" :key="column.key">
                      {{ column.label }}
                    </th>
                    <th class="actions-column">操作</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(row, index) in tableData" :key="index">
                    <td v-for="column in tableColumns" :key="column.key">
                        <span v-if="column.type === 'checkbox'">
                          <span class="checkbox-display" :class="{ active: row[column.key] }">
                            {{ row[column.key] ? '是' : '否' }}
                          </span>
                        </span>
                      <span v-else>{{ row[column.key] || '-' }}</span>
                    </td>
                    <td class="actions-column">
                      <button class="action-btn edit" @click="editRow(index)">
                        <el-icon>
                          <Edit/>
                        </el-icon>
                      </button>
                      <button class="action-btn delete" @click="deleteRow(index)">
                        <el-icon>
                          <Delete/>
                        </el-icon>
                      </button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div v-else class="empty-table">
              <div class="empty-table-icon">📋</div>
              <p class="empty-table-text">
                暂无表结构数据，点击上方按钮添加
              </p>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="cancel-btn" @click="createDialogVisible = false">
            取消
          </button>
          <button class="create-btn" @click="createKnowledge">
            {{ isEditMode ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑行对话框 -->
    <div v-if="addRowDialogVisible" class="add-row-dialog-overlay" @click="cancelEdit">
      <div class="add-row-dialog" @click.stop>
        <div class="dialog-header">
          <div class="dialog-title-section">
            <div class="dialog-icon">
              <el-icon>
                <Plus/>
              </el-icon>
            </div>
            <div class="dialog-title-content">
              <h3 class="dialog-title">
                {{ editingRowIndex >= 0 ? '编辑字段' : '添加字段' }}
              </h3>
              <p class="dialog-subtitle">配置字段的基本信息和检索设置</p>
            </div>
          </div>
          <button class="close-btn" @click="cancelEdit">
            <el-icon>
              <Close/>
            </el-icon>
          </button>
        </div>

        <div class="dialog-content">
          <div class="form-sections">
            <div v-for="column in tableColumns" :key="column.key" class="form-group">
              <label class="form-label">
                <span class="label-text">{{ column.label }}</span>
                <span v-if="column.required" class="required-mark">*</span>
              </label>

              <!-- 文本输入 -->
              <div v-if="column.type === 'text'" class="input-wrapper">
                <input
                  v-model="newRowData[column.key]"
                  type="text"
                  :placeholder="`请输入${column.label}`"
                  class="form-input"
                />
              </div>

              <!-- 下拉选择 -->
              <div v-else-if="column.type === 'select'" class="select-wrapper">
                <select
                  v-model="newRowData[column.key]"
                  class="form-select"
                >
                  <option value="">请选择{{ column.label }}</option>
                  <option v-for="option in column.options" :key="option" :value="option">
                    {{ option }}
                  </option>
                </select>
                <div class="select-icon">
                  <el-icon>
                    <ArrowDown/>
                  </el-icon>
                </div>
              </div>

              <!-- 复选框 -->
              <div v-else-if="column.type === 'checkbox'" class="checkbox-wrapper">
                <label class="checkbox-label">
                  <input
                    v-model="newRowData[column.key]"
                    type="checkbox"
                    class="checkbox-input"
                  />
                  <span class="checkbox-custom"></span>
                  <span class="checkbox-text">{{ column.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="cancel-btn" @click="cancelEdit">
            <el-icon>
              <Close/>
            </el-icon>
            取消
          </button>
          <button class="save-btn" @click="saveRowData">
            <el-icon>
              <Check/>
            </el-icon>
            {{ editingRowIndex >= 0 ? '更新' : '添加' }}
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

/* 内容头部 */
.content-header {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  gap: 20px;
  min-height: 40px;
}

.header-info {
  flex-shrink: 0;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1;
}

/* 中间和右侧区域 */
.center-right-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 20px;
}

/* 标签导航 */
.tabs-section {
  display: flex;
  justify-content: center;
  flex: 1;
}

.tabs-list {
  display: flex;
  gap: 4px;
  background: white;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tab-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  line-height: 1;
}

.tab-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 搜索和创建按钮区域 */
.search-create-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  width: 200px;
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
  padding: 8px 12px 8px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  transition: all 0.3s ease;
  line-height: 1;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  line-height: 1;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 标签导航 */
.tabs-section {
  margin-bottom: 24px;
}

.tabs-list {
  display: flex;
  gap: 8px;
  background: white;
  padding: 4px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

/* 知识库列表 */
.knowledge-list {
  margin-bottom: 40px;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.knowledge-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.knowledge-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.icon-document {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.icon-data {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.icon-image {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.card-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.knowledge-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.card-content {
  margin-bottom: 12px;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.3;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  flex: 1;
}

.meta-label {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 500;
  min-width: 60px;
}

.meta-value {
  font-size: 0.8rem;
  color: #6b7280;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.meta-value.small {
  font-size: 0.75rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  margin-top: 12px;
}

.card-actions-footer {
  display: flex;
  gap: 8px;
  align-items: center;
}

.doc-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #6b7280;
}

.search-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.enter-btn {
  padding: 6px 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.enter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 分页组件 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 40px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px 40px 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 40px;
}

.empty-icon {
  margin-bottom: 24px;
}

.cubes-illustration {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  width: 120px;
  height: 80px;
}

.cube {
  width: 30px;
  height: 30px;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 4px;
  position: relative;
}

.cube-1 {
  transform: rotate(15deg);
}

.cube-2 {
  transform: rotate(-10deg);
  z-index: 2;
}

.cube-3 {
  transform: rotate(20deg);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 24px 0;
}

.create-now-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.create-now-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

/* 创建流程图片预览 */
.creation-preview {
  margin-top: 40px;
}

.preview-container {
  display: flex;
  flex-direction: row;
  gap: 20px;
  justify-content: space-between;
}

.preview-step {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  flex: 1;
  min-width: 0;
}

.preview-step:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  font-size: 1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.step-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
}

.step-preview {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.step-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.preview-image {
  width: 100%;
  height: auto;
  display: block;
  transition: all 0.3s ease;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.step-preview:hover .image-overlay {
  opacity: 1;
}

.zoom-icon {
  color: white;
  font-size: 2rem;
  transition: transform 0.3s ease;
}

.step-preview:hover .zoom-icon {
  transform: scale(1.1);
}

/* 图片预览对话框 */
.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.image-preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.preview-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.2rem;
  z-index: 10;
  transition: all 0.2s ease;
}

.preview-close-btn:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: scale(1.1);
}

.preview-full-image {
  width: 100%;
  height: auto;
  max-height: 90vh;
  display: block;
}


/* 创建对话框 */
.create-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.create-dialog {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

/* 进度条 */
.progress-bar {
  display: flex;
  align-items: center;
  padding: 24px 24px 0 24px;
  margin-bottom: 24px;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.progress-step:not(:last-child)::after {
  content: '';
  flex: 1;
  height: 2px;
  background: #e5e7eb;
  margin: 0 16px;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
}

.progress-step.active .step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.step-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
}

.progress-step.active .step-text {
  color: #667eea;
}

.progress-step.completed .step-number {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.progress-step.completed .step-text {
  color: #10b981;
}

.dialog-content {
  padding: 0 24px 24px 24px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

/* 输入框带计数器 */
.input-with-counter {
  position: relative;
}

.input-with-counter .char-counter {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.8rem;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.input-with-counter .form-input {
  padding-right: 60px;
}

.textarea-with-counter {
  position: relative;
}

.textarea-with-counter .char-counter {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 0.8rem;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* 类型选项 */
.type-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.type-option:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.02);
}

.type-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.type-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.type-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 1.5rem;
}

.type-content {
  flex: 1;
}

.type-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.type-description {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.radio-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;
}

.type-option.active .radio-indicator {
  border-color: #667eea;
  background: #667eea;
}

.type-option.active .radio-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

/* 使用场景选项 */
.scenario-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scenario-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.scenario-option:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.02);
}

.scenario-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.scenario-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.scenario-content {
  flex: 1;
}

.scenario-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.scenario-description {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
  white-space: pre-line;
}

.scenario-option .radio-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;
}

.scenario-option.active .radio-indicator {
  border-color: #667eea;
  background: #667eea;
}

.scenario-option.active .radio-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn,
.next-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.cancel-btn:hover {
  background: #f9fafb;
}

.next-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.next-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.prev-btn {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.prev-btn:hover {
  background: #f9fafb;
}

.create-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.create-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 第二步样式 */
.data-source-description {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 16px;
  line-height: 1.4;
}

.data-center-link {
  color: #667eea;
  cursor: pointer;
  text-decoration: underline;
}

.data-source-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-source-option {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.data-source-option:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.02);
}

.data-source-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.data-source-radio {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.data-source-content {
  flex: 1;
}

.data-source-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.data-source-option .radio-indicator {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  transition: all 0.2s ease;
}

.data-source-option.active .radio-indicator {
  border-color: #667eea;
  background: #667eea;
}

.data-source-option.active .radio-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

/* 类目选择 */
.category-select {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  background: white;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  pointer-events: none;
}

/* 文件上传区域 */
.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 40px 20px;
  text-align: center;
  background: #fafafa;
  transition: all 0.2s ease;
  cursor: pointer;
}

.file-upload-area:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.02);
}

.upload-icon {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 16px;
}

.upload-text {
  font-size: 1rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 12px;
}

.upload-formats {
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.4;
}

.upload-limits {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 12px;
}

.upload-count {
  font-size: 0.8rem;
  color: #667eea;
  font-weight: 500;
}

/* 表格样式 */
.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.add-row-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.add-row-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.data-table {
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

.data-table-content {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table-content th {
  background: #f8f9fa;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

.data-table-content td {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  color: #6b7280;
}

.data-table-content tr:hover {
  background: #f8f9fa;
}

.checkbox-display {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  background: #f3f4f6;
  color: #6b7280;
  transition: all 0.2s ease;
}

.checkbox-display.active {
  background: #dcfce7;
  color: #16a34a;
}

.actions-column {
  width: 100px;
  text-align: center;
}

.actions-column .action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  margin: 0 2px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.actions-column .action-btn.edit {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.actions-column .action-btn.edit:hover {
  background: rgba(59, 130, 246, 0.2);
}

.actions-column .action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.actions-column .action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
}

.empty-table {
  text-align: center;
  padding: 40px 20px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px dashed #d1d5db;
}

.empty-table-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-table-text {
  color: #6b7280;
  margin: 0;
  font-size: 0.9rem;
}

/* 添加行对话框样式 */
.add-row-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
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

.add-row-dialog {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.15);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  border-bottom: 1px solid #e5e7eb;
}

.dialog-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.dialog-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.3rem;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.dialog-title-content {
  flex: 1;
}

.dialog-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 2px 0;
  line-height: 1.2;
}

.dialog-subtitle {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(0, 0, 0, 0.05);
  color: #6b7280;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
  transform: scale(1.05);
}

.dialog-content {
  padding: 16px;
  max-height: 70vh;
  overflow-y: auto;
}

.form-sections {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1px;
}

.label-text {
  flex: 1;
}

.required-mark {
  color: #ef4444;
  font-weight: 700;
  font-size: 1rem;
}

/* 输入框样式 */
.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  background: #fafafa;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 1.1rem;
  pointer-events: none;
}

/* 下拉选择样式 */
.select-wrapper {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 8px 36px 8px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fafafa;
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-select:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 0.9rem;
  pointer-events: none;
}

/* 复选框样式 */
.checkbox-wrapper {
  padding: 4px 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.checkbox-label:hover {
  background: rgba(102, 126, 234, 0.05);
}

.checkbox-input {
  display: none;
}

.checkbox-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
}

.checkbox-input:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 6px;
  width: 6px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e5e7eb;
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 2px solid #e5e7eb;
  background: white;
  color: #6b7280;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  border-color: #d1d5db;
  background: #f9fafb;
  color: #374151;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
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

  .preview-container {
    flex-direction: column;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .knowledge-layout {
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

  .create-dialog {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }

  .preview-container {
    flex-direction: column;
    gap: 16px;
  }

  .preview-step {
    padding: 16px;
  }
}
</style>
