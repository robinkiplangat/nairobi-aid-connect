# This file makes the 'models' directory a Python package.
# It can be empty.

# This allows you to import modules from this directory using, for example:
# from . import schemas
# or if schemas.py is in this directory:
# from .schemas import YourModel
# (assuming you are importing from a file within the 'models' package or a parent package)

# If you have multiple schema files like:
# models/
#   __init__.py
#   user_schemas.py
#   item_schemas.py
# You could expose them like:
# from .user_schemas import User
# from .item_schemas import Item
# to make them available as `from models import User, Item` (if models is in sys.path)
# or `from .models import User, Item` (from backend.main for example)
