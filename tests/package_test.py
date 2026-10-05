from pathlib import Path
import hashlib
import sys
import unittest
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from package import build


class PackageTests(unittest.TestCase):
    def test_reproducible_container_and_manifest(self):
        archive = build()
        first = hashlib.sha256(archive.read_bytes()).hexdigest()
        self.assertEqual(hashlib.sha256(build().read_bytes()).hexdigest(), first)
        with zipfile.ZipFile(archive) as bundle:
            for entry in bundle.infolist():
                self.assertEqual(entry.create_system, 3)
                self.assertEqual(entry.compress_type, zipfile.ZIP_STORED)
                self.assertEqual(entry.date_time, (2026, 1, 1, 0, 0, 0))


if __name__ == '__main__':
    unittest.main()
