"""A small in-memory stand-in for the database, shared by the nook tests.

It supports exactly what the nook code uses: equality filters, `$ne`, `$in`,
`find().sort().limit().to_list()`, and `$set` / `$unset` / `$addToSet` updates, including
dotted keys such as `readiness_plant.steps.drainage`.
"""


def matches(doc, flt):
    for key, value in flt.items():
        if isinstance(value, dict):
            if "$ne" in value and doc.get(key) == value["$ne"]:
                return False
            if "$in" in value and doc.get(key) not in value["$in"]:
                return False
        elif doc.get(key) != value:
            return False
    return True


class Cursor:
    def __init__(self, docs):
        self.docs = list(docs)

    def sort(self, key, direction=1):
        self.docs.sort(key=lambda d: d.get(key) or "", reverse=direction < 0)
        return self

    def limit(self, n):
        self.docs = self.docs[:n]
        return self

    async def to_list(self, n=None):
        return self.docs if n is None else self.docs[:n]


def _set_path(doc, path, value):
    parts = path.split(".")
    for part in parts[:-1]:
        doc = doc.setdefault(part, {})
    doc[parts[-1]] = value


class Collection:
    def __init__(self):
        self.docs = []

    async def insert_one(self, doc):
        self.docs.append(doc)

    async def find_one(self, flt, projection=None):
        for doc in self.docs:
            if matches(doc, flt):
                return doc
        return None

    def find(self, flt=None, projection=None):
        return Cursor(d for d in self.docs if matches(d, flt or {}))

    async def count_documents(self, flt):
        return sum(1 for d in self.docs if matches(d, flt))

    async def update_one(self, flt, update):
        doc = await self.find_one(flt)
        if doc is None:
            return
        for key, value in update.get("$set", {}).items():
            _set_path(doc, key, value)
        for key in update.get("$unset", {}):
            doc.pop(key, None)
        for key, value in update.get("$addToSet", {}).items():
            items = doc.setdefault(key, [])
            if value not in items:
                items.append(value)


class FakeDb:
    def __init__(self):
        for name in ("users", "plants", "care_logs", "user_missions", "user_badges", "badges", "species"):
            setattr(self, name, Collection())
