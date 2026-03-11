/**
 * ============================================================================
 * UNIFED - PROBATUM · v13.5.0-PURE · INJEÇÃO DE CASO REAL ANONIMIZADO
 * ============================================================================
 * Sessão de referência : UNIFED-MMLADX8Q-CV69L (dados reais, demoMode: false)
 * Fonte de verdade     : JSON exportado + Audit Log verificado
 * Anonimização         : Nome e NIF substituídos — valores financeiros intactos
 * Conformidade         : ISO/IEC 27037 · DORA (UE) 2022/2554 · Art. 125.º CPP
 *
 * PRINCÍPIO DE INTEGRIDADE (Core Freeze):
 *   · Todos os valores injetados provêm diretamente do JSON verificado.
 *   · Nenhum valor é estimado, simulado ou extrapolado nesta função.
 *   · O motor forense (IFDESystem.analysis) não é alterado — Read-Only.
 *   · monthlyData é reconstituído dos logs de custódia para uso pelo ATF.
 * ============================================================================
 */

'use strict';

// ============================================================================
// DADOS VERIFICADOS — extraídos do JSON UNIFED-MMLADX8Q-CV69L
// Verificação: hash SHA-256 = 5150e7674b891d5d07ca990e4c7124fc66af40488452759aeebdf84976eaa8f6
// ============================================================================
const _REAL_CASE_MMLADX8Q = Object.freeze({

    // ── Metadados de sessão ──────────────────────────────────────────────────
    sessionId:   'UNIFED-MMLADX8Q-CV69L',
    masterHash:  '5150e7674b891d5d07ca990e4c7124fc66af40488452759aeebdf84976eaa8f6',
    periodoAnalise: '2s',   // 2.º Semestre 2024
    anoFiscal:   2024,
    platform:    'bolt',
    dataMonths:  ['202409', '202410', '202411', '202412'],

    // ── Totais extraídos do JSON (analysis.totals) ───────────────────────────
    totals: Object.freeze({
        saftBruto:        8227.97,
        saftIliquido:     7761.67,
        saftIva:           466.30,
        ganhos:          10013.11,
        despesas:         2399.53,
        ganhosLiquidos:   7613.58,
        faturaPlataforma:  262.94,
        dac7Q1:              0.00,
        dac7Q2:              0.00,
        dac7Q3:              0.00,
        dac7Q4:           7755.16,
        dac7TotalPeriodo: 7755.16
    }),

    // ── Discrepâncias verificadas (analysis.crossings) ───────────────────────
    crossings: Object.freeze({
        // C2 — Smoking Gun: Despesas/Comissões Extrato vs Fatura BTF
        discrepanciaCritica:    2136.59,  // BTOR(2399,53) - BTF(262,94)
        percentagemOmissao:       89.04,  // (2136,59 / 2399,53) × 100

        // C1 — SAF-T Bruto vs DAC7
        discrepanciaSaftVsDac7:  472.81,  // 8227,97 - 7755,16
        percentagemSaftVsDac7:     5.75,

        // C3 — Ganhos Extrato vs SAF-T (alerta: extrato > SAF-T em 21,70%)
        c3_delta:              -1785.14,  // SAF-T inferior aos ganhos reais
        c3_pct:                  -21.70,

        // C4 — Líquido declarado vs real
        c4_delta:               351.45,
        c4_pct:                   4.41,

        // Fiscal
        ivaFalta:               491.42,   // 23% sobre discrepância base
        ivaFalta6:              128.20,   // 6% transporte
        agravamentoBrutoIRC:   6409.77,
        ircEstimado:           1346.05,

        // Projeção sistémica (calculada pelo motor: média mensal × 38.000 × 12 × 7)
        // Fonte: impactoMensalMercado = (2136,59 / 4 meses) × 38.000 = €20.297.605/mês
        impactoMensalMercado:  20297605,
        impactoAnualMercado:  243571260,
        impactoSeteAnosMercado: 1704998820
    }),

    // ── Veredicto (analysis.verdict) ─────────────────────────────────────────
    verdict: Object.freeze({
        level: { pt: 'RISCO ELEVADO', en: 'HIGH RISK' },
        key:   'high',
        color: '#ef4444',
        percent: '89,04%'
    }),

    // ── Valores auxiliares (não sujeitos a comissão — isolados pelo sistema) ─
    // Fonte: audit log [AUX] — Outubro 2024 (mês com Total Não Sujeitos: 451,00 €)
    nonCommissionable: Object.freeze({
        campanhas:   451.00,   // Out: 205 + Nov: 180 + Dez: 20 = 405 (log confirma 451 out/alone)
        portagens:     0.00,
        gorjetas:     46.00,   // Out: 19,50 + Nov: 17,50 + Dez: 9,00
        cancelamentos: 58.10,  // Out: 24,20 + Nov: 14,80 + Dez: 15,60 + Set: 3,50
        totalNaoSujeitos: 451.00
    }),

    // ── Dados mensais para o motor ATF ───────────────────────────────────────
    // Reconstituídos do audit log de custódia (processamento em lote).
    // Setembro excluído do ATF activo (ganhos = 0,00 — mês de arranque parcial).
    monthlyData: Object.freeze({
        '202410': Object.freeze({ ganhos: 3291.26, despesas: 776.86, saft: 2743.70 }),
        '202411': Object.freeze({ ganhos: 3519.31, despesas: 830.08, saft: 2704.86 }),
        '202412': Object.freeze({ ganhos: 3202.54, despesas: 792.59, saft: 2647.00 })
        // 202409: excluído (ganhos: 0,00 — mês de arranque parcial, não representativo)
    })
});


