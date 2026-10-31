import { useState } from 'react';
import './AuthPage.css';

/**
 * AuthPage - Página de Autenticação com estética de "Cápsula do Tempo"
 * Design System: Bronze envelhecido, ouro fosco, vidro hermético (glassmorphism) e matte cosmic obsidian.
 */
export default function AuthPage({
  onAuthenticate,
  onGoogleSignIn,
  onBypassToDashboard,
}) {
  // Modo 'login' ou 'register'
  const [mode, setMode] = useState('login');

  // Estados dos campos do formulário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberDevice: true,
  });

  // Visibilidade de senhas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de feedback e envio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const isLogin = mode === 'login';

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMessage) setErrorMessage('');
  }

  function handleModeToggle(newMode) {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validações básicas
    const cleanEmail = formData.email.trim();
    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu endereço de e-mail.');
      return;
    }

    if (!formData.password) {
      setErrorMessage('Por favor, insira sua senha de acesso.');
      return;
    }

    if (!isLogin) {
      if (!formData.name.trim()) {
        setErrorMessage('Por favor, informe como devemos te chamar.');
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage('A senha de selamento deve conter pelo menos 6 caracteres.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage('As senhas digitadas não coincidem.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (onAuthenticate) {
        await onAuthenticate({
          mode,
          name: formData.name.trim(),
          email: cleanEmail,
          password: formData.password,
          rememberDevice: formData.rememberDevice,
        });
      } else {
        // Simulação elegante para preview de UI/UX
        await new Promise((resolve) => setTimeout(resolve, 900));
        setSuccessMessage(
          isLogin
            ? 'Cápsula desbloqueada. Carregando suas memórias...'
            : 'Cápsula forjada com sucesso! Bem-vindo ao portal temporal.',
        );
        if (onBypassToDashboard) {
          setTimeout(onBypassToDashboard, 800);
        }
      }
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          'Falha no selamento. Verifique suas credenciais temporais.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPassword(e) {
    e.preventDefault();
    alert(
      'Instruções de recuperação foram enviadas para os registros do seu e-mail cadastrado.',
    );
  }

  return (
    <main className="time-chamber">
      {/* Luz ambiente e anéis temporais no fundo */}
      <div className="time-aurora" aria-hidden="true" />
      <div className="time-rings" aria-hidden="true">
        <div className="ring ring-outer" />
        <div className="ring ring-inner" />
      </div>

      {/* Card Flutuante / Visor Selado (Glassmorphism + Moldura de Bronze) */}
      <div className="capsule-chassis">
        <section
          className="capsule-visor"
          aria-labelledby="capsule-heading"
        >
          {/* Marca / Monograma da Cápsula */}
          <header className="capsule-header">
            <div className="capsule-emblem" aria-hidden="true">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="emblem-svg"
              >
                {/* Aro externo com gravações */}
                <circle
                  cx="24"
                  cy="24"
                  r="21"
                  stroke="url(#bronzeGradient)"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="17"
                  stroke="url(#goldGradient)"
                  strokeWidth="1.2"
                />
                {/* Ampulheta minimalista esculpida */}
                <path
                  d="M17 14H31M17 34H31M19 14L24 23L29 14M19 34L24 25L29 34M24 23V25"
                  stroke="url(#goldGradient)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Partícula de luz no centro da ampulheta */}
                <circle cx="24" cy="24" r="1.5" fill="#f5eedc" />
                <defs>
                  <linearGradient id="bronzeGradient" x1="0" y1="0" x2="48" y2="48">
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="50%" stopColor="#9a7138" />
                    <stop offset="100%" stopColor="#5c3f1c" />
                  </linearGradient>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="36" y2="36">
                    <stop offset="0%" stopColor="#fae5aa" />
                    <stop offset="60%" stopColor="#cfa043" />
                    <stop offset="100%" stopColor="#8c6426" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <span className="capsule-kicker">MÁQUINA DO TEMPO • ACERVO VIVO</span>
            <h1 id="capsule-heading" className="capsule-title">
              {isLogin ? 'Tranque suas memórias.' : 'Forje seu legado.'}
            </h1>
            <p className="capsule-tagline">
              {isLogin
                ? 'Acesse suas mensagens, promessas e registros guardados no tempo.'
                : 'Crie sua cápsula selada e receba suas cartas quando o futuro chegar.'}
            </p>
          </header>

          {/* Botão Oficial / Entrada Social com Google */}
          <div className="social-entrance">
            <button
              type="button"
              className="google-capsule-btn"
              onClick={onGoogleSignIn}
              aria-label={isLogin ? 'Entrar com o Google' : 'Cadastrar com o Google'}
            >
              <svg
                className="google-icon"
                viewBox="0 0 24 24"
                width="20"
                height="20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-3.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>{isLogin ? 'Entrar com o Google' : 'Cadastrar com o Google'}</span>
            </button>
          </div>

          {/* Divisor Visual Sépia / Bronze com Texto 'ou' */}
          <div className="vault-divider" role="separator">
            <span className="divider-line" />
            <span className="divider-label">ou</span>
            <span className="divider-line" />
          </div>

          {/* Mensagens de Sucesso ou Erro Acessíveis */}
          {errorMessage && (
            <div className="vault-alert error-alert" role="alert">
              <span className="alert-icon" aria-hidden="true">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="vault-alert success-alert" role="status">
              <span className="alert-icon" aria-hidden="true">✨</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulário Tradicional (E-mail e Senha) */}
          <form onSubmit={handleSubmit} className="vault-form" noValidate>
            {/* Campo Nome (Aparece dinamicamente no cadastro) */}
            {!isLogin && (
              <div className="form-group animate-slide-down">
                <label htmlFor="user-name" className="field-label">
                  Nome Completo
                </label>
                <div className="input-frame">
                  <input
                    id="user-name"
                    name="name"
                    type="text"
                    placeholder="Como você quer ser lembrado?"
                    value={formData.name}
                    onChange={handleInputChange}
                    autoComplete="name"
                    required
                  />
                  <span className="input-ornament" aria-hidden="true">📜</span>
                </div>
              </div>
            )}

            {/* Campo E-mail */}
            <div className="form-group">
              <label htmlFor="user-email" className="field-label">
                Endereço de E-mail
              </label>
              <div className="input-frame">
                <input
                  id="user-email"
                  name="email"
                  type="email"
                  placeholder="guardiao@memoria.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  autoComplete="email"
                  required
                />
                <span className="input-ornament" aria-hidden="true">✉️</span>
              </div>
            </div>

            {/* Campo Senha */}
            <div className="form-group">
              <div className="field-label-row">
                <label htmlFor="user-password" className="field-label">
                  Senha Secreta
                </label>
                {isLogin && (
                  <a
                    href="#recuperar"
                    onClick={handleForgotPassword}
                    className="discrete-link"
                  >
                    Esqueceu sua senha?
                  </a>
                )}
              </div>
              <div className="input-frame">
                <input
                  id="user-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Chave de selamento"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  className="toggle-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha em texto'}
                >
                  {showPassword ? (
                    // Ícone Olho Fechado
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    // Ícone Olho Aberto
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha (Modo Cadastro) */}
            {!isLogin && (
              <div className="form-group animate-slide-down">
                <label htmlFor="user-confirm-password" className="field-label">
                  Confirme a Senha
                </label>
                <div className="input-frame">
                  <input
                    id="user-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repita sua chave de selamento"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Exibir confirmação de senha'}
                  >
                    {showConfirmPassword ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Checkbox Discreto de Lembrança */}
            <div className="remember-row">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="rememberDevice"
                  checked={formData.rememberDevice}
                  onChange={handleInputChange}
                />
                <span className="custom-check" aria-hidden="true" />
                <span className="checkbox-text">Manter este dispositivo conectado no tempo</span>
              </label>
            </div>

            {/* Botão de Ação Principal (Bronze / Ouro Fosco com Brilho de Ativação) */}
            <button
              type="submit"
              className="capsule-submit-btn"
              disabled={isSubmitting}
            >
              <span className="btn-glow" aria-hidden="true" />
              <span className="btn-content">
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Calibrando Cápsula...</span>
                  </>
                ) : isLogin ? (
                  <>
                    <span className="btn-icon">⏳</span>
                    <span>Destrancar &amp; Entrar</span>
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔒</span>
                    <span>Selar &amp; Criar Conta</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Alternância de Tela: Cadastro vs Login */}
          <footer className="capsule-footer">
            <p className="toggle-auth-prompt">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <button
                type="button"
                className="toggle-auth-action"
                onClick={() => handleModeToggle(isLogin ? 'register' : 'login')}
              >
                {isLogin ? 'Cadastre-se' : 'Entre'}
              </button>
            </p>

            {/* Acesso rápido opcional para explorar o Dashboard diretamente */}
            {onBypassToDashboard && (
              <button
                type="button"
                className="view-dashboard-shortcut"
                onClick={onBypassToDashboard}
              >
                ← Voltar para o Dashboard de Demonstração
              </button>
            )}
          </footer>
        </section>
      </div>

      {/* Frase / Selo de Autenticidade no Rodapé da Tela */}
      <aside className="time-preservation-seal" aria-label="Aviso de segurança e preservação">
        <span>EST. 2026 • PROTOCOLO DE PRESERVAÇÃO HISTÓRICA E CRIPTOGRAFIA</span>
      </aside>
    </main>
  );
}

