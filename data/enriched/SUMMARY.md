# Catalogo enriquecido — Resumen del merge

Generado al consolidar `data/enriched/shards/batch-*.json` en un unico dataset canonico.

## Totales

- **Registros totales (post-dedup):** 1732
- **Registros crudos (suma de shards):** 1748
- **Duplicados exactos removidos:** 16

Dedup definido como registros 100% identicos que ademas comparten
`codigo` + `proyecto` + `vimeoId`. Ver caveat abajo sobre por que NO se
colapso de forma mas agresiva.

## Por tipo

| Tipo | Registros |
|------|-----------|
| Corporativo | 898 |
| Academico | 481 |
| Industrial | 353 |

(Total tipado = 1732; no hay tipos fuera de las 3 categorias.)

## Flags

- **Excluidos (`excluir: true`):** 28
- **Destacados (`starred: true`):** 353
- **Con `vimeoId`:** 47

## Top 15 clientes por frecuencia

1. SCANIA — 339
2. Universidad Tecnica Federico Santa Maria — 274
3. SACYR — 231
4. Universidad Alberto Hurtado — 26
5. China — 17
6. Nivelat — 17
7. Masisa — 14
8. Ministerio de Energia — 12
9. Diploma de Innovacion ★ — 11
10. Historias de Sol — 9
11. URCOM — 8
12. Argumental ★ — 7
13. Universidad de Valparaiso — 7
14. KOMATSU — 6
15. BHP — 6

## Caveats de calidad de dato

- **`cliente` nulo:** 558 de 1732 registros (32%) no tienen cliente asignado. Es el campo mas incompleto.
- **`fecha` nula:** 57 registros sin fecha. Ademas el formato de fecha es inconsistente: conviven `YYYYMMDD` (ej. `20250821`) y `YYYY-MM-DD` (ej. `2016-02-22`). Hay que normalizar antes de ordenar/filtrar por fecha.
- **`vimeoId` nulo:** 1685 registros (97%) sin Vimeo. Solo 47 tienen video; el grueso del catalogo no esta enlazado a media provider todavia.
- **`flickrUrl` nulo:** 1725 registros sin Flickr.
- **Dedup conservador a proposito:** una clave `codigo`+`proyecto`+`vimeoId` agrupa 202 colisiones, pero solo en ~10 de esas claves los registros son identicos en todos los campos. Las otras ~192 colisiones difieren en `fecha`, `tipo` u otros campos (mismo codigo y proyecto, distinta fecha/clasificacion) — NO son duplicados obvios y se conservan para no perder datos. Si se quiere colapsar por clave de negocio habra que decidir reglas de merge (cual fecha gana, etc.).
- **Codigos vacios:** algunos registros tienen `codigo: null` (~60 colisiones de clave involucran codigo nulo). Sin codigo no hay identidad estable contra el Excel del cliente.
- **Marcadores `★` en nombres de cliente:** varios clientes traen el caracter `★` en el nombre (ej. `Argumental ★`). Probablemente es senal de destacado embebida en el texto; conviene limpiarla y migrarla al flag `starred`.
- **Shards vacios:** `batch-10` a `batch-13` estan vacios y `batch-09` solo trae 2 registros. El pipeline de shards quedo con cola vacia, sin impacto en el merge.
