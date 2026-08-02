/**
 * HackCheck - 阶段2: 技术选型
 */

// ============================================
// 阶段2: 技术选型
// ============================================
function initTechModule() {
  const container = $('#techCategories');
  container.innerHTML = TECH_DATA.categories.map(cat => {
    const chips = cat.technologies.map(tech => {
      const sel = AppState.tech.selected.includes(tech.name) ? 'selected' : '';
      return `<div class="tech-chip ${sel}" data-tech="${tech.name}"><span>${tech.name}</span><span class="tech-chip-complexity">C${tech.complexity}</span></div>`;
    }).join('');
    return `<div class="tech-category"><div class="tech-category-header"><span class="tech-category-icon">${cat.icon}</span><span class="tech-category-name">${cat.name}</span></div><div class="tech-options">${chips}</div></div>`;
  }).join('');

  // 渲染预设方案选择器
  renderPresetPlans();

  $$('.tech-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const name = chip.dataset.tech;
      const idx = AppState.tech.selected.indexOf(name);
      if (idx > -1) { AppState.tech.selected.splice(idx, 1); chip.classList.remove('selected'); }
      else { AppState.tech.selected.push(name); chip.classList.add('selected'); }
      // 手动选择后取消方案高亮
      AppState.tech.activePlan = null;
      $$('.plan-card').forEach(c => c.classList.remove('active'));
      evaluateTechStack();
      saveState();
    });
  });

  // 团队约束进入 AI prompt，改动后旧建议过期（staleTechAdvice 只标记，不清空已有内容）
  $('#hackathonDuration').addEventListener('change', e => { AppState.tech.duration = parseInt(e.target.value); evaluateTechStack(); markTechAdviceStale(); saveState(); });
  $('#teamSize').addEventListener('change', e => { AppState.tech.teamSize = parseInt(e.target.value); evaluateTechStack(); markTechAdviceStale(); saveState(); });
  $('#teamExperience').addEventListener('change', e => { AppState.tech.experience = parseInt(e.target.value); evaluateTechStack(); markTechAdviceStale(); saveState(); });

  $('#hackathonDuration').value = AppState.tech.duration;
  $('#teamSize').value = AppState.tech.teamSize;
  $('#teamExperience').value = AppState.tech.experience;

  // AI 选型顾问：展示阶段1交接的选题结论，并恢复已生成的建议
  $('#techAiBtn')?.addEventListener('click', runTechAdvise);
  renderTechAiContext();
  if (AppState.tech.aiAdvice) {
    try { renderTechAdvice(AppState.tech.aiAdvice); }
    catch (e) { console.warn('恢复AI选型建议失败:', e.message); }
  }

  if (AppState.tech.selected.length > 0) {
    // 恢复方案高亮
    if (AppState.tech.activePlan) {
      const card = document.querySelector(`.plan-card[data-plan="${AppState.tech.activePlan}"]`);
      if (card) card.classList.add('active');
    }
    evaluateTechStack();
  }
}

