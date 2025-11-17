<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {useRoute} from 'vue-router'
import {postCommentApi, postDetailApi, postReplyApi} from '@/api/bbs/post'
import type {PostVo} from '@/api/bbs/post/types'
import {toast} from 'vue-sonner'
import {commentPageApi} from "@/api/bbs/comment";
import type {PostCommentQuery, PostCommentVo} from "@/api/bbs/comment/types.ts";

const route = useRoute()

// 评论相关数据
const newComment = ref('')
// const hasMoreComments = ref(true)
// const commentLoading = ref(false)

// 返回上一页 - 已移除，使用浏览器返回按钮
// const goBack = () => {
//   router.back()
// }

// 发表评论
const submitComment = async () => {
  if (!newComment.value.trim()) return
  await postCommentApi(skinId, newComment.value);
}

// 点赞评论 - 暂时移除，保持界面简洁
// const likeComment = async (comment: any) => {
//   try {
//     comment.liked = !comment.liked
//     if (comment.liked) {
//       comment.likeCount++
//     } else {
//       comment.likeCount--
//     }
//     // 这里应该调用点赞评论API
//     toast.success(comment.liked ? '点赞成功' : '取消点赞')
//   } catch (error) {
//     // 回滚状态
//     comment.liked = !comment.liked
//     if (comment.liked) {
//       comment.likeCount++
//     } else {
//       comment.likeCount--
//     }
//     console.error('点赞评论失败:', error)
//     toast.error('操作失败')
//   }
// }

// 回复评论
const replyComment = ref<Tree<PostCommentVo>>()
const replyContent = ref('')
const showReplies = ref<Set<string>>(new Set())

const replyToComment = (comment: Tree<PostCommentVo>) => {
  console.log('点击回复按钮', comment)
  // 切换回复列表显示状态
  const commentId = comment.value
  if (showReplies.value.has(commentId)) {
    showReplies.value.delete(commentId)
    replyComment.value = undefined
    console.log('隐藏回复区域')
  } else {
    showReplies.value.add(commentId)
    // 显示回复输入框
    replyComment.value = comment
    replyContent.value = ''
    console.log('显示回复区域', commentId, replyComment.value)
  }
}

// 收起回复
const collapseReply = (comment: Tree<PostCommentVo>) => {
  const commentId = comment.value
  showReplies.value.delete(commentId)
  replyComment.value = undefined
  replyContent.value = ''
}

