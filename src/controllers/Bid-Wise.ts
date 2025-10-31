/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import sendEmail from '../utils/sendEmail';

const prisma = new PrismaClient();

export const getBidWiseTeams = async (req: Request, res: Response) => {
  try {
    const teams = await prisma.bidWise.findMany();
    res.json(teams);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const createBidWise = async (req: Request, res: Response) => {
  try {
    const { eventId, teamName, college, leader, members } = req.body;

    const exists = await prisma.bidWise.findFirst({
      where: { leader: { email: leader.email } },
    });

    if (exists) {
      return res.status(400).json({ message: 'You have already registered for this event.' });
    }

    const requiredLeaderFields = ['fullName', 'email', 'contact', 'scholarId'];
    for (const field of requiredLeaderFields) {
      if (!leader[field]) {
        return res.status(400).json({ message: `Leader ${field} is required.` });
      }
    }

    if (!members || members.length < 2 || members.length > 4) {
      return res.status(400).json({ message: 'Team must have 2–4 members.' });
    }

    members.forEach((m: any, i: number) => {
      if (!m.fullName || !m.email || !m.scholarId) {
        throw new Error(`Member ${i + 1} is missing fields.`);
      }
    });

    const registration = await prisma.bidWise.create({
      data: {
        eventId,
        teamName,
        college,
        leader: {
          fullName: leader.fullName,
          email: leader.email,
          contact: leader.contact,
          scholarId: leader.scholarId,
        },
        members: members.map((m: any) => ({
          fullName: m.fullName,
          email: m.email,
          scholarId: m.scholarId,
        })),
      },
    });

    const subject = 'BidWise Registration Successful';
    const text = `
      <h3>Your Bid-Wise Team Registration is Successful!</h3>
      <p>Your team "${teamName}" has been registered.</p>
      <p>We will contact you with updates soon.</p>
      <p><strong>Good luck!</strong><br />E-Cell NIT JH Team</p>
    `;

    sendEmail(leader.email, subject, text, undefined);

    res.status(200).json({
      message: 'Registration submitted successfully!',
      registration,
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Something went wrong!' });
  }
};

export const checkBidWise = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const entry = await prisma.bidWise.findFirst({
      where: { leader: { email } },
    });

    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const getSingleBidWise = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const entry = await prisma.bidWise.findFirst({
      where: { leader: { email } },
    });

    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

export const deleteBidWise = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const deleted = await prisma.bidWise.deleteMany({
      where: { leader: { email } },
    });

    await sendEmail(
      email,
      'BidWise Registration Deleted',
      'Your BidWise registration has been deleted.',
      undefined,
    );

    res.json({ message: 'Registration deleted successfully.', deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};