function renderPresetPlans() {
  const container = $('#presetPlans');
  if (!container) return;

  container.innerHTML = TECH_DATA.presetPlans.map(plan => `
    <div class="plan-card ${AppState.tech.activePlan === plan.id ? 'active' : ''}" data-plan="${plan.id}">
      <div class="plan-header">
        <span class="plan-icon">${plan.icon}</span>
        <div>
          <div class="plan-name">${plan.name}</div>
          <div class="plan-cost">${plan.costLabel}</div>
        </div>
      </div>
      <p class="plan-desc">${plan.desc}</p>
      <div class="plan-bestfor">📌 ${plan.bestFor}</div>
    </div>
  `).join('');

  $$('.plan-card').forEach(card => {
    card.addEventListener('click', () => {
      const planId = card.dataset.plan;
      const plan = TECH_DATA.presetPlans.find(p => p.id === planId);
      if (!plan) return;

      // 应用方案
      AppState.tech.selected = [...plan.techs];
      AppState.tech.activePlan = planId;

      // 更新chip选中状态
      $$('.tech-chip').forEach(chip => {
        chip.classList.toggle('selected', plan.techs.includes(chip.dataset.tech));
      });

      // 高亮当前方案
      $$('.plan-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      evaluateTechStack();
      saveState();
      showToast(`已应用「${plan.name}」，共 ${plan.techs.length} 项技术`, 'success');
    });
  });
}

function evaluateTechStack() {
  const selected = AppState.tech.selected;
  if (selected.length === 0) {
    $('#techResults').style.display = 'none';
    $('#divisionSection').style.display = 'none';
    $('#timelineSection').style.display = 'none';
    $('#navScoreTech').textContent = '--';
    return;
  }

  $('#techResults').style.display = 'block';
  $('#divisionSection').style.display = 'block';
  $('#timelineSection').style.display = 'block';

  const selectedTechs = [];
  TECH_DATA.categories.forEach(cat => {
    cat.technologies.forEach(t => { if (selected.includes(t.name)) selectedTechs.push({ ...t, category: cat.name }); });
  });

  const totalComplexity = selectedTechs.reduce((s, t) => s + t.complexity, 0);
  const avgComplexity = totalComplexity / selectedTechs.length;
  const avgFit = selectedTechs.reduce((s, t) => s + t.hackathonFit, 0) / selectedTechs.length;
  const totalSetup = selectedTechs.reduce((s, t) => s + t.timeToSetup, 0);

  const duration = AppState.tech.duration;
  const experience = AppState.tech.experience;
  const teamSize = AppState.tech.teamSize;

  const expFactor = experience === 1 ? 1.5 : experience === 2 ? 1.0 : 0.7;
  const teamFactor = teamSize === 1 ? 1.3 : teamSize <= 3 ? 1.0 : 0.85;
  const adjustedComplexity = totalComplexity * expFactor * teamFactor;
  const timeRec = TECH_DATA.timeRecommendations[duration] || TECH_DATA.timeRecommendations[48];
  const isFeasible = adjustedComplexity <= timeRec.maxComplexity;

  // 复杂度
  const cLevel = avgComplexity <= 2 ? 'low' : avgComplexity <= 3 ? 'medium' : 'high';
  const cText = avgComplexity <= 2 ? '低' : avgComplexity <= 3 ? '中' : '高';
  $('#complexityResult').innerHTML = `
    <div class="result-score ${cLevel}">${cText}</div>
    <div class="result-bar"><div class="result-bar-fill ${cLevel}" style="width:${(avgComplexity/5)*100}%"></div></div>
    <p class="result-meta">总复杂度: ${totalComplexity} | 平均: ${avgComplexity.toFixed(1)}/5</p>
    <p class="result-meta">配置时间: ~${totalSetup}h</p>
  `;

  // 时间可行性
  const feasibilityScore = clamp(Math.round((timeRec.maxComplexity / adjustedComplexity) * 100), 0, 100);
  const fLevel = feasibilityScore >= 70 ? 'low' : feasibilityScore >= 40 ? 'medium' : 'high';
  const fText = feasibilityScore >= 70 ? '可行' : feasibilityScore >= 40 ? '有风险' : '不可行';
  $('#timeResult').innerHTML = `
    <div class="result-score ${fLevel}">${fText}</div>
    <div class="result-bar"><div class="result-bar-fill ${fLevel}" style="width:${feasibilityScore}%"></div></div>
    <p class="result-meta">调整后复杂度: ${Math.round(adjustedComplexity)}/${timeRec.maxComplexity}</p>
    <p class="result-meta">${timeRec.recommendation}</p>
  `;

  // 适配度
  const fitLevel = avgFit >= 4 ? 'low' : avgFit >= 3 ? 'medium' : 'high';
  const fitText = avgFit >= 4 ? '极佳' : avgFit >= 3 ? '一般' : '不佳';
  $('#fitResult').innerHTML = `
    <div class="result-score ${fitLevel}">${fitText}</div>
    <div class="result-bar"><div class="result-bar-fill ${fitLevel}" style="width:${(avgFit/5)*100}%"></div></div>
    <p class="result-meta">平均适配: ${avgFit.toFixed(1)}/5</p>
    <p class="result-meta">${selectedTechs.length} 项技术已选</p>
  `;

  // 风险报告
  const risks = [];
  TECH_DATA.riskRules.forEach(rule => {
    const triggered = rule.triggers.some(t => selected.includes(t));
    if (triggered) risks.push(rule);
  });
  if (risks.length > 0) {
    $('#riskReport').style.display = 'block';
    $('#riskList').innerHTML = risks.map(r => `
      <div class="risk-item ${r.severity}">
        <span class="risk-icon">${r.severity === 'high' ? '🔴' : '🟡'}</span>
        <div class="risk-content"><strong>${r.title}</strong><p>${r.description}</p><div class="risk-suggestions">${r.suggestions.map(s => `<span class="risk-suggestion">→ ${s}</span>`).join('')}</div></div>
      </div>
    `).join('');
  } else {
    $('#riskReport').style.display = 'none';
  }

  // 推荐
  let recHTML = '<div class="tech-rec-card"><h4>📋 技术选型建议</h4><ul>';
  if (isFeasible) {
    recHTML += `<li>✅ 当前技术栈在 ${duration} 小时内<strong>可行</strong>，复杂度在可控范围内</li>`;
  } else {
    recHTML += `<li>⚠️ 当前技术栈复杂度偏高，建议<strong>精简技术选型</strong>或增加人手</li>`;
  }
  if (avgFit >= 4) recHTML += '<li>🎯 所选技术<strong>黑客松适配度高</strong>，能快速搭建</li>';
  if (totalSetup > 8) recHTML += `<li>⏱️ 配置时间预计 ${totalSetup} 小时，建议<strong>提前搭建环境</strong></li>`;
  recHTML += '</ul></div>';
  $('#techRecommendation').innerHTML = recHTML;

  // 成本分析
  renderCostAnalysis(selected);

  // 分工推荐
  renderTaskDivision();
  renderTimeline();

  // 更新分数
  const techScore = clamp(Math.round((feasibilityScore + avgFit * 20) / 2), 0, 100);
  AppState.tech.score = techScore;
  $('#techScore').textContent = techScore;
  $('#navScoreTech').textContent = techScore;
  updateOverallScore();
}

function renderCostAnalysis(selectedTechs) {
  const costContainer = $('#costAnalysis');
  if (!costContainer) return;

  // 查找匹配的预设方案
  const matchedPlan = TECH_DATA.presetPlans.find(plan =>
    plan.techs.every(t => selectedTechs.includes(t)) && selectedTechs.length === plan.techs.length
  );

  let html = '<div class="cost-card"><h4>💰 成本分析</h4>';

  if (matchedPlan) {
    // 完全匹配某个预设方案
    html += `<div class="cost-plan-match">当前选型完全匹配「${matchedPlan.icon} ${matchedPlan.name}」</div>`;
    html += '<div class="cost-breakdown">';
    matchedPlan.costBreakdown.forEach(item => {
      html += `<div class="cost-item"><span class="cost-item-label">${item.item}</span><span class="cost-item-tool">${item.tool}</span><span class="cost-item-price">${item.cost}</span></div>`;
    });
    html += '</div>';
    html += `<div class="cost-total">预估总成本: <strong>${matchedPlan.costLabel}</strong></div>`;
    html += '<div class="cost-pros-cons">';
    html += `<div class="cost-pros"><strong>✅ 优势</strong><ul>${matchedPlan.pros.map(p => `<li>${p}</li>`).join('')}</ul></div>`;
    html += `<div class="cost-cons"><strong>⚠️ 注意</strong><ul>${matchedPlan.cons.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
    html += '</div>';
  } else {
    // 自定义选型 - 分析各项成本
    const costItems = [];
    let hasPaidAPI = false;

    selectedTechs.forEach(name => {
      if (['OpenAI API', 'Claude API', 'Together AI'].includes(name)) {
        hasPaidAPI = true;
        if (name === 'Together AI') costItems.push({ item: 'AI能力', tool: name, cost: '免费$5额度' });
        else if (name === 'OpenAI API') costItems.push({ item: 'AI能力', tool: name, cost: '约$5-50（按量计费）' });
        else costItems.push({ item: 'AI能力', tool: name, cost: '约$5-50（按量计费）' });
      }
      if (['Vercel', 'Netlify', 'Render'].includes(name)) costItems.push({ item: '前端部署', tool: name, cost: '免费额度可用' });
      if (['Railway'].includes(name)) costItems.push({ item: '后端部署', tool: name, cost: '$5/月' });
      if (['Supabase', 'Firebase'].includes(name)) costItems.push({ item: 'BaaS', tool: name, cost: '免费额度可用' });
      if (['Stripe'].includes(name)) costItems.push({ item: '支付', tool: name, cost: '免费（测试模式）' });
      if (['Twilio'].includes(name)) costItems.push({ item: '短信/通话', tool: name, cost: '有免费试用额度' });
    });

    if (costItems.length === 0) {
      html += '<div class="cost-free-all">🎉 当前选型完全免费！所有技术都有免费额度可用。</div>';
    } else {
      html += '<div class="cost-breakdown">';
      costItems.forEach(item => {
        html += `<div class="cost-item"><span class="cost-item-label">${item.item}</span><span class="cost-item-tool">${item.tool}</span><span class="cost-item-price">${item.cost}</span></div>`;
      });
      html += '</div>';
      if (hasPaidAPI) {
        html += '<div class="cost-tip">💡 AI API费用提示：使用GPT-4o-mini等经济模型，设置用量上限，黑客松期间费用通常在$5-20以内</div>';
      }
    }
    html += `<div class="cost-compare">💡 想看看预设方案？点击上方方案卡片可以一键切换到推荐选型</div>`;
  }

  html += '</div>';
  costContainer.innerHTML = html;
  costContainer.style.display = 'block';
}

function renderTaskDivision() {
  const teamSize = AppState.tech.teamSize;
  const template = TECH_DATA.taskDivisionTemplates[teamSize] || TECH_DATA.taskDivisionTemplates[3];

  $('#divisionStrategy').innerHTML = `<div class="division-strategy-card"><strong>${template.title}</strong><p>${template.strategy}</p></div>`;

  $('#divisionRoles').innerHTML = template.roles.map(r => `
    <div class="division-role-card">
      <div class="role-header"><span class="role-icon">${r.icon}</span><span class="role-name">${r.role}</span></div>
      <ul class="role-tasks">${r.tasks.map(t => `<li>${t}</li>`).join('')}</ul>
      <div class="role-time">⏱️ ${r.timeAllocation}</div>
    </div>
  `).join('');

  $('#divisionTips').innerHTML = `<div class="division-tips-card"><strong>💡 分工建议</strong><ul>${template.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>`;
}

// ============================================
// AI 选型顾问：承接阶段1（选题）的语义结论
// 输入 = 选题摘要/目标用户/核心功能/差异点/成熟实现 + 团队约束
// 输出 = 推荐方案 + 逐项技术理由 + 避免项 + 该复用的能力 + 风险 + MVP 顺序
// AI 不可用时整块降级为提示文案，不影响本地评估逻辑。
// ============================================

const EXP_LABELS = { 1: '0基础/初学者', 2: '有一定开发经验', 3: '经验丰富' };

// 候选技术清单（含复杂度与适配度），供 prompt 约束模型只能从中选
function techOptionLines() {
  const lines = [];
  TECH_DATA.categories.forEach(cat => {
    cat.technologies.forEach(t => {
      lines.push(t.name + '（' + cat.name + '，复杂度C' + t.complexity
        + '，黑客松适配' + t.hackathonFit + '/5，配置' + t.timeToSetup + 'h）');
    });
  });
  return lines;
}

function renderTechAiContext() {
  const box = $('#techAiContext');
  if (!box) return;
  const ctx = AppState.topic.aiContext;
  const btn = $('#techAiBtn');
  if (!ctx) {
    box.innerHTML = '<div class="tech-ai-empty">' + escapeHtml(t('tech.ai.noContext')) + '</div>';
    if (btn) btn.disabled = true;
    return;
  }
  if (btn) btn.disabled = false;
  let html = '<div class="tech-ai-ctx-card"><div class="tech-ai-ctx-title">'
    + escapeHtml(t('tech.ai.ctxTitle')) + '</div><ul>';
  html += '<li><strong>' + escapeHtml(t('tech.ai.ctxSummary')) + '</strong>' + escapeHtml(ctx.summary) + '</li>';
  if (ctx.targetUser) {
    html += '<li><strong>' + escapeHtml(t('tech.ai.ctxUser')) + '</strong>' + escapeHtml(ctx.targetUser) + '</li>';
  }
  if (ctx.features && ctx.features.length) {
    html += '<li><strong>' + escapeHtml(t('tech.ai.ctxFeatures')) + '</strong>'
      + ctx.features.map(escapeHtml).join('、') + '</li>';
  }
  if (ctx.gaps && ctx.gaps.length) {
    html += '<li><strong>' + escapeHtml(t('tech.ai.ctxGaps')) + '</strong>'
      + ctx.gaps.map(escapeHtml).join('；') + '</li>';
  }
  html += '</ul></div>';
  box.innerHTML = html;
}

// 团队约束改动：建议仍显示，但加一条「已过期，可重新生成」提示
function markTechAdviceStale() {
  if (!AppState.tech.aiAdvice) return;
  const box = $('#techAiResult');
  if (!box || box.style.display === 'none') return;
  if (box.querySelector('.tech-ai-stale')) return;
  const tip = document.createElement('div');
  tip.className = 'tech-ai-stale';
  tip.textContent = t('tech.ai.stale');
  box.insertBefore(tip, box.firstChild);
}

// 选题结论变化时调用：旧建议已过期
function invalidateTechAdvice() {
  AppState.tech.aiAdvice = null;
  const r = $('#techAiResult');
  if (r) { r.style.display = 'none'; r.innerHTML = ''; }
  renderTechAiContext();
}

async function runTechAdvise() {
  const ctx = AppState.topic.aiContext;
  if (!ctx) { showToast(t('tech.ai.noContext'), 'warning'); return; }

  const btn = $('#techAiBtn');
  const status = $('#techAiStatus');
  const result = $('#techAiResult');
  if (btn) btn.disabled = true;
  if (result) result.style.display = 'none';
  if (status) {
    status.style.display = 'block';
    status.innerHTML = '<div class="search-loading"><div class="loading-spinner"></div><span>'
      + escapeHtml(t('tech.ai.loading')) + '</span></div>';
  }

  const res = await HackAI.aiTask('techadvise', {
    summary: ctx.summary,
    targetUser: ctx.targetUser,
    features: ctx.features,
    gaps: ctx.gaps,
    mature: ctx.mature,
    duration: AppState.tech.duration,
    teamSize: AppState.tech.teamSize,
    experienceLabel: EXP_LABELS[AppState.tech.experience] || EXP_LABELS[1],
    techOptions: techOptionLines(),
    planOptions: TECH_DATA.presetPlans.map(p => ({
      id: p.id, name: p.name, cost: p.costLabel, techs: p.techs.join('/'),
    })),
  });

  if (status) status.style.display = 'none';
  if (btn) btn.disabled = false;

  if (!res.ok) {
    if (status) {
      status.style.display = 'block';
      status.innerHTML = '<div class="tech-ai-error">' + escapeHtml(t('tech.ai.failed'))
        + ' (' + escapeHtml(res.error) + ')</div>';
    }
    return;
  }

  AppState.tech.aiAdvice = res.data;
  renderTechAdvice(res.data);
  saveState();
  showToast(t('tech.ai.done'), 'success');
}

function renderTechAdvice(d) {
  const box = $('#techAiResult');
  if (!box) return;

  const plan = TECH_DATA.presetPlans.find(p => p.id === d.plan);
  const planLabel = plan ? (plan.icon + ' ' + plan.name + '（' + plan.costLabel + '）') : d.plan;

  let html = '<div class="tech-ai-plan"><div class="tech-ai-plan-head"><span class="tech-ai-plan-label">'
    + escapeHtml(t('tech.ai.planPick')) + '</span><span class="tech-ai-plan-name">'
    + escapeHtml(planLabel) + '</span></div><p>' + escapeHtml(d.plan_reason) + '</p>';
  if (plan) {
    html += '<button class="btn btn-secondary btn-sm" id="techAiApplyPlan" data-plan="' + escapeHtml(plan.id) + '">'
      + escapeHtml(t('tech.ai.applyPlan')) + '</button>';
  }
  html += '</div>';

  // 推荐技术表：技术 / 承担角色 / 为什么（结合本项目）
  html += '<div class="tech-ai-block"><h5>' + escapeHtml(t('tech.ai.recTitle')) + '</h5>';
  html += '<div class="tech-ai-table-wrap"><table class="tech-ai-table"><thead><tr><th>'
    + escapeHtml(t('tech.ai.colTech')) + '</th><th>' + escapeHtml(t('tech.ai.colRole'))
    + '</th><th>' + escapeHtml(t('tech.ai.colWhy')) + '</th></tr></thead><tbody>';
  d.recommended.forEach(r => {
    html += '<tr><td class="tech-ai-tech">' + escapeHtml(r.tech) + '</td><td>'
      + escapeHtml(r.role) + '</td><td>' + escapeHtml(r.why) + '</td></tr>';
  });
  html += '</tbody></table></div>';
  html += '<button class="btn btn-primary btn-sm" id="techAiApplyStack">'
    + escapeHtml(t('tech.ai.applyStack')) + '</button></div>';

  const listBlock = (key, items, cls, fmt) => {
    if (!items || items.length === 0) return '';
    return '<div class="tech-ai-block ' + cls + '"><h5>' + escapeHtml(t(key))
      + '</h5><ul>' + items.map(fmt).join('') + '</ul></div>';
  };

  html += listBlock('tech.ai.reuseTitle', d.reuse, 'tech-ai-reuse',
    r => '<li><strong>' + escapeHtml(r.capability) + '</strong>：' + escapeHtml(r.suggestion) + '</li>');
  html += listBlock('tech.ai.avoidTitle', d.avoid, 'tech-ai-avoid',
    a => '<li><strong>' + escapeHtml(a.tech) + '</strong>：' + escapeHtml(a.why) + '</li>');
  // MVP 是有序步骤，用 ol 保留优先级语义
  if (d.mvp && d.mvp.length) {
    html += '<div class="tech-ai-block tech-ai-mvp"><h5>' + escapeHtml(t('tech.ai.mvpTitle'))
      + '</h5><ol>' + d.mvp.map(s => '<li>' + escapeHtml(s) + '</li>').join('') + '</ol></div>';
  }
  html += listBlock('tech.ai.risksTitle', d.risks, 'tech-ai-risks',
    s => '<li>' + escapeHtml(s) + '</li>');

  box.innerHTML = html;
  box.style.display = 'block';

  $('#techAiApplyStack')?.addEventListener('click', applyAiTechStack);
  $('#techAiApplyPlan')?.addEventListener('click', e => {
    const card = document.querySelector('.plan-card[data-plan="' + e.currentTarget.dataset.plan + '"]');
    if (card) { switchSubmodule('tech', 'presets'); card.click(); }
  });
}

// 一键应用：把 AI 推荐的技术写入选型（只接受候选清单里存在的名称）
function applyAiTechStack() {
  const advice = AppState.tech.aiAdvice;
  if (!advice) return;
  const known = new Set();
  TECH_DATA.categories.forEach(c => c.technologies.forEach(x => known.add(x.name)));
  const picked = advice.recommended.map(r => r.tech).filter(n => known.has(n));
  if (picked.length === 0) { showToast(t('tech.ai.applyEmpty'), 'warning'); return; }

  AppState.tech.selected = [...new Set(picked)];
  AppState.tech.activePlan = null;
  $$('.tech-chip').forEach(chip => {
    chip.classList.toggle('selected', AppState.tech.selected.includes(chip.dataset.tech));
  });
  $$('.plan-card').forEach(c => c.classList.remove('active'));
  evaluateTechStack();
  saveState();
  showToast(tf('tech.ai.applied', { n: AppState.tech.selected.length }), 'success');
}

function renderTimeline() {
  const duration = AppState.tech.duration;
  const timeline = TECH_DATA.timelineTemplates[duration] || TECH_DATA.timelineTemplates[48];

  $('#timelineTrack').innerHTML = timeline.map((phase, i) => `
    <div class="timeline-phase ${i === 0 ? 'first' : ''} ${i === timeline.length - 1 ? 'last' : ''}">
      <div class="timeline-marker">${i + 1}</div>
      <div class="timeline-content">
        <div class="timeline-time">${phase.time}</div>
        <div class="timeline-name">${phase.phase}</div>
        <ul class="timeline-tasks">${phase.tasks.map(t => `<li>${t}</li>`).join('')}</ul>
      </div>
    </div>
  `).join('');
}
