/**
 * Retorna o intervalo de datas (início e fim) para um determinado mês e ano.
 * 
 * @param {number} month - Mês (1-12).
 * @param {number} year - Ano.
 * @returns {{startDate: string, endDate: string}} Datas formatadas como YYYY-MM-DD.
 */
function getMonthRange(month, year) {
  const m = String(month).padStart(2, '0');
  const lastDay = new Date(year, month, 0).getDate();
  return { startDate: `${year}-${m}-01`, endDate: `${year}-${m}-${lastDay}` };
}

/**
 * Calcula o mês e ano anterior com base em um ponto de referência.
 * 
 * @param {number} month 
 * @param {number} year 
 * @returns {{month: number, year: number}}
 */
function getPreviousMonth(month, year) {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

/**
 * Calcula a variação percentual entre dois valores.
 * 
 * @param {number} current - Valor atual.
 * @param {number} previous - Valor anterior.
 * @returns {number} Percentual de variação.
 */
function calcDeltaPct(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat(((current - previous) / previous * 100).toFixed(2));
}

module.exports = { getMonthRange, getPreviousMonth, calcDeltaPct };
