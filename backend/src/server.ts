import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'

dotenv.config()

const prisma = new PrismaClient()

const app = express()

app.use(helmet())
const frontendUrl = process.env.FRONTEND_URL
import app from './app'
  cors({
