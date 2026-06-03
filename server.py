import os
from flask import Flask, request, jsonify

# Initialize Flask app to serve static files from the root directory
# static_folder='.' sets the root directory as the source for static files
# static_url_path='' makes files accessible at http://localhost:5000/filename.ext
app = Flask(__name__, static_folder='.', static_url_path='')

from groq import Groq

# Basic CORS headers implementation
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization,X-Groq-API-Key'
    response.headers['Access-Control-Allow-Methods'] = 'GET,POST,OPTIONS'
    return response

# Serve the index.html on root request
@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        data = request.json or {}
        messages = data.get('messages', [])
        
        # Determine the API key
        # Check header first, then look for GROQ_API_KEY environment variable
        api_key = request.headers.get('X-Groq-API-Key') or os.environ.get('GROQ_API_KEY')
        
        # Check fallback to local api.txt file if no key is provided in headers/env
        if not api_key or api_key == "YOUR_KEY" or api_key.strip() == "":
            try:
                api_txt_path = os.path.join(os.path.dirname(__file__), 'api.txt')
                if os.path.exists(api_txt_path):
                    with open(api_txt_path, 'r', encoding='utf-8') as f:
                        line = f.read().strip()
                        if 'groq api =' in line:
                            api_key = line.split('groq api =')[1].strip()
                        elif '=' in line:
                            api_key = line.split('=')[1].strip()
                        else:
                            api_key = line
            except Exception as e:
                print("Failed to read key from api.txt:", str(e))
                
        if not api_key or api_key == "YOUR_KEY" or api_key.strip() == "":
            return jsonify({
                "error": "Groq API Key not found. Please set your key in the chatbot's API settings modal, write it to api.txt, or set the GROQ_API_KEY environment variable."
            }), 400
            
        # Initialize Groq client using your snippet pattern
        client = Groq(api_key=api_key)
        
        # Format the system instruction and messages based on chosen persona
        persona = data.get('persona', 'friend')
        custom_persona_text = data.get('customPersonaText', '')
        
        if persona == 'teacher':
            system_instruction = "You are RockStar, acting as a wise, patient, and knowledgeable teacher/mentor. Explain concepts in a clear, structured, and educational manner. Ask guiding questions to help the student learn, and provide constructive feedback. Keep it encouraging and readable. Always answer in character as a supportive teacher."
        elif persona == 'brother':
            system_instruction = "You are RockStar, acting as a supportive, cool older brother. Speak in a casual, warm, and slightly teasing but highly caring tone. Use modern casual language/slang. Give down-to-earth advice, cheer the user on, and have their back. Keep it clean, fun, and readable. Always answer in character as a caring brother."
        elif persona == 'custom':
            system_instruction = f"You are RockStar, but you must adopt the following persona/characteristics: {custom_persona_text}. Answer the user's messages in character according to these guidelines. Keep it clean and readable."
        else: # 'friend' or default
            system_instruction = "You are RockStar, a highly friendly, energetic, and helpful student companion and study partner. Answer student requests with concise, actionable, and encouraging advice. Use emojis where relevant. Keep it clean and readable. Always answer in character as RockStar."
        
        formatted_messages = [{"role": "system", "content": system_instruction}]
        
        for msg in messages:
            role = msg.get('role')
            content = msg.get('content')
            if role and content:
                formatted_messages.append({"role": role, "content": content})
            else:
                # Fallback mapping in case of key mismatch
                sender = msg.get('sender')
                text = msg.get('text')
                role_map = {'user': 'user', 'bot': 'assistant', 'assistant': 'assistant', 'system': 'system'}
                formatted_messages.append({"role": role_map.get(sender, 'user'), "content": text})

        # Call Groq API using the structure from your python snippet
        chat_completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=formatted_messages
        )
        
        # Extract the reply matching choices[0].message.content from your snippet
        reply_content = chat_completion.choices[0].message.content
        
        return jsonify({"reply": reply_content})
        
    except Exception as e:
        print("Error during Groq API call:", str(e))
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting RockStar Chatbot Python backend and frontend server on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
