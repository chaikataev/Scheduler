import dns from "node:dns";
import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";

import { connectDatabase } from "./config/database.js";
import authRoutes from "./routes/authRoutes.js";
import requireAuth from "./middleware/requireAuth.js";
import taskRoutes from "./routes/taskRoutes.js";
import Task from "./models/Task.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB Atlas.
await connectDatabase();

// EJS setup.
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Parse form submissions and JSON.
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve files from the public folder.
app.use(express.static(path.join(__dirname, "public")));

// Store login sessions in MongoDB.
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions"
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

// Make the logged-in user available in every EJS template.
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Authentication routes.
app.use(authRoutes);
app.use(taskRoutes);
app.use(scheduleRoutes);

// Homepage.
app.get("/", (req, res) => {
  res.render("index", {
    title: "Home"
  });
});

// Protected dashboard.
app.get("/dashboard", requireAuth, async (req, res, next) => {
  try {
    const userId = req.session.user.id;

    const [pendingCount, completedCount, upcomingTasks] =
      await Promise.all([
        Task.countDocuments({
          user: userId,
          status: "pending"
        }),

        Task.countDocuments({
          user: userId,
          status: "completed"
        }),

        Task.find({
          user: userId,
          status: "pending"
        })
          .sort({
            dueDate: 1,
            createdAt: -1
          })
          .limit(3)
      ]);

    res.render("dashboard", {
      title: "Dashboard",
      pendingCount,
      completedCount,
      upcomingTasks
    });
  } catch (error) {
    next(error);
  }
});

// 404 page.
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page Not Found",
    message: "The page you requested could not be found."
  });
});

// General error handler.
app.use((error, req, res, next) => {
  console.error(error);

  res.status(500).render("error", {
    title: "Server Error",
    message: "Something went wrong. Please try again."
  });
});

// Start the server.
app.listen(PORT, () => {
  console.log(`Scheduler is running at http://localhost:${PORT}`);
});