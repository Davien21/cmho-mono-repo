#!/usr/bin/env python3
"""
Script to convert Infusions.csv to JSON format matching drugs.json structure
"""

import csv
import json
import os
from pathlib import Path

def convert_csv_to_json(csv_path, output_path):
    """
    Convert CSV file to JSON format matching drugs.json structure

    Args:
        csv_path: Path to input CSV file
        output_path: Path to output JSON file
    """
    infusions = []

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Skip empty rows
            if not row.get('Intravenous Fluids', '').strip():
                continue

            name = row['Intravenous Fluids'].strip()
            carton_quantity = row.get('Carton', '').strip()
            pieces_quantity = row.get('Pieces', '').strip()
            expiry_date = row.get('Expiry Date', '').strip()

            # Skip if name is empty
            if not name:
                continue

            # Parse carton quantity - convert to int if possible, default to 0 if empty
            try:
                carton_qty = int(carton_quantity) if carton_quantity else 0
            except ValueError:
                carton_qty = 0

            # Parse pieces quantity - convert to int if possible, default to 0 if empty
            try:
                pieces_qty = int(pieces_quantity) if pieces_quantity else 0
            except ValueError:
                pieces_qty = 0

            # Build units array with both Carton and Unit
            units = []

            # Always include Carton (even if quantity is 0)
            units.append({
                "name": "Carton",
                "plural": "Cartons",
                "quantity": carton_qty
            })

            # Always include Unit
            units.append({
                "name": "Unit",
                "plural": "Units",
                "quantity": pieces_qty
            })

            # Build the JSON object
            infusion_obj = {
                "name": name,
                "category": "Infusion",
                "units": units,
                "earliestExpiryDate": expiry_date if expiry_date else "",
                "laterExpiryDates": []
            }

            infusions.append(infusion_obj)

    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(infusions, jsonfile, indent=2, ensure_ascii=False)

    print(f"Successfully converted {len(infusions)} items to {output_path}")

if __name__ == "__main__":
    # Get the script directory
    script_dir = Path(__file__).parent

    # Define paths
    csv_path = Path("/Users/chidiebereekennia/Downloads/Infusions.csv")
    output_path = script_dir.parent / "inventory" / "infusions.json"

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert
    convert_csv_to_json(csv_path, output_path)

