#!/usr/bin/env python3
"""
Quick script to process a single batch manually.
Usage: python process_single_batch.py <start_index> <end_index>
Example: python process_single_batch.py 0 12
"""

import json
import sys

def extract_batch(start_idx: int, end_idx: int):
    """Extract a batch of drugs and generate prompt."""
    with open('apps/backend/seeds/inventory/drugs.json', 'r', encoding='utf-8') as f:
        drugs = json.load(f)

    batch = drugs[start_idx:end_idx]

    # Generate prompt
    prompt = f"""Analyze these {len(batch)} pharmaceutical drugs and determine their packaging structure.

For each drug, determine how many smaller units fit into larger units.

**Drugs:**

"""

    for i, drug in enumerate(batch, start=start_idx):
        units = [unit['name'] for unit in drug.get('units', [])]
        prompt += f"{i}. {drug['name']}\n"
        prompt += f"   Units: {' -> '.join(units)}\n\n"

    prompt += """
**Return as JSON:**
```json
[
  {
    "index": 0,
    "name": "Primprex [Co-Trimoxazole 80/480]",
    "packagingStructure": [
      { "unit": "Pack", "contains": 10, "of": "Card" },
      { "unit": "Card", "contains": 10, "of": "Tablet" }
    ]
  }
]
```

For drugs with only one unit (e.g., just Tablet), use empty array: "packagingStructure": []
"""

    print("=" * 80)
    print(f"BATCH {start_idx}-{end_idx-1} ({len(batch)} drugs)")
    print("=" * 80)
    print()
    print(prompt)
    print()
    print("=" * 80)
    print("Copy the prompt above and get AI response")
    print("=" * 80)


def show_progress():
    """Show current progress."""
    with open('apps/backend/seeds/inventory/drugs.json', 'r', encoding='utf-8') as f:
        drugs = json.load(f)

    total = len(drugs)
    with_structure = sum(1 for d in drugs if 'packagingStructure' in d)
    without_structure = total - with_structure

    print(f"\nProgress: {with_structure}/{total} drugs have packaging structure")
    print(f"Remaining: {without_structure} drugs")

    if without_structure > 0:
        # Find first drug without structure
        for i, drug in enumerate(drugs):
            if 'packagingStructure' not in drug:
                print(f"\nNext unprocessed drug: #{i} - {drug['name']}")
                break


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "progress":
            show_progress()
        else:
            start = int(sys.argv[1])
            end = int(sys.argv[2]) if len(sys.argv) > 2 else start + 12
            extract_batch(start, end)
    else:
        print("Usage:")
        print("  python process_single_batch.py <start_index> <end_index>")
        print("  python process_single_batch.py progress")
        print("\nExamples:")
        print("  python process_single_batch.py 0 12    # Process first 12 drugs")
        print("  python process_single_batch.py 12 24   # Process drugs 12-23")
        print("  python process_single_batch.py progress # Show current progress")


