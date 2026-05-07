# `data/` — schema, migrations y muestras

## Archivos

- `schema.sql` — schema actual de D1 (source of truth visual).
- `migrations/NNN_*.sql` — diffs incrementales numerados. Aplicar **en orden**, una sola vez por entorno.
- `sample-catalog.csv` — sample anonimizado (≤ 20 filas) del Excel real. **No commitear el Excel completo.**
- `discovery.md` — hallazgos de Fase 0 al inspeccionar el Excel + APIs reales.

## Aplicar schema en local

```bash
wrangler d1 execute leonfindel --local --file=data/schema.sql
wrangler d1 execute leonfindel --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Aplicar migración nueva en producción

```bash
# Siempre primero local
wrangler d1 execute leonfindel --local  --file=data/migrations/00X_thing.sql

# Una vez verificado:
wrangler d1 execute leonfindel --remote --file=data/migrations/00X_thing.sql
```

> Nunca editar una migración ya aplicada a `--remote`. Crear una nueva.

## Regenerar D1 local desde cero

```bash
rm -rf .wrangler/state/v3/d1
wrangler d1 execute leonfindel --local --file=data/schema.sql
# (Opcional) seed con fixtures
# wrangler d1 execute leonfindel --local --file=tests/fixtures/seed.sql
```
