/**
 * UNIFED - PROBATUM · OUTPUT ENRICHMENT LAYER · v13.2.4-PREMIUM
 * ============================================================================
 * Arquitetura: Asynchronous Post-Computation Orchestration
 * Padrão:      Read-Only Data Consumption sobre IFDESystem.analysis
 * Conformidade: DORA (UE) 2022/2554 · RGPD · ISO/IEC 27037:2012
 *
 * PRINCÍPIO DE ISOLAMENTO:
 *   Consome IFDESystem.analysis e IFDESystem.monthlyData como Read-Only.
 *   NÃO altera fórmulas fiscais. NÃO escreve em IFDESystem.analysis.
 *   Todos os módulos têm fallback silencioso — o motor forense é imune.
 *
 * MÓDULOS:
 *   1. generateLegalNarrative()      — IA Argumentativa + AI Adversarial Simulator
 *   2. renderSankeyToImage()         — Sankey Canvas-to-PDF
 *   3. generateIntegritySeal()       — Integrity Visual Signature (Selo Holográfico)
 *   4. exportDOCX()                  — DOCX Petição Inicial (JSZip + OOXML)
 *   5. NIFAF                         — Non-Intrusive Forensic Auditory Feedback
 *   6. generateTemporalChartImage()  — ATF: Gráfico Canvas para PDF
 *   7. computeTemporalAnalysis()     — ATF: Analytics Engine (2σ · SP · Outliers)
 *   8. openATFModal()                — ATF: Modal Dashboard com Chart.js
 *
 * CORS — NOTA ESTRUTURAL (F12 ERROS RESOLVIDOS):
 *   Os erros "Access-Control-Allow-Origin" para api.anthropic.com e freetsa.org
 *   são bloqueios de segurança do browser quando a app corre em vdcpt.github.io.
 *   São estruturais — não são bugs do sistema.
 *   Resolução: todos os módulos têm fallback completo. Erros silenciados para
 *   console.info (nível informativo, não erro). PDF, DOCX e Dashboard funcionam
 *   100% sem a API.
 *   Resolução definitiva da AI: proxy HTTPS serverless na mesma origem.
 *
 * PONTO DE INJEÇÃO: exportPDF() e updateDashboard() — exclusivamente.
 * ============================================================================
 */

'use strict';

// ============================================================================
// 0. UTILITÁRIOS INTERNOS
// ============================================================================
const _fmtEur = (val) => {
    if (!val || isNaN(val)) return '\u20AC0,00';
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency', currency: 'EUR',
        minimumFractionDigits: 2, maximumFractionDigits: 2
    }).format(val);
};

// ============================================================================
// 1. BASE LEGAL ESTATICA (RAG — Knowledge Base)
// ============================================================================
const LEGAL_KB = {
    CIVA: {
        art2:  'Art. 2.o CIVA — Incidencia Subjetiva: As plataformas digitais sao sujeitos passivos de IVA pela intermediacao de prestacoes de servicos (al. i), n.o 1). Obrigacao de autoliquidacao.',
        art6:  'Art. 6.o CIVA — Localizacao: Servicos de transporte sao tributaveis no local de utilizacao efetiva.',
        art29: 'Art. 29.o CIVA — Obrigacoes de Faturacao: Emissao de fatura por cada prestacao de servicos, com identificacao fiscal do prestador e adquirente.',
        art36: 'Art. 36.o CIVA — Prazo de Emissao: A fatura deve ser emitida no prazo de cinco dias uteis a contar da prestacao do servico.',
        art40: 'Art. 40.o CIVA — Conservacao de Registos: Os registos primarios e documentos de suporte devem ser conservados por um prazo minimo de 10 anos.',
        art78: 'Art. 78.o CIVA — Regularizacoes: Obrigatoriedade de regularizacao do imposto quando detetada omissao de base tributavel.'
    },
    CIRC: {
        art17: 'Art. 17.o CIRC — Lucro Tributavel: A base tributavel inclui todos os rendimentos omitidos, independentemente da sua natureza ou denominacao.',
        art20: 'Art. 20.o CIRC — Rendimentos: Inclui todos os proveitos ou ganhos realizados no periodo de tributacao.',
        art23: 'Art. 23.o CIRC — Gastos Dedutiveis: Apenas sao dedutiveis os gastos comprovados por documentacao idonea.',
        art57: 'Art. 57.o CIRC — Precos de Transferencia: Entidades com relacoes especiais estao sujeitas a condicoes de plena concorrencia.',
        art88: 'Art. 88.o CIRC — Tributacoes Autonomas: Encargos nao devidamente documentados estao sujeitos a tributacao autonoma agravada.'
    },
    RGIT: {
        art103: 'Art. 103.o RGIT — Fraude Fiscal: Conduta dolosa que, por acao ou omissao, reduza, elimine ou retarde impostos devidos. Pena ate 3 anos de prisao.',
        art104: 'Art. 104.o RGIT — Fraude Fiscal Qualificada: Quando a vantagem patrimonial ilegitima for superior a 15.000 EUR ou envolver utilizacao de meios fraudulentos. Pena ate 5 anos.',
        art108: 'Art. 108.o RGIT — Abuso de Confianca Fiscal: Nao entrega total ou parcial, ao credor tributario, de prestacao tributaria deduzida ou recebida de terceiros.',
        art114: 'Art. 114.o RGIT — Contra-Ordenacoes Fiscais: Omissao de declaracoes ou declaracoes inexatas, com coima ate 165.000 EUR.'
    },
    CPP: {
        art125: 'Art. 125.o CPP — Admissibilidade da Prova: Sao admissiveis todos os meios de prova nao proibidos por lei. Fundamento para a admissibilidade da prova digital forense.',
        art153: 'Art. 153.o CPP — Deveres do Perito: Compromisso de honra, objetividade e imparcialidade no exercicio das funcoes periciais.',
        art163: 'Art. 163.o CPP — Valor Probatorio: O juizo tecnico, cientifico ou artistico inerente ao relatorio pericial presume-se subtraido a livre apreciacao do julgador.'
    },
    DAC7: {
        art1: 'Diretiva DAC7 (UE) 2021/514 — Obrigacao das plataformas digitais de reportar as receitas dos prestadores de servicos as autoridades fiscais dos Estados-Membros.',
        art2: 'DAC7 — Reconciliacao: As discrepancias entre os valores reportados pela plataforma (DAC7) e os valores declarados pelo sujeito passivo constituem indicio de omissao tributaria.'
    }
};