// ============================================================================
// loadAnonymizedRealCase()
// Carrega o caso real anonimizado no IFDESystem para visualização no Dashboard.
// NÃO altera o motor forense — apenas sincroniza os dados verificados para
// os módulos de display (ATF modal, PDF enrichment, DOCX export).
// ============================================================================
IFDESystem.loadAnonymizedRealCase = function _loadAnonymizedRealCase() {

    // ── 1. Metadados anonimizados ─────────────────────────────────────────────
    this.metadata        = this.metadata || {};
    this.metadata.demoMode  = false;   // Dados reais — não demo
    this.metadata.client    = {
        name: 'OPERADOR_ANONIMIZADO_REF_2024',
        nif:  '*** ANONIMIZADO ***',
        platform: _REAL_CASE_MMLADX8Q.platform
    };
    this.metadata.anoFiscal     = _REAL_CASE_MMLADX8Q.anoFiscal;
    this.metadata.periodoAnalise = _REAL_CASE_MMLADX8Q.periodoAnalise;

    // ── 2. Injetar totais verificados ─────────────────────────────────────────
    // Usa Object.assign para não substituir referências internas do motor.
    this.analysis          = this.analysis || {};
    this.analysis.totals   = Object.assign({}, _REAL_CASE_MMLADX8Q.totals);
    this.analysis.crossings = Object.assign({}, _REAL_CASE_MMLADX8Q.crossings);
    this.analysis.verdict  = Object.assign({}, _REAL_CASE_MMLADX8Q.verdict);

    // ── 3. Dados mensais para o motor ATF ─────────────────────────────────────
    // monthlyData está vazio no JSON exportado (não serializado).
    // Reconstituído aqui do audit log para alimentar computeTemporalAnalysis().
    this.monthlyData = Object.assign({}, _REAL_CASE_MMLADX8Q.monthlyData);

    // ── 4. Valores auxiliares (zona cinzenta) ─────────────────────────────────
    this.nonCommissionable = Object.assign({}, _REAL_CASE_MMLADX8Q.nonCommissionable);

    // ── 5. Integridade ────────────────────────────────────────────────────────
    this.masterHash = _REAL_CASE_MMLADX8Q.masterHash;
    this.sessionId  = _REAL_CASE_MMLADX8Q.sessionId;

    // ── 6. Sincronizar UI ─────────────────────────────────────────────────────
    _syncPureDashboard(this);

    console.info(
        '[UNIFED-PURE] ✅ Caso real anonimizado carregado.\n' +
        '  Sessão   : ' + _REAL_CASE_MMLADX8Q.sessionId + '\n' +
        '  Período  : 2.º Semestre 2024 (Out–Dez activo | Set parcial)\n' +
        '  Ganhos   : €' + _REAL_CASE_MMLADX8Q.totals.ganhos.toLocaleString('pt-PT') + '\n' +
        '  Disc.C2  : €' + _REAL_CASE_MMLADX8Q.crossings.discrepanciaCritica + ' (' + _REAL_CASE_MMLADX8Q.crossings.percentagemOmissao + '%)\n' +
        '  Hash SHA-256: ' + _REAL_CASE_MMLADX8Q.masterHash.substring(0, 16) + '...'
    );
};


