// import { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';
// import { encrypt, decrypt } from '../utils/crypto';

// const prisma = new PrismaClient();

// interface PaymentCredentials {
//   [key: string]: string;
// }

// export const savePaymentSettings = async (req: Request, res: Response) => {
//   try {
//     const { provider, isActive, credentials } = req.body;

//     if (!provider || typeof isActive !== 'boolean' || !credentials) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     // Encrypt the credentials before saving
//     const encryptedCredentials = encrypt(JSON.stringify(credentials));

//     // If making this provider active, optionally deactivate others if only one can be active
//     if (isActive) {
//       await prisma.paymentGateway.updateMany({
//         where: { isActive: true, provider: { not: provider } },
//         data: { isActive: false },
//       });
//     }

//     const gateway = await prisma.paymentGateway.upsert({
//       where: { provider },
//       update: {
//         isActive,
//         credentials: encryptedCredentials,
//       },
//       create: {
//         provider,
//         isActive,
//         credentials: encryptedCredentials,
//       },
//     });

//     res.status(200).json({ message: 'Payment settings saved successfully', gateway: { ...gateway, credentials: '[ENCRYPTED]' } });
//   } catch (error) {
//     console.error('Error saving payment settings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// export const getPaymentSettings = async (req: Request, res: Response) => {
//   try {
//     const gateways = await prisma.paymentGateway.findMany();

//     const decryptedGateways = gateways.map((gw) => {
//       let decryptedCreds: PaymentCredentials = {};
//       try {
//         if (typeof gw.credentials === 'string') {
//           decryptedCreds = JSON.parse(decrypt(gw.credentials));
//         }
//       } catch (err) {
//         console.error(`Failed to decrypt credentials for provider ${gw.provider}`);
//       }

//       return {
//         ...gw,
//         credentials: decryptedCreds,
//       };
//     });

//     res.status(200).json(decryptedGateways);
//   } catch (error) {
//     console.error('Error fetching payment settings:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// export const handlePurchase = async (req: Request, res: Response) => {
//   try {
//     const { courseId, userId: bodyUserId } = req.body;
//     // Assuming req.user exists from authMiddleware
//     const userId = bodyUserId || (req as any).user?.userId || (req as any).user?.id;

//     if (!courseId || !userId) {
//       return res.status(400).json({ message: 'courseId and user are required' });
//     }

//     const course = await prisma.course.findUnique({ where: { id: courseId } });
//     if (!course) {
//       return res.status(404).json({ message: 'Course not found' });
//     }

//     // Find the active payment gateway
//     const activeGateway = await prisma.paymentGateway.findFirst({
//       where: { isActive: true },
//     });

//     if (!activeGateway) {
//       return res.status(400).json({ message: 'No active payment gateway found' });
//     }

//     let credentials: PaymentCredentials = {};
//     try {
//       if (typeof activeGateway.credentials === 'string') {
//         credentials = JSON.parse(decrypt(activeGateway.credentials));
//       }
//     } catch (err) {
//       console.error('Decryption failed during purchase');
//       return res.status(500).json({ message: 'Error decrypting payment credentials' });
//     }

//     // Generate a unique transaction ID
//     const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

//     // Handle payment logic based on provider
//     let paymentResponse;
//     switch (activeGateway.provider) {
//       case 'FAWRY':
//         const { merchantCode, securityKey } = credentials;
//         // FAWRY specific logic using merchantCode and securityKey
//         console.log(`Processing FAWRY payment for course ${course.title} with merchant ${merchantCode}`);
//         paymentResponse = {
//           provider: 'FAWRY',
//           transactionId,
//           referenceNumber: `FAWRY_${Math.floor(Math.random() * 1000000000)}`, // Fake ref
//           status: 'PENDING_PAYMENT',
//         };
//         break;

//       case 'STRIPE':
//         const { publishableKey, secretKey } = credentials;
//         // STRIPE specific logic
//         console.log(`Processing STRIPE payment for course ${course.title} with secret ${secretKey?.substring(0, 5)}...`);
//         paymentResponse = {
//           provider: 'STRIPE',
//           transactionId,
//           clientSecret: `pi_${Math.random().toString(36).substring(7)}_secret_${Math.random().toString(36).substring(7)}`, // Fake secret
//           status: 'REQUIRES_PAYMENT_METHOD',
//         };
//         break;

//       default:
//         return res.status(400).json({ message: `Unsupported provider: ${activeGateway.provider}` });
//     }

//     // Record the payment in DB
//     const paymentRecord = await prisma.payment.create({
//       data: {
//         userId,
//         courseId,
//         amount: course.price,
//         status: 'PENDING',
//         transactionId,
//       },
//     });

