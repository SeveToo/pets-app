import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Axios from 'axios';
import CreateNewForm from './components/CreateNewForm.js';
import AnimalCard from './components/AnimalCard.js';
import Navbar from './components/Navbar.js';

const App = () => {
  const [animals, setAnimals] = useState([]);

  useEffect(() => {
    async function go() {
      const response = await Axios.get(`/api/animals`);
      setAnimals(response.data);
    }
    go();
  }, []);

  return (
    <div className="container">
      <Navbar />
      <CreateNewForm setAnimals={setAnimals} />
      <div className="animal-grid">
        {animals.map((animal) => {
          return (
            <AnimalCard
              key={animal._id}
              name={animal.name}
              species={animal.species}
              photo={animal.photo}
              id={animal._id}
              setAnimals={setAnimals}
            />
          );
        })}
      </div>
    </div>
  );
};

const appRoot = document.querySelector('#app');
const root = createRoot(appRoot);
root.render(<App />);
