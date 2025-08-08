import os
import shutil
import sys
import pathlib
def main():
    if len(sys.argv) != 2:
        print("Usage: python batch_handle.py <path>")
        sys.exit(1)

    path = sys.argv[1]
    path = pathlib.Path(path).resolve()
    print(f"Processing path: {path}")

    if not os.path.exists(path):
        print(f"Path '{path}' does not exist.")
        sys.exit(1)

    

    for item in os.listdir(path):
        # move item to inbox one by one
        assert len(os.listdir("inbox")) == 0, "Inbox directory should be empty before processing."
        item_path = os.path.join(path, item)
        shutil.move(item_path, os.path.join("inbox", item))
        print(f"Moved '{item}' to 'inbox' directory.")
        os.system("python scripts/create_new.py")
    
if __name__ == "__main__":
    main()