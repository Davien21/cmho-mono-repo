#!/usr/bin/env python3
"""
Test script to validate packaging structure logic and show examples.
Run this to see how the data structure will look before processing all drugs.
"""

import json

# Example drugs with packaging structure added
EXAMPLE_DRUGS = [
    {
        "name": "Primprex [Co-Trimoxazole 80/480]",
        "category": "Drug",
        "units": [
            {"name": "Pack", "plural": "Packs", "quantity": 2},
            {"name": "Card", "plural": "Cards", "quantity": 20},
            {"name": "Tablet", "plural": "Tablets", "quantity": 200}
        ],
        "packagingStructure": [
            {"unit": "Pack", "contains": 10, "of": "Card"},
            {"unit": "Card", "contains": 10, "of": "Tablet"}
        ],
        "earliestExpiryDate": "2030-02-01",
        "laterExpiryDates": []
    },
    {
        "name": "Gabapentin 300mg",
        "category": "Drug",
        "units": [
            {"name": "Container", "plural": "Containers", "quantity": 1},
            {"name": "Tablet", "plural": "Tablets", "quantity": 500}
        ],
        "packagingStructure": [
            {"unit": "Container", "contains": 500, "of": "Tablet"}
        ],
        "earliestExpiryDate": "2026-04-01",
        "laterExpiryDates": []
    },
    {
        "name": "Wormex Albendazole",
        "category": "Drug",
        "units": [
            {"name": "Tablet", "plural": "Tablets", "quantity": 500}
        ],
        "packagingStructure": [],  # Only one unit type - no hierarchy
        "earliestExpiryDate": "2028-05-01",
        "laterExpiryDates": []
    }
]


def calculate_base_unit_per_top_unit(packaging_structure):
    """
    Calculate how many base units (smallest) are in one top-level unit.
    Example: If 1 Pack = 10 Cards and 1 Card = 10 Tablets, then 1 Pack = 100 Tablets
    """
    if not packaging_structure:
        return None

    total = 1
    for level in packaging_structure:
        total *= level['contains']

    top_unit = packaging_structure[0]['unit']
    base_unit = packaging_structure[-1]['of']

    return f"1 {top_unit} = {total} {base_unit}s"


def validate_packaging_structure(drug):
    """
    Validate that packaging structure is consistent with units.
    """
    errors = []
    units = {u['name'] for u in drug.get('units', [])}
    packaging = drug.get('packagingStructure', [])

    # Check that all units in packaging structure exist in units list
    for level in packaging:
        if level['unit'] not in units:
            errors.append(f"Unit '{level['unit']}' in packagingStructure not found in units list")
        if level['of'] not in units:
            errors.append(f"Unit '{level['of']}' in packagingStructure not found in units list")

    # Check that packaging forms a valid hierarchy
    if packaging:
        all_units_in_structure = {packaging[0]['unit']}
        for level in packaging:
            all_units_in_structure.add(level['of'])

        # All units should be represented (or it's a partial hierarchy which is OK)
        # Just ensure no broken chains
        for i in range(len(packaging) - 1):
            if packaging[i]['of'] != packaging[i+1]['unit']:
                errors.append(f"Broken hierarchy chain: {packaging[i]['of']} -> {packaging[i+1]['unit']}")

    return errors


def print_drug_example(drug):
    """Pretty print a drug with its packaging structure."""
    print("=" * 80)
    print(f"Drug: {drug['name']}")
    print("-" * 80)

    # Print units
    print("Units Available:")
    for unit in drug['units']:
        print(f"  - {unit['quantity']} {unit['plural']}")

    # Print packaging structure
    print("\nPackaging Structure:")
    if drug['packagingStructure']:
        for i, level in enumerate(drug['packagingStructure']):
            indent = "  " * i
            print(f"{indent}└─ 1 {level['unit']} contains {level['contains']} {level['of']}(s)")

        # Show total calculation
        total = calculate_base_unit_per_top_unit(drug['packagingStructure'])
        if total:
            print(f"\n  ➜ Summary: {total}")
    else:
        print("  (No hierarchy - single unit type)")

    # Validate
    errors = validate_packaging_structure(drug)
    if errors:
        print("\n⚠️  Validation Errors:")
        for error in errors:
            print(f"  - {error}")
    else:
        print("\n✓ Validation passed")

    print()


def show_json_format():
    """Show the exact JSON format that will be added."""
    print("=" * 80)
    print("JSON FORMAT")
    print("=" * 80)
    print("\nBefore:")
    before = {
        "name": "Drug Name",
        "category": "Drug",
        "units": [{"name": "Pack", "plural": "Packs", "quantity": 2}],
        "earliestExpiryDate": "2030-01-01"
    }
    print(json.dumps(before, indent=2))

    print("\nAfter (with packagingStructure added):")
    after = {**before}
    after['packagingStructure'] = [
        {"unit": "Pack", "contains": 10, "of": "Card"},
        {"unit": "Card", "contains": 10, "of": "Tablet"}
    ]
    print(json.dumps(after, indent=2))
    print()


def main():
    print("\n")
    print("=" * 80)
    print("PACKAGING STRUCTURE - TEST & VALIDATION")
    print("=" * 80)
    print("\nThis script shows example data and validates the structure.\n")

    # Show JSON format
    show_json_format()

    # Show examples
    print("=" * 80)
    print("EXAMPLE DRUGS WITH PACKAGING STRUCTURE")
    print("=" * 80)
    print()

    for drug in EXAMPLE_DRUGS:
        print_drug_example(drug)

    # Show summary
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print("""
Key Points:
1. ✓ packagingStructure is an array of relationship objects
2. ✓ Each level shows: "1 UnitA contains X UnitB"
3. ✓ Forms a clear hierarchy from largest to smallest
4. ✓ Empty array [] for drugs with single unit type
5. ✓ All unit names must match the units array

This structure allows you to:
- Calculate total base units from top-level units
- Display user-friendly packaging information
- Validate inventory relationships
- Build conversion logic for different unit types

Ready to process your drugs.json file!
Use: python apps/backend/seeds/add_packaging_structure.py
    """)


if __name__ == "__main__":
    main()



