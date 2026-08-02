import app from './app';
import { connectDB } from './infrastructure/database/connection';

const PORT = process.env.PORT ?? 4000;

export const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  void startServer();
}
