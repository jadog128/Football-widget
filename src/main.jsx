import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import CustomizerApp from './components/CustomizerApp'
import './styles/index.css'

const container = document.getElementById('root')
const root = createRoot(container)

const isCustomizer = window.location.hash === '#customizer';

root.render(
  <React.StrictMode>
    {isCustomizer ? <CustomizerApp /> : <App />}
  </React.StrictMode>
)
