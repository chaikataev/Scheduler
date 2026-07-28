import express from "express";
import bcrypt from "bcrypt";

import User from "../models/User.js";

const router = express.Router();

router.get("/signup", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.render("signup", {
    title: "Sign Up",
    error: null,
    formData: {}
  });
});

router.post("/signup", async (req, res, next) => {
  try {
    const username = req.body.username?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    const formData = {
      username: username || "",
      email: email || ""
    };

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).render("signup", {
        title: "Sign Up",
        error: "Please complete every field.",
        formData
      });
    }

    if (username.length < 2 || username.length > 50) {
      return res.status(400).render("signup", {
        title: "Sign Up",
        error: "Username must be between 2 and 50 characters.",
        formData
      });
    }

    if (password.length < 8) {
      return res.status(400).render("signup", {
        title: "Sign Up",
        error: "Password must contain at least 8 characters.",
        formData
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).render("signup", {
        title: "Sign Up",
        error: "The passwords do not match.",
        formData
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).render("signup", {
        title: "Sign Up",
        error: "An account with that email already exists.",
        formData
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email,
      passwordHash
    });

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    req.session.save((error) => {
      if (error) {
        return next(error);
      }

      res.redirect("/dashboard");
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).render("signup", {
        title: "Sign Up",
        error: "An account with that email already exists.",
        formData: {
          username: req.body.username || "",
          email: req.body.email || ""
        }
      });
    }

    next(error);
  }
});

router.get("/signin", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.render("signin", {
    title: "Sign In",
    error: null,
    email: ""
  });
});

router.post("/signin", async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).render("signin", {
        title: "Sign In",
        error: "Enter your email and password.",
        email: email || ""
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).render("signin", {
        title: "Sign In",
        error: "Incorrect email or password.",
        email
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).render("signin", {
        title: "Sign In",
        error: "Incorrect email or password.",
        email
      });
    }

    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email
    };

    req.session.save((error) => {
      if (error) {
        return next(error);
      }

      res.redirect("/dashboard");
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("connect.sid");
    res.redirect("/");
  });
});

export default router;