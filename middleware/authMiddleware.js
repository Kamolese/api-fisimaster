const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Log detalhado para debug
      console.log('🔍 Token recebido:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔍 JWT_SECRET definido:', !!process.env.JWT_SECRET);
      
      // Verificar se o token tem o formato correto (3 partes separadas por ponto)
      if (!token || token.split('.').length !== 3) {
        console.error('❌ Token JWT malformado - não possui 3 partes');
        res.status(401);
        throw new Error('Token malformado');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decodificado com sucesso para usuário:', decoded.id);

      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.error('❌ Usuário não encontrado no banco de dados');
        res.status(401);
        throw new Error('Usuário não encontrado');
      }

      console.log('✅ Usuário autenticado:', req.user.email);
      next();
    } catch (error) {
      console.error('❌ Erro na autenticação:', error.message);
      
      if (error.name === 'JsonWebTokenError') {
        console.error('❌ JWT Error específico:', error.message);
        res.status(401);
        throw new Error('Token inválido');
      } else if (error.name === 'TokenExpiredError') {
        console.error('❌ Token expirado');
        res.status(401);
        throw new Error('Token expirado');
      } else {
        res.status(401);
        throw new Error('Não autorizado');
      }
    }
  }

  if (!token) {
    console.error('❌ Nenhum token fornecido');
    res.status(401);
    throw new Error('Não autorizado, token não fornecido');
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized as an admin');
  }
};

module.exports = { protect, admin };
