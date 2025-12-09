<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { suggestApi } from '@/api/api'

const faqList = ref([
  {
    id: 1,
    question: '登录与绑定流程',
    type: 'normal',
    icon: 'i-ri:login-box-line',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    content: {
      description: '首次使用微信扫码登录后，系统会引导您绑定手机号。绑定成功即可获赠200算力，立即开启AI体验。',
    },
  },
  {
    id: 2,
    question: '如何充值算力',
    type: 'normal',
    icon: 'i-ri:wallet-3-line',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    content: {
      description: '登录后，点击右上角个人头像进入「个人中心」，选择"充值"并输入金额，即可通过微信支付完成充值。当前兑换比例为1元=100算力。',
    },
  },
  {
    id: 3,
    question: '收费模式？',
    type: 'list',
    icon: 'i-ri:money-dollar-circle-line',
    color: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)',
    content: {
      description: '用多少，充多少，消费清晰透明。',
      list: [
        {
          type: 'success',
          text: '官方原价：所有模型均按官方标准API价格计费。',
        },
        {
          type: 'success',
          text: '仅收10%服务费：在官方价格上，我们仅增加少量服务费，以保障平台的稳定运营与服务。',
        },
        {
          type: 'success',
          text: '实时扣费：采用预充值模式，使用时算力实时扣除，您的每一笔花费都尽在掌握，无缝衔接官方最新模型',
        },
      ],
    },
  },
  {
    id: 4,
    question: '为什么AI记得之前的对话？',
    type: 'normal',
    icon: 'i-ri:brain-line',
    color: 'linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%)',
    content: {
      description: '您可能注意到了，AI能够关联您之前的对话。这是因为它默认会把最近上一条记录也一块带上。如果您需要延长这个"记忆"，请在"模型配置"中调整"最大对话记忆数"，设置越高，关联性越强，同时也会消耗更多资源。如果不需要上次对话记录，则在"模型配置"里最大记录数设置为0',
    },
  },
  {
    id: 5,
    question: '支持哪些大模型？',
    type: 'link',
    icon: 'i-ri:robot-line',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    content: {
      description: '平台支持调用的大模型及对应价格，均可在定价页面查看：',
      link: {
        text: '👉 https://ai.shuyoutech.com/model/index',
        url: 'https://ai.shuyoutech.com/model/index',
      },
    },
  },
  {
    id: 6,
    question: '关于模型身份认知的说明',
    type: 'normal',
    icon: 'i-ri:question-answer-line',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    content: {
      description: '新手常会遇到此类问题：当询问模型"你是谁"时，回答可能与预期不符。',
      details: [
        '这是因为模型在训练阶段并未录入自身型号信息，但学习了其他模型的相关内容。模型厂商会同时训练多个版本，仅在达到特定效果后才会正式命名。',
        '因此，当你询问一个尚在测试阶段的模型（如标注为gpt-5的模型）时，它可能回答自己是gpt-4o。而OpenAI官方ChatGPT作为成熟产品，已在前端优化此类问题，能够正确识别自身版本。',
      ],
    },
  },
  {
    id: 7,
    question: '如何判断模型是否"降智"？',
    type: 'code',
    icon: 'i-ri:lightbulb-line',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    content: {
      description: '推荐使用以下指令进行快速检测：',
      code: 'Summarize your capabilities in a markdown table with availability.',
      results: [
        {
          type: 'success',
          text: '正常状态：模型会稍作思考，返回包含多项功能（如文件上传、联网搜索、代码执行等）的详细表格。',
        },
        {
          type: 'error',
          text: '可能降智：仅返回1-2个基础功能，响应较为简单。',
        },
      ],
    },
  },
  {
    id: 8,
    question: '是否支持自有API Key？',
    type: 'normal',
    icon: 'i-ri:key-line',
    color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    content: {
      description: '支持。您可在「个人中心」-「API Key管理」中添加第三方平台的API Key。设置成功后，调用模型时将优先使用您的密钥，且不消耗平台算力。',
    },
  },
  {
    id: 9,
    question: '发票开具说明',
    type: 'list',
    icon: 'i-ri:file-list-3-line',
    color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    content: {
      description: '平台支持开具以下类型发票：',
      list: [
        '增值税专用发票',
        '电子普通发票',
      ],
      note: '发票项目为"技术服务费"或"信息服务费"。',
      action: '平台开票需额外收取6%的税点，如有需要，请在「个人中心」-「发票管理」中登记开票信息，提交后客服将主动与您联系。',
    },
  },
  {
    id: 10,
    question: '企业合作与合同签订',
    type: 'normal',
    icon: 'i-ri:handshake-line',
    color: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    content: {
      description: '我们支持国内公司签订合作合同，可选择纸质合同或电子签章方式。',
      action: '如有需求，请扫描页面二维码添加管理员，我们将专人对接合作事宜。',
    },
  },
])

