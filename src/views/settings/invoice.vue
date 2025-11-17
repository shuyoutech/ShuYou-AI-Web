<script setup lang="ts">
import {ref, onMounted, reactive} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import Sidebar from './sidebar.vue'
import InvoiceApplyModal from './components/InvoiceApplyModal.vue'
import {
  invoicePageApi,
  invoiceDeleteApi,
  invoiceQuotaApi
} from '@/api/system/invoice'
import type { InvoiceQuery, InvoiceVo, InvoiceQuota } from '@/api/system/invoice/types'
import {
  Plus,
  Search,
  Download,
  Delete,
} from '@element-plus/icons-vue'

// 搜索表单
const searchForm = reactive<InvoiceQuery>({
  invoiceNo: '',
  invoiceStatus: '',
  startDate: '',
  endDate: '',
})

// 发票列表数据
const invoiceList = ref<InvoiceVo[]>([])

const date = ref<string[]>([])

// 发票额度信息
const invoiceQuota = ref<InvoiceQuota>({
  totalAmount: 0,
  usedAmount: 0,
  availableAmount: 0,
})

// 分页
const {pagination, onSizeChange, onCurrentChange} = usePagination()

// 状态选项
const statusOptions = [
  {label: '全部', value: ''},
  {label: '开票中', value: 'invoicing'},
  {label: '已开票', value: 'invoiced'},
  {label: '已废弃', value: 'discarded'},
]

// 获取状态标签类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'invoiced':
      return 'success'
    case 'invoicing':
      return 'warning'
    case 'discarded':
      return 'danger'
    default:
      return 'info'
  }
}

// 获取状态显示文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'invoiced':
      return '已开票'
    case 'invoicing':
      return '开票中'
    case 'discarded':
      return '已废弃'
    default:
      return status
  }
}

