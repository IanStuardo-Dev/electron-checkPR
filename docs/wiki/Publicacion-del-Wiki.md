# Publicacion del Wiki

## Estado actual

El contenido del Wiki vive en `docs/wiki/` como fuente versionada dentro del repo principal.

Esto se hizo porque el wiki de GitHub del repositorio aun no tiene una primera pagina materializada, y GitHub no expone una API oficial para crearla programaticamente.

Mientras el wiki no tenga esa primera pagina inicial, la URL:

`https://github.com/IanStuardo-Dev/electron-checkPR/wiki`

redirige al repo principal y el remoto `.wiki.git` responde `Repository not found`.

## Como publicarlo cuando el wiki quede inicializado

1. Crear manualmente una primera pagina vacia o minima desde la UI de GitHub Wiki.
2. Clonar el repo del wiki:

```bash
git clone https://github.com/IanStuardo-Dev/electron-checkPR.wiki.git
```

3. Copiar el contenido de `docs/wiki/` al repo del wiki.
4. Confirmar que al menos existan:
   - `Home.md`
   - `_Sidebar.md`
5. Commit y push:

```bash
git add .
git commit -m "Seed project wiki"
git push origin master
```

## Recomendacion

Mantener `docs/wiki/` como source of truth aun despues de publicar el wiki ayuda a:

- versionar la documentacion junto con el codigo;
- revisar cambios de documentacion en PRs;
- evitar perder contexto si alguien edita el wiki manualmente;
- resincronizar rapidamente el wiki si GitHub cambia algo o se recrea.