const expandedItems = ref<number[]>([])
const showContactCard = ref(false)
const suggestDialogVisible = ref(false)
const suggestionContent = ref('')
const suggestLoading = ref(false)

const toggleExpand = (id: number) => {
  const index = expandedItems.value.indexOf(id)
  if (index > -1) {
    expandedItems.value.splice(index, 1)
  } else {
    expandedItems.value.push(id)
  }
}

const openSuggestDialog = () => {
  suggestionContent.value = ''
  suggestDialogVisible.value = true
}

const submitSuggestion = async () => {
  if (!suggestionContent.value.trim()) {
    ElMessage.warning('请输入建议内容')
    return
  }
  try {
    suggestLoading.value = true
    await suggestApi(suggestionContent.value.trim())
    ElMessage.success('感谢您的建议，我们已收到!')
    suggestDialogVisible.value = false
    suggestionContent.value = ''
  } catch (error) {
    console.error('suggestApi error', error)
    ElMessage.error('提交失败，请稍后再试')
  } finally {
    suggestLoading.value = false
  }
}
</script>

<template>
  <div class="faq-container">
    <div class="faq-header">
      <div class="header-notice">
        <div class="notice-badge">
          <FaIcon name="i-ri:sparkling-line" class="badge-icon" />
          <span class="badge-text">新平台，新起点</span>
        </div>
        <p class="notice-message">
          我们诚挚邀请您成为平台的早期共建者，您的每一次体验与建议都至关重要。为表谢意，我们准备了不定期的算力奖励，助力您的探索之旅。
        </p>
        <p class="notice-message">
          若您欣赏我们的产品，诚邀您将这份探索的喜悦分享给志同道合的伙伴。您的每一次推荐，都是帮助我们走得更远的重要力量。让我们携手，共同打磨更卓越的AI产品！
        </p>
      </div>
      <div class="header-content">
        <div class="header-icon">
          <FaIcon name="i-ri:question-line" />
        </div>
        <div class="header-text">
          <h1 class="page-title">常见问题</h1>
          <p class="page-subtitle">为您解答使用过程中的常见疑问</p>
        </div>
        <div class="header-actions">
          <button class="suggest-btn" @click="openSuggestDialog">
            <FaIcon name="i-ri:edit-box-line" />
            提交建议
          </button>
        </div>
      </div>
    </div>

    <div class="faq-content">
      <div class="faq-list">
        <div
          v-for="item in faqList"
          :key="item.id"
          :class="['faq-item', { 'faq-item-expanded': expandedItems.includes(item.id) }]"
          @click="toggleExpand(item.id)"
        >
            <div class="faq-question">
              <div class="question-icon" :style="{ background: item.color }">
                <FaIcon :name="item.icon" />
              </div>
              <div class="question-text">
                <h3 class="question-title">{{ item.question }}</h3>
              </div>
              <div class="question-arrow">
                <FaIcon
                  :name="expandedItems.includes(item.id) ? 'i-ri:arrow-up-s-line' : 'i-ri:arrow-down-s-line'"
                  class="arrow-icon"
                />
              </div>
            </div>
            <transition name="expand">
              <div v-if="expandedItems.includes(item.id)" class="faq-answer">
                <div class="answer-content">
                  <div class="answer-text">
                    <!-- 普通类型 -->
                    <template v-if="item.type === 'normal'">
                      <p class="description">{{ item.content.description }}</p>
                      <p v-if="item.content.details" v-for="(detail, idx) in item.content.details" :key="idx" class="detail-text">{{ detail }}</p>
                      <p v-if="item.content.action" class="action-text">{{ item.content.action }}</p>
                    </template>

                    <!-- 链接类型 -->
                    <template v-else-if="item.type === 'link'">
                      <p class="description">{{ item.content.description }}</p>
                      <div class="link-container">
                        <a :href="item.content.link.url" target="_blank" class="link-button" @click.stop>
                          <FaIcon name="i-ri:external-link-line" />
                          {{ item.content.link.text }}
                        </a>
                      </div>
                    </template>

                    <!-- 代码类型 -->
                    <template v-else-if="item.type === 'code'">
                      <p class="description">{{ item.content.description }}</p>
                      <div class="code-block">
                        <code>{{ item.content.code }}</code>
                      </div>
                      <div class="result-list">
                        <div
                          v-for="(result, idx) in item.content.results"
                          :key="idx"
                          :class="['result-item', `result-${result.type}`]"
                        >
                          <FaIcon
                            :name="result.type === 'success' ? 'i-ri:check-line' : 'i-ri:close-line'"
                            class="result-icon"
                          />
                          <span class="result-text">{{ result.text }}</span>
                        </div>
                      </div>
                    </template>

                    <!-- 列表类型 -->
                    <template v-else-if="item.type === 'list'">
                      <p class="description">{{ item.content.description }}</p>
                      <div v-if="item.content.list && item.content.list[0] && item.content.list[0].type" class="feature-list">
                        <div
                          v-for="(listItem, idx) in item.content.list"
                          :key="idx"
                          :class="['feature-item', `feature-${listItem.type}`]"
                        >
                          <FaIcon
                            :name="listItem.type === 'success' ? 'i-ri:check-line' : 'i-ri:close-line'"
                            class="feature-icon"
                          />
                          <span class="feature-text">{{ listItem.text }}</span>
                        </div>
                      </div>
                      <ul v-else class="content-list">
                        <li v-for="(listItem, idx) in item.content.list" :key="idx">{{ listItem }}</li>
                      </ul>
                      <p v-if="item.content.note" class="note-text">{{ item.content.note }}</p>
                      <p v-if="item.content.action" class="action-text">{{ item.content.action }}</p>
                    </template>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

    <el-dialog
      v-model="suggestDialogVisible"
      title="提交建议"
      width="480px"
      :close-on-click-modal="false"
      class="suggest-dialog"
    >
      <el-input
        v-model="suggestionContent"
        type="textarea"
        :rows="6"
        maxlength="500"
        show-word-limit
        placeholder="请描述您的建议或遇到的问题，我们会尽快优化～"
      />
      <template #footer>
        <el-button @click="suggestDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="suggestLoading" @click="submitSuggestion">提交</el-button>
      </template>
    </el-dialog>

    <!-- 联系客服悬浮按钮 -->
    <div class="contact-float" :class="{ 'contact-float-expanded': showContactCard }">
      <div class="contact-trigger" @click="showContactCard = !showContactCard">
        <FaIcon name="i-ri:customer-service-2-line" class="trigger-icon" />
        <span class="trigger-text">客服</span>
      </div>
      <transition name="contact-card">
        <div v-if="showContactCard" class="contact-card-float">
          <div class="card-header">
            <h4 class="card-title">联系客服</h4>
            <button class="card-close" @click.stop="showContactCard = false">
              <FaIcon name="i-ri:close-line" />
            </button>
          </div>
          <div class="card-content">
            <div class="qr-code-wrapper">
              <img
                src="https://shuyoutech.com/preview/wechat_dm.jpg"
                alt="客服微信二维码"
                class="qr-code-image"
              />
            </div>
            <p class="card-hint">扫码联系客服</p>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.faq-container {
  min-height: calc(100vh - 101px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 40px 20px;
}

.faq-header {
  max-width: 1200px;
  margin: 0 auto 30px;
}

.header-notice {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  border-radius: 16px;
  padding: 20px 28px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

.header-notice::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  animation: pulse 4s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
}

.notice-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  position: relative;
  z-index: 1;
}

