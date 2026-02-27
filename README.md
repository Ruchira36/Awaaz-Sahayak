# Awaaz Sahayak

**Awaaz Sahayak** is a voice-powered and image-recognition loan application assistant designed to make filling out loan forms easier for low-literacy users. Built with a React frontend and an Express/Node.js backend, this AI-driven tool allows users to simply converse in Hindi (via voice or text) and upload photos of documents to automatically populate a structured loan application form, which can then be downloaded as a PDF.

## 🌟 Key Features

*   **🎙️ Voice Interaction:** Leverages speech recognition (Hindi/Hinglish supported) to allow users to answer form questions naturally.
*   **📑 Smart Document Parsing:** Upload images of ID cards or related documents, and the AI extracts required details instantly.
*   **🧠 AI Form Extraction:** Powered by Google's Gemini LLM to semantically understand user input and precisely map it to the right form fields (Name, Annual Income, Loan Amount, Loan Purpose, Address, IDs, etc.).
*   **🔊 Audio Feedback (TTS):** Reads out the current question or status to dynamically guide users step-by-step through the application.
*   **📄 Automatic PDF Generation:** Generates a completed, formatted loan application PDF ready for download once all fields are collected.

---

## 🏗️ Project Architecture

The repository is structured as a monorepo containing both the frontend client and the backend server:

*   **`/client`**: The React-based frontend application. Built with Vite. Contains the user interface, voice recording logic (`VoiceRecorder`), and application state management.
*   **`/server`**: The Express.js backend. Defines API routes for AI processing (`/api/process`), parsing uploaded documents (`/api/extract`), and rendering the final PDF (`/api/generate-pdf`).

---

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18+)
*   **npm** or **yarn**
*   A **Gemini API Key** (for backend LLM integration)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Ruchira36/Awaaz-Sahayak.git
    cd Awaaz-Sahayak
    ```

2.  **Setup the Backend (`/server`):**
    ```bash
    cd server
    npm install
    ```
    Create a `.env` file in the `server` directory and add your Google Gemini API key:
    ```env
    PORT=3001
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

3.  **Setup the Frontend (`/client`):**
    ```bash
    cd ../client
    npm install
    ```

### Running the Application Locally

You need to run both the backend server and the frontend development server simultaneously.

**Terminal 1 (Backend):**
```bash
cd server
npm start
```
*Runs on `http://localhost:3001`*

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*Runs on `http://localhost:5173` (or the port specified by Vite)*

Open your browser and navigate to the local frontend URL to start using Awaaz Sahayak!

---

## 🛠️ Built With

*   **Frontend:** React, Vite
*   **Backend:** Node.js, Express.js
*   **AI Engine:** Google Generative AI (Gemini 1.5 Flash)
*   **PDF Generation:** `pdf-lib` (or standard PDF generation libraries)

## 📄 License

This project is licensed under the MIT License.
