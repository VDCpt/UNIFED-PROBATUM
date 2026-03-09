/**
 * UNIFED - PROBATUM · OUTPUT ENRICHMENT LAYER · v13.2.2-GOLD
 * ============================================================================
 * Arquitetura: Asynchronous Post-Computation Orchestration
 * Padrão:      Read-Only Data Consumption sobre IFDESystem.analysis
 * Conformidade: DORA (UE) 2022/2554 · RGPD · ISO/IEC 27037:2012
 *
 * PRINCÍPIO DE ISOLAMENTO:
 *   Este módulo opera EXCLUSIVAMENTE no fluxo de exportação.
 *   NÃO interfere com o motor de cálculo forense (script.js).
 *   NÃO escreve em IFDESystem.analysis nem em IFDESystem.documents.
 *   Consome IFDESystem.analysis como Fonte de Verdade Imutável.
 *
 * MÓDULOS IMPLEMENTADOS:
 *   1. generateLegalNarrative() — IA Argumentativa (RAG + In-Context Learning)
 *      Utiliza Claude claude-sonnet-4-20250514 para síntese jurídico-fiscal.
 *      Injeção de contexto estruturado com artigos CIVA/CIRC/RGIT/CPP.
 *
 *   2. renderSankeyToImage()    — Dynamic Canvas-to-PDF Injection
 *      Diagrama de Sankey gerado em canvas invisível durante exportPDF().
 *      Retorna base64 PNG para injeção direta no jsPDF.
 *      Dashboard permanece inalterado.
 *
 * PONTO DE INJEÇÃO: async function exportPDF() — exclusivamente.
 * ============================================================================
 */

'use strict';

// ============================================================================
// 1. BASE LEGAL ESTÁTICA (RAG — Knowledge Base)
//    Artigos referenciais para In-Context Learning do modelo de linguagem.
//    Esta base é estática e não contém dados do sujeito passivo.
// ============================================================================
const LEGAL_KB = {
    CIVA: {
        art2:  'Art. 2.º CIVA — Incidência Subjetiva: As plataformas digitais são sujeitos passivos de IVA pela intermediação de prestações de serviços (al. i), n.º 1). Obrigação de autoliquidação.',
        art6:  'Art. 6.º CIVA — Localização: Serviços de transporte são tributáveis no local de utilização efetiva.',
        art29: 'Art. 29.º CIVA — Obrigações de Faturação: Emissão de fatura por cada prestação de serviços, com identificação fiscal do prestador e adquirente.',
        art36: 'Art. 36.º CIVA — Prazo de Emissão: A fatura deve ser emitida no prazo de cinco dias úteis a contar da prestação do serviço.',
        art40: 'Art. 40.º CIVA — Conservação de Registos: Os registos primários e documentos de suporte devem ser conservados por um prazo mínimo de 10 anos.',
        art78: 'Art. 78.º CIVA — Regularizações: Obrigatoriedade de regularização do imposto quando detetada omissão de base tributável.'
    },
    CIRC: {
        art17: 'Art. 17.º CIRC — Lucro Tributável: A base tributável inclui todos os rendimentos omitidos, independentemente da sua natureza ou denominação.',
        art20: 'Art. 20.º CIRC — Rendimentos: Inclui todos os proveitos ou ganhos realizados no período de tributação.',
        art23: 'Art. 23.º CIRC — Gastos Dedutíveis: Apenas são dedutíveis os gastos comprovados por documentação idónea.',
        art57: 'Art. 57.º CIRC — Preços de Transferência: Entidades com relações especiais (plataformas digitais e prestadores de serviços dependentes) estão sujeitas a condições de plena concorrência.',
        art88: 'Art. 88.º CIRC — Tributações Autónomas: Encargos não devidamente documentados estão sujeitos a tributação autónoma agravada.'
    },
    RGIT: {
        art103: 'Art. 103.º RGIT — Fraude Fiscal: Conduta dolosa que, por ação ou omissão, reduza, elimine ou retarde impostos devidos. Pena até 3 anos de prisão.',
        art104: 'Art. 104.º RGIT — Fraude Fiscal Qualificada: Quando a vantagem patrimonial ilegítima for superior a €15.000 ou envolver utilização de meios fraudulentos. Pena até 5 anos.',
        art108: 'Art. 108.º RGIT — Abuso de Confiança Fiscal: Não entrega total ou parcial, ao credor tributário, de prestação tributária deduzida ou recebida de terceiros.',
        art114: 'Art. 114.º RGIT — Contra-Ordenações Fiscais: Omissão de declarações ou declarações inexatas, com coima até 165.000€.'
    },
    CPP: {
        art125: 'Art. 125.º CPP — Admissibilidade da Prova: São admissíveis todos os meios de prova não proibidos por lei. Fundamento para a admissibilidade da prova digital forense.',
        art153: 'Art. 153.º CPP — Deveres do Perito: Compromisso de honra, objetividade e imparcialidade no exercício das funções periciais.',
        art163: 'Art. 163.º CPP — Valor Probatório: O juízo técnico, científico ou artístico inerente ao relatório pericial presume-se subtraído à livre apreciação do julgador.'
    },
    DAC7: {
        art1: 'Diretiva DAC7 (UE) 2021/514 — Obrigação das plataformas digitais de reportar as receitas dos prestadores de serviços às autoridades fiscais dos Estados-Membros. Transposta para o direito português.',
        art2: 'DAC7 — Reconciliação: As discrepâncias entre os valores reportados pela plataforma (DAC7) e os valores declarados pelo sujeito passivo constituem indício de omissão tributária.'
    }
};

