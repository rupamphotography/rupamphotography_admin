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
    
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ error: 'Missing publicId' });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok' || result.result === 'not found') {
      return res.status(200).json({ success: true, result: result.result });
    } else {
      throw new Error(`Cloudinary responded with ${result.result}`);
    }
    
  } catch (error) {
    console.error("Error deleting image or invalid token:", error);
    return res.status(401).json({ error: 'Unauthorized or Deletion failed' });
  }
}
