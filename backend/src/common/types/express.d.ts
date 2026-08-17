// Ambient — no necesita `import` en ningún consumidor: se aplica a todo el programa porque
// este archivo está cubierto por `include: ["src/**/*.ts"]` de tsconfig.json. Si ese `include`
// cambia (o se activa `isolatedModules`), `req.userId` deja de tipar sin ningún error de
// compilación visible hasta que se use en un sitio nuevo.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
