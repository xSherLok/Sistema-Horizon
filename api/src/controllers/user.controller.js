import User from '../models/User.js';

export async function me(req, res) {
  try {
    const user = await User.findById(req.user.sub).select('name email role createdAt');
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Falha ao carregar perfil' });
  }
}
