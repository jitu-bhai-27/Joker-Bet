import os
import zipfile

def make_zip(source_dir, output_zip):
    exclude_dirs = {'node_modules', '.git', 'dist', '.aistudio', '.vite-temp'}
    exclude_files = {'jokerbet-source-code.zip', 'bun.lock'}

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                if file in exclude_files:
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    public_dir = os.path.join(base_dir, 'public')
    os.makedirs(public_dir, exist_ok=True)
    target = os.path.join(public_dir, 'jokerbet-source-code.zip')
    make_zip(base_dir, target)
    print(f"Successfully created zip at {target} (Size: {os.path.getsize(target)} bytes)")
