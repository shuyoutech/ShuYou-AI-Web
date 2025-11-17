<script setup>
import { Document, Paperclip, Picture } from '@element-plus/icons-vue'
import { ref } from 'vue'

const _props = defineProps({
  uploadTypes: {
    type: Array,
    default: () => ['doc', 'image'],
  },
})

const emit = defineEmits(['upload', 'error'])

const fileInput = ref(null)
const imageInput = ref(null)

// 允许的图片格式
const allowedImageTypes = ['jpg', 'jpeg', 'png', 'bmp', 'gif']

// 允许的文件格式
const allowedFileTypes = [
  'pdf',
  'txt',
  'csv',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'md',
  'html',
  'json',
  'mobi',
  'log',
  'go',
  'h',
  'c',
  'cpp',
  'cxx',
  'cc',
  'cs',
  'java',
  'js',
  'css',
  'jsp',
  'php',
  'py',
  'py3',
  'asp',
  'yaml',
  'yml',
  'ini',
  'conf',
  'ts',
  'tsx',
]

// 获取文件扩展名
function getFileExtension(filename) {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// 校验文件格式
function validateFileFormat(files, allowedTypes) {
  const invalidFiles = []

  for (const file of files) {
    const extension = getFileExtension(file.name)
    if (!allowedTypes.includes(extension)) {
      invalidFiles.push(file.name)
    }
  }

  return invalidFiles
}

// 处理下拉菜单命令
function handleCommand(command) {
  if (command === 'doc') {
    handleFileUpload()
  }
  else if (command === 'image') {
    handleImageUpload()
  }
}

// 处理文件上传
function handleFileUpload() {
  fileInput.value.click()
}

// 处理图片上传
function handleImageUpload() {
  imageInput.value.click()
}

// 处理文件选择
function handleFileChange(event) {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    // 校验文件格式
    const invalidFiles = validateFileFormat(files, allowedFileTypes)

    if (invalidFiles.length > 0) {
      const errorMessage = `以下文件格式不支持：${invalidFiles.join(', ')}\n支持的文件格式：${allowedFileTypes.join(', ')}`
      emit('error', errorMessage)
      return
    }

    emit('upload', files)
  }
  // 清空输入框，允许重复选择同一文件
  event.target.value = ''
}

// 处理图片选择
function handleImageChange(event) {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    // 校验图片格式
    const invalidFiles = validateFileFormat(files, allowedImageTypes)

    if (invalidFiles.length > 0) {
      const errorMessage = `以下图片格式不支持：${invalidFiles.join(', ')}\n支持的图片格式：${allowedImageTypes.join(', ')}`
      emit('error', errorMessage)
      return
    }

    emit('upload', files)
  }
  // 清空输入框，允许重复选择同一文件
  event.target.value = ''
}
</script>

<template>
  <div class="chat-upload">
    <!-- 下拉菜单 -->
    <el-dropdown
      trigger="click"
      placement="top-start"
      popper-class="upload-dropdown"
      @command="handleCommand"
    >
      <div>
        <el-tooltip content="添加文件" placement="top">
          <el-icon class="upload-icon">
            <Paperclip />
          </el-icon>
        </el-tooltip>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-if="uploadTypes.includes('doc')"
            command="doc"
            class="upload-dropdown-item"
          >
            <el-icon><Document /></el-icon>
            <span>文件</span>
          </el-dropdown-item>
          <el-dropdown-item
            v-if="uploadTypes.includes('image')"
            command="image"
            class="upload-dropdown-item"
          >
            <el-icon><Picture /></el-icon>
            <span>图片</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInput"
      type="file"
      multiple
      accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.md,.html,.json,.mobi,.log,.go,.h,.c,.cpp,.cxx,.cc,.cs,.java,.js,.css,.jsp,.php,.py,.py3,.asp,.yaml,.yml,.ini,.conf,.ts,.tsx"
      style="display: none"
      @change="handleFileChange"
    >
    <input
      ref="imageInput"
      type="file"
      multiple
      accept=".jpg,.jpeg,.png,.bmp,.gif"
      style="display: none"
      @change="handleImageChange"
    >
  </div>
</template>

<style scoped lang="scss">
.chat-upload {
  position: relative;
  display: inline-block;
}

.upload-icon {
  font-size: 28px;
  color: #494949;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 4px;
  border-radius: 4px;
  margin-right: 15px;

  &:hover {
    color: #409eff;
    background-color: #f0f9ff;
  }
}

.upload-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;

  .el-icon {
    font-size: 16px;
  }
}

:deep(.upload-dropdown) {
  .el-dropdown-menu {
    padding: 8px !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    border: 1px solid #e4e7ed !important;
  }

  .el-dropdown-menu__item {
    padding: 8px 12px !important;
    border-radius: 6px !important;
    margin: 2px 0 !important;
    transition: all 0.2s ease !important;

    &:hover {
      background-color: #f5f7fa !important;
      color: #409eff !important;
    }
  }
}
</style>
