/**
 * Renderer Class
 * Handles all the visual drawing work.
 * This class follows the "Strict Separation" rule: it only draws what the logic tells it.
 */
import { COLORS } from '../constants.js';

export class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Fixed resolution for consistent graphics
        this.canvas.width = 800;
        this.canvas.height = 450;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Main draw loop called by GameManager
    draw(game) {
        this.clear();

        this.ctx.save();
        if (game.shakeIntensity > 0) {
            const shakeX = (Math.random() - 0.5) * game.shakeIntensity;
            const shakeY = (Math.random() - 0.5) * game.shakeIntensity;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // 1. Draw the Counter/Table (Immersive style)
        this.drawTable();

        // 1.2 Draw Pastry Case (Bakery)
        this.drawPastryCase(game);

        // 1.5 Draw Espresso Machine Group Head
        this.drawEspressoMachine(game);

        if (game.cup) {
            // 2. Draw the Cup and its contents
            this.drawCup(game.cup, game.isPerfect);

            // 2.5 Draw Steam Particles
            this.drawSteam(game.steamParticles);
            
            // 3. Draw indicators if we are currently pouring (Icons on cup)
            this.drawPouringIndicators(game);
        }

        // 5. Draw Feedbacks (Success text, confetti)
        this.drawFeedbacks(game);

        this.ctx.restore();
    }

    drawSteam(particles) {
        if (!particles) return;
        this.ctx.save();
        particles.forEach(p => {
            this.ctx.globalAlpha = p.life * 0.4; // Soft transparency
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    drawFeedbacks(game) {
        if (!game.feedbacks || game.feedbacks.length === 0) return;

        game.feedbacks.forEach(f => {
            this.ctx.save();
            this.ctx.globalAlpha = f.life;

            if (f.type === 'text') {
                this.ctx.fillStyle = '#4E342E';
                this.ctx.font = '900 24px Inter';
                this.ctx.textAlign = 'center';
                
                // Shadow for visibility
                this.ctx.shadowBlur = 4;
                this.ctx.shadowColor = 'rgba(0,0,0,0.3)';
                
                this.ctx.fillText(f.text, f.x, f.y);
            } else if (f.type === 'score') {
                // Lerp upward movement: y = y + (targetY - y) * 0.1
                f.y += (f.targetY - f.y) * 0.05;

                this.ctx.fillStyle = '#2E7D32'; // Success Green
                this.ctx.font = 'italic bold 28px Playfair Display';
                this.ctx.textAlign = 'center';
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = 'rgba(165, 214, 167, 0.5)';
                this.ctx.fillText(f.text, f.x, f.y);
            } else if (f.type === 'particle') {
                this.ctx.fillStyle = f.color;
                this.ctx.translate(f.x, f.y);
                this.ctx.rotate(f.rotation);
                this.ctx.fillRect(-f.size/2, -f.size/2, f.size, f.size);
            }

            this.ctx.restore();
        });
    }

    drawPouringIndicators(game) {
        const { activeIngredients, cup, ctx = this.ctx } = game;
        const names = { 
            espresso: 'Espresso', 
            oatMilk: 'Oat Milk', 
            berrySyrup: 'Berry', 
            matcha: 'Matcha', 
            caramel: 'Caramel', 
            walnutSyrup: 'Walnut',
            almondMilk: 'Almond',
            lavenderSyrup: 'Lavender',
            whippedCream: 'Cream'
        };
        
        // 1. Draw Active Pouring Icons directly on the cup
        if (activeIngredients && activeIngredients.size > 0) {
            let index = 0;
            const time = Date.now();
            
            activeIngredients.forEach(ingKey => {
                const amount = cup.ingredients[ingKey] || 0;
                const color = COLORS[ingKey];
                
                ctx.save();
                // Position on the cup body, stacked vertically
                const stackY = cup.y - cup.height/2 - (index * 52) + 20;
                ctx.translate(cup.x, stackY);
                
                // Pulsing effect for active pouring
                const pulse = 1 + Math.sin(time / 100) * 0.05;
                ctx.scale(pulse, pulse);

                // Semi-transparent Icon circular background (Glassy feel)
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, 0, 24, 0, Math.PI * 2);
                ctx.fill();
                
                // Progressive fill ring
                ctx.globalAlpha = 0.9;
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, 0, 19, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * Math.min(amount, 1)));
                ctx.stroke();

                // Initial/Symbol
                ctx.fillStyle = '#FFFFFF';
                ctx.font = 'black 16px Inter';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ingKey[0].toUpperCase(), 0, 0);
                
                // Percentage Text
                ctx.font = 'bold 9px Inter';
                this.ctx.fillStyle = '#4E342E';
                this.ctx.fillText(Math.round(amount * 100) + '%', 0, 38);
                
                ctx.restore();
                index++;
            });
        }

        // 2. Persistent Content Summary (Subtle readout on the left side)
        this.ctx.save();
        const summaryX = cup.x - cup.width / 2 - 140;
        const summaryY = cup.y - 80;
        
        this.ctx.translate(summaryX, summaryY);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.font = 'bold 9px Inter';
        this.ctx.fillText("CURRENT CONTENTS", 0, -10);

        let contentIndex = 0;
        for (let ing in cup.ingredients) {
            const val = cup.ingredients[ing];
            if (val > 0.01) {
                this.ctx.fillStyle = COLORS[ing];
                this.ctx.fillRect(0, contentIndex * 14, 4, 10);
                this.ctx.fillStyle = '#4E342E';
                this.ctx.font = '500 10px Inter';
                this.ctx.fillText(`${names[ing]}: ${Math.round(val * 100)}%`, 8, contentIndex * 14 + 9);
                contentIndex++;
            }
        }
        this.ctx.restore();
    }

    drawTable() {
        this.ctx.strokeStyle = '#BCAAA4';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 420);
        this.ctx.lineTo(800, 420);
        this.ctx.stroke();
        
        // Add a slight shadow under where the cup sits
        const gradient = this.ctx.createRadialGradient(400, 420, 5, 400, 420, 100);
        gradient.addColorStop(0, 'rgba(188, 170, 164, 0.2)');
        gradient.addColorStop(1, 'rgba(188, 170, 164, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(300, 410, 200, 20);
    }

    drawEspressoMachine(game) {
        const { ctx } = this;
        const centerX = 400;
        const topY = 180;
        const width = 120;
        const height = 40;
        const isEspressoActive = game.activeIngredients.has('espresso');
        const time = Date.now();

        ctx.save();
        
        // Machine Shaking during brewing
        if (isEspressoActive) {
            const shakeX = Math.sin(time / 40) * (isEspressoActive ? 2 : 0);
            const shakeY = Math.cos(time / 30) * (isEspressoActive ? 1 : 0);
            ctx.translate(shakeX, shakeY);
        }

        // 1. Group Head Body (Brushed Metallic Look)
        const gradient = ctx.createLinearGradient(centerX - width/2, 0, centerX + width/2, 0);
        gradient.addColorStop(0, '#616161');
        gradient.addColorStop(0.5, '#E0E0E0');
        gradient.addColorStop(1, '#616161');
        
        ctx.fillStyle = gradient;
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 3;
        
        // Rounded head
        ctx.beginPath();
        ctx.roundRect(centerX - width/2, topY - height, width, height, [12, 12, 2, 2]);
        ctx.fill();
        ctx.stroke();

        // 2. Pressure Gauge (Technical Detail)
        ctx.save();
        ctx.translate(centerX - width/4, topY - height/2);
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Gauge Needle
        ctx.strokeStyle = '#D32F2F';
        ctx.lineWidth = 2;
        const angle = isEspressoActive ? 
            (Math.PI * 0.2 + Math.sin(time / 50) * 0.1) : // Vibrating in "Green Zone" when on
            (-Math.PI * 0.5); // Resting at zero
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * 10, Math.sin(angle) * 10);
        ctx.stroke();
        ctx.restore();

        // 3. Portafilter Handle (Wooden or Black Plastic)
        ctx.fillStyle = '#3E2723';
        ctx.beginPath();
        ctx.roundRect(centerX + width/2 - 5, topY - height + 10, 85, 18, 6);
        ctx.fill();
        ctx.stroke();

        // 4. Spout (Where the magic happens)
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.moveTo(centerX - 12, topY);
        ctx.lineTo(centerX - 18, topY + 18);
        ctx.lineTo(centerX + 18, topY + 18);
        ctx.lineTo(centerX + 12, topY);
        ctx.fill();
        ctx.stroke();

        // 5. Indicator Light (Glowing status)
        const lightColor = isEspressoActive ? '#00E676' : '#FF1744';
        ctx.fillStyle = lightColor;
        if (isEspressoActive) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = lightColor;
        }
        ctx.beginPath();
        ctx.arc(centerX + width/2 - 20, topY - height/2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow
        
        // Active "Brewing" Steam if espresso is on
        if (isEspressoActive) {
            this.drawBrewingSteam(game, centerX, topY + 20);
        }

        // Draw Liquid Streams for ALL active ingredients
        if (game.activeIngredients.size > 0) {
            let streamIndex = 0;
            game.activeIngredients.forEach(ingKey => {
                // Espresso comes from the machine spout, others from nearby "invisible" dispensers
                const startX = ingKey === 'espresso' ? centerX : (centerX - 60 + (streamIndex * 30));
                const startY = ingKey === 'espresso' ? topY + 18 : topY - 20;
                this.drawLiquidStream(game, startX, startY, COLORS[ingKey]);
                streamIndex++;
            });
        }

        ctx.restore();
    }

    drawBrewingSteam(game, x, y) {
        const { ctx } = this;
        const time = Date.now();
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#FFFFFF';
        
        for (let i = 0; i < 5; i++) {
            const offset = (time / 1000 + i * 0.2) % 1.0;
            const size = 10 + offset * 30;
            const alpha = (1.0 - offset) * 0.5;
            const driftX = Math.sin(time / 200 + i) * 20;
            const driftY = offset * 60;
            
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(x + driftX, y - driftY, size/2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawLiquidStream(game, x, y, color) {
        const { ctx } = this;
        const targetX = game.cup.x;
        const targetY = game.cup.y - (game.cup.getTotal() * game.cup.height);
        const time = Date.now();

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 4 + Math.sin(time / 50) * 1.5; // Pulsing stream thickness
        
        // Wavy stream logic
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        const segments = 10;
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const sx = x + (targetX - x) * t + Math.sin(time / 100 + t * 5) * 3;
            const sy = y + (targetY - y) * t;
            ctx.lineTo(sx, sy);
        }
        
        ctx.stroke();

        // Splash at landing
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const rx = (Math.random() - 0.5) * 15;
            const ry = (Math.random() - 0.5) * 10;
            ctx.beginPath();
            ctx.arc(targetX + rx, targetY + ry, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawCup(cup, isPerfect = false) {
        const { x, y, width, height, ingredients, ripple } = cup;
        const ctx = this.ctx;
        const isIced = cup.temperature === 'iced';
        
        ctx.save();

        // Perfect Glow (Shadow)
        if (isPerfect) {
            const pulse = 15 + Math.sin(Date.now() / 150) * 10;
            ctx.shadowColor = '#A5D6A7';
            ctx.shadowBlur = pulse;
        }
        
        // Visual feedback bounce
        let scaleEffect = 1;
        if (ripple > 0) scaleEffect = 1 + (ripple / 100);
        
        ctx.translate(x, y);
        ctx.scale(scaleEffect, scaleEffect);
        ctx.translate(-width / 2 * (scaleEffect - 1), -height * (scaleEffect - 1));

        // -- Shape Definitions --
        const defineHotCupPath = () => {
            ctx.beginPath();
            ctx.moveTo(-width / 2, -height);
            ctx.bezierCurveTo(-width / 2, -height * 0.4, -width / 2 + 10, 0, 0, 0);
            ctx.bezierCurveTo(width / 2 - 10, 0, width / 2, -height * 0.4, width / 2, -height);
            ctx.quadraticCurveTo(0, -height - 10, -width / 2, -height);
        };

        const defineIcedCupPath = () => {
            ctx.beginPath();
            // Tapered plastic cup shape
            ctx.moveTo(-width / 2 + 5, -height);
            ctx.lineTo(-width / 2 + 15, -5);
            ctx.quadraticCurveTo(0, 5, width / 2 - 15, -5);
            ctx.lineTo(width / 2 - 5, -height);
            ctx.closePath();
        };

        const drawHeart = (x, y, size) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.beginPath();
            ctx.moveTo(0, size / 4);
            ctx.bezierCurveTo(size / 2, -size / 2, size, size / 3, 0, size);
            ctx.bezierCurveTo(-size, size / 3, -size / 2, -size / 2, 0, size / 4);
            ctx.fillStyle = '#FDF2F4'; // Very light pink heart
            ctx.fill();
            ctx.strokeStyle = '#F4ACB7';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        };

        const drawThinBow = (posY) => {
            ctx.save();
            ctx.translate(0, posY);
            ctx.strokeStyle = '#F4ACB7';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            // Loops (Thin string style)
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-40, -30, -35, 10, 0, 0);
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(40, -30, 35, 10, 0, 0);
            ctx.stroke();

            // Tails
            ctx.beginPath();
            ctx.moveTo(-2, 2); ctx.quadraticCurveTo(-15, 10, -25, 5);
            ctx.moveTo(2, 2); ctx.quadraticCurveTo(15, 10, 25, 5);
            ctx.stroke();

            // Tiny knot
            ctx.fillStyle = '#F4ACB7';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        const drawBow = (posY, scale = 1) => {
            ctx.save();
            ctx.translate(0, posY);
            ctx.scale(scale, scale);
            ctx.fillStyle = '#F4ACB7';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;

            // Tails
            ctx.beginPath();
            ctx.moveTo(-5, 0); ctx.lineTo(-35, 45); ctx.lineTo(-15, 35); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(5, 0); ctx.lineTo(35, 45); ctx.lineTo(15, 35); ctx.fill(); ctx.stroke();

            // Loops
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-50, -25, -50, 25, 0, 0); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(50, -25, 50, 25, 0, 0); ctx.fill(); ctx.stroke();

            // Knot
            ctx.beginPath();
            ctx.roundRect(-10, -10, 20, 20, 6);
            ctx.fill(); ctx.stroke();
            ctx.restore();
        };

        // -- Draw Background/Body --
        if (isIced) {
            // Straw
            ctx.save();
            ctx.strokeStyle = '#F4ACB7';
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(5, -height);
            ctx.lineTo(5, -height - 40);
            ctx.stroke();
            ctx.restore();

            defineIcedCupPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // More opaque plastic
            ctx.fill();
            ctx.strokeStyle = 'rgba(180, 180, 180, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            // Handle for Hot Cup
            ctx.lineWidth = 10; ctx.strokeStyle = '#F4ACB7'; ctx.beginPath();
            ctx.arc(width/2 - 5, -height/2, 25, -Math.PI * 0.6, Math.PI * 0.8); ctx.stroke();
            ctx.lineWidth = 4; ctx.strokeStyle = '#FFFFFF'; ctx.stroke();
            
            defineHotCupPath();
            ctx.fillStyle = '#FFF9F1'; ctx.fill();

            // Floral Pattern (Hot only)
            ctx.save();
            defineHotCupPath(); ctx.clip();
            ctx.fillStyle = 'rgba(244, 172, 183, 0.4)';
            [{x: -25, y: -40, s: 6}, {x: 10, y: -85, s: 8}, {x: -35, y: -100, s: 5}, {x: 30, y: -30, s: 7}].forEach(b => {
                ctx.beginPath(); ctx.arc(b.x, b.y, b.s, 0, Math.PI * 2); ctx.fill();
            });
            ctx.restore();
        }

        // -- Draw Liquid --
        ctx.save();
        if (isIced) defineIcedCupPath(); else defineHotCupPath();
        ctx.clip();

        // 25% of the cup is reserved for ice at the bottom if it's an iced drink
        let currentFillHeight = isIced ? 0.25 : 0;
        
        // Draw the Ice base if iced
        if (isIced && cup.iceCubes) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.strokeStyle = '#B3E5FC';
            ctx.lineWidth = 1;
            
            const time = Date.now() / 1000;
            cup.iceCubes.forEach(cube => {
                ctx.save();
                
                // Subtle floating offsets
                const floatY = Math.sin(time * cube.speed + cube.phase) * 3;
                const floatX = Math.cos(time * (cube.speed * 0.8) + cube.phase) * 2;
                const floatRot = Math.sin(time * 0.5 + cube.phase) * 0.05;

                const ix = cube.x * width + floatX;
                const iy = cube.y * height + floatY;
                ctx.translate(ix, iy);
                ctx.rotate(cube.rotation + floatRot);
                
                // Main cube body with rounded corners
                ctx.beginPath();
                ctx.roundRect(-cube.size/2, -cube.size/2, cube.size, cube.size, 4);
                ctx.fill();
                ctx.stroke();
                
                // "Light reflection" shimmer (white gloss at the top left)
                ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                ctx.beginPath();
                ctx.roundRect(-cube.size/2 + 2, -cube.size/2 + 2, cube.size/2.5, cube.size/4, 2);
                ctx.fill();

                // "Ice core" shadow (blueish tint at the bottom right)
                ctx.fillStyle = 'rgba(179, 229, 252, 0.4)';
                ctx.beginPath();
                ctx.roundRect(cube.size/10, cube.size/10, cube.size/3, cube.size/3, 2);
                ctx.fill();
                
                ctx.restore();
            });
        }

        for (let type in ingredients) {
            let amount = ingredients[type];
            if (amount <= 0) continue;
            ctx.fillStyle = COLORS[type];
            
            // Map the 0-1.0 liquid state to the available space (Hot: 100%, Iced: 75%)
            const scaleFactor = isIced ? 0.75 : 1.0;
            const fillBottom = -currentFillHeight * height;
            const fillTop = -(currentFillHeight + (amount * scaleFactor)) * height;
            
            ctx.fillRect(-width, fillTop, width * 2, (fillBottom - fillTop));
            
            if (ripple > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${ripple / 40})`;
                ctx.fillRect(-width, fillTop, width * 2, (fillBottom - fillTop));
            }
            currentFillHeight += (amount * scaleFactor);
        }
        ctx.restore();
        
        // -- Draw Whipped Cream (fluffy clouds) --
        if (ingredients.whippedCream > 0) {
            this.drawWhippedCream(ctx, 0, -currentFillHeight * height, width);
        }

        // -- Specialized Details --
        if (isIced) {
            // Plastic Rim/Lid
            ctx.strokeStyle = 'rgba(200, 200, 200, 0.4)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(-width/2, -height);
            ctx.lineTo(width/2, -height);
            ctx.stroke();

            // Heart Label
            drawHeart(0, -height * 0.6, 25);

            // Centered Thin Bow
            drawThinBow(-height + 5);
        } else {
            // Hot Cup details
            drawBow(-height + 25, 1);
        }

        // Final Outline
        if (isIced) defineIcedCupPath(); else defineHotCupPath();
        ctx.strokeStyle = isIced ? 'rgba(255, 255, 255, 0.5)' : '#F4ACB7';
        ctx.lineWidth = isIced ? 2 : 4;
        ctx.stroke();
        
        ctx.restore();
    }

    drawWhippedCream(ctx, x, y, width) {
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#F5F5F5';
        ctx.lineWidth = 1;

        // Draw a series of arcs to create a "cloud" look
        const cloudParts = [
            { x: -width/2 + 10, y: 0, r: 15 },
            { x: -width/4, y: -10, r: 20 },
            { x: 0, y: -15, r: 25 },
            { x: width/4, y: -10, r: 20 },
            { x: width/2 - 10, y: 0, r: 15 },
            // Inner peak
            { x: -10, y: -25, r: 15 },
            { x: 10, y: -25, r: 15 },
            { x: 0, y: -35, r: 10 }
        ];

        cloudParts.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        
        ctx.restore();
    }

    drawPastryCase(game) {
        if (!game.ownedItems.has('croissants')) return;

        const { ctx } = this;
        const startX = 100;
        const startY = 420;
        const width = 180;
        const height = 80;

        ctx.save();
        
        // 1. The Glass Case (Glassy Morphism)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeStyle = 'rgba(188, 170, 164, 0.5)';
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        ctx.roundRect(startX, startY - height, width, height, [20, 20, 0, 0]);
        ctx.fill();
        ctx.stroke();

        // Shelf
        ctx.beginPath();
        ctx.moveTo(startX, startY - height / 2);
        ctx.lineTo(startX + width, startY - height / 2);
        ctx.stroke();

        // 2. Draw Pastries in the case
        this.drawPastryAt(startX + 45, startY - 15, 'croissant');
        this.drawPastryAt(startX + 135, startY - 15, 'cookie');
        this.drawPastryAt(startX + 45, startY - 55, 'muffin');

        // 3. Draw "Selected" Highlight if player is picking a pastry
        if (game.selectedPastry) {
            const positions = {
                croissant: { x: startX + 45, y: startY - 15 },
                cookie: { x: startX + 135, y: startY - 15 },
                muffin: { x: startX + 45, y: startY - 55 }
            };
            const pos = positions[game.selectedPastry];
            if (pos) {
                ctx.strokeStyle = '#FFB6C1';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
                ctx.stroke();
                
                // Pulsing Glow
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#FFB6C1';
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    drawPastryAt(x, y, type) {
        switch (type) {
            case 'croissant': this.drawCroissant(x, y); break;
            case 'cookie': this.drawCookie(x, y); break;
            case 'muffin': this.drawMuffin(x, y); break;
        }
    }

    /**
     * Requirement Check: Bezier Curves Implementation
     * Draws a croissant using multiple Bezier segments for that "flaky" look.
     */
    drawCroissant(x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        
        ctx.fillStyle = '#E6B980'; // Golden brown
        ctx.strokeStyle = '#D2691E';
        ctx.lineWidth = 1.5;

        // Main Body (The central segment)
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.bezierCurveTo(-15, -20, 15, -20, 15, 0);
        ctx.bezierCurveTo(15, 10, -15, 10, -15, 0);
        ctx.fill();
        ctx.stroke();

        // Left Wing
        ctx.beginPath();
        ctx.moveTo(-12, -2);
        ctx.bezierCurveTo(-25, -5, -25, 15, -10, 8);
        ctx.fill();
        ctx.stroke();

        // Right Wing
        ctx.beginPath();
        ctx.moveTo(12, -2);
        ctx.bezierCurveTo(25, -5, 25, 15, 10, 8);
        ctx.fill();
        ctx.stroke();

        // Flaky Layers (Detail lines)
        ctx.beginPath();
        ctx.moveTo(-8, -12);
        ctx.bezierCurveTo(-8, -15, 8, -15, 8, -12);
        ctx.stroke();

        ctx.restore();
    }

    drawCookie(x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        
        ctx.fillStyle = '#D4A373';
        ctx.beginPath();
        ctx.arc(0, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        
        // Choco Chips
        ctx.fillStyle = '#3E2723';
        const chips = [{x: -5, y: -5}, {x: 6, y: -2}, {x: -2, y: 8}, {x: 8, y: 6}, {x: -8, y: 4}];
        chips.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }

    drawMuffin(x, y) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        
        // Wrapper (Quadratic curve)
        ctx.fillStyle = '#F5F5F5';
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-12, 15);
        ctx.quadraticCurveTo(0, 18, 12, 15);
        ctx.lineTo(15, 0);
        ctx.fill();
        ctx.stroke();

        // Muffin Top (Large arc)
        ctx.fillStyle = '#9575CD'; // Blueberry purple
        ctx.beginPath();
        ctx.arc(0, -2, 18, Math.PI, 0);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}
