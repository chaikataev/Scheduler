# Scheduler

Scheduler is a full-stack web application that helps users organize tasks and generate schedules with Google Gemini.

Users can create an account, sign in, add tasks, edit tasks, mark tasks as complete, and delete tasks. They can also enter their availability and have Gemini generate a schedule based on their pending tasks.

## Features

- User signup and signin
- Password hashing with bcrypt
- Login sessions stored in MongoDB
- Create, edit, complete, and delete tasks
- Task priorities, deadlines, and estimated times
- AI schedule generation with Gemini
- Save and delete generated schedules
- Responsive design

## Technologies

- Node.js
- Express.js
- EJS
- HTML
- CSS
- JavaScript
- MongoDB Atlas
- Mongoose
- Google Gemini API

## Database

The application uses MongoDB Atlas.

### User

- username
- email
- passwordHash

### Task

- user
- title
- description
- dueDate
- priority
- estimatedMinutes
- status

### Schedule

- user
- title
- availability
- preferences
- scheduleContent

## How to Run

Install the dependencies:

```bash
npm install


Create a .env file in the main project folder:
PORT=3000
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development

Start the server:
npm run dev

Open the app at:
http://localhost:3000

Main Pages:
/ — Homepage
/signup — Create an account
/signin — Sign in
/dashboard — User dashboard
/tasks — Manage tasks
/schedules/generate — Generate an AI schedule
/schedules — View saved schedules

API:
This project uses the Google Gemini API to generate schedules.
The server sends the user's pending tasks, availability, deadlines, priorities, and preferences to Gemini. The generated schedule is then saved in MongoDB.

Security:
Passwords are hashed before being saved. Login sessions are stored in MongoDB. API keys and database credentials are stored in the .env file and are not uploaded to GitHub.

Author:
Chai Kataev