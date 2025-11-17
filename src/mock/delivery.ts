import { faker } from '@faker-js/faker'
import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import area from '../components/PcasCascader/pcas-code.json'

// 运费模版
const deliveryList: any[] = []
for (let i = 0; i < 50; i++) {
  const address = []
  const p_index = faker.number.int(area.length - 1)
  address.push(area[p_index].name)
  const c_index = faker.number.int(area[p_index].children.length - 1)
  address.push(area[p_index].children[c_index].name)
  const a_index = faker.number.int(area[p_index].children[c_index].children.length - 1)
  address.push(area[p_index].children[c_index].children[a_index].name)
  deliveryList.push({
    id: i + 1,
    title: faker.color.human(),
    address,
    method: faker.number.int({ min: 1, max: 2 }),
    first_step: faker.number.int({ min: 1, max: 5 }),
    first_price: faker.number.int({ min: 1, max: 5 }),
    continued_step: faker.number.int({ min: 5, max: 10 }),
    continued_price: faker.number.int({ min: 5, max: 10 }),
    infos: [
      {
        list: ['43', '50'],
        first_step: faker.number.int({ min: 1, max: 5 }),
        first_price: faker.number.int({ min: 1, max: 5 }),
        continued_step: faker.number.int({ min: 5, max: 10 }),
        continued_price: faker.number.int({ min: 5, max: 10 }),
      },
    ],
    status: faker.datatype.boolean(),
  })
}

export default defineFakeRoute([
  {
    url: '/mock/delivery/list',
    method: 'get',
    response: ({ query }) => {
      const { title, from, limit } = query
      const list = deliveryList.filter((item) => {
        return title ? item.title.includes(title) : true
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
    url: '/mock/delivery/detail/',
    method: 'get',
    response: ({ query }) => {
      const info = deliveryList.filter(item => item.id === ~~query.id)
      return {
        error: '',
        status: 1,
        data: info[0],
      }
    },
  },
  {
    url: '/mock/delivery/create',
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
    url: '/mock/delivery/edit',
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
    url: '/mock/delivery/delete',
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
    url: '/mock/delivery/change/status',
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
])
