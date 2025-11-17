export interface ChatModelBo {
  conversationId?: string;    //会话ID
  provider?: string;          //供应商
  model?: string;             //模型名称
  function?: string;          //模型功能:chat-对话
  params?: ChatModelParam;     //模型参数对象
}

export interface ChatModelParam {
  message?: string;         //用户消息
  prompt?: string;          //提示词
  stream?: boolean;         //是否流方式返回
  enableMemory?: boolean;   //是否开启多轮对话
  enableThinking?: boolean; //是否开启深度思考
  enableSearch?: boolean;   //是否开启联网搜索
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  messageCount?: number;
}

export interface ChatConversationVo {
  id: string;        //对话框ID
  createTime: string;//创建时间
  userId: string;    //用户ID
  title: string;     //标题
}

export interface ChatMessageVo {
  id: string;                      //对话消息ID
  userId: string;                  //用户ID
  userName: string;                //用户名称
  conversationId: string;          //会话ID
  provider: string;                //供应商
  modelName: string;               //模型名称
  modelFunction: string;           //模型功能接口
  enableMemory: boolean;           //是否开启多轮对话
  enableThinking: boolean;         //是否开启深度思考
  enableSearch: boolean;           //是否开启联网搜索
  userMessage: string;             //用户发送消息
  assistantMessage: string;        //AI返回消息
  requestTime: string;             //请求时间
  responseTime: string;            //响应时间
  ip: string;                      //请求IP
  ipRegion: string;                //请求地区
  durationSeconds: number;         //对话运行时间
  inputTokenCount: number;         //输入Token数量
  inputCacheHitTokenCount: number; //命中上下文缓存的token数
  inputCacheMissTokenCount: number;//未命中上下文缓存的token数
  inputPrice: number;              //输入累计价格
  outputTokenCount: number;        //输出Token数量
  outputPrice: number;             //输出累计价格
  totalTokenCount: number;         //总共Token数量
  totalPrice: number;              //总共价格
}


export interface ImageModelBo {
  provider: string; //供应商
  model: string; //模型名称
  function: string; //模型功能:textToImage-文生图
  params: ImageModelParam; //模型参数对象
}

export interface ImageModelParam {
  prompt?: string; //正向提示词，用来描述生成图像中期望包含的元素和视觉特点。
  negativePrompt?: string; //反向提示词，用来描述不希望在画面中看到的内容，可以对画面进行限制。
  n?: number; //生成图片的数量
  size?: string; //输出图像的分辨率
  quality?: string;
  seed?: number; //随机数种子
  promptExtend?: boolean;//是否开启prompt智能改写
  watermark?: boolean;//是否添加水印标识
  imageUrls?: string[];//参考图片URLS
  message?: string;
  duration?: number;
}


export interface ImageMessageVo {
  id: string;                      //对话消息ID
  userId: string;                  //用户ID
  userName: string;                //用户名称
  provider: string;                //供应商
  modelName: string;               //模型名称
  requestTime: string;             //请求时间
  responseTime: string;            //响应时间
  durationSeconds: number;         //对话运行时间
  messageId: string;               //模型返回消息ID
  imageNum: number;                //输出图片数量
  imageUrls: string[];             //输出图片地址
  price: number;                   //消费价格
  credit: number;                  //消费算力
}

export interface VideoModelBo {
  provider: string; //供应商
  model: string; //模型名称
  function: string; //模型功能:textToImage-文生图
  params: VideoModelParam; //模型参数对象
}

export interface VideoModelParam {
  prompt?: string; //正向提示词，用来描述生成图像中期望包含的元素和视觉特点。
  negativePrompt?: string; //反向提示词，用来描述不希望在画面中看到的内容，可以对画面进行限制。
  n?: number; //生成图片的数量
  size?: string; //输出图像的分辨率
  seed?: number; //随机数种子
  promptExtend?: boolean;//是否开启prompt智能改写
  watermark?: boolean;//是否添加水印标识
  imageUrls?: string[];
  message?: string;
  duration?: number;
}

export interface VideoMessageVo {
  id: string;                      //对话消息ID
  userId: string;                  //用户ID
  userName: string;                //用户名称
  provider: string;                //供应商
  modelName: string;               //模型名称
  requestTime: string;             //请求时间
  responseTime: string;            //响应时间
  durationSeconds: number;         //对话运行时间
  messageId: string;               //模型返回消息ID
  videoDuration: number;           //视频时长
  videoUrl: string;                //输出视频地址
  price: number;                   //消费价格
  credit: number;                  //消费算力
}


export interface AudioModelBo {
  provider: string; //供应商
  model: string; //模型名称
  function: string; //模型功能:audioSpeech-语音合成
  params: AudioModelParam; //模型参数对象
}

export interface AudioModelParam {
  text?: string;
  voice?: string;
  languageType?: string;
  fileUrls?: string[];
}

export interface AudioMessageVo {
  id: string;                      //对话消息ID
  userId: string;                  //用户ID
  userName: string;                //用户名称
  provider: string;                //供应商
  modelName: string;               //模型名称
  requestTime: string;             //请求时间
  responseTime: string;            //响应时间
  durationSeconds: number;         //对话运行时间
  messageId: string;               //模型返回消息ID
  audioUrl: string;                //输出音频地址
  price: number;                   //消费价格
  credit: number;                  //消费算力
}

export interface AigcSumUsageVo {
  balance?: number;    //算力余额
  consume?: number;    //本月消费
}

export interface AigcUsageMonthVo {
  creditList?: number[];//算力
  tokenList?: number[]; //token
  countList?: number[]; //次数
  dateList?: string[];  //日期数组
}

export interface AigcUsageQuery {
  startDate?: string
  endDate?: string
}

export interface AigcUsageRecordVo {
  id: string;//记录ID
  createTime: string;//创建时间
  userId: string;//用户ID
  userName: string;//用户名称
  modelName: string;//模型名称
  inputTokenCount: number;//输入Token数量
  inputPrice: number;//输入累计价格
  outputTokenCount: number;//输出Token数量
  outputPrice: number;//输出累计价格
  totalTokenCount: number;//总共Token数量
  totalPrice: number;//总共价格
  credit: number;//消费算力
}

export interface AigcModelChatMsg {
  conversationId?: string
  provider?: string
  model?: string
  content?: string
  inputTokens?: number
  outputTokens?: number
  reasoningTokens?: number
  durationSeconds?: number
  messageId?: string
  modelId?: string
  providerIcon?: string
  errorMessage?: string
}
