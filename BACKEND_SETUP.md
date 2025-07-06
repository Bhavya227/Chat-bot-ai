# FastAPI + Groq API Backend Setup Guide

## Overview

This document provides a complete guide for setting up the FastAPI backend that powers the React chatbot frontend. The backend integrates with Groq API for streaming chat completions and maintains context-aware conversations.

## Backend Architecture

### Tech Stack
- **FastAPI**: Modern, fast web framework for building APIs
- **Groq API**: High-performance inference for chat completions
- **Streaming**: Real-time response delivery
- **CORS**: Cross-origin resource sharing for React frontend

### Directory Structure
```
backend/
├── main.py              # FastAPI application
├── requirements.txt     # Python dependencies
├── models.py           # Pydantic models
├── chat_service.py     # Groq API integration
└── .env               # Environment variables
```

## Step-by-Step Implementation

### 1. Environment Setup

Create a virtual environment and install dependencies:

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn groq python-dotenv
```

### 2. Create `requirements.txt`

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
groq==0.4.1
python-dotenv==1.0.0
```

### 3. Environment Variables (`.env`)

```env
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Pydantic Models (`models.py`)

```python
from pydantic import BaseModel
from typing import List, Optional

class ChatRequest(BaseModel):
    user_query: str
    system_prompt: Optional[str] = "You are a helpful AI assistant."

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatHistory(BaseModel):
    messages: List[ChatMessage]
```

### 5. Groq Service (`chat_service.py`)

```python
import os
from groq import Groq
from typing import List, Dict, AsyncGenerator
import json

class ChatService:
    def __init__(self):
        self.client = Groq(
            api_key=os.getenv("GROQ_API_KEY")
        )
    
    async def stream_chat_completion(
        self, 
        messages: List[Dict[str, str]], 
        model: str = "llama3-70b-8192"
    ) -> AsyncGenerator[str, None]:
        """
        Stream chat completion from Groq API
        """
        try:
            stream = self.client.chat.completions.create(
                messages=messages,
                model=model,
                temperature=0.7,
                max_tokens=1024,
                top_p=1,
                stream=True,
                stop=None,
            )
            
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            yield f"Error: {str(e)}"
    
    def prepare_messages(self, user_query: str, system_prompt: str, history: List[Dict] = None) -> List[Dict[str, str]]:
        """
        Prepare messages for Groq API including system prompt and history
        """
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history if provided
        if history:
            messages.extend(history)
        
        # Add current user message
        messages.append({"role": "user", "content": user_query})
        
        return messages
```

### 6. Main FastAPI Application (`main.py`)

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from models import ChatRequest
from chat_service import ChatService
import os
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="AI Chat Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize chat service
chat_service = ChatService()

@app.get("/")
async def root():
    return {"message": "AI Chat Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-chat-backend"}

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Main chat endpoint that handles streaming responses
    """
    try:
        if not request.user_query.strip():
            raise HTTPException(status_code=400, detail="User query cannot be empty")
        
        # Prepare messages for Groq API
        messages = chat_service.prepare_messages(
            user_query=request.user_query,
            system_prompt=request.system_prompt
        )
        
        # Return streaming response
        return StreamingResponse(
            chat_service.stream_chat_completion(messages),
            media_type="text/plain"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Context-aware chat endpoint with history
@app.post("/chat-with-history")
async def chat_with_history(request: dict):
    """
    Enhanced chat endpoint that maintains conversation history
    """
    try:
        user_query = request.get("user_query", "")
        system_prompt = request.get("system_prompt", "You are a helpful AI assistant.")
        history = request.get("history", [])
        
        if not user_query.strip():
            raise HTTPException(status_code=400, detail="User query cannot be empty")
        
        # Prepare messages including history
        messages = chat_service.prepare_messages(
            user_query=user_query,
            system_prompt=system_prompt,
            history=history
        )
        
        # Return streaming response
        return StreamingResponse(
            chat_service.stream_chat_completion(messages),
            media_type="text/plain"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

## Running the Backend

### 1. Set up your Groq API Key

1. Visit [Groq Console](https://console.groq.com)
2. Create an account and get your API key
3. Add it to your `.env` file

### 2. Start the FastAPI server

```bash
# Development mode with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or run directly
python main.py
```

### 3. Test the API

Visit `http://localhost:8000/docs` to see the interactive API documentation.

Test the chat endpoint:
```bash
curl -X POST "http://localhost:8000/chat" \
     -H "Content-Type: application/json" \
     -d '{"user_query": "Hello, how are you?", "system_prompt": "You are a helpful assistant."}'
```

## Context-Aware Implementation

### Frontend Context Management

The React frontend manages context through:

1. **Local State**: Messages are stored in React state using the `useChat` hook
2. **Session Persistence**: Chat history persists during the browser session
3. **Message Threading**: Each message maintains its relationship to the conversation

### Backend Context Enhancement

For production, consider these enhancements:

1. **Session Management**: Store conversations by session ID
2. **Database Integration**: Persist chat history in a database
3. **Context Trimming**: Limit context length to avoid token limits
4. **User Authentication**: Associate conversations with specific users

### Enhanced Context Implementation

```python
# Enhanced chat service with context management
class EnhancedChatService(ChatService):
    def __init__(self):
        super().__init__()
        self.conversations = {}  # In-memory storage (use DB in production)
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        return self.conversations.get(session_id, [])
    
    def add_to_conversation(self, session_id: str, role: str, content: str):
        if session_id not in self.conversations:
            self.conversations[session_id] = []
        
        self.conversations[session_id].append({
            "role": role,
            "content": content
        })
    
    def trim_context(self, messages: List[Dict], max_tokens: int = 3000) -> List[Dict]:
        """
        Trim conversation history to stay within token limits
        Keep system message and recent conversation
        """
        if len(messages) <= 3:  # system + user + assistant minimum
            return messages
        
        # Keep system message and last N exchanges
        system_msg = messages[0]
        recent_messages = messages[-6:]  # Last 3 exchanges
        
        return [system_msg] + recent_messages
```

## Error Handling & Production Considerations

### Error Handling
- Implement comprehensive error handling for API failures
- Add retry logic for transient failures
- Validate input data thoroughly
- Log errors for debugging

### Production Deployment
- Use environment-specific configurations
- Implement proper logging
- Add health checks and monitoring
- Use a production ASGI server (Gunicorn + Uvicorn)
- Implement rate limiting and authentication
- Use a proper database for conversation storage

### Security
- Validate and sanitize all inputs
- Implement API key management
- Add CORS configuration for your domain
- Use HTTPS in production
- Implement request rate limiting

## Testing the Complete System

1. Start the FastAPI backend: `uvicorn main:app --reload`
2. Start the React frontend: `npm run dev`
3. Open `http://localhost:8080` (or your React dev server port)
4. Start chatting with the AI assistant

The system now provides:
- ✅ Real-time streaming responses
- ✅ Context-aware conversations
- ✅ Beautiful, responsive UI
- ✅ Error handling and feedback
- ✅ Session-based chat history
- ✅ Easy backend integration

## Groq API Models

Available models and their characteristics:

- `llama3-70b-8192`: Large model, high quality responses
- `llama3-8b-8192`: Smaller model, faster responses
- `mixtral-8x7b-32768`: Good balance of speed and quality
- `gemma-7b-it`: Efficient for most tasks

Choose based on your performance and quality requirements.