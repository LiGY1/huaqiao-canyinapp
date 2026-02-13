import request from '@/utils/request'

export const nutritionApi = {
    getChildNutrition: (childId) => {
        return request({
            url: `/parent/child/${childId}/nutrition`,
            method: 'GET'
        })
    },

    getChildWeeklyReport: (childId) => {
        return request({
            url: `/parent/child/${childId}/weekly-report`,
            method: 'GET'
        })
    },

    getChildMealHistory: (childId, data) => {
        return request({
            url: `/parent/child/${childId}/meal-history`,
            method: 'GET',
            data
        })
    },

    getChildPhysicalExams: (childId) => {
        return request({
            url: `/parent/child/${childId}/physical-exams`,
            method: 'GET'
        })
    }
}
