import {
  CAPSULE_SCOPES,
  CAPSULE_THEMES,
  isCapsuleUnlocked,
} from '../constants/capsuleCategories';

export default function BiCharts({
  capsules = [],
  selectedScope,
  selectedTheme,
  onSelectScope,
  onSelectTheme,
}) {
  const safeCapsules = Array.isArray(capsules) ? capsules : [];
  const total = safeCapsules.length;

  // 1. Dados para o Gráfico de Rosca (Temas: Amor, Trabalho, Crescimento Pessoal, Religião)
  const themeStats = CAPSULE_THEMES.map((theme) => {
    const count = safeCapsules.filter((c) => c.theme === theme.id).length;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      ...theme,
      count,
      pct,
    };
  });

  // Geometria do SVG Donut Chart
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let accumulatedLength = 0;

  const donutSegments = themeStats.map((item) => {
    const fraction = total > 0 ? item.count / total : 0;
    const strokeLength = fraction * circumference;
    const segment = {
      ...item,
      strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
      strokeDashoffset: -accumulatedLength,
    };
    accumulatedLength += strokeLength;
    return segment;
  });

  // 2. Dados para Pessoal vs. Profissional (Gráfico de Barras Empilhadas / Comparativo Power BI)
  const scopeStats = CAPSULE_SCOPES.map((scope) => {
    const items = safeCapsules.filter((c) => c.scope === scope.id);
    const unlockedCount = items.filter(
      (c) => isCapsuleUnlocked(c),
    ).length;
    const lockedCount = items.length - unlockedCount;
    const pct = total > 0 ? Math.round((items.length / total) * 100) : 0;
    return {
      ...scope,
      total: items.length,
      unlockedCount,
      lockedCount,
      pct,
    };
  });

  // 3. Dados de Linha do Tempo de Abertura (Agrupado por Semestre/Ano)
  const timelineBucketsMap = {};
  safeCapsules.forEach((cap) => {
    const d = new Date(cap.unlockDate);
    if (Number.isNaN(d.getTime())) return;
    const year = d.getFullYear();
    const half = d.getMonth() < 6 ? '1º Sem' : '2º Sem';
    const key = `${year}-${d.getMonth() < 6 ? '1' : '2'}`;
    const label = `${half}/${year}`;
    if (!timelineBucketsMap[key]) {
      timelineBucketsMap[key] = { key, label, total: 0, locked: 0, unlocked: 0 };
    }
    timelineBucketsMap[key].total += 1;
    if (isCapsuleUnlocked(cap)) {
      timelineBucketsMap[key].unlocked += 1;
    } else {
      timelineBucketsMap[key].locked += 1;
    }
  });

  const timelineBuckets = Object.values(timelineBucketsMap).sort((a, b) =>
    a.key.localeCompare(b.key),
  );
  const maxBucketValue = Math.max(1, ...timelineBuckets.map((b) => b.total));

  // 4. Métricas de Ações / Metas a Fazer nas Cápsulas
  const allActions = safeCapsules.flatMap((c) => c.actionItems || []);
  const completedActions = allActions.filter((a) => a.done).length;
  const actionProgressPct =
    allActions.length > 0 ? Math.round((completedActions / allActions.length) * 100) : 0;

  return (
    <section className="bi-visuals-grid" aria-label="Gráficos analíticos estilo Power BI">
      {/* Card 1: Gráfico de Rosca por Tema */}
      <article className="bi-panel">
        <header className="bi-panel-header">
          <div>
            <span className="bi-panel-kicker">DISTRIBUIÇÃO POR TEMA</span>
            <h3>Amor, Trabalho, Crescimento &amp; Religião</h3>
          </div>
          {selectedTheme !== 'todos' && (
            <button
              type="button"
              className="bi-reset-chip"
              onClick={() => onSelectTheme('todos')}
            >
              Limpar filtro
            </button>
          )}
        </header>

        <div className="bi-donut-layout">
          <div className="bi-donut-wrapper">
            <svg viewBox="0 0 160 160" className="bi-donut-svg" role="img" aria-label="Gráfico de rosca por tema">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke="#eef2f6"
                strokeWidth="22"
              />
              {donutSegments.map((seg) =>
                seg.count > 0 ? (
                  <circle
                    key={seg.id}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={selectedTheme === seg.id ? '26' : '22'}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    transform="rotate(-90 80 80)"
                    className="bi-donut-segment"
                    style={{
                      opacity:
                        selectedTheme === 'todos' || selectedTheme === seg.id ? 1 : 0.3,
                    }}
                    onClick={() =>
                      onSelectTheme(selectedTheme === seg.id ? 'todos' : seg.id)
                    }
                  >
                    <title>{`${seg.label}: ${seg.count} cápsula(s) (${seg.pct}%)`}</title>
                  </circle>
                ) : null,
              )}
              <text x="80" y="74" textAnchor="middle" className="bi-donut-total-num">
                {total}
              </text>
              <text x="80" y="94" textAnchor="middle" className="bi-donut-total-label">
                Cápsulas
              </text>
            </svg>
          </div>

          <ul className="bi-legend-list">
            {themeStats.map((item) => {
              const isSelected = selectedTheme === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`bi-legend-item ${isSelected ? 'active' : ''}`}
                    onClick={() =>
                      onSelectTheme(selectedTheme === item.id ? 'todos' : item.id)
                    }
                  >
                    <span
                      className="bi-legend-dot"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="bi-legend-name">
                      {item.icon} {item.label}
                    </span>
                    <strong className="bi-legend-count">{item.count}</strong>
                    <span className="bi-legend-pct">{item.pct}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <p className="bi-panel-footnote">
          Clique em qualquer fatia ou item da legenda para filtrar o dashboard.
        </p>
      </article>

      {/* Card 2: Comparativo Pessoal vs Profissional & Status */}
      <article className="bi-panel">
        <header className="bi-panel-header">
          <div>
            <span className="bi-panel-kicker">ESCOPO DE VIDA &amp; CARREIRA</span>
            <h3>Pessoal vs. Profissional</h3>
          </div>
          {selectedScope !== 'todos' && (
            <button
              type="button"
              className="bi-reset-chip"
              onClick={() => onSelectScope('todos')}
            >
              Mostrar ambos
            </button>
          )}
        </header>

        <div className="bi-scope-bars">
          {scopeStats.map((scope) => {
            const isSelected = selectedScope === scope.id;
            return (
              <div
                key={scope.id}
                role="button"
                tabIndex={0}
                className={`bi-scope-row ${isSelected ? 'selected' : ''}`}
                onClick={() =>
                  onSelectScope(selectedScope === scope.id ? 'todos' : scope.id)
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectScope(selectedScope === scope.id ? 'todos' : scope.id);
                  }
                }}
              >
                <div className="bi-scope-row-top">
                  <div className="bi-scope-title">
                    <span className="bi-scope-icon">{scope.icon}</span>
                    <div>
                      <strong>{scope.label}</strong>
                      <small>{scope.description}</small>
                    </div>
                  </div>
                  <div className="bi-scope-metrics">
                    <span className="bi-scope-big">{scope.total}</span>
                    <span className="bi-scope-pct">({scope.pct}%)</span>
                  </div>
                </div>

                <div className="bi-progress-track">
                  <div
                    className="bi-progress-fill"
                    style={{
                      width: `${scope.pct}%`,
                      backgroundColor: scope.color,
                    }}
                  />
                </div>

                <div className="bi-scope-subbreakdown">
                  <span>🔒 {scope.lockedCount} trancada(s)</span>
                  <span>🔓 {scope.unlockedCount} liberada(s)</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Medidor de Metas / Informações a se fazer */}
        <div className="bi-goals-summary">
          <div className="bi-goals-header">
            <span>✅ Cumprimento de Metas &amp; Ações Planejadas</span>
            <strong>
              {completedActions}/{allActions.length} ({actionProgressPct}%)
            </strong>
          </div>
          <div className="bi-progress-track bi-goals-track">
            <div
              className="bi-progress-fill bi-goals-fill"
              style={{ width: `${actionProgressPct}%` }}
            />
          </div>
        </div>
      </article>

      {/* Card 3: Cronograma de Abertura por Semestre/Ano */}
      <article className="bi-panel">
        <header className="bi-panel-header">
          <div>
            <span className="bi-panel-kicker">HORIZONTE TEMPORAL</span>
            <h3>Cápsulas por Período de Abertura</h3>
          </div>
          <span className="bi-badge-neutral">Linha do Tempo</span>
        </header>

        {timelineBuckets.length === 0 ? (
          <div className="bi-empty-chart">Nenhuma cápsula no filtro selecionado.</div>
        ) : (
          <div className="bi-columns-chart">
            {timelineBuckets.map((bucket) => {
              const heightPct = Math.max(
                14,
                Math.round((bucket.total / maxBucketValue) * 100),
              );
              return (
                <div key={bucket.key} className="bi-column-item">
                  <span className="bi-column-val">{bucket.total}</span>
                  <div className="bi-column-bar-area">
                    <div
                      className="bi-column-bar"
                      style={{ height: `${heightPct}%` }}
                      title={`${bucket.label}: ${bucket.locked} trancada(s), ${bucket.unlocked} liberada(s)`}
                    >
                      {bucket.unlocked > 0 && (
                        <div
                          className="bi-column-bar-unlocked"
                          style={{
                            height: `${Math.round((bucket.unlocked / bucket.total) * 100)}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="bi-column-label">{bucket.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="bi-chart-mini-legend">
          <span>
            <i className="dot-locked" /> Aguardando data futura
          </span>
          <span>
            <i className="dot-unlocked" /> Liberadas / Abertas
          </span>
        </div>
      </article>
    </section>
  );
}
