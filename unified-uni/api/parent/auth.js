import request from '@/utils/request'

export const authApi = {
    login: (data) => {
        return request({
            url: '/parent/auth/login',
            method: 'POST',
            data
        })
    },

    register: (data) => {
        return request({
            url: '/parent/auth/register',
            method: 'POST',
            data
        })
    },

    getUserInfo: () => {
        return request({
            url: '/parent/auth/info',
            method: 'GET'
        })
    },

    bindChild: (data) => {
        return request({
            url: '/parent/auth/bind-child',
            method: 'POST',
            data
        })
    },

    getReminderSettings: () => {
        return request({
            url: '/parent/auth/reminder-settings',
            method: 'GET'
        })
    },

    saveReminderSettings: (data) => {
        return request({
            url: '/parent/auth/reminder-settings',
            method: 'POST',
            data
        })
    },

    verifyStudent: (studentId) => {
        return request({
            url: '/student/verify-student-id',
            method: 'POST',
            data: { studentId }
        })
    },

    unbindChild: (childId) => {
        return request({
            url: '/parent/auth/unbind-child',
            method: 'POST',
            data: { childId }
        })
    }
}
