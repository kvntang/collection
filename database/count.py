#!/usr/bin/env python3
import json

def count_json_array_objects(filename):
    # Use a streaming parser to count objects in a JSON array.
    import ijson
    count = 0
    with open(filename, 'r', encoding='utf-8') as f:
        for _ in ijson.items(f, 'item'):
            count += 1
    return count

def count_json_lines(filename):
    # Count one JSON object per line.
    count = 0
    with open(filename, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:  # Skip blank lines
                try:
                    json.loads(line)
                    count += 1
                except json.JSONDecodeError:
                    # Skip lines that aren't valid JSON
                    pass
    return count

def main():
    # Hardcoded filename; update this to your file's path.
    filename = 'Artworks.json'

    # Check the first non-whitespace character to determine file format.
    with open(filename, 'r', encoding='utf-8') as f:
        first_char = None
        while True:
            c = f.read(1)
            if not c:
                break
            if not c.isspace():
                first_char = c
                break

    if first_char == '[':
        # File is a JSON array.
        total = count_json_array_objects(filename)
    else:
        # Assume each line is a separate JSON object.
        total = count_json_lines(filename)

    print("Total objects:", total)

if __name__ == "__main__":
    main()