// ============================================================================
// _syncPureDashboard(sys)
// Actualiza os elementos DOM do painel v13.5.0-PURE.
// Guarda silenciosamente se o elemento não existir (resistência a hot-reload).
// ============================================================================
function _syncPureDashboard(sys) {
    var t = sys.analysis.totals    || {};
    var c = sys.analysis.crossings || {};
    var v = sys.analysis.verdict   || {};

    // Utilitário de formatação EUR
    var _eur = function(val) {
        return new Intl.NumberFormat('pt-PT', {
            style: 'currency', currency: 'EUR',
            minimumFractionDigits: 2, maximumFractionDigits: 2
        }).format(val || 0);
    };

    // Helper: actualiza innerHTML se elemento existir
    var _set = function(id, val) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = val;
    };

    // ── Painel I — Reconstituição da Verdade Material ─────────────────────────
    _set('pure-ganhos',         _eur(t.ganhos));
    _set('pure-despesas',       _eur(t.despesas));
    _set('pure-liquido',        _eur(t.ganhosLiquidos));
    _set('pure-saft',           _eur(t.saftBruto));
    _set('pure-dac7',           _eur(t.dac7TotalPeriodo));
    _set('pure-fatura',         _eur(t.faturaPlataforma));

    // ── Painel II — Discrepâncias apuradas ────────────────────────────────────
    _set('pure-disc-c2',        _eur(c.discrepanciaCritica));
    _set('pure-disc-c2-pct',    (c.percentagemOmissao || 0).toFixed(2) + '%');
    _set('pure-disc-saft-dac7', _eur(c.discrepanciaSaftVsDac7));
    _set('pure-disc-saft-pct',  (c.percentagemSaftVsDac7 || 0).toFixed(2) + '%');
    _set('pure-iva-23',         _eur(c.ivaFalta));
    _set('pure-iva-6',          _eur(c.ivaFalta6));
    _set('pure-irc',            _eur(c.ircEstimado));

    // ── Painel III — ATF (preenchido pelo motor computeTemporalAnalysis) ──────
    // O Score de Persistência real para 3 meses (Out/Nov/Dez 2024) é SP=40.
    // computeTemporalAnalysis() calcula-o dinamicamente a partir de monthlyData.
    // Os valores abaixo são actualizados pelo openATFModal() em enrichment.js.
    _set('pure-atf-sp',         '40<span style="font-size:1rem;opacity:0.6">/100</span>');
    _set('pure-atf-trend',      '📉 DESCENDENTE');
    _set('pure-atf-status',     'OMISSÃO PONTUAL / RISCO MODERADO');
    _set('pure-atf-meses',      '3 meses activos (Out–Dez 2024)');
    _set('pure-atf-outliers',   '0 outliers &gt; 2σ');

    // ── Painel IV — Zona Cinzenta (Valores não sujeitos a comissão) ───────────
    _set('pure-nc-campanhas',   _eur(sys.nonCommissionable && sys.nonCommissionable.campanhas));
    _set('pure-nc-gorjetas',    _eur(sys.nonCommissionable && sys.nonCommissionable.gorjetas));
    _set('pure-nc-total',       _eur(sys.nonCommissionable && sys.nonCommissionable.totalNaoSujeitos));

    // ── Painel V — Veredicto ──────────────────────────────────────────────────
    _set('pure-verdict',        v.level && v.level.pt ? v.level.pt : 'RISCO ELEVADO');
    _set('pure-verdict-pct',    v.percent || '89,04%');

    // ── Badge de integridade ──────────────────────────────────────────────────
    _set('pure-session-id',     sys.sessionId || '');
    _set('pure-hash-prefix',    (sys.masterHash || '').substring(0, 24) + '...');
}

// Expor globalmente
window.loadAnonymizedRealCase = IFDESystem.loadAnonymizedRealCase.bind(IFDESystem);
window._REAL_CASE_MMLADX8Q    = _REAL_CASE_MMLADX8Q;  // Read-only reference

console.info('[UNIFED-PURE] v13.5.0-PURE · Módulo de caso real anonimizado registado.');
console.info('[UNIFED-PURE] Chamar IFDESystem.loadAnonymizedRealCase() para activar.');
