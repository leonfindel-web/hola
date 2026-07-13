# Cómo conectar el servidor MCP de Vimeo a Claude Code

Guía paso a paso para conectar Claude Code con tu cuenta de Vimeo.
Escrita para que la pueda seguir cualquier persona, sin conocimientos técnicos.

> **¿Qué es esto en una frase?**
> Un "servidor MCP" es un puente que le permite a Claude leer y modificar
> tu cuenta de Vimeo directamente (ver tus videos, escribir descripciones, etc.),
> siempre con tu permiso. Conectarlo es como darle una llave: tú apruebas
> el acceso una vez desde tu navegador y listo.

---

## Antes de empezar

Necesitas dos cosas:

1. **Claude Code ya instalado y funcionando** en tu computador (es donde escribes
   los comandos y conversas con Claude).
2. **Tu usuario y contraseña de Vimeo** a mano (el de la cuenta LEONFINDEL).

Vas a usar la **terminal**: es la ventana donde ya conversas con Claude Code.
No necesitas saber programar. Solo copiar, pegar y apretar Enter.

---

## Paso 1 — Agregar el servidor

Copia esta línea, pégala en la terminal y aprieta Enter:

```bash
claude mcp add --transport http vimeo https://mcp.vimeo.com/mcp
```

Esto **no** te conecta todavía. Solo le dice a Claude *dónde* está Vimeo.
Es como guardar un contacto en el teléfono antes de llamarlo.

Para confirmar que quedó guardado, pega esto:

```bash
claude mcp list
```

Deberías ver una línea que dice `vimeo` y, al lado, algo como
**`Needs authentication`** (necesita autenticación). Eso es normal y esperado:
significa "guardado, pero todavía falta que des permiso".

---

## Paso 2 — Dar permiso desde el navegador (autenticación)

Aquí le das la llave. Hay dos formas; usa la que te resulte más cómoda.

### Forma A — Desde el menú de Claude (la más simple)

1. En la terminal, escribe `/mcp` y aprieta Enter.
2. Aparece una lista. Elige **vimeo**.
3. Elige la opción **Authenticate** (autenticar).
4. Se abre tu **navegador** automáticamente.
5. Inicia sesión en Vimeo si te lo pide, y aprieta **Aprobar / Allow**.
6. El navegador te devuelve a una página de confirmación. Listo.

### Forma B — Si en el menú `/mcp` no aparece Vimeo

A veces, si agregaste el servidor con Claude ya abierto, no aparece en la lista
todavía. En ese caso:

1. Pídele a Claude directamente en el chat: **"autentícame el servidor de Vimeo"**.
2. Claude te va a entregar un **enlace largo** que empieza con
   `https://mcp.vimeo.com/oauth/authorize?...`
3. **Copia ese enlace y ábrelo en tu navegador.**
4. Inicia sesión en Vimeo y aprieta **Aprobar / Allow**.
5. Si el navegador muestra una página en blanco o un error de conexión al final
   (algo como *"no se puede acceder a localhost"*), **no te asustes, es normal**.
   Copia la dirección completa que quedó en la barra del navegador
   (empieza con `http://localhost:...`) y pégala en el chat de Claude.
   Con eso Claude termina de conectar.

---

## Paso 3 — Reiniciar Claude Code (importante)

Este es el paso que **más se olvida** y hace que parezca que "no funcionó".

Aunque hayas dado el permiso, Claude Code carga las herramientas de Vimeo
**solo al arrancar**. Si estaba abierto durante todo esto, todavía no las ve.

1. **Cierra Claude Code por completo.** No solo la conversación: cierra el
   programa entero (en la terminal puedes escribir `/quit`, o cerrar la ventana).
2. **Vuelve a abrirlo** en la misma carpeta del proyecto.

**Buena noticia:** NO tienes que volver a dar el permiso. La llave queda guardada.
Este reinicio es una sola vez.

---

## Paso 4 — Comprobar que quedó conectado

Pega esto en la terminal:

```bash
claude mcp list
```

Ahora, al lado de `vimeo`, debería decir **`✓ Connected`** (conectado) en vez de
"Needs authentication".

Como prueba final, pídele a Claude en el chat:

> "¿Puedes ver mi cuenta de Vimeo? Dime cuántos videos tengo."

Si te responde con datos reales de tu cuenta (nombre, cantidad de videos), **quedó
conectado correctamente.** 🎉

---

## Si algo sale mal

| Lo que ves | Qué significa | Qué hacer |
|---|---|---|
| `Needs authentication` | Falta dar el permiso | Repite el **Paso 2** |
| Diste el permiso pero Claude "no ve" Vimeo | Falta reiniciar | Haz el **Paso 3** (cerrar y abrir) |
| El navegador muestra error al final del permiso | Es normal en algunos casos | Copia la dirección `http://localhost:...` y pégala en el chat (Forma B, punto 5) |
| Vimeo no aparece en el menú `/mcp` | Se agregó con Claude ya abierto | Usa la **Forma B**, o reinicia y vuelve a entrar a `/mcp` |
| No sé si quedó guardado | — | Escribe `claude mcp list` para revisar el estado |

---

## Cómo desconectar (si alguna vez lo necesitas)

Para quitar la conexión, pega en la terminal:

```bash
claude mcp remove vimeo
```

---

## Nota sobre seguridad (importante para el proyecto)

Al dar el permiso, Vimeo pregunta por varios accesos. El que se otorga por
defecto incluye permiso para **modificar** tu cuenta (escribir descripciones,
crear álbumes, etc.), no solo leer.

Para este proyecto, **Vimeo es solo una fuente de la que leemos** información;
la fuente de verdad del catálogo es el Excel. Por eso, para el sistema automático
que corre solo (el que revisa el catálogo cada mes) **no se usa esta conexión**,
sino un acceso aparte de **solo lectura**. Esta conexión MCP es para trabajar
mano a mano con Claude de forma interactiva, no para el proceso automático.

Si tienes dudas sobre qué permisos otorgar, pregúntale a quien lleva la parte
técnica del proyecto antes de aprobar.

---

*Última actualización: julio 2026. Esta guía sirve también para conectar otros
servidores MCP a Claude Code: los pasos son los mismos, solo cambia el nombre
(`vimeo`) y la dirección del servidor.*
