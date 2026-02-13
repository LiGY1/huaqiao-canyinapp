# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## NutritionRecord

**集合名称**: `nutritionrecords`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  |  |  |  |
| date | Date | ✓ |  |  |  |  |
| intake.calories | Number |  | 0 |  |  |  |
| intake.protein | Number |  | 0 |  |  |  |
| intake.fat | Number |  | 0 |  |  |  |
| intake.carbs | Number |  | 0 |  |  |  |
| intake.fiber | Number |  | 0 |  |  |  |
| intake.vitaminC | Number |  | 0 |  |  |  |
| intake.iron | Number |  | 0 |  |  |  |
| intake.sugar | Number |  | 0 |  |  |  |
| meals | Object |  | [Function] |  |  |  |
| meals.order | ObjectId → Order |  |  |  |  |  |
| meals.mealType | String |  |  |  |  |  |
| meals.time | Date |  |  |  |  |  |
| meals.items | Array<String> |  | [Function] |  |  |  |
| weight | Number |  |  |  |  |  |
| bloodPressure | String |  |  |  |  |  |
| bloodSugar | Number |  |  |  |  |  |
| notes | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1_date_1 | {user:1,date:1} | unique, background |
| user_date | {user:1,date:-1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |
| meals.order | Order | Nested Reference |

---

