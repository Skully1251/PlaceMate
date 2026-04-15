# PlaceMate AI - End-to-End Preparation & Placement Platform

![PlaceMate AI Banner](https://img.shields.io/badge/PlaceMate-AI_Interview_Prep-blue?style=for-the-badge)

PlaceMate AI is a comprehensive web application designed to help users prepare for job interviews across various domains. Powered by the Groq API and offering an immersive experience with dynamic 3D visualizations, speech-to-text (STT), and text-to-speech (TTS), this platform offers realistic interview environments, resume building, and company-specific preparation.

## 🌟 Key Features

* **🤖 AI-Powered Mock Interviews**: Practice specialized interviews including DSA, HR, Behavioral, and Resume-based rounds.
* **🗣️ Voice Interaction**: Real-time voice-to-text for answering questions and text-to-speech to hear the interviewer, feeling like a real conversation.
* **📄 ATS Resume Checker & Generator**: Build tailored resumes and check ATS scores against job descriptions.
* **🏢 Company-Specific Prep**: Curated preparation materials and roadmaps for specific target companies.
* **📊 Interactive Dashboard**: Track your interview performance, scores, and progress.
* **✨ Dynamic 3D Visualizer**: Immersive visual feedback during interviews using Three.js/React-Three-Fiber.

## 🛠️ Tech Stack

* **Frontend**: React (Vite), Tailwind CSS, React-Three-Fiber (3D Orbs)
* **Main Backend**: Node.js, Express.js (Handling auth, ATS logic, user dashboards)
* **AI Backend**: Python, Groq API (Handling AI generation, speech, and core intelligence)
* **Database & Auth**: Firebase

## 📂 Project Structure

* `/client`: React frontend application built with Vite and Tailwind CSS.
* `/server`: Node.js and Express backend server managing user data, ATS logic, and MongoDB/Firebase interactions.
* `/backend`: Python AI backend dedicated to LLM processing, Groq API calls, and audio processing.

## 🔧 Prerequisites

* [Node.js](https://nodejs.org/) (version 18.x or later recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* [Python 3.8+](https://www.python.org/)
* Firebase Account setup
* A valid [Groq API key](https://console.groq.com/).

## 🚀 Setup & Installation

Follow these steps to get the application running on your local machine.

### 1. Main Node.js Server Setup

First, navigate into the `server` directory, install the necessary dependencies, and start the local server.

```bash
cd server
npm install
# Ensure you have your .env file or config set up for Firebase & Groq before running
node server.js
```

### 2. Python AI Backend Setup

Open a new terminal, navigate into the `backend` directory, install the required Python dependencies, and run the Python service.

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

### 3. Frontend Client Setup

Open a new terminal, navigate into the `client` directory, install the dependencies, and start the Vite development server.

```bash
cd client
npm install
npm run dev
```

## 🔐 Environment Variables

You will need to create `.env` files in your respective directories depending on how your credentials are laid out.
Typical required keys include:
- `GROQ_API_KEY`: For AI text and speech generation.
- `FIREBASE_API_KEY` / `FIREBASE_CONFIG`: For Firebase Authentication and Database.
- Any local port configurations.

## 🤝 Contributing

Contributions are welcome! Please fork the repository and create a pull request with your features or fixes.

## 📝 License

This project is not licensed yet.