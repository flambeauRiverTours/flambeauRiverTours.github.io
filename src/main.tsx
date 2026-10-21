import React from 'react'
import ReactDOM from 'react-dom/client'
//self-hosted, so no visitor's address goes to Google; the weights the site uses
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import App from './App.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
