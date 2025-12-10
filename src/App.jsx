import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [phase, setPhase] = useState('categories') // 'categories' | 'numbers' | 'question'
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [loading, setLoading] = useState(false)

  // Carregar categorias
  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('theme')
      .order('theme')
    
    if (!error && data) {
      const unique = [...new Set(data.map(q => q.theme))]
      setCategories(unique)
    }
    setLoading(false)
  }

  // Carregar perguntas da categoria
  async function loadQuestions(theme) {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('id, question_number, used')
      .eq('theme', theme)
      .order('question_number')
    
    if (!error && data) {
      setQuestions(data)
      setCurrentCategory(theme)
      setPhase('numbers')
    }
    setLoading(false)
  }

  // Carregar pergunta específica
  async function loadQuestion(id) {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (!error && data) {
      setCurrentQuestion(data)
      setPhase('question')
    }
    setLoading(false)
  }

  // Marcar pergunta como usada
  async function markAsUsed(id) {
    await supabase
      .from('questions')
      .update({ used: true })
      .eq('id', id)
    
    // Recarregar perguntas da categoria
    loadQuestions(currentCategory)
    setPhase('numbers')
  }

  if (loading) return <div><h1>Carregando...</h1></div>

  // Tela de categorias
  if (phase === 'categories') {
    return (
      <div>
        <h1>Escolha uma Categoria</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => loadQuestions(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Tela de números 1-30
  if (phase === 'numbers') {
    return (
      <div>
        <h1>{currentCategory}</h1>
        <button onClick={() => setPhase('categories')}>← Voltar para Categorias</button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem', marginTop: '2rem' }}>
          {questions.map(q => (
            <button
              key={q.id}
              onClick={() => loadQuestion(q.id)}
              disabled={q.used}
              style={{ 
                background: q.used ? '#333' : '#646cff',
                textDecoration: q.used ? 'line-through' : 'none'
              }}
            >
              {q.question_number}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Tela da pergunta
  if (phase === 'question' && currentQuestion) {
    return (
      <div>
        <h2>Pergunta {currentQuestion.question_number}</h2>
        <button onClick={() => setPhase('numbers')}>← Voltar para Números</button>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>{currentQuestion.question}</h3>
          
          <div style={{ marginTop: '2rem' }}>
            <p><strong>A)</strong> {currentQuestion.option_a}</p>
            <p><strong>B)</strong> {currentQuestion.option_b}</p>
            <p><strong>C)</strong> {currentQuestion.option_c}</p>
            <p><strong>D)</strong> {currentQuestion.option_d}</p>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: '#2a2a2a', borderRadius: '8px' }}>
            <p><strong>Resposta correta:</strong> {currentQuestion.correct_option}</p>
          </div>

          <button 
            onClick={() => markAsUsed(currentQuestion.id)}
            style={{ marginTop: '2rem', background: '#4ade80' }}
          >
            ✓ Marcar como Usada
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default App

