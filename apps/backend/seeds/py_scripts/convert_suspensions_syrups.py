#!/usr/bin/env python3
"""
Script to convert Suspensions and syrups.csv to JSON format matching drugs.json structure
"""

import csv
import json
import os
from pathlib import Path
from datetime import datetime

def parse_expiry_date(date_str):
    """
    Parse expiry date from MM/YY format to YYYY-MM-DD format
    Handles formats like: 1/28, 05/27, 06/2026, N/A

    Args:
        date_str: Date string in MM/YY or MM/YYYY format

    Returns:
        String in YYYY-MM-DD format, or None if invalid/N/A
    """
    if not date_str or date_str.strip().upper() == 'N/A':
        return None

    date_str = date_str.strip()

    try:
        # Handle MM/YY format (e.g., "1/28", "05/27")
        if len(date_str.split('/')) == 2:
            parts = date_str.split('/')
            month = int(parts[0])
            year = int(parts[1])

            # If year is 2 digits, assume 2000s
            if year < 100:
                year = 2000 + year

            # Use first day of the month as the expiry date
            return f"{year:04d}-{month:02d}-01"

        # Handle MM/YYYY format (e.g., "06/2026")
        elif len(date_str.split('/')) == 2:
            parts = date_str.split('/')
            month = int(parts[0])
            year = int(parts[1])
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
    items = []

    with open(csv_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            # Skip empty rows
            if not row.get('Name', '').strip():
                continue

            name = row['Name'].strip()
            quantity_str = row.get('Qty (Sachet or Bottle)', '').strip()
            expiry_date_str = row.get('Expiry Date', '').strip()

            # Skip if name is empty
            if not name:
                continue

            # Parse quantity - convert to int if possible
            try:
                quantity = int(quantity_str) if quantity_str else 0
            except ValueError:
                quantity = 0

            # Parse expiry date
            expiry_date = parse_expiry_date(expiry_date_str)

            # Build the JSON object
            item_obj = {
                "name": name,
                "category": "Suspension or Syrup",
                "units": [
                    {
                        "name": "Sachet or Bottle",
                        "plural": "Sachets or Bottles",
                        "quantity": quantity
                    }
                ],
                "earliestExpiryDate": expiry_date if expiry_date else "",
                "laterExpiryDates": []
            }

            items.append(item_obj)

    # Write to JSON file
    with open(output_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(items, jsonfile, indent=2, ensure_ascii=False)

    print(f"Successfully converted {len(items)} items to {output_path}")

if __name__ == "__main__":
    # Get the script directory
    script_dir = Path(__file__).parent

    # Define paths
    csv_path = Path("/Users/chidiebereekennia/Downloads/Suspensions and syrups.csv")
    output_path = script_dir / "inventory" / "suspensions-and-syrups.json"

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Convert
    convert_csv_to_json(csv_path, output_path)

