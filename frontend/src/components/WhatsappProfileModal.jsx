import { useState } from 'react';

export default function WhatsappProfileModal({ user, onClose, onSave }) {
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [whatsappConsent, setWhatsappConsent] = useState(Boolean(user.whatsappConsentAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (whatsappConsent && !/^\+[1-9]\d{7,14}$/.test(phoneNumber.trim())) {
      setError('Use o formato internacional, por exemplo +5511999999999.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        phoneNumber: phoneNumber.trim() || null,
        whatsappConsent,
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Não foi possível salvar suas preferências.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bi-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="whatsapp-profile-title">
      <section className="bi-modal-card bi-modal-sm">
        <header className="bi-modal-header">
          <div>
            <span className="bi-panel-kicker">PREFERÊNCIAS DA CONTA</span>
            <h2 id="whatsapp-profile-title">WhatsApp</h2>
          </div>
          <button type="button" className="bi-icon-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </header>

        <form className="bi-capsule-form" onSubmit={handleSubmit}>
          <p>As notificações serão destinadas ao proprietário da cápsula.</p>
          <p className="bi-muted">E-mail da conta: {user.email}</p>

          <label htmlFor="whatsapp-phone" className="bi-form-label">Número com código do país</label>
          <input
            id="whatsapp-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+5511999999999"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />

          <label className="bi-delivery-option">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(event) => setWhatsappConsent(event.target.checked)}
            />
            <span>
              Aceito receber o conteúdo completo das minhas cápsulas por WhatsApp na data programada.
            </span>
          </label>

          <p className="bi-muted">
            O envio ainda não está ativo: falta configurar e verificar um provedor de mensagens.
          </p>
          {error && <p className="error-message" role="alert">{error}</p>}

          <footer className="bi-modal-footer">
            <button type="button" className="bi-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="bi-btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar preferências'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
