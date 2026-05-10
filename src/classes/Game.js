import Cup from './Cup.js';
import Customer from './Customer.js';
import { Renderer } from './Renderer.js';
import { INGREDIENT_KEYS, TEMPERATURE_KEYS, SHOP_ITEMS } from '../constants.js';

const STATES = {
  START: 'START',
  PLAYING: 'PLAYING',
  GAME_OVER: 'GAME_OVER'
};

export default class Game {
  constructor() {
    this.renderer = new Renderer('gameCanvas');
    this.canvas = document.getElementById('gameCanvas');
    
    this.totalMoney = 0;
    this.sessionMoney = 0;
    this.highScore = 0;
    this.totalOrders = 0;
    this.level = 1;
    this.difficulty = 1;
    this.state = STATES.START;
    this.targetTotal = 0;
    this.tooMuchTriggered = false;
    this.isPerfect = false;
    this.comboCount = 0;
    this.isMorningRush = false;
    this.shiftTime = 0;
    this.shiftDuration = 90; // 1.5 minutes
    this.shakeIntensity = 0;
    this.currentLevelColor = '#FDF2F4';
    this.lastTime = performance.now();
    this.ownedItems = new Set();
    this.selectedPastry = null; // New state for bakery case

    this.loadProgress();

    // Core Actors
    this.cup = new Cup(this.canvas.width / 2, 420);
    this.customer = new Customer();
    
    // Pouring State
    this.activeIngredients = new Set();
    
    // Feedback/VFX
    this.feedbacks = [];
    this.steamParticles = [];
    
    // UI References
    this.scoreEl = document.getElementById('score');
    this.levelEl = document.getElementById('level');
    this.messageEl = document.getElementById('message');
    this.orderCard = document.getElementById('order-card');
    
    this.landingPage = document.getElementById('landing-page');
    this.shopPage = document.getElementById('shop-page');
    this.shopGrid = document.getElementById('shop-items-grid');
    this.gameOverMsg = document.getElementById('game-over-msg');
    
    this.setupInput();
    this.initShop();
    this.updateMoneyUI(); // Initial UI sync
    this.showStartScreen();
  }

  loadProgress() {
    this.totalMoney = 0;
    this.highScore = 0;
    this.level = 1;
    this.totalOrders = 0;
    this.ownedItems = new Set();
    
    const savedMoney = localStorage.getItem('barista_total_money');
    const savedHighScore = localStorage.getItem('barista_high_score');
    const savedLevel = localStorage.getItem('barista_level');
    const savedOrders = localStorage.getItem('barista_total_orders');
    const savedOwned = localStorage.getItem('barista_owned_items');
    
    if (savedMoney) this.totalMoney = parseFloat(savedMoney);
    if (savedHighScore) this.highScore = parseFloat(savedHighScore);
    if (savedOrders) this.totalOrders = parseInt(savedOrders);
    if (savedLevel) {
      this.level = parseInt(savedLevel);
      this.difficulty = 1 + (this.level - 1) * 0.2;
    }
    if (savedOwned) {
      try {
        const owned = JSON.parse(savedOwned);
        this.ownedItems = new Set(owned);
      } catch (e) {
        console.error("Failed to load owned items", e);
      }
    }
    
    this.updateMoneyUI();
  }

  saveProgress() {
    localStorage.setItem('barista_total_money', this.totalMoney.toString());
    localStorage.setItem('barista_high_score', this.highScore.toString());
    localStorage.setItem('barista_level', this.level.toString());
    localStorage.setItem('barista_total_orders', this.totalOrders.toString());
    localStorage.setItem('barista_owned_items', JSON.stringify(Array.from(this.ownedItems)));
  }

  updateMoneyUI() {
    const moneyStr = this.totalMoney.toFixed(2);
    const moneyDisplay = moneyStr.padStart(6, '0');
    
    if (this.scoreEl) this.scoreEl.textContent = moneyDisplay;
    
    const shopMoney = document.getElementById('shop-money');
    if (shopMoney) shopMoney.textContent = '$' + moneyStr;
    
    const landingMoney = document.getElementById('landing-money');
    if (landingMoney) landingMoney.textContent = '$' + moneyStr;

    const landingHighScore = document.getElementById('landing-high-score');
    if (landingHighScore) landingHighScore.textContent = '$' + this.highScore.toFixed(2);
  }

