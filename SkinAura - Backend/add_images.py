from product import PRODUCTS_DATA
import json
import urllib.parse

def generate_image_url(product):
    name = product.get("name", "")
    brand = product.get("brand", "")
    
    # Create search query
    query = f"{brand} {name} skincare product"
    encoded_query = urllib.parse.quote(query)

    # Google image search link
    return f"https://www.google.com/search?tbm=isch&q={encoded_query}"

def main():
    products = PRODUCTS_DATA["products"]

    for product in products:
        product["image"] = generate_image_url(product)

    with open("products_with_images.json", "w") as f:
        json.dump(products, f, indent=2)

    print(f"✅ Generated image links for {len(products)} products!")

if __name__ == "__main__":
    main()