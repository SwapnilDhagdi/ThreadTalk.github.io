ThreadTalk 🧵💬
A community-driven social media platform where people connect, interact, and share ideas.

🌟 About
ThreadTalk is a community-based social platform that allows users to create communities, post content, and interact with others. Designed as a full-stack project, it demonstrates my skills in building a social media platform from scratch.

Whether you're starting a niche group, sharing your thoughts, or just browsing, ThreadTalk makes it simple to connect with like-minded people.

🚀 Features
  User Authentication (Register & Login)

  Create and Manage Communities

  Post and Engage in conversations

  Like & Comment on posts

  Secure Interaction with middleware protection

  Relational Database to manage users, posts, and communities

🛠️ Tech Stack
  Frontend
    HTML

    CSS

    JavaScript

  Backend
    Node.js

    Express.js

  Database
    PostgreSQL

📂 Project Structure
ThreadTalk/
│
├── public/             # Frontend files (HTML, CSS, JS)
├── routes/             # Express routes
├── controllers/        # Request handlers/controllers
├── models/             # Database queries
├── middleware/         # Auth & other middleware
├── app.js              # Entry point
└── README.md           # Project documentation
⚙️ Installation & Setup
Follow these steps to run ThreadTalk locally:

Clone the repository

git clone https://github.com/SwapnilDhagdi/ThreadTalk.github.io.git
cd ThreadTalk
Install dependencies

npm install
Configure the database

Set up a PostgreSQL database.

Create necessary tables (users, posts, communities, etc.).

Update your database connection string in app.js or your config file.

Run the server

node app.js
Open in browser
Navigate to http://localhost:3000 and explore ThreadTalk!

🔐 Authentication & Security
Passwords are hashed (bcrypt).

Protected routes with middleware to ensure authenticated access.

✨ What I Learned
Building full-stack applications with Node.js and PostgreSQL.

Structuring Express applications with controllers and middleware.

Designing relational databases to manage community and post data.

Enhancing user experience through simple frontend design.

Debugging, lots of debugging! 😄

🚀 Future Improvements
Add real-time updates using WebSockets.

Improve UI/UX with modern frameworks like React.

Add comment functionality on posts.

Implement user avatars and profiles.

Notifications & activity feeds.

🙌 Contributing
Contributions are welcome! If you find bugs or have suggestions, feel free to open an issue or pull request.

📄 License
This project is licensed under the MIT License.

🔗 Links
Project Repository: ThreadTalk GitHub
