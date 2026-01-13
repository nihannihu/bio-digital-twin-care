# Bio-Digital-Twin-Core 🧬
> **Repo Name Suggestion:** `Bio-Digital-Twin-Core`

A real-time **Bio-Digital Twin** that simulates the impact of daily habits (caffeine, stress, meds) on human physiology using a photorealistic **3D WebGL engine** and **AI Prognosis**.

![Bio-Digital Twin](https://via.placeholder.com/800x400?text=Bio-Digital+Twin+Simulation) 
*(Replace with actual screenshot)*

## 🚀 Features
- **3D Living Heart:** Photorealistic, beating heart that reacts to drugs (Adrenaline, Alcohol, etc.).
- **Chemical Lab:** Inject substances like Caffeine, Nicotine, or "Simulated Extremes" (Snake Venom).
- **Oracle Engine:** AI predicts your 5-year health prognosis based on daily habits.
- **Real-time Vitals:** Monitors Heart Rate, BP, O2 Saturation, and Neural Activity.

---

## 🛠️ How to Run (Easiest Method: Docker)
This project is containerized. You don't need to install Node.js or MongoDB manually.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed.

### Steps
1. **Clone the Repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Bio-Digital-Twin-Core.git
   cd Bio-Digital-Twin-Core
   ```

2. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```
   *This commands starts the Database, Backend, and Frontend automatically.*
   *It also **auto-seeds** the database with the included dataset (`knowledge_base_v2.json`).*

3. **Open the App**
   - Go to: `http://localhost:8000/sandbox.html`

---

## 💻 How to Run (Manual Method)
If you don't have Docker, follow these steps.

### Prerequisites
- Node.js (v14+)
- MongoDB (Running locally on port 27017)
- Python (optional, for simple frontend server)

### 1. Setup Backend
```bash
cd backend
npm install
# Start MongoDB locally first!
node seeder.js  # Loads the dataset into DB
node server.js
```
*Backend runs on `http://localhost:3000`*

### 2. Setup Frontend
```bash
cd frontend_vanilla
# Any static server works
python -m http.server 8000
# OR
npx http-server -p 8000
```
*Frontend runs on `http://localhost:8000/sandbox.html`*

---

## 📂 Project Structure
- `backend/`: Node.js + Express API + MongoDB Models.
- `backend/knowledge_base_v2.json`: **The Dataset**. Contains all drug interactions and physiological rules.
- `frontend_vanilla/`: Pure HTML/JS/CSS Frontend (No frameworks required).
- `docker-compose.yml`: Orchestration file for one-click setup.

## 💾 Data & Models
The project works out-of-the-box. The "Training Files" (Knowledge Base) are included in `backend/knowledge_base_v2.json`. The system automatically loads this into the database on startup using `seed.js`.
