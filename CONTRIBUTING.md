# Cómo contribuir a AURA y cómo se reconoce cada aporte

AURA es un proyecto de finalidad social, de acceso gratuito. Toda ayuda es bienvenida, siempre que se respeten las
condiciones de licencia y el reconocimiento de las contribuciones originales.

## Política de reconocimiento

1. **Quienes contribuyan serán reconocidos** en el archivo [`AUTHORS`](AUTHORS), con su nombre, la fecha y una
   descripción de su aporte.
2. **Cada contribución debe quedar documentada** mediante una propuesta de cambios (pull request) con una descripción clara.
3. **No se elimina el reconocimiento del creador original** (Christopher Alain Ibacache Crisosto) en `COPYRIGHT`,
   `AUTHORS`, `AUTHORSHIP.md` ni en los demás avisos.
4. **No se atribuye al creador original el trabajo hecho exclusivamente por terceros**, ni a terceros el trabajo del creador.
5. **Se conserva el historial de versiones**: no se reescribe la historia de Git para cambiar fechas o autorías.
6. **Se conservan los avisos de copyright y las condiciones de licencia** en todas las copias y trabajos derivados.
7. **Cualquier cesión de derechos** (por ejemplo, un acuerdo con un colaborador) debe documentarse por escrito y guardarse
   junto con la documentación del proyecto, sin datos personales sensibles en el repositorio público.

## Licencia de las contribuciones

AURA se publica bajo la licencia **PolyForm Noncommercial 1.0.0** (ver [`LICENSE`](LICENSE) y
[`docs/LICENSE_ANALYSIS.md`](docs/LICENSE_ANALYSIS.md)). Al contribuir, quien aporta:

1. Declara que es autor de lo que aporta o tiene derecho a aportarlo.
2. Acepta que su aporte se distribuya bajo esa misma licencia.
3. **Para que el creador pueda otorgar licencias comerciales que incluyan tu aporte**, debe darse un consentimiento
   específico y por escrito (por ejemplo, en la propuesta de cambios). Sin él, el aporte queda solo bajo la licencia no
   comercial. El texto exacto de este acuerdo debe revisarlo un abogado antes de aceptar contribuciones externas.

## Si se usa asistencia de IA

Indícalo en la descripción de la propuesta de cambios (herramienta y alcance), como se hace en este proyecto
(ver `AUTHORSHIP.md`).

## Reglas de seguridad y privacidad

- **No subas datos personales de menores** (ni reales ni de conversaciones reales) a incidencias, propuestas o ejemplos.
- **No subas claves, tokens ni credenciales.**
- Los cambios al prompt de seguridad (`src/systemPrompt.js`) y a la red de riesgo (`src/index.js`) deben pasar por revisión
  profesional antes de usarse con personas reales.
