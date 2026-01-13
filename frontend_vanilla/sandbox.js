// Client-Side Logic - Connected to Backend

// State
let eventStack = [];
let chartInstance = null;
const BACKEND_URL = 'http://127.0.0.1:3000';

// DOM Elements
const stackList = document.getElementById('stackList');
const addForm = document.getElementById('addEventForm');
const runBtn = document.getElementById('runSimBtn');
const riskContainer = document.getElementById('riskContainer');
const neuroScoreEl = document.getElementById('neuroScore');
const detoxScoreEl = document.getElementById('detoxScore');
const drugSelect = document.getElementById('eventDrug');

// --- Initialization ---

async function init() {
    try {
        // 1. Fetch Drugs
        const res = await fetch(`${BACKEND_URL}/api/drugs`);
        if (!res.ok) throw new Error('Failed to fetch drugs');
        const drugs = await res.json();

        drugSelect.innerHTML = '';
        drugs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d.drug;
            opt.textContent = `${d.drug} (${d.type})`;
            drugSelect.appendChild(opt);
        });

        // 2. Fetch History (Persistence)
        const historyRes = await fetch(`${BACKEND_URL}/api/history?date=${new Date().toISOString().split('T')[0]}`);
        if (historyRes.ok) {
            const history = await historyRes.json();
            history.forEach(log => {
                // Reconstruct eventStack from logs
                const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : "00:00";
                // If log.date is today, use it.
                // Simplified: Just push to stack
                eventStack.push({
                    id: log._id || Date.now().toString(),
                    drug: log.substance,
                    dose: log.dose_mg,
                    time: timeStr // Ensure this format matches "HH:MM"
                });
            });
            renderStack();
            if (eventStack.length > 0) {
                // Auto-run forecast if we have history? 
                // Maybe let user click run.
            }
        }

    } catch (e) {
        console.error("Failed to load initial data", e);
        // Fallback or error message
        const opt = document.createElement('option');
        opt.textContent = "Error loading drugs (Check Backend)";
        drugSelect.appendChild(opt);
    }
}

init();

// --- Event Handlers ---

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const time = document.getElementById('eventTime').value;
    const dose = document.getElementById('eventDose').value;
    const drug = document.getElementById('eventDrug').value;

    // Persist to Backend First
    try {
        const res = await fetch(`${BACKEND_URL}/api/log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: "nihan_001",
                date: new Date().toISOString().split('T')[0],
                substance: drug,
                dose_mg: parseFloat(dose),
                source: "Sandbox UI",
                // timestamp: Combine date + time
                timestamp: new Date(`${new Date().toISOString().split('T')[0]}T${time}:00`)
            })
        });

        if (!res.ok) throw new Error("Failed to save log");
        const savedLog = await res.json();

        // Add to local stack with ID from backend if possible, or fallback
        addEventToStack(drug, dose, time, savedLog.log?._id);

    } catch (err) {
        console.error(err);
        alert("Failed to save to history: " + err.message);
        // Add anyway or block? Let's add anyway for perceived speed but warn
        addEventToStack(drug, dose, time);
    }
});

runBtn.addEventListener('click', async () => {
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';

    try {
        await runSimulation();
    } catch (e) {
        console.error(e);
        alert('Simulation failed: ' + e.message);
    } finally {
        runBtn.disabled = false;
        runBtn.textContent = '▶ Run Forecast';
    }
});

// --- Logic ---


function addEventToStack(drug, dose, time, id = null) {
    const eventId = id || Date.now().toString();
    eventStack.push({ id: eventId, drug, dose: parseFloat(dose), time });
    renderStack();
}

function removeEvent(id) {
    eventStack = eventStack.filter(e => e.id !== id);
    renderStack();
}

function renderStack() {
    stackList.innerHTML = '';
    eventStack.forEach(item => {
        const div = document.createElement('div');
        div.className = 'stack-item';
        div.innerHTML = `
            <span><strong>${item.time}</strong> - ${item.drug} (${item.dose}mg)</span>
            <span class="remove" onclick="removeEvent('${item.id}')">×</span>
        `;
        stackList.appendChild(div);
    });
}

// --- Simulation Engine (Backend) ---

async function runSimulation() {
    if (eventStack.length === 0) {
        alert("Add events first!");
        return;
    }

    const payload = {
        userId: "nihan_001",
        stack: eventStack.map(e => ({
            drugName: e.drug,
            amountMg: e.dose,
            timeStr: e.time
        }))
    };

    const res = await fetch(`${BACKEND_URL}/api/v2/stack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
    }

    const data = await res.json();

    // Map Backend V2 format to Frontend format
    const mappedTimeline = data.timeline.map(t => ({
        hour: t.time_hour,
        label: t.time_label,
        neuro: t.axes ? t.axes.neuro : 0,
        detox: t.axes ? t.axes.detox : 0,
        events: t.events
    }));

    renderChart(mappedTimeline);
    renderRisks(data.risks);
    updateDashboard(mappedTimeline);
}

function updateDashboard(timeline) {
    // Backend returns timeline with: hour, label, neuro, detox
    const peakDetox = Math.max(...timeline.map(t => t.detox));
    const lateNeuro = timeline.find(t => t.hour === 23 || t.hour === 23.5)?.neuro || 0; // Check late night

    if (lateNeuro > 2) neuroScoreEl.innerText = "Over-Stimulated";
    else if (lateNeuro < -2) neuroScoreEl.innerText = "Sedated";
    else neuroScoreEl.innerText = "Optimal";

    neuroScoreEl.style.color = lateNeuro > 2 ? '#ef4444' : (lateNeuro < -2 ? '#3b82f6' : '#22d3ee');

    if (peakDetox > 10) detoxScoreEl.innerText = "Toxic Overload";
    else if (peakDetox > 5) detoxScoreEl.innerText = "Stressed";
    else detoxScoreEl.innerText = "Healthy";

    detoxScoreEl.style.color = peakDetox > 5 ? '#facc15' : '#10b981';
}

