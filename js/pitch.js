/**
 * HackCheck - 阶段5: Pitch生成与AI评审
 */

// ============================================
// 阶段5: Pitch & 评审
// ============================================
function initPitchModule() {
  $('#generatePitchBtn').addEventListener('click', generatePitch);
  $('#exportPitchBtn').addEventListener('click', exportPitch);
  $('#autoReviewBtn').addEventListener('click', autoReview);

  // 恢复已有评审状态
  if (AppState.pitch.review.autoReviewed && AppState.pitch.review.feedbacks) {
    renderReviewAgentsWithFeedback(AppState.pitch.review.feedbacks);
    if (AppState.pitch.review.score) {
      $('#reviewResults').style.display = 'block';
    }
  } else if (AppState.pitch.review.ratings && Object.keys(AppState.pitch.review.ratings).length > 0) {
    renderReviewAgents();
  } else {
    renderReviewAgents();
  }
}

function generatePitch() {
  const name = $('#pitchProjectName').value.trim();
  const oneLiner = $('#pitchOneLiner').value.trim();
  const desc = $('#pitchDescription').value.trim();

  if (!name || !oneLiner) {
    showToast(t('pitch.warn.empty'), 'warning');
    return;
  }

  // 收集所有可用信息
  const context = {
    name,
    oneLiner,
    desc,
    topicDesc: AppState.topic.description || '',
    techStack: AppState.tech.selected || [],
    teamSize: AppState.tech.teamSize || 3,
    duration: AppState.tech.duration || 48,
    topicScore: AppState.topic.score || 0,
    devScore: AppState.dev.score || 0,
  };

  // 从描述中提取关键信息
  const parsedInfo = parseProjectInfo(desc + ' ' + context.topicDesc);

  // 生成个性化的 pitch 内容
  const sections = generatePitchSections(context, parsedInfo);

  let pitchHTML = '';
  let pitchText = `# ${name} - Pitch 演讲稿\n\n`;

  sections.forEach((section, i) => {
    pitchHTML += `
      <div class="pitch-section-card">
        <div class="pitch-section-header">
          <span class="pitch-section-num">${i + 1}</span>
          <span class="pitch-section-icon">${section.icon}</span>
          <div><div class="pitch-section-title">${section.title}</div><div class="pitch-section-time">⏱️ ${section.duration}</div></div>
        </div>
        <div class="pitch-section-content">${section.content}</div>
        ${section.tips ? `<div class="pitch-section-tips"><strong>💡 演讲提示：</strong><ul>${section.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      </div>
    `;

    pitchText += `## ${i + 1}. ${section.title} (${section.duration})\n${section.plainText}\n\n`;
  });

  $('#pitchResult').style.display = 'block';
  $('#pitchStructure').innerHTML = pitchHTML;
  AppState.pitch.generated = true;
  AppState.pitch.pitchContent = pitchText;
  saveState();

  showToast(t('pitch.success.generated'), 'success');
}

// P1优化：从用户描述中解析项目信息（接入 conceptMap + longestMatchConcepts）
function parseProjectInfo(text) {
  const info = {
    targetUsers: '',
    problem: '',
    solution: '',
    tech: [],
    features: [],
    impact: '',
    // P1新增：概念分类
    techConcepts: [],   // 技术概念（如 语音识别、区块链、机器学习）
    domainConcepts: [], // 领域概念（如 老年人、医疗、教育）
    featureConcepts: [], // 功能概念（如 提醒、推荐、搜索）
    allConcepts: [],    // 所有匹配的概念 {cn, en, type}
  };

  const conceptMap = TOPIC_DATA.conceptMap || {};

  // --- P1: 用 longestMatchConcepts 替代正则，从中文描述提取概念 ---
  const matched = longestMatchConcepts(text, conceptMap);
  info.allConcepts = matched;
  matched.forEach(m => {
    if (m.type === 'tech') {
      if (!info.techConcepts.includes(m.cn)) info.techConcepts.push(m.cn);
      m.en.forEach(en => { if (!info.tech.includes(en)) info.tech.push(en); });
    } else if (m.type === 'domain') {
      if (!info.domainConcepts.includes(m.cn)) info.domainConcepts.push(m.cn);
      // 领域概念中的人群词作为目标用户
      const peopleWords = ['老年人','老人','儿童','学生','乡村','盲人','聋','残障','孕妇','婴儿','母婴','青少年','大学生','教师','医生','护士','农民','司机','外卖','快递','留学生','创业者'];
      if (peopleWords.includes(m.cn) && !info.targetUsers) {
        info.targetUsers = m.cn;
      }
    } else {
      if (!info.featureConcepts.includes(m.cn)) info.featureConcepts.push(m.cn);
    }
  });

  // --- 保留正则提取作为补充（conceptMap 覆盖不到的句式信息） ---
  // 提取目标用户（正则补充，处理 conceptMap 未覆盖的表述）
  if (!info.targetUsers) {
    const userPatterns = [
      /(?:目标用户[是为]?|面向|针对|帮助|服务)(.{2,20}?)(?:[的。，；;]|$)/,
      /用户是(.{2,20}?)(?:[的。，；;]|$)/,
      /为(.{2,15}?)(?:设计|开发|打造|提供|解决)/,
    ];
    for (const p of userPatterns) {
      const m = text.match(p);
      if (m && m[1] && m[1].length > 1 && m[1].length < 20) {
        info.targetUsers = m[1].trim();
        break;
      }
    }
  }

  // 提取问题（正则保留，conceptMap 不覆盖问题句式）
  const problemPatterns = [
    /(?:问题|痛点|困难|挑战|难点|不足|缺乏|无法|不能|难以)(.{5,50}?)(?:。|，|；|;|$)/,
    /(?:面临|遇到|存在)(.{5,40}?)(?:的|问题|困难|挑战)/,
  ];
  for (const p of problemPatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      info.problem = m[1].trim();
      break;
    }
  }

  // P1: 技术栈检测 — 从 conceptMap 已提取的英文技术词 + 补充常见技术栈名
  // conceptMap 已处理了大部分，这里补充 AppState 和英文技术名
  const extraTechKeywords = ['React', 'Vue', 'Next.js', 'Angular', 'FastAPI', 'Express', 'Flask', 'Django',
    'OpenAI', 'Claude', 'GPT', 'Firebase', 'Supabase', 'PostgreSQL', 'MongoDB', 'SQLite',
    'Vercel', 'Netlify', 'Docker', 'LangChain', 'TensorFlow', 'PyTorch', 'Flutter',
    'TypeScript', 'Node.js', 'Electron', 'Rust', 'Go'];
  extraTechKeywords.forEach(t => {
    if (text.includes(t) && !info.tech.includes(t)) info.tech.push(t);
  });
  // 从AppState补充
  if (AppState.tech && AppState.tech.selected) {
    AppState.tech.selected.forEach(t => {
      if (!info.tech.includes(t)) info.tech.push(t);
    });
  }

  // 提取功能（正则保留 + conceptMap 功能概念补充）
  const featurePatterns = [
    /(?:功能|实现|支持|提供|包括|包含)(.{5,40}?)(?:。|，|；|;|$)/g,
    /(?:可以|能够|能)(.{3,30}?)(?:。|，|；|;|$)/g,
  ];
  for (const p of featurePatterns) {
    let m;
    while ((m = p.exec(text)) !== null && info.features.length < 5) {
      if (m[1] && m[1].length > 3) info.features.push(m[1].trim());
    }
  }
  // 用 conceptMap 功能概念补充
  if (info.features.length < 3 && info.featureConcepts.length > 0) {
    info.featureConcepts.forEach(fc => {
      if (info.features.length < 5 && !info.features.includes(fc)) {
        info.features.push(fc);
      }
    });
  }

  return info;
}

