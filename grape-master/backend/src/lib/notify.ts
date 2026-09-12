import { prisma } from '../config/prisma';
import { sendNotification } from './socket';

export async function createAndSendNotification({
  userId,
  title,
  message,
  type,
  data,
  tx
}: {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: any;
  tx?: any;
}) {
  const db = tx || prisma;
  const notification = await db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      data: data || {}
    }
  });

  // Emit in real-time
  await sendNotification(userId, title, message, notification);
  return notification;
}
