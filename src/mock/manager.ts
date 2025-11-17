import { faker } from '@faker-js/faker/locale/zh_CN'
import { defineFakeRoute } from 'vite-plugin-fake-server/client'

// 管理员
const managerList: any[] = []
for (let i = 0; i < 50; i++) {
  managerList.push({
    id: i + 1,
    account: faker.person.firstName(),
    name: faker.person.fullName(),
    sex: faker.number.int(2),
    mobile: faker.phone.number({ style: 'international' }),
    status: faker.datatype.boolean(),
  })
}

export default defineFakeRoute([
  {
    url: '/mock/manager/list',
    method: 'get',
    response: ({ query }) => {
      const { account, name, mobile, sex, from, limit } = query
      let list = managerList.filter((item) => {
        return account ? item.account.includes(account) : true
      })
      list = list.filter((item) => {
        return name ? item.name.includes(name) : true
      })
      list = list.filter((item) => {
        return mobile ? item.mobile === mobile : true
      })
      list = list.filter((item) => {
        return sex ? item.sex === ~~sex : true
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
    url: '/mock/manager/detail/',
    method: 'get',
    response: ({ query }) => {
      const info = managerList.filter(item => item.id === ~~query.id)
      return {
        error: '',
        status: 1,
        data: info[0],
      }
    },
  },
  {
    url: '/mock/manager/create',
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
    url: '/mock/manager/edit',
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
    url: '/mock/manager/delete',
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
    url: '/mock/manager/password/reset',
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
    url: '/mock/manager/change/status',
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
    url: '/mock/manager/check',
    method: 'post',
    response: ({ body }) => {
      const { key, value, id } = body
      let exist = false
      exist = managerList.some((item) => {
        let flag
        switch (key) {
          case 'account':
            if (item.account === value && (id ? id !== item.id : true)) {
              flag = true
            }
            break
          case 'mobile':
            if (item.mobile === value && (id ? id !== item.id : true)) {
              flag = true
            }
            break
        }
        return flag
      })
      return {
        error: '',
        status: 1,
        data: {
          exist,
        },
      }
    },
  },
])
