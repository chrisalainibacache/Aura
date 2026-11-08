# Manifiesto de integridad (SHA-256)

Permite comprobar que los archivos del programa no cambiaron desde una versión determinada.

- **Snapshot:** commit `b1de123ba858fde1c6f4cc96a275bb332e3315fc` (fusión del PR #21, 2026-11-07T00:37:11Z).
- **Archivo:** [`INTEGRITY_MANIFEST.sha256`](INTEGRITY_MANIFEST.sha256): una línea por archivo (`<sha256>  <ruta>`), 29 archivos,
  calculado sobre el contenido exacto del archivo en ese commit.
- **Huella del paquete completo** (`git archive --format=tar b1de123ba858fde1c6f4cc96a275bb332e3315fc | sha256sum`):
  `0aefb86d44b162a13e9de6954eb835b45f27a3aee600c25e0097b6298c74e59f`.
  Esta huella puede variar con otra versión de Git; **la comprobación por archivo es la más robusta**.

## Cómo verificar un archivo

```bash
git show b1de123ba858fde1c6f4cc96a275bb332e3315fc:src/index.js | sha256sum
# comparar con la línea de src/index.js en INTEGRITY_MANIFEST.sha256
```

## Límites

- Este manifiesto **no incluye** los documentos agregados después del snapshot (autoría, avisos de terceros, análisis de
  licencia y esta carpeta) ni se incluye a sí mismo.
- Antes de una inscripción hay que **regenerarlo sobre el commit definitivo** de la versión a registrar (ver
  `VERSION_A_REGISTRAR.md`) y guardar una copia fuera del repositorio.
- Una huella demuestra que el contenido no cambió; no demuestra por sí sola quién lo creó ni cuándo.
