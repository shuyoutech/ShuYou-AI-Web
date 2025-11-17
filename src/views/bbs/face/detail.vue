<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {postCommentApi, postDetailApi, postReplyApi} from '@/api/bbs/post'
import type {PostVo} from '@/api/bbs/post/types'
import {toast} from 'vue-sonner'
import {commentPageApi} from "@/api/bbs/comment";
import type {PostCommentQuery, PostCommentVo} from "@/api/bbs/comment/types.ts";

const router = useRouter()
const route = useRoute()

// 评论相关数据
const newComment = ref('')
const hasMoreComments = ref(true)
const commentLoading = ref(false)

// 返回上一页
const goBack = () => {
  router.back()
}

// 发表评论
const submitComment = async () => {
  if (!newComment.value.trim()) return
  await postCommentApi(faceId, newComment.value);
}

// 点赞评论
const likeComment = async (comment: any) => {
  try {
    comment.liked = !comment.liked
    if (comment.liked) {
      comment.likeCount++
    } else {
      comment.likeCount--
    }
    // 这里应该调用点赞评论API
    toast.success(comment.liked ? '点赞成功' : '取消点赞')
  } catch (error) {
    // 回滚状态
    comment.liked = !comment.liked
    if (comment.liked) {
      comment.likeCount++
    } else {
      comment.likeCount--
    }
    console.error('点赞评论失败:', error)
    toast.error('操作失败')
  }
}

// 回复评论
const replyComment = ref<Tree<PostCommentVo>>()
const replyContent = ref('')
const showReplies = ref<Set<string>>(new Set())

const replyToComment = (comment: Tree<PostCommentVo>) => {
  // 切换回复列表显示状态
  const commentId = comment.value
  if (showReplies.value.has(commentId)) {
    showReplies.value.delete(commentId)
    replyComment.value = undefined
  } else {
    showReplies.value.add(commentId)
    // 不设置回复框，只显示回复列表
    replyComment.value = undefined
    replyContent.value = ''
  }
}

// 显示回复框
const showReplyForm = (comment: Tree<PostCommentVo>) => {
  replyComment.value = comment
  replyContent.value = ''
}

  // 提交回复
  const submitReply = async () => {
    if (!replyContent.value.trim() || !replyComment.value) return

    try {
      await postReplyApi(faceId, replyComment.value.value, replyContent.value)
      toast.success('回复成功')
      replyContent.value = ''
      replyComment.value = undefined
      // 重新加载评论
      await loadComments()
    } catch (error) {
      console.error('回复失败:', error)
      toast.error('回复失败')
    }
  }

// 加载更多评论
const loadMoreComments = async () => {
  try {
    commentLoading.value = true
    // 这里应该调用加载更多评论API
    // 暂时模拟没有更多评论
    hasMoreComments.value = false
    toast.info('没有更多评论了')
  } catch (error) {
    console.error('加载更多评论失败:', error)
    toast.error('加载失败')
  } finally {
    commentLoading.value = false
  }
}

// 获取捏脸ID
const faceId = route.params.id as string

// 加载捏脸详情
const face = reactive<PostVo>({})
const loadFaceDetail = async () => {
  const {data} = await postDetailApi(faceId)
  Object.assign(face, data)
}

// 加载评论列表
const commentQuery = reactive<PageQuery<PostCommentQuery>>({
  pageNum: 1,
  pageSize: 20,
  sort: 'createTime',
  order: 'asc',
  query: {
    postId: '',
  }
})
const comments = reactive<Tree<PostCommentVo>[]>([])
const loadComments = async () => {
  commentQuery.query.postId = faceId
  const {data} = await commentPageApi(commentQuery)
  Object.assign(comments, data.rows)
}

onMounted(() => {
  loadFaceDetail()
  loadComments()
})
</script>

