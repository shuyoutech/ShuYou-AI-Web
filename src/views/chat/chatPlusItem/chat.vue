<script setup>
import {InfoFilled, Promotion} from '@element-plus/icons-vue'
import {defineEmits, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {queryHotDataApi} from '@/api/api/index.js'
import EditTemplate from './editTemplate.vue'
import ExitItem from './exitItem.vue'
import ChatUpload from './chatUpload.vue'
import ChatUploadList from './chatUploadList.vue'

const emits = defineEmits(['submit'])
const route = useRoute()
const router = useRouter()
const inputValue = ref('')
const modelFunc = ref('chat')
const title = ref('漫游全球AI大模型')
const funcList = ref([
  {name: 'AI翻译', icon: 'translate', path: '/chat/translation', color: '#8b5cf6'},
  {name: 'AI写作', icon: 'write', path: '/chat/writing', color: '#10b981'},
  {name: 'AI编程', icon: 'code', path: '/chat/coder', color: '#f59e0b'},
])
const isDeepSeek = ref((localStorage.getItem('isDeepSeek') && localStorage.getItem('isDeepSeek') === 'true') || false)
const isLinkNet = ref((localStorage.getItem('isLinkNet') && localStorage.getItem('isLinkNet') === 'true') || false)

const showType = ref('chat')
const scrollContainer = ref(null)

// 技能标签相关
const showSkillTag = ref(false)
const currentSkill = ref('')

// 语言选择相关
const sourceLanguage = ref('')
const targetLanguage = ref('')
const sourceLanguageOptions = ref([])
const targetLanguageOptions = ref([])

// 控制深度思考和网络搜索按钮的显示
const showDeepBtn = ref(false)
const showNetBtn = ref(false)
const showModelConfig = ref(false)
// 控制是否显示附件上传
const showUpload = ref(false)
const uploadTypes = ref(['doc', 'image'])
// 模板列表
const selectedTemplate = ref(null)
const activeTemplateCategory = ref('全部')
const templateSegments = ref([])
const editTmpRef = ref(null)

// 模型配置数据
const modelConfig = reactive({
  systemPrompt: '',
  maxMessageCount: 0,
  temperature: null,
  topP: null,
  maxOutputTokens: 0,
})

// 热门模型滚动处理
function scrollHotModels(direction) {
  if (!scrollContainer.value) {
    return
  }

  const container = scrollContainer.value
  const scrollAmount = 200 // 每次滚动的距离

  if (direction === 'left') {
    container.scrollLeft -= scrollAmount
  } else {
    container.scrollLeft += scrollAmount
  }
}

function handleEnterKey(event) {
  // 阻止默认的回车换行行为
  event.preventDefault()
  // 调用发送消息方法
  submit()
}

function handleDeepSeek() {
  isDeepSeek.value = !isDeepSeek.value
  localStorage.setItem('isDeepSeek', isDeepSeek.value)
}

function handleLinkNet() {
  isLinkNet.value = !isLinkNet.value
  localStorage.setItem('isLinkNet', isLinkNet.value)
}

function handleFunc(item) {
  if (!item.path) {
    return
  }
  router.push(item.path)
}

// 语言选择处理函数
function handleSourceLanguageChange(value) {
  sourceLanguage.value = value
}

function handleTargetLanguageChange(value) {
  targetLanguage.value = value
}

// 交换语言
function swapLanguages() {
  const temp = sourceLanguage.value
  sourceLanguage.value = targetLanguage.value
  if (temp === 'auto') {
    targetLanguage.value = 'English'
  } else {
    targetLanguage.value = temp
  }
}

// 处理技能标签关闭
function handleSkillClose() {
  showSkillTag.value = false
  // 返回主页面
  router.push('/chat')
}

// 加载页面
onMounted(() => {
  initDisplay()
  initData()
})

// 初始化数据
const initData = async () => {
  await Promise.all([
    loadModelList(),
    loadLangOptions(),
  ])
}

const initDisplay = () => {
  switch (route.path) {
    case '/chat/completions':
      title.value = '漫游全球AI大模型'
      showType.value = 'chat'
      showSkillTag.value = false
      modelFunc.value = 'chat'
      break
    case '/chat/translation':
      title.value = 'AI翻译'
      showType.value = 'translate'
      showSkillTag.value = true
      currentSkill.value = '翻译'
      modelFunc.value = 'mt'
      break
    case '/chat/writing':
      title.value = 'AI写作'
      showType.value = 'write'
      showSkillTag.value = true
      currentSkill.value = '帮我写作'
      modelFunc.value = 'write'
      break
    case '/chat/coder':
      title.value = 'AI编程'
      showType.value = 'code'
      showSkillTag.value = true
      currentSkill.value = 'AI编程'
      modelFunc.value = 'coder'
      break
    default:
      title.value = '漫游全球AI大模型'
      showType.value = 'chat'
      showSkillTag.value = false
      break
  }
}

// 加载热门模型列表
const hotModelList = ref([])
const modelList = ref([])
const selectedModelName = ref('')
const selectModelProvider = ref('')
const selectModelIcon = ref('')

// 选择热门模型
function selectHotModel(model) {
  // 取消所有模型的选中状态
  hotModelList.value.forEach((item) => {
    item.selected = false
  })
  // 设置当前模型为选中状态
  model.selected = true
  selectedModelName.value = model.name
  selectModelIcon.value = model.providerIcon
  selectModelProvider.value = model.provider
  showDeepBtn.value = model.enableThinking !== undefined ? model.enableThinking : false
  showNetBtn.value = model.enableSearch !== undefined ? model.enableSearch : false
  showUpload.value = model.inputs && model.inputs.length > 0 && (model.inputs.includes('doc') || model.inputs.includes('image'))
  if (showUpload.value) {
    uploadTypes.value = model.inputs
  } else {
    uploadTypes.value = []
  }
}

// 处理模型选择变化
function handleModelChange(value) {
  // 从modelList中找到当前选中模型的父模型的icon
  if (value && modelList.value.length > 0) {
    let foundIcon = ''
    let enableThinking = false
    let enableSearch = false
    let inputs = []
    // 首先尝试在父模型的children中查找
    for (const parentModel of modelList.value) {
      if (parentModel.children && parentModel.children.length > 0) {
        const foundChild = parentModel.children.find(child => child.value === value)
        if (foundChild) {
          foundIcon = parentModel.metadata?.icon || ''
          selectModelProvider.value = foundChild.metadata?.provider || ''
          enableThinking = foundChild.metadata?.enableThinking !== undefined ? foundChild.metadata.enableThinking : false
          enableSearch = foundChild.metadata?.enableSearch !== undefined ? foundChild.metadata.enableSearch : false
          inputs = foundChild.metadata?.inputs && foundChild.metadata.inputs.length > 0 && (foundChild.metadata.inputs.includes('doc') || foundChild.metadata.inputs.includes('image')) ? foundChild.metadata.inputs : []
          break
        }
      }
    }

    // 如果没有找到父模型，则查找是否有直接的模型匹配（没有父模型的情况）
    if (!foundIcon) {
      for (const model of modelList.value) {
        if (model.value === value) {
          foundIcon = model.metadata?.icon || ''
          selectModelProvider.value = model.metadata?.code || ''
          enableThinking = model.metadata?.enableThinking !== undefined ? model.metadata.enableThinking : false
          enableSearch = model.metadata?.enableSearch !== undefined ? model.metadata.enableSearch : false
          inputs = model.metadata?.inputs && model.metadata.inputs.length > 0 && (model.metadata.inputs.includes('doc') || model.metadata.inputs.includes('image')) ? model.metadata.inputs : []
          break
        }
      }
    }

    selectModelIcon.value = foundIcon
    showDeepBtn.value = enableThinking
    showNetBtn.value = enableSearch
    showUpload.value = inputs && inputs.length > 0 && (inputs.includes('doc') || inputs.includes('image'))
    if (showUpload.value) {
      uploadTypes.value = inputs
    } else {
      uploadTypes.value = []
    }

    hotModelList.value.forEach((item) => {
      item.selected = item.name === value
    })
  }
}

// 文件列表
const fileList = ref([])
const chatUploadListRef = ref(null)

function handleFileUpload(files) {
  fileList.value = [...fileList.value, ...files]
}

function handleRemoveFile(index) {
  fileList.value.splice(index, 1)
}

function submit() {
  if (inputValue.value === '') {
    return
  }

  // 初始化文件ID数组
  let docFileIds = []
  let imageFileIds = []

  if (showUpload.value && chatUploadListRef.value) {
    // 检查是否有需要提交的文件
    const uploadedFiles = chatUploadListRef.value.getAllUploadedFiles()

    if (uploadedFiles.count.total > 0) {
      // 提取文件类型的ID
      docFileIds = uploadedFiles.files.map(file => file.id)
      // 提取图片类型的ID
      imageFileIds = uploadedFiles.images.map(file => file.id)

      // console.log('提交文件信息:', {
      //   total: uploadedFiles.count.total,
      //   docFiles: docFileIds,
      //   imageFiles: imageFileIds,
      // })
    }
  }

  const chatObj = {
    provider: selectModelProvider.value,
    model: selectedModelName.value,
    function: modelFunc.value,
    params: {
      message: inputValue.value,
      enableThinking: isDeepSeek.value ? isDeepSeek.value : false,
      enableSearch: isLinkNet.value ? isLinkNet.value : false,
      sourceLang: sourceLanguage.value,
      targetLang: targetLanguage.value,
      prompt: modelConfig.systemPrompt,
      temperature: modelConfig.temperature,
      topP: modelConfig.topP,
      maxTokens: modelConfig.maxOutputTokens,
      fileIds: docFileIds,
      imageIds: imageFileIds,
      messageCount: modelConfig.maxMessageCount,
    },
    modelIcon: selectModelIcon.value,
    modelEnableThinking: showDeepBtn.value ? showDeepBtn.value : false,
    modelEnableSearch: showNetBtn.value ? showNetBtn.value : false,
  }
  emits('submit', chatObj)
}

// 加载模型列表
const loadModelList = async () => {
  if (route.path === '/chat/completions') {
    // 所有对话模型
    queryHotDataApi('ai_provider_model_chat').then(({data}) => {
      modelList.value = data
    })
    // 热门模型
    queryHotDataApi('ai_model_chat').then(({data}) => {
      hotModelList.value = data
      hotModelList.value[0].selected = true
      selectedModelName.value = hotModelList.value[0].name
      selectModelIcon.value = hotModelList.value[0].providerIcon
      selectModelProvider.value = hotModelList.value[0].provider
      showDeepBtn.value = hotModelList.value[0].enableThinking !== undefined ? hotModelList.value[0].enableThinking : false
      showNetBtn.value = hotModelList.value[0].enableSearch !== undefined ? hotModelList.value[0].enableSearch : false
      showUpload.value = hotModelList.value[0].inputs && hotModelList.value[0].inputs.length > 0 && (hotModelList.value[0].inputs.includes('doc') || hotModelList.value[0].inputs.includes('image'))
      if (showUpload.value) {
        uploadTypes.value = hotModelList.value[0].inputs
      } else {
        uploadTypes.value = []
      }
    })
  } else if (route.path === '/chat/translation') {
    queryHotDataApi('ai_model_mt').then(({data}) => {
      hotModelList.value = data
      hotModelList.value[0].selected = true
      selectedModelName.value = hotModelList.value[0].name
      selectModelIcon.value = hotModelList.value[0].providerIcon
      selectModelProvider.value = hotModelList.value[0].provider
      showDeepBtn.value = false
      showNetBtn.value = false
    })
  } else if (route.path === '/chat/writing') {
    queryHotDataApi('ai_model_write').then(({data}) => {
      modelList.value = data
      selectedModelName.value = data[0].children[0].value
      selectModelIcon.value = data[0].metadata.icon
      selectModelProvider.value = data[0].children[0].metadata.provider
      showDeepBtn.value = data[0].children[0].metadata.enableThinking !== undefined ? data[0].children[0].metadata.enableThinking : false
      showNetBtn.value = data[0].children[0].metadata.enableSearch !== undefined ? data[0].children[0].metadata.enableSearch : false
    })
    queryHotDataApi('ai_chat_write_type').then(({data}) => {
      writingTemplates.value = data
    })
  } else if (route.path === '/chat/coder') {
    queryHotDataApi('ai_model_code').then(({data}) => {
      modelList.value = data
      selectedModelName.value = data[0].children[0].value
      selectModelIcon.value = data[0].metadata.icon
      selectModelProvider.value = data[0].children[0].metadata.provider
      showDeepBtn.value = false
      showNetBtn.value = false
    })
    queryHotDataApi('ai_chat_code_type').then(({data}) => {
      writingTemplates.value = data
    })
  }
}

// 加载翻译语言选择
const loadLangOptions = async () => {
  sourceLanguage.value = ''
  targetLanguage.value = ''
  sourceLanguageOptions.value.length = 0
  targetLanguageOptions.value.length = 0
  if (route.path === '/chat/translation') {
    queryHotDataApi('dict_lang_type').then(({data}) => {
      sourceLanguageOptions.value.push({value: 'auto', label: '自动检测'})
      sourceLanguageOptions.value.push(...data)
      targetLanguageOptions.value = data
      sourceLanguage.value = 'auto'
      targetLanguage.value = 'English'
    })
  }
}

// 写作模板数据
const writingTemplates = ref([])

// 获取当前分类的模板列表
function getCurrentTemplates() {
  // 编程特殊处理
  if (route.path === '/chat/coder') {
    activeTemplateCategory.value = '编程'
    return writingTemplates.value[0]?.templates
  }
  if (activeTemplateCategory.value === '全部') {
    return writingTemplates.value[0]?.templates
  }
  const category = writingTemplates.value.find(cat => cat.category === activeTemplateCategory.value)
  return category ? category.templates : []
}

// 获取所有分类
function getCategories() {
  return writingTemplates.value.map(cat => cat.category)
}

// 选择模板
function selectTemplate(template) {
  selectedTemplate.value = template
  inputValue.value = template.template
  // 将模板的template数组赋值给templateSegments
  templateSegments.value = template.template
}

// 切换分类
function switchCategory(category) {
  activeTemplateCategory.value = category
  selectedTemplate.value = null
}

// 更新模板片段
function updateTemplateSegments(newSegments) {
  templateSegments.value = newSegments
}

// 处理模板变化
function handleTemplateChange(_newSegments) {
  // 可以在这里处理模板变化逻辑
  const result = editTmpRef.value.getTemplateResult()
  inputValue.value = result
}
</script>

<template>
  <div class="chat-wrap">
    <div class="titles write-box">
      {{ title }}
      <!-- 技能标签 -->
      <div class="skill-tag-container">
        <ExitItem
          v-if="showSkillTag"
          :skill-name="currentSkill"
          :visible="showSkillTag"
          @close="handleSkillClose"
        />
      </div>
    </div>
    <div v-show="hotModelList.length > 0" class="hot-model-box">
      <div class="hot-model-header">
        <span class="hot-model-title">热门模型:</span>
      </div>
      <div class="hot-model-container">
        <button class="scroll-btn left" @click="scrollHotModels('left')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor"/>
          </svg>
        </button>

        <div class="hot-model-list" ref="scrollContainer">
          <div
            v-for="model in hotModelList"
            :key="model.id"
            class="hot-model-item"
            :class="{ active: model.selected }"
            @click="selectHotModel(model)"
          >
            <span class="model-icon">
              <img :src="model.providerIcon" alt="icon">
            </span>
            <span class="model-name">{{ model.alias }}</span>
          </div>
        </div>

        <button class="scroll-btn right" @click="scrollHotModels('right')">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </div>
    <!-- 普通对话 -->
    <div v-if="showType === 'chat'" class="chat-box">
      <ChatUploadList
        ref="chatUploadListRef"
        :file-list="fileList"
        @remove="handleRemoveFile"
      />
      <el-input v-model="inputValue" placeholder="发消息" type="textarea" :rows="4" resize="none"
                @keydown.enter="handleEnterKey"/>
      <div class="tool-btn">
        <div class="left-box">
          <div class="model-select-box">
            <div class="icon-box">
              <img :src="selectModelIcon" alt="">
            </div>
            <div class="input-box">
              <el-cascader
                v-model="selectedModelName"
                :options="modelList"
                :show-all-levels="false"
                :props="{
                  expandTrigger: 'hover',
                  value: 'value',
                  label: 'label',
                  children: 'children',
                  emitPath: false,
                }"
                placeholder="选择对话模型"
                @change="handleModelChange"
                class="write-model-cascader"
              >
                <template #default="{ data }">
                  <span v-if="data.parentId === '0'" class="cascader-icon">
                    <img :src="data.metadata.icon" alt="">
                  </span>
                  <span>{{ data.label }}</span>
                </template>
              </el-cascader>
            </div>
          </div>
          <div v-if="showDeepBtn" class="model-btn" :class="{ active: isDeepSeek }" @click="handleDeepSeek">
            <div class="btn-icon deep-thinking-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.06431 5.93348C7.68763 5.93348 8.19307 6.4391 8.19322 7.06239C8.19322 7.68579 7.68772 8.19129 7.06431 8.19129C6.44099 8.19119 5.9354 7.68573 5.9354 7.06239C5.93555 6.43917 6.44108 5.93359 7.06431 5.93348Z"
                  fill="currentColor"></path>
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M8.6815 0.963754C10.1169 0.44708 11.6266 0.37489 12.5633 1.31141C13.5 2.24812 13.4277 3.75782 12.911 5.19325C12.7126 5.74437 12.4386 6.31802 12.0965 6.89735C12.4969 7.54645 12.8141 8.19024 13.036 8.80653C13.5527 10.242 13.6251 11.7516 12.6883 12.6884C11.7516 13.6251 10.242 13.5527 8.8065 13.036C8.19022 12.8141 7.54641 12.4969 6.89732 12.0966C6.31797 12.4386 5.74435 12.7126 5.19322 12.911C3.75777 13.4277 2.2481 13.5001 1.31138 12.5634C0.374859 11.6266 0.447049 10.1169 0.963724 8.68153C1.17185 8.10345 1.46321 7.50069 1.82896 6.89247C1.52182 6.35717 1.27235 5.82832 1.08872 5.31825C0.572068 3.88284 0.499714 2.37312 1.43638 1.43641C2.37308 0.499716 3.8828 0.572105 5.31822 1.08875C5.82828 1.27238 6.35715 1.52186 6.89243 1.82899C7.50066 1.46324 8.10341 1.17187 8.6815 0.963754ZM11.3573 8.01161C10.9083 8.62259 10.3901 9.22879 9.80943 9.80946C9.22877 10.3901 8.62255 10.9084 8.01158 11.3573C8.4257 11.5841 8.8287 11.7688 9.21275 11.9071C10.5456 12.3869 11.4246 12.2548 11.8397 11.8397C12.2548 11.4247 12.3869 10.5456 11.9071 9.21278C11.7688 8.82872 11.5841 8.42574 11.3573 8.01161ZM2.56529 8.02918C2.37344 8.39328 2.21495 8.74802 2.09263 9.08778C1.61291 10.4204 1.74512 11.2996 2.16001 11.7147C2.57505 12.1298 3.45415 12.2619 4.78697 11.7821C5.11057 11.6656 5.44786 11.5164 5.7938 11.3368C5.249 10.9223 4.70922 10.4534 4.19029 9.93446C3.57578 9.31993 3.03169 8.67639 2.56529 8.02918ZM6.90708 3.24696C6.24065 3.70485 5.5646 4.26327 4.91392 4.91395C4.26325 5.56462 3.70482 6.24069 3.24693 6.90711C3.72674 7.63331 4.32777 8.37465 5.03892 9.08582C5.64943 9.69633 6.28183 10.2265 6.90806 10.6679C7.59368 10.2026 8.2908 9.63082 8.96079 8.96082C9.6308 8.29082 10.2025 7.59372 10.6678 6.90809C10.2265 6.28186 9.69631 5.64946 9.08579 5.03895C8.37462 4.32779 7.63328 3.72678 6.90708 3.24696ZM11.7147 2.16004C11.2996 1.74515 10.4204 1.61294 9.08775 2.09266C8.74835 2.21485 8.39382 2.37277 8.03013 2.56434C8.67728 3.03071 9.31995 3.57586 9.93443 4.19032C10.4534 4.70926 10.9223 5.24902 11.3368 5.79383C11.5164 5.44791 11.6656 5.11058 11.7821 4.787C12.2618 3.45422 12.1297 2.57508 11.7147 2.16004ZM4.91197 2.21766C3.57922 1.73794 2.70004 1.87001 2.28501 2.28504C1.87001 2.70009 1.73791 3.57926 2.21763 4.912C2.31709 5.18828 2.44112 5.47433 2.58677 5.76747C3.01931 5.18876 3.51474 4.61586 4.06529 4.06532C4.61584 3.51477 5.18872 3.01934 5.76743 2.5868C5.47431 2.44116 5.18824 2.31712 4.91197 2.21766Z"
                      fill="currentColor"></path>
              </svg>
            </div>
            <span class="btn-text">深度思考</span>
          </div>
          <div v-if="showNetBtn" class="model-btn" :class="{ active: isLinkNet }" @click="handleLinkNet">
            <div class="btn-icon network-search-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M7.00003 0.150452C10.7832 0.150452 13.8496 3.21691 13.8496 7.00006C13.8496 10.7832 10.7832 13.8497 7.00003 13.8497C3.21688 13.8497 0.150421 10.7832 0.150421 7.00006C0.150421 3.21691 3.21688 0.150452 7.00003 0.150452ZM5.37796 7.59967C5.4267 9.0321 5.64754 10.2966 5.97366 11.2198C6.15996 11.7471 6.36946 12.1302 6.57327 12.3702C6.77751 12.6106 6.92343 12.6505 7.00003 12.6505C7.07663 12.6505 7.22255 12.6106 7.42679 12.3702C7.6306 12.1302 7.8401 11.7471 8.0264 11.2198C8.35252 10.2966 8.57336 9.0321 8.6221 7.59967H5.37796ZM1.38187 7.59967C1.61456 9.80498 3.11593 11.6305 5.14261 12.336C5.03268 12.1129 4.93227 11.8725 4.8428 11.6192C4.46342 10.5452 4.22775 9.13994 4.17874 7.59967H1.38187ZM9.82132 7.59967C9.77232 9.13994 9.53664 10.5452 9.15726 11.6192C9.06774 11.8726 8.96648 12.1127 8.85648 12.336C10.8836 11.6307 12.3855 9.8053 12.6182 7.59967H9.82132ZM7.00003 1.34967C6.92343 1.34967 6.77751 1.38955 6.57327 1.62994C6.36946 1.86994 6.15996 2.25297 5.97366 2.78033C5.64754 3.70357 5.4267 4.96802 5.37796 6.40045H8.6221C8.57336 4.96802 8.35252 3.70357 8.0264 2.78033C7.8401 2.25297 7.6306 1.86994 7.42679 1.62994C7.22255 1.38955 7.07663 1.34967 7.00003 1.34967ZM8.85648 1.66315C8.96663 1.88662 9.06763 2.12721 9.15726 2.38092C9.53664 3.45494 9.77232 4.86018 9.82132 6.40045H12.6182C12.3855 4.19471 10.8837 2.36834 8.85648 1.66315ZM5.14261 1.66315C3.11578 2.36856 1.61457 4.19503 1.38187 6.40045H4.17874C4.22775 4.86018 4.46342 3.45494 4.8428 2.38092C4.93237 2.12736 5.03253 1.88651 5.14261 1.66315Z"
                      fill="currentColor"></path>
              </svg>
            </div>
            <span class="btn-text">联网搜索</span>
          </div>
          <div class="model-btn" @click="showModelConfig = true">
            <div class="btn-icon config-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- 第一条线 -->
                <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round"/>
                <circle cx="7" cy="3" r="1.5" fill="currentColor"/>
                <!-- 第二条线 -->
                <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round"/>
                <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                <!-- 第三条线 -->
                <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" stroke-width="1.5"
                      stroke-linecap="round"/>
                <circle cx="7" cy="11" r="1.5" fill="currentColor"/>
              </svg>
            </div>
            <span class="btn-text">模型配置</span>
          </div>
        </div>
        <div class="right-box">
          <div v-show="showUpload" class="inline-block">
            <ChatUpload
              :upload-types="uploadTypes"
              @upload="handleFileUpload"
            />
          </div>
          <el-tooltip
            class="box-item"
            effect="light"
            content="提交"
            placement="top-start"
          >
            <el-button v-auth type="primary" :icon="Promotion" circle :disabled="inputValue === ''" class="submit-btn"
                       @click="submit"/>
          </el-tooltip>
        </div>
      </div>
    </div>
    <!-- 翻译 -->
    <div v-if="showType === 'translate'" class="translate-box">
      <el-input v-model="inputValue" placeholder="请输入要翻译的内容" type="textarea" :rows="4" resize="none"
                @keydown.enter="handleEnterKey"/>
      <div class="tool-btn">
        <div class="left-box">
          <div class="language-selector">
            <el-select
              v-model="sourceLanguage"
              class="language-select"
              @change="handleSourceLanguageChange"
            >
              <el-option
                v-for="option in sourceLanguageOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <div class="swap-btn" @click="swapLanguages">
              <el-icon>
                <svg viewBox="0 0 1024 1024" width="16" height="16">
                  <path
                    d="M847.9 592H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h695.9c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8zM876.9 392H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h724.9c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z"
                    fill="currentColor"/>
                </svg>
              </el-icon>
            </div>
            <el-select
              v-model="targetLanguage"
              placeholder="中文 (简体)"
              class="language-select"
              @change="handleTargetLanguageChange"
            >
              <el-option
                v-for="option in targetLanguageOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>
        <div class="right-box">
          <el-tooltip
            class="box-item"
            effect="light"
            content="提交"
            placement="top-start"
          >
            <el-button v-auth type="primary" :icon="Promotion" circle :disabled="inputValue === ''" class="submit-btn"
                       @click="submit"/>
          </el-tooltip>
        </div>
      </div>
    </div>
    <!-- 写作 -->
    <div v-if="showType === 'write'" class="chat-box">
      <!-- 使用EditTemplate组件 -->
      <EditTemplate
        ref="editTmpRef"
        :template-segments="templateSegments"
        @update:template-segments="updateTemplateSegments"
        @template-change="handleTemplateChange"
        @submit="submit"
      />
      <div class="tool-btn">
        <div class="left-box">
          <div class="model-select-box">
            <div class="icon-box">
              <img :src="selectModelIcon" alt="">
            </div>
            <div class="input-box">
              <el-cascader
                v-model="selectedModelName"
                :options="modelList"
                :show-all-levels="false"
                :props="{
                  expandTrigger: 'hover',
                  value: 'value',
                  label: 'label',
                  children: 'children',
                  emitPath: false,
                }"
                placeholder="选择写作模型"
                @change="handleModelChange"
                class="write-model-cascader"
              >
                <template #default="{ data }">
                  <span v-if="data.parentId === '0'" class="cascader-icon">
                    <img :src="data.metadata.icon" alt="">
                  </span>
                  <span>{{ data.label }}</span>
                </template>
              </el-cascader>
            </div>
          </div>
          <div v-show="showDeepBtn" class="model-btn" :class="{ active: isDeepSeek }" @click="handleDeepSeek">
            <div class="btn-icon deep-thinking-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.06431 5.93348C7.68763 5.93348 8.19307 6.4391 8.19322 7.06239C8.19322 7.68579 7.68772 8.19129 7.06431 8.19129C6.44099 8.19119 5.9354 7.68573 5.9354 7.06239C5.93555 6.43917 6.44108 5.93359 7.06431 5.93348Z"
                  fill="currentColor"></path>
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M8.6815 0.963754C10.1169 0.44708 11.6266 0.37489 12.5633 1.31141C13.5 2.24812 13.4277 3.75782 12.911 5.19325C12.7126 5.74437 12.4386 6.31802 12.0965 6.89735C12.4969 7.54645 12.8141 8.19024 13.036 8.80653C13.5527 10.242 13.6251 11.7516 12.6883 12.6884C11.7516 13.6251 10.242 13.5527 8.8065 13.036C8.19022 12.8141 7.54641 12.4969 6.89732 12.0966C6.31797 12.4386 5.74435 12.7126 5.19322 12.911C3.75777 13.4277 2.2481 13.5001 1.31138 12.5634C0.374859 11.6266 0.447049 10.1169 0.963724 8.68153C1.17185 8.10345 1.46321 7.50069 1.82896 6.89247C1.52182 6.35717 1.27235 5.82832 1.08872 5.31825C0.572068 3.88284 0.499714 2.37312 1.43638 1.43641C2.37308 0.499716 3.8828 0.572105 5.31822 1.08875C5.82828 1.27238 6.35715 1.52186 6.89243 1.82899C7.50066 1.46324 8.10341 1.17187 8.6815 0.963754ZM11.3573 8.01161C10.9083 8.62259 10.3901 9.22879 9.80943 9.80946C9.22877 10.3901 8.62255 10.9084 8.01158 11.3573C8.4257 11.5841 8.8287 11.7688 9.21275 11.9071C10.5456 12.3869 11.4246 12.2548 11.8397 11.8397C12.2548 11.4247 12.3869 10.5456 11.9071 9.21278C11.7688 8.82872 11.5841 8.42574 11.3573 8.01161ZM2.56529 8.02918C2.37344 8.39328 2.21495 8.74802 2.09263 9.08778C1.61291 10.4204 1.74512 11.2996 2.16001 11.7147C2.57505 12.1298 3.45415 12.2619 4.78697 11.7821C5.11057 11.6656 5.44786 11.5164 5.7938 11.3368C5.249 10.9223 4.70922 10.4534 4.19029 9.93446C3.57578 9.31993 3.03169 8.67639 2.56529 8.02918ZM6.90708 3.24696C6.24065 3.70485 5.5646 4.26327 4.91392 4.91395C4.26325 5.56462 3.70482 6.24069 3.24693 6.90711C3.72674 7.63331 4.32777 8.37465 5.03892 9.08582C5.64943 9.69633 6.28183 10.2265 6.90806 10.6679C7.59368 10.2026 8.2908 9.63082 8.96079 8.96082C9.6308 8.29082 10.2025 7.59372 10.6678 6.90809C10.2265 6.28186 9.69631 5.64946 9.08579 5.03895C8.37462 4.32779 7.63328 3.72678 6.90708 3.24696ZM11.7147 2.16004C11.2996 1.74515 10.4204 1.61294 9.08775 2.09266C8.74835 2.21485 8.39382 2.37277 8.03013 2.56434C8.67728 3.03071 9.31995 3.57586 9.93443 4.19032C10.4534 4.70926 10.9223 5.24902 11.3368 5.79383C11.5164 5.44791 11.6656 5.11058 11.7821 4.787C12.2618 3.45422 12.1297 2.57508 11.7147 2.16004ZM4.91197 2.21766C3.57922 1.73794 2.70004 1.87001 2.28501 2.28504C1.87001 2.70009 1.73791 3.57926 2.21763 4.912C2.31709 5.18828 2.44112 5.47433 2.58677 5.76747C3.01931 5.18876 3.51474 4.61586 4.06529 4.06532C4.61584 3.51477 5.18872 3.01934 5.76743 2.5868C5.47431 2.44116 5.18824 2.31712 4.91197 2.21766Z"
                      fill="currentColor"></path>
              </svg>
            </div>
            <span class="btn-text">深度思考</span>
          </div>
          <div v-show="showNetBtn" class="model-btn" :class="{ active: isLinkNet }" @click="handleLinkNet">
            <div class="btn-icon network-search-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M7.00003 0.150452C10.7832 0.150452 13.8496 3.21691 13.8496 7.00006C13.8496 10.7832 10.7832 13.8497 7.00003 13.8497C3.21688 13.8497 0.150421 10.7832 0.150421 7.00006C0.150421 3.21691 3.21688 0.150452 7.00003 0.150452ZM5.37796 7.59967C5.4267 9.0321 5.64754 10.2966 5.97366 11.2198C6.15996 11.7471 6.36946 12.1302 6.57327 12.3702C6.77751 12.6106 6.92343 12.6505 7.00003 12.6505C7.07663 12.6505 7.22255 12.6106 7.42679 12.3702C7.6306 12.1302 7.8401 11.7471 8.0264 11.2198C8.35252 10.2966 8.57336 9.0321 8.6221 7.59967H5.37796ZM1.38187 7.59967C1.61456 9.80498 3.11593 11.6305 5.14261 12.336C5.03268 12.1129 4.93227 11.8725 4.8428 11.6192C4.46342 10.5452 4.22775 9.13994 4.17874 7.59967H1.38187ZM9.82132 7.59967C9.77232 9.13994 9.53664 10.5452 9.15726 11.6192C9.06774 11.8726 8.96648 12.1127 8.85648 12.336C10.8836 11.6307 12.3855 9.8053 12.6182 7.59967H9.82132ZM7.00003 1.34967C6.92343 1.34967 6.77751 1.38955 6.57327 1.62994C6.36946 1.86994 6.15996 2.25297 5.97366 2.78033C5.64754 3.70357 5.4267 4.96802 5.37796 6.40045H8.6221C8.57336 4.96802 8.35252 3.70357 8.0264 2.78033C7.8401 2.25297 7.6306 1.86994 7.42679 1.62994C7.22255 1.38955 7.07663 1.34967 7.00003 1.34967ZM8.85648 1.66315C8.96663 1.88662 9.06763 2.12721 9.15726 2.38092C9.53664 3.45494 9.77232 4.86018 9.82132 6.40045H12.6182C12.3855 4.19471 10.8837 2.36834 8.85648 1.66315ZM5.14261 1.66315C3.11578 2.36856 1.61457 4.19503 1.38187 6.40045H4.17874C4.22775 4.86018 4.46342 3.45494 4.8428 2.38092C4.93237 2.12736 5.03253 1.88651 5.14261 1.66315Z"
                      fill="currentColor"></path>
              </svg>
            </div>
            <span class="btn-text">联网搜索</span>
          </div>
          <!-- <div class="file-btn">
            <el-icon class="icon"><Paperclip /></el-icon>
          </div> -->
        </div>
        <div class="right-box">
          <el-tooltip
            class="box-item"
            effect="light"
            content="提交"
            placement="top-start"
          >
            <el-button
              v-auth
              type="primary"
              :icon="Promotion"
              circle
              :disabled="inputValue === ''"
              class="submit-btn"
              @click="submit"
            />
          </el-tooltip>
        </div>
      </div>
    </div>
    <!-- 编程 -->
    <div v-if="showType === 'code'" class="chat-box">
      <!-- 使用EditTemplate组件 -->
      <EditTemplate
        ref="editTmpRef"
        :template-segments="templateSegments"
        @update:template-segments="updateTemplateSegments"
        @template-change="handleTemplateChange"
        @submit="submit"
        placeholder="输入需求或相关代码"
      />
      <!-- <el-input v-model="inputValue" placeholder="输入主题和写作要求" type="textarea" :rows="4" resize="none"/> -->
      <div class="tool-btn">
        <div class="left-box">
          <div class="model-select-box">
            <div class="icon-box">
              <img :src="selectModelIcon" alt="">
            </div>
            <div class="input-box">
              <el-cascader
                v-model="selectedModelName"
                :options="modelList"
                :show-all-levels="false"
                :props="{
                  expandTrigger: 'hover',
                  value: 'value',
                  label: 'label',
                  children: 'children',
                  emitPath: false,
                }"
                placeholder="选择编程模型"
                @change="handleModelChange"
                class="write-model-cascader"
              >
                <template #default="{ data }">
                  <span v-if="data.parentId === '0'" class="cascader-icon">
                    <img :src="data.metadata.icon" alt="">
                  </span>
                  <span>{{ data.label }}</span>
                </template>
              </el-cascader>
            </div>
          </div>
          <div v-show="showDeepBtn" class="model-btn" :class="{ active: isDeepSeek }" @click="handleDeepSeek">
            <div class="btn-icon deep-thinking-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M7.06431 5.93348C7.68763 5.93348 8.19307 6.4391 8.19322 7.06239C8.19322 7.68579 7.68772 8.19129 7.06431 8.19129C6.44099 8.19119 5.9354 7.68573 5.9354 7.06239C5.93555 6.43917 6.44108 5.93359 7.06431 5.93348Z"
                  fill="currentColor"></path>
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M8.6815 0.963754C10.1169 0.44708 11.6266 0.37489 12.5633 1.31141C13.5 2.24812 13.4277 3.75782 12.911 5.19325C12.7126 5.74437 12.4386 6.31802 12.0965 6.89735C12.4969 7.54645 12.8141 8.19024 13.036 8.80653C13.5527 10.242 13.6251 11.7516 12.6883 12.6884C11.7516 13.6251 10.242 13.5527 8.8065 13.036C8.19022 12.8141 7.54641 12.4969 6.89732 12.0966C6.31797 12.4386 5.74435 12.7126 5.19322 12.911C3.75777 13.4277 2.2481 13.5001 1.31138 12.5634C0.374859 11.6266 0.447049 10.1169 0.963724 8.68153C1.17185 8.10345 1.46321 7.50069 1.82896 6.89247C1.52182 6.35717 1.27235 5.82832 1.08872 5.31825C0.572068 3.88284 0.499714 2.37312 1.43638 1.43641C2.37308 0.499716 3.8828 0.572105 5.31822 1.08875C5.82828 1.27238 6.35715 1.52186 6.89243 1.82899C7.50066 1.46324 8.10341 1.17187 8.6815 0.963754ZM11.3573 8.01161C10.9083 8.62259 10.3901 9.22879 9.80943 9.80946C9.22877 10.3901 8.62255 10.9084 8.01158 11.3573C8.4257 11.5841 8.8287 11.7688 9.21275 11.9071C10.5456 12.3869 11.4246 12.2548 11.8397 11.8397C12.2548 11.4247 12.3869 10.5456 11.9071 9.21278C11.7688 8.82872 11.5841 8.42574 11.3573 8.01161ZM2.56529 8.02918C2.37344 8.39328 2.21495 8.74802 2.09263 9.08778C1.61291 10.4204 1.74512 11.2996 2.16001 11.7147C2.57505 12.1298 3.45415 12.2619 4.78697 11.7821C5.11057 11.6656 5.44786 11.5164 5.7938 11.3368C5.249 10.9223 4.70922 10.4534 4.19029 9.93446C3.57578 9.31993 3.03169 8.67639 2.56529 8.02918ZM6.90708 3.24696C6.24065 3.70485 5.5646 4.26327 4.91392 4.91395C4.26325 5.56462 3.70482 6.24069 3.24693 6.90711C3.72674 7.63331 4.32777 8.37465 5.03892 9.08582C5.64943 9.69633 6.28183 10.2265 6.90806 10.6679C7.59368 10.2026 8.2908 9.63082 8.96079 8.96082C9.6308 8.29082 10.2025 7.59372 10.6678 6.90809C10.2265 6.28186 9.69631 5.64946 9.08579 5.03895C8.37462 4.32779 7.63328 3.72678 6.90708 3.24696ZM11.7147 2.16004C11.2996 1.74515 10.4204 1.61294 9.08775 2.09266C8.74835 2.21485 8.39382 2.37277 8.03013 2.56434C8.67728 3.03071 9.31995 3.57586 9.93443 4.19032C10.4534 4.70926 10.9223 5.24902 11.3368 5.79383C11.5164 5.44791 11.6656 5.11058 11.7821 4.787C12.2618 3.45422 12.1297 2.57508 11.7147 2.16004ZM4.91197 2.21766C3.57922 1.73794 2.70004 1.87001 2.28501 2.28504C1.87001 2.70009 1.73791 3.57926 2.21763 4.912C2.31709 5.18828 2.44112 5.47433 2.58677 5.76747C3.01931 5.18876 3.51474 4.61586 4.06529 4.06532C4.61584 3.51477 5.18872 3.01934 5.76743 2.5868C5.47431 2.44116 5.18824 2.31712 4.91197 2.21766Z"
                      fill="currentColor"></path>
              </svg>
            </div>
            <span class="btn-text">深度思考</span>
          </div>
          <div v-show="showNetBtn" class="model-btn" :class="{ active: isLinkNet }" @click="handleLinkNet">
            <div class="btn-icon network-search-icon">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd"
                      d="M7.00003 0.150452C10.7832 0.150452 13.8496 3.21691 13.8496 7.00006C13.8496 10.7832 10.7832 13.8497 7.00003 13.8497C3.21688 13.8497 0.150421 10.7832 0.150421 7.00006C0.150421 3.21691 3.21688 0.150452 7.00003 0.150452ZM5.37796 7.59967C5.4267 9.0321 5.64754 10.2966 5.97366 11.2198C6.15996 11.7471 6.36946 12.1302 6.57327 12.3702C6.77751 12.6106 6.92343 12.6505 7.00003 12.6505C7.07663 12.6505 7.22255 12.6106 7.42679 12.3702C7.6306 12.1302 7.8401 11.7471 8.0264 11.2198C8.35252 10.2966 8.57336 9.0321 8.6221 7.59967H5.37796ZM1.38187 7.59967C1.61456 9.80498 3.11593 11.6305 5.14261 12.336C5.03268 12.1129 4.93227 11.8725 4.8428 11.6192C4.46342 10.5452 4.22775 9.13994 4.17874 7.59967H1.38187ZM9.82132 7.59967C9.77232 9.13994 9.53664 10.5452 9.15726 11.6192C9.06774 11.8726 8.96648 12.1127 8.85648 12.336C10.8836 11.6307 12.3855 9.8053 12.6182 7.59967H9.82132ZM7.00003 1.34967C6.92343 1.34967 6.77751 1.38955 6.57327 1.62994C6.36946 1.86994 6.15996 2.25297 5.97366 2.78033C5.64754 3.70357 5.4267 4.96802 5.37796 6.40045H8.6221C8.57336 4.96802 8.35252 3.70357 8.0264 2.78033C7.8401 2.25297 7.6306 1.86994 7.42679 1.62994C7.22255 1.38955 7.07663 1.34967 7.00003 1.34967ZM8.85648 1.66315C8.96663 1.88662 9.06763 2.12721 9.15726 2.38092C9.53664 3.45494 9.77232 4.86018 9.82132 6.40045H12.6182C12.3855 4.19471 10.8837 2.36834 8.85648 1.66315ZM5.14261 1.66315C3.11578 2.36856 1.61457 4.19503 1.38187 6.40045H4.17874C4.22775 4.86018 4.46342 3.45494 4.8428 2.38092C4.93237 2.12736 5.03253 1.88651 5.14261 1.66315Z"
                      fill="currentColor"></path>
              </svg>
            </div>
            <span class="btn-text">联网搜索</span>
          </div>
        </div>
        <div class="right-box">
          <el-tooltip
            class="box-item"
            effect="light"
            content="提交"
            placement="top-start"
          >
            <el-button
              v-auth
              type="primary"
              :icon="Promotion"
              circle
              :disabled="inputValue === ''"
              class="submit-btn"
              @click="submit"
            />
          </el-tooltip>
        </div>
      </div>
    </div>
    <!-- 写作模板 -->
    <div v-if="showType === 'write' || showType === 'code'" class="writing-templates">
      <!-- 分类标签 -->
      <div class="template-categories">
        <div
          v-for="category in getCategories()"
          :key="category"
          class="category-tab"
          :class="{ active: activeTemplateCategory === category }"
          @click="switchCategory(category)"
        >
          {{ category }}
        </div>
      </div>

      <!-- 模板列表 -->
      <div class="template-grid">
        <div
          v-for="template in getCurrentTemplates()"
          :key="template.id"
          class="template-card"
          :class="{ selected: selectedTemplate?.id === template.id }"
          @click="selectTemplate(template)"
        >
          <div class="title-box">
            <img v-if="template.icon" :src="template.icon" alt="" class="template-icon1"/>
            <div v-else class="template-icon">
              <FaIcon :name="'i-ri:magic-line'" class="icon-svg"/>
            </div>
            <div class="template-content">
              <h3 class="template-name">
                {{ template.name }}
              </h3>
            </div>
          </div>
          <p class="template-description">
            {{ template.description }}
          </p>
        </div>
      </div>
    </div>
    <!-- 更多功能 -->
    <div v-if="showType === 'chat'" class="more-func">
      <div v-for="(item, i) in funcList" :key="item.name + i" class="func-item" @click="handleFunc(item)">
        <div class="func-icon" :style="{ color: item.color }">
          <!-- 深入研究图标 -->
          <svg v-if="item.icon === 'research'" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
              fill="currentColor"/>
          </svg>
          <!-- 写作图标 -->
          <svg v-else-if="item.icon === 'write'" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              fill="currentColor"/>
          </svg>
          <!-- 图像生成图标 -->
          <svg v-else-if="item.icon === 'image'" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"
              fill="currentColor"/>
          </svg>
          <!-- 视频生成图标 -->
          <svg v-else-if="item.icon === 'video'" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
              fill="currentColor"/>
          </svg>
          <!-- 编程图标 -->
          <svg v-else-if="item.icon === 'code'" viewBox="0 0 24 24" width="20" height="20">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0L19.2 12l-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
                  fill="currentColor"/>
          </svg>
          <!-- 翻译图标 -->
          <svg v-else-if="item.icon === 'translate'" viewBox="0 0 24 24" width="20" height="20">
            <path
              d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
              fill="currentColor"/>
          </svg>
        </div>
        <span class="func-text">{{ item.name }}</span>
      </div>
    </div>
    <el-dialog
      v-model="showModelConfig"
      title=""
      width="520px"
      :close-on-click-modal="false"
      class="model-config-dialog"
      :show-close="false"
    >
      <template #header>
        <div class="dialog-header">
          <div class="header-content">
            <div class="header-icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L3 7L10 12L17 7L10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                <path d="M3 12L10 17L17 12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="header-text">
              <h2 class="dialog-title">模型配置</h2>
            </div>
          </div>
          <button class="close-btn" @click="showModelConfig = false">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </template>

      <div class="config-content">
        <!-- 系统提示词 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">
              系统提示词
              <el-tooltip
                content="系统提示词用于指导AI的行为和回答风格，例如：'你是一个专业的编程助手'或'请用简洁的语言回答'"
                placement="top">
                <el-icon class="info-icon">
                  <InfoFilled/>
                </el-icon>
              </el-tooltip>
            </h3>
          </div>
          <div class="section-content">
            <el-input
              v-model="modelConfig.systemPrompt"
              type="textarea"
              :rows="3"
              placeholder="输入系统提示词..."
              class="system-prompt-input"
              maxlength="1000"
              show-word-limit
            />
          </div>
        </div>

        <!-- 模型参数设置 -->
        <div class="config-section">
          <div class="section-content">
            <div class="config-list">
              <!-- 最大消息数量 -->
              <div class="config-item">
                <div class="config-label">
                  <span class="label-text">
                    最大消息数量
                    <el-tooltip content="控制对话历史中保留的最大消息数量，影响AI对上下文的理解" placement="top">
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control">
                  <el-slider
                    v-model="modelConfig.maxMessageCount"
                    :min="0"
                    :max="100"
                    :step="1"
                    class="config-slider"
                    :show-tooltip="false"
                  />
                  <el-input-number
                    v-model="modelConfig.maxMessageCount"
                    :min="0"
                    :max="100"
                    :step="1"
                    controls-position="right"
                  />
                </div>
              </div>

              <!-- 温度 -->
              <div class="config-item">
                <div class="config-label">
                  <span class="label-text">
                    Temperature
                    <el-tooltip content="控制回答的随机性，值越高越随机和创造性，值越低越确定和保守" placement="top">
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control">
                  <el-slider
                    v-model="modelConfig.temperature"
                    :min="0"
                    :max="2"
                    :step="0.01"
                    class="config-slider"
                    :show-tooltip="false"
                  />
                  <el-input-number
                    v-model="modelConfig.temperature"
                    :min="0"
                    :max="2"
                    :step="0.01"
                    controls-position="right"
                  />
                </div>
              </div>

              <!-- Top P -->
              <div class="config-item">
                <div class="config-label">
                  <span class="label-text">
                    Top P
                    <el-tooltip content="控制词汇选择的多样性，值越高词汇选择越多样，值越低越集中在最可能的词汇"
                                placement="top">
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control">
                  <el-slider
                    v-model="modelConfig.topP"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    class="config-slider"
                    :show-tooltip="false"
                  />
                  <el-input-number
                    v-model="modelConfig.topP"
                    :min="0"
                    :max="1"
                    :step="0.01"
                    controls-position="right"
                  />
                </div>
              </div>

              <!-- 最大输出Token -->
              <div class="config-item">
                <div class="config-label">
                  <span class="label-text">
                    最大输出Token
                    <el-tooltip content="限制AI回答的最大长度，Token数量越多回答越详细，但消耗更多资源" placement="top">
                      <el-icon class="info-icon">
                        <InfoFilled/>
                      </el-icon>
                    </el-tooltip>
                  </span>
                </div>
                <div class="config-control">
                  <el-slider
                    v-model="modelConfig.maxOutputTokens"
                    :min="0"
                    :max="1000000"
                    :step="100"
                    class="config-slider"
                    :show-tooltip="false"
                  />
                  <el-input-number
                    v-model="modelConfig.maxOutputTokens"
                    :min="0"
                    :max="1000000"
                    :step="100"
                    controls-position="right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.cascader-icon {
  display: inline-block;
  width: 20px !important;
  height: 20px !important;
  margin-right: 4px;

  img {
    width: 100% !important;
    height: 100% !important;
    margin-top: 5px !important;
  }
}

