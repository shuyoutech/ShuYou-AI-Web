<script setup lang="ts">
import {ref, reactive, watch, nextTick} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {invoiceApplyApi, invoiceQuotaApi} from '@/api/system/invoice'
import type {InvoiceBo} from '@/api/system/invoice/types'
import {
  Document,
  OfficeBuilding,
  Money,
  Check,
  Close,
} from '@element-plus/icons-vue'

// Props
interface Props {
  visible: boolean
  editData?: any
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editData: null
})

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'close': []
  'success': []
}>()

// 表单数据
const formData = reactive<InvoiceBo>({
  // 开票金额（表单中以字符串录入，提交时再转成分）
  amount: '' as unknown as number,
  // 邮箱
  email: '',
  // 抬头类型
  titleType: 'enterprise',
  // 开票类型
  invoiceType: 'vat_regular_invoice',
  // 发票抬头
  titleName: '',
  // 纳税人识别号
  creditNo: '',
  // 备注信息
  remark: '',
})

// 可开票金额
const availableAmount = ref(0)

// 表单验证规则
const rules = reactive({
  amount: [
    {required: true, message: '请输入开票金额', trigger: 'blur'},
    {pattern: /^\d+(\.\d{1,2})?$/, message: '请输入正确的金额格式（最多保留2位小数）', trigger: 'blur'},
    {
      validator: (rule: any, value: any, callback: any) => {
        if (!value) {
          callback(new Error('请输入开票金额'))
          return
        }
        const amount = parseFloat(value)
        if (isNaN(amount)) {
          callback(new Error('请输入有效的金额'))
          return
        }
        if (amount > (availableAmount.value / 100)) {
          callback(new Error(`开票金额不能大于可开票金额 ¥${(availableAmount.value / 100).toFixed(2)}`))
        } else if (amount <= 0) {
          callback(new Error('开票金额必须大于0'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  email: [
    {required: true, message: '请输入邮箱', trigger: 'blur'},
    {type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur'}
  ],
  titleType: [
    {required: true, message: '请选择抬头类型', trigger: 'change'}
  ],
  invoiceType: [
    {required: true, message: '请选择开票类型', trigger: 'change'}
  ],
  titleName: [
    {required: true, message: '请输入发票抬头', trigger: 'blur'},
    {min: 2, max: 100, message: '发票抬头长度在 2 到 100 个字符', trigger: 'blur'}
  ],
  creditNo: [
    {required: true, message: '请输入纳税人识别号', trigger: 'blur'},
    {
      pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/,
      message: '请输入正确的纳税人识别号',
      trigger: 'blur'
    }
  ],
})

// 表单引用
const formRef = ref()

// 抬头类型选项
const titleTypeOptions = [
  {label: '企业', value: 'enterprise'},
  {label: '个人', value: 'personal'},
]

// 开票类型选项
const invoiceTypeOptions = [
  {label: '增值税普通发票', value: 'vat_regular_invoice'},
  {label: '增值税专用发票', value: 'vat_special_invoice'},
]

// 是否编辑模式
const isEdit = ref(false)

// 计算可开票金额显示值
const availableAmountDisplay = computed(() => {
  return availableAmount.value > 0 ? `¥${(availableAmount.value / 100).toFixed(2)}` : '¥0.00'
})

// 处理金额输入格式化
const handleAmountInput = (value: string) => {
  // 仅保留数字与小数点
  let cleanValue = value.replace(/[^\d.]/g, '')

  // 处理前导小数点
  if (cleanValue.startsWith('.')) cleanValue = '0' + cleanValue

  // 只保留一个小数点
  const firstDot = cleanValue.indexOf('.')
  if (firstDot !== -1) {
    // 去除后续所有小数点
    cleanValue =
      cleanValue.slice(0, firstDot + 1) + cleanValue.slice(firstDot + 1).replace(/\./g, '')
  }

  // 限制两位小数（允许输入到小数点或一位小数的中间态，如 12. / 12.3）
  const match = cleanValue.match(/^\d+(?:\.(\d{0,2})?)?$/)
  if (!match) {
    // 如果超过两位小数，截断到两位
    const [intPart, decPart = ''] = cleanValue.split('.')
    cleanValue = decPart ? `${intPart}.${decPart.slice(0, 2)}` : intPart
  }

  // 保持为字符串，避免输入 12. 时被转成 12
  // 由于 TS 类型为 number，这里做一次类型断言
  ;(formData as any).amount = cleanValue
}

// 处理金额失焦格式化
const handleAmountBlur = () => {
  const val = String((formData as any).amount || '')
  if (!val) return
  const num = parseFloat(val)
  if (!isNaN(num)) {
    ;(formData as any).amount = num.toFixed(2)
  }
}

// 关闭弹窗
const handleClose = () => {
  emit('update:visible', false)
  emit('close')
}

// 提交申请
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()

    ElMessageBox.confirm(
      '确认提交发票申请吗？提交后将无法修改。',
      '确认提交',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(async () => {
      const amountNumber = parseFloat(String((formData as any).amount || '0'))
      ;(formData as any).amount = amountNumber ? Math.round(amountNumber * 100) : 0
      const response = await invoiceApplyApi(formData)
      if (response.code === 0) {
        ElMessage.success('发票申请提交成功')
        emit('success')
        handleClose()
      } else {
        ElMessage.error(response.msg || '提交失败')
      }
    }).catch(() => {
      ElMessage.info('已取消提交')
    })
  } catch (error) {
    ElMessage.error('请完善必填信息')
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    amount: 0,
    email: '',
    titleType: 'enterprise',
    invoiceType: 'vat_regular_invoice',
    titleName: '',
    creditNo: '',
    remark: '',
  })
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 初始化数据
const initData = () => {
  if (props.editData) {
    isEdit.value = true
    // 这里应该根据编辑数据填充表单
    Object.assign(formData, {
      amount: props.editData.amount || 0,
      email: props.editData.email || '',
      titleType: props.editData.titleType || '',
      invoiceType: props.editData.invoiceType || '',
      titleName: props.editData.titleName || '',
      creditNo: props.editData.creditNo || '',
      remark: props.editData.remark || '',
    })
  } else {
    isEdit.value = false
    resetForm()
  }
}

// 加载发票额度
const loadInvoiceQuota = async () => {
  try {
    const response = await invoiceQuotaApi()
    if (response.code === 0) {
      availableAmount.value = response.data?.availableAmount || 0
    }
  } catch (error) {
    console.error('获取发票额度失败:', error)
  }
}

// 监听弹窗显示状态
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      initData()
      loadInvoiceQuota()
    })
  }
})

// 监听编辑数据变化
watch(() => props.editData, () => {
  if (props.visible) {
    initData()
  }
}, {deep: true})
</script>

<template>
  <el-dialog
    :model-value="visible"
    @update:model-value="handleClose"
    :title="isEdit ? '编辑发票申请' : '申请发票'"
    width="65%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="invoice-apply-dialog"
    destroy-on-close
    top="5vh"
  >
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="95px"
        class="invoice-form"
        size="default"
      >
        <!-- 基本信息 -->
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon">
                <Document/>
              </el-icon>
              <span class="header-title">基本信息</span>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="可开票金额">
                <div class="amount-display">
                  {{ availableAmountDisplay }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开票金额" prop="amount">
                <el-input
                  :model-value="formData.amount"
                  @input="handleAmountInput"
                  @blur="handleAmountBlur"
                  placeholder="请输入开票金额"
                  maxlength="10"
                >
                  <template #prepend>¥</template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="邮箱" prop="email">
                <el-input
                  v-model="formData.email"
                  placeholder="请输入邮箱"
                  maxlength="100"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 发票信息 -->
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon">
                <OfficeBuilding/>
              </el-icon>
              <span class="header-title">发票信息</span>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="抬头类型" prop="titleType">
                <el-select
                  v-model="formData.titleType"
                  placeholder="请选择抬头类型"
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in titleTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开票类型" prop="invoiceType">
                <el-select
                  v-model="formData.invoiceType"
                  placeholder="请选择开票类型"
                  style="width: 100%"
                >
                  <el-option
                    v-for="option in invoiceTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="发票抬头" prop="titleName">
                <el-input
                  v-model="formData.titleName"
                  placeholder="请输入发票抬头"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="纳税人识别号" prop="creditNo" class="tax-number-item">
                <el-input
                  v-model="formData.creditNo"
                  placeholder="请输入纳税人识别号"
                  maxlength="20"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 备注信息 -->
        <el-card class="form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon">
                <Money/>
              </el-icon>
              <span class="header-title">备注信息</span>
            </div>
          </template>
          <el-form-item label="备注信息">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="3"
              placeholder="请输入备注信息（选填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-card>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          <el-icon>
            <Close/>
          </el-icon>
          取消
        </el-button>
        <el-button
          type="primary"
          :icon="Check"
          @click="handleSubmit"
        >
          提交申请
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.invoice-apply-dialog {
  --el-dialog-border-radius: 12px;
}

.dialog-content {
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 8px;
}

.form-card {
  margin-bottom: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.header-icon {
  font-size: 1.1rem;
  color: #667eea;
}

.header-title {
  font-size: 1rem;
}

.invoice-form {
  padding: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 0 0 0;
  border-top: 1px solid #f0f0f0;
}

/* 表单项样式 */
:deep(.el-form-item) {
  margin-bottom: 18px;
  display: flex;
  align-items: flex-start;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 32px;
  height: 32px;
  padding-right: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

:deep(.el-form-item__content) {
  line-height: 32px;
  display: flex;
  align-items: center;
  flex: 1;
}

/* 针对纳税人识别号标签的特殊处理 */
.tax-number-item :deep(.el-form-item__label) {
  font-size: 13px;
  line-height: 32px;
  height: 32px;
}

:deep(.el-input__inner) {
  border-radius: 6px;
  font-size: 14px;
  height: 32px;
  line-height: 32px;
}

:deep(.el-select .el-input__inner) {
  border-radius: 6px;
  font-size: 14px;
  height: 32px;
  line-height: 32px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
}

:deep(.el-input) {
  height: 32px;
}

:deep(.el-select) {
  height: 32px;
}

.readonly-input {
  background-color: #f5f7fa !important;
  color: #606266 !important;
}

.readonly-input :deep(.el-input__inner) {
  background-color: #f5f7fa !important;
  color: #606266 !important;
  cursor: not-allowed;
  border-color: #e4e7ed !important;
  font-weight: 500;
}

.readonly-input :deep(.el-input__inner:focus) {
  border-color: #e4e7ed !important;
  box-shadow: none !important;
}

.readonly-input :deep(.el-input__inner:hover) {
  border-color: #e4e7ed !important;
}

/* 金额显示样式 */
.amount-display {
  height: 32px;
  line-height: 32px;
  padding: 0 12px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

/* 上传组件样式 */
.upload-demo {
  width: 100%;
}

:deep(.el-upload-dragger) {
  border-radius: 8px;
  border: 2px dashed #d9d9d9;
  background: #fafafa;
  transition: all 0.3s ease;
}

:deep(.el-upload-dragger:hover) {
  border-color: #667eea;
  background: #f0f9ff;
}

:deep(.el-upload__tip) {
  color: #909399;
  font-size: 0.9rem;
  margin-top: 8px;
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

/* 输入框焦点样式 */
:deep(.el-input__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

:deep(.el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

/* 选择器样式 */
:deep(.el-select .el-input.is-focus .el-input__inner) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

/* 卡片样式优化 */
:deep(.el-card__header) {
  background: #fafbfc;
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 12px;
}

:deep(.el-card__body) {
  padding: 12px 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog-content {
    max-height: 55vh;
  }

  :deep(.el-col) {
    margin-bottom: 8px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .dialog-footer .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  :deep(.el-col) {
    margin-bottom: 6px;
  }

  .form-card {
    margin-bottom: 12px;
  }
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
