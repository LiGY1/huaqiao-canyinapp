import request from '@/utils/request'

export const studentApi = {
    getHealthData(data) {
        return request({
            url: '/school/student/health',
            method: 'GET',
            data
        })
    },

    getMealRecords(data) {
        return request({
            url: '/school/student/meals',
            method: 'GET',
            data
        })
    },

    getNutritionData(data) {
        return request({
            url: '/school/student/nutrition',
            method: 'GET',
            data
        })
    },

    getPhysicalExams(data) {
        return request({
            url: '/school/student/physical-exams',
            method: 'GET',
            data
        })
    },

    getStudentList(data) {
        return request({
            url: '/school/student/list',
            method: 'GET',
            data
        })
    },

    getClassStudentList(data) {
        return request({
            url: '/school/student/list',
            method: 'GET',
            data
        })
    },

    getStudentDetail(studentId) {
        return request({
            url: `/school/student/${studentId}`,
            method: 'GET'
        })
    },

    getClassStudents(classId) {
        return request({
            url: '/school/student/list',
            method: 'GET',
            data: { class: classId }
        })
    },

    generateClassHealthReport(data) {
        return request({
            url: '/school/student/health-report',
            method: 'POST',
            data
        })
    },

    getHealthReportHistory(data) {
        return request({
            url: '/school/student/health-reports',
            method: 'GET',
            data
        })
    },

    getHealthReportById(reportId) {
        return request({
            url: `/school/student/health-reports/${reportId}`,
            method: 'GET'
        })
    },

    saveChatHistory(data) {
        return request({
            url: '/school/ai-chat/save',
            method: 'POST',
            data
        })
    },

    getChatHistory(data) {
        return request({
            url: '/school/ai-chat/history',
            method: 'GET',
            data
        })
    }
}
