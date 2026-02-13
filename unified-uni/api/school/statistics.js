import request from '@/utils/request'

export const statisticsApi = {
    getDashboardStats(data) {
        return request({
            url: '/school/statistics/dashboard',
            method: 'GET',
            data
        })
    },

    getClassStats(classId, data) {
        return request({
            url: `/school/statistics/class/${classId}`,
            method: 'GET',
            data
        })
    },

    getTeacherClasses() {
        return request({
            url: '/school/statistics/teacher-classes',
            method: 'GET'
        })
    },

    getTodayOverview(data) {
        return request({
            url: '/school/statistics/today-overview',
            method: 'GET',
            data
        })
    },

    getWeeklyComparison(data) {
        return request({
            url: '/school/statistics/weekly-comparison',
            method: 'GET',
            data
        })
    },

    getStudentWeeklyNutrition(data) {
        return request({
            url: '/school/statistics/student-weekly-nutrition',
            method: 'GET',
            data
        })
    }
}