// 显示回复框 - 已移除，使用replyToComment函数
// const showReplyForm = (comment: Tree<PostCommentVo>) => {
//   replyComment.value = comment
//   replyContent.value = ''
// }

  // 提交回复
  const submitReply = async () => {
    if (!replyContent.value.trim() || !replyComment.value) return

    try {
      await postReplyApi(skinId, replyComment.value.value, replyContent.value)
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

// 加载更多评论 - 暂时移除，保持界面简洁
// const loadMoreComments = async () => {
//   try {
//     commentLoading.value = true
//     // 这里应该调用加载更多评论API
//     // 暂时模拟没有更多评论
//     hasMoreComments.value = false
//     toast.info('没有更多评论了')
//   } catch (error) {
//     console.error('加载更多评论失败:', error)
//     toast.error('加载失败')
//   } finally {
//     commentLoading.value = false
//   }
// }

// 获取外形ID
const skinId = route.params.id as string

// 加载外形详情
const skin = reactive<PostVo>({})
const loadSkinDetail = async () => {
  const {data} = await postDetailApi(skinId)
  Object.assign(skin, data)
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
  commentQuery.query.postId = skinId
  const {data} = await commentPageApi(commentQuery)
  Object.assign(comments, data.rows)
}

onMounted(() => {
  loadSkinDetail()
  loadComments()
})
</script>

<template>
  <div class="guide-detail-container">
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 顶部信息栏 -->
      <div class="top-info-bar">
        <span class="reply-info">
          <span class="reply-number">{{ skin.commentCount || 0 }}</span>回复贴，共<span class="page-number">1</span>页
        </span>
      </div>

      <!-- 帖子标题和操作按钮区域 -->
      <div class="post-header">
        <h1 class="post-title">{{ skin.title }}</h1>
        <div class="post-actions">
          <button class="action-btn only-op-btn">只看楼主</button>
          <button class="action-btn collect-btn">收藏</button>
          <button class="action-btn reply-btn">
            <FaIcon name="i-mdi:comment-outline" class="action-icon"/>
            回复
          </button>
        </div>
      </div>

      <!-- 楼主帖子 -->
      <div class="post-container">
        <!-- 用户信息区域 -->
        <div class="user-info">
          <div class="avatar-container">
            <img :src="skin.userAvatar" :alt="skin.userName" class="user-avatar"/>
            <div class="op-badge">楼主</div>
          </div>
          <div class="user-details">
            <div class="username">{{ skin.userName }}</div>
            <div class="user-badge">
              <span class="badge-icon">🏆</span>
              <span class="badge-text">知名人士</span>
              <span class="badge-level">11</span>
            </div>
          </div>
        </div>

        <!-- 帖子内容区域 -->
        <div class="post-content">
          <div class="post-body" v-html="skin.content"></div>
          <div class="post-meta">
            <span class="ip-location">IP属地:广东</span>
            <button class="report-btn">举报</button>
            <span class="client-info">来自Android客户端</span>
            <span class="floor-number">1楼</span>
            <span class="post-time">{{ skin.createTimeFormat }}</span>
            <button class="reply-btn">回复</button>
          </div>
        </div>
      </div>

      <!-- 评论列表 -->
      <div class="comments-section">
        <div
          v-for="(comment, index) in comments"
          :key="comment.value"
          class="comment-container"
        >
          <!-- 用户信息区域 -->
          <div class="user-info">
            <div class="avatar-container">
              <img :src="comment.metadata.userAvatar" :alt="comment.metadata.userName" class="user-avatar"/>
            </div>
            <div class="user-details">
              <div class="username">{{ comment.metadata.userName }}</div>
              <div class="user-badge">
                <span class="badge-icon">⭐</span>
                <span class="badge-text">铁杆吧友</span>
                <span class="badge-level">8</span>
              </div>
            </div>
          </div>

          <!-- 评论内容区域 -->
          <div class="comment-content">
            <div class="comment-text">{{ comment.metadata.content }}</div>
            <div class="comment-meta">
              <span class="ip-location">IP属地:河北</span>
              <button class="report-btn">举报</button>
              <span class="client-info">来自iPhone客户端</span>
              <span class="floor-number">{{ comments.length - index + 1 }}楼</span>
              <span class="comment-time">{{ comment.metadata.createTimeFormat }}</span>
              <button class="reply-btn" @click="replyToComment(comment)">
                回复
                <span v-if="comment.children && comment.children.length > 0" class="reply-count">
                  ({{ comment.children.length }})
                </span>
              </button>
            </div>
          </div>

          <!-- 子回复列表 -->
          <div v-if="comment.children && comment.children.length > 0 && showReplies.has(comment.value)" class="replies-container">
            <div
              v-for="reply in comment.children"
              :key="reply.value"
              class="reply-container"
            >
              <!-- 回复用户信息 -->
              <div class="user-info">
                <div class="avatar-container">
                  <img :src="reply.metadata.userAvatar" :alt="reply.metadata.userName" class="user-avatar"/>
                </div>
                <div class="user-details">
                  <div class="username">{{ reply.metadata.userName }}</div>
                </div>
              </div>

              <!-- 回复内容 -->
              <div class="reply-content">
                <div class="reply-text">{{ reply.metadata.content }}</div>
                <div class="reply-meta">
                  <span class="reply-time">{{ reply.metadata.createTimeFormat }}</span>
                  <button class="reply-btn">回复</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 回复区域 -->
          <div v-if="replyComment && replyComment.value === comment.value" class="reply-section">
            <!-- 回复操作区域 -->
            <div class="reply-action-section">
              <button class="collapse-reply-btn" @click="collapseReply(comment)">
                收起回复
              </button>
            </div>

            <!-- 回复输入框 -->
            <div class="reply-form">
              <textarea
                v-model="replyContent"
                placeholder=""
                class="reply-textarea"
                rows="4"
              ></textarea>
              <div class="reply-form-actions">
                <button class="image-upload-btn">
                  <FaIcon name="i-mdi:image-outline" class="upload-icon"/>
                </button>
                <button
                  class="submit-reply-btn"
                  :disabled="!replyContent.trim()"
                  @click="submitReply"
                >
                  发表
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 发表评论区域 -->
      <div class="comment-form-section">
        <div class="comment-form">
          <textarea
            v-model="newComment"
            placeholder=""
            class="comment-textarea"
            rows="4"
          ></textarea>
          <button
            class="submit-comment-btn"
            :disabled="!newComment.trim()"
            @click="submitComment"
          >
            发表回复
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.guide-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px 0;
  max-width: 1200px;
  margin: 0 auto;
}

/* 顶部信息栏 */
.top-info-bar {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  padding: 8px 20px;
}

.reply-info {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.reply-number,
.page-number {
  color: #ff4444;
  font-weight: 600;
}

/* 帖子标题和操作按钮区域 */
.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e4e7ed;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.post-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  color: #333;
  transition: all 0.2s ease;
  min-width: 50px;
  justify-content: center;
}

.action-btn:hover {
  background: #f5f5f5;
  border-color: #409eff;
}

.action-icon {
  font-size: 14px;
}

/* 主要内容区域 */
.main-content {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  margin: 0 20px;
  margin-bottom: 20px;
}

/* 帖子容器 */
.post-container {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

/* 用户信息区域 */
.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;
  flex-shrink: 0;
  margin-right: 16px;
}

.avatar-container {
  position: relative;
  margin-bottom: 8px;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.op-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #409eff;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: 500;
}

.user-details {
  text-align: center;
  width: 100%;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #1e88e5;
  margin-bottom: 4px;
  cursor: pointer;
}

.username:hover {
  text-decoration: underline;
}

.user-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 12px;
}