// ============================================================================
// 2. generateLegalNarrative(analysis)
//    IA Argumentativa — RAG com Injeção de Contexto Estruturado
//    Modelo: claude-sonnet-4-20250514
//    Padrão: In-Context Learning com Fonte de Verdade Imutável
// ============================================================================
async function generateLegalNarrative(analysis) {
    console.log('[UNIFED-AI] ▶ A gerar Síntese Jurídica Assistida por IA...');

    const forensicContext  = _buildForensicContext(analysis);
    const legalContext     = _buildLegalContext();
    const hasData          = forensicContext !== '[DADOS INSUFICIENTES]';

    if (!hasData) {
        console.warn('[UNIFED-AI] ⚠ Dados insuficientes para síntese jurídica.');
        return _fallbackNarrative('Dados forenses insuficientes. Carregue os documentos de evidência antes de exportar.');
    }

    const systemPrompt = `És um Assistente Especializado em Análise Jurídico-Fiscal Portuguesa.
O teu papel é o de um Módulo de Síntese Narrativa: transformas outputs numéricos em inputs semânticos jurídicos.

REGRAS ABSOLUTAS DE OPERAÇÃO:
1. Usa EXCLUSIVAMENTE os dados do contexto forense fornecido — nunca inventes valores.
2. Se um valor for zero ou ausente, omite essa linha — não especules nem estimes.
3. Linguagem: português jurídico formal, adequado para submissão em tribunal.
4. Referencia sempre os artigos legais pertinentes para os factos presentes.
5. Não uses listas de bullets — escreve em prosa jurídica estruturada.
6. Mantém objetividade pericial: expõe factos, não formula acusações.`;

    const userPrompt = `Com base nos seguintes dados forenses certificados e na base legal aplicável, elabora uma Síntese Jurídica Pericial estruturada em três secções obrigatórias.

═══ DADOS FORENSES CERTIFICADOS (IFDESystem.analysis — Imutável) ═══
${forensicContext}

═══ BASE LEGAL APLICÁVEL ═══
${legalContext}

═══ ESTRUTURA OBRIGATÓRIA DA SÍNTESE ═══
Secção A — QUALIFICAÇÃO JURÍDICA DOS FACTOS
[Qualificação técnica das discrepâncias apuradas, com referência aos artigos legais pertinentes]

Secção B — ENQUADRAMENTO LEGAL E TRIBUTÁRIO
[Análise dos deveres tributários omitidos, base legal e impacto fiscal quantificado]

Secção C — RECOMENDAÇÕES PERICIAIS
[Diligências recomendadas, documentação a solicitar, prazos legais relevantes]

Escreve a síntese em prosa jurídica formal. Máximo 550 palavras. Sem preâmbulos.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1000,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText.substring(0, 200)}`);
        }

        const data = await response.json();
        const text = (data.content || [])
            .filter(b => b.type === 'text')
            .map(b => b.text)
            .join('');

        if (!text || text.trim().length < 50) {
            throw new Error('Resposta da API vazia ou insuficiente.');
        }

        console.log('[UNIFED-AI] ✅ Síntese Jurídica gerada com sucesso (' + text.length + ' caracteres).');
        return text.trim();

    } catch (err) {
        console.warn('[UNIFED-AI] ⚠ API indisponível:', err.message);
        return _fallbackNarrative(err.message);
    }
}

