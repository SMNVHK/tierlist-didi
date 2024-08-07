import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, update } from "firebase/database";
import './App.css';
import './TierList.css';

const firebaseConfig = {

  apiKey: "AIzaSyDCt4bLWo8OVYb7dO5Cjyin6VKa9czjuoo",

  authDomain: "bot-discord-c13ff.firebaseapp.com",

  databaseURL: "https://bot-discord-c13ff-default-rtdb.europe-west1.firebasedatabase.app/",

  projectId: "bot-discord-c13ff",

  storageBucket: "bot-discord-c13ff.appspot.com",

  messagingSenderId: "276543551497",

  appId: "1:276543551497:web:882ebf4a639941e77da0d8",

  measurementId: "G-854G1PH0RF"

};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const initialItems = {
  S: [],
  A: [],
  B: [],
  C: [],
  D: [],
  E: [],
  F: [],
  unranked: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'],
};

function App() {
  const [items, setItems] = useState(initialItems);
  const [newItemText, setNewItemText] = useState('');
  const [newItemImage, setNewItemImage] = useState('');

  useEffect(() => {
    const itemsRef = ref(database, 'items');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Assurez-vous que chaque tier est un tableau
        const validatedData = Object.entries(data).reduce((acc, [key, value]) => {
          acc[key] = Array.isArray(value) ? value : [];
          return acc;
        }, {});
        setItems(validatedData);
      } else {
        // Si aucune donnée n'est trouvée, utilisez initialItems
        setItems(initialItems);
      }
    }, (error) => {
      console.error("Erreur lors de la lecture des données:", error);
      // En cas d'erreur, utilisez initialItems
      setItems(initialItems);
    });

    return () => unsubscribe();
  }, []);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    const newItems = JSON.parse(JSON.stringify(items));
    const sourceItems = Array.isArray(newItems[source.droppableId]) ? newItems[source.droppableId] : [];
    const destItems = Array.isArray(newItems[destination.droppableId]) ? newItems[destination.droppableId] : [];
    const [reorderedItem] = sourceItems.splice(source.index, 1);
    destItems.splice(destination.index, 0, reorderedItem);
    
    newItems[source.droppableId] = sourceItems;
    newItems[destination.droppableId] = destItems;

    setItems(newItems);
    set(ref(database, 'items'), newItems);
  };

  const addNewItem = () => {
    if (newItemText.trim() === '' && newItemImage.trim() === '') return;

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: newItemText,
      image: newItemImage.trim() || null
    };

    const newItems = {...items, unranked: [...(items.unranked || []), newItem]};
    set(ref(database, 'items'), newItems);

    setNewItemText('');
    setNewItemImage('');
  };

  const resetTierList = () => {
    set(ref(database, 'items'), initialItems);
  };

  const tierColors = {
    S: '#ff7f7f', A: '#ffbf7f', B: '#ffdf7f', C: '#ffff7f',
    D: '#bfff7f', E: '#7fff7f', F: '#7fffff', unranked: '#e0e0e0',
  };

  return (
    <div className="App">
      <div className="tier-list">
        <h1>Discord Tier List</h1>
        
        <div className="add-item-form">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Enter item text"
          />
          <input
            type="text"
            value={newItemImage}
            onChange={(e) => setNewItemImage(e.target.value)}
            placeholder="Enter image URL (optional)"
          />
          <button onClick={addNewItem}>Add Item</button>
          <button onClick={resetTierList} className="reset-button">Reset Tier List</button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(items).map(([tier, tierItems]) => (
            <Droppable key={tier} droppableId={tier} direction="horizontal">
              {(provided, snapshot) => (
                <div className="tier">
                  <div className="tier-label" style={{ backgroundColor: tierColors[tier] }}>
                    {tier}
                  </div>
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`tier-items ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                  >
                    {Array.isArray(tierItems) && tierItems.map((item, index) => (
                      <Draggable key={item.id || `${tier}-${index}`} draggableId={item.id || `${tier}-${index}`} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`tier-item ${snapshot.isDragging ? 'dragging' : ''}`}
                          >
                            {item.image ? (
                              <img src={item.image} alt={item.content} className="item-image" />
                            ) : (
                              item.content || item
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;