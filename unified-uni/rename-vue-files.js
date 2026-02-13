const fs = require('fs');
const path = require('path');

// 转换为小驼峰命名的函数
function toCamelCase(name) {
    // 处理连字符命名
    if (name.includes('-')) {
        return name.split('-').map((part, index) => {
            if (index === 0) return part;
            return part.charAt(0).toUpperCase() + part.slice(1);
        }).join('');
    }
    // 处理 PascalCase
    if (name.charAt(0) === name.charAt(0).toUpperCase()) {
        return name.charAt(0).toLowerCase() + name.slice(1);
    }
    return name;
}

// 扫描目录获取所有vue文件
function scanVueFiles(dir) {
    const vueFiles = [];
    
    function scan(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                scan(fullPath);
            } else if (file.endsWith('.vue')) {
                vueFiles.push(fullPath);
            }
        }
    }
    
    scan(dir);
    return vueFiles;
}

// 主函数
function main() {
    const pagesDir = path.join(__dirname, 'pages');
    const vueFiles = scanVueFiles(pagesDir);
    const renameMap = {};
    
    console.log('Scanning vue files in pages directory...');
    
    // 重命名文件
    for (const filePath of vueFiles) {
        const dirPath = path.dirname(filePath);
        const fileName = path.basename(filePath);
        const baseName = path.parse(fileName).name;
        const ext = path.parse(fileName).ext;
        
        const newBaseName = toCamelCase(baseName);
        const newFileName = newBaseName + ext;
        const newFilePath = path.join(dirPath, newFileName);
        
        if (filePath !== newFilePath) {
            fs.renameSync(filePath, newFilePath);
            // 记录映射关系，使用相对路径
            const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
            const newRelativePath = path.relative(__dirname, newFilePath).replace(/\\/g, '/');
            renameMap[relativePath] = newRelativePath;
            console.log(`Renamed: ${relativePath} -> ${newRelativePath}`);
        } else {
            const relativePath = path.relative(__dirname, filePath).replace(/\\/g, '/');
            console.log(`Already camelCase: ${relativePath}`);
        }
    }
    
    // 保存映射关系到文件
    if (Object.keys(renameMap).length > 0) {
        fs.writeFileSync('rename-map.json', JSON.stringify(renameMap, null, 2));
        console.log('\nRename map saved to rename-map.json');
    } else {
        console.log('\nNo files were renamed.');
    }
}

main();
