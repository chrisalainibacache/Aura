# Autoría de AURA

> Estado: **borrador para revisión del creador**. Este documento es un antecedente informativo, **no es asesoría legal**
> y **no acredita que AURA esté inscrita** en ningún registro. A la fecha no existe inscripción ni certificado.

## 1. Identificación del creador original

| Dato | Valor |
|---|---|
| Nombre completo | Christopher Alain Ibacache Crisosto |
| Rol | Creador original, autor y director del proyecto |
| País | Chile |
| Proyecto | AURA |
| Tipo de obra | Programa computacional / software con inteligencia artificial |
| Año de creación y desarrollo | 2026 (primer rastro en el historial de Git: 3 de noviembre de 2026; ver sección 4) |
| Naturaleza | Software de acceso gratuito, con finalidad social y humanitaria |

No se incluyen aquí documentos de identidad, RUT, domicilio ni otros datos personales. Esos antecedentes los
presentará el titular directamente ante el organismo que corresponda.

## 2. Descripción del proyecto

AURA es un asistente con inteligencia artificial orientado a la **contención inicial y el acompañamiento** de niños,
niñas y adolescentes (10 a 18 años) autistas y neurodivergentes, en Chile. Conversa por texto o por voz a través de una
interfaz centrada en un "átomo de luz", con ajustes sensoriales básicos, sin memoria entre conversaciones y con una red
de seguridad ante señales de riesgo. No reemplaza a un adulto de confianza ni a un profesional. Es una **prueba técnica
(Fase 1)** y no debe usarse con menores reales hasta contar con revisión profesional y legal (ver `README.md`).

## 3. Finalidad social

Su acceso es gratuito. El proyecto busca facilitar herramientas de apoyo a familias, cuidadores y comunidades, sin
barreras económicas. La disponibilidad pública del software no elimina el reconocimiento de su creador original ni los
derechos sobre sus contribuciones originales.

## 4. Historia de desarrollo (según el historial de Git y GitHub)

Hechos verificados en el repositorio `chrisalainibacache/Aura`:

- **2026-11-03 20:20:35 UTC**: GitHub registra la creación del repositorio.
- **2026-11-03 17:28:44 -03:00** (20:28:44 UTC): primer commit, `df16877`, "Initial commit" (solo un `README.md`), con la
  cuenta `chrisalainibacache`.
- **2026-11-03 20:57 UTC**: se incorpora la especificación maestra del proyecto (`AURA_MASTER_SPEC.md`).
- **2026-11-03 a 2026-11-07**: 21 propuestas de cambio (pull requests) fusionadas a `main`, de la #1 a la #21, todas
  abiertas desde la cuenta `chrisalainibacache`. El detalle, con fechas y commits, está en
  [`docs/registro-ddi/EVIDENCIA_CRONOLOGICA.md`](docs/registro-ddi/EVIDENCIA_CRONOLOGICA.md).
- Total al 2026-11-06 (commit `b1de123`): **48 commits**. No hay etiquetas (tags) ni releases.

Hitos funcionales, en orden: MVP conversacional y especificación; despliegue en Cloudflare; interfaz de átomo de luz;
respaldo de modelos; voz y comandos de voz; medidor de tokens; modo presentación; voz propia por texto a voz;
red de seguridad ante riesgo; conversación sin teclado; ajustes de luz (color, intensidad, giro); íconos nuevos.

## 5. Arquitectura general

Un único *Worker* de Cloudflare sirve la interfaz web estática (`public/`) y expone tres rutas:
`POST /api/chat` (conversación con un modelo de lenguaje en Workers AI), `GET /api/models` (lista de modelos
permitidos) y `POST /api/speak` (texto a voz). No hay base de datos ni cuentas: el historial vive en el navegador.
Detalle en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y [`docs/registro-ddi/DESCRIPCION_TECNICA.md`](docs/registro-ddi/DESCRIPCION_TECNICA.md).

## 6. Componentes originales de AURA

- La **especificación maestra** y las reglas de producto y ética (`AURA_MASTER_SPEC.md`, `docs/`).
- El **comportamiento conversacional** (`src/systemPrompt.js`) y la **red de seguridad ante riesgo** (`src/index.js`).
- La **interfaz**: el átomo de luz en canvas con voz y ajustes sensoriales (`public/`), el modo presentación, los
  comandos de voz y la conversación sin teclado.
