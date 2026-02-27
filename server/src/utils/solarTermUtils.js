

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

  // 创建只包含年月日的Date对象，用于比较
  const compareDate = new Date(year, month, day);

  const currentYearTerms = calculateSolarTermDates(year);
  const lastYearTerms = calculateSolarTermDates(year - 1);

  const allTerms = [];

  // 只在1-2月时才添加去年的小寒、大寒
  if (month <= 1) {
    allTerms.push({ index: 22, date: new Date(lastYearTerms[22].getFullYear(), lastYearTerms[22].getMonth(), lastYearTerms[22].getDate()) });
    allTerms.push({ index: 23, date: new Date(lastYearTerms[23].getFullYear(), lastYearTerms[23].getMonth(), lastYearTerms[23].getDate()) });
  }

  // 添加今年的所有节气
  for (let i = 0; i < currentYearTerms.length; i++) {
    const termDate = currentYearTerms[i];
    allTerms.push({ 
      index: i, 
      date: new Date(termDate.getFullYear(), termDate.getMonth(), termDate.getDate()) 
    });
  }

  // 找到当前日期对应的节气（找到最后一个小于等于当前日期的节气）
  let currentTerm = allTerms[0];
  for (let i = 0; i < allTerms.length; i++) {
    if (compareDate >= allTerms[i].date) {
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
  // 节气日期会随年份变化，这里提供2024-2026年的近似值
  // 实际应用中应该使用天文算法计算精确日期
  
  // 基准年份的节气日期（2025年）
  const baseYear = 2025;
  const baseDates = [
    { month: 1, day: 3 },   // 立春 2月3-5日
    { month: 1, day: 18 },  // 雨水 2月18-20日
    { month: 2, day: 5 },   // 惊蛰 3月5-7日
    { month: 2, day: 20 },  // 春分 3月20-22日
    { month: 3, day: 4 },   // 清明 4月4-6日
    { month: 3, day: 19 },  // 谷雨 4月19-21日
    { month: 4, day: 5 },   // 立夏 5月5-7日
    { month: 4, day: 20 },  // 小满 5月20-22日
    { month: 5, day: 5 },   // 芒种 6月5-7日
    { month: 5, day: 21 },  // 夏至 6月21-22日
    { month: 6, day: 6 },   // 小暑 7月6-8日
    { month: 6, day: 22 },  // 大暑 7月22-24日
    { month: 7, day: 7 },   // 立秋 8月7-9日
    { month: 7, day: 22 },  // 处暑 8月22-24日
    { month: 8, day: 7 },   // 白露 9月7-9日
    { month: 8, day: 22 },  // 秋分 9月22-24日
    { month: 9, day: 8 },   // 寒露 10月8-9日
    { month: 9, day: 23 },  // 霜降 10月23-24日
    { month: 10, day: 7 },  // 立冬 11月7-8日
    { month: 10, day: 22 }, // 小雪 11月22-23日
    { month: 11, day: 6 },  // 大雪 12月6-8日
    { month: 11, day: 21 }, // 冬至 12月21-23日
    { month: 0, day: 5 },   // 小寒 1月5-7日（次年）
    { month: 0, day: 20 }   // 大寒 1月20-21日（次年）
  ];

  // 根据年份差异调整日期（简化算法，每4年调整1天）
  const yearDiff = year - baseYear;
  const dayAdjust = Math.floor(yearDiff / 4);

  const termDates = baseDates.map(({ month, day }) => {
    let adjustedDay = day + dayAdjust;
    let adjustedMonth = month;
    
    // 处理日期溢出（简化处理）
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    if (adjustedDay > daysInMonth) {
      adjustedDay = adjustedDay - daysInMonth;
      adjustedMonth = month + 1;
    } else if (adjustedDay < 1) {
      adjustedMonth = month - 1;
      adjustedDay = new Date(year, adjustedMonth + 1, 0).getDate() + adjustedDay;
    }
    
    return new Date(year, adjustedMonth, adjustedDay);
  });

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

