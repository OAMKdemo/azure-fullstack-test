import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import errorHandler from './middleware/errorHandler.js'
import testRouter from './routes/testRouter.js'
import path from 'path';
import { fileURLToPath } from 'url';

const port = process.env.PORT || 3000

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))



// 2. ES-moduuleissa ei ole oletuksena '__dirname'-muuttujaa, joten luodaan se näin:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3. Tämä staattinen tarjoilu pysyy samana (varmista, että tämä on reittien lopussa ennen app.listen-riviä):
app.use(express.static(path.join(__dirname, '../dist')));

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

app.use('/api', testRouter)

app.get('*any', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  }
});

app.use((req, res, next) => {
  const error = new Error('Not found')
  error.status = 404
  next(error)
})

app.use(errorHandler)

app.listen(port, () => {  
  console.log(`Server is running on http://localhost:${port}`)
  console.log('Backend hot reload is working!')
})