.chat-wrap {
  width: 90%;
  max-width: 770px;
  min-height: 100%;
  margin: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .titles {
    font-size: 30px;
    font-weight: 500;
    text-align: center;
    margin-bottom: 10px;
    display: flex;
    justify-content: center;
    //flex-direction: column;
    align-items: center;
    gap: 12px;

    .skill-tag-container {
      display: flex;
      justify-content: center;
    }
  }

  .chat-box {
    width: 100%;
    min-height: 150px;
    border: 1px solid rgba(86, 86, 95, .322);
    border-radius: 6px;
    padding-top: 4px;
  }

  .write-box {
    margin-top: 20px;
  }

  .translate-box {
    width: 100%;
    min-height: 150px;
    border: 1px solid rgba(86, 86, 95, .322);
    border-radius: 6px;
    padding-top: 4px;
  }

  :deep(.el-textarea__inner) {
    box-shadow: none;
  }

  .submit-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;

    &:hover {
      background: linear-gradient(90deg, #5d77e7 0%, #7345a1 100%);
    }
  }

  .tool-btn {
    width: 100% !important;
    padding: 0 10px 10px 10px;
    display: flex;
    justify-content: space-between;

    .left-box {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .model-select-box {
      min-width: 100px;
      border-radius: 16px;
      background: #fff;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 4px;

      &:hover {
        box-shadow: none;
        border-color: #667eea;
      }

      .icon-box {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .input-box {
        width: calc(100% - 30px);
      }

      :deep(.el-input__wrapper) {
        width: 140px;
        height: 39px;
        box-shadow: none;
        padding: 0 12px 0 5px;
      }

      :deep(.el-input__inner) {
        font-size: 14px;
        color: #374151;
      }

      .write-model-cascader {
        width: 140px !important;
      }
    }

    .right-box {
      padding-top: 3px;
    }
  }

  .language-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;

    .language-select {
      min-width: 140px;

      :deep(.el-input__wrapper) {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        background: #ffffff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;

        &:hover {
          border-color: #667eea;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.15);
        }

        &.is-focus {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
        }
      }

      :deep(.el-input__inner) {
        color: #4a5568;
        font-size: 14px;
        font-weight: 500;
      }

      :deep(.el-select__caret) {
        color: #8a939d;
      }
    }

    .swap-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      color: #8a939d;

      &:hover {
        background: #667eea;
        border-color: #667eea;
        color: #ffffff;
        transform: rotate(180deg);
      }

      .el-icon {
        font-size: 16px;
      }
    }
  }

  .model-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #fff;
    border: 1px solid #e2e8f0;
    padding: 8px 10px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;

    .btn-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: #262729;
      transition: color 0.3s ease;

      &.deep-thinking-icon {
        svg {
          transform: rotate(0deg);
          transition: transform 0.3s ease;
        }
      }

      &.network-search-icon {
        svg {
          transform: scale(1);
          transition: transform 0.3s ease;
        }
      }
    }

    .btn-text {
      color: #374151;
      transition: color 0.3s ease;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);

      .btn-icon {
        color: #3b82f6;

        &.deep-thinking-icon svg {
          transform: rotate(180deg);
        }

        &.network-search-icon svg {
          transform: scale(1.1);
        }
      }

      .btn-text {
        color: #1e40af;
      }
    }

    &.active {
      background: #f0f9ff;
      border-color: #3b82f6;
      color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

      .btn-icon {
        color: #327df7;
      }

      .btn-text {
        color: #327df7;
      }

      &:hover {
        // background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
      }
    }

    &:active {
      transform: translateY(0);
    }
  }

  .file-btn {
    height: 38px;
    border: 1px solid var(--gray-btn-bg);
    padding: 9px 12px 6px;
    border-radius: 8px;
    cursor: pointer;

    .icon {
      font-size: 18px;
    }

    .send {
      font-size: 20px;
      color: #409eff;
    }

    &:hover {
      border-color: rgb(107, 85, 255);

      .icon {
        color: rgb(107, 85, 255);
      }
    }
  }

  .more-func {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin-top: 24px;
    padding: 0 8px;

    .func-item {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 4px 12px 4px 8px;
      border-radius: 18px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

      .func-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        transition: transform 0.3s ease;

        svg {
          width: 20px;
          height: 20px;
        }
      }

      .func-text {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        text-align: center;
        line-height: 1.4;
        transition: color 0.3s ease;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border-color: #d1d5db;

        .func-icon {
          transform: scale(1.1);
        }

        .func-text {
          color: #1f2937;
        }
      }

      &:active {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .more-func {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
      margin-top: 20px;
      padding: 0 4px;

      .func-item {
        padding: 16px 12px;
        min-height: 90px;

        .func-icon {
          width: 36px;
          height: 36px;
          margin-bottom: 10px;

          svg {
            width: 18px;
            height: 18px;
          }
        }

        .func-text {
          font-size: 13px;
        }
      }
    }
  }

  @media (max-width: 480px) {
    .more-func {
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 16px;

      .func-item {
        padding: 14px 10px;
        min-height: 80px;

        .func-icon {
          width: 32px;
          height: 32px;
          margin-bottom: 8px;

          svg {
            width: 16px;
            height: 16px;
          }
        }

        .func-text {
          font-size: 12px;
        }

        &:hover {
          transform: translateY(-1px);
        }
      }
    }

    .language-selector {
      flex-direction: column;
      align-items: stretch;
      gap: 8px;

      .language-select {
        min-width: auto;
        width: 100%;
      }

      .swap-btn {
        align-self: center;
        transform: rotate(90deg);

        &:hover {
          transform: rotate(270deg);
        }
      }
    }
  }

  // 热门模型样式
  .hot-model-box {
    margin: 24px 0 12px;
    padding: 0 8px;

    .hot-model-header {
      margin-bottom: 12px;

      .hot-model-title {
        font-size: 16px;
        font-weight: 600;
        color: #374151;
      }
    }

    .hot-model-container {
      display: flex;
      align-items: center;
      gap: 8px;

      .scroll-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.2s ease;
        flex-shrink: 0;

        &:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
          transform: scale(1.05);
        }

        &:active {
          transform: scale(0.95);
        }

        svg {
          color: #6b7280;
        }
      }

      .hot-model-list {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scroll-behavior: smooth;
        flex: 1;
        padding: 4px 0;

        // 隐藏滚动条
        &::-webkit-scrollbar {
          display: none;
        }

        -ms-overflow-style: none;
        scrollbar-width: none;

        .hot-model-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
          flex-shrink: 0;

          .model-icon {
            font-size: 16px;

            img {
              width: 16px;
              height: 16px;
            }
          }

          .model-name {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
          }

          &:hover {
            background: #f9fafb;
            border-color: #d1d5db;
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          &.active {
            background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
            border-color: #8b5cf6;
            color: #5b21b6;
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);

            .model-name {
              color: #5b21b6;
            }

            &:hover {
              background: linear-gradient(135deg, #c7d2fe 0%, #c4b5fd 100%);
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
            }
          }
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .hot-model-box {
      margin: 20px 0;
      padding: 0 4px;

      .hot-model-container {
        .scroll-btn {
          width: 28px;
          height: 28px;

          svg {
            width: 14px;
            height: 14px;
          }
        }

        .hot-model-list {
          .hot-model-item {
            padding: 6px 12px;

            .model-icon {
              font-size: 14px;
            }

            .model-name {
              font-size: 13px;
            }
          }
        }
      }
    }
  }

  @media (max-width: 480px) {
    .hot-model-box {
      .hot-model-container {
        .scroll-btn {
          width: 24px;
          height: 24px;

          svg {
            width: 12px;
            height: 12px;
          }
        }

        .hot-model-list {
          gap: 6px;

          .hot-model-item {
            padding: 4px 10px;

            .model-name {
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  // 写作模板样式
  .writing-templates {
    margin-top: 24px;
    padding: 0 8px;

    .template-categories {
      display: flex;
      gap: 8px;
      margin-bottom: 20px;
      flex-wrap: wrap;

      .category-tab {
        padding: 8px 16px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        white-space: nowrap;

        &:hover {
          background: #f9fafb;
          border-color: #d1d5db;
          color: #374151;
          transform: translateY(-1px);
        }

        &.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

          &:hover {
            background: linear-gradient(135deg, #5d77e7 0%, #7345a1 100%);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
          }
        }
      }
    }

    .template-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;

      .template-card {
        gap: 12px;
        padding: 16px;
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

        .title-box {
          display: flex;
          align-items: center;
          font-size: 14px;
          line-height: 20px;
          gap: 5px;
        }

        .template-icon1 {
          width: 20px;
          height: 20px;
          border-radius: 12px;
        }

        .template-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
          color: white;
        }

        .template-content {
          flex: 1;
          min-width: 0;

          .template-name {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1.4;
          }
        }

        .template-description {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-top: 8px;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          border-color: #d1d5db;

          .template-icon {
            background: #e0e7ff;
          }
        }

        &.selected {
          background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%);
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);

          .template-icon {
            background: #c7d2fe;
          }

          .template-name {
            color: #5b21b6;
          }

          .template-description {
            color: #7c3aed;
          }

          &:hover {
            background: linear-gradient(135deg, #c7d2fe 0%, #c4b5fd 100%);
            transform: translateY(-3px);
            box-shadow: 0 6px 16px rgba(139, 92, 246, 0.3);
          }
        }

        &:active {
          transform: translateY(-1px);
        }
      }
    }
  }

  // 响应式设计 - 写作模板
  @media (max-width: 768px) {
    .writing-templates {
      margin-top: 20px;
      padding: 0 4px;

      .template-categories {
        gap: 6px;
        margin-bottom: 16px;

        .category-tab {
          padding: 6px 12px;
          font-size: 13px;
        }
      }

      .template-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 12px;

        .template-card {
          padding: 12px;

          .template-icon {
            font-size: 20px;
            width: 36px;
            height: 36px;
          }

          .template-content {
            .template-name {
              font-size: 15px;
            }

            .template-description {
              font-size: 13px;
            }
          }
        }
      }
    }
  }

  @media (max-width: 480px) {
    .writing-templates {
      .template-categories {
        .category-tab {
          padding: 5px 10px;
          font-size: 12px;
        }
      }

      .template-grid {
        grid-template-columns: 1fr;
        gap: 10px;

        .template-card {
          padding: 10px;

          .template-icon {
            font-size: 18px;
            width: 32px;
            height: 32px;
          }

          .template-content {
            .template-name {
              font-size: 14px;
            }

            .template-description {
              font-size: 12px;
            }
          }
        }
      }
    }
  }

  // 模型配置弹框样式
  :deep(.model-config-dialog) {
    .el-dialog {
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    }

    .el-dialog__header {
      padding: 0;
      border-bottom: none;
    }

    .el-dialog__body {
      padding: 0;
    }

    .el-dialog__footer {
      padding: 0;
      border-top: none;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    position: relative;

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;

      .header-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.3);

        svg {
          color: white;
        }
      }

      .header-text {
        .dialog-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: white;
          line-height: 1.2;
        }
      }
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      z-index: 1;

      svg {
        color: white;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .config-content {
    padding: 16px;
    background: white;
  }

  .config-section {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;

      .section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 6px;

        .info-icon {
          color: #64748b;
          cursor: help;
          transition: color 0.3s ease;
          font-size: 14px;

          &:hover {
            color: #6366f1;
          }
        }
      }
    }

    .section-content {
      .system-prompt-input {
        :deep(.el-textarea__inner) {
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
          font-size: 13px;
          line-height: 1.4;
          background: #fafbfc;
          transition: all 0.3s ease;
          resize: vertical;
          min-height: 60px;

          &:focus {
            border-color: #6366f1;
            background: white;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
          }

          &::placeholder {
            color: #94a3b8;
          }
        }

        :deep(.el-input__count) {
          color: #64748b;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
          backdrop-filter: blur(10px);
        }
      }
    }
  }

  .config-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .config-item {
      .config-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;

        .label-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 4px;

          .info-icon {
            color: #9ca3af;
            cursor: help;
            transition: color 0.3s ease;
            font-size: 12px;

            &:hover {
              color: #6366f1;
            }
          }
        }
      }

      .config-control {
        display: flex;
        align-items: center;
        gap: 12px;

        .config-slider {
          flex: 1;

          :deep(.el-slider__runway) {
            background: #e5e7eb;
            height: 4px;
            border-radius: 2px;
          }

          :deep(.el-slider__bar) {
            background: linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 2px;
          }

          :deep(.el-slider__button) {
            width: 16px;
            height: 16px;
            background: white;
            border: 2px solid #6366f1;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
            transition: all 0.3s ease;

            &:hover {
              transform: scale(1.1);
              box-shadow: 0 3px 8px rgba(99, 102, 241, 0.4);
            }
          }

          :deep(.el-slider__stop) {
            background: #d1d5db;
            width: 4px;
            height: 4px;
            border-radius: 50%;
          }
        }

        .el-input-number {
          width: 120px;
          flex-shrink: 0;

          :deep(.el-input__wrapper) {
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            box-shadow: none;
            padding: 0 4px 0 8px;
            height: 32px;

            &:hover {
              border-color: #6366f1;
            }

            &.is-focus {
              border-color: #6366f1;
              box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
            }
          }

          :deep(.el-input__inner) {
            font-size: 13px;
            text-align: center;
            padding: 0;
            height: 30px;
            line-height: 30px;
          }

          :deep(.el-input-number__increase),
          :deep(.el-input-number__decrease) {
            width: 24px;
            height: 15px;
            border-radius: 3px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            color: #64748b;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            line-height: 1;

            &:hover {
              background: #6366f1;
              border-color: #6366f1;
              color: white;
            }

            &:active {
              transform: scale(0.95);
            }
          }

          :deep(.el-input-number__increase) {
            border-bottom: none;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
          }

          :deep(.el-input-number__decrease) {
            border-top: none;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
          }
        }
      }
    }
  }


  // 响应式设计
  @media (max-width: 768px) {
    :deep(.model-config-dialog) {
      .el-dialog {
        width: 95% !important;
        margin: 0 auto;
      }
    }

    .dialog-header {
      padding: 12px 16px;

      .header-content {
        gap: 8px;

        .header-icon {
          width: 28px;
          height: 28px;
        }

        .header-text {
          .dialog-title {
            font-size: 16px;
          }
        }
      }

      .close-btn {
        width: 28px;
        height: 28px;
      }
    }

    .config-content {
      padding: 16px;
    }

    .config-section {
      margin-bottom: 16px;

      .section-header {
        margin-bottom: 10px;
        padding-bottom: 6px;

        .section-title {
          font-size: 15px;
        }
      }
    }

    .config-list {
      gap: 12px;
    }

  }

  @media (max-width: 480px) {
    .dialog-header {
      padding: 10px 12px;

      .header-content {
        .header-text {
          .dialog-title {
            font-size: 15px;
          }
        }
      }
    }

    .config-content {
      padding: 12px;
    }

    .config-section {
      margin-bottom: 12px;

      .section-header {
        margin-bottom: 8px;
        padding-bottom: 4px;

        .section-title {
          font-size: 14px;
        }
      }
    }

    .config-list {
      gap: 10px;

      .config-item {
        .config-label {
          margin-bottom: 6px;

          .label-text {
            font-size: 13px;
          }
        }
      }
    }

  }
}
</style>
