import request from '@/utils/request.js'

export const mealApi = {
    getMealList: (category = 'all') => {
        return request({
            url: '/parent/meals',
            method: 'GET',
            params: { category }
        })
    },

    getAIRecommendation: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    code: 200,
                    data: {
                        reason: '基于您今日的营养摄入情况，您还需要补充约500千卡热量、17克蛋白质和适量膳食纤维。以下是为您推荐的餐食搭配：',
                        recommendedMeals: [
                            { id: 2, name: '清蒸鲈鱼', category: '荤菜', price: 18, image: '/static/meal-fish.jpg', calories: 150, protein: 28, fat: 5, carbs: 2, fiber: 0, matchScore: 95 },
                            { id: 5, name: '炒青菜', category: '素菜', price: 6, image: '/static/meal-veg.jpg', calories: 80, protein: 3, fat: 5, carbs: 8, fiber: 4, matchScore: 88 },
                            { id: 7, name: '米饭', category: '主食', price: 2, image: '/static/meal-rice.jpg', calories: 200, protein: 4, fat: 1, carbs: 45, fiber: 1, matchScore: 90 },
                            { id: 9, name: '紫菜蛋花汤', category: '汤品', price: 5, image: '/static/meal-soup.jpg', calories: 60, protein: 5, fat: 3, carbs: 4, fiber: 1, matchScore: 85 }
                        ],
                        totalNutrition: {
                            calories: 490,
                            protein: 40,
                            fat: 14,
                            carbs: 59,
                            fiber: 6
                        }
                    }
                })
            }, 1200)
        })
    },

    submitOrder: (orderData) => {
        return request({
            url: '/parent/orders',
            method: 'POST',
            data: orderData
        })
    },

    getOrderHistory: (params) => {
        return request({
            url: '/parent/orders',
            method: 'GET',
            params
        })
    }
}
