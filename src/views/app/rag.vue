<script setup lang="ts">
import {ref, reactive, onMounted} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {Search, Plus, Edit, Delete, ChatDotRound, View} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'
import Sidebar from './sidebar.vue'
import type {RagAppBo, RagAppQuery, RagAppVo, RagKnowledgeVo} from "@/api/ai/rag/types.ts";
import {ragAppDeleteApi, ragAppPageApi, ragAppSaveApi, ragAppUpdateApi, ragKnowledgePageApi} from "@/api/ai/rag";
import type {ModelQuery, ModelVo} from "@/api/ai/model/types.ts";
import {modelPageApi} from "@/api/ai/model";

// 路由实例
const router = useRouter()

// 应用列表
const appList = ref<RagAppVo[]>([])

// 分页信息
const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
  total: 0
})

// 搜索关键词
const searchKeyword = ref('')

// 加载状态
const loading = ref(false)

// 创建/编辑应用对话框
const appDialogVisible = ref(false)
const isEditMode = ref(false)
const currentAppId = ref('')

// 应用表单
const appForm = reactive<RagAppBo>({
  id: '',
  name: '',
  icon: '',
  remark: '',
  chatModelId: '',
  knowledgeId: '',
  chatModelConfigJson: '',
})

// 知识库列表
const knowledgeList = ref<RagKnowledgeVo[]>([])

// 模型列表
const modelList = ref<ModelVo[]>([])

// 初始化
onMounted(() => {
  initData()
})

// 初始化数据
const initData = async () => {
  await Promise.all([
    loadAppData(),
    loadKnowledgeList(),
    loadModelList()
  ])
}

// 加载应用数据
const loadAppData = async () => {
  loading.value = true
  try {
    let query = <PageQuery<RagAppQuery>>({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      query: {
        name: searchKeyword.value,
      }
    })
    const res = await ragAppPageApi(query)
    appList.value = res.data.rows || []
    pagination.total = res.data.total || 0

    console.log('加载的应用列表:', appList.value)
  } catch (error) {
    console.error('加载应用数据失败:', error)
    ElMessage.error('加载应用数据失败')
  } finally {
    loading.value = false
  }
}

// 加载知识库列表
const loadKnowledgeList = async () => {
  try {
    let query = <PageQuery<any>>({
      pageNum: 1,
      pageSize: 100,
      query: {}
    })
    const res = await ragKnowledgePageApi(query)
    knowledgeList.value = res.data.rows || []
  } catch (error) {
    console.error('加载知识库列表失败:', error)
  }
}

// 加载模型列表
const loadModelList = async () => {
  try {
    let query = <PageQuery<ModelQuery>>({
      pageNum: 1,
      pageSize: 100,
      query: {
        type: 'TG'
      }
    })
    const res = await modelPageApi(query)
    modelList.value = res.data.rows || []
  } catch (error) {
    console.error('加载模型列表失败:', error)
  }
}

// 搜索应用
const searchApps = () => {
  pagination.pageNum = 1
  loadAppData()
}

// 新建应用
const createApp = () => {
  resetAppForm()
  isEditMode.value = false
  appDialogVisible.value = true
}

// 编辑应用
const editApp = (app: AppVo) => {
  resetAppForm()
  isEditMode.value = true
  currentAppId.value = app.id
  appForm.name = app.name
  appForm.icon = app.icon
  appForm.remark = app.remark
  appForm.chatModelId = app.chatModelId
  appForm.knowledgeId = app.knowledgeId
  appForm.promptText = app.promptText
  appDialogVisible.value = true
}

// 删除应用
const deleteApp = async (app: AppVo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应用"${app.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await ragAppDeleteApi([app.id])
    ElMessage.success('删除成功')
    loadAppData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除应用失败:', error)
      ElMessage.error('删除应用失败')
    }
  }
}

// 对话应用
const chatApp = (app: RagAppVo) => {
  if (!app.id) {
    ElMessage.error('应用ID不存在')
    return
  }

  // 跳转到知识库搜索页面
  const targetPath = `/app/rag/chat/${app.id}`
  console.log('跳转路径:', targetPath)

  router.push(targetPath).then(() => {
    console.log('路由跳转成功')
  }).catch((error) => {
    console.error('路由跳转失败:', error)
    ElMessage.error('页面跳转失败: ' + error.message)
  })
}

