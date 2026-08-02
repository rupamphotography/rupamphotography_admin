import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// In-memory rate limiter adapted for Vercel/Vite serverless functions
const rateLimitMap = new Map();

const applyRateLimit = (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  const currentTime = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, startTime: currentTime });
    return true; // Allowed
  }
  
  const record = rateLimitMap.get(ip);
  if (currentTime - record.startTime > windowMs) {
    record.count = 1;
    record.startTime = currentTime;
    return true; // Allowed (window reset)
  }
  
  record.count += 1;
  if (record.count > 10) {
    res.setHeader('Retry-After', Math.ceil((windowMs - (currentTime - record.startTime)) / 1000));
    res.status(429).json({ message: 'Too many login attempts from this IP. Please try again later.' });
    return false; // Rate limited
  }
  
  return true; // Allowed
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!applyRateLimit(req, res)) {
    return;
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const jwtSecret = process.env.JWT_SECRET;

  if (!adminUsername || !adminPasswordHash || !jwtSecret) {
    console.error("Missing authentication environment variables: ADMIN_USERNAME, ADMIN_PASSWORD_HASH, or JWT_SECRET");
    return res.status(500).json({ error: 'Server configuration error' });
  }

  if (username !== adminUsername) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, adminPasswordHash);

  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Credentials match, issue JWT
  const token = jwt.sign({ user: username, admin: true }, jwtSecret, { expiresIn: '7d' });

  return res.status(200).json({
    message: 'Login successful',
    token
  });
}
