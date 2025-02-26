#!/usr/bin/env python3
import json
from collections import defaultdict

def count_classifications_json_array(filename):
    # Uses a streaming parser (ijson) for JSON arrays.
    import ijson
    counts = defaultdict(int)
    with open(filename, 'r', encoding='utf-8') as f:
        for obj in ijson.items(f, 'item'):
            classification = obj.get("Classification")
            if classification is not None:
                counts[classification] += 1
    return counts

def count_classifications_json_lines(filename):
    # Processes each line as a separate JSON object.
    counts = defaultdict(int)
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    obj = json.loads(line)
                    classification = obj.get("Classification")
                    if classification is not None:
                        counts[classification] += 1
                except json.JSONDecodeError:
                    # Skip invalid JSON lines.
                    continue
    return counts

def main():
    # Hardcoded filename; update this to your file's path.
    filename = '../Artworks.json'
    
    # Read the first non-whitespace character to determine file format.
    with open(filename, 'r', encoding='utf-8') as f:
        first_char = None
        while True:
            c = f.read(1)
            if not c:
                break
            if not c.isspace():
                first_char = c
                break

    # Choose the method based on file structure.
    if first_char == '[':
        classification_counts = count_classifications_json_array(filename)
    else:
        classification_counts = count_classifications_json_lines(filename)

    # Sort classifications by count in descending order and print.
    sorted_classifications = sorted(classification_counts.items(), key=lambda x: x[1], reverse=True)
    for classification, count in sorted_classifications:
        print(f"{classification} ({count})")

if __name__ == "__main__":
    main()
