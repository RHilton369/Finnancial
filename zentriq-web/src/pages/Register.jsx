import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Eye, EyeOff } from 'lucide-react';
import styles from '../components/ui/FormPages.module.css';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', monthly_income: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = {};

    if (form.password !== form.confirm) errs.confirm = 'Senhas não coincidem';
    if (form.password.length < 6) errs.password = 'Senha deve ter pelo menos 6 caracteres';

    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setErrors({});
    setLoading(true);
    try {
      await import('../api/auth').then(m =>
        m.authApi.register({
          name: form.name,
          email: form.email,
          password: form.password,
          monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : 0
        })
      );
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_EXISTS') {
        setErrors({ email: 'Email já cadastrado' });
      } else {
        setErrors({ general: 'Erro ao criar conta. Tente novamente.' });
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
          <h2>ZenTriq</h2>
          <p>Comece a controlar suas finanças hoje.</p>
        </div>
      </div>
      <div className={styles.formSide}>
        <div className={styles.formWrapper}>
          <div className={styles.mobileLogo}>
            <TrendingUp size={32} color="#1D9E75" />
            <h2>ZenTriq</h2>
          </div>
          <h1 className={styles.formTitle}>Criar conta</h1>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Nome completo</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Seu nome" required />
            </div>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="seu@email.com" required />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>
            <div className={styles.field}>
              <label>Senha</label>
              <div className={styles.passwordWrapper}>
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mínimo 6 caracteres" required />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
            </div>
            <div className={styles.field}>
              <label>Confirmar senha</label>
              <input type="password" value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})} placeholder="Repita a senha" required />
              {errors.confirm && <span className={styles.fieldError}>{errors.confirm}</span>}
            </div>
            <div className={styles.field}>
              <label>Renda mensal (opcional)</label>
              <input type="number" value={form.monthly_income} onChange={e => setForm({...form, monthly_income: e.target.value})} placeholder="Usado para calcular sua taxa de poupança" />
            </div>
            {errors.general && <div className={styles.errorAlert}>{errors.general}</div>}
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
            <p className={styles.linkText}>
              Já tem conta? <Link to="/login">Entrar</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
