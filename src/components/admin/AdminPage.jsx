import React, { useEffect, useState } from 'react';
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
  Button,
  Stack
} from '@mui/material';
import api from '../../api/api';

const AdminPage = () => {
  const [tab, setTab] = useState('users'); // 'users' or 'orders'
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/users', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUsers(data);
      } catch (err) {
        console.error('회원 조회 실패:', err);
      }
    };

    const fetchOrders = async () => {
      try {
        const { data } = await api.get('/admin/orders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setOrders(data);
      } catch (err) {
        console.error('주문 조회 실패:', err);
      }
    };

    fetchUsers();
    fetchOrders();
  }, []);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>관리자 페이지</Typography>

      {/* 탭 버튼 */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant={tab === 'users' ? 'contained' : 'outlined'}
          onClick={() => setTab('users')}
        >
          회원 목록
        </Button>
        <Button
          variant={tab === 'orders' ? 'contained' : 'outlined'}
          onClick={() => setTab('orders')}
        >
          주문 목록
        </Button>
      </Stack>

      {/* 회원 목록 테이블 */}
      {tab === 'users' && (
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
      )}

      {/* 주문 목록 테이블 */}
      {tab === 'orders' && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>주문 ID</strong></TableCell>
                <TableCell><strong>이메일</strong></TableCell>
                <TableCell><strong>주문일</strong></TableCell>
                <TableCell><strong>총 금액</strong></TableCell>
                <TableCell><strong>주문 상태</strong></TableCell>
                <TableCell><strong>대표 상품</strong></TableCell> {/* ✅ 추가 */}
                <TableCell><strong>배송지</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(orders) && orders.map((order) => (
                <TableRow key={order.orderId}>
                  <TableCell>{order.orderId}</TableCell>
                  <TableCell>{order.email}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>{order.totalAmount} 원</TableCell>
                  <TableCell>{order.orderStatus}</TableCell>
                  <TableCell>
                    {order.orderItems.length > 0 && order.orderItems[0].product
                      ? order.orderItems[0].product.productName
                      : '상품 정보 없음'}
                  </TableCell>
                  <TableCell>
                    {order.address
                      ? `${order.address.city} (${order.address.buildingName})`
                      : '주소 없음'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default AdminPage;
