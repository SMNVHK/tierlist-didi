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

const TIERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];

const TierItem = React.memo(({ item, index }) => (
  <Draggable draggableId={item.id} index={index}>
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
          <span>{item.content}</span>
        )}
      </div>
    )}
  </Draggable>
));

const TierRow = React.memo(({ tier, items, tierColor }) => (
  <Droppable droppableId={tier} direction="horizontal">
    {(provided, snapshot) => (
      <div className="tier-row">
        <div className="tier-label" style={{ backgroundColor: tierColor }}>
          {tier}
        </div>
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`tier-items ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
        >
          {items.map((item, index) => (
            <TierItem key={item.id} item={item} index={index} />
          ))}
          {provided.placeholder}
        </div>
      </div>
    )}
  </Droppable>
));

function App() {
  const [items, setItems] = useState({});
  const [newItemText, setNewItemText] = useState('');
  const [newItemImage, setNewItemImage] = useState('');

  useEffect(() => {
    const itemsRef = ref(database, 'items');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  const onDragEnd = useCallback((result) => {
    const { source, destination } = result;
    if (!destination) return;

    const newItems = {...items};
    const sourceTier = newItems[source.droppableId] || [];
    const destTier = newItems[destination.droppableId] || [];
    const [movedItem] = sourceTier.splice(source.index, 1);
    destTier.splice(destination.index, 0, movedItem);

    newItems[source.droppableId] = sourceTier;
    newItems[destination.droppableId] = destTier;

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

    const newItems = {
      ...items,
      unranked: [...(items.unranked || []), newItem]
    };
    setItems(newItems);
    set(ref(database, 'items'), newItems);

    setNewItemText('');
    setNewItemImage('');
  }, [items, newItemText, newItemImage]);

  const resetTierList = useCallback(() => {
    const resetItems = { unranked: items.unranked || [] };
    setItems(resetItems);
    set(ref(database, 'items'), resetItems);
  }, [items.unranked]);

  const tierColors = {
    S: '#FF7F7F', A: '#FFBF7F', B: '#FFDF7F', C: '#FFFF7F',
    D: '#BFFF7F', E: '#7FFF7F', F: '#7FFFFF', unranked: '#E0E0E0'
  };

  return (
    <div className="app">
      <h1>Discord Tier List</h1>
      <div className="controls">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Enter item text"
          className="input-text"
        />
        <input
          type="text"
          value={newItemImage}
          onChange={(e) => setNewItemImage(e.target.value)}
          placeholder="Enter image URL (optional)"
          className="input-text"
        />
        <button onClick={addNewItem} className="btn btn-add">Add Item</button>
        <button onClick={resetTierList} className="btn btn-reset">Reset Tier List</button>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="tier-list">
          {TIERS.map((tier) => (
            <TierRow
              key={tier}
              tier={tier}
              items={items[tier] || []}
              tierColor={tierColors[tier]}
            />
          ))}
          <TierRow
            tier="unranked"
            items={items.unranked || []}
            tierColor={tierColors.unranked}
          />
        </div>
      </DragDropContext>
    </div>
  );
}

export default App;