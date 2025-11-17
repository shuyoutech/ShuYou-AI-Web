<script setup lang="ts">
import {useUserStore} from '@/store/modules/user.ts'
import {ElMessage} from 'element-plus'
import {authAuthorize, authSendSms} from "@/api/auth";
import {memberBindMobileApi} from "@/api/member";
import {payGetWalletApi} from "@/api/pay";
import RechargeModal from '@/components/RechargeModal/index.vue'

const router = useRouter()

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void

  (e: 'open-personal-center'): void
}

const emit = defineEmits<Emits>()

const userStore = useUserStore()

// 微信绑定弹窗相关
const showWechatModal = ref(false)
const qrCodeUrl = ref('')

// 手机绑定弹窗相关
const showMobileModal = ref(false)
const mobileForm = ref({
  mobile: '',
  code: ''
})
const isSendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: NodeJS.Timeout | null = null

// 获取用户头像
const getUserAvatar = () => {
  return userStore.avatar || ''
}

// 获取用户昵称
const getUserNickname = () => {
  return userStore.nickname || ''
}

// 充值弹窗相关
const showRechargeModal = ref(false)
const handleRecharge = () => {
  showRechargeModal.value = true
}

// 处理手机绑定
const handlePhoneBinding = () => {
  if (isMobileBound()) {
    return
  }
  showMobileModal.value = true
  mobileForm.value = {mobile: '', code: ''}
}

// 处理微信绑定
const handleWechatBinding = () => {
  if (isWechatBound()) {
    return
  }
  showWechatModal.value = true
  generateWechatQRCode()
}

// 检查是否绑定手机
const isMobileBound = () => {
  return userStore.userInfo?.mobile?.length != 0
}

// 检查是否绑定微信
const isWechatBound = () => {
  return userStore.userInfo?.bindWechat === true
}

// 处理个人中心
const handlePersonalCenter = () => {
  router.push('/settings/apikey')
  emit('update:visible', false)
}

// 处理退出登录
const handleLogout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  emit('update:visible', false)
}

// 生成微信绑定二维码
const generateWechatQRCode = async () => {
  const response = await authAuthorize({
    type: 'wechat',
    callBack: '/ai/wechat/bind/callback',
  })
  if (response.data) {
    qrCodeUrl.value = response.data
  } else {
    ElMessage.error('获取二维码失败')
  }
}

// 关闭微信绑定弹窗
const closeWechatModal = () => {
  showWechatModal.value = false
  qrCodeUrl.value = ''
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!mobileForm.value.mobile) {
    ElMessage.error('请输入手机号码')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(mobileForm.value.mobile)) {
    ElMessage.error('请输入正确的手机号码')
    return
  }

  try {
    isSendingCode.value = true
    // 这里应该调用发送验证码的API
    await authSendSms({
      mobile: mobileForm.value.mobile,
      templateCode: 'SMS_491995068',
    })

    ElMessage.success('验证码已发送')

    // 开始倒计时
    countdown.value = 60
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer!)
        countdownTimer = null
      }
    }, 1000)
  } catch (error) {
    console.error('Send SMS error:', error)
  } finally {
    isSendingCode.value = false
  }
}

// 提交手机绑定
const submitMobileBinding = async () => {
  if (!mobileForm.value.mobile) {
    ElMessage.error('请输入手机号码')
    return
  }

  if (!mobileForm.value.code) {
    ElMessage.error('请输入验证码')
    return
  }

  try {
    // 这里应该调用绑定手机的API
    await memberBindMobileApi(mobileForm.value.mobile, mobileForm.value.code)
    ElMessage.success('手机绑定成功！')

    // 更新用户信息
    await userStore.getMemberInfo()
    closeMobileModal()
  } catch (error) {
    ElMessage.error('绑定失败，请重试')
  }
}

// 关闭手机绑定弹窗
const closeMobileModal = () => {
  showMobileModal.value = false
  mobileForm.value = {mobile: '', code: ''}
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  countdown.value = 0
}

