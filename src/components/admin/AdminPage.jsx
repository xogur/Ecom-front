import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api from "../../api/api"

import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  TableContainer,
  Chip,
} from '@mui/material';

const AdminPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        console.log('서버 응답:', data); // 확인용 로그
        setUsers(data);
      } catch (err) {
        console.error('회원 조회 실패:', err);
      }
    };

    fetchUsers();
  }, []);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>회원 목록 (Admin)</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>사용자명</strong></TableCell>
              <TableCell><strong>이메일</strong></TableCell>
              <TableCell><strong>권한</strong></TableCell>
              <TableCell><strong>대표 주소</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(users) && users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.roles.map((role) => (
                    <Chip
                      key={role}
                      label={role.replace('ROLE_', '')}
                      size="small"
                      sx={{ mr: 0.5 }}
                      color={
                        role === 'ROLE_ADMIN'
                          ? 'error'
                          : role === 'ROLE_SELLER'
                          ? 'primary'
                          : 'default'
                      }
                    />
                  ))}
                </TableCell>
                <TableCell>
                  {user.addresses.length > 0
                    ? `${user.addresses[0].city} (${user.addresses[0].buildingName})`
                    : '주소 없음'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AdminPage;
