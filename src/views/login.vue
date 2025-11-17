<script setup lang="ts">
import {ElMessage} from 'element-plus'
import {computed, ref, watch} from 'vue'
import {authAuthorize, authSendSms} from '@/api/auth'
import {useUserStore} from '@/store/modules/user.ts'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void

  (e: 'loginSuccess', userData: any): void

  (e: 'logoutSuccess'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const loginType = ref<'wechat' | 'phone'>('wechat')
const qrCodeUrl = ref('')

// 计算对话框样式
const dialogStyle = computed(() => ({
  height: '50vh',
  maxHeight: '50vh',
  marginTop: '15vh',
  borderRadius: '16px',
  boxShadow: 'none',
}))

const phoneForm = ref({
  phone: '',
  code: '',
})

const aiFeatures = [
  {name: '对话', icon: 'i-mdi:chat', position: 'top'},
  {name: '绘画', icon: 'i-mdi:palette', position: 'bottom-left'},
  {name: '视频', icon: 'i-mdi:video', position: 'top-left'},
  {name: '语音', icon: 'i-mdi:microphone', position: 'top-right'},
  {name: '模型', icon: 'i-mdi:robot', position: 'bottom-right'},
  {name: '应用', icon: 'i-mdi:apps', position: 'center'},
]


watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      getQrCode()
    }
  },
)

const userStore = useUserStore()

async function onPhoneSubmit(e: Event) {
  e.preventDefault()
  if (!phoneForm.value.phone || !phoneForm.value.code) {
    ElMessage.error('请填写完整的手机号和验证码')
    return
  }
  loading.value = true
  try {
    userStore.smsLogin(phoneForm.value.phone, phoneForm.value.code)
  } finally {
    loading.value = false
  }
}

async function sendSms() {
  const phone = phoneForm.value.phone
  if (!phone) {
    ElMessage.error('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    ElMessage.error('请输入正确的手机号码')
    return
  }

  try {
    await authSendSms({
      mobile: phone,
      templateCode: 'SMS_491995068',
    })
    ElMessage.success('验证码已发送')
    startCountdown()
  } catch (error) {
    ElMessage.error('发送验证码失败，请重试')
    console.error('Send SMS error:', error)
  }
}

function handleClose() {
  userStore.showLoginModal = false
  phoneForm.value.phone = ''
  phoneForm.value.code = ''
  emit('update:visible', false)
}

// 获取二维码url,展示二维码图片
async function getQrCode() {
  loginType.value = 'wechat'
  stopCountdown()
  try {
    const response = await authAuthorize({
      type: 'wechat',
      callBack: '/ai/wechat/callback',
    })
    if (response.data) {
      qrCodeUrl.value = response.data
    } else {
      ElMessage.error('获取二维码失败')
    }
  } catch {
    ElMessage.error('获取二维码失败，请重试')
  }
}

const countdown = ref(60)
const timer = ref(null)
const isCounting = ref(false)
const buttonText = computed(() => {
  return isCounting.value ? `${countdown.value}s` : '获取验证码'
})

// 倒计时
function startCountdown() {
  isCounting.value = true
  countdown.value = 60
  timer.value = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopCountdown()
    }
  }, 1000)
}

