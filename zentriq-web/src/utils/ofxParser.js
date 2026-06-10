export const parseOFX = (ofxString) => {
  const transactions = [];
  
  // Extrai as tags <STMTTRN> que representam cada transação
  const stmttrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
  let match;

  while ((match = stmttrnRegex.exec(ofxString)) !== null) {
    const trnData = match[1];

    // Tipo
    const typeMatch = /<TRNTYPE>(.+)/.exec(trnData);
    const trnType = typeMatch ? typeMatch[1].trim() : '';

    // Valor
    const amtMatch = /<TRNAMT>(.+)/.exec(trnData);
    let amount = 0;
    if (amtMatch) {
      amount = parseFloat(amtMatch[1].trim().replace(',', '.'));
    }

    // Nome/Descrição
    const memoMatch = /<MEMO>(.+)/.exec(trnData);
    const nameMatch = /<NAME>(.+)/.exec(trnData);
    let description = '';
    if (nameMatch) {
      description = nameMatch[1].trim();
    } else if (memoMatch) {
      description = memoMatch[1].trim();
    }

    // Data
    const dtMatch = /<DTPOSTED>([0-9]{8})/.exec(trnData);
    let date = new Date().toISOString().split('T')[0]; // Default today
    if (dtMatch) {
      const year = dtMatch[1].substring(0, 4);
      const month = dtMatch[1].substring(4, 6);
      const day = dtMatch[1].substring(6, 8);
      date = `${year}-${month}-${day}`;
    }

    // Determina o tipo (Receita ou Despesa)
    // No OFX, débitos são negativos e créditos são positivos
    let finalType = 'expense';
    if (amount > 0) {
      finalType = 'income';
    } else {
      amount = Math.abs(amount); // Remove o sinal negativo para o banco de dados
    }

    if (amount > 0) {
      transactions.push({
        type: finalType,
        amount: amount,
        description: description || 'Transação OFX',
        date: date
      });
    }
  }

  // Ordena por data (mais antigas primeiro)
  return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
};
