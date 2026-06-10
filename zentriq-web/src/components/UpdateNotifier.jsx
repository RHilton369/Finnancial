import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, RefreshCw } from 'lucide-react';

const UpdateNotifier = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onUpdateAvailable((newVersion) => {
      setVersion(newVersion);
      setUpdateAvailable(true);
      toast('Nova versão disponível: v' + newVersion, {
        icon: '🚀',
        duration: 10000,
      });
    });

    window.electronAPI.onUpdateDownloaded(() => {
      setDownloaded(true);
      setUpdateAvailable(false);
      toast.success('Atualização baixada e pronta para instalar!', {
        duration: Infinity,
      });
    });
  }, []);

  if (!updateAvailable && !downloaded) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      background: 'var(--bg-secondary)',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      maxWidth: '300px',
      animation: 'slideIn 0.3s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ 
          background: 'var(--color-primary)', 
          padding: '8px', 
          borderRadius: '8px',
          color: 'white'
        }}>
          {downloaded ? <RefreshCw size={20} /> : <Download size={20} />}
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px' }}>
            {downloaded ? 'Pronto para atualizar!' : 'Nova versão ' + version}
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {downloaded ? 'Reinicie o app para aplicar as mudanças.' : 'Melhorias de segurança e performance disponíveis.'}
          </p>
        </div>
      </div>
      
      <button 
        onClick={() => downloaded ? window.electronAPI.installUpdate() : window.electronAPI.startDownload()}
        style={{
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          padding: '10px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          fontSize: '13px',
          transition: 'all 0.2s'
        }}
      >
        {downloaded ? 'Reiniciar e Instalar' : 'Baixar Agora'}
      </button>
      
      {!downloaded && (
        <button 
          onClick={() => setUpdateAvailable(false)}
          style={{
            background: 'transparent',
            color: 'var(--text-tertiary)',
            border: 'none',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          Lembrar mais tarde
        </button>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UpdateNotifier;
