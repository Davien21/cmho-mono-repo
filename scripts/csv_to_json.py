#!/usr/bin/env python3
"""
Script to convert CSV file to JSON format.
Converts the Pills CSV file to a structured JSON format.
"""

import csv
import json
import sys
from pathlib import Path


def clean_value(value, is_numeric=False):
    """Clean and normalize CSV values.

    Args:
        value: The value to clean
        is_numeric: If True, convert '-' to '0' instead of None
    """
    if value is None:
        return None
    value = str(value).strip()
    if value == '' or value.lower() == 'n/a':
        return None
    if value == '-':
        return '0' if is_numeric else None
    return value


def parse_exp_date(date_str):
    """Parse expiration date string to a more structured format."""
    if not date_str:
        return None
    date_str = str(date_str).strip()
    if date_str == '' or date_str == '-' or date_str.lower() == 'n/a':
        return None
    return date_str


def convert_csv_to_json(csv_path, json_path=None):
    """
    Convert CSV file to JSON format.

    Args:
        csv_path: Path to the input CSV file
        json_path: Path to the output JSON file (optional, defaults to same name as CSV)
    """
    csv_path = Path(csv_path)

    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)

    if json_path is None:
        json_path = csv_path.with_suffix('.json')
    else:
        json_path = Path(json_path)

    pills_data = []

    try:
        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            # Use csv.DictReader to automatically handle headers
            reader = csv.DictReader(csvfile)

            for row in reader:
                # Clean and structure the data
                pill = {
                    'name': clean_value(row.get('Pills', '')),
                    'packContainer': clean_value(row.get('Pack/Container', ''), is_numeric=True),
                    'card': clean_value(row.get('Card', ''), is_numeric=True),
                    'tablets': clean_value(row.get('Tablets', ''), is_numeric=True),
                    'expDate': parse_exp_date(row.get('Exp. Date', '')),
                    'expDate2': parse_exp_date(row.get('Exp. Date 2', '')),
                    'packagingStructure': clean_value(row.get('Packaging Structure', ''))
                }

                # Only add if name exists (skip empty rows)
                if pill['name']:
                    pills_data.append(pill)

        # Write JSON file with pretty formatting
        with open(json_path, 'w', encoding='utf-8') as jsonfile:
            json.dump(pills_data, jsonfile, indent=2, ensure_ascii=False)

        print(f"✓ Successfully converted {len(pills_data)} pills to JSON")
        print(f"✓ Output saved to: {json_path}")

        return pills_data

    except Exception as e:
        print(f"Error processing CSV file: {e}")
        sys.exit(1)


if __name__ == '__main__':
    # Default CSV path
    default_csv = Path('/Users/chidiebereekennia/Downloads/Pills - Sheet1.csv')

    # Allow command line argument for CSV path
    csv_path = sys.argv[1] if len(sys.argv) > 1 else str(default_csv)

    # Optional: specify output JSON path
    json_path = sys.argv[2] if len(sys.argv) > 2 else None

    convert_csv_to_json(csv_path, json_path)

