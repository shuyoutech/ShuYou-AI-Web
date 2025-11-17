<script setup lang="ts">
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import { ref, watch } from 'vue'
import { payPrepayApi, payQueryOrderApi } from '@/api/pay/index.ts'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const loading = ref(false)
const inputCredits = ref<number | null>(1000)
const inputAmount = ref<number | null>(10)
const isUpdating = ref(false) // 防止循环更新

// 汇率：1元 = 100 credits
const CREDIT_RATE = 100

// 从credits更新金额
function updateFromCredits() {
  if (isUpdating.value) {
    return
  }
  isUpdating.value = true

  if (inputCredits.value && inputCredits.value > 0) {
    const amount = Math.floor(inputCredits.value / CREDIT_RATE)
    // 限制金额范围：1-100000
    if (amount >= 1 && amount <= 100000) {
      inputAmount.value = amount
    }
    else if (amount > 100000) {
      inputAmount.value = 100000
      inputCredits.value = 10000000 // 同步更新credits
    }
    else if (amount < 1) {
      inputAmount.value = 1
      inputCredits.value = 100 // 同步更新credits
    }
  }
  else {
    inputAmount.value = null
  }

  setTimeout(() => {
    isUpdating.value = false
  }, 10)
}

// 从金额更新credits
function updateFromAmount() {
  if (isUpdating.value) {
    return
  }
  isUpdating.value = true

  if (inputAmount.value && inputAmount.value > 0) {
    // 确保输入的是整数
    const intAmount = Math.floor(inputAmount.value)

    // 限制金额范围：1-100000
    if (intAmount < 1) {
      inputAmount.value = 1
      inputCredits.value = 100
    }
    else if (intAmount > 100000) {
      inputAmount.value = 100000
      inputCredits.value = 10000000
    }
    else {
      inputAmount.value = intAmount
      inputCredits.value = intAmount * CREDIT_RATE
    }
  }
  else {
    inputCredits.value = null
  }

  setTimeout(() => {
    isUpdating.value = false
  }, 10)
}

const codeUrl = ref('')
const orderId = ref('')
const showCode = ref(false)
const timer = ref(null)

// 处理关闭
function handleClose() {
  showCode.value = false
  loading.value = false
  codeUrl.value = ''
  orderId.value = ''
  if (timer.value) {
    clearInterval(timer.value)
  }
  emit('update:visible', false)
}

// 处理确认充值
async function handleConfirm() {
  if (loading.value || !inputAmount.value || inputAmount.value < 1 || inputAmount.value > 100000) {
    return
  }

  try {
    loading.value = true

    // 调用微信支付API (金额需要转换为分)
    const amount = Math.round(inputAmount.value * 100)
    const response = await payPrepayApi(amount)

    if (response.data) {
      // 显示微信支付二维码
      QRCode.toDataURL(response.data.codeUrl).then((vres: any) => {
        codeUrl.value = vres
      })
      orderId.value = response.data.outTradeNo
      showCode.value = true
      timer.value = setInterval(() => {
        getOrderStatus()
      }, 2000)
    }
  }
  catch (error) {
    loading.value = false
    console.error('充值失败:', error)
    ElMessage.error('充值失败，请重试')
  }
}

// 定时获取订单状态
function getOrderStatus() {
  payQueryOrderApi(orderId.value).then((res: any) => {
    if (res?.code === 0) {
      if (res.data.trade_state === 'SUCCESS') {
        if (timer.value) {
          clearInterval(timer.value)
        }
        ElMessage.success('支付成功！')
        setTimeout(() => {
          handleClose()
        }, 2000)
      }
    }
  })
}

// 处理遮罩层点击
function handleOverlayClick() {
  handleClose()
}

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

// 监听弹窗显示状态，重置数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 重置为默认值
    inputCredits.value = 1000
    inputAmount.value = 10
    loading.value = false
    isUpdating.value = false
  }
})
</script>

