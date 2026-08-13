import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', message, source, lineno, colno, error)
  document.getElementById('root')!.innerHTML = `<div style="color:red;padding:20px;">Error: ${message}</div>`
  return true
}

window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled rejection:', event.reason)
  document.getElementById('root')!.innerHTML = `<div style="color:red;padding:20px;">Promise Error: ${event.reason}</div>`
})

console.log('App starting... API_BASE:', '/hrbp-job-intelligence/api')

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </StrictMode>,
  )
} catch (e) {
  console.error('Render error:', e)
  document.getElementById('root')!.innerHTML = `<div style="color:red;padding:20px;">Render Error: ${e}</div>`
}
