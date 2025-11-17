<script setup lang="ts">

import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import type {FormInstance, FormRules} from 'element-plus'
import {fileUploadApi} from "@/api/system/file";
import {postSaveApi} from "@/api/bbs/post";
import type {PostSaveBo} from "@/api/bbs/post/types.ts";
import {toast} from "vue-sonner";
import type {GameVo} from "@/api/game/types.ts";
import {gameHotListApi} from "@/api/game";
import {dictOptionsApi} from "@/api/common";

const router = useRouter()

const editorInit = ref({
  language_url: 'tinymce/langs/zh-Hans.js',
  language: 'zh-Hans',
  skin_url: 'tinymce/skins/ui/oxide',
  content_css: 'tinymce/skins/content/default/content.min.css',
  min_height: 500,
  max_height: 800,
  selector: 'textarea',
  plugins: 'autolink autoresize fullscreen image insertdatetime link lists media preview table wordcount code searchreplace',
  toolbar: 'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | forecolor backcolor removeformat | link image media table insertdatetime searchreplace | preview code fullscreen',
  images_file_types: 'svg,jpeg,jpg,jpe,jfi,jif,jfif,png,gif,bmp,webp',
  branding: false,
  menubar: false,
  toolbar_mode: 'sliding',
  insertdatetime_formats: [
    '%Y年%m月%d日',
    '%H点%M分%S秒',
    '%Y-%m-%d',
    '%H:%M:%S',
  ],
  // https://www.tiny.cloud/docs/tinymce/6/file-image-upload/#images_upload_handler
  images_upload_handler: (blobInfo: any, _progress: any) => new Promise((resolve, _reject) => {
    fileUploadApi(blobInfo).then(({data}) => {
      resolve(data.fileUrl);
    });
  }),
});

const formRef = useTemplateRef<FormInstance>('formRef')
const formRules = ref<FormRules>({
  gameId: [
    {required: true, message: '请选择游戏', trigger: 'blur'},
  ],
  tags: [
    {required: true, message: '请选择标签', trigger: 'blur'},
  ],
  title: [
    {required: true, message: '请输入标题', trigger: 'blur'},
  ],
  content: [
    {required: true, message: '请输入内容', trigger: 'blur'},
  ],
  coverImg: [
    {required: true, message: '请上传封面', trigger: 'blur'},
  ]
})
const form = reactive({
  gameId: '',
  tags: [],
  title: '',
  content: '',
  coverImg: [],
})

const data = reactive<PostSaveBo>({
  gameId: '',
  plate: 'skin', // 外形专区使用plate=2
  title: '',
  content: '',
  coverImgUrl: '',
})

const onSubmit = () => {
  formRef.value?.validate((valid) => {
    if (valid) {
      data.gameId = form.gameId
      data.tags = form.tags
      data.title = form.title
      data.content = form.content
      data.coverImgUrl = form.coverImg[0]
      postSaveApi(data).then(() => {
        toast.success('发布成功')
        router.push('/skin')
      })
    }
  })
}

const goBack = () => {
  router.back()
}

// 加载游戏
const gameList = ref<GameVo[]>();
const loadGames = () => {
  gameHotListApi().then(({data}) => {
    gameList.value = data;
  });
}

// 加载外形标签
const tags = ref<Options[]>();
const loadSkinTags = () => {
  dictOptionsApi("bbs_skin_type").then(({data}) => {
    tags.value = data;
  })
}

onMounted(() => {
  loadGames()
  loadSkinTags()
})
</script>

<template>
  <div class="skin-upload-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <FaIcon name="i-mdi:file-document-edit" class="header-icon"/>
          <h1 class="page-title">发布外形作品</h1>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" @click="goBack">返回</button>
        </div>
      </div>
    </div>
    <!-- 主要内容区域 -->
    <div class="main-content">
      <div class="form-container">
        <ElForm ref="formRef" :model="form" :rules="formRules">

          <div class="form-section">
            <ElFormItem label="游戏" prop="gameId">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <el-radio-group v-model="form.gameId">
                <el-radio :label="game.name"
                          v-for="game in gameList"
                          :key="game.id"
                          border></el-radio>
              </el-radio-group>
            </ElFormItem>
          </div>

          <div class="form-section">
            <ElFormItem label="标签" prop="tags">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <div class="radio-container">
                <el-checkbox-group v-model="form.tags">
                  <el-checkbox-button :label="tag.label"
                                      v-for="tag in tags"
                                      :key="tag.value"
                                      :value="tag.value"
                                      border></el-checkbox-button>
                </el-checkbox-group>
              </div>
            </ElFormItem>
          </div>

          <!-- 标题输入 -->
          <div class="form-section">
            <ElFormItem label="标题" prop="title">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <textarea
                v-model="form.title"
                class="title-textarea"
                placeholder="请输入标题"
              />
            </ElFormItem>
          </div>

          <!-- 外形封面上传 -->
          <div class="form-section">
            <ElFormItem label="外形封面" prop="coverImg">
              <div class="cover-upload-wrapper">
                <div class="upload-instructions">
                  <p>1. 封面需清晰并契合外形角色主题,好的封面有利于获得更多曝光;</p>
                  <p>2. 封面图支持JPG、JPEG、PNG; 200kb以内,建议图片尺寸:524×446或262×223;</p>
                </div>
                <FaImageUpload
                  v-model="form.coverImg"
                  action="/file/upload"
                  :width="500"
                  :height="400"
                  :dimension="{width: 500, height: 400}"
                  :ext="['jpg', 'png', 'gif', 'bmp']"
                  :after-upload="(response) => response.fileUrl"
                />
              </div>
            </ElFormItem>
          </div>

          <!-- 内容编辑器 -->
          <div class="form-section">
            <ElFormItem label="内容" prop="content">
              <div class="content-editor-wrapper">
                <TinyMCE api-key="yaqateu3ygrcimjd5431nbkeun90laoifukj05jn1utl7g3g" v-model="form.content"
                         :init="editorInit"/>
              </div>
            </ElFormItem>
          </div>
        </ElForm>
        <div class="submit-button-container">
          <button class="btn btn-primary" @click="onSubmit">发布作品</button>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>