// P2新增：分析项目描述质量（4W覆盖 + 具体度 + 概念密度）
// 返回 { score, dimensions, missing, specificity, conceptDensity, details }
function analyzeDescQuality(desc, parsed) {
  const result = {
    score: 0,           // 0-100 总质量分
    dimensions: {},     // 各维度覆盖情况 { problem, solution, user, tech }
    missing: [],        // 缺失维度名称
    specificity: 0,     // 0-100 具体度
    conceptDensity: 0,  // 0-100 概念密度
    details: [],        // 具体问题列表
  };

  if (!desc || desc.length < 10) {
    result.details.push('描述过短（少于10字），无法分析');
    result.missing = ['problem', 'solution', 'user', 'tech'];
    return result;
  }

  // --- 1. 4W维度覆盖检测 ---
  // Problem: 是否包含痛点描述
  const hasProblem = parsed.problem ||
    /问题|痛点|困难|挑战|难点|不足|缺乏|无法|不能|难以|面临|遇到|存在/.test(desc);
  result.dimensions.problem = hasProblem ? 1 : 0;
  if (!hasProblem) {
    result.missing.push('problem');
    result.details.push('缺少痛点描述：未检测到"问题/痛点/困难"等关键词');
  }

  // Solution: 是否包含解决方案（功能/技术实现）
  const hasSolution = (parsed.features.length > 0) ||
    /功能|实现|支持|提供|包括|包含|可以|能够|通过|利用|使用|结合/.test(desc);
  result.dimensions.solution = hasSolution ? 1 : 0;
  if (!hasSolution) {
    result.missing.push('solution');
    result.details.push('缺少方案描述：未检测到功能/实现/通过/利用等关键词');
  }

  // User: 是否包含目标用户
  const hasUser = parsed.targetUsers ||
    parsed.domainConcepts.length > 0 ||
    /用户|面向|针对|帮助|为|人群|老人|儿童|学生|医生|农民/.test(desc);
  result.dimensions.user = hasUser ? 1 : 0;
  if (!hasUser) {
    result.missing.push('user');
    result.details.push('缺少目标用户：未检测到人群/用户相关描述');
  }

  // Tech: 是否包含技术方案
  const hasTech = parsed.tech.length > 0 || parsed.techConcepts.length > 0;
  result.dimensions.tech = hasTech ? 1 : 0;
  if (!hasTech) {
    result.missing.push('tech');
    result.details.push('缺少技术方案：未检测到任何技术栈或技术概念');
  }

  // --- 2. 具体度评分 ---
  let specScore = 50; // 基础分
  // 扣分：模糊短语
  const vaguePhrases = ['解决实际问题', '提升效率', '改善体验', '提供便利', '帮助用户', '实现功能', '满足需求', '提高质量', '优化流程', '解决问题'];
  vaguePhrases.forEach(v => {
    if (desc.includes(v)) {
      specScore -= 8;
      result.details.push(`表述模糊：包含"${v}"，建议用具体场景替代`);
    }
  });
  // 加分：数字/数据
  const numbers = desc.match(/\d+/g);
  if (numbers) {
    specScore += numbers.length * 5;
    result.details.push(`包含${numbers.length}处数据，增强了说服力`);
  }
  // 加分：具体场景词
  const sceneWords = ['医院', '学校', '家庭', '农村', '社区', '工厂', '街道', '超市', '公园', '地铁', '机场', '酒店', '餐厅', '工地', '田间', '考场', '办公室'];
  const matchedScenes = sceneWords.filter(s => desc.includes(s));
  if (matchedScenes.length > 0) {
    specScore += matchedScenes.length * 6;
    result.details.push(`包含具体场景（${matchedScenes.join('、')}），增强了代入感`);
  }
  // 加分：描述长度（信息量）
  if (desc.length > 100) specScore += 8;
  if (desc.length > 200) specScore += 5;
  // 加分：conceptMap 命中数
  if (parsed.allConcepts.length >= 5) {
    specScore += 10;
    result.details.push(`概念丰富：检测到${parsed.allConcepts.length}个专业概念`);
  }

  result.specificity = Math.max(0, Math.min(100, specScore));

  // --- 3. 概念密度 ---
  const conceptCount = parsed.allConcepts.length;
  const textLength = Math.max(1, desc.length);
  // 概念密度 = 概念数 / (文本长度/50)，归一化到0-100
  result.conceptDensity = Math.max(0, Math.min(100, Math.round((conceptCount / (textLength / 50)) * 100)));

  // --- 4. 总分 ---
  const dimScore = (4 - result.missing.length) * 20; // 维度覆盖 0-80
  const specPart = Math.round(result.specificity * 0.15); // 具体度贡献 0-15
  const densityPart = Math.round(result.conceptDensity * 0.05); // 密度贡献 0-5
  result.score = Math.max(0, Math.min(100, dimScore + specPart + densityPart));

  return result;
}

