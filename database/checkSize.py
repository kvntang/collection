import sqlite3

# Database path (assumed to be in the same folder as the script)
DB_PATH = "../paintings.db"

def main():
    try:
        # Connect to the database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get list of all tables in the database
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        if not tables:
            print("No tables found in the database.")
            return
        
        print(f"Database '{DB_PATH}' contains {len(tables)} table(s):\n")
        
        # For each table, get the column count and row count
        for table_tuple in tables:
            table_name = table_tuple[0]
            
            # Get column info using PRAGMA
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            num_columns = len(columns)
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
            row_count = cursor.fetchone()[0]
            
            print(f"Table: {table_name}")
            print(f"  Number of columns: {num_columns}")
            print(f"  Number of rows: {row_count}")
            
            # If the table has an 'image_url' column, get the count of rows with a valid image URL.
            col_names = [col[1] for col in columns]
            if "image_url" in col_names:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name} WHERE image_url IS NOT NULL AND image_url != ''")
                valid_image_count = cursor.fetchone()[0]
                print(f"  Rows with valid image_url: {valid_image_count}")
            
            print()
        
        conn.close()
    except sqlite3.Error as e:
        print("SQLite error:", e)

if __name__ == "__main__":
    main()
