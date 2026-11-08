# Análisis de licencia de AURA (para decisión del creador)

> **No se cambió ni se agregó ninguna licencia.** Este documento compara opciones y presenta una recomendación para que
> el creador decida. No es asesoría legal: antes de publicar una licencia conviene que la revise un abogado.

## 1. Estado actual

- **No existe archivo `LICENSE`** en el repositorio y GitHub no detecta ninguna licencia.
- El repositorio es **público**. Sin licencia, la ley de derechos de autor reserva todos los derechos al titular: otras
  personas pueden ver y bifurcar el repositorio (por los términos de GitHub), pero **no tienen permiso expreso para usar,
  modificar ni redistribuir el código**. Esto contradice el objetivo de que AURA sea gratuita y reutilizable por la
  comunidad: hace falta publicar una licencia.
- Tampoco hay avisos de autoría en los archivos (hasta esta propuesta). `package.json` no tiene campos `author` ni `license`.

## 2. Quién puede otorgar la licencia

Solo el titular de los derechos sobre cada parte. A este análisis le importan dos puntos:

1. **El creador** puede licenciar lo que le pertenece: la concepción, la especificación, las decisiones de diseño y los
   aportes humanos documentados.
2. **El código fue redactado con asistencia de IA** (ver `AUTHORSHIP.md`, sección 10). Si la ley no reconoce derechos de
   autor sobre texto o código generado sin aporte creativo humano suficiente, esas partes podrían no ser protegibles, y
   ninguna licencia las "cerraría". Sigue siendo útil licenciar todo el repositorio, pero esto debe aclararse con un
   abogado. Los términos de uso de la herramienta de IA también deben revisarse (por ejemplo, sobre la propiedad de las salidas).
3. **Terceros** conservan sus licencias (`THIRD_PARTY_NOTICES.md`). La licencia de AURA no las cambia.

## 3. Lo que se busca

AURA debe poder seguir siendo **gratuita, utilizable y modificable por la comunidad**, manteniendo los **avisos de autoría
y el reconocimiento** del creador, y evitando que alguien la tome, la cierre o la presente como propia.

**Sobre "que nadie pueda monetizar":** ninguna licencia de código abierto convencional (MIT, GPL, AGPL ni las aprobadas
por la OSI) puede prohibir el uso comercial: la definición de código abierto lo exige. Existen licencias que **sí lo
prohíben**, pero son "de código disponible", **no** de código abierto (ver sección 6). Esa es la decisión de fondo.

## 4. Comparación de las tres opciones pedidas

| Aspecto | MIT | GPL-3.0 | AGPL-3.0 |
|---|---|---|---|
| Tipo | Permisiva | Copyleft fuerte | Copyleft fuerte con cláusula de red |
| Uso gratuito, modificación y redistribución | Sí | Sí | Sí |
| Uso comercial | Permitido | Permitido | Permitido |
| Exige conservar aviso de copyright y licencia | Sí | Sí | Sí |
| ¿Pueden cerrar el código de una versión modificada? | **Sí**: pueden volverla privativa y vender | **No** si la distribuyen: deben compartir el código bajo GPL | **No**, ni siquiera ofreciéndola como servicio web |
| ¿Cubre el uso como servicio en red (SaaS)? | No aplica | **No**: quien ofrece una versión modificada como servicio sin distribuirla no está obligado a compartir | **Sí** (sección 13): deben ofrecer el código fuente a los usuarios del servicio |
| Concesión de patentes | No explícita | Sí | Sí |
| Reconocimiento del autor | Aviso mínimo | Avisos y condiciones | Avisos; además admite términos adicionales de atribución (sección 7 de la licencia) |
| Facilidad de adopción por empresas | Muy alta | Media | Más baja: muchas empresas evitan AGPL |
| Riesgo de apropiación cerrada | **Alto** | Medio (por el servicio en red) | **Bajo** |

## 5. Compatibilidad

- **Dependencias.** `wrangler` (`MIT OR Apache-2.0`) y `playwright` (`Apache-2.0`) son herramientas de desarrollo que no
  se distribuyen con AURA. Apache-2.0 es compatible con GPL-3.0 y AGPL-3.0. No hay conflicto con ninguna de las tres opciones.