//     res.status(200).json({
//       message: 'Purchase initialized',
//       payment: paymentRecord,
//       gatewayResponse: paymentResponse,
//     });
//   } catch (error) {
//     console.error('Error handling purchase:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };
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

    const encryptedCredentials = encrypt(JSON.stringify(credentials));

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
    const { courseId, userId: bodyUserId } = req.body;
    const userId = bodyUserId || (req as any).user?.userId || (req as any).user?.id;

    if (!courseId || !userId) {
      return res.status(400).json({ message: 'courseId and user are required' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

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

    const transactionId = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let referenceNumber = ''; // لتخزين رقم فوري المرجعي الفريد لحساب الطالب

    let paymentResponse;
    switch (activeGateway.provider) {
      case 'FAWRY':
        const { merchantCode, securityKey } = credentials;
        const customerProfileId = userId;
        const amount = course.price.toFixed(2);
        
        // توليد رقم مرجعي عشوائي للعملية
        const merchantRefNum = `FAWRY_${Math.floor(10000000 + Math.random() * 90000000)}`;
        
        // إنشاء التوقيع (Signature) وفقاً لمعادلة فوري الرسمية
        const signatureString = `${merchantCode}${merchantRefNum}${customerProfileId}PayAtFawry${amount}${securityKey}`;
        const signature = require('crypto').createHash('sha256').update(signatureString).digest('hex');

        // جلب بيانات المستخدم للإرسال
        const buyer = await prisma.user.findUnique({ where: { id: userId } });

        console.log(`Sending charge request to Fawry for course ${course.title}`);
        
        try {
          const fawryRes = await fetch('https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantCode,
              merchantRefNum,
              customerProfileId,
              customerName: buyer?.name || "Student",
              customerMobile: "01000000000",
              customerEmail: buyer?.email || "student@example.com",
              paymentMethod: "PayAtFawry",
              amount,
              currencyCode: "EGP",
              description: course.title.substring(0, 50),
              chargeItems: [
                {
                  itemId: course.id,
                  description: course.title.substring(0, 50),
                  price: amount,
                  quantity: 1
                }
              ],
              signature
            })
          });

          const fawryData = await fawryRes.json();
          if (fawryData.statusCode !== 200) {
            console.error('Fawry Error Response:', fawryData);
            return res.status(400).json({ message: 'فشل تهيئة الدفع مع فوري', details: fawryData });
          }

          // رقم فوري المرجعي الفعلي للدفع يتم إرجاعه في fawryData.referenceNumber
          referenceNumber = fawryData.referenceNumber || merchantRefNum;
          
        } catch (fawryError) {
          console.error('Fawry Request Failed:', fawryError);
          return res.status(500).json({ message: 'حدث خطأ أثناء الاتصال ببوابة فوري' });
        }

        paymentResponse = {
          provider: 'FAWRY',
          transactionId,
          referenceNumber, 
          status: 'PENDING_PAYMENT',
        };
        break;

      case 'STRIPE':
        const { secretKey } = credentials;
        console.log(`Processing STRIPE payment for course ${course.title} with secret ${secretKey?.substring(0, 5)}...`);
        paymentResponse = {
          provider: 'STRIPE',
          transactionId,
          clientSecret: `pi_${Math.random().toString(36).substring(7)}_secret_${Math.random().toString(36).substring(7)}`,
          status: 'REQUIRES_PAYMENT_METHOD',
        };
        break;

      default:
        return res.status(400).json({ message: `Unsupported provider: ${activeGateway.provider}` });
    }

    // تسجل المعاملة في الـ DB بوضع PENDING ورقم المعاملة الفوري في خانة الـ merchantRefNum أو الـ transactionId
    const paymentRecord = await prisma.payment.create({
      data: {
        userId,
        courseId,
        amount: course.price,
        status: 'PENDING',
        transactionId: referenceNumber || transactionId, // بنسجل الرقم المرجعي هنا للبحث عنه لاحقاً
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

// 👇 الدالة الجديدة الخاصة بالـ Webhook اللي بتستقبل تأكيد الدفع من فوري
export const handleFawryWebhook = async (req: Request, res: Response) => {
  try {
    const { merchantRefNumber, orderStatus } = req.body;

    console.log(`⚙️ Webhook received for transaction: ${merchantRefNumber}, Status: ${orderStatus}`);

    // 1. البحث عن المعاملة المعلقة في الـ Database بناءً على الرقم اللي سجلناه
    const payment = await prisma.payment.findFirst({
      where: { 
        transactionId: merchantRefNumber,
        status: 'PENDING'
      },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Transaction not found or already processed' });
    }

    // 2. إذا فوري أكد الدفع بنجاح
    if (orderStatus === 'PAID') {
      // تحديث الفاتورة إلى SUCCESS
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'SUCCESS' },
      });

      // 🔓 تفعيل الكورس للطالب بشكل آمن تماماً!
      await prisma.enrollment.create({
        data: {
          userId: payment.userId,
          courseId: payment.courseId,
        },
      });

      console.log(`✅ Success: Course unlocked for User ID: ${payment.userId}`);
      return res.status(200).send('XFawryResponseAlgorithm');
    }

    return res.status(200).json({ message: 'Webhook received, but status is not PAID' });
  } catch (error) {
    console.error('🚨 Webhook Error:', error);
    return res.status(500).send('Internal Server Error');
  }
};

export const checkPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { txnId } = req.params;

    if (!txnId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    const payment = await prisma.payment.findFirst({
      where: { transactionId: txnId },
      select: { status: true },
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    return res.status(200).json({ status: payment.status });
  } catch (error) {
    console.error('Error checking payment status:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};