// 根据用户输入生成个性化 pitch 各段落
function generatePitchSections(ctx, info) {
  const name = ctx.name;
  const oneLiner = ctx.oneLiner;
  const desc = ctx.desc;
  const techStr = info.tech.length > 0 ? info.tech.slice(0, 5).join(' + ') : '现代Web技术';
  const users = info.targetUsers || '目标用户';
  const problem = info.problem || '一个亟待解决的实际问题';
  const features = info.features.length > 0 ? info.features : [];

  // 1. 开场Hook
  let hookContent;
  if (ctx.topicScore > 0 && ctx.topicScore >= 70) {
    hookContent = `<p>「${oneLiner}」——这是我们在黑客松中选择的方向。</p><p>经过搜索，GitHub上仅有极少同类项目，这是一个<strong>稀缺且有价值的方向</strong>。今天，${name} 要改变这个现状。</p>`;
  } else if (ctx.topicScore > 0 && ctx.topicScore < 45) {
    hookContent = `<p>市场上已经有很多类似产品，但<strong>${users}的核心需求仍然没有被真正满足</strong>。</p><p>现有的方案要么太复杂，要么不够精准。这就是我们开发 ${name} 的原因。</p>`;
  } else {
    hookContent = `<p>${oneLiner}。</p><p>这不是一个简单的需求——它关乎${users}的日常体验。我们用 ${techStr} 重新思考了这个问题的解法。</p>`;
  }

  // 2. 问题陈述
  let problemContent = `<p><strong>目标用户：</strong>${users}</p>`;
  if (info.problem) {
    problemContent += `<p><strong>核心痛点：</strong>${info.problem}</p>`;
  } else {
    problemContent += `<p><strong>核心痛点：</strong>${desc.split(/[。；;]/)[0]}</p>`;
  }
  if (features.length > 0) {
    problemContent += `<p><strong>现状不足：</strong>目前${users}面临的困难包括：${features.slice(0, 3).join('、')}等问题，缺乏有效的解决方案。</p>`;
  }
  problemContent += `<p>这些问题直接影响了${users}的体验和效率，亟待解决。</p>`;

  // 3. 解决方案
  let solutionContent = `<p>我们开发了 <strong>${name}</strong>——${oneLiner}。</p>`;
  if (features.length > 0) {
    solutionContent += `<p><strong>核心功能包括：</strong></p><ul>`;
    features.slice(0, 4).forEach(f => {
      solutionContent += `<li>${f}</li>`;
    });
    solutionContent += `</ul>`;
  } else {
    solutionContent += `<p>${desc}</p>`;
  }
  solutionContent += `<p>与现有方案不同，${name} 的核心创新在于<strong>深度结合用户实际场景</strong>，而非简单堆砌功能。</p>`;

  // 4. 核心Demo
  let demoContent = `<p><strong>演示流程：</strong></p><ol>`;
  if (features.length > 0) {
    demoContent += `<li>打开 ${name}，展示${features[0] || '主界面'}</li>`;
    if (features.length > 1) demoContent += `<li>演示${features[1]}</li>`;
    if (features.length > 2) demoContent += `<li>展示${features[2]}的完整流程</li>`;
  } else {
    demoContent += `<li>展示 ${name} 的主界面和核心交互</li>`;
    demoContent += `<li>演示核心功能的完整使用流程</li>`;
    demoContent += `<li>展示关键技术的实际效果</li>`;
  }
  demoContent += `</ol>`;
  demoContent += `<p>如你所见，整个流程<strong>简洁流畅</strong>，用户无需学习即可上手。</p>`;

  // 5. 技术亮点
  let techContent = `<p><strong>技术栈：</strong>${techStr}</p>`;
  if (info.tech.length > 0) {
    techContent += `<p><strong>技术架构：</strong></p><ul>`;
    // 分层展示
    const frontend = info.tech.filter(t => ['React','Vue','Next.js','Angular','HTML/CSS/JS'].includes(t));
    const backend = info.tech.filter(t => ['FastAPI (Python)','Express (Node.js)','Flask','Django'].includes(t));
    const ai = info.tech.filter(t => ['OpenAI API','Claude API','Together AI','LangChain','Hugging Face'].includes(t));
    const db = info.tech.filter(t => ['PostgreSQL','MongoDB','SQLite','Supabase','Firebase','Firebase Firestore'].includes(t));
    const deploy = info.tech.filter(t => ['Vercel','Netlify','Render','Railway'].includes(t));
    if (frontend.length) techContent += `<li>前端：${frontend.join(' + ')}</li>`;
    if (backend.length) techContent += `<li>后端：${backend.join(' + ')}</li>`;
    if (ai.length) techContent += `<li>AI能力：${ai.join(' + ')}</li>`;
    if (db.length) techContent += `<li>数据层：${db.join(' + ')}</li>`;
    if (deploy.length) techContent += `<li>部署：${deploy.join(' + ')}</li>`;
    techContent += `</ul>`;
  }
  // 技术创新点
  const aiTech = info.tech.find(t => ['OpenAI API','Claude API','Together AI','LangChain'].includes(t));
  const aiConcepts = info.techConcepts ? info.techConcepts.filter(c => ['AI','人工智能','机器学习','深度学习','大模型','大语言模型','计算机视觉','自然语言','语音识别','图像识别','知识图谱','RAG','Agent','智能体','多模态','生成式'].includes(c)) : [];
  if (aiConcepts.length > 0) {
    techContent += `<p><strong>创新点：</strong>将${aiConcepts.slice(0, 2).join('与')}深度融入业务场景，不是简单的API套壳，而是针对${users}的需求做了定制化优化。</p>`;
  } else if (aiTech) {
    techContent += `<p><strong>创新点：</strong>将 ${aiTech} 深度融入业务场景，不是简单的API套壳，而是针对${users}的需求做了定制化优化。</p>`;
  } else if (info.techConcepts && info.techConcepts.length >= 2) {
    techContent += `<p><strong>创新点：</strong>结合${info.techConcepts.slice(0, 2).join('与')}技术，在 ${ctx.duration} 小时内完成了从设计到部署的完整流程。</p>`;
  } else {
    techContent += `<p><strong>创新点：</strong>在 ${ctx.duration} 小时内完成了从设计到部署的完整流程，技术选型兼顾了开发效率和产品质量。</p>`;
  }

  // 6. 影响力
  let impactContent = `<p>${name} 可以直接帮助<strong>${users}</strong>解决${info.problem || '实际问题'}。</p>`;
  if (ctx.topicScore > 0) {
    if (ctx.topicScore >= 70) {
      impactContent += `<p>` + tf('review.impact.high', {score: ctx.topicScore}) + `</p>`;
    } else if (ctx.topicScore < 45) {
      impactContent += `<p>` + tf('review.impact.mid', {name: name}) + `</p>`;
    }
  }
  impactContent += `<p>如果推广开来，预计能显著改善${users}的体验和效率。</p>`;

  // 7. 未来展望
  let futureContent = `<p>接下来，我们计划：</p><ul>`;
  futureContent += `<li>优化核心功能，根据用户反馈快速迭代</li>`;
  if (features.length > 2) {
    futureContent += `<li>扩展更多场景，如${features.slice(2).join('、')}等</li>`;
  }
  futureContent += `<li>探索商业化路径，让 ${name} 服务更广泛的${users}</li>`;
  futureContent += `</ul>`;

  const sections = [
    {
      title: '开场Hook', icon: '🎣', duration: '15秒',
      content: hookContent,
      plainText: hookContent.replace(/<[^>]+>/g, ''),
      tips: ['用自信的语气开场，眼神接触评委', '停顿1秒让数据/观点sink in']
    },
    {
      title: '问题陈述', icon: '🎯', duration: '30秒',
      content: problemContent,
      plainText: problemContent.replace(/<[^>]+>/g, ''),
      tips: ['让评委感受到痛点的真实性和严重性', '用具体场景代替抽象描述']
    },
    {
      title: '解决方案', icon: '💡', duration: '45秒',
      content: solutionContent,
      plainText: solutionContent.replace(/<[^>]+>/g, ''),
      tips: [t('review.tip.diff'), t('review.tip.focus')]
    },
    {
      title: '核心Demo', icon: '🎬', duration: '60秒',
      content: demoContent,
      plainText: demoContent.replace(/<[^>]+>/g, ''),
      tips: ['提前准备好演示账号和数据', '只展示最核心的1-2个功能', '如果现场有风险，使用录屏备用']
    },
    {
      title: '技术亮点', icon: '🔧', duration: '20秒',
      content: techContent,
      plainText: techContent.replace(/<[^>]+>/g, ''),
      tips: ['不要过于深入技术细节', '重点讲创新点而非技术清单']
    },
    {
      title: '影响力', icon: '🌟', duration: '20秒',
      content: impactContent,
      plainText: impactContent.replace(/<[^>]+>/g, ''),
      tips: [t('review.tip.data'), t('review.tip.social')]
    },
    {
      title: '未来展望', icon: '🚀', duration: '10秒',
      content: futureContent,
      plainText: futureContent.replace(/<[^>]+>/g, ''),
      tips: ['展示项目的可持续性', '简短有力，不要拖沓']
    },
  ];

  return sections;
}

function exportPitch() {
  if (!AppState.pitch.pitchContent) {
    showToast(t('pitch.warn.noPitch'), 'warning');
    return;
  }
  navigator.clipboard.writeText(AppState.pitch.pitchContent).then(() => {
    showToast(t('pitch.success.copied'), 'success');
  });
}

function renderReviewAgents() {
  const container = $('#reviewAgents');
  const agentNames = {
    code_quality: fb('代码质量评审员', 'Code Quality Reviewer'),
    ux_design: fb('用户体验评审员', 'UX Design Reviewer'),
    innovation: fb('创新性评审员', 'Innovation Reviewer'),
    technical: fb('技术深度评审员', 'Technical Depth Reviewer'),
    presentation: fb('演示与表达评审员', 'Presentation Reviewer')
  };
  const agentFocus = {
    code_quality: fb('从工程实践角度评估代码质量', 'Evaluating code quality from engineering practice'),
    ux_design: fb('从用户视角评估产品设计', 'Evaluating product design from user perspective'),
    innovation: fb('评估项目的创新性和差异化', 'Evaluating project innovation and differentiation'),
    technical: fb('评估技术实现的难度和完成度', 'Evaluating technical difficulty and completeness'),
    presentation: fb('评估Pitch表达和演示效果', 'Evaluating pitch presentation and demo effectiveness')
  };
  container.innerHTML = PITCH_DATA.agents.map(agent => `
    <div class="review-agent" data-agent="${agent.id}">
      <div class="agent-header">
        <span class="agent-icon" style="color:${agent.color}">${agent.icon}</span>
        <div><div class="agent-name">${agentNames[agent.id] || agent.name}</div><div class="agent-focus">${agentFocus[agent.id] || agent.focus}</div></div>
      </div>
      <div class="agent-criteria" id="criteria-${agent.id}">
        ${agent.criteria.map(c => `
          <div class="criterion" data-agent="${agent.id}" data-criterion="${c.id}">
            <div class="criterion-info">
              <span class="criterion-text">${c.text}</span>
              <span class="criterion-weight">${c.weight}${t('eval.points')}</span>
            </div>
            <div class="criterion-rating">
              ${[0,1,2,3,4,5].map(n => `<button class="rating-btn ${AppState.pitch.review.ratings[agent.id] && AppState.pitch.review.ratings[agent.id][c.id] === n ? 'active' : ''}" data-rating="${n}">${n}</button>`).join('')}
            </div>
            <div class="criterion-feedback" id="feedback-${agent.id}-${c.id}"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // 绑定评分按钮
  $$('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const criterion = btn.closest('.criterion');
      const agentId = criterion.dataset.agent;
      const criterionId = criterion.dataset.criterion;
      const rating = parseInt(btn.dataset.rating);

      if (!AppState.pitch.review.ratings[agentId]) AppState.pitch.review.ratings[agentId] = {};
      AppState.pitch.review.ratings[agentId][criterionId] = rating;

      criterion.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      saveState();
    });
  });
}

