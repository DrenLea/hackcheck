/**
 * HackCheck - 阶段4: Demo辅助（Git教程、部署推荐）
 */

// ============================================
// 阶段4: Demo辅助
// ============================================
function initDemoModule() {
  // 渲染Git教程
  renderGitTutorial();

  // 填充手动选择下拉框
  const select = $('#manualProjectType');
  DEPLOY_DATA.projectTypes.forEach(pt => {
    const opt = document.createElement('option');
    opt.value = pt.id;
    opt.textContent = `${pt.icon} ${pt.name}`;
    select.appendChild(opt);
  });

  // 文件上传
  const zone = $('#packageUploadZone');
  const input = $('#packageFileInput');
  zone.addEventListener('click', () => input.click());
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) detectFromPackageFile(file);
  });

  // 手动选择
  select.addEventListener('change', (e) => {
    const typeId = e.target.value;
    if (typeId) {
      const pt = DEPLOY_DATA.projectTypes.find(p => p.id === typeId);
      if (pt) showDeployRecommendations(pt);
    }
  });

  // 恢复状态
  if (AppState.demo.projectType) {
    const pt = DEPLOY_DATA.projectTypes.find(p => p.id === AppState.demo.projectType);
    if (pt) showDeployRecommendations(pt);
  }
}