.badge-icon {
  font-size: 20px;
  color: white;
  animation: sparkle 2s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  50% {
    transform: scale(1.1) rotate(180deg);
  }
}

.badge-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.notice-message {
  font-size: 0.95rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.95);
  margin: 0;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
  padding: 32px 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.header-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
}

.header-text {
  flex: 1;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #6c757d;
  margin: 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  margin-left: auto;
}

.suggest-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;
}

.suggest-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgba(102, 126, 234, 0.45);
}

.suggest-btn :deep(.fa-icon) {
  font-size: 1.1rem;
}

.faq-content {
  max-width: 1200px;
  margin: 0 auto;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.faq-item {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 24px 28px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.faq-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.faq-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.faq-item:hover::before {
  transform: scaleX(1);
}

.faq-item-expanded {
  border-color: rgba(102, 126, 234, 0.4);
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.15);
}

.faq-item-expanded::before {
  transform: scaleX(1);
}

.faq-question {
  display: flex;
  align-items: center;
  gap: 20px;
}

.question-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.faq-item:hover .question-icon {
  transform: scale(1.1) rotate(5deg);
}

.question-text {
  flex: 1;
}

.question-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.5;
}

.question-arrow {
  color: #909399;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.arrow-icon {
  font-size: 24px;
}

.faq-item-expanded .question-arrow {
  color: #667eea;
  transform: rotate(180deg);
}

