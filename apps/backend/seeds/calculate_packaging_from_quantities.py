#!/usr/bin/env python3
"""
Calculate packaging structure from actual quantities.
The quantities tell us the real relationships!
"""

import json
from math import gcd
from functools import reduce

def calculate_packaging_structure(units):
    """
    Calculate packaging structure by analyzing the quantity ratios.
    """
    if len(units) <= 1:
        return []

    # Build the packaging structure by comparing consecutive unit quantities
    structure = []

    for i in range(len(units) - 1):
        larger_unit = units[i]
        smaller_unit = units[i + 1]

        larger_qty = larger_unit['quantity']
        smaller_qty = smaller_unit['quantity']

        # Calculate how many smaller units are in one larger unit
        if larger_qty > 0:
            ratio = smaller_qty / larger_qty

            # Round to nearest integer (handle floating point precision)
            ratio = round(ratio)

            if ratio > 0:
                structure.append({
                    "unit": larger_unit['name'],
                    "contains": ratio,
                    "of": smaller_unit['name']
                })

    return structure


def process_all_drugs():
    """Process all drugs and add calculated packaging structures."""

    file_path = "apps/backend/seeds/inventory/drugs.json"
    print(f"Loading {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        drugs = json.load(f)

    print(f"Loaded {len(drugs)} drugs\n")
    print("Calculating packaging structures from quantities...\n")

    # Track different structure patterns
    structure_patterns = {}

    for i, drug in enumerate(drugs):
        structure = calculate_packaging_structure(drug.get('units', []))
        drug['packagingStructure'] = structure

        # Track patterns for summary
        pattern_key = " -> ".join([f"{s['unit']}({s['contains']})" for s in structure]) if structure else "single-unit"
        structure_patterns[pattern_key] = structure_patterns.get(pattern_key, 0) + 1

        if (i + 1) % 30 == 0:
            print(f"  Processed {i + 1}/{len(drugs)} drugs...")

    print(f"\n✓ Processed all {len(drugs)} drugs\n")

    # Save the updated data
    print(f"Saving to {file_path}...")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(drugs, f, indent=2, ensure_ascii=False)

    print("✓ File updated!\n")

    # Show summary
    print("=" * 80)
    print("PACKAGING STRUCTURE PATTERNS FOUND:")
    print("=" * 80)
    for pattern, count in sorted(structure_patterns.items(), key=lambda x: -x[1]):
        print(f"  {pattern}: {count} drugs")

    # Show diverse examples
    print("\n" + "=" * 80)
    print("EXAMPLES OF CALCULATED STRUCTURES:")
    print("=" * 80)

    examples_shown = set()
    for drug in drugs:
        # Create pattern key
        structure = drug['packagingStructure']
        if structure:
            pattern = " -> ".join([f"{s['contains']}" for s in structure])
        else:
            pattern = "none"

        # Show one example of each unique pattern
        if pattern not in examples_shown and len(examples_shown) < 10:
            examples_shown.add(pattern)

            units = [u['name'] for u in drug['units']]
            qtys = [f"{u['quantity']} {u['name']}" for u in drug['units']]

            print(f"\n{drug['name']}")
            print(f"  Current stock: {', '.join(qtys)}")

            if structure:
                print(f"  Packaging:")
                for level in structure:
                    print(f"    • 1 {level['unit']} = {level['contains']} {level['of']}(s)")
            else:
                print(f"  Packaging: Single unit (no hierarchy)")

    print("\n" + "=" * 80)
    print("✓ All packaging structures calculated from actual quantities!")
    print("=" * 80)


if __name__ == "__main__":
    process_all_drugs()



