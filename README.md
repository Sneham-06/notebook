# 🧠 NoteMind

NoteMind is an AI-powered "second brain" that allows you to upload, index, and converse with your documents. Built with a modern Next.js frontend and a powerful FastAPI backend, NoteMind uses state-of-the-art Large Language Models to help you extract insights from your research papers, meeting notes, and product specs.

![NoteMind](https://via.placeholder.com/1000x500.png?text=NoteMind+Dashboard)

## 🚀 Features

- **Semantic Document Search:** Upload PDFs and Markdown files. NoteMind automatically chunks, embeds, and indexes them using local ONNX-based embeddings.
- **Conversational AI:** Chat with your documents using the Groq API (Llama 3) for lightning-fast, highly accurate answers based strictly on your uploaded content.
- **Smart Tools:**
  - 🧐 **Blind Spot Scanner:** Identifies missing contexts or weak points in your documents.
  - 🎓 **Teach Me Mode:** Breaks down complex concepts into an easy-to-understand Socratic dialogue.
  - ⏳ **Time Capsule:** Summarizes the evolution of ideas across your notes.
- **Secure & Isolated:** Each session is isolated, ensuring your vector database is kept clean and contextual to your active session.
- **Export Capabilities:** Export your entire chat history and insights as beautiful Markdown or PDF reports.

---

## 🛠️ Tech Stack

### Frontend (Vercel)
- Next.js 14 (App Router)
- React & TypeScript
- Tailwind CSS
- Framer Motion (Animations)
- Axios & Sonner (Toast Notifications)

### Backend (Render)
- Python 3 & FastAPI
- LangChain (RAG pipeline orchestration)
- ChromaDB (Vector Database)
- FastEmbed (Lightweight ONNX Embeddings)
- PyPDF (Document processing)
- Groq API (LLM Inference)

---

## 💻 Local Development

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/notemind.git
cd notemind
```

### 2. Setup the Backend
```bash
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your Groq API key
echo "GROQ_API_KEY=your_groq_api_key_here" > .env

# Run the backend server
uvicorn main:app --reload --port 8000
```

### 3. Setup the Frontend
```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🌐 Deployment

This repository is configured for modern cloud deployment:

- **Frontend:** Deploy the `frontend/` folder to **Vercel**. Set the Root Directory to `frontend`.
- **Backend:** Deploy the `backend/` folder to **Render** as a Web Service.
  - **Build Command:** `pip install -r requirements.txt`
  - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
  - **Environment Variables:** Don't forget to set `GROQ_API_KEY` in the Render dashboard!

*Once the backend is deployed, ensure your frontend points to the live backend by setting `NEXT_PUBLIC_API_URL` in Vercel's Environment Variables or the `.env.production` file.*

---

## 📜 License

This project is open-source and available under the MIT License.
