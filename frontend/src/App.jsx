import { useEffect, useMemo, useRef, useState } from 'react';
import api from './services/api';
import BiCharts from './components/BiCharts';
import CapsuleFormModal from './components/CapsuleFormModal';
import CapsuleDetailModal from './components/CapsuleDetailModal';
import WhatsappProfileModal from './components/WhatsappProfileModal';
import AuthPage from './components/AuthPage';
import {
  CAPSULE_SCOPES,
  CAPSULE_THEMES,
  INITIAL_CAPSULES,
  formatRemainingTime,
  getScopeMeta,
  getThemeMeta,
  isCapsuleUnlocked,
} from './constants/capsuleCategories';
import './App.css';

const STORAGE_KEY = 'maquina_do_tempo_capsules_v1';

function loadStoredCapsules() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CAPSULES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CAPSULES;
  } catch {
    return INITIAL_CAPSULES;
  }
}

let googleScriptPromise;

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () =>
        reject(new Error('Não foi possível carregar o login do Google.'));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
}

const DEMO_CONNECTED_USER = {
  id: 'usr-demo-777',
  name: 'Gustavo Geraldo',
  email: 'gustavo@maquinadotempo.com',
  phoneNumber: '+5511999998888',
  whatsappConsentAt: '2026-01-01T00:00:00.000Z',
};

