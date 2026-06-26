import React, { useState } from 'react'
import './App.css'

function App() {
  const [vista, setVista] = useState('simple')
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState(null)
  const [resultadoMultiple, setResultadoMultiple] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [inputs, setInputs] = useState([{ id: 0, value: '' }])
  const [nextInputId, setNextInputId] = useState(1)

  const parseCategoria = async (texto) => {
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

    return { tipo: 'exito', mensaje: categoria, datos: data }
  }

  const handleValidarSimple = async () => {
    if (texto.trim() === '') {
      setResultado({ tipo: 'error', mensaje: 'Por favor ingresa texto' })
      return
    }

    setCargando(true)
    setResultado(null)

    try {
      const data = await parseCategoria(texto)
      setResultado(data)
    } catch (error) {
      setResultado({ tipo: 'error', mensaje: `Error en la validación: ${error.message}` })
    } finally {
      setCargando(false)
    }
  }

  const handleValidarMultiple = async () => {
    const textosValidos = inputs.map((input) => input.value.trim())
    if (textosValidos.every((item) => item === '')) {
      setResultadoMultiple({ tipo: 'error', mensaje: 'Agrega al menos un texto para validar.' })
      return
    }

    setCargando(true)
    setResultadoMultiple(null)

    const resultados = await Promise.all(textosValidos.map(async (item, index) => {
      if (item === '') {
        return { index, input: '', tipo: 'error', mensaje: 'Este campo está vacío' }
      }

      try {
        const response = await parseCategoria(item)
        return { index, input: item, ...response }
      } catch (error) {
        return { index, input: item, tipo: 'error', mensaje: `Error: ${error.message}` }
      }
    }))

    setResultadoMultiple({ tipo: 'exito', resultados })
    setCargando(false)
  }

  const handleLimpiarSimple = () => {
    setTexto('')
    setResultado(null)
  }

  const handleLimpiarMultiple = () => {
    setInputs([{ id: 0, value: '' }])
    setNextInputId(1)
    setResultadoMultiple(null)
  }

  const handleAddInput = () => {
    setInputs((prev) => [...prev, { id: nextInputId, value: '' }])
    setNextInputId((prev) => prev + 1)
  }

  const handleChangeInput = (id, value) => {
    setInputs((prev) => prev.map((item) => (item.id === id ? { ...item, value } : item)))
  }

  const handleRemoveInput = (id) => {
    setInputs((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="app">
      <div className="container">
        <h1>Validador de Texto</h1>

        <div className="view-toggle">
          <button
            type="button"
            className={vista === 'simple' ? 'active' : ''}
            onClick={() => setVista('simple')}
          >
            Vista simple
          </button>
          <button
            type="button"
            className={vista === 'multiple' ? 'active' : ''}
            onClick={() => setVista('multiple')}
          >
            Vista múltiple
          </button>
        </div>

        {vista === 'simple' ? (
          <>
            <div className="input-group">
              <label htmlFor="texto-input">Ingresa tu texto:</label>
              <input
                id="texto-input"
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe algo aquí..."
                onKeyPress={(e) => e.key === 'Enter' && !cargando && handleValidarSimple()}
                disabled={cargando}
              />
            </div>

            <div className="button-group">
              <button
                onClick={handleValidarSimple}
                className="btn-validar"
                disabled={cargando}
              >
                {cargando ? 'Validando...' : 'Validar'}
              </button>
              <button
                onClick={handleLimpiarSimple}
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
          </>
        ) : (
          <>
            <div className="inputs-list">
              {inputs.map((input, index) => (
                <div className="input-row" key={input.id}>
                  <input
                    type="text"
                    value={input.value}
                    placeholder={`Texto ${index + 1}`}
                    onChange={(e) => handleChangeInput(input.id, e.target.value)}
                    disabled={cargando}
                  />
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleRemoveInput(input.id)}
                    disabled={cargando || inputs.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="actions-row">
              <button
                type="button"
                className="btn-add"
                onClick={handleAddInput}
                disabled={cargando}
              >
                + Agregar input
              </button>
            </div>

            <div className="button-group">
              <button
                onClick={handleValidarMultiple}
                className="btn-validar"
                disabled={cargando}
              >
                {cargando ? 'Validando...' : 'Validar todos'}
              </button>
              <button
                onClick={handleLimpiarMultiple}
                className="btn-limpiar"
                disabled={cargando}
              >
                Limpiar
              </button>
            </div>

            {resultadoMultiple && resultadoMultiple.tipo === 'error' && (
              <div className="resultado error">
                {resultadoMultiple.mensaje}
              </div>
            )}

            {resultadoMultiple && resultadoMultiple.resultados && (
              <div className="resultado-multiple">
                {resultadoMultiple.resultados.map((item) => (
                  <div key={item.index} className={`resultado-item ${item.tipo}`}>
                    <div className="resultado-item-title">Texto {item.index + 1}</div>
                    <div>{item.mensaje}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