function renderGitTutorial() {
  const steps = [
    {
      title: '安装 Git',
      icon: '📥',
      desc: '如果还没有安装Git，从官网下载安装',
      commands: [
        { cmd: 'git --version', comment: '检查Git是否已安装' },
      ],
      link: { url: 'https://git-scm.com/downloads', text: '下载 Git' }
    },
    {
      title: '初始化本地仓库',
      icon: '🔧',
      desc: '在项目根目录下初始化Git仓库',
      commands: [
        { cmd: 'cd your-project-folder', comment: '进入项目目录' },
        { cmd: 'git init', comment: '初始化Git仓库' },
        { cmd: 'git add .', comment: '添加所有文件到暂存区' },
        { cmd: 'git commit -m "Initial commit"', comment: '提交初始代码' },
      ]
    },
    {
      title: '创建 .gitignore（重要！）',
      icon: '🚫',
      desc: '避免将敏感文件、依赖包等上传到GitHub',
      commands: [
        { cmd: '# 创建 .gitignore 文件，添加以下内容：', comment: '' },
        { cmd: 'node_modules/\n.env\n*.key\n*.pem\n.DS_Store\ndist/\nbuild/', comment: '常见需要忽略的文件' },
      ],
      tips: [
        '千万不要上传 .env 文件（包含API密钥）',
        'node_modules/ 体积巨大，必须忽略',
        '在代码扫描模块检查你的 .gitignore 是否完善'
      ]
    },
    {
      title: '在 GitHub 创建仓库',
      icon: '🌐',
      desc: '登录GitHub，创建一个新的仓库',
      commands: [],
      link: { url: 'https://github.com/new', text: '前往 GitHub 创建仓库' },
      tips: [
        '仓库名建议用项目英文名，如 hackathon-medication-reminder',
        '不要勾选 "Add a README" （本地已有代码时）',
        '选择 Public 让评委可以查看'
      ]
    },
    {
      title: '关联远程仓库并推送',
      icon: '🚀',
      desc: '将本地代码推送到GitHub',
      commands: [
        { cmd: 'git remote add origin https://github.com/你的用户名/你的仓库名.git', comment: '关联远程仓库' },
        { cmd: 'git branch -M main', comment: '将分支重命名为main' },
        { cmd: 'git push -u origin main', comment: '推送代码到GitHub' },
      ],
      tips: [
        '首次推送需要GitHub认证（使用Token或SSH Key）',
        '如果报错 "failed to push"，先运行 git pull origin main --allow-unrelated-histories'
      ]
    },
    {
      title: '后续开发中的版本管理',
      icon: '🔄',
      desc: '每次完成一个功能就提交一次，保持提交历史清晰',
      commands: [
        { cmd: 'git add .', comment: '添加修改的文件' },
        { cmd: 'git commit -m "feat: 添加了XX功能"', comment: '提交（用feat/fix/docs前缀）' },
        { cmd: 'git push', comment: '推送到GitHub' },
      ],
      tips: [
        '提交信息规范：feat:新功能 / fix:修复 / docs:文档 / refactor:重构',
        '黑客松中至少每2小时提交一次，防止代码丢失',
        '可以用 git log --oneline 查看提交历史'
      ]
    },
  ];

  $('#gitSteps').innerHTML = steps.map((step, i) => `
    <div class="git-step-card">
      <div class="git-step-header">
        <span class="git-step-num">${i + 1}</span>
        <span class="git-step-icon">${step.icon}</span>
        <span class="git-step-title">${step.title}</span>
      </div>
      <p class="git-step-desc">${step.desc}</p>
      ${step.commands.length > 0 ? `
        <div class="git-commands">
          ${step.commands.map(c => `
            <div class="git-command">
              <code class="git-cmd-text">${escapeHtml(c.cmd)}</code>
              ${c.comment ? `<span class="git-cmd-comment">${c.comment}</span>` : ''}
              <button class="btn btn-ghost btn-sm copy-cmd" data-cmd="${btoa(unescape(encodeURIComponent(c.cmd)))}">📋</button>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${step.tips ? `<div class="git-step-tips"><ul>${step.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      ${step.link ? `<a href="${step.link.url}" target="_blank" class="git-step-link">🔗 ${step.link.text} →</a>` : ''}
    </div>
  `).join('');

  // 绑定复制按钮
  $$('.copy-cmd').forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = decodeURIComponent(escape(atob(btn.dataset.cmd)));
      navigator.clipboard.writeText(cmd).then(() => showToast('命令已复制', 'success'));
    });
  });
}

function detectFromPackageFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    let detectedType = null;

    if (file.name === 'package.json' || file.name.endsWith('.json')) {
      try {
        const pkg = JSON.parse(content);
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        for (const pt of DEPLOY_DATA.projectTypes) {
          if (pt.detect.packageDeps && pt.detect.packageDeps.every(d => deps[d])) {
            detectedType = pt;
            break;
          }
        }
      } catch(e) {}
    } else if (file.name === 'requirements.txt' || file.name.endsWith('.txt')) {
      for (const pt of DEPLOY_DATA.projectTypes) {
        if (pt.detect.pyDeps && pt.detect.pyDeps.some(d => content.toLowerCase().includes(d))) {
          detectedType = pt;
          break;
        }
      }
    }

    if (detectedType) {
      showToast(`检测到项目类型: ${detectedType.name}`, 'success');
      showDeployRecommendations(detectedType);
    } else {
      showToast('无法自动检测项目类型，请手动选择', 'warning');
    }
  };
  reader.readAsText(file);
}

function showDeployRecommendations(projectType) {
  AppState.demo.projectType = projectType.id;
  AppState.demo.detected = true;
  saveState();

  // 显示检测结果
  $('#detectedType').style.display = 'block';
  $('#detectedType').innerHTML = `
    <div class="detected-type-card">
      <span class="detected-icon">${projectType.icon}</span>
      <div><div class="detected-name">${projectType.name}</div><div class="detected-desc">${projectType.desc}</div></div>
    </div>
  `;

  // 推荐平台
  const platforms = projectType.platforms.map(id => DEPLOY_DATA.platforms.find(p => p.id === id)).filter(Boolean);
  $('#deployRecommendations').style.display = 'block';
  $('#platformGrid').innerHTML = platforms.map((p, i) => `
    <div class="platform-card ${i === 0 ? 'recommended' : ''}" data-platform="${p.id}">
      ${i === 0 ? '<div class="recommended-badge">⭐ 推荐</div>' : ''}
      <div class="platform-card-header"><span class="platform-card-icon">${p.icon}</span><span class="platform-card-name">${p.name}</span></div>
      <p class="platform-card-desc">${p.desc}</p>
      <div class="platform-card-meta">
        <span>🔗 ${p.url}</span>
        ${p.deployCmd ? `<span>💻 ${p.deployCmd}</span>` : ''}
      </div>
      <button class="btn btn-primary btn-sm view-steps" data-platform-id="${p.id}">查看部署步骤</button>
    </div>
  `).join('');

  // 绑定查看步骤
  $$('.view-steps').forEach(btn => {
    btn.addEventListener('click', () => {
      const platformId = btn.dataset.platformId;
      showDeploySteps(platformId);
    });
  });

  // 默认显示第一个平台的步骤
  if (platforms.length > 0) showDeploySteps(platforms[0].id);

  $('#navScoreDemo').textContent = '✓';
  updateOverallScore();
  showToast('部署方案已生成！', 'success');
}

function showDeploySteps(platformId) {
  const platform = DEPLOY_DATA.platforms.find(p => p.id === platformId);
  if (!platform) return;

  $('#deployStepsSection').style.display = 'block';
  $('#deploySteps').innerHTML = `
    <div class="steps-header">
      <span class="steps-platform-icon">${platform.icon}</span>
      <span class="steps-platform-name">${platform.name} 部署步骤</span>
    </div>
    <div class="steps-prereq">📋 前置条件: ${platform.prereq}</div>
    <ol class="steps-list">
      ${platform.steps.map(s => `<li>${s}</li>`).join('')}
    </ol>
    ${platform.tips ? `<div class="steps-tips"><strong>💡 小贴士</strong><ul>${platform.tips.map(t => `<li>${t}</li>`).join('')}</ul></div>` : ''}
  `;

  // 配置文件
  $('#configGenSection').style.display = 'block';
  if (platform.configFile) {
    $('#configGen').innerHTML = `
      <div class="config-file-card">
        <div class="config-file-header">
          <span class="config-file-name">📄 ${platform.configFile.name}</span>
          <button class="btn btn-ghost btn-sm copy-config" data-config="${btoa(platform.configFile.content)}">📋 复制</button>
        </div>
        <pre class="config-file-content">${escapeHtml(platform.configFile.content)}</pre>
      </div>
    `;
    $('.copy-config').addEventListener('click', (e) => {
      const content = atob(e.target.dataset.config);
      navigator.clipboard.writeText(content).then(() => showToast('配置已复制到剪贴板', 'success'));
    });
  } else {
    $('#configGen').innerHTML = '<div class="no-config">该平台无需额外配置文件，按照上方步骤操作即可。</div>';
  }
}
