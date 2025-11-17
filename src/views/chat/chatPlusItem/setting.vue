<script setup>
import {Check, Loading} from '@element-plus/icons-vue'
import {defineEmits, ref, watch} from 'vue'
import {modelPageApi} from '@/api/ai/model'
import {providerPageApi} from '@/api/ai/provider'

const props = defineProps({
  hotModel: {
    type: Object,
    default: () => ({}),
  },
})
const emits = defineEmits(['update:activeModel', 'update:moreChat'])

const pageNum = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const finished = ref(false)
const modelList = ref([])
const activeModel = ref(null)
const moreChat = ref(false)

// 弹窗相关状态
const showModelModal = ref(false)

// 筛选条件
const filterForm = ref({
  name: '',
  provider: '',
  type: 'TG',
})

// 供应商选项
const providerOptions = ref([])

watch(() => props.hotModel, (newVal) => {
  if (newVal && newVal.name) {
    handleModel(newVal)
  }
}, {immediate: true})

function getProviderList() {
  providerPageApi({
    pageNum: 1,
    pageSize: 100,
    query: {
      providerCode: '',
      providerName: '',
    },
  }).then((res) => {
    if (res.code === 0) {
      providerOptions.value = res.data.rows
    }
  })
}

function getModelList() {
  loading.value = true
  const params = {
    pageNum: pageNum.value.toString(),
    pageSize: pageSize.value.toString(),
    query: {
      provider: filterForm.value.provider,
      type: filterForm.value.type,
      name: filterForm.value.name,
      hot: false,
      tag: 'chat',
    },
  }
  modelPageApi(params).then((res) => {
    if (res.code === 0) {
      const newData = res.data.rows || []
      // 如果是第一页，直接替换数据
      if (pageNum.value === 1) {
        modelList.value = newData
      } else {
        modelList.value = [...modelList.value, ...newData]
      }

      // 判断是否还有更多数据
      if (newData.length < pageSize.value) {
        finished.value = true
      }

      // 更新页码
      if (!finished.value) {
        pageNum.value++
      }
    }
    loading.value = false
  })
}

function load() {
  if (loading.value || finished.value) {
    return
  }
  getModelList()
}

function handleModel(item) {
  activeModel.value = item
  emits('update:activeModel', {activeModel: item})
  showModelModal.value = false
}

function handleMoreChatChange(value) {
  emits('update:moreChat', value)
}

// 弹窗控制函数
function openModelModal() {
  showModelModal.value = true
  // 重置筛选条件和分页
  filterForm.value = {name: '', provider: '', type: 'TG'}
  pageNum.value = 1
  finished.value = false
  modelList.value = []
  getModelList()
}

function closeModelModal() {
  showModelModal.value = false
}

// 筛选重置
function resetFilter() {
  filterForm.value = {name: '', provider: '', type: ''}
  pageNum.value = 1
  finished.value = false
  modelList.value = []
  getModelList()
}

// 筛选变化处理
function handleFilterChange() {
  pageNum.value = 1
  finished.value = false
  modelList.value = []
  getModelList()
}

function getModelInfo() {
  return {
    activeModel: activeModel.value,
    moreChat: moreChat.value,
  }
}

function formatModel(item) {
  const price = JSON.parse(item.price)
  const currency = price.currency === 'CNY' ? '¥' : '$'
  const contextWindow = item.contextWindowStr ? item.contextWindowStr : item.contextWindow
  return `${item.provider} | ${contextWindow} context | ${currency}${price.promptPrice}/M input tokens | ${currency}${price.completionPrice}/M output tokens`
}

// 初始化加载第一页数据
getModelList()
getProviderList()

defineExpose({
  getModelInfo,
})
</script>

<template>
  <div class="setting-wrap">
    <div class="model-btn" @click="openModelModal">
      <div class="model-content">
        <span class="model-icon">
          <img :src="activeModel?.providerIcon || 'https://www.shuyoutech.com/preview/deepseek.png'" alt="icon">
        </span>
        <span class="model-text">{{ activeModel?.alias }}</span>
      </div>
      <el-icon class="model-arrow">
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
        </svg>
      </el-icon>
    </div>
    <div class="more-chat-tit">
      多轮对话
    </div>
    <el-switch
      v-model="moreChat"
      inline-prompt
      active-text="开"
      inactive-text="关"
      @change="handleMoreChatChange"
    />
    <div class="setting">
      <span class="setting">
        <i class="iconfont icon-plugin"/>
      </span>
    </div>

    <!-- 模型选择弹窗 -->
    <el-dialog
      v-model="showModelModal"
      title="选择模型"
      width="800px"
      :before-close="closeModelModal"
      class="model-modal"
    >
      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-row">
          <div class="filter-item">
            <label>模型名称:</label>
            <el-input
              v-model="filterForm.name"
              placeholder="请输入模型名称"
              clearable
              style="width: 200px"
              @input="handleFilterChange"
            />
          </div>
          <div class="filter-item">
            <label>供应商:</label>
            <el-select
              v-model="filterForm.provider"
              placeholder="请选择供应商"
              clearable
              style="width: 150px"
              @change="handleFilterChange"
            >
              <el-option
                v-for="option in providerOptions"
                :key="option.code"
                :label="option.name"
                :value="option.code"
              />
            </el-select>
          </div>
          <!-- <div class="filter-item">
            <label>模型类型:</label>
            <el-select
              v-model="filterForm.type"
              placeholder="请选择类型"
              clearable
              style="width: 150px"
              @change="handleFilterChange"
            >
              <el-option
                v-for="option in typeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div> -->
          <div class="filter-item">
            <el-button
              @click="resetFilter"
            >
              重置
            </el-button>
          </div>
        </div>
      </div>

      <!-- 模型列表 -->
      <div class="model-list-section">
        <div class="model-wrap">
          <ul v-infinite-scroll="load" class="infinite-list">
            <li
              v-for="(item, index) in modelList"
              :key="item.id + index"
              class="model-item"
              :class="{ selected: activeModel.name === item.name }"
              @click="handleModel(item)"
            >
              <div class="model-item-box">
                <img :src="item.providerIcon" alt="icon" class="model-icon">
                <div class="model-info">
                  <div class="model-name">
                    {{ item.alias || '' }}
                  </div>
                  <div class="model-provider">
                    {{ item.remark || '' }}
                  </div>
                  <div class="model-provider">
                    {{ formatModel(item) }}
                  </div>
                </div>
              </div>
              <el-icon v-if="activeModel === item.name" class="check-icon">
                <Check/>
              </el-icon>
            </li>
            <li v-if="loading" class="loading-item">
              <el-icon class="is-loading">
                <Loading/>
              </el-icon>
              加载中...
            </li>
            <li v-if="finished && modelList.length > 0" class="finished-item">
              没有更多模型了
            </li>
          </ul>
        </div>
      </div>

      <!-- <template #footer>
        <div class="dialog-footer">
          <el-button
            @click="closeModelModal"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            @click="closeModelModal"
          >
            确定
          </el-button>
        </div>
      </template> -->
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.setting-wrap {
  width: 100%;
  position: absolute;
  top: 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  .more-chat-tit {
    font-size: 14px;
    margin-right: 6px;
  }

  .setting {
    margin-left: 10px;
  }
}

