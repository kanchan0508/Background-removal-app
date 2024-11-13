import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import connectedDB from './configs/mongodb.js'

// App cofig
const PORT = process.env.PORT || 4000
const app = express()
// await connectedDB()

//initialize middleware
app.use(express.json())
app.use(cors())

//API routes
app.get('/',(req, res) => res.send("API  Working"))

app.listen(PORT, () =>console.log('Server listening on port'+ PORT))