function renderRisks(risks) {
    riskContainer.innerHTML = '';
    if (!risks || risks.length === 0) {
        riskContainer.innerHTML = '<span class="text-muted">No significant risks detected.</span>';
        return;
    }
    risks.forEach(r => {
        const span = document.createElement('span');
        span.className = `risk-badge ${r.severity === 'High' ? 'risk-high' : 'risk-med'}`;
        // Fix: Fallback for undefined properties
        span.textContent = `⚠️ ${(r.label || r.type || "Alert")}`;
        span.title = r.message || "Potential risk detected";
        riskContainer.appendChild(span);
    });
}

// --- Charting ---

function renderChart(timeline) {
    const ctx = document.getElementById('sandboxChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    const labels = timeline.map(t => t.label || t.hour); // Fallback

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Neuro Axis (Stim/Sedation)',
                    data: timeline.map(t => t.neuro),
                    borderColor: '#22d3ee',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    cubicInterpolationMode: 'monotone', // Fix: Smoother lines
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Liver Load (Detox)',
                    data: timeline.map(t => t.detox),
                    borderColor: '#facc15',
                    backgroundColor: 'rgba(250, 204, 21, 0.1)',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    tension: 0.4,
                    cubicInterpolationMode: 'monotone', // Fix: Smoother lines
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', maxTicksLimit: 8 }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#22d3ee' },
                    title: { display: true, text: 'Neuro Activity' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { display: false },
                    ticks: { color: '#facc15' },
                    title: { display: true, text: 'Liver Load' }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff' } },
                annotation: {
                    annotations: {
                        sleepLine: {
                            type: 'line',
                            yMin: 2,
                            yMax: 2,
                            borderColor: '#ef4444',
                            borderWidth: 1,
                            borderDash: [2, 2],
                            label: { content: 'Sleep Threshold', enabled: true, position: 'start', color: '#ef4444' }
                        }
                    }
                }
            }
        }
    });
}


// --- Tabs & Prognosis ---

window.switchTab = function (tabName) {
    document.querySelectorAll('.tabs button').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`button[onclick="switchTab('${tabName}')"]`).classList.add('active');

    if (tabName === 'timeline') {
        document.getElementById('timelineView').style.display = 'block';
        document.getElementById('prognosisView').style.display = 'none';
        document.getElementById('bodyView').style.display = 'none';
    } else if (tabName === 'body') {
        document.getElementById('timelineView').style.display = 'none';
        document.getElementById('prognosisView').style.display = 'none';
        document.getElementById('bodyView').style.display = 'block';
    } else {
        document.getElementById('timelineView').style.display = 'none';
        document.getElementById('prognosisView').style.display = 'block';
        document.getElementById('bodyView').style.display = 'none';
        updatePrognosis();
    }
};

let prognosisChartInstance = null;

function updatePrognosis() {
    // 1. Calculate Daily Habits from Stack
    let dailyHabits = {
        caffeine_mg: 0,
        alcohol_units: 0,
        avg_sleep_hours: 7 // Default assumption if not tracked
    };

    eventStack.forEach(e => {
        // e.drug might be "Caffeine" or "Caffeine (Stimulant)" depending on how it's stored.
        // Based on init(), value is just name.
        if (typeof e.drug === 'string') {
            if (e.drug.includes("Caffeine")) dailyHabits.caffeine_mg += e.dose;
            if (e.drug.includes("Alcohol")) dailyHabits.alcohol_units += (e.dose / 14); // Approx unit
        }
    });

    // 2. Current Stats (Mocked or fetched from User profile)
    // TODO: Fetch from User.accumulated_stress via API
    const currentStats = {
        liver_health: 95,
        neuro_health: 85,
        cardio_health: 90
    };

    // 3. Run Oracle Engine
    // predictFutureHealth is loaded from prognosis.js
    if (typeof predictFutureHealth === 'undefined') {
        console.error("Prognosis engine not loaded");
        return;
    }

    const report = predictFutureHealth(currentStats, dailyHabits, 5);

    // 4. Render Chart
    renderPrognosisChart(report.graphData);
    renderLongTermRisks(report.risks);
}

function renderPrognosisChart(timeline) {
    const ctx = document.getElementById('prognosisChart').getContext('2d');
    if (prognosisChartInstance) prognosisChartInstance.destroy();

    const labels = timeline.map(t => `Year ${t.year}`);

    prognosisChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Neuro Health',
                    data: timeline.map(t => t.neuro),
                    borderColor: '#22d3ee',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Cardio Health',
                    data: timeline.map(t => t.cardio),
                    borderColor: '#f472b6',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Liver Health',
                    data: timeline.map(t => t.liver),
                    borderColor: '#facc15',
                    tension: 0.4,
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    title: { display: true, text: 'Health Score (0-100)' },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                }
            }
        }
    });
}

function renderLongTermRisks(risks) {
    const container = document.getElementById('longTermRisks');
    container.innerHTML = '';

    if (risks.length === 0) {
        container.innerHTML = '<p class="text-muted">Prognosis looks stable. Keep up the good work!</p>';
        return;
    }

    risks.forEach(r => {
        const div = document.createElement('div');
        div.className = 'stack-item';
        div.style.borderColor = '#ef4444';
        // div.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
        div.innerHTML = `
            <span style="color: #ef4444; font-weight: bold;">${r.date} (Year ${r.year})</span>
            <span>${r.message}</span>
        `;
        container.appendChild(div);
    });
}
