# MongoDB 数据库架构文档

本目录包含 MongoDB 数据库的完整架构文档，包括所有表的字段定义、索引和关联关系。

## 文件说明

### 主要文件

- **schema.json** - 完整的数据库架构信息（JSON格式），包含所有表的字段、索引和关联关系
- **schema.md** - 完整的数据库架构文档（Markdown格式），包含所有表的详细信息

### 单个模型文档

每个模型都有独立的 Markdown 文档：
- `User.md` - 用户表
- `AIChatHistory.md` - AI聊天历史表
- `AIReport.md` - AI报告表
- `AuthToken.md` - 认证令牌表
- `ClassHealthReport.md` - 班级健康报告表
- `Dish.md` - 菜品表
- `EducationMaterial.md` - 教育材料表
- `Favorite.md` - 收藏表
- `FoodSafetyRecord.md` - 食品安全记录表
- `HealthRecord.md` - 健康记录表
- `Inventory.md` - 库存表
- `NutritionRecord.md` - 营养记录表
- `Order.md` - 订单表
- `PhysicalExam.md` - 体检表
- `ProductionPlan.md` - 生产计划表
- `PurchaseOrder.md` - 采购订单表
- `Review.md` - 评价表

## 文档内容

每个文档包含以下信息：

### 1. 字段定义
- 字段名称
- 数据类型
- 是否必填
- 默认值
- 唯一性约束
- 索引信息
- 字段说明

### 2. 索引信息
- 索引名称
- 索引字段
- 索引选项（唯一、稀疏、后台创建、TTL等）

### 3. 关联关系
- 关联字段
- 关联的表
- 关联类型（直接引用、数组引用、嵌套引用）

## 如何重新生成文档

运行以下命令重新生成所有架构文档：

```bash
cd Backend
node src/scripts/exportMongoSchema.js
```

## 注意事项

- 文档基于当前数据库中的实际索引生成
- 字段信息来自 Mongoose Schema 定义
- 索引信息从 MongoDB 数据库直接读取
- 关联关系从 Schema 中的 `ref` 字段提取

## 更新日期

文档生成时间：2025/11/6 17:16:49