function App() {
  const buttonRef = useRef(null);
  const [user, setUser] = useState(DEMO_CONNECTED_USER); // Inicia como conectado para o teste do usuário!
  const [currentView, setCurrentView] = useState('app');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [capsules, setCapsules] = useState(loadStoredCapsules);
  const [loadingCapsules, setLoadingCapsules] = useState(false);
  const [capsuleError, setCapsuleError] = useState('');
  const [capsuleNotice, setCapsuleNotice] = useState('');
  const [savingCapsule, setSavingCapsule] = useState(false);
  const [showWhatsappProfile, setShowWhatsappProfile] = useState(false);

  // Navegação e Modais do Dashboard
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'capsules' | 'actions'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'table' | 'cards'
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCapsuleId, setSelectedCapsuleId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Slicers / Filtros estilo Microsoft Power BI
  const [selectedScope, setSelectedScope] = useState('todos');
  const [selectedTheme, setSelectedTheme] = useState('todos');
  const [selectedStatus, setSelectedStatus] = useState('todos'); // 'todos' | 'locked' | 'unlocked'
  const [searchQuery, setSearchQuery] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Verifica se há sessão real no backend; caso não haja, mantém DEMO_CONNECTED_USER
  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
        const response = await api.get('/auth/me');
        if (active && response.data?.user) {
          setUser(response.data.user);
        }
      } catch {
        // Modo teste conectado preservado caso a API esteja offline
      }
    }

    loadSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    let refreshing = false;

    async function refreshCapsules() {
      if (refreshing) return;
      refreshing = true;

      try {
        const response = await api.get('/capsules');
        if (active && Array.isArray(response.data?.capsules) && response.data.capsules.length > 0) {
          setCapsules(response.data.capsules);
          setCapsuleError('');
        }
      } catch {
        // Se a rota falhar ou estiver offline, usa os dados locais de demonstração sem travar
        if (active) {
          setCapsules((prev) => (prev && prev.length > 0 ? prev : loadStoredCapsules()));
        }
      } finally {
        refreshing = false;
        if (active) setLoadingCapsules(false);
      }
    }

    refreshCapsules();
    const refreshInterval = window.setInterval(refreshCapsules, 30000);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
    };
  }, [user?.id]);

  // Renderiza botão Google quando o modal de autenticação estiver aberto
  useEffect(() => {
    if (!showAuthModal || !clientId || user || loadingAuth) return undefined;

    let active = true;
    const buttonElement = buttonRef.current;
    loadGoogleIdentity()
      .then(() => {
        if (!active || !buttonElement) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async ({ credential }) => {
            setSubmittingAuth(true);
            setAuthError('');

            try {
              const response = await api.post('/auth/google', { credential });
              setUser(response.data.user);
              setShowAuthModal(false);
            } catch (requestError) {
              setAuthError(
                requestError.response?.data?.message ||
                  'Não foi possível entrar com Google.',
              );
            } finally {
              setSubmittingAuth(false);
            }
          },
        });

        window.google.accounts.id.renderButton(buttonElement, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 300,
        });
      })
      .catch((loadError) => {
        if (active) setAuthError(loadError.message);
      });

    return () => {
      active = false;
      if (buttonElement) buttonElement.replaceChildren();
    };
  }, [clientId, loadingAuth, showAuthModal, user]);

  async function handleLogout() {
    setSubmittingAuth(true);
    setAuthError('');

    try {
      await api.post('/auth/logout');
    } catch (requestError) {
      setAuthError(
        requestError.response?.data?.message || 'Não foi possível encerrar sua sessão.',
      );
    } finally {
      setUser(null);
      setCapsules([]);
      setSelectedCapsuleId(null);
      setShowWhatsappProfile(false);
      setSubmittingAuth(false);
      setCurrentView('auth');
    }
  }

  async function handleAuthSubmission(authPayload) {
    try {
      const endpoint = authPayload.mode === 'register' ? '/auth/register' : '/auth/login';
      const response = await api.post(endpoint, authPayload);
      if (response.data?.user) {
        setUser(response.data.user);
        setCurrentView('app');
      }
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        // Fallback elegante para visualização fluida se a rota local ainda não estiver no backend
        setUser({
          id: 'user-preview-1',
          name: authPayload.name || authPayload.email.split('@')[0],
          email: authPayload.email,
        });
        setCurrentView('app');
        return;
      }
      throw err;
    }
  }

  // Filtragem Cruzada (Power BI Slicers)
  const filteredCapsules = useMemo(() => {
    return (capsules || []).filter((cap) => {
      if (!cap) return false;
      if (selectedScope !== 'todos' && cap.scope !== selectedScope) return false;
      if (selectedTheme !== 'todos' && cap.theme !== selectedTheme) return false;

      const unlocked = isCapsuleUnlocked(cap);
      if (selectedStatus === 'locked' && unlocked) return false;
      if (selectedStatus === 'unlocked' && !unlocked) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (cap.title || '').toLowerCase().includes(q);
        const matchEmail = (cap.recipientEmail || '').toLowerCase().includes(q);
        const matchMood = (cap.mood || '').toLowerCase().includes(q);
        if (!matchTitle && !matchEmail && !matchMood) return false;
      }

      return true;
    });
  }, [capsules, selectedScope, selectedTheme, selectedStatus, searchQuery]);

  // Métricas KPI baseadas nas cápsulas filtradas
  const kpiStats = useMemo(() => {
    const total = filteredCapsules.length;
    const unlockedList = filteredCapsules.filter(
      (c) => isCapsuleUnlocked(c),
    );
    const lockedList = filteredCapsules.filter(
      (c) => !isCapsuleUnlocked(c),
    );

    const personalCount = filteredCapsules.filter((c) => c.scope === 'pessoal').length;
    const professionalCount = filteredCapsules.filter(
      (c) => c.scope === 'profissional',
    ).length;

    const nextToUnlock = [...lockedList].sort(
      (a, b) => new Date(a.unlockDate).getTime() - new Date(b.unlockDate).getTime(),
    )[0];

    const allActions = filteredCapsules.flatMap((c) => c.actionItems || []);
    const doneActions = allActions.filter((a) => a.done).length;

    return {
      total,
      unlockedCount: unlockedList.length,
      lockedCount: lockedList.length,
      personalCount,
      professionalCount,
      nextToUnlock,
      totalActions: allActions.length,
      doneActions,
    };
  }, [filteredCapsules]);

  const selectedCapsule = useMemo(
    () => capsules.find((c) => c.id === selectedCapsuleId) || null,
    [capsules, selectedCapsuleId],
  );

  function handleOpenCreate() {
    setCapsuleError('');
    setCapsuleNotice('');
    setIsCreateOpen(true);
  }

  async function handleCreateCapsule(newCapsule) {
    if (!user) {
      setCapsules((prev) => {
        const next = [newCapsule, ...prev];
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignora quota
        }
        return next;
      });
      setCapsuleNotice('Cápsula registrada no modo demonstração com sucesso.');
      setIsCreateOpen(false);
      return;
    }

    setSavingCapsule(true);
    setCapsuleError('');

    try {
      const response = await api.post('/capsules', newCapsule);
      setCapsules((prev) => [response.data.capsule, ...prev]);
      setCapsuleNotice(response.data.deliveryNotice || '');
      setIsCreateOpen(false);
    } catch (requestError) {
      setCapsuleError(
        requestError.response?.data?.message || 'Não foi possível salvar a cápsula no servidor.',
      );
    } finally {
      setSavingCapsule(false);
    }
  }

  async function handleToggleActionItem(capsuleId, actionId) {
    const capsule = capsules.find((item) => item.id === capsuleId);
    if (!capsule) return;

    const actionItems = (capsule.actionItems || []).map((item) =>
      item.id === actionId ? { ...item, done: !item.done } : item,
    );

    if (!user) {
      setCapsules((prev) => {
        const next = prev.map((item) => (item.id === capsuleId ? { ...item, actionItems } : item));
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignora quota
        }
        return next;
      });
      return;
    }

    try {
      const response = await api.patch(`/capsules/${capsuleId}/actions`, { actionItems });
      setCapsules((prev) =>
        prev.map((item) => (item.id === capsuleId ? response.data.capsule : item)),
      );
      setCapsuleError('');
    } catch (requestError) {
      setCapsuleError(
        requestError.response?.data?.message || 'Não foi possível atualizar as metas.',
      );
    }
  }

  async function handleDeleteCapsule(capsuleId) {
    if (!user) {
      setCapsules((prev) => {
        const next = prev.filter((cap) => cap.id !== capsuleId);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignora quota
        }
        return next;
      });
      return;
    }

    try {
      await api.delete(`/capsules/${capsuleId}`);
      setCapsules((prev) => prev.filter((cap) => cap.id !== capsuleId));
      setCapsuleError('');
    } catch (requestError) {
      setCapsuleError(
        requestError.response?.data?.message || 'Não foi possível excluir a cápsula.',
      );
    }
  }

  async function handleSaveWhatsappProfile(profile) {
    const response = await api.patch('/profile/whatsapp', profile);
    setUser(response.data.user);
    setShowWhatsappProfile(false);
  }

  function handleForceOpen(capsuleId) {
    setCapsules((prev) =>
      prev.map((cap) =>
        cap.id === capsuleId ? { ...cap, isOpened: true, isUnlocked: true } : cap,
      ),
    );
  }

  function handleResetFilters() {
    setSelectedScope('todos');
    setSelectedTheme('todos');
    setSelectedStatus('todos');
    setSearchQuery('');
  }

  const hasActiveFilters =
    selectedScope !== 'todos' ||
    selectedTheme !== 'todos' ||
    selectedStatus !== 'todos' ||
    searchQuery.trim() !== '';

  if (currentView === 'auth') {
    return (
      <>
        <AuthPage
          onAuthenticate={handleAuthSubmission}
          onGoogleSignIn={() => setShowAuthModal(true)}
          onBypassToDashboard={() => setCurrentView('app')}
        />
        {showAuthModal && (
          <div
            className="bi-modal-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
          >
            <div className="bi-modal-card bi-modal-sm">
              <header className="bi-modal-header">
                <div>
                  <span className="bi-panel-kicker">CONTA &amp; SESSÃO</span>
                  <h2 id="auth-modal-title">Conectar Conta Google</h2>
                </div>
                <button
                  type="button"
                  className="bi-icon-close"
                  onClick={() => setShowAuthModal(false)}
                >
                  ✕
                </button>
              </header>

              <div className="bi-auth-modal-body">
                <p>
                  Autentique-se com sua conta Google para vincular suas cápsulas ao servidor
                  PostgreSQL/Prisma.
                </p>
                <div className="google-login" ref={buttonRef} />
                {!clientId && (
                  <p className="setup-hint">
                    Configure <code>VITE_GOOGLE_CLIENT_ID</code> no arquivo <code>.env</code>{' '}
                    para habilitar o botão oficial do Google.
                  </p>
                )}
                {authError && (
                  <p className="error-message" role="alert">
                    {authError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`bi-workspace ${mobileMenuOpen ? 'mobile-menu-active' : ''}`}>
      {/* Barra Superior Mobile */}
      <div className="bi-mobile-header">
        <div className="bi-brand-mini">
          <span className="bi-emblem-mini" aria-hidden="true">⌛</span>
          <strong>Máquina do Tempo</strong>
        </div>
        <button
          type="button"
          className="bi-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay para fechar drawer no celular */}
      {mobileMenuOpen && (
        <div
          className="bi-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar estilo Power BI com Tema Cápsula do Tempo */}
      <aside className={`bi-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="bi-brand">
          <div className="bi-brand-logo" aria-hidden="true">
            ⌛
          </div>
          <div>
            <strong>Máquina do Tempo</strong>
            <span>BI Analytics &amp; Cápsulas</span>
          </div>
        </div>

        <nav className="bi-nav" aria-label="Menu principal">
          <button
            type="button"
            className={`bi-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <span>📊</span> Visão Geral (Power BI)
          </button>
          <button
            type="button"
            className={`bi-nav-item ${activeTab === 'capsules' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('capsules');
              setMobileMenuOpen(false);
            }}
          >
            <span>🗂️</span> Todas as Cápsulas ({capsules.length})
          </button>
          <button
            type="button"
            className={`bi-nav-item ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('actions');
              setMobileMenuOpen(false);
            }}
          >
            <span>🎯</span> Informações &amp; Metas a Fazer
          </button>
          <button
            type="button"
            className="bi-nav-item"
            onClick={() => {
              setCurrentView('auth');
              setMobileMenuOpen(false);
            }}
          >
            <span>🔐</span> Selamento / Login
          </button>
        </nav>

        <div className="bi-sidebar-cta">
          <button
            type="button"
            className="bi-btn-primary bi-btn-full"
            onClick={() => {
              handleOpenCreate();
              setMobileMenuOpen(false);
            }}
          >
            + Nova Cápsula do Tempo
          </button>
        </div>

        {/* Resumo rápido por categoria na barra lateral */}
        <div className="bi-sidebar-summary">
          <p className="bi-sidebar-title">RELAÇÕES / CATEGORIAS</p>
          {CAPSULE_THEMES.map((theme) => {
            const count = capsules.filter((c) => c.theme === theme.id).length;
            return (
              <button
                key={theme.id}
                type="button"
                className={`bi-sidebar-cat ${selectedTheme === theme.id ? 'active' : ''}`}
                onClick={() =>
                  setSelectedTheme(selectedTheme === theme.id ? 'todos' : theme.id)
                }
              >
                <span>
                  {theme.icon} {theme.label}
                </span>
                <span className="bi-sidebar-badge">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Rodapé de Sessão do Usuário */}
        <div className="bi-sidebar-user">
          {user ? (
            <div className="bi-user-card">
              <div className="bi-user-avatar">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="bi-user-info">
                <strong>{user.name || 'Usuário'}</strong>
                <small>{user.email}</small>
              </div>
              <button
                type="button"
                className="bi-btn-ghost-sm"
                onClick={() => setShowWhatsappProfile(true)}
              >
                WhatsApp
              </button>
              <button
                type="button"
                className="bi-btn-ghost-sm"
                onClick={handleLogout}
                disabled={submittingAuth}
              >
                Sair
              </button>
            </div>
          ) : (
            <div className="bi-user-card-guest">
              <div>
                <strong>Modo Desconectado</strong>
                <small>Explore livremente ou reconecte seu perfil</small>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', width: '100%' }}>
                <button
                  type="button"
                  className="bi-btn-primary bi-btn-full"
                  onClick={() => setUser(DEMO_CONNECTED_USER)}
                >
                  ⚡ Reconectar como Gustavo (Teste)
                </button>
                <button
                  type="button"
                  className="bi-btn-secondary bi-btn-full"
                  onClick={() => setCurrentView('auth')}
                >
                  🔐 Criar Senha / Entrar
                </button>
                <button
                  type="button"
                  className="bi-btn-secondary bi-btn-full"
                  onClick={() => setShowAuthModal(true)}
                >
                  Entrar com Google
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Área Principal do Dashboard */}
      <div className="bi-main">
        {/* Topbar com Título e Ações */}
        <header className="bi-topbar">
          <div>
            <span className="bi-topbar-kicker">PAINEL EXECUTIVO • MICROSOFT BI STYLE</span>
            <h1>
              {activeTab === 'dashboard' && 'Dashboard de Cápsulas do Tempo'}
              {activeTab === 'capsules' && 'Catálogo Detalhado de Cápsulas'}
              {activeTab === 'actions' && 'Plano de Metas & Informações a Fazer'}
            </h1>
          </div>

          <div className="bi-topbar-actions">
            {!user && (
              <button
                type="button"
                className="bi-btn-secondary"
                onClick={() => setCurrentView('auth')}
              >
                🔐 Criar Senha / Entrar
              </button>
            )}
            <div className="bi-search-box">
              <span aria-hidden="true">🔍</span>
              <input
                type="search"
                placeholder="Buscar cápsula por título, e-mail ou humor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="bi-btn-primary"
              onClick={handleOpenCreate}
            >
              + Criar Cápsula
            </button>
          </div>
        </header>

        {capsuleError && (
          <p className="error-message bi-capsule-alert" role="alert">
            {capsuleError}
          </p>
        )}
        {capsuleNotice && (
          <p className="bi-loading-note" role="status">{capsuleNotice}</p>
        )}
        {loadingCapsules && (
          <p className="bi-loading-note" role="status">Carregando cápsulas da sua conta...</p>
        )}

        {/* Barra de Segmentação de Dados (Power BI Slicers) */}
        <section className="bi-slicer-bar" aria-label="Filtros de segmentação de dados">
          <div className="bi-slicer-group">
            <span className="bi-slicer-label">ESCOPO:</span>
            <button
              type="button"
              className={`bi-slicer-chip ${selectedScope === 'todos' ? 'active' : ''}`}
              onClick={() => setSelectedScope('todos')}
            >
              Todos
            </button>
            {CAPSULE_SCOPES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`bi-slicer-chip ${selectedScope === s.id ? 'active' : ''}`}
                onClick={() =>
                  setSelectedScope(selectedScope === s.id ? 'todos' : s.id)
                }
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          <div className="bi-slicer-group">
            <span className="bi-slicer-label">RELAÇÃO / TEMA:</span>
            <button
              type="button"
              className={`bi-slicer-chip ${selectedTheme === 'todos' ? 'active' : ''}`}
              onClick={() => setSelectedTheme('todos')}
            >
              Todos
            </button>
            {CAPSULE_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`bi-slicer-chip ${selectedTheme === t.id ? 'active' : ''}`}
                onClick={() =>
                  setSelectedTheme(selectedTheme === t.id ? 'todos' : t.id)
                }
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="bi-slicer-group">
            <span className="bi-slicer-label">STATUS:</span>
            <button
              type="button"
              className={`bi-slicer-chip ${selectedStatus === 'todos' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('todos')}
            >
              Todas
            </button>
            <button
              type="button"
              className={`bi-slicer-chip ${selectedStatus === 'locked' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('locked')}
            >
              🔒 No Tempo ({kpiStats.lockedCount})
            </button>
            <button
              type="button"
              className={`bi-slicer-chip ${selectedStatus === 'unlocked' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('unlocked')}
            >
              🔓 Liberadas ({kpiStats.unlockedCount})
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                className="bi-slicer-clear"
                onClick={handleResetFilters}
              >
                ✕ Limpar Filtros
              </button>
            )}
          </div>
        </section>

        {/* Cartões KPI Superiores estilo Power BI */}
        <section className="bi-kpi-strip" aria-label="Indicadores chave de desempenho">
          <article className="bi-kpi-card accent-indigo">
            <div className="bi-kpi-top">
              <span>TOTAL DE CÁPSULAS</span>
              <span className="bi-kpi-icon">📦</span>
            </div>
            <strong className="bi-kpi-value">{kpiStats.total}</strong>
            <p className="bi-kpi-sub">
              👤 {kpiStats.personalCount} Pessoal • 💼 {kpiStats.professionalCount}{' '}
              Profissional
            </p>
          </article>

          <article className="bi-kpi-card accent-amber">
            <div className="bi-kpi-top">
              <span>CÁPSULAS NO TEMPO (TRANCADAS)</span>
              <span className="bi-kpi-icon">🔒</span>
            </div>
            <strong className="bi-kpi-value">{kpiStats.lockedCount}</strong>
            <p className="bi-kpi-sub">Aguardando a data futura programada</p>
          </article>

          <article className="bi-kpi-card accent-emerald">
            <div className="bi-kpi-top">
              <span>CÁPSULAS LIBERADAS</span>
              <span className="bi-kpi-icon">🔓</span>
            </div>
            <strong className="bi-kpi-value">{kpiStats.unlockedCount}</strong>
            <p className="bi-kpi-sub">Disponíveis para leitura imediata</p>
          </article>

          <article className="bi-kpi-card accent-sky">
            <div className="bi-kpi-top">
              <span>PRÓXIMA ABERTURA</span>
              <span className="bi-kpi-icon">⏳</span>
            </div>
            <strong className="bi-kpi-value bi-kpi-value-sm">
              {kpiStats.nextToUnlock
                ? formatRemainingTime(kpiStats.nextToUnlock.unlockDate)
                : 'Nenhuma pendente'}
            </strong>
            <p className="bi-kpi-sub" title={kpiStats.nextToUnlock?.title}>
              {kpiStats.nextToUnlock
                ? kpiStats.nextToUnlock.title
                : 'Todas as cápsulas já foram abertas'}
            </p>
          </article>

          <article className="bi-kpi-card accent-rose">
            <div className="bi-kpi-top">
              <span>METAS / AÇÕES A FAZER</span>
              <span className="bi-kpi-icon">🎯</span>
            </div>
            <strong className="bi-kpi-value">
              {kpiStats.doneActions}/{kpiStats.totalActions}
            </strong>
            <p className="bi-kpi-sub">Compromissos concluídos até a abertura</p>
          </article>
        </section>

        {/* Aba: Visão Geral (Gráficos Power BI + Tabela de Cápsulas com Títulos) */}
        {activeTab === 'dashboard' && (
          <>
            <BiCharts
              capsules={filteredCapsules}
              selectedScope={selectedScope}
              selectedTheme={selectedTheme}
              onSelectScope={setSelectedScope}
              onSelectTheme={setSelectedTheme}
            />

            {/* Lista e Tabela de Cápsulas com Títulos e Todos os Campos */}
            <section className="bi-table-panel">
              <header className="bi-table-header">
                <div>
                  <span className="bi-panel-kicker">REGISTROS DETALHADOS</span>
                  <h2>Cápsulas do Tempo Cadastradas ({filteredCapsules.length})</h2>
                </div>
                <div className="bi-view-switcher">
                  <button
                    type="button"
                    className={viewMode === 'split' ? 'active' : ''}
                    onClick={() => setViewMode('split')}
                  >
                    Tabela + Cards
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'table' ? 'active' : ''}
                    onClick={() => setViewMode('table')}
                  >
                    Apenas Tabela BI
                  </button>
                  <button
                    type="button"
                    className={viewMode === 'cards' ? 'active' : ''}
                    onClick={() => setViewMode('cards')}
                  >
                    Apenas Cards
                  </button>
                </div>
              </header>

              {(viewMode === 'split' || viewMode === 'table') && (
                <div className="bi-table-responsive">
                  <table className="bi-data-table">
                    <thead>
                      <tr>
                        <th>Título da Cápsula</th>
                        <th>Escopo</th>
                        <th>Relação / Tema</th>
                        <th>Data de Abertura</th>
                        <th>Contagem / Status</th>
                        <th>Destinatário</th>
                        <th>Metas</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCapsules.map((cap) => {
                        const scopeMeta = getScopeMeta(cap.scope);
                        const themeMeta = getThemeMeta(cap.theme);
                        const unlocked = isCapsuleUnlocked(cap);
                        const doneCount = (cap.actionItems || []).filter((i) => i.done).length;
                        const totalCount = (cap.actionItems || []).length;

                        return (
                          <tr key={cap.id}>
                            <td>
                              <button
                                type="button"
                                className="bi-table-title-btn"
                                onClick={() => setSelectedCapsuleId(cap.id)}
                              >
                                <strong>{cap.title}</strong>
                                <small>Humor: {cap.mood || 'Normal'} • Prioridade {cap.priority || 'Média'}</small>
                              </button>
                            </td>
                            <td>
                              <span
                                className="bi-pill"
                                style={{
                                  color: scopeMeta.color,
                                  backgroundColor: scopeMeta.bgLight,
                                }}
                              >
                                {scopeMeta.icon} {scopeMeta.label}
                              </span>
                            </td>
                            <td>
                              <span
                                className="bi-pill"
                                style={{
                                  color: themeMeta.color,
                                  backgroundColor: themeMeta.bgLight,
                                }}
                              >
                                {themeMeta.icon} {themeMeta.label}
                              </span>
                            </td>
                            <td>
                              {new Date(cap.unlockDate).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td>
                              <span
                                className={`bi-status-pill ${unlocked ? 'unlocked' : 'locked'}`}
                              >
                                {unlocked
                                  ? '🔓 Liberada'
                                  : `🔒 ${formatRemainingTime(cap.unlockDate)}`}
                              </span>
                            </td>
                            <td className="bi-td-email">
                              {cap.recipientEmail || 'Próprio usuário'}
                            </td>
                            <td>
                              <span className="bi-goal-counter">
                                {doneCount}/{totalCount}
                              </span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="bi-btn-table"
                                onClick={() => setSelectedCapsuleId(cap.id)}
                              >
                                {unlocked ? 'Ler Cápsula' : 'Inspecionar'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {(viewMode === 'split' || viewMode === 'cards') && (
                <div className="bi-cards-grid">
                  {filteredCapsules.map((cap) => {
                    const scopeMeta = getScopeMeta(cap.scope);
                    const themeMeta = getThemeMeta(cap.theme);
                    const unlocked = isCapsuleUnlocked(cap);
                    const doneCount = (cap.actionItems || []).filter((i) => i.done).length;
                    const totalCount = (cap.actionItems || []).length;

                    return (
                      <article key={cap.id} className="bi-capsule-card">
                        <div className="bi-capsule-card-top">
                          <div className="bi-capsule-badges">
                            <span
                              className="bi-pill"
                              style={{
                                color: scopeMeta.color,
                                backgroundColor: scopeMeta.bgLight,
                              }}
                            >
                              {scopeMeta.icon} {scopeMeta.label}
                            </span>
                            <span
                              className="bi-pill"
                              style={{
                                color: themeMeta.color,
                                backgroundColor: themeMeta.bgLight,
                              }}
                            >
                              {themeMeta.icon} {themeMeta.label}
                            </span>
                          </div>
                          <span
                            className={`bi-status-pill ${unlocked ? 'unlocked' : 'locked'}`}
                          >
                            {unlocked ? '🔓 Aberta' : '🔒 Trancada'}
                          </span>
                        </div>

                        <h3 className="bi-capsule-card-title">{cap.title}</h3>

                        <p className="bi-capsule-preview">
                          {unlocked
                            ? cap.message
                            : '🔒 Mensagem lacrada até a data de abertura programada.'}
                        </p>

                        <div className="bi-capsule-card-meta">
                          <div>
                            <small>Abertura</small>
                            <strong>
                              {new Date(cap.unlockDate).toLocaleDateString('pt-BR')}
                            </strong>
                          </div>
                          <div>
                            <small>Status Temporal</small>
                            <strong>{formatRemainingTime(cap.unlockDate)}</strong>
                          </div>
                          <div>
                            <small>Metas</small>
                            <strong>
                              {doneCount}/{totalCount} concluídas
                            </strong>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="bi-btn-secondary bi-btn-full"
                          onClick={() => setSelectedCapsuleId(cap.id)}
                        >
                          {unlocked ? '📖 Abrir e Ler Mensagem' : '⏳ Ver Detalhes e Metas'}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}

        {/* Aba: Catálogo de Cápsulas */}
        {activeTab === 'capsules' && (
          <section className="bi-table-panel">
            <header className="bi-table-header">
              <div>
                <span className="bi-panel-kicker">CATÁLOGO COMPLETO</span>
                <h2>Todas as Cápsulas com Títulos e Classificações ({filteredCapsules.length})</h2>
              </div>
              <button
                type="button"
                className="bi-btn-primary"
                onClick={handleOpenCreate}
              >
                + Adicionar Cápsula
              </button>
            </header>

            <div className="bi-cards-grid">
              {filteredCapsules.map((cap) => {
                const scopeMeta = getScopeMeta(cap.scope);
                const themeMeta = getThemeMeta(cap.theme);
                const unlocked = isCapsuleUnlocked(cap);
                return (
                  <article key={cap.id} className="bi-capsule-card">
                    <div className="bi-capsule-card-top">
                      <div className="bi-capsule-badges">
                        <span
                          className="bi-pill"
                          style={{
                            color: scopeMeta.color,
                            backgroundColor: scopeMeta.bgLight,
                          }}
                        >
                          {scopeMeta.icon} {scopeMeta.label}
                        </span>
                        <span
                          className="bi-pill"
                          style={{
                            color: themeMeta.color,
                            backgroundColor: themeMeta.bgLight,
                          }}
                        >
                          {themeMeta.icon} {themeMeta.label}
                        </span>
                      </div>
                      <span className={`bi-status-pill ${unlocked ? 'unlocked' : 'locked'}`}>
                        {unlocked ? '🔓 Liberada' : '🔒 Trancada'}
                      </span>
                    </div>

                    <h3 className="bi-capsule-card-title">{cap.title}</h3>
                    <p className="bi-capsule-preview">
                      {unlocked
                        ? cap.message
                        : '🔒 Conteúdo protegido até a data de abertura.'}
                    </p>

                    <div className="bi-capsule-card-meta">
                      <div>
                        <small>Destinatário</small>
                        <strong>{cap.recipientEmail || 'Uso próprio'}</strong>
                      </div>
                      <div>
                        <small>Contagem</small>
                        <strong>{formatRemainingTime(cap.unlockDate)}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="bi-btn-secondary bi-btn-full"
                      onClick={() => setSelectedCapsuleId(cap.id)}
                    >
                      Gerenciar Cápsula
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Aba: Informações & Metas a Fazer */}
        {activeTab === 'actions' && (
          <section className="bi-actions-board">
            <div className="bi-table-panel">
              <header className="bi-table-header">
                <div>
                  <span className="bi-panel-kicker">PLANEJAMENTO PRÁTICO</span>
                  <h2>Informações e Ações a Realizar Antes da Abertura das Cápsulas</h2>
                </div>
                <button
                  type="button"
                  className="bi-btn-primary"
                  onClick={handleOpenCreate}
                >
                  + Nova Cápsula com Metas
                </button>
              </header>

              <div className="bi-actions-grid">
                {filteredCapsules.map((cap) => {
                  const scopeMeta = getScopeMeta(cap.scope);
                  const themeMeta = getThemeMeta(cap.theme);
                  return (
                    <article key={cap.id} className="bi-action-card">
                      <div className="bi-action-card-header">
                        <div className="bi-capsule-badges">
                          <span
                            className="bi-pill"
                            style={{
                              color: scopeMeta.color,
                              backgroundColor: scopeMeta.bgLight,
                            }}
                          >
                            {scopeMeta.icon} {scopeMeta.label}
                          </span>
                          <span
                            className="bi-pill"
                            style={{
                              color: themeMeta.color,
                              backgroundColor: themeMeta.bgLight,
                            }}
                          >
                            {themeMeta.icon} {themeMeta.label}
                          </span>
                        </div>
                        <small>{formatRemainingTime(cap.unlockDate)}</small>
                      </div>

                      <h3>{cap.title}</h3>

                      <ul className="bi-checklist">
                        {(cap.actionItems || []).map((item) => (
                          <li key={item.id} className={item.done ? 'done' : ''}>
                            <label>
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => handleToggleActionItem(cap.id, item.id)}
                              />
                              <span>{item.text}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Modal de Criação de Cápsula com Todos os Campos */}
      {isCreateOpen && (
        <CapsuleFormModal
          onClose={() => setIsCreateOpen(false)}
          onSave={handleCreateCapsule}
          accountEmail={user?.email || ''}
          whatsappReady={Boolean(user?.phoneNumber && user?.whatsappConsentAt)}
          onConfigureWhatsapp={() => setShowWhatsappProfile(true)}
          saving={savingCapsule}
        />
      )}

      {/* Modal de Detalhes e Leitura da Cápsula */}
      {selectedCapsule && (
        <CapsuleDetailModal
          capsule={selectedCapsule}
          onClose={() => setSelectedCapsuleId(null)}
          onToggleActionItem={handleToggleActionItem}
          onForceOpen={handleForceOpen}
          onDelete={handleDeleteCapsule}
        />
      )}

      {/* Modal de Login Google */}
      {showAuthModal && (
        <div
          className="bi-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="bi-modal-card bi-modal-sm">
            <header className="bi-modal-header">
              <div>
                <span className="bi-panel-kicker">CONTA &amp; SESSÃO</span>
                <h2 id="auth-modal-title">Conectar Conta Google</h2>
              </div>
              <button
                type="button"
                className="bi-icon-close"
                onClick={() => setShowAuthModal(false)}
              >
                ✕
              </button>
            </header>

            <div className="bi-auth-modal-body">
              <p>
                Autentique-se com sua conta Google para vincular suas cápsulas ao servidor
                PostgreSQL/Prisma.
              </p>
              <div className="google-login" ref={buttonRef} />
              {!clientId && (
                <p className="setup-hint">
                  Configure <code>VITE_GOOGLE_CLIENT_ID</code> no arquivo <code>.env</code>{' '}
                  para habilitar o botão oficial do Google.
                </p>
              )}

              {showWhatsappProfile && user && (
                <WhatsappProfileModal
                  user={user}
                  onClose={() => setShowWhatsappProfile(false)}
                  onSave={handleSaveWhatsappProfile}
                />
              )}
              {authError && (
                <p className="error-message" role="alert">
                  {authError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
