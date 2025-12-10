#!/usr/bin/env python3
"""
Script to convert Consumables.csv to JSON format matching drugs.json structure
"""

import csv
import json
import os
from pathlib import Path

def parse_expiry_date(date_str):
    """
    Parse expiry date from MM/YY format to YYYY-MM-DD format
    Handles formats like: 03/30, 05/26, 02/31

    Args:
        date_str: Date string in MM/YY format

    Returns:
        String in YYYY-MM-DD format, or None if invalid
    """
    if not date_str or not date_str.strip():
        return None

    date_str = date_str.strip()

    try:
        # Handle MM/YY format (e.g., "03/30", "05/26")
        if '/' in date_str:
            parts = date_str.split('/')
            if len(parts) == 2:
                month = int(parts[0])
                year = int(parts[1])

                # If year is 2 digits, assume 2000s
                if year < 100:
                    year = 2000 + year

                # Use first day of the month as the expiry date
                return f"{year:04d}-{month:02d}-01"

    except (ValueError, IndexError):
        pass

    return None

def parse_quantity(value):
    """
    Parse quantity value from string to int

    Args:
        value: String value to parse

    Returns:
        Integer value or None if invalid/empty
    """
    if not value or not value.strip():
        return None

    try:
        return int(value.strip())
    except ValueError:
        return None

def convert_csv_to_json(csv_path, output_path):
    """
    Convert CSV file to JSON format matching drugs.json structure

    Args:
        csv_path: Path to input CSV file
        output_path: Path to output JSON file
    """
    consumables = []

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Skip empty rows
            if not row.get('Item', '').strip():
                continue

            name = row['Item'].strip()
            pack_str = row.get('Pack', '').strip()
            units_str = row.get('Units', '').strip()
            expiry_date_str = row.get('Expiry Date', '').strip()

            # Skip if name is empty
            if not name:
                continue

            # Parse quantities
            pack_qty = parse_quantity(pack_str)
            units_qty = parse_quantity(units_str)

            # Build units array based on the rules
            units = []

            if pack_qty is not None and units_qty is not None:
                # Both Pack and Units have values
                if pack_qty != units_qty:
                    # Different quantities: add both Pack and Unit objects
                    units.append({
                        "name": "Pack",
                        "plural": "Packs",
                        "quantity": pack_qty
                    })
                    units.append({
                        "name": "Unit",
                        "plural": "Units",
                        "quantity": units_qty
                    })
                else:
                    # Same quantities: just add Unit object
                    units.append({
                        "name": "Unit",
                        "plural": "Units",
                        "quantity": units_qty
                    })
            elif pack_qty is not None and units_qty is None:
                # Only Pack has value: just add Unit object
                units.append({
                    "name": "Unit",
                    "plural": "Units",
                    "quantity": pack_qty
                })
            elif units_qty is not None:
                # Only Units has value: just add Unit object
                units.append({
                    "name": "Unit",
                    "plural": "Units",
                    "quantity": units_qty
                })
            else:
                # Neither has value: add Unit with quantity 0
                units.append({
                    "name": "Unit",
                    "plural": "Units",
                    "quantity": 0
                })

            # Parse expiry date
            expiry_date = parse_expiry_date(expiry_date_str)

            # Build the JSON object
            consumable_obj = {
                "name": name,
                "category": "Consumable",
                "units": units,
                "earliestExpiryDate": expiry_date if expiry_date else "",
                "laterExpiryDates": []
            }

            consumables.append(consumable_obj)

    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(consumables, jsonfile, indent=2, ensure_ascii=False)

    print(f"Successfully converted {len(consumables)} items to {output_path}")

if __name__ == "__main__":
    # Get the script directory
    script_dir = Path(__file__).parent

    # Define paths
    csv_path = Path("/Users/chidiebereekennia/Downloads/Consumables.csv")
    output_path = script_dir / "inventory" / "consumables.json"

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert
    convert_csv_to_json(csv_path, output_path)