  initShop() {
    if (!this.shopGrid) return;
    this.shopGrid.innerHTML = '';
    
    SHOP_ITEMS.forEach(item => {
      const card = document.createElement('div');
      card.className = `shop-item-card group bg-white/40 rounded-[32px] p-6 border-2 border-[#BCAAA4]/20 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-sm transition-all`;
      card.dataset.itemId = item.id;
      
      card.innerHTML = `
        <div class="shop-icon-container w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all" style="background-color: ${item.color}">
           <span class="text-2xl">${item.icon}</span>
        </div>
        <h3 class="text-sm font-bold uppercase tracking-widest text-[#5D4037] mb-1">${item.name}</h3>
        <p class="text-[10px] text-[#A67B5B] opacity-60 mb-4 font-medium italic">${item.desc}</p>
        <button class="shop-buy-btn mt-auto px-6 py-2 rounded-full text-[10px] font-bold transition-all cursor-pointer">
          $${item.cost.toFixed(2)}
        </button>
      `;
      
      const buyBtn = card.querySelector('.shop-buy-btn');
      buyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.buyItem(item);
      });
      
      this.shopGrid.appendChild(card);
    });
  }

  buyItem(item) {
    if (this.ownedItems.has(item.id)) return;
    
    if (this.totalMoney >= item.cost) {
      this.totalMoney -= item.cost;
      this.ownedItems.add(item.id);
      this.saveProgress();
      this.updateMoneyUI();
      this.showShop(); // Refresh UI
      this.triggerFeedback(`UNLOCKED: ${item.name.toUpperCase()}!`);
      
      const card = document.querySelector(`[data-item-id="${item.id}"]`);
      if (card) {
        card.classList.add('ring-4', 'ring-[#00E676]', 'ring-offset-2');
        setTimeout(() => card.classList.remove('ring-4', 'ring-[#00E676]', 'ring-offset-2'), 1000);
      }
    } else {
      const btn = document.querySelector(`[data-item-id="${item.id}"] .shop-buy-btn`);
      if (btn) {
        btn.classList.add('bg-red-200', 'text-red-600');
        setTimeout(() => btn.classList.remove('bg-red-200', 'text-red-600'), 500);
      }
      this.triggerFeedback('NEED MORE FUNDS!');
    }
  }

  setupInput() {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();

      if (this.state === STATES.START) {
        // No auto-start with keys in start state, use button
        return;
      }
      
      if (this.state === STATES.GAME_OVER) {
        this.showShop();
        return;
      }

      if (this.state === STATES.PLAYING) {
        // Handle Ingredients
        if (INGREDIENT_KEYS[key]) {
          if (e.repeat) return; // Prevent auto-repeat from adding ingredients to the next cup
          const ingredient = INGREDIENT_KEYS[key];
          
          // 1. Level Checks for Standard Ingredients
          if (ingredient === 'matcha' && this.level < 2) return;
          if (ingredient === 'caramel' && this.level < 3) return;
          if (ingredient === 'walnutSyrup' && this.level < 4) return;
          
          // 2. Shop Checks for Premium Ingredients
          const isPremium = ['almondMilk', 'lavenderSyrup', 'whippedCream'].includes(ingredient);
          if (isPremium && !this.ownedItems.has(ingredient)) return;

          this.activeIngredients.add(ingredient);
          this.cup.ripple = 10; // Trigger bounce ripple
        }

        // Handle Pastries (Cycle through)
        if (key === 'p' && this.ownedItems.has('croissants')) {
            const pastries = ['croissant', 'cookie', 'muffin'];
            if (!this.selectedPastry) {
                this.selectedPastry = 'croissant';
            } else {
                const currentIndex = pastries.indexOf(this.selectedPastry);
                this.selectedPastry = pastries[(currentIndex + 1) % pastries.length];
            }
            this.triggerFeedback(`SELECTED: ${this.selectedPastry.toUpperCase()}`);
        }
        
        // Handle Temperature
        if (key === 'i') {
          const newTemp = this.cup.temperature === 'iced' ? 'hot' : 'iced';
          this.cup.setTemperature(newTemp);
          this.triggerFeedback(newTemp === 'iced' ? 'ICE ADDED!' : 'HOT MODE');
        } else if (key === 'h') {
          this.cup.setTemperature('hot');
          this.triggerFeedback('HOT MODE');
        }

        // Handle Trash
        if (key === 't' || key === 'delete' || key === 'backspace') {
          this.activeIngredients.clear();
          this.cup.reset();
          this.triggerFeedback('TRASHED!');
          this.cup.ripple = 20;
          this.comboCount = 0;
          this.isMorningRush = false;
        }

        // Handle Serve (Space)
        if (e.code === 'Space') {
          e.preventDefault();
          this.checkOrder();
        }
        
        // Visual feedback for kbd elements
        let kbdKey = key;
        if (e.code === 'Space') kbdKey = 'space';
        if (key === 'delete' || key === 'backspace') kbdKey = 't';

        const kbd = Array.from(document.querySelectorAll('kbd'))
          .find(k => k.textContent.trim().toLowerCase() === kbdKey);
        if (kbd) kbd.classList.add('bg-white', 'text-black', 'scale-110');
      }
    });

    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (this.state === STATES.START) {
                this.startGame();
            }
        });
    }

    const landingShopBtn = document.getElementById('landing-shop-btn');
    if (landingShopBtn) {
      landingShopBtn.addEventListener('click', () => {
        this.showShop();
      });
    }

    const shopBackBtn = document.getElementById('shop-back-btn');
    if (shopBackBtn) {
      shopBackBtn.addEventListener('click', () => {
        this.showStartScreen();
      });
    }

    const shopStartBtn = document.getElementById('shop-start-btn');
    if (shopStartBtn) {
      shopStartBtn.addEventListener('click', () => {
        this.startGame();
      });
    }

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (INGREDIENT_KEYS[key]) {
        this.activeIngredients.delete(INGREDIENT_KEYS[key]);
      }
      
      let kbdKey = key;
      if (e.code === 'Space') kbdKey = 'space';
      if (key === 'delete' || key === 'backspace') kbdKey = 't';

      const kbd = Array.from(document.querySelectorAll('kbd'))
        .find(k => k.textContent.trim().toLowerCase() === kbdKey);
      if (kbd) kbd.classList.remove('bg-white', 'text-black', 'scale-110');
    });
  }

  showStartScreen() {
    this.state = STATES.START;
    this.updateMoneyUI();
    this.levelEl.textContent = this.level.toString().padStart(2, '0');
    
    // Update Landing Stats
    document.getElementById('landing-level').textContent = this.level.toString().padStart(2, '0');
    document.getElementById('landing-orders').textContent = this.totalOrders;

    this.landingPage.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    this.landingPage.classList.add('opacity-100');
    this.shopPage.classList.add('hidden');
    this.orderCard.classList.add('hidden');
    
    // Hide the in-game overlay
    this.messageEl.parentElement.classList.add('hidden');
    
    if (this.sessionMoney > 0) {
        this.gameOverMsg.classList.remove('hidden');
    } else {
        this.gameOverMsg.classList.add('hidden');
    }
  }

  showShop() {
    this.state = STATES.START;
    this.landingPage.classList.add('hidden');
    this.shopPage.classList.remove('hidden');
    this.messageEl.parentElement.classList.add('hidden');
    
    this.updateMoneyUI();
    document.getElementById('shop-level').textContent = this.level.toString().padStart(2, '0');
    
    // Update all items in the grid
    SHOP_ITEMS.forEach(item => {
      const card = document.querySelector(`[data-item-id="${item.id}"]`);
      if (!card) return;
      
      const isOwned = this.ownedItems.has(item.id);
      const isLevelLocked = this.level < item.levelRequired;
      const iconContainer = card.querySelector('.shop-icon-container');
      const buyBtn = card.querySelector('.shop-buy-btn');
      
      if (isOwned) {
        iconContainer.classList.remove('grayscale', 'opacity-50', 'blur-[2px]');
        buyBtn.textContent = 'OWNED';
        buyBtn.className = 'shop-buy-btn mt-auto px-6 py-2 bg-[#00E676]/20 rounded-full text-[10px] font-bold text-[#00E676] cursor-default';
        card.classList.remove('opacity-80');
      } else if (isLevelLocked) {
        iconContainer.classList.add('grayscale', 'opacity-50', 'blur-[2px]');
        buyBtn.className = 'shop-buy-btn mt-auto px-6 py-2 bg-[#BCAAA4]/20 rounded-full text-[10px] font-bold text-[#A67B5B] cursor-not-allowed opacity-50';
        buyBtn.textContent = `LOCKED (LVL ${item.levelRequired})`;
      } else {
        // Not owned, but level reached
        iconContainer.classList.remove('grayscale', 'opacity-50', 'blur-[2px]');
        
        if (this.totalMoney >= item.cost) {
          buyBtn.className = 'shop-buy-btn mt-auto px-6 py-2 bg-[#A67B5B] text-white rounded-full text-[10px] font-bold cursor-pointer hover:bg-[#5D4037] hover:scale-105 active:scale-95 shadow-md transition-all';
          buyBtn.innerHTML = `<span>PURCHASE: $${item.cost.toFixed(2)}</span>`;
        } else {
          buyBtn.className = 'shop-buy-btn mt-auto px-6 py-2 bg-[#BCAAA4]/20 rounded-full text-[10px] font-bold text-[#A67B5B] cursor-not-allowed opacity-50';
          buyBtn.textContent = `$${item.cost.toFixed(2)}`;
        }
      }
    });
  }

  startGame() {
    this.state = STATES.PLAYING;
    this.sessionMoney = 0;
    this.shiftTime = 0; // Reset timer
    this.lastTime = performance.now(); // Reset delta timer
    this.comboCount = 0;
    this.isMorningRush = false;
    
    // Hide game over overlays
    this.messageEl.parentElement.classList.add('hidden');
    this.gameOverMsg.classList.add('hidden'); // Also hide the landing page game over msg
    
    this.landingPage.classList.remove('opacity-100');
    this.landingPage.classList.add('opacity-0', 'pointer-events-none');
    this.shopPage.classList.add('hidden');
    
    setTimeout(() => {
        if (this.state === STATES.PLAYING) {
            this.landingPage.classList.add('hidden');
        }
    }, 1000); 
    this.orderCard.classList.remove('hidden');
    this.nextCustomer();
  }

  nextCustomer() {
    this.activeIngredients.clear();
    this.customer = new Customer(this.canvas.width, this.level, this.difficulty, this.ownedItems);
    this.cup = new Cup(this.canvas.width / 2, 420);
    this.selectedPastry = null; // Reset selection for new order
    // Information Theory Flex: Shannon Entropy increases as high-level orders 
    // combine more ingredients, requiring more bits of information to fulfill correctly.
    this.cup.setTemperature(Math.random() > 0.5 ? 'hot' : 'iced'); 
    this.tooMuchTriggered = false;
    
    // Calculate total volume required for this order
    this.targetTotal = Object.values(this.customer.requiredIngredients).reduce((a, b) => a + b, 0);
    
    this.orderCard.classList.remove('hidden');
    document.getElementById('order-name').textContent = this.customer.orderName;
    document.getElementById('order-temp').textContent = this.customer.requiredTemperature.toUpperCase();
    this.renderOrderUI();
  }

  renderOrderUI() {
    const ingredientsList = document.getElementById('order-ingredients');
    ingredientsList.innerHTML = '';
    
    // Display Temp
    const tempTag = document.createElement('div');
    tempTag.className = `px-3 py-1 rounded-xl text-[10px] font-black uppercase ${this.customer.requiredTemperature === 'iced' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`;
    tempTag.textContent = this.customer.requiredTemperature;
    ingredientsList.appendChild(tempTag);

    const reqData = this.customer.requiredIngredients;
    const names = { 
        espresso: 'Espresso', 
        oatMilk: 'Oat Milk', 
        berrySyrup: 'Berry', 
        matcha: 'Matcha', 
        caramel: 'Caramel', 
        walnutSyrup: 'Walnut',
        almondMilk: 'Almond Milk',
        lavenderSyrup: 'Lavender',
        whippedCream: 'Whipped Cream'
    };
    
    for (let ing in reqData) {
      if (reqData[ing] > 0) {
        const item = document.createElement('div');
        item.className = 'bg-[#FDF2F4] rounded-xl px-3 py-1 border border-[#BCAAA4]/20 text-[9px] font-black uppercase flex justify-between items-center gap-2';
        const targetPercent = Math.round(reqData[ing] * 100);
        item.innerHTML = `<span>${names[ing] || ing}</span><span class="text-[#A67B5B] opacity-60">${targetPercent}%</span>`;
        ingredientsList.appendChild(item);
      }
    }

    // Display Required Pastry
    if (this.customer.requiredPastry) {
        const item = document.createElement('div');
        item.className = 'bg-[#FFF8E7] rounded-xl px-3 py-1 border-2 border-[#E6B980]/40 text-[9px] font-black uppercase flex items-center gap-2 animate-bounce';
        const icons = { croissant: '🥐', cookie: '🍪', muffin: '🧁' };
        item.innerHTML = `<span>${icons[this.customer.requiredPastry]}</span> <span>${this.customer.requiredPastry}</span>`;
        ingredientsList.appendChild(item);
    }
  }

  checkOrder() {
    const cupData = this.cup.ingredients;
    const reqData = this.customer.requiredIngredients;
    
    const targetTotal = Object.values(reqData).reduce((a, b) => a + b, 0);
    const cupTotal = this.cup.getTotal();

    let diff = 0;
    // Iterate over all possible ingredients to catch extras in the cup
    const allIngredients = Object.keys(this.cup.ingredients);
    for (let key of allIngredients) {
      const actual = cupData[key] || 0;
      const required = reqData[key] || 0;
      diff += Math.abs(actual - required);
    }

    // Minimum volume required to serve
    if (cupTotal >= targetTotal * 0.7) {
      const isCorrectTemp = this.cup.temperature === this.customer.requiredTemperature;
      
      if (!isCorrectTemp) {
        this.activeIngredients.clear();
        this.triggerFeedback('WRONG TEMP!');
        this.cup.reset();
        this.cup.ripple = 40;
        this.comboCount = 0;
        this.isMorningRush = false;
        return;
      }

      const isCorrectPastry = this.selectedPastry === this.customer.requiredPastry;
      if (!isCorrectPastry) {
        this.triggerFeedback('MISSING PASTRY!');
        this.selectedPastry = null;
        this.comboCount = 0;
        this.isMorningRush = false;
        return;
      }

      if (diff < 0.3) {
        const isPerfect = diff < 0.1;
        if (isPerfect) {
          this.comboCount++;
          if (this.comboCount >= 3) {
            this.isMorningRush = true;
          }
        } else {
          this.comboCount = 0;
          this.isMorningRush = false;
        }

        const modeMult = 1.0; // Standardized
        const rushMult = this.isMorningRush ? 2.0 : 1.0;
        
        // Premium Multiplier for shop upgrades
        let shopMult = 1.0;
        if (this.ownedItems.has('almondMilk')) shopMult += 0.2;
        if (this.ownedItems.has('lavenderSyrup')) shopMult += 0.1;
        if (this.ownedItems.has('whippedCream')) shopMult += 0.15;
        
        const reward = Math.round(15 * (1 - diff) * this.difficulty * modeMult * rushMult * shopMult);
        this.sessionMoney += reward;
        this.totalMoney += reward;
        this.totalOrders++;
        
        // Floating Score Bubble
        this.feedbacks.push({
          text: `+$${reward.toFixed(2)}`,
          x: this.cup.x,
          y: this.cup.y - 120,
          startY: this.cup.y - 120,
          targetY: this.cup.y - 250, 
          life: 1.0,
          type: 'score'
        });

        // Update UI
        this.updateMoneyUI();
        
        // Level up check
        const newLevel = Math.floor(this.totalMoney / 50) + 1;
        if (newLevel > this.level) {
          this.level = newLevel;
          this.difficulty = 1 + (this.level - 1) * 0.2;
          this.levelEl.textContent = this.level.toString().padStart(2, '0');
          this.triggerFeedback('LEVEL UP!');
        } else if (cupTotal > targetTotal * 1.1) {
          this.triggerFeedback('TOO MUCH!');
        } else {
          this.triggerFeedback(isPerfect ? 'PERFECT!' : 'DELICIOUS!');
          if (this.isMorningRush && isPerfect) {
            this.triggerFeedback('x2 TIPS!');
          }
        }

        this.saveProgress();
        this.nextCustomer();
      } else {
        this.activeIngredients.clear();
        this.triggerFeedback('WRONG ORDER!');
        this.cup.reset();
        this.cup.ripple = 20; 
        this.comboCount = 0;
        this.isMorningRush = false;
      }
    } else {
        this.triggerFeedback('NEED MORE!');
    }
  }

  triggerFeedback(text) {
    // Add text feedback
    this.feedbacks.push({
      type: 'text',
      text: text,
      x: this.canvas.width / 2,
      y: 350,
      alpha: 1.0,
      life: 1.0,
      velocity: -1.5
    });

    // Add confetti particles
    for (let i = 0; i < 40; i++) {
        this.feedbacks.push({
            type: 'particle',
            x: this.canvas.width / 2,
            y: 380,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 10 - 5,
            color: ['#F4ACB7', '#FFB6C1', '#A67B5B', '#FFF9F1'][Math.floor(Math.random() * 4)],
            size: Math.random() * 6 + 2,
            life: 1.0,
            rotation: Math.random() * Math.PI * 2,
            vr: (Math.random() - 0.5) * 0.2
        });
    }
    
    // Bounce the cup!
    this.cup.ripple = 30;
  }

  gameOver() {
    this.state = STATES.GAME_OVER;
    this.shakeIntensity = 15; // Trigger final shake
    
    let isNewRecord = false;
    // Update High Score if current shift was better
    if (this.sessionMoney > this.highScore) {
      this.highScore = this.sessionMoney;
      isNewRecord = true;
      this.triggerFeedback('NEW RECORD!');
    }
    
    this.saveProgress();
    
    const recordText = isNewRecord ? "<span class='block text-[#A67B5B] text-sm mt-2'>★ NEW BEST SHIFT ★</span>" : "";
    this.messageEl.innerHTML = `<div>SHIFT ENDED!<br/>Session: $${this.sessionMoney.toFixed(2)}${recordText}<br/><span class='text-sm opacity-60'>Press any key</span></div>`;
    this.messageEl.parentElement.classList.remove('hidden');
    this.orderCard.classList.add('hidden');
  }

  update(dt) {
    if (this.state !== STATES.PLAYING) return;
    
    // Update active pours
    if (this.activeIngredients.size > 0) {
      this.activeIngredients.forEach(ing => {
        // Use dt to normalize pour speed (dt/16.67 scales normalized 60fps to current refresh rate)
        this.cup.addIngredient(ing, 0.005 * (dt / 16.67)); 
      });

      // Perfection Check for real-time feedback (Glow)
      let diff = 0;
      Object.keys(this.customer.requiredIngredients).forEach(ing => {
        const target = this.customer.requiredIngredients[ing];
        const actual = this.cup.ingredients[ing];
        diff += Math.abs(target - actual);
      });
      // Within 2% of perfection
      this.isPerfect = diff < 0.03 && this.cup.getTotal() > 0.1;

      // Overfill detection
      if (this.cup.getTotal() > this.targetTotal * 1.1 && !this.tooMuchTriggered) {
        this.triggerFeedback('TOO MUCH!');
        this.tooMuchTriggered = true;
        // Immediate patience penalty
        this.customer.patience -= 5;
      } else if (this.cup.getTotal() <= this.targetTotal * 1.1) {
        this.tooMuchTriggered = false;
      }

      // Auto-submit if full
      if (this.cup.getTotal() >= 0.98) {
        this.checkOrder();
      }
    }

    this.cup.update();
    this.customer.update(dt);

    // Check if customer ran out of patience
    if (this.customer.isAngry) {
      this.triggerFeedback('ANGRY CUSTOMER!');
      this.comboCount = 0;
      this.isMorningRush = false;
      this.nextCustomer();
    }
    
    // Increment Shift Time (dt is in ms)
    this.shiftTime += dt / 1000;
    if (this.shiftTime >= this.shiftDuration) {
      this.gameOver();
    }

    // Update UI Progress
    const shiftProgress = document.getElementById('shift-progress');
    if (shiftProgress) {
        shiftProgress.style.width = (Math.min(this.shiftTime / this.shiftDuration, 1) * 100) + '%';
    }

    // Countdown UI sync
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
      const secondsLeft = Math.max(0, Math.ceil(this.customer.patience));
      countdownEl.textContent = secondsLeft + 's';
      
      // Color based on urgency
      if (this.customer.patience < 5) {
        countdownEl.classList.add('text-red-500', 'border-red-200');
        countdownEl.classList.remove('text-gray-400', 'border-pink-200');
      } else {
        countdownEl.classList.remove('text-red-500', 'border-red-200');
        countdownEl.classList.add('text-gray-400', 'border-pink-200');
      }
    }

    // Shake Decay
    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= 0.9;
    } else {
      this.shakeIntensity = 0;
    }

    // Dynamic Lighting (Level-based background shift)
    this.updateLighting();

    // Update Feedbacks
    this.feedbacks = this.feedbacks.filter(f => {
        f.life -= 0.02;
        if (f.type === 'text') {
            f.y += f.velocity;
            f.alpha = f.life;
        } else if (f.type === 'particle') {
            f.x += f.vx;
            f.y += f.vy;
            f.vy += 0.4; // Gravity
            f.rotation += f.vr;
        }
        return f.life > 0;
    });

    // Update Steam Particles (Continuous VFX)
    if (this.cup.temperature === 'hot' && this.cup.getTotal() > 0.05) {
        if (Math.random() > 0.8) {
            this.steamParticles.push({
                x: this.cup.x + (Math.random() - 0.5) * 60,
                y: this.cup.y - (this.cup.getTotal() * this.cup.height) - 10,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 1.5 - 0.5,
                life: 1.0,
                size: Math.random() * 8 + 4
            });
        }
    }

    this.steamParticles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.01;
        p.size += 0.1; // Grow as it dissipates
    });
    this.steamParticles = this.steamParticles.filter(p => p.life > 0);

    // Update isMorningRush effect
    const rushText = document.querySelector('header span.text-xl');
    if (rushText) {
      if (this.isMorningRush) {
        rushText.classList.add('animate-pulse', 'text-orange-600');
        rushText.style.textShadow = '0 0 10px rgba(234, 88, 12, 0.6)';
      } else {
        rushText.classList.remove('animate-pulse', 'text-orange-600');
        rushText.style.textShadow = 'none';
      }
    }

    // UI Updates
    const patienceBar = document.getElementById('patience-bar');
    const pPercent = (this.customer.patience / this.customer.maxPatience) * 100;
    if (patienceBar) patienceBar.style.width = pPercent + '%';
  }

  updateLighting() {
    const container = document.getElementById('game-container');
    const shiftLabel = document.getElementById('shift-name');
    if (!container) return;

    // Shift Color Timeline
    const shifts = [
      { name: 'Morning Rush', color: { r: 253, g: 242, b: 244 }, start: 0 },   // #FDF2F4
      { name: 'Noon Lull', color: { r: 255, g: 252, b: 245 }, start: 25 },    // Very bright
      { name: 'Afternoon Peak', color: { r: 255, g: 241, b: 224 }, start: 50 }, // Golden
      { name: 'Evening Shift', color: { r: 255, g: 224, b: 178 }, start: 70 }, // Sunset orange
      { name: 'Night Shift', color: { r: 232, g: 234, b: 246 }, start: 85 }    // Indigo
    ];

    let currentShift = shifts[0];
    let nextShift = shifts[0];
    
    for (let i = 0; i < shifts.length; i++) {
      if (this.shiftTime >= shifts[i].start) {
        currentShift = shifts[i];
        nextShift = shifts[i + 1] || shifts[i];
      }
    }

    const nextStart = nextShift === currentShift ? this.shiftDuration : nextShift.start;
    const shiftRange = nextStart - currentShift.start;
    const blend = shiftRange > 0 ? Math.min((this.shiftTime - currentShift.start) / shiftRange, 1) : 1;

    const r = Math.round(currentShift.color.r + (nextShift.color.r - currentShift.color.r) * blend);
    const g = Math.round(currentShift.color.g + (nextShift.color.g - currentShift.color.g) * blend);
    const b = Math.round(currentShift.color.b + (nextShift.color.b - currentShift.color.b) * blend);
    
    const colorStr = `rgb(${r}, ${g}, ${b})`;
    if (this.currentLevelColor !== colorStr) {
      this.currentLevelColor = colorStr;
      container.style.backgroundColor = colorStr;
      document.body.style.backgroundColor = colorStr;
      
      if (this.landingPage) this.landingPage.style.backgroundColor = colorStr;
      if (shiftLabel) {
        shiftLabel.textContent = currentShift.name;
      }
    }

    // Last Call Blinking
    if (shiftLabel) {
      const timeLeft = this.shiftDuration - this.shiftTime;
      if (timeLeft < 10 && timeLeft > 0) {
        shiftLabel.classList.add('text-red-500', 'animate-pulse');
        shiftLabel.textContent = `LAST CALL (${Math.ceil(timeLeft)}s)`;
      } else {
        shiftLabel.classList.remove('text-red-500', 'animate-pulse');
      }
    }
  }

  draw() {
    this.renderer.draw(this);
  }

  loop() {
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.update(dt);
    this.draw();
    requestAnimationFrame(() => this.loop());
  }
}