// 保存应用
const saveApp = async () => {
  if (!appForm.name?.trim()) {
    ElMessage.warning('请输入应用名称')
    return
  }
  if (!appForm.knowledgeId) {
    ElMessage.warning('请选择知识库')
    return
  }
  if (!appForm.chatModelId) {
    ElMessage.warning('请选择对话模型')
    return
  }

  try {
    if (isEditMode.value) {
      appForm.id = currentAppId.value
      await ragAppUpdateApi(appForm)
      ElMessage.success('应用更新成功')
    } else {
      await ragAppSaveApi(appForm)
      ElMessage.success('应用创建成功')
    }

    appDialogVisible.value = false
    resetAppForm()
    loadAppData()
  } catch (error) {
    console.error('保存应用失败:', error)
  }
}

// 重置表单
const resetAppForm = () => {
  appForm.name = ''
  appForm.icon = ''
  appForm.remark = ''
  appForm.chatModelId = ''
  appForm.knowledgeId = ''
  appForm.promptText = ''
  currentAppId.value = ''
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.pageNum = page
  loadAppData()
}

// 分页大小变化
const handlePageSizeChange = (size: number) => {
  pagination.pageSize = size
  pagination.pageNum = 1
  loadAppData()
}

// 获取知识库名称
const getKnowledgeName = (knowledgeId: string) => {
  const knowledge = knowledgeList.value.find(k => k.id === knowledgeId)
  return knowledge?.name || '未知知识库'
}

// 获取模型名称
const getModelName = (modelId: string) => {
  const model = modelList.value.find(m => m.id === modelId)
  return model?.name || '未知模型'
}
</script>

<template>
  <div class="rag-app-container">
    <div class="rag-app-layout">
    <!-- 侧边栏 -->
    <div class="sidebar-section">
      <Sidebar/>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 头部操作区 -->
      <div class="header-section">
        <div class="search-section">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索应用"
            class="search-input"
            @keyup.enter="searchApps"
          >
            <template #prefix>
              <el-icon>
                <Search/>
              </el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="searchApps" class="search-btn">
            <el-icon>
              <Search/>
            </el-icon>
            筛选
          </el-button>
        </div>
        <el-button type="primary" @click="createApp" class="create-btn">
          <el-icon>
            <Plus/>
          </el-icon>
          新建
        </el-button>
      </div>

      <!-- 应用列表 -->
      <div class="app-list" v-loading="loading">
        <div class="app-grid">
          <div
            v-for="app in appList"
            :key="app.id"
            class="app-card"
          >
            <div class="app-card-header">
              <div class="app-icon">
                <div class="icon-placeholder">
                  <el-icon>
                    <ChatDotRound/>
                  </el-icon>
                </div>
              </div>
              <div class="app-info">
                <h3 class="app-name">{{ app.name }}</h3>
              </div>
            </div>

            <div class="app-card-body">
              <div class="app-description">
                {{ app.remark || '' }}
              </div>
            </div>

            <div class="app-card-footer">
              <div class="app-actions">
                <el-button size="small" @click="chatApp(app)" type="primary">
                  <el-icon>
                    <ChatDotRound/>
                  </el-icon>
                  对话
                </el-button>
                <el-button size="small" @click="editApp(app)">
                  <el-icon>
                    <Edit/>
                  </el-icon>
                  编辑
                </el-button>
                <el-button size="small" @click="deleteApp(app)" type="danger">
                  <el-icon>
                    <Delete/>
                  </el-icon>
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && appList.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon>
              <ChatDotRound/>
            </el-icon>
          </div>
          <div class="empty-text">暂无RAG应用</div>
          <div class="empty-description">点击"新建"按钮创建您的第一个RAG应用</div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-section" v-if="appList.length > 0">
        <div class="pagination-info">
          <span>共{{ pagination.total }}条</span>
          <el-select v-model="pagination.pageSize" @change="handlePageSizeChange" class="page-size-select">
            <el-option label="10条/页" :value="10"/>
            <el-option label="20条/页" :value="20"/>
            <el-option label="50条/页" :value="50"/>
          </el-select>
        </div>
        <el-pagination
          v-model:current-page="pagination.pageNum"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
          class="pagination"
        />
      </div>
    </div>

    <!-- 新建/编辑应用对话框 -->
    <el-dialog
      v-model="appDialogVisible"
      :title="isEditMode ? '编辑应用' : '新建应用'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="appForm" label-width="80px" class="app-form">
        <el-form-item label="应用名称" required>
          <el-input v-model="appForm.name" placeholder="请输入应用名称"/>
        </el-form-item>

        <el-form-item label="应用描述">
          <el-input
            v-model="appForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入应用描述"
          />
        </el-form-item>

        <el-form-item label="知识库" required>
          <el-select v-model="appForm.knowledgeId" placeholder="请选择知识库" class="full-width">
            <el-option
              v-for="knowledge in knowledgeList"
              :key="knowledge.id"
              :label="knowledge.name"
              :value="knowledge.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="对话模型" required>
          <el-select v-model="appForm.chatModelId" placeholder="请选择对话模型" class="full-width">
            <el-option
              v-for="model in modelList"
              :key="model.id"
              :label="model.name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="appDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveApp">
            {{ isEditMode ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    </div>
  </div>
</template>

<style scoped>
.rag-app-container {
  min-height: calc(100vh - 101px);
  background: #f5f7fa;
  display: flex;
}

.rag-app-layout {
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

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 24px 28px;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.header-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
}

.search-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 320px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(248, 250, 252, 0.8);
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: rgba(79, 172, 254, 0.3);
  background: rgba(255, 255, 255, 0.9);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #4facfe;
  background: white;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.15);
}

