from flask import Flask, render_template, request, send_file, jsonify
import os
from PyPDF2 import PdfReader
from gtts import gTTS
from pydub import AudioSegment
import threading

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def convert_pdf_to_audio(filename, speed):
    # Convert PDF to text
    reader = PdfReader(filename)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    
    # Convert text to speech
    tts = gTTS(text=text, lang='en')
    audio_filename = os.path.splitext(os.path.basename(filename))[0] + '.mp3'
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename)
    tts.save(audio_path)
    
    # Adjust speed
    if speed != 1.0:
        audio = AudioSegment.from_mp3(audio_path)
        adjusted_audio = audio.speedup(playback_speed=speed)
        adjusted_audio.export(audio_path, format="mp3")
    
    # Clean up the PDF file
    os.remove(filename)

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'})
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'})
        if file and allowed_file(file.filename):
            filename = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(filename)
            
            # Get speed factor
            speed = float(request.form.get('speed', 1.0))
            
            # Start conversion in a separate thread
            threading.Thread(target=convert_pdf_to_audio, args=(filename, speed)).start()
            
            return jsonify({'message': 'Conversion started', 'filename': os.path.splitext(file.filename)[0] + '.mp3'})
    return render_template('index.html')

@app.route('/download/<filename>')
def download(filename):
    return send_file(os.path.join(app.config['UPLOAD_FOLDER'], filename), as_attachment=True)

if __name__ == '__main__':
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    app.run(debug=True)