import request from '@/utils/request'

export const childApi = {
  getChildNutrition: (childId) => {
    return request({
      url: `/parent/child/${childId}/nutrition`,
      method: 'GET'
    })
  },

  getMealHistory: (childId, data) => {
    console.log(data);

    return request({
      url: `/parent/child/${childId}/meal-history`,
      method: 'GET',
      data
    })
  },

  getWeeklyReport: (childId) => {
    return request({
      url: `/parent/child/${childId}/weekly-report`,
      method: 'GET'
    })
  },

  getPhysicalExams: (childId) => {
    return request({
      url: `/parent/child/${childId}/physical-exams`,
      method: 'GET'
    })
  },

  generateChildAIReport: (childId, data = {}) => {
    return request({
      url: `/parent/child/${childId}/ai-report`,
      method: 'POST',
      data,
      timeout: 120000
    })
  },

  getChildAIReports: (childId, data) => {
    return request({
      url: `/parent/child/${childId}/ai-reports`,
      method: 'GET',
      data
    })
  }
}
