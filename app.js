const { useState, useEffect } = React;

/* =========================
   NORMALISATION
========================= */

const normalize = (str) => {
  if (!str || typeof str !== "string") return "";
  let s = str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  if (s.endsWith("s") && s.length > 3) s = s.slice(0, -1);
  return s;
};

/* =========================
   FAMILLES
========================= */

const FOOD_FAMILIES = {
  feculents: { label: "Féculents", keywords: ["riz", "pate", "pain", "pomme de terre"] },
  legumes: { label: "Légumes", keywords: ["tomate", "courgette", "carotte", "brocoli"] },
  legumes_secs: { label: "Légumineuses", keywords: ["lentille", "pois", "haricot"] },
  viande_rouge: { label: "Viande rouge", keywords: ["boeuf", "bœuf", "steak", "agneau", "porc"] },
  volaille: { label: "Volaille", keywords: ["poulet", "dinde"] },
  poisson: { label: "Poisson", keywords: ["poisson", "saumon", "thon"] },
  produits_laitiers: { label: "Produits laitiers", keywords: ["fromage", "lait", "yaourt"] },
  fruits: { label: "Fruits", keywords: ["pomme", "banane", "poire"] },
  autres: { label: "Autres", keywords: [] }
};

const guessFamily = (key) => {
  if (!key) return "autres";
  for (const [k, fam] of Object.entries(FOOD_FAMILIES)) {
    if (k === "autres") continue;
    if (fam.keywords.some(w => key.includes(normalize(w)))) return k;
  }
  return "autres";
};

const getColor = (avg) => {
  if (avg >= 4) return "red";
  if (avg >= 2) return "orange";
  return "green";
};

/* =========================
   APP
========================= */