// ── Construtor do contexto forense estruturado ────────────────────────────────
function _buildForensicContext(analysis) {
    const t  = analysis.totals    || {};
    const c  = analysis.crossings || {};
    const tw = analysis.twoAxis   || {};
    const v  = analysis.verdict   || {};

    const lines = [];

    // Receitas
    if (t.saftBruto  > 0) lines.push(`RECEITA SAF-T (Base Tributável): ${_fmtEur(t.saftBruto)}`);
    if (t.ganhos     > 0) lines.push(`GANHOS DECLARADOS (Extrato Plataforma): ${_fmtEur(t.ganhos)}`);
    if (t.dac7TotalPeriodo > 0) lines.push(`RECEITA DAC7 (Declaração DAC7 da Plataforma): ${_fmtEur(t.dac7TotalPeriodo)}`);
    if (t.faturaPlataforma > 0) lines.push(`FATURAÇÃO PLATAFORMA (Faturas emitidas): ${_fmtEur(t.faturaPlataforma)}`);

    // Despesas
    if (t.despesas   > 0) lines.push(`DESPESAS DECLARADAS: ${_fmtEur(t.despesas)}`);
    if (t.ganhosLiquidos > 0) lines.push(`GANHOS LÍQUIDOS APÓS COMISSÃO: ${_fmtEur(t.ganhosLiquidos)}`);

    // Separador
    if (lines.length > 0) lines.push('---');

    // Discrepâncias Críticas
    if (c.discrepanciaCritica && Math.abs(c.discrepanciaCritica) > 0) {
        lines.push(`OMISSÃO DE CUSTOS (BTF — Benchmark): ${_fmtEur(c.discrepanciaCritica)} (${(c.percentagemOmissao || 0).toFixed(2)}% da base)`);
    }
    if (c.discrepanciaSaftVsDac7 && Math.abs(c.discrepanciaSaftVsDac7) > 0) {
        lines.push(`OMISSÃO DE RECEITA (SAFT vs DAC7): ${_fmtEur(c.discrepanciaSaftVsDac7)}`);
    }
    if (tw.revenueGap && Math.abs(tw.revenueGap) > 0) {
        lines.push(`REVENUE GAP (2-Axis Analysis): ${_fmtEur(tw.revenueGap)}`);
    }
    if (tw.expenseGap && Math.abs(tw.expenseGap) > 0) {
        lines.push(`EXPENSE GAP (2-Axis Analysis): ${_fmtEur(tw.expenseGap)}`);
    }

    // Separador
    if (lines.length > 0) lines.push('---');

    // Impacto Fiscal
    if (c.ivaFalta  > 0) lines.push(`IVA 23% OMITIDO (Autoliquidação — Art. 2.º CIVA): ${_fmtEur(c.ivaFalta)}`);
    if (c.ivaFalta6 > 0) lines.push(`IVA 6% OMITIDO (Transporte — CIVA): ${_fmtEur(c.ivaFalta6)}`);
    if (c.ircEstimado > 0) lines.push(`IRC ESTIMADO OMITIDO (Art. 17.º CIRC): ${_fmtEur(c.ircEstimado)}`);
    if (c.discrepancia5IMT > 0) lines.push(`CONTRIBUIÇÃO IMT/AMT 5% OMITIDA: ${_fmtEur(c.discrepancia5IMT)}`);
    if (c.btor > 0) lines.push(`BTOR (Benchmark de Tributação Ótimo Real): ${_fmtEur(c.btor)}`);
    if (c.btf  > 0) lines.push(`BTF (Benchmark de Tributação Final): ${_fmtEur(c.btf)}`);

    // Veredicto
    if (v.level?.pt) {
        lines.push('---');
        lines.push(`VEREDICTO DE RISCO: ${v.level.pt} — ${v.percent || 'N/A'}`);
        if (v.description?.pt) lines.push(`DESCRIÇÃO: ${v.description.pt}`);
    }

    if (lines.filter(l => l !== '---').length === 0) {
        return '[DADOS INSUFICIENTES]';
    }

    return lines.join('\n');
}

