<script setup lang="ts">
import Sidebar from './sidebar.vue'
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  apiKeyPageApi,
  apiKeyDetailApi,
  apiKeySaveApi,
  apiKeyUpdateApi,
  apiKeyDeleteApi
} from '@/api/ai/apikey'
import { modelTreeApi } from '@/api/ai/model'
import type { ApiKeyVo, ApiKeyBo, ApiKeyQuery } from '@/api/ai/apikey/types'
import type { ModelVo, ModelQuery } from '@/api/ai/model/types'

const { pagination, getParams, onSizeChange, onCurrentChange } = usePagination()
const loading = ref(false)
const dataList = ref<ApiKeyVo[]>([])
const search = reactive<PageQuery<ApiKeyQuery>>({
  sort: 'createTime',
  order: 'desc',
  query: {
    name: ''
  }
})

// 对话框相关
const dialogVisible = ref(false)
const isEditMode = ref(false)
const currentId = ref<string>('')
const formData = reactive<ApiKeyBo>({
  name: '',
  baseUrl: '',
  apiKey: '',
  modelIds: []
})

// 模型相关
const modelTreeData = ref<Tree<ModelVo>[]>([])
const selectedModels = ref<ModelVo[]>([])
const modelLoading = ref(false)
const modelSearchKeyword = ref('')
const defaultCheckedKeys = ref<string[]>([])
const defaultExpandedKeys = ref<string[]>([])
const pendingCheckedKeys = ref<string[]>([]) // 待设置的选中keys（用于编辑模式）

// 加载API Key列表
const loadApiKeyList = async () => {
  loading.value = true
  try {
    const query = {
      ...getParams(),
      ...search
    }
    const response: any = await apiKeyPageApi(query)
    if (response.code === 0) {
      dataList.value = response.data.rows || []
      pagination.value.total = response.data.total || 0
    } else {
      ElMessage.error(response.msg || '加载API Key列表失败')
    }
  } catch (error) {
    console.error('加载API Key列表失败:', error)
    ElMessage.error('加载API Key列表失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 加载模型树
const loadModelTree = async () => {
  modelLoading.value = true
  try {
    const query: ModelQuery = {
      name: modelSearchKeyword.value || undefined
    }
    const response: any = await modelTreeApi(query)
    if (response.code === 0) {
      modelTreeData.value = response.data || []
    }
  } catch (error) {
    console.error('加载模型树失败:', error)
    ElMessage.error('加载模型树失败')
  } finally {
    modelLoading.value = false
  }
}

// 展开所有节点
const expandAllNodes = () => {
  const expanded: string[] = []
  const traverse = (nodes: Tree<ModelVo>[]) => {
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        expanded.push(node.value)
        traverse(node.children)
      }
    })
  }
  traverse(modelTreeData.value)
  defaultExpandedKeys.value = expanded
}

