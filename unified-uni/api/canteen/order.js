import request from '@/utils/request'

export const getOrderList = (params) => {
    return request({
        url: '/canteen/orders',
        method: 'GET',
        params
    })
}

export const getOrderDetail = (id) => {
    return request({
        url: `/canteen/orders/${id}`,
        method: 'GET'
    })
}

export const updateOrderStatus = (id, status) => {
    return request({
        url: `/canteen/orders/${id}/status`,
        method: 'PATCH',
        data: { status }
    })
}

export const refundOrder = (id, data) => {
    return request({
        url: `/canteen/orders/${id}/refund`,
        method: 'POST',
        data
    })
}

export const getOrderStatistics = (params) => {
    return request({
        url: '/canteen/orders/statistics',
        method: 'GET',
        params
    })
}
