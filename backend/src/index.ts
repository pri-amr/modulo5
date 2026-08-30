import "dotenv/config";

import app from "./app";
import { connectDB } from "./infrastructure/database/connection";

const PORT = process.env.PORT ?? 4000;

export const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start the server:", error);
        process.exit(1);
    }
};

/* istanbul ignore next -- guardia de entry point: solo es `true` cuando el archivo corre como
   proceso principal (`node dist/index.js`); bajo test siempre se importa como módulo, así que la
   rama `true` no es alcanzable sin spawnear un proceso real (lento y no determinístico aquí). */
if (require.main === module) {
    void startServer();
}
