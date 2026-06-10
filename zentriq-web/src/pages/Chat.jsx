import { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Bot, MessageSquare, AlertCircle } from 'lucide-react';
import { chatApi } from '../api/chat';
import styles from './Chat.module.css';

const QUICK_QUESTIONS = [
  'Qual o saldo das minhas contas?',
  'Como estão as minhas metas?',
  'Como está o limite dos meus orçamentos?',
  'Quanto gastei com Lazer?'
];

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const chatEndRef = useRef(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await chatApi.list();
      setMessages(res.data);
    } catch (err) {
      console.error('Erro ao carregar histórico do chat', err);
      setErrorMessage('Não foi possível carregar as conversas anteriores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Mantém a rolagem da tela no fim do chat
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend || textToSend.trim() === '' || sending) return;

    const messageContent = textToSend.trim();
    setSending(true);
    setErrorMessage('');
    setInputText('');

    // Adiciona temporariamente a mensagem do usuário no layout do chat
    const tempUserMsg = {
      id: `temp-user-${Date.now()}`,
      sender: 'user',
      text: messageContent,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await chatApi.send(messageContent);
      
      // Substitui as mensagens temporárias pelas oficiais geradas no backend
      setMessages(prev => {
        // Remove a mensagem temporária para evitar duplicados e adiciona as salvas do backend
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, res.data.userMessage, res.data.assistantMessage];
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem', err);
      setErrorMessage(err.response?.data?.message || 'Falha ao processar resposta do assistente.');
      
      // Remove a mensagem temporária se falhou
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Deseja apagar permanentemente todo o histórico desta conversa?')) {
      return;
    }
    setErrorMessage('');
    try {
      await chatApi.clear();
      setMessages([]);
    } catch (err) {
      console.error('Erro ao limpar histórico', err);
      setErrorMessage('Não foi possível limpar o histórico.');
    }
  };

  // Parser leve e customizado de Markdown para o Bate-papo do ZenTriq
  const renderMarkdown = (text) => {
    if (!text) return '';

    // Sanitiza e formata estilos de texto simples
    let html = text
      .replace(/\r\n/g, '\n')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');

    // Mapeamento e parser de Tabelas em Markdown
    const lines = html.split('\n');
    let inTable = false;
    let tableRows = [];
    const parsedLines = [];

    for (let line of lines) {
      if (line.trim().startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        if (line.includes('---') || line.includes(':---')) {
          continue;
        }
        const cols = line.split('|').map(c => c.trim()).filter((c, i, arr) => i > 0 && i < arr.length - 1);
        tableRows.push(cols);
      } else {
        if (inTable) {
          inTable = false;
          let tableHtml = '<table>';
          tableRows.forEach((row, rowIndex) => {
            tableHtml += '<tr>';
            row.forEach(col => {
              if (rowIndex === 0) {
                tableHtml += `<th>${col}</th>`;
              } else {
                tableHtml += `<td>${col}</td>`;
              }
            });
            tableHtml += '</tr>';
          });
          tableHtml += '</table>';
          parsedLines.push(tableHtml);
        }
        parsedLines.push(line);
      }
    }

    if (inTable) {
      let tableHtml = '<table>';
      tableRows.forEach((row, rowIndex) => {
        tableHtml += '<tr>';
        row.forEach(col => {
          if (rowIndex === 0) {
            tableHtml += `<th>${col}</th>`;
          } else {
            tableHtml += `<td>${col}</td>`;
          }
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table>';
      parsedLines.push(tableHtml);
    }

    // Processamento de listas e cabeçalhos em Markdown
    let finalHtml = parsedLines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        return `<li>${trimmed.substring(2)}</li>`;
      }
      if (trimmed.startsWith('* ')) {
        return `<li>${trimmed.substring(2)}</li>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3>${trimmed.substring(4)}</h3>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2>${trimmed.substring(3)}</h2>`;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        return `<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`;
      }
      if (trimmed.includes('<table>') || trimmed.includes('<tr>') || trimmed.includes('<h3>') || trimmed.includes('<h2>') || trimmed.includes('<li>')) {
        return trimmed;
      }
      return trimmed ? `<p>${trimmed}</p>` : '';
    }).join('\n');

    // Envelopa os <li> em tags de lista <ul> correspondentes
    finalHtml = finalHtml.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

    return <div dangerouslySetInnerHTML={{ __html: finalHtml }} />;
  };

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2>Assistente Financeiro IA</h2>
          <p>Bata um papo, peça conselhos econômicos ou faça consultas locais.</p>
        </div>
        {messages.length > 0 && (
          <button className={styles.clearBtn} onClick={handleClearHistory} title="Limpar conversa">
            <Trash2 size={14} />
            Limpar Chat
          </button>
        )}
      </div>

      {/* Área Principal de Mensagens */}
      <div className={styles.chatArea}>
        {errorMessage && (
          <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center', margin: '0 0 16px 0' }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {loading ? (
          <div className={styles.emptyState}>Carregando mensagens do assistente...</div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <Bot size={48} style={{ color: 'var(--color-primary)', opacity: 0.8 }} />
            <h3>Olá, sou o ZenTriq AI!</h3>
            <p>
              Estou pronto para ajudar você com insights financeiros. Se possuir a chave da API Gemini ativa em 'Configurações',
              pode me perguntar qualquer conselho ou estimativa. Se preferir, digite "ajuda" para ver os comandos locais offline.
            </p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`${styles.messageRow} ${m.sender === 'user' ? styles.userRow : styles.assistantRow}`}>
              <div className={styles.bubble}>
                {m.sender === 'assistant' ? renderMarkdown(m.text) : m.text}
              </div>
            </div>
          ))
        )}

        {/* Indicador animado de digitação da IA */}
        {sending && (
          <div className={`${styles.messageRow} ${styles.assistantRow}`}>
            <div className={styles.bubble} style={{ minWidth: '80px' }}>
              <div className={styles.typingIndicator}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Atalhos rápidos / Chips de perguntas */}
      {!loading && (
        <div className={styles.suggestionsWrap}>
          <span className={styles.suggestionsTitle}>Perguntas sugeridas</span>
          <div className={styles.suggestions}>
            {QUICK_QUESTIONS.map((q, idx) => (
              <button 
                key={idx} 
                className={styles.suggestionChip} 
                onClick={() => handleSendMessage(q)}
                disabled={sending}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Caixa de Entrada de Texto */}
      <div className={styles.footer}>
        <form onSubmit={handleSubmit} className={styles.inputBar}>
          <input
            type="text"
            className={styles.input}
            placeholder="Digite sua dúvida ou comando (ex: 'Qual meu saldo?')..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className={styles.sendBtn} disabled={!inputText.trim() || sending}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
