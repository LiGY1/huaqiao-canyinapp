const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// 路由测试接口
const authController = require('../controllers/canteen/authController');
const dashboardController = require('../controllers/canteen/dashboardController');
const menuController = require('../controllers/canteen/menuController');
const inventoryController = require('../controllers/canteen/inventoryController');
const orderController = require('../controllers/canteen/orderController');
const purchaseController = require('../controllers/canteen/purchaseController');
const productionController = require('../controllers/canteen/productionController');
const uploadController = require('../controllers/canteen/uploadController');
const solarTermController = require('../controllers/canteen/solarTermController');

router.post('/auth/login', authController.login);
router.post('/auth/logout', protect, authController.logout);
router.get('/auth/info', protect, authController.getUserInfo);
router.put('/auth/info', protect, authController.updateUserInfo);
router.post('/auth/change-password', protect, authController.changePassword);
router.get('/auth/statistics', protect, authController.getWorkStatistics);

router.get('/dashboard/sales', protect, dashboardController.getSalesData);
router.get('/dashboard/inventory', protect, dashboardController.getInventoryData);
router.get('/dashboard/production-suggestions', protect, dashboardController.getProductionSuggestions);
router.get('/dashboard/seasonal-recommendations', protect, dashboardController.getSeasonalRecommendations);
router.get('/dashboard/purchase-plan', protect, dashboardController.getPurchasePlan);
router.get('/dashboard/nutrition-analysis', protect, dashboardController.getNutritionAnalysis);

router.get('/menu', protect, menuController.getDishList);
router.post('/menu', protect, menuController.addDish);
router.put('/menu/:id', protect, menuController.updateDish);
router.delete('/menu/:id', protect, menuController.deleteDish);
router.patch('/menu/:id/status', protect, menuController.updateDishStatus);

router.get('/inventory/statistics', protect, inventoryController.getStatistics);
router.get('/inventory/:id/history', protect, inventoryController.getInventoryHistory);
router.get('/inventory', protect, inventoryController.getInventoryList);
router.post('/inventory', protect, inventoryController.addInventoryItem);
router.put('/inventory/:id', protect, inventoryController.updateInventoryItem);
router.delete('/inventory/:id', protect, inventoryController.deleteInventoryItem);
router.post('/inventory/:id/stock-in', protect, inventoryController.stockIn);
router.post('/inventory/:id/stock-out', protect, inventoryController.stockOut);

router.get('/orders', protect, orderController.getOrderList);
router.get('/orders/statistics', protect, orderController.getOrderStatistics);
router.post('/orders/batch-update', protect, orderController.batchUpdateOrders);
router.get('/orders/:id', protect, orderController.getOrderDetail);
router.patch('/orders/:id/status', protect, orderController.updateOrderStatus);

router.get('/purchase/statistics', protect, purchaseController.getPurchaseStatistics);
router.get('/purchase/:id', protect, purchaseController.getPurchaseOrderDetail);
router.get('/purchase', protect, purchaseController.getPurchaseOrderList);
router.post('/purchase', protect, purchaseController.createPurchaseOrder);
router.delete('/purchase/:id', protect, purchaseController.deletePurchaseOrder);
router.post('/purchase/:id/approve', protect, purchaseController.approvePurchaseOrder);
router.patch('/purchase/:id/status', protect, purchaseController.updatePurchaseOrderStatus);
router.post('/purchase/:id/complete', protect, purchaseController.completePurchase);

router.get('/production/statistics', protect, productionController.getProductionStatistics);
router.get('/production/ai-suggestions', protect, productionController.getAISuggestions);
router.get('/production/:id', protect, productionController.getProductionPlanDetail);
router.get('/production', protect, productionController.getProductionPlanList);
router.post('/production', protect, productionController.createProductionPlan);
router.put('/production/:id', protect, productionController.updateProductionPlan);
router.delete('/production/:id', protect, productionController.deleteProductionPlan);
router.post('/production/:id/start', protect, productionController.startProduction);
router.post('/production/:id/progress', protect, productionController.updateProgress);
router.post('/production/:id/complete', protect, productionController.completeProduction);

router.post('/upload', protect, upload.single('image'), uploadController.uploadImage);
router.post('/upload/multiple', protect, upload.array('images', 10), uploadController.uploadMultipleImages);

router.get('/solar-term/current', protect, solarTermController.getCurrentSolarTerm);
router.post('/solar-term/ai-recommend', protect, solarTermController.getAIRecommendations);
router.post('/solar-term/add-dish', protect, solarTermController.addSeasonalDish);
router.post('/solar-term/push-dingtalk', protect, solarTermController.pushToDingTalk);
router.get('/solar-term/dishes', protect, solarTermController.getSeasonalDishes);
router.delete('/solar-term/dish/:dishId', protect, solarTermController.removeSeasonalDish);

module.exports = router;