function App() {
  const [ingredientInput, setIngredientInput] = useState("");
  const [mealIngredients, setMealIngredients] = useState([]);
  const [pain, setPain] = useState("");
  const [mealTime, setMealTime] = useState("Midi");
  const [mealDate, setMealDate] = useState(new Date().toISOString().slice(0, 10));

  /* Options supplémentaires */
  const [showExtraOptions, setShowExtraOptions] = useState(false);
  const [personalNote, setPersonalNote] = useState("");
  const [mealType, setMealType] = useState("");
  const [mealFeeling, setMealFeeling] = useState("");

  /* Stats */
  const [statsView, setStatsView] = useState("families");
  const [timeFilter, setTimeFilter] = useState("all");
  const [familyDetail, setFamilyDetail] = useState(null);

  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [history, setHistory] = useState(() => {
    const h = localStorage.getItem("history");
    return h ? JSON.parse(h) : [];
  });

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  /* =========================
     SAISIE
  ========================= */

  const addIngredient = () => {
    const label = ingredientInput.trim();
    if (!label) return;
    const key = normalize(label);
    if (mealIngredients.some(i => i.key === key)) return;
    setMealIngredients([...mealIngredients, { label, key }]);
    setIngredientInput("");
  };

  const removeIngredient = (key) => {
    setMealIngredients(mealIngredients.filter(i => i.key !== key));
  };

  const saveMeal = () => {
    if (!mealIngredients.length) {
      setError("Ajoute au moins un ingrédient.");
      return;
    }
    if (!pain) {
      setError("Choisis une intensité de douleur.");
      return;
    }

    setHistory([
      ...history,
      {
        date: mealDate,
        time: mealTime,
        pain: Number(pain),
        ingredients: mealIngredients,
        personalNote,
        mealType,
        mealFeeling
      }
    ]);

    setMealIngredients([]);
    setPain("");
    setPersonalNote("");
    setMealType("");
    setMealFeeling("");
    setShowExtraOptions(false);
    setError("");
  };

  /* =========================
     FILTRE TEMPOREL
  ========================= */

  const now = new Date();
  const filteredHistory = history.filter(e => {
    if (timeFilter === "all") return true;
    const diff = (now - new Date(e.date)) / (1000 * 60 * 60 * 24);
    if (timeFilter === "7") return diff <= 7;
    if (timeFilter === "30") return diff <= 30;
    return true;
  });

  /* =========================
     STATS
  ========================= */

  const stats = {};
  filteredHistory.forEach(e => {
    e.ingredients.forEach(i => {
      if (!stats[i.key]) stats[i.key] = { label: i.label, total: 0, count: 0 };
      stats[i.key].total += e.pain;
      stats[i.key].count += 1;
    });
  });

  const ingredientStats = Object.values(stats)
    .map(s => ({ name: s.label, avg: s.total / s.count, count: s.count }))
    .sort((a, b) => b.avg - a.avg);

  const familyStats = {};
  filteredHistory.forEach(e => {
    e.ingredients.forEach(i => {
      const fam = guessFamily(i.key);
      if (!familyStats[fam]) familyStats[fam] = { total: 0, count: 0 };
      familyStats[fam].total += e.pain;
      familyStats[fam].count += 1;
    });
  });

  const families = Object.entries(familyStats)
    .map(([k, s]) => ({
      key: k,
      name: FOOD_FAMILIES[k].label,
      avg: s.total / s.count,
      count: s.count
    }))
    .sort((a, b) => b.avg - a.avg);

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="container">
      <h1>🤕 Aïe aïe aïe bidou</h1>

      {/* ===== SAISIE ===== */}
      <div className="card">
        <h2>Repas</h2>

        <input type="date" value={mealDate} onChange={e => setMealDate(e.target.value)} />

        <select value={mealTime} onChange={e => setMealTime(e.target.value)}>
          <option>Matin</option>
          <option>Midi</option>
          <option>Soir</option>
        </select>

        <input
          placeholder="Ingrédient"
          value={ingredientInput}
          onChange={e => setIngredientInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addIngredient()}
        />
       <button className="btn-add-secondary" onClick={addIngredient}>
  Ajouter
</button>


        <div className="ingredient-list">
         <div className="ingredient-tags">
  {mealIngredients.map((i, idx) => (
    <div key={idx} className="ingredient-tag">
      <span>{i.label}</span>
      <button
        className="remove-tag"
        onClick={() => removeIngredient(idx)}
        aria-label="Supprimer"
      >
        ×
      </button>
    </div>
  ))}
</div>

        </div>

        <select value={pain} onChange={e => setPain(e.target.value)}>
          <option value="">Douleur</option>
          {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
        </select>

        <button
          className="secondary"
          onClick={() => setShowExtraOptions(!showExtraOptions)}
        >
          {showExtraOptions ? "▼" : "▶"} Options supplémentaires
        </button>

        {showExtraOptions && (
          <>
            <select value={mealType} onChange={e => setMealType(e.target.value)}>
              <option value="">Type de cuisine</option>
              <option>Cuisine maison</option>
              <option>Aliments transformés</option>
              <option>Restaurant</option>
            </select>

            <select value={mealFeeling} onChange={e => setMealFeeling(e.target.value)}>
              <option value="">Ressenti</option>
              <option>Avoir trop mangé</option>
              <option>Avoir mangé trop gras</option>
            </select>

            <textarea
              placeholder="Remarque personnelle (stress, sport, médicaments...)"
              value={personalNote}
              onChange={e => setPersonalNote(e.target.value)}
            />
          </>
        )}

        {error && <p style={{ color: "red" }}>{error}</p>}
        <button className="primary" onClick={saveMeal}>Enregistrer</button>
      </div>

      {/* ===== STATS ===== */}
      <div className="card">
        <h2>Aliments les plus problématiques</h2>

<div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
  <button
    className={statsView === "families" ? "primary" : "secondary"}
    onClick={() => setStatsView("families")}
    style={{ width: "auto" }}
  >
    Par famille
  </button>

  <button
    className={statsView === "ingredients" ? "primary" : "secondary"}
    onClick={() => setStatsView("ingredients")}
    style={{ width: "auto" }}
  >
    Par aliment
  </button>

  <select
    value={timeFilter}
    onChange={e => setTimeFilter(e.target.value)}
    style={{ width: "auto" }}
  >
    <option value="all">Toutes dates</option>
    <option value="7">7 jours</option>
    <option value="30">30 jours</option>
  </select>
</div>



        <div className="stats-grid">
{(statsView === "families" ? families : ingredientStats).map(s => (
  <div
    key={statsView === "families" ? s.key : s.name}
    className="stat-card"
    style={{ cursor: statsView === "families" ? "pointer" : "default" }}
    onClick={() => {
      if (statsView !== "families") return;
      setFamilyDetail(prev => (prev === s.key ? null : s.key));
    }}
  >


              <strong>{s.name}</strong>
              <div className="stat-bar-bg">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${(s.avg / 5) * 100}%`,
                    backgroundColor: getColor(s.avg)
                  }}
                />
              </div>
              <small>{s.count} occurrence(s)</small>
{statsView === "families" && familyDetail === s.key && (
  <div className="family-detail">
    {filteredHistory
      .filter(entry =>
        entry.ingredients.some(i => guessFamily(i.key) === s.key)
      )

      .map((entry, idx) => (
        <div key={idx} className="family-detail-item">
          <strong>{entry.date}</strong> — {entry.time} — douleur {entry.pain}/5
          <br />
          {entry.ingredients.map(i => i.label).join(", ")}
        </div>
      ))}
  </div>
)}

            </div>
          ))}
        </div>
      </div>

      {/* ===== HISTORIQUE ===== */}
      <button onClick={() => setShowHistory(!showHistory)}>
        {showHistory ? "Masquer" : "Afficher"} l’historique
      </button>

      {showHistory && (
        <div className="card">
          {history.map((e, i) => (
            <div key={i}>
              <strong>{e.date}</strong> — {e.time} — douleur {e.pain}/5
              <br />
              {e.ingredients.map(i => i.label).join(", ")}
              {e.personalNote && <div>📝 {e.personalNote}</div>}
              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
