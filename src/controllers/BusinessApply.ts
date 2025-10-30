/* eslint-disable prettier/prettier */
/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import sendEmail from '../utils/sendEmail';

const prisma = new PrismaClient();

// Fetch all event applications
export const getEventApplications = async (req: Request, res: Response) => {
  const applications = await prisma.eventApplication.findMany();
  res.json(applications);
};

// Create a new event application
export const createEventApplication = async (req: Request, res: Response) => {
  const { name, email, phone, college, ideaBrief, teamName } = req.body;

  try {
    // Prevent duplicate submissions
    const existing = await prisma.eventApplication.findFirst({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already applied.' });
    }

    // Create a new application entry
    const newApp = await prisma.eventApplication.create({
      data: {
        name,
        email,
        phone,
        college,
        ideaBrief,
        teamName,
      },
    });

    if (newApp) {
      const subject = 'Business Hackathon Application';
      const text = `
      <h3>Thank you for applying for the Business Hackathon!</h3>
      <p>We’ve received your application and will get back to you soon.</p>
      <p>Meanwhile, you can join our WhatsApp group for updates:
      <a href="https://chat.whatsapp.com/YOUR_GROUP_LINK_HERE">Join Group</a></p>
      <p><strong>Best of luck,</strong><br/>E-Cell NIT JH Team</p>
      `;

      sendEmail(email, subject, text, undefined);

      res.status(200).json({ message: 'Application submitted successfully!' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Check if a user has already applied
export const checkEventApplication = async (req: Request, res: Response) => {
  const { email } = req.body;
  const app = await prisma.eventApplication.findFirst({
    where: { email },
  });
  res.json(app);
};

// Get a single application by email
export const getSingleEventApplication = async (req: Request, res: Response) => {
  const { email } = req.body;
  const app = await prisma.eventApplication.findUnique({
    where: { email },
  });
  res.json(app);
};

// Delete an application
export const deleteEventApplication = async (req: Request, res: Response) => {
  const { email } = req.body;
  const deleted = await prisma.eventApplication.delete({
    where: { email },
  });

  await sendEmail(
    email,
    'Application Deleted',
    'Your hackathon application has been deleted. If this wasn’t you, please contact us immediately.',
    undefined,
  );

  res.json({ message: 'Application deleted successfully.', deleted });
};
