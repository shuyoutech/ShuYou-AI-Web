<script setup lang="ts">
import Sidebar from './sidebar.vue'
import type {AigcSumUsageVo, AigcUsageMonthVo, AigcUsageQuery, AigcUsageRecordVo} from "@/api/ai/aigc/types.ts";
import {aigcSumUsageApi, aigcUsageByMonthApi, aigcUsagePageApi} from "@/api/ai/aigc";
import {reactive, ref, onMounted, nextTick} from "vue";
import dayjs from "dayjs";
import * as Echarts from 'echarts'

const {pagination, getParams, onSizeChange, onCurrentChange, onSortChange} = usePagination()
const loading = ref(false)
const dataList = ref<AigcUsageRecordVo[]>([])
const date = ref<string[]>([])
const monthDate = ref<string>('')
const search = reactive<PageQuery<AigcUsageQuery>>({
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
  monthDate.value = dayjs().format('YYYY-MM')

  loadUsage()
  getDataList()
  aigcUsageCreditByMonth()

  // 延迟初始化图表，确保DOM已渲染
  nextTick(() => {
    initMonthlyChart()
  })

  window.addEventListener('resize', () => {
    if (monthlyChart) {
      monthlyChart.resize()
    }
  })
})

const usageSum = reactive<AigcSumUsageVo>({})
const loadUsage = async () => {
  const {data} = await aigcSumUsageApi()
  Object.assign(usageSum, data)
}

const getDataList = () => {
  loading.value = true
  Object.assign(search, getParams())
  if (date.value.length > 0) {
    search.query.startDate = date.value[0] + ' 00:00:00'
    search.query.endDate = date.value[1] + ' 23:59:59'
  }
  aigcUsagePageApi(search).then((res: any) => {
    loading.value = false
    dataList.value = res.data.rows || []
    pagination.value.total = Number(res.data.total || 0)
  }).catch((error) => {
    loading.value = false
    console.error('获取表格数据失败:', error)
  })
}

//月度消费算力趋势
const usageMonthData = reactive<AigcUsageMonthVo>({})
const aigcUsageCreditByMonth = () => {
  aigcUsageByMonthApi(monthDate.value).then((res: any) => {
    Object.assign(usageMonthData, res.data)
    // 更新图表数据
    if (monthlyChart) {
      updateChartData()
    }
  }).catch((error) => {
    console.error('获取图表数据失败:', error)
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

const monthlyChartRef = useTemplateRef('monthlyChartRef')
let monthlyChart: any
const initMonthlyChart = () => {
  monthlyChart = Echarts.init(monthlyChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(102, 126, 234, 0.1)'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: 'rgba(102, 126, 234, 0.2)',
      borderWidth: 1,
      textStyle: {
        color: '#2c3e50',
        fontSize: 12
      },
      formatter: function (params: any) {
        const data = params[0]
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px; color: #2c3e50;">${data.axisValue}</div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 8px; height: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%;"></span>
              <span style="color: #5a6c7d;">消费算力: <strong style="color: #667eea;">${data.value}</strong></span>
            </div>
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '8%',
      top: '8%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: usageMonthData.dateList || [],
      axisLabel: {
        rotate: 0,
        fontSize: 12,
        color: '#5a6c7d',
        margin: 12,
        interval: 0
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.06)'
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value}',
        fontSize: 12,
        color: '#5a6c7d'
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(0, 0, 0, 0.06)',
          type: 'solid'
        }
      }
    },
    series: [{
      name: '消费算力',
      type: 'line',
      data: usageMonthData.creditList || [],
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 3,
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [{
            offset: 0, color: '#667eea'
          }, {
            offset: 1, color: '#764ba2'
          }]
        }
      },
      itemStyle: {
        color: '#667eea',
        borderColor: '#ffffff',
        borderWidth: 2,
        shadowColor: 'rgba(102, 126, 234, 0.4)',
        shadowBlur: 8
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(102, 126, 234, 0.3)'
          }, {
            offset: 1, color: 'rgba(102, 126, 234, 0.05)'
          }]
        }
      },
      emphasis: {
        itemStyle: {
          color: '#764ba2',
          shadowBlur: 12,
          shadowColor: 'rgba(102, 126, 234, 0.6)'
        }
      },
      animationDelay: function (idx: number) {
        return idx * 100
      }
    }]
  }
  // 传入数据
  monthlyChart.setOption(option)
}

