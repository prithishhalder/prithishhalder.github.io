import traceback
from scholarly import scholarly
import csv

try:
    print("Reading publications.csv...")
    with open('publications.csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            title = row[1]
            print(f"Searching for: {title[:50]}...")
            try:
                search_query = scholarly.search_pubs(title)
                pub = next(search_query)
                citations = pub.get('num_citations', 0)
                print(f"CITATIONS: {citations}")
            except StopIteration:
                print("CITATIONS: Not Found")
except Exception as e:
    print("An error occurred:")
    traceback.print_exc()
    print("An error occurred:")
    traceback.print_exc()