<template>
  <div v-if="visible" class="recharge-modal-overlay" @click="handleOverlayClick">
    <div class="recharge-modal" @click.stop>
      <!-- 微信支付头部 -->
      <div v-if="showCode" class="wechat-header">
        <div class="wechat-icon">
          <div class="icon-circle">
            <FaIcon name="i-mdi:check" class="check-icon" />
          </div>
        </div>
        <h2 class="wechat-title">
          微信支付
        </h2>
        <button class="close-btn" @click="handleClose">
          <FaIcon name="i-mdi:close" />
        </button>
      </div>

      <!-- 充值选项页面 -->
      <div v-if="!showCode" class="recharge-page">
        <!-- 关闭按钮 -->
        <button class="close-btn" @click="handleClose">
          <FaIcon name="i-mdi:close" />
        </button>

        <!-- 标题 -->
        <h2 class="modal-title">
          购买算力
        </h2>

        <!-- 充值选项 -->
        <div class="recharge-options">
          <div class="option-item">
            <div class="option-value">
              <input
                v-model="inputCredits"
                type="number"
                class="amount-input"
                placeholder="1000"
                min="100"
                max="10000000"
                @input="updateFromCredits"
              >
              <span class="unit">算力</span>
            </div>
          </div>
          <div class="option-item">
            <div class="option-value">
              <input
                v-model="inputAmount"
                type="number"
                class="amount-input"
                placeholder="10"
                min="1"
                max="100000"
                step="1"
                @input="updateFromAmount"
              >
              <span class="unit">¥</span>
            </div>
          </div>
        </div>

        <!-- 说明文字 -->
        <div class="description">
          充值比例：1元 == 100算力
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button class="cancel-btn" @click="handleClose">
            取消
          </button>
          <button
            class="confirm-btn"
            :disabled="loading || !inputAmount || inputAmount < 1 || inputAmount > 100000"
            @click="handleConfirm"
          >
            支付
          </button>
        </div>
      </div>

      <!-- 微信支付页面 -->
      <div v-if="showCode" class="wechat-pay-page">
        <!-- 支付说明 -->
        <div class="pay-instruction">
          <div class="instruction-text">
            扫一扫付款 (元)
          </div>
          <div class="amount-display">
            {{ inputAmount }} 元
          </div>
        </div>

        <!-- 二维码容器 -->
        <div class="qr-container">
          <div class="qr-wrapper">
            <img v-if="codeUrl" :src="codeUrl" alt="支付二维码" class="qr-code">
          </div>
        </div>

        <!-- 有效期和提示信息 -->
        <div class="validity-info">
          <div class="validity-text">
            二维码有效期 15 分钟
          </div>
          <div class="hint-text">
            请尽快完成付款
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recharge-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.recharge-modal {
  background: #ffffff;
  border-radius: 16px;
  width: 380px;
  max-width: 90vw;
  position: relative;
  animation: slideIn 0.3s ease-out;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 微信支付头部样式 */
.wechat-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.wechat-icon {
  margin-right: 12px;
}

.icon-circle {
  width: 24px;
  height: 24px;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  color: white;
  font-size: 14px;
}

.wechat-title {
  color: #000000;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  flex: 1;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  color: #999999;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #666666;
}

/* 充值页面样式 */
.recharge-page {
  padding: 40px 24px;
}

.modal-title {
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 32px 0;
  text-align: center;
}

.recharge-options {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.option-item {
  flex: 1;
}

.option-value {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  cursor: pointer;
}

.option-value:hover {
  border-color: #3b82f6;
  background: #f0f7ff;
}

.amount-input {
  background: transparent;
  border: none;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
  text-align: center;
  width: 100%;
  outline: none;
  margin-bottom: 6px;
}

.amount-input::placeholder {
  color: #9ca3af;
  font-weight: 500;
}

.unit {
  display: block;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.description {
  color: #6b7280;
  font-size: 14px;
  text-align: center;
  margin-bottom: 32px;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

/* 微信支付页面样式 */
.wechat-pay-page {
  padding: 32px 24px;
  text-align: center;
}

.pay-instruction {
  margin-bottom: 32px;
}

.instruction-text {
  color: #666666;
  font-size: 16px;
  margin-bottom: 8px;
}

.amount-display {
  color: #000000;
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 8px;
}

.qr-container {
  margin-bottom: 32px;
}

.qr-wrapper {
  display: inline-block;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
}

.qr-code {
  width: 200px;
  height: 200px;
  border-radius: 8px;
}

.validity-info {
  color: #999999;
  font-size: 14px;
  line-height: 1.6;
}

.validity-text {
  margin-bottom: 4px;
}

.hint-text {
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  min-width: 100px;
}

.cancel-btn {
  background: #f8f9fa;
  color: #6b7280;
  border: 1px solid #e9ecef;
}

.cancel-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.confirm-btn {
  background: #07c160;
  color: #ffffff;
}

.confirm-btn:hover:not(:disabled) {
  background: #06ad56;
}

.confirm-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  color: #999999;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .recharge-modal {
    width: 95vw;
    margin: 20px;
  }

  .recharge-page {
    padding: 32px 20px;
  }

  .wechat-pay-page {
    padding: 24px 20px;
  }

  .modal-title {
    font-size: 20px;
    margin-bottom: 24px;
  }

  .recharge-options {
    flex-direction: column;
    gap: 12px;
  }

  .option-value {
    padding: 16px 12px;
  }

  .amount-input {
    font-size: 18px;
  }

  .description {
    padding: 12px 16px;
    font-size: 13px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 12px;
  }

  .cancel-btn,
  .confirm-btn {
    width: 100%;
    padding: 14px 20px;
  }

  .qr-code {
    width: 180px;
    height: 180px;
  }

  .amount-display {
    font-size: 28px;
  }
}
</style>
