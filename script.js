// Constants for the solar system simulation
const PLANET_DATA = {
    mercury: { orbitalPeriod: 2.4, size: 6, orbitRadius: 120 },
    venus: { orbitalPeriod: 6.2, size: 12, orbitRadius: 170 },
    earth: { orbitalPeriod: 10, size: 13, orbitRadius: 230 },
    mars: { orbitalPeriod: 18.8, size: 10, orbitRadius: 290 },
    jupiter: { orbitalPeriod: 118, size: 28, orbitRadius: 360 },
    saturn: { orbitalPeriod: 295, size: 24, orbitRadius: 440 },
    uranus: { orbitalPeriod: 840, size: 16, orbitRadius: 500 },
    neptune: { orbitalPeriod: 1650, size: 15, orbitRadius: 560 }
};

// Planet class to represent each planet in the solar system
class Planet {
    constructor(name, element) {
        if (!name || !element) {
            throw new Error('Planet requires both a name and an element');
        }

        if (!PLANET_DATA[name]) {
            console.warn(`Unknown planet: ${name}`);
        }

        this.name = name;
        this.element = element;
        this.orbitalPeriod = PLANET_DATA[name]?.orbitalPeriod || 10; // Default to Earth's period
        this.rotation = 0;
        this.initialRotation = 0;

        // Find the parent orbit element
        this.orbitElement = this.element.parentElement;

        if (!this.orbitElement) {
            console.error(`Orbit element not found for planet: ${name}`);
        }
    }

    // Update the planet's position based on its rotation
    updatePosition() {
        if (!this.orbitElement || !this.element) return;

        const orbitRadius = this.orbitElement.offsetWidth / 2;
        const radians = this.rotation * Math.PI / 180;
        const adjustedRadians = radians - Math.PI / 2; // Start from top of orbit

        const x = orbitRadius + orbitRadius * Math.cos(adjustedRadians);
        const y = orbitRadius + orbitRadius * Math.sin(adjustedRadians);

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    // Update the rotation based on elapsed time and speed factor
    updateRotation(elapsedTime, speedFactor) {
        if (typeof elapsedTime !== 'number' || typeof speedFactor !== 'number') {
            console.warn('Invalid parameters for updateRotation:', { elapsedTime, speedFactor });
            return;
        }

        const speed = (360 / this.orbitalPeriod) * (elapsedTime / 1000) * speedFactor;
        this.rotation += speed;
    }

    // Reset to initial position
    reset() {
        this.rotation = this.initialRotation;
    }
}

// SolarSystem class to manage the entire simulation
class SolarSystem {
    constructor() {
        // Get DOM elements
        this.planets = [];
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');

        // Validate DOM elements exist
        this.validateElements();

        // Animation control variables
        this.animationId = null;
        this.isAnimating = false;
        this.speedFactor = 1;
        this.lastTimestamp = undefined;

        this.initializePlanets();
        this.setupEventListeners();
        this.startAnimationLoop();
    }

    // Validate that required DOM elements exist
    validateElements() {
        const missingElements = [];

        if (!this.startBtn) missingElements.push('startBtn');
        if (!this.pauseBtn) missingElements.push('pauseBtn');
        if (!this.resetBtn) missingElements.push('resetBtn');
        if (!this.speedSlider) missingElements.push('speedSlider');
        if (!this.speedValue) missingElements.push('speedValue');

        if (missingElements.length > 0) {
            throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
        }
    }

    // Initialize planet objects
    initializePlanets() {
        const planetElements = document.querySelectorAll('.planet');

        if (planetElements.length === 0) {
            console.warn('No planet elements found');
            return;
        }

        planetElements.forEach(element => {
            // Extract planet name from class (e.g., 'mercury' from 'planet mercury')
            const planetName = Array.from(element.classList)
                .filter(cls => cls !== 'planet')[0];

            if (planetName) {
                try {
                    this.planets.push(new Planet(planetName, element));
                } catch (error) {
                    console.error(`Error creating planet ${planetName}:`, error);
                }
            } else {
                console.warn('Could not determine planet name from element:', element);
            }
        });
    }

    // Setup event listeners for controls
    setupEventListeners() {
        // Validate elements before adding event listeners
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.start());
        } else {
            console.error('Start button not found');
        }

        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.pause());
        } else {
            console.error('Pause button not found');
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.reset());
        } else {
            console.error('Reset button not found');
        }

        if (this.speedSlider) {
            this.speedSlider.addEventListener('input', () => {
                this.handleSpeedChange();
            });
        } else {
            console.error('Speed slider not found');
        }
    }

    // Handle speed change with validation
    handleSpeedChange() {
        if (!this.speedSlider || !this.speedValue) return;

        const rawValue = this.speedSlider.value;
        const value = parseFloat(rawValue);

        // Validate the input value
        if (isNaN(value)) {
            console.warn('Invalid speed value:', rawValue);
            return;
        }

        // Constrain the value to the expected range
        const minValue = parseFloat(this.speedSlider.min) || 0.1;
        const maxValue = parseFloat(this.speedSlider.max) || 5;

        this.speedFactor = Math.min(Math.max(value, minValue), maxValue);
        this.speedValue.textContent = this.speedFactor.toFixed(1) + 'x';
    }

    // Start the animation
    start() {
        this.isAnimating = true;
        this.updateButtonStates();
    }

    // Pause the animation
    pause() {
        this.isAnimating = false;
        this.updateButtonStates();
    }

    // Reset all planets to initial positions
    reset() {
        this.pause();
        this.planets.forEach(planet => planet.reset());
        this.updatePlanetPositions();
        this.updateButtonStates();
    }

    // Update positions of all planets
    updatePlanetPositions() {
        this.planets.forEach(planet => {
            if (planet) {
                planet.updatePosition();
            }
        });
    }

    // Main animation loop
    animate(timestamp) {
        if (!timestamp) timestamp = performance.now();

        if (this.isAnimating) {
            // Calculate elapsed time since last frame
            const elapsed = timestamp - (this.lastTimestamp || timestamp);
            this.lastTimestamp = timestamp;

            // Update rotation for each planet
            this.planets.forEach(planet => {
                if (planet) {
                    planet.updateRotation(elapsed, this.speedFactor);
                }
            });

            this.updatePlanetPositions();
        }

        this.animationId = requestAnimationFrame((time) => {
            // Check if the document is still visible before continuing animation
            if (document.hidden) {
                // Optionally pause animation when tab is not visible
                // this.pause();
            }
            this.animate(time);
        });
    }

    // Start the animation loop
    startAnimationLoop() {
        this.animate();
    }

    // Update active button states
    updateButtonStates() {
        if (this.startBtn) {
            this.startBtn.classList.toggle('active', this.isAnimating);
        }
        if (this.pauseBtn) {
            this.pauseBtn.classList.toggle('active', !this.isAnimating);
        }
    }
}

// Initialize the solar system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        new SolarSystem();
    } catch (error) {
        console.error('Failed to initialize SolarSystem:', error);
        // Optionally display an error message to the user
        const container = document.getElementById('container');
        if (container) {
            container.innerHTML = '<div style="color:white;text-align:center;margin-top:50px;">Error loading solar system simulation</div>';
        }
    }
});