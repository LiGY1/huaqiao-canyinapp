const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 导入所有模型
const User = require('../models/User');
const AIChatHistory = require('../models/AIChatHistory');
const AIReport = require('../models/AIReport');
const AuthToken = require('../models/AuthToken');
const ClassHealthReport = require('../models/ClassHealthReport');
const Dish = require('../models/Dish');
const EducationMaterial = require('../models/EducationMaterial');
const Favorite = require('../models/Favorite');
const FoodSafetyRecord = require('../models/FoodSafetyRecord');
const HealthRecord = require('../models/HealthRecord');
const Inventory = require('../models/Inventory');
const NutritionRecord = require('../models/NutritionRecord');
const Order = require('../models/Order');
const PhysicalExam = require('../models/PhysicalExam');
const ProductionPlan = require('../models/ProductionPlan');
const PurchaseOrder = require('../models/PurchaseOrder');
const Review = require('../models/Review');

// 模型映射
const models = {
  User,
  AIChatHistory,
  AIReport,
  AuthToken,
  ClassHealthReport,
  Dish,
  EducationMaterial,
  Favorite,
  FoodSafetyRecord,
  HealthRecord,
  Inventory,
  NutritionRecord,
  Order,
  PhysicalExam,
  ProductionPlan,
  PurchaseOrder,
  Review
};

/**
 * 提取字段信息
 */
function extractFieldInfo(schema) {
  const fields = {};
  
  schema.eachPath((pathName, schemaType) => {
    if (pathName === '_id' || pathName === '__v') return;
    
    const fieldInfo = {
      type: getSchemaTypeName(schemaType),
      required: schemaType.isRequired || false,
      default: schemaType.defaultValue,
      unique: schemaType._index && (schemaType._index === true || schemaType._index.unique) || false,
      index: !!schemaType._index,
      sparse: schemaType._index && schemaType._index.sparse || false,
      enum: schemaType.enumValues || null,
      min: schemaType.min || null,
      max: schemaType.max || null,
      minlength: schemaType.minlength || null,
      maxlength: schemaType.maxlength || null,
      trim: schemaType.trim || false,
      ref: schemaType.options?.ref || null,
      comment: schemaType.options?.comment || null
    };
    
    // 处理嵌套对象
    if (schemaType.schema) {
      fieldInfo.type = 'Object';
      fieldInfo.schema = extractFieldInfo(schemaType.schema);
    }
    
    // 处理数组
    if (schemaType.constructor.name === 'SchemaArray') {
      fieldInfo.type = 'Array';
      const arrayElementType = schemaType.caster;
      if (arrayElementType) {
        fieldInfo.itemType = getSchemaTypeName(arrayElementType);
        if (arrayElementType.options?.ref) {
          fieldInfo.ref = arrayElementType.options.ref;
        }
        if (arrayElementType.schema) {
          fieldInfo.itemSchema = extractFieldInfo(arrayElementType.schema);
        }
      }
    }
    
    fields[pathName] = fieldInfo;
  });
  
  return fields;
}

/**
 * 获取Schema类型名称
 */
function getSchemaTypeName(schemaType) {
  if (!schemaType) return 'Mixed';
  
  const typeName = schemaType.constructor.name;
  
  const typeMap = {
    'SchemaString': 'String',
    'SchemaNumber': 'Number',
    'SchemaDate': 'Date',
    'SchemaBoolean': 'Boolean',
    'SchemaBuffer': 'Buffer',
    'SchemaObjectId': 'ObjectId',
    'SchemaArray': 'Array',
    'SchemaMixed': 'Mixed',
    'SchemaMap': 'Map'
  };
  
  return typeMap[typeName] || 'Mixed';
}


/**
 * 提取索引信息
 */
function extractIndexes(schema) {
  const indexes = [];
  
  // 从schema中提取索引
  const schemaIndexes = schema.indexes();
  for (const index of schemaIndexes) {
    indexes.push({
      fields: index[0],
      options: index[1] || {}
    });
  }
  
  // 从字段中提取单字段索引
  schema.eachPath((path, schemaType) => {
    if (schemaType._index) {
      indexes.push({
        fields: { [path]: schemaType._index === true ? 1 : schemaType._index },
        options: {}
      });
    }
  });
  
  return indexes;
}

/**
 * 提取关联关系
 */
function extractRelations(schema) {
  const relations = [];
  
  schema.eachPath((pathName, schemaType) => {
    // 直接引用
    if (schemaType.options && schemaType.options.ref) {
      relations.push({
        field: pathName,
        ref: schemaType.options.ref,
        type: 'Reference'
      });
    }
    
    // 数组中的引用
    if (schemaType.constructor.name === 'SchemaArray') {
      const arrayElementType = schemaType.caster;
      if (arrayElementType && arrayElementType.options && arrayElementType.options.ref) {
        relations.push({
          field: pathName,
          ref: arrayElementType.options.ref,
          type: 'Array Reference'
        });
      }
    }
    
    // 嵌套对象中的引用
    if (schemaType.schema) {
      schemaType.schema.eachPath((subPath, subSchemaType) => {
        if (subSchemaType.options && subSchemaType.options.ref) {
          relations.push({
            field: `${pathName}.${subPath}`,
            ref: subSchemaType.options.ref,
            type: 'Nested Reference'
          });
        }
      });
    }
  });
  
  return relations;
}

/**
 * 生成Markdown文档
 */
