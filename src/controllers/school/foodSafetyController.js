const FoodSafetyRecord = require('../../models/FoodSafetyRecord');
const Inventory = require('../../models/Inventory');
const { success, error, paginated } = require('../../utils/responseFormatter');

exports.getRecords = async (req, res) => {
  try {
    const { type, page = 1, pageSize = 10, startDate, endDate } = req.query;

    const filter = {};
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const total = await FoodSafetyRecord.countDocuments(filter);
    const records = await FoodSafetyRecord.find(filter)
      .populate('ingredient', 'name')
      .sort({ date: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    paginated(res, records, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取安全记录失败', 500);
  }
};

exports.addRecord = async (req, res) => {
  try {
    const recordData = {
      ...req.body,
      inspector: req.user.name
    };

    const record = await FoodSafetyRecord.create(recordData);

    success(res, record, '添加成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '添加记录失败', 500);
  }
};

exports.getFreshnessMonitoring = async (req, res) => {
  try {
    const ingredients = await Inventory.find();

    const monitoringData = ingredients.map(item => {
      const daysSinceStockIn = item.lastStockIn
        ? Math.floor((Date.now() - item.lastStockIn.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let freshness = 'excellent';
      if (daysSinceStockIn > 7) freshness = 'poor';
      else if (daysSinceStockIn > 3) freshness = 'fair';
      else if (daysSinceStockIn > 1) freshness = 'good';

      return {
        id: item._id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        temperature: 4,
        storageTime: daysSinceStockIn,
        expiryDate: item.expiryDate,
        freshness,
        score: freshness === 'excellent' ? 95 : freshness === 'good' ? 80 : freshness === 'fair' ? 60 : 40
      };
    });

    success(res, monitoringData);
  } catch (err) {
    console.error(err);
    error(res, '获取新鲜度监控失败', 500);
  }
};

exports.getPriceMonitoring = async (req, res) => {
  try {
    const ingredients = await Inventory.find();

    const priceData = ingredients.map(item => ({
      id: item._id,
      name: item.name,
      currentPrice: item.unitPrice,
      unit: item.unit,

      marketAverage: item.unitPrice * (0.9 + Math.random() * 0.2),
      priceHistory: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: item.unitPrice * (0.95 + Math.random() * 0.1)
      }))
    }));

    success(res, priceData);
  } catch (err) {
    console.error(err);
    error(res, '获取价格监控失败', 500);
  }
};