const props = defineProps<Props>()
watch(() => props.visible, (newVal) => {
  if (userStore.userInfo?.mobile === '') {
    showMobileModal.value = true
    mobileForm.value = {mobile: '', code: ''}
  } else {
    if (newVal) {
      getUserPower()
    }
  }
})
// 登录后若没有绑定手机,则弹出绑定手机弹窗
watch(() => userStore.userInfo?.mobile, (newVal) => {
  if (userStore.token && newVal === '') {
    showMobileModal.value = true
    mobileForm.value = {mobile: '', code: ''}
  }
}, {deep: true, immediate: true})
// 获取用户算力值
const balance = ref<number>(0)
const getUserPower = () => {
  payGetWalletApi().then((res: any) => {
    balance.value = res.data.balance || 0
  })
}

</script>

<template>
  <!-- 遮罩层 -->
  <div v-if="visible" class="profile-overlay" @click="emit('update:visible', false)">
    <div class="profile-popup" @click.stop>
      <!-- 关闭按钮 -->
      <button class="close-btn" @click="emit('update:visible', false)">
        <FaIcon name="i-mdi:close"/>
      </button>

      <!-- 用户头像和姓名 -->
      <div class="user-section">
        <div class="user-avatar">
          <img v-if="getUserAvatar()" :src="getUserAvatar()" :alt="getUserNickname()"/>
          <img v-else src="@/assets/images/avatar.png" alt="User"/>
        </div>
        <h2 class="username">{{ getUserNickname() }}</h2>

        <!-- 用户算力信息 -->
        <div class="power-section">
          <div class="power-info">
            <span class="power-label">算力:</span>
            <span class="power-value"> {{ balance }}</span>
          </div>
          <button v-auth="'请先登录后再进行充值'" class="recharge-btn" @click="handleRecharge">
            <FaIcon name="i-mdi:credit-card-plus"/>
            充值
          </button>
        </div>
      </div>

      <!-- 账户绑定选项 -->
      <div class="binding-section">
        <!-- 个人中心选项 -->
        <div class="binding-item" @click="handlePersonalCenter">
          <div class="binding-left">
            <FaIcon name="i-mdi:account" class="binding-icon"/>
            <span>个人中心</span>
          </div>
          <FaIcon name="i-mdi:chevron-right" class="arrow-icon"/>
        </div>

        <div class="binding-item" @click="handlePhoneBinding">
          <div class="binding-left">
            <FaIcon name="i-mdi:phone" class="binding-icon"/>
            <span>绑定手机</span>
          </div>
          <div class="binding-right">
            <span v-if="isMobileBound()" class="bound-text">已绑定</span>
            <FaIcon v-else name="i-mdi:chevron-right" class="arrow-icon"/>
          </div>
        </div>

        <div class="binding-item" @click="handleWechatBinding">
          <div class="binding-left">
            <FaIcon name="i-mdi:wechat" class="binding-icon wechat-icon"/>
            <span>绑定微信</span>
          </div>
          <div class="binding-right">
            <span v-if="isWechatBound()" class="bound-text">已绑定</span>
            <FaIcon v-else name="i-mdi:chevron-right" class="arrow-icon"/>
          </div>
        </div>
      </div>

      <!-- 退出登录按钮 -->
      <div class="logout-section">
        <button class="logout-btn" @click="handleLogout">
          退出登录
        </button>
      </div>
    </div>
  </div>

  <!-- 微信绑定弹窗 -->
  <div v-if="showWechatModal" class="wechat-modal-overlay" @click="closeWechatModal">
    <div class="wechat-modal" @click.stop>
      <!-- 关闭按钮 -->
      <button class="modal-close-btn" @click="closeWechatModal">
        <FaIcon name="i-mdi:close"/>
      </button>

      <!-- 标题 -->
      <h2 class="modal-title">微信快速绑定</h2>

      <!-- 说明文字 -->
      <p class="modal-desc">绑定完成后,您可以使用微信快速登录当前账号</p>

      <!-- 二维码区域 -->
      <div class="qr-code-container">
        <iframe
          v-show="qrCodeUrl"
          :src="qrCodeUrl"
          class="wechat-iframe"
        />
        <div v-show="!qrCodeUrl" class="qr-placeholder">
          <FaIcon name="i-mdi:qrcode" class="qr-icon"/>
          <span>点击上方按钮获取二维码</span>
        </div>
      </div>

      <!-- 底部说明 -->
      <div class="modal-footer">
        <FaIcon name="i-mdi:wechat" class="wechat-icon"/>
        <p class="footer-text">打开【手机微信】扫一扫,快速绑定</p>
      </div>
    </div>
  </div>

  <!-- 手机绑定弹窗 -->
  <div v-if="showMobileModal" class="mobile-modal-overlay">
    <div class="mobile-modal" @click.stop>
      <!-- 关闭按钮 -->
      <button class="modal-close-btn" @click="closeMobileModal">
        <FaIcon name="i-mdi:close"/>
      </button>

      <!-- 标题 -->
      <h2 class="modal-title">手机快速绑定</h2>

      <!-- 说明文字 -->
      <p class="modal-desc">绑定完成后,您可以使用手机快速登录当前账号</p>

      <!-- 表单区域 -->
      <div class="form-container">
        <!-- 手机号输入 -->
        <div class="input-group">
          <div class="input-wrapper">
            <FaIcon name="i-mdi:phone" class="input-icon"/>
            <input
              v-model="mobileForm.mobile"
              type="tel"
              placeholder="请输入手机号码"
              class="form-input"
              maxlength="11"
            />
          </div>
        </div>

        <!-- 验证码输入 -->
        <div class="input-group">
          <div class="input-wrapper">
            <FaIcon name="i-mdi:shield-key" class="input-icon"/>
            <input
              v-model="mobileForm.code"
              type="text"
              placeholder="请输入验证码"
              class="form-input"
              maxlength="6"
            />
            <button
              class="send-code-btn"
              :disabled="isSendingCode || countdown > 0"
              @click="sendVerificationCode"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 确定绑定按钮 -->
      <button class="bind-btn" @click="submitMobileBinding">
        确定绑定
      </button>
    </div>
  </div>

  <!-- 充值弹窗 -->
  <RechargeModal v-model:visible="showRechargeModal" @update:visible="getUserPower"/>