.badge-icon {
  font-size: 12px;
}

.badge-text {
  color: #666;
  font-size: 11px;
}

.badge-level {
  background: #ffa726;
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 500;
}

/* 帖子内容区域 */
.post-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 帖子内容区域的标题样式已移至post-header */

.post-body {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 8px;
}

.post-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 8px 0;
}

.post-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
  color: #999;
  flex-wrap: wrap;
}

.ip-location {
  color: #999;
}

.report-btn {
  background: none;
  border: none;
  color: #1e88e5;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.report-btn:hover {
  text-decoration: underline;
}

.client-info {
  color: #999;
}

.floor-number {
  color: #999;
  font-weight: 500;
}

.post-time {
  color: #999;
}

.reply-btn {
  background: none;
  border: none;
  color: #1e88e5;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.reply-btn:hover {
  text-decoration: underline;
}

.reply-count {
  color: #666;
  margin-left: 2px;
}

/* 评论区域 */
.comments-section {
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e4e7ed;
  margin-top: 20px;
  padding-top: 20px;
}

.comment-container {
  display: flex;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
}

.comment-container:last-child {
  border-bottom: none;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comment-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.comment-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
  color: #999;
  flex-wrap: wrap;
}

.comment-time {
  color: #999;
}

/* 子回复容器 */
.replies-container {
  margin-left: 136px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
}

.reply-container {
  display: flex;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e7ed;
}

.reply-container:last-child {
  border-bottom: none;
}

.reply-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.reply-text {
  font-size: 14px;
  line-height: 1.5;
  color: #333;
}

.reply-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.reply-time {
  color: #999;
}

/* 回复区域 */
.reply-section {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
}

/* 回复操作区域 */
.reply-action-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.reply-meta-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.question-icon {
  color: #999;
  font-size: 12px;
}

.collapse-reply-btn {
  background: none;
  border: none;
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
}

.collapse-reply-btn:hover {
  text-decoration: underline;
}

/* 回复表单 */
.reply-form {
  padding: 12px 16px;
  background: white;
}

.reply-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #409eff;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.reply-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.reply-form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-upload-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.image-upload-btn:hover {
  background: #f5f5f5;
  color: #409eff;
}

.upload-icon {
  font-size: 18px;
}

.submit-reply-btn {
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-reply-btn:hover:not(:disabled) {
  background: #337ecc;
}

.submit-reply-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

/* 发表评论区域 */
.comment-form-section {
  padding: 20px;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
}

.comment-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.submit-comment-btn {
  background: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  align-self: flex-end;
}

.submit-comment-btn:hover:not(:disabled) {
  background: #337ecc;
}

.submit-comment-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .guide-detail-container {
    padding: 10px 0;
  }

  .main-content {
    margin: 0 10px;
  }

  .post-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .post-actions {
    width: 100%;
    justify-content: flex-end;
    gap: 6px;
  }

  .action-btn {
    min-width: 50px;
    padding: 3px 6px;
    font-size: 11px;
  }

  .user-info {
    width: 80px;
    margin-right: 12px;
  }

  .user-avatar {
    width: 50px;
    height: 50px;
  }

  .replies-container {
    margin-left: 92px;
  }

  .post-meta,
  .comment-meta {
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
}
</style>
