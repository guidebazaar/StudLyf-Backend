const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const allowedOrigins = [
  'http://localhost:8080',
  'https://studlyf.in'
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '20kb' }));

const mongoUri = process.env.MONGO_URI;
if (!mongoose.connection.readyState) {
  mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));
}

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: String,
  firstName: String,
  lastName: String,
  bio: String,
  branch: String,
  year: String,
  college: String,
  city: String,
  phoneNumber: String,
  linkedinUrl: String,
  githubUrl: String,
  portfolioUrl: String,
  profilePicture: String,
  skills: [String],
  interests: [String],
  careerGoals: String,
  dateOfBirth: String,
  resumeFiles: [String],
  projectFiles: [String],
  certificationFiles: [String],
  isOnline: Boolean,
  completedProfile: Boolean,
  createdAt: Date,
  updatedAt: Date,
}, { timestamps: true, collection: 'users' });

userSchema.pre('save', function(next) {
  const docSize = Buffer.byteLength(JSON.stringify(this.toObject()));
  if (docSize > 100 * 1024) {
    return next(new Error('Profile data exceeds 100KB limit.'));
  }
  next();
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

const connectionRequestSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
}, { collection: 'connection_requests' });
const ConnectionRequest = mongoose.models.ConnectionRequest || mongoose.model('ConnectionRequest', connectionRequestSchema);

const connectionSchema = new mongoose.Schema({
  users: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now }
}, { collection: 'connections' });
const Connection = mongoose.models.Connection || mongoose.model('Connection', connectionSchema);

const messageSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 86400 }
}, { collection: 'messages' });
const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

app.get('/api/profile/:uid', async (req, res) => {
  try {
    const user = await User.findById(req.params.uid);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile/:uid', async (req, res) => {
  try {
    const data = req.body;
    if (Buffer.byteLength(JSON.stringify(data)) > 100 * 1024) {
      return res.status(400).json({ error: 'Profile data exceeds 100KB limit.' });
    }
    data._id = req.params.uid;
    const user = await User.findByIdAndUpdate(
      req.params.uid,
      { $set: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/connections/request', async (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) return res.status(400).json({ error: 'Missing from or to' });
  const exists = await ConnectionRequest.findOne({ from, to });
  if (exists) return res.status(409).json({ error: 'Request already sent' });
  const connected = await Connection.findOne({ users: { $all: [from, to] } });
  if (connected) return res.status(409).json({ error: 'Already connected' });
  const reqDoc = await ConnectionRequest.create({ from, to });
  res.json(reqDoc);
});

app.get('/api/connections/requests/:uid', async (req, res) => {
  const { uid } = req.params;
  const requests = await ConnectionRequest.find({ to: uid });
  res.json(requests);
});

app.post('/api/connections/accept', async (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) return res.status(400).json({ error: 'Missing from or to' });
  await Connection.create({ users: [from, to] });
  await ConnectionRequest.deleteOne({ from, to });
  res.json({ success: true });
});

app.post('/api/connections/reject', async (req, res) => {
  const { from, to } = req.body;
  if (!from || !to) return res.status(400).json({ error: 'Missing from or to' });
  await ConnectionRequest.deleteOne({ from, to });
  res.json({ success: true });
});

app.get('/api/connections/:uid', async (req, res) => {
  const { uid } = req.params;
  const conns = await Connection.find({ users: uid });
  const otherIds = conns.map(c => c.users.find(u => u !== uid));
  res.json(otherIds);
});

app.post('/api/messages/send', async (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) return res.status(400).json({ error: 'Missing from, to, or text' });
  const msg = await Message.create({ from, to, text });
  res.json(msg);
});

app.get('/api/messages/:uid1/:uid2', async (req, res) => {
  const { uid1, uid2 } = req.params;
  const msgs = await Message.find({
    $or: [
      { from: uid1, to: uid2 },
      { from: uid2, to: uid1 }
    ]
  }).sort({ createdAt: 1 });
  res.json(msgs);
});

// Use Mongoose for /api/users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, {
      _id: 1,
      firstName: 1,
      profilePicture: 1,
      bio: 1,
      skills: 1,
      interests: 1,
      college: 1,
      year: 1,
      branch: 1,
      city: 1,
      isOnline: 1
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Add custom message routes for /api and /api/root
app.get('/api', (req, res) => {
  res.send('StudLyf Backend API is running!');
});

app.get('/api/root', (req, res) => {
  res.send('StudLyf Backend API is running! (root endpoint)');
});

module.exports = app;
