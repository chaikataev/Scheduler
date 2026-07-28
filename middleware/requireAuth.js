export default function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/signin");
  }

  next();
}