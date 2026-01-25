# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## Order

**集合名称**: `orders`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| orderNumber | String | ✓ |  | ✓ | ✓ |  |
| user | ObjectId → User | ✓ |  |  |  |  |
| studentUser | ObjectId → User |  |  |  |  |  |
| items | Object |  | [Function] |  |  |  |
| items.dish | ObjectId → Dish | ✓ |  |  |  |  |
| items.dishName | String |  |  |  |  |  |
| items.dishCategory | String |  |  |  |  |  |
| items.dishImage | String |  |  |  |  |  |
| items.quantity | Number | ✓ |  |  |  |  |
| items.price | Number | ✓ |  |  |  |  |
| items.nutrition.calories | Number |  |  |  |  |  |
| items.nutrition.protein | Number |  |  |  |  |  |
| items.nutrition.fat | Number |  |  |  |  |  |
| items.nutrition.carbs | Number |  |  |  |  |  |
| items.nutrition.fiber | Number |  |  |  |  |  |
| items.nutrition.vitaminA | Number |  |  |  |  |  |
| items.nutrition.vitaminC | Number |  |  |  |  |  |
| items.nutrition.vitaminD | Number |  |  |  |  |  |
| items.nutrition.vitaminE | Number |  |  |  |  |  |
| items.nutrition.calcium | Number |  |  |  |  |  |
| items.nutrition.iron | Number |  |  |  |  |  |
| items.nutrition.zinc | Number |  |  |  |  |  |
| items.nutrition.sodium | Number |  |  |  |  |  |
| items.nutrition.potassium | Number |  |  |  |  |  |
| totalAmount | Number | ✓ |  |  |  |  |
| status | String |  | pending |  |  |  |
| mealType | String |  |  |  |  |  |
| orderDate | Date |  | [Function] |  |  |  |
| scheduledDate | Date |  |  |  |  |  |
| completedAt | Date |  |  |  |  |  |
| remark | String |  |  |  |  |  |
| location.campus | String |  | 主校区 |  |  | 校区 |
| location.canteen | String |  | 第一食堂 |  |  | 食堂 |
| location.floor | String |  | 1楼 |  |  | 楼层 |
| location.window | String |  | 1号窗口 |  |  | 窗口 |
| totalNutrition.calories | Number |  |  |  |  |  |
| totalNutrition.protein | Number |  |  |  |  |  |
| totalNutrition.fat | Number |  |  |  |  |  |
| totalNutrition.carbs | Number |  |  |  |  |  |
| totalNutrition.fiber | Number |  |  |  |  |  |
| totalNutrition.vitaminA | Number |  |  |  |  |  |
| totalNutrition.vitaminC | Number |  |  |  |  |  |
| totalNutrition.vitaminD | Number |  |  |  |  |  |
| totalNutrition.vitaminE | Number |  |  |  |  |  |
| totalNutrition.calcium | Number |  |  |  |  |  |
| totalNutrition.iron | Number |  |  |  |  |  |
| totalNutrition.zinc | Number |  |  |  |  |  |
| totalNutrition.sodium | Number |  |  |  |  |  |
| totalNutrition.potassium | Number |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| orderNumber_1 | {orderNumber:1} | unique, background |
| user_orderDate | {user:1,orderDate:-1} | background |
| orderDate_desc | {orderDate:-1} | background |
| user | {user:1} | background |
| mealType | {mealType:1} | background |
| user_mealType_orderDate | {user:1,mealType:1,orderDate:-1} | background |
| idx_status | {status:1} | - |
| studentUser_1 | {studentUser:1} | background |
| studentUser_1_orderDate_-1 | {studentUser:1,orderDate:-1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |
| studentUser | User | Reference |
| items.dish | Dish | Nested Reference |

---

