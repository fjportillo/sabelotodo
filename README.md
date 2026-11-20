# Sabelotodo · El quiz diario de cultura general

Web: https://fjportillo.github.io/sabelotodo/

Esta carpeta es la web publicada (GitHub Pages). **No se edita a mano**: se genera desde el motor común del repositorio
[`liantes-quiz`](https://github.com/fjportillo/liantes-quiz) con:

```
python3 build.py sabelotodo
```

Las fuentes de Sabelotodo están en `liantes-quiz/quizzes/sabelotodo/`: preguntas (`preguntas.csv`), traducciones (`i18n/`),
textos y diseño (`marca.py` → `gen_config.py` → `config.json`), logo e iconos, y la base de datos (`supabase.sql`, proyecto de Supabase propio).
