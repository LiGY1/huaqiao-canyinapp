

const SOLAR_TERMS = [
  { name: '立春', enName: 'lichun' },
  { name: '雨水', enName: 'yushui' },
  { name: '惊蛰', enName: 'jingzhe' },
  { name: '春分', enName: 'chunfen' },
  { name: '清明', enName: 'qingming' },
  { name: '谷雨', enName: 'guyu' },
  { name: '立夏', enName: 'lixia' },
  { name: '小满', enName: 'xiaoman' },
  { name: '芒种', enName: 'mangzhong' },
  { name: '夏至', enName: 'xiazhi' },
  { name: '小暑', enName: 'xiaoshu' },
  { name: '大暑', enName: 'dashu' },
  { name: '立秋', enName: 'liqiu' },
  { name: '处暑', enName: 'chushu' },
  { name: '白露', enName: 'bailu' },
  { name: '秋分', enName: 'qiufen' },
  { name: '寒露', enName: 'hanlu' },
  { name: '霜降', enName: 'shuangjiang' },
  { name: '立冬', enName: 'lidong' },
  { name: '小雪', enName: 'xiaoxue' },
  { name: '大雪', enName: 'daxue' },
  { name: '冬至', enName: 'dongzhi' },
  { name: '小寒', enName: 'xiaohan' },
  { name: '大寒', enName: 'dahan' }
];

const TERM_COLORS = {
  spring: { primary: '#10b981', secondary: '#d1fae5', tag: 'success' },
  summer: { primary: '#f59e0b', secondary: '#fef3c7', tag: 'warning' },
  autumn: { primary: '#f97316', secondary: '#fed7aa', tag: 'danger' },
  winter: { primary: '#3b82f6', secondary: '#dbeafe', tag: 'info' }
};

function getCurrentSolarTerm(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const currentYearTerms = calculateSolarTermDates(year);
  const lastYearTerms = calculateSolarTermDates(year - 1);

  const allTerms = [];

  allTerms.push({ index: 22, date: lastYearTerms[22] });
  allTerms.push({ index: 23, date: lastYearTerms[23] });

  for (let i = 0; i < currentYearTerms.length; i++) {
    allTerms.push({ index: i, date: currentYearTerms[i] });
  }

  let currentTerm = allTerms[0];
  for (let i = 0; i < allTerms.length; i++) {
    if (date >= allTerms[i].date) {
      currentTerm = allTerms[i];
    } else {
      break;
    }
  }

  const termIndex = currentTerm.index;
  const term = SOLAR_TERMS[termIndex];
  const season = getSeason(termIndex);
  const color = TERM_COLORS[season];

  return {
    ...term,
    season,
    color,
    index: termIndex,
    description: getTermDescription(termIndex),
    date: currentTerm.date,
    healthTips: getHealthTips(termIndex)
  };
}

function calculateSolarTermDates(year) {

  const termDates = [
    new Date(year, 1, 4),
    new Date(year, 1, 19),
    new Date(year, 2, 6),
    new Date(year, 2, 21),
    new Date(year, 3, 5),
    new Date(year, 3, 20),
    new Date(year, 4, 6),
    new Date(year, 4, 21),
    new Date(year, 5, 6),
    new Date(year, 5, 21),
    new Date(year, 6, 7),
    new Date(year, 6, 23),
    new Date(year, 7, 8),
    new Date(year, 7, 23),
    new Date(year, 8, 8),
    new Date(year, 8, 23),
    new Date(year, 9, 8),
    new Date(year, 9, 23),
    new Date(year, 10, 7),
    new Date(year, 10, 22),
    new Date(year, 11, 7),
    new Date(year, 11, 22),
    new Date(year, 0, 6),
    new Date(year, 0, 20)
  ];

  return termDates;
}

function getSeason(termIndex) {

  if (termIndex >= 0 && termIndex <= 5) return 'spring';
  if (termIndex >= 6 && termIndex <= 11) return 'summer';
  if (termIndex >= 12 && termIndex <= 17) return 'autumn';
  return 'winter';
}

