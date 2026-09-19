/**
 * HackCheck 前端功能开关（唯一需要手改的配置文件）。
 *
 * 用法：把对应模块改成 false 即整体隐藏——侧边栏入口、页面区块、
 * 总分计算、导出报告都会跳过它；改回 true 恢复显示，数据不丢失
 * （隐藏期间 localStorage 里的模块数据原样保留）。
 *
 * 模块对应关系：
 *   topic  选题评审      tech   技术选型
 *   dev    代码扫描      demo   Demo辅助
 *   pitch  Pitch生成与AI模拟评审（评审计算量大，默认隐藏）
 *
 * 注意：至少保留一个 true，否则页面没有可显示的模块。
 */
const FEATURES = {
  modules: {
    topic: true,
    tech: true,
    dev: true,
    demo: true,
    pitch: false, // AI 模拟评审资源消耗大，暂时隐藏；需要时改回 true
  },
};

// 查询开关：未配置的模块一律视为启用，保证配置文件缺失/写漏时页面可用
function isModuleEnabled(id) {
  try {
    return FEATURES.modules[id] !== false;
  } catch (e) {
    return true;
  }
}