.search-btn,
.create-btn {
  height: 44px;
  padding: 0 24px;
  border-radius: 10px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.search-btn {
  background: rgba(248, 250, 252, 0.8);
  color: #64748b;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.search-btn:hover {
  background: rgba(241, 245, 249, 0.9);
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.create-btn {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(79, 172, 254, 0.3);
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(79, 172, 254, 0.4);
}

.app-list {
  min-height: 400px;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.app-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.app-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.app-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(79, 172, 254, 0.15);
  border-color: rgba(79, 172, 254, 0.2);
}

.app-card:hover::before {
  opacity: 1;
}

.app-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.app-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 6px 16px rgba(79, 172, 254, 0.3);
  position: relative;
  transition: all 0.3s ease;
}

.app-card:hover .app-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 12px 30px rgba(79, 172, 254, 0.4);
}

.icon-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.app-info {
  flex: 1;
}

.app-name {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 700;
  color: #1a202c;
  line-height: 1.3;
  background: linear-gradient(135deg, #2d3748 0%, #4a5568 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-type {
  font-size: 11px;
  font-weight: 600;
  color: #4facfe;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.1) 0%, rgba(0, 242, 254, 0.1) 100%);
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
  border: 1px solid rgba(79, 172, 254, 0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.app-card-body {
  margin-bottom: 12px;
}

.app-description {
  color: #64748b;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 39px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.app-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(248, 250, 252, 0.8);
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 1px 0;
}

.detail-label {
  color: #64748b;
  margin-right: 8px;
  min-width: 50px;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.detail-value {
  color: #334155;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.app-card-footer {
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  padding-top: 14px;
  margin-top: 2px;
}

.app-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.app-actions .el-button {
  flex: 1;
  min-width: 0;
  height: 32px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  position: relative;
  overflow: hidden;
}

.app-actions .el-button--primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(79, 172, 254, 0.3);
}

.app-actions .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(79, 172, 254, 0.4);
}

.app-actions .el-button:not(.el-button--primary) {
  background: rgba(248, 250, 252, 0.8);
  color: #64748b;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.app-actions .el-button:not(.el-button--primary):hover {
  background: rgba(241, 245, 249, 0.9);
  color: #475569;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.app-actions .el-button--danger {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
  border: none;
}

.app-actions .el-button--danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  border: 2px dashed rgba(79, 172, 254, 0.3);
  margin: 40px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 24px;
  color: #4facfe;
  opacity: 0.6;
}

.empty-text {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #475569;
  background: linear-gradient(135deg, #334155 0%, #64748b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.empty-description {
  font-size: 16px;
  color: #64748b;
  line-height: 1.5;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #666;
  font-size: 14px;
}

.page-size-select {
  width: 100px;
}

.pagination {
  margin: 0;
}

.app-form {
  padding: 0 20px 0 0;
}

.full-width {
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar-section {
    width: 200px;
    min-width: 200px;
  }

  .main-content {
    margin-left: 200px;
  }
}

@media (max-width: 768px) {
  .rag-app-container {
    flex-direction: column;
  }

  .rag-app-layout {
    flex-direction: column;
  }

  .sidebar-section {
    position: static;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid #e9ecef;
  }

  .main-content {
    margin-left: 0;
    padding: 16px;
  }

  .header-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .search-section {
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .app-grid {
    grid-template-columns: 1fr;
  }

  .pagination-section {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}
</style>
