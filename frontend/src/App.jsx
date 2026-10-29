import { useEffect, useState } from 'react'
import api from './services/api'
import './App.css'

function App() {
  const [status, setStatus] = useState('Carregando...')

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await api.get('/health')
        setStatus(response.data.message)
      } catch {
        setStatus('Falha ao conectar com a API.')
      }
    }

    checkApi()
  }, [])

  return (
    <main className="app-shell">
      <section className="panel">
        <p className="eyebrow">Máquina do Tempo</p>
        <h1>Projeto em segurança reforçada</h1>
        <p>
          O validador, a configuração de ambiente e as conexões com o banco foram ajustados
          para evitar entradas inválidas, vazamento de segredos e exposição de dados sensíveis.
        </p>
        <p aria-live="polite">Status da API: {status}</p>
      </section>
    </main>
  )
}

export default App
