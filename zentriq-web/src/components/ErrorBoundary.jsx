import React from 'react';

/**
 * ErrorBoundary - Captura erros de renderização no React para evitar a "tela branca".
 * Este componente exibe uma interface amigável de recuperação em caso de falha crítica.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Atualiza o estado para exibir a UI reserva no próximo render
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Você pode enviar o erro para um serviço de log aqui
    console.error("ErrorBoundary capturou um erro:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#111827',
          color: '#F3F4F6',
          fontFamily: 'Inter, system-ui, sans-serif',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{ color: '#EF4444', marginBottom: '16px' }}>Oops! Algo deu errado.</h1>
          <p style={{ color: '#9CA3AF', marginBottom: '24px', maxWidth: '400px' }}>
            A aplicação encontrou um erro inesperado e não pôde continuar. 
            Não se preocupe, seus dados estão seguros.
          </p>
          <div style={{
            background: '#1F2937',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '12px',
            color: '#FCA5A5',
            fontFamily: 'monospace',
            maxWidth: '90%',
            overflow: 'auto'
          }}>
            {this.state.error?.toString()}
          </div>
          <button
            onClick={this.handleReload}
            style={{
              backgroundColor: '#10B981',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#10B981'}
          >
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
