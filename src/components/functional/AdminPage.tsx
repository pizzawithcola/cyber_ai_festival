import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  styled,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  IconButton,
  useTheme,
  TableSortLabel,
  InputAdornment,
} from '@mui/material';
import { Close, ArrowUpward, Search } from '@mui/icons-material';
import Header from '../common/Header';
import { getStoredUser } from '../../utils/userStorage';
import { COUNTRIES } from '../common/Countries';

// User score interface
interface UserScore {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  region: string;
  game1_score: number;
  game2_score: number;
  game3_score: number;
  game4_score: number;
  game5_score: number;
  total_score: number;
}

// Styled components for consistent styling
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  background: theme.palette.mode === 'light'
    ? `linear-gradient(145deg, ${theme.palette.grey[50]}, ${theme.palette.common.white})`
    : `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[800]})`,
  borderRadius: '16px',
  border: `1px solid ${
    theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.05)'
  }`,
  boxShadow: theme.palette.mode === 'dark'
    ? `0 8px 32px rgba(0,0,0,0.3)`
    : `0 8px 32px rgba(0,0,0,0.1)`,
  backdropFilter: 'blur(4px)',
}));

const EditableCell = styled(TableCell)(({ theme }) => ({
  cursor: 'default',
  transition: 'background-color 0.2s ease',
  maxWidth: 150,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const AdminPage: React.FC = () => {
  const theme = useTheme();
  const [users, setUsers] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserScore | null>(null);
  const [formData, setFormData] = useState<Omit<UserScore, 'id' | 'total_score'>>({
    firstname: '',
    lastname: '',
    email: '',
    region: 'United States',
    game1_score: 0,
    game2_score: 0,
    game3_score: 0,
    game4_score: 0,
    game5_score: 0,
  });
  
  // Sorting state
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [orderBy, setOrderBy] = useState<string>('id');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  const user = getStoredUser();

  // Fetch user scores
  useEffect(() => {
    const fetchUserScores = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8848/users/userscores');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: UserScore[] = await response.json();
        setUsers(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user scores:', err);
        setError('Failed to load user scores. Please try again later.');
        setSnackbar({
          open: true,
          message: 'Failed to load user scores: ' + (err instanceof Error ? err.message : 'Unknown error'),
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserScores();
  }, []);

  // Handle page change
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle sort request
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Compare function for sorting
  const descendingComparator = <T,>(a: T, b: T, orderBy: keyof T) => {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  };

  // Get comparator for sorting
  const getComparator = (
    order: 'asc' | 'desc',
    orderBy: string
  ): ((a: UserScore, b: UserScore) => number) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy as keyof UserScore)
      : (a, b) => -descendingComparator(a, b, orderBy as keyof UserScore);
  };



  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle user selection for deletion
  const handleSelectUser = (id: number) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(userId => userId !== id) 
        : [...prev, id]
    );
  };

  // Handle select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(user => user.id));
    }
  };

  // Handle Add button click
  const handleAddClick = () => {
    setFormData({
      firstname: '',
      lastname: '',
      email: '',
      region: 'US',
      game1_score: 0,
      game2_score: 0,
      game3_score: 0,
      game4_score: 0,
      game5_score: 0,
    });
    setOpenAddDialog(true);
  };

  // Handle Delete button click - opens confirmation dialog
  const handleDeleteClick = () => {
    if (selectedUsers.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please select at least one user to delete',
        severity: 'error'
      });
      return;
    }
    
    setOpenDeleteDialog(true);
  };

  // Confirm delete action
  const confirmDelete = async () => {
    try {
      // Delete users via API calls
      const deletePromises = selectedUsers.map(id => 
        fetch(`http://localhost:8848/users/${id}`, { method: 'DELETE' })
      );
      
      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(res => !res.ok);
      
      if (failedDeletes.length > 0) {
        throw new Error(`${failedDeletes.length} user(s) failed to delete`);
      }
      
      // Update local state after successful API calls
      setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      setSnackbar({
        open: true,
        message: `${selectedUsers.length} user(s) deleted successfully`,
        severity: 'success'
      });
      setOpenDeleteDialog(false);
    } catch (err) {
      console.error('Failed to delete users:', err);
      setSnackbar({
        open: true,
        message: 'Failed to delete users: ' + (err instanceof Error ? err.message : 'Unknown error'),
        severity: 'error'
      });
      setOpenDeleteDialog(false);
    }
  };

  // Cancel delete dialog
  const cancelDelete = () => {
    setOpenDeleteDialog(false);
  };

  // Handle Edit dialog open
  const handleEditOpen = (userData: UserScore) => {
    setEditingUser(userData);
    setFormData({
      firstname: userData.firstname,
      lastname: userData.lastname,
      email: userData.email,
      region: userData.region,
      game1_score: userData.game1_score,
      game2_score: userData.game2_score,
      game3_score: userData.game3_score,
      game4_score: userData.game4_score,
      game5_score: userData.game5_score,
    });
    setOpenEditDialog(true);
  };

  // Handle Add dialog close
  const handleAddClose = () => {
    setOpenAddDialog(false);
  };

  // Handle Edit dialog close
  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditingUser(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('_score') ? parseFloat(value) || 0 : value
    }));
  };

  // Calculate total score
  const calculateTotalScore = (data: Omit<UserScore, 'id' | 'total_score'>): number => {
    return data.game1_score + data.game2_score + data.game3_score + data.game4_score + data.game5_score;
  };

  // Validate form data
  const validateForm = (): boolean => {
    if (!formData.firstname.trim()) {
      setSnackbar({
        open: true,
        message: 'First name is required',
        severity: 'error'
      });
      return false;
    }
    if (!formData.lastname.trim()) {
      setSnackbar({
        open: true,
        message: 'Last name is required',
        severity: 'error'
      });
      return false;
    }
    if (!formData.email.trim()) {
      setSnackbar({
        open: true,
        message: 'Email is required',
        severity: 'error'
      });
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setSnackbar({
        open: true,
        message: 'Email is invalid',
        severity: 'error'
      });
      return false;
    }
    // Validate scores are between 0 and 100 (inclusive) and are valid numbers
    const scores = [
      formData.game1_score,
      formData.game2_score,
      formData.game3_score,
      formData.game4_score,
      formData.game5_score
    ];
    
    for (const score of scores) {
      if (isNaN(score) || score < 0 || score > 100) {
        setSnackbar({
          open: true,
          message: 'All scores must be between 0 and 100',
          severity: 'error'
        });
        return false;
      }
    }
    
    return true;
  };

  // Handle form submit for editing
  const handleEditSubmit = async () => {
    if (!validateForm() || !editingUser) return;

    try {
      const userRes = await fetch(`http://localhost:8848/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          region: formData.region
        })
      });

      if (!userRes.ok) {
        throw new Error(`Failed to update user: ${userRes.status} ${userRes.statusText}`);
      }

      const scoresRes = await fetch(`http://localhost:8848/scores/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game1_score: formData.game1_score,
          game2_score: formData.game2_score,
          game3_score: formData.game3_score,
          game4_score: formData.game4_score,
          game5_score: formData.game5_score
        })
      });

      if (!scoresRes.ok) {
        throw new Error(`Failed to update scores: ${scoresRes.status} ${scoresRes.statusText}`);
      }

      // Update local state after successful API calls
      const updatedUsers = users.map(user => 
        user.id === editingUser.id 
          ? { 
              ...user, 
              ...formData,
              total_score: calculateTotalScore(formData)
            } 
          : user
      );
      setUsers(updatedUsers);
      
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success'
      });
      handleEditClose();
    } catch (err) {
      console.error('Failed to update user:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update user: ' + (err instanceof Error ? err.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };

  // Handle form submit for adding
  const handleAddSubmit = async () => {
    if (!validateForm()) return;

    try {
      const userRes = await fetch('http://localhost:8848/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          region: formData.region
        })
      });

      if (!userRes.ok) {
        throw new Error(`Failed to create user: ${userRes.status} ${userRes.statusText}`);
      }

      const newUser = await userRes.json();
      
      // Update scores for the newly created user
      const scoresRes = await fetch(`http://localhost:8848/scores/${newUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game1_score: formData.game1_score,
          game2_score: formData.game2_score,
          game3_score: formData.game3_score,
          game4_score: formData.game4_score,
          game5_score: formData.game5_score
        })
      });

      if (!scoresRes.ok) {
        throw new Error(`Failed to update scores: ${scoresRes.status} ${scoresRes.statusText}`);
      }

      // Update local state after successful API calls
      const newUserWithScores: UserScore = {
        id: newUser.id,
        ...formData,
        total_score: calculateTotalScore(formData)
      };
      
      setUsers(prev => [...prev, newUserWithScores]);
      
      setSnackbar({
        open: true,
        message: 'User added successfully',
        severity: 'success'
      });
      handleAddClose();
    } catch (err) {
      console.error('Failed to add user:', err);
      setSnackbar({
        open: true,
        message: 'Failed to add user: ' + (err instanceof Error ? err.message : 'Unknown error'),
        severity: 'error'
      });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.firstname.toLowerCase().includes(searchLower) ||
      user.lastname.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.region.toLowerCase().includes(searchLower)
    );
  });

  // Slice data for pagination
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Sort and paginate data
  const sortedUsers = [...paginatedUsers].sort(getComparator(order, orderBy));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading user scores...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Header
        title='Admin Dashboard - User Scores'
        firstname={user?.firstname}
        lastname={user?.lastname}
        countryCode={user?.countryCode}
      />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
        <Box sx={{ maxWidth: 1200, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {/* Action buttons and Search bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ 
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleAddClick}
            >
              Add
            </Button>
            <Button 
              variant="contained" 
              // color="secondary" 
              disabled={selectedUsers.length === 0}
              onClick={handleDeleteClick}
              sx={{ backgroundColor: '#ef1f1f' }}
            >
              Delete {selectedUsers.length > 0 && `(${selectedUsers.length})`}
            </Button>
          </Box>
          
          <StyledTableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="user scores table">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.length > 0 && selectedUsers.length === paginatedUsers.length}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < paginatedUsers.length}
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'firstname' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'firstname'}
                      direction={orderBy === 'firstname' ? order : 'asc'}
                      onClick={() => handleRequestSort('firstname')}
                      IconComponent={ArrowUpward}
                    >
                      First Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'lastname' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'lastname'}
                      direction={orderBy === 'lastname' ? order : 'asc'}
                      onClick={() => handleRequestSort('lastname')}
                      IconComponent={ArrowUpward}
                    >
                      Last Name
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'email' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'email'}
                      direction={orderBy === 'email' ? order : 'asc'}
                      onClick={() => handleRequestSort('email')}
                      IconComponent={ArrowUpward}
                    >
                      Email
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'region' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'region'}
                      direction={orderBy === 'region' ? order : 'asc'}
                      onClick={() => handleRequestSort('region')}
                      IconComponent={ArrowUpward}
                    >
                      Region
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'game1_score' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'game1_score'}
                      direction={orderBy === 'game1_score' ? order : 'asc'}
                      onClick={() => handleRequestSort('game1_score')}
                      IconComponent={ArrowUpward}
                    >
                      G1
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'game2_score' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'game2_score'}
                      direction={orderBy === 'game2_score' ? order : 'asc'}
                      onClick={() => handleRequestSort('game2_score')}
                      IconComponent={ArrowUpward}
                    >
                      G2
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'game3_score' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'game3_score'}
                      direction={orderBy === 'game3_score' ? order : 'asc'}
                      onClick={() => handleRequestSort('game3_score')}
                      IconComponent={ArrowUpward}
                    >
                      G3
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'game4_score' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'game4_score'}
                      direction={orderBy === 'game4_score' ? order : 'asc'}
                      onClick={() => handleRequestSort('game4_score')}
                      IconComponent={ArrowUpward}
                    >
                      G4
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'game5_score' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'game5_score'}
                      direction={orderBy === 'game5_score' ? order : 'asc'}
                      onClick={() => handleRequestSort('game5_score')}
                      IconComponent={ArrowUpward}
                    >
                      G5
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={orderBy === 'total_score' ? order : false}>
                    <TableSortLabel
                      active={orderBy === 'total_score'}
                      direction={orderBy === 'total_score' ? order : 'asc'}
                      onClick={() => handleRequestSort('total_score')}
                      IconComponent={ArrowUpward}
                    >
                      Total
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      }
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectUser(user.id);
                        }}
                      />
                    </TableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                    >
                      {user.firstname}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                    >
                      {user.lastname}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                    >
                      {user.email}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                    >
                      {user.region}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                      sx={{ color: user.game1_score >= 80 ? '#4caf50' : user.game1_score >= 60 ? '#ff9800' : '#f44336' }}
                    >
                      {user.game1_score}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                      sx={{ color: user.game2_score >= 80 ? '#4caf50' : user.game2_score >= 60 ? '#ff9800' : '#f44336' }}
                    >
                      {user.game2_score}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                      sx={{ color: user.game3_score >= 80 ? '#4caf50' : user.game3_score >= 60 ? '#ff9800' : '#f44336' }}
                    >
                      {user.game3_score}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                      sx={{ color: user.game4_score >= 80 ? '#4caf50' : user.game4_score >= 60 ? '#ff9800' : '#f44336' }}
                    >
                      {user.game4_score}
                    </EditableCell>
                    <EditableCell 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        handleEditOpen(user);
                      }}
                      sx={{ color: user.game5_score >= 80 ? '#4caf50' : user.game5_score >= 60 ? '#ff9800' : '#f44336' }}
                    >
                      {user.game5_score}
                    </EditableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: user.total_score >= 400 ? '#4caf50' : user.total_score >= 300 ? '#ff9800' : '#f44336' }}>
                      {user.total_score}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </StyledTableContainer>
          
          {/* Delete Confirmation Dialog */}
          <Dialog 
            open={openDeleteDialog} 
            onClose={cancelDelete}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Confirm Deletion
              <IconButton
                aria-label="close"
                onClick={cancelDelete}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1">
                Are you sure you want to delete {selectedUsers.length} user(s)? This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={cancelDelete}>Cancel</Button>
              <Button onClick={confirmDelete} variant="contained" color="error">
                Delete
              </Button>
            </DialogActions>
          </Dialog>
          
          {/* Edit Dialog */}
          <Dialog 
            open={openEditDialog} 
            onClose={handleEditClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Edit User
              <IconButton
                aria-label="close"
                onClick={handleEditClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    autoFocus
                    margin="dense"
                    name="firstname"
                    label="First Name"
                    fullWidth
                    variant="outlined"
                    value={formData.firstname}
                    onChange={handleInputChange}
                  />
                  <TextField
                    margin="dense"
                    name="lastname"
                    label="Last Name"
                    fullWidth
                    variant="outlined"
                    value={formData.lastname}
                    onChange={handleInputChange}
                  />
                </Box>
                <TextField
                  margin="dense"
                  name="email"
                  label="Email"
                  fullWidth
                  variant="outlined"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Region</InputLabel>
                  <Select
                    name="region"
                    value={formData.region}
                    label="Region"
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value as string }))}
                  >
                    {COUNTRIES.map((country) => (
                      <MenuItem key={country.code} value={country.name}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TextField
                    margin="dense"
                    name="game1_score"
                    label="Game 1 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                   variant="outlined"
                   value={formData.game1_score}
                   onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game2_score"
                    label="Game 2 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game2_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game3_score"
                    label="Game 3 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game3_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game4_score"
                    label="Game 4 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game4_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game5_score"
                    label="Game 5 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game5_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleEditClose}>Cancel</Button>
              <Button onClick={handleEditSubmit} variant="contained">Confirm</Button>
            </DialogActions>
          </Dialog>
          
          {/* Add Dialog */}
          <Dialog 
            open={openAddDialog} 
            onClose={handleAddClose}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Add New User
              <IconButton
                aria-label="close"
                onClick={handleAddClose}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    autoFocus
                    margin="dense"
                    name="firstname"
                    label="First Name *"
                    fullWidth
                    variant="outlined"
                    value={formData.firstname}
                    onChange={handleInputChange}
                  />
                  <TextField
                    margin="dense"
                    name="lastname"
                    label="Last Name *"
                    fullWidth
                    variant="outlined"
                    value={formData.lastname}
                    onChange={handleInputChange}
                  />
                </Box>
                <TextField
                  margin="dense"
                  name="email"
                  label="Email *"
                  fullWidth
                  variant="outlined"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Region *</InputLabel>
                  <Select
                    name="region"
                    value={formData.region}
                    label="Region *"
                    onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value as string }))}
                  >
                    {COUNTRIES.map((country) => (
                      <MenuItem key={country.code} value={country.name}>
                        {country.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <TextField
                    margin="dense"
                    name="game1_score"
                    label="Game 1 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                   variant="outlined"
                   value={formData.game1_score}
                   onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game2_score"
                    label="Game 2 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game2_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game3_score"
                    label="Game 3 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game3_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game4_score"
                    label="Game 4 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game4_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                  <TextField
                    margin="dense"
                    name="game5_score"
                    label="Game 5 Score"
                    type="number"
                    inputProps={{ 
                      min: 0, 
                      max: 100,
                      step: 0.1
                    }}
                    fullWidth
                    variant="outlined"
                    value={formData.game5_score}
                    onChange={handleInputChange}
                    sx={{ flex: '1 1 30%', minWidth: 100 }}
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleAddClose}>Cancel</Button>
              <Button onClick={handleAddSubmit} variant="contained">Confirm</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPage;