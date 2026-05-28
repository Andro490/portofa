import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/crypto';

const prisma = new PrismaClient();

interface PaymentCredentials {
  [key: string]: string;
}

export const savePaymentSettings = async (req: Request, res: Response) => {
  try {
    const { provider, isActive, credentials } = req.body;

    if (!provider || typeof isActive !== 'boolean' || !credentials) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Encrypt the credentials before saving
    const encryptedCredentials = encrypt(JSON.stringify(credentials));

    // If making this provider active, optionally deactivate others if only one can be active
    if (isActive) {
      await prisma.paymentGateway.updateMany({
        where: { isActive: true, provider: { not: provider } },
        data: { isActive: false },
      });
    }

    const gateway = await prisma.paymentGateway.upsert({
      where: { provider },
      update: {
        isActive,
        credentials: encryptedCredentials,
      },
      create: {
        provider,
        isActive,
        credentials: encryptedCredentials,
      },
    });

    res.status(200).json({ message: 'Payment settings saved successfully', gateway: { ...gateway, credentials: '[ENCRYPTED]' } });
  } catch (error) {
    console.error('Error saving payment settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPaymentSettings = async (req: Request, res: Response) => {
  try {
    const gateways = await prisma.paymentGateway.findMany();

    const decryptedGateways = gateways.map((gw) => {
      let decryptedCreds: PaymentCredentials = {};
      try {
        if (typeof gw.credentials === 'string') {
          decryptedCreds = JSON.parse(decrypt(gw.credentials));
        }
      } catch (err) {
        console.error(`Failed to decrypt credentials for provider ${gw.provider}`);
      }

      return {
        ...gw,
        credentials: decryptedCreds,
      };
    });

    res.status(200).json(decryptedGateways);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const handlePurchase = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body;
    // Assuming req.user exists from authMiddleware
    const userId = (req as any).user?.id;

    if (!courseId || !userId) {
      return res.status(400).json({ message: 'courseId and user are required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Find the active payment gateway
    const activeGateway = await prisma.paymentGateway.findFirst({
      where: { isActive: true },
    });

    if (!activeGateway) {
      return res.status(400).json({ message: 'No active payment gateway found' });
    }

    let credentials: PaymentCredentials = {};
    try {
      if (typeof activeGateway.credentials === 'string') {
        credentials = JSON.parse(decrypt(activeGateway.credentials));
      }
    } catch (err) {
      console.error('Decryption failed during purchase');
      return res.status(500).json({ message: 'Error decrypting payment credentials' });
    }

    // Generate a unique transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Handle payment logic based on provider
    let paymentResponse;
    switch (activeGateway.provider) {
      case 'FAWRY':
        const { merchantCode, securityKey } = credentials;
        // FAWRY specific logic using merchantCode and securityKey
        console.log(`Processing FAWRY payment for course ${course.title} with merchant ${merchantCode}`);
        paymentResponse = {
          provider: 'FAWRY',
          transactionId,
          referenceNumber: `FAWRY_${Math.floor(Math.random() * 1000000000)}`, // Fake ref
          status: 'PENDING_PAYMENT',
        };
        break;

      case 'STRIPE':
        const { publishableKey, secretKey } = credentials;
        // STRIPE specific logic
        console.log(`Processing STRIPE payment for course ${course.title} with secret ${secretKey?.substring(0, 5)}...`);
        paymentResponse = {
          provider: 'STRIPE',
          transactionId,
          clientSecret: `pi_${Math.random().toString(36).substring(7)}_secret_${Math.random().toString(36).substring(7)}`, // Fake secret
          status: 'REQUIRES_PAYMENT_METHOD',
        };
        break;

      default:
        return res.status(400).json({ message: `Unsupported provider: ${activeGateway.provider}` });
    }

    // Record the payment in DB
    const paymentRecord = await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        status: 'PENDING',
        transactionId,
      },
    });

    res.status(200).json({
      message: 'Purchase initialized',
      payment: paymentRecord,
      gatewayResponse: paymentResponse,
    });
  } catch (error) {
    console.error('Error handling purchase:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
