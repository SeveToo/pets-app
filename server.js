import { MongoClient } from 'mongodb';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { type } from 'os';
import sanitazeHTML from 'sanitize-html';
import { nextTick } from 'process';

let db;
const PORT = 3000;
const upload = multer();

const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const passwordProtected = (req, res, next) => {
  res.set('WWW-Authenticate', "Basic realm='Our MERN App'");
  if (req.headers.authorization == 'Basic YWRtaW46YWRtaW4=') {
    next();
  } else {
    res.status(401).send(`
        <nav>
          <a href="/">Home</a>
          <a href="/admin">Admin</a>
        </nav>
        Try again
    `);
  }
};

const ourCleanup = async (req, res, next) => {
  if (typeof req.body.name != 'string') req.body.name = '';
  if (typeof req.body.species != 'string') req.body.species = '';
  if (typeof req.body._id != 'string') req.body._id = '';

  req.cleanData = {
    name: sanitazeHTML(req.body.name.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
    species: sanitazeHTML(req.body.species.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    }),
  };

  next();
};

app.get('/', async (req, res) => {
  const allAnimals = await db.collection('animals').find().toArray();
  res.render('home', { allAnimals });
});

app.use(passwordProtected);

app.get('/admin', (req, res) => {
  res.render('admin');
});

app.get('/api/animals', async (req, res) => {
  const allAnimals = await db.collection('animals').find().toArray();
  res.json(allAnimals);
});

app.post(
  '/create-animal',
  upload.single('photo'),
  ourCleanup,
  async (req, res) => {
    const info = await db.collection('animals').insertOne(req.cleanData);
    console.log(req.body);
    res.send('Thanks You');
  }
);

const start = async () => {
  // Connect to MongoDB
  const client = new MongoClient('mongodb://localhost:27017/puppy-app');
  await client.connect();
  db = client.db();

  // Start the server
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
};

start();
