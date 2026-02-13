/**
 * ASCII表格格式化工具
 * 支持将数据转换为ASCII表格、Markdown表格等格式
 */

/**
 * 格式化单元格内容，确保中文字符正确显示
 */
function formatCell(content, width) {
  if (content === null || content === undefined) {
    content = '';
  }
  const str = String(content);
  // 计算中文字符宽度（中文字符占2个位置）
  const chineseCharCount = (str.match(/[^\x00-\xff]/g) || []).length;
  const otherCharCount = str.length - chineseCharCount;
  const displayWidth = chineseCharCount * 2 + otherCharCount;
  
  // 填充空格
  if (displayWidth < width) {
    return str + ' '.repeat(width - displayWidth);
  }
  // 截断过长内容
  if (displayWidth > width) {
    let truncated = '';
    let currentWidth = 0;
    for (let char of str) {
      const charWidth = /[^\x00-\xff]/.test(char) ? 2 : 1;
      if (currentWidth + charWidth > width - 3) {
        truncated += '...';
        break;
      }
      truncated += char;
      currentWidth += charWidth;
    }
    // 计算截断后的显示宽度并填充
    const truncatedChinese = (truncated.match(/[^\x00-\xff]/g) || []).length;
    const truncatedOther = truncated.length - truncatedChinese;
    const truncatedWidth = truncatedChinese * 2 + truncatedOther;
    return truncated + ' '.repeat(width - truncatedWidth);
  }
  return str;
}

/**
 * 生成ASCII表格
 */
function generateASCIITable(headers, rows) {
  if (rows.length === 0) {
    return '暂无数据';
  }
  
  // 计算每列的最大宽度
  const columnWidths = headers.map((header, index) => {
    const headerWidth = (header.match(/[^\x00-\xff]/g) || []).length * 2 + (header.length - (header.match(/[^\x00-\xff]/g) || []).length);
    const maxDataWidth = Math.max(...rows.map(row => {
      const cell = row[index] || '';
      const cellStr = String(cell);
      const chineseCount = (cellStr.match(/[^\x00-\xff]/g) || []).length;
      const otherCount = cellStr.length - chineseCount;
      return chineseCount * 2 + otherCount;
    }));
    return Math.max(headerWidth, maxDataWidth, 8) + 2; // 至少8个字符宽度，额外2个用于边距
  });
  
  // 生成表格上边框
  const topBorder = '┌' + columnWidths.map(w => '─'.repeat(w)).join('┬') + '┐';
  
  // 生成表头
  const headerRow = '│' + headers.map((h, i) => ' ' + formatCell(h, columnWidths[i] - 2) + ' ').join('│') + '│';
  
  // 生成表头分隔线
  const separator = '├' + columnWidths.map(w => '─'.repeat(w)).join('┼') + '┤';
  
  // 生成数据行
  const dataRows = rows.map(row => {
    return '│' + row.map((cell, i) => ' ' + formatCell(cell, columnWidths[i] - 2) + ' ').join('│') + '│';
  });
  
  // 生成表格下边框
  const bottomBorder = '└' + columnWidths.map(w => '─'.repeat(w)).join('┴') + '┘';
  
  return [topBorder, headerRow, separator, ...dataRows, bottomBorder].join('\n');
}

/**
 * 生成精简ASCII表格（适合AI大模型）
 * 移除装饰性边框，使用更紧凑的格式
 */
function generateCompactASCIITable(headers, rows) {
  if (rows.length === 0) {
    return '暂无数据';
  }
  
  // 简单的列对齐，不使用复杂边框
  const headerRow = headers.join(' | ');
  const separator = headers.map(() => '---').join('-|-');
  const dataRows = rows.map(row => row.map(cell => String(cell || '')).join(' | '));
  
  return [headerRow, separator, ...dataRows].join('\n');
}

/**
 * 生成Markdown表格
 */
function generateMarkdownTable(headers, rows) {
  if (rows.length === 0) {
    return '暂无数据';
  }
  
  // 表头
  const headerRow = '| ' + headers.join(' | ') + ' |';
  
  // 分隔线
  const separator = '|' + headers.map(() => '---').join('|') + '|';
  
  // 数据行
  const dataRows = rows.map(row => {
    return '| ' + row.map(cell => String(cell || '')).join(' | ') + ' |';
  });
  
  return [headerRow, separator, ...dataRows].join('\n');
}

/**
 * 格式化订单营养摘要
 */
function formatNutritionSummary(nutrition) {
  if (!nutrition) return '';
  const parts = [];
  if (nutrition.calories) parts.push(`${nutrition.calories}kcal`);
  if (nutrition.protein) parts.push(`${nutrition.protein}g蛋白`);
  if (nutrition.fat) parts.push(`${nutrition.fat}g脂肪`);
  if (nutrition.carbs) parts.push(`${nutrition.carbs}g碳水`);
  return parts.join('/') || '无';
}

/**
 * 格式化精简营养摘要（适合AI大模型）
 * 显示所有非零营养元素，使用完整名称
 */
function formatCompactNutritionSummary(nutrition) {
  if (!nutrition) return '无';
  const parts = [];
  if (nutrition.calories && nutrition.calories > 0) {
    parts.push(`${Math.round(nutrition.calories)}千卡`);
  }
  if (nutrition.protein && nutrition.protein > 0) {
    parts.push(`蛋白质${Math.round(nutrition.protein)}g`);
  }
  if (nutrition.fat && nutrition.fat > 0) {
    parts.push(`脂肪${Math.round(nutrition.fat)}g`);
  }
  if (nutrition.carbs && nutrition.carbs > 0) {
    parts.push(`碳水化合物${Math.round(nutrition.carbs)}g`);
  }
  return parts.join(' ') || '无';
}

module.exports = {
  generateASCIITable,
  generateCompactASCIITable,
  generateMarkdownTable,
  formatNutritionSummary,
  formatCompactNutritionSummary
};