.skin-upload-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  position: relative;
}

.skin-upload-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
  pointer-events: none;
}

.page-header {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-bottom: 1px solid rgba(64, 158, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  font-size: 28px;
  color: #409eff;
  filter: drop-shadow(0 2px 4px rgba(64, 158, 255, 0.3));
  transition: all 0.3s ease;
}

.header-icon:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(64, 158, 255, 0.4));
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
  position: relative;
  z-index: 1;
}

.form-container {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1),
  0 8px 16px rgba(0, 0, 0, 0.06),
  inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
  max-width: 1000px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.form-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.form-container::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(64, 158, 255, 0.03) 0%, transparent 70%);
  pointer-events: none;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-10px) rotate(1deg);
  }
}

.form-section {
  margin-bottom: 40px;
  position: relative;
  padding: 25px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  border: 1px solid rgba(64, 158, 255, 0.1);
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.form-section:hover {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(64, 158, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.1);
}

.form-section:last-child {
  margin-bottom: 0;
}

.radio-container {
  display: flex;
  gap: 50px;
  flex-wrap: wrap;
  margin-top: 0;
  align-items: center;
}


/* 游戏选择和标签统一样式 */

/* 标签选择样式 */
.radio-container :deep(.el-radio) {
  margin-right: 0;
  margin-bottom: 10px;
}

.radio-container :deep(.el-checkbox-button) {
  margin-right: 0;
  margin-bottom: 10px;
}

.radio-container :deep(.el-checkbox-button__inner) {
  border-radius: 16px;
  padding: 4px 12px;
  border: 1px solid #e4e7ed;
  background: white;
  color: #606266;
  font-weight: 500;
  transition: all 0.3s ease;
  font-size: 14px;
}

.radio-container :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner) {
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
  border-color: #409eff;
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateY(-1px);
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
}

.title-input {
  max-width: 600px;
}

.title-input :deep(.el-input__wrapper) {
  height: 48px;
  border-radius: 8px;
  box-shadow: none;
  border: none;
  background: transparent;
  transition: all 0.3s ease;
}

.title-input :deep(.el-input__wrapper:hover) {
  box-shadow: none;
  border: none;
}

.title-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: none;
  border: none;
}

.title-input :deep(.el-input__inner) {
  background: transparent;
  border: none;
  box-shadow: none;
  font-size: 16px;
  font-weight: 500;
}

.title-input :deep(.el-input__inner:focus) {
  box-shadow: none;
  border: none;
}

.title-textarea {
  width: 100%;
  max-width: 600px;
  height: 60px;
  border: 2px solid #e4e7ed;
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.title-textarea:hover {
  border-color: #c0c4cc;
  background: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.title-textarea:focus {
  border-color: #409eff;
  background: white;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1),
  0 8px 25px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.title-textarea::placeholder {
  color: #a0a8b0;
  font-size: 15px;
  font-weight: 400;
}

.content-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: white;
}

.title-input-wrapper {
  position: relative;
}

.title-input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: #fafafa;
}

.title-input:focus {
  outline: none;
  border-color: #409eff;
  background: white;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.char-counter {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #909399;
}

.editor-container {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  flex-wrap: wrap;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #dcdfe6;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.toolbar-btn:hover {
  background: #f5f7fa;
  border-color: #409eff;
  color: #409eff;
}

.toolbar-btn.active {
  background: #409eff;
  border-color: #409eff;
  color: white;
}

.font-size-selector {
  position: relative;
}

.font-size-select {
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
}

.editor-content {
  min-height: 200px;
  padding: 16px;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  outline: none;
}

.editor-content:empty:before {
  content: attr(data-placeholder);
  color: #c0c4cc;
  pointer-events: none;
}

.section-selector {
  position: relative;
}

.section-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  font-size: 16px;
  background: #fafafa;
  cursor: pointer;
  skin: none;
  transition: all 0.3s ease;
}