- Los **íconos** y el generador de íconos (`public/*.svg`, `public/*.png`, `scripts/make-icons.mjs`).
- Las **pruebas** y los **escenarios de evaluación** (`test/`, `eval/`, `scripts/eval-models.mjs`).
- La **documentación**.

Inventario por archivo: [`docs/registro-ddi/COMPONENTES_ORIGINALES.md`](docs/registro-ddi/COMPONENTES_ORIGINALES.md).

## 7. Tecnologías de terceros

AURA se apoya en servicios, modelos y herramientas de terceros que **no son obra de AURA** y mantienen sus propias
licencias. Lista y condiciones en [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## 8. Modelo de IA utilizado

AURA usa modelos **Llama**, de **Meta Platforms, Inc.**, ejecutados mediante **Cloudflare Workers AI**. Según la
configuración actual (`wrangler.jsonc`): principal `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (Llama 3.3 70B Instruct) y
respaldo `@cf/meta/llama-3.1-8b-instruct-fast` y `@cf/meta/llama-3.1-8b-instruct-fp8` (Llama 3.1 8B Instruct). Las
versiones exactas, los cambios de modelo y la licencia aplicable están en `THIRD_PARTY_NOTICES.md`. AURA **no incluye ni
distribuye los pesos de los modelos**.

## 9. Distinción entre el desarrollo original y lo externo

| Original de AURA | Externo (no es obra de AURA) |
|---|---|
| Especificación, reglas de producto y ética | Modelos Llama (Meta) y otros modelos de voz |
| Prompt de sistema y red de seguridad | Plataforma Cloudflare (Workers, Workers AI) |
| Interfaz, átomo de luz, voz, ajustes sensoriales | Wrangler y herramientas de desarrollo |
| Íconos, pruebas, escenarios de evaluación, documentación | Estándares y API de los navegadores |

## 10. Cómo se desarrolló, con transparencia sobre la asistencia de IA

El creador definió la idea, la finalidad, el público, las reglas éticas, los requisitos y las decisiones de producto,
revisó el resultado en dispositivos reales y corrigió el rumbo de manera continua. **El código fuente fue redactado con la
asistencia de una herramienta de inteligencia artificial (Claude Code, de Anthropic)**, que siguió esas instrucciones.

El historial de Git lo refleja así: de los 48 commits al 2026-11-06, **26 figuran con el autor `Claude`** (los cambios
de código y documentación redactados por la herramienta) y **22 con la cuenta `chrisalainibacache`** (el commit inicial y
las 21 fusiones, es decir, las aprobaciones del creador). Los commits de la herramienta incluyen un identificador de la
sesión de trabajo (`Claude-Session`), que sirve como referencia a la conversación de desarrollo.

Esto debe declararse con claridad en cualquier inscripción. **La protección legal de obras creadas con ayuda de IA es un
tema en discusión**: la ley protege el aporte creativo humano (por ejemplo, la concepción, la dirección, la selección y
ordenación, la especificación y las decisiones de diseño), pero puede no alcanzar al texto o código generado de forma
autónoma. Se recomienda consultar a un abogado o al Departamento de Derechos Intelectuales cómo describir correctamente
la obra y la asistencia de IA. Este documento **no afirma** quién es titular de cada línea de código.

Aportes humanos documentables (fuente: la sesión de desarrollo y los commits, a verificar con la evidencia): la
especificación maestra v1.0 (texto redactado por el creador y entregado como instrucciones), las decisiones de público y
país, la exigencia de que AURA contenga antes de derivar, la dirección del diseño visual (átomo de luz, voz, ajustes
sensoriales, modo presentación) y las pruebas con conversaciones de ejemplo que motivaron las correcciones de seguridad.

## 11. Reconocimiento de futuras contribuciones

Las personas que contribuyan serán reconocidas en [`AUTHORS`](AUTHORS) y en el historial. Ver la política en
[`CONTRIBUTING.md`](CONTRIBUTING.md). El reconocimiento del creador original no se elimina ni se reemplaza.

## 12. Estado de inscripción

**AURA no está inscrita** como programa computacional ante el Departamento de Derechos Intelectuales (Servicio Nacional
del Patrimonio Cultural de Chile). Los antecedentes preparados para una futura inscripción están en
[`docs/registro-ddi/`](docs/registro-ddi/). La inscripción la realiza el titular; solo el certificado oficial acredita
que existe.
