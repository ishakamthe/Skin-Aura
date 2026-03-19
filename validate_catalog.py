from __future__ import annotations

from collections import Counter, defaultdict

from ingredient import INGREDIENTS_DATA
from product import PRODUCTS_DATA


def main() -> None:
    products = PRODUCTS_DATA.get("products", [])
    ingredients = INGREDIENTS_DATA.get("ingredients", [])

    product_ids = {p.get("id") for p in products}
    ingredient_product_ids = [i.get("product_id") for i in ingredients]

    unknown_product_ids = sorted(
        {pid for pid in ingredient_product_ids if pid is not None and pid not in product_ids}
    )

    counts = Counter(pid for pid in ingredient_product_ids if pid is not None)
    missing_ingredients = sorted(pid for pid in product_ids if pid is not None and counts.get(pid, 0) == 0)

    print(f"Products: {len(products)}")
    print(f"Ingredients rows: {len(ingredients)}")
    print(f"Distinct product_ids in ingredients: {len(counts)}")

    if unknown_product_ids:
        print("\nERROR: ingredients reference missing products:")
        for pid in unknown_product_ids:
            print(f"- product_id {pid} (ingredients rows: {counts.get(pid, 0)})")
    else:
        print("\nOK: no ingredients reference missing products.")

    if missing_ingredients:
        print("\nERROR: products missing any ingredients rows:")
        for pid in missing_ingredients[:50]:
            print(f"- product id {pid}")
        if len(missing_ingredients) > 50:
            print(f"... and {len(missing_ingredients) - 50} more")
    else:
        print("\nOK: every product has at least 1 ingredient row.")

    # Optional: quick sanity—top products by ingredient count
    top = counts.most_common(5)
    if top:
        print("\nTop 5 products by ingredient rows:")
        for pid, n in top:
            print(f"- {pid}: {n}")


if __name__ == "__main__":
    main()

