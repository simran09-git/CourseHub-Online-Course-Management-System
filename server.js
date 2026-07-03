const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ================= MYSQL CONNECTION =================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Root",
  database: "coursehub"
});

db.connect((err) => {
  if (err) {
    console.log("Database connection error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

// ================= LOGIN =================
app.post("/api/login", (req, res) => {
  const { name, email, password, role } = req.body;

  if (role === "admin") {
    if (email === "admin@coursehub.com" && password === "admin123") {
      return res.json({ success: true });
    } else {
      return res.json({
        success: false,
        message: "Invalid Admin Credentials"
      });
    }
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) return res.json({ success: false });

    if (result.length === 0) {
      db.query(
        "INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)",
        [name, email, password, "student"],
        () => res.json({ success: true })
      );
    } else {
      if (result[0].password === password) {
        res.json({ success: true });
      } else {
        res.json({
          success: false,
          message: "Wrong Password"
        });
      }
    }
  });
});

// ================= USERS =================
app.get("/api/users", (req, res) => {
  db.query("SELECT name,email FROM users", (err, result) => {
    res.json(result);
  });
});

// ================= GET SINGLE USER (NEW - REQUIRED FOR PROFILE) =================
app.get("/api/user/:email", (req, res) => {
  db.query(
    "SELECT name,email FROM users WHERE email=?",
    [req.params.email],
    (err, result) => {
      if (result.length > 0) {
        res.json(result[0]);
      } else {
        res.json({});
      }
    }
  );
});

// ================= UPDATE USER (NEW - FOR PROFILE UPDATE) =================
app.put("/api/updateUser", (req, res) => {
  const { oldEmail, newName, newEmail } = req.body;

  db.query(
    "UPDATE users SET name=?, email=? WHERE email=?",
    [newName, newEmail, oldEmail],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

app.delete("/api/user/:email", (req, res) => {
  db.query(
    "DELETE FROM users WHERE email = ?",
    [req.params.email],
    () => res.json({ success: true })
  );
});

// ================= COURSES =================
app.get("/api/courses", (req, res) => {
  const category = req.query.cat;

  if (category && category !== "All") {
    db.query(
      "SELECT * FROM courses WHERE cat = ?",
      [category],
      (err, result) => res.json(result)
    );
  } else {
    db.query("SELECT * FROM courses", (err, result) => {
      res.json(result);
    });
  }
});

app.post("/api/courses", (req, res) => {
  const { title, cat, logo } = req.body;

  db.query(
    "INSERT INTO courses (title,cat,logo) VALUES (?,?,?)",
    [title, cat, logo],
    () => res.json({ success: true })
  );
});

app.delete("/api/course/:id", (req, res) => {
  db.query(
    "DELETE FROM courses WHERE id = ?",
    [req.params.id],
    () => res.json({ success: true })
  );
});

// ================= ENROLL =================
app.post("/api/enroll", (req, res) => {
  const { email, courseId } = req.body;

  db.query(
    "SELECT * FROM enrollments WHERE email=? AND courseId=?",
    [email, courseId],
    (err, result) => {
      if (result.length > 0) {
        return res.json({
          success: false,
          message: "Already Enrolled"
        });
      }

      db.query(
        "INSERT INTO enrollments (email,courseId) VALUES (?,?)",
        [email, courseId],
        () => res.json({ success: true })
      );
    }
  );
});

// ================= GET STUDENT ENROLLMENTS =================
app.get("/api/enrollments/:email", (req, res) => {
  db.query(
    `SELECT courses.id,
            courses.title,
            enrollments.progress
     FROM enrollments
     JOIN courses ON enrollments.courseId = courses.id
     WHERE enrollments.email = ?`,
    [req.params.email],
    (err, result) => res.json(result)
  );
});

// ================= ALL ENROLLMENTS (ADMIN) =================
app.get("/api/enrollments", (req, res) => {
  db.query(
    `SELECT users.name,
            users.email,
            courses.title,
            enrollments.progress,
            courses.id AS courseId
     FROM enrollments
     JOIN users ON enrollments.email = users.email
     JOIN courses ON enrollments.courseId = courses.id`,
    (err, result) => res.json(result)
  );
});

// ================= REMOVE ENROLLMENT =================
app.post("/api/removeEnrollment", (req, res) => {
  const { email, courseId } = req.body;

  db.query(
    "DELETE FROM enrollments WHERE email=? AND courseId=?",
    [email, courseId],
    () => res.json({ success: true })
  );
});

// ================= PROGRESS =================
app.post("/api/progress", (req, res) => {
  const { email, courseId } = req.body;

  db.query(
    "UPDATE enrollments SET progress = progress + 10 WHERE email=? AND courseId=? AND progress < 100",
    [email, courseId],
    () => res.json({ success: true })
  );
});

// ================= SERVER START =================
app.listen(3000, '0.0.0.0', () => {
  console.log("Server running on port 3000");
});