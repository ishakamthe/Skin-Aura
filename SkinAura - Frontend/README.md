Frontend for Skin Aura:

Variables:

PRODUCTS TABLE

id - number (primary key)
name - string (product name)
brand - string (brand/company name)
safety - decimal 0 to 10 (safety score)
eco - decimal 0 to 10 (eco score)
image - string (image URL)
category - string (Cleanser, Face Wash, Moisturizer, Serum, Sunscreen)
description - string (short product description)


INGREDIENTS TABLE

product_id - number (links to products table)
name - string (ingredient name)
safety - string (only 3 values: low, moderate, high)
description - string (what the ingredient does)


AQI RECORDS TABLE

country - string
state - string
city - string
station - string (monitoring station name)
last_update - string (timestamp)
latitude - number
longitude - number
pollutant_id - string (PM2.5, PM10, NO2, SO2, CO, OZONE)
pollutant_min - number
pollutant_max - number
pollutant_avg - number

note: one station has multiple rows, one row per pollutant


COMPUTED (no separate table needed)

AVAILABLE_CITIES - distinct cities from aqi_records, used in map search
ALL_INGREDIENTS - distinct ingredient names, used in filter panel
ALL_COMPANIES - distinct brand names, used in filter panel
ALTERNATIVES - top 3 products by safety score in same category, excluding current product


SCORE LOGIC

safety bar color - light blue
eco bar color - green
score 8.5 to 10 - excellent
score 7.0 to 8.4 - good
score 5.0 to 6.9 - moderate
score below 5 - poor

ingredient dot colors
low = green
moderate = yellow
high = red

aqi map pin colors
0 to 50 = green (Good)
51 to 100 = yellow (Moderate)
101 to 200 = orange (Unhealthy)
201 to 300 = red (Very Unhealthy)
300+ = purple (Hazardous)