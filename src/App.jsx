import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css';

function App() {
  // Toàn bộ state không thay đổi
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', notes: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState({ amount: '', rate: '' });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({ type: 'trả lãi', amount: '' });

  // Logic đăng nhập và lấy dữ liệu giữ nguyên
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if(session && !selectedCustomer) {
      fetchCustomers();
    }
  }, [selectedCustomer, session]);

  async function fetchCustomers() {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  }

  // --- HÀM MỚI ĐỂ XÓA KHÁCH HÀNG ---
  async function handleDeleteCustomer(customerId, customerName) {
    // Hiển thị hộp thoại xác nhận để tránh nhấn nhầm
    const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customerName}"? \nTất cả các khoản vay và lịch sử giao dịch của người này cũng sẽ bị xóa vĩnh viễn.`);

    if (isConfirmed) {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        alert('Lỗi! Không thể xóa khách hàng.');
        console.error(error);
      } else {
        // Tải lại danh sách khách hàng sau khi xóa thành công
        fetchCustomers();
      }
    }
  }

  // Các hàm logic khác giữ nguyên
  async function fetchCustomerDetails(customerId) { const { data } = await supabase.from('loans').select('*').eq('customer_id', customerId); setLoans(data || []); }
  async function handleSelectCustomer(customer) { setSelectedCustomer(customer); fetchCustomerDetails(customer.id); }
  async function handleSelectLoan(loan) { setSelectedLoan(loan); const { data } = await supabase.from('transactions').select('*').eq('loan_id', loan.id).order('transaction_date'); setTransactions(data || []); }
  async function handleAddCustomer(e) { e.preventDefault(); if (!newCustomer.name) return; await supabase.from('customers').insert([{ ...newCustomer, user_id: session.user.id }]); setNewCustomer({ name: '', phone: '', notes: '' }); fetchCustomers(); }
  async function handleAddLoan(e) { e.preventDefault(); const amount = parseInt(newLoan.amount); const rate = parseFloat(newLoan.rate); if (!amount || !rate) return; const { data: createdLoan } = await supabase.from('loans').insert({ customer_id: selectedCustomer.id, loan_amount: amount, interest_rate: rate }).select().single(); if (createdLoan) { await supabase.from('transactions').insert({ loan_id: createdLoan.id, transaction_type: 'giải ngân', amount: amount, transaction_date: new Date() }); } setNewLoan({ amount: '', rate: '' }); fetchCustomerDetails(selectedCustomer.id); }
  async function handleAddTransaction(e) { e.preventDefault(); const amount = parseInt(newTransaction.amount); if (!amount) return; await supabase.from('transactions').insert({ loan_id: selectedLoan.id, transaction_type: newTransaction.type, amount: amount, transaction_date: new Date() }); handleSelectLoan(selectedLoan); }
  function calculateCurrentPrincipal() { if (!transactions) return 0; return transactions.reduce((acc, tx) => { if (tx.transaction_type === 'giải ngân') return acc + tx.amount; if (tx.transaction_type === 'trả gốc') return acc - tx.amount; return acc; }, 0); }
  async function handleLogout() { await supabase.auth.signOut(); }

  // --- PHẦN GIAO DIỆN ---
  if (loading) return <div className="container"><p>Đang tải...</p></div>;
  if (!session) return (<div className="auth-container"><Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]}/></div>);

  // Màn hình chính
  if (!selectedCustomer) {
    return (
      <div className="container">
        <button className="logout-button" onClick={handleLogout}>Đăng xuất</button>
        <h1>Bảng Công Nợ Khách Hàng</h1>
        <form onSubmit={handleAddCustomer} className="customer-form">{/* Form thêm khách hàng không đổi */}</form>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên khách hàng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  {/* Cập nhật lại ô Hành động */}
                  <td className="action-cell">
                    <button onClick={() => handleSelectCustomer(c)}>Xem Chi Tiết</button>
                    <button className="delete-button" onClick={() => handleDeleteCustomer(c.id, c.name)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  } 
  // Màn hình chi tiết
  else {
    return (
      <div className="container">
        <div>
          <button onClick={() => setSelectedCustomer(null)}>&larr; Quay lại</button>
          <button className="logout-button" onClick={handleLogout}>Đăng xuất</button>
        </div>
        <h2>{selectedCustomer.name}</h2>
        {/* Phần còn lại của giao diện chi tiết không thay đổi */}
      </div>
    );
  }
}

export default App;