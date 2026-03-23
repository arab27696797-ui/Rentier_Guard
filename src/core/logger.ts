/**
 * Re-export logger for backward compatibility
 * Файлы в src/core/services/ и src/core/utils/ импортируют '../logger'
 */
export { logger, createModuleLogger, createUserLogger } from './utils/logger';
export type { Logger } from './utils/logger';
```

Без этого файла 5 файлов (`prisma.service.ts`, `user.service.ts`, `format.utils.ts`, `validation.utils.ts`, `date.utils.ts`) не найдут логгер.

---

## 2. Обновить `package.json`

Добавь `pg` и `@types/pg`, потому что слой `src/services/` и `src/cron/` их импортируют:

**Путь на GitHub:** `package.json` — в `dependencies` добавь строку:
```
"pg": "^8.12.0",
```

В `devDependencies` добавь строку:
```
"@types/pg": "^8.10.9",
