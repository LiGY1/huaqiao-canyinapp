import request from '@/utils/request'

export const educationApi = {
    getMaterials(data) {
        return request({
            url: '/school/education/materials',
            method: 'GET',
            data
        })
    },

    createMaterial(data) {
        return request({
            url: '/school/education/materials',
            method: 'POST',
            data
        })
    },

    updateMaterial(id, data) {
        return request({
            url: `/school/education/materials/${id}`,
            method: 'PUT',
            data
        })
    },

    deleteMaterial(id) {
        return request({
            url: `/school/education/materials/${id}`,
            method: 'DELETE'
        })
    },

    publishMaterial(id, data) {
        return request({
            url: `/school/education/materials/${id}/publish`,
            method: 'POST',
            data
        })
    },

    sendNotification(data) {
        return request({
            url: '/school/education/notifications',
            method: 'POST',
            data
        })
    },

    getNotifications(data) {
        return request({
            url: '/school/education/notifications',
            method: 'GET',
            data
        })
    },

    getNotificationDetail(id) {
        return request({
            url: `/school/education/notifications/${id}`,
            method: 'GET'
        })
    },

    deleteNotification(id) {
        return request({
            url: `/school/education/notifications/${id}`,
            method: 'DELETE'
        })
    },

    testWebhook(data) {
        return request({
            url: '/school/education/test-webhook',
            method: 'POST',
            data
        })
    }
}
