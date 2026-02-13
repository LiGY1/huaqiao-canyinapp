import request from '@/utils/request.js'

export const consumptionApi = {
    getMealHistory(childId, params) {
        return request({
            url: `/parent/child/${childId}/meal-history`,
            method: 'GET',
            params
        })
    },

    getStoreHistory(params) {
        return request({
            url: '/parent/store-history',
            method: 'GET',
            params
        })
    },

    getConsumptionStats(params) {
        return request({
            url: '/parent/consumption-stats',
            method: 'GET',
            params
        })
    },

    exportConsumption(params) {
        return request({
            url: '/parent/export-consumption',
            method: 'GET',
            params,
            responseType: 'blob'
        })
    }
}
