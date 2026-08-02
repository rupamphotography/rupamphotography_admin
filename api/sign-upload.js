import cloudinaryModule from 'cloudinary';
import jwt from 'jsonwebtoken';

const cloudinary = cloudinaryModule.v2;

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split('Bearer ')[1];
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    console.error("JWT_SECRET is missing");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    jwt.verify(token, jwtSecret);
    
    const timestamp = Math.round((new Date()).getTime() / 1000);
    const { category } = req.body || {};
    
    const paramsToSign = {
      timestamp: timestamp,
      folder: 'portfolio'
    };
    
    if (category) {
      paramsToSign.tags = `portfolio,${category}`;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    return res.status(200).json({
      timestamp,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME
    });
  } catch (error) {
    console.error("Error signing upload or invalid token:", error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
