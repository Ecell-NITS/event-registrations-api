/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import sendEmail from '../utils/sendEmail';

const prisma = new PrismaClient();

export const getTreasureApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.treasureApplication.findMany();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
};

export const createTreasureApplication = async (req: Request, res: Response) => {
  const { email, name, phone, college, ideaBrief, teamName } = req.body;

  try {
    // Prevent duplicate submissions
    const existing = await prisma.treasureApplication.findFirst({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already applied.' });
    }

    const newApp = await prisma.treasureApplication.create({
      data: { email, name, phone, college, ideaBrief, teamName },
    });

    const subject = 'Treasure Hunt Application';
    const html = `
      <h3>Thank you for applying for the Treasure Hunt event!</h3>
      <p>We’ve received your application and will contact you soon with further details.</p>
      <p>Meanwhile, join our WhatsApp group to stay updated:</p>
      <a href="YOUR_WHATSAPP_GROUP_LINK_HERE"><b>Join WhatsApp Group</b></a>
      <p>Best of luck,<br/>Empresario Team</p>
    `;

    await sendEmail(email, subject, 'Your Treasure Hunt application has been received.', undefined);

    res.status(200).json({ message: 'Application submitted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const checkTreasureApplication = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const existing = await prisma.treasureApplication.findFirst({
      where: { email },
    });
    res.json(existing);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking application.' });
  }
};

export const deleteTreasureApplication = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const deleted = await prisma.treasureApplication.delete({
      where: { email },
    });

    await sendEmail(
      email,
      'Application Deleted',
      'Your Treasure Hunt application has been deleted. If this wasn’t you, please contact us immediately.',
      undefined,
    );

    res.json({ message: 'Application deleted successfully.', deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete application.' });
  }
};
