'use strict';

const fs = require('fs');
const path = require('path');
const { validationMarkdown } = require('./verifier');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatMoney(value, currency = 'CNY') {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency', currency, maximumFractionDigits: 0, notation: 'compact'
  }).format(value);
}

function gateLabel(gate) {
  return { decision_ready: '可用于决策', directional: '方向性证据', hypothesis: '假设待验证' }[gate] || gate;
}

function priorityLabel(priority) {
  return { high: '高', medium: '中', low: '低' }[priority] || priority;
}

function writeFile(outputDir, name, content) {
  fs.writeFileSync(path.join(outputDir, name), content, 'utf8');
}

function evidenceLedger(analysis) {
  const rows = analysis.sources.map(source =>
    `| ${source.id} | ${source.title} | ${source.type} | ${source.status} | ${source.asOf || '—'} | ${source.locator || source.url || '—'} | ${source.note || ''} |`
  ).join('\n');
  return `# 证据账本\n\n> 本案例为合成数据演示。来源标识用于展示证据治理流程，不代表真实外部报告。\n\n| ID | 来源 | 类型 | 状态 | 数据截至 | 定位 | 说明 |\n|---|---|---|---|---|---|---|\n${rows}\n\n## 证据使用规则\n\n- 结论必须引用来源 ID；无法解析的 ID 会使验证失败。\n- 两个来源只有在独立组不同、且质量达到门槛时，才构成决策级交叉验证。\n- 单来源或低质量来源不会被删除，但只能支持“方向性判断”或“待验证假设”。\n`;
}

function executiveSummary(analysis) {
  const base = analysis.market.scenarios.base;
  const top = analysis.opportunities[0];
  return `# 执行摘要\n\n## 决策问题\n\n${analysis.decision.question}\n\n**决策人：** ${analysis.decision.audience}  \n**决策期限：** ${analysis.decision.horizon}\n\n## 结论先行\n\n${analysis.executiveRecommendation}\n\n- 基准情景 TAM：**${formatMoney(base.tam, analysis.meta.currency)}**；SAM：**${formatMoney(base.sam, analysis.meta.currency)}**；SOM：**${formatMoney(base.som, analysis.meta.currency)}**。\n- 当前最高分机会：**${top?.title || '无'}**，最终评分 **${top?.score || 0}/10**，证据状态为 **${gateLabel(top?.evidence.gate)}**。\n- 机会得分受证据门控约束：即使商业吸引力很高，证据不足时也不能进入高优先级。\n\n## 建议\n\n${top?.nextAction || '补齐关键证据后再决定。'}\n\n## 关键边界\n\n${analysis.meta.scope}\n`;
}

function marketReport(analysis) {
  const rows = Object.entries(analysis.market.scenarios).map(([name, item]) =>
    `| ${{ low: '保守', base: '基准', high: '积极' }[name]} | ${formatMoney(item.tam, analysis.meta.currency)} | ${formatMoney(item.sam, analysis.meta.currency)} | ${formatMoney(item.som, analysis.meta.currency)} | ${formatMoney(item.forecastTam, analysis.meta.currency)} |`
  ).join('\n');
  return `# 市场规模与情景分析\n\n## 市场定义\n\n- **范围：** ${analysis.meta.scope}\n- **基准年：** ${analysis.market.baseYear}\n- **预测年：** ${analysis.market.forecastYear}\n- **年复合增长假设：** ${(analysis.market.cagr * 100).toFixed(1)}%\n- **方法：** ${analysis.market.method}\n\n| 情景 | TAM | SAM | SOM | 预测年 TAM |\n|---|---:|---:|---:|---:|\n${rows}\n\n## 计算链\n\n\`${analysis.market.formula}\`\n\n情景不是概率预测，而是用于观察关键假设变化对决策的影响。对外引用前，应以真实公开数据或获授权数据替换合成输入。\n`;
}

function competitorReport(analysis) {
  const rows = analysis.competitors.map(item =>
    `| ${item.name} | ${item.positioning} | ${item.overallScore} | ${item.innovation} | ${item.channelStrength} | ${gateLabel(item.evidence.gate)} |`
  ).join('\n');
  return `# 竞争格局\n\n| 玩家 | 定位 | 综合能力 | 创新 | 渠道 | 证据状态 |\n|---|---|---:|---:|---:|---|\n${rows}\n\n## 解读规则\n\n综合能力用于压缩呈现五个可比较维度，不代表企业价值或财务表现。主报告保留定位、优势和证据状态，避免把“分数高”误读为“应该模仿”。\n`;
}

