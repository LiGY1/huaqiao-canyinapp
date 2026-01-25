const Favorite = require('../../models/Favorite');
const Dish = require('../../models/Dish');
const { success, error } = require('../../utils/responseFormatter');

exports.getFavorites = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const skip = (page - 1) * pageSize;

    const favorites = await Favorite.find({ user: req.user._id })
      .populate('dish')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize));

    const total = await Favorite.countDocuments({ user: req.user._id });

    const validFavorites = favorites.filter(f => f.dish).map(f => ({
      id: f._id,
      dish: {
        id: f.dish._id,
        name: f.dish.name,
        category: f.dish.category,
        price: f.dish.price,
        image: f.dish.image,
        nutrition: f.dish.nutrition,
        description: f.dish.description
      },
      createdAt: f.createdAt
    }));

    success(res, {
      favorites: validFavorites,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    console.error(err);
    error(res, '获取收藏列表失败', 500);
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const { dishId } = req.body;

    if (!dishId) {
      return error(res, '请提供菜品ID', 400);
    }

    const dish = await Dish.findById(dishId);
    if (!dish) {
      return error(res, '菜品不存在', 404);
    }

    const existing = await Favorite.findOne({
      user: req.user._id,
      dish: dishId
    });

    if (existing) {
      return error(res, '已收藏该菜品', 400);
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      dish: dishId
    });

    success(res, {
      id: favorite._id,
      message: '收藏成功'
    }, '收藏成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '收藏失败', 500);
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { dishId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      dish: dishId
    });

    if (!favorite) {
      return error(res, '未找到该收藏', 404);
    }

    success(res, null, '取消收藏成功');
  } catch (err) {
    console.error(err);
    error(res, '取消收藏失败', 500);
  }
};

exports.checkFavorite = async (req, res) => {
  try {
    const { dishId } = req.params;

    const favorite = await Favorite.findOne({
      user: req.user._id,
      dish: dishId
    });

    success(res, {
      isFavorite: !!favorite
    });
  } catch (err) {
    console.error(err);
    error(res, '检查收藏状态失败', 500);
  }
};

