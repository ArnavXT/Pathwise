# AI Learning & Productivity Platform (EPICS)

A full-stack, AI-powered learning and productivity platform designed to generate dynamic courses, adaptive quizzes, and provide gamified learning experiences. 

## 🚀 Features

- **Dynamic AI Courses**: Generate comprehensive learning modules and roadmaps on any topic using the OpenRouter AI API.
- **Adaptive Quizzing**: Challenge yourself with dynamically generated quizzes based on your course modules.
- **Gamification**: Earn XP, unlock badges, and track your progress as you learn.
- **Analytics Dashboard**: Visualize your learning journey with charts tracking your score trends, pass/fail rates, and knowledge gaps.
- **Rich Content Support**: Modules support Markdown and LaTeX equations out-of-the-box.
- **Export Capabilities**: Download your generated course materials as PDFs or ZIP archives.

## 🛠️ Technology Stack

**Frontend (`/client`)**
- React 19 + Vite
- React Router DOM for navigation
- Framer Motion for animations
- Recharts for analytics visualization
- Markdown & LaTeX rendering (`react-markdown`, `remark-math`, `rehype-katex`)

**Backend (`/server`)**
- Node.js & Express.js
- Axios for external API requests (OpenRouter)
- File-based JSON storage (`server/data/data.json`)
- Custom AI Services for interacting with language models

## ⚙️ Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- An **OpenRouter API Key**

## 🚦 Getting Started

### 1. Clone the repository
Ensure you are in the project root directory (`EPICS/`).

### 2. Environment Setup
Create a `.env` file in the root directory and add your OpenRouter API key:
```env
OPENROUTER_API_KEY=your_api_key_here
```

### 3. Start the Backend Server
Navigate to the `server` directory, install dependencies, and start the server:
```bash
cd server
npm install
npm start
```
The server will typically run on `http://localhost:5000` (or whatever port is configured).

### 4. Start the Frontend Development Server
Open a new terminal window, navigate to the `client` directory, install dependencies, and start Vite:
```bash
cd client
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## 📂 Project Structure

```text
EPICS/
├── client/              # React frontend application
│   ├── src/             # UI Components, Pages, and Assets
│   └── package.json     # Frontend dependencies
├── server/              # Node.js backend application
│   ├── data/            # Local JSON database storage
│   ├── tests/           # API testing scripts
│   ├── services/        # AI and business logic
│   ├── index.js         # Express entry point
│   └── package.json     # Backend dependencies
├── .env                 # Environment variables (API keys)
└── .gitignore           # Global git ignore rules
```

## 🧪 Testing

To test the backend AI generation capabilities independently of the frontend, you can run the test scripts provided in the server:

```bash
cd server/tests
node test_quiz.js
```
The output will be generated inside `test_output.json`.
# Pathwise
