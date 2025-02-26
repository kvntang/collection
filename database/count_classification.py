#!/usr/bin/env python3
import json

def count_classification_json_array(filename, target_classification):
    # Use a streaming parser to avoid loading the entire file into memory.
    import ijson
    count = 0
    with open(filename, 'r', encoding='utf-8') as f:
        # Each item in the JSON array is processed individually.
        for obj in ijson.items(f, 'item'):
            if obj.get("Classification") == target_classification:
                count += 1
    return count

def count_classification_json_lines(filename, target_classification):
    count = 0
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    obj = json.loads(line)
                    if obj.get("Classification") == target_classification:
                        count += 1
                except json.JSONDecodeError:
                    # Skip invalid JSON lines.
                    pass
    return count

def main():
    # Hardcoded filename; update this to your file's path.
    filename = 'Artworks.json'
    # Set the target classification to count.
    target_classification = 'Painting'
    
    # Read the first non-whitespace character to determine file type.
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
        count = count_classification_json_array(filename, target_classification)
    else:
        count = count_classification_json_lines(filename, target_classification)
    
    print(f"Total objects with Classification '{target_classification}':", count)

if __name__ == "__main__":
    main()
