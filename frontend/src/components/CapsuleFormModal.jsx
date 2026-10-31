import { useState } from 'react';
import { CAPSULE_SCOPES, CAPSULE_THEMES } from '../constants/capsuleCategories';

const MOOD_OPTIONS = [
  'Esperançoso',
  'Determinado',
  'Grato',
  'Motivado',
  'Reflexivo',
  'Empolgado',
];

const PRIORITY_OPTIONS = ['Alta', 'Média', 'Baixa'];

function getDefaultFutureDate(monthsAhead = 6) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function CapsuleFormModal({
  onClose,
  onSave,
  accountEmail = '',
  whatsappReady,
  onConfigureWhatsapp,
  saving,
}) {
  const [title, setTitle] = useState('');
  const [scope, setScope] = useState('pessoal');
  const [theme, setTheme] = useState('amor');
  const [unlockDateLocal, setUnlockDateLocal] = useState(() => getDefaultFutureDate(6));
  const [deliveryChannels, setDeliveryChannels] = useState(() =>
    whatsappReady ? ['email', 'whatsapp'] : ['email'],
  );
  const [mood, setMood] = useState('Esperançoso');
  const [priority, setPriority] = useState('Alta');
  const [message, setMessage] = useState('');
  const [newActionText, setNewActionText] = useState('');
  const [actionItems, setActionItems] = useState([
    { id: 'act-1', text: 'Revisar meus objetivos descritos nesta cápsula', done: false },
  ]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  function handlePresetDate(months) {
    setUnlockDateLocal(getDefaultFutureDate(months));
  }

  function handleSelectTheme(themeObj) {
    setTheme(themeObj.id);
    if (themeObj.recommendedScope) {
      setScope(themeObj.recommendedScope);
    }
  }

  function handleAddAction() {
    const trimmed = newActionText.trim();
    if (!trimmed || actionItems.length >= 50) return;
    setActionItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: trimmed, done: false },
    ]);
    setNewActionText('');
  }

  function handleRemoveAction(id) {
    setActionItems((prev) => prev.filter((item) => item.id !== id));
  }

  function validateForm() {
    const nextErrors = {};
    const cleanTitle = title.trim();
    const cleanMessage = message.trim();

    if (cleanTitle.length < 3) {
      nextErrors.title = 'O título deve ter no mínimo 3 caracteres.';
    } else if (cleanTitle.length > 100) {
      nextErrors.title = 'O título não deve ultrapassar 100 caracteres.';
    }

    if (cleanMessage.length < 1) {
      nextErrors.message = 'A mensagem é obrigatória.';
    } else if (cleanMessage.length > 10000) {
      nextErrors.message = 'A mensagem contém muitos caracteres (máx. 10.000).';
    }

    const parsedDate = new Date(unlockDateLocal);
    if (!unlockDateLocal || Number.isNaN(parsedDate.getTime())) {
      nextErrors.unlockDate = 'Informe uma data e hora válidas.';
    } else if (parsedDate.getTime() <= Date.now()) {
      nextErrors.unlockDate = 'A data de abertura precisa estar no futuro.';
    }

    if (deliveryChannels.includes('whatsapp') && !whatsappReady) {
      nextErrors.deliveryChannels =
        'Configure seu WhatsApp e aceite o envio nas preferências da conta.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validateForm()) return;

    const isoUnlockDate = new Date(unlockDateLocal).toISOString();

    setSubmitError('');
    try {
      await onSave({
        title: title.trim(),
        message: message.trim(),
        scope,
        theme,
        unlockDate: isoUnlockDate,
        mood,
        priority,
        actionItems,
        deliveryChannels,
      });
    } catch (error) {
      setSubmitError(error.response?.data?.message || 'Não foi possível salvar a cápsula.');
    }
  }

  return (
    <div className="bi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-form-title">
      <div className="bi-modal-card bi-modal-large">
        <header className="bi-modal-header">
          <div>
            <span className="bi-panel-kicker">CADASTRO COMPLETO</span>
            <h2 id="modal-form-title">Criar Nova Cápsula do Tempo</h2>
          </div>
          <button type="button" className="bi-icon-close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="bi-capsule-form" noValidate>
          {/* 1. Seleção Pessoal vs Profissional */}
          <div className="bi-form-section">
            <label className="bi-form-label">
              1. Escopo da Cápsula <span className="req">*</span>
            </label>
            <div className="bi-scope-selector">
              {CAPSULE_SCOPES.map((item) => {
                const active = scope === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`bi-choice-card ${active ? 'active' : ''}`}
                    style={
                      active
                        ? { borderColor: item.color, backgroundColor: item.bgLight }
                        : undefined
                    }
                    onClick={() => setScope(item.id)}
                  >
                    <span className="bi-choice-icon">{item.icon}</span>
                    <div className="bi-choice-text">
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </div>
                    <span className="bi-choice-radio">{active ? '●' : '○'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Seleção de Tema: Amor, Trabalho, Crescimento Pessoal, Religião */}
          <div className="bi-form-section">
            <label className="bi-form-label">
              2. Categoria / Relação Principal <span className="req">*</span>
            </label>
            <div className="bi-theme-selector">
              {CAPSULE_THEMES.map((item) => {
                const active = theme === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`bi-theme-card ${active ? 'active' : ''}`}
                    style={
                      active
                        ? { borderColor: item.color, backgroundColor: item.bgLight }
                        : undefined
                    }
                    onClick={() => handleSelectTheme(item)}
                  >
                    <div className="bi-theme-card-top">
                      <span className="bi-theme-emoji">{item.icon}</span>
                      <strong>{item.label}</strong>
                    </div>
                    <small>{item.description}</small>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Título e Data de Abertura */}
          <div className="bi-form-grid-2">
            <div className="bi-form-field">
              <label htmlFor="capsule-title" className="bi-form-label">
                3. Título da Cápsula <span className="req">*</span>
              </label>
              <input
                id="capsule-title"
                type="text"
                placeholder="Ex.: Metas de carreira para 2028 ou Carta para nossa família"
                value={title}
                maxLength={100}
                onChange={(e) => setTitle(e.target.value)}
                className={errors.title ? 'input-error' : ''}
              />
              <div className="bi-field-helper">
                <span>Mínimo 3 caracteres</span>
                <span>{title.trim().length}/100</span>
              </div>
              {errors.title && <p className="bi-field-error">{errors.title}</p>}
            </div>

            <div className="bi-form-field">
              <label htmlFor="capsule-unlock-date" className="bi-form-label">
                4. Data e Hora de Desbloqueio <span className="req">*</span>
              </label>
              <input
                id="capsule-unlock-date"
                type="datetime-local"
                value={unlockDateLocal}
                onChange={(e) => setUnlockDateLocal(e.target.value)}
                className={errors.unlockDate ? 'input-error' : ''}
              />
              <div className="bi-date-presets">
                <span>Atalhos:</span>
                <button type="button" onClick={() => handlePresetDate(1)}>+1 Mês</button>
                <button type="button" onClick={() => handlePresetDate(6)}>+6 Meses</button>
                <button type="button" onClick={() => handlePresetDate(12)}>+1 Ano</button>
                <button type="button" onClick={() => handlePresetDate(60)}>+5 Anos</button>
              </div>
              {errors.unlockDate && <p className="bi-field-error">{errors.unlockDate}</p>}
            </div>
          </div>

          {/* 4. Destino da entrega, Humor e Prioridade */}
          <div className="bi-form-grid-3">
            <div className="bi-form-field">
              <span className="bi-form-label">5. Entrega para sua conta</span>
              <p className="bi-muted">E-mail verificado: {accountEmail}</p>
              <label className="bi-delivery-option">
                <input
                  type="checkbox"
                  checked={deliveryChannels.includes('email')}
                  onChange={(event) =>
                    setDeliveryChannels((channels) =>
                      event.target.checked
                        ? [...channels, 'email']
                        : channels.filter((channel) => channel !== 'email'),
                    )
                  }
                />
                <span>Enviar conteúdo completo por e-mail quando liberar</span>
              </label>
              <label className="bi-delivery-option">
                <input
                  type="checkbox"
                  checked={deliveryChannels.includes('whatsapp')}
                  disabled={!whatsappReady}
                  onChange={(event) =>
                    setDeliveryChannels((channels) =>
                      event.target.checked
                        ? [...channels, 'whatsapp']
                        : channels.filter((channel) => channel !== 'whatsapp'),
                    )
                  }
                />
                <span>Enviar conteúdo completo por WhatsApp quando liberar</span>
              </label>
              {!whatsappReady && (
                <div className="bi-field-helper">
                  <span>Cadastre seu número e aceite o envio para ativar o WhatsApp.</span>
                  <button type="button" className="bi-btn-ghost-sm" onClick={onConfigureWhatsapp}>
                    Configurar WhatsApp
                  </button>
                </div>
              )}
              {errors.deliveryChannels && (
                <p className="bi-field-error">{errors.deliveryChannels}</p>
              )}
            </div>

            <div className="bi-form-field">
              <label htmlFor="capsule-mood" className="bi-form-label">
                6. Sentimento no Momento
              </label>
              <select
                id="capsule-mood"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
              >
                {MOOD_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="bi-form-field">
              <label htmlFor="capsule-priority" className="bi-form-label">
                7. Relevância / Prioridade
              </label>
              <select
                id="capsule-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Mensagem Principal */}
          <div className="bi-form-field">
            <label htmlFor="capsule-message" className="bi-form-label">
              8. Mensagem da Cápsula do Tempo <span className="req">*</span>
            </label>
            <textarea
              id="capsule-message"
              rows={4}
              placeholder="Escreva sua carta, reflexão, oração, plano de carreira ou promessa para o futuro..."
              value={message}
              maxLength={10000}
              onChange={(e) => setMessage(e.target.value)}
              className={errors.message ? 'input-error' : ''}
            />
            <div className="bi-field-helper">
              <span>O conteúdo permanece protegido até a data de abertura.</span>
              <span>{message.trim().length}/10000 caracteres</span>
            </div>
            {errors.message && <p className="bi-field-error">{errors.message}</p>}
          </div>

          {/* 6. Informações / Metas a se fazer até a abertura */}
          <div className="bi-form-field">
            <label className="bi-form-label">
              9. Informações e Metas a Cumprir até a Abertura (Checklist Futuro)
            </label>
            <div className="bi-action-adder">
              <input
                type="text"
                placeholder="Adicione uma ação ou meta (ex.: Concluir pós-graduação, fazer viagem em família...)"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAction();
                  }
                }}
              />
              <button type="button" className="bi-btn-secondary" onClick={handleAddAction}>
                + Adicionar Meta
              </button>
            </div>

            {actionItems.length > 0 && (
              <ul className="bi-action-preview-list">
                {actionItems.map((item) => (
                  <li key={item.id}>
                    <span>🎯 {item.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(item.id)}
                      aria-label="Remover item"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <footer className="bi-modal-footer">
            <button type="button" className="bi-btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="bi-btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : '🔒 Lacrar e Programar Cápsula'}
            </button>
          </footer>
          {submitError && <p className="error-message" role="alert">{submitError}</p>}
        </form>
      </div>
    </div>
  );
}