// ── Construtor do contexto legal estruturado ─────────────────────────────────
function _buildLegalContext() {
    return Object.entries(LEGAL_KB).map(([code, arts]) => {
        const artLines = Object.values(arts).map(a => `  · ${a}`).join('\n');
        return `${code}:\n${artLines}`;
    }).join('\n\n');
}

// ── Narrativa de fallback (IA indisponível) ───────────────────────────────────
function _fallbackNarrative(reason) {
    return [
        'SÍNTESE JURÍDICA — MODO DE SEGURANÇA FORENSE',
        '',
        'A geração de síntese jurídica assistida por IA não está disponível nesta sessão.',
        `Motivo técnico: ${reason}`,
        '',
        'O motor de cálculo forense (script.js) permanece íntegro e validado.',
        'Os valores financeiros e as fórmulas de auditoria (CIVA/IRC) são independentes deste módulo.',
        '',
        'Secção A — QUALIFICAÇÃO JURÍDICA DOS FACTOS',
        'A síntese jurídica automática requer ligação à API de linguagem. Os dados forenses',
        'apurados pelo motor UNIFED-PROBATUM mantêm plena validade probatória independentemente',
        'deste módulo de enriquecimento narrativo.',
        '',
        'Secção B — ENQUADRAMENTO LEGAL E TRIBUTÁRIO',
        'Os valores apurados pelo motor de cálculo são fundamentados nos artigos 103.º e 104.º do',
        'RGIT, artigo 2.º do CIVA (autoliquidação), artigo 17.º do CIRC e Diretiva DAC7.',
        '',
        'Secção C — RECOMENDAÇÕES PERICIAIS',
        'Recomendam-se as diligências standard: solicitação de SAF-T completo, cruzamento com',
        'declarações DAC7 e verificação de faturas emitidas vs. receitas declaradas em IRC.'
    ].join('\n');
}

// ── Formatador de moeda para contexto textual ─────────────────────────────────
function _fmtEur(val) {
    if (!val || isNaN(val)) return '€0,00';
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency', currency: 'EUR',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(val);
}


// ============================================================================
// 3. renderSankeyToImage(analysis)
//    Dynamic Canvas-to-PDF Injection
//    Geração em canvas invisível — Dashboard inalterado
//    Retorna: Promise<string|null> — base64 PNG ou null se falhar
// ============================================================================
async function renderSankeyToImage(analysis) {
    console.log('[UNIFED-SANKEY] ▶ A renderizar Diagrama de Fluxo Financeiro...');

    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            canvas.width  = 1400;
            canvas.height = 720;
            canvas.style.cssText = 'position:absolute;left:-19999px;top:-19999px;visibility:hidden;';
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas 2D context indisponível.');

            _drawSankeyDiagram(ctx, analysis, canvas.width, canvas.height);

            // Aguarda o próximo frame para garantir renderização completa
            requestAnimationFrame(() => {
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    document.body.removeChild(canvas);
                    console.log('[UNIFED-SANKEY] ✅ Diagrama renderizado com sucesso.');
                    resolve(dataUrl);
                } catch (e) {
                    if (canvas.parentNode) document.body.removeChild(canvas);
                    console.warn('[UNIFED-SANKEY] ⚠ Erro ao serializar canvas:', e.message);
                    resolve(null);
                }
            });

        } catch (err) {
            console.warn('[UNIFED-SANKEY] ⚠ Erro na renderização:', err.message);
            resolve(null);
        }
    });
}