// 根据选手输入的信息自动生成模拟Agent评审
function autoReview() {
  const name = $('#pitchProjectName').value.trim();
  const oneLiner = $('#pitchOneLiner').value.trim();
  const desc = $('#pitchDescription').value.trim();

  if (!name || !oneLiner) {
    showToast('请先填写项目名称和一句话描述', 'warning');
    return;
  }

  // 收集所有项目信息
  const projectInfo = {
    name, oneLiner, desc,
    topicDesc: AppState.topic.description || '',
    techStack: AppState.tech.selected || [],
    teamSize: AppState.tech.teamSize || 3,
    duration: AppState.tech.duration || 48,
    topicScore: AppState.topic.score || 0,
    devScore: AppState.dev.score || 0,
    devFindings: AppState.dev.findings || null,
    hasGitignore: AppState.dev.files?.some(f => f.name === '.gitignore' || f.name.endsWith('.gitignore')) || false,
    hasEnvFile: AppState.dev.files?.some(f => f.name === '.env' || f.name.endsWith('.env')) || false,
    demoDetected: AppState.demo.detected || false,
    demoType: AppState.demo.projectType || '',
  };

  // 从描述中补充技术栈（如果用户没有在技术选型模块选择）
  const parsed = parseProjectInfo(desc + ' ' + projectInfo.topicDesc);
  projectInfo.techStack = [...new Set([...projectInfo.techStack, ...parsed.tech])];

  // P2: 分析描述质量
  const quality = analyzeDescQuality(desc + ' ' + projectInfo.topicDesc, parsed);

  // 为每个 agent 的每个 criterion 自动评分并生成反馈
  const ratings = {};
  const feedbacks = {};

  PITCH_DATA.agents.forEach(agent => {
    ratings[agent.id] = {};
    feedbacks[agent.id] = {};

    agent.criteria.forEach(criterion => {
      const result = evaluateCriterion(agent.id, criterion, projectInfo, parsed, quality);
      ratings[agent.id][criterion.id] = result.score;
      feedbacks[agent.id][criterion.id] = result.feedback;
    });
  });

  AppState.pitch.review.ratings = ratings;
  AppState.pitch.review.feedbacks = feedbacks;
  AppState.pitch.review.autoReviewed = true;

  // 重新渲染评审界面，显示自动评分和反馈
  renderReviewAgentsWithFeedback(feedbacks);

  // 自动计算分数
  calculateReviewScore();

  saveState();
  showToast(t('pitch.success.reviewed'), 'success');
}

