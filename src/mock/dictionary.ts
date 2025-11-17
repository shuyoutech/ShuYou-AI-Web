import { defineFakeRoute } from 'vite-plugin-fake-server/client'

// 字典
const dictionaryList = [
  {
    id: 1,
    label: '这是一个超级超级超级超级长的字典标题',
    code: 'test',
    items: [
      {
        id: 1,
        name: '测试',
        value: '1',
        enable: true,
      },
    ],
  },
  {
    id: 2,
    label: '性别',
    code: 'sex',
    items: [
      {
        id: 2,
        name: '女',
        value: '0',
        enable: true,
      },
      {
        id: 3,
        name: '男',
        value: '1',
        enable: true,
      },
      {
        id: 4,
        name: '保密',
        value: '2',
        enable: true,
      },
    ],
  },
  {
    id: 3,
    label: '用户',
    code: 'user',
    items: [],
    children: [
      {
        id: 4,
        label: '证件',
        code: 'user_card',
        items: [
          {
            id: 5,
            name: '居民身份证',
            value: '1',
            enable: true,
          },
          {
            id: 6,
            name: '出生证',
            value: '2',
            enable: false,
          },
          {
            id: 7,
            name: '护照',
            value: '3',
            enable: true,
          },
        ],
      },
      {
        id: 5,
        label: '学历',
        code: 'user_education',
        items: [
          {
            id: 8,
            name: '初中及以下',
            value: '1',
            enable: true,
          },
          {
            id: 9,
            name: '高中',
            value: '2',
            enable: true,
          },
          {
            id: 10,
            name: '大学',
            value: '3',
            enable: true,
          },
        ],
      },
    ],
  },
]

export default defineFakeRoute([
  {
    url: '/mock/dictionary/list',
    method: 'get',
    response: () => {
      function getDictionaryTree(list: any[]) {
        const tree = []
        for (const i in list) {
          const item: Record<string, any> = {
            id: list[i].id,
            label: list[i].label,
            code: list[i].code,
          }
          if (list[i].children) {
            item.children = getDictionaryTree(list[i].children)
          }
          tree.push(item)
        }
        return tree
      }
      const pageList = getDictionaryTree(dictionaryList)
      return {
        error: '',
        status: 1,
        data: pageList,
      }
    },
  },
  {
    url: '/mock/dictionary/detail/',
    method: 'get',
    response: ({ query }) => {
      function findDictionary(list: any, parentId: number | '', id: number): any {
        for (const i in list) {
          if (list[i].id === id) {
            return {
              parentId,
              id: list[i].id,
              name: list[i].label,
              code: list[i].code,
            }
          }
          else if (list[i].children) {
            const temp = findDictionary(list[i].children, list[i].id, id)
            if (temp) {
              return temp
            }
          }
        }
      }
      const info = findDictionary(dictionaryList, '', ~~query.id)
      return {
        error: '',
        status: 1,
        data: info,
      }
    },
  },
  {
    url: '/mock/dictionary/create',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/edit',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/delete',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/item/list',
    method: 'get',
    response: ({ query }) => {
      const { dictionary_id, title, from, limit } = query
      function findDictionary(list: any, dictionary_id: number): any {
        for (const i in list) {
          if (list[i].id === dictionary_id) {
            return list[i].items ?? []
          }
          if (list[i].children) {
            return findDictionary(list[i].children, dictionary_id)
          }
        }
      }
      let list: any[] = findDictionary(dictionaryList, ~~dictionary_id) ?? []
      list = list.filter((item) => {
        return title ? item.name.includes(title) : true
      })
      const pageList = list.filter((_item, index) => {
        return index >= ~~from && index < (~~from + ~~limit)
      })
      return {
        error: '',
        status: 1,
        data: {
          list: pageList,
          total: list.length,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/item/detail/',
    method: 'get',
    response: ({ query }) => {
      function findDictionaryItem(list: any, id: number): any {
        for (const i in list) {
          if (list[i].items.some((item: any) => item.id === id)) {
            return list[i].items.find((item: any) => item.id === id)
          }
          if (list[i].children) {
            return findDictionaryItem(list[i].children, id)
          }
        }
      }
      const info = findDictionaryItem(dictionaryList, ~~query.id)
      return {
        error: '',
        status: 1,
        data: info,
      }
    },
  },
  {
    url: '/mock/dictionary/item/create',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/item/edit',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/item/delete',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/item/change/enable',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
  {
    url: '/mock/dictionary/get',
    method: 'get',
    response: ({ query }) => {
      const { code } = query
      // 获取所有字典数据
      function getAllDictionaryItems(list: any[]): any[] {
        const allItems: any[] = []
        for (const item of list) {
          if (item.items && item.items.length > 0) {
            allItems.push(...item.items)
          }
          if (item.children) {
            allItems.push(...getAllDictionaryItems(item.children))
          }
        }
        return allItems
      }
      // 获取指定字典数据
      function findDictionary(list: any, code: string): any {
        for (const i in list) {
          if (list[i].code === code) {
            return list[i].items ?? []
          }
          if (list[i].children) {
            return findDictionary(list[i].children, code)
          }
        }
      }
      let list: any[] = []
      if (code) {
        list = findDictionary(dictionaryList, code as string) ?? []
      }
      else {
        list = getAllDictionaryItems(dictionaryList)
      }
      list = list.filter(item => item.enable)
      list = list.map(item => ({
        name: item.name,
        value: item.value,
      }))
      return {
        error: '',
        status: 1,
        data: {
          list,
        },
      }
    },
  },
])
