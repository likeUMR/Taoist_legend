/**
 * 通用数字格式化工具
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '';
  if (num >= 10000) {
    return (num / 10000).toFixed(2).replace(/\.?0+$/, '') + '万';
  }
  // 最多保留2位小数，并去掉末尾无用的0
  return parseFloat(num.toFixed(2)).toString();
}