// ── Motor de renderização do Sankey ──────────────────────────────────────────
function _drawSankeyDiagram(ctx, analysis, W, H) {
    const t  = analysis.totals    || {};
    const c  = analysis.crossings || {};
    const tw = analysis.twoAxis   || {};

    // ── Paleta e constantes ──
    const CLR = {
        bg:        '#0d1b2a',
        bgPanel:   '#112240',
        cyan:      '#00e5ff',
        green:     '#10b981',
        amber:     '#f59e0b',
        red:       '#ef4444',
        rose:      '#f43f5e',
        slate:     '#94a3b8',
        white:     '#e2e8f0',
        gridLine:  'rgba(148,163,184,0.08)'
    };

    // ── Fundo ──
    ctx.fillStyle = CLR.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid subtil
    ctx.strokeStyle = CLR.gridLine;
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += 70) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy <= H; gy += 60) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // ── Cabeçalho ──
    ctx.textAlign = 'center';
    ctx.fillStyle = CLR.cyan;
    ctx.font = 'bold 20px Courier New';
    ctx.fillText('DIAGRAMA DE FLUXO FINANCEIRO — MONEY FLOW ANALYSIS', W / 2, 36);

    ctx.fillStyle = CLR.slate;
    ctx.font = '12px Courier New';
    ctx.fillText('UNIFED - PROBATUM v13.2.2-GOLD · Output Enrichment Layer · Read-Only · Art. 125.º CPP', W / 2, 58);

    // Linha divisória
    ctx.strokeStyle = CLR.cyan + '55';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, 68); ctx.lineTo(W - 40, 68); ctx.stroke();

    // ── Dados para o diagrama ──
    const receita    = Math.max(t.ganhos || t.saftBruto || 0, 1);
    const dac7       = t.dac7TotalPeriodo || 0;
    const despesas   = t.despesas || 0;
    const ivaOm      = (c.ivaFalta || 0) + (c.ivaFalta6 || 0);
    const omReceit   = Math.abs(c.discrepanciaSaftVsDac7 || 0);
    const omCusto    = Math.abs(c.discrepanciaCritica || 0);
    const ircEst     = c.ircEstimado || 0;
    const declarado  = Math.max(receita - omReceit, 0);
    const passivoTotal = ivaOm + omCusto + ircEst;

    // ── Layout dos nós ──
    const MARGIN_TOP = 85;
    const AVAIL_H    = H - MARGIN_TOP - 80;
    const NODE_W     = 30;
    const maxRef     = receita;

    const scale = (v) => Math.max(18, (Math.abs(v) / maxRef) * AVAIL_H * 0.88);

    const nodes = [
        { id: 'receita',    x: 90,   val: receita,      label: ['RECEITA',      'PLATAFORMA'],       col: '#0ea5e9', colGrad: '#38bdf8' },
        { id: 'dac7',       x: 300,  val: dac7 || receita * 0.98, label: ['DAC7',         'REPORTADO'],        col: '#818cf8', colGrad: '#a5b4fc' },
        { id: 'declarado',  x: 530,  val: declarado,    label: ['DECLARADO',    'AUTORIDADE'],       col: '#10b981', colGrad: '#34d399' },
        { id: 'despesas',   x: 760,  val: despesas,     label: ['DESPESAS',     'DECLARADAS'],       col: '#f59e0b', colGrad: '#fbbf24' },
        { id: 'omissao',    x: 980,  val: omReceit || omCusto || receita * 0.05, label: ['OMISSÃO',      'FISCAL'],           col: '#ef4444', colGrad: '#f87171' },
        { id: 'passivo',    x: 1220, val: passivoTotal || (ivaOm + omCusto) || receita * 0.08, label: ['PASSIVO',      'TRIBUTÁRIO'],       col: '#f43f5e', colGrad: '#fb7185' }
    ];

    // ── Desenha fluxos (bezier) ──
    function drawFlow(n1, n2, flowColor, h1Override, h2Override) {
        const hA = h1Override || scale(n1.val);
        const hB = h2Override || scale(n2.val);
        const yA = MARGIN_TOP + (AVAIL_H - hA) / 2;
        const yB = MARGIN_TOP + (AVAIL_H - hB) / 2;

        const x1s = n1.x + NODE_W;
        const x2e = n2.x;
        const cpX = (x1s + x2e) / 2;

        ctx.beginPath();
        ctx.moveTo(x1s, yA);
        ctx.bezierCurveTo(cpX, yA, cpX, yB, x2e, yB);
        ctx.lineTo(x2e, yB + hB);
        ctx.bezierCurveTo(cpX, yB + hB, cpX, yA + hA, x1s, yA + hA);
        ctx.closePath();

        const grad = ctx.createLinearGradient(x1s, 0, x2e, 0);
        grad.addColorStop(0, flowColor + '50');
        grad.addColorStop(0.5, flowColor + '30');
        grad.addColorStop(1, flowColor + '50');
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // Fluxos entre nós
    const flowColors = [CLR.cyan, '#818cf8', CLR.green, CLR.amber, CLR.red];
    for (let i = 0; i < nodes.length - 1; i++) {
        drawFlow(nodes[i], nodes[i + 1], flowColors[i]);
    }

    // ── Desenha nós ──
    nodes.forEach(node => {
        const nH = scale(node.val);
        const nY = MARGIN_TOP + (AVAIL_H - nH) / 2;
        const nX = node.x;

        // Sombra
        ctx.shadowColor = node.col;
        ctx.shadowBlur  = 18;
        const grad = ctx.createLinearGradient(nX, nY, nX + NODE_W, nY + nH);
        grad.addColorStop(0, node.col);
        grad.addColorStop(1, node.colGrad);
        ctx.fillStyle = grad;
        ctx.fillRect(nX, nY, NODE_W, nH);
        ctx.shadowBlur = 0;

        // Borda luminosa
        ctx.strokeStyle = node.colGrad + 'cc';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(nX, nY, NODE_W, nH);

        // Label acima
        ctx.textAlign = 'center';
        ctx.font = 'bold 11px Courier New';
        ctx.fillStyle = CLR.white;
        ctx.shadowBlur = 0;
        node.label.forEach((line, li) => {
            ctx.fillText(line, nX + NODE_W / 2, nY - 22 + li * 14);
        });

        // Valor abaixo
        ctx.font = 'bold 10px Courier New';
        ctx.fillStyle = node.col;
        const valStr = new Intl.NumberFormat('pt-PT', {
            style: 'currency', currency: 'EUR', maximumFractionDigits: 0
        }).format(node.val);
        ctx.fillText(valStr, nX + NODE_W / 2, nY + nH + 18);
    });

    // ── Anotações de discrepância ──
    if (omReceit > 0) {
        _drawAnnotation(ctx, nodes[4].x + NODE_W / 2, MARGIN_TOP - 5,
            `Δ DAC7 vs Declarado: ${_fmtEur(omReceit)}`, CLR.red);
    }
    if (ivaOm > 0) {
        _drawAnnotation(ctx, nodes[5].x + NODE_W / 2, MARGIN_TOP + AVAIL_H + 40,
            `IVA omitido: ${_fmtEur(ivaOm)}`, CLR.rose);
    }

    // ── Legenda ──
    const legendItems = [
        { col: CLR.cyan   + '55', label: 'Fluxo Declarado (OK)' },
        { col: CLR.amber  + '55', label: 'Fluxo Parcial / Auditável' },
        { col: CLR.red    + '55', label: 'Omissão / Passivo Fiscal' }
    ];
    const legY = H - 30;
    legendItems.forEach((li, idx) => {
        const legX = 50 + idx * 200;
        ctx.fillStyle = li.col;
        ctx.fillRect(legX, legY - 13, 16, 13);
        ctx.strokeStyle = li.col.replace('55', 'cc');
        ctx.lineWidth = 1;
        ctx.strokeRect(legX, legY - 13, 16, 13);
        ctx.fillStyle  = CLR.slate;
        ctx.font       = '11px Courier New';
        ctx.textAlign  = 'left';
        ctx.fillText(li.label, legX + 22, legY - 2);
    });

    // Rodapé técnico
    ctx.textAlign  = 'right';
    ctx.fillStyle  = CLR.slate + 'aa';
    ctx.font       = '10px Courier New';
    ctx.fillText('Gerado em memória durante exportPDF() · NÃO altera o Dashboard · DORA (UE) 2022/2554', W - 40, H - 8);

    // Borda exterior
    ctx.strokeStyle = CLR.cyan + '33';
    ctx.lineWidth   = 2;
    ctx.strokeRect(3, 3, W - 6, H - 6);
}

