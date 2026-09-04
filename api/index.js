import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import errorHandler from './middleware/errorHandler.js'
import testRouter from './routes/testRouter.js'

const port = process.env.PORT || 3000

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use('/', testRouter)

// Health check endpoint for database connectivity
app.get('/api/health', async (req, res) => {
  try {
    const { pool } = await import('./models/db.js')
    await pool.query('SELECT 1')
    res.status(200).json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

app.use((req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use(errorHandler)

const path = require('path');

// 1. Opetetaan Express lukemaan staattiset tiedostot "public"- tai "dist"-kansiosta
// (OAMK:n pohja saattaa käyttää kumpaa tahansa, varmista kansion nimi projektistasi)
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 2. Jos käyttäjä menee mille tahansa sivulle (esim. /home tai /about), 
// palautetaan aina Reactin index.html, jotta React-router toimii
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) { // Älä sotke backendin omia /api-reittejä!
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  }
});

app.listen(port, () => {  
  console.log(`Server is running on http://localhost:${port}`)
  console.log('Backend hot reload is working!')
})