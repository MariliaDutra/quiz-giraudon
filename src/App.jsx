import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {
  const [phase, setPhase] = useState("categories");
  const [showRules, setShowRules] = useState(true);
  const [categories, setCategories] = useState([]);
  const [raffleCategories, setRaffleCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [correctAnswered, setCorrectAnswered] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    setLoading(true);

    const { data, error } = await supabase
      .from("questions")
      .select("theme")
      .order("theme");

    if (error) {
      console.error("Erro ao carregar categorias:", error);
      setLoading(false);
      return;
    }

    if (data) {
      const unique = [...new Set(data.map((q) => q.theme))];

      const kidsLabel = "Kids e Disney";
      const other = unique.filter((c) => c !== kidsLabel);
      const ordered = [...other, kidsLabel];

      setCategories(ordered);

      const raffle = ordered.filter((c) => c && c !== kidsLabel);
      setRaffleCategories(raffle);
    }

    setLoading(false);
  }

  async function loadQuestions(theme) {
    setLoading(true);
    const { data, error } = await supabase
      .from("questions")
      .select("id, question_number, used")
      .eq("theme", theme)
      .order("question_number");

    if (error) {
      console.error("Erro ao carregar perguntas:", error);
    }

    if (data) {
      setQuestions(data);
      setCurrentCategory(theme);
      setPhase("numbers");
    }
    setLoading(false);
  }

  async function loadQuestion(id) {
    setLoading(true);
    setSelectedAnswers([]);
    setShowCorrectAnswer(false);
    setCorrectAnswered(false);

    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao carregar pergunta:", error);
    }

    if (data) {
      setCurrentQuestion(data);
      setPhase("question");
    }
    setLoading(false);
  }

  async function markAsUsed(id) {
    await supabase.from("questions").update({ used: true }).eq("id", id);

    loadQuestions(currentCategory);
    setPhase("numbers");
  }

  function handleAnswerClick(option) {
    if (correctAnswered || selectedAnswers.includes(option)) return;

    const correctAnswer = currentQuestion.correct_option.toUpperCase().trim();
    const optionUpper = option.toUpperCase().trim();

    setSelectedAnswers([...selectedAnswers, option]);

    if (optionUpper === correctAnswer) {
      setCorrectAnswered(true);
    }
  }

  function getButtonStyle(option) {
    const correctAnswer = currentQuestion.correct_option.toUpperCase().trim();
    const optionUpper = option.toUpperCase().trim();

    if ((correctAnswered || showCorrectAnswer) && optionUpper === correctAnswer) {
      return { background: "#4ade80", color: "white" };
    }

    if (selectedAnswers.includes(option) && optionUpper !== correctAnswer) {
      return { background: "#ef4444", color: "white" };
    }

    if (selectedAnswers.includes(option)) {
      return { background: "#333", opacity: 0.5, cursor: "not-allowed" };
    }

    return { background: "#646cff" };
  }

  function handleRaffleCategory() {
    if (!raffleCategories.length) return;
    const randomIndex = Math.floor(Math.random() * raffleCategories.length);
    const chosen = raffleCategories[randomIndex];
    loadQuestions(chosen);
  }

  // LOADING
  if (loading) {
    return (
      <div>
        <h1>Carregando...</h1>
      </div>
    );
  }

  // TELA DE REGRAS (só enquanto showRules === true)
  if (showRules) return (
  <div
    style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      textAlign: 'left',
      padding: '2rem',
    }}
  >
    <div
      style={{
        background: 'rgba(0,0,0,0.9)',
        padding: '2.5rem 3rem',
        borderRadius: '16px',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
      }}
    >
      <h1
        style={{
          marginBottom: '1rem',
          textAlign: 'center',
          fontSize: '1.8rem',
        }}
      >
        Regras do Jogo
      </h1>

      {/* DUAS COLUNAS, TEXTO NORMAL */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem',
          fontSize: '1rem',
          lineHeight: 1.6,
        }}
      >
        {/* COLUNA ESQUERDA */}
        <div>
          <ol style={{ marginTop: 0, paddingLeft: '1.2rem' }}>
            <li>A ordem dos participantes é definida por sorteio no início do jogo.</li>
            <li>
              Cada rodada começa com a escolha da categoria pelos botões do painel.
            </li>
            <li>
              Quem está na vez responde a pergunta da rodada; se acertar, conquista um
              presente (novo da pilha ou “roubado” de alguém).
            </li>
            <li>
              Caso erre, a outra pessoa tem o direito de responder.
            </li>
            <li>
              O presente deve ser aberto na hora para todo mundo ver o que está em jogo.
            </li>
            <li>
              Um mesmo presente pode ser desafiado e trocado quantas vezes for
              necessário ao longo do jogo.
            </li>
          </ol>
        </div>

        {/* COLUNA DIREITA */}
        <div>
          <p style={{ margin: 0, marginBottom: '0.5rem' }}>Na sua vez, você pode escolher:</p>
          <ul style={{ marginTop: 0, paddingLeft: '1.2rem' }}>
            <li>Pegar um presente novo da pilha, ou</li>
            <li>Desafiar o presente de outra pessoa, respondendo uma pergunta.</li>
          </ul>

          <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
            Se você desafiar o presente de alguém:
          </p>
          <ul style={{ marginTop: 0, paddingLeft: '1.2rem' }}>
            <li>Se acertar, fica com aquele presente.</li>
            <li>Se errar, não ganha presente na rodada.</li>
          </ul>

          <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
            Caso não seja a sua vez e você sopre a resposta:
          </p>
          <ul style={{ marginTop: 0, paddingLeft: '1.2rem' }}>
            <li>Se já tiver presente, perde o presente.</li>
            <li>Se não tiver presente, vai para o fim da fila.</li>
          </ul>

          <p style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
            Se ninguém acertar a pergunta de uma rodada, nenhum presente é entregue.
          </p>
          <p style={{ marginTop: 0 }}>
            O jogo termina quando todos tiverem pelo menos um presente ou quando
            acabarem os presentes da pilha.
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => {
            setShowRules(false);
            setPhase('teams');
          }}
          style={{
            marginTop: '0.5rem',
            padding: '1rem 2.5rem',
            fontSize: '1rem',
            borderRadius: '999px',
            background: '#dc2626',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          🎅 Começar o Jogo! 🎄
        </button>
      </div>
    </div>
  </div>
);

  // TELA DE CATEGORIAS
  if (phase === "categories") {
    return (
      <>
        {/* coluna de categorias à direita */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100vw",
          }}
        >
          <div
            style={{
              width: "30vw",
              marginRight: "8vw",
              marginTop: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              alignItems: "stretch",
            }}
          >
            <h1 style={{ textAlign: "center" }}>Escolha uma Categoria</h1>

            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => loadQuestions(cat)}
                style={{
                  width: "100%",
                  textAlign: "center",
                  ...(cat === "Kids e Disney"
                    ? {
                        background: "#ffcc00",
                        color: "#000",
                        fontWeight: "bold",
                      }
                    : {}),
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* botão SORTEAR CATEGORIA no meio da tela */}
        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "25%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <button
            onClick={handleRaffleCategory}
            style={{
              padding: "1.5rem 4rem",
              fontSize: "1.6rem",
              borderRadius: "12px",
              background: "#dc2626",
              color: "#ffffff",
              fontWeight: "bold",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              border: "none",
              cursor: "pointer",
            }}
          >
            SORTEAR CATEGORIA
          </button>
        </div>
      </>
    );
  }

  // TELA DE NÚMEROS
  if (phase === "numbers") {
    return (
      <div>
        <h1>{currentCategory}</h1>
        <button onClick={() => setPhase("categories")}>
          Voltar para Categorias
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: "1rem",
            marginTop: "2rem",
          }}
        >
          {questions.map((q) => (
            <button
              key={q.id}
              onClick={() => loadQuestion(q.id)}
              disabled={q.used}
              style={{
                background: q.used ? "#333" : "#646cff",
                textDecoration: q.used ? "line-through" : "none",
              }}
            >
              {q.question_number}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // TELA DA PERGUNTA
  if (phase === "question" && currentQuestion) {
    return (
      <div>
        <h2>Pergunta {currentQuestion.question_number}</h2>
        <button onClick={() => setPhase("numbers")}>
          Voltar para Números
        </button>

        <div style={{ marginTop: "2rem" }}>
          <h3>{currentQuestion.question}</h3>

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <button
              onClick={() => handleAnswerClick("A")}
              style={getButtonStyle("A")}
            >
              <strong>A:</strong> {currentQuestion.option_a}
            </button>
            <button
              onClick={() => handleAnswerClick("B")}
              style={getButtonStyle("B")}
            >
              <strong>B:</strong> {currentQuestion.option_b}
            </button>
            <button
              onClick={() => handleAnswerClick("C")}
              style={getButtonStyle("C")}
            >
              <strong>C:</strong> {currentQuestion.option_c}
            </button>
            <button
              onClick={() => handleAnswerClick("D")}
              style={getButtonStyle("D")}
            >
              <strong>D:</strong> {currentQuestion.option_d}
            </button>
          </div>

          {correctAnswered && (
            <button
              onClick={() => markAsUsed(currentQuestion.id)}
              style={{ marginTop: "2rem", background: "#4ade80" }}
            >
              Marcar como Usada
            </button>
          )}

          {selectedAnswers.length > 0 &&
            !correctAnswered &&
            !showCorrectAnswer && (
              <button
                onClick={() => setShowCorrectAnswer(true)}
                style={{ marginTop: "2rem", background: "#fbbf24", color: "#000" }}
              >
                Mostrar Resposta
              </button>
            )}

          {showCorrectAnswer && (
            <button
              onClick={() => markAsUsed(currentQuestion.id)}
              style={{ marginTop: "2rem", background: "#4ade80" }}
            >
              Marcar como Usada
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default App;
