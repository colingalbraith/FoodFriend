import { useState } from "react";
import { getWeekDates } from "../../utils/dateHelpers";
import PlanSection from "./PlanSection";
import TrackSection from "./TrackSection";
import RecipesSection from "./RecipesSection";
import StatsSection from "./StatsSection";

const DEFAULT_GOALS = { calories: 2000, protein: 150, carbs: 250, fat: 65 };

export default function MealPlanTab({
  meals, saveMeals, items, saveItems, recurring, saveRecurring,
  recipes, saveRecipes, macroLog, saveMacroLog, macroGoals, saveMacroGoals,
  userProfile, shopping, saveShopping, showToast,
}) {
  const weekDates = getWeekDates();
  const today = weekDates[0];
  const [section, setSection] = useState("plan");

  const goals = macroGoals || DEFAULT_GOALS;

  const todayEntries = (macroLog || []).filter(e => e.date === today);
  const todayTotals = todayEntries.reduce((a, e) => ({
    calories: a.calories + (Number(e.calories) || 0), protein: a.protein + (Number(e.protein) || 0),
    carbs: a.carbs + (Number(e.carbs) || 0), fat: a.fat + (Number(e.fat) || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      {/* Section toggle */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[
          { id: "plan", label: "Plan" },
          { id: "track", label: "Track" },
          { id: "recipes", label: "Recipes" },
          { id: "stats", label: "Stats" },
        ].map(s => (
          <button key={s.id} className={`filter-chip ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {section === "plan" && (
        <PlanSection
          meals={meals} saveMeals={saveMeals}
          weekDates={weekDates} today={today}
          recurring={recurring} saveRecurring={saveRecurring}
          recipes={recipes}
          macroLog={macroLog} saveMacroLog={saveMacroLog}
          goals={goals} todayTotals={todayTotals} todayEntries={todayEntries}
          items={items} saveItems={saveItems}
          shopping={shopping} saveShopping={saveShopping}
          showToast={showToast}
        />
      )}

      {section === "track" && (
        <TrackSection
          today={today}
          macroLog={macroLog} saveMacroLog={saveMacroLog}
          macroGoals={macroGoals} saveMacroGoals={saveMacroGoals}
          goals={goals} todayTotals={todayTotals} todayEntries={todayEntries}
          recipes={recipes}
          items={items} saveItems={saveItems}
          showToast={showToast}
        />
      )}

      {section === "recipes" && (
        <RecipesSection
          recipes={recipes} saveRecipes={saveRecipes}
          items={items} shopping={shopping} saveShopping={saveShopping}
          userProfile={userProfile}
        />
      )}

      {section === "stats" && (
        <StatsSection today={today} macroLog={macroLog} goals={goals} />
      )}
    </div>
  );
}
