from flask import Flask, request, Response, stream_template
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins='*', supports_credentials=True)

@app.route('/proxy/<path:url>')
def proxy(url):
    try:
        r = requests.get('http://' + url, stream=True, timeout=10)
        def generate():
            for chunk in r.iter_content(chunk_size=8192):
                yield chunk
        return Response(generate(), mimetype=r.headers.get('content-type', 'application/octet-stream'))
    except:
        return 'Error loading stream', 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
