import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';
import { useUser } from '../context/UserContext';
import { WhiteboardToolbar } from '../component/whiteboard/WhiteboardToolbar';
import { StickyNote } from '../component/whiteboard/StickyNote';
import { CollaboratorCursors } from '../component/whiteboard/CollaboratorCursors';
import { SavedBoardsDrawer } from '../component/whiteboard/SavedBoardsDrawer';

export default function WhiteboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);

  // Board state
  const [boardId, setBoardId] = useState(id || null);
  const [boardTitle, setBoardTitle] = useState('My Creative Board');
  const [elements, setElements] = useState([]);
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [stickyNotes, setStickyNotes] = useState([]);
  const [savedBoards, setSavedBoards] = useState([]);
  const [isSavedBoardsOpen, setIsSavedBoardsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Active drawing tool states
  const [activeTool, setActiveTool] = useState('pen'); // 'pen' | 'pencil' | 'highlighter' | 'eraser' | 'shape' | 'text' | 'hand'
  const [activeShape, setActiveShape] = useState('rectangle'); // 'rectangle' | 'circle' | 'triangle' | 'star' | 'diamond' | 'line' | 'arrow'
  const [color, setColor] = useState('#A855F7');
  const [strokeWidth, setStrokeWidth] = useState(5);

  // Canvas zoom & pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const startPanRef = useRef({ x: 0, y: 0 });

  // Multiplayer collaboration states
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [collaboratorCursors, setCollaboratorCursors] = useState({});

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const currentElementRef = useRef(null);

  // Text input placement state
  const [textInputPos, setTextInputPos] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');

  // 1. Initialize Board or Load Existing Board
  useEffect(() => {
    const initBoard = async () => {
      try {
        setIsLoading(true);

        if (id) {
          const res = await api.get(`/whiteboard/${id}`);
          const b = res.data.board;
          setBoardId(b._id);
          setBoardTitle(b.title || 'Collaborative Whiteboard');

          const loadedElements = b.elements || [];
          setElements(loadedElements);
          setHistory([loadedElements]);

          // Separate sticky notes if any
          const stickies = loadedElements.filter((el) => el.type === 'sticky');
          setStickyNotes(stickies);
        } else {
          // If no ID in route, fetch user's recent board or create a fresh one
          try {
            const listRes = await api.get('/whiteboard');
            const boards = listRes.data.boards || [];
            setSavedBoards(boards);

            if (boards.length > 0) {
              const latest = boards[0];
              const detailRes = await api.get(`/whiteboard/${latest._id}`);
              const b = detailRes.data.board;
              setBoardId(b._id);
              setBoardTitle(b.title);
              setElements(b.elements || []);
              setHistory([b.elements || []]);
            } else {
              // Create default board
              const createRes = await api.post('/whiteboard', {
                title: 'My First Whiteboard',
                elements: [],
              });
              setBoardId(createRes.data.board._id);
              setBoardTitle(createRes.data.board.title);
            }
          } catch (e) {
            // Local fallback board
            setBoardId('local-board');
          }
        }
      } catch (err) {
        console.error('Error initializing whiteboard:', err);
        toast.error('Failed to load whiteboard');
      } finally {
        setIsLoading(false);
      }
    };

    initBoard();
  }, [id]);

  // Fetch list of saved boards
  const refreshSavedBoards = async () => {
    try {
      const res = await api.get('/whiteboard');
      setSavedBoards(res.data.boards || []);
    } catch (err) {
      // Ignore
    }
  };

  useEffect(() => {
    refreshSavedBoards();
  }, []);

  // 2. Connect to Socket.io namespace for real-time collaboration
  useEffect(() => {
    if (!boardId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';
    const socket = io(`${socketUrl}/whiteboard`, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join_board', {
      boardId,
      user: {
        id: user?.id || user?._id || socket.id,
        name: user?.name || 'Artist',
      },
    });

    socket.on('board_users_update', ({ users }) => {
      setActiveCollaborators(users || []);
    });

    socket.on('cursor_updated', ({ socketId, x, y, name, color }) => {
      setCollaboratorCursors((prev) => ({
        ...prev,
        [socketId]: { x, y, name, color },
      }));
    });

    socket.on('cursor_removed', ({ socketId }) => {
      setCollaboratorCursors((prev) => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    socket.on('element_added', ({ element }) => {
      setElements((prev) => [...prev, element]);
    });

    socket.on('elements_synced', ({ elements: synced }) => {
      setElements(synced || []);
    });

    socket.on('canvas_cleared', () => {
      setElements([]);
      setStickyNotes([]);
    });

    return () => {
      socket.emit('leave_board');
      socket.disconnect();
    };
  }, [boardId, user]);

  // 3. Render Canvas Elements
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply pan & zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid background pattern
    drawGrid(ctx, canvas.width / zoom, canvas.height / zoom, pan, zoom);

    // Render stored elements
    elements.forEach((el) => {
      drawElement(ctx, el);
    });

    // Render live active drawing element
    if (currentElementRef.current) {
      drawElement(ctx, currentElementRef.current);
    }

    ctx.restore();
  }, [elements, zoom, pan]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Canvas resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  // Draw Grid dots
  const drawGrid = (ctx, width, height, pan, zoom) => {
    const gridSize = 32;
    const dotRadius = 1;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';

    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
    const endX = startX + width + gridSize * 2;
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
    const endY = startY + height + gridSize * 2;

    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  // Draw individual element
  const drawElement = (ctx, el) => {
    ctx.save();
    ctx.strokeStyle = el.color || '#A855F7';
    ctx.fillStyle = el.color || '#A855F7';
    ctx.lineWidth = el.strokeWidth || 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (el.tool === 'highlighter') {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = (el.strokeWidth || 10) * 2;
    } else if (el.tool === 'pencil') {
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = Math.max(1, (el.strokeWidth || 2) * 0.5);
    } else {
      ctx.globalAlpha = 1;
    }

    if (el.tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = (el.strokeWidth || 10) * 3;
    }

    if (el.type === 'stroke') {
      const points = el.points || [];
      if (points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (el.type === 'shape') {
      const { shape, startX, startY, endX, endY } = el;
      const w = endX - startX;
      const h = endY - startY;

      ctx.beginPath();

      if (shape === 'rectangle') {
        ctx.strokeRect(startX, startY, w, h);
      } else if (shape === 'circle') {
        const radiusX = Math.abs(w / 2);
        const radiusY = Math.abs(h / 2);
        const centerX = startX + w / 2;
        const centerY = startY + h / 2;
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (shape === 'triangle') {
        ctx.moveTo(startX + w / 2, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX, endY);
        ctx.closePath();
        ctx.stroke();
      } else if (shape === 'star') {
        drawStar(ctx, startX + w / 2, startY + h / 2, 5, Math.abs(w / 2), Math.abs(w / 4));
        ctx.stroke();
      } else if (shape === 'line') {
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      } else if (shape === 'arrow') {
        drawArrow(ctx, startX, startY, endX, endY);
      }
    } else if (el.type === 'text') {
      ctx.font = `${el.fontSize || 20}px sans-serif`;
      ctx.fillText(el.text, el.x, el.y);
    } else if (el.type === 'image' && el.imgElement) {
      ctx.drawImage(el.imgElement, el.x, el.y, el.width, el.height);
    }

    ctx.restore();
  };

  // Draw star helper
  const drawStar = (ctx, cx, cy, spikes, outerRadius, innerRadius) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  };

  // Draw arrow helper
  const drawArrow = (ctx, fromx, fromy, tox, toy) => {
    const headlen = 14;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(fromx, fromy);
    ctx.lineTo(tox, toy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle - Math.PI / 6),
      toy - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(tox, toy);
    ctx.lineTo(
      tox - headlen * Math.cos(angle + Math.PI / 6),
      toy - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };

  // Convert screen coordinates to canvas world coordinates
  const getCanvasCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;

    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  };

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e) => {
    if (activeTool === 'hand' || e.button === 1 || e.spaceKey) {
      setIsPanning(true);
      startPanRef.current = {
        x: (e.touches ? e.touches[0].clientX : e.clientX) - pan.x,
        y: (e.touches ? e.touches[0].clientY : e.clientY) - pan.y,
      };
      return;
    }

    const coords = getCanvasCoords(e);

    if (activeTool === 'text') {
      setTextInputPos({ x: coords.x, y: coords.y });
      setTextInputValue('');
      return;
    }

    setIsDrawing(true);

    if (activeTool === 'pen' || activeTool === 'pencil' || activeTool === 'highlighter' || activeTool === 'eraser') {
      currentElementRef.current = {
        id: Date.now() + Math.random(),
        type: 'stroke',
        tool: activeTool,
        color,
        strokeWidth,
        points: [coords],
      };
    } else if (activeTool === 'shape') {
      currentElementRef.current = {
        id: Date.now() + Math.random(),
        type: 'shape',
        shape: activeShape,
        color,
        strokeWidth,
        startX: coords.x,
        startY: coords.y,
        endX: coords.x,
        endY: coords.y,
      };
    }
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);

    // Send cursor position to socket room for multiplayer tracking
    if (socketRef.current && boardId) {
      socketRef.current.emit('cursor_move', {
        boardId,
        x: coords.x,
        y: coords.y,
      });
    }

    // Pan handling
    if (isPanning) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPan({
        x: clientX - startPanRef.current.x,
        y: clientY - startPanRef.current.y,
      });
      return;
    }

    if (!isDrawing || !currentElementRef.current) return;

    if (currentElementRef.current.type === 'stroke') {
      currentElementRef.current.points.push(coords);
    } else if (currentElementRef.current.type === 'shape') {
      currentElementRef.current.endX = coords.x;
      currentElementRef.current.endY = coords.y;
    }

    redrawCanvas();
  };

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing || !currentElementRef.current) return;

    const finishedElement = currentElementRef.current;
    setIsDrawing(false);
    currentElementRef.current = null;

    const newElements = [...elements, finishedElement];
    setElements(newElements);
    setHistory((prev) => [...prev, newElements]);
    setRedoStack([]);

    // Broadcast element to active multiplayer collaborators
    if (socketRef.current && boardId) {
      socketRef.current.emit('draw_element', {
        boardId,
        element: finishedElement,
      });
    }

    redrawCanvas();
  };

  // Submit Text Input on canvas
  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInputValue.trim() || !textInputPos) {
      setTextInputPos(null);
      return;
    }

    const textEl = {
      id: Date.now() + Math.random(),
      type: 'text',
      text: textInputValue.trim(),
      x: textInputPos.x,
      y: textInputPos.y,
      color,
      fontSize: 24,
    };

    const newElements = [...elements, textEl];
    setElements(newElements);
    setHistory((prev) => [...prev, newElements]);
    setTextInputPos(null);
    setTextInputValue('');

    if (socketRef.current && boardId) {
      socketRef.current.emit('draw_element', {
        boardId,
        element: textEl,
      });
    }
  };

  // Sticky Notes Handling
  const handleAddStickyNote = (stickyColor = 'yellow') => {
    const newNote = {
      id: 'sticky_' + Date.now(),
      type: 'sticky',
      color: stickyColor,
      text: '',
      x: (-pan.x + 250) / zoom,
      y: (-pan.y + 200) / zoom,
      width: 180,
      height: 160,
    };

    setStickyNotes((prev) => [...prev, newNote]);
    toast.success('Sticky note added! Type your thoughts.');
  };

  const handleUpdateStickyText = (noteId, newText) => {
    setStickyNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, text: newText } : n))
    );
  };

  const handleDeleteSticky = (noteId) => {
    setStickyNotes((prev) => prev.filter((n) => n.id !== noteId));
  };

  // Sticky Drag Handling
  const handleStickyDragStart = (e, noteId) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const note = stickyNotes.find((n) => n.id === noteId);
    if (!note) return;

    const initialNoteX = note.x;
    const initialNoteY = note.y;

    const onMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - startX) / zoom;
      const dy = (moveEvent.clientY - startY) / zoom;
      setStickyNotes((prev) =>
        prev.map((n) =>
          n.id === noteId
            ? { ...n, x: initialNoteX + dx, y: initialNoteY + dy }
            : n
        )
      );
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Image Upload on Canvas
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const width = 300;
        const height = width / aspect;

        const imgEl = {
          id: Date.now() + Math.random(),
          type: 'image',
          imgElement: img,
          mediaUrl: reader.result,
          x: (-pan.x + 200) / zoom,
          y: (-pan.y + 150) / zoom,
          width,
          height,
        };

        const newElements = [...elements, imgEl];
        setElements(newElements);
        setHistory((prev) => [...prev, newElements]);

        if (socketRef.current && boardId) {
          socketRef.current.emit('draw_element', {
            boardId,
            element: imgEl,
          });
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Undo / Redo
  const handleUndo = () => {
    if (elements.length === 0) return;

    const lastElement = elements[elements.length - 1];
    setRedoStack((prev) => [...prev, lastElement]);

    const newElements = elements.slice(0, -1);
    setElements(newElements);

    if (socketRef.current && boardId) {
      socketRef.current.emit('undo_canvas', { boardId });
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;

    const elementToRestore = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));

    const newElements = [...elements, elementToRestore];
    setElements(newElements);

    if (socketRef.current && boardId) {
      socketRef.current.emit('draw_element', {
        boardId,
        element: elementToRestore,
      });
    }
  };

  // Clear Canvas
  const handleClear = () => {
    if (elements.length === 0 && stickyNotes.length === 0) return;
    if (window.confirm('Clear all drawings and sticky notes on this board?')) {
      setElements([]);
      setStickyNotes([]);
      setRedoStack([]);
      if (socketRef.current && boardId) {
        socketRef.current.emit('clear_canvas', { boardId });
      }
      toast.success('Canvas cleared');
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Save Board to Cloud
  const handleSaveBoard = async () => {
    if (!boardId || boardId === 'local-board') {
      try {
        setIsSaving(true);
        const res = await api.post('/whiteboard', {
          title: boardTitle,
          elements,
        });
        setBoardId(res.data.board._id);
        toast.success('Board saved to cloud!');
        refreshSavedBoards();
      } catch (err) {
        toast.error('Failed to save board');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    try {
      setIsSaving(true);
      await api.put(`/whiteboard/${boardId}`, {
        title: boardTitle,
        elements,
      });
      toast.success('Board saved!');
      refreshSavedBoards();
    } catch (err) {
      toast.error('Failed to save board');
    } finally {
      setIsSaving(false);
    }
  };

  // Export as PNG
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${boardTitle.replace(/\s+/g, '_')}_whiteboard.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Exported whiteboard as PNG');
  };

  // Share board invitation link
  const handleShareBoard = () => {
    const shareUrl = `${window.location.origin}/whiteboard/${boardId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Board collaboration link copied to clipboard!');
  };

  // Create new board
  const handleCreateNewBoard = async () => {
    try {
      const res = await api.post('/whiteboard', {
        title: 'New Whiteboard',
        elements: [],
      });
      const newBoard = res.data.board;
      setBoardId(newBoard._id);
      setBoardTitle(newBoard.title);
      setElements([]);
      setStickyNotes([]);
      setHistory([]);
      setRedoStack([]);
      navigate(`/whiteboard/${newBoard._id}`);
      refreshSavedBoards();
      toast.success('New whiteboard created!');
    } catch (err) {
      toast.error('Failed to create new board');
    }
  };

  // Delete saved board
  const handleDeleteBoard = async (delId) => {
    if (!window.confirm('Are you sure you want to delete this board?')) return;
    try {
      await api.delete(`/whiteboard/${delId}`);
      toast.success('Board deleted');
      refreshSavedBoards();
      if (delId === boardId) {
        handleCreateNewBoard();
      }
    } catch (err) {
      toast.error('Failed to delete board');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-gray-200">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
        <p className="text-sm text-gray-400">Loading collaborative canvas...</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-[#0B0B0F] overflow-hidden select-none"
    >
      {/* Hidden file input for placing images */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Floating Toolbar */}
      <WhiteboardToolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeShape={activeShape}
        setActiveShape={setActiveShape}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        canUndo={elements.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        zoom={zoom}
        onSave={handleSaveBoard}
        onExport={handleExportPNG}
        onShare={handleShareBoard}
        onOpenSavedBoards={() => setIsSavedBoardsOpen(true)}
        onAddStickyNote={handleAddStickyNote}
        onImageUpload={() => fileInputRef.current?.click()}
        activeCollaborators={activeCollaborators}
        isSaving={isSaving}
        boardTitle={boardTitle}
        onTitleChange={setBoardTitle}
      />

      {/* Multiplayer Live Cursors Overlay */}
      <CollaboratorCursors
        cursors={collaboratorCursors}
        zoom={zoom}
        pan={pan}
      />

      {/* Interactive Sticky Notes Overlay */}
      {stickyNotes.map((note) => (
        <StickyNote
          key={note.id}
          note={{
            ...note,
            x: note.x * zoom + pan.x,
            y: note.y * zoom + pan.y,
          }}
          zoom={zoom}
          onUpdateText={handleUpdateStickyText}
          onDelete={handleDeleteSticky}
          onDragStart={handleStickyDragStart}
        />
      ))}

      {/* Text Input Modal Popover on Canvas Click */}
      {textInputPos && (
        <form
          onSubmit={handleTextSubmit}
          style={{
            position: 'absolute',
            left: `${textInputPos.x * zoom + pan.x}px`,
            top: `${textInputPos.y * zoom + pan.y}px`,
          }}
          className="z-50 bg-card p-2 rounded-2xl border border-primary shadow-2xl flex items-center gap-2"
        >
          <input
            type="text"
            autoFocus
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            placeholder="Type text and press enter..."
            className="bg-input text-white text-sm px-3 py-1.5 rounded-xl border border-border focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 gradient-primary text-white text-xs font-semibold rounded-xl"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setTextInputPos(null)}
            className="px-2 py-1.5 text-xs text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </form>
      )}

      {/* Main Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        style={{
          cursor:
            activeTool === 'hand'
              ? isPanning
                ? 'grabbing'
                : 'grab'
              : activeTool === 'text'
              ? 'text'
              : 'crosshair',
        }}
        className="w-full h-full block"
      />

      {/* Saved Boards Drawer */}
      <SavedBoardsDrawer
        isOpen={isSavedBoardsOpen}
        onClose={() => setIsSavedBoardsOpen(false)}
        boards={savedBoards}
        currentBoardId={boardId}
        onSelectBoard={(selectedId) => {
          navigate(`/whiteboard/${selectedId}`);
        }}
        onCreateNewBoard={handleCreateNewBoard}
        onDeleteBoard={handleDeleteBoard}
      />
    </div>
  );
}
