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

