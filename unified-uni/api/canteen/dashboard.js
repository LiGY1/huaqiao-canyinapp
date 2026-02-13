import request from '@/utils/request'

export const getDashboardStats = (params) => {
    return request({
        url: '/canteen/dashboard/stats',
        method: 'GET',
        params
    })
}

export const getSalesTrend = (params) => {
    return request({
        url: '/canteen/dashboard/sales-trend',
        method: 'GET',
        params
    })
}

export const getTopDishes = (params) => {
    return request({
        url: '/canteen/dashboard/top-dishes',
        method: 'GET',
        params
    })
}

export const getInventoryWarnings = () => {
    return request({
        url: '/canteen/dashboard/inventory-warnings',
        method: 'GET'
    })
}
