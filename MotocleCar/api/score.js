export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { user, score, date } = req.body;

    // Aquí puedes manejar la lógica para guardar el puntaje en la base de datos
    // Por ejemplo, usando un modelo de Mongoose para MongoDB

    res.status(200).json({ message: 'Puntaje guardado correctamente' });
  } else if (req.method === 'GET') {

    
  }
}