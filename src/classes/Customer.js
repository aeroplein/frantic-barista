/**
 * Customer Class
 * Handles order generation and the patience timer.
 */
export default class Customer {
  constructor(canvasWidth, level = 1, scaling = 1, ownedItems = new Set()) {
    this.canvasWidth = canvasWidth;

    // Procedural scaling: higher levels add variety without making orders unreadable.
    const baseComplexity = Math.min(5, 2 + Math.floor((level - 1) / 3));
    const complexity = baseComplexity;

    // Procedural Ingredient Selection
    const ingredientPool = ['espresso', 'oatMilk', 'berrySyrup'];
    if (level >= 2) ingredientPool.push('matcha');
    if (level >= 3) ingredientPool.push('caramel');
    if (level >= 4) ingredientPool.push('walnutSyrup');

    // Add unlocked premium ingredients to pool
    if (ownedItems.has('almondMilk')) ingredientPool.push('almondMilk');
    if (ownedItems.has('lavenderSyrup')) ingredientPool.push('lavenderSyrup');
    if (ownedItems.has('whippedCream')) ingredientPool.push('whippedCream');

    const chosenIngredients = [];

    // Always start with a base
    const bases = ['espresso', 'oatMilk'];
    if (ownedItems.has('almondMilk')) bases.push('almondMilk');

    chosenIngredients.push(bases[Math.floor(Math.random() * bases.length)]);

    while (chosenIngredients.length < complexity) {
      const randIng = ingredientPool[Math.floor(Math.random() * ingredientPool.length)];
      if (!chosenIngredients.includes(randIng)) {
        chosenIngredients.push(randIng);
      }
    }

    // Distribute Volumes (Normalization)
    const ingredients = {
      espresso: 0, oatMilk: 0, berrySyrup: 0, matcha: 0,
      caramel: 0, walnutSyrup: 0, almondMilk: 0,
      lavenderSyrup: 0, whippedCream: 0
    };
    let remainingVolume = 1.0; // Always 100% full
    const totalVolume = remainingVolume;

    chosenIngredients.forEach((ing, idx) => {
      if (idx === chosenIngredients.length - 1) {
        ingredients[ing] = parseFloat(remainingVolume.toFixed(2));
      } else {
        // Give base more volume usually
        const shareFactor = (idx === 0) ? (0.4 + Math.random() * 0.2) : (0.2 + Math.random() * 0.1);
        const amount = parseFloat((remainingVolume * shareFactor).toFixed(2));
        ingredients[ing] = amount;
        remainingVolume -= amount;
      }
    });

    // Procedural Naming (Milestone names)
    const descriptors = level >= 5 ? ['Ethereal', 'Master', 'Legendary', 'Cosmic'] : ['Velvet', 'Midnight', 'Sun-Kissed', 'Rustic', 'Modern', 'Frosted'];
    const drinkTypes = { espresso: 'Latte', matcha: 'Matcha', oatMilk: 'Steamer' };
    const mainBase = chosenIngredients[0];
    const suffix = level >= 5 ? 'Reserve' : '';
    this.orderName = `${descriptors[Math.floor(Math.random() * descriptors.length)]} ${drinkTypes[mainBase] || 'Brew'} ${suffix}`.trim();

    this.requiredIngredients = ingredients;
    // Milestone: Level 5+ orders are often iced
    this.requiredTemperature = (level >= 5 && Math.random() > 0.3) ? 'iced' : (Math.random() > 0.5 ? 'iced' : 'hot');

    // Requirement: Multiple Challenges (Bakery Case)
    this.requiredPastry = null;
    const pastryChance = level < 10 ? 0.35 : 0.5;
    if (ownedItems.has('croissants') && Math.random() < pastryChance) {
      const pastries = ['croissant', 'cookie', 'muffin'];
      this.requiredPastry = pastries[Math.floor(Math.random() * pastries.length)];
    }

    // Patience settings in SECONDS
    this.maxPatience = 36 + Math.min(level, 10);
    this.patience = this.maxPatience;
    this.patienceDecay = Math.min(1.6, 0.85 * scaling);

    this.isSatisfied = false;
    this.isAngry = false;
  }

  update(dt) {
    if (this.patience > 0 && !this.isSatisfied) {
      this.patience -= (dt / 1000) * this.patienceDecay;
    } else if (this.patience <= 0) {
      this.isAngry = true;
    }
  }


  draw(ctx) {

  }
}
