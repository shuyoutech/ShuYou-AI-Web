/**
 * 帖子查询参数
 */
export interface PostQuery {
  status?: string;//帖子状态
  plate?: string; //帖子板块:捏脸专区-face,外形专区-skin,攻略专区-guide,公告专区-notice ,活动专区-event
  title?: string; //帖子标题
  tags?: string[];//帖子标签
  gameId?: string;//游戏ID
}

/**
 * 帖子详情
 */
export interface PostVo {
  id?: string;             //帖子ID
  createTime?: string;     //创建时间
  createTimeFormat?: string//时间格式化
  status?: string;         //帖子状态
  userId?: string;         //发帖用户ID
  userName?: string;       //用户名称
  userAvatar?: string;     //用户头像
  plate?: string;          //帖子板块:捏脸专区-face,外形专区-skin,攻略专区-guide,公告专区-notice ,活动专区-event
  category?: string;       //帖子分类
  tags?: string[];         //标签集合
  tagNames?: string[];     //标签名称集合
  title?: string;          //帖子标题
  content?: string;        //帖子内容
  summary?: string;        //帖子摘要
  coverImgUrl?: string;    //封面图片URL
  viewCount?: number;      //浏览次数
  likeCount?: number;      //点赞次数
  liked?: boolean;         //是否点赞过
  commentCount?: number;   //评论次数
  dislikeCount?: number;   //点踩次数
  favoriteCount?: number;  //收藏次数
  shareCount?: number;     //分享次数
  reportCount?: number;    //举报次数
  pinned?: boolean;        //是否置顶
  featured?: boolean;      //是否精华
  ipAddress?: string;      //发帖IP地址:12.12.12.12
  ipLocation?: string;     //发帖IP地理位置:江苏
  attachmentIds?: string[];//附件文件IDS
  reviewReason?: string;   //审核原因
}

/**
 * 帖子新增对象
 */
export interface PostSaveBo {
  gameId: string;          //游戏ID
  plate: string;           //帖子板块:捏脸专区-face,外形专区-skin,攻略专区-guide,公告专区-notice,活动专区-event
  title: string;           //帖子标题
  content: string;         //帖子内容
  coverImgUrl?: string;    //封面图片URL
  summary?: string;        //帖子摘要
  category?: string;       //帖子分类
  tags?: string[];         //标签集合
  attachmentIds?: string[];//附件文件IDS
}

/**
 * 帖子修改对象
 */
export interface PostUpdateBo extends PostSaveBo {
  id: string; //帖子ID
}

/**
 * 帖子修改对象
 */
export interface PostReviewBo {
  id: string;           //帖子ID
  status: string;       //审核状态
  reviewReason?: string;//审核原因
}
