import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import { connectDB } from "./DB/ConnectDB.js";

const app = express();


app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is litsening on port number ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed.", err);
  });

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//session Configuration
app.use(
  session({
    secret: process.env.Session_Secret || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
    name: "user",
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      // dbName: process.env.DB_NAME,
      collectionName: "sessions",
      stringify: false,
      autoRemove: "interval",
      autoRemoveInterval: 1,
    }),
  }),
);

import authRoutes from './Routes/auth.routes.js';
import appointmentRoutes from './Routes/appointment.routes.js';
import geminiRoutes from './Routes/gemini.routes.js';
import userRoutes from './Routes/userProfile.routes.js';
import communityRoutes from './Routes/communityPost.routes.js'

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/community',communityRoutes);


export default app;