<template>
  <div class="face-detail-container">
    <!-- 详情内容 -->
    <div class="detail-content">
      <!-- 主要内容 -->
      <div class="main-detail">
        <!-- 标题和作者信息 -->
        <div class="header-section">
          <div class="title-header">
            <h1 class="detail-title">{{ face.title }}</h1>
            <!-- 返回按钮 -->
            <div class="back-button" @click="goBack">
              <FaIcon name="i-mdi:arrow-left" class="back-icon"/>
              <span>返回</span>
            </div>
          </div>
          <div v-if="face.tagNames && face.tagNames.length > 0" class="tags-section">
            <div class="section-container">
              <h3 class="section-title">标签</h3>
              <div class="tags-container">
              <span
                v-for="tagName in face.tagNames"
                :key="tagName"
                class="detail-tag"
              >
                {{ tagName }}
              </span>
              </div>
            </div>
          </div>

          <!-- 封面图片区域 -->
          <div class="section-container">
            <h3 class="section-title">封面</h3>
            <div class="cover-container">
              <img
                :src="face.coverImgUrl"
                :alt="face.title"
                class="cover-image"
              />
            </div>
          </div>
          <!-- 作品描述区域 -->
          <div v-if="face.content" class="section-container">
            <h3 class="section-title">作品描述</h3>
            <div class="content-body" v-html="face.content"></div>
          </div>
        </div>
      </div>

      <!-- 评论区域 -->
      <div class="comments-section">
        <div class="comments-container">
          <!-- 发表评论 -->
          <div class="comment-form">
            <textarea
              v-model="newComment"
              placeholder="留下你的看法"
              class="comment-textarea"
              rows="4"
            ></textarea>
            <div class="form-actions">
              <button
                class="submit-comment-btn"
                :disabled="!newComment.trim()"
                @click="submitComment"
              >
                评论
              </button>
            </div>
          </div>

          <!-- 评论标题 -->
          <div class="comments-header">
            <h3 class="comments-title">评论 {{ face.commentCount }}</h3>
          </div>

          <!-- 评论列表 -->
          <div class="comments-list">
            <div
              v-for="(comment, index) in comments"
              :key="comment.value"
            >
              <div class="comment-item">
                <div class="floor-number">{{ comments.length - index }}楼</div>
                <div class="comment-avatar">
                  <img
                    :src="comment.metadata.userAvatar"
                    :alt="comment.metadata.userName"
                    class="avatar-img"
                  />
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.metadata.userName }}</span>
                  </div>
                  <div class="comment-text">{{ comment.metadata.content }}</div>
                  <div class="comment-meta">
                    <div class="meta-left">
                      <span class="comment-time">{{ comment.metadata.createTimeFormat }}</span>
                      <span class="comment-location" v-if="comment.metadata.ipLocation">{{
                          comment.metadata.ipLocation
                        }}</span>
                    </div>
                    <div class="meta-right">
                      <div class="action-buttons">
                        <button class="action-link report-btn">举报</button>
                        <button class="action-link reply-btn" @click="replyToComment(comment)">
                          回复
                          <span v-if="comment.children && comment.children.length > 0" class="reply-count">
                            ({{ comment.children.length }})
                          </span>
                        </button>
                        <button
                          class="action-link like-btn"
                          :class="{ liked: comment.metadata.liked }"
                          @click="likeComment(comment)"
                        >
                          <FaIcon name="i-mdi:thumb-up" class="action-icon"/>
                          <span>{{ comment.metadata.likeCount || 0 }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              <!-- 子回复列表 -->
              <div v-if="comment.children && comment.children.length > 0 && showReplies.has(comment.value)" class="reply-list-container">
                <div class="reply-list-header">
                  <span class="reply-list-title">回复列表</span>
                  <button class="collapse-replies-btn" @click="replyToComment(comment)">收起回复</button>
                </div>
                <div class="reply-list">
                  <div
                    v-for="(reply, replyIndex) in comment.children"
                    :key="reply.value"
                    class="reply-item"
                  >
                    <div class="reply-avatar">
                      <img
                        :src="reply.metadata.userAvatar"
                        :alt="reply.metadata.userName"
                        class="avatar-img"
                      />
                    </div>
                    <div class="reply-content">
                      <div class="reply-header">
                        <span class="reply-author">{{ reply.metadata.userName }}</span>
                        <span class="reply-to" v-if="reply.metadata.replyToUserName">
                          回复 {{ reply.metadata.replyToUserName }}:
                        </span>
                      </div>
                      <div class="reply-text">{{ reply.metadata.content }}</div>
                      <div class="reply-meta">
                        <div class="meta-left">
                          <span class="reply-time">{{ reply.metadata.createTimeFormat }}</span>
                          <span class="reply-location" v-if="reply.metadata.ipLocation">{{
                              reply.metadata.ipLocation
                            }}</span>
                        </div>
                        <div class="meta-right">
                          <div class="action-buttons">
                            <button class="action-link report-btn">举报</button>
                            <button class="action-link reply-btn" @click="replyToComment(reply)">回复</button>
                            <button
                              class="action-link like-btn"
                              :class="{ liked: reply.metadata.liked }"
                              @click="likeComment(reply)"
                            >
                              <FaIcon name="i-mdi:thumb-up" class="action-icon"/>
                              <span>{{ reply.metadata.likeCount || 0 }}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 我也说一句按钮 -->
                <div class="reply-action-section">
                  <button class="i-want-to-reply-btn" @click="showReplyForm(comment)">
                    我也说一句
                  </button>
                </div>

                <!-- 回复输入框 - 在我也说一句按钮下面 -->
                <div v-if="replyComment && replyComment.value === comment.value" class="reply-form">
                  <div class="reply-input-container">
                     <textarea
                       v-model="replyContent"
                       placeholder=""
                       class="reply-textarea"
                       rows="4"
                     ></textarea>
                    <button
                      class="submit-reply-btn"
                      :disabled="!replyContent.trim()"
                      @click="submitReply"
                    >
                      回复
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <!-- 加载更多评论 -->
          <div class="load-more-section" v-if="hasMoreComments">
            <button class="load-more-btn" @click="loadMoreComments">
              加载更多评论
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.face-detail-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

/* 加载状态 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.loading-spinner {
  text-align: center;
}

.loading-icon {
  font-size: 48px;
  color: #409eff;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 16px;
  font-size: 16px;
  color: #666;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 返回按钮 */
.back-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  width: fit-content;
  font-size: 14px;
  font-weight: 600;
  position: relative;
  overflow: hidden;
}

