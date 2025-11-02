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

// Fetch all Adovation applications
export const getAdovationApplications = async (req: Request, res: Response) => {
  try {
    const applications = await prisma.adovation.findMany();
    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch applications.' });
  }
};

// Create a new Adovation application
export const createAdovationApplication = async (req: Request, res: Response) => {
  const {
    teamName,
    teamLeaderName,
    teamLeaderEmail,
    teamLeaderPhone,
    teamLeaderScholarId,
    collegeType,
    collegeName,
    department,
    year,
    teamMembers,
  } = req.body;

  try {
    // Validate required fields
    if (!teamName || !teamLeaderName || !teamLeaderEmail || !teamLeaderPhone) {
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

    // Team size validation (3-5 members including leader)
    if (!teamMembers || teamMembers.length < 2 || teamMembers.length > 4) {
      return res.status(400).json({ message: 'Team must have 3-5 members (including leader).' });
    }

    // Validate team members
    for (const member of teamMembers) {
      if (!member.name || !member.phone) {
        return res.status(400).json({ message: 'All team members must have name and phone.' });
      }
      if (collegeType === 'nit_silchar' && !member.scholarId) {
        return res
          .status(400)
          .json({ message: 'Scholar ID is required for all NIT Silchar team members.' });
      }
    }

    // Prevent duplicate submissions
    const existing = await prisma.adovation.findFirst({
      where: { teamLeaderEmail },
    });

    if (existing) {
      return res.status(400).json({ message: 'You have already registered for this event.' });
    }

    // Check if any team member (including leader) is already registered for this event
    const allMembers = [
      { name: teamLeaderName, phone: teamLeaderPhone, email: teamLeaderEmail },
      ...teamMembers.map((member: TeamMember) => ({
        name: member.name,
        phone: member.phone,
        email: member.email || null,
      })),
    ];

    for (const member of allMembers) {
      const existingMember = await prisma.adovationMembers.findFirst({
        where: {
          OR: [
            { memberPhone: member.phone, memberName: member.name },
            { memberPhone: member.phone },
            { memberName: member.name, memberPhone: member.phone },
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
    const newApp = await prisma.adovation.create({
      data: {
        teamName,
        teamLeaderName,
        teamLeaderEmail,
        teamLeaderPhone,
        teamLeaderScholarId: collegeType === 'nit_silchar' ? teamLeaderScholarId : null,
        collegeType,
        collegeName: collegeType === 'other' ? collegeName : null,
        department,
        year,
        teamMembers: teamMembers.map((member: TeamMember) => ({
          name: member.name,
          phone: member.phone,
          scholarId: collegeType === 'nit_silchar' ? member.scholarId : null,
        })),
      },
    });

    if (newApp) {
      // Store all team members in the AdovationMembers collection
      const memberRecords = allMembers.map(member => ({
        memberName: member.name,
        memberEmail: member.email,
        memberPhone: member.phone,
        teamName: teamName,
      }));

      await prisma.adovationMembers.createMany({
        data: memberRecords,
      });

      const subject = 'Adovation Registration Successful';
      const text = `
      <h3>Thank you for registering for Adovation!</h3>
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
export const checkAdovationApplication = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const app = await prisma.adovation.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error checking application.' });
  }
};

// Get a single application by email
export const getSingleAdovationApplication = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const app = await prisma.adovation.findFirst({
      where: { teamLeaderEmail: email },
    });
    res.json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching application.' });
  }
};
