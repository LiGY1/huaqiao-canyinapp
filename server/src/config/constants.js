
const USER_ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  TEACHER: 'teacher',
  CANTEEN_ADMIN: 'canteen_admin',
};

const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack'
};

const DISH_CATEGORIES = {
  MEAT: 'meat',
  VEGETABLE: 'vegetable',
  MIXED: 'mixed',
  STAPLE: 'staple',
  SOUP: 'soup',
  DESSERT: 'dessert',
  BEVERAGE: 'beverage',
  SEASONAL: 'seasonal'
};

const PURCHASE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  PURCHASING: 'purchasing',
  RECEIVED: 'received',
  REJECTED: 'rejected'
};

const DISH_STATUS = {
  AVAILABLE: 1,
  UNAVAILABLE: 0,
  DELETED: -1
};

const HEALTH_STATUS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor'
};

module.exports = {
  USER_ROLES,
  ORDER_STATUS,
  MEAL_TYPES,
  DISH_CATEGORIES,
  PURCHASE_STATUS,
  DISH_STATUS,
  HEALTH_STATUS
};