.back-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.back-button:hover::before {
  left: 100%;
}

.back-icon {
  font-size: 18px;
  color: white;
}

/* 主要内容 */
.main-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 头部区域 */
.header-section {
  padding-bottom: 20px;
}

.title-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

/* 区域容器 */
.section-container {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(64, 158, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;
}

.section-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #409eff 0%, #67c23a 50%, #e6a23c 100%);
}


/* 区域标题 */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 16px 0;
  padding: 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title::before {
  content: '';
  width: 4px;
  height: 20px;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  border-radius: 2px;
}

/* 标签区域 */
.tags-section {
  margin: 20px 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-tag {
  padding: 8px 16px;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.detail-tag::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.detail-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.detail-tag:hover::before {
  left: 100%;
}

/* 封面区域 */

.cover-container {
  max-width: 600px;
  width: 100%;
  border-radius: 20px;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  margin: 0 auto;
  position: relative;
  transition: all 0.3s ease;
}

.cover-container:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.cover-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.cover-container:hover .cover-image {
  transform: scale(1.02);
}

.detail-title {
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #2c3e50 0%, #409eff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 20px 0;
  line-height: 1.3;
  position: relative;
}

.author-section {
  margin-top: 20px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.author-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f9ff;
}

.author-details {
  flex: 1;
}

.author-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.author-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.publish-time {
  font-size: 14px;
  color: #666;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f0f9ff;
  border-radius: 12px;
  border: 1px solid #b3d8ff;
}

.location-icon {
  font-size: 12px;
  color: #409eff;
}

.location-text {
  font-size: 12px;
  color: #409eff;
  font-weight: 500;
}

/* 标签区域 */
.tags-section {
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-tag {
  padding: 6px 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  color: #409eff;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #b3d8ff;
}

/* 统计信息 */
.stats-section {
  border-bottom: 1px solid #e4e7ed;
  padding-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #e4e7ed;
}

.stat-icon {
  font-size: 24px;
  color: #409eff;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

/* 操作按钮 */
.actions-section {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 24px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 600;
  min-width: 120px;
  justify-content: center;
}

.like-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
}

.like-button.liked {
  background: linear-gradient(135deg, #ff4757 0%, #c44569 100%);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
}

.like-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
}

.download-button {
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.download-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

.share-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.share-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.action-icon {
  font-size: 16px;
}

/* 错误状态 */
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.error-content {
  text-align: center;
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 64px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 12px 0;
}

.error-message {
  font-size: 16px;
  color: #666;
  margin: 0 0 24px 0;
}

.retry-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 600;
}

.retry-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
}

/* 内容区域样式 */

.content-body {
  font-size: 16px;
  line-height: 1.8;
  color: #555;
}

.content-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 10px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.content-body :deep(p) {
  margin: 12px 0;
}

.content-body :deep(h1, h2, h3, h4, h5, h6) {
  color: #333;
  margin: 20px 0 12px 0;
  font-weight: 600;
}

.content-body :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 16px;
  margin: 16px 0;
  color: #666;
  font-style: italic;
}

/* 评论区域样式 */
.comments-section {
  margin-top: 20px;
}

.comments-container {
  background: white;
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.comments-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f9ff;
}

.title-icon {
  font-size: 20px;
  color: #409eff;
}

/* 评论表单样式 */
.comment-form {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-textarea {
  width: 100%;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  transition: all 0.3s ease;
  background: white;
}

.comment-textarea:focus {
  outline: none;
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1);
}

.comment-textarea::placeholder {
  color: #a0a8b0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-comment-btn {
  padding: 8px 20px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.submit-comment-btn:hover:not(:disabled) {
  background: #7c3aed;
}

.submit-comment-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

/* 评论标题 */
.comments-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4e7ed;
}

.comments-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* 评论列表样式 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.comment-author {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.user-level {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
}

.level-icon {
  font-size: 10px;
  color: #666;
}

.level-text {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  margin: 4px 0;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.comment-time {
  font-size: 12px;
  color: #999;
}

.comment-location {
  font-size: 12px;
  color: #999;
}

.floor-number {
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
  z-index: 1;
}

.action-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  color: #999;
  text-decoration: none;
}

.action-link:hover {
  color: #666;
}

.reply-count {
  color: #666;
  font-size: 12px;
  margin-left: 2px;
}

.like-btn.liked {
  color: #ff4757;
}

.action-icon {
  font-size: 12px;
}

/* 回复输入框样式 */
.reply-form {
  margin: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #e4e7ed;
  position: relative;
}

.reply-input-container {
  position: relative;
  width: 100%;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.reply-textarea {
  width: 100%;
  padding: 16px 80px 16px 16px;
  border: none;
  border-radius: 0;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  min-height: 120px;
  font-family: inherit;
  transition: all 0.3s ease;
  background: transparent;
  box-sizing: border-box;
  outline: none;
}

.reply-textarea:focus {
  outline: none;
}

.reply-textarea::placeholder {
  color: #a0a8b0;
}

.submit-reply-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  padding: 8px 20px;
  background: #8b5cf6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  font-weight: 500;
}

.submit-reply-btn:hover:not(:disabled) {
  background: #a0a8b0;
}

.submit-reply-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

/* 子回复列表容器样式 */
.reply-list-container {
  margin: 16px 0 0 52px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.reply-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.reply-list-title {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.collapse-replies-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.collapse-replies-btn:hover {
  background: #e9ecef;
  color: #333;
}

.reply-list {
  padding: 0;
}

.reply-item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.reply-item:last-child {
  border-bottom: none;
}

.reply-avatar {
  flex-shrink: 0;
}

.reply-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-author {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.reply-to {
  color: #666;
  font-size: 12px;
}

.reply-text {
  color: #333;
  line-height: 1.5;
  font-size: 14px;
}

.reply-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.reply-time {
  font-size: 12px;
  color: #999;
}

.reply-location {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

/* 我也说一句按钮 */
.reply-action-section {
  padding: 12px 16px;
  background: #f8f9fa;
  border-top: 1px solid #e4e7ed;
  text-align: right;
}

.i-want-to-reply-btn {
  background: #409eff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.i-want-to-reply-btn:hover {
  background: #337ecc;
  transform: translateY(-1px);
}

/* 加载更多按钮 */
.load-more-section {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.load-more-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.load-more-btn:hover {
  background: #e9ecef;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .face-detail-container {
    padding: 10px;
  }

  .main-detail {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 20px;
  }

  .detail-title {
    font-size: 24px;
  }

  .content-container,
  .comments-container {
    padding: 20px;
  }

  .comment-form {
    padding: 16px;
  }

  .comment-item {
    padding: 16px;
  }

  .overlay-actions {
    flex-direction: column;
    gap: 12px;
  }

  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
