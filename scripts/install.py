"""Install/update only this skill; refuse to overwrite any local modifications."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import tempfile
from validate import ROOT, SKILL, validate


def hashes(folder):
    return {p.relative_to(folder).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest() for p in folder.rglob('*') if p.is_file()}


def install(target, update=False):
    validate()
    target = target.expanduser().absolute()
    if target.name != 'bencho-frontend':
        raise ValueError('Target must be a dedicated bencho-frontend folder')
    parent = target.parent.resolve()
    if target.resolve().parent != parent or target.resolve().is_relative_to(SKILL.resolve()):
        raise ValueError('Target must stay in its selected parent and outside the source skill')
    if target.is_symlink() or target.is_junction():
        raise ValueError('Refusing to replace a linked skill folder')
    record = target.parent / '.bencho-frontend-install.json'
    if target.exists():
        if any(p.is_symlink() or p.is_junction() for p in target.rglob('*')):
            raise ValueError('Refusing a managed skill containing filesystem links')
        if not update:
            raise ValueError('Skill already exists; use --update for a managed installation')
        if not record.is_file():
            raise ValueError('Existing skill is not managed by this installer')
        old = json.loads(record.read_text(encoding='utf-8'))
        if hashes(target) != old['files']:
            raise ValueError('Local modifications detected; preserve/reconcile them before updating')
    target.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix='.bencho-stage-', dir=target.parent))
    backup = None
    placed = False

    def remove_owned(folder):
        resolved = folder.resolve()
        if resolved.parent != parent or not (folder == target or folder.name.startswith(('.bencho-stage-', '.bencho-backup-'))):
            raise ValueError('Cleanup target escaped the selected installation directory')
        if folder.is_symlink() or folder.is_junction():
            raise ValueError('Refusing linked cleanup target')
        shutil.rmtree(folder)

    try:
        shutil.copytree(SKILL, stage, dirs_exist_ok=True)
        for name in ['LICENSE', 'THIRD_PARTY_NOTICES.md']:
            shutil.copy2(ROOT / name, stage / name)
        new_record = {'version': (ROOT / 'VERSION').read_text().strip(), 'source': 'https://github.com/GuangGOvO/bencho-frontend-skill', 'files': hashes(stage)}
        if target.exists():
            backup = Path(tempfile.mkdtemp(prefix='.bencho-backup-', dir=target.parent))
            backup.rmdir()
            target.rename(backup)
        stage.rename(target)
        placed = True
        temp_record = record.with_suffix('.json.tmp')
        temp_record.write_text(json.dumps(new_record, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        os.replace(temp_record, record)
    except Exception:
        if backup is not None and backup.exists():
            if target.exists():
                remove_owned(target)
            backup.rename(target)
        elif placed and target.exists():
            remove_owned(target)
        raise
    finally:
        if stage.exists():
            remove_owned(stage)
        if backup is not None and backup.exists() and target.exists():
            remove_owned(backup)
    print(f'Installed {new_record["version"]} to {target}')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', type=Path, default=Path.home() / '.agents/skills/bencho-frontend')
    parser.add_argument('--update', action='store_true')
    args = parser.parse_args()
    install(args.target, args.update)