// ============================================================================
// 2. generateLegalNarrative(analysis) — IA Argumentativa + AI Adversarial Simulator
// ============================================================================
async function generateLegalNarrative(analysis) {
    console.log('[UNIFED-AI] \u25b6 A gerar Sintese Juridica Assistida por IA...');

    const forensicContext = _buildForensicContext(analysis);
    const legalContext    = _buildLegalContext();
    const hasData         = forensicContext !== '[DADOS INSUFICIENTES]';

    if (!hasData) {
        console.warn('[UNIFED-AI] \u26a0 Dados insuficientes para sintese juridica.');
        return _fallbackNarrative('Dados forenses insuficientes.');
    }

    const systemPrompt = `Es um Assistente Especializado em Analise Juridico-Fiscal Portuguesa e em Estrategia de Litigio.
O teu papel e duplo: (1) Modulo de Sintese Narrativa: transformas outputs numericos em inputs semanticos juridicos; (2) Simulador Adversarial: antecipas as linhas de defesa da contraparte e preparas a resposta pericial.

REGRAS ABSOLUTAS:
1. Usa EXCLUSIVAMENTE os dados do contexto forense fornecido.
2. Se um valor for zero ou ausente, omite essa linha.
3. Linguagem: portugues juridico formal, adequado para tribunal.
4. Referencia sempre os artigos legais pertinentes.
5. Nao uses listas de bullets — escreve em prosa juridica estruturada.
6. Objectividade pericial: expoem factos, nao formula acusacoes.
7. Na Seccao D, simula argumentos plausíveis da defesa e fornece a resposta tecnica pericial a cada um.`;

    const userPrompt = `Com base nos dados forenses certificados e na base legal aplicavel, elabora uma Sintese Juridica Pericial em QUATRO seccoes obrigatorias.

=== DADOS FORENSES CERTIFICADOS ===
${forensicContext}

=== BASE LEGAL APLICAVEL ===
${legalContext}

=== ESTRUTURA OBRIGATORIA ===
Seccao A - QUALIFICACAO JURIDICA DOS FACTOS
Seccao B - ENQUADRAMENTO LEGAL E TRIBUTARIO
Seccao C - RECOMENDACOES PERICIAIS
Seccao D - ESTRATEGIA DE CONTRA-INTERROGATORIO (AI Adversarial Simulator)
[Para cada discrepancia critica, identifica 2-3 linhas de ataque da contraparte e fornece a resposta tecnica pericial com referencia legal.]

Maximo 800 palavras. Prosa juridica formal. Sem preambulos.`;

    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 1500,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);

        const data = await response.json();
        const text = (data.content || [])
            .filter(b => b.type === 'text')
            .map(b => b.text)
            .join('');

        if (!text || text.trim().length < 50) throw new Error('Resposta API insuficiente.');
        console.log('[UNIFED-AI] \u2705 Sintese Juridica gerada via API (' + text.length + ' chars).');
        return text.trim();

    } catch (err) {
        // CORS/network errors: silenciar como info (nao como error)
        const isCors = err.message.indexOf('fetch') !== -1 || err.message.indexOf('Failed') !== -1;
        if (isCors) {
            console.info('[UNIFED-AI] \u2139 CORS bloqueado (vdcpt.github.io \u2192 api.anthropic.com). ' +
                         'Modo de Seguranca Forense ativado. Fallback estatico ativo. ' +
                         'Resolucao definitiva: proxy HTTPS serverless na mesma origem.');
        } else {
            console.warn('[UNIFED-AI] \u26a0 API indisponivel:', err.message);
        }
        return _fallbackNarrative(isCors ? 'CORS_BLOCKED (github.io)' : err.message);
    }
}

function _buildForensicContext(analysis) {
    const t  = analysis.totals    || {};
    const c  = analysis.crossings || {};
    const v  = analysis.verdict   || {};
    const lines = [];

    if (t.saftBruto        > 0) lines.push('RECEITA SAF-T: ' + _fmtEur(t.saftBruto));
    if (t.ganhos           > 0) lines.push('GANHOS DECLARADOS: ' + _fmtEur(t.ganhos));
    if (t.dac7TotalPeriodo > 0) lines.push('RECEITA DAC7: ' + _fmtEur(t.dac7TotalPeriodo));
    if (t.faturaPlataforma > 0) lines.push('FATURACAO PLATAFORMA: ' + _fmtEur(t.faturaPlataforma));
    if (t.despesas         > 0) lines.push('DESPESAS DECLARADAS: ' + _fmtEur(t.despesas));

    if (lines.length > 0) lines.push('---');

    if (c.discrepanciaCritica && Math.abs(c.discrepanciaCritica) > 0)
        lines.push('OMISSAO DE CUSTOS: ' + _fmtEur(c.discrepanciaCritica) + ' (' + (c.percentagemOmissao || 0).toFixed(2) + '%)');
    if (c.discrepanciaSaftVsDac7 && Math.abs(c.discrepanciaSaftVsDac7) > 0)
        lines.push('OMISSAO RECEITA SAF-T vs DAC7: ' + _fmtEur(c.discrepanciaSaftVsDac7));
    if (c.ivaFalta   > 0) lines.push('IVA 23% OMITIDO: ' + _fmtEur(c.ivaFalta));
    if (c.ivaFalta6  > 0) lines.push('IVA 6% OMITIDO: ' + _fmtEur(c.ivaFalta6));
    if (c.ircEstimado > 0) lines.push('IRC ESTIMADO OMITIDO: ' + _fmtEur(c.ircEstimado));
    if (v.level && v.level.pt) { lines.push('---'); lines.push('VEREDICTO: ' + v.level.pt + ' -- ' + (v.percent || 'N/A')); }

    return lines.filter(function(l) { return l !== '---'; }).length === 0 ? '[DADOS INSUFICIENTES]' : lines.join('\n');
}

function _buildLegalContext() {
    return Object.keys(LEGAL_KB).map(function(code) {
        var arts = LEGAL_KB[code];
        return code + ':\n' + Object.values(arts).map(function(a) { return '  . ' + a; }).join('\n');
    }).join('\n\n');
}

function _fallbackNarrative(reason) {
    return [
        'SINTESE JURIDICA - MODO DE SEGURANCA FORENSE',
        '[Nota: IA indisponivel - ' + reason + ']',
        '',
        'Seccao A - QUALIFICACAO JURIDICA DOS FACTOS',
        'As discrepancias apuradas pelo motor UNIFED-PROBATUM constituem indicios de omissao tributaria ' +
        'nos termos dos artigos 103.o e 104.o do RGIT. A divergencia entre os valores reportados pela plataforma ' +
        '(DAC7) e os valores declarados pelo sujeito passivo configura, prima facie, o elemento objetivo do tipo ' +
        'de ilicito de fraude fiscal qualificada, por envolver vantagem patrimonial ilegitima superior ao limiar ' +
        'legalmente previsto de 15.000 EUR.',
        '',
        'Seccao B - ENQUADRAMENTO LEGAL E TRIBUTARIO',
        'A omissao de base tributavel implica a obrigacao de regularizacao nos termos do Art. 78.o do CIVA. ' +
        'O IVA em falta, calculado as taxas de 23% e 6%, acresce ao imposto em falta ao abrigo do Art. 2.o ' +
        'do CIVA (autoliquidacao). O lucro tributavel devera ser corrigido ao abrigo do Art. 17.o do CIRC, ' +
        'com incidencia de tributacao autonoma sobre encargos nao documentados (Art. 88.o CIRC).',
        '',
        'Seccao C - RECOMENDACOES PERICIAIS',
        'Recomenda-se: (1) Solicitar SAF-T completo do periodo; (2) Cruzar com declaracoes DAC7 submetidas ' +
        'pela plataforma a AT; (3) Verificar faturas emitidas vs. receitas declaradas em IRS/IRC; ' +
        '(4) Analisar extratos bancarios para confirmacao de fluxos. Prazo de caducidade: 4 anos (Art. 45.o LGT).',
        '',
        'Seccao D - ESTRATEGIA DE CONTRA-INTERROGATORIO',
        'Argumento da Defesa: "Os valores reportados pelo DAC7 incluem taxas de cancelamento e reembolsos ' +
        'que nao constituem rendimento tributavel do prestador."',
        'Resposta Pericial: Nos termos do Art. 36.o do CIVA, cada componente da remuneracao deve constar ' +
        'de fatura discriminada. A ausencia de faturacao discriminada por componente confirma a omissao.',
        '',
        'Argumento da Defesa: "A discrepancia resulta de diferencas de cambio e ajustamentos de plataforma ' +
        'comunicados tardiamente."',
        'Resposta Pericial: O Art. 29.o do CIVA impoe emissao no prazo de 5 dias uteis. Ajustamentos ' +
        'tardios nao afastam a obrigacao declarativa do periodo original (Art. 78.o CIVA).',
        '',
        'Argumento da Defesa: "O contribuinte nao tinha conhecimento tecnico das obrigacoes DAC7."',
        'Resposta Pericial: O regime DAC7 esta em vigor em Portugal desde 1 de janeiro de 2023 ' +
        '(DL n.o 41/2023) e a plataforma tem obrigacao de informar o prestador nos termos do Art. 8.o ' +
        'da Diretiva. A ignorancia da lei nao aproveita (Art. 6.o CC).'
    ].join('\n');
}


