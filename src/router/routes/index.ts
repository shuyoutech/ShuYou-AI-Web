/**
 * 路由配置
 * @description 所有路由都在这里集中管理
 */
const routes: any[] = [
  // 登录页
  {
    path: "/",
    redirect: "/chat",
  },
  // 404
  {
    path: "/404",
    name: "404",
    component: () => import('@/views/[...all].vue'),
    meta: {
      title: "404页",
      show: false,
    },
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/layouts/layout.vue'),
    redirect: '/chat/completions',
    meta: {
      title: 'AI对话',
      show: true,
      icon: 'ri:chat-3-line',
    },
    children: [
      {
        path: 'completions',
        name: 'ChatCompletions',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '聊天',
          show: false,
        },
      },
      {
        path: 'translation',
        name: 'ChatTranslation',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '翻译',
          show: false,
        },
      },
      {
        path: 'math',
        name: 'ChatMath',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '数学',
          show: false,
        },
      },
      {
        path: 'coder',
        name: 'ChatCoder',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '编程',
          show: false,
        },
      },
      {
        path: 'writing',
        name: 'ChatWriting',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '写作',
          show: false,
        },
      },
      {
        path: 'multi-model',
        name: 'MultiModelChat',
        component: () => import('@/views/chat/multiModelChat.vue'),
        meta: {
          title: '多模型对话',
          show: false,
        },
      },
    ],
  },
  {
    path: '/image',
    name: 'Image',
    component: () => import('@/layouts/layout.vue'),
    redirect: '/image/text-to-image',
    meta: {
      title: 'AI绘画',
      show: true,
      icon: 'ri:image-line',
    },
    children: [
      {
        path: 'text-to-image',
        name: 'TextToImage',
        component: () => import('@/views/image/textToImage.vue'),
        meta: {
          title: '文生图',
          show: false,
        },
      },
      {
        path: 'image-to-image',
        name: 'ImageToImage',
        component: () => import('@/views/image/imageToImage.vue'),
        meta: {
          title: '图生图',
          show: false,
        },
      },
      {
        path: 'understanding',
        name: 'ImageUnderstanding',
        component: () => import('@/views/image/imageUnderstand.vue'),
        meta: {
          title: '图片理解',
          show: false,
        },
      },
      {
        path: 'my-images',
        name: 'MyImages',
        component: () => import('@/views/image/myImages.vue'),
        meta: {
          title: '我的创作',
          show: false,
        },
      }
    ],
  },
  {
    path: '/video',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: 'AI视频',
      show: true,
      icon: 'ri:video-line',
    },
    redirect: '/video/text-to-video',
    children: [
      {
        path: 'text-to-video',
        name: 'TextToVideo',
        component: () => import('@/views/video/textToVideo.vue'),
        meta: {
          title: '文生视频',
          show: false,
        },
      },
      {
        path: 'image-to-video',
        name: 'ImageToVideo',
        component: () => import('@/views/video/imageToVideo.vue'),
        meta: {
          title: '图生视频-首帧',
          show: false,
        },
      },
      {
        path: 'multi-image-to-video',
        name: 'MultiImageToVideo',
        component: () => import('@/views/video/multiImageToVideo.vue'),
        meta: {
          title: '图生视频-首尾帧',
          show: false,
        },
      },
      {
        path: 'my-videos',
        name: 'MyVideos',
        component: () => import('@/views/video/myVideos.vue'),
        meta: {
          title: '我的创作',
          show: false,
        },
      },
      {
        path: 'understanding',
        name: 'VideoUnderstanding',
        component: () => import('@/views/video/videoUnderstand.vue'),
        meta: {
          title: '视频理解',
          show: false,
        },
      },
      {
        path: 'lip-sync',
        name: 'VideoLipSync',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '视频对口型',
          show: false,
        },
      },
      {
        path: 'effects',
        name: 'VideoEffects',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '视频特效',
          show: false,
        },
      },
      {
        path: 'upscale',
        name: 'UpscaleVideo',
        component: () => import('@/views/chat/index.vue'),
        meta: {
          title: '视频升级高清',
          show: false,
        },
      }
    ],
  },
  {
    path: '/audio',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: 'AI语音',
      show: true,
      icon: 'ri:mic-line',
    },
    redirect: '/audio/speech',
    children: [
      {
        path: 'speech',
        name: 'AudioSpeech',
        component: () => import('@/views/audio/audioSpeech.vue'),
        meta: {
          title: '语音合成',
          show: false,
        },
      },
      {
        path: 'transcription',
        name: 'AudioTranscription',
        component: () => import('@/views/audio/audioTranscription.vue'),
        meta: {
          title: '语音识别',
          show: false,
        },
      },
      {
        path: 'my-audios',
        name: 'MyAudios',
        component: () => import('@/views/audio/myAudios.vue'),
        meta: {
          title: '我的创作',
          show: false,
        },
      }
    ],
  },
  {
    path: '/model',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: '模型',
      show: true,
      icon: 'ri:cpu-line',
    },
    redirect: '/model/index',
    children: [
      {
        path: 'index',
        name: 'modelIndex',
        component: () => import('@/views/model/index.vue'),
        meta: {
          title: '模型列表',
          show: false,
        },
      }
    ],
  },
  {
    path: '/app',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: '应用',
      show: true,
      icon: 'ri:apps-line',
    },
    redirect: '/app/prompt',
    children: [
      {
        path: 'prompt',
        name: 'promptIndex',
        component: () => import('@/views/app/prompt.vue'),
        meta: {
          title: '提示词',
          show: false,
        },
      },
      {
        path: 'knowledge',
        name: 'knowledgeIndex',
        component: () => import('@/views/app/knowledge.vue'),
        meta: {
          title: '知识库',
          show: false,
        },
      },
      {
        path: 'rag',
        name: 'ragIndex',
        component: () => import('@/views/app/rag.vue'),
        meta: {
          title: 'RAG应用',
          show: false,
        },
      }
    ],
  },
  {
    path: '/settings',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: '个人中心',
      show: false,
      icon: 'ri:user-settings-line',
    },
    children: [
      {
        path: 'apikey',
        name: 'apikeyIndex',
        component: () => import('@/views/settings/apikey.vue'),
        meta: {
          title: 'API Key管理',
          show: false,
        },
      },
      {
        path: 'usage',
        name: 'usageIndex',
        component: () => import('@/views/settings/usage.vue'),
        meta: {
          title: '用量信息',
          show: false,
        },
      },
      {
        path: 'bills',
        name: 'billsIndex',
        component: () => import('@/views/settings/bills.vue'),
        meta: {
          title: '账单信息',
          show: false,
        },
      },
      {
        path: 'invoice',
        name: 'invoiceIndex',
        component: () => import('@/views/settings/invoice.vue'),
        meta: {
          title: '发票管理',
          show: false,
        },
      },
      {
        path: 'about',
        name: 'aboutIndex',
        component: () => import('@/views/settings/about.vue'),
        meta: {
          title: '关于我们',
          show: false,
        },
      },
    ],
  },
  // 知识库详情页面
  {
    path: '/app/knowledge/:id',
    name: 'KnowledgeDetail',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: '知识库详情',
      show: false,
    },
    children: [
      {
        path: '',
        name: 'KnowledgeDetailContent',
        component: () => import('@/views/app/knowledge/detail.vue'),
        meta: {
          title: '知识库详情',
          show: false,
        },
      }
    ]
  },
  // 知识库搜索页面
  {
    path: '/app/knowledge/:id/search',
    name: 'KnowledgeSearch',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: '知识库搜索',
      show: false,
    },
    children: [
      {
        path: '',
        name: 'KnowledgeSearchContent',
        component: () => import('@/views/app/knowledge/search.vue'),
        meta: {
          title: '知识库搜索',
          show: false,
        },
      }
    ]
  },
  // RAG应用对话页面
  {
    path: '/app/rag/chat/:id',
    name: 'RagAppChat',
    component: () => import('@/layouts/layout.vue'),
    meta: {
      title: 'RAG应用',
      show: false,
    },
    children: [
      {
        path: '',
        name: 'RagAppChatContent',
        component: () => import('@/views/app/rag/chat.vue'),
        meta: {
          title: 'RAG应用对话',
          show: false,
        },
      }
    ]
  },
]

export default routes
