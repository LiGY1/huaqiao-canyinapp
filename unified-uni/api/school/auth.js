import request from '@/utils/request'

export const authApi = {
    login(data) {
        return request({
            url: '/school/auth/login',
            method: 'POST',
            data
        })
    },

    logout() {
        return request({
            url: '/school/auth/logout',
            method: 'POST'
        })
    },

    getUserInfo() {
        return request({
            url: '/school/auth/userinfo',
            method: 'GET'
        })
    },

    changePassword(data) {
        return request({
            url: '/school/auth/change-password',
            method: 'POST',
            data
        })
    },

    updateProfile(data) {
        return request({
            url: '/school/auth/profile',
            method: 'PUT',
            data
        })
    }
}