// 更新图表数据
const updateChartData = () => {
  if (monthlyChart) {
    const option = {
      xAxis: {
        data: usageMonthData.dateList || []
      },
      series: [{
        data: usageMonthData.creditList || []
      }]
    }
    monthlyChart.setOption(option)
  }
}
</script>

<template>
  <div class="usage-container">
    <div class="usage-layout">
      <!-- 侧边栏 -->
      <div class="sidebar-section">
        <Sidebar/>
      </div>

      <!-- 主内容区 -->
      <div class="main-content">
        <!-- 统计卡片区域 -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-card balance-card">
              <div class="stat-content">
                <div class="stat-label">算力余额</div>
                <div class="stat-value">{{ usageSum.balance || 0 }}</div>
              </div>
              <div class="stat-trend">
                <span class="trend-text">可用</span>
              </div>
            </div>
            <div class="stat-card consume-card">
              <div class="stat-content">
                <div class="stat-label">本月消费</div>
                <div class="stat-value">{{ usageSum.consume || 0 }}</div>
              </div>
              <div class="stat-trend">
                <span class="trend-text">已用</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 表格区域 -->
        <div class="table-section">
          <div class="table-container">
            <div class="table-header">
              <h3 class="table-title">使用记录</h3>
              <p class="table-subtitle">查看您的算力使用记录</p>
            </div>
            <div class="search-section">
              <el-form :model="search" size="default" inline class="search-form">
                <el-form-item label="时间范围：">
                  <el-date-picker
                    v-model="date"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    class="date-picker"
                  />
                </el-form-item>
                <el-form-item>
                  <el-button @click="searchReset(); currentChange()" class="reset-btn">
                    重置
                  </el-button>
                  <el-button type="primary" @click="currentChange()" class="search-btn">
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
                border
                empty-text="暂无使用数据"
                style="width: 100%"
                size="small"
                @sort-change="sortChange"
                header-align="center"
              >
                <el-table-column prop="createTime" label="时间" width="160" align="center"/>
                <el-table-column prop="provider" label="供应商" min-width="100" align="center"/>
                <el-table-column prop="modelName" label="模型" min-width="100" align="center"/>
                <el-table-column prop="functionName" label="功能" min-width="120" align="center"/>
                <el-table-column label="Tokens" min-width="140">
                  <template #default="{ row }">
                    <div class="tokens-container">
                      <div class="token-item">
                        <span class="token-label">Input:</span>
                        <span class="token-value input-tokens">{{ row.promptTokens || 0 }}</span>
                      </div>
                      <div class="token-item">
                        <span class="token-label">Output:</span>
                        <span class="token-value output-tokens">{{ row.completionTokens || 0 }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="credit" label="消耗算力" width="100" align="center"/>
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

        <!-- 图表区域 -->
        <div class="chart-section">
          <div class="chart-container">
            <div class="chart-header">
              <div class="chart-title-section">
                <h3 class="chart-title">月度消费趋势</h3>
                <p class="chart-subtitle">查看您的算力消费趋势分析</p>
              </div>
              <div class="chart-controls">
                <div class="block">
                  <span class="demonstration">月份：</span>
                  <el-date-picker
                    v-model="monthDate"
                    type="month"
                    placeholder="选择月份"
                    value-format="YYYY-MM"
                    @change="aigcUsageCreditByMonth"
                  />
                </div>
              </div>
            </div>
            <div class="chart-wrapper">
              <div ref="monthlyChartRef" class="monthly-chart"/>
            </div>
          </div>
        </div>


      </div>
    </div>
  </div>
</template>

<style scoped>
.usage-container {
  height: calc(100vh - 60px);
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  padding: 0;
  margin: 0;
  width: 100vw;
  position: relative;
  overflow: auto;
}

.usage-layout {
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
  display: block;
  min-width: 0;
  overflow: visible;
  position: relative;
  z-index: 10;
  padding-bottom: 20px;
}

/* 统计卡片区域 */
.stats-section {
  margin-bottom: 20px;
  clear: both;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  width: 100%;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.balance-card {
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%);
  border-color: rgba(82, 196, 26, 0.2);
}

.consume-card {
  background: linear-gradient(135deg, rgba(255, 77, 79, 0.1) 0%, rgba(255, 77, 79, 0.05) 100%);
  border-color: rgba(255, 77, 79, 0.2);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.balance-card .stat-icon {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  box-shadow: 0 4px 16px rgba(82, 196, 26, 0.3);
}

.consume-card .stat-icon {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  box-shadow: 0 4px 16px rgba(255, 77, 79, 0.3);
}

.stat-content {
  flex: 1;
  position: relative;
  z-index: 2;
}

.stat-label {
  font-size: 0.9rem;
  color: #5a6c7d;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-unit {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 400;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  position: relative;
  z-index: 2;
}

.trend-text {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 500;
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

.date-picker {
  width: 280px;
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


.data-table {
  border-radius: 12px;
}

.amount-text {
  font-weight: 600;
  color: #ff4d4f;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 16px;
}

/* 图表头部布局 */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 20px;
}

.chart-title-section {
  flex: 1;
}

.chart-controls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.chart-controls .block {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-controls .demonstration {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}

.pagination {
  --el-pagination-bg-color: rgba(255, 255, 255, 0.8);
  --el-pagination-button-bg-color: rgba(255, 255, 255, 0.9);
}

/* 图表区域 */
.chart-section {
  flex-shrink: 0;
  position: relative;
  margin-bottom: 20px !important;
  margin-top: 20px !important;
  z-index: 1;
  clear: both;
}

.chart-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.chart-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.chart-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 4px 0;
}

.chart-subtitle {
  font-size: 0.75rem;
  color: #5a6c7d;
  margin: 0;
  font-weight: 400;
}

.chart-wrapper {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.monthly-chart {
  width: 100%;
  height: 100%;
}

.price-text {
  color: #ff4d4f;
  font-weight: 600;
}

/* Tokens显示样式 */
.tokens-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.token-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  flex: 1;
}

.token-label {
  color: #6c757d;
  font-weight: 500;
  min-width: 40px;
  font-size: 0.8rem;
}

.token-value {
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  min-width: 30px;
  text-align: center;
}

.input-tokens {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.1) 0%, rgba(24, 144, 255, 0.05) 100%);
  color: #1890ff;
  border: 1px solid rgba(24, 144, 255, 0.2);
}

.output-tokens {
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(82, 196, 26, 0.05) 100%);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.2);
}

/* 表格区域 */
.table-section {
  flex: 1;
  min-height: 250px;
  overflow: visible;
  margin-bottom: 20px !important;
  margin-top: 0 !important;
  position: relative;
  z-index: 10;
  clear: both;
}

.table-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

.table-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
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

.table-wrapper {
  flex: 1;
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: auto;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: white;
  position: relative;
  z-index: 15;
  min-height: 150px;
  max-height: 300px;
}

/* 表格列标题居中 */
.table-wrapper :deep(.el-table th > .cell) {
  text-align: center !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .usage-layout {
    flex-direction: column;
  }

  .sidebar-section {
    width: 100%;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .usage-layout {
    padding: 16px;
  }

  .stat-card {
    padding: 20px;
    gap: 16px;
  }

  .stat-icon {
    width: 50px;
    height: 50px;
  }

  .stat-value {
    font-size: 1.5rem;
  }

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

  .chart-container {
    padding: 16px;
  }

  .chart-wrapper {
    height: 300px;
  }

  .chart-title {
    font-size: 1.1rem;
  }

  .chart-subtitle {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }

  .stat-content {
    order: 2;
  }

  .stat-trend {
    order: 3;
  }
}
</style>
