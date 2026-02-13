const CART_STORAGE_KEY = "cartItems";
class Cart {
  constructor() {
    this.items = uni.getStorageSync(CART_STORAGE_KEY) || [];
  }
  // 添加商品到购物车
  addItem(item) {
    const existingItemIndex = this.items.findIndex((cartItem) => cartItem.id === item.id);

    if (existingItemIndex !== -1) {
      // 商品已存在，增加数量
      this.items[existingItemIndex].quantity += 1;
    } else {
      // 新商品，添加到购物车
      this.items.push({
        ...item,
        quantity: 1,
      });
    }

    this.save();
  }

  // 从购物车移除商品
  removeItem(itemId) {
    this.items = this.items.filter((item) => item.id !== itemId);
    this.save();
  }

  // 更新商品数量
  updateQuantity(itemId, quantity) {
    const item = this.items.find((item) => item.id === itemId);
    if (item) {
      item.quantity = quantity;
      this.save();
    }
  }

  // 清空购物车
  clearCart() {
    this.items = [];
    this.save();
  }

  // 获取购物车中的商品总数
  get totalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // 获取购物车总金额
  get totalPrice() {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }
  // 保存购物车数据到本地存储
  save() {
    // -----------------

    uni.setStorageSync(CART_STORAGE_KEY, this.items);

    // -------------------
  }
  // 获取购物车数据
  getItems() {
    return this.items;
  }
}
export default new Cart();
