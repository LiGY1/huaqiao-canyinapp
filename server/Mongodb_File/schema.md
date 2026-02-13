# MongoDB 数据库架构文档

生成时间: 2025/11/6 17:18:00

---

## User

**集合名称**: `users`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| username | String | ✓ |  | ✓ | ✓ |  |
| password | String | ✓ |  |  |  |  |
| name | String | ✓ |  |  |  |  |
| role | String | ✓ |  |  |  |  |
| email | String |  |  |  | ✓ |  |
| phone | String |  |  |  | ✓ |  |
| avatar | String |  |  |  |  |  |
| studentId | String |  |  |  |  |  |
| class | String |  |  |  |  |  |
| grade | String |  |  |  |  |  |
| age | Number |  |  |  |  |  |
| gender | String |  |  |  |  |  |
| height | Number |  |  |  |  |  |
| weight | Number |  |  |  |  |  |
| allergies | Array<String> |  | [Function] |  |  |  |
| hasDiabetes | Boolean |  | false |  |  |  |
| hasHereditaryDisease | Boolean |  | false |  |  |  |
| hereditaryDiseaseDesc | String |  |  |  |  |  |
| targetCalories | Number |  | 2000 |  |  |  |
| balance | Number |  | 0 |  |  |  |
| children | Array<ObjectId> → User |  | [Function] |  |  |  |
| schoolId | String |  |  |  |  |  |
| schoolName | String |  |  |  |  |  |
| department | String |  |  |  |  |  |
| managedClasses | Array<String> |  | [Function] |  |  |  |
| isActive | Boolean |  | true |  |  |  |
| lastTokenReset | Date |  |  |  |  |  |
| reminderSettings | Object |  | [Function] |  |  |  |
| reminderSettings.breakfast | Boolean |  | true |  |  |  |
| reminderSettings.lunch | Boolean |  | true |  |  |  |
| reminderSettings.dinner | Boolean |  | true |  |  |  |
| reminderSettings.dailySummary | Boolean |  | true |  |  |  |
| reminderSettings.nutritionAlert | Boolean |  | false |  |  |  |
| reminderSettings.healthTips | Boolean |  | true |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| username_1 | {username:1} | unique, background |
| email_1 | {email:1} | sparse, background |
| phone_1 | {phone:1} | sparse, background |
| role_managedClasses | {role:1,managedClasses:1} | background |
| role_children | {role:1,children:1} | background |
| role_name | {role:1,name:1} | background |
| role_class | {role:1,class:1} | background |
| name_text | {_fts:text,_ftsx:1} | background |
| idx_role | {role:1} | - |
| idx_class | {class:1} | - |
| idx_managed_classes | {managedClasses:1} | - |
| idx_children | {children:1} | - |
| idx_student_id | {studentId:1} | - |
| idx_role_studentid | {role:1,studentId:1} | - |
| idx_name | {name:1} | - |
| idx_username | {username:1} | - |
| name_1_studentId_1 | {name:1,studentId:1} | background |
| name_1_role_1 | {name:1,role:1} | background |
| idx_name_studentid_role_opt | {name:1,studentId:1,role:1} | background |
| idx_role_class_name_opt | {role:1,class:1,name:1} | background |
| idx_role_name_children_opt | {role:1,name:1,children:1} | background |
| idx_role_class_studentid_opt | {role:1,class:1,studentId:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| children | User | Array Reference |

---

## AIChatHistory

**集合名称**: `aichathistories`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  | ✓ | ✓ |  |
| source | String | ✓ | student | ✓ | ✓ |  |
| conversationId | String |  |  | ✓ | ✓ |  |
| sender | String | ✓ |  |  |  |  |
| userMessage | String |  |  |  |  |  |
| aiMessage | String |  |  |  |  |  |
| files | Object |  | [Function] |  |  |  |
| files.filename | String |  |  |  |  |  |
| files.url | String |  |  |  |  |  |
| files.type | String |  | image |  |  |  |
| files.size | Number |  |  |  |  |  |
| files.mimeType | String |  |  |  |  |  |
| timestamp | Date |  | [Function] | ✓ | ✓ |  |
| metadata.wrappedQuery | String |  |  |  |  |  |
| metadata.tokens.prompt | Number |  |  |  |  |  |
| metadata.tokens.completion | Number |  |  |  |  |  |
| metadata.tokens.total | Number |  |  |  |  |  |
| metadata.responseTime | Number |  |  |  |  |  |
| metadata.extras | Mixed |  |  |  |  |  |
| summary | String |  |  |  |  |  |
| tags | Array<String> |  | [Function] |  |  |  |
| isFavorite | Boolean |  | false |  |  |  |
| createdAt | Date |  | [Function] | ✓ | ✓ |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1 | {user:1} | background |
| source_1 | {source:1} | background |
| conversationId_1 | {conversationId:1} | background |
| timestamp_1 | {timestamp:1} | background |
| createdAt_1 | {createdAt:1} | background |
| user_1_source_1_createdAt_-1 | {user:1,source:1,createdAt:-1} | background |
| user_1_source_1_conversationId_1 | {user:1,source:1,conversationId:1} | background |
| user_1_isFavorite_1_createdAt_-1 | {user:1,isFavorite:1,createdAt:-1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |

---

## AIReport

**集合名称**: `aireports`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| student | ObjectId → User | ✓ |  | ✓ | ✓ |  |
| reportType | String | ✓ |  | ✓ | ✓ |  |
| dateRange.start | Date | ✓ |  |  |  |  |
| dateRange.end | Date | ✓ |  |  |  |  |
| content.summary | String |  |  |  |  |  |
| content.highlights | Array<String> |  | [Function] |  |  |  |
| content.suggestions | Array<String> |  | [Function] |  |  |  |
| content.nextPlan | String |  |  |  |  |  |
| content.fullText | String |  |  |  |  |  |
| dataSummary.avgCalories | Number |  |  |  |  |  |
| dataSummary.avgProtein | Number |  |  |  |  |  |
| dataSummary.avgFat | Number |  |  |  |  |  |
| dataSummary.avgCarbs | Number |  |  |  |  |  |
| dataSummary.avgFiber | Number |  |  |  |  |  |
| dataSummary.totalDays | Number |  |  |  |  |  |
| dataSummary.targetCalories | Number |  |  |  |  |  |
| dataSummary.nutritionScore.carbs | Number |  |  |  |  |  |
| dataSummary.nutritionScore.protein | Number |  |  |  |  |  |
| dataSummary.nutritionScore.fat | Number |  |  |  |  |  |
| dataSummary.nutritionScore.fiber | Number |  |  |  |  |  |
| dataSummary.nutritionScore.vitamin | Number |  |  |  |  |  |
| conversationId | String |  |  |  |  |  |
| status | String |  | generating |  |  |  |
| errorMessage | String |  |  |  |  |  |
| createdAt | Date |  | [Function] | ✓ | ✓ |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| student_1 | {student:1} | background |
| reportType_1 | {reportType:1} | background |
| createdAt_1 | {createdAt:1} | background |
| student_1_reportType_1_createdAt_-1 | {student:1,reportType:1,createdAt:-1} | background |
| student_1_dateRange.start_1_dateRange.end_1 | {student:1,dateRange.start:1,dateRange.end:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| student | User | Reference |

---

## AuthToken

**集合名称**: `auth`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| token | String | ✓ |  | ✓ | ✓ |  |
| isActive | Boolean |  | true |  |  |  |
| createdAt | Date |  | [Function] |  |  |  |
| lastUsedAt | Date |  | [Function] |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| token_1 | {token:1} | unique, background |
| isActive_1 | {isActive:1} | background |

---

## ClassHealthReport

**集合名称**: `classhealthreports`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| generatedBy | ObjectId → User | ✓ |  | ✓ | ✓ |  |
| filters.grade | String |  |  |  |  |  |
| filters.class | String |  |  |  |  |  |
| filters.keyword | String |  |  |  |  |  |
| filters.healthStatus | String |  |  |  |  |  |
| scope | String | ✓ |  |  |  |  |
| summary.total | Number | ✓ |  |  |  |  |
| summary.healthy | Number |  |  |  |  |  |
| summary.attention | Number |  |  |  |  |  |
| summary.abnormal | Number |  |  |  |  |  |
| summary.healthyRate | Number |  |  |  |  |  |
| summary.avgHeight | Number |  |  |  |  |  |
| summary.avgWeight | Number |  |  |  |  |  |
| summary.avgBMI | Number |  |  |  |  |  |
| summary.avgNutritionScore | Number |  |  |  |  |  |
| content.overview | String |  |  |  |  |  |
| content.highlights | Array<String> |  | [Function] |  |  |  |
| content.suggestions | Array<String> |  | [Function] |  |  |  |
| content.nextPlan | String |  |  |  |  |  |
| students | Object |  | [Function] |  |  |  |
| students.studentId | String |  |  |  |  |  |
| students.studentName | String |  |  |  |  |  |
| students.healthStatus | String |  |  |  |  |  |
| students.bmi | Number |  |  |  |  |  |
| conversationId | String |  |  |  |  |  |
| status | String |  | generating |  |  |  |
| errorMessage | String |  |  |  |  |  |
| createdAt | Date |  | [Function] | ✓ | ✓ |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| generatedBy_1 | {generatedBy:1} | background |
| createdAt_1 | {createdAt:1} | background |
| generatedBy_1_createdAt_-1 | {generatedBy:1,createdAt:-1} | background |
| scope_1_createdAt_-1 | {scope:1,createdAt:-1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| generatedBy | User | Reference |

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

## EducationMaterial

**集合名称**: `educationmaterials`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| title | String | ✓ |  |  |  |  |
| type | String | ✓ |  |  |  |  |
| category | String |  | nutrition |  |  |  |
| content | String |  |  |  |  |  |
| fileType | String |  |  |  |  |  |
| fileUrl | String |  |  |  |  |  |
| targetGrades | Array<String> |  | [Function] |  |  |  |
| targetClasses | Array<String> |  | [Function] |  |  |  |
| duration | Number |  |  |  |  |  |
| completionRate | Number |  | 0 |  |  |  |
| scheduledDate | Date |  |  |  |  |  |
| sendDate | Date |  |  |  |  |  |
| readCount | Number |  | 0 |  |  |  |
| author | ObjectId → User |  |  |  |  |  |
| authorName | String |  |  |  |  |  |
| publishDate | Date |  | [Function] |  |  |  |
| isPublished | Boolean |  | false |  |  |  |
| viewCount | Number |  | 0 |  |  |  |
| downloadCount | Number |  | 0 |  |  |  |
| description | String |  |  |  |  |  |
| tags | Array<String> |  | [Function] |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| author | User | Reference |

---

## Favorite

**集合名称**: `favorites`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  |  |  |  |
| dish | ObjectId → Dish | ✓ |  |  |  |  |
| createdAt | Date |  | [Function] |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1_dish_1 | {user:1,dish:1} | unique, background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |
| dish | Dish | Reference |

---

## FoodSafetyRecord

**集合名称**: `foodsafetyrecords`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| type | String | ✓ |  |  |  |  |
| ingredient | ObjectId → Inventory |  |  |  |  |  |
| ingredientName | String |  |  |  |  |  |
| supplier | String |  |  |  |  |  |
| quantity | Number |  |  |  |  |  |
| unit | String |  |  |  |  |  |
| qualityStatus | String |  |  |  |  |  |
| temperature | Number |  |  |  |  |  |
| freshness | String |  |  |  |  |  |
| area | String |  |  |  |  |  |
| method | String |  |  |  |  |  |
| concentration | String |  |  |  |  |  |
| duration | Number |  |  |  |  |  |
| inspector | String |  |  |  |  |  |
| date | Date |  | [Function] |  |  |  |
| result | String |  |  |  |  |  |
| remark | String |  |  |  |  |  |
| images | Array<String> |  | [Function] |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| ingredient | Inventory | Reference |

---

## HealthRecord

**集合名称**: `healthrecords`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  |  |  |  |
| date | Date | ✓ |  |  |  |  |
| weight | Number |  |  |  |  |  |
| height | Number |  |  |  |  |  |
| bmi | Number |  |  |  |  |  |
| bloodPressure.systolic | Number |  |  |  |  |  |
| bloodPressure.diastolic | Number |  |  |  |  |  |
| bloodSugar.fasting | Number |  |  |  |  |  |
| bloodSugar.postprandial | Number |  |  |  |  |  |
| temperature | Number |  |  |  |  |  |
| heartRate | Number |  |  |  |  |  |
| sleepHours | Number |  |  |  |  |  |
| exerciseMinutes | Number |  |  |  |  |  |
| waterIntake | Number |  |  |  |  |  |
| healthStatus | String |  | good |  |  |  |
| symptoms | Array<String> |  | [Function] |  |  |  |
| notes | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1_date_-1 | {user:1,date:-1} | background |
| user | {user:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |

---

## Inventory

**集合名称**: `inventories`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| name | String | ✓ |  |  |  |  |
| category | String |  | other |  |  |  |
| quantity | Number | ✓ | 0 |  |  |  |
| unit | String | ✓ | 斤 |  |  |  |
| warningLevel | Number |  | 100 |  |  |  |
| unitPrice | Number |  | 0 |  |  |  |
| supplier | String |  |  |  |  |  |
| lastStockIn | Date |  |  |  |  |  |
| expiryDate | Date |  |  |  |  |  |
| storageLocation | String |  |  |  |  |  |
| stockHistory | Object |  | [Function] |  |  |  |
| stockHistory.type | String |  |  |  |  |  |
| stockHistory.quantity | Number |  |  |  |  |  |
| stockHistory.date | Date |  |  |  |  |  |
| stockHistory.operator | String |  |  |  |  |  |
| stockHistory.remark | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

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

## PhysicalExam

**集合名称**: `physicalexams`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| student | ObjectId → User | ✓ |  |  |  |  |
| examDate | Date | ✓ |  |  |  |  |
| height | Number | ✓ |  |  |  |  |
| weight | Number | ✓ |  |  |  |  |
| bmi | Number |  |  |  |  |  |
| vision.left | String |  |  |  |  |  |
| vision.right | String |  |  |  |  |  |
| bloodPressure.systolic | Number |  |  |  |  |  |
| bloodPressure.diastolic | Number |  |  |  |  |  |
| heartRate | Number |  |  |  |  |  |
| hemoglobin | Number |  |  |  |  |  |
| healthStatus | String |  | good |  |  |  |
| nutritionScore | Number |  | 0 |  |  |  |
| notes | String |  |  |  |  |  |
| examiner | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| student | User | Reference |

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

## PurchaseOrder

**集合名称**: `purchaseorders`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| orderNumber | String | ✓ |  | ✓ | ✓ |  |
| items | Object |  | [Function] |  |  |  |
| items.ingredient | ObjectId → Inventory |  |  |  |  |  |
| items.ingredientName | String |  |  |  |  |  |
| items.quantity | Number | ✓ |  |  |  |  |
| items.unit | String |  |  |  |  |  |
| items.unitPrice | Number |  |  |  |  |  |
| items.totalPrice | Number |  |  |  |  |  |
| supplier | String | ✓ |  |  |  |  |
| totalAmount | Number | ✓ |  |  |  |  |
| status | String |  | pending |  |  |  |
| requestedBy | ObjectId → User |  |  |  |  |  |
| approvedBy | ObjectId → User |  |  |  |  |  |
| expectedDate | Date |  |  |  |  |  |
| receiveDate | Date |  |  |  |  |  |
| actualAmount | Number |  |  |  |  |  |
| remark | String |  |  |  |  |  |
| approvalRemark | String |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| orderNumber_1 | {orderNumber:1} | unique, background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| items.ingredient | Inventory | Nested Reference |
| requestedBy | User | Reference |
| approvedBy | User | Reference |

---

## Review

**集合名称**: `reviews`

### 字段定义

| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |
|--------|------|------|--------|------|------|------|
| user | ObjectId → User | ✓ |  |  |  |  |
| order | ObjectId → Order | ✓ |  |  |  |  |
| dish | ObjectId → Dish |  |  |  |  |  |
| rating | Number | ✓ |  |  |  |  |
| taste | Number |  |  |  |  |  |
| freshness | Number |  |  |  |  |  |
| portionSize | Number |  |  |  |  |  |
| comment | String |  |  |  |  |  |
| images | Array<String> |  | [Function] |  |  |  |
| isAnonymous | Boolean |  | false |  |  |  |
| reply.content | String |  |  |  |  |  |
| reply.repliedBy | ObjectId → User |  |  |  |  |  |
| reply.repliedAt | Date |  |  |  |  |  |
| createdAt | Date |  |  |  |  |  |
| updatedAt | Date |  |  |  |  |  |

### 索引

| 索引名称 | 字段 | 选项 |
|----------|------|------|
| _id_ | {_id:1} | - |
| user_1 | {user:1} | background |
| order_1 | {order:1} | background |
| dish_1 | {dish:1} | background |
| rating_1 | {rating:1} | background |

### 关联关系

| 字段 | 关联表 | 类型 |
|------|--------|------|
| user | User | Reference |
| order | Order | Reference |
| dish | Dish | Reference |
| reply.repliedBy | User | Reference |

---

