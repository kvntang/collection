import sqlite3

conn = sqlite3.connect("../paintings.db")
cursor = conn.cursor()

# Fetch all images, showing NULL values
cursor.execute("SELECT * FROM paintings")
# cursor.execute("SELECT * FROM paintings WHERE image_url IS NOT NULL AND image_url != ''")
# cursor.execute("SELECT * FROM paintings WHERE image_url IS NOT NULL AND image_url != '' AND height IS NOT NULL AND width IS NOT NULL)



paintings = cursor.fetchall()

for painting in paintings:
    print(painting)  # NULL values will appear as None in Python

conn.close()
