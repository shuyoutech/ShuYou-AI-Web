<template>
  <div class="upload-example">
    <h3>文件上传示例</h3>

    <!-- 文件上传组件 -->
    <chat-upload
      :upload-types="['file', 'image']"
      @upload="handleFileUpload"
      @error="handleUploadError"
    />

    <!-- 文件列表组件 -->
    <chat-upload-list
      ref="uploadListRef"
      :file-list="fileList"
      @remove="handleRemoveFile"
      @upload-complete="handleUploadComplete"
      @upload-error="handleUploadError"
    />

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="getFilesFromComponent" type="primary">
        获取所有文件信息
      </el-button>
      <el-button @click="triggerUpload" type="success">
        手动触发上传
      </el-button>
    </div>

    <!-- 上传状态信息 -->
    <div v-if="uploadedFiles.length > 0" class="upload-info">
      <h4>已上传文件信息：</h4>
      <div v-for="file in uploadedFiles" :key="file.id" class="file-info">
        <p><strong>文件名：</strong>{{ file.originalFileName }}</p>
        <p><strong>文件ID：</strong>{{ file.id }}</p>
        <p><strong>文件大小：</strong>{{ file.fileSizeFormat }}</p>
        <p><strong>文件类型：</strong>{{ file.fileType }}</p>
        <p><strong>文件URL：</strong>{{ file.fileUrl }}</p>
        <hr>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ChatUpload from './chatUpload.vue'
import ChatUploadList from './chatUploadList.vue'

const fileList = ref([])
const uploadedFiles = ref([])
const uploadListRef = ref(null)

// 处理文件上传
function handleFileUpload(files) {
  console.log('接收到文件:', files)
  // 将新文件添加到文件列表
  fileList.value.push(...files)
}

// 处理文件删除
function handleRemoveFile(index) {
  console.log('删除文件索引:', index)
  fileList.value.splice(index, 1)

  // 同时从已上传文件列表中移除
  const removedFile = fileList.value[index]
  if (removedFile) {
    const uploadedIndex = uploadedFiles.value.findIndex(f => f.originalFileName === removedFile.name)
    if (uploadedIndex > -1) {
      uploadedFiles.value.splice(uploadedIndex, 1)
    }
  }
}

// 处理上传完成
function handleUploadComplete(data) {
  console.log('文件上传完成:', data)
  const { fileInfo, originalFile, index } = data

  // 添加到已上传文件列表
  uploadedFiles.value.push(fileInfo)

  // 可以在这里调用其他API，比如发送消息等
  console.log('可以发送消息，文件ID:', fileInfo.id)
}

// 处理上传错误
function handleUploadError(data) {
  console.error('文件上传失败:', data)
  const { file, error, index } = data

  // 可以显示错误提示
  console.error(`文件 ${file.name} 上传失败: ${error}`)
}

// 手动触发上传（如果需要）
function triggerUpload() {
  if (uploadListRef.value) {
    // 获取所有待上传的文件
    const pendingFiles = fileList.value.filter(file => {
      const state = uploadListRef.value.getUploadState(file.name)
      return state.status === 'pending'
    })

    if (pendingFiles.length > 0) {
      uploadListRef.value.uploadFiles(pendingFiles)
    }
  }
}

// 获取所有已上传的文件信息
function getAllUploadedFiles() {
  return uploadedFiles.value
}

// 使用组件暴露的方法获取文件
function getFilesFromComponent() {
  if (uploadListRef.value) {
    // 获取所有文件，按类型分类
    const allFiles = uploadListRef.value.getAllUploadedFiles()
    console.log('所有文件:', allFiles)
    console.log('文件数量统计:', allFiles.count)

    // 只获取图片文件
    const images = uploadListRef.value.getUploadedFilesByType('image')
    console.log('图片文件:', images)

    // 只获取非图片文件
    const files = uploadListRef.value.getUploadedFilesByType('file')
    console.log('普通文件:', files)

    return allFiles
  }
  return null
}

// 暴露方法给父组件
defineExpose({
  triggerUpload,
  getAllUploadedFiles,
  getFilesFromComponent,
  fileList,
  uploadedFiles,
})
</script>

<style scoped lang="scss">
.upload-example {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.action-buttons {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.upload-info {
  margin-top: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;

  h4 {
    margin: 0 0 15px 0;
    color: #333;
  }

  .file-info {
    margin-bottom: 15px;

    p {
      margin: 5px 0;
      font-size: 14px;
      color: #666;
    }

    hr {
      border: none;
      border-top: 1px solid #e4e7ed;
      margin: 10px 0;
    }
  }
}
</style>
