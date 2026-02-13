import request from '@/utils/request'

export function login(data) {
    return request({
        url: '/canteen/auth/login',
        method: 'POST',
        data
    })
}

export function logout() {
    return request({
        url: '/canteen/auth/logout',
        method: 'POST'
    })
}

export function getUserInfo() {
    return request({
        url: '/canteen/auth/userinfo',
        method: 'GET'
    })
}

export function updateProfile(data) {
    return request({
        url: '/canteen/auth/profile',
        method: 'PUT',
        data
    })
}

export function changePassword(data) {
    return request({
        url: '/canteen/auth/change-password',
        method: 'POST',
        data
    })
}

export function getWorkStatistics() {
    return request({
        url: '/canteen/auth/work-statistics',
        method: 'GET'
    })
}
