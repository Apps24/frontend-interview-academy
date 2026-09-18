# Deterministic content ids

Every row of authored curriculum content in this repository gets its primary key
from a deterministic UUIDv5 derivation rather than from `gen_random_uuid()`.
This is what makes the seed migrations idempotent: re-running a migration, or
regenerating one from the JSON sources, produces byte-identical ids, so
`on conflict … do update` updates the same row instead of inserting a duplicate.

## The namespace

```
NAMESPACE_URL = 6ba7b811-9dad-11d1-80b4-00c04fd430c8   (RFC 4122 URL namespace)

CONTENT_NAMESPACE = uuid5(NAMESPACE_URL, "https://github.com/Apps24/frontend-interview-academy")
                  = 969f6c2c-f480-5a63-b764-f9aca6fc7bb5
```

`CONTENT_NAMESPACE` is fixed for the life of the project. Changing it would
orphan every existing row, so it must never be regenerated.

## Deriving a row id

```
id = uuid5(CONTENT_NAMESPACE, "<table>:<slug>")
```

`<table>` is the physical table name and `<slug>` is the content slug that is
unique within that table. Examples:

| Row | Name string |
| --- | --- |
| Module `js-beginner-dom` | `modules:js-beginner-dom` |
| Lesson `js-events-delegation` | `lessons:js-events-delegation` |
| Quiz question `js-storage-001` | `questions:js-storage-001` |
| Practice problem `todo-store` | `practice_problems:todo-store` |
| Interview question `abortcontroller-cancel-fetch` | `interview_questions:abortcontroller-cancel-fetch` |

Child rows that have no slug of their own derive from their parent's slug plus a
discriminator. A lesson content block uses the lesson slug and its ordinal
position, joined with `#`:

```
lesson_content_blocks:js-events-delegation#3
```

A citation row derives from the entity it documents and the source URL, so the
same source cited twice from the same row resolves to one id:

```
content_sources:lesson:<lesson uuid>:https://developer.mozilla.org/...
```

Tables whose natural key is already a foreign key — `practice_solutions`,
`practice_hidden_tests`, `question_answer_keys` and `interview_question_answers`
— have no separate id at all. Their primary key *is* the parent id
(`problem_id`, `question_id`), which keeps them one-to-one with their parent and
idempotent for free.

The implementation lives in [`scripts/content-id.mjs`](../scripts/content-id.mjs)
and is used by [`scripts/build-content-migration.mts`](../scripts/build-content-migration.mts),
which reads the JSON sources under `content/` and emits the seed SQL.

## Rows that predate this convention

The six lessons, six quiz questions, six practice problems and sixteen interview
questions that shipped in the original seed migrations keep their hand-written
ids (`10000000-…`, `30000000-…` and similar). Those ids are load-bearing for
rows that already exist in production, so later migrations reference them
directly and never re-derive them. New content added from Batch 1 onward always
uses the UUIDv5 derivation above.

## Rules

- Never change `CONTENT_NAMESPACE`.
- Never change a slug once its migration has been applied to production —
  changing a slug changes the id and inserts a second row. Rename the title
  instead, or write an explicit migration that moves the data.
- Always regenerate migration SQL with `npx tsx scripts/build-content-migration.mts --write`
  rather than editing the generated file by hand.
