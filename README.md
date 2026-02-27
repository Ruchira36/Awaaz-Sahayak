# Awaaz Sahayak (Voice-Powered Loan Assistant)

A full-stack, AI-driven loan application assistant designed to make filling out complex forms accessible for low-literacy users. It features voice interaction in Hindi/Hinglish, smart document extraction via OCR, semantic form-filling using Google Gemini, and automated PDF generation.

---

## 🌟 Features

### Core Functionalities
*   **🎙️ Voice Interaction:** Leverages speech recognition to allow users to answer form questions naturally in Hindi, Hinglish, or English.
*   **📑 Smart Document Parsing:** Upload images of ID cards or related documents, and the AI extracts required details instantly.
*   **🧠 AI Form Extraction:** Powered by Google's Gemini 1.5 Flash LLM to semantically understand user input and precisely map it to the right form fields (Name, Annual Income, Loan Amount, Loan Purpose, Address, IDs, etc.).
*   **🔊 Audio Feedback (TTS):** Reads out the current question or status to dynamically guide users step-by-step through the application.
*   **📄 Automatic PDF Generation:** Generates a completed, formatted loan application PDF ready for download once all fields are collected.

### User Interface
*   **Progress Tracking:** Visual indicators showing how many fields are complete.
*   **Live Chat History:** Chat bubbles displaying the back-and-forth conversation between the user and the AI assistant.
*   **Judge/Admin Dashboard:** A secondary panel for operators to view the extracted fields in real-time, monitor form state, and preview the final PDF.

---

## 💻 Tech Stack

### Frontend
*   **React (Vite)** - Fast, modern UI framework
*   **Web Speech API** - Native browser API for Speech-to-Text and Text-to-Speech
*   **CSS3** - Custom styling with responsive glassmorphism and modern UI elements

### Backend
*   **Node.js with Express.js** - REST API server
*   **@google/generative-ai** - Integration with Google's Gemini LLM
*   **pdf-lib** - For dynamic PDF creation and modification
*   **multer** - Middleware for handling multipart/form-data (image uploads)

---

## ⚙️ Prerequisites

*   **Node.js** (v18 or higher recommended)
*   **npm** or **yarn**
*   A valid **Google Gemini API Key**

---

## 🚀 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Ruchira36/Awaaz-Sahayak.git
   cd Awaaz-Sahayak
   ```

2. **Backend Setup**
   ```bash
   cd server
   npm install
   ```
   
   Create a `.env` file in the `server` directory and add your configuration:
   ```env
   PORT=3001
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Frontend Setup**
   ```bash
   cd ../client
   npm install
   ```

---

## 🏃‍♂️ Running the Application

You must run both the backend server and the frontend client simultaneously.

**Start Backend Server**
```bash
cd server
npm start
```
*Server runs on `http://localhost:3001`*

**Start Frontend Development Server**
```bash
cd client
npm run dev
```
*App runs on `http://localhost:5173` (or port specified by Vite)*

Open your browser and navigate to the frontend URL to start using Awaaz Sahayak. Note: Microphone and Audio permissions must be granted for the application to function properly.

---

## 📂 Project Structure

```text
Awaaz-Sahayak/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # React UI Components (UserPanel, JudgeDashboard, etc.)
│   │   ├── services/           # API integration (api.js)
│   │   ├── App.jsx             # Main Application Logic
│   │   └── index.css           # Global Styles
│   └── package.json
├── server/                     # Node.js/Express Backend
│   ├── config/
│   │   └── formSchema.js       # Definitions and system prompts for the Loan Form
│   ├── routes/
│   │   ├── extract.js          # Route for OCR and image extraction
│   │   ├── generatePdf.js      # Route for compiling the final PDF
│   │   └── process.js          # Route for processing voice transcripts via LLM
│   ├── server.js               # Application Entry Point
│   └── package.json
└── README.md
```

---

## 🔑 Key Functionalities Explained

### Natural Language Processing Loop
1. User speaks in Hindi/Hinglish (e.g., "Mera naam Rahul hai").
2. App sends the `transcript` and the `current form state` to `/api/process`.
3. Gemini LLM extracts the relevant data ("Rahul" -> `applicant_name`) without overwriting existing data.
4. Gemini determines the next logical question to ask based on missing fields.
5. The App updates the UI and uses Text-to-Speech to ask the next question.

### Document Extraction
1. User uploads an ID (like an Aadhaar card).
2. The image is sent to `/api/extract`.
3. Gemini Vision models read the image, extract text, and intelligently map details (Name, DOB, ID Number) directly into the form state.

---

## 🐛 Troubleshooting

**Speech Recognition Not Working**
*   Ensure you are using a browser that supports Web Speech API (Google Chrome is highly recommended).
*   Verify that you have granted microphone permissions when prompted.

**API Calls Failing (500 Errors)**
*   Ensure your `GEMINI_API_KEY` is correctly set in the `server/.env` file.
*   Check the backend terminal logs for detailed error messages.

**TTS Feedback Loop**
*   The application has built-in filters to prevent it from transcribing its own AI voice, but ensure your speakers aren't excessively loud next to your microphone.

---

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributors
*   Sakshi Borse
*   Gampala Aishwarya
*   Ruchira Patil
