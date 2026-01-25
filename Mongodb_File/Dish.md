# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## Dish

**集合名称**: `dishes`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| name | String | ✓ |  |  |  |  |
| category | String | ✓ |  |  |  |  |
| price | Number | ✓ |  |  |  |  |
| cost | Number |  | 0 |  |  |  |
| image | String |  | https://via.placeholder.com/150 |  |  |  |
| description | String |  |  |  |  |  |
| nutrition.calories | Number |  | 0 |  |  | 热量（千卡） |
| nutrition.protein | Number |  | 0 |  |  | 蛋白质（克） |
| nutrition.fat | Number |  | 0 |  |  | 脂肪（克） |
| nutrition.carbs | Number |  | 0 |  |  | 碳水化合物（克） |
| nutrition.fiber | Number |  | 0 |  |  | 膳食纤维（克） |
| nutrition.vitaminA | Number |  | 0 |  |  | 维生素A（微克） |
| nutrition.vitaminC | Number |  | 0 |  |  | 维生素C（毫克） |
| nutrition.vitaminD | Number |  | 0 |  |  | 维生素D（微克） |
| nutrition.vitaminE | Number |  | 0 |  |  | 维生素E（毫克） |
| nutrition.calcium | Number |  | 0 |  |  | 钙（毫克） |
| nutrition.iron | Number |  | 0 |  |  | 铁（毫克） |
| nutrition.zinc | Number |  | 0 |  |  | 锌（毫克） |
| nutrition.sodium | Number |  | 0 |  |  | 钠（毫克） |
| nutrition.potassium | Number |  | 0 |  |  | 钾（毫克） |
| stock | Number |  | 0 |  |  |  |
| status | Number |  | 1 |  |  |  |
| ingredients | Array<String> |  | [Function] |  |  |  |
| allergens | Array<String> |  | [Function] |  |  |  |
| isPopular | Boolean |  | false |  |  |  |
| salesCount | Number |  | 0 |  |  |  |
| averageRating | Number |  | 0 |  |  |  |
| reviewCount | Number |  | 0 |  |  |  |
| recommendScore | Number |  | 0 |  |  |  |
| seasonal | Boolean |  | false |  |  | 是否为节气菜品 |
| solarTerm | String |  |  |  |  | 对应的节气名称（如：霜降、立冬） |
| isRecommended | Boolean |  | false |  |  | 是否为推荐菜品 |
| nutritionDescription | String |  |  |  |  | 营养描述文本（AI生成） |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| name | {name:1} | background |
| category | {category:1} | background |
| idx_dish_status | {status:1} | - |

---

