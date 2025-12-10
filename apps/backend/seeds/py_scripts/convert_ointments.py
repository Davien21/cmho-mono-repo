#!/usr/bin/env python3
"""
Script to convert Ointments.csv to JSON format matching drugs.json structure
"""

import csv
import json
import os
from pathlib import Path

def parse_expiry_date(date_str):
    """
    Parse expiry date from MM/YY format to YYYY-MM-DD format
    Handles formats like: 11/26, 02/27, 05/25

    Args:
        date_str: Date string in MM/YY format

    Returns:
        String in YYYY-MM-DD format, or None if invalid/empty
    """
    if not date_str or not date_str.strip():
        return None

    date_str = date_str.strip()

    try:
        # Handle MM/YY format (e.g., "11/26", "02/27")
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

def convert_csv_to_json(csv_path, output_path):
    """
    Convert CSV file to JSON format matching drugs.json structure

    Args:
        csv_path: Path to input CSV file
        output_path: Path to output JSON file
    """
    ointments = []

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Skip empty rows
            if not row.get('Ointments', '').strip():
                continue

            name = row['Ointments'].strip()
            units_quantity = row.get('units', '').strip()
            expiry_date = row.get('Expiry date', '').strip()

            # Skip if name is empty
            if not name:
                continue

            # Parse quantity - convert to int if possible
            try:
                quantity = int(units_quantity) if units_quantity else 0
            except ValueError:
                quantity = 0

            # Parse expiry date
            parsed_expiry = parse_expiry_date(expiry_date)

            # Build the JSON object
            ointment_obj = {
                "name": name,
                "category": "Ointment",
                "units": [
                    {
                        "name": "Unit",
                        "plural": "Units",
                        "quantity": quantity
                    }
                ],
                "earliestExpiryDate": parsed_expiry if parsed_expiry else "",
                "laterExpiryDates": []
            }

            ointments.append(ointment_obj)

    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(ointments, jsonfile, indent=2, ensure_ascii=False)

    print(f"Successfully converted {len(ointments)} items to {output_path}")

if __name__ == "__main__":
    # Get the script directory
    script_dir = Path(__file__).parent

    # Define paths
    csv_path = Path("/Users/chidiebereekennia/Downloads/Ointments.csv")
    output_path = script_dir / "inventory" / "ointments.json"

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert
    convert_csv_to_json(csv_path, output_path)
