'use client';

import React, { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const ItemTypes = {
  REQUEST: 'request',
};

type QueueType = 'reguler' | 'fast-track' | 'vip';

interface Request {
  id: string;
  type: QueueType;
  text: string;
}

interface DraggableRequestProps {
  request: Request;
  index: number;
  moveRequest: (dragIndex: number, hoverIndex: number) => void;
  editRequest: (id: string, newText: string, newType: QueueType) => void;
  prioritizeRequest: (id: string) => void;
  deleteRequest: (id: string) => void;
}

const DraggableRequest: React.FC<DraggableRequestProps> = ({
  request,
  index,
  moveRequest,
  editRequest,
  prioritizeRequest,
  deleteRequest,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(request.text);
  const [editType, setEditType] = useState<QueueType>(request.type);

  const [, drop] = useDrop({
    accept: ItemTypes.REQUEST,
    hover(item: { index: number }, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRequest(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.REQUEST,
    item: { id: request.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  const handleSave = () => {
    editRequest(request.id, editText, editType);
    setIsEditing(false);
  };

  const typeColors: Record<QueueType, string> = {
    reguler: 'bg-blue-100 text-blue-800 border-blue-300',
    'fast-track': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    vip: 'bg-red-100 text-red-800 border-red-300',
  };

  return (
    <div
      ref={ref}
      className={`border-2 rounded p-3 mb-2 cursor-move flex justify-between items-center ${typeColors[request.type]} ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex-1">
        {isEditing ? (
          <>
            <select
              value={editType}
              onChange={(e) => setEditType(e.target.value as QueueType)}
              className="mr-3 p-1 border rounded"
            >
              <option value="reguler">Reguler</option>
              <option value="fast-track">Fast Track</option>
              <option value="vip">VIP</option>
            </select>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="p-1 border rounded w-3/4"
            />
          </>
        ) : (
          <>
            <span className="inline-block mr-3 font-semibold">{request.type}</span>
            <span>{request.text}</span>
          </>
        )}
      </div>
      <div className="flex gap-2 ml-4">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-3 py-1 rounded"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-3 py-1 rounded"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => prioritizeRequest(request.id)}
              className="bg-purple-500 text-white px-3 py-1 rounded"
            >
              Prioritize
            </button>
            <button
              onClick={() => deleteRequest(request.id)}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default function Page() {
  const [queueType, setQueueType] = useState<QueueType>('reguler');
  const [requestText, setRequestText] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);


  const addRequest = () => {
    if (!requestText.trim()) return;
    setRequests((prev) => [
      ...prev,
      { id: Date.now().toString(), type: queueType, text: requestText.trim() },
    ]);
    setRequestText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRequest();
  };

  const moveRequest = (dragIndex: number, hoverIndex: number) => {
    setRequests((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, removed);
      return updated;
    });
  };

  const editRequest = (id: string, newText: string, newType: QueueType) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, text: newText, type: newType } : req))
    );
  };

  const prioritizeRequest = (id: string) => {
    setRequests((prev) => {
      const index = prev.findIndex((req) => req.id === id);
      if (index <= 0) return prev;
      const updated = [...prev];
      const [item] = updated.splice(index, 1);
      updated.unshift(item);
      return updated;
    });
  };

  const deleteRequest = (id: string) => {
    setRequests((prev) => prev.filter((req) => req.id !== id));
  };

  const nextQueue = () => {
    setRequests((prev) => (prev.length > 0 ? prev.slice(1) : prev));
  };

  const skipQueue = () => {
    setRequests((prev) => {
      if (prev.length <= 1) return prev;
      const [first, ...rest] = prev;
      return [...rest, first];
    });
  };

  const clearQueue = () => {
    setRequests([]);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="max-w-xl mx-auto p-6 bg-white rounded shadow mt-10">
        <h1 className="text-2xl font-bold mb-6 text-center">List Request</h1>

        <div className="flex items-center gap-4 mb-4">
          <div>
            <label htmlFor="queueType" className="block mb-1 font-semibold">
              Queue Type
            </label>
            <select
              id="queueType"
              value={queueType}
              onChange={(e) => setQueueType(e.target.value as QueueType)}
              className="border rounded p-2"
            >
              <option value="reguler">Reguler</option>
              <option value="fast-track">Fast Track</option>
              <option value="vip">VIP</option>
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="requestText" className="block mb-1 font-semibold">
              Add to Queue
            </label>
            <input
              id="requestText"
              type="text"
              value={requestText}
              onChange={(e) => setRequestText(e.target.value)}
              placeholder="Enter request"
              className="border rounded p-2 w-full"
            />
          </div>

          <button
            onClick={addRequest}
            className="bg-blue-600 text-white px-4 py-2 rounded mt-6"
          >
            Add
          </button>
        </div>

        <div className="flex gap-4 mb-4">
          <button
            onClick={nextQueue}
            className="bg-green-600 text-white px-4 py-2 rounded flex-1"
          >
            Next Queue
          </button>
          <button
            onClick={skipQueue}
            className="bg-yellow-500 text-white px-4 py-2 rounded flex-1"
          >
            Skip Queue
          </button>
          <button
            onClick={clearQueue}
            className="bg-red-600 text-white px-4 py-2 rounded flex-1"
          >
            Clear Queue
          </button>
        </div>

        <div>
          {requests.length === 0 ? (
            <p className="text-center text-gray-500">No requests in queue.</p>
          ) : (
            requests.map((request, index) => (
              <DraggableRequest
                key={request.id}
                request={request}
                index={index}
                moveRequest={moveRequest}
                editRequest={editRequest}
                prioritizeRequest={prioritizeRequest}
                deleteRequest={deleteRequest}
              />
            ))
          )}
        </div>

        <p className="mt-4 text-center text-gray-500 text-sm">
          Drag and drop items to reorder the queue. Click on items to edit them.
        </p>
      </div>
    </DndProvider>
  );
}
