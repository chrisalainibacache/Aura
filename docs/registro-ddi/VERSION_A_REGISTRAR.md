# Versión del software que se pretende registrar

> Propuesta para decisión del creador. **No se creó ninguna etiqueta ni release.**

- **Versión existente del proyecto:** `0.1.0` (campo `version` de `package.json`). No se inventó ningún otro número.
- **Snapshot candidato:** `b1de123ba858fde1c6f4cc96a275bb332e3315fc` (PR #21 fusionado el 2026-11-07).
- **Estado de la obra:** prueba técnica de la Fase 1; funciones descritas en `DESCRIPCION_TECNICA.md`.

## Antes de registrar, decidir

1. Qué versión exacta se registra y si incluye la documentación de autoría posterior al snapshot.
2. Confirmar la licencia (elegida: PolyForm Noncommercial 1.0.0; ver `docs/LICENSE_ANALYSIS.md`) y cómo declarar la asistencia de IA en el desarrollo.
3. Si se espera a una revisión profesional del prompt de seguridad antes de fijar la versión.

## Cómo fijar y copiar la versión (cuando el creador lo autorice)

```bash
# 1. Etiquetar el commit definitivo (ejemplo; no ejecutado)
git tag -a v0.1.0 -m "AURA 0.1.0" <commit-definitivo>
git push origin v0.1.0

# 2. Copia del código fuente de esa versión (para adjuntar a la solicitud)
git archive --format=zip --prefix=aura-0.1.0/ -o aura-0.1.0.zip v0.1.0
sha256sum aura-0.1.0.zip

# 3. Regenerar el manifiesto de integridad sobre ese commit (ver MANIFIESTO_INTEGRIDAD.md)
```
