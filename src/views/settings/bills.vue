<script setup lang="ts">
import {ref, onMounted, reactive} from 'vue'
import {payOrderPageApi} from "@/api/pay";
import type {PayOrderQuery, PayOrderVo} from "@/api/pay/types.ts";
import Sidebar from './sidebar.vue'
import dayjs from "dayjs";

const {pagination, getParams, onSizeChange, onCurrentChange, onSortChange} = usePagination()
const loading = ref(false)
const dataList = ref<PayOrderVo[]>([])
const date = ref<string[]>([])
const search = reactive<PageQuery<PayOrderQuery>>({
  sort: 'createTime',
  order: 'desc',
  query: {
    startDate: '',
    endDate: '',
  }
})

function searchReset() {
  search.query = {}
}

onMounted(() => {
  date.value = [
    dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]
  getDataList()
})


const getDataList = () => {
  loading.value = true
  Object.assign(search, getParams())
  if (date.value.length > 0) {
    search.query.startDate = date.value[0] + ' 00:00:00'
    search.query.endDate = date.value[1] + ' 23:59:59'
  }
  payOrderPageApi(search).then((res: any) => {
    loading.value = false
    dataList.value = res.data.rows
    pagination.value.total = Number(res.data.total | 0)
  })
}

// 每页数量切换
function sizeChange(size: number) {
  onSizeChange(size).then(() => getDataList())
}

// 当前页码切换（翻页）
function currentChange(page = 1) {
  onCurrentChange(page).then(() => getDataList())
}

// 字段排序
function sortChange({prop, order}: { prop: string, order: string }) {
  onSortChange(prop, order).then(() => getDataList())
}

</script>

<template>
  <div class="bills-container">
    <div class="bills-layout">
      <!-- 侧边栏 -->
      <div class="sidebar-section">
        <Sidebar/>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 搜索区域 -->
        <div class="search-section">
          <div class="search-container">
            <div class="search-header">
              <h3 class="search-title">账单列表</h3>
              <p class="search-subtitle">选择时间范围查看账单记录</p>
            </div>
            <el-form :model="search" size="default" inline class="search-form">
              <el-form-item label="时间范围：">
                <el-date-picker
                  v-model="date"
                  type="daterange"
                  value-format="YYYY-MM-DD"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  class="date-picker"
                  size="large"
                  header-align="center"
                />
              </el-form-item>
              <el-form-item>
                <el-button @click="searchReset(); currentChange()" class="reset-btn" size="large">
                  重置
                </el-button>
                <el-button type="primary" @click="currentChange()" class="search-btn" size="large">
                  <template #icon>
                    <FaIcon name="i-ep:search"/>
                  </template>
                  筛选
                </el-button>
              </el-form-item>
            </el-form>
          </div>
          <ElDivider border-style="dashed"/>
          <div class="table-wrapper">
            <el-table
              v-loading="loading"
              :data="dataList"
              stripe
              highlight-current-row
              border
              height="100%"
              @sort-change="sortChange"
              class="data-table"
              empty-text="暂无账单数据"
            >
              <el-table-column prop="id" label="订单编号" min-width="120" show-overflow-tooltip  align="center"/>
              <el-table-column prop="statusName" label="订单状态" width="120"  align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row.statusName === '支付成功' ? 'success' : 'warning'"
                    size="default"
                  >
                    {{ row.statusName }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="payPriceStr" label="支付金额 (元)" width="150"  align="center">
                <template #default="{ row }">
                  <div class="amount-cell">
                    <span class="amount-symbol">¥</span>
                    <span class="amount-value">{{ row.payPriceStr }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="transactionId" label="交易流水号" min-width="200"  align="center"/>
              <el-table-column prop="createTime" label="创建时间" width="200"  align="center"/>
            </el-table>
          </div>

          <div class="pagination-wrapper">
            <el-pagination
              :current-page="pagination.pageNum"
              :total="pagination.total"
              :page-size="pagination.pageSize"
              :page-sizes="pagination.sizes"
              :layout="pagination.layout"
              :hide-on-single-page="false"
              background
              @size-change="sizeChange"
              @current-change="currentChange"
              class="pagination"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bills-container {
  height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  padding: 0;
  margin: 0;
  width: 100vw;
  position: absolute;
  left: 0;
  right: 0;
  top: 60px;
}

.bills-layout {
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
  gap: 16px;
  min-width: 0;
  overflow: hidden;
}

/* 页面头部 */
.page-header {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title .title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-title .subtitle {
  font-size: 0.9rem;
  color: #5a6c7d;
  margin: 0;
  font-weight: 400;
}

.header-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.8rem;
  color: #5a6c7d;
  font-weight: 500;
}

/* 搜索区域 */
.search-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}

.search-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.search-header {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.search-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.search-subtitle {
  font-size: 0.9rem;
  color: #5a6c7d;
  margin: 0;
  font-weight: 400;
}

.search-form {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.date-picker {
  width: 320px;
}

.reset-btn, .search-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  padding: 12px 20px;
}

.reset-btn {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.15);
  color: #5a6c7d;
}

.reset-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  border-color: rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
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

/* 表格区域 */
.table-section {
  flex: 1;
}

.table-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.table-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.table-actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  color: #667eea;
  font-weight: 500;
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  color: #5a6c7d;
  background: rgba(102, 126, 234, 0.1);
}

.table-wrapper {
  flex: 1;
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: auto;
  border: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 0;
}

.data-table {
  border-radius: 12px;
}

.amount-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 100%;
}

.amount-symbol {
  color: #ff4d4f;
  font-weight: 600;
  font-size: 0.9rem;
}

.amount-value {
  color: #ff4d4f;
  font-weight: 700;
  font-size: 1rem;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.pagination {
  --el-pagination-bg-color: rgba(255, 255, 255, 0.8);
  --el-pagination-button-bg-color: rgba(255, 255, 255, 0.9);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .bills-layout {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

@media (max-width: 768px) {
  .bills-layout {
    padding: 16px;
  }

  .page-header,
  .search-section,
  .table-container {
    padding: 16px;
  }

  .search-form {
    flex-direction: column;
    align-items: stretch;
  }

  .date-picker {
    width: 100%;
  }

  .header-stats {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .table-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .order-id,
  .transaction-id,
  .time-cell {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
