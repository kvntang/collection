#!/usr/bin/env python3
import json
import sqlite3
import ijson
import decimal

def create_table(conn):
    """Create the paintings table if it doesn't exist."""
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS paintings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            artist TEXT,
            date TEXT,
            medium TEXT,
            accession_number TEXT,
            url TEXT,
            image_url TEXT,
            height REAL,
            width REAL
        )
    ''')
    conn.commit()

def insert_painting(conn, painting):
    """Insert a painting record into the database."""
    c = conn.cursor()
    c.execute('''
        INSERT INTO paintings (title, artist, date, medium, accession_number, url, image_url, height, width)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', painting)
    conn.commit()

def process_json_array(input_filename, conn):
    """Process a JSON array file and insert painting records into the database."""
    with open(input_filename, 'r', encoding='utf-8') as f:
        for obj in ijson.items(f, 'item'):
            if obj.get("Classification") == "Painting":
                title = obj.get("Title")
                artist_list = obj.get("Artist")
                # Join artist list into a string if necessary.
                artist = ", ".join(artist_list) if isinstance(artist_list, list) else artist_list
                date = obj.get("Date")
                medium = obj.get("Medium")
                accession_number = obj.get("AccessionNumber")
                url = obj.get("URL")
                image_url = obj.get("ImageURL")
                height = obj.get("Height (cm)")
                width = obj.get("Width (cm)")

                # If height or width is a Decimal, convert to float.
                if isinstance(height, decimal.Decimal):
                    height = float(height)
                if isinstance(width, decimal.Decimal):
                    width = float(width)

                painting = (title, artist, date, medium, accession_number, url, image_url, height, width)
                insert_painting(conn, painting)

def process_json_lines(input_filename, conn):
    """Process a JSON Lines file and insert painting records into the database."""
    with open(input_filename, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            if obj.get("Classification") == "Painting":
                title = obj.get("Title")
                artist_list = obj.get("Artist")
                artist = ", ".join(artist_list) if isinstance(artist_list, list) else artist_list
                date = obj.get("Date")
                medium = obj.get("Medium")
                accession_number = obj.get("AccessionNumber")
                url = obj.get("URL")
                image_url = obj.get("ImageURL")
                height = obj.get("Height (cm)")
                width = obj.get("Width (cm)")

                if isinstance(height, decimal.Decimal):
                    height = float(height)
                if isinstance(width, decimal.Decimal):
                    width = float(width)

                painting = (title, artist, date, medium, accession_number, url, image_url, height, width)
                insert_painting(conn, painting)

def main():
    input_filename = "../Artworks.json"   # Path to your JSON file.
    db_filename = "paintings.db"            # SQLite database file.
    
    # Connect to the SQLite database (it will be created if it doesn't exist).
    conn = sqlite3.connect(db_filename)
    create_table(conn)

    # Read the first non-whitespace character to determine the file format.
    with open(input_filename, 'r', encoding='utf-8') as f:
        first_char = None
        while True:
            c = f.read(1)
            if not c:
                break
            if not c.isspace():
                first_char = c
                break

    # Choose processing method based on file structure.
    if first_char == '[':
        process_json_array(input_filename, conn)
    else:
        process_json_lines(input_filename, conn)
    
    conn.close()
    print(f"Database created and stored in '{db_filename}'")

if __name__ == "__main__":
    main()
