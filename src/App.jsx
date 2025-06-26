import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient.js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import './App.css';

const getTodayString = () => new Date().toISOString().slice(0, 10);

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', notes: '' });
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loans, setLoans] = useState([]);
  const [newLoan, setNewLoan] = useState({ amount: '', rate: '', loan_date: getTodayString() });
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({ type: 'trả lãi', amount: '', transaction_date: getTodayString() });

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

  async function fetchCustomerDetails(customerId) {
    const { data } = await supabase.from('loans').select('*').eq('customer_id', customerId).order('created_at', { ascending: false });
    setLoans(data || []);
  }

  async function handleSelectCustomer(customer) { setSelectedCustomer(customer); fetchCustomerDetails(customer.id); }
  async function handleSelectLoan(loan) { setSelectedLoan(loan); const { data } = await supabase.from('transactions').select('*').eq('loan_id', loan.id).order('transaction_date', { ascending: false }); setTransactions(data || []); }
  async function handleAddCustomer(e) { e.preventDefault(); if (!newCustomer.name) return; await supabase.from('customers').insert([{ ...newCustomer, user_id: session.user.id }]); setNewCustomer({ name: '', phone: '', notes: '' }); fetchCustomers(); }
  async function handleDeleteCustomer(customerId, customerName) { const isConfirmed = window.confirm(`Bạn có chắc chắn muốn xóa khách hàng "${customerName}"? \nTất cả các khoản vay và lịch sử giao dịch của người này cũng sẽ bị xóa vĩnh viễn.`); if (isConfirmed) { const { error } = await supabase.from('customers').delete().eq('id', customerId); if (error) { alert('Lỗi! Không thể xóa khách hàng.'); } else { fetchCustomers(); } } }

  async function handleAddLoan(e) {
    e.preventDefault();
    const amount = parseInt(newLoan.amount);
    const rate = parseFloat(newLoan.rate);
    const loanDate = newLoan.loan_date;

    // === LOGIC KIỂM TRA ĐÃ SỬA LẠI ===
    if (isNaN(amount) || amount <= 0) {
      alert('Vui lòng nhập số tiền vay hợp lệ (lớn hơn 0).');
      return;
    }
    // Cho phép lãi suất bằng 0, nhưng không được bỏ trống hoặc là số âm
    if (newLoan.rate === '' || isNaN(rate) || rate < 0) {
      alert('Vui lòng nhập lãi suất hợp lệ (có thể nhập 0).');
      return;
    }
    if (!loanDate) {
      alert('Vui lòng chọn ngày vay.');
      return;
    }
    // === KẾT THÚC PHẦN SỬA ===

    const { data: createdLoan } = await supabase.from('loans').insert({ customer_id: selectedCustomer.id, loan_amount: amount, interest_rate: rate, created_at: loanDate }).select().single();
    if (createdLoan) {
      await supabase.from('transactions').insert({ loan_id: createdLoan.id, transaction_type: 'giải ngân', amount: amount, transaction_date: loanDate });
    }
    setNewLoan({ amount: '', rate: '', loan_date: getTodayString() });
    fetchCustomerDetails(selectedCustomer.id);
  }
  
  async function handleAddTransaction(e) { e.preventDefault(); const amount = parseInt(newTransaction.amount); const transactionDate = newTransaction.transaction_date; if (!amount || !transactionDate) return; await supabase.from('transactions').insert({ loan_id: selectedLoan.id, transaction_type: newTransaction.type, amount: amount, transaction_date: transactionDate }); handleSelectLoan(selectedLoan); setNewTransaction({ type: 'trả lãi', amount: '', transaction_date: getTodayString() }); }
  function calculateCurrentPrincipal() { if (!transactions) return 0; return transactions.reduce((acc, tx) => { if (tx.transaction_type === 'giải ngân') return acc + tx.amount; if (tx.transaction_type === 'trả gốc') return acc - tx.amount; return acc; }, 0); }
  async function handleLogout() { await supabase.auth.signOut(); }

  if (loading) return <div className="container"><p>Đang tải...</p></div>;
  if (!session) return (<div className="auth-container"><h1>Quản lý Công nợ</h1><p>Vui lòng đăng nhập để tiếp tục</p><Auth supabaseClient={supabase} appearance={{ theme: ThemeSupa }} providers={[]}/></div>);

  // Màn hình chính
  if (!selectedCustomer) {
    // ... phần giao diện này không đổi ...
    return (
        <div className="container">
            {/* Nội dung giao diện chính */}
        </div>
    );
  } 
  // Màn hình chi tiết
  else {
    return (
      <div className="container">
        {/* ... code giao diện chi tiết không thay đổi ... */}
        {/* Form thêm khoản vay sẽ hoạt động đúng với lãi suất 0 */}
        <form onSubmit={handleAddLoan} className="customer-form">
          <h3>Thêm khoản vay mới</h3>
          <input type="date" value={newLoan.loan_date} onChange={e => setNewLoan({ ...newLoan, loan_date: e.target.value })}/>
          <input type="number" placeholder="Số tiền vay" value={newLoan.amount} onChange={e => setNewLoan({ ...newLoan, amount: e.target.value })} />
          <input type="number" step="0.1" placeholder="Lãi suất (nhập 0 nếu không có)" value={newLoan.rate} onChange={e => setNewLoan({ ...newLoan, rate: e.target.value })} />
          <button type="submit">Thêm khoản vay</button>
        </form>
        {/* ... code còn lại của giao diện chi tiết ... */}
      </div>
    );
  }
}

export default App;
