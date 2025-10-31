/* eslint-disable no-console */
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const createAdovationApplication = async (req: Request, res: Response) => {
  const { teamName, college, leader, members } = req.body;

  try {
    const existing = await prisma.adovationLeader.findUnique({
      where: { email: leader.email },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already submitted an application.' });
    }

    const newApp = await prisma.adovation.create({
      data: {
        teamName,
        college,

        leader: {
          create: {
            fullName: leader.fullName,
            email: leader.email,
            contact: leader.contact,
            scholarId: leader.scholarId,
          },
        },

        members: {
          create: members.map((m: any) => ({
            fullName: m.fullName,
            email: m.email,
            contact: m.contact,
            scholarId: m.scholarId,
          })),
        },
      },
      include: {
        leader: true,
        members: true,
      },
    });

    return res.status(200).json({
      message: 'Registration successful!',
      application: newApp,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Something went wrong.' });
  }
};

export const getAdovationApplications = async (req: Request, res: Response) => {
  const apps = await prisma.adovation.findMany({
    include: { leader: true, members: true },
  });

  res.json(apps);
};

export const checkAdovationApplication = async (req: Request, res: Response) => {
  const { email } = req.body;

  const leader = await prisma.adovationLeader.findUnique({
    where: { email },
  });

  res.json(leader ? true : false);
};

export const deleteAdovationApplication = async (req: Request, res: Response) => {
  const { leaderEmail } = req.body;

  const leader = await prisma.adovationLeader.findUnique({
    where: { email: leaderEmail },
  });

  if (!leader) {
    return res.status(404).json({ message: 'No application found.' });
  }

  await prisma.adovation.delete({
    where: { id: leader.adovationId },
  });

  res.json({ message: 'Deleted successfully.' });
};
