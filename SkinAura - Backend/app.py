from flask import Flask, jsonify
from flask_cors import CORS
from products import products

app = Flask(__name__)
CORS(app)

@app.route("/products")
def get_products():
    return jsonify(products)

if __name__ == "__main__":
    app.run()
