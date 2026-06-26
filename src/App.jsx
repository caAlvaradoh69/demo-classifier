import React, { useState } from 'react'
import './App.css'

function App() {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)

  const handleValidar = async () => {
    if (texto.trim() === '') {
      setResultado({ tipo: 'error', mensaje: 'Por favor ingresa texto' })
      return
    }

    setCargando(true)
    try {
      const response = await fetch('https://m9lexwoc14.execute-api.us-east-1.amazonaws.com/prod/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: texto }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      let categoria = ''

      if (typeof data.body === 'string') {
        try {
          const parsed = JSON.parse(data.body)
          categoria = parsed.categoria || parsed.category || data.body
        } catch {
          categoria = data.body
        }
      } else if (data.body && typeof data.body === 'object') {
        categoria = data.body.categoria || data.body.category || JSON.stringify(data.body)
      } else {
        categoria = String(data.body)
      }

      setResultado({ 
        tipo: 'exito', 
        mensaje: categoria,
        datos: data
      })
    } catch (error) {
      setResultado({ 
        tipo: 'error', 
        mensaje: `Error en la validación: ${error.message}` 
      })
    } finally {
      setCargando(false)
    }
  }

  const handleLimpiar = () => {
    setTexto('')
    setResultado(null)
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Validador de Texto</h1>
        
        <div className="input-group">
          <label htmlFor="texto-input">Ingresa tu texto:</label>
          <input
            id="texto-input"
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe algo aquí..."
            onKeyPress={(e) => e.key === 'Enter' && !cargando && handleValidar()}
            disabled={cargando}
          />
        </div>

        <div className="button-group">
          <button 
            onClick={handleValidar} 
            className="btn-validar"
            disabled={cargando}
          >
            {cargando ? 'Validando...' : 'Validar'}
          </button>
          <button 
            onClick={handleLimpiar} 
            className="btn-limpiar"
            disabled={cargando}
          >
            Limpiar
          </button>
        </div>

        {resultado && (
          <div className={`resultado ${resultado.tipo}`}>
            {resultado.mensaje}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