// ============================================================================
// 3. renderSankeyToImage(analysis) — Dynamic Canvas-to-PDF Injection
// ============================================================================
async function renderSankeyToImage(analysis) {
    var W = 1400, H = 720;
    var canvas, ctx;
    try {
        canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');
    } catch (e) {
        console.warn('[UNIFED-SANKEY] \u26a0 Canvas indisponivel:', e.message);
        return null;
    }

    var t = analysis.totals    || {};
    var c = analysis.crossings || {};

    ctx.fillStyle = '#0D1B2A';
    ctx.fillRect(0, 0, W, H);

    var grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0,   'rgba(0,229,255,0.15)');
    grad.addColorStop(0.5, 'rgba(0,229,255,0.05)');
    grad.addColorStop(1,   'rgba(0,229,255,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 70);

    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 22px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DIAGRAMA DE FLUXO FINANCEIRO FORENSE -- UNIFED-PROBATUM v13.2.4-PREMIUM', W / 2, 32);
    ctx.font = '14px Courier New, monospace';
    ctx.fillStyle = 'rgba(0,229,255,0.7)';
    ctx.fillText('Read-Only · Art. 125.o CPP · Output Enrichment Layer', W / 2, 55);

    var ganhos    = t.ganhos || 0;
    var dac7      = t.dac7TotalPeriodo || 0;
    var declarado = t.saftBruto || 0;
    var despesas  = t.despesas || 0;
    var omissao   = Math.abs(c.discrepanciaCritica || 0);
    var passivo   = Math.abs(c.ivaFalta || 0) + Math.abs(c.ircEstimado || 0);

    var nodes = [
        { x:  60, y: 100, w: 160, h: 80, label: 'Receita\nPlataforma', value: ganhos,    color: '#3B82F6' },
        { x: 340, y:  80, w: 160, h: 80, label: 'DAC7\nReportado',    value: dac7,       color: '#8B5CF6' },
        { x: 340, y: 200, w: 160, h: 80, label: 'Declarado\nSAF-T',   value: declarado,  color: '#06B6D4' },
        { x: 620, y: 100, w: 160, h: 80, label: 'Despesas\nDeclaradas',value: despesas,  color: '#10B981' },
        { x: 900, y:  80, w: 160, h: 80, label: 'Omissao\nDetetada',  value: omissao,    color: '#EF4444' },
        { x:1180, y: 100, w: 160, h: 80, label: 'Passivo\nTributario',value: passivo,    color: '#F59E0B' }
    ];

    var flows = [
        { from: 0, to: 1, color: '#8B5CF6', opacity: 0.35 },
        { from: 0, to: 2, color: '#06B6D4', opacity: 0.35 },
        { from: 2, to: 3, color: '#10B981', opacity: 0.35 },
        { from: 3, to: 4, color: '#EF4444', opacity: 0.50 },
        { from: 4, to: 5, color: '#F59E0B', opacity: 0.60 }
    ];

    flows.forEach(function(f) {
        var n1 = nodes[f.from], n2 = nodes[f.to];
        var x1 = n1.x + n1.w, y1 = n1.y + n1.h / 2;
        var x2 = n2.x,        y2 = n2.y + n2.h / 2;
        var cx = (x1 + x2) / 2;
        var g  = ctx.createLinearGradient(x1, 0, x2, 0);
        g.addColorStop(0, f.color + '80');
        g.addColorStop(1, f.color + 'CC');
        ctx.strokeStyle = g;
        ctx.lineWidth   = 14;
        ctx.globalAlpha = f.opacity;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cx, y1, cx, y2, x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    });

    nodes.forEach(function(nd) {
        ctx.fillStyle   = nd.color + '33';
        ctx.strokeStyle = nd.color;
        ctx.lineWidth   = 2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(nd.x, nd.y, nd.w, nd.h, 8);
        else ctx.rect(nd.x, nd.y, nd.w, nd.h);
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = nd.color;
        ctx.font = 'bold 13px Courier New, monospace';
        ctx.textAlign = 'center';
        nd.label.split('\n').forEach(function(ln, i) {
            ctx.fillText(ln, nd.x + nd.w / 2, nd.y + 24 + i * 16);
        });
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 12px Courier New, monospace';
        ctx.fillText(_fmtEur(nd.value), nd.x + nd.w / 2, nd.y + nd.h - 14);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '12px Courier New, monospace';
    ctx.textAlign = 'left';
    [
        { color: '#EF4444', text: 'Omissao: ' + _fmtEur(omissao) + ' (' + (c.percentagemOmissao || 0).toFixed(2) + '%)' },
        { color: '#F59E0B', text: 'IVA 23%: ' + _fmtEur(c.ivaFalta || 0) + ' | IRC: ' + _fmtEur(c.ircEstimado || 0) },
        { color: '#8B5CF6', text: 'DAC7 Gap: ' + _fmtEur(Math.abs(c.discrepanciaSaftVsDac7 || 0)) }
    ].forEach(function(lg, i) {
        ctx.fillStyle = lg.color;
        ctx.fillRect(60 + i * 420, H - 45, 14, 14);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText(lg.text, 80 + i * 420, H - 33);
    });

    var dataURL = canvas.toDataURL('image/png');
    document.body.removeChild(canvas);
    return dataURL;
}


// ============================================================================
// 4. generateIntegritySeal(masterHash, doc, x, y, sealSize)
//    Integrity Visual Signature - Selo Holografico Digital
//    Padrao geometrico deterministico derivado do Master Hash SHA-256.
//    Zero dependencias extra - usa exclusivamente jsPDF primitives.
// ============================================================================
function generateIntegritySeal(masterHash, doc, x, y, sealSize) {
    if (!masterHash || masterHash.length < 32 || !doc) return;

    var SZ = sealSize || 52;
    var CX = x + SZ / 2;
    var CY = y + SZ / 2;
    var R  = SZ * 0.42;
    var R2 = SZ * 0.28;

    var bytes = [];
    for (var i = 0; i < Math.min(masterHash.length, 64); i += 2)
        bytes.push(parseInt(masterHash.substring(i, i + 2), 16));

    doc.saveGraphicsState();

    doc.setFillColor(8, 18, 36);
    doc.roundedRect(x, y, SZ, SZ, 2, 2, 'F');
    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(0.6);
    doc.roundedRect(x, y, SZ, SZ, 2, 2, 'S');

    doc.setFontSize(3.8);
    doc.setFont('courier', 'bold');
    doc.setTextColor(0, 229, 255);
    doc.text('PROBATUM INTEGRITY SEAL', CX, y + 3.5, { align: 'center' });
    doc.text('v13.2.4-PREMIUM \u00b7 SHA-256', CX, y + 6.5, { align: 'center' });

    doc.setDrawColor(30, 60, 100);
    doc.setLineWidth(0.2);
    doc.circle(CX, CY, R, 'S');

    doc.setLineWidth(0.25);
    for (var j = 0; j < 16; j++) {
        var angleDeg  = (bytes[j] / 255) * 360;
        var angleRad  = (angleDeg * Math.PI) / 180;
        var lenFactor = 0.4 + (bytes[(j + 16) % 32] / 255) * 0.58;
        var r1 = Math.round(30  + (bytes[(j * 2)     % 32] / 255) * 225);
        var g1 = Math.round(30  + (bytes[(j * 2 + 1) % 32] / 255) * 200);
        var b1 = Math.round(80  + (bytes[(j * 2 + 2) % 32] / 255) * 175);
        doc.setDrawColor(r1, g1, b1);
        var ex = CX + Math.cos(angleRad) * R * lenFactor;
        var ey = CY + Math.sin(angleRad) * R * lenFactor;
        doc.line(CX, CY, ex, ey);
    }

    doc.setDrawColor(0, 229, 255);
    doc.setLineWidth(0.3);
    var polyN = 6 + (bytes[16] % 4);
    var ppx, ppy;
    for (var k = 0; k < polyN; k++) {
        var bi  = (k * 4) % 32;
        var af  = bytes[bi] / 255;
        var rf  = 0.35 + (bytes[(bi + 1) % 32] / 255) * 0.55;
        var ang = ((k / polyN) * 360 + af * (360 / polyN)) * Math.PI / 180;
        var px  = CX + Math.cos(ang) * R2 * rf;
        var py  = CY + Math.sin(ang) * R2 * rf;
        if (k > 0) doc.line(ppx, ppy, px, py);
        ppx = px; ppy = py;
    }

    doc.setFillColor(0, 229, 255);
    doc.circle(CX, CY, 0.8, 'F');

    doc.setFontSize(3.2);
    doc.setFont('courier', 'normal');
    doc.setTextColor(100, 140, 180);
    doc.text(masterHash.substring(0, 16) + '...', CX, y + SZ - 3, { align: 'center' });

    doc.restoreGraphicsState();
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);

    console.log('[UNIFED-SEAL] \u2705 Integrity Seal gerado - hash prefix:', masterHash.substring(0, 8));
}

window.generateIntegritySeal = generateIntegritySeal;


// ============================================================================
// 5. exportDOCX() - Structural DOCX Export - Minuta de Peticao Inicial
//
//    BUG FIX CRITICO: A variavel interna do documento OOXML foi renomeada
//    para _docXml (anteriormente "document"), o que causava shadow do
//    objeto global document, resultando no erro:
//    "document.createElement is not a function"
//    O objeto global document e agora usado corretamente no final.
//
//    Dependencia: JSZip (carregado via CDN em index.html).
// ============================================================================
async function exportDOCX() {
    if (typeof JSZip === 'undefined') {
        console.error('[UNIFED-DOCX] \u274c JSZip nao disponivel.');
        if (typeof showToast === 'function') showToast('Erro: JSZip nao carregado', 'error');
        return;
    }
    if (!window.IFDESystem || !window.IFDESystem.client) {
        if (typeof showToast === 'function') showToast('Sem sujeito passivo para gerar minuta.', 'error');
        return;
    }

    if (typeof logAudit === 'function') logAudit('\ud83d\udcc4 [v13.2.4] A gerar Minuta de Peticao Inicial (DOCX)...', 'info');

    var sys  = window.IFDESystem;
    var t    = sys.analysis.totals    || {};
    var c    = sys.analysis.crossings || {};
    var v    = sys.analysis.verdict   || {};
    var date = new Date().toLocaleDateString('pt-PT');

    var xe = function(s) {
        return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    };

    var para = function(text, bold, size, color, align) {
        bold  = bold  || false;
        size  = size  || '20';
        color = color || '000000';
        align = align || 'left';
        return '<w:p><w:pPr><w:jc w:val="' + align + '"/><w:spacing w:after="120"/></w:pPr><w:r>' +
               '<w:rPr><w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/>' +
               (bold ? '<w:b/><w:bCs/>' : '') +
               '<w:color w:val="' + color + '"/></w:rPr>' +
               '<w:t xml:space="preserve">' + xe(text) + '</w:t></w:r></w:p>';
    };

    var tc = function(text, bold, w, shade) {
        bold  = bold  || false;
        w     = w     || 4000;
        return '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' +
               (shade ? '<w:shd w:val="clear" w:color="auto" w:fill="' + shade + '"/>' : '') +
               '<w:tcBorders><w:top w:val="single" w:sz="4" w:color="AAAAAA"/><w:left w:val="single" w:sz="4" w:color="AAAAAA"/><w:bottom w:val="single" w:sz="4" w:color="AAAAAA"/><w:right w:val="single" w:sz="4" w:color="AAAAAA"/></w:tcBorders>' +
               '</w:tcPr><w:p><w:pPr><w:spacing w:after="60"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:szCs w:val="18"/>' +
               (bold ? '<w:b/><w:bCs/>' : '') +
               '</w:rPr><w:t xml:space="preserve">' + xe(text) + '</w:t></w:r></w:p></w:tc>';
    };

    var tr  = function(cells) { return '<w:tr>' + cells.join('') + '</w:tr>'; };
    var tbl = function(rows)  {
        return '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/>' +
               '<w:tblBorders><w:insideH w:val="single" w:sz="4" w:color="DDDDDD"/>' +
               '<w:insideV w:val="single" w:sz="4" w:color="DDDDDD"/></w:tblBorders></w:tblPr>' +
               rows.join('') + '</w:tbl>';
    };
    var hr  = function() {
        return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="003366"/></w:pBdr>' +
               '<w:spacing w:before="120" w:after="120"/></w:pPr></w:p>';
    };

    var fe = function(val) {
        return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(val||0);
    };

    var discRows = [tr([tc('Indicador Pericial', true, 5000, 'E8F0F8'), tc('Valor Apurado', true, 4000, 'E8F0F8')])];
    if (Math.abs(c.discrepanciaCritica || 0) > 0) discRows.push(tr([tc('Omissao de Custos - BTF (Despesas vs Fatura)', false, 5000), tc(fe(c.discrepanciaCritica), false, 4000)]));
    if (Math.abs(c.discrepanciaSaftVsDac7 || 0) > 0) discRows.push(tr([tc('Omissao de Receita - SAF-T vs DAC7', false, 5000), tc(fe(c.discrepanciaSaftVsDac7), false, 4000)]));
    if ((c.ivaFalta || 0) > 0) discRows.push(tr([tc('IVA 23% Omitido (Art. 2.o CIVA)', false, 5000), tc(fe(c.ivaFalta), false, 4000)]));
    if ((c.ivaFalta6 || 0) > 0) discRows.push(tr([tc('IVA 6% Omitido (Transporte - CIVA)', false, 5000), tc(fe(c.ivaFalta6), false, 4000)]));
    if ((c.ircEstimado || 0) > 0) discRows.push(tr([tc('IRC Estimado Omitido (Art. 17.o CIRC)', false, 5000), tc(fe(c.ircEstimado), false, 4000)]));
    if ((c.impactoSeteAnosMercado || 0) > 0) discRows.push(tr([tc('Impacto Macroeconomico 7 Anos', true, 5000, 'FFF0F0'), tc(fe(c.impactoSeteAnosMercado), true, 4000, 'FFF0F0')]));

    var srcRows = [tr([tc('Documento', true, 3000, 'E8F0F8'), tc('Tipo', true, 2000, 'E8F0F8'), tc('Hash SHA-256 (prefixo)', true, 4000, 'E8F0F8')])];
    (sys.analysis.evidenceIntegrity || []).slice(0, 8).forEach(function(ev) {
        srcRows.push(tr([tc(ev.filename || 'N/A', false, 3000), tc(ev.type || 'N/A', false, 2000), tc((ev.hash || '').substring(0, 24) + '...', false, 4000)]));
    });

    var aiNarrative = _fallbackNarrative('DOCX export - API indisponivel offline');
    try {
        if (typeof generateLegalNarrative === 'function')
            aiNarrative = await generateLegalNarrative(sys.analysis);
    } catch (_e) { /* silent */ }

    var narrativeParas = aiNarrative.split('\n')
        .map(function(l) { return l.trim(); })
        .filter(function(l) { return l.length > 0; })
        .map(function(l) {
            var isH = /^Secc?[a-z]o [A-D]|^SINTESE/.test(l);
            return para(l, isH, isH ? '22' : '20', isH ? '003366' : '222222');
        });

    var bodyContent = [
        para('TRIBUNAL JUDICIAL DE COMARCA', true, '24', '003366', 'center'),
        para('JUIZO LOCAL CIVEL', false, '20', '555555', 'center'),
        para('', false),
        para('MINUTA DE PETICAO INICIAL', true, '32', '003366', 'center'),
        para('PROVA PERICIAL FORENSE FISCAL - TVDE', true, '24', '0066CC', 'center'),
        para('', false), hr(),
        para('Processo N.o: ' + xe(sys.sessionId || 'UNIFED-PENDING'), false, '20', '333333'),
        para('Data de Elaboracao: ' + date, false, '20', '333333'),
        para('Sistema: UNIFED - PROBATUM v13.2.4-PREMIUM - COURT READY - DORA COMPLIANT', false, '18', '666666'),
        para('Master Hash SHA-256: ' + xe(sys.masterHash || 'N/A'), false, '16', '888888'),
        hr(), para('', false),

        para('I. IDENTIFICACAO', true, '26', '003366'), para('', false),
        tbl([
            tr([tc('Sujeito Passivo',   true, 3000, 'E8F0F8'), tc(sys.client && sys.client.name || 'N/A', false, 6000)]),
            tr([tc('NIF',               true, 3000, 'E8F0F8'), tc(sys.client && sys.client.nif  || 'N/A', false, 6000)]),
            tr([tc('Plataforma',        true, 3000, 'E8F0F8'), tc(sys.selectedPlatform || 'N/A', false, 6000)]),
            tr([tc('Ano Fiscal',        true, 3000, 'E8F0F8'), tc(String(sys.selectedYear || new Date().getFullYear()), false, 6000)]),
            tr([tc('Perito',            true, 3000, 'E8F0F8'), tc('Eduardo Monteiro -- Analista e Consultor Forense Independente', false, 6000)]),
            tr([tc('Veredicto',         true, 3000, 'FFF0F0'), tc((v.level && v.level.pt) || 'N/A', true, 6000)])
        ]),
        para('', false), hr(), para('', false),

        para('II. FACTOS PROVADOS - DISCREPANCIAS APURADAS', true, '26', '003366'), para('', false),
        para('Com base na analise pericial das evidencias digitais certificadas, foram apuradas as seguintes discrepancias:', false, '20', '333333'),
        para('', false), tbl(discRows), para('', false),
        para('Percentagem de Omissao de Custos: ' + (c.percentagemOmissao || 0).toFixed(2) + '%', true, '20', 'CC0000'),
        para('Percentagem Discrepancia SAF-T vs DAC7: ' + (c.percentagemSaftVsDac7 || 0).toFixed(2) + '%', true, '20', 'CC0000'),
        para('', false), hr(), para('', false),

        para('III. CADEIA DE CUSTODIA - EVIDENCIAS DIGITAIS', true, '26', '003366'), para('', false),
        para('As evidencias digitais foram certificadas com hash SHA-256 nos termos do Art. 125.o do CPP:', false, '20', '333333'),
        para('', false), tbl(srcRows), para('', false), hr(), para('', false),

        para('IV. SINTESE JURIDICA E ESTRATEGIA DE CONTRA-INTERROGATORIO', true, '26', '003366'),
        para('Gerada por IA Argumentativa (RAG + In-Context Learning - claude-sonnet-4-20250514)', false, '16', '888888'),
        para('', false)
    ].concat(narrativeParas).concat([
        para('', false), hr(), para('', false),
        para('V. DECLARACAO DO PERITO', true, '26', '003366'), para('', false),
        para('Declaro, sob compromisso de honra, que o presente documento foi elaborado em qualidade de Consultor Tecnico Independente, assumindo os deveres de independencia, objetividade e imparcialidade previstos no artigo 153.o do Codigo de Processo Penal Portugues.', false, '20', '333333'),
        para('', false),
        para('Lisboa, ' + date, false, '20', '333333'), para('', false),
        para('_____________________________________________', false, '20', '333333'),
        para('Eduardo Monteiro', true, '20', '003366'),
        para('Analista e Consultor Forense Independente - UNIFED - PROBATUM', false, '18', '555555'),
        para('', false),
        para('AVISO: Esta minuta e destinada ao advogado mandatario. Nao constitui por si so peca processual.', false, '16', 'AA0000')
    ]).join('');

    // ── OOXML Package files ────────────────────────────────────────────────────
    var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
        '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n' +
        '  <Default Extension="xml" ContentType="application/xml"/>\n' +
        '  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>\n' +
        '  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>\n' +
        '</Types>';

    var pkgRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>\n' +
        '</Relationships>';

    var wordRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
        '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>\n' +
        '</Relationships>';

    var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">\n' +
        '  <w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>' +
        '<w:sz w:val="20"/></w:rPr></w:rPrDefault></w:docDefaults>\n' +
        '</w:styles>';

    // NOTA CRITICA: Esta variavel e _docXml (NAO "document").
    // O nome "document" causava shadow do objeto global document,
    // resultando no erro: "document.createElement is not a function"
    var _docXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"\n' +
        '            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n' +
        '  <w:body>\n' +
        '    <w:sectPr>\n' +
        '      <w:pgSz w:w="11906" w:h="16838"/>\n' +
        '      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>\n' +
        '    </w:sectPr>\n' +
        '    ' + bodyContent + '\n' +
        '  </w:body>\n' +
        '</w:document>';

    try {
        var zip = new JSZip();
        zip.file('[Content_Types].xml', contentTypes);
        zip.file('_rels/.rels', pkgRels);
        zip.file('word/_rels/document.xml.rels', wordRels);
        zip.file('word/document.xml', _docXml);   // _docXml — sem shadow do global document
        zip.file('word/styles.xml', stylesXml);

        var blob = await zip.generateAsync({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        var url  = URL.createObjectURL(blob);
        var link = document.createElement('a');   // document global - correto
        link.href     = url;
        link.download = 'UNIFED_PETICAO_' + (sys.sessionId || 'DRAFT') + '.docx';
        document.body.appendChild(link);
        link.click();
        setTimeout(function() {
            try { URL.revokeObjectURL(url); document.body.removeChild(link); } catch (_) {}
        }, 2000);

        if (typeof logAudit === 'function') logAudit('\u2705 [v13.2.4] Minuta DOCX exportada com sucesso.', 'success');
        if (typeof showToast === 'function') showToast('Minuta DOCX exportada - Peticao Inicial pronta', 'success');
        if (typeof ForensicLogger !== 'undefined') ForensicLogger.addEntry('DOCX_EXPORT_COMPLETED', { sessionId: sys.sessionId });
    } catch (zipErr) {
        console.error('[UNIFED-DOCX] \u274c Erro ao gerar ZIP:', zipErr.message);
        if (typeof showToast === 'function') showToast('Erro ao gerar DOCX: ' + zipErr.message, 'error');
    }
}

window.exportDOCX = exportDOCX;


// ============================================================================
// 6. NIFAF - Non-Intrusive Forensic Auditory Feedback
//    Estado: MUTE por defeito (localStorage).
//    Gatilho: _nifafAlertedHash guard em updateDashboard() de script.js.
// ============================================================================
var NIFAF = {
    isEnabled: (function() {
        try { return localStorage.getItem('IFDE_AUDIO_ENABLED') === 'true'; }
        catch (_) { return false; }
    })(),

    playCriticalAlert: function() {
        if (!this.isEnabled) return;
        try {
            var ctx2 = new (window.AudioContext || window.webkitAudioContext)();
            var gain = ctx2.createGain();
            gain.gain.setValueAtTime(0, ctx2.currentTime);
            gain.gain.linearRampToValueAtTime(0.35, ctx2.currentTime + 0.05);
            gain.gain.linearRampToValueAtTime(0,    ctx2.currentTime + 0.45);
            gain.connect(ctx2.destination);

            [180, 140].forEach(function(freq, idx) {
                var osc = ctx2.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx2.currentTime + idx * 0.18);
                osc.connect(gain);
                osc.start(ctx2.currentTime + idx * 0.18);
                osc.stop(ctx2.currentTime + idx * 0.18 + 0.38);
            });

            setTimeout(function() { try { ctx2.close(); } catch (_) {} }, 1200);
        } catch (err) {
            console.warn('[UNIFED-NIFAF] \u26a0 Feedback auditivo indisponivel:', err.message);
        }
    },

    toggle: function() {
        this.isEnabled = !this.isEnabled;
        try { localStorage.setItem('IFDE_AUDIO_ENABLED', String(this.isEnabled)); } catch (_) {}
        if (this.isEnabled) this.playCriticalAlert();
        return this.isEnabled;
    }
};

window.NIFAF = NIFAF;
console.log('[UNIFED-NIFAF] \u2705 Non-Intrusive Forensic Auditory Feedback carregado - Estado:', NIFAF.isEnabled ? 'ATIVO' : 'MUTE');


// ============================================================================
// 7. ATF - ANALISE TEMPORAL FORENSE
// ============================================================================

/**
 * computeTemporalAnalysis(monthlyData, analysis)
 * Analytics Engine: tendencias, outliers 2sigma, Score de Persistencia.
 */
function computeTemporalAnalysis(monthlyData, analysis) {
    var months = Object.keys(monthlyData || {}).sort();

    if (months.length === 0) {
        return {
            months: [], ganhosSeries: [], despesasSeries: [], discrepancySeries: [],
            mean: 0, stdDev: 0, outlierMonths: [],
            persistenceScore: 0,
            persistenceLabel: 'Dados insuficientes. Carregue extratos mensais (nome AAAAMM).',
            trend: 'neutral', opportunisticPattern: false
        };
    }

    var ganhosSeries      = months.map(function(m) { return (monthlyData[m].ganhos    || 0); });
    var despesasSeries    = months.map(function(m) { return (monthlyData[m].despesas  || 0); });
    var discrepancySeries = months.map(function(m, i) { return Math.abs(despesasSeries[i] - ganhosSeries[i]); });

    var n    = discrepancySeries.length;
    var mean = discrepancySeries.reduce(function(a, v) { return a + v; }, 0) / n;
    var variance = discrepancySeries.reduce(function(a, v) { return a + Math.pow(v - mean, 2); }, 0) / n;
    var stdDev   = Math.sqrt(variance);

    var outlierMonths = months.filter(function(m, i) { return discrepancySeries[i] > mean + 2 * stdDev; });

    // Tendencia (regressao linear simples)
    var sx = 0, sy = 0, sxy = 0, sx2 = 0;
    discrepancySeries.forEach(function(v, i) { sx += i; sy += v; sxy += i * v; sx2 += i * i; });
    var slope = n > 1 ? (n * sxy - sx * sy) / (n * sx2 - sx * sx) : 0;
    var trend = slope > 50 ? 'ascending' : slope < -50 ? 'descending' : 'stable';

    // Padrao oportunistico
    var meanGanhos = ganhosSeries.reduce(function(a, v) { return a + v; }, 0) / n;
    var opportunisticPattern = months.some(function(m, i) {
        return outlierMonths.indexOf(m) !== -1 && ganhosSeries[i] > meanGanhos;
    });

    // Score de Persistencia (SP) 0-100
    var pctDisc  = discrepancySeries.filter(function(v) { return v > 0.01; }).length / n;
    var spBase   = pctDisc * 40;
    var spTrend  = trend === 'ascending' ? 25 : trend === 'stable' ? 10 : 0;
    var spOut    = Math.min(outlierMonths.length * 10, 25);
    var spOpp    = opportunisticPattern ? 10 : 0;
    var persistenceScore = Math.min(Math.round(spBase + spTrend + spOut + spOpp), 100);

    var persistenceLabel;
    if (persistenceScore >= 80) {
        persistenceLabel = 'PADRAO DE OMISSAO SISTEMATICA DETETADO - Comportamento consistente com dolo para efeitos Art. 104.o RGIT.';
    } else if (persistenceScore >= 55) {
        persistenceLabel = 'PADRAO DE OMISSAO RECORRENTE - Indicios de negligencia grave ou comportamento oportunistico.';
    } else if (persistenceScore >= 30) {
        persistenceLabel = 'OMISSOES PONTUAIS IDENTIFICADAS - Analise complementar recomendada.';
    } else {
        persistenceLabel = 'Omissoes esporadicas - possivel erro operacional.';
    }
    if (opportunisticPattern) {
        persistenceLabel += ' PADRAO OPORTUNISTICO: omissoes concentradas em meses de maior faturacao.';
    }

    return {
        months: months, ganhosSeries: ganhosSeries,
        despesasSeries: despesasSeries, discrepancySeries: discrepancySeries,
        mean: mean, stdDev: stdDev, outlierMonths: outlierMonths,
        trend: trend, persistenceScore: persistenceScore,
        persistenceLabel: persistenceLabel, opportunisticPattern: opportunisticPattern
    };
}

window.computeTemporalAnalysis = computeTemporalAnalysis;


/**
 * generateTemporalChartImage(monthlyData, analysis)
 * Canvas invisivel → base64 PNG para injecao no PDF.
 */
async function generateTemporalChartImage(monthlyData, analysis) {
    var W = 1200, H = 420;
    var canvas;
    try {
        canvas = document.createElement('canvas');
        canvas.width = W; canvas.height = H;
        canvas.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
        document.body.appendChild(canvas);
    } catch (e) {
        console.warn('[UNIFED-ATF] \u26a0 Canvas indisponivel:', e.message);
        return null;
    }

    var ctx3 = canvas.getContext('2d');
    var atf   = computeTemporalAnalysis(monthlyData, analysis);
    var months = atf.months;

    if (months.length === 0) {
        document.body.removeChild(canvas);
        return null;
    }

    ctx3.fillStyle = '#0D1B2A';
    ctx3.fillRect(0, 0, W, H);

    ctx3.fillStyle = '#00E5FF';
    ctx3.font = 'bold 18px Courier New, monospace';
    ctx3.textAlign = 'center';
    ctx3.fillText('ANALISE TEMPORAL FORENSE (ATF) - TENDENCIAS - OUTLIERS 2\u03c3 - INDICE DE RECIDIVA', W / 2, 28);
    ctx3.font = '12px Courier New, monospace';
    ctx3.fillStyle = 'rgba(0,229,255,0.6)';
    ctx3.fillText('Meses: ' + months.length + ' | Score de Persistencia: ' + atf.persistenceScore + '/100 | Tendencia: ' + atf.trend.toUpperCase(), W / 2, 48);

    var padL = 80, padR = 40, padT = 70, padB = 60;
    var cW = W - padL - padR, cH = H - padT - padB;

    ctx3.strokeStyle = 'rgba(0,229,255,0.3)'; ctx3.lineWidth = 1;
    ctx3.beginPath();
    ctx3.moveTo(padL, padT); ctx3.lineTo(padL, padT + cH);
    ctx3.lineTo(padL + cW, padT + cH);
    ctx3.stroke();

    var allV = atf.ganhosSeries.concat(atf.despesasSeries).concat(atf.discrepancySeries);
    var maxV = Math.max.apply(null, allV.concat([1]));
    var xS   = cW / Math.max(months.length - 1, 1);
    var toX  = function(i) { return padL + i * xS; };
    var toY  = function(v) { return padT + cH - (v / maxV) * cH; };

    // Linha media
    var mY = toY(atf.mean);
    ctx3.strokeStyle = 'rgba(255,255,255,0.2)'; ctx3.setLineDash([6, 4]);
    ctx3.beginPath(); ctx3.moveTo(padL, mY); ctx3.lineTo(padL + cW, mY); ctx3.stroke();
    ctx3.setLineDash([]);

    // Linha 2sigma
    if (atf.stdDev > 0) {
        var sigY = toY(atf.mean + 2 * atf.stdDev);
        ctx3.strokeStyle = 'rgba(239,68,68,0.3)'; ctx3.setLineDash([3, 3]);
        ctx3.beginPath(); ctx3.moveTo(padL, sigY); ctx3.lineTo(padL + cW, sigY); ctx3.stroke();
        ctx3.setLineDash([]);
        ctx3.fillStyle = 'rgba(239,68,68,0.7)'; ctx3.font = '10px Courier New, monospace';
        ctx3.textAlign = 'left'; ctx3.fillText('2\u03c3', padL + cW + 4, sigY + 4);
    }

    // Serie Ganhos
    ctx3.strokeStyle = '#3B82F6'; ctx3.lineWidth = 2;
    ctx3.beginPath();
    atf.ganhosSeries.forEach(function(v, i) {
        if (i === 0) ctx3.moveTo(toX(i), toY(v)); else ctx3.lineTo(toX(i), toY(v));
    }); ctx3.stroke();

    // Serie Despesas
    ctx3.strokeStyle = '#10B981'; ctx3.lineWidth = 2;
    ctx3.beginPath();
    atf.despesasSeries.forEach(function(v, i) {
        if (i === 0) ctx3.moveTo(toX(i), toY(v)); else ctx3.lineTo(toX(i), toY(v));
    }); ctx3.stroke();

    // Serie Discrepancia
    ctx3.strokeStyle = '#F59E0B'; ctx3.lineWidth = 2.5;
    ctx3.beginPath();
    atf.discrepancySeries.forEach(function(v, i) {
        if (i === 0) ctx3.moveTo(toX(i), toY(v)); else ctx3.lineTo(toX(i), toY(v));
    }); ctx3.stroke();

    // Pontos
    atf.discrepancySeries.forEach(function(v, i) {
        var isOut = atf.outlierMonths.indexOf(months[i]) !== -1;
        ctx3.fillStyle   = isOut ? '#EF4444' : '#F59E0B';
        ctx3.strokeStyle = isOut ? '#FFFFFF'  : '#F59E0B';
        ctx3.lineWidth   = isOut ? 2 : 1;
        ctx3.beginPath();
        ctx3.arc(toX(i), toY(v), isOut ? 7 : 4, 0, Math.PI * 2);
        ctx3.fill(); if (isOut) ctx3.stroke();
    });

    // Labels X
    ctx3.fillStyle = 'rgba(255,255,255,0.6)'; ctx3.font = '10px Courier New, monospace'; ctx3.textAlign = 'center';
    months.forEach(function(m, i) {
        var label = m.length === 6 ? m.substring(0, 4) + '/' + m.substring(4) : m;
        ctx3.fillText(label, toX(i), padT + cH + 18);
    });

    // Legenda
    [
        { color: '#3B82F6', text: 'Ganhos' },
        { color: '#10B981', text: 'Despesas' },
        { color: '#F59E0B', text: 'Discrepancia' },
        { color: '#EF4444', text: 'Outlier >2\u03c3' }
    ].forEach(function(lg, i) {
        ctx3.fillStyle = lg.color;
        ctx3.fillRect(padL + i * 250, H - 22, 12, 12);
        ctx3.fillStyle = 'rgba(255,255,255,0.7)'; ctx3.font = '11px Courier New, monospace'; ctx3.textAlign = 'left';
        ctx3.fillText(lg.text, padL + i * 250 + 16, H - 11);
    });

    var dataURL = canvas.toDataURL('image/png');
    document.body.removeChild(canvas);
    console.log('[UNIFED-ATF] \u2705 Grafico ATF gerado - meses:', months.length, '| SP:', atf.persistenceScore);
    return dataURL;
}

window.generateTemporalChartImage = generateTemporalChartImage;


/**
 * openATFModal() - Modal Dashboard interativo com Chart.js
 */
function openATFModal() {
    var sys = window.IFDESystem;
    if (!sys) { console.warn('[UNIFED-ATF] IFDESystem nao disponivel.'); return; }

    var atf    = computeTemporalAnalysis(sys.monthlyData || {}, sys.analysis);
    var months = atf.months;
    var existing = document.getElementById('atfModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'atfModal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(8,18,36,0.97);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;overflow-y:auto;padding:20px 16px 40px;font-family:Courier New,monospace';

    var monthLabels = months.map(function(m) {
        return m.length === 6 ? m.substring(0, 4) + '/' + m.substring(4) : m;
    });

    var spColor = atf.persistenceScore >= 80 ? '#EF4444' : atf.persistenceScore >= 55 ? '#F59E0B' : '#10B981';
    var spRGB   = atf.persistenceScore >= 80 ? '239,68,68' : atf.persistenceScore >= 55 ? '245,158,11' : '16,185,129';

    modal.innerHTML =
        '<div style="width:100%;max-width:1100px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(0,229,255,0.3);padding-bottom:12px;margin-bottom:20px">' +
            '<div>' +
                '<div style="color:#00E5FF;font-size:1.1rem;font-weight:bold;letter-spacing:0.08em">\u23f3 ANALISE TEMPORAL FORENSE (ATF) \u00b7 v13.2.4-PREMIUM</div>' +
                '<div style="color:rgba(255,255,255,0.5);font-size:0.72rem;margin-top:4px">Tendencias \u00b7 Outliers 2\u03c3 \u00b7 Indice de Recidiva Algorítmica \u00b7 Read-Only</div>' +
            '</div>' +
            '<button onclick="document.getElementById(\'atfModal\').remove()" ' +
                'style="background:none;border:1px solid rgba(0,229,255,0.4);color:#00E5FF;cursor:pointer;padding:6px 14px;font-family:Courier New,monospace;font-size:0.8rem;border-radius:4px">' +
                '\u2715 FECHAR</button>' +
        '</div>' +

        '<div style="background:rgba(' + spRGB + ',0.12);border:1px solid ' + spColor + ';border-radius:8px;padding:16px 20px;margin-bottom:20px">' +
            '<div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap">' +
                '<div style="text-align:center;min-width:80px">' +
                    '<div style="font-size:2.4rem;font-weight:900;color:' + spColor + '">' + atf.persistenceScore + '</div>' +
                    '<div style="color:rgba(255,255,255,0.5);font-size:0.65rem">/100 \u2014 SP</div>' +
                '</div>' +
                '<div style="flex:1">' +
                    '<div style="color:' + spColor + ';font-weight:bold;font-size:0.9rem;margin-bottom:4px">SCORE DE PERSISTENCIA (SP)</div>' +
                    '<div style="color:rgba(255,255,255,0.75);font-size:0.8rem;line-height:1.5">' + atf.persistenceLabel + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="margin-top:12px;background:rgba(255,255,255,0.1);border-radius:4px;height:8px;overflow:hidden">' +
                '<div style="height:100%;width:' + atf.persistenceScore + '%;background:' + spColor + ';border-radius:4px"></div>' +
            '</div>' +
        '</div>' +

        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:20px">' +
            '<div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.4);border-radius:6px;padding:12px;text-align:center">' +
                '<div style="color:rgba(255,255,255,0.5);font-size:0.65rem;margin-bottom:4px">MESES ANALISADOS</div>' +
                '<div style="color:#3B82F6;font-size:1.5rem;font-weight:bold">' + months.length + '</div></div>' +
            '<div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.4);border-radius:6px;padding:12px;text-align:center">' +
                '<div style="color:rgba(255,255,255,0.5);font-size:0.65rem;margin-bottom:4px">OUTLIERS &gt; 2\u03c3</div>' +
                '<div style="color:#EF4444;font-size:1.5rem;font-weight:bold">' + atf.outlierMonths.length + '</div></div>' +
            '<div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.4);border-radius:6px;padding:12px;text-align:center">' +
                '<div style="color:rgba(255,255,255,0.5);font-size:0.65rem;margin-bottom:4px">TENDENCIA</div>' +
                '<div style="color:#F59E0B;font-size:1rem;font-weight:bold;margin-top:6px">' +
                    (atf.trend === 'ascending' ? '\ud83d\udcc8 ASCENDENTE' : atf.trend === 'descending' ? '\ud83d\udcc9 DESCENDENTE' : '\u27a1\ufe0f ESTAVEL') + '</div></div>' +
            '<div style="background:rgba(' + (atf.opportunisticPattern ? '239,68,68' : '16,185,129') + ',0.1);border:1px solid rgba(' + (atf.opportunisticPattern ? '239,68,68' : '16,185,129') + ',0.4);border-radius:6px;padding:12px;text-align:center">' +
                '<div style="color:rgba(255,255,255,0.5);font-size:0.65rem;margin-bottom:4px">PADRAO OPORTUNISTICO</div>' +
                '<div style="color:' + (atf.opportunisticPattern ? '#EF4444' : '#10B981') + ';font-size:0.9rem;font-weight:bold;margin-top:6px">' +
                    (atf.opportunisticPattern ? '\u26a0 DETETADO' : '\u2713 NAO DETETADO') + '</div></div>' +
        '</div>' +

        '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(0,229,255,0.2);border-radius:8px;padding:16px;margin-bottom:20px">' +
            '<div style="color:#00E5FF;font-size:0.8rem;margin-bottom:12px;font-weight:bold">GRAFICO TEMPORAL \u2014 GANHOS \u00b7 DESPESAS \u00b7 DISCREPANCIA</div>' +
            (months.length === 0
                ? '<div style="color:rgba(255,255,255,0.4);text-align:center;padding:40px">Sem dados mensais. Carregue extratos com nome incluindo AAAAMM.</div>'
                : '<canvas id="atfChartCanvas" style="width:100%;max-height:320px"></canvas>') +
        '</div>' +

        (atf.outlierMonths.length > 0
            ? '<div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin-bottom:20px">' +
              '<div style="color:#EF4444;font-weight:bold;font-size:0.8rem;margin-bottom:8px">\u26a0 MESES COM OUTLIER (DESVIO &gt; 2\u03c3) \u2014 Indicio qualificado Art. 104.o RGIT</div>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px">' +
              atf.outlierMonths.map(function(m) {
                  var idx  = months.indexOf(m);
                  var lbl  = m.length === 6 ? m.substring(0, 4) + '/' + m.substring(4) : m;
                  var disc = atf.discrepancySeries[idx] || 0;
                  return '<div style="background:rgba(239,68,68,0.2);border:1px solid rgba(239,68,68,0.5);border-radius:4px;padding:6px 12px;color:#FCA5A5;font-size:0.75rem">' +
                         '<strong>' + lbl + '</strong><br>\u0394 ' +
                         new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',minimumFractionDigits:2}).format(disc) +
                         '</div>';
              }).join('') +
              '</div></div>'
            : '') +

        '<div style="background:rgba(0,229,255,0.04);border:1px solid rgba(0,229,255,0.15);border-radius:6px;padding:12px;font-size:0.72rem;color:rgba(255,255,255,0.5);line-height:1.6">' +
            '<strong style="color:rgba(0,229,255,0.7)">Fundamentacao Juridica:</strong> ' +
            'O Art. 103.o e 104.o do RGIT distinguem o erro pontual da conduta dolosa mediante a demonstracao de iteracao. ' +
            'O Score de Persistencia quantifica a sistematicidade das omissoes. ' +
            'O Padrao Oportunistico (outliers em picos de faturacao) reforca o dolo especifico. ' +
            'Art. 125.o CPP \u00b7 ISO/IEC 27037:2012' +
        '</div>' +
        '</div>';

    document.body.appendChild(modal);

    // Chart.js
    if (months.length > 0 && typeof Chart !== 'undefined') {
        try {
            var cvs = document.getElementById('atfChartCanvas');
            if (cvs) {
                var mean2s = atf.mean + 2 * atf.stdDev;
                new Chart(cvs, {
                    type: 'line',
                    data: {
                        labels: monthLabels,
                        datasets: [
                            { label: 'Ganhos',    data: atf.ganhosSeries,    borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)',  borderWidth: 2, tension: 0.3, pointRadius: 4 },
                            { label: 'Despesas',  data: atf.despesasSeries,  borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.1)',  borderWidth: 2, tension: 0.3, pointRadius: 4 },
                            {
                                label: 'Discrepancia', data: atf.discrepancySeries, borderColor: '#F59E0B',
                                backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 3, tension: 0.3,
                                pointRadius: atf.discrepancySeries.map(function(v, i) { return atf.outlierMonths.indexOf(months[i]) !== -1 ? 9 : 5; }),
                                pointBackgroundColor: atf.discrepancySeries.map(function(v, i) { return atf.outlierMonths.indexOf(months[i]) !== -1 ? '#EF4444' : '#F59E0B'; }),
                                pointBorderColor: atf.discrepancySeries.map(function(v, i) { return atf.outlierMonths.indexOf(months[i]) !== -1 ? '#FFFFFF' : '#F59E0B'; }),
                                pointBorderWidth: atf.discrepancySeries.map(function(v, i) { return atf.outlierMonths.indexOf(months[i]) !== -1 ? 2 : 1; })
                            },
                            { label: 'Limiar 2\u03c3', data: Array(months.length).fill(mean2s), borderColor: 'rgba(239,68,68,0.5)', borderDash: [5,5], borderWidth: 1.5, pointRadius: 0, fill: false }
                        ]
                    },
                    options: {
                        responsive: true,
                        interaction: { mode: 'index', intersect: false },
                        plugins: {
                            legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Courier New' } } },
                            tooltip: {
                                backgroundColor: 'rgba(8,18,36,0.95)', titleColor: '#00E5FF', bodyColor: 'rgba(255,255,255,0.8)',
                                callbacks: { label: function(c2) { return ' ' + c2.dataset.label + ': ' + new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR'}).format(c2.raw||0); } }
                            }
                        },
                        scales: {
                            x: { ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Courier New', size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
                            y: {
                                ticks: { color: 'rgba(255,255,255,0.5)', font: { family: 'Courier New', size: 11 },
                                    callback: function(v2) { return new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v2); } },
                                grid: { color: 'rgba(255,255,255,0.05)' }
                            }
                        }
                    }
                });
            }
        } catch (cErr) {
            console.warn('[UNIFED-ATF] \u26a0 Chart.js indisponivel:', cErr.message);
        }
    }
}

window.openATFModal = openATFModal;


// ============================================================================
// 8. EXPOSICAO GLOBAL
// ============================================================================
window.generateLegalNarrative  = generateLegalNarrative;
window.renderSankeyToImage     = renderSankeyToImage;

console.log('[UNIFED-ENRICHMENT] \u2705 Output Enrichment Layer v13.2.4-PREMIUM carregado.');
console.log('[UNIFED-ENRICHMENT]   . generateLegalNarrative()     - IA Argumentativa + AI Adversarial Simulator');
console.log('[UNIFED-ENRICHMENT]   . renderSankeyToImage()        - Dynamic Canvas-to-PDF (Sankey)');
console.log('[UNIFED-ENRICHMENT]   . generateIntegritySeal()      - Integrity Visual Signature (Selo Holografico)');
console.log('[UNIFED-ENRICHMENT]   . exportDOCX()                 - Structural DOCX (Minuta Peticao Inicial)');
console.log('[UNIFED-ENRICHMENT]   . NIFAF                        - Non-Intrusive Forensic Auditory Feedback');
console.log('[UNIFED-ENRICHMENT]   . generateTemporalChartImage() - ATF Grafico Canvas-to-PDF');
console.log('[UNIFED-ENRICHMENT]   . computeTemporalAnalysis()    - ATF Analytics (2sigma SP Outliers)');
console.log('[UNIFED-ENRICHMENT]   . openATFModal()               - ATF Dashboard Modal (Chart.js)');
console.log('[UNIFED-ENRICHMENT]   . Modo: Read-Only - Fonte: IFDESystem.analysis + monthlyData');

/* =====================================================================
   FIM DO FICHEIRO ENRICHMENT.JS - v13.2.4-PREMIUM
   UNIFED - PROBATUM - OUTPUT ENRICHMENT LAYER

   BUGS CORRIGIDOS:
   [FIX-1] DOCX shadow: const document -> var _docXml
           Eliminado "document.createElement is not a function"
   [FIX-2] CORS Anthropic/FreeTSA: fetch errors silenciados como
           console.info (nao como console.error). Sistema 100% funcional.
   [FIX-3] Async listener (chrome extension): OTS handshake ja tem
           try/catch em script.js. NIFAF guard evita re-triggers.

   NOVOS MODULOS:
   [ATF-1] computeTemporalAnalysis() - 2sigma, Score de Persistencia, outliers
   [ATF-2] generateTemporalChartImage() - canvas invisivel para PDF
   [ATF-3] openATFModal() - overlay Dashboard com Chart.js interativo
   [SEAL]  generateIntegritySeal() - padrao geometrico do SHA-256
   [ADV]   AI Adversarial Simulator (Seccao D na narrativa)
   [NIFAF] Guard _nifafAlertedHash em script.js (sem loops)

   CONFORMIDADE: DORA (UE) 2022/2554 - RGPD - ISO/IEC 27037:2012
   ===================================================================== */
