from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import base64
import io
from openai import OpenAI
from pydantic import BaseModel
import tempfile
import os
from dotenv import load_dotenv 

app = Flask(__name__)
CORS(app)  # Frontend JS
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))  # Tu key Colab

# TU CÓDIGO EXACTO (functions, instructions_agent1, etc)
# [Pega aquí: speech_to_text, encode_image, call_agent1_streaming, etc]

@app.route('/')
def index():
    return send_file('templates/index.html')  # Tu HTML chat

@app.route('/chat', methods=['POST'])
def chat_multimodal():
    data = request.json
    text = data.get('text', '')
    image_b64 = data.get('image_b64')  # Frontend envía base64
    audio_file = request.files.get('audio')
    
    # 1. Audio → Whisper
    if audio_file:
        audio_path = tempfile.mktemp(suffix='.mp3')
        audio_file.save(audio_path)
        text = speech_to_text(open(audio_path, 'rb'))
    
    # 2. Imagen → base64 listo
    conversation_history = data.get('history', [])  # Frontend envía historial
    
    # 3. Llama tu agente
    if image_b64:
        response = call_agent_with_image(image_b64, text, conversation_history)
    else:
        response = call_agent1_streaming(conversation_history + [{'role': 'user', 'content': text}])
    
    return jsonify({'response': response, 'history': conversation_history})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
