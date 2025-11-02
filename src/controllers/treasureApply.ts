/* eslint-disable no-console */
import { Request, Response } from 'express';
import prisma from '../../prisma/prismaClient';
import sendEmail from '../utils/sendEmail';

interface TeamMember {
  name: string;
  phone: string;
  email?: string;
  scholarId?: string;
}

// Fetch all treasure hunt applications
export const getTreasureHuntApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.treasureHunt.findMany();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
};

// Create a new treasure hunt application
export const createTreasureHuntApplication = async (req: Request, res: Response) => {
  const {
    teamName,
    teamLeaderName,
    teamLeaderEmail,
    teamLeaderPhone,
    teamLeaderScholarId,
    teamViceCaptainName,
    teamViceCaptainPhone,
    teamViceCaptainScholarId,
    collegeType,
    collegeName,
    department,
    year,
    teamMembers,
  } = req.body;

  try {
    // Validate required fields
    if (
      !teamName ||
      !teamLeaderName ||
      !teamLeaderEmail ||
      !teamLeaderPhone ||
      !teamViceCaptainName ||
      !teamViceCaptainPhone
    ) {
      return res.status(400).json({ message: 'Required fields are missing.' });
    }

    // Validate college information
    if (collegeType === 'other' && !collegeName) {
      return res.status(400).json({ message: 'College name is required for external colleges.' });
    }

    if (collegeType === 'nit_silchar' && !teamLeaderScholarId) {
      return res.status(400).json({ message: 'Scholar ID is required for NIT Silchar students.' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teamLeaderEmail)) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }

    // Phone validation
    if (teamLeaderPhone.length !== 10) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit phone number.' });
    }

    // Team size validation (2-4 members including leader)
    if (!teamMembers || teamMembers.length < 1 || teamMembers.length > 3) {
      return res.status(400).json({ message: 'Team must have 2-4 members (including leader).' });
    }

    // Validate team members
    for (const member of teamMembers) {
      if (!member.name) {
        return res.status(400).json({ message: 'All team members must have a name.' });
      }
      if (collegeType === 'nit_silchar' && !member.scholarId) {
        return res
          .status(400)
          .json({ message: 'Scholar ID is required for all NIT Silchar team members.' });
      }
    }

    // Prevent duplicate submissions
    const existing = await prisma.treasureHunt.findFirst({
      where: { teamLeaderEmail },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already registered for this event.' });
    }

    // Check if any team member (including leader and vice captain) is already registered for this event
    const allMembers = [
      { name: teamLeaderName, phone: teamLeaderPhone, email: teamLeaderEmail },
      { name: teamViceCaptainName, phone: teamViceCaptainPhone, email: null },
      ...teamMembers.map((member: TeamMember) => ({
        name: member.name,
        phone: null, // Treasure hunt members don't have phone in the original schema
        email: null,
      })),
    ];

    for (const member of allMembers) {
      const existingMember = await prisma.treasureHuntMembers.findFirst({
        where: {
          OR: [
            { memberName: member.name, memberPhone: member.phone },
            { memberName: member.name },
            ...(member.phone ? [{ memberPhone: member.phone }] : []),
          ],
        },
      });

      if (existingMember) {
        return res.status(400).json({
          message: `Team member "${member.name}" is already registered with team "${existingMember.teamName}" for this event.`,
        });
      }
    }

    // Create a new application entry
    const newApp = await prisma.treasureHunt.create({
      data: {
        teamName,
        teamLeaderName,
        teamLeaderEmail,
        teamLeaderPhone,
        teamLeaderScholarId: collegeType === 'nit_silchar' ? teamLeaderScholarId : null,
        teamViceCaptainName,
        teamViceCaptainPhone,
        teamViceCaptainScholarId: collegeType === 'nit_silchar' ? teamViceCaptainScholarId : null,
        collegeType,
        collegeName: collegeType === 'other' ? collegeName : null,
        department,
        year,
        teamMembers: teamMembers.map((member: TeamMember) => ({
          name: member.name,
          scholarId: collegeType === 'nit_silchar' ? member.scholarId : null,
        })),
      },
    });

    if (newApp) {
      // Store all team members in the TreasureHuntMembers collection
      const membersToStore = [
        {
          memberName: teamLeaderName,
          memberEmail: teamLeaderEmail,
          memberPhone: teamLeaderPhone,
          teamName,
        },
        {
          memberName: teamViceCaptainName,
          memberEmail: null,
          memberPhone: teamViceCaptainPhone,
          teamName,
        },
        ...teamMembers.map((member: TeamMember) => ({
          memberName: member.name,
          memberEmail: null,
          memberPhone: null,
          teamName,
        })),
      ];

      await prisma.treasureHuntMembers.createMany({
        data: membersToStore,
      });

      const subject = 'Treasure Hunt Registration Successful';
      const text = `
      <h3>Thank you for registering for the Treasure Hunt!</h3>
      <p>Your team "${teamName}" has been successfully registered.</p>
      <p>We've received your registration and will get back to you soon with further details.</p>
      <p>Meanwhile, you can join our WhatsApp group for updates:
      <a href="https://chat.whatsapp.com/YOUR_GROUP_LINK_HERE">Join Group</a></p>
      <p><strong>Best of luck,</strong><br/>E-Cell NIT Silchar Team</p>
      `;

      sendEmail(teamLeaderEmail, subject, text, undefined);

      res.status(200).json({
        message: 'Registration submitted successfully!',
        registration: newApp,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong!' });
  }
};

// Check if a user has already applied
export const checkTreasureHuntApplication = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const app = await prisma.treasureHunt.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking application.' });
  }
};

// Get a single application by email
export const getSingleTreasureHuntApplication = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const app = await prisma.treasureHunt.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching application.' });
  }
};

// Legacy functions for backward compatibility
export const getTreasureApplications = getTreasureHuntApplications;
export const createTreasureApplication = createTreasureHuntApplication;
export const checkTreasureApplication = checkTreasureHuntApplication;