.model-btn {
  min-width: auto;
  max-width: 300px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #374151;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  margin-right: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1;
  }

  > * {
    position: relative;
    z-index: 2;
  }

  .model-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .model-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .model-text {
    font-weight: 500;
    font-size: 14px;
    color: #1f2937;
    transition: all 0.3s ease;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .model-arrow {
    color: #9ca3af;
    font-size: 16px;
    transition: all 0.3s ease;
    margin-left: 8px;
  }

  &:hover {
    border-color: #667eea;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
    transform: translateY(-1px);

    &::before {
      opacity: 1;
    }

    .model-icon {
      transform: scale(1.05);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
    }

    .model-text {
      color: #667eea;
    }

    .model-arrow {
      color: #667eea;
      transform: translateX(2px);
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
  }

  // 选中状态
  &.active {
    border-color: #667eea;
    background: linear-gradient(135deg, #f0ebff 0%, #e6f3ff 100%);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);

    .model-text {
      color: #667eea;
      font-weight: 600;
    }

    .model-arrow {
      color: #667eea;
    }

    &::before {
      opacity: 1;
    }
  }
}

// 弹窗样式
.model-modal {
  .filter-section {
    margin-bottom: 20px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;

    .filter-row {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;

      .filter-item {
        display: flex;
        align-items: center;
        gap: 8px;

        label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
        }
      }
    }
  }

  .model-list-section {
    .model-wrap {
      .infinite-list {
        overflow: auto;
        max-height: 400px;
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .model-item {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: all 0.3s ease;
        position: relative;

        .model-item-box {
          display: flex;
          align-items: center;
          width: 85%;
          gap: 12px;

          .model-icon {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            transition: all 0.3s ease;
          }

          .model-info {
            flex: 1;

            .model-name {
              font-weight: 500;
              color: #1f2937;
              margin-bottom: 2px;
              transition: all 0.3s ease;
            }

            .model-provider {
              font-size: 12px;
              color: #6b7280;
              transition: all 0.3s ease;
            }
          }
        }

        &:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

          .model-icon {
            transform: scale(1.05);
          }
        }

        &.selected {
          background: linear-gradient(135deg, #f0ebff 0%, #e6f3ff 100%);
          border: 2px solid #667eea;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
          transform: translateY(-2px);

          .model-icon {
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          }

          .model-info {
            .model-name {
              color: #667eea;
              font-weight: 600;
            }

            .model-provider {
              color: #667eea;
              font-weight: 500;
            }
          }

          &::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px 8px 0 0;
          }
        }

        &.selected:hover {
          background: linear-gradient(135deg, #e6f3ff 0%, #d1e7ff 100%);
          border-color: #5a67d8;
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
          transform: translateY(-3px);
        }
      }

      .loading-item {
        width: 100%;
        text-align: center;
        color: #A3A6AD;
        font-size: 14px;
        padding: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .finished-item {
        width: 100%;
        text-align: center;
        color: #8D9095;
        font-size: 12px;
        padding: 16px;
      }
    }

    .check-icon {
      color: #667eea;
      font-weight: 700;
      font-size: 20px;
      background: rgba(102, 126, 234, 0.1);
      border-radius: 50%;
      padding: 4px;
      transition: all 0.3s ease;
      animation: checkPulse 0.3s ease-out;

      &:hover {
        background: rgba(102, 126, 234, 0.2);
        transform: scale(1.1);
      }
    }

    @keyframes checkPulse {
      0% {
        transform: scale(0.8);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .model-btn {
    max-width: 250px;
    padding: 8px 12px;

    .model-icon {
      width: 24px;
      height: 24px;
    }

    .model-text {
      font-size: 13px;
    }

    .model-arrow {
      font-size: 14px;
    }
  }
}

@media (max-width: 480px) {
  .model-btn {
    max-width: 200px;
    padding: 6px 10px;
    margin-right: 8px;

    .model-icon {
      width: 20px;
      height: 20px;
    }

    .model-text {
      font-size: 12px;
    }

    .model-arrow {
      font-size: 12px;
      margin-left: 4px;
    }
  }
}
</style>
