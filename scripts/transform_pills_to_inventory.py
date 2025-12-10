#!/usr/bin/env python3
"""
Transform CSV directly into inventory items format with units structure.
"""

import csv
import json
import sys
from pathlib import Path
from datetime import datetime


def parse_quantity(value):
    """Convert string quantity to number, handling null and '0'."""
    if value is None or value == '' or value == '-':
        return None
    try:
        num = int(value)
        return num if num > 0 else None
    except (ValueError, TypeError):
        return None


def parse_exp_date_to_iso(date_str):
    """
    Parse expiration date string to ISO 8601 format for MongoDB.
    Handles formats like: MM/YYYY, M/YY, MM/YY
    Returns ISO date string (YYYY-MM-DD) or None
    """
    if not date_str:
        return None

    date_str = str(date_str).strip()
    if date_str == '' or date_str == '-' or date_str.lower() == 'n/a':
        return None

    try:
        # Handle MM/YYYY or M/YY format
        parts = date_str.split('/')
        if len(parts) != 2:
            return None

        month = int(parts[0])
        year_str = parts[1]

        # Handle 2-digit vs 4-digit years
        if len(year_str) == 2:
            year = 2000 + int(year_str)
        else:
            year = int(year_str)

        # Validate month
        if month < 1 or month > 12:
            return None

        # Create ISO date string (first day of month)
        # Format: YYYY-MM-DD
        return f"{year:04d}-{month:02d}-01"
    except (ValueError, TypeError):
        return None


def parse_date_for_comparison(date_str):
    """
    Parse date string to datetime for comparison.
    Handles formats like: MM/YYYY, M/YY, MM/YY
    """
    if not date_str:
        return None

    date_str = str(date_str).strip()
    if date_str == '' or date_str == '-' or date_str.lower() == 'n/a':
        return None

    try:
        # Handle MM/YYYY or M/YY format
        parts = date_str.split('/')
        if len(parts) != 2:
            return None

        month = int(parts[0])
        year_str = parts[1]

        # Handle 2-digit vs 4-digit years
        if len(year_str) == 2:
            year = 2000 + int(year_str)
        else:
            year = int(year_str)

        # Create date at first day of month for comparison
        return datetime(year, month, 1)
    except (ValueError, TypeError):
        return None


def get_earliest_and_later_dates(date1_str, date2_str):
    """
    Determine earliest and later expiry dates in ISO format.

    Returns:
        tuple: (earliestExpiryDate, laterExpiryDates)
        - earliestExpiryDate: ISO date string (YYYY-MM-DD) or None
        - laterExpiryDates: list of ISO date strings (empty if no later dates)
    """
    date1_parsed = parse_date_for_comparison(date1_str)
    date2_parsed = parse_date_for_comparison(date2_str)

    date1_iso = parse_exp_date_to_iso(date1_str)
    date2_iso = parse_exp_date_to_iso(date2_str)

    # If both are None
    if date1_parsed is None and date2_parsed is None:
        return None, []

    # If only one exists
    if date1_parsed is None:
        return date2_iso, []
    if date2_parsed is None:
        return date1_iso, []

    # Both exist - compare
    if date1_parsed <= date2_parsed:
        later_dates = [date2_iso] if date1_parsed < date2_parsed else []
        return date1_iso, later_dates
    else:
        return date2_iso, [date1_iso]


def build_units(pack_container, card, tablets):
    """
    Build units array based on the data.

    Logic:
    - If packContainer is not null and card is null: [Container, Tablet]
    - Otherwise: [Pack, Card, Tablet]
    """
    pack_container_qty = parse_quantity(pack_container)
    card_qty = parse_quantity(card)
    tablets_qty = parse_quantity(tablets)

    units = []

    # Check if we should use Container -> Tablet structure
    if pack_container_qty is not None and card_qty is None:
        # Container -> Tablet structure
        if pack_container_qty is not None:
            units.append({
                'name': 'Container',
                'plural': 'Containers',
                'quantity': pack_container_qty
            })

        if tablets_qty is not None:
            units.append({
                'name': 'Tablet',
                'plural': 'Tablets',
                'quantity': tablets_qty
            })
    else:
        # Pack -> Card -> Tablet structure
        if pack_container_qty is not None:
            units.append({
                'name': 'Pack',
                'plural': 'Packs',
                'quantity': pack_container_qty
            })

        if card_qty is not None:
            units.append({
                'name': 'Card',
                'plural': 'Cards',
                'quantity': card_qty
            })

        if tablets_qty is not None:
            units.append({
                'name': 'Tablet',
                'plural': 'Tablets',
                'quantity': tablets_qty
            })

    return units


def clean_value(value, is_numeric=False):
    """Clean and normalize CSV values."""
    if value is None:
        return None
    value = str(value).strip()
    if value == '' or value.lower() == 'n/a':
        return None
    if value == '-':
        return '0' if is_numeric else None
    return value


def transform_csv_to_inventory(csv_path, output_path=None):
    """
    Transform CSV directly to inventory items format.

    Args:
        csv_path: Path to input CSV file
        output_path: Path to output JSON file (optional)
    """
    csv_path = Path(csv_path)

    if not csv_path.exists():
        print(f"Error: CSV file not found at {csv_path}")
        sys.exit(1)

    if output_path is None:
        output_path = csv_path.parent / 'inventory_items.json'
    else:
        output_path = Path(output_path)

    try:
        inventory_items = []

        with open(csv_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                name = clean_value(row.get('Pills', ''))
                if not name:
                    continue

                pack_container = clean_value(row.get('Pack/Container', ''), is_numeric=True)
                card = clean_value(row.get('Card', ''), is_numeric=True)
                tablets = clean_value(row.get('Tablets', ''), is_numeric=True)

                # Get expiry dates (raw strings for comparison)
                exp_date1_raw = clean_value(row.get('Exp. Date', ''))
                exp_date2_raw = clean_value(row.get('Exp. Date 2', ''))

                # Determine earliest and later dates (converted to ISO format)
                earliest_expiry, later_expiry_dates = get_earliest_and_later_dates(
                    exp_date1_raw, exp_date2_raw
                )

                # Build units array
                units = build_units(pack_container, card, tablets)

                # Skip if no valid units
                if not units:
                    continue

                # Create inventory item
                inventory_item = {
                    'name': name.strip(),
                    'category': 'Drug',
                    'units': units
                }

                # Add expiry date fields if available
                if earliest_expiry is not None:
                    inventory_item['earliestExpiryDate'] = earliest_expiry

                if later_expiry_dates:
                    inventory_item['laterExpiryDates'] = later_expiry_dates
                else:
                    inventory_item['laterExpiryDates'] = []

                inventory_items.append(inventory_item)

        # Write output
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(inventory_items, f, indent=2, ensure_ascii=False)

        print(f"✓ Successfully transformed {len(inventory_items)} items")
        print(f"✓ Output saved to: {output_path}")

        return inventory_items

    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    # Default paths
    default_csv = Path('/Users/chidiebereekennia/Downloads/drugs.csv')

    # Allow command line arguments
    csv_path = sys.argv[1] if len(sys.argv) > 1 else str(default_csv)
    output_path = sys.argv[2] if len(sys.argv) > 2 else None

    transform_csv_to_inventory(csv_path, output_path)