// 停止倒计时
function stopCountdown() {
  clearInterval(timer.value)
  isCounting.value = false
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="45%"
    class="ai-login-modal"
    :style="dialogStyle"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="login-page">
      <!-- 左侧功能展示区 -->
      <div class="left-section">
        <div class="content">
          <h1 class="title">
            Hello, 欢迎登录数游科技
          </h1>
          <p class="subtitle">
            更多精彩等你来发现
          </p>

          <!-- AI功能按钮 -->
          <div class="ai-features">
            <div
              v-for="feature in aiFeatures"
              :key="feature.name"
              class="feature-btn"
              :class="feature.position"
            >
              <FaIcon :name="feature.icon" class="feature-icon"/>
              <span>{{ feature.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 关闭按钮 -->
      <button class="close-btn" @click="handleClose">
        <FaIcon name="i-mdi:close"/>
      </button>

      <!-- 右侧登录面板 -->
      <div class="right-section">
        <div class="login-panel">
          <div class="brand">
            <h2 class="brand-name">
              数游科技
            </h2>
          </div>

          <div class="login-tabs">
            <button
              class="tab-btn"
              :class="{ active: loginType === 'wechat' }"
              @click="getQrCode"
            >
              微信登录
            </button>
            <button
              class="tab-btn"
              :class="{ active: loginType === 'phone' }"
              @click="loginType = 'phone'"
            >
              手机登录
            </button>
          </div>

          <div v-if="loginType === 'wechat'" class="wechat-login">
            <div class="qr-container">
              <div class="qr-code">
                <div v-show="qrCodeUrl" class="code-box">
                  <iframe
                    :src="qrCodeUrl"
                    :style="{ width: '100%', height: '100%' }"
                    class="wechat-iframe"
                  />
                </div>
                <div v-show="!qrCodeUrl" class="qr-placeholder">
                  <FaIcon name="i-mdi:qrcode" class="qr-icon"/>
                  <span>点击上方按钮获取二维码</span>
                </div>
              </div>
            </div>
            <div class="qr-instructions">
              <div class="instruction-item">
                <FaIcon name="i-mdi:wechat" class="wechat-icon"/>
                <span>打开【手机微信】扫一扫登录更方便</span>
              </div>
            </div>
          </div>

          <div v-if="loginType === 'phone'" class="phone-login">
            <form @submit="onPhoneSubmit">
              <div class="form-item">
                <input
                  v-model="phoneForm.phone"
                  type="tel"
                  placeholder="请输入手机号"
                  class="phone-input"
                >
              </div>

              <div class="form-item">
                <div class="code-input-group">
                  <input
                    v-model="phoneForm.code"
                    type="text"
                    placeholder="请输入验证码"
                    class="code-input"
                  >
                  <button
                    type="button"
                    class="send-code-btn"
                    :disabled="isCounting"
                    @click="sendSms"
                  >
                    {{ buttonText }}
                  </button>
                </div>
              </div>

              <button
                :disabled="loading"
                class="login-btn"
                type="submit"
              >
                {{ loading ? '登录中...' : '登录' }}
              </button>
            </form>
          </div>

          <div class="terms">
            <p>欢迎使用数游科技,您登录即同意</p>
            <div class="terms-links">
              <a href="#" class="term-link">《用户协议》</a>
              <span>和</span>
              <a href="#" class="term-link">《隐私政策》</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<style>
/* 全局样式强制覆盖对话框高度 - 使用更高优先级 */
html body .el-dialog.ai-login-modal {
  width: 900px !important;
  max-width: 900px !important;
  height: 550px !important;
  max-height: 550px !important;
  overflow: visible !important;
  outline: none !important;
  background: transparent !important;
  border: none !important;
  border-radius: 16px !important;
  box-shadow: none !important;
}

/* 移除所有可能的红色调试框 */
* {
  outline: none !important;
}

*:focus {
  outline: none !important;
  box-shadow: none !important;
}

/* 强制去除iframe相关边框 */
iframe {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* 强制去除二维码相关元素的边框 */
.qr-container *,
.qr-code *,
.code-box * {
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

html body .el-dialog.ai-login-modal .el-dialog__body {
  height: 550px !important;
  max-height: 550px !important;
  overflow: hidden !important;
  background: transparent !important;
  border-radius: 16px !important;
}

html body .el-dialog.ai-login-modal .el-dialog__header {
  display: none !important;
}

html body .el-dialog.ai-login-modal .el-dialog__wrapper {
  background: transparent !important;
}

/* 强制覆盖移动端样式 */
@media (width <= 1200px) {
  html body .el-dialog.ai-login-modal {
    width: 85vw !important;
    max-width: 85vw !important;
    height: 450px !important;
    max-height: 450px !important;
    overflow: hidden !important;
    background: transparent !important;
    border: none !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  html body .el-dialog.ai-login-modal .el-dialog__body {
    height: 450px !important;
    max-height: 450px !important;
    overflow: hidden !important;
    background: transparent !important;
    border-radius: 16px !important;
  }

  html body .el-dialog.ai-login-modal .el-dialog__wrapper {
    background: transparent !important;
  }
}

@media (width <= 768px) {
  html body .el-dialog.ai-login-modal {
    width: 90vw !important;
    max-width: 90vw !important;
    height: 70vh !important;
    max-height: 70vh !important;
  }

  html body .el-dialog.ai-login-modal .el-dialog__body {
    height: 70vh !important;
    max-height: 70vh !important;
  }
}
</style>

<style scoped>
/* .ai-login-modal :deep(.el-dialog) {
  margin: 20vh auto !important;
  height: 600px !important;
  max-width: 1000px !important;
  width: 1000px !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
} */

.ai-login-modal :deep(.el-dialog__header) {
  display: none !important;
}

.ai-login-modal :deep(.el-dialog__wrapper) {
  background: transparent !important;
}

/* .ai-login-modal :deep(.el-dialog__body) {
  padding: 0;
  height: 600px;
  overflow: hidden;
  border-radius: 16px;
} */

/* 强制覆盖对话框高度 */
.ai-login-modal :deep(.el-dialog) {
  width: 900px !important;
  max-width: 900px !important;
  height: 550px !important;
  max-height: 550px !important;
  overflow: hidden !important;
  border: none !important;
  border-radius: 16px !important;
  box-shadow: none !important;
}

.ai-login-modal :deep(.el-dialog__body) {
  height: 550px !important;
  max-height: 550px !important;
  overflow: hidden !important;
  border-radius: 16px !important;
}

.login-page {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #2d1b69 100%);
  border-radius: 16px;
  backdrop-filter: blur(20px);
}

/* 左侧功能展示区 */
.left-section {
  position: relative;
  display: flex;
  flex: 2;
  align-items: flex-start;
  justify-content: center;
  padding: 2rem 0 5rem;
  overflow: visible;
  background: linear-gradient(135deg, #1a1a3a 0%, #2d1b69 50%, #4c1d95 100%);
  border-radius: 16px 0 0 16px;
}


.content {
  position: relative;
  z-index: 1;
  padding: 2rem 1rem;
  margin-top: 2rem;
  text-align: center;
}

.title {
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
  font-weight: 800;
  color: white;
  text-shadow: 0 0 30px rgb(255 255 255 / 40%);
  background: linear-gradient(135deg, #fff 0%, #a855f7 100%);
  background-clip: text;
  background-clip: text;
  animation: glow 2s ease-in-out infinite alternate;
  -webkit-text-fill-color: transparent;
}

@keyframes glow {
  from {
    filter: drop-shadow(0 0 10px rgb(168 85 247 / 50%));
  }

  to {
    filter: drop-shadow(0 0 20px rgb(168 85 247 / 80%));
  }
}

.subtitle {
  margin-bottom: 2rem;
  font-size: 1.1rem;
  font-weight: 300;
  color: rgb(255 255 255 / 90%);
  letter-spacing: 0.5px;
}

/* AI功能按钮 */
.ai-features {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.8rem;
  width: 320px;
  max-height: 200px;
  padding: 1rem;
  margin: auto;
  overflow: visible;
}

.feature-btn {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  padding: 0.5rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  background: rgb(139 92 246 / 15%);
  border: 1px solid rgb(139 92 246 / 40%);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgb(139 92 246 / 20%);
  opacity: 0;
  backdrop-filter: blur(15px);
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fade-in-up 0.6s ease-out forwards;
}

.feature-btn:hover {
  background: rgb(139 92 246 / 25%);
  border-color: rgb(139 92 246 / 60%);
  box-shadow: 0 15px 30px rgb(139 92 246 / 40%);
  transform: translateY(-4px) scale(1.05);
}

.feature-icon {
  font-size: 1.2rem;
  color: #a855f7;
  filter: drop-shadow(0 0 8px rgb(168 85 247 / 60%));
}

/* 网格定位 - 3+2布局 */
.feature-btn:nth-child(1) {
  grid-row: 1;
  grid-column: 1;
  animation-delay: 0.1s;
}

.feature-btn:nth-child(2) {
  grid-row: 1;
  grid-column: 2;
  animation-delay: 0.2s;
}

.feature-btn:nth-child(3) {
  grid-row: 1;
  grid-column: 3;
  animation-delay: 0.3s;
}

.feature-btn:nth-child(4) {
  grid-row: 2;
  grid-column: 1;
  animation-delay: 0.4s;
}

.feature-btn:nth-child(5) {
  grid-row: 2;
  grid-column: 2;
  animation-delay: 0.5s;
}

.feature-btn:nth-child(6) {
  grid-row: 2;
  grid-column: 3;
  animation-delay: 0.6s;
}

@keyframes fade-in-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}



/* 右侧登录面板 */
.right-section {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 400px;
  overflow: hidden;
  background: rgb(0 0 0 / 40%);
  border-left: 1px solid rgb(255 255 255 / 10%);
  border-radius: 0 16px 16px 0;
  backdrop-filter: blur(25px);
}

.login-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 380px;
  height: 100%;
  min-height: auto;
  padding: 0.5rem 1rem;
  padding-top: 2rem;
}

.close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: white;
  cursor: pointer;
  background: rgb(0 0 0 / 60%);
  border: none;
  border-radius: 50%;
  backdrop-filter: blur(15px);
  transition: all 0.3s ease;
  opacity: 0.9;
}

.close-btn:hover {
  background: rgb(255 255 255 / 20%);
  box-shadow: 0 4px 15px rgb(255 255 255 / 25%);
  transform: scale(1.05);
  opacity: 1;
}

.brand {
  flex-shrink: 0;
  margin-bottom: 0.5rem;
  text-align: center;
}

.brand-name {
  margin-bottom: 0.25rem;
  font-size: 2rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 0 15px rgb(255 255 255 / 30%);
}


.login-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 0.2rem;
  margin-bottom: 1rem;
  background: rgb(255 255 255 / 8%);
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.tab-btn {
  position: relative;
  flex: 1;
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: rgb(255 255 255 / 75%);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-btn.active {
  color: white;
  background: linear-gradient(135deg, rgb(139 92 246 / 25%), rgb(168 85 247 / 20%));
  box-shadow: 0 4px 15px rgb(139 92 246 / 35%);
  transform: translateY(-1px);
}

.wechat-login {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 220px;
  padding: 1.5rem 0;
  text-align: center;
}

.qr-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 30px auto 0;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

.qr-code {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 235px;
  height: 235px;
  margin: 0 auto;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.code-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  background: transparent !important;
  overflow: hidden;
}

.code-box iframe {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  border-radius: 16px;
  background: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  object-fit: contain !important;
}

.wechat-iframe {
  width: 100% !important;
  height: 100% !important;
  border: none !important;
  border-radius: 16px;
  background: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
  object-fit: contain !important;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgb(255 255 255 / 60%);
}

.qr-icon {
  margin-bottom: 0.5rem;
  font-size: 3rem;
  color: rgb(255 255 255 / 40%);
}

.qr-instructions {
  margin-top: 1rem;
  color: white;
  text-align: center;
}

.instruction-item {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgb(255 255 255 / 85%);
  padding: 0.5rem 1rem;
  background: rgb(255 255 255 / 5%);
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.wechat-icon {
  font-size: 1.25rem;
  color: #07c160;
}

.get-qr-btn {
  padding: 0.5rem 1rem;
  margin-top: 0.5rem;
  color: white;
  cursor: pointer;
  background: rgb(7 193 96 / 20%);
  border: 1px solid rgb(7 193 96 / 30%);
  border-radius: 6px;
  transition: all 0.3s ease;
}

.get-qr-btn:hover {
  background: rgb(7 193 96 / 30%);
  border-color: rgb(7 193 96 / 50%);
}

.proxy-notice {
  font-size: 0.875rem;
  color: rgb(255 255 255 / 60%);
}

.phone-login {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-height: 200px;
  padding: 0.5rem 0;
  color: white;
  margin-top: 10px;
}

.form-item {
  width: 100%;
  margin-bottom: 1.2rem;
}

.phone-input,
.code-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 1rem;
  color: white;
  background: rgb(255 255 255 / 8%);
  border: 1px solid rgb(255 255 255 / 15%);
  border-radius: 12px;
  backdrop-filter: blur(15px);
  transition: all 0.3s ease;
}

.phone-input::placeholder,
.code-input::placeholder {
  color: rgb(255 255 255 / 60%);
}

.phone-input:focus,
.code-input:focus {
  outline: none;
  background: rgb(255 255 255 / 12%);
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgb(139 92 246 / 30%);
  transform: translateY(-1px);
}

.code-input-group {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.code-input {
  flex: 1;
}

.send-code-btn {
  width: 108px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  cursor: pointer;
  background: rgb(139 92 246 / 25%);
  border: 1px solid rgb(139 92 246 / 40%);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.send-code-btn:hover:not(:disabled) {
  background: rgb(139 92 246 / 30%);
  border-color: rgb(139 92 246 / 50%);
}

.send-code-btn:disabled {
  background: rgb(255 255 255 / 10%);
  border-color: rgb(255 255 255 / 20%);
  color: rgb(255 255 255 / 50%);
  cursor: not-allowed;
  opacity: 0.6;
}

.login-btn {
  position: relative;
  width: 100%;
  padding: 16px;
  overflow: hidden;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgb(59 130 246 / 40%);
  transition: all 0.3s ease;
}

.login-btn::before {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  content: "";
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 20%), transparent);
  transition: left 0.5s;
}

.login-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  box-shadow: 0 12px 35px rgb(59 130 246 / 60%);
  transform: translateY(-2px);
}

.login-btn:hover:not(:disabled)::before {
  left: 100%;
}

.login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.terms {
  flex-shrink: 0;
  width: 100%;
  margin-top: 30px;
  font-size: 0.875rem;
  color: rgb(255 255 255 / 60%);
  text-align: center;
}

.terms-links {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  margin-top: 0.25rem;
}

.term-link {
  color: #8b5cf6;
  text-decoration: none;
  transition: color 0.3s ease;
}

.term-link:hover {
  color: #a855f7;
  text-decoration: underline;
}

@media (width <= 1200px) {
  .ai-login-modal :deep(.el-dialog) {
    width: 85vw !important;
    height: 450px !important;
    margin: 15vh auto !important;
    overflow: hidden !important;
    border: none !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }
}

@media (width <= 768px) {
  .ai-login-modal :deep(.el-dialog) {
    width: 90vw !important;
    height: 70vh !important;
    margin: 8vh auto !important;
    overflow: hidden !important;
    border: none !important;
    border-radius: 16px !important;
    box-shadow: none !important;
  }

  .login-page {
    flex-direction: column;
  }

  .left-section {
    flex: 1;
    min-height: 45vh;
  }

  .right-section {
    flex: 1;
    min-width: auto;
  }

  .title {
    font-size: 2rem;
  }

  .subtitle {
    font-size: 1rem;
  }

  .ai-features {
    gap: 0.6rem;
    width: 280px;
    max-height: 180px;
    padding: 0.8rem;
  }

  .feature-btn {
    padding: 0.6rem 0.8rem;
    font-size: 0.7rem;
  }

  .login-panel {
    max-width: 320px;
    padding: 0.75rem;
  }

  .qr-code {
    width: 140px;
    height: 140px;
  }
}

@media (width <= 480px) {
  .title {
    font-size: 1.5rem;
  }

  .ai-features {
    gap: 0.5rem;
    width: 250px;
    max-height: 160px;
    padding: 0.6rem;
  }

  .feature-btn {
    padding: 0.5rem 0.7rem;
    font-size: 0.65rem;
  }
}
</style>