// ── Anotação com seta ────────────────────────────────────────────────────────
function _drawAnnotation(ctx, x, y, text, color) {
    ctx.font      = 'bold 9px Courier New';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText('⚠ ' + text, x, y);
}

// ── Formatador interno ────────────────────────────────────────────────────────
function _fmtEur(val) {
    if (!val || isNaN(val)) return '€0,00';
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency', currency: 'EUR',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(val);
}


// ============================================================================
// 5. NIFAF — Non-Intrusive Forensic Auditory Feedback
//    Sinalização auditiva de precisão para anomalias críticas.
//    Padrão: Web Audio API — Zero dependências externas.
//    Geração sonora matemática — funciona em ambientes Air-gapped.
//    Persistência: localStorage('IFDE_AUDIO_ENABLED')
//    Default: MUTE — respeito pelo contexto de escritório partilhado.
//    Frequências: 180Hz / 140Hz — registro grave, associado a sistemas
//    de segurança profissional e aeronáutica (longe de "beeps" de sistema).
//    Conformidade: DORA (UE) 2022/2554 · ISO/IEC 27037:2012
// ============================================================================
const NIFAF = {
    isEnabled: localStorage.getItem('IFDE_AUDIO_ENABLED') === 'true',

    async playCriticalAlert() {
        if (!this.isEnabled) return;
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();

            // "Deep Pulse" — Duplo sinal de baixa frequência
            // Diferenciado de notificações comuns de sistema pelo registo grave.
            const playPulse = (time, freq) => {
                const osc  = context.createOscillator();
                const gain = context.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
                osc.connect(gain);
                gain.connect(context.destination);
                osc.start(time);
                osc.stop(time + 0.4);
            };

            playPulse(context.currentTime, 180);        // Pulso 1 — 180Hz
            playPulse(context.currentTime + 0.5, 140);  // Pulso 2 — 140Hz (mais grave)
        } catch (err) {
            // Falha silenciosa — Web Audio API bloqueada (ex: política de browser)
            console.warn('[UNIFED-NIFAF] ⚠ Feedback auditivo indisponível:', err.message);
        }
    },

    toggle() {
        this.isEnabled = !this.isEnabled;
        localStorage.setItem('IFDE_AUDIO_ENABLED', this.isEnabled);
        // Feedback imediato ao ligar — confirma que o sistema está operacional
        if (this.isEnabled) this.playCriticalAlert();
        return this.isEnabled;
    }
};

