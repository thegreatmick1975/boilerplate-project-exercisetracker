const express = require('express');
const app = express();
//Import and initialize the Express.js framework
const bodyParser = require('body-parser');
const cors = require('cors');
// Import and initialize middleware for parsing incoming request bodies 
//(body-parser) and enabling Cross-Origin Resource Sharing (CORS) 
const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config()
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

console.log(process.env.MONGO_URI);
// Import and initialize the Mongoose library for MongoDB database connectivity.
//Retrieve the MongoDB connection string from environment variables.
//Connect to the MongoDB database using the connection string.

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));
//Set up middleware to be used for all requests to the server.
//cors() enables Cross-Origin Resource Sharing, allowing client-side JavaScript to access server resources.
//bodyParser.urlencoded() and bodyParser.json() parse incoming request bodies in different formats (urlencoded and JSON).
//express.static() serves static files (such as HTML, CSS, and JavaScript) from the public directory.

const userSchema = new Schema({
  username: { type: String, required: true }
});

const exerciseSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: Date
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);
//Define two Mongoose schemas for users and exercises.
//Create two Mongoose models (User and Exercise) using the corresponding schemas.

app.post('/api/users', async (req, res) => {
  const { username } = req.body;
  try {
    const user = new User({ username });
    await user.save();
    res.json({ username, _id: user._id });
  } catch (err) {
    res.status(400).send('Username already taken');
  }
});
//Define a route for creating new users (HTTP POST to /api/users).
//Create a new user from the username received in the request body and save it to the database.
//Respond with a JSON object containing the new user's username and ID.
//If there is an error (such as a duplicate username), respond with an HTTP 400 error.

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (err) {
    res.status(500).send('Server error');
  }
});
//Define a route for retrieving all users (HTTP GET to /api/users).
//Retrieve all users from the database and respond with a JSON array of user objects.
//If there is an error, respond with an HTTP 500 error.



app.post('/api/users/:_id/exercises', async (req, res) => {
  const { description, duration, date } = req.body;
  const userId = req.params._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    const exercise = new Exercise({
      userId,
      description,
      duration,
      date: date ? new Date(date) : new Date()
    });
    await exercise.save();
res.json({
  _id: user._id,
  username: user.username,
  date: exercise.date.toDateString(),
  duration: parseInt(exercise.duration),
  description: exercise.description,
});
//This code block defines a POST endpoint for creating new exercises for a user. 
//It expects the user's ID to be provided in the URL parameters (req.params._id), and the 
//exercise information to be provided in the request body (req.body). 
//The endpoint first checks if the user exists and returns an error message 
//if the user is not found. 
//Then, it creates a new Exercise object with the provided information 
//and saves it to the database. Finally, it returns a JSON response
//with the user's ID, username, and the details of the newly created exercise.


  } catch (err) {
    res.status(500).send('Server error');
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  const userId = req.params._id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }
    let query = { userId };
    if (from && to) {
      query.date = { $gte: new Date(from), $lte: new Date(to) };
    } else if (from) {
      query.date = { $gte: new Date(from) };
    } else if (to) {
      query.date = { $lte: new Date(to) };
    }
    const exercisesQuery = Exercise.find(query).select('-_id -userId');
    if (limit) {
      exercisesQuery.limit(Number(limit));
    }
    const exercises = await exercisesQuery.exec();
    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }))
    });
  } catch (err) {
    res.status(500).send('Server error');
  }
});
//This code block defines a GET endpoint for retrieving a user's exercise log.
//It expects the user's ID to be provided in the URL parameters (req.params._id),
//and optional parameters for filtering the log (from, to, and limit) to be
//provided in the query string (req.query). 
//The endpoint first checks if the user exists and returns an error message 
//if the user is not found. Then, it constructs a MongoDB query object based 
//on the provided filter parameters and retrieves the matching exercises from the database.
//Finally, it returns a JSON response with the user's ID, username,
//the number of matching exercises,
//and an array of objects representing each exercise's details.

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
//This code block defines a GET endpoint for serving the index.html file to the client. This is the landing page for the web application.

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port' + listener.address().port)
})
//This code block starts the Node.js server by calling the listen() method on the app object.
//It specifies a port number to listen on 
//(process.env.PORT if it exists, otherwise 3000) and 
//logs a message to the console when the server is successfully started.
