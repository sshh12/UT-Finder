from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
hits = [0]


NOTIFICATIONS = [
    dict(time=1582581300000, title="Test2", text="Testing.")
]


@app.route("/")
def index():
    return "Hi!"


@app.route("/api/hits")
def cnt_hits():
    return jsonify({'hits': hits[0]})


@app.route("/api/notifications", methods=["GET"])
def notifications():
    hits[0] += 1
    notifs = [{'hash': hash(d['title'] + str(d['time'])), **d} 
        for d in NOTIFICATIONS]
    return jsonify(notifs)


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)