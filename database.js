const mysql = require('mysql');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Damber123.',
  database: 'movie_booking',
  // connectionLimit: 10,
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database: ', err);
    return;
  }
  console.log('Connected to the database');
});

const createMovieHallsTable = `CREATE TABLE IF NOT EXISTS movie_halls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  normal_capacity INT NOT NULL,
  vip_capacity INT NOT NULL,
  normal_rate DECIMAL(10, 2) NOT NULL,
  vip_rate DECIMAL(10, 2) NOT NULL,
  status BOOLEAN NOT NULL DEFAULT 1
)`;

connection.query(createMovieHallsTable, (err) => {
  if (err) {
    console.error('Error creating movie_halls table: ', err);
    return;
  }
});

// Table creation query
const createUserTable = `CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  reset_token VARCHAR(255),
  assigned_theater_id INT,
  FOREIGN KEY (assigned_theater_id) REFERENCES movie_halls(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

connection.query(createUserTable, (err) => {
  if (err) {
    console.error('Error creating users table: ', err);
    return;
  }
});

const createMovies = `CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  casts VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  genre VARCHAR(50) NOT NULL,
  image VARCHAR(255) NOT NULL,
  duration VARCHAR(255) NOT NULL
);
`;

connection.query(createMovies, (err) => {
  if (err) {
    console.error('Error creating movie_halls table: ', err);
    return;
  }
});

const createHallMapping = `CREATE TABLE IF NOT EXISTS movie_hall_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  movie_id INT,
  movie_hall_id INT,
  screening_date DATE,
  screening_time TIME,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  FOREIGN KEY (movie_hall_id) REFERENCES movie_halls(id)
)`;

connection.query(createHallMapping, (err) => {
  if (err) {
    console.error('Error creating movie_halls table: ', err);
    return;
  }
});

const createBooking = `CREATE TABLE IF NOT EXISTS bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    hall_id INT,
    seat_number VARCHAR(10),
    movie_id INT,
    screening_date DATE,
    screening_time TIME,
    amount DECIMAL(10, 2),
    booking_date_and_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (hall_id) REFERENCES movie_halls(id),
    FOREIGN KEY (movie_id) REFERENCES movies(id)
  )`;

connection.query(createBooking, (err) => {
  if (err) {
    console.error('Error creating movie_halls table: ', err);
    return;
  }
});

const createreviews = `CREATE TABLE IF NOT EXISTS movie_review (
  id INT PRIMARY KEY AUTO_INCREMENT,
  movie_id INT,
  FOREIGN KEY (movie_id) REFERENCES movies(id),
  review VARCHAR(255),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`;
connection.query(createreviews, (err) => {
  if (err) {
    console.error('Error creating review table: ', err);
    return;
  }
});
// Configure the LocalStrategy for username and password authentication
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    (email, password, done) => {
      // Check if the email and password match the user in the MySQL database
      const query = 'SELECT * FROM users WHERE email = ?';
      connection.query(query, [email], (error, results) => {
        if (error) {
          return done(error);
        }

        if (results.length === 0) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const user = results[0];
        const passwordMatch = bcrypt.compareSync(password, user.password);

        if (!passwordMatch) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        // If the authentication is successful, pass the user object to the done callback
        done(null, user);
      });
    }
  )
);

// Optional: Serialize and deserialize the authenticated user
passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  // Fetch the user from the MySQL database using the id
  const query = 'SELECT * FROM users WHERE email = ?';
  connection.query(query, [email], (error, results) => {
    if (error) {
      return done(error);
    }

    const user = results[0];
    done(null, user);
  });
});

module.exports = { connection, passport };
