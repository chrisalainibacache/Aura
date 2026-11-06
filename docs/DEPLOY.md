# Despliegue en Cloudflare

Configuración usada para el Worker `aura` (Workers Builds, conectado a GitHub):

| Campo | Valor |
|---|---|
| Repositorio | `chrisalainibacache/Aura` |
| Rama de producción | `main` |
| Comando de compilación | (ninguno) |
| Comando de implementación | `npx wrangler deploy` |
| Directorio raíz | `/` |

- Cada commit a `main` dispara una compilación y un despliegue.
- El nombre del Worker (`name` en `wrangler.jsonc`) debe ser `aura`, igual que en Cloudflare.
- El binding `AI` y las variables se declaran en `wrangler.jsonc`; no hay secretos.
- Para ver la aplicación hay que habilitar **workers.dev** en *Dominios y rutas*.
  Mientras esté habilitado, cualquiera con la URL consume el cupo de Workers AI.
- Si una compilación falla, revisar el registro en *Compilaciones → Ver compilación*.
