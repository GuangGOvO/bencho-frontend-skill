from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from install import install, hashes


class InstallerTests(unittest.TestCase):
    def test_round_trip_and_local_edit_guard(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / 'bencho-frontend'
            install(target)
            first = hashes(target)
            install(target, update=True)
            self.assertEqual(hashes(target), first)
            entry = target / 'SKILL.md'
            entry.write_text(entry.read_text(encoding='utf-8') + '\nLocal edit\n', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'Local modifications'):
                install(target, update=True)
            self.assertTrue(entry.read_text(encoding='utf-8').endswith('Local edit\n'))

    def test_unmanaged_existing_folder_is_preserved(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / 'bencho-frontend'
            target.mkdir()
            (target / 'local.txt').write_text('keep')
            with self.assertRaisesRegex(ValueError, 'not managed'):
                install(target, update=True)
            self.assertEqual((target / 'local.txt').read_text(), 'keep')


if __name__ == '__main__':
    unittest.main()