// 根据项目信息评估单个评审标准
function evaluateCriterion(agentId, criterion, info, parsed, quality) {
  let score = 3; // 默认中等
  let feedback = '';
  const allText = (info.desc + ' ' + info.topicDesc).toLowerCase();
  const hasTech = (techName) => info.techStack.some(t => t.toLowerCase().includes(techName.toLowerCase()));
  const q = quality || { score: 50, specificity: 50, conceptDensity: 50, missing: [], details: [] };

  switch(criterion.id) {
    // === 代码质量评审员 ===
    case 'structure':
      if (info.techStack.length >= 4) { score = 4; feedback = fb(`技术栈包含${info.techStack.length}项技术，表明有前后端分离的架构意识。建议确保目录结构清晰（src/、config/、tests/）。`, `Tech stack includes ${info.techStack.length} technologies, showing front-back separation awareness. Ensure clear directory structure (src/, config/, tests/).`); }
      else if (info.techStack.length >= 2) { score = 3; feedback = fb(`技术栈较少（${info.techStack.length}项），需关注代码模块化。建议将业务逻辑与UI分离。`, `Minimal tech stack (${info.techStack.length} items). Focus on code modularization. Separate business logic from UI.`); }
      else { score = 2; feedback = fb('技术栈单一，代码可能集中在少数文件中。建议拆分模块，提高可维护性。', 'Single tech stack, code may be concentrated in few files. Split modules for maintainability.'); }
      break;
    case 'readability':
      if (q.specificity >= 70) { score = 4; feedback = fb('描述具体清晰，代码可读性意识较好。建议使用有意义的变量名，关键业务逻辑添加注释。', 'Description is specific and clear. Use meaningful variable names and add comments for key logic.'); }
      else if (q.specificity < 35) { score = 2; feedback = fb('描述偏模糊，代码可读性风险较高。建议先明确功能细节，再编写清晰变量名和注释。', 'Description is vague, code readability at risk. Clarify feature details first, then use clear naming and comments.'); }
      else { score = 3; feedback = fb('建议使用有意义的变量名和函数名，避免缩写。关键业务逻辑应添加注释。', 'Use meaningful variable and function names, avoid abbreviations. Add comments for key business logic.'); }
      break;
    case 'error_handling':
      if (hasTech('FastAPI') || hasTech('Express') || hasTech('Flask') || hasTech('Django')) { score = 3; feedback = fb('使用了后端框架，建议为API接口添加try-catch和统一的错误响应格式。', 'Using backend framework. Add try-catch and unified error response format for API endpoints.'); }
      else { score = 2; feedback = fb('未检测到后端框架，错误处理可能不足。建议至少在前端添加全局错误捕获。', 'No backend framework detected, error handling may be insufficient. Add global error catching on frontend at least.'); }
      break;
    case 'comments':
      if (q.specificity >= 65) { score = 4; feedback = fb('描述信息量充足，注释意识应较好。建议至少为核心算法和API接口添加注释。', 'Sufficient detail in description. Add comments for core algorithms and API endpoints.'); }
      else { score = 3; feedback = fb('黑客松项目中注释容易被忽略，建议至少为核心算法和API接口添加注释。', 'Comments are often skipped in hackathons. Add comments for core algorithms and API endpoints at least.'); }
      break;
    case 'no_hardcode':
      if (info.devFindings && info.devFindings.secrets && info.devFindings.secrets.length > 0) {
        score = 1; feedback = fb(`⚠️ 代码扫描发现${info.devFindings.secrets.length}处硬编码密钥/密码！这是严重安全问题，必须使用环境变量替代。`, `⚠️ Code scan found ${info.devFindings.secrets.length} hardcoded secrets/passwords! Critical security issue. Must use environment variables instead.`);
      } else if (info.hasEnvFile) {
        score = 4; feedback = fb('检测到.env文件，说明有使用环境变量的意识。确保.env已加入.gitignore。', 'Detected .env file, showing awareness of environment variables. Ensure .env is in .gitignore.');
      } else {
        score = 3; feedback = fb('未进行代码扫描，无法确认是否存在硬编码。建议使用代码扫描模块检查。', 'No code scan performed, cannot confirm if hardcoding exists. Use the Code Scanner module to check.');
      }
      break;
    case 'dependency':
      if (hasTech('React') || hasTech('Next.js') || hasTech('Vue')) { score = 4; feedback = fb('使用了主流框架，依赖管理较规范。建议锁定版本号（package-lock.json）。', 'Using mainstream framework, dependency management is decent. Lock version numbers (package-lock.json).'); }
      else { score = 3; feedback = fb('建议使用包管理器（npm/pip）管理依赖，并提交lock文件。', 'Use package managers (npm/pip) for dependencies and commit lock files.'); }
      break;
    case 'testing':
      score = 2; feedback = fb('黑客松项目通常缺少测试。建议至少为核心功能编写1-2个基本测试用例，展示工程素养。', 'Hackathon projects usually lack tests. Write 1-2 basic test cases for core features to show engineering maturity.');
      break;
    case 'version_control':
      if (info.hasGitignore) { score = 4; feedback = fb('检测到.gitignore文件，版本控制意识良好。建议保持频繁提交，提交信息清晰。', 'Detected .gitignore file, good version control awareness. Commit frequently with clear messages.'); }
      else { score = 2; feedback = fb('未检测到.gitignore文件！请参考Demo辅助模块的Git教程，创建.gitignore并上传到GitHub。', 'No .gitignore detected! Follow the Git tutorial in Demo Helper module, create .gitignore and push to GitHub.'); }
      break;

    // === 用户体验评审员 ===
    case 'first_impression':
      if (parsed.targetUsers) { score = 4; feedback = fb(`项目面向"${parsed.targetUsers}"，建议首屏设计针对该用户群体的审美和使用习惯优化。`, `Project targets "${parsed.targetUsers}". Optimize first screen design for this group's aesthetics and usage habits.`); }
      else { score = 3; feedback = fb('建议首屏突出核心功能，用一句话让评委理解项目价值。', 'Highlight core features on the first screen. Let judges understand project value in one sentence.'); }
      break;
    case 'navigation':
      score = 3; feedback = fb('建议导航结构不超过3层，核心功能入口放在首屏可见位置。', 'Keep navigation under 3 levels. Place core feature entries visible on first screen.');
      break;
    case 'feedback':
      score = 3; feedback = fb('建议为所有用户操作添加反馈：按钮点击loading、成功toast、失败提示。', 'Add feedback for all user actions: button loading, success toasts, error prompts.');
      break;
    case 'responsive':
      if (hasTech('React') || hasTech('Next.js')) { score = 4; feedback = fb('使用React/Next.js，可配合Tailwind CSS快速实现响应式。建议至少适配手机和桌面端。', 'Using React/Next.js, pair with Tailwind CSS for responsive design. At least adapt for mobile and desktop.'); }
      else { score = 3; feedback = fb('建议使用CSS媒体查询或Flexbox/Grid确保在不同屏幕尺寸下正常显示。', 'Use CSS media queries or Flexbox/Grid to ensure proper display across screen sizes.'); }
      break;
    case 'consistency':
      score = 3; feedback = fb('建议统一配色方案（不超过3种主色）、字体（不超过2种）和组件风格。', 'Unify color scheme (max 3 primary colors), fonts (max 2), and component styles.');
      break;
    case 'accessibility':
      const a11yConcepts = parsed.domainConcepts.filter(d => ['老年人','老人','适老','盲人','聋','残障','无障碍'].includes(d));
      if (a11yConcepts.length >= 2) { score = 5; feedback = fb(`✅ 项目包含多个无障碍概念（${a11yConcepts.join('、')}），极大的加分项！确保实现大字体、高对比度、语音辅助。`, `✅ Multiple accessibility concepts (${a11yConcepts.join(', ')}), huge bonus! Ensure large fonts, high contrast, voice assistance.`); }
      else if (a11yConcepts.length >= 1 || allText.includes('无障碍') || allText.includes('适老') || allText.includes('accessibility') || allText.includes('a11y')) { score = 5; feedback = fb('✅ 项目描述中提到了无障碍/适老化，这是极大的加分项！确保实现大字体、高对比度、语音辅助等功能。', '✅ Project mentions accessibility/elderly-friendly design, a huge bonus! Ensure large fonts, high contrast, voice assistance.'); }
      else if (parsed.domainConcepts.includes('儿童') || parsed.domainConcepts.includes('学生')) { score = 4; feedback = fb('面向儿童/学生，建议考虑 simplified UI and parental controls for accessibility.', 'Targeting children/students, consider simplified UI and parental controls for accessibility.'); }
      else { score = 2; feedback = fb('未检测到无障碍设计考量。建议至少添加alt文本、ARIA标签和键盘导航支持。', 'No accessibility considerations detected. Add alt text, ARIA labels, and keyboard navigation support at minimum.'); }
      break;
    case 'empty_state':
      score = 3; feedback = fb('建议为列表空状态、加载中、错误状态都设计友好的提示页面。', 'Design friendly prompt pages for empty states, loading, and error states.');
      break;
    case 'performance':
      score = 3; feedback = fb('建议优化首屏加载（<3秒），使用懒加载和代码分割。图片压缩后使用。', 'Optimize first screen loading (<3s), use lazy loading and code splitting. Compress images before use.');
      break;

    // === 创新性评审员 ===
    case 'novelty':
      if (info.topicScore >= 70) { score = 5; feedback = tf('review.originality.high', {score: info.topicScore}); }
      else if (info.topicScore >= 45) { score = 3; feedback = tf('review.originality.mid', {score: info.topicScore}); }
      else if (info.topicScore > 0) { score = 2; feedback = tf('review.originality.low', {score: info.topicScore}); }
      else { score = 3; feedback = t('review.originality.none'); }
      break;
    case 'differentiation':
      if (parsed.features.length >= 3) { score = 4; feedback = tf('review.innovation.rich', {count: parsed.features.length}); }
      else { score = 3; feedback = t('review.innovation.poor'); }
      break;
    case 'ai_integration':
      const aiTechs = info.techStack.filter(t => ['OpenAI API','Claude API','Together AI','LangChain','Hugging Face','OpenAI'].some(n => t.includes(n)));
      const aiConcepts = parsed.techConcepts.filter(c => ['AI','人工智能','机器学习','深度学习','大模型','大语言模型','计算机视觉','自然语言','语音识别','图像识别','知识图谱','RAG','Agent','智能体','多模态','生成式','向量数据库','微调','OCR','目标检测','人脸识别','情感分析','图像生成','视频生成','代码生成','联邦学习'].includes(c));
      if (aiConcepts.length >= 3) { score = 5; feedback = fb(`AI技术深度好（${aiConcepts.join('、')}），建议在Pitch中突出AI创新点。`, `Strong AI depth (${aiConcepts.join(', ')}). Highlight AI innovation in pitch.`); }
      else if (aiTechs.length >= 2) { score = 5; feedback = tf('review.ai.multi', {count: aiTechs.length, names: aiTechs.join('、')}); }
      else if (aiConcepts.length >= 1) { score = 4; feedback = fb(`检测到AI概念（${aiConcepts.join('、')}），建议深化集成而非简单调用API。`, `AI concepts detected (${aiConcepts.join(', ')}). Deepen integration rather than simple API calls.`); }
      else if (aiTechs.length === 1) { score = 3; feedback = tf('review.ai.single', {name: aiTechs[0]}); }
      else if (allText.includes('ai') || allText.includes('人工智能')) { score = 2; feedback = t('review.ai.mentioned'); }
      else { score = 3; feedback = t('review.ai.none'); }
      break;
    case 'problem_fitting':
      if (q.missing.includes('problem') && q.missing.includes('solution')) { score = 2; feedback = fb('描述中缺少痛点和方案描述，评委难以判断问题匹配度。建议补充"解决什么问题"和"用什么方案"。', 'Missing problem and solution in description. Judges cannot assess problem fit. Add what problem and what solution.'); }
      else if (q.missing.includes('problem')) { score = 3; feedback = fb('描述中缺少明确的痛点描述。建议补充具体问题场景，如"60%老人忘记服药"。', 'Missing clear problem statement. Add specific problem scenario, e.g., "60% of elderly forget medications".'); }
      else if (q.specificity >= 65) { score = 5; feedback = fb('问题描述具体，方案匹配度高。建议在Pitch中用数据强化问题严重性。', 'Problem described specifically, solution fits well. Use data in pitch to emphasize severity.'); }
      else { score = 4; feedback = fb('问题与方案匹配度较好。建议补充更多具体场景描述以提升说服力。', 'Good problem-solution fit. Add more specific scenarios to improve persuasiveness.'); }
      break;
    case 'scalability':
      if (q.conceptDensity >= 60 && parsed.techConcepts.length >= 3) { score = 4; feedback = fb(`检测到${parsed.techConcepts.length}个技术概念，扩展性好。建议在Pitch中说明如何扩展到更多场景。`, `Detected ${parsed.techConcepts.length} tech concepts, good extensibility. Explain how to expand to more scenarios in pitch.`); }
      else if (parsed.domainConcepts.length >= 2) { score = 4; feedback = fb(`覆盖${parsed.domainConcepts.length}个领域，有横向扩展潜力。建议说明可复用到哪些相邻场景。`, `Covers ${parsed.domainConcepts.length} domains, good horizontal potential. Explain which adjacent scenarios it can extend to.`); }
      else { score = 3; feedback = fb('建议考虑项目可扩展性：能否服务更多用户？能否拓展到相邻领域？', 'Consider scalability: can it serve more users? Can it extend to adjacent domains?'); }
      break;
    case 'tech_combination':
      if (parsed.techConcepts.length >= 4) { score = 5; feedback = fb(`技术组合丰富（${parsed.techConcepts.join('、')}），创新潜力大。${info.duration}小时内需聚焦核心组合。`, `Rich tech combination (${parsed.techConcepts.join(', ')}), high innovation potential. Focus on core combo in ${info.duration}h.`); }
      else if (info.techStack.length >= 5) { score = 4; feedback = tf('review.techcombo.rich', {count: info.techStack.length, duration: info.duration}); }
      else if (info.techStack.length >= 3) { score = 3; feedback = t('review.techcombo.mid'); }
      else { score = 3; feedback = t('review.techcombo.minimal'); }
      break;
    case 'user_insight':
      if (q.missing.includes('user')) { score = 2; feedback = fb('未检测到目标用户描述。建议明确"为谁解决"——补充人群特征和使用场景。', 'No target user detected. Clarify "for whom" — add user characteristics and usage scenarios.'); }
      else if (parsed.targetUsers && q.specificity >= 60) { score = 5; feedback = fb(`目标用户"${parsed.targetUsers}"明确，描述具体。建议在Pitch中用用户故事展示洞察深度。`, `Target user "${parsed.targetUsers}" is clear and specific. Use user stories in pitch to show insight depth.`); }
      else if (parsed.targetUsers) { score = 4; feedback = fb(`项目面向"${parsed.targetUsers}"，用户洞察较好。建议补充该群体的具体使用场景。`, `Project targets "${parsed.targetUsers}", good user insight. Add specific usage scenarios for this group.`); }
      else { score = 3; feedback = fb('建议更明确地描述目标用户群体及其使用场景。', 'Describe target user groups and their usage scenarios more clearly.'); }
      break;
    case 'market_potential':
      const socialGoodDomains = ['老年人','老人','儿童','乡村','盲人','聋','残障','无障碍','环保','心理','情绪','压力','应急','灾害','公益','志愿','扶贫','社区','慈善','罕见病','孕妇','婴儿','母婴'];
      const matchedSocial = parsed.domainConcepts.filter(d => socialGoodDomains.includes(d));
      if (matchedSocial.length >= 3) { score = 5; feedback = fb(`项目具有强社会价值（${matchedSocial.join('、')}），蓝海方向明确。`, `Strong social value (${matchedSocial.join(', ')}), clear blue ocean direction.`); }
      else if (matchedSocial.length >= 1 || allText.includes('老年人') || allText.includes('无障碍') || allText.includes('环保') || allText.includes('乡村') || allText.includes('残障') || allText.includes('心理')) { score = 5; feedback = t('review.social.strong'); }
      else if (parsed.domainConcepts.length >= 2) { score = 4; feedback = fb(`覆盖${parsed.domainConcepts.length}个领域，有一定市场潜力。`, `Covers ${parsed.domainConcepts.length} domains, has some market potential.`); }
      else { score = 3; feedback = t('review.social.week'); }
      break;

    // === 技术深度评审员 ===
    case 'complexity':
      if (info.techStack.length >= 6) { score = 5; feedback = tf('review.complexity.high', {count: info.techStack.length, duration: info.duration}); }
      else if (info.techStack.length >= 4) { score = 4; feedback = t('review.complexity.mid'); }
      else { score = 3; feedback = t('review.complexity.low'); }
      break;
    case 'completeness':
      if (info.demoDetected) { score = 4; feedback = t('review.completeness.good'); }
      else { score = 3; feedback = fb('建议确保核心功能完整实现，避免展示半成品功能。优先完成主流程。', 'Ensure core features are fully implemented. Avoid showing half-finished features. Prioritize main workflow.'); }
      break;
    case 'architecture':
      const hasBackend = hasTech('FastAPI') || hasTech('Express') || hasTech('Flask') || hasTech('Django');
      const hasDB = hasTech('PostgreSQL') || hasTech('MongoDB') || hasTech('SQLite') || hasTech('Supabase') || hasTech('Firebase');
      if (hasBackend && hasDB) { score = 5; feedback = fb('前后端+数据库架构完整，系统设计合理。建议确保API设计RESTful规范。', 'Complete front-back-database architecture. Ensure RESTful API design.'); }
      else if (hasBackend || hasDB) { score = 3; feedback = fb('有后端或数据库，但架构不够完整。建议补充缺失部分。', 'Has backend or database, but architecture incomplete. Fill in missing parts.'); }
      else { score = 3; feedback = fb('前端-only项目也可以，但建议考虑数据持久化方案。', 'Frontend-only is acceptable, but consider data persistence solutions.'); }
      break;
    case 'api_design':
      if (hasTech('FastAPI') || hasTech('Express') || hasTech('Flask') || hasTech('Django')) { score = 4; feedback = fb('使用后端框架，建议API遵循RESTful规范，统一响应格式（{code, data, message}）。', 'Using backend framework. Follow RESTful conventions with unified response format ({code, data, message}).'); }
      else { score = 3; feedback = fb('如果使用第三方API，建议封装统一的API调用层，处理超时和错误。', 'If using third-party APIs, encapsulate a unified API layer with timeout and error handling.'); }
      break;
    case 'data_handling':
      if (hasTech('PostgreSQL') || hasTech('MongoDB')) { score = 4; feedback = fb('使用关系型/文档数据库，建议设计合理的数据模型，注意索引优化。', 'Using relational/document database. Design proper data models and optimize indexes.'); }
      else if (hasTech('Firebase') || hasTech('Supabase')) { score = 4; feedback = fb('使用BaaS，数据处理便捷。注意设计合理的数据结构。', 'Using BaaS, convenient data handling. Design proper data structures.'); }
      else { score = 3; feedback = fb('建议考虑数据存储方案，至少使用localStorage保存关键状态。', 'Consider data storage solutions. Use localStorage for key states at minimum.'); }
      break;
    case 'security':
      if (info.devScore > 0 && info.devScore < 50) { score = 1; feedback = fb(`⚠️ 代码安全评分仅${info.devScore}分！存在安全隐患。请立即修复代码扫描中发现的问题。`, `⚠️ Code security score only ${info.devScore}! Security risks exist. Fix issues found in code scan immediately.`); }
      else if (info.devScore >= 80) { score = 5; feedback = fb(`✅ 代码安全评分${info.devScore}分，安全措施到位。`, `✅ Code security score ${info.devScore}, security measures are solid.`); }
      else { score = 3; feedback = fb('建议进行代码安全扫描，检查硬编码密钥、输入验证等基本安全措施。', 'Run code security scans. Check for hardcoded secrets, input validation, and other basic security measures.'); }
      break;
    case 'performance_t':
      score = 3; feedback = fb('建议关注首屏加载时间和API响应时间。使用浏览器DevTools检测性能瓶颈。', 'Monitor first screen load time and API response time. Use browser DevTools to detect performance bottlenecks.');
      break;
    case 'deployment_t':
      if (info.demoDetected) { score = 4; feedback = fb(`已检测项目类型（${info.demoType}），建议使用推荐的部署方案上线。`, `Project type detected (${info.demoType}). Use the recommended deployment plan to go live.`); }
      else { score = 2; feedback = fb('建议在Demo辅助模块检测项目类型并选择部署方案。能在线访问的Demo大大加分。', 'Detect project type and select deployment plan in Demo Helper. An accessible online Demo is a big plus.'); }
      break;

    // === 演示与表达评审员 ===
    case 'value_prop':
      if (info.oneLiner && info.oneLiner.length > 10) { score = 4; feedback = fb(`一句话描述"${info.oneLiner}"简洁有力。建议在Pitch开场直接使用这句话。`, `One-liner "${info.oneLiner}" is concise and powerful. Use it directly in your pitch opening.`); }
      else { score = 2; feedback = fb('一句话描述不够清晰或太短。建议用"[产品名]是一个为[用户]解决[问题]的[方案]"格式。', 'One-liner is unclear or too short. Use format: "[Product] is a [solution] for [users] to solve [problem]".'); }
      break;
    case 'demo_flow':
      if (parsed.features.length >= 3) { score = 4; feedback = fb(`有${parsed.features.length}个可演示功能。建议设计3步演示流程：打开→核心操作→展示结果。`, `${parsed.features.length} demonstrable features. Design a 3-step demo flow: open → core action → show result.`); }
      else { score = 3; feedback = fb('建议设计清晰的演示流程，提前准备好演示数据，只展示最核心的功能。', 'Design a clear demo flow. Prepare demo data in advance. Only show the most core features.'); }
      break;
    case 'problem_statement':
      if (q.missing.includes('problem')) { score = 2; feedback = fb('描述中缺少问题陈述。建议用"X%的用户面临Y问题"格式开头，让评委立刻理解痛点。', 'Missing problem statement. Start with "X% of users face Y problem" to help judges understand the pain point immediately.'); }
      else if (q.specificity >= 65 && /问题|痛点|困难|挑战/.test(info.desc)) { score = 5; feedback = fb('问题陈述清晰且具体。建议在Pitch中用数据或用户故事强化问题严重性。', 'Problem statement is clear and specific. Use data or user stories in pitch to emphasize severity.'); }
      else if (/问题|痛点|困难|挑战/.test(info.desc)) { score = 4; feedback = fb('项目描述中阐述了问题。建议补充具体数据（如"60%的老人忘记服药"）增强说服力。', 'Problem described. Add specific data (e.g., "60% of elderly forget medications") to strengthen persuasiveness.'); }
      else { score = 3; feedback = fb('建议在Pitch中用具体数据说明问题的严重性和紧迫性。', 'Use specific data in pitch to convey problem severity and urgency.'); }
      break;
    case 'solution_clarity':
      if (q.missing.includes('solution')) { score = 2; feedback = fb('描述中缺少解决方案。建议用"通过[技术/方法]实现[功能]，解决[问题]"格式补充。', 'Missing solution in description. Add using format: "Solve [problem] by [tech/method] implementing [feature]".'); }
      else if (q.specificity >= 65) { score = 5; feedback = fb('解决方案清晰且具体。建议在Pitch中用"问题→方案→效果"的逻辑展开。', 'Solution is clear and specific. Structure pitch as "problem→solution→impact".'); }
      else if (info.oneLiner && info.desc && info.desc.length > 50) { score = 4; feedback = fb('项目描述较清晰，解决方案明确。建议在Pitch中用"问题→方案→效果"的逻辑展开。', 'Clear description and solution. Structure pitch as "problem→solution→impact".'); }
      else { score = 3; feedback = fb('建议更清晰地说明解决方案的核心创新点，让评委一听就懂。', 'Clarify the core innovation of your solution so judges understand immediately.'); }
      break;
    case 'visual_aid':
      score = 3; feedback = fb('建议准备高质量的演示素材：1-3分钟演示视频、关键流程截图。如果可以，准备一页PPT总结。', 'Prepare high-quality demo materials: 1-3 min demo video, key flow screenshots. Prepare a one-page PPT summary if possible.');
      break;
    case 'tech_explanation':
      if (info.techStack.length > 0) { score = 4; feedback = fb(`技术栈（${info.techStack.slice(0,3).join(' + ')}）清晰。建议用通俗语言解释技术亮点，避免过多术语。`, `Tech stack (${info.techStack.slice(0,3).join(' + ')}) is clear. Explain technical highlights in plain language, avoid jargon.`); }
      else { score = 3; feedback = fb('建议在Pitch中简述技术方案，重点是创新点而非技术清单。', 'Briefly describe tech approach in pitch. Focus on innovations, not a tech list.'); }
      break;
    case 'future_plan':
      score = 3; feedback = fb('建议准备1-2句未来展望：扩展场景、商业化路径、开源计划等。', 'Prepare 1-2 sentences on future outlook: expansion scenarios, commercialization, open-source plans.');
      break;
    case 'qa_ready':
      score = 3; feedback = fb('建议预想评委可能的3个问题：技术难点？竞争对手？商业模式？提前准备好答案。', 'Anticipate 3 likely judge questions: technical challenges? Competitors? Business model? Prepare answers in advance.');
      break;

    default:
      score = 3; feedback = fb('建议关注此项评审标准，提升项目整体质量。', 'Pay attention to this review criterion to improve overall project quality.');
  }

  return { score, feedback };
}

