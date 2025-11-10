# Dashboard Data Sources Documentation

## Overview

This dashboard is fully data-driven using CSV files stored in the `public/local_data/` folder. The dashboard dynamically loads and aggregates data from these CSV files to populate all visualizations, metrics, and tables.

## Data Architecture

The dashboard uses 5 primary CSV data sources:

1. **metrics.csv** - Key performance metrics displayed in the top metrics cards
2. **products.csv** - Product family to product ID mapping for filtering
3. **measures.csv** - Time-series supply chain measures (demand, inventory, supply, etc.)
4. **recommendations.csv** - AI-generated recommendations and user-created actions
5. **segmentation.csv** - ABC-XYZ segmentation data for inventory classification

---

## CSV File Specifications

### 1. metrics.csv

**Purpose:** Defines the key metrics displayed in the top metrics cards section.

**Format:**
\`\`\`csv
metric_id,metric_name,unit_value,financial_value
\`\`\`

**Columns:**
- `metric_id` (string): Unique identifier for the metric (e.g., "demand", "inventory", "stockouts")
- `metric_name` (string): Display name of the metric (e.g., "Total Demand", "Current Inventory")
- `unit_value` (number): Metric value in units
- `financial_value` (number): Metric value in financial terms (base currency)

**Example:**
\`\`\`csv
metric_id,metric_name,unit_value,financial_value
demand,Total Demand,2400000,12000000
inventory,Current Inventory,487000,2435000
stockouts,Stockouts,12500,62500
excess,Excess Inventory,45000,225000
turns,Inventory Turns,4.9,4.9
\`\`\`

**Notes:**
- Financial values are in base currency (USD) and will be converted based on user's currency selection
- The `turns` metric uses the same value for both unit and financial since it's a ratio

---

### 2. products.csv

**Purpose:** Maps product IDs to product families for hierarchical filtering.

**Format:**
\`\`\`csv
product_family,product_id
\`\`\`

**Columns:**
- `product_family` (string): Product family/category name (e.g., "Spindles & Bearings")
- `product_id` (string): Unique product identifier (e.g., "CNC-SPN-001")

**Example:**
\`\`\`csv
product_family,product_id
Spindles & Bearings,CNC-SPN-001
Spindles & Bearings,CNC-SPN-002
Cutting Tools,CNC-CT-001
Cutting Tools,CNC-CT-002
Control Systems,CNC-CS-001
\`\`\`

**Notes:**
- Each product_id should appear only once
- Product families are used in dropdown filters
- Users can search for individual product_ids or select entire families

---

### 3. measures.csv

**Purpose:** Time-series data for supply chain measures across 20 weeks.

**Format:**
\`\`\`csv
measure_id,measure_name,product_id,location_id,w1,w2,w3,...,w20
\`\`\`

**Columns:**
- `measure_id` (string): Measure identifier with value type suffix
  - Format: `{measure_name}_{value_type}`
  - Value types: `unit_value` or `financial_value`
  - Examples: `demand_unit_value`, `demand_financial_value`
- `measure_name` (string): Name of the measure (e.g., "Demand", "On Hand Inventory")
- `product_id` (string): Product identifier (must match products.csv)
- `location_id` (string): Location/warehouse identifier (e.g., "DC1", "DC2", "DC3")
- `w1` through `w20` (numbers): Values for weeks 1-20

**Supported Measures:**
- `demand` - Customer demand
- `scheduled_supply` - Planned supply/production
- `in_transit` - Inventory in transit
- `target_inventory` - Target inventory levels
- `on_hand_inventory` - Current inventory on hand
- `supply_recommendations` - AI-recommended supply quantities

**Example:**
\`\`\`csv
measure_id,measure_name,product_id,location_id,w1,w2,w3,w4,w5,...,w20
demand_unit_value,Demand,CNC-SPN-001,DC1,1200,1250,1180,1300,1220,...,1280
demand_financial_value,Demand,CNC-SPN-001,DC1,6000,6250,5900,6500,6100,...,6400
on_hand_inventory_unit_value,On Hand Inventory,CNC-SPN-001,DC1,5000,4800,5200,4900,5100,...,5050
on_hand_inventory_financial_value,On Hand Inventory,CNC-SPN-001,DC1,25000,24000,26000,24500,25500,...,25250
\`\`\`

**Notes:**
- Each measure requires TWO rows per product/location combination:
  - One row with `_unit_value` suffix
  - One row with `_financial_value` suffix
- Financial values are in base currency (USD)
- All product_ids must exist in products.csv
- Week numbers represent sequential time periods (typically weeks)

**Aggregation Rules:**
- **Sum aggregation:** Used for most measures when aggregating across products/locations
  - Demand, Scheduled Supply, In-Transit, Target Inventory, On Hand Inventory, Supply Recommendations
- **Average aggregation:** Used for "days on hand" calculations
  - Days on hand = Inventory / Average Daily Demand
  - When aggregating days on hand across products, use average (not sum)

---

### 4. recommendations.csv

**Purpose:** AI-generated recommendations and user-created actions.

**Format:**
\`\`\`csv
id,source,name,type,severity,status
\`\`\`

**Columns:**
- `id` (string): Unique identifier for the recommendation/action
- `source` (string): Origin of the item
  - `recommendation` - AI-generated recommendation
  - `user_created_action` - User-created action item
- `name` (string): Description of the recommendation/action
- `type` (string): Category of the recommendation
  - Examples: "Inventory", "Supply", "Demand", "Quality", "Cost"
- `severity` (string): Priority level
  - `high` - Critical/urgent
  - `medium` - Important but not urgent
  - `low` - Nice to have
- `status` (string): Current state
  - `open` - Not yet addressed
  - `accepted` - Approved and in progress
  - `rejected` - Declined/not applicable

**Example:**
\`\`\`csv
id,source,name,type,severity,status
rec_001,recommendation,Increase safety stock for CNC-SPN-001 at DC1 by 500 units,Inventory,high,open
rec_002,recommendation,Expedite shipment for CNC-CT-015 to prevent stockout,Supply,high,accepted
action_001,user_created_action,Review supplier lead times for Control Systems,Supply,medium,open
rec_003,recommendation,Reduce order quantity for CNC-MS-008 due to low demand,Inventory,low,rejected
\`\`\`

**Notes:**
- Recommendations are displayed in the Supply Chain Trends section
- Users can accept, reject, or create new actions
- Status changes are tracked but not persisted to CSV (would require backend)

---

### 5. segmentation.csv

**Purpose:** ABC-XYZ inventory segmentation classification data.

**Format:**
\`\`\`csv
product_id,ABC_value,XYZ_value,on_hand_inventory_unit,on_hand_inventory_financial,target_inventory_unit,target_inventory_financial
\`\`\`

**Columns:**
- `product_id` (string): Product identifier (must match products.csv)
- `ABC_value` (string): ABC classification based on value/revenue
  - `A` - High value (top 20% of products, 80% of value)
  - `B` - Medium value (next 30% of products, 15% of value)
  - `C` - Low value (bottom 50% of products, 5% of value)
- `XYZ_value` (string): XYZ classification based on demand variability
  - `X` - Low variability (predictable demand)
  - `Y` - Medium variability (moderate fluctuation)
  - `Z` - High variability (unpredictable demand)
- `on_hand_inventory_unit` (number): Current inventory in units
- `on_hand_inventory_financial` (number): Current inventory value in base currency
- `target_inventory_unit` (number): Target inventory level in units
- `target_inventory_financial` (number): Target inventory value in base currency

**Example:**
\`\`\`csv
product_id,ABC_value,XYZ_value,on_hand_inventory_unit,on_hand_inventory_financial,target_inventory_unit,target_inventory_financial
CNC-SPN-001,A,X,5000,25000,4500,22500
CNC-SPN-002,A,Y,4200,21000,4000,20000
CNC-CT-001,B,X,3500,17500,3200,16000
CNC-CT-015,C,Z,1200,6000,1500,7500
\`\`\`

**Notes:**
- Each product_id should appear only once
- ABC-XYZ creates a 3x3 matrix (9 segments total)
- Segmentation data is aggregated by segment for the matrix view
- Financial values are in base currency (USD)

---

## Data Relationships

\`\`\`
products.csv (product_id, product_family)
    ↓
    ├─→ measures.csv (product_id, location_id, weekly values)
    ├─→ segmentation.csv (product_id, ABC/XYZ classification)
    └─→ recommendations.csv (references products in descriptions)

metrics.csv (standalone, aggregated metrics)
\`\`\`

**Key Relationships:**
1. All `product_id` values in measures.csv and segmentation.csv must exist in products.csv
2. Measures are aggregated by product_family (from products.csv) and location_id
3. Segmentation is aggregated by ABC_value and XYZ_value combinations
4. Metrics are pre-aggregated and displayed as-is

---

## Data Generation Guidelines

### For CNC Machine Parts Example:

**Product Families (4 families):**
1. Spindles & Bearings
2. Cutting Tools
3. Control Systems
4. Motion Systems

**Locations (3 warehouses):**
- DC1 (North America)
- DC2 (Europe)
- DC3 (Asia Pacific)

**Product Count:** ~100 products distributed across families

### Generating measures.csv:

For each product and location combination, generate:
1. 6 measures × 2 value types = 12 rows per product/location
2. Total rows: 100 products × 3 locations × 12 rows = 3,600 rows

**Realistic Value Ranges:**
- Demand: 800-2000 units/week
- On Hand Inventory: 3000-8000 units
- Target Inventory: 2500-7000 units
- In-Transit: 500-2000 units
- Scheduled Supply: 1000-2500 units
- Supply Recommendations: 1000-2500 units

**Financial Conversion:**
- Use realistic unit prices: $5-$50 per unit depending on product type
- Spindles & Bearings: $15-$30/unit
- Cutting Tools: $8-$20/unit
- Control Systems: $25-$50/unit
- Motion Systems: $12-$28/unit

### Generating segmentation.csv:

**ABC Distribution (Pareto Principle):**
- A products: 20% of products (20 products) - High value
- B products: 30% of products (30 products) - Medium value
- C products: 50% of products (50 products) - Low value

**XYZ Distribution:**
- X products: 40% - Low variability (predictable)
- Y products: 35% - Medium variability
- Z products: 25% - High variability (unpredictable)

---

## Currency Handling

All financial values in CSV files should be in **base currency (USD)**.

The dashboard will automatically convert to user-selected currency:
- USD ($) - 1.0x multiplier
- EUR (€) - 0.92x multiplier
- INR (₹) - 83.0x multiplier

**Example:**
- CSV value: 10000 (USD)
- Display in EUR: €9,200
- Display in INR: ₹830,000

---

## Data Loading Process

1. **On Dashboard Load:**
   - All CSV files are fetched from `public/local_data/`
   - Data is parsed and stored in React Context
   - Components subscribe to data context

2. **Filtering:**
   - User selects product family or product_id
   - User selects location
   - Data is filtered and aggregated in real-time

3. **Aggregation:**
   - Product family filter: Sum all products in that family
   - Location filter: Sum all locations or filter to specific location
   - Days on hand: Calculate as average (not sum)

4. **Display:**
   - Values shown based on unit toggle (Units or Currency)
   - Currency symbol based on user's currency selection
   - Time series displayed across 20 weeks

---

## Testing Your CSV Files

**Validation Checklist:**

1. ✅ All product_ids in measures.csv exist in products.csv
2. ✅ All product_ids in segmentation.csv exist in products.csv
3. ✅ Each measure has both unit_value and financial_value rows
4. ✅ All rows have exactly 20 week columns (w1-w20)
5. ✅ No missing or null values in critical columns
6. ✅ Financial values are reasonable (unit_value × unit_price)
7. ✅ ABC distribution follows Pareto principle (~20/30/50)
8. ✅ All CSV files use consistent product_id format
9. ✅ Location IDs are consistent across measures.csv
10. ✅ Metric IDs in metrics.csv match expected values

**Common Issues:**
- Missing product_ids in products.csv → Products won't appear in filters
- Mismatched measure_id format → Data won't load correctly
- Missing week columns → Chart will show incomplete data
- Inconsistent location_ids → Filtering won't work properly

---

## Example Data Generation Script (Pseudocode)

\`\`\`python
# Generate products.csv
product_families = ["Spindles & Bearings", "Cutting Tools", "Control Systems", "Motion Systems"]
products = []
for family in product_families:
    for i in range(25):  # 25 products per family = 100 total
        product_id = f"{family_code}-{i:03d}"
        products.append({"product_family": family, "product_id": product_id})

# Generate measures.csv
locations = ["DC1", "DC2", "DC3"]
measures = ["demand", "scheduled_supply", "in_transit", "target_inventory", "on_hand_inventory", "supply_recommendations"]
value_types = ["unit_value", "financial_value"]

for product in products:
    for location in locations:
        for measure in measures:
            for value_type in value_types:
                row = {
                    "measure_id": f"{measure}_{value_type}",
                    "measure_name": measure.replace("_", " ").title(),
                    "product_id": product["product_id"],
                    "location_id": location
                }
                # Generate 20 weeks of data
                for week in range(1, 21):
                    row[f"w{week}"] = generate_realistic_value(measure, value_type)
                measures_data.append(row)

# Generate segmentation.csv
for product in products:
    abc = assign_abc_classification(product)  # Based on value
    xyz = assign_xyz_classification(product)  # Based on variability
    segmentation_data.append({
        "product_id": product["product_id"],
        "ABC_value": abc,
        "XYZ_value": xyz,
        "on_hand_inventory_unit": random.randint(3000, 8000),
        "on_hand_inventory_financial": unit_value * unit_price,
        "target_inventory_unit": random.randint(2500, 7000),
        "target_inventory_financial": target_unit * unit_price
    })
\`\`\`

---

## Support

For questions or issues with data formatting, please refer to this documentation or contact the development team.

**Last Updated:** 2025
**Version:** 1.0
