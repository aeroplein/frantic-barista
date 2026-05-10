/**
 * Cup Class
 * Handles the pure mathematical state of the drink.
 * No drawing code here (Strict Separation).
 */
export default class Cup {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 110;
    this.height = 150;
    
    this.ingredients = {
      espresso: 0,
      oatMilk: 0,
      berrySyrup: 0,
      matcha: 0,
      caramel: 0,
      walnutSyrup: 0,
      almondMilk: 0,
      lavenderSyrup: 0,
      whippedCream: 0
    };
    
    this.temperature = 'hot'; // 'hot' or 'iced'
    this.maxTotal = 1.0;
    this.ripple = 0; 
    
    // Persistent ice cube data to prevent jitter in renderer
    this.generateIce();
  }

  update() {
    // Decay ripple effect
    if (this.ripple > 0) {
      this.ripple *= 0.92;
      if (this.ripple < 0.1) this.ripple = 0;
    }
  }

  generateIce() {
    this.iceCubes = [];
    const rows = 3;
    const cols = 4;
    const iceSpaceHeight = 0.25;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.iceCubes.push({
          // Packed tighter horizontally and vertically for overlap
          x: ((c / (cols - 1)) - 0.5) * 0.6 + (Math.random() - 0.5) * 0.08,
          y: -(r / (rows - 1)) * iceSpaceHeight * 0.7 - 0.05 + (Math.random() - 0.5) * 0.04,
          size: 18 + Math.random() * 6, 
          rotation: (Math.random() - 0.5) * 0.5,
          // Animation properties for floating effect
          phase: Math.random() * Math.PI * 2,
          speed: 0.5 + Math.random() * 0.5
        });
      }
    }
    // Randomize stacking order
    this.iceCubes.sort(() => Math.random() - 0.5);
  }

  setTemperature(temp) {
    this.temperature = temp;
    this.ripple = 10; // Visual feedback for switching
    if (temp === 'iced') this.generateIce();
  }

  addIngredient(type, amount = 0.005) {
    const total = this.getTotal();
    if (total < this.maxTotal) {
      this.ingredients[type] += amount;
      // Increase ripple slightly while pouring, caps at 8
      // Iced drinks splash more!
      const ripplePower = this.temperature === 'iced' ? 1.5 : 1.0;
      this.ripple = Math.min(this.ripple + ripplePower, 12);
    }
  }

  getTotal() {
    return Object.values(this.ingredients).reduce((a, b) => a + b, 0);
  }

  reset() {
    for (let key in this.ingredients) this.ingredients[key] = 0;
    this.ripple = 0;
  }
}

