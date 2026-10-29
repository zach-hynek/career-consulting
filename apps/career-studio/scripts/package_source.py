"""Package only redistributable sources. No original resumes or Site identity."""
from pathlib import Path
from shutil import copyfile
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
for source, target in [
    ('docs/build-plan.md', 'dist/build-plan.md'),
    ('docs/agent-prompt.md', 'dist/agent-prompt.md'),
    ('docs/editor-agent.md', 'dist/editor-agent.md'),
    ('LICENSE', 'dist/LICENSE'),
]:
    copyfile(root / source, root / target)

files = [
    'README.md', 'LICENSE', 'vercel.json', '.gitignore',
    'docs/build-plan.md', 'docs/agent-prompt.md', 'docs/editor-agent.md', 'scripts/package_source.py',
    'dist/index.html', 'dist/styles.css', 'dist/app.js', 'dist/content.json',
    'dist/resume-editor.js', 'dist/resume-editor.css', 'dist/template-flow.js', 'dist/template-flow.css',
    'dist/vendor/pdfjs/pdf.mjs', 'dist/vendor/pdfjs/pdf.worker.mjs', 'dist/vendor/pdfjs/LICENSE',
    'dist/favicon.svg', 'dist/LICENSE', 'dist/build-plan.md', 'dist/agent-prompt.md', 'dist/editor-agent.md',
]
archive = root / 'dist/career-studio-source.zip'
with ZipFile(archive, 'w', compression=ZIP_DEFLATED) as bundle:
    for name in files:
        bundle.write(root / name, 'career-studio/' + name)
print(f'Packaged {len(files)} source files: {archive}')
