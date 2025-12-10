# Adding Packaging Structure to Drugs Inventory

This guide explains how to add packaging structure information to drugs in `inventory/drugs.json`.

## What is Packaging Structure?

The packaging structure defines the hierarchy of pharmaceutical packaging units. For example:

- 1 Pack contains 10 Cards
- 1 Card contains 10 Tablets

## Data Structure

We're adding a `packagingStructure` field to each drug:

```json
{
  "name": "Primprex [Co-Trimoxazole 80/480]",
  "category": "Drug",
  "units": [...],
  "packagingStructure": [
    { "unit": "Pack", "contains": 10, "of": "Card" },
    { "unit": "Card", "contains": 10, "of": "Tablet" }
  ]
}
```

For drugs with only one unit type (e.g., just "Tablet"), use an empty array: `"packagingStructure": []`

## Method 1: Automatic Processing (Recommended)

Use the main script with OpenAI API:

```bash
python apps/backend/seeds/add_packaging_structure.py
```

**Requirements:**

```bash
pip install openai
```

**Steps:**

1. Run the script
2. Choose option 1 (Automatic)
3. Enter your OpenAI API key (or set `OPENAI_API_KEY` environment variable)
4. The script will process all drugs in batches of 12
5. Progress is saved automatically - you can resume if interrupted

**Features:**

- ✅ Automatic backup creation
- ✅ Checkpoint system (resume if interrupted)
- ✅ Processes 3600+ drugs in ~20-30 minutes
- ✅ Validates results before saving

## Method 2: Manual Processing (No API Required)

If you don't have an API key or prefer manual control:

### Option A: Generate All Prompts at Once

```bash
python apps/backend/seeds/add_packaging_structure.py
```

Choose option 2 to generate a file with all prompts. Then:

1. Open `drugs_prompts.txt`
2. Copy each batch prompt
3. Paste into ChatGPT, Claude, or any AI assistant
4. Save the JSON response
5. Use option 3 to process each response

### Option B: Process One Batch at a Time

```bash
# Show progress
python apps/backend/seeds/process_single_batch.py progress

# Generate prompt for drugs 0-11
python apps/backend/seeds/process_single_batch.py 0 12

# Generate prompt for drugs 12-23
python apps/backend/seeds/process_single_batch.py 12 24
```

Then manually update the JSON file with the AI's response.

## Example AI Conversation

**You ask the AI:**

```
Analyze these pharmaceutical drugs and determine their packaging structure.

1. Primprex [Co-Trimoxazole 80/480]
   Units: Pack -> Card -> Tablet

2. Gabapentin 300mg
   Units: Container -> Tablet
```

**AI responds:**

```json
[
  {
    "index": 0,
    "name": "Primprex [Co-Trimoxazole 80/480]",
    "packagingStructure": [
      { "unit": "Pack", "contains": 10, "of": "Card" },
      { "unit": "Card", "contains": 10, "of": "Tablet" }
    ]
  },
  {
    "index": 1,
    "name": "Gabapentin 300mg",
    "packagingStructure": [
      { "unit": "Container", "contains": 500, "of": "Tablet" }
    ]
  }
]
```

## Validation Checklist

After processing, verify:

- [ ] All unit names in `packagingStructure` match unit names in `units` array
- [ ] Hierarchy makes sense (larger units contain smaller units)
- [ ] Similar drugs have similar structures
- [ ] No drugs are missing the `packagingStructure` field (except by design)

## Batch Size Recommendations

- **API mode**: 12 drugs per batch (optimal for cost and accuracy)
- **Manual mode**: 10-15 drugs per batch (easy to review)

## Troubleshooting

### Script fails partway through

- Progress is automatically saved
- Just run the script again - it will resume from checkpoint

### API rate limits

- The script includes built-in delays
- If you hit limits, wait and resume later

### AI returns unexpected format

- The script tries to parse various JSON formats
- If it fails, it will show the error and save progress
- You can process that batch manually

## File Safety

- Original file is backed up as `drugs_backup_TIMESTAMP.json`
- Progress is saved to `drugs_checkpoint.json`
- Original file only updated when all processing is complete

## Estimated Time

- **Automatic (API)**: ~20-30 minutes for all 3600+ drugs
- **Manual**: ~2-4 hours depending on your pace

## Cost Estimate (API Mode)

Using GPT-4:

- ~300 batches × $0.03-0.05 per batch
- **Total: ~$9-15**

Using GPT-3.5-Turbo:

- ~300 batches × $0.002-0.005 per batch
- **Total: ~$0.60-1.50**

## Questions?

The scripts include helpful error messages and progress indicators. If something goes wrong, check:

1. The backup file is created (safety first!)
2. The checkpoint file exists (shows progress)
3. Error messages point to specific issues
