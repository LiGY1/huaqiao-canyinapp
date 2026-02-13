import request from '@/utils/request'

export const foodSafetyApi = {
    getRecords(data) {
        return request({
            url: '/school/food-safety/records',
            method: 'GET',
            data
        })
    },

    addRecord(data) {
        return request({
            url: '/school/food-safety/records',
            method: 'POST',
            data
        })
    },

    getFreshnessMonitoring(data) {
        return request({
            url: '/school/food-safety/freshness',
            method: 'GET',
            data
        })
    },

    getPriceMonitoring(data) {
        return request({
            url: '/school/food-safety/price-monitoring',
            method: 'GET',
            data
        })
    }
}