// 从树中提取所有模型
const extractModelsFromTree = (nodes: Tree<ModelVo>[]): ModelVo[] => {
  const models: ModelVo[] = []
  const traverse = (nodes: Tree<ModelVo>[]) => {
    nodes.forEach(node => {
      if (node.metadata) {
        models.push(node.metadata)
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return models
}

// 根据选中的 value 从树中提取对应的 metadata.id
const extractModelIdsFromTree = (nodes: Tree<ModelVo>[], checkedValues: string[]): string[] => {
  const modelIds: string[] = []
  const traverse = (nodes: Tree<ModelVo>[]) => {
    nodes.forEach(node => {
      // 如果当前节点的 value 在选中列表中，且该节点有 metadata，则提取 metadata.id
      if (checkedValues.includes(node.value) && node.metadata && node.metadata.id) {
        // 过滤掉 type 为 "provider" 的项，只保留 type 为 "model" 的项
        // 检查节点的 type 字段（可能在 node 上，也可能在 metadata 上）
        const nodeType = (node as any).type || (node.metadata as any).type
        // 如果 type 不是 "provider"，则添加到结果中（包括 type 为 "model" 或未定义的情况）
        if (nodeType !== 'provider') {
          modelIds.push(node.metadata.id)
        }
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return modelIds
}

// 根据 metadata.id 从树中查找对应的 value
const findValuesByModelIds = (nodes: Tree<ModelVo>[], modelIds: string[]): string[] => {
  const values: string[] = []
  if (!nodes || nodes.length === 0 || !modelIds || modelIds.length === 0) {
    console.warn('findValuesByModelIds: 参数为空', { nodes: nodes?.length, modelIds })
    return values
  }

  const traverse = (nodes: Tree<ModelVo>[]) => {
    nodes.forEach(node => {
      // 如果当前节点的 metadata.id 在 modelIds 列表中，则提取 value
      if (node.metadata && node.metadata.id) {
        // 确保类型匹配（都转为字符串比较）
        const nodeId = String(node.metadata.id)
        const isMatch = modelIds.some(id => String(id) === nodeId)
        if (isMatch) {
          values.push(node.value)
          console.log('找到匹配的模型:', { id: nodeId, value: node.value, name: node.metadata.name })
        }
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  console.log('findValuesByModelIds 结果:', { modelIds, foundValues: values, count: values.length })
  return values
}

// 搜索
const handleSearch = () => {
  pagination.value.pageNum = 1
  loadApiKeyList()
}

// 重置搜索
const handleReset = () => {
  search.query.name = ''
  handleSearch()
}

// 分页处理
const handleSizeChange = (size: number) => {
  onSizeChange(size).then(() => loadApiKeyList())
}

const handleCurrentChange = (page: number) => {
  onCurrentChange(page).then(() => loadApiKeyList())
}

// 打开新增对话框
const handleAdd = () => {
  resetForm()
  isEditMode.value = false
  currentId.value = ''
  selectedModels.value = []
  selectedModelIds.value = []
  defaultCheckedKeys.value = []
  loadModelTree()
  dialogVisible.value = true
}

// 打开编辑对话框
const handleEdit = async (row: ApiKeyVo) => {
  resetForm()
  isEditMode.value = true
  currentId.value = row.id || ''
  pendingCheckedKeys.value = [] // 重置待设置的keys

  try {
    const response: any = await apiKeyDetailApi(row.id!)
    if (response.code === 0) {
      const data = response.data
      formData.name = data.name || ''
      formData.baseUrl = data.baseUrl || ''
      formData.apiKey = data.apiKey || ''
      formData.modelIds = data.modelIds || []

      // 设置选中的模型
      if (data.modelIds && data.modelIds.length > 0) {
        // 优先使用 data.modelIds，如果没有则从 data.models 中提取
        const modelIds = data.modelIds.length > 0
          ? data.modelIds
          : (data.models || []).map(m => m.id!).filter(Boolean) as string[]

        selectedModels.value = data.models || []
        selectedModelIds.value = modelIds

        // 先打开对话框
        dialogVisible.value = true

        // 等待对话框打开后再加载树
        await nextTick()
        await nextTick()

        // 加载树数据
        await loadModelTree()

        // 等待树数据加载完成
        await nextTick()
        await nextTick()

        // 根据 metadata.id 找到对应的 value 来设置默认选中
        const checkedValues = findValuesByModelIds(modelTreeData.value, modelIds)
        console.log('编辑模式 - modelIds:', modelIds)
        console.log('编辑模式 - checkedValues:', checkedValues)
        console.log('编辑模式 - modelTreeData length:', modelTreeData.value.length)

        // 设置待设置的keys（用于watch监听）
        pendingCheckedKeys.value = checkedValues
        // 设置默认选中keys（用于树组件初始化）
        defaultCheckedKeys.value = checkedValues

        // 等待DOM更新后设置选中状态
        await nextTick()
        await nextTick()
        await nextTick()

        // 确保树组件已渲染，然后设置选中状态
        if (checkedValues.length > 0) {
          // 使用 setTimeout 确保在下一个事件循环中执行
          setTimeout(() => {
            setTreeCheckedKeys(checkedValues)
          }, 100)
        }
      } else {
        selectedModels.value = []
        selectedModelIds.value = []
        defaultCheckedKeys.value = []
        pendingCheckedKeys.value = []
        dialogVisible.value = true
        await nextTick()
        await loadModelTree()
      }
    } else {
      ElMessage.error(response.msg || '获取详情失败')
    }
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败，请稍后重试')
  }
}

// 设置树选中状态
const setTreeCheckedKeys = async (keys: string[]) => {
  if (keys.length === 0) {
    return
  }

  // 多次尝试设置，确保树组件已完全渲染
  for (let i = 0; i < 5; i++) {
    await nextTick()
    if (treeRef.value) {
      try {
        // 使用 setCheckedKeys 方法设置选中状态
        treeRef.value.setCheckedKeys(keys, false)

        // 验证是否设置成功
        await nextTick()
        const currentChecked = treeRef.value.getCheckedKeys() as string[]
        console.log(`尝试 ${i + 1} - 期望选中:`, keys.length, '实际选中:', currentChecked.length, 'keys:', keys, 'current:', currentChecked)

        // 检查是否所有keys都被选中了
        const allChecked = keys.every(key => currentChecked.includes(key))
        if (allChecked && currentChecked.length === keys.length) {
          console.log('树选中状态设置成功')
          return
        }

        // 如果最后一次尝试还没成功，强制设置
        if (i === 4) {
          treeRef.value.setCheckedKeys(keys, false)
          console.log('最后一次强制设置选中状态')
        }
      } catch (error) {
        console.warn('设置树选中状态失败，重试中...', error)
      }
    } else {
      console.warn(`尝试 ${i + 1} - treeRef 还未准备好`)
    }
  }
}

// 删除
const handleDelete = async (row: ApiKeyVo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除API Key "${row.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response: any = await apiKeyDeleteApi([row.id!])
    if (response.code === 0) {
      ElMessage.success('删除成功')
      loadApiKeyList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 批量删除
const handleBatchDelete = async () => {
  const selectedRows = dataList.value.filter(item => (item as any).selected)
  if (selectedRows.length === 0) {
    ElMessage.warning('请选择要删除的数据')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.length} 条数据吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedRows.map(row => row.id!)
    const response: any = await apiKeyDeleteApi(ids)
    if (response.code === 0) {
      ElMessage.success('删除成功')
      loadApiKeyList()
    } else {
      ElMessage.error(response.msg || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败，请稍后重试')
    }
  }
}

// 重置表单
const resetForm = () => {
  formData.name = ''
  formData.baseUrl = ''
  formData.apiKey = ''
  formData.modelIds = []
  selectedModels.value = []
  selectedModelIds.value = []
  defaultCheckedKeys.value = []
  pendingCheckedKeys.value = []
}

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  if (!formData.name?.trim()) {
    ElMessage.warning('请输入名称')
    return
  }
  if (!formData.baseUrl?.trim()) {
    ElMessage.warning('请输入代理地址')
    return
  }
  if (!formData.apiKey?.trim()) {
    ElMessage.warning('请输入API密钥')
    return
  }

  // 验证模型集合是否已选择
  const checkedValues = treeRef.value?.getCheckedKeys() || []
  formData.modelIds = extractModelIdsFromTree(modelTreeData.value, checkedValues)
  if (!formData.modelIds || formData.modelIds.length === 0) {
    ElMessage.warning('请至少选择一个模型')
    return
  }

  console.log('选中的 value:', checkedValues)
  console.log('提交的 modelIds:', formData.modelIds)

  try {
    let response: any
    if (isEditMode.value) {
      formData.id = currentId.value
      response = await apiKeyUpdateApi(formData)
    } else {
      response = await apiKeySaveApi(formData)
    }

    if (response.code === 0) {
      ElMessage.success(isEditMode.value ? '修改成功' : '新增成功')
      dialogVisible.value = false
      loadApiKeyList()
    } else {
      ElMessage.error(response.msg || (isEditMode.value ? '修改失败' : '新增失败'))
    }
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请稍后重试')
  }
}

// 模型选择处理
const selectedModelIds = ref<string[]>([])
const treeRef = ref()

// 树节点选中变化
const handleTreeCheckChange = (data: any, checked: any) => {
  const checkedValues = treeRef.value?.getCheckedKeys() || []

  selectedModelIds.value = checkedValues

  // 从树中提取选中的模型的 metadata.id（已过滤掉 type 为 "provider" 的项）
  const modelIds = extractModelIdsFromTree(modelTreeData.value, checkedValues)

  // 从树中提取选中的模型对象（只包含 type 为 "model" 的项）
  const allModels = extractModelsFromTree(modelTreeData.value)
  selectedModels.value = allModels.filter(model => {
    // 找到对应的树节点，检查其 type
    const findNodeByModelId = (nodes: Tree<ModelVo>[]): Tree<ModelVo> | null => {
      for (const node of nodes) {
        if (node.metadata?.id === model.id) {
          return node
        }
        if (node.children && node.children.length > 0) {
          const found = findNodeByModelId(node.children)
          if (found) return found
        }
      }
      return null
    }
    const node = findNodeByModelId(modelTreeData.value)
    const nodeType = node ? ((node as any).type || (node.metadata as any).type) : undefined
    // 只保留 type 不是 "provider" 的模型
    return modelIds.includes(model.id!) && nodeType !== 'provider'
  })
}

// 搜索模型
const handleModelSearch = () => {
  loadModelTree()
}

// 监听树数据变化，在编辑模式下自动设置选中状态
watch([modelTreeData, dialogVisible], async ([newTreeData, visible]) => {
  if (visible && isEditMode.value && pendingCheckedKeys.value.length > 0 && newTreeData.length > 0) {
    console.log('watch 触发 - 设置选中状态:', pendingCheckedKeys.value)
    // 等待DOM更新
    await nextTick()
    await nextTick()
    await nextTick()
    setTreeCheckedKeys(pendingCheckedKeys.value)
  }
}, { deep: true })

// 监听树组件引用，确保在组件准备好后设置选中状态
watch(treeRef, async (newRef) => {
  if (newRef && isEditMode.value && pendingCheckedKeys.value.length > 0 && modelTreeData.value.length > 0 && dialogVisible.value) {
    console.log('treeRef 已准备好 - 设置选中状态:', pendingCheckedKeys.value)
    await nextTick()
    await nextTick()
    setTreeCheckedKeys(pendingCheckedKeys.value)
  }
})

// 监听对话框关闭，重置状态
watch(dialogVisible, (visible) => {
  if (!visible) {
    // 对话框关闭时重置
    pendingCheckedKeys.value = []
    defaultCheckedKeys.value = []
  }
})

// 初始化
onMounted(() => {
  loadApiKeyList()
})
</script>

<template>
  <div class="apikey-container">
    <div class="apikey-layout">
      <!-- 左侧导航栏 -->
      <div class="sidebar-section">
        <Sidebar />
      </div>

      <!-- 右侧内容区域 -->
      <div class="content-section">
      <div class="content-header">
        <h2 class="page-title">API Key管理</h2>
        <p class="page-subtitle">管理您的API密钥配置</p>
      </div>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-form :inline="true" :model="search.query">
          <el-form-item label="名称">
            <el-input
              v-model="search.query.name"
              placeholder="请输入名称"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <FaIcon name="i-ri:search-line" />
              搜索
            </el-button>
            <el-button @click="handleReset">
              <FaIcon name="i-ri:refresh-line" />
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作栏 -->
      <div class="toolbar">
        <el-button type="primary" @click="handleAdd">
          <FaIcon name="i-ri:add-line" />
          新增
        </el-button>
        <el-button type="danger" @click="handleBatchDelete">
          <FaIcon name="i-ri:delete-bin-line" />
          批量删除
        </el-button>
      </div>

      <!-- 数据表格 -->
      <div class="table-container">
        <el-table
          v-loading="loading"
          :data="dataList"
          border
          stripe
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="name" label="名称" min-width="120" />
          <el-table-column prop="baseUrl" label="代理地址" min-width="200" show-overflow-tooltip />
          <el-table-column label="API密钥" min-width="200">
            <template #default="{ row }">
              <span v-if="row.apiKey">
                {{ row.apiKey.substring(0, 8) }}****{{ row.apiKey.substring(row.apiKey.length - 4) }}
              </span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleEdit(row)">
                <FaIcon name="i-ri:edit-line" />
                编辑
              </el-button>
              <el-button link type="danger" @click="handleDelete(row)">
                <FaIcon name="i-ri:delete-bin-line" />
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.pageNum"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑API Key' : '新增API Key'"
      width="800px"
      :close-on-click-modal="false"
      class="apikey-dialog"
      align-center
    >
      <template #header>
        <div class="dialog-header">
          <div class="header-content">
            <div class="header-icon">
              <FaIcon name="i-ri:key-line" />
            </div>
            <div class="header-text">
              <h3 class="header-title">{{ isEditMode ? '编辑API Key' : '新增API Key' }}</h3>
            </div>
          </div>
        </div>
      </template>

      <div class="dialog-body">
        <el-form
          :model="formData"
          label-width="100px"
          class="apikey-form"
          :rules="{
            name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
            baseUrl: [{ required: true, message: '请输入代理地址', trigger: 'blur' }],
            apiKey: [{ required: true, message: '请输入API密钥', trigger: 'blur' }]
          }"
        >
          <div class="form-section">
            <el-form-item label="名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入API Key名称"
                clearable
                class="form-input"
              />
            </el-form-item>

            <el-form-item label="代理地址" prop="baseUrl">
              <el-input
                v-model="formData.baseUrl"
                placeholder="请输入代理地址"
                clearable
                class="form-input"
              />
            </el-form-item>

            <el-form-item label="API密钥" prop="apiKey">
              <el-input
                v-model="formData.apiKey"
                type="password"
                placeholder="请输入API密钥"
                show-password
                clearable
                class="form-input"
              />
            </el-form-item>

            <el-form-item label="模型集合" class="model-collection-item">
              <div class="model-selector">
                <div class="model-search">
                  <el-input
                    v-model="modelSearchKeyword"
                    placeholder="搜索模型"
                    clearable
                    @keyup.enter="handleModelSearch"
                    class="model-search-input"
                  >
                    <template #prefix>
                      <FaIcon name="i-ri:search-line" />
                    </template>
                    <template #append>
                      <el-button @click="handleModelSearch" type="primary" size="small">
                        搜索
                      </el-button>
                    </template>
                  </el-input>
                </div>
                <div class="model-tree-container">
                  <el-tree
                    ref="treeRef"
                    :key="`tree-${isEditMode}-${currentId}`"
                    v-loading="modelLoading"
                    :data="modelTreeData"
                    :props="{
                      children: 'children',
                      label: 'label',
                      value: 'value'
                    }"
                    show-checkbox
                    node-key="value"
                    :default-checked-keys="defaultCheckedKeys"
                    :default-expand-all="false"
                    :expand-on-click-node="false"
                    @check="handleTreeCheckChange"
                    class="model-tree"
                  >
                    <template #default="{ node, data }">
                      <span class="tree-node-label">
                        {{ data.metadata ? (data.metadata.name || data.metadata.alias) : node.label }}
                      </span>
                    </template>
                  </el-tree>
                  <div v-if="!modelLoading && modelTreeData.length === 0" class="empty-models">
                    <FaIcon name="i-ri:inbox-line" />
                    <p>暂无模型数据</p>
                    <p class="empty-hint">请尝试搜索其他关键词</p>
                  </div>
                </div>
                <div v-if="selectedModels.length > 0" class="selected-models-info">
                  <FaIcon name="i-ri:check-line" />
                  <span>已选择 <strong>{{ selectedModels.length }}</strong> 个模型</span>
                </div>
              </div>
            </el-form-item>
          </div>
        </el-form>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">
            取消
          </el-button>
          <el-button type="primary" @click="handleSubmit" class="submit-btn">
            {{ isEditMode ? '保存' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.apikey-container {
  height: calc(100vh - 101px);
  background: #f8f9fa;
  overflow: auto;
}

.apikey-layout {
  display: flex;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 10px 20px;
  height: 100%;
}

/* 左侧导航栏 */
.sidebar-section {
  flex-shrink: 0;
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 右侧内容区域 */
.content-section {
  flex: 1;
  height: calc(100vh - 101px);
  background: white;
  padding: 32px;
  overflow-y: auto;
}

.content-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 0.95rem;
  color: #6c757d;
  margin: 0;
}

/* 搜索栏 */
.search-bar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

/* 操作栏 */
.toolbar {
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
}

/* 表格容器 */
.table-container {
  margin-bottom: 20px;
}

/* 分页容器 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

/* 对话框样式 */
.apikey-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
    border-bottom: none;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
    background: #fafbfc;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  padding: 16px 20px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: pulse 3s ease-in-out infinite;
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  z-index: 1;
}

.header-icon {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.header-text {
  flex: 1;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
  color: white;
}

.dialog-body {
  padding: 20px;
  background: #fafbfc;
  max-height: 65vh;
  overflow-y: auto;
}

.apikey-form {
  .form-section {
    background: white;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
    border: 1px solid #e9ecef;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.95rem;
    font-weight: 600;
    color: #2c3e50;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;

    :deep(.fa-icon) {
      color: #f59e0b;
      font-size: 1rem;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
  }

  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }

  // 模型集合字段添加顶部边框分隔
  :deep(.model-collection-item) {
    margin-top: 8px;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #495057;
    font-size: 13px;
    padding-right: 8px;
  }

  .form-input {
    :deep(.el-input__wrapper) {
      border-radius: 6px;
      box-shadow: 0 0 0 1px #e4e7ed inset;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 0 0 1px #f59e0b inset;
      }

      &.is-focus {
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2) inset;
      }
    }

    :deep(.el-input__prefix) {
      color: #909399;
      padding-left: 10px;
      font-size: 14px;
    }
  }
}

/* 模型选择器 */
.model-selector {
  width: 100%;
}

.model-search {
  margin-bottom: 12px;
}

.model-search-input {
  :deep(.el-input__wrapper) {
    border-radius: 8px;
  }
}

.model-tree-container {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  max-height: 350px;
  overflow-y: auto;
  padding: 12px;
  background: linear-gradient(135deg, #fafbfc 0%, #f8f9fa 100%);
  transition: border-color 0.3s ease;

  &:focus-within {
    border-color: #f59e0b;
  }
}

.model-tree {
  :deep(.el-tree-node) {
    margin-bottom: 2px;
  }

  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 32px;
    padding: 4px 0;
    border-radius: 4px;
    transition: all 0.2s ease;

    &:hover {
      background-color: rgba(245, 158, 11, 0.08);
    }
  }

  :deep(.el-tree-node__expand-icon) {
    color: #909399;
    font-size: 12px;
    padding: 0 4px;
  }

  :deep(.el-checkbox) {
    margin-right: 6px;
  }

  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: #f59e0b;
    border-color: #f59e0b;
  }

  :deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
    background-color: #f59e0b;
    border-color: #f59e0b;
  }
}

.tree-node-content {
  flex: 1;
  display: flex;
  align-items: center;
}

.tree-node-label {
  font-size: 14px;
  font-weight: 400;
  color: #2c3e50;
}

.tree-node-model {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding-right: 4px;
}

.model-icon-small {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  :deep(.fa-icon) {
    font-size: 14px;
    color: #909399;
  }
}

.model-info-small {
  flex: 1;
  min-width: 0;
}

.model-name-small {
  font-size: 13px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.model-provider-small {
  font-size: 11px;
  color: #6c757d;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.empty-models {
  text-align: center;
  padding: 40px 20px;
  color: #909399;

  :deep(.fa-icon) {
    font-size: 36px;
    color: #d1d5db;
    margin-bottom: 12px;
  }

  p {
    margin: 6px 0;
    font-size: 13px;
  }

  .empty-hint {
    font-size: 11px;
    color: #bdc3c7;
  }
}

.selected-models-info {
  margin-top: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 6px;
  color: #92400e;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid #fbbf24;

  :deep(.fa-icon) {
    color: #f59e0b;
    font-size: 14px;
  }

  strong {
    font-weight: 600;
    color: #92400e;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  .el-button {
    padding: 8px 20px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    transition: all 0.3s ease;
  }

  .submit-btn {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border: none;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .apikey-layout {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
    height: auto;
  }
}

@media (max-width: 768px) {
  .content-section {
    padding: 20px;
  }
}
</style>

