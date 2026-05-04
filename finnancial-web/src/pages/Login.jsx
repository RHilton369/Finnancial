import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import styles from '../components/ui/FormPages.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'INVALID_CREDENTIALS') {
        setError('Email ou senha inválidos');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.imageSide}>
        <div className={styles.imageOverlay}>
          <TrendingUp size={48} color="white" />
          <h2>Finnancial</h2>
          <p>Controle seu dinheiro. Realize seus planos.</p>
        </div>
      </div>
      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <div className={styles.mobileLogo}>
            <TrendingUp size={32} color="#1D9E75" />
            <h2>Finnancial</h2>
          </div>
          <h1 className={styles.formTitle}>Entrar</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className={styles.field}>
              <label>Senha</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {error && <div className={styles.errorAlert}>{error}</div>}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
            <p className={styles.linkText}>
              Não tem conta? <Link to="/register">Criar conta</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
