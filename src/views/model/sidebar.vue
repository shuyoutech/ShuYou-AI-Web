<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {providerPageApi} from "@/api/ai/provider";
import {queryHotDataApi} from "@/api/api";
import type {ProviderVo} from "@/api/ai/provider/types.ts";

// Props
const props = defineProps<{
  selectedProvider: string
  selectedModality: string
}>()

// Emits
const emit = defineEmits<{
  'update:selectedProvider': [value: string]
  'update:selectedModality': [value: string]
}>()

// 响应式数据
const expandedSections = ref({
  provider: true,
  modality: true,
})

// 加载页面
onMounted(() => {
  initData()
})

// 初始化数据
const initData = () => {
  loadProviderList()
  loadModelTypeList()
}

// 供应商选项
const providers = ref<ProviderVo[]>([])
const loadProviderList = () => {
  providerPageApi({
    pageNum: 1,
    pageSize: 100,
    query: {
      status: '1',
    },
  }).then((res: any) => {
    if (res.data && res.data.rows && res.data.rows.length > 0) {
      providers.value = res.data.rows
    }
  }).catch((error) => {
    console.error('加载供应商数据失败:', error)
  })
}

//模型类型
const modelTypeList = ref<Options[]>([])
const loadModelTypeList = () => {
  queryHotDataApi('dict_model_type').then((res: any) => {
    if (res.data && res.data.length > 0) {
      modelTypeList.value = res.data
    }
  }).catch((error) => {
    console.error('加载模型类型数据失败:', error)
  })
}

// 切换展开状态
const toggleSection = (section: string) => {
  expandedSections.value[section as keyof typeof expandedSections.value] =
    !expandedSections.value[section as keyof typeof expandedSections.value]
}

// 选择供应商
const selectProvider = (provider: string) => {
  // 如果点击的是当前选中的供应商，则取消选中
  if (props.selectedProvider === provider) {
    emit('update:selectedProvider', '')
  } else {
    emit('update:selectedProvider', provider)
  }
}

// 选择模态类型
const selectModality = (modality: string) => {
  // 如果点击的是当前选中的模型类型，则取消选中
  if (props.selectedModality === modality) {
    emit('update:selectedModality', '')
  } else {
    emit('update:selectedModality', modality)
  }
}

// 获取模型类型图标
const getModalityIcon = (value: string) => {
  const iconMap: Record<string, string> = {
    'text': 'i-ri:text',
    'image': 'i-ri:image-line',
    'video': 'i-ri:video-line',
    'audio': 'i-ri:mic-line',
    'multimodal': 'i-ri:apps-line',
    'embedding': 'i-ri:vector-line',
    'chat': 'i-ri:chat-3-line',
    'completion': 'i-ri:edit-line',
    'vision': 'i-ri:eye-line',
    'speech': 'i-ri:volume-up-line'
  }

  const lowerValue = value.toLowerCase()
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerValue.includes(key)) {
      return icon
    }
  }

  return 'i-ri:settings-3-line' // 默认图标
}

</script>

