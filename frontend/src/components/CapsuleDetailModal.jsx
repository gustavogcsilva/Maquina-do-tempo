import {
  formatRemainingTime,
  getScopeMeta,
  getThemeMeta,
  isCapsuleUnlocked,
} from '../constants/capsuleCategories';

export default function CapsuleDetailModal({
  capsule,
  onClose,
  onToggleActionItem,
  onForceOpen,
  onDelete,
}) {
  if (!capsule) return null;

  const scopeMeta = getScopeMeta(capsule.scope);
  const themeMeta = getThemeMeta(capsule.theme);
  const unlocked = isCapsuleUnlocked(capsule);

  const formattedUnlock = new Date(capsule.unlockDate).toLocaleString('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const formattedCreated = new Date(capsule.createdAt).toLocaleDateString('pt-BR', {
    dateStyle: 'medium',
  });
  const deliveryStatuses = {
    scheduled: 'Agendado',
    ready: 'Aguardando provedor',
    sent: 'Enviado',
    failed: 'Cancelado ou falhou',
  };
  const deliverySummary = (capsule.deliveries || [])
    .map(
      (delivery) =>
        `${delivery.channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}: ${
          deliveryStatuses[delivery.status] || delivery.status
        }`,
    )
    .join(' • ');

  return (
    <div
      className="bi-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="bi-modal-card">
        <header className="bi-modal-header">
          <div>
            <div className="bi-detail-badges">
              <span
                className="bi-pill"
                style={{ color: scopeMeta.color, backgroundColor: scopeMeta.bgLight }}
              >
                {scopeMeta.icon} {scopeMeta.label}
              </span>
              <span
                className="bi-pill"
                style={{ color: themeMeta.color, backgroundColor: themeMeta.bgLight }}
              >
                {themeMeta.icon} {themeMeta.label}
              </span>
              <span className={`bi-status-pill ${unlocked ? 'unlocked' : 'locked'}`}>
                {unlocked ? '🔓 Liberada' : '🔒 Trancada no Tempo'}
              </span>
            </div>
            <h2 id="detail-modal-title">{capsule.title}</h2>
          </div>
          <button
            type="button"
            className="bi-icon-close"
            onClick={onClose}
            aria-label="Fechar detalhes"
          >
            ✕
          </button>
        </header>

        <div className="bi-detail-body">
          <div className="bi-detail-meta-grid">
            <div className="bi-meta-box">
              <small>Criada em</small>
              <strong>{formattedCreated}</strong>
            </div>
            <div className="bi-meta-box">
              <small>Data de Abertura</small>
              <strong>{formattedUnlock}</strong>
            </div>
            <div className="bi-meta-box">
              <small>Tempo Restante</small>
              <strong>{formatRemainingTime(capsule.unlockDate)}</strong>
            </div>
            <div className="bi-meta-box">
              <small>Destinatário / Humor</small>
              <strong>
                {capsule.recipientEmail || 'Uso próprio'} • {capsule.mood || 'Normal'}
              </strong>
            </div>
            <div className="bi-meta-box">
              <small>Envios programados</small>
              <strong>{deliverySummary || 'Sem notificações externas'}</strong>
            </div>
          </div>

          <div className="bi-detail-message-section">
            <h3>Mensagem Guardada na Cápsula</h3>
            {unlocked ? (
              <div className="bi-unlocked-message">
                <p>{capsule.message || 'Mensagem aberta e preservada com sucesso.'}</p>
              </div>
            ) : (
              <div className="bi-locked-vault">
                <div className="bi-vault-icon">⏳</div>
                <strong>Conteúdo protegido até {formattedUnlock}</strong>
                <p>
                  Esta cápsula ainda está viajando no tempo. Você pode acompanhar suas
                  metas abaixo; o conteúdo só ficará disponível na data programada.
                </p>
                {onForceOpen && (
                  <button
                    type="button"
                    className="bi-btn-secondary"
                    style={{ marginTop: '12px' }}
                    onClick={() => onForceOpen(capsule.id)}
                  >
                    🔓 Simular Abertura Agora (Teste)
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="bi-detail-actions-section">
            <h3>
              Informações &amp; Metas a Cumprir ({(capsule.actionItems || []).filter((i) => i.done).length}/
              {(capsule.actionItems || []).length})
            </h3>
            {!capsule.actionItems || capsule.actionItems.length === 0 ? (
              <p className="bi-muted">Nenhuma meta cadastrada para esta cápsula.</p>
            ) : (
              <ul className="bi-checklist">
                {capsule.actionItems.map((item) => (
                  <li key={item.id} className={item.done ? 'done' : ''}>
                    <label>
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => onToggleActionItem(capsule.id, item.id)}
                      />
                      <span>{item.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <footer className="bi-modal-footer bi-modal-footer-split">
          <button
            type="button"
            className="bi-btn-danger"
            onClick={() => {
              onDelete(capsule.id);
              onClose();
            }}
          >
            Excluir Cápsula
          </button>
          <button type="button" className="bi-btn-primary" onClick={onClose}>
            Concluído
          </button>
        </footer>
      </div>
    </div>
  );
}
