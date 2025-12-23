#!/usr/bin/env python3
"""
Script to add packaging structure information to drugs inventory using AI.
Processes drugs in batches and updates the JSON file with packaging hierarchy.
"""

import json
import os
from datetime import datetime
from typing import List, Dict, Any
import sys

# You'll need to install: pip install openai
# Or use any other AI API you prefer
try:
    from openai import OpenAI
except ImportError:
    print("Warning: openai package not installed. Install with: pip install openai")
    print("You can still generate prompts and process manually.")
    OpenAI = None


class PackagingStructureAdder:
    def __init__(self, json_file_path: str, batch_size: int = 12):
        self.json_file_path = json_file_path
        self.batch_size = batch_size
        self.drugs = []
        self.processed_indices = set()
        self.checkpoint_file = json_file_path.replace('.json', '_checkpoint.json')
        self.backup_file = json_file_path.replace('.json', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')

    def load_data(self):
        """Load the drugs JSON file and checkpoint if exists."""
        print(f"Loading data from {self.json_file_path}...")
        with open(self.json_file_path, 'r', encoding='utf-8') as f:
            self.drugs = json.load(f)
        print(f"Loaded {len(self.drugs)} drugs")

        # Load checkpoint if exists
        if os.path.exists(self.checkpoint_file):
            with open(self.checkpoint_file, 'r') as f:
                checkpoint = json.load(f)
                self.processed_indices = set(checkpoint.get('processed_indices', []))
                print(f"Loaded checkpoint: {len(self.processed_indices)} drugs already processed")

    def create_backup(self):
        """Create a backup of the original file."""
        print(f"Creating backup at {self.backup_file}...")
        with open(self.json_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        with open(self.backup_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Backup created successfully")

    def get_batches(self) -> List[List[tuple]]:
        """Split unprocessed drugs into batches."""
        unprocessed = [
            (idx, drug) for idx, drug in enumerate(self.drugs)
            if idx not in self.processed_indices
        ]

        batches = []
        for i in range(0, len(unprocessed), self.batch_size):
            batches.append(unprocessed[i:i + self.batch_size])

        return batches

    def format_prompt_for_batch(self, batch: List[tuple]) -> str:
        """Generate the AI prompt for a batch of drugs."""
        prompt = """You are a pharmaceutical packaging expert. For each drug listed below, determine the packaging hierarchy - specifically how many smaller units fit into each larger unit.

For each drug, I'll provide:
- Drug name
- Available units (from largest to smallest container)

Please return a JSON array with the packaging structure for each drug. Use standard pharmaceutical packaging conventions.

**Important Notes:**
- Container typically means a bottle/jar
- Pack usually contains multiple cards/blister packs
- Card/Blister typically contains individual tablets/capsules
- Use realistic pharmaceutical standards (e.g., packs often contain 10 cards, cards often contain 10 tablets)
- If a drug only has one unit type (e.g., just "Tablet"), return an empty array for packagingStructure

**Drugs to analyze:**

"""

        for idx, drug in batch:
            units = [unit['name'] for unit in drug.get('units', [])]
            prompt += f"{idx + 1}. {drug['name']}\n"
            prompt += f"   Units: {' -> '.join(units)}\n\n"

        prompt += """
**Return format (JSON):**
```json
[
  {
    "index": 0,
    "name": "Drug Name",
    "packagingStructure": [
      { "unit": "Pack", "contains": 10, "of": "Card" },
      { "unit": "Card", "contains": 10, "of": "Tablet" }
    ]
  },
  ...
]
```

Return ONLY the JSON array, no additional text."""

        return prompt

    def process_batch_with_ai(self, batch: List[tuple], api_key: str = None) -> List[Dict]:
        """Process a batch using OpenAI API."""
        if OpenAI is None:
            raise ImportError("openai package is required. Install with: pip install openai")

        if not api_key:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OpenAI API key not found. Set OPENAI_API_KEY environment variable or pass api_key parameter")

        client = OpenAI(api_key=api_key)
        prompt = self.format_prompt_for_batch(batch)

        print("Sending request to OpenAI...")
        response = client.chat.completions.create(
            model="gpt-4o",  # or "gpt-4" or "gpt-3.5-turbo"
            messages=[
                {"role": "system", "content": "You are a pharmaceutical packaging expert. Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"} if "gpt-4" in "gpt-4o" else None
        )

        result_text = response.choices[0].message.content.strip()

        # Try to extract JSON if wrapped in markdown
        if '```json' in result_text:
            result_text = result_text.split('```json')[1].split('```')[0].strip()
        elif '```' in result_text:
            result_text = result_text.split('```')[1].split('```')[0].strip()

        # If the response is wrapped in an object with a key, extract the array
        parsed = json.loads(result_text)
        if isinstance(parsed, dict) and 'drugs' in parsed:
            return parsed['drugs']
        elif isinstance(parsed, dict) and 'items' in parsed:
            return parsed['items']
        elif isinstance(parsed, list):
            return parsed
        else:
            # If it's a dict with other structure, try to find the array
            for value in parsed.values():
                if isinstance(value, list):
                    return value
            raise ValueError(f"Unexpected response structure: {parsed}")

    def update_drugs_with_results(self, batch: List[tuple], results: List[Dict]):
        """Update the drugs list with AI results."""
        # Create a mapping of indices for quick lookup
        batch_indices = {drug['name']: idx for idx, drug in batch}

        updated_count = 0
        for result in results:
            drug_name = result.get('name')
            packaging_structure = result.get('packagingStructure', [])

            # Find the drug in our batch
            if drug_name in batch_indices:
                drug_idx = batch_indices[drug_name]
                self.drugs[drug_idx]['packagingStructure'] = packaging_structure
                self.processed_indices.add(drug_idx)
                updated_count += 1
            else:
                # Try to match by index if name doesn't match
                result_index = result.get('index')
                if result_index is not None and result_index < len(batch):
                    drug_idx, _ = batch[result_index]
                    self.drugs[drug_idx]['packagingStructure'] = packaging_structure
                    self.processed_indices.add(drug_idx)
                    updated_count += 1

        print(f"Updated {updated_count} drugs with packaging structure")
        return updated_count

    def save_checkpoint(self):
        """Save progress checkpoint."""
        checkpoint = {
            'processed_indices': list(self.processed_indices),
            'timestamp': datetime.now().isoformat(),
            'total_drugs': len(self.drugs),
            'processed_count': len(self.processed_indices)
        }
        with open(self.checkpoint_file, 'w') as f:
            json.dump(checkpoint, f, indent=2)
        print(f"Checkpoint saved: {len(self.processed_indices)}/{len(self.drugs)} drugs processed")

    def save_final_results(self):
        """Save the updated drugs list to the original file."""
        print(f"Saving final results to {self.json_file_path}...")
        with open(self.json_file_path, 'w', encoding='utf-8') as f:
            json.dump(self.drugs, f, indent=2, ensure_ascii=False)
        print("Results saved successfully")

        # Clean up checkpoint file
        if os.path.exists(self.checkpoint_file):
            os.remove(self.checkpoint_file)
            print("Checkpoint file removed")

    def generate_manual_prompts(self, output_file: str = None):
        """Generate prompts for manual processing (without API)."""
        if output_file is None:
            output_file = self.json_file_path.replace('.json', '_prompts.txt')

        batches = self.get_batches()

        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"Generated {len(batches)} prompts for manual processing\n")
            f.write(f"Total drugs to process: {sum(len(b) for b in batches)}\n")
            f.write("=" * 80 + "\n\n")

            for i, batch in enumerate(batches, 1):
                f.write(f"BATCH {i}/{len(batches)}\n")
                f.write("=" * 80 + "\n\n")
                f.write(self.format_prompt_for_batch(batch))
                f.write("\n\n" + "=" * 80 + "\n\n")

        print(f"Generated {len(batches)} prompts in {output_file}")
        print(f"Total drugs to process: {sum(len(b) for b in batches)}")
        return output_file

    def process_manual_response(self, batch_index: int, response_json: str):
        """Process a manual response for a specific batch."""
        batches = self.get_batches()
        if batch_index >= len(batches):
            print(f"Error: Batch index {batch_index} out of range (max: {len(batches) - 1})")
            return

        batch = batches[batch_index]

        # Parse the response
        try:
            if isinstance(response_json, str):
                results = json.loads(response_json)
            else:
                results = response_json

            if isinstance(results, dict):
                # Extract array from dict if needed
                for value in results.values():
                    if isinstance(value, list):
                        results = value
                        break

            self.update_drugs_with_results(batch, results)
            self.save_checkpoint()
            print(f"Batch {batch_index} processed successfully")

        except json.JSONDecodeError as e:
            print(f"Error parsing JSON response: {e}")
            print("Make sure the response is valid JSON")


def main():
    """Main execution function."""
    print("=" * 80)
    print("PACKAGING STRUCTURE ADDER")
    print("=" * 80)
    print()

    # Configuration
    json_file = "apps/backend/seeds/inventory/drugs.json"

    if not os.path.exists(json_file):
        print(f"Error: File not found: {json_file}")
        print("Please run this script from the project root directory")
        return

    processor = PackagingStructureAdder(json_file, batch_size=12)
    processor.load_data()
    processor.create_backup()

    print()
    print("Choose processing mode:")
    print("1. Automatic (using OpenAI API)")
    print("2. Manual (generate prompts for manual processing)")
    print("3. Process manual response for a specific batch")
    print("4. Exit")
    print()

    choice = input("Enter choice (1-4): ").strip()

    if choice == "1":
        # Automatic processing with API
        api_key = input("Enter OpenAI API key (or press Enter to use OPENAI_API_KEY env var): ").strip()
        if not api_key:
            api_key = os.getenv('OPENAI_API_KEY')

        if not api_key:
            print("Error: No API key provided")
            return

        batches = processor.get_batches()
        print(f"\nProcessing {len(batches)} batches ({sum(len(b) for b in batches)} drugs)...")

        for i, batch in enumerate(batches, 1):
            print(f"\n--- Processing Batch {i}/{len(batches)} ({len(batch)} drugs) ---")
            try:
                results = processor.process_batch_with_ai(batch, api_key)
                processor.update_drugs_with_results(batch, results)
                processor.save_checkpoint()
                print(f"Batch {i} completed successfully")

            except Exception as e:
                print(f"Error processing batch {i}: {e}")
                print("Progress saved. You can resume by running the script again.")
                return

        processor.save_final_results()
        print("\n✓ All drugs processed successfully!")

    elif choice == "2":
        # Manual prompt generation
        output_file = processor.generate_manual_prompts()
        print(f"\n✓ Prompts saved to: {output_file}")
        print("\nNext steps:")
        print("1. Open the prompts file")
        print("2. Copy each batch prompt to your AI assistant")
        print("3. Save the JSON response")
        print("4. Run this script again and choose option 3 to process each response")

    elif choice == "3":
        # Process manual response
        batches = processor.get_batches()
        print(f"\nTotal batches available: {len(batches)}")
        batch_index = int(input("Enter batch number to process (0-based index): ").strip())

        print("\nPaste the JSON response from the AI (paste and press Ctrl+D or Ctrl+Z when done):")
        response_lines = []
        try:
            while True:
                line = input()
                response_lines.append(line)
        except EOFError:
            pass

        response_json = '\n'.join(response_lines)
        processor.process_manual_response(batch_index, response_json)

        remaining = len(processor.drugs) - len(processor.processed_indices)
        print(f"\nProgress: {len(processor.processed_indices)}/{len(processor.drugs)} drugs processed")
        print(f"Remaining: {remaining} drugs")

        if remaining == 0:
            save = input("\nAll drugs processed! Save final results? (y/n): ").strip().lower()
            if save == 'y':
                processor.save_final_results()
                print("\n✓ All done!")

    else:
        print("Exiting...")


if __name__ == "__main__":
    main()



