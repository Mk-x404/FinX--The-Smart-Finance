# FinX - Financial Dashboard & AI Advisor

FinX is a premium, high-performance financial management dashboard designed for professionals to track income, expenses, and loans with real-time AI-powered insights.

## ✨ Key Features
-   **Dashboard Overview**: Real-time stats on income, expenses, and savings.
-   **Financial Health Score**: Dynamic AI-calculated score between 0-100.
-   **Strict Budget Limits**: Core logic that prevents overspending by blocking expenses that exceed your monthly budget.
-   **AI Financial Advisor**: An intelligent chat advisor (powered by OpenRouter/Gemma 2) that provides personalized financial advice using clear Markdown formatting.
-   **Udhar (Loan) Tracker**: Manage pending loans and track repayment plans.
-   **Premium UI**: Smooth GSAP animations, glassmorphic design, and responsive layout.

## 🛠 Tech Stack
-   **Frontend**: React, Vite, GSAP, Recharts, Lucide Icons.
-   **Backend**: Express.js, Better-SQLite3.
-   **AI**: OpenRouter (Gemma 2) / Google Gemini API.

## 🚀 Setup & Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your `.env` file with your `GEMINI_API_KEY`.
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 🔒 Security
Sensitive data like `.env` and `finsight.db` are excluded from version control to ensure privacy and security.
