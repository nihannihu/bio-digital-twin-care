const API_URL = 'http://localhost:3000/api/simulate';

// DOM Elements
const form = document.getElementById('simForm');
const emptyState = document.getElementById('emptyState');
const resultsPanel = document.getElementById('resultsPanel');
const genotypeDisplay = document.getElementById('genotypeDisplay');
const crashTimeDisplay = document.getElementById('crashTimeDisplay');
const phenotypeText = document.getElementById('phenotypeText');
const recommendationText = document.getElementById('recommendationText');
const ctx = document.getElementById('bioChart').getContext('2d');

let chartInstance = null;

// Event Listener
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Get Data
    const formData = new FormData(form);
    const payload = {
        drug: formData.get('drug'),
        amount_mg: formData.get('amount_mg'),
        time: formData.get('time'),
        userId: formData.get('userId')
    };

    // UI Loading State (Optional: Add spinner here)
    document.querySelector('.btn-primary').innerHTML = 'Simulating...';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Simulation Failed');

        const data = await response.json();

        // Render Results
        renderResults(data);

    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        document.querySelector('.btn-primary').innerHTML = 'Run Bio-Simulation <span class="arrow">→</span>';
    }
});

function renderResults(data) {
    // 1. Toggle Panels
    emptyState.classList.add('hidden');
    resultsPanel.classList.remove('hidden');

    // 2. Text Updates
    genotypeDisplay.textContent = data.genotype;
    crashTimeDisplay.textContent = data.crash_time;
    phenotypeText.textContent = data.phenotype;
    recommendationText.textContent = `"${data.recommendation}"`;

    // 3. Render Chart
    const labels = data.simulation_data.map(d => d.time_label);
    const concentrations = data.simulation_data.map(d => d.amount_remaining_mg);

    if (chartInstance) {
        chartInstance.destroy();
    }

    // Chart.js Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(79, 70, 229, 0.5)');
    gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Caffeine Remaining (mg)',
                data: concentrations,
                borderColor: '#4f46e5',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4, // Smooth curve
                pointBackgroundColor: '#22d3ee',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#22d3ee',
                    padding: 10,
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', maxTicksLimit: 8 }
                }
            },
            annotation: {
                // Sleep threshold annotation could go here
            }
        }
    });

    // Add Reference Line (Manual draw logic or plugin)
    // For MVP vanilla, simple chart is enough.
}
