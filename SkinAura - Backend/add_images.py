from product import PRODUCTS_DATA
import json
import urllib.parse

def generate_image_url(product):
    brand = product.get("brand", "Brand")
    
    # URL encode the brand name so it's safe for a web link
    encoded_text = urllib.parse.quote(brand)

    # This returns a real .png image file with the brand name written on it
    return f"https://placehold.co/400x400/e2e8f0/1e293b.png?text={encoded_text}"

def main():
    products = PRODUCTS_DATA["products"]

    for product in products:
        product["image"] = generate_image_url(product)

    # Write back to a JSON file, or copy-paste the output back into your product.py
    with open("products_with_images.json", "w") as f:
        json.dump(PRODUCTS_DATA, f, indent=2)

    print(f"✅ Generated image links for {len(products)} products!")

if __name__ == "__main__":
    main()
