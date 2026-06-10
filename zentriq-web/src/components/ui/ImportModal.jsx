import { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Select } from './Select';
import { FileText, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import { parseOFX } from '../../utils/ofxParser';
import { parseCSV } from '../../utils/csvParser';
import { formatCurrency } from '../../utils/format';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function ImportModal({ isOpen, onClose, accounts, onConfirm }) {
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const extension = selected.name.split('.').pop().toLowerCase();
      
      let parsed = [];
      try {
        if (extension === 'ofx') {
          parsed = parseOFX(content);
        } else if (extension === 'csv') {
          parsed = parseCSV(content);
        } else {
          toast.error('Formato não suportado. Use .ofx ou .csv');
          return;
        }
        
        if (parsed.length === 0) {
          toast.error('Nenhuma transação encontrada no arquivo.');
        } else {
          setTransactions(parsed);
          toast.success(`${parsed.length} transações identificadas!`);
        }
      } catch (err) {
        toast.error('Erro ao ler o arquivo.');
        console.error(err);
      }
    };
    reader.readAsText(selected);
  };

  const handleConfirm = async () => {
    if (!selectedAccount) return toast.error('Selecione uma conta destino');
    if (transactions.length === 0) return toast.error('Nenhuma transação para importar');

    const payload = transactions.map(t => ({
      ...t,
      account_id: selectedAccount
    }));

    setLoading(true);
    await onConfirm(payload);
    setLoading(false);
    
    // Reset
    setFile(null);
    setTransactions([]);
    onClose();
  };

  const handleClose = () => {
    setFile(null);
    setTransactions([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importar Extrato (OFX / CSV)" size="lg">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Conta Destino */}
        <div style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '500' }}>1. Selecione a Conta Destino</div>
          <Select 
            label=""
            options={accounts.map(a => ({ value: a.id, label: a.name }))}
            value={selectedAccount}
            onChange={setSelectedAccount}
          />
        </div>

        {/* Upload Área */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            padding: '30px', 
            border: '2px dashed var(--border-color)', 
            borderRadius: '8px', 
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: file ? 'var(--bg-secondary)' : 'transparent'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".ofx,.csv" 
            style={{ display: 'none' }} 
          />
          
          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
              <CheckCircle size={32} />
              <strong>{file.name}</strong>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Arquivo lido com sucesso.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <UploadCloud size={32} />
              <strong>Clique para buscar um arquivo .OFX ou .CSV</strong>
              <span style={{ fontSize: '13px' }}>Seu extrato bancário.</span>
            </div>
          )}
        </div>

        {/* Prévia das Transações */}
        {transactions.length > 0 && (
          <div>
            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '14px' }}>Prévia de Importação ({transactions.length} itens)</strong>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Data</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid var(--border-color)' }}>Descrição</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--border-color)' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>
                        {format(parseISO(t.date), "dd MMM yy", { locale: ptBR })}
                      </td>
                      <td style={{ padding: '8px 12px' }}>{t.description}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '500', color: t.type === 'income' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', background: 'rgba(255,160,0,0.1)', padding: '12px', borderRadius: '8px', gap: '8px', color: '#B27B00' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', lineHeight: 1.4 }}>
                Verifique se a conta selecionada está correta. A importação fará a inserção automática e atualizará o saldo. As transações ficarão "Sem Categoria".
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
          <Button 
            onClick={handleConfirm} 
            disabled={transactions.length === 0 || loading}
          >
            {loading ? 'Processando...' : `Importar ${transactions.length} Itens`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
