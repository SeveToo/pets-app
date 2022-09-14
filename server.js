import { MongoClient, ObjectId } from 'mongodb';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { type } from 'os';
import sanitazeHTML from 'sanitize-html';
import { nextTick } from 'process';
import fse from 'fs-extra';
import sharp from 'sharp';
import { info } from 'console';

const app = express();
let db;
const PORT = 3000;
const upload = multer();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// When the app first lunches make shure the public/uploaded-photos is
fse.ensureDirSync(path.join('public', 'uploaded-photos'));

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const passwordProtected = (req, res, next) => {
  console.log(req.headers.authorization);
  res.set('WWW-Authenticate', "Basic realm='Our MERN App'");
  if (req.headers.authorization == 'Basic YWRtaW46YWRtaW4=') {
    next();
  } else {
    res.status(401).send(`
        <nav>
          <a href="/">Home</a> { }
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

app.get('/', (req, res) => {
  res.render('home');
});

app.get('/admin', passwordProtected, (req, res) => {
  res.render('admin');
});

app.get('/api/animals', async (req, res) => {
  const allAnimals = await db.collection('animals').find().toArray();
  res.json(allAnimals);
});

app.post(
  '/create-animal',
  passwordProtected,
  upload.single('photo'),
  ourCleanup,
  async (req, res) => {
    if (req.file) {
      const photoFileName = `${Date.now()}.jpg`;
      await sharp(req.file.buffer)
        .resize(844, 456)
        .jpeg({ quality: 60 })
        .toFile(path.join('public', 'uploaded-photos', photoFileName));
      req.cleanData.photo = photoFileName;
    }

    const info = await db.collection('animals').insertOne(req.cleanData);
    const newAnimal = await db
      .collection('animals')
      .findOne({ _id: new ObjectId(info.insertedId) });
    res.send(newAnimal);
  }
);

app.delete('/animal/:id', passwordProtected, async (req, res) => {
  if (typeof req.params.id != 'string') req.params.id = '';
  const doc = await db
    .collection('animals')
    .findOne({ _id: new ObjectId(req.params.id) });
  if (doc.photo) {
    fse.remove(path.join('public', 'uploaded-photos', doc.photo));
  }
  db.collection('animals').deleteOne({ _id: new ObjectId(req.params.id) });
  res.send('Pet was deleted from your collection');
});

app.post(
  '/update-animal',
  passwordProtected,
  upload.single('photo'),
  ourCleanup,
  async (req, res) => {
    if (req.file) {
      // if they are uploaded the new photo
      const photoFileName = `${Date.now()}.jpg`;
      await sharp(req.file.buffer)
        .resize(844, 456)
        .jpeg({ quality: 60 })
        .toFile(path.join('public', 'uploaded-photos', photoFileName));
      req.cleanData.photo = photoFileName;
      const info = await db
        .collection('animals')
        .findOneAndUpdate(
          { _id: new ObjectId(req.body._id) },
          { $set: req.cleanData }
        );
      if (info.value.photo) {
        fse.remove(path.join('public', 'uploaded-photos', info.value.photo));
      }
      res.send(photoFileName);
    } else {
      // if they are not uploaded the new photo
      db.collection('animals').findOneAndUpdate(
        { _id: new ObjectId(req.body._id) },
        { $set: req.cleanData }
      );
      res.send(false);
    }
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
