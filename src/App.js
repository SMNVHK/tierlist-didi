import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
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

const DEFAULT_TIERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'unranked'];

const initialTiers = DEFAULT_TIERS.reduce((acc, tier) => {
  acc[tier] = [];
  return acc;
}, {});

const DEFAULT_COLORS = {
  S: '#ff7f7f', A: '#ffbf7f', B: '#ffdf7f', C: '#ffff7f',
  D: '#bfff7f', E: '#7fff7f', F: '#7fffff', unranked: '#e0e0e0',
};

function App() {
  const [items, setItems] = useState(initialTiers);
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [tierColors, setTierColors] = useState(DEFAULT_COLORS);
  const [newItemText, setNewItemText] = useState('');
  const [newItemImage, setNewItemImage] = useState('');

  useEffect(() => {
    const itemsRef = ref(database, 'items');
    const tiersRef = ref(database, 'tiers');
    const colorsRef = ref(database, 'colors');
    
    onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setItems(data);
    });

    onValue(tiersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setTiers(data);
    });

    onValue(colorsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setTierColors(data);
    });
  }, []);

  const onDragEnd = useCallback((result) => {
    const { source, destination } = result;
    if (!destination) return;

    const newItems = {...items};
    const [reorderedItem] = newItems[source.droppableId].splice(source.index, 1);
    newItems[destination.droppableId].splice(destination.index, 0, reorderedItem);

    setItems(newItems);
    set(ref(database, 'items'), newItems);
  }, [items]);

  const addNewItem = useCallback(() => {
    if (newItemText.trim() === '' && newItemImage.trim() === '') return;

    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: newItemText,
      image: newItemImage.trim() || null
    };

    const newItems = {...items, unranked: [...items.unranked, newItem]};
    setItems(newItems);
    set(ref(database, 'items'), newItems);

    setNewItemText('');
    setNewItemImage('');
  }, [items, newItemText, newItemImage]);

  const resetTierList = useCallback(() => {
    setItems(initialTiers);
    setTiers(DEFAULT_TIERS);
    setTierColors(DEFAULT_COLORS);
    set(ref(database, 'items'), initialTiers);
    set(ref(database, 'tiers'), DEFAULT_TIERS);
    set(ref(database, 'colors'), DEFAULT_COLORS);
  }, []);

  const handleTierNameChange = useCallback((oldName, newName) => {
    if (oldName === newName) return;

    const newTiers = tiers.map(t => t === oldName ? newName : t);
    setTiers(newTiers);

    const newItems = {...items};
    newItems[newName] = newItems[oldName];
    delete newItems[oldName];
    setItems(newItems);

    const newTierColors = {...tierColors, [newName]: tierColors[oldName]};
    setTierColors(newTierColors);

    set(ref(database, 'tiers'), newTiers);
    set(ref(database, 'items'), newItems);
    set(ref(database, 'colors'), newTierColors);
  }, [tiers, items, tierColors]);

  const TierItem = React.memo(({ item }) => (
    <div className="tier-item">
      {item.image ? (
        <img src={item.image} alt={item.content} className="item-image" />
      ) : (
        <span>{item.content}</span>
      )}
    </div>
  ));

  const TierRow = React.memo(({ tier, items, tierColor }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tierName, setTierName] = useState(tier);

    const handleNameChange = (e) => {
      setTierName(e.target.value);
    };

    const handleNameSubmit = () => {
      handleTierNameChange(tier, tierName);
      setIsEditing(false);
    };

    return (
      <div className="tier">
        <div 
          className="tier-label" 
          style={{ backgroundColor: tierColor }}
          onDoubleClick={() => setIsEditing(true)}
        >
          {isEditing ? (
            <input
              type="text"
              value={tierName}
              onChange={handleNameChange}
              onBlur={handleNameSubmit}
              onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
              autoFocus
            />
          ) : (
            tierName
          )}
        </div>
        <Droppable droppableId={tier} direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="tier-items"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TierItem item={item} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  });

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
          {tiers.map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              items={items[tier] || []}
              tierColor={tierColors[tier]}
            />
          ))}
        </DragDropContext>
      </div>
    </div>
  );
}

export default App;