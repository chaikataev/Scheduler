Scheduler

Scheduler is a full-stack web app that helps users manage tasks and create schedules.

Users can create an account, sign in, add tasks, edit tasks, mark tasks as complete, and delete tasks. The app also uses the Google Gemini API to create a schedule based on the user's pending tasks and availability.

Live App

The project is hosted online.

Deployed App:
https://scheduler-69ee.onrender.com/

GitHub Repository:
https://github.com/chaikataev/Scheduler

Features for web app

- User signup and signin
- Password hashing with bcrypt
- Login sessions stored in MongoDB
- Add, edit, complete, and delete tasks
- Add due dates, priorities, and estimated times
- Generate schedules with Google Gemini
- Save and delete generated schedules
- Responsive design

stuff used

- Node.js
- Express
- EJS
- MongoDB Atlas
- Mongoose
- HTML
- CSS
- JavaScript
- Google Gemini API

Database used

The app uses MongoDB Atlas.

User creation style
- username
- email
- password

Task input
- user
- title
- description
- dueDate
- priority
- estimatedMinutes
- status

Schedule
- user
- title
- availability
- preferences
- scheduleContent

API

i used the Google Gemini API.

The server sends the user's pending tasks, deadlines, priorities, estimated times, availability, and preferences to Gemini. Gemini returns a schedule, and the schedule is saved in MongoDB.
