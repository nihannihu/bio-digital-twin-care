# Changelog

All notable changes to the "Bio-Digital Twin" project will be documented in this file.

## [Unreleased]

### Added
- **Project Structure**: Initialized project with core simulation logic.
- **`knowledge_base.json`**: Created seed data for CYP1A2 gene and Caffeine interactions, defining phenotypes (Fast/Slow Metabolizer) and kinetic parameters.
- **`simulation.js`**: Implemented `calculateClearance` function using First-Order Elimination Kinetics ($C_t = C_0 \cdot e^{-k_{el} \cdot t}$) to simulate drug decay over time.
- **Artifacts**: Created `task.md` and `implementation_plan.md` for project management.

### [Phase 2]
- **API**: Initialized Node.js/Express `server.js`.
- **Endpoint**: Created `POST /simulate` in `routes/simulate.js` to expose simulation logic.

### [Phase 3]
- **Frontend**: Initializing Next.js application for the User Interface.

### [Phase 4]
- **Database**: Installing Mongoose and setting up MongoDB connection.
- **Schemas**: Defining `User` and `KnowledgeBase` models.