// 渲染带反馈的评审界面
function renderReviewAgentsWithFeedback(feedbacks) {
  const container = $('#reviewAgents');
  container.innerHTML = PITCH_DATA.agents.map(agent => `
    <div class="review-agent" data-agent="${agent.id}">
      <div class="agent-header">
        <span class="agent-icon" style="color:${agent.color}">${agent.icon}</span>
        <div><div class="agent-name">${agent.name}</div><div class="agent-focus">${agent.focus}</div></div>
      </div>
      <div class="agent-criteria" id="criteria-${agent.id}">
        ${agent.criteria.map(c => {
          const rating = AppState.pitch.review.ratings[agent.id]?.[c.id] || 0;
          const fb = feedbacks[agent.id]?.[c.id] || '';
          const scoreColor = rating >= 4 ? 'var(--accent-success)' : rating >= 3 ? 'var(--accent-warning)' : 'var(--accent-danger)';
          return `
          <div class="criterion" data-agent="${agent.id}" data-criterion="${c.id}">
            <div class="criterion-info">
              <span class="criterion-text">${c.text}</span>
              <span class="criterion-weight">${c.weight}分</span>
            </div>
            <div class="criterion-rating">
              ${[0,1,2,3,4,5].map(n => `<button class="rating-btn ${rating === n ? 'active' : ''}" data-rating="${n}">${n}</button>`).join('')}
            </div>
            ${fb ? `<div class="criterion-feedback" style="border-left: 2px solid ${scoreColor};"><span class="feedback-score" style="color:${scoreColor};">${t('pitch.aiScore')} ${rating}/5</span><span class="feedback-text">${fb}</span></div>` : ''}
          </div>
        `}).join('')}
      </div>
    </div>
  `).join('');

  // 绑定评分按钮（允许用户调整AI评分）
  $$('.rating-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const criterion = btn.closest('.criterion');
      const agentId = criterion.dataset.agent;
      const criterionId = criterion.dataset.criterion;
      const rating = parseInt(btn.dataset.rating);

      if (!AppState.pitch.review.ratings[agentId]) AppState.pitch.review.ratings[agentId] = {};
      AppState.pitch.review.ratings[agentId][criterionId] = rating;

      criterion.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 更新反馈中的分数显示
      const fbScore = criterion.querySelector('.feedback-score');
      if (fbScore) {
        const scoreColor = rating >= 4 ? 'var(--accent-success)' : rating >= 3 ? 'var(--accent-warning)' : 'var(--accent-danger)';
        fbScore.textContent = `${t('pitch.aiScore')} ${rating}/5`;
        fbScore.style.color = scoreColor;
        criterion.querySelector('.criterion-feedback').style.borderLeftColor = scoreColor;
      }

      saveState();
      showToast(t('pitch.scoreAdjusted'), 'info');
    });
  });
}

