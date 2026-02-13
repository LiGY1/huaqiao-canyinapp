# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## ProductionPlan

**集合名称**: `productionplans`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| dish | ObjectId → Dish | ✓ |  |  |  |  |
| dishName | String |  |  |  |  |  |
| dishCategory | String |  |  |  |  |  |
| dishImage | String |  |  |  |  |  |
| date | Date | ✓ |  |  |  |  |
| mealType | String | ✓ |  |  |  |  |
| plannedQuantity | Number | ✓ |  |  |  |  |
| completedQuantity | Number |  | 0 |  |  |  |
| status | String |  | pending |  |  |  |
| chef | String |  |  |  |  | 负责厨师 |
| startTime | Date |  |  |  |  |  |
| completedTime | Date |  |  |  |  |  |
| remark | String |  |  |  |  |  |
| aiSuggested | Boolean |  | false |  |  |  |
| suggestedReason | String |  |  |  |  |  |
| usedIngredients | Object |  | [Function] |  |  |  |
| usedIngredients.ingredient | ObjectId → Inventory |  |  |  |  |  |
| usedIngredients.ingredientName | String |  |  |  |  |  |
| usedIngredients.quantity | Number |  |  |  |  |  |
| usedIngredients.unit | String |  |  |  |  |  |
| quality | String |  |  |  |  | 成品质量 |
| qualityRemark | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| date_1_mealType_1_status_1 | {date:1,mealType:1,status:1} | background |
| dish_1_date_1 | {dish:1,date:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| dish | Dish | Reference |
| usedIngredients.ingredient | Inventory | Nested Reference |

---

