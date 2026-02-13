import request from '@/utils/request'

export const getPurchaseOrderList = (params) => {
    return request({
        url: '/canteen/purchase/orders',
        method: 'GET',
        params
    })
}

export const getPurchaseStatistics = () => {
    return request({
        url: '/canteen/purchase/statistics',
        method: 'GET'
    })
}

export const createPurchaseOrder = (data) => {
    return request({
        url: '/canteen/purchase/orders',
        method: 'POST',
        data
    })
}

export const getPurchaseOrderDetail = (id) => {
    return request({
        url: `/canteen/purchase/orders/${id}`,
        method: 'GET'
    })
}

export const approvePurchaseOrder = (id, data) => {
    return request({
        url: `/canteen/purchase/orders/${id}/approve`,
        method: 'POST',
        data
    })
}

export const completePurchase = (id, data) => {
    return request({
        url: `/canteen/purchase/orders/${id}/complete`,
        method: 'POST',
        data
    })
}

export const deletePurchaseOrder = (id) => {
    return request({
        url: `/canteen/purchase/orders/${id}`,
        method: 'DELETE'
    })
}
