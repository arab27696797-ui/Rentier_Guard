/**
 * Re-export logger for backward compatibility
 */
export { logger, createModuleLogger, createUserLogger } from './utils/logger';
export type { Logger } from './utils/logger';
```

---

## Слой `src/services/` — использует `pg` (не установлен)

Эти 6 файлов (`src/services/*.ts`) + `src/commands/index.ts` + `src/cron/index.ts` — это альтернативный слой на чистом `pg`, который **не используется** из `src/index.ts`. Но `tsc` всё равно попытается их скомпилировать и упадёт, потому что `pg` не в зависимостях.

Самое простое решение — исключить их из компиляции. Но проще **добавить `pg` как dev-зависимость для типов**.

### Правка: `package.json`

В секцию `devDependencies` добавь:
```
"@types/pg": "^8.10.9"
```

А в секцию `dependencies` добавь:
```
"pg": "^8.12.0"
