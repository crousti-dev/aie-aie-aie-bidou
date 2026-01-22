const { useState, useEffect } = React;

/* =========================
   UTILITAIRES
========================= */

const normalize = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

/* =========================
   FAMILLES D’ALIMENTS
========================= */

const FOOD_FAMILIES = {
  feculents: "Féculents",
  legumes: "Légumes",
  legumes_secs: "Légumineuses",
  viande_rouge: "Viande rouge",
  volaille: "Volaille",
  poisson: "Poisson",
  produits_laitiers: "Produits laitiers",
  fruits: "Fruits",
  sucre: "Produits sucrés",
  autres: "Autres"
};

const guessFamily = (key) => {
  if (key.includes("riz") || key.includes("pate") || key.includes("pain")) return "feculents";
  if (key.includes("lentille") || key.includes("pois")) return "legumes_secs";
  if (key.includes("boeuf") || key.includes("steak")) return "viande_rouge";
  if (key.includes("poulet")) return "volaille";
  if (key.includes("poisson") || key.includes("saumon")) return "poisson";
  if (key.includes("fromage") || key.includes("lait")) return "produits_laitiers";
  if (key.includes("pomme") || key.includes("banane")) return "fruits";
  if (key.includes("sucre") || key.includes("gateau")) return "sucre";
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
const [showOptions, setShowOptions] = useState(false);


  // 🔹 NOUVEAUX CHAMPS
  const [mealType, setMealType] = useState("Cuisine maison");
  const [mealFeeling, setMealFeeling] = useState("Rien de particulier");

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  const [statsView, setStatsView] = useState("ingredients");
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  /* =========================
     INGREDIENTS
  ========================= */

  const addIngredient = () => {
    const label = ingredientInput.trim();
    if (!label) return;

    const key = normalize(label);

    if (mealIngredients.some(i => i.key === key)) {
      setIngredientInput("");
      return;
    }

    setMealIngredients([...mealIngredients, { label, key }]);
    setIngredientInput("");
  };

  const removeIngredient = (key) => {
    setMealIngredients(mealIngredients.filter(i => i.key !== key));
  };

  /* =========================
     ENREGISTREMENT
  ========================= */

  const saveMeal = () => {
    if (mealIngredients.length === 0) {
      setError("Ajoute au moins un ingrédient.");
      return;
    }
    if (!pain) {
      setError("Choisis une intensité de douleur.");
      return;
    }

    setError("");

    setHistory([
      ...history,
      {
        date: mealDate,
        time: mealTime,
        pain: Number(pain),
        mealType,
        mealFeeling,
        ingredients: mealIngredients
      }
    ]);

    setMealIngredients([]);
    setPain("");
    setMealType("Cuisine maison");
    setMealFeeling("Rien de particulier");
  };

  const deleteEntry = (index) => {
    const copy = [...history];
    copy.splice(index, 1);
    setHistory(copy);
  };

  /* =========================
     STATS
  ========================= */

  const stats = {};

  history.forEach(entry => {
    entry.ingredients.forEach(i => {
      if (!stats[i.key]) {
        stats[i.key] = { label: i.label, total: 0, count: 0 };
      }
      stats[i.key].total += entry.pain;
      stats[i.key].count += 1;
    });
  });

  const sortedIngredients = Object.values(stats)
    .map(s => ({
      name: s.label,
      avg: s.total / s.count,
      count: s.count
    }))
    .sort((a, b) => b.avg - a.avg);

  const familyStats = {};

  Object.entries(stats).forEach(([key, s]) => {
    const fam = guessFamily(key);
    if (!familyStats[fam]) familyStats[fam] = { total: 0, count: 0 };
    familyStats[fam].total += s.total;
    familyStats[fam].count += s.count;
  });

  const sortedFamilies = Object.entries(familyStats)
    .map(([key, s]) => ({
      name: FOOD_FAMILIES[key],
      avg: s.total / s.count,
      count: s.count
    }))
    .sort((a, b) => b.avg - a.avg);

  /* =========================
     HISTORIQUE TRIÉ
  ========================= */

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="container">
      <h1>🤕 Aïe aïe aïe bidou</h1>

      <div className="card">
        <h2>Repas & douleur</h2>

        <label>Date</label>
        <input type="date" value={mealDate} onChange={e => setMealDate(e.target.value)} />

        <label>Moment du repas</label>
        <select value={mealTime} onChange={e => setMealTime(e.target.value)}>
          <option>Matin</option>
          <option>Midi</option>
          <option>Soir</option>
        </select>

<button
  className="secondary"
  onClick={() => setShowOptions(!showOptions)}
>
  {showOptions ? "Masquer les options supplémentaires" : "Options supplémentaires"}
</button>

{showOptions && (
  <div style={{ marginTop: "12px" }}>
    <label>Type de cuisine</label>
    <select value={mealType} onChange={e => setMealType(e.target.value)}>
      <option>Cuisine maison</option>
      <option>Plats préparés</option>
      <option>Repas à l’extérieur</option>
    </select>

    <label>Sentiment au moment du repas</label>
    <select value={mealFeeling} onChange={e => setMealFeeling(e.target.value)}>
      <option>Rien de particulier</option>
      <option>Avoir mangé gras</option>
      <option>Avoir trop mangé</option>
    </select>
  </div>
)}


<label>Ajouter un ingrédient</label>

<input
  value={ingredientInput}
  placeholder="Ex : riz, pâtes, tomate…"
  onChange={e => setIngredientInput(e.target.value)}
  onKeyDown={e => e.key === "Enter" && addIngredient()}
/>

<button className="add-ingredient-btn" onClick={addIngredient}>
  + Ajouter
</button>

<div className="ingredient-list">
  {mealIngredients.map(i => (
    <div className="ingredient-item" key={i.key}>
      <span>{i.label}</span>
      <button
        className="remove-ingredient-btn"
        onClick={() => removeIngredient(i.key)}
        title="Supprimer"
      >
        ✕
      </button>
    </div>
  ))}
</div>


        <label>Intensité de la douleur</label>
        <select value={pain} onChange={e => setPain(e.target.value)}>
          <option value="">Choisir</option>
          {[1,2,3,4,5].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button className="primary" onClick={saveMeal}>Enregistrer</button>
      </div>

      <div className="card">
        <h2>Aliments les plus problématiques</h2>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            className={statsView === "ingredients" ? "primary" : "secondary"}
            onClick={() => setStatsView("ingredients")}
          >
            Par aliment
          </button>
          <button
            className={statsView === "families" ? "primary" : "secondary"}
            onClick={() => setStatsView("families")}
          >
            Par famille
          </button>
        </div>

<div className="stats-grid">
  {(statsView === "ingredients" ? sortedIngredients : sortedFamilies).map((s, i) => (
    <div className="stat-card" key={i}>
      <div className="stat-header">
        <strong>{s.name}</strong>
        <span className="stat-score" style={{ color: getColor(s.avg) }}>
          {s.avg.toFixed(1)} / 5
        </span>
      </div>

      <div className="stat-bar-bg">
        <div
          className="stat-bar-fill"
          style={{
            width: `${(s.avg / 5) * 100}%`,
            backgroundColor: getColor(s.avg)
          }}
        />
      </div>

      <div className="stat-meta">
        {s.count} occurrence{s.count > 1 ? "s" : ""}
      </div>
    </div>
  ))}
</div>
      </div>

      <div className="card">
        <button onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "Masquer" : "Afficher"} l’historique
        </button>

        {showHistory && sortedHistory.map((e, i) => (
          <div key={i}>
            <strong>{e.date}</strong> – {e.time} – douleur {e.pain}/5  
            <br />
            {e.ingredients.map(i => i.label).join(", ")}
            <br />
            <em>{e.mealType} – {e.mealFeeling}</em>
            <br />
            <button onClick={() => deleteEntry(history.indexOf(e))}>Annuler</button>
            <hr />
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