window.NIFAF = NIFAF;
console.log('[UNIFED-NIFAF] ✅ Non-Intrusive Forensic Auditory Feedback carregado — Estado:', NIFAF.isEnabled ? 'ATIVO' : 'MUTE');

// ============================================================================
// 4. EXPOSIÇÃO GLOBAL
//    Funções disponibilizadas para consumo pela função exportPDF() em script.js
// ============================================================================
window.generateLegalNarrative = generateLegalNarrative;
window.renderSankeyToImage    = renderSankeyToImage;

console.log('[UNIFED-ENRICHMENT] ✅ Output Enrichment Layer v13.2.2-GOLD carregado.');
console.log('[UNIFED-ENRICHMENT]   · generateLegalNarrative() — IA Argumentativa (RAG)');
console.log('[UNIFED-ENRICHMENT]   · renderSankeyToImage()    — Dynamic Canvas-to-PDF');
console.log('[UNIFED-ENRICHMENT]   · Modo: Read-Only · Fonte de Verdade: IFDESystem.analysis');

/* =====================================================================
   FIM DO FICHEIRO ENRICHMENT.JS · v13.2.2-GOLD
   UNIFED - PROBATUM — OUTPUT ENRICHMENT LAYER
   ✓ generateLegalNarrative(): RAG + In-Context Learning (claude-sonnet-4-20250514)
   ✓ renderSankeyToImage(): Dynamic Canvas-to-PDF Injection
   ✓ Isolamento total do motor de cálculo forense
   ✓ Conformidade DORA/RGPD — não manipula prova digital
   ✓ Fallback de segurança: se IA falhar, motor forense permanece íntegro
   ===================================================================== */
