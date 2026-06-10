export const parseCSV = (csvString) => {
  const transactions = [];
  const lines = csvString.split(/\r?\n/);
  
  // Assume header is first line: Data, Descricao, Valor
  // or simple format without header. We will try to guess or skip header.
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple split by comma or semicolon
    const separator = line.includes(';') ? ';' : ',';
    const cols = line.split(separator).map(c => c.trim().replace(/^"|"$/g, ''));

    if (cols.length >= 3) {
      // Trying to guess Data, Descricao, Valor
      // Very basic heuristic for simple CSVs
      const dataStr = cols[0];
      const descStr = cols[1];
      const valStr = cols[2];

      // Skip header
      if (i === 0 && Number.isNaN(parseFloat(valStr.replace(',', '.')))) {
        continue;
      }

      // Format Date DD/MM/YYYY or YYYY-MM-DD
      let date = new Date().toISOString().split('T')[0];
      if (dataStr.includes('/')) {
        const parts = dataStr.split('/');
        if (parts[0].length === 2 && parts[2]?.length === 4) {
          date = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      } else if (dataStr.includes('-')) {
        date = dataStr;
      }

      let amount = parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
      if (Number.isNaN(amount)) continue;

      let type = 'expense';
      if (amount > 0) {
        type = 'income';
      } else {
        amount = Math.abs(amount);
      }

      transactions.push({
        type,
        amount,
        description: descStr || 'Transação CSV',
        date
      });
    }
  }

  return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
};