<template>
  <div class="sidebar-container">
    <!-- 供应商筛选 -->
    <div class="filter-section">
      <div
        class="section-header"
        @click="toggleSection('provider')"
      >
        <h3 class="section-title">供应商</h3>
        <FaIcon
          :name="expandedSections.provider ? 'i-ep:arrow-up' : 'i-ep:arrow-down'"
          class="expand-icon"
        />
      </div>

      <div v-show="expandedSections.provider" class="section-content">
        <div v-if="providers.length === 0" class="loading-state">
          <div class="loading-text">加载中...</div>
        </div>
        <div v-else class="providers-grid">
          <div
            v-for="(provider, index) in providers"
            :key="provider.name || index"
            class="provider-card"
            :class="{ active: props.selectedProvider === provider.code }"
            @click="selectProvider(provider.code)"
          >
            <div class="provider-icon">
              <img
                :src="provider.icon"
                :alt="provider.name"
                class="provider-icon-img"
              />
            </div>
            <div class="provider-info">
              <span class="provider-name">{{ provider.name }}</span>
              <span class="provider-count">{{ provider.modelCount }}个模型</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 模态类型筛选 -->
    <div class="filter-section">
      <div
        class="section-header"
        @click="toggleSection('modality')"
      >
        <h3 class="section-title">模型类型</h3>
        <FaIcon
          :name="expandedSections.modality ? 'i-ep:arrow-up' : 'i-ep:arrow-down'"
          class="expand-icon"
        />
      </div>

      <div v-show="expandedSections.modality" class="section-content">
        <div v-if="modelTypeList.length === 0" class="loading-state">
          <div class="loading-text">加载中...</div>
        </div>
        <div v-else class="modality-grid">
          <div
            v-for="(modality, index) in modelTypeList"
            :key="modality.value || index"
            class="modality-card"
            :class="{ active: props.selectedModality === modality.value }"
            @click="selectModality(modality.value)"
          >
            <div class="modality-icon">
              <FaIcon :name="getModalityIcon(modality.value)" class="modality-icon-svg"/>
            </div>
            <div class="modality-info">
              <span class="modality-name">{{ modality.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar-container {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
  height: fit-content;
  position: sticky;
  top: 20px;
  width: 100%;
  box-sizing: border-box;
}

.filter-section {
  margin-bottom: 24px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.expand-icon {
  color: #9ca3af;
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.section-content {
  padding-left: 8px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 0.9rem;
}

.loading-text {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 供应商网格样式 */
.providers-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.provider-card {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: rgba(248, 249, 250, 0.8);
  min-height: 60px;
}

.provider-card:hover {
  background: rgba(102, 126, 234, 0.05);
  border-color: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.provider-card.active {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.provider-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.provider-icon-img {
  width: 24px;
  height: 24px;
  object-fit: contain;
  border-radius: 4px;
}

.default-provider-icon-svg {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.provider-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.provider-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-height: 1.2em;
  display: block;
}

.provider-count {
  font-size: 0.65rem;
  color: #9ca3af;
  font-weight: 500;
  white-space: nowrap;
  min-height: 1em;
  display: block;
}

.provider-children {
  margin-top: 4px;
  padding-left: 16px;
  border-left: 2px solid #f0f0f0;
}

.child-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.child-item:hover {
  background: rgba(102, 126, 234, 0.05);
}

.child-item.active {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.child-name {
  color: inherit;
}

.child-count {
  font-size: 0.75rem;
  color: #9ca3af;
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 5px;
  border-radius: 8px;
}

/* 模态类型网格样式 */
.modality-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.modality-card {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: rgba(248, 249, 250, 0.8);
  min-height: 60px;
}

.modality-card:hover {
  background: rgba(102, 126, 234, 0.05);
  border-color: rgba(102, 126, 234, 0.1);
  transform: translateY(-1px);
}

.modality-card.active {
  background: rgba(102, 126, 234, 0.1);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.modality-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.modality-icon-svg {
  width: 20px;
  height: 20px;
  color: #667eea;
}

.modality-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.modality-name {
  font-size: 0.8rem;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sub-expand-icon {
  color: #9ca3af;
  font-size: 0.7rem;
  margin-left: 8px;
  transition: transform 0.3s ease;
}

.modality-children {
  margin-top: 4px;
  padding-left: 16px;
  border-left: 2px solid #f0f0f0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .sidebar-container {
    position: static;
    margin-bottom: 20px;
  }
}

@media (max-width: 768px) {
  .sidebar-container {
    padding: 16px;
  }

  .section-header {
    padding: 6px 0;
  }

  .section-title {
    font-size: 0.9rem;
  }

  .providers-grid,
  .modality-grid {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .provider-card,
  .modality-card {
    padding: 10px;
  }

  .provider-icon,
  .modality-icon {
    width: 28px;
    height: 28px;
    margin-right: 10px;
  }

  .provider-icon-img,
  .modality-icon-svg {
    width: 16px;
    height: 16px;
  }

  .provider-name,
  .modality-name {
    font-size: 0.8rem;
  }

  .provider-count {
    font-size: 0.65rem;
  }

  .child-item {
    padding: 4px 10px;
    font-size: 0.8rem;
  }
}
</style>
