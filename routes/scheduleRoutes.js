import express from "express";
import { GoogleGenAI } from "@google/genai";

import Schedule from "../models/Schedule.js";
import Task from "../models/Task.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

// Display the AI schedule generator.
router.get("/schedules/generate", async (req, res, next) => {
  try {
    const tasks = await Task.find({
      user: req.session.user.id,
      status: "pending"
    }).sort({
      dueDate: 1,
      createdAt: -1
    });

    res.render("schedule-generator", {
      title: "AI Planner",
      tasks,
      error: null,
      formData: {}
    });
  } catch (error) {
    next(error);
  }
});

// Generate and save an AI schedule.
router.post("/schedules/generate", async (req, res, next) => {
  const title = req.body.title?.trim() || "My Schedule";
  const availability = req.body.availability?.trim();
  const preferences = req.body.preferences?.trim() || "";

  const formData = {
    title,
    availability: availability || "",
    preferences
  };

  try {
    const tasks = await Task.find({
      user: req.session.user.id,
      status: "pending"
    }).sort({
      dueDate: 1,
      createdAt: -1
    });

    if (!availability) {
      return res.status(400).render("schedule-generator", {
        title: "AI Planner",
        tasks,
        error: "Please enter your availability.",
        formData
      });
    }

    if (tasks.length === 0) {
      return res.status(400).render("schedule-generator", {
        title: "AI Planner",
        tasks,
        error: "Add at least one pending task before generating a schedule.",
        formData
      });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === "add_later") {
      return res.status(500).render("schedule-generator", {
        title: "AI Planner",
        tasks,
        error: "The Gemini API key has not been configured.",
        formData
      });
    }

    // Create the client here so .env has already loaded.
    const ai = new GoogleGenAI({
      apiKey
    });

    const taskText = tasks
      .map((task, index) => {
        const dueDate = task.dueDate
          ? new Date(task.dueDate).toLocaleString("en-US")
          : "No deadline";

        return `
Task ${index + 1}
Title: ${task.title}
Description: ${task.description || "No description"}
Priority: ${task.priority}
Estimated time: ${task.estimatedMinutes} minutes
Due date: ${dueDate}
`;
      })
      .join("\n");

    const prompt = `
You are an intelligent scheduling assistant.

Create a realistic and easy-to-follow schedule using the user's pending tasks.

USER AVAILABILITY:
${availability}

USER PREFERENCES:
${preferences || "No additional preferences provided."}

PENDING TASKS:
${taskText}

Follow these requirements:
- Only schedule work during the availability supplied by the user.
- Prioritize tasks marked high priority.
- Prioritize tasks with the closest deadlines.
- Include every pending task.
- Do not create overlapping time blocks.
- Include reasonable breaks.
- Show clear day headings.
- For each scheduled item, show its start time, end time, task title, and a brief explanation.
- Do not use a markdown table.
- Keep the schedule clear and practical.
- Finish with a short section titled "Planning Notes".
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        maxOutputTokens: 2000
      }
    });

    const scheduleContent = response.text?.trim();

    if (!scheduleContent) {
      return res.status(502).render("schedule-generator", {
        title: "AI Planner",
        tasks,
        error: "Gemini returned an empty response. Please try again.",
        formData
      });
    }

    const schedule = await Schedule.create({
      user: req.session.user.id,
      title,
      availability,
      preferences,
      scheduleContent
    });

    res.redirect(`/schedules/${schedule._id}`);
  } catch (error) {
    console.error("Gemini schedule error:", error);

    try {
      const tasks = await Task.find({
        user: req.session.user.id,
        status: "pending"
      }).sort({
        dueDate: 1,
        createdAt: -1
      });

      let friendlyError =
        "The schedule could not be generated. Please try again.";

      if (
        error.message?.includes("API key") ||
        error.message?.includes("API_KEY_INVALID") ||
        error.status === 401 ||
        error.status === 403
      ) {
        friendlyError =
          "The Gemini API key is invalid or does not have permission to use this model.";
      } else if (
        error.status === 429 ||
        error.message?.includes("quota")
      ) {
        friendlyError =
          "The Gemini API usage limit was reached. Wait briefly and try again.";
      } else if (
        error.status === 404 ||
        error.message?.includes("not found")
      ) {
        friendlyError =
          "The selected Gemini model is unavailable. Check the model name.";
      }

      res.status(500).render("schedule-generator", {
        title: "AI Planner",
        tasks,
        error: friendlyError,
        formData
      });
    } catch (renderError) {
      next(renderError);
    }
  }
});

// Display all schedules belonging to the current user.
router.get("/schedules", async (req, res, next) => {
  try {
    const schedules = await Schedule.find({
      user: req.session.user.id
    }).sort({
      createdAt: -1
    });

    res.render("schedules", {
      title: "Saved Schedules",
      schedules
    });
  } catch (error) {
    next(error);
  }
});

// Display one saved schedule.
router.get("/schedules/:id", async (req, res, next) => {
  try {
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      user: req.session.user.id
    });

    if (!schedule) {
      return res.status(404).render("error", {
        title: "Schedule Not Found",
        message: "That schedule does not exist."
      });
    }

    res.render("schedule", {
      title: schedule.title,
      schedule
    });
  } catch (error) {
    next(error);
  }
});

// Delete a saved schedule.
router.post("/schedules/:id/delete", async (req, res, next) => {
  try {
    const schedule = await Schedule.findOneAndDelete({
      _id: req.params.id,
      user: req.session.user.id
    });

    if (!schedule) {
      return res.status(404).render("error", {
        title: "Schedule Not Found",
        message: "That schedule does not exist."
      });
    }

    res.redirect("/schedules");
  } catch (error) {
    next(error);
  }
});

export default router;