</template>

<style scoped>
/* 遮罩层 */
.profile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 80px 20px 20px 20px;
}

/* 弹窗主体 */
.profile-popup {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  width: 320px;
  max-width: 90vw;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

/* 关闭按钮 */
.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  color: #666;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.15);
  color: #333;
  transform: scale(1.1);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.profile-popup::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  pointer-events: none;
}

/* 用户头像和姓名 */
.user-section {
  text-align: center;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.user-avatar {
  width: 80px;
  height: 80px;
  margin: 0 auto 12px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  position: relative;
}

.user-avatar::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #8b5cf6, #a855f7, #c084fc, #8b5cf6);
  border-radius: 50%;
  z-index: -1;
  animation: rotate 3s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background-color: #f5f5f5;
}

.username {
  color: #333;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  text-shadow: none;
}

/* 算力信息样式 */
.power-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f8f9ff 0%, #e8f0ff 100%);
  border: 1px solid #e0e7ff;
  border-radius: 8px;
}

.power-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.power-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.power-value {
  font-size: 16px;
  color: #3b82f6;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.recharge-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: white;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.recharge-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
}

.recharge-btn:active {
  transform: translateY(0);
}

.recharge-btn .fa-icon {
  font-size: 14px;
}

/* 账户绑定选项 */
.binding-section {
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
}

.binding-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.binding-item:last-child {
  border-bottom: none;
}

.binding-item:hover {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  padding-left: 8px;
  padding-right: 8px;
}

.binding-left {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #333;
  font-size: 14px;
}

.binding-icon {
  font-size: 18px;
  color: #8b5cf6;
}

.wechat-icon {
  color: #07c160;
}

.binding-right {
  display: flex;
  align-items: center;
}

.arrow-icon {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.4);
}

.bound-text {
  color: #07c160;
  font-size: 12px;
  font-weight: 600;
}

/* 退出登录按钮 */
.logout-section {
  text-align: center;
  position: relative;
  z-index: 1;
}