function painPointReport(analysis) {
  const rows = analysis.painPoints.map(item =>
    `| ${item.theme} | ${item.segment} | ${item.severity}/5 | ${item.frequency}/5 | ${item.weightedScore}/10 | ${gateLabel(item.evidence.gate)} |`
  ).join('\n');
  return `# 用户痛点库\n\n| 痛点 | 细分人群 | 严重度 | 频率 | 加权得分 | 证据状态 |\n|---|---|---:|---:|---:|---|\n${rows}\n\n> 痛点排序由严重度（55%）与频率（45%）计算；它衡量问题强度，不等同于付费意愿。\n`;
}

function opportunityReport(analysis) {
  const cards = analysis.opportunities.map((item, index) => `## ${index + 1}. ${item.title}\n\n- **最终评分：** ${item.score}/10（原始商业评分 ${item.rawScore}/10）\n- **优先级：** ${priorityLabel(item.priority)}\n- **证据门控：** ${gateLabel(item.evidence.gate)}\n- **处理状态：** ${item.recommendationStatus === 'actionable' ? '可进入行动设计' : '先验证关键假设'}\n- **目标用户：** ${item.targetSegment}\n- **机会描述：** ${item.description}\n- **下一步：** ${item.nextAction}\n- **证据：** ${item.sourceIds.join(', ')}\n`).join('\n');
  return `# 机会优先级\n\n## 评分方法\n\n需求强度 30% + 竞争缺口 25% + 证据强度 20% + 可执行性 15% + 时间紧迫性 10%。\n\n证据门控上限：决策级证据 10 分、方向性证据 6.9 分、假设级证据 4.9 分。\n\n${cards}`;
}

function actionPlan(analysis) {
  const top = analysis.opportunities[0];
  return `# 90 天行动计划\n\n> 目标：用最低成本验证“${top?.title || '最高优先级机会'}”，而不是直接投入完整产品。\n\n| 阶段 | 时间 | 关键动作 | 通过标准 | 决策 |\n|---|---|---|---|---|\n| 证据补强 | 第 1–2 周 | 复核市场口径、完成 10–15 次目标用户访谈、校验竞品价格与渠道 | 两个独立高质量来源支持核心假设 | 继续 / 改写假设 |\n| 方案验证 | 第 3–6 周 | 制作低成本概念样品和落地页，测试价值主张与价格带 | 有效样本中达到预设兴趣和付费意向阈值 | 进入试点 / 停止 |\n| 小范围试点 | 第 7–10 周 | 在单一渠道、单一细分人群中运行 MVP | 获客、转化、毛利与交付指标满足底线 | 放大 / 优化 |\n| 复盘决策 | 第 11–12 周 | 更新证据账本、重跑评分、评审风险 | 关键来源可追溯，结论通过验证器 | 规模化 / 延后 / 终止 |\n\n## 北极星与护栏\n\n- **北极星：** 有效付费意向或真实试点转化，而不是页面访问量。\n- **护栏：** 不以单个平台热度替代市场需求；不把用户抱怨直接等同于购买意愿；不使用未授权数据对外发布。\n`;
}

function bars(items, valueKey, maxValue, labelKey = 'name') {
  return items.map(item => {
    const value = Number(item[valueKey]) || 0;
    const width = Math.max(2, Math.min(100, (value / maxValue) * 100));
    return `<div class="bar-row"><span>${escapeHtml(item[labelKey])}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><strong>${escapeHtml(value)}</strong></div>`;
  }).join('');
}