function getTermDescription(termIndex) {
  const descriptions = [
    '万物复苏，春暖花开',
    '春雨绵绵，万物生长',
    '春雷惊蛰，生机勃勃',
    '昼夜平分，春意盎然',
    '清明时节，踏青扫墓',
    '雨生百谷，播种希望',
    '夏日初临，万物繁茂',
    '麦粒渐满，夏意渐浓',
    '麦穗成熟，农忙时节',
    '白昼最长，炎夏来临',
    '炎热渐起，注意防暑',
    '酷暑难耐，最热时节',
    '秋风送爽，暑去凉来',
    '处暑时节，渐入秋凉',
    '露凝而白，秋意渐浓',
    '昼夜平分，秋色宜人',
    '寒露降临，天气转冷',
    '霜降时节，深秋已至',
    '冬日初临，万物收藏',
    '小雪纷飞，初冬寒意',
    '大雪纷飞，寒冬渐深',
    '白昼最短，数九寒天',
    '小寒时节，天气严寒',
    '大寒至极，冬去春来'
  ];

  return descriptions[termIndex] || '四时轮转，应时而食';
}

function getHealthTips(termIndex) {
  const tips = [
    '宜多食韭菜、春笋等时令蔬菜，养肝护阳',
    '宜少食生冷，多食温补健脾食物',
    '宜多食清淡食物，适当进补蛋白质',
    '宜平衡饮食，适当增加新鲜蔬果',
    '宜清补为主，多食豆制品、新鲜蔬菜',
    '宜健脾祛湿，多食薏米、山药等',
    '宜清淡饮食，适当进补增强体力',
    '宜清热祛湿，多食绿豆、冬瓜等',
    '宜清热解暑，多补充水分和维生素',
    '宜清淡饮食，少食油腻辛辣',
    '宜多食苦味食物，清热解毒',
    '宜清热解暑，多食西瓜、绿豆汤',
    '宜润燥养肺，多食梨、百合等',
    '宜滋阴润燥，少食辛辣',
    '宜多食温润食物，预防秋燥',
    '宜平补为主，饮食均衡',
    '宜养阴防燥，多食芝麻、蜂蜜',
    '宜温补润燥，多食栗子、山药',
    '宜温补助阳，适当进补',
    '宜温补肾阳，多食羊肉、核桃',
    '宜温补御寒，多食温热食物',
    '宜补益肾气，多食黑色食物',
    '宜温补驱寒，适当进补',
    '宜温补脾肾，为春季做准备'
  ];

  return tips[termIndex] || '合理饮食，健康生活';
}

function generateSolarTermPrompt(term) {
  return `当前节气是【${term.name}】，${term.description}。养生建议：${term.healthTips || getHealthTips(term.index)}。

请为校园食堂推荐5道适合这个节气的菜品，要求：
1. 每道菜品要符合当前节气特点和养生需求
2. 适合学生口味，营养均衡
3. 食材应季且容易采购
4. 价格适中，适合学生消费
5. 必须提供完整的营养数据（每100克的营养含量）

请按以下JSON格式返回，所有字段都必须填写：
{
  "dishes": [
    {
      "name": "菜品名称",
      "reason": "推荐理由（60字以内）",
      "ingredients": ["主要食材1", "主要食材2", "主要食材3"],
      "price": 12,
      "popularity": 85,
      "nutrition": {
        "calories": 450,
        "protein": 25,
        "fat": 15,
        "carbs": 40,
        "fiber": 5,
        "vitaminA": 200,
        "vitaminC": 30,
        "vitaminD": 2,
        "vitaminE": 5,
        "calcium": 100,
        "iron": 3,
        "zinc": 2,
        "sodium": 500,
        "potassium": 300
      }
    }
  ]
}

营养元素说明：
- calories: 热量（千卡）
- protein: 蛋白质（克）
- fat: 脂肪（克）
- carbs: 碳水化合物（克）
- fiber: 膳食纤维（克）
- vitaminA: 维生素A（微克）
- vitaminC: 维生素C（毫克）
- vitaminD: 维生素D（微克）
- vitaminE: 维生素E（毫克）
- calcium: 钙（毫克）
- iron: 铁（毫克）
- zinc: 锌（毫克）
- sodium: 钠（毫克）
- potassium: 钾（毫克）

要求返回纯JSON格式，不要包含其他文字说明。营养数据要符合实际食物营养含量。`;
}

function getTermTagType(season) {
  const typeMap = {
    spring: 'success',
    summer: 'warning',
    autumn: 'danger',
    winter: 'info'
  };
  return typeMap[season] || 'primary';
}

function getTermIcon(season) {
  const iconMap = {
    spring: '',
    summer: '',
    autumn: '',
    winter: ''
  };
  return iconMap[season] || '';
}

module.exports = {
  SOLAR_TERMS,
  TERM_COLORS,
  getCurrentSolarTerm,
  getHealthTips,
  generateSolarTermPrompt,
  getTermTagType,
  getTermIcon,
  getSeason,
  getTermDescription
};

