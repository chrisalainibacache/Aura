# Antecedentes para una futura inscripción de AURA (programa computacional)

> **AURA NO está inscrita.** Esta carpeta reúne antecedentes para que el **titular** pueda solicitar, más adelante, la
> inscripción como programa computacional ante el **Departamento de Derechos Intelectuales (DDI) del Servicio Nacional
> del Patrimonio Cultural de Chile**. Solo el certificado oficial acredita una inscripción. Los requisitos, formularios y
> costos vigentes deben consultarse en el sitio oficial del DDI y con un abogado. No es asesoría legal.

## Contenido

| Antecedente | Dónde está | Estado |
|---|---|---|
| Identificación del creador | [`AUTHORSHIP.md`](../../AUTHORSHIP.md), sección 1 | Solo nombre y país. Los documentos personales los presenta el titular y **no se suben al repositorio** |
| Descripción técnica | [`DESCRIPCION_TECNICA.md`](DESCRIPCION_TECNICA.md) | Listo (borrador) |
| Manual de funcionamiento | [`DESCRIPCION_TECNICA.md`](DESCRIPCION_TECNICA.md), sección 4, y [`README.md`](../../README.md) | Listo (borrador) |
| Arquitectura del sistema | [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) | Existente |
| Inventario de componentes originales | [`COMPONENTES_ORIGINALES.md`](COMPONENTES_ORIGINALES.md) | Listo |
| Inventario de dependencias externas y licencias de terceros | [`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md) | Listo; hay elementos "por verificar" |
| Versión a registrar | [`VERSION_A_REGISTRAR.md`](VERSION_A_REGISTRAR.md) | Propuesta, pendiente de decisión |
| Evidencias cronológicas | [`EVIDENCIA_CRONOLOGICA.md`](EVIDENCIA_CRONOLOGICA.md) | Listo |
| Huella de integridad | [`MANIFIESTO_INTEGRIDAD.md`](MANIFIESTO_INTEGRIDAD.md) y [`INTEGRITY_MANIFEST.sha256`](INTEGRITY_MANIFEST.sha256) | Listo para el snapshot `b1de123`; regenerar para la versión final |
| Copia del código fuente de la versión | Se genera con `git archive` (ver `VERSION_A_REGISTRAR.md`) | Pendiente (requiere autorización y etiqueta) |
| Licencia del proyecto | [`docs/LICENSE_ANALYSIS.md`](../LICENSE_ANALYSIS.md) | Pendiente de decisión del creador |

## Qué NO debe subirse a este repositorio público

Documentos de identidad, RUT, domicilio, teléfonos, contraseñas, tokens, claves ni formularios con datos personales.
Guardarlos aparte y presentarlos directamente ante el organismo.

## Pendiente de decisión o acción del creador

1. Aprobar o ajustar estos documentos y fusionar la propuesta de cambios.
2. Decidir la licencia y, si corresponde, los términos adicionales de atribución.
3. Consultar a un abogado cómo declarar la asistencia de IA y qué se inscribe.
4. Crear la etiqueta de versión y regenerar la huella de integridad.
5. Exportar y guardar, fuera del repositorio, la conversación de desarrollo (referencia `Claude-Session` en los commits).
6. Presentar la solicitud ante el DDI con sus datos personales.
