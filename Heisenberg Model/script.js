const gridSize = 10;
let spins = Array.from({ length: gridSize }, () => Array(gridSize).fill('up'));
let temperature = 50;
let magneticField = 0;
let interactionStrength = 1;
let simulationInterval;
let algorithm = 'metropolis';
const historySize = 100; 
let spinHistory = [];
function spinToValue(spin) {
    return spin === 'up' ? 1 : -1;
}
function createGrid() {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell ' + spins[i][j];
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', () => toggleSpin(i, j));
            grid.appendChild(cell);
        }
    }
    adjustGridSize(); 
}
function toggleSpin(row, col) {
    spins[row][col] = spins[row][col] === 'up' ? 'down' : 'up';
    updateGrid();
}
function updateGrid() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const row = cell.dataset.row;
        const col = cell.dataset.col;
        cell.className = 'cell ' + spins[row][col];
    });
}
function runSimulation() {
    if (algorithm === 'metropolis') {
        runMetropolisHastings();
    } else if (algorithm === 'wolff') {
        runWolffCluster();
    }
    spinHistory.push(JSON.parse(JSON.stringify(spins))); 
    if (spinHistory.length > historySize) {
        spinHistory.shift(); 
    }
    updateGrid();
    updateResults();
}
function runMetropolisHastings() {
    const kT = temperature; 
    const J = interactionStrength; 
    const h = magneticField; 
    const beta = 1 / (kT / 10);
    for (let step = 0; step < 100; step++) {
        const i = Math.floor(Math.random() * gridSize);
        const j = Math.floor(Math.random() * gridSize);
        const dE = deltaEnergy(i, j, J, h);
        if (dE < 0 || Math.random() < Math.exp(-dE * beta)) {
            spins[i][j] = spins[i][j] === 'up' ? 'down' : 'up';
        }
    }
}
function runWolffCluster() {
    const kT = temperature; 
    const J = interactionStrength; 
    const h = magneticField; 
    const beta = 1 / (kT / 10);
    const cluster = [];
    const startRow = Math.floor(Math.random() * gridSize);
    const startCol = Math.floor(Math.random() * gridSize);
    const initialSpin = spins[startRow][startCol];
    const stack = [[startRow, startCol]];
    while (stack.length > 0) {
        const [row, col] = stack.pop();
        if (!cluster.some(([r, c]) => r === row && c === col)) {
            cluster.push([row, col]);
            [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([di, dj]) => {
                const ni = (row + di + gridSize) % gridSize;
                const nj = (col + dj + gridSize) % gridSize;
                if (spins[ni][nj] === initialSpin && !cluster.some(([r, c]) => r === ni && c === nj) && Math.random() < 1 - Math.exp(-2 * J / (kT / 10))) {
                    stack.push([ni, nj]);
                }
            });
        }
    }
    cluster.forEach(([row, col]) => {
        spins[row][col] = spins[row][col] === 'up' ? 'down' : 'up';
    });
}
function deltaEnergy(row, col, J, h) {
    const spin = spins[row][col] === 'up' ? 1 : -1;
    let dE = 0;
    for (const [di, dj] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const ni = (row + di + gridSize) % gridSize;
        const nj = (col + dj + gridSize) % gridSize;
        const neighborSpin = spins[ni][nj] === 'up' ? 1 : -1;
        dE += 2 * J * spin * neighborSpin;
    }
    dE += 2 * h * spin;
    return dE;
}
function calculateMagnetization() {
    let totalMagnetization = 0;
    spins.forEach(row => {
        row.forEach(spin => {
            totalMagnetization += spin === 'up' ? 1 : -1;
        });
    });
    return totalMagnetization / (gridSize * gridSize);
}
function calculateEnergy() {
    const J = interactionStrength;
    const h = magneticField;
    let totalEnergy = 0;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            totalEnergy -= deltaEnergy(i, j, J, h) / 2; 
        }
    }
    return totalEnergy / (gridSize * gridSize);
}
function calculateCorrelation() {
    let correlationSum = 0;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const currentSpin = spins[i][j] === 'up' ? 1 : -1;
            const neighborSpins = [
                spins[(i + 1) % gridSize][j],
                spins[i][(j + 1) % gridSize],
            ];
            neighborSpins.forEach(neighborSpin => {
                correlationSum += currentSpin * (neighborSpin === 'up' ? 1 : -1);
            });
        }
    }
    return correlationSum / (2 * gridSize * gridSize); 
}
function calculateTwoPointCorrelation(distance) {
    if (spinHistory.length <= 1) {
        return 0; 
    }
    let correlationSum = 0;
    let count = 0;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const currentSpin = spins[i][j] === 'up' ? 1 : -1;
            const ni = (i + distance) % gridSize;
            const nj = (j + distance) % gridSize;
            const neighborSpin = spins[ni][nj] === 'up' ? 1 : -1;
            correlationSum += currentSpin * neighborSpin;
            count++;
        }
    }
    return correlationSum / count;
}
function calculatePairCorrelation() {
    let correlation = [];
    for (let distance = 1; distance <= Math.floor(gridSize / 2); distance++) {
        let correlationSum = 0;
        let count = 0;
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const currentSpin = spins[i][j] === 'up' ? 1 : -1;
                const ni = (i + distance) % gridSize;
                const nj = (j + distance) % gridSize;
                const neighborSpin = spins[ni][nj] === 'up' ? 1 : -1;
                correlationSum += currentSpin * neighborSpin;
                count++;
            }
        }
        correlation.push({
            distance: distance,
            correlation: correlationSum / count
        });
    }
    return correlation;
}
function calculateTemporalCorrelation(lag) {
    if (spinHistory.length <= lag) {
        return 0; 
    }
    let correlationSum = 0;
    let count = 0;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const currentSpin = spins[i][j] === 'up' ? 1 : -1;
            const pastSpin = spinHistory[spinHistory.length - lag - 1][i][j] === 'up' ? 1 : -1;
            correlationSum += currentSpin * pastSpin;
            count++;
        }
    }
    return correlationSum / count;
}
function calculateStructureFactor() {
    const N = gridSize;
    const structureFactor = Array.from({ length: N }, () => Array.from({ length: N }, () => 0));
    for (let qx = 0; qx < N; qx++) {
        for (let qy = 0; qy < N; qy++) {
            let sum = 0;
            for (let x = 0; x < N; x++) {
                for (let y = 0; y < N; y++) {
                    const spin = spinToValue(spins[x][y]);
                    const angle = -2 * Math.PI * ((qx * x + qy * y) / N);
                    sum += spin * Math.cos(angle) - spin * Math.sin(angle);
                }
            }
            structureFactor[qx][qy] = Math.sqrt(sum * sum);
        }
    }
    return structureFactor;
}
function sanitizeText(text) {
    return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function updateResults() {
    const magnetization = calculateMagnetization();
    const energy = calculateEnergy();
    const correlation = calculateCorrelation();
    const twoPointCorrelation = calculateTwoPointCorrelation(1); 
    const pairCorrelation = calculatePairCorrelation();
    const temporalCorrelation = calculateTemporalCorrelation(10); 
    const structureFactor = calculateStructureFactor();
    document.getElementById('magnetization').textContent = `Magnetization: ${math.format(magnetization, { precision: 2 })}`;
    document.getElementById('energy').textContent = `Energy: ${math.format(energy, { precision: 2 })}`;
    document.getElementById('correlation').textContent = `Correlation Function: ${math.format(correlation, { precision: 2 })}`;
    document.getElementById('twoPointCorrelation').textContent = `Two-Point Correlation (distance 1): ${math.format(twoPointCorrelation, { precision: 2 })}`;
    const pairCorrelationElement = document.getElementById('pairCorrelation');
    pairCorrelationElement.innerHTML = 'Pair Correlation:<br>';
    pairCorrelation.forEach(({ distance, correlation }) => {
        pairCorrelationElement.innerHTML += `Distance ${distance}: ${math.format(correlation, { precision: 2 })}<br>`;
    });
    document.getElementById('temporalCorrelation').textContent = `Temporal Correlation (lag 10): ${math.format(temporalCorrelation, { precision: 2 })}`;
    const structureFactorElement = document.getElementById('structureFactor');
    structureFactorElement.innerHTML = 'Structure Factor:<br>';
    structureFactor.forEach((row, qx) => {
        row.forEach((value, qy) => {
            structureFactorElement.innerHTML += `q=(${qx},${qy}): ${math.format(value, { precision: 2 })}<br>`;
        });
    });
}
function exportData() {
    const data = {
        spins: spins,
        temperature: temperature,
        magneticField: magneticField,
        interactionStrength: interactionStrength,
        magnetization: calculateMagnetization(),
        energy: calculateEnergy(),
        correlation: calculateCorrelation(),
        twoPointCorrelation: calculateTwoPointCorrelation(1), 
        pairCorrelation: calculatePairCorrelation(),
        temporalCorrelation: calculateTemporalCorrelation(10), 
        structureFactor: calculateStructureFactor(),
        simulationResults: {
            magnetization: calculateMagnetization(),
            energy: calculateEnergy(),
            correlation: calculateCorrelation(),
            twoPointCorrelation: calculateTwoPointCorrelation(1),
            pairCorrelation: calculatePairCorrelation(),
            temporalCorrelation: calculateTemporalCorrelation(10),
            structureFactor: calculateStructureFactor()
        }
    };
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'simulation_data.json';
    link.click();
}
document.getElementById('temperature').addEventListener('input', (event) => {
    temperature = Number(event.target.value);
    document.getElementById('temperatureValue').textContent = sanitizeText(temperature.toString());
});
document.getElementById('magneticField').addEventListener('input', (event) => {
    magneticField = Number(event.target.value);
    document.getElementById('magneticFieldValue').textContent = sanitizeText(magneticField.toString());
});
document.getElementById('interactionStrength').addEventListener('input', (event) => {
    interactionStrength = Number(event.target.value);
    document.getElementById('interactionStrengthValue').textContent = sanitizeText(interactionStrength.toString());
});
document.getElementById('algorithm').addEventListener('change', (event) => {
    algorithm = event.target.value;
});
function startSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);
    simulationInterval = setInterval(runSimulation, 100); 
}
function stopSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);
}

function adjustGridSize() {
    const grid = document.getElementById('grid');
    const gridWidth = grid.clientWidth;
    grid.style.height = `${gridWidth}px`;
}
createGrid();
window.addEventListener('resize', adjustGridSize);
adjustGridSize();
document.getElementById('startButton').addEventListener('click', startSimulation);
document.getElementById('stopButton').addEventListener('click', stopSimulation);
document.getElementById('exportButton').addEventListener('click', exportData);