function generateMarkdown(schemaData) {
  let md = `# MongoDB 数据库架构文档\n\n`;
  md += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  md += `---\n\n`;
  
  for (const [modelName, data] of Object.entries(schemaData)) {
    md += `## ${modelName}\n\n`;
    md += `**集合名称**: \`${data.collectionName}\`\n\n`;
    
    // 字段信息
    md += `### 字段定义\n\n`;
    md += `| 字段名 | 类型 | 必填 | 默认值 | 唯一 | 索引 | 说明 |\n`;
    md += `|--------|------|------|--------|------|------|------|\n`;
    
    function formatFields(fields, prefix = '') {
      let result = '';
      for (const [fieldName, fieldInfo] of Object.entries(fields)) {
        const displayName = prefix ? `${prefix}.${fieldName}` : fieldName;
        let type = fieldInfo.type || 'Mixed';
        
        // 处理数组类型
        if (type === 'Array') {
          type = `Array<${fieldInfo.itemType || 'Mixed'}>`;
          if (fieldInfo.ref) {
            type += ` → ${fieldInfo.ref}`;
          }
        } else if (fieldInfo.ref) {
          type += ` → ${fieldInfo.ref}`;
        }
        
        const required = fieldInfo.required ? '✓' : '';
        let defaultValue = '';
        if (fieldInfo.default !== undefined && fieldInfo.default !== null) {
          if (typeof fieldInfo.default === 'function') {
            defaultValue = '[Function]';
          } else {
            defaultValue = String(fieldInfo.default);
          }
        }
        const unique = fieldInfo.unique ? '✓' : '';
        const index = fieldInfo.index ? '✓' : '';
        const comment = fieldInfo.comment || '';
        
        result += `| ${displayName} | ${type} | ${required} | ${defaultValue} | ${unique} | ${index} | ${comment} |\n`;
        
        // 递归处理嵌套对象
        if (fieldInfo.schema) {
          result += formatFields(fieldInfo.schema, displayName);
        }
        
        // 处理数组中的对象schema
        if (fieldInfo.itemSchema) {
          result += formatFields(fieldInfo.itemSchema, `${displayName}[]`);
        }
      }
      return result;
    }
    
    md += formatFields(data.fields);
    md += `\n`;
    
    // 索引信息
    if (data.indexes && data.indexes.length > 0) {
      md += `### 索引\n\n`;
      md += `| 索引名称 | 字段 | 选项 |\n`;
      md += `|----------|------|------|\n`;
      
      for (const index of data.indexes) {
        const name = index.name || '未命名';
        const fieldsStr = JSON.stringify(index.fields).replace(/"/g, '');
        const options = [];
        if (index.options.unique) options.push('unique');
        if (index.options.sparse) options.push('sparse');
        if (index.options.background) options.push('background');
        if (index.options.expireAfterSeconds) options.push(`TTL: ${index.options.expireAfterSeconds}s`);
        const optionsStr = options.length > 0 ? options.join(', ') : '-';
        md += `| ${name} | ${fieldsStr} | ${optionsStr} |\n`;
      }
      md += `\n`;
    }
    
    // 关联关系
    if (data.relations && data.relations.length > 0) {
      md += `### 关联关系\n\n`;
      md += `| 字段 | 关联表 | 类型 |\n`;
      md += `|------|--------|------|\n`;
      
      for (const relation of data.relations) {
        md += `| ${relation.field} | ${relation.ref} | ${relation.type} |\n`;
      }
      md += `\n`;
    }
    
    md += `---\n\n`;
  }
  
  return md;
}

/**
 * 主函数
 */
async function exportSchema() {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI);
    
    // 创建输出目录
    const outputDir = path.join(__dirname, '../../Mongodb_File');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const schemaData = {};
    
    // 遍历所有模型
    for (const [modelName, Model] of Object.entries(models)) {
      
      const schema = Model.schema;
      let collectionName;
      try {
        collectionName = Model.collection.name;
      } catch (error) {
        // 如果集合不存在，使用模型名称
        collectionName = Model.modelName.toLowerCase() + 's';
      }
      
      // 提取字段信息
      const fields = extractFieldInfo(schema);
      
      // 提取索引信息
      const indexes = extractIndexes(schema);
      
      // 提取关联关系
      const relations = extractRelations(schema);
      
      // 获取实际数据库中的索引
      let actualIndexes = [];
      try {
        const dbIndexes = await Model.collection.indexes();
        actualIndexes = dbIndexes.map(idx => ({
          name: idx.name,
          fields: idx.key,
          options: {
            unique: idx.unique || false,
            sparse: idx.sparse || false,
            background: idx.background || false,
            expireAfterSeconds: idx.expireAfterSeconds
          }
        }));
      } catch (error) {
        console.warn(`无法获取 ${modelName} 的数据库索引:`, error.message);
        // 使用schema中的索引信息
        actualIndexes = indexes;
      }
      
      schemaData[modelName] = {
        collectionName,
        fields,
        indexes: actualIndexes,
        relations,
        timestamps: schema.options.timestamps || false
      };
    }
    
    // 保存JSON文件
    const jsonPath = path.join(outputDir, 'schema.json');
    fs.writeFileSync(jsonPath, JSON.stringify(schemaData, null, 2), 'utf8');
    
    // 保存Markdown文件
    const mdPath = path.join(outputDir, 'schema.md');
    const markdown = generateMarkdown(schemaData);
    fs.writeFileSync(mdPath, markdown, 'utf8');
    
    // 为每个模型生成单独的Markdown文件
    for (const [modelName, data] of Object.entries(schemaData)) {
      const modelMd = generateMarkdown({ [modelName]: data });
      const modelMdPath = path.join(outputDir, `${modelName}.md`);
      fs.writeFileSync(modelMdPath, modelMd, 'utf8');
    }
    
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('导出失败:', error);
    process.exit(1);
  }
}

// 运行导出
exportSchema();

