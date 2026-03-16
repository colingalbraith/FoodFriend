import { useState } from "react";
import Card from "../ui/Card";
import Modal from "../ui/Modal";
import { makeId } from "../../utils/itemHelpers";
import { recipePassesDiet } from "../../constants/dietaryFilters";

export default function RecipesSection({
  recipes, saveRecipes, items, shopping, saveShopping, userProfile,
}) {
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeLimit, setRecipeLimit] = useState(20);
  const [addingRecipe, setAddingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeName, setRecipeName] = useState("");
  const [recipeIngredients, setRecipeIngredients] = useState("");
  const [recipeNotes, setRecipeNotes] = useState("");
  const [recipeCalories, setRecipeCalories] = useState("");
  const [recipeProtein, setRecipeProtein] = useState("");
  const [recipeTime, setRecipeTime] = useState("");
  const [dietFilter, setDietFilter] = useState(false);
  const [canMakeFilter, setCanMakeFilter] = useState(false);

  const restrictions = userProfile?.restrictions || [];
  const hasDiet = restrictions.length > 0 && !restrictions.includes("None");
  const fridgeNames = new Set((items || []).map(i => i.name.toLowerCase()));

  let filtered = recipes || [];

  // Text search
  if (recipeSearch) {
    const q = recipeSearch.toLowerCase();
    filtered = filtered.filter(r => r.name.toLowerCase().includes(q));
  }

  // Dietary restriction filter
  if (dietFilter && hasDiet) {
    filtered = filtered.filter(r => recipePassesDiet(r, restrictions));
  }

  // "Can make" filter — only recipes where all ingredients are in fridge
  if (canMakeFilter) {
    filtered = filtered.filter(r =>
      r.ingredients?.length > 0 && r.ingredients.every(ing => fridgeNames.has(ing.toLowerCase()))
    );
  }

  function openAddRecipe() {
    setRecipeName(""); setRecipeIngredients(""); setRecipeNotes("");
    setRecipeCalories(""); setRecipeProtein(""); setRecipeTime("");
    setEditingRecipe(null); setAddingRecipe(true);
  }
  function openEditRecipe(r) {
    setRecipeName(r.name); setRecipeIngredients(r.ingredients.join(", "));
    setRecipeNotes(r.notes || ""); setRecipeCalories(r.calories || "");
    setRecipeProtein(r.protein || ""); setRecipeTime(r.time || "");
    setEditingRecipe(r.id); setAddingRecipe(true);
  }
  function saveRecipe() {
    if (!recipeName.trim()) return;
    const ingredients = recipeIngredients.split(",").map(s => s.trim()).filter(Boolean);
    const recipe = {
      id: editingRecipe || makeId(), name: recipeName.trim(), ingredients,
      notes: recipeNotes.trim(), calories: recipeCalories.trim(),
      protein: recipeProtein.trim(), time: recipeTime.trim(),
      createdAt: editingRecipe ? (recipes || []).find(r => r.id === editingRecipe)?.createdAt : new Date().toISOString(),
    };
    const isDefault = editingRecipe && editingRecipe.startsWith("dr-") || editingRecipe?.startsWith("r1-") || editingRecipe?.startsWith("r2-") || editingRecipe?.startsWith("r3-");
    if (editingRecipe && !isDefault) {
      const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]");
      saveRecipes(current.map(r => r.id === editingRecipe ? recipe : r));
    } else {
      recipe.id = makeId();
      const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]");
      saveRecipes([recipe, ...current]);
    }
    setAddingRecipe(false);
  }
  function deleteRecipe(id) {
    const current = JSON.parse(localStorage.getItem("ff2-recipes") || "[]");
    saveRecipes(current.filter(r => r.id !== id));
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--display)", fontSize: 24, fontWeight: 700 }}>My Recipes</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{(recipes || []).length} saved</div>
      </div>

      <input className="cozy-input" placeholder="Search recipes..." value={recipeSearch}
        onChange={e => { setRecipeSearch(e.target.value); setRecipeLimit(20); }} style={{ marginBottom: 10 }} />

      {/* Filter row */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {hasDiet && (
          <button className={`filter-chip ${dietFilter ? "active" : ""}`}
            onClick={() => setDietFilter(!dietFilter)} style={{ fontSize: 11 }}>
            {restrictions.filter(r => r !== "None").join(", ")}
          </button>
        )}
        <button className={`filter-chip ${canMakeFilter ? "active" : ""}`}
          onClick={() => setCanMakeFilter(!canMakeFilter)} style={{ fontSize: 11 }}>
          Can make now
        </button>
      </div>

      <button className="cozy-btn primary full" onClick={openAddRecipe} style={{ marginBottom: 14 }}>Add Recipe</button>

      {filtered.length === 0 ? (
        <Card style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{recipeSearch || dietFilter || canMakeFilter ? "No matching recipes" : "No recipes yet"}</div>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.slice(0, recipeLimit).map((r, i) => {
            const haveCount = r.ingredients.filter(ing => fridgeNames.has(ing.toLowerCase())).length;
            const total = r.ingredients.length;
            const canMake = total > 0 && haveCount === total;
            return (
              <Card key={r.id} style={{ padding: 0, overflow: "hidden", animation: `fadeIn 0.3s ease-out ${i * 40}ms both` }}>
                <div onClick={() => openEditRecipe(r)} style={{ padding: 16, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700 }}>{r.name}</div>
                    {r.time && <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, flexShrink: 0 }}>{r.time}</span>}
                  </div>
                  {(r.calories || r.protein) && (
                    <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                      {r.calories && <div><span style={{ fontSize: 15, fontWeight: 800 }}>{r.calories}</span><span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 2 }}>cal</span></div>}
                      {r.protein && <div><span style={{ fontSize: 15, fontWeight: 800 }}>{r.protein}g</span><span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 2 }}>protein</span></div>}
                    </div>
                  )}
                  {total > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
                      {r.ingredients.map((ing, j) => {
                        const have = fridgeNames.has(ing.toLowerCase());
                        return <span key={j} style={{ borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600, background: have ? "#edf5ed" : "#fef3e2", color: have ? "#4a7a4a" : "#8b6d30", border: `1px solid ${have ? "#b8d4b8" : "#e8d0a8"}` }}>{ing}</span>;
                      })}
                    </div>
                  )}
                  {total > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: canMake ? "#4a7a4a" : "var(--muted)" }}>
                        {canMake ? "Ready to cook" : `${haveCount}/${total} in fridge`}
                      </div>
                      {!canMake && saveShopping && (
                        <button className="cozy-btn secondary" style={{ fontSize: 10, padding: "4px 10px", minHeight: 28, borderRadius: 8, flexShrink: 0 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const missing = r.ingredients.filter(ing => !fridgeNames.has(ing.toLowerCase()));
                            const existingNames = new Set((shopping || []).map(i => i.name.toLowerCase()));
                            const toAdd = missing.filter(n => !existingNames.has(n.toLowerCase()));
                            if (toAdd.length > 0) saveShopping([...(shopping || []), ...toAdd.map(n => ({ id: makeId(), name: n, checked: false }))]);
                          }}>+ Shop</button>
                      )}
                    </div>
                  )}
                  {r.notes && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6, lineHeight: 1.4 }}>{r.notes}</div>}
                </div>
              </Card>
            );
          })}
          {filtered.length > recipeLimit && (
            <button className="cozy-btn secondary full" onClick={() => setRecipeLimit(l => l + 20)} style={{ marginTop: 4 }}>
              Show More ({filtered.length - recipeLimit} remaining)
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Recipe Modal */}
      <Modal open={addingRecipe} onClose={() => setAddingRecipe(false)} title={editingRecipe ? "Edit Recipe" : "Add Recipe"}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="cozy-input" placeholder="Recipe name" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Ingredients (comma separated)</label>
            <textarea className="cozy-input" rows={3} placeholder="Chicken, Rice, Soy Sauce..." value={recipeIngredients} onChange={e => setRecipeIngredients(e.target.value)} style={{ resize: "vertical", fontFamily: "var(--body)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Calories</label><input className="cozy-input" placeholder="450" value={recipeCalories} onChange={e => setRecipeCalories(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Protein (g)</label><input className="cozy-input" placeholder="35" value={recipeProtein} onChange={e => setRecipeProtein(e.target.value)} inputMode="numeric" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Time</label><input className="cozy-input" placeholder="30 min" value={recipeTime} onChange={e => setRecipeTime(e.target.value)} /></div>
          </div>
          <div><label style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", display: "block", marginBottom: 4 }}>Notes</label><textarea className="cozy-input" rows={2} placeholder="Tips, variations..." value={recipeNotes} onChange={e => setRecipeNotes(e.target.value)} style={{ resize: "vertical", fontFamily: "var(--body)" }} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cozy-btn primary" style={{ flex: 1 }} onClick={saveRecipe}>{editingRecipe ? "Update" : "Save Recipe"}</button>
            {editingRecipe && <button className="cozy-btn danger" onClick={() => { deleteRecipe(editingRecipe); setAddingRecipe(false); }}>Delete</button>}
          </div>
        </div>
      </Modal>
    </>
  );
}
