/**
 * 通用数字格式化工具
 * @param {number} num 
 * @param {boolean} floor 为 true 时执行向下取整 (适用于金币、精华等)
 * @returns {string}
 */
export function formatNumber(num, floor = false) {
  if (num === null || num === undefined) return '';
  
  const processedNum = floor ? Math.floor(num) : num;
  const absNum = Math.abs(processedNum);
  let result = '';
  
  if (absNum >= 1e12) {
    result = (processedNum / 1e12).toFixed(2).replace(/\.?0+$/, '') + '兆';
  } else if (absNum >= 1e8) {
    result = (processedNum / 1e8).toFixed(2).replace(/\.?0+$/, '') + '亿';
  } else if (absNum >= 1e4) {
    result = (processedNum / 1e4).toFixed(2).replace(/\.?0+$/, '') + '万';
  } else {
    // 小于1万的数
    if (floor) {
      result = processedNum.toString();
    } else {
      // 非货币类型，最多保留2位小数
      result = parseFloat(processedNum.toFixed(2)).toString();
    }
  }
  
  return result;
}
