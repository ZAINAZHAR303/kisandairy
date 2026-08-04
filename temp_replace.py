
import os
import re

src_dir = r'E:\Github Repos\kisan_dairy\src'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # 1. Card Headers (bg-[#1a2f5e] with text-white)
    # We replace bg-[#1a2f5e] with a clean white header
    # and we must also change text-white to text-gray-900 if it follows closely in the same header context.
    # To keep it simple and safe:
    if 'bg-[#1a2f5e]' in content:
        content = content.replace('bg-[#1a2f5e]', 'bg-white border-b border-gray-100')
        # We need to find text-white that represents the date or text in the header and replace it
        # Actually, let's just do a blanket replacement of 'text-white' to 'text-gray-900' in files that had the card header, BUT only if it is the Card components!
        if filepath.endswith('Card.tsx') or filepath.endswith('Modal.tsx'):
            content = content.replace('text-white', 'text-gray-900')
            # Fix AddEdit buttons that were also white
            content = content.replace('text-gray-900 font-medium py-3.5', 'text-white font-medium py-3.5')
            content = content.replace('text-gray-900 font-semibold px-3', 'text-white font-semibold px-3')
    
    # 2. Teal (#00BFA6) mapping -> Bright Blue (var(--color-blue) or Tailwind blue-600)
    content = content.replace('bg-[#00BFA6]', 'bg-[var(--color-blue)]')
    content = content.replace('hover:bg-[#00a892]', 'hover:bg-blue-600')
    content = content.replace('text-[#00BFA6]', 'text-[var(--color-blue)]')
    content = content.replace('ring-[#00BFA6]', 'ring-[var(--color-blue)]')
    content = content.replace('border-[#00BFA6]', 'border-[var(--color-blue)]')
    content = content.replace('border-t-[#00BFA6]', 'border-t-[var(--color-blue)]')

    # 3. Replace teal utility classes with blue utility classes
    content = re.sub(r'\bteal-(\d+)\b', r'blue-\1', content)
    
    # 4. Fix PDF Generator in FinancialsList.tsx
    content = content.replace('doc.setFillColor(26, 47, 94)', 'doc.setFillColor(2, 18, 59)')

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

updated_files = 0
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            if process_file(os.path.join(root, file)):
                print(f'Updated {file}')
                updated_files += 1

print(f'Updated {updated_files} files with new color theme.')