.section-select:focus {
  outline: none;
  border-color: #409eff;
  background: white;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
}

.select-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #909399;
  pointer-events: none;
}

.file-upload-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.file-select-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: #409eff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.file-select-btn:hover {
  background: #337ecc;
  transform: translateY(-1px);
}

.file-status {
  color: #606266;
  font-size: 14px;
}

.file-instructions {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.file-instructions p {
  margin: 0 0 8px 0;
  color: #606266;
  font-size: 14px;
}

.file-path {
  font-family: 'Courier New', monospace;
  background: #e9ecef;
  padding: 8px 12px;
  border-radius: 4px;
  color: #495057;
}

.cover-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-instructions {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  padding: 24px;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.15);
  margin-bottom: 24px;
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
}

.upload-instructions:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.25);
}

.upload-instructions::before {
  content: '💡';
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(255, 193, 7, 0.3));
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.upload-instructions p {
  margin: 0 0 12px 0;
  color: #4a5568;
  font-size: 15px;
  line-height: 1.7;
  padding-left: 40px;
  font-weight: 500;
}

.upload-instructions p:last-child {
  margin-bottom: 0;
  color: #718096;
  font-size: 14px;
}

.cover-upload-area {
  width: 100%;
  height: 240px;
  border: 3px dashed #cbd5e0;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.cover-upload-area:hover {
  border-color: #409eff;
  background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.15),
  inset 0 2px 4px rgba(64, 158, 255, 0.1);
}

.cover-upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(64, 158, 255, 0.1) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.cover-upload-area:hover::before {
  transform: translateX(100%);
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #718096;
  z-index: 2;
  position: relative;
}

.upload-icon {
  font-size: 56px;
  color: #a0aec0;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: all 0.3s ease;
}

.cover-upload-area:hover .upload-icon {
  color: #409eff;
  transform: scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(64, 158, 255, 0.3));
}

.cover-preview {
  position: relative;
  width: 100%;
  height: 100%;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.remove-cover {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-cover:hover {
  background: rgba(0, 0, 0, 0.8);
  transform: scale(1.1);
}

.submit-button-container {
  display: flex;
  justify-content: center;
  padding: 25px 0;
  margin-top: 15px;
  border-top: 1px solid rgba(220, 223, 230, 0.3);
}


.form-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px 0;
  margin-top: 20px;
  border-top: 1px solid rgba(220, 223, 230, 0.3);
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  min-width: 150px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.btn-primary:hover::before {
  left: 100%;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #4a5568;
  border: 2px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  min-width: 90px;
  padding: 10px 24px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.btn-secondary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(64, 158, 255, 0.1), transparent);
  transition: left 0.5s;
}

.btn-secondary:hover::before {
  left: 100%;
}

.btn-secondary:hover {
  border-color: #409eff;
  color: #409eff;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.15);
}

.error-message {
  color: #f56c6c;
  font-size: 14px;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .main-content {
    padding: 15px;
  }

  .form-container {
    padding: 25px 20px;
    border-radius: 12px;
  }

  .header-content {
    padding: 0 15px;
    height: 70px;
  }

  .page-title {
    font-size: 18px;
  }

  .header-icon {
    font-size: 24px;
  }

  .form-section {
    padding: 20px 15px;
    margin-bottom: 25px;
  }

  .radio-container {
    gap: 15px;
  }


  .radio-container :deep(.el-checkbox-button__inner) {
    padding: 6px 12px;
    font-size: 13px;
  }

  .title-textarea {
    height: 50px;
    padding: 12px 16px;
    font-size: 15px;
  }

  .upload-instructions {
    padding: 20px 15px;
  }

  .upload-instructions p {
    padding-left: 35px;
    font-size: 14px;
  }

  .cover-upload-area {
    height: 200px;
  }

  .upload-icon {
    font-size: 48px;
  }

  .editor-toolbar {
    gap: 4px;
    padding: 8px 12px;
  }

  .toolbar-btn {
    width: 32px;
    height: 32px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
  }

  .btn-primary {
    min-width: auto;
    font-size: 15px;
  }

  .btn-secondary {
    min-width: auto;
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 10px;
  }

  .form-container {
    padding: 20px 15px;
  }

  .header-content {
    padding: 0 10px;
    height: 60px;
  }

  .page-title {
    font-size: 16px;
  }

  .header-icon {
    font-size: 20px;
  }

  .form-section {
    padding: 15px 10px;
    margin-bottom: 20px;
  }

  .radio-container {
    gap: 12px;
  }


  .radio-container :deep(.el-checkbox-button__inner) {
    padding: 5px 10px;
    font-size: 12px;
  }

  .title-textarea {
    height: 45px;
    padding: 10px 14px;
    font-size: 14px;
  }

  .upload-instructions {
    padding: 15px 12px;
  }

  .upload-instructions p {
    padding-left: 30px;
    font-size: 13px;
  }

  .cover-upload-area {
    height: 180px;
  }

  .upload-icon {
    font-size: 40px;
  }

  .btn {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style>
