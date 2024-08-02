'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Button, Modal, TextField, AppBar, Toolbar, Container, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, doc, getDocs, query, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from './login';
import Signup from './SignUp';
import Logout from './SignOut';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(0);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      const q = query(collection(firestore, 'inventory'));
      const querySnapshot = await getDocs(q);
      const itemsArray = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemsArray);
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) fetchItems();
      else setItems([]);
    });

    return unsubscribe;
  }, []);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setItemName('');
    setItemQuantity(0);
    setCurrentItemId(null);
  };

  const handleSave = async () => {
    if (currentItemId) {
      await setDoc(doc(firestore, 'inventory', currentItemId), {
        name: itemName,
        quantity: itemQuantity,
      });
    } else {
      await setDoc(doc(firestore, 'inventory', new Date().toISOString()), {
        name: itemName,
        quantity: itemQuantity,
      });
    }

    const q = query(collection(firestore, 'inventory'));
    const querySnapshot = await getDocs(q);
    const itemsArray = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setItems(itemsArray);
    handleClose();
  };

  const handleEdit = async (id) => {
    const docRef = doc(firestore, 'inventory', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const item = docSnap.data();
      setItemName(item.name);
      setItemQuantity(item.quantity);
      setCurrentItemId(id);
      setOpen(true);
    }
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(firestore, 'inventory', id));

    const q = query(collection(firestore, 'inventory'));
    const querySnapshot = await getDocs(q);
    const itemsArray = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setItems(itemsArray);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box>
      {!user ? (
        isLogin ? <Login toggleAuth={() => setIsLogin(false)} /> : <Signup toggleAuth={() => setIsLogin(true)} />
      ) : (
        <>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Inventory Management
              </Typography>
              <Logout />
              <Button color="inherit" onClick={handleOpen} startIcon={<AddIcon />}>Add Item</Button>
            </Toolbar>
          </AppBar>
          <Container>
            <TextField
              label="Search Items"
              variant="outlined"
              fullWidth
              sx={{ mt: 4 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleEdit(item.id)} color="primary"><EditIcon /></IconButton>
                        <IconButton onClick={() => handleDelete(item.id)} color="secondary"><DeleteIcon /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Container>

          <Modal open={open} onClose={handleClose}>
            <Box sx={style}>
              <TextField
                label="Item Name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
              <TextField
                label="Quantity"
                type="number"
                value={itemQuantity}
                onChange={(e) => setItemQuantity(parseInt(e.target.value))}
              />
              <Button onClick={handleSave} variant="contained" color="primary">Save</Button>
            </Box>
          </Modal>
        </>
      )}
    </Box>
  );
}
