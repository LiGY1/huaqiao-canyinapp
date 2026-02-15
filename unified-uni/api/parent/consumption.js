import request from '@/utils/request.js'

export const consumptionApi = {
  getMealHistory(childId, data) {
    return request({
      url: `/parent/child/${childId}/meal-history`,
      method: 'GET',
      data
    })
  },

  getStoreHistory(data) {
    return request({
      url: '/parent/store-history',
      method: 'GET',
      data
    })
  },

  getConsumptionStats(data) {
    return request({
      url: '/parent/consumption-stats',
      method: 'GET',
      data
    })
  },

  exportConsumption(data) {
    return request({
      url: '/parent/export-consumption',
      method: 'GET',
      data,
      responseType: 'blob'
    })
  }
}