.logout-btn {
  background: transparent;
  border: none;
  color: #ef4444;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-overlay {
    padding: 70px 15px 15px 15px;
  }

  .profile-popup {
    width: 340px;
    padding: 24px;
  }

  .user-avatar {
    width: 80px;
    height: 80px;
  }

  .username {
    font-size: 20px;
  }

  .power-section {
    margin-top: 14px;
    padding: 10px 14px;
  }

  .power-label {
    font-size: 13px;
  }

  .power-value {
    font-size: 16px;
  }

  .recharge-btn {
    padding: 7px 14px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .profile-overlay {
    padding: 60px 10px 10px 10px;
  }

  .profile-popup {
    width: 320px;
    padding: 20px;
  }

  .user-avatar {
    width: 72px;
    height: 72px;
  }

  .username {
    font-size: 18px;
  }

  .power-section {
    margin-top: 12px;
    padding: 10px 12px;
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .power-info {
    justify-content: center;
  }

  .power-label {
    font-size: 13px;
  }

  .power-value {
    font-size: 16px;
  }

  .recharge-btn {
    padding: 8px 16px;
    font-size: 12px;
    justify-content: center;
  }

  .binding-left {
    font-size: 14px;
  }

  .binding-item {
    padding: 12px 14px;
  }
}

/* 微信绑定弹窗样式 */
.wechat-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

.wechat-modal {
  background: #1a1a1a;
  border-radius: 16px;
  padding: 30px;
  width: 400px;
  max-width: 90vw;
  text-align: center;
  position: relative;
  animation: slideUp 0.3s ease-out;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 500px;
}

.modal-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 30px;
  height: 30px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.modal-title {
  color: white;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 15px 0;
}

.modal-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.5;
}

.qr-code-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
}

.wechat-iframe {
  width: 200px;
  height: 230px;
  background: white !important;
  border-radius: 12px;
  border: none !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  outline: none !important;
}

.qr-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #666;
  padding: 20px;
}

.qr-icon {
  font-size: 48px;
  color: #ccc;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 0;
}

.wechat-icon {
  color: #07c160;
  font-size: 20px;
}

.footer-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .wechat-modal {
    width: 350px;
    padding: 30px 20px 25px;
  }

  .modal-title {
    font-size: 20px;
  }

  .qr-code-wrapper {
    width: 180px;
    height: 180px;
    padding: 15px;
  }

  .modal-desc {
    font-size: 13px;
  }

  .footer-text {
    font-size: 13px;
  }
}

/* 手机绑定弹窗样式 */
.mobile-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

.mobile-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  border-radius: 24px;
  padding: 40px;
  width: 440px;
  max-width: 90vw;
  text-align: center;
  position: relative;
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
  0 8px 24px rgba(0, 0, 0, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.mobile-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(168, 85, 247, 0.08) 100%);
  border-radius: 24px 24px 0 0;
  pointer-events: none;
}

.modal-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: white;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(8px);
  z-index: 10;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1) rotate(90deg);
}

.modal-close-btn:active {
  transform: scale(0.95) rotate(90deg);
}

.modal-title {
  color: white;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.modal-desc {
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 32px;
  position: relative;
  z-index: 1;
}

.form-container {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
}

.input-group {
  width: 100%;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  padding: 0 18px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.input-wrapper:focus-within {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.25),
  0 4px 12px rgba(139, 92, 246, 0.2);
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-1px);
}

.input-icon {
  color: rgba(255, 255, 255, 0.7);
  font-size: 20px;
  margin-right: 14px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within .input-icon {
  color: #a855f7;
  transform: scale(1.1);
}

.form-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 16px;
  padding: 18px 0;
  height: 56px;
  font-weight: 500;
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.send-code-btn {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
  letter-spacing: 0.3px;
}

.send-code-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.send-code-btn:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.send-code-btn:disabled {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.5);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.bind-btn {
  width: 100%;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);
  color: white;
  border: none;
  border-radius: 14px;
  padding: 18px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: 24px;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.bind-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.bind-btn:hover::before {
  left: 100%;
}

.bind-btn:hover {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.5),
  inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.bind-btn:active {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4),
  inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.94);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .mobile-modal {
    width: 360px;
    padding: 32px 24px;
  }

  .modal-title {
    font-size: 24px;
  }

  .modal-desc {
    font-size: 13px;
    margin-bottom: 28px;
  }

  .form-container {
    gap: 18px;
  }

  .input-wrapper {
    padding: 0 16px;
    border-radius: 12px;
  }

  .input-icon {
    font-size: 18px;
    margin-right: 12px;
  }

  .form-input {
    font-size: 15px;
    padding: 16px 0;
    height: 52px;
  }

  .send-code-btn {
    padding: 8px 14px;
    font-size: 12px;
    margin-left: 6px;
  }

  .bind-btn {
    padding: 16px;
    font-size: 15px;
    margin-top: 20px;
  }
}
</style>
