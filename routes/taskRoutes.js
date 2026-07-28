import express from "express";

import Task from "../models/Task.js";
import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.use(requireAuth);

// Show all tasks and the create-task form.
router.get("/tasks", async (req, res, next) => {
  try {
    const tasks = await Task.find({
      user: req.session.user.id
    }).sort({
      status: 1,
      dueDate: 1,
      createdAt: -1
    });

    res.render("tasks", {
      title: "Tasks",
      tasks,
      error: null,
      formData: {}
    });
  } catch (error) {
    next(error);
  }
});

// Create a task.
router.post("/tasks", async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim() || "";
    const dueDate = req.body.dueDate || null;
    const priority = req.body.priority || "medium";
    const estimatedMinutes = Number(req.body.estimatedMinutes);

    if (!title) {
      const tasks = await Task.find({
        user: req.session.user.id
      }).sort({
        status: 1,
        dueDate: 1,
        createdAt: -1
      });

      return res.status(400).render("tasks", {
        title: "Tasks",
        tasks,
        error: "Task title is required.",
        formData: req.body
      });
    }

    if (
      !Number.isInteger(estimatedMinutes) ||
      estimatedMinutes < 5 ||
      estimatedMinutes > 1440
    ) {
      const tasks = await Task.find({
        user: req.session.user.id
      }).sort({
        status: 1,
        dueDate: 1,
        createdAt: -1
      });

      return res.status(400).render("tasks", {
        title: "Tasks",
        tasks,
        error: "Estimated time must be between 5 and 1440 minutes.",
        formData: req.body
      });
    }

    await Task.create({
      user: req.session.user.id,
      title,
      description,
      dueDate,
      priority,
      estimatedMinutes
    });

    res.redirect("/tasks");
  } catch (error) {
    next(error);
  }
});

// Show the edit page.
router.get("/tasks/:id/edit", async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.session.user.id
    });

    if (!task) {
      return res.status(404).render("error", {
        title: "Task Not Found",
        message: "That task does not exist."
      });
    }

    res.render("edit-task", {
      title: "Edit Task",
      task,
      error: null
    });
  } catch (error) {
    next(error);
  }
});

// Update a task.
router.post("/tasks/:id/edit", async (req, res, next) => {
  try {
    const title = req.body.title?.trim();
    const description = req.body.description?.trim() || "";
    const dueDate = req.body.dueDate || null;
    const priority = req.body.priority || "medium";
    const estimatedMinutes = Number(req.body.estimatedMinutes);

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.session.user.id
    });

    if (!task) {
      return res.status(404).render("error", {
        title: "Task Not Found",
        message: "That task does not exist."
      });
    }

    if (!title) {
      return res.status(400).render("edit-task", {
        title: "Edit Task",
        task,
        error: "Task title is required."
      });
    }

    if (
      !Number.isInteger(estimatedMinutes) ||
      estimatedMinutes < 5 ||
      estimatedMinutes > 1440
    ) {
      return res.status(400).render("edit-task", {
        title: "Edit Task",
        task,
        error: "Estimated time must be between 5 and 1440 minutes."
      });
    }

    task.title = title;
    task.description = description;
    task.dueDate = dueDate;
    task.priority = priority;
    task.estimatedMinutes = estimatedMinutes;

    await task.save();

    res.redirect("/tasks");
  } catch (error) {
    next(error);
  }
});

// Toggle pending/completed status.
router.post("/tasks/:id/toggle", async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.session.user.id
    });

    if (!task) {
      return res.status(404).render("error", {
        title: "Task Not Found",
        message: "That task does not exist."
      });
    }

    task.status =
      task.status === "completed" ? "pending" : "completed";

    await task.save();

    res.redirect("/tasks");
  } catch (error) {
    next(error);
  }
});

// Delete a task.
router.post("/tasks/:id/delete", async (req, res, next) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.session.user.id
    });

    if (!deletedTask) {
      return res.status(404).render("error", {
        title: "Task Not Found",
        message: "That task does not exist."
      });
    }

    res.redirect("/tasks");
  } catch (error) {
    next(error);
  }
});

export default router;