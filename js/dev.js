/**
 * HackCheck - 阶段3: 代码扫描
 */

// ============================================
// 阶段3: 代码扫描
// ============================================
function initDevModule() {
  const zone = $('#uploadZone');
  const input = $('#fileInput');

  zone.addEventListener('click', () => input.click());
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  input.addEventListener('change', (e) => handleFiles(e.target.files));

  $('#clearFilesBtn').addEventListener('click', () => {
    AppState.dev.files = [];
    AppState.dev.scanned = false;
    $('#scannedFiles').style.display = 'none';
    $('#scanResults').style.display = 'none';
    $('#devScore').textContent = '0';
    $('#navScoreDev').textContent = '--';
    updateOverallScore();
    saveState();
  });

  if (AppState.dev.files.length > 0 && AppState.dev.scanned) {
    renderFileList();
    renderScanResults();
  }
}

async function handleFiles(fileList) {
  // 过滤可扫描文件，保留目录路径信息
  const files = Array.from(fileList).filter(f => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    return CODE_SCAN_DATA.scanableExtensions.includes(ext) || f.name === '.gitignore' || f.name === '.env';
  });

  // 过滤掉 node_modules、.git 等不需要扫描的目录
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', '.cache', 'vendor'];
  const filteredFiles = files.filter(f => {
    const relPath = f.webkitRelativePath || f.name;
    return !ignoreDirs.some(d => relPath.includes('/' + d + '/') || relPath.startsWith(d + '/'));
  });

  if (filteredFiles.length === 0) {
    showToast(t('toast.noFiles'), 'warning');
    return;
  }

  showToast(`${t('toast.scanning')} ${filteredFiles.length} ${t('toast.files')}`, 'info');

  const readPromises = filteredFiles.map(f => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({
      name: f.name,
      path: f.webkitRelativePath || f.name, // 保留完整相对路径
      content: e.target.result,
      ext: '.' + f.name.split('.').pop().toLowerCase(),
      size: f.size
    });
    reader.readAsText(f);
  }));

  const readFiles = await Promise.all(readPromises);
  AppState.dev.files = [...AppState.dev.files, ...readFiles];

  // 去重（按路径去重而非文件名）
  const seen = new Set();
  AppState.dev.files = AppState.dev.files.filter(f => {
    const key = f.path || f.name;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  renderFileList();
  scanFiles();
}

function renderFileList() {
  const files = AppState.dev.files;
  if (files.length === 0) {
    $('#scannedFiles').style.display = 'none';
    return;
  }

  $('#scannedFiles').style.display = 'block';
  $('#fileCount').textContent = files.length;

  // 按目录分组显示
  const dirGroups = {};
  files.forEach(f => {
    const path = f.path || f.name;
    const dir = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '(根目录)';
    if (!dirGroups[dir]) dirGroups[dir] = [];
    dirGroups[dir].push(f);
  });

  let html = '';
  Object.keys(dirGroups).sort().forEach(dir => {
    html += `<div class="file-dir-group">`;
    html += `<div class="file-dir-name">📁 ${dir} <span class="file-dir-count">(${dirGroups[dir].length})</span></div>`;
    html += `<div class="file-dir-items">`;
    dirGroups[dir].forEach(f => {
      html += `
        <div class="file-item">
          <span class="file-icon">${getFileIcon(f.ext)}</span>
          <span class="file-name">${f.name}</span>
          <span class="file-size">${(f.size / 1024).toFixed(1)}KB</span>
        </div>
      `;
    });
    html += `</div></div>`;
  });
  $('#fileList').innerHTML = html;
}

function getFileIcon(ext) {
  const icons = { '.js':'📄','.ts':'📄','.jsx':'⚛️','.tsx':'⚛️','.py':'🐍','.java':'☕','.go':'🐹','.env':'🔑','.gitignore':'📋','.json':'📊','.html':'🌐','.css':'🎨','.vue':'💚','.svelte':'🔥' };
  return icons[ext] || '📄';
}

function scanFiles() {
  const files = AppState.dev.files;
  const findings = { secrets: [], gitignore: null, quality: [], sensitive: [] };

  // 1. 扫描硬编码密钥
  files.forEach(file => {
    CODE_SCAN_DATA.secretPatterns.forEach(pattern => {
      const matches = file.content.match(pattern.regex);
      if (matches) {
        const lines = file.content.split('\n');
        const lineNums = [];
        lines.forEach((line, i) => {
          if (pattern.regex.test(line)) lineNums.push(i + 1);
        });
        findings.secrets.push({
          ...pattern,
          fileName: file.path || file.name,
          count: matches.length,
          lineNumbers: lineNums.slice(0, 3)
        });
      }
    });
  });

  // 2. 分析 .gitignore
  const gitignoreFile = files.find(f => f.name === '.gitignore' || f.name.endsWith('.gitignore'));
  if (gitignoreFile) {
    const content = gitignoreFile.content;
    const rules = CODE_SCAN_DATA.gitignoreRules;
    const missingCritical = rules.critical.filter(r => !content.includes(r.pattern));
    const missingImportant = rules.important.filter(r => !content.includes(r.pattern));
    const missingRecommended = rules.recommended.filter(r => !content.includes(r.pattern));
    findings.gitignore = {
      exists: true,
      content,
      missingCritical,
      missingImportant,
      missingRecommended,
      hasEnv: content.includes('.env'),
      hasNodeModules: content.includes('node_modules')
    };
  } else {
    findings.gitignore = {
      exists: false,
      missingCritical: CODE_SCAN_DATA.gitignoreRules.critical,
      missingImportant: CODE_SCAN_DATA.gitignoreRules.important,
      missingRecommended: CODE_SCAN_DATA.gitignoreRules.recommended
    };
  }

  // 3. 代码质量检查
  files.forEach(file => {
    CODE_SCAN_DATA.qualityChecks.forEach(check => {
      if (!check.fileTypes.includes(file.ext)) return;
      const matches = file.content.match(check.regex);
      if (matches) {
        const lines = file.content.split('\n');
        const lineNums = [];
        lines.forEach((line, i) => { if (check.regex.test(line)) lineNums.push(i + 1); });
        findings.quality.push({
          ...check,
          fileName: file.path || file.name,
          count: matches.length,
          lineNumbers: lineNums.slice(0, 3)
        });
      }
    });
  });

  // 4. 敏感文件检测
  files.forEach(file => {
    CODE_SCAN_DATA.sensitiveFiles.forEach(sf => {
      if (sf.pattern.test(file.name)) {
        findings.sensitive.push({ ...sf, fileName: file.path || file.name });
      }
    });
  });

  AppState.dev.findings = findings;
  AppState.dev.scanned = true;

  // 计算安全评分
  let score = 100;
  findings.secrets.forEach(s => { score -= s.severity === 'critical' ? 20 : 10; });
  if (!findings.gitignore.exists) score -= 30;
  else {
    findings.gitignore.missingCritical.forEach(() => score -= 10);
    findings.gitignore.missingImportant.forEach(() => score -= 3);
  }
  findings.sensitive.forEach(s => { score -= s.severity === 'critical' ? 15 : 8; });
  findings.quality.forEach(q => { score -= q.severity === 'medium' ? 5 : 2; });
  score = clamp(score, 0, 100);

  AppState.dev.score = score;
  $('#devScore').textContent = score;
  $('#navScoreDev').textContent = score;
  const scoreEl = $('#devScore');
  scoreEl.style.color = score >= 80 ? 'var(--accent-success)' : score >= 50 ? 'var(--accent-warning)' : 'var(--accent-danger)';

  renderScanResults();
  updateOverallScore();
  saveState();

  const totalIssues = findings.secrets.length + findings.sensitive.length + (findings.gitignore.exists ? findings.gitignore.missingCritical.length + findings.gitignore.missingImportant.length : 1) + findings.quality.length;
  showToast(`${t('toast.scanDone')} ${totalIssues} ${t('toast.issues')}`, totalIssues > 0 ? 'warning' : 'success');
}

function renderScanResults() {
  const f = AppState.dev.findings;
  $('#scanResults').style.display = 'block';

  // 摘要
  const totalCritical = f.secrets.filter(s => s.severity === 'critical').length + f.sensitive.filter(s => s.severity === 'critical').length;
  const totalHigh = f.secrets.filter(s => s.severity === 'high').length;
  const totalMedium = f.quality.filter(q => q.severity === 'medium').length;
  const totalLow = f.quality.filter(q => q.severity === 'low').length;
  const gitignoreMissing = f.gitignore.exists ? f.gitignore.missingCritical.length + f.gitignore.missingImportant.length : '缺失';

  $('#scanSummary').innerHTML = `
    <div class="scan-summary-grid">
      <div class="summary-stat critical ${totalCritical > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalCritical}</div><div class="stat-label">严重问题</div></div>
      <div class="summary-stat high ${totalHigh > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalHigh}</div><div class="stat-label">高危问题</div></div>
      <div class="summary-stat medium ${totalMedium > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalMedium}</div><div class="stat-label">中危问题</div></div>
      <div class="summary-stat low ${totalLow > 0 ? 'has-issues' : ''}"><div class="stat-num">${totalLow}</div><div class="stat-label">低危问题</div></div>
      <div class="summary-stat ${gitignoreMissing !== 0 ? 'has-issues' : ''}"><div class="stat-num">${gitignoreMissing}</div><div class="stat-label">Gitignore缺失项</div></div>
    </div>
  `;

  // 密钥检测
  if (f.secrets.length > 0) {
    $('#secretSection').style.display = 'block';
    $('#secretFindings').innerHTML = f.secrets.map(s => `
      <div class="finding-item ${s.severity}">
        <div class="finding-header"><span class="finding-severity">${s.severity === 'critical' ? '🔴 严重' : '🟠 高危'}</span><strong>${s.name}</strong></div>
        <div class="finding-detail"><span class="finding-file">📁 ${s.fileName}</span><span class="finding-lines">行 ${s.lineNumbers.join(', ')}</span><span class="finding-count">出现 ${s.count} 次</span></div>
        <p class="finding-desc">${s.desc}</p>
      </div>
    `).join('');
  } else {
    $('#secretSection').style.display = 'block';
    $('#secretFindings').innerHTML = '<div class="no-issues">✅ 未检测到硬编码密钥</div>';
  }

  // Gitignore
  $('#gitignoreSection').style.display = 'block';
  if (!f.gitignore.exists) {
    $('#gitignoreFindings').innerHTML = `
      <div class="finding-item critical">
        <div class="finding-header"><span class="finding-severity">🔴 严重</span><strong>.gitignore 文件缺失</strong></div>
        <p class="finding-desc">项目根目录未找到 .gitignore 文件！强烈建议创建，防止敏感文件和构建产物被提交到仓库。</p>
      </div>
      <div class="gitignore-suggest">
        <strong>建议添加以下内容到 .gitignore：</strong>
        <pre>${[...CODE_SCAN_DATA.gitignoreRules.critical, ...CODE_SCAN_DATA.gitignoreRules.important].map(r => r.pattern).join('\n')}</pre>
      </div>
    `;
  } else {
    let giHTML = '<div class="finding-item low"><div class="finding-header"><span class="finding-severity">✅ 已检测</span><strong>.gitignore 文件存在</strong></div></div>';
    if (f.gitignore.missingCritical.length > 0) {
      giHTML += f.gitignore.missingCritical.map(r => `
        <div class="finding-item critical"><div class="finding-header"><span class="finding-severity">🔴 严重</span><strong>缺少: ${r.pattern}</strong></div><p class="finding-desc">${r.desc} - ${r.reason}</p></div>
      `).join('');
    }
    if (f.gitignore.missingImportant.length > 0) {
      giHTML += f.gitignore.missingImportant.map(r => `
        <div class="finding-item medium"><div class="finding-header"><span class="finding-severity">🟡 中危</span><strong>建议添加: ${r.pattern}</strong></div><p class="finding-desc">${r.desc} - ${r.reason}</p></div>
      `).join('');
    }
    if (f.gitignore.missingRecommended.length > 0) {
      giHTML += '<div class="gitignore-suggest"><strong>可选优化项：</strong><ul>';
      giHTML += f.gitignore.missingRecommended.map(r => `<li><code>${r.pattern}</code> - ${r.desc}</li>`).join('');
      giHTML += '</ul></div>';
    }
    $('#gitignoreFindings').innerHTML = giHTML;
  }

  // 代码质量
  if (f.quality.length > 0) {
    $('#qualitySection').style.display = 'block';
    $('#qualityFindings').innerHTML = f.quality.map(q => `
      <div class="finding-item ${q.severity}">
        <div class="finding-header"><span class="finding-severity">${q.severity === 'medium' ? '🟡 中危' : '🔵 低危'}</span><strong>${q.name}</strong></div>
        <div class="finding-detail"><span class="finding-file">📁 ${q.fileName}</span><span class="finding-count">出现 ${q.count} 次</span></div>
        <p class="finding-desc">${q.desc}</p>
      </div>
    `).join('');
  } else {
    $('#qualitySection').style.display = 'block';
    $('#qualityFindings').innerHTML = '<div class="no-issues">✅ 代码质量良好，未发现问题</div>';
  }

  // 敏感文件
  if (f.sensitive.length > 0) {
    $('#sensitiveFileSection').style.display = 'block';
    $('#sensitiveFileFindings').innerHTML = f.sensitive.map(s => `
      <div class="finding-item ${s.severity}">
        <div class="finding-header"><span class="finding-severity">${s.severity === 'critical' ? '🔴 严重' : '🟠 高危'}</span><strong>${s.fileName}</strong></div>
        <p class="finding-desc">${s.desc}</p>
      </div>
    `).join('');
  } else {
    $('#sensitiveFileSection').style.display = 'block';
    $('#sensitiveFileFindings').innerHTML = '<div class="no-issues">✅ 未检测到敏感文件</div>';
  }

  // 修复建议
  let fixesHTML = '<div class="fixes-card"><h4>🔧 修复建议</h4><ol>';
  if (f.secrets.filter(s => s.severity === 'critical').length > 0) {
    fixesHTML += '<li><strong>立即更换所有泄露的API密钥！</strong>泄露的密钥可能已被公开，必须到对应平台重新生成。</li>';
  }
  if (!f.gitignore.exists || f.gitignore.missingCritical.length > 0) {
    fixesHTML += '<li><strong>创建/完善 .gitignore 文件</strong>，确保 .env、*.pem、*.key 等敏感文件不被提交。</li>';
  }
  if (f.sensitive.length > 0) {
    fixesHTML += '<li><strong>从仓库中移除敏感文件</strong>（.env、credentials.json等），使用 .env.example 模板代替。</li>';
  }
  if (f.secrets.filter(s => s.severity === 'high').length > 0) {
    fixesHTML += '<li>将所有硬编码的密钥和密码迁移到<strong>环境变量</strong>中，使用 dotenv 或 os.environ 读取。</li>';
  }
  if (f.quality.filter(q => q.severity === 'medium').length > 0) {
    fixesHTML += '<li>移除所有 <code>debugger</code> 语句和 <code>alert()</code> 调用。</li>';
  }
  if (f.quality.filter(q => q.severity === 'low').length > 0) {
    fixesHTML += '<li>清理 <code>console.log</code>、<code>print()</code> 等调试输出和 TODO 注释。</li>';
  }
  if (f.gitignore.exists && f.gitignore.missingRecommended.length > 0) {
    fixesHTML += '<li>在 .gitignore 中添加推荐的忽略规则（.vscode、*.log等）。</li>';
  }
  fixesHTML += '</ol></div>';
  $('#scanFixes').innerHTML = fixesHTML;
}
