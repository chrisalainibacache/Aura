# Avisos de terceros

AURA se apoya en tecnologías de terceros. **Ninguna de ellas es obra de AURA ni de su creador**, y cada una mantiene su
propia licencia o condiciones de uso. Este documento no otorga ni modifica ningún derecho sobre ellas.

**Cómo se verificó.** Solo se marca como "Verificado" lo que se pudo comprobar en un archivo del repositorio o en el
registro oficial de paquetes (npm) el 2026-11-08. Lo demás figura como "Por verificar" y debe confirmarse en la fuente
oficial indicada antes de cualquier distribución o inscripción. **No se inventaron licencias ni versiones.**

## 1. Modelos de inteligencia artificial

AURA usa estos modelos **como servicio** a través de Cloudflare Workers AI. AURA no incluye ni redistribuye los pesos.

| Componente | Proveedor | Identificador en AURA | Licencia o condiciones | Fuente oficial | Estado |
|---|---|---|---|---|---|
| Llama 3.3 70B Instruct | Meta Platforms, Inc. | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (modelo principal) | Llama 3.3 Community License Agreement y Acceptable Use Policy | https://www.llama.com/llama3_3/license/ | Por verificar el texto vigente |
| Llama 3.1 8B Instruct | Meta Platforms, Inc. | `@cf/meta/llama-3.1-8b-instruct-fast` y `@cf/meta/llama-3.1-8b-instruct-fp8` (respaldo) | Llama 3.1 Community License Agreement y Acceptable Use Policy | https://www.llama.com/llama3_1/license/ | Por verificar el texto vigente |
| MeloTTS (voz) | MyShell | `@cf/myshell-ai/melotts` (voz principal, configurada) | Según el repositorio del proyecto, MIT | Ficha del modelo en Cloudflare y repositorio de MyShell | Por verificar; no se comprobó que el modelo esté disponible en la cuenta |
| Deepgram Aura 2 (voz, español) | Deepgram | `@cf/deepgram/aura-2-es` (voz de respaldo, configurada) | Condiciones comerciales de Deepgram, aplicadas a través de Cloudflare | Ficha del modelo en Cloudflare y sitio de Deepgram | Por verificar; no se comprobó que el modelo esté disponible en la cuenta |

Historial de modelos de chat usados (ver `docs/registro-ddi/EVIDENCIA_CRONOLOGICA.md`): se partió de
`@cf/meta/llama-3.1-8b-instruct`, que falló en la cuenta del proyecto (error 5028); luego `@cf/meta/llama-3.1-8b-instruct-fast`
y, desde el PR #12, `@cf/meta/llama-3.3-70b-instruct-fp8-fast` como principal.

**Resumen informativo de las condiciones de Llama** (no reemplaza el texto oficial; verificar siempre el vigente):
el uso está condicionado al acuerdo de licencia comunitaria de Meta y a su política de uso aceptable; el acuerdo suele
exigir, al distribuir o poner a disposición productos que usan Llama, incluir una copia del acuerdo, mostrar la leyenda
**"Built with Llama"** en el sitio, la interfaz o la documentación, y conservar el aviso de atribución correspondiente;
tiene un umbral para servicios con muy gran cantidad de usuarios y limitaciones sobre usar las salidas para mejorar otros
modelos de lenguaje. **Acción recomendada** (requiere autorización del creador porque toca la interfaz): mostrar
"Built with Llama" en la pantalla "Sobre esta versión de prueba". Mientras tanto, queda indicado en `README.md`.

## 2. Plataforma y servicios

| Componente | Proveedor | Uso en AURA | Condiciones | Estado |
|---|---|---|---|---|
| Cloudflare Workers, Workers AI, Workers Assets, Workers Builds | Cloudflare, Inc. | Alojamiento, ejecución de modelos y despliegue | Términos de servicio de Cloudflare (es un servicio, no se distribuye código de Cloudflare con AURA) | Por verificar en https://www.cloudflare.com/terms/ |
| GitHub | GitHub, Inc. | Repositorio y propuestas de cambio | Términos de servicio de GitHub | Por verificar |

## 3. Dependencias de software

El archivo `package.json` declara una sola dependencia, de desarrollo. **No hay `package-lock.json`**, por lo que la
versión exacta instalada no queda fijada.

| Paquete | Versión declarada | Licencia | Uso | Estado |
|---|---|---|---|---|
| `wrangler` | `^4.0.0` | `MIT OR Apache-2.0` | Herramienta de despliegue y desarrollo (no se distribuye con AURA) | Verificado en el registro npm (versión 4.158.0 consultada el 2026-11-08) |
| `playwright` | no declarada | `Apache-2.0` | Solo para regenerar íconos con `scripts/make-icons.mjs`; no es dependencia del proyecto | Verificado en el registro npm (versión 1.65.0 consultada el 2026-11-08) |
| Node.js (`node:test`, `node:fs`) | no declarada | Licencia de Node.js (MIT) | Pruebas y scripts de desarrollo | Por verificar |

Las dependencias de `wrangler` no se listan una a una porque no forman parte de AURA ni se distribuyen con ella.

## 4. Componentes de interfaz y estándares

- La interfaz está escrita con HTML, CSS y JavaScript estándar, **sin bibliotecas ni frameworks de terceros y sin CDN**.
- Usa APIs estándar de los navegadores: Canvas 2D, Web Audio, Web Speech API (síntesis y reconocimiento), Screen Wake
  Lock y Fullscreen. Son implementadas por el navegador de cada persona; AURA no las redistribuye. En Chrome, el
  reconocimiento de voz puede procesar el audio en servidores de Google, bajo los términos de Google (ver `README.md`).
- **Tipografías:** se usa la pila de fuentes del sistema (`system-ui`, `Segoe UI`, `Roboto`, etc.); **no se incluye ningún
  archivo de fuente**.

## 5. Recursos gráficos o audiovisuales

- El **átomo de luz** (`public/atom.js`) y los **íconos** (`public/*.svg`, `public/*.png`) son de elaboración propia: se
  dibujan por código y se generan con `scripts/make-icons.mjs`.
- No se incluyen imágenes, pictogramas, sonidos ni videos de terceros.
- Si en el futuro se agregan pictogramas (por ejemplo, de ARASAAC), debe verificarse y documentarse su licencia aquí.

## 6. Datos de interés público

El prompt de sistema y la documentación mencionan números de ayuda de Chile (133, 131, *4141, 1515) y a organismos
públicos. Son información pública de referencia; deben verificarse antes de cualquier uso real.
