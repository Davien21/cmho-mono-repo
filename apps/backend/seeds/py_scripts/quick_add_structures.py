#!/usr/bin/env python3
"""
Quick script to add packaging structures to all drugs at once.
This analyzes the unit hierarchy and infers standard pharmaceutical packaging.
"""

import json

def infer_packaging_structure(units):
    """
    Infer packaging structure from unit hierarchy.
    Uses standard pharmaceutical packaging conventions.
    """
    unit_names = [u['name'] for u in units]

    # Single unit - no hierarchy
    if len(unit_names) == 1:
        return []

    # Two units
    if len(unit_names) == 2:
        larger, smaller = unit_names[0], unit_names[1]

        # Container to Tablet - typically 100-1000 tablets
        if larger == "Container" and smaller == "Tablet":
            return [{"unit": "Container", "contains": 100, "of": "Tablet"}]

        # Card to Tablet - typically 10 tablets
        if larger == "Card" and smaller == "Tablet":
            return [{"unit": "Card", "contains": 10, "of": "Tablet"}]

        # Default for other combinations
        return [{"unit": larger, "contains": 10, "of": smaller}]

    # Three units - most common: Pack -> Card -> Tablet
    if len(unit_names) == 3:
        top, middle, bottom = unit_names[0], unit_names[1], unit_names[2]

        # Standard Pack -> Card -> Tablet
        if top == "Pack" and middle == "Card" and bottom == "Tablet":
            return [
                {"unit": "Pack", "contains": 10, "of": "Card"},
                {"unit": "Card", "contains": 10, "of": "Tablet"}
            ]

        # Container -> Card -> Tablet (less common)
        if top == "Container" and middle == "Card" and bottom == "Tablet":
            return [
                {"unit": "Container", "contains": 10, "of": "Card"},
                {"unit": "Card", "contains": 10, "of": "Tablet"}
            ]

        # Default three-level hierarchy
        return [
            {"unit": top, "contains": 10, "of": middle},
            {"unit": middle, "contains": 10, "of": bottom}
        ]

    # More than three units (rare) - build chain
    structure = []
    for i in range(len(unit_names) - 1):
        structure.append({
            "unit": unit_names[i],
            "contains": 10,
            "of": unit_names[i + 1]
        })

    return structure


def process_drugs():
    """Load, process, and save drugs with packaging structures."""

    # Load the data
    file_path = "apps/backend/seeds/inventory/drugs.json"
    print(f"Loading {file_path}...")

    with open(file_path, 'r', encoding='utf-8') as f:
        drugs = json.load(f)

    print(f"Loaded {len(drugs)} drugs")

    # Process each drug
    processed = 0
    for i, drug in enumerate(drugs):
        # Add packaging structure
        drug['packagingStructure'] = infer_packaging_structure(drug.get('units', []))
        processed += 1

        if (i + 1) % 50 == 0:
            print(f"  Processed {i + 1}/{len(drugs)} drugs...")

    print(f"\n✓ Processed {processed} drugs")

    # Save the updated data
    print(f"\nSaving to {file_path}...")
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(drugs, f, indent=2, ensure_ascii=False)

    print("✓ File updated successfully!")

    # Show some examples
    print("\n" + "=" * 80)
    print("EXAMPLES OF ADDED STRUCTURES:")
    print("=" * 80)

    for i in range(min(5, len(drugs))):
        drug = drugs[i]
        print(f"\n{i+1}. {drug['name']}")
        units = [u['name'] for u in drug['units']]
        print(f"   Units: {' -> '.join(units)}")
        if drug['packagingStructure']:
            print(f"   Structure:")
            for level in drug['packagingStructure']:
                print(f"     - 1 {level['unit']} = {level['contains']} {level['of']}(s)")
        else:
            print(f"   Structure: (no hierarchy - single unit)")

    print("\n" + "=" * 80)
    print(f"✓ All {len(drugs)} drugs now have packaging structure!")
    print("=" * 80)


if __name__ == "__main__":
    process_drugs()

