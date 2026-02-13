const PurchaseOrder = require('../../models/PurchaseOrder');
const Inventory = require('../../models/Inventory');
const { success, error, paginated } = require('../../utils/responseFormatter');
const { PURCHASE_STATUS } = require('../../config/constants');

exports.getPurchaseOrderList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await PurchaseOrder.countDocuments(filter);
    const orders = await PurchaseOrder.find(filter)
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    paginated(res, orders, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取采购单列表失败', 500);
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const { items, supplier, expectedDate, remark } = req.body;

    if (!items || items.length === 0) {
      return error(res, '采购单不能为空', 400);
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const ingredient = await Inventory.findById(item.ingredientId);
      if (ingredient) {
        item.ingredientName = ingredient.name;
      }

      const itemTotal = item.unitPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        ingredient: item.ingredientId,
        ingredientName: item.ingredientName,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      });
    }

    const purchaseOrder = await PurchaseOrder.create({
      items: orderItems,
      supplier,
      totalAmount,
      expectedDate,
      remark,
      requestedBy: req.user._id
    });

    success(res, purchaseOrder, '创建成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '创建采购单失败', 500);
  }
};

exports.approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, remark } = req.body;

    const order = await PurchaseOrder.findById(id);
    if (!order) {
      return error(res, '采购单不存在', 404);
    }

    order.status = approved ? PURCHASE_STATUS.APPROVED : PURCHASE_STATUS.REJECTED;
    order.approvedBy = req.user._id;
    order.approvalRemark = remark;

    await order.save();

    success(res, order, approved ? '审核通过' : '审核拒绝');
  } catch (err) {
    console.error(err);
    error(res, '审核失败', 500);
  }
};

exports.updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return error(res, '采购单不存在', 404);
    }

    success(res, order, '状态更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新状态失败', 500);
  }
};

exports.completePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualAmount, receiveDate, remark } = req.body;

    const order = await PurchaseOrder.findById(id).populate('items.ingredient');
    if (!order) {
      return error(res, '采购单不存在', 404);
    }

    for (const item of order.items) {
      if (item.ingredient) {
        const inventory = await Inventory.findById(item.ingredient);
        if (inventory) {
          inventory.quantity += item.quantity;
          inventory.lastStockIn = new Date();
          inventory.stockHistory.push({
            type: 'in',
            quantity: item.quantity,
            date: new Date(),
            operator: req.user.name,
            remark: `采购单: ${order.orderNumber}`
          });
          await inventory.save();
        }
      }
    }

    order.status = PURCHASE_STATUS.RECEIVED;
    order.actualAmount = actualAmount || order.totalAmount;
    order.receiveDate = receiveDate || new Date();
    order.remark = remark;

    await order.save();

    success(res, order, '采购完成');
  } catch (err) {
    console.error(err);
    error(res, '完成采购失败', 500);
  }
};

exports.getPurchaseOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await PurchaseOrder.findById(id)
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('items.ingredient', 'name unit');

    if (!order) {
      return error(res, '采购单不存在', 404);
    }

    success(res, order);
  } catch (err) {
    console.error(err);
    error(res, '获取采购单详情失败', 500);
  }
};

exports.deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await PurchaseOrder.findById(id);
    if (!order) {
      return error(res, '采购单不存在', 404);
    }

    if (order.status !== PURCHASE_STATUS.PENDING) {
      return error(res, '只能删除待审核的采购单', 400);
    }

    await PurchaseOrder.findByIdAndDelete(id);
    success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    error(res, '删除采购单失败', 500);
  }
};

exports.getPurchaseStatistics = async (req, res) => {
  try {
    const orders = await PurchaseOrder.find();

    const statistics = {
      total: orders.length,
      pending: 0,
      approved: 0,
      purchasing: 0,
      received: 0,
      rejected: 0,
      totalAmount: 0,
      monthlyAmount: 0
    };

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    orders.forEach(order => {

      if (order.status === PURCHASE_STATUS.PENDING) statistics.pending++;
      else if (order.status === PURCHASE_STATUS.APPROVED) statistics.approved++;
      else if (order.status === PURCHASE_STATUS.PURCHASING) statistics.purchasing++;
      else if (order.status === PURCHASE_STATUS.RECEIVED) statistics.received++;
      else if (order.status === PURCHASE_STATUS.REJECTED) statistics.rejected++;

      if (order.status !== PURCHASE_STATUS.REJECTED) {
        statistics.totalAmount += order.totalAmount;
      }

      const orderDate = new Date(order.createdAt);
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
        statistics.monthlyAmount += order.totalAmount;
      }
    });

    success(res, statistics);
  } catch (err) {
    console.error(err);
    error(res, '获取统计数据失败', 500);
  }
};

