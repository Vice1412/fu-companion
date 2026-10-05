import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ui/ErrorBoundary.jsx';
import { migrateLegacyStorage } from './data/store';
import './index.css';

// 一次性舊鍵遷移，必須在任何元件讀取儲存之前完成。
// 目前的內容：把 NPC 檔案庫從舊鍵 `fabula-npc-library-v2` 搬到權威鍵。
// 遷移本身冪等且不刪除舊鍵，因此可安全重複執行。
migrateLegacyStorage();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
