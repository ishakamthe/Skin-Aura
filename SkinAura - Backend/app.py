from flask import Flask, jsonify
from flask_cors import CORS
from collections import Counter, defaultdict

from product import PRODUCTS_DATA
from ingredient import INGREDIENTS_DATA

app = Flask(__name__)
CORS(app)

# Pre-build ingredient lookup by product_id for performance
_ingredients_by_product = defaultdict(list)
for ing in INGREDIENTS_DATA["ingredients"]:
    _ingredients_by_product[ing["product_id"]].append({
        "name": ing["name"],
        "safety": ing["safety"],
        "description": ing["description"],
    })

@app.route("/")
def home():
    return "SkinAura API running"


@app.route("/products")
def get_products():
    """Products with ingredients embedded — used for filtering and display"""
    products = []
    for p in PRODUCTS_DATA["products"]:
        products.append({
            **p,
            "ingredients": _ingredients_by_product.get(p["id"], []),
        })
    return jsonify(products)

@app.route("/ingredients/<int:product_id>")
def get_ingredients(product_id):
    return jsonify(_ingredients_by_product.get(product_id, []))

@app.route("/ingredients")
def get_all_ingredients():
    """Distinct ingredient names sorted by frequency (most used first)"""
    counts = Counter(i["name"] for i in INGREDIENTS_DATA["ingredients"])
    return jsonify([name for name, _ in counts.most_common()])

@app.route("/brands")
def get_brands():
    """Distinct brand names sorted by frequency (most products first)"""
    counts = Counter(p["brand"] for p in PRODUCTS_DATA["products"])
    return jsonify([brand for brand, _ in counts.most_common()])

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)