- **Interfaz.** No usa bibliotecas de terceros: no hay conflicto.
- **Llama.** La licencia de Llama es un acuerdo contractual sobre los modelos y **no es una licencia de código abierto**.
  AURA no incluye los pesos: los usa como servicio. Por eso no choca con MIT, GPL ni AGPL. **Condición práctica:** no
  empaquetar nunca los pesos de Llama dentro de una distribución de AURA bajo GPL/AGPL, porque cada pieza debe cumplir su
  propia licencia. Quien despliegue AURA por su cuenta con Llama debe aceptar la licencia de Meta, y se recomienda
  mostrar "Built with Llama" (ver `THIRD_PARTY_NOTICES.md`).
- **Servicios (Cloudflare, voces).** Se consumen por API; su uso se rige por sus propios términos.

## 6. Alternativas que prohíben el uso comercial (no son código abierto convencional)

Si la prioridad absoluta es impedir que alguien lucre con AURA:

- **PolyForm Noncommercial 1.0.0:** código disponible; permite usos no comerciales, incluidos de organizaciones sin fines
  de lucro, educativas y gubernamentales.
- **CC BY-NC-SA 4.0:** prohíbe uso comercial y exige atribución; Creative Commons **no la recomienda para software**.

**Advertencias:** no deben presentarse como "open source"; reducen la adopción y las contribuciones de la comunidad;
puede ser difícil decidir si una institución califica como "no comercial"; y no impiden por sí solas que alguien copie
el código (hay que hacerlas valer). Como titular, el creador siempre puede **otorgar licencias comerciales aparte**
(doble licencia), siempre que posea o tenga cedidos los derechos de lo aportado por otros (ver `CONTRIBUTING.md`).

## 7. Consecuencias para usuarios y colaboradores

- **Usuarios y familias:** con cualquiera de las tres pueden usar AURA gratis. Una familia que solo usa el servicio no se
  ve afectada por el copyleft.
- **Colaboradores:** al contribuir bajo MIT/GPL/AGPL aceptan que su aporte tenga esa licencia. Si más adelante se quisiera
  cambiar de licencia o ofrecer doble licencia, se necesitará el consentimiento de cada colaborador, salvo que hayan
  firmado antes una cesión o un acuerdo de contribución (CLA) o una declaración de origen (DCO).
- **Instituciones y organizaciones sociales:** AGPL les permite usarla y adaptarla; quien la modifique y ofrezca como
  servicio debe publicar sus cambios, lo que beneficia a la comunidad.
- **Empresas:** con MIT pueden cerrar y vender una versión modificada; con AGPL no pueden cerrarla y muchas la evitarán;
  con una licencia no comercial no pueden usarla sin un acuerdo contigo.

## 8. Recomendación

**Opción recomendada: AGPL-3.0-or-later, con términos adicionales de atribución (sección 7 de la AGPL).**

Razones:
1. Mantiene AURA **abierta, gratuita y modificable** para familias, cuidadores y comunidades.
2. Es la única de las tres que **impide que se cierre una versión modificada**, incluso ofrecida como servicio web, que es
   exactamente cómo se usa AURA.
3. La sección 7 de la licencia permite exigir razonablemente que se **conserven los avisos de copyright y las atribuciones
   de autor**, y que se **prohíba presentar el origen de forma engañosa** (decir que otra persona la creó) y se marque
   claramente que una versión modificada es distinta de la original. Esto responde de forma directa a "que nadie diga
   que lo hizo él".

**Límite que debes conocer:** AGPL **no impide cobrar**. Alguien podría ofrecer AURA o soporte como servicio de pago,
siempre que publique su código y conserve los avisos. Si eso es inaceptable, la alternativa coherente es una licencia no
comercial (sección 6), asumiendo sus costos en adopción y en el uso de la palabra "código abierto".

**Cuándo elegiría otra:** MIT, solo si prefieres máxima difusión aunque otros puedan cerrarla. GPL-3.0 no aporta ventaja
sobre AGPL en un software que se usa como servicio en red. Licencia no comercial, si impedir el lucro pesa más que la
apertura.

## 9. Pasos para aplicar la decisión (no ejecutados; requieren tu autorización)

1. Elegir la licencia y revisarla con un abogado (incluida la redacción de los términos adicionales y cómo declarar la
   asistencia de IA).
2. Agregar `LICENSE` con el texto oficial completo y, si se eligen términos adicionales, un `NOTICE`.
3. Completar `license` y `author` en `package.json` y en `CITATION.cff`.
4. Agregar encabezados de copyright/SPDX a los archivos fuente (cambio menor, pero toca archivos de código).
5. Definir cómo se aceptan contribuciones (DCO o CLA) en `CONTRIBUTING.md`.
6. Crear una etiqueta de versión (por ejemplo `v0.1.0`) y regenerar la huella de integridad.
