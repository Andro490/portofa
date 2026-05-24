import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import store from './app/store'
import './index.css'
import { initDB } from './database/indexedDB'

// ✅ تهيئة قاعدة بيانات IndexedDB فور بدء التطبيق
// هذا يضمن إنشاء جميع الـ Stores (auth, settings, cache...) قبل أي عملية قراءة أو كتابة
initDB().catch(console.error);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
