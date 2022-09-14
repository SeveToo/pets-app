import ReactDOMServer from 'react-dom/server';
import React from 'react';
import AnimalCard from './src/components/AnimalCard.js';

export const homePageRoute = async (req, res) => {
  const allAnimals = await db.collection('animals').find().toArray();
  const generatedHTML = ReactDOMServer.renderToString(
    <div className="container">
      {!allAnimals.length && (
        <p>There are no animals yet, the admin needs to add a few.</p>
      )}
      <div className="animal-grid mb-3">
        {allAnimals.map((animal) => (
          <AnimalCard
            key={animal._id}
            name={animal.name}
            species={animal.species}
            photo={animal.photo}
            id={animal._id}
            readOnly={true}
          />
        ))}
      </div>
      <p>
        <a href="/admin">Login / manage the animal listings.</a>
      </p>
    </div>
  );
  res.render('home', { generatedHTML });
};
