import { unlockWorker } from './unlockWorker.js';
import eventCleanupWorker from './eventCleanupWorker.js';

// Start the workers
console.log('🔄 Starting unlock worker...'); 
console.log('🔄 Starting event cleanup worker...'); 

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 Shutting down workers...');
    await Promise.all([
        unlockWorker.close(),
        eventCleanupWorker.close()
    ]);
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📴 Shutting down workers...');
    await Promise.all([
        unlockWorker.close(),
        eventCleanupWorker.close()
    ]);
    process.exit(0);
});

export { unlockWorker, eventCleanupWorker };