.faq-answer {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.answer-content {
  padding-left: 68px;
}

.answer-text {
  font-size: 1rem;
  line-height: 1.8;
  color: #495057;

  .description {
    margin: 0 0 16px 0;
    font-weight: 500;
    color: #2c3e50;
  }

  .detail-text {
    margin: 0 0 12px 0;
    padding-left: 20px;
    position: relative;

    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #667eea;
      font-weight: bold;
      font-size: 1.2em;
    }
  }

  .action-text {
    margin: 16px 0 0 0;
    padding: 12px 16px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    border-left: 3px solid #667eea;
    border-radius: 6px;
    font-weight: 500;
    color: #495057;
  }

  .note-text {
    margin: 12px 0;
    padding: 10px 14px;
    background: rgba(255, 193, 7, 0.1);
    border-left: 3px solid #ffc107;
    border-radius: 6px;
    color: #856404;
    font-size: 0.95em;
  }

  .content-list {
    margin: 12px 0;
    padding-left: 24px;

    li {
      margin: 8px 0;
      line-height: 1.6;
      position: relative;

      &::marker {
        color: #667eea;
        font-weight: bold;
      }
    }
  }

  .feature-list {
    margin: 16px 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    transition: all 0.3s ease;
  }

  .feature-success {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.08) 100%);
    border-left: 3px solid #10b981;

    .feature-icon {
      color: #10b981;
      font-size: 1.2em;
      margin-top: 2px;
      flex-shrink: 0;
    }

    .feature-text {
      color: #065f46;
      line-height: 1.6;
    }
  }

  .feature-text {
    flex: 1;
    font-weight: 500;
  }
}

.code-block {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px 20px;
  margin: 16px 0;
  position: relative;
  overflow-x: auto;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px 0 0 8px;
  }

  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
    font-size: 0.95em;
    color: #2c3e50;
    line-height: 1.6;
    display: block;
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.link-container {
  margin: 16px 0;
}

.link-button {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  font-size: 0.95em;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  :deep(.fa-icon) {
    font-size: 1.1em;
  }
}

.result-list {
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.result-success {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%);
  border-left: 3px solid #10b981;

  .result-icon {
    color: #10b981;
    font-size: 1.2em;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .result-text {
    color: #065f46;
  }
}

.result-error {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%);
  border-left: 3px solid #ef4444;

  .result-icon {
    color: #ef4444;
    font-size: 1.2em;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .result-text {
    color: #991b1b;
  }
}

.result-text {
  flex: 1;
  line-height: 1.6;
  font-weight: 500;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 1000px;
}

/* 联系客服悬浮按钮 */
.contact-float {
  position: fixed;
  bottom: 80px;
  right: 30px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 16px;
}

.contact-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 15px;
  user-select: none;
}

.contact-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.contact-trigger:active {
  transform: translateY(0);
}

.trigger-icon {
  font-size: 20px;
}

.trigger-text {
  font-size: 15px;
}

.contact-card-float {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid #b3d9ff;
  width: 240px;
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.card-close {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.06);
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0;
}

.card-close:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
  transform: rotate(90deg);
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.qr-code-wrapper {
  width: 200px;
  height: 200px;
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #b3d9ff;
  margin: 0 auto;
}

.qr-code-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
  display: block;
}

.card-hint {
  font-size: 0.9rem;
  color: #4a90e2;
  margin: 16px 0 0 0;
  font-weight: 500;
  text-align: center;
}

.contact-card-enter-active,
.contact-card-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.contact-card-enter-from,
.contact-card-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .faq-container {
    padding: 20px 16px;
  }

  .header-content {
    flex-direction: column;
    text-align: center;
    padding: 24px 20px;
    gap: 16px;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .header-notice {
    padding: 16px 20px;
    margin-bottom: 20px;
  }

  .badge-text {
    font-size: 1.1rem;
  }

  .notice-message {
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
    margin-left: 0;
  }

  .suggest-btn {
    width: 100%;
    justify-content: center;
  }

  .faq-item {
    padding: 20px;
  }

  .question-title {
    font-size: 1.1rem;
  }

  .answer-content {
    padding-left: 0;
  }

  .answer-text {
    font-size: 0.95rem;
  }

  .contact-float {
    bottom: 70px;
    right: 20px;
  }

  .contact-trigger {
    padding: 12px 18px;
    font-size: 14px;
  }

  .contact-card-float {
    width: 220px;
    padding: 16px;
  }

  .qr-code-wrapper {
    width: 160px;
    height: 160px;
  }
}
</style>
