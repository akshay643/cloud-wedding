import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Demo users - In production, you'd store these in a database
const USERS = [
  {
    id: 1,
    username: 'bride',
    password: '$2b$10$Zf.VW/UURpr0/9EWlx8kweDREbOcPAc/BLfGXFJwR.EO73.3D7F06', // password: bride123
  },
  {
    id: 2,
    username: 'groom',
    password: '$2b$10$U819QU7DRuz3nEYYToOS6e3s1dHirylSkYWnawWmG9pvysh8iQJG.', // password: groom123
  },
  {
    id: 3,
    username: 'family',
    password: '$2b$10$L8MSF75U2P9E8grOx0oPU.Xe7zb8gxqxbz9Avw/XtrchbHK.ER2Nm', // password: family123
  },
  {
    id: 4,
    username: 'friends',
    password: '$2b$10$8S8oqGnn/ZONCHH1NBJZu.TkUhuOEkra8Q4Jcr4qAJZ1QcV0kqOJ6', // password: friends123
  }
];

export const findUserByUsername = (username) => {
  return USERS.find(user => user.username === username);
};

export const validatePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};
