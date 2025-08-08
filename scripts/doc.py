# this script creates a doc.md that based on index.json
#
# {
#     "id": "fbd59188-56c8-4279-8166-9b237b9337de",
#     "name": "zdash.zip",
#     "timestamp": "2025-08-08T11:57:35.372779",
#     "git": true
# },

# creates an entry in markdown
# - {human readable date} [zdash](/dump/fbd59188-56c8-4279-8166-9b237b9337de/) `git`
import datetime
import json
import os

def load_index():
    index_path = 'index/index.json'
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            return json.load(f)
    else:
        return []
    
def create_doc():
    index_data = load_index()
    doc_lines = []

    for entry in index_data:
        human_readable_date = entry['timestamp'][:10]  # YYYY-MM-DD
        human_readable_date = datetime.datetime.fromisoformat(human_readable_date).strftime('%Y-%m-%d')
        name = entry['name']
        dump_id = entry['id']

        doc_lines.append(f"- {human_readable_date} [{name}](./dump/{dump_id}/) `{'git' if entry['git'] else 'non-git'}`")

    with open('doc.md', 'w') as f:
        f.write("\n".join(doc_lines))

if __name__ == "__main__":
    create_doc()
    print("doc.md created successfully.")