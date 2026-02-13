import request from '@/utils/request'

export const getInventoryList = (params) => {
    return request({
        url: '/canteen/inventory',
        method: 'GET',
        params
    })
}

export const getStatistics = () => {
    return request({
        url: '/canteen/inventory/statistics',
        method: 'GET'
    })
}

export const addInventoryItem = (data) => {
    return request({
        url: '/canteen/inventory',
        method: 'POST',
        data
    })
}

export const updateInventoryItem = (id, data) => {
    return request({
        url: `/canteen/inventory/${id}`,
        method: 'PUT',
        data
    })
}

export const deleteInventoryItem = (id) => {
    return request({
        url: `/canteen/inventory/${id}`,
        method: 'DELETE'
    })
}

export const stockIn = (id, data) => {
    return request({
        url: `/canteen/inventory/${id}/stock-in`,
        method: 'POST',
        data
    })
}

export const stockOut = (id, data) => {
    return request({
        url: `/canteen/inventory/${id}/stock-out`,
        method: 'POST',
        data
    })
}

export const getInventoryHistory = (id, params) => {
    return request({
        url: `/canteen/inventory/${id}/history`,
        method: 'GET',
        params
    })
}
