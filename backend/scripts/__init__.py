# This file makes the 'scripts' directory a Python package.
# It can be empty.

# This allows you to import modules from this directory using, for example:
# from . import script_name
# or if script_name.py is in this directory:
# from .script_name import main_function
# (assuming you are importing from a file within the 'scripts' package or a parent package)

# If you have multiple script files like:
# scripts/
#   __init__.py
#   database_setup.py
#   data_migration.py
#   cleanup_scripts.py
# You could expose them like:
# from .database_setup import setup_database
# from .data_migration import migrate_data
# to make them available as `from scripts import setup_database, migrate_data` (if scripts is in sys.path)
# or `from .scripts import setup_database, migrate_data` (from backend.main for example)
