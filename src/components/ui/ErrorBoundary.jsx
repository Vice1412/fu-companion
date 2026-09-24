import React from 'react';
import { GiHazardSign, GiSparkles, GiBookAura } from 'react-icons/gi';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FU Companion Caught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetCache = () => {
    try {
      localStorage.removeItem('fu_companion_active_combat');
      // Keep characters and NPCs unless user explicitly wants to purge, but fix any corrupted active view
      window.location.href = window.location.origin + window.location.pathname;
    } catch (e) {
      window.location.reload();
    }
  };

  handleHardReset = () => {
    if (window.confirm('確定要清除所有暫存並恢復預設狀態嗎？（建議先匯出備份）')) {
      try {
        localStorage.clear();
      } catch (e) {}
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.toString() || '未知運行時錯誤';
      const errorStack = this.state.errorInfo?.componentStack || this.state.error?.stack || '';

      return (
        <div className="min-h-screen bg-[#f5efdf] text-[#2c221e] flex items-center justify-center p-4 selection:bg-amber-200">
          <div className="max-w-lg w-full bg-[#fffdfa] border-2 border-[#c5b59a] rounded-2xl shadow-2xl p-6 sm:p-8 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
              <GiHazardSign className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h1 className="font-serif font-black text-2xl tracking-wide text-[#2c221e]">
                冒險儀表遭遇了阻礙
              </h1>
              <p className="text-xs text-[#705e4d] leading-relaxed">
                系統在渲染畫面時捕捉到了例外錯誤。不用擔心，您的角色存檔均安全保存在本機中。
              </p>
            </div>

            {/* Error Message Snippet */}
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-left font-mono text-xs text-rose-900 break-words">
              <span className="font-bold block text-[11px] text-rose-700 font-sans mb-0.5">錯誤資訊：</span>
              <span>{errorMsg}</span>
            </div>

            {/* Recovery Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-serif font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <GiSparkles className="w-4 h-4" />
                <span>重新整理頁面</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-amber-50 border border-[#c5b59a] text-slate-700 font-serif font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <GiBookAura className="w-4 h-4" />
                <span>修復暫存並重載</span>
              </button>
            </div>

            {/* Collapsible Stack Trace */}
            {errorStack && (
              <details className="text-left pt-2 border-t border-[#e2d8c3]">
                <summary className="text-[11px] text-slate-500 font-mono cursor-pointer hover:text-slate-800 transition-colors">
                  展開技術調試追蹤
                </summary>
                <pre className="mt-2 p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                  {errorStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
