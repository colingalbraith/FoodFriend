// Keyword-based ingredient exclusion lists for dietary restrictions.
// Matched case-insensitively against recipe ingredient names.
export const RESTRICTION_FILTERS = {
  Vegetarian: [
    "chicken", "beef", "pork", "steak", "bacon", "turkey", "ham", "sausage",
    "ground meat", "ground beef", "ground turkey", "ground pork",
    "fish", "salmon", "tuna", "shrimp", "crab", "lobster", "anchovies",
    "lamb", "veal", "duck", "venison", "bison", "prosciutto", "pancetta",
    "chorizo", "pepperoni", "salami",
  ],
  Vegan: [
    "chicken", "beef", "pork", "steak", "bacon", "turkey", "ham", "sausage",
    "ground meat", "ground beef", "ground turkey", "ground pork",
    "fish", "salmon", "tuna", "shrimp", "crab", "lobster", "anchovies",
    "lamb", "veal", "duck", "venison", "bison", "prosciutto", "pancetta",
    "chorizo", "pepperoni", "salami",
    "cheese", "milk", "cream", "butter", "egg", "eggs", "yogurt", "honey",
    "mayo", "mayonnaise", "whey", "protein powder", "cream cheese",
    "sour cream", "mozzarella", "parmesan", "cheddar", "feta",
    "ricotta", "gouda", "brie", "ghee",
  ],
  "Gluten-Free": [
    "bread", "flour", "pasta", "noodles", "spaghetti", "penne", "linguine",
    "tortilla", "bagel", "soy sauce", "breadcrumbs", "croutons",
    "couscous", "barley", "rye", "wrap", "pita", "bun", "roll",
    "panko", "udon", "ramen noodles",
  ],
  "Dairy-Free": [
    "cheese", "milk", "cream", "butter", "yogurt", "sour cream",
    "cream cheese", "whey", "mozzarella", "parmesan", "cheddar",
    "feta", "ricotta", "gouda", "brie", "ghee", "half and half",
  ],
  Keto: [
    "bread", "rice", "pasta", "noodles", "potato", "potatoes", "sugar",
    "flour", "oats", "beans", "corn", "tortilla", "bagel", "honey",
    "maple syrup", "brown sugar", "quinoa", "couscous", "pita",
    "sweet potato", "banana", "jam", "jelly",
  ],
  Halal: [
    "pork", "bacon", "ham", "prosciutto", "pancetta", "lard",
    "wine", "beer", "mirin", "rum", "bourbon", "whiskey",
    "chorizo", "pepperoni", "salami",
  ],
  Kosher: [
    "pork", "bacon", "ham", "prosciutto", "pancetta",
    "shrimp", "crab", "lobster", "shellfish", "clam", "mussel", "oyster",
    "chorizo", "pepperoni", "salami",
  ],
};

/**
 * Returns true if the recipe passes ALL of the user's dietary restrictions.
 */
export function recipePassesDiet(recipe, restrictions) {
  if (!restrictions || restrictions.length === 0 || restrictions.includes("None")) return true;
  if (!recipe.ingredients || recipe.ingredients.length === 0) return true;

  const ingLower = recipe.ingredients.map(i => i.toLowerCase());

  for (const restriction of restrictions) {
    const excluded = RESTRICTION_FILTERS[restriction];
    if (!excluded) continue;
    for (const keyword of excluded) {
      if (ingLower.some(ing => ing.includes(keyword))) return false;
    }
  }
  return true;
}
