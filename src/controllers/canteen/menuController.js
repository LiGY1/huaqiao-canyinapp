const Dish = require('../../models/Dish');
const { success, error, paginated } = require('../../utils/responseFormatter');
const { DISH_STATUS } = require('../../config/constants');

exports.getDishList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, category, keyword } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (keyword) {
      filter.name = new RegExp(keyword, 'i');
    }

    const total = await Dish.countDocuments(filter);
    const dishes = await Dish.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    paginated(res, dishes, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取菜品列表失败', 500);
  }
};

exports.addDish = async (req, res) => {
  try {
    const dish = await Dish.create(req.body);
    success(res, dish, '添加成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '添加菜品失败', 500);
  }
};

exports.updateDish = async (req, res) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!dish) {
      return error(res, '菜品不存在', 404);
    }

    success(res, dish, '更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新菜品失败', 500);
  }
};

exports.deleteDish = async (req, res) => {
  try {
    const { id } = req.params;

    const dish = await Dish.findByIdAndDelete(id);

    if (!dish) {
      return error(res, '菜品不存在', 404);
    }

    success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    error(res, '删除菜品失败', 500);
  }
};

exports.updateDishStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const dish = await Dish.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!dish) {
      return error(res, '菜品不存在', 404);
    }

    success(res, dish, '状态更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新状态失败', 500);
  }
};

