#!/usr/bin/env python3
"""
Script to convert Injections.csv to JSON format matching drugs.json structure
"""

import csv
import json
import os
from pathlib import Path
from datetime import datetime

def parse_expiry_date(date_str):
    """
    Parse expiry date from MM/YY format to YYYY-MM-DD format
    Handles formats like: 1/28, 05/27, 7/25, 6/28

    Args:
        date_str: Date string in MM/YY format

    Returns:
        String in YYYY-MM-DD format, or None if invalid/empty
    """
    if not date_str or not date_str.strip():
        return None

    date_str = date_str.strip()

    try:
        # Handle MM/YY format (e.g., "1/28", "05/27", "7/25")
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
    Parse quantity value, handling "-" as 0 and empty strings

    Args:
        value: String value from CSV

    Returns:
        Integer quantity, or 0 if invalid/empty/"-"
    """
    if not value or not value.strip() or value.strip() == '-':
        return 0

    # Remove any special characters like asterisks (e.g., "*13*" -> "13")
    value = value.strip().replace('*', '')

    try:
        return int(value)
    except ValueError:
        return 0

def convert_csv_to_json(csv_path, output_path):
    """
    Convert CSV file to JSON format matching drugs.json structure

    Args:
        csv_path: Path to input CSV file
        output_path: Path to output JSON file
    """
    injections = []

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Skip empty rows
            name = row.get('Name', '').strip()
            if not name:
                continue

            pack_str = row.get('pack', '').strip()
            ampoule_vial_str = row.get('Ampoule/Vial', '').strip()
            expiry_date_str = row.get('Expiry date', '').strip()
            expiry_date2_str = row.get('Exp. date 2', '').strip()

            # Parse quantities
            pack_qty = parse_quantity(pack_str)
            ampoule_vial_qty = parse_quantity(ampoule_vial_str)

            # Build units array
            units = []

            # If both pack and Ampoule/Vial have values (non-zero), include both
            if pack_qty > 0 and ampoule_vial_qty > 0:
                units.append({
                    "name": "Pack",
                    "plural": "Packs",
                    "quantity": pack_qty
                })
                units.append({
                    "name": "Ampoule/Vial",
                    "plural": "Ampoules/Vials",
                    "quantity": ampoule_vial_qty
                })
            # If only Ampoule/Vial has a value, only include that
            elif ampoule_vial_qty > 0:
                units.append({
                    "name": "Ampoule/Vial",
                    "plural": "Ampoules/Vials",
                    "quantity": ampoule_vial_qty
                })
            # If only pack has a value, include only that
            elif pack_qty > 0:
                units.append({
                    "name": "Pack",
                    "plural": "Packs",
                    "quantity": pack_qty
                })

            # Parse expiry dates
            earliest_expiry = parse_expiry_date(expiry_date_str)
            later_expiry = parse_expiry_date(expiry_date2_str) if expiry_date2_str else None

            # Determine earliest and later dates
            later_expiry_dates = []
            if earliest_expiry and later_expiry:
                if later_expiry > earliest_expiry:
                    later_expiry_dates = [later_expiry]
                else:
                    # If later_expiry is earlier or equal, swap them
                    later_expiry_dates = [earliest_expiry]
                    earliest_expiry = later_expiry
            elif later_expiry:
                # Only later_expiry exists, use it as earliest
                earliest_expiry = later_expiry

            # Build the JSON object
            injection_obj = {
                "name": name,
                "category": "Injection",
                "units": units,
                "earliestExpiryDate": earliest_expiry if earliest_expiry else "",
                "laterExpiryDates": later_expiry_dates
            }

            injections.append(injection_obj)

    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(injections, jsonfile, indent=2, ensure_ascii=False)

    print(f"Successfully converted {len(injections)} items to {output_path}")

if __name__ == "__main__":
    # Get the script directory
    script_dir = Path(__file__).parent

    # Define paths
    csv_path = Path("/Users/chidiebereekennia/Downloads/Injections.csv")
    output_path = script_dir.parent / "inventory" / "injections.json"

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert
    convert_csv_to_json(csv_path, output_path)