function htmlReport(analysis, validation) {
  const base = analysis.market.scenarios.base;
  const opportunityRows = analysis.opportunities.map(item => `<tr><td>${escapeHtml(item.title)}</td><td>${item.score}</td><td><span class="badge ${escapeHtml(item.evidence.gate)}">${escapeHtml(gateLabel(item.evidence.gate))}</span></td><td>${escapeHtml(item.recommendationStatus === 'actionable' ? '行动设计' : '先验证')}</td></tr>`).join('');
  const sourceRows = analysis.sources.map(source => `<tr><td>${escapeHtml(source.id)}</td><td>${escapeHtml(source.title)}</td><td>${escapeHtml(source.type)}</td><td>${escapeHtml(source.status)}</td></tr>`).join('');
  const findingCards = analysis.opportunities.slice(0, 3).map(item => `<article class="finding"><small>${escapeHtml(priorityLabel(item.priority))}优先级 · ${escapeHtml(gateLabel(item.evidence.gate))}</small><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.description)}</p><strong>${item.score}/10</strong></article>`).join('');
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(analysis.meta.title)} · 行业决策报告</title>
<style>
:root{--ink:#172033;--muted:#667085;--line:#e4e7ec;--paper:#fff;--wash:#f6f7fb;--blue:#3157c8;--gold:#b7791f;--olive:#667a32;--pink:#a33f6b}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--wash);color:var(--ink);font:15px/1.65 Inter,"Segoe UI","PingFang SC",sans-serif}.layout{display:grid;grid-template-columns:230px minmax(0,1fr);min-height:100vh}nav{position:sticky;top:0;height:100vh;background:#11182a;color:#d9e1f2;padding:32px 22px}nav h2{font-size:17px;color:#fff;margin:0 0 28px}nav a{display:block;color:#aebbd5;text-decoration:none;padding:9px 0}nav a:hover,nav a:focus{color:#fff}.main{width:100%;max-width:1440px;padding:48px clamp(24px,5vw,80px)}section{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:30px;margin:0 0 24px;box-shadow:0 10px 30px rgba(23,32,51,.04)}.hero{background:linear-gradient(135deg,#172033,#273e76);color:#fff;border:0}.eyebrow{letter-spacing:.14em;text-transform:uppercase;color:#aebff4;font-weight:700;font-size:12px}.hero h1{font-size:clamp(30px,5vw,58px);line-height:1.08;max-width:900px;margin:12px 0 18px}.hero p{max-width:820px;color:#d7dff3;font-size:18px}.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:32px}.kpi{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:18px}.kpi small{display:block;color:#c4cdec}.kpi strong{display:block;font-size:25px;margin-top:4px}.section-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:22px}.section-head h2{margin:0;font-size:26px}.section-head p{margin:0;color:var(--muted)}.findings{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.finding{border:1px solid var(--line);border-radius:14px;padding:20px}.finding small{color:var(--blue);font-weight:700}.finding h3{margin:8px 0}.finding p{color:var(--muted)}.finding strong{font-size:22px}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:26px}.bar-row{display:grid;grid-template-columns:120px 1fr 38px;gap:12px;align-items:center;margin:13px 0}.bar-track{height:12px;background:#edf0f6;border-radius:999px;overflow:hidden}.bar-fill{height:100%;background:var(--blue);border-radius:999px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:12px;border-bottom:1px solid var(--line)}th{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em}.table-wrap{overflow:auto}.badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:12px;font-weight:700}.decision_ready{background:#e8efe1;color:#536728}.directional{background:#fff3db;color:#865d13}.hypothesis{background:#f9e8ef;color:#863255}.callout{border-left:4px solid var(--blue);background:#f3f6ff;padding:18px 20px;border-radius:0 12px 12px 0}.method{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;background:#f8f9fc;padding:14px;border-radius:10px}.footer{color:var(--muted);font-size:13px}@media(max-width:900px){.layout{display:block}nav{position:relative;height:auto}nav a{display:inline-block;margin-right:16px}.main{padding:20px}.kpis,.findings,.two-col{grid-template-columns:1fr 1fr}}@media(max-width:580px){.kpis,.findings,.two-col{grid-template-columns:1fr}.hero h1{font-size:34px}.bar-row{grid-template-columns:100px 1fr 32px}}@media print{body{background:#fff}.layout{display:block}nav{display:none}.main{max-width:none;padding:0}section{box-shadow:none;break-inside:avoid;border-radius:0}.hero{color:#111;background:#fff;border:1px solid #ddd}.hero p,.eyebrow{color:#555}}
</style></head><body><div class="layout"><nav><h2>INDUSTRY INTELLIGENCE</h2><a href="#summary">执行摘要</a><a href="#market">市场规模</a><a href="#competition">竞争格局</a><a href="#opportunity">机会排序</a><a href="#evidence">证据账本</a><a href="#method">方法与边界</a></nav><main class="main">
<section class="hero" id="summary"><div class="eyebrow">SYNTHETIC OPEN DEMO · ${escapeHtml(analysis.meta.asOf)}</div><h1>${escapeHtml(analysis.meta.title)}</h1><p>${escapeHtml(analysis.decision.question)}</p><div class="kpis"><div class="kpi"><small>基准 TAM</small><strong>${escapeHtml(formatMoney(base.tam, analysis.meta.currency))}</strong></div><div class="kpi"><small>基准 SAM</small><strong>${escapeHtml(formatMoney(base.sam, analysis.meta.currency))}</strong></div><div class="kpi"><small>竞品样本</small><strong>${analysis.competitors.length}</strong></div><div class="kpi"><small>可行动机会</small><strong>${analysis.opportunities.filter(item=>item.recommendationStatus==='actionable').length}</strong></div></div></section>
<section><div class="section-head"><div><h2>结论先行</h2><p>商业吸引力与证据强度同时决定优先级</p></div></div><div class="callout"><strong>${escapeHtml(analysis.executiveRecommendation)}</strong></div><div class="findings" style="margin-top:20px">${findingCards}</div></section>
<section id="market"><div class="section-head"><div><h2>市场规模</h2><p>三情景底层测算；金额单位 ${escapeHtml(analysis.meta.currency)}</p></div></div><div class="two-col"><div>${bars(Object.entries(analysis.market.scenarios).map(([name,item])=>({name:{low:'保守',base:'基准',high:'积极'}[name],tam:Math.round(item.tam/1000000)})),'tam',Math.max(...Object.values(analysis.market.scenarios).map(x=>x.tam))/1000000)}</div><div><p class="method">${escapeHtml(analysis.market.formula)}</p><p>预测期 CAGR 假设 ${(analysis.market.cagr*100).toFixed(1)}%。情景用于敏感性判断，不代表概率预测。</p></div></div></section>
<section id="competition"><div class="section-head"><div><h2>竞争格局</h2><p>五维综合能力，不替代财务或估值判断</p></div></div><div class="two-col"><div>${bars(analysis.competitors,'overallScore',10)}</div><div>${bars(analysis.competitors,'innovation',10)}</div></div></section>
<section id="opportunity"><div class="section-head"><div><h2>机会优先级</h2><p>证据不足会自动封顶，避免 AI 把假设包装成结论</p></div></div><div class="table-wrap"><table><thead><tr><th>机会</th><th>评分</th><th>证据</th><th>下一阶段</th></tr></thead><tbody>${opportunityRows}</tbody></table></div></section>
<section id="evidence"><div class="section-head"><div><h2>证据账本</h2><p>${validation.checks.verifiedSourceCount}/${validation.checks.sourceCount} 个来源已验证或经人工复核</p></div></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>来源</th><th>类型</th><th>状态</th></tr></thead><tbody>${sourceRows}</tbody></table></div></section>
<section id="method"><div class="section-head"><div><h2>方法与边界</h2><p>可复现、可质疑、可更新</p></div></div><div class="two-col"><div><h3>决策边界</h3><p>${escapeHtml(analysis.meta.scope)}</p><h3>质量状态</h3><p>${escapeHtml(validation.status)}</p></div><div><h3>证据门控</h3><p>至少两个独立且质量达标的来源，结论才可进入“可用于决策”。单一来源保留为方向性证据；未验证来源只能形成假设。</p></div></div></section>
<p class="footer">Generated by Industry Intelligence Analyzer v2.0 · Synthetic data only · ${escapeHtml(analysis.generatedAt)}</p></main></div></body></html>`;
}

function generateReports(analysis, validation, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });
  const files = {
    '00_EXECUTIVE_SUMMARY.md': executiveSummary(analysis),
    '01_MARKET_SIZING.md': marketReport(analysis),
    '02_COMPETITIVE_LANDSCAPE.md': competitorReport(analysis),
    '03_CUSTOMER_PAIN_POINTS.md': painPointReport(analysis),
    '04_OPPORTUNITY_PRIORITIZATION.md': opportunityReport(analysis),
    '05_90_DAY_PLAN.md': actionPlan(analysis),
    '98_VALIDATION_REPORT.md': validationMarkdown(validation),
    '99_EVIDENCE_LEDGER.md': evidenceLedger(analysis),
    'report.html': htmlReport(analysis, validation),
    'analysis.json': `${JSON.stringify(analysis, null, 2)}\n`
  };
  for (const [name, content] of Object.entries(files)) writeFile(outputDir, name, content);
  return Object.keys(files);
}

module.exports = { generateReports, htmlReport, escapeHtml, formatMoney };