function calculateReviewScore() {
  const ratings = AppState.pitch.review.ratings;
  const hasRatings = Object.keys(ratings).length > 0;

  if (!hasRatings) {
    showToast(t('pitch.warn.noReview'), 'warning');
    return;
  }

  const agentScores = [];
  PITCH_DATA.agents.forEach(agent => {
    if (!ratings[agent.id]) return;
    let earned = 0, total = 0;
    agent.criteria.forEach(c => {
      const rating = ratings[agent.id][c.id] || 0;
      earned += (rating / 5) * c.weight;
      total += c.weight;
    });
    agentScores.push({
      agent,
      score: total > 0 ? Math.round((earned / total) * 100) : 0,
      earned, total
    });
  });

  if (agentScores.length === 0) {
    showToast(t('pitch.warn.noReview'), 'warning');
    return;
  }

  const avgScore = Math.round(agentScores.reduce((s, a) => s + a.score, 0) / agentScores.length);
  AppState.pitch.review.score = avgScore;

  $('#pitchScore').textContent = avgScore;
  $('#navScorePitch').textContent = avgScore;
  $('#reviewResults').style.display = 'block';

  // 雷达图
  renderReviewRadar(agentScores);

  // 各维度评分
  $('#reviewScores').innerHTML = agentScores.map(a => `
    <div class="agent-score-card">
      <div class="agent-score-header">
        <span class="agent-score-icon" style="color:${a.agent.color}">${a.agent.icon}</span>
        <span class="agent-score-name">${a.agent.name}</span>
        <span class="agent-score-value" style="color:${a.score >= 80 ? 'var(--accent-success)' : a.score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)'}">${a.score}</span>
      </div>
      <div class="agent-score-bar"><div class="agent-score-fill" style="width:${a.score}%;background:${a.agent.color}"></div></div>
    </div>
  `).join('');

  // 改进清单
  generateImprovementList(ratings);

  // Meta Judge
  generateMetaJudgeSummary(avgScore, agentScores);

  updateOverallScore();
  saveState();
  showToast(`${t('pitch.success.scored')} ${avgScore}`, 'success');

  $('#reviewResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderReviewRadar(agentScores) {
  const size = 260, cx = size/2, cy = size/2, maxR = 100;
  const n = agentScores.length;
  const angleStep = (Math.PI * 2) / n;

  let points = '';
  let gridPolygons = '';
  let axisLines = '';
  let labels = '';

  // 网格
  [0.2, 0.4, 0.6, 0.8, 1.0].forEach(scale => {
    let polyPoints = '';
    for (let i = 0; i < n; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = cx + Math.cos(angle) * maxR * scale;
      const y = cy + Math.sin(angle) * maxR * scale;
      polyPoints += `${x},${y} `;
    }
    gridPolygons += `<polygon points="${polyPoints}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
  });

  // 轴线和标签
  agentScores.forEach((a, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x = cx + Math.cos(angle) * maxR;
    const y = cy + Math.sin(angle) * maxR;
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;

    const labelX = cx + Math.cos(angle) * (maxR + 25);
    const labelY = cy + Math.sin(angle) * (maxR + 25);
    labels += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="${a.agent.color}" font-size="11" font-weight="600">${a.agent.icon}</text>`;
    labels += `<text x="${labelX}" y="${labelY + 14}" text-anchor="middle" dominant-baseline="middle" fill="rgba(255,255,255,0.6)" font-size="9">${a.score}</text>`;
  });

  // 数据多边形
  let dataPoints = '';
  agentScores.forEach((a, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (a.score / 100) * maxR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    dataPoints += `${x},${y} `;
  });

  $('#reviewRadar').innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="margin:0 auto;display:block">
      ${gridPolygons}
      ${axisLines}
      <polygon points="${dataPoints}" fill="rgba(0,255,163,0.12)" stroke="#00ffa3" stroke-width="2"/>
      ${agentScores.map((a, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const r = (a.score / 100) * maxR;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return `<circle cx="${x}" cy="${y}" r="4" fill="${a.agent.color}"/>`;
      }).join('')}
      ${labels}
    </svg>
  `;
}

function generateImprovementList(ratings) {
  const improvements = [];

  PITCH_DATA.agents.forEach(agent => {
    if (!ratings[agent.id]) return;
    agent.criteria.forEach(c => {
      const rating = ratings[agent.id][c.id] || 0;
      if (rating <= 2) {
        const rule = PITCH_DATA.improvementRules.find(r => r.condition === c.id);
        if (rule) improvements.push({ ...rule, agent: agent.name, icon: agent.icon, criterion: c.text });
      }
    });
  });

  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
  improvements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  if (improvements.length === 0) {
    $('#improvementList').innerHTML = '<div class="no-issues">🎉 所有评分项都达标了！项目状态良好。</div>';
    return;
  }

  const priorityColors = { P0: 'var(--accent-danger)', P1: 'var(--accent-warning)', P2: 'var(--accent-info)', P3: 'var(--muted)' };
  $('#improvementList').innerHTML = improvements.map(imp => `
    <div class="improvement-item" style="border-left-color:${priorityColors[imp.priority]}">
      <div class="improvement-header">
        <span class="improvement-priority" style="background:${priorityColors[imp.priority]}">${imp.priority}</span>
        <span class="improvement-agent">${imp.icon} ${imp.agent}</span>
      </div>
      <div class="improvement-action">${imp.action}</div>
      <div class="improvement-criterion">问题: ${imp.criterion}</div>
    </div>
  `).join('');
}

function generateMetaJudgeSummary(avgScore, agentScores) {
  let summary = '';
  const weakest = [...agentScores].sort((a, b) => a.score - b.score)[0];
  const strongest = [...agentScores].sort((a, b) => b.score - a.score)[0];

  if (avgScore >= 80) {
    summary = `🏆 项目整体表现<strong style="color:var(--accent-success)">优秀</strong>！`;
  } else if (avgScore >= 60) {
    summary = `👍 项目整体表现<strong style="color:var(--accent-warning)">良好</strong>，还有提升空间。`;
  } else {
    summary = `⚠️ 项目整体表现<strong style="color:var(--accent-danger)">需改进</strong>，请关注下方建议。`;
  }

  summary += ` 最强维度是 <strong style="color:${strongest.agent.color}">${strongest.agent.name}</strong>（${strongest.score}分），`;
  summary += `最需关注的是 <strong style="color:${weakest.agent.color}">${weakest.agent.name}</strong>（${weakest.score}分）。`;

  $('#metaJudge').innerHTML = `<div class="meta-judge-card"><span class="meta-judge-icon">🧑‍⚖️</span><div class="meta-judge-text">${summary}</div></div>`;
}