// 获取发票类型显示文本
const getInvoiceTypeText = (type: string) => {
  switch (type) {
    case 'vat_regular_invoice':
      return '增值税普通发票'
    case 'vat_special_invoice':
      return '增值税专用发票'
    default:
      return type || '-'
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.pageNum = 1
  loadInvoiceList()
}

// 重置搜索
const handleReset = () => {
  searchForm.invoiceNo = ''
  searchForm.invoiceStatus = ''
  searchForm.startDate = ''
  searchForm.endDate = ''
  handleSearch()
}

// 处理日期范围变化
const handleDateRangeChange = (dates: string[]) => {
  if (dates.length > 0) {
    searchForm.startDate = dates[0] + ' 00:00:00'
    searchForm.endDate = dates[1] + ' 23:59:59'
  }
}

// 加载发票列表
const loadInvoiceList = async () => {
  try {
    const params = {
      pageNum: pagination.value.pageNum,
      pageSize: pagination.value.pageSize,
      query:{
        ...searchForm
      }
    }

    const response = await invoicePageApi(params)
    if (response.code === 0) {
      invoiceList.value = response.data.rows || []
      pagination.value.total = response.data.total || 0
    }
  } catch (error) {
    console.error('获取发票列表失败:', error)
  }
}

// 加载发票额度
const loadInvoiceQuota = async () => {
  try {
    const response = await invoiceQuotaApi()
    if (response.code === 0) {
      invoiceQuota.value = response.data || {}
    }
  } catch (error) {
    console.error('获取发票额度失败:', error)
  }
}

// 新增发票申请
const showApplyModal = ref(false)
const handleAdd = () => {
  showApplyModal.value = true
}

// 删除发票
const handleDelete = async (row: any) => {
  if (row.invoiceStatus === 'invoiced') {
    ElMessage.warning('已开票的发票不能删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除发票申请 ${row.invoiceNo} 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await invoiceDeleteApi([row.id])
    if (response.code === 0) {
      ElMessage.success('删除成功')
      loadInvoiceList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 下载发票
const handleDownload = (row: any) => {
  if (row.invoiceStatus !== 'invoiced') {
    ElMessage.warning('只有已开票的发票才能下载')
    return
  }

  if (!row.invoiceUrl) {
    ElMessage.error('发票文件不存在，无法下载')
    return
  }

  try {
    // 创建一个临时的 a 标签来触发下载
    const link = document.createElement('a')
    link.href = row.invoiceUrl
    link.download = `发票_${row.invoiceNo || row.id}.pdf` // 设置下载文件名
    link.target = '_blank'

    // 添加到 DOM 并触发点击
    document.body.appendChild(link)
    link.click()

    // 清理 DOM
    document.body.removeChild(link)

    ElMessage.success('开始下载发票文件')
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  onCurrentChange(page).then(() => loadInvoiceList())
}

// 页面大小变化
const handleSizeChange = (size: number) => {
  onSizeChange(size).then(() => {
    pagination.value.pageNum = 1
    loadInvoiceList()
  })
}

// 关闭弹窗
const handleModalClose = () => {
  showApplyModal.value = false
}

// 提交成功回调
const handleSubmitSuccess = () => {
  handleModalClose()
  loadInvoiceList()
  ElMessage.success('操作成功')
}

onMounted(() => {
  loadInvoiceList()
  loadInvoiceQuota()
})
</script>

<template>
  <div class="invoice-container">
    <div class="invoice-layout">
      <!-- 侧边栏 -->
      <div class="sidebar-section">
        <Sidebar/>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">

        <!-- 表格区域 -->
        <div class="table-section">
          <div class="table-container">
            <div class="table-header">
              <div class="table-title-section">
                <h3 class="table-title">发票管理</h3>
                <p class="table-subtitle">管理您的发票申请和记录</p>
              </div>
              <div class="table-actions">
                <el-button
                  type="primary"
                  :icon="Plus"
                  @click="handleAdd"
                  class="add-btn"
                >
                  申请发票
                </el-button>
              </div>
            </div>

            <div class="search-section">
              <el-form :model="searchForm" size="default" inline class="search-form">
                       <el-form-item label="发票号码：">
                         <el-input
                           v-model="searchForm.invoiceNo"
                           placeholder="请输入发票号码"
                           clearable
                           style="width: 200px"
                         />
                       </el-form-item>
                       <el-form-item label="状态：">
                         <el-select
                           v-model="searchForm.invoiceStatus"
                           placeholder="请选择状态"
                           clearable
                           style="width: 150px"
                         >
                           <el-option
                             v-for="option in statusOptions"
                             :key="option.value"
                             :label="option.label"
                             :value="option.value"
                           />
                         </el-select>
                       </el-form-item>
                       <el-form-item label="申请时间：">
                         <el-date-picker
                           v-model="date"
                           type="daterange"
                           range-separator="至"
                           start-placeholder="开始日期"
                           end-placeholder="结束日期"
                           format="YYYY-MM-DD"
                           value-format="YYYY-MM-DD"
                           style="width: 240px"
                           @change="handleDateRangeChange"
                         />
                       </el-form-item>
                <el-form-item>
                  <el-button @click="handleReset" class="reset-btn">
                    重置
                  </el-button>
                  <el-button type="primary" :icon="Search" @click="handleSearch" class="search-btn">
                    筛选
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
            <ElDivider border-style="dashed"/>

            <div class="table-wrapper">
              <el-table
                :data="invoiceList"
                v-loading="false"
                stripe
                border
                empty-text="暂无发票数据"
                style="width: 100%"
                size="small"
                header-align="center"
              >

                <el-table-column
                  prop="createTime"
                  label="申请时间"
                  width="150"
                />
                <el-table-column
                  prop="amount"
                  label="金额"
                  width="100"
                  align="center"
                >
                  <template #default="{ row }">
                    <span class="amount-text">¥{{ (row.amount / 100).toFixed(2) }}</span>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="invoiceType"
                  label="发票类型"
                  width="120"
                >
                  <template #default="{ row }">
                    {{ getInvoiceTypeText(row.invoiceType) }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="titleName"
                  label="发票抬头"
                  min-width="180"
                  show-overflow-tooltip
                />
                <el-table-column
                  prop="invoiceStatus"
                  label="开票状态"
                  width="100"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-tag
                      :type="getStatusType(row.invoiceStatus)"
                      size="small"
                    >
                      {{ getStatusText(row.invoiceStatus) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="invoiceNo"
                  label="发票号码"
                  width="150"
                  show-overflow-tooltip
                />
                <el-table-column
                  label="操作"
                  width="200"
                  align="center"
                  fixed="right"
                >
                  <template #default="{ row }">
                    <el-button
                      v-if="row.invoiceStatus === 'invoiced'"
                      type="success"
                      size="small"
                      :icon="Download"
                      @click="handleDownload(row)"
                      link
                    >
                      下载
                    </el-button>
                    <el-button
                      v-if="row.invoiceStatus === 'discarded'"
                      type="danger"
                      size="small"
                      :icon="Delete"
                      @click="handleDelete(row)"
                      link
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <div class="pagination-wrapper">
              <vxe-pager
                :current-page="pagination.pageNum"
                :total="pagination.total"
                :page-size="pagination.pageSize"
                :page-sizes="pagination.sizes"
                :layouts="['Total', 'Sizes', 'PrevPage', 'Number', 'NextPage', 'Jump']"
                @page-change="handlePageChange"
                @page-size-change="handleSizeChange"
                class="pagination"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发票申请弹窗 -->
    <InvoiceApplyModal
      v-model:visible="showApplyModal"
      @close="handleModalClose"
      @success="handleSubmitSuccess"
    />
  </div>
</template>

<style scoped>
.invoice-container {
  height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  padding: 0;
  margin: 0;
  width: 100vw;
  position: relative;
  overflow: auto;
}

.invoice-layout {
  display: flex;
  gap: 16px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 10px 20px;
  height: 100%;
}

.sidebar-section {
  flex-shrink: 0;
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: visible;
  position: relative;
  z-index: 10;
  padding-bottom: 20px;
  min-height: 0;
}


/* 表格区域 */
.table-section {
  flex: 1;
  min-height: 250px;
  overflow: visible;
  margin-bottom: 0 !important;
  margin-top: 0 !important;
  position: relative;
  z-index: 10;
  clear: both;
  display: flex;
  flex-direction: column;
}

.table-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 500px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  gap: 20px;
}

.table-title-section {
  flex: 1;
}

.table-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.table-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.table-subtitle {
  font-size: 0.75rem;
  color: #5a6c7d;
  margin: 0;
  font-weight: 400;
}

.search-section {
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.reset-btn, .search-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.reset-btn {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.15);
  color: #5a6c7d;
}

.reset-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.25);
}

.search-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.add-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.table-wrapper {
  flex: 1;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: auto;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
  position: relative;
  z-index: 15;
  min-height: 200px;
  max-height: 350px;
}

.amount-text {
  font-weight: 600;
  color: #e6a23c;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.pagination {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(0.9);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .invoice-layout {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .invoice-layout {
    padding: 16px;
  }

  .table-container {
    padding: 16px;
  }

  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .table-header {
    flex-direction: column;
    gap: 12px;
  }

  .table-actions {
    width: 100%;
    justify-content: center;
  }
}


/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-table th) {
  background: #fafbfc;
  color: #606266;
  font-weight: 600;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #fafbfc;
}

:deep(.el-table__row:hover > td) {
  background: #f0f9ff !important;
}

/* 按钮样式优化 */
:deep(.el-button--small) {
  padding: 4px 8px;
  font-size: 0.8rem;
}

:deep(.el-button.is-link) {
  padding: 4px 8px;
  margin: 0 2px;
}

/* 标签样式 */
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
}

/* 分页样式 */
:deep(.el-pagination) {
  justify-content: center;
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
}

:deep(.el-pagination .el-pager) {
  display: flex !important;
}

:deep(.el-pagination .el-pagination__total) {
  display: inline-block !important;
}

:deep(.el-pagination .el-pagination__sizes) {
  display: inline-block !important;
}

:deep(.el-pagination .el-pagination__jump) {
  display: inline-block !important;
}
</style>
