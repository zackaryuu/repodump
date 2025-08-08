import datetime
import os
import uuid
import json

def load_index():
    index_path = 'index/index.json'
    if os.path.exists(index_path):
        with open(index_path, 'r') as f:
            return json.load(f)
    else:
        return []
    
def save_index(index_data):
    index_path = 'index/index.json'
    with open(index_path, 'w') as f:
        json.dump(index_data, f, indent=4)



def create_new_dump():
    assert len(os.listdir('inbox')) == 1, "Expected exactly one item in 'inbox' directory."
    inbox_dir_name = os.listdir('inbox')[0]

    is_git = False
    # if already a zip file, we need to check the contents
    if inbox_dir_name.endswith('.zip'):
        # if it is a zip file, we need to check namelist
        import zipfile
        zip_path = os.path.join('inbox', inbox_dir_name)
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            if any("/.git/" in name for name in zip_ref.namelist()):
                is_git = True

    # if it contains .git directory, we need to convert it to a zip file
    elif os.path.isdir(os.path.join('inbox', inbox_dir_name, '.git')):
        is_git = True
        import shutil
        zip_path = os.path.join('inbox', inbox_dir_name + '.zip')
        shutil.make_archive(zip_path[:-4], 'zip', os.path.join('inbox', inbox_dir_name))
        inbox_dir_name += '.zip'
        # remove the original directory
        shutil.rmtree(os.path.join('inbox', inbox_dir_name[:-4]))

    dump_id = str(uuid.uuid4())
    dump_path = os.path.join('dump', dump_id)

    os.makedirs(dump_path, exist_ok=True)
    
    # Move the inbox directory to the new dump path
    os.rename(os.path.join('inbox', inbox_dir_name), os.path.join(dump_path, inbox_dir_name))

    # create a readme
    readme_path = os.path.join(dump_path, 'README.md')
    with open(readme_path, 'w') as f:
        f.write(f"# {inbox_dir_name}\n")
        f.write(f"Created on: {datetime.datetime.now().isoformat()}\n")
        f.write(f"Dump ID: {dump_id}\n")


    # Update the index
    indexdata = load_index()
    indexdata.append({
        'id': dump_id,
        'name': inbox_dir_name,
        "timestamp": datetime.datetime.now().isoformat(),
        "git" : is_git
    })

    save_index(indexdata)

    return dump_id

if __name__ == "__main__":
    new_dump_id= create_new_dump()
    print(f"New dump created with ID: {new_dump_id}")
