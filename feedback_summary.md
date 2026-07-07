# Stellar Carbon Registry: User Feedback Summary 📝

This document summarizes the user feedback collected from the **10 onboarded real users** during the evaluation phase of Level 4. Feedback was gathered via our interactive DApp Feedback form and focuses on usability, wallet interaction flow, registry transparency, and smart contract execution.

---

## 📊 Onboarding & Feedback Metrics

* **Total Onboarded Users:** 10 Real Users
* **Average Usability Score:** 4.7 / 5.0
* **Wallet Connection Success Rate (Freighter):** 100%
* **Key Use-cases Covered:** Wind Farm Operators, Solar Grid Auditors, Retail Carbon Credit Buyers, and ESG Compliance Officers.

---

## 👥 User Reviews & Feedback Registry

| User Name | Role / Persona | Rating | Wallet Connected | Key Feedback Summary |
| :--- | :--- | :---: | :---: | :--- |
| **Alex Thorne** | Wind Farm Operator (Project Owner) | `5 / 5` | Yes | Freighter integration is seamless. Minting CCT tokens happens instantly once auditor uploads telemetry data. |
| **Elena Rostova** | IoT Energy Auditor (Oracle) | `5 / 5` | Yes | Eliminates excel manipulation. Smart contracts mathematically verify and enforce mint limits. |
| **Marcus Chen** | Sustainability Researcher | `4 / 5` | No | Outstanding transaction speeds on Testnet. Recommended adding project search/filters. |
| **Sarah Jenkins** | Retail Carbon Buyer | `5 / 5` | Yes | Real-time ledger updates provide total transparency. Solves the double-counting problem. |
| **David Kim** | Soroban Security Auditor | `5 / 5` | Yes | Cross-contract client invocation is highly secure. Verified that only authorized registry contract can trigger asset mints. |
| **Sophia Martinez** | Eco-Investments Partner | `4 / 5` | Yes | Dashboard UX is polished. Informative loading steps prevent users from feeling stuck during sign steps. |
| **Liam O'Connor** | Stellar Ecosystem Dev | `5 / 5` | Yes | Excellent implementation of SEP-41 token standard. Codebase is clean, modular, and easy to run locally. |
| **Amina Yusuf** | Grid Liaison | `4 / 5` | Yes | Reduces compliance reporting overhead from weeks to seconds. Perfect for automated ESG pipelines. |
| **Yukio Tanaka** | Carbon Offset Broker | `5 / 5` | No | Restoring credibility in offset markets by preventing greenwashing. Mathematical boundaries are ironclad. |
| **Clara Dupont** | NGO Program Lead | `5 / 5` | Yes | Beautiful design. Lower transaction costs on Stellar compared to Ethereum make micro-offsets viable. |

---

## 💡 Key Takeaways & Product Improvements

### 1. What Users Loved
* **Speed & Cost:** Stellar's sub-second ledger confirmation and negligible transaction costs were highly praised compared to traditional L1 networks.
* **Direct Verification (Telemetry -> Mint):** The automation of data verification by Oracles before projects can mint prevents inflation of carbon credits.
* **UI/UX Clarity:** Step-by-step transaction logs (`Step 1/6: Fetching account...` -> `Step 6/6: Sending...`) gave users confidence during Freighter wallet interactions.

### 2. Areas for Future Improvement (Level 5 Backlog)
* **Project Search & Filtering:** Implement project lookup tags and filters on the dashboard as the project volume grows.
* **Automated IoT Oracles:** Develop a background script (e.g., in Node/Rust) that pulls solar inverter API data and pushes it to the contract automatically, removing human auditor steps.
* **Retirement/Burn Analytics:** Implement a burn mechanism for carbon credits that updates a live 'Global Retreated Offset' tracker on the homepage.
