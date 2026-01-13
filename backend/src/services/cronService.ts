import cron from 'node-cron';
import { Op } from 'sequelize';
import Story from '../models/Story';

class CronService {
  // Clean up expired stories every hour
  startStoryCleanup(): void {
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('Running story cleanup job...');
        
        const deleted = await Story.destroy({
          where: {
            expiresAt: {
              [Op.lt]: new Date(),
            },
          },
        });

        if (deleted > 0) {
          console.log(`Deleted ${deleted} expired stories`);
        }
      } catch (error) {
        console.error('Error cleaning up expired stories:', error);
      }
    });

    console.log('Story cleanup cron job started (runs every hour)');
  }

  // Start all cron jobs
  startAll(): void {
    this.startStoryCleanup();
  }
}

export default new CronService();
