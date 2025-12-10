import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [phase, setPhase] = useState('categories')
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [loading, setLoading] = useState(false)

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

  async function loadQuestion(id) {
    setLoading(true)
    setSelectedAnswer(null)
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

  async function markAsUsed(id) {
    await supabase
      .from('questions')
      .update({ used: true })
      .eq('id', id)
    
    loadQuestions(currentCategory)
    setPhase('numbers')
  }

  function handleAnswerClick(option) {
    setSelectedAnswer(option)
  }

   function getButtonStyle(option) {
    if (!selectedAnswer) {
      return { background: '#646cff' }
    }
    
    const correctAnswer = currentQuestion.correct_option.toUpperCase().trim()
    const selectedUpper = selectedAnswer.toUpperCase().trim()
    const optionUpper = option.toUpperCase().trim()
    
    if (optionUpper === correctAnswer) {
      return { background: '#4ade80', color: 'white' }
    }
    
    if (optionUpper === selectedUpper && optionUpper !== correctAnswer) {
      return { background: '#ef4444', color: 'white' }
    }
    
    return { background: '#333', opacity: 0.5 }
  }


  if (loading) return <div><h1>Carregando...</h1></div>

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

  if (phase === 'question' && currentQuestion) {
    return (
      <div>
        <h2>Pergunta {currentQuestion.question_number}</h2>
        <button onClick={() => setPhase('numbers')}>← Voltar para Números</button>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>{currentQuestion.question}</h3>
          
          <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button 
              onClick={() => handleAnswerClick('A')}
              style={getButtonStyle('A')}
              disabled={selectedAnswer !== null}
            >
              <strong>A)</strong> {currentQuestion.option_a}
            </button>
            
            <button 
              onClick={() => handleAnswerClick('B')}
              style={getButtonStyle('B')}
              disabled={selectedAnswer !== null}
            >
              <strong>B)</strong> {currentQuestion.option_b}
            </button>
            
            <button 
              onClick={() => handleAnswerClick('C')}
              style={getButtonStyle('C')}
              disabled={selectedAnswer !== null}
            >
              <strong>C)</strong> {currentQuestion.option_c}
            </button>
            
            <button 
              onClick={() => handleAnswerClick('D')}
              style={getButtonStyle('D')}
              disabled={selectedAnswer !== null}
            >
              <strong>D)</strong> {currentQuestion.option_d}
            </button>
          </div>

          {selectedAnswer && (
            <button 
              onClick={() => markAsUsed(currentQuestion.id)}
              style={{ marginTop: '2rem', background: '#4ade80' }}
            >
              ✓ Marcar como Usada
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
}

export default App
