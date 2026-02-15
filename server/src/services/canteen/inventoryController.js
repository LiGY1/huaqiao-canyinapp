const Inventory = require('../../models/Inventory');
const { success, error, paginated } = require('../../utils/responseFormatter');

exports.getInventoryList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, keyword } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (keyword) {
      filter.name = new RegExp(keyword, 'i');
    }

    const total = await Inventory.countDocuments(filter);
    const inventory = await Inventory.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    const inventoryWithComputed = inventory.map(item => ({
      ...item.toObject(),
      totalValue: item.quantity * item.unitPrice,
      isLow: item.quantity <= item.warningLevel
    }));

    paginated(res, inventoryWithComputed, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取库存列表失败', 500);
  }
};

exports.addInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    success(res, item, '添加成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '添加库存失败', 500);
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return error(res, '库存项不存在', 404);
    }

    success(res, item, '更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新库存失败', 500);
  }
};

exports.stockIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, supplier, unitPrice, remark } = req.body;

    const item = await Inventory.findById(id);
    if (!item) {
      return error(res, '库存项不存在', 404);
    }

    item.quantity += quantity;
    item.lastStockIn = new Date();
    if (supplier) item.supplier = supplier;
    if (unitPrice) item.unitPrice = unitPrice;

    item.stockHistory.push({
      type: 'in',
      quantity,
      date: new Date(),
      operator: req.user.name,
      remark
    });

    await item.save();

    success(res, item, '入库成功');
  } catch (err) {
    console.error(err);
    error(res, '入库失败', 500);
  }
};

exports.stockOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, usage, remark } = req.body;

    const item = await Inventory.findById(id);
    if (!item) {
      return error(res, '库存项不存在', 404);
    }

    if (item.quantity < quantity) {
      return error(res, '库存不足', 400);
    }

    item.quantity -= quantity;

    item.stockHistory.push({
      type: 'out',
      quantity,
      date: new Date(),
      operator: req.user.name,
      remark: usage || remark
    });

    await item.save();

    success(res, item, '出库成功');
  } catch (err) {
    console.error(err);
    error(res, '出库失败', 500);
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await Inventory.findByIdAndDelete(id);
    if (!item) {
      return error(res, '库存项不存在', 404);
    }

    success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    error(res, '删除库存失败', 500);
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const inventory = await Inventory.find();

    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const warningCount = inventory.filter(item => item.quantity <= item.warningLevel).length;
    const categoryStats = {};

    inventory.forEach(item => {
      if (!categoryStats[item.category]) {
        categoryStats[item.category] = {
          count: 0,
          totalValue: 0,
          items: []
        };
      }
      categoryStats[item.category].count++;
      categoryStats[item.category].totalValue += item.quantity * item.unitPrice;
      categoryStats[item.category].items.push(item.name);
    });

    success(res, {
      totalValue: Math.round(totalValue * 100) / 100,
      warningCount,
      totalItems: inventory.length,
      categoryStats
    });
  } catch (err) {
    console.error(err);
    error(res, '获取统计数据失败', 500);
  }
};

exports.getInventoryHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10 } = req.query;

    const item = await Inventory.findById(id);
    if (!item) {
      return error(res, '库存项不存在', 404);
    }

    const history = item.stockHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = history.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + parseInt(pageSize);
    const paginatedHistory = history.slice(startIndex, endIndex);

    paginated(res, paginatedHistory, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取历史记录失败', 500);
  }
};

